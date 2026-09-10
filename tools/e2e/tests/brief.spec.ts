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
import { conventionsText, liveTaskCards, taskStatuses, trackedFiles } from "../scripts/docs-scan.mjs";
import {
  BASE_TOKEN,
  DERIVERS,
  DISPATCH_STEPS,
  AwaitFinding,
  DispatchLaneFinding,
  EXIT,
  ModelFinding,
  GATE_SOURCE_DIRS,
  GROUND_ADDENDUM_HEADING,
  NO_GROUND,
  PACK_TRANSCRIPTION_LIMIT,
  PHASE1_SPAWN_NOTE,
  PARKED_STATUS,
  PIPE_BUFFER_BYTES,
  PROSE_WAKE_PATTERN,
  ROLE_TEMPLATE_KEYS,
  RUNTIME_TEMPLATE,
  SPAWNSYNC_DEFAULT_MAXBUFFER,
  TRIAGE_STATUSES,
  WAKE_FENCE,
  WOKEN_BY_STATUS,
  architectureText,
  assembleBrief,
  awaitPlan,
  boardCensus,
  byCardId,
  ceremonyRows,
  classKin,
  classStem,
  citedConventionBullets,
  citedOpening,
  components,
  context,
  contractRows,
  conventionHeadings,
  createLaneArgv,
  dispatchLanePlan,
  dispatchLaneRecs,
  dispatchSpellings,
  docsNamed,
  fenceLedger,
  fenceOverlaps,
  fencePaths,
  fieldList,
  fieldScalar,
  findableNeedle,
  blessedRunner,
  censusSection,
  classifyTier,
  frontmatterFields,
  gateSources,
  groundDocument,
  guardClassHits,
  guardClassIds,
  guardClassMap,
  guardTokenCovers,
  insideRepository,
  keeperVerdict,
  integrationRefCandidates,
  lanePort,
  laneScratchName,
  laneScratchStem,
  laneSpellings,
  laneWorktrees,
  liveProv,
  mainWorktree,
  manifestVerdict,
  marginRecs,
  methodNamed,
  namedDisciplines,
  note,
  numberedStep,
  packRecs,
  packageCommands,
  parkedBoard,
  parseWorktreePorcelain,
  readAdditions,
  readDoc,
  readWake,
  renderPhase1,
  renderPhase2,
  readSubtractions,
  render,
  resolveIntegrationRef,
  roleText,
  roleModel,
  roleModels,
  ruleWake,
  runAwait,
  runDispatchLane,
  runtimeTemplateText,
  sealDocument,
  sha256,
  sharedGround,
  slugMapFromFields,
  slugMapFromProse,
  slugsSharingComponents,
  specBodies,
  stampCard,
  stampVerdict,
  standingGates,
  stateReport,
  TierFinding,
  treeProv,
  triageBoard,
  triageClusterRecs,
  triageClusters,
  unstampedLines,
  value,
  wakeRecs,
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
 * being built — `supertaskr-T-132-verify` at dispatch and `supertaskr-T-127-verify`
 * an hour later — and a path filter counts both as lanes holding fences
 * that nobody holds.
 */
const PORCELAIN_FIXTURE = [
  "worktree /Users/x/supertaskr",
  "HEAD 1111111111111111111111111111111111111111",
  "branch refs/heads/main",
  "",
  "worktree /Users/x/supertaskr-T-901",
  "HEAD 2222222222222222222222222222222222222222",
  "branch refs/heads/task/T-901-a-real-lane",
  "",
  "worktree /Users/x/supertaskr-T-902",
  "HEAD 3333333333333333333333333333333333333333",
  "detached",
  "",
  "worktree /Users/x/supertaskr-T-901-verify",
  "HEAD 2222222222222222222222222222222222222222",
  "detached",
  "",
  "worktree /Users/x/supertaskr-T-903",
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

  // THE CONTROL THAT SURVIVES THIS PROJECT'S OWN STANDING READ, DERIVED
  // RATHER THAN NAMED. At least one document the adapter lists is one this
  // role file leaves alone, so every presence asserted below is decided by
  // what the adapter named and not by an empty set.
  const untouched = adapterLines
    .flatMap((l) => readFirstList(l, " names: "))
    .filter((d) => !subtracted.includes(d));
  expect(
    untouched,
    "the adapter names nothing this role file leaves alone, so every presence below proves nothing",
  ).not.toEqual([]);

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
  // THE SUBTRACTION HALF, AND WHERE ITS CONTROL NOW LIVES. This role file
  // subtracts documents no adapter names any more — T-293 retired the
  // five-file order — so an assertion that some adapter still names them
  // would be a red about THIS PROJECT'S standing read rather than about
  // row 3, and the absence below would be true for free. What the live
  // tree can still decide is that the row SAYS what it removed and removes
  // what it says; the not-vacuous half is the sibling body's, which
  // rewrites the role file to subtract a document the adapter DOES name
  // and watches it leave the applied set and come back.
  for (const gone of subtracted) {
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
  expect(appliedPlain, "the addition survived a role file that no longer asks for it").not.toContain(
    added[0],
  );
  expect(
    renderedPlain.some((l) => l.startsWith("# ") && l.includes("stands unchanged")),
    "row 3 applied nothing and said nothing about it — a reader cannot tell that from a row that " +
      "silently failed to read the role file",
  ).toBe(true);

  // THE OTHER HALF OF "NOT A CONSTANT", AND SINCE T-293 THE WHOLE OF THIS
  // BODY'S SUBJECT: a role file subtracting a DIFFERENT document strikes
  // THAT one instead. It has to be this way round now — the documents this
  // role file really subtracts are ones no adapter names since the standing
  // read became STATE plus the generated index, so striking one out of the
  // role file moves nothing and proves nothing. The replacement is DERIVED
  // — the last document the adapter names that is not already subtracted —
  // so this body holds no document name of its own either.
  const adapterFirst = adapterPlain[0] ?? [];
  const other = [...adapterFirst].reverse().find((d) => !subtracted.includes(d)) ?? "";
  expect(
    other,
    "the adapter names only the subtracted documents, so nothing can be swapped",
  ).not.toBe("");
  const moved = md.split(subtracted[0] ?? "").join(other);
  expect(moved).not.toBe(md);
  // THE ROLE FILE MAY SUBTRACT MORE THAN ONE DOCUMENT (T-254: the pack's
  // own subtraction of docs/CONVENTIONS.md joined docs/ROADMAP.md's); the
  // swapped one moves and the others stand, in the file's own order.
  expect(readSubtractions(moved)).toEqual([other, ...subtracted.slice(1)]);
  const renderedMoved = render(assembleBrief({ ...ctx, roleMd: moved, findings: [] }).recs).split("\n");
  const appliedMoved = readFirstList(renderedMoved.find((l) => l.includes(APPLIED)) ?? "", APPLIED);
  expect(
    appliedMoved,
    `the role file now subtracts ${other} and the applied set still carries it`,
  ).not.toContain(other);

  // AND IT COMES BACK WHEN THE CLAUSE GOES. The same rewritten role file,
  // its subtraction and addition sentences struck out the same way the
  // plain arm struck this file's own, hands back the adapter's list whole —
  // so what removed the document above was the CLAUSE, and not a document
  // this module remembers rather than reads.
  const movedPlain = moved
    .split("\n")
    .filter((l) => !l.includes("do NOT read ") && !l.includes("ADDITION TO THAT SET IS "))
    .join("\n");
  expect(readSubtractions(movedPlain)).toEqual([]);
  expect(readAdditions(movedPlain)).toEqual([]);
  const renderedBack = render(assembleBrief({ ...ctx, roleMd: movedPlain, findings: [] }).recs).split(
    "\n",
  );
  const appliedBack = readFirstList(renderedBack.find((l) => l.includes(APPLIED)) ?? "", APPLIED);
  expect(appliedBack, "the subtracted document did not come back").toContain(other);
  expect(
    appliedBack,
    `the role file no longer subtracts ${other} and the applied set is still not the adapter's own ` +
      "list — the difference row 3 applies is a constant in the tool rather than a reading",
  ).toEqual(adapterFirst);
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
  // EVERY sentence that names a document subtracts exactly it, and the one
  // naming none subtracts nothing (T-254 added a second backticked
  // subtraction, docs/CONVENTIONS.md, beside docs/ROADMAP.md's).
  const naming = sentences.filter((l) => docsNamed(l).length > 0);
  expect(naming.length, "no `do NOT read` sentence here names a document").toBeGreaterThan(0);
  expect(subtracted.length, "the backticked spelling was not read as a document").toBe(naming.length);
  expect(subtracted).toEqual(naming.map((l) => docsNamed(l)[0]));
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
  // better disguise: under a path filter `supertaskr-T-901-verify` becomes a
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
  // in supertaskr-index prints at every run for the same reason, and says
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
 * ONE IDENTITY FOR THIS MODULE'S FIXTURES, SPELLED ONCE (T-239-s4).
 *
 * It reaches a fixture repository by TWO channels, and they are NOT
 * interchangeable — which is the whole of that card:
 *
 * - the ENVIRONMENT below, which every `git` THIS PROCESS runs through
 *   `fixtureGit` inherits and nothing else does; and
 * - the fixture repository's OWN CONFIG, which every `git` run against
 *   that repository reads whoever runs it — a subprocess this module
 *   spawns included, and the dispatch arm is one.
 *
 * A fixture carrying only the first is green on a developer machine and
 * red on a runner. `configureFixtureIdentity` below is the second, and
 * carries the measurement.
 */
const FIXTURE_IDENT = Object.freeze({
  name: "t153s9",
  email: "t153s9@example.invalid",
});

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
  GIT_AUTHOR_NAME: FIXTURE_IDENT.name,
  GIT_AUTHOR_EMAIL: FIXTURE_IDENT.email,
  GIT_COMMITTER_NAME: FIXTURE_IDENT.name,
  GIT_COMMITTER_EMAIL: FIXTURE_IDENT.email,
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
    "worktree /Users/x/supertaskr",
    "HEAD 1111111111111111111111111111111111111111",
    "branch refs/heads/main",
    "",
    ...ids.flatMap((id, i) => [
      `worktree /Users/x/supertaskr-${id}`,
      `HEAD ${String(i + 2).repeat(40)}`,
      `branch refs/heads/task/${id}-a-card-this-checkout-cannot-read`,
      "",
    ]),
    `worktree /Users/x/supertaskr-${real}`,
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
    "worktree /Users/x/supertaskr",
    "HEAD 1111111111111111111111111111111111111111",
    "branch refs/heads/main",
    "",
    "worktree /Users/x/supertaskr-T-153-s2",
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
 * `docs/CONVENTIONS.md` publishes the lane worktree as `../supertaskr-T-NNN`.
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
  const main = path.join(dir, "supertaskr");
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
    "/Users/x/supertaskr",
  );
  expect(main.reason).toBe("");
  expect(main.via).toContain("git worktree list --porcelain");

  // POSITIVE CONTROL FOR THE FIRST-ENTRY CLAIM. The fixture holds four
  // more worktrees, so "it answered /Users/x/supertaskr" is a choice among
  // five and not the only path there was to hand back.
  const entries = parseWorktreePorcelain(PORCELAIN_FIXTURE);
  expect(entries.length).toBeGreaterThan(1);
  expect(entries.map((e) => e.path)).toContain("/Users/x/supertaskr-T-901");
  expect(entries.every((e) => e.bare)).toBe(false);

  // THE REFUSALS — the tool's own established idiom, and better than a
  // confident wrong path. A BARE repository has no working tree for a
  // sibling to be a sibling OF, and git says so in one word.
  const bare = mainWorktree(["worktree /Users/x/supertaskr.git", "bare", ""].join("\n"));
  expect(parseWorktreePorcelain(["worktree /Users/x/supertaskr.git", "bare", ""].join("\n"))[0]?.bare)
    .toBe(true);
  expect(bare.path, "a bare repository is not a checkout, and this must not answer with one").toBe(
    "",
  );
  expect(bare.reason).toContain("BARE");
  expect(bare.reason).toContain("/Users/x/supertaskr.git");

  const empty = mainWorktree("");
  expect(empty.path).toBe("");
  expect(empty.reason).toContain("named no worktree");
  // AND IT SAYS WHY IT WILL NOT FALL BACK, because the fallback IS the defect.
  expect(empty.reason).toContain("the checkout it ran in");

  // THE CONTAINMENT TEST RULE THREE IS ABOUT, both directions. The sibling
  // is OUT; the nested path the brief used to print is IN; and the root
  // itself is IN, because the repository is not a sibling of itself.
  expect(insideRepository("/Users/x/supertaskr", "/Users/x/supertaskr-T-179")).toBe(false);
  expect(
    insideRepository("/Users/x/supertaskr", "/Users/x/supertaskr/.claude/worktrees/supertaskr-T-179"),
    "this is the exact path the brief printed under the heading citing rule three",
  ).toBe(true);
  expect(insideRepository("/Users/x/supertaskr", "/Users/x/supertaskr")).toBe(true);
});

