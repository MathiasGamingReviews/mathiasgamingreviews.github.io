import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Previous / page numbers / Next links. Keeps other query parameters such as the search text. */
@Component({
  selector: 'app-pager',
  standalone: true,
  imports: [RouterLink],
  template: `
    @if (pageCount() > 1) {
      <nav class="pager" aria-label="Pages">
        @if (page() > 1) {
          <a [routerLink]="[]" [queryParams]="{ page: page() - 1 }" queryParamsHandling="merge">‹ Previous</a>
        }
        @for (n of pages(); track n) {
          <a
            [routerLink]="[]"
            [queryParams]="{ page: n }"
            queryParamsHandling="merge"
            [class.current]="n === page()"
            [attr.aria-current]="n === page() ? 'page' : null"
            >{{ n }}</a
          >
        }
        @if (page() < pageCount()) {
          <a [routerLink]="[]" [queryParams]="{ page: page() + 1 }" queryParamsHandling="merge">Next ›</a>
        }
      </nav>
    }
  `,
  styles: `
    .pager { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.4rem; margin-top: 1.5rem; }
    a {
      min-width: 2.4rem; padding: 0.4rem 0.75rem; text-align: center; text-decoration: none;
      border-radius: var(--radius); border: 1px solid var(--border); background: var(--surface); color: var(--text);
    }
    a:hover { border-color: var(--accent); }
    a.current { background: var(--accent); border-color: var(--accent); color: #fff; }
  `,
})
export class PagerComponent {
  readonly page = input.required<number>();
  readonly pageCount = input.required<number>();
  protected readonly pages = computed(() => Array.from({ length: this.pageCount() }, (_, i) => i + 1));
}
