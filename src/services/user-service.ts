import Axios from 'axios';
import { User } from "../models/users";
import { allCourses } from "../models/canvas";
import { Collections, db } from "./database";
import { DiscordService } from './discord-service';
import { Guild } from '../models/guild';
import { CanvasController } from '../controllers/canvas';
import { UserGuild } from '../models/discord';

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
  static async updateUserCourses(user: User, canvasInstanceID: string): Promise<boolean> {
    if (user.canvas.token === undefined) {
      return false
    }
    const canvas = (await db.collection(Collections.canvas).doc(canvasInstanceID).get()).data();
    if (canvas === undefined) {
      return false
    }
    console.log('CANVAS: ', await canvas);
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

    return db.collection(Collections.users).doc(user.id).set(user)
      .then(() => true)
      .catch((err) => {
        console.error('Failed to insert user with updated courses in db. Err: ', err);
        return false;
      });
  }

  static async updateRoles(user: User) {
    const configs = (await db.collection(Collections.guilds).get()).docs.map((d) => d.data()) as Guild[]; 
    const guilds = await DiscordService.getGuilds(user.discord.id);

    let validGuildConfigs: Guild[] = []
    if (guilds) {
      validGuildConfigs = configs.filter(c => guilds.map((g) => g.id).includes(c.id));
    }

    const courses = await CanvasController.getCourses(user.discord.id, validGuildConfigs[0].canvasInstanceID);
    if (courses === undefined) {
      console.log('Could not retrieve courses for user', user.discord.id);
      return undefined;
    }
  }
}
