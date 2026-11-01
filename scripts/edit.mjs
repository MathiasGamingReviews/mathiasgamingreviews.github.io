/**
 * @file npm run edit - starts the edit server, then `ng serve` with the proxy, then opens /admin.
 * Ctrl+C stops both.
 *
 * Usage:
 *   npm run edit                 opens the browser
 *   npm run edit -- --no-open    does not open the browser
 */

import { spawn } from 'node:child_process';
import { PATHS, ROOT } from './lib/config.mjs';
import { runCommand } from './lib/cli.mjs';
import { startEditServer } from './lib/edit-server.mjs';

const NO_OPEN_FLAG = '--no-open';
const ADMIN_PATH = 'admin';
/** ng serve prints "Local: http://localhost:<port>/" once the site is ready. */
const READY_LINE = /Local:\s+(http:\/\/localhost:\d+\/)/;
// eslint-disable-next-line no-control-regex -- ANSI colour codes start with the ESC control character.
const ANSI_COLOURS = /\x1b\[[0-9;]*m/g;

/**
 * --live-reload=false: saving writes files under public/, which would otherwise reload the
 * browser and discard a half-filled form.
 */
const NG_SERVE_ARGS = ['serve', '--live-reload=false', '--proxy-config', PATHS.proxyConfig];

await runCommand(async () => {
  const server = await startEditServer();
  const ng = spawn(process.execPath, [PATHS.angularCli, ...NG_SERVE_ARGS], {
    cwd: ROOT,
    stdio: ['inherit', 'pipe', 'inherit'],
  });

  let ready = false;
  ng.stdout.on('data', (chunk) => {
    process.stdout.write(chunk);
    const local = chunk.toString().replace(ANSI_COLOURS, '').match(READY_LINE);
    if (local && !ready) {
      ready = true;
      const url = `${local[1]}${ADMIN_PATH}`;
      console.log(`\nEdit pages: ${url}\nPress Ctrl+C to stop.\n`);
      if (!process.argv.includes(NO_OPEN_FLAG)) {
        openBrowser(url);
      }
    }
  });

  const stop = (code = 0) => {
    ng.kill();
    server.close();
    process.exit(code);
  };
  process.on('SIGINT', () => stop());
  process.on('SIGTERM', () => stop());
  ng.on('exit', (code) => stop(code ?? 0));
});

/**
 * Opens `url` in the default browser.
 * @param {string} url
 */
function openBrowser(url) {
  const [command, args] =
    process.platform === 'win32'
      ? ['cmd', ['/c', 'start', '', url]]
      : [process.platform === 'darwin' ? 'open' : 'xdg-open', [url]];
  spawn(command, args, { stdio: 'ignore', detached: true }).unref();
}
