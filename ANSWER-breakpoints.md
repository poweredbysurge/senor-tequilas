# The two overflows

Paste this into Claude Code.

---
---

Both resolved. One of my answers differs from your suggestion and the other authorizes a change I have been refusing until now.

## Finding A: use 899, not 779

Your fix works, but it optimises for the wrong thing. The goal is not "no overflow", it is "the header looks right", and verification 3 already proved those are different states.

You measured 202px of slack at 1024 and a cramped, wrapping, clipped header at 768. Between them the header does not snap from bad to good; it eases. At 780, which is by definition the first width where the events pages stop overflowing, the slack is approximately zero. So `max-width: 779px` would ship, on every iPad in portrait, exactly the barely-fitting header that verification 3 told us looks wrong. We would have traded a horizontal scrollbar for a header that just about survives, and called it fixed.

The tablet band makes it worse. Real portrait widths cluster at 768, 810, 820 and 834. A breakpoint at 779 puts four common devices into the 30-to-55px-of-slack zone, and any future change, one more nav item, a longer label, a translated word, breaks it again with no warning.

So: **hide the desktop nav below 900.** At 900 there is roughly 100px of slack, which reads as designed rather than crammed, and it leaves room for the site to change without re-breaking. Every portrait tablet gets the hamburger, which is ordinary behaviour that no user finds surprising, and which is now backed by a real working menu rather than a dead glyph.

I am deliberately not going to 1023. You were right that hiding the nav on iPad landscape is a much larger behavioural change than this bug warrants, and 1024 is a desktop-like context where people expect a full nav.

One check before you commit to it. Render the header at 900, 1024 and 1280 and tell me whether 900 genuinely looks composed or merely non-overflowing. If it still reads as cramped, say so and we will go to 1023 after all; I would rather move the number once more than ship a header that looks squeezed on a third of tablets.

Note that this makes the 768 references show the mobile header. That is correct and intended, so nobody should be surprised when the 768 captures stop resembling the 1440 ones.

## Finding B: fix it, and here is the authorization you were waiting for

You were right not to invent a layout, and right that this is a design decision. I am making it.

Accepting 360 is not available. It is a very common Android width, this client's traffic is roughly 95 percent mobile, Germantown is not a market where everyone is on a recent iPhone, and a horizontal scrollbar on the homepage is the first thing a visitor would see. Phase 4's check stays as written and the site meets it.

But the fix must be the smallest one that exists, and it is not a reflow. Your arithmetic gives 147 plus 203 plus 28.8, about 379 in a 360 viewport, so roughly 19px to find. Two values get you there:

- Reduce the header's horizontal padding below 390. Going from 28.8 to about 14 recovers roughly 15px.
- Reduce the logo width below 390 by the small remainder needed, no more than about 10px.

Add those as a `max-width: 389px` block in the same overlay stylesheet, labelled the same way. Change nothing else: no wrapping, no stacking, no restructuring of the header row, no touching anything at 390 and above.

I am authorizing this because it is not a redesign, it is a proportional scale of two numbers at a width the design never covered. It is what a `clamp()` on the logo would have done if the design had used one. Restructuring the header row would be a redesign and I am not authorizing that.

Verify at 320, 360, 375 and 390. I expect 360 and up to be clean. If 320 still overflows, report it and leave it; iPhone SE first generation is rare enough that I will accept it rather than push the logo smaller than the brand can carry.

Log both entries in `DESIGN-DEBT.md`, and make the sub-390 one explicit that the design was never drawn below 390 and that the next design pass should specify a small-phone header rather than leave the port to infer one.

## On the correction

Noted, and thank you for volunteering it rather than letting the 780 discovery quietly replace the 768 claim. Two pages sampled out of twenty, then generalised to all of them, is the sort of shortcut that usually surfaces much later and much more expensively.

For what it is worth, I repeated your 44px figure back to you in writing without questioning how it had been derived, so the error propagated through me as much as from you. The lesson is a shared one: when a number is going to become a breakpoint that every page depends on, it gets measured on every page.

## On the panel images

Good catch, and one that would have been genuinely embarrassing. Six black cards in the mobile menu on a site whose whole argument is its photography, discovered by the client rather than by us. That those blobs lived on the bundle's own ephemeral origin, `127.0.0.1:57513`, is exactly the class of bug that works perfectly in every test you run in the session that created it and fails everywhere else. Finding that all six were byte-identical to images already on the pages is a nice confirmation that the content hashing is doing its job.

## Then continue

Set the breakpoint at 899, run the 900 check, add the sub-390 rule, verify the four widths, regenerate the 390 and 768 references, answer the sticky chips question, then Phase 3.

Stop only if 900 looks cramped, or if the chips answer turns out to be worse than expected.
