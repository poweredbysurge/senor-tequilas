# Post-launch corrections: Sam's list

Everything from the client's change doc that Claude Code can't do on its own. The automatic pass is
in `PASTE-post-launch-corrections.md`. When the assets below come in, drop them in a folder and hand
Claude Code one short prompt to place them.

## 1. Decisions and info (do these first, they unblock the most)

- [ ] **Catering form recipients.** Get the management email list from the client. Note: none of the
      inquiry forms (catering, private parties, quinceañeras, weddings) send anywhere today. Pick how
      they send (Vercel function + Resend, or a form service like Formspree), then Claude Code wires
      all four at once with a `generate_lead` event.
- [ ] **Palm-tree favicon.** Get the original file from the client or the old WordPress install. The
      site has no favicon at all right now. Ideally a 512px PNG or SVG.
- [ ] **Sunday game day specials.** Confirm with the client that "Game day specials every Sunday"
      is still true now that Sunday Happy Hour is gone.
- [ ] **Sunday flyer on the homepage.** If Happy Hour was all it said, decide what Sunday promotes
      instead (game day, brunch hours, or drop the card).
- [ ] **Our Story copy.** Confirm the fixed line "as the Post-Crescent showcased in 2005" (client's
      draft read "as features by the Post-Crescent showcased in 2005").
- [ ] **Birria description.** Client copy is used as written. Optional: ask if they want it
      smoothed ("respectively" and the run-on sentence read awkwardly).
- [ ] **Gaithersburg page.** A quote shows "[Reviewer pending]". Get the reviewer name or drop the quote.

## 2. For Mario (SEO, not ours to change)

- [ ] `/happy-hour` title and meta description still say "All Day Sunday".
- [ ] Any other titles or descriptions Claude Code flags in its report.
- [ ] Birria Tacos vs Quesabirria Tacos: merge or keep separate. Claude Code will write up the overlap.

## 3. Photos to pull from Dropbox or shoot

| # | Photo | Where it goes |
|---|---|---|
| 1 | Real Happy Hour photos, each matched to a current HH menu item | Homepage HH section, `/happy-hour`, menu HH tab |
| 2 | Big Mami Margarita (2 or more) | Menu "Build to share" top and bottom, `/fajitas-molcajetes` |
| 3 | Airplane holding colorful shooters | Menu Shooters tab |
| 4 | Malteadas (different from current) | `/la-dulceria` |
| 5 | Actual margaritas, one per flavor | `/margaritas` hero and flavor cards, menu |
| 6 | Restaurant-owned piña colada | `/margaritas`, menu (current one gets pulled now) |
| 7 | Birria Pizza | `/takeout-delivery` "Feeds four to six", birria pages |
| 8 | Birria tacos with a cantarito | Birria pages (client says coming soon) |
| 9 | Quesabirria tacos (real, not veggie) | `/late-night`, only if no correct one is already in the repo |
| 10 | Al pastor trompo photo, or the existing shaving video | `/street-tacos` al pastor slot |
| 11 | Correct tacos de arrachera (optional, current image gets relabeled pork belly) | `/street-tacos` |
| 12 | Tacos with handcrafted margaritas | `/fajitas-molcajetes` |
| 13 | Large entrée with a Big Mami | `/fajitas-molcajetes` |
| 14 | Molcajete + fajita + a couple of Big Mamis | `/fajitas-molcajetes` (replaces "Big Plate, Big Mami") |
| 15 | Replacement Agua Fresca station | `/private-parties/quinceaneras-celebrations` "Built for a grand entrance" |
| 16 | Tomás headshot | Quinceañeras, Weddings, and the 7 coordinator cards on `/private-parties` |
| 17 | Karaoke night | `/karaoke` (replaces placeholder) |
| 18 | Wedding long table, candlelit | `/private-parties/weddings-receptions` bottom |
| 19 | Every menu dish missing a photo | `/menu`. Claude Code's report will list them |
| 20 | Bottle or logo for each tequila and mezcal brand | Menu tequila list. Claude Code's report will list the brands. Get from the client or brand press kits (the project rule bars pulling images off the web automatically) |

## 4. Edits you need to do by hand

- [ ] **Happy Hour "celebration" video:** cut the part with the woman twerking on the table, or pick
      a replacement from the Dropbox options. The current video gets pulled from the page in the
      automatic pass, so nothing objectionable is live in the meantime. If you give me the
      timestamps, Claude can trim it with ffmpeg instead.
- [ ] **Post-Crescent photo:** retouch the camera flash out (`press-post-crescent-*.webp` on `/our-story`).
- [ ] **Fatima and Patricia (Taco Tuesday):** check Claude Code's crop. If the cloths still show,
      retouch them out or crop the source file.

## 5. After the automatic pass

- [ ] Review the branch `post-launch-corrections-1` on its preview deploy.
- [ ] Merge to `main` (this deploys production).
- [ ] Send Mario his items.
