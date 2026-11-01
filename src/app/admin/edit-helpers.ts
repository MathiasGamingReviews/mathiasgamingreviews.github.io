/**
 * @file Small helpers for the edit pages.
 */

const COMBINING_MARKS = /[̀-ͯ]/g;

/**
 * Web address (slug) for a review: "Hades (PC)" -> "hades-pc".
 * Same rules as scripts/lib/slugify.mjs, which the edit server applies again on save.
 */
export function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(COMBINING_MARKS, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** @returns Today's date as YYYY-MM-DD in the local time zone. */
export function today(now = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  // getMonth() is 0-based.
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/**
 * @param by -1 moves the item up, +1 down.
 * @returns A copy of `list` with the item at `index` swapped with its neighbour; `list` itself if it cannot move.
 */
export function move<T>(list: T[], index: number, by: -1 | 1): T[] {
  const target = index + by;
  if (target < 0 || target >= list.length) {
    return list;
  }
  const copy = [...list];
  [copy[index], copy[target]] = [copy[target], copy[index]];
  return copy;
}

/**
 * @returns A screenshot name from its file name: "boss-fight_2.png" -> "boss fight 2".
 */
export function nameFromFile(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');
}

/** Router navigation state passed to the overview page after saving or deleting. */
export interface EditMessage {
  message: string;
  /** Set when the change was saved but something else needs attention. */
  warning?: string;
}

/** Route parameter value for "create a new item" (/admin/reviews/new, /admin/news/new). */
export const NEW_ID = 'new';
