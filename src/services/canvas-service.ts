import axios from 'axios'; 
import { CanvasInstance } from '../models/canvas';
import { CanvasTokenResponse } from '../models/oauth';
import { Env } from '../util/env';

export class CanvasService {
  static async refreshCanvasToken(refreshToken: string, instance: CanvasInstance): Promise<CanvasTokenResponse> {
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
      url: `${instance.endpoint}/login/oauth2/token`,
    })
      .then((res) => res.data)
      .catch((err) => console.error(err));
  }
}
