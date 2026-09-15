# adapter-qt (stub — doc-only, do not build yet)

Legacy PySide6 (Qt) adapter. Port reference (read-only source, non-modifying):

- `scout-can-y-a7315/src/scout_crew/gui.py` — DARK_QSS theme (already consumed into
  design/tokens.json), and the pane patterns this framework's blocks generalize:
  `ProcessConsole` (live log block), `TerminalPane`, `HermesConversationPane` /
  `DevConversationWindow` (chat block), `BlackboardMonitorPane` + `PipelineMonitorPane`
  (data-watcher blocks), `ScoutMainWindow` form (pipeline-runner block).
- GUI↔engine boundary to preserve: serialize inputs (the `output/gui_inputs.json` contract),
  spawn the CLI subprocess, stream stdout/stderr. Keep engines out-of-process.

Deprecation policy: the installed scout_crew PySide6 GUI keeps running until React reaches
parity on its blocks (M5); then this adapter's parity artifacts document the retirement.
See docs/block-spec.md §7.