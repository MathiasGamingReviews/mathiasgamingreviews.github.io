import { Component, effect, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { Review } from '../../data/models';
import { SiteDataService } from '../../data/site-data.service';
import { ParagraphsPipe } from '../../shared/paragraphs.pipe';
import { StarsComponent } from '../../shared/stars.component';

@Component({
  selector: 'app-review-page',
  standalone: true,
  imports: [DatePipe, RouterLink, ParagraphsPipe, StarsComponent],
  templateUrl: './review.page.html',
  styleUrl: './review.page.css',
})
export class ReviewPage {
  /** From the address bar: /reviews/<slug> */
  readonly slug = input.required<string>();
  private readonly data = inject(SiteDataService);
  private readonly title = inject(Title);
  protected readonly review = signal<Review | undefined>(undefined);
  protected readonly status = signal<'loading' | 'ready' | 'not-found' | 'failed'>('loading');

  constructor() {
    // Runs again whenever the address bar changes.
    effect(() => this.load(), { allowSignalWrites: true });
  }

  private async load(): Promise<void> {
    try {
      const review = await this.data.review(this.slug());
      this.review.set(review);
      this.status.set(review ? 'ready' : 'not-found');
      this.title.setTitle(`${review ? `${review.name} (${review.platform}) review` : 'Review'} - Mathias Gaming Reviews`);
    } catch (error) {
      console.error(error);
      this.status.set('failed');
    }
  }
}
