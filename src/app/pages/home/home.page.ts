/**
 * @file Home page: latest news, newest reviews, then a random selection of older reviews.
 */

import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HOME_PAGE } from '../../core/site.config';
import { NewsItem, ReviewSummary } from '../../data/models';
import { SiteDataService } from '../../data/site-data.service';
import { NewsCardComponent } from '../../shared/news-card/news-card.component';
import { ReviewCardComponent } from '../../shared/review-card/review-card.component';

@Component({
    selector: 'app-home-page',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [RouterLink, NewsCardComponent, ReviewCardComponent],
    templateUrl: './home.page.html'
})
export class HomePage implements OnInit {
  private readonly data = inject(SiteDataService);
  /** undefined while loading. */
  protected readonly news = signal<NewsItem[] | undefined>(undefined);
  protected readonly newReviews = signal<ReviewSummary[] | undefined>(undefined);
  protected readonly otherReviews = signal<ReviewSummary[] | undefined>(undefined);
  protected readonly failed = signal(false);

  async ngOnInit(): Promise<void> {
    try {
      const [news, newReviews, otherReviews] = await Promise.all([
        this.data.latestNews(HOME_PAGE.newsCount),
        this.data.latestReviews(HOME_PAGE.newReviewCount),
        this.data.randomReviews(HOME_PAGE.randomReviewCount, HOME_PAGE.newReviewCount),
      ]);
      this.news.set(news);
      this.newReviews.set(newReviews);
      this.otherReviews.set(otherReviews);
    } catch (error) {
      console.error(error);
      this.failed.set(true);
    }
  }
}
