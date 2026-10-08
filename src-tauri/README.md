# src-tauri — Tauri v2 desktop shell for the Command Center

Wraps the `@imagoro/command-center` web build (React-first, `packages/renderer-react` + 12 block families)
in a native desktop shell (WebView2 on Windows, webkit2gtk on Linux/Flatpak). React is the only UI —
this crate is just the window + capabilities.

`tauri.conf.json` (beside `Cargo.toml`) points at `../apps/command-center/dist` (`beforeBuildCommand` builds it).

## Status

**Desktop bundle builds on Windows (verified).** Requirements below are installed on the reference
host: Rust 1.98 stable-msvc, VS Build Tools 2022 + Windows SDK, WebView2, `@tauri-apps/cli` (root
devDependency). Linux/Flatpak and Android tracks remain gated (see `infra/flatpak/`,
`infra/webview-android/`, `docs/dev-process.md`).

## Prerequisites (Windows)

1. **Rust toolchain** — `winget install Rustup.Rustup` then `rustup default stable`; verify `cargo --version`.
2. **MSVC Build Tools** — `winget install Microsoft.VisualStudio.2022.BuildTools` with the
   "Desktop development with C++" workload (MSVC linker + Windows SDK; rustc locates it via vswhere).
3. **WebView2 runtime** — preinstalled on Windows 11 / recent Win10.
4. **tauri-cli** — already a root devDependency (`@tauri-apps/cli`).

## Commands (run from src-tauri/)

```
pnpm tauri dev      # dev URL http://localhost:8790 via beforeDevCommand (vite, strictPort :8790)
pnpm tauri build    # release bundle (msi/nsis on Windows, web/AppImage on Linux)
```

## Notes

- `tauri.conf.json` → `build.frontendDist` is `../apps/command-center/dist`; `beforeDevCommand` starts the
  command-center vite server at `:8790` (proxy `/api` → `127.0.0.1:18080`).
- Capabilities (`src-tauri/capabilities/default.json`) allow `core:default` + `core:event:default` +
  `opener:default` for the `main` window only.
- The SSE `/api/pipeline/stream` and blackboard `:8765` endpoints remain out-of-process; Tauri only hosts
  the frontend (same architecture as the web build).
- Icons: `pnpm tauri icon <svg-or-png>` generates the `icons/` set if a custom icon is ever needed.
- Flatpak (Linux) packaging for this shell: `infra/flatpak/` (M6). Android: `infra/webview-android/` (M6).
## Scout Harness (second desktop profile)

The same Rust shell also packages the **Harness Console** (`apps/harness-console`) as a standalone app:

```
pnpm harness:dev     # dev URL http://localhost:8791
pnpm harness:build   # NSIS installer: target/release/bundle/nsis/Scout Harness_<ver>_x64-setup.exe
```

- `tauri.harness.conf.json` is merged over `tauri.conf.json` (`--config`): product "Scout Harness",
  identifier `org.scout.harness`, binary `scout-harness.exe`, frontend `../apps/harness-console/dist`.
- Kao traffic goes through the native `kao_rpc` command, not the network from the page: the gateway URL
  (`IMAGORO_MCP_URL`, default `http://10.66.2.2:19001` on the Scout mesh) and the token
  (`%USERPROFILE%\.scout-mesh\kao-gateway.token`, or `KAO_TOKEN_FILE`) are resolved in Rust, so the page can
  neither read the token nor send it elsewhere. The CSP keeps `connect-src` to `'self'` + IPC.
- `stack_status` probes the local engines (Ollama :11435, tool-role proxies :11434/:11436), the NUC engine,
  Kao and the blackboard; `stack_start` runs `%USERPROFILE%\bin\start-ollama-local.cmd` (the same script the
  Windows Startup folder uses).
