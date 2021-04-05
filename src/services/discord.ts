import axios from "axios";

export interface UserGuild {
  id: string,
  name: string,
  icon: string,
  owner: boolean,
  permissions: string,
  features: string[]
}

export class DiscordService {
  static async getGuilds(token: string) {
    return await axios.request<UserGuild[]>({
      headers: {
        Authorization: token
      },
      method: 'GET',
      baseURL: 'https://discord.com/api/v8',
      url: '/users/@me/guilds'
    }).then((res) => res != null ? res.data : undefined).catch((err) => { console.error(err) });
  }
}

