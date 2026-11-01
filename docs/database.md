# Database

One SQLite file, `public/data/mgr.db`, holds everything. Its readable copy `db/data.sql` is rewritten after every
change and committed to git alongside it.

## Tables

| Table               | Columns                                                                                     | Notes                                                    |
| ------------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `platform`          | `id`, `name`                                                                                | Fixed lookup list, filled by migration 003               |
| `game`              | `id`, `name` (unique), `logo`                                                               | One logo per game, shared by its reviews                 |
| `review`            | `id`, `slug` (unique), `game_id`, `platform_id`, `stars` (1-5), `review_date`, `body`       | `slug` is the web address: `/reviews/<slug>`             |
| `review_screenshot` | `id`, `review_id`, `position`, `file`, `name`, `description`                                | Deleted with their review (`ON DELETE CASCADE`)          |
| `review_link`       | `id`, `review_id`, `position`, `url` (http/https only), `description`                       | Deleted with their review                                |
| `news`              | `id`, `title`, `body`, `news_date`                                                          |                                                          |

- Dates are text in the form `YYYY-MM-DD`.
- `body` text: paragraphs separated by a blank line.
- Image paths (`logo`, `file`) are relative to `public/`, e.g. `logos/hades.png`.
- A game with no reviews left is deleted automatically by the edit server.

## Files in `db/`

| File                  | Purpose                                                                                       |
| --------------------- | --------------------------------------------------------------------------------------------- |
| `schema.sql`          | The first version of the tables (version 1). Never edit it; use a migration.                  |
| `migrations/NNN-*.sql`| Changes after version 1. File number = version it creates.                                    |
| `sample-data.sql`     | Example content used by `npm run db:create`.                                                  |
| `data.sql`            | Readable copy of the real database. Written by the edit server; do not edit by hand.          |

## Versions and migrations

The database stores its version in `PRAGMA user_version`. `db/schema.sql` is version 1; each migration file's
number is the version it produces (`002-...sql` makes version 2).

To change the layout (new table, new column, new lookup values):

1. Add `db/migrations/<next number>-<what it does>.sql`, e.g. `004-add-review-summary.sql`:

   ```sql
   ALTER TABLE review ADD COLUMN summary TEXT NOT NULL DEFAULT '';
   ```

2. Run `npm run db:migrate` (`npm run edit` also does this on start). Each migration runs in a transaction: if it
   fails, nothing from it is kept and the version stays the same.
3. If the new column must appear on the site, update the queries in `src/app/data/site-data.service.ts`, the types
   in `models.ts`, and for editing `scripts/lib/edit-api.mjs`, `validation.mjs` and the admin form.
4. Run `npm run check`, then commit the migration together with `public/data/mgr.db` and `db/data.sql`.

Never change or renumber a migration that has been committed: databases that already ran it would not run it again.

### Adding a platform

Platforms are a fixed list so the same platform is never typed two different ways. Add one with a migration, e.g.
`db/migrations/004-add-platform-xbox-360.sql`:

```sql
INSERT INTO platform (name) VALUES ('Xbox 360');
```

Then `npm run db:migrate` (or just `npm run edit`); it appears in the platform drop-down.

## Backups and restoring

`db/data.sql` in git is the backup: every commit is a restore point.

```
git log --oneline -- db/data.sql          list versions
git checkout <commit> -- db/data.sql      take the file from that version
npm run db:restore -- --force             rebuild public/data/mgr.db from it
```

`db:restore` and `db:create` build the new database in a temporary file and only replace `mgr.db` when the build
succeeds, so a broken `data.sql` never destroys the current database.

`.gitattributes` keeps `*.sql` files with LF line endings, so text inside reviews does not change when git checks
the files out on Windows.

## Commands

| Command                         | What it does                                                         |
| ------------------------------- | -------------------------------------------------------------------- |
| `npm run db:migrate`            | Apply new migrations to `public/data/mgr.db` and rewrite `data.sql`  |
| `npm run db:dump`               | Rewrite `db/data.sql` from the database                              |
| `npm run db:restore -- --force` | Rebuild the database from `db/data.sql`                              |
| `npm run db:restore -- <file>`  | Same, into another file (e.g. to inspect an old version)             |
| `npm run db:create -- --force`  | New database from schema, migrations and sample data (**data lost**) |
| `npm run db:create -- <file>`   | Same, into another file                                              |

To look inside the database, open `public/data/mgr.db` with [DB Browser for SQLite](https://sqlitebrowser.org).
Close it before running `npm run edit`.
