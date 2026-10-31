/** Turns "Hades (PC)" into "hades-pc" for use in a web address. Same rules as scripts/edit-server.mjs. */
export function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Today's date as YYYY-MM-DD in the computer's own time zone. */
export function today(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Moves an item one place up (-1) or down (+1) in a list. */
export function move<T>(list: T[], index: number, by: -1 | 1): T[] {
  const target = index + by;
  if (target < 0 || target >= list.length) {
    return list;
  }
  const copy = [...list];
  [copy[index], copy[target]] = [copy[target], copy[index]];
  return copy;
}

/** A message passed to the edit overview after saving or deleting. */
export interface EditMessage {
  message: string;
}
