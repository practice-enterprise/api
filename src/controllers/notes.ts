import { Router } from 'express';
import { Collections, db } from '../services/database';

export class NotesController {
  static router(): Router {
    return Router({ caseSensitive: false })
      .get('/', (req, res, next) => {
        db.collection(Collections.notes).get()
          .then((snapshot) => res.send(snapshot.docs.map((d) => d.data())))
          .finally(() => next());
      })
      .put('/', (req, res, next) => {
        db.collection(Collections.notes)
          .doc(req.body.channel)
          .set(req.body)
          .then(() => res.sendStatus(204))
          .finally(() => next());
      });
  }
}
