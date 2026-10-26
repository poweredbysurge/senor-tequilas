// Pages that are live at their final address but NOT published: built and reachable by link, so
// the client can review the real page on the real site, but kept out of search and off the site.
//
// While a path is in this list, Base.astro gives the page:
//   - <meta name="robots" content="noindex, nofollow"> and no canonical tag
//   - the thin "Preview for Señor Tequila's review" bar above the header
// and sitemap.xml.js leaves it out. vercel.json carries an X-Robots-Tag: noindex, nofollow header
// for the same paths; the build fails if the two lists ever disagree.
//
// TO PUBLISH A PAGE: remove its path from this list, and remove its X-Robots-Tag rule from
// vercel.json (the build will refuse to run until both match). That alone makes it indexable,
// canonical and in the sitemap, at the same URL, with no redirect.
//
// The separate publish step also does, by hand, what is deliberately not done while previewing:
//   - link it from the nav, footer and mobile menu where it belongs
//   - homepage cards: Holiday Parties now, New Year's Eve from 1 December; the dish strip for
//     Birria Ramen
//   - internal links in from other pages and the blog posts (and the TODO on /friendsgiving)
//   - the New Year's Eve blackout line on /private-parties and its child pages
//   - business.json specialHours for December 24, 25 and 31 and January 1
//   - request indexing in Search Console
//
// Paths are written without a trailing slash: the site runs trailingSlash: false, so /foo/ 308s
// to /foo and every canonical and sitemap entry uses the bare form.
// Published 26 October: /holiday-parties, /new-years-eve, /birria-ramen (DESIGN-DEBT entry 136).
export const PREVIEW_PAGES: string[] = [];

export const isPreview = (route: string | undefined): boolean =>
  !!route && PREVIEW_PAGES.includes(route.replace(/\/$/, '') || '/');
