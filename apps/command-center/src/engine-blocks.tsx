import { useState } from "react";
import type { BusEvent, BlockManifest } from "@imagoro/core";
import { useBlockState, payload, type BlockComponentProps, type ReactBlockHost } from "@imagoro/renderer-react";

export interface ViewportSnapshotData {
  tick?: number;
  health?: number;
  paused?: boolean;
  cam?: { x: number; y: number; z: number; yaw?: number; pitch?: number };
  map?: { path: string; prefabs: number };
  pick?: {
    hit: boolean;
    x?: number;
    y?: number;
    z?: number;
    nx?: number;
    ny?: number;
    nz?: number;
    adj?: [number, number, number];
    block?: number;
    blockName?: string;
    paletteIndex?: number;
    dist?: number;
  };
  visualParams?: Record<string, number | boolean>;
}

export function postEngineAction(action: Record<string, unknown>, dispatch?: (evt: BusEvent) => void) {
  if (typeof window !== "undefined" && (window as any).chrome?.webview) {
    (window as any).chrome.webview.postMessage(JSON.stringify(action));
  } else {
    console.log("[Engine Action]", action);
  }
  if (dispatch) {
    dispatch({
      type: "console/log",
      ts: Date.now(),
      payload: { line: `[UI -> Engine] ${String(action.type)}` }
    });
  }
}

interface EngineState {
  snap: ViewportSnapshotData;
}

const initialEngineState: EngineState = {
  snap: {
    tick: 0,
    health: 100,
    paused: false,
    cam: { x: 0, y: 0, z: 0, yaw: 0, pitch: 0 },
    map: { path: "data/maps/warehouse_v2.map.vox.json", prefabs: 0 },
    pick: { hit: false },
    visualParams: {}
  }
};

function onEngineSnapshot(state: EngineState, evt: BusEvent): EngineState {
  if (evt.type === "VIEW_SNAPSHOT" || evt.type === "engine/snapshot") {
    const data = (payload(evt) as unknown as ViewportSnapshotData) ?? {};
    return {
      snap: {
        ...state.snap,
        ...data,
        cam: data.cam ? { ...data.cam } : state.snap.cam,
        map: data.map ? { ...data.map } : state.snap.map,
        pick: data.pick ? { ...data.pick } : state.snap.pick,
        visualParams: data.visualParams ? { ...state.snap.visualParams, ...data.visualParams } : state.snap.visualParams
      }
    };
  }
  return state;
}

export function EngineStatusBlock({ ctx }: BlockComponentProps) {
  const state = useBlockState(ctx, initialEngineState, onEngineSnapshot);
  const snap = state.snap;
  const isPaused = Boolean(snap.paused);

  return (
    <div className="block">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "var(--font-size-md)", fontWeight: 600 }}>Simulation Viewport</span>
        <span className={`pill ${isPaused ? "warn" : "ok"}`}>
          {isPaused ? "PAUSED (Sim Idle)" : "RUNNING (60 Hz)"}
        </span>
      </div>

      <div className="metrics-row" style={{ marginTop: "8px" }}>
        <div className="metric">
          <div className="muted" style={{ fontSize: "var(--font-size-xs)" }}>TICK</div>
          <div style={{ fontSize: "16px", fontWeight: 700, fontFamily: "var(--font-mono)" }}>{snap.tick ?? 0}</div>
        </div>
        <div className="metric">
          <div className="muted" style={{ fontSize: "var(--font-size-xs)" }}>HEALTH</div>
          <div style={{ fontSize: "16px", fontWeight: 700, fontFamily: "var(--font-mono)", color: (snap.health ?? 100) < 50 ? "#ef4444" : "#22c55e" }}>
            {snap.health !== undefined ? snap.health.toFixed(1) : "--"}
          </div>
        </div>
        <div className="metric">
          <div className="muted" style={{ fontSize: "var(--font-size-xs)" }}>CAM (X, Y, Z)</div>
          <div style={{ fontSize: "13px", fontWeight: 600, fontFamily: "var(--font-mono)" }}>
            {snap.cam ? `${snap.cam.x.toFixed(1)}, ${snap.cam.y.toFixed(1)}, ${snap.cam.z.toFixed(1)}` : "--"}
          </div>
        </div>
        <div className="metric">
          <div className="muted" style={{ fontSize: "var(--font-size-xs)" }}>AIM (YAW, PITCH)</div>
          <div style={{ fontSize: "13px", fontWeight: 600, fontFamily: "var(--font-mono)" }}>
            {snap.cam ? `${(snap.cam.yaw ?? 0).toFixed(2)}, ${(snap.cam.pitch ?? 0).toFixed(2)}` : "--"}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
        <button
          className="cc-nav"
          style={{ background: isPaused ? "var(--accent)" : "var(--bg-raised)", color: isPaused ? "#fff" : "var(--text)" }}
          onClick={() => postEngineAction({ type: "TOGGLE_PAUSE" }, ctx.dispatch)}
        >
          {isPaused ? "▶ Resume Simulation" : "⏸ Pause Simulation"}
        </button>
        <button
          className="cc-nav"
          onClick={() => postEngineAction({ type: "RESET_CAMERA" }, ctx.dispatch)}
        >
          🎯 Reset Camera
        </button>
        <button
          className="cc-nav"
          onClick={() => postEngineAction({ type: "SPAWN_PLAYER" }, ctx.dispatch)}
        >
          🔄 Respawn Player
        </button>
      </div>
    </div>
  );
}

