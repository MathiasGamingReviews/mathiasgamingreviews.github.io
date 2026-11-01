/**
 * @file Client for the local edit server API (scripts/lib/edit-api.mjs), reached through the ng serve proxy.
 */

import { Injectable } from '@angular/core';
import { EDIT_API } from '../core/site.config';
import { ReviewLink, Screenshot } from '../data/models';

/** Row of the review table on the overview page. */
export interface AdminReviewRow {
  id: number;
  slug: string;
  name: string;
  platform: string;
  stars: number;
  reviewDate: string;
}

/** Row of the news table on the overview page. */
export interface AdminNewsRow {
  id: number;
  title: string;
  newsDate: string;
}

/** Review form contents, as sent to the server. */
export interface EditableReview {
  slug: string;
  gameName: string;
  /** Row id in the platform lookup table; NO_PLATFORM while none is chosen. */
  platformId: number;
  /** Set only after uploading a new logo; replaces the game's logo for all its reviews. '' keeps it. */
  logo: string;
  stars: number;
  /** YYYY-MM-DD */
  reviewDate: string;
  body: string;
  screenshots: Screenshot[];
  links: ReviewLink[];
}

/** platformId while no platform is chosen. */
export const NO_PLATFORM = 0;

/** News form contents, as sent to the server. */
export interface EditableNews {
  title: string;
  body: string;
  /** YYYY-MM-DD */
  newsDate: string;
}

/** Choices for the review form. */
export interface EditOptions {
  games: { name: string; logo: string }[];
  platforms: { id: number; name: string }[];
}

/** Result of a change; `warning` is set when the change was saved but data.sql could not be updated. */
export interface SaveResult {
  warning?: string;
}

export type UploadKind = 'logo' | 'screenshot';

const JSON_TYPE = 'application/json';
const BINARY_TYPE = 'application/octet-stream';

const NOT_RUNNING = 'The edit server is not running. Stop "ng serve" (Ctrl+C) and start editing with: npm run edit';

/** One method per API route. Errors are thrown as Error with a message to show to the user. */
@Injectable({ providedIn: 'root' })
export class EditApiService {
  options(): Promise<EditOptions> {
    return this.call('GET', '/options');
  }

  reviews(): Promise<AdminReviewRow[]> {
    return this.call('GET', '/reviews');
  }

  /** @returns The review, with `logo` set to the game's current logo. */
  review(id: number): Promise<EditableReview> {
    return this.call('GET', `/reviews/${id}`);
  }

  /** Creates the review when `id` is null, otherwise replaces it. */
  saveReview(id: number | null, review: EditableReview): Promise<SaveResult & { id: number; slug: string }> {
    return id === null ? this.call('POST', '/reviews', review) : this.call('PUT', `/reviews/${id}`, review);
  }

  deleteReview(id: number): Promise<SaveResult> {
    return this.call('DELETE', `/reviews/${id}`);
  }

  news(): Promise<AdminNewsRow[]> {
    return this.call('GET', '/news');
  }

  newsItem(id: number): Promise<EditableNews> {
    return this.call('GET', `/news/${id}`);
  }

  /** Creates the news item when `id` is null, otherwise replaces it. */
  saveNews(id: number | null, news: EditableNews): Promise<SaveResult & { id: number }> {
    return id === null ? this.call('POST', '/news', news) : this.call('PUT', `/news/${id}`, news);
  }

  deleteNews(id: number): Promise<SaveResult> {
    return this.call('DELETE', `/news/${id}`);
  }

  /**
   * Stores an image under public/.
   * @param review Review slug; screenshots are stored in a folder of that name.
   * @returns Path relative to the site root, e.g. 'screenshots/hades-pc/boss.png'.
   */
  async upload(kind: UploadKind, file: File, review = ''): Promise<string> {
    const query = new URLSearchParams({ kind, name: file.name, review });
    const { file: path } = await this.call<{ file: string }>('POST', `/upload?${query}`, file);
    return path;
  }

  /**
   * @param body File (sent as-is) or a value sent as JSON.
   * @throws Error with the server's message, or NOT_RUNNING when no edit server answers.
   */
  private async call<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = { [EDIT_API.header]: EDIT_API.headerValue };
    let payload: BodyInit | undefined;
    if (body instanceof File) {
      payload = body;
      headers['Content-Type'] = body.type || BINARY_TYPE;
    } else if (body !== undefined) {
      payload = JSON.stringify(body);
      headers['Content-Type'] = JSON_TYPE;
    }

    let response: Response;
    try {
      response = await fetch(`${EDIT_API.path}${path}`, { method, headers, body: payload });
    } catch {
      throw new Error(NOT_RUNNING);
    }
    // Without the edit server, the ng serve proxy answers with a non-JSON error page.
    if (!(response.headers.get('Content-Type') ?? '').startsWith(JSON_TYPE)) {
      throw new Error(NOT_RUNNING);
    }
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error ?? `Request failed (${response.status})`);
    }
    return result as T;
  }
}
