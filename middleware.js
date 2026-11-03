// Vercel Routing Middleware (framework-agnostic: Vercel runs this before the static files).
// Its only job is to answer the hacked-site spam URLs with 410 Gone so Google drops them
// faster and stops spending this site's crawl budget on them. Every real page passes straight
// through. See DESIGN-DEBT.md entry 152.
//
// What Search Console showed on 3 November 2026: 1,450 of the 1,470 URLs with impressions were
// spam left over from the old hacked WordPress site, in four shapes:
//   - /?collections/products/K36812311131/   the homepage with a spam query (975 URLs). These
//     answered 200 with the homepage, which is why Google kept crawling them.
//   - /eightvo/t2u3r3n4e5y229639              a dictionary word, then letters and digits (380)
//   - /collections/products/A3677911756/      and /shop/pg/36781159147 (88)
//   - /?p=179                                  old WordPress post IDs, also answered 200
// The property overview counted 1,728,161 not-indexed URLs against 529,653 indexed.

export const config = {
  // Skip static assets and the API; everything else is checked, and passes through unless it
  // matches a spam shape below.
  matcher: ['/((?!api/|images/|videos/|fonts/|_astro/|favicon|apple-touch-icon|icon-192).*)'],
};

// Query strings the site never uses. Marketing parameters (utm_*, gclid, fbclid) are untouched.
const SPAM_QUERY = /(^|&)(collections|products)\/|(^|&)(p|page_id|attachment_id)=\d/i;

// Store-style paths. The site has never had a shop.
const SPAM_PATH = /^\/(collections|products?|shop|product-category|cart|checkout)(\/|$)/i;

// /word/token: one lowercase word, then 10+ letters and digits with at least 3 digits and no
// hyphen or dot. No real page, guide or asset has that shape (real slugs use hyphens).
const SPAM_TOKEN = /^\/[a-z]+\/([a-z0-9]{10,})\/?$/;

export function isSpam(url) {
  const { pathname, search } = new URL(url);
  const query = search.replace(/^\?/, '');
  if (query && SPAM_QUERY.test(query)) return true;
  if (SPAM_PATH.test(pathname)) return true;
  const m = pathname.match(SPAM_TOKEN);
  if (m && (m[1].match(/\d/g) || []).length >= 3) return true;
  return false;
}

export default function middleware(request) {
  if (!isSpam(request.url)) return; // real page: continue to the static file
  return new Response(
    '<!doctype html><meta charset="utf-8"><title>Gone</title><p>This page no longer exists. <a href="https://www.senortequilas.com/">Señor Tequila\'s</a></p>',
    {
      status: 410,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Robots-Tag': 'noindex',
        'Cache-Control': 'public, max-age=86400',
      },
    },
  );
}
