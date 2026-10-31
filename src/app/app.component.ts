import { Component, inject, isDevMode } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ViewportScroller } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Mathias Gaming Reviews';
  protected readonly editing = isDevMode();

  constructor() {
    // Scroll to the top when going to another page, but not when only the
    // search text or page number changes (that would jump away from the list).
    const router = inject(Router);
    const scroller = inject(ViewportScroller);
    let previousPath = '';
    router.events
      .pipe(
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
