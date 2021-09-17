import { ApplicationCommandOptionData, MessageEmbedOptions } from 'discord.js';

export interface InfoCommand {
  name: string,
  category: string,
  description: string;
  options?: ApplicationCommandOptionData[];
  response: /*Response*/ |MessageEmbedOptions | string;
}
