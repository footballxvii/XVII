# XVII Stage 11D - Formation Creator Rework

This build continues Stage 11 and reworks the formation creator into a cleaner slot-based tactics board.

## Main changes

- Replaced free-drag tactic movement with fixed tactical slots.
- Goalkeeper now has 2 possible slots.
- Defenders now have 10 slots across 2 banks of 5.
- Midfielders now have 15 slots across 3 banks of 5.
- Forwards now have 5 slots.
- Players can only be placed in slots for their role.
- True five-at-the-back remains unavailable.
- A back-five feel can still be created using 3 centre-backs, deep wide midfielders and recovery arrows.
- Assistant advice no longer reveals the internal formation mapping.
- The old Load Shape button has been removed.
- Selecting a tactic shape in the formation creator immediately loads that board shape.
- Save and use tactic has been renamed to Set.
- Assistant Formation Pick now loads the recommended shape into the formation creator board.
- Your XI shape updates after pressing Set.
- Original formation dropdown above Play Fixture is hidden to reduce confusion.
- Play Fixture button now uses the freed space.
- Assistant Manager Pick, Assistant Formation Pick and Use Last XI are moved above the squad picker on desktop.
- Tactic creator boxes are constrained so they no longer hang over the league table.
- First-team coach remains available for advice if no assistant manager is hired, but his advice is deliberately unreliable.
- Footer version updated to Version 11D · Beta.

## Included earlier fixes

- Stage 10B mobile and transfer market cleanup.
- Stage 10C help guide and UI polish.
- Stage 10D PC help polish.
- Stage 10E collapse hotfix.
- Stage 10F long-service departures.
- Stage 11 formation creator foundation.
- Stage 11C freeze/performance fix.

## Upload

Upload the extracted folder contents to GitHub:

- backups
- css
- docs
- js
- .gitignore
- index.html
- netlify.toml
- README.md

Netlify should redeploy automatically.
