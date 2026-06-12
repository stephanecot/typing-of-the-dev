# TYPING OF THE DEV — maintenance guide

Arcade typing game (a tribute to The Typing of the Dead). Vendored Phaser 3,
**zero-npm-dependency** Node server (`node:http` + `node:sqlite`), fully offline.

## Run & test

```bash
node server.js          # http://localhost:3333 (PORT=xxxx to change)
npm run check           # project validations (words, i18n, syntax) — RUN BEFORE EVERY COMMIT
```

- Game: `/` · Leaderboard: `/leaderboard.html` · Admin: `/admin.html`
- The SQLite database is created in `db/` (git-ignored, contains GDPR data).
- To test in Chrome: use the `playtester` agent or the `/playtest` skill
  (JS patterns to drive the scenes without playing by hand).

## Architecture (what lives where)

| File | Role |
|---|---|
| `server.js` | static files + JSON API + SQLite + admin settings (`/api/config`) |
| `public/js/main.js` | globals: `DIFFICULTIES`, `PALETTE`/`CSS`, `GAME_CONFIG`, `APP_VERSION`, mode flags (`GINES_MODE`, `DISCO_MODE`, `BOISSON_MODE`, `SPEED_MODE`, `INFINITE_MODE`), `REDUCED_MOTION`, `applyDrunkFx` |
| `public/js/data/i18n.js` | ALL UI text, FR then EN (`T(key)`, `LANG`, `setLang`); bestiary (`bestiaryGroups`, `bestiaryBosses`, `bestiaryBossesInf`); release notes (`releaseNotes`) |
| `public/js/data/words.js` | typed-word banks (`WORDS`, EN variants in `WORDS.en`, `wordBank()` helper) |
| `public/js/data/ascii.js` | ASCII sprites (`ASCII`, `pickArt`) |
| `public/js/audio.js` | SFX + 5 procedural music tracks (`TRACKS`) + hidden `DISCO_TRACK` |
| `public/js/scenes/GameScene.js` | gameplay; `waveQueueFor()` (pure function, shared with the help page for spawn %); `INFINITE_BOSSES` |
| `public/js/scenes/MenuScene.js` | menu, 5-page scrollable help, secret-code prompt, music/language/mode selectors |

## Invariants — NEVER break these

1. **Zero npm dependencies**, zero build step: plain ES2022 JS in script tags.
   Node ≥ 22.5.
2. **Typed words**: never `{ } [ ]` (painful on AZERTY), never accented
   characters, lowercase except CamelCase exceptions. Mind the STAGIAIRE
   difficulty (`maxLen: 10`): every bank must keep some short words.
3. **i18n**: every FR key has an EN counterpart with the same structure.
   Very-French banks (deadlines, missiles, spammers, buzzwords, poIdeas,
   freelance, insults) have an EN variant in `WORDS.en` → access via `wordBank()`.
4. **Typing always has priority** over in-game action keys (a/z/e powers,
   s mute): go through `isValidKeystroke()`.
5. **Accessibility**: AA contrast (`CSS.greenSoft` for small informative text,
   `greenDim` reserved for decor/large text); every animated or blinking effect
   respects `REDUCED_MOTION`; never more than ~2.5 flashes/second; color
   information is always doubled (shape, badge, fill).
6. **Secret codes are never revealed in the in-game help** (the README does
   list them).
7. Wave composition lives in `waveQueueFor()` (pure, deterministic): the help
   page uses it to compute spawn % — no `Math.random()` inside.

## Rituals (use the dedicated skills)

- New enemy → `/add-enemy` · New boss → `/add-boss`
- New words → `/add-words` · New secret code → `/add-secret-code`
- Version release → `/release` (version, FR/EN notes, README badge)
- Manual driven test → `/playtest` · README screenshots → see `/release`

## Style & commits

- Game code and comments are **in French**, matching the existing tone (sober,
  a touch of humor). Player-facing text: casual-correct FR, equivalent EN.
  AI/tooling files (this file, skills, agents) are in English.
- Commit messages in French without accents, descriptive, one feature per
  commit, signed `Co-Authored-By: Claude`. **Always `npm run check` before
  committing.** Push to `origin main` once agreed.
- Never commit `db/`.
