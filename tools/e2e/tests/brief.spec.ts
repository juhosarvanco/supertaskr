import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { parse as parseYaml } from "yaml";
import { repoRoot } from "../preflight";
import { NO_BACKGROUND_MAINTENANCE, removeGitFixture } from "./git-fixture";
import { conventionsText, liveTaskCards, trackedFiles } from "../scripts/docs-scan.mjs";
import {
  DERIVERS,
  EXIT,
  architectureText,
  assembleBrief,
  boardCensus,
  ceremonyRows,
  components,
  contractRows,
  context,
  docsNamed,
  fenceLedger,
  fenceOverlaps,
  fieldList,
  frontmatterFields,
  insideRepository,
  integrationRefCandidates,
  laneSpellings,
  laneWorktrees,
  liveProv,
  mainWorktree,
  namedDisciplines,
  note,
  packageCommands,
  parseWorktreePorcelain,
  readAdditions,
  readDoc,
  readSubtractions,
  render,
  resolveIntegrationRef,
  roleText,
  slugMapFromFields,
  slugMapFromProse,
  slugsSharingComponents,
  standingGates,
  stateReport,
  treeProv,
  unstampedLines,
  value,
  worktreePorcelain,
} from "../scripts/dispatch-brief.mjs";

/**
 * THE BRIEF COMMAND (T-133) — no browser.
 *
 * `method/roles/orchestrator.md` already requires a brief "assembled to
 * the contract in roles/executor.md — every row, from the sources that
 * row names", and every dispatch brief written on 2026-08-25 broke it by
 * filling rows from memory. The prose was quoted and did not bind, so the
 * remedy is a command; this file is what stops the command drifting back
 * into a second copy of the contract.
 *
 * ── WHAT A PIN CAN AND CANNOT SHOW HERE (T-080-s1, stated rather than
 *    dodged) ─────────────────────────────────────────────────────────
 * The criterion asks that pins FAIL against the pre-fix tree. On this
 * card the pre-fix tree has no command at all, so every body below would
 * fail to IMPORT rather than fail on a property — which is a green that
 * proves nothing about the behaviour. The honest measurement is therefore
 * the POISON DRILL recorded in the card's implementation notes: each
 * mutant moves the PRODUCER (this module, or the document it reads) and
 * never an assertion, and the kill is measured against the WHOLE suite
 * rather than asserted. Every body here says which mutant kills it.
 *
 * ── HOW TO READ A FAILURE ────────────────────────────────────────────
 * Two sides that share no constant: the derivation computes on one, the
 * document is read on the other. A red means they disagree and the
 * message names both. It does not say which is wrong — a figure this
 * command emits is a measurement at a ref, so check the ref before
 * editing anything.
 */

const CLI = path.join(repoRoot, "tools", "e2e", "scripts", "brief.mjs");

/**
 * A worktree listing in git's own porcelain shape, built here rather than
 * created on disk. THE POINT OF THE FIXTURE IS THE SECOND AND THIRD
 * ENTRIES: a DETACHED worktree at a lane-shaped path, and a detached one
 * named after a card. Both existed on this repository while this card was
 * being built — `nputer-T-132-verify` at dispatch and `nputer-T-127-verify`
 * an hour later — and a path filter counts both as lanes holding fences
 * that nobody holds.
 */
const PORCELAIN_FIXTURE = [
  "worktree /Users/x/nputer",
  "HEAD 1111111111111111111111111111111111111111",
  "branch refs/heads/main",
  "",
  "worktree /Users/x/nputer-T-901",
  "HEAD 2222222222222222222222222222222222222222",
  "branch refs/heads/task/T-901-a-real-lane",
  "",
  "worktree /Users/x/nputer-T-902",
  "HEAD 3333333333333333333333333333333333333333",
  "detached",
  "",
  "worktree /Users/x/nputer-T-901-verify",
  "HEAD 2222222222222222222222222222222222222222",
  "detached",
  "",
  "worktree /Users/x/nputer-T-903",
  "HEAD 4444444444444444444444444444444444444444",
  "branch refs/heads/not-a-task-branch",
  "",
].join("\n");

/** @see the drill affordance in dispatch-brief.mjs — every read takes a root. */
function conventions(): string {
  return conventionsText();
}

test("the ROW SET is read from the role file, and the coverage runs both ways", () => {
  const md = roleText("executor");
  const rows = contractRows(md);
  expect(rows.length).toBeGreaterThan(0);

  // SHAPE FIVE's remedy, applied to a tool whose expectations are parsed
  // rather than written. Without both directions, deleting a deriver
  // deletes its own failure and adding one invents a row.
  const labels = rows.map((r) => r.key);
  const derivers = [...DERIVERS.keys()];
  const unanswered = labels.filter((k) => !derivers.includes(k));
  const orphaned = derivers.filter((k) => !labels.includes(k));
  expect(
    unanswered,
    `the contract table carries rows this command cannot assemble: ${unanswered.join(", ")}. ` +
      "A row with no deriver is a row a brief fills by guessing, which is the defect this card exists for.",
  ).toEqual([]);
  expect(
    orphaned,
    `this command derives rows the table no longer carries: ${orphaned.join(", ")}. A deriver ` +
      "with no row is a SECOND row set, which is exactly what reading the table was meant to prevent.",
  ).toEqual([]);

  // Every row names a source, and no row's source is this file.
  for (const row of rows) {
    expect(row.source.length, `row ${row.n} names no source`).toBeGreaterThan(0);
  }
});

test("the row set FOLLOWS the document — it is not pinned here", () => {
  const md = roleText("executor");
  const before = contractRows(md);
  const last = before[before.length - 1];
  expect(last).toBeDefined();

  // ONE SIDE ONLY: the DOCUMENT moves, in memory. Nothing in the module
  // is touched. A parser that pinned the row set would be green here and
  // green with the table rewritten — indistinguishable from one that reads.
  const target = `| ${last?.n} | ${last?.carries}`;
  expect(md).toContain(target);
  const dropped = md.split("\n").filter((l) => !l.trim().startsWith(target)).join("\n");
  expect(dropped).not.toBe(md);
  const after = contractRows(dropped);
  expect(
    after.length,
    "the parsed row set did not follow the document, so it is not reading it",
  ).toBe(before.length - 1);

  // And a row this command can no longer answer is REPORTED, never dropped.
  const renamed = md.replace(`**${last?.label}**`, "**A row nobody derives**");
  expect(renamed).not.toBe(md);
  const renamedRows = contractRows(renamed);
  expect(renamedRows.map((r) => r.key)).toContain("a row nobody derives");
});

test("a contract table this command cannot read THROWS, never yields an empty contract", () => {
  const md = roleText("executor");
  // POSITIVE CONTROL. Without it, "it throws" is satisfied equally by a
  // reader that refuses this table and one that refuses every table.
  expect(() => contractRows(md)).not.toThrow();

  expect(() => contractRows(md.replace("| Assembled from |", "| Where from |"))).toThrow(
    /expected exactly one/,
  );
  const rows = contractRows(md);
  const second = rows[1];
  expect(second).toBeDefined();
  const renumbered = md.replace(`| ${second?.n} | **${second?.label}**`, `| 9 | **${second?.label}**`);
  expect(renumbered).not.toBe(md);
  expect(() => contractRows(renumbered)).toThrow(/numbered consecutively/);
});

/**
 * ROW 3 (T-112-s3) — the row the contract table itself gives as the worked
 * example of *"a brief that is internally inconsistent while every row is
 * individually faithful to its source"*. The adapter's list is addressed to
 * every seat and the role file's reading step to one, so the source column
 * says the step is APPLIED to that list rather than printed beside it.
 *
 * Printed beside — which is what this command did until this card — every
 * brief it ever emitted told an executor to read the one document its role
 * file subtracts, and named nowhere the one that file requires.
 *
 * ── HOW THESE THREE BODIES SPLIT ─────────────────────────────────────
 * The first is the property; the second is the positive control that keeps
 * the derivation from being a constant (the card's third criterion); the
 * third drives the reader against the OTHER role file in this method, whose
 * subtraction is spelled differently and whose second *"do NOT read"*
 * sentence names no document at all.
 */

/** The document list off one row-3 line, with the stamp cut away. */
function readFirstList(line: string, after: string): string[] {
  const tail = line.split(after)[1] ?? "";
  return tail
    .replace(/ {2}<- .*$/, "")
    .trim()
    .split(" ")
    .filter((d) => d !== "");
}

const APPLIED = "READ FIRST, the role file's reading step APPLIED: ";

