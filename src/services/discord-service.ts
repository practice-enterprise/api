import axios from 'axios';
import { DiscordAuthInfo, DiscordPartialGuild } from '../models/discord';
import { DiscordTokenResponse as DiscordTokens } from '../models/oauth';
import { UserHash } from '../models/users';
import { CryptoUtil } from '../util/crypto';
import { Env } from '../util/env';
import { Collections, db } from './database';

export class DiscordService {
  static async getGuilds(token: string): Promise<DiscordPartialGuild[]> {
    return await axios.request<DiscordPartialGuild[]>({
      headers: {
        Authorization: `Bearer ${token}`
      },
      method: 'GET',
      baseURL: 'https://discord.com/api/v8',
      url: '/users/@me/guilds'
    })
      .then((res) => res.data);
  }

  static async getAuthInfo(token: string): Promise<DiscordAuthInfo> {
    return await axios.request<DiscordAuthInfo>({
      headers: {
        Authorization: `Bearer ${token}`
      },
      method: 'GET',
      baseURL: 'https://discord.com/api/v8',
      url: '/oauth2/@me'
    }).then((r) => r.data);
  }

  static async tokensFromRefresh(hash: UserHash, userId: string): Promise<DiscordTokens> {
    const tokens = await axios.request<DiscordTokens>({
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: new URLSearchParams({
        'client_id': Env.get('D_CLIENT_ID'),
        'client_secret': Env.get('D_CLIENT_SECRET'),
        'grant_type': 'refresh_token',
        'refresh_token': CryptoUtil.decrypt(hash),
        'redirect_uri': Env.get('D_REDIRECT_URI'),
        'scope': 'identify guilds'
      }),
      url: 'https://discord.com/api/oauth2/token',
    }).then((res) => res.data);
    const hashed = CryptoUtil.encrypt(tokens.refresh_token);
    db.collection(Collections.users).doc(userId).update({'discord.token.content': hashed.content, 'discord.token.iv':hashed.iv});
    return tokens;
  }
}
