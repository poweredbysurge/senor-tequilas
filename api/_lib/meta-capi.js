// Sends a website lead to Meta through the Conversions API, the server half of the Meta pixel
// in Base.astro. The browser fires the same event with the same event ID, so Meta keeps one
// and drops the other. The server copy is the one that survives ad blockers and Safari's
// tracking limits. See DESIGN-DEBT.md entry 151.
//
// Environment, set in Vercel:
//   META_CAPI_TOKEN       required. The access token generated for the dataset in Events
//                         Manager (Settings, Conversions API, Generate access token). Without
//                         it nothing is sent and the form works exactly as before.
//   META_CAPI_TEST_CODE   optional. The test event code from Events Manager's Test events tab,
//                         while checking the setup. Remove it once events show up.
//   META_GRAPH_VERSION    optional. Defaults to v25.0. Bump it when Meta retires the version.
//
// It never throws and gives up after three seconds, so it can never cost a booking.
import { createHash } from 'node:crypto';

const sha = (v) => (v ? createHash('sha256').update(v).digest('hex') : undefined);
const norm = (v) => String(v || '').trim().toLowerCase();

export function buildMetaEvent(inq, { siteUrl, eventId, fbp, fbc, ip, ua, now = Date.now() }) {
  const parts = norm(inq.name).split(/\s+/).filter(Boolean);
  let digits = String(inq.phone || '').replace(/\D/g, '');
  if (digits.length === 10) digits = '1' + digits;
  const user = {
    em: inq.email ? [sha(norm(inq.email))] : undefined,
    ph: digits ? [sha(digits)] : undefined,
    fn: parts[0] ? [sha(parts[0])] : undefined,
    ln: parts.length > 1 ? [sha(parts[parts.length - 1])] : undefined,
    country: [sha('us')],
    client_ip_address: ip || undefined,
    client_user_agent: ua || undefined,
    fbp: fbp || undefined,
    fbc: fbc || undefined,
  };
  Object.keys(user).forEach((k) => user[k] === undefined && delete user[k]);
  return {
    event_name: inq.form === 'contact' ? 'Contact' : 'Lead',
    event_time: Math.floor(now / 1000),
    event_id: eventId || undefined,
    action_source: 'website',
    event_source_url: new URL(inq.page || '/', siteUrl).href,
    user_data: user,
    custom_data: { content_name: inq.form, content_category: inq.form === 'catering' ? 'catering' : inq.form === 'contact' ? 'contact' : 'private_event' },
  };
}

export async function sendMetaEvent(inq, ctx, { pixelId, token, testCode, version = 'v25.0' }) {
  if (!pixelId || !token) return { ok: false, skipped: true };
  const body = { data: [buildMetaEvent(inq, ctx)], ...(testCode ? { test_event_code: testCode } : {}) };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 3000);
  try {
    const r = await fetch(`https://graph.facebook.com/${version}/${pixelId}/events?access_token=${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    const text = await r.text();
    return r.ok ? { ok: true } : { ok: false, status: r.status, error: text.slice(0, 300) };
  } catch (e) {
    return { ok: false, error: e && e.message };
  } finally {
    clearTimeout(timer);
  }
}
