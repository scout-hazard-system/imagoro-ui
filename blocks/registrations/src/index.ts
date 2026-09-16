import type { ReactBlockHost } from "@imagoro/renderer-react";
import MapBlock, { manifest as mapManifest } from "@imagoro/block-map";
import RouteBlock, { manifest as routeManifest } from "@imagoro/block-route";
import MetricsBlock, { manifest as metricsManifest } from "@imagoro/block-metrics";
import AuditBlock, { manifest as auditManifest } from "@imagoro/block-audit";
import WeatherBlock, { manifest as weatherManifest } from "@imagoro/block-weather";
import VisualizerBlock, { manifest as vizManifest } from "@imagoro/block-visualizer";
import ChatBlock, { manifest as chatManifest } from "@imagoro/block-chat";
import ConsoleBlock, { manifest as consoleManifest } from "@imagoro/block-console";
import TerminalBlock, { manifest as terminalManifest } from "@imagoro/block-terminal";
import BlackboardBlock, { manifest as blackboardManifest } from "@imagoro/block-blackboard";
import PipelineBlock, { manifest as pipelineManifest } from "@imagoro/block-pipeline";
import GraphBlock, { manifest as graphManifest } from "@imagoro/block-graph";

export function registerAll(host: ReactBlockHost): void {
  host.register(mapManifest.id, { manifest: mapManifest, Component: MapBlock });
  host.register(routeManifest.id, { manifest: routeManifest, Component: RouteBlock });
  host.register(metricsManifest.id, { manifest: metricsManifest, Component: MetricsBlock });
  host.register(auditManifest.id, { manifest: auditManifest, Component: AuditBlock });
  host.register(weatherManifest.id, { manifest: weatherManifest, Component: WeatherBlock });
  host.register(vizManifest.id, { manifest: vizManifest, Component: VisualizerBlock });
  host.register(chatManifest.id, { manifest: chatManifest, Component: ChatBlock });
  host.register(consoleManifest.id, { manifest: consoleManifest, Component: ConsoleBlock });
  host.register(terminalManifest.id, { manifest: terminalManifest, Component: TerminalBlock });
  host.register(blackboardManifest.id, { manifest: blackboardManifest, Component: BlackboardBlock });
  host.register(pipelineManifest.id, { manifest: pipelineManifest, Component: PipelineBlock });
  host.register(graphManifest.id, { manifest: graphManifest, Component: GraphBlock });
}

export const blockIds: string[] = [
  "imagoro.map",
  "imagoro.route",
  "imagoro.metrics",
  "imagoro.audit",
  "imagoro.weather",
  "imagoro.visualizer",
  "imagoro.chat",
  "imagoro.console",
  "imagoro.terminal",
  "imagoro.blackboard",
  "imagoro.pipeline",
  "imagoro.graph"
];