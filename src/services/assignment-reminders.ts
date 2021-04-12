import { CanvasController } from "../controllers/canvas";
import { User } from "../models/users";
import { WebSocket } from "../app";
import { Collections, db } from "./database";


export class AssignmentReminderService {
  static async sendReminders(user: User, warningDays: number) {
    const assignments = await CanvasController.getCalenderAssignments(user);
    if (assignments == undefined) { throw new Error(`could not assignments for ${user.discord.id}`) }
    //var currentDate = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
    //
    let i = assignments.findIndex((a) => a.id == user.canvas.lastAssignment) + 1;
    if (i >= assignments.length) { console.log(`assignments for ${user.discord.id} is up to date`); return; }
    //post only when the sending of dm has been successfull API request?
    if (new Date(assignments[i].end_at).getTime() <= (new Date(Date.now() + warningDays*24 * 60 * 60 *1000)).getTime()) {
      WebSocket?.sendRoot('assignmentDM', { userID: user.discord.id, title: assignments[i].title, description: assignments[i].description });
      user.canvas.lastAssignment = assignments[i].id;
      //await db.collection(Collections.users).doc(user.id).set(user);
    }
  }
}
