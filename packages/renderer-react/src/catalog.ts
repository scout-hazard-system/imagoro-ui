import type { BlockPackage } from "@imagoro/core";
import auditPkg from "@imagoro/block-audit";
import blackboardPkg from "@imagoro/block-blackboard";
import chatPkg from "@imagoro/block-chat";
import consolePkg from "@imagoro/block-console";
import mapPkg from "@imagoro/block-map";
import metricsPkg from "@imagoro/block-metrics";
import pipelinePkg from "@imagoro/block-pipeline";
import routePkg from "@imagoro/block-route";
import terminalPkg from "@imagoro/block-terminal";
import visualizerPkg from "@imagoro/block-visualizer";
import weatherPkg from "@imagoro/block-weather";

/** The 11 web block families, registered into the shared registry by the harness. */
export const webBlocks: BlockPackage[] = [
  mapPkg,
  routePkg,
  metricsPkg,
  auditPkg,
  weatherPkg,
  visualizerPkg,
  chatPkg,
  consolePkg,
  terminalPkg,
  blackboardPkg,
  pipelinePkg,
];

export const webBlockManifests = webBlocks.map((p) => p.manifest);