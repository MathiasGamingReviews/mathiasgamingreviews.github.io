/**
 * @file Routes. Admin routes match only in dev mode (ng serve), so production builds cannot reach them.
 */

import { isDevMode } from '@angular/core';
import { Routes } from '@angular/router';
import { HomePage } from './pages/home/home.page';
import { NewsItemPage } from './pages/news-item/news-item.page';
import { NewsPage } from './pages/news/news.page';
import { ReviewPage } from './pages/review/review.page';
import { ReviewsPage } from './pages/reviews/reviews.page';

/** canMatch guard: true only in dev mode. */
const devModeOnly = [() => isDevMode()];

/** Titles are completed by SiteTitleStrategy; pages with a dynamic title set it themselves. */
export const routes: Routes = [
  { path: '', component: HomePage, title: '' },
  { path: 'news', component: NewsPage, title: 'News' },
  { path: 'news/:id', component: NewsItemPage },
  { path: 'reviews', component: ReviewsPage, title: 'Reviews' },
  { path: 'reviews/:slug', component: ReviewPage },
  {
    path: 'admin',
    canMatch: devModeOnly,
    title: 'Edit',
    loadComponent: () => import('./admin/overview/overview.page').then((m) => m.OverviewPage),
  },
  {
    path: 'admin/reviews/:id',
    canMatch: devModeOnly,
    title: 'Edit review',
    loadComponent: () => import('./admin/review-edit/review-edit.page').then((m) => m.ReviewEditPage),
  },
  {
    path: 'admin/news/:id',
    canMatch: devModeOnly,
    title: 'Edit news',
    loadComponent: () => import('./admin/news-edit/news-edit.page').then((m) => m.NewsEditPage),
  },
  { path: '**', redirectTo: '' },
];
