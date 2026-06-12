---
name: playtest
description: Drive Typing of the Dev in Chrome for testing - server start, scene access patterns, forcing waves/bosses/modes, console checks. Use to verify changes in the running game.
---

# Playtest the game

Start the server if needed: `node server.js` (background) → http://localhost:3333.
Open with the Chrome MCP tools, click the canvas once to focus, then drive
everything through `javascript_tool` — faster and more reliable than keystrokes
(synthetic typing is flaky; prefer direct scene calls).

## Scene access

```js
const m  = window.game.scene.getScene('Menu');
const sc = window.game.scene.getScene('Game');
```

## Recipes

- Open help page N: `m.toggleHelp(); m.helpPage = N-1; m.refreshHelpPage();`
  (scroll: `m.scrollHelp(1)`)
- Launch a game: `m.launch()` (uses selected difficulty; set `m.selected` first)
- Enter a secret code: `m.openCodePrompt(); 'code'.split('').forEach(k =>
  m.onCodeKey({key:k})); m.onCodeKey({key:'Enter'});`
- Spawn an enemy: `sc.spawnEnemy('kind'); sc.enemies[sc.enemies.length-1]`
- Force a wave/boss: `sc.wave = N-1; sc.spawnQueue = []; sc.nextWave();`
  (boss waves: N % 4 === 0; endless variants rotate in array order)
- Lock & type: `sc.target = e; e.lockTime = sc.time.now;` then
  `sc.onKey({ key: 'x', length: 1, preventDefault: () => {} })`
- Kill directly: `sc.killEnemy(e)` · Game over: `sc.gameOver()`
- Combo/stars: `sc.superComboEnabled = true; sc.combo = 4; sc.comboStars = 6;`
- Mode flags are globals: `INFINITE_MODE = true` etc. (before `m.launch()`)

## Always finish with

- `read_console_messages` with `onlyErrors: true` — must be empty.
- A screenshot to verify layout (help pages must stay within bounds or scroll).
- If you typed secret codes or toggled flags, reset them (reload the page).
