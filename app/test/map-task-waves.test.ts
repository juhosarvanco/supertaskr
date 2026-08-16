import { describe, expect, it } from "vitest";
import { parseProjectFromFiles, type FileEntry } from "@nputer/parser/pure";
import {
  criticalPath,
  criticalPathText,
  layerWaves,
  layoutWaves,
  readSchedule,
  readyNowText,
  scheduleWord,
  selectTaskWaves,
  taskCardVisual,
  transitiveHolds,
  TASK_CARD_H,
  TASK_CARD_W,
  TASK_SLOT_H,
  TASK_SLOT_TOP,
  WAVE_PITCH,
  WAVE_GUTTER,
  waveLabel,
  worstBlockerText,
  type WaveCard,
  type WaveInput,
} from "../src/architecture/task-waves";

/**
 * The tasks lens's model (T-034), attacked without a DOM: dependency
 * waves from blocked_by, the critical path, the schedule reading, the
 * elbow geometry — every expectation below is HAND-DERIVED from the
 * fixture beside it, not read back off the implementation.
 */

// ---- fixtures ---------------------------------------------------------

function task(
  id: string,
  status: WaveInput["status"],
  blockedBy: string[] = [],
  rendered = true,
): WaveInput {
  return { id, status, blockedBy, rendered };
}

/** wave map → a plain sorted array of `id@wave`, easy to eyeball. */
function waves(inputs: WaveInput[]): string[] {
  const layering = layerWaves(inputs);
  return [...layering.wave.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], "en", { numeric: true }))
    .map(([id, wave]) => `${id}@${wave}`);
}

// ---- criterion 2: dependency waves from blocked_by --------------------

