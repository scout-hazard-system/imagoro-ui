# imagoro-ui

One shared, React-first codebase for every in-repo front-end of the Scout suite: a composable
**block GUI** + **node-based canvas** system, architected modularity-first toward a multilayered
CRM (personal business/analytics → enterprise).

Apache-2.0. See [`PLAN.md`](./PLAN.md) for the full plan, [`docs/block-spec.md`](./docs/block-spec.md)
for the block contract, and [`design/tokens.json`](./design/tokens.json) for the design tokens.

## Status

- **M0** (spec + tokens): block-spec v0.1, consolidated tokens, CSS generator — done (this checkout).
- **M1** (core: registry, event bus, fixtures, harness) and **M2** (React renderer + block ports): next.

## Layout

```
packages/core/           block spec, registry, event bus, fixtures, dev harness
packages/renderer-react/ React canonical renderer (Vite + TS)
packages/adapter-jvm/    stub — Swing/Android port docs (from PainterModel, Map3dView)
packages/adapter-qt/     stub — PySide6 port docs (from scout_crew gui.py)
blocks/                  one package per block family
apps/                    flagship "Command Center" shell + harnesses (M4+)
infra/                   tauri/ (M4), flatpak/ + webview-android/ (M6)
design/                  tokens.json (source of truth) + generators
docs/                    PLAN.md, block-spec.md
```

## Windows dev (phase 1)

- `pnpm install` then `pnpm dev` (Vite, proxy `/api/*` → `http://127.0.0.1:18080`, SSE passthrough).
- `pnpm build` / `pnpm test` (vitest). Milestone smoke: `output/M<n>_OK.txt`.
- Local-Ollama-only policy: never configure remote LLM endpoints.