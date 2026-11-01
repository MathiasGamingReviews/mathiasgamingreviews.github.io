# Mathias Gaming Reviews

Source code of [www.mathiasgamingreviews.com](https://www.mathiasgamingreviews.com): computer game reviews and news.

- [How the site works](docs/architecture.md)
- [Developer guide](docs/development.md): setup, coding rules, tests, adding pages
- [Database](docs/database.md): tables, migrations, backups in git
- [Configuration](docs/configuration.md): every settings file and what it controls

## In short

The site is an [Angular](https://angular.dev) 22 app with no server program. All reviews and news are in one SQLite
file, `public/data/mgr.db`, which the visitor's browser downloads and reads with [sql.js](https://sql.js.org).
Deploying means copying the built files to two places:

| Where                    | Address                                | How it gets there          |
| ------------------------ | -------------------------------------- | -------------------------- |
| GitHub Pages (test copy) | https://mathiasgamingreviews.github.io | `ng deploy`                |
| HostPapa (the real site) | https://www.mathiasgamingreviews.com   | FTP upload with `ncftpput` |

Reviews and news are edited on your own computer with `npm run edit`, which adds edit pages and a small local
server that writes to the database. Every change is also written to `db/data.sql`, a readable text copy of the
database, so git shows exactly what changed and nothing is ever lost.

Account names and passwords are **not** in this repository. They are in `MathiasGamingReviews.pdf` /
`MathiasGamingReviews.docx`, which `.gitignore` keeps out of git. Never add them to git.

All commands below are typed in a **command prompt** (Windows key + R, type `cmd`, Enter). Do not use PowerShell
or Git Bash for the deploy commands: they change some of the characters in them.

## First time on a new computer

Install [Git](https://git-scm.com), [Node.js](https://nodejs.org) 24 LTS (24.15 or newer),
[Visual Studio Code](https://code.visualstudio.com) and [NcFTP](https://www.ncftp.com/download/), then:

```
npm install -g @angular/cli@22
mkdir c:\Development\mgr-app
cd c:\Development\mgr-app
git clone https://github.com/MathiasGamingReviews/mathiasgamingreviews.github.io.git
cd mathiasgamingreviews.github.io
git switch master
npm install
```

Open the folder in Visual Studio Code and install the recommended extensions when it asks.

## Editing reviews and news

1. Get the latest version:

   ```
   cd c:\Development\mgr-app\mathiasgamingreviews.github.io
   git switch master
   git pull
   npm install
   ```

2. Start the edit pages:

   ```
   npm run edit
   ```

   The browser opens at http://localhost:4200/admin. The menu bar has an extra **✎ Edit** item; it only exists on
   your own computer, never on the live site.

3. Make your changes:
   - **New review** / **Edit**: game name, logo, platform, stars, date, web address and the review text (leave an
     empty line between paragraphs). Choose a game that already exists from the list, or type a new name to add
     one. A game's logo is shared by all reviews of that game. The platform is chosen from a fixed list (see
     [Adding a platform](docs/database.md#adding-a-platform)).
   - **Screenshots**: choose one or more PNG, JPG, GIF or WEBP files (up to 10 MB each), then give each a name and
     a description. ↑ ↓ change the order, ✕ removes one.
   - **Links**: the web address (must start with `http://` or `https://`) and a description.
   - **News**: title, date and text. The first two lines show on the news cards.

   Everything is saved on your computer as soon as you press **Save**. Use the Home / News / Reviews menu to see
   how it looks.

4. Press **Ctrl+C** in the command prompt to stop.

5. Save the changes in git:

   ```
   git status
   git add -A
   git commit -m "Describe what you changed, e.g. Added review of Celeste"
   git push -u origin master
   ```

   Use `git add -A` (not `git commit -a` on its own) so that new logo and screenshot images are included.

Then put the changes on the internet: see [Deploying the website](#deploying-the-website).

### What gets saved where

| What                                    | File                                       |
| --------------------------------------- | ------------------------------------------ |
| Reviews, news, screenshots and links    | `public/data/mgr.db`                       |
| Readable copy of the database (for git) | `db/data.sql`, rewritten after every save  |
| Game logos                              | `public/logos/`                            |
| Screenshots                             | `public/screenshots/<review web address>/` |

`git log -p db/data.sql` shows every change ever made to reviews and news.

### Getting an older version back

```
git log --oneline -- db/data.sql
git checkout <commit> -- db/data.sql
npm run db:restore -- --force
```

The first command lists the versions; replace `<commit>` with the code at the start of the line you want.
`db:restore` rebuilds `public/data/mgr.db` from `db/data.sql` (the old database is only replaced if the rebuild
succeeds). Deleted images come back the same way: `git checkout <commit> -- public/screenshots`.

## Changing the website itself

See the [developer guide](docs/development.md). In short: `npm run edit` (or `ng serve` without the edit pages),
change the code in `src/`, then run `npm run check` before committing.

## Deploying the website

Do this after the changes are saved in git (`git push`).

1. **Build the site and publish it to GitHub Pages:**

   ```
   ng deploy --name="MathiasGamingReviews" --base-href=/
   ```

   The first time on a computer a browser window opens: sign in to the website's GitHub account (see the PDF).

2. **Check it** at https://mathiasgamingreviews.github.io. It can take a minute or two to update.

3. **Copy it to the real website.** Replace `FTP-USER` and `FTP-PASSWORD` with the FTP login from the PDF:

   ```
   ncftpput -R -u FTP-USER -p FTP-PASSWORD ftp.mathiasgamingreviews.com \ .\dist\mgr-app\browser\*.*
   ```

   `-R` uploads the `data`, `logos` and `screenshots` folders too.

4. **Check it** at https://www.mathiasgamingreviews.com. If you still see the old version, press Ctrl+F5.

Old program files (`main-XXXXXXXX.js`) from earlier versions stay on the HostPapa server. They are not used and do
no harm.

## Commands

| Command                         | What it does                                                                                  |
| ------------------------------- | --------------------------------------------------------------------------------------------- |
| `npm run edit`                  | Site with the edit pages at http://localhost:4200/admin                                       |
| `ng serve --open`               | Site without the edit pages                                                                   |
| `npm run check`                 | Lint, formatting check, all tests and a production build: run before every commit             |
| `npm test`                      | All tests once (Angular and scripts)                                                          |
| `npm run test:watch`            | Angular tests, re-run on every save                                                           |
| `npm run lint`                  | Check the code for mistakes and rule breaks                                                   |
| `npm run format`                | Format all code with Prettier                                                                 |
| `npm run db:migrate`            | Apply new files from `db/migrations/` to the database                                         |
| `npm run db:dump`               | Rewrite `db/data.sql` from the database                                                       |
| `npm run db:restore -- --force` | Rebuild the database from `db/data.sql`                                                       |
| `npm run db:create -- --force`  | Start again with the sample data from `db/sample-data.sql` (**deletes all reviews and news**) |
