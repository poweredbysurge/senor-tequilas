# Señor Tequilas — SEO Migration Kit + 20-Page Build Spec
**The Surge Agency · Aug 28, 2026 · Internal build document**
Source: live Ahrefs crawl of senortequilas.com + live HTTP status verification (8/28). Page list reflects the approved v2 keyword swap **plus the 8/28 ICP correction: brunch is discontinued — `/brunch/` replaced by `/late-night/`.**

---

## Part 0 — What the crawl found

**The single most important fact: the homepage IS the website's equity.**

| | Homepage | Everything else combined |
|---|---|---|
| Organic traffic | 266 /mo | 7 /mo |
| Ranking keywords | 20 | 2 |
| Referring domains | 522 | ~24 |
| URL Rating | 5.4 | 0–5.5 |

Migration risk is therefore concentrated in one URL. **The homepage stays at `/` and its title/H1 keep the brand + "Mexican Restaurant in Germantown" targeting.** Everything else is comparatively safe to restructure.

### Three findings worth acting on

**1. Four dormant URLs still hold equity — we should reclaim them, not invent new slugs.**
These currently 301 somewhere generic, but they carry URL Rating and match pages we're building anyway:

| Dormant URL | UR | Reclaim as |
|---|---|---|
| `/menu/` | 5.3 | The new full HTML menu hub |
| `/la-dulceria/` | 5.3 | **Desserts & Dolcería page** — the Spanish slug is already on-brand |
| `/happy-hour/` | 5.2 | Happy Hour page |
| `/drinks/` | 5.0 | Redirect into the new Margaritas & Tequila Bar page |

That `/la-dulceria/` exists at all is a gift: the dessert page we're adding gets an aged URL with existing authority instead of starting from zero.

**2. Index bloat has already been cleaned up — no action needed, but don't re-create it.**
Ahrefs still lists ~100+ junk URLs (`/collections/products/S3677…`, `/shop/cart/cart`, `/shop/pg/1sancyoku`, `/jukyuban`, `/toyu/top/…`). I verified these live: **they all return proper 404s today.** Ahrefs' index is stale. No hack, no security issue. The only action is negative: **do not redirect these to anything** — let them keep 404-ing so they drop out of the index naturally.

**3. Real broken links to fix in the migration.**
`/full-menu/` returns 404 while `http://senortequilas.com/full-menu/` still 301s *to* it — a redirect chain that dead-ends. Also 404: `/piano-evening/`, `/tappas-night/`, `/cooking-lessons-with-our-chef/`, `/dedicated-attentive-staff/` (+ `-2`, `-3`), `/new-outdoor-area-2/`, `-3/`, `/hello-world/`.

---

## Part 1 — The 301 redirect map

### A. Live pages that KEEP their URL (no redirect — do not change these slugs)
`/` · `/our-story/` · `/catering/` · `/private-parties/` · `/contact/` · `/gift-cards/` · `/cinco-de-mayo/`

> Migration rule: a URL that works and has equity keeps its address. We change the *content*, not the location.

### B. Dormant/redirecting URLs to RECLAIM as live pages
| Old URL | New destination | Why |
|---|---|---|
| `/menu/` | `/menu/` (now a real page) | UR 5.3, obvious intent match |
| `/la-dulceria/` | `/la-dulceria/` (Desserts page) | UR 5.3, on-brand slug |
| `/happy-hour/` | `/happy-hour/` (Happy Hour page) | UR 5.2, exact intent |
| `/drinks/` | → `/margaritas/` | UR 5.0 folds into the drinks hub |
| `/entree/` | → `/menu/` | UR 5.0 |
| `/lunch/` | → `/menu/` | Lunch section anchor |
| `/full-menu/` | → `/menu/` | **Fixes the current dead-end 404** |

### C. Thin pages to consolidate (301, don't delete)
| Old URL | New destination |
|---|---|
| `/birthdays/` | → `/private-parties/quinceaneras-celebrations/` |
| `/chef/` | → `/our-story/` (chef story becomes a section — expand when the new chef starts) |
| `/nye/` | → `/private-parties/` |
| `/free-tacos/`, `/happy/`, `/dinner-test/` | → `/` (test/junk pages) |

