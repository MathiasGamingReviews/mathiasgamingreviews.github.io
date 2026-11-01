# Developer guide

## Requirements

- Node.js 24 LTS, 24.15 or newer (`node -v`); 22.22+ also works. The scripts use the built-in `node:sqlite`
  module.
- Angular CLI 22 (`npm install -g @angular/cli@22`).
- Visual Studio Code with the recommended extensions (Angular Language Service, ESLint, Prettier, EditorConfig).
  With them, files are formatted on save and lint problems are underlined while you type.

## Daily workflow

```
git pull
npm install
npm run edit            site + edit pages at http://localhost:4200 (or: ng serve --open for the site only)
... change code ...
npm run check           lint + formatting + all tests + production build
git add -A
git commit -m "What changed and why"
git push
```

`npm run check` must pass before every commit. If only formatting fails, run `npm run format`.

## Tests

| Command                 | Runs                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------- |
| `npm test`              | Everything once                                                                       |
| `npm run test:app`      | Angular tests (`src/**/*.spec.ts`, Vitest with jsdom)                  |
| `npm run test:watch`    | Angular tests, re-run on every save                               |
| `npm run test:scripts`  | Script tests (`scripts/test/*.test.mjs`, Node's built-in `node:test`)                 |

Put a test next to the code: `foo.ts` → `foo.spec.ts`; `scripts/lib/foo.mjs` → `scripts/test/foo.test.mjs`. The
script tests use an in-memory database (`scripts/test/helpers.mjs`), so they never touch the real one.

## Coding rules

The linter (`npm run lint`) enforces most of these; the rest are checked in review.

### Files

- Every `.ts`, `.mjs` and `.css` file starts with a header saying what the file is for:

  ```ts
  /**
   * @file News page: all news, newest first, paged. Route: /news?page=<n>
   */
  ```

  CSS: `/* Review card: square logo, name, platform, stars at the bottom. */`. SQL: `-- ...` lines.
- One component, page or pipe per folder: `shared/stars/stars.component.ts`, `pages/news/news.page.ts`.
- Names: reusable components end in `Component` (`*.component.ts`), routed pages in `Page` (`*.page.ts`),
  services in `Service`. Selectors start with `app-`.

### Comments

- Every exported function, class, method and non-obvious property has a `/** ... */` doc comment: what it returns,
  what parameters mean, what it throws. Skip the obvious (`readonly item = input.required<NewsItem>()`).
- Comments are short and technical: say **why**, or a fact the code cannot show (a unit, a format, a limit, a
  link to another file that must match). No history ("changed from ...", "used to ..."), no chatty wording.

  ```ts
  // Good: Creation order (rowid) keeps referenced tables before the tables that reference them.
  // Bad:  Now we loop over all the tables so we can write them out nicely!
  ```

### No magic numbers or strings

- Numbers other than -1, 0, 1, 2 must be named constants (lint rule `no-magic-numbers`).
- Settings go in the config files (see [configuration](configuration.md)): `site.config.ts` for the app,
  `scripts/lib/config.mjs` for the scripts, `config/shared.json` for values both use.
- Constants used in one file only are declared in UPPER_CASE at the top of that file.
- Colours are CSS variables in `src/styles.css` (`var(--accent)`), never hex values in component styles.

### Angular

- Standalone components, `inject()` instead of constructor parameters, `ChangeDetectionStrategy.OnPush`
  (lint rule), signals (`signal`, `computed`, `input`) for state.
- Built-in control flow in templates (`@if`, `@for`, `@switch`), not `*ngIf` / `*ngFor`.
- Pages get route and query parameters as inputs and reload in an `effect()` (see [architecture](architecture.md)).
- All database reads go through `SiteDataService`; components never write SQL.
- SQL values are always `?` parameters, never inserted into the SQL text.

### Scripts

- ES modules (`.mjs`), Node built-ins only, JSDoc types on exported functions.
- Command-line entry points in `scripts/`, shared code in `scripts/lib/`.
- Errors meant for the user are thrown as `HttpError` (edit server) or `Error` with a clear message (commands).

## How to...

### Add a page

1. Create `src/app/pages/<name>/<name>.page.ts` and `.html` (copy `news/` as a starting point).
2. Add the route in `src/app/app.routes.ts` with a `title`.
3. Add a menu link in `src/app/app.component.html` if needed.
4. Add queries to `SiteDataService` and types to `models.ts`.

### Add a reusable component

Create `src/app/shared/<name>/<name>.component.ts` (`ng generate component shared/<name>` creates the files;
then add the header, `OnPush`, and remove what you don't need).

### Change the layout of the database

See [database](database.md#versions-and-migrations).

### Change a setting

See [configuration](configuration.md).

## Troubleshooting

| Problem                                                    | Fix                                                                                     |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| "The edit pages are already running in another window"     | Use that window, or Ctrl+C there and start again                                        |
| Edit page says "The edit server is not running"            | Stop `ng serve` and use `npm run edit` instead                                          |
| `npm install` fails with EBUSY / "resource busy or locked" | Stop `npm run edit` / `ng serve` (they lock files in `node_modules`), then retry        |
| "database is locked" when saving                           | Close DB Browser for SQLite (or any program that has `mgr.db` open)                     |
| Live site still shows the old version                      | Ctrl+F5; check the deploy steps both ran                                                |
| Blank page after deploy                                    | `--base-href=/` was changed by the shell: run the deploy command in cmd, not Git Bash   |
