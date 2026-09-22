import type { ReactBlockHost } from "@imagoro/renderer-react";
import { registerOverlay, OVERLAY_CATALOG } from "@imagoro/blocks-registrations/overlay";

export { registerOverlay, OVERLAY_CATALOG };

export const OVERLAY_BLOCK_IDS: string[] = OVERLAY_CATALOG.map((m) => m.id);

export function registerCommandCenterOverlay(host: ReactBlockHost): void {
  registerOverlay(host);
}