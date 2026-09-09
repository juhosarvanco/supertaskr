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
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildCommandFor, conventionCommandsFor } from "./cli.mjs";
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
 * @property {{ command: string, argv: string[], cwd: string, env?: Record<string, string>, assert?: "empty-output" } | null} run
 * @property {"graph-pins" | "stamp-done" | "mutant-drill"} [action] work the runner does AFTER the command
 * @property {MutantBlock} [block] the correction this step re-drills
 * @property {string} [problem] why this step cannot be performed at all
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
 * A VERDICT ENTRY'S OWN HEADING, which is what separates one pass from
 * the next. Verdicts are APPENDED (method/tasks/TASK-FORMAT.md, "one
 * dated entry per pass"), so the NEWEST is the LAST such heading — and
 * the sub-headings a verdict carries inside itself are `###` too, which
 * is why this is anchored on the date rather than on the level alone.
 */
const VERDICT_HEADING = /^###\s+(?:[A-Z]+\s+)?\d{4}-\d{2}-\d{2}\b/;

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
    if (VERDICT_HEADING.test(lines[i] ?? "")) start = i;
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
    /\bASSIGNED\s+CORRECTIONS?\b/i.test(verdictText) || /^#+\s*CORRECTION\b/im.test(verdictText)
  );
}

