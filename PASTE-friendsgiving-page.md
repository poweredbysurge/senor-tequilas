# Build /friendsgiving and add a MORE INFO button to the homepage carousel

Stay on `main`. Do NOT commit or push. When done, run the dev server so I can preview /friendsgiving and the homepage.

Read first: `CLAUDE.md`, `STANDARDS.md`, `DESIGN-DEBT.md`. Use `src/pages/game-day.astro` as the template for an authored page: same Base layout, Header5, Footer2, tokens, type (Archivo Black / Barlow / Barlow Condensed), eyebrow-with-rule, section rhythm, card and button treatments. Do not invent a new visual language.

## Hard rules
- No em dashes or en dashes anywhere in copy, meta or alt text. Use commas, colons, periods. Ranges are "3 to 6".
- Prices ARE allowed on this page (client decision for holiday pages): the $5 cover, the $15 Fall Carajillo, the $30 catering delivery fee. Add a comment at the top of the page saying so, so nobody strips them later under the site-wide no-prices rule.
- Review count comes from `roundedTotal()` in `src/lib/reviews.js` / `business.json`, never a hard-coded number.
- Do not invent facts. Everything below is confirmed by the owner (Roberto, Oct 21).
- Do not link to /holiday-parties or /new-years-eve yet: those pages don't exist. Leave an HTML comment `<!-- TODO link /holiday-parties when it ships -->` where noted.

## 1. New page: `src/pages/friendsgiving.astro` (URL /friendsgiving)

**Title tag:** `Friendsgiving & Thanksgiving Eve Party | Germantown, MD`
**Meta description:** `Thanksgiving Eve, Wed Nov 25: DJ 8 PM to 1 AM, $5 cover in the bar area after 8, happy hour 3 to 6, private rooms for groups. Germantown, MD.`

### Facts (source of truth)
- Name: Friendsgiving Party and Thanksgiving Eve. Wednesday, November 25, 2026.
- Open 3 PM to 1 AM that night. Happy hour 3 to 6 in the bar area as normal.
- DJ Drastik and DJ Gerra, 8 PM to 1 AM, bar area. Spanish and English hits.
- No Wednesday lotería that night. Tuesday, Nov 24 has a remix of bingo and lotería instead.
- After 8 PM: bar area is 21 and over, $5 cover, bar area only, paid at the door by credit or debit (no cash). Dining rooms stay all ages, no cover. Early arrival suggested.
- Full menu until 10 PM, late night food menu 10 PM to 1 AM. Last call 12:45 AM.
- One drink special: Fall Carajillo, $15. Cafe de olla, Licor 43, spices, pan de muerto garnish. No other drink specials, no pitchers. Margaritas come in 14 oz, 18 oz and the 54 oz Big Mami.
- Dining room reservations on Toast Tables (use `business.reserveUrl`) close **Tuesday, Nov 24**. On the 25th it is first come, first served for groups of 1 to 22.
- Private rooms: holiday rate, "contact us for a private room". Book by Sunday, Nov 22: call 301-569-4574, use the inquiry form (link to `/private-parties#inquire`), or ask for Tomas in person. Deposit only for private rooms. Rooms: Mexican Room seats 112, International Room 96, Indoor Patio 48, each with its own sound and lighting from the DJ booth.
- The turkey mascot pops up during the night.
- Closed Thanksgiving Day, Thu Nov 26.
- Catering trays for Thursday: order by Mon Nov 23 at 10 PM, pick up Wed Nov 25 by 10 PM. Catering terms: 48 hours notice, delivery within 20 miles for $30. Takeout and delivery run Wednesday until 10 PM. Tamales, pozole, birria and handmade tortillas available to take home.
- Black Friday, Nov 27: open 3 PM to 1 AM, DJ 9 PM to 1 AM, bar area 21+ after 9.
- Holiday Gift Box: every visit from Nov 27 through **Dec 31** gets a sealed box; bring it back unopened Jan 1 to Feb 13 to open it at the table. Prizes include free margaritas, entrees, appetizers, an Avion shooter, dessert, and one $500 gift certificate. Fine print (small text): one box redeemed per table, per check, parties of 1 to 50; cannot be combined with other offers; no cash value; Señor Tequila's may cancel, void or change the offer at any time.
- Owner quote: "The turkey pops up. Lots of laughter, dance moves, fun, and memories that will last a lifetime." Roberto Rivas, owner.
- 20021 Century Blvd, Germantown, MD 20874. Next to Topgolf, free parking.

### Sections, in order (copy is approved; tighten only for fit, keep the facts)

**Hero** (`id` not needed). Eyebrow: `Wednesday, November 25 · Germantown, MD · 3 PM to 1 AM`.
H1: `Friendsgiving and Thanksgiving Eve Party in Germantown, MD`
Lead: "Everybody is back in town and nobody has to be up early. DJ Drastik and DJ Gerra run 8 PM to 1 AM, happy hour runs 3 to 6 like any other Wednesday, and at some point a turkey walks through the bar. Get here before 8: that is when the bar area goes 21 and over and the $5 cover starts."
Buttons: primary `Reserve a Table` (Toast Tables, new tab), secondary `Book a Private Room` (`/private-parties#inquire`), text link `Call 301-569-4574` (tel:+13015694574).
Chips: The night · Drinks · Groups · Thanksgiving at home · Black Friday.
Media: the existing Friendsgiving flyer video (`/videos/friendsgiving-flyer.mp4` / `.webm`, poster `/videos/friendsgiving-flyer-poster.jpg`), same muted autoplay-loop treatment as the game-day hero.

