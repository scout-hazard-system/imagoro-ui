# imagoro-ui — Composable Block GUI + Node Canvas

**One shared React-first codebase running every in-repo front-end of the Scout suite.** Modularity at the forefront; the target product is a multilayered CRM (personal business/analytics → enterprise). Phase 1 poaches the existing UI layer (Java/Kotlin/Python/Qt/Swing/Android) behind a substrate-neutral block contract, then shifts to React as the canonical renderer.

Status: **M0–M6 shipped** (web track verified end-to-end; desktop/Linux/Android tracks config-verified — host lacks Rust/MSVC and Android SDK/JDK). Repo: `scout-hazard-system/imagoro-ui`. Host OS for phase 1: Windows (this machine); Linux/Flatpak and Android/FOSS dev processes documented in `docs/dev-process.md` + `infra/flatpak/` + `infra/webview-android/` (M6).

---

## 0. Decisions locked

- **New repo `imagoro-ui`** — created 2026-09-15 at `https://github.com/scout-hazard-system/imagoro-ui`, Apache-2.0, consumed by all four in-repo front-ends.
- **Desktop shell: Tauri v2** (chosen over native Qt for licensing and integration ease — MIT/Apache-2.0 clean, no Chromium vendoring, one React rendering path across web/desktop/mobile-webview, Linux via webkit2gtk). Native Qt is demoted to **legacy-adapter** status: the installed `scout_crew` PySide6 GUI keeps running until React parity, then retires.
- **React first** — `renderer-react` (Vite + TS) is the canonical renderer from M2 onward.
- **Web-focused now** — Android/Flatpak packaging deferred to M6+; their dev-process notes stay in this plan.
- **Platform now: Windows** — PowerShell runners, `pnpm` workspace, Vite dev server, all localhost/offline-capable, local-Ollama-only policy (never dial remote LLM endpoints).

## 1. Poaching inventory (verified against the four worktrees)

The four repos already converge on the same UI DNA. Phase 1 formalizes what is nearly identical across them.

| Asset to poach | Source (read-only) | Why it's the archetype |
|---|---|---|
| Card-grid + Extensible UI Slots A/B/C + SSE repaint | `routi-can-y-667e5/navigation/frontend/{index.html,app.js,styles.css}` | The web dashboard *is* a block system in substance (card + `.widget-slot` + element-id + `handleEvent()` repaint); only a registry is missing |
| DARK_QSS design tokens | `scout-can-y-a7315/src/scout_crew/gui.py:81` | Palette `#0b1220` ≈ `styles.css` `--bg:#0b1020` ≈ Android `colors.xml` — one `tokens.json` generates all |
| JPanel-implements-Listener block contract | `voxel-can-y-70f9d/java/painter/src/voxel/painter/ui/*.java` (`PainterModel` + `ToolDockPanel`, `OrbitPreviewPanel`, …) | Self-contained panels + typed listener bus + `syncing` guard = a hand-rolled reactive block system (JVM archetype) |
| Pure-Canvas view primitives | `Map3dView.java`, `AudioVisualizerView.java` (routing + android), `routeSketchCanvas`, `visualizerCanvas` (app.js/index.html) | Ready-made node-canvas blocks: map, waveform, sketch |
| Blackboard HTTP store (category-scoped, ACLs, audit) | `scout-can-y-a7315/src/scout_crew/blackboard/{server,client,store,auth}.py` + routing `scout_windows_gui_setup/blackboard/` | The block-data layer AND the seed of CRM permissions (`raw/summary/rewrite` per role, `v1/audit`) |
| Subprocess/JSON-contract boundary | `scout_crew` GUI→CLI via `output/gui_inputs.json` + SSE/snapshot contract | Keeps the React build a drop-in shell swap; engines stay out-of-process |
| MVVM model/data separation | `PainterModel` + `grid/VoxDocument` | The node-graph model pattern (UI-agnostic document) |
| Multi-surface, one backend | routing Java backend `:18080` → web / Android / Android Auto / Crew GUI | Proof "one contract, many substrates" already works |
| Generator/patch dev pattern | `voxel-can-y-70f9d/scripts/_write_*.py`, `_patch_*.py` | Anchor-verified, idempotent scripted mutation → template for sub-agent worktree patches |

