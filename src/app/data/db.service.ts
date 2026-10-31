import { Injectable } from '@angular/core';
import initSqlJs, { Database, SqlValue } from 'sql.js';

/** Loads public/data/mgr.db into the browser once and runs SQL queries against it. */
@Injectable({ providedIn: 'root' })
export class DbService {
  private db?: Promise<Database>;

  async query<T>(sql: string, params: SqlValue[] = []): Promise<T[]> {
    const db = await this.open();
    const statement = db.prepare(sql);
    try {
      statement.bind(params);
      const rows: T[] = [];
      while (statement.step()) {
        rows.push(statement.getAsObject() as T);
      }
      return rows;
    } finally {
      statement.free();
    }
  }

  private open(): Promise<Database> {
    this.db ??= (async () => {
      const [SQL, file] = await Promise.all([
        // The .wasm file is copied to the site root by angular.json.
        initSqlJs({ locateFile: (name) => name }),
        // no-cache: always check for a newer database after a deploy.
        fetch('data/mgr.db', { cache: 'no-cache' }).then((response) => {
          if (!response.ok) {
            throw new Error(`Could not load data/mgr.db (${response.status})`);
          }
          return response.arrayBuffer();
        }),
      ]);
      return new SQL.Database(new Uint8Array(file));
    })();
    return this.db;
  }
}
