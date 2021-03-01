import { Router } from 'express';
import { sofa } from '../services/sofa';

export class NotesController {
  static router(): Router {
    return Router({ caseSensitive: false })
      .get('/', (req, res, next) => {
        sofa.db.notes.list({ include_docs: true})
          .then((notes) => res.send(notes.rows.map((d) => d.doc).filter(row => row !== undefined)))
          .catch((err) => {
            console.log(err);
            res.sendStatus(500)
          })
          .finally(() => next());
      })
      .put('/', (req, res, next) => {
        sofa.db.notes.insert(req.body)
          .then((d) => res.send(d.rev))
          .catch((err) => {
            console.log(err);
            res.sendStatus(500)
          })
          .finally(() => next());
      })
      .post('/', (req, res, next) => {
        sofa.db.notes.insert(req.body)
          .then((d) => res.send(d.rev))
          .catch((err) => {
            console.log(err);
            res.sendStatus(500)
          })
          .finally(() => next());
      });
  }
}
