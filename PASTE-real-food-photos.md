# PASTE THIS INTO CLAUDE CODE

The client sent their 2026 food photography. This replaces the placeholder imagery across the whole site and supersedes the `IMAGE-MAP.json` task from the earlier brief, since that was built around a much smaller library.

**Source folder** (read-only, do not modify it):

```
/Users/sll/Desktop/Surge-Cowork/workspace/clients/senor-tequila/Tequilas food pics 2026/
```

283 files, 4.9GB, professionally shot, named by dish. Roughly 60 distinct dishes with several frames each.

---
---

## What is wrong right now, so you know what you are fixing

I inventoried all 142 image references in `src/pages/`. Three problems:

**A handful of photographs are doing the work of a whole site.** `5ac1271d5937960b.jpg`, a molcajete, appears as the Our Story hero, as the Our Story "kitchen" shot, as the homepage fajitas card, and on the menu page. `4e4e97cc03520928.jpg` appears on four pages. The site has roughly 20 unique food photographs stretched across 142 slots.

**Several are the wrong dish entirely.** The `/birria-tacos` hero is a quesabirria photograph, which is a different dish. `/la-dulceria` has a plate of street tacos in its dessert-table slot. `/tequila-bar` has the karaoke poster in its bar photo slot.

**Five are still remote WordPress files.** `Margaritas.jpg` on four dish pages, `DSC07183-HDR.jpg` on catering, `DSC00415-scaled.jpg` on weddings, `Photo-Sep-05-2025...jpg` on quinceañeras. Those 404 the day the old site comes down, so this is a launch blocker, not a polish item.

## Phase 1: curate and optimise. Report before doing anything else.

283 files at 4.9GB cannot go in the repo. Curate down first.

Pick the **single best frame per dish**, and a second frame only for the dishes that need both a hero and a card: birria, quesabirria, street tacos, fajitas, molcajete, churros. Target roughly 70 files.

Judge the frames by eye, not by filename: sharpest, best lit, most appetising, tightest crop, nothing cut awkwardly at the edge. Where a name ends in `with steam` the steam usually makes the shot better, so prefer those for fajitas and molcajetes.

**Exclude these, they are the client's own instruction:**
- `Do not use.jpg`, `do not use (1).jpg`, `do not use (2).jpg`
- `Mexican Chicken wings ( do not use).jpg`
- `Pollos divorciados( do not use).jpg` and its two variants, and `pollos divorciados ( do not use).jpg`
- `Flautitas ( coloring is off).jpg`
- The two files with no extension: `carnitas` and `torta de pollo`
- `Chile en nogada` is marked as a limited-time dish. Curate it, but do not place it anywhere on the site; a seasonal dish on a permanent page goes stale.

Then optimise: resize to 1600px on the long edge, JPEG quality 82, strip EXIF. That should land each file around 200 to 300KB and the whole set under 20MB.

Write them to `public/images/dishes/` with clean kebab-case names derived from the dish, so `Tacos Al Pastor (1).jpg` becomes `tacos-al-pastor.jpg`. No numbers in the final names unless there are genuinely two frames of one dish, in which case `-hero` and `-card`.

**Stop here and report:** the full list of dishes you kept, the filename for each, the total file count and total size, and anything you excluded beyond the list above with your reason.

## Phase 2: the map. Report before applying.

Build `design/IMAGE-MAP.json`, one row per image slot that changes: page, slot description, what is there now, the new file, and a confidence of `mechanical` or `proposed`.

Work through every page. The pages and their slot counts, from my inventory:

| Page | img | css background |
|---|---|---|
| `/menu` | 2 | 32 |
| `/` | 10 | 10 |
| `/our-story` | 3 | 5 |
| `/private-parties` | 1 | 6 |
| `/birria-tacos`, `/quesabirria-tacos`, `/street-tacos`, `/fajitas-molcajetes` | 2 each | 5 each |
| `/la-dulceria` | 2 | 4 |
| `/taco-tuesday` | 0 | 5 |
| `/takeout-delivery`, `/happy-hour`, `/margaritas`, `/tequila-bar` | 2 each | 1 to 2 each |
| the rest | 1 each | 2 each |

The CSS backgrounds matter as much as the `<img>` tags. That is where most of the wrong images are hiding, and it is what the last photo pass missed.

### Mapping rules

Match by dish, using the slot's own copy and heading to decide what it should show, not the filename of what is there now.

Specific corrections I already know are needed:

| Page and slot | Should show |
|---|---|
| `/birria-tacos` hero | Actual birria, not quesabirria. The new folder has no plain birria taco shot, so keep the existing birria photo from `design/library/` and flag it. |
| `/quesabirria-tacos` hero | `Quesabirrias` |
| `/street-tacos` hero | `Tacos de Arrachera`, `Tacos Chilangos` or `Tacos de Carnitas`, your pick |
| `/fajitas-molcajetes` hero | `Triple A molcajete` |
| `/la-dulceria` every slot | Churros, Flan, Tres Leches cake, Volcan de Xocolate, Fried Ice cream, Cheesecake Chimichanga. The new folder covers this page completely. |
| `/tequila-bar` bar photo | Not the karaoke poster. Use a bar interior from `design/library/`. |
| `/our-story` hero | The Rivas brothers photo, not a molcajete |
| `/taco-tuesday` cards | `Tacos Al Pastor`, `Tacos Perrones`, `Tacos Cinco Mamalones` |
| `/catering`, `/private-parties/weddings-receptions`, `/private-parties/quinceaneras-celebrations` heroes | These are the remote WordPress files. Replace with the best available, and if nothing fits, a labelled placeholder rather than a remote URL. |

Two hard rules carried over from before, and they still apply.

**Room cards on `/private-parties` get placeholders, not food.** We still have no photographs of the Mexican Room, International Room, Indoor Patio, Vallarta or Tulum. A plausible-looking wrong room is worse than an honest empty one.

**Never substitute for a missing subject.** If a slot needs flan and flan exists, use it. If a slot needs something the library does not contain, it stays a labelled placeholder. Reaching for a nearby image because a slot looks empty is exactly what produced tacos on the desserts page.

Mark anything you are unsure of as `proposed` and I will review those rows individually.

## Phase 3: apply, then the gated re-baseline

Apply the map. Then, **before re-baselining anything**, run the visual check against the current references and look at what moved. Every page with a changed image should differ and nothing else should. If a page differs for a reason you cannot explain by the map, stop and report rather than re-baselining over it. A re-baseline turns "this changed" into "this is correct" silently and for every page at once.

Then re-baseline, update the manifest, and note that this baseline carries the 2026 food photography.

## Final report

1. Every dish kept, its final filename and size, plus the total.
2. Every slot changed, by page, old image to new.
3. Every slot left as a placeholder and what shot it needs.
4. Every remaining `senortequilas.com` reference. The logo will still be there; nothing else should be.
5. Visual regression results, with any difference not explained by the map called out explicitly.

## One thing to add to DESIGN-DEBT.md while you are in there

This folder is effectively a menu inventory, and it names dishes the website does not mention anywhere: Birria Ramen, Birria Fries, Asada Fries, Pork Belly Guacamole, Tacos Chilangos, Frida's Salmon, Mexican Chicken Wings, Sopa de Tortilla, Esquites, Sopes, Flautitas, Tamales de Pollo, QuesaVeggies, Cheesecake Chimichanga, Fried Ice Cream, Fresa and Oreo milkshakes, and Chile en Nogada as a seasonal special.

List which of those already appear on `/menu` and which do not. Do not add any of them. But a professional photograph exists for every one, which means the menu page is probably shorter than the actual menu, and that is worth a conversation with the client.
