# AGENTS.md — imagoro-ui

## What this is

One shared, React-first codebase for every in-repo front-end of the Scout suite: a composable **block GUI**
plus **node-based canvas**, architected modularity-first toward a multilayered CRM (personal → enterprise).
Status: M0–M6 shipped; Phase-2 on staging tracks. Apache-2.0.

## Home project — branch-project overview

This root is the home project. Project roots throughout the repo carry their own AGENTS.md with what is unique to them.

| Branch project | Path | Overview | Own AGENTS.md |
|---|---|---|---|
| Block core | `packages/core` | block spec, BlockRegistry, EventBus, BlackboardClient, ACL role matrix, fixtures, dev harness | |
| Node canvas | `packages/canvas` | immutable DAG graph model, layout, `tasks.yaml` import, Kahn layers | |
| imagoro-image | `packages/image` | typed assembly manifest `imagoro.image/v1`, builder + verifier (Vite SSR, Node-loadable) | |
| React renderer | `packages/renderer-react` | BlockSlot, useBlockState, Harness, tokens-only CSS | |
| Blocks | `blocks/*` | 12+ web block families (map, route, metrics, audit, weather, audio/visualizer, chat, console, terminal, blackboard, pipeline, graph); React-free `./manifest` subpath + `./catalog` | |
| Command Center | `apps/command-center` | flagship CRM shell; Tauri desktop entry; emits `dist/imagoro-image.json` on build | |
| Harness Console | `apps/harness-console` | agentic control plane app driven over the Kao gateway | |
| Desktop client | `src-tauri` | Tauri v2 desktop crate + `tauri.conf.json` | `src-tauri/AGENTS.md` |
| Linux distribution | `infra/flatpak` | Flatpak bundle + deb/rpm/AppImage desktop bundles | `infra/flatpak/AGENTS.md` |
| Android | `infra/webview-android` | open-source WebView host + Tauri-gen APK scaffold | |
| Design | `design/tokens.json` | single source of truth for tokens; CSS/QSS/Compose generators | |

## Commands (Windows, phase-1 canonical)

```powershell
corepack enable; corepack prepare pnpm@9.15.0 --activate
pnpm install
pnpm -r test                                  # vitest across packages/apps/blocks
pnpm -r build                                 # tsc + vite prod bundles
pnpm dev                                      # harness playground (:8787)
pnpm cc:dev                                   # Command Center (:8790; /api/* -> 127.0.0.1:18080)
node scripts/smoke-m{4,5,6,7}.mjs             # milestone gates -> output/M<n>_OK.txt
pnpm smoke:a2                                 # Phase-2 back-port gate
```

## Conventions

- React **18.3.1 pinned**, not floated. No Zustand/Redux — shared EventBus + per-block `useBlockState`.
- Custom SVG canvas in `blocks/graph`; no `@xyflow`. Graph model stays UI-agnostic in `packages/canvas`.
- Substrate-neutral contract: a block's contract is JSON; each block splits its manifest into a React-free `src/manifest.ts` and re-exports it from `index.tsx` (block packages expose a `./manifest` subpath).
- Blackboard ACL matrix (`personal`/`business`/`enterprise`) enforced in the client (`BlackboardClient`); mirrors server RLS at the enterprise tier.
- Local-Ollama-only policy: never configure remote LLM endpoints.
- Milestone discipline: branch + stacked PR (base = immediate predecessor; retarget to main as the chain merges) + smoke artifact `output/M<n>_OK.txt`.

## Gotchas

- Desktop/Linux/Android tracks are host-toolchain-gated (Rust/MSVC, Android SDK/JDK 17 — not JDK 25). Config-verified ≠ built; say which.
- Phase-2 staging worktrees: `staging/p2-c-image` (imagoro-image + Linux/desktop bundles verified), `staging/p2-a-consume` (consumer back-port from `imagoro`). Commit there only on an explicit user `go`.
- `packages/adapter-jvm` and `packages/adapter-qt` are doc-only stubs (Swing/Android, PySide6 ports) — do not treat them as implemented.