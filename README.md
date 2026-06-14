# XVII Stage 11C Freeze Fix

This build fixes the Stage 11/11B freeze after finishing the transfer window.

Fixes included:

- Fixed the Formation Creator Quick 4-4-2 button accidentally firing while the panel rendered.
- This was causing repeated render calls when the season view loaded.
- Ensured Stage 10F, Stage 11 and Stage 11C scripts are loaded by index.html.
- Added a performance guard so the hidden transfer market is not fully rendered during the season screen.
- Limited mobile transfer card rendering to avoid huge hidden DOM updates.
- Footer version: Version 11C · Beta.

Upload the full extracted folder contents to GitHub as usual.
