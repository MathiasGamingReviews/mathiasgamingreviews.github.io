import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-stars',
  standalone: true,
  template: `
    <span class="stars" role="img" [attr.aria-label]="stars() + ' out of 5 stars'">
      @for (filled of slots(); track $index) {
        <span [class.filled]="filled" aria-hidden="true">★</span>
      }
    </span>
  `,
  styles: `
    .stars { color: var(--star-empty); letter-spacing: 0.1em; white-space: nowrap; }
    .filled { color: var(--star); }
  `,
})
export class StarsComponent {
  readonly stars = input.required<number>();
  protected readonly slots = computed(() => [1, 2, 3, 4, 5].map((n) => n <= this.stars()));
}
