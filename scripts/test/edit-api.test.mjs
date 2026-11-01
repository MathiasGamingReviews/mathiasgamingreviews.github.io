/**
 * @file Tests for the edit API routes against an in-memory database.
 */

import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, beforeEach, describe, it } from 'node:test';
import { SHARED } from '../lib/config.mjs';
import { createEditApi } from '../lib/edit-api.mjs';
import { HttpError, STATUS } from '../lib/http.mjs';
import { createTestDatabase, fakeRequest, jsonRequest } from './helpers.mjs';

const publicDir = mkdtempSync(join(tmpdir(), 'mgr-public-'));
after(() => rmSync(publicDir, { recursive: true, force: true }));

const REVIEW = {
  gameName: 'Test Game',
  platformId: 1,
  logo: '',
  slug: 'test-game-pc',
  stars: 4,
  reviewDate: '2026-10-31',
  body: 'Text.',
  screenshots: [],
  links: [{ url: 'https://example.com/', description: 'Example' }],
};

const httpError = (status) => (error) => error instanceof HttpError && error.status === status;

describe('edit API', () => {
  let db;
  let api;
  /** Calls the API like the server does; `path` is relative to the API path. */
  const call = (request, path) => api(request, new URL(`http://localhost${SHARED.editApi.path}${path}`));

  beforeEach(() => {
    db = createTestDatabase();
    api = createEditApi(db, { publicDir });
  });

  it('lists the platforms for the drop-down', async () => {
    const { platforms } = await call(fakeRequest(), '/options');
    assert.ok(platforms.some((platform) => platform.name === 'PC'));
  });

  it('creates, reads, updates and deletes a review', async () => {
    const { id } = await call(jsonRequest(REVIEW), '/reviews');
    const saved = await call(fakeRequest(), `/reviews/${id}`);
    assert.equal(saved.gameName, 'Test Game');
    assert.equal(saved.logo, SHARED.defaultLogo);
    assert.equal(saved.links.length, 1);

    await call(jsonRequest({ ...REVIEW, stars: 2, links: [] }, 'PUT'), `/reviews/${id}`);
    const updated = await call(fakeRequest(), `/reviews/${id}`);
    assert.equal(updated.stars, 2);
    assert.equal(updated.links.length, 0);

    await call(fakeRequest({ method: 'DELETE' }), `/reviews/${id}`);
    await assert.rejects(call(fakeRequest(), `/reviews/${id}`), httpError(STATUS.NOT_FOUND));
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM game').get().n, 0, 'unused game removed');
  });

  it('refuses a platform that is not in the lookup table', async () => {
    await assert.rejects(call(jsonRequest({ ...REVIEW, platformId: 999 }), '/reviews'), httpError(STATUS.BAD_REQUEST));
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM review').get().n, 0);
  });

  it('refuses a web address used by another review', async () => {
    await call(jsonRequest(REVIEW), '/reviews');
    await assert.rejects(
      call(jsonRequest({ ...REVIEW, gameName: 'Other' }), '/reviews'),
      httpError(STATUS.BAD_REQUEST),
    );
  });

  it('answers 404 when updating a review that does not exist', async () => {
    await assert.rejects(call(jsonRequest(REVIEW, 'PUT'), '/reviews/999'), httpError(STATUS.NOT_FOUND));
  });

  it('creates, updates and deletes news', async () => {
    const { id } = await call(jsonRequest({ title: 'Hi', body: 'Text', newsDate: '2026-01-01' }), '/news');
    await call(jsonRequest({ title: 'Hello', body: 'Text', newsDate: '2026-01-02' }, 'PUT'), `/news/${id}`);
    assert.equal((await call(fakeRequest(), `/news/${id}`)).title, 'Hello');
    await call(fakeRequest({ method: 'DELETE' }), `/news/${id}`);
    await assert.rejects(call(fakeRequest(), `/news/${id}`), httpError(STATUS.NOT_FOUND));
  });

  it('stores uploads without overwriting existing files', async () => {
    const upload = () =>
      call(
        fakeRequest({ method: 'POST', body: 'png' }),
        '/upload?kind=screenshot&name=Boss%20Fight.png&review=test-game-pc',
      );
    const first = await upload();
    const second = await upload();
    assert.equal(first.file, 'screenshots/test-game-pc/boss-fight.png');
    assert.equal(second.file, 'screenshots/test-game-pc/boss-fight-2.png');
    assert.ok(existsSync(join(publicDir, second.file)));
  });

  it('refuses SVG uploads, unknown kinds and empty files', async () => {
    const post = (query, body = 'x') => call(fakeRequest({ method: 'POST', body }), `/upload?${query}`);
    await assert.rejects(post('kind=logo&name=a.svg'), httpError(STATUS.BAD_REQUEST));
    await assert.rejects(post('kind=other&name=a.png'), httpError(STATUS.BAD_REQUEST));
    await assert.rejects(post('kind=logo&name=a.png', ''), httpError(STATUS.BAD_REQUEST));
  });

  it('answers 404 for unknown routes', async () => {
    await assert.rejects(call(fakeRequest(), '/nothing'), httpError(STATUS.NOT_FOUND));
  });
});
