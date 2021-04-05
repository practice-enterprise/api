import { Router } from 'express';
import { sofa } from '../services/sofa';
import { allCourses, CanvasCourse } from '../models/canvas'
import { CanvasController } from './canvas';
import Axios from 'axios';
import { User } from '../models/users';

export class UserController {
  static router(): Router {
    return Router({ caseSensitive: false })
      .get('/canvas/:id', async (req, res, next) => {
        sofa.db.users.find({ selector: { canvas: { id: { '$eq': req.params.id } } } })
          .then((u) => res.send(u.docs[0]))
          .catch(() => res.sendStatus(404))
          .finally(() => next());
      })
      .get('/discord/:id', async (req, res, next) => {
        sofa.db.users.find({ selector: { discord: { id: { '$eq': req.params.id } } } })
          .then((u) => res.send(u.docs[0]))
          .catch(() => res.sendStatus(404))
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
      /* not implemented because of security reasons
      .get('/', async (req, res, next) => {
        return sofa.db.users.list({ include_docs: true })
          .then((users) => { res.send(users.rows.map((d) => d.doc).filter(r => r !== undefined)); console.log(users.rows.map((d) => d.doc).filter(r => r !== undefined)) })
          .catch(() => res.sendStatus(404))
          .finally(() => next());
      })*/

      .get('/update/roles', async (req, res, next) => {
        console.log('update api call');
        const userList = await sofa.db.users.list({ include_docs: true });
        const userDefined = userList.rows.map((d) => d.doc).filter(r => r !== undefined);
        const idCourse: IdCourse[] = []

        const configs = await sofa.db.guilds.list({ include_docs: true }).then((users) => { return (users.rows.map((d) => d.doc).filter(r => r !== undefined)) });

        for (const user of userDefined) {
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
    const users = (await sofa.db.users.find({
      selector: {
        courses: {
          $elemMatch: {
            $eq: courseID
          }
        }
      }
    }))

    /*There are no corresponding doc(s) for this courseID */
    if (users.docs.length < 1) {
      return undefined;
    }

    /*Random index for balancing user tokens */
    const index = Math.floor(Math.random() * users.docs.length)
    return users.docs[index];
  }

  /**Updates all course IDs for a user. Returns true if succesful */
  static async updateUserCourses(user: User, canvasInstanceID: string): Promise<boolean> {
    if ( user.canvas.token === undefined ) {
      return false
    }
    const canvas = await sofa.db.canvas.get(canvasInstanceID);
    const courses = await Axios.request<allCourses>({
      headers: {
        Authorization: `Bearer ${user.canvas.token}`
      },
      params: {
        query: `
          query MyQuery {
            allCourses {
              _id
            }
          }
        `
      },
      method: 'POST',
      baseURL: canvas.endpoint,
      url: '/api/graphql'
    }).then((d) => {
      return d.data.data.allCourses;
    });
    // TODO: check refresh tokens etc
    user.courses =  courses.map((c) => c._id);
    return sofa.db.users.insert(user)
      .then(() => true)
      .catch((err) => {
        console.error('Failed to insert user with updated courses in db');
        return false;
      });
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
