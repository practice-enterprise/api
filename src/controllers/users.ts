import { Router } from 'express';
<<<<<<< HEAD
import { sofa } from '../services/sofa';
import { CanvasCourse } from '../models/canvas'
import { CanvasController } from './canvas';
import Axios from 'axios';
import { DiscordService, UserGuild } from '../services/discord';

=======
import { CanvasCourse } from '../models/canvas'
import { CanvasController } from './canvas';
import Axios from 'axios';
import { User } from '../models/users';
import { Collections, db } from '../services/database';
>>>>>>> 858e1df73f72c302b4c295e8f355fe4999e86e21

export class UserController {
  static router(): Router {
    return Router({ caseSensitive: false })
      // Remove or move
      .get('/update/roles', async (req, res, next) => {
        const users = (await db.collection(Collections.users).get()).docs.map((d) => d.data());
        const configs = (await db.collection(Collections.guilds).get()).docs.map((d) => d.data());
        
<<<<<<< HEAD
        const configs = await sofa.db.guilds.list({ include_docs: true }).then((users) => {return (users.rows.map((d) => d.doc).filter(r => r !== undefined)) });
        
        for (const user of userDefined) {
          if (user != undefined && user.discord.token != undefined) {
=======
        const idCourse: IdCourse[] = []
        for (const user of users) {
          if (user != undefined) {
>>>>>>> 858e1df73f72c302b4c295e8f355fe4999e86e21
            
            const guilds = DiscordService.getGuilds(user.discord.token);
            
            let validGuildConfigs: UserGuild[] = []
            if(Array.isArray(guilds) && Array.isArray(configs)){
              validGuildConfigs = guilds.filter(g => configs.map(c => c?._id).includes(g.id));
            } 
            console.log(validGuildConfigs)

            //TODO, get rid of hardcoded canvasInstanceID
            const courses = await CanvasController.getCourses(user.discord.id, 'a40d37b54851efbcadb35e68bf03d698');
            //console.log(courses);
            if (courses != undefined) {
              idCourse.push({ 'id': user.discord.id, 'courses': courses });
            }
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

