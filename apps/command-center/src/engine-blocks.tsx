import { useState } from "react";
import type { BusEvent, BlockManifest } from "@imagoro/core";
import { useBlockState, payload, type BlockComponentProps, type ReactBlockHost } from "@imagoro/renderer-react";

export interface StructuralZoneData {
  id: string;
  name: string;
  integrity: number;
  status: string;
  loadCapacity: number;
  stressFactor: number;
  girders: { intact: number; total: number; ratio: number };
  pillars: { intact: number; total: number; ratio: number };
  walls: { intact: number; total: number; ratio: number };
  bounds: { min: [number, number, number]; max: [number, number, number] };
}

export interface ActiveWeaponData {
  id: string;
  caliber: string;
  ammoId: string;
  damage?: number;
  impact?: number;
  recoil?: number;
  handling?: number;
  weight?: number;
  optic?: number;
  fireMode?: string;
  hitscan?: boolean;
}

export interface ViewportSnapshotData {
  tick?: number;
  health?: number;
  paused?: boolean;
  cam?: { x: number; y: number; z: number; yaw?: number; pitch?: number };
  player?: { x: number; y: number; z: number };
  thirdPerson?: boolean;
  legYaw?: number;
  deltaYaw?: number;
  stance?: number;
  gait?: number;
  sliding?: boolean;
  dashing?: boolean;
  wallRunning?: boolean;
  stamina?: number;
  timeOfDay?: number;
  vertices?: number;
  caliber?: number;
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
  structural?: StructuralZoneData[];
  activeWeapon?: ActiveWeaponData;
  availableWeapons?: Array<{ id: string; caliber: string; ammoId: string }>;
  character?: {
    holdingWeapon?: boolean;
    isReloading?: boolean;
    adsAlpha?: number;
  };
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
  logs: string[];
}

const initialEngineState: EngineState = {
  snap: {
    tick: 0,
    health: 100,
    paused: false,
    cam: { x: 0, y: 0, z: 0, yaw: 0, pitch: 0 },
    player: { x: 0, y: 0, z: 0 },
    thirdPerson: false,
    legYaw: 0,
    deltaYaw: 0,
    stance: 0,
    gait: 0,
    sliding: false,
    dashing: false,
    wallRunning: false,
    stamina: 100,
    timeOfDay: 0.25,
    vertices: 0,
    caliber: 0,
    map: { path: "data/maps/warehouse_v2.map.vox.json", prefabs: 0 },
    pick: { hit: false },
    visualParams: {}
  },
  logs: [
    "[system] Native Vulkan Voxel Engine IPC online",
    "[system] Viewport connected to WebView2 bridge",
    "[system] Authoritative simulation running at 120 Hz tick rate"
  ]
};

function onEngineSnapshot(state: EngineState, evt: BusEvent): EngineState {
  if (evt.type === "VIEW_SNAPSHOT" || evt.type === "engine/snapshot") {
    const data = (payload(evt) as unknown as ViewportSnapshotData) ?? {};
    return {
      ...state,
      snap: {
        ...state.snap,
        ...data,
        cam: data.cam ? { ...data.cam } : state.snap.cam,
        player: data.player ? { ...data.player } : state.snap.player,
        map: data.map ? { ...data.map } : state.snap.map,
        pick: data.pick ? { ...data.pick } : state.snap.pick,
        visualParams: data.visualParams ? { ...state.snap.visualParams, ...data.visualParams } : state.snap.visualParams
      }
    };
  }
  if (evt.type === "console/log" || evt.type === "engine/log") {
    const p = payload(evt) as { line?: string } | undefined;
    if (p?.line) {
      const timeStr = new Date(evt.ts || Date.now()).toLocaleTimeString();
      return {
        ...state,
        logs: [`[${timeStr}] ${p.line}`, ...state.logs.slice(0, 49)]
      };
    }
  }
  return state;
}

// -----------------------------------------------------------------------------
// 1. Map Editor Blocks
// -----------------------------------------------------------------------------

export function MapInspectorBlock({ ctx }: BlockComponentProps) {
  const state = useBlockState(ctx, initialEngineState, onEngineSnapshot);
  const pick = state.snap.pick;
  const hasHit = Boolean(pick?.hit);

  return (
    <div className="block">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "var(--font-size-md)", fontWeight: 600 }}>Crosshair Voxel Raycast</span>
        <span className={`pill ${hasHit ? "ok" : "mute"}`}>
          {hasHit ? `Hit: ${pick?.blockName} (#${pick?.block})` : "No Surface In Reach"}
        </span>
      </div>

      {hasHit && pick ? (
        <div style={{ background: "var(--bg-raised)", borderRadius: "var(--radius-sm)", padding: "10px", marginTop: "8px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "var(--font-size-sm)" }}>
            <div><strong>Voxel Cell:</strong> <span className="mono">({pick.x}, {pick.y}, {pick.z})</span></div>
            <div><strong>Face Normal:</strong> <span className="mono">[{pick.nx}, {pick.ny}, {pick.nz}]</span></div>
            <div><strong>Adjacent Cell:</strong> <span className="mono">({pick.adj?.join(", ")})</span></div>
            <div><strong>Ray Distance:</strong> <span className="mono">{pick.dist?.toFixed(2)}m</span></div>
            <div><strong>Material ID:</strong> <span className="mono">{pick.block} ({pick.blockName})</span></div>
            <div><strong>Appearance Palette:</strong> <span className="mono">#{pick.paletteIndex ?? 0}</span></div>
          </div>
        </div>
      ) : (
        <div style={{ padding: "16px", background: "var(--bg-raised)", borderRadius: "var(--radius-sm)", marginTop: "8px", color: "var(--text-muted)", fontSize: "var(--font-size-sm)" }}>
          Aim viewport crosshair at any terrain or structure block to inspect geometry, layer indices, and placement bounds.
        </div>
      )}
    </div>
  );
}

