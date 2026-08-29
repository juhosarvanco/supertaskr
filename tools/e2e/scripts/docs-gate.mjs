#!/usr/bin/env node
/**
 * THE DOCS GATE (T-084) — the hand-run half.
 *
 * THE ONE SPELLING, and it is the same string docs/CONVENTIONS.md's
 * DOCS GATE bullet prints (T-090; T-057 — a recipe in two places is two
 * chances to disagree, and these two disagreed):
 *
 *   TREE=$(git merge-tree --write-tree <main tip> HEAD)   # read $? FIRST
 *   node tools/e2e/scripts/docs-gate.mjs $(git diff --name-only <main tip> "$TREE")
 *
 * Feed it the changed paths of the diff the RANGE RULE names — this
 * tool deliberately computes no range of its own, because a second
 * opinion about which two commits "the merge's diff" means is exactly
 * the failure docs/CONVENTIONS.md's range rule exists to prevent.
 *
 * NO `xargs`, AND THAT IS THE WHOLE OF WHY THE SPELLING CHANGED. This
 * header used to print `… | xargs node …/docs-gate.mjs`. A pipe through
 * `xargs` DESTROYS two of the four codes below, differently on each
 * platform, in the direction the codes exist to prevent (T-090's matrix,
 * measured at `9b03ae6` on Darwin 25.6.0 against `/usr/bin/xargs`): BSD
 * `xargs` never invokes the utility on EMPTY input, so a range command
 * that FAILED exits **0** — the gate never ran and the reader is told
 * nothing is owed — and it collapses EVERY nonzero utility exit to **1**,
 * so "called wrong" and "GATE COULD NOT RUN" both arrive as "has a
 * verdict". GNU `xargs` on CI's ubuntu runner breaks it the OTHER way
 * (1–125 map to 123). A MAPPING QUOTED WITHOUT ITS PLATFORM IS WRONG ON
 * ONE OF THEM. The `$(…)` form above has no such layer: the shell reports
 * this process's own status, and a FAILED range substitutes to nothing,
 * which is zero arguments, which is EXIT 2 below.
 *
 * The unquoted substitution splits on whitespace, so a tracked path
 * containing a space would arrive as fragments. This tree has none, and
 * that failure direction is loud rather than silent: a fragment under
 * docs/ makes the gate OVER-fire (the `docs` prefix covers `docs/my`),
 * and a fragment that leaves the repository is refused as called-wrong.
 * QUOTING the substitution is the spelling that is not safe — one
 * argument holding the whole newline-joined list reads as a clean tree
 * (T-064-s7), which is why that shape is refused by name.
 *
 * `npm run lint:docs` from tools/e2e/ is the NAMED form and CI's step
 * (T-090). It runs the WHOLE-TREE half — the frontmatter vocabulary, the
 * root-anchor account and the unlinkable-reader tripwire — and judges NO
 * diff, because a workflow has no "merge's diff" to be handed and this
 * tool will not compute one. Both incidents this gate was built for
 * (`9c64cd8`, `fede266`) live in the half CI now holds; the DIFF half is
 * still the integrator's hand run, and the bullet says so.
 *
 * `node tools/e2e/scripts/docs-gate.mjs --census` prints the derivation
 * and judges no diff — the figures docs/CONVENTIONS.md used to carry as
 * digits, which went stale at their own named ref. Paths may be given
 * BESIDE it, in which case it prints the derivation and judges them too.
 *
 * It answers two questions and nothing else:
 *
 *   1. Which suites does this diff owe, because a body in them reads
 *      the paths under `docs/` that it changed? The reader set is
 *      DERIVED from the tree by docs-scan.mjs, never listed.
 *   2. Does any live task card carry frontmatter the parser will
 *      refuse — a block that will not parse, or a `status:` outside the
 *      vocabulary? That question is asked of the WHOLE tree, not only
 *      of the diff: a card broken three commits ago is still broken,
 *      and this gate is the first thing in the pipeline that names the
 *      FILE instead of an off-by-two in somebody else's assertion.
 *
 * EXIT CODES — the house contract, the same four `index --check` and
 * `boot:check` use, so "stale" and "could not tell you" are never the
 * same number:
 *   0  ran, and the diff owes nothing: no changed path reaches a reader
 *      and every live card's frontmatter is legal.
 *   1  ran and FOUND something: suites are owed, or a card is illegal,
 *      or the root-anchor account disagrees with the tree, or several.
 *      Read the message — they are printed apart.
 *   2  called wrong: an unknown flag, NO PATHS AT ALL, or a path list
 *      this gate cannot read as paths in this repository. Same meaning
 *      `index --check` gives 2, and it is the code that keeps "I looked
 *      and nothing is owed" separate from "I could not tell what you
 *      asked about". Four shapes reach it, each measured arriving as a
 *      CLEAN GATE before it did (T-084-s6, T-064-s7, T-101-s3):
 *        - zero arguments — a range command that failed, or a
 *          `merge-tree` whose exit was eaten by a command substitution;
 *        - an argument that is empty or blank — the same failed range,
 *          QUOTED, which is a list of length ONE and so slips past the
 *          zero-argument guard;
 *        - an argument carrying newlines — a quoted substitution handing
 *          the whole list over as one blob;
 *        - a path that resolves OUTSIDE this repository — `../../docs/…`
 *          typed from tools/e2e/, where the two neighbouring commands in
 *          the same workflow are run.
 *      A `./`-prefixed or ABSOLUTE spelling is not in that list: it is
 *      normalised to its root-relative form and ANSWERED, because it
 *      names a file in this repository and the gate knows which.
 *   3  the gate COULD NOT RUN, so this run is not a claim about the
 *      tree at all. Every throw out of docs-scan.mjs lands here.
 *
 * `yaml` is imported here rather than in the scanner: the scanner stays
 * zero-dependency so it can move to CI's first step against a bare
 * checkout, and this wrapper is the one place a dependency is allowed.
 * It is the SAME package lib/parser depends on, so a block either
 * parses for both or for neither (T-057: one implementation, not two).
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { parse as parseYaml } from "yaml";
import {
  ROOT_ANCHOR_LEDGER,
  docsGate,
  docsReaders,
  liveTaskCards,
  normalisePaths,
  packageRelativeSites,
  repoRoot,
  rootAnchoredFiles,
  siteCensus,
  taskCardIssues,
  taskStatuses,
  unaccountedRootAnchors,
  unlinkedFiles,
  unlinkedSites,
} from "./docs-scan.mjs";

const EXIT = Object.freeze({ CLEAN: 0, FOUND: 1, USAGE: 2, CANNOT_RUN: 3 });

/**
 * ADR-019: byte budgets for the governing documents. The compaction
 * TARGETS live in docs/rooms/governing-docs.md (12/24/20/48 KB); the
 * GATE values here are DERIVED at each document's compaction landing —
 * warn at landed size × 1.25, fail at landed size × 1.5 — and recorded
 * by addendum to ADR-019 with the measurement. A null entry is a
 * document whose compaction has not landed: no check runs, because
 * nothing may hard-fail until a compacted document exists to measure.
 * The budget is a tripwire against RELAPSE, not the instrument of the
 * cut: when it warns, content moves to docs/checkpoints/ or a card —
 * a hazard is never deleted to fit.
 */
