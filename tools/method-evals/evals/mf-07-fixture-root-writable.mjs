/**
 * MF-07 — a fixture root materialises WRITABLE out of a READ-ONLY source
 * tree, and a fixture that inherits its source's modes is FOUND.
 *
 * WHY THIS EVAL EXISTS AT ALL, said as the incident rather than as a
 * property (T-229-s6). A dispatched lane enforces its fence PHYSICALLY BY
 * MODE: every tracked file outside the fence is `r--r--r--`. `cpSync`
 * PRESERVES file modes, so the fixture's copy of `method/roles/executor.md`
 * landed read-only, and MF-01's `--selftest` arm — which degrades exactly
 * that file on the copy — died with `EACCES`. The METHOD EVAL GATE fires
 * *at any merge whose diff touches `method/**`*, so **the sessions that
 * OWED the positive control were precisely the sessions whose own fence
 * made it unrunnable.** Measured in the T-229-s4 lane at `a0d72d4`: exit 3
 * inside the lane, exit 0 from a detached worktree at the same commit,
 * the tree identical and only the modes different.
 *
 * THE SUBJECT IS `lib/fixture-root.mjs`, WHICH NOTHING ELSE COVERS. That
 * is the second half of the finding: the repair itself had no test to
 * live in, and a repair whose only evidence is one lane's notes is a
 * repair that reds nobody when it is undone.
 *
 * THE ARMING IS BUILT HERE AND NOWHERE ELSE, which is the whole reason
 * this eval is shaped the way it is (`method/roles/verifier.md` step 2b —
 * *"where ONE arrangement decides both the subject's answer and the
 * control's, that is a DEFECT"*). Running the suite inside a fenced lane
 * would arm the control by accident, and running it anywhere else would
 * disarm it by accident; either way the arrangement would be the
 * CHECKOUT's rather than the eval's. So this eval builds its own
 * read-only tree: a scratch replica of the source set, `chmod`ped 444 by
 * this file. **Never the fixture** — that is the thing under test — and
 * never the checkout the suite happens to be running in.
 *
 * THE DEGRADATION IS DERIVED, NEVER TYPED, and it is keyed to the
 * MECHANISM rather than to a helper's name: every line of the subject
 * mentioning `chmod` is removed from a COPY. If the repair is ever
 * rebuilt on some other mechanism the strip finds nothing, and this eval
 * says COULD NOT RUN and names the reason — which is the honest outcome,
 * because a control that silently stops aiming at its subject is the
 * defect this suite exists to catch.
 *
 * WHAT IT ASSERTS IS EVERY FILE, NOT ONE FILE. The fixture is built from
 * several copies, and a repair that made only `method/` writable would
 * satisfy MF-01's `--selftest` while leaving the criterion unmet. So the
 * check walks the whole materialized root, and it does not settle for the
 * mode BIT: it performs a real write on one file from every top-level
 * group, because a mode is a claim and a write is the measurement.
 */