**The night** (`id="night"`). Eyebrow: `No lotería this week. Something louder.` H2: `What Happens on Thanksgiving Eve`.
Copy: "People call it the biggest bar night of the year. Around here it is also the one night the whole graduating class is back on the same side of 270." / doors at 3, happy hour 3 to 6, lotería takes the week off (bingo and lotería remix moves to Tuesday, Nov 24), DJs 8 to 1. / After 8 the bar area is 21+ with a $5 cover, card only; dining rooms stay all ages with no cover, "so the cousins who are not 21 yet can still eat with you." / "Somewhere around the second margarita, the turkey shows up. He does not explain himself. People take photos with him anyway." / Full menu until 10, late night menu 10 to 1, last call 12:45 AM.
Render the night as a simple timeline row: 3 PM doors + happy hour · 6 PM happy hour ends · 8 PM DJs, 21+ bar area, $5 cover · 10 PM late night menu · 12:45 AM last call · 1 AM close.

**The drinks** (`id="drinks"`). Eyebrow: `One seasonal pour. No gimmicks.` H2: `The Fall Carajillo, Happy Hour, and That's It`.
Happy hour as normal 3 to 6 (link /happy-hour). After 6 the one special: Fall Carajillo, $15: cafe de olla, Licor 43, spices, finished with a mini pan de muerto. "No pitcher deals. No two-for-ones; that is Monday." Margarita sizes. Links: /margaritas · /tequila-bar.

**Groups** (`id="groups"`). Eyebrow: `1 to 22, walk in. 23 and up, get a room.` H2: `Bringing Everyone You Went to High School With`.
Dining room reservations on Toast Tables until Tuesday, Nov 24; on the 25th it is first come, first served for 1 to 22, so come at happy hour, eat, and hold the table through the DJ. Bigger than 22, or want a door that closes: private room at the holiday rate, contact us, book by Sunday, Nov 22. Room capacities and the per-room sound and lighting. Link /private-parties for photos. Buttons: `Book a Private Room` (`/private-parties#inquire`) and `Call 301-569-4574`. Do NOT build a new form on this page.

**Thanksgiving at home** (`id="thanksgiving"`). Eyebrow: `We are closed Thursday. You are still eating well.` H2: `Closed Thanksgiving Day. Your Thursday Is Covered Anyway.`
"We close on Thanksgiving Day, every year, so the whole staff gets the one dinner that matters." Catering trays: order by Mon Nov 23, 10 PM; pick up Wed Nov 25 by 10 PM. Tamales, pozole, birria and handmade tortillas to take home. Catering terms line, link /catering. Takeout and delivery run Wednesday until 10 PM, link /takeout-delivery.

**Black Friday** (`id="black-friday"`). Eyebrow: `Friday, November 27`. H2: `Black Friday, 3 PM to 1 AM`.
Open at 3, DJ 9 to 1, bar area 21+ after 9, "Shopping is optional." Link /late-night. Then a compact Holiday Gift Box card with the facts above and the fine print in small text. `<!-- TODO link /holiday-parties when it ships -->`

**Proof.** Eyebrow: `Last year`. H2: `In Roberto's Words`. The owner quote above. Then ONE real review pulled from `src/data/reviews.json`: pick a 5-star review that mentions the DJ, the bar, a night out, or a party, and render it with the same review card component/markup the homepage uses (name initials, month, stars). If none fits, omit the review card rather than writing one. Then the rating line from business.json + `roundedTotal()`: "{rating} stars across over {total} Google reviews. Family-owned by the Rivas brothers since 2015."

**FAQ** (`id="faq"`). H2: `Thanksgiving Eve, Answered`. Use the site's existing FAQ accordion markup. Seven Q&As:
1. What is happening at Señor Tequila's on Thanksgiving Eve 2026? (the party, Wed Nov 25, happy hour 3 to 6, DJ Drastik and DJ Gerra 8 PM to 1 AM, no lotería, turkey mascot, Germantown next to Topgolf with free parking)
2. Is there a cover charge on Thanksgiving Eve? ($5 after 8 PM, bar area only, card only at the door, no cover before 8 or in the dining rooms, come for happy hour and stay)
3. Is the Friendsgiving party 21 and over? (bar area 21+ after 8 PM, dining rooms all ages, come early if your group is mixed)
4. Can I make a reservation for Thanksgiving Eve? (dining room reservations on Toast Tables until Tue Nov 24, then first come first served for 1 to 22; bigger groups book a private room at the holiday rate by Sun Nov 22, call 301-569-4574)
5. Does happy hour run on the Wednesday before Thanksgiving? (yes, 3 to 6 in the bar area; the only special after that is the Fall Carajillo, $15)
6. Are you open on Thanksgiving Day? (no, closed every Thanksgiving Day; reopen Black Friday 3 PM to 1 AM, DJ 9 to 1)
7. Can I order food for Thanksgiving dinner at home? (catering trays by Mon Nov 23 at 10 PM, pick up Wed Nov 25 by 10 PM; tamales, pozole, birria and tortillas to take home; link /catering)

