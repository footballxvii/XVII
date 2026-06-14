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
