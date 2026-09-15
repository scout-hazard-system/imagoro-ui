import type { FC } from "react";
import { reactBlockHost } from "./reactBlockHost.js";
import type { BlockPackage, BlockRenderProps } from "@imagoro/core";

export { reactBlockHost };

/** Register a block package `{ manifest, component }` into a core registry under its manifest id. */
export function registerReactBlock(registry: {
  register(id: string, block: unknown): void;
}, pkg: BlockPackage): void {
  registry.register(pkg.manifest.id, reactBlockHost(pkg.manifest, pkg.component as FC<BlockRenderProps>));
}