/**
 * `npx supertaskr` — THE FRONT (T-244, C-02).
 *
 * ── WHAT THIS FILE IS, AND WHAT IT REFUSES TO BE ─────────────────────
 * Every capability this command exposes ALREADY EXISTS in this tree as a
 * script or a binary: `brief.mjs`'s dispatch view, fence writer, seat
 * lock and one-command arm; the card preflight; the docs gate; the
 * blessed gate-runner; the push checks; the health bands; the census
 * generator; the boot check and its orphan drill; and the indexer's
 * `index --check` / `arch` family. What did not exist is ONE COMMAND a
 * user installs, which is the single word docs/ARCHITECTURE.md's
 * component table spends on C-02: *planned*.
 *
 * So this file MOVES NO LOGIC. It is a dispatch table plus four
 * derivations, and the properties that keep it a front rather than a
 * second implementation are asserted by `tests/cli.spec.ts`:
 *
 *   1. every verb names an EXISTING target — a script file in this
 *      package, or a cargo package in this tree — and the spec resolves
 *      each one on disk rather than trusting this table;
 *   2. the child's exit code is this command's exit code, UNCHANGED. A
 *      front that relabels an exit is a front that lies about a gate,
 *      and this repository has a bullet per gate about exactly that;
 *   3. every `--root`-passing claim in the table is checked against the
 *      target script's own flag list;
 *   4. what a verb NEEDS before it can run is DERIVED from the target's
 *      own import graph and from the tree, never listed here.
 *
 * ── THE PROJECT ROOT IS THE POINT (T-231's account) ──────────────────
 * Installed into a project genesis created, this package sits under that
 * project's `node_modules/`, and the method's relative paths — docs/,
 * method/, docs/tasks/ — belong to THE PROJECT, not to the package. So
 * two roots are computed and never confused:
 *
 *   `packageRoot`   — where THIS file lives, which is where the scripts
 *                     it dispatches to live. Resolved off `import.meta.url`.
 *   `projectRoot`   — the nearest ancestor of the working directory that
 *                     carries the method's own markers. Resolved by
 *                     walking up, and overridable with `--root`.
 *
 * A verb whose target accepts `--root` is handed the PROJECT root. A
 * verb whose target computes its own root off `import.meta.url` — the
 * dominant shape in this package — is REFUSED when the two roots differ,
 * naming the reason. It is refused rather than run because the failure
 * it would otherwise produce is the worst kind: a gate that answers
 * confidently about the wrong tree.
 *
 * ── A VERB THAT NEEDS A BUILD SAYS SO (the card's fifth criterion) ───
 * `requirementsFor` walks the target's own import graph for bare
 * specifiers and asks the tree for the artefacts it names. Nothing here
 * enumerates which verb needs `node_modules`: a script that grows an
 * import grows a requirement, and one that loses it loses one.
 */

import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Where this file lives: `<package>/scripts/`. */
const here = path.dirname(fileURLToPath(import.meta.url));

/**
 * The installed package's own root — the directory holding `scripts/`,
 * `bin/` and `package.json`. Everything this command SPAWNS is resolved
 * against this, so a package installed anywhere still finds its own
 * scripts.
 */
export const packageRoot = path.resolve(here, "..");

/**
 * The repository this package is checked out INSIDE, when it is checked
 * out inside one. In this tree that is the repo root; in an installed
 * copy it is `node_modules/@scope`, which is meaningless — which is why
 * nothing reads it except the equality test in `rootMismatch`.
 */
export const packageRepoRoot = path.resolve(packageRoot, "..", "..");

/**
 * THIS repository's own docs/CONVENTIONS.md — the file `buildCommandFor`
 * reads when no project root is named, and the site that makes this
 * front a DERIVED READER of docs/ to the docs gate (the card's third
 * criterion, T-231's account). A front that reads a governing document
 * while being invisible to the gate over that document is the exact gap
 * that gate exists to close.
 */
export const CONVENTIONS_PATH = path.join(packageRepoRoot, "docs", "CONVENTIONS.md");

/** The four house exit codes, the same set every gate in this tree uses. */
export const EXIT = Object.freeze({ CLEAN: 0, FOUND: 1, USAGE: 2, CANNOT_RUN: 3 });

/**
 * The markers that say "this directory is a supertaskr project".
 *
 * `docs/` alone is far too common; `method/` alone is absent from a
 * project that vendors the convention elsewhere. BOTH, or a `.git`
 * beside a `docs/`, is the shape genesis produces and the shape this
 * repository has.
 */
export const ROOT_MARKERS = Object.freeze(["docs", "method"]);

/**
 * Walk up from `start` for the project root.
 *
 * @param {string} start
 * @returns {string | null}
 */
export function findProjectRoot(start) {
  let dir = path.resolve(start);
  for (;;) {
    const hasDocs = existsSync(path.join(dir, "docs"));
    if (hasDocs && ROOT_MARKERS.every((m) => existsSync(path.join(dir, m)))) return dir;
    if (hasDocs && existsSync(path.join(dir, ".git"))) return dir;
    const up = path.dirname(dir);
    if (up === dir) return null;
    dir = up;
  }
}

// ── the requirements derivation ──────────────────────────────────────

