// Exercises api/inquiry.js without a network: every refusal, the unconfigured case, and the
// payload Resend would receive. Also writes sample emails to design/gate-a/email/ to look at.
// Run: node scripts/test-inquiry.mjs
import fs from 'node:fs';
import assert from 'node:assert/strict';
import handler from '../api/inquiry.js';
import { buildInquiryEmail } from '../api/_lib/inquiry-email.js';
import business from '../src/data/business.json' with { type: 'json' };

const call = async (over = {}, env = {}) => {
  const saved = { ...process.env };
  for (const k of ['RESEND_API_KEY', 'INQUIRY_FROM', 'INQUIRY_TO', 'INQUIRY_TO_CATERING']) delete process.env[k];
  Object.assign(process.env, env);
  const req = { method: 'POST', headers: { host: 'www.senortequilas.com', origin: 'https://www.senortequilas.com', 'content-type': 'application/json' }, body: { form: 'catering', name: 'Maria Lopez', phone: '(301) 555-0142', date: '2026-11-14', guests: '30', details: 'Office lunch.', page: '/catering' }, ...over };
  const out = { headers: {} };
  const res = { setHeader: (k, v) => { out.headers[k] = v; }, status: (c) => { out.status = c; return res; }, json: (j) => { out.json = j; return res; }, send: (h) => { out.html = h; return res; } };
  const log = console.error, info = console.log; console.error = () => {}; console.log = () => {};
  try { await handler(req, res); } finally { console.error = log; console.log = info; process.env = saved; }
  return out;
};
const ENV = { RESEND_API_KEY: 're_test', INQUIRY_FROM: 'Site <inquiries@example.com>', INQUIRY_TO: 'a@example.com, b@example.com' };
const realFetch = globalThis.fetch; let sent = null;
const stub = (status = 200) => { sent = null; globalThis.fetch = async (url, init) => { sent = { url, init, body: JSON.parse(init.body) }; return { ok: status < 300, status, text: async () => 'x' }; }; };
const body = (o) => ({ body: { form: 'catering', name: 'Maria Lopez', phone: '3015550142', page: '/catering', ...o } });

stub();
assert.equal((await call({ method: 'GET' })).status, 405);
assert.equal((await call({ headers: { host: 'www.senortequilas.com', origin: 'https://evil.example', 'content-type': 'application/json' } })).status, 403);
assert.equal((await call({ body: 'not json' })).status, 400);
let r = await call(body({ company: 'Acme' }), ENV); assert.equal(r.status, 200); assert.equal(sent, null, 'honeypot must not send');
r = await call(body({ name: '' }), ENV); assert.equal(r.status, 422); assert.ok(r.json.errors.name);
r = await call(body({ phone: '555' }), ENV); assert.equal(r.status, 422); assert.ok(r.json.errors.phone);
r = await call(body({ form: 'nope' }), ENV); assert.equal(r.status, 422);
r = await call(body({ guests: 'many' }), ENV); assert.equal(r.status, 422);
r = await call({}, {}); assert.equal(r.status, 503); assert.equal(r.json.code, 'not_configured'); assert.equal(sent, null);
r = await call({}, ENV); assert.equal(r.status, 200); assert.deepEqual(r.json, { ok: true });
assert.equal(sent.url, 'https://api.resend.com/emails'); assert.equal(sent.init.headers.Authorization, 'Bearer re_test');
assert.deepEqual(sent.body.to, ['a@example.com', 'b@example.com']); assert.equal(sent.body.from, ENV.INQUIRY_FROM);
assert.equal(sent.body.subject, 'New catering inquiry: Maria Lopez, 30 guests, Sat, Nov 14');
assert.ok(sent.body.html.includes('tel:+13015550142') && sent.body.text.includes('(301) 555-0142'));
r = await call({}, { ...ENV, INQUIRY_TO_CATERING: 'cater@example.com' }); assert.deepEqual(sent.body.to, ['cater@example.com']);
r = await call(body({ name: '<script>alert(1)</script>', details: '<img src=x onerror=1>' }), ENV); assert.equal(r.status, 200);
assert.ok(!sent.body.html.includes('<script>alert') && !sent.body.html.includes('<img src=x'), 'input must be escaped');
r = await call(body({ page: 'https://evil.example/x' }), ENV); assert.ok(sent.body.html.includes('www.senortequilas.com/</a>') || sent.body.text.includes('senortequilas.com/\n'));
stub(500); r = await call({}, ENV); assert.equal(r.status, 502); assert.equal(r.json.code, 'send_failed');
globalThis.fetch = async () => { throw new Error('down'); }; r = await call({}, ENV); assert.equal(r.status, 502);
// scripts off: an ordinary form post gets a page back, and the page path comes from the referer
const formPost = { headers: { host: 'www.senortequilas.com', origin: 'https://www.senortequilas.com', 'content-type': 'application/x-www-form-urlencoded', referer: 'https://www.senortequilas.com/catering' }, body: { form: 'catering', name: 'Maria Lopez', phone: '3015550142', company: '' } };
stub(); r = await call(formPost, ENV); assert.ok(r.html.includes('Your request is in')); assert.ok(sent.body.text.includes('senortequilas.com/catering'));
r = await call(formPost, {}); assert.equal(r.status, 503); assert.ok(r.html.includes('That did not send') && r.html.includes('301-569-4574'));
globalThis.fetch = realFetch;
console.log('api/inquiry.js: 19 checks pass');

const when = new Date('2026-10-13T18:41:00Z');
const samples = {
  catering: { form: 'catering', name: 'Maria Lopez', phone: '3015550142', date: '2026-11-14', guests: '30', details: 'Office lunch for 30 in Gaithersburg, Tuesday at noon, two vegetarians. Can you bring the taco bar and set up by 11:30?', page: '/catering' },
  wedding: { form: 'wedding', name: 'Daniel Okafor', phone: '2405550188', date: '2027-05-22', guests: '85', details: 'Rehearsal dinner for 85 on a Friday, mostly family, one vegan.\nWe would love the International Room and a mariachi for the first hour.', page: '/private-parties/weddings-receptions' },
  quinceanera: { form: 'quinceanera', name: 'Rosa Hernández', phone: '(301) 555-0111', date: '2027-03-06', guests: '120', details: 'Quince for my daughter Sofía. We need the dance floor and a DJ.', page: '/private-parties/quinceaneras-celebrations' },
  'private-party-minimal': { form: 'private-party', name: 'Sam', phone: '3015550100', date: '', guests: '', details: '', page: '/private-parties' },
};
for (const [n, inq] of Object.entries(samples)) {
  const e = buildInquiryEmail(inq, { business, when });
  fs.mkdirSync('design/gate-a/email', { recursive: true });
  fs.writeFileSync(`design/gate-a/email/${n}.html`, e.html); fs.writeFileSync(`design/gate-a/email/${n}.txt`, `Subject: ${e.subject}\n\n${e.text}\n`);
}
console.log('samples written to design/gate-a/email/');
