/**
 * @file Star rating display (read-only).
 */

import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { STARS } from '../../core/site.config';

/** STARS.max stars, the first `stars` of them filled. Screen readers hear "<n> out of <max> stars". */
@Component({
  selector: 'app-stars',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="stars" role="img" [attr.aria-label]="stars() + ' out of ' + max + ' stars'">
      @for (filled of slots(); track $index) {
        <span [class.filled]="filled" aria-hidden="true">★</span>
      }
    </span>
  `,
  styles: `
    .stars {
      color: var(--star-empty);
      letter-spacing: 0.1em;
      white-space: nowrap;
    }
    .filled {
      color: var(--star);
    }
  `,
})
export class StarsComponent {
  /** Number of filled stars. */
  readonly stars = input.required<number>();
  protected readonly max = STARS.max;
  /** One entry per star: true if filled. */
  protected readonly slots = computed(() => Array.from({ length: this.max }, (_, index) => index < this.stars()));
}
