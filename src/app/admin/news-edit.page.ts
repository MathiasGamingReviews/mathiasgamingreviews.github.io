import { Component, OnInit, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DbService } from '../data/db.service';
import { EditApiService, EditableNews } from './edit-api.service';
import { EditMessage, today } from './edit-helpers';

@Component({
  selector: 'app-news-edit-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './news-edit.page.html',
  styleUrl: './admin.css',
})
export class NewsEditPage implements OnInit {
  /** From the address bar: /admin/news/new or /admin/news/<id> */
  readonly id = input.required<string>();
  private readonly api = inject(EditApiService);
  private readonly db = inject(DbService);
  private readonly router = inject(Router);

  protected form: EditableNews = { title: '', body: '', newsDate: today() };
  protected readonly status = signal<'loading' | 'ready' | 'failed'>('loading');
  protected readonly error = signal('');
  protected readonly busy = signal(false);

  protected get isNew(): boolean {
    return this.id() === 'new';
  }

  async ngOnInit(): Promise<void> {
    try {
      if (!this.isNew) {
        this.form = await this.api.newsItem(Number(this.id()));
      }
      this.status.set('ready');
    } catch (error) {
      this.error.set((error as Error).message);
      this.status.set('failed');
    }
  }

  protected async save(): Promise<void> {
    await this.whileBusy(async () => {
      await this.api.saveNews(this.isNew ? null : Number(this.id()), this.form);
      this.done(`Saved the news item "${this.form.title}".`);
    });
  }

  protected async delete(): Promise<void> {
    if (!confirm(`Delete the news item "${this.form.title}"? This cannot be undone here.`)) {
      return;
    }
    await this.whileBusy(async () => {
      await this.api.deleteNews(Number(this.id()));
      this.done(`Deleted the news item "${this.form.title}".`);
    });
  }

  private done(message: string): void {
    this.db.reload();
    this.router.navigate(['/admin'], { state: { message } satisfies EditMessage });
  }

  private async whileBusy(work: () => Promise<void>): Promise<void> {
    this.busy.set(true);
    this.error.set('');
    try {
      await work();
    } catch (error) {
      this.error.set((error as Error).message);
    } finally {
      this.busy.set(false);
    }
  }
}
