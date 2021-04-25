import { Router } from 'express';
import { Collections, db } from '../services/database';

export class ReminderController {
  static router(): Router {
    return Router({ caseSensitive: false })
      .post('/', (req, res, next) => {
        db.collection(Collections.reminders)
          .doc()
          .set(req.body)
          .then(() => res.sendStatus(204))
          .finally(() => next());
      })
      .put('/:userID/:lastAssignment', (req, res, next) =>{
        db.collection(Collections.users)
          .doc(req.params.userID)
          .update({'canvas.lastAssignment': req.params.lastAssignment})
          .then(() => res.sendStatus(204))
          .finally(()=> next());
      })
      .delete('/', (req, res, next) => {
        db.collection(Collections.reminders)
          .doc((req.body.id)).delete()
          .then(() => res.sendStatus(204))
          .finally(() => next());
      });
  }
}
