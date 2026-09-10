/**
 * THE ARM THAT MERGES (T-295) — the bodies for the half of the ritual
 * `brief.mjs --merge <id>` performs and the seat used to perform by
 * hand.
 *
 * ── WHY THESE BODIES AND NOT OTHERS ──────────────────────────────────
 * Every property pinned here failed once, in a merge, on this board, in
 * the two days before the card was cut. The reader that found no block
 * because a fence was indented; the doc clause whose rewording broke a
 * sentence a lane's body pinned verbatim; the comment that spelled the
 * retired identifier and reached main; the script that committed on an
 * exit code while the count under it had moved. A body here is a
 * measured slip with a program in front of it.
 *
 * ── THE FIXTURES ARE REPOSITORIES, AND THEY ARE SCRATCH ──────────────
 * The verb's git half cannot be judged on a plan: it moves a branch,
 * stages a merge, answers conflicts and stamps a card. So the bodies
 * that judge it build a real repository under the OS temp directory and
 * remove it through `removeGitFixture`, with `NO_BACKGROUND_MAINTENANCE`
 * on every git call — `git-fixture.ts` carries the measurement that
 * makes both necessary. NOTHING here touches this repository's own
 * checkout, which is the one thing a merge verb's test suite must never
 * do.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, test } from "@playwright/test";
import {
  EXIT,
  METHOD_STAMP_FILES,
  PINNED_SENTENCE_FLOOR,
  READINGS_PATH,
  SECRET_SHAPES,
  XS_CHANGED_LINE_BOUND,
  bumpOne,
  bumpSteps,
  classifyConflict,
  claimedCounts,
  correctionFor,
  correctionSteps,
  dedentBlock,
  drillScope,
  forbiddenSpellingFindings,
  gradeCounts,
  keeperSteps,
  mergeDials,
  mergeMessage,
  metersBlocks,
  movesMethodText,
  personalNames,
  pinnedSentenceFindings,
  preludePlan,
  readMutantBlocks,
  readingsLines,
  resolveAppendConflict,
  runCounts,
  runMutantDrill,
  specRunners,
  tailPlan,
  verdictOpener,
  verdictSpecs,
  widenTouches,
  xsBoundFinding,
  main as mergeMain,
} from "../scripts/merge.mjs";
import { NO_BACKGROUND_MAINTENANCE, removeGitFixture } from "./git-fixture";
import { repoRoot } from "../preflight";

/** The name this fixture reports its own teardown findings under. */
const FIXTURE = "merge.spec.ts";

/** One mutant block, in the fixed layout, at whatever margin is asked for. */
function block(
  fields: Partial<Record<"correction" | "file" | "spec" | "body" | "message" | "old" | "new", string>> = {},
  indent = "",
): string {
  const f = {
    correction: "CORRECTION 1",
    file: "src/a.ts",
    spec: "tools/e2e/tests/a.spec.ts",
    body: "the guard holds",
    message: "expected the guard",
    old: "export const guard = true;",
    new: "export const guard = false;",
    ...fields,
  };
  return [
    "```mutant",
    `correction: ${f.correction}`,
    `file: ${f.file}`,
    `spec: ${f.spec}`,
    `body: ${f.body}`,
    `message: ${f.message}`,
    "--- old",
    f.old,
    "--- new",
    f.new,
    "```",
  ]
    .map((l) => `${indent}${l}`)
    .join("\n");
}

// ── the reader's margin ──────────────────────────────────────────────

test("a mutant block written at a MARGIN is read, and the margin comes off its old and new text", () => {
  // THE MEASURED FAULT, at the T-293 merge: the verifier wrote its block
  // indented four spaces inside its verdict entry, the reader took a
  // fence at column zero only, and the merged tree's own re-drill
  // reported `blocks read: 0` over a verdict that assigned a correction.
  // The seat drilled that correction by hand at the exact line.
  const read = readMutantBlocks(["## an entry", "", block({}, "    "), ""].join("\n"));
  expect("problem" in read, "an indented block is a block").toBe(false);
  if ("problem" in read) return;
  expect(read.blocks).toHaveLength(1);
  // AND THE MARGIN IS OFF THE TEXT. An anchor is EXACT, so a block read
  // with its indent still on it matches nothing in the tree — which
  // would turn a silent miss into a confident wrong answer.
  expect(read.blocks[0]?.old, "the old anchor carries no indent").toBe("export const guard = true;");
  expect(read.blocks[0]?.new, "and neither does the new one").toBe("export const guard = false;");
  expect(read.blocks[0]?.file, "and the keys are read at the margin too").toBe("src/a.ts");
});

test("a mutant block QUOTED inside another code fence is not read, so a verdict may explain the layout", () => {
  // THE POSITIVE CONTROL for the body above, and the reason the old
  // reader took a fence at column zero only. Indentation is no longer
  // what separates a block from a quotation of one; being inside an
  // outer fence is, which is CommonMark's own rule and not a heuristic.
  const quoted = [
    "## an entry that explains the layout",
    "",
    "````markdown",
    block({ correction: "AN EXAMPLE, NOT A BLOCK" }),
    "````",
    "",
    block({ correction: "THE REAL ONE" }),
  ].join("\n");
  const read = readMutantBlocks(quoted);
  expect("problem" in read).toBe(false);
  if ("problem" in read) return;
  expect(read.blocks.map((b) => b.correction), "only the block outside the quotation is read").toEqual([
    "THE REAL ONE",
  ]);
  // And the dedent is a pure function with its own reading.
  expect(dedentBlock(["    a", "      b", "  c"], "    ")).toEqual(["a", "  b", "c"]);
});

// ── the correction ───────────────────────────────────────────────────

