/**
 * @file Web address (slug) generation. Same rules as src/app/admin/edit-helpers.ts.
 */

const COMBINING_MARKS = /[̀-ͯ]/g;

/**
 * Lower-case ASCII letters and digits separated by single hyphens: "Pokémon (Switch)" -> "pokemon-switch".
 * @param {string} value
 * @returns {string} The slug; empty if `value` has no letters or digits.
 */
export function slugify(value) {
  return value
    .normalize('NFKD')
    .replace(COMBINING_MARKS, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
