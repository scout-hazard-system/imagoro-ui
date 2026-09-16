import { describe, expect, it } from "vitest";
import { layoutDag, layerGraph, graphBounds } from "./layout.js";
import { importTasksYaml } from "./tasksYaml.js";
import { crewTasksDemoYaml } from "./demo.js";
import { createGraph, addNode, type Graph, type GraphNode } from "./model.js";

function demoGraph(): Graph {
  const res = importTasksYaml(crewTasksDemoYaml);
  if (!res.graph) throw new Error(res.error ?? "import failed");
  return res.graph;
}

describe("DAG layout", () => {
  it("lays demo crew DAG into monotonic layers", () => {
    const g = demoGraph();
    const layer = layerGraph(g);
    expect(layer.get("transcribe_task")).toBe(0);
    expect(layer.get("rank_task")).toBe(0);
    expect(layer.get("core_task")).toBe(3);
    for (const w of g.wires) {
      const from = layer.get(w.from.instanceId);
      const to = layer.get(w.to.instanceId);
      expect(from).toBeDefined();
      expect(to).toBeDefined();
      expect((from as number) < (to as number)).toBe(true);
    }
  });

  it("outputs deterministic positions, one column per layer", () => {
    const g = demoGraph();
    const laid = layoutDag(g);
    expect(laid.nodes.map((n) => n.instanceId)).toEqual(g.nodes.map((n) => n.instanceId));
    const xs = [...new Set(laid.nodes.map((n) => n.position.x))].sort((a, b) => a - b);
    expect(xs).toEqual([0, 320, 640, 960]);
    expect(layoutDag(g).nodes).toEqual(laid.nodes);
  });

  it("bounds a single node at the origin", () => {
    const base: GraphNode = {
      instanceId: "x",
      blockId: "b",
      label: "x",
      position: { x: 0, y: 0 },
      config: {},
      inputs: [],
      outputs: []
    };
    const g = addNode(createGraph(), base);
    const bounds = graphBounds(layoutDag(g));
    expect(bounds).toEqual({ minX: 0, minY: 0, maxX: 0, maxY: 0 });
  });
});