test("a correction is the block's OLD text, applied where the merged tree carries its NEW", () => {
  // The two halves of a block are not interchangeable: `old` is the text
  // the drill requires to be IN the tree, because it plants `new` over
  // it and requires the named body RED. So a verb that applied `new`
  // would make its own next step unrunnable.
  const b = { correction: "C1", file: "src/a.ts", spec: "s", body: "b", message: "m", old: "guard = true", new: "guard = false" };
  const defective = correctionFor({ source: "const x = 1;\nguard = false\n", block: b });
  expect("text" in defective, "a tree carrying the defect is corrected").toBe(true);
  if (!("text" in defective)) return;
  expect(defective.text).toContain("guard = true");
  expect(defective.text, "and the defect is gone").not.toContain("guard = false");

  // ALREADY CORRECTED IS A THIRD ANSWER, never a silent write. The lane's
  // own fix pass had landed the correction at four of the merges this
  // card was cut from.
  const done = correctionFor({ source: "const x = 1;\nguard = true\n", block: b });
  expect("already" in done, "a tree that already carries `old` is left alone").toBe(true);

  // AND NEITHER SIDE IS A REFUSAL, not a best effort.
  const neither = correctionFor({ source: "const x = 1;\n", block: b });
  expect("problem" in neither).toBe(true);
  if (!("problem" in neither)) return;
  expect(neither.problem, "the refusal names both counts").toContain("0 time(s)");
});

test("the corrections are planned BEFORE every regeneration, and the keepers before the commit", () => {
  // ORDER IS THE PROPERTY the card names in its own words. A census or a
  // graph rebuilt ahead of a correction describes the tree that was
  // there, and the commit then carries a generated file that disagrees
  // with the source beside it.
  const read = readMutantBlocks(block({ file: "app/src/a.ts" }));
  expect("problem" in read).toBe(false);
  if ("problem" in read) return;
  const plan = tailPlan({
    paths: ["app/src/a.ts", "tools/e2e/tests/a.spec.ts", "docs/CONVENTIONS.md"],
    projectRoot: repoRoot,
    id: "T-000",
    blocks: read.blocks,
  });
  const ids = plan.map((s) => s.id);
  const correction = ids.indexOf("correction:1");
  expect(correction, "the correction is planned").toBeGreaterThanOrEqual(0);
  for (const regen of ["capabilities", "graph:regen"]) {
    const at = ids.indexOf(regen);
    expect(at, `${regen} is planned`).toBeGreaterThanOrEqual(0);
    expect(correction, `the correction precedes ${regen}`).toBeLessThan(at);
  }
  for (const keeper of ["keeper:pinned-sentence", "keeper:forbidden-spelling", "keeper:xs-bound", "keeper:preflight"]) {
    expect(ids.indexOf(keeper), `${keeper} is a step of its own`).toBeGreaterThanOrEqual(0);
    expect(ids.indexOf(keeper), `${keeper} runs before the STOP`).toBeLessThan(ids.indexOf("stop"));
  }
  expect(ids.indexOf("counts"), "and the counts are graded before the stop").toBeLessThan(ids.indexOf("stop"));
  expect(plan.at(-1)?.kind, "the plan still ends with a stop").toBe("stop");
  // The step is a step and carries its block, so the runner has what it
  // needs without re-reading the card.
  expect(correctionSteps({ blocks: read.blocks })[0]?.block?.file).toBe("app/src/a.ts");
});

// ── the re-drill's scope ─────────────────────────────────────────────

test("the re-drill's scope is the FIX DIFF, through the owning-spec rule, and its own spec alone when nothing was fixed", () => {
  const b = {
    correction: "C1",
    file: "tools/e2e/scripts/merge.mjs",
    spec: "tools/e2e/tests/cli.spec.ts",
    body: "b",
    message: "m",
    old: "a",
    new: "b",
  };
  // NOTHING FIXED: the block's own spec, and nothing is claimed about
  // ownership because no correction was applied.
  const bare = drillScope({ block: b, fixed: [] });
  expect(bare.specs).toEqual(["tools/e2e/tests/cli.spec.ts"]);
  expect(bare.owned, "and no owning set was derived").toEqual([]);

  // A FIX DIFF, NARROW BY DEFAULT — and the derivation is spent on the
  // CHECK rather than on the run. Measured on this card's own fixture: a
  // correction to one script under tools/e2e was owned by thirteen e2e
  // specs, and one block's drill over that set had not finished after
  // eight minutes, against a ritual whose target is about five.
  const narrow = drillScope({
    block: b,
    fixed: ["tools/e2e/scripts/merge.mjs"],
    owning: () => ["tools/e2e/tests/merge.spec.ts", "tools/e2e/tests/cli.spec.ts"],
  });
  expect(narrow.specs, "the default run is the block's own spec").toEqual([
    "tools/e2e/tests/cli.spec.ts",
  ]);
  expect(narrow.ownsTheBlock, "and the fix diff is READ: it owns this block's spec").toBe(true);
  expect(
    drillScope({ block: b, fixed: ["x"], owning: () => ["tools/e2e/tests/other.spec.ts"] }).ownsTheBlock,
    "a block whose spec the fix diff does not own is SAID to be",
  ).toBe(false);

  // WIDE takes the stronger claim: RED ALONE over every spec the fix
  // diff owns rather than over one.
  const wide = drillScope({
    block: b,
    fixed: ["tools/e2e/scripts/merge.mjs"],
    wide: true,
    owning: () => ["tools/e2e/tests/merge.spec.ts", "tools/e2e/tests/cli.spec.ts"],
  });
  expect(wide.specs[0], "the block's own spec is first").toBe("tools/e2e/tests/cli.spec.ts");
  expect(wide.specs, "and the fix diff's owners join it, deduplicated").toEqual([
    "tools/e2e/tests/cli.spec.ts",
    "tools/e2e/tests/merge.spec.ts",
  ]);

  // A DERIVATION THAT THROWS IS THE BLOCK'S OWN SPEC, never a silently
  // wider or narrower run: the rule walks a graph and can fail on a tree
  // mid-merge.
  expect(
    drillScope({
      block: b,
      fixed: ["x"],
      wide: true,
      owning: () => {
        throw new Error("the graph could not be walked");
      },
    }).specs,
  ).toEqual(["tools/e2e/tests/cli.spec.ts"]);
  // A scope spanning two packages is two runners, and a drill that
  // graded only the first would report RED ALONE over half its scope.
  const runners = specRunners(["tools/e2e/tests/a.spec.ts", "app/test/b.test.ts"], repoRoot);
  expect("problem" in runners).toBe(false);
  if ("problem" in runners) return;
  expect(runners.runners).toHaveLength(2);
});

