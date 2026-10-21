#!/usr/bin/env node
// Keeps host-specific files out of the static export.
//
// apps/web/public/mail-relay.php is a PHP endpoint that has to run on the
// qservers.net/cPanel host (Apache + PHP). Every other host (Vercel) serves
// the export as plain files, so a deployed copy is never executed — it is
// handed back to any visitor as source text, exposing the relay config.
//
// Default (every Vercel build): drop out/mail-relay.php.
// CPANEL_DEPLOY=1 (npm run build:cpanel): keep it for the cPanel upload.
//
// .DS_Store is dropped in both cases — it is macOS noise, never web content.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(dir, '..', 'out');
const RELAY = path.join(OUT, 'mail-relay.php');
const forCpanel = process.env.CPANEL_DEPLOY === '1';

if (forCpanel) {
  console.log('[relay-guard] CPANEL_DEPLOY=1 — keeping out/mail-relay.php for the cPanel upload.');
} else if (fs.existsSync(RELAY)) {
  fs.rmSync(RELAY);
  console.log('[relay-guard] removed out/mail-relay.php (PHP is not executed on this host).');
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
