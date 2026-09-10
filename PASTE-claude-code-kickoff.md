# PASTE THIS INTO CLAUDE CODE

**Setup is already done.** The repo at `Surge-Cowork/repos/senor-tequilas` is on branch `design-port` and already contains:

```
design/export/master-board.standalone.html   the 18MB Claude Design export
design/brief/                                the four reference docs
.gitignore
```

Commit that snapshot first, in your terminal:

```
git add -A && git commit -m "design: Master Board export and brief snapshot, Sept 10"
```

Then paste everything below the rule into Claude Code.

**On Vercel:** stay on `design-port` for the whole port. Pushing that branch gives you a preview deployment to review, and nothing reaches production until you merge to `main`. Do not merge until Phase 4 is green.

---
---

You are porting a finished design into production code. The design is the source of truth and your job is fidelity, not improvement. Read this whole message before touching a file. Work in phases and stop at the end of each one for my go-ahead.

## What you are working with, so you do not have to discover it

`design/export/master-board.standalone.html` is an 18MB export from Claude Design. It is **not** flat HTML. It is a self-unpacking bundle: the page carries the whole project as base64 data in `<script type="__bundler/manifest">` and reassembles itself with JavaScript on load. Opening it in a browser renders correctly. Reading it as text does not.

I have already rendered and inspected it. These facts are verified, do not re-derive them:

- After JS runs, `document.getElementById('dc-root')` contains **29** elements matching `div.sc-host[data-sc-name]`. Each is one artboard.
- One of them is the board's own title card, 1600px wide, with the H1 "Everything, One Board". **Discard it.**
- **20** of them are the real pages, each 1440px wide.
- **8** of them are mobile preview duplicates, each 390px wide, identified by a descendant carrying `data-force-mobile`. They duplicate 8 of the 20 pages. They are previews, not separate pages. Never build a separate mobile page: the responsive CSS handles mobile.
- Pages sourced from `Concept 1 Pages` carry a descendant with `data-c1p-root` and `data-uid`. The homepage comes from `Homepage Concept - Modern Dark v2`. Both are page content; the distinction does not matter to you.
- Images are `blob:` URLs created at runtime (about 63 `<img>` and about 400 CSS `background-image` references), plus a handful of remote `https://senortequilas.com` URLs.
- Fonts load from Google Fonts: Archivo Black, Roboto, Special Elite.
- The responsive layer is real viewport media queries at 390, 768, 1024 and 1440, plus `clamp()`, plus a large number of `vw`/`vh` units. There are no container queries. Do not add, remove or convert breakpoints.

Map pages to URL paths by their H1, using this table:

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
| Mexican Food Near Gaithersburg | `/mexican-restaurant-gaithersburg-md` |

## Phase 0: write the rules down first

Create `CLAUDE.md` at the repo root containing these rules verbatim, then follow them for the rest of this project:

- The extracted pages in `design/pages/` are the source of truth. Never redesign, restyle, re-space, re-color or re-type anything in them.
- Do not convert the CSS to Tailwind, CSS modules, styled-components or any utility system. Do not round pixel values. Do not change font sizes, `clamp()` ranges, `vw` units, colors, radii, shadows, spacing or breakpoints. Copy them.
- Every page is one responsive document. There are no separate mobile pages.
- Never substitute, generate or fetch a stock image. A missing image stays a labeled placeholder exactly as the design draws it.
- Every H1 is the H1 from the design, word for word. Only `/happy-hour` and `/mexican-restaurant-gaithersburg-md` may contain "Germantown" inside an H1.
- No em dashes in any copy. Use a comma, a period or a colon.
- A page is done only when its screenshot matches its reference within tolerance. Not when it looks right.
- If you are about to make a judgment call about layout, stop and ask instead.

## Phase 1: extract the bundle into real pages

Install Playwright. Write `scripts/extract.mjs` that:

1. Launches headless Chromium and loads `design/export/master-board.standalone.html` from the filesystem, then waits for the unpack to finish (wait for `#dc-root` to exist and for `div.sc-host[data-sc-name]` to number 29, plus a settle delay; the unpack takes several seconds).
2. Collects every `<style>` element's text and every `<link rel="stylesheet">` href from the document head into a shared stylesheet and a shared list of font links.
3. Converts every `blob:` URL to a real file: fetch the blob in page context, read it as bytes, hash the bytes, write it to `design/pages/images/<hash>.<ext>`, and build a `blob URL to filename` map. Do this once for the whole document so identical images are stored once. Cover both `<img src>` and CSS `url(...)` in the stylesheet text.
4. For each of the 20 desktop hosts, writes `design/pages/<slug>.html`: a complete HTML document with a doctype, the font links, the shared stylesheet inlined in a `<style>` tag, and the host element's `outerHTML` as the body, with all blob URLs rewritten to `images/<hash>.<ext>` relative paths.
5. For each of the 8 mobile hosts, writes `design/pages/_mobile-reference/<slug>.html` the same way. These are cross-check material only and never ship.
6. Writes `design/pages/manifest.json` mapping slug, URL path, H1, source width, and whether a mobile reference exists.

