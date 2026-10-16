# Media placement, round 1

Paste the line below into Claude Code from the repo root:

    Read PASTE-media-placement-1.md and do everything in it.

---

New client photos and videos are in `incoming-media/`. `incoming-media/MEDIA-MANIFEST.md` says what each
file shows and how confident the match is. Read it first. Place the files below on the site.

## Rules

- Work on a new branch, `media-placement-1`. Don't push to `main`.
- Read `CLAUDE.md`, `STANDARDS.md` and the last entries of `DESIGN-DEBT.md` (95 to 97) first.
- **Never commit the originals.** `incoming-media/` and `_media-source/` are git-ignored, so leave them
  that way. Make web versions in `public/images/` following the existing pattern for that slot
  (format, the `-lg` pairs, file naming, dimensions). Check what's there before you choose. Strip
  metadata and fix EXIF rotation.
- Videos: make a short, muted, web-ready MP4 (H.264, no audio unless the slot already has it) plus a
  poster `.jpg`, following how `public/videos/` and the existing `<video>` tags work.
- Before placing each photo, look at it and make sure it shows what the slot says. If a match looks
  wrong, skip it and say so.
- Use only the files listed here. Ignore the `REFERENCE-*` files, and don't use `bonus-*` files unless a
  slot below says to. Never fetch, generate or substitute an image.
- No CSS conversion, no breakpoint changes, no em dashes. Alt text is plain and describes the photo.
- Don't change titles, meta descriptions, canonicals or URLs (Mario's).
- When a photo replaces one of the round 1 stand-ins (the red-texture fact cards, the PHOTO frames,
  the removed images), keep any fact the stand-in carried as text on the card. Example: "To-go only"
  for the Birria Pizza.

## Placements

**Homepage `/`**
- Happy Hour section image: `hh-spread-1.jpg`. If it crops badly in that slot, use `hh-group-1.jpg`.

**`/happy-hour`**
- Put the video back where round 1 left the HTML comment, using `happy-hour-video-1.mov`
  (11s, cocktails on the bar). It replaces the removed Sunday video. Don't bring back any Sunday copy.
- Replace the Happy Hour photos with real ones. Every photo must match an item on the current Happy
  Hour menu in `src/pages/menu.astro`:
  - Handcrafted margaritas: `hh-handcrafted-1.jpg`
  - Margarita flight: `hh-flight-1.png`
  - Platanitos: `hh-platanitos-1.jpg`
  - Frozen or house margarita: `hh-margarita-2.jpg`
  - Drinks overall (beer, shots): `hh-drinks-1.jpg`
  - Spread or group shots: `hh-spread-2.jpg`, `hh-group-1.jpg`
- If an item has no matching photo (2 tacos mañaneros), leave its current treatment and list it.

**`/menu`**
- Happy Hour tab: same matching as above. Each picture must match the item it sits on.
- Shooters tab image: `shooters-airplane-2.jpg` (the multicolor shooters). It's 1024px, so don't
  use it anywhere larger than it holds up.
- Frozen Piña Colada slot: `pina-colada-1.jpg`.
- Every item that shows the PHOTO frame and has a `menu-*` file: place it. Match by the dish name in the
  file name. Files: chile relleno, dos chiles rellenos, pozole, fajita taco salad, garden fajita, carne asada,
  pollo asado, enchiladas de carnitas, jambalaya burrito, platanos fritos, platanitos, tacos dorados,
  birria pizza, kids mac and cheese, kid drinks, aguas frescas, virgin mojito, virgin piña colada, virgin
  mangonada, mangonada, blue diamond, fresca, top shelf reposado, miami vice, bulldog, mezcalita,
  mexican mojito, margarita flight, jamaica, jalapeño, margarita frozen.
  The `.png` drinks are cut-outs on slate, matching the menu's existing drink style.
- List every PHOTO frame still left after this pass.

**`/margaritas`**
- Main page image: replace it with a real margarita photo. Use `hh-handcrafted-1.jpg`, or
  `hh-handcrafted-2.jpg` if it fits the crop better.
- "The ones you can't get anywhere else" cards: Tamarindo `margarita-tamarindo-1.jpg`, Pomegranate
  `margarita-pomegranate-1.jpg`, Jamaica `margarita-jamaica-1.png`, Jalapeño `margarita-jalapeno-1.png`.
  Watermelon, Lychee and Coconut have no photos yet: leave them as they are.
- Any other margarita on the page with a matching file above: place it.

**Birria pages `/birria-tacos`, `/quesabirria-tacos`, and `/takeout-delivery`**
- Birria Pizza card: `birria-pizza-1.jpg`. Keep "To-go only" visible as text.
- Tacos Dorados card: `tacos-dorados-1.jpg`. Keep "Made with birria meat" visible as text.
- `/takeout-delivery` "Feeds four to six": `birria-pizza-1.jpg`.

**`/street-tacos`**
- Hero: the client asked for the al pastor trompo instead of the stand-in photo. Use `trompo-2.mp4`,
  trimmed to the first ~10 seconds (meat being shaved onto tortillas, before the guy eating to camera).
  Follow the homepage hero video pattern (muted, looping, playsinline, poster), with `trompo-1.mov` as
  the fallback if `trompo-2` doesn't work in the slot. Update the `LCP_IMAGE` map in `Base.astro` if the
  hero's poster changes.

**`/fajitas-molcajetes`**
- The "Pair it" slot emptied in round 1: `tacos-margaritas-1.jpg` (tacos with handcrafted margaritas).
  If the page has another photo slot for tacos and margaritas, use `tacos-margaritas-2.jpg` there.

**`/karaoke`**
- Replace the placeholder with `karaoke-1.jpg`.

**`/private-parties/weddings-receptions`**
- The "Long table, candlelit" placeholder at the bottom: use `wedding-table-2.jpg`. The photo isn't
  candlelit, so change that caption to describe what's shown (long tables in the International Room).
  Keep it plain.

## Not placing yet

Big Mami, Tomás, agua fresca station, malteadas, the molcajete + fajita + Big Mamis shot, birria with a
cantarito, the watermelon, lychee and coconut margaritas, and the new Wednesday flyer. Leave their
slots as they are.

## Then

1. `npm run build`, `npm run check-build`, check canonicals against the sitemap, one H1 per page.
2. Screenshot every changed section at 390 and 1440 and look at each one. Check crops: no cut-off
   faces, glasses or plates.
3. Run Lighthouse mobile on `/`, `/menu`, `/street-tacos` and `/happy-hour` with a local preview
   (`node .lh.mjs`) and compare against the last numbers in `DESIGN-DEBT.md`. If anything got
   meaningfully worse (heavy video, unoptimized images), fix it before moving on.
4. Log a new `DESIGN-DEBT.md` entry with every placement, plus the Lighthouse numbers. Update `TASKS.md`.
   Commit on the branch.
5. Push the branch (`git push -u origin media-placement-1`) and report the Vercel preview URL.
6. Report: what went where, anything skipped and why, PHOTO frames still left on `/menu`, and the
   Lighthouse before and after.
7. Stop. When I reply "ship it", merge into `main`, push, confirm the changes on
   `https://www.senortequilas.com`, and report.
