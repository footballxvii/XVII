# XVII Manual Test Plan - Stage 10D

Use this after uploading to GitHub and Netlify redeploys.

## Public page polish

- Browser tab should read: `XVII | Build the seventeen. Pick the eleven.`
- Header should not show Stage 9H or another build number.
- Footer should show `Version 10D · Beta` quietly near the copyright.
- On desktop, Help and Game Guide should appear above the copyright, not fixed to the bottom of the screen.
- On phone, Help and Game Guide should remain fixed to the bottom.
- On phone, the Help panel should include a `Jump to fixture` button.

## Transfer window

- Start a game.
- Transfer market should load.
- Transfer listed only tick box should filter to listed/deal players.
- Include my players tick box should hide/show your own squad in the market.
- Transfer rules minimise button should fully hide the rules text.
- Transaction log should minimise.
- Your squad should minimise.
- Sell/List buttons should sit side by side.

## Season hub

- Finish the transfer window.
- Match squad news should use the full width on phone.
- League table should minimise.
- When league table is minimised, Sim Rest of Season and Sim to January should still be visible.
- Sim to January safety button and Sim to January button should match height.
- Analytics Department should minimise.
- Season Challenges collapsed panel should have clean spacing at the bottom.

## Restart safety

- Bottom Restart Career button should be locked at first.
- Bottom safety button should unlock it.
- Restart Career should only work after safety is unlocked.

## Career flow

- Play one fixture.
- Sim to January.
- Open January transfer window.
- Sim rest of season.
- Check job offers if they appear.
- Start next season.
- Refresh browser and confirm save still loads.


## Stage 10E collapse hotfix checks

- On desktop, click minimise and expand on several panels. They should close and reopen.
- On mobile, click minimise and expand on several panels. They should close and reopen.
- Minimise the league table and confirm Sim Rest of Season and Sim to January remain visible.
- Minimise Transfer Rules and confirm the rules text disappears.
- Open the Help and Game Guide on mobile and test Jump to fixture.


## Stage 10F long-service checks

- Confirm the game still starts from a clean save.
- Confirm the transfer market still loads and player filters still work.
- Sim multiple seasons with one club and check that long-service warnings eventually appear after players reach 5+ seasons.
- If a warned player is not sold, confirm he leaves in the next transfer window.
- Confirm New Challenge departures cannot be bought back by the old club for 6 seasons.
- Confirm Personal reasons and Family reasons players disappear from the visible market for 2-4 seasons.
- Confirm Retirement players disappear from the visible market for 5-9 seasons.
- Confirm players returning from time away appear back in the transfer pool.
- Confirm the Help and Game Guide long-career section mentions the new system.
