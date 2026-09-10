# Phase 2 findings

The reference set rendered cleanly. The mobile cross-check surfaced one real design bug and
one thing about the previews that changes how the numbers should be read.

## 1. The desktop nav is never hidden, so every page scrolls sideways on a phone

**This is a design bug, not an extraction bug, and it is not fixed.** Hiding a nav is a
layout decision, so it needs a human call.

The header's right-hand cluster is a `display: flex` row holding the desktop `<nav>`, the
Reserve and Order links and the hamburger button. The `<nav>` computes to `display: flex` at
**every width from 360 to 1920**. Nothing in the stylesheet ever hides it, and the hamburger
is present at every width too, so both navigations are on screen at once on a phone.

Measured on the extracted pages:

| viewport | document scrollWidth | overflow |
|---|---|---|
| 360 | 641 to 710 | +281 to +350px |
| 390 | 642 to 711 | +252 to +321px |
| 414 | 643 to 712 | +229 to +298px |
| 768 and above | equals the viewport | none |

It affects **all 20 pages**, and it is not confined to phone widths. Binary search on the
exact threshold, per page:

| page | last overflowing width | first clean width |
|---|---|---|
| home | 723 | 724 |
| karaoke | 652 | 653 |

So the page scrolls sideways at every width from 360 up to roughly 650 to 723 depending on
how many links that page's nav carries. Everything is clean by 768. The overflow amount
shrinks as the viewport grows because the cluster is a fixed width and the viewport is
catching up to it.

Two consequences:

- Phase 4 checks "no horizontal scroll at 360, 390, 768, 1024, 1440, 1920". As things
  stand that check fails on all 20 pages at 360, 390 and 414.
- Phase 4 also checks that the Order Online control is visible without scrolling at 390x844.
  It currently sits inside the overflowing cluster.

The designed mobile artboards do not have this problem because **their markup omits the
desktop nav entirely**. It is absent from the DOM, not hidden by CSS. So the design shows
what mobile should look like without ever expressing it as a rule the responsive page can
follow.

## 2. The responsive CSS is otherwise exact, and the previews are not like-for-like

The homepage is the only mobile preview without `data-force-mobile`, so it is the only true
apples-to-apples comparison: the same document, laid out by the same media queries
production will use.

| page | designed artboard | responsive page | height delta | diff inside 390 |
|---|---|---|---|---|
| home | 390x7356 | 711x7356 | 0px | 0.09% |

Identical height to the pixel, and **all 2,716 differing pixels fall in the first 200px
band, the header**. Below the header the responsive layout reproduces the designed mobile
artboard exactly. The only difference is bug 1.

The other seven previews are forced into mobile by an attribute and are separately authored
markup, so their numbers measure the gap between two different documents rather than a
responsive failure:

| page | designed artboard | responsive page | height delta | diff inside 390 |
|---|---|---|---|---|
| menu | 390x11687 | 642x21519 | +9832px | 50.93% |
| private-parties | 390x7685 | 679x13666 | +5981px | 49.12% |
| takeout-delivery | 390x6429 | 642x6460 | +31px | 18.30% |
| late-night | 390x2818 | 642x2850 | +32px | 14.51% |
| happy-hour | 390x3587 | 642x3622 | +35px | 13.88% |
| catering | 390x6391 | 678x6435 | +44px | 10.62% |
| quesabirria-tacos | 390x4416 | 642x4445 | +29px | 7.49% |

menu and private-parties are the outliers: the responsive page is roughly twice the height
of the artboard, because a multi-column desktop layout stacks into one long column at 390
while the drawn preview uses a purpose-built compact layout. The other five differ by 29 to
44px in height, which is small.

## 3. A harness bug found and fixed

The anti-aliasing forgiveness pass compared RGB while ignoring alpha. Transparent padding
reads as black, and against this design's near-black surfaces it fell inside the 32-per-
channel tolerance, so a size mismatch could be forgiven instead of counted. A synthetic
100x100 against 200x100 scored 0.00% where it should score 50%.

Fixed: pixels where only one image has data are counted directly and are never eligible for
forgiveness. `scripts/gate-a.mjs` now imports the one shared implementation from
`scripts/lib/render.mjs`, so Phase 2 and Phase 4 cannot drift apart.

**Gate A was not affected.** All 20 pages matched dimensionally there, so no padding ever
existed. Gate A re-run after the fix returns identical numbers, karaoke still 0.631%.
