# Standardization log

Every change made on this project that should not have to be made again on the next client
site. The goal is that a future Surge client build starts with these already in place,
rather than rediscovering them one bug at a time.

**How to use this file.** When a change is made here that is not specific to Señor Tequila's,
log it below. Ask one question: *would the next client site need this too?* If yes, it
belongs here, whether it is a config line, a build script, a content rule or a launch step.

Each entry records what we did, why, and what the reusable form is. The **Template** line is
the part that graduates into the starter kit.

Status: `candidate` (worth generalizing, not yet abstracted) / `promoted` (in the starter kit).

---

## Format

```
## N. Short title
**Date:** · **Origin:** DESIGN-DEBT entry or TASKS id · **Status:**

What changed and why.

**Template:** the reusable form.
```

---

## 1. Canonical and share URLs need a host switch before launch

**Date:** 2026-09-16 · **Origin:** DESIGN-DEBT 32, 55 · **Status:** candidate

The client's domain still served the old site during the whole build, so every absolute URL
built against it pointed at a host without these pages. Share cards previewed a 404 and the
canonical sent scrapers to the old site. Fixed with two constants at the top of the layout,
`LAUNCH` and `LIVE`, and a `rebase()` helper applied to canonical, `og:url`, `og:image`,
`twitter:image` and the JSON-LD `url`. Cutover is one line.

**Template:** every client site ships with a `LAUNCH`/`LIVE` pair in the base layout from day
one. Never let absolute URLs be written against a domain that is not yet serving the build.

## 2. Preview hosts must not be indexable

**Date:** 2026-09-18 · **Origin:** TASKS S5 · **Status:** candidate

`robots.txt` was generated with `Allow: /` unconditionally, so the Vercel review host served
an open robots.txt while its canonicals pointed at the production domain. Contradictory host
signals if it is ever crawled.

**Template:** generated `robots.txt` is host-aware. `Allow: /` only on the production
domain, `Disallow: /` everywhere else. Pairs with entry 1 and costs nothing to have from the
start.

## 3. The sitemap is generated from the filesystem, never hand-written

**Date:** 2026-09-16 · **Origin:** DESIGN-DEBT 55 · **Status:** candidate

A static `public/sitemap.xml` drifted out of date whenever a page was added or removed.
Replaced with `src/pages/sitemap.xml.js`, which enumerates `src/pages/**/*.astro` via
`import.meta.glob` and reads the domain from `business.json`. It cannot drift.

**Template:** sitemap and robots.txt are always build-time routes reading from one business
data file, never checked-in static files. Applies regardless of framework. The homesource
equivalent is a Python generator someone has to remember to run, which is the failure mode
this avoids.

## 4. Business facts live in one file

**Date:** ported · **Origin:** `src/data/business.json` · **Status:** candidate

Name, phone, address, hours, cuisine, price range, `sameAs` profiles, order and reserve URLs
all live in `business.json`. The layout builds `Restaurant`/`LocalBusiness` JSON-LD from it,
and the sitemap and robots.txt read `siteUrl` from it. Nothing is hardcoded in a page.

**Template:** one `business.json` per client, consumed by schema, sitemap, robots and any
NAP rendered in markup. A phone number change is one edit.

## 5. Redirect maps are authored during the build, wired at cutover

**Date:** ported · **Origin:** `deploy/redirects.json` · **Status:** candidate

The 301 map from the old site was written up front and parked in `deploy/redirects.json`
behind `doNotDeployYet: true`, rather than being improvised on launch day.

**Template:** every migration writes its redirect map early and parks it. Launch day wires
it, it does not author it. Decide trailing-slash convention once, then make redirects,
canonicals and sitemap agree. Getting this wrong across three syntaxes is a known failure on
a previous build.

## 6. Per-route LCP preload

**Date:** 2026-09-15 · **Origin:** DESIGN-DEBT 53 · **Status:** candidate

The base layout carries an `LCP_IMAGE` map from route to hero image and emits a preload hint
for it, after identifying the actual LCP element of every page rather than guessing.

**Template:** identify the LCP element per route and preload it. Include the map in the
starter layout so a new page is prompted to declare its hero.

## 7. Fonts self-hosted, never fetched

**Date:** 2026-09-15 · **Origin:** DESIGN-DEBT 49, 52 · **Status:** candidate

