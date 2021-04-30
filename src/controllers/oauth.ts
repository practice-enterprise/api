import axios from 'axios';
import { Router } from 'express';
import { CanvasTokenResponse, DiscordTokenResponse } from '../models/oauth';
import { Env } from '../util/env';
const canvasEndpoint = 'https://canvas.toasthub.xyz';

export class OauthController {
  static router(): Router {
    return Router({ caseSensitive: false })
      .post('/callback/discord', async (req, res, next) => {
        console.log(req.query);
        const tokens = await axios.request({
          method: 'POST',
          url: 'https://discord.com/api/oauth2/token',
          data: new URLSearchParams({
            client_id: Env.get('D_CLIENT_ID'),
            client_secret: Env.get('D_CLIENT_SECRET'),
            grant_type: 'authorization_code',
            code: req.query.code as string,
            redirect_uri: Env.get('D_REDIRECT_URI')
          }),
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });

        
      });
  }

  static async refreshDiscordToken(refreshToken: string): Promise<DiscordTokenResponse> {
    // https://discord.com/developers/docs/topics/oauth2#authorization-code-grant-refresh-token-exchange-example
    return axios.request({
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: new URLSearchParams({
        'client_id': Env.get('D_CLIENT_ID'),
        'client_secret': Env.get('D_CLIENT_SECRET'),
        'grant_type': 'refresh_token',
        'refresh_token': refreshToken,
        'redirect_uri': Env.get('D_REDIRECT_URI'),
        'scope': 'identify guilds'
      }),
      url: 'https://discord.com/api/oauth2/token',
    })
      .then((res) => res.data)
      .catch((err) => console.error(err));
  }

  static async getCanvasToken(code: string): Promise<CanvasTokenResponse> {
    // https://discord.com/developers/docs/topics/oauth2#authorization-code-grant-access-token-exchange-example
    return axios.request({
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: new URLSearchParams({
        'client_id': Env.get('C_CLIENT_ID'),
        'client_secret': Env.get('C_CLIENT_SECRET'),
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': Env.get('C_REDIRECT_URI'),
      }),
      url: `${canvasEndpoint}/login/oauth2/token`,
    })
      .then((res) => res.data)
      .catch((err) => console.error(err));
  }

  static async refreshCanvasToken(refreshToken: string): Promise<CanvasTokenResponse> {
    return axios.request({
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: new URLSearchParams({
        'grant_type': 'refresh_token',
        'client_id': Env.get('C_CLIENT_ID'),
        'client_secret': Env.get('C_CLIENT_SECRET'),
        'redirect_uri': Env.get('C_REDIRECT_URI'),
        'refresh_token': refreshToken,
      }),
      url: `${canvasEndpoint}/login/oauth2/token`,
    })
      .then((res) => res.data)
      .catch((err) => console.error(err));
  }
}
