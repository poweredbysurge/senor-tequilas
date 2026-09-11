#!/usr/bin/env node
/**
 * Phase 4: verify the built site.
 *
 * Part 1 compares dist/ against design/reference/ at 390, 768 and 1440. Tolerance is 0.5%
 * of pixels after a 2px anti-aliasing allowance, the same comparison Gate A used, from the
 * same shared implementation. Font rendering is the only acceptable source of drift.
 *
 * Part 2 is the content pass, all of it inventory.
 *
 * Usage: node scripts/visual-check.mjs
 */

import { chromium } from 'playwright';
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';
import { settle, resetScroll, compare, VIEWPORTS, TOLERANCE_PCT, LAUNCH_ARGS } from './lib/render.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const REF = path.join(ROOT, 'design', 'reference');
const DIFFS = path.join(ROOT, 'design', 'gate-a', 'phase4-diff');

const NO_SCROLL_AT = [360, 390, 768, 1024, 1440, 1920];
const FORBIDDEN = ['5,592', '20%', 'Birria Pizza', 'margarita kit', 'events@'];
const NAP = ["Señor Tequila's", '20021 Century Blvd', 'Germantown, MD 20874', '301-569-4574'];
const EVENTS_PAGES = ['/private-parties', '/private-parties/quinceaneras-celebrations', '/private-parties/weddings-receptions', '/catering'];

const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json' };

