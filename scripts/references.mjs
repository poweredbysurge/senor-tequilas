#!/usr/bin/env node
/**
 * Phase 2: generate the reference set, then cross-check the designed mobile layouts.
 *
 * Part 1 renders each extracted page at 390x844, 768x1024 and 1440x900 with the port overlay
 * applied, and saves a full-page screenshot to design/reference/<slug>-<width>.png. The
 * overlay is what the built site will carry, so the reference has to include it or Phase 4
 * would compare the built site against a page that never existed. Fonts are awaited before
 * every capture so Archivo Black and Special Elite are present, not fallbacks.
 *
 * Part 2 compares the 8 pages that have a mobile preview: the responsive page rendered at
 * 390 against the artboard the designer actually drew at 390. These are not required to
 * match pixel for pixel. A large difference means the responsive CSS does not reproduce the
 * designed mobile layout, which is a design bug worth knowing about, not an extraction bug.
 *
 * Usage:
 *   node scripts/references.mjs                render the set, then cross-check
 *   node scripts/references.mjs --check-only   cross-check against an existing set
 */

import { chromium } from 'playwright';
import { readFile, writeFile, mkdir, rm, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';
import { serve, settle, resetScroll, capture, compare, VIEWPORTS, LAUNCH_ARGS } from './lib/render.mjs';
import { applyOverlay } from './lib/overlay.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PAGES = path.join(ROOT, 'design', 'pages');
const OUT = path.join(ROOT, 'design', 'reference');
const MOBILE_OUT = path.join(ROOT, 'design', 'gate-a', 'mobile-crosscheck');

const CHECK_ONLY = process.argv.includes('--check-only');
const MANIFEST_ONLY = process.argv.includes('--manifest');
const CROSSCHECK_LIMIT_PCT = 5;
const MOBILE = VIEWPORTS[0];

const mb = (n) => `${(n / 1024 / 1024).toFixed(2)} MB`;

/**
 * The reference PNGs are 154MB and are not committed: Vercel clones this repo on every
 * deploy. This manifest pins the contract instead, so a regeneration that produces
 * different bytes is visible rather than silent. Dimensions come straight from the PNG
 * IHDR header, no decode needed.
 */
async function writeManifest() {
  const files = (await readdir(OUT)).filter((f) => f.endsWith('.png')).sort();
  const entries = [];
  for (const name of files) {
    const buf = await readFile(path.join(OUT, name));
    entries.push({
      file: name,
      bytes: buf.length,
      width: buf.readUInt32BE(16),
      height: buf.readUInt32BE(20),
      sha256: createHash('sha256').update(buf).digest('hex'),
    });
  }
  const total = entries.reduce((n, e) => n + e.bytes, 0);
  await writeFile(
    path.join(OUT, 'MANIFEST.json'),
    JSON.stringify({
      note: 'Reference captures are generated, not committed. Regenerate with: node scripts/references.mjs',
      generatedAt: new Date().toISOString(),
      viewports: VIEWPORTS,
      count: entries.length,
      totalBytes: total,
      files: entries,
    }, null, 2)
  );
  console.log(`MANIFEST.json: ${entries.length} files, ${mb(total)}, sha256 recorded for each.`);
  return entries.length;
}

async function main() {
  const { server, port } = await serve(ROOT);
  const base = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch({ headless: true, args: LAUNCH_ARGS });
  const page = await browser.newPage({ viewport: VIEWPORTS[2], deviceScaleFactor: 1 });

  if (MANIFEST_ONLY) {
    await writeManifest();
    await browser.close();
    server.close();
    return;
  }

  const manifest = JSON.parse(await readFile(path.join(PAGES, 'manifest.json'), 'utf8'));

  // ---- part 1: the reference set ------------------------------------------------------
  const refs = [];
  if (!CHECK_ONLY) {
    await rm(OUT, { recursive: true, force: true });
    await mkdir(OUT, { recursive: true });
    console.log(`Rendering ${manifest.pages.length} pages at ${VIEWPORTS.map((v) => v.width).join(', ')} ...\n`);

    let totalBytes = 0;
    for (const p of manifest.pages) {
      const sizes = [];
      for (const vp of VIEWPORTS) {
        const { buffer, metrics } = await capture(page, `${base}/design/pages/${p.slug}.html`, vp, applyOverlay);
        const file = path.join(OUT, `${p.slug}-${vp.width}.png`);
        await writeFile(file, buffer);
        totalBytes += buffer.length;
        if (metrics.fonts !== 'loaded') console.log(`  !! ${p.slug} @${vp.width}: fonts status "${metrics.fonts}"`);
        if (metrics.width > vp.width) console.log(`  !! ${p.slug} @${vp.width}: horizontal overflow, scrollWidth ${metrics.width}`);
        sizes.push({ width: vp.width, doc: `${metrics.width}x${metrics.height}`, bytes: buffer.length });
      }
      refs.push({ slug: p.slug, path: p.path, sizes });
      console.log(`  ${p.slug.padEnd(45)} ${sizes.map((s) => `${s.width}:${s.doc}`).join('  ')}`);
    }
    console.log(`\nReference set: ${refs.length * VIEWPORTS.length} images, ${mb(totalBytes)}\n`);
    await writeManifest();
  }

  // ---- part 2: designed mobile vs responsive mobile -------------------------------------
  const withMobile = manifest.pages.filter((p) => p.mobileReference);
  console.log(`=== Mobile cross-check: responsive page at ${MOBILE.width} vs the artboard drawn at ${MOBILE.width} ===\n`);
  await mkdir(MOBILE_OUT, { recursive: true });

  const rows = [];
  for (const p of withMobile) {
    const responsive = await capture(page, `${base}/design/pages/${p.slug}.html`, MOBILE, applyOverlay);
    const designed = await capture(page, `${base}/design/pages/${p.mobileReference}`, MOBILE);
    const A = PNG.sync.read(designed.buffer);
    const B = PNG.sync.read(responsive.buffer);
    // Compare inside the 390 viewport both sides share. Beyond it the responsive page has
    // pixels the artboard never had, and counting those would just restate the overflow
    // finding as a percentage instead of measuring whether the layout matches.
    const r = compare(A, B, { cropWidth: MOBILE.width });
    const overflow = B.width - MOBILE.width;
    await writeFile(path.join(MOBILE_OUT, `${p.slug}-diff.png`), PNG.sync.write(r.mask));

    // The homepage preview carries no data-force-mobile, so its artboard is driven by the
    // same media queries production will use. The other seven are forced into mobile by an
    // attribute, so a difference there can be about that mechanism rather than a real bug.
    const forced = p.slug !== 'home';
    rows.push({
      slug: p.slug,
      forced,
      designed: `${A.width}x${A.height}`,
      responsive: `${B.width}x${B.height}`,
      overflowPx: overflow,
      heightDelta: B.height - A.height,
      pct: r.pct,
      over: r.pct > CROSSCHECK_LIMIT_PCT,
    });
    console.log(`  ${p.slug.padEnd(22)} ${forced ? 'forced ' : 'natural'}  designed ${String(A.height).padStart(5)}px  responsive ${String(B.height).padStart(5)}px  overflow +${String(overflow).padStart(3)}px  diff ${r.pct.toFixed(2).padStart(6)}%`);
  }

  const natural = rows.filter((r) => !r.forced);
  const forced = rows.filter((r) => r.forced);

  const table = (list) => {
    console.log('| page | designed artboard | responsive page | overflow past 390 | height delta | diff inside 390 |');
    console.log('|---|---|---|---|---|---|');
    for (const r of list) {
      console.log(`| ${r.slug} | ${r.designed} | ${r.responsive} | +${r.overflowPx}px | ${r.heightDelta >= 0 ? '+' : ''}${r.heightDelta}px | ${r.pct.toFixed(2)}% |`);
    }
  };
  console.log('\n--- apples to apples: no data-force-mobile, media queries only ---');
  table(natural);
  console.log('\n--- forced mobile previews: a difference may be about the force-mobile mechanism ---');
  table(forced);

  const over = rows.filter((r) => r.over);
  console.log(`\n${over.length} page(s) above ${CROSSCHECK_LIMIT_PCT}%.`);
  for (const r of over) console.log(`  ${r.slug}: ${r.pct.toFixed(2)}% (${r.forced ? 'forced preview' : 'natural, media queries only'})`);

  await writeFile(path.join(MOBILE_OUT, 'report.json'), JSON.stringify({ limitPct: CROSSCHECK_LIMIT_PCT, viewport: MOBILE, rows }, null, 2));
  await browser.close();
  server.close();
}

main().catch((err) => { console.error(err); process.exit(1); });
