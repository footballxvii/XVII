# XVII

Stage 10 Stability Cleanup version.

This version keeps the Stage 9H game behaviour, but splits the single huge HTML file into a safer project structure.

## What changed

- `index.html` now holds the page structure.
- `css/styles.css` now holds the main game styling.
- `js/xvii-core.js` now holds the main game engine.
- Stage patches are kept as separate JavaScript files and loaded in the same order as before.
- The original Stage 9H HTML file is preserved in `backups/xvii_stage9h_live_backup.html`.
- A simple Netlify config file is included.

## Important

This cleanup is intended to keep gameplay unchanged.

When uploading to GitHub, upload the contents of this folder, not the folder itself.

Netlify should publish from the repository root.

## Suggested safe workflow

1. Keep the current live Netlify deploy as the rollback version.
2. Upload this cleaned project to GitHub.
3. Let Netlify create a deploy preview.
4. Test the preview before making it live.
5. Only then publish/promote it.

## Manual smoke test

Before publishing, test:

- Start game with a Top Division club.
- Start game with a Second Division club.
- Buy and sell a player.
- Finish the transfer window.
- Pick a team and play a fixture.
- Sim to January.
- Open the January window.
- Sim to season end.
- Start next season.
- Check promotion/relegation if finishing top/bottom.
- Refresh the browser and confirm the save still loads.
