# Imagoro on Android / open-source WebView

Gated track. **Status: scaffold only** — the phase-1 Windows host has no
Android SDK or JDK, so nothing here compiles locally; it is reviewed +
config-verified and CI-ready for a runner that has `android-34` + JDK 17.
Un-verified TODO markers are `[verify]`.

Two supported ways to ship the same command-center shell on Android:

## Option A — Tauri v2 Android (recommended)

Wraps the identical renderer that desktop/Flatpak use; nearest to zero-fork UI.

```bash
pnpm --filter @imagoro/command-center build          # web bundle first
pnpm tauri android init                              # [verify: requires tauri-cli + SDK]
pnpm tauri android build                             # -> src-tauri/gen/android/app/build/outputs/apk
```

- Prereqs on the build machine: Android Studio (SDK `platform;android-34`
  `build-tools;34.0.0`, NDK auto), JDK 17, Rust android targets
  (`rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android`).
- Generated project under `src-tauri/gen/android` is the canonical way to
  reach Play. Same capabilities as on desktop (core:default + event + opener
  live in src-tauri/capabilities).
- `[verify]` the `bundle.identifiers.org.scout.imagoro` in tauri.conf.json
  once gen/android exists; commonly inverted naming, cheap to fix pre-build.

## Option B — Open-source WebView host (F-Droid friendly, zero Tauri)

The scaffold in this folder is a minimal WebView host (`MainActivity.kt`) that
loads `apps/command-center/dist` from app asset, so the shell runs anywhere a
WebView exists with no Google Play Services and no proprietary SDK.

Reference layout:

```
infra/webview-android/
  README.md
  app/src/main/AndroidManifest.xml
  app/src/main/java/org/scout/imagoro/MainActivity.kt   # loads file:///android_asset/www/index.html
```

Build: `gradle assembleRelease` on a machine with JDK 17 + Android Gradle
Plugin 8.x + `compileSdk 34`. WebView bits are all open source (exo-less:
assets come from the repo's vite `dist`, git-tracked via a `[verify]` CI step
that runs `pnpm cc:build` and keeps `app/src/main/assets/www` fresh).

### Play vs F-Droid notes

- **Play**: use Option A (Tauri) — signed APK/AAB, no runtime-permission noise.
- **F-Droid / Aurora / direct-APK**: Option B is smaller and auditable; keep
  `networkSecurityConfig` allowing the lo-input local pipeline (`http://10.0.2.2:18080`)
  for the dev/emulator build only; production should be HTTPS or localhost-only.

### Emulator smoke

```text
adb reverse tcp:18080 tcp:18080        # reach Windows-host pipeline from device
pnpm --filter @imagoro/command-center dev  # serve the shell
# open http://localhost:8790 in the emulator browser first, then the WebView host
```