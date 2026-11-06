// GET /api/games. The live sports schedule on /game-day: what is on now while the restaurant
// is open, and what is coming up this week. See DESIGN-DEBT.md entry 153.
//
// Source: ESPN's public scoreboard feed, keyless and free, one request per league per day.
// The fetch, the normalizer and the open-hours filter live in src/lib/games.js, which the
// build also imports to write the same schedule into the page's HTML.
//
// Environment: none. This is request-time with an edge cache, not a cron. Vercel's edge
// keeps the answer for five minutes (s-maxage=300) and serves it stale for fifteen more
// while it refreshes, so ESPN is asked at most once every five minutes however busy the page.
//
// Never fails loud to the guest: if every league is down the answer is still a 200 with
// empty lists and error: true, and the page keeps the schedule it was built with.
import business from '../src/data/business.json' with { type: 'json' };
import { buildSchedule, TZ } from '../src/lib/games.js';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).json({ error: true });
  }
  let data;
  try {
    data = await buildSchedule({ business });
  } catch (err) {
    console.error('[games] schedule failed:', err && err.message);
    data = { generatedAt: new Date().toISOString(), now: [], upcoming: [], tz: TZ, error: true };
  }
  // a failed answer is cached for a minute only, so the next good one is not held back
  res.setHeader('Cache-Control', data.error
    ? 'public, s-maxage=60, stale-while-revalidate=300'
    : 'public, s-maxage=300, stale-while-revalidate=900');
  return res.status(200).json(data);
}
