import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  parseProjectFromFiles,
  type ParseIssue,
  type ProjectParseResult,
  type TaskStatus,
} from "@nputer/parser/pure";
import {
  assignmentByFile,
  CONCURRENCY_CEILING,
  DISPOSITIONS,
  expandTouch,
  fenceClashes,
  issuesByFile,
  normaliseTouchToken,
  selectBoard,
  selectDispositions,
  shortModelName,
  statusVisual,
  topmostUndoneByColumn,
  touchTokensOverlap,
  UNMAPPED_KEY,
  type BoardColumn,
  type BoardModel,
  type CardDisposition,
  type DispatchReading,
  type DispatchStamp,
  type DispositionModel,
  type InFlightLane,
  type LaneHold,
  type TopmostCard,
} from "../src/lib/board-model";

// Pure-selector tests for the story map board (T-004). Fixtures run
// through the real parser (parseProjectFromFiles) so these pin the
// frontmatter -> board behavior the acceptance criteria describe:
// grouping, ordering, slice line, unmapped routing, ghost/parked
// partition, badge derivation, and empty states.

const ROADMAP = [
  "# R",
  "",
  "## Backbone",
  "- F-01: Method — the convention",
  "- F-02: App — shell and board",
  "- F-03: Dispatch — worktrees and verify",
  "",
].join("\n");

type Field = [key: string, value: string | number];

/** Task-file source from frontmatter fields (order preserved). */
const fm = (...fields: Field[]): string =>
  `---\n${fields.map(([k, v]) => `${k}: ${v}`).join("\n")}\n---\n`;

/** Standard renderable task: id, title, feature, milestone, priority, size, status + extras. */
const task = (
  id: string,
  feature: string,
  priority: number,
  status = "planned",
  extras: Field[] = [],
  milestone = 1,
): string =>
  fm(
    ["id", id],
    ["title", `${id} title`],
    ["feature", feature],
    ["milestone", milestone],
    ["priority", priority],
    ["size", "M"],
    ["status", status],
    ...extras,
  );

const project = (files: Array<[path: string, content: string]>): ProjectParseResult =>
  parseProjectFromFiles(files.map(([path, content]) => ({ path, content })));

const withRoadmap = (files: Array<[string, string]>): ProjectParseResult =>
  project([["docs/ROADMAP.md", ROADMAP], ...files]);

const path = (id: string): string => `docs/tasks/${id}.md`;

describe("selectBoard — grouping and column order", () => {
  it("renders backbone features as columns in ROADMAP order, tasks grouped by feature", () => {
    const board = selectBoard(
      withRoadmap([
        [path("T-020"), task("T-020", "F-02", 1)],
        [path("T-010"), task("T-010", "F-01", 1)],
      ]),
    );
    expect(board.columns.map((c) => c.featureId)).toEqual(["F-01", "F-02", "F-03"]);
    expect(board.columns.map((c) => c.name)).toEqual(["Method", "App", "Dispatch"]);
    expect(board.columns[0]?.cards.map((c) => c.id)).toEqual(["T-010"]);
    expect(board.columns[1]?.cards.map((c) => c.id)).toEqual(["T-020"]);
  });

  it("a feature with zero tasks still renders as an (empty) column", () => {
    const board = selectBoard(withRoadmap([[path("T-010"), task("T-010", "F-01", 1)]]));
    const f3 = board.columns.find((c) => c.featureId === "F-03");
    expect(f3).toBeDefined();
    expect(f3?.cards).toEqual([]);
    expect(f3?.ghosts).toEqual([]);
    expect(f3?.parked).toEqual([]);
    expect(f3?.sliceIndex).toBe(0);
  });

  it("duplicate backbone ids collapse into one column (parser already flags the issue)", () => {
    const dupRoadmap = `${ROADMAP}- F-01: Method again — duplicate\n`;
    const board = selectBoard(project([["docs/ROADMAP.md", dupRoadmap]]));
    expect(board.columns.filter((c) => c.featureId === "F-01")).toHaveLength(1);
    expect(board.columns.find((c) => c.featureId === "F-01")?.name).toBe("Method");
  });
});

describe("selectBoard — card order within a column", () => {
  it("orders by priority asc (1 = top), tie-break id asc", () => {
    const board = selectBoard(
      withRoadmap([
        [path("T-013"), task("T-013", "F-01", 2)],
        [path("T-011"), task("T-011", "F-01", 1)],
        [path("T-012"), task("T-012", "F-01", 1)],
      ]),
    );
    expect(board.columns[0]?.cards.map((c) => c.id)).toEqual(["T-011", "T-012", "T-013"]);
  });

  it("id tie-break is numeric-aware (T-9 before T-10)", () => {
    const board = selectBoard(
      withRoadmap([
        [path("T-10"), task("T-10", "F-01", 1)],
        [path("T-9"), task("T-9", "F-01", 1)],
      ]),
    );
    expect(board.columns[0]?.cards.map((c) => c.id)).toEqual(["T-9", "T-10"]);
  });

  it("missing priority sorts after all present priorities", () => {
    const noPriority = fm(
      ["id", "T-011"],
      ["title", "T-011 title"],
      ["feature", "F-01"],
      ["milestone", 1],
      ["size", "S"],
      ["status", "building"],
    );
    const board = selectBoard(
      withRoadmap([
        [path("T-011"), noPriority],
        [path("T-012"), task("T-012", "F-01", 99)],
      ]),
    );
    expect(board.columns[0]?.cards.map((c) => c.id)).toEqual(["T-012", "T-011"]);
  });

  it("status does not affect position: done cards keep their slot", () => {
    const board = selectBoard(
      withRoadmap([
        [path("T-011"), task("T-011", "F-01", 1, "done", [["review", "independent"]])],
        [path("T-012"), task("T-012", "F-01", 2, "building")],
        [path("T-013"), task("T-013", "F-01", 3, "planned")],
      ]),
    );
    expect(board.columns[0]?.cards.map((c) => [c.id, c.status])).toEqual([
      ["T-011", "done"],
      ["T-012", "building"],
      ["T-013", "planned"],
    ]);
  });
});

describe("selectBoard — milestone slice line", () => {
  it("places the line after the milestone-1 block (milestone > 1 and unset go below)", () => {
    const noMilestone = fm(
      ["id", "T-014"],
      ["title", "T-014 title"],
      ["feature", "F-01"],
      ["priority", 4],
      ["size", "S"],
      ["status", "planned"],
    );
    const board = selectBoard(
      withRoadmap([
        [path("T-011"), task("T-011", "F-01", 1, "planned", [], 1)],
        [path("T-012"), task("T-012", "F-01", 2, "planned", [], 1)],
        [path("T-013"), task("T-013", "F-01", 3, "planned", [], 2)],
        [path("T-014"), noMilestone],
      ]),
    );
    const col = board.columns[0];
    expect(col?.cards.map((c) => c.id)).toEqual(["T-011", "T-012", "T-013", "T-014"]);
    expect(col?.sliceIndex).toBe(2);
  });

  it("keeps the line a single boundary when priorities interleave across milestones", () => {
    const board = selectBoard(
      withRoadmap([
        [path("T-011"), task("T-011", "F-01", 1, "planned", [], 1)],
        [path("T-012"), task("T-012", "F-01", 2, "planned", [], 2)],
        [path("T-013"), task("T-013", "F-01", 3, "planned", [], 1)],
      ]),
    );
    const col = board.columns[0];
    // Milestone-1 block first (priority order within it), later block after.
    expect(col?.cards.map((c) => c.id)).toEqual(["T-011", "T-013", "T-012"]);
    expect(col?.sliceIndex).toBe(2);
  });

  it("an all-milestone-1 column slices after the last card; an all-later column at 0", () => {
    const board = selectBoard(
      withRoadmap([
        [path("T-011"), task("T-011", "F-01", 1, "planned", [], 1)],
        [path("T-021"), task("T-021", "F-02", 1, "planned", [], 2)],
      ]),
    );
    expect(board.columns[0]?.sliceIndex).toBe(1);
    expect(board.columns[1]?.sliceIndex).toBe(0);
  });
});

describe("selectBoard — unmapped routing (criterion 4)", () => {
  it("a card whose feature is not in the backbone lands in a trailing unmapped column", () => {
    const board = selectBoard(
      withRoadmap([
        [path("T-011"), task("T-011", "F-01", 1)],
        [path("T-099"), task("T-099", "F-99", 1)],
      ]),
    );
    const last = board.columns[board.columns.length - 1];
    expect(board.columns.map((c) => c.key)).toEqual(["F-01", "F-02", "F-03", "unmapped"]);
    expect(last?.featureId).toBeUndefined();
    expect(last?.name).toBe("unmapped");
    expect(last?.cards.map((c) => c.id)).toEqual(["T-099"]);
  });

  it("a suggestion with no feature: lands in unmapped as a ghost", () => {
    const suggestion = fm(
      ["title", "An idea"],
      ["status", "suggested"],
      ["suggested_by", "executor claude-fable-5 @T-004"],
    );
    const board = selectBoard(withRoadmap([[path("T-011-s1-idea"), suggestion]]));
    const last = board.columns[board.columns.length - 1];
    expect(last?.key).toBe("unmapped");
    expect(last?.cards).toEqual([]);
    expect(last?.ghosts.map((g) => g.title)).toEqual(["An idea"]);
  });

  it("a suggestion WITH a backbone feature ghosts in that feature's column", () => {
    const suggestion = fm(
      ["title", "Board idea"],
      ["feature", "F-02"],
      ["status", "suggested"],
      ["suggested_by", "verifier"],
    );
    const board = selectBoard(withRoadmap([[path("T-020-s1-idea"), suggestion]]));
    expect(board.columns.map((c) => c.key)).toEqual(["F-01", "F-02", "F-03"]);
    expect(board.columns[1]?.ghosts.map((g) => g.title)).toEqual(["Board idea"]);
  });

  it("the unmapped column does not exist when everything maps", () => {
    const board = selectBoard(withRoadmap([[path("T-011"), task("T-011", "F-01", 1)]]));
    expect(board.columns.some((c) => c.key === "unmapped")).toBe(false);
  });
});

// T-097 — a padding-aliased BACKBONE (`F-1` beside `F-01`) is one slot
// spelled twice; the parser reports it as `aliased-id` / space feature.
// These bodies pin what the BOARD does with it, and they were written
// and run BEFORE the ruling below was made, so the behaviour they
// capture is today's rather than the one that was wanted.
const ALIASED_ROADMAP = [
  "# R",
  "",
  "## Backbone",
  "- F-1: One — the unpadded bullet",
  "- F-01: One padded — the padded bullet",
  "- F-02: Two — a genuinely different slot",
  "",
].join("\n");

const aliasedBoard = (files: Array<[string, string]>): BoardModel =>
  selectBoard(project([["docs/ROADMAP.md", ALIASED_ROADMAP], ...files]));

