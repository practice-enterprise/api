import Express from 'express';
import { applyRoutes } from './routes';
import dotenv from 'dotenv';
import { LoggingWinston } from '@google-cloud/logging-winston';
import winston from 'winston';
import { Logger } from './util/logger';
import socketIO from 'socket.io';
import { SocketManager } from './services/socket';
import { createServer } from 'http';
import { Env } from './util/env';
import { AnnouncementService } from './services/announcement-service';
import { ReminderService } from './services/reminder-service';
import { UserService } from './services/user-service';
import { CryptoUtil } from './util/crypto';
import * as settings from '../settings.json';

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

try {
  Env.validateMandatoryEnv();
} catch {
  console.error('env not properly configured');
  process.exit(-1);
}

export let WebSocket: SocketManager | undefined = undefined;

(async () => {
  await CryptoUtil.validate();
  const app = applyRoutes(Express());
  const server = createServer(app);
  const io = new socketIO.Server(server);
  WebSocket = new SocketManager(io);

  server.listen(process.env.PORT || settings.port, () => {
    Logger.info(`listening on localhost:${process.env.PORT || settings.port}`);
  });

  ReminderService.initSendReminder(settings.polling.reminderInterval);
  AnnouncementService.initAnnouncementJob(settings.polling.announcementInterval)
    .catch((err) => Logger.error(err));
  //role update + assignment reminders
  UserService.initForUsers(settings.polling.userInterval);
})();
