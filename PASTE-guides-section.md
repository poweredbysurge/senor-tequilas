# Build /guides and publish the birria ramen guide (holiday guide stays a draft)

Señor Tequila's needs a home for long-form articles. "Blog" feels wrong for a restaurant, so the section is **Guides**, at `/guides`. Build the section, publish **only the birria ramen guide**, link it into the site and push.

## Inputs (already in the repo)
`design/copy/guides/` holds two guides:

| File | Frontmatter | Status |
|---|---|---|
| `what-is-birria-ramen.md` | `draft: false` | **Approved. Publish it.** |
| `holiday-party-germantown-md.md` | `draft: true` | **Not approved yet. Do not publish.** |

Each file has YAML frontmatter (slug, url, title tag, meta description, byline, dates, section, draft), then the article in Markdown. **Use the copy verbatim**: don't reword, shorten or "improve" it. The internal links in the Markdown already point at the right paths.

**Draft handling.** Build the `draft` flag in properly, so publishing the holiday guide later is one change from `draft: true` to `false`. A draft guide must:
- not get a page or route in the build, so `/guides/holiday-party-germantown-md` returns 404;
- not appear on the `/guides` index, in the sitemap, or in any JSON-LD;
- not be linked from anywhere.

The birria guide's "Related:" line links to the holiday guide. Render Related cards **only for published guides**. Any link that points at a draft guide is dropped automatically, never output as a dead link.

The usual rules apply: CLAUDE.md, STANDARDS.md, no em or en dashes, no client framework, no CSS conversion, the five embedded fonts, real photos only (a missing photo stays a labeled placeholder), the site's no-trailing-slash URL style, and log the work in `DESIGN-DEBT.md`.

## 1. Structure
- Pages:
  - `/guides`: the index.
  - `/guides/what-is-birria-ramen`.
  - Later, when it's approved: `/guides/holiday-party-germantown-md`.
- Store the guides as content at build time. An Astro content collection (`src/content/guides/`, copied from `design/copy/guides/`) or Markdown pages are both fine. Pick whichever fits the repo best and explain why in DESIGN-DEBT. Adding a third guide later should mean dropping in one Markdown file.
- Use `Base.astro`, `Header5` and `Footer2` like every other page. Use the shared style constants in `src/lib/authored.js` where they fit.

## 2. The index page, `/guides`
- **Title tag:** "Guides | Señor Tequila's, Germantown, MD"
- **Meta description:** "Straight answers from the family behind Señor Tequila's in Germantown, MD: what birria ramen is, how to plan a party, and more."
- **H1:** "Señor Tequila's Guides"
- **Lead:** "Planning a party, ordering something new, or picking a tequila. Straight answers from the family that runs the kitchen."
- **Cards:** one per published guide, newest first. For now there's one card. The grid must still look intentional with a single card: a single wide feature card, not a lonely tile in a three-column grid. Each card has:
  - the photo;
  - a small section label ("Private Events" or "Menu");
  - the H1 as the title;
  - the meta description as the one-liner;
  - "Read the guide".

  The cards should match the site's existing card language: dark surface, 16px radius, gold hairline.
- **Close:** two buttons, "Book a Private Room" (`/private-parties`) and "See the Menu" (`/menu`).

## 3. The guide template
- **Breadcrumb:** Home › Guides › [title], small, above the H1.
- **Above the body, in order:**
  1. The section label as the eyebrow.
  2. The H1.
  3. The byline from frontmatter.
  4. "Updated" plus `date_modified`, formatted "October 30, 2026".
  5. An estimated reading time.
  6. The hero photo.
- **Body:**
  - Readable measure, about 68 characters, with comfortable line height on the dark field.
  - The Markdown's `##` become H2s.
  - Bold lead-ins stay bold.
  - Lists and the capacity table are styled to match the site. Tables scroll sideways on phones instead of breaking the layout.
  - The review quotes get a pull-quote treatment.
- **FAQ:**
  - The "FAQ" H2 section renders as the site's accordion: the bold questions become the triggers and the following paragraph becomes the answer.
  - The same list feeds the FAQPage schema.
  - The holiday party guide has 5 questions. The birria ramen guide has 6.
- **Related:** the "Related:" line becomes a small two-card row at the end.
- **A CTA band before the footer, chosen by section:**
  - Private Events: "Book a Tour" (`/holiday-parties`), plus the phone.
  - Menu: "Order Takeout" (`/takeout-delivery`) and "See the Menu" (`/menu`).
- **No sidebar, no share buttons, no comments, no author box beyond the byline.**

