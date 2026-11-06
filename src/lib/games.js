// The live sports schedule on /game-day. One module for the server and the browser: the
// ESPN fetch and normalizer, the open-hours filter, the day grouping, and the HTML both the
// build and the page script write into #schedule. See DESIGN-DEBT.md entry 153.
//
// Source: ESPN's public scoreboard feed, one request per league per day. The feed rejects the
// documented YYYYMMDD-YYYYMMDD range with a 400 (checked 6 November), so days are asked for
// one at a time, all in parallel. Every time is America/New_York, the restaurant's clock,
// never the visitor's.
//
// Copy rules that apply to anything rendered here: no em dashes, no prices, no TV count,
// never "Sunday Ticket".

export const TZ = 'America/New_York';
const BASE = 'https://site.api.espn.com/apis/site/v2/sports';
const TIMEOUT_MS = 6000;
const HOUR = 3600000;
const UPCOMING_CAP = 40;
const DAYS_AHEAD = 7; // today plus six: seven day groups, so no weekday name repeats

// sport-specific length of a game, used to decide whether any of it falls in open hours
export const LEAGUES = [
  { key: 'nfl', path: 'football/nfl', sport: 'football', hours: 3.25, weekly: true },
  // college: FBS only (groups=80), Saturdays only, as Roberto confirmed
  { key: 'college-football', path: 'football/college-football', sport: 'football', hours: 3.25, weekly: true, query: '&groups=80', weekdays: [6] },
  { key: 'nhl', path: 'hockey/nhl', sport: 'hockey', hours: 2.75 },
  { key: 'nba', path: 'basketball/nba', sport: 'basketball', hours: 2.75 },
  { key: 'eng.1', path: 'soccer/eng.1', sport: 'soccer', hours: 2 },
  { key: 'uefa.champions', path: 'soccer/uefa.champions', sport: 'soccer', hours: 2, featured: true },
  { key: 'uefa.europa', path: 'soccer/uefa.europa', sport: 'soccer', hours: 2 },
  { key: 'mex.1', path: 'soccer/mex.1', sport: 'soccer', hours: 2 },
  // MLS ends with MLS Cup; the feed is simply empty after it
  { key: 'usa.1', path: 'soccer/usa.1', sport: 'soccer', hours: 2 },
  { key: 'fifa.world', path: 'soccer/fifa.world', sport: 'soccer', hours: 2 },
  // El Tri friendlies live here, not in fifa.world. Mexico's matches only.
  { key: 'fifa.friendly', path: 'soccer/fifa.friendly', sport: 'soccer', hours: 2, mexicoOnly: true },
  { key: 'ufc', path: 'mma/ufc', sport: 'mma', hours: 4 },
];

const LABELS = { 'English Premier League': 'Premier League', 'Mexican Liga BBVA MX': 'Liga MX', 'Ultimate Fighting Championship': 'UFC' };

const FEATURED_TEAMS = new Set([
  'Washington Commanders', 'Baltimore Ravens', 'Philadelphia Eagles', 'Pittsburgh Steelers',
  'Washington Capitals', 'Washington Wizards', 'Baltimore Orioles', 'Washington Nationals',
  'D.C. United', 'Mexico',
]);

// which games keep their place when the week has more than UPCOMING_CAP of them
const BIG_LEAGUES = new Set(['nfl', 'college-football', 'uefa.champions', 'eng.1', 'mex.1', 'fifa.world', 'fifa.friendly', 'ufc']);
const rank = (g) => (g.featured ? 0 : g.league === 'nfl' ? 1 : BIG_LEAGUES.has(g.league) ? 2 : g.network ? 3 : 4);

// ---------------------------------------------------------------- New York clock

let fmt;
function etParts(ms) {
  fmt = fmt || new Intl.DateTimeFormat('en-US', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  });
  const p = {};
  for (const x of fmt.formatToParts(new Date(ms))) p[x.type] = x.value;
  return { y: +p.year, m: +p.month, d: +p.day, hh: +p.hour % 24, mm: +p.minute, ss: +p.second };
}

export function etDateKey(ms) {
  const p = etParts(ms);
  return `${p.y}-${String(p.m).padStart(2, '0')}-${String(p.d).padStart(2, '0')}`;
}

export function addDays(key, n) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

const weekdayIndex = (key) => { const [y, m, d] = key.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)).getUTCDay(); };
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const mins = (hhmm) => +hhmm.slice(0, 2) * 60 + +hhmm.slice(3, 5);

