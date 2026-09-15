# PASTE THIS INTO CLAUDE CODE

Your Phase 2 inventory of `/menu` counted 34 image slots. The page has 127. Every dish card on `/menu` carries a 76px thumbnail (`data-dc-tpl="89"`), and 94 of them are `url("")` with a dashed border and a `PHOTO` label. Those are placeholder slots the design shipped with, and an empty `url()` never matched your grep, so the map never saw them. Right now `/menu` is 25 of 127 illustrated, and 35 of the empty rows (36 slots, Tacos de la Costa is listed twice) have a 2026 photograph already sitting in `public/images/dishes/`.

Nothing else on the site has this problem. `/menu` is the only page with empty `url()` slots, and the 8 cocktail thumbnails that still point at `design/library/` hashes (Bésame Mucho, Oaxaca Old Fashioned, Mi Amor, Baby Maker, Paloma, Michelada, Tamarindo, Cantarito) are correct and stay.

## Fill these. Same discipline as the rest of the map: `was` guard, `mechanical` or `proposed`.

| Menu row | File | Confidence |
|---|---|---|
| Mexican Chicken Wings | `mexican-chicken-wings.jpg` | mechanical |
| Flautitas de la Casa | `flautitas-de-la-casa.jpg` | mechanical |
| Flautitas de Pollo (kids) | `flautitas.jpg` | proposed, confirm the frame is the four-piece version |
| Tamales | `tamales-de-pollo.jpg` | mechanical |
| Sopes | `sopes.jpg` | mechanical |
| 1 Sope (kids) | `sopes.jpg` | mechanical |
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
| Tacos de la Costa (crispy breaded shrimp) | `tacos-de-camaron.jpg` | proposed, only if the photo shows breaded shrimp |
| Tacos al Carbón (grilled chicken) | `tacos-de-pollo.jpg` | proposed |
| Queso Bowl | `queso-dip.jpg` | mechanical |
| Chips & Queso (kids) | `queso-dip.jpg` | mechanical |
| Chicken Quesadilla (kids) | `quesadilla.jpg` | proposed |
| Mini Nachos (kids) | `nachos.jpg` | proposed |
| 1 Quesabirria Taco (kids) | `quesabirrias-card.jpg` | mechanical |
| 2 Tacos de Pollo (lunch) | `tacos-de-pollo.jpg` | mechanical |
| Malteadas Deluxe (Oreo or strawberry) | `oreo-milkshake.jpg` | proposed |
| Cheesecake Chimichanga | `cheesecake-chimichanga.jpg` | mechanical |
| Volcán de Xocolate | `volcan-de-xocolate.jpg` | mechanical |
| Fried Ice Cream | `fried-ice-cream.jpg` | mechanical |
| Tornado | `tornado.jpg` | mechanical |

For the `proposed` rows, open the photograph and check it against the row's own description before placing it. If it does not match, leave the placeholder. Do not reach for a nearby image; that rule has not changed.

## Leave these empty. No photograph exists.

The remaining 58 `PHOTO` rows have no 2026 shot: Chile Relleno, Tacos Dorados, Pa' la Banda, Plátanos Fritos, Pozole, Fajita Taco Salad, Garden Fajita, Enchiladas de Carnitas, Enchiladas de Camarón, Carne Asada, Arroz con Pollo, Tequila's Chicken Platter, Pollo Asado, Fajita Burrito, Jambalaya Burrito, Mac & Cheese, the kids cheeseburger and nuggets, and the whole cocktail, tequila and beer list beyond the 8 that already have photos. Keep them as they are. Print the exact list of rows still empty after this pass; that is the client's shot list.

## Photos with no menu row

Six files in `public/images/dishes/` match nothing on `/menu`: `pork-belly-tacos.jpg`, `pork-belly-guacamole.jpg`, `quesaveggies.jpg`, `fajita-de-camarones.jpg`, `enchiladas-de-pollo.jpg`, `fresa-milkshake.jpg`. Do not add rows. Add them to DESIGN-DEBT entry 35 alongside the two dishes already listed there, since the client photographed six things the menu page does not sell, and that is a question for Roberto.

## Then

Update `design/IMAGE-MAP.json` with the new rows so a re-export re-applies them. Apply. Compare HEAD against the working tree at 390, 768 and 1440: only `/menu` should differ, and only in the thumbnail column. Do not re-baseline; the reference set is still stale from the 11th, as you said, and that is a separate decision.

Report: rows filled (mechanical and proposed separately), rows you refused because the photo did not match the description, and the final empty-row list.