/**
 * The bare (non-relative, non-`node:`) specifiers a script's own import
 * graph reaches, following relative imports only.
 *
 * DERIVED RATHER THAN LISTED, because the list is exactly the thing that
 * goes stale: `docs-gate.mjs` imports `yaml` today and `token-scan.mjs`
 * is zero-dependency today, and both facts are load-bearing in
 * docs/CONVENTIONS.md — but a table here restating them would keep
 * saying so after either changed.
 *
 * @param {string} entry absolute path to a `.mjs`/`.js` file
 * @param {Set<string>} [seen]
 * @returns {string[]}
 */
export function bareDependencies(entry, seen = new Set()) {
  /** @type {Set<string>} */
  const bare = new Set();
  /** @param {string} file */
  const walk = (file) => {
    const abs = path.resolve(file);
    if (seen.has(abs)) return;
    seen.add(abs);
    if (!existsSync(abs)) return;
    const src = readFileSync(abs, "utf8");
    for (const m of src.matchAll(/(?:^|[\s;{(])(?:import|export)[^"'\n]*?from\s*["']([^"']+)["']/g)) {
      const spec = /** @type {string} */ (m[1]);
      if (spec.startsWith("node:")) continue;
      if (spec.startsWith(".") || spec.startsWith("/")) {
        walk(path.resolve(path.dirname(abs), spec));
        continue;
      }
      bare.add(spec);
    }
    for (const m of src.matchAll(/(?:^|[\s;{(])import\s*["']([^"']+)["']/g)) {
      const spec = /** @type {string} */ (m[1]);
      if (spec.startsWith("node:")) continue;
      if (spec.startsWith(".") || spec.startsWith("/")) walk(path.resolve(path.dirname(abs), spec));
      else bare.add(spec);
    }
  };
  walk(entry);
  return [...bare].sort();
}

/**
 * The files a script reaches by a RELATIVE import that leaves the
 * package — this tree's scripts import `.claude/hooks/*` that way, three
 * directories up, which is invisible in a `bin` field and fatal in an
 * installed copy where those directories are not there.
 *
 * MEASURED RATHER THAN ASSUMED (T-244): the first `npx supertaskr status`
 * against a packed tarball died with `ERR_MODULE_NOT_FOUND` on
 * `node_modules/.claude/hooks/lane-fence.mjs`. A stack trace is the one
 * answer this command may not give, so the escape set is derived and the
 * missing members are named before anything is spawned.
 *
 * @param {string} entry
 * @param {string} pkgRoot
 * @param {Set<string>} [seen]
 * @returns {string[]}
 */
export function packageEscapes(entry, pkgRoot, seen = new Set()) {
  /** @type {Set<string>} */
  const escapes = new Set();
  /** @param {string} file */
  const walk = (file) => {
    const abs = path.resolve(file);
    if (seen.has(abs)) return;
    seen.add(abs);
    if (!existsSync(abs)) return;
    const src = readFileSync(abs, "utf8");
    for (const m of src.matchAll(/from\s*["'](\.[^"']*)["']/g)) {
      const target = path.resolve(path.dirname(abs), /** @type {string} */ (m[1]));
      if (path.relative(pkgRoot, target).startsWith("..")) escapes.add(target);
      else walk(target);
    }
  };
  walk(entry);
  return [...escapes].sort();
}

/**
 * @typedef {object} Requirement
 * @property {string} id      what is missing, as a short name
 * @property {string} what    the sentence a user reads
 * @property {string} build   the ONE command that builds it, with its directory
 */

/**
 * What a verb needs before it can run, and the one command that supplies
 * each missing piece.
 *
 * The build commands are DERIVED from docs/CONVENTIONS.md's own
 * `run from <dir>/:` command bullets when that file is readable — the
 * same bullets CI parity derives its steps from — so a reworded command
 * moves this message. When the file cannot be read (an installed package
 * pointed at a project that has no CONVENTIONS yet) the derivation says
 * which directory to run in and names the file it could not read, rather
 * than inventing a command.
 *
 * @param {VerbEntry} entry
 * @param {string} projectRoot
 * @param {string} [pkgRoot] the installed package's root; the spec passes a fixture
 * @returns {Requirement[]}
 */
export function requirementsFor(entry, projectRoot, pkgRoot = packageRoot) {
  /** @type {Requirement[]} */
  const missing = [];
  if (entry.target.kind === "script") {
    const file = path.join(pkgRoot, "scripts", entry.target.file);
    const bare = bareDependencies(file);
    if (bare.length > 0 && !existsSync(path.join(pkgRoot, "node_modules"))) {
      missing.push({
        id: "package-deps",
        what:
          `${entry.target.file} imports ${bare.join(", ")} and this package has no ` +
          "node_modules",
        build: buildCommandFor("tools/e2e", projectRoot),
      });
    }
    const absent = packageEscapes(file, pkgRoot).filter((p) => !existsSync(p));
    if (absent.length > 0) {
      missing.push({
        id: "package-escapes",
        what:
          `${entry.target.file} imports ${String(absent.length)} file(s) from OUTSIDE this ` +
          `package that are not there: ${absent.map((p) => path.basename(p)).join(", ")}`,
        build:
          "there is nothing to build — this verb's script is not self-contained yet, so run it " +
          "from a checkout of the project's own tooling rather than from an installed package",
      });
    }
  }
  if (entry.target.kind === "project") {
    const file = path.join(projectRoot, entry.target.file);
    if (!existsSync(file)) {
      missing.push({
        id: "project-script",
        what: `${entry.target.file} is not in this project`,
        build: `there is nothing to build — ${entry.verb} fronts a script this project does not carry`,
      });
    }
  }
  if (entry.target.kind === "cargo") {
    const manifest = path.join(projectRoot, entry.target.cwd, "Cargo.toml");
    if (!existsSync(manifest)) {
      missing.push({
        id: "cargo-manifest",
        what: `${path.join(entry.target.cwd, "Cargo.toml")} is not in this project`,
        build: `there is nothing to build — ${entry.verb} needs the indexer crate, which this project does not carry`,
      });
    } else if (!onPath("cargo")) {
      missing.push({
        id: "cargo",
        what: "cargo is not on PATH, so the indexer cannot be built or run",
        build: "install the Rust toolchain (https://rustup.rs), then re-run this verb",
      });
    }
  }
  for (const id of entry.alsoNeeds ?? []) {
    if (id === "parser-build" && !existsSync(path.join(projectRoot, "lib", "parser", "dist"))) {
      missing.push({
        id,
        what: "lib/parser is not built, and the fence expansion is read out of its source",
        build: buildCommandFor("lib/parser", projectRoot),
      });
    }
    if (id === "fence-expander" && !existsSync(fenceExpander(projectRoot))) {
      missing.push({
        id,
        what:
          "this project carries no .claude/hooks/expand-fence.mjs, which is the ONE " +
          "expansion a fence comparison is allowed to use",
        build:
          "there is nothing to build — copy the method's .claude/hooks/ into this project, " +
          "or run this verb from a checkout that has it",
      });
    }
  }
  return missing;
}

/** The fence expander this project ships, resolved against the PROJECT root. */
/** @param {string} projectRoot @returns {string} */
export function fenceExpander(projectRoot) {
  return path.join(projectRoot, ".claude", "hooks", "expand-fence.mjs");
}

/** @param {string} name @returns {boolean} */
function onPath(name) {
  const probe = spawnSync(process.platform === "win32" ? "where" : "command", ["-v", name], {
    encoding: "utf8",
    shell: process.platform !== "win32",
  });
  return probe.status === 0;
}

/**
 * The setup command docs/CONVENTIONS.md's "Build & test" section gives
 * for one package directory: its bullet's FIRST backticked command,
 * which is the install step in all four bullets, plus `npm run build`
 * where that bullet carries one.
 *
 * READ WITH ITS DEFAULT: called with no root it reads THIS repository's
 * docs/CONVENTIONS.md, which is the dominant first-party helper
 * signature in this tree (`(root = repoRoot)`) and is what makes the
 * DOCS GATE see this front as a derived reader of docs/ — the card's
 * third criterion, T-231's account. A front that reads a governing
 * document and is invisible to the gate over that document is exactly
 * the gap that gate exists to close.
 *
 * @param {string} dir
 * @param {string} [projectRoot] the project to read; THIS repository when omitted
 * @returns {string}
 */
export function buildCommandFor(dir, projectRoot) {
  const conventions =
    projectRoot === undefined
      ? CONVENTIONS_PATH
      : path.join(projectRoot, "docs", "CONVENTIONS.md");
  if (!existsSync(conventions)) {
    return `run this project's setup for ${dir}/ (docs/CONVENTIONS.md is not in ${projectRoot ?? packageRepoRoot}, so the command could not be derived)`;
  }
  const commands = conventionCommandsFor(readFileSync(conventions, "utf8"), dir);
  if (commands.length === 0) {
    return `run this project's setup for ${dir}/ (docs/CONVENTIONS.md carries no \`run from ${dir}/:\` bullet)`;
  }
  const wanted = commands.filter((c) => /^npm (ci|install)$/.test(c) || c === "npm run build");
  const chosen = wanted.length > 0 ? wanted : [/** @type {string} */ (commands[0])];
  return `from ${dir}/: ${chosen.join(" && ")}`;
}

/**
 * The backticked commands docs/CONVENTIONS.md's "Build & test" section
 * lists for one `run from <dir>/:` bullet.
 *
 * A SECOND READER OF ONE RULE, AND THE SPEC HOLDS THEM TOGETHER.
 * `tests/workflow-parity.spec.ts` already derives CI's steps from these
 * bullets, and T-057's rule is that a rule with two implementations is
 * two chances to disagree. The remedy taken here is the one that rule
 * itself prescribes where a second reader is unavoidable — the SPEC
 * compares this function's answer against that one's, bullet for
 * bullet, so a drift reds by name instead of going quiet. This copy
 * exists because that one is a Playwright spec: importing a `.spec.ts`
 * from a zero-dependency `.mjs` would make the front need the test
 * runner to print an error message.
 *
 * @param {string} md
 * @param {string} dir
 * @returns {string[]}
 */
export function conventionCommandsFor(md, dir) {
  const start = md.indexOf("## Build & test");
  if (start < 0) return [];
  const rest = md.slice(start + "## Build & test".length);
  const end = rest.indexOf("\n## ");
  const section = end < 0 ? rest : rest.slice(0, end);
  for (const bullet of section.split(/\n(?=- )/)) {
    const flat = bullet.replace(/\s+/g, " ").trim();
    const marker = /run from ([A-Za-z0-9._/-]+)\/:/.exec(flat);
    if (marker === null || marker[1] !== dir) continue;
    /** @type {string[]} */
    const commands = [];
    for (const segment of flat.slice(marker.index + marker[0].length).split("·")) {
      const trimmed = segment.trim();
      if (!trimmed.startsWith("`")) break;
      const close = trimmed.indexOf("`", 1);
      if (close < 0) break;
      commands.push(trimmed.slice(1, close));
    }
    return commands;
  }
  return [];
}

// ── the harness adapters (the installer) ─────────────────────────────

/**
 * @typedef {object} Harness
 * @property {string} id
 * @property {string} name
 * @property {string} dir       where this harness looks for a skill, relative to the project root
 * @property {(skill: string) => string} file  the path one skill lands at, relative to `dir`
 * @property {string} invoke    how a user calls it once installed
 * @property {string} source    the card that MEASURED this form
 */

/**
 * The harnesses v1 targets, as ONE ENTRY EACH.
 *
 * The card's criterion is not "support two harnesses" — it is that a
 * THIRD is one entry in this array and never a rewrite. So nothing below
 * this table branches on a harness id: `installPlan` reads the entry and
 * builds the same shape for every one of them, and the spec proves that
 * by installing a fabricated third harness through a table it extends.
 */
export const HARNESSES = Object.freeze([
  Object.freeze({
    id: "claude",
    name: "Claude Code",
    dir: path.join(".claude", "skills"),
    file: (/** @type {string} */ skill) => path.join(skill, "SKILL.md"),
    invoke: "/<skill> in a Claude Code session",
    source: "T-241 (the skill file's own format, method/skills/<name>/SKILL.md)",
  }),
  Object.freeze({
    id: "codex",
    name: "Codex",
    dir: path.join(".codex", "prompts"),
    file: (/** @type {string} */ skill) => `${skill}.md`,
    invoke: "/<skill> in the Codex CLI, which reads one markdown file per prompt",
    source: "T-246 (Codex's skill form, measured on this machine before it was claimed)",
  }),
]);

/** Where the skills this installer copies come from, inside the project. */
export const SKILL_SOURCE_DIR = path.join("method", "skills");

/**
 * What `install` would do, as data — one entry per harness per skill.
 *
 * Pure: it touches nothing. The runner writes exactly what this returns,
 * which is what lets the spec assert the plan without a filesystem.
 *
 * @param {{ harnesses: readonly Harness[], skills: readonly string[] }} input
 * @returns {{ harness: string, skill: string, from: string, to: string, invoke: string }[]}
 */
export function installPlan(input) {
  /** @type {{ harness: string, skill: string, from: string, to: string, invoke: string }[]} */
  const plan = [];
  for (const harness of input.harnesses) {
    for (const skill of input.skills) {
      plan.push({
        harness: harness.id,
        skill,
        from: path.join(SKILL_SOURCE_DIR, skill, "SKILL.md"),
        to: path.join(harness.dir, harness.file(skill)),
        invoke: harness.invoke.replace("<skill>", skill),
      });
    }
  }
  return plan;
}

/**
 * The skills this project ships, read off the tree.
 *
 * @param {string} projectRoot
 * @returns {string[]}
 */
export function shippedSkills(projectRoot) {
  const dir = path.join(projectRoot, SKILL_SOURCE_DIR);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => existsSync(path.join(dir, name, "SKILL.md")))
    .sort();
}

// ── the verb table ───────────────────────────────────────────────────

/**
 * @typedef {{ kind: "script", file: string, args: readonly string[] }
 *          | { kind: "project", file: string, args: readonly string[] }
 *          | { kind: "cargo", package: string, cwd: string, args: readonly string[] }
 *          | { kind: "builtin", file: string, args: readonly string[] }} Target
 *
 * `project` is a script belonging to the PROJECT rather than to this
 * package — resolved against the project root, which is what makes it
 * correct from an installed copy as well as from a checkout.
 */

/**
 * @typedef {object} VerbEntry
 * @property {string} verb
 * @property {string} summary
 * @property {Target} target
 * @property {boolean} rootFlag   the target takes `--root <project root>`
 * @property {string} source      where this verb comes from — the card, bullet or role step
 * @property {string[]} [alsoNeeds]
 * @property {string} [usage]
 * @property {string} [positionalFlag]  the flag a LEADING positional becomes
 */

/**
 * THE VERBS, and every one of them is a FRONT for something already in
 * this tree.
 *
 * The set is derived rather than invented, from three places the card
 * names: docs/ARCHITECTURE.md's own C-02 line (`init/next/verify/merge/
 * status`), docs/CONVENTIONS.md's four `run from <dir>/:` command
 * bullets, and the arms `brief.mjs` exposes for the seat's ritual — the
 * commands T-241's and T-242's skills are required to call rather than
 * invent. `tests/cli.spec.ts` checks the second and third of those
 * against their sources; the first is checked as a set with the two
 * absences NAMED, because `init` (genesis) and `verify` (the verifier's
 * two-spawn bench) have no script in this tree to front and a verb that
 * fronted nothing would be this package inventing logic.
 *
 * @type {readonly VerbEntry[]}
 */
export const VERBS = /** @type {readonly VerbEntry[]} */ (Object.freeze([
  Object.freeze({
    verb: "status",
    summary: "the board census — every card, its status and its blockers",
    target: { kind: "script", file: "brief.mjs", args: ["--state"] },
    rootFlag: true,
    source: "docs/ARCHITECTURE.md C-02 (`status`); docs/STATE.md BOARD CENSUS: `brief.mjs --state`",
  }),
  Object.freeze({
    verb: "next",
    summary: "the dispatch view — what is startable, and what each card would need",
    target: { kind: "script", file: "brief.mjs", args: ["--dispatch"] },
    rootFlag: true,
    usage: "supertaskr next [--full]",
    source: "docs/ARCHITECTURE.md C-02 (`next`); docs/STATE.md: `brief.mjs --dispatch --full`",
  }),
  Object.freeze({
    verb: "brief",
    positionalFlag: "--task",
    summary: "the dispatch brief for one card, derived row by row from its own sources",
    target: { kind: "script", file: "brief.mjs", args: [] },
    rootFlag: true,
    usage: "supertaskr brief --task <T-NNN> [--role <role>]",
    source: "method/roles/executor.md's brief contract; `brief.mjs --task`",
  }),
  Object.freeze({
    verb: "card",
    positionalFlag: "--card",
    summary: "one card's figures, each with the ref it was measured at",
    target: { kind: "script", file: "brief.mjs", args: [] },
    rootFlag: true,
    usage: "supertaskr card <T-NNN>",
    source: "`brief.mjs --card` (T-150, the card figure ledger)",
  }),
  Object.freeze({
    verb: "preflight",
    positionalFlag: "--task",
    summary: "re-derive a card's claims against the tree it is about to be built on",
    target: { kind: "script", file: "brief.mjs", args: ["--preflight"] },
    rootFlag: true,
    usage: "supertaskr preflight <T-NNN>",
    source: "`brief.mjs --preflight` (T-160, the card preflight)",
  }),
  Object.freeze({
    verb: "fence",
    positionalFlag: "--task",
    summary: "write a lane's fence manifest into its worktree",
    target: { kind: "script", file: "brief.mjs", args: [] },
    rootFlag: true,
    usage: "supertaskr fence --task <T-NNN> --write-fence <worktree>",
    source: "`brief.mjs --write-fence` (the fence writer, lane-protocol rule 5)",
  }),
  Object.freeze({
    verb: "seat",
    summary: "take or release the integration checkout's seat",
    target: { kind: "script", file: "brief.mjs", args: [] },
    rootFlag: true,
    usage: "supertaskr seat --take-seat | --release-seat",
    source: "`brief.mjs --take-seat` / `--release-seat` (T-238, .supertaskr/holder.json)",
  }),
  Object.freeze({
    verb: "arm",
    positionalFlag: "--dispatch-lane",
    summary: "cut, stamp and arm one lane in a single command",
    target: { kind: "script", file: "brief.mjs", args: [] },
    rootFlag: true,
    usage:
      "supertaskr arm --dispatch-lane <T-NNN> --slug <slug> [--executor <m@k>] " +
      "[--verifier <m@k>] [--scratch <dir>] [--dry-run]",
    source: "`brief.mjs --dispatch-lane` (T-239, the one-command arm)",
  }),
  Object.freeze({
    verb: "gate",
    summary: "run a graded suite the blessed way, reading the body count and not the code",
    target: { kind: "script", file: "gate-run.mjs", args: [] },
    rootFlag: false,
    usage: "supertaskr gate parser|app|rust|e2e|--all",
    source:
      "docs/CONVENTIONS.md THE BLESSED GATE-RUNNER: " +
      "`node tools/e2e/scripts/gate-run.mjs parser|app|rust|e2e`",
  }),
  Object.freeze({
    verb: "docs-gate",
    summary: "which suites a set of changed docs/ paths owes",
    target: { kind: "script", file: "docs-gate.mjs", args: [] },
    rootFlag: false,
    usage: "supertaskr docs-gate <changed path>...",
    source:
      "docs/CONVENTIONS.md DOCS GATE, its ONE spelling: " +
      "`node tools/e2e/scripts/docs-gate.mjs`",
  }),
  Object.freeze({
    verb: "push-check",
    summary: "the cheap board checks a push pays for unconditionally",
    target: { kind: "script", file: "push-checks.mjs", args: [] },
    rootFlag: true,
    source: "T-203's push guard: `push-checks.mjs`",
  }),
  Object.freeze({
    verb: "capabilities",
    summary: "regenerate the behaviour census, or check it is current",
    target: { kind: "script", file: "capabilities.mjs", args: [] },
    rootFlag: false,
    usage: "supertaskr capabilities [--check]",
    source: "docs/CONVENTIONS.md tools/e2e bullet: `npm run capabilities` / `capabilities:check`",
  }),
  Object.freeze({
    verb: "health",
    summary: "the method's own health bands, compared rather than eyeballed",
    target: { kind: "script", file: "health-bands-run.mjs", args: [] },
    rootFlag: false,
    source: "docs/CONVENTIONS.md, the health bands: `npm run health`",
  }),
  Object.freeze({
    verb: "tokens",
    summary: "the token lint — CI's first gate, zero-dependency by construction",
    target: { kind: "script", file: "lint-tokens.mjs", args: [] },
    rootFlag: false,
    usage: "supertaskr tokens [--selftest]",
    source: "docs/CONVENTIONS.md tools/e2e bullet: `npm run lint:tokens`",
  }),
  Object.freeze({
    verb: "boot",
    summary: "spawn the app and assert its two startup lines",
    target: { kind: "script", file: "tauri-boot-check.mjs", args: [] },
    rootFlag: false,
    source: "docs/CONVENTIONS.md BOOT GATE: `npm run boot:check`",
  }),
  Object.freeze({
    verb: "orphan-drill",
    summary: "prove the boot check leaves no orphaned vite listener",
    target: { kind: "script", file: "orphan-drill.mjs", args: [] },
    rootFlag: false,
    source: "docs/CONVENTIONS.md tools/e2e bullet: `npm run boot:orphan-drill`",
  }),
  Object.freeze({
    verb: "session",
    summary: "is this checkout current enough to be worked in",
    target: { kind: "script", file: "checkout-currency.mjs", args: [] },
    rootFlag: false,
    source: "T-216-s1's stale-checkout catcher: `checkout-currency.mjs`",
  }),
  Object.freeze({
    verb: "index",
    summary: "is the committed graph current against the tree",
    target: {
      kind: "cargo",
      package: "supertaskr-index",
      cwd: path.join("app", "src-tauri"),
      args: ["index", "--check", "--root", "../.."],
    },
    rootFlag: false,
    source:
      "docs/CONVENTIONS.md app/src-tauri bullet: " +
      "`cargo run -p supertaskr-index -- index --check --root ../..`",
  }),
  Object.freeze({
    verb: "arch",
    summary: "components, observed edges, drift flags, cycles and blast radius",
    target: {
      kind: "cargo",
      package: "supertaskr-index",
      cwd: path.join("app", "src-tauri"),
      args: ["arch"],
    },
    rootFlag: false,
    usage: "supertaskr arch [cycles | blast <path|slug> | drift]",
    source:
      "docs/CONVENTIONS.md app/src-tauri bullet: " +
      "`cargo run -p supertaskr-index -- arch --root ../..` and its family",
  }),
  Object.freeze({
    verb: "evals",
    summary: "the method eval gate, over the convention's own text",
    target: { kind: "project", file: path.join("tools", "method-evals", "run.mjs"), args: [] },
    rootFlag: false,
    usage: "supertaskr evals [--selftest]",
    source:
      "docs/CONVENTIONS.md METHOD EVAL GATE, its own ONE SPELLING: " +
      "`node tools/method-evals/run.mjs`",
  }),
  Object.freeze({
    verb: "undo",
    summary: "revert one card's merge, after saying what has landed on its fence since",
    target: { kind: "script", file: "undo.mjs", args: [] },
    rootFlag: true,
    alsoNeeds: ["fence-expander"],
    usage: "supertaskr undo <T-NNN> [--force <sha>]... [--dry-run]",
    source: "T-244's folded criterion (GSD Core's safe undo, @human 2026-09-08)",
  }),
  Object.freeze({
    verb: "merge",
    summary: "the integrator's ritual, in its order, stopping with the merge staged",
    target: { kind: "script", file: "merge.mjs", args: [] },
    rootFlag: true,
    usage:
      "supertaskr merge <T-NNN> --slug <slug> --verdict <sha> " +
      "--built-by <m@k> --verified-by <m@k> [--dry-run]",
    source: "docs/ARCHITECTURE.md C-02 (`merge`); T-244's folded room items 18 and 27",
  }),
  Object.freeze({
    verb: "install",
    summary: "install this project's skills into an agent harness",
    target: { kind: "builtin", file: "cli.mjs", args: [] },
    rootFlag: true,
    usage: `supertaskr install [--harness ${HARNESSES.map((h) => h.id).join("|")}] [--force] [--dry-run]`,
    source: "T-244's folded criterion (the v1 installer targets Claude Code and Codex)",
  }),
]));

/**
 * The C-02 verbs docs/ARCHITECTURE.md's system map names, and what this
 * package does about each. NAMED rather than silently dropped: a front
 * that quietly exposes three of five is a front nobody can audit.
 */
export const ARCHITECTURE_VERBS = Object.freeze({
  init: "NOT FRONTED — genesis is the app's spawned planner (ADR-017); no script exists to front",
  next: "next",
  verify: "NOT FRONTED — verification is the two-spawn bench (orchestrator 5d), not a script",
  merge: "merge",
  status: "status",
});

/** @param {string} verb @returns {VerbEntry | undefined} */
export function findVerb(verb) {
  return VERBS.find((v) => v.verb === verb);
}

/**
 * The command one verb would run, as data. Pure — it spawns nothing, and
 * the spec reads it to prove each verb reaches its script BY NAME.
 *
 * @param {{ entry: VerbEntry, args: string[], projectRoot: string }} input
 * @returns {{ command: string, argv: string[], cwd: string, names: string }}
 */
export function planFor(input) {
  const { entry, args, projectRoot } = input;
  if (entry.target.kind === "project") {
    const file = path.join(projectRoot, entry.target.file);
    return {
      command: process.execPath,
      argv: [file, ...entry.target.args, ...args],
      cwd: projectRoot,
      names: entry.target.file,
    };
  }
  if (entry.target.kind === "cargo") {
    return {
      command: "cargo",
      argv: ["run", "-p", entry.target.package, "--", ...entry.target.args, ...args],
      cwd: path.join(projectRoot, entry.target.cwd),
      names: entry.target.package,
    };
  }
  const file = path.join(packageRoot, "scripts", entry.target.file);
  const rootArgs = entry.rootFlag ? ["--root", projectRoot] : [];
  // A LEADING POSITIONAL BECOMES THE FLAG THE TARGET NAMES. `brief.mjs`
  // refuses a positional by design — "a positional this command guessed
  // at is a brief row filled from somewhere other than its source" — so
  // `supertaskr card T-150` has to arrive there as `--card T-150`. The
  // mapping is DECLARED per verb rather than guessed: a verb with no
  // `positionalFlag` passes its arguments through untouched, which is
  // what `undo` and `merge`, whose own scripts take a positional, need.
  const rest =
    entry.positionalFlag !== undefined && args.length > 0 && !(args[0] ?? "").startsWith("-")
      ? [entry.positionalFlag, ...args]
      : [...args];
  return {
    command: process.execPath,
    argv: [file, ...entry.target.args, ...rootArgs, ...rest],
    cwd: projectRoot,
    names: path.relative(packageRoot, file),
  };
}

/**
 * Would this verb read the wrong tree?
 *
 * A target that takes `--root` is told which project it is about. One
 * that does not computes its own root off `import.meta.url`, so an
 * installed package would answer about `node_modules/`. The refusal is
 * the honest outcome; running it is the dangerous one.
 *
 * @param {VerbEntry} entry
 * @param {string} projectRoot
 * @returns {string | null}
 */
export function rootMismatch(entry, projectRoot) {
  if (entry.rootFlag) return null;
  if (entry.target.kind === "cargo" || entry.target.kind === "project") return null;
  if (path.resolve(projectRoot) === path.resolve(packageRepoRoot)) return null;
  return (
    `supertaskr ${entry.verb}: REFUSED — ${entry.target.file} resolves the repository root ` +
    "from its own location and takes no --root, so from this installed copy it would " +
    `answer about ${packageRepoRoot} and not about ${projectRoot}. Run it from inside the ` +
    "project's own checkout of the tooling, or ask for a verb that takes --root " +
    `(${VERBS.filter((v) => v.rootFlag).map((v) => v.verb).join(", ")}).`
  );
}

// ── the runner ───────────────────────────────────────────────────────

/** @param {readonly VerbEntry[]} verbs @returns {string} */
export function usageText(verbs = VERBS) {
  const width = Math.max(...verbs.map((v) => v.verb.length));
  return [
    "usage: supertaskr <verb> [args...]",
    "",
    "  Every verb is a FRONT for a command this project already has; the",
    "  child's exit code is this command's exit code, unchanged.",
    "",
    ...verbs.map((v) => `  ${v.verb.padEnd(width)}  ${v.summary}`),
    "",
    "  supertaskr <verb> --help prints that verb's own usage and its source.",
    `  exit codes: ${Object.entries(EXIT)
      .map(([k, n]) => `${String(n)} ${k.toLowerCase().replace("_", " ")}`)
      .join(" · ")}`,
  ].join("\n");
}

/**
 * @param {string[]} argv
 * @param {{ cwd?: string, stdout?: (s: string) => void, stderr?: (s: string) => void, spawn?: typeof spawnSync }} [io]
 * @returns {number}
 */
export function main(argv, io = {}) {
  const out = io.stdout ?? ((/** @type {string} */ s) => process.stdout.write(`${s}\n`));
  const err = io.stderr ?? ((/** @type {string} */ s) => process.stderr.write(`${s}\n`));
  const spawn = io.spawn ?? spawnSync;
  const cwd = io.cwd ?? process.cwd();

  /** @type {string[]} */
  const rest = [];
  /** @type {string | undefined} */
  let rootOverride;
  /** @type {string | undefined} */
  let verb;
  for (let i = 0; i < argv.length; i += 1) {
    const a = /** @type {string} */ (argv[i]);
    if (verb === undefined && a === "--root") {
      rootOverride = argv[i + 1];
      i += 1;
      continue;
    }
    if (verb === undefined && !a.startsWith("-")) {
      verb = a;
      continue;
    }
    if (verb === undefined && (a === "--help" || a === "-h")) {
      out(usageText());
      return EXIT.CLEAN;
    }
    if (verb === undefined) {
      err(`supertaskr: ${a} is not a verb.\n\n${usageText()}`);
      return EXIT.USAGE;
    }
    if (a === "--root") {
      rootOverride = argv[i + 1];
      i += 1;
      continue;
    }
    rest.push(a);
  }

  if (verb === undefined) {
    out(usageText());
    return EXIT.USAGE;
  }
  const entry = findVerb(verb);
  if (entry === undefined) {
    err(
      `supertaskr: unknown verb ${JSON.stringify(verb)} — ` +
        `known verbs are ${VERBS.map((v) => v.verb).join(", ")}.\n\n${usageText()}`,
    );
    return EXIT.USAGE;
  }

  const projectRoot = rootOverride === undefined ? findProjectRoot(cwd) : path.resolve(rootOverride);
  if (projectRoot === null) {
    err(
      `supertaskr ${verb}: no supertaskr project above ${cwd} — a project root carries ` +
        `${ROOT_MARKERS.join("/ and ")}/, or docs/ beside a .git. Pass --root <path> to name one.`,
    );
    return EXIT.CANNOT_RUN;
  }
  if (!existsSync(projectRoot) || !statSync(projectRoot).isDirectory()) {
    err(`supertaskr ${verb}: --root ${projectRoot} is not a directory.`);
    return EXIT.USAGE;
  }

  if (rest.includes("--help") && entry.target.kind !== "cargo") {
    out(
      [
        entry.usage ?? `supertaskr ${entry.verb}`,
        `  ${entry.summary}`,
        `  fronts: ${planFor({ entry, args: [], projectRoot }).names}`,
        `  source: ${entry.source}`,
      ].join("\n"),
    );
    return EXIT.CLEAN;
  }

  const mismatch = rootMismatch(entry, projectRoot);
  if (mismatch !== null) {
    err(mismatch);
    return EXIT.CANNOT_RUN;
  }

  const missing = requirementsFor(entry, projectRoot);
  if (missing.length > 0) {
    err(
      [
        `supertaskr ${entry.verb}: CANNOT RUN — this verb needs something this tree does not have yet.`,
        ...missing.map((m) => `  ${m.what}\n    build it: ${m.build}`),
        "  Nothing was run.",
      ].join("\n"),
    );
    return EXIT.CANNOT_RUN;
  }

  if (entry.target.kind === "builtin") return runInstall(rest, { projectRoot, out, err });

  const plan = planFor({ entry, args: rest, projectRoot });
  const child = spawn(plan.command, plan.argv, { cwd: plan.cwd, stdio: "inherit" });
  if (child.error !== undefined && child.error !== null) {
    err(`supertaskr ${entry.verb}: ${plan.names} could not be started — ${child.error.message}`);
    return EXIT.CANNOT_RUN;
  }
  if (child.signal !== null && child.signal !== undefined) {
    err(`supertaskr ${entry.verb}: ${plan.names} was killed by ${child.signal}`);
    return EXIT.CANNOT_RUN;
  }
  return child.status ?? EXIT.CANNOT_RUN;
}

/**
 * The installer, which is the only verb whose logic lives here — because
 * there is no script in this tree to front for it.
 *
 * @param {string[]} args
 * @param {{ projectRoot: string, out: (s: string) => void, err: (s: string) => void }} io
 * @returns {number}
 */
export function runInstall(args, io) {
  const { projectRoot, out, err } = io;
  const dryRun = args.includes("--dry-run");
  /** @type {Harness[]} */
  const wanted = [];
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === "--harness") {
      const id = args[i + 1];
      const harness = HARNESSES.find((h) => h.id === id);
      if (harness === undefined) {
        err(
          `supertaskr install: unknown harness ${JSON.stringify(id ?? "")} — v1 targets ` +
            `${HARNESSES.map((h) => `${h.id} (${h.name})`).join(" and ")}. A third harness is ` +
            "one entry in HARNESSES, never a rewrite.",
        );
        return EXIT.USAGE;
      }
      wanted.push(harness);
      i += 1;
    }
  }
  const harnesses = wanted.length > 0 ? wanted : HARNESSES;
  const skills = shippedSkills(projectRoot);
  if (skills.length === 0) {
    err(
      `supertaskr install: this project ships no skills — ${SKILL_SOURCE_DIR}/ carries no ` +
        "<name>/SKILL.md. Nothing was written.",
    );
    return EXIT.CANNOT_RUN;
  }
  const plan = installPlan({ harnesses, skills });
  for (const step of plan) {
    out(`${step.harness}: ${step.from} -> ${step.to}    (${step.invoke})`);
  }
  if (dryRun) {
    out(`supertaskr install: --dry-run, ${String(plan.length)} file(s) NOT written.`);
    return EXIT.CLEAN;
  }
  // IT REFUSES TO CLOBBER (the verifier's bench at f809cd9: a hand-edited
  // destination was overwritten with no backup and no warning, and the
  // output said "written" either way). A destination whose bytes already
  // match is a no-op; one that differs is somebody's edit.
  const collisions = plan.filter((step) => {
    const to = path.join(projectRoot, step.to);
    if (!existsSync(to)) return false;
    return readFileSync(to, "utf8") !== readFileSync(path.join(projectRoot, step.from), "utf8");
  });
  if (collisions.length > 0 && !args.includes("--force")) {
    err(
      `supertaskr install: REFUSED — ${String(collisions.length)} destination(s) already exist ` +
        "and differ from what would be written:\n" +
        collisions.map((c) => `  ${c.to}`).join("\n") +
        "\n  Nothing was written. Re-run with --force to overwrite them.",
    );
    return EXIT.FOUND;
  }
  for (const step of plan) {
    const from = path.join(projectRoot, step.from);
    const to = path.join(projectRoot, step.to);
    mkdirSync(path.dirname(to), { recursive: true });
    copyFileSync(from, to);
  }
  out(`supertaskr install: ${String(plan.length)} file(s) written.`);
  return EXIT.CLEAN;
}