describe("selectBoard — a padding-aliased backbone slot (T-097)", () => {
  it("renders BOTH spellings as columns and SPLITS the slot's tasks across them by exact string", () => {
    const board = aliasedBoard([
      [path("T-101"), task("T-101", "F-1", 1)],
      [path("T-102"), task("T-102", "F-01", 1)],
    ]);

    // The column SET: two columns for one slot, in ROADMAP order, and
    // — the half that discriminates this from the unmapped case —
    // NO unmapped column at all. Neither task is homeless.
    expect(board.columns.map((c) => c.key)).toEqual(["F-1", "F-01", "F-02"]);
    expect(board.columns.some((c) => c.key === UNMAPPED_KEY)).toBe(false);

    // Column IDENTITY, per task. Asserting "not in unmapped" would be
    // satisfied by the defect; these two lines name the column each
    // task reaches, which is the only assertion the next change moves.
    const cardsIn = (key: string): string[] =>
      board.columns.find((c) => c.key === key)?.cards.map((c) => c.id ?? "") ?? ["NO SUCH COLUMN"];
    expect(cardsIn("F-1")).toEqual(["T-101"]);
    expect(cardsIn("F-01")).toEqual(["T-102"]);
    expect(cardsIn("F-02")).toEqual([]);

    // Both columns keep their own name and description — the two
    // bullets really are two declarations and the board says so (T-017).
    expect(board.columns.map((c) => c.name)).toEqual(["One", "One padded", "Two"]);
  });

  // Everything above this line is what the board did BEFORE T-097 and
  // still does: the ruling refused slot routing. What T-097 ADDS is the
  // disclosure — below.
  it("BOTH aliased columns disclose the other spelling; the unaliased one carries no key at all", () => {
    const board = aliasedBoard([
      [path("T-101"), task("T-101", "F-1", 1)],
      [path("T-102"), task("T-102", "F-01", 1)],
    ]);
    const column = (key: string): BoardColumn | undefined => board.columns.find((c) => c.key === key);

    expect(column("F-1")?.aliasedWith).toEqual(["F-01"]);
    expect(column("F-01")?.aliasedWith).toEqual(["F-1"]);

    // ABSENCE, not `[]` — an unaliased column does not grow the key.
    expect(column("F-02")?.aliasedWith).toBeUndefined();
    expect(
      Object.prototype.hasOwnProperty.call(column("F-02") as object, "aliasedWith"),
    ).toBe(false);
  });

  it("an UNALIASED backbone discloses nothing anywhere — the marker is not unconditional", () => {
    const board = selectBoard(
      withRoadmap([
        [path("T-011"), task("T-011", "F-01", 1)],
        [path("T-099"), task("T-099", "F-99", 1)],
      ]),
    );
    expect(board.columns.every((c) => c.aliasedWith === undefined)).toBe(true);
  });

  it("a THREE-way alias names both other spellings, and the disclosure is per-column", () => {
    const threeWay = [
      "# R",
      "",
      "## Backbone",
      "- F-1: A — one",
      "- F-01: B — two",
      "- F-001: C — three",
      "",
    ].join("\n");
    const board = selectBoard(project([["docs/ROADMAP.md", threeWay]]));
    // Columns are in ROADMAP order (F-1, F-01, F-001); the spellings
    // WITHIN each disclosure are in the parser's own comparator order,
    // which is string order ('F-001' < 'F-01' < 'F-1'), because they
    // are the issue's `ids` array minus self and the board does not
    // re-sort what the parser already ordered.
    expect(board.columns.map((c) => c.key)).toEqual(["F-1", "F-01", "F-001"]);
    expect(board.columns.map((c) => c.aliasedWith)).toEqual([
      ["F-001", "F-01"],
      ["F-001", "F-1"],
      ["F-01", "F-1"],
    ]);
  });

  // HONEST LABEL (T-097-s2): this body does NOT discriminate removal of
  // the `space === 'feature'` filter. Component ids are `C-\d{2,}` and
  // feature ids are `F-\d+`, so a component slot key can never equal a
  // feature column key and an unfiltered index would leave every column
  // untouched anyway. The filter is correct and deliberate, and it is
  // provably unreachable-as-a-bug for the board; what this body pins is
  // the OUTCOME (a component alias marks no column), not the mechanism.
  it("a COMPONENT-space alias marks no board column", () => {
    const componentAlias = (id: string): [string, string] => [
      `docs/architecture/components/${id}-thing.md`,
      fm(["id", id], ["name", `${id} thing`], ["layer", "app"], ["status", "auto"]),
    ];
    const parsed = project([
      ["docs/ROADMAP.md", ROADMAP],
      componentAlias("C-05"),
      componentAlias("C-005"),
    ]);
    // The parser really did raise an alias — in the OTHER space.
    expect(
      parsed.issues.filter((i) => i.kind === "aliased-id").map((i) => i.space),
    ).toEqual(["component"]);
    expect(selectBoard(parsed).columns.every((c) => c.aliasedWith === undefined)).toBe(true);
  });

  it("the split is invisible in the model without the alias marker — the parser's issue is the only other signal", () => {
    const parsed = project([
      ["docs/ROADMAP.md", ALIASED_ROADMAP],
      [path("T-101"), task("T-101", "F-1", 1)],
    ]);
    const aliasIssues = parsed.issues.filter((i) => i.kind === "aliased-id");
    expect(aliasIssues).toHaveLength(1);
    expect(aliasIssues[0]).toMatchObject({ space: "feature", ids: ["F-01", "F-1"] });
  });

  it("ONE spelling in the backbone is the contrasting case: the other spelling is homeless, visibly", () => {
    const onlyPadded = ["# R", "", "## Backbone", "- F-01: One — the padded bullet", ""].join("\n");
    const board = selectBoard(
      project([
        ["docs/ROADMAP.md", onlyPadded],
        [path("T-101"), task("T-101", "F-1", 1)],
      ]),
    );
    expect(board.columns.map((c) => c.key)).toEqual(["F-01", UNMAPPED_KEY]);
    expect(board.columns[0]?.cards.map((c) => c.id)).toEqual([]);
    expect(board.columns[1]?.cards.map((c) => c.id)).toEqual(["T-101"]);
  });
});

describe("selectBoard — ghost/parked partition", () => {
  it("suggested tasks become ghosts (id-ordered, missing ids last), never real cards", () => {
    const withId = fm(
      ["id", "T-031"],
      ["title", "Numbered idea"],
      ["feature", "F-01"],
      ["status", "suggested"],
      ["suggested_by", "human"],
    );
    const noId = fm(
      ["title", "Raw idea"],
      ["feature", "F-01"],
      ["status", "suggested"],
      ["suggested_by", "human"],
    );
    const board = selectBoard(
      withRoadmap([
        [path("T-000-raw-idea"), noId],
        [path("T-031"), withId],
        [path("T-011"), task("T-011", "F-01", 1)],
      ]),
    );
    const col = board.columns[0];
    expect(col?.cards.map((c) => c.id)).toEqual(["T-011"]);
    expect(col?.ghosts.map((g) => g.title)).toEqual(["Numbered idea", "Raw idea"]);
  });

  it("parked tasks collapse into per-feature row ENTRIES (feature-less parked under unmapped) — T-005-s1", () => {
    const parked = (id: string, title: string, feature?: string): string =>
      fm(
        ["id", id],
        ["title", title],
        ...(feature === undefined ? [] : ([["feature", feature]] as Field[])),
        ["status", "parked"],
      );
    const board = selectBoard(
      withRoadmap([
        [path("T-041-parked-b"), parked("T-041", "Parked B", "F-01")],
        [path("T-040-parked-a"), parked("T-040", "Parked A", "F-01")],
        [path("T-042-parked-c"), parked("T-042", "Parked C")],
      ]),
    );
    // The entries themselves surface — the board can now inspect its
    // one previously opaque population — id-ordered like ghosts, and
    // never as real cards or ghosts.
    expect(board.columns[0]?.parked.map((c) => [c.id, c.title])).toEqual([
      ["T-040", "Parked A"],
      ["T-041", "Parked B"],
    ]);
    expect(board.columns[0]?.cards).toEqual([]);
    expect(board.columns[0]?.ghosts).toEqual([]);
    const last = board.columns[board.columns.length - 1];
    expect(last?.key).toBe("unmapped");
    expect(last?.parked.map((c) => c.id)).toEqual(["T-042"]);
  });

  it("parked entries open by id: every parked entry carries the id its cardRef resolves by", () => {
    // TASK-FORMAT requiredness: only suggestions may omit id, so a
    // parked task always has one — the detail panel ref is stable.
    const board = selectBoard(
      withRoadmap([
        [path("T-040-parked-a"), fm(["id", "T-040"], ["title", "Parked A"], ["feature", "F-01"], ["status", "parked"])],
      ]),
    );
    const entry = board.columns[0]?.parked[0];
    expect(entry?.id).toBe("T-040");
    expect(entry?.file).toBe(path("T-040-parked-a"));
  });
});

describe("selectBoard — rejected ×N derivation (T-006-s3)", () => {
  const TWICE_REJECTED = [
    "",
    "## Verdicts",
    "2026-08-12 — codex (verifier): REJECTED",
    "",
    "repro: file order.",
    "",
    "2026-08-13 — codex (verifier): REJECTED — still file order.",
    "",
    "2026-08-14 — claude (verifier): APPROVED — quoting the REJECTED repro.",
    "",
  ].join("\n");

  /** Task source with a body (fm() has no body parameter). */
  const taskWithBody = (id: string, status: string, body: string): string =>
    `${fm(
      ["id", id],
      ["title", `${id} title`],
      ["feature", "F-01"],
      ["milestone", 1],
      ["priority", 1],
      ["size", "M"],
      ["status", status],
    )}${body}`;

  it("counts REJECTED verdict entries from the verdicts section — panel classifier, no parser change", () => {
    const board = selectBoard(
      withRoadmap([[path("T-011"), taskWithBody("T-011", "rejected", TWICE_REJECTED)]]),
    );
    expect(board.columns[0]?.cards[0]?.rejectedCount).toBe(2);
  });

  it("zero verdicts -> absence, not 0 (criterion 6)", () => {
    const board = selectBoard(
      withRoadmap([[path("T-011"), task("T-011", "F-01", 1, "rejected")]]),
    );
    expect(board.columns[0]?.cards[0]?.rejectedCount).toBeUndefined();
  });

  it("approved-only history -> absence too (a REJECTED quoted in an approved header tints approved, first-match-wins)", () => {
    const approvedOnly = [
      "",
      "## Verdicts",
      "2026-08-14 — verifier: APPROVED — the REJECTED repro no longer reproduces.",
      "",
    ].join("\n");
    const board = selectBoard(
      withRoadmap([[path("T-011"), taskWithBody("T-011", "done", approvedOnly)]]),
    );
    expect(board.columns[0]?.cards[0]?.rejectedCount).toBeUndefined();
  });

  it("the count is model truth for any status (a building card keeps its scar count)", () => {
    const board = selectBoard(
      withRoadmap([[path("T-011"), taskWithBody("T-011", "building", TWICE_REJECTED)]]),
    );
    expect(board.columns[0]?.cards[0]?.rejectedCount).toBe(2);
  });
});

