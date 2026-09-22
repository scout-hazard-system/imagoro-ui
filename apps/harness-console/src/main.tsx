import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import type { BusEvent, IntentProposal } from "@imagoro/core";
import { EventBus, sidebarEntryByIdFor } from "@imagoro/core";
import { ReactBlockHost, makeCtx } from "@imagoro/renderer-react";
import { registerAll, registerOverlay } from "@imagoro/blocks-registrations";
import "@imagoro/renderer-react/app.css";
import "leaflet/dist/leaflet.css";
import "../../../design/gen.css";
import { SECTIONS, type Section, type SlotSpec } from "./sections.js";
import { listTools, callTool, toolResultEvent, mcpErrorEvent, broker, getMcpRole, type McpToolDef } from "./mcp.js";
import "./shell.css";

const bus = new EventBus();
const host = new ReactBlockHost();
registerAll(host);
registerOverlay(host);

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

function ToolPills({ tools, onRun }: { tools: McpToolDef[]; onRun: (name: string) => void }) {
  return (
    <div className="toolbar">
      <span className="muted">harness tools ({tools.length}):</span>
      {tools.map((t) => (
        <button key={t.name} className="pill tool" title={t.description} onClick={() => onRun(t.name)}>
          {t.name}
        </button>
      ))}
    </div>
  );
}

function HarnessConsole() {
  const [sectionId, setSectionId] = useState<string>(SECTIONS[0]?.id ?? "overview");
  const [tools, setTools] = useState<McpToolDef[]>([]);
  const [gateway, setGateway] = useState<string>("connecting");
  const section = SECTIONS.find((s) => s.id === sectionId) ?? SECTIONS[0];

  useEffect(() => {
    let alive = true;
    listTools()
      .then((t) => {
        if (!alive) return;
        setTools(t);
        setGateway("up");
        bus.dispatch({ type: "console/log", ts: Date.now(), payload: { line: `[gateway] MCP tools/list ok (${t.length} tools)` } });
      })
      .catch((err: Error) => {
        if (!alive) return;
        setGateway("unreachable");
        bus.dispatch({ type: "console/log", ts: Date.now(), payload: { line: `[gateway] ${err.message}` } });
      });
    return () => {
      alive = false;
    };
  }, []);

  // L1 -> L3 bridge: confirmed intent proposals execute ONLY through the broker.
  useEffect(() => {
    const off = bus.subscribe((evt) => {
      if (evt.type !== "intent/execute") return;
      const proposal = (evt as BusEvent).payload?.proposal as IntentProposal | undefined;
      if (!proposal || typeof proposal?.id !== "string" || !Array.isArray(proposal?.steps)) return;
      bus.dispatch({
        type: "console/log",
        ts: Date.now(),
        payload: { line: `[intent] executing ${proposal.id} (${proposal.steps.length} steps, role=${proposal.role}, dryRun=${proposal.dryRun})` }
      });
      void broker.executeIntent(proposal, { confirmed: proposal.confirmed }).then((results) => {
        for (const r of results) {
          if (!r.ok) bus.dispatch(mcpErrorEvent(r.tool, new Error(r.denial)));
          else if (r.data) bus.dispatch(toolResultEvent(r.tool, r.data));
        }
        bus.dispatch({ type: "intent/execute-result", ts: Date.now(), payload: { id: proposal.id, results } });
      });
    });
    return off;
  }, []);

  // L2: sidebar/activate — tool entries dispatch via the broker (unconfirmed =>
  // dangerous locked), block entries are noted for navigation.
  useEffect(() => {
    const off = bus.subscribe((evt) => {
      if (evt.type !== "sidebar/activate") return;
      const entryId = (evt as BusEvent).payload?.entryId as string | undefined;
      const entry = typeof entryId === "string" ? sidebarEntryByIdFor(entryId, getMcpRole()) : undefined;
      if (!entry) return;
      if (entry.tool) {
        runToolViaBroker(entry.tool);
      } else if (entry.block) {
        bus.dispatch({
          type: "console/log",
          ts: Date.now(),
          payload: { line: `[sidebar] ${entry.id} opens block ${entry.block} (${entry.label})` }
        });
      }
    });
    return off;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function runToolViaBroker(name: string) {
    callTool(name)
      .then((text) => {
        if (text) bus.dispatch(toolResultEvent(name, text));
      })
      .catch((err) => bus.dispatch(mcpErrorEvent(name, err)));
  }

  function runTool(name: string) {
    bus.dispatch({ type: "console/log", ts: Date.now(), payload: { line: `[mcp] invoking ${name}...` } });
    runToolViaBroker(name);
  }

  return (
    <div className="hc">
      <nav className="hc-rail" aria-label="harness console sections">
        <div className="hc-brand">
          <strong>imagoro</strong>
          <span>harness console</span>
        </div>
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            className={`hc-nav${section?.id === s.id ? " hc-nav-active" : ""}`}
            onClick={() => setSectionId(s.id)}
          >
            {s.label}
          </button>
        ))}
        <div className="hc-rail-foot">
          <span className={`pill ${gateway === "up" ? "ok" : "mute"}`}>mcp {gateway}</span>
          <span className="pill mute">blocks: {host.size}</span>
        </div>
      </nav>
      <main className="hc-main">
        <header className="card header">
          <div>
            <h1 className="hc-title">Imagoro Harness Console</h1>
            <span className="muted">MCP-driven agentic harness · shared cluster · CLI & GUI config parity</span>
          </div>
          <div className="status-group">
            <span className="pill mute">MCP /api/rpc (imagoro-harness)</span>
            <span className="pill mute">blackboard config slot</span>
          </div>
        </header>
        {section?.id === "tools" ? (
          <div className="card tools-card">
            <ToolPills tools={tools} onRun={runTool} />
          </div>
        ) : null}
        <Workspace key={section?.id} section={section ?? SECTIONS[0]!} />
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HarnessConsole />
  </StrictMode>
);