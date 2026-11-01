/**
 * @file Tests for slugify, request validation and HTTP helpers.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { MAX_JSON_BYTES } from '../lib/config.mjs';
import { assertLocalHost, HttpError, readBody, readJson, resolveInside, STATUS } from '../lib/http.mjs';
import { slugify } from '../lib/slugify.mjs';
import { isDate, isImagePath, validateNews, validateReview } from '../lib/validation.mjs';
import { fakeRequest } from './helpers.mjs';

const VALID_REVIEW = {
  gameName: ' Hades ',
  platformId: 1,
  logo: '',
  slug: 'Hades PC',
  stars: 5,
  reviewDate: '2026-10-12',
  body: 'Great.',
  screenshots: [{ file: 'screenshots/hades-pc/1.png', name: 'Boss', description: '' }],
  links: [{ url: 'https://example.com/', description: 'Example' }],
};

/** @returns {(error: unknown) => boolean} Matcher for an HttpError with the given status. */
const httpError = (status) => (error) => error instanceof HttpError && error.status === status;

describe('slugify', () => {
  it('makes lower-case words separated by hyphens', () => {
    assert.equal(slugify('Hades (PC)'), 'hades-pc');
    assert.equal(slugify('Pokémon: Scarlet & Violet'), 'pokemon-scarlet-violet');
    assert.equal(slugify('  --  '), '');
  });
});

describe('isDate', () => {
  it('accepts real dates only', () => {
    assert.equal(isDate('2026-02-28'), true);
    assert.equal(isDate('2026-02-31'), false);
    assert.equal(isDate('2026-2-3'), false);
    assert.equal(isDate(''), false);
  });
});

describe('isImagePath', () => {
  it('accepts images inside the upload folders only', () => {
    assert.equal(isImagePath('logos/hades.png'), true);
    assert.equal(isImagePath('screenshots/hades-pc/1.svg'), true);
    assert.equal(isImagePath('data/mgr.db'), false);
    assert.equal(isImagePath('logos/../data/x.png'), false);
    assert.equal(isImagePath('logos/readme.txt'), false);
  });
});

describe('validateReview', () => {
  it('trims text and normalises the web address', () => {
    const review = validateReview(VALID_REVIEW);
    assert.equal(review.gameName, 'Hades');
    assert.equal(review.slug, 'hades-pc');
  });

  for (const [field, value] of [
    ['gameName', ''],
    ['platformId', 0],
    ['stars', 6],
    ['stars', 2.5],
    ['reviewDate', '2026-13-01'],
    ['body', '   '],
    ['logo', 'https://example.com/logo.png'],
    ['links', [{ url: 'javascript:alert(1)', description: 'x' }]],
    ['screenshots', [{ file: 'screenshots/a.png', name: '' }]],
  ]) {
    it(`rejects ${field} = ${JSON.stringify(value)}`, () => {
      assert.throws(() => validateReview({ ...VALID_REVIEW, [field]: value }), httpError(STATUS.BAD_REQUEST));
    });
  }

  it('rejects a missing body', () => {
    assert.throws(() => validateReview(null), httpError(STATUS.BAD_REQUEST));
  });
});

describe('validateNews', () => {
  it('requires title, date and text', () => {
    assert.deepEqual(validateNews({ title: ' Hi ', body: 'Text', newsDate: '2026-01-01' }), {
      title: 'Hi',
      body: 'Text',
      newsDate: '2026-01-01',
    });
    assert.throws(() => validateNews({ title: 'Hi', body: 'Text', newsDate: 'soon' }), httpError(STATUS.BAD_REQUEST));
  });
});

describe('http helpers', () => {
  it('reads a body within the limit', async () => {
    assert.equal((await readBody(fakeRequest({ body: 'abc' }), 3)).toString(), 'abc');
  });

  it('answers 413 for a body over the limit after reading it to the end', async () => {
    await assert.rejects(readBody(fakeRequest({ body: 'abcd' }), 3), httpError(STATUS.PAYLOAD_TOO_LARGE));
  });

  it('rejects non-JSON and invalid JSON', async () => {
    await assert.rejects(readJson(fakeRequest({ body: '{}' })), httpError(STATUS.UNSUPPORTED_MEDIA_TYPE));
    const broken = fakeRequest({ headers: { 'content-type': 'application/json' }, body: '{' });
    await assert.rejects(readJson(broken), httpError(STATUS.BAD_REQUEST));
    const huge = fakeRequest({ headers: { 'content-type': 'application/json' }, body: 'x'.repeat(MAX_JSON_BYTES + 1) });
    await assert.rejects(readJson(huge), httpError(STATUS.PAYLOAD_TOO_LARGE));
  });

  it('only accepts requests addressed to this computer', () => {
    assertLocalHost(fakeRequest({ headers: { host: 'localhost:4200' } }));
    assertLocalHost(fakeRequest({ headers: { host: '127.0.0.1:4201' } }));
    assert.throws(
      () => assertLocalHost(fakeRequest({ headers: { host: 'evil.example:4201' } })),
      httpError(STATUS.FORBIDDEN),
    );
  });

  it('keeps paths inside the base folder', () => {
    const base = process.cwd();
    assert.ok(resolveInside(base, '/logos/a.png').startsWith(base));
    assert.throws(() => resolveInside(base, '/../secret.txt'), httpError(STATUS.NOT_FOUND));
  });
});
