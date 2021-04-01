import { Router } from 'express';
import { from, identity } from 'rxjs';
import { domainToASCII } from 'url';
import { sofa } from '../services/sofa';
import {CanvasCourse} from '../models/canvas'
import { CanvasController } from './canvas';

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
      
      /*Returns a random user with corresponding courseID */
      .get('/course/:courseid', async (req, res, next) => {
        const users = (await sofa.db.users.find({selector: {
          courses: {
            $elemMatch: {
              $eq: req.params.courseid
            }
          }}
        }))

        /*There corresponding doc(s) for this courseID */
        if (users.docs.length < 1) {
          res.sendStatus(404);
          next();
          return;
        }

        /*Random index for balancing user tokens */
        const index = Math.floor(Math.random() * users.docs.length)
        console.log(users.docs[index]);
        res.send(users.docs[0])
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
      .get('/', async (req, res, next) => {
        return sofa.db.users.list({ include_docs: true })
          .then((users) => {res.send(users.rows.map((d) => d.doc).filter(r => r !== undefined)); console.log(users.rows.map((d) => d.doc).filter(r => r !== undefined))})
          .catch(() => res.sendStatus(404))
          .finally(() => next());
      })

    .get('/update/roles', async (req, res, next) => { 
      const userList = await sofa.db.users.list({ include_docs: true });
       const userDefined = userList.rows.map((d) => d.doc).filter(r => r !== undefined); 
       const idCourse: IdCourse[] = []
      
        for(const user of userDefined){
          //user?.discord.id //discord id
          if(user != undefined)
          {
            //TODO, get rid of hardcoded canvasInstanceID
            const courses = await CanvasController.getCourses(next, user.discord.id, 'a40d37b54851efbcadb35e68bf03d698')
            .catch(()=>console.info('could not get courses for user' + user.discord.id)).then((res) =>{if(res != undefined) {return res.data;} else {return undefined;}});
            //console.log(courses);
            if(courses != undefined){
              idCourse.push({'id': user.discord.id, 'courses': courses});
            }
          }
        }
        console.log(idCourse);
        res.send(idCourse);
        next();
    });
  }
}

interface IdCourse{
  id: string,
  courses: CanvasCourse[]
}
