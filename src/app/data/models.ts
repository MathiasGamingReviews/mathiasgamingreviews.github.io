/**
 * @file Data shapes returned by SiteDataService (column aliases in its SQL match these property names).
 */

/** Review as shown on a review card. */
export interface ReviewSummary {
  slug: string;
  name: string;
  /** Image path relative to the site root, e.g. 'logos/hades.png'. */
  logo: string;
  platform: string;
  stars: number;
  /** YYYY-MM-DD */
  reviewDate: string;
}

/** Full review for the review page. */
export interface Review extends ReviewSummary {
  /** Paragraphs separated by a blank line. */
  body: string;
  screenshots: Screenshot[];
  links: ReviewLink[];
}

export interface Screenshot {
  /** Image path relative to the site root. */
  file: string;
  name: string;
  description: string;
}

export interface ReviewLink {
  url: string;
  description: string;
}

export interface NewsItem {
  id: number;
  title: string;
  /** Paragraphs separated by a blank line. */
  body: string;
  /** YYYY-MM-DD */
  newsDate: string;
}

/** Sort orders offered on the Reviews page. */
export type ReviewSort = 'date' | 'platform' | 'score' | 'name';

/** Sort order used when none is chosen. */
export const DEFAULT_REVIEW_SORT: ReviewSort = 'name';

/** One page of a paged list. */
export interface Page<T> {
  items: T[];
  /** 1-based page number, clamped to 1..pageCount. */
  page: number;
  /** At least 1, also for an empty list. */
  pageCount: number;
}

/** Load state of a page showing a single item. */
export type LoadStatus = 'loading' | 'ready' | 'not-found' | 'failed';
