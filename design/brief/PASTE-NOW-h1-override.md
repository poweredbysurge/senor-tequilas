# PASTE THIS INTO CLAUDE DESIGN NOW

Paste everything below the line. It is written to override the earlier instructions in this project, which is why it opens the way it does.

---
---

## STOP. The H1 reference you have been working from is out of date.

Earlier in this project you were given a copy reference that listed headlines like "Birria Tacos Near You, in Germantown, MD" and told you the copy was law and must appear verbatim. **That reference was wrong and I am replacing it now.** You have been correctly enforcing it, and that is why every audit pass keeps restoring the long headlines. It is not your error. The instruction was bad.

Those headlines run four and five lines and overflow into the photo column. Delete them from your working reference. **The list below is the only H1 list that applies to this project from this point forward.** If any earlier instruction, audit table or reference document in this conversation disagrees with the list below, the list below wins.

Do not re-audit against the old reference again.

## Replace these exact strings, everywhere they appear

Search the whole project. Every artboard, every concept, every batch file, desktop and mobile.

| Find this H1 | Replace with | And set this eyebrow above it |
|---|---|---|
| Birria Tacos Near You, in Germantown, MD | **Birria Tacos** | GERMANTOWN, MD · SIX-HOUR BRAISE |
| Quesabirria Tacos in Germantown | **Quesabirria Tacos** | GERMANTOWN, MD · SIX HOURS, THEN A GRIDDLE |
| Street Tacos in Germantown | **Street Tacos** | GERMANTOWN, MD · TORTILLAS PRESSED DAILY |
| Fajitas and Molcajetes, Still Sizzling | **Fajitas & Molcajetes** | GERMANTOWN, MD · SERVED STILL SIZZLING |
| Taco Tuesday in Germantown | **Taco Tuesday** | GERMANTOWN, MD · PLUS FREE BINGO AT 8 |
| Taco Catering in Germantown, Maryland | **Taco Catering** | GERMANTOWN, MD · WE TRAVEL TO YOU |
| A Private Room That Already Knows How to Feed 100 People | **Private Rooms for 12 to 400** | GERMANTOWN, MD · FOUR ROOMS, TWO PATIOS |
| Quinceañera Venues in Germantown, Without the Banquet Hall Price | **Quinceañeras, Without the Ballroom Price** | GERMANTOWN, MD · UP TO 100 GUESTS |
| Wedding Receptions and Showers in Germantown, MD | **Weddings, Showers, Receptions** | GERMANTOWN, MD · UP TO 100 GUESTS |
| Happy Hour in Germantown, Monday Through Friday | **Happy Hour in Germantown** | MONDAY TO FRIDAY · IN THE BAR |
| Mexican Food Near Gaithersburg, Ten Minutes Up 270 | **Mexican Food Near Gaithersburg** | TEN MINUTES UP 270 · FREE PARKING |

These nine H1s do not change. Give each one the eyebrow shown, and leave the headline alone:

| Page | H1 stays as it is | Eyebrow to add |
|---|---|---|
| `/` | From Mexico, With Love | GERMANTOWN, MD · FAMILY-OWNED SINCE 2015 |
| `/menu` | The Menu | GERMANTOWN, MD · PRESSED THIS MORNING |
| `/our-story` | We're Not a Chain. We're a Family. | THE RIVAS BROTHERS · SINCE 2015 |
| `/takeout-delivery` | Don't Do the Dishes | DELIVERY & PICKUP · GERMANTOWN, MD |
| `/margaritas` | The Margaritas People Text Their Friends About | GERMANTOWN, MD · PULPS COOKED IN HOUSE |
| `/tequila-bar` | It's in the Name for a Reason | GERMANTOWN, MD · TEQUILA & MEZCAL |
| `/late-night` | Still Open. Still Cooking. | GERMANTOWN, MD · OPEN TO 1 AM |
| `/karaoke` | Karaoke Every Thursday | GERMANTOWN, MD · 7:30 TO MIDNIGHT |
| `/la-dulceria` | La Dulcería | GERMANTOWN, MD · MADE BY OUR DESSERT CHEF |

## The rule that prevents this coming back

**Only two pages on this site are allowed to carry a city inside the H1: `/happy-hour` and `/mexican-restaurant-gaithersburg-md`.** Every other page carries the city in the eyebrow, the title tag, the deck and the footer, and never in the headline.

Reason, so you can apply it to future pages without asking: "birria tacos germantown" gets zero searches a month. "birria tacos near me" gets 48,000. Google resolves "near me" from the business location signals, not from the words in the H1. Putting the town in the headline buys nothing and costs the layout.

**Title tags do not change.** They keep the full geo phrasing. Only the on-page H1 changes.

## Fix the overflow while you are in there

There is a live bug: on the birria page the H1 runs five lines and collides with the photo. Shortening the text removes the cause. Do not stop there.

- Set the H1 with a fluid clamp, roughly `clamp(2.75rem, 6vw, 6.5rem)` for the short dish headlines, so it scales and can never overflow its column. Never a fixed pixel size.
- Give the text column a max width. **No H1 may cross into the photo column at any width between 390 and 1920.**
- Use `text-wrap: balance` so a two-line headline splits evenly.
- Now that the headlines are short, **set them larger.** A two-word H1 left at the old size leaves a hero that looks half empty, which is a different failure from the one we are fixing.
- Two lines is the hard ceiling. If an H1 still needs three lines at the smallest clamp size, stop and tell me. Do not shrink the type to force it.

## What not to touch

Nothing below the hero. No colors, no section order, no body copy, no photos. H1 text, eyebrow text, and the hero type sizing only.

## Report back

1. A list of every file you changed and the before and after H1 for each.
2. One line per dish page confirming the H1 no longer overlaps the photo at 390, 768, 1440 and 1920 wide.
3. A search result for the string "Germantown" inside any H1 anywhere in the project. The only two allowed hits are `/happy-hour` and `/mexican-restaurant-gaithersburg-md`. If you find others, name the file.

One more thing: there is an unresolved syntax error in the logic class that is rendering only footers on some pages. Fix that first if it is still present, then do the above, so I can actually see the result.
