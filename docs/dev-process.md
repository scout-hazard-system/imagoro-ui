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

Gated track — config/scaffold only until a Linux maintainer runs it. There is
**no Linux support on the Windows host**, by design. Full instructions:
infra/flatpak/README.md.

```bash
# on a Linux machine (or WSL2 with systemd):
flatpak install -y org.gnome.Sdk//46 org.gnome.Platform//46
# build the .flatpak bundle via flatpak-builder + the Tauri release binary
# (GitHub Action: .github/workflows/flatpak.yml)
```

## Android / open-source alternatives

Gated track — the Android SDK + JDK are **not** available on the issuing
Windows host, so `infra/webview-android` is a scaffold plus docs. Two options:

1. **Tauri v2 Android** (recommended, shares the web shell): run
   `pnpm tauri android init` then `pnpm tauri android build` on a machine with
   Android Studio SDK + JDK 17. Emits a native APK wrapping the same renderer
   that Flatpak/desktop use. See infra/webview-android/README.md.
2. **Open-source WebView host** (zero-Tauri-option fallback): the scaffold's
   `MainActivity.kt` loads `apps/command-center/dist` from assets, so any
   WebView-capable Android app (or a F-Droid build) can run the shell with no
   proprietary SDK. Play notes & F-Droid flavor notes are in the same README.

## Orchestration model (Kepler)

Each milestone = branch + stacked PR (PR base is the immediate predecessor
branch; retarget to `main` as predecessors merge). Companion
scripts/smoke-m*.mjs gate the "done" signal; `output/*_OK.txt` is the artifact.
Sub-agents: one per milestone branch+worktree in this repo (or its Kepler
worktree clone); share the task's Kepler note as durable memory, never edit
PRs/branches of other milestones. Local-Ollama-only policy applies to any agent
driving LLM work; all external deps stay in pnpm-lock.yaml / Cargo.lock.