import { Router } from 'express';
import { sofa } from '../services/sofa';
import { CanvasCourse } from '../models/canvas'
import { CanvasController } from './canvas';
import Axios from 'axios';

export class UserController {
  static router(): Router {
    return Router({ caseSensitive: false })
      // Remove or move
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
}

// Remove or move to model
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
