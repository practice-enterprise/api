import { CanvasController } from '../controllers/canvas';
import { Guild } from '../models/guild';
import { Collections, db } from "./database";
import { WebSocket } from "../app";


export class ChannelCreationService {
  static async CreateChannels(discordID: string, guildID: string) {
    /*find user in db
    get user guild config
    get courses of user from Guild*/
    const config = (await db.collection(Collections.guilds).doc(guildID).get()).data() as Guild | undefined;
    if( config == undefined){return false; }
    const courses = (await CanvasController.getCourses(discordID, config.canvasInstanceID))?.map((course)=> (course.id).toString());
    if (courses == undefined) { return false; }
    
    WebSocket?.sendForGuild(guildID, 'createChannels', {'guildID':guildID, 'courseChannels': config.courseChannels, 'courses': courses});
    return true;
  }
}