Five families embedded as `data:` URIs. No Google Fonts link, no FOUT, no third-party
dependency. A logo hotlink was also removed and self-hosted.

**Template:** no external font or asset requests in a client build. Audit for hotlinks
before launch.

## 8. Never pair a viewport-scaling gutter with a fixed one on the same box

**Date:** 2026-09-18 · **Origin:** DESIGN-DEBT 56 · **Status:** candidate

The homepage hero copy had `padding-left: max(gutter, (200% - 1180px)/2)` and
`padding-right: clamp(18px, 4.5vw, 48px)`. The left value tracks the viewport, the right one
tops out at 48px, so the block drifted off centre further the wider the screen got: 2.7:1 at
1440, 7.7:1 at 1920. It passed review because the design reference was 1440, where the
imbalance still reads as a deliberate indent.

**Template:** two checks, both cheap.

1. When a rule aligns one edge of a box to a page container, state explicitly what the
   opposite edge does. If the two sides use different units, one scaling and one capped, the
   box is not centred and will drift. Either both sides track the container or neither does.
2. Verify layout at 1440, 1744 and 1920, not at the design width alone. A ratio that looks
   intentional at the reference width can be visibly broken two sizes up.

Worth a small `node .gutters.mjs <url>` in the starter kit that prints left gap, right gap
and ratio for named blocks across those three widths. It found this in one run, and it is
the kind of defect that survives a screenshot diff because the reference is the same width
as the bug.

## 9. A half-width column's right edge is the page centre line

**Date:** 2026-09-18 · **Origin:** DESIGN-DEBT 56 · **Status:** candidate

Non-obvious geometry that decided the fix above. In a 50/50 split section, the left column's
right edge already sits on the centre of a centred page container. So the usable run from
the container's left gutter to that edge is exactly half the container width, and no padding
value can both hold the left edge on the gutter and balance the two sides. The constraint is
geometric, not stylistic.

**Template:** in a split hero, decide up front which one the copy obeys, the page grid or
its own column, because it cannot obey both. Full-bleed split bands generally survive
breaking the page grid, since they read as a different system from the contained sections
below. Record the choice so it is not re-litigated.

## 10. A status badge must read from the hours data, or not exist

**Date:** 2026-09-18 · **Origin:** DESIGN-DEBT 57 · **Status:** candidate

An "Open now, until 12am" badge shipped as hardcoded text on eight pages. It was wrong at
every hour before 3pm and its closing time was right on one day in seven. Nobody caught it
because it looks dynamic.

**Template:** any badge that asserts a live fact, open now, tonight, today's special, is
wired to data on the day it is designed, or it does not ship. Three rules that fall out of
getting this one right:

1. **Resolve in the business's timezone, never the visitor's.** Use `Intl.DateTimeFormat`
   with an explicit `timeZone` and `hourCycle: 'h23'`. Test from at least one zone on
   another continent. A viewer in Tokyo must see the restaurant's clock.
2. **Overnight closing times need both ends.** A shift whose close is not after its open
   runs past midnight, so check today's shift for the pre-midnight part and yesterday's for
   the spill into today. A close of exactly `00:00` must not spill into the next day.
3. **Colour has to track state.** If open is signalled by a green fill, the closed state
   cannot keep it. A green badge reading "closed" argues with itself.

**And the exception to graceful degradation:** this badge is hidden by default and revealed
by its script. Where no static string is true all week, degrading to stale markup means
degrading to a false claim. Showing nothing is the honest failure.

## 11. Give ported markup a semantic hook before styling it

**Date:** 2026-09-18 · **Origin:** DESIGN-DEBT 57 · **Status:** candidate

The same pill carried `data-dc-tpl` 46, 44, 289, 190 and 820 on the five pages it appears
on, because the numbers are per artboard and mean nothing across a site. A rule written
against them styles some pages and quietly misses others.

**Template:** when a ported component is about to be styled or scripted, first give it one
real class. Tool-generated ids identify a node in an export, not a component in a site.
Cheap to add, and it converts "did I catch every page?" from a question into a selector.

## 12. Fade a bleeding rail with a mask, not a gradient overlay

**Date:** 2026-09-18 · **Origin:** DESIGN-DEBT 58 · **Status:** candidate

