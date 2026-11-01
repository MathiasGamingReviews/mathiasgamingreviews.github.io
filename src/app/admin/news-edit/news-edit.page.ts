/**
 * @file News form: create or edit a news item.
 * Route: /admin/news/:id, where :id is a news id or NEW_ID (dev mode only).
 */

import { ChangeDetectionStrategy, Component, OnInit, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DbService } from '../../data/db.service';
import { EditApiService, EditableNews, SaveResult } from '../edit-api.service';
import { EditMessage, NEW_ID, today } from '../edit-helpers';
import { FormState } from '../form-state';

@Component({
  selector: 'app-news-edit-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink],
  templateUrl: './news-edit.page.html',
  styleUrl: '../admin.css',
})
export class NewsEditPage implements OnInit {
  /** Route parameter `:id`. */
  readonly id = input.required<string>();
  private readonly api = inject(EditApiService);
  private readonly db = inject(DbService);
  private readonly router = inject(Router);

  protected form: EditableNews = { title: '', body: '', newsDate: today() };
  protected readonly status = signal<'loading' | 'ready' | 'failed'>('loading');
  protected readonly state = new FormState();

  protected get isNew(): boolean {
    return this.id() === NEW_ID;
  }

  async ngOnInit(): Promise<void> {
    try {
      if (!this.isNew) {
        this.form = await this.api.newsItem(Number(this.id()));
      }
      this.status.set('ready');
    } catch (error) {
      this.state.error.set((error as Error).message);
      this.status.set('failed');
    }
  }

  protected async save(): Promise<void> {
    await this.state.run(async () => {
      const result = await this.api.saveNews(this.isNew ? null : Number(this.id()), this.form);
      this.done(`Saved the news item "${this.form.title}".`, result);
    });
  }

  protected async delete(): Promise<void> {
    if (!confirm(`Delete the news item "${this.form.title}"? This cannot be undone here.`)) {
      return;
    }
    await this.state.run(async () => {
      const result = await this.api.deleteNews(Number(this.id()));
      this.done(`Deleted the news item "${this.form.title}".`, result);
    });
  }

  /** Reloads the site database and returns to the overview with a message. */
  private done(message: string, { warning }: SaveResult): void {
    this.db.reload();
    this.router.navigate(['/admin'], { state: { message, warning } satisfies EditMessage });
  }
}
