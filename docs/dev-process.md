# Imagoro — Developer processes

How to run the shared block GUI / node-canvas framework and the Command Center
CRM shell on the three target host classes. Phase-1 dev is **Windows-first**
(M6 scaffolds the Linux/Android pipelines but they are host-toolchain-gated:
this repo's tooling author has no Rust/MSVC/Android SDK, so those tracks are
config-verified only until a maintainer with the toolchains verifies the build).

Workspace layout (pnpm workspaces):

```
packages/core          core: EventBus, BlackboardClient, BlockRegistry, harness, ACL role matrix, fixtures
packages/canvas        node-canvas: immutable graph model (DAG), layout, tasks.yaml importer, Kahn layers
packages/renderer-react React block host: BlockSlot, useBlockState, Harness, app.css (tokens only)
blocks/*                leaf blocks (11 web families + graph canvas) registered via registerAll
apps/command-center    flagship CRM shell composing all blocks; entry for Tauri desktop
src-tauri/           Tauri v2 desktop crate + conf (repo root; devUrl :8790 -> command-center)
infra/flatpak        Flatpak/Linux packaging scaffold (see infra/flatpak/README.md)
infra/webview-android  Android WebView/Tauri-gen scaffold (see infra/webview-android/README.md)
scripts/smoke-m*.mjs   per-milestone verifiers -> output/*_OK.txt (output/ is gitignored)
```

## Windows (phase-1 canonical)

Prerequisites: **node >= 20** (tested on v24), **npm/pnpm 9+**, Git, PowerShell 5.1+.

```powershell
# one-time
corepack enable
corepack prepare pnpm@9.15.0 --activate        # or: npm i -g pnpm@9.15.0
git clone https://github.com/scout-hazard-system/imagoro-ui
cd imagoro-ui
pnpm install

# dev (two launcher apps)
pnpm --filter @imagoro/renderer-react dev      # harness playground (port 8787)
pnpm --filter @imagoro/command-center dev      # CRM shell (port 8790, strict)
# both proxy /api -> 127.0.0.1:18080 (scout pipeline backend)

# verify
pnpm -r test                                   # vitest across all packages/apps/blocks
pnpm -r build                                  # tsc + vite prod bundles (command-center dist/ drives Tauri)
node scripts/smoke-m4.mjs                      # prints/writes M4_OK.txt, M5, M6 have their own
```

Tauri desktop (Windows) — additional prerequisites: **Rust toolchain** (rustup),
**MSVC Build Tools** (link.exe), **WebView2** (usually present on Win10/11),
`cargo tauri` (from `@tauri-apps/cli`). Then:

```powershell
pnpm --filter @imagoro/command-center build
pnpm tauri dev    # run from src-tauri/ (tauri.conf.json sits beside Cargo.toml there)
```

> **Status**: desktop bundle builds on Windows (verified). Prereqs are installed on the reference host;
> see src-tauri/README.md.

## Flatpak (Linux)

**Verified** on WSL2 (Ubuntu 22.04, user-session flatpak). Full path:

1. Linux toolchain inside WSL2: rustup (stable), Node 24 + pnpm 9 (via
   `/opt/node/bin`), apt deps `libwebkit2gtk-4.1-dev librsvg2-dev patchelf file
   build-essential libxdo-dev libssl-dev libayatana-appindicator3-dev`.
2. Flatpak: `flatpak remote-add --user --if-not-exists flathub
   https://dl.flathub.org/repo/flathub.flatpakrepo` then `flatpak --user
   install -y --noninteractive org.gnome.Sdk//46 org.gnome.Platform//46`.
3. Desktop bundle (from `src-tauri/`): `pnpm tauri build` → `.deb`, `.rpm`,
   `.AppImage` + release binary `src-tauri/target/release/imagoro-command-center`.
4. Flatpak wrap (from repo root):
   ```bash
   mkdir -p .flatpak-build-src
   cp src-tauri/target/release/imagoro-command-center .flatpak-build-src/imagoro
   flatpak-builder --user --force-clean --ccache flatpak-build infra/flatpak/org.scout.imagoro.json
   flatpak build-export export-repo flatpak-build
   flatpak build-bundle export-repo imagoro.flatpak org.scout.imagoro
   ```
5. The `.flatpak` bundle installed fine (`app/org.scout.imagoro/x86_64/master`)
   and `/app/bin/imagoro` is a valid stripped x86-64 ELF.

GitHub Action `.github/workflows/flatpak.yml` runs the same chain on `ubuntu-24.04`.

## Android / open-source alternatives

**Verified** (Windows reference host): the Tauri v2 Android route produces a
native APK from the same web shell. Prereqs already installed on the reference
host: JDK 17 (`C:\Users\gryph\.jdks\jdk-17.0.20.1+1` — AGP/Gradle reject the
JDK 25 that Android Studio bundles), Android SDK with cmdline-tools + NDK
(r27c; install via `sdkmanager "ndk;27.2.12479018"` after accepting licenses),
rust android targets (`rustup target add aarch64-linux-android
armv7-linux-androideabi i686-linux-android x86_64-linux-android`).

From `src-tauri/` with `JAVA_HOME`/`ANDROID_HOME` set:
`pnpm tauri android init` then `pnpm tauri android build --apk`. Verified
artifact: `gen/android/app/build/outputs/apk/universal/release/
app-universal-release-unsigned.apk` (25.9 MB, all four ABIs; release signing
needs a keystore — the debug/CI path can sign with the debug keystore).

The **open-source WebView host** remains as documented: the scaffold's
`MainActivity.kt` loads `apps/command-center/dist` from assets, so any
WebView-capable Android app (or an F-Droid build) can run the shell with no
proprietary SDK. Play notes & F-Droid flavor notes are in infra/webview-android/README.md.

## Orchestration model (Kepler)

Each milestone = branch + stacked PR (PR base is the immediate predecessor
branch; retarget to `main` as predecessors merge). Companion
scripts/smoke-m*.mjs gate the "done" signal; `output/*_OK.txt` is the artifact.
Sub-agents: one per milestone branch+worktree in this repo (or its Kepler
worktree clone); share the task's Kepler note as durable memory, never edit
PRs/branches of other milestones. Local-Ollama-only policy applies to any agent
driving LLM work; all external deps stay in pnpm-lock.yaml / Cargo.lock.