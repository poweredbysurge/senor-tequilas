# Rebuild the 3 preview pages from the selected Claude Design concepts

Replace the current builds of `/holiday-parties/`, `/new-years-eve/` and `/birria-ramen/` with the three concepts the client picked. Same file paths, same preview mode. This is a visual rebuild. The copy, SEO and schema stay as approved.

## Inputs
- **Concepts (the design source):** `design/concepts/2026-10-25-selected/`
  - `Senor_Tequilas_Selected_Concepts.html`: the Claude Design export. Open it in a browser. It unpacks with JS and takes a few seconds. The notes column next to each artboard lists the layout and motion for every numbered section, and the blue numbered circles are annotations, not UI.
  - `1a-holiday-parties-room-tour.png`, `2a-new-years-eve-countdown.png`, `3c-birria-ramen-painted-sign.png`: full-page renders of each artboard.
  - `shot-list.png`: photos the client still needs to supply.
- **Copy (the words source):** `design/copy/holiday-pages-copy-2026-10-24.md`. The mocks condense the copy to fit the layout. **The build uses the copy file verbatim, never the mock text.** Where the mock and the copy disagree, the copy wins.
- **Repo rules:** `CLAUDE.md` and `STANDARDS.md`, which still apply in full:
  - No framework and no CSS conversion.
  - Fixed breakpoints and the five embedded fonts only.
  - No stock or generated images.
  - No em or en dashes.
  - The reveal-on-scroll rules.
  - Contrast measured by screenshot.
  - Log changes in `DESIGN-DEBT.md`.

Concept picks: **Holiday Parties = 1a The Room Tour · New Year's Eve = 2a The Countdown · Birria Ramen = 3c Painted Sign.** The artboards are desktop only (1440). Build mobile at 390 by collapsing grids to one column. Keep the poster frames, numerals and sign treatments at phone size, scaled with `clamp()`.

---

## SEO guardrails (the mocks break some of these, fix them in the build)

### 1. Headings
- One H1 per page, exactly as written in the copy file.
- Every H2 from the copy file is present as an H2, in a sensible order.
- Section labels ("eyebrows") are not headings.

### 2. All approved body copy is visible
- Every sentence in the copy file appears on the page as real HTML text, in the open. Nothing is hidden behind tabs or "read more".
- The design spreads the copy across its components (side columns, card bodies, captions, tile sublines) so no section reads as a wall of text. The fine print can be set small.
- Copy you need to place that the mock left out is listed per page below.

### 3. FAQ answers verbatim
- Use the full answer text from the copy file. The mock shortens some answers.
- The same single list renders both the accordion and the FAQPage schema, and the two must match.

### 4. Reviews verbatim
- Quote the full review text from the copy file. The mock trims them.
- Show the rating as "4.6" with "across over 5,600 Google reviews".
- **Do not show five solid stars for a 4.6.** Either fill the fifth star to 60% or drop the stars.
- No review or rating schema.

### 5. Internal links
Every link in the copy file stays. The mocks dropped most of them, so check against the per-page lists below.

### 6. No invented claims
The mocks added microcopy that isn't in the approved copy. Replace it as listed per page. Any other mock text not in the copy file gets cut. If a layout slot needs a short label, take it from the copy file or from `/private-parties/` (already approved). Never write new facts.

### 7. Unchanged
These all stay exactly as they are:
- Title tags, meta descriptions and the JSON-LD (diff it).
- Preview mode: noindex, no canonical, the X-Robots header, kept out of the sitemap, no inbound links, the preview bar.
- Every `// PENDING ROBERTO Qn` comment.

### 8. Site chrome
Use the existing `Header5` and `Footer2` components, not the header, nav or footer drawn in the mocks. The mock footers show hours that don't match the site.

