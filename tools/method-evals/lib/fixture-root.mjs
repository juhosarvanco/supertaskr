/**
 * THE FIXTURE REF — a throwaway project root the method text can be
 * assembled against, and DEGRADED in, without touching this checkout.
 *
 * WHY A WHOLE ROOT AND NOT A STRING. The assembler under test
 * (`tools/e2e/scripts/brief.mjs`) is a program over a repository: it
 * reads the role file, the adapters, the governing docs, the component
 * registry, the board and `git`. Handing it a mutated string is not the
 * experiment; handing it a mutated REPOSITORY is. `brief.mjs --root`
 * exists for exactly this and is the one seam this suite needs.
 *
 * WHAT IS LIVE AND WHAT IS SYNTHETIC, because the split is the whole
 * design:
 *
 *   LIVE      method/**            — the subject under test. An eval that
 *                                    read a COPY would pass forever after
 *                                    the copy went stale.
 *   LIVE      the governing docs    — CONVENTIONS/ARCHITECTURE/ROADMAP/
 *             and the component      STATE/NORTH_STAR and the registry.
 *             registry               Rows 3 and 5..10 derive from them, so
 *                                    a project's own docs are part of what
 *                                    "the brief assembles" means here.
 *   LIVE      the adapters          — row 3's own source names the ROOT
 *                                    adapter file, not the template.
 *   SYNTHETIC docs/tasks/           — ONE card, ours, `fixtures/card/`.
 *                                    The live board is 200+ cards written
 *                                    by other seats; an eval that read it
 *                                    would red for somebody else's typo,
 *                                    which is the "detached red" the DOCS
 *                                    GATE bullet exists to complain about.
 *   SYNTHETIC .git                  — `git init -b main` plus ONE commit
 *                                    whose subject opens `Checkpoint:`,
 *                                    because the base rule names one and
 *                                    the assembler refuses to substitute.
 *                                    No remote, no hooks, no config beyond
 *                                    the identity the commit needs.
 *
 * The root is created under the caller's temp directory, its name DERIVED
 * from the eval id and the process id — never a fixed path. Four sessions
 * on this machine independently chose `<scratch>/drill` and collided
 * (docs/CONVENTIONS.md, POISON DRILL); a derived path is a construction
 * and a fixed path is the defect.
 */

import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** This suite's own directory — `tools/method-evals`. */
export const suiteDir = path.resolve(fileURLToPath(import.meta.url), "../..");

/** The repository root, derived from this file's location and never from `cwd`. */
export const repoRoot = path.resolve(suiteDir, "../..");

/** Governing documents copied live into the fixture root. */
const LIVE_DOCS = [
  "docs/CONVENTIONS.md",
  "docs/ARCHITECTURE.md",
  "docs/ROADMAP.md",
  "docs/STATE.md",
  "docs/NORTH_STAR.md",
];

/** Adapter files copied live — row 3 reads the ROOT adapter, not the template. */
const LIVE_ADAPTERS = ["AGENTS.md", "CLAUDE.md"];

/**
 * @typedef {object} FixtureRoot
 * @property {string} dir         absolute path to the materialized root
 * @property {string} head        the fixture commit's full sha
 * @property {(rel: string) => string} read     read a file out of the fixture
 * @property {(rel: string, text: string) => void} write  overwrite one, uncommitted
 * @property {() => void} restore  put every tracked file back, proved by git
 * @property {() => void} dispose  remove the root entirely
 */

/**
 * Materialize a fixture root. The caller disposes it.
 *
 * @param {string} stem  a short identity derived from the calling eval, so
 *                       two evals in one run never share a directory.
 * @returns {FixtureRoot}
 */
export function materialize(stem) {
  const base = mkdtempSync(path.join(tmpdir(), `nputer-method-eval-${stem}-`));
  const dir = path.join(base, "project");
  mkdirSync(path.join(dir, "docs"), { recursive: true });

  cpSync(path.join(repoRoot, "method"), path.join(dir, "method"), { recursive: true });
  cpSync(
    path.join(repoRoot, "docs/architecture"),
    path.join(dir, "docs/architecture"),
    { recursive: true },
  );
  for (const rel of [...LIVE_DOCS, ...LIVE_ADAPTERS]) {
    cpSync(path.join(repoRoot, rel), path.join(dir, rel));
  }
  cpSync(path.join(suiteDir, "fixtures/card"), path.join(dir, "docs/tasks"), {
    recursive: true,
  });

  const git = (/** @type {string[]} */ args) =>
    execFileSync("git", ["-C", dir, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

  git(["init", "-q", "-b", "main", "."]);
  git(["add", "-A"]);
  git([
    "-c",
    "user.email=evals@nputer.invalid",
    "-c",
    "user.name=method-evals",
    "commit",
    "-q",
    "-m",
    // The subject opens `Checkpoint:` on purpose: the base rule
    // (docs/CONVENTIONS.md, DISPATCH FROM THE LAST CHECKPOINT) names one,
    // and the assembler refuses to substitute a different commit for it.
    "Checkpoint: the method-eval fixture ref",
  ]);
  const head = git(["rev-parse", "HEAD"]).trim();

  return {
    dir,
    head,
    read: (rel) => readFileSync(path.join(dir, rel), "utf8"),
    write: (rel, text) => writeFileSync(path.join(dir, rel), text),
    restore: () => {
      git(["checkout", "-q", "--", "."]);
      const dirty = git(["status", "--porcelain"]).trim();
      if (dirty !== "") {
        throw new Error(
          `fixture root ${dir} did not restore — git status is not empty:\n${dirty}`,
        );
      }
    },
    dispose: () => rmSync(base, { recursive: true, force: true }),
  };
}

/**
 * Read a file out of the LIVE repository. Evals that are pure text checks
 * use this and never materialize a root at all.
 *
 * @param {string} rel  root-relative path
 * @returns {string}
 */
export function readLive(rel) {
  return readFileSync(path.join(repoRoot, rel), "utf8");
}

/**
 * Read a file out of this suite's own `fixtures/` directory.
 *
 * @param {string} rel  path relative to `tools/method-evals/fixtures`
 * @returns {string}
 */
export function readFixture(rel) {
  return readFileSync(path.join(suiteDir, "fixtures", rel), "utf8");
}
