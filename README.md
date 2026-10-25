# MgrApp

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 18.2.12.

## Updating the website

Summary of the steps in `MathiasGamingReviews.pdf` (made from `MathiasGamingReviews.docx`). Account names and passwords are only in those files, which must stay out of git (both are listed in `.gitignore`).

Run all commands in `cmd.exe` (press Windows+R, type `cmd`, press Enter). Do not use PowerShell, because the FTP password contains characters PowerShell treats specially.

### Make a change

```
cd \Development\mgr-app\mathiasgamingreviews.github.io
git switch master
git pull
ng serve --open
```

Open the folder in Visual Studio Code and edit the files (for example `src\app\app.component.html`). The browser updates each time you save. When finished, press Ctrl+C in the command window to stop Angular.

### Publish the change

```
git status
git commit -a -m "Describe what you changed"
git push -u origin master
ng deploy --name="MathiasGamingReviews" --base-href=/
```

The first `git push` on a computer opens a browser window: sign in to GitHub as MathiasGamingReviews.

Check https://mathiasgamingreviews.github.io (it can take a minute or two to update).

### Copy the change to www.mathiasgamingreviews.com

Replace `FTP-PASSWORD` with the FTP password from the PDF. The `ncftpget -DD` line **deletes** the old files from the live server (keeping a copy in `temp`), so only run it right before the upload.

```
md temp
ncftpget -C -DD -u upload@mathiasgamingreviews.com -p FTP-PASSWORD ftp.mathiasgamingreviews.com \ .\temp
ncftpput -u upload@mathiasgamingreviews.com -p FTP-PASSWORD ftp.mathiasgamingreviews.com \ .\dist\mgr-app\browser\*.*
rmdir /S /Q temp
```

Check https://www.mathiasgamingreviews.com.

### Fixes compared to the PDF

- `ng serve –open` → `ng serve --open` (two hyphens, not a dash)
- `git push origin –u master` → `git push -u origin master`
- `--base-href=\` → `--base-href=/`

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