### 9. Images
- Alt text is written from the actual photo.
- Below-the-fold images lazy-load.
- Each hero image is added to the `LCP_IMAGE` map in `Base.astro`.
- Photos named in the shot list that we don't have stay labeled placeholders, using the existing `need-image.svg` pattern, so the client sees exactly what to shoot.

---

## Page 1: /holiday-parties/ (concept 1a, The Room Tour)

**Build the layout from the artboard, section by section:**
1. Hero with a sticky chapter index.
2. December calendar.
3. Four room chapters.
4. Cream table section.
5. Food split.
6. Bar with the ticket-stub graphic.
7. Entertainment cards.
8. Four-step booking line.
9. Proof.
10. Gift box `#gift-box`.
11. FAQ with a sticky heading.
12. Close with the form card.

**Headings fix.** In the mock, the four room chapters come *before* the "The Rooms, Dressed for December" H2 and use the room names as big headings. In the build:
- The H2 "The Rooms, Dressed for December" opens the room block. The chapter index label sits above it.
- Each room name is an **H3**.
- The cream section that follows holds the capacity table and the two price heroes, under the same H2. It doesn't get its own H2.
- The capacity table stays a real `<table>`.

**Room chapter copy: replace the mock's invented lines.** Each chapter uses only:
- the room's row from the table (seated, standing, notes), and
- these approved lines from `/private-parties/`:
  - **Mexican Room:** "Our main dining room." Chip: "A/V wired".
  - **International Room:** "Our second dining room, and where most private events happen." Chip: "Most booked".
  - **Indoor Patio:** "Under a roof, windows open all summer, warm and closed in for winter." Chip: "Year-round".
  - **Bar Area:** "Sixteen tables, two long tables, a 20-seat counter, and the DJ booth." Chip: "DJ booth".
- Shared chips on every room: "Mic" · "HDMI screens" · "Holiday décor".

**Cut from the mock:** "head table under the mural", "the year-in-review on two screens", "TWO SCREENS", "a dance floor if you want one, the door closes", "Teams of 20 to 50", "heated, plants and string lights".

**Calendar.** It's a graphic. Mark it `aria-hidden="true"`, because the real information is in the section text. Allowed states:
- Fridays and Saturdays gold: "Weekends book first".
- Other days: "Open".
- Dec 24 and 25: "Closed".

No "booked" or "sold out" states, and nothing else implying live availability.

**Copy to place that the mock dropped:**
- **Hero:** the full lead paragraph, including "a coordinator who gets back to you within 24 hours" and "December Fridays and Saturdays are going fast."
- **Dates:**
  - The opening line about the budget and the forty people.
  - "Tomas will tell you what is still open and hold a date for you."
  - The lunch-party sentence, including "Very large lunch groups are welcome."
  - "Hours in the room are set booking by booking..."
  - The link to `/new-years-eve/`.
- **Rooms:**
  - "If you are comparing Christmas party venues in Montgomery County..." This line carries the secondary keyword, so it must stay.
  - The sound and lighting sentence.
  - The décor and $20 cake sentence.
  - The link to `/private-parties/`.
- **Food:**
  - "Either way it is the kitchen our regulars drive across the county for..."
  - "A dessert table is a real option."
  - The take-home tamales, pozole, birria and tortillas line.
  - Links to `/menu/` and `/catering/`.
- **Bar:** links to `/margaritas/` and `/tequila-bar/`. Replace the ticket stub's "Margarita, beer or wine" with "You set what it covers". The copy says the client decides.
- **Entertainment:**
  - "December is their busy month too, so ask when you book."
  - The full $499 list.
  - The link to `/private-parties/#entertainment`.
  - Cut "SPANISH AND ENGLISH" from the DJ card. That's the NYE DJs, not confirmed for private parties.
- **Proof:**
  - The H2 "Office Teams, Family Parties, and the Ones Who Come Back Every December".
  - The "Company teams of 20 to 100..." line.
  - The full Sian R. review.
  - "Family-owned by the Rivas brothers, Roberto and Alex, in Germantown since 2015." This is E-E-A-T, so it must stay.
  - The `PENDING ROBERTO Q5` slot.
