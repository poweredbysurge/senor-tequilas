// POST /api/meta-lead. Takes one Facebook or Instagram Instant Form lead from Zapier and gets
// it to people: a text to the managers first, then the lead into Toast Catering & Events, then
// the same email the website forms send. The managers cannot see leads inside Meta, so nothing
// here depends on Meta's Leads Center. See PASTE-meta-lead-delivery.md and DESIGN-DEBT.md.
//
// Zapier (Facebook Lead Ads, New Lead) posts JSON with these keys, mapped from the form:
//   leadgen_id, created_time, campaign_name, ad_name, form_name,
//   type ("catering" or "private-party"), full_name, phone, email,
//   date, time, guests, details, zip
// and the header X-Lead-Secret.
//
// Environment, set in Vercel:
//   META_LEAD_SECRET              required. The shared secret Zapier sends. Without it every
//                                 request is refused, so the endpoint is closed by default.
//   META_LEADS                    optional. "off" answers 200 and does nothing.
//   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_MESSAGING_SERVICE_SID, TWILIO_FROM
//                                 the text sender. The messaging service holds two numbers, so
//                                 TWILIO_FROM pins the lead-alert one. Without these the lead
//                                 still goes to Toast and email.
//   LEAD_SMS_TO                   comma separated mobile numbers, every manager.
//   LEAD_SMS_TO_CATERING, LEAD_SMS_TO_PRIVATE_PARTY
//                                 optional. Replace LEAD_SMS_TO for one lead type.
//   RESEND_API_KEY, INQUIRY_FROM, INQUIRY_TO, INQUIRY_TO_CATERING, INQUIRY_TO_PRIVATE_PARTY,
//   INQUIRY_BCC, TOAST_LEADS      the same ones api/inquiry.js uses, with the same meaning.
//
// No Conversions API event is sent from here: Meta already counts Instant Form leads, and a
// second event would double them (entry 151).
//
// Zapier can replay a lead. The last 200 lead ids are remembered in memory and a repeat is
// answered 200 without sending anything. That memory lasts only as long as the function
// instance, which is enough for a retry minutes later and not a guarantee.
import { createHash, timingSafeEqual } from 'node:crypto';
import business from '../src/data/business.json' with { type: 'json' };
import { buildInquiryEmail, formatPhone, formatDate } from './_lib/inquiry-email.js';
import { sendToastLead } from './_lib/toast.js';

const env = (name) => String(process.env[name] || '').replace(/[\u0000-\u001F\u007F\u00A0\u200B-\u200F\u2028\u2029\u2060\uFEFF]/g, ' ').trim();
const list = (v) => String(v || '').split(/[,;]+/).map((s) => s.trim()).filter(Boolean);
const clean = (v, max) => String(v ?? '').replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, '').trim().slice(0, max);
const same = (a, b) => timingSafeEqual(createHash('sha256').update(a).digest(), createHash('sha256').update(b).digest());

const TYPES = { catering: 'Catering', 'private-party': 'Private party' };
const seen = [];

