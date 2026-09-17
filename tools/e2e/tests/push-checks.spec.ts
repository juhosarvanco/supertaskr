import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { expect, test } from "@playwright/test";
import {
  EXIT,
  MINIMAL_STATUSES,
  PLACEMENT_FIELDS,
  danglingBlockers,
  placementGaps,
  runChecks,
  staleState,
} from "../scripts/push-checks.mjs";
import { staleStateRecords } from "../scripts/docs-scan.mjs";
import { cardIndex } from "../scripts/dispatch-brief.mjs";
import { repoRoot } from "../preflight";
import { NO_BACKGROUND_MAINTENANCE, removeGitFixture } from "./git-fixture";

/**
 * THE CHEAP CHECKS A PUSH PAYS FOR UNCONDITIONALLY (T-203) — no browser.
 *
 * ── WHAT THIS FILE IS FOR, AND WHAT push-guard.spec.ts IS FOR ────────
 * That file proves a found defect REFUSES A PUSH, end to end, with the
 * remote ref asserted unchanged. This one proves the checks FIND their
 * two measured instances at all, and — the half that matters more —
 * that they do not find one in a board that has none. A checker that
 * reported a finding for every tree would satisfy every refusal body in
 * the other file.
 *
 * ── THE MIRRORED CONSTANTS ARE COMPARED AGAINST THE PARSER ───────────
 * `push-checks.mjs` re-states two of `lib/parser/src/task.ts`'s rules,
 * and the module header says why: the parser is TypeScript needing an
 * install and a build, and a check a ninety-second-old worktree cannot
 * run is a check that gets skipped. What keeps a mirror honest is not the
 * comment — it is a body that reads the ORIGINAL and fails when the two
 * part company, which is what the first two bodies below do.
 *
 * ── EVERY FIXTURE TERMINATES IN A mkdtemp ROOT ───────────────────────
 * docs/CONVENTIONS.md's lifted-guard rule. Nothing here writes into this
 * repository, and the two bodies that read the LIVE tree only read it.
 */

const SCRATCH: string[] = [];

test.afterAll(() => {
  for (const dir of SCRATCH) removeGitFixture(dir, "push-checks");
});

/** `lib/parser/src/task.ts` — the file that owns the rules mirrored here. */
function parserTaskSource(): string {
  return readFileSync(path.join(repoRoot, "lib/parser/src/task.ts"), "utf8");
}

/**
 * A scratch board. `cards` are written verbatim under docs/tasks/, and
 * the commit DATES are explicit — git's committer timestamps have
 * one-second granularity and `staleStateRecords` passes a tie, so a
 * fixture that let two commits share a second would silently fail to
 * build its own defect.
 */
function board(
  name: string,
  cards: Record<string, string>,
  opts: { record?: boolean } = {},
): string {
  const root = mkdtempSync(path.join(os.tmpdir(), `T-203-checks-${name}-`));
  SCRATCH.push(root);
  let minute = 0;
  const git = (...args: string[]): void => {
    minute += 1;
    const at = `2026-09-01T00:${String(minute).padStart(2, "0")}:00Z`;
    execFileSync("git", ["-C", root, ...NO_BACKGROUND_MAINTENANCE, ...args], {
      stdio: "pipe",
      env: { ...process.env, GIT_AUTHOR_DATE: at, GIT_COMMITTER_DATE: at },
    });
  };
  execFileSync("git", ["init", "-q", "-b", "main", root], { stdio: "pipe" });
  git("config", "user.email", "fixture@example.invalid");
  git("config", "user.name", "T-203 fixture");
  mkdirSync(path.join(root, "docs/tasks"), { recursive: true });
  mkdirSync(path.join(root, "docs/checkpoints"), { recursive: true });
  for (const [file, content] of Object.entries(cards)) {
    writeFileSync(path.join(root, "docs/tasks", file), content);
  }
  writeFileSync(path.join(root, "docs/STATE.md"), "# State\n");
  git("add", "-A");
  git("commit", "-qm", "the board");
  if (opts.record === true) {
    writeFileSync(path.join(root, "docs/checkpoints/2026-09-01-record.md"), "# Record\n");
    git("add", "-A");
    git("commit", "-qm", "a record, and STATE not regenerated beside it");
  }
  return root;
}

