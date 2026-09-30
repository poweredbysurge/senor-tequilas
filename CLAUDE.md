# Señor Tequila's

Production site for Señor Tequila's, Germantown MD. Astro as a shell and a build step only:
no client framework, no CSS framework. 22 pages, static output.

Originally ported from a Claude Design board. That port is finished. This is now the live
project and the code in `src/` is the source of truth, not the board.

## Rules

- **Do not convert the CSS.** No Tailwind, no CSS modules, no styled-components, no utility
  system. Do not round pixel values or normalize `clamp()` ranges. The styles are deliberate.
- **Breakpoints are fixed** at 390, 768, 1024 and 1440, plus `clamp()` and `vw`/`vh` units.
  No container queries. Do not add, remove or convert breakpoints.
- **Every page is one responsive document.** There are no separate mobile pages.
- **Never substitute, generate or fetch a stock image.** A missing image stays a labeled
  placeholder.
- **No em dashes in any copy.** Use a comma, a period or a colon.
- **Fonts are embedded as `data:` URIs**, five families: Roboto, Barlow, Barlow Condensed,
  Archivo Black, Special Elite. No network font dependency. Do not add a Google Fonts link.
- **Record every substantive change in `DESIGN-DEBT.md`**, which is the running project log
  and the reason most questions have an answer already. Check it before re-deriving anything.

## Pages

| H1 | Path |
|---|---|
| From Mexico, With Love | `/` |
| The Menu | `/menu` |
| We're Not a Chain. We're a Family. | `/our-story` |
| Don't Do the Dishes | `/takeout-delivery` |
| Birria Tacos | `/birria-tacos` |
| Quesabirria Tacos | `/quesabirria-tacos` |
| Street Tacos | `/street-tacos` |
| Fajitas & Molcajetes | `/fajitas-molcajetes` |
| La Dulcería | `/la-dulceria` |
| Private Rooms for 12 to 400 | `/private-parties` |
| Quinceañeras, Without the Ballroom Price | `/private-parties/quinceaneras-celebrations` |
| Weddings, Showers, Receptions | `/private-parties/weddings-receptions` |
| Taco Catering | `/catering` |
| The Margaritas People Text Their Friends About | `/margaritas` |
| It's in the Name for a Reason | `/tequila-bar` |
| Happy Hour in Germantown | `/happy-hour` |
| Still Open. Still Cooking. | `/late-night` |
| Karaoke Every Thursday | `/karaoke` |
| Taco Tuesday | `/taco-tuesday` |
| Every Game, Every Night | `/game-day` |
| Come See Us | `/contact` |
| Mexican Food Near Gaithersburg | `/mexican-restaurant-gaithersburg-md` |

Plus two generated routes: `src/pages/sitemap.xml.js` and `src/pages/robots.txt.js`.

Only `/happy-hour` and `/mexican-restaurant-gaithersburg-md` may contain "Germantown" inside
an H1.

## SEO

Handled in `src/layouts/Base.astro`, which every page wraps. Each page passes `title`,
`description`, `canonical` and `ogImage`; the layout emits canonical, OG, Twitter card and
`Restaurant`/`LocalBusiness` JSON-LD built from `src/data/business.json`. Pass `extraTypes`
to add schema types to a page.

The sitemap is generated from `src/pages/**/*.astro` at build time, so a page added or
removed cannot drift out of it. Never hand-write `public/sitemap.xml`.

Invariants worth protecting:

- One `<h1>` per page. Every title and description unique across the site.
- Business facts live in `business.json` only. Do not hardcode an address, phone or hour.

## Launch state

**Live since the cutover the week of 22 September.** Production is `https://www.senortequilas.com`.
The apex `senortequilas.com` 308s to www (a Vercel domain setting), and `senor-tequilas.vercel.app`
301s to www with the path kept (a host redirect in `vercel.json`). Preview deployments are behind
Vercel SSO. Production deploys from GitHub `main` on push.

One host everywhere: `business.json` `siteUrl` is the single source for canonicals, og/twitter
URLs, JSON-LD, the sitemap and robots.txt. Pages still pass `canonical` as a full URL; `Base.astro`
keeps only its path. Never hardcode a host.

`vercel.json` holds the redirects and `trailingSlash: false`, so `/menu/` 308s to `/menu`, matching
the canonicals. Old WordPress URLs are matched with or without their trailing slash in one hop
(`{/}?` in the source), so there are no redirect chains. `deploy/redirects.json` is the original
map, kept for reference only. See DESIGN-DEBT.md entry 93.

After anything touching URLs: build, then confirm every canonical in `dist/` matches a `<loc>` in
`dist/sitemap.xml`.

## Performance

Mobile Lighthouse against any deployed URL or a local `npm run preview`:

```
node .lh.mjs https://senor-tequilas.vercel.app/
```

Prints score, FCP, LCP, TBT, Speed Index, total bytes and the heaviest requests, on
Lighthouse's mobile profile. Re-run after anything touching images, fonts or the hero video
and record the numbers in `DESIGN-DEBT.md` alongside the change.

`Base.astro` carries a per-route `LCP_IMAGE` map driving a preload hint. A new page with a
hero image should be added to it.

## Commands

```
npm run build       # astro build
npm run preview     # astro preview
npm run check-build # scripts/check-build.mjs
npm run verify      # scripts/visual-check.mjs, screenshot diff
```

## Links

- Order Online: `https://order.toasttab.com/online/senortequilastogo`
- Reserve a Table: `https://tables.toasttab.com/restaurants/d94fa749-fbd5-4a66-90b6-d7755b8c3af3/findTime`
- Phone: `tel:3015694574`