describe("waves are a topological layering over blocked_by", () => {
  it("a straight chain gets one wave per link", () => {
    // T-001 → T-002 → T-003 → T-004. Hand-derived: 0,1,2,3.
    expect(
      waves([
        task("T-001", "done"),
        task("T-002", "done", ["T-001"]),
        task("T-003", "planned", ["T-002"]),
        task("T-004", "planned", ["T-003"]),
      ]),
    ).toEqual(["T-001@0", "T-002@1", "T-003@2", "T-004@3"]);
  });

  it("a DIAMOND joins on the LONGEST arm, not the shortest", () => {
    //        ┌ T-002 ┐
    // T-001 ─┤        ├→ T-004,  plus the long arm T-001 → T-003a → T-003b → T-004
    // Hand-derived: T-004 sits behind the 3-long arm, so wave 3, not 1.
    expect(
      waves([
        task("T-001", "done"),
        task("T-002", "planned", ["T-001"]),
        task("T-003", "planned", ["T-001"]),
        task("T-004", "planned", ["T-003"]),
        task("T-005", "planned", ["T-002", "T-004"]),
      ]),
    ).toEqual(["T-001@0", "T-002@1", "T-003@1", "T-004@2", "T-005@3"]);
  });

  it("multiple roots each start at wave 0", () => {
    expect(
      waves([
        task("T-001", "done"),
        task("T-002", "done"),
        task("T-003", "planned", ["T-001", "T-002"]),
      ]),
    ).toEqual(["T-001@0", "T-002@0", "T-003@1"]);
  });

  it("rows inside a wave are id ascending, numeric-aware (T-9 before T-10)", () => {
    const layout = layoutWaves(
      layerWaves([task("T-10", "planned"), task("T-9", "planned"), task("T-100", "planned")]),
    );
    expect(layout.nodes.get("T-9")?.row).toBe(0);
    expect(layout.nodes.get("T-10")?.row).toBe(1);
    expect(layout.nodes.get("T-100")?.row).toBe(2);
  });

  it("edges are blocker → blocked, deduped, and deterministically ordered", () => {
    const layering = layerWaves([
      task("T-001", "done"),
      // duplicate + self entry: both must vanish, neither may crash
      task("T-002", "planned", ["T-001", "T-001", "T-002"]),
    ]);
    expect(layering.edges).toEqual([
      { from: "T-001", to: "T-002", tangled: false, critical: false },
    ]);
  });

  it("an undrawn (parked/suggested) blocker never moves a wave", () => {
    // T-050 is parked, so it is KNOWN but not drawn; T-051 stays wave 0.
    expect(
      waves([task("T-050", "parked", [], false), task("T-051", "planned", ["T-050"])]),
    ).toEqual(["T-051@0"]);
  });

  it("hostile ids are inert: __proto__ / constructor resolve against nothing", () => {
    const layering = layerWaves([
      task("T-001", "planned", ["__proto__", "constructor", "toString"]),
    ]);
    expect([...layering.wave.entries()]).toEqual([["T-001", 0]]);
    expect(layering.edges).toEqual([]);
  });

  it("is deterministic — same input twice, and under a shuffled input order", () => {
    const inputs = [
      task("T-003", "planned", ["T-001"]),
      task("T-001", "done"),
      task("T-004", "planned", ["T-002", "T-003"]),
      task("T-002", "done", ["T-001"]),
    ];
    const a = layerWaves(inputs);
    const b = layerWaves(inputs);
    const c = layerWaves([...inputs].reverse());
    expect([...a.wave]).toEqual([...b.wave]);
    expect([...a.wave]).toEqual([...c.wave]);
    expect(a.edges).toEqual(c.edges);
    expect(layoutWaves(a)).toEqual(layoutWaves(c));
  });

  it("append-only: a new task never moves a prior one", () => {
    const before = layoutWaves(
      layerWaves([
        task("T-001", "done"),
        task("T-002", "planned", ["T-001"]),
        task("T-003", "planned", ["T-001"]),
      ]),
    );
    const after = layoutWaves(
      layerWaves([
        task("T-001", "done"),
        task("T-002", "planned", ["T-001"]),
        task("T-003", "planned", ["T-001"]),
        task("T-004", "planned", ["T-001"]),
      ]),
    );
    for (const id of ["T-001", "T-002", "T-003"]) {
      expect(after.nodes.get(id), id).toEqual(before.nodes.get(id));
    }
    expect(after.nodes.get("T-004")?.row).toBe(2); // bottom-appended
  });

  it("a 500-deep chain layers without recursion, hang or stack overflow", () => {
    const chain: WaveInput[] = [];
    for (let i = 0; i < 500; i += 1) {
      const id = `T-${String(i).padStart(4, "0")}`;
      const prev = i === 0 ? [] : [`T-${String(i - 1).padStart(4, "0")}`];
      chain.push(task(id, "planned", prev));
    }
    const layering = layerWaves(chain);
    expect(layering.wave.get("T-0499")).toBe(499);
    expect(layering.cycleMembers.size).toBe(0);
  });
});

// ---- criterion 4: cycles degrade defined-ly ---------------------------

