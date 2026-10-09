# AGENTS.md — imagoro-ui Linux distribution (Flatpak + desktop bundles)

## What this is

The Linux packaging track for the imagoro / command-center client: a Flatpak bundle plus native
`.deb` / `.rpm` / `.AppImage` desktop bundles, all built from the same `pnpm tauri build` release binary.
This is the Linux distribution project for imagoro-ui. Parent repo: `../AGENTS.md`.

## Files

```
infra/flatpak/org.scout.imagoro.json   Flatpak manifest (GNOME 46 runtime, app id org.scout.imagoro)
infra/flatpak/README.md                track notes
.github/workflows/flatpak.yml          CI running the same chain on ubuntu-24.04
docs/dev-process.md                    authoritative verified runbook (WSL2)
```

## Build (verified on WSL2 Ubuntu 22.04, user-session flatpak)

1. Linux toolchain in WSL2: rustup stable, Node 24 + pnpm 9, apt deps
   `libwebkit2gtk-4.1-dev librsvg2-dev patchelf file build-essential libxdo-dev libssl-dev libayatana-appindicator3-dev`.
2. `flatpak remote-add --user --if-not-exists flathub ...` then install
   `org.gnome.Sdk//46` + `org.gnome.Platform//46` (`--user -y`).
3. Desktop bundles, from `src-tauri/`: `pnpm tauri build` → `.deb`, `.rpm`, `.AppImage` + release binary.
4. Flatpak wrap, from repo root:
   ```bash
   mkdir -p .flatpak-build-src
   cp src-tauri/target/release/imagoro-command-center .flatpak-build-src/imagoro
   flatpak-builder --user --force-clean --ccache flatpak-build infra/flatpak/org.scout.imagoro.json
   flatpak build-export export-repo flatpak-build
   flatpak build-bundle export-repo imagoro.flatpak org.scout.imagoro
   ```
5. Verified: the `.flatpak` installs (`app/org.scout.imagoro/x86_64/master`), `/app/bin/imagoro` is a
   valid stripped x86-64 ELF.

## Related distribution work

- **Full OS image** (the "distributing a whole box" track): sibling repo `imagoro-trixie` — Debian 13
  Trixie live/install hybrid ISO + Ventoy carrying the imagoro client and its test-suite; plan is
  `imagoro/docs/INSTALLER-CLIENT-TRIXIE.md` (shipped scaffold at `Imagoro-Gibibyte/imagoro-trixie`).
- **Signed artifact distribution**: imagoro `dist/` repo-dist system (Ed25519-signed catalog, profiles, OTA).
- Android Tauri/WebView track: `../infra/webview-android`.

## Rules

- Ollama stays outside the sandbox at `127.0.0.1:11434`; GPU via `--device=dri`; mesh/Tailscale via network access.
- Nothing in the bundle phones home.
- Live-build requires root → WSL2 on this host; all deb/repo/verify steps run fine on Windows/WSL interchangeably
  (drvfs strips +x on Windows — the ISO build restores it).