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
 *      or both. Read the message — the two are printed apart.
 *   2  called wrong (an unknown flag). Same meaning `index --check`
 *      gives it.
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
  docsGate,
  docsReaders,
  liveTaskCards,
  taskCardIssues,
  taskStatuses,
  unlinkedFiles,
} from "./docs-scan.mjs";

const EXIT = Object.freeze({ CLEAN: 0, FOUND: 1, USAGE: 2, CANNOT_RUN: 3 });

function main(argv) {
  const flags = argv.filter((a) => a.startsWith("-"));
  if (flags.length > 0) {
    console.error(
      `docs-gate: unknown flag ${flags[0]} — usage: node tools/e2e/scripts/docs-gate.mjs <changed path>...\n` +
        "It takes PATHS, never a git range: the range is the RANGE RULE's answer, not this tool's.",
    );
    return EXIT.USAGE;
  }

  const readers = docsReaders();
  const unlinked = unlinkedFiles();
  const statuses = taskStatuses();
  const issues = taskCardIssues(liveTaskCards(), { statuses, parseYaml });
  const gate = docsGate(argv, readers);

  console.log(
    `docs-gate: ${readers.length} derived docs readers across ` +
      `${new Set(readers.map((r) => r.suite)).size} suites; ` +
      `${issues.length} frontmatter issue(s) in the live tree`,
  );
  for (const r of readers) {
    console.log(`  reader  ${r.file}  [${r.command} from ${r.suite}/]  ${r.prefixes.join(" ")}`);
  }

  let found = 0;

  if (unlinked.length > 0) {
    // A file that BOTH forms a docs-first path AND computes the repo
    // root, which this scanner could not link. It is either a reader in
    // a shape the calculus does not know or a genuine non-reader, and
    // the scanner cannot tell — so it says so instead of dropping it.
    console.error("\ndocs-gate: the derivation could not link these files — a reader may be MISSING:");
    for (const u of unlinked) console.error(`  ${u.file}  bases: ${u.bases.join(", ")}`);
    found += unlinked.length;
  }

  if (gate.docsPaths.length === 0) {
    console.log("\ndocs-gate: no path under docs/ in this diff — this gate is not owed.");
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
