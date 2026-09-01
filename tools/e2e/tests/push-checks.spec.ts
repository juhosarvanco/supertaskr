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
  execFileSync("git", ["init", "-q", root], { stdio: "pipe" });
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
    "staleStateRecords(repoRoot)",
  );
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