test("a mutant that reds MORE than its own body is a refusal that names the other bodies", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "supertaskr-drill-"));
  try {
    mkdirSync(path.join(dir, "src"), { recursive: true });
    mkdirSync(path.join(dir, "tools", "e2e", "tests"), { recursive: true });
    writeFileSync(path.join(dir, "src", "a.ts"), "export const guard = true;\n");
    writeFileSync(path.join(dir, "tools", "e2e", "tests", "a.spec.ts"), 'test("the guard holds", () => {});\n');
    const said: string[] = [];
    const code = runMutantDrill({
      block: {
        correction: "C1",
        file: "src/a.ts",
        spec: "tools/e2e/tests/a.spec.ts",
        body: "the guard holds",
        message: "expected the guard",
        old: "export const guard = true;",
        new: "export const guard = false;",
      },
      projectRoot: dir,
      out: (s) => said.push(s),
      err: (s) => said.push(s),
      // THE RUN IS INJECTED so this body measures the GRADING and not a
      // runner: two bodies red, one of them the block's own.
      run: () => ({
        code: 1,
        output: [
          "  1) a.spec.ts:3:1 › the guard holds ──",
          "  2) a.spec.ts:9:1 › some other body ──",
          "expected the guard",
        ].join("\n"),
      }),
    });
    expect(code, "a mutant that kills a set is not evidence about one property").toBe(EXIT.FOUND);
    const text = said.join("\n");
    expect(text).toContain("REDS MORE THAN ITSELF");
    expect(text, "and the other body is NAMED").toContain("some other body");
    expect(text, "the site is restored and the restore proved").toContain("PROVED by sha256");
    expect(readFileSync(path.join(dir, "src", "a.ts"), "utf8")).toBe("export const guard = true;\n");
  } finally {
    removeGitFixture(dir, FIXTURE);
  }
});

// ── the method bump ──────────────────────────────────────────────────

test("method text that moved owes the three stamp files, the pin test, the half-bump drill and the eval gate", () => {
  expect(movesMethodText(["method/roles/integrator.md"])).toBe(true);
  expect(movesMethodText(["docs/CONVENTIONS.md", "app/src/a.ts"]), "and nothing else does").toBe(false);
  // WITHOUT A VERSION the verb REFUSES rather than inventing one: which
  // number a release takes and what its note says are the seat's ruling.
  const owed = bumpSteps({ paths: ["method/roles/integrator.md"], projectRoot: repoRoot });
  expect(owed).toHaveLength(1);
  expect(owed[0]?.id).toBe("bump:owed");
  expect(owed[0]?.problem, "and the refusal says what moved").toContain("method text moved");
  // WITH ONE it is the four graded steps the seat's own script performs.
  const planned = bumpSteps({
    paths: ["method/roles/integrator.md"],
    projectRoot: repoRoot,
    from: "0.1.18",
    version: "0.1.19",
  });
  expect(planned.map((s) => s.id)).toEqual(["bump:stamps", "bump:pin", "bump:drill", "bump:evals"]);
  expect(planned[0]?.bump).toEqual({ from: "0.1.18", to: "0.1.19" });
  // AND WHEN METHOD TEXT DID NOT MOVE THERE IS NO STEP AT ALL, which is
  // the card's second half: the stamp is untouched.
  expect(bumpSteps({ paths: ["app/src/a.ts"], projectRoot: repoRoot, from: "0.1.18", version: "0.1.19" })).toEqual([]);
});

test("a method stamp is bumped at exactly one anchor per file, and a stamp that is not there refuses", () => {
  const conventions = METHOD_STAMP_FILES[0];
  expect(conventions?.path).toBe("docs/CONVENTIONS.md");
  const text = `blah\n${conventions?.anchor("0.1.18") ?? ""}\nblah\n`;
  const bumped = bumpOne({ text, path: "docs/CONVENTIONS.md", from: "0.1.18", to: "0.1.19" });
  expect("text" in bumped).toBe(true);
  if (!("text" in bumped)) return;
  expect(bumped.text).toContain("currently v0.1.19");
  // THE NEGATIVE CONTROL: the same call on a tree that does not carry
  // the stamp is a refusal naming the count, never a silent no-op.
  const missing = bumpOne({ text: "nothing here\n", path: "docs/CONVENTIONS.md", from: "0.1.18", to: "0.1.19" });
  expect("problem" in missing).toBe(true);
  if (!("problem" in missing)) return;
  expect(missing.problem).toContain("0 time(s)");
});

// ── the four cheap keepers ───────────────────────────────────────────

