import { Router } from 'express';
import { sofa } from '../services/sofa';
import Axios from 'axios';
import { CanvasCourse, CanvasModule, CanvasModuleItem } from '../models/canvas'

export class UserController {
  static router(): Router {
    return Router({ caseSensitive: false })
      .get('/canvasid/:id', async (req, res, next) => {
        sofa.db.users.find({selector: {discord: {id: {'$eq': req.params.canvasid}}}})
          .then((u) => res.send(u.docs[0]))
          .catch(() => res.sendStatus(404))
          .finally(() => next());
      })
      .get('/discordid/:id', async (req, res, next) => {
        sofa.db.users.find({selector: {discord: {id: {'$eq': req.params.discordid}}}})
          .then((u) => res.send(u.docs[0]))
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
