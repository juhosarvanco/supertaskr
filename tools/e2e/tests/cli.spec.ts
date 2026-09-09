import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, test } from "@playwright/test";
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
  bringsBuiltSources,
  movesGraph,
  setupSteps,
  tailPlan,
} from "../scripts/merge.mjs";
import {
  forceVerdict,
  insideFence,
  main as undoMain,
  touchesTokens,
} from "../scripts/undo.mjs";
import { docsReaders } from "../scripts/docs-scan.mjs";
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

/** docs/CONVENTIONS.md, read off this checkout at body time. */
function conventions(): string {
  return readFileSync(path.join(repoRoot, "docs", "CONVENTIONS.md"), "utf8");
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
    const target = path.join(packageRoot, "scripts", entry.target.file);
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
    const source = readFileSync(path.join(packageRoot, "scripts", entry.target.file), "utf8");
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
    if (!entry.source.includes("docs/CONVENTIONS.md")) continue;
    const quoted = [...entry.source.matchAll(/`([^`]+)`/g)].map((m) => (m[1] ?? "").replace(/\s+/g, " "));
    expect(quoted.length, `${entry.verb}'s source quotes at least one command`).toBeGreaterThan(0);
    for (const command of quoted) {
      expect(
        flat.includes(command),
        `${entry.verb} cites \`${command}\`, which docs/CONVENTIONS.md must carry`,
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
      if (entry.rootFlag || entry.target.kind === "cargo") {
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
function undoFixture(opts: { later: boolean }): { root: string; later: string } {
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
    ["---", "id: T-900", "status: building", "touches: [src/]", "---", "", "body", ""].join("\n"),
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
  return { root, later };
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