import {
  chmodSync,
  cpSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { CARD_FIXTURE_DIR, LIVE_COPY_SET, repoRoot, suiteDir } from "../lib/fixture-root.mjs";

/** The subject, root-relative — the module this eval holds a contract over. */
const SUBJECT = "tools/method-evals/lib/fixture-root.mjs";
/** Where the subject sits inside a replica source root. */
const SUBJECT_IN_REPLICA = SUBJECT;

/**
 * Every regular file under a directory, absolute, `.git` excluded.
 *
 * @param {string} root
 * @returns {string[]}
 */
function filesUnder(root) {
  /** @type {string[]} */
  const out = [];
  for (const rel of readdirSync(root, { recursive: true })) {
    const name = String(rel);
    if (name === ".git" || name.startsWith(`.git${path.sep}`)) continue;
    const abs = path.join(root, name);
    if (statSync(abs).isFile()) out.push(abs);
  }
  return out;
}

/**
 * Build a READ-ONLY replica of the source set `materialize` copies from,
 * with the subject module optionally degraded on the way in.
 *
 * The replica is a whole little repository root, so the copy of the
 * subject placed inside it derives its own `repoRoot` and `suiteDir` from
 * its own location — which is how this eval points a REAL `materialize`
 * at a source tree it controls, with no seam added to the subject.
 *
 * @param {string} stem
 * @param {(text: string) => string} [mutate]
 * @returns {{ root: string; sourceFiles: number; dispose: () => void }}
 */
function replicaSource(stem, mutate) {
  const base = mkdtempSync(path.join(tmpdir(), `nputer-method-eval-${stem}-`));
  const root = path.join(base, "source");
  const dispose = () => rmSync(base, { recursive: true, force: true });
  try {
    for (const rel of LIVE_COPY_SET) {
      cpSync(path.join(repoRoot, rel), path.join(root, rel), { recursive: true });
    }
    cpSync(
      path.join(suiteDir, CARD_FIXTURE_DIR),
      path.join(root, "tools/method-evals", CARD_FIXTURE_DIR),
      { recursive: true },
    );
    // THE SUBJECT IS WRITTEN, NEVER COPIED, AND THIS IS NOT A STYLE CHOICE
    // — IT IS THIS CARD'S OWN SUBJECT TURNED ON THIS FILE (T-229-s6, the
    // verifier's rejection at `5ff00ab`). A `cpSync` here would be
    // REDUNDANT, because the `writeFileSync` below overwrites the content
    // unconditionally — so the copy's only surviving effect would be its
    // MODE, and `cpSync` preserves modes. In any checkout where
    // `fixture-root.mjs` is itself `444` — which is EVERY lane whose fence
    // does not happen to include this suite — the replica's subject would
    // land `444` and this write would die with `EACCES`, taking the PLAIN
    // `run.mjs` down with it and not merely the control. Measured under a
    // `method` + `docs/tasks` fence: with the copy, plain 3 and selftest 3;
    // without it, 0 and 0.
    //
    // IT WAS INVISIBLE IN THE LANE THAT WROTE IT because that lane's fence
    // had been widened to the whole suite, so one arrangement decided both
    // the subject's answer and the control's — the exact defect
    // `method/roles/verifier.md` step 2b names, reproduced inside the eval
    // written to catch it. If you are tempted to "tidy" the two lines below
    // back into one `cpSync`, that is the bug.
    const live = readFileSync(path.join(repoRoot, SUBJECT), "utf8");
    mkdirSync(path.dirname(path.join(root, SUBJECT_IN_REPLICA)), { recursive: true });
    writeFileSync(path.join(root, SUBJECT_IN_REPLICA), mutate === undefined ? live : mutate(live));

    // THE ARMING, and it is this file's own act: lock every regular file
    // in the replica. Directories are left alone — `cpSync` does not
    // carry directory modes anyway, and a lane's fence does not move
    // them either, so locking them would test a condition no lane has.
    const sourceFiles = filesUnder(root);
    for (const file of sourceFiles) chmodSync(file, 0o444);
    return { root, sourceFiles: sourceFiles.length, dispose };
  } catch (cause) {
    dispose();
    throw cause;
  }
}

/**
 * Materialize a fixture through the replica's OWN copy of the subject and
 * report what came out.
 *
 * @param {string} root  a replica source root
 * @param {string} stem
 * @returns {Promise<{ files: number; unwritableModes: string[]; writeFailure: string | null }>}
 */
async function probe(root, stem) {
  const mod = await import(pathToFileURL(path.join(root, SUBJECT_IN_REPLICA)).href);
  const fixture = mod.materialize(stem);
  try {
    const files = filesUnder(fixture.dir);
    if (files.length === 0) throw new Error(`the fixture at ${fixture.dir} materialized EMPTY`);
    const unwritableModes = files
      .filter((f) => (statSync(f).mode & 0o200) === 0)
      .map((f) => path.relative(fixture.dir, f));

    // A MODE IS A CLAIM AND A WRITE IS THE MEASUREMENT. One real write per
    // top-level group, so a repair that reached only one of the copies is
    // caught by the group it missed rather than by luck of ordering.
    /** @type {string[]} */
    const failures = [];
    const groups = new Map();
    for (const f of files) {
      const head = path.relative(fixture.dir, f).split(path.sep)[0];
      if (!groups.has(head)) groups.set(head, f);
    }
    for (const [group, file] of groups) {
      try {
        writeFileSync(file, readFileSync(file));
      } catch (cause) {
        failures.push(`${group}: ${cause instanceof Error ? cause.message : String(cause)}`);
      }
    }
    return {
      files: files.length,
      unwritableModes,
      writeFailure: failures.length === 0 ? null : failures.join(" | "),
    };
  } finally {
    fixture.dispose();
  }
}

/**
 * Remove every line of the subject that mentions `chmod` — the mechanism
 * the writability repair is built on.
 *
 * @param {string} text
 * @returns {string}
 */
function stripTheRepair(text) {
  const lines = text.split("\n");
  const kept = lines.filter((l) => !/chmod/i.test(l));
  if (kept.length === lines.length) {
    throw new Error(
      `no line of ${SUBJECT} mentions \`chmod\`, so this control has nothing to remove — ` +
        "either the writability repair is gone, or it was rebuilt on a different mechanism " +
        "and THIS EVAL MUST BE RE-AIMED at it. A control that no longer aims at its subject " +
        "is the defect this suite exists to catch, so it says so instead of passing.",
    );
  }
  return kept.join("\n");
}

/** @type {import("../lib/harness.mjs").ModelFreeEval} */
export default {
  id: "MF-07",
  kind: "model-free",
  title: "a fixture root materialises writable out of a read-only source tree",
  contract: `${SUBJECT} — the fixture root is WRITABLE whatever the source tree's modes, so the positive control runs in the fenced lanes that owe the METHOD EVAL GATE`,
  reads: [SUBJECT],

  async check() {
    const replica = replicaSource("mf07");
    try {
      // THE EXPECTED SIDE IS ASSERTED NON-EMPTY BEFORE IT IS COMPARED
      // (docs/CONVENTIONS.md, POISON DRILL): if the replica is not
      // actually read-only, a clean result below measures nothing.
      const stillWritable = filesUnder(replica.root).filter((f) => (statSync(f).mode & 0o200) !== 0);
      if (replica.sourceFiles === 0 || stillWritable.length > 0) {
        throw new Error(
          `the replica source did not lock: ${replica.sourceFiles} file(s), ` +
            `${stillWritable.length} still writable — this run measures nothing`,
        );
      }

      const { files, unwritableModes, writeFailure } = await probe(replica.root, "mf07-fixture");
      if (unwritableModes.length > 0 || writeFailure !== null) {
        return {
          ok: false,
          detail:
            `a fixture materialized from a ${replica.sourceFiles}-file READ-ONLY source kept ` +
            `${unwritableModes.length} of ${files} file(s) unwritable` +
            `${writeFailure === null ? "" : ` and a real write failed — ${writeFailure}`}. ` +
            "Every lane whose fence includes a `method/` path is fenced this way, so this is " +
            "the positive control being unrunnable exactly where the gate is owed.",
          lines: unwritableModes.slice(0, 6),
        };
      }
      return {
        ok: true,
        detail: `${files} fixture file(s) writable out of a ${replica.sourceFiles}-file read-only source`,
      };
    } finally {
      replica.dispose();
    }
  },

  async degrade() {
    // THE BASELINE FIRST, the shape MF-01 uses: a red under the mutation
    // proves nothing unless the UNMUTATED arrangement is clean.
    const clean = replicaSource("mf07-control-base");
    try {
      const before = await probe(clean.root, "mf07-control-base-fixture");
      if (before.unwritableModes.length > 0 || before.writeFailure !== null) {
        throw new Error(
          "the UNDEGRADED replica already yields an unwritable fixture, so a red under the " +
            "mutation would prove nothing — this control has no baseline",
        );
      }
    } finally {
      clean.dispose();
    }

    const replica = replicaSource("mf07-control", stripTheRepair);
    try {
      // Read the mutation back before running anything: a substitution
      // count is not a mutation (docs/CONVENTIONS.md, POISON DRILL).
      const mutated = readFileSync(path.join(replica.root, SUBJECT_IN_REPLICA), "utf8");
      if (/chmod/i.test(mutated)) {
        throw new Error("the mutation did not land — the replica's subject still mentions chmod");
      }

      const { files, unwritableModes, writeFailure } = await probe(replica.root, "mf07-control-fixture");
      if (unwritableModes.length > 0 || writeFailure !== null) {
        return {
          ok: true,
          detail:
            `a subject with its mode repair removed is FOUND: ${unwritableModes.length} of ` +
            `${files} fixture file(s) unwritable` +
            `${writeFailure === null ? "" : `, and the real write failed — ${writeFailure}`}`,
        };
      }
      return {
        ok: false,
        detail:
          `${SUBJECT} with every chmod line removed still produced ${files} writable fixture ` +
          "file(s) out of a read-only source — the check does not detect its own degradation, " +
          "so it would pass whatever this module does about modes",
      };
    } finally {
      replica.dispose();
    }
  },
};
