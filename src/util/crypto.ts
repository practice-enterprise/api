import crypto from 'crypto';
import { Config } from '../models/config';
import { UserHash } from '../models/users';
import { Collections, db } from '../services/database';
import { Env } from './env';

export class CryptoUtil {
  private static algorithm = 'aes-256-ctr';

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

  private static key(): Buffer {
    return Buffer.from(Env.get('ENC_KEY'), 'base64');
  }

  static encrypt(content: string): UserHash {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key(), iv);
    const encrypted = Buffer.concat([cipher.update(content), cipher.final()]);
    return {
      iv: iv.toString('hex'),
      content: encrypted.toString('hex')
    };
  }

  static decrypt(hash: UserHash): string {
    const decipher = crypto.createDecipheriv(this.algorithm, this.key(), Buffer.from(hash.iv, 'hex'));
    const decrpyted = Buffer.concat([decipher.update(Buffer.from(hash.content, 'hex')), decipher.final()]);
    return decrpyted.toString();
  }
}
