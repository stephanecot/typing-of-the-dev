---
name: add-secret-code
description: Add a secret code/mode to Typing of the Dev (code prompt, flag, badges, effects) without leaking it in the in-game help. Use when the user asks for a new secret code or hidden mode.
---

# Add a secret code

Codes are typed in the menu prompt (`C` key) — never as raw key sequences
(that conflicts with menu shortcuts).

1. **Flag** — `public/js/main.js`: `let XXX_MODE = false;` with a one-line
   comment. Persist in localStorage only if it should survive reloads
   (INFINITE does; fun modes usually don't).
2. **Code** — `MenuScene.submitCode()`: add an `else if (code === 'xxx')`
   toggling the flag. If the effect must rebuild the menu (camera FX…),
   `this.scene.restart()` like `boisson` does.
3. **Menu badge** — `MenuScene.refreshSecretBadges()`: `if (XXX_MODE)
   add(T('xxxOn'), CSS.color);`
4. **HUD badge** — GameScene `buildHud` badge stack: `if (XXX_MODE)
   addBadge(T('xxxBadge'), CSS.color);`
5. **i18n** — `xxxOn` (menu banner with emoji) and `xxxBadge` (short HUD tag),
   FR + EN.
6. **Effect** — gate visuals behind `REDUCED_MOTION` when animated; if it
   changes words, follow the GINES pattern (override inside `labelFor` & the
   few direct `pickWord` call sites); if it changes music, follow `DISCO_TRACK`
   (override in `Music.track()`).
7. **Docs** — add the code to the README table. **NEVER mention the actual
   code in the in-game help or release notes** — cryptic teasers only.
8. **Validate**: `npm run check`, then `/playtest`: drive
   `m.openCodePrompt(); 'xxx'.split('').forEach(k => m.onCodeKey({key:k}));
   m.onCodeKey({key:'Enter'})` and verify badges + effect in game.
