# Outstanding tasks

Working task list for Señor Tequila's. Source of truth for what is left, who owns it and
what blocks it. Historical detail for anything here lives in `DESIGN-DEBT.md` under the
entry number cited.

**Owners:** SEO items are Mario's. Anything marked SEO is not to be actioned by anyone else,
including changes that look purely technical, because they move indexing signals.

Status: `open` / `blocked` / `client` (waiting on the client) / `decided` (agreed, not built).

---

## SEO and launch — Mario

These are sequenced. 1 through 4 happen together at cutover; 5 is independent and can go now.

| # | Task | Status | Debt |
|---|---|---|---|
| S1 | Set `LIVE = LAUNCH` in `src/layouts/Base.astro`. Moves canonicals and share URLs onto the production domain. | blocked on DNS cutover | 32, 55 |
| S2 | Create `vercel.json`. Wire the 301 map from `deploy/redirects.json` (currently `doNotDeployYet: true`) and settle `trailingSlash` against `build.format: 'directory'`. Old WordPress URLs carry trailing slashes; new canonicals do not. Redirects, canonicals and sitemap must all agree. | blocked on DNS cutover | — |
| S3 | Rebuild after S1 so the generated sitemap and robots.txt emit the production domain. | blocked on S1 | 55 |
| S4 | Verify in Search Console: canonical matches sitemap, no redirect chains on the 301s, no orphaned old URLs. | blocked on S1–S3 | — |
| S5 | Gate `src/pages/robots.txt.js` to emit `Disallow: /` when not on the production host. Today the review URL serves `Allow: /` while its canonicals point elsewhere, so a crawl before cutover feeds contradictory host signals. | open, can go now | 55 |
| S6 | Decide whether to reinstate `lastmod` in the sitemap. Dropped in entry 55 because every page carried the same hand-set date, which was worse than absent. | open | 55 |
| S7 | Link `/contact` from the header and footer. It is in the sitemap and reachable by URL, but nothing links to it, so it is an orphan page. | open | 18, 20 |
| S8 | Google Business Profile, not a repo change: add "Sports bar" as a secondary category and post three World Cup watch party photographs. "Sports bar near me" is 105,000/mo and is answered by the local pack, not by `/game-day`. | open | 37 |
| S9 | `/takeout-delivery` meta description still reads "Order online from Toast and skip the dishes." Customer-facing, in search results, and a diner does not know what Toast is. The on-page reference was removed in entry 60; this one was left because meta descriptions are Mario's. | open | 60 |

### Not a task, recorded so it is not rediscovered

Astro carries no inherent SEO penalty here. Output is static HTML, no client framework, no
SSR. All 22 pages have a unique title and description, one `<h1>`, a canonical, OG and
Twitter tags and `Restaurant`/`LocalBusiness` JSON-LD. The sitemap is generated from the
page files so it cannot drift. The only Astro-attributable risk is URL format, which is S2.

---

## Client decisions

| # | Task | Status | Debt |
|---|---|---|---|
| C1 | "Tonight" nav item points at no page. Either rename the item or build the page. | client | 3 |
| C2 | Three duplicate Uber Eats storefronts. Controls stay in the markup, inert, with `unresolved` rows in the link map until the client confirms which is live. | client | 4 |
| C3 | Twelve dish cards are not confirmed against a current menu. | client | 23 |
| ~~C4~~ | ~~"Top sellers from Toast" is a claim we cannot support.~~ **Done 18 September**, entry 60. The eyebrow reads "the hitters · top sellers". "People's choice" remains a one line change if the sales claim itself is ever a problem. | done | 24, 60 |
| C5 | Outstanding photographs. Each slot is a labelled placeholder rather than a wrong picture. The two homepage taco slots are done, entry 61, and the two Instagram rail slots took the nearest real venue photograph, entry 63. The /our-story hero is done, entry 68. Still genuinely outstanding: the two Rivas portraits on /our-story, a wall-art shot, and the entry 35 and 39 slots. | client | 35, 39, 61 |

---

## Design and build

| # | Task | Status | Debt |
|---|---|---|---|
| D1 | Header overflows by 29px at 320px, down from 49px. Knowingly left. | open | 45 |
| D2 | Reference set at `design/reference/` predates the September changes, so the visual baseline cannot validate nine pages. Regenerate or retire it. | open | 22, 38 |
| D3 | The brothers photograph is still the `/our-story` `ogImage` and still fills its slot. | open | 40 |
| D4 | `/private-parties` is 13,666px tall at 390 with no in-page navigation. | open | 9 |
| ~~D5~~ | ~~Current-page nav highlight is hand-applied, so 12 pages have none.~~ **Done 21 September**, entry 69. Marked from the path by `navCurrent()`, with `aria-current="page"`. 3 routes to 9. | done | 10, 69 |
| ~~D9~~ | ~~Game Day has no desktop nav entry.~~ **Done 21 September**, entry 75. Swapped for Gift Cards, which moved to the footer nav. Eight items kept, no overflow. | done | 74, 75 |
| D8 | The homepage nav is not the same nav as every other page: it shows Happy Hour where the other 21 show Takeout. Both are eight items, which is why it was never spotted. A visitor's nav changes under them when they leave the homepage, and /happy-hour cannot mark itself as current because its own header has no link to it. Which of the two gives way, or whether the nav goes to nine items, is a decision about the menu rather than a bug fix. | open | 69 |
| D7 | Hero CLS from font swap. Nine `@font-face` rules all use `font-display: swap`, only three are preloaded, and the two that shift the hero, `barlow-condensed-500` and `barlow-700`, are not among them. Lighthouse attributes an intermittent 0.13 to 0.18 CLS on `data-dc-tpl="60"` to "Web font loaded", which is the difference between a 91 and an 83. Predates the scroll reveals and is present with them disabled. Fix by preloading the above-the-fold faces, or `font-display: optional` for those, or metric overrides on the fallback. | open | 66 |
| D6 | 30 letterboxed images outside `public/images/dishes/`, missed by the entry 60 crop pass because it was scoped to that one folder. **Do not bulk-crop this set.** `site/open-graph.jpg` is 1200x630 and must keep that ratio for share cards; `site/texture-black.jpg` is a texture, where a black edge is the point. The rest, mostly design-board hash-named files plus `site/catering-card.jpg` at 44% vertical bars, are worth doing one at a time with eyes on each. | open | 60, 61 |

---

## Accessibility

| # | Task | Status | Debt |
|---|---|---|---|
| A1 | Alt text is supplied in the port from `design/ALT-TEXT.json`. Now that this is its own project, fold that alt text into the page markup and retire the JSON indirection. | open | 17 |
