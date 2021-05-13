import { Router } from 'express';
import { Collections, db } from '../services/database';

export class NotesController {
  static router(): Router {
    return Router({ caseSensitive: false })
      .get('/:id', async (req, res, next) => {
        const noteSnapshot = await db.collection(Collections.notes)
          .where('id', '==', req.params.id).get()
        if (noteSnapshot.empty) {
          res.sendStatus(404);
          next();
        }
        res.send(noteSnapshot.docs[0].data());
        next();
      })

      .put('/', (req, res, next) => {
        db.collection(Collections.notes)
          .doc(req.body.id)
          .set(req.body)
          .then(() => res.sendStatus(204))
          .finally(() => next());
      });
  }
}
