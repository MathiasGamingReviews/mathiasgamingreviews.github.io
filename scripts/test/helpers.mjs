/**
 * @file Shared fixtures for the script tests.
 */

import { readFileSync } from 'node:fs';
import { Readable } from 'node:stream';
import { PATHS, SCHEMA_VERSION } from '../lib/config.mjs';
import { openDatabase, setVersion } from '../lib/database.mjs';
import { applyMigrations } from '../lib/migrations.mjs';

/**
 * @param {{ sampleData?: boolean }} [options] sampleData: also load db/sample-data.sql.
 * @returns {import('node:sqlite').DatabaseSync} In-memory database at the latest version.
 */
export function createTestDatabase({ sampleData = false } = {}) {
  const db = openDatabase(':memory:');
  db.exec(readFileSync(PATHS.schema, 'utf8'));
  setVersion(db, SCHEMA_VERSION);
  applyMigrations(db);
  if (sampleData) {
    db.exec(readFileSync(PATHS.sampleData, 'utf8'));
  }
  return db;
}

/**
 * @param {{ method?: string, headers?: Record<string, string>, body?: string | Buffer }} [options]
 * @returns {import('node:http').IncomingMessage} Minimal stand-in for an incoming request.
 */
export function fakeRequest({ method = 'GET', headers = {}, body = '' } = {}) {
  const request = Readable.from(body ? [Buffer.from(body)] : []);
  return Object.assign(request, { method, headers });
}

/**
 * @param {unknown} body
 * @param {string} [method]
 * @returns {import('node:http').IncomingMessage} Request with a JSON body.
 */
export function jsonRequest(body, method = 'POST') {
  return fakeRequest({ method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
}
