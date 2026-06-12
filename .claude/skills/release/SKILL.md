---
name: release
description: Release a new version of Typing of the Dev - version bump, FR/EN release notes, README badge, optional screenshots, final checks. Use when the user asks to bump/release a version.
---

# Release a version

1. **Version bump** (kept in sync, `npm run check` enforces it):
   - `public/js/main.js` → `APP_VERSION = 'vX.Y.Z'`
   - `package.json` → `"version": "X.Y.Z"`
   - README badge `version-X.Y.Z`
2. **Release notes** — `releaseNotes` in `public/js/data/i18n.js`: prepend a
   `['vX.Y.Z', [lines…]]` entry **in both FR and EN blocks** (the first entry
   is labeled "current" automatically). 3–6 punchy lines, no secret codes.
3. **Screenshots** (only if the look changed): temporarily add to `server.js`
   a `POST /api/dev/screenshot` endpoint (writes base64 PNG into `docs/` —
   see git history of docs/ commits), restart server, in the browser run
   `game.renderer.snapshot(img => fetch('/api/dev/screenshot', {method:'POST',
   headers:{'Content-Type':'application/json'}, body: JSON.stringify({name,
   data: img.src})}))` on the menu/game/bestiary states, then **remove the
   endpoint** before committing.
4. **Checks**: `npm run check`, then `/playtest` smoke test (menu, help pages
   1–5, one game start), verify the release-notes page renders.
5. Commit (French message, one line summary + bullets) — only after the user
   confirms; push to `origin main`.