test("THE SWEEP: no derived row moves when only the dispatching checkout moves, and the movers are named", () => {
  // KILLED BY: `path.resolve(ctx.root, worktree)` in `deriveLane` — the
  // sentence this card removes. MEASURED AGAINST IT BEFORE THE ZERO BELOW
  // WAS WRITTEN DOWN: the fixture's own tar is a checkout of the pre-fix
  // tree, and running ITS `brief.mjs` over the same two roots produced a
  // third moved line, `worktree (absolute, per lane-protocol rule three)`,
  // naming `<main>/.claude/worktrees/supertaskr-T-133`.
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
    //    line WAS: it carried the bare relative `../supertaskr-T-133`, and a
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
 *
 * `identity: false` WITHHOLDS the step below, and it exists for exactly
 * one caller: the positive control of the body that proves the step is
 * load-bearing. A control BUILT by the producer cannot drift from its
 * subject the way one written to look similar can (docs/CONVENTIONS.md,
 * A NEGATIVE ASSERTION NEEDS A POSITIVE CONTROL).
 */
function configureFixtureIdentity(root: string): void {
  // THE ARM'S OWN `git commit` IS A SUBPROCESS AND INHERITS NOTHING FROM
  // `FIXTURE_GIT_ENV` (T-239-s4). The ritual is re-entered as a spawned
  // node process, which runs `git -C <root> commit …` with whatever
  // identity the MACHINE has — so on every developer machine here the
  // dispatch stamped happily and on the CI runner it stopped at step 1
  // with *"Please tell me who you are"* (run 33672240360, main red at
  // 9646618). The repository's own config is the one channel both this
  // process and that subprocess read, so the identity goes HERE and the
  // arm stays exactly what a real dispatch runs.
  fixtureGit(root, ["config", "user.name", FIXTURE_IDENT.name]);
  fixtureGit(root, ["config", "user.email", FIXTURE_IDENT.email]);
}

function ritualFixture(name: string, opts: { identity?: boolean } = {}): RitualFixture {
  // REALPATH, and it is load-bearing for the same reason `nestedShapes`
  // gives: `/var` is a symlink to `/private/var` on macOS, git reports the
  // resolved spelling and `mkdtemp` hands back the symlinked one.
  const dir = realpathSync(mkdtempSync(path.join(os.tmpdir(), "t239-ritual-")));
  const home = path.join(dir, name);
  const root = path.join(home, "supertaskr");
  mkdirSync(root, { recursive: true });
  const tar = path.join(dir, "tree.tar");
  writeFileSync(
    tar,
    execFileSync("git", ["-C", repoRoot, "archive", "HEAD"], { maxBuffer: 512 * 1024 * 1024 }),
  );
  execFileSync("tar", ["-x", "-f", tar, "-C", root]);
  writeFileSync(path.join(root, FIXTURE_CARD_FILE), FIXTURE_CARD);
  fixtureGit(root, ["init", "--initial-branch=main", "--quiet"]);
  if (opts.identity !== false) configureFixtureIdentity(root);
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

/**
 * THE FINDINGS A `brief.mjs` RUN REPORTED, split back out of its stderr.
 *
 * The command prints them as `brief: FOUND N thing(s)…` and then one
 * two-space-indented line per finding, closing with a fixed paragraph. A
 * finding carrying its own newlines continues UNindented, so a
 * continuation is folded back into the finding above it rather than
 * counted as one.
 */
function dispatchFindings(stderr: string): string[] {
  const lines = stderr.split("\n");
  const start = lines.findIndex((l) => /^brief: FOUND \d+ thing\(s\)/.test(l));
  if (start < 0) return [];
  const out: string[] = [];
  for (const line of lines.slice(start + 1)) {
    if (/^ {2}Each of these is a row/.test(line)) break;
    if (/^ {2}\S/.test(line)) {
      out.push(line.slice(2));
      continue;
    }
    if (out.length > 0 && line.trim() !== "") out[out.length - 1] += `\n${line}`;
  }
  return out;
}

/**
 * A DISPATCH THAT HAPPENED, WHATEVER THE COMMAND'S OWN EXIT WAS — and the
 * distinction is the point rather than a loosening.
 *
 * **`--dispatch-lane` JOINS THE ARMING CONDITION**, so it runs the
 * stale-checkout catcher before it looks at a card. Every lane worktree
 * and every verifier's bench is behind `main` BY CONSTRUCTION — that is
 * what a lane IS — so on any of them the catcher correctly reports the
 * session's own checkout and the command correctly answers `FOUND`. A
 * body that required `CLEAN` was therefore green until `main` moved and
 * red for ever after, aborting before the comparison it exists for. That
 * is exactly the rule *"THE COMMAND IS A READ"* states above and gives
 * its reason for, arriving in a body written after it.
 *
 * **WHAT IS NOT LOOSENED IS WHICH FINDINGS ARE ALLOWED.** A `FOUND` here
 * must be the catcher and nothing else: every finding has to be about the
 * checkout this SESSION was started in, and none may name the fixture the
 * dispatch was aimed at. So a ritual that actually failed a step — whose
 * finding opens *"the dispatch stopped at step…"* and names the fixture —
 * still reds these bodies, which is the property the `CLEAN` assertion
 * was there for in the first place.
 */
function expectDispatched(
  ran: { status: number | null; stderr: string },
  fx: RitualFixture,
  what: string,
): void {
  expect([EXIT.CLEAN, EXIT.FOUND], `${what}: ${ran.stderr}`).toContain(ran.status);
  if (ran.status === EXIT.CLEAN) return;
  const findings = dispatchFindings(ran.stderr);
  expect(
    findings.length,
    `${what} answered FOUND and printed no finding this reader could find`,
  ).toBeGreaterThan(0);
  for (const f of findings) {
    expect(
      f,
      `${what} reported a finding that is NOT the session's own stale checkout, so something ` +
        "about this dispatch was found and the comparison below would be comparing a failure",
    ).toContain("the checkout this session was started in is STALE");
    expect(
      f,
      `${what} reported a finding naming the fixture it was aimed at, which is a finding about ` +
        "the dispatch and not about the seat",
    ).not.toContain(path.dirname(fx.root));
  }
}

test("THE ARM LEAVES EXACTLY WHAT THE HAND STEPS LEAVE, file for file, plus the one file no hand can type", () => {
  // KILLED BY: a step dropped from `DISPATCH_STEPS`, a step reordered, the
  // bench cut on a branch instead of detached, the lane cut at the
  // integration tip instead of at the stamp, and the brief written under a
  // name the SCRATCH RULE does not publish. IT IS AN END-TO-END BODY and
  // its kill set therefore also covers the arms the ritual re-enters —
  // `--preflight`, `--write-fence` and `--task` — because a ritual that
  // cannot run them leaves nothing to compare.
  //
  // T-296 MOVED THE CLAIM IN TWO PLACES AND BOTH ARE STATED RATHER THAN
  // QUIETLY ABSORBED. The stamp now carries a DERIVED `tier:` line, so the
  // hand side types the tier it expects and a classifier that answered
  // differently reds this body. And the arm additionally renders the
  // tool-less phase 1 brief — which is precisely the file a hand ritual
  // cannot produce, since its whole property is that a PROGRAM assembled
  // it from the card at the base with nothing from the lane in scope. The
  // three TREES still match file for file; the scratch directory is where
  // the arm does one thing more, and it is asserted below rather than
  // excluded.
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
    expectDispatched(ran, arm, "the arm's dispatch");

    // ── THE HAND RITUAL: the same eight steps, typed here ──────────────
    // Two sides sharing no constant: the arm derives its lane names from
    // the document, and this side derives them from the fixture's own
    // layout and the same document read independently.
    const s = laneSpellings(conventions());
    const home = path.dirname(hand.root);
    const laneWt = path.join(home, s.worktreePattern.replace("T-NNN", FIXTURE_CARD_ID).replace("../", ""));
    const benchWt = path.join(home, `supertaskr-V-${FIXTURE_CARD_ID}`);
    const branch = s.branchPattern.replace("T-NNN", FIXTURE_CARD_ID).replace("<slug>", FIXTURE_SLUG);
    const cardPath = path.join(hand.root, FIXTURE_CARD_FILE);

    // 1 — stamp on the integration branch, commit, and read it back. The
    //     tier is typed HERE, from this side's own reading of the card:
    //     size S, a fence of README.md, nothing guard-class in it.
    //     THE MODELS ARE READ THE WAY A HAND DISPATCHER READS THEM
    //     (T-298): open the runtime template, find the role's line, copy
    //     the value. It is a plain regex rather than the production
    //     parser on purpose — a hand side that called the arm's own
    //     reader would be comparing that reader with itself.
    const handTemplate = readFileSync(path.join(hand.root, RUNTIME_TEMPLATE), "utf8");
    const handModel = (key: string) => {
      const m = new RegExp(`^\\s+${key}:\\s*(.*)$`, "m").exec(handTemplate);
      const raw = (m?.[1] ?? "").split(" #")[0] ?? "";
      expect(raw.trim(), `the fixture's template names no model for ${key}`).not.toBe("");
      return raw.trim();
    };
    writeFileSync(
      cardPath,
      readFileSync(cardPath, "utf8")
        .replace("status: planned", "status: building")
        .replace("size: S", "size: S\ntier: standard")
        .replace(/^builder:.*$/m, `builder: ${handModel("builder")}`)
        .replace(/^verifier:.*$/m, `verifier: ${handModel("verifier")}`),
    );
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
    const handManifest = JSON.parse(readFileSync(path.join(laneWt, ".supertaskr", "lane-fence.json"), "utf8"));
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
    const armLane = path.join(armHome, `supertaskr-${FIXTURE_CARD_ID}`);
    const armBench = path.join(armHome, `supertaskr-V-${FIXTURE_CARD_ID}`);

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
    ).toContain(path.join(".supertaskr", "lane-fence.json"));

    // The manifest, and the brief, byte for byte once the two things that
    // legitimately differ are normalised away.
    expect(
      normalise(readFileSync(path.join(armLane, ".supertaskr", "lane-fence.json"), "utf8"), arm),
    ).toBe(normalise(readFileSync(path.join(laneWt, ".supertaskr", "lane-fence.json"), "utf8"), hand));
    const armBrief = path.join(arm.scratch, `brief-${FIXTURE_CARD_ID}.txt`);
    const briefValues = (file: string, fx: RitualFixture) =>
      values(normalise(readFileSync(file, "utf8"), fx));
    expect(briefValues(armBrief, arm).length).toBeGreaterThan(0);
    expect(
      briefValues(armBrief, arm),
      "the brief the arm wrote is not the brief the hand ritual wrote",
    ).toEqual(briefValues(handBrief, hand));

    // AND THE ONE FILE NO HAND CAN TYPE (T-296): the phase 1 brief, which
    // the arm renders from the card AT THE BASE and from the verifier's
    // role file, and from nothing the lane produced. The hand ritual has
    // no such file, and that asymmetry is the point rather than a gap.
    const armPhase1 = path.join(arm.scratch, `phase1-${FIXTURE_CARD_ID}.txt`);
    expect(existsSync(armPhase1), "the arm rendered no phase 1 brief").toBe(true);
    expect(existsSync(path.join(hand.scratch, `phase1-${FIXTURE_CARD_ID}.txt`)), "the hand ritual has none").toBe(false);
    const phase1 = readFileSync(armPhase1, "utf8");
    expect(phase1, "it carries the card's own criteria").toContain("THE card SHALL exist.");
    expect(phase1, "it carries the role file it is judged by").toContain("# Role: verifier");
    expect(phase1, "and it names the base it was read at").toContain(armBase);
    expect(
      phase1.includes(FIXTURE_SLUG),
      "the phase 1 brief names the lane's own branch slug, which is a fact from AFTER the cut",
    ).toBe(false);
    expect(ran.stdout, "and the arm printed the line the seat pastes").toContain("AN ARM CANNOT SPAWN A SEAT");
  } finally {
    removeGitFixture(arm.dir, "ritualFixture(one)");
    removeGitFixture(hand.dir, "ritualFixture(two)");
  }
});

/**
 * A `git` ENVIRONMENT WITH NO IDENTITY IN IT, ON EVERY HOST — which is
 * strictly more than "no config files", and the distinction is what made
 * the defect above invisible to every local battery (T-239-s4).
 *
 * Suppressing the two config files is the recipe docs/CONVENTIONS.md
 * publishes for borrowing a runner's git environment, and it does NOT
 * reproduce this failure: with no configured identity git AUTO-DETECTS
 * one from the OS — `<user>@<hostname>` — and commits with a warning.
 * Whether that auto-detection SUCCEEDS is a property of the HOST: this
 * developer's machine answers to `Mac.lan`, git reads the dot as a
 * domain and is satisfied; a runner's hostname carries none, git refuses
 * with *"unable to auto-detect email address"*, and the same tree is
 * green here and red there. That is the T-238-s2 class the card names.
 *
 * `user.useConfigOnly` is git's OWN switch for "do not auto-detect", so
 * it produces the runner's ANSWER on every host instead of only on hosts
 * whose hostname happens to lack a dot — and it is written into a
 * GIT_CONFIG_GLOBAL file rather than passed with `-c`, because the
 * subject of the assertion is a `git` this body does not spell.
 *
 * HOME IS DELIBERATELY NOT TOUCHED: Playwright caches its browsers under
 * `~/`, and clobbering it reds 54 browser bodies for an unrelated reason
 * (docs/CONVENTIONS.md, the borrowed-git-environment bullet, which was
 * itself written from that mistake).
 */
function noIdentityEnv(dir: string): NodeJS.ProcessEnv {
  const file = path.join(dir, "gitconfig-no-identity");
  writeFileSync(file, "[user]\n\tuseConfigOnly = true\n");
  const env: NodeJS.ProcessEnv = { ...process.env };
  for (const key of [
    "GIT_AUTHOR_NAME",
    "GIT_AUTHOR_EMAIL",
    "GIT_COMMITTER_NAME",
    "GIT_COMMITTER_EMAIL",
    "EMAIL",
  ]) {
    delete env[key];
  }
  env["GIT_CONFIG_GLOBAL"] = file;
  env["GIT_CONFIG_SYSTEM"] = "/dev/null";
  return env;
}

test("THE RITUAL FIXTURE CARRIES ITS OWN GIT IDENTITY, so a git that inherits none can still commit in it", () => {
  // KILLED BY: the two `git config` lines dropped from the fixture, an
  // identity written only into this process's environment, and a
  // `user.email` configured without a `user.name` or the other way round.
  // IT IS THE ONE BODY IN THIS FILE THAT ANSWERS THE SAME WAY ON A
  // DEVELOPER MACHINE AND ON A RUNNER, which is its whole reason for
  // existing: the end-to-end body above spawns the arm with the MACHINE'S
  // identity, so it is the machine and not the tree that it measures, and
  // it was green in the lane, on the bench and in twenty-eight batteries
  // while CI run 33672240360 stopped the same dispatch at step 1.
  const fx = ritualFixture("one", { identity: false });
  try {
    const env = noIdentityEnv(fx.dir);
    // The arm's step-1 shape: a `git` run AGAINST the fixture by somebody
    // who is not this process. `--allow-empty` keeps the probe off the
    // tree — identity is resolved before a commit is written either way.
    const commit = (): { status: number | null; stderr: string } => {
      const r = spawnSync(
        "git",
        ["-C", fx.root, ...NO_BACKGROUND_MAINTENANCE, "commit", "--quiet", "--allow-empty", "-m", "identity probe"],
        { encoding: "utf8", env },
      );
      return { status: r.status, stderr: r.stderr };
    };
    const configured = (key: string) =>
      spawnSync("git", ["-C", fx.root, "config", "--get", key], { encoding: "utf8", env });

    // ── THE POSITIVE CONTROL, RUN FIRST AND REQUIRED TO FAIL ───────────
    // Without it a green below is satisfied equally by an environment
    // that never disabled anything.
    expect(
      configured("user.email").status,
      "the control repository already carries an identity, so it controls for nothing",
    ).not.toBe(0);
    const control = commit();
    expect(
      control.status,
      `the borrowed environment did not disable git's identity at all: ${control.stderr}`,
    ).not.toBe(0);
    expect(
      control.stderr,
      "the control failed for some reason other than the one the runner failed for",
    ).toContain("Please tell me who you are");

    // ── THE SUBJECT: the producer's own step, and nothing else ─────────
    configureFixtureIdentity(fx.root);
    expect(configured("user.name").stdout.trim()).toBe(FIXTURE_IDENT.name);
    expect(configured("user.email").stdout.trim()).toBe(FIXTURE_IDENT.email);
    const subject = commit();
    expect(
      subject.status,
      `a git inheriting no identity could not commit in the fixture: ${subject.stderr}`,
    ).toBe(0);
    expect(
      spawnSync("git", ["-C", fx.root, "log", "-1", "--format=%an <%ae>"], {
        encoding: "utf8",
        env,
      }).stdout.trim(),
      "the commit was authored by somebody other than the fixture's own identity",
    ).toBe(`${FIXTURE_IDENT.name} <${FIXTURE_IDENT.email}>`);
  } finally {
    removeGitFixture(fx.dir, "ritualFixture(identity)");
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
  /** What was written, by file — the phase 1 brief's own text lives here. */
  written: Map<string, string>;
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
  const written = new Map<string, string>();
  // THE KEEPER THIS STUB REPORTS IS GREEN AND GRADED, so the tier step
  // has a real answer to classify with — which is also what makes the
  // expected tier below computable on this side without re-running the
  // arm. A failing keeper is injected as the RED that step really meets.
  const keeperGreen = { pinned: true, answered: true, why: "the stub graded the fence green" };
  // THE TIER'S OWN INJECTED FAILURE IS A CARD WITH NO SIZE (T-296): the
  // classifier reads the card and the tree, so the only honest way to
  // make it refuse is to hand it a card it cannot read. The plan is the
  // card's side of that input, and this is the one place a body moves it.
  if (failing === "tier") plan.tierInput.size = "";
  const expectedTier =
    failing === "tier" ? "" : classifyTier({ ...plan.tierInput, keeper: keeperGreen }).tier;
  const stampFields = { ...plan.stamp, ...(expectedTier === "" ? {} : { tier: expectedTier }) };
  const stamped = stampCard(FIXTURE_CARD, stampFields, { insertAfter: { tier: "size" } }).text;
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
      if (has(String(plan.keeperArgv[1]))) {
        // A GRADED READING EITHER WAY — the difference between a red
        // baseline and a derivation that graded nothing is the VERDICT
        // LINE, not the exit, so both answers carry one.
        return failing === "keeper"
          ? { status: 1, stdout: `${plan.keeperVerdictToken} suite=e2e verdict=RED bodies=7\n`, stderr: "" }
          : { status: 0, stdout: `${plan.keeperVerdictToken} suite=e2e verdict=GREEN bodies=7\n`, stderr: "" };
      }
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
      // THE KEEPER STEP READS THE RUNNER ITSELF, to tell "this project
      // publishes no keeper runner" from "the keeper ran". The stub
      // publishes one.
      if (file === plan.keeperArgv[1]) return "// the runner";
      throw new Error(`the stub was asked for ${file}, which no step of this ritual reads`);
    },
    write: (file: string, text: string) => {
      writes.push(file);
      written.set(file, text);
      if (failing === "phase1" && file === plan.phase1File) {
        throw new Error(`EACCES: permission denied, open '${file}'`);
      }
    },
  };
  return { io, calls, reads, writes, written };
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
    case "keeper":
      return call((c) => c.argv.includes(String(plan.keeperArgv[1])));
    case "tier":
      // THE TIER STEP RUNS NO COMMAND — it classifies, and the only trace
      // it leaves in this world is the card read it takes to see whether
      // an author wrote a tier by hand. It runs BEFORE the stamp, so that
      // read is unambiguous evidence this step was reached.
      return stub.reads.includes(plan.cardFile);
    case "phase1":
      return stub.writes.includes(plan.phase1File);
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
    // code that step legitimately answers with the document written — and
    // the phase 1 step's is one for the plainer reason that a file it
    // could not write is not a finding about the card.
    expect(result.code).toBe(
      step.id === "brief" || step.id === "phase1" ? EXIT.CANNOT_RUN : EXIT.FOUND,
    );

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
    // THE STEP NUMBERS ARE DERIVED FROM `DISPATCH_STEPS`, never typed:
    // T-296 put three steps into this ritual and a typed 6 and 2 would
    // have moved silently under them.
    const stepNo = (id: string) =>
      (DISPATCH_STEPS.find((d) => d.id === id) as (typeof DISPATCH_STEPS)[number]).n;
    const expected = [
      ...(step.n > stepNo("bench") ? [plan.bench] : []),
      ...(step.n > stepNo("cut") ? [plan.worktree] : []),
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
    ).toBe(step.n > stepNo("cut"));
  });
}

