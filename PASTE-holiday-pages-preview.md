# Build 3 new pages as unpublished previews: /holiday-parties/, /new-years-eve/, /birria-ramen/

## What I want
Three new pages live on senortequilas.com at their final addresses, so I can send the client the links and he can see the real pages on the real site. But they are **not published yet**: nobody can find them unless they have the link, and Google must not index them. When the client approves, publishing is a one-line change per page, with no URL change and no redirects.

## Inputs
- **Copy:** `design/copy/holiday-pages-copy-2026-10-24.md`. Use the text verbatim: headings, body, FAQs, buttons, small labels ("Eyebrow"). Lines starting `> PENDING` are build notes, not page copy. Read them and follow them. The schema notes are at the bottom of the file.
- **Pattern to copy:** `src/pages/friendsgiving.astro`. Same layout, typography, section rhythm, FAQ handled as one list that renders both the accordion and the FAQPage schema, JSON-LD built from `business.json`, the Toast Tables reserve link, the inquiry form behaviour, phone and desktop styles. Match it; do not invent a new design.
- **Photos:** existing site images only, no stock. Holiday Parties: private room photos from `/private-parties/` (International Room set up, Mexican Room, Indoor Patio, bar area). New Year's Eve: DJ and bar-area night photos already on the site (game-day, late-night, Friendsgiving galleries). Birria Ramen: `/images/dishes/birria-ramen.jpg` and the other birria shots on `/birria-tacos/`. Alt text written from the photo.

## Preview mode (the important part)
Add one switch that controls all three pages, e.g. `src/data/preview-pages.ts` exporting the list of paths still in preview:
```ts
export const PREVIEW_PAGES = ['/holiday-parties/', '/new-years-eve/', '/birria-ramen/'];
```
While a page is in that list:
1. **noindex:** the page outputs `<meta name="robots" content="noindex, nofollow">` (add a `noindex` prop to `Base.astro` if it doesn't have one) and its canonical tag is left out.
2. **Header too:** add an `X-Robots-Tag: noindex, nofollow` header for those three paths in the Vercel config, generated from the same list or kept in step with it.
3. **Not in the sitemap:** `src/pages/sitemap.xml.js` skips any path in `PREVIEW_PAGES`.
4. **Not linked from anywhere:** no nav, footer, mobile menu, homepage carousel, dish strip, or links from other pages. Links *between* the three preview pages are fine.
5. **Visible preview bar:** a thin bar at the very top of each preview page, above the header: "Preview for Señor Tequila's review. This page is not published yet." Small, readable on phones, styled to match the site. It must disappear automatically when the page leaves `PREVIEW_PAGES`.
6. **Do not** use robots.txt to block them. A robots.txt block stops Google from seeing the noindex tag.
7. Forms and buttons on the preview pages must work for real (call, Toast Tables, inquiry form). The client should be able to test them.

Publishing a page later = remove its path from `PREVIEW_PAGES`. Write a short comment at the top of `preview-pages.ts` saying exactly that, and listing what the separate publish step will also do (see "Not now" below).

## Page notes
**/holiday-parties/**
- The rooms table is a real HTML table, not cards.
- Gift box section gets the anchor `#gift-box` (New Year's Eve links to it).
- Entertainment link goes to `/private-parties/#entertainment`. Check that anchor exists, add it if not.
- Schema: Restaurant node from business.json, `Service` with an `OfferCatalog` (fajita buffet 26 USD per person; weekday room minPrice 200 USD per hour; upgrades minPrice 499 USD), `EventVenue` via extraTypes with maximumAttendeeCapacity 400, `FAQPage` (7). No review or rating markup.

**/new-years-eve/**
- Hero image: best existing DJ or bar-at-night photo. `> PENDING` note explains why.
- Timeline (3 PM, Dinner, 9 PM, Midnight, 2 AM) styled like the Friendsgiving timeline.
- Private room form: Name, Phone, Email, Guest count, Tell us about the night. Same handler as the other inquiry forms.
- Schema: `Event` "New Year's Eve Masquerade Party", 2026-12-31T21:00:00-05:00 to 2027-01-01T02:00:00-05:00, offers 5 USD, location the Restaurant node; `FAQPage` (7).

**/birria-ramen/**
- Schema: `MenuItem` "Birria Ramen" (offers 21 USD, menuAddOn "Salsa diabla"). If `/menu/` already outputs a Menu node, reference the item by `@id` instead of duplicating. `FAQPage` (7). No Recipe schema.
- Person "Roberto Rivas", co-owner, worksFor the Restaurant node, tied to the quote.

All three: title tag and meta description exactly as in the copy file.

## Not now (this is the publish step, a later prompt)
Leave these alone so nothing about the live site changes today:
- Sitemap inclusion, nav, footer, homepage cards (Holiday Parties now, NYE from Dec 1), dish strip.
- Internal links from other pages and the blog posts to these three.
- The New Year's blackout line on `/private-parties/` and its child pages.
- `business.json` special holiday hours.
- Requesting indexing in Search Console.

## Rules
- No em dashes or en dashes anywhere, including alt text and meta. No semicolons in body copy.
- Do not change any existing page's look or content. The only edits to shared files are: the `noindex` prop in `Base.astro`, the sitemap filter, the Vercel header rule, and the new `preview-pages.ts`.
- Put a `// PENDING ROBERTO Qn` comment in the code at each `> PENDING` spot so I can find them when he answers.

## Check before you hand it back
1. `npm run build` passes with no new warnings.
2. In the built output for each of the three pages: the robots meta says noindex, nofollow, there is no canonical tag, the preview bar shows.
3. `sitemap.xml` does not list any of the three. No other page's HTML contains a link to them (grep the build output).
4. Every other page still has no noindex tag (grep), and the homepage and `/friendsgiving/` look the same as before.
5. Screenshots of all three pages at 390px and 1440px, top to bottom.
6. The forms submit and the Reserve and Call buttons point to the right places.

Show me the screenshots and the checks. When I say go, commit and push so the three links work on senortequilas.com.
