#!/usr/bin/env node
// Copies the cPanel-only assets into the static export.
//
// apps/web/cpanel/mail-relay.php is a PHP endpoint that has to run on the
// qservers.net/cPanel host (Apache + PHP), and apps/web/cpanel/.htaccess
// holds the Apache rewrite rules. Neither lives in apps/web/public/:
// Vercel collects public/ into its static output, so a PHP file there is
// served as plain text and exposes its source to the public.
//
// CPANEL_DEPLOY=1 (npm run build:cpanel): both files land in out/.
// Default (every Vercel build): only .htaccess is copied, the PHP is not.
//
// .DS_Store is dropped in both cases — macOS noise, never web content.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(dir, '..');
const OUT = path.join(ROOT, 'out');
const CPANEL = path.join(ROOT, 'cpanel');
const forCpanel = process.env.CPANEL_DEPLOY === '1';

const copy = (name) => {
  const src = path.join(CPANEL, name);
  if (!fs.existsSync(src)) {
    console.warn(`[relay-guard] missing cpanel/${name}`);
    return;
  }
  fs.copyFileSync(src, path.join(OUT, name));
  console.log(`[relay-guard] copied cpanel/${name} -> out/${name}`);
};

// .htaccess: Apache needs it in the web root on every cPanel build.
copy('.htaccess');

// mail-relay.php: only the cPanel host executes PHP. Keep it out of every
// other build so it is never readable as source.
if (forCpanel) {
  copy('mail-relay.php');
} else {
  const relay = path.join(OUT, 'mail-relay.php');
  if (fs.existsSync(relay)) {
    fs.rmSync(relay);
    console.log('[relay-guard] removed out/mail-relay.php (PHP is not executed on this host).');
  }
}

let removed = 0;
const walk = (dirPath) => {
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const full = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (entry.name === '.DS_Store') {
      fs.rmSync(full);
      removed += 1;
    }
  }
};
if (fs.existsSync(OUT)) {
  walk(OUT);
  if (removed) console.log(`[relay-guard] removed ${removed} .DS_Store file(s).`);
}
