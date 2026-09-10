#!/usr/bin/env node
/**
 * Gate A: extraction fidelity.
 *
 * Screenshots each of the 20 desktop artboards inside the original bundle at a 1440
 * viewport, screenshots the corresponding extracted page at the same viewport, and
 * compares them. Tolerance: 0.5% of pixels differing, after forgiving anti-aliasing
 * within a 2px radius.
 *
 * Both sides render in the same browser at the same viewport with scrollbars hidden, so
 * `vw`/`vh` units and the viewport media queries resolve identically. Without that, the
 * bundle's horizontal scrollbar alone would shift every `vh` value and fail the gate for
 * no real reason.
 *
 * Writes design/gate-a/{bundle,extracted,diff}/<slug>.png and prints the table.
 */

import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'design', 'gate-a');
const BUNDLE = 'design/export/master-board.standalone.html';

const VIEWPORT = { width: 1440, height: 900 };
const EXPECTED_HOSTS = 29;
const SETTLE_MS = 5000;
const TOLERANCE_PCT = 0.5;
const AA_RADIUS = 2;          // a differing pixel is forgiven if its match sits within 2px
const AA_COLOR_TOL = 32;      // per-channel closeness for that match
const KEEP_IMAGES = !process.argv.includes('--no-images');

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
};

function serve(dir) {
  return new Promise((resolve) => {
    const server = createServer(async (req, res) => {
      const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/+/, '');
      const file = path.join(dir, rel);
      if (!file.startsWith(dir)) { res.statusCode = 403; return res.end(); }
      try {
        const buf = await readFile(file);
        res.setHeader('Content-Type', CONTENT_TYPES[path.extname(file).toLowerCase()] ?? 'application/octet-stream');
        res.end(buf);
      } catch {
        res.statusCode = 404;
        res.end('not found');
      }
    });
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
  });
}

/**
 * Fonts resolved, lazy images forced, every image both loaded and decoded.
 * `complete` only means the bytes arrived. A beyond-viewport capture can still paint an
 * undecoded image as an empty box, which is exactly how the remote photos went missing.
 */
async function settle(page) {
  await page.evaluate(async () => {
    for (const img of document.querySelectorAll('img[loading="lazy"]')) img.loading = 'eager';
    await Promise.all(
      [...document.images].map(async (img) => {
        try {
          if (!img.complete) await new Promise((r) => { img.onload = img.onerror = r; });
          await img.decode();
        } catch { /* a broken image is the design's business, not the harness's */ }
      })
    );
    await document.fonts.ready;
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    return true;
  });
  await page.waitForTimeout(400);
}

/**
 * A sticky header resolves against whatever scroll container it finds. In the bundle that
 * is the board, so a stitched element capture lands the header at an arbitrary offset
 * inside the artboard; in a standalone page it lands at the top. Same markup, same CSS,
 * different capture geometry. Sticky already occupies its normal-flow box, so pinning it
 * to static puts it at that natural position on both sides and changes no other layout.
 * Applied identically to bundle and extract, so it can never mask a real difference.
 */
async function unstick(page) {
  return page.evaluate(() => {
    let n = 0;
    for (const el of document.querySelectorAll('*')) {
      if (getComputedStyle(el).position === 'sticky') {
        el.style.setProperty('position', 'static', 'important');
        n++;
      }
    }
    return n;
  });
}

/**
 * The home photo strip is a JS-driven marquee: the bundle's script scrolls `[data-autoscroll]`
 * continuously, so resetting its offset only holds until the next frame. Replacing the rail
 * with a clone detaches it from the running loop, which keeps scrolling the orphan instead.
 * `data-autoscroll` and `data-cloned` are dropped from the clone; `data-rail` is kept because
 * the stylesheet does select on it. The extracted page needs none of this: it has no script,
 * so its rail is inert already and sits where the clone sits, at offset 0.
 */
async function freezeRails(page) {
  const n = await page.evaluate(() => {
    let n = 0;
    for (const rail of document.querySelectorAll('[data-autoscroll]')) {
      const fresh = rail.cloneNode(true);
      fresh.removeAttribute('data-autoscroll');
      rail.replaceWith(fresh);
      fresh.scrollLeft = 0;
      n++;
    }
    return n;
  });
  if (n) await settle(page);   // the clone's images have to decode again
  return n;
}

/**
 * Nested overflow containers must start from the same scroll offset on both sides.
 * Bringing an artboard into view inside the board leaves the home photo strip at
 * scrollLeft 654 while a standalone page opens it at 0, which reads as a wholly different
 * set of tiles. Scroll position is not layout, so zeroing it changes nothing we measure.
 */
async function resetScroll(page) {
  return page.evaluate(() => {
    let n = 0;
    for (const el of document.querySelectorAll('*')) {
      if (el.scrollLeft !== 0 || el.scrollTop !== 0) { el.scrollLeft = 0; el.scrollTop = 0; n++; }
    }
    return n;
  });
}

