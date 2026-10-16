# Post-launch corrections, round 3 (client answers, then ship)

Continue on branch `post-launch-corrections-1`. Same rules as rounds 1 and 2: no titles, meta
descriptions, canonicals or URLs, no em dashes, no stock images, CSS stays as is.

The client answered the open questions. Apply these:

1. **Happy Hour is 3 PM to 6 PM.** The site already says this. Remove Roger Thomas's review from the
   homepage rail, because it says Happy Hour runs "opening through 5:00pm". Leave `happy-hour-flier.jpg`
   alone (it isn't used anywhere).
2. **Tuesday and Wednesday start at 8 PM.** The cards already say 8 PM to 10 PM. Confirm every
   Tuesday and Wednesday time on the site (carousel, mobile rails, page copy) says 8 PM. Don't touch
   the Wednesday flyer image; new art is coming.
3. **Birria is braised 12 hours.** Make every mention say 12 hours: both birria pages (currently six
   hours), `/late-night` (currently "12+ hours"), the menu, and anywhere else
   (`grep -rni "hour" src/pages | grep -i "brais\|slow\|cook"`).
4. **Our Story:** the La Cocina section's year label becomes "Since 2003", replacing 2026. Keep the
   timeline styling from round 1.
5. **No game day specials, but promote game day.** Remove every claim of game day specials, including
   "Game day specials every Sunday" and the "Sunday Game Day Specials" heading on `/game-day`, the
   homepage Sunday card, and anywhere else (`grep -rni "special" src`). Replace them with copy that
   promotes watching the game here: every NFL game on, every Sunday, from the first kickoff to the last
   whistle, with TVs in the bar area, the International Room and the patio. Off `/game-day`, link to
   `/game-day`. Write it plain and direct, no hype words, and reuse lines the site already has where they fit.
6. **Time format stays "PM".** No change.

Then:

1. `npm run build`, `npm run check-build`, canonical vs sitemap check, one H1 per page,
   `grep -rn "—" src` returns nothing new. Screenshot the changed sections at 390 and 1440 and look at them.
2. Log this as `DESIGN-DEBT.md` entry 97 and update `TASKS.md`. Commit on the branch.
3. **Push the branch** (`git push -u origin post-launch-corrections-1`). This makes a Vercel preview and
   does not touch production. Report the preview URL.
4. Stop. When I reply "ship it", merge the branch into `main` and push `main`. That deploys production,
   and also ships the unpushed conversion tracking commit `d0df9de`, which is expected. Then load
   `https://www.senortequilas.com` and the changed pages, confirm the changes are live, and report.
