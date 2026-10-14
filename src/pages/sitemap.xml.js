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

const boundary = shallowBoundary();
const pages = files
  .map((f) => {
    const p = f.replace(/^\.\//, '/').replace(/\.astro$/, '').replace(/\/index$/, '/');
    return { path: p === '/index' ? '/' : p, lastmod: lastModified(f, boundary) };
  })
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
