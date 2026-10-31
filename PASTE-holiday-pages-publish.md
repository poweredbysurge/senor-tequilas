# Publish /holiday-parties, /new-years-eve, /birria-ramen and link them into the site

The three pages are approved. Take them out of preview mode, link them from the right places, fix the site-wide facts they depend on, then commit and push.

Rules from `CLAUDE.md` and `STANDARDS.md` still apply:
- No em or en dashes.
- No changes to how any existing page looks, apart from the links and lines listed here.
- New link lines use the existing `LINK` / link style of the page they sit on.
- Log the work in `DESIGN-DEBT.md`.

## 1. Leave preview mode
- In `src/data/preview-pages.ts`, empty `PREVIEW_PAGES` (`[]`). Keep the file and its comment for next time.
- Remove the three `X-Robots-Tag` rules from `vercel.json`.
- Expected result on all three pages:
  - The preview bar is gone.
  - No robots noindex meta tag.
  - A canonical tag (`https://www.senortequilas.com/<path>`).
  - Listed in `sitemap.xml` with today's `lastmod`.

## 2. Navigation
- **Footer (`Footer2`) and mobile menu (`MobileMenu`):** add "Holiday Parties" and "New Year's Eve". Put them next to Private Events, or in the events group if there is one.
- **Desktop header (`Header5`):** if Private Events has a dropdown, add "Holiday Parties" to it. If not, don't add a new top-level item. The header is full, and the footer, mobile menu and homepage cover it.
- **Birria Ramen:** no nav item. It's a dish page, linked from the dish pages below.

## 3. Homepage (`/`)
- **Upcoming Events carousel (`UpcomingEvents.astro`):**
  - Add a Holiday Parties card and a New Year's Eve card, in date order after Friendsgiving.
  - Use the homepage card text from `design/copy/holiday-pages-copy-2026-10-24.md` ("HOMEPAGE CARD" sections) and each page's hero photo.
  - Cards link to `/holiday-parties` and `/new-years-eve`.
  - Halloween ends Oct 31. Leave that card's own logic alone.
- **Dish strip (`DishCrossLinks1` or the homepage dish row):** add Birria Ramen using the "HOMEPAGE DISH CARD" text and `/images/dishes/birria-ramen.jpg`, linking to `/birria-ramen`.

## 4. Contextual links (exact lines, use as written)
Place each line where it reads naturally in the section named. Anchor text is in brackets.

**/private-parties**
- Near the top, under the hero or above the rooms: "Planning a company or family party for November or December? See [holiday parties], with the rooms dressed for the season and the fajita buffet from $26 a person." Links to `/holiday-parties`.
- Find the line that lists New Year's as a blackout date. Change it to: "We are closed December 24 and 25. On New Year's Eve, private rooms are available at holiday rates, see [New Year's Eve]." Links to `/new-years-eve`.
- Make the same blackout fix on the child pages that carry the line (`/private-parties/quinceaneras-celebrations`, `/private-parties/weddings-receptions` and any other). Grep for "New Year".

**/catering**
- Near the top or the closing CTA: "Would rather hold the party here? See [holiday parties in our private rooms]." Links to `/holiday-parties`.

**/friendsgiving**
- Resolve the `<!-- TODO link /holiday-parties when it ships -->` with a link to `/holiday-parties`, anchor "holiday parties".

**/birria-tacos**
- The existing birria ramen card or photo (the `aria-label` "A bowl of birria ramen...") becomes a link to `/birria-ramen`.
- Add or keep a visible text link with the anchor "Birria Ramen".

**/menu**
- Make the Birria Ramen item name a link to `/birria-ramen`. Use the menu's existing link style if items link anywhere; otherwise a quiet underline on hover.

**/takeout-delivery**
- The birria ramen card (it already uses `birria-ramen.jpg`) links to `/birria-ramen`.

**/late-night**
- Add one line where hours or special nights are mentioned: "On New Year's Eve we stay open until 2 AM, with a masquerade in the bar area. See [New Year's Eve]." Links to `/new-years-eve`.

**Blog**
- If the birria ramen blog article or any holiday article is in this repo, link each to its page with descriptive anchor text. If the blog lives elsewhere, list it in your report and I'll handle it.

When you're done, each page should have at least 4 links in from other pages, not counting the nav, footer and the three pages linking each other.

## 5. Site-wide facts the pages depend on
- **`business.json` `specialOpeningHoursSpecification`** (it feeds the schema and the hours widget):
  - Nov 25: 15:00 to 01:00.
  - Nov 26: closed (Thanksgiving).
  - Nov 27: 15:00 to 01:00.
  - Dec 24: closed.
  - Dec 25: closed.
  - Dec 31: 15:00 to 02:00.
  - Jan 1: 15:00 to 01:00.

  These match the Google Business Profile, set Oct 22. Check that the hours widget handles a close after midnight.
- **Braise time:** any remaining "six hours" or "twelve hours" braise mention on the site becomes "eight hours". Grep `src` for "six hours", "6 hours", "twelve hours" and "12 hours" near birria.
- **`Base.astro` `LCP_IMAGE` map:** confirm all three pages have their hero entry.

## 6. Checks before you push
1. `npm run build` and `npm run check-build` pass with no new warnings.
2. Every canonical in `dist/` matches a `<loc>` in `dist/sitemap.xml` (the CLAUDE.md rule). The three new URLs are in the sitemap.
3. No page in `dist/` has a noindex tag (grep). `vercel.json` has no X-Robots-Tag for these paths.
4. Grep `dist/` and print every page that links to each of the three paths. Confirm the count from section 4.
5. No `—` or `–` in any changed file.
6. Screenshots at 390 and 1440 of every spot you changed: the footer, the mobile menu, the homepage cards, and each new link line.

If all the checks pass, commit and push to main and report back with the check output, the screenshots and the commit hash. Don't request indexing yourself. I'll submit the sitemap and request indexing in Search Console once the deploy is live.
