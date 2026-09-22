import type { BlockFamily, BlockManifest } from "@imagoro/core";

export const IMAGE_SCHEMA = "imagoro.image/v1";

export type Renderer = "react";

export interface ImageSlot {
  block: string;
  span?: "full" | "pair";
  config?: Record<string, unknown>;
}

export interface ImageSizelessSection {
  id: string;
  label: string;
  blurb: string;
  slots: ImageSlot[];
}

export interface ImageSection {
  id: string;
  label: string;
  blurb: string;
  span: "full" | "pair";
  align: "start" | "center";
  slots: ImageSlot[];
}

export interface ImageBlockRef {
  id: string;
  name: string;
  version: string;
  family: BlockFamily;
  substrate: Renderer;
  module: string;
  entry: string;
  size: BlockManifest["size"];
  ports: BlockManifest["ports"];
}

export interface ImageDistFile {
  path: string;
  sha256: string;
  bytes: number;
  ms?: number;
}

export interface ImageIntegrity {
  algorithm: "sha256";
  digest: string;
  files: number;
}

export interface ImagoroImageV1 {
  schema: typeof IMAGE_SCHEMA;
  imageId: string;
  imageVersion: string;
  builtAt: string;
  renderer: Renderer;
  shell: {
    entry: string;
    sections: ImageSection[];
  };
  blocks: ImageBlockRef[];
  dist: ImageDistFile[];
  integrity: ImageIntegrity;
}