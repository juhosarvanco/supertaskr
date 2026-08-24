import { describe, expect, it } from "vitest";
import { parseProjectFromFiles, type ProjectParseResult } from "@nputer/parser/pure";
import {
  issuesByFile,
  selectBoard,
  shortModelName,
  statusVisual,
  UNMAPPED_KEY,
  type BoardColumn,
  type BoardModel,
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

  it("a flagged card carries its own messages; a clean card omits the key entirely", () => {
    const board = selectBoard(model);
    expect(cardById(board, "T-410")?.issues?.length).toBe(2);
    expect(cardById(board, "T-411")?.issues?.[0]).toContain("F-99");
    // ABSENT, never [] — the aliasedWith/rejectedCount discipline, so
    // `toStrictEqual` and `in` agree with the doc comment.
    const clean = cardById(board, "T-412");
    expect(clean?.issues).toBeUndefined();
    expect("issues" in (clean ?? {})).toBe(false);
  });

  it("the join adds a surface and never a filter — nothing is dropped from the model", () => {
    // The header's aggregate count reads model.issues directly; this is
    // the selector-level half of that pin.
    const board = selectBoard(model);
    const marked = board.columns
      .flatMap((c) => c.cards)
      .flatMap((c) => c.issues ?? []).length;
    expect(model.issues.length).toBe(3);
    expect(marked).toBe(3);
    expect(board.columns.flatMap((c) => c.cards).length).toBe(3);
  });
});
