import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NewsItem, ReviewSummary } from '../../data/models';
import { SiteDataService } from '../../data/site-data.service';
import { NewsCardComponent } from '../../shared/news-card.component';
import { ReviewCardComponent } from '../../shared/review-card.component';

const NEWS_COUNT = 3;
const NEW_REVIEW_COUNT = 5;
const OTHER_REVIEW_COUNT = 5;

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [RouterLink, NewsCardComponent, ReviewCardComponent],
  templateUrl: './home.page.html',
})
export class HomePage implements OnInit {
  private readonly data = inject(SiteDataService);
  protected readonly news = signal<NewsItem[] | undefined>(undefined);
  protected readonly newReviews = signal<ReviewSummary[] | undefined>(undefined);
  protected readonly otherReviews = signal<ReviewSummary[] | undefined>(undefined);
  protected readonly failed = signal(false);

  async ngOnInit(): Promise<void> {
    try {
      const [news, newReviews, otherReviews] = await Promise.all([
        this.data.latestNews(NEWS_COUNT),
        this.data.latestReviews(NEW_REVIEW_COUNT),
        this.data.randomReviews(OTHER_REVIEW_COUNT, NEW_REVIEW_COUNT),
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
