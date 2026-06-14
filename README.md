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
