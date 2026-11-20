// The page checks for the 16 November batch (DESIGN-DEBT.md entry 166): serves dist/ itself, then
// measures each new page at 360, 390, 768 and 1440. Usage: node scripts/check-nov16.mjs [shots-dir]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const PAGES = (process.env.PAGES || '/bar,/valentines-day,/mexican-restaurant-clarksburg-md,/catering/cost,/guides/super-bowl-germantown-md,/guides/vegetarian-mexican-food-germantown').split(',');
const WIDTHS = [360, 390, 768, 1440];
const shots = process.argv[2];
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.xml': 'text/xml', '.mp4': 'video/mp4', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let f = path.join('dist', p);
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { res.writeHead(404); res.end('404'); return; }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const base = 'http://localhost:' + server.address().port;
// the installed Chrome, headless: no Playwright browser download needed
const browser = await chromium.launch({ channel: 'chrome' });
let fails = 0;
for (const url of PAGES) {
  for (const w of WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: w < 768 ? 844 : 900 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    const resp = await page.goto(base + url, { waitUntil: 'load' });
    // walk the page so the site's scroll reveals fire, then return to the top
    await page.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 350) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 140)); } scrollTo(0, 0); });
    await page.waitForTimeout(1400);
    const r = await page.evaluate(() => {
      const vis = (el) => { const b = el.getBoundingClientRect(); const cs = getComputedStyle(el); return b.width > 0 && b.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
      const main = document.querySelector('.kt, .gd');
      const inMain = (el) => main && main.contains(el) && !el.closest('header, footer, #mobile-menu');
      const ps = [...document.querySelectorAll('p, li, dd, td, blockquote')].filter((e) => inMain(e) && vis(e) && e.childNodes.length && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()));
      const small = ps.filter((e) => parseFloat(getComputedStyle(e).fontSize) < 18 && !e.closest('.kt-crumbs, .gd-crumbs, .kt-note, .kt-office, .kt-hero-stats, .gd-meta, figcaption, .kt-route, .gd-rel'));
      const taps = [...document.querySelectorAll('a, button')].filter((e) => inMain(e) && vis(e)).filter((e) => { const b = e.getBoundingClientRect(); const cs = getComputedStyle(e); return b.height < 44 && cs.display !== 'inline'; });
      const price = [...document.querySelectorAll('.kt-answer-n')].map((e) => Math.round(e.getBoundingClientRect().bottom + scrollY))[0];
      const hero = document.querySelector('[data-screen-label*="hero" i]');
      // PAGE-TEMPLATES v1.9: the eyebrow, the H1 and the subheading never repeat a word
      const STOP = new Set('a an and the of in on at to for from with your our we you is it its by or not this that near'.split(' '));
      const words = (el) => new Set((el?.textContent || '').toLowerCase().replace(/[^a-z0-9ñáéíóú' ]+/g, ' ').split(/\s+/).map((w) => w.replace(/'s$/, '')).filter((w) => w.length > 2 && !STOP.has(w)));
      const eb = words(hero?.querySelector('.kt-eyebrow')), h1w = words(document.querySelector('h1')), sb = words(hero?.querySelector('.kt-sub'));
      const repeats = [...eb].filter((w) => h1w.has(w) || sb.has(w)).concat([...sb].filter((w) => h1w.has(w)));
      // HeroSplit: the photo as tall as the copy beside it (within 4%), once the columns sit side by side
      const ph = hero?.matches('[data-hero="split"]') && innerWidth >= 768 ? hero.querySelector('.kt-hero-photo') : null;
      const copy = ph?.previousElementSibling;
      const balance = ph ? Math.round((ph.getBoundingClientRect().height / copy.getBoundingClientRect().height) * 100) : null;
      // no photograph twice on a page
      const srcs = [...document.querySelectorAll('img')].filter((i) => inMain(i)).map((i) => i.getAttribute('src').replace(/-(800|640)\.webp$|\.(jpg|webp)$/, ''));
      const dupes = srcs.filter((x, i) => srcs.indexOf(x) !== i);
      return {
        overflow: document.documentElement.scrollWidth - innerWidth,
        h1: [...document.querySelectorAll('h1')].map((h) => h.textContent.trim()),
        title: document.title, desc: document.querySelector('meta[name=description]')?.content,
        small: small.length, smallEx: small.slice(0, 3).map((e) => `${getComputedStyle(e).fontSize} ${e.className} ${e.textContent.trim().slice(0, 40)}`),
        taps: taps.length, tapEx: taps.slice(0, 4).map((e) => `${Math.round(e.getBoundingClientRect().height)}px ${e.textContent.trim().slice(0, 30)}`),
        price, heroH: hero ? Math.round(hero.getBoundingClientRect().height) : null, height: document.documentElement.scrollHeight,
        imgsNoAlt: [...document.querySelectorAll('img')].filter((i) => inMain(i) && !i.getAttribute('alt') && i.getAttribute('aria-hidden') !== 'true' && !i.closest('[aria-hidden=true]')).length,
        repeats, balance, dupes,
        dash: main ? [...main.querySelectorAll('*')].filter((e) => !e.closest('[data-review-text], header, footer') && [...e.childNodes].some((n) => n.nodeType === 3 && /[\u2013\u2014]/.test(n.textContent))).length : -1,
      };
    });
    const bad = resp.status() !== 200 || r.overflow > 0 || r.h1.length !== 1 || r.imgsNoAlt || r.dash || r.repeats.length || r.dupes.length || (r.balance !== null && Math.abs(r.balance - 100) > 4);
    if (bad) fails++;
    console.log(`${bad ? 'FAIL' : 'ok  '} ${url} @${w} status=${resp.status()} overflow=${r.overflow} h1=${r.h1.length} hero=${r.heroH} page=${r.height} small=${r.small} taps<44=${r.taps} noAlt=${r.imgsNoAlt} dashes=${r.dash} repeats=[${r.repeats}] dupes=[${r.dupes}]${r.balance !== null ? ' photo/copy=' + r.balance + '%' : ''}${r.price ? ' price@' + r.price : ''}`);
    if (w === 390) { console.log(`     title(${r.title.length}): ${r.title}\n     desc(${(r.desc || '').length}): ${r.desc}\n     h1: ${r.h1.join(' | ')}`); if (r.smallEx.length) console.log('     small:', r.smallEx.join(' ; ')); if (r.tapEx.length) console.log('     taps:', r.tapEx.join(' ; ')); }
    if (shots && (w === 390 || w === 1440)) { fs.mkdirSync(shots, { recursive: true }); await page.screenshot({ path: path.join(shots, url.replace(/\//g, '_') + '-' + w + '.png'), fullPage: true }); }
    await ctx.close();
  }
}
await browser.close(); server.close();
process.exit(fails ? 1 : 0);
