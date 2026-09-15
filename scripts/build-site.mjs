#!/usr/bin/env node
/**
 * Phase 3: assemble the production site from the design plus the overlay.
 *
 * Generated rather than hand-written, so a future export re-applies every decision instead
 * of anyone re-making them. Nothing in design/pages/ is read except as input.
 *
 *   markup      design/pages/<slug>.html, unchanged apart from hrefs
 *   hrefs       design/LINK-MAP.json, applied by document position, not by label
 *   photos      design/IMAGE-MAP.json, the 2026 food photography, same positional discipline
 *   overlay     design/overlay/, the nav rule, the panel and its toggle
 *   images      design/pages/images/ -> public/images/
 *
 * Usage: node scripts/build-site.mjs
 */

import { chromium } from 'playwright';
import { readFile, writeFile, mkdir, rm, readdir, copyFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve, LAUNCH_ARGS } from './lib/render.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');
const PUBLIC = path.join(ROOT, 'public');

/**
 * Blocks that repeat byte-identically across pages become components.
 *
 * Selected by data-screen-label, not by tag. Several pages carry a decorative <footer>
 * inside their content, "The house rule" on the dish pages, which a bare `footer` selector
 * lifts instead of the real one.
 */
const SHARED = [
  { name: 'Header', selector: 'header[data-screen-label="Header"]' },
  { name: 'Footer', selector: 'footer[data-screen-label="Footer"]' },
  { name: 'DishCrossLinks', selector: 'section[data-screen-label="Dish cross-links"]' },
];

