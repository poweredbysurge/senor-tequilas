import lighthouse from 'lighthouse';
import { launch } from 'chrome-launcher';
import { writeFileSync } from 'fs';
const pages = ['/','/menu','/our-story','/takeout-delivery','/birria-tacos','/quesabirria-tacos','/street-tacos',
  '/fajitas-molcajetes','/la-dulceria','/private-parties','/private-parties/quinceaneras-celebrations',
  '/private-parties/weddings-receptions','/catering','/margaritas','/tequila-bar','/happy-hour','/late-night',
  '/karaoke','/taco-tuesday','/mexican-restaurant-gaithersburg-md','/contact','/game-day'];
const base = 'https://senor-tequilas.vercel.app';
const med = a => { const s = [...a].sort((x,y)=>x-y); return s[1]; };
const rows = [];
for (const u of pages) {
  const runs = [];
  for (let i = 0; i < 3; i++) {
    const chrome = await launch({ chromeFlags: ['--headless=new', '--no-sandbox'] });
    try {
      const r = await lighthouse(base + u, { port: chrome.port, output: 'json', logLevel: 'silent',
        onlyCategories: ['performance'], formFactor: 'mobile',
        screenEmulation: { mobile: true, width: 412, height: 823, deviceScaleFactor: 1.75, disabled: false } });
      const a = r.lhr.audits;
      runs.push({ s: Math.round(r.lhr.categories.performance.score*100),
                  f: a['first-contentful-paint'].numericValue/1000,
                  l: a['largest-contentful-paint'].numericValue/1000,
                  b: a['total-byte-weight'].numericValue/1024 });
    } catch (e) { runs.push({ s: 0, f: 0, l: 0, b: 0 }); }
    await chrome.kill();
  }
  const row = { u, s: med(runs.map(r=>r.s)), f: med(runs.map(r=>r.f)), l: med(runs.map(r=>r.l)), b: med(runs.map(r=>r.b)) };
  rows.push(row);
  console.log(`${u.padEnd(44)} score=${String(row.s).padStart(3)}  FCP=${row.f.toFixed(1)}s  LCP=${row.l.toFixed(1)}s  ${row.b.toFixed(0)}KB`);
}
writeFileSync(process.argv[2] || 'lh-all.json', JSON.stringify(rows, null, 1));
const n = rows.length;
console.log('\nsite medians: score=' + med(rows.map(r=>r.s)) + '  FCP=' + med(rows.map(r=>r.f)).toFixed(1) + 's  LCP=' + med(rows.map(r=>r.l)).toFixed(1) + 's');
console.log('worst LCP:', rows.slice().sort((a,b)=>b.l-a.l).slice(0,3).map(r=>r.u+' '+r.l.toFixed(1)+'s').join(', '));
console.log('lowest score:', rows.slice().sort((a,b)=>a.s-b.s).slice(0,3).map(r=>r.u+' '+r.s).join(', '));