Negative findings:
- **No node-graph exists anywhere yet** — the canvas layer is greenfield; the seed graphs already in-data are `tasks.yaml` crew DAG, pipeline→backend→frontend flow, and weapon-parts composition.
- The voxel C++ engine has **zero UI** (nothing to poach except the PowerShell build/launch tooling).
- `secure-mesh-navigation`'s real code lives on non-default branches (`origin/scout/android-distribution-preview`, `origin/main-1`); materialize those worktrees before porting.

## 2. Architecture (modularity-first)

Substrate-neutral by design: a block's **contract is JSON**; every runtime (web/React/Qt/Compose) is just a **RenderAdapter** for the same contract. React becomes canonical without touching block logic.

- **Block** — self-contained unit: `manifest` (id / name / version / family / size / ports / capabilities / substrates) + lifecycle `mount / render / onEvent / unmount`. Formalizes the Slots convention and the JPanel contract.
- **BlockRegistry** — `blocks.register(id, impl)`, `blocks.mount(slot, config)`. The engine the A/B/C slots were pointing at.
- **Event bus, two tiers** — live: SSE `event_type` + typed payload (already standard everywhere); persisted: blackboard category-scoped keys (`blackboard` `:8765`). Blocks subscribe/publish to both.
- **Design tokens** — single `design/tokens.json` → generated CSS custom properties (now), QSS and Compose/Android color generators (later).
- **Node canvas** — a block instance = node with typed in/out ports; edges = dataflow; `graph.json` serialization; imports `tasks.yaml` crew DAG as a starter graph.
- **Boundaries** — blocks speak only to the shared contract; engines stay out-of-process (proven pattern).

Proposed layout (this repo):

```
imagoro-ui/
  packages/core/           # block spec, registry, event bus, fixtures, dev harness
  packages/renderer-react/ # React canonical renderer (Vite + TS)
  packages/adapter-jvm/    # stub — documents the Swing/Android port (from PainterModel etc.)
  packages/adapter-qt/     # stub — documents the PySide6 port (from scout_crew gui.py)
  blocks/                  # one package per family: map route chat console terminal
                           #   metrics audit weather audio/visualizer pipeline blackboard cluster
  apps/                    # flagship "Command Center" CRM shell (M4+), harnesses, demos
  infra/                   # flatpak/ (M6), webview-android/ (M6), tokens generators
  src-tauri/               # Tauri v2 desktop crate + tauri.conf.json (M4+)
  docs/                    # PLAN.md, block-spec.md, design-tokens.md
  design/                  # tokens.json (single source of truth)
```

## 3. Phases

