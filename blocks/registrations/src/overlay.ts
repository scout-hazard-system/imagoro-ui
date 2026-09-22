import type { ReactBlockHost } from "@imagoro/renderer-react";
import IntentBlock, { manifest as intentManifest } from "@imagoro/block-intent";
import SidebarBlock, { manifest as sidebarManifest } from "@imagoro/block-sidebar";
import type { BlockManifest } from "@imagoro/core";

export const OVERLAY_CATALOG: BlockManifest[] = [intentManifest, sidebarManifest];

export const OVERLAY_BLOCK_IDS: string[] = [intentManifest.id, sidebarManifest.id];

export function registerOverlay(host: ReactBlockHost): void {
  host.register(intentManifest.id, { manifest: intentManifest, Component: IntentBlock });
  host.register(sidebarManifest.id, { manifest: sidebarManifest, Component: SidebarBlock });
}