/**
 * @file Tests for migrations, the SQL dump and database file building.
 */

import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, describe, it } from 'node:test';
import { buildDatabaseFile, getVersion, openDatabase, setVersion } from '../lib/database.mjs';
import { dumpDatabase, sqlLiteral } from '../lib/dump.mjs';
import { applyMigrations, listMigrations } from '../lib/migrations.mjs';
import { createTestDatabase } from './helpers.mjs';

const temp = mkdtempSync(join(tmpdir(), 'mgr-test-'));
after(() => rmSync(temp, { recursive: true, force: true }));

describe('migrations', () => {
  it('brings a new database to the number of the last migration', () => {
    const db = createTestDatabase();
    const last = listMigrations().at(-1).number;
    assert.equal(getVersion(db), last);
  });

  it('prepopulates the platform lookup table, keeping the first ids stable', () => {
    const db = createTestDatabase();
    const platforms = db.prepare('SELECT id, name FROM platform ORDER BY id').all();
    assert.ok(platforms.length > 0);
    assert.deepEqual({ ...platforms[0] }, { id: 1, name: 'PC' });
  });

  it('refuses an empty database instead of treating it as the schema version', () => {
    const db = openDatabase(':memory:');
    assert.throws(() => applyMigrations(db), /empty/);
  });

  it('rolls back a failing migration and keeps the previous version', () => {
    const db = createTestDatabase();
    const version = getVersion(db);
    const folder = mkdtempSync(join(temp, 'migrations-'));
    writeFileSync(
      join(folder, `${version + 1}-broken.sql`),
      'CREATE TABLE extra (id INTEGER); INSERT INTO missing VALUES (1);',
    );
    assert.throws(() => applyMigrations(db, folder), /broken/);
    assert.equal(getVersion(db), version);
    assert.equal(db.prepare("SELECT 1 FROM sqlite_master WHERE name = 'extra'").get(), undefined);
  });
});

describe('dump', () => {
  it('writes SQL literals for every column type', () => {
    assert.equal(sqlLiteral(null), 'NULL');
    assert.equal(sqlLiteral(5), '5');
    assert.equal(sqlLiteral("it's"), "'it''s'");
    assert.equal(sqlLiteral(new Uint8Array([1, 255])), "X'01ff'");
  });

  it('restores to an identical database (quotes, new lines, unicode)', () => {
    const db = createTestDatabase({ sampleData: true });
    db.prepare('INSERT INTO news (title, body, news_date) VALUES (?, ?, ?)').run(
      'Mathias\'s "best" game 🎮',
      'Line one.\n\nLine two; -- not a comment',
      '2026-01-01',
    );
    const sql = dumpDatabase(db);

    const copy = openDatabase(':memory:');
    copy.exec(sql);
    assert.equal(dumpDatabase(copy), sql);
  });
});

describe('buildDatabaseFile', () => {
  it('keeps the existing file when the build fails', () => {
    const file = join(temp, 'keep.db');
    buildDatabaseFile(file, (db) => setVersion(db, 7));
    assert.throws(() => buildDatabaseFile(file, (db) => db.exec('NOT SQL')));

    const db = openDatabase(file, { readOnly: true });
    assert.equal(getVersion(db), 7);
    db.close();
    assert.equal(existsSync(`${file}.tmp`), false);
  });

  it('replaces the file when the build succeeds', () => {
    const file = join(temp, 'replace.db');
    buildDatabaseFile(file, (db) => setVersion(db, 1));
    buildDatabaseFile(file, (db) => setVersion(db, 2));
    const db = openDatabase(file, { readOnly: true });
    assert.equal(getVersion(db), 2);
    db.close();
    assert.ok(readFileSync(file).length > 0);
  });
});
