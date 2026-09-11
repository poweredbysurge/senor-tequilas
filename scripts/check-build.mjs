#!/usr/bin/env node
/**
 * Phase 3 step 6: the built site must load with zero console errors and zero 404s, and
 * every internal link must resolve to a route that exists.
 */

import { chromium } from 'playwright';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');

const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.ico': 'image/x-icon' };

/** Serve dist/ the way a static host would, so directory routes resolve to index.html. */
function serveDist() {
  return new Promise((resolve) => {
    const server = createServer(async (req, res) => {
      let rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      const candidates = [rel, path.join(rel, 'index.html')];
      for (const c of candidates) {
        const file = path.join(DIST, c);
        if (!file.startsWith(DIST)) continue;
        try {
          const buf = await readFile(file);
          res.setHeader('Content-Type', TYPES[path.extname(file)] ?? 'application/octet-stream');
          return res.end(buf);
        } catch { /* next candidate */ }
      }
      res.statusCode = 404;
      res.end('not found');
    });
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
  });
}

async function main() {
  const manifest = JSON.parse(await readFile(path.join(ROOT, 'design', 'pages', 'manifest.json'), 'utf8'));
  const { server, port } = await serveDist();
  const base = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch({ headless: true, args: ['--hide-scrollbars'] });

  const consoleErrors = [];
  const failures = [];
  const internal = new Set();

  for (const p of manifest.pages) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(`${p.path}: ${m.text().slice(0, 160)}`); });
    page.on('pageerror', (e) => consoleErrors.push(`${p.path}: ${String(e).slice(0, 160)}`));
    page.on('response', (r) => {
      const u = new URL(r.url());
      // Only our own origin. Toast, Instagram and Google are the design's links, not ours.
      if (u.origin === base && r.status() >= 400) failures.push(`${p.path}: HTTP ${r.status()} ${u.pathname}`);
    });
    page.on('requestfailed', (r) => {
      const u = new URL(r.url());
      if (u.origin === base) failures.push(`${p.path}: ${r.failure()?.errorText} ${u.pathname}`);
    });

    await page.goto(`${base}${p.path}`, { waitUntil: 'load', timeout: 120000 });
    await page.evaluate(async () => {
      for (const img of document.querySelectorAll('img[loading="lazy"]')) img.loading = 'eager';
      await Promise.all([...document.images].map((i) => i.complete ? null : new Promise((r) => { i.onload = i.onerror = r; })));
      await document.fonts.ready;
      return true;
    });
    await page.waitForTimeout(300);

    for (const href of await page.evaluate(() => [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')))) {
      if (href.startsWith('/') && !href.startsWith('//')) internal.add(href.split('#')[0] || '/');
    }
    await page.close();
  }

  // every internal destination must resolve
  const dead = [];
  const checker = await browser.newPage();
  for (const href of [...internal].sort()) {
    const res = await checker.goto(`${base}${href}`, { waitUntil: 'commit' }).catch(() => null);
    if (!res || res.status() >= 400) dead.push(`${href} -> ${res ? res.status() : 'no response'}`);
  }
  await checker.close();

  console.log(`Pages checked: ${manifest.pages.length}`);
  console.log(`Distinct internal destinations: ${internal.size}`);
  console.log(`\nconsole errors: ${consoleErrors.length}`);
  for (const e of consoleErrors.slice(0, 10)) console.log(`  ${e}`);
  console.log(`same-origin request failures (404s and the like): ${failures.length}`);
  for (const f of [...new Set(failures)].slice(0, 10)) console.log(`  ${f}`);
  console.log(`internal links that do not resolve: ${dead.length}`);
  for (const d of dead.slice(0, 15)) console.log(`  ${d}`);

  const ok = consoleErrors.length === 0 && failures.length === 0 && dead.length === 0;
  console.log(`\n${ok ? 'PASS: zero console errors, zero 404s, every internal link resolves.' : 'FAIL'}`);
  await browser.close();
  server.close();
  process.exitCode = ok ? 0 : 1;
}

main().catch((e) => { console.error(e); process.exit(1); });