test("THE RITUAL READS THE STAMP BACK OUT OF THE COMMIT, and a commit that does not carry it stops it at the stamp", () => {
  // KILLED BY: reading the stamp off the WORKING TREE (which the writer
  // just wrote, so it always agrees), and by dropping the read-back
  // altogether. The lane inherits its stamp in its BASE, so a commit that
  // does not carry it is a lane cut from a card the board calls unstarted.
  const plan = stubPlan();
  const stub = ritualStub(plan, "read-back");
  const result = runDispatchLane(plan, stub.io);
  const stopped = result.stopped as NonNullable<typeof result.stopped>;
  // THE NUMBER IS DERIVED FROM `DISPATCH_STEPS` AND NEVER TYPED: T-296
  // put two steps in front of the stamp, and a typed 1 would have moved
  // silently under them.
  expect(stopped.n).toBe((DISPATCH_STEPS.find((d) => d.id === "stamp") as (typeof DISPATCH_STEPS)[number]).n);
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
    worktree: "/Users/x/supertaskr-T-133",
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
    .replace(`\`${sp.portPattern}\``, "`SUPERTASKR_E2E_PORT=27000+<card number>`")
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
  const lane = { branchName: "task/T-901-a-lane", worktree: "/Users/x/supertaskr-T-901" };
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
    expectDispatched(ran, fx, "the arm's dry run");

    // THE ORDER IS THE LAW, and the plan is where a reader checks it.
    const printed = values(ran.stdout).filter((l) => /^step \d+ — /.test(l));
    expect(printed.map((l) => l.replace(/^step (\d+) — ([a-z0-9]+):.*$/, "$1 $2"))).toEqual(
      DISPATCH_STEPS.map((s) => `${s.n} ${s.id}`),
    );
    // AND THE BLOCK OF LANE FACTS IS ALL NINE, plus the card they derive
    // from. The tier and the phase 1 brief joined the block at T-296: the
    // tier because it is stamped into the base the lane inherits, and the
    // phase 1 path because it is the ONE file a dispatcher pastes from.
    for (const label of ["branch: ", "worktree: ", "base hash: ", "bench: ", "port: ",
      "scratch stem: ", "brief path: ", "tier: ", "phase 1 brief: "]) {
      expect(values(ran.stdout).some((l) => l.trim().startsWith(label)), `no ${label} row`).toBe(true);
    }
    expect(
      ran.stdout,
      "a dry run named a tier it has not derived — the classification runs as a STEP, and the " +
        "plan prints what it will do rather than an answer it has not computed",
    ).toContain("<derived at the tier step");
    expect(ran.stdout, "the base is a commit the dry run has not made, and must not be named").toContain(
      `base hash: ${BASE_TOKEN}`,
    );
    // EVERY LINE THE ARM EMITS IS STAMPED — the module's own provenance
    // floor, applied to the rows this card adds.
    expect(unstampedLines(ran.stdout.split("\n").filter((l) => /^(step \d| *(branch|worktree|base hash|bench|port|scratch stem|brief path|tier|phase 1 brief): )/.test(l)).join("\n"))).toEqual([]);

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

/* ────────────────────────────────────────────────────────────────────
 * THE CONTEXT PACK (T-254).
 *
 * An executor's standing read is its card plus STATE, ARCHITECTURE and
 * CONVENTIONS — and three quarters of that is the last document, most of
 * which is rules a GATE enforces. These bodies pin the pack that replaces
 * the whole-document read: that its bullet set is DERIVED from the gates'
 * own citations rather than listed, that a long bullet is CITED and a
 * short one TRANSCRIBED byte-exact, that the two ways a pack can be empty
 * are said APART, and that the brief says in as many words whose read the
 * whole document is.
 * ──────────────────────────────────────────────────────────────────── */

/**
 * A phrase DEEP inside a passage that occurs exactly ONCE in the whole
 * document, so its absence from the brief is evidence about THIS passage
 * and not about whichever bullet happens to share a sentence with it.
 *
 * The window walks rather than being pinned at an offset: a fixed
 * sixty-percent slice lands wherever the reflow puts it, and this
 * document repeats whole clauses across its gate bullets on purpose.
 * Returns "" when the passage carries no unique window at all — which is
 * a FINDING the caller states, never a silent skip.
 */
function uniqueDeepPhrase(flat: string, flatDoc: string, width = 60): string {
  for (let at = Math.floor(flat.length * 0.4); at + width <= flat.length; at += 1) {
    const slice = flat.slice(at, at + width);
    if (flatDoc.split(slice).length === 2) return slice;
  }
  return "";
}

/** The pack's lines, out of a whole assembled brief. */
function packLines(taskId: string, full = false): string[] {
  return render(assembleBrief(context({ taskId, full })).recs)
    .split("\n")
    .filter((l) => l.startsWith("pack") || l.startsWith("# THE CONTEXT PACK") || l.startsWith("# a bullet this pack"));
}

test("THE CONTEXT PACK CARRIES THE METHOD FILES, THE CITED BULLETS AND THE COMPONENTS — and says whose read the whole document is", () => {
  // KILLED BY: dropping any of the three parts, by a method-file line
  // naming a file the role file does not name, by the CONVENTIONS size
  // drifting from the document, or by removing the sentence that hands
  // the whole document to the architect.
  const ctx = context({ taskId: "T-133" });
  const rendered = render(assembleBrief(ctx).recs);
  const lines = rendered.split("\n");

  const header = lines.find((l) => l.startsWith("# THE CONTEXT PACK")) ?? "";
  expect(header, "the brief carries no context pack at all").not.toBe("");
  expect(
    header,
    "the pack does not say that the WHOLE document is the architect's read — the sentence the " +
      "seat needs in order to stop reading is the one thing the pack may not leave to inference",
  ).toContain("ARCHITECT'S read");

  // PART ONE — the method files, cross-checked against a second reading
  // of the role file rather than against a list written here.
  const method = methodNamed(ctx.roleMd, `method/roles/${ctx.role}.md`, ctx.root);
  expect(method.length, "this role file names no method file, so the pack's first part has no subject").toBeGreaterThan(0);
  for (const m of method) {
    const line = lines.find((l) => l.startsWith(`pack method file: ${m.rel} `)) ?? "";
    expect(line, `the pack omits ${m.rel}, which this role file names`).not.toBe("");
    expect(line, `${m.rel}'s size in the pack is not its size at this ref`).toContain(`(${m.bytes} bytes)`);
    expect(
      readDoc(m.rel, ctx.root).length,
      `${m.rel} is in the pack and is not readable at this ref`,
    ).toBeGreaterThan(0);
  }
  // AND NOTHING ELSE: a pack that named the whole method directory would
  // satisfy every assertion above and none of the card's.
  const named = lines.filter((l) => l.startsWith("pack method file: ")).length;
  expect(named, "the pack names method files this role file does not").toBe(method.length);

  // PART TWO — the size figure is the document's own.
  const size = lines.find((l) => l.startsWith("pack: docs/CONVENTIONS.md is ")) ?? "";
  expect(size, "the pack states no size for the document it is standing in for").not.toBe("");
  expect(
    size,
    "the pack's CONVENTIONS size is not the document's size at this ref — a reader deciding what " +
      "to skip on that figure would be deciding on a stale one",
  ).toContain(`${Buffer.byteLength(ctx.conventions, "utf8")} bytes`);

  // PART THREE — the components, on a card whose fence actually names a
  // SLUG. The card is DERIVED, so a promoted or renamed card does not
  // turn this body into a green over nothing.
  const withSlug = [...ctx.cards.values()].find((c) =>
    fieldList(c.fields, "touches").some((t) => ctx.slugs.has(t)),
  );
  expect(withSlug, "no live card fences a component slug, so this arm has no subject").toBeDefined();
  const slugCtx = context({ taskId: (withSlug as NonNullable<typeof withSlug>).id });
  const slugLines = render(assembleBrief(slugCtx).recs).split("\n");
  const touchedSlugs = fieldList((withSlug as NonNullable<typeof withSlug>).fields, "touches").filter((t) =>
    slugCtx.slugs.has(t),
  );
  for (const slug of touchedSlugs) {
    for (const id of slugCtx.slugs.get(slug) ?? []) {
      const comp = slugCtx.comps.find((c) => c.id === id);
      expect(comp, `the slug map names ${id} and the registry does not carry it`).toBeDefined();
      expect(
        slugLines.some((l) => l.startsWith(`pack component: ${(comp as { file: string }).file} `)),
        `the pack omits ${id}, which the touched slug ${slug} reaches`,
      ).toBe(true);
    }
  }
  // AND THE OTHER SIDE: a card whose fence is bare paths gets no
  // component entry and SAYS so, rather than an empty section.
  expect(
    lines.some((l) => l.startsWith("pack component: ")) ||
      lines.some((l) => l.startsWith("# ") && l.includes("names no component SLUG")),
    "a fence with no slug produced neither a component entry nor the sentence saying why",
  ).toBe(true);

  process.stdout.write(
    `\n  brief PACK: ${method.length} method file(s), ` +
      `${citedConventionBullets(ctx.conventions, gateSources(ctx.root)).length} bullet(s) of ` +
      `${conventionHeadings(ctx.conventions).length} named, in a pack of ` +
      `${Buffer.byteLength(packLines("T-133").join("\n"), "utf8")} bytes against a document of ` +
      `${Buffer.byteLength(ctx.conventions, "utf8")}.\n`,
  );
});

test("THE PACK'S BULLET SET IS DERIVED FROM THE GATES' OWN CITATIONS, never listed here", () => {
  // KILLED BY: a hand list in the module (a synthetic corpus citing one
  // heading would still yield the live set), by a heading matched
  // anywhere in a bullet rather than at its opener, or by the corpus
  // widening past the two directories the gates live in.
  const ctx = context({ taskId: "T-133" });
  const sources = gateSources(ctx.root);
  expect(sources.length, "no gate source was found, so every derivation below is vacuous").toBeGreaterThan(0);
  for (const s of sources) {
    expect(
      GATE_SOURCE_DIRS.some((d) => s.rel.startsWith(d)),
      `${s.rel} is in the corpus and is under neither gate directory`,
    ).toBe(true);
  }

  const bullets = citedConventionBullets(ctx.conventions, sources);
  const lines = render(assembleBrief(ctx).recs).split("\n");
  expect(bullets.length, "the gates cite no bullet at this ref, so this body has no subject").toBeGreaterThan(0);

  for (const b of bullets) {
    expect(
      lines.some((l) => l.startsWith(`pack bullet: ${b.heading} `)),
      `the derivation names ${b.heading} and the pack does not carry it`,
    ).toBe(true);
    // EVERY CITATION IS REAL, asked of the file rather than of the
    // derivation that produced it.
    for (const rel of b.citedBy) {
      expect(
        readDoc(rel, ctx.root).includes(b.heading),
        `the pack says ${rel} cites ${b.heading} and that file does not contain the heading`,
      ).toBe(true);
    }
    // AND THE BULLET IS THE ONE THE HEADING OPENS, not one that merely
    // mentions it: "GRAPH REGEN" appears in five bullets of this
    // document and "DOCS GATE" in four.
    // A BOLDED opener opens the bullet too (T-254's verdict, correction 1:
    // the candidate set reaches the document's own shouted openers).
    const opens = b.raw.replace(/\s+/g, " ");
    expect(
      opens.startsWith(`- ${b.heading}`) || opens.startsWith(`- **${b.heading}`),
      `the pack's ${b.heading} entry quotes a bullet that does not open with that heading`,
    ).toBe(true);
  }

  // AND A HEADING NO SOURCE NAMES IS NOT IN THE PACK — the other
  // direction, without which "every cited bullet is present" is
  // satisfied by a pack carrying the whole document.
  const uncited = conventionHeadings(ctx.conventions).filter(
    (h) => !sources.some((s) => s.text.includes(h)),
  );
  expect(uncited.length, "every named bullet is cited, so the exclusion below proves nothing").toBeGreaterThan(0);
  for (const h of uncited) {
    expect(
      lines.some((l) => l.startsWith(`pack bullet: ${h} `)),
      `${h} is cited by no gate source and the pack carries it anyway — that is a hand list`,
    ).toBe(false);
  }

  // THE DISCRIMINATOR. One side only: the CORPUS moves, in memory, and
  // nothing in the module is touched. A set typed into the tool would
  // answer identically whatever it was handed.
  const one = bullets[0] as { heading: string };
  const synthetic = [{ rel: "tools/e2e/scripts/synthetic.mjs", text: `cites ${one.heading} and nothing else` }];
  const only = citedConventionBullets(ctx.conventions, synthetic);
  expect(
    only.map((b) => b.heading),
    "a corpus citing exactly one heading did not yield exactly that bullet, so the set is not a " +
      "reading of the corpus",
  ).toEqual([one.heading]);
  expect(
    citedConventionBullets(ctx.conventions, [{ rel: "tools/e2e/scripts/silent.mjs", text: "no heading here" }]),
    "a corpus citing nothing still produced bullets",
  ).toEqual([]);
});

test("A LONG BULLET IS CITED BY ADDRESS AND A SHORT ONE IS TRANSCRIBED BYTE-EXACT — both arms driven", () => {
  // KILLED BY: transcribing a long bullet back into the brief (the deep
  // phrase reds), by a transcription that paraphrases, by a citation
  // whose byte figure drifts, or by a needle the wrapped document does
  // not contain.
  const ctx = context({ taskId: "T-133" });
  const rendered = render(assembleBrief(ctx).recs);
  const lines = rendered.split("\n");
  const bullets = citedConventionBullets(ctx.conventions, gateSources(ctx.root));
  const flatConventions = ctx.conventions.replace(/\s+/g, " ");

  const short = bullets.filter((b) => Buffer.byteLength(b.raw.replace(/\s+/g, " ").trim(), "utf8") <= PACK_TRANSCRIPTION_LIMIT);
  const long = bullets.filter((b) => Buffer.byteLength(b.raw.replace(/\s+/g, " ").trim(), "utf8") > PACK_TRANSCRIPTION_LIMIT);
  expect(short.length, "no cited bullet is short enough to transcribe, so that arm is unmet").toBeGreaterThan(0);
  expect(long.length, "no cited bullet is long enough to cite, so that arm is unmet").toBeGreaterThan(0);

  for (const b of short) {
    const flat = b.raw.replace(/\s+/g, " ").trim();
    const line = lines.find((l) => l.startsWith(`pack bullet: ${b.heading} — TRANSCRIBED`)) ?? "";
    expect(line, `${b.heading} is short and the pack did not transcribe it`).not.toBe("");
    expect(
      line,
      `${b.heading}'s transcription is not the document's own bytes — a paraphrased rule has ` +
        "forked from the rule",
    ).toContain(flat);
  }

  for (const b of long) {
    const flat = b.raw.replace(/\s+/g, " ").trim();
    const line = lines.find((l) => l.startsWith(`pack bullet: ${b.heading} `)) ?? "";
    expect(line, `${b.heading} is missing from the pack`).not.toBe("");
    expect(line, `${b.heading} is a screen of prose and the pack transcribed it`).toContain(
      "CITED, NOT TRANSCRIBED",
    );
    expect(
      line,
      `${b.heading}'s citation states a size that is not the passage's at this ref`,
    ).toContain(`${Buffer.byteLength(flat, "utf8")} bytes flattened at this ref`);

    // THE NEEDLE IS ONE THIS REPOSITORY ANSWERS — run, not read, because
    // every governing document here is wrapped at about 70 columns.
    const printed = /READ IT: command grep -n "([^"]+)" (\S+)/.exec(line);
    expect(printed, `${b.heading}'s citation prints no command to read it with`).not.toBeNull();
    const hits = execFileSync(
      "git",
      [
        ...NO_BACKGROUND_MAINTENANCE,
        "grep",
        "-c",
        "-F",
        (printed as RegExpExecArray)[1] as string,
        "--",
        (printed as RegExpExecArray)[2] as string,
      ],
      { cwd: repoRoot, encoding: "utf8" },
    ).trim();
    expect(
      Number(hits.split(":").pop()),
      `${b.heading}'s needle is not findable in the file the citation names`,
    ).toBeGreaterThan(0);

    // AND THE PASSAGE ITSELF IS NOT IN THE BRIEF. The citation quotes the
    // opening legitimately, so the phrase asked for is DEEP inside — and
    // it is chosen for UNIQUENESS in the document rather than by offset.
    // docs/CONVENTIONS.md, SHAPE EIGHT: an assertion that SEARCHES a
    // corpus has no uniqueness floor, so ONE duplicate anywhere keeps it
    // green with its own subject deleted. Measured here rather than
    // imagined: BOOT GATE and DOCS GATE both carry *"IF … cannot run THEN
    // say so LOUDLY in the checkpoint, naming the reason"*, so the plain
    // sixty-percent slice of DOCS GATE is present in the brief through the
    // BOOT GATE transcription and this absence check reddened on a pack
    // that was behaving correctly.
    const deep = uniqueDeepPhrase(flat, flatConventions);
    expect(
      deep,
      `${b.heading} carries no phrase unique to it in the document, so no absence check over the ` +
        "brief can be evidence about this bullet",
    ).not.toBe("");
    expect(
      rendered,
      `${b.heading} was cited and its text is in the brief anyway, so the pack moved the cost ` +
        "rather than removing it",
    ).not.toContain(deep);
    // POSITIVE CONTROL for that absence: the phrase IS in the passage.
    expect(flat, `${b.heading}'s deep phrase is not in the passage either`).toContain(deep);
  }

  // THE CLASSIFIER, DRIVEN BOTH WAYS ON ONE SIDE ONLY — the LENGTH moves,
  // the module does not.
  expect(PACK_TRANSCRIPTION_LIMIT).toBeGreaterThan(0);
  const shortest = short.reduce((a, b) =>
    Buffer.byteLength(a.raw.replace(/\s+/g, " ").trim(), "utf8") <=
    Buffer.byteLength(b.raw.replace(/\s+/g, " ").trim(), "utf8")
      ? a
      : b,
  );
  expect(
    Buffer.byteLength(shortest.raw.replace(/\s+/g, " ").trim(), "utf8"),
    "the shortest transcribed bullet is above the limit, so the arms are not what they claim",
  ).toBeLessThanOrEqual(PACK_TRANSCRIPTION_LIMIT);
});

test("A PACK WITH NO BULLET SAYS SO — and NO GATE SOURCE and NO CITATION are said apart", () => {
  // KILLED BY: one sentence for both zeros, by a silent empty pack, or by
  // the assembler refusing a project that carries method/ and no hooks —
  // which is every project this method is copied into.
  const ctx = context({ taskId: "T-133" });
  const dir = realpathSync(mkdtempSync(path.join(os.tmpdir(), "t254-pack-")));
  try {
    const root = path.join(dir, "generic");
    mkdirSync(path.join(root, "tools", "e2e", "scripts"), { recursive: true });
    const g = (...args: string[]) =>
      execFileSync("git", ["-C", root, ...NO_BACKGROUND_MAINTENANCE, ...args], { encoding: "utf8" });
    execFileSync("git", [...NO_BACKGROUND_MAINTENANCE, "init", "-b", "main", "--quiet", root], {
      encoding: "utf8",
    });
    g("config", "user.email", "fixture@example.invalid");
    g("config", "user.name", "fixture");
    writeFileSync(path.join(root, "README.md"), "a project that carries no gate at all\n");
    g("add", "-A");
    g("commit", "--quiet", "-m", "Checkpoint: a generic project");

    // ARM ONE — NO GATE SOURCE. The derivation had nothing to read.
    const noneRecs = packRecs({ ...ctx, root, findings: [] });
    const none = render(noneRecs);
    expect(
      none,
      "a project with no gate source got no sentence saying the derivation had nothing to read",
    ).toContain("tracks NO gate source");
    expect(
      none,
      "the empty pack does not tell the seat what to read instead, which is the fall-back-to-the-" +
        "whole-document this card exists to stop",
    ).toContain("never fall back to the whole document");
    expect(unstampedLines(none), "the empty pack emitted a figure with no ref").toEqual([]);

    // ARM TWO — A CORPUS THAT CITES NOTHING. One side only: a gate source
    // now EXISTS and names no rule.
    writeFileSync(path.join(root, "tools", "e2e", "scripts", "quiet.mjs"), "// this gate cites no rule\n");
    g("add", "-A");
    g("commit", "--quiet", "-m", "a gate that cites nothing");
    const quiet = render(packRecs({ ...ctx, root, findings: [] }));
    expect(
      quiet,
      "a corpus that exists and cites nothing was reported as a corpus that does not exist — two " +
        "different facts under one sentence",
    ).toContain("cite NONE of the");
    expect(quiet, "the two zeros were collapsed into one sentence").not.toContain("tracks NO gate source");
    expect(quiet, "the second zero does not say what to read instead").toContain(
      "never fall back to the whole document",
    );
    expect(unstampedLines(quiet), "the empty pack emitted a figure with no ref").toEqual([]);

    // AND THE LIVE REPOSITORY IS NEITHER, or both arms above are the only
    // state this body has ever seen.
    const live = render(packRecs(ctx));
    expect(live, "the live pack reports itself empty").not.toContain("tracks NO gate source");
    expect(live, "the live pack reports itself empty").not.toContain("cite NONE of the");
  } finally {
    removeGitFixture(dir, "packFixture");
  }
});