/** Absolute image paths: Phase 3 serves every image from /images/. */
const absoluteImages = (s) => s.replace(/(["'(])images\//g, '$1/images/');

const routeFor = (urlPath) => (urlPath === '/' ? 'index' : urlPath.replace(/^\//, ''));

/**
 * Pages the port authors itself, from design/overlay/, rather than lifting from the design.
 * `/contact` because the design never drew one; `/taco-tuesday` because it was rebuilt.
 */
const AUTHORED = [
  { route: '/contact', file: 'contact.html', why: 'the design never drew one' },
  { route: '/taco-tuesday', file: 'taco-tuesday.html', why: 'rebuilt, see DESIGN-DEBT.md entry 21' },
];

async function writeAuthoredPages(seo, variants) {
  const pick = (family) => [...variants.get(family).values()].sort((a, b) => b.pages.length - a.pages.length)[0].name;
  const headerName = pick('Header');
  const footerName = pick('Footer');
  for (const page of AUTHORED) {
    const markup = absoluteImages(await readFile(path.join(ROOT, 'design', 'overlay', page.file), 'utf8'));
    const meta = seo.pages[page.route];
    if (!meta) throw new Error(`no SEO entry for ${page.route}`);
    const body = markup
      .replace('<!--COMPONENT:Header-->', `<${headerName} />`)
      .replace('<!--COMPONENT:Footer-->', `<${footerName} />`);
    const route = page.route.replace(/^\//, '');
    await writeFile(path.join(SRC, 'pages', `${route}.astro`),
      `---\nimport Base from '../layouts/Base.astro';\nimport ${headerName} from '../components/${headerName}.astro';\nimport ${footerName} from '../components/${footerName}.astro';\n---\n<Base title=${JSON.stringify(meta.title)} description=${JSON.stringify(meta.description)} canonical=${JSON.stringify(meta.canonical)} ogImage=${JSON.stringify(meta.ogImage)} route=${JSON.stringify(page.route)}>\n${body}\n</Base>\n`);
    console.log(`  ${page.route.padEnd(46)} src/pages/${route}.astro   ${headerName}, ${footerName}  (authored: ${page.why})`);
  }
}

/**
 * Rewrite only the authored pages, leaving the rest of src/ alone. This is the safe way to
 * ship a change to /contact or /taco-tuesday without regenerating, and destroying, anything
 * else under src/.
 */
async function authoredOnly() {
  const seo = JSON.parse(await readFile(path.join(ROOT, 'design', 'SEO.json'), 'utf8'));

  // The overlay's stylesheet and script live inside src/ once generated, so an edit to
  // design/overlay/ reaches nothing until they are refreshed. Without this the authored
  // pages update and every CSS or behaviour change silently does not.
  await writeFile(path.join(SRC, 'styles', 'tweaks.css'),
    await readFile(path.join(ROOT, 'design', 'overlay', 'site-tweaks.css'), 'utf8'));
  await writeFile(path.join(SRC, 'styles', 'overlay.css'),
    await readFile(path.join(ROOT, 'design', 'overlay', 'mobile-nav.css'), 'utf8'));

  // The panel is a component, so an edit to design/overlay/mobile-menu.html reaches nothing
  // until it is rewritten here too.
  const panelMarkup = absoluteImages(await readFile(path.join(ROOT, 'design', 'overlay', 'mobile-menu.html'), 'utf8'));
  await writeFile(path.join(SRC, 'components', 'MobileMenu.astro'),
    `---\n// The design's own mobile menu panel. See DESIGN-DEBT.md entries 6 and 25.\n---\n${panelMarkup}\n`);

  const basePath = path.join(SRC, 'layouts', 'Base.astro');
  let base = await readFile(basePath, 'utf8');
  for (const [file, sentinel] of [
    ['site-tweaks.js', 'port: homepage behaviour the design drew but never wired'],
    ['mobile-menu.js', 'port: mobile menu toggle'],
  ]) {
    const body = await readFile(path.join(ROOT, 'design', 'overlay', file), 'utf8');
    const indented = body.split('\n').map((l) => (l ? '      ' + l : l)).join('\n');
    // Replace only the one <script is:inline> block that carries this file's sentinel, so
    // anything else hand added to Base.astro survives.
    // Match each block on its own, by finding the sentinel first and then walking out to
    // the surrounding tags. A single regex from "<script is:inline>" would swallow the
    // earlier block too, because the first opening tag is nowhere near its own sentinel.
    const at = base.indexOf(sentinel);
    if (at === -1) throw new Error(`could not find the ${file} script block in Base.astro`);
    const open = base.lastIndexOf('<script is:inline>', at);
    const close = base.indexOf('</script>', at);
    if (open === -1 || close === -1) throw new Error(`malformed script block for ${file}`);
    base = base.slice(0, open) + `<script is:inline>\n${indented}\n    ` + base.slice(close);
  }
  await writeFile(basePath, base);
  console.log('Refreshed src/styles/tweaks.css, overlay.css and both inline scripts in Base.astro.');

  const components = await readdir(path.join(SRC, 'components'));
  const fake = new Map([
    ['Header', new Map([['h', { name: components.filter((f) => /^Header\d+\.astro$/.test(f)).sort()[4]?.replace('.astro', '') ?? 'Header5', pages: ['x'] }]])],
    ['Footer', new Map([['f', { name: 'Footer2', pages: ['x'] }]])],
  ]);
  console.log('Rewriting only the authored pages; the rest of src/ is untouched.');
  await writeAuthoredPages(seo, fake);
}

async function main() {
  if (process.argv.includes('--authored-only')) return authoredOnly();
  const manifest = JSON.parse(await readFile(path.join(ROOT, 'design', 'pages', 'manifest.json'), 'utf8'));
  const linkMap = JSON.parse(await readFile(path.join(ROOT, 'design', 'LINK-MAP.json'), 'utf8'));
  const altText = JSON.parse(await readFile(path.join(ROOT, 'design', 'ALT-TEXT.json'), 'utf8'));
  const imageMap = JSON.parse(await readFile(path.join(ROOT, 'design', 'IMAGE-MAP.json'), 'utf8'));
  const seo = JSON.parse(await readFile(path.join(ROOT, 'design', 'SEO.json'), 'utf8'));
  const byPage = new Map();
  for (const l of linkMap.links) {
    if (!byPage.has(l.page)) byPage.set(l.page, new Map());
    byPage.get(l.page).set(l.index, l);
  }

  // This wipes src/ and regenerates it from design/pages/ plus the overlay. Anything hand
  // edited under src/ is destroyed. If you have edits there, move them into design/overlay/
  // first, or run with --force to say you meant it.
  if (!process.argv.includes('--force')) {
    const { existsSync } = await import('node:fs');
    if (existsSync(SRC)) {
      console.error('src/ already exists. Regenerating destroys any hand edits in it.');
      console.error('Move edits into design/overlay/ first, then re-run with --force.');
      process.exit(1);
    }
  }
  await rm(SRC, { recursive: true, force: true });
  for (const d of ['pages', 'components', 'layouts', 'styles']) await mkdir(path.join(SRC, d), { recursive: true });
  await mkdir(path.join(PUBLIC, 'images'), { recursive: true });

  // ---- stylesheet and images -------------------------------------------------------------
  const css = await readFile(path.join(ROOT, 'design', 'pages', 'site.css'), 'utf8');
  await writeFile(path.join(SRC, 'styles', 'site.css'), absoluteImages(css));
  await writeFile(path.join(SRC, 'styles', 'overlay.css'), await readFile(path.join(ROOT, 'design', 'overlay', 'mobile-nav.css'), 'utf8'));
  await writeFile(path.join(SRC, 'styles', 'tweaks.css'), await readFile(path.join(ROOT, 'design', 'overlay', 'site-tweaks.css'), 'utf8'));

  // Only the files this build is about to write are replaced. public/images/ also holds
  // photography the client sent that the design never carried, dropped in by hand and
  // committed: the dishes/ and site/ folders, and a handful of loose files. An earlier
  // version of this script deleted public/images/ wholesale, which destroyed all of it on
  // every run. Copy over, never wipe.
  const imgs = await readdir(path.join(ROOT, 'design', 'pages', 'images'));
  for (const f of imgs) {
    await copyFile(path.join(ROOT, 'design', 'pages', 'images', f), path.join(PUBLIC, 'images', f));
  }
  console.log(`Stylesheet ${(css.length / 1048576).toFixed(2)}MB, ${imgs.length} images copied to public/images/.`);

  // ---- pull every page apart --------------------------------------------------------------
  const { server, port } = await serve(ROOT);
  const browser = await chromium.launch({ headless: true, args: LAUNCH_ARGS });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const variants = new Map();     // "Header" -> Map(hash -> {name, html, pages[]})
  const pageParts = [];
  let rewritten = 0, unresolvedLeft = 0, formsMarked = 0, altFilled = 0, mapsPlaced = 0, photosSwapped = 0;

  let dominantFooter = null;   // filled on the second page, once a majority is visible
  for (const p of manifest.pages) {
    await page.goto(`http://127.0.0.1:${port}/design/pages/${p.slug}.html`, { waitUntil: 'load', timeout: 120000 });

    const rows = [...byPage.get(p.slug).values()].map((l) => ({ index: l.index, to: l.to, from: l.from }));
    const applied = await page.evaluate(({ rows, shared, alt, photos }) => {
      const anchors = [...document.querySelectorAll('a[href]')];
      let n = 0, unresolved = 0;
      for (const r of rows) {
        const a = anchors[r.index];
        if (!a || a.getAttribute('href') !== r.from) return { error: `link ${r.index} moved: expected ${r.from}, found ${a ? a.getAttribute('href') : 'nothing'}` };
        if (r.to === null) { unresolved++; continue; }   // delivery links stay inert
        a.setAttribute('href', r.to);
        n++;
      }
      // The Find Us block drew a labelled placeholder over a bar photo. It becomes a real
      // embedded map. The keyless Google Maps embed needs no API key and no script.
      const MAP = 'https://maps.google.com/maps?q=20021%20Century%20Blvd,%20Germantown,%20MD%2020874&z=15&output=embed';
      let mapsPlaced = 0;
      const mapSlots = [...document.querySelectorAll('[data-dc-tpl="223"], [data-map-slot]')];
      for (const slot of mapSlots) {
        if (!/map:/i.test(slot.textContent || '') && !slot.hasAttribute('data-map-slot')) continue;
        for (const child of [...slot.children]) child.remove();
        const frame = document.createElement('iframe');
        frame.setAttribute('data-real-map', '');
        frame.setAttribute('src', MAP);
        frame.setAttribute('title', 'Map to Senor Tequila\'s, 20021 Century Blvd, Germantown, MD 20874');
        frame.setAttribute('loading', 'lazy');
        frame.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
        frame.setAttribute('allowfullscreen', '');
        slot.appendChild(frame);
        mapsPlaced++;
      }

      // The design ships nine photographs with alt="". Filled from design/ALT-TEXT.json,
      // keyed on the image filename so a shared image reads the same everywhere.
      let altFilled = 0;
      for (const img of document.images) {
        if ((img.getAttribute('alt') ?? '').trim()) continue;
        const file = (img.getAttribute('src') ?? '').split('/').pop();
        const entry = alt[file];
        if (!entry) continue;
        img.setAttribute('alt', entry.alt);
        altFilled++;
      }

      // The 2026 food photography, from design/IMAGE-MAP.json. Slots are counted in DOM
      // order, <img> and inline background alike, and each row carries the URL it expects
      // to find. A slot that has moved throws rather than writing the picture somewhere
      // else. Runs after the alt pass so hand-written alt text survives the swap.
      const TEXTURE = /86475be0134bfc90\.png|ecf6382a259b5884\.png|9cf29efa1cbf0c3e\.png|black bg\.png|texture-black/;
      const slots = [];
      for (const el of document.querySelectorAll('*')) {
        if (el.tagName === 'IMG') {
          const u = el.getAttribute('src') || '';
          if (u && !TEXTURE.test(u)) slots.push({ el, kind: 'img', url: u });
        }
        const bg = el.style && el.style.backgroundImage;
        if (bg && bg.includes('url(')) {
          for (const m of bg.matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
            if (!TEXTURE.test(m[1])) slots.push({ el, kind: 'bg', url: m[1] });
          }
        }
      }
      let photosSwapped = 0;
      for (const row of photos) {
        const s = slots[row.slot];
        if (!s || s.url !== row.was || s.kind !== row.kind) {
          return { error: `image slot ${row.slot} moved: expected ${row.kind} ${row.was}, found ${s ? s.kind + ' ' + s.url : 'nothing'}` };
        }
        if (row.kind === 'img') {
          s.el.setAttribute('src', row.now);
          if (row.alt) s.el.setAttribute('alt', row.alt);
        } else {
          s.el.style.backgroundImage = s.el.style.backgroundImage.split(s.url).join(row.now);
        }
        photosSwapped++;
      }

      // The design drew a working-looking inquiry form. It stays exactly as drawn; the
      // comment marks where the real Toast embed replaces it.
      let formsMarked = 0;
      for (const form of document.querySelectorAll('section[data-screen-label="Inquiry form"] form')) {
        form.parentNode.insertBefore(document.createComment(' TOAST FORM EMBED '), form);
        formsMarked++;
      }

      // Swap each shared block for a marker, then hand back the block and the page.
      const host = document.querySelector('body > div.sc-host[data-sc-name]');
      const blocks = [];
      for (const s of shared) {
        const found = host.querySelectorAll(s.selector);
        if (found.length === 0) continue;
        if (found.length > 1) return { error: `${found.length} matches for ${s.selector}, expected one` };
        const el = found[0];
        blocks.push({ name: s.name, html: el.outerHTML });
        el.replaceWith(document.createComment(`COMPONENT:${s.name}`));
      }
      return { n, unresolved, formsMarked, altFilled, mapsPlaced, photosSwapped, blocks, host: host.outerHTML };
    }, { rows, shared: SHARED, alt: altText.byImage, photos: imageMap.pages[p.slug] ?? [] });

    if (applied.error) throw new Error(`${p.slug}: ${applied.error}`);
    rewritten += applied.n;
    unresolvedLeft += applied.unresolved;
    formsMarked += applied.formsMarked;
    altFilled += applied.altFilled;
    mapsPlaced += applied.mapsPlaced;
    photosSwapped += applied.photosSwapped;

    const used = [];
    for (const b of applied.blocks) {
      // One footer on every page. The design gave the homepage its own shorter variant,
      // which left the site with two different footers; the client wants the full one
      // everywhere. Headers legitimately differ per page and are left alone.
      if (b.name === 'Footer' && dominantFooter && absoluteImages(b.html) !== dominantFooter.html) {
        variants.get('Footer').get(dominantFooter.hash).pages.push(p.slug);
        used.push(dominantFooter.variant);
        continue;
      }
      const html = absoluteImages(b.html);
      const hash = createHash('sha256').update(html).digest('hex').slice(0, 8);
      if (!variants.has(b.name)) variants.set(b.name, new Map());
      const family = variants.get(b.name);
      if (!family.has(hash)) family.set(hash, { name: `${b.name}${family.size + 1}`, html, pages: [] });
      family.get(hash).pages.push(p.slug);
      used.push(family.get(hash));
    }
    pageParts.push({ ...p, host: absoluteImages(applied.host), used });
  }
  await browser.close();
  server.close();

  // ---- components --------------------------------------------------------------------------
  console.log(`\nShared blocks lifted into components:`);
  for (const [family, map] of variants) {
    for (const v of map.values()) {
      await writeFile(
        path.join(SRC, 'components', `${v.name}.astro`),
        `---\n// ${family}, exact markup from the design. Used by ${v.pages.length} page(s): ${v.pages.join(', ')}\n// Only hrefs differ from design/pages/, per design/LINK-MAP.json.\n---\n${v.html}\n`
      );
      console.log(`  ${v.name.padEnd(18)} ${String(v.pages.length).padStart(2)} page(s)  ${(v.html.length / 1024).toFixed(1)}KB  ${v.pages.slice(0, 3).join(', ')}${v.pages.length > 3 ? ', …' : ''}`);
    }
  }

  // ---- the panel and the layout -------------------------------------------------------------
  const panel = absoluteImages(await readFile(path.join(ROOT, 'design', 'overlay', 'mobile-menu.html'), 'utf8'));
  await writeFile(path.join(SRC, 'components', 'MobileMenu.astro'),
    `---\n// The design's own mobile menu panel. See DESIGN-DEBT.md entry 6.\n---\n${panel}\n`);

  await mkdir(path.join(SRC, 'data'), { recursive: true });
  await writeFile(path.join(SRC, 'data', 'business.json'), JSON.stringify(seo.business, null, 2));

  const toggle = await readFile(path.join(ROOT, 'design', 'overlay', 'mobile-menu.js'), 'utf8');
  const tweaks = await readFile(path.join(ROOT, 'design', 'overlay', 'site-tweaks.js'), 'utf8');
  await writeFile(path.join(SRC, 'layouts', 'Base.astro'), `---
import '../styles/site.css';
import '../styles/overlay.css';
import '../styles/tweaks.css';
import MobileMenu from '../components/MobileMenu.astro';
import business from '../data/business.json';

const { title, description, canonical, ogImage, extraTypes = [], route } = Astro.props;
// The site does not own its domain yet. senortequilas.com still serves the old WordPress
// site, so every absolute URL here pointed at a host that does not have these pages: shared
// links previewed a 404 image, and the canonical sent scrapers to the old site entirely.
// Everything is rebased onto the host actually serving this build.
//
// AT LAUNCH: set LIVE to LAUNCH. That one line turns this back into canonical and preview
// URLs on the real domain, and nothing else needs touching.
const LAUNCH = "https://senortequilas.com";
const LIVE = "https://senor-tequilas.vercel.app";
const rebase = (u) => (u && u.startsWith(LAUNCH) ? LIVE + u.slice(LAUNCH.length) : u);
const site = LIVE;
const absolute = (u) => (u.startsWith('http') ? rebase(u) : site + u);
const pageUrl = rebase(canonical);

// One branded share card for every link on the site, supplied 11 September. Each page keeps
// its own ogImage for the JSON-LD image, where a photograph of the thing itself is the right
// answer, but every og:image and twitter:image is the card, so a link to any page previews
// the same way. To go back to per page hero images, use absolute(ogImage) below instead.
const shareCard = '/images/site/open-graph.jpg';

// Restaurant and LocalBusiness on every page, with EventVenue and Caterer added where the
// page sells the room or the catering rather than the table.
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': ['Restaurant', 'LocalBusiness', ...extraTypes],
  name: business.name,
  url: pageUrl,
  telephone: business.telephone,
  servesCuisine: business.servesCuisine,
  priceRange: business.priceRange,
  image: absolute(ogImage),
  address: {
    '@type': 'PostalAddress',
    streetAddress: business.streetAddress,
    addressLocality: business.addressLocality,
    addressRegion: business.addressRegion,
    postalCode: business.postalCode,
    addressCountry: business.addressCountry,
  },
  openingHoursSpecification: business.hours.map((h) => ({
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: h.days.map((d) => 'https://schema.org/' + d),
    opens: h.opens,
    closes: h.closes,
  })),
  sameAs: business.sameAs,
  acceptsReservations: business.reserveUrl,
  potentialAction: {
    '@type': 'OrderAction',
    target: { '@type': 'EntryPoint', urlTemplate: business.orderUrl, inLanguage: 'en-US' },
  },
};
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={pageUrl} />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content={business.name} />
    <meta property="og:locale" content="en_US" />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content={pageUrl} />
    <meta property="og:image" content={absolute(shareCard)} />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={title} />
    <meta name="twitter:description" content={description} />
    <meta name="twitter:image" content={absolute(shareCard)} />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <script type="application/ld+json" set:html={JSON.stringify(jsonLd)} />
  </head>
  <body data-route={route}>
    <slot />
    <MobileMenu />
    <script is:inline>
${toggle.split('\n').map((l) => (l ? '      ' + l : l)).join('\n')}
    </script>
    <script is:inline>
${tweaks.split('\n').map((l) => (l ? '      ' + l : l)).join('\n')}
    </script>
  </body>
</html>
`);

  // ---- the pages -----------------------------------------------------------------------------
  console.log(`\nRoutes:`);
  for (const p of pageParts) {
    const route = routeFor(p.path);
    const file = path.join(SRC, 'pages', `${route}.astro`);
    await mkdir(path.dirname(file), { recursive: true });

    const names = [...new Set(p.used.map((u) => u.name))];
    const depth = route.split('/').length;
    const up = '../'.repeat(depth);
    const imports = [`import Base from '${up}layouts/Base.astro';`,
      ...names.map((n) => `import ${n} from '${up}components/${n}.astro';`)].join('\n');

    let body = p.host;
    for (const u of p.used) body = body.replace(`<!--COMPONENT:${u.name.replace(/\d+$/, '')}-->`, `<${u.name} />`);

    const meta = seo.pages[p.path];
    if (!meta) throw new Error(`no SEO entry for ${p.path}`);
    const props = [
      `title=${JSON.stringify(meta.title)}`,
      `description=${JSON.stringify(meta.description)}`,
      `canonical=${JSON.stringify(meta.canonical)}`,
      `ogImage=${JSON.stringify(meta.ogImage)}`,
      `route=${JSON.stringify(p.path)}`,
      meta.extraTypes.length ? `extraTypes={${JSON.stringify(meta.extraTypes)}}` : null,
    ].filter(Boolean).join(' ');
    await writeFile(file, `---\n${imports}\n---\n<Base ${props}>\n${body}\n</Base>\n`);
    console.log(`  ${p.path.padEnd(46)} src/pages/${route}.astro   ${names.join(', ')}`);
  }

  await writeFile(path.join(ROOT, 'astro.config.mjs'), `import { defineConfig } from 'astro/config';

// Astro is a shell and a build step only. No client framework, no CSS framework.
// The markup in src/pages/ is the design's markup; components wrap it, never rewrite it.
export default defineConfig({
  site: 'https://senortequilas.com',
  build: { format: 'directory' },
});
`);

  await writeAuthoredPages(seo, variants);

  // ---- sitemap and robots -------------------------------------------------------------
  const today = new Date().toISOString().slice(0, 10);
  const sitemapPaths = [...manifest.pages.map((p) => p.path), '/contact'];
  const urls = sitemapPaths.map((pth) => `  <url>\n    <loc>${seo.pages[pth].canonical}</loc>\n    <lastmod>${today}</lastmod>\n  </url>`).join('\n');
  await writeFile(path.join(PUBLIC, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
  await writeFile(path.join(PUBLIC, 'robots.txt'),
    `User-agent: *\nAllow: /\n\n# WordPress cruft that must stay out of the index\nDisallow: /author/\nDisallow: /feed/\nDisallow: /comments/feed/\n\nSitemap: ${seo.site}/sitemap.xml\n`);

  // ---- the 301 map, as a host config file, deliberately not wired into vercel.json --------
  const REDIRECTS = [
    ['/drinks', '/margaritas'], ['/entree', '/menu'], ['/lunch', '/menu'], ['/full-menu', '/menu'],
    ['/birthdays', '/private-parties/quinceaneras-celebrations'], ['/chef', '/our-story'],
    ['/nye', '/private-parties'], ['/free-tacos', '/'], ['/happy', '/'], ['/dinner-test', '/'],
    ['/piano-evening', '/private-parties'], ['/tappas-night', '/private-parties'],
    ['/cooking-lessons-with-our-chef', '/our-story'],
    ['/dedicated-attentive-staff', '/'], ['/dedicated-attentive-staff-2', '/'], ['/dedicated-attentive-staff-3', '/'],
    ['/new-outdoor-area-2', '/'], ['/new-outdoor-area-3', '/'], ['/hello-world', '/'],
  ];
  await mkdir(path.join(ROOT, 'deploy'), { recursive: true });
  await writeFile(path.join(ROOT, 'deploy', 'redirects.json'), JSON.stringify({
    note: 'The 301 map from design/brief/seo-migration-kit-and-page-spec.md, Part 1 sections B, C and D. NOT wired into vercel.json and NOT deployed. Paste the redirects array into vercel.json when the migration is cleared to go live.',
    doNotDeployYet: true,
    keepReturning404: ['/collections/products/*', '/shop/*', '/toyu/*', '/contents/*', '/jukyuban', '/pw', '/reserve/tool', '/information/privacy_policy.html'],
    keepTheirUrl: ['/', '/our-story/', '/catering/', '/private-parties/', '/contact/', '/gift-cards/', '/cinco-de-mayo/'],
    redirects: REDIRECTS.map(([source, destination]) => ({ source, destination, permanent: true })),
  }, null, 2) + '\n');

  console.log(`\nsitemap.xml with ${sitemapPaths.length} URLs, robots.txt, and deploy/redirects.json with ${REDIRECTS.length} 301s written.`);

  console.log(`\n${rewritten} hrefs rewritten from the link map, ${unresolvedLeft} left inert (the delivery links).`);
  console.log(`${formsMarked} inquiry form(s) marked with <!-- TOAST FORM EMBED -->.`);
  console.log(`${photosSwapped} photograph(s) swapped from the image map.`);
  console.log(`${altFilled} empty alt attribute(s) filled from ALT-TEXT.json.`);
  console.log(`${mapsPlaced} map placeholder(s) replaced with a real embedded map.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
