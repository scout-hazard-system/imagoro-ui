import { createReadStream, statSync } from "node:fs";
import { join, sep } from "node:path";
import { canonicalStringify } from "./canonical.js";
import { hashFile, sha256Hex } from "./hashing.js";
import type { ImagoroImageV1 } from "./types.js";
import { IMAGE_SCHEMA } from "./types.js";

export interface VerifyResult {
  ok: boolean;
  errors: string[];
}

export async function verifyImageManifest(
  manifest: ImagoroImageV1,
  distRoot: string,
): Promise<VerifyResult> {
  const errors: string[] = [];

  if (manifest.schema !== IMAGE_SCHEMA) {
    errors.push(`schema: expected "${IMAGE_SCHEMA}", got "${manifest.schema}"`);
  }

  const seenBlocks = new Set<string>();
  for (const b of manifest.blocks) {
    if (seenBlocks.has(b.id)) errors.push(`duplicate block id "${b.id}"`);
    seenBlocks.add(b.id);
  }
  for (const s of manifest.shell.sections) {
    for (const slot of s.slots) {
      if (!seenBlocks.has(slot.block)) {
        errors.push(`section "${s.id}" references unknown block "${slot.block}"`);
      }
    }
  }

  for (const file of manifest.dist) {
    const path = join(distRoot, file.path.split("/").join(sep));
    try {
      if (statSync(path).size !== file.bytes) {
        errors.push(`bytes mismatch for "${file.path}": ${statSync(path).size} != ${file.bytes}`);
      }
    } catch {
      errors.push(`missing dist file "${file.path}"`);
      continue;
    }
    const actual = await hashFile(path);
    if (actual.sha256 !== file.sha256) {
      errors.push(`sha256 mismatch for "${file.path}"`);
    }
  }

  const { integrity: _integrity, ...base } = manifest;
  const expected = sha256Hex(canonicalStringify(base));
  if (manifest.integrity.digest !== expected) {
    errors.push("integrity digest mismatch");
  }

  return { ok: errors.length === 0, errors };
}