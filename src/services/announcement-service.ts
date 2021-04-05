import Axios from "axios";
import { CanvasAnnouncement } from "../models/canvas";
import TurndownService from 'turndown';
import { CanvasController } from "../controllers/canvas";
import { MessageEmbed } from "discord.js";
import { stringify } from "querystring";
import { UserController } from "../controllers/users";
import { WebSocket } from "../app";
import { Collections, db } from "./database";

export class AnnouncementService {
  static async getAnnouncements(canvasInstanceID: string, courseID: string): Promise<CanvasAnnouncement[] | undefined> {
    const user = await UserController.getForCourse(courseID);
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

  static async buildAnnouncementEmbed(announcement: CanvasAnnouncement, courseID: string, canvasInstanceID: string, discordUserID: string): Promise<MessageEmbed> {
    const ts = new TurndownService();

    const courses = await CanvasController.getCourses(discordUserID, canvasInstanceID);
    if (courses === undefined) {
      throw new Error('Courses not defined. Likely invalid or undefined token from users.');
    }
    const course = courses.find(c => c.id === parseInt(courseID));

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
  // guildID: string, CanvasInstanceID: string
  static initAnnouncementJob(): NodeJS.Timeout {
    return setInterval(async () => {
      const guilds = (await db.collection(Collections.guilds).get()).docs.map((d) => d.data());
      // FIX: This for loop can prob be done better or differently.
      for (let i = 0; i < guilds.length; i++) {
        const guildID = guilds[i]?._id;
        const canvasInstanceID = guilds[i]?.canvasInstanceID;

        if (guildID === undefined || canvasInstanceID === undefined) {
          continue;
        }
        console.log('getting canvas and config');
        const canvas = (await db.collection(Collections.canvas).doc(canvasInstanceID).get()).data();
        /*change => is just guild in loop */
        const guildConfig = (await db.collection(Collections.guilds).doc(guildID).get()).data();
        if (guildConfig === undefined) {
          console.error(`Guildconfig with id ${guildID} is undefined.`);
          return;
        }
        if (canvas === undefined) {
          console.error(`CanvasInstance with id ${canvasInstanceID} is undefined.`);
          return;
        }
        console.log('Canvas domain: ', canvas.endpoint);

        // Canvas Instance for announcements is undefined or empty
        // TODO: there is probably a better way of checking if it's empty
        if (canvas.lastAnnounce === undefined || (stringify(canvas.lastAnnounce) === stringify({}))) {
          canvas.lastAnnounce = {};
        }

        // TODO: Delay for ratelimit
        for (const courseID in guildConfig.courseChannels.channels) {
          const user = await UserController.getForCourse(courseID);

          if (user === undefined) {
            console.error('No user was found for subject ', courseID);
            continue;
          }

          // FIX: The random user we took may not have a token. This shouldn't be the case since otherwise the user wouldn't have courses assinged in the first place.

          const announcements = await this.getAnnouncements(canvasInstanceID, courseID);
          if (announcements === undefined) {
            throw new Error('Announcements undefined. Likely invalid or undefined token from users.');
          }

          console.log('courseID:', courseID);

          // There are no announcements
          if (announcements.length === 0) {
            console.log('No announcements for this subject');
            continue;
          }

          // No channel is set for a course.
          if (guildConfig.courseChannels.channels[courseID].length === 0 || guildConfig.courseChannels.channels[courseID].length === undefined) {
            console.error('No channelID was set for this course in the config!');
            continue;
          }

          // Last announcement ID is undefined
          if (canvas.lastAnnounce[courseID] === undefined) {
            console.log('No lastAnnounceID set. Posting last announcement and setting ID.');

            const embed = await this.buildAnnouncementEmbed(announcements[0], courseID, canvasInstanceID, user.discord.id);

            // Send announcement
            const data = {
              channelID: guildConfig.courseChannels.channels[courseID],
              embed: embed
            }
            WebSocket?.sendForGuild(guildID, 'announcement', data);

            canvas.lastAnnounce[courseID] = announcements[0].id;
            continue;
          }

          console.log('Checking announcements for courseID', courseID);

          const lastAnnounceID = canvas.lastAnnounce[courseID];
          const index = announcements.findIndex(a => a.id === lastAnnounceID);

          if (index === 0) {
            console.log('Already last announcement.');
          }
          else {
            console.log('New announcement(s)!');

            for (let i = index - 1; i >= 0; i--) {
              console.log('Posting: ' + announcements[i].title);

              const embed = await this.buildAnnouncementEmbed(announcements[i], courseID, canvasInstanceID, user.discord.id);

              // Send 1 new announcement
              const data = {
                channelID: guildConfig.courseChannels.channels[courseID],
                embed: embed
              }
              WebSocket?.sendForGuild(guildID, 'announcement', data);
            }

            // Update the lastAnnounceID
            canvas.lastAnnounce[courseID] = announcements[0].id;
          }
        }
        db.collection(Collections.canvas).doc(canvas.id).set(canvas)
          .catch((err) => console.error('Couldn\'t update lastAnnounce ID(s). Err: ' + err));
      }
    }, 60000);
  }

}
