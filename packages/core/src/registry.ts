import type { Block, BlockContext, BlockHandle, BlockManifest, BusEvent, JsonObject, MountSpec } from "./types.js";
import { EventBus } from "./eventbus.js";

export interface RegisteredBlock {
  manifest: BlockManifest;
  impl: Block;
}

export interface MountRecord {
  handle: BlockHandle;
  ctx: BlockContext;
  block: Block;
  slot: HTMLElement;
}

/**
 * BlockRegistry — register block implementations, mount them into DOM slots, and fan
 * dispatch() out to every mounted instance (ordered). This is the engine the routing
 * dashboard's A/B/C `.widget-slot` convention was pointing at.
 */
export class BlockRegistry {
  readonly registry = new Map<string, RegisteredBlock>();
  readonly mounts = new Map<number, MountRecord>();
  private readonly bus = new EventBus();
  private nextMountId = 1;

  register(id: string, impl: Block): void {
    if (!impl || !impl.manifest) throw new Error(`block '${id}' missing manifest`);
    this.registry.set(id, { manifest: impl.manifest, impl });
  }

  unregister(id: string): void {
    for (const [mid, rec] of this.mounts) {
      if (rec.block.manifest.id === id) this.unmount(mid);
    }
    this.registry.delete(id);
  }

  manifest(id: string): BlockManifest | undefined {
    return this.registry.get(id)?.manifest;
  }

  list(): BlockManifest[] {
    return [...this.registry.values()].map((r) => r.manifest);
  }

  /** Mount block `id` into `slot`; slot may be a raw element or a `data-slot`-driven one. */
  mount(slot: HTMLElement, spec: MountSpec): BlockHandle {
    const rec = this.registry.get(spec.id);
    if (!rec) throw new Error(`block '${spec.id}' not registered`);
    const id = this.nextMountId++;
    const config = spec.config ?? {};

    const handle: BlockHandle = {
      id,
      slot,
      blockId: spec.id,
      update: (next: Record<string, unknown>) => {
        Object.assign(config, next);
      },
      unmount: () => this.unmount(id),
    };

    const ctx: BlockContext = {
      config,
      dispatch: (evt: BusEvent) => this.bus.publish(evt),
      subscribe: (fn) => this.bus.subscribe(fn),
    };

    this.mounts.set(id, { handle, ctx, block: rec.impl, slot });
    rec.impl.mount(slot, ctx);
    return handle;
  }

  unmount(mountId: number): void {
    const rec = this.mounts.get(mountId);
    if (!rec) return;
    try {
      rec.block.unmount();
    } finally {
      this.mounts.delete(mountId);
    }
  }

  unmountAll(): void {
    for (const id of [...this.mounts.keys()]) this.unmount(id);
  }

  /** Publish to in-process subscribers AND fan out onEvent to every mounted block. */
  dispatch(evt: BusEvent): void {
    this.bus.publish(evt);
    for (const rec of this.mounts.values()) {
      try {
        rec.block.onEvent(evt);
      } catch (err) {
        console.error(`[registry] ${rec.block.manifest.id} onEvent threw:`, err);
      }
    }
  }

  /** Push a shared snapshot (e.g. blackboard /pipeline/snapshot) to every mounted block
   *  via its render() slot. Blocks decide which keys matter. */
  snapshot(obj: JsonObject): void {
    for (const rec of this.mounts.values()) {
      try {
        rec.block.render({ snapshot: obj });
      } catch (err) {
        console.error(`[registry] ${rec.block.manifest.id} render threw:`, err);
      }
    }
  }

  get size(): number {
    return this.mounts.size;
  }
}

export const blocks = new BlockRegistry();