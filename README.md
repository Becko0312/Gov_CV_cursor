# ТАХ Анкет — Төрийн албан хаагчийн анкет (Android)

This repository packages the Claude artifact **`tah-anket.jsx`** — a complete
multi-step Mongolian civil service questionnaire form (Маягт 1 • ТАЗ 2022.11.14
тогтоол №600) — into an installable Android APK.

The artifact is copied **verbatim** into `src/TAHAnket.jsx`. It is a self-contained
React component (`application/vnd.ant.react`) with inline styles, a 7-step wizard,
dynamic tables, and a "Save as PDF" print action. A thin Vite + React shell renders
it, and [Capacitor](https://capacitorjs.com/) wraps the built web assets in a native
Android WebView app.

## Prebuilt APK

A ready-to-install debug build is committed at:

```
apk/TAH-Anket-debug.apk
```

Install it on a device/emulator with:

```bash
adb install apk/TAH-Anket-debug.apk
```

- Application ID: `mn.gov.tahanket`
- App name: `ТАХ Анкет`
- Min SDK 22 / Target SDK 34

> The debug APK is signed with the standard Android debug keystore, so it is
> intended for testing/sideloading, not for Play Store distribution.

## Project layout

```
index.html            # Vite entry
src/main.jsx           # Mounts the artifact component
src/TAHAnket.jsx       # The Claude artifact, copied verbatim
capacitor.config.json  # Capacitor app config
android/               # Generated native Android project (Capacitor)
apk/                   # Prebuilt debug APK
```

## Rebuilding the APK

Requirements:

- Node.js 18+
- JDK 17 (Gradle 8.2.1 in the template does not support JDK 21)
- Android SDK with `platforms;android-34` and `build-tools;34.0.0`

Steps:

```bash
# 1. Install JS deps and build the web bundle
npm install
npm run build

# 2. Copy the web assets into the native project
npx cap sync android

# 3. Build the APK (point JAVA_HOME at JDK 17 and set the SDK location)
export JAVA_HOME=/path/to/jdk-17
echo "sdk.dir=/path/to/android-sdk" > android/local.properties
cd android && ./gradlew assembleDebug

# Output: android/app/build/outputs/apk/debug/app-debug.apk
```

## Development (browser)

```bash
npm run dev
```
