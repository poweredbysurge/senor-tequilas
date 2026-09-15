# PASTE THIS INTO CLAUDE CODE

Copy and content changes from the Sept 14 client call. Every item below is a decision the client made on the record; none of it is a guess. Work through it in order, report what you changed per page, and do not touch anything not listed here. Launch is Sept 28.

Source of truth for facts is the Google Doc "Website Facts (Completed, updated Sept 14)"; the blue text there is what changed. This prompt is the executable version of that blue text.

---
---

## 0. Before anything: protect `src/`

DESIGN-DEBT entry 36 says `npm run assemble` would overwrite the gift card artwork, the reviews rail nav, the footer choice and eight hand-deleted `[PENDING]` blocks. Decision: **`src/` is the artifact from here on. The regeneration path is retired.** The design will not be re-exported before launch, and every real change since Phase 5 has gone into `src/` directly.

Do this: make `npm run assemble` refuse to run unless invoked with `--i-know-this-overwrites-src`, print entry 36 when refused, and add a line at the top of `scripts/build-site.mjs` saying so. Leave `design/` in place as the archive. Update entry 36 to "decided: src/ is the artifact" and close it. Confirm the gift card image is still referenced on the homepage and in the mobile menu when you are done.

## 1. Pricing comes off the events and catering pages

Remove every price on `/private-parties`, both sub-pages, and `/catering`. Current hits: `$22` appears 19 times across four files, `$30` and `$40` twice each on `/catering`. Jeremy's reasoning, so the replacement copy has the right tone: a floor scares off the people they would close after a conversation.

Replace the money with custom-quote language in the voice of the pages. Where a block says "Quotes start at $22 a person and depend on your menu," it becomes something close to "Every quote is custom. Tell us the date, a rough headcount and what you are celebrating, and we come back with a real number." The "What does it cost?" FAQ answer follows the same line and drops the hourly room fee sentence. On `/catering`, "Delivery is $30. Want us to stay and serve? $40 an hour per server" becomes "We deliver up to 20 miles from Germantown. Want us to stay and serve? Ask, and we will quote it, setup and breakdown included." Keep the 48-hour notice, the 20-mile radius and the no-minimum-headcount line; those stay.

The menu itself is a separate question still open with the client; `/menu` stays price-free except for the happy hour section, which gets prices in section 8.

## 2. Deposit language

Everywhere "Your deposit is the room fee, refundable up to 48 hours out" appears (private parties FAQ, `/catering` line 58 area, and anywhere else): replace with "Because every event is different, deposits are set contract by contract. We walk you through it before you commit." Keep "No deposit until you say yes" where it already appears; that is still true.

## 3. Bar service wording

The "Open bar?" FAQ on `/private-parties` currently answers "Cash bar or drink tickets, your call." Change to: "Open bar, cash bar or drink tickets, your call. A dedicated bartender and a mini bar in your room are available as upgrades." Open bar here means the host settles the tab; do not write "unlimited."

On `/catering`, the bar block currently says "cash bar or drink tickets, with our bartender." Change to: "We are licensed to run the bar at your location, open bar, cash bar or drink tickets, with our bartender. Margaritas by the gallon travel to catered events." Then, on `/takeout-delivery`, the line "Margaritas don't leave the building" stays exactly as is, and add one sentence after it: "The exception is a catered event, where we can bring the bar to you," linking `/catering`.

## 4. Entertainment add-ons, a new block on the private events hub

Add a section to `/private-parties` after the rooms and before the FAQ, using the existing card grid treatment. H2 **Entertainment Add-Ons**. Deck: "Beyond the room and the food, we can book the night for you." Cards, one line each, no prices: DJ booth with professional sound and lighting; DJs and party hosts; karaoke; live acoustic guitar or saxophone; mariachi; LED dance floor; transformer performers. Link the mariachi card to `/live-mariachi` if that page exists, otherwise no link. Do not add this to the sub-pages; one line on each sub-page pointing back to the hub section is enough.

Remove any copy that implies a built-in dance floor. There is none; the LED floor is a rental add-on.

## 5. Tomas, the private party coordinator

On `/private-parties` and both sub-pages, next to the enquiry form, add a coordinator block: a labelled photo placeholder `[PENDING: Tomas headshot]`, the name Tomas, the title Private Party Coordinator, and one line: "Every quote is custom. Tell me about your night and I will walk you through it." Below the form, a small line: "We reply fast. Same day, usually within the hour." Do not promise a number of minutes; Sam has not set the window yet.

## 6. Menu items that are gone

Pa' la Banda is discontinued. Remove it from `/takeout-delivery` (the sampler card and the "A Pa' la Banda sampler for the table" sentence) and from `/menu` (the "FEEDS 4+" row). Do not replace it with another dish; tighten the surrounding copy instead. Birria Pizza is not on the site and stays off. Cinco Mamalones stays; it is real, it is a single meal, and it is already described that way.

Check `/menu` against the May 21 menu PDF the client sent today, section by section, and report any dish that is on one and not the other. Report only; do not add or remove beyond Pa' la Banda.

