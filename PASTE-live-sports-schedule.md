# Live sports schedule on /game-day: what it is and the prompt

**The Surge Agency · Nov 6, 2026 · Señor Tequila's**

**What Jeremy asked for.** Daily publication of current and future sports schedules on the website. What is on right now while they are open, and what is coming up.

**How it works.** ESPN publishes a free, keyless public scoreboard feed per league (`site.api.espn.com/apis/site/v2/sports/<league>/scoreboard`). Verified Nov 6: it returns live status (pre, in, post), kickoff times, teams, scores and TV network for NFL, college football, NHL, NBA, Premier League, Champions League, Liga MX, MLS, and UFC. Boxing is not covered by the feed; fight nights stay hand-entered.

A small Vercel function fetches the leagues we care about, filters games to the restaurant's open hours from `src/data/business.json` (including the dated special hours), and returns a cached JSON. The `/game-day` page renders two blocks from it: **On Now** and **Coming Up This Week**. The page stays static and the hours stay in one place.

No scraping, no third-party scheduling service, no monthly fee, nothing for Roberto to update by hand. The only hand-kept list is fights.

---
---

# PASTE THIS INTO CLAUDE CODE

Read `CLAUDE.md`, `DESIGN-DEBT.md` and `PASTE-game-day-page.md` first. This adds a live sports schedule to `/game-day` inside the established system. No framework, no CSS conversion, no new fonts, no stock imagery, no em dashes.

## What to build

### 1. `api/games.js`: a Vercel serverless function

Follow the conventions in `api/inquiry.js` (same env cleaning helper, same comment style at the top, same error posture: never fail loud to the guest).

Fetch these ESPN public scoreboard endpoints in parallel, with a 6 second timeout each and `Promise.allSettled` so one dead league never blanks the page:

```
football/nfl
football/college-football        (Saturdays only, limit to groups=80 FBS; Roberto confirmed college football on Saturdays)
hockey/nhl
basketball/nba
soccer/eng.1                     (Premier League)
soccer/uefa.champions
soccer/uefa.europa
soccer/mex.1                     (Liga MX)
soccer/usa.1                     (MLS, only through the MLS Cup playoffs)
soccer/fifa.world                (World Cup and El Tri friendlies; usually empty, cheap to ask)
mma/ufc
```

Base URL: `https://site.api.espn.com/apis/site/v2/sports/<league>/scoreboard`. Pass `?dates=YYYYMMDD-YYYYMMDD` for today through today plus 7, in America/New_York. For NFL and college football ESPN keys by week, so when `dates` returns nothing fall back to the default scoreboard (current week).

Normalize every event to:

```
{ id, league, leagueLabel, sport, name, shortName,
  home: { name, abbrev, logo }, away: { name, abbrev, logo },
  start (ISO), state ("pre" | "in" | "post"),
  statusText (ESPN status.type.shortDetail, e.g. "3rd Qtr 4:12" or "Sat 1:00 PM"),
  homeScore, awayScore, network (first broadcast name if present),
  featured (boolean) }
```

`featured` is true when either team is one of: Commanders, Ravens, Eagles, Steelers, Capitals, Wizards, Orioles, Nationals, D.C. United, Mexico national team, or any Champions League match. Featured games sort first within their time slot.

**Filter to open hours.** Import `src/data/business.json`. A game counts when any part of its window (kickoff to kickoff plus a sport-specific duration: NFL and college 3h15, NHL and NBA 2h45, soccer 2h, UFC 4h) overlaps the restaurant's open window for that date, using the weekly `hours` and the dated `specialHours` overrides, with closes at or before opens running past midnight. All times in America/New_York. Drop everything else. Drop `post` games older than 4 hours.

Return `{ generatedAt, now: [...in-state games...], upcoming: [...pre games through 7 days...], tz: "America/New_York" }`, capped at 40 upcoming. Set `Cache-Control: public, s-maxage=300, stale-while-revalidate=900` so Vercel's edge serves it and ESPN gets hit at most every five minutes. On total failure return `{ now: [], upcoming: [], error: true }` with a 200 so the page degrades quietly.

Add `CRON_SECRET` nowhere; this is request-time with edge cache, not a cron. Note that decision in `DESIGN-DEBT.md`.

