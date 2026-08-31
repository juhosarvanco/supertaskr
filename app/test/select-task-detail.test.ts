import { describe, expect, it } from "vitest";
import { parseProjectFromFiles, type ProjectParseResult } from "@nputer/parser/pure";
import type { DispatchReading } from "../src/lib/board-model";
import {
  cardRef,
  refLabel,
  selectBriefPanel,
  selectTaskDetail,
  type BriefOutcomeView,
  type TaskRef,
} from "../src/lib/task-detail";

// Pure-selector tests for the card detail panel (T-005). Fixtures run
// through the real parser (parseProjectFromFiles) so these pin the
// file -> panel behavior the acceptance criteria describe: derivation of
// every panel field, live update by task id, visibly-empty sections, and
// the deleted-task case.

const ROADMAP = [
  "# R",
  "",
  "## Backbone",
  "- F-01: Method — the convention",
  "- F-02: App — shell and board",
  "",
].join("\n");

type Field = [key: string, value: string | number];

/** Task-file source from frontmatter fields + an optional body. */
const src = (fields: Field[], body = ""): string =>
  `---\n${fields.map(([k, v]) => `${k}: ${v}`).join("\n")}\n---\n${body}`;

/** Standard renderable task; `extras` override defaults BY KEY (YAML
 * rejects duplicate keys, so naive appending would poison the fixture). */
const task = (id: string, extras: Field[] = [], body = ""): string => {
  const fields = new Map<string, string | number>([
    ["id", id],
    ["title", `${id} title`],
    ["feature", "F-01"],
    ["milestone", 1],
    ["priority", 1],
    ["size", "M"],
    ["status", "planned"],
  ]);
  for (const [key, value] of extras) fields.set(key, value);
  return src([...fields.entries()], body);
};

const project = (files: Array<[path: string, content: string]>): ProjectParseResult =>
  parseProjectFromFiles(files.map(([path, content]) => ({ path, content })));

const withRoadmap = (files: Array<[string, string]>): ProjectParseResult =>
  project([["docs/ROADMAP.md", ROADMAP], ...files]);

const path = (id: string): string => `docs/tasks/${id}.md`;

const byId = (id: string): TaskRef => ({ kind: "id", id });

const VERDICTS = [
  "2026-08-14 — claude-fable-5 @fresh (verifier): REJECTED",
  "",
  "    indented preformatted detail — 78/78, `code`, <img onerror=x>",
  "",
  "2026-08-14 — retry: APPROVED",
].join("\n");

const FULL_BODY = [
  "",
  "## Acceptance criteria",
  "- WHEN a card is clicked THE system SHALL open a detail panel.",
  "- WHILE open THE panel SHALL live-update.",
  "",
  "## Implementation notes",
  "builder notes — verbatim, `code`, <img onerror=x>",
  "",
  "## Verdicts",
  VERDICTS,
  "",
].join("\n");

describe("selectTaskDetail — derivation", () => {
  const model = withRoadmap([
    [
      path("T-010"),
      task(
        "T-010",
        [
          ["status", "done"],
          ["blocked_by", "[T-011, T-099]"],
          ["touches", "[app-board, lib-parser]"],
          ["built_by", '"codex/gpt-5.2 @S3"'],
          ["verified_by", '"claude-fable-5 @fresh"'],
          ["review", "same-model"],
        ],
        FULL_BODY,
      ),
    ],
    [path("T-011"), task("T-011", [["status", "building"]])],
  ]);

  it("derives id, title, status visual, and size", () => {
    const detail = selectTaskDetail(model, byId("T-010"));
    expect(detail).toBeDefined();
    expect(detail?.id).toBe("T-010");
    expect(detail?.title).toBe("T-010 title");
    expect(detail?.status).toBe("done");
    expect(detail?.visual).toEqual({ token: "done", pulse: false });
    expect(detail?.size).toBe("M");
    expect(detail?.suggested).toBe(false);
    expect(detail?.file).toBe(path("T-010"));
  });

  it("passes the acceptance-criteria section through raw", () => {
    const detail = selectTaskDetail(model, byId("T-010"));
    expect(detail?.acceptanceCriteria).toBe(
      [
        "- WHEN a card is clicked THE system SHALL open a detail panel.",
        "- WHILE open THE panel SHALL live-update.",
      ].join("\n"),
    );
  });

  it("passes the verdicts section through VERBATIM (markup, indentation and all)", () => {
    const detail = selectTaskDetail(model, byId("T-010"));
    expect(detail?.verdicts).toBe(VERDICTS);
  });

  it("passes the implementation-notes section through VERBATIM (T-017, T-005-s2)", () => {
    const detail = selectTaskDetail(model, byId("T-010"));
    expect(detail?.implementationNotes).toBe("builder notes — verbatim, `code`, <img onerror=x>");
  });

  it("resolves blocked_by entries against the model: link data when present, unresolved when not", () => {
    const detail = selectTaskDetail(model, byId("T-010"));
    expect(detail?.blockedBy).toEqual([
      {
        id: "T-011",
        resolved: true,
        title: "T-011 title",
        status: "building",
        visual: { token: "building", pulse: false },
      },
      { id: "T-099", resolved: false },
    ]);
  });

  it("carries touches and the built_by / verified_by / review stamps raw", () => {
    const detail = selectTaskDetail(model, byId("T-010"));
    expect(detail?.touches).toEqual(["app-board", "lib-parser"]);
    expect(detail?.builtBy).toBe("codex/gpt-5.2 @S3");
    expect(detail?.verifiedBy).toBe("claude-fable-5 @fresh");
    expect(detail?.review).toBe("same-model");
  });

  it("blocker links let the panel walk a chain (each blocker is itself selectable)", () => {
    const detail = selectTaskDetail(model, byId("T-010"));
    const blocker = detail?.blockedBy[0];
    expect(blocker?.resolved).toBe(true);
    const next = selectTaskDetail(model, byId(blocker?.id ?? ""));
    expect(next?.id).toBe("T-011");
    expect(next?.title).toBe("T-011 title");
  });
});

