# Redesign the 3 preview pages: /holiday-parties/, /new-years-eve/, /birria-ramen/

## Why we are redoing them
The pages work, but they read as a template. Every section is the same unit: small label, H2, three or four paragraphs, on a near-black background that only changes by 2 RGB points (`rgb(18,18,16)` / `rgb(20,18,16)`). Holiday Parties alone has 24 body paragraphs. There is one static image per screen at best, no video, no motion, no interaction, no numbers you can see at a glance, and nothing that shows the rooms, the food or the night better than words do. It looks like a document wearing a website.

The target is the feel of a $10k custom build: media first, every section built for its job, the copy cut into pieces people actually read, and a few interactions that make the page feel made for this restaurant.

**Keep:** preview mode exactly as built (noindex, no canonical, X-Robots header, out of sitemap, no inbound links, preview bar), all JSON-LD, title tags and meta, the FAQ list feeding both accordion and FAQPage schema, the inquiry form handler and the `org` field name (the `company` field is the honeypot), Toast Tables and call links, every `// PENDING ROBERTO Qn` comment.

**Read first:** `CLAUDE.md`, `STANDARDS.md` (especially the reveal-on-scroll rules, the text-over-photo contrast table, and "check the asset library before inventing a treatment"), and `DESIGN-DEBT.md` entry 66 for the existing scroll-reveal work. Reuse what is already there before writing anything new. The repo rules still hold: no Tailwind, no client framework, no CSS conversion, the fixed breakpoints (390, 768, 1024, 1440), the five embedded fonts only, no stock or generated images, no em dashes.

---

## Rules that kill the template look (apply to all three pages)
1. **No section may be label + H2 + paragraphs alone.** Every section carries a real visual or interactive element: photo, video, table, stat, switcher, rail, timeline, map, quote.
2. **Text budget:** no paragraph over 45 words, no section over about 90 visible words. Longer approved text goes into captions, card bodies, a "Details" disclosure, or the FAQ. Do not rewrite facts or prices. If you drop or split any approved sentence, list it in your report so I can tell the client.
3. **Background rhythm:** never two sections in a row on the same field. Alternate full-bleed media bands, the dark field, and one warm light section per page (cream `rgb(246,239,228)` with dark ink). Look for the site's existing textured fields first (STANDARDS 21) and reuse them.
4. **Type scale with intent:** H1 in Archivo Black, oversized (clamp roughly 56px to 128px), tight leading. Big numerals for prices and capacities. Barlow Condensed uppercase for labels and chips. Special Elite only for one handwritten-feeling accent per page (a caption, a note), never body.
5. **Asymmetry:** left-aligned grids, images that bleed off one edge, mixed column widths. Centered-everything only for the closing CTA.
6. **Photos large:** on desktop, imagery takes at least 40% of most sections. Every photo gets a short true caption (room name, dish name). Real site photos only. A missing photo stays a labeled placeholder and goes in the report as a photo request.
7. **No slop tells:** no emoji, no generic icon sets, no gradient blobs, no glass cards everywhere, no fake badges ("#1 in Maryland"), no invented stats.
8. **Every number shown must exist in the copy file, `business.json` or `src/lib/reviews.js`.** If a stat isn't in one of those, it doesn't go on the page.

## Motion rules
- Reuse the site's existing reveal script and follow STANDARDS: never animate above the fold, hidden state set by JS not CSS, opacity and transform only with a named transition list, a one-line kill switch.
- Allowed motion: staggered reveals, count-up numbers (once, on enter), slow Ken Burns on still hero photos, crossfades in switchers, a scroll-linked progress line on timelines, an infinite photo marquee (pauses on hover and focus), hover lift on cards.
- `prefers-reduced-motion: reduce` turns all of it off: no count-up (final value shown), no marquee movement, no Ken Burns, video shows its poster.
- Vanilla JS only, one small shared module. No animation library.