describe("a cycle shares one wave and never hangs", () => {
  it("a 2-cycle releases both members into one wave", () => {
    const layering = layerWaves([
      task("T-001", "planned", ["T-002"]),
      task("T-002", "planned", ["T-001"]),
    ]);
    expect(layering.wave.get("T-001")).toBe(0);
    expect(layering.wave.get("T-002")).toBe(0);
    expect([...layering.cycleMembers].sort()).toEqual(["T-001", "T-002"]);
    // Both edges are still DRAWN, both flagged tangled (same wave).
    expect(layering.edges.map((e) => `${e.from}->${e.to}:${e.tangled}`)).toEqual([
      "T-001->T-002:true",
      "T-002->T-001:true",
    ]);
  });

  it("a 3-cycle behind a root, with a tail, keeps the tail's own wave", () => {
    // T-000 → {T-001 → T-002 → T-003 → T-001} → T-004.
    // Hand-derived: root 0; the SCC releases as one wave 1; tail 2.
    const layering = layerWaves([
      task("T-000", "done"),
      task("T-001", "planned", ["T-000", "T-003"]),
      task("T-002", "planned", ["T-001"]),
      task("T-003", "planned", ["T-002"]),
      task("T-004", "planned", ["T-003"]),
    ]);
    expect(layering.wave.get("T-000")).toBe(0);
    expect(layering.wave.get("T-001")).toBe(1);
    expect(layering.wave.get("T-002")).toBe(1);
    expect(layering.wave.get("T-003")).toBe(1);
    expect(layering.wave.get("T-004")).toBe(2);
    expect([...layering.cycleMembers].sort()).toEqual(["T-001", "T-002", "T-003"]);
  });

  it("two DISJOINT cycles are both detected, and one stall releases both", () => {
    const layering = layerWaves([
      task("T-001", "planned", ["T-002"]),
      task("T-002", "planned", ["T-001"]),
      task("T-010", "done"),
      task("T-011", "planned", ["T-010", "T-012"]),
      task("T-012", "planned", ["T-011"]),
    ]);
    // Hand-derived: wave 0 peels only T-010 (the sole zero-indegree
    // task); that leaves every remaining task with an unmet blocker, so
    // the NEXT pass stalls and releases every remaining tangle at once —
    // both SCCs share wave 1. A stall is already the broken case; the
    // guarantee is "cycle members share a wave, and it terminates", not
    // "each tangle gets a wave of its own".
    expect(layering.wave.get("T-010")).toBe(0);
    expect(layering.wave.get("T-001")).toBe(1);
    expect(layering.wave.get("T-002")).toBe(1);
    expect(layering.wave.get("T-011")).toBe(1);
    expect(layering.wave.get("T-012")).toBe(1);
    expect([...layering.cycleMembers].sort()).toEqual([
      "T-001",
      "T-002",
      "T-011",
      "T-012",
    ]);
  });

  it("a self-blocking task neither stalls nor draws a loop", () => {
    const layering = layerWaves([task("T-001", "planned", ["T-001"])]);
    expect(layering.wave.get("T-001")).toBe(0);
    expect(layering.cycleMembers.size).toBe(0);
    expect(layering.edges).toEqual([]);
  });

  it("a fully cyclic graph terminates — every task in one wave", () => {
    const ring: WaveInput[] = [];
    for (let i = 0; i < 40; i += 1) {
      const id = `T-${String(i).padStart(3, "0")}`;
      const prev = `T-${String((i + 39) % 40).padStart(3, "0")}`;
      ring.push(task(id, "planned", [prev]));
    }
    const layering = layerWaves(ring);
    expect(layering.cycleMembers.size).toBe(40);
    expect(new Set(layering.wave.values())).toEqual(new Set([0]));
    // The critical path over the acyclic view is empty, not a hang.
    expect(criticalPath(layering, () => "planned")).toEqual([]);
  });
});

// ---- criterion 2: the critical path -----------------------------------