A horizontally scrolling rail that bleeds off the viewport edge needs a fade, both to say
"there is more" and to stop it running wider than every contained section on the page. The
instinct is an absolutely positioned `div` with a `linear-gradient` to the background
colour. That breaks the moment the background is a texture, a photograph or a different
colour on another page, and it is one more element that can swallow a click.

**Template:** fade the rail with `mask-image` on the rail itself.

```css
--fade: clamp(56px, 7vw, 112px);
mask-image: linear-gradient(to right,
  #000 0,
  #000 calc(100% - var(--edge) - var(--fade)),
  transparent calc(100% - var(--edge)));
```

Background-agnostic, no extra node, no pointer-events trap. Include `-webkit-mask-image`.

**The part that is always forgotten:** give the rail `padding-right` equal to the hidden
zone. Without it the last card stops under the fade at full scroll and can never be read,
which trades a cosmetic problem for a functional one. Match `scroll-padding-right` so
snapping agrees. Verify by scrolling to the maximum and asserting the last card's right edge
clears the point where the fade completes.

And drop the inset fade below the width where the page container stops centring: there is no
spare width there, so the rail should stay edge to edge with a shorter fade.

## 13. When a fix scopes to "the pages that do X", enumerate and check the rest

**Date:** 2026-09-18 · **Origin:** DESIGN-DEBT 58 · **Status:** candidate

The rail fade was scoped to the four routes a previous entry had released to bleed. Rather
than trusting that list, every page with a scrolling rail was measured: two more existed on
another page, both already capped at the container, and two pages matched the rail attribute
but had nothing that actually scrolled.

**Template:** a scoped selector is a claim about the rest of the site. Verify it with a
script that walks every page and reports the property the scope is about, scrollable and
bleeding in this case, rather than reasoning from the selector that created the scope. The
same run catches pages that should have been in the list and pages that never needed it.

## 14. Check photo orientation on ingest, dimensions will not tell you

**Date:** 2026-09-18 · **Origin:** DESIGN-DEBT 59 · **Status:** candidate

A hero photograph shipped rotated 90 degrees and survived every review. The file was
2000x1500, landscape dimensions, with no EXIF orientation flag. Nothing about it was
detectably wrong: the room inside the frame was rotated, not the frame. It was live on a
homepage card and in the mobile menu.

**Template:** every supplied photograph gets looked at once, as an image, before it is
wired to anything. Neither aspect ratio nor an EXIF check catches a frame whose contents
are rotated. This is thirty seconds per asset on intake and invisible for months afterwards,
because a background image at `cover` on a dark card reads as texture until someone stops
on it.

Two habits that fall out of it: grep for every use of an image file before editing it, since
the fix or the fault is rarely on one page only; and crop to roughly the container's aspect
ratio rather than shipping a portrait frame for a landscape slot, where `cover` throws away
two thirds of the bytes. That crop was a 32% file saving here.

## 15. Measure text contrast over photographs, do not eyeball it

**Date:** 2026-09-18 · **Origin:** DESIGN-DEBT 59 · **Status:** candidate

Reviewing two photo cards by eye picked the wrong at-risk elements: the sub-lines looked
marginal and measured 14:1 and 16:1, while the eyebrows looked fine and one measured 3.63:1
against a 4.5 requirement.

**Template:** measure it. Render the page, hide the text nodes, screenshot, then compute the
mean relative luminance of the pixels inside each text node's bounding box and the contrast
ratio against its own computed colour. Report the mean and the worst patch separately: the
mean is the judgement, the worst patch tells you whether a specular highlight is sitting
behind a letterform. Roughly forty lines with Playwright and pngjs, and it runs on any page.

**And pick text colours over imagery by luminance headroom, not by brand.** The maximum
background luminance each colour can sit on and still clear 4.5:1:

| | luminance | max background |
|---|---|---|
| brand green `rgb(56,176,73)` | 0.324 | 0.033 |
| gold `rgb(214,188,133)` | 0.520 | 0.077 |
| cream `rgb(246,239,228)` | 0.869 | 0.154 |

A mid-luminance brand colour has a fraction of the headroom of a light neutral. Use it for
fills with dark ink on top, which is where it is strongest, and keep small text over
photographs light. Strengthening the scrim is the other lever, but it flattens the
photograph you paid for, so spend the colour first.

## 16. Sibling cards share an alignment edge, and for photo cards that edge is the bottom

**Date:** 2026-09-18 · **Origin:** DESIGN-DEBT 59 · **Status:** candidate

