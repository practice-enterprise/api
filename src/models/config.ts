import { PresenceStatusData } from 'discord.js';

export interface Config {
  _id: string,
  discord: {
    richpresence: {
      interval: number,
      statusType: number,
      states: [
        {
          status: PresenceStatusData | string,
          activity: {
            name: string,
            type: number
          }
        }
      ]
    }
  }
}
