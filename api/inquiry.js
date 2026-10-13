// POST /api/inquiry. Takes one of the four inquiry forms and emails the managers through
// Resend. The site is static; this is its only server code. See DESIGN-DEBT.md entry 107.
//
// Environment, set in Vercel:
//   RESEND_API_KEY   required. Without it the endpoint answers 503 and the form tells the
//                    guest to call, so nothing is ever silently dropped.
//   INQUIRY_FROM     required. A sender on a domain verified in Resend, for example
//                    "Señor Tequila's Website <inquiries@senortequilas.com>".
//   INQUIRY_TO       required. One or more manager addresses, comma separated.
//   INQUIRY_TO_CATERING, INQUIRY_TO_PRIVATE_PARTY, INQUIRY_TO_QUINCEANERA, INQUIRY_TO_WEDDING,
//   INQUIRY_TO_CONTACT
//                    optional. Recipients for one form only, replacing INQUIRY_TO for it.
//   INQUIRY_CONFIRM  optional. Set to "off" to stop the confirmation sent to a guest who
//                    gave an email address.
import business from '../src/data/business.json' with { type: 'json' };
import { buildInquiryEmail, buildConfirmationEmail, FORMS } from './_lib/inquiry-email.js';

const list = (v) => String(v || '').split(',').map((s) => s.trim()).filter(Boolean);
const clean = (v, max) => String(v ?? '').replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, '').trim().slice(0, max);

export function validate(body) {
  const b = body && typeof body === 'object' ? body : {};
  const inq = {
    form: clean(b.form, 40),
    name: clean(b.name, 120).replace(/\n/g, ' '),
    phone: clean(b.phone, 40).replace(/\n/g, ' '),
    email: clean(b.email, 160).replace(/\s/g, ''),
    date: clean(b.date, 10),
    guests: clean(b.guests, 6),
    details: clean(b.details, 4000),
    page: clean(b.page, 200),
  };
  const errors = {};
  if (!FORMS[inq.form]) errors.form = 'Unknown form.';
  if (inq.name.length < 2) errors.name = 'Please enter your name.';
  // An event form is answered by phone, so the phone is required and the email is a courtesy.
  // The contact form is answered in writing, so it is the other way round.
  const event = FORMS[inq.form] ? FORMS[inq.form].event : true;
  const digits = inq.phone.replace(/\D/g, '');
  if (inq.phone || event) {
    if (digits.length < 10 || digits.length > 15) errors.phone = 'Please enter a phone number with its area code.';
  }
  if (inq.email || !event) {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(inq.email)) errors.email = 'Please enter an email address we can reply to.';
  }
  if (!event && inq.details.length < 2) errors.details = 'Please write your message.';
  if (!event) { inq.date = ''; inq.guests = ''; }
  if (inq.date && !/^\d{4}-\d{2}-\d{2}$/.test(inq.date)) errors.date = 'Please pick a date.';
  if (inq.guests) {
    const n = Number(inq.guests);
    if (!Number.isInteger(n) || n < 1 || n > 5000) errors.guests = 'Please enter a number of guests.';
    else inq.guests = String(n);
  }
  if (!/^\/[\w\-/]*$/.test(inq.page)) inq.page = '/';
  return { inq, errors };
}

function sameSite(req) {
  const origin = req.headers.origin;
  if (!origin) return true; // same-origin form posts from older browsers send none
  let host;
  try { host = new URL(origin).host; } catch { return false; }
  return host === req.headers.host || host === new URL(business.siteUrl).host;
}

// A browser with scripts off posts the form the old way and has to be shown a page, not JSON.
const page = (title, line) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>${title}</title></head><body style="margin:0;background:#121210;color:#EAE2D6;font-family:Barlow,Helvetica,Arial,sans-serif;display:grid;place-items:center;min-height:100vh;"><main style="max-width:34rem;padding:32px;text-align:center;"><h1 style="font-family:'Archivo Black','Arial Black',sans-serif;text-transform:uppercase;color:#F6EFE4;font-size:28px;line-height:1.05;margin:0 0 12px;">${title}</h1><p style="font-size:17px;line-height:1.6;margin:0 0 22px;">${line}</p><a href="/" style="color:#38B049;font-weight:800;">Back to the site</a></main></body></html>`;

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  // Scripts on: the page posts JSON and reads JSON back. Scripts off: an ordinary form post.
  const plain = !/application\/json/i.test(String(req.headers['content-type'] || ''));
  if (plain && req.method === 'POST') {
    res.json = (j) => {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      const phone = business.telephone.replace(/^\+1-/, '');
      return res.send(j.ok ? page('Your request is in', 'Thank you. We will call you back.')
        : j.code === 'invalid' ? page('One thing to fix', Object.values(j.errors)[0] + ' Please go back and try again.')
        : page('That did not send', `Please call us at <a href="tel:${business.telephone.replace(/-/g, '')}" style="color:#38B049;font-weight:800;">${phone}</a> and we will take it from there.`));
    };
    if (req.body && typeof req.body === 'object' && !req.body.page) {
      try { req.body.page = new URL(req.headers.referer).pathname; } catch { /* no referer */ }
    }
  }
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ ok: false, code: 'method' }); }
  if (!sameSite(req)) return res.status(403).json({ ok: false, code: 'origin' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = null; } }
  if (!body || typeof body !== 'object') return res.status(400).json({ ok: false, code: 'body' });

  // The honeypot: a field no person can see. A filled one is a bot, and it is told it worked.
  if (clean(body.company, 200)) return res.status(200).json({ ok: true });

  const { inq, errors } = validate(body);
  if (Object.keys(errors).length) return res.status(422).json({ ok: false, code: 'invalid', errors });

  const key = process.env.RESEND_API_KEY;
  const from = process.env.INQUIRY_FROM;
  const perForm = process.env['INQUIRY_TO_' + inq.form.toUpperCase().replace(/-/g, '_')];
  const to = list(perForm || process.env.INQUIRY_TO);
  if (!key || !from || !to.length) {
    console.error('inquiry: not configured', { key: !!key, from: !!from, to: to.length });
    return res.status(503).json({ ok: false, code: 'not_configured' });
  }

  const { subject, html, text } = buildInquiryEmail(inq, { business });
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, subject, html, text, ...(inq.email ? { reply_to: inq.email } : {}), tags: [{ name: 'form', value: inq.form.replace(/-/g, '_') }] }),
    });
    if (!r.ok) {
      console.error('inquiry: resend refused', r.status, (await r.text()).slice(0, 300));
      return res.status(502).json({ ok: false, code: 'send_failed' });
    }
    console.log('inquiry: sent', inq.form, inq.page);
    // The guest's copy. It is a courtesy: the managers already have the inquiry, so a failure
    // here is logged and the guest is still told it went through.
    if (inq.email && String(process.env.INQUIRY_CONFIRM || '').toLowerCase() !== 'off') {
      try {
        const c = buildConfirmationEmail(inq, { business });
        const cr = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
          body: JSON.stringify({ from, to: [inq.email], subject: c.subject, html: c.html, text: c.text, reply_to: to[0], tags: [{ name: 'form', value: 'confirmation' }] }),
        });
        if (!cr.ok) console.error('inquiry: confirmation refused', cr.status);
      } catch (e) { console.error('inquiry: confirmation unreachable', e && e.message); }
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('inquiry: resend unreachable', e && e.message);
    return res.status(502).json({ ok: false, code: 'send_failed' });
  }
}
