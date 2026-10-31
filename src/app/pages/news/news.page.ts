import { Component, effect, inject, input, signal } from '@angular/core';
import { NewsItem, Page } from '../../data/models';
import { SiteDataService } from '../../data/site-data.service';
import { NewsCardComponent } from '../../shared/news-card.component';
import { PagerComponent } from '../../shared/pager.component';

const PAGE_SIZE = 5;

@Component({
  selector: 'app-news-page',
  standalone: true,
  imports: [NewsCardComponent, PagerComponent],
  templateUrl: './news.page.html',
})
export class NewsPage {
  /** From the address bar: /news?page=2 */
  readonly page = input<string>();
  private readonly data = inject(SiteDataService);
  protected readonly result = signal<Page<NewsItem> | undefined>(undefined);
  protected readonly failed = signal(false);

  constructor() {
    // Runs again whenever the address bar changes.
    effect(() => this.load(), { allowSignalWrites: true });
  }

  private async load(): Promise<void> {
    try {
      this.result.set(await this.data.newsPage(Number(this.page() ?? 1), PAGE_SIZE));
    } catch (error) {
      console.error(error);
      this.failed.set(true);
    }
  }
}
