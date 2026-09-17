// Generated at build time from the pages themselves, so a page added or removed can never
// drift out of the sitemap. URLs are on the production domain from business.json, which is
// what robots.txt advertises. See DESIGN-DEBT.md entry 55.
import business from '../data/business.json';

const pages = Object.keys(import.meta.glob('./**/*.astro'))
  .map((f) => f.replace(/^\.\//, '/').replace(/\.astro$/, '').replace(/\/index$/, '/'))
  .map((p) => (p === '/index' ? '/' : p))
  .sort((a, b) => (a === '/' ? -1 : b === '/' ? 1 : a.localeCompare(b)));

export function GET() {
  const urls = pages.map((p) => `  <url>\n    <loc>${business.siteUrl}${p}</loc>\n  </url>`).join('\n');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
}
