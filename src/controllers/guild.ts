import { Router } from 'express';
import { sofa } from '../services/sofa';

export class GuildController {
  static router(): Router {
    return Router({ caseSensitive: false })
      .get('/:id', async (req, res, next) => {
        sofa.db.guilds.get(req.params.id)
          .then((g) => res.send(g))
          .catch(() => res.sendStatus(404))
          .finally(() => next());
      })
      .put('/', (req, res, next) => {
        sofa.db.guilds.insert(req.body)
          .then((d) => res.send(d.rev))
          .catch(() => res.sendStatus(500))
          .finally(() => next());
      })
      .post('/', (req, res, next) => {
        sofa.db.guilds.insert(req.body)
          .then((d) => res.send(d.rev))
          .catch(() => res.sendStatus(500))
          .finally(() => next());
      });
  }
}