### D. Broken URLs to redirect (currently 404)
`/piano-evening/`, `/tappas-night/` → `/private-parties/` · `/cooking-lessons-with-our-chef/` → `/our-story/` · `/dedicated-attentive-staff/` (+`-2`,`-3`), `/new-outdoor-area-2/`, `/new-outdoor-area-3/`, `/hello-world/` → `/`

### E. Leave alone — must keep returning 404
All `/collections/products/*`, all `/shop/*`, `/toyu/*`, `/contents/*`, `/jukyuban`, `/pw`, `/reserve/tool`, `/information/privacy_policy.html`

### F. Housekeeping
- `noindex` the WordPress cruft: `/author/robertohr/`, `/author/sen/`, all `/feed/` URLs, `/comments/feed/`
- Keep existing PDFs reachable (people have linked them) but make the HTML pages canonical; the May 2025 menu PDF has UR 5.3 — link to it from `/menu/` rather than orphaning it
- Enforce one canonical host: `www` and `http` variants → `https://senortequilas.com/` (already configured — verify post-launch)

---

## Part 2 — The 20-page build spec

Title tags ≤60 characters, meta descriptions ≤155. Every page gets Restaurant/Menu/Event schema as applicable and Toast order/reserve links.

### Rebuilt (5)

**1. `/` — Home**
- Title: `Señor Tequilas | Mexican Restaurant in Germantown, MD`
- H1: Authentic Mexican in Germantown, Maryland
- Targets: mexican restaurant germantown md (#2 today — protect), senor tequilas (#1), restaurants in germantown md
- Blocks: hero video (new bar lighting), day-aware event carousel, top-6 Toast dishes, private events teaser, reviews, hours/location

**2. `/menu/` — Full Menu** *(reclaims UR 5.3)*
- Title: `Menu | Señor Tequilas — Germantown, MD`
- H1: Our Menu
- Targets: senor tequilas menu, mexican food germantown md
- Blocks: full HTML menu by section (no PDF-only), handmade tortilla note, dish photos, links to each dish page

**3. `/catering/` — Catering**
- Title: `Mexican & Taco Catering in Germantown, MD | Señor Tequilas`
- H1: Taco Catering in Germantown
- Targets: taco catering near me (4,100/KD 0), mexican catering maryland
- Blocks: packages, minimums, radius, lead time, quote form → Doz

**4. `/private-parties/` — Private Events Hub**
- Title: `Private Party Rooms & Event Venue | Señor Tequilas`
- H1: Private Events in Germantown
- Targets: private party room near me, restaurant with private room near me (400/KD 0), banquet hall near me
- Blocks: 4 rooms + 2 patios, capacity to 100/room, buyouts to 400, **groups of 12+ welcome**, DJ booth + nightclub lighting, buffet/menu options, links to the two child pages

**5. `/our-story/` — Our Story**
- Title: `Our Story | Family-Owned Mexican Restaurant, Germantown`
- H1: From Mexico, With Love
- Targets: best restaurants in germantown md, brand terms
- Blocks: the brothers, Mexican-owned vs. the field, handmade tortillas, the incoming Michelin-trained chef, dolcería

### New (15)

| # | URL | Title tag | Primary target | Vol/KD |
|---|---|---|---|---|
| 6 | `/quesabirria-tacos/` | Quesabirria Tacos in Germantown, MD \| Señor Tequilas | quesabirria tacos | 26,000 / 4 |
| 7 | `/birria-tacos/` | Birria Tacos Near You in Germantown, MD | birria tacos near me | 48,000 / 24 |
| 8 | `/street-tacos/` | Street Tacos in Germantown, MD \| Señor Tequilas | street tacos near me | 22,000 / 22 |
| 9 | `/margaritas/` | Best Margaritas in Germantown, MD \| Big Mami 54oz | best margaritas near me | 3,200 / 28 |
| 10 | `/tequila-bar/` | Tequila Bar & Tastings \| Señor Tequilas Germantown | tequila tasting near me | 1,200 / 0 |
| 11 | `/happy-hour/` *(reclaim)* | Happy Hour in Germantown, MD \| M–F 11:30–5 | happy hour germantown md | 90 / 1 |
| 12 | `/late-night/` | Late Night Food & Drinks \| Open to 1 AM, Germantown | late night food near me | 12,000 / 1 |
| 13 | `/taco-tuesday/` | Taco Tuesday & Weekly Specials \| Germantown, MD | taco tuesday near me | 17,000 / 23 |
| 14 | `/karaoke/` | Karaoke Thursdays in Germantown, MD \| Señor Tequilas | karaoke bar near me | 9,000 / 0 |
| 15 | `/fajitas-molcajetes/` | Fajitas & Molcajetes \| Señor Tequilas Germantown | fajitas near me | 4,300 / 0 |
| 16 | `/la-dulceria/` *(reclaim)* | Mexican Desserts & Churros \| La Dulcería Germantown | churros near me | 27,000 / 0 |
| 17 | `/takeout-delivery/` | Mexican Food Delivery & Takeout \| Germantown, MD | mexican food delivery near me | 1,500 / 1 |
| 18 | `/private-parties/quinceaneras-celebrations/` | Quinceañera Venue in Germantown, MD \| Señor Tequilas | quinceañera venues near me | 1,500 / 2 |
| 19 | `/private-parties/weddings-receptions/` | Wedding Reception & Shower Venue \| Germantown, MD | wedding reception venue near me | 250 / 1 |
| 20 | `/mexican-restaurant-gaithersburg-md/` | Mexican Restaurant Near Gaithersburg, MD | mexican restaurant gaithersburg md | 90 / low |

### Secondary keyword assignments (no extra pages)
- `/happy-hour/` also targets happy hour near me + happy hour gaithersburg md *(late-night moved to its own page — see #12)*
- `/margaritas/` also targets **margarita monday near me** (250/KD 11, 2-for-1 Mondays) and margaritas near me
- `/private-parties/quinceaneras-celebrations/` also targets birthday party venue (500/KD 1) + graduation party venue (150/KD 0)
- `/private-parties/weddings-receptions/` also targets baby shower venue (900/KD 0), private dining room (150/KD 0), retirement party venue (150/KD 0)
- `/la-dulceria/` also targets flan near me (24,000) + tres leches near me (3,800)

### Internal linking rules
- Homepage links to all 4 hub pages (Menu, Private Events, Catering, Takeout) + the 3 dish pages with the biggest volume
- `/menu/` links to every dish page; every dish page links back to `/menu/` and to `/takeout-delivery/`
- Private events hub ↔ both child pages ↔ `/catering/`
- Every page: Toast order + reserve CTA, NAP in footer, link to `/contact/`

---

## Part 3 — Launch-day checklist

1. Publish all 301s from Part 1 **before** DNS/site cutover; test each with a redirect checker (expect single-hop 301, no chains)
2. Verify `/` still returns 200 and its title/H1 keep the Germantown targeting
3. Submit new XML sitemap in GSC; request indexing for the 20 pages
4. Confirm the junk URLs still 404 (do not let the new CMS auto-generate replacements)
5. Re-crawl 48h post-launch; compare ranking positions for the two money terms (`mexican restaurant germantown md` #2, `happy hour germantown md` #4)
6. Capture AFTER screenshots + metrics for the Drive Before & After folder
7. **Sept 29:** push the new 3 PM Mon–Fri hours to the site, GBP, Yelp, TripAdvisor and all citations together

## Open items for the team
- **Screaming Frog crawl** still needed for on-page depth (word counts, H-tags, internal link counts) — this Ahrefs inventory covers URLs and status codes but not on-page structure
- **GSC** must exist before launch so we can submit the sitemap and watch for coverage errors
- Confirm with Roberto whether any `/shop/*` or `/collections/*` URLs are tied to a live gift-card integration before we let them stay 404 *(they currently 404 and gift cards work through `/gift-cards/`, so this looks safe)*