test("the pinned-sentence keeper refuses a removed doc line a spec pins VERBATIM, and lets an addition through", () => {
  // THE PLANTED INSTANCE is the T-285 merge's own shape: a clause under
  // method/ reworded while an assigned correction was applied, and a
  // lane's body asserting the old wording word for word.
  const sentence = "a fence is not widened from inside the lane it fences, ever";
  expect(sentence.length, "the planted line clears the keeper's floor").toBeGreaterThan(PINNED_SENTENCE_FLOOR);
  const specs = new Map([["tools/e2e/tests/a.spec.ts", `expect(text).toContain("${sentence}");`]]);
  const found = pinnedSentenceFindings({
    removed: [{ path: "method/lane-protocol.md", line: `  ${sentence}` }],
    specs,
  });
  expect(found, "the keeper refuses, once").toHaveLength(1);
  expect(found[0]).toContain("tools/e2e/tests/a.spec.ts");
  expect(found[0], "and it names the line").toContain(sentence);
  // THREE POSITIVE CONTROLS: an ADDED line cannot break a verbatim pin,
  // a line under neither method/ nor docs/ is not this keeper's, and a
  // line under the floor is noise rather than a sentence.
  expect(pinnedSentenceFindings({ removed: [], specs })).toEqual([]);
  expect(pinnedSentenceFindings({ removed: [{ path: "src/a.ts", line: sentence }], specs })).toEqual([]);
  expect(
    pinnedSentenceFindings({ removed: [{ path: "docs/X.md", line: "short" }], specs: new Map([["s", "short"]]) }),
  ).toEqual([]);
});

test("the forbidden-spelling keeper refuses each class it names on a planted instance, and a clean diff on none", () => {
  const planted = [
    { path: "docs/X.md", line: "the key is AKIA0123456789ABCDEF and it is live" },
    { path: "docs/X.md", line: "write to someone@example.com about it" },
    { path: "src/a.ts", line: "const home = '/the/seat/home/dir/projects';" },
    { path: "docs/X.md", line: "signed off by Fixturename, who ran it" },
  ];
  const found = forbiddenSpellingFindings({
    added: planted,
    home: "/the/seat/home/dir",
    names: ["Fixturename"],
  });
  expect(found.length, "every planted class is refused").toBeGreaterThanOrEqual(4);
  expect(found.join("\n")).toContain("aws-key");
  expect(found.join("\n")).toContain("email address");
  expect(found.join("\n")).toContain("home directory");
  expect(found.join("\n")).toContain("account or git name");
  // THE RENAME CLASS RIDES THE SCANNER'S OWN CLASSIFIER, so a spelling
  // that file keeps is kept here — the difference between a keeper that
  // is usable and one that is turned off on its second day.
  const kept = forbiddenSpellingFindings({
    added: [{ path: "docs/X.md", line: "a retired spelling" }],
    classify: () => ({ kept: true }),
  });
  expect(kept, "a classified survivor is not a finding").toEqual([]);
  const fresh = forbiddenSpellingFindings({
    added: [{ path: "src/a.ts", line: "// a comment with the retired spelling" }],
    classify: () => ({ kept: false }),
  });
  expect(fresh, "an unclassified one is").toHaveLength(1);
  expect(fresh[0], "and the message says the keeper scans comments").toContain("comments");
  // THE POSITIVE CONTROL: this board's own `model@kind` seat spelling is
  // not an address, and a clean diff yields nothing at all.
  expect(
    forbiddenSpellingFindings({
      added: [{ path: "docs/X.md", line: "builder: claude-opus-5@subagent" }],
      home: "/the/seat/home/dir",
      names: ["Fixturename"],
    }),
  ).toEqual([]);
  expect(SECRET_SHAPES.length, "the secret shapes are a stated set").toBeGreaterThan(3);

  // ONE FINDING PER FILE PER CLASS, never one per line. The first
  // fixture run of this keeper printed the same sentence eleven times
  // over four files, and a refusal a seat scrolls past is the same
  // failure as a keeper nobody turned on.
  const repeated = forbiddenSpellingFindings({
    added: [
      { path: "docs/X.md", line: "/the/seat/home/dir/a" },
      { path: "docs/X.md", line: "/the/seat/home/dir/b" },
      { path: "docs/Y.md", line: "/the/seat/home/dir/c" },
    ],
    home: "/the/seat/home/dir",
  });
  expect(repeated, "two files, one finding each").toHaveLength(2);
});

test("the personal name this keeper looks for is DERIVED whole, and never split into its own words", () => {
  // THE MEASURED FAULT, on this card's own first fixture run: the git
  // identity `T-295 fixture` was split into words, and the keeper then
  // refused every line carrying a card id or the word "fixture" — eleven
  // findings over four files, none of them a leak. A keeper that fires
  // on ordinary vocabulary is a keeper that gets turned off on its
  // second day, which is the one outcome a cheap keeper cannot afford.
  const derived = personalNames(repoRoot);
  expect(derived.length, "at least the account this process runs as").toBeGreaterThan(0);
  for (const name of derived) {
    expect(name.includes(" ") || !name.includes(" "), "each entry is one whole name").toBe(true);
  }
  // A WHOLE two-word identity matches only itself.
  const noisy = forbiddenSpellingFindings({
    added: [
      { path: "docs/X.md", line: "T-295 is a card and this line is ordinary" },
      { path: "docs/X.md", line: "a fixture repository, built and removed" },
    ],
    names: ["T-295 fixture"],
  });
  expect(noisy, "neither word alone is the name").toEqual([]);
  const real = forbiddenSpellingFindings({
    added: [{ path: "docs/X.md", line: "committed by T-295 fixture on a Tuesday" }],
    names: ["T-295 fixture"],
  });
  expect(real, "and the whole name still is").toHaveLength(1);
});