Two promo cards side by side had headlines of three lines and two, so their copy blocks
lined up on nothing. A further pixel came from one card having a `1px` border and the other
having none.

**Template:** sibling cards in a row must share an alignment edge, so that the length of one
card's copy cannot make the pair look broken. For cards with a photographic background,
**make that edge the bottom.** Bottom alignment shares the baseline, the last line of every
card sits on the same pixel, and it absorbs the difference in copy length upward into the
image where it costs nothing.

This entry originally said to align from the top. That was wrong, and it was corrected the
same day by a client note plus the contrast numbers:

| | top aligned | bottom aligned |
|---|---|---|
| eyebrow, worst of the two | 6.47:1 | 9.97:1 |
| headline, worst patch behind a letterform | 1.52:1 | 15.85:1 |

Two reasons it goes this way round. A photograph's subject is usually in its upper half,
so top-aligned copy sits on top of the thing the card is selling. And a photograph's lower
half is usually darker, tables, shadow, foreground, so bottom-aligned copy needs less scrim
to clear contrast, which means less of the image has to be destroyed to make the text
readable. Top alignment is for cards over flat colour, where neither applies.

Whichever edge is chosen, two things follow: the scrim points the same way as the copy,
strong under the text and near clear at the opposite edge; and siblings carry the same
border, radius and padding, or they are misaligned by the difference and frame differently.

## 17. Letterboxed source photography, find it with a content bounding box

**Date:** 2026-09-18 · **Origin:** DESIGN-DEBT 60 · **Status:** candidate

68 of 71 dish photographs on this site have black bars baked into the frame. Not EXIF, not
the container: the photograph is letterboxed inside its own JPEG, by anything from two
pixels to 48% of the frame. In a uniform grid the food then sits at a different height in
every card, which reads as broken cropping and as cards bouncing.

**Template:** audit every photo library on intake for baked-in bars, and detect them with a
**content bounding box**, never by walking in from the edge. Two detectors that look
reasonable and are not:

- *Mean brightness per line* flags dark photography as a bar.
- *Max brightness per line* stops at the first line containing one bright compression
  artifact, leaving most of the bar in place and looking like it worked.

What works: take the 99.5th percentile brightness of each row and column, keep only runs of
five or more consecutive lines above threshold, crop to the first and last such run. Noise
cannot end the scan early, and a genuinely dark photograph has qualifying runs throughout so
it is left alone.

**Re-encoding has its own trap.** Two wrong answers before the right one: a flat quality 88
added 29%, and budgeting bytes by the area kept pushed a third of the library down to
quality 60 to 70, because black bars cost almost no bytes, so the original's bytes were
nearly all spent on the photograph and scaling that budget by area starves what remains.
Reuse each file's own quantization tables and chroma subsampling, add `progressive=True`,
and verify with PSNR: same bytes per pixel, one generation of DCT rounding, 2% smaller
overall at a worst case of 37.7 dB. Anything above about 40 dB is visually lossless; check
rather than assume.

## 18. A card built as a `<button>` centres its own content

**Date:** 2026-09-18 · **Origin:** DESIGN-DEBT 60 · **Status:** candidate

Clickable cards in a stretched grid appeared to bounce in height. They did not: every card
and every image measured identically. Chrome vertically centres a `<button>`'s content when
the button is taller than its contents, so in a grid row stretched to the tallest card, each
shorter card pushed its whole stack, image included, down by half the leftover space. The
offsets tracked description length exactly.

**Template:** any card that is a `<button>` gets `display: flex; flex-direction: column`
so its content anchors to the top and the slack collects at the bottom. Worth doing by
default in a card component, because the symptom points at the wrong thing: it looks like
inconsistent heights or bad images, and the computed `display` reads `block`, so nothing in
devtools names the cause. Measure the child's offset from the card's top edge, not the card
heights, and the pattern shows up immediately.

The same fix needed two selectors here, because only the first tab panel existed in markup
and the rest were built at runtime without the id the rule targeted. See [[11]] and [[13]]:
a fix written against a tool-generated id styled one tab in four.

## 19. A default that paints over its own failure will not get reported

**Date:** 2026-09-18 · **Origin:** DESIGN-DEBT 62 · **Status:** candidate

