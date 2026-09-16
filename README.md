# imagoro-ui

One shared, React-first codebase for every in-repo front-end of the Scout suite: a composable
**block GUI** + **node-based canvas** system, architected modularity-first toward a multilayered
CRM (personal business/analytics → enterprise).

Apache-2.0. See [`PLAN.md`](./PLAN.md) for the full plan, [`docs/block-spec.md`](./docs/block-spec.md)
for the block contract, and [`design/tokens.json`](./design/tokens.json) for the design tokens.

## Status

- **M0** spec + tokens, **M1** core, **M2** React renderer + 11 web blocks — shipped (PR #2).
- **M3** node canvas (immutable DAG graph, Kahn layout, SVG canvas block) — shipped (PR #3).
- **M4** Command Center shell + Tauri v2 scaffold — shipped (PR #4; rust build pending toolchain).
- **M5** CRM layering: blackboard ACL role matrix — shipped (PR #5).
- **M6** Flatpak + Android/webview scaffolds + dev processes — shipped (PR #6; Linux/Android config-verified).
- See [`docs/dev-process.md`](./docs/dev-process.md) for per-platform runs, `scripts/smoke-m*.mjs` for milestone gates.

## Layout

```
packages/core/           block spec, registry, event bus, fixtures, ACL, dev harness
packages/canvas/         node-canvas graph model (immutable DAG, tasks.yaml import, layout)
packages/renderer-react/ React canonical renderer (Vite + TS)
packages/adapter-jvm/    stub — Swing/Android port docs (from PainterModel, Map3dView)
packages/adapter-qt/     stub — PySide6 port docs (from scout_crew gui.py)
blocks/                  one package per block family (incl. graph canvas)
apps/                    flagship "Command Center" shell + harnesses
infra/                   tauri/, flatpak/, webview-android/ scaffolds
design/                  tokens.json (source of truth) + generators
docs/                    PLAN.md, block-spec.md, dev-process.md
```

## Windows dev (phase 1)

- `pnpm install`; `pnpm -r test` / `pnpm -r build`; shell dev server:
  `pnpm --filter @imagoro/command-center dev` (port 8790; proxy `/api/*` → `http://127.0.0.1:18080`).
- Milestone smoke: `node scripts/smoke-m{4,5,6}.mjs` → `output/M<n>_OK.txt`.
- Local-Ollama-only policy: never configure remote LLM endpoints.