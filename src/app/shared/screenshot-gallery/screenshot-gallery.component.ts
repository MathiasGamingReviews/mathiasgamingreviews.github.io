/**
 * @file Screenshot thumbnails with a full-size viewer (modal <dialog>).
 */

import { ChangeDetectionStrategy, Component, ElementRef, computed, input, signal, viewChild } from '@angular/core';
import { Screenshot } from '../../data/models';

/** Keyboard keys that move to the previous / next screenshot in the viewer. */
const STEP_KEYS: Record<string, -1 | 1> = { ArrowLeft: -1, ArrowRight: 1 };

/**
 * Thumbnail grid; clicking one opens it full size with Previous / Next (wrapping around),
 * arrow keys, Close, Escape (native <dialog>) and a click outside the picture.
 */
@Component({
  selector: 'app-screenshot-gallery',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './screenshot-gallery.component.html',
  styleUrl: './screenshot-gallery.component.css',
})
export class ScreenshotGalleryComponent {
  readonly screenshots = input.required<Screenshot[]>();
  /** Index of the screenshot shown in the viewer. */
  protected readonly openIndex = signal(0);
  protected readonly open = computed<Screenshot | undefined>(() => this.screenshots()[this.openIndex()]);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  /** Opens the viewer at `index`. */
  protected show(index: number): void {
    this.openIndex.set(index);
    this.dialog().nativeElement.showModal();
  }

  /** Moves `by` screenshots (-1 previous, +1 next), wrapping around at either end. */
  protected step(by: number): void {
    const count = this.screenshots().length;
    this.openIndex.set((this.openIndex() + by + count) % count);
  }

  protected close(): void {
    this.dialog().nativeElement.close();
  }

  /** Closes on a click on the backdrop: such clicks target the <dialog> element itself. */
  protected backdropClick(event: MouseEvent): void {
    if (event.target === this.dialog().nativeElement) {
      this.close();
    }
  }

  protected keydown(event: KeyboardEvent): void {
    const by = STEP_KEYS[event.key];
    if (by) {
      this.step(by);
    }
  }
}
