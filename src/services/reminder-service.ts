import { isUserTarget, Reminder } from "../models/reminder";
import { Collections, db } from "./database"
import { WebSocket } from "../app";

export class ReminderService {
  static async initSendReminder(interval: number): Promise<NodeJS.Timeout> {
    return setInterval(async () =>{
   
    const reminders: Reminder[] = await db.collection(Collections.reminders).get().then((snapshot) => (snapshot.docs.map((d) => { const data = d.data(); data.id = d.id; return data as Reminder })));
    for (const reminder of reminders) {
      const time = new Date(reminder.date);
      if (time.getTime() < Date.now()){
        if(isUserTarget(reminder.target)){
          WebSocket?.sendRoot('reminderUser', reminder)
        }else{
          WebSocket?.sendForGuild(reminder.target.guild, 'reminderGuild', reminder)
        }
      }
    }
  }, interval)
}
}
