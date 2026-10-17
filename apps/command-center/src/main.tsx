import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { EventBus } from "@imagoro/core";
import { ReactBlockHost, makeCtx } from "@imagoro/renderer-react";
import { registerEngineBlocks } from "./engine-blocks.js";
import "@imagoro/renderer-react/app.css";
import "../../../design/gen.css";
import { SECTIONS, type Section, type SlotSpec } from "./sections.js";
import "./shell.css";

const bus = new EventBus();
const host = new ReactBlockHost();
registerEngineBlocks(host);

function Slot({ spec }: { spec: SlotSpec }) {
  const entry = host.entry(spec.block);
  if (!entry) return null;
  const ctx = makeCtx({ ...spec.config }, bus);
  return (
    <article className="slot" data-slot={spec.block} data-span={spec.span ?? "single"}>
      <header className="slot-head">
        <h2>{spec.label ?? entry.manifest.name}</h2>
        <span className="slot-id">
          {spec.block} v{entry.manifest.version}
        </span>
      </header>
      <entry.Component ctx={ctx} />
    </article>
  );
}

function Workspace({ section }: { section: Section }) {
  return (
    <>
      <header className="card header section-head">
        <h1>{section.label}</h1>
        <p className="muted">{section.blurb}</p>
      </header>
      <section className="grid">{section.slots.map((s) => <Slot key={s.block} spec={s} />)}</section>
    </>
  );
}

function CommandCenter() {
  const [sectionId, setSectionId] = useState<string>(SECTIONS[0]?.id ?? "map");
  const section = SECTIONS.find((s) => s.id === sectionId) ?? SECTIONS[0];
  const isWebView2 = typeof window !== "undefined" && Boolean((window as any).chrome?.webview);

  return (
    <div className="cc">
      <nav className="cc-rail" aria-label="command center sections">
        <div className="cc-brand">
          <strong>VOXEL FPS</strong>
          <span>map & model editor</span>
        </div>
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            className={`cc-nav${section?.id === s.id ? " cc-nav-active" : ""}`}
            onClick={() => setSectionId(s.id)}
          >
            {s.label}
          </button>
        ))}
        <div className="cc-rail-foot">
          <span className="pill ok">editor tools: {host.size}</span>
          <span className="pill mute">win32 child</span>
        </div>
      </nav>
      <main className="cc-main">
        <header className="card header">
          <div>
            <h1 className="cc-title">Map & Model Workspace</h1>
            <span className="muted">authoritative 3d simulation · win32 webview2 bridge · live telemetry</span>
          </div>
          <div className="status-group">
            {isWebView2 ? (
              <span className="pill ok">⚡ WebView2 Native Bridge Active</span>
            ) : (
              <span className="pill mute">browser standalone dev</span>
            )}
            <span className="pill ok">Sim 120 Hz</span>
          </div>
        </header>
        <Workspace key={section?.id} section={section ?? SECTIONS[0]!} />
      </main>
    </div>
  );
}

if (typeof window !== "undefined" && (window as any).chrome?.webview) {
  (window as any).chrome.webview.addEventListener("message", (evt: any) => {
    const raw = evt.data;
    if (!raw) return;
    try {
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      const type = parsed.type || "engine/event";
      bus.dispatch({
        type,
        ts: Date.now(),
        payload: parsed.data ?? parsed.payload ?? parsed
      });
    } catch {
      bus.dispatch({
        type: "engine/raw",
        ts: Date.now(),
        payload: { raw }
      });
    }
  });
  bus.dispatch({
    type: "console/log",
    ts: Date.now(),
    payload: { line: "[webview] Connected to native C++ Vulkan voxel engine bridge" }
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <CommandCenter />
  </StrictMode>
);