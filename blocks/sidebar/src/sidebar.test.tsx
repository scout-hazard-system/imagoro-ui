import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
import type { BlockContext } from "@imagoro/core";
import SidebarBlock, { manifest } from "./index";

const ctx: BlockContext = {
  config: {},
  dispatch: () => {},
  subscribe: () => () => {}
};

function html(node: ReactNode): string {
  return renderToStaticMarkup(node as never);
}

describe("sidebar block", () => {
  it("is registered under imagoro.sidebar as a sidebar-family block", () => {
    expect(manifest.id).toBe("imagoro.sidebar");
    expect(manifest.family).toBe("sidebar");
    expect(manifest.api).toContain("sidebar/activate");
    expect(SidebarBlock).toBeTruthy();
  });

  it("renders the five registry groups with icons and tool ids", () => {
    const out = html(<SidebarBlock ctx={ctx} />);
    expect(out).toContain('data-group="ask"');
    expect(out).toContain('data-group="crew"');
    expect(out).toContain('data-group="data"');
    expect(out).toContain('data-group="explore"');
    expect(out).toContain('data-group="system"');
    expect(out).toContain(">scout_status<");
    expect(out).toContain(">imagoro.graph<");
    expect(out).toContain("class=\"sbar-icon\"");
  });

  it("defaults to the business role: audit (enterprise-only) is hidden, writes carry the lock affordance", () => {
    const out = html(<SidebarBlock ctx={ctx} />);
    expect(out).not.toContain("imagoro.audit");
    expect(out).not.toContain(">Audit<");
    expect(out).toContain("lock");
    expect(out).toContain("dangerous · confirmation required");
  });

  it("enterprise role config shows the audit entry", () => {
    const out = html(<SidebarBlock ctx={{ ...ctx, config: { role: "enterprise" } }} />);
    expect(out).toContain("imagoro.audit");
    expect(out).toContain(">Audit<");
  });
});