describe("selectBoard — badge derivation", () => {
  it("model badge shows builder pre-done (short name, full raw preserved)", () => {
    const board = selectBoard(
      withRoadmap([
        [path("T-011"), task("T-011", "F-01", 1, "building", [["builder", "claude-fable-5"]])],
      ]),
    );
    expect(board.columns[0]?.cards[0]?.model).toEqual({
      short: "fable",
      full: "claude-fable-5",
    });
  });

  it("model badge shows built_by once done, builder before", () => {
    const fields: Field[] = [
      ["builder", "claude-fable-5"],
      ["built_by", "codex/gpt-5.2 @S3"],
    ];
    const doneBoard = selectBoard(
      withRoadmap([
        [
          path("T-011"),
          task("T-011", "F-01", 1, "done", [...fields, ["review", "independent"]]),
        ],
      ]),
    );
    expect(doneBoard.columns[0]?.cards[0]?.model).toEqual({
      short: "codex",
      full: "codex/gpt-5.2 @S3",
    });

    const verifyingBoard = selectBoard(
      withRoadmap([[path("T-011"), task("T-011", "F-01", 1, "verifying", fields)]]),
    );
    expect(verifyingBoard.columns[0]?.cards[0]?.model).toEqual({
      short: "fable",
      full: "claude-fable-5",
    });
  });

  it("no builder and no built_by -> no model badge", () => {
    const board = selectBoard(withRoadmap([[path("T-011"), task("T-011", "F-01", 1)]]));
    expect(board.columns[0]?.cards[0]?.model).toBeUndefined();
  });

  it("review badge appears on done cards only, one value per review mode", () => {
    for (const mode of ["independent", "same-model", "self-verified"] as const) {
      const board = selectBoard(
        withRoadmap([[path("T-011"), task("T-011", "F-01", 1, "done", [["review", mode]])]]),
      );
      expect(board.columns[0]?.cards[0]?.review).toBe(mode);
    }
  });

  it("done without review: -> no badge; non-done with review: -> no badge", () => {
    const doneNoReview = selectBoard(
      withRoadmap([[path("T-011"), task("T-011", "F-01", 1, "done")]]),
    );
    expect(doneNoReview.columns[0]?.cards[0]?.review).toBeUndefined();

    const verifyingWithReview = selectBoard(
      withRoadmap([
        [path("T-011"), task("T-011", "F-01", 1, "verifying", [["review", "independent"]])],
      ]),
    );
    expect(verifyingWithReview.columns[0]?.cards[0]?.review).toBeUndefined();
  });

  it("size and milestone/priority pass through to the card face", () => {
    const board = selectBoard(withRoadmap([[path("T-011"), task("T-011", "F-01", 7)]]));
    const card = board.columns[0]?.cards[0];
    expect(card?.size).toBe("M");
    expect(card?.priority).toBe(7);
    expect(card?.milestone).toBe(1);
    expect(card?.title).toBe("T-011 title");
  });
});

describe("statusVisual — status/color/pulse mapping", () => {
  it("maps each status to its token pair; verifying and merging pulse", () => {
    expect(statusVisual("planned")).toEqual({ token: "planned", pulse: false });
    expect(statusVisual("building")).toEqual({ token: "building", pulse: false });
    expect(statusVisual("verifying")).toEqual({ token: "verifying", pulse: true });
    expect(statusVisual("rejected")).toEqual({ token: "rejected", pulse: false });
    expect(statusVisual("done")).toEqual({ token: "done", pulse: false });
    expect(statusVisual("merging")).toEqual({ token: "merging", pulse: true });
  });

  it("merging renders as a real card with the merging (teal) token, pulsing", () => {
    const board = selectBoard(
      withRoadmap([[path("T-011"), task("T-011", "F-01", 1, "merging")]]),
    );
    const card = board.columns[0]?.cards[0];
    expect(card?.status).toBe("merging");
    expect(card?.visual).toEqual({ token: "merging", pulse: true });
  });
});

describe("shortModelName", () => {
  it("derives short display names", () => {
    expect(shortModelName("claude-fable-5")).toBe("fable");
    expect(shortModelName("codex")).toBe("codex");
    expect(shortModelName("codex/gpt-5.2")).toBe("codex");
    expect(shortModelName("gpt-5.2")).toBe("gpt");
    expect(shortModelName("claude")).toBe("claude");
  });
});

describe("selectBoard — empty states", () => {
  it("an empty model is empty (no columns, board renders the minimal line)", () => {
    const board = selectBoard(project([]));
    expect(board.columns).toEqual([]);
    expect(board.empty).toBe(true);
  });

  it("features without tasks: columns render, board is not empty", () => {
    const board = selectBoard(withRoadmap([]));
    expect(board.empty).toBe(false);
    expect(board.columns).toHaveLength(3);
    expect(board.columns.every((c) => c.cards.length === 0)).toBe(true);
  });

  it("tasks without any backbone render in unmapped alone (nothing is dropped)", () => {
    const model = project([
      ["docs/ROADMAP.md", "# R\n\n## Backbone\n"],
      [path("T-011"), task("T-011", "F-01", 1)],
    ]);
    const board = selectBoard(model);
    expect(board.empty).toBe(false);
    expect(board.columns.map((c) => c.key)).toEqual(["unmapped"]);
    expect(board.columns[0]?.cards.map((c) => c.id)).toEqual(["T-011"]);
    // 2026-08-16 (T-019 rejection fix): a clean-but-empty backbone no
    // longer silences feature danglers — this model now carries exactly
    // one, attributed to the TASK file (never the roadmap, so the
    // watcher's roadmap last-good machinery stays untouched), while the
    // card still renders in unmapped exactly as pinned above.
    expect(model.issues).toEqual([
      expect.objectContaining({
        kind: "dangling-reference",
        field: "feature",
        id: "F-01",
        file: path("T-011"),
      }),
    ]);
  });
});

describe("soft issues join to their card by file (T-031, absorbing T-019-s1)", () => {
  // The lens is `issuesByFile`, and it is the ONE join between
  // `model.issues` and a card — the board face and the detail panel both
  // read it, so a mark and a list can never disagree (verdicts.ts's
  // rule, applied to a second derivation).
  const model = withRoadmap([
    [path("T-410"), task("T-410", "F-01", 1, "planned", [["blocked_by", "[T-999, T-01]"]])],
    [path("T-411"), task("T-411", "F-99", 2)],
    [path("T-412"), task("T-412", "F-01", 3)],
  ]);

  const cardById = (board: BoardModel, id: string) =>
    board.columns.flatMap((c) => c.cards).find((c) => c.id === id);

  it("indexes every issue that names ONE file, in issue order, keyed by that file", () => {
    const index = issuesByFile(model.issues);
    expect([...index.keys()].sort()).toEqual([path("T-410"), path("T-411")]);
    expect(index.get(path("T-410"))).toEqual(
      model.issues
        .filter((i) => "file" in i && i.file === path("T-410"))
        .map((i) => i.message),
    );
    expect(index.get(path("T-410"))?.length).toBe(2);
    // The messages are the parser's own, verbatim — never rewritten.
    expect(index.get(path("T-411"))?.[0]).toContain("F-99");
    // The clean file is ABSENT from the index rather than mapped to [].
    expect(index.has(path("T-412"))).toBe(false);
  });

  it("reads the FIELD, not the kind: a cross-file issue carrying `files` joins to nobody", () => {
    // A duplicate id is a statement about a PAIR of records, so neither
    // card's own file is wrong and neither wears the mark. The pair has
    // its own surfaces already (the column's aliasedWith, T-097; the
    // header strip, T-077).
    const duplicates = withRoadmap([
      [path("T-420"), task("T-420", "F-01", 1)],
      [path("T-420-b"), task("T-420", "F-01", 2)],
    ]);
    const cross = duplicates.issues.filter((i) => i.kind === "duplicate-id");
    expect(cross.length).toBe(1); // positive control: it really is reported
    expect(issuesByFile(duplicates.issues).size).toBe(0);
    // …and the board still renders both records, flagging not hiding.
    expect(selectBoard(duplicates).columns[0]?.cards.length).toBe(2);
  });

  // ONE body, not two. A first draft added "the join adds a surface and
  // never a filter" beside this; the drill measured its kill set to be a
  // strict SUBSET of this one's, which is shape six. The arithmetic it
  // asserted is worth keeping and is folded in below, where it costs no
  // second body.
  it("a flagged card carries its own messages, a clean card omits the key, and nothing is dropped", () => {
    const board = selectBoard(model);
    expect(cardById(board, "T-410")?.issues?.length).toBe(2);
    expect(cardById(board, "T-411")?.issues?.[0]).toContain("F-99");
    // ABSENT, never [] — the aliasedWith/rejectedCount discipline, so
    // `toStrictEqual` and `in` agree with the doc comment.
    const clean = cardById(board, "T-412");
    expect(clean?.issues).toBeUndefined();
    expect("issues" in (clean ?? {})).toBe(false);

    // The join is a SURFACE, never a filter: every issue in the model
    // that names a card's file reaches that card, and every card is
    // still on the board. The header's own count reads model.issues
    // directly, and this is the selector-level half of that pin.
    const marked = board.columns.flatMap((c) => c.cards).flatMap((c) => c.issues ?? []).length;
    expect(model.issues.length).toBe(3);
    expect(marked).toBe(3);
    expect(board.columns.flatMap((c) => c.cards).length).toBe(3);
  });
});

// =====================================================================
// T-111 — THE DISPATCH FRONTIER.
//
// Every body below drives `selectDispositions`, `normaliseTouchToken`,
// `touchTokensOverlap`, `expandTouch` or `fenceClashes`. Half run on
// synthetic models and half on THIS REPOSITORY'S OWN LIVE BOARD, which
// the card asks for by name — a normalisation rule pinned against a
// synthetic pair is pinned against the pair somebody invented, and the
// collisions that actually exist here are not that pair.
//
// **`app/test/**` IS C-05's `app-shell`, AND THAT IS WHY THESE BODIES
// EXIST AT ALL.** T-111's first lane built SEVEN OF EIGHT CRITERIA NOT,
// and was right to: its fence was `[app-board]`, thirteen globs all under
// `app/src/**`, while the app's only collector is `app/vitest.config.ts`
// with `include: ["test/**"]` — so no pin could live in the fence and
// three criteria name a pin in their own text (`T-111-s2`, the fifth
// instance of `T-015-s1`). The architect corrected `touches:` in place to
// `[app-board, app-shell]`, which buys exactly this file.
//
// THE PINS ARE HERE RATHER THAN IN A NEW SUITE FILE, deliberately: a new
// indexed file moves `architecture-dogfood`'s file count and
// `map-dogfood-render`'s header hint, and those reconciliations belong to
// the checkpoint that regenerates the graph. This card owes the
// integrator no reconciliation it can avoid owing (the `T-135-s3` class).
// =====================================================================

const REPO_ROOT = resolve(fileURLToPath(new URL(".", import.meta.url)), "../..");

const readRepo = (rel: string): string => readFileSync(join(REPO_ROOT, rel), "utf8");

/** The statuses whose cards carry no disposition reason at all. */
const NO_REASON_STATUSES = new Set<TaskStatus>(["done", "merging", "parked"]);

/**
 * This repository's live board, through the real parser. Flat
 * `docs/tasks/*.md` only — `rejected/` is excluded from the board by
 * design (CONVENTIONS' suggestion-triage bullet).
 *
 * **THE SHAPE IS `architecture-dogfood.test.ts`'s, AND THAT IS NOT
 * COSMETIC.** The DOCS GATE derives which suites READ which docs paths by
 * scanning for a docs-shaped literal it can resolve against a root the
 * file holds. A first draft of this function looped
 * `for (const dir of ["docs/tasks", …])` and joined with
 * `dir + "/" + name`, so every literal sat behind a loop variable: the
 * scanner saw a file holding the repository root and forming NO docs path
 * it could link, which is `unaccountedRootAnchors()`'s residual —
 * `docs-input-gate.spec.ts` went 4 red and the gate exited 1 on a
 * code-only path list. The reads were real either way; only the scanner's
 * view of them changed. Written this way the gate DERIVES this suite as a
 * `docs/tasks` + `docs/architecture/components` reader, which is the true
 * answer, and nothing has to be argued into a ledger outside this fence.
 */
