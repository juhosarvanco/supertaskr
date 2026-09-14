/**
 * `supertaskr merge <card>` — THE INTEGRATOR'S RITUAL AS ONE COMMAND
 * (T-244; docs/ARCHITECTURE.md's C-02 line spells the verb).
 *
 * ── WHERE THIS COMES FROM ────────────────────────────────────────────
 * The seat's own scratch script `merge-lane.sh` is the prototype, and
 * this file is that script's steps in their order with the two rules
 * docs/rooms/loop-efficiency.md measured folded in as steps rather than
 * as prose somebody has to remember:
 *
 *   ITEM 18 — a merge bringing sources under app/ or lib/ REINSTALLS AND
 *   REBUILDS in docs/CONVENTIONS.md's fresh-clone ORDER *before any
 *   suite runs*. The integrator ran the battery on a stale bundle at
 *   T-018-s5; the dogfood pins redded at T-264's merge until `npm ci`
 *   had run in all three packages.
 *
 *   ITEM 27 — a merge that MOVES docs/architecture/graph.json runs the
 *   app's dogfood bodies BEFORE the commit and re-derives the pins with
 *   the dated line the house pattern uses. Main was red on the app suite
 *   for forty minutes at T-112-s6's merge.
 *
 * Both are DERIVED FROM THE MERGE'S OWN PATHS on every run, never
 * remembered — which is the whole point of putting them in a program.
 *
 * ── IT STOPS WITH THE MERGE STAGED, LIKE THE PROTOTYPE ───────────────
 * The last step is a STOP. A merge carries card-specific integrator
 * writes — a checkpoint record, a STATE replacement, a card's own
 * reconciliation — and a command that committed for you would be a
 * command that committed those out. So this leaves the index staged and
 * prints what remains.
 *
 * ── THE PINS ARE PRINTED, NEVER WRITTEN ──────────────────────────────
 * T-211: a lane never updates the dogfood pins, and the reconciliation
 * is integration-seat WORK rather than a substitution. So the graph step
 * runs the bodies, prints what moved and prints the dated line ready to
 * be written by the seat — it does not edit a fixture. A program that
 * rewrote the pins to match would be the parametrised-by-its-own-constant
 * defect docs/CONVENTIONS.md names, applied to the one file whose job is
 * to notice the graph moved.
 *
 * ── THE VERIFIER'S MUTANT BLOCKS ARE RE-DRILLED, NEVER REBUILT ───────
 * T-281. Nine merges on 2026-09-09 each carried two to five assigned
 * corrections, and in every one of them the integrator RECOVERED the
 * body that pinned the correction — out of the verifier's transcript
 * file, out of the verdict's prose, or by writing it again — and then
 * built a mutant by hand to drill it. That was the largest single
 * consumer of the integration seat's context after the merges
 * themselves, and a transcript recovery is fragile by construction.
 *
 * The verifier now COMMITS the body on its bench and writes a MUTANT
 * BLOCK into the verdict, in one fixed layout, naming the file, the
 * exact old text, the exact new text, the body and the failure message.
 * This file READS those blocks off the card's newest verdict and
 * re-drills each one on the MERGED tree: plant, run the owning spec,
 * require the named body RED ALONE with that message, restore the site
 * and prove the restore by sha256. Anything else STOPS the run with the
 * merge still staged — a survivor, a body that reds more than itself,
 * an anchor that does not match exactly once, or a block that names a
 * LINE NUMBER instead of text.
 *
 * The line-number refusal is docs/CONVENTIONS.md's own rule that a
 * citation names a symbol rather than a line, applied to the one place
 * where getting it wrong is silent: a line number is a coordinate in a
 * mutable object, and by the time a merge re-drills it the tree has
 * moved. Text either matches once or it does not.
 */

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildCommandFor, conventionCommandsFor } from "./cli.mjs";
// THE PROCESS AS SETTINGS (T-299, ADR-024 decision 6). The schema and
// its resolution live beside the dispatch arm because the dispatch arm
// is where the runtime template is already read; the merge reads the
// SAME resolution rather than a second copy of it, which is the whole
// point of declaring a switch once.
import { PROCESS_SCHEMA, loadProcess, switchValue } from "./dispatch-brief.mjs";

/** @typedef {import("./dispatch-brief.mjs").ProcessSettings} ProcessSettings */
import { deriveOwning } from "./gate-run.mjs";
import { carriesLegacy, classifyLegacy } from "./rename-scan.mjs";
import { cardFile, git, repoRoot } from "./undo.mjs";

export const EXIT = Object.freeze({ CLEAN: 0, FOUND: 1, USAGE: 2, CANNOT_RUN: 3 });

/** The integration branch when none is named. */
export const DEFAULT_BRANCH = "main";

/**
 * THIS repository's own docs/CONVENTIONS.md — the file `setupSteps`
 * reads when no project root is named, and the site that makes this file
 * a DERIVED READER of docs/ to the docs gate.
 */
export const CONVENTIONS_PATH = path.join(repoRoot, "docs", "CONVENTIONS.md");

/**
 * @typedef {object} Step
 * @property {string} id
 * @property {"precondition" | "git" | "setup" | "regen" | "suite" | "gate" | "stop"} kind
 * @property {string} title
 * @property {string} why
 * @property {{ command: string, argv: string[], cwd: string, env?: Record<string, string>, assert?: "empty-output", tolerate?: boolean, quiet?: boolean } | null} run
 * @property {"graph-pins" | "stamp-done" | "mutant-drill" | "apply-correction" | "widen-fence" | "resolve-conflicts" | "keeper" | "method-bump" | "half-bump-drill" | "counts" | "message" | "meters" | "docs-gate"} [action] work the runner does AFTER the command
 * @property {"pinned-sentence" | "forbidden-spelling" | "xs-bound"} [keeper] which cheap keeper this step is
 * @property {{ from: string, to: string }} [bump] the method stamp move this step performs
 * @property {MutantBlock} [block] the correction this step re-drills
 * @property {string} [problem] why this step cannot be performed at all
 * @property {string} [warning] news the step prints and does not stop for
 * @property {readonly string[]} [wording] the corrections this step drills nothing for because the verdict says they carry no block
 */

/**
 * ONE CORRECTION'S MUTANT, as the verdict spells it.
 *
 * @typedef {object} MutantBlock
 * @property {string} correction what the verdict calls it
 * @property {string} file the file the mutant is planted in, from the project root
 * @property {string} spec the spec file the pinning body lives in, from the project root
 * @property {string} body the body's name, exactly as its `test(...)` spells it
 * @property {string} message a substring the failing run must print
 * @property {string} old the exact text to replace — it matches `file` exactly once
 * @property {string} new the exact text to put there — it matches the mutated file exactly once
 */

/** The sources whose arrival obliges a reinstall and rebuild (room item 18). */
export const REBUILD_ROOTS = Object.freeze(["app/", "lib/"]);

/** The one file whose movement obliges the dogfood bodies (room item 27). */
export const GRAPH_PATH = "docs/architecture/graph.json";

/** The suffixes the GRAPH REGEN trigger names, outside docs/. */
export const WALK_SUFFIXES = Object.freeze([".ts", ".tsx", ".js", ".jsx", ".rs"]);

/** @param {readonly string[]} paths @returns {boolean} */
export function bringsBuiltSources(paths) {
  return paths.some(
    (p) => REBUILD_ROOTS.some((r) => p.startsWith(r)) && WALK_SUFFIXES.some((s) => p.endsWith(s)),
  );
}

/** @param {readonly string[]} paths @returns {boolean} */
export function movesGraph(paths) {
  return paths.includes(GRAPH_PATH);
}

/** @param {readonly string[]} paths @returns {boolean} */
export function movesIndexedSource(paths) {
  return paths.some(
    (p) =>
      !p.startsWith("docs/") &&
      !p.startsWith("tools/") &&
      !p.startsWith(".claude/") &&
      WALK_SUFFIXES.some((s) => p.endsWith(s)),
  );
}

/** @param {readonly string[]} paths @returns {boolean} */
export function movesSpecNames(paths) {
  return paths.some((p) => /^tools\/e2e\/tests\/.*\.spec\.ts$/.test(p));
}

// ── THE MUTANT BLOCK ─────────────────────────────────────────────────

/** The info string a mutant block's fence opens with. */
export const MUTANT_FENCE = "mutant";

/**
 * THE FIXED LAYOUT'S FIVE KEYS, IN THIS ORDER.
 *
 * ORDER IS PART OF THE LAYOUT and not decoration. A reader that accepts
 * the keys in any order accepts five layouts, and the verdict's own
 * blocks then stop being comparable to each other by eye — which is the
 * only review a block gets before a merge trusts it.
 */
export const MUTANT_KEYS = Object.freeze(["correction", "file", "spec", "body", "message"]);

/** The marker that opens the exact text to replace. */
export const MUTANT_OLD = "--- old";

/** The marker that opens the exact text to put there. */
export const MUTANT_NEW = "--- new";

/** The keys that name a coordinate rather than text, refused by name. */
const LINE_KEYS = new Set(["line", "lines", "lineno", "line-number", "line_number"]);

/** A `path.ext:123` or `path.ext:123:4` tail — a citation by line. */
const PATH_WITH_LINE = /:\d+(?::\d+)?$/;

/** `line 40`, `lines 40-52` written into a value. */
const PROSE_LINE = /\blines?\s+\d+\b/i;

/**
 * A CORRECTION BLOCK'S OWN HEADING — ONE SOURCE, THREE READERS.
 *
 * `assignsCorrections` asks whether a verdict heads any, `correctionHeadings`
 * counts them, and `isVerdictHeading` below refuses to read one as a verdict
 * entry. The pattern was spelled three times; a second spelling of one rule
 * is the T-057 failure this project names by number, and here the three
 * would have had to move together the day a block heading changed shape.
 */
const CORRECTION_HEADING_SOURCE = String.raw`^#+\s*CORRECTION\b`;

/** One line judged against that source. */
const CORRECTION_HEADING = new RegExp(CORRECTION_HEADING_SOURCE, "i");

/**
 * The same source asked of a whole verdict — DOES it head one — and it is
 * deliberately not the global form below: `RegExp.test` on a global regex
 * carries `lastIndex` from call to call and answers true, false, true over
 * one unchanging input.
 */
const CORRECTION_IN_TEXT = new RegExp(CORRECTION_HEADING_SOURCE, "im");

/** The same source, global, for the COUNT — used through `String.match`. */
const CORRECTION_HEADINGS = new RegExp(CORRECTION_HEADING_SOURCE, "gim");

/**
 * A VERDICT ENTRY'S OWN HEADING, which is what separates one pass from
 * the next. Verdicts are APPENDED (method/tasks/TASK-FORMAT.md, "one
 * dated entry per pass"), so the NEWEST is the LAST such heading — and
 * the sub-headings a verdict carries inside itself are `###` too, which
 * is why this is anchored on the date rather than on the level alone.
 *
 * **AND THE DATE MAY SIT ANYWHERE IN THE LINE** (T-311-s5, absorbing
 * T-311-s7). It used to have to come first, after at most one capitalised
 * word. `roles/verifier.md` asked for a verdict that is dated and names
 * the model and session, and said nothing about where the date goes — so
 * a verifier that wrote `### APPROVED WITH ASSIGNED CORRECTIONS —
 * <model@session>, verifier phase 2, 2026-09-12` obeyed the rule and was
 * invisible to this reader, which then refused the drill with "carries no
 * dated `### ` entry" while the entry stood one screen above the message.
 * A reader narrower than the rule it enforces is the defect; the rule is
 * a DATED entry, and this is now that rule. The role file names one shape
 * beside it, so the two halves are a spelling and a reader rather than a
 * guess and a regex.
 *
 * **WHAT THE DATE ANCHOR WAS PROTECTING IS KEPT BY THE EXCLUSION BESIDE
 * IT.** A correction block's heading is `###` too and may carry a date of
 * its own; taken as the newest entry it would slice the verdict in half
 * and drop exactly the blocks the drill is about. So a heading this file
 * already counts as a CORRECTION is never a verdict entry.
 *
 * MEASURED OVER `docs/tasks/` AT `71b52a01125d`: 310 cards carry a
 * `## Verdicts` section; on 19 of them this reader finds an entry the
 * anchored one missed entirely, and on one (T-238-s1) it moves from the
 * verdict to a later dated entry appended under the same heading, which
 * is what "the newest entry" means. No live card's answer turns on the
 * correction exclusion at that ref — it is kept by a body over a planted
 * card, because the shape it guards against is one nobody has written
 * yet and the cost of meeting it for the first time inside a merge is
 * a verdict read from its middle.
 */
const VERDICT_HEADING = /^###\s+.*\d{4}-\d{2}-\d{2}/;

/**
 * Is this line a verdict ENTRY's heading — dated, at depth three, and not
 * a correction block's own heading?
 *
 * @param {string} line
 * @returns {boolean}
 */
export function isVerdictHeading(line) {
  return VERDICT_HEADING.test(line) && !CORRECTION_HEADING.test(line);
}

/**
 * THE NEWEST VERDICT ON A CARD — the one a merge is entitled to act on.
 *
 * @param {string} cardText
 * @returns {{ text: string, heading: string } | { problem: string }}
 */
export function newestVerdict(cardText) {
  const lines = cardText.split("\n");
  const section = lines.findIndex((l) => /^##\s+Verdicts\s*$/.test(l));
  if (section === -1) return { problem: "the card carries no `## Verdicts` section" };
  let start = -1;
  for (let i = section + 1; i < lines.length; i += 1) {
    if (isVerdictHeading(lines[i] ?? "")) start = i;
  }
  if (start === -1) {
    return {
      problem:
        "the card's `## Verdicts` section carries no dated `### ` entry, so there is no newest " +
        "verdict to read blocks off",
    };
  }
  return { text: lines.slice(start).join("\n"), heading: (lines[start] ?? "").trim() };
}

/**
 * WHETHER A VERDICT ASSIGNS CORRECTIONS AT ALL.
 *
 * A verdict that assigns none owes no block, and saying so is different
 * from finding none. This is what lets the drill step tell an APPROVED
 * verdict from one whose blocks were forgotten.
 *
 * @param {string} verdictText
 * @returns {boolean}
 */
export function assignsCorrections(verdictText) {
  return (
    /\bASSIGNED\s+CORRECTIONS?\b/i.test(verdictText) || CORRECTION_IN_TEXT.test(verdictText)
  );
}

/** @param {string} verdictText @returns {number} how many corrections the verdict heads */
export function correctionHeadings(verdictText) {
  return (verdictText.match(CORRECTION_HEADINGS) ?? []).length;
}

/** @param {string} haystack @param {string} needle @returns {number} */
export function occurrences(haystack, needle) {
  if (needle.length === 0) return 0;
  let n = 0;
  for (
    let at = haystack.indexOf(needle);
    at !== -1;
    // STRIDE BY ONE, never by the needle's length (T-295-s9): a needle
    // whose prefix is also its suffix matches at OVERLAPPING positions,
    // and a stride of `needle.length` walks past the second one and
    // reports ONE site where the text names two. Every caller of this
    // function asks "exactly once", so a count that is low by one is a
    // write at a site nobody named.
    at = haystack.indexOf(needle, at + 1)
  ) {
    n += 1;
  }
  return n;
}

/**
 * ONE BLOCK'S BODY, between its fences.
 *
 * @param {readonly string[]} body
 * @returns {{ block: MutantBlock } | { problem: string }}
 */
function readOneBlock(body) {
  /** @type {Record<string, string>} */
  const fields = {};
  let i = 0;
  for (const key of MUTANT_KEYS) {
    const line = body[i];
    if (line === undefined) {
      return { problem: `a mutant block ends before its \`${key}:\` line` };
    }
    const m = /^([A-Za-z][A-Za-z_-]*):[ \t]*(.*)$/.exec(line);
    if (m === null) {
      return {
        problem:
          `a mutant block's line ${JSON.stringify(line)} is not a \`<key>: <value>\` line — the ` +
          `fixed layout is ${MUTANT_KEYS.join(", ")}, then ${MUTANT_OLD}, then ${MUTANT_NEW}`,
      };
    }
    const found = /** @type {string} */ (m[1]);
    if (LINE_KEYS.has(found.toLowerCase())) {
      return {
        problem:
          `a mutant block names a LINE NUMBER (\`${found}:\`) — an anchor is TEXT. A line number ` +
          "is a coordinate in a mutable object, and the tree has moved by the time a merge " +
          "re-drills it",
      };
    }
    if (found !== key) {
      return {
        problem:
          `a mutant block spells \`${found}:\` where the fixed layout has \`${key}:\` — the order ` +
          `is ${MUTANT_KEYS.join(", ")}`,
      };
    }
    fields[key] = (m[2] ?? "").trim();
    i += 1;
  }
  for (const key of MUTANT_KEYS) {
    if ((fields[key] ?? "").length === 0) {
      return { problem: `a mutant block's \`${key}:\` is empty` };
    }
  }
  for (const key of ["file", "spec"]) {
    const value = /** @type {string} */ (fields[key]);
    if (PATH_WITH_LINE.test(value)) {
      return {
        problem:
          `a mutant block names a LINE NUMBER — \`${key}: ${value}\`. An anchor is TEXT; a line ` +
          "number is a coordinate in a mutable object, and the tree has moved by the time a merge " +
          "re-drills it (docs/CONVENTIONS.md: a citation names a symbol, not a line)",
      };
    }
  }
  for (const key of ["file", "spec"]) {
    const value = /** @type {string} */ (fields[key]);
    if (path.isAbsolute(value) || path.posix.normalize(value).startsWith("..")) {
      return {
        problem:
          `a mutant block's \`${key}: ${value}\` resolves outside the project root. A block is ` +
          "text off a card, and the drill WRITES the file it names — a path that leaves the " +
          "repository is a write on the integrator's machine",
      };
    }
  }
  for (const key of MUTANT_KEYS) {
    const value = /** @type {string} */ (fields[key]);
    if (PROSE_LINE.test(value)) {
      return {
        problem:
          `a mutant block names a LINE NUMBER — \`${key}: ${value}\`. An anchor is TEXT, never a ` +
          "coordinate in a mutable object",
      };
    }
  }
  if (body[i] !== MUTANT_OLD) {
    return {
      problem: `a mutant block has no \`${MUTANT_OLD}\` marker where the layout requires one`,
    };
  }
  const newAt = body.indexOf(MUTANT_NEW, i + 1);
  if (newAt === -1) return { problem: `a mutant block has no \`${MUTANT_NEW}\` marker` };
  if (body.indexOf(MUTANT_OLD, i + 1) !== -1) {
    return {
      problem: `a mutant block carries two \`${MUTANT_OLD}\` markers, so its anchor is ambiguous`,
    };
  }
  if (body.indexOf(MUTANT_NEW, newAt + 1) !== -1) {
    return {
      problem: `a mutant block carries two \`${MUTANT_NEW}\` markers, so its anchor is ambiguous`,
    };
  }
  const oldText = body.slice(i + 1, newAt).join("\n");
  const newText = body.slice(newAt + 1).join("\n");
  if (oldText.length === 0) {
    return { problem: "a mutant block's `old` text is empty — it anchors nothing" };
  }
  if (oldText === newText) {
    return { problem: "a mutant block's `old` and `new` text are identical, so it plants no mutant" };
  }
  return {
    block: {
      correction: /** @type {string} */ (fields["correction"]),
      file: /** @type {string} */ (fields["file"]),
      spec: /** @type {string} */ (fields["spec"]),
      body: /** @type {string} */ (fields["body"]),
      message: /** @type {string} */ (fields["message"]),
      old: oldText,
      new: newText,
    },
  };
}

/**
 * EVERY MUTANT BLOCK IN A STRETCH OF MARKDOWN.
 *
 * ONE BAD BLOCK REFUSES THE WHOLE READ, deliberately. The alternative —
 * drill the blocks that parsed and mention the rest — is the shape that
 * lets a merge report a clean drill over a correction nobody checked.
 *
 * @param {string} text
 * @returns {{ blocks: MutantBlock[] } | { problem: string }}
 */
export function readMutantBlocks(text) {
  const lines = text.split("\n");
  /** @type {MutantBlock[]} */
  const blocks = [];
  /** @type {string[]} */
  const problems = [];
  /**
   * The code fence this scan is currently INSIDE, or null. A fence of
   * any other kind is what makes a `mutant` line beneath it an EXAMPLE
   * rather than a block, and tracking it is what lets the margin below
   * be forgiven without forgiving a quotation.
   *
   * @type {{ ticks: string } | null}
   */
  let outer = null;
  for (let i = 0; i < lines.length; i += 1) {
    const fence = FENCE_LINE.exec(lines[i] ?? "");
    if (fence === null) continue;
    const indent = /** @type {string} */ (fence[1]);
    const ticks = /** @type {string} */ (fence[2]);
    const info = /** @type {string} */ (fence[3] ?? "");
    if (outer !== null) {
      // A CLOSING FENCE IS BARE AND AT LEAST AS LONG as the one that
      // opened — CommonMark's own rule, and the reason a verdict may
      // quote this very layout inside a ````` fence without being read.
      if (info.length === 0 && ticks.length >= outer.ticks.length) outer = null;
      continue;
    }
    if (info !== MUTANT_FENCE) {
      outer = { ticks };
      continue;
    }
    let end = -1;
    for (let j = i + 1; j < lines.length; j += 1) {
      const close = FENCE_LINE.exec(lines[j] ?? "");
      if (close === null) continue;
      if (/** @type {string} */ (close[3] ?? "").length > 0) continue;
      if (/** @type {string} */ (close[2]).length < ticks.length) continue;
      end = j;
      break;
    }
    if (end === -1) {
      problems.push(`a \`\`\`${MUTANT_FENCE} block is never closed`);
      break;
    }
    // THE MARGIN IS THE FENCE'S OWN AND IT IS TAKEN OFF (T-295). The
    // measured fault, at the T-293 merge: a verifier wrote its block
    // indented four spaces inside its verdict entry, the reader took a
    // fence at column zero only, and the merged tree's own re-drill
    // reported `blocks read: 0` over a verdict that assigned a
    // correction. The refusal downstream was loud, and the seat still
    // drilled that correction by hand at the exact line. A block's
    // `old` and `new` text are EXACT, so the indent has to come off the
    // body as well as be tolerated on the fence — otherwise every
    // anchor in an indented block carries four spaces the tree does not.
    const one = readOneBlock(dedentBlock(lines.slice(i + 1, end), indent));
    if ("problem" in one) problems.push(one.problem);
    else blocks.push(one.block);
    i = end;
  }
  if (problems.length > 0) return { problem: problems.join("; ") };
  return { blocks };
}

/**
 * A FENCE LINE, AT WHATEVER MARGIN IT WAS WRITTEN AT: its indent, its
 * run of backticks, and its info string.
 */
const FENCE_LINE = /^([ \t]*)(`{3,})[ \t]*(\S*)[ \t]*$/;

/**
 * A BLOCK'S BODY WITH THE FENCE'S OWN MARGIN TAKEN OFF.
 *
 * A line that does not carry the whole margin loses whatever leading
 * whitespace it has instead of keeping a partial one — a body line
 * indented LESS than its fence is malformed markdown either way, and
 * leaving it half-indented would put the difference into a `old` anchor
 * where it would silently match nothing.
 *
 * @param {readonly string[]} lines
 * @param {string} indent
 * @returns {string[]}
 */
export function dedentBlock(lines, indent) {
  if (indent.length === 0) return [...lines];
  return lines.map((l) => (l.startsWith(indent) ? l.slice(indent.length) : l.replace(/^[ \t]+/, "")));
}

/**
 * PLANT ONE MUTANT — and REFUSE unless each anchor names exactly one site.
 *
 * @param {{ source: string, block: MutantBlock }} input
 * @returns {{ text: string } | { problem: string }}
 */
export function plantMutant(input) {
  const { source, block } = input;
  const hits = occurrences(source, block.old);
  if (hits !== 1) {
    return {
      problem:
        `${block.correction}: the \`old\` anchor matches ${block.file} ${String(hits)} time(s). An ` +
        "anchor that does not match EXACTLY once names no site — the merge stops here rather than " +
        "guessing which one was meant",
    };
  }
  // A FUNCTION REPLACEMENT, never a string one: `$&`, `$1` and `$'` are
  // substitution syntax in a string replacement, so a `new` text carrying
  // one would be planted as something else entirely.
  const text = source.replace(block.old, () => block.new);
  const back = occurrences(text, block.new);
  if (back !== 1) {
    return {
      problem:
        `${block.correction}: after the swap the \`new\` anchor matches ${block.file} ` +
        `${String(back)} time(s), so the mutant's own site cannot be named either`,
    };
  }
  return { text };
}

