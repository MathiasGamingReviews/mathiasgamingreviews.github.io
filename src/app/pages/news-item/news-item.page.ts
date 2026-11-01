/**
 * @file Single news item. Route: /news/:id
 */

import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { pageTitle } from '../../core/page-title';
import { DATE_FORMAT } from '../../core/site.config';
import { LoadStatus, NewsItem } from '../../data/models';
import { SiteDataService } from '../../data/site-data.service';
import { ParagraphsPipe } from '../../shared/paragraphs/paragraphs.pipe';

@Component({
  selector: 'app-news-item-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RouterLink, ParagraphsPipe],
  templateUrl: './news-item.page.html',
})
export class NewsItemPage {
  /** Route parameter `:id`. */
  readonly id = input.required<string>();
  private readonly data = inject(SiteDataService);
  private readonly title = inject(Title);
  protected readonly dateFormat = DATE_FORMAT.long;
  protected readonly item = signal<NewsItem | undefined>(undefined);
  protected readonly status = signal<LoadStatus>('loading');

  constructor() {
    // Re-runs whenever id() changes (the signal is read before the first await).
    effect(() => this.load(Number(this.id())));
  }

  private async load(id: number): Promise<void> {
    this.status.set('loading');
    try {
      const item = await this.data.newsItem(id);
      this.item.set(item);
      this.status.set(item ? 'ready' : 'not-found');
      this.title.setTitle(pageTitle(item?.title ?? 'News'));
    } catch (error) {
      console.error(error);
      this.status.set('failed');
    }
  }
}
