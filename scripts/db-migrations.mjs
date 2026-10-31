// Brings a database up to date by running the db/migrations/NNN-*.sql files it has not had yet.
// The database remembers its version number in PRAGMA user_version.
// db/schema.sql is version 1; each migration file's number is the version it creates.

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export function applyMigrations(db, root) {
  const folder = join(root, 'db', 'migrations');
  // Databases made before migrations existed have user_version 0 but already contain version 1.
  let version = db.prepare('PRAGMA user_version').get().user_version || 1;
  const applied = [];

  const migrations = readdirSync(folder)
    .filter((file) => /^\d+-.*\.sql$/.test(file))
    .map((file) => ({ file, number: parseInt(file, 10) }))
    .sort((a, b) => a.number - b.number);

  for (const { file, number } of migrations) {
    if (number <= version) {
      continue;
    }
    db.exec('BEGIN;');
    try {
      db.exec(readFileSync(join(folder, file), 'utf8'));
      db.exec(`PRAGMA user_version = ${number};`);
      db.exec('COMMIT;');
    } catch (error) {
      db.exec('ROLLBACK;');
      throw new Error(`Migration ${file} failed, database left at version ${version}: ${error.message}`);
    }
    version = number;
    applied.push(file);
  }
  return { version, applied };
}
