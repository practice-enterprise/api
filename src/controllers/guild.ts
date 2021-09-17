import { Router } from 'express';

import { Guild } from '../models/guild';
import { ChannelCreationService } from '../services/channel-creation-service';
import { Collections, db } from '../services/database';
import { CryptoUtil } from '../util/crypto';
import { ConfigController } from './config';

export class GuildController {
  static router(): Router {
    return Router({ caseSensitive: false })
      .get('/:id', CryptoUtil.verifyToken, async (req, res, next) => {
        db.collection(Collections.guilds)
          .doc(req.params.id).get()
          .then(d => {
            if (d.exists) res.send(d.data());
            else res.sendStatus(404);
          });
        // .finally(() => next());
      })
      .put('/', CryptoUtil.verifyToken, (req, res, next) => {
        db.collection(Collections.guilds)
          .doc(req.body.id)
          .set(req.body)
          .then(() => res.sendStatus(204))
          .finally(() => next());
      })
      .put('/create', CryptoUtil.verifyToken, async (req, res, next) => {
        const body : Guild = req.body;
        if(body.canvasInstanceID.length < 5)
        {
          body.canvasInstanceID = (await ConfigController.getGeneralConfig()).canvas.defaultInstanceId;
        }
        db.collection(Collections.guilds)
          .doc(req.body.id)
          .set(body)
          .then(() => res.sendStatus(204));
        // .finally(() => next());
      })
      .put('/modules', CryptoUtil.verifyToken, (req, res, next) =>{
        db.collection(Collections.guilds)
          .doc(req.body.id)
          .update({'modules': req.body.modules})
          .then(() => res.sendStatus(204));
        // .finally(()=> next());
      });
  }
}
