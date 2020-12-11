import { MessageEmbedOptions } from 'discord.js';

export interface Command {
  name: string,
  aliases: string[],
  description: string;
  response: string | MessageEmbedOptions
}