An image swap helper defaulted to `object-fit: contain` and painted a dark background behind
the letterboxing, so that a placeholder swapped into a frame would read as a deliberate inset
rather than a broken image. Good reasoning. The problem is that the painted background made
the *wrong* case look deliberate too: a real photograph whose rule forgot to declare
`fit: 'cover'` sat letterboxed on a field almost exactly matching the section background, and
it shipped.

**Template:** when a helper has one behaviour for placeholders and another for real content,
do not let the placeholder behaviour be the silent default. Either require the caller to
declare which it is, so a missing declaration is an error rather than a guess, or pick the
default that fails visibly. A defensive default that also disguises the failure is worse than
no default: nobody reports it, because it looks intended.

Two smells worth checking for directly. A config entry where one rule has a property and a
sibling rule does not is usually an omission, not a decision, so diff the rules in a list
against each other. And where the same asset appears in several frames, the one whose aspect
ratio differs most from the asset's own is the only one that will show the fault; the others
will look fine and argue against you. Check the widest and narrowest frame, not a typical one.

## 20. Keep documentary and illustrative assets separable, and police the boundary

**Date:** 2026-09-18 · **Origin:** DESIGN-DEBT 63 · **Status:** candidate

This repo's image library holds two kinds of picture that look alike in a file listing: real
photographs of the client's own room, staff and food, and illustrative stock used to
decorate a list of add-on services. Filling an Instagram strip meant picking from both, and
three of the obvious candidates were stock.

**Template:** a context that asserts the images are the client's own, a social feed, a
gallery, a testimonial, a "see the room" strip, takes documentary assets only. Stock is fine
where it is understood as decoration and nowhere else, because the surrounding label is what
turns a picture into a claim. Two things make this enforceable rather than a matter of
memory: keep the two kinds in separate directories, or prefix the filenames, so the
distinction survives someone who was not there when they were sourced; and record the source
of each asset when it lands.

The same judgement applies to filling a labelled placeholder. A placeholder label is a
request for a specific photograph, not a slot to be closed. Substituting the nearest real
image is usually right, but the outstanding request does not go away and should stay on the
list, or the gap quietly becomes permanent.

## 21. Check the asset library before inventing a treatment

**Date:** 2026-09-18 · **Origin:** DESIGN-DEBT 64 · **Status:** candidate

Asked to put a footer on the brand green, the obvious reading is "set the background to the
brand colour". That colour turned out to be a light surface, every existing text colour
failed on it, and the result was a full palette inversion: every colour re-specified, the
primary button flipped, hierarchy rebuilt out of alpha because there was no second hue left.
It measured clean and it was a rebuild of a component to accommodate one instruction.

The site already held a green version of the textured field it uses elsewhere, laid under a
deep green tint on two existing pages. On that, nothing had to change but the background.

**Template:** when a request names a colour, look for an existing treatment in that colour
before building one. Textures, tints and section fields usually ship as a set, so if the red
one is in use, grep for its siblings by dimensions and by dominant hue rather than by
filename, which is how this one was found: same 1536x1024, hue 120 against hue 0. And when a
change starts cascading into a palette rewrite, stop and re-read the request. Cascade is the
signal that the chosen interpretation is wrong, not that the work is hard.

## 22. Measuring contrast by screenshot has two traps that both read as false failures

**Date:** 2026-09-18 · **Origin:** DESIGN-DEBT 64 · **Status:** candidate

Refines [[15]], which is right that contrast over imagery must be measured. Two ways the
measurement lies, both of which produced confident, wrong failures here.

**Coordinates drift.** Addressing elements by `getBoundingClientRect()` and capturing the
viewport means any scroll between the measure and the capture silently offsets every sample.
It reported a button at 1.37:1 that was plainly correct on screen. Take a full-page
screenshot and address elements in absolute document coordinates, `rect.x + window.scrollX`,
so no scroll state can matter.

**Hiding the text hides the surface.** `visibility: hidden` on an element removes its own
background too, so a filled button's fill disappears and the panel behind it is measured
instead. Set `color: transparent` so only the glyphs go and every background layer stays.

Sanity check the run against a rendered screenshot before acting on it. Both of these
failures were obvious the moment the footer was actually looked at.

## 23. Inline styles silently kill every interaction state you write

**Date:** 2026-09-18 · **Origin:** DESIGN-DEBT 65 · **Status:** candidate

