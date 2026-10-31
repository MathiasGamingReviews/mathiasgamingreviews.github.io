import { Component, OnInit, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DbService } from '../data/db.service';
import { EditApiService, EditOptions, EditableReview } from './edit-api.service';
import { EditMessage, move, slugify, today } from './edit-helpers';

@Component({
  selector: 'app-review-edit-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './review-edit.page.html',
  styleUrls: ['./admin.css', './review-edit.page.css'],
})
export class ReviewEditPage implements OnInit {
  /** From the address bar: /admin/reviews/new or /admin/reviews/<id> */
  readonly id = input.required<string>();
  private readonly api = inject(EditApiService);
  private readonly db = inject(DbService);
  private readonly router = inject(Router);

  protected form: EditableReview = {
    slug: '',
    gameName: '',
    platform: '',
    logo: '',
    stars: 3,
    reviewDate: today(),
    body: '',
    screenshots: [],
    links: [],
  };
  protected readonly options = signal<EditOptions>({ games: [], platforms: [] });
  protected readonly status = signal<'loading' | 'ready' | 'failed'>('loading');
  protected readonly error = signal('');
  protected readonly busy = signal(false);
  protected readonly stars = [5, 4, 3, 2, 1];
  /** The logo the review had when the page was opened. */
  private originalLogo = '';
  /** Once the web address is typed by hand (or the review already exists), stop filling it in automatically. */
  private slugEdited = false;

  protected get isNew(): boolean {
    return this.id() === 'new';
  }

  async ngOnInit(): Promise<void> {
    try {
      this.options.set(await this.api.options());
      if (!this.isNew) {
        const review = await this.api.review(Number(this.id()));
        this.originalLogo = review.logo;
        this.form = { ...review, logo: '' };
        this.slugEdited = true;
      }
      this.status.set('ready');
    } catch (error) {
      this.error.set((error as Error).message);
      this.status.set('failed');
    }
  }

  /** The game with the name typed in, if it is already in the database. */
  protected existingGame() {
    const name = this.form.gameName.trim().toLowerCase();
    return this.options().games.find((game) => game.name.toLowerCase() === name);
  }

  protected logoPreview(): string {
    return this.form.logo || this.existingGame()?.logo || this.originalLogo || 'logo.svg';
  }

  protected nameChanged(): void {
    if (!this.slugEdited) {
      this.form.slug = slugify(`${this.form.gameName} ${this.form.platform}`);
    }
  }

  protected slugTyped(): void {
    this.slugEdited = true;
  }

  protected async uploadLogo(input: HTMLInputElement): Promise<void> {
    const file = input.files?.[0];
    if (file) {
      await this.whileBusy(async () => {
        this.form.logo = await this.api.upload('logo', file);
      });
    }
    input.value = '';
  }

  protected async addScreenshots(input: HTMLInputElement): Promise<void> {
    const files = Array.from(input.files ?? []);
    await this.whileBusy(async () => {
      for (const file of files) {
        const path = await this.api.upload('screenshot', file, this.form.slug);
        // Start with the file name as the screenshot name: "boss-fight.png" -> "boss fight".
        const name = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');
        this.form.screenshots = [...this.form.screenshots, { file: path, name, description: '' }];
      }
    });
    input.value = '';
  }

  protected moveScreenshot(index: number, by: -1 | 1): void {
    this.form.screenshots = move(this.form.screenshots, index, by);
  }

  protected removeScreenshot(index: number): void {
    this.form.screenshots = this.form.screenshots.filter((_, i) => i !== index);
  }

  protected addLink(): void {
    this.form.links = [...this.form.links, { url: 'https://', description: '' }];
  }

  protected moveLink(index: number, by: -1 | 1): void {
    this.form.links = move(this.form.links, index, by);
  }

  protected removeLink(index: number): void {
    this.form.links = this.form.links.filter((_, i) => i !== index);
  }

  protected async save(): Promise<void> {
    // A renamed game that is not in the database yet keeps the logo the review had.
    const logo = this.form.logo || (this.existingGame() ? '' : this.originalLogo);
    await this.whileBusy(async () => {
      await this.api.saveReview(this.isNew ? null : Number(this.id()), { ...this.form, logo });
      this.done(`Saved the review of ${this.form.gameName} (${this.form.platform}).`);
    });
  }

  protected async delete(): Promise<void> {
    if (!confirm(`Delete the review of ${this.form.gameName} (${this.form.platform})? This cannot be undone here.`)) {
      return;
    }
    await this.whileBusy(async () => {
      await this.api.deleteReview(Number(this.id()));
      this.done(`Deleted the review of ${this.form.gameName} (${this.form.platform}).`);
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
