# Phase 2: decisions

Paste this into Claude Code.

---
---

Option (a), with one condition you must check first. Details below, then the other three calls.

## The nav

Take option (a): hide the desktop `<nav>` below 768 and let the hamburger carry mobile navigation.

The reasoning, so you can apply the same judgment if something similar comes up. The design gives us exactly two data points, 1440 with the desktop nav and 390 without it, and says nothing about anything in between. Your measurements say the overflow clears between 653 and 724 depending on how many links a page carries, so 768 is the first round number above every one of them, with 44px of headroom on the worst page. It is also already a real breakpoint in the stylesheet rather than one we invent, since `(max-width:767px)` and `(min-width:768px)` both exist. And it matches what the mobile artboards show. Three independent reasons landing on the same number is about as close to "the design implied this" as we are going to get.

Make the change additive and tightly scoped:

- One new labeled block, something like `/* port: mobile nav rule, see DESIGN-DEBT.md */`, inside `@media (max-width: 767px)` only.
- Hide the desktop `<nav>`. Change nothing else.
- **Do not touch the hamburger's visibility at any width.** You noted it is present at every width, which means it is visible at 1440 in the design too, and Gate A passed with it there. That is what the client approved, so it is a design decision to revisit later, not a bug for us to fix mid-port.
- Nothing above 767px changes at all.

Then verify three things and report before you regenerate anything:

1. No horizontal scroll at 360, 390, 430, 600 and 767.
2. **Re-render the 1440 references and confirm they are byte-identical to the current ones.** If a single one differs, the rule leaked above the breakpoint and you should stop.
3. Look at the header at 768 and at 1024 and tell me honestly whether it is cramped. Forty-four pixels of headroom on the busiest page is not much, and if it looks tight at 768 I would rather know now than after launch.

## The condition, and it may be a launch blocker

Before you write that rule: **confirm the hamburger actually opens something.**

The extracted pages are static. If the hamburger is a decorative glyph with no menu behind it, then hiding the desktop nav below 768 leaves mobile visitors with no navigation whatsoever, on a site where the client's own traffic is about 95 percent mobile. That would be a far worse bug than the one we are fixing.

So check whether there is a real menu panel in the markup and whether anything toggles it. Report what you find, in one of three shapes: it works and here is the mechanism, it exists in the markup but nothing drives it, or there is nothing there at all. If it is either of the last two, say so and stop again rather than proceeding, because building a mobile menu is new work that neither the design nor this port has accounted for, and I want to decide how we handle it before you start.

## Design debt, since we are fixing this in code

Fixing it here rather than upstream in Claude Design is the right call for speed, but it creates drift: the next export brings the bug back. So create `DESIGN-DEBT.md` at the repo root and log this one with the exact rule you wrote, the breakpoint, and why.

That file matters more than it sounds, because there will definitely be another export. The Taco Tuesday deal, the happy hour specials, the Pa' los Niños items and the remaining WordPress image sweep are all still open, and every one of them eventually comes back through Claude Design. When that happens, the fixes in this file get re-applied upstream instead of rediscovered.

## The harness bug

Good find, and the part I want to single out is that you re-ran Gate A after fixing it rather than assuming the earlier result still stood. Transparent padding reading as `(0,0,0)` and slipping under a 32-per-channel tolerance against near-black surfaces is exactly the kind of bug that makes a comparison harness worse than useless, because it fails silently in the direction of passing. A synthetic test scoring 0.00 percent where it should score 50 is the right way to have proven it.

Keep the shared `render.mjs`. One note on it for the record: sharing the renderer means a bug inside it is invisible to Phase 4, since both sides would be wrong identically. That is an acceptable trade here only because Gate A already validated the extracted pages against a genuinely independent source, the bundle itself. So the chain of trust runs bundle, then Gate A, then extracted pages, then Phase 4. Do not break that chain by ever regenerating the references from the built site.

## The 154MB

Drop it, and do it now while nothing is pushed.

Rewrite the unpushed commit so the PNGs never enter history rather than just removing them going forward, add `design/reference/` to `.gitignore`, and in its place commit a manifest listing every reference file with its SHA-256 and its pixel dimensions. That pins the contract at a few kilobytes instead of 154MB.

Two reasons beyond repo size. Vercel clones this repo on every deploy, and 154MB of PNGs plus 47MB of pages plus the 18MB export would make every build slower forever. And these particular references are about to be invalidated by the nav fix anyway, so this is the cheapest moment it will ever be.

If Phase 4 finds the references missing, it regenerates them from `design/pages/` and `render.mjs`, both of which are committed. The manifest is there so that a regeneration that produces different bytes is visible rather than silent.

## menu and private-parties

Not a blocker, but not noise either, and I want a sharper answer than the raw numbers give.

At 390 the responsive menu page is 21,519px tall against the 11,687px the design drew. That is roughly 55 phone screens instead of 30. For an eleven-section restaurant menu a long page is expected, but nearly double what was designed is worth understanding rather than waving through.

The thing that makes a long menu usable is the sticky category chip row the mobile design specified, so check that specifically: at 390, does the menu page have the category chips, are they sticky, and does tapping one jump to its section? Same question for the private-parties page and its room cards. If the chips are there and working, the height is fine and I will stop worrying about it. If they are missing or they scroll away, that is the real finding and it goes in `DESIGN-DEBT.md` for the next Claude Design pass, not into this port.

The five pages differing by 29 to 44px are noise. Ignore them.

## Phase 4's checks

Leave them exactly as written. Both of the ones you flagged, no horizontal scroll at 360 and 390, and Order Online visible without scrolling at 390x844, were correctly catching a real bug. A check that fails when something is broken is a check doing its job. Do not soften either one to accommodate the current state; fix the nav and they will pass.

## Order

Check the hamburger. If it works: write the rule, verify the three things, log the debt, drop the 154MB, regenerate 390 and 768, answer the chips question, then Phase 3. If it does not work, stop after the hamburger answer.
