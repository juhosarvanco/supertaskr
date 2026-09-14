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
 *
 * AND THE COPY IS MADE WRITABLE, BECAUSE THE SOURCE TREE OFTEN IS NOT
 * (T-229-s6). `cpSync` PRESERVES the source's permission bits, and the
 * lane fence enforces itself PHYSICALLY BY MODE — every tracked file
 * outside the fence is `r--r--r--` in a dispatched lane. So the copied
 * `method/roles/executor.md` landed read-only, and MF-01's `--selftest`
 * arm — which DEGRADES that file on the copy — died with `EACCES`.
 *
 * READ WHERE THAT BIT: `--selftest` is what makes the METHOD EVAL GATE a
 * check rather than a ritual (docs/CONVENTIONS.md, THE POSITIVE CONTROL
 * IS PART OF THE SUITE AND IS RUN, NEVER ASSUMED), and that gate fires
 * *at any merge whose diff touches `method/**`* — so the sessions that
 * OWE the control were exactly the sessions whose fence made it
 * unrunnable. Measured in the T-229-s4 lane at `a0d72d4`: exit 3 in
 * the lane, exit 0 from a detached worktree at the same commit, the
 * tree identical and only the modes different.
 *
 * WHY A `chmod` WALK AND NOT A COPY FLAG. `cpSync` has no
 * mode-resetting option — its `mode` is `copyFile`'s flag word
 * (`COPYFILE_EXCL`/`FICLONE`), never the destination's permissions — so
 * there is nothing to pass. The walk ADDS the owner-write bit rather
 * than assigning an absolute mode, which keeps the EXECUTABLE bit the
 * source carried; git records that bit and nothing below it, so
 * flattening to `0644` would make a fixture quietly disagree with its
 * source about the one permission git can see.
 *
 * AND A WALK THAT FAILS THROWS RATHER THAN CONTINUING. `materialize`
 * throwing is what the harness reports as `COULD NOT RUN` with the
 * reason (lib/harness.mjs) — the third acceptance criterion's whole
 * mechanism, and the same shape the EACCES already had. A fixture that
 * could not be made writable must never be a pass.
 */

import { execFileSync } from "node:child_process";
import {
  chmodSync,
  cpSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
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
 * EVERY ROOT-RELATIVE PATH `materialize` COPIES OUT OF THE REPOSITORY, in
 * copy order — the two directory trees above the file lists, exactly as
 * the four `cpSync` calls used to spell them one at a time.
 *
 * EXPORTED BECAUSE A SECOND READER EXISTS. `evals/mf-07-…` builds a
 * READ-ONLY replica of this source set in scratch and materializes a
 * fixture out of it; a second, typed copy of this list would go stale the
 * day a path is added here, and the eval would then certify a source set
 * nobody copies. One list, two readers.
 *
 * **AND `docs/conventions` TRAVELS AS A DIRECTORY** (T-290's verifier).
 * That card made docs/CONVENTIONS.md an INDEX over the chapters under
 * docs/conventions/, and every reader of a RULE now reads the two
 * SPLICED. A fixture root carrying the index alone carries a TABLE OF
 * CONTENTS: `conventionsText` refuses it by name and MF-01's assembler
 * exits 3 against it. The DIRECTORY is copied rather than a list of
 * chapter names, for the reason the paragraph above already gives — a
 * typed list goes stale the day a chapter is added, and this fixture
 * would then certify a document nobody can assemble.
 */
export const LIVE_COPY_SET = Object.freeze([
  "method",
  "docs/architecture",
  "docs/conventions",
  ...LIVE_DOCS,
  ...LIVE_ADAPTERS,
]);

/**
 * The ONE synthetic copy, relative to `suiteDir`: this suite's own card
 * fixture, which lands at `docs/tasks/` in the fixture. Exported for the
 * same reason as the set above.
 */
export const CARD_FIXTURE_DIR = "fixtures/card";

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
 * Add the owner-write bit to a materialized root and everything under it.
 *
 * THE SOURCE'S MODES ARE NOT THE FIXTURE'S BUSINESS. A fixture exists to
 * be written to; whether the checkout it was copied from happened to be
 * fenced is an accident of where the suite is being run, and an accident
 * is exactly what a fixture must not inherit.
 *
 * IT ADDS A BIT, IT DOES NOT ASSIGN A MODE — see the header. Entries that
 * already carry `u+w` are skipped, so on an ordinary checkout this walk
 * makes no `chmod` call at all.
 *
 * SYMLINKS ARE SKIPPED because `chmodSync` follows them, which would
 * silently chmod the TARGET — a file that may live outside the fixture
 * entirely. There are none in the copy set today; the guard is here so
 * that stays true rather than being rediscovered.
 *
 * @param {string} root  the materialized fixture root
 */
function makeWritable(root) {
  /** @type {string[]} */
  const targets = [root];
  for (const rel of readdirSync(root, { recursive: true })) {
    targets.push(path.join(root, String(rel)));
  }
  for (const target of targets) {
    try {
      const stats = lstatSync(target);
      if (stats.isSymbolicLink()) continue;
      if ((stats.mode & 0o200) !== 0) continue;
      chmodSync(target, stats.mode | 0o200);
    } catch (cause) {
      // NAME THE PATH AND THE REASON. The harness turns a throw from
      // here into `COULD NOT RUN — <this message>`, which is the only
      // thing a reader gets; "chmod failed" would send them looking.
      throw new Error(
        `the fixture root ${root} could not be made writable at ${target}: ` +
          `${cause instanceof Error ? cause.message : String(cause)}`,
        { cause },
      );
    }
  }
}

/**
 * Materialize a fixture root. The caller disposes it.
 *
 * @param {string} stem  a short identity derived from the calling eval, so
 *                       two evals in one run never share a directory.
 * @returns {FixtureRoot}
 */
export function materialize(stem) {
  const base = mkdtempSync(path.join(tmpdir(), `supertaskr-method-eval-${stem}-`));
  const dir = path.join(base, "project");
  mkdirSync(dir, { recursive: true });

  // ONE LOOP OVER ONE LIST, because the list now has a second reader —
  // see `LIVE_COPY_SET`. `cpSync` with `recursive` copies a FILE as
  // happily as a tree and creates the destination's parent, so the
  // directory entries and the file entries need no separate spelling.
  for (const rel of LIVE_COPY_SET) {
    cpSync(path.join(repoRoot, rel), path.join(dir, rel), { recursive: true });
  }
  cpSync(path.join(suiteDir, CARD_FIXTURE_DIR), path.join(dir, "docs/tasks"), {
    recursive: true,
  });

  // BEFORE `git` TOUCHES IT, AND BEFORE ANY EVAL DOES. The header says
  // why; the ORDER is the part worth stating here. `git checkout -- .`
  // in `restore()` and `writeFileSync` in `write()` both need the write
  // bit, and `.git` is created below — so the walk runs after the last
  // copy and before the repository exists, and never sees `.git` at all.
  makeWritable(dir);

  const git = (/** @type {string[]} */ args) =>
    execFileSync("git", ["-C", dir, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

  git(["init", "-q", "-b", "main", "."]);
  git(["add", "-A"]);
  git([
    "-c",
    "user.email=evals@supertaskr.invalid",
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
