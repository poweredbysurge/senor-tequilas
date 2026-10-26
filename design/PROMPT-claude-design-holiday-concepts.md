# Señor Tequila's: 3 design concepts for each of 3 new pages

## The brief
Señor Tequila's is a family-owned Mexican restaurant in Germantown, Maryland: hand-painted rooms by artists from Mexico City, a big bar, four private party rooms, 4.6 stars from 5,600+ Google reviews. We are adding three seasonal pages: **Holiday Parties**, **New Year's Eve** and **Birria Ramen**.

The first builds came out as a template: every section was a small label, a heading and three paragraphs on near-black. They read like AI filler. This round is a **design exploration only**. I want to see different ways each section could be laid out before we build anything.

**Make 3 distinct concepts for each page (9 in total).** Each concept should take a clear position and commit to it. Don't give me three versions of the same layout. Inside a concept, every section should get a layout chosen for that section's job, not a repeated unit.

**For each concept, deliver:**
- A desktop artboard at 1440 wide, full page top to bottom.
- A mobile artboard at 390 wide, full page.
- A concept name and a two-line rationale: who it's for and why it sells.
- A short note on each section naming the layout and any motion or interaction ("crossfade on tab change", "count-up on enter", "drag rail"). These are static mocks. Annotate the motion, don't build it.

At the end, add a side-by-side strip of all three hero sections per page, so I can compare at a glance.

---

## Brand system (fixed, do not change)
This is an existing live site. Stay inside its system. The creativity goes into layout, scale, composition and imagery, not new colors or fonts.

**Colors**
| Role | Value |
|---|---|
| Page field (dark) | `rgb(18,18,16)` |
| Alt dark field | `rgb(20,18,16)` |
| Card / surface | `rgb(28,27,24)` |
| Raised surface | `rgb(35,33,28)` |
| Hairline border | `rgb(42,40,32)` / `rgb(58,56,47)` |
| Gold (headings, accents, prices) | `rgb(214,188,133)` |
| Antique gold (borders, rules) | `rgb(185,156,102)` at 20 to 75% |
| Cream (light section field, or text on dark) | `rgb(246,239,228)` |
| Body text on dark | `rgb(234,226,214)` at 80 to 100% |
| Brand green (primary button fill only) | `rgb(56,176,73)` with dark ink `rgb(12,18,13)` |

**Rules**
- Dark is the default. Each page may use **one cream section** with dark ink for contrast.
- Brand green is for the primary button, not for text over photos.
- Small text over photographs stays cream.
- Gold is for headings, numerals and accents, not long text.

**Type** (only these five families)
- **Archivo Black:** display and H1/H2. Oversized is welcome.
- **Barlow Condensed:** uppercase labels, chips, nav, numbers in data. Tracked 0.06 to 0.12em.
- **Barlow:** body.
- **Roboto:** UI fallback.
- **Special Elite:** typewriter accent, at most one moment per page (a caption, a handwritten-feeling note). Never body.

**Hierarchy:** one H1 per page. Clear H2 per section. Labels small and uppercase. Body 16 to 18px with comfortable measure. Prices and capacities are typographic heroes: big numerals, small units.

**Shapes**
- Cards: 16px radius, 1px hairline border.
- Buttons: 12px radius, 52px tall.
- Chips: pill (999px), gold hairline.
- Primary button: green fill with a soft green glow.
- Ghost button: gold outline on a translucent dark field.

**Imagery:** real photos only, never stock or AI-generated.
- **If you don't have the photos, or can't open them, use placeholders.** Missing images should not block or slow the concepts. Use a grey or dark block at the right size and crop, labeled with what goes there, for example "PHOTO: Mexican Room set for a party" or "VIDEO: dance floor at night".
- Design as if the real photo is there: full-bleed, cropped tight, captioned. Placeholders are expected in this round, and we swap in the real photos when we build.
- Whatever photos I do attach, use them where they fit best.
- At the end, list every placeholder as a shot list: section, what the photo shows, and the crop or orientation. The shot list is part of the deliverable.

**Copy:** no em or en dashes anywhere. The approved copy is attached. Use its headings as written, and condense body copy freely in the mocks. This round is about layout, so short real text beats lorem ipsum.

**Breakpoints of the live build:** 390, 768, 1024, 1440. Design for 1440 and 390.

**Every page must keep:**
- A thin preview bar above the header: "Preview for Señor Tequila's review. This page is not published yet."
- The existing site header and footer (stand-in blocks are fine).
- The call and reserve actions.
- An FAQ.
- A path to the inquiry form or the order link.

---

## Page 1: Holiday Parties (`/holiday-parties/`)
**Goal:** companies and families book a private room for a December party. The primary action is the inquiry form. Secondary: call (301) 569-4574.

**H1:** A Holiday Party Venue With the Kitchen Already in the Room

**Sections, in order:**
1. **Dates:** "The Weekends Are Going. Call Now." No discount, no deadline.
2. **The rooms:**
   - Mexican Room: seats 112, 134 standing. Main dining room.
   - International Room: seats 96, 115 standing. Where most private events happen.
   - Indoor Patio: seats 48, 58 standing. Roofed, enclosed, warm in December.
   - Bar Area: seats 108, 150 standing. The DJ booth lives here.
   - Rooms are hand-painted by artists from Mexico City and decorated for the holidays. Every room has a mic and large TVs with HDMI. Weekday rooms from $200 an hour. The capacity table must still exist as a real table somewhere.
