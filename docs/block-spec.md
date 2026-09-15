# block-spec v0.1 — imagoro-ui Block Contract

Draft for M0/M1. A **block** is the unit of composable UI. The contract is substrate-neutral
(JSON + TypeScript bindings); every renderer (React canonical, legacy JVM/Qt) is an adapter over
the same contract.

## 1. Definition

```ts
interface BlockManifest {
  id: string;            // namespaced, e.g. "imagoro.map"
  name: string;          // human label ("Integrated Map")
  version: string;       // semver
  family: string;        // map | route | chat | console | terminal | metrics |
                         // audit | weather | audio/viz | pipeline | blackboard | cluster
  substrates: string[];  // ["react"] now; "jvm"|"qt" reserved (legacy adapters, doc-only)
  size: { min: [number, number]; ideal: [number, number] };
  ports: {
    in:  { name: string; type: string }[];   // data inputs (event streams, feeds)
    out: { name: string; type: string }[];   // emitted data (for node-canvas edges)
  };
  theme?: { tokens: string[] };              // token ids consumed from design/tokens.json
  api?: string[];                            // data contracts used, e.g.
                                             //   "pipeline/stream" (SSE), "pipeline/snapshot",
                                             //   "map/scene", "blackboard:<category>"
  lifecycle?: { autostart: boolean };        // subscribe before mount? default true if ports.in
}
```

## 2. Lifecycle

```ts
interface Block {
  manifest: BlockManifest;
  mount(el: HTMLElement, ctx: BlockContext): void;   // render into slot
  render(state: BlockState): void;                    // re-render from state
  onEvent(evt: BusEvent): void;                       // SSE / snapshot / blackboard events
  unmount(): void;                                    // dispose subs, dom, timers
}
```

- `mount` — build DOM/wiring into the slot element; `render` — repaint from state;
  `onEvent` — mutate internal/owned state then call `render`; `unmount` — idempotent teardown.
- Blocks never talk to engines directly; they read/write the shared event bus only.

## 3. Registry

```ts
blocks.register(id, impl);              // idempotent; overwrite requires version check
blocks.mount(slotEl, { id, config });   // returns instance handle {update, unmount}
blocks.dispatch(evt);                   // fan out to mounted subscribers (ordered)
blocks.get(id)                          // manifest lookup for inspectors/canvas
```

- A slot is any element with `data-slot="<blockId>"` (formalizes the routing dashboard's
  `.widget-slot` convention). Missing registry = the gap the A/B/C slots were pointing at.

## 4. Event bus (two tiers)

```ts
interface BusEvent { type: string; ts: number; payload: JsonObject; }  // SSE shape
```

- **Live tier**: SSE `/api/pipeline/stream` (EventSource) + `/api/pipeline/snapshot` fallback.
  `type` is `event_type`; payload typed per type.
- **Persisted tier**: blackboard HTTP store `:8765` — category-scoped keys, per-role ACLs
  (`raw | summary | rewrite`), `v1/audit`. Blocks subscribe to categories they declare in
  `manifest.api` (e.g. `blackboard:pipeline`).
- Both tiers speak `BusEvent` so blocks are transport-agnostic.

## 5. Design tokens

Single source: `design/tokens.json`. Generators emit per-substrate:
`gen.css` (CSS custom properties — implemented M0), `gen.qss`, `gen.android-colors.xml`
(stubs). Blocks consume only token ids, never raw hex.

## 6. Node canvas (M3, forward-reserved)

A **node** = `{ blockId, instanceId, position, config, wires }`. A **wire** connects
`out.port` of one node to `in.port` of another; matching edge types only. A canvas serializes
to `graph.json`. Importers: `tasks.yaml` crew DAG (scout), pipeline flow, weapon-parts compose
(voxel). Port/type system below deliberately follows the three DAGs above.

## 7. Acceptance

- A block is *done* when it renders from `packages/core/fixtures/events.json` in
  `packages/core/harness`, unmounts cleanly, and its family smoke writes `output/<id>_OK.txt`.
- Parity = same fixtures, same layout snapshot in the React renderer and (later) legacy adapters.