import { describe, expect, it } from "vitest";
import { parseProjectFromFiles, type ProjectParseResult } from "@nputer/parser/pure";
import { cardRef, refLabel, selectTaskDetail, type TaskRef } from "../src/lib/task-detail";

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
