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

## Owner and management revision notes: what is blocked

Raised 23 September. Applied changes are DESIGN-DEBT entry 76. These are what could not be
done without something from the client. Numbering is ours; the source note is in brackets.

### Decisions needed

| # | Item | Source |
|---|---|---|
| R1 | **2002 or 2015.** The new brand copy says the Rivas brothers have owned the brand since 2002, and /our-story now reads "24 years, one mission". The footer, the homepage hero, the JSON-LD and several meta descriptions all say 2015. Both can be true, brand since 2002 and this location since 2015, but somebody has to say which number goes where, because it is in structured data Google reads. | Roberto 10, 15 |
| R2 | **Private party capacity.** The note says "It is 100, not 200", but the site says 12 to 400 and nothing says 200. Which is the real maximum, and is it per room or for the building? | Tomas 4 |
| ~~R3~~ | ~~**Sunday happy hour.**~~ **Settled 7 October**, entry 95: Sunday is not a happy hour day. Removed site wide. | Roberto 2, Daniela, Tomas 5 |
| R4 | **Which hours block survives.** The instruction is to show hours in one place only. They currently appear in the Find Us card on the homepage and in the footer on all 22 pages. Recommend keeping the footer, since it is on every page, and dropping the Find Us copy. Confirm. | Roberto 13 |
| R5 | **"Make sure the displayed hours say 3 p.m.-10 p.m."** That is Monday to Wednesday today. Thursday is 3 to midnight, Friday 3 to 1am, Saturday 11 to 1am, Sunday 11 to 10. Which days is this meant to change, if any? | Roberto 13 |
| R6 | **Takeout hours are different from restaurant hours.** The note gives Thursday 3-10, Friday 3-12, Saturday 11-12 for pickup, which is earlier than the dining room on all three. Daniela's note suggests why: after 10pm it is the late-night menu only. Confirm takeout closes earlier, and whether the late-night menu should be said out loud. | Roberto 19, Daniela |
| ~~R7~~ | ~~Which menu section is misnamed.~~ **Answered 23 September**, entry 78. The section is now "Birria" in the pill and the heading; the dish names keep "Quesabirria". | done | Steven |
| ~~R8~~ | ~~**Best sellers should not all be tacos.**~~ **Done 23 September**, entry 80. Twelve supplied dishes now on a rail, chips and seller badges removed. Outstanding: confirm "Flautitas de la Casa" was the one meant, and approve the Pork Belly Guacamole description, which was written from the photograph because the dish is not on the menu. Original note: Agreed in principle, but which dishes replace which, and in what order? The row currently holds the six top sellers. | Alejandro |
| R9 (part) | **Birria Pizza.** Copy is clear that it is to-go only, but it is **on the menu now**, entry 79, in the Birria section with a Takeout only pill and a placeholder thumbnail. Still needed: the photograph, a decision on whether the $36 price shows (no menu card shows a price today), whether "Feeds 4+" should appear, and whether it also goes into Most Ordered To-Go. | Roberto 9, 17, 18 |

### Links, feeds and credentials

| # | Item | Source |
|---|---|---|
| ~~R10~~ | ~~**Gift card purchase link.**~~ **Done 23 September**, entry 79. Points at the supplied Toast gift card page. Note the URL carries `utm_source=undefined` and redirects to `order.toasttab.com/egiftcards/senortequilastogo`. Original note: Should point at the restaurant's Toast gift card page. Need the exact URL. The button text is already changed to "Call to Purchase Card Now". | Roberto 12 |
| R11 | **Facebook link.** Set to `facebook.com/SenorTequilasDMV`, the ASCII spelling, since the note wrote it with an n-tilde and Facebook vanity URLs do not use one. Facebook returns 200 for any path, so this could not be verified from here. Please open it once and confirm. | Roberto 14 |
| ~~R12~~ | ~~**Broken Uber Eats link.**~~ **Done 23 September**, entry 81. Live storefront supplied and wired. See the entry for three notes on the URL's parameters. Original note: Confirmed still unresolved from entry 4: there are three duplicate Uber Eats storefronts and nobody has said which is live. Need the correct one. | Roberto 20, entry 4 |
| R13 | **Live Instagram feed.** Replacing the static rail with the real feed needs a third-party embed or the Instagram Basic Display API, which needs an app, a token and a refresh job. It is a build, not a copy change. Worth deciding whether it is worth it, or whether refreshing the static images periodically is enough. | Roberto 11 |

### Photography and video

Nothing below can be done without files. Grouped by where they go.