### 2. The page: two new blocks on `/game-day`

Insert a new section directly after the hero and before `#soccer`, id `schedule`, `data-screen-label="Live schedule"`, same section treatment, borders and padding as `#soccer`. Add a jump link to it from the hero's primary CTA so **See Tonight** now lands on the schedule, and keep the calendar's `#tonight` anchor working.

**Block A: On Now.** H2 **On Now in the Bar Area**. When the restaurant is open and `now` has games: one card per game, in a row that wraps. Card: league label eyebrow, away at home with logos (ESPN logo URLs, `loading="lazy"`, 32px, fall back to the abbreviation if the image fails), score if in progress, `statusText`, network in muted type. Featured games get the gold border treatment used elsewhere on the page. When the restaurant is open and nothing is on: one line, "Nothing live this minute. Here is what is coming up." When closed: the block is hidden entirely and Block B's heading becomes **Coming Up When We Open**.

**Block B: Coming Up This Week.** H2 **This Week's Games**. Grouped by day (Today, Tomorrow, then weekday names), each day a short list: time in ET, matchup, league, network. Collapse every day after the first two behind a "Show the rest of the week" button that reveals them, no accordion library, a plain `hidden` toggle.

Beneath both: a muted line, "Every NFL game and the big matches are on with sound. First come, first served. Fights are listed on this page below." Link the word fights to `#fights`.

**Server-rendered fallback for SEO and no-JS.** At build time, Astro fetches the same `api/games.js` logic (import the shared module directly, do not call the deployed URL) and renders this week's list into the HTML. Then a small inline script (no framework, under 120 lines, placed at the end of the page) fetches `/api/games` on load, re-renders both blocks, and refreshes every 5 minutes while the tab is visible (`document.visibilityState`). Put the fetch and render logic in `src/lib/games.js` so build and client share the normalizer and the day grouping. If the fetch fails the build-time HTML simply stays.

**Daily rebuild so the server-rendered list stays current.** Add a Vercel cron in `vercel.json`: `{ "path": "/api/rebuild", "schedule": "0 9 * * *" }` (9 AM UTC, 4 or 5 AM ET). `api/rebuild.js` checks `CRON_SECRET` via the Authorization header and POSTs to `DEPLOY_HOOK_URL`. Both env vars documented at the top of the file in the `inquiry.js` style. Record in `DESIGN-DEBT.md` that Sam must create the deploy hook in Vercel and set both variables.

### 3. Fights stay manual

Add `src/data/fights.json`: an array of `{ date, time, title, note }`. Render any dated entry within the next 14 days as a card at the top of the existing `#fights` section with the heading **Next Fight Night**. Seed it with an empty array and a comment-style `_note` key explaining the format. The UFC feed from `api/games.js` also appears in the schedule blocks, labeled UFC.

### 4. Structured data

In this page's JSON-LD, add a `BroadcastEvent`-free approach: do not emit Event schema for games we do not host. Keep the existing `SportsActivityLocation` and `BarOrPub` types. Nothing else changes.

### 5. Copy rules

Never write "Sunday Ticket." Never state a TV count (the `[PENDING]` stays). No prices. League names as ESPN returns them, except "English Premier League" becomes "Premier League" and "Mexican Liga BBVA MX" becomes "Liga MX."

## Then

Build, zero console errors, check 390, 768 and 1440 with keyboard and mouse. Test the open-hours filter by stubbing `Date.now()` to a Tuesday 2 PM (closed, Block A hidden), a Sunday 4 PM (open, NFL in progress), and a Saturday 12:30 AM (still open from Friday, close runs past midnight). Confirm the Thanksgiving Eve special-hours entry is respected.

Generate references for `/game-day` at all three widths and add them to the manifest. Compare HEAD against the working tree at all three widths and confirm the only pages that moved are `/game-day`. Do not re-baseline.

Add entries to `DESIGN-DEBT.md` for: the ESPN feed choice and its no-boxing gap, the edge-cache-not-cron decision for `/api/games`, the daily rebuild cron and its two env vars, and the hand-kept `fights.json`.

Report: the leagues returning data at build time, the two env vars Sam must set in Vercel, and anything in the ESPN response shape that did not match the normalizer.
