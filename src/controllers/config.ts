import { Router } from 'express';
import { Collections, db } from '../services/database';

export class ConfigController {
  static router(): Router {
    return Router({ caseSensitive: false })
      .get('/', (req, res, next) => {
        db.collection(Collections.config).get()
          .then((snapshot) => res.send(snapshot.docs[0].data() || {}))
          .finally(() => next());
      });
  }
}