/** @param {string} verdictText @returns {number} how many corrections the verdict heads */
export function correctionHeadings(verdictText) {
  return (verdictText.match(/^#+\s*CORRECTION\b/gim) ?? []).length;
}

/** @param {string} haystack @param {string} needle @returns {number} */
export function occurrences(haystack, needle) {
  if (needle.length === 0) return 0;
  let n = 0;
  for (
    let at = haystack.indexOf(needle);
    at !== -1;
    at = haystack.indexOf(needle, at + needle.length)
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
  for (let i = 0; i < lines.length; i += 1) {
    // AT COLUMN ZERO, both fences. An INDENTED fence is a markdown code
    // block inside something else — a list item, a quoted example of this
    // very layout — and a reader that took those would refuse a whole
    // verdict because the verifier explained the shape it was using. An
    // indented block is therefore not a block; a verdict that assigns
    // corrections and yields none is refused by `drillSteps`, so the
    // mistake is loud rather than silent.
    if (lines[i] !== `\`\`\`${MUTANT_FENCE}`) continue;
    let end = -1;
    for (let j = i + 1; j < lines.length; j += 1) {
      if (lines[j] === "```") {
        end = j;
        break;
      }
    }
    if (end === -1) {
      problems.push(`a \`\`\`${MUTANT_FENCE} block is never closed`);
      break;
    }
    const one = readOneBlock(lines.slice(i + 1, end));
    if ("problem" in one) problems.push(one.problem);
    else blocks.push(one.block);
    i = end;
  }
  if (problems.length > 0) return { problem: problems.join("; ") };
  return { blocks };
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
    const line = raw.replace(/\[[0-9;]*m/g, "");
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
  /** @type {{ dir: string, argv: (rel: string) => string[] }[]} */
  const packages = [
    { dir: "tools/e2e", argv: (rel) => ["playwright", "test", rel, "--reporter=line"] },
    { dir: "lib/parser", argv: (rel) => ["vitest", "run", rel] },
    { dir: "app", argv: (rel) => ["vitest", "run", rel] },
  ];
  for (const pkg of packages) {
    if (!spec.startsWith(`${pkg.dir}/`)) continue;
    return {
      command: "npx",
      argv: pkg.argv(spec.slice(pkg.dir.length + 1)),
      cwd: path.join(projectRoot, ...pkg.dir.split("/")),
    };
  }
  return {
    problem:
      `no runner in this project owns ${spec} — the packages that run specs are ` +
      `${packages.map((p) => p.dir).join(", ")}, and a spec outside all three cannot be drilled here`,
  };
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
 * @param {{ block: MutantBlock, projectRoot: string, out?: (s: string) => void, err?: (s: string) => void, run?: (r: { command: string, argv: string[], cwd: string }) => { code: number, output: string } }} input
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
  const runner = specRunner(block.spec, projectRoot);
  if ("problem" in runner) {
    err(`      ${block.correction}: ${runner.problem}`);
    return EXIT.CANNOT_RUN;
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
  let result;
  try {
    result = (input.run ?? spawnSpec)(runner);
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
 * THE DRILL STEPS a merge owes, read off the card's newest verdict.
 *
 * A verdict that assigns NO correction owes no block, and that is a step
 * that SAYS SO rather than a step that is absent — the difference
 * between "there was nothing to drill" and "nobody looked" is the whole
 * reason this exists.
 *
 * @param {{ cardText: string | undefined, projectRoot: string, id: string }} input
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
  const read = readMutantBlocks(verdict.text);
  if ("problem" in read) return refuse(read.problem);
  const heads = correctionHeadings(verdict.text);
  if (read.blocks.length === 0) {
    if (assignsCorrections(verdict.text)) {
      return refuse(
        `the newest verdict (${verdict.heading}) assigns corrections and carries NO mutant ` +
          "block — a correction whose body has to be recovered from a transcript is the thing " +
          "this step exists to end",
      );
    }
    return [
      {
        id: "drill:none",
        kind: "gate",
        action: "mutant-drill",
        title: `the newest verdict (${verdict.heading}) assigns no correction, so nothing is re-drilled`,
        why:
          "T-281: an APPROVED verdict owes no block, and saying so is not the same as finding none",
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
        ? ` (${String(heads)} correction heading(s), ${String(read.blocks.length)} block(s))`
        : ""),
    why:
      "T-281 criterion 3: the block is the verifier's, the drill is the integrator's, and the " +
      "merge stops before the commit on a survivor, on a body that reds more than itself, or on " +
      "an anchor that does not match once",
    run: null,
  }));
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
 * @param {{ paths: readonly string[], projectRoot: string, id: string, cardText?: string | undefined }} input
 * @returns {Step[]}
 */
export function tailPlan(input) {
  const { paths, projectRoot, id } = input;
  /** @type {Step[]} */
  const steps = [];
  if (bringsBuiltSources(paths)) steps.push(...setupSteps(projectRoot));
  if (movesSpecNames(paths)) {
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
  if (movesIndexedSource(paths)) {
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
  if (movesGraph(paths) || movesIndexedSource(paths)) {
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
            title: `docs-gate.mjs on ${String(docsPaths.length)} path(s) under docs/`,
            why:
              "docs/CONVENTIONS.md DOCS GATE: docs/ is a CODE INPUT and neither other trigger " +
              "can see it",
            run: { command: process.execPath, argv: [gate, ...docsPaths], cwd: projectRoot },
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
  steps.push(...drillSteps({ cardText: input.cardText, projectRoot, id }));
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
 * @param {{ projectRoot: string, id: string, branch: string, lane: string, verdict: string, worktree: string | null }} input
 * @returns {Step[]}
 */
export function preludePlan(input) {
  const { projectRoot, id, branch, lane, verdict, worktree } = input;
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
      why: "room 17: the verdict commit is what gets merged, not the tip the executor left",
      run: { command: "git", argv: ["-C", projectRoot, "branch", "-f", lane, verdict], cwd: projectRoot },
    },
    {
      id: "merge",
      kind: "git",
      title: `git merge --no-ff --no-commit ${lane}`,
      why: "the prototype's step 4: the merge is staged so the integrator's own writes join it",
      run: {
        command: "git",
        argv: ["-C", projectRoot, "merge", "--no-ff", "--no-commit", lane],
        cwd: projectRoot,
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

/** @returns {string} */
export function usageText() {
  return [
    "usage: supertaskr merge <T-NNN> --slug <slug> --verdict <sha>",
    "                      --built-by <m@k> --verified-by <m@k>",
    "                      [--root <path>] [--branch <name>] [--dry-run]",
    "",
    "  The integrator's ritual in its order, stopping with the merge STAGED.",
    "  The tail is derived from the merge's own paths: a merge bringing app/ or lib/",
    "  sources reinstalls and rebuilds BEFORE any suite; a merge moving the graph runs",
    "  the dogfood bodies before the commit; and every MUTANT BLOCK on the card's newest",
    "  verdict is re-drilled on the merged tree — planted, run, restored, proved by sha256 —",
    "  with the run STOPPING on a survivor, on a body that reds more than itself, or on an",
    "  anchor that does not match exactly once.",
    "  exit: 0 staged · 1 a step failed · 2 called wrong · 3 could not run",
  ].join("\n");
}

/**
 * @param {string[]} argv
 * @param {{ cwd?: string, out?: (s: string) => void, err?: (s: string) => void }} [io]
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

  const prelude = preludePlan({ projectRoot: root, id, branch, lane, verdict: verdictSha, worktree });
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
    for (const step of tailPlan({ paths, projectRoot: root, id, cardText: readCard(root, card.file) })) {
      printStep(out, step);
    }
    out("  --dry-run, nothing was run.");
    return EXIT.CLEAN;
  }

  const stepIo = {
    out,
    err,
    projectRoot: root,
    id,
    card: card.file,
    builtBy: builtBy ?? "",
    verifiedBy: verifiedBy ?? "",
  };
  for (const step of prelude) {
    const code = runStep(step, stepIo);
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
  for (const step of tailPlan({ paths, projectRoot: root, id, cardText })) {
    printStep(out, step);
    const code = runStep(step, stepIo);
    if (code !== 0) {
      err(`merge ${id}: stopped at ${step.id} (exit ${String(code)}). The merge stays staged.`);
      return EXIT.FOUND;
    }
  }
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
 * @param {Step} step
 * @param {{ out: (s: string) => void, err: (s: string) => void, projectRoot: string, id: string, card: string, builtBy: string, verifiedBy: string }} io
 * @returns {number}
 */
function runStep(step, io) {
  if (step.run === null && step.action === undefined) {
    io.out(`      (no command — this step is the seat's own work)`);
    return 0;
  }
  if (step.run !== null) {
    const graded = step.run.assert === "empty-output";
    const r = spawnSync(step.run.command, step.run.argv, {
      cwd: step.run.cwd,
      stdio: graded ? "pipe" : "inherit",
      encoding: "utf8",
      ...(step.run.env === undefined ? {} : { env: { ...process.env, ...step.run.env } }),
    });
    if (r.error !== undefined && r.error !== null) {
      io.err(`      ${step.run.command} could not be started — ${r.error.message}`);
      return 3;
    }
    if (graded) {
      const said = `${String(r.stdout ?? "")}${String(r.stderr ?? "")}`.trim();
      if (said.length > 0) {
        io.err(`      the tree is NOT clean — this step is graded on its output, not its exit:\n${said}`);
        return 1;
      }
    }
    if ((r.status ?? 3) !== 0) return r.status ?? 3;
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
  if (step.action === "mutant-drill") {
    if (step.problem !== undefined) {
      io.err(`      ${step.problem}`);
      return EXIT.FOUND;
    }
    if (step.block === undefined) {
      io.out("      the newest verdict assigns no correction — nothing to re-drill");
      return EXIT.CLEAN;
    }
    return runMutantDrill({
      block: step.block,
      projectRoot: io.projectRoot,
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
    io.out(`      ${graphPinLine({ graph, id: io.id, at: new Date() })}`);
  }
  return 0;
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
