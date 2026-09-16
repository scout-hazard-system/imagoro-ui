import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { EventBus, connectSse, replayFixtures } from "@imagoro/core";
import fixtures from "@imagoro/core/fixtures";
import { ReactBlockHost, makeCtx } from "./host.js";
import { registerAll } from "@imagoro/blocks-registrations";
import "./app.css";
import "leaflet/dist/leaflet.css";
import "../../../design/gen.css";

const bus = new EventBus();
const host = new ReactBlockHost();
registerAll(host);
const ctx = makeCtx({}, bus);

function Slot({ id }: { id: string }) {
  const entry = host.entry(id);
  if (!entry) return null;
  return (
    <article className="slot" data-slot={id}>
      <header className="slot-head">
        <h2>{entry.manifest.name}</h2>
        <span className="slot-id">{id} v{entry.manifest.version}</span>
      </header>
      <entry.Component ctx={ctx} />
    </article>
  );
}

function Harness() {
  return (
    <main className="layout">
      <header className="card header">
        <h1>imagoro-ui harness</h1>
        <div className="status-group">
          <span className="pill ok">blocks: {host.size}</span>
          <span className="pill mute">fixtures replay</span>
          <span className="pill mute">SSE /api/pipeline/stream</span>
        </div>
      </header>
      <section className="grid">
        {host.ids().map((id) => (
          <Slot key={id} id={id} />
        ))}
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Harness />
  </StrictMode>
);

replayFixtures(bus, fixtures, 30);
connectSse({ url: "/api/pipeline/stream", onEvent: (evt) => bus.dispatch(evt) });