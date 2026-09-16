import { useEffect, useRef } from "react";
import type { BlockManifest, BusEvent } from "@imagoro/core";
import { useBlockState, payload, type BlockComponentProps } from "@imagoro/renderer-react";

export const manifest: BlockManifest = {
  id: "imagoro.visualizer",
  name: "Audio Visualizer",
  version: "0.1.0",
  family: "audio/visualizer",
  substrates: ["react"],
  size: { min: [320, 120], ideal: [560, 160] },
  ports: { in: [{ name: "rms", type: "number[]" }], out: [] },
  api: ["pipeline/stream"]
};

interface VizState {
  rms: number[];
}

const initial: VizState = { rms: [] };

function onViz(state: VizState, evt: BusEvent): VizState {
  if (evt.type === "visualizer/rms") {
    const rms = payload(evt).rms as number[] | undefined;
    return rms ? { rms } : state;
  }
  return state;
}

export default function VisualizerBlock({ ctx }: BlockComponentProps) {
  const state = useBlockState(ctx, initial, onViz);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const g = cv.getContext("2d");
    if (!g) return;
    g.clearRect(0, 0, cv.width, cv.height);
    const bars = state.rms.length ? state.rms : [0];
    const bw = cv.width / Math.max(bars.length, 8);
    bars.forEach((v, i) => {
      const h = Math.max(2, v * cv.height);
      g.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--accent") || "#4f8cff";
      g.fillRect(i * bw + 2, cv.height - h, Math.max(bw - 4, 2), h);
    });
  }, [state.rms]);

  return (
    <section className="block">
      <h3>Audio Visualizer</h3>
      <canvas ref={canvasRef} className="viz-canvas" width={560} height={96} aria-label="rms energy bars" />
    </section>
  );
}