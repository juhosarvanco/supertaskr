import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { parse as parseYaml } from "yaml";
// THE LIBRARY ITSELF, BY THE SAME BUILT ENTRY THE COMMAND READS — so the
// body below compares the surface against the module rather than against
// the arm's re-export of it (T-300-s6). `brief.spec.ts` loads it the same
// way for the arm.
import * as parserPure from "../../../lib/parser/dist/pure.js";
import { repoRoot } from "../preflight";
import {
  ARCHITECTURE_VERBS,
  EXIT,
  HARNESSES,
  VERBS,
  bareDependencies,
  buildCommandFor,
  conventionCommandsFor,
  findProjectRoot,
  installPlan,
  main as cliMain,
  packageEscapes,
  packageRoot,
  planFor,
  requirementsFor,
  rootMismatch,
} from "../scripts/cli.mjs";
import {
  ACKNOWLEDGE_PREFIX,
  MUTANT_KEYS,
  MUTANT_NEW,
  MUTANT_OLD,
  bringsBuiltSources,
  drillSteps,
  failingBodies,
  gradeDrill,
  graphPinLine,
  movesGraph,
  newestVerdict,
  plantMutant,
  preludePlan,
  readMutantBlocks,
  runMutantDrill,
  setupSteps,
  specRunner,
  stampDone,
  tailPlan,
  main as mergeMain,
} from "../scripts/merge.mjs";
import {
  forceVerdict,
  insideFence,
  main as undoMain,
  mentionsCard,
  touchesTokens,
} from "../scripts/undo.mjs";
import {
  PROCESS_SCHEMA,
  RUNTIME_TEMPLATE,
  GrantStoreFinding,
  cardDrift,
  grantState,
  grantStoreLocation,
  loadProcess,
  parseProcessSchema,
  processSection,
  resolveProcess,
} from "../scripts/dispatch-brief.mjs";
import {
  REFERENCE_DOC,
  bandUnits,
  editTemplate,
  main as settingsMain,
  measuredFor,
  renderReference,
  setPlan,
  settingsRows,
  treeReadings,
  yamlScalar,
} from "../scripts/settings.mjs";
import { TIER_BUDGETS, fmt } from "../scripts/health-bands.mjs";
import { conventionsText, docsReaders } from "../scripts/docs-scan.mjs";
import { NO_BACKGROUND_MAINTENANCE, removeGitFixture } from "./git-fixture";

/**
 * `npx supertaskr` — THE FRONT'S OWN SPEC (T-244, C-02).
 *
 * ── WHAT THIS FILE IS FOR ────────────────────────────────────────────
 * The card's first criterion is not "the CLI works". It is that the
 * package MOVES NO LOGIC — *"no logic moves, no script is rewritten; the
 * package is a front, and a test SHALL prove each verb reaches its
 * script by name"*. A front is a claim about a RELATION between two
 * things, so almost every body here is a comparison rather than an
 * assertion about an output:
 *
 *   · each verb's target is resolved ON DISK, not trusted from the table;
 *   · each `--root` claim is read out of the target script's own source;
 *   · each verb sourced from docs/CONVENTIONS.md quotes a command that
 *     document really carries, checked against the document;
 *   · this package's reading of those command bullets is checked against
 *     THE DOCUMENT, bullet by bullet. `workflow-parity.spec.ts` reads
 *     the same bullets for CI, and T-057's rule is that a rule with two
 *     implementations is two chances to disagree — but Playwright
 *     REFUSES to let one test file import another ("test file X should
 *     not import test file Y"), so the two readers cannot be compared to
 *     each other here. They are each compared to their shared source
 *     instead, which is the stronger form of the same remedy: neither
 *     reader is the other's authority, and the document is;
 *   · the exit code a verb returns is the CHILD'S, driven through a
 *     spawn this spec supplies, over the whole four-code house set.
 *
 * ── AND THE PROOF THAT IT IS INSTALLABLE IS AN INSTALL ───────────────
 * One body packs this package with `npm pack` and installs the tarball
 * into a scratch project that is NOT this repository, then runs
 * `npx supertaskr` there. Nothing is published — publishing is @human's
 * (T-266) — and the card says so in as many words.
 */

/** The scratch trees this file builds, removed in a teardown that cannot red a body. */
const FIXTURE = "cli.spec.ts";

/** This project's conventions — the index spliced with its chapters (T-290) — read off
 *  this checkout at body time. */
function conventions(): string {
  return conventionsText(repoRoot);
}

/** The `run from <dir>/:` markers the "Build & test" section carries, in order. */
function commandBulletDirs(md: string): string[] {
  const start = md.indexOf("## Build & test");
  const rest = md.slice(start + "## Build & test".length);
  const end = rest.indexOf("\n## ");
  const section = end < 0 ? rest : rest.slice(0, end);
  return section
    .split(/\n(?=- )/)
    .map((b) => /run from ([A-Za-z0-9._/-]+)\/:/.exec(b.replace(/\s+/g, " ")))
    .filter((m): m is RegExpExecArray => m !== null)
    .map((m) => m[1] ?? "");
}

/** @returns a fresh scratch directory that looks like a genesis-created project. */
function scratchProject(): string {
  const root = mkdtempSync(path.join(tmpdir(), "supertaskr-cli-"));
  mkdirSync(path.join(root, "docs"), { recursive: true });
  mkdirSync(path.join(root, "method"), { recursive: true });
  return root;
}

/** The four house exit codes, plus one a suite runner really produces. */
const EXIT_CODES = [0, 1, 2, 3, 101] as const;

test("npx supertaskr dispatches every verb to a target this tree already carries, resolved on disk", () => {
  expect(VERBS.length, "the verb table is not empty").toBeGreaterThan(0);
  for (const entry of VERBS) {
    const plan = planFor({ entry, args: [], projectRoot: repoRoot });
    if (entry.target.kind === "cargo") {
      // A cargo verb names a PACKAGE; the manifest that declares it is
      // what has to exist, and `-p <name>` is what reaches it.
      const manifest = path.join(repoRoot, entry.target.cwd, "Cargo.toml");
      expect(existsSync(manifest), `${entry.verb} needs ${entry.target.cwd}/Cargo.toml`).toBe(true);
      expect(plan.argv.slice(0, 3), `${entry.verb} reaches its crate by name`).toEqual([
        "run",
        "-p",
        entry.target.package,
      ]);
      continue;
    }
    // A `project` target belongs to the PROJECT, not to this package, and
    // is resolved against the project root — which is what makes it
    // correct from an installed copy as well as from a checkout.
    const target =
      entry.target.kind === "project"
        ? path.join(repoRoot, entry.target.file)
        : path.join(packageRoot, "scripts", entry.target.file);
    expect(existsSync(target), `${entry.verb} fronts ${entry.target.file}, which must exist`).toBe(
      true,
    );
    expect(plan.argv[0], `${entry.verb} reaches ${entry.target.file} by name`).toBe(target);
  }
});

test("the front relabels no exit code — the child's status is the command's status", () => {
  for (const code of EXIT_CODES) {
    const calls: string[][] = [];
    const status = cliMain(["gate", "e2e"], {
      cwd: repoRoot,
      stdout: () => {},
      stderr: () => {},
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- a stub for spawnSync's shape
      spawn: ((command: string, argv: string[]) => {
        calls.push([command, ...argv]);
        return { status: code, signal: null, error: undefined };
      }) as never,
    });
    expect(status, `a child exiting ${String(code)} makes this command exit ${String(code)}`).toBe(
      code,
    );
    expect(calls.length, "exactly one child was spawned").toBe(1);
    expect(calls[0]?.join(" "), "and it was the gate runner, by name").toContain("gate-run.mjs");
  }
});

test("an unknown verb is refused with the whole verb list, and nothing is spawned", () => {
  const said: string[] = [];
  let spawned = 0;
  const status = cliMain(["definitely-not-a-verb"], {
    cwd: repoRoot,
    stdout: (s) => said.push(s),
    stderr: (s) => said.push(s),
    spawn: (() => {
      spawned += 1;
      return { status: 0, signal: null, error: undefined };
    }) as never,
  });
  expect(status).toBe(EXIT.USAGE);
  expect(spawned, "a refusal spawns nothing").toBe(0);
  for (const entry of VERBS) expect(said.join("\n")).toContain(entry.verb);
});

test("every verb that hands its target --root fronts a script whose own flags carry it", () => {
  for (const entry of VERBS) {
    if (entry.target.kind === "cargo") continue;
    const source = readFileSync(
      entry.target.kind === "project"
        ? path.join(repoRoot, entry.target.file)
        : path.join(packageRoot, "scripts", entry.target.file),
      "utf8",
    );
    const takesRoot = /"--root"/.test(source);
    expect(
      entry.rootFlag,
      `${entry.verb} claims rootFlag ${String(entry.rootFlag)} but ${entry.target.file} ` +
        `${takesRoot ? "does" : "does not"} carry "--root"`,
    ).toBe(takesRoot);
  }
});

test("the verb set covers the seat's own arms and NAMES the C-02 verbs nothing fronts", () => {
  // THE ARMS ARE READ OUT OF brief.mjs, never listed here: the card says
  // the verb set is DERIVED from the commands the skills call, and
  // `brief.mjs`'s own FLAGS list is where those commands are declared.
  const brief = readFileSync(path.join(packageRoot, "scripts", "brief.mjs"), "utf8");
  const flags = [...brief.matchAll(/^\s{2}"(--[a-z-]+)",$/gm)].map((m) => m[1]);
  expect(flags.length, "brief.mjs's flag list was found").toBeGreaterThan(5);
  const covered = VERBS.flatMap((v) =>
    v.target.kind === "script" ? [...v.target.args, v.positionalFlag ?? "", v.usage ?? ""] : [],
  ).join(" ");
  // The arms that ARE a command of their own — the ones a skill invokes.
  for (const arm of ["--state", "--dispatch", "--card", "--preflight", "--write-fence", "--take-seat", "--dispatch-lane"]) {
    expect(flags, `brief.mjs really declares ${arm}`).toContain(arm);
    expect(covered, `some verb reaches ${arm}`).toContain(arm);
  }
  // docs/ARCHITECTURE.md's C-02 line names five verbs. Three are fronted;
  // the two that are not are NAMED as such rather than dropped, because a
  // front that silently exposes three of five is one nobody can audit.
  const architecture = readFileSync(path.join(repoRoot, "docs", "ARCHITECTURE.md"), "utf8");
  expect(architecture, "the C-02 line still names the five").toContain(
    "init/next/verify/merge/status",
  );
  expect(Object.keys(ARCHITECTURE_VERBS).sort()).toEqual(
    ["init", "merge", "next", "status", "verify"],
  );
  for (const [name, disposition] of Object.entries(ARCHITECTURE_VERBS)) {
    if (disposition.startsWith("NOT FRONTED")) {
      expect(VERBS.map((v) => v.verb), `${name} is honestly absent`).not.toContain(name);
      continue;
    }
    // THE DISPOSITION IS THE VERB'S OWN NAME OR IT IS A RENAME, and a
    // rename here would let a C-02 verb be claimed as fronted by some
    // OTHER verb that happens to exist. A poison drill found exactly
    // that: `init: "next"` left this body green, because "next" is a
    // real verb. The front does not rename a C-02 verb, so the identity
    // is the assertion.
    expect(disposition, `${name} is fronted under its own name, not renamed`).toBe(name);
    expect(VERBS.map((v) => v.verb), `${name} is fronted as ${disposition}`).toContain(disposition);
  }
});

