/**
 * Shared render harness.
 *
 * Phase 2 generates the reference set with this and Phase 4 verifies the built site with
 * it, so both sides of the Phase 4 comparison are prepared by identical code. Any drift
 * between the two would show up as a false failure, so this file is the single definition
 * of "a page, ready to be photographed".
 */

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

/** The three widths the design was drawn against. Heights are the reference device sizes. */
export const VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
];

/** Scrollbars must never eat layout width, or `vw` and the media queries disagree. */
export const LAUNCH_ARGS = ['--hide-scrollbars'];

export const TOLERANCE_PCT = 0.5;
export const AA_RADIUS = 2;
export const AA_COLOR_TOL = 32;

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.avif': 'image/avif',
  '.woff2': 'font/woff2',
};

/** Static file server. Pages are served over http so blob and asset URLs behave normally. */
export function serve(dir) {
  return new Promise((resolve) => {
    const server = createServer(async (req, res) => {
      const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/+/, '');
      const file = path.join(dir, rel);
      if (!file.startsWith(dir)) { res.statusCode = 403; return res.end(); }
      try {
        const buf = await readFile(file);
        res.setHeader('Content-Type', CONTENT_TYPES[path.extname(file).toLowerCase()] ?? 'application/octet-stream');
        res.end(buf);
      } catch {
        res.statusCode = 404;
        res.end('not found');
      }
    });
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
  });
}

/**
 * Fonts resolved, lazy images forced, every image both loaded and decoded.
 * `complete` only means the bytes arrived. A beyond-viewport capture will paint an
 * undecoded image as an empty box, so decode() is the part that actually matters.
 */
export async function settle(page) {
  await page.evaluate(async () => {
    for (const img of document.querySelectorAll('img[loading="lazy"]')) img.loading = 'eager';
    await Promise.all(
      [...document.images].map(async (img) => {
        try {
          if (!img.complete) await new Promise((r) => { img.onload = img.onerror = r; });
          await img.decode();
        } catch { /* a broken image is the design's business, not the harness's */ }
      })
    );
    await document.fonts.ready;
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    return true;
  });
  await page.waitForTimeout(400);
}

/** Nested overflow containers must start from the same offset every run. */
export async function resetScroll(page) {
  return page.evaluate(() => {
    let n = 0;
    for (const el of document.querySelectorAll('*')) {
      if (el.scrollLeft !== 0 || el.scrollTop !== 0) { el.scrollLeft = 0; el.scrollTop = 0; n++; }
    }
    window.scrollTo(0, 0);
    return n;
  });
}

/** Load a URL at a viewport and photograph the whole document. */
export async function capture(page, url, viewport) {
  await page.setViewportSize(viewport);
  await page.goto(url, { waitUntil: 'load', timeout: 120000 });
  await settle(page);
  await resetScroll(page);
  await page.waitForTimeout(150);
  const metrics = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    height: document.documentElement.scrollHeight,
    fonts: document.fonts.status,
  }));
  return { buffer: await page.screenshot({ type: 'png', fullPage: true }), metrics };
}

/** Copy png onto a w x h canvas, optionally cropping its width first. */
const fit = (png, w, h, srcW) => {
  const out = new PNG({ width: w, height: h });
  out.data.fill(0);
  PNG.bitblt(png, out, 0, 0, Math.min(srcW, png.width, w), Math.min(png.height, h), 0, 0);
  return out;
};

/**
 * pixelmatch flags raw differences; a flagged pixel is then forgiven if its colour exists
 * within AA_RADIUS in the other image, which is what edge anti-aliasing and a sub-pixel
 * text shift look like. A moved block, a missing image or a wrong colour has no such
 * neighbour and survives.
 */
export function compare(aPng, bPng, { cropWidth = null } = {}) {
  const aW = cropWidth ? Math.min(aPng.width, cropWidth) : aPng.width;
  const bW = cropWidth ? Math.min(bPng.width, cropWidth) : bPng.width;
  const w = Math.max(aW, bW);
  const h = Math.max(aPng.height, bPng.height);
  const A = fit(aPng, w, h, aW);
  const B = fit(bPng, w, h, bW);
  // Where only one image has pixels, there is nothing to compare against and nothing to
  // forgive. Counting those directly matters because the forgiveness pass below reads RGB
  // without alpha, so transparent padding would otherwise read as black and be waved
  // through against a dark design.
  const overlapW = Math.min(aW, bW);
  const overlapH = Math.min(aPng.height, bPng.height);
  const mask = new PNG({ width: w, height: h });
  const rawDiff = pixelmatch(A.data, B.data, mask.data, w, h, { threshold: 0.1, includeAA: false, diffMask: true });

  const at = (data, x, y) => { const i = (y * w + x) << 2; return [data[i], data[i + 1], data[i + 2]]; };
  const close = (p, q) =>
    Math.abs(p[0] - q[0]) <= AA_COLOR_TOL &&
    Math.abs(p[1] - q[1]) <= AA_COLOR_TOL &&
    Math.abs(p[2] - q[2]) <= AA_COLOR_TOL;

  let real = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) << 2;
      if (x >= overlapW || y >= overlapH) {
        real++;
        mask.data[i] = 255; mask.data[i + 1] = 0; mask.data[i + 2] = 255; mask.data[i + 3] = 255;
        continue;
      }
      if (mask.data[i + 3] === 0) continue;
      const a = at(A.data, x, y);
      const b = at(B.data, x, y);
      let forgiven = false;
      for (let dy = -AA_RADIUS; dy <= AA_RADIUS && !forgiven; dy++) {
        for (let dx = -AA_RADIUS; dx <= AA_RADIUS && !forgiven; dx++) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          if (close(a, at(B.data, nx, ny)) && close(b, at(A.data, nx, ny))) forgiven = true;
        }
      }
      if (forgiven) {
        mask.data[i] = 0; mask.data[i + 1] = 200; mask.data[i + 2] = 255; mask.data[i + 3] = 90;
      } else {
        real++;
        mask.data[i] = 255; mask.data[i + 1] = 0; mask.data[i + 2] = 0; mask.data[i + 3] = 255;
      }
    }
  }
  return {
    w, h, rawDiff, real,
    pct: (real / (w * h)) * 100,
    mask,
    sizeMatch: aPng.width === bPng.width && aPng.height === bPng.height,
    overlapW, overlapH,
    outsideOverlap: (w * h) - (overlapW * overlapH),
  };
}
