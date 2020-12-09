import { Router } from 'express';
import { sofa } from '../services/sofa';

export class ReminderController {
  static router(): Router {
    return Router({ caseSensitive: false })
      .get('/', async (req, res, next) => {
        sofa.db.reminders.list({ include_docs: true })
          .then((reminders) => res.send(reminders.rows.map((d) => d.doc).filter(r => r !== undefined)))
          .catch()
          .finally(() => next());
      })
      .put('/', (req, res, next) => {
        if (!req.body._rev) {
          res.status(404).send('reminder does not exist');
          return next();
        }

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