test("each verb sourced from docs/CONVENTIONS.md quotes a command that document really carries", () => {
  // Whitespace-normalised on both sides, because the document WRAPS: a
  // command spanning two lines is the same command, and a body that
  // compared raw bytes would be measuring the line width.
  const flat = conventions().replace(/\s+/g, " ");
  let checked = 0;
  for (const entry of VERBS) {
    // T-290: a verb's source names the CHAPTER its rule lives in now,
    // and docs/CONVENTIONS.md is the index over those chapters. BOTH
    // spellings name this project's conventions, and this body reads the
    // SPLICED document either way — a filter that knew only the old one
    // would have left the `checked` floor below to catch a body that had
    // quietly stopped checking anything.
    if (!/docs\/CONVENTIONS\.md|docs\/conventions\//.test(entry.source)) continue;
    const quoted = [...entry.source.matchAll(/`([^`]+)`/g)].map((m) => (m[1] ?? "").replace(/\s+/g, " "));
    expect(quoted.length, `${entry.verb}'s source quotes at least one command`).toBeGreaterThan(0);
    for (const command of quoted) {
      expect(
        flat.includes(command),
        `${entry.verb} cites \`${command}\`, which this project's conventions must carry`,
      ).toBe(true);
      checked += 1;
    }
  }
  expect(checked, "this body really checked something").toBeGreaterThan(5);
  // NOT VACUOUS: a command the document does not carry is caught.
  expect(flat.includes("npm run definitely-not-a-command")).toBe(false);
});

test("the front reads every command bullet docs/CONVENTIONS.md carries, and reads it verbatim", () => {
  const md = conventions();
  const dirs = commandBulletDirs(md);
  expect(dirs, "the four packages the document carries a command bullet for").toEqual([
    "lib/parser",
    "app",
    "app/src-tauri",
    "tools/e2e",
  ]);
  const flat = md.replace(/\s+/g, " ");
  for (const dir of dirs) {
    const commands = conventionCommandsFor(md, dir);
    expect(commands.length, `${dir}/'s bullet yields commands`).toBeGreaterThan(0);
    for (const command of commands) {
      expect(flat.includes(command), `\`${command}\` is the document's own spelling`).toBe(true);
    }
  }
  // The fresh-clone ORDER this front's build messages lean on, read off
  // the document rather than remembered.
  expect(conventionCommandsFor(md, "lib/parser")[0], "the parser installs first").toBe("npm ci");
  expect(conventionCommandsFor(md, "lib/parser"), "and builds").toContain("npm run build");
  expect(conventionCommandsFor(md, "no/such/package"), "a package with no bullet").toEqual([]);

  // NOT VACUOUS, IN BOTH DIRECTIONS. A reworded command moves the answer,
  // and a command that loses its backticks disappears from it — the same
  // silent shape CI parity's own fixtures name.
  const reworded = md.replace("`npx vitest run`", "`npx vitest run --silent`");
  expect(conventionCommandsFor(reworded, "lib/parser")).toContain("npx vitest run --silent");
  expect(conventionCommandsFor(reworded, "lib/parser")).not.toContain("npx vitest run");
  const unbackticked = md.replace("`npm ci` ·\n  `npx vitest run`", "npm ci ·\n  `npx vitest run`");
  expect(
    conventionCommandsFor(unbackticked, "lib/parser"),
    "a command that lost its backticks ends the list where it stands",
  ).toEqual([]);
});


test("a verb needing an install says which command builds it, and runs nothing", () => {
  const project = scratchProject();
  const emptyPackage = mkdtempSync(path.join(tmpdir(), "supertaskr-pkg-"));
  try {
    // The package's scripts are copied but its node_modules is not, which
    // is exactly the ninety-second-old worktree docs/CONVENTIONS.md
    // describes.
    mkdirSync(path.join(emptyPackage, "scripts"), { recursive: true });
    for (const file of ["docs-gate.mjs", "docs-scan.mjs"]) {
      copyFileSync(path.join(packageRoot, "scripts", file), path.join(emptyPackage, "scripts", file));
    }
    const docsGate = VERBS.find((v) => v.verb === "docs-gate");
    expect(docsGate, "the docs-gate verb is in the table").toBeDefined();
    const missing = requirementsFor(docsGate!, repoRoot, emptyPackage);
    const deps = missing.find((m) => m.id === "package-deps");
    expect(deps, "a script with a bare import and no node_modules is a requirement").toBeDefined();
    expect(
      bareDependencies(path.join(packageRoot, "scripts", "docs-gate.mjs")),
      "and the requirement is DERIVED from the script's own imports",
    ).toContain("yaml");
    expect(deps?.build, "the message carries the one command that builds it").toBe(
      buildCommandFor("tools/e2e", repoRoot),
    );
    expect(deps?.build).toContain("npm ci");

    // THE POSITIVE CONTROL. The same verb, against the package as it
    // really is, owes nothing — so the sentence above is about the
    // missing node_modules and not about the verb.
    expect(
      requirementsFor(docsGate!, repoRoot, packageRoot).map((m) => m.id),
      "the same verb against a package that IS installed owes nothing",
    ).toEqual([]);

    // And the whole command refuses rather than spawning.
    let spawned = 0;
    const said: string[] = [];
    const status = cliMain(["undo", "T-000", "--root", project], {
      cwd: project,
      stdout: (s) => said.push(s),
      stderr: (s) => said.push(s),
      spawn: (() => {
        spawned += 1;
        return { status: 0, signal: null, error: undefined };
      }) as never,
    });
    expect(status, "a verb whose need is unmet cannot run").toBe(EXIT.CANNOT_RUN);
    expect(spawned, "and nothing was spawned").toBe(0);
    expect(said.join("\n")).toContain("Nothing was run.");
    expect(said.join("\n")).toContain("expand-fence.mjs");
  } finally {
    removeGitFixture(project, FIXTURE);
    removeGitFixture(emptyPackage, FIXTURE);
  }
});

test("a verb whose script resolves its own repository root is refused from an installed copy", () => {
  const project = scratchProject();
  try {
    for (const entry of VERBS) {
      const verdict = rootMismatch(entry, project);
      if (entry.rootFlag || entry.target.kind === "cargo" || entry.target.kind === "project") {
        // A `project` target is RESOLVED against the project root, so it
        // cannot answer about the package's own tree and needs no refusal.
        expect(verdict, `${entry.verb} is told which project it is about`).toBeNull();
        continue;
      }
      expect(verdict, `${entry.verb} would answer about the wrong tree, so it is refused`).not.toBeNull();
      expect(verdict).toContain(entry.target.file);
      expect(verdict).toContain(project);
    }
    // THE POSITIVE CONTROL: inside this repository the two roots agree
    // and nothing is refused, so the refusal above is about the MISMATCH.
    for (const entry of VERBS) {
      expect(rootMismatch(entry, repoRoot), `${entry.verb} runs in its own checkout`).toBeNull();
    }
  } finally {
    removeGitFixture(project, FIXTURE);
  }
});

test("the project root is found by walking up, and its absence is said rather than guessed", () => {
  const project = scratchProject();
  try {
    const deep = path.join(project, "a", "b", "c");
    mkdirSync(deep, { recursive: true });
    expect(findProjectRoot(deep), "a nested directory resolves to the project root").toBe(project);
    const bare = mkdtempSync(path.join(tmpdir(), "supertaskr-bare-"));
    try {
      expect(findProjectRoot(bare), "a directory that is no project answers null").toBeNull();
      const said: string[] = [];
      const status = cliMain(["status"], { cwd: bare, stdout: (s) => said.push(s), stderr: (s) => said.push(s) });
      expect(status).toBe(EXIT.CANNOT_RUN);
      expect(said.join("\n")).toContain("no supertaskr project above");
    } finally {
      removeGitFixture(bare, FIXTURE);
    }
  } finally {
    removeGitFixture(project, FIXTURE);
  }
});

test("the installer targets Claude Code and Codex, and a third harness is one adapter entry", () => {
  expect(HARNESSES.map((h) => h.id), "v1's two harnesses").toEqual(["claude", "codex"]);
  const two = installPlan({ harnesses: HARNESSES, skills: ["seat"] });
  expect(two.map((s) => s.to)).toEqual([
    path.join(".claude", "skills", "seat", "SKILL.md"),
    path.join(".codex", "prompts", "seat.md"),
  ]);
  for (const step of two) expect(step.from).toBe(path.join("method", "skills", "seat", "SKILL.md"));

  // THE CRITERION, AS A MEASUREMENT: a third harness is ONE ENTRY. This
  // extends the table with a fabricated adapter and runs the SAME
  // function — no branch anywhere reads a harness id — and the plan grows
  // by exactly one step per skill.
  const third = {
    id: "invented",
    name: "A Third Harness",
    dir: path.join(".invented", "commands"),
    file: (skill: string) => `${skill}.prompt`,
    invoke: "however it is invoked",
    source: "this body, and nowhere else",
  };
  const three = installPlan({ harnesses: [...HARNESSES, third], skills: ["seat"] });
  expect(three.length, "one entry, one more step").toBe(two.length + 1);
  expect(three.at(-1)?.to).toBe(path.join(".invented", "commands", "seat.prompt"));
  expect(three.slice(0, two.length), "and the two that were there did not move").toEqual(two);
});

test("the docs gate sees the CLI package as a derived reader of docs/", () => {
  const readers = new Map(docsReaders().map((r) => [r.file, r]));
  const expected: [string, string][] = [
    ["tools/e2e/scripts/cli.mjs", "docs/CONVENTIONS.md"],
    ["tools/e2e/scripts/merge.mjs", "docs/CONVENTIONS.md"],
    ["tools/e2e/scripts/undo.mjs", "docs/tasks"],
  ];
  for (const [file, prefix] of expected) {
    const reader = readers.get(file);
    expect(reader, `${file} is a derived reader of docs/`).toBeDefined();
    expect(reader?.prefixes, `${file} reads ${prefix}`).toContain(prefix);
    expect(reader?.command, "and the suite it owes is this package's").toBe("npm test");
  }
});

test("npx supertaskr runs out of a packed tarball installed into a project that is not this repository", () => {
  test.setTimeout(300_000);
  const project = scratchProject();
  const packDir = mkdtempSync(path.join(tmpdir(), "supertaskr-pack-"));
  try {
    writeFileSync(
      path.join(project, "package.json"),
      `${JSON.stringify({ name: "a-genesis-project", version: "0.0.0", private: true }, null, 2)}\n`,
    );
    // NOTHING IS PUBLISHED. The card says so: publishing is @human's
    // (T-266), and the proof owed here is a LOCAL tarball.
    const packed = execFileSync("npm", ["pack", "--pack-destination", packDir], {
      cwd: packageRoot,
      encoding: "utf8",
    })
      .trim()
      .split("\n")
      .at(-1);
    expect(packed, "npm pack named a tarball").toBeTruthy();
    execFileSync("npm", ["install", "--no-audit", "--no-fund", "--offline", path.join(packDir, String(packed))], {
      cwd: project,
      encoding: "utf8",
    });
    const shim = path.join(project, "node_modules", ".bin", "supertaskr");
    expect(existsSync(shim), "the install links a `supertaskr` bin").toBe(true);

    const help = execFileSync("npx", ["supertaskr", "--help"], { cwd: project, encoding: "utf8" });
    expect(help, "npx supertaskr answers with its verbs").toContain("usage: supertaskr <verb>");
    for (const entry of VERBS) expect(help).toContain(entry.verb);

    // And an installed copy REFUSES the verbs whose scripts resolve their
    // own root, naming the two roots — never a stack trace.
    let refusal = "";
    try {
      execFileSync("npx", ["supertaskr", "docs-gate", "docs/STATE.md"], {
        cwd: project,
        encoding: "utf8",
        stdio: "pipe",
      });
      throw new Error("the installed copy should have refused docs-gate");
    } catch (err) {
      const e = err as { status?: number; stderr?: string };
      expect(e.status, "a refusal is exit 3, the house's CANNOT RUN").toBe(3);
      refusal = String(e.stderr ?? "");
    }
    expect(refusal).toContain("REFUSED");
    expect(refusal).toContain(project);
  } finally {
    removeGitFixture(project, FIXTURE);
    removeGitFixture(packDir, FIXTURE);
  }
});

// ── undo ─────────────────────────────────────────────────────────────

/**
 * A repository with one card, its lane merge, and optionally a later
 * merge on the same fence.
 */
function undoFixture(opts: {
  later: boolean;
  touches?: string;
  extraLane?: { id: string; file: string };
}): { root: string; later: string; git: (...args: string[]) => string } {
  const root = mkdtempSync(path.join(tmpdir(), "supertaskr-undo-"));
  const git = (...args: string[]): string =>
    execFileSync("git", ["-C", root, ...NO_BACKGROUND_MAINTENANCE, ...args], { encoding: "utf8" });
  // `-b main`, never bare `git init`: `init.defaultBranch` is MACHINE
  // config, and an unpinned fixture builds a different repository here
  // than on the runner (docs/CONVENTIONS.md).
  execFileSync("git", ["init", "-q", "-b", "main", root], { stdio: "pipe" });
  git("config", "user.email", "fixture@example.invalid");
  git("config", "user.name", "T-244 fixture");

  // The ONE expansion, copied whole: this fixture must expand a fence the
  // way the project does, and a second implementation here would be the
  // thing lane-protocol rule 5 forbids.
  mkdirSync(path.join(root, ".claude", "hooks"), { recursive: true });
  copyFileSync(
    path.join(repoRoot, ".claude", "hooks", "expand-fence.mjs"),
    path.join(root, ".claude", "hooks", "expand-fence.mjs"),
  );
  mkdirSync(path.join(root, "lib", "parser", "src"), { recursive: true });
  copyFileSync(
    path.join(repoRoot, "lib", "parser", "src", "fence.ts"),
    path.join(root, "lib", "parser", "src", "fence.ts"),
  );
  mkdirSync(path.join(root, "docs", "tasks"), { recursive: true });
  mkdirSync(path.join(root, "src"), { recursive: true });
  const card = path.join("docs", "tasks", "T-900-a-fenced-card.md");
  writeFileSync(
    path.join(root, card),
    ["---", "id: T-900", "status: building", `touches: [${opts.touches ?? "src/"}]`, "---", "", "body", ""].join("\n"),
  );
  writeFileSync(path.join(root, "src", "a.ts"), "export const a = 1;\n");
  git("add", "-A");
  git("commit", "-qm", "the tree before the lane");

  git("checkout", "-q", "-b", "task/T-900-a-fenced-card");
  writeFileSync(path.join(root, "src", "a.ts"), "export const a = 2;\n");
  // The lane stamps its own card, as the executor's step 6 requires, so
  // the merge really carries the card file as well as the lane's commit.
  writeFileSync(
    path.join(root, card),
    readFileSync(path.join(root, card), "utf8").replace("status: building", "status: verifying"),
  );
  git("add", "-A");
  git("commit", "-qm", "T-900: the lane's own commit, naming its card");
  git("checkout", "-q", "main");
  git("merge", "-q", "--no-ff", "-m", "Merge T-900", "task/T-900-a-fenced-card");

  let later = "";
  if (opts.later) {
    git("checkout", "-q", "-b", "task/T-901-another");
    writeFileSync(path.join(root, "src", "b.ts"), "export const b = 1;\n");
    git("add", "-A");
    git("commit", "-qm", "T-901: a later lane on the same fence");
    git("checkout", "-q", "main");
    git("merge", "-q", "--no-ff", "-m", "Merge T-901", "task/T-901-another");
    later = git("rev-parse", "HEAD").trim();
  }
  if (opts.extraLane !== undefined) {
    const { id, file } = opts.extraLane;
    writeFileSync(
      path.join(root, "docs", "tasks", file),
      ["---", `id: ${id}`, "status: building", "touches: [src/]", "---", "", "body", ""].join("\n"),
    );
    git("add", "-A");
    git("commit", "-qm", `file the ${id} card`);
  }
  return { root, later, git };
}

test("undo refuses while a later merge stands on the card's fence, and names it", () => {
  test.setTimeout(120_000);
  const { root, later } = undoFixture({ later: true });
  try {
    const said: string[] = [];
    const status = undoMain(["T-900", "--root", root, "--dry-run"], {
      cwd: root,
      out: (s) => said.push(s),
      err: (s) => said.push(s),
    });
    expect(status, "a fence with a later merge on it is a refusal, not a revert").toBe(EXIT.FOUND);
    const text = said.join("\n");
    expect(text).toContain("REFUSED");
    expect(text, "the later merge is NAMED").toContain(later.slice(0, 12));
    expect(text, "and so is the way to accept it").toContain(`--force ${later.slice(0, 12)}`);
    expect(text, "nothing was reverted").not.toContain("reverted ");

    // THE FORCE, WHICH IS NOT A BLANKET: naming that merge lets it through.
    const forced: string[] = [];
    const ok = undoMain(["T-900", "--root", root, "--dry-run", "--force", later], {
      cwd: root,
      out: (s) => forced.push(s),
      err: (s) => forced.push(s),
    });
    expect(ok, "the named later merge is accepted").toBe(EXIT.CLEAN);
    expect(forced.join("\n")).toContain("revert -m 1 --no-edit");
  } finally {
    removeGitFixture(root, FIXTURE);
  }
});

test("undo names the revert it would run when nothing has landed on the fence since", () => {
  test.setTimeout(120_000);
  const { root } = undoFixture({ later: false });
  try {
    const said: string[] = [];
    const status = undoMain(["T-900", "--root", root, "--dry-run"], {
      cwd: root,
      out: (s) => said.push(s),
      err: (s) => said.push(s),
    });
    expect(status, "a clean fence needs no --force").toBe(EXIT.CLEAN);
    const text = said.join("\n");
    expect(text, "the fence it compared is shown").toContain("fence:  src");
    expect(text, "0 later merges").toContain("0 later merge(s)");
    expect(text, "and the exact command is printed rather than run").toContain("revert -m 1 --no-edit");
  } finally {
    removeGitFixture(root, FIXTURE);
  }
});

test("a --force naming a commit that is not a later merge is a usage error, never a licence", () => {
  const later = { sha: "a".repeat(40), subject: "a later merge", paths: ["src/b.ts"] };
  const wrong = forceVerdict({ later: [later], forced: ["b".repeat(40)] });
  expect("refusal" in wrong && wrong.code, "naming the wrong commit is called wrong").toBe(EXIT.USAGE);
  const unnamed = forceVerdict({ later: [later], forced: [] });
  expect("refusal" in unnamed && unnamed.code, "naming nothing is a refusal with a verdict").toBe(
    EXIT.FOUND,
  );
  const right = forceVerdict({ later: [later], forced: [later.sha] });
  expect("ok" in right, "naming it exactly is accepted").toBe(true);
  const nothing = forceVerdict({ later: [], forced: [] });
  expect("ok" in nothing, "and an empty fence needs no naming at all").toBe(true);
});

test("a card's fence is read off its own touches line and compared by path domain", () => {
  expect(touchesTokens("touches: [tools/e2e/, README.md]\n")).toEqual(["tools/e2e/", "README.md"]);
  expect(touchesTokens("no touches line here\n")).toEqual([]);
  expect(insideFence("src/a.ts", ["src"]), "a file under the domain is inside").toBe(true);
  expect(insideFence("src", ["src"]), "the domain itself is inside").toBe(true);
  expect(insideFence("srcextra/a.ts", ["src"]), "a sibling with the same prefix is NOT").toBe(false);
});

// ── merge ────────────────────────────────────────────────────────────

test("a merge bringing app or lib sources reinstalls and rebuilds BEFORE any suite step", () => {
  const paths = ["app/src/a.ts", "lib/parser/src/b.ts", "docs/architecture/graph.json"];
  expect(bringsBuiltSources(paths)).toBe(true);
  const plan = tailPlan({ paths, projectRoot: repoRoot, id: "T-000" });
  const firstSuite = plan.findIndex((s) => s.kind === "suite");
  const lastSetup = plan.map((s) => s.kind).lastIndexOf("setup");
  expect(lastSetup, "the setup steps are in the plan").toBeGreaterThanOrEqual(0);
  expect(firstSuite, "so is a suite step").toBeGreaterThanOrEqual(0);
  expect(lastSetup, "and every setup step precedes every suite step").toBeLessThan(firstSuite);
  // The ORDER inside the setup is CONVENTIONS' fresh-clone order: the
  // parser first, because the app resolves it through the parser's own
  // node_modules and needs its dist/.
  const setup = plan.filter((s) => s.kind === "setup").map((s) => s.title);
  expect(setup.filter((t) => t.includes("lib/parser")).length).toBeGreaterThan(0);
  expect(setup.findIndex((t) => t.includes("lib/parser"))).toBeLessThan(
    setup.findIndex((t) => t.includes("from app/")),
  );
  // And the commands are the document's own, not this file's memory.
  const derived = setupSteps(repoRoot).map((s) => s.title);
  expect(derived.some((t) => t.startsWith("npm ci from lib/parser/"))).toBe(true);
});

test("a merge that moves the committed graph runs the dogfood bodies before the stop", () => {
  const paths = ["docs/architecture/graph.json"];
  expect(movesGraph(paths)).toBe(true);
  const plan = tailPlan({ paths, projectRoot: repoRoot, id: "T-000" });
  const dogfood = plan.findIndex((s) => s.id === "dogfood");
  const stop = plan.findIndex((s) => s.kind === "stop");
  expect(dogfood, "the dogfood step is planned").toBeGreaterThanOrEqual(0);
  expect(dogfood, "and it runs before the commit is handed back").toBeLessThan(stop);
  expect(plan[dogfood]?.run?.argv.join(" ")).toContain("architecture-dogfood.test.ts");
  expect(plan[dogfood]?.run?.argv.join(" ")).toContain("map-dogfood-render.test.tsx");
  expect(plan[dogfood]?.why, "and the pins are re-derived, never rewritten").toContain("never rewrite a pin");
});

test("a merge carrying neither built sources nor the graph plans neither step", () => {
  // THE POSITIVE CONTROL for the two bodies above: the same planner, on a
  // documentation-only merge, leaves both out — so their presence there
  // is about the paths and not about the planner.
  const plan = tailPlan({
    paths: ["docs/tasks/T-000-a-card.md", "README.md"],
    projectRoot: repoRoot,
    id: "T-000",
  });
  expect(plan.some((s) => s.kind === "setup"), "no reinstall is planned").toBe(false);
  expect(plan.some((s) => s.id === "dogfood"), "no dogfood run is planned").toBe(false);
  expect(plan.some((s) => s.id === "docs-gate"), "but the docs gate still is").toBe(true);
  expect(plan.at(-1)?.kind, "and the plan still ends with the STOP").toBe("stop");
});

test("the front reaches nothing outside its own package that it does not name", () => {
  // The measured failure this closes: `npx supertaskr status` out of a
  // packed tarball died with ERR_MODULE_NOT_FOUND on
  // `node_modules/.claude/hooks/lane-fence.mjs`. The escapes are derived,
  // and in THIS checkout every one of them is present — so the same
  // derivation that refuses in an installed copy owes nothing here.
  for (const entry of VERBS) {
    if (entry.target.kind !== "script") continue;
    const escapes = packageEscapes(path.join(packageRoot, "scripts", entry.target.file), packageRoot);
    for (const escape of escapes) {
      expect(existsSync(escape), `${entry.verb} reaches ${escape}, which is in this checkout`).toBe(
        true,
      );
    }
  }
  // The derivation is not vacuous: brief.mjs really does leave the package.
  expect(
    packageEscapes(path.join(packageRoot, "scripts", "brief.mjs"), packageRoot).length,
    "brief.mjs imports from outside tools/e2e, which is why an installed copy must be told",
  ).toBeGreaterThan(0);
  expect(
    packageEscapes(path.join(packageRoot, "scripts", "token-scan.mjs"), packageRoot),
    "and the zero-dependency scanner leaves it not at all",
  ).toEqual([]);
});

// ── the properties the verifier's bench found unaimed (2026-09-09) ─────
//
// Five bodies below exist because two of the verifier's own mutants
// SURVIVED this suite at f809cd9 — the front passing NO arguments at all,
// and the executed revert taking `-m 2` — and because four defects in the
// two verbs that are not fronts were reproducible against this
// repository's own history. Each body is written against the BEHAVIOUR
// rather than against a comment.

test("the caller's own arguments reach the child verbatim, in order, and nothing is added", () => {
  // KILLED BY: dropping `...rest` from planFor's argv. That mutant
  // survived the whole suite before this body existed, because the
  // by-name body called planFor with no arguments at all and the
  // exit-code body only looked for the script's name.
  const args = ["--", "-x", "a b", "", "--y=$(echo pwned)", ";id"];
  const gate = VERBS.find((v) => v.verb === "gate");
  expect(gate).toBeDefined();
  const plan = planFor({ entry: gate!, args, projectRoot: repoRoot });
  expect(plan.argv.slice(-args.length), "the tail of the argv IS the caller's arguments").toEqual(
    args,
  );

  // And through the real entry point, with the spawn observed.
  let seen: string[] = [];
  const status = cliMain(["gate", ...args], {
    cwd: repoRoot,
    stdout: () => {},
    stderr: () => {},
    spawn: ((_command: string, argv: string[]) => {
      seen = argv;
      return { status: 0, signal: null, error: undefined };
    }) as never,
  });
  expect(status).toBe(0);
  expect(seen.slice(-args.length), "the child receives them unchanged").toEqual(args);
  // A POSITIVE CONTROL for the "nothing is added" half: a verb with a
  // declared positionalFlag DOES add one, and only that one.
  const card = VERBS.find((v) => v.verb === "card");
  const mapped = planFor({ entry: card!, args: ["T-150"], projectRoot: repoRoot });
  expect(mapped.argv.slice(-2)).toEqual(["--card", "T-150"]);
});

test("undo EXECUTES the revert it printed, and it reverts onto the merge's first parent", () => {
  test.setTimeout(120_000);
  // KILLED BY: `-m 2` in the spawned argv. That mutant survived because
  // every undo body passed --dry-run and asserted the printed STRING,
  // which was built independently of the argv actually spawned.
  const { root, git } = undoFixture({ later: false });
  try {
    const before = readFileSync(path.join(root, "src", "a.ts"), "utf8");
    expect(before, "the lane's change is in the tree before the undo").toBe("export const a = 2;\n");
    const said: string[] = [];
    const status = undoMain(["T-900", "--root", root], {
      cwd: root,
      out: (s) => said.push(s),
      err: (s) => said.push(s),
    });
    expect(status, "the revert ran").toBe(EXIT.CLEAN);
    const after = readFileSync(path.join(root, "src", "a.ts"), "utf8");
    expect(after, "reverting onto the FIRST parent puts the pre-lane tree back").toBe(
      "export const a = 1;\n",
    );
    expect(git("log", "-1", "--format=%s").trim(), "and it is a revert commit").toContain("Revert");
    expect(git("status", "--porcelain").trim(), "which left the tree clean").toBe("");
  } finally {
    removeGitFixture(root, FIXTURE);
  }
});

test("a card whose fence expands to NOTHING is refused, never reverted", () => {
  test.setTimeout(120_000);
  // Measured on this repository at f809cd9: 99 of the 253 done cards
  // carry a slug-era `touches:` the expander answers `unusable` for, and
  // reading only `paths` turned every one of them into a clear fence.
  const { root } = undoFixture({ later: true, touches: "app-shell" });
  try {
    const said: string[] = [];
    const status = undoMain(["T-900", "--root", root, "--dry-run"], {
      cwd: root,
      out: (s) => said.push(s),
      err: (s) => said.push(s),
    });
    expect(status, "an underivable fence is CANNOT RUN, not a clear one").toBe(EXIT.CANNOT_RUN);
    const text = said.join("\n");
    expect(text, "and the token that would not expand is named").toContain("app-shell");
    expect(text).toContain("Nothing was reverted.");
    expect(text, "it never claims a clear fence").not.toContain("0 later merge(s)");
  } finally {
    removeGitFixture(root, FIXTURE);
  }
  // THE POSITIVE CONTROL: the same fixture with a fence that DOES expand
  // reaches the later-merge refusal instead, so the body above is about
  // the empty expansion and not about the fixture.
  const control = undoFixture({ later: true });
  try {
    const said: string[] = [];
    const status = undoMain(["T-900", "--root", control.root, "--dry-run"], {
      cwd: control.root,
      out: (s) => said.push(s),
      err: (s) => said.push(s),
    });
    expect(status, "a fence that expands gets as far as the later-merge scan").toBe(EXIT.FOUND);
    expect(said.join("\n")).toContain("REFUSED");
  } finally {
    removeGitFixture(control.root, FIXTURE);
  }
});

test("a card id is matched on a token boundary, so one card cannot select another's merge", () => {
  test.setTimeout(120_000);
  expect(mentionsCard("T-244: the lane's commit", "T-244")).toBe(true);
  expect(mentionsCard("Merge T-244", "T-244")).toBe(true);
  expect(mentionsCard("Merge T-244-s3", "T-244"), "a strict prefix is NOT the id").toBe(false);
  expect(mentionsCard("T-244-s3: work", "T-244-s3"), "and the longer id still matches").toBe(true);
  expect(mentionsCard("nothing here", "T-244")).toBe(false);

  // End to end: a card that was never merged must not pick up the merge
  // of a card whose id merely has it as a prefix.
  const { root } = undoFixture({ later: false, extraLane: { id: "T-9", file: "T-9-a-card.md" } });
  try {
    const said: string[] = [];
    const status = undoMain(["T-9", "--root", root, "--dry-run"], {
      cwd: root,
      out: (s) => said.push(s),
      err: (s) => said.push(s),
    });
    expect(status, "T-9 has no merge of its own, so this cannot run").toBe(EXIT.CANNOT_RUN);
    expect(said.join("\n"), "and it does not name T-900's merge").not.toContain("Merge T-900");
  } finally {
    removeGitFixture(root, FIXTURE);
  }
});

test("undo refuses when the ref it scans is not the ref the revert would rewrite", () => {
  test.setTimeout(120_000);
  const { root, git } = undoFixture({ later: false });
  try {
    git("checkout", "--quiet", "--detach", "HEAD");
    const headBefore = git("rev-parse", "HEAD").trim();
    const said: string[] = [];
    const status = undoMain(["T-900", "--root", root], {
      cwd: root,
      out: (s) => said.push(s),
      err: (s) => said.push(s),
    });
    expect(status, "a detached HEAD is CANNOT RUN").toBe(EXIT.CANNOT_RUN);
    expect(said.join("\n")).toContain("DETACHED");
    expect(git("rev-parse", "HEAD").trim(), "and NOTHING moved").toBe(headBefore);
    // The same refusal on another branch, which is the case a lane meets.
    git("checkout", "--quiet", "main");
    git("checkout", "--quiet", "-b", "task/T-901-elsewhere");
    const said2: string[] = [];
    expect(
      undoMain(["T-900", "--root", root], {
        cwd: root,
        out: (s) => said2.push(s),
        err: (s) => said2.push(s),
      }),
    ).toBe(EXIT.CANNOT_RUN);
    expect(said2.join("\n")).toContain("refs/heads/task/T-901-elsewhere");
  } finally {
    removeGitFixture(root, FIXTURE);
  }
});

test("the merge's clean-tree precondition is graded on its OUTPUT, and a dirty tree stops it", () => {
  test.setTimeout(120_000);
  // `git status --porcelain` exits 0 on a filthy tree, so an exit-code
  // grading made this step unfailable and the merge staged on top of the
  // dirt. The step now declares `assert: "empty-output"`.
  const clean = preludePlan({
    projectRoot: repoRoot,
    id: "T-000",
    branch: "main",
    lane: "task/T-000-x",
    verdict: "0".repeat(40),
    worktree: null,
  });
  const precondition = clean.find((s) => s.id === "precondition:clean");
  expect(precondition?.run?.assert, "the step declares its own grading").toBe("empty-output");

  const { root, git } = undoFixture({ later: false });
  try {
    writeFileSync(path.join(root, "src", "a.ts"), "dirty\n");
    const said: string[] = [];
    const status = mergeMain(
      ["T-900", "--slug", "a-fenced-card", "--verdict", "HEAD", "--root", root,
       "--built-by", "x@y", "--verified-by", "x@y"],
      { cwd: root, out: (s) => said.push(s), err: (s) => said.push(s) },
    );
    expect(status, "a dirty tree stops the ritual").toBe(EXIT.FOUND);
    expect(said.join("\n")).toContain("the tree is NOT clean");
    expect(git("diff", "--cached", "--name-only").trim(), "and nothing was staged").toBe("");
    // THE POSITIVE CONTROL: the same command on the same fixture, clean,
    // gets past this step (and stops later, on its own preconditions).
    git("checkout", "--", "src/a.ts");
    const said2: string[] = [];
    mergeMain(
      ["T-900", "--slug", "a-fenced-card", "--verdict", "HEAD", "--root", root,
       "--built-by", "x@y", "--verified-by", "x@y"],
      { cwd: root, out: (s) => said2.push(s), err: (s) => said2.push(s) },
    );
    expect(said2.join("\n"), "a clean tree passes the precondition").not.toContain(
      "the tree is NOT clean",
    );
  } finally {
    removeGitFixture(root, FIXTURE);
  }
});

test("a graph-moving merge re-derives the pins into a dated line carrying the graph's own counts", () => {
  // Room item 27's second half was PROSE: the step ran the bodies and the
  // body asserted the comment. It is a value now, and this decides it.
  const graph = {
    files: [
      { path: "a.ts", symbols: [1, 2, 3] },
      { path: "b.ts", symbols: [4] },
    ],
    edges: [1, 2, 3, 4, 5],
  };
  const line = graphPinLine({ graph, id: "T-000", at: new Date("2026-09-09T04:05:06Z") });
  expect(line, "the house's dated line").toContain("RECONCILED AT THE T-000 MERGE (2026-09-09,");
  expect(line, "the graph's own file count").toContain("2 files");
  expect(line, "its symbols, summed off the files").toContain("4 symbols");
  expect(line, "and its edges").toContain("5 edges");
  expect(line, "with T-211's rule beside them").toContain("a lane never updates the pins");
  // NOT A CONSTANT: a different graph moves every number.
  const other = graphPinLine({
    graph: { files: [{ path: "a.ts", symbols: [1] }], edges: [] },
    at: new Date("2026-09-09T04:05:06Z"),
    id: "T-000",
  });
  expect(other).toContain("1 files");
  expect(other).toContain("1 symbols");
  expect(other).toContain("0 edges");
  // And the plan really carries the step that produces it.
  const plan = tailPlan({ paths: ["docs/architecture/graph.json"], projectRoot: repoRoot, id: "T-000" });
  expect(plan.find((s) => s.id === "dogfood")?.action, "the step does the derivation").toBe(
    "graph-pins",
  );
});

test("the merge stamps done by the card's own status line, and fills only an empty seat", () => {
  const card = [
    "---",
    "id: T-000",
    "status: verifying",
    "built_by:",
    "verified_by: somebody@already",
    "---",
    "",
  ].join("\n");
  const stamped = stampDone({ text: card, builtBy: "b@k", verifiedBy: "v@k" });
  expect(stamped).toContain("status: done");
  expect(stamped, "an empty seat is filled").toContain("built_by: b@k");
  expect(stamped, "a seat already recorded is NOT overwritten").toContain(
    "verified_by: somebody@already",
  );
  // A card with no movable status is left alone, which is what lets the
  // runner refuse rather than write nothing quietly.
  expect(stampDone({ text: "---\nid: T-000\nstatus: done\n---\n", builtBy: "b", verifiedBy: "v" })).toBe(
    "---\nid: T-000\nstatus: done\n---\n",
  );
  const plan = preludePlan({
    projectRoot: repoRoot,
    id: "T-000",
    branch: "main",
    lane: "task/T-000-x",
    verdict: "0".repeat(40),
    worktree: null,
  });
  expect(plan.find((s) => s.id === "stamp")?.action, "and the ritual performs it").toBe("stamp-done");
});

test("the installer refuses a destination it would clobber, and --force is the named choice", () => {
  const project = scratchProject();
  try {
    const skill = path.join(project, "method", "skills", "seat");
    mkdirSync(skill, { recursive: true });
    writeFileSync(path.join(skill, "SKILL.md"), "the shipped skill\n");
    expect(cliMain(["install", "--harness", "claude", "--root", project], {
      cwd: project,
      stdout: () => {},
      stderr: () => {},
    })).toBe(EXIT.CLEAN);
    const landed = path.join(project, ".claude", "skills", "seat", "SKILL.md");
    expect(readFileSync(landed, "utf8")).toBe("the shipped skill\n");

    // A second run over an IDENTICAL destination is a no-op, not a refusal.
    expect(cliMain(["install", "--harness", "claude", "--root", project], {
      cwd: project,
      stdout: () => {},
      stderr: () => {},
    })).toBe(EXIT.CLEAN);

    // A hand edit is somebody's work, and it is not overwritten in silence.
    writeFileSync(landed, "a hand edit\n");
    const said: string[] = [];
    expect(
      cliMain(["install", "--harness", "claude", "--root", project], {
        cwd: project,
        stdout: (s) => said.push(s),
        stderr: (s) => said.push(s),
      }),
      "a differing destination is refused",
    ).toBe(EXIT.FOUND);
    expect(said.join("\n")).toContain("REFUSED");
    expect(readFileSync(landed, "utf8"), "and the hand edit still stands").toBe("a hand edit\n");
    // --force is the named choice, and it is the only thing that overwrites.
    expect(
      cliMain(["install", "--harness", "claude", "--root", project, "--force"], {
        cwd: project,
        stdout: () => {},
        stderr: () => {},
      }),
    ).toBe(EXIT.CLEAN);
    expect(readFileSync(landed, "utf8")).toBe("the shipped skill\n");
  } finally {
    removeGitFixture(project, FIXTURE);
  }
});

test("every command the skills' own cards name is a verb this package exposes", () => {
  // THE DERIVATION THE CRITERION ASKS FOR, and it replaces a list typed
  // into this file: the verb set is read off T-241's and T-242's cards,
  // which are where the skills' command lines live until the skills do.
  const cards = readdirSync(path.join(repoRoot, "docs", "tasks"))
    // The two PARENT cards only: a sub-card (T-241-s3-…) is a finding filed
    // under the parent, not a skill card, and T-241's merge landed five of
    // them — this body redded battery57 on 8bf42b0 by counting them.
    .filter((n) => /^T-24[12]-(?!s\d+-)/.test(n))
    .map((n) => readFileSync(path.join(repoRoot, "docs", "tasks", n), "utf8"))
    // THE SPEC PART ONLY — the text before the card's implementation notes
    // and verdicts. Those sections name whatever a lane and its verifier
    // RAN (T-241's name the pack's own golden-check.mjs and
    // host-command-check.mjs, which are the pack's scripts and not verbs
    // this package owes); the criteria are where the skills' command
    // lines live.
    .map((c) => c.split(/\n## (?:Implementation notes|Verdicts)\b/)[0] ?? c);
  expect(cards.length, "both skill cards were found, and no sub-card").toBe(2);
  const quoted = cards.flatMap((c) => [...c.matchAll(/`([^`\n]+)`/g)].map((m) => m[1] ?? ""));
  const commands = quoted.filter((q) => /\.mjs\b/.test(q));
  expect(commands.length, "the cards really name commands").toBeGreaterThan(0);

  // EXACT MEMBERSHIP, NEVER A SUBSTRING. A mutant that repointed the
  // `evals` verb at `gate-run.mjs` survived a `toContain("run.mjs")`
  // check, because one script's name is inside another's — the same
  // class the verifier's R2 found in `undo`'s id matching.
  const files = new Set(
    VERBS.flatMap((v) =>
      v.target.kind === "script" || v.target.kind === "project" ? [v.target.file] : [],
    ),
  );
  const arms = new Set(
    VERBS.flatMap((v) =>
      v.target.kind === "script" || v.target.kind === "project"
        ? [...v.target.args, ...(v.positionalFlag === undefined ? [] : [v.positionalFlag])]
        : [],
    ),
  );
  for (const command of commands) {
    const script = /([\w./-]*[\w-]+\.mjs)/.exec(command)?.[1] ?? "";
    expect(script, `${command} names a script`).not.toBe("");
    expect(
      files.has(script) || files.has(path.basename(script)),
      `${command} is reachable — some verb's target IS ${script}, exactly`,
    ).toBe(true);
    const arm = /\s(--[a-z-]+)/.exec(command)?.[1];
    if (arm !== undefined) expect(arms.has(arm), `and its arm ${arm} is reached`).toBe(true);
  }
  // NOT VACUOUS: a command no verb fronts is not silently reachable.
  expect(files.has("definitely-not-a-script.mjs")).toBe(false);
  expect(files.has("tools/method-evals/run.mjs"), "the evals target is exact").toBe(true);
});

test("a fence with ANY unresolved token is refused, never called clear", () => {
  test.setTimeout(120_000);
  // The second verdict (N1) measured 30 of the 253 done cards whose
  // `touches:` expands to SOME paths with tokens left over; the guard
  // above reads only an EMPTY expansion, and a partial one was compared
  // against a strict subset of the fence and called clear.
  const { root } = undoFixture({ later: true, touches: "src/, app-shell" });
  try {
    const said: string[] = [];
    const status = undoMain(["T-900", "--root", root, "--dry-run"], {
      cwd: root,
      out: (s) => said.push(s),
      err: (s) => said.push(s),
    });
    expect(status, "a partly underivable fence is CANNOT RUN").toBe(EXIT.CANNOT_RUN);
    const text = said.join("\n");
    expect(text, "and the token that would not expand is named").toContain("app-shell");
    expect(text).toContain("Nothing was reverted.");
    expect(text, "it never claims a clear fence").not.toContain("0 later merge(s)");
  } finally {
    removeGitFixture(root, FIXTURE);
  }
  // POSITIVE CONTROL: the same fixture with every token resolvable reaches
  // the later-merge refusal instead, so this body is about the unresolved
  // token and not about the fixture.
  const control = undoFixture({ later: true });
  try {
    const said: string[] = [];
    expect(
      undoMain(["T-900", "--root", control.root, "--dry-run"], {
        cwd: control.root,
        out: (s) => said.push(s),
        err: (s) => said.push(s),
      }),
      "a fully resolvable fence gets as far as the later-merge scan",
    ).toBe(EXIT.FOUND);
    expect(said.join("\n")).toContain("REFUSED");
  } finally {
    removeGitFixture(control.root, FIXTURE);
  }
});

test("a merge STAGES the census and the graph it regenerated, by the argv it runs", () => {
  // The first verdict's "merge does not stage what it regenerates" was
  // fixed at 870c14e by two `git add` steps that nothing held (N3, D13/D14):
  // the step deleted, or repointed at docs/nothing, left the spec green.
  const plan = tailPlan({
    paths: ["tools/e2e/tests/cli.spec.ts", "app/src/x.ts"],
    projectRoot: repoRoot,
    id: "T-000",
  });
  const argvOf = (id: string): string[] => plan.find((s) => s.id === id)?.run?.argv ?? [];
  expect(argvOf("capabilities:add"), "the regenerated census is staged").toEqual([
    "-C", repoRoot, "add", "docs/CAPABILITIES.md",
  ]);
  expect(argvOf("graph:add"), "and so is the regenerated graph").toEqual([
    "-C", repoRoot, "add", "docs/architecture",
  ]);
  // ORDER: each add comes AFTER the regeneration it stages.
  const at = (id: string): number => plan.findIndex((s) => s.id === id);
  expect(at("capabilities:add")).toBeGreaterThan(at("capabilities"));
  expect(at("graph:add")).toBeGreaterThan(at("graph:regen"));
  // POSITIVE CONTROL: a merge that regenerates neither plans neither add.
  const none = tailPlan({ paths: ["README.md"], projectRoot: repoRoot, id: "T-000" });
  expect(none.map((s) => s.id)).not.toContain("capabilities:add");
  expect(none.map((s) => s.id)).not.toContain("graph:add");
});

test("the done stamp fills only an empty built_by, not only an empty verified_by", () => {
  // The sibling body pins the empty-seat rule for verified_by alone; a
  // built_by anchor widened to `.*` (N3, D10) survived it.
  const card = [
    "---",
    "id: T-000",
    "status: verifying",
    "built_by: somebody@already",
    "verified_by:",
    "---",
    "",
  ].join("\n");
  const stamped = stampDone({ text: card, builtBy: "b@k", verifiedBy: "v@k" });
  expect(stamped, "a builder already recorded is NOT overwritten").toContain(
    "built_by: somebody@already",
  );
  expect(stamped, "and the empty seat is still filled").toContain("verified_by: v@k");
  expect(stamped).toContain("status: done");
});

// ── the mutant blocks a verdict carries, and the merge's re-drill (T-281) ──

interface BlockFields {
  correction: string;
  file: string;
  spec: string;
  body: string;
  message: string;
  old: string;
  new: string;
}

/** One well-formed block, as the fixed layout spells it. */
function mutantBlockText(over: Partial<BlockFields> = {}): string {
  const f: BlockFields = {
    correction: "CORRECTION 1 — the denominator is silent",
    file: "tools/e2e/scripts/dispatch-brief.mjs",
    spec: "tools/e2e/tests/brief.spec.ts",
    body: "THE PACK'S DENOMINATOR IS THE DOCUMENT'S OWN",
    message: "the pack neither carries it nor names it as out of reach",
    old: "  return enumerated;",
    new: "  return [...enumerated, ...bolded];",
    ...over,
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
  ].join("\n");
}

/** A card whose `## Verdicts` section carries the given entries, in order. */
function cardWithVerdicts(...entries: string[]): string {
  return ["---", "id: T-000", "status: verifying", "---", "", "## Verdicts", "", ...entries].join(
    "\n",
  );
}

/** A verdict entry heading plus its body. */
function verdictEntry(heading: string, ...body: string[]): string {
  return [heading, "", ...body, ""].join("\n");
}

test("the merge reads its mutant blocks off the card's NEWEST verdict, and a verdict's own sub-headings are not verdicts", () => {
  // A REJECTED pass and the APPROVED pass that follows it carry DIFFERENT
  // corrections. Reading the first would drill a body the second replaced,
  // and reading "the last ### heading" would read a sub-heading of the
  // last verdict — verdicts nest their own `###` sections freely.
  const card = cardWithVerdicts(
    verdictEntry(
      "### 2026-09-08 — REJECTED (claude-opus-5@subagent, verifier, phase 2)",
      mutantBlockText({ correction: "THE OLD PASS'S CORRECTION" }),
    ),
    verdictEntry(
      "### VERDICT 2026-09-09 — APPROVED WITH ASSIGNED CORRECTIONS — claude-opus-5@subagent",
      "### The bodies, and the window is CONSTRUCTED rather than simulated",
      "",
      mutantBlockText({ correction: "THE NEWEST PASS'S CORRECTION" }),
    ),
  );
  const newest = newestVerdict(card);
  expect("problem" in newest, "the newest verdict is found").toBe(false);
  if ("problem" in newest) return;
  expect(newest.heading, "and it is the LAST dated entry, not the last heading").toContain(
    "2026-09-09",
  );
  const read = readMutantBlocks(newest.text);
  expect("problem" in read, "its blocks parse").toBe(false);
  if ("problem" in read) return;
  expect(read.blocks.map((b) => b.correction), "only the newest pass's block is read").toEqual([
    "THE NEWEST PASS'S CORRECTION",
  ]);

  // A card with no verdict at all is SAID to have none, never treated as
  // one carrying no corrections.
  const bare = newestVerdict("---\nid: T-000\n---\n\n## Verdicts\n\nnothing yet\n");
  expect("problem" in bare, "a section with no dated entry is a problem, not an empty read").toBe(
    true,
  );
  expect(newestVerdict("---\nid: T-000\n---\n")).toHaveProperty("problem");
});

test("a mutant block naming a LINE NUMBER is refused by the reader, in each shape a line number takes", () => {
  // docs/CONVENTIONS.md's A CITATION NAMES A SYMBOL, NOT A LINE, applied
  // where getting it wrong is silent: the merge re-drills on a tree that
  // has moved, so a coordinate names a different site or none.
  const shapes = [
    { over: { file: "tools/e2e/scripts/dispatch-brief.mjs:1798" }, why: "a path with a line tail" },
    {
      over: { spec: "tools/e2e/tests/brief.spec.ts:4406:1" },
      why: "a path with a line and column tail",
    },
    { over: { correction: "CORRECTION 1 at line 1798" }, why: "a line number written in prose" },
    { over: { message: "expected at lines 40-52" }, why: "a line RANGE written in prose" },
  ];
  for (const shape of shapes) {
    const read = readMutantBlocks(mutantBlockText(shape.over));
    expect("problem" in read, `${shape.why} is refused`).toBe(true);
    if (!("problem" in read)) continue;
    expect(read.problem, "and the refusal says what it refused").toContain("LINE NUMBER");
  }
  // The key form, which is the one a hand reaches for first.
  const keyed = readMutantBlocks(
    mutantBlockText().replace("file: tools", "line: 1798\nfile: tools"),
  );
  expect("problem" in keyed, "a `line:` key is refused by name").toBe(true);
  if ("problem" in keyed) expect(keyed.problem).toContain("LINE NUMBER");

  // THE POSITIVE CONTROL, run because a reader that refused everything
  // would be indistinguishable from this one: the same block WITHOUT a
  // line number reads clean, with every field on it.
  const clean = readMutantBlocks(mutantBlockText());
  expect("problem" in clean, "the same block without a coordinate is accepted").toBe(false);
  if ("problem" in clean) return;
  expect(clean.blocks).toHaveLength(1);
  expect(clean.blocks[0]?.file).toBe("tools/e2e/scripts/dispatch-brief.mjs");
  expect(clean.blocks[0]?.old).toBe("  return enumerated;");
  expect(clean.blocks[0]?.new).toBe("  return [...enumerated, ...bolded];");
});

test("the mutant block's layout is FIXED — order, both markers, and a mutant that changes something", () => {
  const good = mutantBlockText();
  // ORDER. The keys are a layout, not a bag; swapping two is refused and
  // the refusal names the key the layout expected there.
  const swapped = good
    .replace("file: tools/e2e/scripts/dispatch-brief.mjs\n", "")
    .replace("spec: tools/e2e/tests/brief.spec.ts", "spec: tools/e2e/tests/brief.spec.ts\nfile: tools/e2e/scripts/dispatch-brief.mjs");
  const outOfOrder = readMutantBlocks(swapped);
  expect("problem" in outOfOrder, "a key out of order is refused").toBe(true);
  if ("problem" in outOfOrder) expect(outOfOrder.problem).toContain("fixed layout has `file:`");

  for (const [missing, why] of [
    ["--- old", "no `--- old` marker"],
    ["--- new", "no `--- new` marker"],
  ] as const) {
    const cut = readMutantBlocks(good.replace(`${missing}\n`, ""));
    expect("problem" in cut, why).toBe(true);
  }
  // An empty field, a no-op mutant, and an unclosed fence.
  expect(readMutantBlocks(mutantBlockText({ body: "" }))).toHaveProperty("problem");
  expect(readMutantBlocks(mutantBlockText({ new: "  return enumerated;" }))).toHaveProperty(
    "problem",
  );
  expect(readMutantBlocks(good.slice(0, good.length - 4))).toHaveProperty("problem");

  // ONE BAD BLOCK REFUSES THE WHOLE READ — the alternative reports a
  // clean drill over a correction nobody checked. The bad half is a
  // LAYOUT fault rather than a line number, deliberately: leaning on the
  // line-number rule here would put this body's kill set inside the
  // sibling body's, and a contained body is a restatement.
  const both = `${mutantBlockText()}\n\n${mutantBlockText({ body: "" })}`;
  expect(readMutantBlocks(both), "a good block beside a bad one does not rescue it").toHaveProperty(
    "problem",
  );

  // AN INDENTED FENCE IS A BLOCK SINCE T-295, AND THE TRADE WAS MEASURED
  // BOTH WAYS. This body used to require the opposite, because
  // `method/roles/verifier.md` prints the layout as an INDENTED example
  // and a verdict quoting it must not become a parse failure. Then a
  // verifier wrote its real block indented four spaces inside its verdict
  // entry, the merged tree's own re-drill reported `blocks read: 0`, and
  // the seat drilled that correction by hand at the exact line — a
  // SILENT miss over a correction a verdict had assigned.
  //
  // So the discriminator moved from the MARGIN to the ENCLOSURE: a fence
  // inside another code fence is a quotation, which is CommonMark's own
  // rule, and a fence at any margin outside one is a block. The residual
  // risk is a verdict that quotes the layout indented and UNFENCED — and
  // that risk is LOUD where the old one was silent, because such a
  // quotation either drills its placeholder anchors and refuses, or
  // fails to parse and refuses the whole read.
  const indented = good
    .split("\n")
    .map((l) => `    ${l}`)
    .join("\n");
  const atMargin = readMutantBlocks(indented);
  expect("problem" in atMargin, "an indented block parses").toBe(false);
  if (!("problem" in atMargin)) {
    expect(atMargin.blocks, "and it is ONE block, not none").toHaveLength(1);
    // THE MARGIN COMES OFF EVERY FIELD. The anchors are exact text, so a
    // block read with its fence's indent still on it matches nothing in
    // the tree — which turns a silent miss into a confident wrong
    // answer. The comparison is against the SAME block at column zero,
    // so this asserts equality rather than the absence of a space: an
    // anchor legitimately indented INSIDE its own file keeps that.
    const atZero = readMutantBlocks(good);
    expect("problem" in atZero).toBe(false);
    if (!("problem" in atZero)) {
      expect(atMargin.blocks[0], "the margin changes nothing about the block").toEqual(atZero.blocks[0]);
    }
  }
  // AND THE ENCLOSURE IS WHAT STILL EXCUSES A QUOTATION.
  const fenced = readMutantBlocks(["````markdown", good, "````"].join("\n"));
  expect("problem" in fenced, "a quoted example is not a parse failure").toBe(false);
  if (!("problem" in fenced)) expect(fenced.blocks, "and it is not a block").toHaveLength(0);
});

test("a mutant anchor that does not match its file exactly once names no site, and planting refuses", () => {
  const block = {
    correction: "C1",
    file: "src/a.mjs",
    spec: "tools/e2e/tests/a.spec.ts",
    body: "a body",
    message: "a message",
    old: "return enumerated;",
    new: "return everything;",
  };
  const once = plantMutant({ source: "function f() {\n  return enumerated;\n}\n", block });
  expect("problem" in once, "one match is a site").toBe(false);
  if (!("problem" in once)) expect(once.text).toContain("return everything;");

  const twice = plantMutant({
    source: "function f() {\n  return enumerated;\n}\nfunction g() {\n  return enumerated;\n}\n",
    block,
  });
  expect("problem" in twice, "two matches name no site").toBe(true);
  if ("problem" in twice) expect(twice.problem).toContain("2 time(s)");

  const none = plantMutant({ source: "function f() {\n  return 1;\n}\n", block });
  expect("problem" in none, "a stale anchor matches nothing and is refused").toBe(true);
  if ("problem" in none) expect(none.problem).toContain("0 time(s)");

  // A `new` text carrying `$&` is PLANTED, never expanded: a string
  // replacement would have written the matched text back instead.
  const dollar = plantMutant({
    source: "const x = 1;\n",
    block: { ...block, old: "const x = 1;", new: "const x = 2; // $& $' $1" },
  });
  expect("problem" in dollar).toBe(false);
  if (!("problem" in dollar)) expect(dollar.text).toBe("const x = 2; // $& $' $1\n");
});

test("the failing bodies are read off the run's own report, in both dialects this repository runs", () => {
  // A PROGRESS LINE IS NOT A FAILURE. Playwright prints every body's
  // name as it starts it, in the same `file:L:C › name` shape, and the
  // ONLY thing separating the two is the `N)` a failure carries. The
  // green body below is what makes that separation measurable: a reader
  // that dropped the ordinal would report it as failing.
  const playwright = [
    "Running 2 tests using 1 worker",
    "",
    "[1/2] [chromium] › tests/brief.spec.ts:99:1 › a body that passed and must not be reported",
    "[2/2] [chromium] › tests/brief.spec.ts:4406:1 › THE PACK'S DENOMINATOR IS THE DOCUMENT'S OWN",
    "  1) [chromium] › tests/brief.spec.ts:4406:1 › THE PACK'S DENOMINATOR IS THE DOCUMENT'S OWN ",
    "",
    "    Error: the pack neither carries it nor names it as out of reach",
    "",
    "  1 failed",
    "    [chromium] › tests/brief.spec.ts:4406:1 › THE PACK'S DENOMINATOR IS THE DOCUMENT'S OWN",
  ].join("\n");
  expect(failingBodies(playwright), "only the numbered line is a failure").toEqual([
    "THE PACK'S DENOMINATOR IS THE DOCUMENT'S OWN",
  ]);

  // AND ONE BODY REPORTED TWICE IS ONE BODY. Vitest prints a failure in
  // the run AND again under its own failed-tests summary, in the same
  // shape — so without a distinct read, "red alone" would grade a single
  // failure as two and stop a merge that should proceed.
  const vitest = [
    "FAIL  test/fence.test.ts > a fence expands its slugs",
    "",
    " Failed Tests 1 ",
    "FAIL  test/fence.test.ts > a fence expands its slugs",
    " 1 failed",
  ].join("\n");
  expect(failingBodies(vitest), "twice reported is once counted").toEqual([
    "a fence expands its slugs",
  ]);

  // COLOUR IS STRIPPED, because the run's colouring is a property of the
  // ENVIRONMENT and not of the failure: a harness with FORCE_COLOR set
  // gets escape codes even through a pipe, and they would land INSIDE the
  // name the "red alone" comparison comes down to.
  const coloured =
    "  1) \u001b[31m[chromium]\u001b[39m \u203a tests/a.spec.ts:1:1 \u203a " +
    "\u001b[1mfirst body\u001b[22m ";
  expect(failingBodies(coloured), "an escape code is not part of a body's name").toEqual([
    "first body",
  ]);

  // TWO failures are TWO names — the whole "red alone" claim depends on
  // this being a set and not a count.
  const two = [
    "  1) [chromium] › tests/a.spec.ts:1:1 › first body ",
    "  2) [chromium] › tests/a.spec.ts:9:1 › second body ",
  ].join("\n");
  expect(failingBodies(two)).toEqual(["first body", "second body"]);
  // A GREEN run names nobody.
  expect(failingBodies("Running 34 tests using 4 workers\n\n  34 passed (6.9s)")).toEqual([]);
});

test("the drill refuses a survivor, a body that reds more than itself, and a red without the message", () => {
  const block = {
    correction: "C1",
    file: "src/a.mjs",
    spec: "tools/e2e/tests/a.spec.ts",
    body: "the body",
    message: "the message it must print",
    old: "a",
    new: "b",
  };
  const survivor = gradeDrill({ block, failing: [], code: 0, output: "  34 passed" });
  expect("problem" in survivor, "a green spec under a planted mutant is a SURVIVOR").toBe(true);
  if ("problem" in survivor) expect(survivor.problem).toContain("THE MUTANT SURVIVED");

  const wide = gradeDrill({
    block,
    failing: ["the body", "somebody else"],
    code: 1,
    output: "the message it must print",
  });
  expect("problem" in wide, "a mutant that kills a set is not evidence about one property").toBe(
    true,
  );
  if ("problem" in wide) expect(wide.problem).toContain("REDS MORE THAN ITSELF");

  const elsewhere = gradeDrill({ block, failing: ["somebody else"], code: 1, output: "" });
  expect("problem" in elsewhere, "the NAMED body has to be the one that redded").toBe(true);

  const quiet = gradeDrill({ block, failing: ["the body"], code: 1, output: "some other error" });
  expect("problem" in quiet, "red without the block's message is not the failure it claims").toBe(
    true,
  );

  const broken = gradeDrill({ block, failing: [], code: 3, output: "Error: Cannot find module" });
  expect("problem" in broken, "a run that broke is not a drill result").toBe(true);
  if ("problem" in broken) expect(broken.problem).not.toContain("SURVIVED");

  // THE POSITIVE CONTROL: the arrangement the three refusals are about,
  // done right, is graded ok by the same function.
  expect(
    gradeDrill({
      block,
      failing: ["the body"],
      code: 1,
      output: "Error: the message it must print — and the rest of the run",
    }),
  ).toEqual({ ok: true });
});

test("the whole drill plants, runs, restores and PROVES the restore by sha256 — and a survivor stops the merge", () => {
  const root = mkdtempSync(path.join(tmpdir(), "supertaskr-drill-"));
  try {
    const source = "export function f() {\n  return enumerated;\n}\n";
    mkdirSync(path.join(root, "src"), { recursive: true });
    writeFileSync(path.join(root, "src", "a.mjs"), source);
    // The spec the block names, carrying the body it names: the drill
    // reads both off the MERGED tree before it plants anything.
    mkdirSync(path.join(root, "tools", "e2e", "tests"), { recursive: true });
    writeFileSync(
      path.join(root, "tools", "e2e", "tests", "brief.spec.ts"),
      'test("the body that pins it", () => {});\n',
    );
    const block = {
      correction: "C1 — the denominator is silent",
      file: "src/a.mjs",
      spec: "tools/e2e/tests/brief.spec.ts",
      body: "the body that pins it",
      message: "the pack neither carries it nor names it",
      old: "  return enumerated;",
      new: "  return everything;",
    };
    /** What the runner saw when it was called — the mutant really reaches the disk. */
    let sawOnDisk = "";
    const runner = (r: { command: string; argv: string[]; cwd: string }) => {
      sawOnDisk = readFileSync(path.join(root, "src", "a.mjs"), "utf8");
      expect(r.command, "the spec's own package supplies the runner").toBe("npx");
      expect(r.argv).toEqual(["playwright", "test", "tests/brief.spec.ts", "--reporter=line"]);
      expect(r.cwd).toBe(path.join(root, "tools", "e2e"));
      return {
        code: 1,
        output: [
          "  1) [chromium] › tests/brief.spec.ts:1:1 › the body that pins it ",
          "    Error: the pack neither carries it nor names it",
          "  1 failed",
        ].join("\n"),
      };
    };
    const said: string[] = [];
    const ok = runMutantDrill({
      block,
      projectRoot: root,
      out: (s) => said.push(s),
      err: (s) => said.push(s),
      run: runner,
    });
    expect(ok, "a body RED ALONE with the message is the drill holding").toBe(EXIT.CLEAN);
    expect(sawOnDisk, "the mutant really reached the file the block names").toContain(
      "return everything;",
    );
    expect(readFileSync(path.join(root, "src", "a.mjs"), "utf8"), "and the site is restored").toBe(
      source,
    );
    expect(said.join("\n"), "the restore is PROVED, not asserted").toContain(
      "restored and PROVED by sha256",
    );
    expect(said.join("\n")).toContain("RED ALONE");

    // A SURVIVOR STOPS IT — same drill, same file, a green run.
    const survivorSaid: string[] = [];
    const survived = runMutantDrill({
      block,
      projectRoot: root,
      out: (s) => survivorSaid.push(s),
      err: (s) => survivorSaid.push(s),
      run: () => ({ code: 0, output: "  34 passed (6.9s)" }),
    });
    expect(survived, "a survivor is a stop, with the merge still staged").toBe(EXIT.FOUND);
    expect(survivorSaid.join("\n")).toContain("THE MUTANT SURVIVED");
    expect(
      readFileSync(path.join(root, "src", "a.mjs"), "utf8"),
      "and a refused drill restores the site too",
    ).toBe(source);

    // A STALE ANCHOR NEVER RUNS THE SPEC AT ALL.
    let ran = false;
    const stale = runMutantDrill({
      block: { ...block, old: "  return something that is not there;" },
      projectRoot: root,
      err: (s) => survivorSaid.push(s),
      run: () => {
        ran = true;
        return { code: 0, output: "" };
      },
    });
    expect(stale, "an anchor matching nothing stops before anything is planted").toBe(EXIT.FOUND);
    expect(ran, "and the spec is never run").toBe(false);
    expect(readFileSync(path.join(root, "src", "a.mjs"), "utf8")).toBe(source);

    // A BODY THE MERGED TREE DOES NOT CARRY IS THE MERGE'S FAULT, NOT THE
    // CORRECTION'S. The verifier commits its bodies AFTER the verdict
    // commit, so a merge given the verdict sha rather than the bench tip
    // leaves them behind — and without this the drill would report "the
    // named body did not red" after a whole spec run, which reads like a
    // defect in the correction.
    let ranForAbsent = false;
    const absent = runMutantDrill({
      block: { ...block, body: "a body the merged tree does not carry" },
      projectRoot: root,
      err: (s) => survivorSaid.push(s),
      run: () => {
        ranForAbsent = true;
        return { code: 0, output: "" };
      },
    });
    expect(absent, "a body that is not on the merged tree stops the merge").toBe(EXIT.FOUND);
    expect(ranForAbsent, "and the spec is never run for it").toBe(false);
    expect(survivorSaid.join("\n")).toContain("is NOT in tools/e2e/tests/brief.spec.ts");

    // A spec no package in this project owns is SAID to be, never guessed.
    expect(
      runMutantDrill({ block: { ...block, spec: "somewhere/else.spec.ts" }, projectRoot: root }),
    ).toBe(EXIT.CANNOT_RUN);
    expect(specRunner("lib/parser/test/fence.test.ts", root)).toEqual({
      command: "npx",
      argv: ["vitest", "run", "test/fence.test.ts"],
      cwd: path.join(root, "lib", "parser"),
      // THE SET THIS RUNNER COVERS, carried since T-295: a drill scoped
      // to the fix diff can name several specs at once, and a runner
      // that did not say which it was running could not be graded.
      specs: ["lib/parser/test/fence.test.ts"],
    });
  } finally {
    removeGitFixture(root, FIXTURE);
  }
});

test("a verdict assigning corrections with NO mutant block is refused, and one assigning none is not", () => {
  const plan = (card: string | undefined): ReturnType<typeof drillSteps> =>
    drillSteps({ cardText: card, projectRoot: repoRoot, id: "T-000" });

  const forgotten = plan(
    cardWithVerdicts(
      verdictEntry(
        "### 2026-09-09 — APPROVED WITH ASSIGNED CORRECTIONS — claude-opus-5@subagent",
        "#### CORRECTION 1 — the denominator is silent",
        "",
        "The remedy is to widen the candidate set.",
      ),
    ),
  );
  expect(forgotten.map((s) => s.id), "a correction with no block refuses").toEqual(["drill:refused"]);
  expect(forgotten[0]?.problem).toContain("carries NO mutant block");

  // THE POSITIVE CONTROL, and it is the ordinary case: an APPROVED verdict
  // owes no block, and the plan SAYS there was nothing rather than
  // planning nothing.
  const approved = plan(
    cardWithVerdicts(
      verdictEntry("### 2026-09-09 — APPROVED — claude-opus-5@subagent", "Everything held."),
    ),
  );
  expect(approved.map((s) => s.id)).toEqual(["drill:none"]);
  expect(approved[0]?.problem, "and it is not a refusal").toBeUndefined();
  expect(approved[0]?.title).toContain("assigns no correction");

  // A block per correction is a step per correction, and the first step
  // carries both counts so a shortfall is visible without arithmetic.
  const two = plan(
    cardWithVerdicts(
      verdictEntry(
        "### 2026-09-09 — APPROVED WITH ASSIGNED CORRECTIONS — claude-opus-5@subagent",
        "#### CORRECTION 1 — one",
        mutantBlockText({ correction: "CORRECTION 1" }),
        "#### CORRECTION 2 — two",
        mutantBlockText({ correction: "CORRECTION 2", old: "  return two;" }),
      ),
    ),
  );
  expect(two.map((s) => s.id)).toEqual(["drill:1", "drill:2"]);
  expect(two[0]?.title, "the correction count is printed beside the block count").toContain(
    "2 correction heading(s), 2 block(s)",
  );
  expect(two.every((s) => s.action === "mutant-drill")).toBe(true);

  // A card the planner could not read is a REFUSAL, never a quiet skip.
  expect(plan(undefined).map((s) => s.id)).toEqual(["drill:refused"]);
  expect(plan("---\nid: T-000\n---\n").map((s) => s.id)).toEqual(["drill:refused"]);
});

test("a verdict written before the rule is acknowledged by NAMING its own sha, and never by a blanket", () => {
  // Every verdict on this board older than T-281 assigns corrections and
  // carries no block, so a refusal with no way through makes every
  // in-flight card unmergeable. The way through is `undo.mjs`'s own
  // shape: it names the run's verdict, so it cannot be typed once and
  // reused, and it downgrades the refusal to NEWS rather than to silence.
  const forgotten = cardWithVerdicts(
    verdictEntry(
      "### 2026-09-09 — APPROVED WITH ASSIGNED CORRECTIONS — claude-opus-5@subagent",
      "#### CORRECTION 1 — the denominator is silent",
    ),
  );
  const sha = "5dca625ba66679f9f1deb5820ef8124d0191a38a";
  const at = (blocksAbsent?: string): ReturnType<typeof drillSteps> =>
    drillSteps({
      cardText: forgotten,
      projectRoot: repoRoot,
      id: "T-000",
      verdictSha: sha,
      ...(blocksAbsent === undefined ? {} : { blocksAbsent }),
    });

  // WITHOUT it: refused, and the refusal NAMES the way through.
  const bare = at();
  expect(bare.map((s) => s.id)).toEqual(["drill:refused"]);
  expect(bare[0]?.problem).toContain(`--blocks-absent ${sha.slice(0, 12)}`);

  // NAMING IT: news, not silence, and the run goes on.
  const named = at(sha.slice(0, 12));
  expect(named.map((s) => s.id)).toEqual(["drill:none"]);
  expect(named[0]?.problem, "it is no longer a stop").toBeUndefined();
  expect(named[0]?.warning, "and it is still said out loud").toContain("ACKNOWLEDGED");

  // NOT A BLANKET, in three directions: another sha, a prefix short
  // enough to guess, and the empty string.
  for (const wrong of ["0".repeat(12), sha.slice(0, ACKNOWLEDGE_PREFIX - 1), ""]) {
    const refused = at(wrong);
    expect(refused.map((s) => s.id), `${JSON.stringify(wrong)} is not an acknowledgement`).toEqual([
      "drill:refused",
    ]);
  }
  expect(at("0".repeat(12))[0]?.problem, "and naming the wrong one says so").toContain(
    "not a blanket override",
  );

  // AND IT NEVER REACHES A BLOCK THAT IS THERE: the acknowledgement is
  // about an ABSENT block, so a verdict carrying one is still drilled.
  const carried = drillSteps({
    cardText: cardWithVerdicts(
      verdictEntry(
        "### 2026-09-09 — APPROVED WITH ASSIGNED CORRECTIONS — claude-opus-5@subagent",
        mutantBlockText(),
      ),
    ),
    projectRoot: repoRoot,
    id: "T-000",
    verdictSha: sha,
    blocksAbsent: sha.slice(0, 12),
  });
  expect(carried.map((s) => s.id), "a block that IS there is drilled regardless").toEqual([
    "drill:1",
  ]);
});

test("the mutant drill is the LAST step before the merge's STOP, on every shape of merge", () => {
  const card = cardWithVerdicts(
    verdictEntry(
      "### 2026-09-09 — APPROVED WITH ASSIGNED CORRECTIONS — claude-opus-5@subagent",
      mutantBlockText(),
    ),
  );
  for (const paths of [
    ["docs/tasks/T-000-a-card.md"],
    ["app/src/x.ts", "docs/architecture/graph.json"],
    ["tools/e2e/tests/cli.spec.ts"],
  ]) {
    const plan = tailPlan({ paths, projectRoot: repoRoot, id: "T-000", cardText: card });
    const drill = plan.findIndex((s) => s.id === "drill:1");
    const stop = plan.findIndex((s) => s.kind === "stop");
    expect(drill, `the drill is planned for ${paths.join(", ")}`).toBeGreaterThanOrEqual(0);
    expect(drill, "it comes before the stop that hands the commit back").toBeLessThan(stop);
    // THE PROPERTY IS "NOTHING RUNS A SPEC AFTER IT", AND SINCE T-295 THAT
    // IS WHAT THIS ASSERTS RATHER THAN A POSITION. The drill used to be
    // literally the last step before the stop; three steps now follow it
    // — the counts guard, which is a pure READING of output that has
    // already been produced, and the two writes that render the message
    // and the readings. None of them runs a spec, so the drill is still
    // the last measurement the merge takes, which is the thing the
    // original position was standing in for.
    const after = plan.slice(drill + 1);
    expect(after.length, "steps do follow the drill").toBeGreaterThan(0);
    expect(
      after.some((s) => s.kind === "suite" || s.id.startsWith("drill:")),
      "and not one of them runs a spec",
    ).toBe(false);
    expect(after.map((s) => s.id), "they are the counts, the message, the meters and the stops").toEqual([
      "counts",
      "message",
      "meters",
      "stop",
      "after",
    ]);
    const lastSetup = plan.map((s) => s.kind).lastIndexOf("setup");
    expect(lastSetup, "every setup step precedes it, because it runs a spec").toBeLessThan(drill);
  }
  // THE POSITIVE CONTROL for "the drill is a function of the VERDICT":
  // the same paths with no card text plan a refusal in the same slot,
  // never nothing.
  const blind = tailPlan({ paths: ["README.md"], projectRoot: repoRoot, id: "T-000" });
  expect(blind.map((s) => s.id)).toContain("drill:refused");
});

test("the layout verifier.md publishes IS the layout the merge parses, and each contract states its half once", () => {
  // T-057: a rule with two statements is two chances to disagree. The
  // block's layout is stated in `method/roles/verifier.md`, where the
  // verifier reads it, and implemented in `merge.mjs`, where it is
  // parsed. This body is the only thing that compares them.
  const verifier = readFileSync(path.join(repoRoot, "method", "roles", "verifier.md"), "utf8");
  const integrator = readFileSync(path.join(repoRoot, "method", "roles", "integrator.md"), "utf8");

  const fence = verifier.indexOf("```mutant");
  expect(fence, "verifier.md prints the layout").toBeGreaterThan(0);
  const template = verifier
    .slice(fence)
    .split("\n")
    .slice(1)
    .map((l) => l.trim());
  const close = template.indexOf("```");
  expect(close, "and closes it").toBeGreaterThan(0);
  const printed = template.slice(0, close);
  const oldAt = printed.indexOf(MUTANT_OLD);
  const newAt = printed.indexOf(MUTANT_NEW);
  expect(oldAt, "with the `old` anchor after the keys").toBeGreaterThan(0);
  expect(newAt, "and the `new` anchor after that").toBeGreaterThan(oldAt);
  expect(
    printed.slice(0, oldAt).map((l) => l.split(":")[0]),
    "the keys it publishes are the keys the reader takes, in order",
  ).toEqual([...MUTANT_KEYS]);
  expect(verifier, "with the line-number refusal stated where the block is written").toContain(
    "NEVER A LINE",
  );

  // ONCE EACH, and in its own file: the verifier's half is the block and
  // the commit, the integrator's is the drill and the never-rewrite rule.
  const once = (text: string, marker: string): number => text.split(marker).length - 1;
  expect(once(verifier, "A CORRECTION YOU ASSIGN IS A BODY YOU COMMIT")).toBe(1);
  expect(once(integrator, "RE-DRILL THE VERDICT'S MUTANT BLOCKS")).toBe(1);
  expect(once(integrator, "THE BODY IS NOT YOURS TO WRITE")).toBe(1);
  expect(once(integrator, "A CORRECTION YOU ASSIGN IS A BODY YOU COMMIT"), "one home each").toBe(0);
  expect(once(verifier, "RE-DRILL THE VERDICT'S MUTANT BLOCKS"), "and a pointer, not a copy").toBe(
    0,
  );
  // The pointers themselves — each file names the other's step, which is
  // what the method-eval corpus resolves against the numbered items.
  expect(verifier).toContain("`roles/integrator.md` step 2b");
  expect(integrator).toContain("`roles/verifier.md` step 5b");
  // The stop conditions the integrator's half promises are the ones the
  // reader implements, named in the contract rather than described.
  const flat = integrator.replace(/\s+/g, " ");
  for (const said of [
    "on a survivor",
    "reds more than itself",
    "anchors do not match exactly once",
    "PROVE the restore by sha256",
  ]) {
    expect(flat, `the contract names ${JSON.stringify(said)}`).toContain(said);
  }
});

test("an ABORTING drill still restores the site — the merged tree is never left mutated", () => {
  // THE WORST FAILURE THIS STEP CAN HAVE. The drill writes a mutant into
  // a file on the MERGED tree. If the run throws — a runner that is not
  // installed, a spawn that dies, a Ctrl-C — and the restore is not in a
  // `finally`, the mutant STAYS, and the integrator's next `git add` puts
  // it in the merge commit. The mechanism built to protect the merge
  // becomes the thing that poisons it.
  const root = mkdtempSync(path.join(tmpdir(), "supertaskr-abort-"));
  try {
    const source = "export function f() {\n  return enumerated;\n}\n";
    mkdirSync(path.join(root, "src"), { recursive: true });
    writeFileSync(path.join(root, "src", "a.mjs"), source);
    mkdirSync(path.join(root, "tools", "e2e", "tests"), { recursive: true });
    writeFileSync(
      path.join(root, "tools", "e2e", "tests", "brief.spec.ts"),
      'test("the body that pins it", () => {});\n',
    );
    const block = {
      correction: "C1",
      file: "src/a.mjs",
      spec: "tools/e2e/tests/brief.spec.ts",
      body: "the body that pins it",
      message: "m",
      old: "  return enumerated;",
      new: "  return everything;",
    };
    let sawOnDisk = "";
    expect(() =>
      runMutantDrill({
        block,
        projectRoot: root,
        run: () => {
          sawOnDisk = readFileSync(path.join(root, "src", "a.mjs"), "utf8");
          throw new Error("the runner died mid-drill");
        },
      }),
    ).toThrow("the runner died mid-drill");
    expect(sawOnDisk, "the mutant really was on disk when the run died").toContain(
      "return everything;",
    );
    expect(
      readFileSync(path.join(root, "src", "a.mjs"), "utf8"),
      "and the site is restored ANYWAY — this is what the `finally` buys",
    ).toBe(source);
    // THE POSITIVE CONTROL: the same drill whose run returns normally is
    // restored too, so this body is about the ABORT and not about restoring.
    runMutantDrill({
      block,
      projectRoot: root,
      run: () => ({ code: 1, output: "  1) [chromium] › tests/brief.spec.ts:1:1 › the body that pins it \n    Error: m\n  1 failed" }),
    });
    expect(readFileSync(path.join(root, "src", "a.mjs"), "utf8")).toBe(source);
  } finally {
    removeGitFixture(root, FIXTURE);
  }
});

test("a mutant block's file and spec are CONFINED to the project root — no traversal, no absolute path", () => {
  // SECURITY. A block is TEXT off a card carried on a lane branch, and
  // the drill WRITES the file it names, on the integrator's machine, with
  // `path.join(projectRoot, block.file)`. A `../` segment leaves the
  // repository entirely, and the write is live for the whole spec run.
  for (const escape of [
    "../outside.mjs",
    "../../.git/hooks/pre-commit",
    "src/../../outside.mjs",
    "/etc/hosts",
  ]) {
    const read = readMutantBlocks(mutantBlockText({ file: escape }));
    expect("problem" in read, `${escape} is refused as a \`file\``).toBe(true);
    if ("problem" in read) expect(read.problem).toContain("outside the project root");
  }
  for (const escape of ["tools/e2e/../../../outside.spec.ts", "/tmp/outside.spec.ts"]) {
    const read = readMutantBlocks(mutantBlockText({ spec: escape }));
    expect("problem" in read, `${escape} is refused as a \`spec\``).toBe(true);
  }
  // THE POSITIVE CONTROL, run because a reader that refused every path
  // would be indistinguishable from this one: ordinary in-tree paths are
  // still accepted, and a dot PAIR inside a file name is not a traversal.
  const ok = readMutantBlocks(mutantBlockText());
  expect("problem" in ok, "an in-tree path is accepted").toBe(false);
  const dotted = readMutantBlocks(
    mutantBlockText({ file: "tools/e2e/scripts/a..b.mjs", spec: "tools/e2e/tests/b.spec.ts" }),
  );
  expect("problem" in dotted, "a dot pair inside a name is not a traversal").toBe(false);
});

test("the integrator's never-rewrite rule carries NO hedge — the one clause that would refund this card", () => {
  // A T-221 DATA MUTANT, because the property lives in PROSE: no code
  // mutant can grade it. Inserting "unless it does not apply to the
  // merged tree" into the row leaves the method eval gate at 10 and every
  // other body in this file green — measured. One clause is the whole
  // saving refunded, because "does not apply" is exactly what a tired
  // seat concludes at 11pm.
  const integrator = readFileSync(path.join(repoRoot, "method", "roles", "integrator.md"), "utf8");
  const at = integrator.indexOf("THE BODY IS NOT YOURS TO WRITE");
  expect(at, "the row is there to be read").toBeGreaterThan(0);
  const ends = integrator.indexOf("3. Checkpoint ritual", at);
  expect(ends, "and it ends where the next numbered step begins").toBeGreaterThan(at);
  const row = integrator.slice(at, ends).toLowerCase();
  for (const hedge of [
    "unless",
    "if necessary",
    "when needed",
    "where needed",
    "may adapt",
    "discretion",
    "where appropriate",
    "does not apply",
  ]) {
    expect(row, `the never-rewrite row must not hedge with ${JSON.stringify(hedge)}`).not.toContain(
      hedge,
    );
  }
  // THE POSITIVE CONTROL: the row really is what is being read, so a body
  // that passed because it was reading an empty string would be caught.
  expect(row, "the prohibition itself").toContain("rewriting the body");
  expect(row, "and the corner it governs").toContain("the committed body is what proves it");
});


// ── `npx supertaskr settings` (T-300, ADR-024 decision 6) ─────────────
//
// The process is SETTINGS and every switch is declared ONCE, in
// method/runtime/process-schema.yaml. This verb is the terminal surface
// of that file, and the six bodies below are written against the
// RELATION between the surface and the schema rather than against the
// text it happens to print today: every switch reaches the listing, the
// measured column distinguishes a reading from an estimate, the edit
// keeps the template readable by a REAL yaml parser and by the arm's own,
// each refusal is itself, and the reference chapter is a generation
// rather than a transcription.

/** The schema and the template this repository actually runs, read at body time. */
function process300() {
  const loaded = loadProcess(repoRoot);
  expect(loaded, `${repoRoot} carries ${PROCESS_SCHEMA} and a process: section`).not.toBeNull();
  return loaded!;
}

/** A scratch project carrying THIS repository's schema and template, writable. */
function settingsProject(): string {
  const root = scratchProject();
  mkdirSync(path.join(root, "method", "runtime"), { recursive: true });
  mkdirSync(path.join(root, "docs", "reference"), { recursive: true });
  for (const rel of [PROCESS_SCHEMA, RUNTIME_TEMPLATE]) {
    // WRITTEN, NEVER COPIED: method/ is `chmod a-w` inside a lane
    // worktree (the lane lock), and copyFileSync carries the mode across
    // — so a fixture built by copying is a fixture nothing can edit, and
    // every `set` body would measure the file mode instead of the edit.
    writeFileSync(path.join(root, rel), readFileSync(path.join(repoRoot, rel), "utf8"));
  }
  return root;
}

/* ── THE CHECKPOINT WINDOW, CONSTRUCTED (T-300-s7) ────────────────────
 *
 * `treeReadings` prices the loop bands the way `npm run health` does: the
 * records in docs/checkpoints/meters.jsonl are priced per card against
 * that card's own `T-NNN: dispatch stamp` commit, and `loopReadings` then
 * keeps the cards whose MERGE SECOND is at or after the newest
 * `Checkpoint:` commit's second. The window is a comparison of
 * TIMESTAMPS, not a count of merge commits — so an arrangement built to
 * the prose ("a merge has landed since the checkpoint") and one built to
 * the mechanism are different fixtures, and these are built to the
 * mechanism.
 *
 * AN EMPTY WINDOW IS A LEGITIMATE STATE: it has no worst card, so the
 * bands read UNREAD rather than 0 and the listing shows every switch
 * against the seat's estimate. That is the state this repository is in
 * between a checkpoint and the next merge — which is exactly when a
 * checkpoint is pushed — and a body whose PRECONDITION was the other
 * state reddened every such push (the closing check on the range behind
 * 37dfff4c, T-300-s7's finding).
 *
 * So both windows are CONSTRUCTED below and both are exercised on every
 * run, through the command's own tree read and with no readings map
 * handed in. The two fixtures differ in one thing: the committer date on
 * the `Checkpoint:` commit. The records, the stamp, the schema and the
 * template are identical, which is what makes the pair a measurement of
 * the WINDOW rather than of two unrelated trees.
 * ──────────────────────────────────────────────────────────────────── */

/** The fixture's own card id — the one its `dispatch stamp` commit names. */
const WINDOW_CARD = "T-901";

/** The fixture's dispatch stamp. Every date here is WRITTEN, never taken from the clock. */
const WINDOW_STAMP_AT = "2026-01-02T00:45:00Z";

/** The fixture's one meters record: fifteen minutes after the stamp. */
const WINDOW_RECORD_AT = "2026-01-02T01:00:00Z";

/** A `Checkpoint:` ten minutes BEFORE the record — the window is populated. */
const WINDOW_CHECKPOINT_INSIDE = "2026-01-02T00:50:00Z";

/** A `Checkpoint:` an hour AFTER the record — the window is empty, and honestly so. */
const WINDOW_CHECKPOINT_AFTER = "2026-01-02T02:00:00Z";

/** The seat token figure the fixture's meters block states, in the prose the parser reads. */
const WINDOW_TOKENS = 31000;

/** The tier the fixture's record declares, and therefore the budget its shares are taken against. */
const WINDOW_TIER = "standard";

/**
 * A scratch project carrying this repository's schema and template, a
 * meters file holding ONE VALID record, and a real git history carrying
 * the card's dispatch stamp and a `Checkpoint:` commit — every commit at
 * a date written above rather than taken from the clock, so the ordering
 * this fixture depends on can never be decided by two commits landing in
 * the same second.
 */
function windowProject(opts: { checkpointAt: string; tokens?: number }): string {
  const root = settingsProject();
  const tokens = opts.tokens ?? WINDOW_TOKENS;
  mkdirSync(path.join(root, "docs", "checkpoints"), { recursive: true });
  writeFileSync(
    path.join(root, "docs", "checkpoints", "meters.jsonl"),
    `${JSON.stringify({
      at: WINDOW_RECORD_AT,
      card: WINDOW_CARD,
      size: "S",
      tier: WINDOW_TIER,
      seat: "executor",
      meters: `## Meters\n- context consumed: about ${tokens.toLocaleString("en-US")} tokens of the 15,000,000 budget.`,
    })}\n`,
  );
  const git = (args: string[], at: string): string =>
    execFileSync("git", ["-C", root, ...NO_BACKGROUND_MAINTENANCE, ...args], {
      encoding: "utf8",
      env: { ...process.env, GIT_AUTHOR_DATE: at, GIT_COMMITTER_DATE: at },
    });
  // `-b main`, never bare `git init`: `init.defaultBranch` is MACHINE
  // config, and an unpinned fixture builds a different repository here
  // than on the runner (docs/CONVENTIONS.md).
  execFileSync("git", ["init", "-q", "-b", "main", root], { stdio: "pipe" });
  git(["config", "user.email", "fixture@example.invalid"], WINDOW_STAMP_AT);
  git(["config", "user.name", "T-300-s7 fixture"], WINDOW_STAMP_AT);
  // THE STAMP FIRST, THE CHECKPOINT SECOND, AND THE RECORD'S OWN `at`
  // WRITTEN INTO THE FILE. The cycle this prices is stamp-to-record; the
  // window is checkpoint-to-record; and only the second commit's date
  // moves between the two arrangements.
  git(
    ["commit", "-q", "--allow-empty", "-m", `${WINDOW_CARD}: dispatch stamp — status: building`],
    WINDOW_STAMP_AT,
  );
  git(["commit", "-q", "--allow-empty", "-m", "Checkpoint: the fixture's own anchor"], opts.checkpointAt);
  return root;
}

/** The listing this command prints for one project, with NOTHING handed in but the root. */
function listingOf(root: string): string {
  const said: string[] = [];
  // NO `readings` INJECTED, here or anywhere in this body's fixtures.
  // This is the one channel that makes the command go and FIND them,
  // which is what "the project's own band reading" means and what a
  // hand-built map can never decide.
  const status = settingsMain(["--root", root], {
    stdout: (s) => said.push(s),
    stderr: (s) => said.push(s),
  });
  expect(status, `the listing is the one verb that must work everywhere, and it did not on ${root}`).toBe(
    EXIT.CLEAN,
  );
  return said.join("\n");
}

test("the settings listing names the profile and EVERY switch the schema declares, in the schema's order", () => {
  const loaded = process300();
  const rows = settingsRows({ ...loaded, readings: new Map(), units: new Map() });
  expect(
    rows.map((r) => r.id),
    "the rows ARE the schema's switches, in its order — a surface that renders one row fewer " +
      "than the loop has is a settings screen nobody can trust",
  ).toEqual([...loaded.schema.switches.keys()]);

  const said: string[] = [];
  const status = settingsMain(["--root", repoRoot], {
    stdout: (s) => said.push(s),
    stderr: (s) => said.push(s),
    readings: new Map(),
  });
  expect(status).toBe(EXIT.CLEAN);
  const out = said.join("\n");
  expect(out, "the profile this project runs").toContain(`profile: ${loaded.settings.profile}`);
  expect(out, "and the profiles it may run").toContain(loaded.settings.available.join(", "));
  for (const [id, sw] of loaded.schema.switches) {
    expect(out, `${id} is listed with the value it resolves to`).toContain(
      `  ${id} = ${loaded.settings.values.get(id) ?? ""}`,
    );
    expect(out, `${id} carries its one-line explanation`).toContain(sw.what);
    if (sw.floor) expect(out, `${id} says it is floor`).toContain(`${id} = ${loaded.settings.values.get(id) ?? ""}  [FLOOR`);
  }
  // NOT VACUOUS: the listing is a rendering of THIS schema, so a switch
  // the schema does not declare is absent from it.
  expect(out).not.toContain("definitely.not.a.switch");
});

test("a switch shows the project's own band reading where the tree has one, and the seat's ESTIMATE where it does not", () => {
  const readings = new Map([["loop/cycle-budget-used", { value: 418.74, derivation: "the meters" }]]);
  const units = new Map([["loop/cycle-budget-used", "% of the tier's budget"]]);

  const read = measuredFor({ band: ["loop/cycle-budget-used"], cost: "1 to 3 min" }, readings, units);
  expect(read.kind, "a band this tree has read is a READING").toBe("reading");
  expect(read.text).toContain("loop/cycle-budget-used = 418.74 % of the tier's budget");
  expect(read.text, "and a reading is not dressed as an estimate").not.toContain("estimate");

  const unread = measuredFor({ band: ["loop/token-budget-used"], cost: "about 50K tokens per seat" }, readings, units);
  expect(unread.kind, "a band nothing has read falls back to the schema's cost").toBe("estimate");
  expect(unread.text, "LABELLED as the seat's estimate — a cost nobody measured rendered in a " +
    "reading's voice is a settings screen inviting a decision on a number that came out of a room")
    .toContain("the seat's estimate — about 50K tokens per seat");
  expect(unread.text, "and it names the band it is waiting for").toContain("awaiting loop/token-budget-used");

  const none = measuredFor({ band: [], cost: "seconds" }, readings, units);
  expect(none.kind).toBe("estimate");
  expect(none.text, "a switch no band measures says so").toContain("no band measures this yet");

  // THE PARTIAL CASE, which is the one a single-band test cannot see: a
  // switch measured by two bands of which ONE has been read is reported
  // as read, and the unread one is NAMED beside it.
  const partial = measuredFor(
    { band: ["loop/cycle-budget-used", "loop/token-budget-used"], cost: "the tiers' own budgets" },
    readings,
    units,
  );
  expect(partial.kind).toBe("reading");
  expect(partial.text).toContain("unread: loop/token-budget-used");
});

test("an allowed set writes ONE departure that a real yaml parser and the arm's own reader agree about", () => {
  const loaded = process300();
  const before = readFileSync(path.join(repoRoot, RUNTIME_TEMPLATE), "utf8");
  const plan = setPlan({
    schema: loaded.schema,
    settings: loaded.settings,
    id: "build.criteria_echo",
    value: "off",
  });
  expect(plan.remove, "`off` is not the standard profile's own value, so it IS a departure").toBe(false);
  const after = editTemplate(before, plan);

  expect(
    after.split("\n").length,
    "ONE line was added — the section is method text a human wrote, and an editor that " +
      "round-tripped it through a yaml emitter would hand back the same document with every " +
      "comment gone",
  ).toBe(before.split("\n").length + 1);
  expect(after, "the profile line survives").toContain(`profile: ${loaded.settings.profile}`);
  expect(after.endsWith("\n"), "and the file keeps its trailing newline").toBe(true);
  for (const line of before.split("\n").filter((l) => l.trimStart().startsWith("#"))) {
    expect(after, "every comment survives").toContain(line);
  }

  // BOTH READERS, AND THEY MUST AGREE. `off` is a BOOLEAN to a yaml
  // parser, so a toggle written bare comes back as `false`, fails its own
  // value set, and takes the tree to the refusal loadProcess keeps for a
  // project that contradicts itself — written by the command whose job
  // was to keep it consistent.
  const real = parseYaml(after) as { process: { switches: Record<string, unknown> } };
  expect(
    real.process.switches["build.criteria_echo"],
    "a real yaml parser reads back the STRING, not the boolean",
  ).toBe("off");
  const section = processSection(after);
  expect(section, "the arm's own reader finds the section").not.toBeNull();
  expect(section!.overrides.get("build.criteria_echo")).toBe("off");
  expect(resolveProcess(loaded.schema, section!).values.get("build.criteria_echo")).toBe("off");

  // And the quoting rule itself, both ways round.
  expect(yamlScalar("off"), "a boolean-shaped value is quoted").toBe('"off"');
  expect(yamlScalar("state-and-index"), "a plain one is not").toBe("state-and-index");
});

test("setting a switch to the profile's OWN value removes the departure rather than writing one", () => {
  const loaded = process300();
  const before = readFileSync(path.join(repoRoot, RUNTIME_TEMPLATE), "utf8");
  const departed = editTemplate(
    before,
    setPlan({ schema: loaded.schema, settings: loaded.settings, id: "build.criteria_echo", value: "off" }),
  );
  expect(processSection(departed)!.overrides.get("build.criteria_echo")).toBe("off");

  const back = setPlan({
    schema: loaded.schema,
    settings: resolveProcess(loaded.schema, processSection(departed)!),
    id: "build.criteria_echo",
    value: loaded.settings.values.get("build.criteria_echo") ?? "",
  });
  expect(back.remove, "a value that IS the profile's own is not a departure").toBe(true);
  const restored = editTemplate(departed, back);
  expect(
    processSection(restored)!.overrides.has("build.criteria_echo"),
    "the section names the profile and the DEPARTURES only, so a departure that departs from " +
      "nothing is removed rather than left to read as a decision",
  ).toBe(false);
  expect(restored, "and removing it puts the file back exactly as it was").toBe(before);
});

test("each of the four refusals a set owes is ITSELF, and the template is not touched by any of them", () => {
  const loaded = process300();
  const s = loaded.schema;
  const settings = loaded.settings;
  expect(
    () => setPlan({ schema: s, settings, id: "definitely.not.a.switch", value: "on" }),
    "an id the schema does not declare",
  ).toThrow(/is not a switch/);
  expect(
    () => setPlan({ schema: s, settings, id: "push.token", value: "off" }),
    "a FLOOR switch",
  ).toThrow(/is FLOOR/);
  expect(
    () => setPlan({ schema: s, settings, id: "read.standing", value: "banana" }),
    "a value outside the switch's own set",
  ).toThrow(/is not one of/);

  // THE FOURTH IS THE CRITERION'S HEART, and it is not this command's
  // judgement: it is the SCHEMA'S constraints, run over the settings the
  // write WOULD produce, so the refusal names both switches and both
  // values and a constraint added to the schema is enforced the day it
  // lands.
  let forbidden = "";
  try {
    setPlan({ schema: s, settings, id: "record.bands", value: "off" });
  } catch (e) {
    forbidden = e instanceof Error ? e.message : String(e);
  }
  expect(forbidden, "a combination the constraints forbid is refused").toContain("FORBIDDEN COMBINATION");
  expect(forbidden, "naming the switch that needs it").toContain("merge.meters_to_bands");
  expect(forbidden, "naming the switch asked for").toContain("record.bands");
  expect(forbidden, "and both values").toContain("`off`");

  // AND THROUGH THE REAL ENTRY POINT, over a project of its own, where
  // "nothing was written" is a fact about a file rather than about a throw.
  const root = settingsProject();
  try {
    const templateAt = path.join(root, RUNTIME_TEMPLATE);
    const untouched = readFileSync(templateAt, "utf8");
    for (const args of [
      ["set", "definitely.not.a.switch", "on"],
      ["set", "push.token", "off"],
      ["set", "read.standing", "banana"],
      ["set", "record.bands", "off"],
      ["set", "read.standing"],
    ]) {
      const said: string[] = [];
      const status = settingsMain(["--root", root, ...args], {
        stdout: (s2) => said.push(s2),
        stderr: (s2) => said.push(s2),
        readings: new Map(),
      });
      expect(status, `${args.join(" ")} is CALLED WRONG, never a silent success`).toBe(EXIT.USAGE);
      expect(said.join("\n"), `${args.join(" ")} says what it refused`).not.toBe("");
      expect(readFileSync(templateAt, "utf8"), `${args.join(" ")} wrote nothing`).toBe(untouched);
    }
    // THE POSITIVE CONTROL: the same entry point, one legal value, DOES write.
    const ok = settingsMain(["--root", root, "set", "build.criteria_echo", "off"], {
      stdout: () => {},
      stderr: () => {},
      readings: new Map(),
    });
    expect(ok, "an allowed set is clean").toBe(EXIT.CLEAN);
    expect(readFileSync(templateAt, "utf8"), "and it really moved the file").not.toBe(untouched);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("the committed settings chapter is a GENERATION of the schema, and a schema nobody regenerated for reds", () => {
  const schema = parseProcessSchema(readFileSync(path.join(repoRoot, PROCESS_SCHEMA), "utf8"));
  // READ BY ITS LITERAL PATH, so the docs gate's own derivation SEES
  // this spec as a reader of the page — a currency body the gate cannot
  // link is a body nobody is told to run when the page moves.
  const chapter = path.join(repoRoot, "docs", "reference", "15-settings.md");
  expect(path.join(repoRoot, REFERENCE_DOC), "and that IS the page the command writes").toBe(chapter);
  const committed = readFileSync(chapter, "utf8");
  expect(
    committed,
    `${REFERENCE_DOC} is stale against ${PROCESS_SCHEMA} — run \`node tools/e2e/scripts/` +
      "settings.mjs reference --write\` and commit what it wrote; the chapter is GENERATED, " +
      "never typed",
  ).toBe(renderReference(schema));
  expect(
    readFileSync(path.join(repoRoot, "docs", "reference", "README.md"), "utf8"),
    "and the chapter table names it, so the reference has no orphan page",
  ).toContain("15-settings.md");

  // NOT VACUOUS, AND THE PLANT IS A DATA MUTANT — the shape a stale
  // commit really takes is a page that was true when it was written.
  const first = [...schema.switches.values()][0];
  expect(first, "the schema declares a switch to plant against").toBeDefined();
  const moved = parseProcessSchema(
    readFileSync(path.join(repoRoot, PROCESS_SCHEMA), "utf8").replace(
      `what: "${first!.what}"`,
      `what: "${first!.what}, and something nobody regenerated for"`,
    ),
  );
  expect(renderReference(moved), "a schema that moved moves the page").not.toBe(committed);

  // AND THE PAGE IS A FUNCTION OF THE SCHEMA ALONE: a project that sets a
  // switch has not changed its documentation, and a chapter that moved
  // when it did would red this body for something that is not a
  // documentation change.
  const loaded = process300();
  const edited = editTemplate(
    readFileSync(path.join(repoRoot, RUNTIME_TEMPLATE), "utf8"),
    setPlan({ schema, settings: loaded.settings, id: "build.criteria_echo", value: "off" }),
  );
  expect(edited, "the template really moved").not.toBe(
    readFileSync(path.join(repoRoot, RUNTIME_TEMPLATE), "utf8"),
  );
  expect(renderReference(schema), "and the chapter did not").toBe(committed);
});

