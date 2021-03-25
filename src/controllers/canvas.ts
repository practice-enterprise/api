import { Router } from 'express';
import { sofa } from '../services/sofa';
import Axios from 'axios';
import { CanvasCourse } from '../models/canvas'

export class CanvasController {
  static router(): Router {
    return Router({ caseSensitive: false })
      .get('/:id', async (req, res, next) => {
        sofa.db.canvas.get(req.params.id)
          .then((c) => res.send(c))
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
      })

      .get('/:canvasInstanceID/courses/:discordID', async (req, res, next) => {
        const user = (await sofa.db.users.find({selector: {discord: {id: {'$eq': req.params.discordID}}}})).docs[0];
        if (user.canvas.token === undefined) {
          // There is no token
          res.sendStatus(404);
          next();
          return;
        }

        const canvas =  await sofa.db.canvas.get(req.params.canvasInstanceID);

        Axios.request<CanvasCourse[]>({
          headers: {
            Authorization: `Bearer ${user.canvas.token}`
          },
          params: { per_page: '50' },
          method: 'GET',
          baseURL: canvas.endpoint,
          url: '/api/v1/courses'
        }).then((d) => res.send(d.data))
        .catch(() => res.sendStatus(401))
        // FIX: there needs to be next().
      });
  }
}