/** Sticky header geometry relative to its artboard, measured before unstick(). */
const stickyBoxes = (scope) =>
  scope.evaluate((el) => {
    const host = el ?? document.querySelector('body > div.sc-host[data-sc-name]');
    const hb = host.getBoundingClientRect();
    return [...host.querySelectorAll('*')]
      .filter((n) => getComputedStyle(n).position === 'sticky')
      .map((n) => {
        const r = n.getBoundingClientRect();
        return `${n.tagName.toLowerCase()} ${Math.round(r.width)}x${Math.round(r.height)}`;
      });
  });

const pad = (png, w, h) => {
  if (png.width === w && png.height === h) return png;
  const out = new PNG({ width: w, height: h });
  out.data.fill(0);
  PNG.bitblt(png, out, 0, 0, Math.min(png.width, w), Math.min(png.height, h), 0, 0);
  return out;
};

/**
 * pixelmatch flags the raw differences; we then forgive any flagged pixel whose colour
 * exists within AA_RADIUS in the other image, which is what edge anti-aliasing and a
 * sub-pixel text shift look like. A moved block, a missing image or a wrong colour has no
 * such neighbour and survives.
 */
function compare(aPng, bPng) {
  const w = Math.max(aPng.width, bPng.width);
  const h = Math.max(aPng.height, bPng.height);
  const A = pad(aPng, w, h);
  const B = pad(bPng, w, h);
  const mask = new PNG({ width: w, height: h });
  const rawDiff = pixelmatch(A.data, B.data, mask.data, w, h, {
    threshold: 0.1,
    includeAA: false,
    diffMask: true,
  });

  const at = (data, x, y) => {
    const i = (y * w + x) << 2;
    return [data[i], data[i + 1], data[i + 2]];
  };
  const close = (p, q) =>
    Math.abs(p[0] - q[0]) <= AA_COLOR_TOL &&
    Math.abs(p[1] - q[1]) <= AA_COLOR_TOL &&
    Math.abs(p[2] - q[2]) <= AA_COLOR_TOL;

  let real = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) << 2;
      if (mask.data[i + 3] === 0) continue;           // not flagged
      const a = at(A.data, x, y);
      const b = at(B.data, x, y);
      let forgiven = false;
      for (let dy = -AA_RADIUS; dy <= AA_RADIUS && !forgiven; dy++) {
        for (let dx = -AA_RADIUS; dx <= AA_RADIUS && !forgiven; dx++) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          if (close(a, at(B.data, nx, ny)) && close(b, at(A.data, nx, ny))) forgiven = true;
        }
      }
      if (forgiven) {
        mask.data[i] = 0; mask.data[i + 1] = 200; mask.data[i + 2] = 255; mask.data[i + 3] = 90;
      } else {
        real++;
        mask.data[i] = 255; mask.data[i + 1] = 0; mask.data[i + 2] = 0; mask.data[i + 3] = 255;
      }
    }
  }
  return { w, h, rawDiff, real, pct: (real / (w * h)) * 100, mask };
}

