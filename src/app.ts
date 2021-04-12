import Express from 'express';
import { applyRoutes } from './routes';
import dotenv from 'dotenv';
import { LoggingWinston } from '@google-cloud/logging-winston';
import winston from 'winston';
import { Logger } from './util/logger';
import socketIO from 'socket.io';
import { SocketManager } from './services/socket';
import { AnnouncementService } from './services/announcement-service';

if (process.env.NODE_ENV == null || process.env.NODE_ENV === 'develepmont') {
  dotenv.config();
  Logger.add(new winston.transports.Console({ format: winston.format.combine(winston.format.colorize(), winston.format.simple()), level: 'debug' }));
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

// Discord dotenv
if (process.env.D_CLIENT_ID == null) {
  console.error('Discord client ID is not defined (D_CLIENT_ID in dotenv)');
  process.exit(-1)
}
if (process.env.D_CLIENT_SECRET == null) {
  console.error('Discord client secret is not defined (D_CLIENT_SECRET in dotenv)');
  process.exit(-1)
}
if (process.env.D_REDIRECT_URI == null) {
  console.error('Discord redirect URI is not defined (D_REDIRECT_URI in dotenv)');
  process.exit(-1)
}

//Canvas dotenv
if (process.env.C_CLIENT_ID == null) {
  console.error('Canvas client ID is not defined (C_CLIENT_ID in dotenv)');
  process.exit(-1)
}
if (process.env.C_CLIENT_SECRET == null) {
  console.error('Canvas client secret is not defined (C_CLIENT_SECRET in dotenv)');
  process.exit(-1)
}
if (process.env.C_REDIRECT_URI == null) {
  console.error('Canvas redirect URI is not defined (C_REDIRECT_URI in dotenv)');
  process.exit(-1)
}

export let WebSocket: SocketManager | undefined = undefined;

(async () => {
  const app = applyRoutes(Express());
  const server = require('http').createServer(app);
  const io = new socketIO.Server(server);
  WebSocket = new SocketManager(io);

  server.listen(process.env.PORT || 3000, () => {
    Logger.info(`listening on localhost:${process.env.PORT || 3000}`);
  });

  AnnouncementService.initAnnouncementJob(60000);
})()