/* ── THE DISPATCH BLOCK OF THE RUNTIME TEMPLATE (T-319) ───────────────
 *
 * The parser library's own suite pins the READING — every field, every
 * refusal — against fixtures it can show you. What it cannot pin is the
 * SHIPPED tree: which words this project's schema actually declares,
 * whether this project carries a grant, and whether the generated
 * chapter is a generation of that declaration. Those four bodies are
 * here, where the live tree lives.
 *
 * AND THIS CARD CLAIMS NO ADMISSION. Nothing below asserts that the arm
 * admits or refuses a dispatch by the block: it does not, the schema
 * says so in every row's label, and T-324 owns that half.
 * ──────────────────────────────────────────────────────────────────── */

/** A block the SHIPPED declaration accepts, for a body that needs one. */
const SHIPPED_BLOCK_FIXTURE = [
  "dispatch:",
  "  approval: until",
  "  recovery: repairs",
  "  grant:",
  '    given_by: "a fixture owner"',
  '    at: "2026-01-02T03:04:05Z"',
  "    revision: 2",
  "    order: [T-901, T-902]",
  "    until: T-902",
  "    cards:",
  "      T-901: a1b2c3d4e5f60718293a4b5c6d7e8f9012345678",
  "      T-902: b2c3d4e5f60718293a4b5c6d7e8f90123456789a",
  "  history:",
  '    - given_by: "a fixture owner"',
  '      at: "2026-01-01T00:00:00Z"',
  "      revision: 1",
  "      order: [T-901]",
  "      cards:",
  "        T-901: a1b2c3d4e5f60718293a4b5c6d7e8f9012345678",
  "",
].join("\n");

