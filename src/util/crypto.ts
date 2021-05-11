import crypto from 'crypto';
import { Config } from '../models/config';
import { Collections, db } from '../services/database';

export class CryptoUtil {
  static async validate(): Promise<void> {
    const doc = (await db.collection(Collections.config).get()).docs[0];
    const config = doc.data() as Config;
    if (!config.jwt.secret) {
      config.jwt = {
        secret: crypto.randomBytes(256).toString('base64')
      };
      doc.ref.set(config);
    }
  }

  static async getSecret(): Promise<string> {
    return ((await db.collection(Collections.config).get()).docs[0].data() as Config).jwt.secret;
  }
}