**Close.** H2: `Get Here Before 8`. "After 8 the cover starts and so does the line. Come at happy hour, eat, hold the table, and let the night come to you." Address line. Buttons: Reserve a Table · Book a Private Room · Call.

### Structured data (in the page, via Base's existing JSON-LD pattern or a page-level script)
- `Event`: name "Friendsgiving Party and Thanksgiving Eve", startDate `2026-11-25T20:00:00-05:00`, endDate `2026-11-26T01:00:00-05:00`, eventStatus EventScheduled, eventAttendanceMode OfflineEventAttendanceMode, location = the Restaurant (name, full address from business.json), organizer Señor Tequila's, performer `PerformingGroup` "DJ Drastik and DJ Gerra", offers `Offer` price 5 USD, url = the page, validFrom `2026-10-21`, description "Cover for the bar area after 8 PM; dining rooms no cover", image = the flyer poster (absolute URL).
- `FAQPage` with the seven Q&As, text identical to what renders.
- Add `specialOpeningHoursSpecification` support to business.json + Base.astro's Restaurant JSON-LD if it isn't there, with: 2026-11-25 15:00 to 01:00, 2026-11-26 closed, 2026-11-27 15:00 to 01:00. If the "open now" status badge reads business.json hours, make it respect these dates. Keep it data-driven so Dec 24/25 can be added later.

### Images
- Hero uses the existing Friendsgiving flyer video.
- Event photos: I downloaded the Google Drive "Thanksgiving" folder and put it in `design/source-art/friendsgiving/` (gitignored source art; never serve from there). Go through every image in it and pick the best 6 to 8 for this page: full bar area, DJ booth, crowd dancing, groups at tables, drinks being raised. Skip: anything blurry or very dark, anything where people are in Halloween costumes, anything clearly from Cinco de Mayo or a daytime/sports event, and duplicates of the same moment. Skip the .mov/.mp4 files.
- Convert the picks to webp: one 1600px-wide and one 640px-wide version each, into `public/images/site/friendsgiving/`, named descriptively (for example `friendsgiving-dance-floor.webp`, `friendsgiving-dance-floor-640.webp`). Use `srcset`, lazy-load everything below the hero, and write real alt text describing what's in each photo (no "image of").
- Use them in: the night section (a 3-photo strip under the timeline), the proof section (a small grid next to Roberto's quote, captioned "Last year"), and one in the groups section showing a full room. If the folder is missing or has fewer than 4 usable photos, stop and tell me instead of substituting stock or unrelated site photos.
- List which source files you used and which you skipped and why.

## 2. Homepage carousel: MORE INFO button

In `src/components/UpcomingEvents.astro`:
- Add an optional `page` field to an event. Set `page: '/friendsgiving'` on the `friendsgiving` event. Leave Halloween without one.
- In each slide's `.ue-actions`, when `e.page` exists render `<a class="ue-btn ue-btn-ghost" href={e.page}>More info</a>` (same tab, no target). Button text displays as MORE INFO via the existing button styling (uppercase if the style already uppercases; otherwise write "More info" and let CSS handle it). Order: Reserve a table, More info, then View photos if present. Make sure three buttons wrap cleanly on mobile at 375px.
- Also make the flyer itself clickable to `e.page` when `page` exists (wrap the flyer, keep the video controls/autoplay behavior intact, add `aria-label="More about {title}"`).
- Update the Friendsgiving `details` list to match the confirmed facts: DJ Drastik and DJ Gerra, 8 PM to 1 AM · $5 cover after 8, bar area only · 21+ in the bar area after 8 PM · Closed Thanksgiving Day, Nov 26. Keep the title as is.
- If the carousel emits Event JSON-LD for slides, add `url: '/friendsgiving'` (absolute) to the Friendsgiving event so it matches the page's Event.

## 3. Wiring
- The sitemap is generated from pages, so /friendsgiving appears automatically; confirm it does.
- Add /friendsgiving as an internal link from /late-night and /happy-hour where they already mention special nights (one short line each, only if there's a natural spot). Do not add it to the main nav.
- Index the page normally. Do not add date-based hiding or a 404 after Nov 26; we will update it for next year instead.

## 4. Check before you hand back
- `npm run build` passes. No console errors on / and /friendsgiving.
- grep the changed files for "—" and "–": zero hits.
- Lighthouse-style sanity: hero video has poster, images lazy-load below the fold, all buttons are real links with visible focus.
- 375px, 768px and 1280px screenshots of /friendsgiving and the homepage carousel slide with the new button.
- Validate the Event and FAQPage JSON-LD (paste-ready output in your summary).
- List every file changed or added. Do not commit.
