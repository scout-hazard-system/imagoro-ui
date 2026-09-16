import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { BlockManifest, BusEvent, Config } from "@imagoro/core";
import type { BlockComponentProps } from "@imagoro/renderer-react";
import {
  type Graph,
  type GraphViewport,
  type PortDef,
  type WireEndpoint,
  connect as connectWire,
  createGraph,
  crewTasksDemoYaml,
  graphBounds,
  importTasksYaml,
  loadGraph,
  normalizeGraph,
  setNodePosition,
  setViewport
} from "@imagoro/canvas";

export const manifest: BlockManifest = {
  id: "imagoro.graph",
  name: "Node Canvas",
  version: "0.1.0",
  family: "graph",
  substrates: ["react"],
  size: { min: [480, 320], ideal: [720, 480] },
  ports: { in: [], out: [{ name: "graph", type: "object" }] },
  api: ["graph/set", "graph/connect"]
};

const NODE_W = 200;
const NODE_H = 48;
const PORT_R = 5;
const PAD = 48;
const MIN_ZOOM = 0.35;
const MAX_ZOOM = 2.8;

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

function portSlot(index: number, count: number): number {
  return (NODE_H / (count + 1)) * (index + 1);
}

function portPoint(node: { position: { x: number; y: number }; inputs: PortDef[]; outputs: PortDef[] }, name: string, side: "in" | "out"): { x: number; y: number } {
  const list = side === "in" ? node.inputs : node.outputs;
  const idx = Math.max(0, list.findIndex((p) => p.name === name));
  const y = node.position.y + portSlot(idx, list.length);
  return side === "in" ? { x: node.position.x, y } : { x: node.position.x + NODE_W, y };
}

function sourceGraph(config: Config): Graph {
  const c = config.graph;
  if (typeof c === "string") {
    const r = loadGraph(c);
    if (r.graph) return r.graph;
  } else if (c && typeof c === "object") {
    const r = normalizeGraph(c);
    if (r.graph) return r.graph;
  }
  if (typeof config.json === "string") {
    const r = loadGraph(config.json as string);
    if (r.graph) return r.graph;
  }
  if (typeof config.tasksYaml === "string") {
    const r = importTasksYaml(config.tasksYaml as string);
    if (r.graph) return r.graph;
  }
  return importTasksYaml(crewTasksDemoYaml).graph ?? createGraph();
}

function wireGeometry(g: Graph, w: { from: WireEndpoint; to: WireEndpoint }) {
  const fromNode = g.nodes.find((n) => n.instanceId === w.from.instanceId);
  const toNode = g.nodes.find((n) => n.instanceId === w.to.instanceId);
  if (!fromNode || !toNode) return null;
  const from = portPoint(fromNode, w.from.port, "out");
  const to = portPoint(toNode, w.to.port, "in");
  const dx = Math.max(40, Math.min(160, Math.abs(to.x - from.x) * 0.5));
  return { from, to, d: `M ${from.x} ${from.y} C ${from.x + dx} ${from.y}, ${to.x - dx} ${to.y}, ${to.x} ${to.y}` };
}

interface Snapped {
  nodeId: string;
  port: string;
  x: number;
  y: number;
  distance: number;
}

type Drag =
  | { mode: "pan"; startClientX: number; startClientY: number; vp: GraphViewport }
  | { mode: "node"; nodeId: string; startClientX: number; startClientY: number; startPos: { x: number; y: number } }
  | { mode: "wire"; from: WireEndpoint; snap?: Snapped; current: { x: number; y: number } };

