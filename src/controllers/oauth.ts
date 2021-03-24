import axios from 'axios';
import { Router } from 'express';
import dotenv from 'dotenv';

dotenv.config();

const D_CLIENT_ID = process.env.D_CLIENT_ID
const D_CLIENT_SECRET = process.env.D_CLIENT_SECRET
const D_REDIRECT_URI = process.env.D_REDIRECT_URI

export class OauthController {
  static router(): Router {
    return Router({ caseSensitive: false })
      .get('/discord', async (req, res, next) => {
        if( D_CLIENT_ID !== undefined && D_CLIENT_SECRET !== undefined && D_REDIRECT_URI !== undefined) {
          res.redirect(`https://discord.com/api/oauth2/authorize?client_id=${D_CLIENT_ID}&redirect_uri=${encodeURIComponent(D_REDIRECT_URI)}&response_type=code&scope=identify%20guilds`);
        }
        next();
      })
            
      .get('/discord/callback', async (req, res, next) => {
        console.log('code: ', req.query.code);
        const token = await this.getToken('discord', req.query.code);
        console.log('token: ', token.access_token);
        console.log('Refreshing token...');

        const newToken = await this.refreshToken('discord', token.refresh_token);
        console.log( newToken );

        next();
      })
  }

  static async getToken(providor: 'discord' | 'canvas', code: any ) {
    // https://discord.com/developers/docs/topics/oauth2#authorization-code-grant-access-token-exchange-example
    if (providor === 'discord' && D_CLIENT_ID !== undefined && D_CLIENT_SECRET !== undefined && D_REDIRECT_URI !== undefined) {
      return axios.request({
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        data: new URLSearchParams({
          'client_id': D_CLIENT_ID,
          'client_secret': D_CLIENT_SECRET,
          'grant_type': 'authorization_code',
          'code': code,
          'redirect_uri': D_REDIRECT_URI,
          'scope': 'identify guilds'
        }),
      url: 'https://discord.com/api/oauth2/token',
      }).then((res) => res.data)
      .catch((err) => console.error(err));
    }
    if (providor === 'canvas') {
      // TODO: oauth + manual token
    }
    return;
  }

  static async refreshToken(providor: 'discord' | 'canvas', refreshToken: string) {
    // https://discord.com/developers/docs/topics/oauth2#authorization-code-grant-refresh-token-exchange-example
    if (providor === 'discord' && D_CLIENT_ID !== undefined && D_CLIENT_SECRET !== undefined && D_REDIRECT_URI !== undefined) {
      return axios.request({
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        data: new URLSearchParams({
          'client_id': D_CLIENT_ID,
          'client_secret': D_CLIENT_SECRET,
          'grant_type': 'refresh_token',
          'refresh_token': refreshToken,
          'redirect_uri': D_REDIRECT_URI,
          'scope': 'identify guilds'
        }),
      url: 'https://discord.com/api/oauth2/token',
      }).then((res) => res.data);

      // TODO: catch 401
    }
    if (providor === 'canvas') {
      // TODO: oauth + manual token
    }
    return;
  }
}