## 4. Photos (existing site images, alt text written from the photo)

| Guide | Spot | Image |
|---|---|---|
| Birria ramen guide (publish now) | Hero | `/images/dishes/birria-ramen.jpg` |
| | "Birria vs Birria Ramen vs Birria Tacos" | `/images/dishes/quesabirrias-hero.jpg` |
| | "Fifteen Recipes and the Trunk of a Car" | `/images/site/brothers.jpg` |
| | "What to Drink With It" | Whichever drink photos `/birria-ramen` already uses |
| Holiday party guide (later) | Hero | `/images/site/international-room-long-tables.webp` |
| | "Headcount to Room Size" | `/images/site/mexican-room.webp` |
| | "Company Holiday Party Ideas" | `/images/site/addon-mariachi-ensemble.jpg` |
| | "Why Groups Choose Señor Tequila's" | The holiday gift box photo already used on `/holiday-parties` |

Wire up the holiday guide's photos now, so it's ready the moment `draft` flips. It just doesn't build yet.

Add each guide's hero to the `LCP_IMAGE` map in `Base.astro`. Every image below the fold is lazy-loaded. Use `og:image` = the hero.

## 5. Schema (JSON-LD)
**Each guide:**
- `BlogPosting`:
  - `headline`: the H1.
  - `description`: the meta description.
  - `author`: `Organization` "Señor Tequila's", referencing the Restaurant `@id`.
  - `publisher`: the Restaurant node from `business.json`, same `@id`.
  - `datePublished` and `dateModified` from frontmatter.
  - `image`: the hero.
  - `mainEntityOfPage`: the URL.
  - `articleSection`: from frontmatter.
  - `inLanguage`: `en-US`.
- `WebPage` with `reviewedBy`: `Person` "Roberto H. Rivas", jobTitle "Co-owner", worksFor the Restaurant `@id`.
- `FAQPage`: verbatim from the visible FAQ.
- `BreadcrumbList`: Home › Guides › post.

**Holiday party guide:**
- `about`: the Restaurant `@id`.
- Do **not** mark prices or the capacity table as `Offer`. Offers belong to `/holiday-parties` and `/private-parties`.

**Birria ramen guide:**
- `about` and `mentions`: the existing `MenuItem` "Birria Ramen" by its `@id` from `/birria-ramen`. Don't redefine the item.
- No `Recipe` schema.

**Index:** `CollectionPage` with an `ItemList` of the guides.

## 6. Linking it into the site
- **Footer (`Footer2`) and mobile menu (`MobileMenu`):** add "Guides" → `/guides`. **Don't** add it to the desktop header.
- **Sitemap:** `/guides` and both guides, with `lastmod` from `date_modified`. Every canonical must match a `<loc>`.
- **Contextual links in** (one line each, in that page's link style):

| Page | Line to add | Where |
|---|---|---|
| `/holiday-parties` | "Planning one? Read our guide to [holiday party venues in Germantown](/guides/holiday-party-germantown-md)." | Near the booking steps or the FAQ |
| `/private-parties` | "Planning a company holiday party? Start with our [holiday party planning guide](/guides/holiday-party-germantown-md)." | Wherever the holiday banner sits |
| `/birria-ramen` | "New to it? Read [what birria ramen is and where it came from](/guides/what-is-birria-ramen)." | After the bowl or story section |
| `/birria-tacos` | "Same braise, different bowl: [what is birria ramen?](/guides/what-is-birria-ramen)" | Near the existing birria ramen card |

## 7. Checks, then commit and push
1. `npm run build` and `npm run check-build` pass with no new warnings.
2. **Copy coverage:** every paragraph, list item, table row and FAQ answer in both Markdown files appears in the built HTML. Print any misses.
3. Each page has one H1. Print the H2 outline per guide and confirm it matches the Markdown.
4. JSON-LD validates, the FAQPage counts are 5 and 6 and match the visible accordions, and the birria guide references the existing `MenuItem` `@id`.
5. No `—`, `–` or semicolons in the new pages' body copy (grep the build).
6. Grep `dist/` to show the inbound links to each guide and to `/guides`.
7. Mobile Lighthouse on both guides, 3 runs each: performance 90 or above, CLS under 0.05, LCP under 2.5 s.
8. Screenshots at 390 and 1440 of `/guides` and both guides, top to bottom, including the FAQ open and a table on a phone.

When the checks pass, commit and push, then report back with the check output, the screenshots and the commit hash. I'll submit the sitemap and request indexing for all three URLs.
