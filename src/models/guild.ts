import { InfoCommand } from './command';

export interface Guild {
  id: string,
  canvasInstanceID: string,
  courseChannels: {
    CategoryID: string,
    //Record<courseID, channelID), courseID should be number -> parseInt()
    channels: Record<number, string>
  }
  info: InfoCommand[],
  notes: Record<string, string[]>,
  //type(student), channel ID
  roles: Record<string, string>
  modules: Record<string, boolean>
}
