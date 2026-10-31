// Rebuilds public/data/mgr.db from the readable copy in db/data.sql.
// Use it to get back an older version: first "git checkout <commit> -- db/data.sql", then run this.
// Usage: npm run db:restore -- --force   (replaces the current database)
//        npm run db:restore -- <file>    (writes the database somewhere else instead)

import { DatabaseSync } from 'node:sqlite';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const target = process.argv.slice(2).find((arg) => !arg.startsWith('--'));
const dbFile = target ? resolve(target) : join(root, 'public', 'data', 'mgr.db');

if (existsSync(dbFile)) {
  if (!process.argv.includes('--force')) {
    console.error(`${dbFile} already exists. Use --force to replace it with the contents of db/data.sql.`);
    process.exit(1);
  }
  rmSync(dbFile);
}

const db = new DatabaseSync(dbFile);
db.exec('PRAGMA journal_mode = DELETE;');
db.exec('BEGIN;' + readFileSync(join(root, 'db', 'data.sql'), 'utf8') + 'COMMIT;');
db.exec('VACUUM;');
db.close();
console.log(`Restored ${dbFile} from db/data.sql`);