async function main() {
  const { server, port } = await serve(ROOT);
  const base = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch({ headless: true, args: ['--hide-scrollbars'] });

  const manifest = JSON.parse(await readFile(path.join(ROOT, 'design', 'pages', 'manifest.json'), 'utf8'));

  await rm(OUT, { recursive: true, force: true });
  for (const d of ['bundle', 'extracted', 'diff']) await mkdir(path.join(OUT, d), { recursive: true });

  // ---- bundle side --------------------------------------------------------------------
  const bundlePage = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: 1 });
  console.log(`Loading the bundle at ${VIEWPORT.width}x${VIEWPORT.height} ...`);
  await bundlePage.goto(`${base}/${BUNDLE}`, { waitUntil: 'load', timeout: 300000 });
  await bundlePage.waitForFunction(
    (expected) => {
      const root = document.getElementById('dc-root');
      return !!root && root.querySelectorAll('div.sc-host[data-sc-name]').length === expected;
    },
    EXPECTED_HOSTS,
    { timeout: 300000, polling: 500 }
  );
  await bundlePage.waitForTimeout(SETTLE_MS);
  await settle(bundlePage);
  console.log('Bundle ready.\n');

  const bundleIndex = await bundlePage.evaluate(() => {
    const root = document.getElementById('dc-root');
    return [...root.querySelectorAll('div.sc-host[data-sc-name]')].map((el, index) => ({
      index,
      width: el.offsetWidth,
      height: el.offsetHeight,
      h1: el.querySelector('h1')?.textContent?.trim() ?? null,
      sticky: [...el.querySelectorAll('*')]
        .filter((n) => getComputedStyle(n).position === 'sticky')
        .map((n) => {
          const r = n.getBoundingClientRect();
          return `${n.tagName.toLowerCase()} ${Math.round(r.width)}x${Math.round(r.height)}`;
        }),
    }));
  });

  const bundleSticky = await unstick(bundlePage);
  const bundleRails = await freezeRails(bundlePage);
  await bundlePage.waitForTimeout(300);
  console.log(`Bundle prepared for capture: ${bundleSticky} sticky pinned, ${bundleRails} autoscroll rail(s) frozen.\n`);

  const norm = (s) =>
    (s ?? '').normalize('NFC').replace(/[‘’′]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim().toLowerCase();
  const byH1 = new Map();
  for (const h of bundleIndex) if (h.width === 1440) byH1.set(norm(h.h1), h);

  const extractedPage = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: 1 });
  const rows = [];

  for (const page of manifest.pages) {
    const src = byH1.get(norm(page.h1));
    if (!src) { rows.push({ slug: page.slug, error: 'no matching 1440px artboard in bundle' }); continue; }

    const el = (await bundlePage.$$('#dc-root div.sc-host[data-sc-name]'))[src.index];
    await el.scrollIntoViewIfNeeded();
    await bundlePage.waitForTimeout(250);
    const bundleScrolled = await resetScroll(bundlePage);
    await bundlePage.waitForTimeout(150);
    const aBuf = await el.screenshot({ type: 'png' });

    await extractedPage.goto(`${base}/design/pages/${page.slug}.html`, { waitUntil: 'load', timeout: 120000 });
    await settle(extractedPage);
    const target = await extractedPage.$('body > div.sc-host[data-sc-name]');
    if (!target) { rows.push({ slug: page.slug, error: 'no sc-host in extracted page' }); continue; }
    const extractedSticky = await stickyBoxes(target);
    await unstick(extractedPage);
    await resetScroll(extractedPage);
    await extractedPage.waitForTimeout(200);
    const dims = await target.evaluate((n) => ({ width: n.offsetWidth, height: n.offsetHeight }));
    const bBuf = await target.screenshot({ type: 'png' });

    const A = PNG.sync.read(aBuf);
    const B = PNG.sync.read(bBuf);
    const r = compare(A, B);

    if (KEEP_IMAGES) {
      await writeFile(path.join(OUT, 'bundle', `${page.slug}.png`), aBuf);
      await writeFile(path.join(OUT, 'extracted', `${page.slug}.png`), bBuf);
      if (r.pct > TOLERANCE_PCT) await writeFile(path.join(OUT, 'diff', `${page.slug}.png`), PNG.sync.write(r.mask));
    }

    rows.push({
      slug: page.slug,
      sticky: extractedSticky,
      bundleScrollersReset: bundleScrolled,
      bundleSticky: src.sticky,
      bundle: `${src.width}x${src.height}`,
      extracted: `${dims.width}x${dims.height}`,
      sizeMatch: src.width === dims.width && src.height === dims.height,
      shot: `${A.width}x${A.height} vs ${B.width}x${B.height}`,
      raw: r.rawDiff,
      real: r.real,
      pct: r.pct,
      pass: r.pct <= TOLERANCE_PCT,
    });
    const mark = r.pct <= TOLERANCE_PCT ? 'pass' : 'FAIL';
    console.log(`  ${page.slug.padEnd(45)} ${String(src.width).padStart(4)}x${String(src.height).padEnd(6)} vs ${String(dims.width).padStart(4)}x${String(dims.height).padEnd(6)} ${r.pct.toFixed(3).padStart(7)}%  ${mark}`);
  }

  // ---- report -------------------------------------------------------------------------
  console.log('\n=== Gate A: extraction fidelity, 1440 viewport ===\n');
  console.log('| page | bundle WxH | extracted WxH | size | raw diff px | real diff px | diff % | verdict |');
  console.log('|---|---|---|---|---|---|---|---|');
  for (const r of rows) {
    if (r.error) { console.log(`| ${r.slug} | | | | | | | ERROR ${r.error} |`); continue; }
    console.log(`| ${r.slug} | ${r.bundle} | ${r.extracted} | ${r.sizeMatch ? 'match' : 'DIFFERS'} | ${r.raw} | ${r.real} | ${r.pct.toFixed(3)}% | ${r.pass ? 'pass' : 'FAIL'} |`);
  }
  const failures = rows.filter((r) => r.error || !r.pass);
  const sizeMismatch = rows.filter((r) => !r.error && !r.sizeMatch);
  console.log(`\n${rows.length - failures.length}/${rows.length} pages within ${TOLERANCE_PCT}%.`);
  if (sizeMismatch.length) {
    console.log(`\nSize mismatches, these mean inherited frame chrome or a layout shift:`);
    for (const r of sizeMismatch) console.log(`  ${r.slug}: bundle ${r.bundle}, extracted ${r.extracted}`);
  }
  if (failures.length) {
    console.log(`\nFailures:`);
    for (const r of failures) console.log(`  ${r.slug}: ${r.error ?? `${r.pct.toFixed(3)}% (diff image at design/gate-a/diff/${r.slug}.png)`}`);
  }

  await writeFile(path.join(OUT, 'report.json'), JSON.stringify({ viewport: VIEWPORT, tolerancePct: TOLERANCE_PCT, aaRadius: AA_RADIUS, rows }, null, 2));
  await browser.close();
  server.close();
  process.exitCode = failures.length ? 1 : 0;
}

main().catch((err) => { console.error(err); process.exit(1); });
