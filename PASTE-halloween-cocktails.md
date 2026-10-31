# Halloween cocktails: new photo tab in the Halloween gallery + one line in the homepage Halloween card

## Step 0 (Mario, before running this)
Download the 8 cocktail photos from the Google Drive folder "Halloween Campaign"
(https://drive.google.com/drive/folders/1n6AdP-P8nTU1asK6fJhKsNEe9ZDpIT1Y) into
`design/source-art/halloween-cocktails/` (gitignored, like the other source art):

- **Dulce Descanso** (coffee cocktail with the mini pan de muerto garnish): `Dulce descanso .jpg`, `Photo Oct 20 2026, 10 03 06 PM.jpg`, `Photo Oct 20 2026, 10 03 27 PM.jpg`, `Photo Oct 20 2026, 10 04 19 PM.jpg`
- **Berry Scary** (red berry cocktail with the fang skewer): `Berry Scary.jpg`, `Photo Oct 20 2026, 9 58 32 PM.jpg`, `Photo Oct 20 2026, 9 58 48 PM.jpg`, `Photo Oct 20 2026, 9 58 58 PM.jpg`

Do not download the "dia de muertos" or "Photo Nov 2025" files in that folder; they are not part of this.

## What to build (all in `src/components/UpcomingEvents.astro`, the homepage events carousel)

### 1. New "Halloween Cocktails" tab in the Halloween photo gallery
The Halloween slide's "View photos from past event" button opens a gallery with tabs ("The party", "Pan de Muerto"). Add a third category for the cocktails, placed **first** in the `categories` array so it is the tab that opens by default:

```js
{
  id: 'cocktails',
  label: 'Halloween Cocktails',
  basePath: '/images/site/halloween-cocktails/',
  intro: 'Two cocktails made for Halloween weekend: the Dulce Descanso, finished with a mini pan de muerto, and the Berry Scary, red berries under a white foam with a skewer of fresh berries and fangs. Only here for the season.',
  alts: [ /* one per photo, in file order, written from the photos */ ],
},
```

Image files, matching how `/images/site/pan-de-muerto/` is built:
- `public/images/site/halloween-cocktails/01.webp` to `08.webp`: 1600px on the long side, webp, same quality setting used for the pan de muerto set.
- `public/images/site/halloween-cocktails/thumbs/01.webp` to `08.webp`: 480 x 320, cropped so the whole glass and the garnish stay in frame (do not cut off the pan de muerto or the fang skewer).
- Order: the two hero shots first (`Dulce descanso .jpg` as 01, `Berry Scary.jpg` as 02), then alternate the rest Dulce / Berry so the grid mixes both drinks.
- The gallery counts files on disk, so no count to hardcode.

Alt text: write each alt from the actual photo, short and specific. Base descriptions to work from:
- Dulce Descanso: "Dulce Descanso cocktail in a stemmed glass with a sparkling sugar-dusted foam top and a mini pan de muerto on the rim, on a black background"
- Berry Scary: "Berry Scary cocktail, deep red with a white foam top, garnished with a skewer of blackberries, raspberries and vampire fangs, on a black background"
Vary the close-ups accordingly ("Close-up of the mini pan de muerto garnish on the Dulce Descanso", etc.). No "image of" or "photo of".

### 2. One bullet in the Halloween card on the homepage
In the Halloween event's `details` array, add this line **right after** "Bring your best costume. Bring your crew.":

`'Halloween cocktails: the Dulce Descanso and the Berry Scary'`

Leave every other bullet as it is (including the Pan de Muerto line). No prices for the cocktails.

## Rules
- Do not change the Halloween dates, `hideAfter`, the video, or the Friendsgiving slide.
- The gallery and the slide must look and behave the same as now on phone and desktop; the only differences are the new tab and the new bullet.
- No em dashes or en dashes in any new text.
- Do not touch `/friendsgiving` (its "Fall Carajillo" copy stays until Roberto confirms the name).

## Check before you hand it back
1. `npm run build` passes.
2. On the homepage at 390px and 1440px: the Halloween card shows the new bullet, "View photos from past event" opens on the "Halloween Cocktails" tab, all 8 thumbnails load, the lightbox arrows step through all 8, and the other two tabs still work.
3. Screenshot the card and the open gallery at both widths and show me.

Do not commit or push. Show me the screenshots first.
