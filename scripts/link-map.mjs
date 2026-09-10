#!/usr/bin/env node
/**
 * Build design/LINK-MAP.json: every link whose destination changes, as data.
 *
 * design/pages/ is the Gate-A-verified record of what the design is and is never edited.
 * This map is part of the overlay that carries our deliberate deviations, and it is applied
 * in Phase 3 when markup moves into src/pages/. Rewriting an href changes no pixels, so
 * nothing here invalidates the reference set.
 *
 * Re-runnable: after a future Claude Design export, re-extract and re-run this to re-apply
 * the same decisions instead of rediscovering them.
 *
 * Usage: node scripts/link-map.mjs
 */

import { chromium } from 'playwright';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve, LAUNCH_ARGS } from './lib/render.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PAGES = path.join(ROOT, 'design', 'pages');

const PLACE_ID = 'ChIJfQWUP2wstokR0hf-aq2yO5Y';
const GOOGLE_LISTING = `https://www.google.com/maps/place/?q=place_id:${PLACE_ID}`;
const GOOGLE_WRITE_REVIEW = `https://search.google.com/local/writereview?placeid=${PLACE_ID}`;
const YELP = 'https://www.yelp.com/biz/senor-tequilas-germantown-2';

/** Header and footer nav labels. The nav is identical on 19 pages; the homepage differs. */
const NAV = {
  'Menu': ['/menu', 'mechanical', 'path table'],
  'Takeout': ['/takeout-delivery', 'mechanical', 'path table'],
  'Private Events': ['/private-parties', 'mechanical', 'path table'],
  'Our Story': ['/our-story', 'mechanical', 'path table'],
  'Happy Hour': ['/happy-hour', 'mechanical', 'path table'],
  'Tonight': ['/taco-tuesday', 'proposed', 'no /tonight page exists; /taco-tuesday owns the seven-night calendar. Eyebrow says "Thursday", destination is the weekly specials page. Flagged for the client.'],
};

/** Cross-page anchors, resolved from the migration kit's internal linking rules. */
const CROSS_PAGE_ANCHOR = {
  '#menu': ['/menu', 'mechanical', 'migration kit: every dish page links back to /menu/'],
  '#takeout': ['/takeout-delivery', 'mechanical', 'migration kit: every dish page links back to /takeout-delivery/'],
  '#events-hub': ['/private-parties', 'mechanical', 'migration kit: private events hub cross-links'],
  '#quinceaneras': ['/private-parties/quinceaneras-celebrations', 'mechanical', 'migration kit: hub links both child pages'],
  '#weddings': ['/private-parties/weddings-receptions', 'mechanical', 'migration kit: hub links both child pages'],
  '#catering': ['/catering', 'mechanical', 'migration kit: hub cross-links /catering/'],
  '#events': ['/private-parties', 'mechanical', 'path table'],
  '#happy': ['/happy-hour', 'mechanical', 'path table'],
  '#story': ['/our-story', 'mechanical', 'path table'],
  '#tonight': ['/taco-tuesday', 'proposed', 'same call as the Tonight nav item'],
};

