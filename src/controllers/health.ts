import { Router } from 'express';

export class HealthController {
  static router(): Router {
    return Router({caseSensitive: false})
      .get('/', async(req, res, next) => {
        res.sendStatus(200);
        next();
      });
  }
}
