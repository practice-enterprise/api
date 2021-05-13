import Axios from 'axios';
import { CanvasAnnouncement, CanvasInstance } from '../models/canvas';
import TurndownService from 'turndown';
import { CanvasController } from '../controllers/canvas';
import { MessageEmbed } from 'discord.js';
import { WebSocket } from '../app';
import { Collections, db } from './database';
import { UserService } from './user-service';
import { Guild } from '../models/guild';
import { User } from '../models/users';
import { DateTime } from 'luxon';

export class AnnouncementService {
  static async getAnnouncements(canvasInstanceID: string, courseID: number, user: User): Promise<CanvasAnnouncement[] | undefined> {
    if (user.canvas.token === undefined) {
      // There is no token
      console.error('No token defined');
      return undefined;
    }

    const canvas = (await db.collection(Collections.canvas).doc(canvasInstanceID).get()).data();
    if (!canvas) {
      return undefined;
    }

    return Axios.request<CanvasAnnouncement[]>({
      headers: {
        Authorization: `Bearer ${user.canvas.token}`
      },
      params: {
        only_announcements: 'true'
      },

      method: 'GET',
      baseURL: canvas.endpoint,
      url: `/api/v1/courses/${courseID}/discussion_topics`
    }).then((d) => d.data)
      .catch(() => undefined);
    //TODO: handle refresh/ 401/403
  }

  static async buildAnnouncementEmbed(announcement: CanvasAnnouncement, courseID: number, discordUserID: string): Promise<MessageEmbed> {
    const ts = new TurndownService();

    const courses = await CanvasController.getCourses(discordUserID);
    if (courses === undefined) {
      throw new Error('Courses not defined. Likely invalid or undefined token from users.');
    }
    const course = courses.find(c => c.id === courseID);

    const postedTime = new Date(announcement.posted_at);
    const postTimeString = DateTime.fromJSDate(postedTime).toFormat('hh:mm • dd/MM/yyyy');

    const embed = new MessageEmbed({
      color: '#E63F30',
      title: announcement.title,
      url: announcement.html_url,
      author: {
        name: course?.course_code + ' - ' + announcement.author.display_name
      },
      description: ts.turndown(announcement.message),
      footer: {
        text: postTimeString
      }
    });
    return embed;
  }

  // FIX: API checks before bot can receive events -> lastAnnounce is set to something that isn't posted
  // TODO: check rate limits. Currently 1 minute interval. We want this as low as is allowed.
  static async initAnnouncementJob(interval: number): Promise<NodeJS.Timeout> {
    return setInterval(async () => {
      if (WebSocket == null) {
        throw Error('WebSocket is undefined (won\'t be able to send announcements), skipping announcement check.');
      }

      const canvasInstances = (await db.collection(Collections.canvas).get()).docs.map((d) => d.data()) as CanvasInstance[];
      for (const canvas of canvasInstances) {
        if (canvas.id === undefined && canvas.endpoint === undefined && canvas === undefined) {
          continue;
        }
        // All guilds related to this canvas instance
        const allGuilds = (await db.collection(Collections.guilds).where('canvasInstanceID', '==', canvas.id).get()).docs.map((d) => d.data()) as Guild[];
        const guilds: Guild[] = [];
        for (const guild of allGuilds) {
          if (guild.modules['announcements']) {
            guilds.push(guild);
          }
        }
        // Get all course IDs from all the different guilds
        const AllCourseIDs = guilds.map(g => Object.keys(g.courseChannels.channels).map(k => Number(k))).flat();
        // Remove dupes
        const courseIDs = Array.from(new Set(AllCourseIDs));

        if (canvas.lastAnnounce == null) {
          canvas.lastAnnounce = {};
        }

        for (const courseID of courseIDs) {
          const user = await UserService.getForCourse(courseID, canvas.id);
          // FIX?: The random user we took may not have a token. This shouldn't be the case since otherwise the user wouldn't have courses assinged in the first place.
          if (user === undefined) {
            console.error('No user was found for subject ', courseID);
            continue;
          }

          const announcements = await this.getAnnouncements(canvas.id, courseID, user);

          if (announcements === undefined) {
            throw new Error('Announcements undefined. Likely invalid or undefined token from users.');
          }
          if (announcements.length === 0) {
            continue;
          }

          // Checking for new announcements
          const lastAnnounceID = canvas.lastAnnounce[courseID];
          for (const guild of guilds) {
            const channelID = guild.courseChannels.channels[courseID];

            // No channel is set for a course.
            if (channelID.length === 0 || channelID.length == undefined) {
              console.error(`No channelID was set for courseID ${courseID} in guild ${guild.id}`);
              continue;
            }
            // Last announcement ID is undefined
            if (canvas.lastAnnounce[courseID] == undefined) {
              // No lastAnnounceID set. Posting last announcement and setting ID.
              const embed = await this.buildAnnouncementEmbed(announcements[0], courseID, user.discord.id);
              WebSocket.sendForGuild(guild.id, 'announcement', {
                channelID: channelID,
                embed: embed
              });
              continue;
            }
            const index = announcements.findIndex(a => a.id === lastAnnounceID);

            /* Index == 0 -> Already last announcement
  
              FIX: index may be -1, this might for example happen when an announcement has been deleted.
              Another more unlikely example is that more than 10 announcements were posted in between the last interval.
            */
            // Posting new announcements
            if (index !== 0 && index !== -1) {
              for (let i = index - 1; i >= 0; i--) {
                const embed = await this.buildAnnouncementEmbed(announcements[i], courseID, user.discord.id);

                // Send 1 of new announcement(s)
                WebSocket.sendForGuild(guild.id, 'announcement', {
                  channelID: channelID,
                  embed: embed
                });
              }
            }
          }
          // Update last announce ids
          canvas.lastAnnounce[courseID] = announcements[0].id;
        }
        db.collection(Collections.canvas).doc(canvas.id).set(canvas)
          .catch((err) => console.error('Couldn\'t update lastAnnounce ID(s). Err: ' + err));
      }
    }, interval);
  }

}
