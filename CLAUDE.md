# Señor Tequila's, design port

This repo ports a finished Claude Design board into production code. The design is the
source of truth. The job is fidelity, not improvement.

## Rules

- The extracted pages in `design/pages/` are the source of truth. Never redesign, restyle, re-space, re-color or re-type anything in them.
- Do not convert the CSS to Tailwind, CSS modules, styled-components or any utility system. Do not round pixel values. Do not change font sizes, `clamp()` ranges, `vw` units, colors, radii, shadows, spacing or breakpoints. Copy them.
- Every page is one responsive document. There are no separate mobile pages.
- Never substitute, generate or fetch a stock image. A missing image stays a labeled placeholder exactly as the design draws it.
- Every H1 is the H1 from the design, word for word. Only `/happy-hour` and `/mexican-restaurant-gaithersburg-md` may contain "Germantown" inside an H1.
- No em dashes in any copy. Use a comma, a period or a colon.
- A page is done only when its screenshot matches its reference within tolerance. Not when it looks right.
- If you are about to make a judgment call about layout, stop and ask instead.

## Page table

Pages are identified by their H1 and map to these URL paths.

| H1 | Path | Slug |
|---|---|---|
| From Mexico, With Love | `/` | `home` |
| The Menu | `/menu` | `menu` |
| We're Not a Chain. We're a Family. | `/our-story` | `our-story` |
| Don't Do the Dishes | `/takeout-delivery` | `takeout-delivery` |
| Birria Tacos | `/birria-tacos` | `birria-tacos` |
| Quesabirria Tacos | `/quesabirria-tacos` | `quesabirria-tacos` |
| Street Tacos | `/street-tacos` | `street-tacos` |
| Fajitas & Molcajetes | `/fajitas-molcajetes` | `fajitas-molcajetes` |
| La Dulcería | `/la-dulceria` | `la-dulceria` |
| Private Rooms for 12 to 400 | `/private-parties` | `private-parties` |
| Quinceañeras, Without the Ballroom Price | `/private-parties/quinceaneras-celebrations` | `private-parties-quinceaneras-celebrations` |
| Weddings, Showers, Receptions | `/private-parties/weddings-receptions` | `private-parties-weddings-receptions` |
| Taco Catering | `/catering` | `catering` |
| The Margaritas People Text Their Friends About | `/margaritas` | `margaritas` |
| It's in the Name for a Reason | `/tequila-bar` | `tequila-bar` |
| Happy Hour in Germantown | `/happy-hour` | `happy-hour` |
| Still Open. Still Cooking. | `/late-night` | `late-night` |
| Karaoke Every Thursday | `/karaoke` | `karaoke` |
| Taco Tuesday | `/taco-tuesday` | `taco-tuesday` |
| Mexican Food Near Gaithersburg | `/mexican-restaurant-gaithersburg-md` | `mexican-restaurant-gaithersburg-md` |

## The bundle

`design/export/master-board.standalone.html` is an 18MB self-unpacking bundle, not flat
HTML. It carries the project as base64 in `<script type="__bundler/manifest">` and
reassembles itself with JavaScript on load. Reading it as text tells you nothing. Render it.

Verified facts, do not re-derive:

- After JS runs, `#dc-root` contains 29 `div.sc-host[data-sc-name]` elements. Each is one artboard.
- 1 is the board's own title card, 1600px wide, H1 "Everything, One Board". Discard it.
- 20 are the real pages, each 1440px wide.
- 8 are mobile preview duplicates, each 390px wide, carrying a descendant with `data-force-mobile`. They duplicate 8 of the 20 pages. They are previews, never separate pages.
- Images are `blob:` URLs created at runtime. **51 unique images** by content hash, which is what actually ships. Plus remote `https://senortequilas.com` URLs, 91 references across the 20 pages, to be swept in Phase 4.
- **Fonts are embedded, not fetched.** All 57 `@font-face` blocks use `data:` URIs. The only head links are two vestigial `preconnect`s pointing at Google. There is no network font dependency, so no FOUT and no fallback risk. **Five families are in play, not three: Roboto, Barlow, Barlow Condensed, Archivo Black and Special Elite.** Barlow and Barlow Condensed were missing from the original brief. Do not let a later step drop them.
- Body in the bundle is `margin: 0`, background `rgb(230, 227, 220)`. That background is canvas chrome. Extracted pages override only `html,body` height and background, in one visible, named `#extraction-canvas-reset` block. Never make that edit silently.
- **The homepage 390px artboard is the only mobile preview without `data-force-mobile`.** Its mobile layout comes purely from the viewport media queries, which is exactly how production will behave. The other seven previews are forced. Classify artboards by width, never by that attribute.
- The responsive layer is real viewport media queries at 390, 768, 1024 and 1440, plus `clamp()`, plus many `vw`/`vh` units. No container queries. Do not add, remove or convert breakpoints.

## Phases

0. Write these rules down. Done.
1. Extract the bundle into real pages. Gate A: extraction fidelity at 1440, 0.5% tolerance. **Done, 19/20 passed on merit, karaoke accepted as a recorded exception. See `design/gate-a/EXCEPTIONS.md`. That exception is scoped to Gate A and does not apply to Phase 4, which keeps the full 0.5% for all 20 pages.**
2. Generate the reference set at 390, 768, 1440.
3. Assemble the production site. Astro as shell and build step only, no client framework, no CSS framework.
4. Verify against the reference set. Same tolerance.
5. SEO, only after Phase 4 is green.
6. Stop. Do not deploy.

**What "do not deploy" means, clarified 14 September.** It scopes to the custom domain
cutover, not to the Vercel project URL. `senor-tequilas.vercel.app` is the client review URL
and may be promoted to production freely so the client can see the work; it is public, with
deployment protection off, so no Vercel login is needed. `senortequilas.com` still serves the
old WordPress site and stays untouched until the client says otherwise. The DNS cutover is
the thing this rule stops. See also the `LAUNCH`/`LIVE` constants at the top of
`src/layouts/Base.astro`, which keep canonical and share URLs on the review host until then.

## Links

- Order Online: `https://order.toasttab.com/online/senortequilastogo`
- Reserve a Table: `https://tables.toasttab.com/restaurants/d94fa749-fbd5-4a66-90b6-d7755b8c3af3/findTime`
- Phone: `tel:3015694574`
