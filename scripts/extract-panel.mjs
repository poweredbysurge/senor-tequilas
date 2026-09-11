#!/usr/bin/env node
/**
 * Lift the design's own mobile menu panel out of the bundle.
 *
 * The panel does not exist in the DOM until the bundle's React runtime builds it on click,
 * which is why it never survived extraction. So we click, take the markup the design
 * actually drew, and re-point its eight links using design/LINK-MAP.json.
 *
 * Writes design/overlay/mobile-menu.html. Re-runnable after a future export.
 */

import { chromium } from 'playwright';
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve, settle, LAUNCH_ARGS } from './lib/render.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BUNDLE = 'design/export/master-board.standalone.html';
const OUT = path.join(ROOT, 'design', 'overlay', 'mobile-menu.html');
const IMG_OUT = path.join(ROOT, 'design', 'overlay', 'images');
const PAGE_IMGS = path.join(ROOT, 'design', 'pages', 'images');

const MIME_EXT = {
  'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp',
  'image/gif': 'gif', 'image/avif': 'avif', 'image/svg+xml': 'svg',
};

/** The eight panel links, as signed off. Keyed by the href the design drew. */
const PANEL_LINKS = {
  '#menu': '/menu',
  '#tonight': '/taco-tuesday',
  '#happy': '/happy-hour',
  '#events': '/private-parties',
  '#story': '/our-story',
  '#gift': '/#gift',       // no gift card page exists; root-relative works from any page
};

