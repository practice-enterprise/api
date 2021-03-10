import { setSofa, Sofa, sofa } from './services/sofa';
import Express from 'express';
import { applyRoutes } from './routes';
import dotenv from 'dotenv';
import { LoggingWinston } from '@google-cloud/logging-winston';
import winston from 'winston';
import { Logger } from './util/logger';
import { initMesh } from './services/mesh';
import socketIO from 'socket.io';
import { ShardManager } from './services/shard';

if (process.env.NODE_ENV == null || process.env.NODE_ENV === 'develepmont') {
  dotenv.config();
  Logger.add(new winston.transports.Console({ format: winston.format.combine(winston.format.colorize(), winston.format.simple()) , level: 'debug' }));
  winston.addColors({
    warn: 'yellow',
    error: 'red',
    crit: 'red',
    info: 'blue'
  });
} else {
  Logger.add(new LoggingWinston({ projectId: process.env.PROJECT_ID, logName: 'discord-canvas', prefix: 'api' }));
  Logger.exceptions.handle(new LoggingWinston({ projectId: process.env.PROJECT_ID, logName: 'discord-canvas', prefix: 'api' }));
}

(async () => {
  setSofa(new Sofa(process.env.COUCHDB || 'http://admin:admin@localhost:5984'));
  await sofa.doMigrations();
    
  const app = applyRoutes(Express());
  const server = require('http').createServer(app);
  const io = new socketIO.Server(server);
  const shardManager = new ShardManager(io);

  server.listen(process.env.PORT || 3000, () => {
    Logger.info(`listening on localhost:${process.env.PORT || 3000}`);
  });
})();
