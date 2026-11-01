/**
 * @file Validation and normalisation of review and news data sent by the edit pages.
 * Messages are shown to the user as-is.
 */

import { extname } from 'node:path';
import { IMAGE_TYPES, SHARED, UPLOAD_FOLDERS } from './config.mjs';
import { HttpError, STATUS } from './http.mjs';
import { slugify } from './slugify.mjs';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const WEB_ADDRESS = /^https?:\/\/\S+$/i;
const IMAGE_FOLDERS = Object.values(UPLOAD_FOLDERS).join('|');
const IMAGE_PATH = new RegExp(`^(${IMAGE_FOLDERS})/[a-z0-9/_-]+\\.[a-z]+$`, 'i');

/**
 * @typedef {object} ReviewInput
 * @property {string} gameName
 * @property {number} platformId
 * @property {string} logo Path of a newly uploaded logo, or '' to keep the game's logo.
 * @property {string} slug
 * @property {number} stars
 * @property {string} reviewDate YYYY-MM-DD
 * @property {string} body
 * @property {{ file: string, name: string, description: string }[]} screenshots
 * @property {{ url: string, description: string }[]} links
 */

/**
 * @typedef {object} NewsInput
 * @property {string} title
 * @property {string} body
 * @property {string} newsDate YYYY-MM-DD
 */

/**
 * @param {any} input Parsed JSON request body.
 * @returns {ReviewInput} Trimmed values; slug normalised with slugify().
 * @throws {HttpError} 400 with the first problem found.
 */
export function validateReview(input) {
  const review = {
    gameName: text(input?.gameName),
    platformId: Number(input?.platformId),
    logo: text(input?.logo),
    slug: slugify(text(input?.slug)),
    stars: Number(input?.stars),
    reviewDate: text(input?.reviewDate),
    body: text(input?.body),
    screenshots: list(input?.screenshots).map((shot) => ({
      file: text(shot?.file),
      name: text(shot?.name),
      description: text(shot?.description),
    })),
    links: list(input?.links).map((link) => ({
      url: text(link?.url),
      description: text(link?.description),
    })),
  };
  const { min, max } = SHARED.stars;
  check(review.gameName, 'Please enter the name of the game.');
  check(Number.isInteger(review.platformId) && review.platformId > 0, 'Please choose a platform.');
  check(review.slug, 'Please enter the web address.');
  check(
    Number.isInteger(review.stars) && review.stars >= min && review.stars <= max,
    `Stars must be between ${min} and ${max}.`,
  );
  check(isDate(review.reviewDate), 'Please enter the review date.');
  check(review.body, 'Please write the review.');
  check(!review.logo || isImagePath(review.logo), 'The logo is not a valid image.');
  for (const shot of review.screenshots) {
    check(isImagePath(shot.file), 'One of the screenshots is not a valid image.');
    check(shot.name, 'Every screenshot needs a name.');
  }
  for (const link of review.links) {
    check(WEB_ADDRESS.test(link.url), `"${link.url}" is not a web address. Links must start with http:// or https://`);
    check(link.description, 'Every link needs a description.');
  }
  return review;
}

/**
 * @param {any} input Parsed JSON request body.
 * @returns {NewsInput} Trimmed values.
 * @throws {HttpError} 400 with the first problem found.
 */
export function validateNews(input) {
  const news = { title: text(input?.title), body: text(input?.body), newsDate: text(input?.newsDate) };
  check(news.title, 'Please enter a title.');
  check(isDate(news.newsDate), 'Please enter the date.');
  check(news.body, 'Please write the news text.');
  return news;
}

/**
 * @param {string} value
 * @returns {boolean} True for a real calendar date in YYYY-MM-DD form.
 */
export function isDate(value) {
  if (!ISO_DATE.test(value)) {
    return false;
  }
  // Date.parse accepts 2026-02-31 (rolls over); the round trip rejects it.
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
}

/**
 * @param {string} value
 * @returns {boolean} True for a relative image path inside an upload folder, e.g. 'logos/hades.png'.
 */
export function isImagePath(value) {
  return IMAGE_PATH.test(value) && !value.includes('..') && Boolean(IMAGE_TYPES[extname(value).toLowerCase()]);
}

/**
 * @param {unknown} condition
 * @param {string} message
 * @throws {HttpError} 400 with `message` if `condition` is falsy.
 */
export function check(condition, message) {
  if (!condition) {
    throw new HttpError(STATUS.BAD_REQUEST, message);
  }
}

/** @returns {string} Trimmed string, or '' for anything that is not a string. */
const text = (value) => (typeof value === 'string' ? value.trim() : '');

/** @returns {any[]} The value if it is an array, otherwise []. */
const list = (value) => (Array.isArray(value) ? value : []);