/** Body CTAs, keyed by the start of the link text. Order matters: first match wins. */
const BODY = [
  // unambiguous, the label names a page
  ['See the full menu',        '/menu', 'mechanical', 'label names the page'],
  ['See the Full Menu',        '/menu', 'mechanical', 'label names the page'],
  ['Full menu →',              '/menu', 'mechanical', 'label names the page'],
  ['See the Menu',             '/menu', 'mechanical', 'label names the page'],
  ['Takeout and delivery',     '/takeout-delivery', 'mechanical', 'label names the page'],
  ['Catering Menu →',          '/catering', 'mechanical', 'label names the page'],
  ['Plan a Private Event',     '/private-parties', 'mechanical', 'label names the page'],
  ['See private events',       '/private-parties', 'mechanical', 'label names the page'],
  ['Our Story →',              '/our-story', 'mechanical', 'label names the page'],
  ['Happy Hour Details →',     '/happy-hour', 'mechanical', 'label names the page'],
  ['Happy Hour Menu →',        '/happy-hour', 'mechanical', 'label names the page'],
  ['Happy hour · Monday through Friday', '/happy-hour', 'mechanical', 'label names the page'],
  ['Mexican food near Gaithersburg', '/mexican-restaurant-gaithersburg-md', 'mechanical', 'label names the page'],
  ['Write a review',           GOOGLE_WRITE_REVIEW, 'mechanical', 'sits beside the Google review count, so it is the write-review action'],

  // "Also try" dish cards: eyebrow + dish name
  ['Handmade tortillasStreet Tacos', '/street-tacos', 'mechanical', 'Also try card names the dish page'],
  ['Made in houseLa Dulcería', '/la-dulceria', 'mechanical', 'Also try card names the dish page'],
  ['Six-hour braiseBirria',    '/birria-tacos', 'mechanical', 'Also try card names the dish page'],
  ['Dipped and griddledQuesabirria Tacos', '/quesabirria-tacos', 'mechanical', 'Also try card names the dish page'],
  ['The bowlBirria de Res',    '/birria-tacos', 'mechanical', 'Also try card names the dish page'],
  ['Every TuesdayTaco Tuesday', '/taco-tuesday', 'mechanical', 'Also try card names the page'],
  ['Still sizzlingFajitas & Molcajetes', '/fajitas-molcajetes', 'mechanical', 'Also try card names the dish page'],

  // "Why the drive" cards on the Gaithersburg page
  ['The New Bar',              '/tequila-bar', 'mechanical', 'card names the bar page'],
  ['Taco Tuesday',             '/taco-tuesday', 'mechanical', 'card names the page'],
  ['Private Events',           '/private-parties', 'mechanical', 'card names the page'],
  ['Six-Hour Birria',          '/birria-tacos', 'proposed', 'card text mentions both birria and quesabirria; leads with Birria'],

  // genuinely ambiguous
  ['See the Bar →',            '/tequila-bar', 'proposed', 'sits in the "Pair it" section next to a cocktail. Could be /tequila-bar or /margaritas.'],

  // happy hour weekly rhythm: five day cards, only two name a page that exists
  ['Mon2-for-1 margaritas',    '/margaritas', 'mechanical', 'names the margaritas offer'],
  ['ThuKaraoke with DJ Willy', '/karaoke', 'mechanical', 'names the karaoke page'],
  ['TueFree bingo',            '/taco-tuesday', 'proposed', 'no bingo page; /taco-tuesday owns the weekly calendar'],
  ['WedFree lotería',          '/taco-tuesday', 'proposed', 'no lotería page; /taco-tuesday owns the weekly calendar'],
  ['FriLive DJ',               '/taco-tuesday', 'proposed', 'no live-DJ page; /taco-tuesday owns the weekly calendar'],

  // homepage Tonight carousel: day posters plus the lineup link
  ['Full lineup →',            '/taco-tuesday', 'proposed', 'carousel lineup link; /taco-tuesday owns the seven-night calendar'],
  ['Tonight Poster',           '/taco-tuesday', 'proposed', 'day poster in the Tonight carousel'],
  ['Poster ·',                 '/taco-tuesday', 'proposed', 'day poster in the Tonight carousel'],
  ['Private eventsFour Private Rooms', '/private-parties', 'mechanical', 'card names the page'],

  // third-party delivery, no URL anywhere in the design or the brief
  ['DoorDash',                 null, 'unresolved', 'no DoorDash storefront URL in the design or the brief'],
  ['Uber Eats',                null, 'unresolved', 'no Uber Eats storefront URL in the design or the brief'],
  ['Grubhub',                  null, 'unresolved', 'no Grubhub storefront URL in the design or the brief'],
];

const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();

