import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Plugin } from "vite";
import type { ImageSection, ImageBlockRef } from "@imagoro/image";
import { createImageManifest } from "@imagoro/image";
import { BLOCK_CATALOG } from "@imagoro/blocks-registrations/catalog";
import type { BlockManifest } from "@imagoro/core";
import { SECTIONS, type Section } from "./src/sections.js";

const IMAGE_FILE = "imagoro-image.json";

function toImageSection(s: Section): ImageSection {
  return {
    id: s.id,
    label: s.label,
    blurb: s.blurb,
    span: "full",
    align: "start",
    slots: s.slots.map((slot) => ({
      block: slot.block,
      span: slot.span ?? "full",
      ...(slot.config ? { config: slot.config } : {})
    }))
  };
}

function toImageBlockRef(manifest: BlockManifest): ImageBlockRef {
  return {
    id: manifest.id,
    name: manifest.name,
    version: manifest.version,
    family: manifest.family,
    substrate: "react",
    module: `@imagoro/block-${manifest.id.split(".")[1]}`,
    entry: "index.tsx",
    size: manifest.size,
    ports: manifest.ports
  };
}

export function imagoroImagePlugin(opts: { imageId: string; imageVersion: string }): Plugin {
  return {
    name: "imagoro:image",
    apply: "build",
    async closeBundle(this) {
      const outDir = resolve(process.cwd(), "dist");
      const manifest = await createImageManifest({
        imageId: opts.imageId,
        imageVersion: opts.imageVersion,
        renderer: "react",
        shell: {
          entry: "src/sections.ts",
          sections: SECTIONS.map(toImageSection)
        },
        blocks: BLOCK_CATALOG.map(toImageBlockRef),
        distDir: outDir
      });
      writeFileSync(resolve(outDir, IMAGE_FILE), `${JSON.stringify(manifest, null, 2)}\n`);
    }
  };
}