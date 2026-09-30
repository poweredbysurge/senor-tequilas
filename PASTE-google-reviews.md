# Google reviews rail: real data, real avatars

The homepage reviews section is still placeholder. Three cards read
`[Reviewer pending]` and `[Real Google review pending]`, the avatar is a `?`, and the
headline and rating block hard-code "over 5,600 Google reviews". Replace all of it with a
data file, and wire an optional build-time fetch so it keeps itself current.

Do not add `Review` or `aggregateRating` JSON-LD anywhere. Self-serving review markup for
your own business is against Google's structured data policy, wins no rich result and can
draw a manual action. The rail is presentational only.

## 1. The numbers, verified 30 September 2026

Source: Google Business Profile via DataForSEO, place ID `ChIJfQWUP2wstokR0hf-aq2yO5Y`.

- rating 4.6
- 5,717 total reviews
- distribution: 5 star 4,452 / 4 star 647 / 3 star 255 / 2 star 140 / 1 star 223

Put these in `src/data/business.json` under a new `reviews` key, alongside `ga4`:

```json
"reviews": {
  "placeId": "ChIJfQWUP2wstokR0hf-aq2yO5Y",
  "rating": 4.6,
  "total": 5717,
  "asOf": "2026-09-30",
  "writeUrl": "https://search.google.com/local/writereview?placeid=ChIJfQWUP2wstokR0hf-aq2yO5Y"
}
```

Then replace both hard-coded spots in `src/pages/index.astro` with values read from it:

- line 24, the hero trust line, currently `4.6 · over 5,600 Google reviews`
- line 144, the section headline, currently `Over 5,600 Reviews. 4.6 Stars.`
- line 147, the rating block, same figures plus the "Write a review" link

Round the count down to the nearest hundred for display, so 5,717 renders as
"over 5,700". A rounded-down number stays true as the count climbs, and the client adds
roughly 40 a week. Write the rounding as a helper, not by hand, so the next data refresh
does not need a code edit.

## 2. The card data

Create `src/data/reviews.json` as an array. Six entries, same shape:

```json
[
  {
    "author": "",
    "photo": "",
    "rating": 5,
    "date": "",
    "text": "",
    "source": "Google"
  }
]
```

- `author` is the reviewer's display name exactly as it appears on Google.
- `photo` is the reviewer's Google profile photo URL, or an empty string.
- `date` is ISO, `2026-09-14`. Render it as "September 2026", not a precise day.
- `text` is the review verbatim. Never edit, shorten or tidy a review's wording. If a
  review is too long for the card, do not truncate the stored text; clamp it visually with
  CSS `-webkit-line-clamp: 6` so the full text stays in the DOM.

`src/data/reviews.json` already exists with six real reviews in it, pulled from the Google
Business Profile on 30 September 2026. Do not rewrite their text. Every `photo` is an empty
string, because the source we pulled from does not expose profile photo URLs, so all six
render initials until the Places API fetcher in section 5 fills them in. Build the rail so
it still renders nothing at all, rather than breaking, if the array is ever empty.

## 3. The avatar

This is the part that matters, so follow it exactly.

- When `photo` is set, render an `<img>` pointing at that URL. Do not download the image
  into `public/`. Google's profile photos are served from `googleusercontent.com` and
  re-hosting them is both a terms problem and a privacy one. Hotlink or nothing.
- Add `loading="lazy"`, `decoding="async"`, `width="40" height="40"`,
  `referrerpolicy="no-referrer"` and `alt=""` (the name is already adjacent text, so the
  image is decorative and an empty alt is correct).
- On error, swap to the initials fallback. A one-line inline `onerror` that sets a class is
  fine; these URLs do rotate and a broken image icon in a trust section is worse than
  initials.
- When `photo` is empty, render the existing 40px circle with the reviewer's initials in
  place of the `?`. Keep the current styling: `rgb(58, 56, 47)` ground, 700 weight, 15px,
  white.

## 4. The rail

- Six cards instead of three, same markup as the current card, same `data-dc-tpl`
  attributes. Loop over the data, do not hand-write six copies.
- Keep the Google glyph SVG in each card, it is the attribution.
- Render the star row from each review's own `rating`, not five hard-coded stars.
- The carousel in `Base.astro` (`reviewsCarousel`, around line 458) reads
  `[data-dc-tpl="150"]` as the rail and steps by the first child's width. It works
  unchanged with six children. Verify the next arrow enables and the prev arrow disables
  correctly at six cards, and that both still disable at the ends.
- No new client JavaScript. This section stays static HTML.

## 5. Optional, behind an env var: keep it current by itself

Add `scripts/fetch-reviews.mjs` that calls Places API (New) Place Details for the place ID
and writes `src/data/reviews.json` plus the `rating` and `total` in the `reviews` block.

- Endpoint: `GET https://places.googleapis.com/v1/places/{PLACE_ID}` with headers
  `X-Goog-Api-Key` and
  `X-Goog-FieldMask: rating,userRatingCount,reviews`.
- Check the current response shape against the docs before mapping; the review objects
  carry the author name and photo under an author attribution block, and the API returns
  only a handful of reviews (5 at last check), which is why the file holds six and the
  script tops up rather than replaces blindly.
- Read the key from `process.env.GOOGLE_PLACES_API_KEY`. If the variable is absent, exit 0
  with a log line and change nothing. A missing key must never fail a build.
- Never commit the key. It goes in Vercel project settings as an environment variable.
- Do not wire this into `npm run build` yet. Leave it as its own script.

## 6. Check before you report back

- Both hard-coded review figures are gone from `index.astro`; nothing in `src/` still says
  5,600.
- With an empty `reviews.json`, the homepage builds and the section is absent, not broken.
- With six rows, six cards render, the arrows page through all of them, and a row with an
  empty `photo` shows initials.
- `grep -r "aggregateRating\|\"Review\"" src/` returns nothing.
- Mobile Lighthouse on the homepage is unchanged, still 96 or better. If it dropped, the
  avatar images are the suspect: confirm they are lazy and carry explicit dimensions so
  they reserve their box and cannot shift layout.
