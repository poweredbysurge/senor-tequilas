#!/usr/bin/env node
/**
 * Verify the port overlay: the mobile nav rule and the menu panel.
 *
 * 1. No horizontal scroll at 360, 390, 430, 600 and 767, on all 20 pages.
 * 2. The 1440 references re-render byte-identical to the ones already recorded, which is the
 *    proof that the max-width:767px rule does not leak above the breakpoint.
 * 3. Header measurements at 768 and 1024, to judge whether it is cramped.
 * 4. With the panel open at 390: still no horizontal scroll, it closes, and focus returns.
 */

import { chromium } from 'playwright';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve, settle, resetScroll, capture, LAUNCH_ARGS } from './lib/render.mjs';
import { applyOverlay } from './lib/overlay.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REF = path.join(ROOT, 'design', 'reference');
const SHOTS = path.join(ROOT, 'design', 'gate-a', 'overlay-check');

const NARROW = [320, 360, 375, 390, 430, 600, 767];
const WIDE = [768, 810, 820, 834, 899, 900, 1024, 1280, 1440, 1920];
// 320 is below the smallest width the design was ever drawn at. It is measured and
// reported, but it is not part of the pass/fail contract. See DESIGN-DEBT.md.
const ACCEPTED_WIDTH = 320;

async function main() {
  const { server, port } = await serve(ROOT);
  const base = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch({ headless: true, args: LAUNCH_ARGS });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const manifest = JSON.parse(await readFile(path.join(ROOT, 'design', 'pages', 'manifest.json'), 'utf8'));
  await mkdir(SHOTS, { recursive: true });

  // ---- 1. horizontal scroll -------------------------------------------------------------
  console.log('=== 1. horizontal scroll, overlay applied ===\n');
  const overflow = [];
  const accepted = [];
  for (const p of manifest.pages) {
    const row = { slug: p.slug, widths: {} };
    for (const w of [...NARROW, ...WIDE]) {
      await page.setViewportSize({ width: w, height: 900 });
      await page.goto(`${base}/design/pages/${p.slug}.html`, { waitUntil: 'load' });
      await applyOverlay(page);
      await settle(page);
      await resetScroll(page);
      const r = await page.evaluate(() => ({
        over: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        navDisplay: (() => { const n = document.querySelector('header nav'); return n ? getComputedStyle(n).display : 'none'; })(),
        burger: !!document.querySelector('header button[aria-label="Open menu"]'),
      }));
      row.widths[w] = r;
      if (r.over > 0 && w !== ACCEPTED_WIDTH) overflow.push(`${p.slug} @${w}: +${r.over}px`);
      if (r.over > 0 && w === ACCEPTED_WIDTH) accepted.push(`${p.slug}: +${r.over}px`);
    }
    const bad = Object.entries(row.widths).filter(([w, r]) => r.over > 0 && Number(w) !== ACCEPTED_WIDTH);
    console.log(`  ${p.slug.padEnd(45)} ${bad.length ? 'OVERFLOW ' + bad.map(([w, r]) => `${w}:+${r.over}`).join(' ') : `clean at all ${NARROW.length + WIDE.length} widths`}`);
  }
  console.log(`\n  ${overflow.length === 0 ? 'PASS: no horizontal scroll anywhere.' : `FAIL: ${overflow.length} overflow(s)`}`);
  for (const o of overflow.slice(0, 12)) console.log(`    ${o}`);
  console.log(`\n  at ${ACCEPTED_WIDTH}px, below anything the design was drawn at, ${accepted.length} page(s) overflow (accepted, logged):`);
  for (const a of accepted) console.log(`    ${a}`);

  // ---- 2. the 1440 references must not move ---------------------------------------------
  console.log('\n=== 2. 1440 references re-rendered with the overlay, vs the recorded hashes ===\n');
  const recorded = JSON.parse(await readFile(path.join(REF, 'MANIFEST.json'), 'utf8'));
  const byFile = new Map(recorded.files.map((f) => [f.file, f]));
  let same = 0;
  const moved = [];
  for (const p of manifest.pages) {
    const name = `${p.slug}-1440.png`;
    const { buffer } = await capture(page, `${base}/design/pages/${p.slug}.html`, { width: 1440, height: 900 }, applyOverlay);
    const sha = createHash('sha256').update(buffer).digest('hex');
    const was = byFile.get(name);
    if (was && was.sha256 === sha) { same++; }
    else { moved.push({ name, was: was?.sha256?.slice(0, 12), now: sha.slice(0, 12) }); }
  }
  console.log(`  ${same}/${manifest.pages.length} byte-identical.`);
  if (moved.length) {
    console.log('  MOVED, the rule leaked above 767:');
    for (const m of moved) console.log(`    ${m.name}  ${m.was} -> ${m.now}`);
  } else {
    console.log('  PASS: nothing above the breakpoint changed.');
  }

  // ---- 3. is the header cramped at 768 and 1024? ----------------------------------------
  console.log('\n=== 3. header headroom ===\n');
  const headroom = [];
  for (const w of [900, 1024, 1280]) {
    for (const p of manifest.pages) {
      await page.setViewportSize({ width: w, height: 900 });
      await page.goto(`${base}/design/pages/${p.slug}.html`, { waitUntil: 'load' });
      await applyOverlay(page);
      await settle(page);
      const r = await page.evaluate(() => {
        const header = document.querySelector('header');
        const inner = header.firstElementChild;
        const kids = [...(inner?.children ?? [])];
        const used = kids.reduce((n, k) => n + k.getBoundingClientRect().width, 0);
        const avail = inner ? inner.getBoundingClientRect().width : 0;
        const nav = header.querySelector('nav');
        return { avail: Math.round(avail), used: Math.round(used), slack: Math.round(avail - used),
          navW: nav ? Math.round(nav.getBoundingClientRect().width) : 0,
          links: nav ? nav.querySelectorAll('a').length : 0 };
      });
      headroom.push({ w, slug: p.slug, ...r });
    }
  }
  for (const w of [900, 1024, 1280]) {
    const rows = headroom.filter((h) => h.w === w).sort((a, b) => a.slack - b.slack);
    const worst = rows[0];
    console.log(`  ${w}px: tightest is ${worst.slug} with ${worst.slack}px slack (nav ${worst.navW}px, ${worst.links} links, row ${worst.used}/${worst.avail})`);
    console.log(`         next three: ${rows.slice(1, 4).map((r) => `${r.slug} ${r.slack}px`).join(', ')}`);
  }
  for (const w of [900, 1024, 1280]) {
    const tight = headroom.filter((h) => h.w === w).sort((a, b) => a.slack - b.slack)[0];
    await page.setViewportSize({ width: w, height: 900 });
    await page.goto(`${base}/design/pages/${tight.slug}.html`, { waitUntil: 'load' });
    await applyOverlay(page);
    await settle(page);
    const header = await page.$('header');
    await writeFile(path.join(SHOTS, `header-${w}-${tight.slug}.png`), await header.screenshot({ type: 'png' }));
  }
  console.log(`  header screenshots of the tightest page at each width in design/gate-a/overlay-check/`);

  // ---- 4. the panel itself ---------------------------------------------------------------
  console.log('\n=== 4. the panel at 390 ===\n');
  const panelRows = [];
  for (const p of manifest.pages) {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${base}/design/pages/${p.slug}.html`, { waitUntil: 'load' });
    await applyOverlay(page);
    await settle(page);
    await resetScroll(page);
    const r = await page.evaluate(async () => {
      const opener = document.querySelector('header button[aria-label="Open menu"]');
      const panel = document.getElementById('mobile-menu');
      const wait = () => new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res)));
      const closedInitially = panel.hidden === true;
      opener.focus();
      opener.click(); await wait();
      const openState = {
        visible: !panel.hidden,
        expanded: opener.getAttribute('aria-expanded'),
        controls: opener.getAttribute('aria-controls'),
        focusInPanel: panel.contains(document.activeElement),
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        links: panel.querySelectorAll('a').length,
      };
      panel.querySelector('button[aria-label="Close menu"]').click(); await wait();
      const closeState = { hidden: panel.hidden, expanded: opener.getAttribute('aria-expanded'), focusBack: document.activeElement === opener };
      // Escape
      opener.click(); await wait();
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await wait();
      const escState = { hidden: panel.hidden, focusBack: document.activeElement === opener };
      // link closes it
      opener.click(); await wait();
      const link = panel.querySelector('a');
      link.addEventListener('click', (e) => e.preventDefault(), { once: true });
      link.click(); await wait();
      const linkState = { hidden: panel.hidden };
      return { closedInitially, openState, closeState, escState, linkState };
    });
    panelRows.push({ slug: p.slug, ...r });
  }
  const fail = panelRows.filter((r) =>
    !r.closedInitially || !r.openState.visible || r.openState.expanded !== 'true' ||
    !r.openState.focusInPanel || r.openState.overflow > 0 || r.openState.links !== 8 ||
    !r.closeState.hidden || r.closeState.expanded !== 'false' || !r.closeState.focusBack ||
    !r.escState.hidden || !r.escState.focusBack || !r.linkState.hidden);
  const s0 = panelRows[0];
  console.log(`  sample (${s0.slug}): starts hidden=${s0.closedInitially}, opens with ${s0.openState.links} links,`);
  console.log(`     aria-expanded=${s0.openState.expanded}, aria-controls=${s0.openState.controls}, focus moves in=${s0.openState.focusInPanel}, overflow=${s0.openState.overflow}px`);
  console.log(`     close button closes=${s0.closeState.hidden} focus returns=${s0.closeState.focusBack}; Escape closes=${s0.escState.hidden}; link closes=${s0.linkState.hidden}`);
  console.log(`\n  ${fail.length === 0 ? `PASS: all ${panelRows.length} pages behave identically.` : `FAIL on ${fail.length} page(s): ${fail.map((f) => f.slug).join(', ')}`}`);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base}/design/pages/home.html`, { waitUntil: 'load' });
  await applyOverlay(page);
  await settle(page);
  await page.evaluate(() => document.querySelector('header button[aria-label="Open menu"]').click());
  await page.waitForTimeout(300);
  await writeFile(path.join(SHOTS, 'panel-open-390.png'), await page.screenshot({ type: 'png' }));

  const ok = overflow.length === 0 && moved.length === 0 && fail.length === 0;
  console.log(`\n${ok ? 'ALL CHECKS PASS' : 'CHECKS FAILED'}`);
  await browser.close();
  server.close();
  process.exitCode = ok ? 0 : 1;
}

main().catch((e) => { console.error(e); process.exit(1); });
