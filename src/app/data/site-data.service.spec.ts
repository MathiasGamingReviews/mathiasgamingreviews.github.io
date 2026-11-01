/**
 * @file Tests for the paging and search helpers of SiteDataService.
 */

import { likePattern, paging } from './site-data.service';

describe('paging', () => {
  it('returns the requested page with its row offset', () => {
    expect(paging(2, 10, 25)).toEqual({ current: 2, offset: 10, pageCount: 3 });
  });

  it('clamps the page to the available pages', () => {
    expect(paging(9, 10, 25).current).toBe(3);
    expect(paging(0, 10, 25).current).toBe(1);
    expect(paging(NaN, 10, 25).current).toBe(1);
    expect(paging(1.7, 10, 25).current).toBe(1);
  });

  it('has one (empty) page for an empty list', () => {
    expect(paging(1, 10, 0)).toEqual({ current: 1, offset: 0, pageCount: 1 });
  });
});

describe('likePattern', () => {
  it('matches the text anywhere', () => {
    expect(likePattern('mario')).toBe('%mario%');
  });

  it('escapes LIKE wildcards so they match literally', () => {
    expect(likePattern('100%_\\')).toBe('%100\\%\\_\\\\%');
  });
});