describe("selectTaskDetail — live update by id (criterion 2)", () => {
  it("the same ref derives fresh content from a changed model", () => {
    const before = withRoadmap([
      [path("T-010"), task("T-010", [["status", "building"]], "\n## Verdicts\n")],
    ]);
    const after = withRoadmap([
      [
        path("T-010"),
        task(
          "T-010",
          [
            ["status", "done"],
            ["review", "independent"],
            ["verified_by", '"claude-fable-5 @fresh"'],
          ],
          "\n## Verdicts\nAPPROVED — suites green.\n",
        ),
      ],
    ]);
    const ref = byId("T-010");
    expect(selectTaskDetail(before, ref)?.status).toBe("building");
    expect(selectTaskDetail(before, ref)?.verdicts).toBeUndefined();
    expect(selectTaskDetail(after, ref)?.status).toBe("done");
    expect(selectTaskDetail(after, ref)?.verdicts).toBe("APPROVED — suites green.");
    expect(selectTaskDetail(after, ref)?.review).toBe("independent");
  });

  it("an id ref follows the task across a file rename", () => {
    const renamed = withRoadmap([[path("T-010-new-name"), task("T-010")]]);
    const detail = selectTaskDetail(renamed, byId("T-010"));
    expect(detail?.id).toBe("T-010");
    expect(detail?.file).toBe(path("T-010-new-name"));
  });

  it("duplicate ids: the first task in model order wins, deterministically (parser sorts by path and flags the duplicate)", () => {
    const model = withRoadmap([
      [path("T-010"), task("T-010")],
      [path("T-010-copy"), task("T-010", [["status", "done"]])],
    ]);
    // Parser processes task files in sorted path order; '-' < '.', so
    // T-010-copy.md is first regardless of input order.
    expect(model.tasks[0]?.file).toBe(path("T-010-copy"));
    const detail = selectTaskDetail(model, byId("T-010"));
    expect(detail?.file).toBe(path("T-010-copy"));
    expect(detail?.status).toBe("done");
  });
});

describe("selectTaskDetail — empty sections (criterion 3)", () => {
  it("a body with no section headings yields visibly-empty fields, not an error", () => {
    const model = withRoadmap([[path("T-010"), task("T-010")]]);
    const detail = selectTaskDetail(model, byId("T-010"));
    expect(detail).toBeDefined();
    expect(detail?.acceptanceCriteria).toBeUndefined();
    expect(detail?.implementationNotes).toBeUndefined();
    expect(detail?.verdicts).toBeUndefined();
    expect(detail?.blockedBy).toEqual([]);
    expect(detail?.touches).toEqual([]);
    expect(detail?.builtBy).toBeUndefined();
    expect(detail?.verifiedBy).toBeUndefined();
    expect(detail?.review).toBeUndefined();
  });

  it("a heading with no content under it is empty too (not an empty-string section)", () => {
    const model = withRoadmap([
      [
        path("T-010"),
        task("T-010", [], "\n## Acceptance criteria\n\n## Implementation notes\n\n## Verdicts\n\n"),
      ],
    ]);
    const detail = selectTaskDetail(model, byId("T-010"));
    expect(detail?.acceptanceCriteria).toBeUndefined();
    expect(detail?.implementationNotes).toBeUndefined();
    expect(detail?.verdicts).toBeUndefined();
  });
});