test("THE ROLE FILES SEND THE SEAT TO THE PACK, and the pack is what stands where the document stood", () => {
  // KILLED BY: a role file that names the whole document as the seat's
  // read again, or by a pack the brief assembles and the role files never
  // mention — a mechanism nobody is told about is a mechanism nobody uses.
  for (const role of ["executor", "verifier"]) {
    const md = roleText(role);
    // FLATTENED BEFORE IT IS SEARCHED. Every method file here is wrapped
    // at about 70 columns, so a phrase search is a search for a line break
    // nobody chose (docs/CONVENTIONS.md, A MISS IS NOT A REFUTATION, cause
    // THREE) — three of the four patterns below span a wrap in the file as
    // written, and this body reddened on the document being correct.
    const step = (md.split(/\n(?=\d+[a-z]?\. )/).find((s) => s.includes("docs/CONVENTIONS.md")) ?? "")
      .replace(/\s+/g, " ");
    expect(step, `${role}.md has no numbered step naming the document`).not.toBe("");
    expect(
      step,
      `${role}.md's read step does not send the seat to the brief's pack, so the pack is a ` +
        "mechanism the seat is never told about",
    ).toMatch(/CONTEXT PACK/);
    expect(
      step,
      `${role}.md's read step does not say whose read the whole document is`,
    ).toMatch(/architect's read/i);
    expect(
      step,
      `${role}.md's read step does not say that a gate still refuses where the pack is silent — ` +
        "the safety net is the whole argument for reading less",
    ).toMatch(/safety net is the gates/);
    expect(
      step,
      `${role}.md's read step does not rule the empty pack, so a quiet pack reads as a licence to ` +
        "open the whole document again",
    ).toMatch(/never fall back to the whole document/);
  }
});

test("THE PACK'S DENOMINATOR IS THE DOCUMENT'S OWN — a gate citation the derivation cannot REACH is disclosed, never dropped", () => {
  // KILLED BY: a derivation whose candidate set is an enumeration built for
  // another purpose. `conventionHeadings` reads the standing gates and the
  // named disciplines — 25 openers of this document's 58 bullets — so a
  // bullet whose opener is BOLDED is not a candidate at all, and a gate that
  // cites one is answered with silence rather than with a pack gap. The pack
  // says "names N of its bullets" against the whole document's byte size, and
  // a seat reading that has no way to learn that a third of the document was
  // never eligible.
  const ctx = context({ taskId: "T-133" });
  const sources = gateSources(ctx.root);
  // THE TWO ENUMERATIONS, not `conventionHeadings` — at the merge the
  // candidate set was widened to the document's own bolded openers, so
  // this body's subject is exactly what the enumerations alone could not
  // reach, and the pack must now CARRY each of them. (The verifier wrote
  // it against `conventionHeadings`, where the widening leaves it no
  // subject; re-aimed at the merge, the mutant unchanged: revert the
  // widening and it reds.)
  const { gates, named } = standingGates(ctx.conventions);
  const reachable = [
    ...gates.map((g) => g.name),
    ...named,
    ...namedDisciplines(ctx.conventions, [...gates.map((g) => g.name), ...named]).map((d) => d.name),
  ];
  const rendered = render(assembleBrief(ctx).recs);

  // THE DOCUMENT'S OWN SHOUTED OPENERS, read off the document rather than off
  // the enumeration under test — otherwise this body asks the derivation to
  // grade its own homework.
  const dropped: { opener: string; citers: string[] }[] = [];
  for (const b of ctx.conventions.split(/\n(?=- )/).filter((x) => x.startsWith("- "))) {
    const flat = b.replace(/\s+/g, " ").trim().slice(2);
    const m = /^\*\*([A-Z][A-Z'`’ ,\-]{7,70})/.exec(flat);
    if (m === null) continue;
    const opener = (m[1] as string).replace(/[ ,\-]+$/, "").trim();
    if (reachable.some((h) => opener.startsWith(h) || h.startsWith(opener))) continue;
    const citers = sources.filter((s) => s.text.includes(opener)).map((s) => s.rel);
    if (citers.length === 0) continue;
    dropped.push({ opener, citers });
  }
  expect(
    dropped.length,
    "no bolded bullet of this document is cited by a gate, so this body has no subject",
  ).toBeGreaterThan(0);

  // EITHER the pack carries it, OR the pack SAYS it cannot reach it. Silence
  // is the one answer a seat cannot act on.
  for (const d of dropped) {
    expect(
      rendered.includes(`pack bullet: ${d.opener}`) || rendered.includes(d.opener),
      `${d.citers.join(", ")} cite(s) docs/CONVENTIONS.md's ${JSON.stringify(d.opener)} bullet and ` +
        "the pack neither carries it nor names it as out of reach — the seat is told the pack is " +
        "derived from the gates' own citations, and this citation was dropped in silence",
    ).toBe(true);
  }
});

test("THE PACK'S COMPONENT ENTRIES ARE THE TOUCHED SLUGS' AND NOTHING ELSE", () => {
  // KILLED BY: emitting the registry and letting the card's own entries be
  // found inside it. The method-file arm above already asserts this direction
  // (`expect(named).toBe(method.length)`); the component arm asserts only
  // containment, so a pack that named every component satisfies every existing
  // assertion — docs/CONVENTIONS.md, A NEGATIVE ASSERTION NEEDS A POSITIVE
  // CONTROL, from the side where the positive control is the count.
  const ctx = context({ taskId: "T-133" });
  const withSlug = [...ctx.cards.values()].find((c) =>
    fieldList(c.fields, "touches").some((t) => ctx.slugs.has(t)),
  );
  expect(withSlug, "no live card fences a component slug, so this body has no subject").toBeDefined();
  const slugCtx = context({ taskId: (withSlug as NonNullable<typeof withSlug>).id });
  const expected = new Set<string>();
  for (const t of fieldList((withSlug as NonNullable<typeof withSlug>).fields, "touches")) {
    for (const id of slugCtx.slugs.get(t) ?? []) {
      const comp = slugCtx.comps.find((c) => c.id === id);
      if (comp !== undefined) expected.add(comp.file);
    }
  }
  expect(expected.size, "the touched slugs reach no component, so the count below proves nothing").toBeGreaterThan(0);
  const emitted = render(assembleBrief(slugCtx).recs)
    .split("\n")
    .filter((l) => l.startsWith("pack component: "))
    .map((l) => (/^pack component: (\S+) /.exec(l) as RegExpExecArray)[1] as string);
  expect(
    [...emitted].sort(),
    "the pack's component entries are not exactly the ones this card's touched slugs reach — a " +
      "pack that names components the fence does not touch has widened the seat's read back out",
  ).toEqual([...expected].sort());
});

test("THE BRIEF DOES NOT SAY BOTH THINGS ABOUT docs/CONVENTIONS.md — ROW 3's applied set and the pack agree", () => {
  // KILLED BY: a brief that carries a pack AND still hands the seat the whole
  // document in ROW 3's APPLIED read-first set. Every row is individually
  // faithful — the adapter really does name the document, and the pack really
  // does stand in for it — and the assembled brief is still internally
  // inconsistent about the one question the pack exists to settle. That is the
  // class ROW 3 was rebuilt to close, arriving from the other side.
  const ctx = context({ taskId: "T-133" });
  const lines = render(assembleBrief(ctx).recs).split("\n");
  expect(
    lines.some((l) => l.startsWith("# THE CONTEXT PACK")),
    "this brief carries no pack, so there is nothing for ROW 3 to disagree with",
  ).toBe(true);

  const applied = lines.find((l) => l.trimStart().startsWith("READ FIRST, the role file's reading step APPLIED:")) ?? "";
  expect(applied, "ROW 3 emits no APPLIED read-first set").not.toBe("");
  expect(
    applied.includes("docs/CONVENTIONS.md"),
    "ROW 3's APPLIED read-first set hands the seat docs/CONVENTIONS.md bare while the pack below " +
      "tells it the whole document is the ARCHITECT'S read — the same brief says both, and the " +
      "seat is left to pick which row it believes",
  ).toBe(false);
});

// ── §TRIAGE CLUSTERS (T-282) ─────────────────────────────────────────
//
// The triage view groups the SUGGESTED column by the two things that
// make two cards one job. Every body below drives the derivation the
// dispatch answer renders; none of them asserts a number off the live
// board, because the board is a moving target and the properties are not.

/** A card the triage view can rule on, spelled the way `triageBoard` builds one. */
function triageFixture(
  id: string,
  status: string,
  entries: string[],
  parents: string[] = [],
): { id: string; status: string; file: string; entries: string[]; parents: string[] } {
  return {
    id,
    status,
    file: `docs/tasks/${id}-fixture.md`,
    entries,
    parents: [...new Set([classStem(id), ...parents])].sort(byCardId),
  };
}

/** One component, so the slug face of a fence is exercised and not assumed. */
const TRIAGE_COMPS = [
  {
    id: "C-08",
    file: "docs/architecture/components/C-08-fixture.md",
    slugs: ["app-board"],
    paths: ["app/src/components/board/"],
  },
];
const TRIAGE_SLUGS = slugMapFromFields(TRIAGE_COMPS);

/**
 * The fixture board. Every pair below exists to be a control for another:
 * shared ground with a shared parent, shared ground with a DIFFERENT
 * parent, a shared parent with NO shared ground, a slug fence against a
 * path fence, a card alone, and a card with no fence at all.
 */
function triageBoardFixture() {
  return [
    triageFixture("T-100-s1", "suggested", ["tools/e2e/scripts/gate-run.mjs"]),
    triageFixture("T-100-s2", "suggested", ["tools/e2e/scripts/gate-run.mjs"]),
    triageFixture("T-200-s1", "suggested", ["tools/e2e/scripts/gate-run.mjs"]),
    triageFixture("T-300-s1", "suggested", ["app-board"]),
    triageFixture("T-300-s2", "suggested", ["app/src/components/board/TaskCard.tsx"]),
    triageFixture("T-400-s1", "suggested", ["docs/NORTH_STAR.md"]),
    triageFixture("T-500-s1", "suggested", []),
    triageFixture("T-100-s9", "planned", ["tools/e2e/scripts/gate-run.mjs"]),
    triageFixture("T-400-s9", "planned", ["method/README.md"]),
    triageFixture("T-600", "building", ["tools/e2e/scripts/gate-run.mjs"]),
    triageFixture("T-700", "done", ["tools/e2e/scripts/gate-run.mjs"]),
  ];
}

test("THE FENCE CLUSTERS ARE KEYED ON GROUND EVERY MEMBER RESERVES, never on who is connected to whom", () => {
  // KILLED BY: the connected components of "shares ground with", which is
  // the obvious reading of the criterion and was this function's first
  // build. Driven against the live board at 3a69385 it returned 75 of the
  // 80 live suggestions as ONE cluster — a card fenced on `tools/` and a
  // card fenced on `app/` joined by any third card fencing both. The
  // invariant below is what that implementation cannot satisfy: under a
  // transitive join a member need not reserve the cluster's own ground.
  const clusters = triageClusters(triageBoardFixture(), TRIAGE_SLUGS, TRIAGE_COMPS);

  const gateRun = clusters.fence.find((c) => c.ground.includes("tools/e2e/scripts/gate-run.mjs"));
  expect(gateRun?.members, "the three suggestions on one script are not one cluster").toEqual([
    "T-100-s1",
    "T-100-s2",
    "T-200-s1",
  ]);
  // ...and the PLANNED and BUILDING cards holding the same path are NOT
  // members: this half of the view rules on the suggested column.
  expect(gateRun?.members).not.toContain("T-100-s9");
  expect(gateRun?.members).not.toContain("T-600");

  // THE SLUG FACE, against a path fence: a card fencing `app-board` and a
  // card fencing one file under it are one cluster, and the ground named
  // is the containing path a reader can act on.
  const board = clusters.fence.find((c) => c.members.includes("T-300-s1"));
  expect(board?.members).toEqual(["T-300-s1", "T-300-s2"]);
  // ONE CLUSTER WITH TWO NAMES, deduped by its member set rather than by
  // its key: the directory and the file under it are held by exactly the
  // same cards, so they are one row naming both and not two rows naming
  // the same pair twice.
  expect(board?.ground).toEqual([
    "app/src/components/board/",
    "app/src/components/board/TaskCard.tsx",
  ]);

  // THE INVARIANT — every member reserves every path the row names. This
  // is the sentence the row makes ("all reserve X"), asserted rather than
  // trusted, and it is what a transitive join breaks.
  const byId = new Map(triageBoardFixture().map((c) => [c.id, c]));
  for (const cluster of clusters.fence) {
    expect(cluster.members.length, "a cluster of one is not a cluster").toBeGreaterThan(1);
    for (const id of cluster.members) {
      const paths = fencePaths(byId.get(id)!, TRIAGE_SLUGS, TRIAGE_COMPS);
      for (const g of cluster.ground) {
        expect(
          sharedGround({ entries: paths }, { entries: [g] }, TRIAGE_SLUGS, TRIAGE_COMPS).length,
          `${id} does not reserve ${g}, which its own cluster row says it does`,
        ).toBeGreaterThan(0);
      }
    }
  }

  // THE TWO WAYS OF SHARING NOTHING ARE SAID APART, because their remedies
  // differ: a card alone shares no ground with any other suggestion; a
  // card with no fence declares none, and nothing can cluster it OR rule
  // a duplicate out for it.
  expect(clusters.alone).toEqual(["T-400-s1", "T-500-s1"]);
  expect(clusters.unfenced).toEqual(["T-500-s1"]);

  // THE NEGATIVE CONTROL: move one card off the shared script and the
  // cluster loses exactly that member, with nothing else changed.
  const moved = triageBoardFixture().map((c) =>
    c.id === "T-200-s1" ? { ...c, entries: ["docs/ROADMAP.md"] } : c,
  );
  const after = triageClusters(moved, TRIAGE_SLUGS, TRIAGE_COMPS);
  expect(
    after.fence.find((c) => c.ground.includes("tools/e2e/scripts/gate-run.mjs"))?.members,
  ).toEqual(["T-100-s1", "T-100-s2"]);
  expect(after.alone).toContain("T-200-s1");
});

test("A DUPLICATE CANDIDATE NEEDS BOTH SIGNALS, and either one alone is not a flag", () => {
  // KILLED BY: flagging on fence overlap alone (T-200-s1 and T-600 would
  // be flagged against T-100-s9 and every lane in tools/e2e would read as
  // a duplicate of every other), or on the class parent alone (T-400-s1
  // against T-400-s9, which share a stem and no ground at all). Both are
  // the shape that makes a flag worthless: one that fires on everything is
  // read as noise, and a triage seat stops looking.
  const clusters = triageClusters(triageBoardFixture(), TRIAGE_SLUGS, TRIAGE_COMPS);
  expect(clusters.duplicates.map((d) => `${d.id}~${d.match}`)).toEqual([
    "T-100-s1~T-100-s9",
    "T-100-s2~T-100-s9",
  ]);
  const first = clusters.duplicates[0]!;
  expect(first.status, "the flag does not say what the card it matches is doing").toBe("planned");
  expect(first.parents).toEqual(["T-100"]);
  expect(first.ground).toEqual(["tools/e2e/scripts/gate-run.mjs"]);

  // FENCE WITHOUT PARENT, AND PARENT WITHOUT FENCE — both present on the
  // fixture, and neither is flagged.
  expect(clusters.duplicates.map((d) => d.id)).not.toContain("T-200-s1");
  expect(clusters.duplicates.map((d) => d.id)).not.toContain("T-400-s1");
  // A `done` card holding the same ground is not a claim on it either.
  expect(clusters.duplicates.map((d) => d.match)).not.toContain("T-700");

  // THE POSITIVE CONTROL FOR THE KIN PATH: give T-200-s1 the class parent
  // its id does not carry, change nothing else, and the same pair the
  // fence already matched becomes a flag. Without this, "not flagged"
  // above is satisfied by a matcher that flags nothing.
  const kin = triageBoardFixture().map((c) =>
    c.id === "T-200-s1" ? { ...c, parents: ["T-100", "T-200"] } : c,
  );
  const after = triageClusters(kin, TRIAGE_SLUGS, TRIAGE_COMPS);
  expect(after.duplicates.map((d) => `${d.id}~${d.match}`)).toContain("T-200-s1~T-100-s9");
});

test("THE CLASS PARENT IS READ OFF THE CARD'S OWN LINES, in every spelling this board uses", () => {
  // KILLED BY: reading only the id's stem. The three-times-filed defect of
  // 2026-09-09 (T-216-s6, T-256, T-238-s5) has three different stems, and
  // the corroboration rule's own remedy — append to the class parent —
  // leaves its evidence on these lines and nowhere else.
  expect(classStem("T-205-s16")).toBe("T-205");
  expect(classStem("T-205")).toBe("T-205");

  // The inline form, the bolded form, the parenthesised form, and the
  // HEADING form — all four are live on this board today.
  expect(classKin("Absorbs: T-137-s8 (the second half of this card's claim)")).toEqual(["T-137-s8"]);
  expect(classKin("Absorbs (eighth triage, 2026-08-25): T-015-s1, T-015-s2")).toEqual([
    "T-015-s1",
    "T-015-s2",
  ]);
  expect(classKin("**Class parent: `T-018-s6`** (the startup pull could overtake an emit)")).toEqual(
    ["T-018-s6"],
  );
  expect(classKin("## Class parent\n\n`T-203` — the verdict token; `T-202` owns the field set.")).toEqual(
    ["T-202", "T-203"],
  );

  // THE NEGATIVE CONTROLS, and both are spelled on live cards: a card that
  // searched and found no parent says so in the same words, and a card id
  // in ordinary prose is not a kinship claim.
  expect(classKin("**Class parent: none found.** Searched the live board.")).toEqual([]);
  expect(classKin("This is the same defect T-216-s6 records, in another file.")).toEqual([]);
  expect(classKin("Absorbed into T-167-s8 at the fifth triage.")).toEqual([]);

  // AND THE BOARD BUILDER JOINS THE TWO: the id's own stem plus every kin
  // line, deduped, on the card the index actually holds.
  const cards = new Map([
    [
      "T-900-s1",
      {
        id: "T-900-s1",
        file: "docs/tasks/T-900-s1-fixture.md",
        title: "a fixture card",
        fields: { id: "T-900-s1", status: "suggested", touches: ["tools/e2e"] } as Record<
          string,
          string | string[]
        >,
      },
    ],
  ]);
  const built = triageBoard({
    cards,
    readText: () => "**Class parent: `T-100-s4`.** THE CLASS: one defect, two files.",
  });
  expect(built).toEqual([
    {
      id: "T-900-s1",
      status: "suggested",
      file: "docs/tasks/T-900-s1-fixture.md",
      entries: ["tools/e2e"],
      parents: ["T-100", "T-900"],
    },
  ]);
});

test("THE STATUSES THIS VIEW RULES ON ARE THE PARSER'S OWN WORDS, never a list retyped here", () => {
  // KILLED BY: a status this file spells that the parser does not — the
  // view would then rule on an empty column for ever and read as "nothing
  // to triage". The vocabulary has one home (lib/parser), the same licence
  // docs-scan.mjs takes for it.
  const vocabulary = taskStatuses(repoRoot);
  for (const status of TRIAGE_STATUSES) {
    expect(vocabulary, `${status} is not a status this project's parser knows`).toContain(status);
  }
  expect(TRIAGE_STATUSES).toContain("suggested");
});

test("THE DEFAULT VIEW IS ONE COUNTED LINE AND `--full` IS THE PAGE, and every line carries its stamp", () => {
  // KILLED BY: rendering the whole page at every verbosity — which is the
  // regression T-225 already paid for once, on this same command, where
  // the answer's own size turned out to be the triage queue's capacity.
  // The clusters are ONE line per member set for the same reason.
  const board = triageBoardFixture();
  const at = "2026-09-09T00:00:00.000Z";
  const brief = { root: repoRoot, ref: "abc1234", at, host: "fixture", full: false };
  const short = render(triageClusterRecs(brief, { board }));
  expect(short).toContain("add --full");
  expect(short).toContain("7 live suggestion(s)");
  expect(short).not.toContain("T-100-s1");

  const full = render(triageClusterRecs({ ...brief, full: true }, { board }));
  expect(full).toContain("BY FENCE");
  expect(full).toContain("BY CLASS PARENT");
  expect(full).toContain("DUPLICATE CANDIDATES");
  expect(full).toContain("T-100-s1, T-100-s2, T-200-s1 — all reserve tools/e2e/scripts/gate-run.mjs");
  expect(full).toContain("T-100: T-100-s1, T-100-s2");
  expect(full).toContain("T-100-s1 ~ T-100-s9 (planned)");
  // A parent with one live suggestion is not a cluster and is not a row.
  expect(full).not.toMatch(/^T-400: /m);

  // THE VIEW SAYS IT IS A VIEW. The criterion's own words — a flag for the
  // human, never a closure — are on the page a triage seat reads, not only
  // in a comment nobody opens.
  expect(full).toContain("CHANGES NO CARD");
  expect(full).toContain("NEVER A CLOSURE");

  // THE PROVENANCE FLOOR, on both arms: every rendered line that is not a
  // note ends in the stamp that says which tree it was read at.
  expect(unstampedLines(short)).toEqual([]);
  expect(unstampedLines(full)).toEqual([]);
  expect(full).toContain("<- @ abc1234 ;");
});

test("THE VIEW IS A READ — it derives the live board and writes nothing into it", () => {
  // KILLED BY: any write. This section's whole claim is that it changes no
  // card, and a `DUPLICATE CANDIDATE` that closed one would be the worst
  // available failure: a disposition nobody decided, wearing a report's
  // clothes. The same guard health-bands.spec.ts keeps over docs/tasks/.
  const before = spawnSync("git", ["status", "--porcelain", "docs/tasks/"], {
    cwd: repoRoot,
    encoding: "utf8",
  }).stdout;
  const ctx = context({ full: true });
  const recs = triageClusterRecs(ctx);
  const after = spawnSync("git", ["status", "--porcelain", "docs/tasks/"], {
    cwd: repoRoot,
    encoding: "utf8",
  }).stdout;
  expect(after).toBe(before);

  // AND THE LIVE ANSWER IS INTERNALLY CONSISTENT, asserted as a shape
  // rather than as a tally: every id it names is a live suggestion, and
  // every live suggestion is either in a cluster or counted as alone.
  const board = triageBoard({ cards: ctx.cards, readText: (file) => readDoc(file, ctx.root) });
  const suggestions = board.filter((c) => c.status === "suggested").map((c) => c.id);
  const clusters = triageClusters(board, ctx.slugs, ctx.comps);
  const named = new Set([...clusters.fence.flatMap((c) => c.members), ...clusters.alone]);
  expect([...named].sort(byCardId)).toEqual([...suggestions].sort(byCardId));
  for (const d of clusters.duplicates) {
    expect(suggestions, `${d.id} is flagged and is not a live suggestion`).toContain(d.id);
    expect(suggestions, `${d.match} is a suggestion, so this is not a claim on a live card`).not.toContain(
      d.match,
    );
  }
  expect(unstampedLines(render(recs))).toEqual([]);
});

test("THE TRIAGE CLUSTERS REACH THE RENDERED ANSWER — `--dispatch --full` carries the section, and the default view does not", () => {
  // T-282 criterion 1 names the RENDER SITE: "WHEN `brief.mjs --dispatch
  // --full` renders its triage section". The lane built the derivation
  // (`triageClusterRecs`) and six bodies over it inside its fence, and
  // the one-line call that puts the section into the answer lived in
  // `brief.mjs`, outside that fence (T-282-s1). This body is the one the
  // wiring owes: the section's own headings, as `triageClusterRecs` spells
  // them, must be IN the bytes the command writes — and only under
  // `--full`, because the default view is the STARTABLE answer and the
  // clusters are the triage view's. Measured through a file, never a
  // pipe, so the assertion is over the whole answer (T-225-s1).
  const dir = mkdtempSync(path.join(os.tmpdir(), "t282s1-wiring-"));
  try {
    const answer = (argv: string[]): string => {
      const out = path.join(dir, `${argv.length}.txt`);
      const fd = openSync(out, "w");
      let status: number | null;
      try {
        status = spawnSync(process.execPath, argv, { cwd: repoRoot, stdio: ["ignore", fd, "ignore"] }).status;
      } finally {
        closeSync(fd);
      }
      expect(status, `${argv.join(" ")} did not answer cleanly`).toBe(EXIT.CLEAN);
      return readFileSync(out, "utf8");
    };
    const full = answer([CLI, "--dispatch", "--full"]);
    for (const heading of ["THE TRIAGE CLUSTERS", "BY FENCE", "BY CLASS PARENT", "CHANGES NO CARD"]) {
      expect(full, `the full view carries the section's own line ${JSON.stringify(heading)}`).toContain(heading);
    }
    // THE POSITIVE CONTROL: the default view is a different answer, so a
    // body that passed because the heading was somewhere in every
    // dispatch answer would be caught here.
    const plain = answer([CLI, "--dispatch"]);
    expect(plain, "the default view is the startable answer and carries no clusters").not.toContain("THE TRIAGE CLUSTERS");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

/**
 * T-283's VERDICT CORRECTIONS (verifier, phase 2, bench /Users/ujju/Projects/supertaskr-V-T-283).
 *
 * The in-fence follow-through rule lands wholly in method PROSE, and the
 * method eval gate is blind to its substance — nine one-side data mutants
 * on the rule leave `node tools/method-evals/run.mjs` at exit 0, measured
 * both by the lane and again here (only MF-04's PATH check reds, and only
 * on a citation's path, never on its ordinal). These four bodies are the
 * kill set the verdict assigns: each one is RED against the text as it
 * landed at afd454b and GREEN against the corrected text the verdict
 * prescribes. They are FLATTENED before they are searched, because every
 * method file here wraps at about 70 columns and a phrase search is
 * otherwise a search for a line break nobody chose.
 */
const flat = (s: string) => s.replace(/\s+/g, " ");
/** The text between two anchors of a role file, flattened. */
function methodSpan(rel: string, from: string, to: string | null) {
  const md = readFileSync(path.join(repoRoot, rel), "utf8");
  const a = md.indexOf(from);
  expect(a, `${rel} no longer carries the anchor ${JSON.stringify(from)}`).toBeGreaterThan(-1);
  const b = to === null ? md.length : md.indexOf(to, a);
  expect(b, `${rel} no longer carries the closing anchor ${JSON.stringify(to)}`).toBeGreaterThan(-1);
  return flat(md.slice(a, b));
}
const FOLLOW_THROUGH = "AND THAT RULE ROUTES OUT WHAT THE FENCE FORBIDS";

test("T-283 C1 — the follow-through SIZE limit states what is counted and what to do at the boundary", () => {
  // KILLED BY: `fewer than about twenty lines` standing alone. "About" with
  // no unit and no tie-break is unbounded upward under pressure: one change
  // of +5/-3 is a 5, an 8 or a 2 depending on which reading a tired seat
  // takes, and three follow-throughs of 15 lines are 15 or 45 depending on
  // whether the limit is per follow-through or per lane. A limit nobody can
  // count is a limit in name only.
  const step5 = methodSpan("method/roles/executor.md", FOLLOW_THROUGH, "6. Commit with the task id");
  expect(step5, "executor.md's follow-through rule states no size limit at all").toMatch(/twenty lines/);
  expect(
    step5,
    "the size limit names no COUNTING UNIT — added, removed, or added plus removed is left to the " +
      "reader, and one change yields three defensible numbers",
  ).toMatch(/added (?:plus|and) removed/i);
  expect(
    step5,
    "the size limit does not say whether it is counted PER FOLLOW-THROUGH or per lane, so three " +
      "small ones and one large one are indistinguishable under it",
  ).toMatch(/per follow-through/i);
  expect(
    step5,
    "the size limit carries no TIE-BREAK, so `about twenty` decides nothing at 20, 25 or 30 and " +
      "the executor certifying its own work is the only reader",
  ).toMatch(/(?:in doubt|arguable|cannot tell)[^.]*file the card/i);
});

test("T-283 C2 — `inside the fence` is determined by the dispatch-time MANIFEST, in both files that say it", () => {
  // KILLED BY: executor.md's `your armed fence` — a term that appears
  // nowhere else in method/, whose only neighbouring vocabulary (`armed`,
  // `re-armed`) names the PHYSICAL LAYER and not the fence — beside
  // lane-protocol.md's `the lane's own touches:`, which rule 5 itself
  // forbids a lane to compute for itself four paragraphs later: *"the
  // expansion happens at dispatch and not at the write because a lane that
  // computes its own fence can compute a wider one"*. Two files, two
  // determiners, neither naming the manifest that actually decides.
  const step5 = methodSpan("method/roles/executor.md", FOLLOW_THROUGH, "6. Commit with the task id");
  const rule5 = methodSpan(
    "method/lane-protocol.md",
    "AND THE CONVERSE IS THE OTHER HALF OF THE SAME RULE",
    "**A FENCE NAMES PATHS.",
  );
  expect(
    step5,
    "executor.md decides `inside the fence` by a term it never defines — the fence the follow-through " +
      "must lie inside is the MANIFEST written at dispatch, and the file must say so",
  ).toMatch(/manifest/i);
  expect(
    rule5,
    "lane-protocol.md's converse clause decides `inside the fence` without naming the manifest, " +
      "which invites the lane to read its own `touches:` — the one computation rule 5 forbids it",
  ).toMatch(/manifest/i);
});

test("T-283 C3 — a LISTED follow-through is checked against the limits, never waved through for being listed", () => {
  // KILLED BY: a verifier text whose only stated duty about the list is
  // that an UNLISTED change is a finding. Then the heading launders: an
  // out-of-fence or oversized remedy acquires legitimacy by appearing
  // under it, and the two limits no machinery enforces — the size and the
  // no-new-criterion clause — have no reader at all.
  const step6 = methodSpan(
    "method/roles/verifier.md",
    "AND THE EXECUTOR'S OWN VERSION OF THAT RULE NOW STOPS AT ITS FENCE",
    "7. **Re-run whatever gate",
  );
  expect(step6, "verifier.md does not make an undeclared change a finding").toMatch(/DOES NOT NAME IS A FINDING/);
  expect(
    step6,
    "verifier.md tells the seat to flag what the list omits and never to CHECK what it contains, so " +
      "the heading is a licence rather than a declaration — an entry outside the fence, adding a " +
      "criterion, or over the size must be a finding exactly as an unlisted change is",
  ).toMatch(/never a licence|checked against the (?:three )?limits/i);
});

test("T-283 C4 — the file carrying the BASE-REF ruling names the follow-through carve-out that amends it", () => {
  // KILLED BY: executor.md's brief rules still saying the verifier reads
  // "the card without this role's notes", which T-283 makes false in the
  // same diff — verifier.md step 6 now reads the `In-fence follow-through`
  // list from those notes, at the TIP. The ruling paragraph is inside this
  // lane's own fence and was left standing. Two descriptions of one rule
  // are two rules the day one of them is corrected, which is this method's
  // own stated failure mode, committed in the paragraph that states it.
  const ruling = methodSpan(
    "method/roles/executor.md",
    "THE VERIFIER READS THE CARD THIS ROLE WRITES INTO",
    null,
  );
  expect(ruling, "executor.md no longer carries the base-ref ruling this body grades").toMatch(
    /the card without this role's notes/,
  );
  expect(
    ruling,
    "the base-ref ruling still reads as complete while verifier.md step 6 now reads part of these " +
      "notes AT THE TIP — the ruling must name the `In-fence follow-through` carve-out and the ref " +
      "it is read at, or the two files contradict each other on their face",
  ).toMatch(/In-fence follow-through/);
});

// ── §THE WAKE CONDITION (T-285) ──────────────────────────────────────
//
// A park is a CONDITION, not a shelf — `method/roles/orchestrator.md`
// has said so since it was written, and nothing read the condition, so
// a hundred and twenty-nine parked cards sat unread until a human went
// through the folder by hand. Every body below drives the derivation
// over a FIXTURE board and asserts a PROPERTY, never a tally off the
// live board: the count moves with every triage and the rules do not.
//
// AND EVERY BODY CARRIES ITS OWN NEGATIVE BOARD. The criterion asks
// that each be "seen red on a board that lacks the arrangement", so the
// arrangement and its absence are two fixtures inside one body: the
// named card done and not done, the clock on both sides of the date,
// the lane overlapping and not. A body with only the positive arm
// passes against a derivation that answers WOKEN to everything.

/** One fixture card, spelled the way `cardIndex` hands one over. */
type WakeFixture = {
  id: string;
  status: string;
  wake?: string | string[];
  touches?: string[];
  title?: string;
  body?: string;
};

/**
 * A fixture board and its bodies. The frontmatter is REAL text so that
 * `parkedBoard` runs the same `cardBody` split the live board takes —
 * which is what makes the "a wake word in the frontmatter is not a prose
 * condition" arm below a measurement rather than an assertion about a
 * function nobody called.
 */
function wakeBoard(fixtures: WakeFixture[]): {
  cards: Map<string, { id: string; file: string; title: string; fields: Record<string, string | string[]> }>;
  readText: (file: string) => string;
} {
  const cards = new Map<
    string,
    { id: string; file: string; title: string; fields: Record<string, string | string[]> }
  >();
  const bodies = new Map<string, string>();
  for (const f of fixtures) {
    const file = `docs/tasks/${f.id}-fixture.md`;
    const fields: Record<string, string | string[]> = { id: f.id, status: f.status };
    if (f.title !== undefined) fields["title"] = f.title;
    if (f.wake !== undefined) fields["wake"] = f.wake;
    if (f.touches !== undefined) fields["touches"] = f.touches;
    cards.set(f.id, { id: f.id, file, title: f.title ?? `${f.id} fixture`, fields });
    const frontmatter = [`id: ${f.id}`, `status: ${f.status}`, ...(f.title === undefined ? [] : [`title: ${f.title}`])];
    bodies.set(file, `---\n${frontmatter.join("\n")}\n---\n\n${f.body ?? "Parked. Nothing else written down."}\n`);
  }
  return { cards, readText: (file) => bodies.get(file) ?? "" };
}

/** One component, so the SLUG face of a fence is exercised and not assumed. */
const WAKE_COMPS = [
  {
    id: "C-08",
    file: "docs/architecture/components/C-08-fixture.md",
    slugs: ["app-board"],
    paths: ["app/src/components/board/"],
  },
];
const WAKE_SLUGS = slugMapFromFields(WAKE_COMPS);

/** The rendered `--full` section over a fixture world. */
function wakeAnswer(
  fixtures: WakeFixture[],
  lanes: { taskId: string }[],
  at = "2026-09-09T00:00:00.000Z",
): string {
  const { cards, readText } = wakeBoard(fixtures);
  return render(
    wakeRecs(
      { root: repoRoot, ref: "abc1234", at, host: "fixture", full: true },
      { cards, readText, lanes, slugs: WAKE_SLUGS, comps: WAKE_COMPS },
    ),
  );
}

/** One card's ruling over a fixture world — the derivation under the render. */
function wakeRulingOf(
  id: string,
  fixtures: WakeFixture[],
  lanes: { taskId: string }[],
  today = "2026-09-09",
): { state: string; why: string; record: string } {
  const { cards, readText } = wakeBoard(fixtures);
  const board = parkedBoard({ cards, readText });
  const card = board.find((c) => c.id === id);
  if (card === undefined) throw new Error(`${id} is not a parked card on this fixture board`);
  const ruled = ruleWake(card, {
    cards,
    lanes,
    slugs: WAKE_SLUGS,
    comps: WAKE_COMPS,
    today,
  });
  return { state: ruled.state, why: ruled.why, record: ruled.record };
}

test("A `wake:` NAMING A CARD HOLDS ONCE THAT CARD IS DONE, and the same board with it unfinished wakes nothing", () => {
  // KILLED BY: a reader that treats the presence of the field as the
  // condition — which is the whole failure mode of a machine-read park,
  // because a card that wakes on every run is a card nobody reads twice.
  const board = (namedStatus: string): WakeFixture[] => [
    { id: "T-500", status: "parked", wake: "T-700", touches: ["docs/NORTH_STAR.md"] },
    { id: "T-700", status: namedStatus, touches: ["docs/NORTH_STAR.md"] },
  ];

  const woken = wakeRulingOf("T-500", board("done"), []);
  expect(woken.state, "the named card is done, so the condition holds").toBe("held");
  expect(woken.record).toContain("T-700 is done");

  // THE BOARD THAT LACKS THE ARRANGEMENT. Same card, same field, same
  // clock — only the named card's status moves, and the answer must move
  // with it.
  const still = wakeRulingOf("T-500", board("building"), []);
  expect(still.state, "the named card is not done, so the condition does not hold").toBe("waiting");
  expect(still.record).toContain("T-700 is building");

  // AND A CARD NOBODY CAN FIND IS NOT A CONDITION THAT FAILED. `unknown`
  // is `fenceLedger`'s own vocabulary — no wake proved and none ruled
  // out — and folding it into `waiting` is how a card stays parked
  // because a file could not be opened.
  const blind = wakeRulingOf("T-500", [board("done")[0] as WakeFixture], []);
  expect(blind.state).toBe("unknown");
  expect(blind.why).toBe("no-such-card");

  // THE RENDERED ANSWER CARRIES BOTH, in the section a triage seat reads.
  expect(wakeAnswer(board("done"), [])).toContain("T-500 — wake: T-700 — HELD: T-700 is done");
  expect(wakeAnswer(board("building"), [])).not.toContain("T-500 — wake: T-700 — HELD");
});

test("A `wake:` NAMING A DATE HOLDS ON BOTH SIDES OF THE CLOCK, and the clock is the only thing that moves", () => {
  // KILLED BY: comparing anything but the day — a lexical `>=` over two
  // `YYYY-MM-DD` strings IS the numeric ordering for that shape, and the
  // boundary is the arm that catches a `>` written for a `>=`.
  const board: WakeFixture[] = [
    { id: "T-501", status: "parked", wake: "2026-09-09", touches: ["docs/NORTH_STAR.md"] },
  ];

  expect(wakeRulingOf("T-501", board, [], "2026-09-10").state, "the clock is past the day").toBe("held");
  expect(wakeRulingOf("T-501", board, [], "2026-09-09").state, "the day names its own start").toBe("held");
  // THE BOARD THAT LACKS THE ARRANGEMENT: one day earlier, nothing else.
  expect(wakeRulingOf("T-501", board, [], "2026-09-08").state, "the clock has not reached the day").toBe(
    "waiting",
  );

  // A DATE-SHAPED VALUE THAT NAMES NO DAY IS REPORTED, NEVER WAITED ON:
  // a condition the clock can never reach reads as a park with a plan.
  const impossible = wakeRulingOf(
    "T-501",
    [{ ...(board[0] as WakeFixture), wake: "2026-02-30" }],
    [],
    "2027-01-01",
  );
  expect(impossible.state).toBe("unknown");
  expect(impossible.why).toBe("unreadable");

  // AND THE CLOCK IS A LIVE FACT, so the row carries a time and a host
  // and never a commit (this module's contract rule 3). The card form
  // above is a read of the BOARD and carries the ref instead.
  const rendered = wakeAnswer(board, [], "2026-09-10T00:00:00.000Z");
  const row = rendered.split("\n").find((l) => l.startsWith("T-501 —")) ?? "";
  expect(row, "a clock reading is stamped live").toContain("<- read 2026-09-10T00:00:00.000Z on fixture ;");
  expect(row).not.toContain("<- @ abc1234");
});

test("THE DEFAULT CONDITION IS THE FENCE, and it holds exactly where a live lane's expanded fence overlaps", () => {
  // KILLED BY: a second spelling of the fence rule. This asks
  // `fenceOverlaps` — the same pair the dispatch order and the triage
  // clusters spend — so the SLUG face works without being taught: the
  // parked card fences a slug, the lane fences a path inside the
  // component that slug expands to, and they overlap.
  const parked: WakeFixture = { id: "T-502", status: "parked", touches: ["app-board"] };
  const overlapping: WakeFixture = {
    id: "T-800",
    status: "building",
    touches: ["app/src/components/board/TaskCard.tsx"],
  };
  const elsewhere: WakeFixture = { id: "T-801", status: "building", touches: ["docs/NORTH_STAR.md"] };

  const held = wakeRulingOf("T-502", [parked, overlapping], [{ taskId: "T-800" }]);
  expect(held.state, "a lane was dispatched on ground this card reserves").toBe("held");
  expect(held.record).toContain("lane T-800 was dispatched on overlapping ground");
  expect(held.record, "the shared tokens come out of the overlap's own answer").toContain(
    "app-board against app/src/components/board/TaskCard.tsx",
  );

  // THE BOARD THAT LACKS THE ARRANGEMENT, twice: a lane somewhere else,
  // and no lane at all.
  expect(wakeRulingOf("T-502", [parked, elsewhere], [{ taskId: "T-801" }]).state).toBe("waiting");
  expect(wakeRulingOf("T-502", [parked], []).record).toBe("no lane is live");

  // AN ABSENT FIELD AND THE WORD ITSELF ARE ONE CONDITION — the default
  // orchestrator.md names, spelled as a value.
  const spelled = wakeRulingOf(
    "T-502",
    [{ ...parked, wake: "fence" }, overlapping],
    [{ taskId: "T-800" }],
  );
  expect(spelled.state).toBe("held");
  expect(spelled.record).toBe(held.record);

  // A LANE WHOSE CARD THIS CHECKOUT CANNOT READ HOLDS AN UNKNOWN FENCE,
  // NEVER AN EMPTY ONE (T-143 criteria 1 and 2, the sentence
  // `fenceLedger` above carries): with the lane's card off the board the
  // answer is `unknown` NAMING the lane, and never `waiting`.
  const blind = wakeRulingOf("T-502", [parked], [{ taskId: "T-800" }]);
  expect(blind.state).toBe("unknown");
  expect(blind.why).toBe("blind-lane");
  expect(blind.record).toContain("T-800");

  // AND A CARD WITH NO FENCE GIVES THE DEFAULT NO GROUND, which is its
  // own class: the sentence is identical on every member, so the view
  // COUNTS it rather than printing it once per card.
  const groundless = wakeRulingOf("T-502", [{ ...parked, touches: [] }, overlapping], [{ taskId: "T-800" }]);
  expect(groundless.state).toBe("unknown");
  expect(groundless.why).toBe(NO_GROUND);

  const rendered = wakeAnswer([parked, overlapping], [{ taskId: "T-800" }]);
  expect(rendered).toContain("T-502 — wake: fence (the default, no field) — HELD: lane T-800");
  expect(rendered, "a lane list is a LIVE read and is stamped with a time and a host").toContain(
    "<- read 2026-09-09T00:00:00.000Z on fixture ;",
  );
});

test("THE THREE FORMS ARE READ OFF THE FIELD, and a value none of them place is REPORTED rather than defaulted", () => {
  // KILLED BY: a reader that falls back to the default on anything it
  // cannot parse. The default is what the ABSENCE of the field means; an
  // author who typed the key was reaching for something else, and
  // answering `fence` hides a half-written card behind a correct-looking
  // answer.
  expect(readWake({ id: "T-1" })).toEqual({ form: WAKE_FENCE, raw: "", declared: false, why: "" });
  expect(readWake({ wake: "fence" })).toEqual({ form: WAKE_FENCE, raw: "fence", declared: true, why: "" });
  expect(readWake({ wake: "T-14" }).form).toBe("card");
  expect(readWake({ wake: "T-14" }).raw, "an id is normalised through the ONE normaliser").toBe("T-014");
  expect(readWake({ wake: "T-205-s16" }).raw, "the suffix is part of the id, never a slug").toBe("T-205-s16");
  expect(readWake({ wake: '"T-014"' }).form, "a quoted scalar is the same scalar").toBe("card");
  expect(readWake({ wake: "2026-11-01" })).toEqual({
    form: "date",
    raw: "2026-11-01",
    declared: true,
    why: "",
  });

  for (const [value, hint] of [
    ["soonish", "none of the three forms"],
    ["", "field nobody finished"],
    ["2026-02-30", "no day on the calendar"],
  ] as [string, string][]) {
    const read = readWake({ wake: value });
    expect(read.form, `${JSON.stringify(value)} is not a condition this view can place`).toBe("unreadable");
    expect(read.declared, "and it was still DECLARED — the report says so").toBe(true);
    expect(read.why).toContain(hint);
  }
  const listed = readWake({ wake: ["T-014", "T-015"] });
  expect(listed.form, "a wake condition is ONE event").toBe("unreadable");
  expect(listed.why).toContain("list");

  // THE STATUS WORDS ARE THE PARSER'S OWN, never a list retyped here —
  // the licence `TRIAGE_STATUSES` takes above, for the same reason.
  const vocabulary = taskStatuses(repoRoot);
  expect(vocabulary, "the column this view rules on is a status the parser knows").toContain(PARKED_STATUS);
  expect(vocabulary, "the status a named card must reach is one the parser knows").toContain(WOKEN_BY_STATUS);
});

test("PARKED WITHOUT A CONDITION COUNTS AND NAMES THE CARDS, and the prose test is the one TASK-FORMAT states", () => {
  // KILLED BY: a prose test that reads the frontmatter, or one loose
  // enough to see a condition in the word every parking note already
  // spells about itself. The failure that matters is the CONFIDENT one —
  // a card whose author wrote a condition, reported as having written
  // none — so both boundaries are driven here.
  const board: WakeFixture[] = [
    { id: "T-510", status: "parked", body: "Parked at the ninth triage. Unpark with the second adapter." },
    { id: "T-511", status: "parked", body: "Parked at the ninth triage. Too early to build." },
    { id: "T-512", status: "parked", wake: "2026-12-01", body: "Parked at the ninth triage." },
    { id: "T-513", status: "parked", title: "the wake field on parked cards", body: "Parked. Nothing here." },
    { id: "T-514", status: "parked", body: "Parked while the runner is awake and the disk is full." },
    { id: "T-515", status: "planned", body: "Not parked, so not this view's business at all." },
  ];
  const answer = wakeAnswer(board, []);
  const line = answer.split("\n").find((l) => l.includes("state no condition at all")) ?? "";

  expect(line, "the count is the criterion's own word, and the ids are beside it").toContain(
    "3 parked card(s) state no condition at all",
  );
  expect(line, "no field and no prose").toContain("T-511");
  expect(line, "a wake word in the FRONTMATTER is not a prose condition — the test reads the BODY").toContain(
    "T-513",
  );
  expect(line, "`awake` is not `wake`: the test is bounded on the left").toContain("T-514");
  expect(line, "a prose condition is a condition, and this view rewrites no card to prove it").not.toContain(
    "T-510",
  );
  expect(line, "a card carrying the field states a condition").not.toContain("T-512");
  expect(line, "a card that is not parked is not in this view").not.toContain("T-515");

  // THE FLAG SAYS WHAT IT IS. The criterion's own words are on the page a
  // triage seat reads, not only in a comment nobody opens.
  expect(answer).toContain("PARKED WITHOUT A CONDITION");
  expect(answer).toContain("NEVER A CLOSURE");
  expect(answer).toContain("CHANGES NO CARD");

  // AND THE METHOD TEXT STATES THE SAME TEST, so an author and this
  // reader are looking at one sentence rather than two that drift.
  const taskFormat = readDoc("method/tasks/TASK-FORMAT.md");
  expect(taskFormat, "the encoding is stated in the method text").toContain("wake: fence");
  expect(taskFormat, "the prose test is stated, not left to be guessed").toContain(
    "carrying the word `unpark` or the word `wake`",
  );
  expect(taskFormat, "and existing cards are not rewritten for it").toContain(
    "EXISTING PARKED CARDS ARE NOT REWRITTEN",
  );
  expect(PROSE_WAKE_PATTERN.test("Unpark with the second adapter.")).toBe(true);
  expect(PROSE_WAKE_PATTERN.test("Parked at the ninth triage.")).toBe(false);
  expect(PROSE_WAKE_PATTERN.test("the runner is awake")).toBe(false);
});

test("THE WAKE VIEW'S DEFAULT IS ONE COUNTED LINE AND `--full` IS THE PAGE, and every line carries its stamp", () => {
  // KILLED BY: rendering the whole page at every verbosity — the
  // regression T-225 already paid for once on this same command, where
  // the answer's own size turned out to be the triage queue's capacity.
  const board: WakeFixture[] = [
    { id: "T-520", status: "parked", wake: "T-700", touches: ["docs/NORTH_STAR.md"] },
    { id: "T-521", status: "parked", wake: "2030-01-01", touches: ["docs/NORTH_STAR.md"] },
    { id: "T-700", status: "done", touches: ["docs/NORTH_STAR.md"] },
  ];
  const { cards, readText } = wakeBoard(board);
  const ctx = { root: repoRoot, ref: "abc1234", at: "2026-09-09T00:00:00.000Z", host: "fixture" };
  const deps = { cards, readText, lanes: [], slugs: WAKE_SLUGS, comps: WAKE_COMPS };

  const short = render(wakeRecs({ ...ctx, full: false }, deps));
  expect(short).toContain("1 of 2 parked card(s) have woken");
  expect(short).toContain("add --full");
  expect(short, "the counted line is the whole of the default view").not.toContain("T-520 —");

  const full = render(wakeRecs({ ...ctx, full: true }, deps));
  for (const heading of ["WOKEN", "STILL PARKED", "PARKED WITHOUT A CONDITION"]) {
    expect(full, `the full view carries ${heading}`).toContain(heading);
  }
  expect(full).toContain("T-520 — wake: T-700 — HELD:");
  expect(full).toContain("1 parked card(s) carry a condition that does not hold");

  // THE PROVENANCE FLOOR, on both arms: every rendered line that is not a
  // note ends in the stamp saying which tree, or which clock, it was read
  // at. And the floor is only worth its line if the detector can see —
  // strip the stamps and it must name every line it took one from.
  expect(unstampedLines(short)).toEqual([]);
  expect(unstampedLines(full)).toEqual([]);
  const stamped = full.split("\n").filter((l) => l.includes("  <- ")).length;
  expect(stamped).toBeGreaterThan(3);
  expect(unstampedLines(full.split("\n").map((l) => l.replace(/ {2}<- .*$/, "")).join("\n")).length).toBe(
    stamped,
  );
});

test("THE WAKE VIEW IS A READ — it derives the live board and writes nothing into it", () => {
  // KILLED BY: any write. The criterion's claim is that waking is the
  // SEAT'S act, and a view that promoted a card would be the worst
  // available failure: a disposition nobody decided, wearing a report's
  // clothes. The same guard the triage clusters keep over docs/tasks/.
  const before = spawnSync("git", ["status", "--porcelain", "docs/tasks/"], {
    cwd: repoRoot,
    encoding: "utf8",
  }).stdout;
  const ctx = context({ full: true });
  const recs = wakeRecs(ctx);
  const after = spawnSync("git", ["status", "--porcelain", "docs/tasks/"], {
    cwd: repoRoot,
    encoding: "utf8",
  }).stdout;
  expect(after).toBe(before);

  // AND THE LIVE ANSWER IS INTERNALLY CONSISTENT, asserted as a shape
  // rather than as a tally: every card it rules on is a live PARKED card,
  // every one lands in exactly one state, and the flagged set is a subset
  // of the parked set.
  const board = parkedBoard({ cards: ctx.cards, readText: (file) => readDoc(file, ctx.root) });
  const parked = [...ctx.cards.values()]
    .filter((c) => fieldScalar(c.fields, "status") === PARKED_STATUS)
    .map((c) => c.id);
  expect(board.map((c) => c.id).sort(byCardId)).toEqual([...parked].sort(byCardId));
  const today = ctx.at.slice(0, 10);
  for (const card of board) {
    const ruled = ruleWake(card, {
      cards: ctx.cards,
      lanes: ctx.lanes,
      slugs: ctx.slugs,
      comps: ctx.comps,
      today,
    });
    expect(["held", "waiting", "unknown"], `${card.id} landed in no state`).toContain(ruled.state);
    expect(ruled.record, `${card.id} was ruled without a record`).not.toBe("");
  }
  expect(unstampedLines(render(recs))).toEqual([]);
});

test("THE WOKEN SECTION REACHES THE RENDERED ANSWER — `--dispatch` carries the counted line and `--full` the page", () => {
  // T-285 criterion 2 names the RENDER SITE: "WHEN `brief.mjs --dispatch
  // --full` renders THE view SHALL carry a WOKEN section". The lane built
  // the derivation (`wakeRecs`) and the bodies above inside its fence,
  // and the one-line call that puts the section into the answer lives in
  // `brief.mjs` — outside the fence as dispatched, widened by the seat's
  // grant, exactly as T-282-s1 had to be. This body is the one that
  // wiring owes: the section's own headings, as `wakeRecs` spells them,
  // must be IN the bytes the command writes. Measured through a file,
  // never a pipe, so the assertion is over the whole answer (T-225-s1).
  const dir = mkdtempSync(path.join(os.tmpdir(), "t285-wiring-"));
  try {
    const answer = (argv: string[]): string => {
      const out = path.join(dir, `${argv.length}.txt`);
      const fd = openSync(out, "w");
      let status: number | null;
      try {
        status = spawnSync(process.execPath, argv, { cwd: repoRoot, stdio: ["ignore", fd, "ignore"] }).status;
      } finally {
        closeSync(fd);
      }
      expect(status, `${argv.join(" ")} did not answer cleanly`).toBe(EXIT.CLEAN);
      return readFileSync(out, "utf8");
    };
    const full = answer([CLI, "--dispatch", "--full"]);
    for (const heading of [
      "THE WOKEN PARKED CARDS",
      "WOKEN — the condition holds",
      "PARKED WITHOUT A CONDITION",
      "CHANGES NO CARD",
    ]) {
      expect(full, `the full view carries the section's own line ${JSON.stringify(heading)}`).toContain(heading);
    }
    expect(full).toMatch(/^\d+ of \d+ parked card\(s\) have woken {2}<- read /m);

    // THE POSITIVE CONTROL, and it is the other half of the criterion
    // rather than a duplicate of the arm above: the DEFAULT view carries
    // the counted line — a woken parked card is a candidate for exactly
    // the question that view answers — and NOT the page behind --full.
    const plain = answer([CLI, "--dispatch"]);
    expect(plain, "the default view says how many woke").toContain("parked card(s) have woken");
    expect(plain, "and the page is the triage seat's read").not.toContain("PARKED WITHOUT A CONDITION");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("THE PROSE TEST SEES THE BOARD'S OWN `UN-PARK WHEN:` SPELLING — nine live parked cards write the condition that way and the flag calls them conditionless", () => {
  // ASSIGNED CORRECTION (verifier, phase 2, 2026-09-09, measured at
  // ce46115). The flag's own stated failure mode is the CONFIDENT one —
  // "a card whose author wrote a condition reported as having written
  // none" — and the rule as dispatched has exactly that: `\b(?:unpark|
  // wake)` cannot see `UN-PARK`, and `**UN-PARK WHEN:**` is the amnesty
  // triage's own template. Nine of the ninety cards the live view flags
  // carry it IN BOLD: T-031-s2, T-033-s1, T-033-s9, T-110-s2, T-123-s2,
  // T-124-s2, T-127-s3, T-135-s1, T-135-s2.
  //
  // AND THE WIDENING STOPS HERE, WHICH IS MEASURED RATHER THAN CHOSEN:
  // `resurface` fires on 69 of those same 90, because TASK-FORMAT's own
  // "resurfacing condition" sentence is quoted in the parking
  // boilerplate — widening to it would empty the flag instead of
  // sharpening it. One spelling, the one the board actually uses.
  expect(
    PROSE_WAKE_PATTERN.test("Real and still true; not now. **UN-PARK WHEN:** C-08 declares C-10."),
    "the board's own hyphenated spelling is a condition",
  ).toBe(true);
  expect(PROSE_WAKE_PATTERN.test("Unpark with the second adapter."), "and the unhyphenated one still is").toBe(
    true,
  );
  expect(
    PROSE_WAKE_PATTERN.test("Parked at the ninth triage."),
    "the word every parking note spells about itself is still not a condition",
  ).toBe(false);
  expect(PROSE_WAKE_PATTERN.test("the runner is awake"), "and the rule is still bounded on the left").toBe(false);
  expect(
    PROSE_WAKE_PATTERN.test("a parking note carries a resurfacing condition"),
    "the boilerplate quote is still not a condition — widening to it would empty the flag",
  ).toBe(false);

  // DRIVEN THROUGH THE VIEW, never asserted about a regex nobody calls:
  // the flag must drop the card that spells it and keep the one that
  // says nothing.
  const board: WakeFixture[] = [
    { id: "T-530", status: "parked", body: "Real and still true; not now. **UN-PARK WHEN:** C-08 declares C-10." },
    { id: "T-531", status: "parked", body: "Parked at the ninth triage. Too early to build." },
  ];
  const line = wakeAnswer(board, []).split("\n").find((l) => l.includes("state no condition at all")) ?? "";
  expect(line, "the hyphenated spelling is a condition").not.toContain("T-530");
  expect(line, "and a card that states nothing is still flagged").toContain("T-531");
  expect(line).toContain("1 parked card(s) state no condition at all");

  // AND THE METHOD TEXT STATES THE SPELLING IT ACCEPTS, so the author
  // writing `UN-PARK WHEN:` and this reader are looking at one sentence.
  expect(
    readDoc("method/tasks/TASK-FORMAT.md"),
    "the hyphenated spelling is stated where the card author reads it",
  ).toMatch(/un-park/i);
});

/**
 * T-307's VERDICT CORRECTIONS (verifier, phase 2, bench worktree
 * supertaskr-V-T-307).
 *
 * MF-11 holds the propose-before-record rule's WORDING half by reading
 * `docs/rooms/**.md`. Both corrections below are ESCAPES of it, and
 * neither is visible to the eval's own positive control, because that
 * control plants the one shape the check already sees. Each body runs
 * MF-11's OWN exported audit — the same function `check()` calls — over
 * one synthetic entry dated at the eval's own floor, so what is pinned
 * is the audit's answer and never a spelling. The identity list is
 * passed in rather than derived, so no body here handles a real name and
 * no body here needs a git history to run.
 */
const MF11_PROBE = [
  'import { auditWithCoverage, FLOOR } from',
  '  "./tools/method-evals/evals/mf-11-room-entries-paraphrase.mjs";',
  'const entry = String(process.env.MF11_ENTRY).split("<FLOOR>").join(FLOOR);',
  'const ids = JSON.parse(String(process.env.MF11_IDS));',
  'const rel = "docs/rooms/the-verifier-probe.md";',
  'const found = auditWithCoverage(new Map([[rel, entry]]), ids).findings;',
  "process.stdout.write(JSON.stringify(found));",
].join("\n");

/** MF-11's findings for one synthetic room entry. `<FLOOR>` becomes its floor. */
function mf11Findings(entry: string, identities: string[]): string[] {
  const out = execFileSync("node", ["--input-type=module", "-e", MF11_PROBE], {
    cwd: repoRoot,
    encoding: "utf8",
    env: { ...process.env, MF11_ENTRY: entry, MF11_IDS: JSON.stringify(identities) },
  });
  return JSON.parse(out) as string[];
}

/** A token no method file uses and no person answers to. */
const PROBE_IDENTITY = "zzowner";

test("T-307 C1 — MF-11 refuses a quotation attributed to the owner HOWEVER LONG it is", () => {
  // KILLED BY: a length ceiling on the quoted run. The rule's subject is
  // a pasted chat message; a pasted chat message is the LONG shape, so a
  // ceiling exempts the entry the rule exists for while catching the
  // short quotations nobody was worried about. Measured on this
  // repository's own corpus at b78f9f50: of 44 quotations of the refused
  // shape across the live rooms and decision records, one already runs to
  // 614 characters.
  const message = `${"just build the second one, the first is a waste of a whole sitting and I do not want to spend another day on it. ".repeat(7).trim()}`;
  expect(message.length, "the probe message is longer than any ceiling a matcher might carry").toBeGreaterThan(600);
  const long = mf11Findings(`## The ruling (<FLOOR>)\n\n@human (<FLOOR>): "${message}"\n`, [PROBE_IDENTITY]);
  expect(
    long.filter((f) => f.includes("QUOTES")).length,
    "a long quoted run walks past MF-11 — the pasted message the rule exists to refuse is the long one",
  ).toBe(1);
  // THE BOUNDARY, so a green here is not a probe that flags everything:
  // the short quotation is caught too, and the paraphrase is clean.
  const short = mf11Findings(`## The ruling (<FLOOR>)\n\n@human (<FLOOR>): "just build the second one instead".\n`, [
    PROBE_IDENTITY,
  ]);
  expect(short.filter((f) => f.includes("QUOTES")).length, "and the short one is still caught").toBe(1);
  expect(
    mf11Findings(`## The ruling (<FLOOR>)\n\nThe owner ruled on <FLOOR> that the second option is built.\n`, [
      PROBE_IDENTITY,
    ]),
    "and the paraphrased twin is still clean, so this probe is not flagging everything",
  ).toEqual([]);
});

test("T-307 C2 — MF-11 refuses an entry that attributes a ruling to the owner by HANDLE", () => {
  // KILLED BY: skipping a whitespace token because it carries an at-sign.
  // That skip is for machine facts, and a bare handle is not one — it is
  // the name. It takes an entry past BOTH halves at once: the name half
  // skips the token, and the quote half never fires because the
  // attribution set holds roles and never a name. One character in the
  // attribution greens the whole eval.
  const handled = mf11Findings(
    `## The ruling (<FLOOR>)\n\n@${PROBE_IDENTITY} (<FLOOR>): "just build the second one, the first is a waste of a sitting".\n`,
    [PROBE_IDENTITY],
  );
  expect(
    handled.filter((f) => f.includes("NAMES")).length,
    "an at-sign in front of the name takes the entry past BOTH halves of MF-11",
  ).toBe(1);
  // ARMING ABSENT, twice over: the same name with no at-sign was always
  // caught, and an address that really is a machine fact is still skipped.
  expect(
    mf11Findings(`## The ruling (<FLOOR>)\n\nRecorded on <FLOOR> by ${PROBE_IDENTITY} after the call.\n`, [
      PROBE_IDENTITY,
    ]).filter((f) => f.includes("NAMES")).length,
    "the bare name was never the escape",
  ).toBe(1);
  expect(
    mf11Findings(`## The ruling (<FLOOR>)\n\nThe owner ruled on <FLOOR>; the run is logged at ${PROBE_IDENTITY}@example.com.\n`, [
      PROBE_IDENTITY,
    ]),
    "and an address is still a machine fact rather than an attribution",
  ).toEqual([]);
});

/* ────────────────────────────────────────────────────────────────────
 * THE THREE TIERS (T-296, ADR-024 decision 1)
 *
 * The tier is a function of the CARD and the TREE, so every body below
 * has two sides that share no constant: one reads the documents, the
 * other computes from a planted input. A body that built its expectation
 * out of the same map the classifier reads would be the one-arrangement
 * defect `method/roles/verifier.md` 2b names.
 * ──────────────────────────────────────────────────────────────────── */

/**
 * THIS TREE'S GUARD-CLASS CANDIDATES, DERIVED WITHOUT READING THE MAP.
 *
 * The rule is the one docs/CONVENTIONS.md's guard-class bullet publishes
 * for this side of the comparison — the agent harness's own directory,
 * the workflows, the method, the parser's source, and the scripts whose
 * own NAME says they gate, guard, fence, lock, push or land. It is a
 * NAME-and-DIRECTORY rule and the map is a PATH list, which is what makes
 * the two independent: the map could name a path this rule never finds,
 * and this rule finds paths nobody has mapped. Only the second direction
 * is a failure, and it is the one that goes stale in silence.
 */
function guardClassCandidates(): string[] {
  return trackedFiles(repoRoot).filter(
    (f) =>
      f.startsWith(".claude/") ||
      f.startsWith(".github/workflows/") ||
      f.startsWith("method/") ||
      f.startsWith("lib/parser/src/") ||
      (f.startsWith("tools/e2e/scripts/") &&
        /(gate|guard|fence|lock|push|landing)/.test(path.basename(f))),
  );
}

test("the guard-class CLASSES are the method's and the PATHS are the project's, and a disagreement either way is a hard failure", () => {
  // KILLED BY: a class list typed into the program instead of read out of
  // the method; a map that quietly ignores a class the method declares
  // (which stops guarding whatever that class named, in silence); and a
  // map that invents a class no other project could inherit.
  const taskFormat = readDoc("method/tasks/TASK-FORMAT.md");
  const conventions = conventionsText(repoRoot);
  const ids = guardClassIds(taskFormat);
  expect(ids.length, "the method declares no guard class at all").toBeGreaterThan(3);
  expect(ids, "the class the whole method-text tier turns on").toContain("method-text");
  const map = guardClassMap(conventions, ids);
  expect([...map.keys()].sort(), "every declared class is mapped and no other").toEqual([...ids].sort());
  for (const [id, tokens] of map) {
    expect(tokens.length, `${id} is mapped to nothing, so it guards nothing`).toBeGreaterThan(0);
  }

  // BOTH DIRECTIONS, ON COPIES OF THE CONTRACT — the degradation is
  // applied where the subject's own arming is absent, which is 2b's
  // shape: a class the method declares and the document does not map,
  // and a class the document maps and the method does not declare.
  expect(() => guardClassMap(conventions, [...ids, "no-such-class"])).toThrow(/maps none of them/);
  const invented = conventions.replace("THE MAP:**", "THE MAP:** `invented-class`: `nowhere/`;");
  expect(() => guardClassMap(invented, ids)).toThrow(/invented-class/);

  // AND THE READER FOLLOWS THE DOCUMENT RATHER THAN OVERRULING IT: a
  // class renamed in the method is a class this program then asks the
  // project about under the new name.
  const renamed = taskFormat.replace("- `ci-workflow` — ", "- `runner-instructions` — ");
  expect(guardClassIds(renamed), "the program answers the document").toContain("runner-instructions");

  // THE BLESSED RUNNER IS MATCHED BY SHAPE AND NOT BY NAME, and that is a
  // CONSTRAINT rather than a style: `gate-run.spec.ts` requires this
  // document to name that runner in exactly ONE place, so a map that
  // spelled its filename would red a body in another file entirely — and
  // the lane that wrote it would learn only from the closing battery.
  // This body is where that trap is stated where the map is written.
  const runner = blessedRunner(conventions).script;
  const gateTokens = map.get("gate-runners") ?? [];
  expect(
    gateTokens.some((t) => t === runner),
    "the guard-class map spells the blessed runner's filename, which is this document's SECOND " +
      "naming of it — match its shape with a trailing `*` instead",
  ).toBe(false);
  expect(
    guardClassHits([runner], map).length,
    "and matching by shape still has to COVER it, or the constraint was met by dropping the class",
  ).toBe(1);
  // The prefix form is exercised where a body can see it fail, too.
  expect(guardTokenCovers("tools/e2e/scripts/gate-*", "tools/e2e/scripts/gate-run.mjs")).toBe(true);
  expect(guardTokenCovers("tools/e2e/scripts/gate-*", "tools/e2e/scripts/lane-lock.mjs")).toBe(false);
  expect(guardTokenCovers("*", "anything"), "a bare star covers nothing, deliberately").toBe(false);
});

test("EVERY GUARD-CLASS FILE THIS TREE CARRIES IS COVERED, and the derivation that finds them never reads the map", () => {
  // KILLED BY: a map that stops covering a guard-class directory, and by
  // a new hook, workflow, method file, parser source or gate script
  // arriving with nothing mapping it. That second half is the whole
  // reason this body exists: a hand-kept list of what matters goes stale
  // the day something new arrives, and it goes stale SILENTLY.
  const map = guardClassMap(conventionsText(repoRoot), guardClassIds(readDoc("method/tasks/TASK-FORMAT.md")));
  const candidates = guardClassCandidates();
  expect(candidates.length, "the derivation found no candidate, so this body proves nothing").toBeGreaterThan(20);
  const covered = new Set(guardClassHits(candidates, map).map((h) => h.path));
  expect(
    candidates.filter((c) => !covered.has(c)),
    "these tracked files are guard-class by the tree's own rule and no class in " +
      "docs/CONVENTIONS.md's map covers them — map them, or argue them out of the rule",
  ).toEqual([]);

  // THE POSITIVE CONTROL, RUN AND NOT ASSERTED (method/roles/verifier.md
  // 2b): the same check, over the same tree, against a COPY of the map
  // with one class removed, and it names exactly the files that class
  // covered. A check that could not fail here would be green for the
  // wrong reason above.
  const damaged = new Map(map);
  damaged.delete("method-text");
  const stillCovered = new Set(guardClassHits(candidates, damaged).map((h) => h.path));
  const exposed = candidates.filter((c) => !stillCovered.has(c));
  expect(exposed.length, "removing method-text exposed nothing, so the check above cannot fail").toBeGreaterThan(10);
  expect(
    exposed.every((f) => f.startsWith("method/")),
    "the damage exposed something other than what the removed class covered",
  ).toBe(true);
});

test("the classifier answers from the card and the tree, and what it cannot read it REFUSES rather than guesses", () => {
  // KILLED BY: a classifier that lets size outrank a guard-class path; one
  // that admits a card to `bounded` on an unanswered keeper question; one
  // that resolves an unreadable card downward instead of refusing; and one
  // that treats an L card as ordinary because its fence looks harmless.
  const map = guardClassMap(conventionsText(repoRoot), guardClassIds(readDoc("method/tasks/TASK-FORMAT.md")));
  const answered = { pinned: true, answered: true, why: "a keeper is green at the base" };
  const clean = { unresolved: [], untracked: [], guardMap: map, keeper: answered };

  // GUARD-CLASS OUTRANKS EVERY SIZE, and the reason is printed.
  const guarded = classifyTier({ ...clean, size: "XS", fencePaths: ["method/roles/executor.md"] });
  expect(guarded.tier).toBe("guarded");
  expect(guarded.reason, "the refusal-proof answer names the path AND the class").toContain("method-text");
  expect(classifyTier({ ...clean, size: "L", fencePaths: ["app/src/x.ts"] }).tier).toBe("guarded");

  // STANDARD IS EVERYTHING ELSE, and bounded is the narrow case.
  expect(classifyTier({ ...clean, size: "S", fencePaths: ["app/src/x.ts"] }).tier).toBe("standard");
  expect(classifyTier({ ...clean, size: "M", fencePaths: ["app/src/x.ts"] }).tier).toBe("standard");
  expect(classifyTier({ ...clean, size: "XS", fencePaths: ["app/src/x.ts"] }).tier).toBe("bounded");
  // Each bounded condition, removed one at a time, lands on standard.
  expect(
    classifyTier({ ...clean, size: "XS", fencePaths: ["app/src/x.ts"], untracked: ["app/src/x.ts"] }).tier,
    "a fence that is not wholly inside a tracked one is not bounded",
  ).toBe("standard");
  expect(
    classifyTier({
      ...clean,
      size: "XS",
      fencePaths: ["app/src/x.ts"],
      keeper: { pinned: false, answered: true, why: "no spec owns it" },
    }).tier,
    "no keeper pinning it is not bounded",
  ).toBe("standard");

  // THE THREE UNREADABLE THINGS, EACH REFUSED BY NAME.
  expect(() => classifyTier({ ...clean, size: "", fencePaths: ["app/src/x.ts"] })).toThrow(TierFinding);
  expect(() => classifyTier({ ...clean, size: "", fencePaths: ["app/src/x.ts"] })).toThrow(/no `size:`/);
  expect(() =>
    classifyTier({ ...clean, size: "S", fencePaths: [], unresolved: ["C-99"] }),
  ).toThrow(/expand to no path/);
  expect(() =>
    classifyTier({
      ...clean,
      size: "XS",
      fencePaths: ["app/src/x.ts"],
      keeper: { pinned: false, answered: false, why: "the runner graded nothing" },
    }),
  ).toThrow(/refused rather than resolved downward/);
  // AND THE UNANSWERED KEEPER ONLY REFUSES WHERE IT DECIDES SOMETHING:
  // an S card's tier does not depend on it, so the same input classifies.
  expect(
    classifyTier({
      ...clean,
      size: "S",
      fencePaths: ["app/src/x.ts"],
      keeper: { pinned: false, answered: false, why: "the runner graded nothing" },
    }).tier,
    "a question that decides nothing here is not a reason to refuse",
  ).toBe("standard");
});

test("THE KEEPER RUN IS READ OFF ITS OUTPUT, so a derivation that graded nothing is not a red baseline", () => {
  // KILLED BY: reading the exit code alone, which folds "could not place
  // a fenced path" into "the baseline is red" — and every card whose
  // fence names method text is the first case. An exit 0 over nothing is
  // not a pass either, and this is the same distinction.
  const runner = blessedRunner(conventionsText(repoRoot));
  expect(runner.script, "the runner is DERIVED from the document, never typed").toContain("gate-run");
  expect(runner.verdictToken, "and so is the token a graded reading prints").toBe("gate-verdict");

  const refused = keeperVerdict({
    status: 3,
    stdout: "gate-run: REFUSING the scoped reading — the derivation cannot place method/roles/x.md",
    stderr: "",
    token: runner.verdictToken,
  });
  expect(refused.graded, "a refusal graded nothing").toBe(false);
  expect(refused.detail, "and the note carries what the runner actually said").toContain("REFUSING");

  const red = keeperVerdict({
    status: 1,
    stdout: `${runner.verdictToken} suite=e2e verdict=RED bodies=41`,
    stderr: "",
    token: runner.verdictToken,
  });
  expect(red.graded && !red.green, "a graded non-zero IS a red baseline").toBe(true);
  const green = keeperVerdict({
    status: 0,
    stdout: `${runner.verdictToken} suite=e2e verdict=GREEN bodies=41`,
    stderr: "",
    token: runner.verdictToken,
  });
  expect(green.graded && green.green, "and a graded zero is the baseline holding").toBe(true);
});

test("A FENCE NAMING A DIRECTORY NAMES THE GUARDS INSIDE IT, and a leading ./ is not a different path", () => {
  // KILLED BY: a containment that only asks whether the MAP's token covers
  // the fenced path and never whether the fenced path CONTAINS the token.
  // `tools/e2e/scripts/` is a tracked directory holding the gate runners
  // and `lib/` holds the parser, so a card fencing either is a card
  // editing them — and asking one direction answered `standard` for a
  // fence over the guards themselves, which is the cheap bench bought on
  // the one class of file this tier exists for.
  const map = guardClassMap(conventionsText(repoRoot), guardClassIds(readDoc("method/tasks/TASK-FORMAT.md")));
  const keeper = { pinned: true, answered: true, why: "graded and green" };
  const tierOf = (fencePaths: string[]): string =>
    classifyTier({ size: "M", fencePaths, unresolved: [], untracked: [], guardMap: map, keeper }).tier;

  // THE ANCESTOR DIRECTION, over directories this tree really carries and
  // the mapped tokens really inside them — DERIVED from the map, never
  // typed here, so a map that moves moves this body with it.
  const mapped = [...map.values()].flat();
  for (const dir of ["tools/e2e/scripts/", "lib/"]) {
    const inside = mapped.filter((t) => t.startsWith(dir));
    expect(inside.length, `${dir} holds no mapped guard, so this arm would prove nothing`).toBeGreaterThan(0);
    expect(tierOf([dir]), `${dir} holds ${inside.join(", ")}`).toBe("guarded");
  }

  // THE SAME FILE, SPELLED THE WAY A RELATIVE PATH IS USUALLY SPELLED.
  expect(tierOf(["./method/roles/verifier.md"]), "a leading ./ is not a different file").toBe("guarded");

  // THE CONTROLS, WHERE THE ARMING IS ABSENT: a directory holding no
  // mapped guard stays standard, and a name that merely EXTENDS a class's
  // characters is still not inside it. Without these, a containment that
  // fired on everything would pass every arm above.
  expect(mapped.some((t) => t.startsWith("docs/")), "docs/ must hold no mapped token for this control").toBe(false);
  expect(tierOf(["docs/"]), "a directory with no guard under it").toBe("standard");
  expect(guardTokenCovers("method/", "methodical/x.md"), "a prefix without a separator boundary is not a hit").toBe(false);
  expect(
    guardTokenCovers("tools/e2e/scripts/gate-*", "tools/e2e/scripts/lane-lock.mjs"),
    "and the prefix form keeps its own boundary",
  ).toBe(false);
});

test("A KEEPER RUN THAT PUBLISHED `verdict=REFUSED` GRADED NOTHING, and a dispatch does not call that a red baseline", () => {
  // KILLED BY: deciding green from the process exit alone after grepping
  // for the very line that carries the verdict word. `gate-run.mjs`
  // publishes GREEN, RED and REFUSED on that line and its own header says
  // REFUSED is never a green run and never a red one — a scoped run that
  // collected zero bodies exits non-zero and says REFUSED, and reading
  // that as RED refuses a dispatch whose baseline nobody ever measured.
  // That is the mirror of the over-refusal this function's own comment
  // says it exists to prevent.
  const token = blessedRunner(conventionsText(repoRoot)).verdictToken;
  const refused = keeperVerdict({
    status: 1,
    stdout: `${token} suite=e2e exit=1 bodies=0 targets=1 verdict=REFUSED scope=tools/e2e/tests/x.spec.ts reason=zero-bodies`,
    stderr: "",
    token,
  });
  expect(refused.graded, "the runner REFUSED to grade, so nothing was graded").toBe(false);
  expect(refused.green, "and a refusal is not a pass either").toBe(false);
  expect(refused.detail, "and the detail carries what the runner actually said").toContain("REFUSED");

  // THE TWO CONTROLS, WHERE THE ARMING IS ABSENT: the same reader over a
  // line the runner DID grade still answers graded, in both directions.
  // Without them an implementation answering `graded: false` for
  // everything would pass the arm above.
  const red = keeperVerdict({
    status: 1,
    stdout: `${token} suite=e2e exit=1 bodies=41 targets=1 verdict=RED reason=ok`,
    stderr: "",
    token,
  });
  expect(red.graded && !red.green, "a GRADED non-zero is still a red baseline").toBe(true);
  const green = keeperVerdict({
    status: 0,
    stdout: `${token} suite=e2e exit=0 bodies=41 targets=1 verdict=GREEN reason=ok`,
    stderr: "",
    token,
  });
  expect(green.graded && green.green, "and a GRADED zero is still the baseline holding").toBe(true);
});

test("THE PHASE 1 BRIEF IS RENDERED FROM THE CARD AT THE BASE AND CARRIES NOTHING FROM THE LANE", () => {
  // KILLED BY: a renderer handed the tip's card, the notes, the diff or
  // any figure measured after the cut. The guarantee is the PARAMETER
  // LIST — this function is given no root, no branch and no ref later
  // than the base — and the body below proves the guarantee holds by
  // planting lane-only text where a leak would have to come from.
  const LANE_ONLY = "LANE-ONLY-STRING-THE-EXECUTOR-WROTE";
  const atBase = ["---", "id: T-999", "size: S", "---", "", "## Acceptance criteria", "", "- THE thing SHALL happen."].join("\n");
  const atTip = `${atBase}\n\n## Implementation notes\n\n${LANE_ONLY}\n`;
  const rendered = renderPhase1({
    taskId: "T-999",
    tier: "standard",
    base: "0123456789abcdef",
    card: "docs/tasks/T-999-a-card.md",
    cardText: atBase,
    verifierMd: readDoc("method/roles/verifier.md"),
    attackSetFile: "/scratch/attack-set-T-999.md",
  });
  expect(rendered, "the contract it is written against is in it").toContain("THE thing SHALL happen.");
  expect(rendered, "the base it was read at is named").toContain("0123456789abcdef");
  expect(rendered, "and the role file it is judged by").toContain("# Role: verifier");
  expect(rendered.includes(LANE_ONLY), "the rendered brief carries the lane's own notes").toBe(false);

  // THE CONTROL, AND IT IS THE HALF THAT MATTERS: the same renderer,
  // handed the TIP's card, would carry the lane — so the blindness is a
  // property of WHAT IS PASSED, and the caller that passes it is the one
  // reading `git show <base>:<card>` at the stamp commit.
  const leaked = renderPhase1({
    taskId: "T-999",
    tier: "standard",
    base: "0123456789abcdef",
    card: "docs/tasks/T-999-a-card.md",
    cardText: atTip,
    verifierMd: "# Role: verifier",
    attackSetFile: "/scratch/attack-set-T-999.md",
  });
  expect(leaked.includes(LANE_ONLY), "the control did not leak, so the assertion above proves nothing").toBe(true);

  // AND IT SAYS WHAT IT IS: tool-less, one artifact, the floor, and the
  // sentence that stops a dispatcher waiting for a session an arm cannot
  // open.
  expect(rendered).toContain("NO file");
  expect(rendered).toContain("at least one attack");
  expect(PHASE1_SPAWN_NOTE).toContain("AN ARM CANNOT SPAWN A SEAT");
});

test("the bench takes the ground at the base, seals three inputs by sha256, and renders phase 2 from the seal", () => {
  // KILLED BY: a ground with counts and no body names; a seal over two
  // inputs called three; a phase 2 brief that names no digest; and a
  // renderer that hands phase 2 the card at the TIP, which is the card
  // with the executor's notes on it.
  const bodies = specBodies(
    ['test("one thing happens", () => {});', "test(`another thing happens`, () => {});", "// test(\"a comment\")"].join("\n"),
  );
  expect(bodies, "both quotings, and the comment is not a body this reader invents").toEqual([
    "one thing happens",
    "another thing happens",
    "a comment",
  ]);

  const census = censusSection("# Capabilities\n\n## brief\n\n- one\n- two\n\n## other\n\n- three\n", "tools/e2e/tests/brief.spec.ts");
  expect(census, "the census section is keyed off the spec's own slug").toEqual({
    heading: "## brief",
    count: 2,
    present: true,
  });
  expect(
    censusSection("# Capabilities\n", "tools/e2e/tests/nothing.spec.ts").present,
    "a spec the census does not name is SAID, never omitted",
  ).toBe(false);

  const ground = groundDocument({
    taskId: "T-999",
    tier: "standard",
    base: "0123456789abcdef",
    card: "docs/tasks/T-999-a-card.md",
    files: [
      { rel: "tools/e2e/scripts/x.mjs", blob: "aaaa111", bytes: 120 },
      {
        rel: "tools/e2e/tests/x.spec.ts",
        blob: "bbbb222",
        bytes: 340,
        bodies: ["a body that measures something"],
        census: { heading: "## x", count: 1, present: true },
      },
    ],
    preflight: { exit: 0, findings: [] },
  });
  expect(ground, "the hashes are at the base and the base is named").toContain("0123456789abcdef");
  expect(ground, "a fenced file's blob and bytes").toContain("| tools/e2e/scripts/x.mjs | aaaa111 | 120 |");
  expect(ground, "the spec's body NAMES and not only its count").toContain("a body that measures something");
  expect(ground, "the census section beside them").toContain("## x");
  expect(ground, "and the addendum heading the guarded tier writes under").toContain(GROUND_ADDENDUM_HEADING);

  const digests = [
    { what: "the attack set", file: "/s/attack-set-T-999.md", digest: sha256("an attack set") },
    { what: "the ground", file: "/s/ground-T-999.md", digest: sha256(ground) },
    { what: "the card at 0123456789abcdef", file: "docs/tasks/T-999-a-card.md", digest: sha256("a card") },
  ];
  expect(new Set(digests.map((d) => d.digest)).size, "three inputs, three distinct digests").toBe(3);
  expect(digests[0]?.digest, "sha256 is a stated algorithm, not an implementation detail").toHaveLength(64);
  const seal = sealDocument({ taskId: "T-999", tier: "standard", base: "0123456789abcdef", tip: "fedcba9876543210", inputs: digests });
  for (const d of digests) expect(seal, `${d.what} is sealed`).toContain(`sha256:${d.digest}`);
  expect(seal, "and a mismatched citation is refused").toContain("REFUSED");

  const phase2 = renderPhase2({
    taskId: "T-999",
    tier: "standard",
    base: "0123456789abcdef",
    tip: "fedcba9876543210",
    bench: "/somewhere/supertaskr-V-T-999",
    card: "docs/tasks/T-999-a-card.md",
    cardText: "---\nid: T-999\n---\nthe contract",
    attackSetFile: "/s/attack-set-T-999.md",
    groundFile: "/s/ground-T-999.md",
    stampsFile: "/s/stamps-T-999.txt",
    suites: "the owed set of the range",
  });
  expect(phase2, "phase 2 is a FRESH spawn and the brief says so").toContain("FRESH spawn");
  expect(phase2, "it names the three sealed inputs").toContain("/s/stamps-T-999.txt");
  expect(phase2, "it points at the mode rather than restating it").toContain("The standard mode, stated once");
  expect(phase2, "and it carries the contract, at the base").toContain("the contract");
  const guardedBrief = renderPhase2({
    taskId: "T-999",
    tier: "guarded",
    base: "0123456789abcdef",
    tip: "fedcba9876543210",
    bench: "/somewhere/supertaskr-V-T-999",
    card: "docs/tasks/T-999-a-card.md",
    cardText: "the contract",
    attackSetFile: "/s/attack-set-T-999.md",
    groundFile: "/s/ground-T-999.md",
    stampsFile: "/s/stamps-T-999.txt",
    suites: "the whole battery",
  });
  expect(guardedBrief, "and the guarded tier gets the whole role file and the addendum").toContain("GUARDED");
});

test("the tier line is CREATED where a card has none, and no other field may be created by a stamp", () => {
  // KILLED BY: a stamp that appends any missing key (which is the silent
  // no-op T-239 removed), and by one that refuses `tier:` too — which
  // would make every card unstampable, since an author leaves the field
  // out and the template does not carry it.
  const card = ["---", "id: T-901", "size: S", "status: planned", "builder:", "---", "", "body"].join("\n");
  const stamped = stampCard(card, { status: "building", tier: "standard" }, { insertAfter: { tier: "size" } });
  const lines = stamped.text.split("\n");
  expect(lines, "the created line carries the derived value").toContain("tier: standard");
  expect(
    lines.indexOf("tier: standard"),
    "and it lands where the format publishes it, right after its anchor",
  ).toBe(lines.indexOf("size: S") + 1);
  expect(stamped.changed, "both fields are reported as changed").toEqual(["status", "tier"]);
  expect(stampVerdict(stamped.text, { status: "building", tier: "standard" })).toEqual([]);

  // ARMING ABSENT: the same missing key, with no opt-in, still refuses —
  // and it refuses with the ORIGINAL refusal, not with the creation
  // arm's own "no anchor" one. **THE MESSAGE IS THE DISCRIMINATOR AND
  // THE CLASS IS NOT**: a creation arm that fired for every key would
  // still throw `DispatchLaneFinding` here, from one branch further on,
  // and this body passed against exactly that mutant until it named the
  // sentence.
  expect(() => stampCard(card, { tier: "standard" })).toThrow(
    /has no "tier:" line in its frontmatter/,
  );
  // AND THE OPT-IN IS PER KEY: another missing field is refused even in
  // the same call as a created one, by that same original refusal.
  expect(() =>
    stampCard(card, { tier: "standard", built_at: "now" }, { insertAfter: { tier: "size" } }),
  ).toThrow(/has no "built_at:" line in its frontmatter/);
  // AND AN ANCHOR THE CARD DOES NOT CARRY IS REFUSED RATHER THAN APPENDED
  // BLIND — the creation is placed, never dumped at the end.
  expect(() =>
    stampCard(card, { tier: "standard" }, { insertAfter: { tier: "no_such_field" } }),
  ).toThrow(/no published place/);
  // A SECOND STAMP OVER AN EXISTING LINE REPLACES IT AND CREATES NOTHING.
  const again = stampCard(stamped.text, { tier: "guarded" }, { insertAfter: { tier: "size" } });
  expect(again.text.split("\n").filter((l) => l.startsWith("tier:")), "one tier line, not two").toHaveLength(1);
  expect(again.text).toContain("tier: guarded");
});

test("THE BENCH ARM TAKES THE GROUND, SEALS THREE INPUTS AND RENDERS PHASE 2, against a real dispatch", () => {
  // KILLED BY: a bench that seals nothing, one that seals a ground it did
  // not write, one that renders phase 2 without the digests, and one that
  // proceeds when phase 1's return was never saved — which would leave a
  // verdict citing a hash over a file nobody wrote. IT IS AN END-TO-END
  // BODY because the seal is only worth anything over the real files: a
  // digest computed on a string in memory proves the algorithm, not the
  // ritual.
  const fx = ritualFixture("bench");
  try {
    const dispatched = spawnSync(
      process.execPath,
      [CLI, "--dispatch-lane", FIXTURE_CARD_ID, "--slug", FIXTURE_SLUG, "--root", fx.root, "--scratch", fx.scratch],
      { cwd: repoRoot, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
    );
    expectDispatched(dispatched, fx, "the dispatch this bench verifies");

    // NO ATTACK SET IS A REFUSAL, NOT A SMALLER SEAL. Phase 1's return is
    // saved by the seat; a bench that sealed two inputs and called them
    // three would put a citation over a file nobody wrote.
    const without = spawnSync(
      process.execPath,
      [CLI, "--bench", FIXTURE_CARD_ID, "--root", fx.root, "--scratch", fx.scratch],
      { cwd: repoRoot, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
    );
    expect(without.status, "a bench with no attack set is a FOUND, never a clean run").toBe(EXIT.FOUND);
    expect(without.stderr, "and it names the file it wanted").toContain(`attack-set-${FIXTURE_CARD_ID}.md`);

    // THE ARMED RUN: phase 1's return on disk, exactly as the seat saves it.
    const attackSet = path.join(fx.scratch, `attack-set-${FIXTURE_CARD_ID}.md`);
    writeFileSync(attackSet, "# ATTACK SET\n\n- satisfy the letter of the criterion and fail its purpose\n");
    const ran = spawnSync(
      process.execPath,
      [CLI, "--bench", FIXTURE_CARD_ID, "--root", fx.root, "--scratch", fx.scratch],
      { cwd: repoRoot, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
    );
    expect(ran.status, ran.stderr).toBe(EXIT.CLEAN);

    const ground = readFileSync(path.join(fx.scratch, `ground-${FIXTURE_CARD_ID}.md`), "utf8");
    const stamps = readFileSync(path.join(fx.scratch, `stamps-${FIXTURE_CARD_ID}.txt`), "utf8");
    const phase2 = readFileSync(path.join(fx.scratch, `phase2-${FIXTURE_CARD_ID}.txt`), "utf8");

    // THE GROUND IS AT THE BASE, and the fixture card's fence is one file.
    expect(ground, "the fenced file, with git's own object id and its size").toContain("README.md");
    expect(ground, "and the addendum heading the guarded tier writes under").toContain(GROUND_ADDENDUM_HEADING);

    // THE SEAL IS THREE DIGESTS, AND THEY ARE THE DIGESTS OF THE FILES ON
    // DISK — computed here from the bytes rather than copied out of the
    // seal, so the two sides share no value.
    expect(stamps, "the attack set is sealed").toContain(`sha256:${sha256(readFileSync(attackSet, "utf8"))}`);
    expect(stamps, "and the ground the arm just wrote").toContain(`sha256:${sha256(ground)}`);
    expect(
      (stamps.match(/sha256:[0-9a-f]{64}/g) ?? []).length,
      "three inputs are sealed: the attack set, the ground, and the card at the base",
    ).toBe(3);

    // AND PHASE 2 POINTS AT ALL THREE, names the tier the DISPATCH
    // derived, and says it is a fresh spawn.
    expect(phase2).toContain(`stamps-${FIXTURE_CARD_ID}.txt`);
    expect(phase2).toContain(`ground-${FIXTURE_CARD_ID}.md`);
    expect(phase2).toContain(`attack-set-${FIXTURE_CARD_ID}.md`);
    expect(phase2, "the tier is the card's, written by the arm at the dispatch stamp").toContain("tier standard");
    expect(phase2, "and a continuation of phase 1 is not a second spawn").toContain("FRESH spawn");
    expect(ran.stdout, "the arm printed the line the seat pastes").toContain("AN ARM CANNOT SPAWN A SEAT");
  } finally {
    removeGitFixture(fx.dir, "ritualFixture(bench)");
  }
});

test("the arm renders phase 1 from the card AS THE COMMIT CARRIES IT, never off the working tree", () => {
  // THE CALLER'S HALF OF THE BLINDNESS, and it needs its own body: the
  // renderer is blind because of WHAT IT IS PASSED, so a caller that
  // passed the working tree's copy would spend the guarantee while every
  // pure-function body above stayed green. The stub answers `git show`
  // with the STAMPED card and `read` with the unstamped one, so the two
  // sources are distinguishable by one line — which is exactly the
  // discrimination this body needs and the arm's own two reads make.
  //
  // KILLED BY: `cardAtBase = io.read(plan.cardFile)` in the phase 1 step,
  // and by any read of the card taken after the lane branch exists.
  const plan = stubPlan();
  const stub = ritualStub(plan, "none");
  const result = runDispatchLane(plan, stub.io);
  expect(result.stopped, "the ritual stopped, so there is no phase 1 to read").toBeUndefined();
  const phase1 = stub.written.get(plan.phase1File) ?? "";
  expect(phase1.length, "no phase 1 brief was written at all").toBeGreaterThan(0);
  expect(phase1, "the card it carries is the one the STAMP COMMIT holds").toContain("status: building");
  // THE CONTROL: the working-tree copy the stub hands `read` does NOT
  // carry that line, so the assertion above discriminates between the two
  // sources rather than being true of both.
  expect(FIXTURE_CARD, "the control: the working-tree card is unstamped").not.toContain("status: building");
  expect(phase1, "and it names the base it was read at").toContain(STUB_BASE);
});

/* ────────────────────────────────────────────────────────────────────
 * T-298 — THE MODEL PER ROLE, READ FROM THE RUNTIME TEMPLATE, and THE
 * BOUNDED WAIT.
 *
 * Two mechanisms, one card, and the thing they have in common is that
 * both replace a value a SESSION used to supply: the model a dispatch
 * ran on, and the duration a seat guessed at. A value supplied by
 * whoever happened to be sitting there is a value nobody can re-derive
 * afterwards, which is why each of the bodies below asks the tree rather
 * than the run.
 * ──────────────────────────────────────────────────────────────────── */

/**
 * THE MODEL ADR-024 decision 5 FIXES, TYPED HERE RATHER THAN IMPORTED.
 *
 * A constant read out of the same module the template feeds would make
 * the body below vacuous in the one direction it exists to guard: the
 * decision names a model, and this is where a reader checks the shipped
 * file against the decision rather than against itself.
 */
const OPUS_5_SEAT = "claude-opus-5@subagent";

test("THE SHIPPED TEMPLATE NAMES A MODEL FOR EVERY ROLE, and every one of them is Opus 5", () => {
  // KILLED BY: a role default emptied, a role dropped from the block, and
  // a value that is not the model ADR-024 decision 5 fixes. It reads the
  // COMMITTED template rather than a fixture on purpose — the criterion
  // is about what this project ships, and a fixture would pass while the
  // shipped file said something else.
  const models = roleModels(runtimeTemplateText(repoRoot));
  expect(models.size, "the roles block parsed to nothing at all").toBeGreaterThan(0);
  for (const [key, model] of models) {
    expect(model, `roles.${key} names no model`).not.toBe("");
    expect(model, `roles.${key} is not Opus 5 (ADR-024 decision 5)`).toBe(OPUS_5_SEAT);
  }
  // AND EVERY ROLE THE ARM DISPATCHES RESOLVES, which is the half a
  // count of the block cannot see: a template with five roles none of
  // which the arm looks up would satisfy the loop above.
  for (const role of Object.keys(ROLE_TEMPLATE_KEYS)) {
    expect(roleModel(models, role).model, `the ${role} seat resolves no model`).toBe(OPUS_5_SEAT);
  }
});

test("THE BRIEF PRINTS THE MODEL IN ROW 1, read from the runtime template and named as such", () => {
  // KILLED BY: a row 1 that stops naming the model, one that names it
  // without saying where it was read, and a model taken from anywhere but
  // the template — which the fixture discriminates by putting a value in
  // that file that exists nowhere else in the tree.
  const fx = ritualFixture("row1");
  try {
    const template = path.join(fx.root, RUNTIME_TEMPLATE);
    writeFileSync(
      template,
      readFileSync(template, "utf8").replace(/^(\s+)builder:.*$/m, "$1builder: fixture-model@probe"),
    );
    const { recs } = assembleBrief(context({ root: fx.root, taskId: FIXTURE_CARD_ID }));
    const printed = render(recs);
    expect(printed, "row 1 does not print the model at all").toContain("model: fixture-model@probe");
    expect(printed, "and it does not say which file it was read from").toContain(
      `read from ${RUNTIME_TEMPLATE} as roles.builder`,
    );
    // THE CONTROL: the value is the fixture's own and appears nowhere
    // else in this tree, so the assertion above cannot be satisfied by a
    // model remembered from the session or copied off the card.
    expect(
      readFileSync(path.join(fx.root, FIXTURE_CARD_FILE), "utf8"),
      "the control: the card names no such model, so row 1 read the template",
    ).not.toContain("fixture-model@probe");
  } finally {
    removeGitFixture(fx.dir, "ritualFixture(row1)");
  }
});

test("A ROLE THE TEMPLATE NAMES NO MODEL FOR REFUSES THE DISPATCH, before a card is stamped or a worktree is cut", () => {
  // KILLED BY: a resolution that falls back to the session's model, one
  // that falls back to any other role's, and one that refuses only AFTER
  // the ritual has begun — which the fixture measures by comparing the
  // tree either side of the refusal.
  const fx = ritualFixture("nomodel");
  try {
    const template = path.join(fx.root, RUNTIME_TEMPLATE);
    writeFileSync(template, readFileSync(template, "utf8").replace(/^(\s+)builder:.*$/m, ""));
    const before = inventory(fx.root);
    let refused: unknown;
    try {
      dispatchLanePlan(context({ root: fx.root }), {
        taskId: FIXTURE_CARD_ID,
        slug: FIXTURE_SLUG,
        scratch: fx.scratch,
      });
    } catch (err) {
      refused = err;
    }
    expect(refused, "a template with no builder default planned a dispatch anyway").toBeInstanceOf(
      ModelFinding,
    );
    const why = (refused as Error).message;
    expect(why, "the refusal does not name the key that is missing").toContain("builder");
    expect(why, "nor the file the repair belongs in").toContain(RUNTIME_TEMPLATE);
    expect(why, "nor why it is a refusal rather than an inheritance").toContain(
      "the dispatching session's own model",
    );
    // AND NOTHING WAS WRITTEN. The plan is pure, so the refusal lands
    // before the stamp commit and before either worktree — which is the
    // half that makes it cheap rather than merely correct.
    expect(inventory(fx.root), "the refused dispatch left something behind").toEqual(before);
    // THE POSITIVE CONTROL: the same fixture with the default restored
    // plans without complaint, so the refusal above is about the missing
    // model and not about the fixture.
    writeFileSync(template, readFileSync(path.join(repoRoot, RUNTIME_TEMPLATE), "utf8"));
    const plan = dispatchLanePlan(context({ root: fx.root }), {
      taskId: FIXTURE_CARD_ID,
      slug: FIXTURE_SLUG,
      scratch: fx.scratch,
    });
    expect(plan.stamp["builder"], "the control: with the default restored the seat is stamped").toBe(
      OPUS_5_SEAT,
    );
  } finally {
    removeGitFixture(fx.dir, "ritualFixture(nomodel)");
  }
});

test("THE DISPATCH STAMPS AND PRINTS THE MODEL PER SEAT, and a dial that overrides one says so", () => {
  // KILLED BY: a stamp that leaves the seat fields empty when no dial was
  // passed, a dial that is ignored, and an override that is printed as
  // though it were the project's own default.
  const fx = ritualFixture("seats");
  try {
    // THE FIXTURE'S OWN TEMPLATE IS PLANTED, with two values that exist
    // nowhere else in this tree and differ from each other: a stamp that
    // read the wrong role's default, or remembered a model from anywhere
    // but this file, cannot produce them.
    const template = path.join(fx.root, RUNTIME_TEMPLATE);
    writeFileSync(
      template,
      readFileSync(template, "utf8")
        .replace(/^(\s+)builder:.*$/m, "$1builder: planted-builder@probe")
        .replace(/^(\s+)verifier:.*$/m, "$1verifier: planted-verifier@probe"),
    );
    const ctx = context({ root: fx.root });
    const plain = dispatchLanePlan(ctx, {
      taskId: FIXTURE_CARD_ID,
      slug: FIXTURE_SLUG,
      scratch: fx.scratch,
    });
    expect(plain.stamp["builder"], "the builder field is not stamped from the template").toBe(
      "planted-builder@probe",
    );
    expect(plain.stamp["verifier"], "the verifier field is not stamped from the template").toBe(
      "planted-verifier@probe",
    );
    const plainOut = render(dispatchLaneRecs(ctx, plain, undefined));
    expect(plainOut, "the lane facts do not print the builder's model").toContain(
      `model (builder): planted-builder@probe — read from ${RUNTIME_TEMPLATE} as roles.builder`,
    );
    expect(plainOut, "nor the verifier's").toContain("model (verifier): planted-verifier@probe");

    const dialled = dispatchLanePlan(ctx, {
      taskId: FIXTURE_CARD_ID,
      slug: FIXTURE_SLUG,
      scratch: fx.scratch,
      executor: "dialled-model@probe",
    });
    expect(dialled.stamp["builder"], "the dial did not reach the stamp").toBe("dialled-model@probe");
    const dialledOut = render(dispatchLaneRecs(ctx, dialled, undefined));
    expect(dialledOut, "an override is not announced as one").toContain("THIS DISPATCH NAMED IT");
    expect(dialledOut, "and the default it departed from is not reported beside it").toContain(
      "the template's default for roles.builder is planted-builder@probe",
    );
    // THE CONTROL: the un-dialled plan says neither of those things, so
    // the two assertions above discriminate rather than being true of
    // every dispatch.
    expect(plainOut, "the control: an un-dialled dispatch announces no override").not.toContain(
      "THIS DISPATCH NAMED IT",
    );
  } finally {
    removeGitFixture(fx.dir, "ritualFixture(seats)");
  }
});

test("A WAIT WITH NO CEILING IS REFUSED, and so is a wait on nothing, on two facts, or on a broadcast pid", () => {
  // KILLED BY: a default ceiling, a wait that accepts neither target or
  // both, and a pid arm that accepts 0 or -1 — the two numbers
  // checkout-currency.mjs measured as answering ALIVE for ever.
  const refusals: Array<[string, Parameters<typeof awaitPlan>[0]]> = [
    ["no ceiling", { marker: "/tmp/t298-probe" }],
    ["no fact", { ceiling: "5" }],
    ["two facts", { marker: "/tmp/t298-probe", pid: "12", ceiling: "5" }],
    ["a ceiling of zero", { marker: "/tmp/t298-probe", ceiling: "0" }],
    ["a ceiling that is not a number", { marker: "/tmp/t298-probe", ceiling: "soon" }],
    ["the process group", { pid: "0", ceiling: "5" }],
    ["the broadcast pid", { pid: "-1", ceiling: "5" }],
  ];
  for (const [what, opts] of refusals) {
    let refused: unknown;
    try {
      awaitPlan(opts);
    } catch (err) {
      refused = err;
    }
    expect(refused, `${what} was planned as a wait instead of refused`).toBeInstanceOf(AwaitFinding);
  }
  // THE POSITIVE CONTROL: a wait naming ONE fact and a ceiling plans, so
  // the refusals above are about what was missing rather than about this
  // function refusing everything.
  const plan = awaitPlan({ marker: "/tmp/t298-probe", ceiling: "2.5" });
  expect(plan.kind, "the control: a marker wait plans").toBe("marker");
  expect(plan.ceilingMs, "the ceiling is carried in milliseconds").toBe(2500);
  expect(awaitPlan({ pid: "4242", ceiling: "1" }).pid, "the control: a pid wait plans").toBe(4242);
});

test("THE CEILING IS REPORTED RATHER THAN HUNG ON, and the report names the wait, the elapsed and the asks", async () => {
  // KILLED BY: a loop with no ceiling, one that returns satisfied when it
  // ran out of time, one that reports no elapsed or no poll count, and
  // one that sleeps past its own ceiling. THE CLOCK IS INJECTED so this
  // body cannot itself hang: a real-time wait would either take its own
  // ceiling to red or assert nothing.
  const clock = { t: 0 };
  const asked: number[] = [];
  const io = {
    now: () => clock.t,
    sleep: async (ms: number) => {
      asked.push(ms);
      clock.t += ms;
    },
    happened: () => false,
  };
  const plan = awaitPlan({ marker: "/tmp/t298-never", ceiling: "1" });
  const result = await runAwait(plan, io);
  expect(result.ceiling, "the wait did not report reaching its ceiling").toBe(true);
  expect(result.satisfied, "a wait that ran out of time reported success").toBe(false);
  expect(result.waitedMs, "it stopped before its ceiling").toBe(plan.ceilingMs);
  expect(result.polls, "it reported asking nothing").toBeGreaterThan(1);
  expect(result.why, "the report does not say the ceiling was reached").toContain("THE CEILING WAS REACHED");
  expect(result.why, "nor name what was waited for").toContain(plan.target);
  expect(result.why, "nor say that nothing was signalled or taken away").toContain("Nothing was signalled");
  // AND IT NEVER SLEPT PAST THE CEILING: the last interval is trimmed, so
  // the report lands AT the ceiling rather than up to one interval after
  // it — which is what makes a stated ceiling a stated ceiling.
  expect(
    asked.reduce((a, b) => a + b, 0),
    "the wait slept past the ceiling it stated",
  ).toBe(plan.ceilingMs);
  for (const ms of asked) expect(ms, "an interval was longer than the wait's own").toBeLessThanOrEqual(plan.intervalMs);
});

test("THE WAIT ENDS ON THE FACT, and it asks BEFORE it sleeps so a fact already true costs no interval", async () => {
  // KILLED BY: a loop that sleeps first, one that keeps waiting after the
  // fact happened, and one that reports the ceiling when it did not reach
  // it.
  const clock = { t: 0 };
  const io = (happensAtPoll: number) => {
    let polls = 0;
    return {
      now: () => clock.t,
      sleep: async (ms: number) => {
        clock.t += ms;
      },
      happened: () => {
        polls += 1;
        return polls >= happensAtPoll;
      },
    };
  };
  const plan = awaitPlan({ marker: "/tmp/t298-soon", ceiling: "10" });
  clock.t = 0;
  const already = await runAwait(plan, io(1));
  expect(already.satisfied, "a fact already true was not seen").toBe(true);
  expect(already.polls, "it asked more than once about a fact already true").toBe(1);
  expect(already.waitedMs, "it slept before asking").toBe(0);
  expect(already.ceiling, "a satisfied wait reported its ceiling").toBe(false);

  clock.t = 0;
  const later = await runAwait(plan, io(3));
  expect(later.satisfied, "a fact that became true was not seen").toBe(true);
  expect(later.polls, "it did not ask until the fact happened").toBe(3);
  expect(later.waitedMs, "it did not wait at all for a fact that took two intervals").toBe(
    2 * plan.intervalMs,
  );
  expect(later.why, "the report of a satisfied wait does not say what happened").toContain("it happened");
});

test("THE TRIAGE STEP STATES THE RIGHT-SIZING RULE, and it is stated THERE and nowhere else in the role file", () => {
  // KILLED BY: the rule dropped from the triage step, the rule moved to a
  // step that is not triage, and a SECOND copy of it elsewhere in the
  // file — which is the failure T-057 names and the reason this body
  // counts rather than merely searches.
  const md = roleText("orchestrator", repoRoot);
  const needle = "THE SMALLEST UNIT THAT CARRIES ITS OWN TEST CYCLE";
  const hits = md.split(needle).length - 1;
  expect(hits, "the right-sizing rule is stated a number of times other than once").toBe(1);
  const triage = numberedStep(md, 2);
  expect(triage, "the rule is not in the triage step").toContain(needle);
  expect(triage, "the rule does not say what happens to a card larger than that").toContain("SPLIT");
  // THE CONTROL: the step this rule is NOT in still exists and does not
  // carry it, so the assertion above places the rule rather than merely
  // finding it somewhere in a long document.
  expect(numberedStep(md, 4), "the control: the dispatch-order step carries no sizing rule").not.toContain(
    needle,
  );
});

test("THE DISPATCH STEP STATES WHERE THE MODEL COMES FROM, and the waiting step states its ceiling", () => {
  // KILLED BY: either rule dropped, either rule stated without its
  // refusal, and a method file that describes the mechanism without
  // naming the file a project edits to change it.
  const md = roleText("orchestrator", repoRoot);
  const dispatch = numberedStep(md, "5b");
  expect(dispatch, "the dispatch step does not name the runtime template").toContain("RUNTIME TEMPLATE");
  expect(dispatch, "nor say the model is never inherited from the dispatching session").toContain(
    "NEVER INHERITED FROM THE SESSION",
  );
  expect(dispatch, "nor say an absent default refuses").toContain("REFUSES THE DISPATCH");
  const waiting = numberedStep(md, "5f");
  expect(waiting, "the waiting step does not say every wait is bounded").toContain("EVERY WAIT IS BOUNDED");
  expect(waiting, "nor name the two facts a wait may wait on").toContain("marker file");
  expect(waiting, "nor say that reaching the ceiling is reported").toContain("REACHING THE CEILING IS AN ANSWER");
  expect(waiting, "nor refuse the hand-typed sleep it replaces").toContain("A HAND-TYPED SLEEP IS NOT A WAIT");
});
