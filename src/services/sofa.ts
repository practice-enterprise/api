import nanoDB, { DocumentScope } from 'nano';
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
    guilds: DocumentScope<Guild>,
    reminders: DocumentScope<Reminder>,
    notes: DocumentScope<Notes>
  } {
    return {
      guilds: this.getTable('guilds'),
      reminders: this.getTable('reminders'),
      notes: this.getTable('notes')
    };
  }

  constructor(url: string) {
    this.nano = nanoDB(url);
  }

  async doMigrations(): Promise<void> {
    await Promise.all([
      this.createTableIfNotExists('guilds'),
      this.createTableIfNotExists('reminders'),
      this.createTableIfNotExists('notes')
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