/** A card that satisfies every rule these checks know. */
function wellFormedCard(id: string, extra: Record<string, string> = {}): string {
  const fields: Record<string, string> = {
    id,
    title: `card ${id}`,
    feature: "F-01",
    milestone: "1",
    priority: "1",
    size: "S",
    status: "planned",
    blocked_by: "[]",
    touches: "[tools/e2e]",
    ...extra,
  };
  return `---\n${Object.entries(fields)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n")}\n---\n\nbody\n`;
}

/* ───────────── the mirrored rules, against the parser ────────────── */

test("the statuses these checks treat as minimal are the ones lib/parser/src/task.ts calls minimal", () => {
  // The parser's own line, read rather than remembered:
  //   const isMinimal = status === 'suggested' || status === 'parked';
  const source = parserTaskSource();
  const line = /const isMinimal\s*=\s*(.+);/.exec(source);
  expect(line, "task.ts no longer declares isMinimal — the mirror has lost its original").not.toBeNull();
  const named = [...(line?.[1] ?? "").matchAll(/'([a-z]+)'/g)].map((m) => m[1]).sort();
  expect(named).toEqual([...MINIMAL_STATUSES].sort());
});

test("the placement fields these checks require are the ones the parser requires of a non-minimal card", () => {
  // `task.ts`'s own sentence: "suggestions are minimal files (no
  // id/feature/milestone/priority/size required …)". `id` is deliberately
  // absent from PLACEMENT_FIELDS — it is required of everything but a
  // SUGGESTED card, which is a different predicate.
  const source = parserTaskSource();
  const sentence = /no ([a-z/]+) required, suggested_by/.exec(source);
  expect(sentence, "task.ts no longer states which fields a suggestion may omit").not.toBeNull();
  const named = (sentence?.[1] ?? "").split("/");
  expect(named).toContain("id");
  expect(named.filter((f) => f !== "id").sort()).toEqual([...PLACEMENT_FIELDS].sort());
});

/* ───────────── instance one: an unresolvable blocked_by ──────────── */

test("a blocked_by naming no live card is FOUND, and one naming a live card is not", () => {
  const bad = board("blocker-bad", {
    "T-901-a.md": wellFormedCard("T-901", { blocked_by: "[T-999]" }),
    "T-902-b.md": wellFormedCard("T-902"),
  });
  const found = danglingBlockers(cardIndex(bad));
  expect(found.map((f) => f.kind)).toEqual(["dangling-blocker"]);
  expect(found[0]?.message).toContain("T-999");

  // THE POSITIVE CONTROL, and it is the same board with the blocker
  // RETARGETED at a card that exists. Without it the assertion above is
  // satisfied by a check that reports every `blocked_by` it sees.
  const good = board("blocker-good", {
    "T-901-a.md": wellFormedCard("T-901", { blocked_by: "[T-902]" }),
    "T-902-b.md": wellFormedCard("T-902"),
  });
  expect(danglingBlockers(cardIndex(good))).toEqual([]);
});

test("a card stamped out of suggested without its four placement fields is FOUND; a suggestion is not", () => {
  const stamped = board("placement", {
    // The measured instance: the status moved and the fields did not.
    "T-901-a.md": "---\nid: T-901\ntitle: stamped out of suggested\nstatus: planned\n---\n\nbody\n",
    // A suggestion missing the very same fields is LEGAL, which is the
    // control that makes the finding above a discrimination.
    "T-902-b.md": "---\ntitle: still a suggestion\nstatus: suggested\nsuggested_by: someone\n---\n\nbody\n",
    // And so is a parked backbone-level note.
    "T-903-c.md": "---\nid: T-903\ntitle: parked\nstatus: parked\n---\n\nbody\n",
  });
  const found = placementGaps(cardIndex(stamped));
  expect(found.map((f) => f.file)).toEqual(["docs/tasks/T-901-a.md"]);
  for (const field of PLACEMENT_FIELDS) expect(found[0]?.message).toContain(field);
});

/* ───────────── instance two: a record newer than STATE ───────────── */

