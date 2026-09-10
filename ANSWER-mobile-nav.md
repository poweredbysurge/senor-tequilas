# The mobile menu decision

Paste this into Claude Code.

---
---

Option 1, and thank you for stopping. Hiding the desktop nav on top of a dead button would have shipped a site with no navigation to 95 percent of its visitors, and the only reason it did not happen is that you checked the thing I asked you to check instead of assuming it worked.

Before the decision, one question that may be bigger than this one.

## First: check the desktop nav's hrefs

The homepage panel's six internal links are all in-page anchors. That tells me the header was authored against a one-page composition. So I need to know whether the **desktop** nav has the same problem.

Across all 20 extracted pages, list every `href` in the header's desktop `<nav>` and in the Reserve and Order controls. Then tell me plainly: do those links point at real page paths like `/menu` and `/private-parties`, or are they in-page anchors like `#menu`?

If they are anchors, this is not a mobile bug at all. It means the site has no working navigation between pages at any viewport width, and that is a much larger finding than the one we are solving. Report it and stop again if so.

Everything below assumes the desktop nav uses real paths. If it does not, we will deal with that first.

## The decision: option 1

Lift the design's own panel out of the bundle and drive it in the port. Your recommendation is right and the reasoning holds. Option 2 strands mobile users at the bottom of a 21,500px menu page whenever they want to go anywhere, which is not navigation. Option 3 ships a horizontal scroll on every page on every phone, which is both a Google mobile usability problem and something that simply reads as broken.

Three specifics.

### Use the design's markup, not an invention

Lift the 7,988 characters as you described, keep the `scp1/scp2/scp3` classes since they are already in the stylesheet, and keep the eyebrow-and-label pattern the design drew, the "Eat / Menu", "Mon to Fri / Happy Hour", "Since 2015 / Our Story" structure. That detail is real design work and it should survive.

Make it one shared component included on all 20 pages, identical everywhere. A mobile menu that changes between pages is worse than one that is slightly imperfect.

### Use a button and a little JavaScript, not a checkbox

The design drew a `<button>` with `aria-label="Close menu"`, so a button is what was designed and a button is what has the right semantics. The checkbox-and-`:checked` trick would work visually but it lies to screen readers, and it makes closing the panel when a link is tapped awkward.

Write roughly fifteen lines of vanilla JavaScript instead: toggle `aria-expanded` on the button, toggle a class on the panel, close on Escape, close when a link inside it is activated, and move focus into the panel when it opens and back to the button when it closes. Visual state stays in CSS.

That is not a client framework and it does not violate the rules in `CLAUDE.md`. If it helps, treat the no-framework rule as being about React, Vue and their build chains, not about a nav toggle.

### The anchor problem, resolved link by link

You were right to hold on this. Here is the mapping. Keep all eight items, keep the design's labels, and change only where each one points:

| Panel item | Points at now | Change to | Why |
|---|---|---|---|
| Eat / Menu | `#menu` | `/menu` | A real page exists and beats a homepage teaser |
| Thursday / Tonight | `#tonight` | `/taco-tuesday` | That page owns the seven-night calendar |
| Mon to Fri / Happy Hour | `#happy` | `/happy-hour` | Real page |
| 12 to 400 / Private Events | `#events` | `/private-parties` | Real page |
| Since 2015 / Our Story | `#story` | `/our-story` | Real page |
| Regalo / Gift Cards | `#gift` | `/#gift` | No gift card page exists; root-relative still works from any page |
| Order Online | Toast | unchanged | Already correct |
| Reserve a Table | Toast | unchanged | Already correct |

Two notes on that table. `/#gift` is the one link that stays an anchor, because there is genuinely no gift card page in the twenty; making it root-relative means it navigates to the homepage and scrolls, which works from anywhere instead of only from home. And the Tonight mapping is the one judgment call I am least certain about, because the eyebrow says "Thursday" while the destination I am sending it to is the weekly specials page. Point it at `/taco-tuesday` for now, flag it in `DESIGN-DEBT.md`, and I will settle the label with the client.

Do not add links that are not in the design's panel. Catering and Takeout are both money pages and I can see the argument for including them, but adding to a mobile menu is an information architecture decision and it belongs in a deliberate pass with the client, not smuggled in during a port.

## Then the rest of the queue

Once the menu works, resume where you stopped: write the `max-width: 767px` nav rule, run the three verifications including the byte-identical 1440 check, regenerate the 390 and 768 references, answer the sticky category chips question for menu and private-parties, and then Phase 3.

Add one verification to that list now that the panel exists: with the panel open at 390, confirm the page still does not scroll sideways, and confirm the panel closes and returns focus correctly.

## Design debt

This is the largest entry in `DESIGN-DEBT.md` so far, so write it properly. The design's mobile navigation depends on a React runtime that cannot survive a static export, on the homepage only, and the other nineteen pages were drawn with a decorative button. The port implements the panel, the toggle and the link mapping. Record the eight links and their new destinations so a future export does not silently revert them, and note that the next Claude Design pass should either express this statically or accept that navigation now lives in code.

## On the 154MB

Cleanly done, and the parts I would have had to ask for you did unprompted: expiring the reflog and running `gc --prune=now` rather than assuming a rewrite alone drops the blobs, verifying zero PNG entries remain in history, keeping the files on disk, and adding `--manifest` so the manifest can be rebuilt without a full re-render. Twenty-four megabytes packed is a repo Vercel will be happy with for years.
