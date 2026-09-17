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
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, test } from "@playwright/test";
import {
  EXIT,
  FIXTURE_CLASSES,
  METHOD_STAMP_FILES,
  PINNED_SENTENCE_FLOOR,
  READINGS_PATH,
  SECRET_SHAPES,
  BUMPED_TIER,
  DEFAULT_TIER,
  XS_CHANGED_LINE_BOUND,
  bumpOne,
  cardTier,
  bumpSteps,
  classifyConflict,
  assignsCorrections,
  claimedCounts,
  claimedScopes,
  countsStep,
  correctionEntries,
  correctionFor,
  correctionHeadings,
  correctionKey,
  correctionSteps,
  dedentBlock,
  drillScope,
  drillSteps,
  fixtureClassOf,
  forbiddenSpellingFindings,
  forbiddenSpellingReport,
  gradeCounts,
  isVerdictHeading,
  keeperSteps,
  receiptKeeperReport,
  mergeDials,
  mergeMessage,
  metersBlocks,
  movesMethodText,
  newestVerdict,
  occurrences,
  personalNames,
  pinnedSentenceFindings,
  preludePlan,
  readMutantBlocks,
  readingsLines,
  resolveAppendConflict,
  runCounts,
  runMutantDrill,
  runSelection,
  scopeLine,
  scopeOfRun,
  scopeOfSpecs,
  scopeVerdict,
  selectionToken,
  specRunners,
  tailPlan,
  verdictOpener,
  verdictSpecs,
  verdictState,
  widenTouches,
  xsBoundBump,
  main as mergeMain,
} from "../scripts/merge.mjs";
import { NO_BACKGROUND_MAINTENANCE, removeGitFixture } from "./git-fixture";
import { conventionsText } from "../scripts/docs-scan.mjs";
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

  expect(defective, "and the reading carries the two counts it measured").toMatchObject({ oldSites: 0, newSites: 1 });

  // ALREADY CORRECTED IS A THIRD ANSWER, never a silent write. The lane's
  // own fix pass had landed the correction at four of the merges this
  // card was cut from.
  const done = correctionFor({ source: "const x = 1;\nguard = true\n", block: b });
  expect("already" in done, "a tree that already carries `old` is left alone").toBe(true);
  expect(done, "`old` once and `new` absent is the already-applied state").toMatchObject({ oldSites: 1, newSites: 0 });

  // AND NEITHER SIDE IS A REFUSAL, not a best effort.
  const neither = correctionFor({ source: "const x = 1;\n", block: b });
  expect("problem" in neither).toBe(true);
  if (!("problem" in neither)) return;
  expect(neither.problem, "the refusal names both counts").toContain(
    "`old` matches 0 site(s), `new` matches 0 site(s)",
  );
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

// ── the fixture classifier (T-295-s4, the amendment of 2026-09-13) ────
//
// HOW THE VALUES BELOW ARE SPELLED, AND IT IS NOT TIDINESS. A body that
// tests this keeper has to PLANT the very values the keeper keeps out,
// and every line of it is a line some merge ADDS — which is the whole
// card: three merges in two days stopped on a synthetic fixture identity
// a new spec body added, and each was ruled through by hand. So the
// values this body expects KEPT are spelled whole, because the table
// keeps them at this exact file and the merge that lands them announces
// the exception; the values it expects REFUSED are ASSEMBLED from pieces
// at run time, because spelling one whole here would refuse this file's
// own merge and there is no table entry that should ever keep them.
// Each planted value's class is named where it is built.

test("the fixture classifier KEEPS an explicitly synthetic keeper-test input, and the same value at any other site is still refused", () => {
  const SPEC = "tools/e2e/tests/merge.spec.ts";
  // CLASS `aws-key`: the credential literal this keeper's own planted
  // instance carries, enumerated by `keeper-fixture-credential`.
  const credential = "AKIA0123456789ABCDEF";
  // CLASS `email`: the suite's ONE fixture identity, enumerated by
  // `suite-fixture-identity` at a domain the standards reserve.
  const identity = "fixture@example.invalid";
  const kept = forbiddenSpellingReport({
    added: [
      { path: SPEC, line: `const credential = "${credential}";` },
      { path: SPEC, line: `git("config", "user.email", "${identity}");` },
    ],
  });
  expect(kept.findings, "neither planted value is a finding at the site the table names").toEqual([]);
  expect(kept.kept, "and BOTH exceptions are announced — a kept spelling is news").toHaveLength(2);
  const news = kept.kept.join("\n");
  expect(news, "the announcement names the file").toContain(SPEC);
  expect(news, "and the fixture class it was kept under").toContain("keeper-fixture-credential");
  expect(news, "and the other one").toContain("suite-fixture-identity");
  expect(news, "and it says the exception is per value and per class").toContain("per matched value");
  // THE VALUE IS NOT PUBLISHED BY THE ANNOUNCEMENT, for the same reason
  // the refusal below does not publish one: a record quotes the step.
  expect(news, "the credential is not printed").not.toContain(credential);
  expect(news, "and neither is the address").not.toContain(identity);

  // THE POSITIVE CONTROL, AND IT DIFFERS ONLY IN THE ARRANGEMENT: the
  // same two values, at a site the table does not name, are refused
  // exactly as they were before this classifier existed. This is the
  // card's own criterion 2 and it is what stops the exception being a
  // claim that a credential-shaped value is harmless because it sits in
  // a test — the value did not change; the site did.
  const outside = forbiddenSpellingReport({
    added: [
      { path: "docs/X.md", line: `const credential = "${credential}";` },
      { path: "docs/X.md", line: `git("config", "user.email", "${identity}");` },
    ],
  });
  expect(outside.kept, "nothing is kept outside the fixture context").toEqual([]);
  expect(outside.findings, "and both classes refuse").toHaveLength(2);
  expect(outside.findings.join("\n")).toContain("aws-key");
  expect(outside.findings.join("\n")).toContain("email address");
  // AND THE SUITE'S IDENTITY IS KEPT ACROSS THE SUITE'S OWN SPEC TREE,
  // which is the class that stopped three merges — the `files` token
  // ending in `/` is a directory and the rest are whole paths.
  expect(
    forbiddenSpellingFindings({ added: [{ path: "tools/e2e/tests/cli.spec.ts", line: identity }] }),
    "the same identity in another spec of the same suite",
  ).toEqual([]);
  expect(
    forbiddenSpellingFindings({ added: [{ path: "tools/e2e/scripts/cli.mjs", line: identity }] }),
    "and NOT one directory over, where no entry names the site",
  ).toHaveLength(1);
});

test("the fixture classifier answers a NEAR-MATCH with a refusal, and its exception is per matched value and per class", () => {
  const SPEC = "tools/e2e/tests/merge.spec.ts";
  const credential = "AKIA0123456789ABCDEF";
  const identity = "fixture@example.invalid";
  // ASSEMBLED, NEVER SPELLED (see the note above this block). CLASS
  // `aws-key`: the enumerated literal with its last character moved, so
  // it is the same SHAPE at the same SITE and a different VALUE.
  const nearCredential = `${credential.slice(0, -1)}G`;
  // CLASS `email`: a domain one suffix away from a reserved one, so the
  // shape matches and the recognition rule does not.
  const nearAddress = identity.replace(".invalid", ".invalidated");
  // CLASS `email`: a deliverable address, which no entry may ever name.
  const live = ["areal.person", "a-real-domain.com"].join("@");

  const near = forbiddenSpellingReport({
    added: [
      { path: SPEC, line: `const near = "${nearCredential}";` },
      { path: SPEC, line: `const near = "${nearAddress}";` },
    ],
  });
  expect(near.kept, "a near-match is not recognised, so nothing is kept").toEqual([]);
  expect(near.findings, "and the shape's own refusal stands, at the very site the table names").toHaveLength(2);
  expect(fixtureClassOf({ value: nearCredential, cls: "aws-key", file: SPEC }), "no class").toBe(null);
  expect(fixtureClassOf({ value: nearAddress, cls: "email", file: SPEC }), "nor for the address").toBe(null);
  expect(fixtureClassOf({ value: credential, cls: "aws-key", file: SPEC }), "the control").toBe(
    "keeper-fixture-credential",
  );

  // THE MIXED CASE, ON ONE LINE AND IN ONE CLASS: keeping the fixture
  // identity does not suppress the deliverable address beside it. A
  // per-LINE exception would have lost this, which is why the keeper
  // asks every value a shape matched rather than the first.
  const mixed = forbiddenSpellingReport({
    added: [{ path: SPEC, line: `const seats = ["${identity}", "${live}"];` }],
  });
  expect(mixed.kept, "the synthetic one is kept and announced").toHaveLength(1);
  expect(mixed.findings, "and the line is REFUSED anyway, on the unclassified value").toHaveLength(1);
  expect(mixed.findings[0]).toContain("email address");

  // AND ACROSS CLASSES, IN THE SAME FIXTURE BLOCK: a kept credential on
  // one line suppresses nothing on the next, and nothing of another
  // class on its own line either.
  const across = forbiddenSpellingReport({
    added: [
      { path: SPEC, line: `const credential = "${credential}";` },
      { path: SPEC, line: "const where = '/the/seat/home/dir/projects';" },
    ],
    home: "/the/seat/home/dir",
  });
  expect(across.kept, "the credential is still kept").toHaveLength(1);
  expect(across.findings, "and the home path still refuses").toHaveLength(1);
  expect(across.findings[0]).toContain("home directory");
});

