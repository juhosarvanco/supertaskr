/**
 * THE RANGE RULE READER (T-091) — plain node, zero deps, no I/O at import.
 *
 * `docs/CONVENTIONS.md`'s RANGE RULE bullet is the most-consulted
 * paragraph in this repository and, until this file, the least defended.
 * Exactly three files opened that document from disk and all three are
 * blind to it: `workflow-parity.spec.ts` splits on `^## ` and keeps only
 * `Build & test`, so everything under `## Gotchas` is invisible to it;
 * `app/src-tauri/src/agent/kit.rs` asserts one substring from the FIRST
 * gotcha; `docs-input-gate.spec.ts` reads the DOCS GATE bullet and the
 * four command bullets. So every measured figure the RANGE RULE carries
 * — the 9/36/27 at `dc3ef5b`, the two-column scoreboard, the thirteen
 * flips over twelve merges, the twelve commit hashes — was poisonable to
 * any value with every reader still green. T-083 measured that three
 * times: five figures poisoned at once with four suites green, then the
 * whole correction deleted with the same four suites green, then ten
 * mutants derived from the acceptance criteria — ten mutants, zero
 * killed.
 *
 * ── THE CONTRACT ─────────────────────────────────────────────────────
 * 1. DERIVE, NEVER PIN. `git` computes on one side, the parsed bullet is
 *    read on the other, and the two sides share no constant. There is no
 *    number in this file that also appears in the document; every
 *    expectation is PARSED, and every actual is COMPUTED.
 * 2. A PARSE FAILURE THROWS. An expectation that quietly becomes empty
 *    passes everything, and nothing points at it. Every `must()` below
 *    names the sentence it could not find.
 * 3. THE PRINTED RECIPE IS EXECUTED, NEVER RE-IMPLEMENTED. The bullet
 *    prints the commands a re-deriver should run; this module extracts
 *    those strings and runs THEM. A reader that re-implements the
 *    derivation beside the doc is green over a recipe that no longer
 *    computes the published column — and the recipe is what the next
 *    re-deriver actually follows.
 * 4. EVERY COUNT IS STORED WITH THE SPELLING THAT PRODUCES IT. The
 *    bullet scores "the **31** first-parent merges on main from BOOT
 *    GATE's own merge `94ee306` through `ddcc8bb`".
 *    `94ee306..ddcc8bb` returns 30; `94ee306^..ddcc8bb` returns 31.
 *    `94ee306` is itself a merge, "from … through" is INCLUSIVE, so the
 *    figure is RIGHT and the obvious command is a different question. A
 *    reader that stores a figure apart from its range spelling invents
 *    failures as readily as it misses them, so both spellings are
 *    derived here and the gap between them is a FIXTURE.
 * 5. EVERY COUNT IS ALSO STORED WITH THE TRIGGER THAT PRODUCES IT. The
 *    flip paragraph says "Derived at `ddcc8bb`", and GRAPH REGEN's
 *    trigger has since gained `*.rs` (2026-08-25, `T-123-s5`). A gate
 *    count is a function of its gate's trigger exactly the way a path
 *    count is a function of its range, so the trigger is read out of the
 *    document AT THE REF THE PARAGRAPH NAMES, and the disk trigger is
 *    derived beside it rather than substituted for it.
 * 6. THE FLIP LISTS ARE CHECKED BY GATE, NEVER MERGED INTO ONE SET. The
 *    mutant that matters relabels T-076 from BOOT GATE to GRAPH REGEN —
 *    `T-083-s1`'s real, shipped error — and a set-equality check over
 *    all thirteen hashes passes straight through it.
 * 7. NOTHING HERE ASSERTS AGAINST A MOVING TARGET. Every ref this module
 *    reads is named by the document itself, so main gaining merges under
 *    a running lane cannot move one answer. A body that recomputed the
 *    flip list over "all merges on main" would be non-deterministic by
 *    construction.
 *
 * ── WHAT IS DELIBERATELY NOT CHECKED ─────────────────────────────────
 * The JUDGEMENT half. "The ban has to name the PAIR, not the
 * punctuation"; "presentation and correctness deserve different weight";
 * "a scoreboard that counts a refusal as a miss is scoring the wrong
 * thing". No derivation settles those and none should be asked to. They
 * are checked for PRESENCE and never for value.
 */

import { execFileSync, spawnSync } from "node:child_process";
import { conventionsBullet, conventionsText, repoRoot } from "./docs-scan.mjs";
import { XARGS_DIALECTS, probeXargs } from "./xargs-dialect.mjs";

/** The phrase that names the RANGE RULE bullet and only it. The other
 *  four occurrences of "THE RANGE RULE" in the file are cross-references
 *  ("THE RANGE RULE above names"), which carry no colon. */
export const RANGE_RULE_PHRASE = "THE RANGE RULE:";

/** Number words the bullet spells out. A language fact, not a figure —
 *  the VALUES beside these words are all derived. */
const NUMBER_WORDS = /** @type {Record<string, number>} */ ({
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  "thirty-one": 31,
});

/* ─────────────────────────── running things ─────────────────────────── */

/**
 * Run a command string through `/bin/sh`, exactly as a re-deriver would
 * paste it, and return its stdout and its OWN exit code. The shell is
 * the point: the bullet's recipes contain `$(…)` substitutions whose
 * behaviour on a failure is one of the things being checked.
 *
 * @param {string} root
 * @param {string} command
 * @returns {{ stdout: string, stderr: string, status: number }}
 */
export function sh(root, command) {
  const run = spawnSync("/bin/sh", ["-c", command], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 1 << 28,
  });
  return {
    stdout: run.stdout ?? "",
    stderr: run.stderr ?? "",
    status: run.status === null ? -1 : run.status,
  };
}

/**
 * `git` without a shell, for the questions this module asks in its own
 * voice rather than the document's.
 *
 * @param {string} root
 * @param {string[]} args
 * @returns {string}
 */