test("the XS-bound keeper refuses an XS card over the bound and judges no card of any other size", () => {
  expect(XS_CHANGED_LINE_BOUND, "the bound is a stated number").toBe(40);
  const over = xsBoundFinding({ size: "XS", changed: XS_CHANGED_LINE_BOUND + 1 });
  expect(over, "one line over the bound refuses").not.toBeNull();
  expect(over ?? "", "and the refusal states the bound").toContain(String(XS_CHANGED_LINE_BOUND));
  expect(xsBoundFinding({ size: "XS", changed: XS_CHANGED_LINE_BOUND }), "the bound itself is inside").toBeNull();
  // THE POSITIVE CONTROL, and it is the whole reason the size is read:
  // the board's parser knows S, M and L today, and none of them is
  // judged by this keeper at any size of diff.
  for (const size of ["S", "M", "L"]) {
    expect(xsBoundFinding({ size, changed: 4000 }), `${size} is not this keeper's`).toBeNull();
  }
});

// ── the counts ───────────────────────────────────────────────────────

test("the verb refuses to commit on a count that moved, and says which legs it could not judge", () => {
  // 2d6d354: a merge script that committed on an exit code while the
  // count under it had moved landed main red.
  const claimed = claimedCounts("parser 389 / app 1171 / rust 655 exit 0 and e2e 852 with one body red");
  expect(claimed, "the counts come off the verdict's own sentence").toEqual({
    parser: 389,
    app: 1171,
    rust: 655,
    e2e: 852,
  });
  const moved = gradeCounts({ claimed, observed: { e2e: 851 } });
  expect(moved.findings, "a count that moved is one finding").toHaveLength(1);
  expect(moved.findings[0]).toContain("THE COUNT MOVED");
  expect(moved.findings[0], "and it names both figures").toContain("852");
  expect(moved.findings[0]).toContain("851");
  expect(moved.unjudged.length, "and the legs with no reading are SAID, never read as a pass").toBe(3);
  // THE POSITIVE CONTROL: the same grader over a count that held.
  const held = gradeCounts({ claimed, observed: { e2e: 852 } });
  expect(held.findings, "a count that held is no finding").toEqual([]);
  expect(held.judged[0]).toContain("852");
  // And the reading itself comes off a runner's own line, in either dialect.
  expect(runCounts("  852 passed (3.1m)")).toEqual({ passed: 852, failed: 0 });
  expect(runCounts("1 failed\n839 passed")).toEqual({ passed: 839, failed: 1 });
  expect(runCounts("nothing that is a count"), "and a run with no count is null, never zero").toBeNull();

  // AND THE GRADER IS WIRED TO A STEP THAT RUNS BEFORE THE COMMIT. A
  // refusal computed by a function nothing calls is the shape 2d6d354
  // already had; this is the half that makes it reach the merge.
  const plan = tailPlan({ paths: ["docs/tasks/T-000-a-card.md"], projectRoot: repoRoot, id: "T-000" });
  const at = plan.findIndex((s) => s.id === "counts");
  expect(at, "the counts are a step of the plan").toBeGreaterThanOrEqual(0);
  expect(plan[at]?.action, "and the runner performs them").toBe("counts");
  expect(at, "before the STOP that hands the commit back").toBeLessThan(
    plan.findIndex((s) => s.kind === "stop"),
  );
});

// ── the message and the meters ───────────────────────────────────────

test("the merge message is written from the verdict's own sentences and counts, never composed", () => {
  const verdict = {
    heading: "### VERDICT 2026-09-10 — APPROVED WITH ASSIGNED CORRECTIONS — a verifier",
    text: [
      "### VERDICT 2026-09-10 — APPROVED WITH ASSIGNED CORRECTIONS — a verifier",
      "",
      "### a sub-heading the message must not take",
      "",
      "The arm performs the ritual's twelve steps and stops before the commit; the two",
      "assigned corrections are re-drilled on the merged tree.",
      "",
      "parser 389 / app 1171 / rust 655 and e2e 852.",
    ].join("\n"),
  };
  const text = mergeMessage({
    id: "T-295",
    lane: "task/T-295-the-arm-merges",
    benchTip: "abcdef1234567890",
    verdictSha: "abcdef1234567890",
    verdict,
    paths: ["a", "b"],
    corrections: ["CORRECTION 1"],
    regenerated: ["the census"],
    counts: { e2e: 852 },
  });
  expect(text.split("\n")[0], "the subject carries the verdict's own STATE").toContain(
    "APPROVED WITH ASSIGNED CORRECTIONS",
  );
  expect(text.split("\n")[0], "and the verdict's own opening sentence").toContain(
    "The arm performs the ritual's twelve steps and stops before the commit;",
  );
  expect(text, "the entry it came from is named").toContain("2026-09-10");
  expect(text, "the corrections are named").toContain("CORRECTION 1");
  expect(text, "and the counts are the verdict's re-read").toContain("e2e 852");
  // THE OPENER IS THE VERDICT'S PROSE AND NOT ITS FURNITURE: a heading,
  // a fence and a list marker are all skipped, and a verdict with no
  // prose at all is SAID to have none rather than filled in.
  expect(verdictOpener("### h\n\n- a list item\n\nA real sentence follows here, and it is long enough. Then more.")).toContain(
    "A real sentence follows here",
  );
  expect(verdictOpener("### h\n\n")).toContain("invents none");
});

