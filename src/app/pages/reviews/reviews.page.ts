import { Component, OnInit, effect, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Page, ReviewSummary } from '../../data/models';
import { SiteDataService } from '../../data/site-data.service';
import { PagerComponent } from '../../shared/pager.component';
import { ReviewCardComponent } from '../../shared/review-card.component';

const LATEST_COUNT = 5;
const PAGE_SIZE = 10;

@Component({
  selector: 'app-reviews-page',
  standalone: true,
  imports: [PagerComponent, ReviewCardComponent],
  templateUrl: './reviews.page.html',
})
export class ReviewsPage implements OnInit {
  /** From the address bar: /reviews?q=mario&page=2 */
  readonly q = input<string>();
  readonly page = input<string>();
  private readonly data = inject(SiteDataService);
  private readonly router = inject(Router);
  protected readonly latest = signal<ReviewSummary[] | undefined>(undefined);
  protected readonly result = signal<Page<ReviewSummary> | undefined>(undefined);
  protected readonly failed = signal(false);

  constructor() {
    // Runs again whenever the search or page in the address bar changes.
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
      this.result.set(await this.data.reviewsPage(this.q() ?? '', Number(this.page() ?? 1), PAGE_SIZE));
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
}
