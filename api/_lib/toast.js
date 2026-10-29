// Sends a website inquiry into Toast Catering & Events as a lead, the same request Toast's own
// hosted lead form makes. There is no published Toast API for leads; this is the public
// endpoint behind that form, captured 28 October (TOAST-LEADS-NOTES.md, DESIGN-DEBT.md entry
// 148). It can change without notice, so it never throws: the result says whether the lead
// landed, and the managers' email says so either way.

// Which Toast order type each website form becomes, and its occasion label.
export const TOAST_FORMS = {
  catering: { type: 'catering' },
  'private-party': { type: 'privateEvent', occasion: 'Private party' },
  quinceanera: { type: 'privateEvent', occasion: 'Quinceañera' },
  wedding: { type: 'privateEvent', occasion: 'Wedding or reception' },
};

// The instant a wall-clock time in a time zone happens, as Toast's form computes it with
// zonedTimeToUtc. Two passes settle the offset across a daylight saving change.
export function zonedToUtc(isoDate, minutes, timeZone) {
  const [y, m, d] = isoDate.split('-').map(Number);
  const wall = Date.UTC(y, m - 1, d, Math.floor(minutes / 60), minutes % 60);
  const offsetAt = (t) => {
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
      .formatToParts(new Date(t)).filter((x) => x.type !== 'literal').map((x) => [x.type, Number(x.value)]));
    return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - t;
  };
  let t = wall - offsetAt(wall);
  t = wall - offsetAt(t);
  return new Date(t).toISOString();
}

const minutesOf = (hhmm) => (/^\d{2}:\d{2}$/.test(hhmm || '') ? Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3)) : null);

export function buildToastLead(inq, toast) {
  const map = TOAST_FORMS[inq.form];
  if (!map) return null;
  const type = toast.eventTypes[map.type];
  const f = type.fields;
  const parts = String(inq.name).trim().split(/\s+/);
  const digits = String(inq.phone || '').replace(/\D/g, '').replace(/^1(?=\d{10}$)/, '');
  const mins = minutesOf(inq.time);
  const values = map.type === 'catering'
    ? [[f.guests, inq.guests], [f.utensils, inq.utensils], [f.delivery, inq.delivery], [f.occasion, inq.details]]
    : [[f.guests, inq.guests], [f.occasion, map.occasion], [f.notes, inq.details], [f.room, inq.room], [f.flexible, inq.flexible]];
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
    phoneNumber: digits,
    phoneCountryCode: '1',
    phoneCountryIsoCode: 'US',
    email: inq.email,
    ...(inq.date ? { date: zonedToUtc(inq.date, mins ?? 0, toast.timeZone) } : {}),
    ...(inq.date && mins !== null ? { time: zonedToUtc(inq.date, mins, toast.timeZone) } : {}),
    formValues: values.filter(([, v]) => String(v ?? '').trim()).map(([guid, v]) => ({ eventTypeFormFieldGuid: guid, value: String(v).slice(0, 2000) })),
    attachments: [],
    // Marketing consent is the guest's to give on Toast's own form. It is never given for them.
    isEmailMarketingConsentGiven: false,
    isSmsMarketingConsentGiven: false,
    isDateFlexible: inq.flexible === 'Yes',
    restaurantGuid: toast.restaurantGuid,
    eventTypeGuid: type.guid,
    leadSource: 'LEAD_FORM',
  };
}

export async function sendToastLead(inq, toast, { timeoutMs = 8000 } = {}) {
  const lead = buildToastLead(inq, toast);
  if (!lead) return { ok: false, skipped: true };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(toast.leadsUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(lead), signal: ctrl.signal });
    const raw = await r.text().catch(() => '');
    let guid = null;
    try { guid = JSON.parse(raw)?.lead?.leadGuid || null; } catch { /* not JSON */ }
    if (!r.ok || !guid) return { ok: false, status: r.status, error: raw.slice(0, 300) || 'HTTP ' + r.status };
    return { ok: true, leadGuid: guid };
  } catch (e) {
    return { ok: false, error: e && e.name === 'AbortError' ? 'timed out' : String(e && e.message || e) };
  } finally {
    clearTimeout(timer);
  }
}
