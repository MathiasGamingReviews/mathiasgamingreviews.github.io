/**
 * @file JSON API behind the /admin edit pages: routes, database changes and image uploads.
 * All paths below are relative to SHARED.editApi.path (e.g. GET /reviews is GET /api/reviews).
 *
 *   GET    /options               games and platforms for the review form
 *   GET    /reviews               review list for the overview
 *   GET    /reviews/:id           one review with screenshots and links
 *   POST   /reviews               create a review
 *   PUT    /reviews/:id           replace a review
 *   DELETE /reviews/:id           delete a review
 *   GET    /news                  news list for the overview
 *   GET    /news/:id              one news item
 *   POST   /news                  create a news item
 *   PUT    /news/:id              replace a news item
 *   DELETE /news/:id              delete a news item
 *   POST   /upload?kind=&name=&review=   store an image; body is the raw file
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { MAX_UPLOAD_BYTES, SHARED, UNSORTED_FOLDER, UPLOAD_EXTENSIONS, UPLOAD_FOLDERS } from './config.mjs';
import { transaction } from './database.mjs';
import { HttpError, readBody, readJson, STATUS } from './http.mjs';
import { slugify } from './slugify.mjs';
import { validateNews, validateReview } from './validation.mjs';

const REVIEW_SUMMARY_SQL = `
  SELECT r.id, r.slug, g.name, p.name AS platform, r.stars, r.review_date AS reviewDate
  FROM review r JOIN game g ON g.id = r.game_id JOIN platform p ON p.id = r.platform_id
  ORDER BY r.review_date DESC, r.id DESC`;

const REVIEW_SQL = `
  SELECT r.id, r.slug, g.name AS gameName, g.logo, r.platform_id AS platformId, p.name AS platform,
         r.stars, r.review_date AS reviewDate, r.body
  FROM review r JOIN game g ON g.id = r.game_id JOIN platform p ON p.id = r.platform_id
  WHERE r.id = ?`;

/**
 * @typedef {(request: import('node:http').IncomingMessage, url: URL) => Promise<unknown>} ApiHandler
 * Handles one API request; resolves with the JSON response value (undefined for "ok").
 */

/**
 * @param {import('node:sqlite').DatabaseSync} db Open database (foreign keys on).
 * @param {{ publicDir: string }} options publicDir: folder uploads are written into.
 * @returns {ApiHandler}
 */