test("THE SHIPPED SCHEMA'S DISPATCH BLOCK DECLARATION reads the same to the hand parser and to a real YAML parser", () => {
  // KILLED BY: a hand parser that drops an attribute of a row, one that
  // keeps a value's quotes, one that loses a flow list's last item and
  // one that reads a row off the wrong indent — over the file this
  // project actually ships rather than over a fixture. The two readings
  // share no line of code.
  const text = readFileSync(path.join(repoRoot, PROCESS_SCHEMA), "utf8");
  const real = (parseYaml(text) as { dispatch_block?: Record<string, unknown> }).dispatch_block;
  expect(real, `${PROCESS_SCHEMA} carries no dispatch block declaration at all`).toBeDefined();
  const mine = parseProcessSchema(text).dispatch;
  expect(mine, "the hand parser read no declaration out of the shipped schema").not.toBeNull();
  const decl = mine as NonNullable<typeof mine>;
  const theirs = (real as Record<string, unknown>)["fields"] as Record<string, Record<string, unknown>>;
  expect(decl.key, "dispatch_block.key").toBe((real as Record<string, unknown>)["key"]);
  expect(decl.what, "dispatch_block.what").toBe((real as Record<string, unknown>)["what"]);
  expect(decl.effect, "dispatch_block.effect").toBe((real as Record<string, unknown>)["effect"]);
  expect(decl.reads, "dispatch_block.reads").toBe((real as Record<string, unknown>)["reads"]);
  expect([...decl.fields.keys()], "the field ids or their order disagree").toEqual(Object.keys(theirs));
  for (const [id, row] of decl.fields) {
    const them = theirs[id] as Record<string, unknown>;
    expect(row.required, `${id}.required`).toBe(them["required"]);
    expect(row.shape, `${id}.shape`).toBe(them["shape"]);
    expect(row.values, `${id}.values`).toEqual(them["values"]);
    expect(row.absent, `${id}.absent`).toBe(them["absent"]);
    expect(row.advisory, `${id}.advisory`).toBe(them["advisory"] === true);
    expect(row.implementation, `${id}.implementation`).toBe(them["implementation"]);
    expect(row.what, `${id}.what`).toBe(them["what"]);
  }
});

