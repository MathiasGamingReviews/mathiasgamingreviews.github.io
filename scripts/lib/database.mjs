/**
 * @file Helpers for opening SQLite databases (node:sqlite) and running transactions.
 */

import { mkdirSync, renameSync, rmSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const TEMP_SUFFIX = '.tmp';

/**
 * Builds a database in a temporary file and moves it over `target` only on success,
 * so a failed build never damages an existing database.
 * @param {string} target Final .db path.
 * @param {(db: DatabaseSync) => void} build Fills the new, empty database.
 */
export function buildDatabaseFile(target, build) {
  const temp = target + TEMP_SUFFIX;
  mkdirSync(dirname(target), { recursive: true });
  rmSync(temp, { force: true });
  const db = openDatabase(temp);
  try {
    build(db);
    compact(db);
  } catch (error) {
    db.close();
    rmSync(temp, { force: true });
    throw error;
  }
  db.close();
  renameSync(temp, target);
}

/**
 * Opens a database file with foreign keys enforced.
 * @param {string} file Path of the .db file; created if missing (unless readOnly).
 * @param {{ readOnly?: boolean }} [options]
 * @returns {DatabaseSync}
 */
export function openDatabase(file, { readOnly = false } = {}) {
  const db = new DatabaseSync(file, { readOnly });
  db.exec('PRAGMA foreign_keys = ON;');
  return db;
}

/**
 * Runs `work` inside BEGIN/COMMIT; rolls back and rethrows on error.
 * @template T
 * @param {DatabaseSync} db
 * @param {() => T} work Synchronous function doing the database changes.
 * @returns {T} The value returned by `work`.
 */
export function transaction(db, work) {
  db.exec('BEGIN;');
  try {
    const result = work();
    db.exec('COMMIT;');
    return result;
  } catch (error) {
    db.exec('ROLLBACK;');
    throw error;
  }
}

/**
 * Prepares a file for the browser: single-file journal mode and compacted.
 * Call after all writes, before closing.
 * @param {DatabaseSync} db
 */
export function compact(db) {
  db.exec('PRAGMA journal_mode = DELETE;');
  db.exec('VACUUM;');
}

/**
 * @param {DatabaseSync} db
 * @returns {number} PRAGMA user_version (the migration level).
 */
export function getVersion(db) {
  return db.prepare('PRAGMA user_version').get().user_version;
}

/**
 * @param {DatabaseSync} db
 * @param {number} version
 */
export function setVersion(db, version) {
  db.exec(`PRAGMA user_version = ${Number(version)};`);
}

/**
 * @param {DatabaseSync} db
 * @returns {{ table: string, rows: number }[]} Row count of every table, in creation order.
 */
export function countRows(db) {
  return db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY rowid")
    .all()
    .map(({ name }) => ({ table: name, rows: db.prepare(`SELECT COUNT(*) AS n FROM "${name}"`).get().n }));
}
