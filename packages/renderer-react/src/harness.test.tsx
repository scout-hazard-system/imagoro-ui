import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { BlockRegistry, type Block } from "@imagoro/core";
import { loadFixtureSetFromNode } from "@imagoro/core/fixtures.node";
import { reactBlockHost } from "./reactBlockHost.js";
import { ParityPane } from "./ParityPane.js";
import { webBlocks } from "./catalog.js";
import "./harness.css";

describe("M2 harness", () => {
  let host: HTMLElement;
  let registry: BlockRegistry;
  const blocks: Block[] = [];

  beforeEach(() => {
    registry = new BlockRegistry();
    host = document.createElement("div");
    document.body.appendChild(host);
  });

  afterEach(() => {
    act(() => registry.unmountAll());
    host.remove();
  });

  it("registers all 11 web block families from their manifests", () => {
    for (const pkg of webBlocks) {
      registry.register(pkg.manifest.id, reactBlockHost(pkg.manifest, pkg.component as never));
    }
    const ids = registry.list().map((m) => m.id);
    expect(ids).toHaveLength(11);
    for (const want of [
      "imagoro.block.map",
      "imagoro.block.route",
      "imagoro.block.metrics",
      "imagoro.block.audit",
      "imagoro.block.weather",
      "imagoro.block.visualizer",
      "imagoro.block.chat",
      "imagoro.block.console",
      "imagoro.block.terminal",
      "imagoro.block.blackboard",
      "imagoro.block.pipeline",
    ]) {
      expect(ids).toContain(want);
    }
  });

  const mountAndReplay = (): void => {
    for (const pkg of webBlocks) {
      registry.register(pkg.manifest.id, reactBlockHost(pkg.manifest, pkg.component as never));
    }
    const f = loadFixtureSetFromNode();
    for (const pkg of webBlocks) {
      const slot = document.createElement("section");
      host.appendChild(slot);
      registry.mount(slot, { id: pkg.manifest.id });
    }
    for (const evt of f.stream) registry.dispatch(evt);
  };

  it("renders map/chat/metrics from the fixture replay stream", () => {
    void blocks;
    act(() => mountAndReplay());

    const metrics = host.querySelector("[data-mid='imagoro.block.metrics'] .block-metrics__value");
    expect(metrics?.textContent).toBe("12");

    const chatBubbles = [...host.querySelectorAll("[data-mid='imagoro.block.chat'] .block-chat__bubble")];
    expect(chatBubbles.some((b) => b.textContent?.includes("running radar on I-5"))).toBe(true);

    const mapHeaders = host.querySelector("[data-mid='imagoro.block.map'] .block__hint");
    expect(mapHeaders?.textContent).toContain("2 alerts");
  });

  it("audit + pipeline + blackboard consume fixture events too", () => {
    act(() => mountAndReplay());
    expect(host.querySelector("[data-mid='imagoro.block.audit'] .block-audit__item")).toBeTruthy();
    const pipelineStatus = host.querySelector("[data-mid='imagoro.block.pipeline'] .block-pipeline__status");
    expect(pipelineStatus?.textContent).toContain("127.0.0.1:18080");
    const bbTitle = host.querySelector("[data-mid='imagoro.block.blackboard'] .block-blackboard__title");
    expect(bbTitle?.textContent).toContain("vehicle stop");
  });

  it("parity harness normalizes legacy-shaped fixtures to the same canonical events", () => {
    const f = loadFixtureSetFromNode();
    act(() => {
      const container = document.createElement("div");
      host.appendChild(container);
      createRoot(container).render(<ParityPane fixtures={f} />);
    });
    expect(host.querySelector("[data-testid='parity'] .parity__ok")?.textContent).toContain("parity");
    expect(host.querySelectorAll("[data-testid='parity'] .parity__row")).toHaveLength(f.stream.length);
  });
});