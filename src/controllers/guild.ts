import { Router } from 'express';
import { sofa } from '../services/sofa';

export class GuildController {
  static router(): Router {
    return Router({ caseSensitive: false })
      .get('/:id', async (req, res, next) => {
        console.log(req.params.id);
        sofa.db.guilds.get(req.params.id)
          .then((g) => res.send(g))
          .catch(() => res.sendStatus(404))
          .finally(() => next());
      });
  }
}