test("a checkpoint record committed after STATE is FOUND, and the same commit as STATE is not", () => {
  const late = board("record-late", { "T-901-a.md": wellFormedCard("T-901") }, { record: true });
  const found = staleState(late);
  expect(found.map((f) => f.kind)).toEqual(["state-stale"]);
  expect(found[0]?.message).toContain("2026-09-01-record.md");

  // THE CONTROL, AND IT IS THE CORRECT RITUAL RATHER THAN THE ABSENCE OF
  // A RECORD: the record and the regenerated STATE in ONE commit tie, and
  // a tie passes. A control that simply had no record would also pass a
  // check that flagged every record ever written.
  const together = board("record-together", { "T-901-a.md": wellFormedCard("T-901") });
  writeFileSync(path.join(together, "docs/checkpoints/2026-09-01-record.md"), "# Record\n");
  writeFileSync(path.join(together, "docs/STATE.md"), "# State, regenerated\n");
  execFileSync("git", ["-C", together, ...NO_BACKGROUND_MAINTENANCE, "add", "-A"], { stdio: "pipe" });
  execFileSync(
    "git",
    ["-C", together, ...NO_BACKGROUND_MAINTENANCE, "commit", "-qm", "Checkpoint: record and STATE"],
    { stdio: "pipe", env: { ...process.env, GIT_AUTHOR_DATE: "2026-09-01T01:00:00Z", GIT_COMMITTER_DATE: "2026-09-01T01:00:00Z" } },
  );
  expect(staleStateRecords(together), "record and STATE in one commit must tie and pass").toEqual([]);
});

test("the docs gate and the push checks ask ONE implementation, so they cannot disagree about the tie", () => {
  // T-057. `staleStateRecords` moved into docs-scan.mjs at this card, and
  // this body is what makes "one implementation" checkable rather than
  // asserted: the finding the push checks report is derived from the same
  // function the docs gate calls, over the same tree.
  const late = board("one-impl", { "T-901-a.md": wellFormedCard("T-901") }, { record: true });
  expect(staleState(late).length).toBe(staleStateRecords(late).length);
  const gate = readFileSync(path.join(repoRoot, "tools/e2e/scripts/docs-gate.mjs"), "utf8");
  expect(gate, "docs-gate must call the shared derivation, not carry its own").toContain(
    "staleStateRecords(root)",
  );
});

/* ──────── the amendment, and the slip it must still catch (T-143-s5) ──────── */

/**
 * A history whose commits are made ONE PER CALL with an explicit,
 * strictly increasing committer date, so an ARRANGEMENT can be built out
 * of the ORDER of commits rather than out of wall-clock luck. The dates
 * are load-bearing for the same reason `board` above states: git's
 * timestamps have one-second granularity and `staleStateRecords` passes a
 * tie by design, so two commits sharing a second would silently collapse
 * the arrangement this fixture exists to build.
 *
 * `commit` writes its files and commits them; `edit` writes and does NOT
 * commit, which is what lets a body ask whether the reading is committed
 * history or the working tree.
 */
function history(name: string): {
  root: string;
  commit: (message: string, writes: Record<string, string>) => void;
  edit: (rel: string, content: string) => void;
} {
  const root = mkdtempSync(path.join(os.tmpdir(), `T-143-s5-${name}-`));
  SCRATCH.push(root);
  let minute = 0;
  const git = (...args: string[]): void => {
    minute += 1;
    const at = `2026-09-01T00:${String(minute).padStart(2, "0")}:00Z`;
    execFileSync("git", ["-C", root, ...NO_BACKGROUND_MAINTENANCE, ...args], {
      stdio: "pipe",
      env: { ...process.env, GIT_AUTHOR_DATE: at, GIT_COMMITTER_DATE: at },
    });
  };
  execFileSync("git", ["init", "-q", "-b", "main", root], { stdio: "pipe" });
  git("config", "user.email", "fixture@example.invalid");
  git("config", "user.name", "T-203 fixture");
  const edit = (rel: string, content: string): void => {
    const dest = path.join(root, rel);
    mkdirSync(path.dirname(dest), { recursive: true });
    writeFileSync(dest, content);
  };
  const commit = (message: string, writes: Record<string, string>): void => {
    // STAGED BY NAME, NEVER `add -A`. A body below leaves a REGENERATED
    // `docs/STATE.md` in the working tree and then commits the record
    // alone; `-A` would sweep that edit into the same commit, turning the
    // slip it is building into the correct ritual and passing over
    // nothing. Measured: the body went green against an empty list.
    for (const [rel, content] of Object.entries(writes)) edit(rel, content);
    git("add", "--", ...Object.keys(writes));
    git("commit", "-qm", message);
  };
  commit("the board", {
    "docs/STATE.md": "# State\n",
    "docs/tasks/T-901-a.md": wellFormedCard("T-901"),
  });
  return { root, commit, edit };
}

/** The record every arrangement below is built around, and its append. */
const RECORD = "docs/checkpoints/2026-09-01-record.md";
const WRITTEN = "# Record\n";
const APPENDED = "# Record\n\nand a re-run battery line, appended four minutes later\n";