describe("the critical path is the LONGEST chain, with a recorded tie-break ladder", () => {
  const statusOf =
    (map: Record<string, WaveInput["status"]>) =>
    (id: string): WaveInput["status"] =>
      map[id] ?? "planned";

  it("picks the longest chain even when a shorter one holds more tasks", () => {
    // T-100 blocks FOUR leaves (most-blocking would name it); the long
    // chain T-001 → T-002 → T-003 → T-004 is four links deep.
    const layering = layerWaves([
      task("T-001", "planned"),
      task("T-002", "planned", ["T-001"]),
      task("T-003", "planned", ["T-002"]),
      task("T-004", "planned", ["T-003"]),
      task("T-100", "planned"),
      task("T-101", "planned", ["T-100"]),
      task("T-102", "planned", ["T-100"]),
      task("T-103", "planned", ["T-100"]),
      task("T-104", "planned", ["T-100"]),
    ]);
    expect(criticalPath(layering, statusOf({}))).toEqual([
      "T-001",
      "T-002",
      "T-003",
      "T-004",
    ]);
    // …and the most-blocking measurement is the STRIP'S OTHER CELL:
    expect(transitiveHolds(layering).get("T-100")).toBe(4);
    expect(transitiveHolds(layering).get("T-001")).toBe(3);
  });

  it("tie-break 2: equal length, the chain with more work LEFT wins", () => {
    // Two 3-chains. The A-chain is entirely done; the B-chain is not.
    const layering = layerWaves([
      task("T-001", "done"),
      task("T-002", "done", ["T-001"]),
      task("T-003", "done", ["T-002"]),
      task("T-101", "done"),
      task("T-102", "planned", ["T-101"]),
      task("T-103", "planned", ["T-102"]),
    ]);
    expect(
      criticalPath(
        layering,
        statusOf({ "T-001": "done", "T-002": "done", "T-003": "done", "T-101": "done" }),
      ),
    ).toEqual(["T-101", "T-102", "T-103"]);
  });

  it("tie-break 3: equal length AND equal remaining work → lowest id sequence", () => {
    // T-001 → T-002 → {T-003, T-004}: both tails are planned.
    const layering = layerWaves([
      task("T-001", "done"),
      task("T-002", "planned", ["T-001"]),
      task("T-003", "planned", ["T-002"]),
      task("T-004", "planned", ["T-002"]),
    ]);
    expect(criticalPath(layering, statusOf({ "T-001": "done" }))).toEqual([
      "T-001",
      "T-002",
      "T-003",
    ]);
  });

  it("a graph with no edges at all has NO critical path (a single task is not a chain)", () => {
    const layering = layerWaves([task("T-001", "planned"), task("T-002", "planned")]);
    expect(criticalPath(layering, statusOf({}))).toEqual([]);
  });

  it("tangled (cycle) edges are dropped from the path computation", () => {
    // The only long-looking chain runs through a 2-cycle; the acyclic
    // view keeps just T-001 → T-003.
    const layering = layerWaves([
      task("T-001", "done"),
      task("T-002", "planned", ["T-001", "T-003"]),
      task("T-003", "planned", ["T-001", "T-002"]),
    ]);
    expect(criticalPath(layering, statusOf({ "T-001": "done" }))).toEqual([
      "T-001",
      "T-002",
    ]);
  });
});

describe("transitive holds counts everything a task gates", () => {
  it("counts descendants, not direct dependents", () => {
    const layering = layerWaves([
      task("T-001", "planned"),
      task("T-002", "planned", ["T-001"]),
      task("T-003", "planned", ["T-002"]),
      task("T-004", "planned", ["T-002"]),
    ]);
    const holds = transitiveHolds(layering);
    expect(holds.get("T-001")).toBe(3); // T-002, T-003, T-004
    expect(holds.get("T-002")).toBe(2);
    expect(holds.get("T-003")).toBe(0);
  });

  it("a shared descendant is counted once, not twice", () => {
    const layering = layerWaves([
      task("T-001", "planned"),
      task("T-002", "planned", ["T-001"]),
      task("T-003", "planned", ["T-001"]),
      task("T-004", "planned", ["T-002", "T-003"]),
    ]);
    expect(transitiveHolds(layering).get("T-001")).toBe(3);
  });
});

// ---- criterion 2: blocked / ready on the grey cards -------------------