// A New York wall-clock time to an instant. Two passes settle the DST edges.
export function etToMs(key, hhmm) {
  const [y, m, d] = key.split('-').map(Number);
  const wall = Date.UTC(y, m - 1, d, +hhmm.slice(0, 2), +hhmm.slice(3, 5));
  const offset = (ms) => { const p = etParts(ms); return Date.UTC(p.y, p.m - 1, p.d, p.hh, p.mm, p.ss) - ms; };
  let t = wall - offset(wall);
  t = wall - offset(t);
  return t;
}

// ---------------------------------------------------------------- open hours

// The shift that starts on this date: a dated specialHours entry wins over the weekly row.
function shiftFor(business, key) {
  const sp = (business.specialHours || []).find((h) => h.date === key);
  if (sp) return sp.closed ? null : sp;
  const day = WEEKDAYS[weekdayIndex(key)];
  return (business.hours || []).find((h) => h.days.includes(day)) || null;
}

// A close at or before the open runs past midnight, as in business.json's own note.
export function openWindow(business, key) {
  const s = shiftFor(business, key);
  if (!s) return null;
  const endKey = mins(s.closes) <= mins(s.opens) ? addDays(key, 1) : key;
  return { start: etToMs(key, s.opens), end: etToMs(endKey, s.closes) };
}

function windowsAround(business, ms, before = 1, after = 0) {
  const key = etDateKey(ms);
  const out = [];
  for (let i = -before; i <= after; i++) { const w = openWindow(business, addDays(key, i)); if (w) out.push(w); }
  return out;
}

export function isOpenAt(business, ms) {
  return windowsAround(business, ms).some((w) => ms >= w.start && ms < w.end);
}

const overlapsOpen = (business, g) => {
  const s = Date.parse(g.start), e = Date.parse(g.end);
  return windowsAround(business, s, 1, 1).some((w) => s < w.end && e > w.start);
};

// ---------------------------------------------------------------- ESPN

// ESPN strings go into the page as text, so strip control characters and the dashes the
// copy rules forbid.
const text = (v) => String(v ?? '').replace(/[\u0000-\u001F\u007F]/g, '').replace(/\s*[\u2013\u2014]\s*/g, ' - ').trim();
const logoUrl = (u) => (/^https:\/\/a\.espncdn\.com\/[\w./-]+\.png$/.test(String(u || '')) ? u : null);

function side(c) {
  if (!c) return { name: '', abbrev: '', logo: null };
  if (c.athlete) {
    const n = text(c.athlete.displayName);
    return { name: n, abbrev: text(c.athlete.shortName || n).split(' ').pop().slice(0, 4).toUpperCase(), logo: null };
  }
  const t = c.team || {};
  return { name: text(t.displayName || t.name), abbrev: text(t.abbreviation), logo: logoUrl(t.logo) };
}

function network(comp) {
  for (const b of (comp && comp.broadcasts) || []) if (b.names && b.names[0]) return text(b.names[0]);
  for (const g of (comp && comp.geoBroadcasts) || []) if (g.media && g.media.shortName) return text(g.media.shortName);
  return null;
}

export function normalize(ev, league, leagueName) {
  const comps = ev.competitions || [];
  const isFight = league.sport === 'mma';
  // a UFC event is a card of bouts; the main event is the last one and carries the names
  const comp = isFight ? comps[comps.length - 1] : comps[0];
  if (!comp || !ev.date) return null;
  const cs = comp.competitors || [];
  const home = isFight ? cs[1] : cs.find((c) => c.homeAway === 'home') || cs[0];
  const away = isFight ? cs[0] : cs.find((c) => c.homeAway === 'away') || cs[1];
  const type = (ev.status && ev.status.type) || {};
  const startMs = Date.parse(ev.date);
  if (!Number.isFinite(startMs)) return null;
  // a fight card's main event starts hours after the prelims ESPN dates the event by
  const lastBout = Date.parse(comp.date || ev.date);
  const endMs = Math.max(startMs + league.hours * HOUR, isFight && Number.isFinite(lastBout) ? lastBout + 2 * HOUR : 0);
  const score = (c) => (isFight || !c || c.score == null || c.score === '' ? null : text(c.score));
  const h = side(home), a = side(away);
  return {
    id: `${league.key}:${text(ev.id)}`,
    league: league.key,
    leagueLabel: LABELS[leagueName] || leagueName || league.key.toUpperCase(),
    sport: league.sport,
    name: text(ev.name),
    shortName: text(ev.shortName),
    home: h,
    away: a,
    start: new Date(startMs).toISOString(),
    end: new Date(endMs).toISOString(),
    state: ['pre', 'in', 'post'].includes(type.state) ? type.state : 'pre',
    statusText: text(type.shortDetail || type.detail),
    homeScore: score(home),
    awayScore: score(away),
    network: network(comp) || network(comps[0]),
    featured: !!league.featured || FEATURED_TEAMS.has(h.name) || FEATURED_TEAMS.has(a.name),
  };
}

