---
name: mobile-adapt
description: Make a change in Typing of the Dev mobile-aware (or change the mobile version itself) without altering the standard desktop version - MOBILE flag, M() helper, sizes, virtual keyboard, touch DOM screens. Use for any UI/gameplay/text change, and whenever the user asks to adjust the mobile version.
---

# Adapting a change for mobile

The mobile version (phone app via Capacitor, touch-only screens, or `?mobile=1`)
shares ALL game logic with the standard version. **Rule #1: the standard
version must stay strictly identical.** Every mobile difference goes through:

- `M(standardValue, mobileValue)` — for positions, sizes, fonts, speeds;
- `if (MOBILE) { … }` — for mobile-only branches (early `return` to a DOM screen).

Never change a standard value while "fixing" mobile. If you refactor shared
code (e.g. `GameOverScene.statLines`), keep the standard output byte-identical.

## What lives where

| File | Mobile role |
|---|---|
| `public/js/main.js` | `MOBILE` detection, `M()`, `MOBILE_KB_H`, measured `GAME_W`×`GAME_H` (800 × area above the keyboard), `html.mobile` class, viewport |
| `public/js/mobile/keyboard.js` | `VKB`: DOM virtual keyboard (ÉCHAP/TAB row, AZERTY in FR / QWERTY in EN, `?123` symbols page) dispatching real `keydown`/`keyup` on `window` |
| `public/js/mobile/ui.js` | `MobileUI`: full-screen touch screens (home, briefing, help tabs, secret code, game over, pseudo, ranking). Façade only: calls `MenuScene` / `GameOverScene` methods |
| `public/js/api.js` | `LocalScores`: on-device scores (`localStorage`) when `MOBILE && !SERVER_MODE` |
| `public/js/scenes/GameScene.js` | `M()` on HUD, fonts, `MOBILE_SPEED`, `PROD_X`/`PLAYER_X`/`PROD_EDGE`, `LANE_TOP` |
| `public/css/style.css` | `html.mobile …`, `#vkb …`, `#m-ui …` / `.m-*` rules (never touch unprefixed rules for mobile) |
| `public/js/data/i18n.js` | mobile texts: `m*` keys (`mStart`, `mBriefingSteps`…), `vkb*`, `hudItemsMobile` — FR **and** EN |

Not on mobile (by design): multiplayer (`mp.html` has no mobile scripts), the
event banner (`EVENT_BANNER`), the stand's RGPD form when there is no server.

## Sizing rules (canvas)

The 800-px-wide canvas is displayed at ~0.55× on a phone. So in game-px:
- informative text ≥ **26px** (≈ 14 css px), HUD ≥ **34px**, typed words **44px**;
- keep long texts inside `GAME_W - 40` with `wordWrap: MOBILE ? { width } : undefined`;
- the HUD uses 4 rows on mobile (y 16 / 60 / 104 / 148): enemies spawn below
  `LANE_TOP` (200 on mobile) — move `LANE_TOP` if the HUD grows;
- `GAME_H` varies per phone (≈ 950–1250): anchor bottom elements to `GAME_H`.

DOM screens (`#m-ui`): touch targets ≥ 48px high, text ≥ 18px, colors from the
palette, AA contrast, no animation without a `prefers-reduced-motion` fallback.

## Checklist for a change

1. **New player-facing text** → i18n FR + EN. If it names a physical key
   (ENTRÉE, EFFACER, flèches…), add a mobile variant naming the virtual key
   (⏎, ⌫, ÉCHAP, TAB, ?123) and pick it with `T(M('key', 'keyMobile'))`.
2. **New keyboard shortcut** → only letters/⏎/⌫/ÉCHAP/TAB exist on the
   virtual keyboard (no arrows, no F-keys). Menus on mobile need a DOM button
   in `ui.js` instead of a key.
3. **New menu feature** (MenuScene) → add the matching button/screen in
   `ui.js` calling the same MenuScene method (no logic duplication).
4. **New HUD element / on-screen text** → `M()` size ≥ rules above, check it
   fits in 800 px.
5. **New typed characters** in words → must exist on the virtual keyboard
   (`PAGES` in `keyboard.js`); the check covers `words.js`'s charset.
6. **Help/bestiary/boss data** → nothing to do: `ui.js` renders the same i18n
   data (`helpSections`, `bestiaryGroups`, `bestiaryBosses`…). Secret codes
   are never listed there either.
7. Verify with `/mobile-playtest` **and** a standard-version regression pass.
8. `npm run check`, then commit (the app picks up `public/` at the next
   `/mobile-build`).
