import lighthouse from 'lighthouse';
import { launch } from 'chrome-launcher';
const url = process.argv[2];
const chrome = await launch({ chromeFlags: ['--headless=new', '--no-sandbox'] });
const r = await lighthouse(url, { port: chrome.port, output: 'json', logLevel: 'error',
  onlyCategories: ['performance'], formFactor: 'mobile', screenEmulation: { mobile: true, width: 412, height: 823, deviceScaleFactor: 1.75, disabled: false } });
const a = r.lhr.audits;
const kb = n => (n/1024).toFixed(0) + 'KB';
console.log(`score=${Math.round(r.lhr.categories.performance.score*100)} FCP=${a['first-contentful-paint'].displayValue} LCP=${a['largest-contentful-paint'].displayValue} TBT=${a['total-blocking-time'].displayValue} SI=${a['speed-index'].displayValue}`);
console.log('total bytes=', kb(a['total-byte-weight'].numericValue));
for (const id of ['render-blocking-resources', 'render-blocking-insight']) {
  const rb = a[id];
  if (!rb) continue;
  const items = rb.details?.items || [];
  console.log(id + ': saving=' + (rb.details?.overallSavingsMs ?? rb.metricSavings?.FCP ?? 0) + 'ms, blocking=' +
    (items.map(i => (i.url || '').replace(/^https?:\/\/[^/]+/,'') + ' ' + kb(i.totalBytes || 0)).join(', ') || 'NONE'));
}
const items = (a['network-requests'].details?.items || []).filter(i => /home-hero|\.css|\.png|\.jpg|\.webm|\.mp4/.test(i.url));
console.log('\nheaviest requests:');
items.sort((x,y)=>(y.transferSize||0)-(x.transferSize||0)).slice(0,12).forEach(i =>
  console.log('  ' + kb(i.transferSize||0).padStart(8) + '  ' + (i.statusCode) + '  ' + i.url.replace(/^https?:\/\/[^/]+/,'')));
await chrome.kill();
