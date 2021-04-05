
import { Express, NextFunction, Request, Response } from 'express';
import Cors from 'cors';
import Bodyparser from 'body-parser';
import Compression from 'compression';
import { HealthController } from './controllers/health';
import { GuildController } from './controllers/guild';
import { ReminderController } from './controllers/reminder';
import { NotesController } from './controllers/notes';
import { ConfigController } from './controllers/config';
import { CanvasController } from './controllers/canvas';
import { OauthController } from './controllers/oauth';

export function applyRoutes(express: Express): Express {
  express.disable('etag');
  express.set('trust proxy', true);

  express.use(Cors());
  express.use(Bodyparser.json());
  express.use(Compression());

  express.use('/health', HealthController.router());
  express.use('/canvas', CanvasController.router());
  express.use('/config', ConfigController.router());
  express.use('/guilds', GuildController.router());
  express.use('/notes', NotesController.router());
  express.use('/reminders', ReminderController.router());
  express.use('/oauth2', OauthController.router());

  express.use((req: Request, res: Response, next: NextFunction) => {
    if (!res.writableFinished) {
      res.sendStatus(404);
    }
    next();
  });

  return express;
}
