/**
 * @file Review form: create or edit a review with logo, screenshots and links.
 * Route: /admin/reviews/:id, where :id is a review id or NEW_ID (dev mode only).
 */

import { ChangeDetectionStrategy, Component, OnInit, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DEFAULT_LOGO, NEW_REVIEW_STARS, STARS, UPLOAD_ACCEPT } from '../../core/site.config';
import { DbService } from '../../data/db.service';
import { EditApiService, EditOptions, EditableReview, NO_PLATFORM, SaveResult } from '../edit-api.service';
import { EditMessage, NEW_ID, move, nameFromFile, slugify, today } from '../edit-helpers';
import { FormState } from '../form-state';

/** Pre-filled address of a new link. */
const NEW_LINK_URL = 'https://';

@Component({
    selector: 'app-review-edit-page',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FormsModule, RouterLink],
    templateUrl: './review-edit.page.html',
    styleUrls: ['../admin.css', './review-edit.page.css']
})
export class ReviewEditPage implements OnInit {
  /** Route parameter `:id`. */
  readonly id = input.required<string>();
  private readonly api = inject(EditApiService);
  private readonly db = inject(DbService);
  private readonly router = inject(Router);

  protected form: EditableReview = {
    slug: '',
    gameName: '',
    platformId: NO_PLATFORM,
    logo: '',
    stars: NEW_REVIEW_STARS,
    reviewDate: today(),
    body: '',
    screenshots: [],
    links: [],
  };
  protected readonly noPlatform = NO_PLATFORM;
  /** Star choices, highest first. */
  protected readonly starChoices = Array.from({ length: STARS.max - STARS.min + 1 }, (_, index) => STARS.max - index);
  protected readonly maxStars = STARS.max;
  protected readonly uploadAccept = UPLOAD_ACCEPT;
  protected readonly options = signal<EditOptions>({ games: [], platforms: [] });
  protected readonly status = signal<'loading' | 'ready' | 'failed'>('loading');
  protected readonly state = new FormState();
  /** Logo of the review's game when the page was opened. */
  private originalLogo = '';
  /** True once the web address was typed by hand or belongs to an existing review: no more auto-fill. */
  private slugEdited = false;

  protected get isNew(): boolean {
    return this.id() === NEW_ID;
  }

  async ngOnInit(): Promise<void> {
    try {
      this.options.set(await this.api.options());
      if (!this.isNew) {
        const review = await this.api.review(Number(this.id()));
        this.originalLogo = review.logo;
        // form.logo holds only a newly uploaded logo.
        this.form = { ...review, logo: '' };
        this.slugEdited = true;
      }
      this.status.set('ready');
    } catch (error) {
      this.state.error.set((error as Error).message);
      this.status.set('failed');
    }
  }

  /** @returns The game in the database with the typed name (case-insensitive), if any. */
  protected existingGame(): EditOptions['games'][number] | undefined {
    const name = this.form.gameName.trim().toLowerCase();
    return this.options().games.find((game) => game.name.toLowerCase() === name);
  }

  /** @returns Name of the chosen platform, or '' if none is chosen. */
  protected platformName(): string {
    return this.options().platforms.find((platform) => platform.id === this.form.platformId)?.name ?? '';
  }

  /** @returns The logo to show: new upload, then the typed game's logo, then the original, then the default. */
  protected logoPreview(): string {
    return this.form.logo || this.existingGame()?.logo || this.originalLogo || DEFAULT_LOGO;
  }

  /** Fills in the web address from game and platform until it is edited by hand. */
  protected nameChanged(): void {
    if (!this.slugEdited) {
      this.form.slug = slugify(`${this.form.gameName} ${this.platformName()}`);
    }
  }

  protected slugTyped(): void {
    this.slugEdited = true;
  }

  protected async uploadLogo(input: HTMLInputElement): Promise<void> {
    const file = input.files?.[0];
    if (file) {
      await this.state.run(async () => {
        this.form.logo = await this.api.upload('logo', file);
      });
    }
    input.value = '';
  }

  /** Uploads the chosen files one by one; each becomes a screenshot named after its file. */
  protected async addScreenshots(input: HTMLInputElement): Promise<void> {
    const files = Array.from(input.files ?? []);
    await this.state.run(async () => {
      for (const file of files) {
        const path = await this.api.upload('screenshot', file, this.form.slug);
        this.form.screenshots = [
          ...this.form.screenshots,
          { file: path, name: nameFromFile(file.name), description: '' },
        ];
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
    this.form.links = [...this.form.links, { url: NEW_LINK_URL, description: '' }];
  }

  protected moveLink(index: number, by: -1 | 1): void {
    this.form.links = move(this.form.links, index, by);
  }

  protected removeLink(index: number): void {
    this.form.links = this.form.links.filter((_, i) => i !== index);
  }

  protected async save(): Promise<void> {
    // Renamed to a game not in the database: the new game gets the logo the review had.
    const logo = this.form.logo || (this.existingGame() ? '' : this.originalLogo);
    await this.state.run(async () => {
      const result = await this.api.saveReview(this.isNew ? null : Number(this.id()), { ...this.form, logo });
      this.done(`Saved the review of ${this.describe()}.`, result);
    });
  }

  protected async delete(): Promise<void> {
    if (!confirm(`Delete the review of ${this.describe()}? This cannot be undone here.`)) {
      return;
    }
    await this.state.run(async () => {
      const result = await this.api.deleteReview(Number(this.id()));
      this.done(`Deleted the review of ${this.describe()}.`, result);
    });
  }

  /** @returns "Game (Platform)" for messages. */
  private describe(): string {
    return `${this.form.gameName} (${this.platformName()})`;
  }

  /** Reloads the site database and returns to the overview with a message. */
  private done(message: string, { warning }: SaveResult): void {
    this.db.reload();
    this.router.navigate(['/admin'], { state: { message, warning } satisfies EditMessage });
  }
}
