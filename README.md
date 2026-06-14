# XVII Stage 10B - Mobile and Transfer Market Cleanup

This is the current cleaned Netlify/GitHub build of XVII.

## What changed in Stage 10B

- Added the end-of-season job safety fix. If you have enough manager reputation and unlock a specific job's safety catch, the Take Job button should now work.
- Added mobile collapse buttons for large narrative/info panels.
- Simplified the transfer market view. The old owner/status filter is hidden and players stay in one main list.
- Added visible market tags: Pool, Transfer Listed, Would Join, Discount, Too Ambitious, My Squad and Transfer Request.
- Added transfer-listed expiry. Computer listings last for the current window and next window only.
- Enforced listed-player pricing so listed club players are never above market value and can be discounted by up to 15%.
- Transfer-pool players can now also appear as listed/discount opportunities.

## Upload to GitHub

Upload the folder contents, not the zip file:

- index.html
- css/
- js/
- backups/
- docs/
- README.md
- netlify.toml
- .gitignore

Netlify should redeploy automatically after GitHub commit.