async function getJSON(url, fetchImpl) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    const r = await fetchImpl(url, { signal: ctl.signal, headers: { accept: 'application/json' } });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } finally { clearTimeout(timer); }
}

const yyyymmdd = (key) => key.replace(/-/g, '');

// One league, one request per day. A league whose every request failed counts as down; the
// rest of the page carries on without it.
async function fetchLeague(league, dayKeys, fetchImpl) {
  const days = league.weekdays ? dayKeys.filter((k) => league.weekdays.includes(weekdayIndex(k))) : dayKeys;
  const urls = days.map((k) => `${BASE}/${league.path}/scoreboard?dates=${yyyymmdd(k)}${league.query || ''}`);
  const results = await Promise.allSettled(urls.map((u) => getJSON(u, fetchImpl)));
  const ok = results.filter((r) => r.status === 'fulfilled').map((r) => r.value);
  if (urls.length && !ok.length) throw new Error(`${league.key}: every request failed`);
  let events = ok.flatMap((j) => j.events || []);
  let name = (ok.find((j) => j.leagues && j.leagues[0]) || { leagues: [{}] }).leagues[0].abbreviation;
  // ESPN keys football by week; if the dated asks came back empty, take the current week
  if (league.weekly && !events.length) {
    try {
      const j = await getJSON(`${BASE}/${league.path}/scoreboard${league.query ? '?' + league.query.slice(1) : ''}`, fetchImpl);
      events = j.events || [];
      name = name || (j.leagues && j.leagues[0] && j.leagues[0].abbreviation);
    } catch { /* the dated result stands */ }
  }
  const seen = new Set();
  return events
    .map((ev) => normalize(ev, league, name))
    .filter((g) => g && !seen.has(g.id) && seen.add(g.id))
    .filter((g) => !league.mexicoOnly || g.home.name === 'Mexico' || g.away.name === 'Mexico')
    .filter((g) => !league.weekdays || league.weekdays.includes(weekdayIndex(etDateKey(Date.parse(g.start)))));
}

const byStart = (a, b) => Date.parse(a.start) - Date.parse(b.start) || b.featured - a.featured || rank(a) - rank(b);

// Over the cap, featured games and every NFL game go in first. What room is left is shared
// out a day at a time, most important game first, so a Saturday of college football cannot
// crowd out the rest of the week.
function capByDay(games, cap) {
  if (games.length <= cap) return games.slice().sort(byStart);
  const sure = games.filter((g) => rank(g) <= 1).sort(byStart).slice(0, cap);
  const days = new Map();
  for (const g of games) {
    if (rank(g) <= 1) continue;
    const k = etDateKey(Date.parse(g.start));
    if (!days.has(k)) days.set(k, []);
    days.get(k).push(g);
  }
  const queues = [...days.values()].map((list) => list.slice().sort((a, b) => rank(a) - rank(b) || byStart(a, b)));
  const out = sure;
  for (let i = 0; out.length < cap; i++) {
    let took = false;
    for (const q of queues) if (q[i] && out.length < cap) { out.push(q[i]); took = true; }
    if (!took) break;
  }
  return out.sort(byStart);
}

// The whole payload /api/games returns and the build renders from.
export async function buildSchedule({ business, now = Date.now(), fetchImpl = fetch } = {}) {
  const today = etDateKey(now);
  const dayKeys = [];
  // yesterday too: a game that started before midnight can still be on
  for (let i = -1; i < DAYS_AHEAD; i++) dayKeys.push(addDays(today, i));
  const settled = await Promise.allSettled(LEAGUES.map((l) => fetchLeague(l, dayKeys, fetchImpl)));
  const sources = {};
  settled.forEach((r, i) => { sources[LEAGUES[i].key] = r.status === 'fulfilled' ? r.value.length : 'error'; });
  const generatedAt = new Date(now).toISOString();
  if (settled.every((r) => r.status === 'rejected')) return { generatedAt, now: [], upcoming: [], tz: TZ, error: true, sources };

  const horizon = etToMs(addDays(today, DAYS_AHEAD), '00:00');
  const games = settled
    .flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
    .filter((g) => !(g.state === 'post' && Date.parse(g.end) < now - 4 * HOUR))
    .filter((g) => overlapsOpen(business, g));
  const live = games.filter((g) => g.state === 'in').sort((a, b) => b.featured - a.featured || byStart(a, b));
  const upcoming = capByDay(games.filter((g) => g.state === 'pre' && Date.parse(g.start) < horizon), UPCOMING_CAP);
  return { generatedAt, now: live, upcoming, tz: TZ, sources };
}

