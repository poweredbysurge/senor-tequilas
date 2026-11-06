# Convert dish photos from CSS backgrounds to real <img> tags (no visual change)

## Why
Most dish and drink photos on the site are painted in with CSS `background: url(...)`. Google does not index CSS background images, so these photos never show up in Google Images and carry no alt text. Convert them to real `<img>` elements with alt text. **The site must look exactly the same afterwards.** This is a code-only change.

## In scope
Any element whose inline style uses `background: url(...)` or `background-image: url(...)` pointing to:
- `/images/dishes/*`
- `/images/site/dish-*`, `/images/site/drink-*`, `/images/site/margarita-*`

On these pages: `src/pages/index.astro`, `menu.astro`, `birria-tacos.astro`, `fajitas-molcajetes.astro`, `street-tacos.astro`, `taco-tuesday.astro`, `la-dulceria.astro`, `margaritas.astro`, `happy-hour.astro`, `late-night.astro`, `catering.astro`, `takeout-delivery.astro`, `game-day.astro`, `mexican-restaurant-gaithersburg-md.astro`.

## Out of scope (do not touch)
Decorative backgrounds stay as they are:
- Anything with a `linear-gradient(...)` overlay (hero and section bands behind text)
- Section texture/backdrop images such as `/images/86475be0134bfc90.webp`, `/images/ecf6382a259b5884.webp`, `texture-black.jpg`, `seasonal-dia-bg.webp`
- `MobileMenu.astro`, `PanDeMuerto.astro`, `UpcomingEvents.astro`, `Footer2.astro`, `Base.astro`
- `src/styles/tweaks.css` (day-of-week tiles, brothers, quince, cake, catering-room)
- `private-parties*` pages (rooms, add-ons, headshots)

## How to convert
Example, before:
```html
<div data-dc-tpl="323" role="img" aria-label="A bowl of birria ramen with noodles, shredded beef, corn and radish"
  style="aspect-ratio: 4 / 3; background: url(&quot;/images/dishes/birria-ramen.jpg&quot;) center center / cover no-repeat rgb(35, 33, 28); border-bottom: 1px solid rgb(42, 40, 32);"></div>
```
After:
```html
<div data-dc-tpl="323"
  style="aspect-ratio: 4 / 3; background: rgb(35, 33, 28); border-bottom: 1px solid rgb(42, 40, 32); overflow: hidden;">
  <img src="/images/dishes/birria-ramen.jpg" alt="A bowl of birria ramen with noodles, shredded beef, corn and radish"
    width="1200" height="900" loading="lazy" decoding="async"
    style="display: block; width: 100%; height: 100%; object-fit: cover; object-position: center center;" />
</div>
```
Rules:
1. Keep the wrapper element and every other style on it (aspect-ratio, border, radius, size, the background colour as a fallback, `data-dc-tpl`). Add `overflow: hidden` only if the wrapper doesn't already clip.
2. Carry the old `background-position` into `object-position`, and `cover`/`contain` into `object-fit`.
3. If the wrapper has `role="img"` and `aria-label`, move the label text into the `<img alt>` and remove `role`/`aria-label` from the wrapper.
4. If the element has text or other children on top of the photo, insert the `<img>` as the first child with `position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: 0;`, make sure the wrapper is `position: relative`, and keep the children above it. If that can't be done without a visible change, skip it and list it in the report.
5. Alt text: reuse the existing aria-label when there is one. Otherwise write a short, specific description using the dish name from the nearby heading, e.g. `Flan with caramel sauce at Señor Tequila's`. No keyword stuffing, never "image of" or "photo of".
6. `width` and `height` = the file's real pixel size (read it with `sharp` or `image-size`), so there is no layout shift.
7. `loading="lazy" decoding="async"` for everything below the first screen. For any converted photo visible on first load (above the fold), use `loading="eager" fetchpriority="high"` instead. Never lazy-load the page's LCP image.
8. If a hover effect animates `background-size` or `background-position`, port it to `transform: scale(...)` on the `<img>` with the same duration and easing.
9. Do not rename, move, resize or recompress any image file. Do not change any text, colours, spacing, layout or links.

## Check before you hand it back
1. **Before** editing: build, start the preview, and use Playwright to take full-page screenshots of every page in scope at 390px and 1440px wide. **After** editing: retake them and compare. They must look the same (anti-aliasing noise is fine). Fix any page that looks different.
2. `npm run build` passes with no new warnings, and there are no console errors on the touched pages.
3. `grep` shows no remaining `url(` references to `/images/dishes/` in the in-scope pages, except ones you skipped on purpose (list them with the reason).
4. View the built HTML for `/birria-tacos` and `/menu` and confirm the photos are now `<img>` tags with alt text.
5. Give me a table: page, image file, alt text, eager or lazy, and the before/after screenshot result.

Do not commit or push. Show me the summary and the screenshot comparison first.