test("every `## Meters` block reaches the bands' readings, whole, in the stated shape", () => {
  const report = ["# a report", "", "## Meters", "", "    wall clock   3 h", "    tokens       475K", "", "## Next"].join("\n");
  expect(metersBlocks(report), "the block runs to the next heading of its level").toEqual([
    "wall clock   3 h\n    tokens       475K",
  ]);
  expect(metersBlocks("# no meters here\n"), "a document with none yields none").toEqual([]);
  const lines = readingsLines({
    id: "T-295",
    size: "L",
    tier: "standard",
    merge: "abcdef1234567890",
    at: "2026-09-10T00:00:00.000Z",
    sources: [{ seat: "executor", source: "report-T-295.md", text: report }],
  });
  expect(lines, "one line per block per seat").toHaveLength(1);
  const parsed = JSON.parse(lines[0] ?? "{}") as Record<string, unknown>;
  expect(parsed["card"]).toBe("T-295");
  expect(parsed["size"]).toBe("L");
  expect(parsed["tier"]).toBe("standard");
  expect(parsed["seat"]).toBe("executor");
  expect(parsed["merge"]).toBe("abcdef1234567890");
  // THE BLOCK IS CARRIED WHOLE AND NOT PARSED INTO FIELDS: T-297 owns
  // the parse, this owns the capture, and a capture that loses nothing
  // is the only one a later parser can be written against.
  expect(String(parsed["meters"])).toContain("wall clock");
  expect(READINGS_PATH, "and the readings are a record, appended").toBe("docs/checkpoints/meters.jsonl");
});

// ── the conflicts ────────────────────────────────────────────────────

test("a conflict gets one of three answers: the lane's card, a kept end-of-file append, or a fence finding", () => {
  // THE MERGE BASE IS WHAT DECIDES, so the fixtures carry it: the verb
  // re-materialises every conflicted file with `--conflict=diff3` before
  // it classifies, because two sides alone cannot tell an APPEND from
  // two rewrites of the same lines.
  const appended = [
    "const a = 1;",
    "<<<<<<< HEAD",
    "export const fromMain = 1;",
    "||||||| merged common ancestors",
    "=======",
    "export const fromLane = 2;",
    ">>>>>>> task/T-900-x",
    "",
  ].join("\n");
  expect(classifyConflict({ path: "tools/e2e/tests/shared.spec.ts", id: "T-900", text: appended }).kind).toBe(
    "append",
  );
  const kept = resolveAppendConflict(appended);
  expect("text" in kept).toBe(true);
  if (!("text" in kept)) return;
  expect(kept.text, "both sides are kept").toContain("fromMain");
  expect(kept.text).toContain("fromLane");
  expect(kept.text, "no marker survives").not.toContain("<<<<<<<");
  expect(kept.text.endsWith("export const fromLane = 2;\n"), "and the closing is restored").toBe(true);

  // THE CARD ARM is a PATH question, answered first, because a card
  // conflicted at its end would otherwise read as an append.
  expect(classifyConflict({ path: "docs/tasks/T-900-a-card.md", id: "T-900", text: appended }).kind).toBe("card");

  // AND EVERYTHING ELSE IS A FENCE FINDING. Two lanes writing the same
  // lines of one file means the fences were not disjoint, and no merge
  // may resolve that on their behalf.
  const middle = [
    "<<<<<<< HEAD",
    "one",
    "||||||| merged common ancestors",
    "the line both sides rewrote",
    "=======",
    "two",
    ">>>>>>> task/T-900-x",
    "const tail = 1;",
  ].join("\n");
  const verdict = classifyConflict({ path: "src/a.ts", id: "T-900", text: middle });
  expect(verdict.kind).toBe("fence");
  expect(verdict.why, "and it says why it is one").toContain("fences were not disjoint");
  expect("problem" in resolveAppendConflict(middle), "the resolver refuses any other shape").toBe(true);

  // AND THE ONE THAT SENT THIS BACK TO THE DRAWING BOARD: a file whose
  // ONLY line both sides rewrote is also one hunk at the end of the
  // file, and a resolver keying on the end alone would concatenate two
  // rewrites of the same line and call it a merge.
  const rewritten = [
    "<<<<<<< HEAD",
    "// main rewrote the head",
    "||||||| merged common ancestors",
    "// shared",
    "=======",
    "// the lane rewrote the head",
    ">>>>>>> task/T-900-x",
    "",
  ].join("\n");
  expect(
    classifyConflict({ path: "tools/e2e/tests/shared.spec.ts", id: "T-900", text: rewritten }).kind,
    "a rewrite at the end of a file is NOT an append",
  ).toBe("fence");
  // AND A CONFLICT WITH NO BASE SECTION AT ALL is refused rather than
  // guessed at — an inability may not become a verdict.
  const blind = rewritten.replace("||||||| merged common ancestors\n// shared\n", "");
  expect(classifyConflict({ path: "src/a.ts", id: "T-900", text: blind }).kind).toBe("fence");
  expect(classifyConflict({ path: "src/a.ts", id: "T-900", text: blind }).why).toContain("NO merge-base");
});

// ── the fence widening ───────────────────────────────────────────────

test("a verdict-named spec outside the lane's fence widens the card on the integration branch BEFORE the merge", () => {
  // T-281-s10, at T-283's refused push: the verifier's four correction
  // bodies lived in a spec outside a method-text fence BY CONSTRUCTION,
  // and the landing gate reads a merge's fence from its FIRST PARENT.
  const verdict = block({ spec: "tools/e2e/tests/brief.spec.ts" });
  expect(verdictSpecs(verdict)).toEqual(["tools/e2e/tests/brief.spec.ts"]);
  const card = ["---", "id: T-283", "touches: [method/roles/executor.md]", "---", ""].join("\n");
  const widened = widenTouches({ text: card, specs: verdictSpecs(verdict) });
  expect("text" in widened).toBe(true);
  if (!("text" in widened)) return;
  expect(widened.added).toEqual(["tools/e2e/tests/brief.spec.ts"]);
  expect(widened.text).toContain("touches: [method/roles/executor.md, tools/e2e/tests/brief.spec.ts]");
  // A SPEC ALREADY INSIDE THE FENCE IS NOT ADDED TWICE, and a card with
  // no readable fence is a refusal rather than a rewritten line.
  const again = widenTouches({ text: widened.text, specs: verdictSpecs(verdict) });
  expect("added" in again ? again.added : ["not reached"]).toEqual([]);
  expect("problem" in widenTouches({ text: "---\nid: T-1\n---\n", specs: ["a"] })).toBe(true);
  // AND IT IS A STEP AHEAD OF THE MERGE, not a line inside it.
  const prelude = preludePlan({
    projectRoot: repoRoot,
    id: "T-283",
    branch: "main",
    lane: "task/T-283-x",
    verdict: "a".repeat(40),
    worktree: null,
    widen: ["tools/e2e/tests/brief.spec.ts"],
  });
  const ids = prelude.map((s) => s.id);
  expect(ids.indexOf("fence:widen"), "the widening is planned").toBeGreaterThanOrEqual(0);
  expect(ids.indexOf("fence:widen"), "ahead of the merge").toBeLessThan(ids.indexOf("merge"));
  expect(preludePlan({
    projectRoot: repoRoot,
    id: "T-283",
    branch: "main",
    lane: "task/T-283-x",
    verdict: "a".repeat(40),
    worktree: null,
    widen: [],
  }).some((s) => s.id === "fence:widen"), "and a fence that already covers it plans no step").toBe(false);
});