test("ROW 3 APPLIES the role file's reading step, and still shows what the adapter itself named", () => {
  const md = roleText("executor");
  const subtracted = readSubtractions(md);
  const added = readAdditions(md);

  // POSITIVE CONTROLS FIRST, both directions. "The subtracted document is
  // absent from the applied set" is satisfied by a role file that subtracts
  // nothing, and "the addition is present" by an adapter that already named
  // it — neither of which is the property.
  expect(
    subtracted,
    "this role file states no subtraction, so every absence below proves nothing",
  ).not.toEqual([]);
  expect(added, "this role file states no addition, so the presence below proves nothing").not.toEqual(
    [],
  );

  const rendered = render(assembleBrief(context({})).recs).split("\n");
  const adapterLines = rendered.filter((l) => / names: docs\//.test(l));
  expect(adapterLines.length, "row 3 emitted no adapter line at all").toBeGreaterThan(0);
  const appliedLines = rendered.filter((l) => l.includes(APPLIED));
  expect(
    appliedLines.length,
    "row 3 emitted no APPLIED read-first set — the adapter's list printed beside the role file " +
      "IS this card's defect",
  ).toBe(1);
  const applied = readFirstList(appliedLines[0] ?? "", APPLIED);

  // THE CARD'S SECOND CRITERION: the adapter's own list survives on the
  // report, unchanged and attributed to the adapter, so a reader can see
  // WHICH document was removed and which was added.
  for (const line of adapterLines) {
    const rel = (/^\s*(\S+) names: /.exec(line) ?? [])[1] ?? "";
    expect(rel, `an adapter line names no file: ${line}`).not.toBe("");
    expect(
      readFirstList(line, " names: "),
      `${rel}'s own list was edited on the way out — row 3 shows what the adapter named AND what ` +
        "the role file did to it, never the second in place of the first",
    ).toEqual(docsNamed(readDoc(rel)));
  }
  for (const gone of subtracted) {
    expect(
      adapterLines.some((l) => l.includes(gone)),
      `no adapter names ${gone}, so its absence from the applied set proves nothing`,
    ).toBe(true);
    expect(
      rendered.some((l) => l.includes(`the role file SUBTRACTS: ${gone}`)),
      `row 3 removed ${gone} without saying so — the difference has to be visible, not silent`,
    ).toBe(true);
    expect(
      applied,
      `the applied read-first set still carries ${gone}, which this role file subtracts in as many ` +
        "words. That is the defect: a brief telling a session to read the one document its own " +
        "role file four rows earlier forbids",
    ).not.toContain(gone);
  }
  for (const gained of added) {
    expect(
      adapterLines.some((l) => l.includes(gained)),
      `an adapter already names ${gained}, so the applied set carrying it proves nothing about the ` +
        "role file's addition",
    ).toBe(false);
    expect(
      rendered.some((l) => l.includes(`the role file ADDS: ${gained}`)),
      `row 3 added ${gained} without saying so`,
    ).toBe(true);
    expect(
      applied,
      `the applied read-first set omits ${gained}, whose absence this role file says "cost the ` +
        'same dispatch error twice"',
    ).toContain(gained);
  }

  // AND EVERYTHING THE ADAPTER NAMED THAT THE ROLE FILE DID NOT TOUCH IS
  // STILL THERE, or "apply the step" is satisfied by a row that drops the
  // set on the floor.
  for (const rel of adapterLines.map((l) => (/^\s*(\S+) names: /.exec(l) ?? [])[1] ?? "")) {
    for (const doc of docsNamed(readDoc(rel))) {
      if (subtracted.includes(doc)) continue;
      expect(applied, `${doc} left the read-first set and no role-file sentence removed it`).toContain(
        doc,
      );
    }
  }
});

test("the subtraction and the addition FOLLOW the role file — no clause leaves the adapter's list unchanged", () => {
  const ctx = context({});
  const md = ctx.roleMd;
  const subtracted = readSubtractions(md);
  const added = readAdditions(md);
  expect(subtracted[0], "this role file subtracts nothing, so this body has no subject").toBeDefined();
  expect(added[0], "this role file adds nothing, so this body has no subject").toBeDefined();

  // ONE SIDE ONLY: the DOCUMENT moves, in memory. Nothing in the module is
  // touched. A subtraction typed into the tool would strike the same
  // document out of a role file that has stopped asking for it — which is
  // exactly the difference between reading a document and remembering one.
  const plain = md
    .split("\n")
    .filter((l) => !l.includes("do NOT read ") && !l.includes("ADDITION TO THAT SET IS "))
    .join("\n");
  expect(plain).not.toBe(md);
  expect(readSubtractions(plain)).toEqual([]);
  expect(readAdditions(plain)).toEqual([]);

  const renderedPlain = render(assembleBrief({ ...ctx, roleMd: plain, findings: [] }).recs).split("\n");
  const appliedPlain = readFirstList(renderedPlain.find((l) => l.includes(APPLIED)) ?? "", APPLIED);
  const adapterPlain = renderedPlain
    .filter((l) => / names: docs\//.test(l))
    .map((l) => readFirstList(l, " names: "));
  expect(adapterPlain.length, "the plain render emitted no adapter line").toBeGreaterThan(0);
  for (const list of adapterPlain) {
    expect(
      appliedPlain,
      "a role file stating no subtraction and no addition still moved the adapter's list, so the " +
        "difference this row applies is a constant in the tool rather than a reading of the role file",
    ).toEqual(list);
  }
  expect(appliedPlain, "the subtracted document did not come back").toContain(subtracted[0]);
  expect(appliedPlain, "the addition survived a role file that no longer asks for it").not.toContain(
    added[0],
  );
  expect(
    renderedPlain.some((l) => l.startsWith("# ") && l.includes("stands unchanged")),
    "row 3 applied nothing and said nothing about it — a reader cannot tell that from a row that " +
      "silently failed to read the role file",
  ).toBe(true);

  // THE OTHER HALF OF "NOT A CONSTANT": a role file subtracting a DIFFERENT
  // document strikes THAT one instead. The replacement is DERIVED — the last
  // document the adapter names that is not already subtracted — so this body
  // holds no document name of its own either.
  const adapterFirst = adapterPlain[0] ?? [];
  const other = [...adapterFirst].reverse().find((d) => !subtracted.includes(d)) ?? "";
  expect(other, "the adapter names only the subtracted document, so nothing can be swapped").not.toBe(
    "",
  );
  const moved = md.split(subtracted[0] ?? "").join(other);
  expect(moved).not.toBe(md);
  expect(readSubtractions(moved)).toEqual([other]);
  const renderedMoved = render(assembleBrief({ ...ctx, roleMd: moved, findings: [] }).recs).split("\n");
  const appliedMoved = readFirstList(renderedMoved.find((l) => l.includes(APPLIED)) ?? "", APPLIED);
  expect(
    appliedMoved,
    `the role file now subtracts ${other} and the applied set still carries it`,
  ).not.toContain(other);
  expect(
    appliedMoved,
    `the role file no longer subtracts ${subtracted[0]} and the applied set still drops it — that ` +
      "is a document this module remembers rather than reads",
  ).toContain(subtracted[0]);
});

test("a `do NOT read` sentence that names no document subtracts nothing", () => {
  // THE SECOND ROLE FILE IN THIS METHOD, as the reader's other real input.
  // It spells the same subtraction with the path BACKTICKED, and its second
  // `do NOT read` forbids the executor's notes — prose, not a path. A reader
  // that answered on the phrase alone would subtract a document nobody named.
  const verifier = roleText("verifier");
  const sentences = verifier.split("\n").filter((l) => l.includes("do NOT read "));
  expect(
    sentences.length,
    "verifier.md carries fewer than two `do NOT read` sentences, so the discrimination below has " +
      "no subject",
  ).toBeGreaterThan(1);
  const subtracted = readSubtractions(verifier);
  expect(subtracted.length, "the backticked spelling was not read as a document").toBe(1);
  expect(subtracted[0]).toBe(docsNamed(sentences[0] ?? "")[0]);
  expect(
    sentences.some((l) => docsNamed(l).length === 0),
    "no `do NOT read` sentence here names a non-document, so this body proves nothing",
  ).toBe(true);
  expect(readAdditions(verifier), "verifier.md states no addition and one was invented").toEqual([]);
});

test("THE LANE LIST FILTERS ON THE BRANCH, NEVER THE PATH", () => {
  const spellings = laneSpellings(conventions());
  const lanes = laneWorktrees(PORCELAIN_FIXTURE, spellings);
  const ids = lanes.map((l) => l.taskId);

  // POSITIVE CONTROL FIRST. "T-902 is absent" is satisfied by a function
  // that returns nothing at all, and only one of those is the property.
  expect(
    ids,
    "the real lane is missing, so every absence below proves nothing",
  ).toContain("T-901");

  // THE CARD'S SECOND CRITERION, as a body: a DETACHED worktree at a
  // lane-shaped path is not a lane and holds no fence.
  expect(
    ids,
    "a detached worktree at a lane-shaped path was counted as a lane — that is a fence " +
      "attributed to nobody, and two such worktrees existed on this repository while this card " +
      "was being built",
  ).not.toContain("T-902");
  // A detached checkout NAMED after a card is the same error wearing a
  // better disguise: under a path filter `nputer-T-901-verify` becomes a
  // SECOND T-901 lane holding the same fence twice.
  expect(
    lanes.filter((l) => l.taskId === "T-901").length,
    "one card, one fence — a verifier's detached checkout beside a lane is not a second lane",
  ).toBe(1);
  expect(ids, "a worktree on a NON-task branch is not a lane").not.toContain("T-903");
  expect(ids).toEqual(["T-901"]);
  for (const lane of lanes) expect(lane.branch).not.toBe("");
});

test("the branch filter is DERIVED from the spelling CONVENTIONS publishes", () => {
  const md = conventions();
  const before = laneSpellings(md);
  expect(before.branchRe.test("refs/heads/task/T-901-a-real-lane")).toBe(true);

  // ONE SIDE ONLY: the DOCUMENT's branch spelling moves. A matcher typed
  // into the module would not follow it, and would then filter on a
  // pattern this project no longer publishes.
  const moved = md.replace(
    `branch \`${before.branchPattern}\``,
    "branch `lane/T-NNN-<slug>`",
  );
  expect(moved).not.toBe(md);
  const after = laneSpellings(moved);
  expect(after.branchPattern).toBe("lane/T-NNN-<slug>");
  expect(after.branchRe.test("refs/heads/task/T-901-a-real-lane")).toBe(false);
  expect(after.branchRe.test("refs/heads/lane/T-901-a-real-lane")).toBe(true);
});

test("the lane spellings refuse a near-miss rather than answering with it", () => {
  const md = conventions();
  const s = laneSpellings(md);
  // `integration branch \`main\`` ends in "branch", and reading the
  // integration branch as the lane pattern is precisely the near-miss a
  // brief assembled from memory makes. This body pins the guard: the two
  // must come back different, and the lane pattern must be a pattern.
  expect(s.integrationBranch).not.toBe(s.branchPattern);
  expect(s.branchPattern).toContain("T-NNN");
  expect(s.createCommand).toContain(s.branchPattern);
  expect(s.createCommand).toContain(s.worktreePattern);
});

test("the LIVE worktree list is parsed, and every derived lane is on a task branch", () => {
  const entries = parseWorktreePorcelain(worktreePorcelain(repoRoot));
  expect(entries.length, "this checkout is itself a worktree, so the list is never empty").toBeGreaterThan(0);
  expect(entries.some((e) => path.resolve(e.path) === path.resolve(repoRoot))).toBe(true);
  const lanes = laneWorktrees(worktreePorcelain(repoRoot), laneSpellings(conventions()));
  for (const lane of lanes) {
    expect(lane.branch.startsWith("refs/heads/")).toBe(true);
    expect(lane.head).toMatch(/^[0-9a-f]{40}$/);
    expect(entries.some((e) => e.path === lane.path && e.branch === lane.branch)).toBe(true);
  }
});

test("EVERY EMITTED FIGURE CARRIES ITS PROVENANCE, and the detector is not vacuous", () => {
  const ctx = context({ taskId: "T-133" });
  const { recs } = assembleBrief(ctx);
  const rendered = render(recs);
  expect(rendered.length).toBeGreaterThan(0);
  expect(
    unstampedLines(rendered),
    "a line left this command with no ref and no reading time — that is the defect the card " +
      "exists to stop, reproduced by the tool built to stop it",
  ).toEqual([]);

  // The `--full` path renders more text through the same channel, and an
  // unchecked branch is where a bare figure would sit.
  expect(unstampedLines(render(assembleBrief(context({ taskId: "T-133", full: true })).recs))).toEqual([]);

  // POSITIVE CONTROL for the detector itself, against the REAL report
  // rather than a synthetic line: strip every stamp and require the
  // detector to name every line it took one from. Without this, "no
  // unstamped lines" is satisfied by a detector that sees nothing — and
  // this detector DID miss the live stamps on its first run, because an
  // alternation had picked up a leading space.
  const stampedCount = rendered.split("\n").filter((l) => l.includes("  <- ")).length;
  expect(stampedCount).toBeGreaterThan(20);
  const stripped = rendered
    .split("\n")
    .map((l) => l.replace(/ {2}<- .*$/, ""))
    .join("\n");
  expect(unstampedLines(stripped).length).toBe(stampedCount);
  expect(unstampedLines("lanes live right now: three")).toEqual(["lanes live right now: three"]);
  expect(unstampedLines("# a note carries no figure")).toEqual([]);

  // The channel that could carry a bare figure is closed by construction.
  expect(() => note("there are 3 lanes")).toThrow(/may not carry a digit/);
  expect(() => note("the lane list is a fact on disk")).not.toThrow();
});

test("a TREE fact carries a ref and a LIVE fact carries a clock — never the other way round", () => {
  const ctx = context({ taskId: "T-133" });
  const rendered = render(assembleBrief(ctx).recs);
  const worktreeLines = rendered
    .split("\n")
    .filter((l) => l.includes("git worktree list --porcelain"));
  expect(worktreeLines.length, "no lane line was emitted, so this body proves nothing").toBeGreaterThan(0);
  for (const line of worktreeLines) {
    expect(
      line,
      "a worktree is a LIVE-ENVIRONMENT fact — executor.md's figure rule names that exception in " +
        "as many words, so it carries the time and host it was read at and never a commit",
    ).toContain("<- read ");
    expect(line).not.toContain("<- @ ");
  }
  const cardLines = rendered.split("\n").filter((l) => l.includes("frontmatter field touches"));
  expect(cardLines.length).toBeGreaterThan(0);
  for (const line of cardLines) expect(line).toContain("<- @ ");

  expect(() => value("x", treeProv("", "somewhere"))).toThrow(/needs a ref/);
});

test("a figure read from the MOVING integration ref is a LIVE fact — two reads at ONE ref disagree", () => {
  // THE REJECTION THIS BODY PINS. `base commit` and `integration tip
  // right now` shipped stamped `<- @ <ref>` as TREE facts, and both are
  // reads of the mutable integration BRANCH. Re-derive them at the ref
  // they name and you get different commits; the verifier watched that
  // branch move three times inside one pass and print three values under
  // one identical stamp, and it moved a fourth time before this fix. The
  // affected figure is the base hash that feeds `git worktree add`, which
  // lane-protocol rule 2 wants as a hash precisely because "latest" is a
  // different commit for every reader.
  //
  // NOTHING PINNED IT: the suite was 192 green with the defect and 192
  // green with it re-stamped by hand. The body above checks only that
  // WORKTREE lines are live; it never asked whether a `<- @ >` line is
  // derivable at the ref it wears.
  const ctx = context({ taskId: "T-133" });
  const branch = laneSpellings(conventions()).integrationBranch;

  // The second read is DERIVED from the first rather than typed: drop the
  // newest Checkpoint and everything above it, which is exactly what the
  // branch moving does to this log.
  const lines = ctx.integrationLog.split("\n").filter((l) => l.trim() !== "");
  const cut = lines.findIndex((l) => l.slice(41).startsWith("Checkpoint:"));
  const checkpoints = lines.filter((l) => l.slice(41).startsWith("Checkpoint:")).length;
  // THE PRECONDITION NAMES WHAT IT SAW (T-153-s9). This body's subject is
  // the SHAPE of one read of a mutable ref, and which ref that is now
  // depends on the checkout: a `pull_request` runner holds no local
  // branch and answers through a remote-tracking spelling. A precondition
  // that fails without naming the ref, the length and the count sends the
  // reader to guess which of the three moved.
  const seen =
    `${branch} -> ${ctx.integrationRef}: ${lines.length} first-parent line(s), ` +
    `${checkpoints} Checkpoint(s), newest at index ${cut}, head ${lines[0]?.slice(0, 60) ?? "(none)"}`;
  expect(cut, `${branch} carries no Checkpoint, so this body has no subject — ${seen}`).toBeGreaterThanOrEqual(0);
  const older = lines.slice(cut + 1);
  expect(
    older.some((l) => l.slice(41).startsWith("Checkpoint:")),
    `${branch} carries only one Checkpoint here, so a second read cannot be built out of it — ${seen}`,
  ).toBe(true);

  // ONE VARIABLE. The same ctx object: the same ref, the same clock, the
  // same worktree list, the same cards — only the read of the branch
  // differs. Anything whose TEXT moves between these two renders was
  // never a function of the tree they are both stamped at.
  const moved = { ...ctx, integrationLog: older.join("\n"), findings: [] };
  const before = render(assembleBrief(ctx).recs).split("\n");
  const after = render(assembleBrief(moved).recs).split("\n");
  expect(after.length, "the two renders have different shapes, so they are not comparable").toBe(
    before.length,
  );

  const bare = (l: string) => l.replace(/ {2}<- .*$/, "");
  const changed = before.filter((l, i) => bare(l) !== bare(after[i] ?? ""));
  expect(
    changed.length,
    "moving the integration branch changed no line, so this body is not driving the figures it " +
      "exists to pin",
  ).toBeGreaterThan(1);
  for (const line of changed) {
    expect(
      line,
      "this line's VALUE moved while the ref it is stamped at did not, so the ref does not " +
        "determine it. A figure carrying a ref that does not determine it is worse than a bare " +
        "figure — this card's own argument, turned on this card's own output",
    ).toContain("  <- read ");
  }

  // AND THE RULE STATED DIRECTLY, against the real report rather than only
  // against the experiment: every line whose SOURCE names the integration
  // branch carries a clock. Positive control first — without it, "they are
  // all live" is satisfied by a report that reads the branch nowhere.
  //
  // **THE MATCH IS ON A REVISION TOKEN, NOT ON THE LETTERS** (T-153-s9,
  // found by this lane against its own card). `\bmain\b` matches inside
  // `T-153-s9-a-pull-request-checkout-has-no-local-main-so-…md`, because
  // a hyphen is a word boundary — so a live lane whose card SLUG happens
  // to carry the branch's name reddened this body with a card-file
  // provenance that is a tree fact and is correctly stamped as one.
  // Measured at `a533a4d` against the UNCHANGED module: two violations,
  // both this lane's own `<id> touches:` and `<id> board status:` lines.
  // A revision is a whole token — preceded by a space or a slash (the
  // remote-tracking spelling) and followed by a space, a comma or the end
  // — while a file name carries it as a fragment of a longer identifier.
  const via = (l: string) => l.replace(/^.*? {2}<- /, "");
  // T-153-s9's VERDICT, the assigned correction: the lookahead also
  // admits the revision-operator suffixes — `main^{commit}`, `main~2`,
  // `main:path`, `main@{u}` are SPENT revisions the narrow [\s,] class
  // dropped, and the verifier planted one stamped TREE that the suite
  // then passed at 25 green. A real violation could hide in exactly
  // the gap the comment below claims is empty; now it cannot.
  const spendsBranch = (l: string) =>
    new RegExp(`(?:^|[\\s/])${branch}(?=[\\s,^~:]|@\\{|$)`).test(via(l));
  const refReads = before.filter((l) => l.includes("  <- ") && spendsBranch(l));
  expect(
    refReads.length,
    "no emitted line names the integration branch as its source, so the rule below has no subject",
  ).toBeGreaterThan(1);
  for (const line of refReads) expect(line).toContain("  <- read ");

  // AND THE NARROWING IS ACCOUNTED FOR RATHER THAN POCKETED. Every line
  // the tightening drops — the branch's letters present, no revision
  // token — is required to be a TREE fact, so a real violation cannot
  // hide in the difference between the two patterns.
  const dropped = before.filter(
    (l) => l.includes("  <- ") && new RegExp(`\\b${branch}\\b`).test(via(l)) && !spendsBranch(l),
  );
  for (const line of dropped) {
    expect(
      line,
      "a line the revision-token match dropped is stamped LIVE, so it was not the file-name case " +
        "the narrowing was written for — widen the pattern back rather than accepting this",
    ).toContain("  <- @ ");
  }

  // THE OTHER DIRECTION, or "stamp everything live" would pass. With no
  // task named, the create command is the document's own text — `<base>`
  // placeholder and all — so it is a transcription, and a transcription is
  // a tree fact. The stamp follows whether the moving hash is IN the line.
  const noTask = render(assembleBrief(context({})).recs).split("\n");
  const createLines = noTask.filter((l) => /^\s*create: /.test(l));
  expect(createLines.length, "the lane row emitted no create command").toBe(1);
  const createLine = createLines[0] ?? "";
  expect(createLine, "the create command was substituted for a card nobody named").toContain("<base>");
  expect(
    createLine,
    "an unsubstituted create command is a verbatim transcription of CONVENTIONS at this ref, and " +
      "a live stamp on a tree fact is the same defect facing the other way",
  ).toContain("  <- @ ");
});

test("a provenance that is neither SHAPE throws at render, rather than rendering `read undefined`", () => {
  // The realistic authoring slip: an object literal instead of the
  // constructor. `stamp()` was a ternary, so every kind that was not
  // exactly "tree" went down the LIVE branch and this rendered as
  //
  //   the suite is nine hundred bodies  <- read undefined on undefined ; git rev-parse HEAD
  //
  // which SLIPS `unstampedLines()` — the provenance floor the body above
  // drives. So the floor was structural against OMISSION and merely
  // careful against MALFORMATION, and a malformed stamp is the one shape
  // that looks stamped. Latent rather than live: every shipped call site
  // goes through treeProv/liveProv, which validate.
  const asProv = (x: unknown) => x as unknown as ReturnType<typeof treeProv>;
  const slips: unknown[] = [
    { ref: "64d148396f65", via: "git rev-parse HEAD" },
    { kind: "Tree", ref: "64d148396f65", via: "git rev-parse HEAD" },
    { kind: "tree ", ref: "64d148396f65", via: "git rev-parse HEAD" },
    { kind: "live" },
    { kind: "tree" },
    {},
    0,
    false,
    "tree",
  ];
  for (const slip of slips) {
    expect(
      () => render([value("the suite is nine hundred bodies", asProv(slip))]),
      `${String(JSON.stringify(slip))} rendered a stamp instead of throwing`,
    ).toThrow(/provenance/);
  }

  // POSITIVE CONTROL: the two real shapes still render, so the closure is
  // discriminating rather than total.
  expect(render([value("x", treeProv("64d148396f65", "git rev-parse HEAD"))])).toContain(
    "<- @ 64d148396f65 ; git rev-parse HEAD",
  );
  expect(render([value("x", liveProv("2026-08-26T00:00:00.000Z", "a-host", "lsof"))])).toContain(
    "<- read 2026-08-26T00:00:00.000Z on a-host ; lsof",
  );
});

test("THE SLUG MAP COMES FROM THE FIELD, and the prose block is compared rather than trusted", () => {
  const comps = components();
  const fields = slugMapFromFields(comps);
  expect(fields.size, "no component declares a touch_slugs field").toBeGreaterThan(0);

  const arch = architectureText();
  const prose = slugMapFromProse(arch);
  expect(prose.size, "the architecture doc's derived block could not be read").toBeGreaterThan(0);

  // THE TWO COPIES AGREE TODAY, and that is asserted rather than assumed:
  // row 5 rules the FIELD authoritative precisely because this block goes
  // stale, and it has done so twice. This is a TREE fact, so it is
  // deterministic at a ref and safe to assert; the live half (lanes,
  // fences) is disclosed rather than asserted, below.
  for (const [slug, ids] of fields) {
    expect(
      prose.get(slug),
      `the architecture doc's block and ${slug}'s component files disagree — the FIELD is ` +
        "authoritative (executor.md row 5), so the block is the side to repair",
    ).toEqual(ids);
  }

  // ONE SIDE ONLY: the PROSE moves, the fields do not. The comparison has
  // to notice, or nothing is comparing them.
  const firstSlug = [...fields.keys()][0] ?? "";
  expect(firstSlug).not.toBe("");
  const moved = arch
    .split("\n")
    .map((l) => (l.startsWith("    ") ? l.replace(firstSlug, "app-nobody") : l))
    .join("\n");
  expect(moved).not.toBe(arch);
  const poisoned = slugMapFromProse(moved);
  expect(
    poisoned.get(firstSlug),
    "moving the prose block left the derived comparison unchanged, so nothing is reading it",
  ).toBeUndefined();
  expect(poisoned.has("app-nobody")).toBe(true);
});

test("FENCE DISJOINTNESS IS COMPUTED AS SETS THROUGH THE MAP, not as a string compare", () => {
  const comps = components();
  const slugs = slugMapFromFields(comps);

  // The sharp case USED to be live: `app-board` and `app-shell` were
  // different strings both claiming C-11. T-163 (@human, 2026-08-30)
  // took that field to the empty list, so the live half is now the
  // RULED NEGATIVE, derived rather than quoted: no component is
  // claimed by two slugs (the T-163-s2 rewrite; select-board.test.ts
  // is the model).
  for (const [slug, ids] of slugs) {
    for (const id of ids) {
      const claimants = [...slugs].filter(([, list]) => list.includes(id)).map(([s]) => s);
      expect(
        claimants,
        `${id} is claimed by two slugs (via ${slug}) — the T-163 ruling has been undone`,
      ).toEqual([slug]);
    }
  }

  // THE MECHANISM MOVED, IT DID NOT LEAVE: a synthetic registry still
  // carries the shape — one component, two slugs — and the overlap a
  // string compare cannot see is still caught through the map.
  const c70 = {
    id: "C-70",
    file: "synthetic (this body)",
    slugs: ["alpha", "beta"],
    paths: ["app/src/assets", "app/src/styles"],
  };
  const synthComps = [...comps, c70];
  const synthSlugs = slugMapFromFields(synthComps);
  const overlap = fenceOverlaps(
    { id: "T-A", entries: ["alpha"] },
    { id: "T-B", entries: ["beta"] },
    synthSlugs,
    synthComps,
  );
  expect(
    overlap.length,
    "alpha and beta are different strings that reserve the same component, and this " +
      "derivation called them disjoint",
  ).toBeGreaterThan(0);

  // POSITIVE CONTROL: two fences that really are disjoint come back so.
  expect(
    fenceOverlaps({ id: "T-A", entries: ["tools/e2e"] }, { id: "T-B", entries: ["lib-parser"] }, slugs, comps),
  ).toEqual([]);
  // And a path fence is compared as a PREFIX, so a directory contains its files.
  expect(
    fenceOverlaps(
      { id: "T-A", entries: ["method/"] },
      { id: "T-B", entries: ["method/lane-protocol.md"] },
      slugs,
      comps,
    ).length,
  ).toBeGreaterThan(0);
});

test("the frontmatter reader agrees with `yaml` on every live card and every component", () => {
  // T-057: a rule with two implementations is two chances to disagree.
  // This module carries a minimal reader so the command runs against a
  // checkout with nothing installed; that choice is only defensible if
  // the two are MEASURED against each other rather than assumed equal.
  let checked = 0;
  const docs = [
    ...liveTaskCards(repoRoot).map((c) => ({ file: c.path, content: c.content })),
    ...trackedFiles(repoRoot)
      .filter((rel) => rel.startsWith("docs/architecture/components/") && rel.endsWith(".md"))
      .map((rel) => ({ file: rel, content: readDoc(rel) })),
  ];
  for (const doc of docs) {
    const mine = frontmatterFields(doc.content);
    const block = doc.content.split(/^---[ \t]*$/m)[1];
    if (block === undefined) continue;
    const theirs = parseYaml(block) as Record<string, unknown> | null;
    if (theirs === null) continue;
    for (const key of ["id", "status", "size", "touches", "touch_slugs", "paths"]) {
      if (!(key in theirs)) continue;
      const t = theirs[key];
      if (t === null || t === undefined) continue;
      const expected = Array.isArray(t) ? t.map((v) => String(v).trim()) : String(t).trim();
      const got = mine[key];
      expect(
        got,
        `${doc.file}: this module reads ${key} as ${JSON.stringify(got)} and \`yaml\` reads it as ` +
          `${JSON.stringify(expected)} — the minimal reader has forked from the authority`,
      ).toEqual(expected);
      checked += 1;
    }
  }
  expect(checked, "nothing was compared, so this body is vacuous").toBeGreaterThan(50);
});

test("the gates are ENUMERATED from the document, and a removed gate is not still named", () => {
  const md = conventions();
  const { gates, named } = standingGates(md);
  expect(gates.length, "no standing gate was enumerated").toBeGreaterThan(0);
  for (const g of gates) {
    expect(g.trigger, `${g.name} was enumerated with no trigger`).toContain("at any merge whose diff touches");
  }
  // A bullet that names a gate and declares no merge-diff trigger is
  // REPORTED rather than dropped: silence about a paragraph is how a hand
  // list forms behind a derivation's back. The two lists must not
  // intersect, or one bullet is answered twice under two spellings.
  for (const n of named) expect(gates.map((g) => g.name)).not.toContain(n);

  // ONE SIDE ONLY: remove one gate's bullet from the DOCUMENT.
  const victim = gates[gates.length - 1];
  expect(victim).toBeDefined();
  const bullets = md.split(/\n(?=- )/);
  const kept = bullets.filter((b) => !new RegExp(`^- ${victim?.name}\\b`).test(b.replace(/\s+/g, " ")));
  expect(kept.length).toBe(bullets.length - 1);
  const after = standingGates(kept.join("\n"));
  expect(
    after.gates.map((g) => g.name),
    "a gate deleted from the document was still named by the derivation, so the list is not read",
  ).not.toContain(victim?.name);
});

test("the commands are transcribed VERBATIM from the per-package bullets", () => {
  const pkgs = packageCommands(conventions());
  const dirs = pkgs.map((p) => p.dir);
  expect(dirs).toContain("lib/parser");
  expect(dirs).toContain("app");
  expect(dirs).toContain("tools/e2e");
  for (const pkg of pkgs) {
    expect(pkg.commands.length, `${pkg.dir} exposes no command`).toBeGreaterThan(0);
    for (const cmd of pkg.commands) expect(cmd).not.toContain("`");
  }
  // The middle-dot stopping rule is CONVENTIONS' own, and the cost of
  // getting it wrong is measured in that file: a separator inside a
  // parenthetical drops every command behind it. This body pins that the
  // derivation still reads past the first parenthetical command.
  const tauri = pkgs.find((p) => p.dir === "app/src-tauri");
  expect(tauri?.commands.some((c) => c.startsWith("cargo audit"))).toBe(true);
});

test("the ceremony ROW is read from TASK-FORMAT, and the tier letter alone does not decide it", () => {
  const rows = ceremonyRows(readDoc("method/tasks/TASK-FORMAT.md"));
  expect(rows.length).toBeGreaterThan(0);
  const sRows = rows.filter((r) => r.size === "S" || r.size.startsWith("S,"));
  expect(
    sRows.length,
    "size S resolves to a single ceremony row here — the whole reason row 11 asks WHICH row is " +
      "that it does not",
  ).toBeGreaterThan(1);
});

test("the named disciplines are enumerated from the document's own shape", () => {
  const md = conventions();
  const { gates, named } = standingGates(md);
  const skip = [...gates.map((g) => g.name), ...named];
  const found = namedDisciplines(md, skip);
  const names = found.map((d) => d.name);
  expect(names).toContain("POISON DRILL");
  expect(names).toContain("A NEGATIVE ASSERTION NEEDS A POSITIVE CONTROL");
  expect(names, "a gate is answered by row 8 and must not be listed twice").not.toContain("DOCS GATE");
  // ONE SIDE ONLY: rename the bullet in the DOCUMENT and require the
  // enumeration to follow it.
  const moved = md.replace("- POISON DRILL (", "- POISON RITUAL (");
  expect(moved).not.toBe(md);
  const after = namedDisciplines(moved, skip).map((d) => d.name);
  expect(after).not.toContain("POISON DRILL");
  expect(after).toContain("POISON RITUAL");
});

test("ARM TWO answers STATE's derivable sections and says what it cannot answer", () => {
  const ctx = context({});
  const rendered = render(stateReport(ctx));
  expect(unstampedLines(rendered)).toEqual([]);
  expect(rendered).toContain("THE LANE LIST");
  expect(rendered).toContain("THE BOARD");
  expect(rendered).toContain("THE SLUG MAP");
  expect(rendered).toContain("WHAT THIS COMMAND CANNOT ANSWER");
  // STATE's own headings are printed beside the derived facts, so a
  // reader can see the sections a command has no answer for rather than
  // being told the list is complete.
  expect(rendered).toContain("## Next up");
});

test("the board census adds up, and it is derived rather than carried", () => {
  const board = boardCensus();
  const summed = [...board.byStatus.values()].reduce((a, b) => a + b, 0);
  expect(
    summed,
    "the per-status counts do not sum to the file count, so one of them is not derived from the " +
      "same walk",
  ).toBe(board.total);
  expect(board.total).toBeGreaterThan(0);
  expect(board.rejected).toBeGreaterThan(0);
});

test("THE COMMAND IS A READ — it writes nothing into the checkout it runs in", () => {
  const statusBefore = spawnSync("git", ["-C", repoRoot, "status", "--porcelain"], { encoding: "utf8" });
  const headBefore = spawnSync("git", ["-C", repoRoot, "rev-parse", "HEAD"], { encoding: "utf8" });
  const run = spawnSync(process.execPath, [CLI, "--task", "T-133", "--state"], {
    cwd: repoRoot,
    encoding: "utf8",
  });
  // CLEAN or FOUND, never USAGE and never CANNOT_RUN: whether this
  // repository has a finding right now is a LIVE fact — a lane cut two
  // minutes ago can add one — and a body that asserted it would red in
  // somebody else's lane for somebody else's dispatch. It is disclosed
  // below instead.
  expect([EXIT.CLEAN, EXIT.FOUND], run.stderr ?? "").toContain(run.status);
  expect(run.stdout).toContain("ROW 1 —");
  const statusAfter = spawnSync("git", ["-C", repoRoot, "status", "--porcelain"], { encoding: "utf8" });
  const headAfter = spawnSync("git", ["-C", repoRoot, "rev-parse", "HEAD"], { encoding: "utf8" });
  expect(
    statusAfter.stdout,
    "the working tree moved under a command that is supposed to be a read",
  ).toBe(statusBefore.stdout);
  expect(headAfter.stdout).toBe(headBefore.stdout);
});

test("THE EXIT CODES keep `I derived it` apart from `I could not tell you`", () => {
  const run = (args: string[]) =>
    spawnSync(process.execPath, [CLI, ...args], { cwd: repoRoot, encoding: "utf8" });

  expect(run(["--help"]).status).toBe(EXIT.CLEAN);
  expect([EXIT.CLEAN, EXIT.FOUND]).toContain(run(["--task", "T-133"]).status);

  const noArm = run([]);
  expect(noArm.status, "an empty request is not a clean run").toBe(EXIT.USAGE);
  expect(noArm.stderr).toContain("nothing asked for");

  expect(run(["--nope"]).status).toBe(EXIT.USAGE);
  expect(run(["T-133"]).status, "a positional this command guessed at is a row filled from nowhere").toBe(
    EXIT.USAGE,
  );
  const missing = run(["--task", "T-999"]);
  expect(missing.status).toBe(EXIT.USAGE);
  expect(missing.stderr).toContain("no live card declares id");

  const broken = run(["--task", "T-133", "--root", path.join(repoRoot, "tools")]);
  expect(
    broken.status,
    "a run that could not read its sources must not look like a clean brief",
  ).toBe(EXIT.CANNOT_RUN);
  expect(broken.stderr).toContain("COULD NOT RUN");
});

test("a brief assembled at this ref names the lanes the repository holds, and no others", () => {
  const ctx = context({ taskId: "T-133" });
  const rendered = render(assembleBrief(ctx).recs);
  const entries = parseWorktreePorcelain(ctx.porcelain);

  // MACHINE-WIDE STATE JOINED TO PER-CHECKOUT STATE, AND THE SEAM IS NOW
  // ASSERTED INSTEAD OF ASSUMED (T-137).
  //
  // `ctx.lanes` comes from `git worktree list`, which is MACHINE-scoped:
  // every worktree of this repository sees every other one's lane. The
  // card index is CHECKOUT-scoped. So a lane cut AFTER this checkout's
  // base has a card that exists in the integration branch and in no
  // older tree, and no brief assembled here can name its `touches:` —
  // this tree has never seen them.
  //
  // THIS BODY USED TO REQUIRE `<id> touches:` FOR EVERY LANE ON THE
  // MACHINE, so cutting any new lane reddened it in every existing
  // checkout at once, with a title that named none of that. Observed:
  // `T-141` was dispatched at `2a922ce` and this body went red in the
  // two older lanes simultaneously, on trees that had not changed.
  // It is the same class as `T-132-s6` — a machine-scoped fact joined to
  // a checkout-scoped one with nothing marking the seam.
  //
  // NARROWER IS NOT WEAKER HERE: the unresolvable side had NO assertion
  // at all before this, and now has three.
  const resolvable = ctx.lanes.filter((l) => ctx.cards.has(l.taskId));
  const unresolvable = ctx.lanes.filter((l) => !ctx.cards.has(l.taskId));
  expect(
    resolvable.length + unresolvable.length,
    "the partition is total — no lane may fall out of both halves",
  ).toBe(ctx.lanes.length);
  for (const lane of resolvable) {
    expect(
      rendered,
      `${lane.taskId}'s card is in THIS checkout, so its fence must be named`,
    ).toContain(`${lane.taskId} touches:`);
  }
  for (const lane of unresolvable) {
    expect(
      rendered,
      `${lane.taskId} is a lane whose card this checkout cannot resolve`,
    ).toContain(`${lane.taskId}: no live card, fence UNKNOWN`);
    expect(rendered).not.toContain(`${lane.taskId} touches:`);
  }

  // AND THE UNRESOLVABLE BRANCH IS DRIVEN DETERMINISTICALLY, off the
  // fixture rather than off whatever the machine happens to hold — so
  // this half is pinned whether or not a newer lane exists right now.
  // `T-901` is a REAL lane in the fixture and no card declares it.
  const fixture = context({ taskId: "T-133", porcelain: PORCELAIN_FIXTURE });
  const fixtureRendered = render(assembleBrief(fixture).recs);
  expect(fixtureRendered).toContain("T-901: no live card, fence UNKNOWN");
  expect(fixtureRendered).not.toContain("T-901 touches:");
  expect(
    fixture.findings.join(" ;; "),
    "a lane whose fence cannot be read is a fence nobody can be disjoint from",
  ).toContain("T-901 holds a worktree on refs/heads/task/T-901-a-real-lane");

  // A detached entry is never silently promoted to a lane.
  for (const entry of entries.filter((e) => e.branch === "")) {
    expect(rendered).not.toContain(`${entry.path} (on `);
  }

  // THE LIVE HALF IS DISCLOSED, NOT ASSERTED. Whether two live fences
  // overlap is a fact about somebody else's dispatch, and a red here
  // would arrive attributed to whoever is nearest — the one kind of noise
  // docs/CONVENTIONS.md says nobody can dismiss by looking at it. An
  // annotation is invisible in the `list` reporter, so it is printed too.
  const line =
    ctx.findings.length === 0
      ? `${ctx.root} @ ${ctx.ref.slice(0, 12)} — the assembler settled every row`
      : `${ctx.root} @ ${ctx.ref.slice(0, 12)} — ${ctx.findings.join(" ;; ")}`;
  test.info().annotations.push({ type: "brief disclosure", description: line });
  process.stdout.write(`\n  brief DISCLOSURE: ${line}\n`);
});

/* ────────────────────────────────────────────────────────────────────
 * THE CHECKOUT THIS COMMAND RUNS IN (T-153-s9) — three shapes, built
 * rather than described.
 *
 * `actions/checkout` on a `pull_request` event leaves the workspace
 * DETACHED at the PR's merge ref and creates no local branch, so the
 * integration branch's bare name resolves to nothing and every figure
 * this command takes off that branch died with `fatal: ambiguous
 * argument 'main'` — twenty-nine bodies red on a run whose only
 * difference from a green one was the EVENT. A lane may not push main,
 * so a draft PR is the CI a dispatch brief hands an executor: the shape
 * these bodies drive is the shape a lane actually runs in.
 *
 * THE FIXTURE IS THE REPOSITORY'S OWN TRACKED TREE, not a hand-built
 * stand-in. Every row of the brief is derived from real project files —
 * CONVENTIONS' lane bullet, the role file's contract table, the card
 * index, the component registry — so a fixture missing them would prove
 * something about a different repository.
 * ──────────────────────────────────────────────────────────────────── */

/**
 * Author and committer come from the environment, so a runner with no
 * configured identity can still commit.
 *
 * THE FIXTURE'S GIT CALLS ALSO CARRY `NO_BACKGROUND_MAINTENANCE` (T-178).
 * `git commit` ends by detaching `git maintenance run --auto`, which keeps
 * writing inside this fixture's `.git` and `.git/objects` for hundreds of
 * milliseconds after the foreground command has returned — and the teardown
 * at the bottom of the two bodies below raced it into ENOTEMPTY on CI twice.
 * tests/git-fixture.ts carries the measurement and the mechanism.
 */
const FIXTURE_GIT_ENV = {
  ...process.env,
  GIT_AUTHOR_NAME: "t153s9",
  GIT_AUTHOR_EMAIL: "t153s9@example.invalid",
  GIT_COMMITTER_NAME: "t153s9",
  GIT_COMMITTER_EMAIL: "t153s9@example.invalid",
};

function fixtureGit(cwd: string, args: string[]): string {
  return execFileSync("git", ["-C", cwd, ...NO_BACKGROUND_MAINTENANCE, ...args], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    env: FIXTURE_GIT_ENV,
  });
}

interface RefShapes {
  /** the mkdtemp root, for the teardown */
  dir: string;
  /** a checkout holding the integration branch LOCALLY — every developer tree, every push-event runner */
  local: string;
  /** detached, no local branch, the remote-tracking ref present — what a pull_request checkout is */
  detached: string;
  /** detached and with no remote at all — no spelling of the branch resolves */
  orphan: string;
}

function refShapes(): RefShapes {
  const dir = mkdtempSync(path.join(os.tmpdir(), "t153s9-refshape-"));
  const local = path.join(dir, "local");
  mkdirSync(local);
  const tar = path.join(dir, "tree.tar");
  writeFileSync(
    tar,
    execFileSync("git", ["-C", repoRoot, "archive", "HEAD"], { maxBuffer: 512 * 1024 * 1024 }),
  );
  execFileSync("tar", ["-x", "-f", tar, "-C", local]);
  fixtureGit(local, ["init", "--initial-branch=main", "--quiet"]);
  fixtureGit(local, ["add", "-A"]);
  // TWO `Checkpoint:` commits, because the base rule reads the newest one
  // out of the first-parent log and a fixture with none would fail for a
  // reason that has nothing to do with the ref this body is about.
  fixtureGit(local, ["commit", "--quiet", "-m", "Checkpoint: fixture base"]);
  fixtureGit(local, ["commit", "--quiet", "--allow-empty", "-m", "Checkpoint: fixture tip"]);

  // THE PULL_REQUEST SHAPE, built the way the runner leaves one: clone,
  // detach, and drop the local branch. What survives is exactly what
  // `actions/checkout` leaves behind — a remote-tracking ref and no
  // local name.
  const detached = path.join(dir, "detached");
  execFileSync("git", [...NO_BACKGROUND_MAINTENANCE, "clone", "--quiet", local, detached], {
    env: FIXTURE_GIT_ENV,
  });
  fixtureGit(detached, ["checkout", "--quiet", "--detach", "HEAD"]);
  fixtureGit(detached, ["branch", "--quiet", "-D", "main"]);

  // AND THE SHAPE WHERE NOTHING SPELLS IT. `git remote remove` takes the
  // remote-tracking refs with it, so this tree holds the whole history
  // and no name for the branch it is on.
  const orphan = path.join(dir, "orphan");
  execFileSync("git", [...NO_BACKGROUND_MAINTENANCE, "clone", "--quiet", local, orphan], {
    env: FIXTURE_GIT_ENV,
  });
  fixtureGit(orphan, ["checkout", "--quiet", "--detach", "HEAD"]);
  fixtureGit(orphan, ["branch", "--quiet", "-D", "main"]);
  fixtureGit(orphan, ["remote", "remove", "origin"]);

  return { dir, local, detached, orphan };
}

test("THE INTEGRATION REF IS RESOLVED, NOT ASSUMED — and the bare name still wins wherever it exists", () => {
  // KILLED BY: spending the branch NAME as a revision (the defect this
  // card removes), and equally by hard-coding `origin/<branch>` in its
  // place — the first shape below is what makes the fallback a fallback
  // rather than a silent redirection to whatever the remote says.
  const fx = refShapes();
  try {
    const branch = laneSpellings(conventions()).integrationBranch;
    expect(
      integrationRefCandidates(branch)[0],
      "the bare name is asked for FIRST, so a checkout that holds it is answered with it",
    ).toBe(branch);
    expect(integrationRefCandidates(branch)).toContain(`origin/${branch}`);

    // THE GUARD CLAUSE, ASSERTED RATHER THAN ARGUED: where the local
    // branch exists this module spends exactly the revision it always
    // spent, so nothing the derivations prove on a developer checkout or
    // a push-event runner is weakened by the fallbacks behind it.
    const held = resolveIntegrationRef(fx.local, branch);
    expect(held.rev).toBe(branch);
    expect(held.commit).toMatch(/^[0-9a-f]{40}$/);

    // THE PULL_REQUEST SHAPE. The pre-condition is asserted first —
    // without it, "the fallback fired" is satisfied by a tree where the
    // bare name was there all along.
    const bare = spawnSync("git", ["-C", fx.detached, "rev-parse", "--verify", "--quiet", branch], {
      encoding: "utf8",
    });
    expect(
      bare.status,
      "the fixture still holds the local branch, so this shape is not a pull_request checkout",
    ).not.toBe(0);
    const fellBack = resolveIntegrationRef(fx.detached, branch);
    expect(fellBack.rev).toBe(`origin/${branch}`);
    expect(
      fellBack.commit,
      "the fallback answered with a DIFFERENT history — a usable ref is one that spells the same branch",
    ).toBe(held.commit);

    // AND WHERE NO CANDIDATE RESOLVES IT REFUSES, LOUDLY AND BY NAME.
    // The three assertions are separate on purpose: that it throws, that
    // the message names every spelling it asked for, and that it does not
    // answer with the checkout's own HEAD — which is the invention that
    // would hand a dispatcher a base commit off the lane's own branch.
    const head = fixtureGit(fx.orphan, ["rev-parse", "HEAD"]).trim();
    let refusal = "";
    expect(() => {
      try {
        resolveIntegrationRef(fx.orphan, branch);
      } catch (err) {
        refusal = err instanceof Error ? err.message : String(err);
        throw err;
      }
    }).toThrow(/holds no revision spelling the integration branch/);
    for (const candidate of integrationRefCandidates(branch)) {
      expect(refusal, `the refusal names ${candidate} as one of the spellings it asked for`).toContain(
        candidate,
      );
    }
    expect(refusal).not.toContain(head);
  } finally {
    removeGitFixture(fx.dir, "refShapes");
  }
});

test("the WHOLE brief assembles on a pull_request-shaped checkout, and names the ref it actually spent", () => {
  // KILLED BY: the same mutant as the body above, one layer out — this
  // one runs the real command end to end against the real tree, which is
  // what the twenty-nine reds were. It is also the body that would catch
  // a resolver that is correct and NOT WIRED IN: a fix living in an
  // exported function nobody calls passes the unit body and fails here.
  const fx = refShapes();
  try {
    const branch = laneSpellings(conventions()).integrationBranch;
    const run = (root: string) =>
      spawnSync(process.execPath, [CLI, "--task", "T-133", "--root", root], {
        cwd: repoRoot,
        encoding: "utf8",
      });

    const pr = run(fx.detached);
    // CLEAN or FOUND, never CANNOT_RUN: whether a fixture tree carries a
    // finding is a property of the tree, and the claim here is that the
    // command HAS an answer on this checkout shape at all.
    expect([EXIT.CLEAN, EXIT.FOUND], pr.stderr ?? "").toContain(pr.status);
    expect(
      pr.stderr ?? "",
      "the error the event type used to produce, arriving through a body instead of through a verdict",
    ).not.toContain("ambiguous argument");
    expect(pr.stdout).toContain("ROW 1 —");
    expect(pr.stdout).toContain("ROW 4 — The lane");
    // THE FIGURES ROW 4 TAKES OFF THAT BRANCH ARE PRESENT, not merely
    // un-crashed: a command that printed the row and no base hash would
    // satisfy every assertion above.
    expect(pr.stdout).toMatch(/base commit: [0-9a-f]{40}/);
    expect(pr.stdout).toMatch(/integration tip right now: [0-9a-f]{40}/);
    // HONEST ABOUT WHERE IT RAN. The published spelling is still the
    // project's, and the ref this checkout resolved it to is emitted
    // beside it — a provenance naming a revision the checkout does not
    // hold is a provenance nobody can re-run.
    expect(pr.stdout).toContain(`integration branch: ${branch}`);
    expect(pr.stdout).toContain(`integration ref this checkout resolves: origin/${branch}`);
    expect(unstampedLines(pr.stdout.trimEnd())).toEqual([]);

    // THE CARD LEDGER SHARES THAT RESOLUTION, and the two halves split
    // the other way round on purpose. A card states a figure about the
    // project's integration BRANCH, whose name is the same in every
    // checkout — so the TEXT a `card:` stamp is verified against
    // character for character must NOT move with the event type that
    // produced it, while the provenance names the command that ran.
    const card = spawnSync(process.execPath, [CLI, "--card", "T-133", "--root", fx.detached], {
      cwd: repoRoot,
      encoding: "utf8",
    });
    expect([EXIT.CLEAN, EXIT.FOUND], card.stderr ?? "").toContain(card.status);
    const history =
      card.stdout.split("\n").find((l) => l.includes(`history ${branch} first-parent commits:`)) ?? "";
    expect(history, "the card ledger emitted no history figure, so this half has no subject").not.toBe(
      "",
    );
    expect(
      history.split("  <- ")[0],
      "the figure's TEXT moved with the checkout, so a stamped card line would go STALE on a " +
        "pull_request run and be VERIFIED on a push run — one figure with two answers",
    ).toContain(`history ${branch} first-parent commits:`);
    expect(
      history,
      "the provenance names a revision this checkout does not hold, so nobody can re-run it",
    ).toContain(`; git log --first-parent origin/${branch}`);

    // POSITIVE CONTROL FOR THAT LINE, from the shape that holds the
    // branch: it says the bare name, so the line is reporting a
    // resolution rather than printing a constant.
    const localRun = run(fx.local);
    expect([EXIT.CLEAN, EXIT.FOUND], localRun.stderr ?? "").toContain(localRun.status);
    expect(localRun.stdout).toContain(`integration ref this checkout resolves: ${branch}`);

    // AND THE OTHER SIDE: no spelling resolves, so the command reaches
    // its own COULD-NOT-RUN code rather than throwing an exec error
    // through a body, and it says which spellings it asked for.
    const orphan = run(fx.orphan);
    expect(
      orphan.status,
      "a checkout that cannot spell the integration branch is not a clean brief",
    ).toBe(EXIT.CANNOT_RUN);
    expect(orphan.stderr).toContain("COULD NOT RUN");
    expect(orphan.stderr).toContain("holds no revision spelling the integration branch");
    expect(orphan.stderr).toContain("will not substitute HEAD");
    expect(orphan.stderr).not.toContain("ambiguous argument");
    expect(orphan.stdout).not.toContain("base commit:");
  } finally {
    removeGitFixture(fx.dir, "refShapes");
  }
});

/* ────────────────────────────────────────────────────────────────────
 * T-143 — THE ANSWER MAY NOT SAY `FREE` ABOUT GROUND IT COULD NOT READ.
 *
 * One mechanism, two implementations. The parser's half was fixed at
 * `62a4364` (`lanes.ts`, `if (other === undefined) continue`); the
 * identical sentence survived here in `fenceLedger`, was filed as
 * `T-137-s11`, and was deliberately left as this card's ground. The
 * bodies below drive the PRODUCER — `fenceLedger`, `stateReport`,
 * `deriveFence` — over a porcelain fixture, so nothing here is a fence
 * this repository has to keep live for the pins to mean anything.
 * ──────────────────────────────────────────────────────────────────── */

/** A porcelain with a lane whose card THIS CHECKOUT CANNOT READ. `T-901`
 * and `T-902` name no card here, and the check below proves it rather
 * than trusting it — a fixture that accidentally named a real card would
 * turn every assertion into a green about the wrong thing. */
const BLIND_PORCELAIN = (ids: string[], real: string): string =>
  [
    "worktree /Users/x/nputer",
    "HEAD 1111111111111111111111111111111111111111",
    "branch refs/heads/main",
    "",
    ...ids.flatMap((id, i) => [
      `worktree /Users/x/nputer-${id}`,
      `HEAD ${String(i + 2).repeat(40)}`,
      `branch refs/heads/task/${id}-a-card-this-checkout-cannot-read`,
      "",
    ]),
    `worktree /Users/x/nputer-${real}`,
    "HEAD 9999999999999999999999999999999999999999",
    `branch refs/heads/task/${real}-a-real-lane`,
    "",
  ].join("\n");

/** The card this repository is asked to use as its READABLE lane, with
 * its fence read off the board rather than typed into a body. */
function readableLane(): { id: string; touches: string[] } {
  const ctx = context({});
  for (const [id, card] of ctx.cards) {
    const touches = fieldList(card.fields, "touches");
    if (touches.length > 0) return { id, touches };
  }
  throw new Error("no card on this board declares a fence — the fixture below would prove nothing");
}

test("THE FENCE LEDGER SAYS UNKNOWN, NEVER FREE, ABOUT A LANE WHOSE CARD IT CANNOT READ", () => {
  // KILLED BY: `if (card === undefined) continue` in `fenceLedger` —
  // the sentence this module shipped, and the second implementation of
  // the one `lanes.ts` was rejected for. Dropping the lane makes every
  // slug it reserves come back FREE, four lines below the same report's
  // own lane list saying "no live card — board says unknown" about it.
  const blind = ["T-901"];
  const real = readableLane();
  const ctx = context({ porcelain: BLIND_PORCELAIN(blind, real.id) });

  // THE FIXTURE IS PROVED BEFORE IT IS SPENT: the blind id really is
  // unreadable here and the real one really is readable, or the two
  // halves below are both vacuous.
  expect(ctx.cards.has("T-901"), "T-901 names a card, so this fixture is not blind").toBe(false);
  expect(ctx.lanes.map((l) => l.taskId).sort()).toEqual([...blind, real.id].sort());

  const rows = fenceLedger(ctx);
  const held = rows.filter((r) => r.heldBy.startsWith(real.id));
  const unknown = rows.filter((r) => r.heldBy.startsWith("UNKNOWN"));

  // POSITIVE CONTROL FIRST: the readable lane's own slugs ARE reported
  // held and are named. Without this, "nothing says FREE" is satisfied
  // by a ledger that answers nothing at all.
  expect(
    held.map((r) => r.slug).sort(),
    "the readable lane holds nothing, so every absence below proves nothing",
  ).toEqual(real.touches.filter((t) => rows.some((r) => r.slug === t)).sort());

  // THE CARD'S FIRST CRITERION: no row that is not explicitly held may
  // read FREE, no row is dropped, and the word is the parser's.
  expect(unknown.length, "no row says UNKNOWN, so the blind lane vanished again").toBeGreaterThan(0);
  expect(rows.map((r) => r.heldBy)).not.toContain("FREE");
  for (const row of rows) {
    expect(row.unknownFrom).toEqual(blind);
    expect(row.heldBy, `${row.slug} does not name the lane it could not read`).toContain("T-901");
  }
  expect(unknown[0]?.heldBy).toContain("cannot be ruled free");
  // AND THE HELD ROWS CARRY THE RESIDUAL TOO — the parser's `fenced`
  // reason names the blind lane beside a proved overlap for the same
  // reason: a true HELD is still a partial answer.
  expect(held[0]?.heldBy).toContain("and UNKNOWN besides");

  // THE NEGATIVE CONTROL THE CARD DEMANDS BY NAME: "construct the held
  // state, see the tool say HELD, then remove the hold and see it say
  // FREE. A fix that only ever prints HELD passes every test written
  // from this card's text." One lane removed, nothing else changed.
  const sighted = fenceLedger(context({ porcelain: BLIND_PORCELAIN([], real.id) }));
  expect(sighted.map((r) => r.heldBy)).toContain("FREE");
  expect(sighted.filter((r) => r.heldBy.startsWith("UNKNOWN"))).toEqual([]);
  for (const row of sighted) expect(row.unknownFrom).toEqual([]);
});

test("and the UNKNOWN clause agrees in number with the lanes it names", () => {
  // KILLED BY: hard-coding either form. The sibling defect this card
  // also fixes is exactly this, in `lanes.ts`'s `fenced` residual, where
  // the mutation from "it" to "them" killed zero bodies.
  const real = readableLane();
  const one = fenceLedger(context({ porcelain: BLIND_PORCELAIN(["T-901"], real.id) }));
  const two = fenceLedger(context({ porcelain: BLIND_PORCELAIN(["T-901", "T-902"], real.id) }));

  const oneRow = one.find((r) => r.heldBy.startsWith("UNKNOWN"))?.heldBy ?? "";
  const twoRow = two.find((r) => r.heldBy.startsWith("UNKNOWN"))?.heldBy ?? "";
  expect(oneRow).toContain("that fence could not be expanded");
  expect(oneRow).not.toContain("those fences");
  expect(twoRow).toContain("those fences could not be expanded");
  expect(twoRow).not.toContain("that fence");
  expect(twoRow).toContain("T-901, T-902");
});

test("the LEDGER SAYS WHAT IT IS ANSWERING, and the slugs that are not independent are DERIVED", () => {
  // KILLED BY: dropping the qualifier, or hard-coding `C-11`. The
  // architect took a FREE column here for a dispatch verdict on
  // 2026-08-26 and nearly put T-112 on ground the live T-141 held; the
  // display is what misled, and the `--task` half answers correctly.
  const ctx = context({});
  const rendered = render(stateReport(ctx));
  expect(rendered).toContain("IT IS KEYED BY SLUG NAME AND IS NOT A DISPATCH VERDICT");
  expect(rendered).toContain("`brief.mjs --task T-NNN`");
  expect(unstampedLines(rendered)).toEqual([]);

  // THE SHARED-COMPONENT FACT IS A JOIN OVER THE REGISTRY, not a
  // sentence about C-11. Two sides that share no constant: the
  // derivation walks `touch_slugs`, and this body re-walks the
  // component files independently. T-163 (@human, 2026-08-30) took the
  // registry's ONLY doubly-claimed component to no slugs, so the live
  // join is now the RULED NEGATIVE — asserted, with the ledger's own
  // negative sentence, so the ruling stays ruled rather than merely
  // tolerated (the T-163-s2 rewrite; select-board.test.ts is the model).
  const shared = slugsSharingComponents(ctx.slugs);
  const expected = new Map<string, string[]>();
  for (const comp of components(repoRoot)) {
    for (const slug of comp.slugs) {
      expected.set(comp.id, [...(expected.get(comp.id) ?? []), slug].sort());
    }
  }
  const wanted = [...expected].filter(([, s]) => s.length > 1).map(([c]) => c).sort();
  expect(shared.map((s) => s.component).sort()).toEqual(wanted);
  expect(wanted, "a component is claimed by two slugs — the T-163 ruling has been undone").toEqual([]);
  expect(rendered).toContain("no component is claimed by two slugs today");
  expect(rendered).not.toContain("both expand through");
  // THE MECHANISM MOVED, IT DID NOT LEAVE: on a synthetic map still
  // carrying the shape — one component, two slugs — the join finds the
  // pair and sorts it, so the derivation is proven against a populated
  // subject rather than two empty lists agreeing.
  const synthShared = slugsSharingComponents(
    new Map([
      ["beta", ["C-70"]],
      ["alpha", ["C-70"]],
      ["app-map", ["C-12"]],
    ]),
  );
  expect(synthShared).toEqual([{ component: "C-70", slugs: ["alpha", "beta"] }]);
});

test("`DISJOINT` is the same class of word as `FREE` — ROW 5's verdicts carry the blind lane", () => {
  // KILLED BY: leaving `deriveFence`'s pairwise verdict lines alone.
  // The row already printed "no live card, fence UNKNOWN" for the lane
  // and then printed DISJOINT verdicts underneath it that had never
  // been compared against it — the card's second criterion, applied to
  // the word the parser's own module refuses to fold `unusable` into.
  const real = readableLane();
  const ctx = context({ taskId: real.id, porcelain: BLIND_PORCELAIN(["T-901", "T-902"], real.id) });
  const { recs } = assembleBrief(ctx);
  const rendered = render(recs);
  expect(rendered).toContain("T-901: no live card, fence UNKNOWN");
  expect(rendered).toContain("EVERY VERDICT ABOVE IS PARTIAL");
  expect(rendered).toContain("no line above rules out an overlap with those lanes");
  // AND THE "FEWER THAN TWO" LINE SAYS WHICH FEWER IT IS: there ARE
  // three lanes here and two of them could not be expanded.
  expect(rendered).toContain("fewer than two READABLE fences to compare");
  expect(rendered).not.toContain("fewer than two fences to compare");
  // T-143's VERDICT, correction one: the clause agrees in NUMBER with
  // the list it names — the mutant "is live" over two lanes killed
  // nothing before these two pins existed, and lanes.ts's sibling
  // carries the same rule in the same words.
  expect(rendered).toContain("T-901, T-902 are live");
  expect(rendered).toContain("a claim about them");
  const oneBlind = render(
    assembleBrief(context({ taskId: real.id, porcelain: BLIND_PORCELAIN(["T-901"], real.id) })).recs,
  );
  expect(oneBlind).toContain("T-901 is live");
  expect(oneBlind).toContain("a claim about it");

  // POSITIVE CONTROL: with no blind lane the residual is gone and the
  // plain sentence is back, so the clause is a function of the fixture
  // and not a constant this command always prints.
  const sighted = render(assembleBrief(context({ taskId: real.id, porcelain: BLIND_PORCELAIN([], real.id) })).recs);
  expect(sighted).not.toContain("EVERY VERDICT ABOVE IS PARTIAL");
  expect(sighted).toContain("fewer than two fences to compare");
});

test("A SUFFIXED LANE BRANCH JOINS TO ITS OWN CARD IN THE `--state` LANE LIST, NOT ITS PARENT'S", () => {
  // T-143's class, instances FOUR and FIVE (2026-08-29): `--write-fence`
  // stamped T-153's `app-shell` fence into the T-153-s5 lane, and the
  // T-153-s2 lane before it ran its WHOLE arc under its parent's
  // manifest — the armed hook enforcing a fence nobody dispatched.
  // `laneSpellings` and `normaliseTaskId` were fixed at that seat and
  // pinned in `lane-fence.spec.ts`; THIS body is the half that pin does
  // not reach. `laneWorktrees` carries its OWN copy of `T-${m[1]}` — the
  // second implementation of the id join, and the one the `--state`
  // ledger is derived from — and no body drove it with a suffixed branch.
  //
  // KILLED BY: truncating the id in `laneWorktrees` (the unsuffixed
  // reading `T-${m[1].split("-")[0]}`), which hands the ledger the
  // PARENT's fence and prints FREE for every slug the child reserves and
  // HELD for every slug the parent does.
  const spellings = laneSpellings(conventions());
  const suffixed = [
    "worktree /Users/x/nputer",
    "HEAD 1111111111111111111111111111111111111111",
    "branch refs/heads/main",
    "",
    "worktree /Users/x/nputer-T-153-s2",
    "HEAD 2222222222222222222222222222222222222222",
    "branch refs/heads/task/T-153-s2-clock-restore-guard",
    "",
  ].join("\n");
  const lanes = laneWorktrees(suffixed, spellings);
  expect(lanes.map((l) => l.taskId)).toEqual(["T-153-s2"]);

  // POSITIVE CONTROL: the unsuffixed spelling of the SAME parent still
  // reads as the parent, so this is a preference for the suffixed
  // reading and not a function that appends `-s2` to everything.
  const plain = laneWorktrees(
    suffixed.replace("T-153-s2-clock-restore-guard", "T-153-inotify-sentinels"),
    spellings,
  );
  expect(plain.map((l) => l.taskId)).toEqual(["T-153"]);

  // AND THE LEDGER IS DERIVED OFF THAT JOIN, which is where the cost
  // landed: the two cards declare DIFFERENT fences, so a truncated id
  // prints the parent's holdings over the child's ground.
  const ctx = context({ porcelain: suffixed });
  const child = ctx.cards.get("T-153-s2");
  const parent = ctx.cards.get("T-153");
  expect(child, "T-153-s2 names no card here, so this body proves nothing").toBeDefined();
  expect(parent, "T-153 names no card here, so this body proves nothing").toBeDefined();
  const childFence = fieldList(child?.fields ?? {}, "touches");
  const parentFence = fieldList(parent?.fields ?? {}, "touches");
  expect(
    childFence,
    "the two cards declare the SAME fence, so a truncated id would be invisible here",
  ).not.toEqual(parentFence);
  const heldBy = new Map(fenceLedger(ctx).map((r) => [r.slug, r.heldBy]));
  for (const slug of childFence) expect(heldBy.get(slug)).toBe("T-153-s2");
  for (const slug of parentFence) {
    if (childFence.includes(slug)) continue;
    expect(heldBy.get(slug), `${slug} is the PARENT's ground and the child is not holding it`).toBe(
      "FREE",
    );
  }
});

/* ────────────────────────────────────────────────────────────────────
 * T-179 — A LANE IS A SIBLING OF THE REPOSITORY, NOT OF WHOEVER
 * DISPATCHED IT.
 *
 * `docs/CONVENTIONS.md` publishes the lane worktree as `../nputer-T-NNN`.
 * Row 4 resolved that RELATIVE spelling against `ctx.root` — the checkout
 * the command ran in — and printed the answer under the heading
 * "absolute, per lane-protocol rule three". From a NESTED worktree it
 * landed one level inside `.claude/worktrees/`, which is the case rule
 * three exists to forbid, announced under the rule it broke. The
 * architect/integrator seat runs from a nested worktree by construction
 * in this harness, so every brief it emitted on 2026-08-30 carried it;
 * four executors read it, four reported it, and the dispatching seat
 * corrected each by hand. A discipline was standing in for a
 * construction.
 *
 * The two bodies below are the construction and its SWEEP. Neither could
 * fail before the fix by failing to import — both drive behaviour that
 * the pre-fix module had, and had wrong.
 * ──────────────────────────────────────────────────────────────────── */

interface NestedShapes {
  /** the mkdtemp root, for the teardown */
  dir: string;
  /** the repository's MAIN worktree */
  main: string;
  /** a worktree INSIDE it — the architect/integrator seat's shape in this harness */
  nested: string;
}

/**
 * A repository whose main worktree holds a SECOND worktree inside itself.
 * That shape is the whole fixture: everything this card is about is
 * invisible from a checkout that is its own repository root, which is why
 * the defect survived a suite that ran only from one.
 *
 * The nested entry is DETACHED on purpose. A lane-shaped branch would put
 * it in the lane list and move rows that have nothing to do with this
 * card; detached, the two runs differ only in where they were made from.
 */
function nestedShapes(): NestedShapes {
  // REALPATH, AND IT IS LOAD-BEARING. `os.tmpdir()` is `/var/folders/…` on
  // macOS and `/var` is a symlink to `/private/var`, so git reports the
  // resolved spelling while `mkdtemp` hands back the symlinked one — and
  // every path comparison in this body would then be comparing two names
  // for one directory. Measured here first: the fixture's own checkout
  // failed to match its porcelain entry, so the brief listed BOTH
  // worktrees as "not yours" in both runs and the sweep's positive
  // control went quiet.
  const dir = realpathSync(mkdtempSync(path.join(os.tmpdir(), "t179-nested-")));
  const main = path.join(dir, "nputer");
  mkdirSync(main);
  const tar = path.join(dir, "tree.tar");
  writeFileSync(
    tar,
    execFileSync("git", ["-C", repoRoot, "archive", "HEAD"], { maxBuffer: 512 * 1024 * 1024 }),
  );
  execFileSync("tar", ["-x", "-f", tar, "-C", main]);
  fixtureGit(main, ["init", "--initial-branch=main", "--quiet"]);
  fixtureGit(main, ["add", "-A"]);
  // Two `Checkpoint:` commits, for the same reason `refShapes` needs them:
  // the base rule reads the newest out of the first-parent log.
  fixtureGit(main, ["commit", "--quiet", "-m", "Checkpoint: fixture base"]);
  fixtureGit(main, ["commit", "--quiet", "--allow-empty", "-m", "Checkpoint: fixture tip"]);
  const nested = path.join(main, ".claude", "worktrees", "nested-seat");
  fixtureGit(main, ["worktree", "add", "--quiet", "--detach", nested, "HEAD"]);
  return { dir, main, nested };
}

/** The VALUE half of every rendered line — the provenance carries a clock
 *  by design, so comparing whole lines would compare two clocks. */
function values(rendered: string): string[] {
  return rendered
    .trimEnd()
    .split("\n")
    .map((l) => l.split("  <- ")[0] ?? l);
}

test("THE REPOSITORY'S ROOT IS DERIVED FROM GIT, and a repository with no working tree is REFUSED", () => {
  // KILLED BY: `mainWorktree` returning `entries[entries.length - 1]`, by
  // it dropping the `bare` refusal, and by `parseWorktreePorcelain`
  // discarding git's `bare` marker. Every expectation below is a VALUE,
  // never a name — a body that asserted only that the module exports
  // something called `mainWorktree` is satisfied by an unused import.
  const main = mainWorktree(PORCELAIN_FIXTURE);
  expect(main.path, "git lists the MAIN worktree first, and that is the repository's root").toBe(
    "/Users/x/nputer",
  );
  expect(main.reason).toBe("");
  expect(main.via).toContain("git worktree list --porcelain");

  // POSITIVE CONTROL FOR THE FIRST-ENTRY CLAIM. The fixture holds four
  // more worktrees, so "it answered /Users/x/nputer" is a choice among
  // five and not the only path there was to hand back.
  const entries = parseWorktreePorcelain(PORCELAIN_FIXTURE);
  expect(entries.length).toBeGreaterThan(1);
  expect(entries.map((e) => e.path)).toContain("/Users/x/nputer-T-901");
  expect(entries.every((e) => e.bare)).toBe(false);

  // THE REFUSALS — the tool's own established idiom, and better than a
  // confident wrong path. A BARE repository has no working tree for a
  // sibling to be a sibling OF, and git says so in one word.
  const bare = mainWorktree(["worktree /Users/x/nputer.git", "bare", ""].join("\n"));
  expect(parseWorktreePorcelain(["worktree /Users/x/nputer.git", "bare", ""].join("\n"))[0]?.bare)
    .toBe(true);
  expect(bare.path, "a bare repository is not a checkout, and this must not answer with one").toBe(
    "",
  );
  expect(bare.reason).toContain("BARE");
  expect(bare.reason).toContain("/Users/x/nputer.git");

  const empty = mainWorktree("");
  expect(empty.path).toBe("");
  expect(empty.reason).toContain("named no worktree");
  // AND IT SAYS WHY IT WILL NOT FALL BACK, because the fallback IS the defect.
  expect(empty.reason).toContain("the checkout it ran in");

  // THE CONTAINMENT TEST RULE THREE IS ABOUT, both directions. The sibling
  // is OUT; the nested path the brief used to print is IN; and the root
  // itself is IN, because the repository is not a sibling of itself.
  expect(insideRepository("/Users/x/nputer", "/Users/x/nputer-T-179")).toBe(false);
  expect(
    insideRepository("/Users/x/nputer", "/Users/x/nputer/.claude/worktrees/nputer-T-179"),
    "this is the exact path the brief printed under the heading citing rule three",
  ).toBe(true);
  expect(insideRepository("/Users/x/nputer", "/Users/x/nputer")).toBe(true);
});

test("THE SWEEP: no derived row moves when only the dispatching checkout moves, and the movers are named", () => {
  // KILLED BY: `path.resolve(ctx.root, worktree)` in `deriveLane` — the
  // sentence this card removes. MEASURED AGAINST IT BEFORE THE ZERO BELOW
  // WAS WRITTEN DOWN: the fixture's own tar is a checkout of the pre-fix
  // tree, and running ITS `brief.mjs` over the same two roots produced a
  // third moved line, `worktree (absolute, per lane-protocol rule three)`,
  // naming `<main>/.claude/worktrees/nputer-T-133`.
  //
  // THE SWEEP IS THE DELIVERABLE, NOT THE ROW. Row 4's worktree was one
  // member of a class — "a path this command derives by resolving a
  // RELATIVE spelling against whoever ran it" — and a class is a class
  // until somebody looks. This body looks at EVERY row at once by asking
  // one question of the whole rendered brief: what changed when nothing
  // changed but the directory the command was run from?
  const fx = nestedShapes();
  try {
    const id = "T-133";
    const run = (root: string) =>
      spawnSync(process.execPath, [CLI, "--task", id, "--root", root], {
        cwd: repoRoot,
        encoding: "utf8",
      });
    const fromMain = run(fx.main);
    const fromNested = run(fx.nested);
    expect([EXIT.CLEAN, EXIT.FOUND], fromMain.stderr ?? "").toContain(fromMain.status);
    expect([EXIT.CLEAN, EXIT.FOUND], fromNested.stderr ?? "").toContain(fromNested.status);

    // PRE-CONDITION, ASSERTED RATHER THAN ASSUMED: the second checkout
    // really is INSIDE the first. Without it every zero below is the zero
    // a suite gets for running the same command twice.
    expect(
      insideRepository(fx.main, fx.nested),
      "the fixture's second checkout is not nested, so this body is comparing one shape with itself",
    ).toBe(true);

    // ── THE ALLOWLIST — the rows that are ABOUT the asker, each with the
    //    reason it may move. Every other moved line is a finding.
    const mayMove: { prefix: string; why: string }[] = [
      {
        prefix: "repository: ",
        why: "this row names the checkout the command ran in, and says so in its own provenance",
      },
      {
        prefix: "  another checkout exists and is not yours: ",
        why: "`yours` is relative to the asker by construction — row 12 lists the OTHER checkouts",
      },
      {
        prefix: "  port ",
        why: "a live read of the MACHINE, not of any checkout: two reads seconds apart may differ",
      },
    ];
    const mainVals = values(fromMain.stdout);
    const nestedVals = values(fromNested.stdout);
    expect(
      mainVals.length,
      "the two runs printed different numbers of lines, so a row appeared or vanished with the checkout",
    ).toBe(nestedVals.length);
    const moved = mainVals
      .map((line, i) => ({ line, other: nestedVals[i] ?? "" }))
      .filter((p) => p.line !== p.other);
    const unexplained = moved.filter((p) => !mayMove.some((a) => p.line.startsWith(a.prefix)));
    expect(
      unexplained.map((p) => `${p.line}\n   became ${p.other}`),
      "a DERIVED row moved when only the dispatching directory moved. A fact about the repository " +
        "that answers differently depending on who asked is the defect T-179 removed from row 4, " +
        "arriving in another row",
    ).toEqual([]);

    // POSITIVE CONTROLS FOR THE ALLOWLIST, so an empty `unexplained` is
    // not the emptiness of a comparison that never ran. The two STRUCTURAL
    // entries must actually have fired; the port entry is a stated safety
    // valve for a machine fact and is not required to.
    expect(
      moved.map((p) => p.line).filter((l) => l.startsWith("repository: ")),
      "the two runs report the same repository row, so they were made from the same place",
    ).toHaveLength(1);
    expect(
      moved.map((p) => p.line).filter((l) => l.startsWith("  another checkout exists")),
      "neither run saw a checkout that was not its own, so the fixture has one worktree, not two",
    ).not.toEqual([]);

    // ── AND THE VALUE ITSELF, because the sweep alone cannot see a row
    //    that is equally wrong from both checkouts — which the `create:`
    //    line WAS: it carried the bare relative `../nputer-T-133`, and a
    //    pasted relative path lands wherever the pasting shell happens to
    //    sit. Two sides sharing no constant: the producer derives the base
    //    from git, this body derives it from the fixture's own layout.
    const spelling = laneSpellings(conventions()).worktreePattern.replace("T-NNN", id);
    const sibling = path.resolve(fx.main, spelling);
    const row4 = (out: string) =>
      values(out).find((l) => l.includes("worktree (absolute, per lane-protocol rule three)")) ?? "";
    expect(row4(fromMain.stdout), "row 4 emitted no worktree line at all").not.toBe("");
    for (const [where, out] of [
      ["the main worktree", fromMain.stdout],
      ["a nested worktree", fromNested.stdout],
    ] as const) {
      expect(row4(out), `dispatched from ${where}`).toBe(
        `  worktree (absolute, per lane-protocol rule three): ${sibling}`,
      );
      expect(
        insideRepository(fx.main, sibling),
        "the path row 4 prints is INSIDE the repository, under a heading citing the rule that " +
          "forbids exactly that — lane-protocol rule three",
      ).toBe(false);
      // THE COMMAND IS THE ACT AND THE ROW IS ONLY THE REPORT. Rule three's
      // own remedy is "STATE THE PATH ABSOLUTELY", and its own stated
      // failure is a relative path in this very command.
      const create = values(out).find((l) => l.startsWith("  create: ")) ?? "";
      expect(create, `dispatched from ${where}: no create command was emitted`).not.toBe("");
      expect(create, `dispatched from ${where}`).toContain(`git worktree add ${sibling} `);
      expect(
        create,
        "the pasted command still carries the relative spelling, which git resolves against " +
          "whatever directory the dispatching shell sits in",
      ).not.toContain(`add ${spelling} `);
    }

    // ── THE CLASS'S SECOND MEMBER, AND THE ONE THAT WRITES. `--write-fence`
    //    resolved its argument against `ctx.root` too, so a dispatcher
    //    pasting the published spelling from a nested worktree aimed the
    //    manifest one directory inside `.claude/worktrees/`. No such
    //    worktree exists here, so the command refuses — and what this pins
    //    is WHICH PATH it refused about.
    const wf = spawnSync(
      process.execPath,
      [CLI, "--task", id, "--root", fx.nested, "--write-fence", spelling],
      { cwd: repoRoot, encoding: "utf8" },
    );
    const wfOut = `${wf.stdout}\n${wf.stderr}`;
    expect(wfOut, "--write-fence aimed at some path other than the repository's own sibling").toContain(
      sibling,
    );
    expect(
      wfOut,
      "--write-fence aimed INSIDE the repository, which is where a manifest becomes a second copy " +
        "of the project to everything that walks the tree",
    ).not.toContain(path.resolve(fx.nested, spelling));
  } finally {
    removeGitFixture(fx.dir, "nestedShapes");
  }
});