test("an APPEND to a record checkpointed WITH its STATE regeneration is not a stale finding", () => {
  // THE MEASURED INSTANCE, REBUILT. `f90edfd` did the ritual correctly —
  // record and regenerated STATE in ONE commit — and `8e659b1` appended
  // eight lines to that record alone four minutes later. Read against the
  // record's LATEST TOUCH that append moved the record past STATE and the
  // gate reported a ritual slip that had not happened; read against the
  // CREATING commit it is neither step.
  const amended = history("amended");
  amended.commit("Checkpoint: the record and the regenerated STATE, together", {
    [RECORD]: WRITTEN,
    "docs/STATE.md": "# State, regenerated\n",
  });
  amended.commit("append a re-run battery line to the record", { [RECORD]: APPENDED });
  expect(
    staleStateRecords(amended.root),
    "the record was CREATED with its STATE regeneration; a later append is neither step",
  ).toEqual([]);
  expect(staleState(amended.root), "and the push checks report what the derivation found").toEqual([]);

  // THE CONTROL, AND IT IS THE SAME APPEND WITH THE ARRANGEMENT REMOVED.
  // Identical shape — a record, then a commit touching that record alone —
  // and the ONE thing that differs is whether the CREATING commit carried
  // STATE. Without this the body above is satisfied by a derivation that
  // skips any record with more than one commit, by one that stopped
  // looking at records altogether, and by one that returns the empty list.
  const slipped = history("slipped-then-amended");
  slipped.commit("a record, and STATE not regenerated beside it", { [RECORD]: WRITTEN });
  slipped.commit("append a re-run battery line to the record", { [RECORD]: APPENDED });
  expect(
    staleStateRecords(slipped.root),
    "a record CREATED without its STATE regeneration is still step 1 without step 2, appended to or not",
  ).toEqual(["2026-09-01-record.md"]);
  const found = staleState(slipped.root);
  expect(found.map((f) => f.kind)).toEqual(["state-stale"]);
  expect(found[0]?.message, "and it reds BY NAME").toContain("2026-09-01-record.md");
});

test("an amended record passing does not quiet a NEW record that arrived without its STATE regeneration", () => {
  // ONE TREE, TWO RECORDS, TWO ANSWERS — which is the safeguard the card
  // that ruled this change spent its argument on. The derivation could
  // satisfy the body above by going quiet; here the quiet answer and the
  // loud one are asked of the SAME checkout, so a derivation that has
  // stopped firing cannot produce this pair.
  const mixed = history("mixed");
  mixed.commit("Checkpoint: the first record and the regenerated STATE, together", {
    "docs/checkpoints/2026-09-01-first.md": WRITTEN,
    "docs/STATE.md": "# State, regenerated\n",
  });
  mixed.commit("append a re-run battery line to the first record", {
    "docs/checkpoints/2026-09-01-first.md": APPENDED,
  });
  mixed.commit("a second record, and STATE not regenerated beside it", {
    "docs/checkpoints/2026-09-02-second.md": WRITTEN,
  });
  expect(staleStateRecords(mixed.root)).toEqual(["2026-09-02-second.md"]);
  expect(staleState(mixed.root)[0]?.message).toContain("2026-09-02-second.md");
});

test("the reading is COMMITTED HISTORY, and an uncommitted STATE does not repair a committed slip", () => {
  // UNCHANGED BY THIS CARD, AND ASSERTED BECAUSE IT WAS EASY TO CHANGE.
  // Moving the comparison from the record's latest touch to its creating
  // commit is a change of WHICH commit is read, never of whether a commit
  // is what is read at all: a mid-ritual working tree — record written,
  // STATE regenerated, nothing staged — must still never false-red.
  const mid = history("mid-ritual");
  mid.edit(RECORD, WRITTEN);
  mid.edit("docs/STATE.md", "# State, regenerated\n");
  expect(
    staleStateRecords(mid.root),
    "a mid-ritual working tree has no commits to compare and must never red",
  ).toEqual([]);

  // THE CONTROL FOR THAT NEGATIVE, in two halves, each removing one half
  // of the arrangement. Commit the record ALONE and the finding appears —
  // so the silence above was the absence of a commit, not a derivation
  // that cannot see this fixture at all.
  mid.commit("a record, and STATE not regenerated beside it", { [RECORD]: WRITTEN });
  expect(staleStateRecords(mid.root)).toEqual(["2026-09-01-record.md"]);
  // And regenerating STATE in the WORKING TREE does not repair it: only a
  // commit does, which is exactly why this is asked at the push.
  mid.edit("docs/STATE.md", "# State, regenerated after the fact\n");
  expect(
    staleStateRecords(mid.root),
    "an uncommitted STATE repaired a committed slip — the reading has left committed history",
  ).toEqual(["2026-09-01-record.md"]);
});

