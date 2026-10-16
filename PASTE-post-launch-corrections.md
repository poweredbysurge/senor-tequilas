# Post-launch client corrections, round 1 (automatic pass)

Paste everything below the line into Claude Code, run from the repo root.

---

The client sent post-launch corrections for the Señor Tequila's site. This pass covers only the
changes that can be made with copy, code and images already in the repo. Anything that needs a new
photo, a video edit, a file from the client or a decision is out of scope: leave it, and list it in
your report.

## Before you start

1. Read `CLAUDE.md`, `STANDARDS.md`, `TASKS.md` and the last ten entries of `DESIGN-DEBT.md`.
2. Work on a new branch, `post-launch-corrections-1`. Production deploys from `main` on push.
   **Do not push to `main` or merge.** Stop at a clean, built branch and report.
3. Use the client's replacement wording exactly. Only fix capitalization or punctuation. No em
   dashes anywhere: where the client's text has one, use a comma. For time ranges, follow the
   convention the site already uses.
4. **Do not edit any `<title>`, meta description, canonical, URL, redirect or the sitemap.** Those
   belong to Mario (see `TASKS.md`). Where a title or description now contradicts the page (for
   example the Happy Hour title still says "All Day Sunday"), do not change it. List it in the report
   under "For Mario" with the file, the current text and a suggested replacement.
5. Do not convert CSS, round values, or touch breakpoints. Match the existing inline style patterns
   when you add or move anything.
6. Never fetch, generate or substitute a stock image. If an image has to come out and there is no
   correct replacement in `public/images`, follow how the project already handles a missing image
   (check `DESIGN-DEBT.md`, including entry 94), and do not leave visible "pending" text on a live page.

## 1. Sunday Happy Hour is gone, site-wide

Sunday is no longer a Happy Hour day. Remove every mention of Sunday Happy Hour, "Happy Hour all
day Sunday", and Sunday Happy Hour "in the bar area". Search every page, component, `Base.astro`
script (the day-card logic around the `DAYS` arrays), `business.json` and `menu.astro`.

- `/happy-hour`: remove the `#sunday` section entirely, including its video
  (`/videos/sunday-happy-hour.mp4`). Leave an HTML comment where a replacement video will go. Do not
  delete the video file.
- `/game-day`: two buttons link to `/happy-hour#sunday`. That anchor will no longer exist. Repoint
  or relabel them so nothing promotes Sunday Happy Hour. Keep "Game day specials every Sunday" as
  is (it is a game-day offer, not Happy Hour) and flag it in the report for the client to confirm.
- Check `/taco-tuesday`, `/margaritas`, `/menu`, `/late-night`, `/tequila-bar`, `/our-story`,
  `/private-parties` and the homepage for the same wording.
- After the change, `grep -rni "sunday" src` and account for every remaining hit in the report.

## 2. Homepage `/`

- Replace "Family-Owned Mexican in Germantown, since 2015." with
  "Family-Owned Mexican in Germantown, Maryland, since 2015. Fresh food made to order."
  Check whether the same line appears in `MobileMenu.astro`, `Footer2.astro` or other pages and
  report it, but only change the homepage instance unless it is clearly the same component.
- Monday flyer: margarita line reads "On the rocks. Lime, strawberry, or mango." (remove the stray "in").
- Tuesday: keep "Free Bingo" and the 8 p.m. to 10 p.m. hours. Final line becomes "WIN prizes." with
  "WIN" strongly emphasized (heavier weight, accent color, or larger, using the flyer's existing
  type system).
- Wednesday: add "p.m." to the displayed hours. Replace "with prizes" with "WIN prizes." Same
  emphasis treatment as Tuesday.
- Friday and Saturday: make "21+ in the bar area after 9 p.m." clearly emphasized.
- Sunday card: remove the Happy Hour promotion and "Happy Hour all day in the bar area." If the
  card has other content, keep it. If Happy Hour was its only content, stop and describe the options
  in the report rather than inventing a new Sunday offer.
