import type { BusEvent } from "@imagoro/core";
import { useBlockState, payload, type BlockComponentProps } from "@imagoro/renderer-react";

export { manifest } from "./manifest.js";

interface AuditState {
  total: number;
  normal: number;
  alerts: number;
  queued: number;
  browserSent: number;
  parseErrors: number;
  modalState: string;
  lastEvent: string;
}

const initial: AuditState = {
  total: 0,
  normal: 0,
  alerts: 0,
  queued: 0,
  browserSent: 0,
  parseErrors: 0,
  modalState: "idle",
  lastEvent: "none"
};

function onAudit(state: AuditState, evt: BusEvent): AuditState {
  if (evt.type === "pipeline/snapshot") {
    const p = payload(evt) as { metrics?: { notify?: Record<string, number> }; audit?: Record<string, string | boolean> };
    const notify = p.metrics?.notify;
    const audit = p.audit;
    return {
      ...state,
      total: Number(notify?.total ?? state.total),
      normal: Number(notify?.normal ?? state.normal),
      alerts: Number(notify?.alerts ?? state.alerts),
      queued: Number(notify?.queued ?? state.queued),
      browserSent: Number(notify?.browserSent ?? state.browserSent),
      parseErrors: Number(notify?.parseErrors ?? state.parseErrors),
      modalState: audit ? String(audit.modalState ?? state.modalState) : state.modalState,
      lastEvent: audit ? String(audit.lastEvent ?? state.lastEvent) : state.lastEvent
    };
  }
  if (evt.type === "audit/event") {
    const p = payload(evt);
    return {
      ...state,
      total: Number(p.dispatched ?? state.total),
      alerts: Number(p.alerts ?? state.alerts),
      queued: Number(p.queued ?? state.queued),
      browserSent: Number(p.browserSent ?? state.browserSent),
      modalState: String(p.modalState ?? state.modalState),
      lastEvent: String(p.lastEvent ?? state.lastEvent)
    };
  }
  return state;
}

export default function AuditBlock({ ctx }: BlockComponentProps) {
  const state = useBlockState(ctx, initial, onAudit);
  const rows: Array<[string, number | string]> = [
    ["Total dispatched", state.total],
    ["Normal calls", state.normal],
    ["Alerts", state.alerts],
    ["Queued", state.queued],
    ["Browser sent", state.browserSent],
    ["Parse errors", state.parseErrors]
  ];
  return (
    <section className="block">
      <h3>Notification Workflow Audit</h3>
      <div className="metrics-row">
        {rows.map(([label, value]) => (
          <div className="metric" key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <p className="muted">
        modal: <span className={state.modalState === "active" ? "pill warn" : "pill mute"}>{state.modalState}</span>
        {" "}last: <code className="mono">{state.lastEvent}</code>
      </p>
    </section>
  );
}