function liveBoard(): ProjectParseResult {
  const files: Array<{ path: string; content: string }> = [];
  for (const name of readdirSync(join(REPO_ROOT, "docs/tasks"))) {
    if (name.endsWith(".md")) {
      files.push({ path: `docs/tasks/${name}`, content: readRepo(`docs/tasks/${name}`) });
    }
  }
  for (const name of readdirSync(join(REPO_ROOT, "docs/architecture/components"))) {
    if (name.endsWith(".md")) {
      files.push({
        path: `docs/architecture/components/${name}`,
        content: readRepo(`docs/architecture/components/${name}`),
      });
    }
  }
  files.push({ path: "docs/ROADMAP.md", content: readRepo("docs/ROADMAP.md") });
  return parseProjectFromFiles(files);
}

/** The raw `touches:` tokens on the live board and the cards holding
 * each — the census criterion 3 says the normalisation pin must be driven
 * from. */
function liveTouchTokens(model: ProjectParseResult): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const t of model.tasks) {
    for (const token of t.touches) {
      const held = out.get(token) ?? [];
      held.push(t.id ?? t.file);
      out.set(token, held);
    }
  }
  return out;
}

const lane = (taskId: string, branch: string, touches: string[] = []): InFlightLane => ({
  taskId,
  branch,
  worktreePath: "/Users/x/Projects/nputer-" + taskId,
  touches,
  disagrees: false,
  fenceKnown: true,
});

const laneHold = (taskId: string, branch: string, existsOnDisk = true): LaneHold => ({
  taskId,
  branch,
  worktreePath: "/Users/x/Projects/nputer-" + taskId,
  existsOnDisk,
});

/** A `DispatchReading` from rows, in the shape `hydrateJoin` produces. */
const reading = (...rows: DispatchStamp[]): DispatchReading => ({
  kind: "joined",
  rows: new Map(rows.map((r) => [r.taskId, r])),
});

const NO_LANES: DispatchReading = { kind: "joined", rows: new Map() };

const dispositionOf = (m: DispositionModel, id: string): CardDisposition | undefined =>
  m.kind === "derived" ? m.cards.get(id) : undefined;

/** A component file's source, so a synthetic model can carry a registry. */
const component = (id: string, slugs: string[], paths: string[]): [string, string] => [
  "docs/architecture/components/" + id + "-x.md",
  [
    "---",
    "id: " + id,
    "name: " + id,
    "paths:",
    ...paths.map((p) => "  - " + p),
    "touch_slugs: [" + slugs.join(", ") + "]",
    "status: auto",
    "---",
    "prose",
    "",
  ].join("\n"),
];

describe("normalisation is ONE function and it states its own ceiling (criterion 3)", () => {
  it("collapses a trailing slash, a glob tail and a doubled separator", () => {
    expect(normaliseTouchToken("tools/e2e/")).toBe("tools/e2e");
    expect(normaliseTouchToken("tools/e2e")).toBe("tools/e2e");
    expect(normaliseTouchToken("app/src/styles/**")).toBe("app/src/styles");
    expect(normaliseTouchToken("docs//tasks/")).toBe("docs/tasks");
    expect(normaliseTouchToken("  method/  ")).toBe("method");
  });

  it("the two spellings that collide on THIS board are both live, and they overlap", () => {
    // Criterion 3 asks for a pin "driven from the live board's own tokens
    // rather than a synthetic pair", so the corpus is asserted before the
    // rule is: a normalisation pinned against a pair nobody writes is a
    // pin against nothing.
    const tokens = liveTouchTokens(liveBoard());
    expect(tokens.has("tools/e2e")).toBe(true);
    expect(tokens.has("tools/e2e/")).toBe(true);
    expect(touchTokensOverlap("tools/e2e", "tools/e2e/")).toBe(true);
    expect(tokens.has("method")).toBe(true);
    expect(tokens.has("method/")).toBe(true);
    expect(touchTokensOverlap("method", "method/")).toBe(true);
  });

  it("containment is overlap, which is the half a trailing-slash rule misses", () => {
    // `T-111-s3` measured the prescribed minimum reaching two of four
    // collisions; the two it misses are CONTAINMENTS, and one of them has
    // grown a whole family since that census — every `method/<file>` token
    // a card now carries sits under the bare `method/` other cards hold.
    const tokens = liveTouchTokens(liveBoard());
    expect(tokens.has("docs")).toBe(true);
    expect(tokens.has("docs/CONVENTIONS.md")).toBe(true);
    expect(touchTokensOverlap("docs", "docs/CONVENTIONS.md")).toBe(true);
    expect(tokens.has("method/lane-protocol.md")).toBe(true);
    expect(touchTokensOverlap("method/", "method/lane-protocol.md")).toBe(true);
    // …and the containment test is anchored on a separator, so this
    // repository's own worst near-miss stays disjoint.
    expect(touchTokensOverlap("app/src", "app/src-tauri")).toBe(false);
  });

  it("the KNOWN-WRONG hole is pinned AS known-wrong: `ci` against `.github/`", () => {
    // `T-111-s3`'s fourth collision. The two tokens name one thing and
    // share no substring, so no string rule reaches them — and the danger
    // is a reader concluding the vocabulary is reconciled. This body
    // exists so the ceiling in the doc comment cannot drift away from the
    // behaviour: if somebody closes it with a special case, this reds and
    // they have to move the doc with it.
    const tokens = liveTouchTokens(liveBoard());
    expect(tokens.has("ci")).toBe(true);
    expect(tokens.has(".github/")).toBe(true);
    expect(touchTokensOverlap("ci", ".github/")).toBe(false);
  });

  it("T-054 is still the live fixture carrying three of the four at once", () => {
    // `T-111-s3` nominates it, so the nomination is CHECKED rather than
    // quoted: a fixture that has moved is not a fixture.
    const t054 = liveBoard().tasks.find((t) => t.id === "T-054");
    expect(t054?.touches).toEqual(["docs", "method", "tools/e2e", "ci"]);
  });
});

describe("a fence is compared over EXPANDED components, never slug strings (T-111-s1)", () => {
  it("app-board and app-shell claim NO component in common since T-163 — the EXPANSION says so", () => {
    // RE-DERIVED AT T-163 (@human's architecture ruling, 2026-08-30).
    // This body used to assert the opposite — `.toEqual(["C-11"])` —
    // because design tokens carried `touch_slugs: [app-shell, app-board]`
    // and were the ONE component two slugs expanded through. The ruling
    // took that field to `[]`, so the live fact inverted; the body is
    // re-derived rather than deleted, because the live half is worth
    // exactly as much pointing the other way. **THE MECHANISM IT USED TO
    // CARRY MOVED, IT DID NOT LEAVE**: "two different slug strings that
    // reserve one component overlap" now has no live subject on this
    // board, so it is pinned on a synthetic registry in the clash body
    // below — a pin driven from a fact the tree no longer carries is a
    // pin against nothing, which is this section's own header rule.
    const comps = liveBoard().components ?? [];
    const board = expandTouch("app-board", comps);
    const shell = expandTouch("app-shell", comps);
    expect(board.kind).toBe("slug");
    expect(shell.kind).toBe("slug");
    // STRING equality said disjoint before the ruling and says it still…
    expect(normaliseTouchToken("app-board") === normaliseTouchToken("app-shell")).toBe(false);
    // …and now the EXPANSION agrees, which is the whole point of T-163.
    expect(board.componentIds.filter((id) => shell.componentIds.includes(id))).toEqual([]);
    expect(board.componentIds).not.toContain("C-11");
    expect(shell.componentIds).not.toContain("C-11");
    // POSITIVE CONTROL: both slugs still expand to real components, so
    // the empty intersection above is a DISJOINTNESS and not two
    // expansions that found nothing.
    expect(board.componentIds.length).toBeGreaterThan(1);
    expect(shell.componentIds.length).toBeGreaterThan(1);
    // AND THE ROUTE THE RULING LEFT OPEN IS ASSERTED HERE rather than
    // described: C-11 is still in the registry with its paths intact, and
    // a bare PATH token still fences that territory exactly.
    const c11 = comps.find((c) => c.id === "C-11");
    expect(c11?.touchSlugs).toEqual([]);
    expect(c11?.paths).toContain("app/src/styles/**");
    const byPath = expandTouch("app/src/styles", comps);
    expect(byPath.kind).toBe("path");
    expect(byPath.paths).toEqual(["app/src/styles"]);
  });

  it("a token naming no slug is a literal path and expands to itself", () => {
    const comps = liveBoard().components ?? [];
    const e = expandTouch("docs/CONVENTIONS.md", comps);
    expect(e.kind).toBe("path");
    expect(e.componentIds).toEqual([]);
    expect(e.paths).toEqual(["docs/CONVENTIONS.md"]);
  });

  it("the clash names both faces AND the component, which is the coarse-fence tell", () => {
    // RE-DERIVED AT T-163. This body ran on the LIVE registry until
    // 2026-08-30, driven by `app-board` against `app-shell` through
    // C-11; @human's ruling took C-11's `touch_slugs:` to `[]` and no
    // two slugs on this board reserve one component any more, so the
    // live pair has no clash left to name. THE PROPERTY IS THE ONE
    // T-111-s1 exists for and it is NOT weakened — it moves onto a
    // synthetic registry that still has the shape, and the live half is
    // asserted below as the NEGATIVE it has become.
    const synthetic =
      withRoadmap([
        [path("T-901"), task("T-901", "F-02", 1)],
        component("C-70", ["alpha", "beta"], ["app/src/shared/**"]),
      ]).components ?? [];
    const clashes = fenceClashes(
      { taskId: "T-111", touches: ["alpha"] },
      lane("T-033", "task/T-033-zero-drift", ["beta"]),
      synthetic,
    );
    expect(clashes.length).toBeGreaterThan(0);
    const first = clashes[0];
    expect(first?.token).toBe("alpha");
    expect(first?.laneToken).toBe("beta");
    expect(first?.laneTaskId).toBe("T-033");
    expect(first?.viaComponents).toContain("C-70");
    expect(first?.sharedPaths).toContain("app/src/shared");
    // POSITIVE CONTROL ON THE SYNTHETIC: the two tokens really are
    // different strings reserving one component, which is the case a
    // string compare cannot see.
    expect(normaliseTouchToken("alpha") === normaliseTouchToken("beta")).toBe(false);

    // AND THE LIVE HALF, WHICH IS NOW T-163's OWN RESULT: the pair that
    // used to drive this body comes back with nothing.
    const comps = liveBoard().components ?? [];
    expect(
      fenceClashes(
        { taskId: "T-111", touches: ["app-board"] },
        lane("T-033", "task/T-033-zero-drift", ["app-shell"]),
        comps,
      ),
    ).toEqual([]);
  });

  it("the shared ground is the NARROWER domain, and it is the SAME in both orders", () => {
    // **A09 SURVIVED THE FIRST DRILL AT EXIT 0 AND THAT IS A REJECTION.**
    // The producer decides `pa.length >= pb.length ? pa : pb` behind a
    // comment asserting the rule, and inverting it — proved
    // non-equivalent, `["docs/CONVENTIONS.md"]` becoming `["docs"]` —
    // left 1009 of 1009 green. Nothing asserted which of the two came
    // back.
    //
    // IT IS NOT A MATTER OF TASTE. A parent fence RESERVES the child, so
    // the ground two fences actually share is the CHILD. Reporting the
    // parent tells a human that a lane holding one file has reserved a
    // whole directory tree, which is the coarseness this card exists to
    // make visible rather than to manufacture.
    const model = liveBoard();
    const comps = model.components ?? [];
    // DRIVEN FROM THE LIVE BOARD'S OWN TOKENS, as criterion 3 requires:
    // one card holds a bare `docs` and twenty-odd hold a file under it.
    const holdersOf = (token: string): string[] =>
      model.tasks.filter((t) => t.touches.includes(token)).map((t) => t.id ?? t.file);
    expect(holdersOf("docs").length).toBeGreaterThan(0);
    expect(holdersOf("docs/CONVENTIONS.md").length).toBeGreaterThan(0);

    const childFirst = fenceClashes(
      { taskId: "T-X", touches: ["docs/CONVENTIONS.md"] },
      lane("T-054", "task/T-054-a", ["docs"]),
      comps,
    );
    expect(childFirst[0]?.sharedPaths).toEqual(["docs/CONVENTIONS.md"]);
    // BOTH ORDERS, because "the narrower" is a property of the PAIR: an
    // implementation that simply returns its left-hand argument passes
    // the line above and fails this one.
    const parentFirst = fenceClashes(
      { taskId: "T-054", touches: ["docs"] },
      lane("T-X", "task/T-X", ["docs/CONVENTIONS.md"]),
      comps,
    );
    expect(parentFirst[0]?.sharedPaths).toEqual(["docs/CONVENTIONS.md"]);
    // POSITIVE CONTROL: the two really are a parent/child pair rather
    // than two equal strings, or "the narrower" names nothing.
    expect(normaliseTouchToken("docs")).not.toBe(normaliseTouchToken("docs/CONVENTIONS.md"));
    expect(touchTokensOverlap("docs", "docs/CONVENTIONS.md")).toBe(true);
  });

  it("componentIds are SORTED, never left in registry order", () => {
    // A28 dropped the sort and survived at exit 0, because every fixture
    // handed the registry to this function already in id order. The
    // reversed registry is what makes the sort observable — and the
    // ordering is load-bearing, because `viaComponents` is rendered into
    // a reason a human reads and compares between runs.
    const comps = liveBoard().components ?? [];
    const holders = (cs: typeof comps): string[] =>
      cs.filter((c) => c.touchSlugs.includes("app-board")).map((c) => c.id);
    const reversed = [...comps].reverse();
    // POSITIVE CONTROL FIRST: the reversed registry genuinely presents
    // these records in the other order, or the equality below is free.
    expect(holders(comps).length).toBeGreaterThan(1);
    expect(holders(reversed)).not.toEqual(holders(comps));

    const forward = expandTouch("app-board", comps);
    const backward = expandTouch("app-board", reversed);
    expect(forward.componentIds).toEqual(backward.componentIds);
    expect(forward.componentIds).toEqual([...forward.componentIds].sort());
    // The same for the clash record, which carries its own second sort.
    // RE-DERIVED AT T-163: this half ran `app-board` against `app-shell`
    // on the LIVE registry, and after @human's ruling took C-11's
    // `touch_slugs:` to `[]` that pair returns no clash at all — so the
    // second sort had nothing left to sort and its own positive control
    // (`length > 1`) had lost its subject. The registry moves to a
    // synthetic one carrying the shape; the expansion half above stays
    // LIVE, because four components still hold `app-board` and that is
    // what makes the reversal observable.
    const clashRegistry =
      withRoadmap([
        [path("T-901"), task("T-901", "F-02", 1)],
        component("C-70", ["alpha", "beta"], ["app/src/shared/**"]),
        component("C-71", ["alpha", "beta"], ["app/src/shared/**"]),
      ]).components ?? [];
    const clashOf = (cs: typeof comps): readonly string[] =>
      fenceClashes(
        { taskId: "T-111", touches: ["alpha"] },
        lane("T-033", "task/T-033-zero-drift", ["beta"]),
        cs,
      )[0]?.viaComponents ?? [];
    const clashReversed = [...clashRegistry].reverse();
    // POSITIVE CONTROL, the same one the expansion half takes: the
    // reversed registry really does present these records the other way.
    expect(clashRegistry.map((c) => c.id)).not.toEqual(clashReversed.map((c) => c.id));
    expect(clashOf(clashReversed)).toEqual(clashOf(clashRegistry));
    expect(clashOf(clashRegistry)).toEqual([...clashOf(clashRegistry)].sort());
    expect(clashOf(clashRegistry).length).toBeGreaterThan(1);
  });

  it("T-111's OWN FENCE AND T-134's ARE DISJOINT, derived rather than asserted", () => {
    // The disjointness claim this lane itself rests on, computed the way
    // T-111-s1 says it must be.
    //
    // IT NAMES TWO CARDS AND NOT "THE LANE SET", DELIBERATELY. How many
    // lanes are live is a LIVE-ENVIRONMENT fact with a shelf life of
    // minutes — it went from two to three while this file was being
    // written — and a test title claiming a count would be false without
    // a byte of the tree changing. What is a function of the tree is what
    // these two CARDS declare, and that is all this body asserts.
    const model = liveBoard();
    const comps = model.components ?? [];
    const touchesOf = (id: string): string[] =>
      model.tasks.find((t) => t.id === id)?.touches ?? [];
    expect(touchesOf("T-111")).toEqual(["app-board", "app-shell"]);
    expect(touchesOf("T-134")).toEqual(["lib-parser", "method/lane-protocol.md"]);
    expect(
      fenceClashes(
        { taskId: "T-111", touches: touchesOf("T-111") },
        lane("T-134", "task/T-134-path-fences", touchesOf("T-134")),
        comps,
      ),
    ).toEqual([]);
    // POSITIVE CONTROL: the same call on a fence that DOES overlap must
    // not come back empty, or the emptiness above is worth nothing.
    expect(
      fenceClashes(
        { taskId: "T-111", touches: touchesOf("T-111") },
        lane("T-Z", "task/T-Z", ["lib-parser", "app-board"]),
        comps,
      ).length,
    ).toBeGreaterThan(0);
  });
});

