# XVII Stage 13A: Manager-Owner Foundations

Built from Stage 12K3.

## What changed

- Added Manager-Owner route.
- Ownership levels are 5%, 25% and 51%.
- Manager-owner buy-in unlocks at 90+ manager reputation.
- Silver warning appears at 80-89 manager reputation.
- Gold unlock appears at 90+ manager reputation.
- Added very visible beta test buttons:
  - Silver tier + money
  - Gold unlock + money
- Club shares have a live value based on:
  - starting transfer budget / club size
  - division and league status
  - club reputation
  - club development units
- Buying more shares costs the extra percentage at the current live club value.
- Voluntary cash out sells at 80% of current share value.
- Job moves sell the old club stake at the voluntary rate.
- Sackings sell the stake at 10% of original buy-in.
- Added club development units:
  - Training ground
  - Stadium and matchday
  - Commercial department
  - Youth and recruitment
  - Global promotion
- Each category has 10 units. Hidden total is 0-50.
- Every club starts with 20 units.
- Club units create future transfer revenue. The board does not simply gift transfer money.
- End of season only:
  - buy into current club
  - buy into accepted job-offer club
  - select or accept club development plan
- 5% and 25% stakes give board patience.
- 51% stake gives control of development plan, with the manager paying 51% of shareholder top-ups and other shareholders paying 49%.
- Cache busting is now `?v=13a`.
- Footer shows `Version 13A · Beta`.

# XVII Stage 12K3: iPhone Background Variant

Built from Stage 12K2.

## Changes

- Keeps the Stage 12K2 starting manager rating fix.
- Keeps the desktop background from 12K2.
- Adds a separate **compressed portrait background** for iPhone/mobile screens.
- Uses the new portrait image only on narrower screens for a better mobile fit.
- Keeps file size small by storing the mobile background as WebP.
- Cache busting is now `?v=12k3`.
- Footer shows `Version 12K3 · Beta`.

# XVII Stage 12K2: Starting Rating Fix

Built from Stage 12K1.

## Cause found

The starting rating was still showing 55 because the Stage 9 division-selector code had its own starter function:

- elite/top clubs were being assigned 55
- mid top-division clubs were assigned 45
- lower top-division clubs were assigned 40

That function ran during `startWindow()` and overwrote the newer 26-rating model.

## Fixes

- `stage9StartingManagerRep()` now returns **26** for every fresh new manager.
- `startWindow()` is guarded so a fresh career cannot retain 55/45/40.
- salary/club-card helper now also uses **26** as the starting rep.
- fresh Season 1 saves with no career history are repaired to **26**.
- compressed background remains unchanged from Stage 12K1.
- cache busting is now `?v=12k2`.
- footer shows `Version 12K2 · Beta`.

# XVII Stage 12K1: Compressed Background and Starting Rating Fix

Built from Stage 12K.

## Changes

- Uses the compressed WebP background again.
- Removes the dark overlay that made the background almost invisible.
- Removes the large original PNG from the build to keep the ZIP smaller.
- Keeps the Stage 12K hard fix for new manager starting reputation:
  - new managers start at **26**
  - fresh career start forces **26**
  - salary fallback uses **26**
- Cache busting is now `?v=12k1`.
- Footer shows `Version 12K1 · Beta`.

# XVII Stage 12K: Background Visibility and Starting Rating Fix

Built from Stage 12J.

## Changes

- Uses the original supplied map/stadium PNG as the page background.
- Removes the page-wide dark overlay added in Stage 12J.
- Keeps the background as a visibility test so it can be judged properly before further tuning.
- Hard fixes new manager starting reputation:
  - default manager profile now starts at **26** in the core game.
  - season start and new career start are also patched to force **26** for a fresh career.
  - salary fallback now also uses **26** rather than the old higher default.
- Cache busting is now `?v=12k`.
- Footer shows `Version 12K · Beta`.

# XVII Stage 12J: Visual Identity and Manager Salary Fix

Built from Stage 12I.

## Changes

- Adds the new dark map/stadium artwork as the page background.
- Background is compressed to WebP for page speed: `xvii-map-stadium-background.webp`.
- Adds a dark overlay so panels and text stay readable.
- Optimises the XVII logo asset down to a smaller web-ready PNG.
- Hard-fixes manager personal wealth/career earnings carryover:
  - wealth should now remain visible in summer windows after end-of-season rollover,
  - career earnings should remain cumulative,
  - bonuses should remain cumulative,
  - if the season transition creates a blank wealth object, Stage 12J restores the saved earnings.
