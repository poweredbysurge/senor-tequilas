# Meta Instant Form leads: text the managers, land in Toast, log to a sheet

**The Surge Agency · Nov 11, 2026 · Señor Tequila's**

**What Jeremy asked for (Nov 10 texts).** Every private party and catering lead from the Facebook and Instagram ads hits the managers by text first, then lives in Toast Catering & Events. The managers cannot see the lead forms inside Meta, so nothing may depend on Meta's Leads Center. A sheet is a nice-to-have log.

**How it works.**

```
Meta Instant Form lead
   -> Zapier trigger "Facebook Lead Ads: New Lead" (Zapier's own approved Meta app, no app review for us)
        -> step 1: POST to https://www.senortequilas.com/api/meta-lead   (this build)
             1. text every manager (Twilio)            first, in parallel, never waits on anything
             2. send the lead into Toast               same code the website forms use, api/_lib/toast.js
             3. email the six managers (Resend)        same template as website inquiries, says if Toast took it
        -> step 2: add a row to the "Ad Leads" Google Sheet in the client's Drive
```

**Why not text from Zapier itself.** SMS by Zapier only sends to numbers that each verify a PIN, caps at 15 an hour and 153 characters, does not support T-Mobile numbers, and blocks messages that reference alcohol. Wrong tool for a tequila restaurant. Twilio sends the texts.

**Why not our own Meta app.** A custom app needs `leads_retrieval` and a webhook subscription on the Page, which can mean app review and business verification before real leads flow. Zapier already holds that approval. If the Zapier fee ever matters, `api/meta-lead.js` can take Meta's webhook directly later; the Toast, text and email half does not change.

**Needed before this can go live (Sam).**

