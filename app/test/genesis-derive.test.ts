import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  applySnapshot,
  emptyState,
  type DocsFilePayload,
  type DocsModelState,
} from "../src/lib/docs-model";
import {
  BANKING_MAP,
  countAssumptions,
  deriveGenesis,
  EMPTY_CHANGE_LOG,
  nextLineForStage,
  observeDocsChange,
  splitSections,
  stripHtmlComments,
  WRITING_WINDOW_MS,
  type GenesisChangeLog,
} from "../src/genesis/genesis-derive";

// T-024 criterion 1: the pure derivation, unit-tested against fixture
// trees at empty / stage-4 / complete. The complete tree is T-023's
// dry-run tree ("streak", commit b18a33c) harvested byte-faithful from
// the executor's surviving scratch tree (T-023-s2); the stage-4 tree is
// the transcript's kill point, reconstructed from the T-023 notes
// (fixture provenance in T-024's implementation notes). Time enters
// derivation only as the injected nowMs — every writing-state assertion
// here is wall-clock-free by construction.

const TEST_DIR = fileURLToPath(new URL(".", import.meta.url));
const REPO_ROOT = resolve(TEST_DIR, "../..");
const FIXTURES = join(TEST_DIR, "fixtures/genesis");

function walk(dir: string, prefix: string): DocsFilePayload[] {
  const out: DocsFilePayload[] = [];
  for (const name of readdirSync(dir).sort()) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      out.push(...walk(full, `${prefix}/${name}`));
    } else {
      out.push({ path: `${prefix}/${name}`, content: readFileSync(full, "utf8") });
    }
  }
  return out;
}

const fixtureTree = (name: string): DocsFilePayload[] =>
  walk(join(FIXTURES, name, "docs"), "docs");

let seq = 0;
function state(files: DocsFilePayload[], prev?: DocsModelState): DocsModelState {
  seq += 1;
  return applySnapshot(prev ?? emptyState(), {
    seq,
    projectDir: "/genesis-fixture",
    generatedAtMs: seq,
    files,
  });
}

/** Baseline log for a state (primed, nothing stamped). */
const baseline = (docs: DocsModelState, atMs = 0): GenesisChangeLog =>
  observeDocsChange(EMPTY_CHANGE_LOG, docs, atMs);

const derive = (docs: DocsModelState, log: GenesisChangeLog, nowMs: number) =>
  deriveGenesis(docs, log, nowMs);

const artifactByPath = (model: ReturnType<typeof deriveGenesis>, path: string) =>
  model.artifacts.find((a) => a.path === path);

