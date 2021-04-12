import { Firestore } from '@google-cloud/firestore';

export const db = new Firestore();

export enum Collections {
  canvas = 'canvas',
  config = 'config',
  guilds = 'guilds',
  users = 'users',
  notes = 'notes',
  reminders = 'reminders'
}