- **Gift box:** the full fine print, verbatim.

**Photos (real, in the repo):**
- **Hero:** `/images/site/mexican-room.webp`, or the `/videos/party-dancefloor.mp4` loop with its poster if it reads better. Show me both.
- **Mexican Room:** `mexican-room.webp`.
- **International Room:** `international-room-long-tables.webp`.
- **Indoor Patio:** placeholder. The patio photos on the site are the outdoor Tulum and Vallarta patios, so don't use them.
- **Bar Area:** `friendsgiving/friendsgiving-full-bar-area.webp`.
- **Food:** `/images/dishes/steak-fajitas-hero.jpg`, or the `catering-buffet.mp4` loop.
- **Mariachi:** `addon-mariachi-ensemble.jpg`.
- **DJ:** `addon-sound-light.jpg`.
- **Karaoke:** `karaoke-singing.webp`.
- **Proof:** `happy-hour-group.webp` or `international-room-long-tables.webp`.
- **Gift box:** placeholder.
- **Close:** a room photo field with `tomas-headshot.webp` set in the form card.

**Motion (per the artboard notes):**
- The chapter index highlights the room in view.
- Calendar cells fade in by date.
- Room photos use 0.6x parallax and the capacity numerals count up.
- The booking line draws left to right.
- Cards lift 4px on hover.
- The FAQ height eases over 240ms.

---

## Page 2: /new-years-eve/ (concept 2a, The Countdown)

**Build from the artboard:**
1. Poster hero with a double gold frame and the live countdown.
2. The night as five flyer cards, with the 9 PM card lifted in gold and the mask line in Special Elite (this page's one typewriter moment).
3. Cream dinner section.
4. Private room with the form card.
5. Three hours tiles, closed dates struck through.
6. Gift box banner.
7. Proof.
8. FAQ.
9. Close with the three CTAs.

**Countdown:**
- It counts to **2026-12-31 21:00 America/New_York**.
- Rendered by JS. The server HTML holds the static text "Thursday, December 31 · 9 PM" so crawlers and no-JS visitors still get the date.
- Use tabular numerals and fixed-width cells so updating doesn't shift the layout.
- After the target time it switches to "Tonight" or hides. Don't let it count negative.
- The H1 stays the H1 directly under it. The countdown is not a heading.

**Hero background:** there's no smoke-machine video. Use the `/videos/party-dancefloor.mp4` loop with a poster, or `friendsgiving-hands-up-at-the-bar.webp` with a slow Ken Burns. These are stand-ins for `PENDING ROBERTO Q2` (last year's NYE photos), so make them easy to swap.

**Copy to place that the mock dropped:**
- **Hero:** the full lead paragraph under the H1. The fact chips are extra, not a replacement. The paragraph carries "dinner", "masquerade", "21 and over" and "$5 cover".
- **Dinner:** links to `/birria-ramen/`, `/margaritas/`, `/tequila-bar/` and `/menu/`.
- **Private rooms:**
  - The opening sentence "Private rooms are available on New Year's Eve." The client asked for exactly this.
  - The link to `/private-parties/`.
- **Hours:** the full pozole paragraph with links to `/catering/` and `/takeout-delivery/`.
- **Gift box:**
  - The "Inside:" list.
  - The "So you already have a reason to come back on New Year's Day. We open at 3." line.
  - The full fine print.
  - The link to `/holiday-parties/#gift-box`.
- **Proof:**
  - The H2 "What People Say After a Night Here". The mock has no H2 here.
  - The "Our Google reviews mention the DJ nights..." paragraph with the Rivas brothers line.
  - The full Joe T. review.

**Keep the PENDING comments:** Q1 (dress code, next to the mask line), Q2 (photos), Q4 (card-only cover, next to "$5 cover at the door").

