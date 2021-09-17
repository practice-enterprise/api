import { CanvasController } from '../controllers/canvas';
import { Guild } from '../models/guild';
import { WebSocket } from '../app';


export class ChannelCreationService {
  static async CreateChannels(discordID: string, guildConfig: Guild): Promise<void> {
    const courses = await CanvasController.getCourses(discordID);
    const courseIDName: Record<string, string> = {};
    courses.map((course) => courseIDName[course.id] = course.course_code);
    if (!WebSocket) {
      throw new Error('websocket undefined');
    }
    WebSocket?.sendForGuild(guildConfig.id, 'createChannels', {
      'guildID': guildConfig.id,
      'courseChannels': guildConfig.courseChannels,
      'courses': courseIDName
    });
  }
}
