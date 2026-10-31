import { Routes } from '@angular/router';
import { HomePage } from './pages/home/home.page';
import { NewsItemPage } from './pages/news-item/news-item.page';
import { NewsPage } from './pages/news/news.page';
import { ReviewPage } from './pages/review/review.page';
import { ReviewsPage } from './pages/reviews/reviews.page';

export const routes: Routes = [
  { path: '', component: HomePage, title: 'Mathias Gaming Reviews' },
  { path: 'news', component: NewsPage, title: 'News - Mathias Gaming Reviews' },
  { path: 'news/:id', component: NewsItemPage },
  { path: 'reviews', component: ReviewsPage, title: 'Reviews - Mathias Gaming Reviews' },
  { path: 'reviews/:slug', component: ReviewPage },
  { path: '**', redirectTo: '' },
];
