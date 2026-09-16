import type { Graph, GraphNode } from "./model.js";
import { createGraph, nextWireId, reaches } from "./model.js";
import { layoutDag } from "./layout.js";

interface YLine {
  indent: number;
  raw: string;
}

const BLOCK_STYLES = new Set([">", ">-", ">+", "|", "|-", "|+"]);

function stripInlineComment(s: string): string {
  const idx = s.indexOf(" #");
  return idx >= 0 ? s.slice(0, idx).trimEnd() : s;
}

function tokenize(text: string): YLine[] {
  const lines: YLine[] = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const expanded = rawLine.replace(/\t/g, "  ");
    const trimmed = expanded.trimStart();
    if (trimmed === "" || trimmed.startsWith("#")) continue;
    lines.push({ indent: expanded.length - trimmed.length, raw: trimmed });
  }
  return lines;
}

/** Scalar coercion: quoted strings -> string, numbers -> number, true/false -> boolean. */
function scalar(v: string): string | number | boolean {
  const s = v.trim();
  if (s.length >= 2 && (s.startsWith('"') || s.startsWith("'"))) {
    const q = s[0] as string;
    if (s.endsWith(q)) return s.slice(1, -1);
  }
  if (s === "true") return true;
  if (s === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
  return s;
}

/** Fold a block scalar (lines at indent > parent) per its style. */
function blockScalar(lines: YLine[], i: number, parentIndent: number, style: string): { value: string; next: number } {
  const chilled: string[] = [];
  while (i < lines.length && lines[i]?.indent !== undefined && (lines[i] as YLine).indent > parentIndent) {
    chilled.push((lines[i] as YLine).raw);
    i += 1;
  }
  const isLiteral = style.startsWith("|");
  const value = isLiteral ? chilled.join("\n") : chilled.join(" ").replace(/\s+/g, " ");
  return { value: value.trim(), next: i };
}

function isMapLine(l: YLine): boolean {
  return !l.raw.startsWith("- ") && !l.raw.startsWith("-") && l.raw.includes(":");
}

function parseBlock(lines: YLine[], i: number, indent: number): { value: unknown; next: number } {
  const first = lines[i];
  if (!first) return { value: null, next: i };
  if (first.indent !== indent) throw new Error(`expected indent ${indent}, got ${first.indent}`);
  if (first.raw.startsWith("-")) return parseSeq(lines, i, indent);
  return parseMap(lines, i, indent);
}

function parseMap(lines: YLine[], i: number, indent: number): { value: Record<string, unknown>; next: number } {
  const result: Record<string, unknown> = {};
  let cur = lines[i];
  while (cur && cur.indent === indent && isMapLine(cur)) {
    const raw = stripInlineComment(cur.raw);
    const idx = raw.indexOf(":");
    const key = raw.slice(0, idx).trim();
    const rest = raw.slice(idx + 1).trim();
    if (BLOCK_STYLES.has(rest)) {
      const folded = blockScalar(lines, i + 1, indent, rest);
      result[key] = folded.value;
      i = folded.next;
    } else if (rest === "") {
      const next = lines[i + 1];
      if (next && next.indent > indent) {
        const nested = parseBlock(lines, i + 1, next.indent);
        result[key] = nested.value;
        i = nested.next;
      } else {
        result[key] = null;
        i += 1;
      }
    } else {
      result[key] = scalar(rest);
      i += 1;
    }
    cur = lines[i];
  }
  return { value: result, next: i };
}

function parseSeq(lines: YLine[], i: number, indent: number): { value: unknown[]; next: number } {
  const result: unknown[] = [];
  let cur = lines[i];
  while (cur && cur.indent === indent && cur.raw.startsWith("-")) {
    const rest = cur.raw.replace(/^-\s*/, "").trim();
    if (rest === "") {
      const next = lines[i + 1];
      const nested = next && next.indent > indent ? parseBlock(lines, i + 1, next.indent) : null;
      result.push(nested ? nested.value : null);
      i = nested ? nested.next : i + 1;
    } else if (rest.includes(":")) {
      const idx = rest.indexOf(":");
      const key = rest.slice(0, idx).trim();
      const r2 = rest.slice(idx + 1).trim();
      const item: Record<string, unknown> = {};
      if (BLOCK_STYLES.has(r2)) {
        const folded = blockScalar(lines, i + 1, indent, r2);
        item[key] = folded.value;
        i = folded.next;
      } else if (r2 === "") {
        const next = lines[i + 1];
        const nested = next && next.indent > indent ? parseBlock(lines, i + 1, next.indent) : null;
        item[key] = nested ? nested.value : null;
        i = nested ? nested.next : i + 1;
      } else {
        item[key] = scalar(r2);
        i += 1;
      }
      let continuation = lines[i];
      while (continuation && continuation.indent > indent && !continuation.raw.startsWith("-")) {
        const cont = parseMap(lines, i, continuation.indent);
        Object.assign(item, cont.value);
        i = cont.next;
        continuation = lines[i];
      }
      result.push(item);
    } else {
      result.push(scalar(rest));
      i += 1;
    }
    cur = lines[i];
  }
  return { value: result, next: i };
}

/** Minimal YAML-subset parser for the crew tasks.yaml shape (maps, plain/block scalars, lists). */
export function parseTasksYaml(text: string): Record<string, unknown> {
  const lines = tokenize(text);
  if (lines.length === 0) return {};
  const { value, next } = parseBlock(lines, 0, lines[0]?.indent ?? 0);
  if (next < lines.length) {
    throw new Error(`unexpected content at line ${next}`);
  }
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("tasks.yaml root must be a map");
  }
  return value as Record<string, unknown>;
}

export interface ImportResult {
  graph?: Graph;
  tasks?: string[];
  error?: string;
}

/** Convert a crew tasks.yaml (task -> { agent, context: [deps] }) into a DAG graph. */
export function importTasksYaml(text: string): ImportResult {
  let doc: Record<string, unknown>;
  try {
    doc = parseTasksYaml(text);
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
  if (Object.keys(doc).length === 0) return { error: "no tasks found in yaml" };

  const graph = createGraph();
  for (const [name, def] of Object.entries(doc)) {
    if (typeof def !== "object" || def === null || Array.isArray(def)) {
      return { error: `task "${name}" must be a map` };
    }
    const task = def as Record<string, unknown>;
    const node: GraphNode = {
      instanceId: name,
      blockId: "imagoro.graph.task",
      label: name,
      position: { x: 0, y: 0 },
      config: { agent: typeof task.agent === "string" ? task.agent : "", task: name },
      inputs: [{ name: "in", type: "task" }],
      outputs: [{ name: "out", type: "task" }]
    };
    graph.nodes.push(node);
  }

  const unknown: string[] = [];
  for (const [name, def] of Object.entries(doc)) {
    const task = def as Record<string, unknown>;
    const deps = Array.isArray(task.context)
      ? (task.context as unknown[]).filter((d): d is string => typeof d === "string")
      : [];
    for (const dep of deps) {
      if (!graph.nodes.some((n) => n.instanceId === dep)) {
        unknown.push(dep);
        continue;
      }
      if (reaches(graph, name, dep)) {
        return { error: `dependency cycle: ${dep} -> ${name}` };
      }
      graph.wires.push({
        id: nextWireId(),
        from: { instanceId: dep, port: "out" },
        to: { instanceId: name, port: "in" }
      });
    }
  }
  if (unknown.length > 0) {
    return { error: `context references unknown tasks: ${[...new Set(unknown)].join(", ")}` };
  }

  return { graph: layoutDag(graph), tasks: graph.nodes.map((n) => n.instanceId) };
}