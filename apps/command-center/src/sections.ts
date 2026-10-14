import type { Config } from "@imagoro/core";

export type SlotSpan = "full" | "pair";

export interface SlotSpec {
  block: string;
  label?: string;
  config?: Config;
  span?: SlotSpan;
}

export interface Section {
  id: string;
  label: string;
  blurb: string;
  slots: SlotSpec[];
}

export const SECTIONS: Section[] = [
  {
    id: "map",
    label: "Map Editor",
    blurb: "Live voxel raycasting, painting, carve/demolition tools, palette management, and Java Painter sync.",
    slots: [
      { block: "engine.map.inspector", span: "pair", label: "Voxel Raycast & Properties" },
      { block: "engine.map.tools", span: "pair", label: "Material Palette & Sculpt Tools" },
      { block: "engine.map.structural", span: "full", label: "Structural Integrity Matrix" },
      { block: "engine.map.sync", span: "pair", label: "Map Format & Java Painter Sync" },
      { block: "engine.map.terrain", span: "pair", label: "World Dimensions & Terrain" }
    ]
  },
  {
    id: "scene",
    label: "Scene & Prefabs",
    blurb: "Editor scene hierarchy, undo/redo history, and prefab stamping with rotation.",
    slots: [
      { block: "engine.map.scene", span: "pair", label: "Scene Hierarchy & History" },
      { block: "engine.map.prefabs", span: "pair", label: "Prefab Catalog & Stamp" }
    ]
  },
  {
    id: "model",
    label: "Model & Character",
    blurb: "Humanoid skeletal rig, limb kinematics, procedural locomotion, and camera perspective.",
    slots: [
      { block: "engine.model.camera", span: "pair", label: "Camera & Perspective Tracking" },
      { block: "engine.model.locomotion", span: "pair", label: "Procedural Locomotion & Stance" },
      { block: "engine.model.character", span: "pair", label: "Skeletal Hierarchy & Rig" },
      { block: "engine.model.weapons", span: "pair", label: "Weapons & Item Palette" }
    ]
  },
  {
    id: "visuals",
    label: "Visuals & Shaders",
    blurb: "Vulkan post-processing chain, retro CRT emulation, render scale, lighting, and occupancy shadows.",
    slots: [
      { block: "engine.visuals.params", span: "pair", label: "Post-Processing Pipeline" },
      { block: "engine.visuals.presets", span: "pair", label: "Style Presets" },
      { block: "engine.visuals.lighting", span: "full", label: "Environment Lighting & Shadow Volumes" }
    ]
  },
  {
    id: "telemetry",
    label: "Telemetry & Logs",
    blurb: "Simulation timing, vertex counts, GPU memory allocations, and IPC bridge activity log.",
    slots: [
      { block: "engine.status.telemetry", span: "full", label: "Simulation & Viewport Telemetry" },
      { block: "engine.console.log", span: "full", label: "IPC Event & Engine Log Stream" }
    ]
  }
];