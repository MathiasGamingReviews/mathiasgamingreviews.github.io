/**
 * @file npm run db:migrate - applies new db/migrations files to public/data/mgr.db, keeping its data.
 */

import { existsSync } from 'node:fs';
import { PATHS } from './lib/config.mjs';
import { runCommand } from './lib/cli.mjs';
import { openDatabase } from './lib/database.mjs';
import { writeDump } from './lib/dump.mjs';
import { applyMigrations } from './lib/migrations.mjs';

await runCommand(() => {
  if (!existsSync(PATHS.database)) {
    throw new Error(`${PATHS.database} does not exist. Run npm run db:create first.`);
  }
  const db = openDatabase(PATHS.database);
  try {
    const { version, applied } = applyMigrations(db);
    if (applied.length) {
      writeDump(db);
    }
    console.log(applied.length ? `Applied: ${applied.join(', ')}` : 'Already up to date.');
    console.log(`Database is at version ${version}.`);
  } finally {
    db.close();
  }
});
