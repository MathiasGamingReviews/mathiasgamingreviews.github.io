import { Component, effect, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { NewsItem } from '../../data/models';
import { SiteDataService } from '../../data/site-data.service';
import { ParagraphsPipe } from '../../shared/paragraphs.pipe';

@Component({
  selector: 'app-news-item-page',
  standalone: true,
  imports: [DatePipe, RouterLink, ParagraphsPipe],
  templateUrl: './news-item.page.html',
})
export class NewsItemPage {
  /** From the address bar: /news/<id> */
  readonly id = input.required<string>();
  private readonly data = inject(SiteDataService);
  private readonly title = inject(Title);
  protected readonly item = signal<NewsItem | undefined>(undefined);
  protected readonly status = signal<'loading' | 'ready' | 'not-found' | 'failed'>('loading');

  constructor() {
    // Runs again whenever the address bar changes.
    effect(() => this.load(), { allowSignalWrites: true });
  }

  private async load(): Promise<void> {
    try {
      const item = await this.data.newsItem(Number(this.id()));
      this.item.set(item);
      this.status.set(item ? 'ready' : 'not-found');
      this.title.setTitle(`${item?.title ?? 'News'} - Mathias Gaming Reviews`);
    } catch (error) {
      console.error(error);
      this.status.set('failed');
    }
  }
}
