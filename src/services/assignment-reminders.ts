import { CanvasController } from "../controllers/canvas";
import { User } from "../models/users";
import { WebSocket } from "../app";

export class AssignmentReminderService {
  static async sendReminders(user: User, warningDays: number) {
    const assignments = await CanvasController.getCalenderAssignments(user); //suddenly undefined
    if (assignments == undefined) { 
      throw new Error(`could not assignments for ${user.discord.id}`) 
    }

    let i = assignments.findIndex((a) => a.id == user.canvas.lastAssignment) + 1;
    if (i >= assignments.length) { 
      console.log(`assignments for ${user.discord.id} is up to date`); 
      return; 
    }
    //reminds warningDays amount of days ahead 2 would mean 2 days before you have to hand in you get a notification
    if (new Date(assignments[i].end_at).getTime() <= (new Date(Date.now() + warningDays*24 * 60 * 60 *1000)).getTime()) {
      WebSocket?.sendRoot('assignmentDM', {
        id: user.id, 
        assignmentID: assignments[i].id,
        userDiscordID: user.discord.id,
        message: {//messageEmbedOptions
          title:assignments[i].title,
          description:assignments[i].description
        }
      });
    } 
  }
}