const DOC_BUDGETS = Object.freeze({
  "docs/STATE.md": { landed: 6772, warn: 8465, fail: 10158 },
  "docs/ROADMAP.md": { landed: 8399, warn: 10499, fail: 12599 },
  "docs/ARCHITECTURE.md": { landed: 8525, warn: 10657, fail: 12788 },
  "docs/CONVENTIONS.md": { landed: 86373, warn: 107967, fail: 129560 },
});

const CENSUS_FLAG = "--census";

/** @param {string[]} argv */
function main(argv) {
  const flags = argv.filter((a) => a.startsWith("-"));
  const unknown = flags.filter((a) => a !== CENSUS_FLAG);
  if (unknown.length > 0) {
    console.error(
      `docs-gate: unknown flag ${unknown[0]} — usage: node tools/e2e/scripts/docs-gate.mjs <changed path>...\n` +
        "It takes PATHS, never a git range: the range is the RANGE RULE's answer, not this tool's.\n" +
        `The one flag is ${CENSUS_FLAG}, which prints the derivation; paths may be given beside it.`,
    );
    return EXIT.USAGE;
  }
  const wantsCensus = flags.includes(CENSUS_FLAG);

  // THE PATH LIST IS NORMALISED BEFORE IT IS JUDGED (T-090, absorbing
  // T-064-s7 and T-101-s3). `normalisePaths` owns the vocabulary and the
  // measured evidence; what matters here is that anything it refuses is
  // EXIT 2 and never an answer. The one thing this gate must never do is
  // give "I looked and nothing is owed" to a question it could not read.
  const { paths, problems, rewritten } = normalisePaths(
    argv.filter((a) => !a.startsWith("-")),
    { cwd: process.cwd(), root: repoRoot },
  );
  if (problems.length > 0) {
    console.error(
      `docs-gate: ${problems.length} argument(s) are not paths in this repository — ` +
        "usage: node tools/e2e/scripts/docs-gate.mjs <changed path>...",
    );
    for (const p of problems) console.error(`  ${p}`);
    console.error(
      "  This is CALLED WRONG, deliberately, and never a clean gate: a run that " +
        "could not read its question is not a claim about the tree.",
    );
    return EXIT.USAGE;
  }

  // T-084-s6. AN EMPTY PATH LIST IS A FAILED RANGE, NOT A CLEAN GATE.
  // A range command that failed, or a `merge-tree` whose exit was eaten
  // by a command substitution, arrives here as ZERO PATHS — and used to
  // be answered "this gate is not owed" at exit 0. That is silence
  // wearing a clean gate's costume, which is the exact thing T-084-s6
  // exists to strip off. Exit 2 is "called wrong".
  if (!wantsCensus && paths.length === 0) {
    console.error(
      "docs-gate: NO PATHS GIVEN — usage: node tools/e2e/scripts/docs-gate.mjs <changed path>...\n" +
        "  An empty path list is not a clean gate; it is a range that produced nothing.\n" +
        "  Re-run the RANGE RULE's own command and read ITS exit code before feeding it here.\n" +
        `  To see the derivation without judging a diff, run with ${CENSUS_FLAG}.`,
    );
    return EXIT.USAGE;
  }

  const readers = docsReaders();
  const unlinked = unlinkedFiles();
  const census = siteCensus();
  const anchored = rootAnchoredFiles();
  const unaccounted = unaccountedRootAnchors();
  const climbing = packageRelativeSites();
  const climbingUnlinked = unlinkedSites();
  const statuses = taskStatuses();
  const issues = taskCardIssues(liveTaskCards(), { statuses, parseYaml });
  const gate = docsGate(paths, readers);

  // WHAT THE GATE DECIDED YOUR QUESTION WAS, printed whenever it is not
  // what you typed. A normalisation that answers correctly and silently
  // is one an operator cannot check; this line is how `./docs/x` and an
  // absolute path show their work.
  if (rewritten.length > 0) {
    console.log(
      `docs-gate: ${rewritten.length} path(s) normalised to their root-relative spelling ` +
        "(this gate matches the RANGE RULE's own form, and answers no other):",
    );
    for (const r of rewritten) console.log(`  ${r.from}  ->  ${r.to}`);
  }

  console.log(
    `docs-gate: ${readers.length} derived docs readers across ` +
      `${new Set(readers.map((r) => r.suite)).size} suites; ` +
      `${issues.length} frontmatter issue(s) in the live tree`,
  );
  for (const r of readers) {
    console.log(
      `  reader  ${r.file}  [${r.command} from ${r.suite}/]  ${r.prefixes.join(" ")}  (${r.via.join(", ")})`,
    );
  }

  // THE CENSUS, PRINTED RATHER THAN TRANSCRIBED. docs/CONVENTIONS.md used
  // to carry these as digits at a named ref. They went stale, stayed
  // green because nothing derived them, and had been relayed into two
  // further documents by the time anybody re-measured. The bullet now
  // names this line instead of restating it.
  console.log(
    `docs-gate: census — ${census.sites} docs-shaped sites in ${census.siteFiles} files, ` +
      `${census.resolvedSites} of them in ${census.resolvedFiles} files RESOLVE into this repo's docs/; ` +
      `${anchored.length} files hold the repository root (` +
      `${anchored.filter((f) => f.kind === "derived").length} derived, ` +
      `${anchored.filter((f) => f.kind === "unlinked").length} unlinked, ` +
      `${anchored.filter((f) => f.kind === "unclassified").length} with no docs site this scan can link)`,
  );
  // T-085. The root-anchor census bounds the ROOT-anchored class and
  // nothing else — a docs path written relative to a PACKAGE directory
  // holds no root, and one is live on `cargo test`. That class has no
  // anchor to enumerate, so what is printed is its SHAPE: every
  // docs-shaped literal that climbs, and where it landed.
  console.log(
    `docs-gate: ${climbing.length} package-relative docs site(s) — ` +
      `${climbing.filter((c) => c.kind === "derived").length} resolve into docs/, ` +
      `${climbing.filter((c) => c.kind === "outside").length} outside it, ` +
      `${climbingUnlinked.length} with a base this scan cannot evaluate`,
  );
  for (const c of climbing) {
    console.log(`  climb   ${c.file}:${c.line}  ${c.raw}  -> ${c.prefix ?? c.kind.toUpperCase()}`);
  }
  console.log(
    `docs-gate: ${unaccounted.length} root-anchored file(s) sit in a suite NOT already owed for ` +
      "all of docs/ — each argued in ROOT_ANCHOR_LEDGER (docs-scan.mjs), and the two sets are asserted equal.",
  );

  let found = 0;

  // THE ACCOUNT AND THE TREE MUST AGREE. An unargued root-anchored file
  // in a suite that is not universally owed is the ROOT-ANCHORED shape
  // whose answer could be short — the package-relative half is the
  // separate tripwire below and neither reaches the other (T-085) — so
  // it is news here as well as in the lane, because the lane is not what
  // an integrator runs at a merge.
  /** @type {string[]} */
  const ledgerFiles = ROOT_ANCHOR_LEDGER.map((e) => e.file).sort();
  const seen = [...unaccounted].sort();
  if (JSON.stringify(ledgerFiles) !== JSON.stringify(seen)) {
    console.error("\ndocs-gate: the root-anchor ACCOUNT and the tree disagree:");
    for (const f of seen) {
      if (!ledgerFiles.includes(f)) console.error(`  + ${f} — holds the root, unargued`);
    }
    for (const f of ledgerFiles) {
      if (!seen.includes(f)) console.error(`  - ${f} — argued, no longer in the set`);
    }
    found += 1;
  }

  if (climbingUnlinked.length > 0) {
    // The package-relative half of the same tripwire, and it needs its
    // own because the root-anchor one cannot reach it: a file that
    // climbs out of its package dir into docs/ holds no root, so
    // `unlinkedFiles()` never looks at it.
    console.error(
      "\ndocs-gate: a PACKAGE-RELATIVE docs path has a base this scan cannot evaluate — a reader may be MISSING:",
    );
    for (const c of climbingUnlinked) console.error(`  ${c.file}:${c.line}  base: ${c.base}  path: ${c.raw}`);
    found += climbingUnlinked.length;
  }

  if (unlinked.length > 0) {
    // A file that BOTH forms a docs-first path AND computes the repo
    // root, which this scanner could not link. It is either a reader in
    // a shape the calculus does not know or a genuine non-reader, and
    // the scanner cannot tell — so it says so instead of dropping it.
    console.error("\ndocs-gate: the derivation could not link these files — a reader may be MISSING:");
    for (const u of unlinked) console.error(`  ${u.file}  bases: ${u.bases.join(", ")}`);
    found += unlinked.length;
  }

  if (paths.length === 0) {
    // Only reachable WITH the census flag: without it, zero paths is the
    // failed range refused above.
    console.log(`\ndocs-gate: ${CENSUS_FLAG} — the derivation above, no diff judged.`);
  } else if (gate.docsPaths.length === 0) {
    console.log(
      `\ndocs-gate: ${paths.length} changed path(s) given, none under docs/ — this gate is not owed.`,
    );
  } else if (!gate.fires) {
    console.log(
      `\ndocs-gate: ${gate.docsPaths.length} path(s) under docs/, none of them read by any suite.`,
    );
  } else {
    console.error(
      `\ndocs-gate: FIRES — ${gate.docsPaths.length} path(s) under docs/ are code inputs. Run:`,
    );
    for (const cmd of gate.commands) console.error(`  ${cmd}`);
    for (const entry of gate.byPath) {
      if (entry.readers.length === 0) continue;
      console.error(`  ${entry.path}  <- ${entry.readers.join(", ")}`);
    }
    found += 1;
  }

  if (issues.length > 0) {
    console.error(`\ndocs-gate: ${issues.length} task card(s) the parser will refuse:`);
    for (const issue of issues) console.error(`  ${issue.message}`);
    found += issues.length;
  } else {
    console.log(`docs-gate: every live task card's frontmatter parses, with a legal status.`);
  }

  // ADR-019: the governing-document budget tripwire — whole-tree, like
  // the frontmatter half above. Loud in both directions once a
  // document's compaction has landed; silent about documents still
  // awaiting theirs.
  const gated = /** @type {[string, { landed: number, warn: number, fail: number }][]} */ (
    Object.entries(DOC_BUDGETS).filter(([, b]) => b !== null)
  );
  let breaches = 0;
  for (const [rel, b] of gated) {
    const size = statSync(path.join(repoRoot, rel)).size;
    if (size > b.fail) {
      console.error(
        `\ndocs-gate: ${rel} is OVER BUDGET — ${size} bytes against its ${b.fail}-byte fail line ` +
          "(ADR-019: records belong in docs/checkpoints/ and cards, never here; " +
          "raise the line only by ADR addendum with a measured reason).",
      );
      breaches += 1;
    } else if (size > b.warn) {
      console.error(
        `docs-gate: budget WARN — ${rel} is ${size} bytes against its ${b.warn}-byte warn line ` +
          `(fail at ${b.fail}; ADR-019).`,
      );
    }
  }
  found += breaches;
  if (breaches === 0 && gated.length > 0) {
    console.log(
      `docs-gate: governing-document budgets hold — ${gated.length} gated, ` +
        `${Object.keys(DOC_BUDGETS).length - gated.length} awaiting their compaction landing (ADR-019).`,
    );
  }

  // ADR-019 §Records, PROMOTED from ritual to gate after the ritual
  // slipped twice in its first two checkpoints (records written, STATE
  // never regenerated — the 2026-08-29 addendum). A checkpoint record
  // whose last COMMIT is newer than docs/STATE.md's last commit is step
  // 1 without step 2. Committed history only, so a mid-ritual working
  // tree (untracked record, unstaged STATE) never false-reds, and the
  // correct flow — record and regenerated STATE in ONE checkpoint
  // commit — ties and passes.
  /** @param {string} rel @returns {number | null} */
  const lastCommitSec = (rel) => {
    const out = execFileSync("git", ["log", "-1", "--format=%ct", "--", rel], {
      cwd: repoRoot,
      encoding: "utf8",
    }).trim();
    return out === "" ? null : Number(out);
  };
  const checkpointsDir = path.join(repoRoot, "docs/checkpoints");
  if (existsSync(checkpointsDir)) {
    const stateAt = lastCommitSec("docs/STATE.md");
    /** @type {string[]} */
    const staleAgainst = [];
    if (stateAt !== null) {
      for (const rec of readdirSync(checkpointsDir)) {
        if (!rec.endsWith(".md") || rec === "TEMPLATE.md") continue;
        const recAt = lastCommitSec(`docs/checkpoints/${rec}`);
        if (recAt !== null && recAt > stateAt) staleAgainst.push(rec);
      }
    }
    if (staleAgainst.length > 0) {
      console.error(
        `\ndocs-gate: docs/STATE.md is STALE against ${staleAgainst.length} newer checkpoint ` +
          "record(s) — the record was committed and STATE was never regenerated " +
          "(docs-protocol.md rule 4; the integrator's step 2):",
      );
      for (const r of staleAgainst) console.error(`  ${r}`);
      found += staleAgainst.length;
    }
  }

  return found > 0 ? EXIT.FOUND : EXIT.CLEAN;
}

let code;
try {
  code = main(process.argv.slice(2));
} catch (err) {
  console.error("docs-gate: GATE COULD NOT RUN");
  console.error(`  ${err instanceof Error ? err.message : String(err)}`);
  console.error("  This run is not a claim about the tree — it is a claim about this gate.");
  code = EXIT.CANNOT_RUN;
}
process.exit(code);