describe("selectTaskDetail — deleted / missing tasks", () => {
  it("returns undefined when the id is not in the model (deleted while open)", () => {
    const before = withRoadmap([[path("T-010"), task("T-010")]]);
    const after = withRoadmap([]);
    const ref = byId("T-010");
    expect(selectTaskDetail(before, ref)).toBeDefined();
    expect(selectTaskDetail(after, ref)).toBeUndefined();
  });

  it("returns undefined for a file ref whose file is gone", () => {
    const model = withRoadmap([[path("T-010"), task("T-010")]]);
    expect(selectTaskDetail(model, { kind: "file", file: path("T-999") })).toBeUndefined();
  });

  it("ADR-009: a blocked_by entry named __proto__ or constructor never resolves via inheritance", () => {
    const model = withRoadmap([
      [path("T-010"), task("T-010", [["blocked_by", "[__proto__, constructor]"]])],
    ]);
    const detail = selectTaskDetail(model, byId("T-010"));
    expect(detail?.blockedBy).toEqual([
      { id: "__proto__", resolved: false },
      { id: "constructor", resolved: false },
    ]);
  });
});

describe("selectTaskDetail — suggestions (minimal ghost variant)", () => {
  const suggestion = src([
    ["title", "A ghost of an idea"],
    ["status", "suggested"],
    ["suggested_by", '"executor claude-fable-5 @T-004"'],
  ]);

  it("an id-less suggestion opens by file ref and carries suggested_by", () => {
    const model = withRoadmap([[path("T-004-s9-ghost"), suggestion]]);
    const ref = cardRef({ id: undefined, file: path("T-004-s9-ghost") });
    expect(ref).toEqual({ kind: "file", file: path("T-004-s9-ghost") });
    const detail = selectTaskDetail(model, ref);
    expect(detail?.suggested).toBe(true);
    expect(detail?.title).toBe("A ghost of an idea");
    expect(detail?.suggestedBy).toBe("executor claude-fable-5 @T-004");
    expect(detail?.id).toBeUndefined();
  });

  it("T-019: the context paragraph before any heading reaches the detail as `preamble`, verbatim", () => {
    const CONTEXT =
      "Re-parsing the whole tree on every save is wasteful;\na content-hash cache would make the watcher loop cheap.";
    const model = withRoadmap([
      [path("T-004-s9-ghost"), src(
        [
          ["title", "A ghost of an idea"],
          ["status", "suggested"],
          ["suggested_by", "verifier"],
        ],
        `\n${CONTEXT}\n`,
      )],
    ]);
    const detail = selectTaskDetail(model, { kind: "file", file: path("T-004-s9-ghost") });
    expect(detail?.preamble).toBe(CONTEXT);
  });

  it("T-019: a body-less suggestion has a visibly-empty preamble (undefined), not an error", () => {
    const model = withRoadmap([[path("T-004-s9-ghost"), suggestion]]);
    const detail = selectTaskDetail(model, { kind: "file", file: path("T-004-s9-ghost") });
    expect(detail?.preamble).toBeUndefined();
  });

  it("T-019 criterion 4: a record whose issues include cross-reference findings still derives a detail", () => {
    // blocked_by → missing task, feature → missing backbone id: the model
    // carries both findings AND the record — flagging, not hiding.
    const model = withRoadmap([
      [path("T-010"), task("T-010", [["blocked_by", "[T-777]"], ["feature", "F-99"]])],
    ]);
    expect(model.issues).toEqual([
      expect.objectContaining({ kind: "dangling-reference", field: "blocked_by", id: "T-777" }),
      expect.objectContaining({ kind: "dangling-reference", field: "feature", id: "F-99" }),
    ]);
    const detail = selectTaskDetail(model, byId("T-010"));
    expect(detail).toBeDefined();
    expect(detail?.feature).toBe("F-99"); // preserved on the record
    expect(detail?.blockedBy).toEqual([{ id: "T-777", resolved: false }]);
  });

  it("cardRef prefers the id when the card has one", () => {
    expect(cardRef({ id: "T-010", file: path("T-010") })).toEqual({ kind: "id", id: "T-010" });
  });

  it("refLabel names refs for the no-longer-present state", () => {
    expect(refLabel(byId("T-010"))).toBe("T-010");
    expect(refLabel({ kind: "file", file: path("x") })).toBe(path("x"));
  });
});

