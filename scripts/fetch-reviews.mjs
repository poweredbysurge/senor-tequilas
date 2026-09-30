#!/usr/bin/env node
// Refresh the Google review data from Places API (New).
//
//   GOOGLE_PLACES_API_KEY=... node scripts/fetch-reviews.mjs
//
// No key, no work: exits 0 and changes nothing, so a build can call it safely. Not wired into
// `npm run build`. The key belongs in Vercel project settings, never in the repo.
//
// The API returns only a handful of reviews (5 at last check) and gives no way to ask for more,
// which is why reviews.json holds six and this tops up rather than replacing blindly: a review
// already on file is refreshed in place, a new one is added, and nothing is dropped.
// See DESIGN-DEBT.md entry 92.
import { readFile, writeFile } from 'node:fs/promises';

const KEY = process.env.GOOGLE_PLACES_API_KEY;
if (!KEY) {
  console.log('fetch-reviews: GOOGLE_PLACES_API_KEY is not set, leaving the data alone.');
  process.exit(0);
}

const BUSINESS = new URL('../src/data/business.json', import.meta.url);
const REVIEWS = new URL('../src/data/reviews.json', import.meta.url);
const business = JSON.parse(await readFile(BUSINESS, 'utf8'));
const placeId = business.reviews?.placeId;
if (!placeId) { console.error('fetch-reviews: business.json has no reviews.placeId'); process.exit(1); }

const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
  headers: { 'X-Goog-Api-Key': KEY, 'X-Goog-FieldMask': 'rating,userRatingCount,reviews' },
});
if (!res.ok) {
  console.error(`fetch-reviews: Places API returned ${res.status}`, (await res.text()).slice(0, 300));
  process.exit(1);
}
const data = await res.json();

// The response shape is worth checking against the docs when this next misbehaves: the author
// sits under authorAttribution, and the text under text.text with originalText alongside it.
const incoming = (data.reviews || []).map((r) => {
  const a = r.authorAttribution || {};
  return {
    author: a.displayName || '',
    photo: a.photoUri || '',
    rating: Number(r.rating) || 5,
    date: (r.publishTime || '').slice(0, 10),
    text: (r.originalText?.text ?? r.text?.text ?? '').trim(),
    source: 'Google',
  };
}).filter((r) => r.author && r.text);

const existing = JSON.parse(await readFile(REVIEWS, 'utf8'));
const key = (r) => `${r.author}|${r.date}`;
const merged = [...existing];
let added = 0, refreshed = 0;
for (const r of incoming) {
  const at = merged.findIndex((e) => key(e) === key(r));
  if (at === -1) { merged.unshift(r); added++; }
  // the text is never overwritten; only the photo, which rotates, is topped up
  else if (r.photo && merged[at].photo !== r.photo) { merged[at] = { ...merged[at], photo: r.photo }; refreshed++; }
}

if (typeof data.rating === 'number') business.reviews.rating = Number(data.rating.toFixed(1));
if (typeof data.userRatingCount === 'number') business.reviews.total = data.userRatingCount;
business.reviews.asOf = new Date().toISOString().slice(0, 10);

await writeFile(BUSINESS, JSON.stringify(business, null, 2) + '\n');
await writeFile(REVIEWS, JSON.stringify(merged, null, 2) + '\n');
console.log(`fetch-reviews: rating ${business.reviews.rating}, ${business.reviews.total} reviews; `
  + `${added} added, ${refreshed} photo(s) refreshed, ${merged.length} on file.`);