test("THE SHIPPED DISPATCH BLOCK'S OPERATIONAL ROWS ARE THE ONES THE ARM BRANCHES ON, the limits are the advisory ones, and the no-grant words are `each` and `none`", () => {
  // T-319's FOURTH CRITERION, MOVED BY T-324 AS THAT BODY SAID IT WOULD
  // BE. Under T-319 the block was readable configuration and every row
  // was declarative; T-324 built the admission lifecycle on it, so the
  // rows the arm BRANCHES on say `operational` and the rows that are a
  // record still say `declarative`. KILLED BY: a row relabelled with no
  // read site behind it, a manual row appearing in a block no seat
  // performs by hand, a limits row that stops saying it is advisory, and
  // a no-grant value edited to something this project's own criterion
  // does not say.
  const decl = parseProcessSchema(readFileSync(path.join(repoRoot, PROCESS_SCHEMA), "utf8")).dispatch;
  expect(decl, "the shipped schema declares no dispatch block").not.toBeNull();
  const rows = [...(decl as NonNullable<typeof decl>).fields.values()];
  // NOT ONE ROW IS MANUAL: the block is a record the owner edits and a
  // reader reads, and there is no instruction in it addressed to a seat.
  expect(
    rows.filter((r) => r.implementation === "manual").map((r) => r.id),
    "a dispatch block row says a person performs it, and no row of this block names an action",
  ).toEqual([]);
  // THE OPERATIONAL ROWS ARE EXACTLY THE ONES T-324 MADE OPERATIONAL,
  // and the list is here rather than derived because the claim IS the
  // list: a row added to it silently would be a label nobody argued for.
  expect(
    rows.filter((r) => r.implementation === "operational").map((r) => r.id),
    "the operational rows of the dispatch block moved",
  ).toEqual([
    "approval",
    "recovery",
    "grant",
    "grant.revision",
    "grant.order",
    "grant.until",
    "grant.cards",
    "revoked",
  ]);
  expect(rows.length, "the declaration parsed to too few rows to be the block").toBeGreaterThan(10);
  // THE ADVISORY ROWS ARE THE LIMITS AND NOTHING ELSE: the two the card
  // names are advisory, and no row outside that container is.
  expect(
    rows.filter((r) => r.advisory).map((r) => r.id),
    "the advisory rows are not the limits family",
  ).toEqual(["limits", "limits.tokens", "limits.expires_at"]);
  for (const id of ["limits.tokens", "limits.expires_at"]) {
    expect(
      (decl as NonNullable<typeof decl>).fields.get(id)?.advisory,
      `${id} stopped saying it is advisory, and nothing in this tree enforces it`,
    ).toBe(true);
  }
  // AND THE EXPLICIT NO-GRANT STATE IS THIS PROJECT'S OWN WORDS.
  expect(
    (decl as NonNullable<typeof decl>).fields.get("approval")?.absent,
    "the no-grant approval mode",
  ).toBe("each");
  expect(
    (decl as NonNullable<typeof decl>).fields.get("recovery")?.absent,
    "the no-grant recovery policy",
  ).toBe("none");
  expect(
    (decl as NonNullable<typeof decl>).fields.get("approval")?.values,
    "the approval mode's three values",
  ).toEqual(["each", "until", "standing"]);
  expect(
    (decl as NonNullable<typeof decl>).fields.get("recovery")?.values,
    "the recovery policy's two values",
  ).toEqual(["none", "repairs"]);
});