const PALETTE_BLOCKS = [
  { id: 2, name: "Concrete", color: "#94a3b8" },
  { id: 4, name: "Girder", color: "#f59e0b" },
  { id: 3, name: "SheetMetal", color: "#64748b" },
  { id: 5, name: "Wood", color: "#b45309" },
  { id: 6, name: "WoodDark", color: "#78350f" },
  { id: 1, name: "Dirt", color: "#854d0e" },
  { id: 12, name: "Grass", color: "#22c55e" },
  { id: 11, name: "Sand", color: "#facc15" },
  { id: 13, name: "Snow", color: "#e2e8f0" },
  { id: 14, name: "Asphalt", color: "#334155" },
  { id: 10, name: "LightBulb", color: "#fbbf24" }
];

export function VoxelInspectorBlock({ ctx }: BlockComponentProps) {
  const state = useBlockState(ctx, initialEngineState, onEngineSnapshot);
  const pick = state.snap.pick;
  const [selectedBlock, setSelectedBlock] = useState<number>(2); // Concrete default
  const [paletteIndex, setPaletteIndex] = useState<number>(0);

  const hasHit = Boolean(pick?.hit);

  return (
    <div className="block">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "var(--font-size-md)", fontWeight: 600 }}>Crosshair Raycast Target</span>
        <span className={`pill ${hasHit ? "ok" : "mute"}`}>
          {hasHit ? `Hit: ${pick?.blockName} (#${pick?.block})` : "No Surface"}
        </span>
      </div>

      {hasHit && pick ? (
        <div style={{ background: "var(--bg-raised)", borderRadius: "var(--radius-sm)", padding: "10px", marginTop: "8px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", fontSize: "var(--font-size-sm)" }}>
            <div><strong>Cell:</strong> <span className="mono">({pick.x}, {pick.y}, {pick.z})</span></div>
            <div><strong>Normal:</strong> <span className="mono">[{pick.nx}, {pick.ny}, {pick.nz}]</span></div>
            <div><strong>Adjacent:</strong> <span className="mono">({pick.adj?.join(", ")})</span></div>
            <div><strong>Distance:</strong> <span className="mono">{pick.dist?.toFixed(2)}m</span></div>
            <div><strong>Appearance Idx:</strong> <span className="mono">{pick.paletteIndex ?? 0}</span></div>
          </div>
        </div>
      ) : (
        <div style={{ padding: "12px", background: "var(--bg-raised)", borderRadius: "var(--radius-sm)", marginTop: "8px", color: "var(--text-muted)", fontSize: "var(--font-size-sm)" }}>
          Aim viewport crosshair at any world voxel to inspect cell coordinates and material layers.
        </div>
      )}

      <div style={{ marginTop: "12px" }}>
        <div style={{ fontSize: "var(--font-size-xs)", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "6px" }}>
          Material Palette & Paint Layer
        </div>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {PALETTE_BLOCKS.map((b) => (
            <button
              key={b.id}
              onClick={() => setSelectedBlock(b.id)}
              style={{
                background: selectedBlock === b.id ? "var(--bg-tab-active)" : "var(--bg-raised)",
                border: selectedBlock === b.id ? `2px solid ${b.color}` : "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                padding: "4px 8px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                cursor: "pointer",
                color: "var(--text)"
              }}
            >
              <span style={{ width: "10px", height: "10px", borderRadius: "2px", background: b.color }} />
              <span style={{ fontSize: "var(--font-size-xs)" }}>{b.name}</span>
            </button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px" }}>
          <span style={{ fontSize: "var(--font-size-xs)", color: "var(--text-muted)" }}>Palette Index (0-15):</span>
          <input
            type="number"
            min={0}
            max={15}
            value={paletteIndex}
            onChange={(e) => setPaletteIndex(Math.max(0, Math.min(15, parseInt(e.target.value) || 0)))}
            style={{ width: "50px", background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text)", padding: "3px 6px", borderRadius: "var(--radius-sm)" }}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
        <button
          className="cc-nav"
          disabled={!hasHit}
          onClick={() => {
            if (pick && pick.hit) {
              postEngineAction({
                type: "PAINT_VOXEL",
                x: pick.x,
                y: pick.y,
                z: pick.z,
                block: selectedBlock,
                paletteIndex
              }, ctx.dispatch);
            }
          }}
          style={{ opacity: hasHit ? 1 : 0.5 }}
        >
          🖌️ Paint Hit Cell
        </button>

        <button
          className="cc-nav"
          disabled={!hasHit || !pick?.adj}
          onClick={() => {
            if (pick && pick.hit && pick.adj) {
              postEngineAction({
                type: "PAINT_VOXEL",
                x: pick.adj[0],
                y: pick.adj[1],
                z: pick.adj[2],
                block: selectedBlock,
                paletteIndex
              }, ctx.dispatch);
            }
          }}
          style={{ opacity: hasHit ? 1 : 0.5 }}
        >
          ➕ Place Adjacent
        </button>

        <button
          className="cc-nav"
          disabled={!hasHit}
          onClick={() => {
            if (pick && pick.hit) {
              postEngineAction({
                type: "DELETE_VOXEL",
                x: pick.x,
                y: pick.y,
                z: pick.z
              }, ctx.dispatch);
            }
          }}
          style={{ opacity: hasHit ? 1 : 0.5, color: "#f87171" }}
        >
          🗑️ Clear Voxel
        </button>
      </div>
    </div>
  );
}

export function VisualParametersBlock({ ctx }: BlockComponentProps) {
  const state = useBlockState(ctx, initialEngineState, onEngineSnapshot);
  const params = state.snap.visualParams ?? {};

  const setParam = (key: string, value: number | boolean) => {
    postEngineAction({
      type: "SET_VISUAL_PARAM",
      key,
      value: typeof value === "boolean" ? (value ? 1 : 0) : value
    }, ctx.dispatch);
  };

  const applyPreset = (name: string) => {
    postEngineAction({
      type: "APPLY_PRESET",
      name
    }, ctx.dispatch);
  };

  const resetDefaults = () => {
    postEngineAction({ type: "RESET_VISUAL_PARAMS" }, ctx.dispatch);
  };

  return (
    <div className="block">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "var(--font-size-md)", fontWeight: 600 }}>Visual Style & Post Pipeline</span>
        <button
          className="cc-nav"
          style={{ padding: "3px 8px", fontSize: "var(--font-size-xs)" }}
          onClick={resetDefaults}
        >
          ↺ Reset Defaults
        </button>
      </div>

      <div style={{ display: "flex", gap: "6px", marginTop: "8px", flexWrap: "wrap" }}>
        <button className="cc-nav" onClick={() => applyPreset("Retro")}>🕹️ Retro CRT</button>
        <button className="cc-nav" onClick={() => applyPreset("Clean")}>✨ Clean Modern</button>
        <button className="cc-nav" onClick={() => applyPreset("Original")}>📐 Original Look</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "12px" }}>
        <div>
          <label style={{ fontSize: "var(--font-size-xs)", display: "flex", justifyContent: "space-between" }}>
            <span>Render Scale</span>
            <span className="mono">{Number(params.render_scale ?? 1.0).toFixed(2)}x</span>
          </label>
          <input
            type="range"
            min={0.25}
            max={1.0}
            step={0.05}
            value={Number(params.render_scale ?? 1.0)}
            onChange={(e) => setParam("render_scale", parseFloat(e.target.value))}
            style={{ width: "100%" }}
          />
        </div>

        <div>
          <label style={{ fontSize: "var(--font-size-xs)", display: "flex", justifyContent: "space-between" }}>
            <span>Posterize Levels</span>
            <span className="mono">{Number(params.posterize_levels ?? 0)}</span>
          </label>
          <input
            type="range"
            min={0}
            max={64}
            step={2}
            value={Number(params.posterize_levels ?? 0)}
            onChange={(e) => setParam("posterize_levels", parseInt(e.target.value))}
            style={{ width: "100%" }}
          />
        </div>

        <div>
          <label style={{ fontSize: "var(--font-size-xs)", display: "flex", justifyContent: "space-between" }}>
            <span>Dither Noise</span>
            <span className="mono">{Number(params.dither ?? 0.0).toFixed(2)}</span>
          </label>
          <input
            type="range"
            min={0.0}
            max={1.0}
            step={0.05}
            value={Number(params.dither ?? 0.0)}
            onChange={(e) => setParam("dither", parseFloat(e.target.value))}
            style={{ width: "100%" }}
          />
        </div>

        <div>
          <label style={{ fontSize: "var(--font-size-xs)", display: "flex", justifyContent: "space-between" }}>
            <span>Color Crush (Gamma)</span>
            <span className="mono">{Number(params.crush ?? 1.0).toFixed(2)}</span>
          </label>
          <input
            type="range"
            min={0.6}
            max={1.6}
            step={0.05}
            value={Number(params.crush ?? 1.0)}
            onChange={(e) => setParam("crush", parseFloat(e.target.value))}
            style={{ width: "100%" }}
          />
        </div>

        <div>
          <label style={{ fontSize: "var(--font-size-xs)", display: "flex", justifyContent: "space-between" }}>
            <span>Fisheye Distortion</span>
            <span className="mono">{Number(params.fisheye ?? 1.0).toFixed(2)}</span>
          </label>
          <input
            type="range"
            min={0.0}
            max={1.5}
            step={0.05}
            value={Number(params.fisheye ?? 1.0)}
            onChange={(e) => setParam("fisheye", parseFloat(e.target.value))}
            style={{ width: "100%" }}
          />
        </div>

        <div>
          <label style={{ fontSize: "var(--font-size-xs)", display: "flex", justifyContent: "space-between" }}>
            <span>Texture Strength</span>
            <span className="mono">{Number(params.texture_strength ?? 1.0).toFixed(2)}</span>
          </label>
          <input
            type="range"
            min={0.0}
            max={1.0}
            step={0.05}
            value={Number(params.texture_strength ?? 1.0)}
            onChange={(e) => setParam("texture_strength", parseFloat(e.target.value))}
            style={{ width: "100%" }}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: "16px", marginTop: "12px", flexWrap: "wrap", fontSize: "var(--font-size-sm)" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={Boolean(params.upscale_nearest ?? true)}
            onChange={(e) => setParam("upscale_nearest", e.target.checked)}
          />
          Nearest Upscale
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={Boolean(params.textures ?? true)}
            onChange={(e) => setParam("textures", e.target.checked)}
          />
          Textures Active
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={Boolean(params.shadows ?? true)}
            onChange={(e) => setParam("shadows", e.target.checked)}
          />
          Occupancy Shadows
        </label>
      </div>
    </div>
  );
}

