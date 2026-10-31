import { isDevMode } from '@angular/core';
import { Routes } from '@angular/router';
import { HomePage } from './pages/home/home.page';
import { NewsItemPage } from './pages/news-item/news-item.page';
import { NewsPage } from './pages/news/news.page';
import { ReviewPage } from './pages/review/review.page';
import { ReviewsPage } from './pages/reviews/reviews.page';

/** The edit pages only exist on the local development server, never on the live site. */
const onlyWhenEditing = [() => isDevMode()];

export const routes: Routes = [
  { path: '', component: HomePage, title: 'Mathias Gaming Reviews' },
  { path: 'news', component: NewsPage, title: 'News - Mathias Gaming Reviews' },
  { path: 'news/:id', component: NewsItemPage },
  { path: 'reviews', component: ReviewsPage, title: 'Reviews - Mathias Gaming Reviews' },
  { path: 'reviews/:slug', component: ReviewPage },
  {
    path: 'admin',
    canMatch: onlyWhenEditing,
    title: 'Edit - Mathias Gaming Reviews',
    loadComponent: () => import('./admin/admin.page').then((m) => m.AdminPage),
  },
  {
    path: 'admin/reviews/:id',
    canMatch: onlyWhenEditing,
    title: 'Edit review - Mathias Gaming Reviews',
    loadComponent: () => import('./admin/review-edit.page').then((m) => m.ReviewEditPage),
  },
  {
    path: 'admin/news/:id',
    canMatch: onlyWhenEditing,
    title: 'Edit news - Mathias Gaming Reviews',
    loadComponent: () => import('./admin/news-edit.page').then((m) => m.NewsEditPage),
  },
  { path: '**', redirectTo: '' },
];
