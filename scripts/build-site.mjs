#!/usr/bin/env node
/**
 * Phase 3: assemble the production site from the design plus the overlay.
 *
 * Generated rather than hand-written, so a future export re-applies every decision instead
 * of anyone re-making them. Nothing in design/pages/ is read except as input.
 *
 *   markup      design/pages/<slug>.html, unchanged apart from hrefs
 *   hrefs       design/LINK-MAP.json, applied by document position, not by label
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

async function main() {
  const manifest = JSON.parse(await readFile(path.join(ROOT, 'design', 'pages', 'manifest.json'), 'utf8'));
  const linkMap = JSON.parse(await readFile(path.join(ROOT, 'design', 'LINK-MAP.json'), 'utf8'));
  const altText = JSON.parse(await readFile(path.join(ROOT, 'design', 'ALT-TEXT.json'), 'utf8'));
  const seo = JSON.parse(await readFile(path.join(ROOT, 'design', 'SEO.json'), 'utf8'));
  const byPage = new Map();
  for (const l of linkMap.links) {
    if (!byPage.has(l.page)) byPage.set(l.page, new Map());
    byPage.get(l.page).set(l.index, l);
  }

  await rm(SRC, { recursive: true, force: true });
  await rm(path.join(PUBLIC, 'images'), { recursive: true, force: true });
  for (const d of ['pages', 'components', 'layouts', 'styles']) await mkdir(path.join(SRC, d), { recursive: true });
  await mkdir(path.join(PUBLIC, 'images'), { recursive: true });

  // ---- stylesheet and images -------------------------------------------------------------
  const css = await readFile(path.join(ROOT, 'design', 'pages', 'site.css'), 'utf8');
  await writeFile(path.join(SRC, 'styles', 'site.css'), absoluteImages(css));
  await writeFile(path.join(SRC, 'styles', 'overlay.css'), await readFile(path.join(ROOT, 'design', 'overlay', 'mobile-nav.css'), 'utf8'));

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
  let rewritten = 0, unresolvedLeft = 0, formsMarked = 0, altFilled = 0;

  for (const p of manifest.pages) {
    await page.goto(`http://127.0.0.1:${port}/design/pages/${p.slug}.html`, { waitUntil: 'load', timeout: 120000 });

    const rows = [...byPage.get(p.slug).values()].map((l) => ({ index: l.index, to: l.to, from: l.from }));
    const applied = await page.evaluate(({ rows, shared, alt }) => {
      const anchors = [...document.querySelectorAll('a[href]')];
      let n = 0, unresolved = 0;
      for (const r of rows) {
        const a = anchors[r.index];
        if (!a || a.getAttribute('href') !== r.from) return { error: `link ${r.index} moved: expected ${r.from}, found ${a ? a.getAttribute('href') : 'nothing'}` };
        if (r.to === null) { unresolved++; continue; }   // delivery links stay inert
        a.setAttribute('href', r.to);
        n++;
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
      return { n, unresolved, formsMarked, altFilled, blocks, host: host.outerHTML };
    }, { rows, shared: SHARED, alt: altText.byImage });

    if (applied.error) throw new Error(`${p.slug}: ${applied.error}`);
    rewritten += applied.n;
    unresolvedLeft += applied.unresolved;
    formsMarked += applied.formsMarked;
    altFilled += applied.altFilled;

    const used = [];
    for (const b of applied.blocks) {
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
  await writeFile(path.join(SRC, 'layouts', 'Base.astro'), `---
import '../styles/site.css';
import '../styles/overlay.css';
import MobileMenu from '../components/MobileMenu.astro';
import business from '../data/business.json';

const { title, description, canonical, ogImage, extraTypes = [], route } = Astro.props;
const site = ${JSON.stringify(seo.site)};
const absolute = (u) => (u.startsWith('http') ? u : site + u);

// Restaurant and LocalBusiness on every page, with EventVenue and Caterer added where the
// page sells the room or the catering rather than the table.
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': ['Restaurant', 'LocalBusiness', ...extraTypes],
  name: business.name,
  url: canonical,
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
    <link rel="canonical" href={canonical} />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content={business.name} />
    <meta property="og:locale" content="en_US" />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content={canonical} />
    <meta property="og:image" content={absolute(ogImage)} />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={title} />
    <meta name="twitter:description" content={description} />
    <meta name="twitter:image" content={absolute(ogImage)} />
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

  // ---- sitemap and robots -------------------------------------------------------------
  const today = new Date().toISOString().slice(0, 10);
  const urls = manifest.pages.map((p) => `  <url>\n    <loc>${seo.pages[p.path].canonical}</loc>\n    <lastmod>${today}</lastmod>\n  </url>`).join('\n');
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

  console.log(`\nsitemap.xml with ${manifest.pages.length} URLs, robots.txt, and deploy/redirects.json with ${REDIRECTS.length} 301s written.`);

  console.log(`\n${rewritten} hrefs rewritten from the link map, ${unresolvedLeft} left inert (the delivery links).`);
  console.log(`${formsMarked} inquiry form(s) marked with <!-- TOAST FORM EMBED -->.`);
  console.log(`${altFilled} empty alt attribute(s) filled from ALT-TEXT.json.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
