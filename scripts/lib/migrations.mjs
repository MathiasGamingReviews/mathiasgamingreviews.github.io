/**
 * @file Applies db/migrations/NNN-*.sql files to a database.
 * The database version is PRAGMA user_version; db/schema.sql is version SCHEMA_VERSION,
 * and each migration file's number is the version it produces.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PATHS, SCHEMA_VERSION } from './config.mjs';
import { getVersion, setVersion, transaction } from './database.mjs';

const MIGRATION_FILE = /^\d+-.*\.sql$/;

/**
 * @param {string} folder
 * @returns {{ file: string, number: number }[]} Migration files sorted by number.
 */
export function listMigrations(folder = PATHS.migrations) {
  return readdirSync(folder)
    .filter((file) => MIGRATION_FILE.test(file))
    .map((file) => ({ file, number: parseInt(file, 10) }))
    .sort((a, b) => a.number - b.number);
}

/**
 * Applies every migration newer than the database version, each in its own transaction.
 * @param {import('node:sqlite').DatabaseSync} db Database already containing db/schema.sql.
 * @param {string} [folder] Migrations folder.
 * @returns {{ version: number, applied: string[] }} Final version and the files applied.
 * @throws {Error} If the database has no schema, or a migration fails (that migration is rolled back).
 */
export function applyMigrations(db, folder = PATHS.migrations) {
  let version = getVersion(db);
  if (version === 0) {
    // Version 0 with tables: created before user_version was used, i.e. the schema version.
    if (!hasTables(db)) {
      throw new Error('The database is empty. Create it with: npm run db:create');
    }
    version = SCHEMA_VERSION;
  }

  const applied = [];
  for (const { file, number } of listMigrations(folder)) {
    if (number <= version) {
      continue;
    }
    try {
      transaction(db, () => {
        db.exec(readFileSync(join(folder, file), 'utf8'));
        setVersion(db, number);
      });
    } catch (error) {
      throw new Error(`Migration ${file} failed, database left at version ${version}: ${error.message}`);
    }
    version = number;
    applied.push(file);
  }
  return { version, applied };
}

/**
 * @param {import('node:sqlite').DatabaseSync} db
 * @returns {boolean} True if the database contains at least one table.
 */
function hasTables(db) {
  return Boolean(db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' LIMIT 1").get());
}
