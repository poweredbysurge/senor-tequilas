// Generated at build time from the pages themselves, so a page added or removed can never
// drift out of the sitemap. URLs are on the production domain from business.json, which is
// what robots.txt advertises. See DESIGN-DEBT.md entry 55.
//
// lastmod is each page's own last commit, read from git while the site builds. It is never
// the build date: one date on every URL is what a crawler learns to ignore, which is why
// entry 55 dropped the hand-set one. Where git cannot give a true answer the tag is left out
// for that URL: no git, an untracked file, or a shallow clone whose history stops before the
// page's real last change. See DESIGN-DEBT.md entry 112.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import business from '../data/business.json';
import { PREVIEW_PAGES } from '../data/preview-pages';
import { publishedGuides, isoDate } from '../lib/guides.js';

const files = Object.keys(import.meta.glob('./**/*.astro'));

const git = (...args) => execFileSync('git', args, { cwd: process.cwd(), encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();

// In a shallow clone the oldest commit git has looks as if it created every file, so a page
// last touched before that point would report the boundary's date. Those are not trusted.
function shallowBoundary() {
  try {
    if (git('rev-parse', '--is-shallow-repository') !== 'true') return new Set();
    return new Set(readFileSync(git('rev-parse', '--git-path', 'shallow'), 'utf8').split('\n').filter(Boolean));
  } catch {
    return null; // no git here at all
  }
}

function lastModified(file, boundary) {
  if (!boundary) return null;
  try {
    const out = git('log', '-1', '--format=%H %cI', '--', 'src/pages/' + file.replace(/^\.\//, ''));
    if (!out) return null;
    const [hash, date] = out.split(' ');
    return boundary.has(hash) ? null : date;
  } catch {
    return null;
  }
}

// Preview pages are reachable by link but unpublished, so they stay out of the sitemap. Their
// X-Robots-Tag rules in vercel.json have to match the same list, or the build stops here: a
// page published in one place and not the other is either hidden by accident or indexed early.
const noindexHeaders = (JSON.parse(readFileSync('vercel.json', 'utf8')).headers || [])
  .filter((h) => (h.headers || []).some((x) => /x-robots-tag/i.test(x.key) && /noindex/i.test(x.value)))
  .map((h) => h.source).sort();
if (JSON.stringify(noindexHeaders) !== JSON.stringify([...PREVIEW_PAGES].sort())) {
  throw new Error(`preview pages out of step: preview-pages.ts has ${JSON.stringify(PREVIEW_PAGES)}, vercel.json noindex headers have ${JSON.stringify(noindexHeaders)}`);
}

const boundary = shallowBoundary();
// Guides (DESIGN-DEBT.md entry 145): guides/[slug].astro is a template, not a page, so it is left
// out, and each published guide is listed from the collection instead, with lastmod its own
// date_modified. /guides takes the newest guide's date_modified. Drafts are never listed.
const guides = await publishedGuides();
const guidesModified = guides.length ? isoDate(new Date(Math.max(...guides.map((g) => g.data.date_modified)))) : null;
const pages = files
  .filter((f) => !f.includes('['))
  .map((f) => {
    // index.astro is its folder's page: /index is the root, /guides/index is /guides (no trailing
    // slash, the site's URL style and the canonical)
    const p = f.replace(/^\.\//, '/').replace(/\.astro$/, '');
    const path = p === '/index' ? '/' : p.replace(/\/index$/, '');
    return { path, lastmod: path === '/guides' ? guidesModified : lastModified(f, boundary) };
  })
  .concat(guides.map((g) => ({ path: g.data.url, lastmod: isoDate(g.data.date_modified) })))
  .filter((p) => !PREVIEW_PAGES.includes(p.path))
  .sort((a, b) => (a.path === '/' ? -1 : b.path === '/' ? 1 : a.path.localeCompare(b.path)));

const dated = pages.filter((p) => p.lastmod).length;
console.log(`sitemap: lastmod from git on ${dated} of ${pages.length} pages` + (boundary === null ? ' (git not available)' : boundary.size ? ' (shallow clone)' : ''));

export function GET() {
  const urls = pages
    .map((p) => `  <url>\n    <loc>${business.siteUrl}${p.path}</loc>` + (p.lastmod ? `\n    <lastmod>${p.lastmod}</lastmod>` : '') + '\n  </url>')
    .join('\n');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
}
