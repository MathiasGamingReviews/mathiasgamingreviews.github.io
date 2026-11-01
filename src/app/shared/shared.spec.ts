/**
 * @file Tests for the small shared building blocks: stars, pager, paragraphs pipe and page titles.
 */

import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { pageTitle } from '../core/page-title';
import { SITE_NAME, STARS } from '../core/site.config';
import { PagerComponent } from './pager/pager.component';
import { ParagraphsPipe } from './paragraphs/paragraphs.pipe';
import { StarsComponent } from './stars/stars.component';

describe('StarsComponent', () => {
  it('fills the given number of stars out of the maximum', () => {
    const fixture = TestBed.createComponent(StarsComponent);
    fixture.componentRef.setInput('stars', 3);
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelectorAll('[aria-hidden]').length).toBe(STARS.max);
    expect(element.querySelectorAll('.filled').length).toBe(3);
    expect(element.querySelector('[role=img]')?.getAttribute('aria-label')).toBe(`3 out of ${STARS.max} stars`);
  });
});

describe('PagerComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideRouter([])] }));

  const render = (page: number, pageCount: number): HTMLElement => {
    const fixture = TestBed.createComponent(PagerComponent);
    fixture.componentRef.setInput('page', page);
    fixture.componentRef.setInput('pageCount', pageCount);
    fixture.detectChanges();
    return fixture.nativeElement;
  };

  it('is hidden for a single page', () => {
    expect(render(1, 1).querySelector('nav')).toBeNull();
  });

  it('shows Previous only after the first page and Next only before the last', () => {
    expect(render(1, 3).textContent).not.toContain('Previous');
    expect(render(3, 3).textContent).not.toContain('Next');
    expect(render(2, 3).querySelector('[aria-current=page]')?.textContent).toBe('2');
  });
});

describe('ParagraphsPipe', () => {
  it('splits on blank lines and drops empty paragraphs', () => {
    expect(new ParagraphsPipe().transform('One\n\nTwo\r\n  \r\nThree\n\n\n')).toEqual(['One', 'Two', 'Three']);
  });

  it('keeps single line breaks inside a paragraph', () => {
    expect(new ParagraphsPipe().transform('Line 1\nLine 2')).toEqual(['Line 1\nLine 2']);
  });
});

describe('pageTitle', () => {
  it('appends the site name', () => {
    expect(pageTitle('News')).toBe(`News - ${SITE_NAME}`);
    expect(pageTitle('')).toBe(SITE_NAME);
  });
});
