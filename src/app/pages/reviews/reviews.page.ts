import { Component, OnInit, computed, effect, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Page, ReviewSort, ReviewSummary } from '../../data/models';
import { SiteDataService } from '../../data/site-data.service';
import { PagerComponent } from '../../shared/pager.component';
import { ReviewCardComponent } from '../../shared/review-card.component';

const LATEST_COUNT = 5;
const PAGE_SIZE = 10;

const SORT_OPTIONS: { value: ReviewSort; label: string }[] = [
  { value: 'date', label: 'Review Date' },
  { value: 'platform', label: 'Platform' },
  { value: 'score', label: 'Score' },
  { value: 'name', label: 'Name' },
];

@Component({
  selector: 'app-reviews-page',
  standalone: true,
  imports: [PagerComponent, ReviewCardComponent],
  templateUrl: './reviews.page.html',
})
export class ReviewsPage implements OnInit {
  /** From the address bar: /reviews?q=mario&sort=score&page=2 */
  readonly q = input<string>();
  readonly sort = input<string>();
  readonly page = input<string>();
  private readonly data = inject(SiteDataService);
  private readonly router = inject(Router);
  protected readonly sortOptions = SORT_OPTIONS;
  /** The chosen sort order; Name (alphabetical) unless the address bar says otherwise. */
  protected readonly sortBy = computed(
    () => SORT_OPTIONS.find((option) => option.value === this.sort())?.value ?? 'name',
  );
  protected readonly latest = signal<ReviewSummary[] | undefined>(undefined);
  protected readonly result = signal<Page<ReviewSummary> | undefined>(undefined);
  protected readonly failed = signal(false);

  constructor() {
    // Runs again whenever the search, sort or page in the address bar changes.
    effect(() => this.loadPage(), { allowSignalWrites: true });
  }

  async ngOnInit(): Promise<void> {
    try {
      this.latest.set(await this.data.latestReviews(LATEST_COUNT));
    } catch (error) {
      console.error(error);
      this.failed.set(true);
    }
  }

  private async loadPage(): Promise<void> {
    try {
      this.result.set(
        await this.data.reviewsPage(this.q() ?? '', this.sortBy(), Number(this.page() ?? 1), PAGE_SIZE),
      );
    } catch (error) {
      console.error(error);
      this.failed.set(true);
    }
  }

  protected search(text: string): void {
    // Put the search in the address bar so it survives a refresh; start again at page 1.
    this.router.navigate([], {
      queryParams: { q: text || null, page: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  protected sortChanged(sort: string): void {
    // Name is the default, so leave it out of the address bar; start again at page 1.
    this.router.navigate([], {
      queryParams: { sort: sort === 'name' ? null : sort, page: null },
      queryParamsHandling: 'merge',
    });
  }
}
