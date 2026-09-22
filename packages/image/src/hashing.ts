import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import type { ImageDistFile } from "./types.js";

export function hashFile(path: string): Promise<ImageDistFile> {
  return new Promise((resolve, reject) => {
    const start = performance.now();
    const hash = createHash("sha256");
    let bytes = 0;
    const stream = createReadStream(path);
    stream.on("data", (chunk: string | Buffer) => {
      const c = typeof chunk === "string" ? Buffer.from(chunk) : chunk;
      bytes += c.length;
      hash.update(c);
    });
    stream.on("error", reject);
    stream.on("end", () =>
      resolve({
        path,
        sha256: hash.digest("hex"),
        bytes,
        ms: Math.round(performance.now() - start),
      }),
    );
  });
}

export function sha256Hex(input: string | Buffer): string {
  return createHash("sha256").update(input).digest("hex");
}