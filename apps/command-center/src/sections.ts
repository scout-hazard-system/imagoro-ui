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
    id: "overview",
    label: "Overview",
    blurb: "Live business + analytics posture at a glance.",
    slots: [
      { block: "imagoro.metrics", span: "pair" },
      { block: "imagoro.weather", span: "pair" },
      { block: "imagoro.route" },
      { block: "imagoro.visualizer", span: "pair" }
    ]
  },
  {
    id: "tasks",
    label: "Crew Tasks",
    blurb: "The node canvas composes crew tasks as a DAG (imports the demo tasks.yaml crew).",
    slots: [
      {
        block: "imagoro.graph",
        span: "full",
        config: { role: "enterprise" },
        label: "Crew task graph"
      },
      { block: "imagoro.console" },
      { block: "imagoro.terminal" }
    ]
  },
  {
    id: "pipeline",
    label: "Pipeline",
    blurb: "Pipeline monitor + blackboard categories, scoped by role.",
    slots: [
      { block: "imagoro.pipeline", span: "pair" },
      {
        block: "imagoro.blackboard",
        span: "pair",
        config: { category: "pipeline", role: "business" },
        label: "Blackboard — pipeline"
      },
      { block: "imagoro.audit", span: "full" }
    ]
  },
  {
    id: "network",
    label: "Network",
    blurb: "Mesh + route awareness across surfaces.",
    slots: [
      { block: "imagoro.map", span: "full" },
      { block: "imagoro.route" },
      { block: "imagoro.metrics" },
      { block: "imagoro.visualizer" }
    ]
  },
  {
    id: "control",
    label: "Control",
    blurb: "Chat, console and terminal for operators.",
    slots: [
      { block: "imagoro.chat", span: "full" },
      { block: "imagoro.console" },
      { block: "imagoro.terminal" }
    ]
  },
  {
    id: "intent",
    label: "What can I do?",
    blurb: "Route a goal to a crew role, block or tool — plan preview only, nothing executes.",
    slots: [
      { block: "imagoro.intent", span: "full", config: { role: "enterprise" }, label: "Intent bar" },
      { block: "imagoro.sidebar", span: "pair", config: { role: "enterprise" }, label: "Registry sidebar" },
      { block: "imagoro.console", span: "pair" }
    ]
  }
];