**Photos:**
- **Dinner:** `/images/dishes/molcajete.jpg` or `triple-a-molcajete-hero.jpg`.
- **Private room:** `international-room-long-tables.webp` dimmed, or `addon-sound-light.jpg`.
- **Gift box:** placeholder.
- **Close:** placeholder for "champagne flutes raised under the bar lights", over a dark field. Or use `friendsgiving-full-bar-area.webp` heavily dimmed and keep the placeholder request in the report.

---

## Page 3: /birria-ramen/ (concept 3c, Painted Sign)

**Build from the artboard:**
1. Sign-frame hero with the rotated $21 badge.
2. Four fact tiles.
3. Dashed menu-board "What Is in the Bowl" beside the photo.
4. Spice word chain with the pot photo.
5. Cream drinks menu board.
6. Two sign panels: Order It In, and the local panel.
7. Story row with the Special Elite quote.
8. Proof band.
9. Two-column FAQ.
10. "COME HUNGRY" close in the same sign frame.

**H1 fix (important).** The mock's giant "BIRRIA RAMEN" lettering can't be the whole H1. The approved H1 is **"Birria Ramen in Germantown, Maryland"**, which holds the primary keyword plus the location. Build it as one `<h1>`: the sign lettering "Birria Ramen" as the big span, and "in Germantown, Maryland" as a smaller line inside the same H1, styled as part of the sign (for example, Barlow Condensed tracked caps between rules). Screen readers and crawlers get the full H1.

**Hero:**
- Eyebrow from the copy file: "On the menu since 2021 · $21 · Dine in, takeout, delivery". It replaces the mock's "Since 2021 · Germantown, Maryland".
- The mock's "The one that makes people take a photo first" line is approved copy, so keep it.
- Add the full lead paragraph from the copy file under the H1.

**Replace invented microcopy:**
- Bowl board sublabels: Cilantro "FRESH, LAST" becomes "On top". Corn, radish, onion "ON TOP, FOR CRUNCH" becomes "On top". Keep "Braised 8 hours, piled on", "Japanese, wheat, underneath", "Ladled over everything" and "On the side, to cut it". Those are in the copy.
- Drink sublabels "COLD, SALTED RIM", "GLASS BOTTLE" and "DARK, CARBONATED" become one shared line, "Cold and carbonated", taken from the copy.

**Headings fix:**
- The local panel's heading "Next to Topgolf" becomes a label. The H2 is **"Birria Ramen in Germantown, Ten Minutes From Gaithersburg"** (local keyword).
- The proof band needs the H2 **"Do Not Take Our Word for It"**.
- The story H2 "Fifteen Recipes and the Trunk of a Car" stays an H2.

**Copy to place that the mock dropped:**
- **Bowl:**
  - The full four paragraphs, including "Most people do not finish the bowl, and the ones who do ask for a pillow."
  - The mild and salsa diabla paragraph.
  - "The noodles are wheat. If that matters to you, it matters here."
- **Birria:**
  - "If you do not, start with the ramen. It is the one that makes people take a photo first."
  - The Birria Pizza takeout line.
  - Links to `/birria-tacos/` and `/takeout-delivery/`.
- **Drink:** the happy hour paragraph in full, with links to `/happy-hour/` and `/margaritas/`.
- **Takeout:**
  - The opening "one of the few noodle dishes that travels well" sentence.
  - Roberto's "Travels great. Available in every way."
  - The birria, tamales, pozole and tortillas line.
  - The Toast link to `/takeout-delivery/`.
  - DoorDash, Uber Eats and Grubhub: link them only if their URLs already exist in the repo (check `/takeout-delivery/` and `business.json`). Otherwise show them as plain text chips, not buttons.