export function MapSyncBlock({ ctx }: BlockComponentProps) {
  const state = useBlockState(ctx, initialEngineState, onEngineSnapshot);
  const map = state.snap.map;

  return (
    <div className="block">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "var(--font-size-md)", fontWeight: 600 }}>Map & Java Painter Coexistence</span>
        <span className="pill ok">Shared voxfmt v2</span>
      </div>

      <div style={{ background: "var(--bg-raised)", borderRadius: "var(--radius-sm)", padding: "10px", marginTop: "8px", fontSize: "var(--font-size-sm)" }}>
        <div><strong>Active Map:</strong> <span className="mono">{map?.path || "data/maps/warehouse_v2.map.vox.json"}</span></div>
        <div style={{ marginTop: "4px" }}><strong>Prefabs Stamped:</strong> <span className="mono">{map?.prefabs ?? 0}</span></div>
        <div style={{ marginTop: "4px", color: "var(--status-ok-text)" }}>
          ● Live Disk Watcher: Active (edits saved in Java Painter hot-reload in real-time)
        </div>
      </div>

      <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
        <button
          className="cc-nav"
          onClick={() => postEngineAction({ type: "RELOAD_MAP" }, ctx.dispatch)}
        >
          🔄 Reload Map from Disk
        </button>
        <button
          className="cc-nav"
          onClick={() => postEngineAction({ type: "LAUNCH_JAVA_PAINTER" }, ctx.dispatch)}
        >
          🎨 Open in Java Painter
        </button>
      </div>
    </div>
  );
}

