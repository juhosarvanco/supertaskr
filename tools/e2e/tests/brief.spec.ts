import { execFileSync, spawnSync } from "node:child_process";
import {
  closeSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  readFileSync,
  realpathSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { parse as parseYaml } from "yaml";
import { repoRoot } from "../preflight";
import { NO_BACKGROUND_MAINTENANCE, removeGitFixture } from "./git-fixture";
import { conventionsText, liveTaskCards, trackedFiles } from "../scripts/docs-scan.mjs";
import {
  BASE_TOKEN,
  DERIVERS,
  DISPATCH_STEPS,
  DispatchLaneFinding,
  EXIT,
  PIPE_BUFFER_BYTES,
  SPAWNSYNC_DEFAULT_MAXBUFFER,
  architectureText,
  assembleBrief,
  boardCensus,
  ceremonyRows,
  citedOpening,
  components,
  contractRows,
  context,
  createLaneArgv,
  dispatchLanePlan,
  dispatchSpellings,
  docsNamed,
  fenceLedger,
  fenceOverlaps,
  fieldList,
  findableNeedle,
  frontmatterFields,
  insideRepository,
  integrationRefCandidates,
  laneScratchName,
  laneScratchStem,
  laneSpellings,
  laneWorktrees,
  lanePort,
  liveProv,
  mainWorktree,
  marginRecs,
  namedDisciplines,
  note,
  packageCommands,
  parseWorktreePorcelain,
  readAdditions,
  readDoc,
  manifestVerdict,
  readSubtractions,
  render,
  resolveIntegrationRef,
  roleText,
  runDispatchLane,
  slugMapFromFields,
  slugMapFromProse,
  slugsSharingComponents,
  stampCard,
  stampVerdict,
  standingGates,
  stateReport,
  treeProv,
  unstampedLines,
  value,
  withMargin,
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

/* ════════════════════════════════════════════════════════════════════
 * THE TWO LONG PASSAGES ARE CITED, NOT TRANSCRIBED (T-225-s2, taking
 * `T-215-s4`).
 *
 * docs/CONVENTIONS.md's THE LANE PROTOCOL bullet and
 * method/lane-protocol.md's rule four were 10,155 and 13,078 bytes at
 * `09526da` — 23,233 of an 82,476-byte `--task --state --full` answer
 * against a 65,536-byte line, and rule four printed in EVERY `--task`
 * brief rather than only under `--full`. **THE ROW SET GREW WITH THE
 * DOCUMENTS**: every correction to either passage pushed the arm further
 * past a buffer, for text no dispatched session could act on differently
 * for having been handed the bytes instead of the address.
 *
 * THE EXTRACTIONS BELOW ARE THIS FILE'S OWN, not the module's. The
 * derivation computes on one implementation and the assertion on
 * another, which is this file's standing shape — a body that measured the
 * passage with the same function that printed it would agree with itself
 * whatever either of them did.
 * ════════════════════════════════════════════════════════════════════ */

/** rule four of method/lane-protocol.md, flattened — a SECOND reader. */
function ruleFourFlat(): string {
  const lines = readDoc("method/lane-protocol.md", repoRoot).split(/\r?\n/);
  const start = lines.findIndex((l) => l.startsWith("4. "));
  expect(start, "method/lane-protocol.md has no rule four for this body to measure").toBeGreaterThan(
    -1,
  );
  const held: string[] = [lines[start] as string];
  for (let i = start + 1; i < lines.length; i += 1) {
    const line = lines[i] as string;
    if (/^\d+[a-z]?\. /.test(line) || line.startsWith("## ")) break;
    held.push(line);
  }
  return held.join(" ").replace(/\s+/g, " ").trim();
}

/** the LANE PROTOCOL bullet of docs/CONVENTIONS.md, flattened — likewise. */
function laneBulletFlat(): string {
  const bullets = conventions()
    .split(/\n(?=- )/)
    .filter((b) => b.startsWith("- ") && b.includes("THE LANE PROTOCOL"));
  expect(bullets.length, "docs/CONVENTIONS.md no longer has exactly one LANE PROTOCOL bullet").toBe(
    1,
  );
  return (bullets[0] as string).replace(/\s+/g, " ").trim();
}

test("THE TWO LONG PASSAGES ARE CITED BY ADDRESS, NOT TRANSCRIBED — and the address is one this repository answers", () => {
  // KILLED BY: putting either transcription back (the deep-phrase absence
  // below reds), by a citation whose byte figure drifts from the passage
  // it names, by an opening that is not the passage's own, or by a needle
  // the wrapped document does not contain — which is what a phrase search
  // across a 70-column hard wrap silently is.
  const rendered = render(assembleBrief(context({ taskId: "T-133", full: true })).recs);
  const lines = rendered.split("\n");

  const passages = [
    {
      key: "  never touch the integration branch: ",
      file: "method/lane-protocol.md",
      source: "method/lane-protocol.md rule four",
      flat: ruleFourFlat(),
    },
    {
      key: "  lane bullet: ",
      file: "docs/CONVENTIONS.md",
      source: "docs/CONVENTIONS.md lane bullet",
      flat: laneBulletFlat(),
    },
  ];

  for (const p of passages) {
    const line = lines.find((l) => l.startsWith(p.key)) ?? "";
    expect(line, `no line opens with ${JSON.stringify(p.key.trim())}`).not.toBe("");
    expect(line, `${p.source}: the row does not say it is citing rather than quoting`).toContain(
      "CITED, NOT TRANSCRIBED",
    );
    expect(line, `${p.source}: the citation does not name its source`).toContain(p.source);

    // THE SIZE IS THE PASSAGE'S OWN, measured here by a second reader. A
    // citation that told a reader the wrong weight would send them off
    // for something other than what it named.
    expect(
      line,
      `${p.source}: the byte figure is not this passage's flattened size at this ref`,
    ).toContain(`${Buffer.byteLength(p.flat, "utf8")} bytes flattened at this ref`);

    // THE OPENING IS THE PASSAGE'S OWN CAPITALS — the SYMBOL a reader
    // searches for, which is what docs/CONVENTIONS.md's A CITATION NAMES
    // A SYMBOL, NOT A LINE asks for in place of a coordinate.
    const opening = citedOpening(p.flat);
    expect(opening.length, `${p.source}: the derived opening is empty`).toBeGreaterThan(8);
    expect(line, `${p.source}: the citation quotes an opening that is not the passage's`).toContain(
      JSON.stringify(opening),
    );

    /**
     * AND THE NEEDLE IS ONE THIS REPOSITORY ANSWERS. It is spelled into a
     * command a reader will paste, so this body RUNS the search rather
     * than reading the string: every governing document here is wrapped
     * at about 70 columns, and a phrase search is a search for a line
     * break nobody chose.
     */
    const printed = /READ IT: command grep -n "([^"]+)" (\S+)/.exec(line);
    expect(printed, `${p.source}: the citation prints no command to read it with`).not.toBeNull();
    const needle = (printed as RegExpExecArray)[1] as string;
    const file = (printed as RegExpExecArray)[2] as string;
    expect(file, `${p.source}: the command names a different file from the citation`).toBe(p.file);
    const hits = execFileSync(
      "git",
      [...NO_BACKGROUND_MAINTENANCE, "grep", "-c", "-F", needle, "--", file],
      { cwd: repoRoot, encoding: "utf8" },
    ).trim();
    expect(
      Number(hits.split(":").pop()),
      `${p.source}: the needle this citation prints is not findable in the file it names — a ` +
        "phrase search across a hard wrap returns nothing at exit 1, which reads like a " +
        "refutation rather than a miss",
    ).toBeGreaterThan(0);

    /**
     * THE TRANSCRIPTION IS GONE, and the phrase asked for is DEEP inside
     * the passage rather than at its head: the citation legitimately
     * quotes the opening, so an absence check anchored there would red on
     * the citation itself.
     */
    const at = Math.floor(p.flat.length * 0.6);
    const deep = p.flat.slice(at, at + 60);
    expect(deep.length, `${p.source}: no deep phrase to check for`).toBe(60);
    expect(
      rendered,
      `${p.source}: the brief still carries the passage's own text, so it is transcribing it`,
    ).not.toContain(deep);

    /**
     * THE POSITIVE CONTROL. "This text is absent" is satisfied equally by
     * absent-because-cited, absent-because-misspelled and
     * absent-because-nothing-was-checked, and only the first is the
     * property (docs/CONVENTIONS.md, A NEGATIVE ASSERTION NEEDS A
     * POSITIVE CONTROL). So the same phrase is looked for in a line built
     * the way the command used to build it.
     */
    expect(
      `${p.key}${p.flat}`,
      `${p.source}: the deep phrase is not in the passage either, so its absence above proves ` +
        "nothing about the brief",
    ).toContain(deep);
  }

  /**
   * AND THE NEEDLE BUILDER ITSELF IS DRIVEN, one side only: a document
   * that WRAPS the opening yields a shorter needle than one that does
   * not, which is the whole construction. Without this the extension
   * loop is a green that never met a line break.
   */
  const opening = "ALPHA BETA GAMMA DELTA";
  expect(findableNeedle(`4. **${opening}** and so on\n`, opening)).toBe(opening);
  expect(
    findableNeedle(`4. **ALPHA BETA\n   GAMMA DELTA** and so on\n`, opening),
    "the needle builder handed back a phrase that spans a line break, which is the miss that " +
      "reads like a refutation",
  ).toBe("ALPHA BETA");

  process.stdout.write(
    `\n  brief CITED: ${passages
      .map((p) => `${p.source} ${Buffer.byteLength(p.flat, "utf8")} bytes`)
      .join("; ")} — by address, in an answer of ${Buffer.byteLength(rendered, "utf8")} bytes.\n`,
  );
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

/* ════════════════════════════════════════════════════════════════════
 * THE MARGIN, DISCLOSED IN THE COMMAND'S OWN OUTPUT (T-225, decision 3
 * — the shape `T-167-s5` landed for the graph budget).
 *
 * The margin was already computed, accurately, by brief-flush.spec.ts.
 * A dispatcher who never runs the e2e lane never met it, and a triage
 * sitting then chose which cards to promote BY ARITHMETIC without
 * anything in this command's output saying a ceiling was in play. These
 * bodies are about the difference between a measurement that exists and
 * one that reaches the person holding the decision.
 * ════════════════════════════════════════════════════════════════════ */

test("THE MARGIN IS DISCLOSED IN THE COMMAND'S OWN OUTPUT, and the size it declares is the size it is", () => {
  // KILLED BY: dropping the `withMargin` wrapper at the foot of
  // `brief.mjs`, or by disclosing a size that is not this answer's — the
  // block measures the WHOLE output including itself, at a fixed point,
  // so a reader who checks it with `wc -c` gets the same number. A
  // disclosure a reader has to adjust is a figure with no keeper.
  const dir = mkdtempSync(path.join(os.tmpdir(), "t225-margin-"));
  try {
    const out = path.join(dir, "dispatch.txt");
    const run = spawnSync("/bin/sh", ["-c", `'${process.execPath}' '${CLI}' --dispatch > '${out}'`], {
      cwd: repoRoot,
      encoding: "utf8",
    });
    expect(run.status, run.stderr).toBe(EXIT.CLEAN);
    const text = readFileSync(out, "utf8");
    const actual = statSync(out).size;

    const line = text.split("\n").find((l) => l.startsWith("output: ")) ?? "";
    expect(line, "the command emitted no margin line at all").not.toBe("");
    const declared = Number.parseInt(line.slice("output: ".length), 10);
    expect(declared, `the margin declares ${declared} bytes and the answer is ${actual}`).toBe(
      actual,
    );
    expect(line).toContain(`of ${PIPE_BUFFER_BYTES} bytes`);

    // AND THE DISCLOSED BUFFER NAMES ITS READER IN THE LIVE OUTPUT, not
    // only in the module (T-225-s1). A denominator whose owner lives in a
    // comment never reaches the dispatcher holding the decision, which is
    // the argument for this whole block.
    const buf = text.split("\n").find((l) => l.startsWith(`buffer: ${PIPE_BUFFER_BYTES} bytes`)) ?? "";
    expect(buf, "the command disclosed a buffer figure and named no reader for it").toContain(
      "the floor for a reader that takes ONE fixed-size read and stops",
    );

    // AND IT IS AT THE TOP, WHICH IS THE WHOLE POINT. A truncation eats
    // the TAIL, so a margin line under an answer too big to arrive is
    // lost in the one case it was written for.
    const lines = text.split("\n");
    expect(lines.indexOf(line)).toBeLessThan(
      lines.findIndex((l) => l.includes("WHAT IS DISPATCHABLE")),
    );

    // THE DENSITY LINE NAMES ITS DENOMINATOR, and the denominator is the
    // cards this verbosity SPELLS OUT — the census line's own second
    // half, so the two cannot drift into different answers.
    const per = text.split("\n").find((l) => l.startsWith("per listed card: ")) ?? "";
    const ruled = text.split("\n").find((l) => l.startsWith("ruled: ")) ?? "";
    expect(per, "no per-card density was disclosed beside the size").not.toBe("");
    const spelled = /— (\d+) card\(s\) spelled out/.exec(ruled)?.[1] ?? "";
    expect(spelled, "the census line named no spelled-out count").not.toBe("");
    expect(Number(/per listed card: (\d+) bytes/.exec(per)?.[1])).toBe(
      Math.round(actual / Number(spelled)),
    );

    /**
     * AND THE BLOCK SAYS WHAT IT ITSELF COST (T-225-s2, taking
     * `T-225-s8`). This disclosure spends the resource it discloses —
     * measured at `482be56` the UNDER arm's block went 342 → 1,141 bytes
     * and the OVER arm's 500 → 2,183 when each caller got its own line —
     * so the split is stated rather than left for somebody to find in a
     * size report. **THE TWO HALVES MUST ADD UP TO THE DECLARED FIGURE**,
     * which is what makes it a measurement instead of an adjective: the
     * derivation, plus the block, is the number `wc -c` gives.
     */
    const split = text.split("\n").find((l) => l.startsWith("this block: ")) ?? "";
    expect(split, "the block disclosed a size and never said how much of it was itself").not.toBe(
      "",
    );
    const halves = /this block: (\d+) of those bytes are this disclosure and (\d+) are the/.exec(
      split,
    );
    expect(halves, `the block's own cost line does not carry both halves: ${split}`).not.toBeNull();
    const blockBytes = Number((halves as RegExpExecArray)[1]);
    const derivationBytes = Number((halves as RegExpExecArray)[2]);
    expect(
      blockBytes + derivationBytes,
      "the block's own cost and the derivation's size do not add up to the figure the same block " +
        "declares, so one of the three is not a measurement",
    ).toBe(actual);
    /**
     * AND THE SPLIT IS CHECKED AGAINST THE BYTES, NOT ONLY AGAINST THE
     * ARITHMETIC. Two numbers that add up are satisfied by any pair that
     * adds up; the claim is that the FIRST `blockBytes` of this answer
     * are the disclosure and the rest is the derivation. Sliced on a
     * BUFFER rather than on the string, because this block's own prose
     * carries em dashes and a byte offset is not a UTF-16 offset.
     */
    const answerBytes = Buffer.from(text, "utf8");
    expect(answerBytes.length, "the answer read back at a different size").toBe(actual);
    expect(answerBytes.subarray(0, blockBytes).toString("utf8")).toContain(
      "THE MARGIN — this answer's own size",
    );
    expect(
      answerBytes.subarray(blockBytes).toString("utf8"),
      "the byte offset the block claims for itself does not end the block, so the two halves add " +
        "up without describing this answer",
    ).not.toContain("THE MARGIN — this answer's own size");

    process.stdout.write(
      `\n  brief MARGIN: ${line.split("  <- ")[0]}\n  brief MARGIN COST: ${
        split.split("  <- ")[0]
      }\n`,
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("...and it spells BOTH arms — UNDER the buffer and OVER it — as stamped values, never as prose", () => {
  // KILLED BY: a disclosure that only fires near the boundary, which is
  // the shape this project has paid for twice: a guard that speaks only
  // in the bad case cannot be told from one that is broken. `budget_line`
  // in nputer-index prints at every run for the same reason, and says
  // "OVER by" rather than failing, because over is not an error here —
  // the answer is complete either way and what changes is who drains it.
  const at = "1999-01-01T00:00:00.000Z";
  const host = "a-test-host";
  const under = render(marginRecs({ bytes: 1_000, at, host }));
  const over = render(marginRecs({ bytes: PIPE_BUFFER_BYTES + 500, at, host }));

  expect(under).toContain(`output: 1000 of ${PIPE_BUFFER_BYTES} bytes (1.5%) - 64536 left`);
  expect(over).toContain(`(100.8%) - OVER by 500`);

  // THE ARMS ARE EXCLUSIVE ON THE FIGURE LINE, WHICH IS WHERE THE
  // PROPERTY LIVES — not merely "somewhere in the block" (SHAPE EIGHT,
  // the same narrowing the density assertion below now carries). The
  // block's prose may legitimately contain either phrase; the line that
  // states the size may not contain both.
  const figure = (block: string): string =>
    block.split("\n").find((l) => l.startsWith("output: ")) ?? "";
  expect(figure(under), "the UNDER arm's figure line spoke in the OVER arm's words").not.toContain(
    "OVER by",
  );
  expect(figure(over), "the OVER arm's figure line spoke in the UNDER arm's words").not.toContain(
    " left",
  );

  // AND THE FIGURE NAMES THE READER IT IS THE FLOOR FOR, IN BOTH ARMS
  // (T-225-s1). A buffer size printed bare is a figure whose owner lives
  // in a comment: `PIPE_BUFFER_BYTES` is the line for a reader taking ONE
  // fixed read, and it is NOT `spawnSync`'s line — the caller this
  // repository reads with meets `SPAWNSYNC_DEFAULT_MAXBUFFER` instead.
  // Which caller does what is the body below's, measured; that it is SAID
  // at all, on both sides of the line, is this one's.
  for (const arm of [under, over]) {
    expect(arm).toContain(`buffer: ${PIPE_BUFFER_BYTES} bytes is ONE PIPE BUFFER here`);
    expect(arm).toContain("the floor for a reader that takes ONE fixed-size read and stops");
  }
  expect(under).toContain("under it: this answer fits inside the transfer the writer completes");
  expect(over).toContain("past it, spawnSync at a maxBuffer this answer exceeds:");

  // THE PROVENANCE FLOOR REACHES IT TOO: a size is a figure, and a figure
  // leaves this module through a stamped value or not at all.
  expect(unstampedLines(under)).toEqual([]);
  expect(unstampedLines(over)).toEqual([]);
  for (const l of [...under.split("\n"), ...over.split("\n")].filter((l) => !l.startsWith("# "))) {
    expect(l).toContain(`<- read ${at} on ${host} ;`);
  }

  // AND THE DENSITY IS ABSENT WHEN NOTHING DERIVED A DENOMINATOR. A
  // per-card cost divided by a count this command did not derive is
  // exactly the figure with no keeper the whole module exists against.
  //
  // THE HAYSTACK IS THE LINE, NOT THE BLOCK (SHAPE EIGHT, both ways).
  // This read `not.toContain("per ")` over the whole arm, which is an
  // absence assertion satisfied by any prose anywhere: the buffer line
  // gained the words "per run" and the body reported a density line that
  // does not exist. What is absent is a LINE that opens with the density
  // key, and that is what is asked for now.
  expect(under.split("\n").filter((l) => l.startsWith("per "))).toEqual([]);
  expect(
    render(marginRecs({ bytes: 1_000, at, host, units: { count: 4, label: "listed card" } })),
  ).toContain("per listed card: 250 bytes");

  /**
   * THE BLOCK'S OWN COST SPEAKS IN BOTH ARMS AND IN BOTH STATES
   * (T-225-s2, taking `T-225-s8`) — the symmetry rule this block already
   * stands on, turned on the block itself. A disclosure that appears only
   * when the figure INCLUDES the disclosure cannot be told from one that
   * is broken, so the arm that cannot count itself says so rather than
   * going quiet, and the two sentences are exclusive on their own line.
   */
  for (const arm of [under, over]) {
    const counted = render(
      marginRecs({ bytes: arm === under ? 1_000 : PIPE_BUFFER_BYTES + 500, at, host, body: 700 }),
    );
    const costed = counted.split("\n").find((l) => l.startsWith("this block: ")) ?? "";
    expect(costed, "an arm disclosed a size and never said how much of it was itself").not.toBe("");
    expect(costed).toContain(
      `this block: ${(arm === under ? 1_000 : PIPE_BUFFER_BYTES + 500) - 700} of those bytes are ` +
        "this disclosure and 700 are the derivation",
    );
    expect(costed, "the counted arm spoke in the uncounted arm's words").not.toContain(
      "NOT COUNTED",
    );

    const uncounted = arm.split("\n").find((l) => l.startsWith("this block: ")) ?? "";
    expect(
      uncounted,
      "an arm given no derivation size went silent about its own cost instead of saying it could " +
        "not count it — a disclosure that only fires in the easy case cannot be told from one " +
        "that is broken",
    ).toContain("NOT COUNTED");
    expect(uncounted, "the uncounted arm claimed a split it was never given").not.toContain(
      "are the derivation",
    );
  }

  // AND A DERIVATION SIZE THAT WOULD MAKE THE BLOCK NEGATIVE IS THE SAME
  // class of nonsense as a size the block was never given, so the pin is
  // that the two halves come out of ONE subtraction rather than out of
  // two independent numbers.
  expect(
    render(marginRecs({ bytes: 2_000, at, host, body: 2_000 })),
  ).toContain("this block: 0 of those bytes are this disclosure and 2000 are the derivation");

  // A SIZE IT WAS NOT GIVEN IS REFUSED RATHER THAN GUESSED AT.
  expect(() => marginRecs({ bytes: Number.NaN, at, host })).toThrow(/needs a byte count/);

  // THE FIXED POINT, driven rather than reasoned about: the block
  // declares the size of the WHOLE text it heads.
  const body = `${"y".repeat(40_000)}\n`;
  const wrapped = withMargin(body, { at, host });
  expect(wrapped.whole, "the disclosure did not settle on a real board-sized answer").toBe(true);
  expect(Buffer.byteLength(wrapped.text, "utf8")).toBe(wrapped.bytes);
  expect(wrapped.text).toContain(`output: ${wrapped.bytes} of`);
  expect(wrapped.text.endsWith(body)).toBe(true);
});

/* ────────────────────────────────────────────────────────────────────
 * THE READERS THE OVER ARM SPEAKS ABOUT — driven, never described
 * (T-225-s1).
 *
 * The arm used to end *"a caller collecting into a fixed buffer of that
 * size receives a prefix with no error"*. The sentence is TRUE — of a
 * reader doing ONE fixed-size read — and it named nobody, so it was also
 * read as a claim about `spawnSync`, which is the reader this repository
 * itself uses and which is KILLED past its `maxBuffer` with the loudest
 * signal node has. One clause, two readers, opposite outcomes.
 *
 * SO EVERY CALLER THE ARM NAMES IS RUN HERE, against this command's own
 * answer, and the needles the sentence is checked against are BUILT OUT
 * OF WHAT WAS MEASURED rather than typed beside it. `brief-flush.spec.ts`
 * drives two of these readers already and asks a different question of
 * them — whether the WRITER loses bytes — so nothing below re-asserts its
 * property; what is new here is the join between a measurement and a
 * sentence.
 * ──────────────────────────────────────────────────────────────────── */

/** A `spawnSync` caller's own view of one run. */
interface CallerRead {
  bytes: number;
  status: number | null;
  signal: string | null;
  errorCode: string;
}

/** A pipe reader's view: what arrived, and how the WRITER ended. */
interface PipeRead {
  bytes: number;
  writerStatus: number | null;
  readerStatus: number | null;
}

/** A limit no plausible answer is under, for the "by a mile" ceiling. */
const TINY_MAXBUFFER = 1_024;

function readViaSpawnSync(argv: string[], maxBuffer?: number): CallerRead {
  const r = spawnSync(process.execPath, argv, {
    cwd: repoRoot,
    ...(maxBuffer === undefined ? {} : { maxBuffer }),
  });
  const err = r.error as NodeJS.ErrnoException | undefined;
  return {
    bytes: r.stdout === undefined || r.stdout === null ? 0 : r.stdout.length,
    status: r.status,
    signal: r.signal,
    errorCode: err?.code ?? "none",
  };
}

/** POSIX single-quoting, so a path with a space cannot become two words. */
function shq(s: string): string {
  return `'${s.replace(/'/g, "'\\''")}'`;
}

/**
 * THE WRITER'S OWN `$?` IS RECOVERED WITHOUT A SHELL DIALECT — a
 * pipeline's status is the READER's, and `PIPESTATUS` is a bash/zsh array
 * `dash` does not carry. `brief-flush.spec.ts` pays for this the same way
 * and for the same reason; the status goes to a FILE from inside the
 * pipeline's left side, which is POSIX everywhere.
 */
function readViaPipeline(argv: string[], dir: string, stem: string, right: string): PipeRead {
  const out = path.join(dir, `${stem}.out`);
  const st = path.join(dir, `${stem}.status`);
  const left = [process.execPath, ...argv].map(shq).join(" ");
  const r = spawnSync(
    "/bin/sh",
    ["-c", `{ ${left} 2>/dev/null; echo $? > ${shq(st)}; } | ${right} > ${shq(out)} 2>/dev/null`],
    { cwd: repoRoot, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
  );
  const written = Number.parseInt(readFileSync(st, "utf8").trim(), 10);
  return {
    bytes: statSync(out).size,
    writerStatus: Number.isInteger(written) ? written : null,
    readerStatus: r.status,
  };
}

/**
 * READER ONE — a consumer that PAUSES, which is what a pager is. It is a
 * subprocess on the far side of a real pipe rather than a paused
 * `child.stdout`, because node tears down a child's stdio at exit and a
 * harness that drops bytes on a writer that dropped none reds for its own
 * reason (`brief-flush.spec.ts` measured that and says so).
 */
function pausingReader(dir: string): string {
  const file = path.join(dir, "pausing-reader.mjs");
  writeFileSync(
    file,
    "// Small slices, a wait between them: it owns its own stdin, so\n" +
      "// nothing but this loop decides how fast the pipe drains.\n" +
      "const CHUNK = 4096;\nconst DELAY = 5;\nconst inp = process.stdin;\ninp.pause();\n" +
      "let ended = false;\ninp.on('end', () => { ended = true; });\n" +
      "const sleep = (ms) => new Promise((r) => setTimeout(r, ms));\n" +
      "for (;;) {\n" +
      "  const c = inp.read(CHUNK);\n" +
      "  if (c === null) { if (ended) break; await sleep(DELAY); continue; }\n" +
      "  process.stdout.write(c);\n" +
      "  await sleep(DELAY);\n" +
      "}\n",
    "utf8",
  );
  return file;
}

/**
 * A PRODUCER OF AN EXACT SIZE, for the one figure the arm prints that no
 * reader of this command could otherwise pin (V-225-s1 finding 1).
 *
 * `SPAWNSYNC_DEFAULT_MAXBUFFER` is node's number, not this module's, and
 * it was TRANSCRIBED: doubled to `2048 * 1024` the command printed
 * *"spawnSync at its 2097152-byte DEFAULT maxBuffer … receives the whole
 * answer at status 0 with no error"* to every dispatcher past the line —
 * false about node — with this file green at 39 of 39. A figure with no
 * keeper, in the module whose contract is that a figure never leaves it
 * detached from its source.
 *
 * IT IS PINNED IN TWO SPAWNS AND WITHOUT A RACE, because the boundary is
 * a property of the CHILD's size rather than of the reader's timing: node
 * trips when the bytes it has accumulated EXCEED the limit, and a
 * producer that writes exactly N never accumulates past N. So N clean and
 * N+1 `ENOBUFS` bracket the default exactly, from both sides — a constant
 * too large fails the first, too small fails the second.
 *
 * No `process.exit()`: the writer leaves naturally once stdout has
 * drained, so the only ceiling in play is the caller's.
 */
function writesExactly(dir: string, bytes: number): string[] {
  const file = path.join(dir, `writes-${bytes}.mjs`);
  writeFileSync(file, `process.stdout.write("a".repeat(${bytes}));\n`, "utf8");
  return [file];
}

/**
 * THE JOIN. Each claim narrows the haystack to the ONE line its key
 * anchors before looking for a needle — SHAPE EIGHT's remedy, because a
 * search over the whole block is satisfied by any occurrence anywhere,
 * and this block deliberately says similar things in two arms.
 */
interface Claim {
  key: string;
  /** What the measurement says this line MUST say. */
  needles: string[];
  /**
   * AND WHAT IT MUST NOT — the half this checker did not have (V-225-s1
   * finding 2). Asking only whether a true needle is PRESENT catches a
   * retired sentence that REPLACED the true one and misses a retired
   * sentence restored BESIDE it: *"error.code ENOBUFS — and a caller
   * collecting into a fixed buffer of that size receives a prefix with no
   * error, never OVERRUNS that maxBuffer"* satisfies every needle on the
   * line while contradicting the same run's own measurement, and passed.
   * Presence and absence are two questions and a checker owes both.
   */
  absent: string[];
}

function disagreements(block: string, claims: readonly Claim[]): string[] {
  const lines = block.split("\n");
  const found: string[] = [];
  for (const claim of claims) {
    const line = lines.find((l) => l.startsWith(claim.key));
    if (line === undefined) {
      found.push(`no line opens with ${JSON.stringify(claim.key)}`);
      continue;
    }
    for (const needle of claim.needles) {
      if (!line.includes(needle)) {
        found.push(`the line at ${JSON.stringify(claim.key)} does not say ${JSON.stringify(needle)}`);
      }
    }
    for (const banned of claim.absent) {
      if (line.includes(banned)) {
        found.push(
          `the line at ${JSON.stringify(claim.key)} STILL says ${JSON.stringify(banned)}, which ` +
            "this run's own measurement contradicts",
        );
      }
    }
  }

  /**
   * AND THE ABSENCE HALF RANGES OVER EVERY LINE, NOT ONLY THE ONE ITS KEY
   * ANCHORS (T-225-s9, filed with T-225-s1's APPROVED re-verdict).
   *
   * Narrowing the haystack to one line is SHAPE EIGHT's remedy and is
   * right for the NEEDLES — the block deliberately says similar things in
   * two arms, and a presence check over the whole block would be
   * satisfied by any occurrence anywhere. **It is wrong for the BAN.** A
   * sentence about caller A, planted on caller B's line, meets neither
   * B's needles nor B's ban list: measured at `b1dc556`, extending the
   * pipe-reader arm's tail with *"and spawnSync past its maxBuffer
   * likewise receives a prefix with no error"* — a clause the same run
   * measures as `ENOBUFS`, `SIGTERM` and an overrun — passed this file 39
   * of 39.
   *
   * **THE CARVE-OUT IS THE WHOLE DIFFICULTY AND IT IS DERIVED, NEVER
   * LISTED.** A blanket ban over every line reds the TRUE arm, because
   * two claims here are the same caller under different limits: the
   * default-maxBuffer line legitimately says *"with no error"* and
   * *"receives the whole answer"*, both of which the `ENOBUFS` and
   * fixed-read claims ban about THEIR callers. So a banned phrase is
   * excused exactly where it sits on another claim's own line AND that
   * claim's own measured needles already say it — presence on the owning
   * line is the evidence, and it comes from the same measurement the ban
   * does. Anywhere else, the clause is a claim about a caller made on a
   * line that is not that caller's, and it is reported.
   */
  for (const claim of claims) {
    for (const banned of claim.absent) {
      for (const line of lines) {
        if (line.startsWith(claim.key)) continue;
        if (!line.includes(banned)) continue;
        const owner = claims.find((c) => c !== claim && line.startsWith(c.key));
        const trueForTheOwner =
          owner !== undefined && owner.needles.some((n) => n.includes(banned) || banned.includes(n));
        if (trueForTheOwner) continue;
        found.push(
          `cross-caller: the line at ${JSON.stringify(
            owner === undefined ? line.split(":")[0] : owner.key,
          )} carries ${JSON.stringify(banned)}, which is a claim about ` +
            `${JSON.stringify(claim.key)} that this run's own measurement contradicts — a clause ` +
            "false about one caller survives on another caller's line unless the ban ranges over " +
            "every line",
        );
      }
    }
  }
  return found;
}

test("...and the OVER arm says what each named caller actually does past the line, measured in this run against this command's own answer", () => {
  // KILLED BY: any drift between what the arm SAYS and what the callers
  // DO — moving `SIGTERM` to `SIGKILL`, `ENOBUFS` to `EPIPE`, `status
  // null` to `status 0`, dropping the default-maxBuffer line, MOVING
  // `SPAWNSYNC_DEFAULT_MAXBUFFER` off node's own number, or putting the
  // retired *"receives a prefix with no error"* back on the `spawnSync`
  // line — BESIDE the true text as well as in place of it. Each needle
  // and each banned phrase is built from the measurement in this run, so
  // the producer and the assertion share no constant.
  const dir = mkdtempSync(path.join(os.tmpdir(), "t225s1-callers-"));
  try {
    const argv = [CLI, "--dispatch", "--full"];

    // GROUND TRUTH FIRST: node's stdout is SYNCHRONOUS to a file, so this
    // is the size every reader below is judged against.
    const whole = path.join(dir, "whole.txt");
    const fd = openSync(whole, "w");
    let fileStatus: number | null;
    try {
      fileStatus = spawnSync(process.execPath, argv, {
        cwd: repoRoot,
        stdio: ["ignore", fd, "ignore"],
      }).status;
    } finally {
      closeSync(fd);
    }
    expect(fileStatus, "the command under measurement did not answer cleanly").toBe(EXIT.CLEAN);
    const actual = statSync(whole).size;
    expect(actual, "there is no answer here to measure a reader against").toBeGreaterThan(
      TINY_MAXBUFFER,
    );

    /**
     * THE CEILINGS ARE DERIVED FROM THE ANSWER AND NEVER FROM THE BOARD.
     * The arm's subject is "a maxBuffer this answer exceeds", which is a
     * class rather than a number, so the body instantiates it twice —
     * the smallest limit this answer crosses and one it crosses by a
     * mile. A body that instead needed the live board to be past one
     * pipe buffer would be a red on somebody else's work the day the
     * board shrank.
     */
    const tightCeiling = actual - 1;
    const tight = readViaSpawnSync(argv, tightCeiling);
    const loose = readViaSpawnSync(argv, TINY_MAXBUFFER);
    const unset = readViaSpawnSync(argv);

    const keeps = readViaPipeline(
      argv,
      dir,
      "pausing",
      `${shq(process.execPath)} ${shq(pausingReader(dir))}`,
    );
    const oneRead = readViaPipeline(argv, dir, "one-read", `dd bs=${PIPE_BUFFER_BYTES} count=1`);

    /**
     * WHAT WAS MEASURED, ASSERTED BEFORE IT IS COMPARED TO ANYTHING —
     * SHAPE TEN: a join whose measured side was never shown non-empty
     * reports agreement between two absences.
     *
     * THE BYTE COUNT OF A KILLED CHILD IS A RACE AND IS NEVER PINNED.
     * The same limit returns the whole answer against a fast producer and
     * a part-way kill against a slow one, because what comes back is
     * quantised to node's own reads. `>` is the property; an equality
     * would be a flake wearing a measurement.
     */
    for (const [label, m, ceiling] of [
      ["the smallest limit it crosses", tight, tightCeiling],
      ["a limit it crosses by a mile", loose, TINY_MAXBUFFER],
    ] as const) {
      expect(m.status, `${label}: a killed child reported a status`).toBeNull();
      expect(m.signal, `${label}: the kill did not arrive as SIGTERM`).toBe("SIGTERM");
      expect(m.errorCode, `${label}: the caller was not told through error.code`).toBe("ENOBUFS");
      expect(
        m.bytes,
        `${label}: the stdout handed back did not overrun the caller's own maxBuffer of ${ceiling}`,
      ).toBeGreaterThan(ceiling);
    }
    expect(keeps.bytes, "a reader that pauses lost bytes this writer waits to deliver").toBe(actual);
    expect(keeps.writerStatus, "the writer did not end cleanly for the pausing reader").toBe(
      EXIT.CLEAN,
    );
    expect(oneRead.bytes, "one fixed read took more than the buffer it asked for").toBeLessThanOrEqual(
      PIPE_BUFFER_BYTES,
    );
    expect(oneRead.readerStatus, "the fixed-buffer reader itself failed").toBe(EXIT.CLEAN);

    /**
     * AND THE WRITER'S OWN EXIT BEHIND THAT READER IS A RACE, MEASURED
     * RATHER THAN CLAIMED (T-225-s1). Three runs by hand and three on the
     * dispatching seat's bench all read 0; this body read 1 on its first
     * loaded run, because whether the EPIPE from the closed pipe reaches
     * node before the process ends is a matter of timing. So neither the
     * arm nor this body says anything about it — what the sentence claims
     * is the READER's side, which is stable and is the half the retired
     * clause got right. It is recorded here so the next reader does not
     * spend the finding again.
     */
    expect(
      oneRead.writerStatus,
      "the writer's own exit was not recorded at all, so the pipeline never ran",
    ).not.toBeNull();

    /**
     * THE FOURTH CALLER'S OWN FIGURE, BRACKETED. Everything above measures
     * what a caller DOES; this measures the number that IDENTIFIES one of
     * them, which the arm prints as a fact about node and which nothing
     * checked (V-225-s1 finding 1).
     */
    const atDefault = readViaSpawnSync(writesExactly(dir, SPAWNSYNC_DEFAULT_MAXBUFFER));
    const pastDefault = readViaSpawnSync(writesExactly(dir, SPAWNSYNC_DEFAULT_MAXBUFFER + 1));
    expect(
      atDefault.errorCode,
      `a child writing exactly ${SPAWNSYNC_DEFAULT_MAXBUFFER} bytes was refused by an unconfigured ` +
        "spawnSync, so node's default maxBuffer is SMALLER than the figure this arm prints as it",
    ).toBe("none");
    expect(atDefault.status, "the child at the declared default did not end cleanly").toBe(
      EXIT.CLEAN,
    );
    expect(atDefault.bytes, "the answer at the declared default came back short").toBe(
      SPAWNSYNC_DEFAULT_MAXBUFFER,
    );
    expect(
      pastDefault.errorCode,
      `a child writing ${SPAWNSYNC_DEFAULT_MAXBUFFER + 1} bytes was ACCEPTED by an unconfigured ` +
        "spawnSync, so node's default maxBuffer is LARGER than the figure this arm prints as it",
    ).toBe("ENOBUFS");
    expect(pastDefault.status, "the child past the declared default reported a status").toBeNull();
    expect(pastDefault.signal, "the kill past the declared default was not SIGTERM").toBe("SIGTERM");
    expect(
      pastDefault.bytes,
      "the stdout past the declared default did not overrun it",
    ).toBeGreaterThan(SPAWNSYNC_DEFAULT_MAXBUFFER);

    /**
     * THE ARM UNDER TEST IS THE OVER ONE, so the size it is rendered at
     * is the live answer wherever that is past the line and is raised
     * past it otherwise — the TEXT is the same text either way, and the
     * needles below are prose about a class of caller rather than about
     * this board's size.
     */
    const at = "1999-01-01T00:00:00.000Z";
    const host = "a-test-host";
    const overBytes = Math.max(actual, PIPE_BUFFER_BYTES + 1);
    const over = render(marginRecs({ bytes: overBytes, at, host }));

    /**
     * Every needle below is a function of the measurement, not a literal
     * — and so is every BANNED phrase beside it. The `absent` half asks
     * the opposite question of the same line: given what this run
     * measured, which sentences may no longer appear there at all.
     */
    const clean = tight.errorCode === "none";
    const overran = tight.bytes > tightCeiling && loose.bytes > TINY_MAXBUFFER;
    const claims: Claim[] = [
      {
        key: "past it, a pipe reader that keeps reading:",
        needles: [keeps.bytes === actual ? "receives every byte" : "loses the tail"],
        absent: [keeps.bytes === actual ? "loses the tail" : "receives every byte"],
      },
      {
        key: `past it, a reader taking ONE fixed read of that size (dd bs=${PIPE_BUFFER_BYTES} count=1):`,
        needles: [
          oneRead.bytes < actual ? "a PREFIX of at most one buffer" : "at most one buffer",
          oneRead.readerStatus === EXIT.CLEAN
            ? "NO error on the reader's side at all"
            : "an error on the reader's side",
        ],
        absent: [
          oneRead.bytes < actual ? "the whole answer" : "a PREFIX",
          oneRead.readerStatus === EXIT.CLEAN ? "an error on the reader's side" : "NO error",
        ],
      },
      {
        key: "past it, spawnSync at a maxBuffer this answer exceeds:",
        needles: [
          `status ${String(tight.status)}`,
          `signal ${String(tight.signal)}`,
          `error.code ${tight.errorCode}`,
          overran ? "OVERRUNS that maxBuffer" : "stops at that maxBuffer",
        ],
        /**
         * THE RETIRED CLAUSE IS BANNED HERE BY MEASUREMENT, NOT BY
         * MEMORY. This run saw an error and an overrun, so a line that
         * also promises no error, or promises the limit holds, is
         * contradicting the same run that produced it — however much true
         * text it carries beside the promise.
         */
        absent: [
          ...(clean ? [] : ["with no error", "receives a prefix"]),
          ...(overran ? ["never OVERRUNS", "stops at that maxBuffer"] : ["OVERRUNS that maxBuffer"]),
        ],
      },
      {
        key: `past it, spawnSync at its ${SPAWNSYNC_DEFAULT_MAXBUFFER}-byte DEFAULT maxBuffer:`,
        needles:
          overBytes > SPAWNSYNC_DEFAULT_MAXBUFFER
            ? ["OVER that default", "same ENOBUFS"]
            : [
                "UNDER that default",
                `status ${String(unset.status)}`,
                unset.errorCode === "none" ? "no error" : `error.code ${unset.errorCode}`,
                // WHAT THIS CALLER GOT, SAID ON ITS OWN LINE — measured,
                // like every other needle here, and load-bearing since
                // T-225-s9: the cross-line ban above excuses a phrase only
                // where the owning line's own MEASURED needles already say
                // it, so a caller that receives the whole answer has to say
                // so rather than have it inferred.
                unset.bytes === actual ? "receives the whole answer" : "came back short",
              ],
        absent:
          overBytes > SPAWNSYNC_DEFAULT_MAXBUFFER
            ? ["UNDER that default", "no error"]
            : ["OVER that default", "ENOBUFS"],
      },
    ];

    expect(
      disagreements(over, claims),
      "the OVER arm and the readers it names disagree in this run — the sentence is what has to " +
        "move, because the measurement is what a dispatcher will meet",
    ).toEqual([]);

    /**
     * THE POSITIVE CONTROL, AND IT IS A PLANTED SENTENCE BECAUSE THE
     * PROPERTY LIVES IN TEXT. A checker that has only ever seen the true
     * arm cannot be told from one that decides nothing, so it is run
     * against the exact clause this card was filed about — a sentence
     * that was TRUE of the fixed-read reader, printed on the line about
     * `spawnSync`, with the default-maxBuffer caller named nowhere.
     */
    const RETIRED =
      "past it, a pipe reader that keeps reading: the tail arrives only while the reader drains\n" +
      "past it, spawnSync at a maxBuffer this answer exceeds: a caller collecting into a fixed " +
      "buffer of that size receives a prefix with no error";
    const planted = disagreements(RETIRED, claims);
    expect(
      planted.length,
      "the checker accepted the retired sentence, so it is deciding nothing and this body is a " +
        "green that proves the readers could not disagree",
    ).toBeGreaterThan(0);
    const said = planted.join(" | ");
    expect(said, "the planted sentence passed the loud half of the measurement").toContain(
      `error.code ${tight.errorCode}`,
    );
    expect(said, "a caller the arm never named was not reported missing").toContain(
      "no line opens with",
    );

    /**
     * AND THE SECOND CONTROL IS THE RETIRED CLAUSE RESTORED *BESIDE* THE
     * TRUE TEXT, WHICH IS THE FORM THE FIRST ONE MISSES (V-225-s1's
     * finding 2, reproduced as the body that would have caught it). The
     * control above is a REPLACEMENT — every needle goes missing and any
     * presence check reds. This one is an ADDITION: every needle is still
     * there, the line still says `error.code ENOBUFS` and still says
     * `OVERRUNS`, and it ALSO promises no error and promises the limit
     * holds. Only the absence half can see it.
     *
     * It is built by splicing into the arm this run actually rendered,
     * not typed out, so it cannot drift from the text under test.
     */
    const ADDED = over.replace(
      "and the stdout handed back OVERRUNS that ",
      "and a caller collecting into a fixed buffer of that size receives a prefix with no error, " +
        "never OVERRUNS that ",
    );
    expect(
      ADDED,
      "the addition control spliced nothing, so it is the true arm wearing a mutant's name",
    ).not.toBe(over);
    const added = disagreements(ADDED, claims);
    expect(
      added.length,
      "the retired clause restored ALONGSIDE the true text passed — the checker asks only what a " +
        "line SAYS and never what it may no longer say, which is the asymmetry this body was " +
        "rejected for",
    ).toBeGreaterThan(0);
    const alsoSaid = added.join(" | ");
    for (const banned of ["with no error", "never OVERRUNS"]) {
      expect(alsoSaid, `the absence half did not report ${JSON.stringify(banned)}`).toContain(
        `STILL says ${JSON.stringify(banned)}`,
      );
    }

    /**
     * AND THE THIRD CONTROL IS THE CLAUSE ON SOMEBODY ELSE'S LINE
     * (T-225-s9). The two above are a REPLACEMENT and an ADDITION, both on
     * the line the claim owns. This one is a CROSS-CALLER addition: the
     * `spawnSync` promise is spliced onto the PIPE READER's line, where it
     * meets neither that line's needles nor that line's ban list — and it
     * passed this file 39 of 39 while being false about the very caller it
     * names.
     *
     * It is spliced into the arm this run rendered, like the one above, so
     * it cannot drift from the text under test.
     */
    const CROSSED = over.replace(
      "rather than exiting on the tail",
      "rather than exiting on the tail, and spawnSync past its maxBuffer likewise receives a " +
        "prefix with no error",
    );
    expect(
      CROSSED,
      "the cross-caller control spliced nothing, so it is the true arm wearing a mutant's name",
    ).not.toBe(over);
    const crossed = disagreements(CROSSED, claims);
    expect(
      crossed.length,
      "a clause the same run measures as ENOBUFS, SIGTERM and an overrun sat on the pipe " +
        "reader's line and passed — the ban is scoped to the line its key anchors, which is the " +
        "third-order variant T-225-s9 was filed for",
    ).toBeGreaterThan(0);
    const crossSaid = crossed.join(" | ");
    expect(crossSaid, "the cross-line report did not name itself as one").toContain("cross-caller:");
    expect(
      crossSaid,
      "the cross-line report did not name the caller the false clause is about",
    ).toContain('is a claim about "past it, spawnSync at a maxBuffer this answer exceeds:"');

    // AND THE CARVE-OUT IS CHECKED RATHER THAN TRUSTED, so the cross-line
    // pass cannot be satisfied by banning everything everywhere: the TRUE
    // arm carries "with no error" and "receives the whole answer" on the
    // default-maxBuffer line, where this run's own measurement puts them,
    // and the assertion above that `disagreements(over, claims)` is empty
    // is what would red if the excuse were dropped. Stated here because
    // the two assertions are a pair and only one of them looks like it.
    expect(over, "the true arm no longer carries the phrase the carve-out exists for").toContain(
      "receives the whole answer at status 0 with no error",
    );

    process.stdout.write(
      `\n  brief CALLERS past the line (answer ${actual} bytes): pausing pipe reader ${keeps.bytes}` +
        ` bytes at writer status ${String(keeps.writerStatus)}; one fixed read ${oneRead.bytes}` +
        ` bytes at writer status ${String(oneRead.writerStatus)}; spawnSync at maxBuffer` +
        ` ${tightCeiling} -> ${tight.bytes} bytes, status ${String(tight.status)}, signal` +
        ` ${String(tight.signal)}, error.code ${tight.errorCode}; at ${TINY_MAXBUFFER} ->` +
        ` ${loose.bytes} bytes, error.code ${loose.errorCode}; node's DEFAULT bracketed at` +
        ` ${SPAWNSYNC_DEFAULT_MAXBUFFER} (${atDefault.errorCode}) and ${SPAWNSYNC_DEFAULT_MAXBUFFER + 1}` +
        ` (${pastDefault.errorCode}); at node's default ->` +
        ` ${unset.bytes} bytes, status ${String(unset.status)}, error.code ${unset.errorCode}.` +
        ` The retired sentence disagreed with ${planted.length} of the measurements.\n`,
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("...and the UNSETTLED fallback is DRIVEN at a REAL width: the fixed point oscillates and the block discloses the derivation's own size, labelled", () => {
  // KILLED BY: returning `{ whole: true }` from the loop's fall-through,
  // by disclosing the unsettled TOTAL instead of the derivation's exact
  // size, or by dropping the label that says which of the two is being
  // reported. Until this body the fallback was a branch no test drove.
  const at = "1999-01-01T00:00:00.000Z";
  const host = "a-test-host";
  /**
   * THE HEAD MODELS `withMargin`'s OWN, WHICH NOW MEANS THE BODY SIZE
   * TOO (T-225-s2). The block declares how many of the bytes it announces
   * are the disclosure and how many are the derivation, so its length is
   * a function of BOTH numbers; a head built without the second one is a
   * model of a block this command no longer emits, and the widths derived
   * from it would be right only by luck.
   */
  const head = (n: number, body: number): string =>
    `${render(marginRecs({ bytes: n, at, host, body }))}\n\n`;
  const bodyOf = (bytes: number): string => `${"z".repeat(bytes - 1)}\n`;

  /**
   * THE OSCILLATING WIDTHS ARE DERIVED, NEVER PINNED. A period-2 cycle
   * needs the block to get exactly one byte SHORTER as the declared total
   * grows by one, and `left` is the only field that shrinks — so the
   * candidates are the digit boundaries of `left`, one per power of ten,
   * and each width is a function of this block's own prose, which moves
   * whenever a sentence in it moves. Over the line there is no candidate
   * at all: the total, the percentage and `OVER by` all grow together.
   *
   * THE WIDTH IS NOW SOLVED RATHER THAN SUBTRACTED, because the block's
   * length depends on the body it heads: the loop below asks for the body
   * whose block, declaring `edge`, makes the true total `edge + 1`, and it
   * converges in a pass or two since only a digit count moves.
   */
  const widths: Array<{ width: number; edge: number }> = [];
  let shrinking = 0;
  for (let k = 1; k < 5; k += 1) {
    const edge = PIPE_BUFFER_BYTES - 10 ** k;
    let width = edge + 1 - Buffer.byteLength(head(edge, 0), "utf8");
    for (let pass = 0; pass < 6; pass += 1) {
      const next = edge + 1 - Buffer.byteLength(head(edge, width), "utf8");
      if (next === width) break;
      width = next;
    }
    if (width <= 0) continue;
    if (
      Buffer.byteLength(head(edge + 1, width), "utf8") ===
      Buffer.byteLength(head(edge, width), "utf8") - 1
    ) {
      shrinking += 1;
    }
    if (!withMargin(bodyOf(width), { at, host }).whole) widths.push({ width, edge });
  }
  expect(
    widths.length,
    "no width was found at which the fixed point fails to settle, so the fallback below is being " +
      "reported on a case this run never reached",
  ).toBeGreaterThan(0);

  // AND THE COVERAGE FOLLOWS THE DERIVATION RATHER THAN A TALLY (SHAPE
  // FIVE's remedy): every boundary where the block loses a byte is a
  // boundary that oscillates, so a prose change that moves one of them
  // moves this count with it instead of quietly covering fewer widths.
  expect(
    widths.length,
    "a boundary where the block loses a byte did not produce a cycle, or one that keeps its " +
      "length did — the derivation and the drive disagree",
  ).toBe(shrinking);

  for (const { width, edge } of widths) {
    const body = bodyOf(width);
    const wrapped = withMargin(body, { at, host });

    // THE HONEST ANSWER: what is disclosed is the DERIVATION's size, which
    // is exact, rather than a total that is off by a byte — and it SAYS
    // which of the two it is.
    expect(wrapped.whole, `width ${width} settled after all`).toBe(false);
    expect(wrapped.bytes, "the disclosed figure is not the derivation's own size").toBe(
      Buffer.byteLength(body, "utf8"),
    );
    expect(wrapped.text).toContain("did not settle");
    expect(wrapped.text).toContain(`derivation below: ${width} of ${PIPE_BUFFER_BYTES} bytes`);
    expect(wrapped.text.endsWith(body)).toBe(true);

    // AND THE LABEL IS LOAD-BEARING: the block is NOT the size it names,
    // which is exactly why it must not be read as the settled figure.
    expect(Buffer.byteLength(wrapped.text, "utf8")).toBeGreaterThan(wrapped.bytes);

    // THE PROVENANCE FLOOR REACHES THE FALLBACK TOO — the arm the notes
    // are dropped from must not take a stamped value with them.
    const headOnly = wrapped.text.slice(0, wrapped.text.length - body.length);
    expect(unstampedLines(headOnly)).toEqual([]);
    expect(headOnly).toContain(`buffer: ${PIPE_BUFFER_BYTES} bytes is ONE PIPE BUFFER here`);

    // THE POSITIVE CONTROL: one byte either side of the knife edge the
    // SAME function settles. Without it "did not settle" is satisfied by
    // a fallback that fires on everything.
    for (const delta of [-1, 1]) {
      expect(
        withMargin(bodyOf(width + delta), { at, host }).whole,
        `a body ${delta} byte from ${width} also failed to settle, so this is not a knife edge`,
      ).toBe(true);
    }

    process.stdout.write(
      `\n  brief MARGIN UNSETTLED: body ${width} bytes cycles across the left-digit edge ${edge};` +
        ` the block discloses "${
          wrapped.text.split("\n").find((l) => l.startsWith("derivation below: "))?.split("  <- ")[0]
        }" and is ${Buffer.byteLength(wrapped.text, "utf8")} bytes itself.\n`,
    );
  }
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
      {
        prefix: "output: ",
        why:
          "the margin measures THIS INVOCATION's own answer (T-225), and the `repository:` row " +
          "allowed above is one of the lines inside it — a size that did NOT move with a row it " +
          "contains would be measuring something other than what was written",
      },
      {
        prefix: "this block: ",
        why:
          "the same size split in two (T-225-s2): the derivation half is the answer minus this " +
          "block, so it moves with `output:` above for exactly the same reason — a half that did " +
          "NOT move would not be measuring what was written",
      },
      {
        prefix: "per listed card: ",
        why: "the same size, over the same denominator",
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
    // THE MARGIN'S ENTRY IS STRUCTURAL TOO and gets the same treatment:
    // it is on the list because it MUST move here, so an allowlist entry
    // that never fires would be one nobody could tell from a dead one.
    expect(
      moved.map((p) => p.line).filter((l) => l.startsWith("output: ")),
      "the margin disclosed the same size from two checkouts whose own path row differs, so it is " +
        "not measuring the answer it heads",
    ).toHaveLength(1);
    // AND THE COST SPLIT IS THE SAME KIND OF ENTRY (T-225-s2): the
    // derivation half is that same answer minus a block whose own length
    // did not change, so it must move exactly as `output:` did.
    expect(
      moved.map((p) => p.line).filter((l) => l.startsWith("this block: ")),
      "the block's own cost split did not move while the size it splits did, so the two halves " +
        "are not a split of that size",
    ).toHaveLength(1);

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

/* ════════════════════════════════════════════════════════════════════
 * THE DISPATCH RITUAL, PERFORMED (T-239).
 *
 * Every step of a dispatch already had a command; nothing joined them but
 * the dispatching seat's memory, and every step had failed at least once
 * by the sitting this card was written in. The bodies below are about the
 * JOIN: that the order holds, that a failure stops the ritual where it
 * happened rather than half-arming a lane, and that what the arm leaves
 * behind is what the eight hand steps leave.
 *
 * ── WHAT EACH SHAPE OF BODY IS FOR ──────────────────────────────────
 * The END-TO-END body runs the real command twice on two scratch
 * repositories — once as the arm, once as a hand-run ritual typed here —
 * and compares the two trees file for file. It is the only body that
 * proves the commands themselves work, and its kill set therefore
 * INCLUDES the arms it re-enters: a mutant that stops `--preflight` or
 * `--write-fence` from running reds it. That is stated rather than
 * hidden.
 *
 * The PER-STEP bodies drive `runDispatchLane` in process against a
 * stubbed world. Every failure they inject is a real one — a `git commit`
 * that exits non-zero, a manifest that is not there, a port something
 * holds — and the stub is the ONLY executor, so nothing they do can touch
 * a checkout. What they see that the end-to-end body cannot is WHICH
 * COMMANDS WERE NEVER ATTEMPTED, which is the second acceptance criterion
 * in as many words.
 * ════════════════════════════════════════════════════════════════════ */

/** The fixture card every ritual body dispatches. Its claims are all re-derivable. */
const FIXTURE_CARD_ID = "T-901";
const FIXTURE_CARD_FILE = `docs/tasks/${FIXTURE_CARD_ID}-a-fixture-card-the-ritual-can-dispatch.md`;
const FIXTURE_SLUG = "fixture-lane";
const FIXTURE_CARD = [
  "---",
  `id: ${FIXTURE_CARD_ID}`,
  "title: A FIXTURE CARD THE RITUAL CAN DISPATCH — it exists only inside a scratch repository",
  "feature: F-06",
  "milestone: 4",
  "priority: 3",
  "size: S",
  "status: planned",
  "blocked_by: []",
  "touches: [README.md]",
  "builder:",
  "verifier:",
  "built_by:",
  "verified_by:",
  "review: default",
  "---",
  "",
  "The fixture's own card. It claims nothing a preflight cannot re-derive.",
  "",
  "## Acceptance criteria",
  "",
  "- THE card SHALL exist.",
  "",
].join("\n");

interface RitualFixture {
  /** the mkdtemp root, for the teardown */
  dir: string;
  /** the integration checkout the ritual is run in */
  root: string;
  /** where the brief is written — the SCRATCH RULE's directory half */
  scratch: string;
}

/**
 * A scratch repository a whole dispatch can be performed in.
 *
 * IT IS A REAL CHECKOUT OF THIS TREE and not a stub, because the ritual's
 * middle steps re-enter this command against it: the preflight reads the
 * card, the fence expands `touches:` through the component registry, and
 * the brief reads `method/` and `docs/`. A fixture missing any of those
 * would prove something about a different repository. The parser it is
 * expanded by is THIS checkout's, which is the arm's own rule — the
 * ritual re-enters the command it is part of, never the copy sitting in
 * whatever `--root` names.
 *
 * The two names the callers pass are the same LENGTH on purpose: the
 * brief the ritual writes discloses its own byte size, and two fixtures
 * whose paths differ in length would disclose two different sizes for the
 * same document.
 */
function ritualFixture(name: string): RitualFixture {
  // REALPATH, and it is load-bearing for the same reason `nestedShapes`
  // gives: `/var` is a symlink to `/private/var` on macOS, git reports the
  // resolved spelling and `mkdtemp` hands back the symlinked one.
  const dir = realpathSync(mkdtempSync(path.join(os.tmpdir(), "t239-ritual-")));
  const home = path.join(dir, name);
  const root = path.join(home, "nputer");
  mkdirSync(root, { recursive: true });
  const tar = path.join(dir, "tree.tar");
  writeFileSync(
    tar,
    execFileSync("git", ["-C", repoRoot, "archive", "HEAD"], { maxBuffer: 512 * 1024 * 1024 }),
  );
  execFileSync("tar", ["-x", "-f", tar, "-C", root]);
  writeFileSync(path.join(root, FIXTURE_CARD_FILE), FIXTURE_CARD);
  fixtureGit(root, ["init", "--initial-branch=main", "--quiet"]);
  fixtureGit(root, ["add", "-A"]);
  // A `Checkpoint:` commit, because the base rule reads the newest one out
  // of the first-parent log and a fixture with none would fail for a
  // reason that has nothing to do with this card.
  fixtureGit(root, ["commit", "--quiet", "-m", "Checkpoint: fixture base"]);
  return { dir, root, scratch: path.join(home, "scratch") };
}

/** Every file under one tree, repository-relative and sorted. */
function inventory(root: string): string[] {
  const out = execFileSync(
    "find",
    [root, "-type", "f", "-not", "-path", `${root}/.git/*`, "-not", "-name", ".DS_Store"],
    { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 },
  );
  return out
    .split("\n")
    .filter((l) => l !== "")
    .map((l) => path.relative(root, l))
    .sort();
}

/**
 * The THREE things that legitimately differ between two runs of one
 * ritual on two scratch repositories: WHERE they sit, WHICH COMMITS they
 * made, and WHEN they ran. Everything else has to match, and this is
 * where that claim is narrowed to exactly those three — each of them a
 * LIVE fact by this module's own rule, which is why none of them can be
 * asserted equal and why every one of them is spelled out here instead of
 * being dropped from the comparison silently.
 *
 * Every substitution is FIXED-WIDTH in the source it replaces (a forty-hex
 * sha, a twelve-hex short, an ISO instant), so the brief's own disclosed
 * byte size — a VALUE, and compared like any other — is unaffected by
 * this normalisation and still has to agree between the two runs.
 */
function normalise(text: string, fx: RitualFixture): string {
  return text
    .split(path.dirname(fx.root))
    .join("<HOME>")
    .replace(/\b[0-9a-f]{40}\b/g, "<sha>")
    .replace(/\b[0-9a-f]{12}\b/g, "<short>")
    .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/g, "<clock>");
}

test("THE ARM LEAVES EXACTLY WHAT THE EIGHT HAND STEPS LEAVE, file for file", () => {
  // KILLED BY: a step dropped from `DISPATCH_STEPS`, a step reordered, the
  // bench cut on a branch instead of detached, the lane cut at the
  // integration tip instead of at the stamp, and the brief written under a
  // name the SCRATCH RULE does not publish. IT IS AN END-TO-END BODY and
  // its kill set therefore also covers the arms the ritual re-enters —
  // `--preflight`, `--write-fence` and `--task` — because a ritual that
  // cannot run them leaves nothing to compare.
  const arm = ritualFixture("one");
  const hand = ritualFixture("two");
  try {
    // ── THE ARM: one command, and it performs all eight steps ──────────
    const ran = spawnSync(
      process.execPath,
      [
        CLI,
        "--dispatch-lane",
        FIXTURE_CARD_ID,
        "--slug",
        FIXTURE_SLUG,
        "--root",
        arm.root,
        "--scratch",
        arm.scratch,
      ],
      { cwd: repoRoot, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
    );
    expect(ran.status, ran.stderr).toBe(EXIT.CLEAN);

    // ── THE HAND RITUAL: the same eight steps, typed here ──────────────
    // Two sides sharing no constant: the arm derives its lane names from
    // the document, and this side derives them from the fixture's own
    // layout and the same document read independently.
    const s = laneSpellings(conventions());
    const home = path.dirname(hand.root);
    const laneWt = path.join(home, s.worktreePattern.replace("T-NNN", FIXTURE_CARD_ID).replace("../", ""));
    const benchWt = path.join(home, `nputer-V-${FIXTURE_CARD_ID}`);
    const branch = s.branchPattern.replace("T-NNN", FIXTURE_CARD_ID).replace("<slug>", FIXTURE_SLUG);
    const cardPath = path.join(hand.root, FIXTURE_CARD_FILE);

    // 1 — stamp on the integration branch, commit, and read it back.
    writeFileSync(cardPath, readFileSync(cardPath, "utf8").replace("status: planned", "status: building"));
    fixtureGit(hand.root, ["commit", "--quiet", "-m", "hand-run dispatch stamp", "--", FIXTURE_CARD_FILE]);
    const base = fixtureGit(hand.root, ["rev-parse", "HEAD"]).trim();
    expect(
      fixtureGit(hand.root, ["show", `${base}:${FIXTURE_CARD_FILE}`]),
      "the hand run's own stamp did not reach its commit, so there is nothing to compare against",
    ).toContain("status: building");
    // 2 — cut the lane at that commit.
    fixtureGit(hand.root, ["worktree", "add", laneWt, "-b", branch, base]);
    // 3 and 4 — preflight, then arm the fence.
    for (const argv of [
      [CLI, "--task", FIXTURE_CARD_ID, "--preflight", "--root", hand.root],
      [CLI, "--task", FIXTURE_CARD_ID, "--write-fence", laneWt, "--root", hand.root],
    ]) {
      const step = spawnSync(process.execPath, argv, {
        cwd: hand.root,
        encoding: "utf8",
        maxBuffer: 64 * 1024 * 1024,
      });
      expect(step.status, `${argv[1]} ${argv[4]}: ${step.stderr}`).toBe(EXIT.CLEAN);
    }
    // 5 — read the manifest back.
    const handManifest = JSON.parse(readFileSync(path.join(laneWt, ".nputer", "lane-fence.json"), "utf8"));
    expect(handManifest.taskId).toBe(FIXTURE_CARD_ID);
    // 6 — the bench, detached, at the same commit.
    fixtureGit(hand.root, ["worktree", "add", "--detach", benchWt, base]);
    // 7 — the brief, into the lane's own scratch file.
    mkdirSync(hand.scratch, { recursive: true });
    const handBrief = path.join(hand.scratch, `brief-${FIXTURE_CARD_ID}.txt`);
    const fd = openSync(handBrief, "w");
    try {
      const wrote = spawnSync(
        process.execPath,
        [CLI, "--task", FIXTURE_CARD_ID, "--root", hand.root],
        { cwd: hand.root, encoding: "utf8", stdio: ["ignore", fd, "pipe"] },
      );
      expect([EXIT.CLEAN, EXIT.FOUND], wrote.stderr ?? "").toContain(wrote.status);
    } finally {
      closeSync(fd);
    }

    // ── THE COMPARISON, FILE FOR FILE ──────────────────────────────────
    const armHome = path.dirname(arm.root);
    const armLane = path.join(armHome, `nputer-${FIXTURE_CARD_ID}`);
    const armBench = path.join(armHome, `nputer-V-${FIXTURE_CARD_ID}`);

    // The worktree administration first: same entries, same branches, same
    // detached-ness. A bench cut on a branch would be a second lane.
    const admin = (root: string, fx: RitualFixture) =>
      normalise(fixtureGit(root, ["worktree", "list", "--porcelain"]), fx)
        .split("\n")
        .filter((l) => !l.startsWith("HEAD "))
        .join("\n");
    expect(admin(arm.root, arm)).toBe(admin(hand.root, hand));
    expect(
      admin(arm.root, arm),
      "the fixture has no detached bench, so the comparison above is between two two-worktree trees",
    ).toContain("detached");

    // The stamped card, as the COMMIT carries it — which is what the lane
    // inherits in its base.
    const armBase = fixtureGit(arm.root, ["rev-parse", "HEAD"]).trim();
    expect(fixtureGit(arm.root, ["show", `${armBase}:${FIXTURE_CARD_FILE}`])).toBe(
      fixtureGit(hand.root, ["show", `${base}:${FIXTURE_CARD_FILE}`]),
    );
    // And the lane really is cut AT that commit, on its own branch.
    expect(fixtureGit(armLane, ["rev-parse", "HEAD"]).trim()).toBe(armBase);
    expect(fixtureGit(armLane, ["symbolic-ref", "HEAD"]).trim()).toBe(`refs/heads/${branch}`);
    expect(fixtureGit(armBench, ["rev-parse", "HEAD"]).trim()).toBe(armBase);

    // Every file in each of the three trees.
    for (const [what, a, b] of [
      ["the lane worktree", armLane, laneWt],
      ["the bench", armBench, benchWt],
      ["the integration checkout", arm.root, hand.root],
    ] as const) {
      const left = inventory(a);
      expect(left.length, `${what} is empty, so comparing it proves nothing`).toBeGreaterThan(0);
      expect(left, `${what} does not hold the same files as the hand-run ritual's`).toEqual(
        inventory(b),
      );
    }
    expect(
      inventory(armLane),
      "the manifest step five reads back is not in the lane at all",
    ).toContain(path.join(".nputer", "lane-fence.json"));

    // The manifest, and the brief, byte for byte once the two things that
    // legitimately differ are normalised away.
    expect(
      normalise(readFileSync(path.join(armLane, ".nputer", "lane-fence.json"), "utf8"), arm),
    ).toBe(normalise(readFileSync(path.join(laneWt, ".nputer", "lane-fence.json"), "utf8"), hand));
    const armBrief = path.join(arm.scratch, `brief-${FIXTURE_CARD_ID}.txt`);
    const briefValues = (file: string, fx: RitualFixture) =>
      values(normalise(readFileSync(file, "utf8"), fx));
    expect(briefValues(armBrief, arm).length).toBeGreaterThan(0);
    expect(
      briefValues(armBrief, arm),
      "the brief the arm wrote is not the brief the hand ritual wrote",
    ).toEqual(briefValues(handBrief, hand));
  } finally {
    removeGitFixture(arm.dir, "ritualFixture(one)");
    removeGitFixture(hand.dir, "ritualFixture(two)");
  }
});

/* ── THE PER-STEP BODIES, AND THE WORLD THEY RUN AGAINST ──────────────
 * `runDispatchLane` takes its whole world as an argument, so the stub
 * below is the ONLY thing that can start a process or touch a disk in
 * every body that uses it. That is what makes it safe to build the plan
 * against this repository's own board — no path in it is ever reached —
 * and it is what lets each body see the one thing an end-to-end run
 * cannot show: which commands were NEVER ATTEMPTED.
 * ──────────────────────────────────────────────────────────────────── */

/** A commit this ritual never makes: the stub answers `rev-parse` with it. */
const STUB_BASE = "b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1";

interface StubCall {
  argv: string[];
  cwd: string;
  out?: string;
}

interface RitualStub {
  io: Parameters<typeof runDispatchLane>[1];
  calls: StubCall[];
  reads: string[];
  writes: string[];
}

/**
 * A world in which every step succeeds except the one named — and the
 * failure injected is the REAL one that step meets: a `git commit` that
 * exits non-zero, a `git worktree add` refusing a path, a preflight that
 * found stale claims, a manifest that is not on disk, a probe that names
 * a process holding the port.
 */
function ritualStub(plan: ReturnType<typeof dispatchLanePlan>, failing: string): RitualStub {
  const calls: StubCall[] = [];
  const reads: string[] = [];
  const writes: string[] = [];
  const stamped = stampCard(FIXTURE_CARD, plan.stamp).text;
  const manifest = JSON.stringify({
    version: 1,
    taskId: plan.taskId,
    branch: plan.branch,
    worktree: plan.worktree,
    card: plan.card,
    paths: ["README.md"],
  });
  const ok = { status: EXIT.CLEAN, stdout: "", stderr: "" };
  const io = {
    run: (argv: string[], opts: { cwd: string; out?: string }) => {
      calls.push({ argv, cwd: opts.cwd, ...(opts.out === undefined ? {} : { out: opts.out }) });
      const has = (a: string) => argv.includes(a);
      if (argv[0] === "lsof") {
        return failing === "port"
          ? { status: 0, stdout: "COMMAND PID USER\nnode 4242 someone\n", stderr: "" }
          : { status: 1, stdout: "", stderr: "" };
      }
      if (has("--preflight")) {
        return failing === "preflight"
          ? { status: EXIT.FOUND, stdout: "", stderr: "brief: FOUND 1 thing" }
          : ok;
      }
      if (has("--write-fence")) {
        return failing === "fence"
          ? { status: EXIT.FOUND, stdout: "", stderr: "lane-fence: overlapping" }
          : ok;
      }
      if (opts.out !== undefined) {
        return failing === "brief"
          ? { status: EXIT.CANNOT_RUN, stdout: "", stderr: "brief: COULD NOT WRITE THE ANSWER" }
          : ok;
      }
      if (has("worktree") && has("add")) {
        const bench = has("--detach");
        return (bench ? failing === "bench" : failing === "cut")
          ? { status: 128, stdout: "", stderr: "fatal: a path already exists" }
          : ok;
      }
      if (has("commit")) {
        return failing === "stamp"
          ? { status: 1, stdout: "", stderr: "error: could not write the commit" }
          : ok;
      }
      if (has("rev-parse")) return { status: 0, stdout: `${STUB_BASE}\n`, stderr: "" };
      if (has("show")) {
        return { status: 0, stdout: failing === "read-back" ? FIXTURE_CARD : stamped, stderr: "" };
      }
      return ok;
    },
    read: (file: string) => {
      reads.push(file);
      if (file === plan.manifestFile) {
        if (failing === "manifest") {
          throw new Error(`ENOENT: no such file or directory, open '${file}'`);
        }
        return manifest;
      }
      if (file === plan.cardFile) return FIXTURE_CARD;
      throw new Error(`the stub was asked for ${file}, which no step of this ritual reads`);
    },
    write: (file: string, _text: string) => {
      writes.push(file);
    },
  };
  return { io, calls, reads, writes };
}

/** Was this step ATTEMPTED at all? Derived from the plan, never typed. */
function attempted(stub: RitualStub, plan: ReturnType<typeof dispatchLanePlan>, id: string): boolean {
  const call = (p: (c: StubCall) => boolean) => stub.calls.some(p);
  switch (id) {
    case "stamp":
      return call((c) => c.argv.includes("commit"));
    case "cut":
      return call((c) => c.argv.includes("add") && c.argv.includes(plan.worktree));
    case "preflight":
      return call((c) => c.argv.includes("--preflight"));
    case "fence":
      return call((c) => c.argv.includes("--write-fence"));
    case "manifest":
      return stub.reads.includes(plan.manifestFile);
    case "bench":
      return call((c) => c.argv.includes("add") && c.argv.includes(plan.bench));
    case "brief":
      return call((c) => c.out === plan.briefFile);
    case "port":
      return call((c) => c.argv[0] === "lsof");
    default:
      throw new Error(`no signature for step ${id}`);
  }
}

/** The plan every per-step body drives, over a card this board really holds. */
function stubPlan(): ReturnType<typeof dispatchLanePlan> {
  return dispatchLanePlan(context({}), { taskId: "T-133", slug: FIXTURE_SLUG, scratch: os.tmpdir() });
}

for (const step of DISPATCH_STEPS) {
  test(`THE RITUAL STOPS AT STEP ${step.n} (${step.id}) and performs no later step`, () => {
    // KILLED BY: a runner that continues past a failed step, one that
    // reports a step other than the one that failed, one that drops the
    // command or the exit from its refusal, and one that unwinds a
    // worktree it did not cut — or fails to unwind one it did.
    const plan = stubPlan();
    const stub = ritualStub(plan, step.id);
    const result = runDispatchLane(plan, stub.io);

    expect(result.stopped, `step ${step.n} was injected with a failure and the ritual ran on`).toBeDefined();
    const stopped = result.stopped as NonNullable<typeof result.stopped>;
    expect(stopped.n).toBe(step.n);
    expect(stopped.id).toBe(step.id);
    expect(
      result.done.length,
      "the ledger of completed steps does not end where the ritual stopped",
    ).toBe(step.n - 1);
    // The brief step's injected failure is a COULD NOT RUN, because 1 is a
    // code that step legitimately answers with the document written.
    expect(result.code).toBe(step.id === "brief" ? EXIT.CANNOT_RUN : EXIT.FOUND);

    // THE REFUSAL NAMES THE STEP, THE COMMAND AND THE EXIT.
    const refusal = result.findings.join("\n");
    expect(refusal).toContain(`step ${step.n} (${step.id})`);
    expect(refusal).toContain(stopped.ran);
    expect(refusal).toContain(`exit ${stopped.exit}`);
    expect(stopped.ran.length, "the refusal names no command at all").toBeGreaterThan(0);

    // AND IT PERFORMED NO LATER STEP. This is the half an end-to-end body
    // cannot see: an absence is only evidence beside the presences below.
    for (const later of DISPATCH_STEPS.filter((d) => d.n > step.n)) {
      expect(attempted(stub, plan, later.id), `step ${later.n} (${later.id}) ran after the stop`).toBe(
        false,
      );
    }
    for (const earlier of DISPATCH_STEPS.filter((d) => d.n < step.n)) {
      expect(
        attempted(stub, plan, earlier.id),
        `step ${earlier.n} (${earlier.id}) never ran, so this ritual did not reach step ${step.n}`,
      ).toBe(true);
    }

    // THE STAMP IS NEVER UNDONE (T-226): it is a fact about the card, and a
    // card un-stamped after a refusal is a lifecycle nobody can read.
    for (const undo of ["revert", "reset", "restore"]) {
      expect(
        stub.calls.some((c) => c.argv.includes(undo)),
        `the ritual ran git ${undo} after refusing, and the stamp is not its to take back`,
      ).toBe(false);
    }

    // AND EVERY WORKTREE THIS RUN CUT IS TAKEN AWAY, AND ONLY THOSE.
    const expected = [
      ...(step.n > 6 ? [plan.bench] : []),
      ...(step.n > 2 ? [plan.worktree] : []),
    ];
    expect(result.removed, "the unwind removed a different set of worktrees than this run cut").toEqual(
      expected,
    );
    for (const gone of expected) {
      expect(
        stub.calls.some((c) => c.argv.includes("remove") && c.argv.includes(gone)),
        `${gone} was reported removed and no command removed it`,
      ).toBe(true);
    }
    expect(
      stub.calls.some((c) => c.argv.includes("-D") && c.argv.includes(plan.branchName)),
      "the branch this run created outlived the worktree, so a re-run fails at the cut",
    ).toBe(step.n > 2);
  });
}

test("THE RITUAL READS THE STAMP BACK OUT OF THE COMMIT, and a commit that does not carry it stops it at step one", () => {
  // KILLED BY: reading the stamp off the WORKING TREE (which the writer
  // just wrote, so it always agrees), and by dropping the read-back
  // altogether. The lane inherits its stamp in its BASE, so a commit that
  // does not carry it is a lane cut from a card the board calls unstarted.
  const plan = stubPlan();
  const stub = ritualStub(plan, "read-back");
  const result = runDispatchLane(plan, stub.io);
  const stopped = result.stopped as NonNullable<typeof result.stopped>;
  expect(stopped.n).toBe(1);
  expect(stopped.id).toBe("stamp");
  expect(result.code).toBe(EXIT.FOUND);
  expect(stopped.ran, "the refusal does not name the read that caught it").toContain("show");
  expect(stopped.detail).toContain("status");
  // POSITIVE CONTROL: the commit WAS made and the write WAS attempted, so
  // this is a read-back catching a silent no-op rather than a step that
  // never happened.
  expect(stub.writes).toEqual([plan.cardFile]);
  expect(stub.calls.some((c) => c.argv.includes("commit"))).toBe(true);
  expect(attempted(stub, plan, "cut"), "the lane was cut from an unstamped commit").toBe(false);
  expect(result.removed).toEqual([]);
});

test("A STAMP ANCHORED ON A KEY THE CARD DOES NOT CARRY IS A REFUSAL, never a silent no-op", () => {
  // KILLED BY: a writer that appends a missing key instead of refusing,
  // one that reports success over a substitution that matched nothing, and
  // one whose replacement swallows the line after it — the two failures
  // measured on the dispatching seat's own `perl -pi` stamps.
  const missing = () => stampCard(FIXTURE_CARD, { built_at: "now" });
  expect(missing).toThrow(DispatchLaneFinding);
  expect(missing).toThrow(/built_at:/);

  const before = FIXTURE_CARD.split("\n");
  const after = stampCard(FIXTURE_CARD, { status: "building", builder: "a-seat" }).text.split("\n");
  expect(after.length, "the stamp changed the card's line count, so a line was swallowed").toBe(
    before.length,
  );
  for (const [i, line] of before.entries()) {
    if (line.startsWith("status:") || line.startsWith("builder:")) continue;
    expect(after[i], `line ${i + 1} moved under a stamp that was not addressed to it`).toBe(line);
  }
  expect(after).toContain("status: building");
  expect(after).toContain("builder: a-seat");

  // AND THE VERDICT IS NOT VACUOUS: it disagrees with the card as it was.
  expect(stampVerdict(FIXTURE_CARD, { status: "building" }).length).toBe(1);
  expect(stampVerdict(after.join("\n"), { status: "building", builder: "a-seat" })).toEqual([]);
});

test("THE MANIFEST IS READ BACK, and a manifest for another lane is not this lane's fence", () => {
  // KILLED BY: trusting `--write-fence`'s exit code instead of reading the
  // file it claims to have written. The hook reads that file and nothing
  // else, so a manifest naming another card is a fence nobody declared.
  const want = {
    taskId: "T-133",
    branch: "refs/heads/task/T-133-a-lane",
    worktree: "/Users/x/nputer-T-133",
    card: "docs/tasks/T-133-a-card.md",
  };
  const good = { version: 1, ...want, paths: ["tools/e2e/scripts/brief.mjs"] };
  expect(manifestVerdict(JSON.stringify(good), want)).toEqual([]);
  expect(manifestVerdict("{not json", want)[0]).toContain("not readable JSON");
  expect(manifestVerdict("[]", want)[0]).toContain("not a JSON object");
  for (const key of ["taskId", "branch", "worktree", "card"] as const) {
    const wrong = manifestVerdict(JSON.stringify({ ...good, [key]: "somebody else's" }), want);
    expect(wrong.join(" "), `a manifest carrying another lane's ${key} was accepted`).toContain(key);
  }
  expect(
    manifestVerdict(JSON.stringify({ ...good, paths: [] }), want).join(" "),
    "a manifest reserving nothing would refuse every write in the lane",
  ).toContain("no path at all");
  expect(manifestVerdict(JSON.stringify({ ...good, version: undefined }), want).join(" ")).toContain(
    "version",
  );
});

test("THE PORT, THE SCRATCH STEM AND THE BENCH FOLLOW THE SPELLINGS CONVENTIONS PUBLISHES", () => {
  // KILLED BY: a port base, a scratch name or a bench path typed into the
  // module. ONE SIDE ONLY: the DOCUMENT moves and the derivation has to
  // follow it — a constant would not.
  const md = conventions();
  const sp = dispatchSpellings(md);
  expect(sp.portPattern).toContain("<card number>");
  expect(sp.scratchPattern).toContain("<card id>");
  expect(sp.benchPattern).toContain("T-NNN");
  expect(lanePort("T-239", sp)).toBe(sp.portBase + 239);
  // A SUFFIXED CARD SHARES ITS PARENT'S NUMBER AND GETS ITS OWN STEM, and
  // that asymmetry is the two bullets' own: one says `<card number>` and
  // the other says `<card id>`.
  expect(lanePort("T-216-s1", sp)).toBe(lanePort("T-216", sp));
  expect(laneScratchStem("T-216-s1", sp)).not.toBe(laneScratchStem("T-216", sp));
  expect(laneScratchName("battery", "sh", "T-216-s1", sp)).toBe("battery-T-216-s1.sh");

  const moved = md
    .replace(`\`${sp.portPattern}\``, "`NPUTER_E2E_PORT=27000+<card number>`")
    .replace(`bench worktree \`${sp.benchPattern}\``, "bench worktree `../bench-T-NNN`")
    .replace(`\`${sp.scratchPattern}\``, "`<purpose>_<card id>_<ext>`");
  expect(moved).not.toBe(md);
  const after = dispatchSpellings(moved);
  expect(after.portBase).toBe(27000);
  expect(lanePort("T-239", after)).toBe(27239);
  expect(after.benchPattern).toBe("../bench-T-NNN");
  expect(laneScratchName("battery", "sh", "T-216-s1", after)).toBe("battery_T-216-s1_sh");

  // AND A BULLET THAT NO LONGER SPELLS IT THROWS, rather than defaulting.
  const gone = md.replace(`\`${sp.portPattern}\``, "the port for the lane");
  expect(gone).not.toBe(md);
  expect(() => dispatchSpellings(gone)).toThrow(/backticked runs carrying/);
  const noBench = md.replace(`bench worktree \`${sp.benchPattern}\``, "no bench is published");
  expect(noBench).not.toBe(md);
  expect(() => dispatchSpellings(noBench)).toThrow(/bench worktree/);
});

test("THE CREATE COMMAND IS THE ONE CONVENTIONS PUBLISHES, SUBSTITUTED — never one typed here", () => {
  // KILLED BY: a `git worktree add` assembled in the module. The document
  // moves on one side only, and the argv has to move with it.
  const ctx = context({});
  const lane = { branchName: "task/T-901-a-lane", worktree: "/Users/x/nputer-T-901" };
  const argv = createLaneArgv(ctx, lane);
  expect(argv.slice(0, 3)).toEqual(["git", "-C", ctx.root]);
  expect(argv).toContain(lane.worktree);
  expect(argv).toContain(lane.branchName);
  expect(argv, "the base is substituted at run time, so the plan carries the placeholder").toContain(
    BASE_TOKEN,
  );
  expect(
    argv.some((a) => a.includes("T-NNN") || a.includes("<slug>")),
    "a placeholder reached the command, so a worktree would be cut at a literal `T-NNN`",
  ).toBe(false);
  // AND A DOCUMENT THAT NO LONGER SPELLS IT REFUSES, rather than falling
  // back on a command this module remembers.
  const broken = {
    ...ctx,
    spellings: { ...ctx.spellings, createCommand: "git worktree add somewhere -b something" },
  };
  expect(() => createLaneArgv(broken, lane)).toThrow(DispatchLaneFinding);
  expect(() => createLaneArgv(broken, lane)).toThrow(/typed from memory/);
});

test("THE DRY RUN PRINTS THE PLAN IN ORDER AND WRITES NOTHING", () => {
  // KILLED BY: a dry run that performs a step, one that prints the plan in
  // an order other than DISPATCH_STEPS', and one that omits a lane fact
  // the first acceptance criterion names. The plan is what a dispatcher
  // reads BEFORE it spends anything, so a plan that lies is worse than no
  // plan.
  const fx = ritualFixture("one");
  try {
    const before = {
      status: fixtureGit(fx.root, ["status", "--porcelain"]),
      head: fixtureGit(fx.root, ["rev-parse", "HEAD"]),
      worktrees: fixtureGit(fx.root, ["worktree", "list", "--porcelain"]),
      files: inventory(fx.root),
    };
    const ran = spawnSync(
      process.execPath,
      [CLI, "--dispatch-lane", FIXTURE_CARD_ID, "--slug", FIXTURE_SLUG, "--root", fx.root,
        "--scratch", fx.scratch, "--dry-run"],
      { cwd: repoRoot, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
    );
    expect(ran.status, ran.stderr).toBe(EXIT.CLEAN);

    // THE ORDER IS THE LAW, and the plan is where a reader checks it.
    const printed = values(ran.stdout).filter((l) => /^step \d+ — /.test(l));
    expect(printed.map((l) => l.replace(/^step (\d+) — ([a-z]+):.*$/, "$1 $2"))).toEqual(
      DISPATCH_STEPS.map((s) => `${s.n} ${s.id}`),
    );
    // AND THE BLOCK OF LANE FACTS IS ALL SEVEN, plus the card they derive from.
    for (const label of ["branch: ", "worktree: ", "base hash: ", "bench: ", "port: ",
      "scratch stem: ", "brief path: "]) {
      expect(values(ran.stdout).some((l) => l.trim().startsWith(label)), `no ${label} row`).toBe(true);
    }
    expect(ran.stdout, "the base is a commit the dry run has not made, and must not be named").toContain(
      `base hash: ${BASE_TOKEN}`,
    );
    // EVERY LINE THE ARM EMITS IS STAMPED — the module's own provenance
    // floor, applied to the rows this card adds.
    expect(unstampedLines(ran.stdout.split("\n").filter((l) => /^(step \d| *(branch|worktree|base hash|bench|port|scratch stem|brief path): )/.test(l)).join("\n"))).toEqual([]);

    expect(fixtureGit(fx.root, ["status", "--porcelain"])).toBe(before.status);
    expect(fixtureGit(fx.root, ["rev-parse", "HEAD"])).toBe(before.head);
    expect(
      fixtureGit(fx.root, ["worktree", "list", "--porcelain"]),
      "a dry run cut a worktree",
    ).toBe(before.worktrees);
    expect(inventory(fx.root)).toEqual(before.files);
    expect(existsSync(fx.scratch), "a dry run wrote the brief it only meant to plan").toBe(false);
  } finally {
    removeGitFixture(fx.dir, "ritualFixture(dry-run)");
  }
});

test("A CHECKOUT THAT IS NOT THE INTEGRATION ONE IS REFUSED BEFORE THE RITUAL'S FIRST STEP", () => {
  // KILLED BY: an arm that stamps wherever it is pointed. The dispatch
  // stamp belongs on the integration branch and the lane inherits it in
  // its base (orchestrator 5b), so a lane is not a seat this ritual can be
  // run from — and a stamp committed onto a lane branch is the two-writer
  // conflict the pre-cut stamp exists to prevent.
  const fx = ritualFixture("one");
  try {
    fixtureGit(fx.root, ["checkout", "--quiet", "-b", `task/${FIXTURE_CARD_ID}-not-a-seat`]);
    const head = fixtureGit(fx.root, ["rev-parse", "HEAD"]);
    const ran = spawnSync(
      process.execPath,
      [CLI, "--dispatch-lane", FIXTURE_CARD_ID, "--slug", FIXTURE_SLUG, "--root", fx.root,
        "--scratch", fx.scratch],
      { cwd: repoRoot, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
    );
    expect(ran.status, "a refusal must not look like a clean dispatch").toBe(EXIT.FOUND);
    expect(ran.stderr).toContain("not the integration one");
    expect(ran.stdout).toContain("REFUSED before its first step");
    // NOTHING WAS DONE: no stamp, no commit, no worktree, no brief.
    expect(fixtureGit(fx.root, ["rev-parse", "HEAD"])).toBe(head);
    expect(fixtureGit(fx.root, ["status", "--porcelain"])).toBe("");
    expect(fixtureGit(fx.root, ["worktree", "list", "--porcelain"]).split("worktree ").length).toBe(2);
    expect(existsSync(fx.scratch)).toBe(false);
  } finally {
    removeGitFixture(fx.dir, "ritualFixture(not-integration)");
  }
});

test("THE RITUAL IS A NAMED ARM — its dials mean nothing without it, and it refuses the acts it performs", () => {
  // KILLED BY: accepting a dial this command then ignores, and by letting
  // `--dispatch-lane` share an invocation with an arm that performs one of
  // its own steps. Every case below returns before this command reads a
  // card, so the checkout it runs in is untouched — which is the fifth
  // acceptance criterion's second half, and the reason the existing body
  // *THE COMMAND IS A READ* is still about the same command.
  const statusBefore = spawnSync("git", ["-C", repoRoot, "status", "--porcelain"], { encoding: "utf8" });
  const run = (args: string[]) =>
    spawnSync(process.execPath, [CLI, ...args], { cwd: repoRoot, encoding: "utf8" });

  const stray = run(["--slug", "a-lane"]);
  expect(stray.status).toBe(EXIT.USAGE);
  expect(stray.stderr).toContain("--slug");
  expect(run(["--dry-run", "--task", "T-133"]).status).toBe(EXIT.USAGE);
  expect(run(["--executor", "a-seat", "--state"]).status).toBe(EXIT.USAGE);

  const noSlug = run(["--dispatch-lane", "T-133"]);
  expect(noSlug.status).toBe(EXIT.USAGE);
  expect(noSlug.stderr).toContain("--slug");

  const both = run(["--dispatch-lane", "T-133", "--slug", "a-lane", "--write-fence", "/nowhere"]);
  expect(both.status).toBe(EXIT.USAGE);
  expect(both.stderr).toContain("already performs --write-fence");

  const seat = run(["--dispatch-lane", "T-133", "--slug", "a-lane", "--take-seat"]);
  expect(seat.status).toBe(EXIT.USAGE);
  expect(seat.stderr).toContain("take the seat, then dispatch");

  // AND THE ARM IS ON THE HELP LINE, because a named arm nobody is told
  // about is a hand step that stayed a hand step.
  const help = run(["--help"]);
  expect(help.status).toBe(EXIT.CLEAN);
  expect(help.stdout).toContain("--dispatch-lane");

  const statusAfter = spawnSync("git", ["-C", repoRoot, "status", "--porcelain"], { encoding: "utf8" });
  expect(statusAfter.stdout, "a refused invocation moved the working tree").toBe(statusBefore.stdout);
});