function serveDist() {
  return new Promise((resolve) => {
    const server = createServer(async (req, res) => {
      const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      for (const c of [rel, path.join(rel, 'index.html')]) {
        const file = path.join(DIST, c);
        if (!file.startsWith(DIST)) continue;
        try {
          const buf = await readFile(file);
          res.setHeader('Content-Type', TYPES[path.extname(file)] ?? 'application/octet-stream');
          return res.end(buf);
        } catch { /* next */ }
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
  const browser = await chromium.launch({ headless: true, args: LAUNCH_ARGS });
  // reducedMotion is what makes the homepage comparable: the social rail scrolls itself, so
  // without it the reference and the build are photographed at different offsets and a
  // moving rail reads as a failure. site-tweaks.js honours the same preference, so this
  // measures exactly what a reduced-motion visitor sees.
  const page = await browser.newPage({ viewport: VIEWPORTS[2], deviceScaleFactor: 1, reducedMotion: 'reduce' });
  await rm(DIFFS, { recursive: true, force: true });
  await mkdir(DIFFS, { recursive: true });

  // ================= part 1: pixels =====================================================
  console.log('=== Phase 4, part 1: the built site against the reference set ===\n');
  const rows = [];
  for (const p of manifest.pages) {
    const row = { slug: p.slug, path: p.path, at: {} };
    for (const vp of VIEWPORTS) {
      await page.setViewportSize(vp);
      await page.goto(`${base}${p.path}`, { waitUntil: 'load', timeout: 120000 });
      await settle(page);
      await resetScroll(page);
      const built = PNG.sync.read(await page.screenshot({ type: 'png', fullPage: true }));
      const ref = PNG.sync.read(await readFile(path.join(REF, `${p.slug}-${vp.width}.png`)));
      const r = compare(ref, built);
      row.at[vp.width] = { pct: r.pct, sizeMatch: r.sizeMatch, ref: `${ref.width}x${ref.height}`, built: `${built.width}x${built.height}` };
      if (r.pct > TOLERANCE_PCT) await writeFile(path.join(DIFFS, `${p.slug}-${vp.width}.png`), PNG.sync.write(r.mask));
    }
    rows.push(row);
    const worst = Math.max(...VIEWPORTS.map((v) => row.at[v.width].pct));
    console.log(`  ${p.slug.padEnd(45)} ${VIEWPORTS.map((v) => `${v.width}:${row.at[v.width].pct.toFixed(3)}%`).join('  ')}  ${worst <= TOLERANCE_PCT ? 'pass' : 'FAIL'}`);
  }

  // ================= part 2: content ====================================================
  console.log('\n=== Phase 4, part 2: the content pass ===\n');
  const content = [];
  for (const p of manifest.pages) {
    await page.setViewportSize(VIEWPORTS[2]);
    await page.goto(`${base}${p.path}`, { waitUntil: 'load', timeout: 120000 });
    await settle(page);
    const html = await page.content();
    const r = await page.evaluate(({ nap, forbidden }) => {
      const text = (el) => (el?.textContent ?? '').replace(/\s+/g, ' ').trim();
      const h1s = [...document.querySelectorAll('h1')];
      const footer = document.querySelector('footer[data-screen-label="Footer"]');
      const footerText = text(footer);
      const imgs = [...document.querySelectorAll('img')];
      const remote = [...document.querySelectorAll('*')].flatMap((el) => {
        const out = [];
        for (const a of el.attributes ?? []) {
          if (a.value.includes('senortequilas.com')) out.push(`${el.tagName.toLowerCase()}[${a.name}] ${a.value.slice(0, 96)}`);
        }
        return out;
      });
      const body = document.body.textContent ?? '';
      return {
        h1Count: h1s.length,
        h1: text(h1s[0]),
        napMissing: nap.filter((n) => !footerText.includes(n)),
        hasFooter: !!footer,
        imgs: imgs.length,
        imgsNoAlt: imgs.filter((i) => !(i.getAttribute('alt') ?? '').trim()).map((i) => (i.currentSrc || i.src).split('/').pop()),
        remote: [...new Set(remote)],
        forbiddenHits: forbidden.filter((f) => body.includes(f)),
        // an events booking CTA: a real form, or a control that points at one
        hasInquiryForm: !!document.querySelector('section[data-screen-label="Inquiry form"] form'),
        inquiryAnchors: [...document.querySelectorAll('a[href="#inquire"], a[href*="#inquire"]')].map((a) => text(a)).filter(Boolean),
        sectionLabels: [...document.querySelectorAll('[data-screen-label]')].map((e) => e.getAttribute('data-screen-label')),
        // a proof strip: a star glyph or a review count near each other
        proof: (() => {
          // textContent runs adjacent elements together, so "★★★★★" and "4.6" arrive with no
          // separator and a review count can end up glued to its neighbour. Replacing tags
          // with a space reproduces how the strip actually reads.
          const flat = document.body.innerHTML.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
          const rating = (flat.match(/\b[45]\.\d\b/) || [])[0] ?? null;
          const reviews = (flat.match(/\b[\d][\d,\.]*\s*\+?\s*(?:Google\s+)?[Rr]eviews?\b/) || [])[0] ?? null;
          const stars = (document.body.innerHTML.match(/[★⭐]/g) || []).length;
          return (rating && reviews) ? { rating, reviews, stars } : null;
        })(),
        // The footer CTA block is display:none below a breakpoint on the 19-page footer.
        footerCtaHidden: (() => {
          const a = document.querySelector('footer a[href*="order.toasttab.com"]');
          if (!a) return 'no Toast CTA in the footer';
          const b = a.getBoundingClientRect();
          if (b.width > 0 && b.height > 0) return null;
          for (let e = a; e && e.tagName !== 'BODY'; e = e.parentElement) {
            if (getComputedStyle(e).display === 'none') return `hidden by ${e.tagName.toLowerCase()}[data-dc-tpl=${e.getAttribute('data-dc-tpl')}] display:none`;
          }
          return 'zero size, cause unclear';
        })(),
      };
    }, { nap: NAP, forbidden: FORBIDDEN });

    // em dashes in the rendered HTML
    const emDashes = (html.match(/—/g) || []).length;

    // Order Online visible without scrolling at 390x844
    await page.setViewportSize(VIEWPORTS[0]);
    await page.goto(`${base}${p.path}`, { waitUntil: 'load', timeout: 120000 });
    await settle(page);
    await resetScroll(page);
    const mobileState = await page.evaluate(() => {
      const a = document.querySelector('footer a[href*="order.toasttab.com"]');
      if (!a) return { footerCtaHidden: 'no Toast CTA in the footer' };
      const b = a.getBoundingClientRect();
      if (b.width > 0 && b.height > 0) return { footerCtaHidden: null };
      for (let e = a; e && e.tagName !== 'BODY'; e = e.parentElement) {
        if (getComputedStyle(e).display === 'none') return { footerCtaHidden: `hidden by an ancestor set to display:none` };
      }
      return { footerCtaHidden: 'zero size, cause unclear' };
    });
    const order = await page.evaluate(() => {
      const cands = [...document.querySelectorAll('a[href*="order.toasttab.com"]')];
      const vh = window.innerHeight, vw = window.innerWidth;
      for (const a of cands) {
        if (a.closest('#mobile-menu')) continue;           // the panel is closed
        const b = a.getBoundingClientRect();
        const visible = b.top >= 0 && b.bottom <= vh && b.left >= 0 && b.right <= vw && b.width > 0 && b.height > 0;
        if (visible) return { found: true, label: (a.textContent || '').trim().slice(0, 24), box: `${Math.round(b.width)}x${Math.round(b.height)} at y=${Math.round(b.top)}` };
      }
      return {
        found: false,
        candidates: cands.length,
        where: cands.map((a) => {
          const b = a.getBoundingClientRect();
          const region = a.closest('#mobile-menu') ? 'mobile menu panel' : a.closest('footer') ? 'footer' : a.closest('header') ? 'header' : 'body';
          return `${region} at y=${Math.round(b.top + window.scrollY)}`;
        }),
      };
    });

    // no horizontal scroll
    const scroll = {};
    for (const w of NO_SCROLL_AT) {
      await page.setViewportSize({ width: w, height: 900 });
      await page.goto(`${base}${p.path}`, { waitUntil: 'load', timeout: 120000 });
      await settle(page);
      await resetScroll(page);
      scroll[w] = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    }

    content.push({ slug: p.slug, path: p.path, expectedH1: p.h1, emDashes, order, scroll, ...r, ...mobileState });
  }

  // ---- report ---------------------------------------------------------------------------
  const fails = [];
  const say = (label, bad, detail) => {
    console.log(`  ${bad.length === 0 ? 'PASS' : 'FAIL'}  ${label}${bad.length ? `: ${bad.length}` : ''}`);
    for (const b of bad.slice(0, 12)) console.log(`          ${b}`);
    if (bad.length) fails.push(label);
    if (detail) console.log(`          ${detail}`);
  };

  console.log('-- 1. NAP in the footer, all 20 pages --');
  say('pages whose footer is missing a NAP line', content.filter((c) => c.napMissing.length).map((c) => `${c.path}: missing ${c.napMissing.join(', ')}`));
  say('pages with no footer at all', content.filter((c) => !c.hasFooter).map((c) => c.path));

  console.log('\n-- 2. H1 --');
  say('pages without exactly one H1', content.filter((c) => c.h1Count !== 1).map((c) => `${c.path}: ${c.h1Count}`));
  say('H1 not matching the table', content.filter((c) => c.h1 !== c.expectedH1).map((c) => `${c.path}: ${JSON.stringify(c.h1)} vs ${JSON.stringify(c.expectedH1)}`));
  // PASTE-NOW-h1-override.md: "Only two pages on this site are allowed to carry a city
  // inside the H1: /happy-hour and /mexican-restaurant-gaithersburg-md." The city is
  // Germantown on one and Gaithersburg on the other, so testing the literal word
  // "Germantown" would mark the Gaithersburg page as a miss when it is correct.
  const ALLOWED_CITY_H1 = ['/happy-hour', '/mexican-restaurant-gaithersburg-md'];
  const CITIES = /\b(Germantown|Gaithersburg|Rockville|Clarksburg|Frederick|Urbana|Maryland)\b/;
  const withCity = content.filter((c) => CITIES.test(c.h1));
  const unexpected = withCity.filter((c) => !ALLOWED_CITY_H1.includes(c.path));
  const missing = ALLOWED_CITY_H1.filter((pth) => !withCity.some((c) => c.path === pth));
  console.log(`  ${unexpected.length === 0 && missing.length === 0 ? 'PASS' : 'FAIL'}  a city inside an H1 on exactly the two permitted pages`);
  for (const c of withCity) console.log(`          ${c.path}: ${JSON.stringify(c.h1)}`);
  if (unexpected.length) { console.log(`          NOT PERMITTED: ${unexpected.map((c) => c.path).join(', ')}`); fails.push('city in H1 on a page that may not have one'); }
  if (missing.length) { console.log(`          permitted but carries no city: ${missing.join(', ')}`); fails.push('permitted city H1 missing'); }

  console.log('\n-- 3. copy --');
  say('pages containing an em dash', content.filter((c) => c.emDashes).map((c) => `${c.path}: ${c.emDashes}`));
  say('forbidden strings', content.filter((c) => c.forbiddenHits.length).map((c) => `${c.path}: ${c.forbiddenHits.join(', ')}`));

  console.log('\n-- 4. images --');
  say('images with an empty alt', content.filter((c) => c.imgsNoAlt.length).map((c) => `${c.path}: ${c.imgsNoAlt.length} (${c.imgsNoAlt.slice(0, 3).join(', ')})`));

  console.log('\n-- 5. layout --');
  say('horizontal scroll', content.flatMap((c) => Object.entries(c.scroll).filter(([, v]) => v > 0).map(([w, v]) => `${c.path} @${w}: +${v}px`)));
  say('Order Online not visible without scrolling at 390x844', content.filter((c) => !c.order.found).map((c) => `${c.path}: ${c.order.candidates} Toast ordering link(s), at ${c.order.where.join('; ')}`));

  console.log('\n-- 6. inventory: events booking CTA on the events and catering pages --');
  for (const path_ of EVENTS_PAGES) {
    const c = content.find((x) => x.path === path_);
    const anchors = c.inquiryAnchors.length ? `anchors to it: ${[...new Set(c.inquiryAnchors)].join(', ')}` : 'no #inquire anchor';
    console.log(`  ${c.hasInquiryForm ? 'HAS  ' : 'NONE '} ${path_.padEnd(46)} ${c.hasInquiryForm ? 'inquiry form section with a real form' : 'no inquiry form section'}; ${anchors}`);
  }

  console.log('\n-- 7. inventory: proof strip, stars plus a review count --');
  const withProof = content.filter((c) => c.proof);
  console.log(`  ${withProof.length} of 20 pages carry one:`);
  for (const c of withProof) console.log(`    ${c.path.padEnd(46)} rating ${c.proof.rating}, "${c.proof.reviews}", ${c.proof.stars} star glyphs`);
  console.log(`  the other ${20 - withProof.length} carry none: ${content.filter((c) => !c.proof).map((c) => c.path).join(', ')}`);

  console.log('\n-- 7b. inventory: the footer Order Online CTA at 390 --');
  {
    const hidden = content.filter((c) => c.footerCtaHidden);
    console.log(`  ${hidden.length} of 20 pages hide the footer's Toast CTA at 390:`);
    const byReason = new Map();
    for (const c of hidden) {
      if (!byReason.has(c.footerCtaHidden)) byReason.set(c.footerCtaHidden, []);
      byReason.get(c.footerCtaHidden).push(c.path);
    }
    for (const [reason, pages] of byReason) console.log(`    ${pages.length} page(s): ${reason}`);
    if (hidden.length) console.log(`    ${hidden.map((c) => c.path).join(', ')}`);
  }

  console.log('\n-- 8. inventory: every remaining senortequilas.com URL --');
  const remoteTotal = content.reduce((n, c) => n + c.remote.length, 0);
  console.log(`  ${remoteTotal} distinct reference(s) across ${content.filter((c) => c.remote.length).length} page(s):`);
  for (const c of content.filter((x) => x.remote.length)) {
    console.log(`    ${c.path}`);
    for (const r of c.remote) console.log(`       ${r}`);
  }

  // ---- verdict ---------------------------------------------------------------------------
  const visualFails = rows.filter((r) => VIEWPORTS.some((v) => r.at[v.width].pct > TOLERANCE_PCT));
  console.log('\n=== the 20 x 3 table ===\n');
  console.log('| page | 390 | 768 | 1440 | verdict |');
  console.log('|---|---|---|---|---|');
  for (const r of rows) {
    const worst = Math.max(...VIEWPORTS.map((v) => r.at[v.width].pct));
    console.log(`| ${r.path} | ${r.at[390].pct.toFixed(3)}% | ${r.at[768].pct.toFixed(3)}% | ${r.at[1440].pct.toFixed(3)}% | ${worst <= TOLERANCE_PCT ? 'pass' : 'FAIL'} |`);
  }
  const sizeIssues = rows.flatMap((r) => VIEWPORTS.filter((v) => !r.at[v.width].sizeMatch).map((v) => `${r.path} @${v.width}: ref ${r.at[v.width].ref} built ${r.at[v.width].built}`));
  console.log(`\nvisual: ${rows.length - visualFails.length}/${rows.length} pages within ${TOLERANCE_PCT}% at all three widths.`);
  if (sizeIssues.length) { console.log('dimension mismatches:'); for (const s of sizeIssues) console.log(`  ${s}`); }
  if (visualFails.length) for (const f of visualFails) console.log(`  FAIL ${f.path}`);
  console.log(`content: ${fails.length === 0 ? 'all checks pass' : `${fails.length} check(s) failed: ${fails.join('; ')}`}`);

  await writeFile(path.join(DIFFS, 'report.json'), JSON.stringify({ tolerancePct: TOLERANCE_PCT, rows, content }, null, 2));
  await browser.close();
  server.close();
  process.exitCode = visualFails.length === 0 && fails.length === 0 ? 0 : 1;
}

main().catch((e) => { console.error(e); process.exit(1); });
