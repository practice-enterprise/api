const keys = [
  'D_CLIENT_ID',
  'D_CLIENT_SECRET',
  'D_REDIRECT_URI',
];

export class Env {
  static validateMandatoryEnv(): void {
    for (const env of keys) {
      if (!process.env[env]) {
        throw new Error('Invalid env');
      }
    }
  }

  static get(env: string): string {
    const res = process.env[env];
    if (!res) {
      throw new Error('env does not exist');
    }

    return res;
  }
}