// ---------------------------------------------------------------- day grouping

export function timeET(ms) {
  return new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: 'numeric', minute: '2-digit' })
    .format(new Date(ms)).replace(':00', '').replace(/ /g, ' ');
}

export function groupByDay(games, now = Date.now()) {
  const today = etDateKey(now);
  const groups = [];
  for (const g of games) {
    const key = etDateKey(Date.parse(g.start));
    if (key < today) continue;
    let grp = groups[groups.length - 1];
    if (!grp || grp.key !== key) {
      const label = key === today ? 'Today' : key === addDays(today, 1) ? 'Tomorrow' : WEEKDAYS[weekdayIndex(key)];
      grp = { key, label, games: [] };
      groups.push(grp);
    }
    grp.games.push(g);
  }
  return groups;
}

// ---------------------------------------------------------------- HTML

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const EYEBROW = 'display: flex; align-items: center; gap: 10px; font-family: \'Barlow Condensed\', sans-serif; font-weight: 600; font-size: 14px; letter-spacing: 0.12em; text-transform: uppercase; color: rgb(214, 188, 133);';
const H2 = 'color: rgb(246, 239, 228); font-family: \'Archivo Black\', sans-serif; font-size: clamp(26px, 4.6vw, 42px); line-height: 1.04; margin: 10px 0px 0px; text-transform: uppercase; text-wrap: balance;';
const CARD = 'background: rgb(28, 27, 24); border: 1px solid rgb(42, 40, 32); border-radius: 16px; padding: 18px 20px;';
// the gold treatment of the Sunday callout card further down the page
const CARD_GOLD = 'background: linear-gradient(rgba(60, 44, 18, 0.5), rgba(28, 20, 8, 0.72)); border: 1px solid rgba(185, 156, 102, 0.75); border-radius: 16px; padding: 18px 20px;';
const MUTED = 'font-size: 13px; line-height: 1.5; color: rgba(234, 226, 214, 0.62);';

const eyebrow = (t) => `<div style="${EYEBROW}"><span style="width: 26px; height: 1px; background: rgba(214, 188, 133, 0.7);"></span>${esc(t)}</div>`;

function badge(team) {
  // the abbreviation stands in when there is no logo or the logo fails to load
  const fb = `<span style="display: ${team.logo ? 'none' : 'inline-flex'}; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 999px; background: rgb(42, 40, 32); font-family: 'Barlow Condensed', sans-serif; font-weight: 600; font-size: 11px; letter-spacing: 0.04em; color: rgb(214, 188, 133);">${esc(team.abbrev)}</span>`;
  const img = team.logo
    ? `<img src="${esc(team.logo)}" alt="" width="32" height="32" loading="lazy" decoding="async" onerror="this.style.display='none';this.nextElementSibling.style.display='inline-flex'" style="width: 32px; height: 32px; object-fit: contain;">`
    : '';
  return `<span aria-hidden="true" style="flex: 0 0 32px; display: inline-flex;">${img}${fb}</span>`;
}

function teamRow(team, score, prefix) {
  return `<div style="display: flex; align-items: center; gap: 10px; margin-top: 10px;">${badge(team)}`
    + `<span style="flex: 1 1 auto; font-weight: 700; font-size: 15px; line-height: 1.25; color: rgb(246, 239, 228);">${prefix ? '<span style="font-weight: 400; color: rgba(234, 226, 214, 0.62);">at </span>' : ''}${esc(team.name)}</span>`
    + (score != null ? `<span style="font-family: 'Archivo Black', sans-serif; font-size: 20px; color: rgb(246, 239, 228);">${esc(score)}</span>` : '')
    + '</div>';
}

function liveCard(g) {
  const fight = g.sport === 'mma';
  const body = fight
    ? `<div style="font-weight: 700; font-size: 15px; line-height: 1.3; color: rgb(246, 239, 228); margin-top: 10px;">${esc(g.name)}</div>`
    : teamRow(g.away, g.awayScore) + teamRow(g.home, g.homeScore, true);
  return `<article style="${g.featured ? CARD_GOLD : CARD}">`
    + `<div style="font-family: 'Barlow Condensed', sans-serif; font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; color: rgb(214, 188, 133);">${esc(g.leagueLabel)}</div>`
    + body
    + `<div style="font-weight: 700; font-size: 13px; color: rgb(56, 176, 73); margin-top: 12px;">${esc(g.statusText)}</div>`
    + (g.network ? `<div style="${MUTED} margin-top: 2px;">${esc(g.network)}</div>` : '')
    + '</article>';
}

