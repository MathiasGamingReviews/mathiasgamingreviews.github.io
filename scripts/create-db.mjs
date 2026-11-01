/**
 * @file npm run db:create - creates the database from db/schema.sql, db/migrations and db/sample-data.sql.
 *
 * Usage:
 *   npm run db:create                  refuses to replace an existing database
 *   npm run db:create -- --force       replaces public/data/mgr.db (all its data is lost)
 *   npm run db:create -- <file>        writes to another file instead
 */

import { readFileSync } from 'node:fs';
import { PATHS, SCHEMA_VERSION } from './lib/config.mjs';
import { runCommand, targetDatabase } from './lib/cli.mjs';
import { buildDatabaseFile, countRows, openDatabase, setVersion, transaction } from './lib/database.mjs';
import { applyMigrations } from './lib/migrations.mjs';

await runCommand(() => {
  const target = targetDatabase(PATHS.database, 'Use --force to replace it (this deletes everything in it).');
  let version = SCHEMA_VERSION;
  buildDatabaseFile(target, (db) => {
    db.exec(readFileSync(PATHS.schema, 'utf8'));
    setVersion(db, SCHEMA_VERSION);
    version = applyMigrations(db).version;
    transaction(db, () => db.exec(readFileSync(PATHS.sampleData, 'utf8')));
  });

  const db = openDatabase(target, { readOnly: true });
  for (const { table, rows } of countRows(db)) {
    console.log(`${table}: ${rows} rows`);
  }
  db.close();
  console.log(`Created ${target} (version ${version})`);
});
