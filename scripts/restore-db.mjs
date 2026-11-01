/**
 * @file npm run db:restore - rebuilds the database from db/data.sql.
 * To restore an older version: git checkout <commit> -- db/data.sql, then run this.
 *
 * Usage:
 *   npm run db:restore -- --force      replaces public/data/mgr.db
 *   npm run db:restore -- <file>       writes to another file instead
 */

import { readFileSync } from 'node:fs';
import { PATHS } from './lib/config.mjs';
import { runCommand, targetDatabase } from './lib/cli.mjs';
import { buildDatabaseFile, transaction } from './lib/database.mjs';

await runCommand(() => {
  const target = targetDatabase(PATHS.database, 'Use --force to replace it with the contents of db/data.sql.');
  const sql = readFileSync(PATHS.dump, 'utf8');
  buildDatabaseFile(target, (db) => transaction(db, () => db.exec(sql)));
  console.log(`Restored ${target} from db/data.sql`);
});
