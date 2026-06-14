# XVII Stage 11 - Formation Creator and Tactical Theatre

This build adds the Stage 11 formation creator on top of the Stage 10 stability/mobile/market/long-service base.

## Included from previous builds

- Stage 10 stability split-file structure.
- Stage 10B mobile and transfer market cleanup.
- Stage 10C help and UI polish.
- Stage 10D PC help placement and restart safety.
- Stage 10E collapse hotfix.
- Stage 10F long-service departures.

## Stage 11 additions

- Visual formation creator on a pitch.
- Green goalkeeper, blue defenders, yellow midfielders, red forwards.
- Drag role circles around the pitch to create the look of a tactic.
- Simple attached arrows: forward, backward, inside, wide or none.
- Custom tactic maps internally to one of the existing legal formations only:
  - 4-5-1
  - 4-4-2
  - 4-3-3
  - 3-5-2
  - 3-4-3
- True five-defender formations remain blocked to protect the current match-engine balance.
- Back-five feel is created narratively by using 3-5-2 with deep wide midfielders.
- Custom tactic can be saved and selected without deleting normal quick formations.
- Formation dropdown now includes Custom Tactic.
- Quick 4-4-2 and other normal formations still work and do not delete the saved custom tactic.
- Assistant manager / first-team coach gives live tactical chat.
- If no assistant manager is hired, the first-team coach gives unreliable advice.
- Better assistant packages give more useful tactical advice.
- Fans now react narratively to the custom tactic after matches.
- Arrows and pitch layout influence narrative only, not the match engine.

## Wrapped-in fixes

- PC league table minimise removed.
- Phone duplicate sim controls guarded against.
- Summer window flicker from training/backroom choices reduced by avoiding full-page render where possible.
- Help guide updated with the formation creator explanation.

## Upload instructions

Upload the extracted folder contents to GitHub:

- backups
- css
- docs
- js
- .gitignore
- index.html
- netlify.toml
- README.md

Netlify should redeploy automatically after commit.
