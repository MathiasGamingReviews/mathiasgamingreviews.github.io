/**
 * @file Tests for the edit page helpers and FormState.
 */

import { move, nameFromFile, slugify, today } from './edit-helpers';
import { FormState } from './form-state';

describe('slugify', () => {
  it('makes lower-case words separated by hyphens', () => {
    expect(slugify('Hades (PC)')).toBe('hades-pc');
    expect(slugify('Pokémon: Scarlet & Violet')).toBe('pokemon-scarlet-violet');
    expect(slugify(' -- ')).toBe('');
  });
});

describe('today', () => {
  it('formats the local date as YYYY-MM-DD', () => {
    expect(today(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});

describe('move', () => {
  it('swaps an item with its neighbour', () => {
    expect(move(['a', 'b', 'c'], 1, -1)).toEqual(['b', 'a', 'c']);
    expect(move(['a', 'b', 'c'], 1, 1)).toEqual(['a', 'c', 'b']);
  });

  it('leaves the list unchanged at either end', () => {
    const list = ['a', 'b'];
    expect(move(list, 0, -1)).toBe(list);
    expect(move(list, 1, 1)).toBe(list);
  });
});

describe('nameFromFile', () => {
  it('turns a file name into words', () => {
    expect(nameFromFile('boss-fight_2.png')).toBe('boss fight 2');
  });
});

describe('FormState', () => {
  it('is busy while work runs and clear afterwards', async () => {
    const state = new FormState();
    let busyDuringWork = false;
    expect(await state.run(async () => void (busyDuringWork = state.busy()))).toBeTrue();
    expect(busyDuringWork).toBeTrue();
    expect(state.busy()).toBeFalse();
    expect(state.error()).toBe('');
  });

  it('keeps the error message of failed work', async () => {
    const state = new FormState();
    expect(await state.run(() => Promise.reject(new Error('Nope')))).toBeFalse();
    expect(state.error()).toBe('Nope');
    expect(state.busy()).toBeFalse();
  });
});
