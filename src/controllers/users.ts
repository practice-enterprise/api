import { Router } from 'express';
import { domainToASCII } from 'url';
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
      });
    }
}