## Shared components (build once in `src/components/premium/`, use on all three pages)
Build them generic so future pages can use them too.
- **MediaHero:** full-bleed video or photo, dark scrim tuned to the STANDARDS contrast table, giant H1, one-line lead, two CTAs, and a fact rail of 3 or 4 chips along the bottom. Video: `autoplay muted loop playsinline preload="metadata"`, poster always set, same pattern as the `/game-day/` hero. Add each page's hero to the `LCP_IMAGE` map in `Base.astro`.
- **StatStrip:** 3 to 5 big numbers with short labels, count-up on enter.
- **RoomSwitcher:** tabs (room name + capacity) on the left, large crossfading photo on the right, details under the photo. On phones it becomes a swipeable rail. Proper ARIA tabs, arrow keys work.
- **BentoGrid:** mixed-size image tiles with a title, one line and a price chip.
- **CardRail:** horizontal scroll-snap rail of photo cards, with arrows on desktop and swipe on phones (follow the `/game-day/` card rail pattern).
- **StepLine:** numbered steps joined by a line that draws as you scroll.
- **ScrollTimeline:** time stops on the left, a sticky photo on the right that changes per stop (desktop). On phones it stacks with inline photos.
- **PhotoMarquee:** two rows of real party photos drifting in opposite directions. Tap a photo to open the existing lightbox from `UpcomingEvents.astro`.
- **ProofSplit:** a portrait of the family or the team, one large pull-quote review, and the rating line from `reviews.js` (text only, no rating schema).
- **FaqTwoCol:** sticky heading and call card on the left, accordion on the right with a smooth height animation. Same single FAQ list feeding the schema.
- **StickyCTA:** on phones, a bottom bar (Call · Reserve · Inquire) that appears after the hero and hides near the form. On desktop, a slim in-page nav pill with section progress. It must not cover the preview bar or the cookie banner.
- **InquiryPanel:** split layout with a room photo on one side and the form on a solid card on the other. Clear focus states, a success state, and the same handler and field names as now.

---

## Page plans

