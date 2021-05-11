import { CanvasController } from '../controllers/canvas';
import { Guild } from '../models/guild';
import { WebSocket } from '../app';


export class ChannelCreationService {
  static async CreateChannels(discordID: string, guildConfig: Guild): Promise<void> {
    const courses = await CanvasController.getCourses(discordID);
    const courseIdName: Record<string, string> = {};
    courses.map((course) => courseIdName[course.id] = course.name);

    WebSocket?.sendForGuild(guildConfig.id, 'createChannels', {
      'guildID': guildConfig.id,
      'courseChannels': guildConfig.courseChannels,
      'courses': courseIdName
    });
  }
}
