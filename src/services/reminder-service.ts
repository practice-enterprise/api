import { isGuildTarget, Reminder } from '../models/reminder';
import { Collections, db } from './database';
import { WebSocket } from '../app';
import { User } from '../models/users';
import { CanvasController } from '../controllers/canvas';
import TurndownService from 'turndown';
import { DateTime } from 'luxon';
import { CalenderAssignment } from '../models/canvas';
import { MessageEmbed } from 'discord.js';

const defaultZone = 'Europe/Brussels';

export class ReminderService {
  static async initSendReminder(interval: number): Promise<NodeJS.Timeout> {
    return setInterval(async () => {
      const reminders: Reminder[] = await db.collection(Collections.reminders).get()
        .then((snapshot) => (snapshot.docs.map((d) => { const data = d.data(); data.id = d.id; return data as Reminder; })));
      for (const reminder of reminders) {
        const users = await db.collection(Collections.users)
          .where('discord.id', '==', reminder.target.user).get();
        if (users.empty) {
          continue;
        }

        const time = DateTime.fromISO(reminder.date, { zone: 'utc' })
          .setZone(users.docs[0].data().timeZone || defaultZone, { keepLocalTime: true });
        if (time.diffNow().valueOf() < 0) {
          if (isGuildTarget(reminder.target)) {
            WebSocket?.sendForGuild(reminder.target.guild, 'reminderGuild', reminder);
          } else {
            WebSocket?.sendRoot('reminderUser', reminder);
          }
        }
      }
    }, interval);
  }

  static async sendAssignment(user: User, warningDays: number): Promise<void> {
    const assignments = await CanvasController.getCalenderAssignments(user, warningDays);
    if (assignments == undefined) {
      throw new Error(`could not assignments for ${user.discord.id}`);
    }
    const ts = new TurndownService();
    const index = assignments.findIndex((a) => a.id == user.canvas.lastAssignment) + 1;
    if (index >= assignments.length) {
      console.log(`assignments for ${user.discord.id} is up to date`);
      return;
    }
    const assignment = assignments[index];

    if (assignment.lock_info == null) {
      WebSocket?.sendRoot('assignmentDM', {
        id: user.id,
        assignmentID: assignment.id,
        userDiscordID: user.discord.id,
        message: await this.buildAssignmentEmbed(assignment)
      });

    } else {
      db.collection(Collections.users).doc(user.id)
        .update({ 'canvas.lastAssignment': assignment.id });
    }
    return;
  }

  static async buildAssignmentEmbed(assignment: CalenderAssignment): Promise<MessageEmbed> {
    const ts = new TurndownService();

    const dueTime = new Date(assignment.assignment.due_at);
    const dueTimeString = DateTime.fromJSDate(dueTime).toFormat('hh:mm • dd/MM/yyyy');

    return new MessageEmbed({
      color: '#E63F30',
      title: assignment.title,
      url: assignment.html_url,
      author: {
        name: assignment.context_name
      },
      description: ts.turndown(assignment.description),
      footer: {
        text: `Due to: ${dueTimeString}`
      }
    });
  }
}
