import { chromium } from 'playwright';
const base = process.argv[2] || 'https://senor-tequilas.vercel.app';
const pages = ['/','/menu','/our-story','/takeout-delivery','/birria-tacos','/quesabirria-tacos','/street-tacos',
  '/fajitas-molcajetes','/la-dulceria','/private-parties','/private-parties/quinceaneras-celebrations',
  '/private-parties/weddings-receptions','/catering','/margaritas','/tequila-bar','/happy-hour','/late-night',
  '/karaoke','/taco-tuesday','/mexican-restaurant-gaithersburg-md','/contact','/game-day'];
const b = await chromium.launch();
const out = [];
for (const u of pages) {
  const ctx = await b.newContext({ viewport: { width: 412, height: 823 } });
  const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', { offline:false, downloadThroughput: 1.6*1024*1024/8, uploadThroughput: 750*1024/8, latency: 150 });
  try {
    await p.goto(base + u, { waitUntil: 'load', timeout: 120000 });
    await p.waitForTimeout(3500);
    const r = await p.evaluate(() => new Promise(res => {
      new PerformanceObserver(l => {
        const e = l.getEntries().pop();
        const el = e.element;
        let how = 'text';
        if (el) {
          if (el.tagName === 'IMG') how = 'img';
          else if (/url\(/.test(getComputedStyle(el).backgroundImage)) how = 'background';
        }
        res({ tag: el?.tagName || '?', how, url: e.url || '', size: e.size,
              lazy: el?.getAttribute?.('loading') || '-', fp: el?.getAttribute?.('fetchpriority') || '-',
              natural: el?.naturalWidth ? el.naturalWidth + 'x' + el.naturalHeight : '',
              box: el ? Math.round(el.getBoundingClientRect().width) + 'x' + Math.round(el.getBoundingClientRect().height) : '' });
      }).observe({ type: 'largest-contentful-paint', buffered: true });
      setTimeout(() => res(null), 2500);
    }));
    out.push([u, r]);
    const f = r ? `${r.how.padEnd(10)} ${(r.url.split('/').pop() || '(text)').padEnd(30)} box=${r.box.padEnd(9)} natural=${(r.natural||'-').padEnd(10)} lazy=${r.lazy} fp=${r.fp}` : 'no LCP entry';
    console.log(u.padEnd(44), f);
  } catch (e) { console.log(u.padEnd(44), 'ERROR', e.message.split('\n')[0]); }
  await ctx.close();
}
await b.close();