describe("the schedule reading: ready · waits · blocked", () => {
  const statuses = new Map<string, WaveInput["status"]>([
    ["T-DONE", "done"],
    ["T-BUILD", "building"],
    ["T-VERIFY", "verifying"],
    ["T-MERGE", "merging"],
    ["T-PLAN", "planned"],
    ["T-PARK", "parked"],
    ["T-REJECT", "rejected"],
  ]);
  const statusOf = (id: string) => statuses.get(id);

  it("no blockers at all → ready", () => {
    expect(readSchedule("planned", [], statusOf, "T-X")).toEqual({
      schedule: "ready",
      extraWaits: 0,
    });
  });

  it("every blocker done → ready", () => {
    expect(readSchedule("planned", ["T-DONE"], statusOf, "T-X").schedule).toBe("ready");
  });

  it("an IN-FLIGHT blocker → waits, and it is named", () => {
    for (const inFlight of ["T-BUILD", "T-VERIFY", "T-MERGE"]) {
      const reading = readSchedule("planned", ["T-DONE", inFlight], statusOf, "T-X");
      expect(reading.schedule, inFlight).toBe("waits");
      expect(reading.waitsOn).toBe(inFlight);
      expect(reading.extraWaits).toBe(0);
    }
  });

  it("two in-flight blockers → waits on the lowest id, +N for the rest", () => {
    const reading = readSchedule("planned", ["T-VERIFY", "T-BUILD"], statusOf, "T-X");
    expect(reading.waitsOn).toBe("T-BUILD");
    expect(reading.extraWaits).toBe(1);
    expect(scheduleWord({ ...reading, id: "T-X" } as unknown as WaveCard)).toBe(
      "waits on T-BUILD +1",
    );
  });

  it("a PARKED blocker → blocked (the wait has no end in sight)", () => {
    expect(readSchedule("planned", ["T-PARK"], statusOf, "T-X").schedule).toBe("blocked");
  });

  it("a PLANNED blocker → blocked; a REJECTED blocker → blocked", () => {
    expect(readSchedule("planned", ["T-PLAN"], statusOf, "T-X").schedule).toBe("blocked");
    expect(readSchedule("planned", ["T-REJECT"], statusOf, "T-X").schedule).toBe("blocked");
  });

  it("a DANGLING blocker (resolves to nothing) → blocked, never ready", () => {
    expect(readSchedule("planned", ["T-NOPE"], statusOf, "T-X").schedule).toBe("blocked");
  });

  it("one in-flight plus one parked → blocked, not waits", () => {
    expect(readSchedule("planned", ["T-BUILD", "T-PARK"], statusOf, "T-X").schedule).toBe(
      "blocked",
    );
  });

  it("a started or finished task carries no schedule word at all", () => {
    for (const status of ["building", "verifying", "merging", "done", "rejected"] as const) {
      const reading = readSchedule(status, ["T-PLAN"], statusOf, "T-X");
      expect(reading.schedule, status).toBe("underway");
    }
  });

  it("a task blocked by ITSELF is not blocked by it", () => {
    expect(readSchedule("planned", ["T-X"], statusOf, "T-X").schedule).toBe("ready");
  });
});

// ---- geometry ---------------------------------------------------------

describe("wave geometry reproduces the design's grid", () => {
  it("cards land on the 300px wave pitch and the 120px row slot", () => {
    const layout = layoutWaves(
      layerWaves([
        task("T-001", "done"),
        task("T-002", "planned", ["T-001"]),
        task("T-003", "planned"),
      ]),
    );
    expect(layout.nodes.get("T-001")).toMatchObject({ wave: 0, row: 0, x: 0, y: TASK_SLOT_TOP });
    expect(layout.nodes.get("T-003")).toMatchObject({
      wave: 0,
      row: 1,
      x: 0,
      y: TASK_SLOT_TOP + TASK_SLOT_H,
    });
    expect(layout.nodes.get("T-002")).toMatchObject({ wave: 1, x: WAVE_PITCH, y: TASK_SLOT_TOP });
    expect(layout.width).toBe(WAVE_PITCH + TASK_CARD_W);
    expect(layout.height).toBe(TASK_SLOT_TOP + TASK_SLOT_H + TASK_CARD_H);
  });

  it("a same-row edge runs straight; a cross-row edge elbows at mid-gutter", () => {
    const layout = layoutWaves(
      layerWaves([
        task("T-001", "done"),
        task("T-002", "planned", ["T-001"]),
        task("T-003", "planned", ["T-001"]),
      ]),
    );
    const cy = TASK_SLOT_TOP + TASK_CARD_H / 2; // 40 + 29 = 69
    const midX = TASK_CARD_W + WAVE_GUTTER / 2; // 240 + 30 = 270
    const straight = layout.edges.find((e) => e.to === "T-002");
    const elbow = layout.edges.find((e) => e.to === "T-003");
    expect(straight?.path).toBe(`M${TASK_CARD_W} ${cy} H${WAVE_PITCH}`);
    expect(elbow?.path).toBe(
      `M${TASK_CARD_W} ${cy} H${midX} V${cy + TASK_SLOT_H} H${WAVE_PITCH}`,
    );
  });

  it("wave labels carry the design's wording and sit on the column", () => {
    const layout = layoutWaves(
      layerWaves([task("T-001", "done"), task("T-002", "planned", ["T-001"])]),
    );
    expect(layout.waveLabels).toEqual([
      { wave: 0, label: "wave 0 · foundation", x: 0 },
      { wave: 1, label: "wave 1", x: WAVE_PITCH },
    ]);
    expect(waveLabel(7)).toBe("wave 7");
  });

  it("a tangled same-wave edge bows beside the column instead of vanishing", () => {
    const layout = layoutWaves(
      layerWaves([task("T-001", "planned", ["T-002"]), task("T-002", "planned", ["T-001"])]),
    );
    expect(layout.edges).toHaveLength(2);
    for (const edge of layout.edges) {
      expect(edge.tangled).toBe(true);
      expect(edge.path.startsWith(`M${TASK_CARD_W} `)).toBe(true);
    }
  });
});

