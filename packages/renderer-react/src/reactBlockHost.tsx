import { createElement, type FC } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { Block, BlockContext, BlockManifest, BlockRenderProps, BlockState, BusEvent } from "@imagoro/core";

/**
 * React block host: adapts a `@imagoro/blocks-*` package `{ manifest, component }` into the
 * core `Block` interface so it can live in a BlockRegistry. The component is a React FC over
 * core `BlockRenderProps`; this host owns the react-dom root and drives event → state.
 *
 * Event channel: the registry fans every dispatch() out through both the in-process bus
 * (ctx.subscribe) and block.onEvent, so this host consumes events from onEvent only to
 * avoid double counting.
 */
export function reactBlockHost(manifest: BlockManifest, render: FC<BlockRenderProps>): Block {
  let root: Root | null = null;
  let ctx: BlockContext | null = null;
  let state: BlockState = { events: [] };

  const draw = (): void => {
    if (!root) return;
    const c = ctx;
    const element = createElement(render, {
      manifest,
      config: c?.config ?? {},
      state,
      dispatch: (evt) => c?.dispatch(evt),
    });
    root.render(element);
  };

  return {
    manifest,
    mount(slot, context) {
      ctx = context;
      root = createRoot(slot);
      draw();
    },
    render(next: BlockState) {
      state = next;
      if (root) draw();
    },
    onEvent(evt: BusEvent) {
      const events = Array.isArray(state["events"]) ? [...(state["events"] as BusEvent[])] : [];
      events.push(evt);
      state = { ...state, events };
      draw();
    },
    unmount() {
      root?.unmount();
      root = null;
      ctx = null;
    },
  };
}