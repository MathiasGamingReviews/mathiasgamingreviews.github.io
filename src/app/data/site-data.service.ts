/**
 * @file All read queries used by the public pages.
 */

import { Injectable, inject } from '@angular/core';
import { DbService } from './db.service';
import { NewsItem, Page, Review, ReviewLink, ReviewSort, ReviewSummary, Screenshot } from './models';

const REVIEW_COLUMNS = 'r.slug, g.name, g.logo, p.name AS platform, r.stars, r.review_date AS reviewDate';

const REVIEW_TABLES = `
  FROM review r
  JOIN game g ON g.id = r.game_id
  JOIN platform p ON p.id = r.platform_id`;

const NEWEST_REVIEWS_FIRST = 'ORDER BY r.review_date DESC, r.id DESC';

/** ORDER BY clause per sort option; r.id is appended as the final tie-breaker for stable paging. */
const REVIEW_SORT_ORDER: Record<ReviewSort, string> = {
  date: 'r.review_date DESC, g.name COLLATE NOCASE',
  platform: 'p.name COLLATE NOCASE, g.name COLLATE NOCASE',
  score: 'r.stars DESC, g.name COLLATE NOCASE',
  name: 'g.name COLLATE NOCASE, p.name COLLATE NOCASE',
};

/** Search: game or platform name contains the text. `\` escapes LIKE wildcards (see likePattern). */
const REVIEW_SEARCH = "WHERE g.name LIKE ? ESCAPE '\\' OR p.name LIKE ? ESCAPE '\\'";

const NEWS_COLUMNS = 'id, title, body, news_date AS newsDate';

const NEWEST_NEWS_FIRST = 'ORDER BY news_date DESC, id DESC';

@Injectable({ providedIn: 'root' })
export class SiteDataService {
  private readonly db = inject(DbService);

  /** @returns The `count` newest news items. */
  latestNews(count: number): Promise<NewsItem[]> {
    return this.db.query(`SELECT ${NEWS_COLUMNS} FROM news ${NEWEST_NEWS_FIRST} LIMIT ?`, [count]);
  }

  /** @returns One page of news, newest first. `page` is clamped to the available pages. */
  async newsPage(page: number, pageSize: number): Promise<Page<NewsItem>> {
    const [{ total }] = await this.db.query<{ total: number }>('SELECT COUNT(*) AS total FROM news');
    const { current, offset, pageCount } = paging(page, pageSize, total);
    const items = await this.db.query<NewsItem>(
      `SELECT ${NEWS_COLUMNS} FROM news ${NEWEST_NEWS_FIRST} LIMIT ? OFFSET ?`,
      [pageSize, offset],
    );
    return { items, page: current, pageCount };
  }

  /** @returns The news item, or undefined if there is none with this id. */
  async newsItem(id: number): Promise<NewsItem | undefined> {
    const [item] = await this.db.query<NewsItem>(`SELECT ${NEWS_COLUMNS} FROM news WHERE id = ?`, [id]);
    return item;
  }

  /** @returns The `count` newest reviews. */
  latestReviews(count: number): Promise<ReviewSummary[]> {
    return this.db.query(`SELECT ${REVIEW_COLUMNS} ${REVIEW_TABLES} ${NEWEST_REVIEWS_FIRST} LIMIT ?`, [count]);
  }

  /** @returns Up to `count` random reviews, excluding the `skipLatest` newest ones. */
  randomReviews(count: number, skipLatest: number): Promise<ReviewSummary[]> {
    return this.db.query(
      `SELECT ${REVIEW_COLUMNS} ${REVIEW_TABLES}
       WHERE r.id NOT IN (SELECT r.id FROM review r ${NEWEST_REVIEWS_FIRST} LIMIT ?)
       ORDER BY RANDOM() LIMIT ?`,
      [skipLatest, count],
    );
  }

  /**
   * @param search Text to find in the game or platform name; empty for all reviews.
   * @returns One page of matching reviews in the chosen order. `page` is clamped to the available pages.
   */
  async reviewsPage(search: string, sort: ReviewSort, page: number, pageSize: number): Promise<Page<ReviewSummary>> {
    const pattern = likePattern(search.trim());
    const [{ total }] = await this.db.query<{ total: number }>(
      `SELECT COUNT(*) AS total ${REVIEW_TABLES} ${REVIEW_SEARCH}`,
      [pattern, pattern],
    );
    const { current, offset, pageCount } = paging(page, pageSize, total);
    const items = await this.db.query<ReviewSummary>(
      `SELECT ${REVIEW_COLUMNS} ${REVIEW_TABLES} ${REVIEW_SEARCH}
       ORDER BY ${REVIEW_SORT_ORDER[sort]}, r.id LIMIT ? OFFSET ?`,
      [pattern, pattern, pageSize, offset],
    );
    return { items, page: current, pageCount };
  }

  /** @returns The review with its screenshots and links, or undefined if there is none with this slug. */
  async review(slug: string): Promise<Review | undefined> {
    const [found] = await this.db.query<Omit<Review, 'screenshots' | 'links'> & { id: number }>(
      `SELECT r.id, ${REVIEW_COLUMNS}, r.body ${REVIEW_TABLES} WHERE r.slug = ?`,
      [slug],
    );
    if (!found) {
      return undefined;
    }
    const { id, ...review } = found;
    const [screenshots, links] = await Promise.all([
      this.db.query<Screenshot>(
        'SELECT file, name, description FROM review_screenshot WHERE review_id = ? ORDER BY position, id',
        [id],
      ),
      this.db.query<ReviewLink>('SELECT url, description FROM review_link WHERE review_id = ? ORDER BY position, id', [
        id,
      ]),
    ]);
    return { ...review, screenshots, links };
  }
}

/**
 * @param text Text to search for.
 * @returns LIKE pattern matching `text` anywhere, with %, _ and \ in `text` matched literally.
 */
export function likePattern(text: string): string {
  return `%${text.replace(/[\\%_]/g, '\\$&')}%`;
}

/**
 * @param page Requested 1-based page; NaN, fractions and out-of-range values are corrected.
 * @returns The page to show, its row offset, and the number of pages (at least 1).
 */
export function paging(
  page: number,
  pageSize: number,
  total: number,
): { current: number; offset: number; pageCount: number } {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, Math.floor(page) || 1), pageCount);
  return { current, offset: (current - 1) * pageSize, pageCount };
}
