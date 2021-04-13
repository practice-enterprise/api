import { CanvasController } from '../controllers/canvas';
import { Guild } from '../models/guild';
import { Collections, db } from "./database";
import { WebSocket } from "../app";


export class ChannelCreationService {
  static async CreateChannels(discordID: string, guildID: string): Promise<void> {
    /*find user in db
    get user guild config
    get courses of user from Guild*/
    const config = (await db.collection(Collections.guilds).doc(guildID).get()).data() as Guild | undefined;
    if( config == undefined){
      throw new Error('no guild config found');
    }

    const courses = await CanvasController.getCourses(discordID, config.canvasInstanceID);
    if(courses == undefined){ 
      throw new Error('no courses found');
    }
    let courseIDName: Record<string, string> = {};
    courses.map((course) => courseIDName[course.id] = course.name);

    WebSocket?.sendForGuild(guildID, 'createChannels', {'guildID':guildID, 'courseChannels': config.courseChannels, 'courses': courseIDName});
  }
}
