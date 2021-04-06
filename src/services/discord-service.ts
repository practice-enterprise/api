import axios from "axios";
import { UserGuild } from "../models/discord";


export class DiscordService {

  static async getGuilds(token: string) {
    const guilds = await axios.request<UserGuild[]>({
      headers: {
        Authorization: token
      },
      method: 'GET',
      baseURL: 'https://discord.com/api/v8',
      url: '/users/@me/guilds'
    }).then((res) => res != null ? res.data : undefined).catch((err) => { console.error(err) });
  }
}
