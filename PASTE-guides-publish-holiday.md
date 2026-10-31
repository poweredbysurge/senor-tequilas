# Publish the holiday party guide

Roberto approved the holiday party guide. Publish it using the draft switch you built.

1. In `design/copy/guides/holiday-party-germantown-md.md`:
   - Set `draft: false` and delete the comment after it.
   - Set `date_published` and `date_modified` to the actual publish date (today, 2026-10-29, if you push today).
   - Don't change any of the copy.
2. Uncomment the two `ADD WHEN HOLIDAY GUIDE PUBLISHES` links, one on `/holiday-parties` and one on `/private-parties`.
3. The birria guide's Related row should now show the holiday guide card automatically. Confirm it does.
4. The `/guides` index now has two cards. Confirm the layout fix from your draft preview (no lone half-width tile) is what renders.

## Checks
1. `npm run build` and `npm run check-build` pass.
2. **Copy coverage:** every paragraph, list item, table row and FAQ answer in the holiday Markdown appears in the built page. Print any misses.
3. **Schema:**
   - BlogPosting, WebPage with reviewedBy, BreadcrumbList and FAQPage all parse.
   - The FAQPage has 5 entries, matching the accordion word for word.
   - No `Offer` markup on the guide.
4. **Sitemap and listings:**
   - `/guides/holiday-party-germantown-md` is in the sitemap with today's `lastmod`.
   - Its canonical matches its `<loc>`.
   - It appears in the `/guides` ItemList.
5. **Inbound links:** grep `dist/` and list every page that links to the guide. Expect at least `/holiday-parties`, `/private-parties`, `/guides` and the birria guide.
6. **Copy rules:** no `—`, `–` or semicolons in the guide's body.
7. **Lighthouse:** mobile, on the holiday guide, 3 runs. Performance 90+, CLS under 0.05, LCP under 2.5 s.
8. **Screenshots:** at 390 and 1440 of the guide (FAQ open, capacity table on a phone) and of `/guides` with both cards.

Commit and push when the checks pass. Then report the commit hash and check output. I'll request indexing.
