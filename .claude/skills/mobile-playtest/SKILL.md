---
name: mobile-playtest
description: Test the Typing of the Dev mobile version - browser with ?mobile=1, Android emulator with live reload, real taps via adb, JS eval in the app WebView, iOS simulator, plus the mandatory standard-version regression check. Use after any change touching the mobile version or shared code.
---

# Playtest the mobile version

Prerequisites: `node server.js` running (http://localhost:3333). Android SDK in
`~/Library/Android/sdk`, AVD `Pixel_10_Pro_XL`. Build with **JDK 24**
(Gradle 8.14 rejects Java 25):
`JAVA_HOME=~/Library/Java/JavaVirtualMachines/openjdk-24.0.1/Contents/Home`.

## 1. Quick look in a desktop browser

`http://localhost:3333/?mobile=1` forces the mobile mode (Chrome MCP tools).
Layout is only realistic in a phone-sized viewport; fine for logic checks.
If `document.hidden` is true the Phaser loop is paused — step it manually:
`let t = performance.now(); for (let i = 0; i < 60; i++) { t += 16.7; game.step(t, 16.7); }`

## 2. Android emulator with live reload (the real target)

```bash
~/Library/Android/sdk/emulator/emulator -avd Pixel_10_Pro_XL -no-snapshot-save &   # if not running
ADB=~/Library/Android/sdk/platform-tools/adb
$ADB wait-for-device
cd mobile && $ADB reverse tcp:3333 tcp:3333 \
  && JAVA_HOME=… ANDROID_HOME=~/Library/Android/sdk \
     npx cap run android --live-reload --host localhost --port 3333 --target emulator-5554
```

Run `cap run` in the background: it stays alive (Ctrl+C / `pkill -f "cap run android"`
restores the normal config). Then any edit in `public/` only needs an app restart:

```bash
$ADB reverse tcp:3333 tcp:3333        # re-apply after each install
$ADB shell am force-stop io.github.stephanecot.typingofthedev
$ADB shell am start -n io.github.stephanecot.typingofthedev/.MainActivity
```

In live reload the server IS reachable (`SERVER_MODE` true). To test on-device
scores, run `SERVER_MODE = false; MobileUI.render()` in the WebView, or test the
standalone release APK (`/mobile-build`).

### Drive it

- **JS in the app WebView** (state, shortcuts, forcing situations):
  `node mobile/scripts/webview-eval.mjs "<expr>"` — e.g.
  `"game.scene.getScenes(true).map(s => s.scene.key)"`,
  `"MobileUI.hide(); const m = game.scene.getScene('Menu'); m.selected = 1; m.startGame()"`,
  `"game.scene.getScene('Game').gameOver()"`. The `/playtest` scene recipes work too.
- **Real taps** (preferred to validate touch/keyboard): find the element's
  centre in css px via webview-eval (`getBoundingClientRect()`), then
  `$ADB shell input tap $((x*3)) $((y*3))` (device pixel ratio 3 on this AVD;
  check with `window.devicePixelRatio`). Text in a native input:
  `$ADB shell input text "abc"`, Enter = `input keyevent 66`, Escape = `111`.
- **Screenshots**: `$ADB exec-out screencap -p > shot.png` then
  `sips -Z 1000 shot.png` before reading it.
- **Console**: `$ADB logcat -d | grep Capacitor/Console` (ignore `Finsky` noise).

### Mobile smoke pass

Home (title + MOBILE ribbon, grade cards, mode, buttons) → briefing → game
(type a word with taps — letters only: `git push --force` = g,i,t,p,u,s,h,f,o,r,c,e
with 0 error — ÉCHAP pause/resume, SUPER COMBO line at the bottom in high
difficulties, enemies spread vertically) → forced game over → save pseudo →
ranking → MENU → help tabs (bestiary renders) → secret code valid + invalid →
FR/EN toggle (keyboard switches AZERTY/QWERTY). Release builds are not
debuggable (webview-eval fails): check them with screenshots. No text overflow, no clipped
HUD, keyboard hidden on DOM screens and during boot.

## 3. iOS simulator

```bash
cd mobile && npx cap sync ios && npx cap run ios --target <sim-udid>
```

With Xcode 27, `cap run` builds fine but fails to open Simulator.app — install
and launch manually (`xcrun simctl list devices available`):

```bash
APP=mobile/ios/DerivedData/<udid>/Build/Products/Debug-iphonesimulator/App.app
xcrun simctl boot <udid>; xcrun simctl install <udid> "$APP"
xcrun simctl launch <udid> io.github.stephanecot.typingofthedev
xcrun simctl io <udid> screenshot ios.png
```

No tap automation on iOS: screenshots only, or ask the user to play in the
Simulator (Xcode → Open Developer Tool → Simulator).

## 4. Standard-version regression (mandatory)

In Chrome at `http://localhost:3333/` (no `?mobile`): `MOBILE === false`,
`GAME_W === 1600`, `GAME_H === 900`, no `#vkb` / `#m-ui`, `VKB`/`MobileUI` null.
Start a game and check the untouched values (`speedScale` 1, word font 30px,
HUD 28px, `PROD_X` 95, `LANE_TOP` 130), force a game over: Phaser stats + DOM
form, Escape → Phaser HALL OF FAME. Any difference = bug in the mobile change.

Finish: stop what you started (`pkill -f "cap run android"`, emulator if you
launched it), report what was verified and what was not.
