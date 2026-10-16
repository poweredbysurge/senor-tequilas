# Post-launch corrections, round 2 (follow-ups from round 1)

Paste everything below the line into Claude Code, run from the repo root.

---

Continue on branch `post-launch-corrections-1`. Same rules as round 1 (`PASTE-post-launch-corrections.md`):
no push, no merge, no titles, meta descriptions, canonicals or URLs, no em dashes, no stock images,
CSS stays as is. These are the items you flagged last round that don't need anything new from the client.

1. **Gaithersburg reviews (live, most urgent).** Replace the three identical placeholder cards on
   `/mexican-restaurant-gaithersburg-md` with three different real reviews from `src/data/reviews.json`.
   Prefer reviews that mention food or the drive. Use the reviewer name exactly as stored. No
   "[Reviewer pending]" or "[replace with real review]" text anywhere on the site afterward
   (`grep -rn "pending\]\|replace with real" src`).

2. **Wrong quesabirria photo everywhere.** `quesabirrias-card.jpg` is a vegetable close-up. Swap it for the
   real quesabirria photo you used on `/late-night` on: the `/takeout-delivery` card, the `/menu` Happy
   Hour taco, and the homepage Instagram rail. Also swap the `/takeout-delivery` `ogImage` prop (an image
   path, not a title or description). Afterward, nothing should reference `quesabirrias-card.jpg` as
   quesabirria.

3. **Wrong arrachera thumbnails.** View `tacos-de-arrachera-hero.jpg`. If it clearly shows arrachera, use it
   in place of `tacos-de-arrachera-card.jpg` on the two arrachera thumbnails on `/menu` and the Street
   Tacos link cards on `/taco-tuesday` and `/game-day`. Keep `tacos-de-arrachera-card.jpg` only where it's
   labeled pork belly. If the hero isn't clearly arrachera, stop and say so.

4. **"In the bar area" under the weekday Happy Hour hours** on `/menu` and `/margaritas`: remove it.
   Happy Hour applies to all areas.

5. **Mobile rails on `/happy-hour` and `/late-night`.** Bring them in line with the carousel changes from
   round 1: Tuesday and Wednesday "WIN prizes" with the same WIN emphasis, Wednesday hours with PM,
   Friday and Saturday "21+ in the bar area after 9 PM", and no Sunday Happy Hour.

Then: `npm run build`, `npm run check-build`, canonical vs sitemap check, screenshots of every changed
section at 390 and 1440, add to `DESIGN-DEBT.md` entry 95 (or a new entry 96), update `TASKS.md`,
commit on the branch, and report what changed.

Do not touch these yet, they're waiting on answers: the Wednesday flyer art (7:30 vs 8 PM), the
La Cocina year, the birria braise time, and the time format.