A design-tool export puts colour in inline `style` attributes. An inline declaration beats
any stylesheet rule that is not `!important`, so `a:hover { color: … }` in the site's own CSS
matched its elements on every page and never once took effect. The site looked like it had
simply never been given hover states. It had been given one, and it had been losing silently
since the port.

**Template:** on any project built from an exported or inline-styled codebase, prove an
interaction rule actually wins before writing a set of them. Hover one element, read the
computed style back, and confirm the value changed. A rule that matches is not a rule that
applies. Where inline styles are the house pattern, interaction states need `!important` as
a matter of course, and that should be stated once in the stylesheet rather than rediscovered.

**And check what a dead rule would have done had it lived.** The one here would have turned
a dark-ink label brand green on a brand green button. A hover rule written against a whole
element type, `a` or `button`, will eventually land on a filled variant where the hover
colour matches the fill. Scope interaction states to roles, never to bare tags.

## 24. Tool-generated utility classes are usually a role map worth keeping

**Date:** 2026-09-18 · **Origin:** DESIGN-DEBT 65 · **Status:** candidate

This export carried `scp0` through `scp9` on 238 elements, meaningless names that look like
noise and were nearly deleted as such during the port. Grouping every element by class and
printing its tag, background and border showed they are perfectly consistent across all 22
pages: primary button, outlined secondary, tertiary link, text link, chip, card surface.

That made a site-wide hover pass about 209 elements of CSS and zero lines of markup.

**Template:** before stripping or rewriting a tool's utility classes, audit them. Group by
class, print the distinguishing computed properties, and see whether the classes are already
a design system someone else derived. When they are, keep them and hook behaviour to them.
When they are not, that audit is still the fastest way to find the roles that should exist,
and adding one real class per role, as in [[11]], is then cheap and deliberate.

## 25. Scroll reveals have three non-negotiables

**Date:** 2026-09-18 · **Origin:** DESIGN-DEBT 66 · **Status:** candidate

Reveal-on-scroll is asked for on most marketing sites and is usually shipped in a way that
costs real money on Core Web Vitals. Three rules make it safe, and all three are easy to
verify rather than assume.

1. **Never animate above the fold.** An element at `opacity: 0` cannot be the largest
   contentful paint until it fades in, so a hero that fades in moves LCP by the length of
   the animation. Tag only elements whose top starts below the first viewport, and assert
   it: walk every tagged element and fail if any sits in the initial viewport.
2. **Apply the hidden state from JavaScript, never from the stylesheet.** If the CSS hides
   things, a page with no JavaScript, a failed bundle or an unsupported browser is a blank
   page. Test with JavaScript disabled and assert nothing is at `opacity: 0`.
3. **Opacity and transform only, and a named transition list.** Both are composited, neither
   triggers layout. `transition: all` will eventually animate a layout property by accident.

Two more that come from the markup rather than the technique. An element with an inline
`opacity` cannot be faded, because inline wins, so skip it deliberately instead of letting
it silently not animate. And a transform makes an element a containing block for its
absolutely positioned descendants, so a card holding an `inset: 0` scrim should fade without
transform. Finish by scrolling the whole page and asserting nothing is left invisible.

## 26. One measurement of a noisy metric is not a baseline

**Date:** 2026-09-18 · **Origin:** DESIGN-DEBT 66 · **Status:** candidate

A Lighthouse run said the score fell from 91 to 83 when scroll reveals went in, with FCP,
LCP, TBT and SI identical and CLS moving 0.003 to 0.144. Everything about that pointed one
way, and it was wrong. The 0.003 was a single run of the before condition that happened to
be clean. Run properly, the before condition gives 0.132, with the same culprit element and
the same cause. The shift was an intermittent font swap in the hero that predated the work.

**Template:** for any metric that varies run to run, and CLS and LCP both do, sample the
before condition at least three times before attributing a regression, and keep the ability
to flip the change off and re-measure. A one-line early return in the feature's own script
is enough and is worth building in.

**And always get the attribution, not just the number.** Lighthouse's `layout-shifts` audit
names the shifting node and the cause, and it said "Web font loaded" on an element that was
explicitly excluded from the change. That single line settled in one run what three rounds
of reasoning about transforms and containing blocks had not. Ask the tool what moved before
theorising about what might have.

---

## Not yet logged

Changes made from 2026-09-18 onward get appended here as they happen.