describe("the panel's soft issues (T-031, absorbing T-019-s1)", () => {
  // ONE body, not two. A first draft split this into "carries the
  // sentences for THIS file" and "a re-targeted panel never inherits
  // them"; this lane's drill measured their kill sets IDENTICAL — the
  // same three mutants, nothing either killed alone — which is shape six
  // (CONVENTIONS' POISON DRILL bullet): a body that reds under a poison
  // while killing no mutant another body does not already kill. Merged
  // rather than kept, on that bullet's second question.
  it("issues follow the FILE: each task gets its own sentences, and a clean one gets []", () => {
    const model = parseProjectFromFiles([
      { path: "docs/ROADMAP.md", content: ROADMAP },
      { path: path("T-430"), content: task("T-430", [["blocked_by", "[T-777]"]]) },
      { path: path("T-431"), content: task("T-431") },
      { path: path("T-432"), content: task("T-432", [["feature", "F-99"]]) },
    ]);
    const flagged = selectTaskDetail(model, { kind: "id", id: "T-430" });
    expect(flagged?.issues).toEqual(
      model.issues.filter((i) => "file" in i && i.file === path("T-430")).map((i) => i.message),
    );
    expect(flagged?.issues.length).toBe(1);
    expect(flagged?.issues[0]).toContain("T-777");

    // A different file and a different KIND, with no leakage in either
    // direction — the union of this model's issues is three.
    const other = selectTaskDetail(model, { kind: "id", id: "T-432" });
    expect(other?.issues.length).toBe(1);
    expect(other?.issues[0]).toContain("F-99");
    expect(other?.issues[0]).not.toContain("T-777");

    // Same model, same call, nothing to say: [] rather than absent,
    // matching blockedBy/touches — the panel decides on the length.
    expect(selectTaskDetail(model, { kind: "id", id: "T-431" })?.issues).toEqual([]);
  });
});

describe("selectTaskDetail — the assignment flag (T-169, @human's D5 ruling)", () => {
  const stamped = (id: string, extras: Field[]): [string, string] => [
    path(id),
    task(id, [["status", "done"], ["review", "independent"], ...extras]),
  ];

  it("carries BOTH values for a flagged pair, verbatim and unlabelled by fault", () => {
    const model = withRoadmap([
      stamped("T-410", [
        ["builder", "claude-opus-5@subagent"],
        ["built_by", "codex/gpt-5.2 @S3"],
      ]),
    ]);
    const detail = selectTaskDetail(model, byId("T-410"));
    expect(detail?.assignment).toEqual([
      {
        role: "builder",
        assignedField: "builder",
        executedField: "built_by",
        assigned: "claude-opus-5@subagent",
        executed: "codex/gpt-5.2 @S3",
      },
    ]);
    // The panel's existing verbatim issues section carries the parser's
    // own sentence too — one join, so the mark and the row cannot
    // disagree about which card is flagged.
    expect(detail?.issues.some((m) => m.includes("the fields disagree"))).toBe(true);
    // What the flag repairs: `built_by` was already on screen and
    // `builder` was nowhere, so the assignment could not be checked by
    // eye. Both are here now.
    expect(detail?.builtBy).toBe("codex/gpt-5.2 @S3");
  });

  it("is [] on an honoured pair, matching issues/blockedBy/touches", () => {
    const model = withRoadmap([
      stamped("T-411", [
        ["builder", "claude-opus-5@subagent"],
        ["built_by", "claude-opus-5 @T-411"],
      ]),
    ]);
    expect(selectTaskDetail(model, byId("T-411"))?.assignment).toEqual([]);
  });

  it("flags both pairs on one card, in builder-then-verifier order", () => {
    const model = withRoadmap([
      stamped("T-412", [
        ["builder", "claude-opus-5"],
        ["built_by", "codex/gpt-5.2 @S3"],
        ["verifier", "claude-opus-5"],
        ["verified_by", "codex/gpt-5.6 @fresh"],
      ]),
    ]);
    const detail = selectTaskDetail(model, byId("T-412"));
    expect(detail?.assignment.map((e) => e.role)).toEqual(["builder", "verifier"]);
    expect(detail?.assignment.map((e) => e.executed)).toEqual([
      "codex/gpt-5.2 @S3",
      "codex/gpt-5.6 @fresh",
    ]);
  });
});