async function main() {
  const manifest = JSON.parse(await readFile(path.join(PAGES, 'manifest.json'), 'utf8'));

  // Collect the inventory here rather than from a side file, so one command reproduces the
  // whole map after a future export. A browser is needed because region matters: the same
  // label means different things in a nav, a footer profile row and a body card.
  const { server, port } = await serve(ROOT);
  const browser = await chromium.launch({ headless: true, args: LAUNCH_ARGS });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const links = [];
  for (const p of manifest.pages) {
    await page.goto(`http://127.0.0.1:${port}/design/pages/${p.slug}.html`, { waitUntil: 'load', timeout: 120000 });
    const found = await page.evaluate(() => {
      const c = (s) => (s || '').replace(/\s+/g, ' ').trim();
      return [...document.querySelectorAll('a[href]')].map((a) => {
        const sec = a.closest('section,header,footer');
        return {
          href: a.getAttribute('href'),
          label: c(a.textContent),
          section: sec ? (sec.getAttribute('data-screen-label') || sec.tagName.toLowerCase()) : '',
          inHeader: !!a.closest('header'),
          inFooter: !!a.closest('footer'),
          inNav: !!a.closest('nav'),
        };
      });
    });
    for (const f of found) links.push({ slug: p.slug, path: p.path, ...f });
  }
  await browser.close();
  server.close();
  console.log(`Inventoried ${links.length} links across ${manifest.pages.length} pages.`);

  const idsByPage = new Map();
  for (const p of manifest.pages) {
    const html = await readFile(path.join(PAGES, `${p.slug}.html`), 'utf8');
    idsByPage.set(p.slug, new Set([...html.matchAll(/id="([^"]+)"/g)].map((m) => m[1])));
  }

  const rows = [];
  const unchanged = [];

  for (const l of links) {
    const href = l.href;
    if (!href.startsWith('#')) continue;                 // external and tel: are already correct
    const region = l.inNav ? (l.inFooter ? 'footer-nav' : 'header-nav')
      : l.inHeader ? 'header' : l.inFooter ? 'footer' : 'body';
    const label = clean(l.label);
    let to = null, confidence = null, why = null;

    if (region === 'header' && !label) {
      [to, confidence, why] = ['/', 'mechanical', 'the logo links home'];
    } else if ((region === 'header-nav' || region === 'footer-nav') && NAV[label]) {
      [to, confidence, why] = NAV[label];
    } else if (region === 'footer' && label === 'Google') {
      [to, confidence, why] = [GOOGLE_LISTING, 'mechanical', 'footer profile row beside Instagram and Facebook, so the listing, not the write-review form'];
    } else if (region === 'footer' && label === 'Yelp') {
      [to, confidence, why] = [YELP, 'mechanical', 'confirmed listing: 20021 Century Blvd, Germantown'];
    } else if (region === 'footer' && NAV[label]) {
      [to, confidence, why] = NAV[label];
    } else {
      const hit = BODY.find((b) => label.startsWith(b[0]));
      if (hit) { [, to, confidence, why] = hit; }
      else if (href !== '#' && CROSS_PAGE_ANCHOR[href] && !idsByPage.get(l.slug).has(href.slice(1))) {
        [to, confidence, why] = CROSS_PAGE_ANCHOR[href];
      }
    }

    // An anchor that resolves on its own page and has no rule stays exactly as it is.
    if (to === null && confidence !== 'unresolved') {
      const resolves = href !== '#' && idsByPage.get(l.slug).has(href.slice(1));
      unchanged.push({ ...l, region, resolves });
      continue;
    }
    rows.push({
      page: l.slug, pagePath: l.path, region,
      label: label || '(logo, no text)',
      section: l.section || '',
      from: href, to, confidence, why,
    });
  }

  const counts = rows.reduce((a, r) => ({ ...a, [r.confidence]: (a[r.confidence] ?? 0) + 1 }), {});
  await writeFile(path.join(ROOT, 'design', 'LINK-MAP.json'), JSON.stringify({
    note: 'Every link whose destination changes. design/pages/ is never edited; this is applied in Phase 3 when markup moves into src/pages/. Rewriting an href changes no pixels, so the reference set is unaffected.',
    generatedAt: new Date().toISOString(),
    googlePlaceId: PLACE_ID,
    counts: { ...counts, changed: rows.length, leftAsIs: unchanged.length },
    links: rows,
  }, null, 2));

  console.log(`LINK-MAP.json: ${rows.length} links change, ${unchanged.length} left as they are.`);
  console.log(`  mechanical ${counts.mechanical ?? 0}   proposed ${counts.proposed ?? 0}   unresolved ${counts.unresolved ?? 0}`);

  const seen = new Set();
  for (const level of ['proposed', 'unresolved']) {
    console.log(`\n=== ${level} ===`);
    for (const r of rows.filter((x) => x.confidence === level)) {
      const k = `${r.label}|${r.to}`;
      if (seen.has(k)) continue;
      seen.add(k);
      const n = rows.filter((x) => x.label === r.label && x.to === r.to).length;
      console.log(`  ${String(n).padStart(2)}x  ${r.label.slice(0, 44).padEnd(46)} ${r.from.padEnd(14)} -> ${r.to ?? '(none)'}`);
      console.log(`        ${r.why}`);
    }
  }

  const stayingAnchors = {};
  for (const u of unchanged) stayingAnchors[u.href] = (stayingAnchors[u.href] ?? 0) + 1;
  console.log('\n=== left as in-page anchors, all resolve on their own page ===');
  console.log('  ' + Object.entries(stayingAnchors).map(([h, n]) => `${h} x${n}`).join(', '));
  const broken = unchanged.filter((u) => !u.resolves);
  if (broken.length) {
    console.log(`\n!! ${broken.length} left unchanged but do NOT resolve on their page:`);
    for (const b of broken.slice(0, 10)) console.log(`   ${b.slug} ${b.href} ${clean(b.label).slice(0,40)}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
