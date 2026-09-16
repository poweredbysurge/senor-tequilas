import { chromium } from 'playwright';
import { writeFileSync } from 'fs';
const out = process.argv[2];
const pages = ['/','/menu','/our-story','/takeout-delivery','/birria-tacos','/quesabirria-tacos','/street-tacos',
  '/fajitas-molcajetes','/la-dulceria','/private-parties','/private-parties/quinceaneras-celebrations',
  '/private-parties/weddings-receptions','/catering','/margaritas','/tequila-bar','/happy-hour','/late-night',
  '/karaoke','/taco-tuesday','/mexican-restaurant-gaithersburg-md','/contact','/game-day'];
const b = await chromium.launch();
const result = {};
for (const u of pages) {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto('http://localhost:4321' + u, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(600);
  result[u] = await p.evaluate(() => {
    const rows = [], accents = [];
    const rng = document.createRange();
    document.querySelectorAll('*').forEach(el => {
      const direct = [...el.childNodes].filter(n => n.nodeType === 3 && n.textContent.trim());
      if (!direct.length) return;
      const cs = getComputedStyle(el);
      rng.selectNodeContents(el);
      const r = rng.getBoundingClientRect();
      if (!r.width) return;
      const fam = cs.fontFamily.split(',')[0].replace(/["']/g, '').trim();
      const txt = el.textContent.trim().replace(/\s+/g, ' ');
      rows.push(`${fam}|${cs.fontWeight}|${Math.round(r.width)}x${Math.round(r.height)}`);
      if (/[ñéíáúüÑÉÍÁÚ¿]/.test(txt)) accents.push(`${txt.slice(0,34)}|${fam}|${cs.fontWeight}|${r.width.toFixed(1)}`);
    });
    return { n: rows.length, rows, accents, families: [...new Set(rows.map(r => r.split('|')[0]))].sort() };
  });
  await p.close();
}
writeFileSync(out, JSON.stringify(result, null, 1));
let tot = 0, acc = 0;
for (const u of pages) { tot += result[u].n; acc += result[u].accents.length; }
console.log('captured', pages.length, 'pages,', tot, 'text elements,', acc, 'accented strings ->', out);
await b.close();
