// Adds new tables/columns from db/migrations to public/data/mgr.db without touching the data in it.
// Usage: npm run db:migrate

import { DatabaseSync } from 'node:sqlite';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyMigrations } from './db-migrations.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dbFile = join(root, 'public', 'data', 'mgr.db');

if (!existsSync(dbFile)) {
  console.error(`${dbFile} does not exist. Run npm run db:create first.`);
  process.exit(1);
}

const db = new DatabaseSync(dbFile);
db.exec('PRAGMA foreign_keys = ON;');
const { version, applied } = applyMigrations(db, root);
db.close();

console.log(applied.length ? `Applied: ${applied.join(', ')}` : 'Already up to date.');
console.log(`Database is at version ${version}.`);
