# AGENTS.md — imagoro-ui desktop client (Tauri v2)

## What this is

The Tauri v2 desktop shell whose webview loads `apps/command-center`. Produces Windows exe/MSI/NSIS and, on
Linux, deb/rpm/AppImage from the same release binary. The Harness Console desktop build
(`tauri.harness.conf.json` + harness profile) is developed on the `kepler/scout-harness-desktop` branch
(scout-harness.exe). Parent repo: `../AGENTS.md`.

## Layout

```
src-tauri/Cargo.toml, Cargo.lock   Rust crate
src-tauri/tauri.conf.json          app config + devUrl :8790 (sits BESIDE Cargo.toml)
src-tauri/src/                     Rust commands (tauri commands wiring)
src-tauri/capabilities/, gen/, icons/
src-tauri/tauri.harness.conf.json  Scout Harness profile (harness desktop branch only)
```

## Commands

```powershell
pnpm --filter @imagoro/command-center build    # build the web shell first
pnpm tauri dev                                 # run from src-tauri/
pnpm tauri build                               # Windows: exe/MSI/NSIS; Linux: deb/rpm/AppImage
```

## Rules

- `tauri.conf.json` must stay **beside** `Cargo.toml` in `src-tauri/` — the Tauri CLI discovers it
  repo-relative; do not move it to the repo root.
- This crate is a thin render adapter. Block logic lives in `packages/` and `blocks/`, not in Rust; keep
  cargo commands and Rust surface minimal.
- Guard the Kao bridge: gateway URL + token are resolved on the native side (Rust commands), the page never
  sees the token. Remote Kao is reached via a dev proxy with the token server-side.
- Security posture mirrors the repo: local-Ollama-only, HTTPS when serving, no analytics.

## Prereqs (recorded in `docs/dev-process.md`)

Windows: Rust toolchain (rustup), MSVC Build Tools, WebView2. Linux: webkit2gtk-4.1 + friends.
Android: JDK 17, Android SDK/NDK 27 — **not** JDK 25 (AGP/Gradle reject it). Say which track you actually verified.