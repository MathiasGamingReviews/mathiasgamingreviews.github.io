/**
 * @file Converts a database to readable SQL text (db/data.sql) so git can diff its contents.
 * Output: user_version, CREATE statements in creation order, then one INSERT per row in rowid order.
 */

import { writeFileSync } from 'node:fs';
import { PATHS } from './config.mjs';
import { getVersion } from './database.mjs';

const HEADER = [
  '-- Readable copy of public/data/mgr.db, rewritten by the edit server after every change.',
  '-- Do not edit by hand. Rebuild the database from this file with: npm run db:restore -- --force',
];

/**
 * @param {import('node:sqlite').DatabaseSync} db
 * @returns {string} The whole database as SQL statements.
 */
export function dumpDatabase(db) {
  const lines = [...HEADER, '', `PRAGMA user_version = ${getVersion(db)};`, ''];
  // Creation order (rowid) keeps referenced tables before the tables that reference them.
  const objects = db
    .prepare(
      "SELECT type, name, sql FROM sqlite_master WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%' ORDER BY rowid",
    )
    .all();

  for (const { sql } of objects) {
    lines.push(`${sql};`);
  }
  for (const { name } of objects.filter((object) => object.type === 'table')) {
    const rows = db.prepare(`SELECT * FROM "${name}" ORDER BY rowid`).all();
    if (rows.length === 0) {
      continue;
    }
    lines.push('', `-- ${name}`);
    for (const row of rows) {
      const columns = Object.keys(row).join(', ');
      const values = Object.values(row).map(sqlLiteral).join(', ');
      lines.push(`INSERT INTO ${name} (${columns}) VALUES (${values});`);
    }
  }
  return lines.join('\n') + '\n';
}

/**
 * Writes the dump to db/data.sql.
 * @param {import('node:sqlite').DatabaseSync} db
 * @param {string} [file] Target file.
 */
export function writeDump(db, file = PATHS.dump) {
  writeFileSync(file, dumpDatabase(db));
}

/**
 * @param {unknown} value Column value from node:sqlite.
 * @returns {string} SQL literal for the value.
 */
export function sqlLiteral(value) {
  if (value === null) {
    return 'NULL';
  }
  if (typeof value === 'number' || typeof value === 'bigint') {
    return String(value);
  }
  if (value instanceof Uint8Array) {
    return `X'${Buffer.from(value).toString('hex')}'`;
  }
  return `'${String(value).replaceAll("'", "''")}'`;
}
