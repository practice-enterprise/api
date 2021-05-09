import { Command } from './command';

export interface Guild {
  id: string,
  prefix: string,
  canvasInstanceID: string,
  courseChannels: {
    CategoryID: string,
    //Record<courseID, channelID), courseID should be number -> parseInt()
    channels: Record<number, string>
  }
  info: Command[],
  commands: Command[],
  notes: Record<string, string[]>
  //type(student), channel ID
  roles: Record<string, string>
  modules: Record<string, boolean>
}
