---
name: mobile-build
description: Build and ship the Typing of the Dev native apps - signed Android APK/AAB, iOS build, app version bump, icon & splash regeneration, signing-key safety. Use when the user asks for an APK, a store build, a new app version or new icons.
---

# Build the mobile apps

The apps embed `public/` (Capacitor `webDir: ../public`), so **always
`npx cap sync` before building** — otherwise the app ships stale game files.
Never keep a live-reload config in a build: `pkill -f "cap run android"`, then
`cap sync` rewrites `capacitor.config.json` without `server.url` (verify:
`grep -c '"server"' mobile/android/app/src/main/assets/capacitor.config.json` → 0).

Environment: `JAVA_HOME=~/Library/Java/JavaVirtualMachines/openjdk-24.0.1/Contents/Home`
(JDK 21–24; Java 25 breaks Gradle 8.14), `ANDROID_HOME=~/Library/Android/sdk`.

## Android release APK / AAB

```bash
npm run check                       # at the repo root, must pass
cd mobile && npx cap sync android
cd android && JAVA_HOME=… ANDROID_HOME=… ./gradlew assembleRelease   # APK (sideload)
#                                        ./gradlew bundleRelease    # AAB (Play Store)
```

Outputs: `app/build/outputs/apk/release/app-release.apk`,
`app/build/outputs/bundle/release/app-release.aab`. Copy the APK to the repo
root as `typing-of-the-dev-mobile-<versionName>.apk` (`*.apk` is git-ignored).

Verify before handing it over:
- signature: `~/Library/Android/sdk/build-tools/36.0.0/apksigner verify --print-certs <apk>`
  (DN `CN=Typing of the Dev`);
- fresh game files: `unzip -p <apk> assets/public/js/main.js | grep APP_VERSION`;
- no dev server: `unzip -p <apk> assets/capacitor.config.json | grep -c server` → 0;
- ideally install on the emulator (`adb uninstall` first if a debug build is
  installed — signatures differ) and launch it.

## Signing key — handle with care

- Key: `~/.keystores/typing-of-the-dev-release.jks` (outside the repo);
  passwords in `mobile/android/keystore.properties` (git-ignored, chmod 600).
  `app/build.gradle` reads it; if absent, the release build is unsigned.
- **Never** commit, print, or paste the passwords/key; never regenerate the key
  if it exists (a new key = the Play Store refuses every update). If it is
  missing on a new machine, ask the user to restore their backup.
- Remind the user to back up both files outside this Mac.

## App version (each store upload)

`mobile/android/app/build.gradle`: `versionCode` (+1 at EVERY upload, integer)
and `versionName` (shown to users). iOS: `MARKETING_VERSION` /
`CURRENT_PROJECT_VERSION` in `mobile/ios/App/App.xcodeproj/project.pbxproj`
(or Xcode → target App → General). The game's own `APP_VERSION` follows
`/release`; the app version may differ.

## iOS build

```bash
cd mobile && npx cap sync ios
npx cap run ios --target <sim-udid>     # simulator build (see /mobile-playtest)
npm run ios                             # opens Xcode for device/App Store builds
```

Device installs and App Store uploads need the user's Apple Developer account
in Xcode (Signing & Capabilities → Team) — the user does that part.

## Icons & splash screens

Source: `mobile/assets-src/icon.html` (HTML/CSS, VT323, game palette; modes
`#icon` 1024, `#fg`/`#bg` Android adaptive 1024, `#splash` 2732). Regenerate:

```bash
cd mobile
CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
r(){ "$CH" --headless=new --disable-gpu --hide-scrollbars --allow-file-access-from-files \
  --virtual-time-budget=3000 --default-background-color=00000000 \
  --window-size=$2,$2 --screenshot=$3 "file://$PWD/assets-src/icon.html#$1"; }
r icon 1024 assets/icon-only.png; r fg 1024 assets/icon-foreground.png
r bg 1024 assets/icon-background.png; r splash 2732 assets/splash.png
cp assets/splash.png assets/splash-dark.png
npx capacitor-assets generate --android --ios \
  --iconBackgroundColor '#050a07' --iconBackgroundColorDark '#050a07' \
  --splashBackgroundColor '#050a07' --splashBackgroundColorDark '#050a07'
```

Look at the PNGs before generating (motif inside the safe zone: ~60% of the
centre for `#fg`, margins for iOS rounded corners). The generator logs one
line per file (~80 files) — that is normal, not a loop. Then rebuild the app.

## Store publishing (user-side)

Google Play: developer account (25 $), AAB upload, listing (icon 512, screenshots,
privacy policy — scores stay on the device, no contact data in the app), content
rating; new personal accounts need a closed test (12 testers × 14 days) before
production. Apple: Developer Program (99 $/yr), TestFlight, review.