// ── §THE REAL CONFIGURATION, AND THE ONE BODY THAT READS IT (T-330) ──
//
// Until this card two bodies asserted the NO-GRANT STATE as a property
// of this project — one here, one in brief.spec.ts — and their own
// comments said they would move on the day a migration grant was
// approved. That day came, and an ordinary configuration change red the
// bodies that had frozen yesterday's configuration. The settings
// COMBINATIONS moved to controlled fixture templates, where a
// combination belongs; what this project is actually configured to is
// checked HERE, in one place, by a body that reads the real file and
// validates whatever it finds rather than asserting what it expects.

/** A CONTROLLED TEMPLATE, authored here and never read off this tree, so
 *  a body about the READER is never also a body about the configuration.
 *  It carries no dispatch block: one is appended by whichever body wants
 *  one, which is the only way a base can be appended to twice safely. */
const CONTROLLED_TEMPLATE = [
  "# A controlled template (T-330) — not this project's.",
  "roles:",
  "  builder: fixture-builder@probe",
  "",
  "process:",
  "  profile: standard",
  "  switches:",
  "",
].join("\n");

/** What a grant is checked AGAINST — injectable, so the drills below are
 *  pure and this project's own git objects are never written to. */
interface GrantTreeIo {
  /** The card file for an id, repo-relative, or null where none exists. */
  cardFile: (id: string) => string | null;
  /** The card's blob sha NOW, or null. */
  currentBlob: (rel: string) => string | null;
  /** The card's bytes NOW, or null. */
  currentText: (rel: string) => string | null;
  /** The card at the blob the grant recorded, or null where this
   *  repository does not carry those bytes. */
  approvedText: (sha: string) => string | null;
}

/** The live tree, read through git itself. */
function liveGrantIo(root: string): GrantTreeIo {
  const git = (argv: string[]): string | null => {
    try {
      // STDERR IS SWALLOWED, AND ONLY HERE: a miss is an ANSWER to this
      // reader ("this repository does not carry those bytes"), and git
      // announces it on stderr as `fatal:` — a line that would read to a
      // human scanning the run as a suite that broke rather than a check
      // that discriminated.
      return execFileSync("git", ["-C", root, ...argv], {
        encoding: "utf8",
        maxBuffer: 64 * 1024 * 1024,
        stdio: ["ignore", "pipe", "ignore"],
      });
    } catch {
      return null;
    }
  };
  return {
    cardFile: (id) => {
      const listed = git(["ls-files", `docs/tasks/${id}-*.md`]);
      const first = (listed ?? "").split("\n").map((l) => l.trim()).filter((l) => l !== "")[0];
      return first ?? null;
    },
    currentBlob: (rel) => git(["hash-object", "--", rel])?.trim() ?? null,
    currentText: (rel) => {
      try {
        return readFileSync(path.join(root, rel), "utf8");
      } catch {
        return null;
      }
    },
    approvedText: (sha) => git(["cat-file", "-p", sha]),
  };
}

/**
 * EVERY WAY A CONFIGURED GRANT CAN FAIL TO MATCH THE TREE IT GOVERNS,
 * named one finding per failure, over the block the PARSER'S OWN READER
 * returned — never over a second parse of the file.
 *
 * THE BINDING IS TO THE CARD AND NOT TO THE BYTES, which is why the blob
 * arm ends in `cardDrift` rather than in an equality: the loop's own
 * ceremony stamps `status:` and the seat fields onto an approved card
 * between the yes and the build, and a check that refused those would be
 * a requirement the admission itself does not make.
 */
function grantFindings(
  block: ReturnType<typeof parserPure.dispatchBlock>,
  declared: { approval: readonly string[]; recovery: readonly string[] },
  io: GrantTreeIo,
): string[] {
  const out: string[] = [];
  if (!block.present) return ["the template carries no dispatch block, so there is no grant to validate"];
  if (!declared.approval.includes(block.approval)) {
    out.push(`the approval mode \`${block.approval}\` is not one the schema declares`);
  }
  if (!declared.recovery.includes(block.recovery)) {
    out.push(`the recovery policy \`${block.recovery}\` is not one the schema declares`);
  }
  const grant = block.current;
  if (grant === null) {
    out.push("the block is present and names no current grant");
    return out;
  }
  if (block.revision < 1) out.push(`a present grant reads at revision ${String(block.revision)}`);
  if (grant.order.length === 0) out.push("the grant approves no card at all");
  for (const id of grant.order) {
    const pinned = grant.cards.get(id);
    if (pinned === undefined || pinned === "") {
      out.push(`${id} is in the grant's order and carries no blob in its card map`);
      continue;
    }
    const rel = io.cardFile(id);
    if (rel === null) {
      out.push(`${id} is approved and names no card file in this tree`);
      continue;
    }
    const now = io.currentBlob(rel);
    if (now === pinned) continue;
    const approved = io.approvedText(pinned);
    if (approved === null) {
      out.push(`${id} is pinned to blob ${pinned.slice(0, 12)} and this repository does not carry those bytes`);
      continue;
    }
    const current = io.currentText(rel);
    if (current === null) {
      out.push(`${id} names ${rel}, which this tree cannot read`);
      continue;
    }
    const moved = cardDrift(approved, current);
    if (!moved.mechanical) {
      out.push(`${id} has moved beyond the admission's mechanical drift: ${moved.substantive.join("; ")}`);
    }
  }
  return out;
}

/** The two value sets the schema declares for the block's modes. */
function declaredModes(schemaText: string): { approval: readonly string[]; recovery: readonly string[] } {
  const decl = parseProcessSchema(schemaText).dispatch;
  expect(decl, "the shipped schema declares no dispatch block").not.toBeNull();
  const fields = (decl as NonNullable<typeof decl>).fields;
  return {
    approval: fields.get("approval")?.values ?? [],
    recovery: fields.get("recovery")?.values ?? [],
  };
}