export function git(root, args) {
  return execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 1 << 28,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

/**
 * @param {string} root
 * @param {string[]} args
 * @returns {{ stdout: string, status: number }}
 */
export function gitTry(root, args) {
  const run = spawnSync("git", args, {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 1 << 28,
  });
  return { stdout: run.stdout ?? "", status: run.status === null ? -1 : run.status };
}

/** @param {string} s @returns {string[]} */
const lines = (s) => s.split("\n").filter((l) => l.length > 0);

/* ─────────────────────────── reading the doc ────────────────────────── */

/**
 * The RANGE RULE bullet, RAW — newlines and table pipes intact, because
 * two of its claims are markdown TABLES and a collapsed bullet has no
 * rows. Cross-checked against `docs-scan.mjs`'s own collapsed spelling so
 * that this reader and the DOCS GATE agree about what a bullet is; if
 * they ever disagree the file has grown a column-0 `- ` inside the
 * paragraph and every offset below is suspect.
 *
 * @param {string} md
 * @param {string} phrase
 * @returns {string}
 */
export function rawBullet(md, phrase) {
  const found = md
    .split(/\n(?=- )/)
    .filter((b) => b.startsWith("- "))
    .filter((b) => b.includes(phrase));
  if (found.length !== 1) {
    throw new Error(
      `range-rule: docs/CONVENTIONS.md has ${found.length} bullets containing ` +
        `${JSON.stringify(phrase)}, expected exactly one — this reader ` +
        "derives every figure in that paragraph, so a renamed, deleted or " +
        "no-longer-identifying phrase is a hard failure, never an empty expectation.",
    );
  }
  const raw = /** @type {string} */ (found[0]);
  const collapsed = raw.replace(/\s+/g, " ").trim();
  const viaDocsScan = conventionsBullet(md, phrase);
  if (collapsed !== viaDocsScan) {
    throw new Error(
      `range-rule: this reader and docs-scan.mjs disagree about where the bullet ` +
        `containing ${JSON.stringify(phrase)} ends — the paragraph has probably grown ` +
        "a `- ` at column 0. Every offset in this module is suspect until that is resolved.",
    );
  }
  return raw;
}

/** @param {string} md @returns {string} */
export function rangeRuleBullet(md) {
  return rawBullet(md, RANGE_RULE_PHRASE);
}

/**
 * @param {string} text
 * @param {RegExp} re
 * @param {string} what
 * @returns {RegExpMatchArray}
 */
function must(text, re, what) {
  const m = text.match(re);
  if (m === null) {
    throw new Error(
      `range-rule: docs/CONVENTIONS.md's RANGE RULE bullet no longer states ${what} ` +
        `(no match for ${String(re)}). A derivation that expects NOTHING passes ` +
        "everything, so this is a throw and never an empty expectation. If the " +
        "sentence was deliberately reworded, re-anchor this reader in the same commit.",
    );
  }
  return m;
}

/**
 * @param {RegExpMatchArray} m
 * @param {number} i
 * @param {string} what
 * @returns {number}
 */
function num(m, i, what) {
  const raw = m[i];
  if (raw === undefined) throw new Error(`range-rule: ${what} captured nothing`);
  const key = raw.toLowerCase();
  const word = NUMBER_WORDS[key];
  const value = word === undefined ? Number(raw) : word;
  if (!Number.isFinite(value)) {
    throw new Error(`range-rule: ${what} is ${JSON.stringify(raw)}, not a number`);
  }
  return value;
}

/**
 * @param {RegExpMatchArray} m
 * @param {number} i
 * @param {string} what
 * @returns {string}
 */
function str(m, i, what) {
  const raw = m[i];
  if (raw === undefined) throw new Error(`range-rule: ${what} captured nothing`);
  return raw;
}

/**
 * @typedef {object} FlipEntry
 * @property {string} task
 * @property {string} hash
 * @property {number | null} prescribed
 * @property {number | null} naive
 */

/**
 * @typedef {object} RangeRuleClaims
 * @property {string} atMergeCommand        the integrator's row of the two-row table
 * @property {string} preMergeTreeCommand   the executor's `TREE=$(…)` line
 * @property {string} preMergeDiffCommand   the executor's `git diff … "$TREE"` line
 * @property {string} t027Ref
 * @property {number} t027Prescribed
 * @property {number} t027Naive
 * @property {number} t027Extra
 * @property {string} t078MainBefore
 * @property {string} t078Tip
 * @property {string} t078Merge
 * @property {number} t078TwoDot
 * @property {number} t078ThreeDot
 * @property {number} t078MergeChanged
 * @property {string} t080Left
 * @property {string} t080Merge
 * @property {string} t080Tip
 * @property {number} t080AncestorExit
 * @property {number} t080AtMergeTwoDot
 * @property {number} t080AtMergeThreeDot
 * @property {number} t080BeforeTwoDot
 * @property {number} t080BeforeThreeDot
 * @property {number} scoredCount
 * @property {string} scoredFrom
 * @property {string} scoredThrough
 * @property {number} boardMergeTreePath
 * @property {number} boardMergeTreeByte
 * @property {number} boardThreeDotPath
 * @property {number} boardThreeDotByte
 * @property {number} boardTwoDotPath
 * @property {number} boardTwoDotByte
 * @property {number} boardOf
 * @property {string[]} splitMerges
 * @property {number} splitCount
 * @property {number} thirdMetricThreeDot
 * @property {string} conflictMerge
 * @property {number} conflictExit
 * @property {string} ceilingMerge
 * @property {number} ceilingOfHowMany
 * @property {string} recipeTruth
 * @property {string} recipeMergeTree
 * @property {string} recipeThreeDot
 * @property {string} recipeTwoDot
 * @property {string} recipePrescribed
 * @property {string} recipeNaive
 * @property {string} flipRef
 * @property {number} bootNotOwed
 * @property {number} bootFlips
 * @property {number} graphNotOwed
 * @property {number} graphFlips
 * @property {number} graphChances
 * @property {number} flipTotal
 * @property {number} flipChances
 * @property {number} flipDistinct
 * @property {Record<string, FlipEntry[]>} flipsByGate
 * @property {string} misattributedMerge
 * @property {number} misattributedGraphPrescribed
 * @property {number} misattributedGraphNaive
 * @property {number} misattributedBootPrescribed
 * @property {number} misattributedBootNaive
 * @property {string} t083WrittenAt
 * @property {string} t083Counterexample
 * @property {number} t083AncestorExit
 * @property {string} threeDotIdentitySpelling
 * @property {string} proseMergeTreeCommand
 * @property {string} proseNotRarely
 * @property {string} proseExitCodeWarning
 */

/**
 * Parse every FACTUAL claim out of the bullet. Throws on any sentence it
 * cannot find — see contract rule 2.
 *
 * @param {string} md docs/CONVENTIONS.md
 * @returns {RangeRuleClaims}
 */
export function parseRangeRule(md) {
  const raw = rangeRuleBullet(md);
  const flat = raw.replace(/\s+/g, " ").trim();

  // ── the two-row prescribed table ──────────────────────────────────
  const atMerge = must(
    raw,
    /\|\s*AT the merge \(integrator\)\s*\|\s*`([^`]+)`\s*\|/,
    "the integrator's row of the prescribed-range table",
  );
  const beforeMerge = must(
    raw,
    /\|\s*BEFORE the merge \(executor\)\s*\|\s*`([^`]+)`\s*then\s*`([^`]+)`\s*\|/,
    "the executor's row of the prescribed-range table",
  );

  // ── T-027, the bullet's oldest evidence ───────────────────────────
  const t027 = must(
    flat,
    /RE-MEASURED at T-027's merge `([0-9a-f]{7,40})`: the boot trigger matches \*\*(\d+)\*\* paths under the prescribed range and \*\*(\d+)\*\* under that one, and the extra \*\*(\d+)\*\*/,
    "the T-027 measurement (prescribed / naive / extra, at its own ref)",
  );

  // ── T-078, the two-dot lie ────────────────────────────────────────
  const t078 = must(
    flat,
    /Measured on T-078's lane at main-before `([0-9a-f]{7,40})` and tip `([0-9a-f]{7,40})`: two dots return \*\*(\d+)\*\* paths, three dots and the merge-tree form return \*\*(\d+)\*\*, and the merge `([0-9a-f]{7,40})` itself changed \*\*(\d+)\*\*/,
    "the T-078 measurement (two dots / three dots / the merge's own diff)",
  );

  // ── T-080, the collapse at the merge ──────────────────────────────
  const t080 = must(
    flat,
    /`git merge-base --is-ancestor ([0-9a-f]{7,40}) ([0-9a-f]{7,40})` exits \*\*(\d+)\*\*, and at the merge `[0-9a-f]{7,40}\.\.[0-9a-f]{7,40}` and `[0-9a-f]{7,40}\.\.\.[0-9a-f]{7,40}` both return \*\*(\d+)\*\* paths; before it, against the branch tip instead, `[0-9a-f]{7,40}\.\.([0-9a-f]{7,40})` returns \*\*(\d+)\*\* and `[0-9a-f]{7,40}\.\.\.[0-9a-f]{7,40}` returns \*\*(\d+)\*\*/,
    "the four T-080 figures at their own refs",
  );

  // ── the scored range, WITH the spelling its prose implies ─────────
  const scored = must(
    flat,
    /Scored over the \*\*(\d+)\*\* first-parent merges on main from BOOT GATE's own merge `([0-9a-f]{7,40})` through `([0-9a-f]{7,40})`/,
    "the scored range (count, from, through)",
  );

  // ── the two-metric scoreboard ─────────────────────────────────────
  const boardMt = must(
    raw,
    /\|\s*`merge-tree --write-tree`\s*\|\s*\*\*(\d+)\*\* of (\d+)\s*\|\s*\*\*(\d+)\*\* of (\d+)/,
    "the scoreboard's `merge-tree --write-tree` row",
  );
  const board3 = must(
    raw,
    /\|\s*three dots\s*\|\s*\*\*(\d+)\*\* of (\d+)\s*\|\s*\*\*(\d+)\*\* of (\d+)/,
    "the scoreboard's three-dot row",
  );
  const board2 = must(
    raw,
    /\|\s*pre-merge two dots\s*\|\s*\*\*(\d+)\*\* of (\d+)\s*\|\s*\*\*(\d+)\*\* of (\d+)/,
    "the scoreboard's pre-merge two-dot row",
  );

  // ── the six merges that separate three dots' two scores ───────────
  const split = must(
    flat,
    /the (\w+) merges it drops between them are \w+ where it names EXACTLY the right paths and states them against the wrong baseline — ((?:`[0-9a-f]{7,40}`(?:, | and )?)+)/,
    "the merges that separate three dots' two scores",
  );
  const splitMerges = [...str(split, 2, "the split merge list").matchAll(/`([0-9a-f]{7,40})`/g)].map(
    (m) => str(m, 1, "a split merge hash"),
  );

  // ── the third metric, named because it needs its own label ────────
  const third = must(
    flat,
    /Forgiving `index` lines and nothing else is a THIRD metric — it lifts three dots to \*\*(\d+)\*\* and moves neither other row/,
    "the index-forgiving third metric",
  );

  // ── the refusal three dots scores as a win ────────────────────────
  const conflict = must(
    flat,
    /is T-014's `([0-9a-f]{7,40})`, where `merge-tree --write-tree` exits \*\*(\d+)\*\* and prints CONFLICT instead of a tree/,
    "the merge where `merge-tree --write-tree` refuses",
  );

  // ── the ceiling: a merge commit that carries work ─────────────────
  const ceiling = must(
    flat,
    /At T-028's merge `([0-9a-f]{7,40})` NEITHER form predicts under EITHER metric/,
    "the merge where the integrator wrote into the merge commit",
  );
  const ceilingOf = must(
    flat,
    /That is the honest ceiling on the recommended command, and it is one merge in ([a-z-]+)\./,
    "the ceiling's denominator",
  );

  // ── the printed re-derivation recipe ──────────────────────────────
  const recipe = must(
    flat,
    /For each merge M the truth is `([^`]+)`; the three forecasts are `([^`]+)`, `([^`]+)` and `([^`]+)`/,
    "the printed recipe for re-deriving both scoreboard columns",
  );

  // ── the printed flip-list recipe ──────────────────────────────────
  const flipRecipe = must(
    flat,
    /DERIVE THE LIST, NEVER QUOTE IT — for each merge M, compare `([^`]+)` against `([^`]+)` and match each side against the gate's own trigger/,
    "the printed recipe for re-deriving the flip list",
  );

  // ── the flip counts, with the ref they were derived at ────────────
  const flipCounts = must(
    flat,
    /Derived at `([0-9a-f]{7,40})` across those same \d+ merges: the prescribed range says BOOT GATE is NOT owed \*\*(\d+)\*\* times and the naive range fires anyway on \*\*(\d+)\*\* of them; it says GRAPH REGEN is not owed \*\*(\d+)\*\* times and the naive range fires anyway on \*\*(\d+) of (\d+)\*\*/,
    "the four headline flip counts and the ref they were derived at",
  );
  const flipTotals = must(
    flat,
    /([A-Z]+) FLIPS IN ([A-Z]+) CHANCES, over ([A-Z]+) distinct merges/,
    "the flip totals (flips, chances, distinct merges)",
  );

  // ── the flip list itself, BY GATE — never one merged set ──────────
  const flipList = must(
    flat,
    /chronologically and BY GATE — (BOOT GATE at .+?); (GRAPH REGEN at .+?), which is the one merge that flips BOTH gates at once\./,
    "the per-gate flip list",
  );
  /** @type {Record<string, FlipEntry[]>} */
  const flipsByGate = {};
  for (const segment of [str(flipList, 1, "the BOOT GATE segment"), str(flipList, 2, "the GRAPH REGEN segment")]) {
    const head = must(segment, /^([A-Z][A-Z ]+[A-Z]) at /, "a gate name at the head of a flip segment");
    const gate = str(head, 1, "the gate name");
    if (flipsByGate[gate] !== undefined) {
      throw new Error(
        `range-rule: the flip list names the gate ${JSON.stringify(gate)} twice. The two ` +
          "lists are checked BY GATE and never merged into one set, so a duplicated " +
          "heading makes the segmentation ambiguous.",
      );
    }
    /** @type {FlipEntry[]} */
    const entries = [];
    for (const m of segment.matchAll(
      /(T-\d+) `([0-9a-f]{7,40})`(?: again)?(?: \((\d+)(?: paths)? against (\d+)\))?/g,
    )) {
      entries.push({
        task: str(m, 1, "a flip's task id"),
        hash: str(m, 2, "a flip's merge hash"),
        prescribed: m[3] === undefined ? null : Number(m[3]),
        naive: m[4] === undefined ? null : Number(m[4]),
      });
    }
    if (entries.length === 0) {
      throw new Error(
        `range-rule: the ${gate} flip segment names no merges. An empty expectation ` +
          "passes everything.",
      );
    }
    flipsByGate[gate] = entries;
  }

  // ── T-083-s1's mis-attribution, the mutant that matters ───────────
  const misattributed = must(
    flat,
    /but at `([0-9a-f]{7,40})` GRAPH is (\d+) against (\d+) and it is BOOT GATE that goes (\d+) against (\d+)/,
    "the T-083-s1 correction (which gate actually flipped at T-076's merge)",
  );

  // ── the falsified sentence's own dating ───────────────────────────
  const t083 = must(
    flat,
    /it was WRITTEN at `([0-9a-f]{7,40})`,.+?its earliest counterexample — T-030's merge `([0-9a-f]{7,40})` — landed at .+?\(`git merge-base --is-ancestor [0-9a-f]{7,40} [0-9a-f]{7,40}` exits (\d+)\)/,
    "the dating of the falsified sentence against its earliest counterexample",
  );

  // ── the three-dot identity, to be EXECUTED and not read ───────────
  const identity = must(
    flat,
    /`A\.\.\.B` is DEFINITIONALLY `([^`]+)`/,
    "the three-dot identity",
  );

  // ── the JUDGEMENT half: presence, never value ─────────────────────
  const proseMergeTree = must(
    flat,
    /(`merge-tree` answers the gate's own question[^.]*\.)/,
    "the sentence that says why `merge-tree` is the prescribed command and not three dots",
  );
  const proseNotRarely = must(
    flat,
    /(Not "rarely": when the two derivations disagree at all, the naive one manufactures a gate run MORE OFTEN THAN NOT)/,
    'the `Not "rarely"` refusal',
  );
  const proseExit = must(
    flat,
    /\*\*READ `merge-tree`'s EXIT CODE\*\* — (\d+ is a tree, \d+ is a conflict report, and a command substitution that swallows it hands you an EMPTY forecast wearing the costume of a clean gate)/,
    "the exit-code warning",
  );

  return {
    atMergeCommand: str(atMerge, 1, "the integrator's command"),
    preMergeTreeCommand: str(beforeMerge, 1, "the executor's merge-tree line"),
    preMergeDiffCommand: str(beforeMerge, 2, "the executor's diff line"),
    t027Ref: str(t027, 1, "T-027's ref"),
    t027Prescribed: num(t027, 2, "T-027's prescribed count"),
    t027Naive: num(t027, 3, "T-027's naive count"),
    t027Extra: num(t027, 4, "T-027's extra count"),
    t078MainBefore: str(t078, 1, "T-078's main-before"),
    t078Tip: str(t078, 2, "T-078's tip"),
    t078TwoDot: num(t078, 3, "T-078's two-dot count"),
    t078ThreeDot: num(t078, 4, "T-078's three-dot count"),
    t078Merge: str(t078, 5, "T-078's merge"),
    t078MergeChanged: num(t078, 6, "T-078's merge diff count"),
    t080Left: str(t080, 1, "T-080's left endpoint"),
    t080Merge: str(t080, 2, "T-080's merge"),
    t080AncestorExit: num(t080, 3, "T-080's is-ancestor exit"),
    t080AtMergeTwoDot: num(t080, 4, "T-080's at-the-merge count"),
    t080AtMergeThreeDot: num(t080, 4, "T-080's at-the-merge three-dot count"),
    t080Tip: str(t080, 5, "T-080's branch tip"),
    t080BeforeTwoDot: num(t080, 6, "T-080's before-the-merge two-dot count"),
    t080BeforeThreeDot: num(t080, 7, "T-080's before-the-merge three-dot count"),
    scoredCount: num(scored, 1, "the scored merge count"),
    scoredFrom: str(scored, 2, "the scored range's left endpoint"),
    scoredThrough: str(scored, 3, "the scored range's right endpoint"),
    boardMergeTreePath: num(boardMt, 1, "merge-tree's path score"),
    boardMergeTreeByte: num(boardMt, 3, "merge-tree's byte score"),
    boardThreeDotPath: num(board3, 1, "three dots' path score"),
    boardThreeDotByte: num(board3, 3, "three dots' byte score"),
    boardTwoDotPath: num(board2, 1, "two dots' path score"),
    boardTwoDotByte: num(board2, 3, "two dots' byte score"),
    boardOf: num(boardMt, 2, "the scoreboard's denominator"),
    splitMerges,
    splitCount: num(split, 1, "the count of split merges"),
    thirdMetricThreeDot: num(third, 1, "the third metric's three-dot score"),
    conflictMerge: str(conflict, 1, "the conflicting merge"),
    conflictExit: num(conflict, 2, "merge-tree's exit on the conflicting merge"),
    ceilingMerge: str(ceiling, 1, "the ceiling merge"),
    ceilingOfHowMany: num(ceilingOf, 1, "the ceiling's denominator"),
    recipeTruth: str(recipe, 1, "the recipe's truth command"),
    recipeMergeTree: str(recipe, 2, "the recipe's merge-tree forecast"),
    recipeThreeDot: str(recipe, 3, "the recipe's three-dot forecast"),
    recipeTwoDot: str(recipe, 4, "the recipe's two-dot forecast"),
    recipePrescribed: str(flipRecipe, 1, "the flip recipe's prescribed command"),
    recipeNaive: str(flipRecipe, 2, "the flip recipe's naive command"),
    flipRef: str(flipCounts, 1, "the ref the flip list was derived at"),
    bootNotOwed: num(flipCounts, 2, "BOOT GATE's not-owed count"),
    bootFlips: num(flipCounts, 3, "BOOT GATE's flip count"),
    graphNotOwed: num(flipCounts, 4, "GRAPH REGEN's not-owed count"),
    graphFlips: num(flipCounts, 5, "GRAPH REGEN's flip count"),
    graphChances: num(flipCounts, 6, "GRAPH REGEN's chance count"),
    flipTotal: num(flipTotals, 1, "the total flip count"),
    flipChances: num(flipTotals, 2, "the total chance count"),
    flipDistinct: num(flipTotals, 3, "the distinct-merge count"),
    flipsByGate,
    misattributedMerge: str(misattributed, 1, "T-076's merge"),
    misattributedGraphPrescribed: num(misattributed, 2, "GRAPH's prescribed count at T-076"),
    misattributedGraphNaive: num(misattributed, 3, "GRAPH's naive count at T-076"),
    misattributedBootPrescribed: num(misattributed, 4, "BOOT's prescribed count at T-076"),
    misattributedBootNaive: num(misattributed, 5, "BOOT's naive count at T-076"),
    t083WrittenAt: str(t083, 1, "the commit that wrote the falsified sentence"),
    t083Counterexample: str(t083, 2, "the sentence's earliest counterexample"),
    t083AncestorExit: num(t083, 3, "the is-ancestor exit between them"),
    threeDotIdentitySpelling: str(identity, 1, "the identity's equivalent spelling"),
    proseMergeTreeCommand: str(proseMergeTree, 1, "the merge-tree command commitment"),
    proseNotRarely: str(proseNotRarely, 1, 'the "Not rarely" refusal'),
    proseExitCodeWarning: str(proseExit, 1, "the exit-code warning"),
  };
}

/* ─────────────────────── the gates' own triggers ────────────────────── */

/**
 * @typedef {object} GateTrigger
 * @property {string} gate
 * @property {string[]} prefixes  path prefixes from `dir/**` globs
 * @property {string[]} exact     exact paths (the two manifests)
 * @property {string[]} suffixes  file suffixes from `*.ext` globs
 * @property {string} outside     the directory the trigger excludes ("" for none)
 */

/**
 * BOOT GATE's trigger, READ OUT OF ITS OWN BULLET rather than retyped —
 * T-057: a rule with two implementations is two chances to disagree.
 *
 * @param {string} md
 * @returns {GateTrigger}
 */
export function bootGateTrigger(md) {
  const bullet = conventionsBullet(md, "BOOT GATE (T-046");
  if (bullet === undefined) throw new Error("range-rule: no BOOT GATE bullet");
  const trigger = must(
    bullet,
    /at any merge whose diff touches (.+?) — /,
    "BOOT GATE's own trigger",
  );
  const text = str(trigger, 1, "BOOT GATE's trigger text");
  const prefixes = [...text.matchAll(/`([^`]*?)\/\*\*`/g)].map((m) => `${str(m, 1, "a BOOT prefix")}/`);
  const manifests = must(text, /either manifest \(([^)]+)\)/, "BOOT GATE's two manifests");
  const exact = str(manifests, 1, "the manifest list")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  if (prefixes.length === 0 || exact.length === 0) {
    throw new Error(
      "range-rule: BOOT GATE's trigger parsed to an empty path set. A gate whose " +
        "trigger matches nothing says every merge is not owed, which is a green " +
        "that means nothing.",
    );
  }
  return { gate: "BOOT GATE", prefixes, exact, suffixes: [], outside: "" };
}

/**
 * GRAPH REGEN's trigger, likewise read out of its own bullet. THE SUFFIX
 * SET IS A FUNCTION OF THE REF: `*.rs` was added 2026-08-25 (`T-123-s5`)
 * and the flip paragraph was derived before it, which is why every caller
 * here says WHICH ref it read the trigger at.
 *
 * @param {string} md
 * @returns {GateTrigger}
 */
export function graphRegenTrigger(md) {
  const bullet = conventionsBullet(md, "GRAPH REGEN (T-009-s1");
  if (bullet === undefined) throw new Error("range-rule: no GRAPH REGEN bullet");
  const trigger = must(
    bullet,
    /at any merge whose diff touches (.+?) outside ([a-z]+\/),/,
    "GRAPH REGEN's own trigger",
  );
  const suffixes = [...str(trigger, 1, "GRAPH REGEN's trigger text").matchAll(/\*\.([a-z]+)/g)].map(
    (m) => `.${str(m, 1, "a GRAPH suffix")}`,
  );
  if (suffixes.length === 0) {
    throw new Error(
      "range-rule: GRAPH REGEN's trigger parsed to an empty suffix set. An empty " +
        "trigger says every merge is not owed.",
    );
  }
  return {
    gate: "GRAPH REGEN",
    prefixes: [],
    exact: [],
    suffixes,
    outside: str(trigger, 2, "GRAPH REGEN's excluded directory"),
  };
}

/**
 * @param {GateTrigger} trigger
 * @param {string} p
 * @returns {boolean}
 */
export function triggerMatches(trigger, p) {
  if (trigger.outside !== "" && p.startsWith(trigger.outside)) return false;
  if (trigger.prefixes.some((pre) => p.startsWith(pre))) return true;
  if (trigger.exact.includes(p)) return true;
  return trigger.suffixes.some((s) => p.endsWith(s));
}

/* ───────────────────────────── deriving ─────────────────────────────── */

/**
 * Substitute the merge into one of the bullet's printed `M` recipes.
 * `M^1` and `M^2` survive verbatim because `^` is not a word character,
 * so the doc's own spelling is what runs.
 *
 * @param {string} recipe
 * @param {string} merge
 * @returns {string}
 */
export function instantiate(recipe, merge) {
  return recipe.replace(/\bM\b/g, merge);
}

/**
 * The bullet's own instruction for the PATH column: the same command
 * "with `--name-only` through `sort`". Not a re-implementation — a
 * transformation the document names in words.
 *
 * @param {string} recipe
 * @returns {string}
 */
export function nameOnly(recipe) {
  if (!recipe.startsWith("git diff ")) {
    throw new Error(
      `range-rule: the printed recipe ${JSON.stringify(recipe)} is not a \`git diff\`, ` +
        "so the bullet's own instruction to run it `--name-only` through `sort` has " +
        "nowhere to attach. The recipe and the column it produces are ONE claim.",
    );
  }
  return `${recipe.replace(/^git diff /, "git diff --name-only ")} | sort`;
}

