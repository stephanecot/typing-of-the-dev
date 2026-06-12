---
name: add-enemy
description: Add a new enemy to Typing of the Dev — full checklist (sprite, words, spawn, bestiary FR/EN, README). Use when the user asks for a new enemy/monster.
---

# Add an enemy

Pick a level (1–5) and ideally a small unique mechanic (stat tweak or behavior).
Lvl.4 spawns only in CTO BURNOUT + DIEU DU TERMINAL, lvl.5 only in DIEU DU
TERMINAL (gate inside `waveQueueFor`). Then walk this checklist — every step,
in order:

1. **Sprite** — `public/js/data/ascii.js`: add `kind: ['art1', 'art2']`
   (1–2 variants, 3–6 lines, ~6 chars wide; escape backslashes). Bosses are
   bigger; regular enemies small.
2. **Words** — pick an existing bank or create one in
   `public/js/data/words.js` (see `/add-words` rules: no `{}[]`, no accents,
   keep short words for STAGIAIRE). Very-French banks need an EN variant in
   `WORDS.en` + access via `wordBank('name')`.
3. **GameScene** (`public/js/scenes/GameScene.js`):
   - `spawnEnemy` conf map: `kind: { color, tint, speed, art, cls, size, level }`.
     `cls` must be one of bug/legacy/deadline (kill-stat buckets).
   - `labelFor` switch: a `case 'kind':` returning `pickWord(...)`.
   - `waveQueueFor`: spawn schedule `if (n >= X) for (...) q.push('kind');`
     (+ difficulty gate for lvl.4/5). Keep it deterministic — no Math.random.
   - Special behavior if any: timed → set `e.xxxAt` in `addEnemy` + handle in
     `update()` (see ghost/ransomware/po/microservice); on-death → hook in
     `killEnemy` (see virus/obfuscator/indep); on-typing → hook in `onKey`
     (see indep dodge, monolith extra words).
4. **Bestiary** — `public/js/data/i18n.js`: add the entry to the right level
   group in `bestiaryGroups`, **both FR and EN**:
   `['artKind', 'NAME', 'desc line1\ndesc line2', 'availability']`.
   Desc ≤ 2 lines of ~34 chars. Availability mentions difficulty/sprint.
   If new popup texts are needed, add the i18n keys in both languages.
5. **Art color** — `MenuScene.ART_COLORS` (`public/js/scenes/MenuScene.js`).
6. **README** — add a row to the enemies table and bump the "(N kinds)" count.
7. **Validate**: `npm run check`, then `/playtest` — spawn it via
   `sc.spawnEnemy('kind')`, verify sprite/word/badge and the special behavior,
   check the bestiary page (help page 3) renders within bounds.

Do NOT reveal anything in the in-game help that should stay secret.