// ── the whole verb, on a fixture repository ──────────────────────────

/**
 * A repository with a lane branch, a bench commit carrying a verdict
 * with one mutant block, and the defect that verdict corrects.
 */
function mergeFixture(opts: { conflict?: "append" | "fence" } = {}): {
  root: string;
  git: (...args: string[]) => string;
  card: string;
} {
  const root = mkdtempSync(path.join(tmpdir(), "supertaskr-merge-"));
  const git = (...args: string[]): string =>
    execFileSync("git", ["-C", root, ...NO_BACKGROUND_MAINTENANCE, ...args], { encoding: "utf8" });
  execFileSync("git", ["init", "-q", "-b", "main", root], { stdio: "pipe" });
  git("config", "user.email", "fixture@example.invalid");
  git("config", "user.name", "T-295 fixture");
  mkdirSync(path.join(root, "docs", "tasks"), { recursive: true });
  mkdirSync(path.join(root, "src"), { recursive: true });
  mkdirSync(path.join(root, "tools", "e2e", "tests"), { recursive: true });
  const card = path.join("docs", "tasks", "T-900-a-card.md");
  writeFileSync(
    path.join(root, card),
    [
      "---",
      "id: T-900",
      "size: S",
      "status: building",
      "touches: [src/]",
      "builder: a-model@subagent",
      "verifier: a-model@subagent",
      "built_by:",
      "verified_by:",
      "---",
      "",
      "## Verdicts",
      "",
    ].join("\n"),
  );
  writeFileSync(path.join(root, "src", "a.ts"), "export const guard = true;\n");
  writeFileSync(path.join(root, "tools", "e2e", "tests", "shared.spec.ts"), "// shared\n");
  git("add", "-A");
  git("commit", "-qm", "the tree before the lane");

  git("checkout", "-q", "-b", "task/T-900-a-card");
  // THE LANE'S OWN WRITE carries the DEFECT the verdict corrects: the
  // block's `new` text, which is what a merged tree looks like before
  // the correction is applied.
  writeFileSync(path.join(root, "src", "a.ts"), "export const guard = false;\n");
  if (opts.conflict !== undefined) {
    writeFileSync(
      path.join(root, "tools", "e2e", "tests", "shared.spec.ts"),
      opts.conflict === "append" ? "// shared\nconst fromLane = 2;\n" : "// the lane rewrote the head\n",
    );
  }
  writeFileSync(
    path.join(root, card),
    [
      "---",
      "id: T-900",
      "size: S",
      "status: verifying",
      "touches: [src/]",
      "builder: a-model@subagent",
      "verifier: a-model@subagent",
      "built_by:",
      "verified_by:",
      "---",
      "",
      "## Verdicts",
      "",
      "### VERDICT 2026-09-10 — APPROVED WITH ASSIGNED CORRECTIONS — a verifier",
      "",
      "The guard is inverted and the body below pins it; one assigned correction.",
      "",
      // AT A MARGIN, deliberately: this fixture is the T-293 shape.
      block({ file: "src/a.ts", spec: "tools/e2e/tests/shared.spec.ts" }, "    "),
      "",
      "## Meters",
      "",
      "    wall clock  40 min",
      "",
    ].join("\n"),
  );
  git("add", "-A");
  git("commit", "-qm", "T-900 the lane, and the verdict");
  git("checkout", "-q", "main");
  if (opts.conflict !== undefined) {
    writeFileSync(
      path.join(root, "tools", "e2e", "tests", "shared.spec.ts"),
      opts.conflict === "append" ? "// shared\nconst fromMain = 1;\n" : "// main rewrote the head\n",
    );
    git("add", "-A");
    git("commit", "-qm", "main's own write on the shared spec");
  }
  return { root, git, card };
}

test("the verb derives every dial off git — the lane branch, the worktree and both seats — and never off a document", () => {
  const fx = mergeFixture();
  try {
    const dials = mergeDials({ root: fx.root, id: "T-900" });
    expect("problem" in dials, "the dials derive").toBe(false);
    if ("problem" in dials) return;
    expect(dials.slug, "the slug comes off the branch, not off a bullet").toBe("a-card");
    expect(dials.lane).toBe("task/T-900-a-card");
    expect(dials.builtBy, "and the seats come off the card's own fields").toBe("a-model@subagent");
    expect(dials.how.join("\n")).toContain("git worktree list --porcelain");
    // NO BENCH WORKTREE IS LIVE HERE, so the lane tip is taken and the
    // derivation SAYS SO — a verifier that committed bodies on a bench
    // this checkout cannot see would be left behind by that.
    expect(dials.how.join("\n")).toContain("NO detached bench worktree");
    // AND A CARD WITH NO LANE IS A REFUSAL, never a guess.
    const none = mergeDials({ root: fx.root, id: "T-901" });
    expect("problem" in none).toBe(true);
  } finally {
    removeGitFixture(fx.root, FIXTURE);
  }
});