3. **The food:** fajita buffet from $26 a person, or a printed handpicked menu from $22.
4. **The bar:** drink tickets set with the coordinator. Bartender or mini bar upgrades. No self-serve alcohol.
5. **Entertainment:** mariachi (one-hour minimum), DJ, karaoke and lighting upgrades from $499.
6. **Booking steps:**
   1. Inquire.
   2. Tomas replies within 24 hours with an invoice.
   3. 15-minute walk-through.
   4. Deposit = room fee, refundable to 48 hours before.

   Tax-exempt groups welcome.
7. **Proof:** a Google review from a party of 25 (Sian R.), the 4.6 stars from 5,600+ rating line, and room for an optional owner quote.
8. **Holiday Gift Box:** Nov 27 to Dec 31. Needs anchor `#gift-box`.
9. **FAQ:** 7 questions.
10. **Close:** "Come See the Room Before the Weekends Go", plus the inquiry form (Name, Company, Phone, Email, Date, Guest count, Notes).

**Concept directions to explore** (push each one hard):
- **A. The Room Tour:** immersive and room-led. Each room is a full-screen chapter with its photo, capacity numerals and what fits there. The page feels like walking through the building.
- **B. The Holiday Edition:** a print-magazine treatment. Huge Archivo Black type, asymmetric grids, numbers as typographic heroes ("134", "$26", "24 hrs"), pull quotes, the cream section as a centerfold.
- **C. The Planner:** conversion-led and tool-like. A party builder up top (guest count → rooms that fit → food → upgrades → "Send this to Tomas"), with everything else supporting the builder. It should feel precise, not like a SaaS dashboard.

## Page 2: New Year's Eve (`/new-years-eve/`)
**Goal:** reserve dinner, come back for the masquerade. Also sells private rooms for the countdown.

**H1:** New Year's Eve Dinner and Masquerade Party in Germantown, MD

**Key facts:**
- 3 PM: doors open.
- Dinner: full menu, all ages, dining rooms (Toast Tables for groups under 20).
- 9 PM: masquerade in the bar area, which turns 21+. $5 cover at the door. DJs, Spanish and English.
- Midnight: countdown and a champagne toast on the house.
- 2 AM: close. Last call 15 minutes before.
- The dining rooms stay all ages all night.
- Limited masks at the door, bring your own to be sure.
- Private rooms available, holiday rates apply.

**Sections:** the night timeline, dinner, private room form, Christmas week hours, Holiday Gift Box (links to Holiday Parties), proof (Joe T. review), FAQ, close: "Reserve Dinner. Stay for the Toast."

**Concept directions:**
- **A. The Countdown:** poster and nightclub energy. A giant countdown to 9 PM Dec 31 as the hero, a flyer-style composition, black and gold, the masquerade as the headline act.
- **B. Hour by Hour:** scroll-told. The page is the timeline, 3 PM to 2 AM. Each hour gets its own scene, photo and mood, and the light shifts from dinner warm to party dark as you scroll.
- **C. Two Doors:** a split-screen choice. Left door, dinner with the family (all ages). Right door, the masquerade (21+ bar area). It makes the age rule obvious through layout, not repetition.

## Page 3: Birria Ramen (`/birria-ramen/`)
**Goal:** make people want the bowl, then come in or order takeout.

**H1:** Birria Ramen in Germantown, Maryland

**Key facts:**
- $21.
- The bowl: birria beef piled on Japanese ramen noodles (wheat), corn, radish, onion, cilantro, birria consommé ladled over, limes on the side.
- It arrives mild. Salsa diabla on request for heat. A full meal: "You will not be hungry afterwards."
- Beef braised 8 hours with chile guajillo, chile de árbol, cloves and garlic. The braising liquid becomes the consommé, the same one the quesabirria tacos are dipped in.
- **The story:** 2020 lockdown. Alex Rivas cooked birria at home and left batches with handmade tortillas on the trunk of his brother Roberto's car every two days. About 15 recipes later, one was chosen. On the menu since 2021, a top-ten seller since.
- **Drinks:** michelada, Mexican Coke, Negra Modelo ("anything cold and carbonated").
- **Takeout:** order on Toast, or call.
- **Local:** 20021 Century Blvd, next to Topgolf, free parking, ten minutes from Gaithersburg.
- **Proof:** Matt P. review.
- FAQ, close: "Come Hungry".

**Concept directions:**
- **A. Anatomy of a Bowl:** food-editorial. A top-down hero of the bowl with numbered callouts for each component, a heat meter (mild, diabla optional), and the 8-hour braise as a process strip.
- **B. The Trunk Story:** documentary and story-first. Opens on 2020 and the trunk of a car, the "15" recipes as a giant numeral, Special Elite captions like film notes, the bowl revealed as the payoff.
- **C. Painted Sign:** bold graphic poster inspired by the hand-painted Mexican signage in the restaurant's own rooms (original lettering and composition, not a copy of any specific artwork). Big price, punchy, order-first, built for people who already want it.

---

## What I'll judge on
- Does each concept have a clear idea, and are the three really different?
- Does every section earn its layout? No repeated label + heading + paragraphs blocks.
- Is it obviously Señor Tequila's: same colors, same five fonts, same button and card language?
- Photo-led and confident with scale, while staying readable on a 390 phone.
- Clear hierarchy: you can tell what to do next (book, reserve, order) from any scroll position.

**Attached (when available):** approved copy file, photo and video stills from the site, and screenshots of the current homepage and `/private-parties/` for brand reference. Anything not attached: use labeled placeholders and keep going.
