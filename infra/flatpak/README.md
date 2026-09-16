# Imagoro on Flatpak (Linux)

Gated track: builds the Tauri v2 desktop app as a Flatpak bundle. **Status:
scaffold only.** It cannot be exercised from the phase-1 Windows host (no Rust,
no Linux); it is reviewed/config-verified and CI-ready for any Ubuntu/Linux
runner. Un-verified TODO markers are `[verify]` below.

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
pnpm tauri build          # -> src-tauri/target/release/imagoro [verify: binary name]

# 2. wrap it in the Flatpak manifest (org.scout.imagoro.json):
flatpak-builder --user --force-clean build-flatpak infra/flatpak/org.scout.imagoro.json
flatpak-builder --user --install build-flatpak org.scout.imagoro
flatpak run org.scout.imagoro --path /app/bin/imagoro
```

The manifest module `imagoro` copies the prebuilt Tauri release binary into
`/app/bin/`; finish-args grant Wayland/X11, IPC, network (pipeline SSE), and
device access. `[verify]`: `--path` behavior, GPU/sandbox quirks, and that the
hardcoded binary name matches `src-tauri`'s `mainBinaryName`.

## GitHub Action

`.github/workflows/flatpak.yml` runs the whole chain on `ubuntu-24.04`
(system `pnpm` via corepack? `[verify]` — action installs it explicitly) and
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