import Axios from 'axios';
import { User } from '../models/users';
import { allCourses } from '../models/canvas';
import { Collections, db } from './database';
import { DiscordService } from './discord-service';
import { Guild } from '../models/guild';
import { CanvasController } from '../controllers/canvas';
import { WebSocket } from '../app';
import { ReminderService } from './reminder-service';
import { ChannelCreationService } from './channel-creation-service';
import { MessageEmbed } from 'discord.js';
import { FieldValue } from '@google-cloud/firestore';
import { Logger } from '../util/logger';

export class UserService {
  static async clearCanvasToken(user: User): Promise<void> {
    await db.collection(Collections.users).doc(user.id).update({
      'canvas.token': FieldValue.delete()
    })
      .then(() => {
        WebSocket?.sendRoot('sendEmbedDM', {
          target: {
            user: user.discord.id
          },
          content: new MessageEmbed()
            .setTitle('Canvas token has expired')
            .setDescription('Your Canvas token was cleared from our database because it was expired or wrong.\nYou can enter a new one in our oauth website.')
        });
      }).catch((err) => { throw new Error(`Failed to clear user ${user.id}'s canvas token. Error: ${err}`); });
  }

  static async clearDiscordToken(user: User): Promise<void> {
    await db.collection(Collections.users).doc(user.id).update({
      'discord.token': FieldValue.delete()
    }).then(() => {
      WebSocket?.sendRoot('sendEmbedDM', {
        target: {
          user: user.discord.id
        },
        content: new MessageEmbed()
          .setTitle('Discord token has expired')
          .setDescription('Your Discord token was cleared from our database because it was expired or wrong.\nYou can log back in on the website .')
      });
    }).catch((err) => { throw new Error(`Failed to clear user ${user.id}'s canvas token. Error: ${err}`); });
  }

  static async getForCourse(courseID: number, canvasInstanceID?: string): Promise<User | undefined> {
    let users: User[];
    if (canvasInstanceID != null) {
      users = (await db.collection(Collections.users)
        .where('courses', 'array-contains', courseID)
        .where('canvas.instanceID', '==', canvasInstanceID)
        .where('canvas.token', '!=', '')
        .get()).docs.map((d) => d.data()) as User[];
    }
    else {
      users = (await db.collection(Collections.users)
        .where('courses', 'array-contains', courseID)
        .where('canvas.token', '!=', '')
        .get()).docs.map((d) => d.data()) as User[];
    }

    /*There are no corresponding users for this courseID */
    if (users.length < 1) {
      return undefined;
    }

    /*Random index for balancing user tokens */
    const index = Math.floor(Math.random() * users.length);
    return users[index] as User;
  }

  /**Updates all course IDs for a user.*/
  static async updateUserCourses(user: User): Promise<void> {
    if (user.canvas.token == null || user.canvas.instanceID == null) {
      throw new Error(`User ${user.id} no canvas token or canvas instanceID set.`);
    }
    const canvas = (await db.collection(Collections.canvas).doc(user.canvas.instanceID).get()).data();
    if (canvas == null) {
      throw new Error(`Could not retrieve canvas instance of ${user.id}`);
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
    user.courses = courses.map((c) => parseInt(c._id));

    await db.collection(Collections.users).doc(user.id).set(user)
      .catch((err) => { throw new Error(`Failed to set ${user.id} courses. Error: ${err}`); });
  }

  static async updateRoles(user: User, validGuildConfigs: Guild[]): Promise<void> {
    if (user.discord.token == undefined) {
      throw new Error(`${user.discord.id} no discord token`);
    }

    const courses = await CanvasController.getCourses(user.discord.id);

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
      if (guild.modules['roleSync'] === false) {
        continue;
      }
      WebSocket?.sendForGuild(guild.id, 'updateRoles', {
        'guildID': guild.id,
        'userID': user.discord.id,
        'roleTypes': validRoleTypes,
        'configRoles': guild.roles
      });
    }
  }

  static initForUsers(interval: number): NodeJS.Timeout {
    return setInterval(async () => {
      const users = (await db.collection(Collections.users).get()).docs.map(d => d.data()) as User[];
      for (const user of users) {
        if (user.courses && user.courses.length > 0) {
          ReminderService.sendAssignment(user, 2)
            .catch(err => console.error(err));
        }

        if (user.discord.token) {
          this.updateUserRolesChannels(user)
            .catch(err => console.error(err));
        }
      }
    }, interval);
  }

  static async updateUserRolesChannels(user: User): Promise<void> {
    if (!user.discord.token) {
      throw new Error(`no discord token for: ${user.discord.id}`);
    }

    const configs = (await db.collection(Collections.guilds).get()).docs.map((d) => d.data()) as Guild[];
    const tokens = await DiscordService.tokensFromRefresh(user.discord.token, user.id).catch((err) => {this.clearDiscordToken(user); console.log(err);})
    if(!tokens) return;
    const guilds = await DiscordService.getGuilds(tokens.access_token).catch(() => this.clearDiscordToken(user));
    if (!guilds) {
      //throw new Error(`could not get guilds for user: ${user.discord.id} removed`);
      Logger.error(`userService line 164: Could not get guilds from user ${user.discord.id}, removed token from db`);
      return;
    }

    const validGuildConfigs = configs.filter(c => guilds.map((g) => g.id).includes(c.id));
    this.updateRoles(user, validGuildConfigs)
      .catch(err => console.log(err));
    for (const config of validGuildConfigs) {
      ChannelCreationService.CreateChannels(user.discord.id, config)
        .catch(err => console.log(err));
    }
    return;
  }

  static async getUser(discordID: string): Promise<User> {
    const snap = (await db.collection(Collections.users).where('discord.id', '==', discordID).get());
    if (snap.empty) {
      throw new Error(`no user with id ${discordID}`);
    }
    return snap.docs[0].data() as User;
  }
}


