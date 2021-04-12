import { Router } from 'express';
import Axios from 'axios';
import { CanvasCourse, CanvasModule, CanvasModuleItem } from '../models/canvas';
import { Collections, db } from '../services/database';

export class CanvasController {
  static router(): Router {
    return Router({ caseSensitive: false })
      /* DB canvas instance doc requests*/
      .get('/:id', async (req, res, next) => {
        db.collection(Collections.canvas).doc(req.params.id)
          .get().then((doc) => res.send(doc.data()))
          .finally(() => next());
      })
      .put('/', (req, res, next) => {
        db.collection(Collections.canvas).doc(req.body.id).set(req.body)
          .then(() => res.sendStatus(204))
          .finally(() => next());
      })

      /* # Canvas LMS API requests # */
      /* Find courses for a discord user*/
      .get('/:canvasInstanceID/:discordID/courses', async (req, res, next) => {
        this.getCourses(req.params.discordID, req.params.canvasInstanceID)
          .then((courses) => res.send(courses))
          .catch(() => res.sendStatus(404))
          .finally(() => next());
      })

      /* Find modules of a course for a discord user*/
      .get('/:canvasInstanceID/:discordID/courses/:courseID/modules', async (req, res, next) => {
        const snap = (await db.collection(Collections.users).where('discord.id', '==', req.params.discordID).get());
        if (snap.empty) {
          res.sendStatus(404);
          return next();
        }
        const user = snap.docs[0].data();
        if (user.canvas.token === undefined) {
          // There is no token
          res.sendStatus(404);
          return next();
        }

        const canvas = (await db.collection(Collections.canvas).doc(req.params.canvasInstanceID).get()).data();
        if (!canvas) {
          res.sendStatus(404);
          return next();
        }

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
          .catch((err) => {
            console.log(err);
            res.sendStatus(401);
          });
      })
      /* Find items from an itemURL (itemURL from module) for a discord user*/
      .get('/:canvasInstanceID/:discordID/items/:item_URL', async (req, res, next) => {
        const snap = (await db.collection(Collections.users).where('discord.id', '==', req.params.discordID).get());
        if (snap.empty) {
          res.sendStatus(404);
          return next();
        }
        const user = snap.docs[0].data();
        if (user.canvas.token === undefined) {
          // There is no token
          res.sendStatus(404);
          return next();
        }

        const canvas = (await db.collection(Collections.canvas).doc(req.params.canvasInstanceID).get()).data();
        if (!canvas) {
          res.sendStatus(404);
          return next();
        }

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
      });
  }

  static async getCourses(discordID: string, canvasInstanceID: string): Promise<CanvasCourse[] | undefined> {
    const snap = (await db.collection(Collections.users).where('discord.id', '==', discordID).get());
    if (snap.empty) {
      return undefined;
    }
    const user = snap.docs[0].data();
    if (user.canvas.token === undefined) {
      return undefined;
    }

    const canvas = (await db.collection(Collections.canvas).doc(canvasInstanceID).get()).data();
    if (!canvas) {
      return undefined;
    }

    const courses = await Axios.request<CanvasCourse[]>({
      headers: {
        Authorization: `Bearer ${user.canvas.token}`
      },
      params: { per_page: '50' },
      method: 'GET',
      baseURL: canvas.endpoint,
      url: '/api/v1/courses'
    }).then((res) => res.data)
      .catch(() => undefined);
    //TODO: handle refresh tokens etc

    if (courses !== undefined) {
      // Update user courses in DB
      user.courses = courses.map((c) => c.id);
      db.collection(Collections.users).doc(user.id).set(user);
    }

    return courses;
  }
}

