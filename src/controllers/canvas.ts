import { NextFunction, Router } from 'express';
import { sofa } from '../services/sofa';
import Axios from 'axios';
import { CanvasAnnouncement, CanvasCourse, CanvasModule, CanvasModuleItem } from '../models/canvas'
import { UserController } from './users';

export class CanvasController {
  static router(): Router {
    return Router({ caseSensitive: false })
      /* DB canvas instance doc requests*/
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

      /* # Canvas LMS API requests # */
      /* Find courses for a discord user*/
      .get('/:canvasInstanceID/:discordID/courses', async (req, res, next) => {
        this.getCourses(next, req.params.discordID, req.params.canvasInstanceID)
        .then((d) => {if(d != undefined){res.send(d.data)} else {res.sendStatus(404)}})
        .catch(() => res.sendStatus(401))
      // FIX: there needs to be next().
      })

      /* Find modules of a course for a discord user*/
      .get('/:canvasInstanceID/:discordID/courses/:courseID/modules', async (req, res, next) => {
        const user = (await sofa.db.users.find({ selector: { discord: { id: { '$eq': req.params.discordID } } } })).docs[0];
        if (user.canvas.token === undefined) {
          // There is no token
          res.sendStatus(404);
          next();
          return;
        }

        const canvas = await sofa.db.canvas.get(req.params.canvasInstanceID);

        Axios.request<CanvasModule[]>({
          headers: {
            Authorization: `Bearer ${user.canvas.token}`
          },
          params: {
            include: ['items, content_details']
          },

          method: 'GET',
          baseURL: canvas.endpoint,
          url: `/api/v1/courses/${req.params.courseID}/modules`
        }).then((d) => res.send(d.data))
          .catch(() => res.sendStatus(401));
      })
      /* Find items from an itemURL (itemURL from module) for a discord user*/
      .get('/:canvasInstanceID/:discordID/items/:item_URL', async (req, res, next) => {
        const user = (await sofa.db.users.find({ selector: { discord: { id: { '$eq': req.params.discordID } } } })).docs[0];
        if (user.canvas.token === undefined) {
          // There is no token
          res.sendStatus(404);
          next();
          return;
        }
        console.log(req.params.item_URL);
        const canvas = await sofa.db.canvas.get(req.params.canvasInstanceID);

        return Axios.request<CanvasModuleItem[]>({
          headers: {
            Authorization: `Bearer ${user.canvas.token}`
          },
          params: {
            include: ['items', 'content_details']
          },

          method: 'GET',
          baseURL: canvas.endpoint,
          url: req.params.item_URL
        }).then((d) => res.send(d.data))
          .catch(() => res.sendStatus(401));
      })

      .get('/:canvasInstanceID/:discordID/courses/:courseID/announcements', async (req, res, next) => {
        const user = (await sofa.db.users.find({ selector: { discord: { id: { '$eq': req.params.discordID } } } })).docs[0];
        if (user.canvas.token === undefined) {
          // There is no token
          res.sendStatus(404);
          next();
          return;
        }
        const canvas = await sofa.db.canvas.get(req.params.canvasInstanceID);

        // Maybe: context_codes param supports arrays, we could reduce requests.
        return Axios.request<CanvasAnnouncement[]>({
          headers: {
            Authorization: `Bearer ${user.canvas.token}`
          },
          params: {
            context_codes: ['course_' + req.params.courseID]
          },

          method: 'GET',
          baseURL: canvas.endpoint,
          url: '/api/v1/announcements'
        }).then((d) => res.send(d.data))
          .catch((err) => res.sendStatus(err.status));
      });
  }

  static async getCourses(next: NextFunction, discordID: string, canvasInstanceID: string) {
    const user = (await sofa.db.users.find({ selector: { discord: { id: { '$eq': discordID } } } })).docs[0];
    if (user.canvas.token === undefined) {
      // There is no token
      return undefined;
    }

    const canvas = await sofa.db.canvas.get(canvasInstanceID);
    
    return Axios.request<CanvasCourse[]>({
      headers: {
        Authorization: `Bearer ${user.canvas.token}`
      },
      params: { per_page: '50' },
      method: 'GET',
      baseURL: canvas.endpoint,
      url: '/api/v1/courses'
    })
  }
}

