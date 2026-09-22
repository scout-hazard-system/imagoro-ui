import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import type { BusEvent } from "@imagoro/core";
import { EventBus, connectSse, replayFixtures } from "@imagoro/core";
import fixtures from "@imagoro/core/fixtures";
import { ReactBlockHost, makeCtx } from "@imagoro/renderer-react";
import { registerAll } from "@imagoro/blocks-registrations";
import { registerCommandCenterOverlay } from "./overlay-blocks.js";
import "@imagoro/renderer-react/app.css";
import "leaflet/dist/leaflet.css";
import "../../../design/gen.css";
import { SECTIONS, type Section, type SlotSpec } from "./sections.js";
import "./shell.css";

const bus = new EventBus();
const host = new ReactBlockHost();
registerAll(host);
registerCommandCenterOverlay(host);

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
  const [sectionId, setSectionId] = useState<string>(SECTIONS[0]?.id ?? "overview");
  const section = SECTIONS.find((s) => s.id === sectionId) ?? SECTIONS[0];
  return (
    <div className="cc">
      <nav className="cc-rail" aria-label="command center sections">
        <div className="cc-brand">
          <strong>imagoro</strong>
          <span>command center</span>
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
          <span className="pill ok">blocks: {host.size}</span>
          <span className="pill mute">react only</span>
        </div>
      </nav>
      <main className="cc-main">
        <header className="card header">
          <div>
            <h1 className="cc-title">Imagoro Command Center</h1>
            <span className="muted">composable block GUI · node canvas · fixtures replay + SSE</span>
          </div>
          <div className="status-group">
            <span className="pill mute">SSE /api/pipeline/stream</span>
            <span className="pill mute">fixtures replay</span>
          </div>
        </header>
        <Workspace key={section?.id} section={section ?? SECTIONS[0]!} />
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <CommandCenter />
  </StrictMode>
);

const cancel = replayFixtures(bus, fixtures, 30);
const stopSse = connectSse({ url: "/api/pipeline/stream", onEvent: (evt: BusEvent) => bus.dispatch(evt) });

void cancel;
void stopSse;