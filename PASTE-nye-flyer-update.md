# /new-years-eve: new facts from Roberto and the flyer in the hero

Roberto sent the official NYE flyer and changed several facts. Update the page, the homepage card and the schema so they match. Then rework the hero so the flyer is the visual, without losing any SEO text.

The flyer images are already in the repo:
- `public/images/site/nye/nye-2027-flyer-1080.webp`
- `public/images/site/nye/nye-2027-flyer-720.webp`
- `public/images/site/nye/nye-2027-flyer-480.webp`
- `public/images/site/nye/nye-2027-flyer.jpg`

All four are 3:4 portrait, 1080x1440 at full size. The JPG is for social shares and schema. The source PDF is in Mario's files, not the repo.

The usual rules apply: CLAUDE.md, STANDARDS.md, no em or en dashes, no semicolons in body copy, and log the work in `DESIGN-DEBT.md`.

## 1. What changed (Roberto, Oct 26)

| | Was on the page | Now |
|---|---|---|
| Masquerade / 21+ start | 9 PM | **8 PM**. The bar area is 21+ only after 8 PM. |
| DJ | "DJs" | **DJ Gerra, 8 PM to 2 AM** |
| Cover | $5 | **$15 bar cover**. It includes a mask, party favors and the champagne toast. |
| Champagne toast | "on us" / "complimentary" / "free" | Included in the $15 bar cover |
| Masks | "limited number at the door while they last, bring your own" | Included in the $15 bar cover |
| Dress code | none (PENDING Q1) | **Business casual. No sneakers, no jeans. Strictly enforced.** |
| Bar area | first come, first served | Unchanged (the flyer says it too) |

Unchanged: doors at 3 PM, dinner off the full menu in the dining rooms, all ages all night, Toast Tables for groups under 20, close at 2 AM, last call 1:45, private rooms "available, holiday rates apply", and the gift box.

## 2. The hero: put the flyer in without killing SEO

The flyer is a picture of text. Google and AI answers don't reliably read text inside an image. So the flyer is the visual, and every fact on it must also appear on the page as real HTML text. The H1, the lead paragraph and the fact chips stay as text.

**Layout.** Keep the double gold frame (`SignFrame`) and the poster feel. The Friendsgiving hero (flyer beside the copy, `fg-hero-media`) is the pattern to follow.

- **Desktop (1024 and up):** two columns inside the frame.
  - **Left (about 55%), in this order:**
    1. Eyebrow.
    2. Countdown, scaled down from 200px to about 110 to 130px so it doesn't fight the flyer.
    3. H1.
    4. Lead paragraph.
    5. Fact chips.
    6. The three CTAs.
  - **Right (about 45%):** the flyer at 3:4. Give it a gold hairline border, 16px radius and the same drop shadow as the Friendsgiving flyer, with an optional slight tilt (about -2deg) that straightens on hover. Clicking it opens the full 1080 image. Use the site's existing lightbox if one is easy to reuse; otherwise link straight to the image.
- **Phone (390):**
  1. Eyebrow.
  2. Countdown.
  3. H1.
  4. Lead.
  5. CTAs.
  6. The flyer, full width up to 340px, centered.
  7. Fact chips.

  The text comes first so the H1 is what Google and the visitor see first.
- **Background:** drop the Ken Burns bar photo behind the hero. The flyer brings the imagery now, and two images compete. Use the dark field with a soft gold radial glow that echoes the smoke in the flyer. Remove the background `<img>` entirely rather than hiding it, so it isn't downloaded.

**Image markup:**
- A `<picture>` or `<img>` with `srcset` 480w, 720w and 1080w, and `sizes="(min-width: 1024px) 40vw, (min-width: 768px) 50vw, 90vw"`.
- `width="1080" height="1440"` so there's no layout shift.
- `loading="eager"` and `fetchpriority="high"`.
- Update the `/new-years-eve` entry in `Base.astro`'s `LCP_IMAGE` map to the flyer (same srcset and sizes). Don't animate the flyer on load. STANDARDS says nothing above the fold starts hidden.
- Alt text, exactly: "Señor Tequila's 2027 New Year's Eve Masquerade Party flyer: DJ Gerra 8 PM to 2 AM, $15 bar cover includes mask, party favors and champagne toast, dress code business casual, no sneakers, no jeans, strictly enforced, first come, first served, 20021 Century Blvd, Germantown, Maryland"

**SEO additions:**
- Set `og:image` and `twitter:image` for this page to `/images/site/nye/nye-2027-flyer.jpg`, so shared links show the flyer. Use Base's existing prop if there is one, otherwise add one.
- Set the masquerade Event schema's `image` to the flyer JPG's absolute URL. Event rich results use it.

## 3. Copy changes (exact text)

**Countdown:**
- `COUNTDOWN_TARGET = '2026-12-31T20:00:00-05:00'`.
- Fallback: "Thursday, December 31 · 8 PM".
- Caption: "8 PM. The masquerade begins in the bar area."

**Hero lead** (replaces the current paragraph):
> Dinner for the whole family off the full menu, in the dining rooms, all night. Then the masks go on in the bar area: DJ Gerra from 8 PM, a countdown, and a champagne toast at midnight. The bar area is 21 and over after 8 PM, with a $15 cover at the door that includes your mask, party favors and the toast. Business casual, and we do not close until 2.

**Hero fact chips** (replace the current set):
- "Dinner · full menu · all ages"
- "8 PM · masquerade · bar area 21+"
- "$15 bar cover · mask, favors, champagne toast"
- "DJ Gerra · 8 PM to 2 AM"
- "Business casual · no sneakers, no jeans"

