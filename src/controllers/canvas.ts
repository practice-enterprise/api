import { Router } from 'express';
import Axios from 'axios';
import { CalenderAssignment, CanvasCourse, CanvasModule, CanvasModuleItem } from '../models/canvas';
import { Collections, db } from '../services/database';
import { User } from '../models/users';
import { DateTime } from 'luxon';
import { CryptoUtil } from '../util/crypto';
import { UserService } from '../services/user-service';
import { Logger } from '../util/logger';

export const canvasErrorCount: Record<string, number>/*discordId, error amount*/ = {};

export class CanvasController {
  static router(): Router {
    return Router({ caseSensitive: false })
      /* DB canvas instance doc requests*/
      .get('/:id', CryptoUtil.verifyToken, async (req, res, next) => {
        db.collection(Collections.canvas).doc(req.params.id)
          .get().then((doc) => res.send(doc.data()));
        // .finally(() => next());
      })
      .put('/', CryptoUtil.verifyToken, (req, res, next) => {
        db.collection(Collections.canvas).doc(req.body.id).set(req.body)
          .then(() => res.sendStatus(204));
        // .finally(() => next());
      })

      /* # Canvas LMS API requests # */
      /* Find courses for a discord user*/
      .get('/:discordID/courses', CryptoUtil.verifyToken, async (req, res, next) => {
        console.log('get courses api');
        this.getCourses(req.params.discordID)
          .then((courses) => res.send(courses))
          .catch(() => res.sendStatus(404));
        // .finally(() => next());
      })

      //gets instance id for a user
      .get('/:discordID/instanceId', CryptoUtil.verifyToken, async (req, res, next) => {
        UserService.getUser(req.params.discordID)
          .then((user) => res.send(user.canvas.instanceID))
          .catch(() => res.sendStatus(404));
        // .finally(() => next());
      })

      /* Find modules of a course for a discord user*/
      .get('/:discordID/courses/:courseID/modules', CryptoUtil.verifyToken, async (req, res, next) => {
        const snap = (await db.collection(Collections.users).where('discord.id', '==', req.params.discordID).get());
        if (snap.empty) {
          res.sendStatus(404);
          return next();
        }
        const user = snap.docs[0].data() as User;
        if (user.canvas.token === undefined || user.canvas.instanceID === undefined) {
          // There is no token
          res.sendStatus(404);
          return next();
        }

        const canvas = (await db.collection(Collections.canvas).doc(user.canvas.instanceID).get()).data();
        if (!canvas) {
          res.sendStatus(404);
          return next();
        }

        Axios.request<CanvasModule[]>({
          headers: {
            Authorization: `Bearer ${CryptoUtil.decrypt(user.canvas.token)}`
          },
          params: {
            include: ['items, content_details'],
            per_page: 50
          },

          method: 'GET',
          baseURL: canvas.endpoint,
          url: `/api/v1/courses/${req.params.courseID}/modules`
        }).then((d) => {
          res.send(d.data);
        })
          .catch((err) => {
            console.log(err);
            res.sendStatus(401);
          });
      })
      /* Find items from an itemURL (itemURL from module) for a discord user*/
      .get('/:discordID/items/:item_URL', CryptoUtil.verifyToken, async (req, res, next) => {
        const snap = (await db.collection(Collections.users).where('discord.id', '==', req.params.discordID).get());
        if (snap.empty) {
          res.sendStatus(404);
          return next();
        }
        const user = snap.docs[0].data() as User;
        if (user.canvas.token === undefined || user.canvas.instanceID === undefined) {
          // There is no token
          res.sendStatus(404);
          return next();
        }

        const canvas = (await db.collection(Collections.canvas).doc(user.canvas.instanceID).get()).data();
        if (!canvas) {
          res.sendStatus(404);
          return next();
        }

        return Axios.request<CanvasModuleItem[]>({
          headers: {
            Authorization: `Bearer ${CryptoUtil.decrypt(user.canvas.token)}`
          },
          params: {
            include: ['items', 'content_details'],
            per_page: 50
          },

          method: 'GET',
          baseURL: canvas.endpoint,
          url: req.params.item_URL
        }).then((d) => res.send(d.data))
          .catch(() => res.sendStatus(401));
      });
  }