// ---- the whole model, over parsed files -------------------------------

function taskFile(
  id: string,
  title: string,
  status: string,
  blockedBy: string[] = [],
  extra: string[] = [],
): FileEntry {
  const lines = [
    "---",
    `id: ${id}`,
    `title: ${JSON.stringify(title)}`,
    `status: ${status}`,
    `blocked_by: [${blockedBy.join(", ")}]`,
    ...extra,
    "---",
    "## Acceptance criteria",
    "- something",
  ];
  return { path: `docs/tasks/${id}-x.md`, content: lines.join("\n") };
}

describe("selectTaskWaves over parsed task files", () => {
  it("draws real cards, keeps parked/suggested out of the canvas, and reads them as blockers", () => {
    const model = parseProjectFromFiles([
      taskFile("T-001", "Root", "done"),
      taskFile("T-002", "Parked thing", "parked"),
      taskFile("T-003", "Behind the parked one", "planned", ["T-002"]),
      {
        path: "docs/tasks/T-004-s1-idea.md",
        content: '---\ntitle: "An idea"\nstatus: suggested\nsuggested_by: verifier\n---\n',
      },
    ]);
    const waveModel = selectTaskWaves(model);
    expect(waveModel.cards.map((c) => c.id)).toEqual(["T-001", "T-003"]);
    const behind = waveModel.cards.find((c) => c.id === "T-003");
    expect(behind?.schedule).toBe("blocked");
    expect(behind?.inCycle).toBe(false);
    expect(waveModel.layout.nodes.has("T-002")).toBe(false);
  });

  it("derives the strip: critical path · worst blocker · ready now", () => {
    const model = parseProjectFromFiles([
      taskFile("T-001", "Shell", "done", [], ['review: "independent"']),
      taskFile("T-002", "Parser", "done", ["T-001"], ['review: "same-model"']),
      taskFile("T-003", "Board", "planned", ["T-002"]),
      taskFile("T-004", "Panel", "planned", ["T-003"]),
      taskFile("T-005", "Loose", "planned"),
    ]);
    const waveModel = selectTaskWaves(model);
    expect(waveModel.criticalPath).toEqual(["T-001", "T-002", "T-003", "T-004"]);
    expect(criticalPathText(waveModel)).toBe(
      "T-001 → T-002 → T-003 → T-004 · 2 of 4 still to land",
    );
    // T-003 holds T-004 and is not done; T-001/T-002 hold more but ARE done.
    expect(waveModel.worstBlocker?.id).toBe("T-003");
    expect(worstBlockerText(waveModel)).toBe("T-003 Board · planned, holds 1");
    // T-003 (blockers done) and T-005 (no blockers) are ready; T-004 is not.
    expect(waveModel.readyNow).toEqual(["T-003", "T-005"]);
    expect(readyNowText(waveModel)).toBe("2 tasks, no unmet deps");
  });

  it("worst blocker: at equal weight the task NOBODY is on wins over the one in flight", () => {
    // Both hold exactly one task. T-005 is being built; T-003 is idle.
    const model = parseProjectFromFiles([
      taskFile("T-003", "Idle gate", "planned"),
      taskFile("T-004", "Behind the idle one", "planned", ["T-003"]),
      taskFile("T-005", "Being built", "building"),
      taskFile("T-006", "Behind the build", "planned", ["T-005"]),
    ]);
    const waveModel = selectTaskWaves(model);
    expect(waveModel.cards.find((c) => c.id === "T-003")?.holds).toBe(1);
    expect(waveModel.cards.find((c) => c.id === "T-005")?.holds).toBe(1);
    expect(waveModel.worstBlocker?.id).toBe("T-003");
    // …and weight still beats idleness: give the in-flight one more.
    const heavier = selectTaskWaves(
      parseProjectFromFiles([
        taskFile("T-003", "Idle gate", "planned"),
        taskFile("T-004", "Behind the idle one", "planned", ["T-003"]),
        taskFile("T-005", "Being built", "building"),
        taskFile("T-006", "Behind the build", "planned", ["T-005"]),
        taskFile("T-007", "Also behind the build", "planned", ["T-005"]),
      ]),
    );
    expect(heavier.worstBlocker?.id).toBe("T-005");
  });

  it("worst blocker: a DONE task holds nothing, however much sits behind it", () => {
    const model = parseProjectFromFiles([
      taskFile("T-001", "Finished root", "done"),
      taskFile("T-002", "A", "planned", ["T-001"]),
      taskFile("T-003", "B", "planned", ["T-001"]),
      taskFile("T-004", "C", "planned", ["T-003"]),
    ]);
    const waveModel = selectTaskWaves(model);
    expect(waveModel.cards.find((c) => c.id === "T-001")?.holds).toBe(3);
    expect(waveModel.worstBlocker?.id).toBe("T-003");
  });

  it("says so plainly when there is no chain and nothing is blocking", () => {
    const model = parseProjectFromFiles([taskFile("T-001", "Alone", "planned")]);
    const waveModel = selectTaskWaves(model);
    expect(criticalPathText(waveModel)).toBe("no dependency chain yet");
    expect(worstBlockerText(waveModel)).toBe("nothing is holding anything up");
    expect(readyNowText(waveModel)).toBe("1 task, no unmet deps");
  });

  it("marks the critical chain's edges and only those", () => {
    const model = parseProjectFromFiles([
      taskFile("T-001", "A", "done"),
      taskFile("T-002", "B", "planned", ["T-001"]),
      taskFile("T-003", "C", "planned", ["T-002"]),
      taskFile("T-009", "Side", "planned", ["T-001"]),
    ]);
    const waveModel = selectTaskWaves(model);
    const critical = waveModel.layout.edges.filter((e) => e.critical);
    expect(critical.map((e) => `${e.from}->${e.to}`)).toEqual([
      "T-001->T-002",
      "T-002->T-003",
    ]);
    expect(waveModel.layout.edges.find((e) => e.to === "T-009")?.critical).toBe(false);
  });

  it("surfaces a cycle without hanging, and flags it on every member", () => {
    const model = parseProjectFromFiles([
      taskFile("T-001", "Ping", "planned", ["T-002"]),
      taskFile("T-002", "Pong", "planned", ["T-001"]),
      taskFile("T-003", "After", "planned", ["T-002"]),
    ]);
    const waveModel = selectTaskWaves(model);
    expect(waveModel.hasCycle).toBe(true);
    expect(waveModel.cards.filter((c) => c.inCycle).map((c) => c.id)).toEqual([
      "T-001",
      "T-002",
    ]);
    expect(waveModel.cards.find((c) => c.id === "T-003")?.inCycle).toBe(false);
    expect(waveModel.layout.nodes.get("T-003")?.wave).toBe(1);
  });

  it("carries `rejected ×N` into the worst-blocker line from the verdict history", () => {
    const rejected: FileEntry = {
      path: "docs/tasks/T-008-engine.md",
      content: [
        "---",
        "id: T-008",
        'title: "Interview engine"',
        "status: rejected",
        "blocked_by: []",
        "---",
        "## Verdicts",
        "",
        "2026-01-01 — model (verifier): REJECTED",
        "",
        "2026-01-02 — model (verifier): REJECTED",
        "",
      ].join("\n"),
    };
    const model = parseProjectFromFiles([rejected, taskFile("T-012", "Miner", "planned", ["T-008"])]);
    const waveModel = selectTaskWaves(model);
    expect(waveModel.worstBlocker?.id).toBe("T-008");
    expect(worstBlockerText(waveModel)).toBe("T-008 Interview engine · rejected ×2, holds 1");
    expect(waveModel.cards.find((c) => c.id === "T-012")?.schedule).toBe("blocked");
  });
});

