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
      .put('/:userID/:lastAssignment', (req, res, next) => {
        db.collection(Collections.users)
          .doc(req.params.userID)
          .update({ 'canvas.lastAssignment': req.params.lastAssignment })
          .then(() => res.sendStatus(204))
          .finally(() => next());
      })
      .delete('/', (req, res, next) => {
        db.collection(Collections.reminders)
          .doc((req.body.id)).delete()
          .then(() => res.sendStatus(204))
          .finally(() => next());
      })
      .get('/timezone/:id', async (req, res, next) => {
        const users = await db.collection(Collections.users)
          .where('discord.id', '==', req.params.id).get();
        if (users.empty) {
          res.sendStatus(404);
          next();
        }
        res.send( users.docs[0].data().timeZone);
        next();
      })
      .put('/timezone/:id', async (req, res, next) => {
        const users = await db.collection(Collections.users)
          .where('discord.id', '==', req.params.id).get();
        if (users.empty) {
          res.sendStatus(404);
          next();
        }
        db.collection(Collections.users).doc(users.docs[0].id).update({timeZone: req.body.tz});
        res.sendStatus(204);
        next();
      });
  }
}
