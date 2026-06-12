---
name: add-boss
description: Add a boss to Typing of the Dev (campaign or endless-mode) with its mechanic, help entry and validation. Use when the user asks for a new boss.
---

# Add a boss

Two families: the **campaign** has exactly one regular boss + the final CIO
(don't add there without strong reason); new bosses normally go to the
**endless mode** rotation.

1. **Sprite** — `public/js/data/ascii.js`: one art, larger (5–8 lines).
2. **Variant** — `INFINITE_BOSSES` in `public/js/scenes/GameScene.js`:
   `{ art, nameKey, cmdDelta, speedMult, color, ...mechanic flags }`.
   Existing mechanic flags (reuse before inventing):
   - `longest: true` → picks the longest shell commands (Technical Debt)
   - `spawnOnHit: 'kind'` → spawns an enemy on each hit taken (Salesman/Audit)
   - `smokeOnHit: true` → smoke screen on each hit (Burning Datacenter)
   - `rerollOnHit: true` → re-rolls the next command (Framework of the Day)
   - `damage: N` → lives lost if it reaches prod (Expired Certificate)
   - `costPerHit: N` → score cost per hit taken (Cloud Bill)
   New flags: wire them in `bossHit()` (on hit) or `incident()` (on reach).
3. **i18n** — `public/js/data/i18n.js`, both FR and EN:
   - boss name key (`bossXxx`)
   - `bestiaryBossesInf` entry: `['artKind', 'NAME', '3 short centered lines']`
4. **Art color** — `MenuScene.ART_COLORS`.
5. **README** — extend the endless-bosses list and the count.
6. **Validate**: `npm run check`; `/playtest` with
   `INFINITE_MODE = true; sc.wave = 4k-1; sc.nextWave()` cycling enough waves
   to land on the new variant (rotation order = array order); check the boss
   help page (page 4) still fits — it scrolls if needed.
