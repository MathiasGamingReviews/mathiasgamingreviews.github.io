import { Injectable } from '@angular/core';
import { ReviewLink, Screenshot } from '../data/models';

export interface AdminReviewRow {
  id: number;
  slug: string;
  name: string;
  platform: string;
  stars: number;
  reviewDate: string;
}

export interface AdminNewsRow {
  id: number;
  title: string;
  newsDate: string;
}

export interface EditableReview {
  slug: string;
  gameName: string;
  platform: string;
  /** Only set when a new logo was uploaded; it replaces the logo of the game for all its reviews. */
  logo: string;
  stars: number;
  reviewDate: string;
  body: string;
  screenshots: Screenshot[];
  links: ReviewLink[];
}

export interface EditableNews {
  title: string;
  body: string;
  newsDate: string;
}

export interface EditOptions {
  games: { name: string; logo: string }[];
  platforms: string[];
}

/** Talks to the local edit server (scripts/edit-server.mjs) started by "npm run edit". */
@Injectable({ providedIn: 'root' })
export class EditApiService {
  options(): Promise<EditOptions> {
    return this.call('GET', '/options');
  }

  reviews(): Promise<AdminReviewRow[]> {
    return this.call('GET', '/reviews');
  }

  review(id: number): Promise<EditableReview & { logo: string }> {
    return this.call('GET', `/reviews/${id}`);
  }

  saveReview(id: number | null, review: EditableReview): Promise<{ id: number; slug: string }> {
    return id === null ? this.call('POST', '/reviews', review) : this.call('PUT', `/reviews/${id}`, review);
  }

  deleteReview(id: number): Promise<void> {
    return this.call('DELETE', `/reviews/${id}`);
  }

  news(): Promise<AdminNewsRow[]> {
    return this.call('GET', '/news');
  }

  newsItem(id: number): Promise<EditableNews> {
    return this.call('GET', `/news/${id}`);
  }

  saveNews(id: number | null, news: EditableNews): Promise<{ id: number }> {
    return id === null ? this.call('POST', '/news', news) : this.call('PUT', `/news/${id}`, news);
  }

  deleteNews(id: number): Promise<void> {
    return this.call('DELETE', `/news/${id}`);
  }

  /** Saves an image under public/ and returns its path, e.g. 'screenshots/hades-pc/boss.png'. */
  async upload(kind: 'logo' | 'screenshot', file: File, review = ''): Promise<string> {
    const query = new URLSearchParams({ kind, name: file.name, review });
    const { file: path } = await this.call<{ file: string }>('POST', `/upload?${query}`, file);
    return path;
  }

  private async call<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = { 'X-MGR-Edit': '1' };
    let payload: BodyInit | undefined;
    if (body instanceof File) {
      payload = body;
      headers['Content-Type'] = body.type || 'application/octet-stream';
    } else if (body !== undefined) {
      payload = JSON.stringify(body);
      headers['Content-Type'] = 'application/json';
    }

    let response: Response;
    try {
      response = await fetch(`/api${path}`, { method, headers, body: payload });
    } catch {
      throw new Error(NOT_RUNNING);
    }
    const isJson = (response.headers.get('Content-Type') ?? '').startsWith('application/json');
    if (!isJson) {
      // No edit server behind the proxy: the dev server answers with an error page instead.
      throw new Error(NOT_RUNNING);
    }
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error ?? `Request failed (${response.status})`);
    }
    return result as T;
  }
}

const NOT_RUNNING =
  'The edit server is not running. Stop "ng serve" (Ctrl+C) and start editing with: npm run edit';
