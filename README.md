# XVII Stage 13O: Landing Render Stability Fix

Built from Stage 13N Stability, Owner Lock and Club Narratives.

## Changes

- Updated cache busting to `?v=13o`.
- Footer now shows `Version 13O · Beta`.
- Replaced the conflicted landing-card render path with one final landing render loaded last.
- Removed the older landing-only patch scripts from `index.html` so they no longer fight over the club cards.
- Fixed the selected club board personality box overhanging the card.
- Restored salary, bonus route, pressure, budget, predicted finish and board personality on the landing cards.
- Replaced the generic gold line with club-specific story blurbs.
- Made the story blurbs appear for both Top Division and Second Division clubs.
- Fixed Second Division club cards not rendering on the landing page.
- Added baseline landing CSS to reduce the old narrow-layout flash on page load.
- Left the top darker background/panel alone as requested.
- Did not intentionally change the owner boardroom mechanics in this patch.

## Upload note

Extract this ZIP and upload the contents to the repository root. Use `?v=13o` after upload to avoid browser cache.
