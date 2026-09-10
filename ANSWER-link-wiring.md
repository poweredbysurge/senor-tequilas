# Link wiring: decisions, and the two URLs you needed

Paste this into Claude Code.

---
---

Both questions answered, and the Google and Yelp problem is solved rather than deferred.

## First, the framing, because this looks worse than it is

Three hundred and forty-nine dead links is not a defect in the design work. Claude Design produces artboards, and artboards do not navigate. Nav labels were drawn as visual elements because that is what they are in a canvas: type on a header, not a destination. A bare `#` is what a design tool emits when a link has no meaning yet. Finding zero real internal paths in an artboard export is the expected result, not a surprise.

What it does mean is that Phase 3 step 5 is a bigger job than the plan implied, and that it is not janitorial. This site's entire SEO architecture rests on internal linking: dish pages feeding `/menu` and `/takeout-delivery`, the events cluster cross-linking between the hub, quinceañeras, weddings and catering, the local page pointing back at the money pages. Twenty pages with no internal links is twenty orphans. So treat this step as implementing the internal linking strategy, not as filling in blanks.

## Question 2 first, because it is now closed

You do not need the client. Both URLs exist and both are verifiable.

**Yelp** is `https://www.yelp.com/biz/senor-tequilas-germantown-2`. Confirmed as the right listing: 20021 Century Blvd, Germantown, Mexican, 576 reviews, 762 photos. Use the `www` host, not the `m.` mobile variant that also appears in search results.

**Google** you can construct deterministically from the Business Profile ID we pulled live earlier in this engagement, place_id `ChIJfQWUP2wstokR0hf-aq2yO5Y`. Which URL depends on what those twenty controls are for, so look at what surrounds them and pick:

- To view the listing and its reviews: `https://www.google.com/maps/place/?q=place_id:ChIJfQWUP2wstokR0hf-aq2yO5Y`
- To leave a review: `https://search.google.com/local/writereview?placeid=ChIJfQWUP2wstokR0hf-aq2yO5Y`

If the label sits in a proof strip next to a star rating, it is the first. If it sits under something asking for feedback, it is the second. Tell me which context you found and which you chose.

**One warning while you are in the external links.** A search for this restaurant surfaces `facebook.com/senortequilasgermantown`, and that is the *old* page, inactive since March, which the client is in the middle of merging away. The design's `facebook.com/senortequilasDMV` is the current one and is correct. Do not "fix" it. Leave every external link the design already has exactly as it is; you confirmed they are in good shape and they are.

## Question 1: do it now, as data, without touching the extracted pages

Do the wiring now, before the mobile menu, for the reason you gave: the panel's eight links stop being a special case and become eight rows of one table.

But do not edit `design/pages/`. Those files are the Gate-A-verified record of what the design actually is, and the chain of trust runs through them. The moment they contain our corrections they stop being the design and become the design plus some edits nobody can separate later.

So produce `design/LINK-MAP.json` instead: a data artifact, reviewed once, applied during Phase 3 when markup moves into `src/pages/`. One row per link that changes, carrying the page, the link's label text, its current href, its new destination, and a confidence field of `mechanical`, `proposed` or `unresolved`.

This works cleanly because **rewriting an href changes no pixels.** The reference set is unaffected by any of it, so nothing has to be regenerated for this step. The only thing that still invalidates the 390 and 768 references is the nav rule, exactly as you said.

That gives us a clean separation worth keeping for the rest of the project. `design/pages/` is the design, untouched. A small explicit overlay carries every deliberate deviation: one CSS file for the nav rule, one component for the mobile panel, one link map. `DESIGN-DEBT.md` describes that overlay in prose. When a future export lands, you re-extract and re-apply the overlay instead of rediscovering all of this.

## How to fill the map

**The 267 mechanical ones.** Your six rules plus the logo are right. Mark them `mechanical` and I will spot-check rather than read every row.

**The 21 cross-page anchors.** Do not infer these from labels alone. `design/brief/seo-migration-kit-and-page-spec.md` specifies the internal linking plan, including that every dish page links back to `/menu` and `/takeout-delivery` and how the events cluster cross-links. Take the destinations from that document where it speaks, and mark anything it does not cover as `proposed`.

**The ~42 body CTAs.** Bring me the table with your proposed destination for each and a confidence on every row. Flag the ambiguous ones explicitly rather than picking quietly; a "See the Bar" that could mean `/tequila-bar` or `/happy-hour` is exactly the kind of thing I want to decide rather than discover later.

**Nothing stays `unresolved`** unless you genuinely cannot determine it, and if any row ends up there, stop and tell me rather than shipping a live `#`.

## Then

Map first. I review it. Then the mobile panel with its eight links drawn from the same map, then the nav rule and its three verifications, then the reference regeneration at 390 and 768, then the chips question, then Phase 3.

One thing to add to `DESIGN-DEBT.md` while it is fresh: the header nav in the design points at nothing on all twenty pages. That is the single most important thing for the next Claude Design pass to know, because if it is not fixed upstream, every future export will need this same map applied again.

Sources for the two URLs: [Yelp listing](https://m.yelp.com/biz/senor-tequilas-germantown-2), [Toast ordering](https://www.toasttab.com/local/senortequilastogo/r-d94fa749-fbd5-4a66-90b6-d7755b8c3af3)