test("THE REAL CONFIGURATION IS CHECKED THROUGH THE PARSER'S READER — this project's SHIPPED TEMPLATE carries no grant at all, and where the live authorization is read from is derived rather than assumed", () => {
  // THE ONE BODY IN THIS LANE THAT READS THIS PROJECT'S OWN RUNTIME
  // TEMPLATE AND JUDGES WHAT IT FINDS (T-330's third criterion). It
  // asserts the configuration it READS rather than the configuration
  // somebody remembers: under a grant every row is validated and every
  // approved card is matched against the tree; under none the explicit
  // no-grant state is read out in as many words. Both are real
  // assertions, and the drills in the body below are what stop the
  // validating half being vacuous on a day the tree carries no grant.
  //
  // KILLED BY: a reader that answers `undefined` instead of a state, a
  // grant whose order names a card this tree has lost, a blob that has
  // gone stale beyond the admission's own mechanical drift, and a seat
  // that wrote a grant down from memory.
  const schemaText = readFileSync(path.join(repoRoot, PROCESS_SCHEMA), "utf8");
  const schema = parseProcessSchema(schemaText);
  const template = readFileSync(path.join(repoRoot, RUNTIME_TEMPLATE), "utf8");
  const block = parserPure.dispatchBlock(template, schema);

  // THE SHIPPED TEMPLATE CARRIES NO GRANT, AND SINCE T-344 THAT IS A
  // REQUIREMENT RATHER THAN A STATE THIS BODY REPORTS. The template is a
  // code input the Rust kit embeds at compile time, so a grant here costs
  // a publication per approval and rides into every project the kit
  // scaffolds. The active grant lives in the operational store at the
  // designated integration checkout instead; a block found here would be
  // a STRAY, which the arm reports and never obeys.
  expect(block.approval, "the no-grant approval mode").toBe("each");
  expect(block.recovery, "the no-grant recovery policy").toBe("none");
  expect(block.grant, `a grant was read out of ${RUNTIME_TEMPLATE}, which is no longer its home`).toBeNull();
  expect(block.current, "a current grant was read out of the shipped template").toBeNull();
  expect(block.revision, "the no-grant revision").toBe(0);
  expect(block.history, "a history was read out of the shipped template").toEqual([]);
  expect(block.present, `${RUNTIME_TEMPLATE} carries a dispatch block again — the grant left it at T-344`).toBe(false);

  // AND WHERE THE LIVE AUTHORIZATION IS READ FROM IS DERIVED, never
  // assumed. This suite runs in three kinds of checkout — the integration
  // one, a lane worktree and the verifier's detached bench — and only the
  // first may hold the store. So the body asks which this is and grades
  // the answer it is entitled to: a refusal NAMING the location, or a
  // state. What it must never meet is a silent "no grant" somewhere the
  // grant could not have been verified.
  const where = grantStoreLocation(repoRoot);
  if (where.designated) {
    const state = grantState(repoRoot);
    expect(state.source, "the designated checkout does not say where it read the grant from").not.toBe("");
    if (state.enforced) {
      expect(state.revision, "a recorded grant reads at revision 0").toBeGreaterThan(0);
      expect(state.block?.current?.order.length ?? 0, "a recorded grant approves no card").toBeGreaterThan(0);
      expect(state.block?.current?.givenBy ?? "", "a recorded grant says nobody gave it").not.toBe("");
      expect(state.block?.current?.at ?? "", "a recorded grant carries no instant").not.toBe("");
    }
  } else {
    let refused: unknown;
    try {
      grantState(repoRoot);
    } catch (err) {
      refused = err;
    }
    expect(refused, `${where.kind} answered a grant instead of refusing`).toBeInstanceOf(GrantStoreFinding);
    expect(String((refused as Error).message), "the refusal does not name the location it refused").toContain(
      where.root,
    );
  }

  // AND EVERY READ-ONLY SETTINGS OPERATION KEEPS WORKING EXACTLY AS
  // BEFORE — the same template, the same profile, the same listing.
  const loaded = process300();
  expect(processSection(template)?.profile, "the profile stopped reading").toBe(loaded.settings.profile);
  expect(
    settingsRows({ ...loaded, readings: new Map(), units: new Map() }).length,
    "the listing lost a row",
  ).toBe(loaded.schema.switches.size);
});

test("A PLANTED CONFIGURATION DEFECT IS REFUSED BY NAME — a mode the schema does not declare, a card missing from the map, a blob this tree does not carry, and a card rewritten past the mechanical drift", () => {
  // THE CARD'S THIRD CRITERION, ITS REFUSAL HALF, AND THE CONTROL COMES
  // FIRST: without it, "the check refuses a defect" is satisfied by a
  // check that refuses everything. Each defect is planted into a
  // CONTROLLED template over a card this repository really tracks, so the
  // subject is the check and not the configuration of the day — and this
  // body is what makes the validating arm above a real instrument on a
  // tree that carries no grant at all.
  const schemaText = readFileSync(path.join(repoRoot, PROCESS_SCHEMA), "utf8");
  const schema = parseProcessSchema(schemaText);
  const declared = declaredModes(schemaText);
  const card = execFileSync("git", ["-C", repoRoot, "ls-files", "docs/tasks/T-*.md"], { encoding: "utf8" })
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.endsWith(".md"))
    .sort()[0];
  expect(card, "no task card is tracked, and this body is about one").not.toBeUndefined();
  const rel = card as string;
  const id = /docs\/tasks\/(T-[0-9]+(?:-s[0-9]+)?)-/.exec(rel)?.[1];
  expect(id, `${rel} does not spell a card id this body can read`).not.toBeUndefined();
  const cardId = id as string;
  const text = readFileSync(path.join(repoRoot, rel), "utf8");
  const blob = execFileSync("git", ["-C", repoRoot, "hash-object", "--", rel], { encoding: "utf8" }).trim();

  const blockText = (o: { approval: string; order: string[]; cards: Record<string, string> }): string =>
    [
      "",
      "dispatch:",
      `  approval: ${o.approval}`,
      "  recovery: repairs",
      "  grant:",
      '    given_by: "a fixture owner"',
      '    at: "2026-01-02T03:04:05Z"',
      "    revision: 1",
      `    order: [${o.order.join(", ")}]`,
      "    cards:",
      ...o.order.map((c) => `      ${c}: ${o.cards[c] ?? blob}`),
      "  history: []",
      "",
    ].join("\n");
  const read = (t: string) => parserPure.dispatchBlock(`${CONTROLLED_TEMPLATE}${t}`, schema);
  const io = liveGrantIo(repoRoot);

  // THE READER'S OWN CONTROL, CARRIED OVER FROM THE BODY THIS ONE
  // REPLACED: a controlled template that DOES carry a block reads every
  // row of it, history included, so the no-grant answer above is about a
  // template with no block rather than about a reader that answers "no
  // grant" to everything.
  const granted = parserPure.dispatchBlock(`${CONTROLLED_TEMPLATE}\n${SHIPPED_BLOCK_FIXTURE}`, schema);
  expect(granted.present, "the control: a template WITH a block still read as absent").toBe(true);
  expect(granted.approval, "the control: the mode").toBe("until");
  expect(granted.recovery, "the control: the policy").toBe("repairs");
  expect(granted.revision, "the control: the revision").toBe(2);
  expect(granted.grant?.until, "the control: the card the grant runs up to").toBe("T-902");
  expect(granted.history.map((h) => h.revision), "the control: the history").toEqual([1]);

  // THE CONTROL: a well-formed grant over a real card at its real blob
  // validates clean.
  const clean = read(blockText({ approval: "standing", order: [cardId], cards: { [cardId]: blob } }));
  expect(clean.present, "the control's own block was not read as present").toBe(true);
  expect(grantFindings(clean, declared, io), "the control: a sound grant was refused").toEqual([]);

  // A MODE THE SCHEMA DOES NOT DECLARE. The parser refuses it at the
  // read, which is the earliest place it can be refused and the reason
  // this check never has to decide what an undeclared mode means.
  let refusedMode: unknown;
  try {
    read(blockText({ approval: "sometimes", order: [cardId], cards: { [cardId]: blob } }));
  } catch (err) {
    refusedMode = err;
  }
  expect(refusedMode, "a mode outside the declared set was read as a grant").not.toBeUndefined();
  expect(String(refusedMode), "the refusal does not name the value it refused").toContain("sometimes");
  // AND THE CHECK REFUSES IT TOO where a reader hands one through, which
  // is what makes the value set checked rather than assumed.
  expect(
    grantFindings({ ...clean, approval: "sometimes" } as typeof clean, declared, io),
    "an undeclared mode passed the check",
  ).toEqual([`the approval mode \`sometimes\` is not one the schema declares`]);

  // A CARD IN THE ORDER THAT THE MAP DOES NOT CARRY. The parser refuses
  // this at the read too, and names the id — an order and a card map that
  // disagree are either an approval with no revision or a revision nobody
  // approved.
  let refusedMissing: unknown;
  try {
    read(
      [
        "",
        "dispatch:",
        "  approval: standing",
        "  recovery: repairs",
        "  grant:",
        '    given_by: "a fixture owner"',
        '    at: "2026-01-02T03:04:05Z"',
        "    revision: 1",
        `    order: [${cardId}, T-999]`,
        "    cards:",
        `      ${cardId}: ${blob}`,
        "  history: []",
        "",
      ].join("\n"),
    );
  } catch (err) {
    refusedMissing = err;
  }
  expect(refusedMissing, "an order naming a card the map does not carry was read as a grant").not.toBeUndefined();
  expect(String(refusedMissing), "the refusal does not name the card it refused").toContain("T-999");
  // AND THE CHECK REFUSES IT TOO where a reader hands one through, which
  // is what keeps the map checked rather than assumed.
  const handed = clean.current as NonNullable<typeof clean.current>;
  expect(
    grantFindings(
      { ...clean, current: { ...handed, order: [...handed.order, "T-999"] } } as typeof clean,
      declared,
      io,
    ).join(" | "),
    "a card approved with no blob in the map passed the check",
  ).toContain("T-999");

  // A BLOB THIS REPOSITORY DOES NOT CARRY — the stale pin in its
  // strongest form, and the one a byte comparison alone would report as
  // "a different card" without saying the bytes are gone.
  const gone = "0".repeat(40);
  expect(
    grantFindings(
      read(blockText({ approval: "standing", order: [cardId], cards: { [cardId]: gone } })),
      declared,
      io,
    ).join(" | "),
    "a pin to bytes this repository does not hold passed the check",
  ).toContain("does not carry those bytes");

  // AND THE DRIFT ARM, BOTH WAYS ROUND, over injected texts so that no
  // object is written into this repository to make the point.
  const stamped = text.replace(/^status:.*$/m, "status: verifying");
  const rewritten = text.replace(/^- WHEN /m, "- WHEN something else entirely ");
  const injected = (approved: string): GrantTreeIo => ({
    ...io,
    currentBlob: () => "f".repeat(40),
    currentText: () => approved,
    approvedText: () => text,
  });
  expect(
    grantFindings(clean, declared, injected(stamped)),
    "a card the ceremony merely stamped was refused, which the admission itself allows",
  ).toEqual([]);
  expect(
    grantFindings(clean, declared, injected(rewritten)).join(" | "),
    "a card rewritten past the mechanical drift passed the check",
  ).toContain("beyond the admission's mechanical drift");
});

test("THE SETTINGS CHAPTER CARRIES THE DISPATCH BLOCK AS A GENERATION of its declaration, never as prose", () => {
  // THE CARD'S FIFTH CRITERION. The currency body above holds the whole
  // page equal to a fresh generation; this one says the dispatch block is
  // IN that page and that it moves with the declaration. KILLED BY: a
  // renderer that skips the section, one that transcribes a sentence
  // instead of reading the row, and a page nobody regenerated.
  const text = readFileSync(path.join(repoRoot, PROCESS_SCHEMA), "utf8");
  const schema = parseProcessSchema(text);
  const page = renderReference(schema);
  const decl = schema.dispatch as NonNullable<typeof schema.dispatch>;
  expect(page, "the chapter carries no dispatch block section").toContain("## The dispatch block");
  for (const row of decl.fields.values()) {
    expect(page, `the chapter renders no row for ${row.id}`).toContain(`### \`${decl.key}.${row.id}\``);
    expect(page, `the chapter does not carry ${row.id}'s own sentence`).toContain(row.what);
  }
  expect(
    readFileSync(path.join(repoRoot, "docs", "reference", "15-settings.md"), "utf8"),
    "the committed chapter does not carry the dispatch block at all",
  ).toContain("## The dispatch block");

  // NOT VACUOUS, AND THE PLANT IS A DATA MUTANT: a declaration that moved
  // moves the page, which is the shape a stale commit really takes.
  const first = [...decl.fields.values()][0];
  expect(first, "the declaration carries a row to plant against").toBeDefined();
  const moved = parseProcessSchema(
    text.replace(`what: "${first!.what}"`, `what: "${first!.what}, and something nobody regenerated for"`),
  );
  expect(renderReference(moved), "a declaration that moved did not move the page").not.toBe(page);

  // AND A SCHEMA WITH NO DECLARATION RENDERS NO SECTION, which is the
  // arrangement this project would be in if the section were removed —
  // run because a control is only a control where the arrangement is
  // ABSENT.
  const without = text.slice(0, text.indexOf("dispatch_block:")) + text.slice(text.indexOf("\nswitches:\n") + 1);
  const bare = parseProcessSchema(without);
  expect(bare.dispatch, "the control: the section did not come out of the schema").toBeNull();
  expect(renderReference(bare), "the control: a schema with no declaration rendered a section anyway").not.toContain(
    "## The dispatch block",
  );
  expect(renderReference(bare), "the control: the switches stopped rendering too").toContain("## The switches");
});

// ── T-300 verdict, assigned corrections (verifier, phase 2) ───────────
//
// Two halves of AC1 that this implementation already keeps and that no
// body could see, because the one tree every body renders over decides
// neither: this repository departs from its profile at NO switch, so a
// listing that printed the PROFILE's value instead of the project's is
// indistinguishable here; and every body injects its own `readings`, so
// a command that never went to the tree for them is indistinguishable
// too. "Its state" and "the project's own band reading" are the two
// things AC1 asks the listing for, and each needed an arrangement the
// six bodies do not build.

test("the listing goes to the PROJECT'S OWN tree for its readings — the measured column is not a rendering of numbers somebody handed in", () => {
  const units = bandUnits();
  const loaded = process300();
  // THE TWO SHARES, COMPUTED HERE FROM THE FIXTURE'S OWN NUMBERS and not
  // by asking the reader what it thinks. The budgets are the project's
  // table, asserted first so the arithmetic below is visible rather than
  // implied: a fixture priced against a budget nobody stated is a number
  // with no derivation.
  const budget = TIER_BUDGETS[WINDOW_TIER as keyof typeof TIER_BUDGETS];
  expect(budget, `${WINDOW_TIER} is a tier ADR-024 decision 1 sets a budget for`).toBeDefined();
  const cycleMinutes = (Date.parse(WINDOW_RECORD_AT) - Date.parse(WINDOW_STAMP_AT)) / 60000;
  const expectedCycle = (cycleMinutes * 100) / budget.minutes;
  const expectedToken = (WINDOW_TOKENS * 100) / budget.tokens;
  const cycleLine = `measured: loop/cycle-budget-used = ${fmt(expectedCycle)} ${units.get("loop/cycle-budget-used") ?? ""}`;
  const tokenLine = `measured: loop/token-budget-used = ${fmt(expectedToken)} ${units.get("loop/token-budget-used") ?? ""}`;

  // ── ARRANGEMENT ONE: A POPULATED WINDOW, BUILT ────────────────────
  const populated = windowProject({ checkpointAt: WINDOW_CHECKPOINT_INSIDE });
  // ── ARRANGEMENT TWO: THE SAME RECORDS, THE CHECKPOINT MOVED PAST
  //    THEM. One date differs from arrangement one and nothing else does,
  //    so what the pair measures is the WINDOW.
  const empty = windowProject({ checkpointAt: WINDOW_CHECKPOINT_AFTER });
  // ── ARRANGEMENT THREE: THE POPULATED ONE WITH TWICE THE TOKENS. The
  //    reading has to MOVE with it, or the column is not a derivation of
  //    the tree's own data — which is this body's whole subject.
  const doubled = windowProject({ checkpointAt: WINDOW_CHECKPOINT_INSIDE, tokens: WINDOW_TOKENS * 2 });
  // ── THE BARE CONTROL: the same schema and template, NO meters file at
  //    all. It is a separate arrangement from arrangement two on purpose:
  //    an empty window and an absent record are two different reasons for
  //    an empty map, and one fixture answering for both would be one act
  //    arming both sides.
  const bare = settingsProject();
  try {
    // THE POPULATED WINDOW PRICES, AND PRICES WHAT THE FIXTURE SUPPLIED.
    const priced = treeReadings(populated);
    expect(
      [...priced.keys()].sort(),
      `the fixture puts a ${WINDOW_TIER} card's record at ${WINDOW_RECORD_AT} and a ` +
        `\`Checkpoint:\` at ${WINDOW_CHECKPOINT_INSIDE}, so the window holds that card and the ` +
        "two budget bands price — if this is empty the fixture, not the reader, is what moved",
    ).toEqual(["loop/cycle-budget-used", "loop/token-budget-used"]);
    expect(
      priced.get("loop/cycle-budget-used")?.value,
      `${String(cycleMinutes)} min from the stamp to the record, against the ${WINDOW_TIER} tier's ` +
        `${String(budget.minutes)} min`,
    ).toBeCloseTo(expectedCycle, 10);
    expect(
      priced.get("loop/token-budget-used")?.value,
      `${String(WINDOW_TOKENS)} tokens against the ${WINDOW_TIER} tier's ${String(budget.tokens)}`,
    ).toBeCloseTo(expectedToken, 10);

    const out = listingOf(populated);
    const namesBand = [...loaded.schema.switches.values()].filter((sw) =>
      sw.band.some((b) => priced.has(b)),
    );
    expect(
      namesBand.length,
      "at least one switch names a loop band, so the priced column has a subject",
    ).toBeGreaterThan(0);
    for (const sw of namesBand) {
      const band = sw.band.find((b) => priced.has(b)) as string;
      expect(
        out,
        `${sw.id} shows the FIXTURE's reading for ${band}, in that band's own unit`,
      ).toContain(band === "loop/cycle-budget-used" ? cycleLine : tokenLine);
      expect(out, `and ${sw.id} is not dressed as an estimate instead`).not.toContain(
        `measured: the seat's estimate — ${sw.cost} (awaiting ${sw.band.join(", ")})`,
      );
    }

    // THE VALUE IS A DERIVATION, NOT A SHAPE. Double the tokens the
    // fixture states and the column has to double with them; a body that
    // survived this would be asserting that SOMETHING was printed.
    const twice = treeReadings(doubled);
    expect(
      twice.get("loop/token-budget-used")?.value,
      "twice the tokens in the record is twice the share in the column",
    ).toBeCloseTo(expectedToken * 2, 10);
    expect(listingOf(doubled), "and the listing prints that moved value, not the first one").toContain(
      `measured: loop/token-budget-used = ${fmt(expectedToken * 2)} ${units.get("loop/token-budget-used") ?? ""}`,
    );

    // THE EMPTY WINDOW, ASSERTED HONESTLY RATHER THAN SKIPPED. The same
    // valid record, priced by the same reader, in a tree whose newest
    // `Checkpoint:` is NEWER than it: the window holds no card, so it has
    // no worst card, so the bands read UNREAD by design — and the listing
    // says every switch is the seat's estimate, in the text it already
    // printed before this card existed.
    expect(
      treeReadings(empty).size,
      `the only difference from the populated fixture is the \`Checkpoint:\` date ` +
        `(${WINDOW_CHECKPOINT_AFTER} against ${WINDOW_CHECKPOINT_INSIDE}), so an answer here is ` +
        "the window not being applied at all",
    ).toBe(0);
    const none = listingOf(empty);
    expect(
      none,
      "an empty window borrows no band figure — not from the populated fixture beside it and not " +
        "from anywhere else",
    ).not.toContain("measured: loop/");
    for (const sw of namesBand) {
      expect(
        none,
        `${sw.id} falls back to the seat's estimate, naming the bands that are awaiting a reading`,
      ).toContain(`measured: the seat's estimate — ${sw.cost} (awaiting ${sw.band.join(", ")})`);
    }

    // AND THE BARE CONTROL, EVALUATED WHERE THE ARRANGEMENT THAT DECIDES
    // THE SUBJECT IS ABSENT ALTOGETHER: the same schema, the same
    // template, no meters and no history. Nothing prices, every switch
    // falls back, and the listing — the one verb that has to work
    // everywhere — still runs.
    expect(treeReadings(bare).size, "a tree with no recorded meter prices no band").toBe(0);
    expect(
      listingOf(bare),
      "and a project with no readings shows none, rather than borrowing a fixture's",
    ).not.toContain("measured: loop/");

    // ── AND THIS CHECKOUT, WHICHEVER STATE THE CALENDAR LEAVES IT IN ──
    // The fixtures above are what make the priced column assertable on
    // every run. This section is the other half: the command's reading of
    // THIS repository is asserted too, and never skipped — but what is
    // asserted is what is TRUE here, which depends on when the newest
    // checkpoint landed and not on anything this body can arrange.
    //
    // The unconditional claim first, and it holds in both states: every
    // switch's measured column is what THIS tree's own reading renders.
    // A command that went to a different map — an injected one, a cached
    // one, a fixture's — disagrees here whatever the calendar says.
    const live = treeReadings(repoRoot);
    const here = listingOf(repoRoot);
    for (const row of settingsRows({ ...loaded, readings: live, units })) {
      expect(
        here,
        `${row.id}'s measured column is this checkout's own tree read, rendered — not a map handed in`,
      ).toContain(`measured: ${row.measured.text}`);
    }
    // Then the state, NAMED, with a failable assertion in each arm.
    const state =
      `${repoRoot}: treeReadings answers ${String(live.size)} band(s) — ` +
      `${live.size === 0 ? "the newest Checkpoint: is newer than every meters record" : "a record sits inside the newest checkpoint's window"}`;
    if (live.size === 0) {
      expect(here, `${state}, so no band figure may appear`).not.toContain("measured: loop/");
      expect(
        here,
        `${state}, so at least one switch stands at the seat's estimate awaiting its band`,
      ).toContain("measured: the seat's estimate — ");
    } else {
      const band = [...live.keys()][0] as string;
      expect(
        here,
        `${state}, so ${band}'s reading is on the listing in that band's own unit`,
      ).toContain(`measured: ${band} = ${fmt(live.get(band)!.value)} ${units.get(band) ?? ""}`);
    }
  } finally {
    for (const root of [populated, empty, doubled]) removeGitFixture(root, FIXTURE);
    rmSync(bare, { recursive: true, force: true });
  }
});

