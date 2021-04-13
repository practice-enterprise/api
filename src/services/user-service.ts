import Axios from 'axios';
import { User } from "../models/users";
import { allCourses } from "../models/canvas";
import { Collections, db } from "./database";
import { DiscordService } from './discord-service';
import { Guild } from '../models/guild';
import { CanvasController } from '../controllers/canvas';
import { WebSocket } from "../app";

export class UserService {
  static async getForCourse(courseID: number, canvasInstanceID?: string): Promise<User | undefined> {
    let users: User[];
    if (canvasInstanceID !== undefined) {
      users = (await db.collection(Collections.users).where('courses', 'array-contains', courseID).where('canvas.instanceID', '==', canvasInstanceID).get()).docs.map((d) => d.data()) as User[];
    }
    else {
      users = (await db.collection(Collections.users).where('courses', 'array-contains', courseID).get()).docs.map((d) => d.data()) as User[];
    }

    /*There are no corresponding users for this courseID */
    if (users.length < 1) {
      return undefined;
    }

    /*Random index for balancing user tokens */
    const index = Math.floor(Math.random() * users.length)
    return users[index] as User;
  }

  /**Updates all course IDs for a user. Returns true if succesful */
  static async updateUserCourses(user: User, canvasInstanceID: string): Promise<void> {
    if (user.canvas.token === undefined) { throw new Error(`${user.id} no canvas token`) }
    const canvas = (await db.collection(Collections.canvas).doc(canvasInstanceID).get()).data();
    if (canvas === undefined) {
      throw new Error(`could not retrieve courses of ${user.id}`);
    }
    const courses = await Axios.request<allCourses>({
      headers: {
        Authorization: `Bearer ${user.canvas.token}`
      },
      params: {
        query: `
          query MyQuery {
            allCourses {
              _id
            }
          }
        `
      },
      method: 'POST',
      baseURL: canvas.endpoint,
      url: '/api/graphql'
    }).then((d) => {
      return d.data.data.allCourses;
    });
    // TODO: check refresh tokens etc
    user.courses = courses.map((c) => c._id);

    await db.collection(Collections.users).doc(user.id).set(user)
      .catch((err) => { throw new Error(`failed to set ${user.id} courses. error: ${err}`); });
  }

  static async updateRoles(user: User): Promise<void> {
    if (user.discord.token == undefined) { throw new Error(`${user.discord.id} no discord token`) }

    const configs = (await db.collection(Collections.guilds).get()).docs.map((d) => d.data()) as Guild[];
    const guilds = await DiscordService.getGuilds(user.discord.token);
    if (!guilds) { throw new Error(`could not get guilds for user: ${user.discord.id}`); }

    const validGuildConfigs = configs.filter(c => guilds.map((g) => g.id).includes(c.id));
    const courses = await CanvasController.getCourses(user.discord.id, validGuildConfigs[0].canvasInstanceID);
    if (courses === undefined) { throw new Error(`Could not retrieve courses for ${user.discord.id}`); }

    const validRoleTypes: string[] = [];
    for (const course of courses) {
      if (course.enrollments) {
        for (const enrollment of course.enrollments) {
          if (!validRoleTypes.includes(enrollment.type)) {
            validRoleTypes.push(enrollment.type);
          }
        }
      }
    }

    for (const guild of validGuildConfigs) {
      WebSocket?.sendForGuild(guild.id, 'updateRoles', { 'guildID': guild.id, 'userID': user.discord.id, 'roleTypes': validRoleTypes, 'configRoles': guild.roles });
    }
  }
}

