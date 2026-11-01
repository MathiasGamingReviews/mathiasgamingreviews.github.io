/**
 * @file News page: all news, newest first, paged. Route: /news?page=<n>
 */

import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { NEWS_PAGE_SIZE } from '../../core/site.config';
import { NewsItem, Page } from '../../data/models';
import { SiteDataService } from '../../data/site-data.service';
import { NewsCardComponent } from '../../shared/news-card/news-card.component';
import { PagerComponent } from '../../shared/pager/pager.component';

@Component({
    selector: 'app-news-page',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NewsCardComponent, PagerComponent],
    templateUrl: './news.page.html'
})
export class NewsPage {
  /** Query parameter `page`. */
  readonly page = input<string>();
  private readonly data = inject(SiteDataService);
  /** undefined while loading. */
  protected readonly result = signal<Page<NewsItem> | undefined>(undefined);
  protected readonly failed = signal(false);

  constructor() {
    // Re-runs whenever page() changes (the signal is read before the first await).
    effect(() => this.load(Number(this.page() ?? 1)), { allowSignalWrites: true });
  }

  private async load(page: number): Promise<void> {
    this.failed.set(false);
    try {
      this.result.set(await this.data.newsPage(page, NEWS_PAGE_SIZE));
    } catch (error) {
      console.error(error);
      this.failed.set(true);
    }
  }
}
