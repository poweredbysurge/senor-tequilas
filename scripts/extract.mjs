#!/usr/bin/env node
/**
 * Phase 1: extract the Claude Design bundle into 20 standalone page documents.
 *
 * The bundle is self-unpacking, so we render it in headless Chromium, wait for the
 * unpack to finish, then lift each artboard out with its stylesheet and its images.
 *
 * Writes:
 *   design/pages/<slug>.html                    the 20 desktop pages
 *   design/pages/_mobile-reference/<slug>.html  the 8 mobile previews, cross-check only
 *   design/pages/images/<hash>.<ext>            every blob image, deduped by content hash
 *   design/pages/site.css                       the shared stylesheet, for Phase 3
 *   design/pages/manifest.json                  slug, path, h1, width, mobile reference
 *
 * Usage:
 *   node scripts/extract.mjs            extract
 *   node scripts/extract.mjs --probe    report structure only, write nothing
 */

import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EXPORT_DIR = path.join(ROOT, 'design', 'export');
const BUNDLE = 'master-board.standalone.html';
const OUT = path.join(ROOT, 'design', 'pages');

const EXPECTED_HOSTS = 29;
const DESKTOP_WIDTH = 1440;
const MOBILE_WIDTH = 390;
const EXPECTED_DESKTOP = 20;
const EXPECTED_MOBILE = 8;
const SETTLE_MS = 5000;
const TITLE_CARD_H1 = 'everything, one board';

const PROBE = process.argv.includes('--probe');

/** H1 to URL path and output slug. The H1 is the only reliable page identity. */
const PAGES = [
  ['From Mexico, With Love',                       '/',                                            'home'],
  ['The Menu',                                     '/menu',                                        'menu'],
  ["We're Not a Chain. We're a Family.",           '/our-story',                                   'our-story'],
  ["Don't Do the Dishes",                          '/takeout-delivery',                            'takeout-delivery'],
  ['Birria Tacos',                                 '/birria-tacos',                                'birria-tacos'],
  ['Quesabirria Tacos',                            '/quesabirria-tacos',                           'quesabirria-tacos'],
  ['Street Tacos',                                 '/street-tacos',                                'street-tacos'],
  ['Fajitas & Molcajetes',                         '/fajitas-molcajetes',                          'fajitas-molcajetes'],
  ['La Dulcería',                                  '/la-dulceria',                                 'la-dulceria'],
  ['Private Rooms for 12 to 400',                  '/private-parties',                             'private-parties'],
  ['Quinceañeras, Without the Ballroom Price',     '/private-parties/quinceaneras-celebrations',   'private-parties-quinceaneras-celebrations'],
  ['Weddings, Showers, Receptions',                '/private-parties/weddings-receptions',         'private-parties-weddings-receptions'],
  ['Taco Catering',                                '/catering',                                    'catering'],
  ['The Margaritas People Text Their Friends About', '/margaritas',                                'margaritas'],
  ["It's in the Name for a Reason",                '/tequila-bar',                                 'tequila-bar'],
  ['Happy Hour in Germantown',                     '/happy-hour',                                  'happy-hour'],
  ['Still Open. Still Cooking.',                   '/late-night',                                  'late-night'],
  ['Karaoke Every Thursday',                       '/karaoke',                                     'karaoke'],
  ['Taco Tuesday',                                 '/taco-tuesday',                                'taco-tuesday'],
  ['Mexican Food Near Gaithersburg',               '/mexican-restaurant-gaithersburg-md',          'mexican-restaurant-gaithersburg-md'],
];

/** Curly quotes, accents and stray whitespace must not decide page identity. */
const norm = (s) =>
  (s ?? '')
    .normalize('NFC')
    .replace(/[‘’′]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const BY_H1 = new Map(PAGES.map(([h1, url, slug]) => [norm(h1), { h1, url, slug }]));

const MIME_EXT = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
  'image/svg+xml': 'svg',
  'video/mp4': 'mp4',
  'font/woff2': 'woff2',
};

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
};