export const PALETTE_BLOCKS = [
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

export function MapToolsBlock({ ctx }: BlockComponentProps) {
  const state = useBlockState(ctx, initialEngineState, onEngineSnapshot);
  const pick = state.snap.pick;
  const [selectedBlock, setSelectedBlock] = useState<number>(2);
  const [paletteIndex, setPaletteIndex] = useState<number>(0);
  const hasHit = Boolean(pick?.hit);

  return (
    <div className="block">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "var(--font-size-md)", fontWeight: 600 }}>Material Palette & Sculpt</span>
        <span className="pill mute">Authoritative Sim Grid</span>
      </div>

      <div style={{ marginTop: "10px" }}>
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

        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "10px" }}>
          <span style={{ fontSize: "var(--font-size-xs)", color: "var(--text-muted)" }}>Appearance Palette (0-15):</span>
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
          🗑️ Carve / Clear
        </button>
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
        <span style={{ fontSize: "var(--font-size-md)", fontWeight: 600 }}>Map Sync & Java Painter</span>
        <span className="pill ok">voxfmt v2</span>
      </div>

      <div style={{ background: "var(--bg-raised)", borderRadius: "var(--radius-sm)", padding: "10px", marginTop: "8px", fontSize: "var(--font-size-sm)" }}>
        <div><strong>Active File:</strong> <span className="mono">{map?.path || "data/maps/warehouse_v2.map.vox.json"}</span></div>
        <div style={{ marginTop: "4px" }}><strong>Prefabs Stamped:</strong> <span className="mono">{map?.prefabs ?? 0}</span></div>
        <div style={{ marginTop: "4px", color: "var(--status-ok-text)" }}>
          ● Live Disk Watcher: Active (external edits reload automatically)
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
          🎨 Open Java Painter Tool
        </button>
      </div>
    </div>
  );
}