describe("the ceiling is a named constant with its own assertion (criterion 5)", () => {
  it("CONCURRENCY_CEILING is 3-5, hardcoded here and not parametrised by itself", () => {
    expect(CONCURRENCY_CEILING.min).toBe(3);
    expect(CONCURRENCY_CEILING.max).toBe(5);
  });

  it("and it matches the LIVE orchestrator.md, which is the source it claims", () => {
    // The constant and the method file are two copies of one bound; this
    // body is the only thing making them one fact — the shape
    // `snapshot_version_matches_the_live_method_stamps` uses one language
    // over, for the same reason. NOTE FOR WHOEVER EDITS
    // `method/roles/orchestrator.md`: the DOCS GATE's trigger is `docs/`
    // and `method/` is not `docs/`, so the gate will not name this suite
    // (T-132-s2's class). `app/test/genesis-derive.test.ts` already reads
    // `method/interview/plan-interview.md` under the same gap.
    const m = /Ceiling:\s*(\d+)\s*[–—-]\s*(\d+)\s*concurrent/.exec(
      readRepo("method/roles/orchestrator.md"),
    );
    expect(m).not.toBeNull();
    expect(Number(m?.[1])).toBe(3);
    expect(Number(m?.[2])).toBe(5);
  });

  it("at-ceiling and nothing-is-dispatchable are DIFFERENT SENTENCES", () => {
    const full = selectDispositions(
      withRoadmap([
        ["docs/tasks/T-900.md", task("T-900", "F-01", 1)],
        ["docs/tasks/T-901.md", task("T-901", "F-02", 1)],
        ["docs/tasks/T-902.md", task("T-902", "F-03", 1)],
      ]),
      reading(
        { taskId: "T-800", state: "stampSkipped", lanes: [laneHold("T-800", "task/T-800-a")] },
        { taskId: "T-801", state: "stampSkipped", lanes: [laneHold("T-801", "task/T-801-a")] },
        { taskId: "T-802", state: "stampSkipped", lanes: [laneHold("T-802", "task/T-802-a")] },
        { taskId: "T-803", state: "stampSkipped", lanes: [laneHold("T-803", "task/T-803-a")] },
        { taskId: "T-804", state: "stampSkipped", lanes: [laneHold("T-804", "task/T-804-a")] },
      ),
    );
    if (full.kind !== "derived") throw new Error("unreachable");
    expect(full.inFlight.length).toBe(5);
    expect(full.ceilingReached).toBe(true);
    expect(dispositionOf(full, "T-900")?.disposition).toBe("at-ceiling");
    expect(dispositionOf(full, "T-900")?.reason).toContain("Nothing is wrong with this card");
    expect(full.headline).toContain("THE CEILING IS REACHED");

    // The OTHER sentence: room to spare, and still nothing qualifies.
    const quiet = selectDispositions(
      withRoadmap([
        ["docs/tasks/T-900.md", task("T-900", "F-01", 1, "planned", [["blocked_by", "[T-901]"]])],
        ["docs/tasks/T-901.md", task("T-901", "F-02", 1, "parked")],
      ]),
      NO_LANES,
    );
    if (quiet.kind !== "derived") throw new Error("unreachable");
    expect(quiet.ceilingReached).toBe(false);
    expect(quiet.headline).toContain("NOTHING IS DISPATCHABLE");
    expect(quiet.headline).not.toContain("CEILING IS REACHED");
  });

  it("one lane short of the cap is not the cap", () => {
    const four = selectDispositions(
      withRoadmap([["docs/tasks/T-900.md", task("T-900", "F-01", 1)]]),
      reading(
        { taskId: "T-800", state: "stampSkipped", lanes: [laneHold("T-800", "task/T-800-a")] },
        { taskId: "T-801", state: "stampSkipped", lanes: [laneHold("T-801", "task/T-801-a")] },
        { taskId: "T-802", state: "stampSkipped", lanes: [laneHold("T-802", "task/T-802-a")] },
        { taskId: "T-803", state: "stampSkipped", lanes: [laneHold("T-803", "task/T-803-a")] },
      ),
    );
    if (four.kind !== "derived") throw new Error("unreachable");
    expect(four.ceilingReached).toBe(false);
    expect(dispositionOf(four, "T-900")?.disposition).toBe("dispatchable");
  });
});

