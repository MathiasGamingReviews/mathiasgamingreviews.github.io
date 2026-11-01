/**
 * @file Browser tab titles: "<page> - <site name>", or the site name alone.
 */

import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { SITE_NAME } from './site.config';

const SEPARATOR = ' - ';

/**
 * @param page Page name; omitted or empty for the site name alone.
 * @returns Full tab title.
 */
export function pageTitle(page?: string): string {
  return page ? `${page}${SEPARATOR}${SITE_NAME}` : SITE_NAME;
}

/**
 * Applies pageTitle() to the `title` of each route.
 * Routes without a `title` are skipped: their page sets the title once its data has loaded.
 */
@Injectable({ providedIn: 'root' })
export class SiteTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const page = this.buildTitle(snapshot);
    if (page !== undefined) {
      this.title.setTitle(pageTitle(page));
    }
  }
}
