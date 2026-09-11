# PASTE THIS INTO CLAUDE CODE

Build `/contact`, the twenty-first page. It is the one the SEO migration kit assumes exists and never did, which is why `design/brief/seo-migration-kit-and-page-spec.md` has a linking rule pointing at a page that returns nothing.

Match the existing pages exactly: same tokens, same type scale, same section rhythm, same components. Use the shared header, footer, proof strip and visit block that already exist in `src/components/`. This is a new page in an established system, not a new design.

---
---

## Read this first: the hours on this site are not the hours today

Before you build anything, check what `src/` and the JSON-LD currently say about opening times.

The site was built on the post-September-29 schedule: 3 PM weekday opening. Roberto confirmed the new hours begin **Monday, September 28**. Today is September 11. If this site goes live before the 28th, every page and every structured-data block advertises hours the restaurant is not keeping, which sends customers to a closed door and puts the schema out of step with their Google Business Profile.

Do not change the hours. Report what you find: which files carry opening times, which carry them in JSON-LD, and how many places would need editing if we launch before the 28th. Add it to `DESIGN-DEBT.md` as a launch-timing item. Then build the page using the same post-28th hours as everything else, so the site stays internally consistent.

## The page

### Confirmed facts, all of them verified with the client. Nothing here is a guess.

```
Señor Tequila's
20021 Century Blvd, Germantown, MD 20874
301-569-4574
Right next to Topgolf. Free parking.

Hours, from September 28:
  Monday to Wednesday   3 PM to 10 PM
  Thursday              3 PM to midnight
  Friday                3 PM to 1 AM
  Saturday              11 AM to 1 AM
  Sunday                11 AM to 10 PM

Happy hour: Monday to Friday, 3 to 6, in the bar area
Last call for drinks: 15 minutes before closing
Kitchen: anyone seated before closing time can order
Bar area is 21 and over after 9 PM on Friday and Saturday
```

### Structure

**Hero.** Eyebrow `GERMANTOWN, MD · NEXT TO TOPGOLF`. H1 **Find Us**. Deck: one line with the address and the free parking. Primary CTA Get Directions, secondary Call.

**The essentials, high on the page.** Address as a link to the Google Maps listing, phone as a large `tel:3015694574` control sized for a thumb, and the parking line. This is what most people came for and it should be readable without scrolling on a phone.

**Hours.** The full table with today's row highlighted, driven by the visitor's own date rather than hard-coded. Underneath, three lines in smaller type: the happy hour window, last call and the kitchen rule, and the 21-and-over policy. Those three are the questions people actually phone to ask, so answering them here quietly removes calls.

**What do you need?** Four routing cards, because this business has four different front doors and a single form serves none of them well:

| Card | Line | Goes to |
|---|---|---|
| A table | Book one in a few seconds. | Toast reservations |
| Food to go | Pickup or delivery through Toast. | Toast ordering |
| A private party | Four rooms, from 12 to 400 people. | `/private-parties` |
| Catering | We travel about 20 miles. | `/catering` |

**Getting here.** A map, lazy-loaded, with a Get Directions button over or beside it. Then a short paragraph of genuinely useful local detail: next to Topgolf, free parking, about ten minutes from Gaithersburg, and that Germantown, Gaithersburg and Montgomery Village are all a short drive. That last part is real local SEO content rather than filler, and it comes from Roberto.

**Follow us.** Instagram, Facebook, Google and Yelp, using the exact URLs already in the footer. Do not look any of them up; the footer ones are correct and verified.

**Proof strip.** The stars and the review count. This page should carry it.

### Three things to leave off, deliberately

**No email address.** Roberto told us plainly that `info@senortequilas.com` is not in use and that Tomas works from his own address. A published email nobody reads is worse than no email at all, because it silently swallows enquiries. `events@` does not exist either.

**No generic contact form.** There is nowhere for it to go. The events form works because it populates into Toast where Tomas picks leads up. A "send us a message" box would post into nothing. The four routing cards cover every real intent, and the phone covers the rest.

**No delivery platform links.** DoorDash, Uber Eats and Grubhub are still unresolved, and there are three separate Uber Eats listings for this restaurant. Ordering routes through Toast until the client tells us which storefronts are live.

If you think any of those three is wrong, say so before building rather than adding them.

### SEO

Title tag `Contact & Directions | Señor Tequila's, Germantown, MD`. Meta description covering address, phone and hours.

This page gets the most complete `Restaurant` and `LocalBusiness` JSON-LD on the site: full NAP, all five opening-hours rules, geo coordinates if you can derive them from the address, the Toast order and reserve actions, `hasMap`, and `sameAs` for the four social profiles. Every other page carries a subset; this one is the canonical record.

Add `/contact` to `sitemap.xml`, which becomes 21 URLs.

Then activate the migration kit's linking rule: every page links to `/contact`. Put it in the footer's Explore column rather than the header. The header nav stays at five items; we just spent real effort getting it to fit at 960 and adding a sixth would undo that.

### Then

Build, confirm zero console errors, and check it at 390, 768 and 1440 with a keyboard as well as a mouse.

Generate a reference for the new page at all three widths and add it to the manifest. The footer link touches all 20 existing pages, so re-baseline those too and tell me if anything moved beyond the footer, because nothing should have.
