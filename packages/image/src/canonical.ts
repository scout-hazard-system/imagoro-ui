export function canonicalStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((v) => canonicalStringify(v)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj).sort();
    const parts = keys.map((k) => `${JSON.stringify(k)}:${canonicalStringify(obj[k])}`);
    return `{${parts.join(",")}}`;
  }
  return JSON.stringify(value);
}