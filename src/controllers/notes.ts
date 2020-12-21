import { Router } from 'express';
import { sofa } from '../services/sofa';

export class NotesController {
  static router(): Router {
    return Router({ caseSensitive: false })
      .get('/:channel', (req, res, next) => {
        sofa.db.notes.get(req.params.channel)
          .then((notes) => res.send(notes))
          .catch(() => res.sendStatus(404))
          .finally(() => next());
      })
      .put('/:channel', (req, res, next) => {
        sofa.db.notes.insert(req.body)
          .then((d) => res.send(d.rev))
          .catch(() => res.sendStatus(500))
          .finally(() => next());
      })
      .post('/:channel', (req, res, next) => {
        sofa.db.notes.insert(req.body)
          .then((d) => res.send(d.rev))
          .catch(() => res.sendStatus(500))
          .finally(() => next());
      });
  }
}
