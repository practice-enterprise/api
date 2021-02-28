import { Router } from 'express';
import { sofa } from '../services/sofa';

export class ConfigController {
  static router(): Router {
    return Router({ caseSensitive: false })
      .get('/', (req, res, next) => {
        sofa.db.config.list({ include_docs: true})
          .then((config) => res.send(config.rows.map((d) => d.doc).filter(row => row !== undefined)))
          .catch()
          .finally(() => next());
      })
      .put('/', (req, res, next) => {
        sofa.db.config.insert(req.body)
          .then((d) => res.send(d.rev))
          .catch(() => res.sendStatus(500))
          .finally(() => next());
      })
      .post('/', (req, res, next) => {
        sofa.db.config.insert(req.body)
          .then((d) => res.send(d.rev))
          .catch(() => res.sendStatus(500))
          .finally(() => next());
      });
  }
}
