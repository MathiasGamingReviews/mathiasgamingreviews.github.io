/**
 * @file Command-line helpers shared by the scripts in scripts/.
 */

import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

export const FORCE_FLAG = '--force';

/**
 * Database file a create/restore command writes to: the first non-flag argument, or `fallback`.
 * Exits with code 1 if that file exists and --force was not given.
 * @param {string} fallback Default target path.
 * @param {string} refuseMessage Shown when the target exists without --force.
 * @returns {string} Absolute target path.
 */
export function targetDatabase(fallback, refuseMessage) {
  const args = process.argv.slice(2);
  const named = args.find((arg) => !arg.startsWith('--'));
  const target = named ? resolve(named) : fallback;
  if (existsSync(target) && !args.includes(FORCE_FLAG)) {
    console.error(`${target} already exists. ${refuseMessage}`);
    process.exit(1);
  }
  return target;
}

/**
 * Runs `main`, printing only the message of an error (no stack trace) and exiting with code 1.
 * @param {() => unknown | Promise<unknown>} main
 */
export async function runCommand(main) {
  try {
    await main();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
