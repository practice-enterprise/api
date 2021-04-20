import { Router } from 'express';
import { Collections, db } from '../services/database';

export class GuildController {
  static router(): Router {
    return Router({ caseSensitive: false })
      .get('/:id', async (req, res, next) => {
        db.collection(Collections.guilds)
          .doc(req.params.id).get()
          .then(d => {
            if (d.exists) res.send(d.data());
            else res.sendStatus(404);
          })
          .finally(() => next());
      })
      .put('/', (req, res, next) => {
        db.collection(Collections.guilds)
          .doc(req.body.id)
          .set(req.body)
          .then(() => res.sendStatus(204))
          .finally(() => next());
      })
      .put('/create/:id', (req, res, next) => {
        console.log('create');
        db.collection(Collections.guilds)
          .doc(req.params.id)
          .set(req.body)
          .then(() => res.sendStatus(204))
          .finally(() => next());
      });

  }
}
