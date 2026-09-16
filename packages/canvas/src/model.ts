export interface PortDef {
  name: string;
  type: string;
}

export interface GraphNode {
  instanceId: string;
  blockId: string;
  label: string;
  position: { x: number; y: number };
  config: Record<string, unknown>;
  inputs: PortDef[];
  outputs: PortDef[];
}

export interface WireEndpoint {
  instanceId: string;
  port: string;
}

export interface GraphWire {
  id: string;
  from: WireEndpoint;
  to: WireEndpoint;
}

export interface GraphViewport {
  x: number;
  y: number;
  zoom: number;
}

export interface Graph {
  nodes: GraphNode[];
  wires: GraphWire[];
  viewport: GraphViewport;
}

export const DEFAULT_VIEWPORT: GraphViewport = { x: 0, y: 0, zoom: 1 };

export function createGraph(overrides: Partial<Graph> = {}): Graph {
  return { nodes: [], wires: [], viewport: { ...DEFAULT_VIEWPORT }, ...overrides };
}

export function findNode(g: Graph, instanceId: string): GraphNode | undefined {
  return g.nodes.find((n) => n.instanceId === instanceId);
}

export function outPort(node: GraphNode, name: string): PortDef | undefined {
  return node.outputs.find((p) => p.name === name);
}

export function inPort(node: GraphNode, name: string): PortDef | undefined {
  return node.inputs.find((p) => p.name === name);
}

function cloneGraph(g: Graph): Graph {
  return {
    viewport: { ...g.viewport },
    nodes: g.nodes.map((n) => ({ ...n, position: { ...n.position }, inputs: [...n.inputs], outputs: [...n.outputs], config: { ...n.config } })),
    wires: g.wires.map((w) => ({ ...w, from: { ...w.from }, to: { ...w.to } }))
  };
}

let wireSeq = 0;
export function nextWireId(): string {
  wireSeq += 1;
  return `w${wireSeq}`;
}

export function addNode(g: Graph, node: GraphNode): Graph {
  if (findNode(g, node.instanceId)) {
    throw new Error(`duplicate instanceId "${node.instanceId}"`);
  }
  const next = cloneGraph(g);
  next.nodes.push({ ...node, position: { ...node.position }, inputs: [...node.inputs], outputs: [...node.outputs] });
  return next;
}

export function removeNode(g: Graph, instanceId: string): Graph {
  const next = cloneGraph(g);
  next.nodes = next.nodes.filter((n) => n.instanceId !== instanceId);
  next.wires = next.wires.filter(
    (w) => w.from.instanceId !== instanceId && w.to.instanceId !== instanceId
  );
  return next;
}

export function setNodePosition(g: Graph, instanceId: string, position: { x: number; y: number }): Graph {
  const next = cloneGraph(g);
  const n = next.nodes.find((node) => node.instanceId === instanceId);
  if (!n) throw new Error(`no node "${instanceId}"`);
  n.position = { ...position };
  return next;
}

/** Returns true when `from` can reach `to` by following wire direction (out -> in). */
export function reaches(g: Graph, fromId: string, toId: string): boolean {
  if (fromId === toId) return true;
  const seen = new Set<string>([fromId]);
  const stack = [fromId];
  while (stack.length > 0) {
    const current = stack.pop() as string;
    for (const w of g.wires) {
      if (w.from.instanceId === current) {
        const next = w.to.instanceId;
        if (next === toId) return true;
        if (!seen.has(next)) {
          seen.add(next);
          stack.push(next);
        }
      }
    }
  }
  return false;
}

export interface ConnectResult {
  graph?: Graph;
  error?: string;
}

export function connect(g: Graph, from: WireEndpoint, to: WireEndpoint): ConnectResult {
  const fromNode = findNode(g, from.instanceId);
  const toNode = findNode(g, to.instanceId);
  if (!fromNode) return { error: `unknown source node "${from.instanceId}"` };
  if (!toNode) return { error: `unknown target node "${to.instanceId}"` };
  if (fromNode === toNode) return { error: "a node cannot connect to itself" };
  const fromPort = outPort(fromNode, from.port);
  const toPort = inPort(toNode, to.port);
  if (!fromPort) return { error: `no output port "${from.port}" on "${from.instanceId}"` };
  if (!toPort) return { error: `no input port "${to.port}" on "${to.instanceId}"` };
  if (!(toPort.type === "*" || fromPort.type === toPort.type)) {
    return { error: `port type mismatch: "${from.port}" (${fromPort.type}) -> "${to.port}" (${toPort.type})` };
  }
  if (reaches(g, to.instanceId, from.instanceId)) {
    return { error: "connect would create a cycle (DAG required)" };
  }
  const next = cloneGraph(g);
  next.wires.push({ id: nextWireId(), from: { ...from }, to: { ...to } });
  return { graph: next };
}

