import { useEffect, useMemo, useRef } from "react";
import type { BlockRenderProps, BusEvent, JsonObject } from "@imagoro/core";

function events(state: JsonObject): BusEvent[] {
  const e = state["events"];
  return Array.isArray(e) ? (e as BusEvent[]) : [];
}

interface ChunkBar { ts: number; energy: number; rms: number; clip: number; }

/** Audio/visualizer canvas block: waveforms drawn from chunk_captured energy rms values. */
export default function VisualizerBlock({ manifest, state }: BlockRenderProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chunks = useMemo<ChunkBar[]>(() => {
    return events(state)
      .filter((e) => e.type === "chunk_captured")
      .map((e) => ({
        ts: e.ts,
        energy: Number(e.payload["energy"] ?? 0) || 0,
        rms: Number(e.payload["rms"] ?? 0) || 0,
        clip: Number(e.payload["clip_ratio"] ?? 0) || 0,
      }))
      .slice(-64);
  }, [state]);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const { width, height } = cv;
    ctx.clearRect(0, 0, width, height);
    const n = Math.max(chunks.length, 1);
    const barW = width / n;
    chunks.forEach((c, i) => {
      const h = Math.round(Math.max(4, (c.energy * 0.7 + c.rms * 0.3) * height * 0.9));
      const x = i * barW;
      ctx.fillStyle = tweenAccent(i / n);
      ctx.fillRect(x, height - h, barW - 2, h);
      if (c.clip > 0.02) {
        ctx.fillStyle = "#ff9d66";
        ctx.fillRect(x, 2, barW - 2, Math.max(2, c.clip * 20));
      }
    });
  }, [chunks]);

  return (
    <div className="block block-visualizer" data-mid={manifest.id}>
      <header className="block__head">
        <span className="block__title">{manifest.name}</span>
        <span className="block__hint">{chunks.length} chunks</span>
      </header>
      <canvas ref={canvasRef} width={320} height={120} className="block-visualizer__canvas" />
    </div>
  );
}

function tweenAccent(t: number): string {
  const stop = Math.min(t, 1);
  const r = Math.round(79 + stop * (255 - 79));
  const g = Math.round(140 + stop * (82 - 140));
  const b = Math.round(255 - stop * (40));
  return `rgb(${r} ${g} ${b})`;
}