// "Dec 12", "12/12/2026", "2026-12-12" and the like, as YYYY-MM-DD. Anything else is ''.
export function parseDate(raw, now = new Date()) {
  const s = String(raw || '').trim();
  if (!s) return '';
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})(?:[/.-](\d{2,4}))?$/);
  let y, mo, d;
  if (m) { mo = +m[1]; d = +m[2]; y = m[3] ? (+m[3] < 100 ? 2000 + +m[3] : +m[3]) : null; }
  else {
    // "Dec 12", "Saturday, December 12th, 2026". A month name is required: Date.parse on its
    // own turns almost any sentence into a date.
    const w = s.toLowerCase().match(/^(?:[a-z]+\.?,?\s+)?([a-z]{3,9})\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s+(\d{4}))?$/);
    const idx = w ? ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'].indexOf(w[1].slice(0, 3)) : -1;
    if (idx < 0) return '';
    mo = idx + 1; d = +w[2]; y = w[3] ? +w[3] : null;
  }
  if (!(mo >= 1 && mo <= 12 && d >= 1 && d <= 31)) return '';
  if (y === null) { // no year given: the next time that day comes round
    y = now.getUTCFullYear();
    if (Date.UTC(y, mo - 1, d) < now.getTime() - 86400000) y += 1;
  }
  const iso = `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  return formatDate(iso) ? iso : '';
}

// "6pm", "6:30 PM", "18:30" as HH:MM. Anything else is ''.
export function parseTime(raw) {
  const m = String(raw || '').trim().toLowerCase().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?$/);
  if (!m) return '';
  let h = +m[1]; const min = +(m[2] || 0);
  if (m[3]) { if (h < 1 || h > 12) return ''; if (m[3][0] === 'p' && h < 12) h += 12; if (m[3][0] === 'a' && h === 12) h = 0; }
  if (h > 23 || min > 59) return '';
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

export function readLead(body, now = new Date()) {
  const b = body && typeof body === 'object' ? body : {};
  const rawType = clean(b.type, 60).toLowerCase();
  const form = /cater/.test(rawType) ? 'catering' : 'private-party';
  const rawDate = clean(b.date, 60), rawTime = clean(b.time, 30), rawGuests = clean(b.guests, 60);
  const date = parseDate(rawDate, now), time = parseTime(rawTime);
  const n = (rawGuests.match(/\d{1,4}/) || [])[0];
  const guests = n && +n >= 1 ? String(+n) : '';
  const campaign = clean(b.campaign_name, 120), ad = clean(b.ad_name, 120);
  const from = [campaign, ad].filter(Boolean).join(' / ');
  const lead = {
    id: clean(b.leadgen_id, 80),
    form,
    name: clean(b.full_name, 120).replace(/\s+/g, ' '),
    phone: clean(b.phone, 40).replace(/\n/g, ' '),
    email: clean(b.email, 160).replace(/\s/g, ''),
    date, time, guests,
    zip: clean(b.zip, 12),
    from,
    page: '/',
    utensils: '', delivery: '', room: '', flexible: '',
  };
  if (lead.email && !/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(lead.email)) lead.email = '';
  // What the guest wrote, plus anything that would not fit a field, so nothing they said is lost.
  const notes = [clean(b.details, 3000)];
  const planning = clean(b.type, 60);
  if (planning) notes.push(`Planning: ${planning}`);
  lead.delivered = /deliver/i.test(planning);
  if (rawDate && !date) notes.push(`Date as written: ${rawDate}`);
  if (rawTime && !time) notes.push(`Time as written: ${rawTime}`);
  if (rawGuests && rawGuests !== guests) notes.push(`Guests as written: ${rawGuests}`);
  if (lead.zip) notes.push(`ZIP: ${lead.zip}`);
  notes.push(`From a Facebook ad${from ? ': ' + from : ''}.`);
  lead.details = notes.filter(Boolean).join('\n');
  const values = [b.full_name, b.phone, b.email, b.details].map((v) => String(v || '').toLowerCase());
  lead.test = values.some((v) => v.includes('test lead: dummy data')) || /surge test/i.test(lead.name);
  return lead;
}

// The text. Plain ASCII so it stays one segment, no links, and never the restaurant's name or
// a drink: carriers filter alcohol words.
export function buildText(lead) {
  const ascii = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\x20-\x7E]/g, '').trim();
  const when = formatDate(lead.date, { weekday: 'short', month: 'short', day: 'numeric' });
  const facts = [when, lead.guests ? `${lead.guests} guests` : ''].filter(Boolean).join(', ');
  return [
    `${lead.test ? 'TEST. ' : ''}Surge lead alert: new ${TYPES[lead.form].toUpperCase()} lead (Facebook ad)`,
    [ascii(lead.name).slice(0, 40), formatPhone(lead.phone)].filter(Boolean).join(' '),
    facts,
    'Call now. Full details in your email.',
  ].filter(Boolean).join('\n');
}

const e164 = (raw) => { const d = String(raw).replace(/\D/g, ''); return d.length === 10 ? '+1' + d : d.length === 11 && d[0] === '1' ? '+' + d : ''; };

async function sendTexts(lead) {
  const sid = env('TWILIO_ACCOUNT_SID'), token = env('TWILIO_AUTH_TOKEN').replace(/\s/g, '');
  const service = env('TWILIO_MESSAGING_SERVICE_SID'), from = e164(env('TWILIO_FROM'));
  const perType = env('LEAD_SMS_TO_' + lead.form.toUpperCase().replace(/-/g, '_'));
  const to = [...new Set(list(perType || env('LEAD_SMS_TO')).map(e164).filter(Boolean))];
  if (!sid || !token || !(service || from) || !to.length) {
    console.error('meta-lead: sms not configured', { sid: !!sid, token: !!token, sender: !!(service || from), to: to.length });
    return { configured: false, sent: 0, failed: 0 };
  }
  const body = buildText(lead);
  const results = await Promise.allSettled(to.map(async (num) => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    try {
      const form = new URLSearchParams({ To: num, Body: body });
      if (service) form.set('MessagingServiceSid', service);
      if (from) form.set('From', from);
      const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
        method: 'POST',
        headers: { Authorization: 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64'), 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form.toString(), signal: ctrl.signal,
      });
      if (!r.ok) throw new Error(`HTTP ${r.status} ${(await r.text().catch(() => '')).slice(0, 160)}`);
    } catch (e) {
      console.error('meta-lead: text failed, number ending', num.slice(-4), e && e.message);
      throw e;
    } finally { clearTimeout(timer); }
  }));
  const sent = results.filter((r) => r.status === 'fulfilled').length;
  return { configured: true, sent, failed: results.length - sent };
}

// Toast wants a first and last name, an email and a head count, and for catering a date. The
// Instant Form does not ask everything Toast's own form asks, so the lead goes as it is first.
// If Toast refuses, it goes once more in the exact shape the website forms send (the proven
// one, entry 148): every yes or no answered, and for catering a time. Those fill-ins are
// placeholders, and the note in Toast says so, so the manager confirms them on the call.
async function sendToToast(lead) {
  if (lead.test || env('TOAST_LEADS').toLowerCase() === 'off') return { skipped: true };
  const ready = lead.name.split(/\s+/).length >= 2 && lead.email && lead.guests && (lead.form !== 'catering' || lead.date);
  if (!ready) return { ok: false, error: 'missing what Toast needs' };
  let r = await sendToastLead(lead, business.toast, { timeoutMs: 5000 });
  if (r.ok) return { ...r, defaults: false };
  const catering = lead.form === 'catering';
  const fill = catering
    ? { utensils: 'No', delivery: lead.delivered ? 'Yes' : 'No', time: lead.time || '12:00' }
    : { room: 'No', flexible: 'No' };
  const asked = catering
    ? `Utensils${lead.time ? '' : ' and the time'} were not asked on the ad form${lead.time ? '' : ' (noon is a placeholder)'}.`
    : 'Private room and flexible date were not asked on the ad form.';
  r = await sendToastLead({ ...lead, ...fill, details: `${lead.details}\n${asked} Confirm on the call.` }, business.toast, { timeoutMs: 5000 });
  return { ...r, defaults: true };
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ ok: false, code: 'method' }); }
  const secret = env('META_LEAD_SECRET');
  const given = String(req.headers['x-lead-secret'] || '');
  if (!secret || !given || !same(secret, given)) return res.status(401).json({ ok: false, code: 'secret' });
  if (env('META_LEADS').toLowerCase() === 'off') return res.status(200).json({ ok: true, skipped: true });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = null; } }
  if (!body || typeof body !== 'object') return res.status(400).json({ ok: false, code: 'body' });
  const lead = readLead(body);
  if (lead.name.length < 2 && lead.phone.replace(/\D/g, '').length < 10) return res.status(422).json({ ok: false, code: 'invalid' });
  if (!lead.name) lead.name = 'Name not given';
  if (lead.id && seen.includes(lead.id)) return res.status(200).json({ ok: true, duplicate: true });

  // Texts first, and nothing waits on them.
  const texts = sendTexts(lead).catch((e) => { console.error('meta-lead: texts threw', e && e.message); return { configured: true, sent: 0, failed: 1 }; });

  const toast = await sendToToast(lead);
  if (toast.ok) console.log('meta-lead: toast lead', toast.leadGuid, toast.defaults ? 'with defaults' : '');
  else if (!toast.skipped) console.error('meta-lead: toast refused', toast.status || '', toast.error);

  const email = { ok: false };
  const key = env('RESEND_API_KEY').replace(/\s/g, '');
  const from = env('INQUIRY_FROM');
  const to = list(env('INQUIRY_TO_' + lead.form.toUpperCase().replace(/-/g, '_')) || env('INQUIRY_TO'));
  const bcc = list(env('INQUIRY_BCC'));
  if (!key || !from || !to.length) console.error('meta-lead: email not configured', { key: !!key, from: !!from, to: to.length });
  else {
    try {
      const built = buildInquiryEmail(lead, { business, toast: toast.skipped ? undefined : toast, source: { label: 'Facebook ad', from: lead.from } });
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to, ...(bcc.length ? { bcc } : {}), subject: (lead.test ? 'TEST: ' : '') + built.subject, html: built.html, text: built.text, ...(lead.email ? { reply_to: lead.email } : {}), tags: [{ name: 'form', value: 'meta_' + lead.form.replace(/-/g, '_') }] }),
      });
      email.ok = r.ok;
      if (!r.ok) console.error('meta-lead: resend refused', r.status, (await r.text().catch(() => '')).slice(0, 300));
    } catch (e) { console.error('meta-lead: resend unreachable', e && e.message); }
  }

  const sms = await texts;
  const reached = sms.sent > 0 || email.ok;
  console.log('meta-lead:', lead.form, 'texts', sms.sent, 'failed', sms.failed, 'email', email.ok, 'toast', toast.skipped ? 'skipped' : !!toast.ok);
  // A 502 makes Zapier retry and flag it. Only when nobody was reached, so a retry cannot
  // text people twice. The id is remembered only once someone has the lead.
  if (!reached) return res.status(502).json({ ok: false, code: 'nobody_reached', sms, toast: { ok: !!toast.ok }, email });
  if (lead.id) { seen.push(lead.id); if (seen.length > 200) seen.shift(); }
  return res.status(200).json({ ok: true, sms: { sent: sms.sent, failed: sms.failed }, toast: { ok: !!toast.ok, skipped: !!toast.skipped }, email });
}