describe("the lane set joined with status:, and their DISAGREEMENT visible (criterion 2)", () => {
  // The card asks for a pin driving all FOUR of `join.rs`'s states. The
  // four are CONSUMED, never respelled: they are decided in
  // `app/src-tauri/src/dispatch/join.rs` with a pin under each since
  // T-110's rebuild, and these bodies assert what the BOARD does with
  // each.
  const model = (): ProjectParseResult =>
    withRoadmap([
      ["docs/tasks/T-900.md", task("T-900", "F-01", 1, "building")],
      ["docs/tasks/T-901.md", task("T-901", "F-02", 1, "planned")],
      ["docs/tasks/T-902.md", task("T-902", "F-03", 1, "planned")],
    ]);

  it("live — stamped in flight and a worktree is there, and the lane does NOT disagree", () => {
    const d = selectDispositions(
      model(),
      reading({ taskId: "T-900", state: "live", lanes: [laneHold("T-900", "task/T-900-a")] }),
    );
    const got = dispositionOf(d, "T-900");
    expect(got?.disposition).toBe("not-applicable");
    expect(got?.reason).toContain("is in flight");
    expect(got?.reason).toContain("task/T-900-a");
    // `InFlightLane.disagrees` — the field criterion 2 names for *"THEIR
    // DISAGREEMENT SHALL BE VISIBLE"*. It was declared, assigned and read
    // NOWHERE: arm A24 forcing it to `false` survived at exit 0, so a
    // public interface `T-111-s5` puts on T-137's move list carried
    // unpinned data. This is its `false` face; the `stampSkipped` body
    // below is its `true` one, and the pair is what A24 now reds against.
    if (d.kind !== "derived") throw new Error("unreachable");
    expect(d.inFlight.map((l) => l.disagrees)).toEqual([false]);
  });

  it("died — stamped in flight, no worktree: the fence is NOT held and NO CAUSE is named", () => {
    // THE BODY THAT PROTECTS `T-135`. At the commit this was written, the
    // one card in this state was deliberately merged-but-open pending a
    // human ruling, with a whole heading in docs/STATE.md saying so — and
    // the same combination has meant "somebody forgot" every other time
    // it has appeared. A derivation cannot read intent, so it reports the
    // two facts and refuses the third.
    const d = selectDispositions(model(), reading({ taskId: "T-900", state: "died", lanes: [] }));
    const got = dispositionOf(d, "T-900");
    expect(got?.disposition).toBe("not-applicable");
    expect(got?.reason).toContain("no worktree is registered");
    expect(got?.reason).toContain("NOT held");
    for (const word of ["lapsed", "forgot", "dead", "abandon", "stale"]) {
      expect(got?.reason?.toLowerCase()).not.toContain(word);
    }
    if (d.kind !== "derived") throw new Error("unreachable");
    expect(d.inFlight).toEqual([]);
  });

  it("stampSkipped — a worktree with no stamp: the LANE wins and the fence IS held", () => {
    // Driven from a fixture in which NO card carries `building`, exactly
    // as the card's verification line requires: the lane set alone has to
    // produce the fenced result.
    const m = withRoadmap([
      ["docs/tasks/T-901.md", task("T-901", "F-02", 1, "planned", [["touches", "[alpha]"]])],
      ["docs/tasks/T-902.md", task("T-902", "F-03", 1, "planned", [["touches", "[beta]"]])],
      component("C-70", ["alpha"], ["app/src/shared/**"]),
      component("C-71", ["beta"], ["app/src/shared/**"]),
    ]);
    expect(m.tasks.every((t) => t.status !== "building")).toBe(true);
    const d = selectDispositions(
      m,
      reading({
        taskId: "T-901",
        state: "stampSkipped",
        lanes: [laneHold("T-901", "task/T-901-a")],
      }),
    );
    const holder = dispositionOf(d, "T-901");
    expect(holder?.disposition).toBe("not-applicable");
    expect(holder?.reason).toContain("worktree list outranks the stamp");
    expect(holder?.reason).toContain("IS held");
    const fenced = dispositionOf(d, "T-902");
    expect(fenced?.disposition).toBe("fenced");
    expect(fenced?.reason).toContain("T-901");
    expect(fenced?.clash?.sharedPaths).toEqual(["app/src/shared"]);
    expect(fenced?.clash?.viaComponents).toEqual(["C-70", "C-71"]);
    // THE DISAGREEMENT ITSELF, as a field: a worktree with no stamp IS
    // the board and the disk disagreeing, and `disagrees` says so. Its
    // `false` face is pinned in the `live` body above; between them arm
    // A24 has nowhere to survive.
    if (d.kind !== "derived") throw new Error("unreachable");
    expect(d.inFlight.map((l) => l.disagrees)).toEqual([true]);
  });

  it("the FENCED reason DISCLOSES the coarse fence in words, and a path-only clash does not", () => {
    // **THIS CARD'S OWN HEADLINE (b), AND A20b DELETED IT AT EXIT 0.**
    // The card: *"a reason string honest enough that a human can see it
    // is the coarse fence rather than a real overlap, and override
    // deliberately… the frontier must make that visible, not silently
    // serialize."* Deleting the entire coarse clause from the producer
    // left 1009 of 1009 green — nothing asserted `COARSE`, `expand
    // through` or `override it deliberately` anywhere. The tell was
    // ENCODED in `FenceClash.viaComponents` and never DEFENDED as text,
    // which is criterion 4's whole distinction: *the reason SHALL be
    // rendered as text, not merely encoded.*
    const viaSlugs = withRoadmap([
      ["docs/tasks/T-901.md", task("T-901", "F-02", 1, "planned", [["touches", "[alpha]"]])],
      ["docs/tasks/T-902.md", task("T-902", "F-03", 1, "planned", [["touches", "[beta]"]])],
      component("C-70", ["alpha"], ["app/src/shared/**"]),
      component("C-71", ["beta"], ["app/src/shared/**"]),
    ]);
    const coarse = dispositionOf(
      selectDispositions(
        viaSlugs,
        reading({
          taskId: "T-901",
          state: "stampSkipped",
          lanes: [laneHold("T-901", "task/T-901-a")],
        }),
      ),
      "T-902",
    );
    expect(coarse?.disposition).toBe("fenced");
    expect(coarse?.reason).toContain("both expand through C-70, C-71");
    expect(coarse?.reason).toContain("COARSE fence rather than a real overlap");
    expect(coarse?.reason).toContain("override it deliberately");

    // **THE NEGATIVE CONTROL, WHICH IS WHAT MAKES THE THREE LINES ABOVE
    // WORTH ANYTHING.** Two LITERAL PATH tokens collide through no
    // component at all, so there is nothing coarse to disclose and the
    // clause must be ABSENT. Without this, a producer that appended the
    // clause unconditionally would pass — and would then be lying on
    // every path-only clash, where the overlap is exact and a human has
    // nothing to override.
    const viaPaths = withRoadmap([
      ["docs/tasks/T-901.md", task("T-901", "F-02", 1, "planned", [["touches", "[tools/e2e]"]])],
      ["docs/tasks/T-902.md", task("T-902", "F-03", 1, "planned", [["touches", "[tools/e2e/]"]])],
      // An unrelated component, so the registry is non-empty and the
      // narrow undecidable refusal is not what this body measures.
      component("C-70", ["alpha"], ["app/src/shared/**"]),
    ]);
    const exact = dispositionOf(
      selectDispositions(
        viaPaths,
        reading({
          taskId: "T-901",
          state: "stampSkipped",
          lanes: [laneHold("T-901", "task/T-901-a")],
        }),
      ),
      "T-902",
    );
    expect(exact?.disposition).toBe("fenced");
    expect(exact?.clash?.viaComponents).toEqual([]);
    expect(exact?.reason).not.toContain("COARSE");
    expect(exact?.reason).not.toContain("expand through");
    expect(exact?.reason).not.toContain("override it deliberately");
    // …and the reason is still a full one, so the three absences above
    // are the CLAUSE missing rather than the reason missing.
    expect(exact?.reason).toContain("T-901");
    expect(exact?.reason).toContain("tools/e2e");
    expect(exact?.reason).toContain("they share");
  });

  it("notDispatched — neither, and the card is judged on its own merits", () => {
    expect(
      dispositionOf(
        selectDispositions(
          model(),
          reading({ taskId: "T-901", state: "notDispatched", lanes: [] }),
        ),
        "T-901",
      )?.disposition,
    ).toBe("dispatchable");
  });

  it("a registration whose directory is gone is not a lane and holds no fence", () => {
    const m = withRoadmap([
      ["docs/tasks/T-901.md", task("T-901", "F-02", 1, "planned", [["touches", "[alpha]"]])],
      ["docs/tasks/T-902.md", task("T-902", "F-03", 1, "planned", [["touches", "[alpha]"]])],
      component("C-70", ["alpha"], ["app/src/shared/**"]),
    ]);
    const gone = selectDispositions(
      m,
      reading({
        taskId: "T-901",
        state: "stampSkipped",
        lanes: [laneHold("T-901", "task/T-901-a", false)],
      }),
    );
    if (gone.kind !== "derived") throw new Error("unreachable");
    expect(gone.inFlight).toEqual([]);
    expect(dispositionOf(gone, "T-902")?.disposition).toBe("dispatchable");
    // POSITIVE CONTROL: the same row with the directory PRESENT fences it.
    expect(
      dispositionOf(
        selectDispositions(
          m,
          reading({
            taskId: "T-901",
            state: "stampSkipped",
            lanes: [laneHold("T-901", "task/T-901-a", true)],
          }),
        ),
        "T-902",
      )?.disposition,
    ).toBe("fenced");
  });

  it("an unread lane list makes the board UNDECIDABLE, never all-clear", () => {
    const d = selectDispositions(withRoadmap([["docs/tasks/T-900.md", task("T-900", "F-01", 1)]]), {
      kind: "unavailable",
      sentence: "no .git/worktrees directory.",
    });
    expect(d.kind).toBe("undecidable");
    if (d.kind !== "undecidable") throw new Error("unreachable");
    expect(d.sentence).toContain("no card can be called dispatchable");
    expect(d.sentence).toContain("no .git/worktrees directory.");
  });

  it("a missing component registry with a FENCED live lane is undecidable too", () => {
    const m = withRoadmap([
      ["docs/tasks/T-900.md", task("T-900", "F-01", 1, "planned", [["touches", "[alpha]"]])],
      ["docs/tasks/T-901.md", task("T-901", "F-02", 1, "planned", [["touches", "[alpha]"]])],
    ]);
    expect(m.components).toEqual([]);
    expect(
      selectDispositions(
        m,
        reading({
          taskId: "T-900",
          state: "stampSkipped",
          lanes: [laneHold("T-900", "task/T-900-a")],
        }),
      ).kind,
    ).toBe("undecidable");
    // TWO POSITIVE CONTROLS, because the refusal is narrow on purpose.
    // (a) with NO live lane there is nothing to compare against…
    expect(selectDispositions(m, NO_LANES).kind).toBe("derived");
    // (b) …and neither is there when the live lane reserves nothing, so a
    // registry-less model is not refused for merely being registry-less.
    const bare = withRoadmap([["docs/tasks/T-900.md", task("T-900", "F-01", 1)]]);
    expect(
      selectDispositions(
        bare,
        reading({ taskId: "T-800", state: "stampSkipped", lanes: [laneHold("T-800", "t/x")] }),
      ).kind,
    ).toBe("derived");
  });

  it("a lane no card claims has an UNKNOWN fence, and the caveat says so", () => {
    // A worktree on a `task/` branch that no card declares is
    // `stampSkipped` with a null card. Its fence is not empty — it is
    // unreadable — and those are not the same fact, so a `dispatchable`
    // answer carries the caveat rather than quietly counting the lane as
    // reserving nothing.
    const m = withRoadmap([["docs/tasks/T-900.md", task("T-900", "F-01", 1)]]);
    const d = selectDispositions(
      m,
      reading({ taskId: "T-800", state: "stampSkipped", lanes: [laneHold("T-800", "task/T-800-a")] }),
    );
    if (d.kind !== "derived") throw new Error("unreachable");
    expect(d.inFlight[0]?.fenceKnown).toBe(false);
    const got = dispositionOf(d, "T-900");
    expect(got?.disposition).toBe("dispatchable");
    expect(got?.reason).toContain("CAVEAT");
    expect(got?.reason).toContain("task/T-800-a");
    // POSITIVE CONTROL: the SAME lane, once a card claims it, reads
    // fenceKnown and the caveat disappears.
    const claimed = withRoadmap([
      ["docs/tasks/T-900.md", task("T-900", "F-01", 1)],
      ["docs/tasks/T-800.md", task("T-800", "F-02", 1, "planned")],
    ]);
    const d2 = selectDispositions(
      claimed,
      reading({ taskId: "T-800", state: "stampSkipped", lanes: [laneHold("T-800", "task/T-800-a")] }),
    );
    if (d2.kind !== "derived") throw new Error("unreachable");
    expect(d2.inFlight[0]?.fenceKnown).toBe(true);
    expect(dispositionOf(d2, "T-900")?.reason).not.toContain("CAVEAT");
  });
});

