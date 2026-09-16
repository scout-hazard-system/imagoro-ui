# infa/tauri — Tauri v2 desktop shell for the Command Center

Wraps the `@imagoro/command-center` web build (React-first, `packages/renderer-react` + 12 block families)
in a native desktop shell (WebView2 on Windows, webkit2gtk on Linux/Flatpak). React is the only UI —
this crate is just the window + capabilities.

## Status (M4)

Scaffold complete and config-checked. **The desktop build is NOT yet verified on the host** — the
Rust toolchain is not installed on this machine (no `cargo` / `rustc`). Everything below is the
verified path once the toolchain is present.

## Prerequisites (Windows)

1. **Rust toolchain** — install via `winget install Rustup.Rustup` (or https://rustup.rs), then in a new
   terminal: `rustup default stable`. Verify: `cargo --version`.
2. **MSVC Build Tools** — `winget install Microsoft.VisualStudio.2022.BuildTools` with the
   "Desktop development with C++" workload (Tauri v2 needs the MSVC linker + Windows SDK).
3. **WebView2 runtime** — preinstalled on Windows 11 / recent Win10; verify: `Get-AppxPackage
   Microsoft.WebView2Runtime` or run any Edge.
4. **tauri-cli** — `pnpm add -D -w @tauri-apps/cli` (do this at repo root; the lockfile will record it).

## Commands (run from `infra/tauri`)

```
cargo tauri dev      # dev URL http://localhost:8790 (vite dev server must be pnn run separately or via beforeDevCommand)
cargo tauri build    # release bundle (msi/nsis on Windows)
```

or via the repo root package script once `@tauri-apps/cli` is a root devDependency:

```
pnpm tauri --config infra/tauri/tauri.conf.json (from repo root)
```

Icons: run `pnpm tauri icon <svg-or-png>` inside `infra/tauri` to generate the `icons/` set before
the first `cargo tauri build`.

## Notes

- `tauri.conf.json` → `build.frontendDist` points at `../../apps/command-center/dist`; `beforeDevCommand`
  starts the command-center vite server at `:8790` (`strictPort`, proxy `/api` → `127.0.0.1:18080`).
- Capabilities (`capabilities/default.json`) allow `core:default` + `core:event:default` + `opener:default`
  for the `main` window only.
- The SSE `/api/pipeline/stream` and blackboard `:8765` endpoints remain out-of-process; Tauri only hosts
  the frontend (same architecture as the web build).
- Flatpak (Linux) packaging for this shell: `infra/flatpak/` (M6). Android WebView host: `infra/webview-android/` (M6).