describe("the banking map transcription stays in sync with method/ (CONVENTIONS gotcha)", () => {
  it("every cell of the 9-row table matches plan-interview.md verbatim", () => {
    const md = readFileSync(join(REPO_ROOT, "method/interview/plan-interview.md"), "utf8");
    const rows = md
      .split("\n")
      .filter((line) => /^\|\s*\d+\s*\|/.test(line))
      .map((line) => {
        const cells = line.split("|").map((c) => c.trim());
        return cells.slice(1, -1); // drop the empty edges
      });
    expect(rows).toHaveLength(9);
    expect(BANKING_MAP).toHaveLength(9);
    rows.forEach((cells, i) => {
      expect(cells).toHaveLength(3);
      expect(BANKING_MAP[i]).toEqual({
        stage: Number(cells[0]),
        step: cells[1],
        banks: cells[2],
      });
    });
    // Stages are 0..8, unique and contiguous — a program can index by stage.
    expect(BANKING_MAP.map((r) => r.stage)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  });
});

describe("complete tree (streak, the harvested T-023 dry-run)", () => {
  const docs = state(fixtureTree("streak"));
  const log = baseline(docs);
  const model = derive(docs, log, 10_000);

  it("counts the nine docs markdown files", () => {
    expect(model.filesWritten).toBe(9);
  });

  it("approximate stage is 8 (decomposition artifacts exist)", () => {
    expect(model.approxStage).toBe(8);
    expect(model.stageStep).toBe("decomposition");
    expect(model.stageLine).toBe("stage ~8 · decomposition");
    expect(model.nextLine).toBe("Milestone 1 decomposed — the board is live.");
  });

  it("north star card: first Vision sentence + the three chips", () => {
    expect(model.northStar).not.toBeNull();
    expect(model.northStar?.title).toBe(
      "A habit tracker that lives where its user already is: the terminal.",
    );
    expect(model.northStar?.chips.map((c) => c.kind)).toEqual([
      "person",
      "success",
      "non-goal",
    ]);
    for (const chip of model.northStar?.chips ?? []) {
      expect(chip.text.length).toBeGreaterThan(0);
      expect(chip.text.length).toBeLessThanOrEqual(45); // 44 + ellipsis
    }
    expect(model.northStar?.chips[0]?.text).toContain("One concrete user");
  });

  it("backbone: the four parsed features as built entries, nothing forming", () => {
    expect(model.backbone).toEqual([
      { kind: "built", id: "F-01", name: "Log" },
      { kind: "built", id: "F-02", name: "Week view" },
      { kind: "built", id: "F-03", name: "Habit management" },
      { kind: "built", id: "F-04", name: "History & stats" },
    ]);
  });

  it("artifact rows in banking-map order, all written, comment-aware [?] counts", () => {
    expect(model.artifacts.map((a) => [a.path, a.status, a.assumptions])).toEqual([
      ["docs/STATE.md", "written", 2],
      ["docs/NORTH_STAR.md", "written", 4], // 5 raw − 1 inside the Q4 comment
      ["docs/decisions/001-stack.md", "written", 0],
      ["docs/CONVENTIONS.md", "written", 1],
      ["docs/ROADMAP.md", "written", 0],
      ["docs/tasks/T-001-store-and-done.md", "written", 0],
      ["docs/tasks/T-002-week-view.md", "written", 0],
      ["docs/tasks/T-003-malformed-store-resilience.md", "written", 0],
      ["docs/ARCHITECTURE.md", "written", 0],
    ]);
  });

  it("deterministic: same inputs, deep-equal output", () => {
    expect(derive(docs, log, 10_000)).toEqual(model);
  });
});

describe("stage-4 tree (the transcript's kill point)", () => {
  const docs = state(fixtureTree("streak-stage4"));
  const log = baseline(docs);
  const model = derive(docs, log, 10_000);

  it("five files, approximate stage 4", () => {
    expect(model.filesWritten).toBe(5);
    expect(model.approxStage).toBe(4);
    expect(model.stageLine).toBe("stage ~4 · constraints");
  });

  it("the footer names the banking map's next steps", () => {
    expect(model.nextLine).toBe("Next: stack & why, then the riskiest assumption.");
  });

  it("template-empty awareness: scaffolded ROADMAP/ARCHITECTURE parse to no backbone, riskiest stays unbanked", () => {
    // The verbatim template backbone is comment-only: zero features
    // (T-023's stage-0 proof), so nothing reads as stage 7.
    expect(model.backbone).toEqual([]);
    // Riskiest assumption is the template comment — stage 6 does not exist.
    expect(model.approxStage).toBe(4);
  });

  it("artifact rows: decisions and tasks still expected, the rest written", () => {
    expect(model.artifacts.map((a) => [a.path, a.status, a.assumptions])).toEqual([
      ["docs/STATE.md", "written", 2],
      ["docs/NORTH_STAR.md", "written", 4],
      ["docs/decisions/001-stack.md", "expected", 0],
      ["docs/CONVENTIONS.md", "written", 0], // template — seeded at stage 5
      ["docs/ROADMAP.md", "written", 0],
      ["docs/tasks/T-*.md", "expected", 0],
      ["docs/ARCHITECTURE.md", "written", 0],
    ]);
  });
});

describe("empty tree", () => {
  const docs = state([]);
  const log = baseline(docs);
  const model = derive(docs, log, 0);

  it("nothing on disk: stage null, all artifacts expected, card absent", () => {
    expect(model.filesWritten).toBe(0);
    expect(model.approxStage).toBeNull();
    expect(model.stageStep).toBeNull();
    expect(model.stageLine).toBe("stage —");
    expect(model.northStar).toBeNull();
    expect(model.backbone).toEqual([]);
    expect(model.nextLine).toBe("Next: scaffold, then problem & person.");
    expect(model.artifacts.map((a) => [a.path, a.status])).toEqual([
      ["docs/STATE.md", "expected"],
      ["docs/NORTH_STAR.md", "expected"],
      ["docs/decisions/001-stack.md", "expected"],
      ["docs/CONVENTIONS.md", "expected"],
      ["docs/ROADMAP.md", "expected"],
      ["docs/tasks/T-*.md", "expected"],
      ["docs/ARCHITECTURE.md", "expected"],
    ]);
    expect(model.nextTransitionMs).toBeNull();
  });
});

describe("the writing window (injected clock — zero wall-clock flake)", () => {
  const first = state(fixtureTree("streak"));
  const log1 = observeDocsChange(EMPTY_CHANGE_LOG, first, 100);

  it("the baseline snapshot never reads as writing (no false pulse wall)", () => {
    const model = derive(first, log1, 100);
    expect(model.artifacts.every((a) => a.status === "written")).toBe(true);
    expect(model.nextTransitionMs).toBeNull();
  });

  const changed = fixtureTree("streak").map((f) =>
    f.path === "docs/NORTH_STAR.md" ? { ...f, content: `${f.content}\nOne more line.` } : f,
  );
  const second = state(changed, first);
  const log2 = observeDocsChange(log1, second, 1_000);

  it("a changed file is writing inside the window and written after it", () => {
    const during = derive(second, log2, 1_000);
    expect(artifactByPath(during, "docs/NORTH_STAR.md")?.status).toBe("writing");
    expect(artifactByPath(during, "docs/STATE.md")?.status).toBe("written");
    expect(during.nextTransitionMs).toBe(WRITING_WINDOW_MS);

    const edge = derive(second, log2, 1_000 + WRITING_WINDOW_MS - 1);
    expect(artifactByPath(edge, "docs/NORTH_STAR.md")?.status).toBe("writing");
    expect(edge.nextTransitionMs).toBe(1);

    const after = derive(second, log2, 1_000 + WRITING_WINDOW_MS);
    expect(artifactByPath(after, "docs/NORTH_STAR.md")?.status).toBe("written");
    expect(after.nextTransitionMs).toBeNull();
  });

  it("a NEW file stamps as writing (the design's constraints.md moment)", () => {
    const withNew = state(
      [...fixtureTree("streak"), { path: "docs/decisions/002-extra.md", content: "# ADR-002\n" }],
      second,
    );
    const log3 = observeDocsChange(log2, withNew, 20_000);
    const model = derive(withNew, log3, 20_000);
    expect(artifactByPath(model, "docs/decisions/002-extra.md")?.status).toBe("writing");
    expect(artifactByPath(model, "docs/decisions/001-stack.md")?.status).toBe("written");
  });

  it("a ROADMAP mid-write grows a forming backbone card with the next id", () => {
    const roadmapTouched = fixtureTree("streak").map((f) =>
      f.path === "docs/ROADMAP.md" ? { ...f, content: `${f.content}\n` } : f,
    );
    const third = state(roadmapTouched, second);
    const log3 = observeDocsChange(log2, third, 50_000);
    const model = derive(third, log3, 50_000);
    // Index access, not .at(-1): the app's tsconfig lib predates es2022.
    expect(model.backbone[model.backbone.length - 1]).toEqual({ kind: "forming", id: "F-05" });
    // After the window it collapses back to the parsed features.
    const later = derive(third, log3, 50_000 + WRITING_WINDOW_MS);
    expect(later.backbone.every((b) => b.kind === "built")).toBe(true);
  });
});

describe("observeDocsChange semantics", () => {
  const docs = state(fixtureTree("streak"));

  it("returns identity for the pre-project empty state and observed/stale seqs", () => {
    expect(observeDocsChange(EMPTY_CHANGE_LOG, emptyState(), 5)).toBe(EMPTY_CHANGE_LOG);
    const log = observeDocsChange(EMPTY_CHANGE_LOG, docs, 5);
    expect(observeDocsChange(log, docs, 99)).toBe(log); // same seq: no re-stamp
  });

  it("a project switch re-baselines instead of stamping every path", () => {
    const log = observeDocsChange(EMPTY_CHANGE_LOG, docs, 5);
    seq += 1;
    const other = applySnapshot(emptyState(), {
      seq,
      projectDir: "/another-project",
      generatedAtMs: seq,
      files: fixtureTree("streak-stage4"),
    });
    const switched = observeDocsChange(log, other, 42);
    expect(switched.projectDir).toBe("/another-project");
    expect(switched.changedAtMs.size).toBe(0); // baseline, nothing stamped
  });
});

describe("north-star parsing is absent-tolerant and comment-aware", () => {
  const ns = (content: string): DocsModelState =>
    state([{ path: "docs/NORTH_STAR.md", content }]);

  it("vision without the chip sections yields a title and no chips", () => {
    const model = derive(ns("# North star\n\n## Vision\nShip it. More prose.\n"), EMPTY_CHANGE_LOG, 0);
    expect(model.northStar).toEqual({ title: "Ship it.", chips: [] });
  });

  it("a template-comment-only section does not exist (resume-rule reading)", () => {
    const model = derive(
      ns("# North star\n\n## Vision\n<!-- One paragraph. -->\n\n## Users\n<!-- Who. -->\n"),
      EMPTY_CHANGE_LOG,
      0,
    );
    expect(model.northStar).toBeNull();
    expect(model.approxStage).toBe(0); // files exist, nothing banked
  });

  it("stripHtmlComments tolerates an unclosed comment (mid-write)", () => {
    expect(stripHtmlComments("keep <!-- torn away")).toBe("keep ");
    expect(countAssumptions("a [?] b <!-- [?] --> c [?]")).toBe(2);
  });

  it("splitSections keeps the last duplicate heading and ignores preamble", () => {
    const sections = splitSections("intro\n## A\none\n## a\ntwo\n");
    expect(sections.get("a")?.trim()).toBe("two"); // bodies stay raw; trimming is sectionText's
  });

  it("hostile content derives without throwing and stays inert text", () => {
    const hostile = `# North star\n\n## Vision\n<img src=x onerror=alert(1)>‮gnp.evil‬ ${"A".repeat(10_000)}. More.\n\n## Users\n- <script>alert(2)</script> person.\n`;
    const model = derive(ns(hostile), EMPTY_CHANGE_LOG, 0);
    expect(model.northStar?.title).toContain("<img src=x onerror=alert(1)>");
    expect(model.northStar?.chips[0]?.text).toContain("<script>");
  });
});

describe("the footer next-line table (banking-map steps)", () => {
  it("names the one or two upcoming steps per stage", () => {
    expect(nextLineForStage(null)).toBe("Next: scaffold, then problem & person.");
    expect(nextLineForStage(0)).toBe("Next: problem & person, then success.");
    expect(nextLineForStage(1)).toBe("Next: success, then non-goals.");
    expect(nextLineForStage(2)).toBe("Next: non-goals, then constraints.");
    expect(nextLineForStage(3)).toBe("Next: constraints, then stack & why.");
    expect(nextLineForStage(4)).toBe("Next: stack & why, then the riskiest assumption.");
    expect(nextLineForStage(5)).toBe("Next: the riskiest assumption, then first slice.");
    expect(nextLineForStage(6)).toBe(
      "Next: first slice, then decomposition — cards rain into the board.",
    );
    expect(nextLineForStage(7)).toBe("Next: decomposition — cards rain into the board.");
    expect(nextLineForStage(8)).toBe("Milestone 1 decomposed — the board is live.");
  });
});