- Cache busting is now `?v=12j`.
- Footer shows `Version 12J · Beta`.

# XVII Stage 12I: Long-Service Departure Balance

Built from Stage 12H.

## Changes

- Long-service departures are now a **club event**, not a separate roll for every old player.
- No long-service risk before **8 years** at a club.
- Normal cap is **maximum two long-service issues per club per season**, and many seasons will have none.
- Good backroom staff now matters more:
  - better assistant managers are much more likely to warn you early.
  - warned players can be sold before the issue fully matures.
- Once a player declares a long-service issue, his value is halved.
- If you sell/offload a declared long-service player, he still leaves the active game world afterwards rather than sitting unrealistically in the market.
- New-challenge players now leave the active market briefly as well, rather than instantly reappearing as simple pool signings.
- Updated Help text to explain the new system.
- Cache busting is now `?v=12i`.
- Footer shows `Version 12I · Beta`.

# XVII Stage 12H: Reputation Balance

Built from Stage 12G.

## Changes

- New managers now start at reputation **26** instead of the old higher starting point.
- In Risk Career, being sacked resets manager reputation to **1**.
- Big-club success is now difficulty-weighted:
  - winning with Arsenal, Chelsea, Liverpool, Man City etc still helps, but it is treated as expected success rather than miracle work.
  - repeated expected title wins have diminishing reputation returns.
- Lower-club overperformance is more valuable:
  - small second-division clubs finishing mid-table or above now carry much more reputation weight.
  - lower-division graft should be a better route to becoming a wanted manager.
- Big-club underperformance is punished harder.
- Added extra fan/media phrases around routine elite-club success and lower-club graft.
- Cache busting is now `?v=12h`.
- Footer shows `Version 12H · Beta`.

# XVII Stage 12G: Manager Wealth Carryover Fix

Built from Stage 12F.

## Fixes

- Personal wealth now carries over properly from season to season.
- Career earnings and bonuses are preserved across the next-season reset.
- If the old season reset briefly creates a blank manager wealth object, Stage 12G restores the paid earnings and then saves the corrected state.
- Cache busting is now `?v=12g`.
- Footer shows `Version 12G · Beta`.

# XVII Stage 12F: Mobile Backroom Collapse Fix

Built from Stage 12E.

## Fixes

- Fixes the mobile summer-window bug where choosing a training package while Backroom staff was minimised could make the backroom panel disappear.
- Backroom staff remains visible and expandable after training changes.
- If no assistant/scouting package has been selected, choosing training reopens the Backroom staff panel so users are not accidentally forced into a season with no staff.
- Keeps the Stage 12E mobile budget visibility.
- Cache busting is now `?v=12f`.
- Footer shows `Version 12F · Beta`.

# XVII Stage 12E: Mobile Budget Visibility

- Adds a live transfer budget card beside the mobile transfer-market toggles.
- Budget updates dynamically after buys, sells and render refreshes.
- Keeps the transfer-listed and include-my-players toggles visible beside the budget on phone.
- Updates cache busting to `?v=12e` and footer to Version 12E · Beta.

# XVII Stage 12D: Subtle Branding Pass

# XVII Stage 12B - Manager Salary and Market Value

Stage 12B replaces the first salary draft with a more restrained manager-career economy.

## Main changes

- Manager salary is now reviewed yearly rather than using contract lengths.
- Salaries are much lower and should not make ownership reachable quickly.
- Bonuses are the main way to build personal wealth.
- Personal wealth remains separate from club transfer budget.
- Manager pay is based on market value, not only club size.
- A manager who grafts through smaller clubs can become more valuable than someone who started at an elite club and merely met expectations.
- Elite clubs can still offer enormous money, but mainly when poaching a high-leverage manager.
- Current clubs have wage ceilings based mainly on their original size, with only limited growth as club reputation improves.
- Job adverts now show salary offer, bonus route and why the club is interested.
- End-of-season pay review explains salary, bonus and why bonuses were earned.
- Ownership mechanics are not included in this stage.

## Design intent

The player should feel the tension between loyalty and money:

- stay at the fairytale club for control, patience and legacy
- or take a major-club offer that accelerates personal wealth

## Technical notes

- Script: `js/stage12-manager-salary-wealth.js`
- Cache bust: `?v=12b`
- Footer: `Version 12B · Beta`


## Stage 12B version/footer fix

- Locked all old stage footer writers to the current version label.
- Stops the footer flickering between 11G, 11H and 12A while older patch intervals are still active.
- Cache-busting updated to ?v=12b.
