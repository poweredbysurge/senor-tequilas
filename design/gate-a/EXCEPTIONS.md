# Gate A exceptions

One page was accepted over the 0.5% tolerance. This file records why, so the decision is
auditable rather than a number somebody quietly softened.

## karaoke, 0.631% against a 0.5% tolerance

| | |
|---|---|
| Page | `/karaoke` |
| Bundle render | 1440x2368 |
| Extracted render | 1440x2368 |
| Dimensions | identical |
| Differing pixels | 21,528 of 3,409,920 (0.631%), after a 2px anti-aliasing allowance |
| Determinism | identical to the pixel on every run |
| Accepted | Gate A only |

### Why the pixels differ

The karaoke artboard is the most resampling-sensitive content on the site, and the only page
built this way:

- One `<img>` with a natural size of 484x860 rendered at 720x600. That is a **1.49x upscale**
  under `object-fit: cover`.
- Seven elements carrying CSS background images. Four are 288x359 tiles at
  `background-size: cover`. Two more composite a repeating layer over a cover layer.

Chromium filters scaled and cover-cropped raster content differently inside the bundle's
compositing context than it does in a standalone page. Same bytes, same geometry, different
resampling.

### What was ruled out

Six independent checks, all negative:

1. **Geometry.** All 161 elements in the artboard measured in both renders. Zero differ by
   more than 0.51px in position or size.
2. **Colour.** Mean RGB over the failing band: bundle `95.43 / 77.88 / 64.91`, extract
   `95.34 / 77.81 / 64.82`.
3. **Signature.** Signed delta `-0.08` with absolute delta `8.4` out of 255. Zero-mean noise
   is identical content resampled differently. An overlay, a shift or a missing element all
   produce a non-zero signed delta.
4. **Alignment.** Mean absolute difference is minimised at dx0/dy0. Every offset from -2 to
   +2 in both axes is worse, so it is not a sub-pixel shift.
5. **Compositing layer size.** Every neighbouring artboard was hidden to shrink the bundle's
   layer. Result unchanged, 1.432% raw either way.
6. **A wider allowance.** A resampling-aware allowance (3x3 neighbourhood mean, tolerance 10)
   moves it 0.589% to 0.555% and changes no other page's verdict. It was not adopted.

### Scope

**This exception is scoped to Gate A and does not apply to Phase 4.**

Gate A is the only comparison in this project that renders one side inside the bundle's
compositing context and the other side standalone. Phase 2 generates the reference set from
the extracted pages, and Phase 4 compares the built site against that reference set, so both
sides of Phase 4 are standalone pages rendered in the same context. The bundle drops out of
the loop entirely. The artifact recorded here cannot occur there.

Phase 4 keeps the full 0.5% tolerance, karaoke included.

## Everything else

The other 19 pages passed on their own merits, from 0.013% to 0.404%. All 20 pages are
dimensionally identical to the bundle at 1440 width, to the pixel.
