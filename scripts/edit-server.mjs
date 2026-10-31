// Small local server behind the /admin edit pages (started by "npm run edit").
// It only accepts connections from this computer, saves changes into public/data/mgr.db,
// stores uploaded images under public/, and rewrites db/data.sql after every change.

import { DatabaseSync } from 'node:sqlite';
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { extname, join, normalize, sep } from 'node:path';
import { applyMigrations } from './db-migrations.mjs';
import { writeDump } from './db-dump.mjs';

const IMAGE_TYPES = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const MAX_JSON_BYTES = 1024 * 1024;

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function startEditServer({ root, port }) {
  const publicDir = join(root, 'public');
  const db = new DatabaseSync(join(publicDir, 'data', 'mgr.db'));
  db.exec('PRAGMA foreign_keys = ON;');
  const { applied } = applyMigrations(db, root);
  if (applied.length) {
    console.log(`Database updated: ${applied.join(', ')}`);
  }
  writeDump(db, root);

  const api = createApi(db, publicDir);

  const server = createServer(async (request, response) => {
    try {
      checkLocal(request);
      const url = new URL(request.url, 'http://localhost');

      if (url.pathname.startsWith('/api/')) {
        // Only the edit pages send this header; other websites cannot add it without permission.
        if (request.headers['x-mgr-edit'] !== '1') {
          throw new HttpError(403, 'Missing X-MGR-Edit header');
        }
        const result = await api(request, url);
        if (request.method !== 'GET') {
          writeDump(db, root);
        }
        send(response, 200, 'application/json', JSON.stringify(result ?? { ok: true }));
        return;
      }

      // Serve the database and images straight from disk so changes show up immediately.
      if (request.method === 'GET' && /^\/(data|logos|screenshots)\//.test(url.pathname)) {
        const file = safePath(publicDir, decodeURIComponent(url.pathname));
        if (!existsSync(file)) {
          throw new HttpError(404, 'Not found');
        }
        const type = IMAGE_TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream';
        send(response, 200, type, readFileSync(file), { 'Cache-Control': 'no-store' });
        return;
      }
      throw new HttpError(404, 'Not found');
    } catch (error) {
      const status = error instanceof HttpError ? error.status : 500;
      if (status === 500) {
        console.error(error);
      }
      send(response, status, 'application/json', JSON.stringify({ error: friendlyMessage(error) }));
    }
  });

  server.listen(port, '127.0.0.1', () => console.log(`Edit server ready on http://127.0.0.1:${port}`));
  return server;
}

