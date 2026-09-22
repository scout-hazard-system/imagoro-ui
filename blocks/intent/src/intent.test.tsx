import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
import type { BlockContext } from "@imagoro/core";
import IntentBlock, { manifest } from "./index";

const ctx: BlockContext = {
  config: {},
  dispatch: () => {},
  subscribe: () => () => {}
};

function html(node: ReactNode): string {
  return renderToStaticMarkup(node as never);
}

describe("intent block", () => {
  it("is registered under imagoro.intent with intent api surface", () => {
    expect(manifest.id).toBe("imagoro.intent");
    expect(manifest.api).toContain("intent/propose");
    expect(manifest.api).toContain("intent/execute");
  });

  it("renders dry-run by default and shows no execution button until a plan exists", () => {
    const out = html(<IntentBlock ctx={ctx} />);
    expect(out).toContain("What do you want to do today?");
    expect(out).toContain("dry-run");
    expect(out).toContain("Propose plan");
    expect(out).not.toContain("Confirm & execute");
  });

  it("renders textarea + role select with the closed ACL roles", () => {
    const out = html(<IntentBlock ctx={ctx} />);
    expect(out).toContain('aria-label="intent"');
    expect(out).toContain(">business</option>");
    expect(out).toContain(">enterprise</option>");
    expect(out).not.toContain(">admin</option>");
  });
});