## 7. The weekly calendar, everywhere it appears

Saturday keeps "College football on" (confirmed). Sunday: remove any college reference and add "Happy hour all day in the bar area." Friday and Saturday read "Live DJ in the bar area, 9 PM to 1 AM." These edits touch `/`, `/taco-tuesday`, `/happy-hour`, `/late-night` and any other page carrying the calendar; list them.

## 8. Happy hour: where it lives, the prices, and how it is promoted

The happy hour menu is already on the site in two places: as the last section of `/menu` ("Happy Hour, Monday to Friday, 3 to 6, in the bar area") and as the drinks-and-bites lists on `/happy-hour`. Both match the last page of the May 21 menu PDF item for item. Do not add the PDF page as an image; the text version is what ranks.

**Prices go on the happy hour items, and only the happy hour items.** The rest of `/menu` stays price-free; that decision is still open with the client. Happy hour is the one place a price is the offer. Use the existing price treatment if the menu rows have one (a muted right-aligned figure), otherwise a small gold figure right of the name, same on both pages. From the PDF:

```
Drinks
House Margarita, 12 oz on the rocks, lime, mango or strawberry     $6
Handcrafted Margaritas, 14 oz: jalapeño, tamarindo, pomegranate     $13
Margarita Flight, three 5 oz, frozen or rocks, lime, mango, strawberry   $12
House Red Sangria, 12 oz     $6
Draft Beer, 22 oz, import or domestic     $6
Green Tea Shooters     $6

Bites
1 Quesabirria Taco     $6
2 Tacos de Pollo     $7
Tacos al Pastor     $7
2 Tacos Mañaneros     $6
Chips & Queso     $6
Mini Nachos, carnitas or grilled chicken (flank steak +$2)     $7
Platanitos     $6
Esquites     $6
Flautitas de Pollo     $6
1 Sope     $7
```

Add `offers` with `price` and `priceCurrency` to the happy hour items in the `Menu` JSON-LD if the page carries one; do not add offers anywhere else.

Then:

- Add Sunday to both places: "Monday to Friday 3 to 6, and all day Sunday, in the bar area." Update the `/happy-hour` hero deck and the `/menu` section intro. Update the happy hour `OpeningHoursSpecification` in the JSON-LD if one exists.
- On `/happy-hour`, add a section with `id="sunday"` near the top. H2 **Sunday Happy Hour, All Day in the Bar Area**. Body: game day specials every Sunday, every NFL game on, open to close, linking `/game-day`. Ahrefs: "sunday happy hour near me" is 1,800 a month and "all day happy hour near me" is 700 at zero difficulty, so those two phrases appear in the H2 and the first sentence, naturally.
- `/happy-hour` title tag becomes `Happy Hour in Germantown, MD: Weekdays 3 to 6 and All Day Sunday | Señor Tequila's`. Meta description names the Sunday all-day happy hour and three of the priced items.
- Promotion: the homepage happy hour strip gets the Sunday line. Add a one-line happy hour callout to `/late-night` ("Happy hour runs 3 to 6, then the night starts") linking `/happy-hour`. `/game-day` links to `/happy-hour#sunday` from its own prompt.

## 8b. The 94 empty menu thumbnails (folded in from PASTE-menu-thumbnails)

Your Phase 2 inventory of `/menu` counted 34 image slots. The page has 127. Every dish card carries a 76px thumbnail (`data-dc-tpl="89"`), and 94 of them are `url("")` with a dashed border and a `PHOTO` label. An empty `url()` never matched your grep. `/menu` is 25 of 127 illustrated, and 35 of the empty rows (36 slots, Tacos de la Costa is listed twice) have a 2026 photograph already in `public/images/dishes/`. Nothing else on the site has this problem, and the 8 cocktail thumbnails still pointing at `design/library/` hashes (Bésame Mucho, Oaxaca Old Fashioned, Mi Amor, Baby Maker, Paloma, Michelada, Tamarindo, Cantarito) are correct and stay.

Fill these, same discipline as the rest of the map: `was` guard, `mechanical` or `proposed`.

