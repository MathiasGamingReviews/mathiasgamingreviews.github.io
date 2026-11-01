/**
 * @file Single review with screenshots and links. Route: /reviews/:slug
 */

import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { pageTitle } from '../../core/page-title';
import { DATE_FORMAT } from '../../core/site.config';
import { LoadStatus, Review } from '../../data/models';
import { SiteDataService } from '../../data/site-data.service';
import { ParagraphsPipe } from '../../shared/paragraphs/paragraphs.pipe';
import { ScreenshotGalleryComponent } from '../../shared/screenshot-gallery/screenshot-gallery.component';
import { StarsComponent } from '../../shared/stars/stars.component';

@Component({
  selector: 'app-review-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RouterLink, ParagraphsPipe, ScreenshotGalleryComponent, StarsComponent],
  templateUrl: './review.page.html',
  styleUrl: './review.page.css',
})
export class ReviewPage {
  /** Route parameter `:slug`. */
  readonly slug = input.required<string>();
  private readonly data = inject(SiteDataService);
  private readonly title = inject(Title);
  protected readonly dateFormat = DATE_FORMAT.long;
  protected readonly review = signal<Review | undefined>(undefined);
  protected readonly status = signal<LoadStatus>('loading');

  constructor() {
    // Re-runs whenever slug() changes (the signal is read before the first await).
    effect(() => this.load(this.slug()), { allowSignalWrites: true });
  }

  private async load(slug: string): Promise<void> {
    this.status.set('loading');
    try {
      const review = await this.data.review(slug);
      this.review.set(review);
      this.status.set(review ? 'ready' : 'not-found');
      this.title.setTitle(pageTitle(review ? `${review.name} (${review.platform}) review` : 'Review'));
    } catch (error) {
      console.error(error);
      this.status.set('failed');
    }
  }
}
