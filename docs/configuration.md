# Configuration

Values that are used in more than one place, or that you may want to change, live in configuration files instead
of being written into the code.

## `config/shared.json`

Read by both the Angular app (`src/app/core/site.config.ts`) and the scripts (`scripts/lib/config.mjs`).

| Key                  | Meaning                                                                                  |
| -------------------- | ---------------------------------------------------------------------------------------- |
| `databaseFile`       | Database path relative to `public/` and to the site root                                 |
| `defaultLogo`        | Image used for a game that has no logo yet                                               |
| `stars.min/max`      | Star rating range. Must match `CHECK (stars BETWEEN 1 AND 5)` in `db/schema.sql`          |
| `editApi.path`       | URL prefix of the edit API. Must match the `/api` key in `proxy.conf.json`                |
| `editApi.header`     | Header the edit pages send with every API request, and its required `headerValue`        |
| `uploadExtensions`   | Image types accepted for uploads (file picker filter and server check)                   |

## `src/app/core/site.config.ts`

Settings used only by the Angular app: site name, site logo, date formats, how many items each page shows,
default star rating for a new review. Change a number here, not in the page code.

## `scripts/lib/config.mjs`

Settings used only by the scripts: file and folder paths, upload size limit, upload folders, allowed host names,
headers for static files. The edit server port is not set here: it is read from `proxy.conf.json`.

## Tool configuration

| File                                     | Controls                                                                         |
| ---------------------------------------- | -------------------------------------------------------------------------------- |
| `proxy.conf.json`                        | Which addresses `ng serve` forwards to the edit server, and its port (4201)      |
| `angular.json`                           | Build, serve, test, lint and deploy settings; copies `public/` and the sql.js `.wasm` file into the build |
| `tsconfig.json`, `tsconfig.*.json`       | TypeScript compiler settings (strict mode)                                       |
| `eslint.config.js`                       | Lint rules (`npm run lint`)                                                      |
| `.prettierrc.json`, `.prettierignore`    | Code formatting (`npm run format`)                                               |
| `.editorconfig`                          | Indentation and line endings for any editor                                      |
| `.gitattributes`                         | Line endings in git; `*.sql` always LF                                           |
| `.gitignore`                             | Files git ignores, including the PDF/Word files with passwords                   |
| `.vscode/`                               | Recommended extensions, format on save, debug and task setup                     |
| `public/.htaccess`                       | HostPapa (Apache): send unknown addresses to `index.html`; `.wasm` content type   |
| `package.json`                           | Dependencies, `npm run` commands and the required Node.js version                |
