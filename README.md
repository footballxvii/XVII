# XVII Stage 11H - Post-Match Report Rework

This build continues from Stage 11G and adds a new post-match report phrase bank.

## Added in Stage 11H

- Reworked post-match notes into short story-style post-match reports.
- Removed visible engine language such as chaos, modifier, roll, engine, probability and internal mapping.
- Added a large phrase bank for:
  - match feel
  - tactical story
  - reason for result
  - fan and board reaction tone
  - headline lines
- Reports respond to:
  - win, draw or loss
  - scoreline and margin
  - home or away
  - rival fixtures
  - custom tactic tags
  - attacking, cautious, wide, narrow and back-five-feel shapes
  - fatigue
  - goalkeeper edge
  - attacking and defensive match-up
  - player performance swings
  - red card narrative
  - opponent expectation
- Added recent phrase memory to reduce repeated wording across matches.
- Post-match report now appears under the heading `Post-match report` rather than `Post-match notes`.
- After a manually played match, the XI is cleared again for the next fixture.
- Play Fixture is disabled until a complete XI is picked.
- Cache-busting updated to `v=11h`.
- Footer now shows `Version 11H · Beta`.

## Included from earlier builds

- Stage 10F long-service departures.
- Stage 11 formation creator.
- Stage 11C freeze fix.
- Stage 11D slot-based creator rework.
- Stage 11F three-column layout fix.
- Stage 11G cursor and goalkeeper fix.

## Upload

Upload the extracted folder contents to GitHub, not the ZIP itself.

Top-level files/folders should include:

- `backups`
- `css`
- `docs`
- `js`
- `.gitignore`
- `index.html`
- `netlify.toml`
- `README.md`