Show me the script before you run it. After running, report: the 20 slugs written, the image count and total size, the stylesheet size, and any host you could not classify.

**Gate A, extraction fidelity.** Screenshot each of the 20 hosts inside the original bundle at its native 1440 width, then screenshot the corresponding extracted page at 1440. Compare with pixelmatch. They must match within 0.5 percent of pixels after a 2px anti-aliasing allowance. Anything above that means the extraction lost something; fix the script, not the page. Give me the table and stop.

## Phase 2: generate the reference set

Only after Gate A passes. Write `scripts/references.mjs` that renders each extracted page at 390x844, 768x1024 and 1440x900 and saves a full-page screenshot to `design/reference/<slug>-<width>.png`. Wait for fonts to load before capturing (`document.fonts.ready`) so Archivo Black and Special Elite are present, not fallbacks. Commit the reference set.

Then, for the 8 pages that have a mobile reference, compare the extracted page rendered at 390 against the corresponding mobile-reference page. Report the difference per page. These do not have to match pixel for pixel, but a large difference means the responsive CSS does not reproduce the designed mobile layout, which is a design bug I need to know about. List anything above 5 percent and stop.

## Phase 3: assemble the production site

Stack: Astro as a shell and build step only. No client framework. No CSS framework. Astro components may wrap markup; they must never rewrite it.

1. Create one route per page under `src/pages/` at the URL paths in the table, each containing that page's markup copied from `design/pages/<slug>.html` unchanged.
2. Move the shared stylesheet to `src/styles/site.css` and link it once. Do not merge, deduplicate, reorder or clean up selectors.
3. Move `design/pages/images/` to `public/images/` and keep the relative references working.
4. Lift the repeated elements into `src/components/`, one each, containing the exact markup: announcement bar, header, Tonight strip, proof strip, events CTA block, visit block, footer. If the same element differs between two pages, keep both variants and tell me rather than picking one.
5. Wire the real links: Order Online to `https://order.toasttab.com/online/senortequilastogo`, Reserve a Table to `https://tables.toasttab.com/restaurants/d94fa749-fbd5-4a66-90b6-d7755b8c3af3/findTime`, every phone number to `tel:3015694574`, internal navigation to the paths in the table. Book a Tour and Get a Quote anchor to the events form block on the same page; leave `<!-- TOAST FORM EMBED -->` where the real form goes.
6. Build. Zero console errors, zero 404s.

## Phase 4: verify

Write `scripts/visual-check.mjs` comparing the built site at 390, 768 and 1440 against `design/reference/`. Same tolerance: 0.5 percent after a 2px anti-aliasing allowance. Font rendering is the only acceptable source of drift; a layout shift, a missing image or a wrong color is a failure. Fix failures by matching the design more exactly, never by editing the reference or loosening the tolerance.

Also check and report:

- Exactly one H1 per page, matching the table.
- "Germantown" inside an H1 on exactly two pages.
- Zero em dashes in the rendered HTML.
- Zero hits for `5,592`, `20%`, `Birria Pizza`, `margarita kit`, `events@`.
- Every `<img>` has a non-empty alt.
- No horizontal scroll at 360, 390, 768, 1024, 1440, 1920.
- The Order Online control visible without scrolling at 390x844 on every page.
- Every remaining `senortequilas.com` URL, listed by page and element, so I can sweep them.

Commit when green: `port: all 20 pages match reference at 390/768/1440`.

## Phase 5: SEO, only after Phase 4 is green

From `design/brief/seo-migration-kit-and-page-spec.md` and `design/brief/PASTE-NOW-h1-override.md`:

1. Title tags and meta descriptions per page. Title tags keep the full geo phrasing even where the H1 does not.
2. Canonical URLs, XML sitemap, robots.txt.
3. Restaurant and LocalBusiness JSON-LD on every page: Señor Tequila's, 20021 Century Blvd, Germantown, MD 20874, 301-569-4574, hours Mon to Wed 3 PM to 10 PM, Thu 3 PM to midnight, Fri 3 PM to 1 AM, Sat 11 AM to 1 AM, Sun 11 AM to 10 PM. Add Event Venue and Caterer types on the events and catering pages.
4. The 301 redirect map from the migration kit as a host config file. Do not deploy.
5. Open Graph tags per page using that page's hero image.

Re-run the visual check. Nothing visual may change. Commit: `seo: titles, schema, sitemap, redirects`.

## Phase 6: stop

Do not deploy. Do not optimize images beyond copying them. Do not add animations, hover effects, analytics or cookie banners. Report the final table, every remaining placeholder by page, and every remaining remote URL. Then stop.