export const statusManifest: BlockManifest = {
  id: "imagoro.engine.status",
  name: "Engine Status & Viewport",
  version: "0.1.0",
  family: "console",
  substrates: ["react"],
  size: { min: [320, 160], ideal: [540, 220] },
  ports: { in: [{ name: "events", type: "event[]" }], out: [] }
};

export const inspectorManifest: BlockManifest = {
  id: "imagoro.engine.inspector",
  name: "Voxel Inspector & Palette",
  version: "0.1.0",
  family: "console",
  substrates: ["react"],
  size: { min: [320, 220], ideal: [540, 320] },
  ports: { in: [{ name: "events", type: "event[]" }], out: [] }
};

export const visualsManifest: BlockManifest = {
  id: "imagoro.engine.visuals",
  name: "Visual Parameters & Presets",
  version: "0.1.0",
  family: "console",
  substrates: ["react"],
  size: { min: [320, 240], ideal: [540, 340] },
  ports: { in: [{ name: "events", type: "event[]" }], out: [] }
};

export const mapManifest: BlockManifest = {
  id: "imagoro.engine.map",
  name: "Map Sync & Java Painter",
  version: "0.1.0",
  family: "console",
  substrates: ["react"],
  size: { min: [320, 160], ideal: [540, 220] },
  ports: { in: [{ name: "events", type: "event[]" }], out: [] }
};

export const ENGINE_MANIFESTS: BlockManifest[] = [
  statusManifest,
  inspectorManifest,
  visualsManifest,
  mapManifest
];

export function registerEngineBlocks(host: ReactBlockHost): void {
  host.register(statusManifest.id, { manifest: statusManifest, Component: EngineStatusBlock });
  host.register(inspectorManifest.id, { manifest: inspectorManifest, Component: VoxelInspectorBlock });
  host.register(visualsManifest.id, { manifest: visualsManifest, Component: VisualParametersBlock });
  host.register(mapManifest.id, { manifest: mapManifest, Component: MapSyncBlock });
}