1. Zapier paid plan (Facebook Lead Ads is a premium app). Connect it with a Facebook login that is admin on the Page and has Leads Access.
2. Done Nov 11: lead-alert number **(240) 255-7959** (`+12402557959`, `PN18a693fe90b966e99fae8f6c600065e1`) bought on Surge's Twilio account and attached to Surge's Messaging Service `MGec6ffd856658eb3f39bccbe061fe00d3`, whose A2P campaign is VERIFIED. The service also holds the Surge main line, so every send passes both `MessagingServiceSid` and `From=+12402557959` to pin the sender. Texts open with "Surge lead alert" because Surge is the registered sender.
3. Done Nov 11: manager cell numbers are in `workspace/clients/senor-tequilas/CONTEXT.md` (Daniela's still to come). Everyone gets every lead, no split.
4. The Instant Form questions updated to the list in section 4.

---
---

# BUILT NOV 11 (the spec below is kept for reference)

`api/meta-lead.js` and `scripts/test-meta-lead.mjs` exist and pass, written in the Cowork session of Nov 11, not yet committed or deployed. Two differences from the spec: the helpers were not lifted into `api/_lib/util.js` (so `api/inquiry.js` is untouched), and a 502 is returned only when no text and no email got through.

Read `CLAUDE.md`, `DESIGN-DEBT.md` entries 107, 109, 148 and 151, and `TOAST-LEADS-NOTES.md` first. This adds one serverless function inside the established system. No framework, no new dependencies (call Twilio's REST API with `fetch`), no em dashes.

## 1. `api/meta-lead.js`

Follow `api/inquiry.js`: same `env`, `list` and `clean` helpers (lift them into `api/_lib/util.js` and import in both rather than copying), same comment block at the top listing every environment variable, same posture: a lead is never dropped because one leg failed.

**Request.** `POST` with JSON from Zapier. Reject anything else with 405. Check the header `X-Lead-Secret` against `META_LEAD_SECRET` with a constant-time compare; wrong or missing is a 401. No BotID and no same-site check here, this is server to server. `META_LEADS=off` answers 200 `{ ok: true, skipped: true }` and does nothing.

**Body.** Zapier maps the form's answers onto these keys, so the code never depends on Meta's field names:

```
leadgen_id, created_time, campaign_name, ad_name, form_name,
type            "catering" or "private-party" (anything else is treated as private-party)
full_name, phone, email,
date            YYYY-MM-DD if Zapier could format it, else free text
time            HH:MM 24h if given
guests          a number, or free text like "40 to 50"
details         free text (occasion, notes)
zip
```

Clean every value the way `validate()` does. Take the first integer out of `guests`. A date or time that does not parse stays out of the Toast call and goes into the notes as written. The only hard requirement is a name or a phone; with neither, answer 422.

**Test leads.** Meta's Lead Ads Testing Tool sends values like `<test lead: dummy data for full_name>`. When any value starts with `<test lead`, or `full_name` contains "Surge Test", run the texts and email with "TEST" at the front of the subject and the text, and skip Toast.

**Order of work.**

1. **Texts, at once.** Start the Twilio sends and do not await them before step 2. Recipients: `LEAD_SMS_TO_CATERING` or `LEAD_SMS_TO_PRIVATE_PARTY` when set for that type, else `LEAD_SMS_TO` (comma separated, E.164). One API call per recipient to `https://api.twilio.com/2010-04-01/Accounts/<sid>/Messages.json`, basic auth, `MessagingServiceSid` from `TWILIO_MESSAGING_SERVICE_SID` together with `From` from `TWILIO_FROM` (the service holds two numbers, so `From` pins the lead-alert one). `Promise.allSettled`, 6 second timeout each, log each failure with the last four digits only. Body, one segment where possible, plain ASCII, no links:

   ```
   Surge lead alert: new CATERING lead (Facebook ad)
   Maria Lopez 301-555-0123
   Sat Dec 12, 40 guests
   Call now. Details in your email and Toast.
   ```
   Leave out a line when its data is missing. Never put the word tequila, a drink or a price in the text; carriers filter alcohol content.

2. **Toast.** Build an `inq` object in the shape `sendToastLead()` already takes and call it with `business.toast`. Send it only when there is a first and last name, an email and a guest count, and for catering a date and a time. The Instant Form does not ask the yes/no questions Toast's form asks (utensils, delivery, private room, flexible date). First try the lead without those `formValues`. If Toast refuses, retry once with "No" for each and add "From a Facebook ad. Utensils, delivery and room not asked, confirm on the call." to the notes or occasion field. Record in DESIGN-DEBT which of the two Toast accepted. Prefix the notes with `Facebook ad: <campaign_name> / <ad_name>` so the source shows in Toast.

3. **Email.** `buildInquiryEmail()` to the same recipients the website forms use (`INQUIRY_TO` and the per-form overrides, `INQUIRY_BCC` if still set), with the Toast banner as it works today. Add a `source` option to the builder: the eyebrow reads "Catering · Facebook ad lead" in place of "Website inquiry", and the subject starts "New catering lead (Facebook ad): ...". Website emails must not change by a pixel; cover that with the existing email test or a snapshot.

4. Await the texts, then answer 200 with `{ ok, sms: { sent, failed }, toast: { ok }, email: { ok } }`. Answer 502 only when the texts and the email both failed, so Zapier retries and flags it. Never a 5xx when at least one channel reached a person.

**Do not** send a Conversions API event from here. Meta already counts Instant Form leads; a second event would double them (entry 151).

**Duplicates.** Zapier can replay a lead. There is no database on this site, so keep it simple: hold the last 200 `leadgen_id` values in module memory and skip Toast for a repeat, while still answering 200. Note the limit in the file header.

## 2. Environment, set in Vercel (Production)

```
META_LEAD_SECRET                 long random string, also pasted into the Zapier step header
META_LEADS                       optional, "off" stops everything without a deploy
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_MESSAGING_SERVICE_SID     MGec6ffd856658eb3f39bccbe061fe00d3
TWILIO_FROM                      +12402557959
LEAD_SMS_TO                      comma separated E.164 numbers, every manager
LEAD_SMS_TO_CATERING             optional, replaces LEAD_SMS_TO for catering
LEAD_SMS_TO_PRIVATE_PARTY        optional, replaces LEAD_SMS_TO for private parties
```

Without the Twilio values the function still runs Toast and email and logs `meta-lead: sms not configured`, so it can ship before the Twilio sender clears.

## 3. Tests and proof

- Unit: the body mapper (guest parsing, bad dates, test-lead detection), the text builder (missing lines drop out, stays under 160 characters for a normal lead), the secret check.
- Live: one POST with `full_name: "Surge Test"` from curl against the preview deployment. Proof for the HQ card: the text on Sam's phone, the email, and the function log line.
- Then one real run through Zapier with Meta's Lead Ads Testing Tool, and one run with a real-looking name so a lead lands in Toast. Delete that lead in Toast afterwards and say so in TASKS.

Log it as a new DESIGN-DEBT entry and add a TASKS M line: "Meta leads, watch for 'Not added to Toast' on Facebook ad leads; field GUID drift is the same risk as M27."

## 4. Not code: the Zapier zap and the form (Sam)

**Instant Form (read from Business Suite Nov 11).** The live form is "SEN | Events and Catering quote | Nov26", ID `1816621263011339`, Higher intent, 58 leads. It already asks: What are you planning? (Private party at the restaurant / Holiday or office party / Catering delivered to my location), About how many guests? (Under 25 / 25 to 50 / 51 to 100 / More than 100), What date are you looking at? (free text), then email, full name, phone. The intro names Germantown. The endpoint reads these answers as they are: a guest range becomes its first number with the range kept in the notes, a date that will not parse stays in the notes. It does not ask ZIP, time or free notes. Left unchanged on purpose because it converts.

**Zap.** Trigger: Facebook Lead Ads, New Lead, Page = Señor Tequila's, Form = all forms. Step 1: Webhooks by Zapier, POST, JSON, URL `https://www.senortequilas.com/api/meta-lead`, header `X-Lead-Secret`, body keys as in section 1. Step 2: Google Sheets, Create Spreadsheet Row in "Ad Leads" (client Drive): received time, type, name, phone, email, event date, guests, ZIP, campaign, ad, then empty columns for the team: Called by, Called at, Status, Notes. Turn on Zapier's error emails to manager@thesurgeagency.com.

**Before the campaign is switched back on.** Location is the radius around 20021 Century Blvd, set to "people living in this location", checked on every ad set (it reset to the whole US once). Age 21+. Send one test lead end to end.
