import Axios from "axios";
import { CanvasAnnouncement, CanvasInstance } from "../models/canvas";
import TurndownService from 'turndown';
import { CanvasController } from "../controllers/canvas";
import { MessageEmbed } from "discord.js";
import { stringify } from "querystring";
import { WebSocket } from "../app";
import { Collections, db } from "./database";
import { UserService } from "./user-service";
import { Guild } from "../models/guild";

export class AnnouncementService {
  static async getAnnouncements(canvasInstanceID: string, courseID: number): Promise<CanvasAnnouncement[] | undefined> {
    const user = await UserService.getForCourse(courseID);
    if (user === undefined) {
      console.error('No user found for this course.');
      return undefined;
    }

    if (user.canvas.token === undefined) {
      // There is no token
      console.error('No token defined')
      return undefined;
    }
    const canvas = (await db.collection(Collections.canvas).doc(canvasInstanceID).get()).data();
    if (!canvas) {
      return undefined;
    }
    /*
      // # This call has a problem where it will only show the last 14 days or since a start date 
      // # (which presumely) can't be before the course creation date.
      // # Discussion topics never show announcements unless you for some reason ask to only show announcements.

    return Axios.request<CanvasAnnouncement[]>({
      headers: {
        Authorization: `Bearer ${user.canvas.token}`
      },
      params: {
        context_codes: ['course_' + req.params.courseID],
        start_date: '2021-01-01'
      },

      method: 'GET',
      baseURL: canvas.endpoint,
      url: '/api/v1/announcements'
    }).then((d) => res.send(d.data))
      .catch((err) => res.sendStatus(err.status));
    */
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

  static async buildAnnouncementEmbed(announcement: CanvasAnnouncement, courseID: number, canvasInstanceID: string, discordUserID: string): Promise<MessageEmbed> {
    const ts = new TurndownService();

    const courses = await CanvasController.getCourses(discordUserID, canvasInstanceID);
    if (courses === undefined) {
      throw new Error('Courses not defined. Likely invalid or undefined token from users.');
    }
    const course = courses.find(c => c.id === courseID);

    const postedTime = new Date(announcement.posted_at);
    const postTimeString = postedTime.getHours() + ':' + (postedTime.getMinutes() < 10 ? '0' + postedTime.getMinutes() : postedTime.getMinutes()) + ' • ' + postedTime.getDate() + '/' + (postedTime.getMonth() + 1) + '/' + postedTime.getFullYear();

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

  // ## Checking announcements for changes
  // FIX: API checks before bot can receive events -> lastAnnounce is set to something that isn't posted
  // TODO: check rate limits. Currently 1 minute interval. We want this as low as is allowed.
  static initAnnouncementJob(interval: number): NodeJS.Timeout {
    return setInterval(async () => {
      const guilds = (await db.collection(Collections.guilds).get()).docs.map((d) => d.data()) as Guild[];
      let AllCourseIDs: number[] = [];
      // Get all course IDs from all the different guilds
      for (const guild of guilds) {
        for (const c in guild.courseChannels.channels) {
          AllCourseIDs.push(Number(c));
        }
      }
      // Remove dupes
      const courseIDs = Array.from(new Set(AllCourseIDs));

      const canvasInstanceID = guilds[0].canvasInstanceID;
      const canvas = (await db.collection(Collections.canvas).doc(canvasInstanceID).get()).data() as CanvasInstance;
      if (canvas === undefined) {
        console.error(`CanvasInstance with id ${canvasInstanceID} is undefined.`);
        return;
      }

      console.log('Canvas domain: ', canvas.endpoint);

      if (canvas.lastAnnounce === undefined || (stringify(canvas.lastAnnounce) === stringify({}))) {
        canvas.lastAnnounce = {};
      }

      for (const courseID of courseIDs) {
        const user = await UserService.getForCourse(courseID);
        // FIX: The random user we took may not have a token. This shouldn't be the case since otherwise the user wouldn't have courses assinged in the first place.
        if (user === undefined) {
          console.error('No user was found for subject ', courseID);
          continue;
        }

        const announcements = await this.getAnnouncements(canvasInstanceID, courseID);
        console.log('Checking announcements for courseID', courseID);
        if (announcements === undefined) {
          throw new Error('Announcements undefined. Likely invalid or undefined token from users.');
        }
        if (announcements.length === 0) {
          console.log('No announcements for this subject');
          continue;
        }

        console.log('courseID:', courseID);

        // Posting announcements for courses in 
        const lastAnnounceID = canvas.lastAnnounce[courseID]
        for (const guild of guilds) {
          const channelID = guild.courseChannels.channels[courseID];

          // No channel is set for a course.
          if (channelID.length === 0 || channelID.length === undefined) {
            console.error(`No channelID was set for courseID ${courseID} in guild ${guild.id}`);
            continue;
          }

          // Last announcement ID is undefined
          if (canvas.lastAnnounce[courseID] === undefined) {
            console.log('No lastAnnounceID set. Posting last announcement and setting ID.');

            const embed = await this.buildAnnouncementEmbed(announcements[0], courseID, canvasInstanceID, user.discord.id);

            // Send last announcement
            const data = {
              channelID: channelID,
              embed: embed
            }
            WebSocket?.sendForGuild(guild.id, 'announcement', data);

            continue;
          }

          
          const index = announcements.findIndex(a => a.id === lastAnnounceID);

          if (index === 0) {
            console.log('Already last announcement.');
          }
          else if (index == -1) {
            /* FIX: index may be -1, this might for example happen when an announcement has been deleted.
            Another more unlikely example is that more than 10 announcements were posted in between the last interval */
          }
          else {
            console.log('New announcement(s)!');

            for (let i = index - 1; i >= 0; i--) {
              console.log('Posting: ' + announcements[i].title);

              const embed = await this.buildAnnouncementEmbed(announcements[i], courseID, canvasInstanceID, user.discord.id);

              // Send 1 of new announcement(s)
              const data = {
                channelID: channelID,
                embed: embed
              }
              WebSocket?.sendForGuild(guild.id, 'announcement', data);
            }
          }
        }
        // Update last announce ids
        canvas.lastAnnounce[courseID] = announcements[0].id;
      }
      db.collection(Collections.canvas).doc(canvas.id).set(canvas)
        .catch((err) => console.error('Couldn\'t update lastAnnounce ID(s). Err: ' + err));
    }, interval);
  }

}
