import axios from 'axios';
import { Router } from 'express';
import { DiscordUser } from '../models/discord';
import { CanvasTokenResponse, DiscordTokenResponse } from '../models/oauth';
import { User } from '../models/users';
import { Collections, db } from '../services/database';
import { DiscordService } from '../services/discord-service';
import { Env } from '../util/env';
import { Logger } from '../util/logger';
import jwt from 'jsonwebtoken';
import { CryptoUtil } from '../util/crypto';
import { CanvasInstance } from '../models/canvas';

const canvasEndpoint = 'https://canvas.toasthub.xyz';

export class OauthController {
  static router(): Router {
    return Router({ caseSensitive: false })
      .post('/callback/discord', async (req, res) => {
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
        }).then((res) => res.data as DiscordTokenResponse);

        const info = await DiscordService.getAuthInfo(tokens.access_token);
        if (!info.user) {
          Logger.error('oauth flow didn\'t result in a user object', info);
          res.sendStatus(401);
          return;
        }

        const snap = await db.collection(Collections.users).where('discord.id', '==', info.user.id).get();
        let user: User;
        if (snap.empty) {
          Logger.info('creating new user from discord loggin', info.user);
          user = await this.createUserFromDiscord(info.user, tokens);
        } else {
          user = snap.docs[0].data() as User;
          user.discord.token = CryptoUtil.encrypt(tokens.refresh_token);
          snap.docs[0].ref.set(user);
        }

        const secret = await CryptoUtil.getSecret();
        const token = jwt.sign(
          {
            id: user.id,
            discord: {
              username: info.user.username,
              discriminator: info.user.discriminator
            }
          },
          secret,
          { expiresIn: '1d' }
        );

        res.send({ jwt: token });
      })
      .post('/callback/canvas/manual', (req, res) => {
        console.log(req.body);
      })
      .post('/callback/canvas', async (req, res) => {
        const tokens = await axios.request<CanvasTokenResponse>({
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          data: new URLSearchParams({
            'client_id': Env.get('C_CLIENT_ID'),
            'client_secret': Env.get('C_CLIENT_SECRET'),
            'grant_type': 'authorization_code',
            'code': req.query.code as string,
            'redirect_uri': Env.get('C_REDIRECT_URI'),
          }),
          url: `${canvasEndpoint}/login/oauth2/token`,
        }).then((res) => res.data);

        
        const auth = req.headers.authorization?.replace('Bearer ', '');
        let token = jwt.decode(auth!);
        if (!token) {
          res.sendStatus(401);
          return;
        }
        const userDoc = await db.collection(Collections.users).doc((token as any).id).get();
        const user = userDoc.data() as User;
        user.canvas = {
          id: String(tokens.user.id),
          instanceID: 'HDSLi9ojqdTMPbZJuvhN',
          tokenType: 'refresh',
          token: CryptoUtil.encrypt(tokens.refresh_token!)
        };
        userDoc.ref.set(user);

        const discordTokens = await DiscordService.tokensFromRefresh(user.discord.token!);
        const info = await DiscordService.getAuthInfo(discordTokens.access_token);
        const secret = await CryptoUtil.getSecret();
        token = jwt.sign(
          {
            id: user.id,
            discord: {
              username: info.user!.username,
              discriminator: info.user!.discriminator
            },
            canvas: { username: tokens.user.name }
          },
          secret,
          { expiresIn: '1d' }
        );

        res.send({ jwt: token });
      })
      .get('/instances/:instanceid', async (req, res) => {
        const doc = await db.collection(Collections.canvas).doc(req.params.instanceid).get();
        if (!doc.exists) {
          res.sendStatus(404);
          return;
        }

        const data = doc.data() as CanvasInstance;
        res.send({
          endpoint: data.endpoint,
          clientId: data.oauth?.clientId,
          redirectUri: data.oauth?.redirectUri,
          manual: !data.oauth
        });
      });
  }

  static async createUserFromDiscord(discordUser: DiscordUser, tokens: DiscordTokenResponse): Promise<User> {
    const doc = db.collection(Collections.users).doc();
    const user: User = {
      discord: {
        id: discordUser.id,
        token: CryptoUtil.encrypt(tokens.refresh_token)
      },
      canvas: {},
      id: doc.id
    };

    await doc.set(user);
    return user;
  }
}
