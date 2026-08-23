#!/usr/bin/env node
/**
 * THE DOCS GATE (T-084) — the hand-run half.
 *
 *   node tools/e2e/scripts/docs-gate.mjs <changed path>...
 *
 * Feed it the changed paths of the diff the RANGE RULE names — this
 * tool deliberately computes no range of its own, because a second
 * opinion about which two commits "the merge's diff" means is exactly
 * the failure docs/CONVENTIONS.md's range rule exists to prevent. From
 * the integrator, that is
 *
 *   TREE=$(git merge-tree --write-tree <main tip> HEAD)   # read $?
 *   git diff --name-only <main tip> "$TREE" | xargs node tools/e2e/scripts/docs-gate.mjs
 *
 * `node tools/e2e/scripts/docs-gate.mjs --census` prints the derivation
 * and judges no diff — the figures docs/CONVENTIONS.md used to carry as
 * digits, which went stale at their own named ref.
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
 *   2  called wrong: an unknown flag, or NO PATHS AT ALL. The second is
 *      T-084-s6 and it is not pedantry — the documented invocation pipes
 *      a range through `xargs`, BSD xargs runs the utility once even on
 *      empty input, and a range command that failed therefore used to
 *      arrive here as zero paths and be answered "not owed" at exit 0.
 *      Same meaning `index --check` gives 2.
 *   3  the gate COULD NOT RUN, so this run is not a claim about the
 *      tree at all. Every throw out of docs-scan.mjs lands here.
 *
 * `yaml` is imported here rather than in the scanner: the scanner stays
 * zero-dependency so it can move to CI's first step against a bare
 * checkout, and this wrapper is the one place a dependency is allowed.
 * It is the SAME package lib/parser depends on, so a block either
 * parses for both or for neither (T-057: one implementation, not two).
 */
import { parse as parseYaml } from "yaml";
import {
  ROOT_ANCHOR_LEDGER,
  docsGate,
  docsReaders,
  liveTaskCards,
  rootAnchoredFiles,
  siteCensus,
  taskCardIssues,
  taskStatuses,
  unaccountedRootAnchors,
  unlinkedFiles,
} from "./docs-scan.mjs";

const EXIT = Object.freeze({ CLEAN: 0, FOUND: 1, USAGE: 2, CANNOT_RUN: 3 });

const CENSUS_FLAG = "--census";

/** @param {string[]} argv */
function main(argv) {
  const flags = argv.filter((a) => a.startsWith("-"));
  const censusOnly = argv.length === 1 && argv[0] === CENSUS_FLAG;
  if (flags.length > 0 && !censusOnly) {
    console.error(
      `docs-gate: unknown flag ${flags[0]} — usage: node tools/e2e/scripts/docs-gate.mjs <changed path>...\n` +
        "It takes PATHS, never a git range: the range is the RANGE RULE's answer, not this tool's.\n" +
        `The one flag is ${CENSUS_FLAG}, which prints the derivation and judges no diff.`,
    );
    return EXIT.USAGE;
  }

  // T-084-s6. AN EMPTY PATH LIST IS A FAILED RANGE, NOT A CLEAN GATE.
  // The documented invocation is `git diff --name-only … | xargs node
  // …/docs-gate.mjs`, and BSD xargs runs the utility once even when its
  // input is empty — so a range command that failed, or a `merge-tree`
  // whose exit was eaten by a command substitution, used to arrive here
  // as ZERO PATHS and be answered "this gate is not owed" at exit 0.
  // That is silence wearing a clean gate's costume, which is the exact
  // thing this card exists to strip off. Exit 2 is "called wrong".
  if (!censusOnly && argv.length === 0) {
    console.error(
      "docs-gate: NO PATHS GIVEN — usage: node tools/e2e/scripts/docs-gate.mjs <changed path>...\n" +
        "  An empty path list is not a clean gate; it is a range that produced nothing.\n" +
        "  Re-run the RANGE RULE's own command and read ITS exit code before piping it here.\n" +
        `  To see the derivation without judging a diff, run with ${CENSUS_FLAG}.`,
    );
    return EXIT.USAGE;
  }

  const readers = docsReaders();
  const unlinked = unlinkedFiles();
  const census = siteCensus();
  const anchored = rootAnchoredFiles();
  const unaccounted = unaccountedRootAnchors();
  const statuses = taskStatuses();
  const issues = taskCardIssues(liveTaskCards(), { statuses, parseYaml });
  const gate = docsGate(censusOnly ? [] : argv, readers);

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
      `${census.anchoredSites} of them in ${census.anchoredFiles} files root-anchored; ` +
      `${anchored.length} files hold the repository root (` +
      `${anchored.filter((f) => f.kind === "derived").length} derived, ` +
      `${anchored.filter((f) => f.kind === "unlinked").length} unlinked, ` +
      `${anchored.filter((f) => f.kind === "unclassified").length} with no docs site this scan can link)`,
  );
  console.log(
    `docs-gate: ${unaccounted.length} root-anchored file(s) sit in a suite NOT already owed for ` +
      "all of docs/ — each argued in ROOT_ANCHOR_LEDGER (docs-scan.mjs), and the two sets are asserted equal.",
  );

  let found = 0;

  // THE ACCOUNT AND THE TREE MUST AGREE. An unargued root-anchored file
  // in a suite that is not universally owed is the exact shape whose
  // answer could be short — so it is news here as well as in the lane,
  // because the lane is not what an integrator runs at a merge.
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

  if (unlinked.length > 0) {
    // A file that BOTH forms a docs-first path AND computes the repo
    // root, which this scanner could not link. It is either a reader in
    // a shape the calculus does not know or a genuine non-reader, and
    // the scanner cannot tell — so it says so instead of dropping it.
    console.error("\ndocs-gate: the derivation could not link these files — a reader may be MISSING:");
    for (const u of unlinked) console.error(`  ${u.file}  bases: ${u.bases.join(", ")}`);
    found += unlinked.length;
  }

  if (censusOnly) {
    console.log(`\ndocs-gate: ${CENSUS_FLAG} — the derivation above, no diff judged.`);
  } else if (gate.docsPaths.length === 0) {
    console.log(
      `\ndocs-gate: ${argv.length} changed path(s) given, none under docs/ — this gate is not owed.`,
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
