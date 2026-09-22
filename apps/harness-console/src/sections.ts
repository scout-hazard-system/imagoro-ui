import type { Config } from "@imagoro/core";

export type SlotSpan = "full" | "pair";

export interface SlotSpec {
  block: string;
  label?: string;
  config?: Config;
  span?: SlotSpan;
}

export interface Section {
  id: string;
  label: string;
  blurb: string;
  slots: SlotSpec[];
}

export const SECTIONS: Section[] = [
  {
    id: "ask",
    label: "Ask",
    blurb: "Route a goal to a crew role, block, or tool — plan preview only, nothing executes.",
    slots: [
      { block: "imagoro.intent", span: "full", config: { role: "enterprise" }, label: "Intent bar" },
      { block: "imagoro.console", span: "pair" },
      { block: "imagoro.metrics", span: "pair" }
    ]
  },
  {
    id: "catalog",
    label: "Catalog",
    blurb: "Everything the registry can do — a data-driven index over the shared icon set; dangerous actions stay locked until confirmed.",
    slots: [
      { block: "imagoro.sidebar", span: "full", config: { role: "enterprise" }, label: "Registry sidebar" },
      { block: "imagoro.console" },
      { block: "imagoro.metrics" }
    ]
  },
  {
    id: "overview",
    label: "Overview",
    blurb: "Agentic harness posture — MCP gateway, tools, live chat.",
    slots: [
      { block: "imagoro.metrics", span: "pair" },
      { block: "imagoro.console", span: "pair" },
      { block: "imagoro.terminal" },
      { block: "imagoro.graph", config: { role: "enterprise" }, label: "Crew graph" }
    ]
  },
  {
    id: "tools",
    label: "MCP Tools",
    blurb: "Every tool the harness exposes over MCP, invoked live from the GUI.",
    slots: [
      { block: "imagoro.pipeline", span: "full" },
      { block: "imagoro.console" },
      { block: "imagoro.terminal" }
    ]
  },
  {
    id: "chat",
    label: "Agent Chat",
    blurb: "Chat with the scout model; results stream back onto the bus.",
    slots: [
      { block: "imagoro.chat", span: "full" },
      { block: "imagoro.console" },
      { block: "imagoro.terminal" }
    ]
  },
  {
    id: "config",
    label: "CLI/GUI Config",
    blurb: "Shared harness config — the same blackboard \"config\" slot the CLI writes.",
    slots: [
      { block: "imagoro.blackboard", span: "full", config: { category: "config", role: "business" }, label: "Blackboard — config" },
      { block: "imagoro.console" },
      { block: "imagoro.terminal" }
    ]
  },
  {
    id: "audit",
    label: "Audit",
    blurb: "Enterprise-only audit trail of harness actions (append-only).",
    slots: [
      { block: "imagoro.audit", span: "full" },
      { block: "imagoro.blackboard", span: "pair", config: { category: "audit", role: "enterprise" }, label: "Blackboard — audit" }
    ]
  }
];