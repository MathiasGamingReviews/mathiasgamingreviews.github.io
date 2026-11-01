/**
 * @file Loads the SQLite database file into the browser (sql.js) and runs queries on it.
 */

import { Injectable } from '@angular/core';
import initSqlJs, { Database, SqlValue } from 'sql.js';
import { DATABASE_URL } from '../core/site.config';

/** Loads DATABASE_URL once, on the first query, and keeps it in memory. */
@Injectable({ providedIn: 'root' })
export class DbService {
  private db?: Promise<Database>;

  /** Discards the loaded database; the next query downloads it again (used after saving in the edit pages). */
  reload(): void {
    this.db?.then((db) => db.close()).catch(() => undefined);
    this.db = undefined;
  }

  /**
   * @param sql SELECT statement with `?` placeholders.
   * @param params Values for the placeholders, in order.
   * @returns One object per row, keyed by column name or alias.
   */
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

  /** @returns The loaded database. A failed load is not cached, so the next query retries. */
  private open(): Promise<Database> {
    this.db ??= this.load().catch((error: unknown) => {
      this.db = undefined;
      throw error;
    });
    return this.db;
  }

  private async load(): Promise<Database> {
    const [SQL, file] = await Promise.all([
      // The .wasm file is copied to the site root by the assets section of angular.json.
      initSqlJs({ locateFile: (name) => name }),
      // no-cache: revalidate with the server so a new deploy is picked up.
      fetch(DATABASE_URL, { cache: 'no-cache' }).then((response) => {
        if (!response.ok) {
          throw new Error(`Could not load ${DATABASE_URL} (${response.status})`);
        }
        return response.arrayBuffer();
      }),
    ]);
    return new SQL.Database(new Uint8Array(file));
  }
}
