import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScreenshotGalleryComponent } from './screenshot-gallery.component';

describe('ScreenshotGalleryComponent', () => {
  let fixture: ComponentFixture<ScreenshotGalleryComponent>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ScreenshotGalleryComponent] }).compileComponents();
    fixture = TestBed.createComponent(ScreenshotGalleryComponent);
    fixture.componentRef.setInput('screenshots', [
      { file: 'a.svg', name: 'First', description: 'The first one' },
      { file: 'b.svg', name: 'Second', description: '' },
      { file: 'c.svg', name: 'Third', description: 'The last one' },
    ]);
    fixture.detectChanges();
    element = fixture.nativeElement;
  });

  afterEach(() => element.querySelector('dialog')?.close());

  const dialog = () => element.querySelector('dialog')!;
  const caption = () => dialog().querySelector('figcaption strong')?.textContent;
  const click = (selector: string, index = 0) => {
    (element.querySelectorAll(selector)[index] as HTMLElement).click();
    fixture.detectChanges();
  };

  it('shows a thumbnail with name and description for each screenshot', () => {
    expect(element.querySelectorAll('.thumbnails li').length).toBe(3);
    expect(element.querySelector('.thumbnails h3')?.textContent).toBe('First');
    expect(element.querySelectorAll('.thumbnails p').length).toBe(2); // 'Second' has no description
  });

  it('opens the clicked screenshot full size', () => {
    expect(dialog().open).toBeFalse();
    click('.thumbnails button', 1);
    expect(dialog().open).toBeTrue();
    expect(caption()).toBe('Second');
    expect(dialog().querySelector('.counter')?.textContent).toBe('2 / 3');
  });

  it('moves with Previous / Next and wraps around', () => {
    click('.thumbnails button', 2);
    click('.dialog-buttons button', 1); // Next
    expect(caption()).toBe('First');
    click('.dialog-buttons button', 0); // Previous
    expect(caption()).toBe('Third');
  });

  it('moves with the arrow keys', () => {
    click('.thumbnails button', 0);
    dialog().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    fixture.detectChanges();
    expect(caption()).toBe('Second');
  });

  it('closes with the Close button', () => {
    click('.thumbnails button', 0);
    click('.dialog-buttons .close');
    expect(dialog().open).toBeFalse();
  });
});