describe("blocked_by is a DECLARATION and whether it binds is DERIVED (T-111-s4)", () => {
  it("a blocker that landed stops binding, and the stored field never had to change", () => {
    // THE WHOLE CARD IN ONE BODY. The field still reads `[T-901]` and the
    // answer is `dispatchable`, because the derivation asks the blocker's
    // own status rather than trusting a line written at drafting time.
    const m = withRoadmap([
      ["docs/tasks/T-900.md", task("T-900", "F-01", 1, "planned", [["blocked_by", "[T-901]"]])],
      ["docs/tasks/T-901.md", task("T-901", "F-02", 1, "done")],
    ]);
    expect(m.tasks.find((t) => t.id === "T-900")?.blockedBy).toEqual(["T-901"]);
    expect(dispositionOf(selectDispositions(m, NO_LANES), "T-900")?.disposition).toBe(
      "dispatchable",
    );
    // POSITIVE CONTROL: the same declaration against a blocker that has
    // NOT landed still blocks, so the green above is about the blocker's
    // status and not about the field being ignored.
    const still = withRoadmap([
      ["docs/tasks/T-900.md", task("T-900", "F-01", 1, "planned", [["blocked_by", "[T-901]"]])],
      ["docs/tasks/T-901.md", task("T-901", "F-02", 1, "planned")],
    ]);
    expect(dispositionOf(selectDispositions(still, NO_LANES), "T-900")?.disposition).toBe(
      "blocked",
    );
  });

  it("`merging` is NOT done: the work has not landed", () => {
    const got = dispositionOf(
      selectDispositions(
        withRoadmap([
          ["docs/tasks/T-900.md", task("T-900", "F-01", 1, "planned", [["blocked_by", "[T-901]"]])],
          ["docs/tasks/T-901.md", task("T-901", "F-02", 1, "merging")],
        ]),
        NO_LANES,
      ),
      "T-900",
    );
    expect(got?.disposition).toBe("blocked");
    expect(got?.unmet?.[0]?.binding).toBe("open");
  });

  it("THREE BINDINGS, and the three are three sentences", () => {
    const got = dispositionOf(
      selectDispositions(
        withRoadmap([
          [
            "docs/tasks/T-900.md",
            task("T-900", "F-01", 1, "planned", [["blocked_by", "[T-901, T-902, T-999]"]]),
          ],
          ["docs/tasks/T-901.md", task("T-901", "F-02", 1, "planned")],
          ["docs/tasks/T-902.md", task("T-902", "F-03", 1, "parked")],
        ]),
        NO_LANES,
      ),
      "T-900",
    );
    expect(got?.disposition).toBe("blocked");
    expect(got?.unmet?.map((u) => [u.id, u.binding])).toEqual([
      ["T-901", "open"],
      ["T-902", "parked"],
      ["T-999", "missing"],
    ]);
    const reason = got?.reason ?? "";
    expect(reason).toContain("T-901 (planned)");
    expect(reason).toContain("T-902, which is PARKED");
    expect(reason).toContain("no card declares that id");
    expect(reason).toContain("defect in this card, not a reason to wait");
    // The three clauses are DISTINCT and ORDERED, which is what "do not
    // fold the three into blocked" means to a reader.
    expect(reason.indexOf("PARKED")).toBeGreaterThan(reason.indexOf("(planned)"));
    expect(reason.indexOf("defect in this card")).toBeGreaterThan(reason.indexOf("PARKED"));
  });

  it("a dangling blocker QUOTES the parser's own sentence into the RENDERED reason, near-miss and all", () => {
    // Criterion 6 says consume `dangling-reference` rather than
    // re-deriving it (T-057); criterion 4 says the reason is RENDERED as
    // text. Both, or neither is delivered.
    //
    // **THIS BODY'S PREVIOUS TITLE ASSERTED THE OPPOSITE OF WHAT IT
    // CHECKED, AND THAT IS WHY THE CARD WAS REJECTED.** It read "carries
    // the PARSER's own sentence, never a second one" while asserting only
    // that the FIELD held the message — the reason rendered a second
    // sentence and dropped the hint, probed at
    // `REASON_CONTAINS_PARSERSAID = false`. The field assertion is kept
    // (it is the consumption) and the RENDER is now asserted beside it.
    // "Never a second one" is gone from the title because it is still
    // false and should be: the board's own ruling clause — a dangling
    // blocker is a defect in the card, not a reason to wait — is what the
    // disposition/reason split owes the reader, and it sits beside the
    // quote rather than instead of it.
    // **AND THE FIXTURE MOVED, WHICH IS A SECOND DEFECT IN THIS PIN THAT
    // THE VERDICT DID NOT NAME.** It used to declare `T-900` and dangle
    // on `T-90` — and those are DIFFERENT id slots, because `idSlotKey`
    // strips only LEADING zeros, so no near miss was ever emitted. The
    // body could not have shown the hint reaching the reason even if the
    // render had existed. `T-01` beside a declared `T-001` is T-076's own
    // example and the pair the verdict probed with.
    const m = withRoadmap([
      ["docs/tasks/T-900.md", task("T-900", "F-01", 1, "planned", [["blocked_by", "[T-01]"]])],
      ["docs/tasks/T-001.md", task("T-001", "F-02", 1, "done")],
    ]);
    const emitted = m.issues.filter(
      (i): i is Extract<ParseIssue, { kind: "dangling-reference" }> =>
        i.kind === "dangling-reference" && i.field === "blocked_by",
    );
    expect(emitted.length).toBe(1);
    expect(emitted[0]?.nearMiss).toEqual(["T-001"]);
    const got = dispositionOf(selectDispositions(m, NO_LANES), "T-900");
    expect(got?.disposition).toBe("blocked");
    expect(got?.unmet?.[0]?.binding).toBe("missing");
    expect(got?.unmet?.[0]?.parserSaid).toBe(emitted[0]?.message);
    // ABSENT, never undefined-valued: a missing blocker has no status.
    expect("status" in (got?.unmet?.[0] ?? {})).toBe(false);
    // THE RENDER — the half that was missing. The whole message, verbatim
    // and attributed, so a reader can tell whose sentence it is.
    expect(got?.reason).toContain("The parser says:");
    const said = emitted[0]?.message ?? "";
    // NON-EMPTY FIRST: `toContain("")` is true of every string, so an
    // empty message would make the line below vacuous rather than red.
    expect(said.length).toBeGreaterThan(0);
    expect(got?.reason).toContain(said);
    // AND THE NEAR-MISS SPECIFICALLY REACHES THE READER, which is the
    // thing T-076 exists to deliver: the padding twin one line away.
    expect(got?.reason).toContain("'T-001' is declared and differs only in zero padding");
    // The board's own ruling clause is still there — beside the quote.
    expect(got?.reason).toContain("defect in this card, not a reason to wait");
  });

  it("the near-miss is the PARSER's and not a template — an id with no padding twin gets no such clause", () => {
    // THE DISCRIMINATING CONTROL for the body above. Asserting that a
    // reason contains "zero padding" proves nothing if this file composes
    // that clause itself: a template would print it for every dangling id.
    // `T-999` has no declared twin, so the parser emits no near-miss — and
    // the reason must quote a message that carries none.
    const m = withRoadmap([
      ["docs/tasks/T-900.md", task("T-900", "F-01", 1, "planned", [["blocked_by", "[T-999]"]])],
    ]);
    const emitted = m.issues.filter(
      (i) => i.kind === "dangling-reference" && i.field === "blocked_by",
    );
    expect(emitted.length).toBe(1);
    expect(emitted[0]?.message).not.toContain("zero padding");
    const got = dispositionOf(selectDispositions(m, NO_LANES), "T-900");
    expect(got?.disposition).toBe("blocked");
    expect(got?.reason).toContain("The parser says:");
    const said = emitted[0]?.message ?? "";
    // NON-EMPTY FIRST: `toContain("")` is true of every string, so an
    // empty message would make the line below vacuous rather than red.
    expect(said.length).toBeGreaterThan(0);
    expect(got?.reason).toContain(said);
    expect(got?.reason).not.toContain("zero padding");
  });

  it("a self-reference is dropped rather than blocking the card on itself", () => {
    expect(
      dispositionOf(
        selectDispositions(
          withRoadmap([
            ["docs/tasks/T-900.md", task("T-900", "F-01", 1, "planned", [["blocked_by", "[T-900]"]])],
          ]),
          NO_LANES,
        ),
        "T-900",
      )?.disposition,
    ).toBe("dispatchable");
  });
});