/* ───────────── the CLI, and its four codes ───────────────────────── */

/** Run the real script the push guard spawns. */
function cli(root: string, extra: string[] = []): { status: number | null; out: string } {
  const r = spawnSync(
    process.execPath,
    [path.join(repoRoot, "tools/e2e/scripts/push-checks.mjs"), "--root", root, ...extra],
    { encoding: "utf8" },
  );
  return { status: r.status, out: `${String(r.stdout ?? "")}${String(r.stderr ?? "")}` };
}

test("the CLI exits FOUND on a defective board and CLEAN on a coherent one", () => {
  const bad = board("cli-bad", { "T-901-a.md": wellFormedCard("T-901", { blocked_by: "[T-999]" }) });
  const badRun = cli(bad);
  expect(badRun.status).toBe(EXIT.FOUND);
  expect(badRun.out).toContain("dangling-blocker");

  const good = board("cli-good", { "T-901-a.md": wellFormedCard("T-901") });
  const goodRun = cli(good);
  expect(goodRun.status, goodRun.out).toBe(EXIT.CLEAN);
  expect(goodRun.out).toContain("clean");
});

test("a --root that is not a directory is CALLED WRONG, never a clean board", () => {
  // The docs gate's own doctrine: a run that could not read its question
  // is not a claim about the tree. Answering 0 here would report "nothing
  // found" about a tree nobody looked at.
  const run = cli(path.join(os.tmpdir(), "T-203-no-such-checkout-15203"));
  expect(run.status).toBe(EXIT.USAGE);
  expect(run.out).toContain("is not a directory");
});

test("an unknown argument is CALLED WRONG rather than silently ignored", () => {
  const good = board("cli-flag", { "T-901-a.md": wellFormedCard("T-901") });
  const run = cli(good, ["--all-of-them"]);
  expect(run.status).toBe(EXIT.USAGE);
  expect(run.out).toContain("unknown argument");
});

test("a checkout that is not a git repository at all cannot run the checks, and says so", () => {
  // Exit 3 is an INABILITY and never a finding. Collapsing it into 1
  // would refuse every push made where the board cannot be read, which is
  // the failure `index --check`'s four codes exist to prevent.
  const bare = mkdtempSync(path.join(os.tmpdir(), "T-203-not-a-repo-"));
  SCRATCH.push(bare);
  const run = cli(bare);
  expect(run.status).toBe(EXIT.CANNOT_RUN);
  expect(run.out).toContain("THE CHECKS COULD NOT RUN");
  expect(run.out).toContain("not a claim about the tree");
});

/* ───────────── the live tree ─────────────────────────────────────── */

test("this repository's own board passes every cheap check, over a board proved non-empty first", () => {
  // NOT A TAUTOLOGY, because every body above proves the checks can fail.
  // This is the one that would red if a lane pushed a dangling blocker or
  // an unregenerated STATE into the tree — the same claim the guard makes
  // at a push.
  //
  // THE CORPUS IS COUNTED BEFORE IT IS JUDGED, which is this repository's
  // instance 5 ("a comparison over an empty corpus reports agreement and
  // measures nothing"). A `runChecks` that walked zero cards would return
  // zero findings and read exactly like a clean board. These two reads
  // are also what LINK this file into the docs gate's reader derivation:
  // the checks really do read docs/tasks and docs/checkpoints off the
  // live tree, so a change there really does owe this suite.
  const cards = readdirSync(path.join(repoRoot, "docs/tasks")).filter(
    (f) => f.startsWith("T-") && f.endsWith(".md"),
  );
  expect(cards.length, "the live board is empty, so the judgement below is vacuous").toBeGreaterThan(
    20,
  );
  const records = readdirSync(path.join(repoRoot, "docs/checkpoints")).filter((f) =>
    f.endsWith(".md"),
  );
  expect(records.length, "no checkpoint record, so the STATE half is vacuous").toBeGreaterThan(0);

  expect(runChecks(repoRoot).map((f) => f.message)).toEqual([]);
});