/**
 * @typedef {object} MergeRow
 * @property {string} merge
 * @property {string[]} truthPaths
 * @property {string} truthPatch
 * @property {Record<string, string[] | null>} forecastPaths
 * @property {Record<string, string | null>} forecastPatch
 * @property {string[]} prescribedPaths
 * @property {string[]} naivePaths
 */

/**
 * Run the bullet's three printed forecasts and its printed truth over one
 * merge, under BOTH metrics, by EXECUTING the strings the bullet prints.
 *
 * @param {string} root
 * @param {RangeRuleClaims} claims
 * @param {string} merge
 * @returns {MergeRow}
 */
export function scoreMerge(root, claims, merge) {
  /** @param {string} recipe @returns {{paths: string[] | null, patch: string | null}} */
  const run = (recipe) => {
    const cmd = instantiate(recipe, merge);
    const patchRun = sh(root, cmd);
    const pathRun = sh(root, nameOnly(instantiate(recipe, merge)));
    // A recipe that FAILED produced no forecast. Treating its empty
    // stdout as "no paths changed" is the exact silence T-084-s6 exists
    // to remove: a failed command wearing a clean gate's costume.
    if (patchRun.status !== 0 || pathRun.status !== 0) return { paths: null, patch: null };
    return { paths: lines(pathRun.stdout), patch: patchRun.stdout };
  };

  const truth = run(claims.recipeTruth);
  if (truth.paths === null || truth.patch === null) {
    throw new Error(
      `range-rule: the bullet's printed TRUTH command failed at ${merge}. The truth is ` +
        "what every forecast is scored against, so this is a throw, not a miss.",
    );
  }

  /** @type {Record<string, string[] | null>} */
  const forecastPaths = {};
  /** @type {Record<string, string | null>} */
  const forecastPatch = {};
  for (const [name, recipe] of /** @type {[string, string][]} */ ([
    ["merge-tree", claims.recipeMergeTree],
    ["three dots", claims.recipeThreeDot],
    ["two dots", claims.recipeTwoDot],
  ])) {
    const r = run(recipe);
    forecastPaths[name] = r.paths;
    forecastPatch[name] = r.patch;
  }

  const prescribed = sh(root, instantiate(claims.recipePrescribed, merge));
  const naive = sh(root, instantiate(claims.recipeNaive, merge));
  if (prescribed.status !== 0 || naive.status !== 0) {
    throw new Error(
      `range-rule: the bullet's printed FLIP recipe failed at ${merge} ` +
        `(prescribed exit ${prescribed.status}, naive exit ${naive.status}).`,
    );
  }

  return {
    merge,
    truthPaths: truth.paths,
    truthPatch: truth.patch,
    forecastPaths,
    forecastPatch,
    prescribedPaths: lines(prescribed.stdout),
    naivePaths: lines(naive.stdout),
  };
}