/**
 * THE BODIES A RUN REPORTS AS FAILING, in either dialect this repository
 * runs — Playwright's numbered `file:L:C` line and Vitest's `FAIL`.
 *
 * READ OFF THE RUN, NEVER OFF A COUNT: "the named body RED ALONE" is a
 * claim about WHICH bodies redded, and a summary line saying `1 failed`
 * cannot answer it.
 *
 * @param {string} output
 * @returns {string[]} distinct names, in the order they were reported
 */
export function failingBodies(output) {
  /** @type {string[]} */
  const names = [];
  for (const raw of output.split("\n")) {
    // THE ESCAPE IS SPELLED, NEVER TYPED: a literal U+001B in tracked
    // text is a CONTROL violation the token lint reds by byte offset,
    // and it is invisible to every binary-skipping searcher.
    const line = raw.replace(/\u001b\[[0-9;]*m/g, "");
    const playwright = /^\s*\d+\)\s.*?:\d+:\d+\s*›\s*(.+?)\s*$/.exec(line);
    const vitest = /^\s*(?:FAIL|✕|×)\s+\S+\s+>\s+(.+?)\s*$/.exec(line);
    const hit = playwright ?? vitest;
    if (hit === null) continue;
    const name = /** @type {string} */ (hit[1]).replace(/[\s─-]+$/, "").trim();
    if (name.length > 0 && !names.includes(name)) names.push(name);
  }
  return names;
}

/**
 * GRADE ONE DRILL. The three refusals the card names are here, plus the
 * two a real run produces that neither of them covers.
 *
 * @param {{ block: MutantBlock, failing: readonly string[], code: number, output: string }} input
 * @returns {{ ok: true } | { problem: string }}
 */
export function gradeDrill(input) {
  const { block, failing, code, output } = input;
  if (failing.length === 0) {
    return code === 0
      ? {
          problem:
            `${block.correction}: THE MUTANT SURVIVED — ${block.spec} is GREEN with the mutant ` +
            `planted in ${block.file}, so ${JSON.stringify(block.body)} does not pin this correction`,
        }
      : {
          problem:
            `${block.correction}: ${block.spec} exited ${String(code)} naming no body at all — a ` +
            "run that broke is not a drill result, and the merge stops rather than reading it as one",
        };
  }
  if (!failing.includes(block.body)) {
    return {
      problem:
        `${block.correction}: the named body ${JSON.stringify(block.body)} did NOT red. What ` +
        `redded was ${failing.map((n) => JSON.stringify(n)).join(", ")}`,
    };
  }
  const others = failing.filter((n) => n !== block.body);
  if (others.length > 0) {
    return {
      problem:
        `${block.correction}: the mutant REDS MORE THAN ITSELF — ${JSON.stringify(block.body)} and ` +
        `${others.map((n) => JSON.stringify(n)).join(", ")}. A mutant that kills a set is not ` +
        "evidence about this one property",
    };
  }
  if (!output.includes(block.message)) {
    return {
      problem:
        `${block.correction}: ${JSON.stringify(block.body)} redded, but WITHOUT the message the ` +
        `block names — ${JSON.stringify(block.message)} is nowhere in the run's output`,
    };
  }
  return { ok: true };
}

/**
 * WHICH RUNNER OWNS A SPEC FILE, derived from the package it sits in —
 * this repository's three test packages and nothing invented beside
 * them. A spec outside all three is SAID to be, never guessed at.
 *
 * @param {string} spec from the project root
 * @param {string} projectRoot
 * @returns {{ command: string, argv: string[], cwd: string } | { problem: string }}
 */
export function specRunner(spec, projectRoot) {
  const many = specRunners([spec], projectRoot);
  if ("problem" in many) return many;
  const one = many.runners[0];
  if (one === undefined) return { problem: `no runner was derived for ${spec}` };
  return one;
}

/** This project's three test packages, and the argv each takes for a SET. */
const SPEC_PACKAGES = Object.freeze([
  { dir: "tools/e2e", argv: (/** @type {string[]} */ r) => ["playwright", "test", ...r, "--reporter=line"] },
  { dir: "lib/parser", argv: (/** @type {string[]} */ r) => ["vitest", "run", ...r] },
  { dir: "app", argv: (/** @type {string[]} */ r) => ["vitest", "run", ...r] },
]);

/**
 * THE RUNNERS FOR A SET OF SPECS, one per package they fall in (T-295).
 *
 * A scope derived from a fix diff can name specs in two packages at
 * once — a correction to a script under tools/ is owned by an e2e spec,
 * and the same correction to a source under app/ by a vitest one — and
 * two packages are two runs. Grouping them here rather than at the call
 * site keeps the drill's "RED ALONE" reading a reading over the whole
 * scope instead of over whichever package happened to be first.
 *
 * @param {readonly string[]} specs from the project root
 * @param {string} projectRoot
 * @returns {{ runners: { command: string, argv: string[], cwd: string, specs: string[] }[] } | { problem: string }}
 */
export function specRunners(specs, projectRoot) {
  /** @type {Map<string, string[]>} */
  const byPackage = new Map();
  for (const spec of specs) {
    const pkg = SPEC_PACKAGES.find((p) => spec.startsWith(`${p.dir}/`));
    if (pkg === undefined) {
      return {
        problem:
          `no runner in this project owns ${spec} — the packages that run specs are ` +
          `${SPEC_PACKAGES.map((p) => p.dir).join(", ")}, and a spec outside all three cannot be ` +
          "drilled here",
      };
    }
    const list = byPackage.get(pkg.dir) ?? [];
    if (!list.includes(spec)) list.push(spec);
    byPackage.set(pkg.dir, list);
  }
  /** @type {{ command: string, argv: string[], cwd: string, specs: string[] }[]} */
  const runners = [];
  for (const [dir, list] of byPackage) {
    const pkg = /** @type {{ dir: string, argv: (r: string[]) => string[] }} */ (
      SPEC_PACKAGES.find((p) => p.dir === dir)
    );
    runners.push({
      command: "npx",
      argv: pkg.argv(list.map((s) => s.slice(dir.length + 1))),
      cwd: path.join(projectRoot, ...dir.split("/")),
      specs: [...list],
    });
  }
  return { runners };
}