| # | Needed | Source |
|---|---|---|
| R14 | **Menu:** the remaining items with no photograph. **9 of 126 menu thumbnails are still placeholders after entry 98**, listed under Media placement below. The kids quesadilla picture is also wrong. | Daniela, Tomas 3, Alejandro |
| R15 (part) | ~~A real happy hour photograph for the page~~ and ~~real pictures for the Deals section~~ **done 23 September**, entry 82: the hero, the Bar card and the Bites card all carry supplied happy hour photography now. Still outstanding: real pictures of the happy hour items for the happy hour menu itself. | Roberto 2, Daniela |
| R16 | **Private events rooms:** new pictures for the Mexican Room, the International Room and Vallarta; the current Vallarta picture moves to Indoor Patio; a Tulum picture; and a full exterior shot of the building. | Roberto 4, Alejandro |
| R17 | **Private events, the rest:** an empty-room picture for the main image, buffet and catering photographs, and new pictures for the DJ booth, the mariachis and the DJ with party host. ~~Plus Tomas' headshot for Book a Tour.~~ Headshot done 9 October, entry 100. | Roberto 3, 5, 6, Daniela |
| R18 | **People:** replace the women-biting-tacos picture on /our-story and the Faty and Paty picture, which has a poor background. Missing portraits of Roberto and Alejandro. Our History should show Alex and Rob rather than unrelated guests. The 2002 photograph is promised later, to be captioned "Circa 2002, somewhere in Wisconsin." | Steven, Alejandro, Daniela, Roberto 15 |
| R19 | **Drinks and dishes:** actual Big Mami Margarita, Mangonada and Tornado pictures, all three currently mismatched with their descriptions, and the Big Mami also appears wrong in the game day order section. The carnitas taco picture is poor. A Molcajete picture for Most Ordered To-Go, and the Cinco Melones picture comes out. | Roberto 8, 18, 23, Tomas 2 |
| R20 | **Video and flyers:** distinct Friday and Saturday flyers, not one combined, plus a Sunday flyer for the all-day bar happy hour. More carousel video: World Cup, mariachi in full uniform, Cinco de Mayo. A trompo video for the tacos page. Three strong pictures from different sports to replace the three World Cup pictures on game day. More pictures of the bar. Also a call on whether the crazy World Cup party video stays. | Roberto 1, 23, Alejandro, Tomas 1, Daniela |

### Needs design direction, not assets

| # | Item | Source |
|---|---|---|
| R21 | **La Cocina subsections.** The copy for The Culture, The Food, The Bar and The Tortillas is written and ready, and so is the opening line "Join us for Happy Hour. Stay for dinner and continue the night with us." But the section currently holds a heading and two paragraphs, so four new subsections is a layout change rather than a copy change. Needs a decision on how it should look. | Roberto 16 |
| R22 | **A dedicated happy hour page.** One already exists at /happy-hour. The note asks for days and times, the all-areas distinction, menu items with prices, real pictures, current deals, a call to action and directions. Most of that is there; the menu items with prices are not, and need the actual list. | Roberto 2 |

## Post-launch corrections, round 1: what is open

Raised 7 October. Applied changes are DESIGN-DEBT entry 95, on branch `post-launch-corrections-1`,
not merged.

### For Mario (SEO, not actioned)

| # | Item |
|---|---|
| P1 | `/happy-hour` title: "Happy Hour in Germantown, MD: Weekdays 3 to 6 and All Day Sunday \| Señor Tequila's". Suggested: "Happy Hour in Germantown, MD: Weekdays 3 PM to 6 PM \| Señor Tequila's". |
| P2 | `/happy-hour` description still says "All day Sunday (in the bar area only)." Suggested: drop that sentence, keep the rest. |
| P3 | `/game-day` description still says "all day Sunday happy hour". Suggested: replace with "every NFL game on, every Sunday". There are no game day specials, entry 97. |
| P4 | `/margaritas` description says "pulps we cook in house" and lists "jalapeno" without the chiles flavour the page no longer has; the page now says "made from scratch in-house". |
| ~~P5~~ | **Done 7 October**, entry 96, on request: `/takeout-delivery` `ogImage` is `quesabirrias-2026.jpg`. S9 is still open. |
| P6 | `/street-tacos` `ogImage` is `tacos-de-arrachera-hero.jpg`; the hero is now `tacos-al-pastor.jpg`. Not wrong, just no longer the hero. |
| P7 | `/` description leads with "Handmade tortillas"; the hero line now says "Fresh food made to order." Not a contradiction, worth a look. |
| P8 | Birria Tacos and Quesabirria Tacos: merge or keep. The two pages now share a card grid and an origin paragraph. See the round 1 report. |

### Client and Sam

