# PASTE THIS INTO CLAUDE CODE

Four changes. Three on the homepage's Signature Dishes block, one in the header nav. All of them move pixels, so re-baseline the reference set at the end rather than fighting it.

`design/library/` is now in the repo: all 67 photographs from the client's library, at their original names, 2400px, 34MB. Source images from there.

---
---

## 1. The category tabs do nothing. Wire them up.

The Signature Dishes block has four category controls: Tacos, Fajitas & Molcajetes, Margaritas, Desserts. Only Tacos has cards behind it. Clicking the other three does nothing at all, which is how a visitor learns the page is broken.

Make them a real tab set. `role="tablist"` on the row, `role="tab"` with `aria-selected` and `aria-controls` on each control, `role="tabpanel"` on each card grid, one panel visible at a time, arrow keys moving between tabs, and the selected tab carrying the green active treatment the design already uses elsewhere. Tacos stays the default.

The six existing taco cards do not change.

## 2. Populate the three empty categories

These are drawn from the client's onboarding form, the approved copy, and their own photo library, so they are well-evidenced but **not confirmed against a current printed menu**. Build them, and add one line to `DESIGN-DEBT.md` saying the dish names and descriptions in these three panels need Roberto's confirmation before launch.

No prices anywhere. That decision stands.

### Fajitas & Molcajetes

| Card | Description | Image | Links to |
|---|---|---|---|
| **Molcajete** | Flank steak, chicken, chorizo and nopales in a volcanic stone bowl heated over an open flame. It arrives still cooking and stays hot for the better part of an hour. | `molcajete in volcanic stone bowl.jpg` | `/fajitas-molcajetes` |
| **Steak Fajitas** | Skirt steak on cast iron with peppers and onions, rice, beans, and tortillas pressed that morning. | `steak fajitas skillet with cheese and sides.jpg` | `/fajitas-molcajetes` |
| **Chicken Fajitas** | Grilled chicken with peppers and onions, still sizzling when it reaches the table. | `chicken fajitas skillet with sides.jpg` | `/fajitas-molcajetes` |
| **Mixed Fajitas** | Shrimp and steak together, for the people who cannot decide. | `mixed fajitas skillet with shrimp and steak.jpg` | `/fajitas-molcajetes` |

### Margaritas

| Card | Description | Image | Links to |
|---|---|---|---|
| **The Big Mami** | Fifty-four ounces in one glass. Meant to be shared, photographed, and regretted slightly. Two for one on Mondays. | `hand crafted array.jpg` | `/margaritas` |
| **Tamarindo** | Made with tamarind pulp we cook in our own kitchen, not a syrup. Sweet, sour, a little sticky. | `tamarindo margarita.jpg` | `/margaritas` |
| **Mangoña** | Frozen mango with chamoy and tajín around the rim. One of the first things regulars order. | `chamoy and tajin rimmed drinks.jpg` | `/margaritas` |
| **The Tornado** | Two frozen margaritas layered in one glass. | `FlavoredFrozen-2.jpg` | `/margaritas` |
| **Cantarito** | Tequila, citrus and grapefruit soda in a painted clay cup. The cup is half the point. | `cantaritos in painted clay cups with garnish.jpg` | `/margaritas` |

### Desserts

| Card | Description | Image | Links to |
|---|---|---|---|
| **Churros** | Fried to order, still hot, rolled in cinnamon sugar, with chocolate for dipping. | `churros with chocolate drip.jpg` | `/la-dulceria` |
| **Flan** | Real caramel, made here, not poured from a bottle. | `flan.jpg` | `/la-dulceria` |
| **Tres Leches** | Soaked properly, the way it is supposed to be, not a dry sponge with milk poured over it. | `tres leches.jpg` | `/la-dulceria` |
| **Volcán de Chocolate** | Warm chocolate cake that runs when you cut it. | `volcan de Xocolate.jpg` | `/la-dulceria` |

Match the existing taco cards exactly: same aspect ratio, same crop behaviour, same type, same card treatment. Alt text is the dish name plus what the photograph shows.

## 3. Rebuild the expand interaction

The cards say "tap to expand" and nothing expands. Remove that text label entirely; it is a chip explaining a feature rather than a feature.

Make the card itself the control:

- The whole card is a button. Keep the `<a>` to the dish page **inside** the expanded content, not wrapping the card, so a click expands rather than navigates.
- Affordance replaces the label: a small chevron in the corner, rotating 180 degrees when open. Use the icon style already on the page, drawn as inline SVG.
- Expanding reveals the full description and a "See the page" link to the destination in the table above.
- Animate the height properly. Use the `grid-template-rows: 0fr` to `1fr` technique rather than a `max-height` guess, so the transition ends exactly where the content ends. Around 280ms, and use the easing already in the stylesheet if there is one.
- More than one card can be open. Do not auto-close the others; that surprises people mid-read.
- `aria-expanded` on the button and `aria-controls` pointing at the panel. Enter and Space both work. Escape closes the focused card.
- Wrap the transition in `@media (prefers-reduced-motion: reduce)` so it becomes an instant show for anyone who has asked for that.

Keep it to vanilla JavaScript in the same style as the mobile nav toggle. No framework.

## 4. Change the nav label from "Tonight" to "Tacos"

Same destination, `/taco-tuesday`. Every page, header and footer.

"Tonight" is vague, it sits above Menu in a restaurant nav where Menu should lead, and it lands on a page about tacos. It also wastes forty internal links: anchor text is a ranking signal, "Tonight" targets nothing anybody searches, and "Tacos" points at the page we are trying to rank for taco terms. That page is being rebuilt around exactly that, so the label should match.

Do not add a nav item. Swapping keeps the count at five, and "TACOS" is narrower than "TONIGHT", which gives the 905px header threshold slightly more room rather than less.

## 5. One honesty problem to flag, not fix

The Signature Dishes eyebrow reads "top sellers from Toast". We never received Toast sales data; it was on the pending list and never arrived. The six taco cards may be a reasonable guess, and the twelve you are adding are definitely a guess, so the claim is not true for any of them.

Do not change it yourself. Add it to `DESIGN-DEBT.md`: either Roberto sends the real Toast numbers, or the eyebrow becomes something honest like "what people actually order". Tell me which pages carry that phrasing.

## Then

Build, confirm zero console errors, and check the expand and the tabs with a keyboard as well as a mouse at 390, 768 and 1440.

Then re-baseline `design/reference/` and update the manifest, noting that this baseline includes the dish panels, the expand interaction and the nav label change. Re-run the visual check against the new set so we know the site is stable, and report anything that moved on a page other than the homepage, since nothing should have.
