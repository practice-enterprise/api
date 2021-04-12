import axios from 'axios';
import { Router } from 'express';
import { CanvasToken, DiscordToken } from '../models/oauth';
const canvasEndpoint = 'https://canvas.toasthub.xyz';

export class OauthController {
  static router(): Router {
    return Router({ caseSensitive: false })
      .get('/discord', async (req, res, next) => {
        res.redirect(`https://discord.com/api/oauth2/authorize?client_id=${process.env.D_CLIENT_ID!}&redirect_uri=${encodeURIComponent(process.env.D_REDIRECT_URI!)}&response_type=code&scope=identify%20guilds`);
        next();
      })
      .get('/discord/callback', async (req, res, next) => {
        const token = await this.getDiscordToken(req.query.code);
        // // Example to get a new token with refresh token
        // const newToken = await this.refreshDiscordToken(token.refresh_token);
        next();
      })
      .get('/canvas', async (req, res, next) => {
        //NEEDS to support manual token!
        res.redirect(`${canvasEndpoint}/login/oauth2/auth?client_id=${process.env.C_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(process.env.C_REDIRECT_URI!)}`);
        next();
      })
      .get('/canvas/callback', async (req, res, next) => {
        const token = await this.getCanvasToken(req.query.code);
        // // Example to get a new token with refresh token
        // if (token.refresh_token !== undefined) {
        //   const newToken = await this.refreshCanvasToken(token.refresh_token);
        // }
        next();
      });
  }

  static async getDiscordToken(code: any): Promise<DiscordToken> {
    // https://discord.com/developers/docs/topics/oauth2#authorization-code-grant-access-token-exchange-example
    return axios.request({
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: new URLSearchParams({
        'client_id': process.env.D_CLIENT_ID!,
        'client_secret': process.env.D_CLIENT_SECRET!,
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': process.env.D_REDIRECT_URI!,
        'scope': 'identify guilds'
      }),
      url: 'https://discord.com/api/oauth2/token',
    })
      .then((res) => res.data)
      .catch((err) => console.error(err));
  }

  static async refreshDiscordToken(refreshToken: string): Promise<DiscordToken> {
    // https://discord.com/developers/docs/topics/oauth2#authorization-code-grant-refresh-token-exchange-example
    return axios.request({
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: new URLSearchParams({
        'client_id': process.env.D_CLIENT_ID!,
        'client_secret': process.env.D_CLIENT_SECRET!,
        'grant_type': 'refresh_token',
        'refresh_token': refreshToken,
        'redirect_uri': process.env.D_REDIRECT_URI!,
        'scope': 'identify guilds'
      }),
      url: 'https://discord.com/api/oauth2/token',
    })
      .then((res) => res.data)
      .catch((err) => console.error(err));
  }

  static async getCanvasToken(code: any): Promise<CanvasToken> {
    // https://discord.com/developers/docs/topics/oauth2#authorization-code-grant-access-token-exchange-example
    return axios.request({
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: new URLSearchParams({
        'client_id': process.env.C_CLIENT_ID!,
        'client_secret': process.env.C_CLIENT_SECRET!,
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': process.env.C_REDIRECT_URI!,
      }),
      url: `${canvasEndpoint}/login/oauth2/token`,
    })
      .then((res) => res.data)
      .catch((err) => console.error(err));
  }

  static async refreshCanvasToken(refreshToken: string): Promise<CanvasToken> {
    return axios.request({
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: new URLSearchParams({
        'grant_type': 'refresh_token',
        'client_id': process.env.C_CLIENT_ID!,
        'client_secret': process.env.C_CLIENT_SECRET!,
        'redirect_uri': process.env.C_REDIRECT_URI!,
        'refresh_token': refreshToken,
      }),
      url: `${canvasEndpoint}/login/oauth2/token`,
    })
      .then((res) => res.data)
      .catch((err) => console.error(err));
  }
}