export function StructuralMatrixBlock({ ctx }: BlockComponentProps) {
  const state = useBlockState(ctx, initialEngineState, onEngineSnapshot);
  const zones = state.snap.structural && state.snap.structural.length > 0 ? state.snap.structural : [
    {
      id: "warehouse",
      name: "Warehouse Main Bay",
      integrity: 1.0,
      status: "Nominal",
      loadCapacity: 1.0,
      stressFactor: 0.0,
      girders: { intact: 128, total: 128, ratio: 1.0 },
      pillars: { intact: 64, total: 64, ratio: 1.0 },
      walls: { intact: 412, total: 412, ratio: 1.0 },
      bounds: { min: [0, 2, 0] as [number, number, number], max: [191, 63, 159] as [number, number, number] }
    }
  ];

  const primaryZone = zones[0]!;
  const integrityPct = Math.round(primaryZone.integrity * 100);
  const statusColor =
    primaryZone.status === "Nominal" ? "var(--status-ok-text, #22c55e)" :
    primaryZone.status === "Stressed" ? "var(--status-warn-text, #eab308)" :
    primaryZone.status === "Compromised" ? "#f97316" :
    primaryZone.status === "Critical" ? "var(--status-bad-text, #ef4444)" : "#dc2626";

  return (
    <div className="block">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <span style={{ fontSize: "var(--font-size-md)", fontWeight: 600 }}>Structural Integrity Matrix</span>
          <span style={{ marginLeft: "8px", fontSize: "var(--font-size-xs)", color: "var(--text-muted)" }}>
            Zone: {primaryZone.name}
          </span>
        </div>
        <span className="pill" style={{ borderColor: statusColor, color: statusColor }}>
          {primaryZone.status.toUpperCase()} ({integrityPct}%)
        </span>
      </div>

      <div style={{ marginTop: "10px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--font-size-xs)", marginBottom: "3px" }}>
          <span>Overall Zone Integrity</span>
          <span className="mono">{integrityPct}% Load Capacity</span>
        </div>
        <div style={{ height: "8px", background: "var(--bg-raised)", borderRadius: "4px", overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: `${Math.max(0, Math.min(100, integrityPct))}%`,
              background: statusColor,
              transition: "width 0.3s ease, background 0.3s ease"
            }}
          />
        </div>
      </div>

      <div style={{ background: "var(--bg-raised)", borderRadius: "var(--radius-sm)", padding: "10px", marginTop: "12px", fontSize: "var(--font-size-sm)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
          <div style={{ borderLeft: "3px solid #3b82f6", paddingLeft: "6px" }}>
            <div style={{ fontSize: "var(--font-size-xs)", color: "var(--text-muted)" }}>🏛️ VERTICAL PILLARS (45%)</div>
            <div style={{ fontWeight: 600, marginTop: "2px" }}>
              <span className="mono">{primaryZone.pillars.intact}</span> / <span className="mono">{primaryZone.pillars.total}</span>
            </div>
            <div style={{ fontSize: "var(--font-size-xs)", color: primaryZone.pillars.ratio > 0.8 ? "var(--status-ok-text)" : "#f97316" }}>
              {Math.round(primaryZone.pillars.ratio * 100)}% Sound
            </div>
          </div>

          <div style={{ borderLeft: "3px solid #eab308", paddingLeft: "6px" }}>
            <div style={{ fontSize: "var(--font-size-xs)", color: "var(--text-muted)" }}>🏗️ ROOF GIRDERS (35%)</div>
            <div style={{ fontWeight: 600, marginTop: "2px" }}>
              <span className="mono">{primaryZone.girders.intact}</span> / <span className="mono">{primaryZone.girders.total}</span>
            </div>
            <div style={{ fontSize: "var(--font-size-xs)", color: primaryZone.girders.ratio > 0.8 ? "var(--status-ok-text)" : "#f97316" }}>
              {Math.round(primaryZone.girders.ratio * 100)}% Sound
            </div>
          </div>

          <div style={{ borderLeft: "3px solid #a855f7", paddingLeft: "6px" }}>
            <div style={{ fontSize: "var(--font-size-xs)", color: "var(--text-muted)" }}>🧱 SHEAR WALLS (20%)</div>
            <div style={{ fontWeight: 600, marginTop: "2px" }}>
              <span className="mono">{primaryZone.walls.intact}</span> / <span className="mono">{primaryZone.walls.total}</span>
            </div>
            <div style={{ fontSize: "var(--font-size-xs)", color: primaryZone.walls.ratio > 0.8 ? "var(--status-ok-text)" : "#f97316" }}>
              {Math.round(primaryZone.walls.ratio * 100)}% Sound
            </div>
          </div>
        </div>

        <div style={{ marginTop: "8px", fontSize: "var(--font-size-xs)", color: "var(--text-muted)", display: "flex", justifyContent: "space-between" }}>
          <span>Bounding Box: [{primaryZone.bounds.min.join(", ")}] → [{primaryZone.bounds.max.join(", ")}]</span>
          <span>Stress Factor: {(primaryZone.stressFactor * 100).toFixed(1)}%</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
        <button
          className="cc-nav"
          onClick={() => postEngineAction({ type: "RECALC_STRUCTURAL_INTEGRITY" }, ctx.dispatch)}
        >
          🔄 Recalculate Integrity Matrix
        </button>
        <button
          className="cc-nav"
          onClick={() => postEngineAction({ type: "DEMOLISH_TEST_MEMBER" }, ctx.dispatch)}
          title="Demolishes a girder or pillar block to test real-time integrity loss"
        >
          💥 Stress Test Demolition
        </button>
        <button
          className="cc-nav"
          onClick={() => postEngineAction({ type: "LAUNCH_JAVA_PAINTER" }, ctx.dispatch)}
        >
          🎨 Open Java Painter Tool
        </button>
      </div>
    </div>
  );
}

export function WorldTerrainBlock({ ctx }: BlockComponentProps) {
  return (
    <div className="block">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "var(--font-size-md)", fontWeight: 600 }}>World Dimensions & Terrain</span>
        <span className="pill ok">1 mm Unit Voxel</span>
      </div>

      <div style={{ background: "var(--bg-raised)", borderRadius: "var(--radius-sm)", padding: "10px", marginTop: "8px", fontSize: "var(--font-size-sm)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
          <div><strong>World Extents:</strong> <span className="mono">192 × 64 × 160 mm</span></div>
          <div><strong>Chunk Hierarchy:</strong> <span className="mono">12 × 4 × 10 Chunks</span></div>
          <div><strong>Chunk Volume:</strong> <span className="mono">16³ = 4,096 voxels</span></div>
          <div><strong>Road Unit:</strong> <span className="mono">2×2 Chunks (32×32)</span></div>
          <div><strong>Altitude Contract:</strong> <span className="mono">Road Layer H=2</span></div>
          <div><strong>Terrain Noise:</strong> <span className="mono">Deterministic Integer</span></div>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 2. Model & Character Editor Blocks
// -----------------------------------------------------------------------------

export function CameraPerspectiveBlock({ ctx }: BlockComponentProps) {
  const state = useBlockState(ctx, initialEngineState, onEngineSnapshot);
  const snap = state.snap;
  const is3rd = Boolean(snap.thirdPerson);
  const deltaYawDeg = snap.deltaYaw !== undefined ? ((snap.deltaYaw * 180) / Math.PI).toFixed(1) : "0.0";
  const legYawDeg = snap.legYaw !== undefined ? ((snap.legYaw * 180) / Math.PI).toFixed(1) : "0.0";

  return (
    <div className="block">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "var(--font-size-md)", fontWeight: 600 }}>Camera & Perspective Tracking</span>
        <span className={`pill ${is3rd ? "ok" : "warn"}`}>
          {is3rd ? "3rd Person (Over-Shoulder)" : "1st Person (Head-Locked)"}
        </span>
      </div>

      <div style={{ background: "var(--bg-raised)", borderRadius: "var(--radius-sm)", padding: "10px", marginTop: "8px", fontSize: "var(--font-size-sm)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
          <div><strong>Camera Eye:</strong> <span className="mono">{snap.cam ? `${snap.cam.x.toFixed(3)}, ${snap.cam.y.toFixed(3)}, ${snap.cam.z.toFixed(3)}` : "--"}</span></div>
          <div><strong>Player Body:</strong> <span className="mono">{snap.player ? `${snap.player.x.toFixed(3)}, ${snap.player.y.toFixed(3)}, ${snap.player.z.toFixed(3)}` : "--"}</span></div>
          <div><strong>Leg Heading:</strong> <span className="mono">{legYawDeg}°</span></div>
          <div><strong>Waist Twist:</strong> <span className="mono">{deltaYawDeg}°</span></div>
          <div><strong>Head Attachment:</strong> <span className="mono" style={{ color: "var(--status-ok-text)" }}>Locked to Bone #5</span></div>
          <div><strong>Obstacle Pullback:</strong> <span className="mono">Raycast Clamped</span></div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
        <button
          className="cc-nav"
          style={{ background: is3rd ? "var(--accent)" : "var(--bg-raised)", color: is3rd ? "#fff" : "var(--text)" }}
          onClick={() => postEngineAction({ type: "TOGGLE_THIRD_PERSON" }, ctx.dispatch)}
        >
          📷 Toggle Perspective (T / F5)
        </button>
        <button
          className="cc-nav"
          onClick={() => postEngineAction({ type: "RESET_CAMERA" }, ctx.dispatch)}
        >
          🎯 Reset Aim & Camera
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

export function LocomotionBlock({ ctx }: BlockComponentProps) {
  const state = useBlockState(ctx, initialEngineState, onEngineSnapshot);
  const snap = state.snap;

  const currentStance = snap.stance ?? 0;
  const currentGait = snap.gait ?? 0;

  return (
    <div className="block">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "var(--font-size-md)", fontWeight: 600 }}>Locomotion & Stance Testing</span>
        <span className="pill ok">Procedural Kinematics</span>
      </div>

      <div style={{ marginTop: "10px" }}>
        <div style={{ fontSize: "var(--font-size-xs)", color: "var(--text-muted)", marginBottom: "4px" }}>STANCE STATE</div>
        <div style={{ display: "flex", gap: "6px" }}>
          {[
            { id: 0, label: "🧍 Standing (1.76m)" },
            { id: 1, label: "🧎 Crouch (1.10m)" },
            { id: 2, label: "🛌 Prone (0.60m)" }
          ].map((s) => (
            <button
              key={s.id}
              className="cc-nav"
              style={{
                background: currentStance === s.id ? "var(--accent)" : "var(--bg-raised)",
                color: currentStance === s.id ? "#fff" : "var(--text)"
              }}
              onClick={() => postEngineAction({ type: "SET_STANCE", stance: s.id }, ctx.dispatch)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginTop: "10px" }}>
        <div style={{ fontSize: "var(--font-size-xs)", color: "var(--text-muted)", marginBottom: "4px" }}>GAIT CYCLE</div>
        <div style={{ display: "flex", gap: "6px" }}>
          {[
            { id: 0, label: "🚶 Walk (1.0s)" },
            { id: 1, label: "🏃 Run (0.7s)" },
            { id: 2, label: "⚡ Sprint (0.5s)" }
          ].map((g) => (
            <button
              key={g.id}
              className="cc-nav"
              style={{
                background: currentGait === g.id ? "var(--accent)" : "var(--bg-raised)",
                color: currentGait === g.id ? "#fff" : "var(--text)"
              }}
              onClick={() => postEngineAction({ type: "SET_GAIT", gait: g.id }, ctx.dispatch)}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: "8px", marginTop: "12px", alignItems: "center" }}>
        <button
          className="cc-nav"
          onClick={() => postEngineAction({ type: "TRIGGER_DASH" }, ctx.dispatch)}
        >
          💨 Trigger Dash (C)
        </button>
        <button
          className="cc-nav"
          onClick={() => postEngineAction({ type: "TRIGGER_SLIDE" }, ctx.dispatch)}
        >
          🏂 Trigger Slide
        </button>
        <div style={{ flex: 1, marginLeft: "8px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--font-size-xs)" }}>
            <span>Stamina</span>
            <span className="mono">{(snap.stamina ?? 100).toFixed(0)}%</span>
          </div>
          <div style={{ height: "6px", background: "var(--bg-raised)", borderRadius: "3px", overflow: "hidden", marginTop: "2px" }}>
            <div style={{ height: "100%", width: `${Math.max(0, Math.min(100, snap.stamina ?? 100))}%`, background: "#22c55e" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function CharacterRigBlock({ ctx }: BlockComponentProps) {
  const state = useBlockState(ctx, initialEngineState, onEngineSnapshot);
  const snap = state.snap;
  const holding = snap.character?.holdingWeapon ?? true;
  const reloading = snap.character?.isReloading ?? false;

  return (
    <div className="block">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "var(--font-size-md)", fontWeight: 600 }}>Skeletal Rig & Character Model</span>
        <span className="pill ok">32 Bones (20 Active)</span>
      </div>

      <div style={{ background: "var(--bg-raised)", borderRadius: "var(--radius-sm)", padding: "10px", marginTop: "8px", fontSize: "var(--font-size-sm)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
          <div><strong>Core Spine:</strong> <span className="mono">Root → Pelvis → Spine → Chest</span></div>
          <div><strong>Head Chain:</strong> <span className="mono">Neck (4) → Head (5)</span></div>
          <div><strong>Left Arm:</strong> <span className="mono">LShoulder (6) → LHand (9)</span></div>
          <div><strong>Right Arm:</strong> <span className="mono">RShoulder (10) → RHand (13)</span></div>
          <div><strong>Left Leg:</strong> <span className="mono">LThigh (14) → LFoot (16)</span></div>
          <div><strong>Right Leg:</strong> <span className="mono">RThigh (17) → RFoot (19)</span></div>
        </div>
        <div style={{ marginTop: "6px", fontSize: "var(--font-size-xs)", color: "var(--text-muted)" }}>
          {snap.thirdPerson
            ? "● 3rd Person View: Full humanoid rendered with RHand weapon socket."
            : "● 1st Person View: Head/neck collapsed to 0; viewmodel weapon & arms rendered in foreground."}
        </div>
      </div>

      <div style={{ marginTop: "10px", fontSize: "var(--font-size-xs)", color: "var(--text-muted)", marginBottom: "4px" }}>
        CHARACTER MODEL & ANIMATION ACTIONS
      </div>
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
        <button
          className="cc-nav"
          style={{ background: holding ? "var(--accent)" : "var(--bg-raised)", color: holding ? "#fff" : "var(--text)" }}
          onClick={() => postEngineAction({ type: "SET_WEAPON_HOLD", holding: !holding }, ctx.dispatch)}
        >
          {holding ? "⚔️ Stance: Holding Weapon" : "🧍 Stance: Arms Relaxed"}
        </button>
        <button
          className="cc-nav"
          onClick={() => postEngineAction({ type: "TRIGGER_RECOIL" }, ctx.dispatch)}
        >
          💥 Recoil Impulse Kick
        </button>
        <button
          className="cc-nav"
          style={{ background: reloading ? "#eab308" : "var(--bg-raised)", color: reloading ? "#000" : "var(--text)" }}
          onClick={() => postEngineAction({ type: "TRIGGER_RELOAD" }, ctx.dispatch)}
        >
          🔄 Magazine Reload Sequence (R)
        </button>
        <button
          className="cc-nav"
          onClick={() => postEngineAction({ type: "BAKE_CHARACTER_MODEL" }, ctx.dispatch)}
        >
          🎨 Bake Character Model in World
        </button>
      </div>
    </div>
  );
}

const WEAPONS_CATALOG = [
  { id: "sidearm_light", name: "Sidearm Light", caliber: "light", ammo: "light_fmj", damage: 10.0, fire: "semi", icon: "🔫", desc: "Compact semi-auto 9mm pistol with fast draw." },
  { id: "smg_light", name: "SMG Light", caliber: "light", ammo: "light_hp", damage: 9.0, fire: "auto", icon: "⚡", desc: "High rate-of-fire compact submachine gun." },
  { id: "shotgun_light", name: "Shotgun Light", caliber: "light", ammo: "light_ap", damage: 24.0, fire: "semi", icon: "💥", desc: "Pump-action spread shotgun with heavy buckshot." },
  { id: "starter_rifle", name: "Starter Rifle", caliber: "medium", ammo: "medium_fmj", damage: 16.0, fire: "semi", icon: "🎯", desc: "Tactical assault rifle, balanced range and handling." },
  { id: "marksman_rifle", name: "Marksman DMR", caliber: "medium", ammo: "medium_tracer", damage: 22.0, fire: "semi", icon: "🔭", desc: "Semi-automatic designated marksman precision rifle." },
  { id: "lmg_medium", name: "LMG Medium", caliber: "medium", ammo: "medium_shred", damage: 18.0, fire: "auto", icon: "🛡️", desc: "Sustained-fire squad light machine gun with box mag." },
  { id: "sniper_heavy", name: "Sniper Heavy", caliber: "heavy", ammo: "heavy_fmj", damage: 45.0, fire: "bolt", icon: "🏹", desc: "High-caliber bolt-action anti-materiel precision sniper." },
  { id: "cannon_heavy", name: "Heavy Cannon", caliber: "heavy", ammo: "heavy_he", damage: 60.0, fire: "semi", icon: "💣", desc: "Large-bore explosive assault cannon with reinforced frame." },
  { id: "carbine_energy", name: "Carbine Energy", caliber: "energy", ammo: "energy_bolt", damage: 20.0, fire: "auto", icon: "💠", desc: "Plasma pulse assault carbine with power cell mag." },
  { id: "railgun_energy", name: "Railgun Energy", caliber: "energy", ammo: "energy_pierce", damage: 50.0, fire: "semi", icon: "⚡", desc: "Electromagnetic accelerator beam with penetrating bolts." }
];

export function WeaponsBlock({ ctx }: BlockComponentProps) {
  const state = useBlockState(ctx, initialEngineState, onEngineSnapshot);
  const [selectedWepId, setSelectedWepId] = useState<string>("starter_rifle");
  const caliber = state.snap.caliber ?? 0;
  const activeWep = state.snap.activeWeapon;

  const currentWep = WEAPONS_CATALOG.find((w) => w.id === selectedWepId) ?? WEAPONS_CATALOG[3]!;

  return (
    <div className="block">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <span style={{ fontSize: "var(--font-size-md)", fontWeight: 600 }}>Weapons & Model Painter</span>
          <span style={{ marginLeft: "8px", fontSize: "var(--font-size-xs)", color: "var(--text-muted)" }}>
            10 Ammo Types · 4 Calibers
          </span>
        </div>
        <span className="pill ok">
          Active: {activeWep ? activeWep.id : currentWep.id}
        </span>
      </div>

      <div style={{ marginTop: "10px" }}>
        <div style={{ fontSize: "var(--font-size-xs)", color: "var(--text-muted)", marginBottom: "4px" }}>CALIBER FILTER</div>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {[
            { id: 0, label: "1: Light (9mm / SMG / Shotgun)" },
            { id: 1, label: "2: Medium (Rifle / DMR / LMG)" },
            { id: 2, label: "3: Heavy (Sniper / Cannon)" },
            { id: 3, label: "4: Energy (Carbine / Railgun)" }
          ].map((c) => (
            <button
              key={c.id}
              className="cc-nav"
              style={{
                background: caliber === c.id ? "var(--accent)" : "var(--bg-raised)",
                color: caliber === c.id ? "#fff" : "var(--text)"
              }}
              onClick={() => postEngineAction({ type: "SET_CALIBER", caliber: c.id }, ctx.dispatch)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginTop: "12px" }}>
        <div style={{ fontSize: "var(--font-size-xs)", color: "var(--text-muted)", marginBottom: "4px" }}>
          SELECT WEAPON MODEL (ALL 10 AMMO TYPES)
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "6px" }}>
          {WEAPONS_CATALOG.map((w) => {
            const isSelected = selectedWepId === w.id;
            const isActiveInEngine = activeWep?.id === w.id;
            return (
              <button
                key={w.id}
                className="cc-nav"
                style={{
                  padding: "6px 8px",
                  fontSize: "var(--font-size-xs)",
                  textAlign: "left",
                  background: isSelected ? "var(--accent)" : "var(--bg-raised)",
                  color: isSelected ? "#fff" : "var(--text)",
                  border: isActiveInEngine ? "1px solid var(--status-ok-text)" : "1px solid transparent"
                }}
                onClick={() => setSelectedWepId(w.id)}
              >
                <div>{w.icon} <strong>{w.name}</strong></div>
                <div style={{ fontSize: "10px", opacity: 0.8, textTransform: "uppercase" }}>{w.caliber} · {w.ammo}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ background: "var(--bg-raised)", borderRadius: "var(--radius-sm)", padding: "10px", marginTop: "12px", fontSize: "var(--font-size-sm)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <strong style={{ fontSize: "var(--font-size-md)" }}>{currentWep.icon} {currentWep.name}</strong>
          <span className="pill" style={{ textTransform: "uppercase" }}>{currentWep.caliber} · {currentWep.fire}</span>
        </div>
        <div style={{ fontSize: "var(--font-size-xs)", color: "var(--text-muted)", marginTop: "2px" }}>{currentWep.desc}</div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "8px", marginTop: "8px" }}>
          <div><strong>Ammo Type:</strong> <span className="mono">{currentWep.ammo}</span></div>
          <div><strong>Base Damage:</strong> <span className="mono">{currentWep.damage.toFixed(1)}</span></div>
          <div><strong>Fire Mode:</strong> <span className="mono">{currentWep.fire}</span></div>
          <div><strong>Voxel Model:</strong> <span className="mono">{currentWep.id}.vox.json</span></div>
        </div>

        <div style={{ marginTop: "6px", fontSize: "var(--font-size-xs)", color: "var(--text-muted)" }}>
          <strong>Modular Parts:</strong> Receiver (Action) · Carbon Barrel · Treated Wood/Metal Stock · Magazine Well · Optic Sight
        </div>
      </div>

      <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
        <button
          className="cc-nav"
          style={{ background: "var(--accent)", color: "#fff" }}
          onClick={() => postEngineAction({ type: "EQUIP_WEAPON", weaponId: currentWep.id }, ctx.dispatch)}
        >
          🔫 Equip Weapon ({currentWep.name})
        </button>
        <button
          className="cc-nav"
          onClick={() => postEngineAction({ type: "BAKE_WEAPON_MODEL", weaponId: currentWep.id }, ctx.dispatch)}
        >
          🎨 Bake Weapon Model in World
        </button>
        <button
          className="cc-nav"
          onClick={() => postEngineAction({ type: "TRIGGER_RELOAD" }, ctx.dispatch)}
        >
          🔄 Magazine Reload (R)
        </button>
        <button
          className="cc-nav"
          onClick={() => postEngineAction({ type: "TRIGGER_RECOIL" }, ctx.dispatch)}
        >
          💥 Recoil Kick
        </button>
        <button
          className="cc-nav"
          onClick={() => postEngineAction({ type: "TOGGLE_ADS" }, ctx.dispatch)}
        >
          🎯 Aim Down Sights (RMB)
        </button>
        <button
          className="cc-nav"
          onClick={() => postEngineAction({ type: "CYCLE_WEAPON" }, ctx.dispatch)}
        >
          🔄 Cycle Weapon (V)
        </button>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 3. Visuals & Environment Blocks
// -----------------------------------------------------------------------------

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

  return (
    <div className="block">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "var(--font-size-md)", fontWeight: 600 }}>Post-Processing Parameters</span>
        <button
          className="cc-nav"
          style={{ padding: "3px 8px", fontSize: "var(--font-size-xs)" }}
          onClick={() => postEngineAction({ type: "RESET_VISUAL_PARAMS" }, ctx.dispatch)}
        >
          ↺ Reset Defaults
        </button>
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
    </div>
  );
}

export function StylePresetsBlock({ ctx }: BlockComponentProps) {
  const applyPreset = (name: string) => {
    postEngineAction({ type: "APPLY_PRESET", name }, ctx.dispatch);
  };

  return (
    <div className="block">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "var(--font-size-md)", fontWeight: 600 }}>Renderer Style Presets</span>
        <span className="pill ok">Registry Linked</span>
      </div>

      <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
        <button className="cc-nav" onClick={() => applyPreset("Retro")}>🕹️ Retro CRT</button>
        <button className="cc-nav" onClick={() => applyPreset("Clean")}>✨ Clean Modern</button>
        <button className="cc-nav" onClick={() => applyPreset("Original")}>📐 Original Flat</button>
      </div>

      <div style={{ marginTop: "10px", fontSize: "var(--font-size-xs)", color: "var(--text-muted)" }}>
        Applies unified parameters for render scaling, 4-bit posterization, spatial dithering, and fisheye lens effects.
      </div>
    </div>
  );
}

export function EnvironmentLightingBlock({ ctx }: BlockComponentProps) {
  const state = useBlockState(ctx, initialEngineState, onEngineSnapshot);
  const snap = state.snap;
  const params = snap.visualParams ?? {};
  const timeOfDay = snap.timeOfDay ?? 0.25;

  const setParam = (key: string, value: number | boolean) => {
    postEngineAction({
      type: "SET_VISUAL_PARAM",
      key,
      value: typeof value === "boolean" ? (value ? 1 : 0) : value
    }, ctx.dispatch);
  };

  return (
    <div className="block">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "var(--font-size-md)", fontWeight: 600 }}>Environment & Sky Lighting</span>
        <span className={`pill ${timeOfDay > 0.7 || timeOfDay < 0.2 ? "warn" : "ok"}`}>
          {timeOfDay > 0.7 || timeOfDay < 0.2 ? "🌙 Night (Moon Dir Active)" : "☀️ Day (Sun Zenith)"}
        </span>
      </div>

      <div style={{ marginTop: "12px" }}>
        <label style={{ fontSize: "var(--font-size-xs)", display: "flex", justifyContent: "space-between" }}>
          <span>Time of Day</span>
          <span className="mono">{(timeOfDay * 24).toFixed(1)}:00 ({timeOfDay.toFixed(2)})</span>
        </label>
        <input
          type="range"
          min={0.0}
          max={1.0}
          step={0.02}
          value={timeOfDay}
          onChange={(e) => postEngineAction({ type: "SET_TIME_OF_DAY", timeOfDay: parseFloat(e.target.value) }, ctx.dispatch)}
          style={{ width: "100%" }}
        />
      </div>

      <div style={{ display: "flex", gap: "16px", marginTop: "14px", flexWrap: "wrap", fontSize: "var(--font-size-sm)" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={Boolean(params.upscale_nearest ?? true)}
            onChange={(e) => setParam("upscale_nearest", e.target.checked)}
          />
          Nearest Pixel Upscale
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={Boolean(params.textures ?? true)}
            onChange={(e) => setParam("textures", e.target.checked)}
          />
          CC0 Texture Array Active
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={Boolean(params.shadows ?? true)}
            onChange={(e) => setParam("shadows", e.target.checked)}
          />
          Occupancy-Volume Raymarched Shadows
        </label>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 4. Telemetry & Console Blocks
// -----------------------------------------------------------------------------

export function PerformanceTelemetryBlock({ ctx }: BlockComponentProps) {
  const state = useBlockState(ctx, initialEngineState, onEngineSnapshot);
  const snap = state.snap;
  const isPaused = Boolean(snap.paused);

  return (
    <div className="block">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "var(--font-size-md)", fontWeight: 600 }}>Simulation & Viewport Telemetry</span>
        <span className={`pill ${isPaused ? "warn" : "ok"}`}>
          {isPaused ? "PAUSED (Sim Idle)" : "RUNNING (120 Hz Sim Lock)"}
        </span>
      </div>

      <div className="metrics-row" style={{ marginTop: "10px" }}>
        <div className="metric">
          <div className="muted" style={{ fontSize: "var(--font-size-xs)" }}>SIM TICK</div>
          <div style={{ fontSize: "16px", fontWeight: 700, fontFamily: "var(--font-mono)" }}>{snap.tick ?? 0}</div>
        </div>
        <div className="metric">
          <div className="muted" style={{ fontSize: "var(--font-size-xs)" }}>PLAYER HEALTH</div>
          <div style={{ fontSize: "16px", fontWeight: 700, fontFamily: "var(--font-mono)", color: (snap.health ?? 100) < 50 ? "#ef4444" : "#22c55e" }}>
            {snap.health !== undefined ? snap.health.toFixed(1) : "--"}
          </div>
        </div>
        <div className="metric">
          <div className="muted" style={{ fontSize: "var(--font-size-xs)" }}>LIVE VERTICES</div>
          <div style={{ fontSize: "16px", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
            {snap.vertices ? snap.vertices.toLocaleString() : "--"}
          </div>
        </div>
        <div className="metric">
          <div className="muted" style={{ fontSize: "var(--font-size-xs)" }}>CAMERA PERSPECTIVE</div>
          <div style={{ fontSize: "14px", fontWeight: 600 }}>
            {snap.thirdPerson ? "3rd Person" : "1st Person"}
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

export function EngineLogBlock({ ctx }: BlockComponentProps) {
  const state = useBlockState(ctx, initialEngineState, onEngineSnapshot);

  return (
    <div className="block">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "var(--font-size-md)", fontWeight: 600 }}>IPC Event & Engine Log Stream</span>
        <span className="pill ok">Active Bridge</span>
      </div>

      <div style={{
        marginTop: "8px",
        background: "var(--bg-raised)",
        borderRadius: "var(--radius-sm)",
        padding: "8px",
        fontFamily: "var(--font-mono)",
        fontSize: "12px",
        maxHeight: "220px",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: "4px"
      }}>
        {state.logs.map((line, idx) => (
          <div key={idx} style={{ color: line.includes("UI ->") ? "#38bdf8" : line.includes("system") ? "#22c55e" : "var(--text-muted)" }}>
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Block Manifests & Host Registration
// -----------------------------------------------------------------------------

export const mapInspectorManifest: BlockManifest = {
  id: "engine.map.inspector",
  name: "Voxel Raycast & Properties",
  version: "0.2.0",
  family: "console",
  substrates: ["react"],
  size: { min: [320, 180], ideal: [540, 260] },
  ports: { in: [{ name: "events", type: "event[]" }], out: [] }
};

export const mapToolsManifest: BlockManifest = {
  id: "engine.map.tools",
  name: "Material Palette & Sculpt Tools",
  version: "0.2.0",
  family: "console",
  substrates: ["react"],
  size: { min: [320, 220], ideal: [540, 300] },
  ports: { in: [{ name: "events", type: "event[]" }], out: [] }
};

export const mapSyncManifest: BlockManifest = {
  id: "engine.map.sync",
  name: "Map Format & Java Painter Sync",
  version: "0.2.0",
  family: "console",
  substrates: ["react"],
  size: { min: [320, 160], ideal: [540, 220] },
  ports: { in: [{ name: "events", type: "event[]" }], out: [] }
};

export const mapTerrainManifest: BlockManifest = {
  id: "engine.map.terrain",
  name: "World Dimensions & Terrain",
  version: "0.2.0",
  family: "console",
  substrates: ["react"],
  size: { min: [320, 160], ideal: [540, 220] },
  ports: { in: [{ name: "events", type: "event[]" }], out: [] }
};

export const structuralMatrixManifest: BlockManifest = {
  id: "engine.map.structural",
  name: "Structural Integrity Matrix",
  version: "0.2.0",
  family: "console",
  substrates: ["react"],
  size: { min: [320, 200], ideal: [540, 280] },
  ports: { in: [{ name: "events", type: "event[]" }], out: [] }
};

export const cameraPerspectiveManifest: BlockManifest = {
  id: "engine.model.camera",
  name: "Camera & Perspective Tracking",
  version: "0.2.0",
  family: "console",
  substrates: ["react"],
  size: { min: [320, 180], ideal: [540, 260] },
  ports: { in: [{ name: "events", type: "event[]" }], out: [] }
};

export const locomotionManifest: BlockManifest = {
  id: "engine.model.locomotion",
  name: "Procedural Locomotion & Stance",
  version: "0.2.0",
  family: "console",
  substrates: ["react"],
  size: { min: [320, 200], ideal: [540, 280] },
  ports: { in: [{ name: "events", type: "event[]" }], out: [] }
};

export const characterRigManifest: BlockManifest = {
  id: "engine.model.character",
  name: "Skeletal Hierarchy & Rig",
  version: "0.2.0",
  family: "console",
  substrates: ["react"],
  size: { min: [320, 160], ideal: [540, 220] },
  ports: { in: [{ name: "events", type: "event[]" }], out: [] }
};

export const weaponsManifest: BlockManifest = {
  id: "engine.model.weapons",
  name: "Weapons & Item Palette",
  version: "0.2.0",
  family: "console",
  substrates: ["react"],
  size: { min: [320, 160], ideal: [540, 220] },
  ports: { in: [{ name: "events", type: "event[]" }], out: [] }
};

export const visualsParamsManifest: BlockManifest = {
  id: "engine.visuals.params",
  name: "Post-Processing Pipeline",
  version: "0.2.0",
  family: "console",
  substrates: ["react"],
  size: { min: [320, 240], ideal: [540, 340] },
  ports: { in: [{ name: "events", type: "event[]" }], out: [] }
};

export const visualsPresetsManifest: BlockManifest = {
  id: "engine.visuals.presets",
  name: "Style Presets",
  version: "0.2.0",
  family: "console",
  substrates: ["react"],
  size: { min: [320, 160], ideal: [540, 220] },
  ports: { in: [{ name: "events", type: "event[]" }], out: [] }
};

export const visualsLightingManifest: BlockManifest = {
  id: "engine.visuals.lighting",
  name: "Environment Lighting & Shadows",
  version: "0.2.0",
  family: "console",
  substrates: ["react"],
  size: { min: [320, 180], ideal: [540, 260] },
  ports: { in: [{ name: "events", type: "event[]" }], out: [] }
};

export const telemetryManifest: BlockManifest = {
  id: "engine.status.telemetry",
  name: "Simulation & Viewport Telemetry",
  version: "0.2.0",
  family: "console",
  substrates: ["react"],
  size: { min: [320, 180], ideal: [540, 240] },
  ports: { in: [{ name: "events", type: "event[]" }], out: [] }
};

export const logManifest: BlockManifest = {
  id: "engine.console.log",
  name: "IPC Event & Engine Log Stream",
  version: "0.2.0",
  family: "console",
  substrates: ["react"],
  size: { min: [320, 160], ideal: [540, 220] },
  ports: { in: [{ name: "events", type: "event[]" }], out: [] }
};

export function registerEngineBlocks(host: ReactBlockHost): void {
  host.register(mapInspectorManifest.id, { manifest: mapInspectorManifest, Component: MapInspectorBlock });
  host.register(mapToolsManifest.id, { manifest: mapToolsManifest, Component: MapToolsBlock });
  host.register(mapSyncManifest.id, { manifest: mapSyncManifest, Component: MapSyncBlock });
  host.register(mapTerrainManifest.id, { manifest: mapTerrainManifest, Component: WorldTerrainBlock });
  host.register(structuralMatrixManifest.id, { manifest: structuralMatrixManifest, Component: StructuralMatrixBlock });

  host.register(cameraPerspectiveManifest.id, { manifest: cameraPerspectiveManifest, Component: CameraPerspectiveBlock });
  host.register(locomotionManifest.id, { manifest: locomotionManifest, Component: LocomotionBlock });
  host.register(characterRigManifest.id, { manifest: characterRigManifest, Component: CharacterRigBlock });
  host.register(weaponsManifest.id, { manifest: weaponsManifest, Component: WeaponsBlock });

  host.register(visualsParamsManifest.id, { manifest: visualsParamsManifest, Component: VisualParametersBlock });
  host.register(visualsPresetsManifest.id, { manifest: visualsPresetsManifest, Component: StylePresetsBlock });
  host.register(visualsLightingManifest.id, { manifest: visualsLightingManifest, Component: EnvironmentLightingBlock });

  host.register(telemetryManifest.id, { manifest: telemetryManifest, Component: PerformanceTelemetryBlock });
  host.register(logManifest.id, { manifest: logManifest, Component: EngineLogBlock });
}
