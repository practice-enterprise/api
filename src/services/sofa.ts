import nanoDB, { DocumentScope } from 'nano';
import { Guild } from '../models/guild';

export let sofa: Sofa;
export function setSofa(db: Sofa): void {
  sofa = db;
}

export class Sofa {
  nano: nanoDB.ServerScope;

  public get db(): {
    guilds: DocumentScope<Guild>
  } {
    return {
      guilds: this.getTable('guilds')
    };
  }


  constructor(url: string) {
    this.nano = nanoDB(url);
  }

  async doMigrations(): Promise<void> {
    await Promise.all([
      this.createTableIfNotExists('guilds')
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
