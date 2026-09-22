import { readdirSync, statSync } from "node:fs";
import { relative, join, sep } from "node:path";
import { canonicalStringify } from "./canonical.js";
import { hashFile, sha256Hex } from "./hashing.js";
import type {
  ImagoroImageV1,
  ImageBlockRef,
  ImageDistFile,
  ImageSection,
  Renderer,
} from "./types.js";
import { IMAGE_SCHEMA } from "./types.js";

export interface ManifestOptions {
  imageId: string;
  imageVersion: string;
  renderer: Renderer;
  shell: { entry: string; sections: ImageSection[] };
  blocks: ImageBlockRef[];
  distDir: string;
  distRoot?: string;
}

function listFiles(dir: string, root: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      out.push(...listFiles(full, root));
    } else {
      out.push(relative(root, full));
    }
  }
  return out;
}

export async function createImageManifest(options: ManifestOptions): Promise<ImagoroImageV1> {
  const root = options.distRoot ?? options.distDir;
  const paths = listFiles(options.distDir, root)
    .filter((p) => p !== "imagoro-image.json")
    .sort()
    .map((p) => p.split(sep).join("/"));

  const dist: ImageDistFile[] = [];
  for (const p of paths) {
    const hashed = await hashFile(join(root, p.split("/").join(sep)));
    dist.push({ ...hashed, path: p });
  }

  const base: Omit<ImagoroImageV1, "integrity"> = {
    schema: IMAGE_SCHEMA,
    imageId: options.imageId,
    imageVersion: options.imageVersion,
    builtAt: new Date().toISOString(),
    renderer: options.renderer,
    shell: options.shell,
    blocks: options.blocks,
    dist,
  };
  const integrity = {
    algorithm: "sha256" as const,
    digest: sha256Hex(canonicalStringify(base)),
    files: dist.length,
  };
  return { ...base, integrity };
}