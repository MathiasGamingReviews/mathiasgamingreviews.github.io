import { Injectable, inject } from '@angular/core';
import { DbService } from './db.service';
import { NewsItem, Page, Review, ReviewSummary } from './models';

const REVIEW_COLUMNS = 'r.slug, g.name, g.logo, p.name AS platform, r.stars, r.review_date AS reviewDate';

const REVIEW_TABLES = `
  FROM review r
  JOIN game g ON g.id = r.game_id
  JOIN platform p ON p.id = r.platform_id`;

const NEWEST_REVIEWS_FIRST = 'ORDER BY r.review_date DESC, r.id DESC';

const NEWS_COLUMNS = 'id, title, body, news_date AS newsDate';

const NEWEST_NEWS_FIRST = 'ORDER BY news_date DESC, id DESC';

@Injectable({ providedIn: 'root' })
export class SiteDataService {
  private readonly db = inject(DbService);

  latestNews(count: number): Promise<NewsItem[]> {
    return this.db.query(`SELECT ${NEWS_COLUMNS} FROM news ${NEWEST_NEWS_FIRST} LIMIT ?`, [count]);
  }

  async newsPage(page: number, pageSize: number): Promise<Page<NewsItem>> {
    const [{ total }] = await this.db.query<{ total: number }>('SELECT COUNT(*) AS total FROM news');
    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    page = clamp(page, pageCount);
    const items = await this.db.query<NewsItem>(
      `SELECT ${NEWS_COLUMNS} FROM news ${NEWEST_NEWS_FIRST} LIMIT ? OFFSET ?`,
      [pageSize, (page - 1) * pageSize],
    );
    return { items, page, pageCount };
  }

  async newsItem(id: number): Promise<NewsItem | undefined> {
    const [item] = await this.db.query<NewsItem>(`SELECT ${NEWS_COLUMNS} FROM news WHERE id = ?`, [id]);
    return item;
  }

  latestReviews(count: number): Promise<ReviewSummary[]> {
    return this.db.query(`SELECT ${REVIEW_COLUMNS} ${REVIEW_TABLES} ${NEWEST_REVIEWS_FIRST} LIMIT ?`, [count]);
  }

  /** Random reviews, leaving out the `skipLatest` newest ones (they are shown elsewhere). */
  randomReviews(count: number, skipLatest: number): Promise<ReviewSummary[]> {
    return this.db.query(
      `SELECT ${REVIEW_COLUMNS} ${REVIEW_TABLES}
       WHERE r.id NOT IN (SELECT r.id FROM review r ${NEWEST_REVIEWS_FIRST} LIMIT ?)
       ORDER BY RANDOM() LIMIT ?`,
      [skipLatest, count],
    );
  }

  /** Reviews in alphabetical order, optionally filtered by game or platform name. */
  async reviewsPage(search: string, page: number, pageSize: number): Promise<Page<ReviewSummary>> {
    const where = 'WHERE g.name LIKE ? OR p.name LIKE ?';
    const pattern = `%${search.trim()}%`;
    const [{ total }] = await this.db.query<{ total: number }>(
      `SELECT COUNT(*) AS total ${REVIEW_TABLES} ${where}`,
      [pattern, pattern],
    );
    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    page = clamp(page, pageCount);
    const items = await this.db.query<ReviewSummary>(
      `SELECT ${REVIEW_COLUMNS} ${REVIEW_TABLES} ${where}
       ORDER BY g.name COLLATE NOCASE, p.name COLLATE NOCASE LIMIT ? OFFSET ?`,
      [pattern, pattern, pageSize, (page - 1) * pageSize],
    );
    return { items, page, pageCount };
  }

  async review(slug: string): Promise<Review | undefined> {
    const [review] = await this.db.query<Review>(
      `SELECT ${REVIEW_COLUMNS}, r.body ${REVIEW_TABLES} WHERE r.slug = ?`,
      [slug],
    );
    return review;
  }
}

function clamp(page: number, pageCount: number): number {
  return Math.min(Math.max(1, Math.floor(page) || 1), pageCount);
}
