import { useEffect, useState, type ComponentType } from "react";
import type { BlockContext, BlockManifest, BusEvent } from "@imagoro/core";

export interface BlockComponentProps {
  ctx: BlockContext;
}

export type BlockComponent = ComponentType<BlockComponentProps>;

export interface BlockEntry {
  manifest: BlockManifest;
  Component: BlockComponent;
}

export function useBlockState<T>(
  ctx: BlockContext,
  initial: T,
  onEvent: (state: T, evt: BusEvent) => T
): T {
  const [state, setState] = useState<T>(initial);
  useEffect(() => ctx.subscribe((evt) => setState((s) => onEvent(s, evt))), [ctx, onEvent]);
  return state;
}

export function payload(evt: BusEvent): Record<string, unknown> {
  return evt.payload as Record<string, unknown>;
}

export function makeCtx(
  config: Record<string, unknown>,
  bus: { dispatch: (evt: BusEvent) => void; subscribe: (fn: (evt: BusEvent) => void) => () => void }
): BlockContext {
  return {
    config,
    dispatch: (evt: BusEvent) => bus.dispatch(evt),
    subscribe: (fn: (evt: BusEvent) => void) => bus.subscribe(fn)
  };
}

export class ReactBlockHost {
  private readonly map = new Map<string, BlockEntry>();

  get size(): number {
    return this.map.size;
  }

  ids(): string[] {
    return [...this.map.keys()];
  }

  register(id: string, entry: BlockEntry): void {
    if (!entry.manifest || entry.manifest.id !== id) {
      throw new Error(`BlockEntry manifest.id must equal registration id "${id}"`);
    }
    const prev = this.map.get(id);
    if (prev && prev.manifest.version !== entry.manifest.version) {
      throw new Error(
        `block ${id} already registered v${prev.manifest.version}; refusing v${entry.manifest.version}`
      );
    }
    this.map.set(id, entry);
  }

  entry(id: string): BlockEntry | undefined {
    return this.map.get(id);
  }
}