// ---- the dispatch brief block (T-112) --------------------------------
//
// **THIS IS `selectDispositions`' FIRST CONSUMER IN `app/src`, AND THESE
// BODIES ARE WHAT MAKE IT ONE.** The judgement lives in `task-detail.ts`
// rather than in the component precisely so a suite can reach it: T-110
// measured four one-side-only mutants surviving `npm test` at exit 0 when
// the rule sat in a module no test imports.

describe("selectBriefPanel — the copyable block is gated on T-111's disposition", () => {
  /** A scanned repository: no lane, no non-lane worktree, and a lane list
   * that is a COUNT rather than a floor (T-185 — `truncated: false` is a
   * claim, spelled rather than defaulted). */
  const NO_LANES: DispatchReading = {
    kind: "joined",
    rows: new Map(),
    notLanes: [],
    truncated: false,
  };

  /** A lane the reader saw, as the frontier consumes it. The FENCE it
   * holds is read from that lane's own card, so nothing here says it. */
  const laneReading = (taskId: string): DispatchReading => ({
    kind: "joined",
    notLanes: [],
    truncated: false,
    rows: new Map([
      [
        taskId,
        {
          taskId,
          state: "live" as const,
          lanes: [
            {
              taskId,
              branch: `task/${taskId}-x`,
              worktreePath: `/tmp/nputer-${taskId}`,
              existsOnDisk: true,
            },
          ],
        },
      ],
    ]),
  });

  /** An assembled outcome carrying one row, so the render is checkable. */
  const assembled = (taskId: string): BriefOutcomeView => ({
    kind: "assembled",
    brief: {
      role: "executor",
      roleFile: "method/roles/executor.md",
      taskId,
      cardPath: path(taskId),
      rows: [
        {
          number: 1,
          carries: "**Role** — which role this session takes",
          assembledFrom: "`roles/<role>.md`",
          ifAbsent: "the session invents its own obligations",
          lines: [
            {
              label: "one line",
              text: "You build exactly one task, then you end.",
              provenance: { kind: "tree", source: "method/roles/executor.md" },
            },
          ],
          residual: null,
        },
        {
          number: 9,
          carries: "**Standing disciplines**",
          assembledFrom: "the project's CONVENTIONS",
          ifAbsent: "the discipline decays",
          lines: [
            {
              label: "named bullet",
              text: "POISON DRILL",
              provenance: { kind: "tree", source: "docs/CONVENTIONS.md" },
            },
            {
              label: "lanes live right now",
              text: "none",
              provenance: { kind: "live", source: ".git/worktrees" },
            },
          ],
          residual: "row 9 is row 8's untwinned twin",
        },
      ],
      marker: null,
    },
  });

  const dispatchableModel = withRoadmap([
    [path("T-500"), task("T-500", [["status", "planned"], ["touches", "[app-board]"]])],
  ]);

  it("hands over the brief for a card T-111 calls dispatchable", () => {
    const panel = selectBriefPanel(
      dispatchableModel,
      byId("T-500"),
      NO_LANES,
      assembled("T-500"),
    );
    expect(panel.kind).toBe("copyable");
    if (panel.kind !== "copyable") throw new Error("not copyable");
    expect(panel.taskId).toBe("T-500");
    // Every row the assembler produced is in the block, with its own
    // source column — a brief that dropped a row would be one whose
    // missing row the session fills in by guessing.
    expect(panel.text).toContain("ROW 1 —");
    expect(panel.text).toContain("ROW 9 —");
    expect(panel.text).toContain("assembled from: `roles/<role>.md`");
    // And every LINE carries where it came from, which is what keeps a
    // pasted brief checkable against the repository.
    expect(panel.text).toContain("<- method/roles/executor.md");
    expect(panel.text).toContain("<- LIVE at dispatch, re-read it: .git/worktrees");
    // An open residual is surfaced rather than papered over.
    expect(panel.text).toContain("OPEN RESIDUAL: row 9 is row 8's untwinned twin");
  });

  /** A component file, so a synthetic model carries a registry — without
   * one the frontier REFUSES to expand a slug rather than comparing slug
   * strings, which is T-111-s1's own lesson and not this card's to
   * relitigate. */
  const component = (id: string, slugs: string[], paths: string[]): [string, string] => [
    `docs/architecture/components/${id}-x.md`,
    [
      "---",
      `id: ${id}`,
      `name: ${id}`,
      "layer: app",
      "paths:",
      ...paths.map((p) => `  - ${p}`),
      "depends_on: []",
      "decisions: []",
      "status: auto",
      `touch_slugs: [${slugs.join(", ")}]`,
      "---",
      "",
      "A component.",
      "",
    ].join("\n"),
  ];

  it("renders the disposition's REASON, and no brief, for a fenced card", () => {
    // A live lane holds `app-board`; T-500 reserves it. A brief for a
    // card you must not dispatch is an invitation to break the fence.
    const model = withRoadmap([
      component("C-90", ["app-board"], ["app/src/components/board/**"]),
      [path("T-500"), task("T-500", [["status", "planned"], ["touches", "[app-board]"]])],
      [path("T-501"), task("T-501", [["status", "building"], ["touches", "[app-board]"], ["feature", "F-02"]])],
    ]);
    const panel = selectBriefPanel(
      model,
      byId("T-500"),
      laneReading("T-501"),
      assembled("T-500"),
    );
    expect(panel.kind).toBe("withheld");
    if (panel.kind !== "withheld") throw new Error("not withheld");
    expect(panel.disposition).toBe("fenced");
    expect(panel.reason).toContain("T-501");
    expect(panel.reason).toContain("app-board");
    // The positive control: the SAME card with no lane live is copyable,
    // so the withholding is the fence's doing and not the fixture's.
    expect(selectBriefPanel(model, byId("T-500"), NO_LANES, assembled("T-500")).kind).toBe(
      "copyable",
    );
  });

  it("renders the reason for a BLOCKED card too — every non-dispatchable answer is a sentence", () => {
    const model = withRoadmap([
      [path("T-500"), task("T-500", [["status", "planned"], ["blocked_by", "[T-502]"]])],
      [path("T-502"), task("T-502", [["status", "planned"], ["feature", "F-02"]])],
    ]);
    const panel = selectBriefPanel(model, byId("T-500"), NO_LANES, assembled("T-500"));
    expect(panel.kind).toBe("withheld");
    if (panel.kind !== "withheld") throw new Error("not withheld");
    expect(panel.disposition).toBe("blocked");
    expect(panel.reason).toContain("T-502");
  });

  it("a copyable brief off a TRUNCATED scan carries the floor note (T-185)", () => {
    // THE CARD'S SECOND CRITERION, at the layer that decides it: where the
    // lane scan is a floor rather than a count, the board says so — the
    // same ruling `App.tsx` already applies to the docs tree, which this
    // repository made four merges ago and the dispatch scan could not
    // inherit because the type it reached had no field for the fact.
    //
    // MUTANT: `floor: null` unconditionally — the fix reverted while the
    // field and the flag both survive, which is the shape a structural
    // check cannot see.
    const floorScan: DispatchReading = {
      kind: "joined",
      rows: new Map(),
      notLanes: [],
      truncated: true,
    };
    const panel = selectBriefPanel(dispatchableModel, byId("T-500"), floorScan, assembled("T-500"));
    expect(panel.kind).toBe("copyable");
    if (panel.kind !== "copyable") throw new Error("not copyable");
    expect(panel.floor).not.toBeNull();
    expect(panel.floor).toContain("lane list truncated");
    expect(panel.floor).toContain("FLOOR, not a count");
    // The brief itself is untouched: the note QUALIFIES the invitation, it
    // does not edit the quotation a human is about to paste.
    expect(panel.text).toContain("ROW 1");

    // THE POSITIVE CONTROL. Same model, same card, same assembled brief,
    // and a scan that was a COUNT: the note is `null`, so the assertion
    // above is about the flag and not about the arm.
    const complete = selectBriefPanel(
      dispatchableModel,
      byId("T-500"),
      NO_LANES,
      assembled("T-500"),
    );
    expect(complete.kind).toBe("copyable");
    if (complete.kind !== "copyable") throw new Error("not copyable");
    expect(complete.floor).toBeNull();
  });

  it("refuses to answer at all when the lane reader refused — never a free board", () => {
    const panel = selectBriefPanel(
      dispatchableModel,
      byId("T-500"),
      { kind: "unavailable", sentence: "this folder has no .git." },
      assembled("T-500"),
    );
    expect(panel.kind).toBe("unavailable");
    if (panel.kind !== "unavailable") throw new Error("not unavailable");
    expect(panel.sentence).toContain("no card can be called dispatchable");
    expect(panel.sentence).toContain("this folder has no .git.");
  });

  it("shows the typed refusal rather than a partial brief when a row could not be assembled", () => {
    const panel = selectBriefPanel(dispatchableModel, byId("T-500"), NO_LANES, {
      kind: "unassemblable",
      rows: [
        { number: 8, source: "the project's CONVENTIONS", path: "docs/CONVENTIONS.md" },
        { number: 9, source: "the project's CONVENTIONS", path: "docs/CONVENTIONS.md" },
      ],
    });
    expect(panel.kind).toBe("unavailable");
    if (panel.kind !== "unavailable") throw new Error("not unavailable");
    // WHICH ROW and WHICH SOURCE, for every one of them — a brief with a
    // silently missing gate list is worse than no brief.
    expect(panel.sentence).toContain("row 8 could not be assembled from docs/CONVENTIONS.md");
    expect(panel.sentence).toContain("row 9 could not be assembled from docs/CONVENTIONS.md");
    expect(panel.sentence).not.toContain("ROW 1 —");
  });

  it("names the contract itself when the table could not be read", () => {
    const missing = selectBriefPanel(dispatchableModel, byId("T-500"), NO_LANES, {
      kind: "contractMissing",
      source: "method/roles/executor.md",
    });
    expect(missing.kind === "unavailable" && missing.sentence).toContain(
      "method/roles/executor.md is missing",
    );
    const unreadable = selectBriefPanel(dispatchableModel, byId("T-500"), NO_LANES, {
      kind: "contractUnreadable",
      source: "method/roles/executor.md",
    });
    expect(unreadable.kind === "unavailable" && unreadable.sentence).toContain(
      "the row set is unknown",
    );
  });

  it("says so when no brief has been asked for, rather than showing an empty one", () => {
    const panel = selectBriefPanel(dispatchableModel, byId("T-500"), NO_LANES, undefined);
    expect(panel.kind).toBe("unavailable");
  });

  it("a verifier's brief carries the marker and nothing below it", () => {
    // The marker's whole job is to keep executor-derived facts out of the
    // half a verifier reads first. This assembler puts none there, so the
    // block ENDS at the marker — and that emptiness is the guarantee.
    const outcome = assembled("T-500");
    if (outcome.kind !== "assembled") throw new Error("fixture");
    const withMarker: BriefOutcomeView = {
      kind: "assembled",
      brief: { ...outcome.brief, role: "verifier", marker: "---- MARKER ----" },
    };
    const panel = selectBriefPanel(dispatchableModel, byId("T-500"), NO_LANES, withMarker);
    if (panel.kind !== "copyable") throw new Error("not copyable");
    expect(panel.text.trimEnd().endsWith("---- MARKER ----")).toBe(true);
  });

  it("an id-less suggestion has no frontier answer, and says which fact is missing", () => {
    const model = withRoadmap([
      ["docs/tasks/T-500-s1-a-thought.md", "---\nstatus: suggested\nsuggested_by: executor\n---\n\nA thought.\n"],
    ]);
    const panel = selectBriefPanel(
      model,
      { kind: "file", file: "docs/tasks/T-500-s1-a-thought.md" },
      NO_LANES,
      undefined,
    );
    expect(panel.kind).toBe("unavailable");
    if (panel.kind !== "unavailable") throw new Error("not unavailable");
    expect(panel.sentence).toContain("carries no id");
  });

  /**
   * **`T-195`'S PIN, AND IT SITS HERE BECAUSE THIS SIDE OWNS PRESENTATION.**
   *
   * The card's first decision is which side of the boundary the pin
   * belongs to. `dispatch-store.ts` declares itself a mirror that
   * *"classifies nothing"*, and the sentence is not authored on the wire
   * at all — it is composed HERE, in `selectBriefPanel`. Asserting it
   * from the mirror would make that module answer for a string it never
   * sees.
   *
   * **WHAT WAS WRONG BEFORE THIS BODY.** The `outcome === undefined` arm
   * was driven three tests above, asserting `panel.kind` ALONE. The only
   * other pin in the repository is a `toContain` on the PREFIX, in
   * `app/test/board-truth.test.tsx` — a different component's file.
   * Measured at `40c9b8b`, one side only, `1 1` on `git diff --numstat`,
   * restored by sha256: deleting everything from the em dash on left the
   * app suite at **50 files / 1116 tests exit 0** AND `npm run build` at
   * exit 0. The half that says WHY was free.
   *
   * **ASSERTED WHOLE, AND THE NEAR-MISS IS THE REASON.** A containment
   * matcher is satisfied by any superstring, so a prefix pin cannot tell
   * the sentence from the sentence plus anything. This lane measured that
   * on the Rust side: `LaneScanRefusal::NoWorktreesDirectory`'s pinned
   * fragment IS its whole reason clause, so no DELETION can dodge it —
   * and appending `, probably` dodges it anyway. A deletion-only sweep
   * scored that arm safe and was wrong. `toBe` is what closes the shape.
   */
  it("the `unavailable` sentence is pinned WHOLE — the reason-bearing half included", () => {
    // THE SUBJECT OF T-195: a dispatchable card whose assembler has not
    // answered. Reached only after the id, frontier and disposition
    // checks pass, so this fixture is the arm and not a near neighbour.
    const notAsked = selectBriefPanel(dispatchableModel, byId("T-500"), NO_LANES, undefined);
    expect(notAsked.kind).toBe("unavailable");
    if (notAsked.kind !== "unavailable") throw new Error("not unavailable");
    expect(notAsked.sentence).toBe(
      "the assembler has not answered for this card yet — the brief is assembled from files the app reads Rust-side",
    );

    // THE SECOND MEMBER FOUND BY THE SWEEP. Its post-em-dash half is the
    // half that tells a reader what to DO, and the only pin on it was a
    // `toContain` on the first four words.
    const idless = selectBriefPanel(
      withRoadmap([
        [
          "docs/tasks/T-500-s1-a-thought.md",
          "---\nstatus: suggested\nsuggested_by: executor\n---\n\nA thought.\n",
        ],
      ]),
      { kind: "file", file: "docs/tasks/T-500-s1-a-thought.md" },
      NO_LANES,
      undefined,
    );
    expect(idless.kind).toBe("unavailable");
    if (idless.kind !== "unavailable") throw new Error("not unavailable");
    expect(idless.sentence).toBe(
      "this card carries no id, so the dispatch frontier has no answer for it — a suggestion is triaged into a card before it is dispatched",
    );
  });

  /**
   * **THE SWEEP'S OTHER HALF — every typed refusal, whole.**
   *
   * `refusalSentence`'s four arms reach the reader through the same
   * `unavailable` panel, and each was pinned by one `toContain` fragment
   * or by nothing at all: `contractMissing` by its interpolated source,
   * `contractUnreadable` by five words before its em dash,
   * `unassemblable` by its row list only, and `noSuchCard` by NOTHING —
   * that string appeared in no test file in the repository.
   *
   * Two branches nothing reached at all are pinned here as a
   * side-effect, and they are the reason this is not a restatement of the
   * bodies above: the `; ` that JOINS multiple unassemblable rows, and
   * the `path === "" ? source : path` fallback for a row with no path.
   */
  it("every typed refusal reaches the reader as its WHOLE sentence, reason and all", () => {
    const sentenceFor = (outcome: BriefOutcomeView): string => {
      const panel = selectBriefPanel(dispatchableModel, byId("T-500"), NO_LANES, outcome);
      if (panel.kind !== "unavailable") throw new Error(`expected unavailable, got ${panel.kind}`);
      return panel.sentence;
    };

    expect(sentenceFor({ kind: "contractMissing", source: "method/roles/executor.md" })).toBe(
      "the brief's own contract could not be read: method/roles/executor.md is missing, so no row can be transcribed from it",
    );

    expect(sentenceFor({ kind: "contractUnreadable", source: "method/roles/executor.md" })).toBe(
      "the normative table in method/roles/executor.md could not be parsed, so the row set is unknown — a shorter brief would be a brief whose missing rows the session fills in by guessing",
    );

    // Pinned by nothing before this line.
    expect(sentenceFor({ kind: "noSuchCard", taskId: "T-999" })).toBe(
      "no card on this board carries the id T-999",
    );

    // TWO rows, so the `; ` separator is pinned rather than assumed, and
    // the second carries an EMPTY path so the `source` fallback is taken.
    expect(
      sentenceFor({
        kind: "unassemblable",
        rows: [
          { number: 8, source: "the project's CONVENTIONS", path: "docs/CONVENTIONS.md" },
          { number: 9, source: "the project's CONVENTIONS", path: "" },
        ],
      }),
    ).toBe(
      "the brief is incomplete and is therefore not shown — a brief with a silently missing row is worse than no brief. " +
        "row 8 could not be assembled from docs/CONVENTIONS.md; " +
        "row 9 could not be assembled from the project's CONVENTIONS",
    );
  });
});