const matchup = (g) => (g.sport === 'mma' || !g.home.name ? g.name : `${g.away.name} at ${g.home.name}`);

function dayList(grp) {
  const rows = grp.games.map((g) => `<li style="display: grid; grid-template-columns: 78px 1fr; gap: 12px; padding: 11px 0px; border-top: 1px solid rgb(42, 40, 32);">`
    + `<span style="font-family: 'Barlow Condensed', sans-serif; font-weight: 600; font-size: 15px; letter-spacing: 0.04em; color: rgb(214, 188, 133); white-space: nowrap;">${esc(timeET(Date.parse(g.start)))}</span>`
    + `<span><span style="display: block; font-weight: 700; font-size: 15px; line-height: 1.35; color: rgb(246, 239, 228);">${esc(matchup(g))}</span>`
    + `<span style="display: block; ${MUTED}">${esc([g.leagueLabel, g.network].filter(Boolean).join(' · '))}</span></span></li>`).join('');
  return `<div style="margin-top: 22px;"><h3 style="font-family: 'Archivo Black', sans-serif; font-size: 16px; text-transform: uppercase; color: rgb(246, 239, 228); margin: 0px 0px 6px; line-height: 1.15;">${esc(grp.label)}</h3>`
    + `<ul style="list-style: none; margin: 0px; padding: 0px;">${rows}</ul></div>`;
}

// The inside of #schedule. `expanded` keeps the rest of the week open across a refresh.
export function renderSchedule(data, { business, now = Date.now(), expanded = false } = {}) {
  const open = isOpenAt(business, now);
  const live = (data && data.now) || [];
  const groups = groupByDay((data && data.upcoming) || [], now);
  const blockA = `<div data-gd-onnow${open ? '' : ' hidden'} style="margin-bottom: clamp(36px, 5vw, 56px);">${eyebrow('Right now')}`
    + `<h2 style="${H2}">On Now in the Bar Area</h2>`
    + (live.length
      ? `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 250px), 1fr)); gap: 12px; margin-top: 22px;">${live.map(liveCard).join('')}</div>`
      : '<p style="font-size: 15px; line-height: 1.7; color: rgba(234, 226, 214, 0.85); margin: 14px 0px 0px;">Nothing live this minute. Here is what is coming up.</p>')
    + '</div>';
  const first = groups.slice(0, 2).map(dayList).join('');
  const rest = groups.slice(2).map(dayList).join('');
  const blockB = `<div data-gd-week>${eyebrow('The next seven days')}`
    + `<h2 style="${H2}">${open ? 'This Week\'s Games' : 'Coming Up When We Open'}</h2>`
    + `<p style="${MUTED} margin: 10px 0px 0px;">All times Eastern.</p>`
    + `<div style="max-width: 760px;">`
    + (groups.length ? first : '<p style="font-size: 15px; line-height: 1.7; color: rgba(234, 226, 214, 0.85); margin: 18px 0px 0px;">The schedule is between updates. Every NFL game is on, every day we are open.</p>')
    + (rest
      ? `<div id="gd-rest" data-gd-rest${expanded ? '' : ' hidden'}>${rest}</div>`
        + `<button type="button" data-gd-more aria-controls="gd-rest" aria-expanded="${expanded}" style="margin-top: 22px; display: inline-flex; align-items: center; justify-content: center; border: 1.5px solid rgba(185, 156, 102, 0.75); color: rgb(234, 226, 214); font: 700 15px Barlow, system-ui, sans-serif; padding: 0px 22px; min-height: 48px; border-radius: 12px; background: rgba(18, 18, 16, 0.4); cursor: pointer;">${expanded ? 'Show less' : 'Show the rest of the week'}</button>`
      : '')
    + '</div></div>';
  return blockA + blockB;
}

// ---------------------------------------------------------------- fights.json

export function upcomingFights(fights, now = Date.now(), days = 14) {
  const today = etDateKey(now), last = addDays(today, days);
  return (Array.isArray(fights) ? fights : [])
    .filter((f) => f && /^\d{4}-\d{2}-\d{2}$/.test(f.date) && f.date >= today && f.date <= last && f.title)
    .sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')))
    .map((f) => {
      const day = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'long', month: 'short', day: 'numeric' }).format(new Date(f.date + 'T12:00:00Z'));
      const t = /^\d{2}:\d{2}$/.test(f.time || '') ? timeET(etToMs(f.date, f.time)) : '';
      return { ...f, when: t ? `${day} · ${t}` : day };
    });
}
