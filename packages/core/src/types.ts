export type BlockFamily =
  | "map" | "route" | "chat" | "console" | "terminal" | "metrics"
  | "audit" | "weather" | "audio/visualizer" | "pipeline" | "blackboard" | "cluster";

export interface PortDef { name: string; type: string; }

export interface BlockManifest {
  id: string;
  name: string;
  version: string;
  family: BlockFamily;
  substrates: string[];
  size: { min: [number, number]; ideal: [number, number] };
  ports: {
    in: PortDef[];
    out: PortDef[];
  };
  theme?: { tokens: string[] };
  api?: string[];
  lifecycle?: { autostart: boolean };
}

export interface BusEvent {
  type: string;
  ts: number;
  payload: JsonObject;
}

export type JsonObject = Record<string, unknown>;

export interface BlockState {
  [key: string]: unknown;
}

export interface BlockContext {
  readonly config: Record<string, unknown>;
  dispatch: (evt: BusEvent) => void;
  subscribe: (fn: (evt: BusEvent) => void) => () => void;
}

export interface Block {
  manifest: BlockManifest;
  mount(el: HTMLElement, ctx: BlockContext): void;
  render(state: BlockState): void;
  onEvent(evt: BusEvent): void;
  unmount(): void;
}

/** Block-package seam (substrate-neutral). The `component` is renderer-specific: the React
 *  host adapts an FC over BlockRenderProps into a core `Block`; legacy JVM/Qt adapters wrap
 *  their own components. Core itself stays React-free. */
export interface BlockPackage {
  manifest: BlockManifest;
  component: unknown;
}

export interface BlockRenderProps {
  manifest: BlockManifest;
  config: Record<string, unknown>;
  state: BlockState;
  dispatch: (evt: BusEvent) => void;
}

export interface MountSpec {
  id: string;
  config?: Record<string, unknown>;
}

export interface BlockHandle {
  id: number;
  slot: HTMLElement;
  blockId: string;
  update(config: Record<string, unknown>): void;
  unmount(): void;
}

export type LegacyEvent = Record<string, unknown>;

export interface FixtureSet {
  meta: {
    id: string;
    title: string;
    description?: string;
  };
  snapshot: JsonObject;
  stream: BusEvent[];
}

export const version = "0.1.0";