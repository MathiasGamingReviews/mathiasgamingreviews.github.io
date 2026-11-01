/**
 * @file Reviews page: latest reviews, then all reviews with search, sort and paging.
 * Route: /reviews?q=<search>&sort=<ReviewSort>&page=<n>
 */

import { ChangeDetectionStrategy, Component, OnInit, computed, effect, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { REVIEWS_PAGE } from '../../core/site.config';
import { DEFAULT_REVIEW_SORT, Page, ReviewSort, ReviewSummary } from '../../data/models';
import { SiteDataService } from '../../data/site-data.service';
import { PagerComponent } from '../../shared/pager/pager.component';
import { ReviewCardComponent } from '../../shared/review-card/review-card.component';

/** Sort drop-down entries, in display order. */
const SORT_OPTIONS: { value: ReviewSort; label: string }[] = [
  { value: 'date', label: 'Review Date' },
  { value: 'platform', label: 'Platform' },
  { value: 'score', label: 'Score' },
  { value: 'name', label: 'Name' },
];

@Component({
    selector: 'app-reviews-page',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [PagerComponent, ReviewCardComponent],
    templateUrl: './reviews.page.html'
})
export class ReviewsPage implements OnInit {
  /** Query parameter `q`: search text. */
  readonly q = input<string>();
  /** Query parameter `sort`: a ReviewSort value. */
  readonly sort = input<string>();
  /** Query parameter `page`. */
  readonly page = input<string>();
  private readonly data = inject(SiteDataService);
  private readonly router = inject(Router);
  protected readonly sortOptions = SORT_OPTIONS;
  /** `sort` if valid, otherwise DEFAULT_REVIEW_SORT. */
  protected readonly sortBy = computed(
    () => SORT_OPTIONS.find((option) => option.value === this.sort())?.value ?? DEFAULT_REVIEW_SORT,
  );
  /** undefined while loading. */
  protected readonly latest = signal<ReviewSummary[] | undefined>(undefined);
  protected readonly result = signal<Page<ReviewSummary> | undefined>(undefined);
  protected readonly failed = signal(false);

  constructor() {
    // Re-runs whenever q(), sortBy() or page() changes (all read before the first await).
    effect(() => this.loadPage(this.q() ?? '', this.sortBy(), Number(this.page() ?? 1)), {
      allowSignalWrites: true,
    });
  }

  async ngOnInit(): Promise<void> {
    try {
      this.latest.set(await this.data.latestReviews(REVIEWS_PAGE.latestCount));
    } catch (error) {
      console.error(error);
      this.failed.set(true);
    }
  }

  private async loadPage(search: string, sort: ReviewSort, page: number): Promise<void> {
    this.failed.set(false);
    try {
      this.result.set(await this.data.reviewsPage(search, sort, page, REVIEWS_PAGE.pageSize));
    } catch (error) {
      console.error(error);
      this.failed.set(true);
    }
  }

  /** Puts the search text in the address bar (kept on refresh) and returns to page 1. */
  protected search(text: string): void {
    this.router.navigate([], {
      queryParams: { q: text || null, page: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  /** Puts the sort order in the address bar (omitted for the default) and returns to page 1. */
  protected sortChanged(sort: string): void {
    this.router.navigate([], {
      queryParams: { sort: sort === DEFAULT_REVIEW_SORT ? null : sort, page: null },
      queryParamsHandling: 'merge',
    });
  }
}