### /holiday-parties/ (build this one first)
1. **Hero:** MediaHero with `/videos/party-dancefloor.mp4` (or `party-testimony.mp4` if it's the better first frame; test both and show me). Fact rail: `12 to 134 guests` · `Fajita buffet from $26` · `Weekday rooms from $200/hr` · `Reply within 24 hours`.
2. **StatStrip:** 4 private rooms · 134 standing in the Mexican Room · 4.6 stars from 5,600+ Google reviews · in Germantown since 2015. Check each against the copy file.
3. **"December weekends are going":** a slim gold band with a marquee line and the phone number. No discount, no deadline (the client removed both).
4. **Rooms:** RoomSwitcher using the room photos (`mexican-room`, `international-room-long-tables`, `patio-tulum` / `patio-vallarta`, `dining-room-night`). Under it, a "Compare all rooms" disclosure holding the real HTML table, which must stay in the DOM. Mic and HDMI TVs go in as a feature chip, not a paragraph.
5. **Food and bar:** BentoGrid. A large tile looping `/videos/catering-buffet.mp4` for the fajita buffet ($26), a printed-menu tile ($22), and bar tiles from the `drink-*` / `hh-*` photos. Bartender and mini bar go in as upgrade chips.
6. **Entertainment:** CardRail with the add-on photos (`addon-dance-floor`, `addon-karaoke`, `addon-live-music`, `addon-mariachi*`, `addon-sound-light`), an "Upgrades from $499" chip, and the mariachi one-hour-minimum note as a caption. Link to `/private-parties/#entertainment`.
7. **How booking works:** StepLine with the approved steps (inquire, Tomas replies within 24 hours, 15-minute walk-through, deposit = room fee refundable to 48 hours). Tax-exempt groups as a small note.
8. **Proof:** ProofSplit (`brothers.jpg` or `tomas-headshot.webp`, Sian R. review), then a PhotoMarquee of real party photos (`quince-*`, `celebration-cake`, the friendsgiving gallery, the room shots). Leave a slot for the PENDING Q5 quote.
9. **Gift box `#gift-box`:** the cream light section. Feature card with the dates (Nov 27 to Dec 31). Use a real photo if one exists. If not, use a typographic card with a thin gold ribbon line, and put the photo in the requests list.
10. **FAQ:** FaqTwoCol.
11. **Inquire:** InquiryPanel.

### /new-years-eve/
1. **Hero:** MediaHero, night mood, using the full-bar-area and hands-up-at-the-bar photos with Ken Burns, or a dance-floor clip if it reads as night. A live countdown to Dec 31, 9:00 PM Eastern, rendered as text in the fact rail. It's real, so it's allowed. Put "Masquerade" in a subtle gold-foil gradient. Fact rail: `Open from 3 PM` · `$5 cover from 9 PM` · `21+ in the bar area only after 9` · `Dining rooms all ages`.
2. **The night:** ScrollTimeline with 3 PM · Dinner · 9 PM · Midnight · 2 AM, each stop paired with a real photo.
3. **Two rooms, one night:** a split-screen card, dining rooms (all ages, full menu) on one side and bar area (21+ after 9, DJs, masquerade) on the other. This replaces saying the age rule three times in paragraphs. Keep it once in the FAQ.
4. **Dinner first:** a BentoGrid of real dish photos from the menu.
5. **Private room:** a compact InquiryPanel ("Private rooms are available. Holiday rates apply.").
6. **Christmas week hours:** a row of day chips, today highlighted.
7. **Gift box:** a small card linking to `/holiday-parties/#gift-box`.
8. **Proof:** Joe T. review plus a short photo marquee.
9. **FAQ** and a **close** with the countdown repeated.
Leave the PENDING Q1 (dress code), Q2 (photos) and Q4 (card only) spots marked in the code. Q2 means the photos get swapped later, so keep them easy to replace.

### /birria-ramen/
1. **Hero:** editorial food hero. `/images/dishes/birria-ramen.jpg` large and cropped tight, slow Ken Burns, a `$21` price chip and a heat chip that reads "Mild". Use real steam only if it's in the photo. No fake steam effect.
2. **What's in the bowl:** the signature interaction. The bowl photo with numbered hotspots, one per component named in the copy. Tap or hover shows the label and one line. On phones, a numbered list sits under the photo. Add a small heat meter: the bowl is mild, Salsa diabla is the add-on.
3. **How the birria is made:** StepLine using birria photos only (`quesabirrias-hero.jpg`, the `/birria-tacos/` shots). Do not use the trompo video, that's al pastor.
4. **The story:** editorial layout. "15" as a giant count-up numeral ("recipes"), a drop cap, the trunk story as a large pull quote (PENDING Q3), and `brothers.jpg`.
5. **What to drink:** CardRail of the drink photos named in the copy.
6. **Order it in:** two large action cards (Toast order link, call).
7. **Local:** a map facade, a static styled card with the address, "next to Topgolf" and free parking. The Google Maps embed loads only on click.
8. **Proof** (Matt P.), **FAQ**, then the **close** ("Come Hungry") over a full-bleed dish photo.

---

## Process
1. Build the shared components and **/holiday-parties/ only**. Stop and show me screenshots at 390 and 1440, top to bottom, plus a short screen recording of the switcher, rail, timeline line, marquee and sticky CTA. Don't start the other two until I say go.
2. After my go, build /new-years-eve/ and /birria-ramen/ with the same components.
3. Log the work in `DESIGN-DEBT.md`.

## Checks before you hand back each page
1. `npm run build` and `npm run check-build` pass with no new warnings. Preview-mode checks from the last prompt still pass: noindex, no canonical, preview bar, not in the sitemap, no inbound links.
2. Mobile Lighthouse via `node .lh.mjs` on `npm run preview`, 3 runs: performance 90+, CLS under 0.05, LCP under 2.5 s. Record the numbers.
3. Nothing in the first viewport is animated. With JS disabled, nothing is stuck at opacity 0. With reduced motion on, nothing moves.
4. Keyboard: tab through the whole page. The switcher, rail, accordion and hotspots all work with keys and show visible focus.
5. Contrast: text over photos measured per STANDARDS. Worst patch reported.
6. The JSON-LD is unchanged (diff it). The FAQ answers in schema match the page.
7. No em or en dashes anywhere (grep).
8. Report: approved sentences you dropped or split, photo requests (missing images), and anything you couldn't do.