- **M0 — Spec & tokens** *(done)*: `docs/block-spec.md` v0.1, consolidated `design/tokens.json`, `PLAN.md`. Emissions: CSS-vars generator; QSS/Compose generator stubs.
- **M1 — Core** *(done, PR #2, `5f4fdc1`)*: `packages/core`: `BlockRegistry` (`register/mount/unmount/dispatch`), `EventBus` (in-process emitter + SSE client for `/api/pipeline/stream` + blackboard `:8765` client), `fixtures/events.json` (replay snapshot + event stream), dev harness rendering any registered block against fixtures. TS, strict.
- **M2 — React renderer + block ports** *(done, PR #2)* web families: map (Leaflet), route, metrics, audit/notification, weather, audio/visualizer canvas, chat, console/log, terminal, blackboard-watcher, pipeline-monitor (+ graph in M3). Parity harness replays the same fixtures against React and legacy adapters; JVM/Qt adapters remain doc-only stubs.
- **M3 — Node canvas** *(done, PR #3, `3ac7bd3`)*: graph model + editor (pan/zoom/connect with type+cycle validation), `graph.json` + tasks.yaml-crew-DAG import, Kahn deterministic layout; SVG canvas block + embedded crew demo.
- **M4 — Tauri desktop shell + flagship** *(done, PR #4 `8cca883`)*: `apps/command-center` CRM shell composes all 12 blocks in 5 section workspaces (single EventBus); Tauri v2 scaffold at repo root (`tauri.conf.json` + `src-tauri/`, desktop bundle verified on Windows).
- **M5 — CRM layering** *(done, PR #5)*: blackboard ACL → role matrix (personal / business / enterprise) in `packages/core/src/acl.ts`, `canRead/canWrite/maskSnapshot`, BlackboardClient write-gating; audit category enterprise-only.
- **M6 — Packaging** *(done, PR #6)*: Flatpak (`infra/flatpak/org.scout.imagoro.json`, GNOME 46 runtime, CI workflow) + Android (`infra/webview-android/`: Tauri-v2 route + open-source WebView host, Play/F-Droid notes) + `docs/dev-process.md`.

## 4. Dev processes (per platform)

### Windows (now)
- PowerShell runner at repo root (`launch.ps1`-style `-Action` switch, pattern from `voxel-can-y-70f9d/scripts`).
- `pnpm` workspace; dev server = Vite proxying `/api/*` → `http://127.0.0.1:18080` (+ `/api/pipeline/stream` SSE; fallback to routing `dev_server.py`).
- `uv` for any Python side-tools; everything runs localhost/offline.
- **Local-Ollama-only policy**: never configure remote LLM endpoints.
- Every milestone ends with a smoke artifact: `output/M<n>_OK.txt`.

### Flatpak Linux (M6+)
- Flatpak manifests per app + `Scout-Crew.desktop` integration (desktop entry already exists upstream).
- Ollama outside the sandbox, reached at `127.0.0.1:11434`; GPU via `--device=dri`; mesh/Tailscale via network access.
- AppImage as interim target; CI via `flatpak/flatpak-github-actions`.

### Android / open-source (M6+)
- Gradle module split already proven (app + `frontend-ui` library); keep FOSS/Play flavors and car-app flavor-gating.
- **WebView-hosted React shell first** (one codebase for web + Android, no Play deps); native Compose ports later, block-by-block.
- Leaflet stays the OSS map default; Google APIs remain key-guarded/optional (already the case upstream).

## 5. Kepler orchestration

- Repos (ids, for worktree creation): `scout_crew` = `2d97168a-2294-4354-b1ed-6c46c25b0a98`; `secure-mesh-navigation` = `582104e8-8125-4855-8277-d8063e6d08c9`; `routing-scouting-app-to-be-named` = `067a3dd7-2cba-4fd1-9cd6-2f97795ba270`; `voxel-fps-engine-0.0` = `a6d8ed0d-2321-4037-806b-e4e5b388d724`; **`imagoro-ui`** = new (pending registration in Kepler).
- Existing worktrees = **read-only poach sources**: `scout-can-y-a7315`, `secur-can-y-b8697`, `routi-can-y-667e5`, `voxel-can-y-70f9d`.
- Discipline: one worktree (fresh branch) per block family; durable decisions → `kepler-workspace_add_task_note`; each PR → `kepler-workspace_attach_link`; every agent ends with a smoke artifact. Port = read + reference only; never modify the four source worktrees.

## 6. Open questions (decided at M2/M4/M5)

1. **React 19 vs 18** → **18.3.1** across renderer + shell (canonical; pin, don't float).
2. **Block state: Zustand vs Redux Toolkit** → **neither**. Shared `EventBus` + per-block `useBlockState` (BlockContext) is sufficient at this scale; a store would duplicate the bus.
3. **Canvas: custom vs `@xyflow/react`** → **custom** SVG renderer in `blocks/graph` (SSR-safe, token-styled, no extra dep); graph model lives UI-agnostic in `packages/canvas`.
4. **CRM storage** → blackboard SQLite (local/personal tier) → Postgres at business/enterprise tier; ACL matrix (`personal`/`business`/`enterprise`) is enforced at the client (`BlackboardClient`) and will mirror server-side at the enterprise tier.
5. **Stacking/PR flow** → each milestone is a branch + smoke-gated PR stacked on its predecessor; retarget to `main` as the chain merges (PRs #2–#6 currently stacked).