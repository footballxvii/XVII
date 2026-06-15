# XVII Stage 13Q: Owner Progression State Repair

Built from Stage 13P Owner Boardroom State Fix.

## Changes

- Updated cache busting to `?v=13q`.
- Footer now shows `Version 13Q · Beta`.
- Kept the landing page unchanged from 13O/13P.
- Added a final owner progression repair patch.
- Patched the older Stage 13A owner guard so it recognises the newer boardroom session state.
- 5%, 25% and 51% owner decisions now write a single compatible confirmed decision record.
- Confirmed owner decisions are tied to the current club and current season.
- Confirmed decisions lock the owner controls for that season.
- Re-clicks should not reapply votes, units, transfer boosts or owner spending.
- Start next season should now recognise confirmed owner decisions and progress normally.
- Previous season decisions remain in history but should not lock or unlock the new season.

## Upload note

Extract this ZIP and upload the contents to the repository root. Use `?v=13q` after upload to avoid browser cache.
