/**
 * @file Local HTTP server for the edit pages. Listens on EDIT_SERVER_HOST only.
 * - SHARED.editApi.path/*: JSON API (edit-api.mjs); requires the SHARED.editApi.header request header.
 * - STATIC_FOLDERS/*: files from public/, read from disk on every request (no build step, no cache).
 * After every successful non-GET API request, db/data.sql is rewritten.
 */

import { existsSync, readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname } from 'node:path';
import {
  DEFAULT_CONTENT_TYPE,
  EDIT_SERVER_HOST,
  EDIT_SERVER_PORT,
  IMAGE_TYPES,
  PATHS,
  SHARED,
  STATIC_FOLDERS,
  STATIC_HEADERS,
} from './config.mjs';
import { openDatabase } from './database.mjs';
import { writeDump } from './dump.mjs';
import { createEditApi } from './edit-api.mjs';
import { assertLocalHost, HttpError, JSON_TYPE, resolveInside, send, STATUS } from './http.mjs';
import { applyMigrations } from './migrations.mjs';

const STATIC_PATH = new RegExp(`^/(${STATIC_FOLDERS.join('|')})/`);
const API_HEADER = SHARED.editApi.header.toLowerCase();

/**
 * Opens the database, applies pending migrations, refreshes db/data.sql and starts listening.
 * @param {{ port?: number, host?: string }} [options]
 * @returns {Promise<import('node:http').Server>} Resolves once listening.
 * @throws {Error} If the database file is missing, a migration fails, or the port is in use.
 */
export function startEditServer({ port = EDIT_SERVER_PORT, host = EDIT_SERVER_HOST } = {}) {
  if (!existsSync(PATHS.database)) {
    return Promise.reject(new Error(`${PATHS.database} does not exist. Create it with: npm run db:create`));
  }
  const db = openDatabase(PATHS.database);
  const { applied } = applyMigrations(db);
  if (applied.length) {
    console.log(`Database updated: ${applied.join(', ')}`);
  }
  writeDump(db);

  const api = createEditApi(db, { publicDir: PATHS.public });
  const server = createServer((request, response) => handleRequest(request, response, api, db));
  server.on('close', () => db.close());

  return new Promise((resolve, reject) => {
    server.once('error', (error) => {
      db.close();
      reject(
        error.code === 'EADDRINUSE'
          ? new Error(
              `The edit pages are already running in another command window (port ${port} is in use).\n` +
                'Use that window, or press Ctrl+C there first and then run "npm run edit" again.',
            )
          : error,
      );
    });
    server.listen(port, host, () => {
      console.log(`Edit server ready on http://${host}:${port}`);
      resolve(server);
    });
  });
}

/**
 * @param {import('node:http').IncomingMessage} request
 * @param {import('node:http').ServerResponse} response
 * @param {import('./edit-api.mjs').ApiHandler} api
 * @param {import('node:sqlite').DatabaseSync} db
 */
async function handleRequest(request, response, api, db) {
  try {
    assertLocalHost(request);
    const url = new URL(request.url, `http://${EDIT_SERVER_HOST}`);

    if (url.pathname.startsWith(`${SHARED.editApi.path}/`)) {
      // Custom header: browsers only let other sites send it after a CORS preflight, which this server never allows.
      if (request.headers[API_HEADER] !== SHARED.editApi.headerValue) {
        throw new HttpError(STATUS.FORBIDDEN, `Missing ${SHARED.editApi.header} header`);
      }
      const result = (await api(request, url)) ?? { ok: true };
      if (request.method !== 'GET') {
        refreshDump(db, result);
      }
      send(response, STATUS.OK, JSON_TYPE, JSON.stringify(result));
      return;
    }

    if (request.method === 'GET' && STATIC_PATH.test(url.pathname)) {
      const file = resolveInside(PATHS.public, decodeURIComponent(url.pathname));
      if (!existsSync(file)) {
        throw new HttpError(STATUS.NOT_FOUND, 'Not found');
      }
      const type = IMAGE_TYPES[extname(file).toLowerCase()] ?? DEFAULT_CONTENT_TYPE;
      send(response, STATUS.OK, type, readFileSync(file), STATIC_HEADERS);
      return;
    }
    throw new HttpError(STATUS.NOT_FOUND, 'Not found');
  } catch (error) {
    const status = error instanceof HttpError ? error.status : STATUS.INTERNAL_ERROR;
    if (status === STATUS.INTERNAL_ERROR) {
      console.error(error);
    }
    const message = error instanceof HttpError ? error.message : `Something went wrong while saving: ${error.message}`;
    send(response, status, JSON_TYPE, JSON.stringify({ error: message }));
  }
}

/**
 * Rewrites db/data.sql. The change is already committed, so a failure is reported as a warning, not an error.
 * @param {import('node:sqlite').DatabaseSync} db
 * @param {object} result API result; gets a `warning` property on failure.
 */
function refreshDump(db, result) {
  try {
    writeDump(db);
  } catch (error) {
    console.error(error);
    result.warning = `Saved, but db/data.sql could not be updated (${error.message}). Run "npm run db:dump" later.`;
  }
}