| Menu row | File | Confidence |
|---|---|---|
| Mexican Chicken Wings | `mexican-chicken-wings.jpg` | mechanical |
| Flautitas de la Casa | `flautitas-de-la-casa.jpg` | mechanical |
| Flautitas de Pollo (happy hour) | `flautitas.jpg` | proposed, confirm the frame is the four-piece version |
| Tamales | `tamales-de-pollo.jpg` | mechanical |
| Sopes | `sopes.jpg` | mechanical |
| 1 Sope (happy hour) | `sopes.jpg` | mechanical |
| Chicken Tortilla Soup | `sopa-de-tortilla.jpg` | mechanical |
| Tacos de Arrachera | `tacos-de-arrachera-card.jpg` | mechanical |
| Mazatlán Fajita | `fajita-mazatlan.jpg` | mechanical |
| Carnaval Fajita | `fajita-carnaval.jpg` | mechanical |
| Jalisco Fajita (hand-cut skirt steak) | `steak-fajitas-card.jpg` | proposed |
| Tradicional Fajita (choice of protein) | `fajita-de-pollo.jpg` | proposed |
| Triple "A" Molcajete | `triple-a-molcajete-card.jpg` | mechanical |
| Mexicano Molcajete | `mexican-molcajete.jpg` | mechanical |
| Enchiladas de Mole | `enchiladas-de-mole.jpg` | mechanical |
| Enchiladas de Espinaca | `enchiladas-de-espinaca.jpg` | mechanical |
| Arrachera (platter) | `arrachera.jpg` | mechanical |
| Carnitas (platter) | `carnitas-platter.jpg` | mechanical |
| Torta Chingona (chicken milanesa torta) | `torta-de-pollo.jpg` | proposed |
| Frida's Salmon | `fridas-salmon.jpg` | mechanical |
| Mixed Grill Chimichanga | `chimichanga.jpg` | proposed |
| Garden Burrito | `vegetarian-burrito.jpg` | proposed |
| Tacos de la Costa (crispy breaded shrimp), both rows | `tacos-de-camaron.jpg` | proposed, only if the photo shows breaded shrimp |
| Tacos al Carbón (grilled chicken) | `tacos-de-pollo.jpg` | proposed |
| Queso Bowl | `queso-dip.jpg` | mechanical |
| Chips & Queso (happy hour) | `queso-dip.jpg` | mechanical |
| Chicken Quesadilla (kids) | `quesadilla.jpg` | proposed |
| Mini Nachos (happy hour) | `nachos.jpg` | proposed |
| 1 Quesabirria Taco (happy hour) | `quesabirrias-card.jpg` | mechanical |
| 2 Tacos de Pollo (happy hour) | `tacos-de-pollo.jpg` | mechanical |
| Malteadas Deluxe (Oreo or strawberry) | `oreo-milkshake.jpg` | proposed |
| Cheesecake Chimichanga | `cheesecake-chimichanga.jpg` | mechanical |
| Volcán de Xocolate | `volcan-de-xocolate.jpg` | mechanical |
| Fried Ice Cream | `fried-ice-cream.jpg` | mechanical |
| Tornado | `tornado.jpg` | mechanical |

For the `proposed` rows, open the photograph and check it against the row's own description before placing it. If it does not match, leave the placeholder. Do not reach for a nearby image.

The remaining 58 `PHOTO` rows have no 2026 shot (Chile Relleno, Tacos Dorados, Plátanos Fritos, Pozole, Fajita Taco Salad, Garden Fajita, Enchiladas de Carnitas and de Camarón, Carne Asada, Arroz con Pollo, Tequila's Chicken Platter, Pollo Asado, the two burritos, Mac & Cheese, the kids cheeseburger and nuggets, and the cocktail, tequila and beer list beyond the 8 that have photos). Keep them as they are and print the exact list of rows still empty after this pass; that is the client's shot list. Pa' la Banda is removed in section 6, so it drops off the list.

Six files in `public/images/dishes/` match nothing on `/menu`: `pork-belly-tacos.jpg`, `pork-belly-guacamole.jpg`, `quesaveggies.jpg`, `fajita-de-camarones.jpg`, `enchiladas-de-pollo.jpg`, `fresa-milkshake.jpg`. Do not add rows. Add them to DESIGN-DEBT entry 35, since the client photographed six things the menu page does not sell.

The `/happy-hour` bites list should carry the same thumbnails as the matching `/menu` rows once they are placed, if that list has image slots; if it does not, leave it.

Update `design/IMAGE-MAP.json` with the new rows so the decisions are recorded, even though the regeneration path is retired.

## 9. Small fixes

- `/takeout-delivery`: the order cutoff is under review. Wherever it says orders are taken until 15 minutes before closing, change to "Order online until shortly before close" and add `[PENDING: takeout cutoff, 15 minutes before close or 11:45 PM on late nights]` in the source as a comment, not visible.
- Review count stays "over 5,600" everywhere; confirm it is not written as a hard number anywhere.
- `/our-story`: keep the founding story and chef placeholders. Change the chef placeholder label to `[PENDING: head chef name, credentials and bio; dessert chef name and bio]` so it asks for both.

## Then

Build, zero console errors, check `/private-parties`, `/catering`, `/takeout-delivery`, `/happy-hour`, `/menu`, `/late-night` and the homepage at 390, 768 and 1440.

Compare HEAD against the working tree at all three widths. Every page listed above should differ; nothing else should. On `/menu` the only differences should be the thumbnail column, the happy hour prices, the Sunday line and the missing Pa' la Banda row. Do not re-baseline.

Final report: every price removed, by file and line, and confirmation that the only prices left on the site are the sixteen happy hour items; every page whose calendar copy changed; the `/menu` versus PDF diff; thumbnails filled (mechanical and proposed separately), thumbnails refused because the photo did not match, and the final empty-row list; the `assemble` guard confirmation with the gift card check; and every `[PENDING]` now on the site, so Roberto gets one list.
