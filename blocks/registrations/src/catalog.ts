import { manifest as mapManifest } from "@imagoro/block-map/manifest";
import { manifest as routeManifest } from "@imagoro/block-route/manifest";
import { manifest as metricsManifest } from "@imagoro/block-metrics/manifest";
import { manifest as auditManifest } from "@imagoro/block-audit/manifest";
import { manifest as weatherManifest } from "@imagoro/block-weather/manifest";
import { manifest as vizManifest } from "@imagoro/block-visualizer/manifest";
import { manifest as chatManifest } from "@imagoro/block-chat/manifest";
import { manifest as consoleManifest } from "@imagoro/block-console/manifest";
import { manifest as terminalManifest } from "@imagoro/block-terminal/manifest";
import { manifest as blackboardManifest } from "@imagoro/block-blackboard/manifest";
import { manifest as pipelineManifest } from "@imagoro/block-pipeline/manifest";
import { manifest as graphManifest } from "@imagoro/block-graph/manifest";
import type { BlockManifest } from "@imagoro/core";

export const BLOCK_CATALOG: BlockManifest[] = [
  mapManifest,
  routeManifest,
  metricsManifest,
  auditManifest,
  weatherManifest,
  vizManifest,
  chatManifest,
  consoleManifest,
  terminalManifest,
  blackboardManifest,
  pipelineManifest,
  graphManifest
];

export const blockById: Map<string, BlockManifest> = new Map(
  BLOCK_CATALOG.map((m) => [m.id, m]),
);