| # | Item |
|---|---|
| ~~P9~~ | **Done 7 October**, entry 96. Three real reviews from `reviews.json`. |
| ~~P10~~ | **Answered 7 October**, entry 97: no game day specials. Claim removed. |
| ~~P11~~ | **Done 7 October**, entry 96. "In the bar area" removed from `/menu` and `/margaritas`. |
| P12 | The Wednesday flyer art says "Wednesday · 7:30 PM". The correct time is 8 PM, confirmed 7 October. New art is coming from the client; replace `day-wednesday.webp` when it arrives. |
| P13 | Confirm the Our Story line "as the Post-Crescent showcased in 2005". |
| ~~P14~~ | **Done 7 October**, entry 96. `quesabirrias-card.jpg` is no longer referenced. |
| ~~P15~~ | **Done 7 October**, entry 96. `tacos-de-arrachera-card.jpg` is no longer referenced. |
| ~~P16~~ | **Done 7 October**, entry 96. Both rails match the carousel. |
| P17 | **Mostly done 9 October**, entry 98: Birria Pizza, Tacos Dorados, the fajitas pairing (with tacos and margaritas, not the briefed molcajete shot), the piña colada and the trompo hero are placed. Still open: a molcajete, fajita and Big Mami photograph for the pairing. Original note: Photographs for the slots emptied in entry 95: Birria Pizza (three places), Tacos Dorados (two), the fajitas pairing, a restaurant-owned piña colada, and trompo footage for the `/street-tacos` hero. |
| P18 | `npm run verify` cannot run: `design/reference/` has no screenshots. Same root as D2. |
| ~~P19~~ | **Done 7 October**, entry 97. Happy hour is 3 PM to 6 PM; the review is hidden from the rail. |
| P20 | The mobile rail on `/happy-hour` is hidden at every width. Decide whether it should show on phones or come out of the markup. |
| ~~P21~~ | **Answered 7 October**, entry 97: Tue and Wed start at 8 PM, birria is 12 hours, La Cocina is "Since 2003", time format stays PM. |
| P22 | For Mario: three descriptions still say six hours, now that birria is 12. `/birria-tacos` "six hours in the pot", `/quesabirria-tacos` "Six hours of braising", `/our-story` "six-hour birria". |

## Media placement, round 1: what is open

Raised 9 October. Applied changes are DESIGN-DEBT entry 98, on branch `media-placement-1`.

### Client and Sam

| # | Item |
|---|---|
| M1 | **Nine PHOTO frames left on `/menu`:** 6" Single Tacos, Enchiladas de Camarón (two cards), Fajita Burrito, Arroz con Pollo, Tequila's Chicken Platter, Cheeseburger, Chicken Nuggets, 2 Tacos Mañaneros. None of these is in the client's folder. |
| M2 | **House Margarita shows a frozen margarita.** The happy hour menu says "12 oz. on the rocks". Either a rocks photograph, or confirm frozen is fine. On `/menu` and `/happy-hour`. |
| M3 | **Frozen Piña Colada shows the virgin piña colada**, in a mug, a phone photograph on a plain background. Fine as a stand-in; a photograph of the cocktail itself would be better. |
| M4 | **Cut-out drinks are on slate, the older drink thumbnails are on black.** Nine cards in Margaritas & Cocktails and the Jamaica and Jalapeño cards on `/margaritas`. Pick one ground. |
| M5 | **The item photo row on `/happy-hour` is new**, added because the page had no per-item photo slots. Keep it or drop it. |
| M6 | **`/fajitas-molcajetes` "Big plate, Big Mami."** now sits beside tacos and margaritas. The molcajete, fajita and Big Mamis photograph is still wanted, or the heading changes. |
| ~~M7~~ | **Done 9 October**, entry 99. The hero pill is removed and the heading reads "Long Tables, International Room". |
| M8 | **`/margaritas`:** Watermelon, Lychee and Coconut cards have no photograph, so the flavour grid has four tall cards and three short ones. |
| M9 | Still not supplied: Big Mami, the agua fresca station, malteadas, birria with a cantarito, the new Wednesday flyer (P12). Tomas' headshot arrived and is placed, entry 100. |
| M10 | **Visible to visitors:** `/private-parties`, Spaces section. Vallarta, Tulum and The Whole House show `need-image.svg`, which reads "PHOTOGRAPH PENDING / NEED IMAGE / Replace before launch". Needs photographs (R16) or a neutral treatment in the meantime. Entry 99. |
| M11 | **`/happy-hour` layout shift, 0.141**, the hero photograph pair moving, present on `main`. Likely D7, the font swap. Worth 6 Lighthouse points on that page. |
| M15 | Homepage dish data in `Base.astro`, Tamarindo: "Pulp cooked in our kitchen" and "tamarind pulp we cook in our own kitchen, not a syrup". Not the phrase entry 99 was asked to change; confirm whether it should also say "made from scratch in-house". |
| M16 | Two placeholder pills still in the markup but not visible: the quinceañeras hero (`display: none`) and the homepage chef caption (removed by script). Delete from the markup when convenient. |

### For Mario (SEO, not actioned)

| # | Item |
|---|---|
| M12 | `/street-tacos` `ogImage` is still `tacos-de-arrachera-hero.jpg` (P6). The hero is now the trompo; `/videos/street-tacos-trompo.jpg` is its still. |
| M13 | `/margaritas` `ogImage`: check it still suits the page now the hero is the handcrafted margaritas. |
| M14 | `npm run check-build` fails since `8ad1d75`: it still walks `/quesabirria-tacos`, which is deleted and redirected. Remove the route from the `design/` JSON the checker reads, `design/SEO.json` and its siblings, and from the page table in `CLAUDE.md`. |
