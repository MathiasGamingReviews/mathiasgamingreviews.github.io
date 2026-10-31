import { Component, ElementRef, computed, input, signal, viewChild } from '@angular/core';
import { Screenshot } from '../data/models';

/** Screenshot thumbnails; clicking one shows it full size with Previous / Next buttons. */
@Component({
  selector: 'app-screenshot-gallery',
  standalone: true,
  templateUrl: './screenshot-gallery.component.html',
  styleUrl: './screenshot-gallery.component.css',
})
export class ScreenshotGalleryComponent {
  readonly screenshots = input.required<Screenshot[]>();
  protected readonly openIndex = signal(0);
  protected readonly open = computed<Screenshot | undefined>(() => this.screenshots()[this.openIndex()]);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  protected show(index: number): void {
    this.openIndex.set(index);
    this.dialog().nativeElement.showModal();
  }

  protected step(by: number): void {
    const count = this.screenshots().length;
    this.openIndex.set((this.openIndex() + by + count) % count);
  }

  protected close(): void {
    this.dialog().nativeElement.close();
  }

  protected backdropClick(event: MouseEvent): void {
    // A click on the dark area around the picture lands on the <dialog> itself.
    if (event.target === this.dialog().nativeElement) {
      this.close();
    }
  }

  protected keydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowLeft') {
      this.step(-1);
    } else if (event.key === 'ArrowRight') {
      this.step(1);
    }
  }
}
