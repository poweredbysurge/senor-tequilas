// Exercises api/meta-lead.js without a network. Run: node scripts/test-meta-lead.mjs
import assert from 'node:assert/strict';
import handler, { readLead, buildText, parseDate, parseTime } from '../api/meta-lead.js';

const now = new Date('2026-11-11T20:00:00Z');
assert.equal(parseDate('2026-12-12'), '2026-12-12');
assert.equal(parseDate('12/12/2026'), '2026-12-12');
assert.equal(parseDate('12/12', now), '2026-12-12');
assert.equal(parseDate('1/5', now), '2027-01-05');
assert.equal(parseDate('Dec 12', now), '2026-12-12');
assert.equal(parseDate('sometime in spring', now), '');
assert.equal(parseTime('6pm'), '18:00'); assert.equal(parseTime('6:30 PM'), '18:30'); assert.equal(parseTime('18:30'), '18:30'); assert.equal(parseTime('evening'), '');

const LEAD = { leadgen_id: 'L1', campaign_name: 'Events & Catering', ad_name: 'Testimonial video', type: 'Catering', full_name: 'María López', phone: '+13015550142', email: 'maria@example.com', date: '12/12/2026', time: '12pm', guests: '40 to 50', details: 'Office lunch', zip: '20874' };
let l = readLead(LEAD, now);
assert.equal(l.form, 'catering'); assert.equal(l.date, '2026-12-12'); assert.equal(l.time, '12:00'); assert.equal(l.guests, '40');
assert.match(l.details, /Guests as written: 40 to 50/); assert.match(l.details, /ZIP: 20874/); assert.match(l.details, /From a Facebook ad: Events & Catering \/ Testimonial video/);
assert.equal(readLead({ ...LEAD, type: 'Private party at the restaurant' }).form, 'private-party');
// The live form's own answers (form 1816621263011339, read 11 November).
assert.equal(readLead({ ...LEAD, type: 'Catering delivered to my location' }).form, 'catering');
l = readLead({ ...LEAD, type: 'Holiday or office party', guests: 'Under 25', date: 'December 19th' }, now);
assert.equal(l.form, 'private-party'); assert.equal(l.guests, '25'); assert.equal(l.date, '2026-12-19'); assert.match(l.details, /Planning: Holiday or office party/); assert.match(l.details, /Guests as written: Under 25/);
assert.equal(readLead({ ...LEAD, guests: 'More than 100' }).guests, '100'); assert.equal(readLead({ ...LEAD, guests: '51 to 100' }).guests, '51');
l = readLead(LEAD, now);
assert.equal(readLead({ ...LEAD, full_name: '<test lead: dummy data for full_name>' }).test, true);
// As Zapier delivers Meta's testing-tool lead (seen 11 November): no angle brackets.
assert.equal(readLead({ ...LEAD, full_name: 'test lead: dummy data for full_name' }).test, true);
const t = buildText(l);
assert.ok(t.length <= 160, 'one segment: ' + t.length); assert.ok(/^[\x20-\x7E\n]+$/.test(t), 'ascii only');
assert.match(t, /Maria Lopez \(301\) 555-0142/); assert.match(t, /Sat, Dec 12, 40 guests/); assert.ok(!/tequila/i.test(t));
assert.equal(buildText(readLead({ full_name: 'Al B', phone: '3015550142' })).split('\n').length, 3, 'missing facts drop the line');

let calls = [], twilioStatus = 201, toastStatuses = [200], resendStatus = 200;
globalThis.fetch = async (url, init) => {
  const u = String(url); calls.push({ url: u, init });
  if (u.includes('twilio.com')) return { ok: twilioStatus < 300, status: twilioStatus, text: async () => '{}' };
  if (u.includes('toasttab.com')) { const s = toastStatuses.length > 1 ? toastStatuses.shift() : toastStatuses[0]; return { ok: s < 300, status: s, text: async () => (s < 300 ? JSON.stringify({ lead: { leadGuid: 'g-1' } }) : 'bad') }; }
  return { ok: resendStatus < 300, status: resendStatus, text: async () => 'x' };
};
const ENV = { META_LEAD_SECRET: 's3cret', TWILIO_ACCOUNT_SID: 'AC1', TWILIO_AUTH_TOKEN: 'tok', TWILIO_MESSAGING_SERVICE_SID: 'MG1', TWILIO_FROM: '+12402557959', LEAD_SMS_TO: '+1 (240) 555-0001, 3015550002', RESEND_API_KEY: 're', INQUIRY_FROM: 'Site <a@example.com>', INQUIRY_TO: 'm1@example.com,m2@example.com' };
const call = async (body, { env = {}, headers = { 'x-lead-secret': 's3cret' }, method = 'POST' } = {}) => {
  calls = []; const saved = { ...process.env };
  for (const k of [...Object.keys(ENV), 'META_LEADS', 'TOAST_LEADS', 'INQUIRY_BCC', 'LEAD_SMS_TO_CATERING']) delete process.env[k];
  Object.assign(process.env, ENV, env);
  const out = {}; const res = { setHeader() {}, status: (c) => { out.status = c; return res; }, json: (j) => { out.json = j; return res; } };
  const log = console.log, err = console.error; console.log = () => {}; console.error = () => {};
  try { await handler({ method, headers, body }, res); } finally { console.log = log; console.error = err; process.env = saved; }
  return out;
};
const of = (s) => calls.filter((c) => c.url.includes(s));