/**
 * @typedef {object} RangeRuleDerivation
 * @property {string} root
 * @property {string} head
 * @property {RangeRuleClaims} claims
 * @property {string[]} merges
 * @property {number} inclusiveCount
 * @property {number} exclusiveCount
 * @property {boolean} leftEndpointIsMerge
 * @property {MergeRow[]} rows
 * @property {Record<string, number>} pathScore
 * @property {Record<string, number>} byteScore
 * @property {Record<string, number>} indexForgivingScore
 * @property {string[]} splitMerges
 * @property {string[]} conflictMerges
 * @property {string[]} treeMismatches
 * @property {Record<string, {notOwed: number, flips: string[], perMerge: Record<string, {prescribed: number, naive: number}>}>} flipsAtFlipRef
 * @property {Record<string, {notOwed: number, flips: string[]}>} flipsOnDisk
 * @property {string[]} reverseFlips
 * @property {Record<string, GateTrigger>} triggersAtFlipRef
 * @property {Record<string, GateTrigger>} triggersOnDisk
 */

/** @param {string[]} a @returns {string} */
const key = (a) => [...a].sort().join("\n");

/** @param {string} patch @returns {string} */
const stripIndexLines = (patch) =>
  patch
    .split("\n")
    .filter((l) => !l.startsWith("index "))
    .join("\n");

/**
 * @param {string} root
 * @returns {RangeRuleDerivation}
 */
export function deriveRangeRule(root) {
  const md = conventionsText(root);
  const claims = parseRangeRule(md);
  const head = git(root, ["rev-parse", "HEAD"]).trim();

  // ── the range spelling, derived BOTH ways ─────────────────────────
  const spell = /** @param {string} range @returns {string[]} */ (range) =>
    lines(git(root, ["rev-list", "--first-parent", "--merges", range]));
  const inclusive = spell(`${claims.scoredFrom}^..${claims.scoredThrough}`);
  const exclusive = spell(`${claims.scoredFrom}..${claims.scoredThrough}`);
  const parents = git(root, ["rev-list", "--parents", "-n1", claims.scoredFrom]).trim().split(/\s+/);

  const merges = inclusive;

  const rows = merges.map((m) => scoreMerge(root, claims, m));

  /** @type {Record<string, number>} */
  const pathScore = {};
  /** @type {Record<string, number>} */
  const byteScore = {};
  /** @type {Record<string, number>} */
  const indexForgivingScore = {};
  /** @type {string[]} */
  const splitMerges = [];
  for (const name of ["merge-tree", "three dots", "two dots"]) {
    pathScore[name] = 0;
    byteScore[name] = 0;
    indexForgivingScore[name] = 0;
  }
  for (const row of rows) {
    for (const name of ["merge-tree", "three dots", "two dots"]) {
      const fp = row.forecastPaths[name];
      const fb = row.forecastPatch[name];
      const pathHit = fp !== null && fp !== undefined && key(fp) === key(row.truthPaths);
      const byteHit = fb !== null && fb !== undefined && fb === row.truthPatch;
      const idxHit =
        fb !== null && fb !== undefined && stripIndexLines(fb) === stripIndexLines(row.truthPatch);
      if (pathHit) pathScore[name] = (pathScore[name] ?? 0) + 1;
      if (byteHit) byteScore[name] = (byteScore[name] ?? 0) + 1;
      if (idxHit) indexForgivingScore[name] = (indexForgivingScore[name] ?? 0) + 1;
      if (name === "three dots" && pathHit && !byteHit) splitMerges.push(row.merge);
    }
  }

  // ── the refusal, and the merge that carried work ──────────────────
  // Both asked of `merge-tree` DIRECTLY — its exit code read from its own
  // process rather than through the `$(…)` the recipe wraps it in, which
  // is the whole of the bullet's exit-code warning.
  const inner = must(
    claims.recipeMergeTree,
    /\$\((.+)\)/,
    "a `$(…)` substitution inside the printed merge-tree forecast",
  );
  const innerCommand = str(inner, 1, "the merge-tree command inside the substitution");
  /** @type {string[]} */
  const conflictMerges = [];
  /** @type {string[]} */
  const treeMismatches = [];
  for (const m of merges) {
    const direct = sh(root, instantiate(innerCommand, m));
    if (direct.status !== 0) {
      conflictMerges.push(m);
      continue;
    }
    const forecastTree = (direct.stdout.split("\n")[0] ?? "").trim();
    const mergeTree = git(root, ["rev-parse", `${m}^{tree}`]).trim();
    if (forecastTree !== mergeTree) treeMismatches.push(m);
  }

  // ── the flip lists, per gate, at the ref the paragraph names ──────
  const mdAtFlipRef = git(root, ["show", `${claims.flipRef}:docs/CONVENTIONS.md`]);
  /** @type {Record<string, GateTrigger>} */
  const triggersAtFlipRef = {
    "BOOT GATE": bootGateTrigger(mdAtFlipRef),
    "GRAPH REGEN": graphRegenTrigger(mdAtFlipRef),
  };
  /** @type {Record<string, GateTrigger>} */
  const triggersOnDisk = {
    "BOOT GATE": bootGateTrigger(md),
    "GRAPH REGEN": graphRegenTrigger(md),
  };

  /**
   * @param {Record<string, GateTrigger>} triggers
   * @returns {Record<string, {notOwed: number, flips: string[], perMerge: Record<string, {prescribed: number, naive: number}>}>}
   */
  const flipsUnder = (triggers) => {
    /** @type {Record<string, {notOwed: number, flips: string[], perMerge: Record<string, {prescribed: number, naive: number}>}>} */
    const out = {};
    for (const [gate, trigger] of Object.entries(triggers)) {
      /** @type {string[]} */
      const flips = [];
      /** @type {Record<string, {prescribed: number, naive: number}>} */
      const perMerge = {};
      let notOwed = 0;
      for (const row of rows) {
        const p = row.prescribedPaths.filter((x) => triggerMatches(trigger, x)).length;
        const n = row.naivePaths.filter((x) => triggerMatches(trigger, x)).length;
        perMerge[row.merge] = { prescribed: p, naive: n };
        if (p === 0) notOwed += 1;
        if (p === 0 && n > 0) flips.push(row.merge);
      }
      out[gate] = { notOwed, flips, perMerge };
    }
    return out;
  };

  const flipsAtFlipRef = flipsUnder(triggersAtFlipRef);
  const onDisk = flipsUnder(triggersOnDisk);
  /** @type {Record<string, {notOwed: number, flips: string[]}>} */
  const flipsOnDisk = {};
  for (const [gate, v] of Object.entries(onDisk)) flipsOnDisk[gate] = { notOwed: v.notOwed, flips: v.flips };

  // ── the reverse universal, over BOTH trigger vintages ─────────────
  /** @type {string[]} */
  const reverseFlips = [];
  for (const triggers of [triggersAtFlipRef, triggersOnDisk]) {
    for (const trigger of Object.values(triggers)) {
      for (const row of rows) {
        const p = row.prescribedPaths.some((x) => triggerMatches(trigger, x));
        const n = row.naivePaths.some((x) => triggerMatches(trigger, x));
        if (p && !n) reverseFlips.push(`${trigger.gate} ${row.merge}`);
      }
    }
  }

  return {
    root,
    head,
    claims,
    merges,
    inclusiveCount: inclusive.length,
    exclusiveCount: exclusive.length,
    leftEndpointIsMerge: parents.length > 2,
    rows,
    pathScore,
    byteScore,
    indexForgivingScore,
    splitMerges,
    conflictMerges,
    treeMismatches,
    flipsAtFlipRef,
    flipsOnDisk,
    reverseFlips,
    triggersAtFlipRef,
    triggersOnDisk,
  };
}

/* ────────────── the ninth item: an exit code the pipeline eats ───────── */

/**
 * @typedef {object} DocsGateRow
 * @property {string} meaning
 * @property {Record<string, number>} substitution        the `$(…)` cell, per dialect
 * @property {Record<string, number>} piped               the piped cell, per dialect
 * @property {Record<string, number | null>} pipedEmpty   what that cell says "on an empty list", where it says so
 */

/**
 * @typedef {object} DocsGateRecipe
 * @property {string} treeLine   the printed `TREE=$(…)` line
 * @property {string} gateLine   the printed `node …docs-gate.mjs $(…)` line
 * @property {string[]} dialects the matrix's OWN dialect columns, lowercased, sorted
 * @property {Record<number, DocsGateRow>} matrix
 */

/**
 * The DOCS GATE bullet's printed recipe and its measured exit-code
 * matrix. T-084's integrator recorded the standing lesson this reader
 * exists to mechanise: **a printed recipe whose EXIT CODE the pipeline
 * eats is a corrupt recipe.** T-090 corrected the spelling so that it has
 * no `xargs` layer at all; nothing until now re-ran it to find out.
 *
 * @param {string} md
 * @returns {DocsGateRecipe}
 */
export function parseDocsGateRecipe(md) {
  const raw = rawBullet(md, "DOCS GATE (T-084");
  const tree = must(
    raw,
    /^ +(TREE=\$\(git merge-tree --write-tree .+\).*)$/m,
    "the DOCS GATE's printed `TREE=$(…)` line",
  );
  const gate = must(
    raw,
    /^ +(node tools\/e2e\/scripts\/docs-gate\.mjs .+)$/m,
    "the DOCS GATE's printed invocation",
  );
  // THE COLUMNS ARE READ FROM THE HEADER, NEVER COUNTED OFF BY POSITION
  // (T-153-s6). This parser used to take column 3 as "the `$(…)` cell"
  // and column 5 as "the piped cell" and call both of them BSD, so the
  // GNU half of a matrix that already had one was parsed and discarded —
  // which is how a reader that executes the piped spelling came to
  // compare a Linux measurement against a Darwin column. Each header cell
  // now names its FORM and its DIALECT, and the dialect a caller wants is
  // looked up by name.
  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("|"));
  if (lines.length < 3) {
    throw new Error(
      "range-rule: the DOCS GATE bullet no longer carries an exit-code table (header, " +
        "separator and at least one row). An empty expectation passes everything.",
    );
  }
  /** @param {string} line @returns {string[]} */
  const cellsOf = (line) =>
    line
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((c) => c.trim());

  /** @type {{form: "substitution" | "piped", dialect: string, label: string}[]} */
  const columns = cellsOf(/** @type {string} */ (lines[0])).slice(1).map((label, i) => {
    const m = label.match(/^(.*?),\s*([A-Za-z]+)$/);
    const head = m?.[1];
    const dialect = m?.[2];
    if (head === undefined || dialect === undefined) {
      throw new Error(
        `range-rule: the DOCS GATE matrix's column ${i + 2} is headed ${JSON.stringify(label)}, ` +
          'which names no "<form>, <DIALECT>" pair. A mapping quoted without its platform is ' +
          "wrong on one of them (the bullet's own words), so this is a throw.",
      );
    }
    const form = head.includes("piped") ? "piped" : head.includes("$(") ? "substitution" : undefined;
    if (form === undefined) {
      throw new Error(
        `range-rule: the DOCS GATE matrix's column ${i + 2} (${JSON.stringify(label)}) names ` +
          "neither the `$(…)` form nor the piped one",
      );
    }
    return { form, dialect: dialect.toLowerCase(), label };
  });

  /** @type {Record<number, DocsGateRow>} */
  const matrix = {};
  for (const line of lines.slice(1)) {
    const cells = cellsOf(line);
    const label = /** @type {string} */ (cells[0] ?? "");
    if (/^:?-{2,}:?$/.test(label)) continue; // the separator row
    const m = label.match(/^(\d+) (.+)$/);
    const code = m?.[1];
    const meaning = m?.[2];
    if (code === undefined || meaning === undefined) continue;
    if (cells.length !== columns.length + 1) {
      throw new Error(
        `range-rule: the DOCS GATE matrix's row ${JSON.stringify(label)} has ` +
          `${cells.length - 1} value cells against ${columns.length} column headers`,
      );
    }
    /** @type {DocsGateRow} */
    const row = { meaning: meaning.trim(), substitution: {}, piped: {}, pipedEmpty: {} };
    columns.forEach((col, i) => {
      const cell = /** @type {string} */ (cells[i + 1] ?? "");
      const what = `the ${col.label} cell of row ${code}`;
      if (col.form === "substitution") row.substitution[col.dialect] = first(cell, what);
      else {
        row.piped[col.dialect] = first(cell, what);
        row.pipedEmpty[col.dialect] = onEmptyList(cell);
      }
    });
    matrix[Number(code)] = row;
  }
  if (Object.keys(matrix).length === 0) {
    throw new Error(
      "range-rule: the DOCS GATE bullet's exit-code matrix parsed to zero rows. " +
        "An empty expectation passes everything.",
    );
  }
  const dialects = [...new Set(columns.filter((c) => c.form === "piped").map((c) => c.dialect))].sort();
  const substituted = [
    ...new Set(columns.filter((c) => c.form === "substitution").map((c) => c.dialect)),
  ].sort();
  if (dialects.length === 0 || key(dialects) !== key(substituted)) {
    throw new Error(
      `range-rule: the DOCS GATE matrix scores the \`$(…)\` form on [${substituted.join(", ")}] ` +
        `and the piped form on [${dialects.join(", ")}]. The whole argument of that table is a ` +
        "COMPARISON between the two forms on one platform, and it cannot be made where only " +
        "one of them is measured there.",
    );
  }
  return {
    treeLine: str(tree, 1, "the TREE line"),
    gateLine: str(gate, 1, "the gate line"),
    dialects,
    matrix,
  };
}

