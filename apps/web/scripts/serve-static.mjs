#!/usr/bin/env node
// Local static preview for the `output: 'export'` build.
// Reproduces apps/web/public/.htaccess behaviour so what you see locally
// matches qservers.net (Apache): /face-enroll/<any id> -> placeholder page,
// and trailing-slash redirects for generated routes.
// Usage: node scripts/serve-static.mjs  (or npm run serve:static)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(dir, '..', 'out');
const PORT = Number(process.env.PORT || 3000);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain',
  '.pdf': 'application/pdf',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp',
  '.wasm': 'application/wasm',
  '.woff': 'font/woff', '.woff2': 'font/woff2',
};

http.createServer((req, res) => {
  let u = decodeURIComponent((req.url || '/').split('?')[0]);

  // 1) .htaccess: /face-enroll/<any id> -> static placeholder page
  if (/^\/face-enroll\/[^/]+\/?$/.test(u)) u = '/face-enroll/placeholder/';

  // 2) .htaccess: redirect generated routes to their trailing-slash form
  const file = path.join(ROOT, u.replace(/^\/+/, ''));
  const isDir = fs.existsSync(file) && fs.statSync(file).isDirectory();
  if (!u.endsWith('/') && u !== '/' && (!fs.existsSync(file) || isDir) && !u.startsWith('/_next/')) {
    res.writeHead(301, { Location: u + '/' });
    return res.end();
  }

  // 3) serve out/<route>/index.html
  const target = isDir ? path.join(file, 'index.html') : file;
  fs.readFile(target, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('404 not found');
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(target)] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(PORT, () => {
  console.log(`Serving ${ROOT}`);
  console.log(`Open: http://localhost:${PORT}/  e.g. http://localhost:${PORT}/face-enroll/<employee-id>/`);
});