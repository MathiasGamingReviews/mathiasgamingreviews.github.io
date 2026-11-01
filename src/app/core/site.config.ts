/**
 * @file Site-wide settings for the Angular app.
 * Values shared with the Node scripts (scripts/lib/config.mjs) come from config/shared.json.
 */

import shared from '../../../config/shared.json';

/** Shown in the header and in every browser tab title. */
export const SITE_NAME = 'Mathias Gaming Reviews';

/** Site logo in the header, relative to the site root (public/logo.svg). */
export const SITE_LOGO = 'logo.svg';

/** Database file URL, relative to the site root. */
export const DATABASE_URL = shared.databaseFile;

/** Image shown for a game without its own logo. */
export const DEFAULT_LOGO = shared.defaultLogo;

/** Star rating range; must match the CHECK constraint on review.stars in db/schema.sql. */
export const STARS = shared.stars;

/** File picker filter for uploads; SVG is excluded because it can contain scripts. */
export const UPLOAD_ACCEPT = shared.uploadExtensions.join(',');

/** Edit server API: URL prefix and the header every request must carry. */
export const EDIT_API = shared.editApi;

/** DatePipe formats. */
export const DATE_FORMAT = {
  /** 12 October 2026 */
  long: 'd MMMM y',
  /** 12 Oct 2026 */
  short: 'd MMM y',
} as const;

/** Number of items in each section of the home page. */
export const HOME_PAGE = {
  newsCount: 3,
  newReviewCount: 5,
  randomReviewCount: 5,
} as const;

/** News items per page on the News page. */
export const NEWS_PAGE_SIZE = 5;

/** Reviews page sections. */
export const REVIEWS_PAGE = {
  latestCount: 5,
  pageSize: 10,
} as const;

/** Star rating preselected for a new review. */
export const NEW_REVIEW_STARS = 3;
