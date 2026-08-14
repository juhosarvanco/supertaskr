import { describe, expect, it } from "vitest";
import { parseProjectFromFiles, type ProjectParseResult } from "@nputer/parser/pure";
import { selectBoard, shortModelName, statusVisual } from "../src/lib/board-model";

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
    expect(f3?.parkedCount).toBe(0);
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

  it("parked tasks collapse into a per-feature count (feature-less parked count under unmapped)", () => {
    const parked = (id: string, title: string, feature?: string): string =>
      fm(
        ["id", id],
        ["title", title],
        ...(feature === undefined ? [] : ([["feature", feature]] as Field[])),
        ["status", "parked"],
      );
    const board = selectBoard(
      withRoadmap([
        [path("T-040-parked-a"), parked("T-040", "Parked A", "F-01")],
        [path("T-041-parked-b"), parked("T-041", "Parked B", "F-01")],
        [path("T-042-parked-c"), parked("T-042", "Parked C")],
      ]),
    );
    expect(board.columns[0]?.parkedCount).toBe(2);
    expect(board.columns[0]?.cards).toEqual([]);
    expect(board.columns[0]?.ghosts).toEqual([]);
    const last = board.columns[board.columns.length - 1];
    expect(last?.key).toBe("unmapped");
    expect(last?.parkedCount).toBe(1);
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
    const board = selectBoard(
      project([
        ["docs/ROADMAP.md", "# R\n\n## Backbone\n"],
        [path("T-011"), task("T-011", "F-01", 1)],
      ]),
    );
    expect(board.empty).toBe(false);
    expect(board.columns.map((c) => c.key)).toEqual(["unmapped"]);
    expect(board.columns[0]?.cards.map((c) => c.id)).toEqual(["T-011"]);
  });
});
