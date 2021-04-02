import nanoDB, { DocumentScope } from 'nano';
import { CanvasInstance } from '../models/canvas';
import { Config } from '../models/config';
import { Guild } from '../models/guild';
import { Notes } from '../models/notes';
import { Reminder } from '../models/reminder';

export let sofa: Sofa;
export function setSofa(db: Sofa): void {
  sofa = db;
}

export class Sofa {
  nano: nanoDB.ServerScope;

  public get db(): {
    canvas: DocumentScope<CanvasInstance>
    config: DocumentScope<Config>,
    guilds: DocumentScope<Guild>,
    notes: DocumentScope<Notes>,
    reminders: DocumentScope<Reminder>,
  } {
    return {
      canvas: this.getTable('canvas'),
      config: this.getTable('config'),
      guilds: this.getTable('guilds'),
      notes: this.getTable('notes'),
      reminders: this.getTable('reminders'),
    };
  }

  constructor(url: string) {
    this.nano = nanoDB(url);
  }

  async doMigrations(): Promise<void> {
    await Promise.all([
      this.createTableIfNotExists('canvas'),
      this.createTableIfNotExists('config'),
      this.createTableIfNotExists('guilds'),
      this.createTableIfNotExists('notes'),
      this.createTableIfNotExists('reminders'),
    ]);
  }

  async createTableIfNotExists(table: string): Promise<void> {
    const tables = await this.nano.db.list();
    if (!tables.includes(table)) {
      await this.nano.db.create(table);
    }
  }

  async destroy(): Promise<void> {
    await Promise.all(Object.keys(this.db).map((db) => this.nano.db.destroy(db)));
  }

  getTable<T>(name: string): nanoDB.DocumentScope<T> {
    return this.nano.use<T>(name);
  }
}
