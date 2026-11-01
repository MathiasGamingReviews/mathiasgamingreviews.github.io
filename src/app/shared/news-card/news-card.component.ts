/**
 * @file News card: title, first lines of the text, date and a "more..." link when the text is cut off.
 */

import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DATE_FORMAT } from '../../core/site.config';
import { NewsItem } from '../../data/models';

/** Rounding tolerance (px) when comparing the text's full and visible height. */
const OVERFLOW_TOLERANCE_PX = 1;

/** The number of visible text lines is set by -webkit-line-clamp in news-card.component.css. */
@Component({
  selector: 'app-news-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RouterLink],
  template: `
    <article class="news-card">
      <h3>
        <a [routerLink]="['/news', item().id]">{{ item().title }}</a>
      </h3>
      <p #text>{{ item().body }}</p>
      <footer>
        <time [attr.datetime]="item().newsDate">{{ item().newsDate | date: dateFormat }}</time>
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
  protected readonly dateFormat = DATE_FORMAT.long;
  /** True while the text is cut off (depends on the card width). */
  protected readonly truncated = signal(false);
  private readonly text = viewChild.required<ElementRef<HTMLElement>>('text');
  private observer?: ResizeObserver;

  ngAfterViewInit(): void {
    const element = this.text().nativeElement;
    this.observer = new ResizeObserver(() =>
      this.truncated.set(element.scrollHeight > element.clientHeight + OVERFLOW_TOLERANCE_PX),
    );
    this.observer.observe(element);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
