// GET /api/rebuild. Called by the Vercel cron in vercel.json every day at 09:00 UTC (4 AM
// Eastern in winter, 5 AM in summer). It triggers a fresh production deploy, so the week's
// sports schedule written into /game-day's HTML at build time, the version search engines
// and guests without JavaScript see, never goes more than a day stale. See DESIGN-DEBT.md
// entry 153.
//
// Environment, set in Vercel:
//   CRON_SECRET      required. Vercel sends it on every cron call as
//                    "Authorization: Bearer <secret>". Anything without it gets a 401, so
//                    nobody else can make the site rebuild.
//   DEPLOY_HOOK_URL  required. A Deploy Hook for the main branch, created in the Vercel
//                    project under Settings, Git, Deploy Hooks. Without it the endpoint
//                    answers 503 and nothing is deployed.
const env = (name) => String(process.env[name] || '').replace(/[\u0000-\u001F\u007F\u00A0\u200B-\u200F\u2028\u2029\u2060\uFEFF]/g, ' ').trim();

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const secret = env('CRON_SECRET');
  if (!secret || String(req.headers.authorization || '') !== `Bearer ${secret}`) {
    return res.status(401).json({ ok: false, code: 'auth' });
  }
  const hook = env('DEPLOY_HOOK_URL');
  if (!/^https:\/\//.test(hook)) {
    console.error('[rebuild] DEPLOY_HOOK_URL is not set');
    return res.status(503).json({ ok: false, code: 'config' });
  }
  try {
    const r = await fetch(hook, { method: 'POST', signal: AbortSignal.timeout(10000) });
    if (!r.ok) console.error('[rebuild] deploy hook answered', r.status);
    return res.status(r.ok ? 200 : 502).json({ ok: r.ok, status: r.status });
  } catch (err) {
    console.error('[rebuild] deploy hook failed:', err && err.message);
    return res.status(502).json({ ok: false, code: 'hook' });
  }
}
