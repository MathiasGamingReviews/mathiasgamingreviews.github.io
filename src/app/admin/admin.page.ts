import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { StarsComponent } from '../shared/stars.component';
import { AdminNewsRow, AdminReviewRow, EditApiService } from './edit-api.service';
import { EditMessage } from './edit-helpers';

/** Overview of everything that can be edited. */
@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [DatePipe, RouterLink, StarsComponent],
  templateUrl: './admin.page.html',
  styleUrl: './admin.css',
})
export class AdminPage implements OnInit {
  private readonly api = inject(EditApiService);
  protected readonly reviews = signal<AdminReviewRow[] | undefined>(undefined);
  protected readonly news = signal<AdminNewsRow[] | undefined>(undefined);
  protected readonly error = signal('');
  /** "Saved ..." / "Deleted ..." from the page we came from. */
  protected readonly message =
    (inject(Router).getCurrentNavigation()?.extras.state as EditMessage | undefined)?.message ?? '';

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
