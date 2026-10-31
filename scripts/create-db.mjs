// Creates public/data/mgr.db from db/schema.sql, db/migrations and db/sample-data.sql.
// Usage: npm run db:create            (refuses to replace an existing database)
//        npm run db:create -- --force (replaces it - all edits in it are lost)
//        npm run db:create -- <file>  (creates a database somewhere else, e.g. for testing)

import { DatabaseSync } from 'node:sqlite';
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyMigrations } from './db-migrations.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const target = process.argv.slice(2).find((arg) => !arg.startsWith('--'));
const dbFile = target ? resolve(target) : join(root, 'public', 'data', 'mgr.db');

if (existsSync(dbFile)) {
  if (!process.argv.includes('--force')) {
    console.error(`${dbFile} already exists. Use --force to replace it (this deletes everything in it).`);
    process.exit(1);
  }
  rmSync(dbFile);
}
mkdirSync(dirname(dbFile), { recursive: true });

const db = new DatabaseSync(dbFile);
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = DELETE;');
db.exec(readFileSync(join(root, 'db', 'schema.sql'), 'utf8'));
db.exec('PRAGMA user_version = 1;');
const { version } = applyMigrations(db, root);
db.exec('BEGIN;' + readFileSync(join(root, 'db', 'sample-data.sql'), 'utf8') + 'COMMIT;');

for (const table of ['platform', 'game', 'review', 'review_screenshot', 'review_link', 'news']) {
  const { n } = db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get();
  console.log(`${table}: ${n} rows`);
}
db.exec('VACUUM;');
db.close();
console.log(`Created ${dbFile} (version ${version})`);
