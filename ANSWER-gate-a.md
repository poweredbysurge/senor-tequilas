# Gate A: decision and corrections

Paste this into Claude Code.

---
---

Gate A is accepted. Karaoke included. Commit and go to Phase 2.

## On karaoke

I verified your diagnosis independently against the bundle rather than taking it on trust. It holds exactly. The karaoke artboard contains one `<img>` with a natural size of 484x860 rendered at 720x600, which is a 1.49x upscale under `object-fit: cover`, plus seven elements carrying CSS background images, four of them 288x359 tiles at `background-size: cover` and two more compositing a repeating layer over a cover layer. That is the most resampling-sensitive content on the entire site, and it is the only page built that way. Your identification of the mechanism was precise.

Combined with what you already measured, that settles it. Zero of 161 elements differ in geometry by more than half a pixel. Mean RGB differs by 0.08 out of 255. The signed delta is zero-mean while the absolute delta is 8.4, which is the signature of identical content resampled differently and cannot be produced by an overlay, a shift, or a missing element. No offset improves the match. Hiding the neighbouring artboards changes nothing.

The decisive point, though, is one neither of us has said out loud yet: **this artifact exists only in Gate A.** Gate A is the one comparison in this project that renders one side inside the bundle's compositing context and the other side standalone. Phase 2 generates references from the extracted pages, and Phase 4 compares the built site against those references, so both sides of Phase 4 are standalone pages in the same context. The bundle drops out of the loop entirely. Accepting karaoke here therefore costs nothing downstream and takes nothing away from Phase 4's 0.5 percent.

So: do not loosen the tolerance, and do not keep digging. Record it instead. Write `design/gate-a/EXCEPTIONS.md` containing the karaoke row, the six things you ruled out, the 1.49x upscale and tile-count evidence above, and one line saying the exception is scoped to Gate A and does not apply to Phase 4. That way the decision is auditable later instead of being a number somebody softened.

## Your three corrections stand, and mine were wrong

You verified these properly and I did not, so take yours as canonical and update `CLAUDE.md` accordingly.

Fonts are embedded as data URIs across 57 `@font-face` blocks, with only two vestigial preconnect links pointing at Google. There is no network font dependency, which removes the FOUT and fallback risk I had been worrying about. It also means five families are in play, not three: Roboto, Barlow, Barlow Condensed, Archivo Black and Special Elite. Barlow and Barlow Condensed were never in my brief. Carry all five forward and do not let a later step drop the two I missed.

Fifty-one unique images is the right number. Mine counted `<img>` elements including reuse across pages; yours counts distinct content hashes, which is what actually ships.

Body background is `rgb(230, 227, 220)`, not the `#f0eee6` I quoted. Your labeled `#extraction-canvas-reset` block is the right way to handle it: one visible, named override rather than a silent edit.

## The two bugs

Both catches were the kind that would have quietly poisoned everything downstream, and the homepage one especially so. A 21/7 split that still looks healthy, with `home.html` silently overwritten by the mobile preview, would have shipped a phone-width homepage into production and every later gate would have compared it against itself and passed. Making width the classifier and throwing on slug collision is the correct fix.

That bug leaves a fact worth carrying into Phase 2: the homepage 390 artboard is the only mobile preview without `data-force-mobile`, so its mobile layout comes purely from the viewport media queries. That is exactly how it will behave in production. The other seven are forced. So in the Phase 2 cross-check, the homepage is your only true apples-to-apples comparison, and a difference on the other seven may be telling you about the force-mobile mechanism rather than about a responsive bug. Report the homepage separately from the other seven and say which is which, or the numbers will read as more alarming than they are.

## Housekeeping, all three approved

Add `design/gate-a/` to `.gitignore`. It is 143MB, it regenerates, and the evidence that matters is going into `EXCEPTIONS.md` anyway.

Commit `design/pages/`. It is a real build input and the verified source of truth for everything after this. The 1.21MB stylesheet being inlined 20 times is where most of the 47MB lives, and Phase 3 step 2 already collapses that into a single `site.css`, so leave it alone rather than re-running a passing gate to save disk.

Commit Phase 0 and Phase 1 now, before Phase 2 starts. My doc naming Phases 2, 4 and 5 was wrong. A passing gate is precisely the point at which to commit, so the scripts, `CLAUDE.md`, `design/pages/` and `EXCEPTIONS.md` should go in as one commit with a message that records the Gate A result and the karaoke exception.

Then start Phase 2.
