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
 */

import { spawnSync } from "node:child_process";
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
 * @property {"graph-pins" | "stamp-done"} [action] work the runner does AFTER the command
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
 * @param {{ paths: readonly string[], projectRoot: string, id: string }} input
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
    "  the dogfood bodies before the commit.",
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
    for (const step of tailPlan({ paths, projectRoot: root, id })) printStep(out, step);
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
  for (const step of tailPlan({ paths, projectRoot: root, id })) {
    printStep(out, step);
    const code = runStep(step, stepIo);
    if (code !== 0) {
      err(`merge ${id}: stopped at ${step.id} (exit ${String(code)}). The merge stays staged.`);
      return EXIT.FOUND;
    }
  }
  return EXIT.CLEAN;
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