**Timeline (FlyerCards):**
- **The 9 PM card becomes the 8 PM card.** Time "8 PM", title "The masquerade begins", tag "21 and over · $15 cover". Body:
  > The masquerade begins in the bar area, which turns 21 and over. The $15 cover, paid at the door, includes your mask, party favors and the midnight champagne toast. DJ Gerra plays from 8 PM to 2 AM, Spanish and English, sound up.

  Keep the `PENDING ROBERTO Q4` comment (card only or not) right above it.
- **Midnight card body:** "The countdown, then the champagne toast in the bar area."
- **The `.ny-masks` line under the timeline (the page's one Special Elite moment)** becomes:
  > Dress code: business casual. No sneakers, no jeans. Strictly enforced at the door. Your mask comes with the cover.

  Delete the `PENDING ROBERTO Q1` comment. It's answered.

**Dinner section:** "and it fills before 9" becomes "and it fills early".

**Close:** "let the masks find you at 9" becomes "let the masks find you at 8".

**FAQ** (same single list for the accordion and the FAQPage schema):
- "Is the New Year's Eve party 21 and over?"
  > The bar area is 21 and over from 8 PM, and that is where the masquerade, DJ Gerra and the cover are. The dining rooms stay open to all ages the whole night, so families can eat late and still hear the countdown.
- "How much is the cover on New Year's Eve, and are there tickets?"
  > No tickets, no tiers. A $15 cover for the bar area after 8 PM, paid at the door, and it includes your mask, party favors and the champagne toast at midnight. Dinner in the dining rooms has no cover.
- "Do I need a mask?"
  > It is a masquerade, so yes, and your mask comes with the $15 bar cover.
- **New FAQ, after the mask question:** "Is there a dress code for New Year's Eve?"
  > Yes. Business casual. No sneakers and no jeans, and it is strictly enforced at the door.
- "Can we reserve a table in the bar area for the countdown?" Change "it fills before 9" to "it fills early".
- Leave the other FAQs as they are. There are now 8.

**Title tag:** unchanged.

**Meta description** (156 characters):
> NYE in Germantown, MD: dinner for the family, then a masquerade in the bar with DJ Gerra and a champagne toast. $15 bar cover, 21+ after 8 PM. Open to 2 AM.

## 4. Schema
**Masquerade Event:**
- `startDate` `2026-12-31T20:00:00-05:00`.
- `description`: "A masquerade in the bar area with DJ Gerra, a countdown and a champagne toast at midnight. 21 and over in the bar area after 8 PM. The $15 cover includes a mask, party favors and the champagne toast. Business casual dress code."
- `offers.price` `'15'`.
- `offers.description`: "Bar area cover after 8 PM. Includes a mask, party favors and the champagne toast. Dinner in the dining rooms has no cover."
- Add `performer: { '@type': 'Person', name: 'DJ Gerra' }`.
- `image`: the flyer JPG's absolute URL.

**Dinner Event:** `endDate` `2026-12-31T20:00:00-05:00`.

## 5. Homepage card (`UpcomingEvents.astro`, id `new-years-eve`)
- `dates`: "Thu, Dec 31 · Dinner, then 8 PM to 2 AM".
- `details`:
  - "New Year's Eve masquerade: dinner for the family, DJ Gerra, a countdown and a champagne toast at midnight"
  - "$15 bar cover: mask, party favors, champagne toast"
  - "Bar area 21+ after 8 PM"
  - "Business casual, no sneakers, no jeans"
- `photo`: the flyer, `/images/site/nye/nye-2027-flyer-720.webp`, with the alt text above shortened to "The 2027 New Year's Eve Masquerade Party flyer". It should display like the Friendsgiving and Halloween flyer slides.
- `startDate` `2026-12-31T20:00:00-05:00`, `offers.price` `'15'`.
- Update the comment above the holiday entries. NYE now has a flyer.

## 6. Everywhere else
- Grep `src` for NYE mentions of "$5", "9 PM", "on us", "complimentary", "free champagne" and "limited number". Fix any that refer to New Year's Eve. **Don't touch** the regular weekend "9 PM to 1 AM" DJ lines on `/` and `/late-night`, or Friendsgiving's "$5 cover".
- Update the NYE section of `design/copy/holiday-pages-copy-2026-10-24.md` to the new text, so the copy file stays the source of truth.
- Update the comment near the top of `new-years-eve.astro` that lists allowed prices to include the $15 cover.
- Q2 (last year's photos) stays PENDING for the private room and other photos, but the hero is now done. Edit that comment to say so.

## 7. Open question (don't block on it)
The flyer puts the champagne toast inside the $15 bar cover. Do dining room guests also get a toast at midnight? Until Roberto answers, say the toast is in the bar area, as written above. Add `// PENDING ROBERTO Q6: toast for dining room guests too?` at the Midnight card.

## 8. Checks, then commit and push
1. `npm run build` and `npm run check-build` pass.
2. On `/new-years-eve`:
   - The H1 is unchanged.
   - Every fact on the flyer is also in the page text (grep the built HTML for "DJ Gerra", "$15", "8 PM", "business casual", "no sneakers").
   - The FAQPage schema has 8 entries matching the accordion.
   - The Event JSON-LD shows `20:00`, price `15`, `performer` and the flyer `image`.
3. No "$5", "9 PM", "on us", "complimentary" or "free champagne" left in NYE contexts (grep `dist/` for the NYE page and the homepage).
4. Mobile Lighthouse on `/new-years-eve`, 3 runs: performance 90 or above, CLS under 0.05, LCP under 2.5 s. Report LCP's element.
5. Screenshots of the hero at 390, 768 and 1440, plus the timeline, the dress code line and the homepage NYE slide.

Commit and push when the checks pass. Report back with the check output, the screenshots and the commit hash. I'll request reindexing in Search Console afterwards.