export function createEditApi(db, { publicDir }) {
  const one = (sql, ...params) => db.prepare(sql).get(...params);
  const all = (sql, ...params) => db.prepare(sql).all(...params);
  const run = (sql, ...params) => db.prepare(sql).run(...params);

  /** Deletes games that no longer have a review. */
  function removeUnusedGames() {
    run('DELETE FROM game WHERE id NOT IN (SELECT game_id FROM review)');
  }

  /**
   * @param {string} name
   * @param {string} logo New logo path, or '' to keep the current one.
   * @returns {number} Id of the game with this name (case-insensitive), created if missing.
   */
  function saveGame(name, logo) {
    const existing = one('SELECT id FROM game WHERE name = ? COLLATE NOCASE', name);
    if (!existing) {
      return Number(
        run('INSERT INTO game (name, logo) VALUES (?, ?)', name, logo || SHARED.defaultLogo).lastInsertRowid,
      );
    }
    if (logo) {
      run('UPDATE game SET logo = ? WHERE id = ?', logo, existing.id);
    }
    return existing.id;
  }

  /**
   * Creates (id null) or replaces a review, including its screenshots and links.
   * @param {number | null} id
   * @param {unknown} input Request body.
   * @returns {{ id: number, slug: string }}
   */
  function saveReview(id, input) {
    const review = validateReview(input);
    return transaction(db, () => {
      // Platforms are a fixed lookup list (db/migrations/003-prepopulate-platforms.sql).
      if (!one('SELECT id FROM platform WHERE id = ?', review.platformId)) {
        throw new HttpError(STATUS.BAD_REQUEST, 'Please choose a platform from the list.');
      }
      if (one('SELECT id FROM review WHERE slug = ? AND id IS NOT ?', review.slug, id)) {
        throw new HttpError(
          STATUS.BAD_REQUEST,
          `Another review already uses the web address "${review.slug}". Please choose a different one.`,
        );
      }
      const gameId = saveGame(review.gameName, review.logo);
      const values = [review.slug, gameId, review.platformId, review.stars, review.reviewDate, review.body];

      if (id === null) {
        id = Number(
          run(
            'INSERT INTO review (slug, game_id, platform_id, stars, review_date, body) VALUES (?, ?, ?, ?, ?, ?)',
            ...values,
          ).lastInsertRowid,
        );
      } else if (
        !run(
          'UPDATE review SET slug = ?, game_id = ?, platform_id = ?, stars = ?, review_date = ?, body = ? WHERE id = ?',
          ...values,
          id,
        ).changes
      ) {
        throw new HttpError(STATUS.NOT_FOUND, 'This review no longer exists.');
      }

      run('DELETE FROM review_screenshot WHERE review_id = ?', id);
      review.screenshots.forEach((shot, position) =>
        run(
          'INSERT INTO review_screenshot (review_id, position, file, name, description) VALUES (?, ?, ?, ?, ?)',
          id,
          position,
          shot.file,
          shot.name,
          shot.description,
        ),
      );
      run('DELETE FROM review_link WHERE review_id = ?', id);
      review.links.forEach((link, position) =>
        run(
          'INSERT INTO review_link (review_id, position, url, description) VALUES (?, ?, ?, ?)',
          id,
          position,
          link.url,
          link.description,
        ),
      );
      removeUnusedGames();
      return { id, slug: review.slug };
    });
  }

  /**
   * @param {number} id
   * @returns {object} Review with screenshots and links.
   * @throws {HttpError} 404
   */
  function getReview(id) {
    const review = one(REVIEW_SQL, id);
    if (!review) {
      throw new HttpError(STATUS.NOT_FOUND, 'This review does not exist.');
    }
    review.screenshots = all(
      'SELECT file, name, description FROM review_screenshot WHERE review_id = ? ORDER BY position, id',
      id,
    );
    review.links = all('SELECT url, description FROM review_link WHERE review_id = ? ORDER BY position, id', id);
    return review;
  }

  /**
   * @param {number} id
   */
  function deleteReview(id) {
    transaction(db, () => {
      run('DELETE FROM review WHERE id = ?', id);
      removeUnusedGames();
    });
  }

  /**
   * @param {number} id
   * @returns {object} News item.
   * @throws {HttpError} 404
   */
  function getNews(id) {
    const news = one('SELECT id, title, body, news_date AS newsDate FROM news WHERE id = ?', id);
    if (!news) {
      throw new HttpError(STATUS.NOT_FOUND, 'This news item does not exist.');
    }
    return news;
  }

  /**
   * Creates (id null) or replaces a news item.
   * @param {number | null} id
   * @param {unknown} input Request body.
   * @returns {{ id: number }}
   */
  function saveNews(id, input) {
    const { title, body, newsDate } = validateNews(input);
    if (id === null) {
      return {
        id: Number(
          run('INSERT INTO news (title, body, news_date) VALUES (?, ?, ?)', title, body, newsDate).lastInsertRowid,
        ),
      };
    }
    if (!run('UPDATE news SET title = ?, body = ?, news_date = ? WHERE id = ?', title, body, newsDate, id).changes) {
      throw new HttpError(STATUS.NOT_FOUND, 'This news item no longer exists.');
    }
    return { id };
  }

  /**
   * Stores the request body as an image under public/. Existing files are never overwritten (-2, -3... suffix).
   * @param {import('node:http').IncomingMessage} request
   * @param {URL} url Query: kind (logo|screenshot), name (original file name), review (slug, screenshots only).
   * @returns {Promise<{ file: string }>} Path relative to public/, e.g. 'screenshots/hades-pc/boss.png'.
   */
  async function upload(request, url) {
    const kind = url.searchParams.get('kind');
    const original = url.searchParams.get('name') ?? '';
    const ext = extname(original).toLowerCase();
    if (!UPLOAD_EXTENSIONS.includes(ext)) {
      throw new HttpError(
        STATUS.BAD_REQUEST,
        `"${original}" is not a supported image. Use one of: ${UPLOAD_EXTENSIONS.join(', ')}`,
      );
    }
    if (!Object.hasOwn(UPLOAD_FOLDERS, kind)) {
      throw new HttpError(STATUS.BAD_REQUEST, 'Unknown upload kind');
    }
    const folder =
      kind === 'screenshot'
        ? `${UPLOAD_FOLDERS.screenshot}/${slugify(url.searchParams.get('review') ?? '') || UNSORTED_FOLDER}`
        : UPLOAD_FOLDERS[kind];

    const data = await readBody(request, MAX_UPLOAD_BYTES);
    if (data.length === 0) {
      throw new HttpError(STATUS.BAD_REQUEST, 'The file is empty.');
    }
    mkdirSync(join(publicDir, folder), { recursive: true });
    const base = slugify(original.slice(0, -ext.length)) || 'image';
    let file = `${folder}/${base}${ext}`;
    for (let copy = 2; existsSync(join(publicDir, file)); copy++) {
      file = `${folder}/${base}-${copy}${ext}`;
    }
    writeFileSync(join(publicDir, file), data);
    return { file };
  }

  /** Route table: [method, path pattern, handler]. Captured ids are passed as numbers. */
  const routes = [
    [
      'GET',
      /^\/options$/,
      () => ({
        games: all('SELECT name, logo FROM game ORDER BY name COLLATE NOCASE'),
        platforms: all('SELECT id, name FROM platform ORDER BY name COLLATE NOCASE'),
      }),
    ],
    ['GET', /^\/reviews$/, () => all(REVIEW_SUMMARY_SQL)],
    ['GET', /^\/reviews\/(\d+)$/, (request, url, id) => getReview(id)],
    ['POST', /^\/reviews$/, async (request) => saveReview(null, await readJson(request))],
    ['PUT', /^\/reviews\/(\d+)$/, async (request, url, id) => saveReview(id, await readJson(request))],
    ['DELETE', /^\/reviews\/(\d+)$/, (request, url, id) => deleteReview(id)],
    [
      'GET',
      /^\/news$/,
      () => all('SELECT id, title, news_date AS newsDate FROM news ORDER BY news_date DESC, id DESC'),
    ],
    ['GET', /^\/news\/(\d+)$/, (request, url, id) => getNews(id)],
    ['POST', /^\/news$/, async (request) => saveNews(null, await readJson(request))],
    ['PUT', /^\/news\/(\d+)$/, async (request, url, id) => saveNews(id, await readJson(request))],
    ['DELETE', /^\/news\/(\d+)$/, (request, url, id) => void run('DELETE FROM news WHERE id = ?', id)],
    ['POST', /^\/upload$/, (request, url) => upload(request, url)],
  ];

  return async function handle(request, url) {
    const path = url.pathname.slice(SHARED.editApi.path.length);
    for (const [method, pattern, handler] of routes) {
      const match = request.method === method && path.match(pattern);
      if (match) {
        return handler(request, url, match[1] === undefined ? undefined : Number(match[1]));
      }
    }
    throw new HttpError(STATUS.NOT_FOUND, 'Not found');
  };
}