/** @param {string} cell @param {string} what @returns {number} */
function first(cell, what) {
  const m = cell.match(/\d+/);
  if (m === null || m[0] === undefined) {
    throw new Error(`range-rule: ${what} carries no exit code (${JSON.stringify(cell)})`);
  }
  return Number(m[0]);
}

/** The value a cell gives "on an empty list", or null if it names none.
 *  @param {string} cell @returns {number | null} */
function onEmptyList(cell) {
  const m = cell.match(/\*\*(\d+)\*\* on an empty list/);
  return m === null || m[1] === undefined ? null : Number(m[1]);
}

/**
 * Build the FORBIDDEN spelling out of the printed one, rather than
 * retyping it — so the day the printed line grows an `xargs` of its own,
 * this transformation has nothing to attach to and throws.
 *
 * @param {string} gateLine
 * @returns {string}
 */
export function pipedThroughXargs(gateLine) {
  if (gateLine.includes("xargs")) {
    throw new Error(
      "range-rule: the DOCS GATE's PRINTED invocation already contains `xargs`. " +
        'The bullet says in terms "THERE IS NO `xargs` IN THAT SPELLING AND THAT IS ' +
        'THE POINT" (T-090) — a pipe through it destroys two of the four exit codes ' +
        "in the direction the codes exist to prevent.",
    );
  }
  const m = must(
    gateLine,
    /^(.+?) \$\((.+)\)$/,
    "a `$(…)` substitution at the end of the DOCS GATE's printed invocation",
  );
  return `${str(m, 2, "the range command")} | xargs ${str(m, 1, "the gate command")}`;
}

/* ───────────────────────────── the checks ───────────────────────────── */

/**
 * @typedef {object} Check
 * @property {string} id
 * @property {string[]} claimKeys
 * @property {string[]} findings  a failure: the document and git disagree
 * @property {string[]} notes     a DISCLOSURE: both are right and the reader
 *                                found something the document does not say.
 *                                Notes never fail a run — a lane that reds on
 *                                a true number is the hazard this card exists
 *                                to prevent — and they are never silent either.
 */

/** Every check this reader runs, in the order the acceptance criteria
 *  name them. Exported as a STATIC list so the spec can declare one test
 *  per check without paying for the derivation at collection time. */
export const CHECK_IDS = /** @type {const} */ ([
  "range-spelling-with-its-count",
  "prescribed-table-is-the-recipe",
  "t027-figures-at-their-own-ref",
  "t078-figures-at-their-own-ref",
  "t080-collapse-at-the-merge",
  "scoreboard-path-for-path",
  "scoreboard-byte-for-byte",
  "scoreboard-third-metric",
  "three-dots-two-scores-split",
  "merge-tree-refusal-is-not-a-miss",
  "merge-commit-ceiling",
  "three-dot-identity-executed",
  "flip-headline-counts",
  "flip-lists-by-gate",
  "flip-counts-carry-their-trigger",
  "reverse-flip-universal",
  "falsified-sentence-dating",
  "judgement-half-present-not-valued",
  "printed-recipe-exit-codes",
  "docs-gate-recipe-exit-codes",
]);

/** @param {string[]} a @param {string[]} b @returns {boolean} */
const sameSet = (a, b) => key(a) === key(b);

/** @param {string} full @param {string} short @returns {boolean} */
const isSameCommit = (full, short) => full.startsWith(short);

/**
 * @param {string[]} full
 * @param {string[]} shorts
 * @returns {boolean}
 */
function sameCommits(full, shorts) {
  if (full.length !== shorts.length) return false;
  const remaining = [...full];
  for (const s of shorts) {
    const i = remaining.findIndex((f) => isSameCommit(f, s));
    if (i === -1) return false;
    remaining.splice(i, 1);
  }
  return true;
}

/**
 * THE FLIP LISTS, CHECKED BY GATE AND NEVER MERGED INTO ONE SET.
 *
 * Exported separately from the check that calls it so that the mutant
 * this card names — relabelling T-076 from BOOT GATE to GRAPH REGEN,
 * `T-083-s1`'s real, shipped error — can be driven against a document
 * mutated IN MEMORY, one side only, without re-deriving git's side. The
 * derivation `d` is the untouched producer; `c` is the poisoned reader.
 *
 * A set-equality check over all thirteen hashes passes straight through
 * that relabel, because the merged set does not move. Three things here
 * do NOT pass through it: the per-gate hash lists, the per-gate
 * parenthetical counts, and T-083-s1's own correction below.
 *
 * @param {RangeRuleDerivation} d  git's side, derived
 * @param {RangeRuleClaims} c      the document's side, parsed
 * @returns {string[]}
 */
export function flipListFindings(d, c) {
  /** @type {string[]} */
  const f = [];
  for (const [gate, entries] of Object.entries(c.flipsByGate)) {
    const derived = d.flipsAtFlipRef[gate];
    if (derived === undefined) {
      f.push(
        `the flip list names a gate this reader cannot derive a trigger for: ${gate}. The two ` +
          "lists are checked BY GATE precisely because a set-equality over all the hashes " +
          "passes straight through a merge filed under the wrong one",
      );
      continue;
    }
    if (!sameCommits(derived.flips, entries.map((e) => e.hash))) {
      f.push(
        `${gate} segment: the doc lists ${entries.map((e) => `${e.task} ${e.hash}`).join(", ")}; ` +
          `git derives ${derived.flips.map((m) => m.slice(0, 7)).join(", ") || "none"}`,
      );
    }
    for (const entry of entries) {
      const full = d.merges.find((m) => isSameCommit(m, entry.hash));
      if (full === undefined) {
        f.push(`${gate}: ${entry.task} ${entry.hash} is not in the scored range at all`);
        continue;
      }
      const per = derived.perMerge[full];
      if (per === undefined) continue;
      if (entry.prescribed !== null && per.prescribed !== entry.prescribed) {
        f.push(
          `${gate} at ${entry.hash}: doc says ${entry.prescribed} prescribed, git says ${per.prescribed}`,
        );
      }
      if (entry.naive !== null && per.naive !== entry.naive) {
        f.push(`${gate} at ${entry.hash}: doc says ${entry.naive} naive, git says ${per.naive}`);
      }
    }
  }
  // T-083-s1's correction: the numbers were right and the gate was not.
  const graph = d.flipsAtFlipRef["GRAPH REGEN"];
  const boot = d.flipsAtFlipRef["BOOT GATE"];
  const full = d.merges.find((m) => isSameCommit(m, c.misattributedMerge));
  if (full === undefined) {
    f.push(`T-083-s1's merge ${c.misattributedMerge} is not in the scored range`);
  } else if (graph !== undefined && boot !== undefined) {
    const g = graph.perMerge[full];
    const b = boot.perMerge[full];
    if (g === undefined || b === undefined) {
      f.push(`no per-merge counts derived at ${c.misattributedMerge}`);
    } else {
      if (g.prescribed !== c.misattributedGraphPrescribed || g.naive !== c.misattributedGraphNaive) {
        f.push(
          `T-083-s1 at ${c.misattributedMerge}: doc says GRAPH is ` +
            `${c.misattributedGraphPrescribed} against ${c.misattributedGraphNaive}, git says ` +
            `${g.prescribed} against ${g.naive}`,
        );
      }
      if (b.prescribed !== c.misattributedBootPrescribed || b.naive !== c.misattributedBootNaive) {
        f.push(
          `T-083-s1 at ${c.misattributedMerge}: doc says BOOT GATE goes ` +
            `${c.misattributedBootPrescribed} against ${c.misattributedBootNaive}, git says ` +
            `${b.prescribed} against ${b.naive}`,
        );
      }
    }
  }
  return f;
}

/**
 * @param {RangeRuleDerivation} d
 * @returns {Check[]}
 */
