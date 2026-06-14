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
- Cache bust: `?v=12c`
- Footer: `Version 12C · Beta`


## Stage 12B version/footer fix

- Locked all old stage footer writers to the current version label.
- Stops the footer flickering between 11G, 11H and 12A while older patch intervals are still active.
- Cache-busting updated to ?v=12c.


## Stage 12C - Salary Scale, Bonuses and Club Choice Clarity

Stage 12C replaces the 12A/12B salary balance with a much slower manager wealth curve.

### Added / changed

- Starting salaries are now tiny rather than Premier League superstar wages.
- Arsenal / elite-club unknown-manager starts should now be around tens of thousands, not millions.
- Salaries are now visible on the club selection cards before starting a career.
- Club selection cards also show bonus route, pressure and career upside.
- Landing page now explains that winning with a giant is expected, while lower-club overperformance can make your name.
- Bonuses are now salary-multiplier based and weighted by achievement difficulty.
- Lower-division overperformance is much more valuable, especially for tiny clubs where mid-table can be a serious result.
- Manager market value still grows through reputation, career climb, promotions and overperformance.
- Big-club poach offers can become huge, but only after real leverage has been earned.
- Added extra post-match fan noise lines based on manager reputation, salary pressure and club context.
- Unknown manager at a giant club now receives much harsher fan reaction after defeats.
- Experienced managers get more tolerance in reports.
- Expensive managers at smaller clubs can be criticised for taking money that could have gone into the squad.
- Cache-busting updated to `?v=12c`.
- Footer now says `Version 12C · Beta`.

### Notes

No ownership mechanics are included in this stage. This is still only the manager salary and wealth layer.
