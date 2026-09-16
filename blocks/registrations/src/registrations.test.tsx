import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
import type { BlockContext } from "@imagoro/core";
import MetricsBlock from "@imagoro/block-metrics";
import RouteBlock from "@imagoro/block-route";
import AuditBlock from "@imagoro/block-audit";
import WeatherBlock from "@imagoro/block-weather";
import VisualizerBlock from "@imagoro/block-visualizer";
import ChatBlock from "@imagoro/block-chat";
import ConsoleBlock from "@imagoro/block-console";
import TerminalBlock from "@imagoro/block-terminal";
import BlackboardBlock from "@imagoro/block-blackboard";
import PipelineBlock from "@imagoro/block-pipeline";
import GraphBlock from "@imagoro/block-graph";

const ctx: BlockContext = {
  config: {},
  dispatch: () => {},
  subscribe: () => () => {}
};

function html(node: ReactNode): string {
  return renderToStaticMarkup(node as never);
}

describe("web block render (SSR parity smoke)", () => {
  const cases: Array<[string, ReactNode]> = [
    ["metrics", <MetricsBlock ctx={ctx} />],
    ["route", <RouteBlock ctx={ctx} />],
    ["audit", <AuditBlock ctx={ctx} />],
    ["weather", <WeatherBlock ctx={ctx} />],
    ["visualizer", <VisualizerBlock ctx={ctx} />],
    ["chat", <ChatBlock ctx={ctx} />],
    ["console", <ConsoleBlock ctx={ctx} />],
    ["terminal", <TerminalBlock ctx={ctx} />],
    ["blackboard", <BlackboardBlock ctx={ctx} />],
    ["pipeline", <PipelineBlock ctx={ctx} />],
    ["graph", <GraphBlock ctx={ctx} />]
  ];

  for (const [name, node] of cases) {
    it(`renders ${name} block`, () => {
      const out = html(node);
      expect(out).toContain("block");
      expect(out.length).toBeGreaterThan(50);
    });
  }
});