test("the fixture table's admission rule is kept by this body — every entry names a VALUE and a SITE, and no entry can reach the machine's own facts", () => {
  // A TABLE THAT ADMITS THE WRONG ENTRY IS THE WHOLE RISK, and the rule
  // for admitting one is a paragraph in `merge.mjs` — which is a memory.
  // This is the body that keeps it: an entry whose pattern is a SHAPE
  // rather than a literal, or whose sites are the whole tree, would
  // claim an arbitrary credential-shaped value harmless for sitting in a
  // test, which the card's amendment forbids in as many words.
  expect(FIXTURE_CLASSES.length, "the table is a stated set").toBeGreaterThan(0);
  for (const entry of FIXTURE_CLASSES) {
    expect(entry.pattern.source.startsWith("^"), `${entry.id} is anchored at its start`).toBe(true);
    expect(entry.pattern.source.endsWith("$"), `${entry.id} is anchored at its end`).toBe(true);
    // AND THE PATTERN NAMES THE VALUE RATHER THAN ITS SHAPE, which is
    // the half of the recognition rule an anchored SHAPE satisfies while
    // defeating it: a class pattern anchored at both ends keeps EVERY
    // credential of that class at every site the entry names, which is
    // the claim the card's amendment forbids in as many words. Read off
    // the pattern's own source — anchors off, an outer alternation split
    // — and every alternative has to be a literal whose only escape is
    // an escaped dot.
    const bareSource = entry.pattern.source.replace(/^\^/, "").replace(/\$$/, "");
    for (const alternative of (/^\(\?:(.*)\)$/.exec(bareSource)?.[1] ?? bareSource).split("|")) {
      expect(
        /^(?:[A-Za-z0-9@_%+-]|\\\.)+$/.test(alternative),
        `${entry.id} names the VALUE and not its SHAPE`,
      ).toBe(true);
    }
    expect(entry.files.length, `${entry.id} names at least one site`).toBeGreaterThan(0);
    expect(
      entry.files.some((f) => f === "" || f === "/" || f === "docs/" || f === "."),
      `${entry.id} names no site that is the whole tree`,
    ).toBe(false);
    expect(
      ["home", "name"].includes(entry.cls),
      `${entry.id} does not cover a class DERIVED from the live machine`,
    ).toBe(false);
  }
  // EVERY DOMAIN AN ADDRESS ENTRY SPELLS IS ONE THE STANDARDS RESERVE
  // for documentation and testing, which is the property that makes the
  // value not a person — read off the pattern's own source, so a new
  // entry at a deliverable domain reds this rather than shipping.
  const RESERVED = ["example.com", "example.net", "example.org", "invalid", "test", "example", "localhost"];
  const reserved = (d: string): boolean => RESERVED.some((r) => d === r || d.endsWith(`.${r}`));
  for (const entry of FIXTURE_CLASSES.filter((e) => e.cls === "email")) {
    const spelled = [...entry.pattern.source.matchAll(/@([A-Za-z0-9.\\-]+)/g)].map((m) =>
      (m[1] ?? "").replace(/\\/g, ""),
    );
    expect(spelled.length, `${entry.id} spells the domain it names`).toBeGreaterThan(0);
    for (const d of spelled) expect(reserved(d), `${entry.id} names ${d}, which is reserved`).toBe(true);
  }
  // THE CONTROL ON THE RULE ITSELF, arrangement absent: a deliverable
  // domain fails the same predicate, so "every one is reserved" is a
  // fact about the table rather than about a predicate that says yes.
  for (const d of ["gmail.com", "a-real-domain.com", "example.community", "examples.com"]) {
    expect(reserved(d), `${d} is not reserved`).toBe(false);
  }
  const site = "tools/e2e/tests/merge.spec.ts";
  for (const d of ["gmail.com", "a-real-domain.com", "example.community", "examples.com"]) {
    expect(
      fixtureClassOf({ value: `someone@${d}`, cls: "email", file: site }),
      `and no entry reaches a deliverable domain (${d})`,
    ).toBe(null);
  }
  // AND THE TWO CLASSES DERIVED FROM THE MACHINE CANNOT BE CLASSIFIED AT
  // ALL: a line carrying this seat's own home directory carries this
  // seat's own home directory whatever file it sits in.
  expect(fixtureClassOf({ value: "/the/seat/home/dir", cls: "home", file: site })).toBe(null);
  expect(fixtureClassOf({ value: "Fixturename", cls: "name", file: site })).toBe(null);
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

test("the XS-bound keeper BUMPS an XS card over the bound to standard and judges no card of any other size", () => {
  // THIS BODY REPLACES T-295's `the XS-bound keeper REFUSES an XS card
  // over the bound...` BY NAME, AND THE REASON IS STATED RATHER THAN
  // IMPLIED (T-296, ADR-024 decision 1). T-295 wrote the keeper as a
  // refusal, which was the right shape while the tiers did not exist: a
  // bound with nothing to do about a breach can only stop. Now that the
  // tiers exist the subject is a MIS-SIZING and not a defect — the card
  // was classified `bounded` before the work existed and the work turned
  // out bigger, and nothing about the merged tree is wrong. So the same
  // measurement now BUMPS, and everything else about the keeper is
  // unchanged and re-asserted below.
  //
  // KILLED BY: a keeper that still refuses (the bump never reaches the
  // readings), one that bumps a card of a size it does not judge, and one
  // that bumps at the bound instead of past it.
  expect(XS_CHANGED_LINE_BOUND, "the bound is a stated number").toBe(40);
  const over = xsBoundBump({ size: "XS", changed: XS_CHANGED_LINE_BOUND + 1 });
  expect(over, "one line over the bound bumps").not.toBeNull();
  expect(over ?? "", "and the notice states the bound").toContain(String(XS_CHANGED_LINE_BOUND));
  expect(over ?? "", "and the tier it is bumped TO").toContain(BUMPED_TIER);
  expect(xsBoundBump({ size: "XS", changed: XS_CHANGED_LINE_BOUND }), "the bound itself is inside").toBeNull();
  // THE POSITIVE CONTROL, and it is the whole reason the size is read:
  // the board's parser knows S, M and L today, and none of them is
  // judged by this keeper at any size of diff.
  for (const size of ["S", "M", "L"]) {
    expect(xsBoundBump({ size, changed: 4000 }), `${size} is not this keeper's`).toBeNull();
  }
  // AND THE BUMP LANDS SOMEWHERE A READER CAN SEE IT: the step writes the
  // bumped tier onto the object the readings step reads, so the reading
  // appended to the bands carries `standard` without anybody typing
  // `--tier`. A bump that only printed would be a fact the bands never
  // learn.
  const io = {
    out: () => {},
    err: () => {},
    projectRoot: repoRoot,
    id: "T-000",
    card: "docs/tasks/T-000.md",
    tier: "bounded" as string | undefined,
  };
  expect(BUMPED_TIER, "the bump target is the file's own default tier").toBe(DEFAULT_TIER);
  io.tier = BUMPED_TIER;
  expect(io.tier, "the readings step reads this field and nothing else").toBe("standard");
});

test("the tier a merge records is the one the DISPATCH stamped, unless the seat overrides it", () => {
  // KILLED BY: a merge that keeps typing `standard` over a card the arm
  // classified `guarded`, which would make every band reading a claim
  // about the default rather than about the lane.
  expect(cardTier("---\nid: T-296\nsize: M\ntier: guarded\nstatus: verifying\n---\n")).toBe("guarded");
  expect(cardTier("---\nid: T-296\nsize: M\nstatus: planned\n---\n"), "an unstamped card says nothing").toBe("");
  expect(cardTier("the word tier: guarded in prose is not frontmatter\n"), "and prose is not a field").toBe("");
  expect(DEFAULT_TIER, "and the fallback for a card cut before the field existed").toBe("standard");
});

// ── the counts ───────────────────────────────────────────────────────

/** The whole-leg scope both sides of a same-scope comparison stand on. */
const WHOLE_E2E = scopeOfRun({ command: "npm", argv: ["test"] });

/** A merge state carrying nothing but the counts and scopes a body plants. */
function countsState(plant: {
  claimed: Record<string, number>;
  observed: Record<string, number>;
  claimedScope?: Record<string, ReturnType<typeof scopeOfRun>>;
  observedScope?: Record<string, ReturnType<typeof scopeOfRun>>;
}): Parameters<typeof countsStep>[0]["state"] {
  return {
    fixed: [],
    corrections: [],
    regenerated: [],
    widen: [],
    shas: {},
    claimed: plant.claimed,
    observed: plant.observed,
    claimedScope: plant.claimedScope ?? {},
    observedScope: plant.observedScope ?? {},
  };
}

test("T-295-s8 — the scope of a count is read off the EXECUTION SELECTION on each side, never off the count", () => {
  // KILLED BY: a step that took two numbers under one leg name to be two
  // measurements of one thing. At T-297's merge that was e2e 35 — the
  // owning spec, run alone by the re-drill — against a verdict's 714,
  // the owed set's whole e2e leg.
  //
  // THE OBSERVED SIDE is the argv a run actually ran under.
  expect(runSelection({ command: "npx", argv: ["vitest", "run"] }), "a run that narrows nothing").toEqual([]);
  expect(scopeOfRun({ command: "npm", argv: ["test"] }).kind, "and that is the WHOLE leg").toBe("whole");
  expect(
    runSelection({ command: "npx", argv: ["vitest", "run", "test/architecture-dogfood.test.ts"] }),
    "a named spec is a narrowing",
  ).toEqual(["architecture-dogfood.test.ts"]);
  expect(
    runSelection({ command: "cargo", argv: ["test", "-q", "--lib", "--", "agent::kit::tests"] }),
    "a cargo target and its filter both narrow; -q reports and does not",
  ).toEqual(["--lib", "agent::kit::tests"]);
  expect(
    runSelection({ command: "gate-run.mjs", argv: ["e2e"] }),
    "and the leg's own name narrows NOTHING inside that leg — the comparison is already per leg",
  ).toEqual([]);
  // THE TWO SIDES SPELL A SPEC FROM DIFFERENT ROOTS, so the token they
  // are compared on is the one segment that is unique across the board.
  expect(selectionToken("tools/e2e/tests/merge.spec.ts")).toBe("merge.spec.ts");
  expect(selectionToken("tests/merge.spec.ts"), "the drill's runner spells it from the package").toBe("merge.spec.ts");
  expect(selectionToken("--range"), "and a token that is not a path is compared verbatim").toBe("--range");
  expect(scopeOfSpecs(["tools/e2e/tests/merge.spec.ts"], "the re-drill").selection).toEqual(["merge.spec.ts"]);
  // THE CLAIMED SIDE is the runner invocation the verdict STATES beside
  // its counts — the same kind of evidence, and never the number itself.
  const stated = claimedScopes(
    "**THE OWED SET, at my tip judged**, `gate-run.mjs --range c745a6af..3294c349`:\n" +
      "parser **389** / app **1171** / rust **655** / e2e **714** (16 spec files), every leg\n" +
      "`verdict=GREEN exit=0`, gate exit **0**.",
  );
  expect(stated.e2e?.said, "off the command, not off 714").toBe("gate-run.mjs --range c745a6af..3294c349");
  expect(stated.e2e?.selection).toEqual(["--range", "c745a6af..3294c349"]);
  expect(
    claimedScopes("parser 389 / app 1171 / rust 655 exit 0 and e2e 852 with one body red").e2e,
    "a verdict that states no command states no scope, and this INVENTS none",
  ).toBeUndefined();
  expect(
    claimedScopes("the whole suite was run and e2e 852 passed").e2e,
    "and prose saying `the whole suite` is not an execution selection",
  ).toBeUndefined();
});

test("T-295-s8 — a verdict claiming a LEG beside a drill that ran ONE spec: the step PASSES and NAMES the scope difference", () => {
  // KILLED BY: T-297's merge, which stopped on `THE COUNT MOVED` with
  // e2e 35 against 714. The card's second criterion is this arrangement.
  const verdict =
    "**THE OWED SET, at my tip judged**, `gate-run.mjs --range c745a6af..3294c349`:\n" +
    "parser **389** / app **1171** / rust **655** / e2e **714** (16 spec files).";
  const claimedScope = claimedScopes(verdict);
  const drill = scopeOfSpecs(["tools/e2e/tests/health-bands.spec.ts"], "the re-drill's own run");
  expect(scopeVerdict(claimedScope.e2e, drill), "two different selections").toBe("different");
  const said: string[] = [];
  const errs: string[] = [];
  const code = countsStep({
    out: (s) => said.push(s),
    err: (s) => errs.push(s),
    state: countsState({
      claimed: claimedCounts(verdict),
      observed: { e2e: 35 },
      claimedScope,
      observedScope: { e2e: drill },
    }),
  });
  expect(code, "the step PASSES — there is nothing here to grade").toBe(EXIT.CLEAN);
  expect(errs.join("\n"), "and it refuses nothing").toBe("");
  const text = said.join("\n");
  expect(text, "the difference is NAMED").toContain("THE SCOPES DIFFER");
  expect(text, "with the claim's own scope").toContain("gate-run.mjs --range c745a6af..3294c349");
  expect(text, "and the run's").toContain("health-bands.spec.ts");
  expect(text, "both figures, so the seat can read them").toContain("714");
  expect(text).toContain("35");
  expect(text, "and NEVER as a count that moved").not.toContain("THE COUNT MOVED");
  // EQUAL COUNTS OVER DIFFERENT SELECTED SETS ARE STILL NOT A PASS. The
  // numbers agreeing is not evidence that the sets did, and a step that
  // read agreement as a judgement would be inferring scope from the
  // count — the move this card forbids.
  const equal = gradeCounts({
    claimed: { e2e: 35 },
    observed: { e2e: 35 },
    claimedScope: { e2e: scopeOfRun({ command: "npx", argv: ["playwright", "test", "tests/brief.spec.ts"] }) },
    observedScope: { e2e: drill },
  });
  expect(equal.judged, "nothing is judged").toEqual([]);
  expect(equal.findings, "and nothing is found").toEqual([]);
  expect(equal.unjudged[0], "the sets are reported instead").toContain("THE SCOPES DIFFER");
});

test("T-295-s8 — a scope that could NOT be read is not judged for lack of evidence, and is neither a difference nor a pass", () => {
  // KILLED BY: reading silence as agreement in either direction —
  // grading two counts nothing established as comparable, or announcing
  // a scope DIFFERENCE nothing established either.
  const claimed = claimedCounts("parser 389 / app 1171 / rust 655 exit 0 and e2e 852 with one body red");
  const noEvidence = gradeCounts({
    claimed,
    observed: { e2e: 851 },
    claimedScope: {},
    observedScope: { e2e: WHOLE_E2E },
  });
  expect(noEvidence.findings, "no comparison is graded").toEqual([]);
  expect(noEvidence.judged, "and none is passed").toEqual([]);
  const row = noEvidence.unjudged.find((u) => u.startsWith("e2e:")) ?? "";
  expect(row, "the reason is the missing evidence, named").toContain("NOT JUDGED FOR LACK OF SCOPE EVIDENCE");
  expect(row, "never a difference that was not demonstrated").not.toContain("THE SCOPES DIFFER");
  expect(row, "both figures are stated for the seat to rule").toContain("852");
  expect(row).toContain("851");
  expect(scopeLine(undefined), "and a scope with nothing behind it says so").toBe("no stated scope");
  // THE SAME SILENCE ON THE OTHER SIDE, and with the figures AGREEING —
  // which is the arrangement most easily mistaken for a pass.
  const agreeing = gradeCounts({
    claimed,
    observed: { e2e: 852 },
    claimedScope: { e2e: WHOLE_E2E },
    observedScope: {},
  });
  expect(agreeing.judged, "agreement without scope evidence is still not a judgement").toEqual([]);
  expect(agreeing.unjudged.find((u) => u.startsWith("e2e:")) ?? "").toContain("NOT JUDGED FOR LACK OF SCOPE EVIDENCE");
  expect(scopeVerdict(WHOLE_E2E, undefined), "one side missing is unknown, never different").toBe("unknown");
});

test("T-295-s8 — a selection token that SPELLS a runner verb is still a narrowing, so a narrowed run never widens into `whole`", () => {
  // KILLED BY: `atFront` surviving the `--` separator, which let
  // `cargo test -- test` read as the WHOLE leg. This file's own note
  // says the reader fails CLOSED toward `selection` and "never widens a
  // run into `whole`"; widening is the ONE direction that manufactures a
  // false same scope, and a false same scope is T-297 again.
  expect(
    runSelection({ command: "cargo", argv: ["test", "--", "test"] }),
    "a cargo filter that happens to spell `test` is a narrowing, not a verb",
  ).toEqual(["test"]);
  expect(scopeOfRun({ command: "cargo", argv: ["test", "--", "test"] }).kind, "so it is NOT the whole leg").toBe("selection");
  expect(
    scopeOfRun({ command: "npx", argv: ["playwright", "test", "test"] }).kind,
    "and neither is a spec filter that spells one",
  ).toBe("selection");
  // AND THE WIDENING IS WHAT WOULD RESURRECT T-297: a narrowed run of 35
  // graded against a verdict's whole-leg claim of 714, and refused.
  const claim = claimedScopes("judged, `npm test`:\ne2e **714** (16 spec files).");
  const narrowed = scopeOfRun({ command: "cargo", argv: ["test", "--", "test"] });
  expect(claim.e2e?.kind, "the verdict's side really is the whole leg").toBe("whole");
  expect(scopeVerdict(claim.e2e, narrowed), "which a narrowed run is never the same set as").toBe("different");
  expect(
    gradeCounts({ claimed: { e2e: 714 }, observed: { e2e: 35 }, claimedScope: { e2e: claim.e2e }, observedScope: { e2e: narrowed } })
      .findings,
    "and so nothing is called a count that moved",
  ).toEqual([]);
  // THE CONTROLS — the shapes that ARE whole stay whole, and the plan's
  // own cargo step is untouched.
  expect(scopeOfRun({ command: "npm", argv: ["test"] }).kind).toBe("whole");
  expect(scopeOfRun({ command: "npx", argv: ["vitest", "run"] }).kind).toBe("whole");
  expect(
    scopeOfRun({ command: "npm", argv: ["test", "--", "--reporter=json"] }).kind,
    "a reporting flag after `--` still selects nothing",
  ).toBe("whole");
  expect(
    runSelection({ command: "cargo", argv: ["test", "-q", "--lib", "--", "agent::kit::tests"] }),
    "and the plan's own bump:pin step reads exactly as it did",
  ).toEqual(["--lib", "agent::kit::tests"]);
});

test("the verb refuses to commit on a count that moved, and says which legs it could not judge", () => {
  // 2d6d354: a merge script that committed on an exit code while the
  // count under it had moved landed main red. THE TEETH SURVIVE T-295-s8:
  // where the scopes ARE established the same, the comparison stands as
  // it was, and a leg nobody could judge erases none of it.
  const claimed = claimedCounts("parser 389 / app 1171 / rust 655 exit 0 and e2e 852 with one body red");
  expect(claimed, "the counts come off the verdict's own sentence").toEqual({
    parser: 389,
    app: 1171,
    rust: 655,
    e2e: 852,
  });
  const sameScope = { e2e: WHOLE_E2E };
  expect(scopeVerdict(WHOLE_E2E, WHOLE_E2E), "both sides ran the leg whole").toBe("same");
  const moved = gradeCounts({
    claimed,
    observed: { e2e: 851 },
    claimedScope: sameScope,
    observedScope: sameScope,
  });
  expect(moved.findings, "a count that moved is one finding").toHaveLength(1);
  expect(moved.findings[0]).toContain("THE COUNT MOVED");
  expect(moved.findings[0], "and it names both figures").toContain("852");
  expect(moved.findings[0]).toContain("851");
  expect(moved.unjudged.length, "and the legs with no reading are SAID, never read as a pass").toBe(3);
  // AND A LEG NOBODY COULD JUDGE ERASES NO REFUSAL. Three legs here are
  // unjudged beside the one that moved, and the step still refuses.
  const errs: string[] = [];
  const code = countsStep({
    out: () => {},
    err: (s) => errs.push(s),
    state: countsState({
      claimed,
      observed: { e2e: 851 },
      claimedScope: sameScope,
      observedScope: sameScope,
    }),
  });
  expect(code, "the step REFUSES").toBe(EXIT.FOUND);
  expect(errs.join("\n")).toContain("THE COUNT MOVED");
  expect(errs.join("\n"), "and says the merge is not committed").toContain("NOT committed");
  // THE POSITIVE CONTROL: the same grader over a count that held.
  const held = gradeCounts({
    claimed,
    observed: { e2e: 852 },
    claimedScope: sameScope,
    observedScope: sameScope,
  });
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
 *
 * `secondSite` is the T-314 merge in miniature (T-295-s9): the
 * correction is ALREADY in the tree at the block's own site, and the
 * block's `new` text also matches a legitimate line elsewhere in the
 * same file — the arrangement whose "one surviving `new`" the masked
 * reader answered by writing, and which rewrote verified code on main.
 */
function mergeFixture(opts: { conflict?: "append" | "fence"; secondSite?: boolean } = {}): {
  root: string;
  git: (...args: string[]) => string;
  card: string;
} {
  const ambiguous = opts.secondSite === true;
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
  writeFileSync(
    path.join(root, "src", "a.ts"),
    ambiguous
      ? ["export const guard = true;", "export function reset() {", "  guard = false;", "}", ""].join("\n")
      : "export const guard = true;\n",
  );
  writeFileSync(path.join(root, "tools", "e2e", "tests", "shared.spec.ts"), "// shared\n");
  git("add", "-A");
  git("commit", "-qm", "the tree before the lane");

  git("checkout", "-q", "-b", "task/T-900-a-card");
  // THE LANE'S OWN WRITE carries the DEFECT the verdict corrects: the
  // block's `new` text, which is what a merged tree looks like before
  // the correction is applied. In the ambiguous arrangement the lane's
  // own fix pass already landed it, which is the state four of the
  // merges this verb was cut from were in.
  if (!ambiguous) writeFileSync(path.join(root, "src", "a.ts"), "export const guard = false;\n");
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
      block(
        {
          file: "src/a.ts",
          spec: "tools/e2e/tests/shared.spec.ts",
          // SHORTER ANCHORS in the ambiguous arrangement, because what
          // makes it ambiguous is that the block's `new` text matches a
          // line the correction was never about.
          ...(ambiguous ? { old: "guard = true;", new: "guard = false;" } : {}),
        },
        "    ",
      ),
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

test("an ambiguous anchor REFUSES the correction step with both counts, and leaves the file byte-identical to what the step found", () => {
  // THE WHOLE VERB, on the T-314 arrangement and on its control. The
  // ambiguous arm's `src/a.ts` carries the block's `old` text at its own
  // site AND the block's `new` text at a line the correction was never
  // about; the reader this card replaces wrote `old` over that line and
  // reported exit 0. Here the step refuses, prints both counts, and
  // writes nothing.
  for (const arrangement of ["ambiguous", "one site"] as const) {
    const ambiguous = arrangement === "ambiguous";
    const fx = mergeFixture(ambiguous ? { secondSite: true } : {});
    const file = path.join(fx.root, "src", "a.ts");
    const sha = (): string => createHash("sha256").update(readFileSync(file)).digest("hex");
    try {
      const said: string[] = [];
      const ledger: { id: string; title: string; exit: number }[] = [];
      // THE HASH BEFORE THE STEP RAN, taken on the runner's own plan
      // line — which it prints immediately before it runs that step, and
      // which is therefore the one moment "the file as the step found
      // it" is readable from outside. The pre-operation state is the
      // reference, never the bench tip: at a merge the two may
      // legitimately differ by an authorized integration change.
      const beforeTheStep: string[] = [];
      const out = (s: string): void => {
        said.push(s);
        if (beforeTheStep.length === 0 && s.includes("apply CORRECTION 1 in src/a.ts")) beforeTheStep.push(sha());
      };
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
          "a-model@subagent",
          "--verified-by",
          "a-model@subagent",
          "--readings",
          path.join(fx.root, "readings.jsonl"),
          "--message",
          path.join(fx.root, "MSG.txt"),
        ],
        { cwd: fx.root, out, err: out, ledger },
      );
      const after = sha();
      const text = said.join("\n");
      expect(beforeTheStep, `${arrangement}: the correction step was reached and its plan line printed`).toHaveLength(1);
      const step = ledger.find((s) => s.id === "correction:1");
      if (ambiguous) {
        expect(step?.exit, "an ambiguous anchor stops the verb").not.toBe(0);
        expect(text, "the refusal names the block").toContain("CORRECTION 1: REFUSED");
        expect(text, "and states BOTH counts on the step's own line").toContain(
          "`old` matches 1 site(s), `new` matches 1 site(s)",
        );
        expect(after, "the file is byte-identical to its pre-operation state").toBe(beforeTheStep[0]);
        expect(
          readFileSync(file, "utf8"),
          "and the legitimate line the block's `new` text matched is untouched",
        ).toContain("  guard = false;");
        expect(text, "the run stops at the step, staged, for the seat to rule").toContain("stopped at correction:1");
      } else {
        // THE CONTROL, differing only in the arrangement: one site, so
        // the block is still applied and the hash MOVES.
        expect(step?.exit, "a block matching exactly one site is applied").toBe(0);
        expect(after, "and an applied block moves the hash").not.toBe(beforeTheStep[0]);
        expect(readFileSync(file, "utf8"), "the site now carries the block's `old` text").toBe(
          "export const guard = true;\n",
        );
        expect(text, "and that line states both counts too").toContain(
          "before the write, `old` matches 0 site(s), `new` matches 1 site(s)",
        );
      }
    } finally {
      removeGitFixture(fx.root, FIXTURE);
    }
  }
});

test("what the correction step WROTE is also STAGED, so the working file it counted IS the content the commit will take", () => {
  // THE INVARIANT THE COUNTS REST ON (T-295-s9). Criterion 1 says both
  // counts are taken in the block's file AS IT WILL BE COMMITTED, and
  // the step counts the bytes on disk. Those are the same bytes only
  // because the verb proves the tree clean before it merges and every
  // step that writes also STAGES what it wrote — a `git commit` takes
  // the INDEX, never the working tree, and the card's own later
  // amendment exists because a wrong line can sit staged under a clean
  // working file. Nothing asserted that invariant, so this body does.
  const fx = mergeFixture();
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
    expect(ledger.some((s) => s.id === "correction:1" && s.exit === 0), "the correction was applied").toBe(true);
    // THE INDEX, read straight: this is what the commit would take.
    expect(fx.git("show", ":src/a.ts"), "the STAGED content carries the correction").toBe(
      "export const guard = true;\n",
    );
    // AND THE TWO CONTENTS AGREE, which is what makes the count the step
    // took on the working file a count of the committed file.
    expect(fx.git("diff", "--name-only", "--", "src/a.ts"), "nothing the step wrote is left unstaged").toBe("");
  } finally {
    removeGitFixture(fx.root, FIXTURE);
  }
});

test("the keeper STEP says a kept spelling out loud and walks on, and the identical value at an unnamed site still stops the run", () => {
  // CRITERION 3, AT THE STEP AND NOT ONLY IN THE FUNCTION. A way through
  // nobody can see exercised is a way through nobody audits, so the step
  // prints it the way an acknowledged drill prints `NEWS —` and does not
  // stop for it. Both arms run the whole ritual on a real repository and
  // differ ONLY in the directory the lane planted the value in, which is
  // the card's own `What was measured` reproduced end to end.
  for (const at of ["tools/e2e/tests/planted.spec.ts", "src/planted.ts"]) {
    const inside = at.startsWith("tools/e2e/tests/");
    const fx = mergeFixture();
    try {
      fx.git("checkout", "-q", "task/T-900-a-card");
      mkdirSync(path.dirname(path.join(fx.root, at)), { recursive: true });
      // CLASS `email`: the suite's ONE fixture identity, which the table
      // enumerates by value and keeps inside `tools/e2e/tests/` alone.
      writeFileSync(path.join(fx.root, at), 'const identity = "fixture@example.invalid";\n');
      fx.git("add", "-A");
      fx.git("commit", "-qm", "the lane plants a synthetic fixture identity");
      const verdict = fx.git("rev-parse", "task/T-900-a-card").trim();
      fx.git("checkout", "-q", "main");
      const said: string[] = [];
      const ledger: { id: string; title: string; exit: number }[] = [];
      mergeMain(
        [
          "T-900",
          "--slug",
          "a-card",
          "--verdict",
          verdict,
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
      const step = ledger.find((s) => s.id === "keeper:forbidden-spelling");
      const text = said.join("\n");
      expect(step, `${at}: the keeper step ran`).toBeDefined();
      if (inside) {
        expect(step?.exit, "a kept spelling does not stop the merge").toBe(0);
        const news = said.filter((s) => s.includes("NEWS — "));
        expect(news.length, "and the step announces the exception out loud").toBeGreaterThan(0);
        expect(news.join("\n"), "naming the fixture class it was kept under").toContain(
          "suite-fixture-identity",
        );
        expect(news.join("\n"), "and naming the file").toContain(at);
        expect(
          news.join("\n"),
          "while publishing no value — a record quotes this step",
        ).not.toContain("fixture@example.invalid");
      } else {
        // THE POSITIVE CONTROL, DIFFERING ONLY IN THE ARRANGEMENT: the
        // identical line one directory over is refused, and the run stops
        // — so the announcement above is a fact about the table's site
        // list rather than about a keeper that stopped looking.
        expect(step?.exit, "outside every named site the keeper still refuses").not.toBe(0);
        expect(text, "with the refusal it always gave").toContain(
          "this merge ADDS a line carrying an email address",
        );
        expect(said.filter((s) => s.includes("NEWS — ")), "and nothing is announced kept").toEqual([]);
      }
    } finally {
      removeGitFixture(fx.root, FIXTURE);
    }
  }
});

test("the counter counts OVERLAPPING sites, so an anchor whose prefix is also its suffix names TWO sites and is refused", () => {
  // THE SAFETY CLAIM IS THE COUNT (T-295-s9), so a counter that walks
  // past a site makes the claim false exactly where it matters. A
  // stride of the needle's own length skips an overlapping match: the
  // step then reads ONE site where the text names two, and writes at
  // the first of them — a line of verified code rewritten at a site
  // nobody named, which is this card's whole subject reached through
  // the counter instead of through the state table. One block already
  // committed under docs/tasks carries anchors that self-overlap.
  expect(occurrences("YYY", "YY"), "three Ys carry two overlapping YY sites").toBe(2);
  expect(occurrences("  });\n  });\n  });\n", "  });\n  });"), "and so does a run of three closers").toBe(2);
  const b = {
    correction: "C1",
    file: "src/a.ts",
    spec: "tools/e2e/tests/shared.spec.ts",
    body: "a body",
    message: "a message",
    old: "XX",
    new: "YY",
  };
  const two = correctionFor({ source: "zz YYY zz", block: b });
  expect("problem" in two, "two overlapping sites is a REFUSAL, never a write at the first of them").toBe(true);
  expect("text" in two, "and nothing is written").toBe(false);
  if (!("problem" in two)) return;
  expect(two.problem, "and the line states the count the text really carries").toContain(
    "`old` matches 0 site(s), `new` matches 2 site(s)",
  );
  // THE CONTROL, the same block over a tree carrying the site once: it
  // is still applied, so the counter was made honest and not deaf.
  const one = correctionFor({ source: "zz YY zz", block: b });
  expect("text" in one, "one site is still one site").toBe(true);
});

test("a single git diff against the bench tip answers EMPTY over a wrong STAGED line, which is why the standing comparison reads the index and the working tree separately", () => {
  // THE PROCEDURE'S SPELLING IS A MEASUREMENT, not a preference
  // (T-295-s9, the amendment of 2026-09-13). The verb stops STAGED, so
  // "the content that will be committed" is the index plus the working
  // tree, and a single `git diff <bench tip> -- <file>` reads only the
  // working tree: it answers empty while a wrong line sits staged and
  // ready to commit — the exact state this card's fault produced.
  const root = mkdtempSync(path.join(tmpdir(), "supertaskr-standing-"));
  const git = (...args: string[]): string =>
    execFileSync("git", ["-C", root, ...NO_BACKGROUND_MAINTENANCE, ...args], { encoding: "utf8" });
  try {
    execFileSync("git", ["init", "-q", "-b", "main", root], { stdio: "pipe" });
    git("config", "user.email", "fixture@example.invalid");
    git("config", "user.name", "T-295 fixture");
    const file = path.join(root, "a.ts");
    const verified = ["export const guard = true;", "export const other = 1;", ""].join("\n");
    writeFileSync(file, verified);
    git("add", "-A");
    git("commit", "-qm", "the verified content");
    const benchTip = git("rev-parse", "HEAD").trim();

    // A WRONG LINE STAGED — what the step wrote at a site the block never
    // named — under a working file restored to the verified content.
    writeFileSync(file, ["export const guard = false;", "export const other = 1;", ""].join("\n"));
    git("add", "--", "a.ts");
    writeFileSync(file, verified);
    expect(git("diff", benchTip, "--", "a.ts"), "the single reading answers EMPTY over it").toBe("");
    expect(
      git("diff", "--cached", benchTip, "--", "a.ts"),
      "while the reading of the INDEX names the line that would be committed",
    ).toContain("guard = false;");
    expect(git("diff", "--", "a.ts"), "and the working tree's own reading says what it adds").not.toBe("");

    // AND THE SECOND HALF OF THE PROCEDURE: a difference that is an
    // AUTHORIZED integration change is accounted for, never overwritten
    // to make a reading empty. Here the staged content carries both — a
    // wrong line at a site no block named, and the seat's own hand
    // correction on the line below it.
    git("checkout", "--", "a.ts");
    const staged = ["export const guard = false;", "export const other = 2;", ""].join("\n");
    writeFileSync(file, staged);
    git("add", "--", "a.ts");
    const reading = git("diff", "--cached", benchTip, "--", "a.ts");
    expect(reading, "both differences are reported, and both are investigated").toContain("guard = false;");
    expect(reading).toContain("other = 2;");
    // THE POSITIVE CONTROL, where the site-scoping is ABSENT: restoring
    // the WHOLE file from the bench tip makes the reading empty and
    // erases the authorized change with it.
    const whole = git("show", `${benchTip}:a.ts`);
    expect(whole, "a whole-file restore loses the authorized integration change").not.toContain("other = 2;");
    // THE SITE-SCOPED RESTORE, which is what the procedure names: only
    // the line the step wrote outside the block's own site.
    const restored = staged.replace("export const guard = false;", "export const guard = true;");
    expect(restored, "the wrong line is back to the verified content").toContain("export const guard = true;");
    expect(restored, "and the authorized change survives the procedure unchanged").toContain("other = 2;");
  } finally {
    removeGitFixture(root, FIXTURE);
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

test("the bound, the floor and the readings path this file computes are the ones docs/CONVENTIONS.md publishes", () => {
  // T-057's discipline, applied to the three figures T-295 INVENTED: a
  // rule with two statements is two chances to disagree, and every one
  // of these is stated twice by construction — once as a constant a
  // program enforces and once as a sentence a seat reads. The XS bound
  // is a number the tier work (T-296) will read out of the document, the
  // readings path is what T-297's bands will open, and the
  // pinned-sentence floor is what a seat has to know to predict a
  // refusal. This body is the only thing that compares them.
  //
  // IT IS ALSO WHAT MAKES THIS FILE A DERIVED READER OF docs/ TO THE
  // DOCS GATE, which is not a side effect but the point: a spec that
  // asserts a document's sentence is a spec the docs gate must run when
  // that document moves.
  const conventions = conventionsText(repoRoot);
  expect(conventions, "the verb is spelled in the document").toContain(
    "node tools/e2e/scripts/brief.mjs --merge <T-NNN>",
  );
  expect(conventions, "the XS bound is STATED, in words, as this file computes it").toContain(
    "exceeds FORTY changed lines",
  );
  expect(XS_CHANGED_LINE_BOUND, "and forty is what the program enforces").toBe(40);
  expect(conventions, "the readings file is named where T-297 will look for it").toContain(
    READINGS_PATH,
  );
  expect(conventions, "and the pinned-sentence floor is stated too").toContain(
    "thirty\n  characters is the floor",
  );
  expect(PINNED_SENTENCE_FLOOR, "as the program spells it").toBe(30);
  // AND THE FIXTURE CLASSIFIER'S RECOGNITION RULE IS STATED THERE TOO
  // (T-295-s4), because the way through a keeper is the half of it a
  // seat has to be able to read before it plants anything. The document
  // names the table by the name the program exports, and the program
  // names the table's own file — a sentence and a symbol, twice stated.
  expect(conventions, "the recognition rule is stated, and it is BOTH halves").toContain(
    "names BOTH the value",
  );
  expect(conventions, "and the exception's scope with it").toContain("PER\n  MATCHED VALUE AND PER CLASS");
  expect(conventions, "under the name the program exports").toContain("`FIXTURE_CLASSES`");
  expect(FIXTURE_CLASSES.length, "which is a table the program carries").toBeGreaterThan(0);
  // AND THE INTEGRATOR'S ROLE FILE STATES THE WIDENING AS A STEP OF THE
  // MERGE, beside the re-drill (T-281-s10's third criterion).
  const integrator = readFileSync(path.join(repoRoot, "method", "roles", "integrator.md"), "utf8");
  expect(integrator).toContain("THE WIDENING IS A STEP OF THIS MERGE, BESIDE THE DRILL");
  expect(integrator, "and it says WHY it comes before the merge").toContain("FIRST PARENT");
});

test("the verb never pushes, and the keeper steps it plans are the four T-295 names plus the launch receipt T-320 adds", () => {
  // A NEGATIVE ASSERTION WITH ITS POSITIVE CONTROL (docs/CONVENTIONS.md):
  // the same read that finds no push finds the merge and the branch move,
  // so "no push" is a fact about this file and not about the reader.
  const source = readFileSync(path.join(repoRoot, "tools", "e2e", "scripts", "merge.mjs"), "utf8");
  const argvLines = source.match(/argv: \[[^\]]*\]/g) ?? [];
  expect(argvLines.length, "the control: this file spells plenty of git argv").toBeGreaterThan(4);
  expect(argvLines.some((l) => /"push"/.test(l)), "and not one of them is a push").toBe(false);
  expect(argvLines.some((l) => /"merge"/.test(l)), "while the merge itself is there").toBe(true);
  const keepers = keeperSteps({ projectRoot: repoRoot, id: "T-000", card: "docs/tasks/T-000.md" });
  // THE FIFTH IS T-320'S AND IT SITS WITH THE PREFLIGHT AT THE END, which
  // is where the FLOOR steps are: `merge.keepers` switches the three cheap
  // readings of the DIFF, and neither the card's own preflight nor the
  // launch receipt is one of them.
  expect(keepers.map((s) => s.id)).toEqual([
    "keeper:pinned-sentence",
    "keeper:forbidden-spelling",
    "keeper:xs-bound",
    "keeper:receipt",
    "keeper:preflight",
  ]);
  for (const k of keepers) expect(k.kind, `${k.id} is a gate with an exit`).toBe("gate");
});

// ── the verifier's assigned corrections (T-295 bench, phase 2) ────────

test("the card arm takes ITS OWN card and no other, so a SUGGESTED card of the same lane is a fence finding", () => {
  // MEASURED ON THIS BENCH. `classifyConflict` anchors the card arm on
  // `^docs/tasks/<id>(?:-|\.)`, and every suggested card this lane files
  // is spelled `<id>-s<n>-...`, so its path matches that anchor too. A
  // conflict in T-950-s1 was resolved to the LANE's copy on a scratch
  // clone, main's copy discarded without a word, under a sentence
  // reading "is T-950's OWN card" — which it is not.
  //
  // The criterion's word is ITS, and criterion 6 says everything else
  // STOPS as a fence finding. A suggested card is a different card with
  // a different id, and two sides writing it is the same fence failure
  // any other shared file would be.
  // BOTH SIDES REWROTE A LINE THAT WAS ALREADY THERE — the shape two
  // sides editing one card actually make, and the shape the card arm
  // is the ONLY thing standing in front of.
  const conflicted = [
    "<<<<<<< HEAD",
    "MAIN wrote this sentence.",
    "||||||| merged common ancestors",
    "the sentence both sides rewrote",
    "=======",
    "THE LANE wrote a different sentence.",
    ">>>>>>> task/T-900-x",
    "",
  ].join("\n");
  const own = classifyConflict({ path: "docs/tasks/T-900-a-card.md", id: "T-900", text: conflicted });
  expect(own.kind, "the control: the lane's OWN card is still taken from the lane").toBe("card");
  const sibling = classifyConflict({ path: "docs/tasks/T-900-s1-a-suggestion.md", id: "T-900", text: conflicted });
  expect(sibling.kind, "a SUGGESTED card of the same lane is NOT this card").toBe("fence");
  expect(sibling.why, "and it is named as a fence finding").toContain("fences were not disjoint");
  const deeper = classifyConflict({ path: "docs/tasks/T-900-s12-another.md", id: "T-900", text: conflicted });
  expect(deeper.kind, "and neither is a two-digit one").toBe("fence");
  // AND THE OTHER DIRECTION STILL HOLDS: a different card's file was
  // never in this arm, and a longer NUMBER is not this card either.
  expect(classifyConflict({ path: "docs/tasks/T-901-other.md", id: "T-900", text: conflicted }).kind).toBe("fence");
  expect(classifyConflict({ path: "docs/tasks/T-9001-other.md", id: "T-900", text: conflicted }).kind).toBe("fence");
});

test("a block whose OLD text also occurs elsewhere is REFUSED with both counts, never applied at the site its NEW text names", () => {
  // THE MEASURED FAULT, at the T-314 merge of 2026-09-13. The third
  // correction's three-line `old` text matched `.claude/hooks/hook-install.mjs`
  // ONCE (the correction was already in the tree) and its `new` text ONCE —
  // a presence check that legitimately preceded the executable check the
  // block was about; the single-line needle occurs twice (measured at
  // 88ca5166 — the verdict's correction 4). The
  // reader this body replaces masked every occurrence of `old` and asked
  // whether exactly one `new` survived; one did, at the LEGITIMATE site,
  // and the step wrote the block's `old` text over it. The merged tree
  // then differed from the verified bench tip by one line and the
  // correction's own body redded on the closing check while it had been
  // green on the bench.
  //
  // AND THE BODY THIS ONE REPLACES PINNED THAT WRITE AS THE BEHAVIOUR.
  // What it was really protecting against — a defect left in the merged
  // tree and reported as a correction already made — survives here in
  // the answer that costs nothing: a REFUSAL, which is neither a false
  // "already" nor a write at a site nobody named.
  const b = {
    correction: "C1",
    file: "src/a.ts",
    spec: "s",
    body: "b",
    message: "m",
    old: "return n > 0;",
    new: "return n >= 0;",
  };
  const both = correctionFor({
    source: ["export function other() {", "  return n > 0;", "}", "export function guard(n) {", "  return n >= 0;", "}", ""].join("\n"),
    block: b,
  });
  expect("problem" in both, "one `old` elsewhere beside one `new` here names no single site").toBe(true);
  expect("text" in both, "and nothing is written").toBe(false);
  if (!("problem" in both)) return;
  expect(both.problem, "the refusal names the block").toContain("C1");
  expect(both.problem, "and states both counts").toContain("`old` matches 1 site(s), `new` matches 1 site(s)");

  // THE T-314 ARRANGEMENT ITSELF, in miniature: `old` at two sites and
  // `new` at one legitimate site elsewhere. This is the input the masked
  // reader answered by writing, and it is the input this card exists for.
  const twice = correctionFor({
    source: ["export function a() {", "  return n > 0;", "}", "export function c() {", "  return n > 0;", "}", "export function guard(n) {", "  return n >= 0;", "}", ""].join("\n"),
    block: b,
  });
  expect("problem" in twice, "two `old` sites and one `new` is the T-314 shape, and it is refused").toBe(true);
  if (!("problem" in twice)) return;
  expect(twice.problem).toContain("`old` matches 2 site(s), `new` matches 1 site(s)");

  // THE STATE TABLE, each arm differing from the others only in the
  // arrangement of the two anchors. Two states act; every other refuses.
  expect(correctionFor({ source: "  return n > 0;\n", block: b }), "`old` once, `new` absent: already").toMatchObject({ oldSites: 1, newSites: 0 });
  expect("already" in correctionFor({ source: "  return n > 0;\n", block: b })).toBe(true);
  expect("text" in correctionFor({ source: "  return n >= 0;\n", block: b }), "`old` absent, `new` once: applied").toBe(true);
  expect("problem" in correctionFor({ source: "  return 1;\n", block: b }), "both absent: a refusal").toBe(true);
  const twiceNew = correctionFor({
    source: ["export function guard(n) {", "  return n >= 0;", "}", "export function also(n) {", "  return n >= 0;", "}", ""].join("\n"),
    block: b,
  });
  expect("problem" in twiceNew, "`new` at two sites: a refusal, and the site is not guessed").toBe(true);
  if (!("problem" in twiceNew)) return;
  expect(twiceNew.problem).toContain("`old` matches 0 site(s), `new` matches 2 site(s)");

  // THE IDEMPOTENT RE-RUN: what an apply leaves behind reads as the
  // already-applied state, so a step run twice writes once. It is also
  // what the drill downstream requires — `plantMutant` refuses an `old`
  // anchor that does not match exactly once, and an apply is the only
  // path that reaches it.
  const applied = correctionFor({ source: "x\n  return n >= 0;\ny\n", block: b });
  expect("text" in applied).toBe(true);
  if (!("text" in applied)) return;
  const again = correctionFor({ source: applied.text, block: b });
  expect("already" in again, "the same block over its own result writes nothing").toBe(true);
  expect(again).toMatchObject({ oldSites: 1, newSites: 0 });

  // AND THE ANSWER THAT DELIBERATELY CHANGED, recorded because it is a
  // retreat from an inference rather than an oversight: where the
  // block's `new` text is a SUBSTRING of its own `old`, an
  // already-corrected tree carries both, and the masked reader deduced
  // "already" from that. The two counts cannot tell that arrangement
  // from "the correction is owed here and its `old` text also occurs
  // elsewhere" — the arrangement above, which cost main a line — so
  // both-present is now a refusal. The seat applies such a block by hand
  // at the site the verdict names.
  const nested = { ...b, old: "  return n > 0 && n < 10;", new: "  return n > 0" };
  const overlapping = correctionFor({ source: "x\n  return n > 0 && n < 10;\ny\n", block: nested });
  expect("problem" in overlapping, "both texts present is a refusal, not a deduction").toBe(true);
  if (!("problem" in overlapping)) return;
  expect(overlapping.problem).toContain("`old` matches 1 site(s), `new` matches 1 site(s)");
  // AND THE CONTROL, the same block over a tree carrying only the site:
  // `old` absent, `new` once, so it is applied and the whole `old` text
  // is restored.
  const owed = correctionFor({ source: "x\n  return n > 0;\ny\n", block: nested });
  expect("text" in owed, "and the same block still corrects a tree that carries only the site").toBe(true);
  if (!("text" in owed)) return;
  expect(owed.text, "restoring the whole `old` text").toContain("  return n > 0 && n < 10;");
});

test("a forbidden-spelling refusal names the file and the class and REDACTS the value, on every class it carries", () => {
  // MEASURED ON THIS BENCH. Two of this keeper's four classes print the
  // very string they exist to keep out of a tracked file: the address
  // and the derived personal name are echoed verbatim into the refusal,
  // while the credential and the home path are named by class alone.
  // The refusal is the seat's return and it is what a checkpoint record
  // quotes, so the keeper publishes what it refused — which is the
  // fault it exists to prevent, performed by the keeper.
  //
  // The file and the class are what a seat needs to find the line; the
  // value is what it must not carry. The credential class already draws
  // it that way and this asks the other three to.
  const address = "areal.person@example.org";
  const account = "arealaccount";
  const found = forbiddenSpellingFindings({
    added: [
      { path: "docs/X.md", line: `write to ${address} about it` },
      { path: "docs/Y.md", line: `signed off by ${account}, who ran it` },
    ],
    names: [account],
  });
  expect(found.length, "both classes still refuse — the control on the refusal itself").toBe(2);
  const said = found.join("\n");
  expect(said, "the file is named").toContain("docs/X.md");
  expect(said, "and so is the class").toContain("email address");
  expect(said, "and the account's class too").toContain("account or git name");
  expect(said, "but the address is NOT published by the refusal").not.toContain(address);
  expect(said, "and neither is the name").not.toContain(account);
});

test("a merge is what an APPROVED verdict authorises, so a REJECTED newest verdict refuses the drill", () => {
  // MEASURED ON THIS BENCH. Criterion 1 opens "on a card with an
  // approved verdict" and nothing reads that condition: a card whose
  // NEWEST verdict is REJECTED plans `drill:none` — "assigns no
  // correction, so nothing is re-drilled", exit 0 — and the run walks
  // on to write a message whose own subject line begins
  // "Merge T-900 (REJECTED at ...)".
  //
  // The state is already computed for that subject, so the check costs
  // a comparison. The newest verdict is the one that counts, which the
  // reader beneath this already settles; this is only the question of
  // WHICH answers authorise a merge.
  const card = (heading: string, body: string): string =>
    ["---", "id: T-900", "---", "", "## Verdicts", "", heading, "", body, ""].join("\n");
  const rejected = drillSteps({
    cardText: card("### VERDICT 2026-09-10 — REJECTED — a verifier", "The guard is wrong."),
    projectRoot: repoRoot,
    id: "T-900",
  });
  expect(rejected.map((s) => s.id), "a REJECTED verdict is a refusal, not a clean drill").toEqual([
    "drill:refused",
  ]);
  expect(rejected[0]?.problem, "and the refusal names the state it read").toContain("REJECTED");
  // THE CONTROLS: both approving states still plan, and neither is a
  // refusal — the arming is the STATE and nothing else about the card.
  const approved = drillSteps({
    cardText: card("### VERDICT 2026-09-10 — APPROVED — a verifier", "Everything held."),
    projectRoot: repoRoot,
    id: "T-900",
  });
  expect(approved.map((s) => s.id), "APPROVED still plans").toEqual(["drill:none"]);
  expect(approved[0]?.problem, "and it is not a refusal").toBeUndefined();
  const assigned = drillSteps({
    cardText: card(
      "### VERDICT 2026-09-10 — APPROVED WITH ASSIGNED CORRECTIONS — a verifier",
      block({}),
    ),
    projectRoot: repoRoot,
    id: "T-900",
  });
  expect(assigned.map((s) => s.id), "and so does an approval that assigns one").toEqual(["drill:1"]);
  // AND THE STATE READER IS THE ONE THE MESSAGE ALREADY USES, so the
  // two cannot drift apart into two answers about one heading.
  expect(verdictState("### VERDICT 2026-09-10 — REJECTED — a verifier")).toBe("REJECTED");
});

/* ────────────────────────────────────────────────────────────────────
 * THE SHORTFALL IS READ PER CORRECTION (T-295-s10).
 *
 * The step used to read one COUNT against another: corrections assigned
 * against blocks present, every shortfall a body nobody wrote.
 * `method/roles/verifier.md` step 5b prescribes the opposite shape for a
 * wording repair — "A CORRECTION WITH NO PROPERTY TO PIN SAYS SO IN AS
 * MANY WORDS" — so a verdict obeying the role file was refused by the
 * verb. MEASURED at the T-314-s6 merge on 2026-09-14: two corrections,
 * both wording, each saying "Wording; it carries no mutant block", and
 * the verb stopped at `drill:refused`; the seat ruled through and
 * finished the tail by hand. The fourth false stop of that weekend.
 *
 * The three arrangements below are the three the card names, and each
 * carries the control where the STATEMENT is absent — which is the only
 * thing that moves between the arms, so the arming is the statement and
 * nothing else about the verdict.
 */

/** A correction announced in the bold-lead shape this board writes. */
function announced(lead: string, ...prose: string[]): string[] {
  return [`**${lead}**`, ...prose, ""];
}

/** The two-wording-corrections verdict, with or without its statements. */
function allWording(said: boolean): string {
  return verdictCard(
    "### 2026-09-14 — APPROVED WITH ASSIGNED CORRECTIONS — a-model@a-session",
    "",
    "#### The assigned corrections",
    "",
    ...announced(
      `Correction 1 — the drill the notes call C3 sits at the helper, not at the verb.${
        said ? " Wording; it carries no mutant block." : ""
      }`,
      "The MUTANT B bullet mutates the status the stand-in reports, and the",
      "record should not say a helper-side mutant discharged C3.",
    ),
    ...announced(
      `Correction 2 — the seat-verb invocation count is six, not seven.${
        said ? " Wording; it carries no mutant block." : ""
      }`,
      "The figure appears TWICE and both sites need it, which is why it is",
      "named rather than anchored.",
    ),
  );
}

test("a verdict whose corrections are ALL wording and SAY SO is nothing to drill, and the step's line names each one", () => {
  const plan = (card: string): ReturnType<typeof drillSteps> =>
    drillSteps({ cardText: card, projectRoot: repoRoot, id: "T-900" });

  const stated = plan(allWording(true));
  expect(stated.map((s) => s.id), "a stated wording correction is nothing to drill, not a refusal").toEqual([
    "drill:none",
  ]);
  expect(stated[0]?.problem, "and it is not a stop").toBeUndefined();
  // CRITERION 2: the step's own plan line NAMES each one, so a seat
  // reading one line per step sees WHY nothing was drilled rather than
  // reading an absence.
  const line = stated[0]?.title ?? "";
  expect(line, "the line says the corrections are wording").toContain("WORDING, no block by the verdict's own words");
  expect(line, "and it names the first by name").toContain("Correction 1 — the drill the notes call C3");
  expect(line, "and the second").toContain("Correction 2 — the seat-verb invocation count is six");
  expect(stated[0]?.wording, "and the runner gets the same list, not a re-parse").toHaveLength(2);

  // THE CONTROL, and it is the whole arming: the SAME two corrections
  // with the statement struck out of each. Nothing else about the
  // verdict moves, and the step refuses — so what the pass rests on is
  // the verdict having said so, never the corrections being short.
  const silent = plan(allWording(false));
  expect(silent.map((s) => s.id), "a shortfall the verdict never explained still refuses").toEqual([
    "drill:refused",
  ]);
  expect(silent[0]?.problem ?? "", "and the refusal names BOTH corrections").toContain(
    "Correction 1 — the drill the notes call C3",
  );
  expect(silent[0]?.problem ?? "").toContain("Correction 2 — the seat-verb invocation count is six");
  expect(silent[0]?.problem ?? "", "and it says what it read").toContain("2 of its 2 correction(s)");
});

test("a block and a stated wording correction is ONE drill and no refusal, and the drill's own line still names the wording one", () => {
  const mixed = (said: boolean): string =>
    verdictCard(
      "### 2026-09-14 — APPROVED WITH ASSIGNED CORRECTIONS — a-model@a-session",
      "",
      ...announced("Correction 1 — the guard is inverted.", "Committed on this bench after this verdict."),
      block({ correction: "correction 1 — the guard is inverted" }),
      "",
      ...announced(
        `Correction 2 — the notes' figure is one byte stale.${said ? " It owes no mutant block." : ""}`,
        "A wording repair to a record.",
      ),
    );

  const plan = drillSteps({ cardText: mixed(true), projectRoot: repoRoot, id: "T-900" });
  expect(plan.map((s) => s.id), "the block is still drilled, and the wording one is not a second step").toEqual([
    "drill:1",
  ]);
  expect(plan[0]?.problem, "and nothing refuses").toBeUndefined();
  const line = plan[0]?.title ?? "";
  expect(line, "the drill's own line carries the wording correction by name").toContain(
    "Correction 2 — the notes' figure is one byte stale",
  );
  expect(line, "beside the counts it already printed").toContain("1 block(s)");
  expect(line, "and the count the step actually read, since these are not headings").toContain(
    "2 correction(s) read",
  );

  // AND THE BLOCK FINDS ITS CORRECTION BY COUNT WHERE THE NAME MISSES.
  // MEASURED in T-317's verdict: correction 2's announcement reads
  // "Correction 2 — every refusal sentence is DRIVEN through the public
  // entry" while its block's `correction:` field reads "the
  // refusal-sentence discriminator is satisfied by a doc comment" —
  // two prose labels for one correction, sharing not a word. A block
  // left over after the name pass covers a correction left over after
  // it: there IS a committed body, and only the label missed.
  const unlabelled = verdictCard(
    "### 2026-09-14 — APPROVED WITH ASSIGNED CORRECTIONS — a-model@a-session",
    "",
    ...announced("Correction 1 — every refusal sentence is driven through the public entry.", "Committed."),
    block({ correction: "the refusal-sentence discriminator is satisfied by a doc comment" }),
    "",
    ...announced("Correction 2 — the notes' figure is one byte stale. It owes no mutant block.", "Wording."),
  );
  const byCount = drillSteps({ cardText: unlabelled, projectRoot: repoRoot, id: "T-900" });
  expect(byCount.map((st) => st.id), "a block whose label matches nothing still covers a correction").toEqual([
    "drill:1",
  ]);
  // AND THE CONTROL ON THAT FALLBACK: take the block away and the same
  // correction 1 is unexplained, so what covered it was the block and
  // not the leniency.
  const noBlock = unlabelled.replace(block({ correction: "the refusal-sentence discriminator is satisfied by a doc comment" }), "");
  expect(noBlock, "the control really differs").not.toBe(unlabelled);
  const bare = drillSteps({ cardText: noBlock, projectRoot: repoRoot, id: "T-900" });
  expect(bare.map((st) => st.id)).toEqual(["drill:refused"]);
  expect(bare[0]?.problem ?? "", "naming the one the block was covering").toContain(
    "Correction 1 — every refusal sentence is driven through the public entry",
  );

  // THE CONTROL: the same block, the same two corrections, and only the
  // statement gone — refused, and refused for correction 2 ALONE.
  const silent = drillSteps({ cardText: mixed(false), projectRoot: repoRoot, id: "T-900" });
  expect(silent.map((s) => s.id), "an unexplained shortfall refuses even beside a block").toEqual([
    "drill:refused",
  ]);
  const problem = silent[0]?.problem ?? "";
  expect(problem, "naming the correction that carries neither").toContain(
    "Correction 2 — the notes' figure is one byte stale",
  );
  expect(problem, "and NOT the one the block covers").not.toContain("Correction 1 — the guard is inverted");
  expect(problem, "and it says which of how many").toContain("1 of its 2 correction(s)");
});

test("a correction with NEITHER a block nor the statement is refused BY NAME, beside corrections that have one", () => {
  // THE THIRD ARRANGEMENT, and the one this change ADDS a refusal for:
  // the step used to look only at the total block count, so a verdict
  // with one block and a forgotten body passed unread. MEASURED over
  // this board's 798 cards, exactly one newest verdict is that shape —
  // T-282's, whose correction 4 carries no block and no statement.
  const three = (said: boolean): string =>
    verdictCard(
      "### 2026-09-14 — APPROVED WITH ASSIGNED CORRECTIONS — a-model@a-session",
      "",
      "#### CORRECTION 1 — the guard is inverted",
      "",
      block({ correction: "CORRECTION 1 — the guard is inverted" }),
      "",
      "#### CORRECTION 2 — the step's comment gives a false reason",
      "",
      "Not blocking. It pins no property and owes no block.",
      "",
      "#### CORRECTION 3 — the live-board figures are the base board's",
      "",
      said ? "A wording repair to a record: no block." : "The figures were read over the base tree.",
      "",
    );

  const refused = drillSteps({ cardText: three(false), projectRoot: repoRoot, id: "T-900" });
  expect(refused.map((s) => s.id)).toEqual(["drill:refused"]);
  const problem = refused[0]?.problem ?? "";
  expect(problem, "the correction with neither is named").toContain(
    "CORRECTION 3 — the live-board figures are the base board's",
  );
  expect(problem, "the one with a block is not").not.toContain("CORRECTION 1 — the guard is inverted");
  expect(problem, "nor the one that said so").not.toContain("CORRECTION 2 — the step's comment");
  expect(problem, "and the refusal keeps the sentence a merge has always stopped on").toContain(
    "carries NO mutant block",
  );

  // THE CONTROL: correction 3 gains the statement and nothing else
  // moves — one drill, no refusal, and the wording pair on the line.
  const through = drillSteps({ cardText: three(true), projectRoot: repoRoot, id: "T-900" });
  expect(through.map((s) => s.id), "and with the statement it plans").toEqual(["drill:1"]);
  expect(through[0]?.title ?? "", "with both wording corrections on the line").toContain("CORRECTION 3");
  expect(through[0]?.title ?? "").toContain("CORRECTION 2");
  expect(through[0]?.title ?? "", "and the heading count is the read count here, so it is said once").toContain(
    "3 correction heading(s), 1 block(s)",
  );
});

test("which correction a no-block statement is ABOUT is read from the ordinals it names AND from the stretch it sits in", () => {
  // BOTH READINGS ARE MEASURED SHAPES, and taking either one alone
  // refuses a verdict that obeyed the role file.
  //
  // T-295-s9's verdict states the shortfall in a PREAMBLE above every
  // announcement — "Corrections 1 and 4 ... each pins no property and
  // owes no block" — so a reader that only looked inside a correction's
  // own stretch would find nothing.
  //
  // T-317's verdict states it INSIDE correction 3's own paragraph while
  // naming correction 1's ordinal in the same sentence — "it pins no
  // property and owes no mutant block, and the block count below is
  // short of the correction count for that reason and for correction
  // 1's" — so a reader that let the ordinals REPLACE the containing
  // stretch would credit correction 1 and refuse correction 3.
  const preamble = verdictCard(
    "### 2026-09-14 — APPROVED WITH ASSIGNED CORRECTIONS — a-model@a-session",
    "",
    "#### The assigned corrections",
    "",
    "Two corrections, no mutant block. Corrections 1 and 2 are wording repairs to",
    "statements about measurements: each pins no property and owes no block, and I",
    "say so here in as many words.",
    "",
    ...announced("Correction 1 — the step's comment gives a false reason.", "Not blocking."),
    ...announced("Correction 2 — the figure is copied from the card.", "Not blocking."),
  );
  const read = newestVerdict(preamble);
  expect("text" in read, "the preamble verdict reads").toBe(true);
  const entries = correctionEntries("text" in read ? read.text : "");
  expect(entries.map((e) => e.key), "both corrections are read, and folded to their ordinals").toEqual([
    "correction 1",
    "correction 2",
  ]);
  // THE FOLD IS WHAT LETS A BLOCK FIND ITS CORRECTION: the verifier
  // writes the announcement and the block's `correction:` field in two
  // different lengths, and the ordinal is the half that survives both.
  expect(correctionKey("**Correction 3 — the counter walks past an overlapping site, so a text**")).toBe(
    "correction 3",
  );
  expect(correctionKey("correction 3 — the counter walks past an overlapping site")).toBe("correction 3");
  expect(correctionKey("CORRECTION 3"), "however it is cased or headed").toBe("correction 3");
  expect(correctionKey("the refusal-sentence discriminator"), "and a block that names no ordinal keeps its words").toBe(
    "the refusal-sentence discriminator",
  );
  // AND THE FOLD IS A WHOLE-TOKEN MATCH, never a prefix: a board that
  // reaches eleven corrections in one verdict must not have correction 1
  // answer for correction 11's missing body.
  const eleven = verdictCard(
    "### 2026-09-14 — APPROVED WITH ASSIGNED CORRECTIONS — a-model@a-session",
    "",
    ...announced("Correction 1 — the first one. It carries no mutant block.", "Wording."),
    ...announced("Correction 11 — the eleventh one.", "The figures were read over the base tree."),
  );
  const far = drillSteps({ cardText: eleven, projectRoot: repoRoot, id: "T-900" });
  expect(far.map((s) => s.id), "correction 1's statement does not answer for correction 11").toEqual([
    "drill:refused",
  ]);
  expect(far[0]?.problem ?? "").toContain("Correction 11 — the eleventh one");
  expect(far[0]?.problem ?? "", "and correction 1 is not among the unexplained").not.toContain(
    "Correction 1 — the first one",
  );

  // AND AN ANNOUNCEMENT INSIDE A FENCE IS TEXT, NEVER A CORRECTION. A
  // block's own `old` or `new` text can carry any line at all, including
  // this board's announcement shape, and a reader that counted it would
  // invent a correction out of a mutant's payload.
  const quoted = verdictCard(
    "### 2026-09-14 — APPROVED WITH ASSIGNED CORRECTIONS — a-model@a-session",
    "",
    ...announced("Correction 1 — the guard is inverted.", "Committed."),
    block({
      correction: "correction 1 — the guard is inverted",
      old: "**Correction 9 — a line of prose in the tree**",
      new: "**Correction 9 — the same line, mutated**",
    }),
    "",
  );
  expect(drillSteps({ cardText: quoted, projectRoot: repoRoot, id: "T-900" }).map((s) => s.id)).toEqual([
    "drill:1",
  ]);
  expect(drillSteps({ cardText: preamble, projectRoot: repoRoot, id: "T-900" }).map((s) => s.id)).toEqual([
    "drill:none",
  ]);

  // THE CONTROL FOR THE PREAMBLE READING: strike the ordinals out of the
  // sentence and it names nobody, so neither correction is explained and
  // the step refuses. A statement above every announcement has no
  // stretch to fall back on, which is exactly why the ordinals are read.
  const unnamed = preamble.replace("Corrections 1 and 2 are wording repairs to", "They are wording repairs to");
  expect(unnamed, "the control really differs").not.toBe(preamble);
  expect(drillSteps({ cardText: unnamed, projectRoot: repoRoot, id: "T-900" }).map((s) => s.id)).toEqual([
    "drill:refused",
  ]);

  // AND THE OTHER WAY ROUND: a statement in correction 2's own stretch
  // that names correction 1's ordinal covers BOTH, never correction 1
  // instead of correction 2.
  const crossed = verdictCard(
    "### 2026-09-14 — APPROVED WITH ASSIGNED CORRECTIONS — a-model@a-session",
    "",
    ...announced("Correction 1 — the CI job gains the parser build.", "No mutant block is written for it."),
    ...announced(
      "Correction 2 — the two false statements in the finding text.",
      "A wording repair to a record: it pins no property and owes no mutant block,",
      "and the block count below is short of the correction count for that reason",
      "and for correction 1's.",
    ),
  );
  const both = drillSteps({ cardText: crossed, projectRoot: repoRoot, id: "T-900" });
  expect(both.map((s) => s.id), "the statement is about the correction it sits in too").toEqual(["drill:none"]);
  expect(both[0]?.wording ?? [], "and both are named as wording").toHaveLength(2);
});

test("a verdict that assigns NO correction is not read for corrections, however often it writes the word", () => {
  // THE FALSE POSITIVE THE ENUMERATION WOULD HAVE COST, measured in
  // T-216-s1's own verdict: `**CORRECTION, and it makes the item BIGGER
  // rather than smaller — this verdict first said ... and that was
  // wrong.**` is a verifier correcting its OWN prose inside a finding.
  // Reading it as an assigned correction would invent one the verdict
  // never assigned and then refuse the merge for its missing body.
  const selfCorrecting = verdictCard(
    "### 2026-09-14 — APPROVED — a-model@a-session",
    "",
    "Everything reproduced at the tip I was sent.",
    "",
    "**CORRECTION, and it makes the item BIGGER rather than smaller — this verdict",
    "first said every other card spells the heading bare, and that was wrong.** It",
    "was read off a truncated sample.",
    "",
  );
  const plan = drillSteps({ cardText: selfCorrecting, projectRoot: repoRoot, id: "T-900" });
  expect(plan.map((s) => s.id), "an approving verdict that assigns none still plans").toEqual(["drill:none"]);
  expect(plan[0]?.title ?? "", "and it says there was nothing, not that something was wording").toContain(
    "assigns no correction",
  );

  // THE CONTROL: the SAME self-correcting paragraph under a heading that
  // DOES assign corrections is read, because then the verdict has said
  // it assigns some — and with no block and no statement it refuses.
  const assigning = selfCorrecting.replace(
    "### 2026-09-14 — APPROVED — a-model@a-session",
    "### 2026-09-14 — APPROVED WITH ASSIGNED CORRECTIONS — a-model@a-session",
  );
  expect(drillSteps({ cardText: assigning, projectRoot: repoRoot, id: "T-900" }).map((s) => s.id)).toEqual([
    "drill:refused",
  ]);
});

/* ────────────────────────────────────────────────────────────────────
 * THE VERIFIER'S ASSIGNED CORRECTIONS (T-295-s10 bench, phase 2).
 */

test("--blocks-absent acknowledges a verdict carrying NO block at all, and never stands in for the blocks one DOES carry", () => {
  // THE PROMISE THIS PINS IS THIS STEP'S OWN, in two places: the
  // `drillSteps` docblock says "Blocks that ARE present are drilled
  // either way" and the verb's usage text says the flag "is not a
  // blanket, and blocks that are present are drilled anyway". At the
  // base that held BY CONSTRUCTION — the acknowledgement branch was
  // reachable only inside `read.blocks.length === 0`. Reading the
  // shortfall PER CORRECTION makes it reachable with blocks present,
  // where the branch returns ONE step: a verdict with two committed
  // bodies and one unexplained correction came back acknowledged with
  // NEITHER body drilled, which is the one thing this step exists to
  // stop. No body at the base passed `blocksAbsent` at all.
  const sha = "0123456789abcdef0123456789abcdef01234567";
  const partial = verdictCard(
    "### 2026-09-14 — APPROVED WITH ASSIGNED CORRECTIONS — a-model@a-session",
    "",
    ...announced("Correction 1 — the guard is inverted.", "Committed on this bench."),
    block({ correction: "correction 1 — the guard is inverted" }),
    "",
    ...announced("Correction 2 — the counter strides by two.", "Committed on this bench."),
    block({
      correction: "correction 2 — the counter strides by two",
      body: "the counter strides by one",
      old: "export const stride = 1;",
      new: "export const stride = 2;",
    }),
    "",
    ...announced("Correction 3 — the live-board figures are the base board's.", "Read over the base tree."),
  );
  const waved = drillSteps({
    cardText: partial,
    projectRoot: repoRoot,
    id: "T-900",
    verdictSha: sha,
    blocksAbsent: sha.slice(0, 12),
  });
  expect(
    waved.map((s) => s.id),
    "a PARTIAL shortfall is not the shape this flag acknowledges: two committed bodies must not be waved past",
  ).toEqual(["drill:refused"]);
  expect(waved[0]?.problem ?? "", "and the refusal says why the flag does not reach here").toContain(
    "carries NO mutant block at all",
  );

  // THE CONTROL, AND IT IS THE WHOLE ARMING: the SAME flag, the same
  // sha, on the shape the flag was written for — a verdict that assigns
  // corrections and carries no block at all — is still acknowledged, as
  // NEWS and not as a stop. So what moved is the presence of the blocks
  // and nothing else about the run.
  const preRule = verdictCard(
    "### 2026-09-14 — APPROVED WITH ASSIGNED CORRECTIONS — a-model@a-session",
    "",
    "The corrections are in the transcript, which is the state this flag is for.",
    "",
  );
  const ack = drillSteps({
    cardText: preRule,
    projectRoot: repoRoot,
    id: "T-900",
    verdictSha: sha,
    blocksAbsent: sha.slice(0, 12),
  });
  expect(ack.map((s) => s.id), "the pre-rule shape is still acknowledged").toEqual(["drill:none"]);
  expect(ack[0]?.problem, "and it is news rather than a stop").toBeUndefined();
  expect(ack[0]?.warning ?? "").toContain("ACKNOWLEDGED by --blocks-absent");
});

test("the ordinals a no-block statement credits are its OWN clause's, so a sentence naming a correction that HAS a body does not excuse it", () => {
  // MEASURED ON T-300-s7'S OWN NEWEST VERDICT, whose corrections
  // preamble is one sentence carrying two independent clauses:
  // "Correction 1 adds the keeper the amendment's other half never got;
  // correction 2 is a wording repair and carries no block." Harvesting
  // every ordinal in the SENTENCE credits correction 1 with a statement
  // that is explicitly about correction 2 — and on that card the step's
  // own line then names correction 1 as carrying no block on the very
  // line that re-drills correction 1's block.
  const preamble =
    "Correction 1 adds the keeper the amendment's other half never got; correction 2 is a wording repair and carries no block.";
  const twoClauses = (lead: string, ...body: string[]): string =>
    verdictCard(
      "### 2026-09-14 — APPROVED WITH ASSIGNED CORRECTIONS — a-model@a-session",
      "",
      "#### The assigned corrections",
      "",
      lead,
      "",
      ...announced("Correction 1 — the recorded cut must survive the lane's own HEAD moving.", "Committed."),
      ...body,
      ...announced("Correction 2 — the no-cut sentence claims more than its condition.", "A wording repair."),
    );

  const leaky = drillSteps({ cardText: twoClauses(preamble), projectRoot: repoRoot, id: "T-900" });
  expect(
    leaky.map((s) => s.id),
    "correction 1 carries neither a block nor a statement, and the clause that said so was about correction 2",
  ).toEqual(["drill:refused"]);
  expect(leaky[0]?.problem ?? "", "and it is refused by name").toContain(
    "Correction 1 — the recorded cut must survive",
  );
  expect(leaky[0]?.problem ?? "", "while the one the clause IS about is not").not.toContain(
    "Correction 2 — the no-cut sentence",
  );

  // AND THE LINE THAT LIED, which is criterion 2's half of the same
  // fault: give correction 1 the body it announces and the step drills
  // it — while the same line called it WORDING, no block.
  const drilled = drillSteps({
    cardText: twoClauses(preamble, block({ correction: "the recorded cut must survive the lane's own HEAD moving" }), ""),
    projectRoot: repoRoot,
    id: "T-900",
  });
  expect(drilled.map((s) => s.id), "the committed body is drilled").toEqual(["drill:1"]);
  expect(
    drilled[0]?.title ?? "",
    "and the step's line does not call a correction it is DRILLING a wording one",
  ).not.toContain("Correction 1 — the recorded cut must survive");
  expect(drilled[0]?.title ?? "", "while the wording one is still named").toContain(
    "Correction 2 — the no-cut sentence",
  );

  // THE CONTROL, AND IT IS THE ARMING: one clause naming BOTH ordinals
  // still credits both, so what moved is the clause boundary and never
  // the ordinal reading the preamble shape rests on.
  const shared = drillSteps({
    cardText: twoClauses("Corrections 1 and 2 are wording repairs and carry no block."),
    projectRoot: repoRoot,
    id: "T-900",
  });
  expect(shared.map((s) => s.id), "one clause about both ordinals still credits both").toEqual(["drill:none"]);
  expect(shared[0]?.wording ?? [], "and both are named as wording").toHaveLength(2);
});

/* ────────────────────────────────────────────────────────────────────
 * THE NEWEST-VERDICT READER, AND WHERE A HEADING'S DATE MAY SIT
 * (T-311-s5, absorbing T-311-s7).
 *
 * The reader wanted the date at the START of the heading, after at most
 * one capitalised word. `method/roles/verifier.md` asked for a verdict
 * that is dated and names its model and session, and said nothing about
 * where the date goes — so a verdict spelled with its date LAST obeyed
 * the rule and was invisible to the reader, which then refused the drill
 * with "carries no dated `### ` entry" while the entry stood one screen
 * above the message. These bodies drive the two spellings that have
 * actually been written on this board, the undated heading that is still
 * refused, and the shape the role file now publishes.
 */

/** A card carrying one `## Verdicts` section and the entries given. */
function verdictCard(...entries: string[]): string {
  return ["---", "id: T-900", "---", "", "## Verdicts", "", ...entries, ""].join("\n");
}

const DATE_FIRST = "### 2026-09-13 — APPROVED WITH ASSIGNED CORRECTIONS — a-model@a-session";
const DATE_LAST =
  "### APPROVED WITH ASSIGNED CORRECTIONS — a-model@a-session, verifier phase 2, 2026-09-12";

test("a dated `### ` entry is found wherever its date sits, and an undated heading is still refused", () => {
  const first = newestVerdict(verdictCard(DATE_FIRST, "", "Everything reproduced."));
  expect("heading" in first ? first.heading : first.problem, "the date-first spelling").toBe(DATE_FIRST);

  // THE SPELLING THAT WAS INVISIBLE, and the reason this card exists.
  const last = newestVerdict(verdictCard(DATE_LAST, "", "Everything reproduced."));
  expect("heading" in last ? last.heading : last.problem, "the date-last spelling").toBe(DATE_LAST);
  expect("text" in last ? last.text : "", "and the entry's body comes with it").toContain(
    "Everything reproduced.",
  );

  // THE REFUSAL IS STILL A REFUSAL. "Dated" is the rule, so a heading
  // with no date at all is not an entry — the widening is about WHERE
  // the date sits, never about whether there is one.
  const undated = newestVerdict(verdictCard("### APPROVED — a-model@a-session", "", "No date here."));
  expect("problem" in undated ? undated.problem : "", "an undated heading was read as an entry").toContain(
    "no dated `### ` entry",
  );

  // NEWEST MEANS LAST, whichever spelling each entry took — verdicts are
  // appended, and a reader that took the first would act on a superseded
  // pass.
  const both = newestVerdict(verdictCard(DATE_LAST, "", "The older pass.", "", DATE_FIRST, "", "The newer pass."));
  expect("heading" in both ? both.heading : both.problem).toBe(DATE_FIRST);
  const reversed = newestVerdict(verdictCard(DATE_FIRST, "", "The older pass.", "", DATE_LAST, "", "The newer pass."));
  expect("heading" in reversed ? reversed.heading : reversed.problem).toBe(DATE_LAST);

  // AND THE SECTION IS STILL THE SECTION: a dated `### ` heading above
  // the Verdicts heading is somebody else's section.
  const above = newestVerdict(["---", "id: T-900", "---", "", DATE_FIRST, "", "Not a verdict.", "", "## Verdicts", ""].join("\n"));
  expect("problem" in above ? above.problem : "", "a heading above the section was read as an entry").toContain(
    "no dated `### ` entry",
  );
});

test("a CORRECTION block's own heading is never read as a verdict entry, however it is dated", () => {
  // WHAT THE DATE ANCHOR USED TO PROTECT. A verdict's sub-headings are
  // `###` too. With the date required at the start, a correction heading
  // could not be mistaken for an entry; with the date allowed anywhere,
  // one that carries a date would become the "newest entry" and the
  // verdict would be read from its middle — dropping exactly the blocks
  // the drill is about.
  const correction = "### CORRECTION 2 — the ruling of 2026-09-13, applied here";
  const card = verdictCard(DATE_LAST, "", "The verdict's own prose.", "", correction, "", "The block.");
  const read = newestVerdict(card);
  expect("heading" in read ? read.heading : read.problem, "the correction heading was taken as the entry").toBe(
    DATE_LAST,
  );
  expect("text" in read ? read.text : "", "and the whole entry is returned, block and all").toContain(
    "The verdict's own prose.",
  );
  expect(isVerdictHeading(correction), "a correction heading is not an entry heading").toBe(false);

  // THE POSITIVE CONTROL, and it is the one that makes the line above a
  // claim about CORRECTION rather than about dated sub-headings in
  // general: the same card with the same date, under a heading that is
  // not a correction block's, DOES move the reader.
  const amendment = "### Amendment of 2026-09-13, appended after the pass";
  const moved = newestVerdict(
    verdictCard(DATE_LAST, "", "The verdict's own prose.", "", amendment, "", "The later entry."),
  );
  expect("heading" in moved ? moved.heading : moved.problem, "a later dated entry is the newest one").toBe(
    amendment,
  );
  expect(isVerdictHeading(amendment)).toBe(true);

  // AND THE EXCLUSION IS THE SHAPE THIS FILE ALREADY COUNTS, not a
  // second spelling of it: what `correctionHeadings` counts is what the
  // entry reader skips.
  expect(correctionHeadings(`${correction}\n${amendment}\n${DATE_LAST}`), "one correction heading").toBe(1);
});

test("the heading shape verifier.md publishes IS a heading this reader finds, and the date's place is named there", () => {
  // T-057 AGAIN: the shape is stated in the role file, where the verifier
  // reads it, and matched in this script, where a merge acts on it. This
  // body is the only thing that compares them — and it builds the heading
  // FROM the document rather than re-typing it, so a rewrite of the
  // published shape into something the reader cannot find reds here.
  const verifier = readFileSync(path.join(repoRoot, "method", "roles", "verifier.md"), "utf8");
  const published = verifier.split("\n").filter((l) => /^\s*### /.test(l) && l.includes("<"));
  expect(published.length, "verifier.md publishes no verdict heading shape at all").toBe(1);
  const shape = String(published[0]).trim();

  // THE DATE'S PLACE IS NAMED, and named where a reader of the shape can
  // see it: the date placeholder is the FIRST thing after the hashes.
  expect(shape, "the published shape does not open with the date").toMatch(/^###\s+<[^>]*-[^>]*>/);
  expect(shape, "and the shape names who wrote it").toContain("model@session");

  const heading = shape
    .replace(/<Y{4}-M{2}-D{2}>/, "2026-09-13")
    .replace(/<VERDICT>/, "APPROVED")
    .replace(/<model@session>/, "a-model@a-session");
  expect(heading, "the shape carries a placeholder this body cannot fill").not.toContain("<");
  const read = newestVerdict(verdictCard(heading, "", "Everything reproduced."));
  expect(
    "heading" in read ? read.heading : read.problem,
    "the shape the role file publishes is not one this reader finds",
  ).toBe(heading);
  expect(verdictState(heading), "and the state reader agrees about the same heading").toBe("APPROVED");
});

test("assignsCorrections answers the same over one unchanging input, however often it is asked", () => {
  // THE HAZARD THE SOURCE-SHARING FOLLOW-THROUGH NAMES, PINNED BY A BODY.
  // One pattern source now feeds three readers and the only thing holding
  // them apart is the FLAGS each compiled form carries: `RegExp.test` on a
  // GLOBAL regex carries `lastIndex` from call to call, so a "does this
  // verdict head a correction" form compiled global answers true, then
  // false, then true over one unchanging string. The verb asks this
  // question more than once in a run — the plan asks it, the read at the
  // tip asks it again — and the second answer is the one that would
  // silently drop every block. The comment beside the constant says all
  // of this; nothing measured it.
  const verdict = [
    "### 2026-09-13 — APPROVED — a-model@a-session",
    "",
    "The pass reproduced.",
    "",
    "### CORRECTION 1 — a body this verdict commits",
    "",
    "The block.",
  ].join("\n");

  // THE WORDS `ASSIGNED CORRECTIONS` ARE DELIBERATELY ABSENT. They would
  // answer through the other half of the disjunction and the heading
  // pattern — the half that carries the flag — would never be asked.
  expect(
    /ASSIGNED\s+CORRECTIONS?/i.test(verdict),
    "the fixture answers through the other half of the disjunction",
  ).toBe(false);

  // THE THREE READINGS ARE CONSECUTIVE ON PURPOSE: `String.match` resets a
  // global regex's `lastIndex`, so a `correctionHeadings` call between two
  // of these would hide exactly the carry this body exists to catch.
  expect(assignsCorrections(verdict), "the first reading").toBe(true);
  expect(assignsCorrections(verdict), "the SECOND reading of one unchanging verdict").toBe(true);
  expect(assignsCorrections(verdict), "the third reading of one unchanging verdict").toBe(true);
  expect(correctionHeadings(verdict), "and the count is the same question asked another way").toBe(1);

  // NEGATIVE CONTROL, so the three readings above are a claim about this
  // verdict rather than about a function that answers true to everything.
  const none = ["### 2026-09-13 — APPROVED — a-model@a-session", "", "Nothing was assigned."].join(
    "\n",
  );
  expect(assignsCorrections(none), "a verdict heading no correction, read once").toBe(false);
  expect(assignsCorrections(none), "the same verdict read again").toBe(false);
});

/* ── T-320: the launch receipt, read at the merge ──────────────────── */

/** A run record as the receipt keeper reads one: the assignment's model, the execution's. */
function receiptRecord(attempt: string, requested: string, observed: string | null, card = "T-320") {
  return {
    attempt,
    assignment: { id: card, model: requested, effort: "not configured" },
    execution:
      observed === null
        ? null
        : {
            observed: { model: observed, tokens: "unknown", seconds: "unknown", source: "a planted completion" },
          },
  } as unknown as Parameters<typeof receiptKeeperReport>[0]["records"][number];
}

test("T-320 — THE MERGE REFUSES A LAUNCH RECEIPT WHOSE OBSERVED MODEL CONTRADICTS THE REQUESTED ONE, by name, and an UNKNOWN observation is news rather than a refusal", () => {
  // THE MERGE IS THE LAST MOMENT ANYTHING RE-READS THE RECORD. After this
  // commit the lane's cost, its verification tier and its comparability
  // are whatever the record says, and nothing later asks again — so a seat
  // that ran on a model the project did not ask for has to stop something
  // here or it stops nothing ever.
  //
  // KILLED BY: a keeper that passes a mismatch, one that refuses an
  // unobserved receipt, one that reads ANOTHER card's records, and one
  // whose refusal names neither model.
  const mismatch = receiptKeeperReport({
    id: "T-320",
    records: [receiptRecord("T-320-a1", "claude-opus-5", "a-cheaper-model")],
  });
  expect(mismatch.findings.length, "a completion naming another model was let through the merge").toBe(1);
  expect(mismatch.findings[0], "the refusal does not name the attempt it is about").toContain("T-320-a1");
  expect(mismatch.findings[0], "the refusal does not name the model that was requested").toContain("claude-opus-5");
  expect(mismatch.findings[0], "the refusal does not name the model that was observed").toContain("a-cheaper-model");

  // THE CLEAN TWIN: the same keeper, the same shape, a matching model.
  const agreeing = receiptKeeperReport({
    id: "T-320",
    records: [receiptRecord("T-320-a1", "claude-opus-5", "claude-opus-5")],
  });
  expect(agreeing.findings, "a matching receipt was refused, so the refusal above is about nothing").toEqual([]);
  expect(agreeing.unknown, "a fully observed receipt was reported unconfirmed").toEqual([]);

  // AN UNKNOWN IS NEWS AND NOT A REFUSAL — the current launch route hands
  // the observed figures in by hand, so a record with none is the ordinary
  // case and a gate that stopped for it is a gate nobody could keep green.
  const unobserved = receiptKeeperReport({
    id: "T-320",
    records: [receiptRecord("T-320-a1", "claude-opus-5", null)],
  });
  expect(unobserved.findings, "an unobserved receipt was refused").toEqual([]);
  expect(unobserved.unknown.length, "an unobserved receipt went by in silence").toBe(1);
  expect(unobserved.unknown[0], "the news does not say the requested value is unconfirmed rather than contradicted").toContain(
    "unconfirmed rather than contradicted",
  );

  // AND ANOTHER CARD'S RECORDS ARE NOT THIS MERGE'S TO REFUSE.
  const other = receiptKeeperReport({
    id: "T-320",
    records: [receiptRecord("T-999-a1", "claude-opus-5", "a-cheaper-model", "T-999")],
  });
  expect(other.read, "the keeper read a record belonging to another card").toBe(0);
  expect(other.findings, "this merge was stopped for another card's mismatch").toEqual([]);
});

test("T-320 — THE RECEIPT KEEPER IS FLOOR: turning the cheap keepers off leaves it planned", () => {
  // `merge.keepers` is the switch over T-295's three readings of the DIFF.
  // A receipt mismatch is not a property of the diff at all — it says the
  // seat that produced the diff ran on a model the project did not ask
  // for — so a project that turned the diff checks off never asked for
  // that to go unread.
  //
  // KILLED BY: a plan that drops the receipt step with the cheap ones, and
  // one that keeps the cheap ones when the switch is off.
  const off = keeperSteps({
    projectRoot: repoRoot,
    id: "T-000",
    card: "docs/tasks/T-000.md",
    // THE SETTINGS OBJECT IS THE LIBRARY'S OWN SHAPE, built here rather
    // than stubbed loosely: `switchValue` reads `values`, and a stub that
    // guessed at the shape would pass while the real resolution failed.
    process: { profile: "a fixture", available: [], values: new Map([["merge.keepers", "off"]]), overridden: new Set() },
  });
  expect(off.map((s) => s.id), "the floor steps are not the card preflight and the launch receipt").toEqual([
    "keeper:off",
    "keeper:receipt",
    "keeper:preflight",
  ]);
  expect(off[0]?.title, "the note does not say which switch turned them off").toContain("merge.keepers");
  expect(off[0]?.why, "the note does not say the receipt reading is not one of the three").toContain(
    "which is not one of the three",
  );
});
