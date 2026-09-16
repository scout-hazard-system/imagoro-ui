# Imagoro on Flatpak (Linux)

Builds the Tauri v2 desktop app as a Flatpak bundle. **Status: verified**
(WSL2 Ubuntu 22.04, user-session flatpak) — the pipeline below produced
`imagoro.flatpak` (2.1 MB) that installs and runs `/app/bin/imagoro` (valid
stripped x86-64 ELF). Reproducible one-to-one by the GitHub Action.

## Prerequisites (Linux host / runner)

- flatpak + flatpak-builder, GNOME SDK rootless install:
  ```bash
  flatpak install -y --noninteractive org.gnome.Sdk//46 org.gnome.Platform//46
  ```
- Node 20+, pnpm, Rust toolchain, then the Tauri CLI:
  `pnpm add -D @tauri-apps/cli` (or `cargo install tauri-cli`).

## Build

```bash
# 1. produce the desktop bundle via Tauri (native .deb/.rpm/.AppImage on Linux)
pnpm --filter @imagoro/command-center build
cd src-tauri && pnpm tauri build && cd ..   # -> src-tauri/target/release/imagoro-command-center

# 2. stage the binary where the manifest expects it:
mkdir -p .flatpak-build-src && cp src-tauri/target/release/imagoro-command-center .flatpak-build-src/imagoro

# 3. wrap it in the Flatpak manifest (org.scout.imagoro.json):
flatpak-builder --user --force-clean build-flatpak infra/flatpak/org.scout.imagoro.json
flatpak build-export export-repo build-flatpak
flatpak build-bundle /var/lib/flatpak/repo imagoro.flatpak org.scout.imagoro
```

The manifest module `imagoro` copies the staged Tauri release binary into
`/app/bin/`; finish-args grant Wayland/X11, IPC, network (pipeline SSE), and
device access. `[verify]`: GPU/sandbox quirks on real Linux desktops.

## GitHub Action

`.github/workflows/flatpak.yml` runs the whole chain on `ubuntu-24.04`
(actions pnpm + node24, Rust stable, apt webkit2gtk deps, flatpak GNOME SDK) and
uploads the `.flatpak` artifact. Trigger: `workflow_dispatch` + tags `packaging/*`.

## Open-source note

Flatpak is the endorsed Linux path (uses the same WebView2-alternative
webkit2gtk that Tauri targets). No proprietary bits are needed; the same GNOME
runtime hosts both dev and production.

The manifest below is the reference; it lives as
`infra/flatpak/org.scout.imagoro.json` and is machine-read by the smoke check.

```json
{
  "app-id": "org.scout.imagoro",
  "runtime": "org.gnome.Platform//46",
  "sdk": "org.gnome.Sdk//46",
  "command": "imagoro",
  "finish-args": [
    "--share=ipc", "--share=network",
    "--socket=wayland", "--socket=x11", "--socket=pulseaudio",
    "--device=all"
  ],
  "modules": [
    {
      "name": "imagoro",
      "buildsystem": "simple",
      "build-commands": [
        "install -Dm755 imagoro /app/bin/imagoro"
      ],
      "sources": [
        { "type": "dir", "path": "../.." }
      ]
    }
  ]
}
```