assert.equal((await call(LEAD, { method: 'GET' })).status, 405);
assert.equal((await call(LEAD, { headers: {} })).status, 401);
assert.equal((await call(LEAD, { headers: { 'x-lead-secret': 'nope' } })).status, 401);
assert.equal((await call(LEAD, { env: { META_LEAD_SECRET: '' } })).status, 401, 'closed without a secret');
let r = await call(LEAD, { env: { META_LEADS: 'off' } }); assert.equal(r.json.skipped, true); assert.equal(calls.length, 0);
assert.equal((await call({ leadgen_id: 'x' })).status, 422);

r = await call(LEAD);
assert.equal(r.status, 200); assert.deepEqual(r.json.sms, { sent: 2, failed: 0 }); assert.equal(r.json.toast.ok, true); assert.equal(r.json.email.ok, true);
const tw = new URLSearchParams(of('twilio')[0].init.body);
assert.equal(tw.get('From'), '+12402557959'); assert.equal(tw.get('MessagingServiceSid'), 'MG1'); assert.equal(tw.get('To'), '+12405550001');
assert.equal(new URLSearchParams(of('twilio')[1].init.body).get('To'), '+13015550002');
assert.equal(of('toasttab').length, 1, 'first try, no defaults');
const toastBody = JSON.parse(of('toasttab')[0].init.body);
assert.equal(toastBody.firstName, 'María'); assert.equal(toastBody.formValues.length, 2, 'guests and occasion only');
const mail = JSON.parse(of('resend')[0].init.body);
assert.deepEqual(mail.to, ['m1@example.com', 'm2@example.com']); assert.match(mail.subject, /^New catering lead \(Facebook ad\): María López, 40 guests/);
assert.match(mail.html, /Facebook ad lead/); assert.match(mail.html, /Added to Toast/); assert.ok(!/Website inquiry|from the website/.test(mail.html));

r = await call(LEAD); assert.equal(r.json.duplicate, true); assert.equal(calls.length, 0, 'a replay sends nothing');

toastStatuses = [400, 200];
r = await call({ ...LEAD, leadgen_id: 'L2' }); assert.equal(of('toasttab').length, 2, 'retry with defaults');
const retry = JSON.parse(of('toasttab')[1].init.body); assert.equal(retry.formValues.length, 4); assert.equal(r.json.toast.ok, true);
// The retry is the website's shape: a catering lead with no time gets noon, and a lead that said "delivered" gets delivery Yes.
toastStatuses = [400, 200];
r = await call({ ...LEAD, leadgen_id: 'L2b', time: '', type: 'Catering delivered to my location' });
const first = JSON.parse(of('toasttab')[0].init.body), second = JSON.parse(of('toasttab')[1].init.body);
assert.equal(first.time, undefined); assert.ok(second.time, 'retry carries a time'); assert.ok(second.formValues.some((v) => v.value === 'Yes'), 'delivery Yes');
assert.ok(second.formValues.some((v) => /noon is a placeholder/.test(v.value)));
toastStatuses = [400, 200];
r = await call({ ...LEAD, leadgen_id: 'L2c', type: 'Private party at the restaurant' });
assert.equal(JSON.parse(of('toasttab')[1].init.body).formValues.length, 5, 'guests, occasion, notes, room, flexible');
toastStatuses = [200];

r = await call({ ...LEAD, leadgen_id: 'L3', full_name: 'Surge Test' });
assert.equal(of('toasttab').length, 0, 'test leads stay out of Toast'); assert.match(new URLSearchParams(of('twilio')[0].init.body).get('Body'), /^TEST\. /); assert.match(JSON.parse(of('resend')[0].init.body).subject, /^TEST: /);

r = await call({ ...LEAD, leadgen_id: 'L4', email: '', guests: '' });
assert.equal(of('toasttab').length, 0); assert.match(JSON.parse(of('resend')[0].init.body).html, /Not added to Toast/); assert.equal(r.status, 200);

r = await call({ ...LEAD, leadgen_id: 'L5' }, { env: { TWILIO_AUTH_TOKEN: '' } });
assert.equal(r.status, 200, 'ships without Twilio'); assert.equal(of('twilio').length, 0); assert.equal(r.json.email.ok, true);

twilioStatus = 500; resendStatus = 500;
r = await call({ ...LEAD, leadgen_id: 'L6' }); assert.equal(r.status, 502);
twilioStatus = 201;
r = await call({ ...LEAD, leadgen_id: 'L6' }); assert.equal(r.status, 200, 'a failed lead is not remembered, so the retry runs'); assert.equal(r.json.sms.sent, 2);
resendStatus = 200;

console.log('api/meta-lead.js: all checks pass');