  //work around for "random" canvas crashes
  static async getCourses(discordID: string): Promise<CanvasCourse[] | undefined> {
    const snap = (await db.collection(Collections.users).where('discord.id', '==', discordID).get());
    if (snap.empty) {
      throw new Error(`no user with id ${discordID}`);
    }
    const user = snap.docs[0].data() as User;
    if (!user.canvas || !user.canvas.token) {
      //throw new Error(`No canvas token for discord user ${discordID}`);
      return;
    }
    if (user.canvas.instanceID == null) {
      //throw new Error(`No canvas instance set for discord user ${discordID}`);
      return;
    }

    const canvas = (await db.collection(Collections.canvas).doc(user.canvas.instanceID).get()).data();
    if (!canvas) {
      //throw new Error(`could not find canvas config with id ${user.canvas.instanceID} for user ${discordID}`);
      return;
    }

    const courses = await Axios.request<CanvasCourse[]>({
      headers: {
        Authorization: `Bearer ${CryptoUtil.decrypt(user.canvas.token)}`
      },
      params: { per_page: '50' },
      method: 'GET',
      baseURL: canvas.endpoint,
      url: '/api/v1/courses'
    }).then((res) => res.data)
      .catch(() => {
        return undefined;
      });
    //TODO: handle refresh tokens etc

    if (courses !== undefined) {
      // Update user courses in DB
      user.courses = courses.map((c) => c.id);
      db.collection(Collections.users).doc(user.id).set(user);
      canvasErrorCount[discordID] = 0;
      return courses;
    } else {
      canvasErrorCount[discordID] ? canvasErrorCount[discordID]++ : canvasErrorCount[discordID] = 1;
      if (canvasErrorCount[discordID] > 5)
        UserService.clearCanvasToken(user);
      Logger.warn(`Something went wrong with the request for courses of user: ${discordID} amount of consistent errors: ${canvasErrorCount[discordID]}`);
    }
    return undefined;

  }

  static async getCalenderAssignments(user: User, warningDays: number): Promise<CalenderAssignment[] | undefined> {
    if (user.courses == undefined || user.courses?.length == 0) {
      throw new Error(`no canvas courses for discord user: ${user.discord.id}`);
    }
    if (user.canvas.instanceID === undefined) {
      throw new Error(`No canvas instance set for discord user ${user.discord.id}`);
    }
    const canvas = (await db.collection(Collections.canvas).doc(user.canvas.instanceID).get()).data();
    if (canvas == undefined) {
      throw new Error(`no instance with id ${user.canvas.instanceID}`);
    }
    if (!user.canvas.token) {
      Logger.error(`${user.discord.id} has no token`);
      return undefined;
    }
    return Axios.request<CalenderAssignment[]>({
      headers: {
        Authorization: `Bearer ${CryptoUtil.decrypt(user.canvas.token!)}`,
        Accept: 'application/json'
      },
      params: {
        type: 'assignment',
        per_page: 50,
        end_date: `${DateTime.fromMillis(Date.now() + warningDays * 24 * 60 * 60 * 1000).toFormat('yyyy-MM-dd')}`,
        'context_codes': user.courses.map(c => 'course_' + c)
      },
      method: 'GET',
      baseURL: canvas.endpoint,
      url: '/api/v1/calendar_events'
    }).then(res => res.data)
      .catch(() => {
        canvasErrorCount[user.discord.id] ? canvasErrorCount[user.discord.id]++ : canvasErrorCount[user.discord.id] = 1;
        if (canvasErrorCount[user.discord.id] > 5)
          UserService.clearCanvasToken(user);
        return undefined;
      });
  }

}


