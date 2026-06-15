# XVII Stage 13L: Owner Decision Finalisation Fix

Built from Stage 13K Landing Club Card Info Restore.

## Changes

- Updated cache busting to `?v=13l`.
- Footer now shows `Version 13L · Beta`.
- README header updated for GitHub upload clarity.
- Reworked the 51% owner end-of-season boardroom flow.
- 51% owners now choose one main boardroom decision first:
  - Reinvest and maintain (do nothing)
  - Maintain, then move surplus to transfers
  - Move all development income to transfers
  - Owner-funded maintenance plus transfer funds
  - Improve club development
  - Personal transfer injection
- Development unit and category dropdowns now only appear when **Improve club development** is selected.
- Development unit dropdown is capped by:
  - the units still needed to reach 50/50
  - the manager's current personal wealth
- Personal transfer injection cannot exceed current manager wealth.
- Confirming a 51% owner decision now applies immediately, locks the controls and marks the boardroom as complete for that season.
- Added extra next-season unlock polish so the warning is removed once the owner decision is confirmed.
- Kept Stage 13K landing card fixes in place:
  - full-width landing layout
  - alphabetical club sorting
  - restored salary, bonus, pressure and board personality info

## Upload note

Extract this ZIP and upload the contents to the repository root. Use `?v=13l` after upload to avoid browser cache.
