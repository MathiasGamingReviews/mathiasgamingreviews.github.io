# Mathias Gaming Reviews

The source code of [www.mathiasgamingreviews.com](https://www.mathiasgamingreviews.com): computer game reviews and news.

The site is an [Angular](https://angular.dev) app. All reviews and news are stored in one SQLite database file,
`public/data/mgr.db`, which the site reads directly in the visitor's browser. There is no server program: the
website is a set of files copied to two places:

| Where | Address | How it gets there |
|---|---|---|
| GitHub Pages (test copy) | https://mathiasgamingreviews.github.io | `ng deploy` |
| HostPapa (the real site) | https://www.mathiasgamingreviews.com | FTP upload with `ncftpput` |

Account names and passwords are **not** in this repository. They are in `MathiasGamingReviews.pdf` /
`MathiasGamingReviews.docx`, which are kept out of git (see `.gitignore`). Never add them to git.

All commands below are typed in a **command prompt** (press Windows key + R, type `cmd`, press Enter).
Do not use PowerShell or Git Bash: they change some of the characters in the commands.

## First time on a new computer

Install the software listed in the PDF (Git, Node.js, Angular CLI, Visual Studio Code, NcFTP), then:

```
mkdir c:\Development\mgr-app
cd c:\Development\mgr-app
git clone https://github.com/MathiasGamingReviews/mathiasgamingreviews.github.io.git
cd mathiasgamingreviews.github.io
git switch master
npm install
```

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

   - **New review** / **Edit**: game name, logo, platform, stars, date, web address and the review text
     (leave an empty line between paragraphs). Choose a game or platform that already exists from the list, or
     type a new name to add one. A game's logo is shared by all reviews of that game.
   - **Screenshots**: choose one or more image files, then give each one a name and a description. Use ↑ ↓ to
     change the order and ✕ to remove one.
   - **Links**: the web address (must start with `http://` or `https://`) and a description.
   - **News**: title, date and text. The first two lines show on the news cards.

   Everything is saved on your computer as soon as you press **Save**. Use the Home / News / Reviews menu to
   see how it looks.

4. Press **Ctrl+C** in the command prompt to stop.

5. Save the changes in git (this keeps every version, so nothing is ever lost):

   ```
   git status
   git add -A
   git commit -m "Describe what you changed, e.g. Added review of Celeste"
   git push -u origin master
   ```

   Use `git add -A` (not `git commit -a` on its own) so that new logo and screenshot images are included.

Then put the changes on the internet: see [Deploying the website](#deploying-the-website).

### What gets saved where

| What | File |
|---|---|
| Reviews, news, screenshots and links | `public/data/mgr.db` |
| Readable copy of the database (for git) | `db/data.sql`, rewritten after every save |
| Game logos | `public/logos/` |
| Screenshots | `public/screenshots/<review web address>/` |

`db/data.sql` is there so that git can show exactly what changed: run `git log -p db/data.sql` to see every
change ever made to reviews and news.

### Getting an older version back

Every commit is a saved version. To go back to how the reviews and news were in an earlier commit:

```
git log --oneline -- db/data.sql
git checkout <commit> -- db/data.sql
npm run db:restore -- --force
```

The first command lists the versions; replace `<commit>` with the code at the start of the line you want.
`db:restore` rebuilds `public/data/mgr.db` from `db/data.sql`. Images that were deleted can be brought back the
same way: `git checkout <commit> -- public/screenshots`.

## Changing the website itself

To change how the site looks or works (not the reviews and news), edit the code in `src/` with Visual Studio Code
while the site runs:

```
ng serve --open
```

The browser updates every time you save a file. Press Ctrl+C to stop. Then save in git and deploy as below.

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

   `-R` is needed so that the `data`, `logos` and `screenshots` folders are uploaded too.

4. **Check it** at https://www.mathiasgamingreviews.com. If you still see the old version, press Ctrl+F5.

Old program files (`main-XXXXXXXX.js`) from earlier versions stay on the HostPapa server. They are not used and
do no harm.

## Changing the database layout

Only needed when a new kind of information is added (for example a new field on reviews). Never edit
`db/schema.sql` for this. Instead:

1. Add a new file in `db/migrations/` with the next number, e.g. `003-add-review-summary.sql`, containing the SQL
   changes (`ALTER TABLE ...`, `CREATE TABLE ...`).
2. Run `npm run db:migrate`. It applies only the migrations the database has not had yet and keeps all data.
   (`npm run edit` also does this when it starts.)

## Commands

| Command | What it does |
|---|---|
| `npm run edit` | Start the site with the edit pages (http://localhost:4200/admin) |
| `ng serve --open` | Start the site without the edit pages |
| `npm run db:migrate` | Apply new files from `db/migrations/` to the database |
| `npm run db:dump` | Rewrite `db/data.sql` from the database |
| `npm run db:restore -- --force` | Rebuild the database from `db/data.sql` |
| `npm run db:create -- --force` | Start again with the sample data from `db/sample-data.sql` (**deletes all reviews and news**) |
| `ng test` | Run the unit tests |

## Project layout

| Folder | Contents |
|---|---|
| `src/app/pages/` | The pages of the website (home, news, reviews, review) |
| `src/app/shared/` | Parts used on several pages (review card, news card, stars, page numbers, screenshot gallery) |
| `src/app/admin/` | The edit pages (only on your own computer) |
| `src/app/data/` | Reading the database in the browser |
| `scripts/` | The edit server and the database commands |
| `db/` | Database layout, migrations, sample data and the readable copy `data.sql` |
| `public/` | Files copied to the website as they are: database, logos, screenshots |
