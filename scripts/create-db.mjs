// Creates public/data/mgr.db from db/schema.sql and db/sample-data.sql.
// Usage: npm run db:create            (refuses to replace an existing database)
//        npm run db:create -- --force (replaces it - all edits in it are lost)

import { DatabaseSync } from 'node:sqlite';
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dbFile = join(root, 'public', 'data', 'mgr.db');

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
db.exec('BEGIN;' + readFileSync(join(root, 'db', 'sample-data.sql'), 'utf8') + 'COMMIT;');

for (const table of ['platform', 'game', 'review', 'news']) {
  const { n } = db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get();
  console.log(`${table}: ${n} rows`);
}
db.exec('VACUUM;');
db.close();
console.log(`Created ${dbFile}`);