async function main() {
  const { server, port } = await serve(ROOT);
  const browser = await chromium.launch({ headless: true, args: LAUNCH_ARGS });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  await page.goto(`http://127.0.0.1:${port}/${BUNDLE}`, { waitUntil: 'load', timeout: 300000 });
  await page.waitForFunction(
    () => document.getElementById('dc-root')?.querySelectorAll('div.sc-host[data-sc-name]').length === 29,
    null, { timeout: 300000, polling: 500 }
  );
  await page.waitForTimeout(5000);
  await settle(page);

  const idx = await page.evaluate(() =>
    [...document.getElementById('dc-root').querySelectorAll('div.sc-host[data-sc-name]')]
      .findIndex((h) => h.offsetWidth === 1440 && /From Mexico, With Love/i.test(h.querySelector('h1')?.textContent || '')));
  const host = (await page.$$('#dc-root div.sc-host[data-sc-name]'))[idx];

  await (await host.$('header button')).click({ force: true });
  await page.waitForTimeout(1200);

  const panel = await host.evaluate((h) => {
    const p = [...h.querySelectorAll('*')].find(
      (e) => getComputedStyle(e).position === 'fixed' && getComputedStyle(e).zIndex === '100');
    if (!p) return null;
    return {
      html: p.outerHTML,
      links: [...p.querySelectorAll('a')].map((a) => ({ href: a.getAttribute('href'), text: (a.textContent || '').replace(/\s+/g, ' ').trim() })),
    };
  });
  if (!panel) throw new Error('the panel did not open; the bundle runtime may have changed');

  let html = panel.html;

  // The panel's card images are blob: URLs on the bundle's own ephemeral origin. They die
  // the moment the bundle closes, so they have to become real files exactly as extract.mjs
  // does for the pages. They live under the overlay rather than in design/pages/, so the
  // design record and the port's additions stay separable.
  await mkdir(IMG_OUT, { recursive: true });
  const blobUrls = [...new Set([...html.matchAll(/blob:[^)'"\s\\]+/g)].map((m) => m[0]))];
  const images = [];
  for (const url of blobUrls) {
    const data = await page.evaluate(async (u) => {
      const res = await fetch(u);
      const blob = await res.blob();
      const buf = new Uint8Array(await blob.arrayBuffer());
      let bin = '';
      for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
      return { type: blob.type, b64: btoa(bin) };
    }, url);
    const buf = Buffer.from(data.b64, 'base64');
    const hash = createHash('sha256').update(buf).digest('hex').slice(0, 16);
    const ext = MIME_EXT[data.type] ?? 'bin';
    const file = `${hash}.${ext}`;
    // Content-hashed, so an image the pages already carry needs no second copy. Only a
    // panel-only asset gets written under the overlay.
    let alsoInPages = true;
    try { await access(path.join(PAGE_IMGS, file)); } catch { alsoInPages = false; }
    if (!alsoInPages) await writeFile(path.join(IMG_OUT, file), buf);
    images.push({ file, bytes: buf.length, type: data.type, alsoInPages });
    // Root-relative, because Phase 3 serves every image from /images/.
    html = html.replaceAll(url, `/images/${file}`);
  }

  const rewritten = [];
  for (const [from, to] of Object.entries(PANEL_LINKS)) {
    const before = html;
    html = html.replaceAll(`href="${from}"`, `href="${to}"`);
    if (html !== before) rewritten.push(`${from} -> ${to}`);
  }

  // Two port additions to the root element, and nothing else: an id for the toggle to
  // address, and `hidden` so the panel is inert until opened.
  const open = html.slice(0, html.indexOf('>') + 1);
  if (!open.includes('data-dc-tpl="27"')) throw new Error(`unexpected panel root: ${open.slice(0, 120)}`);
  html = html.replace(open, open.replace('<div ', '<div id="mobile-menu" hidden '));

  // Deliberate changes to the panel, reapplied here so a re-extraction does not undo them.
  // See DESIGN-DEBT.md entry 25.
  html = html.replace('>Thursday<', '>Every day<').replace('>Tonight<', '>Tacos<');
  html = html.replace(/url\((\/images\/)?[^)]*\)(?=[^)]*Gift Cards)/, 'url(/images/sen-giftcard.jpg)');

  const remaining = [...html.matchAll(/href="([^"]*)"/g)].map((m) => m[1]);
  const stillAnchored = remaining.filter((h) => h.startsWith('#'));

  const doc = `<!--
  The design's own mobile menu panel, lifted from the bundle.

  It is generated by the bundle's React runtime on click, so it was never in the extracted
  static markup. Regenerate with: node scripts/extract-panel.mjs

  The markup below is exactly what the design drew, including the eyebrow-and-label pattern
  ("Eat / Menu", "Since 2015 / Our Story") and the scp1/scp2/scp3 classes, which are already
  in the extracted stylesheet. Only the eight hrefs are changed, per design/LINK-MAP.json.

  Hidden by default; the toggle in design/overlay/mobile-menu.js reveals it.
-->
${html}
`;
  await writeFile(OUT, doc);

  console.log(`Panel lifted: ${html.length} chars, ${panel.links.length} links.`);
  console.log(`\nblob images resolved to files (design/overlay/images/, referenced as /images/):`);
  for (const i of images) {
    console.log(`  ${i.file}  ${(i.bytes / 1024).toFixed(0)}KB  ${i.alsoInPages ? 'already in design/pages/images, no copy written' : 'PANEL ONLY, written to design/overlay/images/'}`);
  }
  const leftoverBlobs = (html.match(/blob:/g) || []).length;
  if (leftoverBlobs) throw new Error(`${leftoverBlobs} blob URL(s) survived the rewrite`);
  console.log('\nhrefs rewritten:');
  for (const r of rewritten) console.log(`  ${r}`);
  console.log('\nfinal link set:');
  for (const m of html.matchAll(/href="([^"]*)"[^>]*>/g)) { /* order preserved below */ }
  const finalLinks = await page.evaluate((h) => {
    const d = document.createElement('div'); d.innerHTML = h;
    return [...d.querySelectorAll('a')].map((a) => `${(a.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 30).padEnd(32)} -> ${a.getAttribute('href')}`);
  }, html);
  for (const l of finalLinks) console.log(`  ${l}`);
  console.log(`\nremaining in-page anchors: ${stillAnchored.length ? stillAnchored.join(', ') : 'none'}`);

  await browser.close();
  server.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