- Happy Hour section: hours display as "3 p.m. to 6 p.m." (in the site's range style). Remove all
  Sunday Happy Hour references and remove "in the bar area". Leave the image as is (a real photo is
  coming).

## 3. Menu `/menu`

- Delete any wording about all-day Sunday Happy Hour.
- Change "Oaxaca cheese" to "cheese" in every birria and quesabirria description.
- Do not add or swap photos. Instead, produce an inventory (see Report).

## 4. Takeout and delivery `/takeout-delivery`

- Remove "Curbside on request." We do not offer curbside.
- "What holds up on the drive home":
  - Tacos al Pastor: remove the claim that warm tortillas are wrapped and placed on the side.
  - Fajitas: remove "packed to sizzle at home". Say instead: "All components are packaged separately and carefully."
  - "Feeds four to six": remove the Cinco Mamalones feature. Feature the Birria Pizza instead, stating
    it is available to-go only and feeds four to six people. There is no Birria Pizza photo yet;
    handle the image per rule 6.

## 5. Happy Hour page `/happy-hour`

- Remove "Bar and patio seating only." at the bottom.
- Sunday removal per section 1.
- Leave the Happy Hour photos as they are. Real ones are coming.

## 6. Quinceañeras `/private-parties/quinceaneras-celebrations`

- Opening copy: change the "You've already called the ballrooms" line to:
  "You've already called the ballrooms. Make the right call. Contact us now." with "Contact us now"
  linking to `/contact`.
- "Four steps" step 2: replace "Walk the room. Come by with mom and grandma. Taste the menu while
  you're here." with "Book your visit and get a tour of our private rooms. Menu tastings are available upon request."

## 7. Taco Tuesday `/taco-tuesday`

- The Fatima and Patricia photo: reframe it with the existing CSS (background-size / position or
  object-fit / object-position) so the subjects fill the frame and the cloths in the background are
  cropped out. Check it at 390, 768, 1024 and 1440. If the cloths cannot be cropped out without
  cutting the subjects, keep the best crop and say so in the report.

## 8. Birria pages `/birria-tacos` and `/quesabirria-tacos`

"Birria de Res" is a section on these pages, not its own page.

- Remove every reference to Oaxaca cheese. Call it "cheese".
- Use this description consistently wherever the birria origin is described (capitalization fixed,
  otherwise as written by the client):
  "Quesabirria started in Jalisco and Tijuana, respectively, with taco trucks taking over Instagram
  during 2020. The tortillas are semi fried in a red oil mix, creating a crisp tortilla, add cheese,
  add birria, and suddenly we have amazing cheese pulls with juicy birria and crispy tortilla."
- The birria section features: Quesabirria tacos, Birria ramen, Birria Pizza, Tacos dorados.
  Clearly state Birria Pizza is to-go only, and that tacos dorados are made with birria meat.
  `public/images/dishes/birria-ramen.jpg` exists; use it if the section has image slots.
- Remove the pull quote "The birria alone is worth the drive." and its attribution line ("The bar
  every Friday" or similar) where it does not belong. On the birria pages the quote is on-topic: keep
  the quote but remove the unrelated attribution sentence.
- Make descriptions and imagery consistent between the two pages.
- **Do not consolidate or remove a page.** That is a URL and SEO decision for Mario. Write a short
  recommendation in the report: overlap between the two pages, contradictions found, and whether
  they should merge.

## 9. Street tacos `/street-tacos`

- The hero currently uses `tacos-de-arrachera-hero.jpg` while being labeled al pastor (verify). Remove
  that image from the al pastor slot. There is no trompo photo or video yet: handle per rule 6.
- "On the grill tonight": the image labeled tacos de arrachera actually shows pork belly tacos. Do not
  call it arrachera. Relabel it as pork belly tacos, coming soon (they are being added to the menu).
  `public/images/dishes/pork-belly-tacos.jpg` also exists; view both and use whichever actually shows
  pork belly tacos.
- Remove the pull quote "The birria alone is worth the drive." (unrelated on this page).
- Parrot section: "Tacos and a casa margarita." becomes "Tacos and a house margarita." Replace
  "Blanco, fresh lime, agave, salt, frozen or on the rocks." with
  "Handcrafted margaritas. Always a great pair with our tacos. Pulps made in-house."

## 10. Fajitas and molcajetes `/fajitas-molcajetes`

- Remove "The birria alone is worth the drive." and "Every server, every night."
- Remove the current "Big Plate, Big Mami" picture (handle the empty slot per rule 6). New photos are coming.

## 11. Catering `/catering`

- "Three ways to do it" is on the wrong section. Move it to the section listing Taco bar, Fajita
  buffet and Build your own. Do not confuse that with the separate three steps explaining how the
  catering process works.
- Do not wire the inquiry form in this pass. It does not send anywhere today (DESIGN-DEBT 94) and
  needs a destination and recipient list first.

## 12. "Order on Toast" becomes "Order online"

On `/contact`, and also on `/birria-tacos` and `/quesabirria-tacos` where the same label appears.
Link targets stay the same.

## 13. Our story `/our-story`

- Change "Ricardo Rivas" to "Roberto Rivas" everywhere, including alt text. Do not rename image files.
- 2003 section: replace the copy with:
  "The first Señor Tequila's opened in Appleton, Wisconsin. The family opened Señor Tequila's on
  historic College Avenue in September 2003, as the Post-Crescent showcased in 2005. In 2006, sister
  restaurants opened adjacent to the original Señor Tequila's building under the names Casablanca
  and The Venue.
  Today, the same family, same concept, well-seasoned, matured, and experienced, serves Germantown,
  Maryland. Every other Señor Tequila's came after this one."
  (The client's draft read "as features by the Post-Crescent showcased in 2005" and used an em
  dash. This is the minimal fix; note it in the report so Sam can confirm.)
- Clean up the 2003 section layout: put the historical Post-Crescent pictures
  (`press-post-crescent-*.webp`) side by side or in another clean, readable arrangement that holds
  at every breakpoint.
- Format "La Cocina, 2006" so its design matches the 2003 timeline section.
- Do not retouch the photo with the camera flash. That is a manual edit.

## 14. Margaritas `/margaritas`

- "Germantown, Maryland. Pulps cooked in-house." becomes "Germantown, Maryland. Pulps made from scratch in-house."
  (Find the line even if the wording differs slightly.)
- "The ones you can't get anywhere else": remove Chiles. Keep Tamarindo, Pomegranate, Jamaica,
  Jalapeño. Add Watermelon, Lychee and Coconut, clearly marked as seasonal.
- The piña colada photo is not the restaurant's. Remove it now from every page that uses it
  (`drink-pina-colada*.webp`, check `/menu` too) and handle the slot per rule 6. Do not delete the file.

## 15. Gaithersburg `/mexican-restaurant-gaithersburg-md`

- Add a map. Reuse the iframe pattern from `/contact` and build the query from `business.json`, never
  a hardcoded address. Lazy-load it and give it a title attribute.
- The page shows "[Reviewer pending]" next to a quote. Flag it in the report; do not invent a name.

## 16. Late night `/late-night`

- The quesabirria photo (`quesabirrias-card.jpg`) shows veggie tacos. View
  `quesabirrias-2026.jpg`, `quesabirrias-hero.jpg` and `quesabirrias-card.jpg`. If one clearly shows
  real quesabirria tacos, use it. Then check every other page that uses `quesabirrias-card.jpg` and
  report each one, since the same wrong photo may appear elsewhere.

## Verify

1. `npm run build`, `npm run check-build`, `npm run verify`.
2. Confirm every canonical in `dist/` still matches a `<loc>` in `dist/sitemap.xml`.
3. One `<h1>` per page, no em dashes added (`grep -rn "—" src`), no "Germantown" added to an H1 outside
   the two allowed pages.
4. Screenshot the changed sections at 390 and 1440 and look at them.
5. Add one `DESIGN-DEBT.md` entry for this round listing every change. Update `TASKS.md` with the
   open items below.

## Report back with

- What changed, by page.
- Anything skipped or ambiguous, and why.
- **For Mario:** titles and meta descriptions that now contradict the page, and the birria
  consolidation recommendation.
- **Image inventory for Sam:** a table of every menu item with no photo or a placeholder (page,
  section, item name); every tequila and mezcal brand listed under Blancos, Reposados, Añejos, Extra
  añejos and Mezcal; and every image slot this pass emptied, with the exact photo it needs.