/**
 * Serve design/export over http. Loading from file:// gives the page a null origin,
 * and fetch(blob:) from a null origin is blocked, which is exactly what we need to do.
 */
function serve(dir) {
  return new Promise((resolve) => {
    const server = createServer(async (req, res) => {
      const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/+/, '');
      const file = path.join(dir, rel);
      if (!file.startsWith(dir)) { res.statusCode = 403; return res.end(); }
      try {
        const buf = await readFile(file);
        res.setHeader('Content-Type', CONTENT_TYPES[path.extname(file)] ?? 'application/octet-stream');
        res.end(buf);
      } catch {
        res.statusCode = 404;
        res.end('not found');
      }
    });
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
  });
}

const attrsToString = (attrs) =>
  attrs.map(([n, v]) => ` ${n}="${String(v).replace(/"/g, '&quot;')}"`).join('');

const bytes = (n) => `${(n / 1024 / 1024).toFixed(2)} MB`;

async function main() {
  const { server, port } = await serve(EXPORT_DIR);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });

  const consoleErrors = [];
  page.on('pageerror', (e) => consoleErrors.push(String(e)));

  console.log(`Loading ${BUNDLE} from http://127.0.0.1:${port} ...`);
  await page.goto(`http://127.0.0.1:${port}/${BUNDLE}`, { waitUntil: 'load', timeout: 300000 });

  console.log(`Waiting for the unpack to produce ${EXPECTED_HOSTS} artboards ...`);
  await page.waitForFunction(
    (expected) => {
      const root = document.getElementById('dc-root');
      return !!root && root.querySelectorAll('div.sc-host[data-sc-name]').length === expected;
    },
    EXPECTED_HOSTS,
    { timeout: 300000, polling: 500 }
  );
  await page.waitForTimeout(SETTLE_MS);
  await page.evaluate(() => document.fonts.ready.then(() => true));
  console.log('Unpack complete.\n');

  // ---- 1. shared stylesheet and font links -------------------------------------------
  // Styles that live inside an artboard ride along in that artboard's outerHTML, so we
  // only lift the ones outside. Taking them twice would duplicate rules and shift cascade order.
  const { cssText, headLinks, htmlAttrs, bodyAttrs, styleCounts, bodyMargin, bodyBackground } = await page.evaluate(() => {
    const all = [...document.querySelectorAll('style')];
    const outside = all.filter((s) => !s.closest('.sc-host'));
    return {
      cssText: outside.map((s) => s.textContent || '').join('\n\n'),
      headLinks: [...document.querySelectorAll('link[rel="stylesheet"], link[rel="preconnect"], link[rel="dns-prefetch"]')]
        .filter((l) => /^https?:/.test(l.href))
        .map((l) => l.outerHTML),
      htmlAttrs: [...document.documentElement.attributes].map((a) => [a.name, a.value]),
      bodyAttrs: [...document.body.attributes].map((a) => [a.name, a.value]),
      styleCounts: { total: all.length, outside: outside.length, insideHosts: all.length - outside.length },
      bodyMargin: getComputedStyle(document.body).margin,
      bodyBackground: getComputedStyle(document.body).backgroundColor,
    };
  });
  console.log(`Stylesheet: ${styleCounts.outside} <style> elements outside artboards, ${bytes(cssText.length)}`);
  console.log(`            ${styleCounts.insideHosts} left in place inside artboards`);
  console.log(`Head links: ${headLinks.length}`);
  console.log(`Body in bundle: margin ${bodyMargin}, background ${bodyBackground}\n`);

  // ---- 2. artboards -------------------------------------------------------------------
  // offsetWidth, not getBoundingClientRect, so a canvas zoom transform cannot skew the width.
  const hosts = await page.evaluate(() => {
    const root = document.getElementById('dc-root');
    const TRANSPARENT = /^rgba\(0,\s*0,\s*0,\s*0\)$|^transparent$/;
    // The artboard's own surface color, so the extracted page does not inherit the canvas beige.
    const surfaceOf = (start) => {
      for (let node = start, i = 0; node && i < 6; node = node.firstElementChild, i++) {
        const bg = getComputedStyle(node).backgroundColor;
        if (bg && !TRANSPARENT.test(bg)) return bg;
      }
      return null;
    };
    return [...root.querySelectorAll('div.sc-host[data-sc-name]')].map((el, index) => ({
      index,
      name: el.getAttribute('data-sc-name'),
      width: el.offsetWidth,
      height: el.offsetHeight,
      surface: surfaceOf(el),
      h1: el.querySelector('h1')?.textContent?.trim() ?? null,
      h1Count: el.querySelectorAll('h1').length,
      forceMobile: el.hasAttribute('data-force-mobile') || !!el.querySelector('[data-force-mobile]'),
      c1p: !!el.querySelector('[data-c1p-root]'),
      html: el.outerHTML,
    }));
  });

  const desktop = [];
  const mobile = [];
  const unclassified = [];
  const attrDisagreement = [];
  for (const h of hosts) {
    if (norm(h.h1) === TITLE_CARD_H1) continue;           // the board's own title card
    const match = BY_H1.get(norm(h.h1));
    if (!match) { unclassified.push(h); continue; }
    // Width is the classifier, not data-force-mobile. The homepage comes from a different
    // source board and its 390px preview carries no such attribute, so trusting the
    // attribute alone lets a mobile preview pose as a desktop page and overwrite it.
    if (h.width === MOBILE_WIDTH) {
      mobile.push({ ...h, ...match });
      if (!h.forceMobile) attrDisagreement.push({ ...h, ...match, why: '390px but no data-force-mobile' });
    } else if (h.width === DESKTOP_WIDTH) {
      desktop.push({ ...h, ...match });
      if (h.forceMobile) attrDisagreement.push({ ...h, ...match, why: '1440px but carries data-force-mobile' });
    } else {
      unclassified.push(h);
    }
  }

  // Two artboards claiming one slug means a silent overwrite. Refuse rather than lose a page.
  for (const [label, list] of [['desktop', desktop], ['mobile', mobile]]) {
    const seen = new Map();
    for (const h of list) {
      if (seen.has(h.slug)) {
        throw new Error(`Slug collision in ${label}: "${h.slug}" claimed by artboard ${seen.get(h.slug)} and ${h.index}`);
      }
      seen.set(h.slug, h.index);
    }
  }

  console.log(`Artboards: ${hosts.length} total, ${desktop.length} desktop, ${mobile.length} mobile, ${unclassified.length} unclassified\n`);

  if (PROBE) {
    console.log('--- probe: artboard inventory ---');
    for (const h of hosts) {
      console.log(`  [${String(h.index).padStart(2)}] ${String(h.width).padStart(4)}px  mobile=${h.forceMobile ? 'y' : 'n'}  c1p=${h.c1p ? 'y' : 'n'}  h1=${JSON.stringify(h.h1)}  name=${JSON.stringify(h.name)}`);
    }
    console.log('\n--- probe: artboard surface colors ---');
    for (const h of hosts) console.log(`  [${h.index}] ${h.width}x${h.height}  surface=${h.surface}`);
    console.log('\n--- probe: artboard own attributes ---');
    for (const h of hosts.slice(0, 3)) {
      const open = h.html.slice(0, h.html.indexOf('>') + 1);
      console.log(`  [${h.index}] ${open.slice(0, 400)}`);
    }
    await browser.close();
    server.close();
    return;
  }

  // ---- 3. blob images -----------------------------------------------------------------
  const BLOB_RE = /blob:[^)'"\s\\]+/g;
  const blobUrls = await page.evaluate((css) => {
    const re = /blob:[^)'"\s\\]+/g;
    // The unpacker also creates blob URLs for its own scripts and modules. Those are not
    // assets, nothing in an artboard points at them, and they would land as junk .bin files.
    const NOT_AN_ASSET = new Set(['SCRIPT', 'LINK', 'IFRAME', 'EMBED', 'OBJECT']);
    const set = new Set();
    for (const m of css.matchAll(re)) set.add(m[0]);
    for (const el of document.querySelectorAll('*')) {
      if (NOT_AN_ASSET.has(el.tagName)) continue;
      for (const a of el.attributes) {
        if (a.value.includes('blob:')) for (const m of a.value.matchAll(re)) set.add(m[0]);
      }
    }
    return [...set];
  }, cssText);
  console.log(`Blob URLs referenced: ${blobUrls.length}`);

  await rm(OUT, { recursive: true, force: true });
  await mkdir(path.join(OUT, 'images'), { recursive: true });
  await mkdir(path.join(OUT, '_mobile-reference'), { recursive: true });

  /** blob URL -> "<hash>.<ext>". Identical bytes collapse to one file. */
  const blobMap = new Map();
  const written = new Map();
  const failed = [];
  const skipped = [];
  let totalBytes = 0;

  for (const url of blobUrls) {
    let data;
    try {
      data = await page.evaluate(async (u) => {
        const res = await fetch(u);
        const blob = await res.blob();
        const buf = new Uint8Array(await blob.arrayBuffer());
        let bin = '';
        const CHUNK = 0x8000;
        for (let i = 0; i < buf.length; i += CHUNK) {
          bin += String.fromCharCode.apply(null, buf.subarray(i, i + CHUNK));
        }
        return { type: blob.type, b64: btoa(bin) };
      }, url);
    } catch (err) {
      failed.push({ url, error: String(err).slice(0, 200) });
      continue;
    }
    if (!/^(image|video|audio|font)\//.test(data.type)) {
      skipped.push({ url, type: data.type || '(none)' });
      continue;
    }
    const buf = Buffer.from(data.b64, 'base64');
    const hash = createHash('sha256').update(buf).digest('hex').slice(0, 16);
    const ext = MIME_EXT[data.type] ?? 'bin';
    const filename = `${hash}.${ext}`;
    blobMap.set(url, filename);
    if (!written.has(filename)) {
      await writeFile(path.join(OUT, 'images', filename), buf);
      written.set(filename, buf.length);
      totalBytes += buf.length;
    }
  }
  console.log(`Images written: ${written.size} unique files, ${bytes(totalBytes)}`);
  if (skipped.length) console.log(`Non-asset blobs skipped: ${skipped.length} (${skipped.map((s) => s.type).join(', ')})`);
  if (failed.length) console.log(`Blob fetch failures: ${failed.length}`);
  console.log();

  /** Rewrite blob URLs to relative image paths. Blob URLs are unique, so plain replacement is safe. */
  const rewrite = (text, prefix) =>
    text.replace(BLOB_RE, (m) => (blobMap.has(m) ? prefix + blobMap.get(m) : m));

  // ---- 4. write the pages -------------------------------------------------------------
  // The artboard goes straight into <body>. The chain above it (#dc-root, section, the
  // #frame-c1d / #frame-c1m wrappers) is canvas chrome, not design. The frames carry inline
  // width:1440px and width:390px;height:844px;overflow:auto, which would pin every page to a
  // fixed width, stop the media queries firing and box mobile into a scroller. The three
  // `#dc-root > .sc-host` rules in the stylesheet only ever matched the board's own outer
  // host, never these page hosts, so dropping #dc-root costs nothing.
  const buildDoc = (host, prefix) => `<!doctype html>
<html${attrsToString(htmlAttrs)}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${host.h1}</title>
${headLinks.join('\n')}
<style>
${rewrite(cssText, prefix)}
</style>
<style id="extraction-canvas-reset">
/* Extraction only. The stylesheet sets html,body{background:#f0eee6} for the canvas and
   html,body{height:100%} for the board shell. Neither belongs to the page. Nothing else
   is overridden: no spacing, type, color, radius, shadow or breakpoint is touched. */
html, body { height: auto; background: ${host.surface ?? 'transparent'}; }
</style>
</head>
<body${attrsToString(bodyAttrs)}>
${rewrite(host.html, prefix)}
</body>
</html>
`;

  for (const host of desktop) {
    await writeFile(path.join(OUT, `${host.slug}.html`), buildDoc(host, 'images/'));
  }
  for (const host of mobile) {
    await writeFile(path.join(OUT, '_mobile-reference', `${host.slug}.html`), buildDoc(host, '../images/'));
  }
  await writeFile(path.join(OUT, 'site.css'), rewrite(cssText, 'images/'));

  const mobileSlugs = new Set(mobile.map((m) => m.slug));
  const manifest = {
    generatedAt: new Date().toISOString(),
    bundle: `design/export/${BUNDLE}`,
    counts: {
      artboards: hosts.length,
      desktop: desktop.length,
      mobile: mobile.length,
      unclassified: unclassified.length,
      images: written.size,
    },
    pages: desktop.map((h) => ({
      slug: h.slug,
      path: h.url,
      h1: h.h1,
      sourceWidth: h.width,
      sourceHeight: h.height,
      surface: h.surface,
      scName: h.name,
      c1p: h.c1p,
      mobileReference: mobileSlugs.has(h.slug) ? `_mobile-reference/${h.slug}.html` : null,
    })),
  };
  await writeFile(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2));

  // ---- 5. report ----------------------------------------------------------------------
  console.log('--- pages written ---');
  for (const h of desktop) {
    console.log(`  ${h.slug.padEnd(45)} ${String(h.width).padStart(4)}px  ${h.url.padEnd(46)} mobile=${mobileSlugs.has(h.slug) ? 'y' : 'n'}`);
  }
  const missing = PAGES.filter(([, , slug]) => !desktop.some((d) => d.slug === slug));
  if (missing.length) {
    console.log('\n--- H1s from the table with no artboard ---');
    for (const [h1, url] of missing) console.log(`  ${JSON.stringify(h1)}  ${url}`);
  }
  if (unclassified.length) {
    console.log('\n--- unclassified artboards ---');
    for (const h of unclassified) {
      console.log(`  [${h.index}] ${h.width}px  mobile=${h.forceMobile}  h1=${JSON.stringify(h.h1)}  name=${JSON.stringify(h.name)}`);
    }
  }
  if (failed.length) {
    console.log('\n--- blob fetch failures ---');
    for (const f of failed) console.log(`  ${f.url.slice(0, 80)}  ${f.error}`);
  }
  if (consoleErrors.length) {
    console.log(`\n--- page errors during unpack (${consoleErrors.length}) ---`);
    for (const e of consoleErrors.slice(0, 10)) console.log(`  ${e.slice(0, 200)}`);
  }
  if (attrDisagreement.length) {
    console.log('\n--- width and data-force-mobile disagree (width wins) ---');
    for (const h of attrDisagreement) console.log(`  [${h.index}] ${h.slug}: ${h.why}`);
  }
  if (desktop.length !== EXPECTED_DESKTOP || mobile.length !== EXPECTED_MOBILE) {
    console.log(`\n!! expected ${EXPECTED_DESKTOP} desktop and ${EXPECTED_MOBILE} mobile, got ${desktop.length} and ${mobile.length}`);
  }
  const multiH1 = desktop.filter((h) => h.h1Count !== 1);
  if (multiH1.length) {
    console.log('\n--- artboards without exactly one H1 ---');
    for (const h of multiH1) console.log(`  ${h.slug}: ${h.h1Count}`);
  }

  console.log(`\nStylesheet: ${bytes(cssText.length)}   Images: ${written.size} files, ${bytes(totalBytes)}   Pages: ${desktop.length} desktop, ${mobile.length} mobile`);

  await browser.close();
  server.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
