/**
 * @file HTTP helpers for the edit server: errors, request bodies, responses and request checks.
 */

import { join, normalize, sep } from 'node:path';
import { LOCAL_HOST_NAMES, MAX_JSON_BYTES, MEGABYTE } from './config.mjs';

/** HTTP status codes used by the edit server. */
export const STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  PAYLOAD_TOO_LARGE: 413,
  UNSUPPORTED_MEDIA_TYPE: 415,
  INTERNAL_ERROR: 500,
};

export const JSON_TYPE = 'application/json';

/** Error whose message is safe to show to the user; `status` is the HTTP status to answer with. */
export class HttpError extends Error {
  /**
   * @param {number} status
   * @param {string} message
   */
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/**
 * Reads the whole request body. Oversized bodies are drained (not buffered) so the error response still arrives.
 * @param {import('node:http').IncomingMessage} request
 * @param {number} limit Maximum size in bytes.
 * @returns {Promise<Buffer>}
 * @throws {HttpError} 413 if the body is larger than `limit`.
 */
export function readBody(request, limit) {
  const tooLarge = () =>
    new HttpError(STATUS.PAYLOAD_TOO_LARGE, `The file is too big (maximum ${Math.round(limit / MEGABYTE)} MB).`);
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let overflow = Number(request.headers['content-length']) > limit;
    request.on('data', (chunk) => {
      size += chunk.length;
      overflow ||= size > limit;
      if (!overflow) {
        chunks.push(chunk);
      }
    });
    request.on('end', () => (overflow ? reject(tooLarge()) : resolve(Buffer.concat(chunks))));
    request.on('error', reject);
  });
}

/**
 * @param {import('node:http').IncomingMessage} request
 * @returns {Promise<any>} The parsed JSON body.
 * @throws {HttpError} 415 for a non-JSON content type, 400 for invalid JSON, 413 if too large.
 */
export async function readJson(request) {
  if (!(request.headers['content-type'] ?? '').startsWith(JSON_TYPE)) {
    throw new HttpError(STATUS.UNSUPPORTED_MEDIA_TYPE, 'Expected JSON');
  }
  const body = await readBody(request, MAX_JSON_BYTES);
  try {
    return JSON.parse(body.toString('utf8'));
  } catch {
    throw new HttpError(STATUS.BAD_REQUEST, 'Invalid JSON');
  }
}

/**
 * Writes a complete response.
 * @param {import('node:http').ServerResponse} response
 * @param {number} status
 * @param {string} type Content-Type.
 * @param {string | Buffer} body
 * @param {Record<string, string>} [headers] Extra headers.
 */
export function send(response, status, type, body, headers = {}) {
  response.writeHead(status, { 'Content-Type': type, ...headers });
  response.end(body);
}

/**
 * Refuses requests whose Host header is not this computer (blocks DNS rebinding).
 * @param {import('node:http').IncomingMessage} request
 * @throws {HttpError} 403
 */
export function assertLocalHost(request) {
  const host = (request.headers.host ?? '').replace(/:\d+$/, '');
  if (!LOCAL_HOST_NAMES.includes(host)) {
    throw new HttpError(STATUS.FORBIDDEN, 'Only available on this computer');
  }
}

/**
 * Resolves a request path inside a base folder.
 * @param {string} base Absolute folder.
 * @param {string} path URL path (already decoded).
 * @returns {string} Absolute file path.
 * @throws {HttpError} 404 if the path escapes `base`.
 */
export function resolveInside(base, path) {
  const full = normalize(join(base, path));
  if (!full.startsWith(base + sep)) {
    throw new HttpError(STATUS.NOT_FOUND, 'Not found');
  }
  return full;
}
