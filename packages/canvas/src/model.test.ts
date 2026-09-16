import { describe, expect, it } from "vitest";
import {
  createGraph,
  addNode,
  removeNode,
  connect,
  disconnect,
  reaches,
  serializeGraph,
  loadGraph,
  normalizeGraph,
  validateGraph,
  countNodes,
  countWires,
  type Graph,
  type GraphNode
} from "./model.js";

const SOURCE: GraphNode = {
  instanceId: "src",
  blockId: "imagoro.graph.task",
  label: "source",
  position: { x: 0, y: 0 },
  config: {},
  inputs: [],
  outputs: [{ name: "out", type: "task" }]
};

const SINK: GraphNode = {
  instanceId: "dst",
  blockId: "imagoro.graph.task",
  label: "sink",
  position: { x: 0, y: 0 },
  config: {},
  inputs: [{ name: "in", type: "task" }],
  outputs: []
};

function demoGraph(): Graph {
  return addNode(addNode(createGraph(), SOURCE), SINK);
}

describe("graph model", () => {
  it("createGraph defaults are empty and identity-independent", () => {
    const a = createGraph();
    const b = createGraph();
    expect(a.nodes).toEqual([]);
    expect(a.wires).toEqual([]);
    expect(a.viewport).toEqual({ x: 0, y: 0, zoom: 1 });
    a.viewport.zoom = 2;
    expect(b.viewport.zoom).toBe(1);
  });

  it("addNode is immutable and rejects duplicates", () => {
    const g = demoGraph();
    expect(countNodes(g)).toBe(2);
    expect(countNodes(demoGraph())).toBe(2);
    expect(() => addNode(g, SOURCE)).toThrow(/duplicate/);
  });

  it("removeNode cascades wires", () => {
    let g = demoGraph();
    g = connect(g, { instanceId: "src", port: "out" }, { instanceId: "dst", port: "in" }).graph as Graph;
    expect(countWires(g)).toBe(1);
    const removed = removeNode(g, "src");
    expect(countNodes(removed)).toBe(1);
    expect(countWires(removed)).toBe(0);
    expect(countWires(g)).toBe(1);
  });

  it("connect rejects unknown nodes, self-edges and missing ports", () => {
    const g = demoGraph();
    expect(connect(g, { instanceId: "nope", port: "out" }, { instanceId: "dst", port: "in" }).error).toMatch(/unknown source/);
    expect(connect(g, { instanceId: "src", port: "out" }, { instanceId: "src", port: "in" }).error).toMatch(/self/);
    expect(connect(g, { instanceId: "src", port: "nope" }, { instanceId: "dst", port: "in" }).error).toMatch(/no output port/);
    expect(connect(g, { instanceId: "src", port: "out" }, { instanceId: "dst", port: "nope" }).error).toMatch(/no input port/);
  });

  it("connect enforces matching port types", () => {
    const g = addNode(
      demoGraph(),
      { ...SOURCE, instanceId: "str", outputs: [{ name: "out", type: "string" }] }
    );
    const res = connect(g, { instanceId: "str", port: "out" }, { instanceId: "dst", port: "in" });
    expect(res.error).toMatch(/type mismatch/);
    expect(res.graph).toBeUndefined();
  });

  it("connect wires two nodes and refuses cycles", () => {
    const srcOutput = { ...SOURCE, instanceId: "src", inputs: [{ name: "in", type: "task" }], outputs: [{ name: "out", type: "task" }] };
    const dstOutput = { ...SINK, instanceId: "dst", outputs: [{ name: "out", type: "task" }] };
    let g = createGraph();
    g = addNode(g, srcOutput);
    g = addNode(g, dstOutput);
    g = connect(g, { instanceId: "src", port: "out" }, { instanceId: "dst", port: "in" }).graph as Graph;
    const sink = addNode(g, {
      ...SOURCE,
      instanceId: "mid",
      inputs: [{ name: "in", type: "task" }],
      outputs: [{ name: "out", type: "task" }]
    });
    g = connect(sink, { instanceId: "mid", port: "out" }, { instanceId: "dst", port: "in" }).graph as Graph;
    expect(countWires(g)).toBe(2);
    expect(reaches(g, "src", "dst")).toBe(true);
    expect(reaches(g, "dst", "src")).toBe(false);
    const cycle = connect(g, { instanceId: "dst", port: "out" }, { instanceId: "src", port: "in" });
    expect(cycle.graph).toBeUndefined();
    expect(cycle.error).toMatch(/cycle/);
  });

  it("serialize/load round-trips a full graph", () => {
    let g = demoGraph();
    g = connect(g, { instanceId: "src", port: "out" }, { instanceId: "dst", port: "in" }).graph as Graph;
    g = { ...g, viewport: { x: 12, y: -4, zoom: 1.5 } };
    const json = serializeGraph(g);
    const loaded = loadGraph(json);
    expect(loaded.error).toBeUndefined();
    expect(loaded.graph).toEqual(g);
  });

  it("loadGraph reports bad JSON and bad shapes", () => {
    expect(loadGraph("{oops").error).toMatch(/not valid JSON/);
    expect(loadGraph('"string"').error).toMatch(/must be an object/);
    expect(loadGraph('{"nodes": {}}').error).toMatch(/must be an array/);
    expect(loadGraph('{"nodes":[{"instanceId":"a"},{"instanceId":"a"}]}').error).toMatch(/duplicate/);
  });

  it("normalizeGraph fills defaults and flags malformed wires", () => {
    const ok = normalizeGraph({ nodes: [{ instanceId: "a" }], wires: [] });
    expect(ok.error).toBeUndefined();
    expect(ok.graph?.nodes[0]).toMatchObject({ label: "a", blockId: "unknown.block" });
    expect(ok.graph?.nodes[0]?.position).toEqual({ x: 0, y: 0 });

    const missing = normalizeGraph({
      nodes: [{ instanceId: "a", inputs: [{ name: "in", type: "t" }], outputs: [] }],
      wires: [{ id: "w", from: { instanceId: "ghost", port: "out" }, to: { instanceId: "a", port: "in" } }]
    });
    expect(missing.error).toMatch(/missing node/);
  });

  it("disconnect removes a single wire", () => {
    let g = demoGraph();
    g = connect(g, { instanceId: "src", port: "out" }, { instanceId: "dst", port: "in" }).graph as Graph;
    const wire = g.wires[0] as { id: string };
    const gone = disconnect(g, wire.id);
    expect(countWires(gone)).toBe(0);
    expect(countWires(g)).toBe(1);
  });

  it("validateGraph survives empty graphs", () => {
    expect(validateGraph(createGraph())).toEqual([]);
  });
});