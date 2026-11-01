/**
 * @file npm run db:dump - rewrites db/data.sql from public/data/mgr.db.
 * The edit server does this automatically after every change.
 */

import { PATHS } from './lib/config.mjs';
import { runCommand } from './lib/cli.mjs';
import { openDatabase } from './lib/database.mjs';
import { writeDump } from './lib/dump.mjs';

await runCommand(() => {
  const db = openDatabase(PATHS.database, { readOnly: true });
  try {
    writeDump(db);
  } finally {
    db.close();
  }
  console.log('Wrote db/data.sql');
});
