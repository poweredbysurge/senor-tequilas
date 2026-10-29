# Toast Catering & Events leads: how the hosted form submits (captured 28 October)

Used by `api/_lib/toast.js`. See DESIGN-DEBT.md entry 148 and TASKS M27, M28.

Captured by submitting two test leads named "Website Test (Surge Agency)" through the
restaurant's hosted Toast lead forms. Both marketing opt-ins were sent false.

## Endpoint

`POST https://ws-api.toasttab.com/invoice-service/v1/public/leads`
- Only header sent: `Content-Type: application/json`. No auth, no captcha, no token.
- Response 200: `{"lead": {"leadGuid": ..., ...}}`. The browser then goes to
  `/invoice/portal?uid=<leadGuid>&token=...` (guest portal).

## Body

```json
{
  "firstName": "...", "lastName": "...",
  "phoneNumber": "2015550123", "phoneCountryCode": "1", "phoneCountryIsoCode": "US",
  "email": "...",
  "formValues": [{ "eventTypeFormFieldGuid": "<guid>", "value": "<string>" }],
  "attachments": [],
  "isEmailMarketingConsentGiven": false,
  "isSmsMarketingConsentGiven": false,
  "isDateFlexible": false,
  "restaurantGuid": "d94fa749-fbd5-4a66-90b6-d7755b8c3af3",
  "eventTypeGuid": "<order type guid>",
  "leadSource": "LEAD_FORM"
}
```
Date and time are top-level ISO instants, read from Toast's form code
(`LeadRoute` chunk, functions `ve`/`ye`): the chosen day at the chosen time (minutes after
midnight, 15-minute steps) in the restaurant's zone, `America/New_York`, converted to UTC with
`zonedTimeToUtc`. `date` and `time` are the same instant; with no time picked, `date` is
local midnight and `time` is left out. `endTime` works the same way from `endDate || date`.
The site builds them in `api/_lib/toast.js`, `zonedToUtc()`.

## Order types and fields

Field config: `GET https://ws-api.toasttab.com/invoice-service/v1/public/eventTypes/<ot>`
with header `Toast-Restaurant-External-ID: d94fa749-fbd5-4a66-90b6-d7755b8c3af3`.

**Catering** `513aa78d-e559-448f-90a7-a7f7ae64b129`, time required
- `bab8d8a0-2ca1-4bab-8522-c340e9d5c900` Guest count, required
- `57527fdb-a0a6-4beb-add6-7ece70d22dc1` Utensils, YES_NO, required
- `79c59808-ca32-4b50-80f0-ea6c7693312e` Would you like Delivery, YES_NO, required
- `29e709f9-613c-40c4-b9d5-4fb15456201a` Occasion, text

**Private Event** `f41da308-8f17-48ec-bf26-70ffb9b3d0e1`, time optional, end date allowed
- `c133b819-37aa-4fd9-86f0-4199187d6e25` Guest count, required
- `cc6fc471-863b-4f25-bf09-bdf086551e5d` Occasion, required
- `89585236-f37f-4dd9-9e1b-8ac467fcf4b3` Notes
- `98b967d5-e73d-468f-971f-2e118a9f6665` Do you require a private room?, YES_NO, required
- `a543a8ca-486a-4486-8a86-70859fc31ae5` Are you flexible with dates?, YES_NO, required

Field GUIDs change if the restaurant edits the forms in Toast. Read them from the config
endpoint at runtime, or alert when a submit fails.

Test leads to delete in Toast: catering lead 60e79c00-2794-4877-89e7-7b2cc2f2ba2e and
private event lead d0eee5e7-baed-4f7c-b733-52cac4f0f774.
