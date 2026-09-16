import { describe, expect, it } from "vitest";
import { parseTasksYaml, importTasksYaml } from "./tasksYaml.js";
import { crewTasksDemoYaml } from "./demo.js";
import { countNodes, countWires, reaches } from "./model.js";

describe("tasks.yaml subset parser", () => {
  it("parses folded descriptions, plain scalars and context lists", () => {
    const doc = parseTasksYaml(`alert_task:
  description: >
    Analyze this transcript
    for enforcement.
  expected_output: >
    IGNORE or ALERT.
  agent: alert_specialist
  context:
    - transcribe_task
    - intel_task
  priority: 3`);
    expect(doc.alert_task).toMatchObject({
      description: "Analyze this transcript for enforcement.",
      expected_output: "IGNORE or ALERT.",
      agent: "alert_specialist",
      priority: 3
    });
    expect((doc.alert_task as { context?: string[] }).context).toEqual(["transcribe_task", "intel_task"]);
  });

  it("ignores comments and blank lines", () => {
    const doc = parseTasksYaml(`# note
a_task:
  agent: alpha   # inline comment
b_task:
  agent: beta`);
    expect(doc).toMatchObject({ a_task: { agent: "alpha" }, b_task: { agent: "beta" } });
  });

  it("parses seqs of maps and inline numbers/booleans", () => {
    const doc = parseTasksYaml(`items:
  - enabled: true
  - port: 8765
    kind: blackboard
  - plain_item`);
    expect(doc.items).toEqual([{ enabled: true }, { port: 8765, kind: "blackboard" }, "plain_item"]);
  });
});

describe("importTasksYaml (crew DAG import)", () => {
  it("builds a DAG from the demo crew yaml", () => {
    const res = importTasksYaml(crewTasksDemoYaml);
    expect(res.error).toBeUndefined();
    const g = res.graph;
    expect(g).toBeDefined();
    expect(countNodes(g as never)).toBe(6);
    expect(countWires(g as never)).toBe(7);
    expect(res.tasks).toEqual([
      "transcribe_task",
      "alert_task",
      "vet_task",
      "intel_task",
      "rank_task",
      "core_task"
    ]);
  });

  it("wires dependencies in the right direction", () => {
    const g = importTasksYaml(crewTasksDemoYaml).graph;
    expect(g).toBeDefined();
    expect(reaches(g as never, "transcribe_task", "core_task")).toBe(true);
    expect(reaches(g as never, "rank_task", "core_task")).toBe(true);
    expect(reaches(g as never, "core_task", "transcribe_task")).toBe(false);
  });

  it("reports unknown context references", () => {
    const res = importTasksYaml(`a_task:
  agent: a
  context:
    - ghost_task`);
    expect(res.graph).toBeUndefined();
    expect(res.error).toMatch(/unknown tasks: ghost_task/);
  });

  it("rejects dependency cycles", () => {
    const res = importTasksYaml(`a_task:
  context:
    - b_task
b_task:
  context:
    - a_task`);
    expect(res.graph).toBeUndefined();
    expect(res.error).toMatch(/cycle/);
  });

  it("rejects malformed roots", () => {
    expect(importTasksYaml("").error).toMatch(/no tasks/);
    expect(importTasksYaml("a_task: 42").error).toMatch(/must be a map/);
  });
});