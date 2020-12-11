import { Command } from './command';

export interface Guild {
  _id: string,
  prefix: string,
  commands: Command[],
}
