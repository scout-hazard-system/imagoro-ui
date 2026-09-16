import type { Graph, GraphNode, GraphWire } from "./model.js";
import { createGraph } from "./model.js";

export interface LayoutOptions {
  nodeW?: number;
  nodeH?: number;
  gapX?: number;
  gapY?: number;
}

const DEFAULT_OPTS: Required<LayoutOptions> = { nodeW: 200, nodeH: 44, gapX: 120, gapY: 24 };

function collectionOrder(nodes: GraphNode[], wires: GraphWire[]): { inDeg: Map<string, number>; outAdj: Map<string, string[]> } {
  const inDeg = new Map<string, number>();
  const outAdj = new Map<string, string[]>();
  for (const n of nodes) {
    inDeg.set(n.instanceId, 0);
    outAdj.set(n.instanceId, []);
  }
  for (const w of wires) {
    inDeg.set(w.to.instanceId, (inDeg.get(w.to.instanceId) ?? 0) + 1);
    outAdj.get(w.from.instanceId)?.push(w.to.instanceId);
  }
  return { inDeg, outAdj };
}

/** Assign monotonic DAG layers (Kahn's algorithm, deterministic tie-break by instanceId). */
export function layerGraph(g: Graph): Map<string, number> {
  const layer = new Map<string, number>();
  const { inDeg, outAdj } = collectionOrder(g.nodes, g.wires);
  const ready = g.nodes
    .filter((n) => (inDeg.get(n.instanceId) ?? 0) === 0)
    .map((n) => n.instanceId)
    .sort();
  const queue = [...ready];
  let maxLayer = -1;
  while (queue.length > 0) {
    const current = queue.shift() as string;
    const l = layer.get(current) ?? 0;
    layer.set(current, l);
    maxLayer = Math.max(maxLayer, l);
    const next = [...(outAdj.get(current) ?? [])].sort();
    for (const target of next) {
      const targetLayer = layer.get(target) ?? 0;
      const candidate = l + 1;
      if (candidate > targetLayer) layer.set(target, candidate);
      const remaining = (inDeg.get(target) ?? 1) - 1;
      inDeg.set(target, remaining);
      if (remaining === 0 && !queue.includes(target)) queue.push(target);
    }
  }
  const placed = new Set(layer.keys());
  for (const n of g.nodes) {
    if (!placed.has(n.instanceId)) layer.set(n.instanceId, maxLayer + 1);
  }
  return layer;
}

/** Deterministic layered layout: column = layer, row = sorted index within layer. */
export function layoutDag(g: Graph, opts: LayoutOptions = {}): Graph {
  const o = { ...DEFAULT_OPTS, ...opts };
  const layer = layerGraph(g);
  const next = createGraph({ viewport: { ...g.viewport }, wires: [...g.wires] });
  const byLayer = new Map<number, string[]>();
  for (const n of g.nodes) {
    const l = layer.get(n.instanceId) ?? 0;
    const bucket = byLayer.get(l) ?? [];
    bucket.push(n.instanceId);
    byLayer.set(l, bucket);
  }
  for (const bucket of byLayer.values()) bucket.sort();
  const rowIndices = new Map<string, number>();
  for (const bucket of byLayer.values()) {
    bucket.forEach((id, row) => rowIndices.set(id, row));
  }
  for (const n of g.nodes) {
    const l = layer.get(n.instanceId) ?? 0;
    const row = rowIndices.get(n.instanceId) ?? 0;
    next.nodes.push({
      ...n,
      inputs: [...n.inputs],
      outputs: [...n.outputs],
      position: { x: l * (o.nodeW + o.gapX), y: row * (o.nodeH + o.gapY) }
    });
  }
  return next;
}

export function graphBounds(g: Graph): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const n of g.nodes) {
    minX = Math.min(minX, n.position.x);
    minY = Math.min(minY, n.position.y);
    maxX = Math.max(maxX, n.position.x);
    maxY = Math.max(maxY, n.position.y);
  }
  if (g.nodes.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  return { minX, minY, maxX, maxY };
}