export function disconnect(g: Graph, wireId: string): Graph {
  const next = cloneGraph(g);
  next.wires = next.wires.filter((w) => w.id !== wireId);
  return next;
}

export function setViewport(g: Graph, viewport: GraphViewport): Graph {
  const next = cloneGraph(g);
  next.viewport = { ...viewport };
  return next;
}

export function serializeGraph(g: Graph): string {
  return JSON.stringify(g);
}

export function loadGraph(json: string): { graph?: Graph; error?: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { error: "graph.json is not valid JSON" };
  }
  return normalizeGraph(parsed);
}

export function normalizeGraph(raw: unknown): { graph?: Graph; error?: string } {
  if (typeof raw !== "object" || raw === null) return { error: "graph root must be an object" };
  const g = raw as Partial<Graph>;
  if (!Array.isArray(g.nodes)) return { error: "graph.nodes must be an array" };
  const vp = (g.viewport ?? {}) as Partial<GraphViewport>;
  const graph = createGraph({
    nodes: [],
    wires: [],
    viewport: {
      x: typeof vp.x === "number" ? vp.x : DEFAULT_VIEWPORT.x,
      y: typeof vp.y === "number" ? vp.y : DEFAULT_VIEWPORT.y,
      zoom: typeof vp.zoom === "number" ? vp.zoom : DEFAULT_VIEWPORT.zoom
    }
  });
  const ids = new Set<string>();
  for (const n of g.nodes) {
    const node = n as Partial<GraphNode>;
    if (typeof node.instanceId !== "string" || !node.instanceId) {
      return { error: "every node needs a string instanceId" };
    }
    if (ids.has(node.instanceId)) return { error: `duplicate instanceId "${node.instanceId}"` };
    ids.add(node.instanceId);
    const pos = node.position as { x?: unknown; y?: unknown } | undefined;
    graph.nodes.push({
      instanceId: node.instanceId,
      blockId: typeof node.blockId === "string" ? node.blockId : "unknown.block",
      label: typeof node.label === "string" ? node.label : node.instanceId,
      position: {
        x: typeof pos?.x === "number" ? pos.x : 0,
        y: typeof pos?.y === "number" ? pos.y : 0
      },
      config: (node.config as Record<string, unknown>) ?? {},
      inputs: Array.isArray(node.inputs) ? (node.inputs as PortDef[]) : [],
      outputs: Array.isArray(node.outputs) ? (node.outputs as PortDef[]) : []
    });
  }
  const rawWires = Array.isArray(g.wires) ? g.wires : [];
  for (const w of [...rawWires]) {
    const wire = w as Partial<GraphWire>;
    if (
      typeof wire.from?.instanceId !== "string" ||
      typeof wire.from.port !== "string" ||
      typeof wire.to?.instanceId !== "string" ||
      typeof wire.to.port !== "string"
    ) {
      return { error: "malformed wire endpoint" };
    }
    graph.wires.push({
      id: typeof wire.id === "string" ? wire.id : "w_l",
      from: { instanceId: wire.from.instanceId, port: wire.from.port },
      to: { instanceId: wire.to.instanceId, port: wire.to.port }
    });
  }
  const errors = validateGraph(graph);
  if (errors.length > 0) return { error: errors.join("; ") };
  return { graph };
}

export function validateGraph(g: Graph): string[] {
  const errors: string[] = [];
  for (const w of g.wires) {
    const fromNode = findNode(g, w.from.instanceId);
    const toNode = findNode(g, w.to.instanceId);
    if (!fromNode) {
      errors.push(`wire ${w.id} references missing node "${w.from.instanceId}"`);
      continue;
    }
    if (!toNode) {
      errors.push(`wire ${w.id} references missing node "${w.to.instanceId}"`);
      continue;
    }
    if (!outPort(fromNode, w.from.port)) errors.push(`wire ${w.id}: no out port "${w.from.port}"`);
    if (!inPort(toNode, w.to.port)) errors.push(`wire ${w.id}: no in port "${w.to.port}"`);
  }
  return errors;
}

export function countNodes(g: Graph): number {
  return g.nodes.length;
}

export function countWires(g: Graph): number {
  return g.wires.length;
}