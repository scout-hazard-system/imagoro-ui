# blocks

One package per block family per the plan. Families: `map`, `route`, `chat`, `console`,
`terminal`, `metrics`, `audit`, `weather`, `audio/visualizer`, `pipeline`, `blackboard`,
`cluster`.

Added incrementally in M2 (web families first), each: manifest + implementation, registered in
`@imagoro/core` registry, mounted through the dev harness, verified against
`packages/core/fixtures/events.json`. Acceptance in `docs/block-spec.md` §7.