export default function GraphBlock({ ctx }: BlockComponentProps) {
  const [graph, setGraph] = useState<Graph>(() => sourceGraph(ctx.config));
  const [drag, setDrag] = useState<Drag | null>(null);
  const [status, setStatus] = useState<string>("drag to pan, wheel to zoom, drag a port to connect");
  const elRef = useRef<HTMLDivElement | null>(null);

  const graphRef = useRef(graph);
  graphRef.current = graph;
  const dragRef = useRef<Drag | null>(drag);
  dragRef.current = drag;

  useEffect(
    () =>
      ctx.subscribe((evt: BusEvent) => {
        if (evt.type === "graph/set") {
          const res = normalizeGraph((evt.payload as { graph?: unknown })?.graph);
          if (res.graph) setGraph(res.graph);
        }
      }),
    [ctx]
  );

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const onWheel = (native: WheelEvent) => {
      native.preventDefault();
      const rect = el.getBoundingClientRect();
      const mx = native.clientX - rect.left;
      const my = native.clientY - rect.top;
      setGraph((g) => {
        const zoom = clamp(g.viewport.zoom * (native.deltaY < 0 ? 1.15 : 0.87), MIN_ZOOM, MAX_ZOOM);
        const nx = mx - (mx - g.viewport.x) * (zoom / g.viewport.zoom);
        const ny = my - (my - g.viewport.y) * (zoom / g.viewport.zoom);
        return setViewport(g, { x: nx, y: ny, zoom });
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  function worldPoint(e: ReactPointerEvent): { x: number; y: number } {
    const el = elRef.current;
    const vp = graphRef.current.viewport;
    const rect = el ? el.getBoundingClientRect() : { left: 0, top: 0 };
    return { x: (e.clientX - rect.left - vp.x) / vp.zoom, y: (e.clientY - rect.top - vp.y) / vp.zoom };
  }

  function nearestInPort(skipNode: string, point: { x: number; y: number }): Snapped | undefined {
    const vp = graphRef.current.viewport;
    const threshold = 14 / vp.zoom;
    let best: Snapped | undefined;
    for (const node of graphRef.current.nodes) {
      if (node.instanceId === skipNode) continue;
      for (const [i, p] of node.inputs.entries()) {
        const x = node.position.x;
        const y = node.position.y + portSlot(i, node.inputs.length);
        const distance = Math.hypot(x - point.x, y - point.y);
        if (distance <= threshold && (!best || distance < best.distance)) {
          best = { nodeId: node.instanceId, port: p.name, x, y, distance };
        }
      }
    }
    return best;
  }

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    const el = elRef.current;
    if (!el) return;
    el.setPointerCapture(e.pointerId);
    const target = e.target as HTMLElement | null;
    const role = target?.dataset?.role;
    const from = worldPoint(e);
    if (role === "out-port") {
      const nodeId = target?.dataset.node as string;
      const port = target?.dataset.port as string;
      if (nodeId && port) {
        setDrag({ mode: "wire", from: { instanceId: nodeId, port }, current: from });
        return;
      }
    }
    const nodeId = target?.dataset?.node;
    if (role === "node" && nodeId) {
      const n = graphRef.current.nodes.find((x) => x.instanceId === nodeId);
      if (n) {
        setDrag({ mode: "node", nodeId: n.instanceId, startClientX: e.clientX, startClientY: e.clientY, startPos: { ...n.position } });
        return;
      }
    }
    setDrag({ mode: "pan", startClientX: e.clientX, startClientY: e.clientY, vp: { ...graphRef.current.viewport } });
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const d = dragRef.current;
    if (!d) return;
    if (d.mode === "pan") {
      const nx = d.vp.x + (e.clientX - d.startClientX);
      const ny = d.vp.y + (e.clientY - d.startClientY);
      setGraph((g) => setViewport(g, { x: nx, y: ny, zoom: g.viewport.zoom }));
    } else if (d.mode === "node") {
      const vp = graphRef.current.viewport;
      const moveX = (e.clientX - d.startClientX) / vp.zoom;
      const moveY = (e.clientY - d.startClientY) / vp.zoom;
      setGraph((g) => {
        try {
          return setNodePosition(g, d.nodeId, { x: d.startPos.x + moveX, y: d.startPos.y + moveY });
        } catch {
          return g;
        }
      });
    } else if (d.mode === "wire") {
      const current = worldPoint(e);
      const snap = nearestInPort(d.from.instanceId, current);
      setDrag({ mode: "wire", from: d.from, current, snap });
    }
  }

  function onPointerUp() {
    const d = dragRef.current;
    if (!d) return;
    setDrag(null);
    if (d.mode !== "wire") return;
    if (!d.snap) {
      setStatus("connect dropped — no target port");
      return;
    }
    const res = connectWire(graphRef.current, d.from, { instanceId: d.snap.nodeId, port: d.snap.port });
    if (!res.graph) {
      setStatus(res.error ?? "connect failed");
      return;
    }
    const wire = res.graph.wires[res.graph.wires.length - 1];
    setGraph(res.graph);
    setStatus(`wire ${wire?.id ?? "?"} -> ${d.snap.nodeId}.${d.snap.port}`);
    ctx.dispatch({ type: "graph/connect", ts: Date.now(), payload: { wire, from: d.from, to: { instanceId: d.snap.nodeId, port: d.snap.port } } });
  }

  const bounds = graphBounds(graph);
  const minX = Math.min(bounds.minX, graph.viewport.x) - PAD;
  const minY = Math.min(bounds.minY, graph.viewport.y) - PAD;
  const maxX = Math.max(bounds.maxX, graph.viewport.x) + PAD;
  const maxY = Math.max(bounds.maxY, graph.viewport.y) + PAD;

  const preview = drag?.mode === "wire" ? wireGeometry(graph, { from: drag.from, to: { instanceId: drag.snap?.nodeId ?? "", port: drag.snap?.port ?? "" } }) ?? null : null;
  const previewEnd = preview ?? (drag?.mode === "wire" ? { d: "", from: { x: 0, y: 0 }, to: { x: drag.current.x, y: drag.current.y } } : null);

  return (
    <section className="block cnv-wrap">
      <h3>Node Canvas · {graph.nodes.length} nodes · {graph.wires.length} wires</h3>
      <div
        ref={elRef}
        className="cnv"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        role="application"
        aria-label="node canvas"
      >
        <div
          className="cnv-world"
          style={{ transform: `translate(${graph.viewport.x}px, ${graph.viewport.y}px) scale(${graph.viewport.zoom})` }}
        >
          <svg className="cnv-wires" style={{ left: minX, top: minY, width: maxX - minX, height: maxY - minY }}>
            {graph.wires.map((w) => {
              const geo = wireGeometry(graph, w);
              if (!geo) return null;
              return <path key={w.id} className="cnv-wire" d={geo.d} />;
            })}
            {drag?.mode === "wire" && previewEnd && (
              <path
                className={drag.snap ? "cnv-wire cnv-wire-preview-ok" : "cnv-wire cnv-wire-preview"}
                d={previewEnd.d}
              />
            )}
          </svg>
          {graph.nodes.map((n) => (
            <div
              key={n.instanceId}
              className="cnv-node"
              data-role="node"
              data-node={n.instanceId}
              style={{ left: n.position.x, top: n.position.y, width: NODE_W, height: NODE_H }}
            >
              <span className="cnv-node-label">{n.label}</span>
              <span className="cnv-node-kind">{String(n.config?.agent ?? n.blockId ?? "")}</span>
              {n.inputs.map((p, i) => (
                <span
                  key={p.name}
                  className={`cnv-port cnv-port-in${drag?.mode === "wire" && drag.snap?.nodeId === n.instanceId && drag.snap.port === p.name ? " cnv-port-active" : ""}`}
                  data-role="in-port"
                  data-node={n.instanceId}
                  data-port={p.name}
                  style={{ left: -PORT_R, top: portSlot(i, n.inputs.length) - PORT_R }}
                  title={`${p.name} : ${p.type}`}
                />
              ))}
              {n.outputs.map((p, i) => (
                <span
                  key={p.name}
                  className="cnv-port cnv-port-out"
                  data-role="out-port"
                  data-node={n.instanceId}
                  data-port={p.name}
                  style={{ left: NODE_W - PORT_R, top: portSlot(i, n.outputs.length) - PORT_R }}
                  title={`${p.name} : ${p.type} (drag to connect)`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="cnv-hud">{status}</div>
    </section>
  );
}