describe("the rest of the six, and the reason is always TEXT (criteria 1, 4, 7)", () => {
  it("not-topmost names the card above it in its own column", () => {
    const d = selectDispositions(
      withRoadmap([
        ["docs/tasks/T-900.md", task("T-900", "F-01", 1, "planned")],
        ["docs/tasks/T-901.md", task("T-901", "F-01", 2, "planned")],
      ]),
      NO_LANES,
    );
    expect(dispositionOf(d, "T-900")?.disposition).toBe("dispatchable");
    const behind = dispositionOf(d, "T-901");
    expect(behind?.disposition).toBe("not-topmost");
    expect(behind?.behind).toBe("T-900");
    expect(behind?.reason).toContain("T-900");
    expect(behind?.reason).toContain("sits above it");
  });

  it("a DONE card above does not make the one below not-topmost", () => {
    expect(
      dispositionOf(
        selectDispositions(
          withRoadmap([
            ["docs/tasks/T-900.md", task("T-900", "F-01", 1, "done")],
            ["docs/tasks/T-901.md", task("T-901", "F-01", 2, "planned")],
          ]),
          NO_LANES,
        ),
        "T-901",
      )?.disposition,
    ).toBe("dispatchable");
  });

  it("done and parked carry NO REASON AT ALL — progress acquires no scolding", () => {
    const d = selectDispositions(
      withRoadmap([
        ["docs/tasks/T-900.md", task("T-900", "F-01", 1, "done")],
        ["docs/tasks/T-901.md", task("T-901", "F-01", 2, "parked")],
        ["docs/tasks/T-902.md", task("T-902", "F-02", 1, "merging")],
        ["docs/tasks/T-903.md", task("T-903", "F-03", 1, "planned")],
      ]),
      NO_LANES,
    );
    for (const id of ["T-900", "T-901", "T-902"]) {
      const got = dispositionOf(d, id);
      expect(got?.disposition).toBe("not-applicable");
      expect(got?.reason).toBeUndefined();
      expect("reason" in (got ?? {})).toBe(false);
    }
    // POSITIVE CONTROL: a card that SHOULD carry one does. Without it,
    // "no reason" is equally explained by a derivation computing none.
    expect(dispositionOf(d, "T-903")?.reason).toContain("dispatchable");
  });

  it("a DIFFERENT input yields a DIFFERENT sentence, five ways", () => {
    // The negative control `T-111-s2` item 4 asks for: a derivation
    // returning one reason for everything satisfies "the reason names the
    // token" as readily as a correct one. Card ids are stripped before
    // comparison, so five distinct strings means five distinct SHAPES and
    // not five distinct ids.
    const roadmap4 = [
      "# R",
      "",
      "## Backbone",
      "- F-01: A — a",
      "- F-02: B — b",
      "- F-03: C — c",
      "- F-04: D — d",
      "",
    ].join("\n");
    const d = selectDispositions(
      project([
        ["docs/ROADMAP.md", roadmap4],
        ["docs/tasks/T-800.md", task("T-800", "F-01", 1, "planned", [["touches", "[alpha]"]])],
        ["docs/tasks/T-900.md", task("T-900", "F-02", 1, "planned", [["touches", "[alpha]"]])],
        ["docs/tasks/T-901.md", task("T-901", "F-03", 1, "planned", [["blocked_by", "[T-902]"]])],
        ["docs/tasks/T-902.md", task("T-902", "F-03", 2, "planned")],
        ["docs/tasks/T-903.md", task("T-903", "F-04", 1, "planned")],
        component("C-70", ["alpha"], ["app/src/shared/**"]),
      ]),
      reading({
        taskId: "T-800",
        state: "stampSkipped",
        lanes: [laneHold("T-800", "task/T-800-a")],
      }),
    );
    if (d.kind !== "derived") throw new Error("unreachable");
    expect([...d.cards.values()].map((c) => c.disposition).sort()).toEqual([
      "blocked",
      "dispatchable",
      "fenced",
      "not-applicable",
      "not-topmost",
    ]);
    const shapes = [...d.cards.values()]
      .map((c) => (c.reason ?? "").replace(/T-\d+/g, "T-X"))
      .filter((r) => r !== "");
    expect(shapes.length).toBe(5);
    expect(new Set(shapes).size).toBe(5);
  });

  it("the six values are closed", () => {
    expect([...DISPOSITIONS]).toEqual([
      "dispatchable",
      "blocked",
      "fenced",
      "not-topmost",
      "at-ceiling",
      "not-applicable",
    ]);
  });

  it("the column order is an INPUT, so the derivation is not board-local", () => {
    // THE PORTABILITY PIN. `selectDispositions` is a pure function of the
    // parsed model, the lane reader's answer and a column ORDER — and the
    // order is the only board-shaped thing it takes. A consumer with its
    // own ordering (a terminal session assembling a dispatch, say) passes
    // its own map and gets its own answer; nothing about the frontier is
    // reachable only from a React tree. This body is what makes that
    // claim checkable rather than a sentence in a doc comment.
    const m = withRoadmap([
      ["docs/tasks/T-900.md", task("T-900", "F-01", 1, "planned")],
      ["docs/tasks/T-901.md", task("T-901", "F-01", 2, "planned")],
    ]);
    // The board's own order: T-900 on top, so T-901 is behind it.
    expect(dispositionOf(selectDispositions(m, NO_LANES), "T-901")?.disposition).toBe(
      "not-topmost",
    );
    // A DIFFERENT order, supplied by a caller that is not the board.
    const inverted: ReadonlyMap<string, TopmostCard> = new Map([
      ["T-900", { id: "T-901", file: "docs/tasks/T-901.md", status: "planned" as TaskStatus }],
      ["T-901", { id: "T-901", file: "docs/tasks/T-901.md", status: "planned" as TaskStatus }],
    ]);
    const flipped = selectDispositions(m, NO_LANES, inverted);
    expect(dispositionOf(flipped, "T-900")?.disposition).toBe("not-topmost");
    expect(dispositionOf(flipped, "T-901")?.disposition).toBe("dispatchable");
  });

  it("topmostUndoneByColumn is the board's order, and it is the DEFAULT", () => {
    const m = withRoadmap([
      ["docs/tasks/T-900.md", task("T-900", "F-01", 1, "done")],
      ["docs/tasks/T-901.md", task("T-901", "F-01", 2, "planned")],
      ["docs/tasks/T-902.md", task("T-902", "F-02", 1, "planned")],
    ]);
    const order = topmostUndoneByColumn(m);
    expect(order.get("T-901")?.id).toBe("T-901");
    expect(order.get("T-900")?.id).toBe("T-901");
    expect(order.get("T-902")?.id).toBe("T-902");
    // Passing the default explicitly is the same answer as omitting it —
    // which is what "the default IS the board's order" means.
    const a = selectDispositions(m, NO_LANES);
    const b = selectDispositions(m, NO_LANES, order);
    if (a.kind !== "derived" || b.kind !== "derived") throw new Error("unreachable");
    expect([...a.cards.values()]).toEqual([...b.cards.values()]);
  });
});

describe("THE LIVE BOARD — the frontier run on this repository (verification line)", () => {
  it("every card gets one of the six, and every applicable one carries a reason", () => {
    const model = liveBoard();
    const d = selectDispositions(model, NO_LANES);
    if (d.kind !== "derived") throw new Error("unreachable");
    const ids = new Set(model.tasks.map((t) => t.id).filter((id) => id !== undefined));
    expect(d.cards.size).toBe(ids.size);
    const statusOf = new Map(
      model.tasks.filter((t) => t.id !== undefined).map((t) => [t.id as string, t.status]),
    );
    for (const card of d.cards.values()) {
      expect(DISPOSITIONS).toContain(card.disposition);
      if (NO_REASON_STATUSES.has(statusOf.get(card.taskId) ?? "planned")) {
        expect(card.reason).toBeUndefined();
      } else {
        expect((card.reason ?? "").length).toBeGreaterThan(0);
      }
    }
  });

  it("LANDED BLOCKERS ARE DECLARED HERE, and the derivation asks their status rather than the field", () => {
    // **THE WORD THIS BODY USED TO CARRY IS RETRACTED, AND THE
    // ASSERTION IS NOT.** Its title read "THE DECAY IS REAL HERE", its
    // comment said "a corpus with no stale entries", and its variable was
    // `const stale`. *Decay* and *stale* are `T-111-s4`'s exact words and
    // `T-136` was REJECTED on main under them: `blocked_by: [T-104]` on a
    // card whose T-104 has landed is not stale, it is HISTORICALLY
    // ACCURATE, and it is the only record of why the work was sequenced
    // that way — four declarations cleared under the retracted argument
    // were restored byte-identical. The retraction reached the card
    // prose, `T-111-s6` and `board-model.ts`'s own doc comment and
    // stopped one file short of here, so this suite went on shipping the
    // premise three files from the module that disowns it. A test title
    // is shipped text.
    //
    // TWO HALVES, and the second is what makes the first mean anything.
    //
    // (a) POSITIVE CONTROL — this board really does carry `blocked_by`
    //     entries naming cards that are `done`. Without it the property
    //     below is vacuous: a corpus carrying no such entry satisfies "no
    //     card is blocked by a done card" for free.
    // (b) THE PROPERTY — no card the frontier calls `blocked` is blocked
    //     by an id whose card is `done`. The FIELD still names those
    //     blockers on every one of those cards, correctly and
    //     permanently; the derived answer resolves each id instead of
    //     reading the field for a verdict it does not hold.
    const model = liveBoard();
    const statusOf = new Map(
      model.tasks.filter((t) => t.id !== undefined).map((t) => [t.id as string, t.status]),
    );
    const landed = model.tasks.flatMap((t) =>
      t.blockedBy.filter((b) => statusOf.get(b) === "done"),
    );
    expect(landed.length).toBeGreaterThan(0);

    const d = selectDispositions(model, NO_LANES);
    if (d.kind !== "derived") throw new Error("unreachable");
    for (const card of d.cards.values()) {
      for (const u of card.unmet ?? []) {
        expect(statusOf.get(u.id)).not.toBe("done");
      }
    }
  });

  it("no live card names a blocker that does not exist — so criterion 6 needs a fixture", () => {
    // Measured rather than assumed. `T-111-s2` item 6 claims this case
    // "CANNOT be driven from the live board", and that claim is a
    // function of a tree — so it is re-derived at whatever ref this runs
    // on, and it reds the day somebody drafts a card with a typo'd
    // blocker, which is the day the claim stops being true.
    expect(
      liveBoard().issues.filter(
        (i) => i.kind === "dangling-reference" && i.field === "blocked_by",
      ),
    ).toEqual([]);
  });
});

describe("selectBoard — the assignment flag (T-169, @human's D5 ruling)", () => {
  const stamped = (id: string, extras: Field[]): string =>
    task(id, "F-01", 1, "done", [["review", "independent"], ...extras]);

  it("a mismatched builder pair reaches the card, with BOTH values", () => {
    const board = selectBoard(
      withRoadmap([
        [
          path("T-010"),
          stamped("T-010", [
            ["builder", "claude-opus-5@subagent"],
            ["built_by", "codex/gpt-5.2 @S3"],
          ]),
        ],
      ]),
    );
    const card = board.columns[0]?.cards[0];
    expect(card?.assignment).toEqual([
      {
        role: "builder",
        assignedField: "builder",
        executedField: "built_by",
        assigned: "claude-opus-5@subagent",
        executed: "codex/gpt-5.2 @S3",
      },
    ]);
    // And it reaches the card the way a parse error does — the same
    // `issues` list the face's mark and the panel's verbatim section
    // already read, so the flag needs no second channel to be seen.
    expect(card?.issues?.some((m) => m.includes("the fields disagree"))).toBe(true);
  });

  it("a matching pair and a same-model-different-vehicle pair do NOT flag", () => {
    const board = selectBoard(
      withRoadmap([
        [
          path("T-010"),
          stamped("T-010", [
            ["builder", "claude-opus-5"],
            ["built_by", "claude-opus-5"],
          ]),
        ],
        [
          path("T-011"),
          stamped("T-011", [
            ["builder", "claude-opus-5@subagent"],
            ["built_by", "claude-opus-5 @T-011 — code commit abc1234"],
            ["verifier", "claude-fable-5 @fresh"],
            ["verified_by", "claude-fable-5 @T-011-verify"],
          ]),
        ],
      ]),
    );
    const cards = board.columns[0]?.cards ?? [];
    expect(cards.map((c) => c.id)).toEqual(["T-010", "T-011"]);
    // ABSENT, never [] — the T-017 discipline, so a consumer asking
    // `card.assignment !== undefined` is asking exactly "is this flagged".
    expect(cards.map((c) => c.assignment)).toEqual([undefined, undefined]);
  });

  it("assignmentByFile joins on the file, and says nothing about a clean one", () => {
    const model = withRoadmap([
      [
        path("T-010"),
        stamped("T-010", [
          ["builder", "claude-opus-5"],
          ["built_by", "codex/gpt-5.2 @S3"],
          ["verifier", "claude-opus-5"],
          ["verified_by", "codex/gpt-5.6"],
        ]),
      ],
      [path("T-011"), task("T-011", "F-01", 2)],
    ]);
    const index = assignmentByFile(model.issues);
    expect(index.get(path("T-010"))?.map((e) => e.role)).toEqual(["builder", "verifier"]);
    expect(index.get(path("T-011"))).toBeUndefined();
  });

  it("THE LIVE BOARD CENSUSES CLEAN — zero cards disagree with their own assignment", () => {
    // Criterion 3, derived at whatever ref this runs on and never
    // assumed. A failure prints the card and both values, so the reader
    // learns WHICH card and WHAT it says without a second command.
    const flagged: string[] = [];
    for (const column of selectBoard(liveBoard()).columns) {
      for (const card of [...column.cards, ...column.ghosts, ...column.parked]) {
        for (const entry of card.assignment ?? []) {
          flagged.push(
            `${card.id ?? card.file}: ${entry.assignedField}=${entry.assigned} / ` +
              `${entry.executedField}=${entry.executed}`,
          );
        }
      }
    }
    expect(flagged).toEqual([]);
  });

  it("and that census is not vacuous — the live board really does stamp both halves", () => {
    let constrained = 0;
    for (const t of liveBoard().tasks) {
      if (t.builder !== undefined && t.builtBy !== undefined) constrained++;
      if (t.verifier !== undefined && t.verifiedBy !== undefined) constrained++;
    }
    expect(constrained).toBeGreaterThan(100);
  });
});
