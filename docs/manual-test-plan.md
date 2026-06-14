# XVII Stage 10B Manual Test Plan

Run this after uploading to GitHub and Netlify redeploys.

## Basic load

- Site loads with styling.
- Start Game works.
- Club card selector still works.
- Safe/Risk Career selection still works.

## Transfer market

- Player Search appears.
- Owner/status filter is no longer visible.
- Player rows show tags such as Pool, Transfer Listed, Would Join, Discount, Too Ambitious and My Squad.
- Buying a player works.
- Selling a player works.
- Transfer-listing one of your own players works.
- Finish Window works.

## Mobile

- On a phone-width screen, large info panels show + / - collapse buttons.
- Collapsing a panel hides its content but does not hide the main action buttons.
- Transfer market cards still scroll.
- Team selection still works.

## Season

- Play one fixture.
- Sim to January.
- Open January window.
- Confirm listed/discount tags still appear.
- Finish January window.
- Sim rest of season.
- End-of-season summary appears.

## Job fix

- If an end-of-season job is available and your manager reputation is high enough:
  - click Safety on for that specific job
  - click Take job
  - the job should be accepted
  - next season should start at the new club

## Regression checks

- Promotion/relegation still works.
- Start Next Season works.
- Save/continue still appears after refresh.