/** @param {string} text @returns {string} */
function sha256(text) {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

/**
 * @param {{ command: string, argv: string[], cwd: string }} runner
 * @returns {{ code: number, output: string }}
 */
function spawnSpec(runner) {
  const r = spawnSync(runner.command, runner.argv, {
    cwd: runner.cwd,
    encoding: "utf8",
    stdio: "pipe",
  });
  if (r.error !== undefined && r.error !== null) {
    return { code: 3, output: `${runner.command} could not be started — ${r.error.message}` };
  }
  return { code: r.status ?? 3, output: `${String(r.stdout ?? "")}${String(r.stderr ?? "")}` };
}

/**
 * RE-DRILL ONE CORRECTION on the tree as it stands.
 *
 * PLANT, RUN, RESTORE, PROVE, GRADE — and the restore happens BEFORE the
 * grade so a grade that throws still leaves the site as it was.
 *
 * SCOPED, SINCE T-295. `scope` is the set of spec files the drill's
 * reading is taken over, and it defaults to the block's own spec —
 * exactly the old behaviour, said out loud. The caller derives a wider
 * one from the FIX DIFF (`drillScope`), because "the mutant reds more
 * than its own body" is a claim about every body the corrected source
 * can reach and not only about the spec the block happens to name.
 *
 * @param {{ block: MutantBlock, projectRoot: string, scope?: readonly string[], out?: (s: string) => void, err?: (s: string) => void, observe?: (e: { specs: string[], cwd: string, code: number, counts: { passed: number, failed: number } | null }) => void, run?: (r: { command: string, argv: string[], cwd: string }) => { code: number, output: string } }} input
 * @returns {number} 0 the drill holds - 1 it does not - 3 it could not run
 */
export function runMutantDrill(input) {
  const { block, projectRoot } = input;
  const out = input.out ?? (() => {});
  const err = input.err ?? (() => {});
  const file = path.join(projectRoot, block.file);
  if (!existsSync(file)) {
    err(`      ${block.correction}: ${block.file} is not in this tree, so no mutant can be planted`);
    return EXIT.CANNOT_RUN;
  }
  const scope = input.scope === undefined || input.scope.length === 0 ? [block.spec] : input.scope;
  const runner = specRunners(scope, projectRoot);
  if ("problem" in runner) {
    err(`      ${block.correction}: ${runner.problem}`);
    return EXIT.CANNOT_RUN;
  }
  out(
    `      scope: ${String(scope.length)} spec(s) — ${scope.join(", ")}` +
      (scope.length === 1
        ? ". RED ALONE is a claim over THIS spec; --drill-wide takes it over every spec the fix " +
          "diff owns, and prices it"
        : ". RED ALONE is a claim over every spec the FIX DIFF owns"),
  );
  // THE BODY HAS TO BE ON THE MERGED TREE BEFORE ANYTHING IS PLANTED.
  // The verifier commits its bodies on the bench AFTER the verdict commit
  // (`method/roles/verifier.md` step 5b), so what gets merged is the
  // bench TIP and not the verdict sha the figures were measured at. Pass
  // the verdict commit and the bodies never land — and the drill would
  // then report "the named body did not red" after a whole spec run,
  // which reads like a defect in the correction rather than a merge that
  // left the body behind. This says which it is, in one read.
  const specFile = path.join(projectRoot, block.spec);
  if (!existsSync(specFile)) {
    err(`      ${block.correction}: ${block.spec} is not in this tree, so its body cannot be run`);
    return EXIT.CANNOT_RUN;
  }
  if (!readFileSync(specFile, "utf8").includes(block.body)) {
    err(
      `      ${block.correction}: ${JSON.stringify(block.body)} is NOT in ${block.spec} on the ` +
        "merged tree. The verifier commits its bodies AFTER the verdict commit, so what is merged " +
        "is the BENCH TIP — a merge given the verdict sha leaves them behind",
    );
    return EXIT.FOUND;
  }
  const pristine = readFileSync(file, "utf8");
  const before = sha256(pristine);
  const planted = plantMutant({ source: pristine, block });
  if ("problem" in planted) {
    err(`      ${planted.problem}`);
    return EXIT.FOUND;
  }
  writeFileSync(file, planted.text);
  /** @type {{ code: number, output: string }} */
  let result = { code: 0, output: "" };
  try {
    // ONE RUN PER PACKAGE, and the readings are UNIONED. A scope that
    // spans two packages is two runners, and a drill that graded only
    // the first would report RED ALONE over half its own scope.
    const runOne = input.run ?? spawnSpec;
    for (const one of runner.runners) {
      const got = runOne(one);
      if (input.observe !== undefined) {
        input.observe({ specs: one.specs, cwd: one.cwd, code: got.code, counts: runCounts(got.output) });
      }
      result = {
        code: result.code === 0 ? got.code : result.code,
        output: `${result.output}${got.output}`,
      };
    }
  } finally {
    writeFileSync(file, pristine);
  }
  const after = sha256(readFileSync(file, "utf8"));
  if (after !== before) {
    err(
      `      ${block.correction}: THE SITE WAS NOT RESTORED — ${block.file} is ${after} and was ` +
        `${before}. Restore it by hand before anything else`,
    );
    return EXIT.FOUND;
  }
  out(`      restored and PROVED by sha256: ${block.file} ${before}`);
  const failing = failingBodies(result.output);
  const graded = gradeDrill({ block, failing, code: result.code, output: result.output });
  if ("problem" in graded) {
    err(`      ${graded.problem}`);
    err(result.output);
    return EXIT.FOUND;
  }
  out(
    `      ${block.correction}: ${JSON.stringify(block.body)} RED ALONE in ${block.spec}, with ` +
      "the message the block names",
  );
  return EXIT.CLEAN;
}

/**
 * THE SHORTEST PREFIX OF A SHA THIS ACKNOWLEDGEMENT WILL TAKE.
 *
 * The same length `undo.mjs` prints its `--force <sha>` refusals at, for
 * the same reason: an acknowledgement is a thing somebody TYPED after
 * reading, and a prefix short enough to guess is a blanket override
 * wearing a sha.
 */
export const ACKNOWLEDGE_PREFIX = 7;

/**
 * ONE CORRECTION A VERDICT ANNOUNCES, as a unit the drill step can ask
 * its two questions of: is there a block for this one, and did the
 * verdict say this one needs none.
 *
 * `spans` is a LIST because a verdict comes back to a correction it has
 * already announced — "CORRECTION 2's `--- old` is the CORRECTED text"
 * is a second paragraph about correction 2, not a third correction — and
 * folding the repeats into one entry is what keeps the count honest.
 *
 * @typedef {object} CorrectionEntry
 * @property {string} name the announcement's own words, emphasis off
 * @property {string} key that name folded, so a block's `correction:` field can be matched to it
 * @property {[number, number][]} spans the line ranges of this correction's stretches of the verdict
 */

/**
 * A CORRECTION'S ANNOUNCEMENT LINE, IN THE TWO SHAPES THIS BOARD HAS
 * ACTUALLY WRITTEN: a heading (`#### CORRECTION 3 — ...`) and a bold
 * lead (`**Correction 3 — ...**`), either of them possibly a list item.
 *
 * THE MARKER IS REQUIRED, and that is the conservative half. A bare
 * prose line beginning "Correction 3 was applied" is a sentence ABOUT a
 * correction, and reading it as an announcement would invent a
 * correction the verdict never assigned — which this step would then
 * refuse for having no block. Missing an announcement costs a step that
 * cannot say which corrections it read; inventing one costs a false stop,
 * and a false stop is what this card is.
 *
 * `CORRECTION\b` and not `CORRECTION` alone: the plural heads a SECTION
 * ("#### Corrections assigned"), never a single correction.
 */
const CORRECTION_ANNOUNCEMENT =
  /^[ \t]*(?:[-*+][ \t]+)?(?:#{1,6}[ \t]*(?:\*\*|__)?|\*\*|__)[ \t]*(CORRECTION\b[^\n]*)$/i;

/**
 * WHAT A VERDICT SAYS WHEN IT SAYS A CORRECTION CARRIES NO BLOCK.
 *
 * `roles/verifier.md` step 5b asks for the statement and does not spell
 * it, so this is a reader of the spellings the board has written rather
 * than of one sanctioned form: "it carries no mutant block", "owes no
 * block", "No block: there is no property to pin", "each pins no
 * property and owes no block", "NO MUTANT BLOCK IS EMITTED".
 *
 * THE ONE SHAPE DELIBERATELY OUTSIDE IT is "no block names a line
 * number" — a claim ABOUT the blocks a verdict does carry, written at
 * three merges on this board. The second pattern therefore requires the
 * phrase to END its clause, which is what separates "No block." from
 * "No block names ...".
 */
const NO_BLOCK_SAID = [
  /\b(?:carries|carry|carrying|owes|owe|owing|owed|has|have|with|needs|wants|is|are)\s+no\s+(?:mutant\s+)?block\b/i,
  /(?:^|[.;:,—–-]\s*)no\s+(?:mutant\s+)?block\s*(?:[.;:,]|$)/i,
  /\bno\s+(?:mutant\s+)?block\s+(?:is|was|will\s+be)\s+(?:written|owed|needed|emitted|assigned)\b/i,
  /\bno\s+property\s+to\s+pin\b/i,
  /\bpins?\s+no\s+property\b/i,
];

/**
 * Emphasis, code ticks and the line wrapping off — the prose a reader sees.
 *
 * @param {string} text
 * @returns {string}
 */
function plainProse(text) {
  return text.replace(/[*_`]+/g, "").replace(/\s+/g, " ").trim();
}

/**
 * THE NAME A CORRECTION IS KNOWN BY, FOLDED so the verdict's own
 * announcement and the block's `correction:` field are one string.
 *
 * A verifier writes the same correction two ways within one verdict —
 * `**Correction 3 — the counter walks past an overlapping site, so a
 * text matching TWO sites ...**` heads it and `correction: correction 3
 * — the counter walks past an overlapping site` anchors its block — and
 * the ordinal is the half that survives both. Where there is no ordinal
 * the leading phrase is, up to its first dash or sentence punctuation.
 *
 * @param {string} name
 * @returns {string}
 */
export function correctionKey(name) {
  const flat = plainProse(name);
  const numbered = /^(?:CORRECTIONS?|C)\s*#?\s*(\d+[a-z]?)\b/i.exec(flat);
  if (numbered !== null) return `correction ${/** @type {string} */ (numbered[1]).toLowerCase()}`;
  const head = (flat.split(/\s+[—–]+\s+|\s+--\s+|[.:;,]/)[0] ?? flat).trim();
  const bare = /^(?:CORRECTIONS?|C)?\s*#?\s*(\d+[a-z]?)$/i.exec(head);
  if (bare !== null) return `correction ${/** @type {string} */ (bare[1]).toLowerCase()}`;
  return head.toLowerCase();
}

/**
 * DO TWO FOLDED NAMES NAME THE SAME CORRECTION — equal, or one a
 * whole-token prefix of the other, so `correction 1` never meets
 * `correction 11`.
 *
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
function keysMeet(a, b) {
  if (a.length === 0 || b.length === 0) return false;
  if (a === b) return true;
  const [shorter, longer] = a.length < b.length ? [a, b] : [b, a];
  if (!longer.startsWith(shorter)) return false;
  return /[^0-9a-z]/i.test(longer.slice(shorter.length, shorter.length + 1));
}

/** Which lines of a text sit inside a fenced code block. @param {readonly string[]} lines @returns {boolean[]} */
function fencedLines(lines) {
  /** @type {boolean[]} */
  const inside = new Array(lines.length).fill(false);
  /** @type {string | null} */
  let open = null;
  for (let i = 0; i < lines.length; i += 1) {
    const fence = FENCE_LINE.exec(lines[i] ?? "");
    if (fence === null) {
      inside[i] = open !== null;
      continue;
    }
    const ticks = /** @type {string} */ (fence[2]);
    const info = /** @type {string} */ (fence[3] ?? "");
    inside[i] = true;
    if (open === null) open = ticks;
    else if (info.length === 0 && ticks.length >= open.length) open = null;
  }
  return inside;
}

/**
 * EVERY CORRECTION A VERDICT ANNOUNCES, in the order it announces them.
 *
 * @param {string} verdictText
 * @returns {CorrectionEntry[]}
 */
export function correctionEntries(verdictText) {
  const lines = verdictText.split("\n");
  const fenced = fencedLines(lines);
  /** @type {{ name: string, key: string, at: number }[]} */
  const found = [];
  for (let i = 0; i < lines.length; i += 1) {
    if (fenced[i] === true) continue;
    const m = CORRECTION_ANNOUNCEMENT.exec(lines[i] ?? "");
    if (m === null) continue;
    const name = plainProse(/** @type {string} */ (m[1]));
    found.push({ name, key: correctionKey(name), at: i });
  }
  /** @type {CorrectionEntry[]} */
  const entries = [];
  for (let n = 0; n < found.length; n += 1) {
    const one = /** @type {{ name: string, key: string, at: number }} */ (found[n]);
    const next = found[n + 1];
    /** @type {[number, number]} */
    const span = [one.at, next === undefined ? lines.length : next.at];
    const already = entries.find((e) => keysMeet(e.key, one.key));
    if (already === undefined) entries.push({ name: one.name, key: one.key, spans: [span] });
    else already.spans.push(span);
  }
  return entries;
}

/**
 * WHICH CORRECTIONS THE VERDICT STATES CARRY NO BLOCK.
 *
 * The statement is prose, so which correction it is ABOUT is read two
 * ways and in this order. A sentence that NAMES ordinals is about those
 * corrections wherever it sits — "Corrections 1 and 4 are wording
 * repairs ... each pins no property and owes no block" stands in a
 * preamble above every announcement. A sentence that names none is about
 * the correction whose stretch of the verdict it sits in — "Wording; it
 * carries no mutant block." sits inside its own announcement's
 * paragraph, which is the shape that stopped the T-314-s6 merge.
 *
 * A sentence and not a paragraph, because a corrections preamble says
 * both things in one breath: "Corrections 1 and 4 ... owe no block.
 * Corrections 2 and 3 are bodies committed on this bench."
 *
 * @param {string} verdictText
 * @param {readonly CorrectionEntry[]} entries
 * @returns {Set<string>}
 */
export function statedNoBlock(verdictText, entries) {
  const lines = verdictText.split("\n");
  const fenced = fencedLines(lines);
  /** @type {Set<string>} */
  const said = new Set();
  let start = 0;
  for (let i = 0; i <= lines.length; i += 1) {
    const blank = i === lines.length || (lines[i] ?? "").trim().length === 0 || fenced[i] === true;
    if (!blank) continue;
    if (i > start) {
      const flat = plainProse(lines.slice(start, i).join(" "));
      // THE CLAUSE, NEVER THE WHOLE SENTENCE (T-295-s10's verdict,
      // correction 2). One sentence carries two independent clauses about
      // two different corrections — "Correction 1 adds the keeper the
      // amendment's other half never got; correction 2 is a wording repair
      // and carries no block." is T-300-s7's own corrections preamble,
      // measured — and a sentence-wide harvest credits correction 1 with a
      // statement that says the opposite of it, then names a correction the
      // same plan is DRILLING as wording on the step's own line.
      for (const sentence of flat.split(/(?<=[.!?])\s+|\s*;\s*/)) {
        if (!NO_BLOCK_SAID.some((re) => re.test(sentence))) continue;
        // BOTH, never one or the other. A correction's own paragraph
        // says "it pins no property and owes no mutant block, and the
        // block count below is short for that reason and for correction
        // 1's" — a statement about ITSELF that names another correction's
        // ordinal in the same breath (T-317's verdict, measured). Taking
        // the ordinals INSTEAD of the containing entry reads that as a
        // statement about correction 1 and refuses correction 3.
        const owner = entries.find((e) => e.spans.some(([from, to]) => start >= from && start < to));
        if (owner !== undefined) said.add(owner.key);
        for (const key of namedCorrections(sentence)) said.add(key);
      }
    }
    start = i + 1;
  }
  return said;
}

/**
 * THE CORRECTIONS ONE SENTENCE NAMES BY ORDINAL — "correction 3",
 * "Corrections 1 and 4", "corrections 2, 3 and 5".
 *
 * @param {string} sentence
 * @returns {string[]}
 */
function namedCorrections(sentence) {
  /** @type {string[]} */
  const keys = [];
  const run = /\bcorrections?\s+(\d+[a-z]?(?:\s*(?:,|and|&)\s*\d+[a-z]?)*)/gi;
  for (let m = run.exec(sentence); m !== null; m = run.exec(sentence)) {
    for (const one of /** @type {string} */ (m[1]).split(/[^0-9a-z]+/i)) {
      if (/^\d+[a-z]?$/i.test(one)) keys.push(`correction ${one.toLowerCase()}`);
    }
  }
  return keys;
}

/**
 * PER CORRECTION: a block, a statement that it needs none, or neither —
 * and only the third is a shortfall (T-295-s10).
 *
 * The step this feeds used to read one count against another and treat
 * EVERY shortfall as a body nobody wrote. `roles/verifier.md` step 5b
 * prescribes the opposite shape for a wording repair: "A CORRECTION WITH
 * NO PROPERTY TO PIN SAYS SO IN AS MANY WORDS." At the T-314-s6 merge a
 * verdict assigned two corrections, both wording, and said of each that
 * it carries no mutant block — the shape the role file asks for — and the
 * verb stopped on it.
 *
 * A BLOCK IS ATTRIBUTED BY NAME AND THEN BY COUNT, in that order. The
 * names are prose a verifier wrote twice and they can disagree in their
 * tails, so a block left over after the name pass covers a correction
 * left over after it: there IS a committed body, and only its label
 * missed. The direction of that fallback is deliberate — a correction
 * with a body and a mismatched label is a naming slip, while a false
 * stop costs a merge.
 *
 * @param {{ entries: readonly CorrectionEntry[], blocks: readonly MutantBlock[], stated: ReadonlySet<string> }} input
 * @returns {{ wording: CorrectionEntry[], unexplained: CorrectionEntry[] }}
 */
export function correctionShortfall(input) {
  const { entries, blocks, stated } = input;
  /** @type {Set<number>} */
  const attributed = new Set();
  /** @type {Map<string, "block" | "stated">} */
  const covered = new Map();
  for (const entry of entries) {
    const at = blocks.findIndex(
      (b, n) => !attributed.has(n) && keysMeet(correctionKey(b.correction), entry.key),
    );
    if (at !== -1) {
      attributed.add(at);
      covered.set(entry.key, "block");
      continue;
    }
    if (stated.has(entry.key)) covered.set(entry.key, "stated");
  }
  let spare = blocks.length - attributed.size;
  for (const entry of entries) {
    if (covered.has(entry.key) || spare <= 0) continue;
    spare -= 1;
    covered.set(entry.key, "block");
  }
  return {
    wording: entries.filter((e) => covered.get(e.key) === "stated"),
    unexplained: entries.filter((e) => !covered.has(e.key)),
  };
}

/**
 * THE DRILL STEPS a merge owes, read off the card's newest verdict.
 *
 * A verdict that assigns NO correction owes no block, and that is a step
 * that SAYS SO rather than a step that is absent — the difference
 * between "there was nothing to drill" and "nobody looked" is the whole
 * reason this exists.
 *
 * AND A VERDICT WRITTEN BEFORE THIS RULE EXISTED ASSIGNS CORRECTIONS AND
 * CARRIES NO BLOCK. Every verdict on this board older than T-281 is that
 * shape, so a refusal with no way through would make every in-flight card
 * unmergeable — and the way through must not be a blanket, or the first
 * seat to meet it learns to pass the flag by habit. `--blocks-absent`
 * takes the run's OWN verdict sha, the shape `undo.mjs`'s `--force <sha>`
 * already uses on this board: it cannot be typed once and reused, it
 * lands in the run's output, and it downgrades the refusal to NEWS rather
 * than silence. The flag never stands in for a block: a verdict that
 * carries blocks either has them drilled or is stopped, and the flag
 * reaches only a verdict that carries none (T-295-s10, correction 3).
 *
 * AND THE SHORTFALL IS READ PER CORRECTION, NOT AS ONE COUNT AGAINST
 * ANOTHER (T-295-s10). `roles/verifier.md` step 5b prescribes a shape for
 * a correction with no property to pin — it SAYS SO in as many words —
 * and this step used to refuse it: at the T-314-s6 merge a verdict
 * assigned two corrections, both wording, said of each that it carries no
 * mutant block, and the verb stopped, the fourth false stop of the weekend.
 * So each correction is asked its own two questions, every block is
 * drilled as before, a stated no-block correction is nothing to drill, and
 * the refusal is kept for the one shape it was written for: a correction
 * with NEITHER a block NOR the statement, named in the refusal so a seat
 * reading it knows which.
 *
 * @param {{ cardText: string | undefined, projectRoot: string, id: string, verdictSha?: string | undefined, blocksAbsent?: string | undefined }} input
 * @returns {Step[]}
 */
export function drillSteps(input) {
  const { cardText, id } = input;
  /** @param {string} problem @returns {Step[]} */
  const refuse = (problem) => [
    {
      id: "drill:refused",
      kind: "gate",
      action: "mutant-drill",
      problem,
      title: `THE MUTANT DRILL CANNOT RUN on ${id} — ${problem}`,
      why:
        "T-281: the integrator re-drills the bodies the verifier committed, off the blocks the " +
        "newest verdict carries. A block it cannot read is a correction nobody checked, which is " +
        "news rather than silence",
      run: null,
    },
  ];
  if (cardText === undefined) return refuse("the planner was handed no card text");
  const verdict = newestVerdict(cardText);
  if ("problem" in verdict) return refuse(verdict.problem);
  const state = verdictState(verdict.heading);
  if (!/^(?:APPROVED|ACCEPTED)/i.test(state)) {
    return refuse(
      `the newest verdict (${verdict.heading}) reads ${state}, which is not an approval. A merge ` +
        "is what an APPROVED verdict authorises, and the newest verdict is the one that counts",
    );
  }
  const read = readMutantBlocks(verdict.text);
  if ("problem" in read) return refuse(read.problem);
  const heads = correctionHeadings(verdict.text);
  // THE PER-CORRECTION READING IS THE ASSIGNING VERDICT'S AND NO
  // OTHER'S, which is the criterion's own WHEN. A verdict that assigns
  // none still writes the word: `**CORRECTION, and it makes the item
  // BIGGER rather than smaller — this verdict first said ...**` is a
  // verifier correcting its OWN prose inside a finding (T-216-s1's
  // verdict, measured), and enumerating it would invent a correction the
  // verdict never assigned and then refuse the merge for its missing body.
  const assigns = assignsCorrections(verdict.text);
  const entries = assigns ? correctionEntries(verdict.text) : [];
  const { wording, unexplained } = correctionShortfall({
    entries,
    blocks: read.blocks,
    stated: statedNoBlock(verdict.text, entries),
  });
  /** How this step's own line says a correction is wording. @param {readonly CorrectionEntry[] } set */
  const asWording = (set) =>
    `WORDING, no block by the verdict's own words: ${set.map((e) => e.name).join(" / ")}`;
  // THE SHORTFALL, PER CORRECTION AND NOT AS A COUNT (T-295-s10). A
  // verdict that assigns corrections and names no enumerable one is the
  // whole-verdict case this step has always refused; a verdict whose
  // corrections ARE enumerable is refused for the ones that carry
  // neither a block nor the statement, and for no others.
  const nothingRead = entries.length === 0 && read.blocks.length === 0 && assigns;
  if (nothingRead || unexplained.length > 0) {
    const said = nothingRead
      ? `the newest verdict (${verdict.heading}) assigns corrections and carries NO mutant ` +
        "block — a correction whose body has to be recovered from a transcript is the thing " +
        "this step exists to end"
      : `the newest verdict (${verdict.heading}) carries NO mutant block for ` +
        `${String(unexplained.length)} of its ${String(entries.length)} correction(s) and does ` +
        `not say they need none — ${unexplained.map((e) => e.name).join(" / ")}. A correction ` +
        "with no property to pin SAYS SO in as many words (roles/verifier.md 5b) and this step " +
        "takes that at its word; a shortfall the verdict has NOT explained is a body nobody " +
        "wrote, which is the thing this step exists to end";
    const sha = input.verdictSha;
    const named = input.blocksAbsent;
    if (named !== undefined && named.length >= ACKNOWLEDGE_PREFIX && sha !== undefined && sha.startsWith(named)) {
      // THE ACKNOWLEDGEMENT IS THE WHOLE-VERDICT ONE AND CANNOT REACH A
      // PARTIAL SHORTFALL (T-295-s10's verdict, correction 1). This
      // function's own docblock says the flag never stands in for a
      // block, and at the base that held BY CONSTRUCTION: this branch
      // was reachable only inside `read.blocks.length === 0`. Reading the
      // shortfall per correction makes it reachable WITH blocks present,
      // where returning this one step leaves every committed body
      // undrilled — the one thing this step exists to stop. THE GUARD IS
      // BLOCKS PRESENT, as the refusal below says: a verdict carrying none —
      // enumerable corrections or not — is the pre-rule shape the flag exists
      // to acknowledge (the integrator's correction at the merge, 2026-09-14;
      // cli.spec.ts's acknowledgement body red at the closing check).
      if (read.blocks.length !== 0) {
        return refuse(
          "--blocks-absent acknowledges a verdict that carries NO mutant block at all, and " +
            `this one carries ${String(read.blocks.length)}: the bodies it DOES carry are ` +
            "drilled rather than waved past, and a correction that carries none is answered " +
            `by the verdict saying so in as many words. ${said}`,
        );
      }
      return [
        {
          id: "drill:none",
          kind: "gate",
          action: "mutant-drill",
          warning: `${said}. ACKNOWLEDGED by --blocks-absent ${named}: nothing was re-drilled.`,
          title: `NO MUTANT BLOCK on ${id}'s newest verdict — acknowledged, not drilled`,
          why:
            "T-281: a verdict written before this rule existed carries no block, and the way " +
            "through NAMES the verdict rather than blanketing the check",
          run: null,
        },
      ];
    }
    if (named !== undefined) {
      return refuse(
        `--blocks-absent named ${named}, which is not this run's verdict ` +
          `${sha === undefined ? "(none resolved)" : sha.slice(0, 12)}. It is not a blanket ` +
          "override: it names the specific verdict you have read and accepted",
      );
    }
    return refuse(
      `${said}. If this verdict PREDATES the rule, read it and re-run naming it: ` +
        `--blocks-absent ${sha === undefined ? "<verdict sha>" : sha.slice(0, 12)}`,
    );
  }
  if (read.blocks.length === 0) {
    // NOTHING TO DRILL, AND WHICH OF THE TWO REASONS IT IS. A verdict
    // assigning none has always said so here; a verdict whose every
    // correction is wording now says THAT instead, and names them, so a
    // seat reading one line per step sees why nothing was drilled rather
    // than reading an absence (T-295-s10 criterion 2).
    return [
      {
        id: "drill:none",
        kind: "gate",
        action: "mutant-drill",
        ...(wording.length > 0 ? { wording: wording.map((e) => e.name) } : {}),
        title:
          wording.length === 0
            ? `the newest verdict (${verdict.heading}) assigns no correction, so nothing is re-drilled`
            : `the newest verdict (${verdict.heading}) assigns ${String(entries.length)} ` +
              `correction(s) and no block — ${asWording(wording)} — so nothing is re-drilled`,
        why:
          wording.length === 0
            ? "T-281: an APPROVED verdict owes no block, and saying so is not the same as finding none"
            : "roles/verifier.md 5b: a correction with no property to pin says so in as many " +
              "words, and a shortfall the verdict HAS explained is not a body nobody wrote " +
              "(T-295-s10)",
        run: null,
      },
    ];
  }
  return read.blocks.map((block, n) => ({
    id: `drill:${String(n + 1)}`,
    kind: /** @type {const} */ ("gate"),
    action: /** @type {const} */ ("mutant-drill"),
    block,
    title:
      `re-drill ${block.correction} — plant the mutant in ${block.file}, require ` +
      `${JSON.stringify(block.body)} RED ALONE in ${block.spec}` +
      (n === 0
        ? ` (${String(heads)} correction heading(s), ${String(read.blocks.length)} block(s)` +
          // THE COUNT THE STEP ACTUALLY READ, said only where it differs
          // from the heading count — a verdict that announces its
          // corrections in BOLD rather than as headings heads none of
          // them, and a line reporting `0 correction heading(s)` beside
          // two corrections read is a figure a seat has to re-derive.
          (entries.length === heads ? "" : `, ${String(entries.length)} correction(s) read`) +
          (wording.length === 0 ? ")" : `; ${asWording(wording)})`)
        : ""),
    why:
      "T-281 criterion 3: the block is the verifier's, the drill is the integrator's, and the " +
      "merge stops before the commit on a survivor, on a body that reds more than itself, or on " +
      "an anchor that does not match once",
    run: null,
  }));
}

/**
 * WHERE A REGENERATION HAPPENS, as a function of the setting (T-299,
 * ADR-024 decision 6).
 *
 * `merge.regen_graph` and `merge.regen_census` say whether the arm
 * rebuilds a generated file inside the merge plan — with its own exit,
 * its currency check and its staging — or whether the plan carries a
 * STOP naming what the seat owes and the regeneration happens off the
 * ledger. The second is the ceremony as it stood: the T-112-s6 merge
 * left main red on the app suite for forty minutes because a graph the
 * seat was going to regenerate had not been.
 *
 * @param {ProcessSettings | undefined} settings
 * @param {"graph" | "census"} which
 * @returns {{ byTheArm: boolean, why: string }}
 */
export function regenPlace(settings, which) {
  if (settings === undefined) {
    return {
      byTheArm: true,
      why: "no process settings were passed, so the arm regenerates as it did before the switch existed",
    };
  }
  const id = which === "graph" ? "merge.regen_graph" : "merge.regen_census";
  const how = which === "graph"
    ? switchValue(settings, "merge.regen_graph")
    : switchValue(settings, "merge.regen_census");
  if (how === "by-the-arm") {
    return { byTheArm: true, why: `${id} is by-the-arm: the regeneration is a step with its own exit` };
  }
  return {
    byTheArm: false,
    why:
      `${id} is by-the-seat: this plan names what is owed and STOPS, and the regeneration happens ` +
      "off the ledger where nothing grades it",
  };
}

/**
 * THE CHEAP KEEPERS AS STEPS WITH EXITS (T-295 criterion 4).
 *
 * Each is a step because the card says so, and the reason is the seat's:
 * a check folded into another step's exit is a check nobody can see
 * refuse. The first three are PURE functions of the staged diff and the
 * runner performs them; the fourth is the card's own preflight, which is
 * a command and is spelled as one.
 *
 * AND THREE OF THE FOUR ARE A SWITCH (T-299, ADR-024 decision 6). The
 * card's own preflight is FLOOR — `dispatch.preflight` is in the set no
 * profile turns off — so it is planned whatever `merge.keepers` says;
 * the pinned-sentence, forbidden-spelling and diff-size checks are the
 * cheap keepers that switch went on, and a project running the ceremony
 * as it stood on 2026-09-09 has them off.
 *
 * @param {{ projectRoot: string, id: string, card: string, process?: ProcessSettings | undefined }} input
 * @returns {Step[]}
 */
export function keeperSteps(input) {
  const brief = path.join(input.projectRoot, "tools", "e2e", "scripts", "brief.mjs");
  const cheap =
    input.process === undefined ? "on" : switchValue(input.process, "merge.keepers");
  /** @type {Step[]} */
  const steps = [
    {
      id: "keeper:pinned-sentence",
      kind: "gate",
      action: "keeper",
      keeper: "pinned-sentence",
      title: "no line this merge REMOVES under method/ or docs/ is pinned VERBATIM by a spec",
      why:
        "T-295 criterion 4, and the T-285 merge is the instance: the seat reworded a clause in " +
        "TASK-FORMAT.md while applying an assigned correction and broke a sentence a lane's body " +
        "asserted word for word. Grepping the specs by the text that is going away is the " +
        "cheapest check that would have caught it",
      run: null,
    },
    {
      id: "keeper:forbidden-spelling",
      kind: "gate",
      action: "keeper",
      keeper: "forbidden-spelling",
      title:
        "no line this merge ADDS carries a forbidden spelling — the rename classes, a personal " +
        "name, an email, a home path or a secret shape",
      why:
        "T-295 criterion 4. The rename half is not hypothetical: a merge on 2026-09-10 carried a " +
        "comment spelling the retired identifier and the keeper spec redded it after the fact. " +
        "The classifier is rename-scan.mjs's own, so a spelling that file keeps is kept here",
      run: null,
    },
    {
      id: "keeper:xs-bound",
      kind: "gate",
      action: "keeper",
      keeper: "xs-bound",
      title: `an XS card past the XS bound of ${String(XS_CHANGED_LINE_BOUND)} changed line(s) is BUMPED to ${BUMPED_TIER}`,
      why:
        "T-295 criterion 4, in the shape T-296 gives it. The bound had to exist before the tier " +
        "that reads it, and a bound with nothing to do about a breach can only refuse; now that " +
        "the tiers exist the subject is a MIS-SIZING and not a defect, so this step BUMPS and " +
        "passes. A card of any other size is NOT judged and the step says so",
      run: null,
    },
    {
      id: "keeper:preflight",
      kind: "gate",
      title: `the card's own preflight — brief.mjs --task ${input.id} --preflight`,
      why:
        "T-295 criterion 4: a card whose claims no longer hold against the merged tree is a card " +
        "the merge is about to make the record. The preflight is the existing arm and this step " +
        "spends it at the one moment the merged tree exists and the commit does not",
      run: existsSync(brief)
        ? {
            command: process.execPath,
            argv: [brief, "--task", input.id, "--preflight", "--root", input.projectRoot],
            cwd: input.projectRoot,
            // QUIET WHILE IT HOLDS, WHOLE WHEN IT DOES NOT. The preflight
            // renders a card's entire brief, and sixteen kilobytes of
            // context pack in the middle of a merge's ledger is a step
            // nobody reads the exit of. On a refusal every byte goes out.
            quiet: true,
          }
        : null,
      ...(existsSync(brief)
        ? {}
        : {
            problem:
              `${path.relative(input.projectRoot, brief)} is not in this project, so this card's ` +
              "claims cannot be re-derived here — news, never silence",
          }),
    },
  ];
  if (cheap === "on") return steps;
  // OFF IS ANNOUNCED, NEVER SILENT. A merge that simply planned three
  // steps fewer would look exactly like a merge whose plan had lost
  // them, and the pinned-sentence keeper exists because a seat reworded
  // a sentence a body asserted word for word and nobody saw it go.
  const floor = steps.filter((st) => st.id === "keeper:preflight");
  return [
    {
      id: "keeper:off",
      kind: "gate",
      title: `the cheap keepers are OFF — merge.keepers is ${cheap} in this project's process settings`,
      why:
        "T-299: the pinned-sentence, forbidden-spelling and diff-size checks are a SWITCH, and " +
        `this project has it off (${PROCESS_SCHEMA}). The card's own preflight below is FLOOR and ` +
        "is planned anyway. This step is a note rather than a silence, because a plan that lost " +
        "three steps and a plan that was set to skip them look the same in a ledger",
      run: null,
    },
    ...floor,
  ];
}

/**
 * The setup steps, in docs/CONVENTIONS.md's fresh-clone ORDER: the
 * parser FIRST — its `npm ci` and its build — then the app, because the
 * app resolves `@supertaskr/parser` through the parser's own
 * node_modules and needs its dist/.
 *
 * READ WITH ITS DEFAULT, for the reason `undo.mjs`'s `repoRoot` states:
 * called with no root it reads THIS repository's docs/CONVENTIONS.md.
 *
 * @param {string} [projectRoot] the project to read; THIS repository when omitted
 * @returns {Step[]}
 */
export function setupSteps(projectRoot) {
  const conventions =
    projectRoot === undefined
      ? CONVENTIONS_PATH
      : path.join(projectRoot, "docs", "CONVENTIONS.md");
  const root = projectRoot ?? repoRoot;
  /** @type {Step[]} */
  const steps = [];
  for (const dir of ["lib/parser", "app"]) {
    const commands = conventionCommandsFor(
      existsSync(conventions) ? readFileSync(conventions, "utf8") : "",
      dir,
    ).filter((c) => /^npm (ci|install)$/.test(c) || c === "npm run build");
    for (const command of commands) {
      const argv = command.split(" ").slice(1);
      steps.push({
        id: `setup:${dir}:${command}`,
        kind: "setup",
        title: `${command} from ${dir}/`,
        why:
          "room item 18: this merge brings sources under app/ or lib/, and a suite run on a " +
          "stale bundle measures the tree that was there before (T-018-s5, T-264)",
        run: { command: "npm", argv, cwd: path.join(root, dir) },
      });
    }
    if (commands.length === 0) {
      steps.push({
        id: `setup:${dir}:underivable`,
        kind: "setup",
        title: `set up ${dir}/ — ${buildCommandFor(dir, root)}`,
        why: "room item 18, with the command underivable from this project's docs/CONVENTIONS.md",
        run: null,
      });
    }
  }
  return steps;
}

/**
 * THE TAIL — what a merge owes once it is staged, derived from the
 * paths the staged merge actually carries.
 *
 * ORDER IS THE PROPERTY, not membership: the setup steps must precede
 * every suite step, and the dogfood bodies must precede the stop that
 * hands the commit back. `tests/cli.spec.ts` asserts both as positions
 * in this array rather than as presence, because a plan that contains
 * the right steps in the wrong order is exactly the T-018-s5 failure.
 *
 * THE MUTANT DRILL IS THE LAST THING BEFORE THE STOP (T-281): it runs a
 * spec, so every setup step has to precede it, and it decides whether
 * the commit may happen at all, so nothing may follow it but the stop.
 *
 * AND WHICH STEPS THERE ARE AT ALL IS A SETTING (T-299, ADR-024
 * decision 6): `merge.keepers` decides the cheap keepers and
 * `merge.regen_graph` / `merge.regen_census` decide whether a
 * regeneration is a graded step here or a STOP naming what the seat
 * owes. A caller that passes no settings gets the plan this function
 * built before the switches existed, byte for byte.
 *
 * @param {{ paths: readonly string[], projectRoot: string, id: string, cardText?: string | undefined, verdictSha?: string | undefined, blocksAbsent?: string | undefined, blocks?: readonly MutantBlock[] | undefined, card?: string | undefined, bumpFrom?: string | undefined, bumpTo?: string | undefined, process?: ProcessSettings | undefined }} input
 * @returns {Step[]}
 */
export function tailPlan(input) {
  const { paths, projectRoot, id } = input;
  /** @type {Step[]} */
  const steps = [];
  // THE CORRECTIONS COME FIRST AND THE REGENERATIONS AFTER THEM (T-295
  // criterion 2), which is an ORDER rather than a set: a census or a
  // graph rebuilt ahead of a correction describes the tree that was
  // there, and the commit then carries a generated file disagreeing with
  // the source beside it.
  const blocks = input.blocks ?? [];
  if (blocks.length > 0) steps.push(...correctionSteps({ blocks }));
  steps.push(
    ...keeperSteps({
      projectRoot,
      id,
      card: input.card ?? "",
      ...(input.process === undefined ? {} : { process: input.process }),
    }),
  );
  const censusPlace = regenPlace(input.process, "census");
  const graphPlace = regenPlace(input.process, "graph");
  const bump = bumpSteps({
    paths,
    projectRoot,
    ...(input.bumpTo === undefined ? {} : { version: input.bumpTo }),
    ...(input.bumpFrom === undefined ? {} : { from: input.bumpFrom }),
  });
  steps.push(...bump);
  // THE BUMP MOVES kit.rs, WHICH IS UNDER THE WALK. So a merge that
  // bumps owes the graph even when its own paths carry no indexed
  // source — derived here rather than left to the reminder at the foot.
  const bumped = bump.some((s) => s.id === "bump:stamps");
  if (bringsBuiltSources(paths)) steps.push(...setupSteps(projectRoot));
  if (movesSpecNames(paths) && !censusPlace.byTheArm) {
    steps.push({
      id: "capabilities:owed",
      kind: "stop",
      title: "THE CENSUS IS OWED AND THIS PLAN DOES NOT REGENERATE IT — a spec name moved",
      why: censusPlace.why,
      run: null,
    });
  }
  if (movesSpecNames(paths) && censusPlace.byTheArm) {
    steps.push({
      id: "capabilities",
      kind: "regen",
      title: "npm run capabilities from tools/e2e/ — a spec name moved",
      why:
        "docs/CONVENTIONS.md: the census is GENERATED from the test names, and the " +
        "regeneration lands in the MERGE commit, the integrator's",
      run: { command: "npm", argv: ["run", "capabilities"], cwd: path.join(projectRoot, "tools", "e2e") },
    });
    steps.push({
      id: "capabilities:add",
      kind: "git",
      title: "git add docs/CAPABILITIES.md",
      why:
        "the prototype's step 7 stages what it regenerated — a seat that trusts \"the merge is " +
        "staged\" would otherwise commit without the census it just rebuilt",
      run: {
        command: "git",
        argv: ["-C", projectRoot, "add", "docs/CAPABILITIES.md"],
        cwd: projectRoot,
      },
    });
  }
  if ((movesIndexedSource(paths) || bumped) && !graphPlace.byTheArm) {
    steps.push({
      id: "graph:owed",
      kind: "stop",
      title: "THE GRAPH IS OWED AND THIS PLAN DOES NOT REGENERATE IT — indexed source moved",
      why: graphPlace.why,
      run: null,
    });
  }
  if ((movesIndexedSource(paths) || bumped) && graphPlace.byTheArm) {
    steps.push({
      id: "graph:regen",
      kind: "regen",
      title: "regenerate the committed graph — indexed source moved",
      why: "docs/CONVENTIONS.md GRAPH REGEN: ask the gate rather than predicting; a no-op regen PROVES it",
      run: {
        // SUPERTASKR_UPDATE_GOLDEN=1 is what makes this a REGEN rather than a
        // check — docs/CONVENTIONS.md's GRAPH REGEN bullet spells the whole
        // command, and without the variable the ignored body asserts instead
        // of writing.
        env: { SUPERTASKR_UPDATE_GOLDEN: "1" },
        command: "cargo",
        argv: [
          "test",
          "-p",
          "supertaskr-index",
          "--test",
          "self_graph",
          "--",
          "--ignored",
        ],
        cwd: path.join(projectRoot, "app", "src-tauri"),
      },
    });
    steps.push({
      id: "graph:check",
      kind: "gate",
      title: "cargo run -p supertaskr-index -- index --check --root ../..",
      why: "the graph-currency gate, asked by hand at the merge and recorded in the checkpoint",
      run: {
        command: "cargo",
        argv: ["run", "-p", "supertaskr-index", "--", "index", "--check", "--root", "../.."],
        cwd: path.join(projectRoot, "app", "src-tauri"),
      },
    });
    steps.push({
      id: "graph:add",
      kind: "git",
      title: "git add docs/architecture",
      why: "the prototype's step 8 stages the regenerated graph into the merge commit",
      run: { command: "git", argv: ["-C", projectRoot, "add", "docs/architecture"], cwd: projectRoot },
    });
  }
  if ((movesGraph(paths) || movesIndexedSource(paths) || bumped) && graphPlace.byTheArm) {
    steps.push({
      id: "dogfood",
      kind: "suite",
      action: "graph-pins",
      title: "the app's dogfood bodies, then the re-derived pins and their dated line",
      why:
        "room item 27: a merge that moves the graph moves six pins in app/test, and main was red " +
        "on the app suite for forty minutes at T-112-s6's merge. Run them BEFORE the commit; " +
        "print what moved and the dated line — never rewrite a pin (T-211)",
      run: {
        command: "npx",
        argv: [
          "vitest",
          "run",
          "test/architecture-dogfood.test.ts",
          "test/map-dogfood-render.test.tsx",
        ],
        cwd: path.join(projectRoot, "app"),
      },
    });
  }
  const docsPaths = paths.filter((p) => p.startsWith("docs/"));
  if (docsPaths.length > 0) {
    // THE PROJECT'S OWN GATE, never this package's copy: `docs-gate.mjs`
    // computes its root from its own location, so the package's copy
    // would answer about the package. When the project has none, that is
    // said as a step rather than left to become a stack trace.
    const gate = path.join(projectRoot, "tools", "e2e", "scripts", "docs-gate.mjs");
    steps.push(
      existsSync(gate)
        ? {
            id: "docs-gate",
            kind: "gate",
            action: "docs-gate",
            title: `docs-gate.mjs on ${String(docsPaths.length)} path(s) under docs/`,
            why:
              "docs/CONVENTIONS.md DOCS GATE: docs/ is a CODE INPUT and neither other trigger " +
              "can see it. A gate that FIRES is NEWS — it names the suites this merge owes at " +
              "the push, and every merge carrying a card fires it — so the run goes on and the " +
              "owed set joins the message. Anything else it says STOPS the run",
            run: {
              command: process.execPath,
              argv: [gate, ...docsPaths],
              cwd: projectRoot,
              // TOLERATED so the ACTION reads the answer. The gate exits 1
              // on FIRES and on STALE alike and only its OUTPUT tells them
              // apart; grading this step on the exit alone would stop every
              // merge that carries a card, which is every merge.
              tolerate: true,
            },
          }
        : {
            id: "docs-gate:absent",
            kind: "gate",
            title: `THE DOCS GATE COULD NOT RUN — ${path.relative(projectRoot, gate)} is not in this project`,
            why:
              `${String(docsPaths.length)} path(s) under docs/ are in this merge and no gate in ` +
              "this project can say what they owe; that is news, never silence",
            run: null,
          },
    );
  }
  steps.push(
    ...drillSteps({
      cardText: input.cardText,
      projectRoot,
      id,
      verdictSha: input.verdictSha,
      blocksAbsent: input.blocksAbsent,
    }),
  );
  steps.push(
    {
      id: "counts",
      kind: "gate",
      action: "counts",
      title: "the counts this merge's own runs read, against the counts the verdict claims",
      why:
        "2d6d354: a merge script that committed on an exit code while the count under it had " +
        "moved landed main red. READ THE COUNT AS WELL AS THE EXIT — an exit 0 over zero bodies " +
        "is not a pass — and refuse before the commit when the two disagree",
      run: null,
    },
    {
      id: "message",
      kind: "stop",
      action: "message",
      title: "the merge message, written FROM the verdict's own sentences and counts",
      why:
        "T-295 criterion 5: a message a seat composes is a summary of what the seat remembers, " +
        "and two messages on 2026-09-09 named a count that had moved. Every sentence here comes " +
        "out of the verdict or out of a figure this run measured",
      run: null,
    },
    {
      id: "meters",
      kind: "stop",
      action: "meters",
      title: `the lane's and the verifier's \`## Meters\` blocks, appended to ${READINGS_PATH}`,
      why:
        "T-295 criterion 5, and T-297 is blocked on it: the meters blocks exist in every report " +
        "and verdict on this board and are read by nobody. This is the capture; the bands own " +
        "the parse",
      run: null,
    },
  );
  steps.push({
    id: "stop",
    kind: "stop",
    title: `STOP — the merge is staged, not committed. Add ${id}'s integrator writes, then commit.`,
    why:
      "the prototype's step 10: a merge carries card-specific integrator writes, and a command " +
      "that committed for you would commit them out",
    run: null,
  });
  steps.push({
    id: "after",
    kind: "stop",
    title: "AFTER the corrections: re-ask the graph, and keep the lane BRANCH until the push",
    why:
      "the prototype's step 11: a correction that moves a .ts/.rs under the walk stales the regen " +
      "this run made, and the landing arm resolves a card by the branch at the merge's second " +
      "parent — delete the branch after CI has been read, never before",
    run: null,
  });
  return steps;
}

/**
 * THE PRELUDE — the git half, which is the same on every card.
 *
 * @param {{ projectRoot: string, id: string, branch: string, lane: string, verdict: string, worktree: string | null, widen?: readonly string[] | null }} input
 * @returns {Step[]}
 */
export function preludePlan(input) {
  const { projectRoot, id, branch, lane, verdict, worktree } = input;
  const widen = input.widen ?? null;
  /** @type {Step[]} */
  const steps = [
    {
      id: "precondition:clean",
      kind: "precondition",
      title: `a clean tree on ${branch}`,
      why:
        "the prototype's step 0: a merge onto a dirty tree cannot be told from the dirt. " +
        "`git status --porcelain` EXITS 0 on a filthy tree, so this step is graded on its " +
        "OUTPUT being empty and not on its exit code (R4, the verifier's bench at f809cd9: " +
        "the step passed over a dirty tree and the merge staged on top of the dirt)",
      run: {
        command: "git",
        argv: ["-C", projectRoot, "status", "--porcelain"],
        cwd: projectRoot,
        assert: "empty-output",
      },
    },
    {
      id: "precondition:verdict",
      kind: "precondition",
      title: `${verdict.slice(0, 12)} exists and descends from ${lane}`,
      why: "room 17: the lane branch moves to the VERDICT commit before the merge, never after",
      run: {
        command: "git",
        argv: ["-C", projectRoot, "merge-base", "--is-ancestor", lane, verdict],
        cwd: projectRoot,
      },
    },
  ];
  if (widen !== null && widen.length > 0) {
    steps.push({
      id: "fence:widen",
      kind: "git",
      action: "widen-fence",
      title:
        `widen ${id}'s fence on ${branch} by ${String(widen.length)} verdict-named spec(s) ` +
        `BEFORE the merge — ${widen.join(", ")}`,
      why:
        "T-281-s10, absorbed by T-295. T-281's grammar has the verifier commit each correction's " +
        "body in the spec the property lives in, and for a lane whose fence is method text that " +
        "spec is outside the fence BY CONSTRUCTION. T-283's merge carried four such bodies and " +
        "the landing gate refused the push, because it reads the fence from the merge's FIRST " +
        "PARENT — so the widening has to be its own commit on the integration branch, ahead of " +
        "the merge, and it names the verdict that owes it",
      run: null,
    });
  }
  if (worktree !== null) {
    steps.push({
      id: "worktree:remove",
      kind: "git",
      title: `remove the lane worktree ${worktree} (the bench stands)`,
      why: "lane-protocol rule 6: the INTEGRATOR removes it, after the merge and before the checkpoint",
      run: {
        command: "git",
        argv: ["-C", projectRoot, "worktree", "remove", "--force", worktree],
        cwd: projectRoot,
      },
    });
  }
  steps.push(
    {
      id: "branch:move",
      kind: "git",
      title: `move ${lane} to ${verdict.slice(0, 12)}`,
      why:
        "room 17: the verdict commit is what gets merged, not the tip the executor left — and " +
        "since T-281 the verifier commits its correction BODIES after that commit, so the sha to " +
        "pass is the BENCH TIP. The drill step checks each named body is really on the merged " +
        "tree rather than trusting this sentence",
      run: { command: "git", argv: ["-C", projectRoot, "branch", "-f", lane, verdict], cwd: projectRoot },
    },
    {
      id: "merge",
      kind: "git",
      action: "resolve-conflicts",
      title: `git merge --no-ff --no-commit ${lane}`,
      why:
        "the prototype's step 4: the merge is staged so the integrator's own writes join it. A " +
        "CONFLICT here gets exactly three answers and no fourth (T-295): this card's own file is " +
        "taken from the LANE, a single end-of-file append keeps both sides and restores the " +
        "closing, and everything else is named as a FENCE finding and stops the run — two lanes " +
        "writing the same lines of one file is a fence that was not disjoint, and no merge may " +
        "resolve that on their behalf",
      run: {
        command: "git",
        argv: ["-C", projectRoot, "merge", "--no-ff", "--no-commit", lane],
        cwd: projectRoot,
        tolerate: true,
      },
    },
    {
      id: "stamp",
      kind: "git",
      action: "stamp-done",
      title: `stamp status: done on ${id}'s card, and git add it`,
      why:
        "the prototype's step 5: the card is resolved by its own `id:` line and the stamp lands " +
        "IN the merge commit — a step that only said so left the write to somebody's memory",
      run: null,
    },
  );
  return steps;
}

/**
 * THE RE-DERIVED PINS AND THEIR DATED LINE (room item 27's second half).
 *
 * PURE, and that is the point: the numbers come from the graph the merge
 * just staged, the date from the caller, and nothing here edits a
 * fixture. T-211 is explicit that a lane never updates the dogfood pins
 * and that the reconciliation is integration-seat WORK — so this hands
 * the seat the sentence and the figures to write, in the shape
 * `app/test/architecture-dogfood.test.ts` already uses, and stops.
 *
 * The criterion this closes was PROSE before (R6, the verifier's bench at
 * f809cd9): the step ran the bodies, the comment said the pins were
 * re-derived, and the body asserted the comment.
 *
 * @param {{ graph: unknown, id: string, at: Date }} input
 * @returns {string}
 */
export function graphPinLine(input) {
  const g = /** @type {Record<string, unknown>} */ (
    input.graph !== null && typeof input.graph === "object" ? input.graph : {}
  );
  const files = Array.isArray(g["files"]) ? g["files"].length : 0;
  const edges = Array.isArray(g["edges"]) ? g["edges"].length : 0;
  const symbols = Array.isArray(g["files"])
    ? g["files"].reduce((n, f) => {
        const sym = /** @type {Record<string, unknown>} */ (
          f !== null && typeof f === "object" ? f : {}
        )["symbols"];
        return n + (Array.isArray(sym) ? sym.length : 0);
      }, 0)
    : 0;
  const day = input.at.toISOString().slice(0, 10);
  return (
    `RECONCILED AT THE ${input.id} MERGE (${day}, integrator). Re-derived from the staged ` +
    `graph: ${String(files)} files, ${String(symbols)} symbols, ${String(edges)} edges. ` +
    "Check each dogfood pin against `git show HEAD:docs/architecture/graph.json` and write the " +
    "deltas here before the commit — a lane never updates the pins (T-211)."
  );
}

/**
 * THE DONE STAMP, as the prototype's step 5 writes it.
 *
 * Pure text in, pure text out. `built_by:` and `verified_by:` are filled
 * only where they are EMPTY, because a value already on the card is
 * somebody's record and this is not the seat that may overwrite it.
 *
 * @param {{ text: string, builtBy: string, verifiedBy: string }} input
 * @returns {string}
 */
export function stampDone(input) {
  return input.text
    .replace(/^status: (building|verifying|merging)[ \t]*$/m, "status: done")
    .replace(/^built_by:[ \t]*$/m, `built_by: ${input.builtBy}`)
    .replace(/^verified_by:[ \t]*$/m, `verified_by: ${input.verifiedBy}`);
}

// ── THE VERB'S OWN HALF (T-295) ──────────────────────────────────────
//
// Everything below joins the ritual the file above already performs, and
// every piece of it is here because a SEAT did it by hand at one of the
// merges of 2026-09-09 and 2026-09-10 and the hand slipped. The record
// of each slip is on the function that closes it; the two that cost a
// red main are the correction reader that found no block because the
// fence was indented, and the doc clause whose rewording broke a
// sentence a lane's body pinned verbatim.
//
// THE DIVISION OF LABOUR IS THE CARD'S: the verb performs, the seat
// RULES. So every one of these is a STEP with an exit rather than a
// silent fixup, a refusal names the step and the reason, and the tree is
// left staged for the seat to judge.

/**
 * WHAT ONE CORRECTION'S READING MEASURED, carried on every answer it can
 * give. Criterion 3 of T-295-s9: the step's own line states both counts,
 * so a seat reading one line per step sees an ambiguous anchor BEFORE
 * the drill rather than after the merge.
 *
 * @typedef {object} CorrectionCounts
 * @property {number} oldSites the sites the block's `old` text matches in the file as it will be committed
 * @property {number} newSites the sites its `new` text matches in that same file
 */

/**
 * @typedef {(CorrectionCounts & { text: string })
 *   | (CorrectionCounts & { already: string })
 *   | (CorrectionCounts & { problem: string })} CorrectionDecision
 */

/**
 * THE TWO COUNTS, IN THE ONE SPELLING EVERY OUTCOME PRINTS.
 *
 * One spelling because there is one claim: a step that reported its
 * counts three different ways would be three sentences to keep true.
 *
 * @param {CorrectionCounts} counts
 * @returns {string}
 */
export function correctionCountsLine(counts) {
  return (
    `\`old\` matches ${String(counts.oldSites)} site(s), ` +
    `\`new\` matches ${String(counts.newSites)} site(s)`
  );
}

/**
 * ONE CORRECTION, DECIDED BY COUNTING BOTH ANCHORS IN THE FILE AS IT
 * WILL BE COMMITTED — never by trusting the block's own sentence that
 * its anchor is unique.
 *
 * A MUTANT BLOCK's `old` is the text the drill requires to be IN the
 * tree, because the drill plants `new` over it and requires the named
 * body RED. So the two halves are not interchangeable and only one of
 * them can be the correction: when the merged tree carries the block's
 * `new` text, the tree carries the DEFECT and the `old` text is the fix.
 *
 * THE ONLY TWO STATES THIS FUNCTION ACTS ON (T-295-s9, the amendments
 * of 2026-09-13), and both are read off the tree rather than off the
 * verdict's prose — a verdict says a correction is assigned, it does not
 * say whether the lane's own fix pass already landed it, and at four of
 * the merges this verb was cut from it had:
 *
 *   `old` 1 · `new` 0  the correction is already in the merged tree, so
 *                      nothing is written.
 *   `old` 0 · `new` 1  the correction is owed at that ONE site, and it
 *                      is applied there.
 *   anything else      REFUSED by name, before any write: either text at
 *                      two or more sites, both present, or both absent.
 *                      The file is left exactly as the step found it.
 *
 * THE MEASURED FAULT THIS SHAPE CLOSES, at the T-314 merge of
 * 2026-09-13: the third correction's three-line `old` text matched
 * `.claude/hooks/hook-install.mjs` ONCE — the correction was already in the
 * tree — and its `new` text ONCE, at a presence check that legitimately
 * preceded the executable check the block was about (the single-line
 * needle occurs twice; the three-line texts once each, measured at
 * 88ca5166 — the verdict's correction 4). The reader this replaces answered that
 * arrangement by MASKING every occurrence of `old` and asking whether
 * exactly one `new` survived. One did, at the legitimate site, and the
 * step wrote the block's `old` text over it: the merged tree then
 * differed from the verified bench tip by one line, a presence check
 * turned into an executable one, and the correction's own body redded on
 * the closing check while it had been green on the bench.
 *
 * SO THE MASK IS GONE, AND WITH IT THE INFERENCE IT WAS FOR. A `new`
 * text that is a SUBSTRING of its own `old` (a clause deleted, a guard
 * dropped) reads as both-present on an already-corrected tree — and
 * both-present is now a REFUSAL rather than a deduction, because the
 * counts cannot tell that arrangement from "the correction is owed here
 * and its `old` text also occurs elsewhere", which is the arrangement
 * that cost main a line. A refusal costs the seat one correction applied
 * by hand at the site the verdict names; the guess cost verified code.
 *
 * AND THE REFUSAL IS ALSO WHAT KEEPS THE DRILL'S OWN PRECONDITION: an
 * apply happens only where `old` was absent and lands it once, so the
 * tree `plantMutant` meets carries `old` exactly once — the thing it
 * refuses to proceed without.
 *
 * @param {{ source: string, block: MutantBlock }} input
 * @returns {CorrectionDecision}
 */
export function correctionFor(input) {
  const { source, block } = input;
  const counts = {
    oldSites: occurrences(source, block.old),
    newSites: occurrences(source, block.new),
  };
  if (counts.oldSites === 1 && counts.newSites === 0) {
    return {
      ...counts,
      already:
        `${block.correction}: ${block.file} already carries the block's \`old\` text, so this ` +
        "correction is in the merged tree and nothing was written. The re-drill below is what " +
        `says whether the body still pins it — ${correctionCountsLine(counts)}`,
    };
  }
  if (counts.oldSites === 0 && counts.newSites === 1) {
    // A FUNCTION REPLACEMENT, never a string one: `$&`, `$1` and `$'`
    // are substitution syntax in a string replacement, so an `old` text
    // carrying one would be written as something else entirely.
    return { ...counts, text: source.replace(block.new, () => block.old) };
  }
  return {
    ...counts,
    problem:
      `${block.correction}: REFUSED — ${correctionCountsLine(counts)} in ${block.file}. A ` +
      "correction names ONE site, which is `old` once with `new` absent (already applied) or " +
      "`old` absent with `new` once (owed here); every other arrangement names no site or " +
      "several, so NOTHING was written and the file is exactly as this step found it. The merge " +
      "stops here rather than guessing which site was meant",
  };
}

/**
 * THE CORRECTION STEPS, ONE PER BLOCK, BEFORE EVERY REGENERATION.
 *
 * ORDER IS THE PROPERTY the card names in its own words — "regenerate
 * after the corrections, never before". A census or a graph rebuilt
 * ahead of a correction describes the tree that was there, and the
 * commit then carries a generated file that disagrees with the source
 * beside it. That is the same class as T-018-s5's stale bundle, one
 * directory over.
 *
 * @param {{ blocks: readonly MutantBlock[] }} input
 * @returns {Step[]}
 */
export function correctionSteps(input) {
  return input.blocks.map((block, n) => ({
    id: `correction:${String(n + 1)}`,
    kind: /** @type {const} */ ("git"),
    action: /** @type {const} */ ("apply-correction"),
    block,
    title:
      `apply ${block.correction} in ${block.file} — the block's \`old\` text where the tree ` +
      "carries its `new`, and BOTH anchor counts on this step's own line",
    why:
      "T-295 criterion 2: a correction assigned by a verdict is the block's own `old` text, and " +
      "the drill that follows requires exactly that text to be in the tree. Applying it here, " +
      "before every regeneration, is what keeps a generated file describing the corrected " +
      "source. T-295-s9 criterion 3: the step counts both anchors in the file as it will be " +
      "committed and prints the two counts, so an ambiguous anchor is a refusal a seat reads " +
      "before the drill rather than a line of verified code rewritten at a site nobody named",
    run: null,
  }));
}

/**
 * THE RE-DRILL'S SCOPE — THE FIX DIFF, THROUGH THE OWNING-SPEC RULE, AND
 * IT IS NARROW BY DEFAULT BECAUSE THE WIDE ONE WAS MEASURED.
 *
 * The scope is derived from the FIX DIFF — the files the corrections
 * just wrote — through `gate-run.mjs`'s `deriveOwning`, the same rule
 * `--owning` grades a lane's range with. Nothing here is typed.
 *
 * **WHAT THE DERIVATION IS FOR, BY DEFAULT, IS THE CHECK AND NOT THE
 * RUN.** A block's `spec` should be one the fix diff OWNS: the body that
 * pins a correction is expected to reach the source the correction
 * changed. When it does not, that is worth saying — and saying it costs
 * nothing, while running the whole owning set costs minutes. Measured on
 * this card's own fixture: a correction to one script under `tools/e2e`
 * was owned by THIRTEEN e2e spec files, and one block's drill over that
 * set had not finished after eight minutes — against a ritual whose
 * whole target is about five.
 *
 * So the default run is the block's own spec, which is what the seat's
 * hand ritual did, with the ownership stated as a reading beside it.
 * `wide` takes the whole owning set instead: that is the stronger claim
 * — "RED ALONE" over every body the corrected source can reach rather
 * than over one spec — and it is the guarded profile's, priced at the
 * figure above.
 *
 * @param {{ block: MutantBlock, fixed: readonly string[], wide?: boolean, owning?: (paths: string[]) => string[] }} input
 * @returns {{ specs: string[], owned: string[], ownsTheBlock: boolean }}
 */
export function drillScope(input) {
  const { block } = input;
  const fixed = [...input.fixed];
  /** @type {string[]} */
  let owned = [];
  if (fixed.length > 0 && input.owning !== undefined) {
    try {
      owned = input.owning(fixed);
    } catch {
      // A SCOPE THAT COULD NOT BE DERIVED IS THE BLOCK'S OWN SPEC, never
      // a silently wider or narrower run. The derivation walks a graph
      // and can fail on a tree mid-merge; failing back to the spec the
      // block names keeps the drill a drill.
      owned = [];
    }
  }
  /** @type {string[]} */
  const specs = [block.spec];
  if (input.wide === true) for (const s of owned) if (!specs.includes(s)) specs.push(s);
  return { specs, owned, ownsTheBlock: owned.includes(block.spec) };
}

// ── THE CONFLICTS (T-295) ────────────────────────────────────────────

/**
 * THE THREE ANSWERS A CONFLICTED PATH GETS, and there is no fourth.
 *
 * `card` — the merge's own card, both sides of which are the same card
 * with two different stamps. The lane's copy is the one that carries the
 * verdict and the lane's own notes, so it wins; the stamp step then
 * writes `done` over whichever status it carries.
 *
 * `append` — a file both sides APPENDED to at its end. Two lanes adding
 * a body to the end of a shared spec is the commonest conflict on this
 * board and it was resolved by hand at two merges: keep both sides, in
 * lane order, and restore the closing the second side's marker ate.
 *
 * `fence` — everything else. Two lanes writing the same lines of the
 * same file is a FENCE failure: the fences were not disjoint and no
 * merge may paper over that. The verb names it and stops.
 */
export const CONFLICT_KINDS = Object.freeze(["card", "append", "fence"]);

/** The markers git leaves in a conflicted working file. */
const OURS_MARK = /^<{7}(?: |$)/;
const BASE_MARK = /^\|{7}(?: |$)/;
const THEIRS_MARK = /^={7}$/;
const END_MARK = /^>{7}(?: |$)/;

/**
 * CLASSIFY ONE CONFLICTED PATH.
 *
 * The card arm is a PATH question and is answered first, because a card
 * conflicted at its end would otherwise read as an append.
 *
 * @param {{ path: string, id: string, text: string }} input
 * @returns {{ kind: "card" | "append" | "fence", why: string }}
 */
export function classifyConflict(input) {
  const { path: rel, id, text } = input;
  const mine = new RegExp(`^docs/tasks/${id}(?:-|\\.)`).test(rel);
  const suggested = new RegExp(`^docs/tasks/${id}-s\\d`).test(rel);
  if (mine && !suggested) {
    return {
      kind: "card",
      why:
        `${rel} is ${id}'s OWN card and both sides stamped it. The lane's copy carries the ` +
        "verdict and the implementation notes, so it is the one taken",
    };
  }
  const hunks = conflictHunks(text);
  const one = hunks[0];
  if (hunks.length === 1 && one !== undefined && one.atEnd) {
    // AN APPEND IS A CLAIM ABOUT THE MERGE BASE, NOT ABOUT THE END OF A
    // FILE, and the two came apart on a fixture the first time this was
    // run: a one-line file that BOTH sides rewrote is also one hunk at
    // the end, and a resolver that kept both sides there would silently
    // concatenate two rewrites of the same line. So the base section
    // decides: both sides ADDED where the base had nothing, or this is
    // not an append. The section is only there under `--conflict=diff3`,
    // which is what the runner re-materialises the file with; a file
    // carrying no base section is refused rather than guessed at.
    if (!one.hasBase) {
      return {
        kind: "fence",
        why:
          `${rel} is conflicted in one hunk at its end, but its conflict carries NO merge-base ` +
          "section, so whether both sides ADDED there or both REWROTE the same lines cannot be " +
          "told apart. Re-materialise it with --conflict=diff3, or rule it by hand",
      };
    }
    if (one.base.every((l) => l.trim().length === 0)) {
      return {
        kind: "append",
        why:
          `${rel} is conflicted in ONE hunk at its END whose MERGE BASE is empty — both sides ` +
          "only ADDED there, which is the shape two lanes appending a body to a shared spec " +
          "make. Both sides are kept, in lane order, and the closing the second marker ate is " +
          "restored",
      };
    }
    return {
      kind: "fence",
      why:
        `${rel} is conflicted in one hunk at its end and its merge base is NOT empty — both ` +
        `sides REWROTE ${String(one.base.length)} line(s) that were already there. That is two ` +
        "lanes writing the same lines of one file, so the fences were not disjoint",
    };
  }
  return {
    kind: "fence",
    why:
      `${rel} is conflicted in ${String(hunks.length)} hunk(s) that are not a single end-of-file ` +
      "append, which means two lanes wrote the same lines of one file. That is a FENCE finding — " +
      "the fences were not disjoint — and no merge may resolve it on their behalf",
  };
}

/**
 * THE CONFLICT HUNKS IN ONE FILE, with the one fact the append arm needs:
 * whether the hunk closes the file.
 *
 * @param {string} text
 * @returns {{ ours: string[], theirs: string[], base: string[], hasBase: boolean, start: number, end: number, atEnd: boolean }[]}
 */
export function conflictHunks(text) {
  const lines = text.split("\n");
  /** @type {{ ours: string[], theirs: string[], base: string[], hasBase: boolean, start: number, end: number, atEnd: boolean }[]} */
  const hunks = [];
  for (let i = 0; i < lines.length; i += 1) {
    if (!OURS_MARK.test(lines[i] ?? "")) continue;
    /** @type {string[]} */
    const ours = [];
    /** @type {string[]} */
    const theirs = [];
    /** @type {string[]} */
    const base = [];
    let hasBase = false;
    /** @type {"ours" | "base" | "theirs"} */
    let side = "ours";
    let end = -1;
    for (let j = i + 1; j < lines.length; j += 1) {
      const line = /** @type {string} */ (lines[j] ?? "");
      if (BASE_MARK.test(line)) {
        side = "base";
        hasBase = true;
        continue;
      }
      if (THEIRS_MARK.test(line)) {
        side = "theirs";
        continue;
      }
      if (END_MARK.test(line)) {
        end = j;
        break;
      }
      if (side === "ours") ours.push(line);
      else if (side === "base") base.push(line);
      else if (side === "theirs") theirs.push(line);
    }
    if (end === -1) break;
    // AT THE END means nothing but blank lines follow the closing
    // marker. A trailing newline leaves one empty string behind, which
    // is a file that ends properly and not content.
    const rest = lines.slice(end + 1);
    hunks.push({ ours, theirs, base, hasBase, start: i, end, atEnd: rest.every((l) => l.trim().length === 0) });
    i = end;
  }
  return hunks;
}

/**
 * KEEP BOTH SIDES OF AN END-OF-FILE APPEND, AND RESTORE THE CLOSING.
 *
 * The measured shape, twice by hand: two lanes each append a body to the
 * end of a shared spec, and git's conflict eats the file's closing
 * newline into the second side's marker line. Keeping both sides in lane
 * order — ours, then theirs — and restoring exactly one trailing newline
 * is what the seat did, and it is the only resolution that loses no
 * body.
 *
 * IT REFUSES ANY OTHER SHAPE. Called on a file whose conflict is not one
 * end-of-file append it returns a problem rather than a best effort:
 * this is the ONE conflict the verb resolves, and a resolver that
 * stretched would be resolving the fence findings the card says it must
 * never touch.
 *
 * @param {string} text
 * @returns {{ text: string } | { problem: string }}
 */
export function resolveAppendConflict(text) {
  const hunks = conflictHunks(text);
  const one = hunks[0];
  if (hunks.length !== 1 || one === undefined) {
    return {
      problem:
        `an end-of-file append is ONE conflicted hunk and this file has ${String(hunks.length)} — ` +
        "nothing was written",
    };
  }
  if (!one.atEnd) {
    return { problem: "the conflicted hunk does not close the file, so it is not an append" };
  }
  if (!one.hasBase || one.base.some((l) => l.trim().length > 0)) {
    return {
      problem:
        "the conflicted hunk's MERGE BASE is absent or not empty, so both sides did not merely " +
        "add at the end — nothing was written",
    };
  }
  const lines = text.split("\n");
  const kept = [
    ...lines.slice(0, one.start),
    ...one.ours,
    ...one.theirs,
  ];
  // THE CLOSING, RESTORED: exactly one trailing newline and no blank
  // line before it. `join` puts the newlines between the lines, so the
  // final empty string is the file's own closing.
  while (kept.length > 0 && (kept[kept.length - 1] ?? "").trim().length === 0) kept.pop();
  kept.push("");
  return { text: kept.join("\n") };
}

// ── THE FENCE WIDENING (T-281-s10, absorbed by T-295) ────────────────

/**
 * THE SPECS A VERDICT'S OWN BLOCKS NAME.
 *
 * T-281's grammar has the verifier commit each correction's body "in the
 * spec file the property lives in". For a lane whose fence is method
 * text that spec is outside the fence BY CONSTRUCTION — the pins on
 * `executor.md` live in `brief.spec.ts`, which reads it — so T-283's
 * merge carried four such bodies and the landing gate refused the push.
 *
 * @param {string} verdictText
 * @returns {string[]} distinct spec paths, in the order the blocks name them
 */
export function verdictSpecs(verdictText) {
  const read = readMutantBlocks(verdictText);
  if ("problem" in read) return [];
  /** @type {string[]} */
  const specs = [];
  for (const b of read.blocks) if (!specs.includes(b.spec)) specs.push(b.spec);
  return specs;
}

/**
 * THE `touches:` LINE, WIDENED BY THE PATHS A VERDICT OWES.
 *
 * PURE, and it writes the fence in the card's own spelling: the flow
 * sequence `[a, b, c]` the whole board uses. A path already inside the
 * fence is not added twice — the comparison is on the literal entry,
 * because a token that RESOLVES to the same domain is the fence
 * expander's question and not this one's.
 *
 * @param {{ text: string, specs: readonly string[] }} input
 * @returns {{ text: string, added: string[] } | { problem: string }}
 */
export function widenTouches(input) {
  const line = /^touches:[ \t]*\[(.*)\][ \t]*$/m.exec(input.text);
  if (line === null) {
    return {
      problem:
        "the card carries no single-line `touches: [...]` fence this widening can extend — a " +
        "fence written some other way is the seat's to widen, and this step refuses rather than " +
        "rewriting a line it cannot read",
    };
  }
  const present = /** @type {string} */ (line[1])
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
  const added = input.specs.filter((s) => !present.includes(s));
  if (added.length === 0) return { text: input.text, added: [] };
  const widened = `touches: [${[...present, ...added].join(", ")}]`;
  return { text: input.text.replace(line[0], widened), added };
}

// ── THE CHEAP KEEPERS (T-295 criterion 4) ────────────────────────────

/**
 * THE SHORTEST CHANGED LINE THE PINNED-SENTENCE KEEPER WILL JUDGE.
 *
 * A keeper over every removed line would match on `}`, on a blank
 * comment marker and on every list bullet a spec happens to quote, and a
 * keeper that cries at every merge is one nobody reads by the third one.
 * Thirty characters is the shortest line in this repository's own specs
 * that is pinned as a SENTENCE rather than as a token — measured by
 * eye over the verbatim strings `brief.spec.ts` and `cli.spec.ts` assert
 * against method and docs text.
 */
export const PINNED_SENTENCE_FLOOR = 30;

/**
 * A CHANGED LINE UNDER method/ OR docs/ THAT A SPEC PINS VERBATIM.
 *
 * THE MEASURED FAULT, at the T-285 merge: the seat reworded a clause in
 * `TASK-FORMAT.md` while applying an assigned correction, and the
 * rewording broke a sentence a lane's body asserted verbatim. Nothing in
 * the ritual looked, and the spec that owned it was not in the merge's
 * owed set. The remedy is the cheapest possible one — grep the specs by
 * the text that is going AWAY.
 *
 * IT JUDGES REMOVALS, NOT ADDITIONS, and that is the whole rule: a line
 * a spec pins is safe while it is in the tree and unsafe the moment it
 * leaves. An addition cannot break a verbatim pin.
 *
 * @param {{ removed: readonly { path: string, line: string }[], specs: ReadonlyMap<string, string>, floor?: number }} input
 * @returns {string[]} one finding per pinned line, naming the line and the spec
 */
export function pinnedSentenceFindings(input) {
  const floor = input.floor ?? PINNED_SENTENCE_FLOOR;
  /** @type {string[]} */
  const findings = [];
  for (const entry of input.removed) {
    if (!/^(?:method|docs)\//.test(entry.path)) continue;
    const text = entry.line.trim();
    if (text.length < floor) continue;
    for (const [spec, body] of input.specs) {
      if (!body.includes(text)) continue;
      findings.push(
        `${entry.path}: a line this merge REMOVES is pinned VERBATIM by ${spec} — ` +
          `${JSON.stringify(text.length > 120 ? `${text.slice(0, 117)}...` : text)}. ` +
          "Restore the sentence or move the pin; a merge that lands this reds that body",
      );
      break;
    }
  }
  return findings;
}

/**
 * THE SPELLINGS NO DIFF MAY CARRY, as SHAPES rather than as a word list.
 *
 * Four classes, and every one of them is a thing that has reached a
 * tracked file on some project: a credential, an address, the seat's own
 * home directory, and the identifier ADR-022 retired. The fifth input —
 * a personal name — is DERIVED BY THE CALLER from this machine's own
 * git identity and account rather than typed here, because a name list
 * in a repository is itself the leak.
 */
export const SECRET_SHAPES = Object.freeze([
  { id: "private-key", re: /-{5}BEGIN [A-Z ]*PRIVATE KEY-{5}/, why: "a private key block" },
  { id: "aws-key", re: /\bAKIA[0-9A-Z]{16}\b/, why: "an AWS access key id" },
  { id: "token-sk", re: /\bsk-[A-Za-z0-9_-]{20,}\b/, why: "a bearer token in the `sk-` shape" },
  { id: "token-gh", re: /\bgh[pousr]_[A-Za-z0-9]{20,}\b/, why: "a forge token in the `gh*_` shape" },
]);

/** An address, narrow enough that this board's `model@kind` seats are not one. */
export const EMAIL_SHAPE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}\b/;

/**
 * A FORBIDDEN SPELLING IN THE LINES A MERGE ADDS.
 *
 * ADDITIONS ONLY, for the mirror of the reason the keeper above judges
 * removals only: a secret is a thing that ARRIVES, and judging the whole
 * tree would refuse every merge for whatever the tree already carries.
 *
 * The rename class is `rename-scan.mjs`'s own — its classifier, not a
 * second copy of the pattern — so a spelling that file learns to allow
 * is allowed here on the same day. **The classifier is what makes this
 * usable at all**: the retired identifier survives in quoted human
 * sentences and in historical records, and a keeper that could not tell
 * those from a fresh one would have to be turned off.
 *
 * @param {{ added: readonly { path: string, line: string }[], home?: string, names?: readonly string[], classify?: (line: string, file: string) => { kept: boolean } | null }} input
 * @returns {string[]}
 */
export function forbiddenSpellingFindings(input) {
  /** @type {Map<string, string>} */
  const findings = new Map();
  const home = (input.home ?? "").trim();
  const names = (input.names ?? []).filter((n) => n.trim().length > 2);
  /**
   * ONE FINDING PER FILE PER CLASS, never one per line. A merge that
   * adds forty lines carrying a home path is ONE thing to fix in one
   * file, and forty copies of the same sentence is a refusal a seat
   * scrolls past — which is the same failure mode as a keeper nobody
   * turned on. The key is what makes it one.
   *
   * @param {string} rel @param {string} id @param {string} text
   */
  const found = (rel, id, text) => {
    if (!findings.has(`${rel}:${id}`)) findings.set(`${rel}:${id}`, text);
  };
  for (const entry of input.added) {
    const { path: rel, line } = entry;
    for (const shape of SECRET_SHAPES) {
      if (shape.re.test(line)) {
        found(
          rel,
          shape.id,
          `${rel}: this merge ADDS a line matching ${shape.why} (${shape.id}). A credential in a ` +
            "tracked file is a credential published; rotate it and take the line out",
        );
      }
    }
    if (EMAIL_SHAPE.test(line)) {
      found(
        rel,
        "email",
        `${rel}: this merge ADDS a line carrying an email address. An address in a tracked ` +
          "file is an address published, and this refusal does not repeat the one it found",
      );
    }
    if (home.length > 0 && line.includes(home)) {
      found(
        rel,
        "home",
        `${rel}: this merge ADDS a line carrying THIS MACHINE'S OWN home directory. A home path ` +
          "is a fact about one seat's disk and it names its owner; spell the path from the " +
          "repository root, or derive it",
      );
    }
    for (const name of names) {
      if (new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(line)) {
        found(
          rel,
          `name:${name}`,
          `${rel}: this merge ADDS a line carrying the seat's own account or git name. A ` +
            "personal name reaches a tracked file by accident far more often than on purpose, " +
            "and this refusal does not repeat the one it found",
        );
      }
    }
    if (input.classify !== undefined) {
      const verdict = input.classify(line, rel);
      if (verdict !== null && !verdict.kept) {
        found(
          rel,
          "rename",
          `${rel}: this merge ADDS a line spelling the identifier ADR-022 retired, in a place ` +
            "the rename scanner's own classifier does not keep. The keeper scans comments too — " +
            "one reached a merge that way on 2026-09-10",
        );
      }
    }
  }
  return [...findings.values()];
}

/**
 * THE XS BOUND, IN CHANGED LINES, AND IT IS A STATED NUMBER.
 *
 * The board's parser knows S, M and L today; XS is the tier T-296 adds,
 * and a bound has to exist before the tier that reads it does or the
 * tier arrives with nothing to enforce. FORTY CHANGED LINES — additions
 * plus removals over the merge's whole diff, the card's own file
 * excluded because a card's prose is not the work.
 *
 * Why forty: the smallest merges of 2026-09-09 and 2026-09-10 that a
 * seat would have called XS on sight — a single guard, a single clause,
 * a single new keeper line with its body — each landed between eleven
 * and thirty-four changed lines. Forty is the first round number above
 * all of them, and it is a number to be MOVED by measurement rather than
 * defended: the tier work owns it from here.
 */
export const XS_CHANGED_LINE_BOUND = 40;

/**
 * The tier this file falls back to when nothing else says one, and the
 * tier a bumped card is merged and recorded as. **THAT THEY ARE THE SAME
 * WORD IS NOT A COINCIDENCE**: standard is the floor for any card that
 * takes a verifier at all, so it is both the safe default and the only
 * place a bump can land — bumping to `guarded` would buy a whole bench at
 * the last step of a lane that has already been verified.
 */
export const DEFAULT_TIER = "standard";

/** The tier a bumped card is merged and recorded as. */
export const BUMPED_TIER = DEFAULT_TIER;

/**
 * THE BUMP, AND IT REPLACES A REFUSAL BY NAME (T-296, ADR-024 decision 1).
 *
 * T-295 wrote this as `xsBoundFinding`, a finding that STOPPED the merge,
 * and that was the right shape while the tiers did not exist: the bound
 * had to exist before the tier that reads it, and a bound with nothing to
 * do about a breach can only refuse. Now that the tiers do exist, the
 * subject of this keeper is a MIS-SIZING and not a defect — the card was
 * classified `bounded` before the work existed, the work turned out
 * bigger, and nothing about the merged tree is wrong. So the step passes,
 * the printed line says the card is bumped, and the reading appended to
 * the bands carries the bumped tier. A merge that refused here would stop
 * a finished lane at its last step to report a fact for the NEXT triage.
 *
 * WHAT DOES NOT CHANGE: a card of any other size is still not this
 * keeper's to judge, the bound is still forty changed lines outside the
 * card's own file, and the bound is still a number to be moved by
 * measurement.
 *
 * @param {{ size: string, changed: number, bound?: number }} input
 * @returns {string | null} the bump notice, or null where nothing is bumped
 */
export function xsBoundBump(input) {
  const bound = input.bound ?? XS_CHANGED_LINE_BOUND;
  if (input.size.trim().toUpperCase() !== "XS") return null;
  if (input.changed <= bound) return null;
  return (
    `this card declares size XS and the merge changes ${String(input.changed)} line(s), over the ` +
    `XS bound of ${String(bound)} — so it is BUMPED to ${BUMPED_TIER} for this merge, and the ` +
    "reading appended to the bands carries that tier rather than the one the dispatch stamped. " +
    "The card was mis-sized, which is a fact for the next triage"
  );
}

// ── THE COUNTS (2d6d354's class, T-295 criterion 5) ──────────────────

/** The legs this board grades, as a merge message and a verdict spell them. */
export const LEGS = Object.freeze(["parser", "app", "rust", "e2e"]);

/**
 * THE COUNTS A VERDICT CLAIMS, off its own sentences.
 *
 * `parser 389 / app 1171 / rust 655 exit 0 and e2e 852` is how the
 * verdicts on this board write them, so the grammar is a leg name and
 * the nearest number after it, and a `N passed` beside a leg is read the
 * same way. Nothing is inferred from a leg the verdict does not mention.
 *
 * @param {string} text
 * @returns {Record<string, number>}
 */
export function claimedCounts(text) {
  /** @type {Record<string, number>} */
  const counts = {};
  for (const leg of LEGS) {
    const re = new RegExp(`\\b${leg}\\b[^\\dA-Za-z]{0,4}(\\d{2,6})\\b`, "i");
    const hit = re.exec(text);
    if (hit === null) continue;
    counts[leg] = Number(hit[1]);
  }
  return counts;
}

/**
 * THE COUNT A RUN PRINTED, in either dialect this repository runs.
 *
 * READ THE COUNT AS WELL AS THE EXIT: an exit 0 over zero bodies is not
 * a pass, and a script that committed on an exit alone landed `2d6d354`
 * red. This is the reading that makes the guard below possible.
 *
 * @param {string} output
 * @returns {{ passed: number, failed: number } | null}
 */
export function runCounts(output) {
  // THE ESCAPE IS SPELLED, NEVER TYPED, for the reason failingBodies
  // above gives: a literal U+001B in tracked text is a CONTROL
  // violation the token lint reds by byte offset, and this line was
  // exactly that on its first write.
  const clean = output.replace(/\u001b\[[0-9;]*m/g, "");
  const passed = /(\d+)\s+passed/i.exec(clean);
  const failed = /(\d+)\s+failed/i.exec(clean);
  if (passed === null && failed === null) return null;
  return { passed: passed === null ? 0 : Number(passed[1]), failed: failed === null ? 0 : Number(failed[1]) };
}

/**
 * GRADE THE COUNTS THIS RUN READ AGAINST THE COUNTS THE VERDICT CLAIMS.
 *
 * THE REFUSAL IS THE POINT. `2d6d354` was a merge script that committed
 * on an exit code while the count underneath it had moved, and main went
 * red for it. A leg the verdict does not claim is NOT judged and says
 * so; a leg this run produced no count for is not judged either. Three
 * answers, never two.
 *
 * @param {{ claimed: Record<string, number>, observed: Record<string, number> }} input
 * @returns {{ findings: string[], judged: string[], unjudged: string[] }}
 */
export function gradeCounts(input) {
  /** @type {string[]} */
  const findings = [];
  /** @type {string[]} */
  const judged = [];
  /** @type {string[]} */
  const unjudged = [];
  for (const leg of LEGS) {
    const claim = input.claimed[leg];
    const seen = input.observed[leg];
    if (claim === undefined && seen === undefined) continue;
    if (claim === undefined) {
      unjudged.push(`${leg}: this run read ${String(seen)} and the verdict claims no count for it`);
      continue;
    }
    if (seen === undefined) {
      unjudged.push(`${leg}: the verdict claims ${String(claim)} and this run produced no count`);
      continue;
    }
    if (seen === claim) {
      judged.push(`${leg}: ${String(seen)}, the count the verdict claims`);
      continue;
    }
    findings.push(
      `${leg}: THE COUNT MOVED — the verdict claims ${String(claim)} and this merge's own run ` +
        `read ${String(seen)}. A merge that commits on an exit code while the count under it ` +
        "moved is 2d6d354, which landed main red",
    );
  }
  return { findings, judged, unjudged };
}

// ── THE METHOD BUMP (T-295 criterion 3) ──────────────────────────────

/**
 * THE THREE FILES THAT CARRY THE METHOD STAMP, each with the anchor its
 * own spelling uses. A bump that moved two of them is a HALF BUMP, and
 * the pin test in `kit.rs` is what reds on one.
 */
export const METHOD_STAMP_FILES = Object.freeze([
  {
    path: "docs/CONVENTIONS.md",
    anchor: (/** @type {string} */ v) => `method/ formats are version-bumped (currently v${v}) and noted here.`,
  },
  { path: "method/interview/plan-interview.md", anchor: (/** @type {string} */ v) => `(v${v};` },
  {
    path: "app/src-tauri/src/agent/kit.rs",
    anchor: (/** @type {string} */ v) => `pub const METHOD_SNAPSHOT_VERSION: &str = "${v}";`,
  },
]);

/** @param {readonly string[]} paths @returns {boolean} */
export function movesMethodText(paths) {
  return paths.some((p) => p === "method" || p.startsWith("method/"));
}

/**
 * THE BUMP AS STEPS, AND IT IS A REFUSAL RATHER THAN A WRITE.
 *
 * The verb does NOT invent the next version. Which number a release
 * takes and what its note says are the seat's ruling — the notes on this
 * board name a release ("the RENAME release", "the STANDING READ
 * release") — and a program that picked one would be filing a release
 * note nobody wrote. So when method text moved and `--bump <version>`
 * was not given, this is one step that STOPS and says what is owed; with
 * a version it is the four graded steps the seat's script performs.
 *
 * WHEN METHOD TEXT DID NOT MOVE THERE IS NO STEP AT ALL, which is the
 * card's second half: the stamp is untouched.
 *
 * @param {{ paths: readonly string[], projectRoot: string, version?: string | undefined, from?: string | undefined }} input
 * @returns {Step[]}
 */
export function bumpSteps(input) {
  if (!movesMethodText(input.paths)) return [];
  const moved = input.paths.filter((p) => p.startsWith("method/"));
  if (input.version === undefined || input.from === undefined) {
    return [
      {
        id: "bump:owed",
        kind: "gate",
        title:
          `THE METHOD STAMP IS OWED — this merge moves ${String(moved.length)} file(s) under ` +
          "method/ and no --bump <from>..<to> was named",
        why:
          "docs/CONVENTIONS.md's method stamp: method/ formats are version-bumped and noted, in " +
          "three files at once. WHICH number the release takes and what its note says are the " +
          "seat's ruling, so this step refuses rather than inventing one. Re-run with " +
          "--bump <old>..<new>, or rule that this merge's method text is not a release",
        problem:
          `method text moved (${moved.slice(0, 4).join(", ")}${moved.length > 4 ? ", ..." : ""}) ` +
          "and the three stamp files were not bumped",
        run: null,
      },
    ];
  }
  const from = input.from;
  const to = input.version;
  /** @type {Step[]} */
  const steps = [
    {
      id: "bump:stamps",
      kind: "regen",
      action: "method-bump",
      bump: { from, to },
      title: `bump the three method stamp files ${from} to ${to}`,
      why:
        "the seat's own bump script, as run at T-264-s3's and T-293's merges: CONVENTIONS' " +
        "`currently v<x>` line, plan-interview.md's `(v<x>;` and kit.rs's " +
        "METHOD_SNAPSHOT_VERSION, each anchored ONCE and refused where it is not",
      run: null,
    },
    {
      id: "bump:pin",
      kind: "suite",
      title: "the kit pin test on the bumped tree",
      why:
        "the pin test is what says the three stamps agree; a bump whose own test is red is a " +
        "release nobody may make",
      run: {
        command: "cargo",
        argv: ["test", "-q", "--lib", "--", "agent::kit::tests"],
        cwd: path.join(input.projectRoot, "app", "src-tauri"),
      },
    },
    {
      id: "bump:drill",
      kind: "gate",
      action: "half-bump-drill",
      bump: { from, to },
      title: "the HALF-BUMP drill — the const alone moved back must red the pin test by name",
      why:
        "a pin test that is green on a half bump pins nothing. The drill moves kit.rs's const " +
        "back to the old version ALONE, requires the pin test RED, restores the file and proves " +
        "the restore by sha256 — the same shape the mutant drill uses, on the one property a " +
        "bump can silently break",
      run: null,
    },
    {
      id: "bump:evals",
      kind: "gate",
      title: "the METHOD EVAL GATE — method/ moved",
      why:
        "docs/CONVENTIONS.md METHOD EVAL GATE: any merge whose diff touches method/** runs the " +
        "model-free evals, and this merge does",
      run: {
        command: process.execPath,
        argv: [path.join(input.projectRoot, "tools", "method-evals", "run.mjs")],
        cwd: input.projectRoot,
      },
    },
  ];
  return steps;
}

/**
 * THE BUMP APPLIED TO ONE FILE'S TEXT — pure, and anchored ONCE.
 *
 * @param {{ text: string, path: string, from: string, to: string }} input
 * @returns {{ text: string } | { problem: string }}
 */
export function bumpOne(input) {
  const entry = METHOD_STAMP_FILES.find((f) => f.path === input.path);
  if (entry === undefined) {
    return { problem: `${input.path} is not one of this project's three method stamp files` };
  }
  const anchor = entry.anchor(input.from);
  const hits = occurrences(input.text, anchor);
  if (hits !== 1) {
    return {
      problem:
        `${input.path}: the stamp anchor ${JSON.stringify(anchor)} matches ${String(hits)} ` +
        "time(s). A stamp that is not in exactly one place cannot be bumped by a program",
    };
  }
  return { text: input.text.replace(anchor, () => entry.anchor(input.to)) };
}

// ── THE MESSAGE (T-295 criterion 5) ──────────────────────────────────

/**
 * THE MERGE MESSAGE, WRITTEN FROM THE VERDICT AND NEVER COMPOSED.
 *
 * Every sentence below comes out of the verdict the merge is acting on,
 * or out of a figure this run measured. NOTHING is written freehand, and
 * that is the criterion rather than a style: a message a seat composes
 * is a summary of what the seat remembers, and the two merges of
 * 2026-09-09 whose messages named a count that had moved were both
 * composed that way.
 *
 * WHAT IT TAKES FROM THE VERDICT: the verdict's own heading (its state
 * and its date), the sentence the verdict opens with, the counts it
 * claims, and the corrections it assigned by name. WHAT IT TAKES FROM
 * THE RUN: the lane branch, the bench tip, the path count, and the
 * regenerations that fired.
 *
 * @param {{ id: string, lane: string, benchTip: string, verdictSha: string, verdict: { heading: string, text: string }, paths: readonly string[], corrections: readonly string[], regenerated: readonly string[], counts: Record<string, number> }} input
 * @returns {string}
 */
export function mergeMessage(input) {
  const state = verdictState(input.verdict.heading);
  const opener = verdictOpener(input.verdict.text);
  const countLine = LEGS.filter((l) => input.counts[l] !== undefined)
    .map((l) => `${l} ${String(input.counts[l])}`)
    .join(" / ");
  const subject =
    `Merge ${input.id} (${state} at ${input.verdictSha.slice(0, 8)}, bench tip ` +
    `${input.benchTip.slice(0, 8)}): ${opener}`;
  /** @type {string[]} */
  const body = [];
  body.push(
    `What landed (lane ${input.lane}, ${String(input.paths.length)} path(s) staged): the verdict's ` +
      `own words above, and nothing this merge composed. Verdict entry: ${input.verdict.heading}`,
  );
  if (input.corrections.length > 0) {
    body.push(
      `The assigned corrections, applied at the merge and re-drilled on the merged tree: ` +
        `${input.corrections.join("; ")}.`,
    );
  } else {
    body.push("The verdict assigns no correction, so none was applied and none was re-drilled.");
  }
  if (input.regenerated.length > 0) {
    body.push(`Regenerated after the corrections: ${input.regenerated.join(", ")}.`);
  }
  if (countLine.length > 0) {
    body.push(`The counts the verdict claims, re-read at this merge: ${countLine}.`);
  }
  return [subject, "", ...body.map((p) => p), ""].join("\n");
}

/** @param {string} heading @returns {string} */
export function verdictState(heading) {
  const hit = /\b(APPROVED(?:\s+WITH\s+ASSIGNED\s+CORRECTIONS?)?|REJECTED|ACCEPTED)\b/i.exec(heading);
  return hit === null ? "verdict" : /** @type {string} */ (hit[1]);
}

/**
 * THE VERDICT'S OWN OPENING SENTENCE — the first line of prose under the
 * entry's heading that is not a heading, a fence, a list marker or a
 * blank. That line is what a verdict on this board leads with, and it is
 * the one sentence a message may take whole.
 *
 * @param {string} verdictText
 * @returns {string}
 */
export function verdictOpener(verdictText) {
  const lines = verdictText.split("\n").slice(1);
  /** @type {string[]} */
  const collected = [];
  let fenced = false;
  for (const raw of lines) {
    const line = raw.trim();
    if (/^`{3,}/.test(line)) {
      fenced = !fenced;
      continue;
    }
    if (fenced) continue;
    if (line.length === 0) {
      if (collected.length > 0) break;
      continue;
    }
    if (/^#{1,6}\s/.test(line) || /^[-*+]\s/.test(line) || /^\|/.test(line)) {
      if (collected.length > 0) break;
      continue;
    }
    collected.push(line);
  }
  const sentence = collected.join(" ").trim();
  if (sentence.length === 0) {
    return "the verdict carries no opening sentence a message may take, and this one invents none";
  }
  const stop = /^(.{40,400}?[.;:])\s/.exec(sentence);
  return stop === null ? sentence : /** @type {string} */ (stop[1]);
}

// ── THE METERS, INTO THE BANDS' READINGS (T-295 criterion 5) ─────────

/**
 * WHERE THE READINGS GO, AND IT IS A RECORD RATHER THAN A DOCUMENT.
 *
 * `docs/checkpoints/` is this project's append-only records directory,
 * and a readings file is exactly that: one line per seat per merge,
 * never rewritten, read at the checkpoint. JSON Lines because the reader
 * is a program (T-297's two bands) and because an append is one write
 * with no parse of what is already there — a merge must not be able to
 * corrupt the history by failing halfway through rewriting it.
 */
export const READINGS_PATH = "docs/checkpoints/meters.jsonl";

/**
 * THE `## Meters` BLOCKS IN A DOCUMENT.
 *
 * Every report and every verdict on this board closes with one, and
 * until now they were read by nobody (T-297's own first sentence). The
 * block runs to the next heading of the same level or to the end.
 *
 * @param {string} text
 * @returns {string[]} the block bodies, without their heading
 */
export function metersBlocks(text) {
  const lines = text.split("\n");
  /** @type {string[]} */
  const blocks = [];
  for (let i = 0; i < lines.length; i += 1) {
    const open = /^(#{1,6})\s+Meters\s*$/i.exec(lines[i] ?? "");
    if (open === null) continue;
    const level = /** @type {string} */ (open[1]).length;
    /** @type {string[]} */
    const body = [];
    for (let j = i + 1; j < lines.length; j += 1) {
      const head = /^(#{1,6})\s+\S/.exec(lines[j] ?? "");
      if (head !== null && /** @type {string} */ (head[1]).length <= level) {
        i = j - 1;
        break;
      }
      body.push(/** @type {string} */ (lines[j] ?? ""));
      i = j;
    }
    const trimmed = body.join("\n").trim();
    if (trimmed.length > 0) blocks.push(trimmed);
  }
  return blocks;
}

/**
 * THE READINGS THIS MERGE APPENDS, one object per seat that wrote a
 * block. The SHAPE, stated here because T-297 is blocked on it:
 *
 *     {"at":"<ISO-8601>","card":"T-295","size":"L","tier":"standard",
 *      "seat":"executor"|"verifier","source":"<relative path or card>",
 *      "merge":"<bench tip sha>","meters":"<the block's own text>"}
 *
 * The block's text is carried WHOLE and not parsed into fields. A meters
 * block is a seat's own prose — wall clock, context consumed, model,
 * seat — and every attempt to normalise it at write time would be this
 * file guessing at a vocabulary the bands have not settled. T-297 owns
 * the parse; this owns the capture, and a capture that loses nothing is
 * the only one a later parser can be written against.
 *
 * @param {{ id: string, size: string, tier: string, merge: string, at: string, sources: readonly { seat: string, source: string, text: string }[] }} input
 * @returns {string[]} JSON Lines, each already newline-free
 */
export function readingsLines(input) {
  /** @type {string[]} */
  const lines = [];
  for (const entry of input.sources) {
    for (const meters of metersBlocks(entry.text)) {
      lines.push(
        JSON.stringify({
          at: input.at,
          card: input.id,
          size: input.size,
          tier: input.tier,
          seat: entry.seat,
          source: entry.source,
          merge: input.merge,
          meters,
        }),
      );
    }
  }
  return lines;
}

/** @returns {string} */
export function usageText() {
  return [
    "usage: supertaskr merge <T-NNN> --slug <slug> --verdict <sha>",
    "                      --built-by <m@k> --verified-by <m@k>",
    "                      [--root <path>] [--branch <name>] [--dry-run]",
    "                      [--blocks-absent <verdict sha>] [--bump <old>..<new>]",
    "                      [--meters <path>]... [--tier <tier>] [--no-widen] [--drill-wide]",
    "                      [--message <path>] [--readings <path>]",
    "",
    "  The integrator's ritual in its order, stopping with the merge STAGED.",
    "  The tail is derived from the merge's own paths: a merge bringing app/ or lib/",
    "  sources reinstalls and rebuilds BEFORE any suite; a merge moving the graph runs",
    "  the dogfood bodies before the commit; and every MUTANT BLOCK on the card's newest",
    "  verdict is re-drilled on the merged tree — planted, run, restored, proved by sha256 —",
    "  with the run STOPPING on a survivor, on a body that reds more than itself, or on an",
    "  anchor that does not match exactly once. A verdict that assigns corrections and",
    "  carries no block for a correction that does not SAY it needs none is REFUSED, naming that",
    "  correction; --blocks-absent naming that verdict's own sha accepts it",
    "  as news instead — it is not a blanket and never stands in for a block: a verdict",
    "  that carries blocks either has them drilled or is stopped, and the flag reaches only",
    "  a verdict that carries none.",
    "  Since T-295 it also widens the card's fence on the integration branch for a",
    "  verdict-named spec outside it (the ONE commit this verb makes, because the landing",
    "  gate reads a merge's fence from its first parent), applies each block's correction",
    "  BEFORE every regeneration — counting BOTH anchors in the file as it will be committed",
    "  and REFUSING, with the two counts on the step's line, any block whose anchors name no",
    "  site or several (T-295-s9) — runs the four cheap keepers as steps with exits, bumps",
    "  the three method stamp files when method text moved, grades the counts its own runs",
    "  read against the counts the verdict claims, writes the merge message FROM the",
    "  verdict's own sentences, and appends every `## Meters` block to the bands' readings.",
    "  IT NEVER PUSHES.",
    "  exit: 0 staged · 1 a step failed · 2 called wrong · 3 could not run",
  ].join("\n");
}

/**
 * @param {string[]} argv
 * @param {{ cwd?: string, out?: (s: string) => void, err?: (s: string) => void, ledger?: { id: string, title: string, exit: number }[] }} [io]
 * @returns {number}
 */
export function main(argv, io = {}) {
  const out = io.out ?? ((/** @type {string} */ s) => process.stdout.write(`${s}\n`));
  const err = io.err ?? ((/** @type {string} */ s) => process.stderr.write(`${s}\n`));
  const cwd = io.cwd ?? process.cwd();

  /** @type {string | undefined} */
  let id;
  /** @type {string | undefined} */
  let slug;
  /** @type {string | undefined} */
  let verdict;
  let root = cwd;
  let branch = DEFAULT_BRANCH;
  let dryRun = false;
  /** @type {string | undefined} */
  let builtBy;
  /** @type {string | undefined} */
  let verifiedBy;
  /** @type {string | undefined} */
  let blocksAbsent;
  /** @type {string | undefined} */
  let bump;
  /** @type {string[]} */
  const meterFiles = [];
  // EMPTY UNTIL SOMETHING SAYS OTHERWISE. `--tier` is the seat's
  // override; absent it the tier is read off the card, where the dispatch
  // derived and stamped it (T-296); absent both it is the default this
  // file has always used, and the step that prints it says which.
  let tier = "";
  /** @type {string | undefined} */
  let messagePath;
  /** @type {string | undefined} */
  let readingsPath;
  let widenAllowed = true;
  let drillWide = false;
  for (let i = 0; i < argv.length; i += 1) {
    const a = /** @type {string} */ (argv[i]);
    if (a === "--help") {
      out(usageText());
      return EXIT.CLEAN;
    }
    if (a === "--dry-run") {
      dryRun = true;
      continue;
    }
    if (a === "--root") {
      root = path.resolve(/** @type {string} */ (argv[++i] ?? cwd));
      continue;
    }
    if (a === "--branch") {
      branch = /** @type {string} */ (argv[++i] ?? DEFAULT_BRANCH);
      continue;
    }
    if (a === "--slug") {
      slug = argv[++i];
      continue;
    }
    if (a === "--verdict") {
      verdict = argv[++i];
      continue;
    }
    if (a === "--blocks-absent") {
      blocksAbsent = argv[++i];
      continue;
    }
    if (a === "--bump") {
      bump = argv[++i];
      continue;
    }
    if (a === "--meters") {
      const file = argv[++i];
      if (file !== undefined) meterFiles.push(path.resolve(cwd, file));
      continue;
    }
    if (a === "--tier") {
      tier = argv[++i] ?? tier;
      continue;
    }
    if (a === "--message") {
      messagePath = argv[++i];
      continue;
    }
    if (a === "--readings") {
      readingsPath = argv[++i];
      continue;
    }
    if (a === "--no-widen") {
      widenAllowed = false;
      continue;
    }
    if (a === "--drill-wide") {
      drillWide = true;
      continue;
    }
    if (a === "--built-by") {
      builtBy = argv[++i];
      continue;
    }
    if (a === "--verified-by") {
      verifiedBy = argv[++i];
      continue;
    }
    if (a.startsWith("-")) {
      err(`merge: unknown flag ${a}.\n${usageText()}`);
      return EXIT.USAGE;
    }
    if (id !== undefined) {
      err(`merge: one card at a time — already given ${id}, then ${a}.\n${usageText()}`);
      return EXIT.USAGE;
    }
    id = a;
  }
  if (id === undefined || slug === undefined || verdict === undefined) {
    err(`merge: a card, its --slug and its --verdict sha are all required.\n${usageText()}`);
    return EXIT.USAGE;
  }
  if (!dryRun && (builtBy === undefined || verifiedBy === undefined)) {
    err(
      "merge: --built-by and --verified-by are required for a real run — the stamp writes them " +
        `into the card, and a stamp with an empty seat is a record nobody can read.\n${usageText()}`,
    );
    return EXIT.USAGE;
  }

  const card = cardFile(id, path.join(root, "docs", "tasks"));
  if ("problem" in card) {
    err(`merge ${id}: CANNOT RUN — ${card.problem}`);
    return EXIT.CANNOT_RUN;
  }
  const lane = `task/${id}-${slug}`;
  const resolved = git(root, ["rev-parse", `${verdict}^{commit}`]);
  if (!resolved.ok) {
    err(`merge ${id}: CANNOT RUN — --verdict ${verdict} does not resolve (${resolved.err})`);
    return EXIT.CANNOT_RUN;
  }
  const verdictSha = resolved.out.trim();
  const worktree = laneWorktree(root, lane);

  // THE PROCESS SETTINGS, READ ONCE AND BEFORE ANY STEP IS PLANNED
  // (T-299, ADR-024 decision 6). A combination the schema forbids
  // refuses the whole verb HERE — before a worktree is removed, a branch
  // is moved or a merge is staged — because a merge run under a
  // configuration nobody can satisfy is a merge whose ledger means
  // nothing. A project whose tree carries no schema gets `null` and the
  // plan below is the one this verb built before the switches existed.
  /** @type {ProcessSettings | null} */
  let settings = null;
  try {
    const loaded = loadProcess(root);
    settings = loaded === null ? null : loaded.settings;
    if (loaded !== null) {
      out(
        `  process: profile ${loaded.settings.profile}, ` +
          `${String(loaded.schema.switches.size)} switch(es) read from ${PROCESS_SCHEMA}`,
      );
    }
  } catch (e) {
    err(`merge ${id}: CANNOT RUN — ${e instanceof Error ? e.message : String(e)}`);
    return EXIT.CANNOT_RUN;
  }

  /** @type {{ from: string, to: string } | undefined} */
  let bumpMove;
  if (bump !== undefined) {
    const move = /^(\d+\.\d+\.\d+)\.\.(\d+\.\d+\.\d+)$/.exec(bump);
    if (move === null) {
      err(
        `merge ${id}: --bump is spelled <old>..<new>, both as three-part versions — ${bump} is ` +
          "not. The verb refuses to guess which number a release takes",
      );
      return EXIT.USAGE;
    }
    bumpMove = { from: /** @type {string} */ (move[1]), to: /** @type {string} */ (move[2]) };
  }

  // THE VERDICT IS READ AT THE BENCH TIP, BEFORE THE MERGE, because the
  // widening has to be committed on the integration branch AHEAD of the
  // merge and the integration branch's own copy of the card has no
  // verdict on it yet. After the merge the verdict is re-read off the
  // merged tree, which is the copy every later step acts on.
  const atTip = git(root, ["show", `${verdictSha}:${card.file}`]);
  /** @type {{ heading: string, text: string } | undefined} */
  let tipVerdict;
  if (atTip.ok) {
    const read = newestVerdict(atTip.out);
    if (!("problem" in read)) tipVerdict = read;
  }
  /** @type {MergeState} */
  const state = {
    fixed: [],
    corrections: [],
    regenerated: [],
    observed: {},
    claimed: tipVerdict === undefined ? {} : claimedCounts(tipVerdict.text),
    widen: [],
    shas: {},
  };
  if (widenAllowed && tipVerdict !== undefined) {
    const onMain = readCard(root, card.file);
    const specs = verdictSpecs(tipVerdict.text);
    if (onMain !== undefined && specs.length > 0) {
      const tried = widenTouches({ text: onMain, specs });
      if (!("problem" in tried)) state.widen = tried.added;
    }
  }

  const prelude = preludePlan({
    projectRoot: root,
    id,
    branch,
    lane,
    verdict: verdictSha,
    worktree,
    widen: state.widen,
  });
  out(`merge ${id}  (${card.file})`);
  out(`  lane ${lane} · verdict ${verdictSha.slice(0, 12)} · onto ${branch}`);
  for (const step of prelude) printStep(out, step);

  if (dryRun) {
    // The tail is a function of the STAGED paths, which do not exist until the
    // merge has run. Under --dry-run it is derived from what the lane would
    // bring instead, and SAID to be that, rather than quietly using a
    // different range than the real run will.
    const diff = git(root, ["diff", "--name-only", `${branch}...${verdictSha}`]);
    const paths = diff.ok ? diff.out.split("\n").filter((l) => l.length > 0) : [];
    out(
      `  --dry-run: the tail below is derived from \`git diff --name-only ${branch}...` +
        `${verdictSha.slice(0, 12)}\` (${String(paths.length)} path(s)); a real run derives it ` +
        "from the STAGED merge.",
    );
    const dryCard = atTip.ok ? atTip.out : readCard(root, card.file);
    const dryRead = tipVerdict === undefined ? { blocks: [] } : readMutantBlocks(tipVerdict.text);
    for (const step of tailPlan({
      paths,
      projectRoot: root,
      id,
      cardText: dryCard,
      verdictSha,
      blocksAbsent,
      card: card.file,
      blocks: "problem" in dryRead ? [] : dryRead.blocks,
      ...(bumpMove === undefined ? {} : { bumpFrom: bumpMove.from, bumpTo: bumpMove.to }),
      ...(settings === null ? {} : { process: settings }),
    })) {
      printStep(out, step);
    }
    out("  --dry-run, nothing was run.");
    return EXIT.CLEAN;
  }

  /** @type {{ id: string, title: string, exit: number }[]} */
  const ledger = io.ledger ?? [];
  const stepIo = {
    out,
    err,
    projectRoot: root,
    id,
    card: card.file,
    builtBy: builtBy ?? "",
    verifiedBy: verifiedBy ?? "",
    state,
    verdictSha,
    lane,
    benchTip: verdictSha,
    tier: tier !== "" ? tier : cardTier(readCard(root, card.file) ?? "") || DEFAULT_TIER,
    meterFiles,
    drillWide,
    ...(tipVerdict === undefined ? {} : { verdict: tipVerdict }),
    ...(messagePath === undefined ? {} : { messagePath: path.resolve(root, messagePath) }),
    ...(readingsPath === undefined ? {} : { readingsPath: path.resolve(root, readingsPath) }),
  };
  for (const step of prelude) {
    printStep(out, step);
    const code = runStep(step, stepIo);
    ledger.push({ id: step.id, title: step.title, exit: code });
    out(`      exit ${String(code)}`);
    if (code !== 0) {
      err(`merge ${id}: stopped at ${step.id} (exit ${String(code)}).`);
      return EXIT.FOUND;
    }
  }
  const staged = git(root, ["diff", "--cached", "--name-only"]);
  if (!staged.ok) {
    err(`merge ${id}: CANNOT RUN — the staged paths could not be read (${staged.err})`);
    return EXIT.CANNOT_RUN;
  }
  const paths = staged.out.split("\n").filter((l) => l.length > 0);
  out(`  the merge stages ${String(paths.length)} path(s); the tail is derived from them.`);
  // THE MERGED CARD, read here and not before: the verdict the drill
  // steps come off arrives WITH the lane's branch, so a copy read before
  // the merge would be the integration branch's older card.
  const cardText = readCard(root, card.file);
  // THE MERGED TREE'S OWN VERDICT, which is the copy every step below
  // acts on. `tipVerdict` was the same entry read one commit earlier so
  // the widening could be committed ahead of the merge; re-reading here
  // is what keeps the drill and the message anchored on what LANDED.
  const mergedVerdict = cardText === undefined ? { problem: "the merged card could not be read" } : newestVerdict(cardText);
  if (!("problem" in mergedVerdict)) {
    stepIo.verdict = mergedVerdict;
    if (Object.keys(state.claimed).length === 0) state.claimed = claimedCounts(mergedVerdict.text);
  }
  const merged = "problem" in mergedVerdict ? { blocks: [] } : readMutantBlocks(mergedVerdict.text);
  for (const step of tailPlan({
    paths,
    projectRoot: root,
    id,
    cardText,
    verdictSha,
    blocksAbsent,
    card: card.file,
    blocks: "problem" in merged ? [] : merged.blocks,
    ...(bumpMove === undefined ? {} : { bumpFrom: bumpMove.from, bumpTo: bumpMove.to }),
    ...(settings === null ? {} : { process: settings }),
  })) {
    printStep(out, step);
    const code = runStep(step, stepIo);
    ledger.push({ id: step.id, title: step.title, exit: code });
    out(`      exit ${String(code)}`);
    if (code !== 0) {
      err(`merge ${id}: stopped at ${step.id} (exit ${String(code)}). The merge stays staged.`);
      return EXIT.FOUND;
    }
  }
  out("  THE VERB STOPS HERE AND NEVER PUSHES: the merge is staged, the message is written,");
  out("  and the commit, the checkpoint and the push are the seat's.");
  return EXIT.CLEAN;
}

/**
 * A CARD'S TEXT, or `undefined` when it cannot be read.
 *
 * `undefined` is not a shrug: `drillSteps` turns it into a step that
 * REFUSES, so a card the planner could not open stops the merge instead
 * of quietly planning no drill.
 *
 * @param {string} root @param {string} rel @returns {string | undefined}
 */
function readCard(root, rel) {
  const file = path.join(root, rel);
  if (!existsSync(file)) return undefined;
  try {
    return readFileSync(file, "utf8");
  } catch {
    return undefined;
  }
}

/**
 * EVERY DIAL A MERGE NEEDS, DERIVED — nothing here is typed and nothing
 * here is read out of a document's bullet (T-295 ground rule 7).
 *
 * THE MEASURED FAULT: the seat's own `merge-lane.sh` composed the lane
 * worktree path out of the CONVENTIONS bullet's spelling, a lane had
 * been cut at the spelling before a rename, and the script did not find
 * it. Git's worktree administration is the only thing that knows where
 * a worktree actually is, so it is the only thing asked.
 *
 * THE BENCH TIP IS NOT THE VERDICT SHA and this is where that is
 * settled. The verifier commits its correction BODIES on the bench after
 * writing the verdict (`method/roles/verifier.md` step 5b), so a merge
 * given the verdict sha leaves them behind and the re-drill then reports
 * "the named body did not red" over a body that never landed. The bench
 * is a DETACHED worktree beside the lane; its HEAD is what gets merged.
 *
 * @param {{ root: string, id: string }} input
 * @returns {{ slug: string, lane: string, worktree: string | null, benchTip: string, benchWorktree: string | null, builtBy: string, verifiedBy: string, how: string[] } | { problem: string }}
 */
export function mergeDials(input) {
  const { root, id } = input;
  /** @type {string[]} */
  const how = [];
  const branches = git(root, [
    "for-each-ref",
    "--format=%(refname:short)",
    `refs/heads/task/${id}-*`,
  ]);
  if (!branches.ok) return { problem: `the lane branches could not be listed — ${branches.err}` };
  const lanes = branches.out.split("\n").filter((l) => l.length > 0);
  if (lanes.length === 0) {
    return {
      problem:
        `no branch under refs/heads/task/${id}-* exists in this checkout, so there is no lane to ` +
        "merge. A lane is a BRANCH; the board's `status:` is not one",
    };
  }
  if (lanes.length > 1) {
    return {
      problem:
        `${String(lanes.length)} branches match refs/heads/task/${id}-* (${lanes.join(", ")}), so ` +
        "which lane this card means is ambiguous. Name the slug rather than letting a merge pick",
    };
  }
  const lane = /** @type {string} */ (lanes[0]);
  const slug = lane.slice(`task/${id}-`.length);
  how.push(`lane ${lane}, from git for-each-ref refs/heads/task/${id}-*`);
  const worktree = laneWorktree(root, lane);
  how.push(
    worktree === null
      ? "no live worktree is on that branch, from git worktree list --porcelain"
      : `lane worktree ${worktree}, from git worktree list --porcelain — never from a document's bullet`,
  );
  const bench = benchWorktree(root, id);
  let benchTip = "";
  if (bench !== null) {
    benchTip = bench.head;
    how.push(`bench tip ${benchTip.slice(0, 12)}, the HEAD of the detached bench ${bench.path}`);
  } else {
    const tip = git(root, ["rev-parse", lane]);
    if (!tip.ok) return { problem: `${lane} does not resolve — ${tip.err}` };
    benchTip = tip.out.trim();
    how.push(
      `bench tip ${benchTip.slice(0, 12)} — NO detached bench worktree for ${id} is live, so the ` +
        "lane branch's own tip is taken and SAID to be. A verifier that committed correction " +
        "bodies on a bench this checkout cannot see would be left behind by this",
    );
  }
  const file = cardFile(id, path.join(root, "docs", "tasks"));
  if ("problem" in file) return { problem: file.problem };
  const text = readFileSync(path.join(root, file.file), "utf8");
  const builtBy = frontmatterValue(text, "builder");
  const verifiedBy = frontmatterValue(text, "verifier");
  how.push(`built by ${builtBy || "(empty on the card)"} / verified by ${verifiedBy || "(empty on the card)"}, from the card's own fields`);
  return { slug, lane, worktree, benchTip, benchWorktree: bench === null ? null : bench.path, builtBy, verifiedBy, how };
}

/** @param {string} text @param {string} key @returns {string} */
function frontmatterValue(text, key) {
  const hit = new RegExp(`^${key}:[ \\t]*(.*)$`, "m").exec(text);
  return hit === null ? "" : /** @type {string} */ (hit[1]).trim();
}

/**
 * THE DETACHED BENCH BESIDE A LANE, off git's own administration.
 *
 * `docs/STATE.md` spells the bench `../supertaskr-V-<id>` and spells it
 * DETACHED on purpose, so the match is on the directory's own suffix
 * and on the entry carrying no branch — a worktree on a task branch is
 * a lane, never a bench, whatever it is called.
 *
 * @param {string} root @param {string} id
 * @returns {{ path: string, head: string } | null}
 */
export function benchWorktree(root, id) {
  const listed = git(root, ["worktree", "list", "--porcelain"]);
  if (!listed.ok) return null;
  /** @type {{ path: string, head: string, detached: boolean } | null} */
  let current = null;
  /** @type {{ path: string, head: string } | null} */
  let found = null;
  const finish = () => {
    if (current === null || !current.detached) return;
    if (!current.path.endsWith(`-V-${id}`)) return;
    found = { path: current.path, head: current.head };
  };
  for (const line of listed.out.split("\n")) {
    if (line.startsWith("worktree ")) {
      finish();
      current = { path: line.slice("worktree ".length), head: "", detached: false };
      continue;
    }
    if (current === null) continue;
    if (line.startsWith("HEAD ")) current.head = line.slice("HEAD ".length);
    if (line === "detached") current.detached = true;
    if (line.startsWith("branch ")) current.detached = false;
  }
  finish();
  return found;
}

/** @param {string} root @param {string} lane @returns {string | null} */
export function laneWorktree(root, lane) {
  const listed = git(root, ["worktree", "list", "--porcelain"]);
  if (!listed.ok) return null;
  /** @type {string | null} */
  let current = null;
  for (const line of listed.out.split("\n")) {
    if (line.startsWith("worktree ")) current = line.slice("worktree ".length);
    if (line === `branch refs/heads/${lane}`) return current;
  }
  return null;
}

/** @param {(s: string) => void} out @param {Step} step */
function printStep(out, step) {
  out(`  [${step.kind}] ${step.title}`);
  out(`      why: ${step.why}`);
  if (step.run !== null) {
    const env = step.run.env === undefined
      ? ""
      : `${Object.entries(step.run.env).map(([k, v]) => `${k}=${v}`).join(" ")} `;
    out(`      run: ${env}${step.run.command} ${step.run.argv.join(" ")}   (in ${step.run.cwd})`);
  }
}

/**
 * WHAT A MERGE LEARNS AS IT RUNS, and every field of it is a reading
 * this run took rather than a thing anybody typed.
 *
 * @typedef {object} MergeState
 * @property {string[]} fixed       the files the corrections wrote
 * @property {string[]} corrections what each applied correction is called
 * @property {string[]} regenerated which regenerations fired
 * @property {Record<string, number>} observed the counts this run's own suites printed
 * @property {Record<string, number>} claimed  the counts the verdict claims
 * @property {string[]} widen       the verdict-named specs outside the fence
 * @property {Record<string, string>} shas restore proofs, by path
 */

/**
 * The leg a package directory grades under, as the merge messages spell
 * them. A directory outside the four is the empty string rather than a
 * guess — an unattributed count is not a count.
 *
 * @param {string} cwd
 * @returns {string}
 */
export function legForCwd(cwd) {
  const norm = cwd.split(path.sep).join("/");
  if (norm.endsWith("/tools/e2e")) return "e2e";
  if (norm.endsWith("/lib/parser")) return "parser";
  if (norm.endsWith("/app/src-tauri")) return "rust";
  if (norm.endsWith("/app")) return "app";
  return "";
}

/**
 * THE STAGED DIFF AS LINES, which is what three of the four cheap
 * keepers judge. `-U0` because a keeper about lines a merge CHANGES must
 * not be handed the context lines it did not.
 *
 * @param {string} root
 * @returns {{ added: { path: string, line: string }[], removed: { path: string, line: string }[], changed: number, byPath: Record<string, number> }}
 */
export function stagedLines(root) {
  const diff = git(root, ["diff", "--cached", "--no-color", "-U0"]);
  /** @type {{ path: string, line: string }[]} */
  const added = [];
  /** @type {{ path: string, line: string }[]} */
  const removed = [];
  /** @type {Record<string, number>} */
  const byPath = {};
  if (!diff.ok) return { added, removed, changed: 0, byPath };
  let current = "";
  for (const line of diff.out.split("\n")) {
    const head = /^\+\+\+ b\/(.*)$/.exec(line);
    if (head !== null) {
      current = /** @type {string} */ (head[1]);
      continue;
    }
    if (/^(?:diff |index |--- |@@ |new file|deleted file|similarity|rename |old mode|new mode)/.test(line)) {
      continue;
    }
    if (line.startsWith("+")) {
      added.push({ path: current, line: line.slice(1) });
      byPath[current] = (byPath[current] ?? 0) + 1;
    } else if (line.startsWith("-")) {
      removed.push({ path: current, line: line.slice(1) });
      byPath[current] = (byPath[current] ?? 0) + 1;
    }
  }
  return { added, removed, changed: added.length + removed.length, byPath };
}

/**
 * THE SPEC FILES OF THIS PROJECT, read off git rather than off a
 * directory name — `docs/CONVENTIONS.md`'s NEVER TYPE A PATH YOU CAN
 * DERIVE, applied to the corpus the pinned-sentence keeper greps.
 *
 * @param {string} root
 * @returns {Map<string, string>}
 */
export function specCorpus(root) {
  /** @type {Map<string, string>} */
  const corpus = new Map();
  const listed = git(root, ["ls-files"]);
  if (!listed.ok) return corpus;
  for (const rel of listed.out.split("\n")) {
    if (!/\.(?:spec|test)\.(?:ts|tsx)$/.test(rel)) continue;
    try {
      corpus.set(rel, readFileSync(path.join(root, rel), "utf8"));
    } catch {
      // A SPEC THIS RUN CANNOT OPEN IS NOT A SPEC THAT PINS NOTHING; it
      // is simply not in the corpus, and the keeper's own step prints
      // the size of the corpus it grepped so the reader can see it.
    }
  }
  return corpus;
}

/**
 * The card's `size:`, or the empty string when it carries none.
 *
 * @param {string} text
 * @returns {string}
 */
export function cardSize(text) {
  const hit = /^size:[ \t]*(\S+)[ \t]*$/m.exec(text);
  return hit === null ? "" : /** @type {string} */ (hit[1]);
}

/**
 * THE TIER THE DISPATCH STAMPED, off the card's own frontmatter (T-296).
 *
 * The field is DERIVED at the dispatch stamp, so by the time a merge runs
 * the answer is already on the card and nobody should be typing it again.
 * `--tier` stays as the seat's override — a merge of a card cut before
 * the field existed has to say something — and an empty field falls back
 * to the same default this file has always used.
 *
 * @param {string} text
 * @returns {string}
 */
export function cardTier(text) {
  const hit = /^tier:[ \t]*(\S+)[ \t]*$/m.exec(text);
  return hit === null ? "" : /** @type {string} */ (hit[1]);
}

/**
 * @param {Step} step
 * @param {{ out: (s: string) => void, err: (s: string) => void, projectRoot: string, id: string, card: string, builtBy: string, verifiedBy: string, state: MergeState, verdict?: { heading: string, text: string } | undefined, verdictSha?: string | undefined, lane?: string | undefined, benchTip?: string | undefined, messagePath?: string | undefined, readingsPath?: string | undefined, meterFiles?: readonly string[] | undefined, tier?: string | undefined, drillWide?: boolean | undefined }} io
 * @returns {number}
 */
function runStep(step, io) {
  if (step.problem !== undefined && step.action !== "mutant-drill") {
    io.err(`      ${step.problem}`);
    return EXIT.FOUND;
  }
  if (step.run === null && step.action === undefined) {
    io.out(`      (no command — this step is the seat's own work)`);
    return 0;
  }
  /** @type {string} */
  let said = "";
  if (step.run !== null) {
    const graded = step.run.assert === "empty-output";
    const tolerate = step.run.tolerate === true;
    // CAPTURED WHERE THIS RUN HAS TO READ IT, ECHOED EITHER WAY. The
    // counts guard below is a reading over a suite's own output, and an
    // output that went straight to the terminal is an output no guard
    // saw — which is precisely 2d6d354's shape.
    const quiet = step.run.quiet === true;
    // EVERY STEP IS CAPTURED, and the first fixture run is why. A step
    // whose stdio was INHERITED wrote straight past the caller that
    // collects this run's answer — so the docs gate refused, the ledger
    // said `exit 1`, and the gate's own sentence was nowhere in the
    // transcript the seat was handed. A verb whose whole job is to be
    // read cannot have a step that writes somewhere else.
    const r = spawnSync(step.run.command, step.run.argv, {
      cwd: step.run.cwd,
      stdio: "pipe",
      encoding: "utf8",
      ...(step.run.env === undefined ? {} : { env: { ...process.env, ...step.run.env } }),
    });
    if (r.error !== undefined && r.error !== null) {
      io.err(`      ${step.run.command} could not be started — ${r.error.message}`);
      return 3;
    }
    said = `${String(r.stdout ?? "")}${String(r.stderr ?? "")}`;
    if (!graded && !quiet && said.trim().length > 0) io.out(said.replace(/\n$/, ""));
    if (quiet && (r.status ?? 3) !== 0) io.err(said.replace(/\n$/, ""));
    if (quiet && (r.status ?? 3) === 0) {
      io.out(`      it holds, and its ${String(said.split("\n").length)} line(s) are not reprinted here`);
    }
    if (step.kind === "suite") {
      const counts = runCounts(said);
      const leg = legForCwd(step.run.cwd);
      if (counts !== null && leg.length > 0) {
        io.state.observed[leg] = (io.state.observed[leg] ?? 0) + counts.passed;
        io.out(`      counts read: ${leg} ${String(counts.passed)} passed, ${String(counts.failed)} failed`);
      }
    }
    if (graded) {
      const trimmed = said.trim();
      if (trimmed.length > 0) {
        io.err(`      the tree is NOT clean — this step is graded on its output, not its exit:\n${trimmed}`);
        return 1;
      }
    }
    if ((r.status ?? 3) !== 0 && !tolerate) return r.status ?? 3;
  }
  if (step.action === "stamp-done") {
    const file = path.join(io.projectRoot, io.card);
    const before = readFileSync(file, "utf8");
    const after = stampDone({ text: before, builtBy: io.builtBy, verifiedBy: io.verifiedBy });
    if (after === before) {
      io.err(`      ${io.card} carries no \`status:\` this stamp may move — nothing was written`);
      return 1;
    }
    writeFileSync(file, after);
    io.out(`      stamped: ${after.split("\n").filter((l) => /^(status|built_by|verified_by):/.test(l)).join(" | ")}`);
    const added = spawnSync("git", ["-C", io.projectRoot, "add", "--", io.card], { encoding: "utf8" });
    return added.status ?? 3;
  }
  if (step.action === "docs-gate") return docsGateStep(said, io);
  if (step.action === "widen-fence") return widenFenceStep(io);
  if (step.action === "resolve-conflicts") return resolveConflictsStep(io);
  if (step.action === "apply-correction") return applyCorrectionStep(step, io);
  if (step.action === "keeper") return keeperStep(step, io);
  if (step.action === "method-bump") return methodBumpStep(step, io);
  if (step.action === "half-bump-drill") return halfBumpDrillStep(step, io);
  if (step.action === "counts") return countsStep(io);
  if (step.action === "message") return messageStep(io);
  if (step.action === "meters") return metersStep(io);
  if (step.action === "mutant-drill") {
    if (step.problem !== undefined) {
      io.err(`      ${step.problem}`);
      return EXIT.FOUND;
    }
    if (step.warning !== undefined) {
      // NEWS, NEVER SILENCE: this goes to stderr so a seat piping stdout
      // to a record still sees it, and the run continues.
      io.err(`      NEWS — ${step.warning}`);
      return EXIT.CLEAN;
    }
    if (step.block === undefined) {
      // WHICH OF THE TWO REASONS NOTHING WAS DRILLED, at run time and not
      // only on the plan line (T-295-s10): a verdict assigning no
      // correction, or one whose corrections are wording and say so.
      const wording = step.wording ?? [];
      io.out(
        wording.length === 0
          ? "      the newest verdict assigns no correction — nothing to re-drill"
          : `      ${String(wording.length)} correction(s) carry NO block by the verdict's own ` +
            `words and are nothing to drill: ${wording.join(" / ")}`,
      );
      return EXIT.CLEAN;
    }
    const block = step.block;
    const scoped = drillScope({
      block,
      fixed: io.state.fixed,
      wide: io.drillWide === true,
      owning: (paths) => deriveOwning(paths, io.projectRoot).specs,
    });
    // THE OWNERSHIP READING, WHICH COSTS NOTHING AND IS WORTH SAYING. A
    // block whose spec is not owned by what the correction changed is
    // pinning a property the correction did not move — legitimate (a
    // boundary the implementation already kept), and worth a line so the
    // seat can tell the two apart.
    if (io.state.fixed.length > 0 && !scoped.ownsTheBlock) {
      io.out(
        `      NOTE: ${block.spec} is NOT among the ${String(scoped.owned.length)} spec(s) the ` +
          "FIX DIFF owns, so this block pins a property the correction did not move",
      );
    }
    return runMutantDrill({
      block,
      projectRoot: io.projectRoot,
      scope: scoped.specs,
      observe: (e) => {
        const leg = legForCwd(e.cwd);
        if (e.counts !== null && leg.length > 0) {
          io.state.observed[leg] = Math.max(io.state.observed[leg] ?? 0, e.counts.passed);
        }
      },
      out: io.out,
      err: io.err,
    });
  }
  if (step.action === "graph-pins") {
    const graphPath = path.join(io.projectRoot, GRAPH_PATH);
    if (!existsSync(graphPath)) {
      io.err(`      ${GRAPH_PATH} is not in this project, so no pin could be re-derived`);
      return 3;
    }
    /** @type {unknown} */
    let graph;
    try {
      graph = JSON.parse(readFileSync(graphPath, "utf8"));
    } catch (e) {
      io.err(`      ${GRAPH_PATH} did not parse — ${e instanceof Error ? e.message : String(e)}`);
      return 3;
    }
    io.state.regenerated.push("the graph, and the dogfood pins re-derived");
    io.out(`      ${graphPinLine({ graph, id: io.id, at: new Date() })}`);
  }
  return 0;
}

/**
 * THE DOCS GATE'S THREE ANSWERS, TOLD APART BY ITS OWN WORDS.
 *
 * The gate exits 1 both when it FIRES — docs/ paths are code inputs and
 * these suites are owed at the push — and when something is STALE, and
 * only its output says which. Every merge carries at least a card under
 * docs/tasks/, so a step graded on the exit alone would stop every merge
 * this project ever makes, which is how a gate becomes a flag somebody
 * passes by habit.
 *
 * FIRES is NEWS and the owed suites join the message. STALE, or a gate
 * that could not run, STOPS.
 *
 * @param {string} said @param {{ out: (s: string) => void, err: (s: string) => void, state: MergeState }} io
 * @returns {number}
 */
function docsGateStep(said, io) {
  const stale = /\bSTALE\b/.test(said);
  const fires = /docs-gate: FIRES\b/.test(said);
  const cannot = /CANNOT_RUN|could not be started/.test(said);
  if (cannot) {
    io.err("      THE DOCS GATE COULD NOT RUN — a skipped gate is news, never silence");
    return EXIT.CANNOT_RUN;
  }
  if (stale) {
    io.err(
      "      THE DOCS GATE FOUND SOMETHING STALE. That is not a merge this verb may stage past: " +
        "a generated document disagreeing with its source is exactly what the regenerations " +
        "above exist to prevent",
    );
    return EXIT.FOUND;
  }
  if (fires) {
    const owed = said
      .split("\n")
      .filter((l) => /^\s{2}(?:npm |npx |cargo )/.test(l))
      .map((l) => l.trim());
    io.state.regenerated.push(
      `the docs gate FIRES: ${owed.length === 0 ? "the suites it names" : owed.join("; ")} are owed at the push`,
    );
    io.out(
      `      NEWS: the gate FIRES and names ${String(owed.length)} suite(s) this merge owes at ` +
        "the push. That is what it is for, and the run goes on",
    );
    return EXIT.CLEAN;
  }
  io.out("      the gate is clean — no path under docs/ in this merge is a code input");
  return EXIT.CLEAN;
}

/**
 * THE WIDENING, AND IT IS THE ONE COMMIT THIS VERB MAKES.
 *
 * Everything else the verb does is staged and handed back. This is
 * committed because the landing gate reads a merge's fence from its
 * FIRST PARENT, so a widening that rode inside the merge would be
 * invisible to the gate it exists to satisfy (T-281-s10, at T-283's
 * refused push). It is announced as a commit, it names the verdict that
 * owes it, and it happens BEFORE the merge — which is also why it can be
 * a commit at all: the tree is clean, by the step above it.
 *
 * @param {{ out: (s: string) => void, err: (s: string) => void, projectRoot: string, id: string, card: string, state: MergeState, verdictSha?: string | undefined }} io
 * @returns {number}
 */
function widenFenceStep(io) {
  const file = path.join(io.projectRoot, io.card);
  const before = readFileSync(file, "utf8");
  const widened = widenTouches({ text: before, specs: io.state.widen });
  if ("problem" in widened) {
    io.err(`      ${widened.problem}`);
    return EXIT.FOUND;
  }
  if (widened.added.length === 0) {
    io.out("      the fence already covers every verdict-named spec — nothing was written");
    return EXIT.CLEAN;
  }
  writeFileSync(file, widened.text);
  const sha = io.verdictSha === undefined ? "the newest verdict" : io.verdictSha.slice(0, 12);
  const message =
    `${io.id} fence widened for the verifier's correction bodies (${sha}): ` +
    `${widened.added.join(", ")}\n\n` +
    "T-281's grammar has the verifier commit each correction's body in the spec the property " +
    "lives in, which for this lane is outside its own fence. The landing gate reads a merge's " +
    "fence from its FIRST PARENT, so the widening is this commit and not a line inside the " +
    "merge (T-281-s10, absorbed by T-295).\n";
  const added = spawnSync("git", ["-C", io.projectRoot, "add", "--", io.card], { encoding: "utf8" });
  if ((added.status ?? 3) !== 0) {
    io.err("      the widened card could not be staged");
    return EXIT.FOUND;
  }
  const committed = spawnSync("git", ["-C", io.projectRoot, "commit", "-m", message], {
    encoding: "utf8",
  });
  if ((committed.status ?? 3) !== 0) {
    io.err(`      the widening could not be committed — ${String(committed.stderr ?? "").trim()}`);
    return EXIT.FOUND;
  }
  io.out(`      widened and COMMITTED on the integration branch: ${widened.added.join(", ")}`);
  return EXIT.CLEAN;
}

/**
 * THE THREE ANSWERS A CONFLICT GETS, performed.
 *
 * @param {{ out: (s: string) => void, err: (s: string) => void, projectRoot: string, id: string }} io
 * @returns {number}
 */
function resolveConflictsStep(io) {
  const listed = git(io.projectRoot, ["diff", "--name-only", "--diff-filter=U"]);
  if (!listed.ok) {
    io.err(`      the conflicted paths could not be read — ${listed.err}`);
    return EXIT.CANNOT_RUN;
  }
  const conflicted = listed.out.split("\n").filter((l) => l.length > 0);
  if (conflicted.length === 0) {
    io.out("      the merge staged with no conflict");
    return EXIT.CLEAN;
  }
  /** @type {string[]} */
  const fence = [];
  for (const rel of conflicted) {
    const file = path.join(io.projectRoot, rel);
    // RE-MATERIALISED WITH THE MERGE BASE VISIBLE. `merge.conflictStyle`
    // is machine config and its default shows two sides only, and two
    // sides cannot tell an APPEND from two rewrites of the same lines —
    // which is the difference between the one conflict this verb may
    // resolve and the one it must never touch.
    spawnSync("git", ["-C", io.projectRoot, "checkout", "--merge", "--conflict=diff3", "--", rel], {
      encoding: "utf8",
    });
    const text = existsSync(file) ? readFileSync(file, "utf8") : "";
    const kind = classifyConflict({ path: rel, id: io.id, text });
    if (kind.kind === "fence") {
      fence.push(kind.why);
      continue;
    }
    if (kind.kind === "card") {
      const taken = spawnSync("git", ["-C", io.projectRoot, "checkout", "--theirs", "--", rel], {
        encoding: "utf8",
      });
      if ((taken.status ?? 3) !== 0) {
        io.err(`      ${rel}: the lane's copy could not be taken — ${String(taken.stderr ?? "").trim()}`);
        return EXIT.FOUND;
      }
      spawnSync("git", ["-C", io.projectRoot, "add", "--", rel], { encoding: "utf8" });
      io.out(`      ${rel}: took the LANE's copy — ${kind.why}`);
      continue;
    }
    const resolved = resolveAppendConflict(text);
    if ("problem" in resolved) {
      fence.push(`${rel}: ${resolved.problem}`);
      continue;
    }
    writeFileSync(file, resolved.text);
    spawnSync("git", ["-C", io.projectRoot, "add", "--", rel], { encoding: "utf8" });
    io.out(`      ${rel}: kept BOTH sides of the end-of-file append and restored the closing`);
  }
  if (fence.length > 0) {
    io.err(
      `      ${String(fence.length)} CONFLICT(S) THIS VERB WILL NOT RESOLVE — each is a FENCE ` +
        "FINDING, not a merge decision:",
    );
    for (const f of fence) io.err(`        ${f}`);
    io.err(
      "      The merge is left conflicted for the seat to rule. Two lanes writing the same " +
        "lines of one file means the fences were not disjoint, and that is a thing to record " +
        "against the cards rather than a thing to resolve here.",
    );
    return EXIT.FOUND;
  }
  return EXIT.CLEAN;
}

/**
 * @param {Step} step
 * @param {{ out: (s: string) => void, err: (s: string) => void, projectRoot: string, state: MergeState }} io
 * @returns {number}
 */
function applyCorrectionStep(step, io) {
  const block = step.block;
  if (block === undefined) return EXIT.CLEAN;
  const file = path.join(io.projectRoot, block.file);
  if (!existsSync(file)) {
    io.err(`      ${block.correction}: ${block.file} is not in the merged tree`);
    return EXIT.CANNOT_RUN;
  }
  // THE FILE AS IT WILL BE COMMITTED (T-295-s9): the bytes on disk are the
  // subject of both counts because here they ARE the staged content — the
  // verb's own precondition:clean step refuses to merge onto a dirty tree,
  // and every step between there and this one that writes also stages (the
  // body the verdict's correction 2 names asserts exactly that). A commit
  // takes the INDEX, never the working copy; the two agree by construction.
  const source = readFileSync(file, "utf8");
  const decided = correctionFor({ source, block });
  if ("problem" in decided) {
    // NO WRITE HAS HAPPENED AND NONE WILL. The file is byte-identical to
    // what this step found — its PRE-OPERATION state, which is not the
    // bench tip's: at a merge the two may legitimately differ by an
    // authorized integration change (a correction the seat applied by
    // hand, a keeper's redaction), and a refusal that restored the bench
    // tip's bytes would erase it. Whether the file matches the verified
    // content is the seat's separate investigation, never this step's
    // write.
    io.err(`      ${decided.problem}`);
    return EXIT.FOUND;
  }
  if ("already" in decided) {
    io.out(`      ${decided.already}`);
    io.state.corrections.push(`${block.correction} (already in the merged tree)`);
    return EXIT.CLEAN;
  }
  writeFileSync(file, decided.text);
  const added = spawnSync("git", ["-C", io.projectRoot, "add", "--", block.file], { encoding: "utf8" });
  if ((added.status ?? 3) !== 0) {
    io.err(`      ${block.file} could not be staged after the correction`);
    return EXIT.FOUND;
  }
  if (!io.state.fixed.includes(block.file)) io.state.fixed.push(block.file);
  io.state.corrections.push(block.correction);
  io.out(
    `      applied: ${block.correction} — ${block.file} now carries the block's \`old\` text; ` +
      `before the write, ${correctionCountsLine(decided)}`,
  );
  return EXIT.CLEAN;
}

/**
 * @param {Step} step
 * @param {{ out: (s: string) => void, err: (s: string) => void, projectRoot: string, id: string, card: string, tier?: string | undefined }} io
 * @returns {number}
 */
function keeperStep(step, io) {
  const lines = stagedLines(io.projectRoot);
  if (step.keeper === "pinned-sentence") {
    const specs = specCorpus(io.projectRoot);
    const findings = pinnedSentenceFindings({ removed: lines.removed, specs });
    io.out(
      `      ${String(lines.removed.length)} removed line(s) against ${String(specs.size)} spec ` +
        `file(s), at the ${String(PINNED_SENTENCE_FLOOR)}-character floor`,
    );
    if (findings.length === 0) return EXIT.CLEAN;
    for (const f of findings) io.err(`      ${f}`);
    return EXIT.FOUND;
  }
  if (step.keeper === "forbidden-spelling") {
    const names = personalNames(io.projectRoot);
    const findings = forbiddenSpellingFindings({
      added: lines.added,
      home: os.homedir(),
      names,
      classify: (line, file) => (carriesLegacy(line) ? { kept: classifyLegacy(line, file) !== null } : null),
    });
    io.out(
      `      ${String(lines.added.length)} added line(s) against ` +
        `${String(SECRET_SHAPES.length)} secret shape(s), an address, this machine's home and ` +
        `${String(names.length)} derived name(s), plus the rename scanner's own classifier`,
    );
    if (findings.length === 0) return EXIT.CLEAN;
    for (const f of findings) io.err(`      ${f}`);
    return EXIT.FOUND;
  }
  const cardText = existsSync(path.join(io.projectRoot, io.card))
    ? readFileSync(path.join(io.projectRoot, io.card), "utf8")
    : "";
  const size = cardSize(cardText);
  // THE CARD'S OWN FILE IS NOT THE WORK, so its lines are taken off the
  // count before the bound is applied — a card whose notes ran long is
  // not a card that outgrew its tier.
  const changed = lines.changed - (lines.byPath[io.card] ?? 0);
  const bump = xsBoundBump({ size, changed });
  io.out(
    `      size ${size.length === 0 ? "(none on the card)" : size}, ${String(changed)} changed ` +
      `line(s) outside the card itself, bound ${String(XS_CHANGED_LINE_BOUND)}, tier ` +
      `${io.tier ?? DEFAULT_TIER}`,
  );
  if (bump === null) return EXIT.CLEAN;
  // THE BUMP IS A WRITE, AND IT IS THE ONE THING THIS STEP DOES BESIDES
  // PRINT. The readings step reads `tier` off this same object, so the
  // bumped tier reaches the bands without anybody typing `--tier`.
  io.tier = BUMPED_TIER;
  io.out(`      ${bump}`);
  return EXIT.CLEAN;
}

/**
 * THE NAMES THIS KEEPER LOOKS FOR, DERIVED FROM THE MACHINE.
 *
 * Never a list in the repository, which would itself be the leak. The
 * account this process runs as and the git identity this checkout
 * commits under are the two names that reach a tracked file by accident.
 *
 * @param {string} root
 * @returns {string[]}
 */
export function personalNames(root) {
  /** @type {string[]} */
  const names = [];
  try {
    const account = os.userInfo().username;
    if (account.length > 2) names.push(account);
  } catch {
    // A process with no resolvable account is not a process with a name
    // to leak; the step prints how many names it derived.
  }
  // THE GIT IDENTITY IS ONE NAME AND IS NOT SPLIT INTO ITS WORDS. The
  // first fixture run split `T-295 fixture` and then refused every line
  // carrying a card id or the word "fixture" — a keeper that fires on
  // ordinary vocabulary is a keeper that gets turned off. A whole name
  // is specific enough to be worth looking for and general enough not to
  // collide, which a single word out of one is not.
  const configured = git(root, ["config", "user.name"]);
  if (configured.ok) {
    const whole = configured.out.trim();
    if (whole.length > 2 && !names.includes(whole)) names.push(whole);
  }
  return names;
}

/**
 * @param {Step} step
 * @param {{ out: (s: string) => void, err: (s: string) => void, projectRoot: string, state: MergeState }} io
 * @returns {number}
 */
function methodBumpStep(step, io) {
  const move = step.bump;
  if (move === undefined) {
    io.err("      the bump step carries no version move");
    return EXIT.CANNOT_RUN;
  }
  /** @type {string[]} */
  const written = [];
  for (const entry of METHOD_STAMP_FILES) {
    const file = path.join(io.projectRoot, entry.path);
    if (!existsSync(file)) {
      io.err(`      ${entry.path} is not in this project — the three stamps move together or not at all`);
      return EXIT.CANNOT_RUN;
    }
    const before = readFileSync(file, "utf8");
    const bumped = bumpOne({ text: before, path: entry.path, from: move.from, to: move.to });
    if ("problem" in bumped) {
      // THE FILES ALREADY WRITTEN ARE PUT BACK. A half-bump left on disk
      // is exactly the state the drill below exists to catch, and
      // leaving one behind on the way out would be this step planting it.
      for (const done of written) {
        writeFileSync(path.join(io.projectRoot, done), io.state.shas[`before:${done}`] ?? "");
      }
      io.err(`      ${bumped.problem}`);
      return EXIT.FOUND;
    }
    io.state.shas[`before:${entry.path}`] = before;
    writeFileSync(file, bumped.text);
    io.state.shas[entry.path] = sha256(bumped.text);
    written.push(entry.path);
    spawnSync("git", ["-C", io.projectRoot, "add", "--", entry.path], { encoding: "utf8" });
  }
  io.state.regenerated.push(`the method stamp ${move.from} to ${move.to}, in three files`);
  io.out(`      bumped and staged: ${written.join(", ")}`);
  return EXIT.CLEAN;
}

/**
 * THE HALF-BUMP DRILL — the one property a bump can silently break.
 *
 * The const alone moved back must red the pin test BY NAME. Plant,
 * run, restore, prove by sha256: the same shape the mutant drill uses,
 * and for the same reason — a pin test that is green on a half bump
 * pins nothing at all.
 *
 * @param {Step} step
 * @param {{ out: (s: string) => void, err: (s: string) => void, projectRoot: string, state: MergeState }} io
 * @returns {number}
 */
function halfBumpDrillStep(step, io) {
  const move = step.bump;
  if (move === undefined) return EXIT.CANNOT_RUN;
  const entry = /** @type {{ path: string, anchor: (v: string) => string }} */ (
    METHOD_STAMP_FILES[METHOD_STAMP_FILES.length - 1]
  );
  const file = path.join(io.projectRoot, entry.path);
  const pristine = readFileSync(file, "utf8");
  const before = sha256(pristine);
  const half = pristine.replace(entry.anchor(move.to), () => entry.anchor(move.from));
  if (half === pristine) {
    io.err(`      ${entry.path} does not carry the bumped stamp, so no half bump can be planted`);
    return EXIT.FOUND;
  }
  writeFileSync(file, half);
  /** @type {{ status: number | null, stdout?: string, stderr?: string }} */
  let r;
  try {
    r = spawnSync("cargo", ["test", "-q", "--lib", "--", "agent::kit::tests"], {
      cwd: path.join(io.projectRoot, "app", "src-tauri"),
      encoding: "utf8",
      stdio: "pipe",
    });
  } finally {
    writeFileSync(file, pristine);
  }
  const after = sha256(readFileSync(file, "utf8"));
  if (after !== before) {
    io.err(`      THE SITE WAS NOT RESTORED — ${entry.path} is ${after} and was ${before}`);
    return EXIT.FOUND;
  }
  io.out(`      restored and PROVED by sha256: ${entry.path} ${before}`);
  if ((r.status ?? 3) === 0) {
    io.err(
      "      THE HALF BUMP SURVIVED — the pin test is GREEN with the const alone moved back, so " +
        "it does not pin the three stamps agreeing. The bump is refused",
    );
    return EXIT.FOUND;
  }
  io.out(`      the half bump RED the pin test (exit ${String(r.status ?? 3)}), which is what pins it`);
  return EXIT.CLEAN;
}

/**
 * @param {{ out: (s: string) => void, err: (s: string) => void, state: MergeState }} io
 * @returns {number}
 */
function countsStep(io) {
  const graded = gradeCounts({ claimed: io.state.claimed, observed: io.state.observed });
  for (const j of graded.judged) io.out(`      ${j}`);
  for (const u of graded.unjudged) io.out(`      not judged — ${u}`);
  if (graded.judged.length === 0 && graded.findings.length === 0) {
    io.out(
      "      no leg was judged: this merge ran no suite that printed a count, or the verdict " +
        "claims none. That is said rather than read as a pass",
    );
  }
  if (graded.findings.length === 0) return EXIT.CLEAN;
  for (const f of graded.findings) io.err(`      ${f}`);
  io.err("      The merge stays staged and is NOT committed.");
  return EXIT.FOUND;
}

/**
 * @param {{ out: (s: string) => void, err: (s: string) => void, projectRoot: string, id: string, state: MergeState, verdict?: { heading: string, text: string } | undefined, verdictSha?: string | undefined, lane?: string | undefined, benchTip?: string | undefined, messagePath?: string | undefined }} io
 * @returns {number}
 */
function messageStep(io) {
  if (io.verdict === undefined) {
    io.err(
      "      this merge has no verdict to write a message from, and this command composes none " +
        "by hand",
    );
    return EXIT.FOUND;
  }
  const staged = git(io.projectRoot, ["diff", "--cached", "--name-only"]);
  const text = mergeMessage({
    id: io.id,
    lane: io.lane ?? "",
    benchTip: io.benchTip ?? "",
    verdictSha: io.verdictSha ?? "",
    verdict: io.verdict,
    paths: staged.ok ? staged.out.split("\n").filter((l) => l.length > 0) : [],
    corrections: io.state.corrections,
    regenerated: io.state.regenerated,
    counts: io.state.observed,
  });
  const file = io.messagePath ?? path.join(io.projectRoot, ".git", "MERGE_MSG");
  try {
    writeFileSync(file, text);
  } catch (e) {
    io.err(`      the message could not be written to ${file} — ${e instanceof Error ? e.message : String(e)}`);
    return EXIT.CANNOT_RUN;
  }
  io.out(`      written to ${file}, from the verdict's own sentences:`);
  for (const line of text.split("\n").slice(0, 2)) io.out(`        ${line}`);
  return EXIT.CLEAN;
}

/**
 * @param {{ out: (s: string) => void, err: (s: string) => void, projectRoot: string, id: string, card: string, state: MergeState, verdict?: { heading: string, text: string } | undefined, benchTip?: string | undefined, readingsPath?: string | undefined, meterFiles?: readonly string[] | undefined, tier?: string | undefined }} io
 * @returns {number}
 */
function metersStep(io) {
  const cardPath = path.join(io.projectRoot, io.card);
  const cardText = existsSync(cardPath) ? readFileSync(cardPath, "utf8") : "";
  /** @type {{ seat: string, source: string, text: string }[]} */
  const sources = [];
  if (io.verdict !== undefined) {
    sources.push({ seat: "verifier", source: io.card, text: io.verdict.text });
  }
  for (const file of io.meterFiles ?? []) {
    if (!existsSync(file)) {
      io.err(`      ${file} is not readable, so the seat's own meters are NOT in this reading`);
      continue;
    }
    sources.push({ seat: "executor", source: path.basename(file), text: readFileSync(file, "utf8") });
  }
  const lines = readingsLines({
    id: io.id,
    size: cardSize(cardText),
    tier: io.tier ?? DEFAULT_TIER,
    merge: io.benchTip ?? "",
    at: new Date().toISOString(),
    sources,
  });
  if (lines.length === 0) {
    io.out(
      "      no `## Meters` block was found in the verdict or in any file named by --meters — " +
        "nothing was appended, and that is said rather than left to look like a clean run",
    );
    return EXIT.CLEAN;
  }
  const file = io.readingsPath ?? path.join(io.projectRoot, ...READINGS_PATH.split("/"));
  try {
    mkdirSync(path.dirname(file), { recursive: true });
    appendFileSync(file, `${lines.join("\n")}\n`);
  } catch (e) {
    io.err(`      the readings could not be appended to ${file} — ${e instanceof Error ? e.message : String(e)}`);
    return EXIT.CANNOT_RUN;
  }
  io.out(`      appended ${String(lines.length)} reading(s) to ${path.relative(io.projectRoot, file)}`);
  return EXIT.CLEAN;
}

// The same bootstrap `gate-run.mjs` and `undo.mjs` use: execution lives
// here so the module stays importable by the spec.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  // `process.exitCode`, NEVER `process.exit()`: a command that ends at
  // process.exit drops whatever stdout has not drained, which is
  // invisible to a file and to a TTY and silent to a pipe (T-225's
  // sweep, tools/e2e/tests/brief-flush.spec.ts, which reds by name when
  // a new command in this directory joins that class). This one writes a
  // derivation a reader is meant to keep.
  process.exitCode = main(process.argv.slice(2));
}
