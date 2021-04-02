import { Command } from './command';

export interface Guild {
  id: string,
  prefix: string,
  commands: Command[],
}