export function rangeRuleChecks(d) {
  const c = d.claims;
  const root = d.root;
  /** @type {Check[]} */
  const checks = [];
  /** @param {string} id @param {string[]} claimKeys @param {string[]} findings @param {string[]} [notes] */
  const add = (id, claimKeys, findings, notes = []) =>
    checks.push({ id, claimKeys, findings, notes });

  // ── 1. the count and the spelling that produces it are ONE claim ──
  {
    /** @type {string[]} */
    const f = [];
    if (d.inclusiveCount !== c.scoredCount) {
      f.push(
        `scored range: the bullet says ${c.scoredCount} first-parent merges "from ` +
          `${c.scoredFrom} through ${c.scoredThrough}", and the INCLUSIVE spelling ` +
          `${c.scoredFrom}^..${c.scoredThrough} returns ${d.inclusiveCount}`,
      );
    }
    if (!d.leftEndpointIsMerge) {
      f.push(
        `scored range: ${c.scoredFrom} is not itself a merge, so "from … through" ` +
          "cannot be the reason the inclusive spelling is the right one — the FIXTURE " +
          "below has lost its explanation",
      );
    }
    if (d.exclusiveCount !== d.inclusiveCount - 1) {
      f.push(
        `scored range FIXTURE: the exclusive spelling ${c.scoredFrom}..${c.scoredThrough} ` +
          `returns ${d.exclusiveCount} against the inclusive ${d.inclusiveCount}; the gap ` +
          "should be exactly the left endpoint and nothing else. A figure and the command " +
          "that produces it are ONE claim, and a reader that stores them apart invents " +
          "failures as readily as it misses them",
      );
    }
    add("range-spelling-with-its-count", ["scoredCount", "scoredFrom", "scoredThrough"], f);
  }

  // ── 2. the prescribed TABLE and the printed RECIPE are one claim ──
  {
    /** @type {string[]} */
    const f = [];
    const m = /** @type {string} */ (d.merges[0]);
    const atMerge = sh(
      root,
      c.atMergeCommand
        .replaceAll("<main-before-the-merge>", `${m}^1`)
        .replaceAll("<the merge commit>", m),
    );
    const truth = sh(root, nameOnly(instantiate(c.recipeTruth, m)));
    if (atMerge.status !== 0) {
      f.push(`the table's integrator command exited ${atMerge.status} at ${m}`);
    } else if (!sameSet(lines(atMerge.stdout), lines(truth.stdout))) {
      f.push(
        `the table's integrator command and the bullet's own "truth" recipe disagree at ` +
          `${m}: ${lines(atMerge.stdout).length} paths against ${lines(truth.stdout).length}. ` +
          "The bullet prints one idea in two spellings; they have forked",
      );
    }
    const executor = sh(
      root,
      `${c.preMergeTreeCommand.replaceAll("<main tip>", `${m}^1`).replace(/\bHEAD\b/, `${m}^2`)}\n` +
        `${c.preMergeDiffCommand.replaceAll("<main tip>", `${m}^1`)}`,
    );
    const forecast = sh(root, nameOnly(instantiate(c.recipeMergeTree, m)));
    if (executor.status !== 0) {
      f.push(`the table's executor recipe exited ${executor.status} at ${m}`);
    } else if (!sameSet(lines(executor.stdout), lines(forecast.stdout))) {
      f.push(
        `the table's executor recipe and the bullet's own merge-tree forecast disagree at ` +
          `${m}: ${lines(executor.stdout).length} paths against ${lines(forecast.stdout).length}`,
      );
    }
    add(
      "prescribed-table-is-the-recipe",
      ["atMergeCommand", "preMergeTreeCommand", "preMergeDiffCommand"],
      f,
    );
  }

  // ── 3. T-027, this bullet's oldest evidence ───────────────────────
  {
    /** @type {string[]} */
    const f = [];
    const boot = d.triggersOnDisk["BOOT GATE"];
    if (boot === undefined) throw new Error("range-rule: no BOOT GATE trigger on disk");
    const pre = sh(root, instantiate(c.recipePrescribed, c.t027Ref));
    const nai = sh(root, instantiate(c.recipeNaive, c.t027Ref));
    if (pre.status !== 0 || nai.status !== 0) {
      f.push(`T-027: the printed flip recipe failed at ${c.t027Ref}`);
    } else {
      const p = lines(pre.stdout).filter((x) => triggerMatches(boot, x)).length;
      const n = lines(nai.stdout).filter((x) => triggerMatches(boot, x)).length;
      if (p !== c.t027Prescribed) f.push(`T-027 prescribed: doc says ${c.t027Prescribed}, git says ${p}`);
      if (n !== c.t027Naive) f.push(`T-027 naive: doc says ${c.t027Naive}, git says ${n}`);
      if (n - p !== c.t027Extra) {
        f.push(`T-027 extra: doc says ${c.t027Extra}, git says ${n - p} (${n} − ${p})`);
      }
    }
    add("t027-figures-at-their-own-ref", ["t027Ref", "t027Prescribed", "t027Naive", "t027Extra"], f);
  }

  // ── 4. T-078, the two-dot lie, at its own refs ────────────────────
  {
    /** @type {string[]} */
    const f = [];
    /** @param {string} range @returns {number} */
    const count = (range) => lines(git(root, ["diff", "--name-only", range])).length;
    const two = count(`${c.t078MainBefore}..${c.t078Tip}`);
    const three = count(`${c.t078MainBefore}...${c.t078Tip}`);
    const merged = lines(git(root, ["diff", "--name-only", `${c.t078Merge}^1`, c.t078Merge])).length;
    if (two !== c.t078TwoDot) f.push(`T-078 two dots: doc says ${c.t078TwoDot}, git says ${two}`);
    if (three !== c.t078ThreeDot) f.push(`T-078 three dots: doc says ${c.t078ThreeDot}, git says ${three}`);
    if (merged !== c.t078MergeChanged) {
      f.push(`T-078 the merge's own diff: doc says ${c.t078MergeChanged}, git says ${merged}`);
    }
    add(
      "t078-figures-at-their-own-ref",
      ["t078MainBefore", "t078Tip", "t078Merge", "t078TwoDot", "t078ThreeDot", "t078MergeChanged"],
      f,
    );
  }

  // ── 5. T-080, where the same spelling collapses ───────────────────
  {
    /** @type {string[]} */
    const f = [];
    /** @param {string} range @returns {number} */
    const count = (range) => lines(git(root, ["diff", "--name-only", range])).length;
    const ancestor = gitTry(root, ["merge-base", "--is-ancestor", c.t080Left, c.t080Merge]).status;
    if (ancestor !== c.t080AncestorExit) {
      f.push(
        `T-080 is-ancestor: doc says exit ${c.t080AncestorExit}, git exits ${ancestor} — the ` +
          "whole collapse argument rests on the left endpoint being an ancestor of the merge",
      );
    }
    const atTwo = count(`${c.t080Left}..${c.t080Merge}`);
    const atThree = count(`${c.t080Left}...${c.t080Merge}`);
    if (atTwo !== c.t080AtMergeTwoDot) f.push(`T-080 at the merge, two dots: doc says ${c.t080AtMergeTwoDot}, git says ${atTwo}`);
    if (atThree !== c.t080AtMergeThreeDot) f.push(`T-080 at the merge, three dots: doc says ${c.t080AtMergeThreeDot}, git says ${atThree}`);
    const beforeTwo = count(`${c.t080Left}..${c.t080Tip}`);
    const beforeThree = count(`${c.t080Left}...${c.t080Tip}`);
    if (beforeTwo !== c.t080BeforeTwoDot) f.push(`T-080 before the merge, two dots: doc says ${c.t080BeforeTwoDot}, git says ${beforeTwo}`);
    if (beforeThree !== c.t080BeforeThreeDot) f.push(`T-080 before the merge, three dots: doc says ${c.t080BeforeThreeDot}, git says ${beforeThree}`);
    add(
      "t080-collapse-at-the-merge",
      [
        "t080Left",
        "t080Merge",
        "t080Tip",
        "t080AncestorExit",
        "t080AtMergeTwoDot",
        "t080AtMergeThreeDot",
        "t080BeforeTwoDot",
        "t080BeforeThreeDot",
      ],
      f,
    );
  }

  // ── 6/7. the two columns, EACH UNDER ITS OWN METRIC ───────────────
  /** @type {[string, string, Record<string, number>, Record<string, number>][]} */
  const columns = [
    ["scoreboard-path-for-path", "PATH-FOR-PATH", d.pathScore, {
      "merge-tree": c.boardMergeTreePath,
      "three dots": c.boardThreeDotPath,
      "two dots": c.boardTwoDotPath,
    }],
    ["scoreboard-byte-for-byte", "BYTE-FOR-BYTE", d.byteScore, {
      "merge-tree": c.boardMergeTreeByte,
      "three dots": c.boardThreeDotByte,
      "two dots": c.boardTwoDotByte,
    }],
  ];
  for (const [id, metric, derived, published] of columns) {
    /** @type {string[]} */
    const f = [];
    if (c.boardOf !== d.merges.length) {
      f.push(
        `${metric}: the scoreboard is stated "of ${c.boardOf}" and the scored range holds ` +
          `${d.merges.length} merges`,
      );
    }
    for (const [name, want] of Object.entries(published)) {
      const got = derived[name];
      if (got !== want) {
        f.push(`${metric} ${name}: doc says ${want} of ${c.boardOf}, git says ${got} of ${d.merges.length}`);
      }
    }
    add(
      id,
      id.endsWith("path-for-path")
        ? ["boardMergeTreePath", "boardThreeDotPath", "boardTwoDotPath", "boardOf", "recipeTruth", "recipeMergeTree", "recipeThreeDot", "recipeTwoDot"]
        : ["boardMergeTreeByte", "boardThreeDotByte", "boardTwoDotByte"],
      f,
    );
  }

  // ── 8. the third metric, which needs its own label ────────────────
  {
    /** @type {string[]} */
    const f = [];
    const got = d.indexForgivingScore["three dots"];
    if (got !== c.thirdMetricThreeDot) {
      f.push(`index-forgiving metric, three dots: doc says ${c.thirdMetricThreeDot}, git says ${got}`);
    }
    for (const name of ["merge-tree", "two dots"]) {
      if (d.indexForgivingScore[name] !== d.byteScore[name]) {
        f.push(
          `index-forgiving metric: the doc says it "moves neither other row", and ${name} goes ` +
            `${d.byteScore[name]} → ${d.indexForgivingScore[name]}`,
        );
      }
    }
    add("scoreboard-third-metric", ["thirdMetricThreeDot"], f);
  }

  // ── 9. the six merges that separate three dots' two scores ────────
  {
    /** @type {string[]} */
    const f = [];
    if (c.splitCount !== c.splitMerges.length) {
      f.push(
        `the bullet says ${c.splitCount} merges separate three dots' two scores and then lists ` +
          `${c.splitMerges.length}`,
      );
    }
    if (!sameCommits(d.splitMerges, c.splitMerges)) {
      f.push(
        `the merges where three dots names the right paths against the wrong baseline: doc ` +
          `lists ${c.splitMerges.join(", ")}, git derives ` +
          `${d.splitMerges.map((m) => m.slice(0, 7)).join(", ")}`,
      );
    }
    add("three-dots-two-scores-split", ["splitCount", "splitMerges"], f);
  }

  // ── 10. the refusal a scoreboard must not count as a miss ─────────
  {
    /** @type {string[]} */
    const f = [];
    if (!sameCommits(d.conflictMerges, [c.conflictMerge])) {
      f.push(
        `merge-tree refuses on ${d.conflictMerges.map((m) => m.slice(0, 7)).join(", ") || "no merge"} ` +
          `in the scored range; the doc names ${c.conflictMerge}`,
      );
    }
    const inner = must(c.recipeMergeTree, /\$\((.+)\)/, "the merge-tree command inside the substitution");
    const direct = sh(root, instantiate(str(inner, 1, "the inner command"), c.conflictMerge));
    if (direct.status !== c.conflictExit) {
      f.push(
        `merge-tree at ${c.conflictMerge}: the doc says it exits ${c.conflictExit} and prints ` +
          `CONFLICT, this machine exits ${direct.status}`,
      );
    }
    add("merge-tree-refusal-is-not-a-miss", ["conflictMerge", "conflictExit"], f);
  }

  // ── 11. the ceiling, DERIVED and not named ────────────────────────
  {
    /** @type {string[]} */
    const f = [];
    if (!sameCommits(d.treeMismatches, [c.ceilingMerge])) {
      f.push(
        `the merges whose own tree differs from the mechanical merge of their parents: git ` +
          `derives ${d.treeMismatches.map((m) => m.slice(0, 7)).join(", ") || "none"}, the doc ` +
          `names ${c.ceilingMerge}. A merge commit that carries work is a merge commit whose ` +
          "diff nobody reviewed as a diff",
      );
    }
    if (c.ceilingOfHowMany !== d.merges.length) {
      f.push(
        `the ceiling is stated as one merge in ${c.ceilingOfHowMany} and the scored range holds ` +
          `${d.merges.length}`,
      );
    }
    add("merge-commit-ceiling", ["ceilingMerge", "ceilingOfHowMany"], f);
  }

  // ── 12. the identity EXECUTED, never read ─────────────────────────
  {
    /** @type {string[]} */
    const f = [];
    const threeDotRange = c.recipeThreeDot.replace(/^git diff /, "");
    const identityRange = c.threeDotIdentitySpelling.replace(/\bA\b/g, "M^1").replace(/\bB\b/g, "M^2");
    if (identityRange === c.threeDotIdentitySpelling) {
      f.push(
        `the identity's equivalent spelling ${JSON.stringify(c.threeDotIdentitySpelling)} names ` +
          "neither A nor B, so it cannot be instantiated and cannot be executed",
      );
    }
    const asIdentity = c.recipeThreeDot.replace(threeDotRange, identityRange);
    let disagreements = 0;
    for (const m of d.merges) {
      const dots = sh(root, nameOnly(instantiate(c.recipeThreeDot, m)));
      const base = sh(root, nameOnly(instantiate(asIdentity, m)));
      if (dots.status !== 0 || base.status !== 0) {
        f.push(`the identity could not be executed at ${m.slice(0, 7)}`);
        continue;
      }
      if (!sameSet(lines(dots.stdout), lines(base.stdout))) {
        disagreements += 1;
        f.push(
          `three-dot identity FAILS at ${m.slice(0, 7)}: \`A...B\` returns ` +
            `${lines(dots.stdout).length} paths and \`$(git merge-base A B)..B\` returns ` +
            `${lines(base.stdout).length}`,
        );
      }
    }
    if (disagreements === 0) {
      // POSITIVE CONTROL. "The two spellings agree" is satisfied equally by
      // an identity that holds and by a comparison that compares nothing,
      // so prove the harness can see a disagreement at all — the FORBIDDEN
      // two-dot form differs from three dots somewhere in this range.
      const differs = d.merges.some((m) => {
        const two = sh(root, nameOnly(instantiate(c.recipeTwoDot, m)));
        const three = sh(root, nameOnly(instantiate(c.recipeThreeDot, m)));
        return two.status === 0 && three.status === 0 && !sameSet(lines(two.stdout), lines(three.stdout));
      });
      if (!differs) {
        f.push(
          "three-dot identity: the comparison agreed on every merge AND its positive control " +
            "found no pair the two-dot form separates, so the agreement is indistinguishable " +
            "from a comparison that compares nothing",
        );
      }
    }
    add("three-dot-identity-executed", ["threeDotIdentitySpelling"], f);
  }

  // ── 13. the four headline flip counts, at the flip ref's trigger ──
  {
    /** @type {string[]} */
    const f = [];
    const boot = d.flipsAtFlipRef["BOOT GATE"];
    const graph = d.flipsAtFlipRef["GRAPH REGEN"];
    if (boot === undefined || graph === undefined) {
      f.push("the flip derivation is missing a gate");
    } else {
      if (boot.notOwed !== c.bootNotOwed) f.push(`BOOT GATE not owed: doc says ${c.bootNotOwed}, git says ${boot.notOwed}`);
      if (boot.flips.length !== c.bootFlips) f.push(`BOOT GATE flips: doc says ${c.bootFlips}, git says ${boot.flips.length}`);
      if (graph.notOwed !== c.graphNotOwed) f.push(`GRAPH REGEN not owed: doc says ${c.graphNotOwed}, git says ${graph.notOwed}`);
      if (graph.flips.length !== c.graphFlips) f.push(`GRAPH REGEN flips: doc says ${c.graphFlips}, git says ${graph.flips.length}`);
      if (graph.notOwed !== c.graphChances) {
        f.push(`GRAPH REGEN's "${c.graphFlips} of ${c.graphChances}": git says ${graph.flips.length} of ${graph.notOwed}`);
      }
      const total = boot.flips.length + graph.flips.length;
      const chances = boot.notOwed + graph.notOwed;
      const distinct = new Set([...boot.flips, ...graph.flips]).size;
      if (total !== c.flipTotal) f.push(`total flips: doc says ${c.flipTotal}, git says ${total}`);
      if (chances !== c.flipChances) f.push(`total chances: doc says ${c.flipChances}, git says ${chances}`);
      if (distinct !== c.flipDistinct) f.push(`distinct merges: doc says ${c.flipDistinct}, git says ${distinct}`);
      if (total === 0) {
        // POSITIVE CONTROL for the reverse-flip universal below: a
        // detector that never fires proves nothing by not firing.
        f.push("the flip detector found ZERO flips, so its zero in the other direction means nothing");
      }
    }
    add(
      "flip-headline-counts",
      ["flipRef", "bootNotOwed", "bootFlips", "graphNotOwed", "graphFlips", "graphChances", "flipTotal", "flipChances", "flipDistinct", "recipePrescribed", "recipeNaive"],
      f,
    );
  }

  // ── 14. the lists BY GATE — never merged into one set ─────────────
  add(
    "flip-lists-by-gate",
    [
      "flipsByGate",
      "misattributedMerge",
      "misattributedGraphPrescribed",
      "misattributedGraphNaive",
      "misattributedBootPrescribed",
      "misattributedBootNaive",
    ],
    flipListFindings(d, c),
  );
  // ── 15. a gate count is a function of its gate's TRIGGER ──────────
  //
  // The flip figures are checked ABOVE against the trigger as it stood at
  // the ref the paragraph names, because that is what produced them and a
  // figure stated with its ref is a MEASUREMENT rather than a stale
  // number. Re-deriving them against the trigger on disk instead would
  // RED ON A TRUE NUMBER — the same mistake as re-deriving the scored
  // range with the exclusive spelling and reporting 30 as a defect.
  //
  // What IS checkable here is the relationship between the two vintages,
  // and it is checkable without knowing either suffix list: a trigger
  // that gains suffixes can only ever match MORE paths, so its not-owed
  // count can only fall and its flip set can only shrink. Where the two
  // vintages disagree the reader DISCLOSES rather than fails.
  {
    /** @type {string[]} */
    const f = [];
    /** @type {string[]} */
    const notes = [];
    const refExists = gitTry(root, ["rev-parse", "--verify", `${c.flipRef}^{commit}`]).status;
    if (refExists !== 0) {
      f.push(
        `the flip paragraph states its figures at \`${c.flipRef}\` and that ref does not resolve ` +
          "in this repository, so nothing can say which trigger produced them",
      );
    }
    for (const [gate, atRef] of Object.entries(d.triggersAtFlipRef)) {
      const onDisk = d.triggersOnDisk[gate];
      const before = d.flipsAtFlipRef[gate];
      const after = d.flipsOnDisk[gate];
      if (onDisk === undefined || before === undefined || after === undefined) {
        f.push(`${gate}: the trigger or its derivation is missing on one side of the comparison`);
        continue;
      }
      const widened = onDisk.suffixes.filter((s) => !atRef.suffixes.includes(s));
      const narrowed = atRef.suffixes.filter((s) => !onDisk.suffixes.includes(s));
      if (narrowed.length > 0) {
        f.push(
          `${gate}'s trigger has NARROWED since \`${c.flipRef}\` (lost ${narrowed.join(", ")}). A ` +
            "trigger wider than the walk over-fires harmlessly; a trigger NARROWER than the " +
            "walk MISSES A REAL MOVEMENT, which is the one direction the gate's own " +
            '"deliberately wider than the walk" argument does not protect',
        );
      }
      if (narrowed.length > 0) continue;
      // MONOTONICITY. Derived, and it holds whether or not the trigger
      // moved — so it is the same assertion on a quiet tree and a noisy
      // one, and it is what would catch a derivation that mixed vintages.
      if (after.notOwed > before.notOwed) {
        f.push(
          `${gate}: the trigger on disk is a superset of the one at \`${c.flipRef}\`` +
            `${widened.length > 0 ? ` (it gained ${widened.join(", ")})` : ""} and yet the ` +
            `not-owed count ROSE, ${before.notOwed} → ${after.notOwed}. A wider trigger matches ` +
            "more paths and can only ever LOWER that count, so this derivation is wrong somewhere",
        );
      }
      const escaped = after.flips.filter((m) => !before.flips.includes(m));
      if (escaped.length > 0) {
        f.push(
          `${gate}: widening the trigger produced flips that were not flips before ` +
            `(${escaped.map((m) => m.slice(0, 7)).join(", ")}), which a superset cannot do`,
        );
      }
      if (widened.length === 0) continue;
      if (after.notOwed !== before.notOwed || after.flips.length !== before.flips.length) {
        notes.push(
          `${gate}'s published flip figures are stated at \`${c.flipRef}\` and ARE RIGHT THERE, ` +
            `and its trigger has since gained ${widened.join(", ")}: ${before.flips.length} of ` +
            `${before.notOwed} at that ref, ${after.flips.length} of ${after.notOwed} under the ` +
            "trigger on disk. A COUNT IS A FUNCTION OF ITS TRIGGER exactly the way a path count " +
            "is a function of its range spelling. The paragraph carries its ref, which is what " +
            "keeps it honest; it does not carry the trigger, which is what would keep it " +
            "READABLE. Disclosed rather than failed — the figure is a measurement, not a defect.",
        );
      }
    }
    add("flip-counts-carry-their-trigger", [], f, notes);
  }

  // ── 16. the reverse universal, under BOTH trigger vintages ────────
  {
    /** @type {string[]} */
    const f = [];
    if (d.reverseFlips.length > 0) {
      f.push(
        "the reverse universal is FALSE: the naive range says a gate is not owed while the " +
          `prescribed one says it is, at ${d.reverseFlips.join(", ")}. Every error measured in ` +
          "this bullet is in the over-firing direction, and that is a property of this " +
          "repository's history rather than a guarantee git gives you",
      );
    }
    add("reverse-flip-universal", [], f);
  }

  // ── 17. the falsified sentence's own dating ───────────────────────
  {
    /** @type {string[]} */
    const f = [];
    const status = gitTry(root, ["merge-base", "--is-ancestor", c.t083Counterexample, c.t083WrittenAt]).status;
    if (status !== c.t083AncestorExit) {
      f.push(
        `the falsified sentence's dating: the doc says \`git merge-base --is-ancestor ` +
          `${c.t083Counterexample} ${c.t083WrittenAt}\` exits ${c.t083AncestorExit}, git exits ` +
          `${status} — the counterexample is not an ancestor of the commit that wrote the claim`,
      );
    }
    const wrote = Date.parse(git(root, ["log", "-1", "--format=%cI", c.t083WrittenAt]).trim());
    const landed = Date.parse(git(root, ["log", "-1", "--format=%cI", c.t083Counterexample]).trim());
    if (!(landed < wrote)) {
      f.push(
        `the falsified sentence's dating: ${c.t083Counterexample} does not predate ` +
          `${c.t083WrittenAt}. AN UNREFED DURATION GOES STALE EXACTLY THE WAY AN UNREFED COUNT ` +
          "DOES, and one `git log --format=%ci` settles both",
      );
    }
    add("falsified-sentence-dating", ["t083WrittenAt", "t083Counterexample", "t083AncestorExit"], f);
  }

  // ── 18. the JUDGEMENT half: PRESENCE, never value ─────────────────
  {
    /** @type {string[]} */
    const f = [];
    /** @type {[string, string][]} */
    const commitments = [
      ["the `merge-tree` command", c.proseMergeTreeCommand],
      ['the `Not "rarely"` refusal', c.proseNotRarely],
      ["the exit-code warning", c.proseExitCodeWarning],
    ];
    for (const [what, text] of commitments) {
      if (text.trim().length === 0) f.push(`${what} parsed to an empty string`);
    }
    if (!c.preMergeTreeCommand.includes("merge-tree")) {
      f.push("the executor's prescribed recipe no longer invokes `merge-tree`");
    }
    add(
      "judgement-half-present-not-valued",
      ["proseMergeTreeCommand", "proseNotRarely", "proseExitCodeWarning"],
      f,
    );
  }

  // ── 19. the exit code THIS bullet's own recipe hands you ──────────
  {
    /** @type {string[]} */
    const f = [];
    const m = c.conflictMerge;
    // The doc's own warning, executed: run the executor's printed recipe
    // at the merge where merge-tree refuses, and read `$?` where the doc
    // says to read it — off the ASSIGNMENT, before the next line runs.
    const assign = sh(
      root,
      `${c.preMergeTreeCommand.replaceAll("<main tip>", `${m}^1`).replace(/\bHEAD\b/, `${m}^2`)}\nexit $?`,
    );
    if (assign.status !== c.conflictExit) {
      f.push(
        `the executor's printed recipe at ${m}: the doc says merge-tree exits ${c.conflictExit} ` +
          `on a conflict and that $? is readable off the assignment; this machine reads ` +
          `${assign.status}`,
      );
    }
    const whole = sh(
      root,
      `${c.preMergeTreeCommand.replaceAll("<main tip>", `${m}^1`).replace(/\bHEAD\b/, `${m}^2`)}\n` +
        `${c.preMergeDiffCommand.replaceAll("<main tip>", `${m}^1`)}`,
    );
    if (whole.status === c.conflictExit) {
      f.push(
        `the executor's printed recipe at ${m} ends at exit ${whole.status}, the same code the ` +
          "conflict itself carries, so the doc's insistence on reading `$?` FIRST no longer " +
          "distinguishes anything",
      );
    }
    if (whole.status === 0) {
      f.push(
        `the executor's printed recipe at ${m} ends at exit 0 over a merge that CONFLICTS — an ` +
          "EMPTY forecast wearing the costume of a clean gate, which is the outcome the bullet's " +
          "exit-code warning exists to name",
      );
    }
    add("printed-recipe-exit-codes", [], f);
  }

  // ── 20. THE NINTH ITEM, from T-084's integration ──────────────────
  {
    /** @type {string[]} */
    const f = [];
    /** @type {string[]} */
    const n = [];
    const md = conventionsText(root);
    const recipe = parseDocsGateRecipe(md);
    const probe = probeXargs();
    const calledWrong = Object.entries(recipe.matrix).find(([, v]) => v.meaning.includes("called wrong"));
    const hasVerdict = Object.entries(recipe.matrix).find(([, v]) => v.meaning.includes("verdict"));
    if (calledWrong === undefined || hasVerdict === undefined) {
      f.push("the DOCS GATE's exit-code matrix no longer names both a verdict row and a called-wrong row");
    } else {
      const [, wrong] = calledWrong;
      const [, verdict] = hasVerdict;
      /** @param {string} left @param {string} right @returns {string} */
      const printed = (left, right) =>
        `${recipe.treeLine.replaceAll("<main tip>", left).replace(/\bHEAD\b/, right)}\n` +
        `${recipe.gateLine.replaceAll("<main tip>", left)}`;
      /** @param {string} left @param {string} right @returns {string} */
      const piped = (left, right) =>
        `${recipe.treeLine.replaceAll("<main tip>", left).replace(/\bHEAD\b/, right)}\n` +
        `${pipedThroughXargs(recipe.gateLine).replaceAll("<main tip>", left)}`;

      // THE MATRIX IS SCORED PER DIALECT AND SO IS THIS READER
      // (T-153-s6). The piped columns were parsed and then compared
      // against the BSD one whatever machine was running, so this check
      // redded on Linux for being right: CI runs 33259394002 and
      // 33260414204 observed GNU's 123 against a Darwin-measured 0. The
      // dialect is PROBED — `scripts/xargs-dialect.mjs`, two observables,
      // never `process.platform` — and an `xargs` matching no measured
      // row is a finding, not a branch taken by default.
      const known = Object.keys(XARGS_DIALECTS).sort();
      if (key(recipe.dialects) !== key(known)) {
        f.push(
          `the DOCS GATE matrix scores [${recipe.dialects.join(", ")}] and this lane's prober ` +
            `knows [${known.join(", ")}]: a dialect one side has measured and the other does ` +
            "not name is a column nobody compares. Both sides move together or neither does",
        );
      }
      // THE TWO-SIDED PIN, ON THE DOCUMENT ITSELF. The empty-list cell is
      // the whole hazard, and the platforms DISAGREE there — BSD never
      // runs the gate (0), GNU runs it and the gate's own refusal comes
      // back mapped. A matrix that gave one number for both dialects
      // would make this reader unable to tell which one it measured, and
      // that collapse reds here before any code is run.
      const emptyCells = recipe.dialects.map((dd) => wrong.pipedEmpty[dd]);
      if (emptyCells.some((v) => v === undefined || v === null)) {
        f.push(
          `the DOCS GATE matrix's "${wrong.meaning}" row does not say what the piped spelling ` +
            `gives ON AN EMPTY LIST for every dialect it scores (` +
            `${recipe.dialects.map((dd, i) => `${dd}=${String(emptyCells[i])}`).join(", ")}) — ` +
            "that cell is the failure the `$(…)` spelling exists to avoid",
        );
      } else if (new Set(emptyCells).size !== emptyCells.length) {
        f.push(
          "the DOCS GATE matrix now gives the SAME empty-list code for every dialect " +
            `(${emptyCells.join(", ")}). The divergence is the finding — normalise it away in ` +
            "the document and no reader can tell a platform it has measured from one it has not",
        );
      }
      // AND THE `$(…)` FORM MUST STAY PLATFORM-INDEPENDENT, because that
      // asymmetry IS the bullet's argument for printing it.
      for (const r of [wrong, verdict]) {
        const cells = recipe.dialects.map((dd) => r.substitution[dd]);
        if (new Set(cells).size !== 1) {
          f.push(
            `the DOCS GATE matrix's "${r.meaning}" row now scores the \`$(…)\` form differently ` +
              `by dialect (${recipe.dialects.map((dd, i) => `${dd}=${String(cells[i])}`).join(", ")}). ` +
              "That form has no `xargs` process in it; if it has become platform-dependent, the " +
              "bullet's whole argument for printing it needs re-making rather than re-scoring",
          );
        }
      }

      // A ref that cannot resolve, so the range command FAILS and the
      // substitution yields nothing. Not a figure — a fixture.
      const BROKEN = "no-such-ref-T-091";
      const emptyRun = sh(root, printed(BROKEN, "HEAD"));
      const realRun = sh(root, printed(c.t078MainBefore, c.t078Tip));
      const emptyPrinted = emptyRun.status;
      const realPrinted = realRun.status;

      // The piped spelling is measured only where there is an `xargs` to
      // measure, and only where the probe knows which column to read.
      const measurePiped = probe.present && probe.name !== "unknown";
      if (!probe.present) {
        n.push(`the piped column was NOT measured here: ${probe.evidence}`);
      } else if (probe.name === "unknown") {
        f.push(
          `this machine's \`xargs\` matches no dialect this repository has measured — ` +
            `${probe.evidence}. Measure it, add its row to XARGS_DIALECTS and its column to ` +
            "the DOCS GATE bullet's matrix. A third dialect reds here rather than silently " +
            "taking whichever branch was written first, which is the defect T-153-s6 repaired",
        );
      } else {
        n.push(`${probe.evidence}; the matrix's ${probe.name} column is the one compared`);
      }
      const emptyPipedRun = measurePiped ? sh(root, piped(BROKEN, "HEAD")) : undefined;
      const realPipedRun = measurePiped ? sh(root, piped(c.t078MainBefore, c.t078Tip)) : undefined;
      const emptyPiped = emptyPipedRun?.status;
      const realPiped = realPipedRun?.status;

      // A CODE THE GATE NEVER PRODUCED IS NOT THE GATE'S ANSWER, and the
      // whole point of this criterion is that a code you cannot attribute
      // is worthless. `docs-gate.mjs` imports `yaml`, so in a checkout
      // where `tools/e2e/node_modules` is absent node never links it and
      // exits **1** — the code this gate reserves for "HAS a verdict".
      // Measured at T-091 in a detached drill worktree; the same shape
      // T-080-s4 already names for the token lint, undocumented here, and
      // filed as `T-091-s1`. Without this arm the reader would report a
      // wrong code where the honest answer is "the gate never ran".
      /** @type {[string, {stdout: string, stderr: string, status: number}][]} */
      const runsMade = [
        ["on a failed range, printed", emptyRun],
        ["on a real range, printed", realRun],
      ];
      if (emptyPipedRun !== undefined) runsMade.push(["on a failed range, piped", emptyPipedRun]);
      if (realPipedRun !== undefined) runsMade.push(["on a real range, piped", realPipedRun]);
      const neverLinked = runsMade.filter(
        ([, r]) =>
          r.stderr.includes("ERR_MODULE_NOT_FOUND") || r.stderr.includes("Cannot find package"),
      );
      if (neverLinked.length > 0) {
        f.push(
          `the DOCS GATE never LINKED in ${JSON.stringify(root)} ` +
            `(${neverLinked.map(([w]) => w).join("; ")}): node could not resolve one of its ` +
            "imports, so the code observed is node's and not the gate's. Run `npm ci` from " +
            "tools/e2e/ in that checkout. This is reported instead of an exit-code mismatch " +
            "because a code you cannot attribute is exactly what this criterion exists to reject",
        );
      } else {
        // THE `$(…)` FORM IS SCORED AGAINST THE ONE VALUE ITS COLUMNS
        // AGREE ON — the check above is what makes "the one value" safe
        // to speak of, and this reads the DETECTED dialect's cell so the
        // two halves cannot drift apart.
        const column = probe.name;
        const printedEmptyWanted = wrong.substitution[column] ?? wrong.substitution[recipe.dialects[0] ?? ""];
        const printedRealWanted = verdict.substitution[column] ?? verdict.substitution[recipe.dialects[0] ?? ""];
        if (printedEmptyWanted !== undefined && emptyPrinted !== printedEmptyWanted) {
          f.push(
            `the DOCS GATE's PRINTED spelling on a failed range: the doc promises ` +
              `${printedEmptyWanted} ("${wrong.meaning}"), this machine observes ${emptyPrinted}`,
          );
        }
        if (printedRealWanted !== undefined && realPrinted !== printedRealWanted) {
          f.push(
            `the DOCS GATE's PRINTED spelling on a real range: the doc promises ` +
              `${printedRealWanted} ("${verdict.meaning}"), this machine observes ${realPrinted}`,
          );
        }
        if (measurePiped) {
          const pipedEmptyWanted = wrong.pipedEmpty[column];
          const pipedRealWanted = verdict.piped[column];
          if (pipedEmptyWanted !== null && pipedEmptyWanted !== undefined && emptyPiped !== pipedEmptyWanted) {
            f.push(
              `the FORBIDDEN piped spelling on a failed range, under ${column} \`xargs\`: the ` +
                `doc's measured matrix says ${pipedEmptyWanted} on an empty list, this machine ` +
                `observes ${String(emptyPiped)} (${probe.evidence})`,
            );
          }
          if (pipedRealWanted !== undefined && realPiped !== pipedRealWanted) {
            f.push(
              `the FORBIDDEN piped spelling on a real range, under ${column} \`xargs\`: the doc's ` +
                `measured matrix says ${pipedRealWanted}, this machine observes ${String(realPiped)}`,
            );
          }
          // POSITIVE CONTROL. "The observed codes match the promised ones"
          // is satisfied equally by a matrix that discriminates and by one
          // where every cell holds the same number. The doc's whole argument
          // is that the pipe EATS a code, so require the two spellings to
          // disagree where the failure lives. THE EMPTY-LIST ROW IS THAT
          // PLACE ON BOTH DIALECTS, and it is the one the old "they agree
          // on a real range" control could not be: that agreement is BSD's
          // alone, and asserting it universally is what redded on Linux.
          if (emptyPrinted === emptyPiped) {
            f.push(
              "the printed and the piped spellings return the SAME code on a failed range, so this " +
                "check cannot tell a recipe whose exit code survives from one the pipeline eats — " +
                "which is the only thing it exists to tell",
            );
          }
          // AND THE PROBE IS CHECKED AGAINST THE REAL PIPELINE. The
          // dialect was classified from two synthetic probes; whether the
          // GATE ITSELF ran on the empty list is readable from its own
          // output, and the two must agree or the classification is a
          // guess wearing a measurement's clothes.
          const dialect = XARGS_DIALECTS[column];
          const gateSpoke = `${emptyPipedRun?.stdout ?? ""}${emptyPipedRun?.stderr ?? ""}`.includes(
            "docs-gate:",
          );
          if (dialect !== undefined && gateSpoke !== dialect.runsUtilityOnEmptyInput) {
            f.push(
              `the probe calls this \`xargs\` ${column}, which ` +
                `${dialect.runsUtilityOnEmptyInput ? "RUNS" : "does NOT run"} the utility on an ` +
                `empty list, but piping a FAILED range into the real gate ` +
                `${gateSpoke ? "did" : "did not"} produce the gate's own output. One of the two ` +
                "measurements is wrong and neither may be trusted until it is settled",
            );
          }
        }
      }
    }
    add("docs-gate-recipe-exit-codes", [], f, n);
  }

  return checks;
}

/* ─────────────────────────── the entry point ────────────────────────── */

/** @type {Map<string, {derivation: RangeRuleDerivation, checks: Check[]}>} */
const cache = new Map();

/**
 * The whole reader, memoised per root: one derivation, many assertions.
 *
 * @param {string} [root]
 * @returns {{derivation: RangeRuleDerivation, checks: Check[]}}
 */
export function rangeRuleReport(root = repoRoot) {
  const hit = cache.get(root);
  if (hit !== undefined) return hit;
  const derivation = deriveRangeRule(root);
  const report = { derivation, checks: rangeRuleChecks(derivation) };
  cache.set(root, report);
  return report;
}
