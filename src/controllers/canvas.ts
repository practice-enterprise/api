import { Router } from 'express';

export class CanvasController {
  static router(): Router {
    return Router({ caseSensitive: false })
      .get('/:id', async (req, res, next) => {
        sofa.db.canvas.get(req.params.id)
          .then((g) => res.send(g))
          .catch(() => res.sendStatus(404))
          .finally(() => next());
      })
      .put('/', (req, res, next) => {
        sofa.db.canvas.insert(req.body)
          .then((d) => res.send(d.rev))
          .catch(() => res.sendStatus(500))
          .finally(() => next());
      })
      .post('/', (req, res, next) => {
        sofa.db.canvas.insert(req.body)
          .then((d) => res.send(d.rev))
          .catch(() => res.sendStatus(500))
          .finally(() => next());
      });
  }
}
