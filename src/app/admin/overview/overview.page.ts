/**
 * @file Edit overview: tables of all reviews and news with Edit / View links. Route: /admin (dev mode only).
 */

import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { DATE_FORMAT } from '../../core/site.config';
import { StarsComponent } from '../../shared/stars/stars.component';
import { AdminNewsRow, AdminReviewRow, EditApiService } from '../edit-api.service';
import { EditMessage, NEW_ID } from '../edit-helpers';

@Component({
  selector: 'app-overview-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RouterLink, StarsComponent],
  templateUrl: './overview.page.html',
  styleUrl: '../admin.css',
})
export class OverviewPage implements OnInit {
  private readonly api = inject(EditApiService);
  protected readonly dateFormat = DATE_FORMAT.short;
  protected readonly newId = NEW_ID;
  /** undefined while loading. */
  protected readonly reviews = signal<AdminReviewRow[] | undefined>(undefined);
  protected readonly news = signal<AdminNewsRow[] | undefined>(undefined);
  protected readonly error = signal('');
  /** Result of the save/delete that navigated here, if any. */
  protected readonly result = inject(Router).getCurrentNavigation()?.extras.state as EditMessage | undefined;

  async ngOnInit(): Promise<void> {
    try {
      const [reviews, news] = await Promise.all([this.api.reviews(), this.api.news()]);
      this.reviews.set(reviews);
      this.news.set(news);
    } catch (error) {
      this.error.set((error as Error).message);
    }
  }
}
