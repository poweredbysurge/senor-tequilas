# Answers to the Phase 1 questions

Paste this into Claude Code.

---
---

Good questions. I probed the rendered bundle directly and have evidence for all three, so you do not need the `--probe` round trip. Findings first, decisions after.

## Evidence

**There are zero CSS transforms in the entire document.** I walked every element and checked computed `transform`: not one is anything other than `none`. There is no canvas scale, no translate, no infinite plane. The board is plain flexbox in normal document flow.

**The full ancestor chain from `<body>` to a desktop page artboard is:**

```
body
  div#dc-root
    div.sc-host[data-sc-name="master-board.standalone"]   position:relative
      section[data-dc-tpl="9"]        padding: 0 44px 64px
        div[data-dc-tpl="10"]         display:flex; gap:96px
          div[data-dc-tpl="11"]       flex:0 0 auto; flex-direction:column; gap:56px
            div[data-dc-tpl="12"]     flex-direction:column; gap:8px
              div#frame-c1d           width:1440px; border:1px solid #d8d4c9;
                                      border-radius:8px; box-shadow:...
                div.sc-host[data-sc-name="Homepage Concept - Modern Dark v2"]   <- the page
```

The mobile equivalent ends in `div#frame-c1m` carrying `width:390px; height:844px; overflow:auto` plus the same border, radius and shadow.

**The stylesheet is 1,269,607 characters and references the chain only four times, all editor chrome:**

```
#dc-root, #dc-root > .sc-host { height: auto }      (inside @media print)
#dc-root > .sc-host { position: relative }
#dc-root, #dc-root > .sc-host { height: 100% }
.sc-host.sc-has-error { position: relative }
```

`.canvas` appears zero times. `[data-sc-name]` appears zero times in CSS. All three `#dc-root > .sc-host` rules match only the board's own outermost host, not the page hosts, which are nested deeper. I confirmed this against computed styles: the board host is `position:relative, height:1000px`, and the page hosts are `position:static` at their natural height.

**The selectors that do matter are inside the artboard**, not above it: `[data-c1p-root]` appears 48 times in the CSS and `[data-force-mobile]` 22 times, and both attributes sit on elements inside the `sc-host`, so they travel with its `outerHTML`.

**All 11 `<style>` elements are in `<head>`. Zero are inside an artboard.**

**There are exactly six `@media` rules:** `print`, `(max-width:389px)`, `(max-width:767px)`, `(min-width:768px)`, `(min-width:1024px)`, `(min-width:1440px)`. Real viewport queries at the right breakpoints, which confirms the container-query conversion landed.

## Decisions

**1. Drop the ancestor chain. Put the `sc-host` directly in `<body>`.**

Your instinct was sound but the evidence says the chain is not load-bearing, and keeping it would actively break the port. `div#frame-c1d` carries `width: 1440px` inline. Preserve that and every desktop page is pinned to a fixed 1440px with a rounded border and a drop shadow around it, and the media queries never fire because the content never narrows. The mobile frame is worse: `width:390px; height:844px; overflow:auto` would trap the page in a scrolling box. That frame is canvas chrome, not design.

So: `<body>` gets the `sc-host` element and nothing above it. Do not recreate `#dc-root`. Those three `#dc-root > .sc-host` rules then correctly match nothing, which is what we want, since the page hosts never received them anyway.

Two small things to handle when you do this. The stylesheet contains `html, body { background: #f0eee6 }`, which is the canvas beige, so set the body background from the page's own surface color instead. And `html, body { height: 100% }` should not survive onto the extracted page; the page needs its natural height.

**2. Nothing to neutralize, because there is no transform.** Question closed. The problem the question was guarding against is real, but it lives in the frame's inline width, and dropping the chain removes it.

**3. Yes, collect `<style>` from anywhere outside the artboard, and do not take styles that are inside one twice.** Your guard is correct. In this bundle it happens to be moot, since all 11 style tags are in `<head>` and none are inside a host, but keep the logic so a future export cannot bite us.

## Also

Yes to `npm init -y` and installing Playwright, Chromium, pixelmatch and pngjs. Yes to serving over localhost rather than `file://`; your reasoning about the null origin blocking `fetch('blob:...')` is right.

Skip `--probe`. Go straight to running the extraction, then Gate A. Gate A is the real test of all of this: if dropping the chain broke a selector, the extracted page will not match the bundle render and we will see it in the table.

One thing to include in the Gate A report: for each page, its rendered width and height in the extracted file versus in the bundle. A page that comes out 1440 wide in both is fine. A page that comes out 1442 or 390 wide has inherited frame chrome and the chain was not fully dropped.
