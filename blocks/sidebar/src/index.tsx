import { useState } from "react";
import {
  SIDEBAR_GROUPS,
  SIDEBAR_ICONS,
  sidebarGroupsFor,
  sidebarEntryById,
  sidebarActivateEvent
} from "@imagoro/core";
import type { BlockComponentProps } from "@imagoro/renderer-react";

export { manifest } from "./manifest.js";

function Icon({ name, size = 16 }: { name: keyof typeof SIDEBAR_ICONS; size?: number }) {
  return (
    <svg className="sbar-icon" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      {(SIDEBAR_ICONS[name] ?? ["M3 3h18v18H3z"]).map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

export default function SidebarBlock({ ctx }: BlockComponentProps) {
  const [role, setRole] = useState<string>(() => String(ctx.config.role ?? "business"));
  const groups = sidebarGroupsFor(role);

  function activate(id: string) {
    const entry = sidebarEntryById(id);
    if (!entry) return;
    ctx.dispatch(sidebarActivateEvent(entry));
  }

  return (
    <section className="block sidebar">
      <div className="row">
        <span className="muted">registry index</span>
        <select aria-label="role" value={role} onChange={(e) => setRole(e.currentTarget.value)}>
          {["personal", "business", "enterprise"].map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>
      {groups.map((g) => (
        <section key={g.id} className="sbar-group" data-group={g.id}>
          <h4 className="muted">{g.label} ({g.entries.length})</h4>
          <ul className="sbar-list">
            {g.entries.map((e) => (
              <li key={e.id} className={e.dangerous ? "dangerous" : undefined}>
                <button
                  className="pill tool"
                  title={e.dangerous ? "dangerous · confirmation required" : e.label}
                  onClick={() => activate(e.id)}
                >
                  <Icon name={e.icon} />
                  <span>{e.label}</span>
                  {e.dangerous ? <span className="pill warn">lock</span> : null}
                  {e.tool ? <code className="muted">{e.tool}</code> : e.block ? <code className="muted">{e.block}</code> : null}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </section>
  );
}