import { Router } from 'express';
import { Config } from '../models/config';
import { Collections, db } from '../services/database';

export class ConfigController {
  static router(): Router {
    return Router({ caseSensitive: false })
      .get('/', (req, res, next) => {
        ConfigController.getGeneralConfig().then((config) => res.send(config || {}))
          .finally(() => next());
      })

      .get('/defaultInstance',(req, res, next)=>{
        console.log('gets');
        this.getGeneralConfig().then((i)=> res.send(i.canvas.defaultInstanceId));
      });
  }
  static async getGeneralConfig(): Promise<Config> {
    return (await db.collection(Collections.config).get()
      .then((snapshot) => (snapshot.docs[0].data() as Config)));
  }
}