function createApi(db, publicDir) {
  const one = (sql, ...params) => db.prepare(sql).get(...params);
  const all = (sql, ...params) => db.prepare(sql).all(...params);
  const run = (sql, ...params) => db.prepare(sql).run(...params);

  function transaction(work) {
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

  function findId(table, name) {
    const existing = one(`SELECT id FROM ${table} WHERE name = ? COLLATE NOCASE`, name);
    return existing ? existing.id : null;
  }

  function saveReview(id, input) {
    const review = validateReview(input);
    return transaction(() => {
      const platformId =
        findId('platform', review.platform) ??
        Number(run('INSERT INTO platform (name) VALUES (?)', review.platform).lastInsertRowid);

      let gameId = findId('game', review.gameName);
      if (gameId === null) {
        gameId = Number(run('INSERT INTO game (name, logo) VALUES (?, ?)', review.gameName, review.logo || 'logo.svg').lastInsertRowid);
      } else if (review.logo) {
        run('UPDATE game SET logo = ? WHERE id = ?', review.logo, gameId);
      }

      const clash = one('SELECT id FROM review WHERE slug = ? AND id IS NOT ?', review.slug, id);
      if (clash) {
        throw new HttpError(400, `Another review already uses the web address "${review.slug}". Please choose a different one.`);
      }

      if (id === null) {
        id = Number(
          run(
            'INSERT INTO review (slug, game_id, platform_id, stars, review_date, body) VALUES (?, ?, ?, ?, ?, ?)',
            review.slug, gameId, platformId, review.stars, review.reviewDate, review.body,
          ).lastInsertRowid,
        );
      } else {
        const changed = run(
          'UPDATE review SET slug = ?, game_id = ?, platform_id = ?, stars = ?, review_date = ?, body = ? WHERE id = ?',
          review.slug, gameId, platformId, review.stars, review.reviewDate, review.body, id,
        ).changes;
        if (!changed) {
          throw new HttpError(404, 'This review no longer exists.');
        }
      }

      run('DELETE FROM review_screenshot WHERE review_id = ?', id);
      review.screenshots.forEach((shot, position) =>
        run(
          'INSERT INTO review_screenshot (review_id, position, file, name, description) VALUES (?, ?, ?, ?, ?)',
          id, position, shot.file, shot.name, shot.description,
        ),
      );
      run('DELETE FROM review_link WHERE review_id = ?', id);
      review.links.forEach((link, position) =>
        run('INSERT INTO review_link (review_id, position, url, description) VALUES (?, ?, ?, ?)', id, position, link.url, link.description),
      );
      removeUnusedGames();
      return { id, slug: review.slug };
    });
  }

  function removeUnusedGames() {
    // A game without reviews (e.g. after renaming or deleting) is no longer shown anywhere.
    run('DELETE FROM game WHERE id NOT IN (SELECT game_id FROM review)');
  }

  function saveNews(id, input) {
    const news = validateNews(input);
    if (id === null) {
      return { id: Number(run('INSERT INTO news (title, body, news_date) VALUES (?, ?, ?)', news.title, news.body, news.newsDate).lastInsertRowid) };
    }
    if (!run('UPDATE news SET title = ?, body = ?, news_date = ? WHERE id = ?', news.title, news.body, news.newsDate, id).changes) {
      throw new HttpError(404, 'This news item no longer exists.');
    }
    return { id };
  }

  function upload(request, url) {
    const kind = url.searchParams.get('kind');
    const original = url.searchParams.get('name') ?? '';
    const ext = extname(original).toLowerCase();
    if (!IMAGE_TYPES[ext]) {
      throw new HttpError(400, `"${original}" is not a supported image. Use PNG, JPG, GIF, WEBP or SVG.`);
    }
    let folder;
    if (kind === 'logo') {
      folder = 'logos';
    } else if (kind === 'screenshot') {
      folder = `screenshots/${slugify(url.searchParams.get('review') ?? '') || 'unsorted'}`;
    } else {
      throw new HttpError(400, 'Unknown upload kind');
    }
    return readBody(request, MAX_UPLOAD_BYTES).then((data) => {
      if (data.length === 0) {
        throw new HttpError(400, 'The file is empty.');
      }
      mkdirSync(join(publicDir, folder), { recursive: true });
      const base = slugify(original.slice(0, -ext.length)) || 'image';
      let file = `${folder}/${base}${ext}`;
      for (let n = 2; existsSync(join(publicDir, file)); n++) {
        file = `${folder}/${base}-${n}${ext}`;
      }
      writeFileSync(join(publicDir, file), data);
      return { file };
    });
  }

  return async function handle(request, url) {
    const path = url.pathname.replace(/^\/api/, '');
    const method = request.method;
    let match;

    if (method === 'GET' && path === '/options') {
      return {
        games: all('SELECT name, logo FROM game ORDER BY name COLLATE NOCASE'),
        platforms: all('SELECT name FROM platform ORDER BY name COLLATE NOCASE').map((row) => row.name),
      };
    }

    if (method === 'GET' && path === '/reviews') {
      return all(`
        SELECT r.id, r.slug, g.name, p.name AS platform, r.stars, r.review_date AS reviewDate
        FROM review r JOIN game g ON g.id = r.game_id JOIN platform p ON p.id = r.platform_id
        ORDER BY r.review_date DESC, r.id DESC`);
    }
    if ((match = path.match(/^\/reviews\/(\d+)$/)) && method === 'GET') {
      const id = Number(match[1]);
      const review = one(`
        SELECT r.id, r.slug, g.name AS gameName, g.logo, p.name AS platform, r.stars, r.review_date AS reviewDate, r.body
        FROM review r JOIN game g ON g.id = r.game_id JOIN platform p ON p.id = r.platform_id
        WHERE r.id = ?`, id);
      if (!review) {
        throw new HttpError(404, 'This review does not exist.');
      }
      review.screenshots = all('SELECT file, name, description FROM review_screenshot WHERE review_id = ? ORDER BY position, id', id);
      review.links = all('SELECT url, description FROM review_link WHERE review_id = ? ORDER BY position, id', id);
      return review;
    }
    if (method === 'POST' && path === '/reviews') {
      return saveReview(null, await readJson(request));
    }
    if ((match = path.match(/^\/reviews\/(\d+)$/)) && method === 'PUT') {
      return saveReview(Number(match[1]), await readJson(request));
    }
    if ((match = path.match(/^\/reviews\/(\d+)$/)) && method === 'DELETE') {
      return transaction(() => {
        run('DELETE FROM review WHERE id = ?', Number(match[1]));
        removeUnusedGames();
      });
    }

    if (method === 'GET' && path === '/news') {
      return all('SELECT id, title, news_date AS newsDate FROM news ORDER BY news_date DESC, id DESC');
    }
    if ((match = path.match(/^\/news\/(\d+)$/)) && method === 'GET') {
      const news = one('SELECT id, title, body, news_date AS newsDate FROM news WHERE id = ?', Number(match[1]));
      if (!news) {
        throw new HttpError(404, 'This news item does not exist.');
      }
      return news;
    }
    if (method === 'POST' && path === '/news') {
      return saveNews(null, await readJson(request));
    }
    if ((match = path.match(/^\/news\/(\d+)$/)) && method === 'PUT') {
      return saveNews(Number(match[1]), await readJson(request));
    }
    if ((match = path.match(/^\/news\/(\d+)$/)) && method === 'DELETE') {
      run('DELETE FROM news WHERE id = ?', Number(match[1]));
      return;
    }

    if (method === 'POST' && path === '/upload') {
      return upload(request, url);
    }
    throw new HttpError(404, 'Not found');
  };
}

function validateReview(input) {
  const text = (value) => (typeof value === 'string' ? value.trim() : '');
  const review = {
    gameName: text(input.gameName),
    platform: text(input.platform),
    logo: text(input.logo),
    slug: slugify(text(input.slug)),
    stars: Number(input.stars),
    reviewDate: text(input.reviewDate),
    body: text(input.body),
    screenshots: (Array.isArray(input.screenshots) ? input.screenshots : []).map((shot) => ({
      file: text(shot?.file),
      name: text(shot?.name),
      description: text(shot?.description),
    })),
    links: (Array.isArray(input.links) ? input.links : []).map((link) => ({
      url: text(link?.url),
      description: text(link?.description),
    })),
  };
  check(review.gameName, 'Please enter the name of the game.');
  check(review.platform, 'Please enter the platform.');
  check(review.slug, 'Please enter the web address.');
  check(Number.isInteger(review.stars) && review.stars >= 1 && review.stars <= 5, 'Stars must be between 1 and 5.');
  check(isDate(review.reviewDate), 'Please enter the review date.');
  check(review.body, 'Please write the review.');
  check(!review.logo || isImagePath(review.logo), 'The logo is not a valid image.');
  for (const shot of review.screenshots) {
    check(isImagePath(shot.file), 'One of the screenshots is not a valid image.');
    check(shot.name, 'Every screenshot needs a name.');
  }
  for (const link of review.links) {
    check(/^https?:\/\/\S+$/i.test(link.url), `"${link.url}" is not a web address. Links must start with http:// or https://`);
    check(link.description, 'Every link needs a description.');
  }
  return review;
}

function validateNews(input) {
  const text = (value) => (typeof value === 'string' ? value.trim() : '');
  const news = { title: text(input.title), body: text(input.body), newsDate: text(input.newsDate) };
  check(news.title, 'Please enter a title.');
  check(isDate(news.newsDate), 'Please enter the date.');
  check(news.body, 'Please write the news text.');
  return news;
}

function check(condition, message) {
  if (!condition) {
    throw new HttpError(400, message);
  }
}

function isDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

function isImagePath(value) {
  return /^(logos|screenshots)\/[a-z0-9/_-]+\.[a-z]+$/i.test(value) && !value.includes('..') && Boolean(IMAGE_TYPES[extname(value).toLowerCase()]);
}

export function slugify(value) {
  return value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function checkLocal(request) {
  // Refuse anything that did not come from this computer (also blocks "DNS rebinding" tricks).
  const host = (request.headers.host ?? '').replace(/:\d+$/, '');
  if (!['localhost', '127.0.0.1', '[::1]'].includes(host)) {
    throw new HttpError(403, 'Only available on this computer');
  }
}

function safePath(base, path) {
  const full = normalize(join(base, path));
  if (!full.startsWith(base + sep)) {
    throw new HttpError(404, 'Not found');
  }
  return full;
}

function readBody(request, limit) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    request.on('data', (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(new HttpError(413, `The file is too big (maximum ${Math.round(limit / 1024 / 1024)} MB).`));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on('end', () => resolve(Buffer.concat(chunks)));
    request.on('error', reject);
  });
}

async function readJson(request) {
  if (!(request.headers['content-type'] ?? '').startsWith('application/json')) {
    throw new HttpError(415, 'Expected JSON');
  }
  try {
    return JSON.parse((await readBody(request, MAX_JSON_BYTES)).toString('utf8'));
  } catch (error) {
    throw error instanceof HttpError ? error : new HttpError(400, 'Invalid JSON');
  }
}

function friendlyMessage(error) {
  if (error instanceof HttpError) {
    return error.message;
  }
  return `Something went wrong while saving: ${error.message}`;
}

function send(response, status, type, body, headers = {}) {
  response.writeHead(status, { 'Content-Type': type, ...headers });
  response.end(body);
}
