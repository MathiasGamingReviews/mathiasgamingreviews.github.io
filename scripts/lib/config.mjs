/**
 * @file Paths, network settings and limits for the Node scripts.
 * Settings shared with the Angular app are read from config/shared.json.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Repository root folder. */
export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'));

/** Contents of config/shared.json (also imported by src/app/core/site.config.ts). */
export const SHARED = readJson(join(ROOT, 'config', 'shared.json'));

/** Absolute paths of the files and folders the scripts work with. */
export const PATHS = {
  public: join(ROOT, 'public'),
  database: join(ROOT, 'public', ...SHARED.databaseFile.split('/')),
  schema: join(ROOT, 'db', 'schema.sql'),
  migrations: join(ROOT, 'db', 'migrations'),
  sampleData: join(ROOT, 'db', 'sample-data.sql'),
  dump: join(ROOT, 'db', 'data.sql'),
  proxyConfig: join(ROOT, 'proxy.conf.json'),
  angularCli: join(ROOT, 'node_modules', '@angular', 'cli', 'bin', 'ng.js'),
};

/** Edit server address: the target of the edit API entry in proxy.conf.json (single source of truth). */
const editServerUrl = new URL(readJson(PATHS.proxyConfig)[SHARED.editApi.path].target);
export const EDIT_SERVER_HOST = editServerUrl.hostname;
export const EDIT_SERVER_PORT = Number(editServerUrl.port);

/** Host header values accepted by the edit server; anything else is refused (DNS rebinding protection). */
export const LOCAL_HOST_NAMES = ['localhost', '127.0.0.1', '[::1]'];

/** Folder (under public/) of each static file type the edit server serves directly from disk. */
export const STATIC_FOLDERS = ['data', 'logos', 'screenshots'];

/** Upload folders under public/, by upload kind. */
export const UPLOAD_FOLDERS = { logo: 'logos', screenshot: 'screenshots' };

/** Screenshot subfolder used when the review has no web address yet. */
export const UNSORTED_FOLDER = 'unsorted';

/** Content types of the image files the site uses, by extension. */
export const IMAGE_TYPES = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

/** Extensions accepted for uploads (config/shared.json). SVG is excluded: it can contain scripts. */
export const UPLOAD_EXTENSIONS = SHARED.uploadExtensions;

/** Content type for static files that are not images (e.g. the .db file). */
export const DEFAULT_CONTENT_TYPE = 'application/octet-stream';

/** Headers on every static file: no caching (edits show at once), no MIME sniffing, no scripts in SVGs. */
export const STATIC_HEADERS = {
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'Content-Security-Policy': "script-src 'none'",
};

export const MEGABYTE = 1024 * 1024;

/** Request body limits in bytes. */
export const MAX_UPLOAD_BYTES = 10 * MEGABYTE;
export const MAX_JSON_BYTES = 1 * MEGABYTE;

/** PRAGMA user_version of a database created from db/schema.sql alone. */
export const SCHEMA_VERSION = 1;
