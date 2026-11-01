# How the site works

## The live site

```
Browser ──GET──> static files (GitHub Pages / HostPapa)
                 ├── index.html, main-*.js, styles-*.css    the Angular app
                 ├── sql-wasm-browser.wasm                  SQLite compiled to WebAssembly (sql.js)
                 ├── data/mgr.db                            all reviews and news
                 └── logos/, screenshots/                   images
```

1. The browser loads the Angular app.
2. On the first page that needs data, `DbService` downloads `data/mgr.db` once and opens it in memory with sql.js.
3. `SiteDataService` runs SQL `SELECT` queries on it; the pages show the results.

There is no server-side code. The database is read-only on the live site. Every address (`/reviews/hades-pc`) is
handled by the Angular router in the browser; `public/.htaccess` makes HostPapa answer every unknown address with
`index.html` so links work when opened directly.

## Editing (your own computer only)

```
Browser ──> ng serve :4200 ──┬── Angular app (dev mode, with /admin pages)
                             └── proxy (proxy.conf.json): /api, /data, /logos, /screenshots
                                   │
                                   v
                             edit server :4201 (scripts/lib/edit-server.mjs)
                                   ├── /api/...  JSON API: writes public/data/mgr.db and images
                                   ├── /data, /logos, /screenshots  files read from disk
                                   └── after every change: rewrites db/data.sql
```

`npm run edit` (`scripts/edit.mjs`) starts the edit server, then `ng serve` with the proxy, then opens `/admin`.

- **Admin pages exist only in dev mode.** The `/admin` routes use a `canMatch` guard that returns `isDevMode()`, so a
  production build (`ng build`, `ng deploy`) cannot reach them, and there is no edit server on the live site anyway.
- **Live reload is off** while editing (`--live-reload=false`): saving writes files under `public/`, which would
  otherwise reload the page and lose a half-filled form.
- **Static files:** `ng serve` serves files that are in `public/` itself; the proxy entries for `/data`, `/logos` and
  `/screenshots` cover what it does not have (e.g. images uploaded while it runs).
- **After a save** the edit page calls `DbService.reload()`, so the public pages show the change at once.

### Edit server security

The edit server can change files, so it only accepts requests from this computer:

| Protection                                                              | Stops                                                         |
| ----------------------------------------------------------------------- | ------------------------------------------------------------- |
| Listens on `127.0.0.1` only                                             | Other computers on the network                                |
| `Host` header must be `localhost` / `127.0.0.1` / `[::1]`               | DNS rebinding (a website pretending to be localhost)          |
| `X-MGR-Edit` header required on `/api`                                  | Other websites open in the browser (they cannot add a header) |
| Upload names are slugified, paths checked to stay inside `public/`      | Writing files elsewhere on the disk                           |
| SVG uploads refused (SVG files can contain scripts)                     | Scripts hidden in uploaded images                             |
| All SQL uses `?` parameters                                             | SQL injection                                                 |

## Source layout

| Folder                     | Contents                                                                           |
| -------------------------- | ---------------------------------------------------------------------------------- |
| `src/app/core/`            | Site settings (`site.config.ts`) and tab titles (`page-title.ts`)                  |
| `src/app/data/`            | Database access: `DbService` (sql.js), `SiteDataService` (queries), `models.ts`    |
| `src/app/pages/`           | Public pages, one folder each: home, news, news-item, reviews, review              |
| `src/app/shared/`          | Reusable parts, one folder each: review card, news card, stars, pager, gallery... |
| `src/app/admin/`           | Edit pages (overview, review-edit, news-edit) and the edit server client           |
| `src/app/app.*`            | Page template (header, menu), routes and providers                                 |
| `src/styles.css`           | Global styles and colour variables                                                 |
| `scripts/`                 | Command-line tools (`npm run edit`, `db:*`)                                        |
| `scripts/lib/`             | Code shared by the tools: config, database, migrations, dump, edit server and API |
| `scripts/test/`            | Tests for `scripts/lib` (Node's built-in test runner)                              |
| `db/`                      | Schema, migrations, sample data and the readable copy `data.sql`                   |
| `config/shared.json`       | Settings used by both the Angular app and the scripts                              |
| `public/`                  | Copied to the site as-is: database, logos, screenshots, favicon, `.htaccess`       |
| `docs/`                    | This documentation                                                                 |

## Main pieces of code

| File                                        | Role                                                                     |
| ------------------------------------------- | ------------------------------------------------------------------------ |
| `src/app/app.routes.ts`                     | Address to page mapping; admin routes guarded by dev mode                |
| `src/app/data/site-data.service.ts`         | Every query the public pages run (search, sort, paging)                  |
| `src/app/admin/edit-api.service.ts`         | Browser side of the edit API                                             |
| `scripts/lib/edit-api.mjs`                  | Server side of the edit API: route table, validation, database writes    |
| `scripts/lib/validation.mjs`                | Checks on review and news data; messages shown to the user               |
| `scripts/lib/migrations.mjs`                | Applies `db/migrations/*.sql` using `PRAGMA user_version`                |
| `scripts/lib/dump.mjs`                      | Writes `db/data.sql`                                                     |

## Page data flow

Pages that depend on the address (news page number, review slug, search text) receive route and query parameters as
signal inputs (`withComponentInputBinding()` in `app.config.ts`). An `effect()` in the constructor reads those
inputs and calls a `load()` method, so the page reloads whenever the address changes. All components use `OnPush`
change detection and signals for state.
