// Writes the whole database as readable SQL text (db/data.sql), one row per INSERT, in a fixed order.
// Git can show exactly what changed in this file, unlike the binary mgr.db.
// Usage: npm run db:dump    (the edit pages also do this after every save)

import { DatabaseSync } from 'node:sqlite';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export function dumpDatabase(db) {
  const lines = [
    '-- Readable copy of public/data/mgr.db, written automatically after every change in the edit pages.',
    '-- Do not edit by hand. To rebuild the database from this file: npm run db:restore -- --force',
    '',
    `PRAGMA user_version = ${db.prepare('PRAGMA user_version').get().user_version};`,
    '',
  ];
  // sqlite_master lists tables and indexes in the order they were created, so references always come first.
  const objects = db
    .prepare("SELECT type, name, sql FROM sqlite_master WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%' ORDER BY rowid")
    .all();

  for (const { sql } of objects) {
    lines.push(`${sql};`);
  }
  for (const { name } of objects.filter((object) => object.type === 'table')) {
    const rows = db.prepare(`SELECT * FROM "${name}" ORDER BY rowid`).all();
    if (rows.length === 0) {
      continue;
    }
    lines.push('', `-- ${name}`);
    for (const row of rows) {
      const columns = Object.keys(row).join(', ');
      const values = Object.values(row).map(sqlValue).join(', ');
      lines.push(`INSERT INTO ${name} (${columns}) VALUES (${values});`);
    }
  }
  return lines.join('\n') + '\n';
}

function sqlValue(value) {
  if (value === null) {
    return 'NULL';
  }
  if (typeof value === 'number' || typeof value === 'bigint') {
    return String(value);
  }
  if (value instanceof Uint8Array) {
    return `X'${Buffer.from(value).toString('hex')}'`;
  }
  return `'${String(value).replaceAll("'", "''")}'`;
}

export function writeDump(db, root) {
  writeFileSync(join(root, 'db', 'data.sql'), dumpDatabase(db));
}

// Run directly: dump public/data/mgr.db to db/data.sql.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..');
  const db = new DatabaseSync(join(root, 'public', 'data', 'mgr.db'), { readOnly: true });
  writeDump(db, root);
  db.close();
  console.log('Wrote db/data.sql');
}
