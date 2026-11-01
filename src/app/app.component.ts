/**
 * @file Page template: header with logo and site name, menu bar, and the routed page.
 */

import { ChangeDetectionStrategy, Component, inject, isDevMode } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ViewportScroller } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { SITE_LOGO, SITE_NAME } from './core/site.config';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  protected readonly siteName = SITE_NAME;
  protected readonly siteLogo = SITE_LOGO;
  /** Shows the Edit menu item; true only under ng serve. */
  protected readonly editing = isDevMode();

  constructor() {
    this.scrollToTopOnPageChange();
  }

  /** Scrolls to the top when the path changes; query-only changes (search, sort, page) keep the position. */
  private scrollToTopOnPageChange(): void {
    const scroller = inject(ViewportScroller);
    let previousPath = '';
    inject(Router)
      .events.pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((event) => {
        const path = event.urlAfterRedirects.split('?')[0];
        if (path !== previousPath) {
          scroller.scrollToPosition([0, 0]);
        }
        previousPath = path;
      });
  }
}