// ---- the ink table ----------------------------------------------------

describe("the card's visual table", () => {
  const card = (over: Partial<WaveCard>): WaveCard => ({
    id: "T-001",
    title: "t",
    status: "planned",
    file: "docs/tasks/T-001.md",
    schedule: "ready",
    extraWaits: 0,
    rejectedCount: 0,
    holds: 0,
    onCriticalPath: false,
    worstBlocker: false,
    inCycle: false,
    ...over,
  });

  it("blocked cards take the ghost fill and the terracotta dashed border", () => {
    const visual = taskCardVisual(card({ schedule: "blocked" }));
    expect(visual.container).toContain("bg-map-unmapped");
    expect(visual.container).toContain("border-dashed");
    expect(visual.container).toContain("border-status-rejected-meta");
    expect(visual.wordInk).toBe("text-status-rejected-foreground");
  });

  it("ready cards take the planned fill, and never the ghost one", () => {
    const visual = taskCardVisual(card({ schedule: "ready" }));
    expect(visual.container).toContain("bg-status-planned");
    expect(visual.container).not.toContain("border-dashed");
    expect(visual.wordInk).toBe("text-muted-foreground");
  });

  it("the worst blocker's 2px solid terracotta border wins over the ghost's dashed one", () => {
    const visual = taskCardVisual(card({ schedule: "blocked", worstBlocker: true }));
    expect(visual.container).toContain("border-2");
    expect(visual.container).toContain("border-solid");
    expect(visual.container).toContain("bg-map-unmapped"); // the fill is kept
  });

  it("only verifying and merging carry the pulse dot", () => {
    expect(taskCardVisual(card({ schedule: "underway", status: "verifying" })).dot).toBe(
      "bg-chart-4",
    );
    expect(taskCardVisual(card({ schedule: "underway", status: "merging" })).dot).toBe(
      "bg-chart-2",
    );
    for (const status of ["planned", "building", "rejected", "done"] as const) {
      expect(taskCardVisual(card({ schedule: "underway", status })).dot, status).toBeUndefined();
    }
  });

  it("done tasks show the review mark instead of a word; nothing else does", () => {
    expect(taskCardVisual(card({ schedule: "underway", status: "done" })).mark).toBe(true);
    expect(taskCardVisual(card({ schedule: "ready" })).mark).toBe(false);
    expect(taskCardVisual(card({ schedule: "underway", status: "building" })).mark).toBe(false);
  });

  it("scheduling words are mono, status words are not", () => {
    expect(taskCardVisual(card({ schedule: "ready" })).wordMono).toBe(true);
    expect(taskCardVisual(card({ schedule: "blocked" })).wordMono).toBe(true);
    expect(taskCardVisual(card({ schedule: "underway", status: "building" })).wordMono).toBe(
      false,
    );
  });
});
