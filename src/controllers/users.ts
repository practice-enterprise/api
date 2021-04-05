import { Router } from 'express';
import { CanvasCourse } from '../models/canvas'
import { CanvasController } from './canvas';
import Axios from 'axios';
import { User } from '../models/users';
import { Collections, db } from '../services/database';

export class UserController {
  static router(): Router {
    return Router({ caseSensitive: false })
      .get('/canvas/:id', async (req, res, next) => {
        db.collection(Collections.users).where('canvas.id', '==', req.params.id).get()
          .then((snap) => snap.empty ? res.sendStatus(404) : res.send(snap.docs[0].data()))
          .finally(() => next());
      })
      .get('/discord/:id', async (req, res, next) => {
        db.collection(Collections.users).where('discord.id', '==', req.params.id).get()
          .then((snap) => snap.empty ? res.sendStatus(404) : res.send(snap.docs[0].data()))
          .finally(() => next());
      })

      /*Returns a random user with corresponding courseID */
      .get('/course/:courseid', async (req, res, next) => {
        const user = this.getForCourse(req.params.courseid);
        if (user === undefined) {
          res.sendStatus(404);
        }
        else {
          res.send(user);
        }
        next();
        return;
      })
      /* not implemented because of security reasons
      .get('/', async (req, res, next) => {
        return sofa.db.users.list({ include_docs: true })
          .then((users) => { res.send(users.rows.map((d) => d.doc).filter(r => r !== undefined)); console.log(users.rows.map((d) => d.doc).filter(r => r !== undefined)) })
          .catch(() => res.sendStatus(404))
          .finally(() => next());
      })*/

      .get('/update/roles', async (req, res, next) => {
        const users = (await db.collection(Collections.users).get()).docs.map((d) => d.data());
        const configs = (await db.collection(Collections.guilds).get()).docs.map((d) => d.data());
        
        const idCourse: IdCourse[] = []
        for (const user of users) {
          if (user != undefined) {
            
            const guilds = await Axios.request<UserGuild[]>({
              headers: {
                Authorization: user.discord.token
              },
              method: 'GET',
              baseURL: 'https://discord.com/api/v8',
              url: '/users/@me/guilds'
            }).then((res) => res != null ? res.data : undefined).catch((err) => { console.error(err) });
            
            const validGuildConfigs: UserGuild[] = []
            if(Array.isArray(guilds) && Array.isArray(configs)){
              const validGuildConfigs = guilds.filter(g => configs.map(c => c?._id).includes(g.id));
            } 
            console.log(validGuildConfigs)

            //TODO, get rid of hardcoded canvasInstanceID
            const courses = await CanvasController.getCourses(user.discord.id, 'a40d37b54851efbcadb35e68bf03d698');
            if (courses === undefined) {
              console.log('Could not retrieve courses for user', user.discord.id);
              return undefined;
            }

            //console.log(courses);
            idCourse.push({ 'id': user.discord.id, 'courses': courses });
          }
        }
        //console.log(idCourse);
        res.send(idCourse);
        next();
      });
  }

  static async getForCourse(courseID: string): Promise<User | undefined> {
    const users = (await db.collection(Collections.users).where('courses', 'array-contains', courseID).get()).docs.map((d) => d.data());
    /*There are no corresponding users for this courseID */
    if (users.length < 1) {
      return undefined;
    }

    /*Random index for balancing user tokens */
    const index = Math.floor(Math.random() * users.length)
    return users[index] as User;
  }
}


interface IdCourse {
  id: string,
  courses: CanvasCourse[]
}

interface UserGuild {
  id: string,
  name: string,
  icon: string,
  owner: boolean,
  permissions: string,
  features: string[]
}
