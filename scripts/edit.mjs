// "npm run edit": starts the edit server and the website together, then opens the edit pages.
// Press Ctrl+C to stop both. Add "-- --no-open" to skip opening the browser.

import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { startEditServer } from './edit-server.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const EDIT_SERVER_PORT = 4201;

const server = startEditServer({ root, port: EDIT_SERVER_PORT });

// --live-reload=false: saving a review changes files in public/, which would otherwise
// reload the browser and throw away a half-finished form.
const ng = spawn(
  process.execPath,
  [join(root, 'node_modules', '@angular', 'cli', 'bin', 'ng.js'), 'serve', '--live-reload=false', '--proxy-config', 'proxy.conf.json'],
  { cwd: root, stdio: ['inherit', 'pipe', 'inherit'] },
);

let opened = false;
ng.stdout.on('data', (chunk) => {
  process.stdout.write(chunk);
  // Remove the colour codes ng serve puts in its output before looking for the address.
  const text = chunk.toString().replace(/\x1b\[[0-9;]*m/g, '');
  const local = text.match(/Local:\s+(http:\/\/localhost:\d+\/)/);
  if (local && !opened) {
    opened = true;
    const url = `${local[1]}admin`;
    console.log(`\nEdit pages: ${url}\nPress Ctrl+C to stop.\n`);
    if (process.argv.includes('--no-open')) {
      return;
    }
    const opener = process.platform === 'win32' ? ['cmd', ['/c', 'start', '', url]] : [process.platform === 'darwin' ? 'open' : 'xdg-open', [url]];
    spawn(opener[0], opener[1], { stdio: 'ignore', detached: true }).unref();
  }
});

const stop = () => {
  ng.kill();
  server.close();
  process.exit(0);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
ng.on('exit', (code) => {
  server.close();
  process.exit(code ?? 0);
});