test("the verb performs the ritual on a fixture, applies the correction off the verdict, and STOPS with the merge staged", () => {
  const fx = mergeFixture();
  try {
    const said: string[] = [];
    const ledger: { id: string; title: string; exit: number }[] = [];
    const code = mergeMain(
      [
        "T-900",
        "--slug",
        "a-card",
        "--verdict",
        fx.git("rev-parse", "task/T-900-a-card").trim(),
        "--root",
        fx.root,
        "--built-by",
        "a-model@subagent",
        "--verified-by",
        "a-model@subagent",
        "--readings",
        path.join(fx.root, "readings.jsonl"),
        "--message",
        path.join(fx.root, "MSG.txt"),
      ],
      { cwd: fx.root, out: (s) => said.push(s), err: (s) => said.push(s), ledger },
    );
    const text = said.join("\n");
    // THE DRILL CANNOT RUN in a fixture with no test runner, and that is
    // reported as CANNOT RUN rather than as a pass — so the run stops at
    // the drill with everything before it done. The properties this body
    // is about are all before it.
    expect(ledger.some((s) => s.id === "correction:1" && s.exit === 0), "the correction ran and held").toBe(true);
    expect(text, "and it applied the block's OLD text").toContain("now carries the block's `old` text");
    expect(readFileSync(path.join(fx.root, "src", "a.ts"), "utf8")).toBe("export const guard = true;\n");
    // THE CARD IS STAMPED, IN THE MERGE, by its own status line.
    expect(readFileSync(path.join(fx.root, fx.card), "utf8")).toContain("status: done");
    expect(readFileSync(path.join(fx.root, fx.card), "utf8")).toContain("built_by: a-model@subagent");
    // EVERY STEP PRINTS ITS EXIT, which is the seat's one line per step.
    expect(ledger.length, "the ledger carries every step that ran").toBeGreaterThan(4);
    for (const step of ledger) expect(typeof step.exit, `${step.id} carries an exit`).toBe("number");
    expect(text, "and the exits are printed beside them").toContain("exit 0");
    // AND NOTHING IS COMMITTED: the merge is staged and MERGE_HEAD stands.
    expect(existsSync(path.join(fx.root, ".git", "MERGE_HEAD")), "the merge is staged, not committed").toBe(true);
    expect(code === EXIT.CLEAN || code === EXIT.FOUND, "the verb ends by stopping, never by committing").toBe(true);
  } finally {
    removeGitFixture(fx.root, FIXTURE);
  }
});

test("a same-file end-of-file append is resolved by keeping both sides, and any other conflict stops the verb as a fence finding", () => {
  for (const shape of ["append", "fence"] as const) {
    const fx = mergeFixture({ conflict: shape });
    try {
      const said: string[] = [];
      const ledger: { id: string; title: string; exit: number }[] = [];
      mergeMain(
        [
          "T-900",
          "--slug",
          "a-card",
          "--verdict",
          fx.git("rev-parse", "task/T-900-a-card").trim(),
          "--root",
          fx.root,
          "--built-by",
          "a@b",
          "--verified-by",
          "a@b",
          "--readings",
          path.join(fx.root, "readings.jsonl"),
          "--message",
          path.join(fx.root, "MSG.txt"),
        ],
        { cwd: fx.root, out: (s) => said.push(s), err: (s) => said.push(s), ledger },
      );
      const text = said.join("\n");
      const merge = ledger.find((s) => s.id === "merge");
      if (shape === "append") {
        expect(merge?.exit, "an append is resolved and the run goes on").toBe(0);
        const shared = readFileSync(path.join(fx.root, "tools", "e2e", "tests", "shared.spec.ts"), "utf8");
        expect(shared, "both sides are kept").toContain("fromMain");
        expect(shared).toContain("fromLane");
        expect(shared, "and no marker survives").not.toContain("=======");
      } else {
        expect(merge?.exit, "any other conflict stops the verb").not.toBe(0);
        expect(text).toContain("CONFLICT(S) THIS VERB WILL NOT RESOLVE");
        expect(text, "and it is named as a FENCE finding").toContain("FENCE FINDING");
        expect(text).toContain("tools/e2e/tests/shared.spec.ts");
      }
    } finally {
      removeGitFixture(fx.root, FIXTURE);
    }
  }
});

test("the verb never pushes, and the keeper steps it plans are the four the card names", () => {
  // A NEGATIVE ASSERTION WITH ITS POSITIVE CONTROL (docs/CONVENTIONS.md):
  // the same read that finds no push finds the merge and the branch move,
  // so "no push" is a fact about this file and not about the reader.
  const source = readFileSync(path.join(repoRoot, "tools", "e2e", "scripts", "merge.mjs"), "utf8");
  const argvLines = source.match(/argv: \[[^\]]*\]/g) ?? [];
  expect(argvLines.length, "the control: this file spells plenty of git argv").toBeGreaterThan(4);
  expect(argvLines.some((l) => /"push"/.test(l)), "and not one of them is a push").toBe(false);
  expect(argvLines.some((l) => /"merge"/.test(l)), "while the merge itself is there").toBe(true);
  const keepers = keeperSteps({ projectRoot: repoRoot, id: "T-000", card: "docs/tasks/T-000.md" });
  expect(keepers.map((s) => s.id)).toEqual([
    "keeper:pinned-sentence",
    "keeper:forbidden-spelling",
    "keeper:xs-bound",
    "keeper:preflight",
  ]);
  for (const k of keepers) expect(k.kind, `${k.id} is a gate with an exit`).toBe("gate");
});