test("a DEPARTURE is listed at the value the PROJECT resolves to, marked against the profile's own", () => {
  const root = settingsProject();
  try {
    const base = loadProcess(root);
    expect(base, "the fixture carries this repository's schema and template").not.toBeNull();
    const id = "build.criteria_echo";
    const sw = base!.schema.switches.get(id);
    expect(sw, `${id} is a switch the schema declares`).toBeDefined();
    const profileValue = base!.settings.values.get(id) as string;
    const departed = sw!.values.find((v) => v !== profileValue) as string;

    // THE ARRANGEMENT ABSENT: before the departure, the state column and
    // the profile's own value are the same string, which is why the
    // fixture every other body renders over cannot decide this.
    const undeparted: string[] = [];
    expect(
      settingsMain(["--root", root], {
        stdout: (s) => undeparted.push(s),
        stderr: (s) => undeparted.push(s),
        readings: new Map(),
      }),
    ).toBe(EXIT.CLEAN);
    expect(undeparted.join("\n"), "no departure, and the header says so").toContain(
      "0 departure(s) from the profile",
    );
    expect(undeparted.join("\n"), "and no row is marked one").not.toContain("DEPARTURE —");

    // THE ARRANGEMENT PRESENT.
    const templateAt = path.join(root, RUNTIME_TEMPLATE);
    writeFileSync(
      templateAt,
      editTemplate(
        readFileSync(templateAt, "utf8"),
        setPlan({ schema: base!.schema, settings: base!.settings, id, value: departed }),
      ),
    );
    const loaded = loadProcess(root);
    expect(loaded, "the departed template still loads").not.toBeNull();
    const said: string[] = [];
    expect(
      settingsMain(["--root", root], {
        stdout: (s) => said.push(s),
        stderr: (s) => said.push(s),
        readings: new Map(),
      }),
    ).toBe(EXIT.CLEAN);
    const out = said.join("\n");
    expect(
      out,
      "the state column carries the value THIS PROJECT resolves to, never the profile's — a " +
        "settings screen showing the column the project departed from is showing somebody " +
        "else's loop",
    ).toContain(`  ${id} = ${departed}  [DEPARTURE — ${loaded!.settings.profile} is ${profileValue}]`);
    expect(out, "and the header counts the departure").toContain(
      "1 departure(s) from the profile",
    );
    expect(
      out,
      "and the profile's own value is not what the row reads as its state",
    ).not.toContain(`  ${id} = ${profileValue}`);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});


// ── T-299-s6: the LABEL, on both surfaces and in the one refusal ──────
//
// The schema's `reads:` field says `processLedger` for most rows, which
// means no arm branches on them — and a reader of this command could not
// tell an executable control from a recorded intention. Every row now
// carries `implementation`, and the two bodies below are the surfaces'
// half of that: the listing and the generated page SHOW the label (and a
// manual row's instruction), and `set` REFUSES a declarative row, which
// is a record rather than a control.

test("the listing and the generated page carry each switch's LABEL, and a manual switch's ACTION beside it", () => {
  // KILLED BY: a surface that renders the labels for some rows and not
  // others, one that prints a manual row's instruction on rows that have
  // none (which would make the label unreadable), and one that carries
  // the label in the listing while the generated page still says nothing
  // — the page is the copy a reader meets without a terminal.
  const loaded = process300();
  const rows = [...loaded.schema.switches.values()];
  const labels = new Set(rows.map((sw) => sw.implementation));
  // NOT VACUOUS: this schema really uses more than one label, so the
  // assertions below cannot be satisfied by a page that prints one word.
  expect([...labels].sort(), "the shipped schema no longer carries all three labels").toEqual([
    "declarative",
    "manual",
    "operational",
  ]);

  const said: string[] = [];
  expect(
    settingsMain(["--root", repoRoot], {
      stdout: (s) => said.push(s),
      stderr: (s) => said.push(s),
      readings: new Map(),
    }),
  ).toBe(EXIT.CLEAN);
  const out = said.join("\n");
  const page = renderReference(loaded.schema);
  for (const sw of rows) {
    expect(out, `${sw.id} is listed without its label`).toContain(
      `${sw.id} = ${loaded.settings.values.get(sw.id) ?? ""}`,
    );
    expect(
      out.split("\n").find((l) => l.trimStart().startsWith(`${sw.id} = `)) ?? "",
      `${sw.id}'s label is not beside its value`,
    ).toContain(`[${sw.implementation}]`);
    expect(page, `${sw.id} reaches the generated page without its label`).toContain(
      `- **implementation** — ${sw.implementation}`,
    );
    if (sw.implementation === "manual") {
      expect(sw.manualAction, `${sw.id} is manual and names no action`).not.toBe("");
      expect(out, `${sw.id} is manual and the listing does not say what to do`).toContain(
        `      manual action: ${sw.manualAction}`,
      );
      expect(page, `${sw.id} is manual and the page does not say what to do`).toContain(
        `- **manual action** — ${sw.manualAction}`,
      );
    }
  }
  // AND ONLY A MANUAL ROW CARRIES ONE, which is what makes the label
  // worth reading: an instruction on every row is an instruction on none.
  const manual = rows.filter((sw) => sw.implementation === "manual");
  expect(
    out.split("\n").filter((l) => l.trimStart().startsWith("manual action: ")).length,
    "the listing prints an action for rows that have none, or drops one that has",
  ).toBe(manual.length);
  expect(
    page.split("\n").filter((l) => l.startsWith("- **manual action** — ")).length,
    "the page prints an action for rows that have none, or drops one that has",
  ).toBe(manual.length);

  // THE DATA MUTANT: the label lives in the SCHEMA, so the plant is a
  // schema edit, and both surfaces have to move with it. A code mutant
  // would leave this property untouched.
  const relabelled = parseProcessSchema(
    readFileSync(path.join(repoRoot, PROCESS_SCHEMA), "utf8").replace(
      "    implementation: operational\n    manualAction: \"\"",
      "    implementation: declarative\n    manualAction: \"\"",
    ),
  );
  expect(
    renderReference(relabelled),
    "a row relabelled in the schema did not move the generated page",
  ).not.toBe(page);
});

test("a `set` naming a DECLARATIVE switch is refused with the code `declarative`, at the exit every other refusal takes, and the template is byte-identical", () => {
  // T-299-s6 criterion 3 and the card's amendment of 2026-09-13. KILLED
  // BY: a command that writes a departure into a row nothing reads, one
  // that refuses without the finding code a caller can act on, one that
  // invents a fifth exit for it, and one that refuses everything —
  // which the positive control at the foot is what rules out.
  const loaded = process300();
  // DERIVED, NEVER TYPED: a declarative row that is not ALSO floor, so
  // what this body measures is the declarative refusal rather than the
  // floor one that would fire first.
  const subject = [...loaded.schema.switches.values()].find(
    (sw) => sw.implementation === "declarative" && !sw.floor,
  );
  expect(subject, "the schema declares no switchable declarative row, so this body measures nothing").toBeDefined();
  const id = (subject as NonNullable<typeof subject>).id;
  const value = ((subject as NonNullable<typeof subject>).values.find(
    (v) => v !== loaded.settings.values.get(id),
  ) ?? "") as string;
  expect(value, `${id} declares no second value to depart to`).not.toBe("");

  let said = "";
  try {
    setPlan({ schema: loaded.schema, settings: loaded.settings, id, value });
  } catch (e) {
    said = e instanceof Error ? e.message : String(e);
  }
  expect(said, `${id} was planned as an ordinary departure`).not.toBe("");
  expect(said, "the refusal does not carry the code a caller acts on").toContain("declarative");
  expect(said, "nor name the row it refused").toContain(id);
  expect(said, "nor say that nothing was written").toContain("NOTHING was written");

  // THROUGH THE REAL ENTRY POINT, over a project of its own, where
  // "byte-identical" is a fact about a file rather than about a throw.
  const root = settingsProject();
  try {
    const templateAt = path.join(root, RUNTIME_TEMPLATE);
    const untouched = readFileSync(templateAt, "utf8");
    const run = (args: string[]) => {
      const lines: string[] = [];
      const status = settingsMain(["--root", root, ...args], {
        stdout: (s) => lines.push(s),
        stderr: (s) => lines.push(s),
        readings: new Map(),
      });
      return { status, out: lines.join("\n") };
    };
    const refused = run(["set", id, value]);
    expect(refused.out, "the refusal does not reach the caller").toContain("declarative");
    expect(
      readFileSync(templateAt, "utf8"),
      "a refused set moved the template, so `nothing was written` is not true",
    ).toBe(untouched);

    // THE EXIT IS THE HOUSE'S, NOT A FIFTH ONE: the amendment rules this
    // a finding code in the message at the refusal exit the other
    // refusals already take, so the two are compared rather than typed.
    // AND EACH CONTROL IS THE REFUSAL IT IS NAMED FOR. The first
    // spelling of this compared against `push.token`, which is FLOOR and
    // ALSO declarative — so a check order that put the label first would
    // have left this body comparing the subject against itself and still
    // green, which is one arrangement deciding both answers.
    // `template.roles` is FLOOR and MANUAL, so it can answer the floor
    // refusal and no other, and the messages are what prove each control
    // is the refusal it claims to be.
    const floorRefusal = run(["set", "template.roles", "off"]);
    const valueRefusal = run(["set", "read.standing", "banana"]);
    expect(floorRefusal.out, "the floor control answered some other refusal").toContain("is FLOOR");
    expect(valueRefusal.out, "the value control answered some other refusal").toContain("is not one of");
    expect(floorRefusal.status, "the arrangement: the floor refusal is CALLED WRONG").toBe(EXIT.USAGE);
    expect(
      refused.status,
      "the declarative refusal answers a different exit from the other refusals",
    ).toBe(floorRefusal.status);
    expect(refused.status, "and from the value refusal").toBe(valueRefusal.status);
    expect(refused.status, "the vocabulary grew a fifth code").toBe(EXIT.USAGE);

    // THE POSITIVE CONTROL: a row this command CAN change still changes,
    // so the refusal above is about the label and not about `set`.
    const control = loaded.schema.switches.get("build.criteria_echo");
    expect(control, "the control row is no longer declared").toBeDefined();
    expect(
      (control as NonNullable<typeof control>).implementation,
      "the control row became declarative, so it is a second subject rather than a control",
    ).not.toBe("declarative");
    const ok = run(["set", "build.criteria_echo", "off"]);
    expect(ok.status, "the control: an allowed set is clean").toBe(EXIT.CLEAN);
    expect(readFileSync(templateAt, "utf8"), "the control: and it really moved the file").not.toBe(untouched);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

// ── T-300-s6: the command reads through the parser library ────────────
//
// T-300 landed importing the resolver from the ARM, which re-exports the
// library's own module bound to its own finding class. The card's whole
// question is WHICH of the two this surface reads, and the two return
// identical values — so a body written against the output could never
// decide it. This one is written against the READING: where the symbols
// come from, and that what the command renders IS what the library
// answers over the same inputs.

test("the settings command reads the loop through the PARSER LIBRARY's own module, and keeps no reader, resolver or constraint engine of its own", () => {
  // THE FILE THE VERB ACTUALLY REACHES, derived from the front's own
  // table rather than typed — a body that scanned a path somebody typed
  // would keep passing after the verb was pointed somewhere else.
  const entry = VERBS.find((v) => v.verb === "settings");
  expect(entry, "the front carries a settings verb").toBeDefined();
  const target = entry!.target as { kind: string; file: string };
  expect(target.kind, "and it fronts a script").toBe("script");
  const source = readFileSync(path.join(packageRoot, "scripts", target.file), "utf8");

  // WHERE IT READS FROM: the parser library's BUILT browser-safe entry,
  // by the relative spelling this package uses for every reach outside
  // itself.
  expect(
    source,
    "the command does not load the parser library's built browser entry at all",
  ).toContain("lib/parser/dist/pure.js");

  // AND NOT THROUGH THE ARM. The arm re-exports the same symbols under
  // the same names, so the import list is the one place the two readings
  // are distinguishable in the source.
  const armImport = /import\s*\{([^}]*)\}\s*from\s*"\.\/dispatch-brief\.mjs"/.exec(source);
  expect(armImport, "the command no longer imports from the arm at all").not.toBeNull();
  const fromArm = (armImport![1] as string)
    .split(",")
    .map((n) => n.trim())
    .filter((n) => n !== "")
    .sort();
  expect(
    fromArm,
    "the only two symbols the arm still owes this command are the house's exit vocabulary and " +
      "the ONE function that opens the schema and the template off disk — the library's module " +
      "is browser-safe by construction and reads no file, so a copy of that half here would be " +
      "the second reader this card exists to remove",
  ).toEqual(["EXIT", "loadProcess"]);

  // AND IT KEEPS NONE OF ITS OWN. Not one of the six reader symbols is
  // declared in this file; each reaches it off the library's namespace.
  for (const name of [
    "parseProcessSchema",
    "processSection",
    "resolveProcess",
    "switchValue",
    "processLedger",
    "constraintFindings",
  ]) {
    expect(
      source,
      `${name} is declared in the command rather than read from the library`,
    ).not.toMatch(new RegExp(`function\\s+${name}\\b`));
  }
  expect(
    source,
    "the ledger and the constraint findings are taken off the library's own namespace",
  ).toMatch(/=\s*processPure;/);

  // THE RELATION A NAME CHECK CANNOT SEE: the rows the listing renders
  // ARE the library's own ledger over this project's schema and
  // settings, field for field.
  const loaded = process300();
  const flat = (r: {
    id: string;
    value: string;
    what: string;
    floor: boolean;
    overridden: boolean;
    implementation: string;
    manualAction: string;
  }) => ({
    id: r.id,
    value: r.value,
    what: r.what,
    floor: r.floor,
    overridden: r.overridden,
    implementation: r.implementation,
    manualAction: r.manualAction,
  });
  expect(
    settingsRows({ ...loaded, readings: new Map(), units: new Map() }).map(flat),
    "the command's rows and the library's ledger disagree about this project's loop",
  ).toEqual(parserPure.processLedger(loaded.schema, loaded.settings).map(flat));

  // AND THE REFUSAL IS THE LIBRARY'S JUDGEMENT, QUOTED RATHER THAN
  // RESTATED: the command's fourth refusal carries the library's own
  // finding strings, word for word.
  const forbid = { id: "record.bands", value: "off" };
  const would = {
    profile: loaded.settings.profile,
    available: loaded.settings.available,
    values: new Map(loaded.settings.values).set(forbid.id, forbid.value),
    overridden: new Set(loaded.settings.overridden).add(forbid.id),
  };
  const theirs = parserPure.constraintFindings(loaded.schema, would);
  expect(
    theirs.length,
    "the library refuses this combination, which is the arrangement this half needs",
  ).toBeGreaterThan(0);
  let said = "";
  try {
    setPlan({ schema: loaded.schema, settings: loaded.settings, id: forbid.id, value: forbid.value });
  } catch (e) {
    said = e instanceof Error ? e.message : String(e);
  }
  for (const finding of theirs) {
    expect(
      said,
      "the command's refusal is a sentence of its own rather than the library's finding",
    ).toContain(finding);
  }

  // THE POSITIVE CONTROL, evaluated where the arrangement that decides
  // the subject is ABSENT: a combination the schema allows produces no
  // finding from the library and no refusal from the command, so the
  // half above is reading the judgement rather than refusing everything.
  const allowed = { id: "build.criteria_echo", value: "off" };
  expect(
    parserPure.constraintFindings(loaded.schema, {
      profile: loaded.settings.profile,
      available: loaded.settings.available,
      values: new Map(loaded.settings.values).set(allowed.id, allowed.value),
      overridden: new Set(loaded.settings.overridden).add(allowed.id),
    }),
    "the control: the library allows this combination",
  ).toEqual([]);
  expect(
    () => setPlan({ schema: loaded.schema, settings: loaded.settings, id: allowed.id, value: allowed.value }),
    "and the command does not refuse it either",
  ).not.toThrow();
});


// ── T-300-s6, verifier correction 1: WHICH MODULE THE COMMAND LOADS ───
//
// The body above reads the command's source for the entry's path with a
// bare `toContain`. That file spells the same path four more times, in
// JSDoc type annotations — documentation ABOUT the pin, which the poison
// catalogue in docs/CONVENTIONS.md names as the likeliest author of the
// second copy (shape EIGHT) — so the needle outlives the import itself.
// Measured at this card's lane tip: with the one dynamic load pointed
// back at `./dispatch-brief.mjs`, which re-exports the same four symbols
// under the same names, all 57 bodies of this spec stayed green. The
// reading through the LIBRARY'S own browser entry rather than through the
// arm's re-export of it is the whole of what this card changed, and it
// had no body under it.
//
// So the haystack here is the CODE and never the file, the entry is read
// off the parser package's own `exports` map rather than typed, and every
// specifier is RESOLVED from the command's own directory — a relative
// path is a claim about a layout, and a claim about a layout goes stale
// in silence.

test("the settings command LOADS the parser library's own browser entry — the module it imports, and not a path its comments also spell", () => {
  const entry = VERBS.find((v) => v.verb === "settings");
  expect(entry, "the front carries a settings verb").toBeDefined();
  const target = entry!.target as { kind: string; file: string };
  expect(target.kind, "and it fronts a script").toBe("script");
  const scriptPath = path.join(packageRoot, "scripts", target.file);
  const source = readFileSync(scriptPath, "utf8");

  // STRIP THE COMMENTS, AND PROVE THE STRIP RAN. A strip that quietly
  // stopped matching would widen the haystack back to the shape this body
  // exists to close, and it would do it while staying green.
  const code = source.replace(/\/\*[\s\S]*?\*\//g, "");
  expect(
    code.length,
    "the comment strip removed nothing, so the JSDoc copies of the entry's path are still in the haystack",
  ).toBeLessThan(source.length);
  expect(code, "the comment strip ate the command's own code").toContain("processPure");

  // THE BROWSER ENTRY IS THE PARSER PACKAGE'S OWN ANSWER, never this
  // body's. The criterion says "its browser entry"; `exports["./pure"]` is
  // where that library says which file that is.
  const parserDir = path.join(repoRoot, "lib", "parser");
  const manifest = JSON.parse(readFileSync(path.join(parserDir, "package.json"), "utf8")) as {
    exports?: Record<string, { import?: string }>;
  };
  const declared = manifest.exports?.["./pure"]?.import;
  expect(
    declared,
    "the parser package declares no `./pure` entry for a surface to read the loop through",
  ).toBeTruthy();
  const browserEntry = path.resolve(parserDir, declared as string);
  expect(existsSync(browserEntry), "the parser's browser entry is not built").toBe(true);

  // WHAT THE COMMAND ACTUALLY LOADS — static and dynamic alike, resolved
  // from its own directory, and narrowed to the reaches that land inside
  // the parser library.
  const specifiers = [
    ...[...code.matchAll(/\bfrom\s+"([^"]+)"/g)].map((m) => m[1] as string),
    ...[...code.matchAll(/\bimport\(\s*"([^"]+)"\s*\)/g)].map((m) => m[1] as string),
  ].filter((s) => s.startsWith("."));
  const intoParser = specifiers
    .map((s) => path.resolve(path.dirname(scriptPath), s))
    .filter((p) => p.startsWith(parserDir + path.sep));
  expect(
    intoParser,
    "the command does not load the parser library's browser entry ITSELF — reading the loop through " +
      "the arm's re-export of that same module passes every name check this spec makes elsewhere, " +
      "and it is the one thing this card changed",
  ).toEqual([browserEntry]);
});
