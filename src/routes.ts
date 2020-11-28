
import { Express, NextFunction, Request, Response } from 'express';
import Cors from 'cors';
import Bodyparser from 'body-parser';
import Compression from 'compression';
import { HealthController } from './controllers/health';

export function applyRoutes(express: Express): Express {
  express.disable('etag');
  express.set('trust proxy', true);

  express.use(Cors());
  express.use(Bodyparser.json());
  express.use(Compression());

  express.use('/health', HealthController.router());

  express.use((req: Request, res: Response, next: NextFunction) => {
    if (!res.writableFinished) {
      res.sendStatus(404);
    }
    next();
  });

  return express;
}
