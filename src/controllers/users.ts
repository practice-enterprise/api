import { Router } from 'express';
import { sofa } from '../services/sofa';

export class UserController {
  static router(): Router {
    return Router({ caseSensitive: false })
      .get('/canvas/:id', async (req, res, next) => {
        sofa.db.users.find({selector: {canvas: {id: {'$eq': req.params.id}}}})
          .then((u) => res.send(u.docs[0]))
          .catch(() => res.sendStatus(404))
          .finally(() => next());
      })
      .get('/discord/:id', async (req, res, next) => {
        sofa.db.users.find({selector: {discord: {id: {'$eq': req.params.id}}}})
          .then((u) => res.send(u.docs[0]))
          .catch(() => res.sendStatus(404))
          .finally(() => next());
      })
      /* // # Not possible without indexer afaik
      .get('/course/:courseid', async (req, res, next) => {
        sofa.db.users.find({selector: {courses: req.params.courseid}})
          .then((u) => res.send(u.docs[0]))
          .catch(() => res.sendStatus(404))
          .finally(() => next());
      })
      */
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