- **Local:** the full two paragraphs, including **"Clarksburg, Boyds, Urbana and Frederick"**, the full hours, and the link to `/late-night/`. These are the local-search terms and must stay. The map is a static styled facade. Load a Google Maps embed only on click.
- **Story:**
  - All three paragraphs: "Alex Rivas loves caldos...", the trunk paragraph, and "It went on the menu in 2021... top ten seller...".
  - The **full** Roberto quote, not the mock's shortened one, with `PENDING ROBERTO Q3`.
  - This is the page's E-E-A-T section. The one-row layout can become two columns, but the full text stays.
- **Proof:** the "Our Google reviews mention the birria more than any other dish except the quesabirria..." paragraph with the Rivas brothers line, and the full Matt P. review.
- **Section order:** the mock moves the story below takeout and local. That's fine.

**Photos:**
- **Hero:** `/images/dishes/birria-ramen.jpg`, 4:5.
- **Bowl board:** also `birria-ramen.jpg`, cropped tighter. It's our only bowl shot, so keep the top-down request in the shot list.
- **Braise:** `/images/dishes/quesabirrias-hero.jpg`. Caption it as the same braise and consommé, not as the pot.
- **Story:** `/images/site/brothers.jpg`.
- **Drinks:** placeholders. There's no michelada, Mexican Coke or Negra Modelo photo in the repo.

**Motion:**
- The $21 badge rocks once on load. It's a transform only and is never hidden.
- Fact tiles count up.
- Menu board lines reveal in sequence.
- The FAQ cards follow the standard reveal rules.

---

## Motion and performance (all pages)
- Follow STANDARDS for scroll reveals:
  - Nothing in the first viewport starts hidden.
  - The hidden state is set by JS.
  - Opacity and transform only, with a named transition list.
  - A one-line kill switch.
- `prefers-reduced-motion`:
  - No count-ups (show the final number).
  - No parallax, Ken Burns or badge rock.
  - Videos show their poster.
  - The countdown still updates, but without the flip animation.
- Videos: `autoplay muted loop playsinline preload="metadata"`, with a poster. Same pattern as the `/game-day/` hero.
- Vanilla JS in one small shared module. No libraries.

## Process
1. Build all three pages at their existing paths, replacing the current preview builds. Keep `src/data/preview-pages.ts` exactly as it is.
2. Put any reusable pieces in `src/components/` and reuse them across the pages: sign frame, flyer card, countdown, menu board, chapter index, calendar, count-up stat.
3. Stop before committing. Send me what's listed under "Hand back to me".

## Checks
1. `npm run build` and `npm run check-build` pass with no new warnings.
2. Preview mode on all three pages: robots `noindex, nofollow`, no canonical, the preview bar showing, not in `sitemap.xml`, and no other page linking to them (grep `dist/`).
3. **Copy coverage:** a script that takes every sentence from the copy file for each page and confirms it's in that page's built HTML. Print any misses. Expected misses: only the `> PENDING` notes, title, meta and homepage-card lines.
4. **Headings:** print each page's H1 and H2 outline and confirm it matches the copy file.
5. **Links:** print each page's internal links and confirm every link from the copy file is present.
6. **Schema:** the JSON-LD is byte-identical to the current preview build, except for any FAQ text that now matches the page.
7. No `—` or `–` anywhere in the three pages' source or output.
8. Mobile Lighthouse via `node .lh.mjs` on `npm run preview`, 3 runs per page: performance 90 or above, CLS under 0.05, LCP under 2.5 s.
9. Run with JS disabled and confirm nothing is stuck at opacity 0, and the countdown fallback text shows. Run with reduced motion on and confirm nothing animates.
10. Keyboard check: tab through each page. The FAQ, chapter index and form all work, with visible focus.
11. Contrast over photos measured per STANDARDS. Report the worst patch.

## Hand back to me
- Screenshots of each page at 390 and 1440, top to bottom, next to the matching concept PNG.
- A short screen recording of the motion on each page.
- The copy coverage, heading outline and link reports.
- A list of placeholders still waiting on photos.

When I say go, commit and push.
