import { AfterViewInit, Component, ElementRef, OnDestroy, input, signal, viewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NewsItem } from '../data/models';

/** One news item: title, the first two lines of text and the date. */
@Component({
  selector: 'app-news-card',
  standalone: true,
  imports: [DatePipe, RouterLink],
  template: `
    <article class="news-card">
      <h3><a [routerLink]="['/news', item().id]">{{ item().title }}</a></h3>
      <p #text>{{ item().body }}</p>
      <footer>
        <time [attr.datetime]="item().newsDate">{{ item().newsDate | date: 'd MMMM y' }}</time>
        @if (truncated()) {
          <a [routerLink]="['/news', item().id]">more...</a>
        }
      </footer>
    </article>
  `,
  styleUrl: './news-card.component.css',
})
export class NewsCardComponent implements AfterViewInit, OnDestroy {
  readonly item = input.required<NewsItem>();
  protected readonly truncated = signal(false);
  private readonly text = viewChild.required<ElementRef<HTMLElement>>('text');
  private observer?: ResizeObserver;

  ngAfterViewInit(): void {
    // Show "more..." only when the text does not fit in two lines (depends on screen width).
    const element = this.text().nativeElement;
    this.observer = new ResizeObserver(() => this.truncated.set(element.scrollHeight > element.clientHeight + 1));
    this.observer.observe(element);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
