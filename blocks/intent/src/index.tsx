import { useState } from "react";
import { IntentSession, ROLES, isDangerousTool, type IntentProposal } from "@imagoro/core";
import type { BlockComponentProps } from "@imagoro/renderer-react";

export { manifest } from "./manifest.js";

export default function IntentBlock({ ctx }: BlockComponentProps) {
  const [text, setText] = useState("");
  const [dryRun, setDryRun] = useState(true);
  const [session] = useState(() => new IntentSession());
  const [proposal, setProposal] = useState<IntentProposal | null>(null);
  const [executing, setExecuting] = useState(false);
  const [role, setRole] = useState<string>(() => String(ctx.config.role ?? "business"));

  function propose() {
    const p = session.propose(text, role, dryRun);
    setProposal(p);
    setExecuting(false);
    ctx.dispatch({
      type: "intent/propose",
      ts: Date.now(),
      payload: { proposal: p as unknown as Record<string, unknown> }
    });
  }

  function execute(p: IntentProposal) {
    const confirmed = session.confirm(p);
    setProposal(confirmed);
    setExecuting(true);
    ctx.dispatch({
      type: "intent/execute",
      ts: Date.now(),
      payload: { proposal: confirmed as unknown as Record<string, unknown> }
    });
  }

  return (
    <section className="block intent">
      <h3>What do you want to do today?</h3>
      <div className="row">
        <select
          aria-label="role"
          value={role}
          onChange={(e) => setRole(e.currentTarget.value)}
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <label className="dryrun">
          <input type="checkbox" checked={dryRun} onChange={(e) => setDryRun(e.currentTarget.checked)} />
          {" "}dry-run (plan preview only)
        </label>
        <button className="pill ok" onClick={propose} disabled={!text.trim()}>
          Propose plan
        </button>
      </div>
      <textarea
        aria-label="intent"
        value={text}
        onChange={(e) => setText(e.currentTarget.value)}
        placeholder="e.g. show the crew roster, or status of the engine, or save this to the blackboard…"
        rows={3}
        maxLength={4000}
      />
      {proposal ? (
        <div className="plan-preview">
          <div className="row">
            <span className="muted">plan · {proposal.steps.length} step(s) · role {proposal.role}</span>
            <span className={`pill ${proposal.dryRun ? "mute" : "ok"}`}>{proposal.dryRun ? "dry-run" : "armed"}</span>
          </div>
          {proposal.steps.length === 0 ? (
            <p className="muted">No plan could be routed — nothing will execute.</p>
          ) : (
            <ol className="plan-steps">
              {proposal.steps.map((step, i) => (
                <li key={i} className={step.dangerous ? "dangerous" : undefined}>
                  <span className="tool">{step.tool}</span>
                  <span className="muted">{step.label}</span>
                  {step.dangerous ? <span className="pill warn">lock · confirm required</span> : null}
                  <code>{JSON.stringify(step.args)}</code>
                </li>
              ))}
            </ol>
          )}
          {proposal.dryRun ? (
            <p className="muted">Dry-run: nothing executed. Confirmed execution is enabled once the broker (L3) is wired.</p>
          ) : (
            <button
              className="pill ok"
              disabled={executing || proposal.steps.length === 0}
              onClick={() => void execute(proposal!)}
            >
              {executing ? "running…" : "Confirm & execute"}
            </button>
          )}
          {proposal.steps.some((s) => isDangerousTool(s.tool)) ? (
            <p className="muted">This plan contains dangerous steps (writes/system). Confirmation is required.</p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}