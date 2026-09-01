import { chmodSync, existsSync, lstatSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { armRuntimeDir } from "../../../.claude/hooks/gate-token.mjs";
import {
  LANE_BRANCH_RE,
  RUNTIME_DIR_IGNORE,
  findCheckoutRoot,
  readHeadRef,
  readManifest,
  within,
} from "../../../.claude/hooks/lane-fence.mjs";
import { EXIT } from "./dispatch-brief.mjs";
import { trackedFiles } from "./docs-scan.mjs";

/**
 * THE PHYSICAL FENCE LAYER (T-210) — the hole a PreToolUse hook provably
 * cannot reach.
 *
 * `T-025-s4` established that deciding what an arbitrary shell command
 * will write is not a parsing problem this project will win, and
 * `method/lane-protocol.md` rule 5 publishes the consequence as a LIMIT:
 * *"a write mediated by a shell — a redirect, a `sed -i`, a script — does
 * not pass through [the write tools], and stays covered by this protocol
 * and by nothing else."* This module is PART of that "nothing else", and
 * the qualifier is load-bearing rather than modest: it answers the
 * REDIRECT and the script, and it does NOT answer the `sed -i` the very
 * same sentence names. **See L0 below** — a mode bit refuses an open for
 * writing, and `sed -i` renames. It asks the filesystem the question no
 * parser can answer: out-of-fence TRACKED files in a lane worktree are
 * made read-only, so a stray write that OPENS one fails with `EACCES`
 * whoever the writer is and whatever it meant.
 *
 * ── THE CARD PREDICTED ITS OWN DEFECT AND MEASUREMENT MOVED IT ───────
 * The card was filed on the reasoning that a git merge writes tracked
 * files, so the CHECKPOINT SYNC (`lane-protocol.md` fast path B) — whose
 * whole purpose is to write files that are BY DEFINITION outside the
 * pre-widening fence — would take an `EACCES` from this layer and the
 * guard would red the protocol that proposed it. **Driven at git 2.50.1
 * (Apple Git-155) on macOS/APFS, it does not.** Three merges onto a
 * `chmod a-w` tracked file:
 *
 *   fast-forward        exit 0, file rewritten, mode 444 -> 644
 *   non-fast-forward    exit 0, file rewritten, mode 444 -> 644
 *   conflicting         exit 1 (the conflict), markers written, 444 -> 644
 *
 * In every case an UNTOUCHED locked file kept its 444. So git neither
 * consults nor honours the mode bit: it unlinks and recreates, and the
 * new file arrives at the umask default.
 *
 * **The self-violation is real and is WORSE than the card predicted, in
 * the direction that costs.** An `EACCES` is loud and stops the sync; what
 * actually happens is that the sync SILENTLY DISARMS this layer on
 * exactly the files it most needed to hold — the out-of-fence ones the
 * merge just brought in — with no error, no output and nothing in `git
 * status` to see. So the event list below is not a courtesy around a
 * predicted failure; the RE-APPLY is load-bearing, and `--status` exists
 * because a guard that a routine act silently removes must be askable.
 *
 * ── FILES ONLY. NEVER A DIRECTORY. Three reasons and all three measured.
 * 1. `.nputer/` is the runtime directory (`T-154`'s fence manifest and
 *    `T-203`'s verdict token) and it is created and rewritten AT THE
 *    WORKTREE ROOT. A read-only root would `EACCES` the token mint, and
 *    a push with no token is refused — so a directory lock would stop
 *    every lane from pushing at all. It is safe here by CONSTRUCTION
 *    rather than by an exception list: the corpus is `git ls-files`, and
 *    `.nputer/` is ignored by its own `.gitignore`, so no path under it
 *    is ever a candidate.
 * 2. `git worktree remove` unlinks files, and unlink is authorised by the
 *    PARENT DIRECTORY's mode, not the file's. Locking only files keeps
 *    removal clean — measured: a clean locked tree removes at exit 0, a
 *    dirty locked tree removes at exit 0 under `--force`, neither leaves
 *    residue. That is the card's event 4 discharged by construction.
 * 3. A build writes `node_modules`, `dist` and `target`, every one of them
 *    ignored and therefore untracked, so no build step meets this layer.
 *
 * ── WHAT THIS LAYER DOES NOT COVER, STATED SO IT IS NOT OVERSOLD ─────
 * The lane fence is TWO layers with different blind spots and neither is
 * sufficient alone (`docs/CONVENTIONS.md`: a guard trusted further than
 * it measures is this project's most repeated defect).
 *
 * - **L0 A WRITER THAT RENAMES IS NOT BLOCKED, AND THIS IS THE LIMIT
 *   MOST LIKELY TO BE MISREAD.** A mode bit refuses an OPEN FOR WRITING
 *   on the existing file. It says nothing about REPLACING that file by
 *   rename, which the PARENT DIRECTORY authorises — and the directory is
 *   deliberately left writable, for the three reasons above. So the
 *   canonical in-place edit goes straight through. Measured:
 *
 *       >  redirect onto 0444, writable dir     REFUSED, intact
 *       sed -i     on 0444, writable dir        exit 0, CHANGED
 *       mv -f      onto 0444, writable dir      exit 0, replaced
 *       sed -i     on a writable file, 0555 dir REFUSED
 *
 *   The first line is the positive control; the fourth shows WHY rather
 *   than merely that — `sed -i` writes a temp file and renames it.
 *   **Classify a writer by HOW IT WRITES, never by what it is called.**
 *   `T-212`'s landing gate catches the residue, because a renamed-over
 *   file is a content change in the lane's own diff. Pinned portably by
 *   `lane-lock.spec.ts` on the RENAME MECHANISM rather than on one
 *   platform's `sed` flag spelling; the `sed` figures above are this
 *   platform's and are recorded with it.
 * - **L1 CREATION IS NOT BLOCKED.** Directories stay writable, so a new
 *   out-of-fence file can be created. `T-212`'s landing gate sees it —
 *   it appears in the lane's own diff.
 * - **L2 DELETION IS NOT BLOCKED.** `rm -f` on a locked file in a
 *   writable directory succeeds (measured). The landing gate sees that
 *   too, for the same reason.
 * - **L3 GIT WRITES STRAIGHT THROUGH IT** and silently restores the write
 *   bit, per the measurement above. So this layer does not fence git, and
 *   every git operation that rewrites a file disarms it there.
 * - **L4 IT IS NOT A SECURITY BOUNDARY.** The owner may `chmod` it back;
 *   root ignores it entirely. It is a hard stop for an ordinary writer
 *   and a speed bump for a determined one.
 * - **L5 IT DOES NOT TRAVEL.** Mode bits below the executable bit are not
 *   in the tree, so this is per-worktree and per-machine, and `git
 *   status` stays clean under it.
 *
 * **L5's CLEAN-TREE HALF IS LOAD-BEARING FOR SOMETHING THIS MODULE NEVER
 * ARGUES, AND THAT IS WHY IT IS PINNED RATHER THAN ASSERTED.** The
 * reasoning throughout this file is about RESTORE FIDELITY — record the
 * mode found, hand it back exactly — and clearing bits from the found
 * mode (`mode & ~0o222`) falls out of that. But it also decides a
 * question in a different file: an absolute `chmod 0444` would change the
 * mode of every tracked EXECUTABLE, which git DOES record, dirtying the
 * tree; `T-203`'s gate-runner would then see tracked dirt and decline the
 * verdict token, and the push guard would refuse every push — the layer
 * silently disabling the gate that shipped hours before it. **That chain
 * is closed here as a CONSEQUENCE of restore fidelity and not by an
 * argument aimed at it**, which is exactly the shape that rots quietly.
 * So `lane-lock.spec.ts` asserts `git status --porcelain` is EMPTY under
 * an armed layer, and the ledger body plants a tracked `100755` file and
 * requires the ledger to carry `755`. Two bodies, one for each half.
 *
 * The complement is exact and is the reason both layers are kept: the
 * LANDING GATE cannot see a lane writing ANOTHER lane's worktree, because
 * that never enters the writing lane's diff, and THIS layer covers it —
 * the other lane's own out-of-fence files are read-only to everybody.
 * Conversely this layer cannot see content that lands through a path
 * where the mode bit was legitimately dropped (L3), and the gate covers
 * exactly that.
 *
 * ── AND IT DOES NOT REPEAT T-228's TRAP ──────────────────────────────
 * `decide()` in the hook runs its stale-stamp comparison BEFORE the
 * `alwaysWritable` carve-out, so during a half-performed fence widening a
 * lane cannot write its own notes (`T-228`). **This layer has no stamp
 * concept at all**: its writable set is a function of the manifest alone,
 * and `alwaysWritable` is consulted unconditionally. `docs/tasks` is
 * therefore never locked, in any state, so a lane inside T-228's window
 * still has a physically writable place to file the finding that explains
 * why it is stuck. This does not FIX T-228 — the hook still refuses the
 * Write tool — it declines to add a second, physical copy of the same
 * trap. See `laneLockPlan` for the ordering, which mirrors the hook's own
 * lane arm deliberately.
 */

/**
 * The ledger, beside the manifest in the runtime directory it already
 * self-ignores. UNTRACKED BY CONSTRUCTION, which is the same reason
 * `MANIFEST_REL_PATH` lives there: a ledger that reached the integration
 * branch would hand every checkout one lane's chmod history.
 */
export const LEDGER_REL_PATH = ".nputer/lane-lock.json";

/**
 * The ledger's own version. A ledger this reader does not recognise is a
 * ledger it will not restore from, and it says so rather than guessing a
 * mode — restoring the wrong bits is worse than refusing to restore.
 */
export const LEDGER_VERSION = 1;

/** Re-exported so a caller needs one import for the runtime dir's contract. */
export const LEDGER_DIR_IGNORE = RUNTIME_DIR_IGNORE;

/**
 * A problem with the LANE, not with this command — the house exit
 * contract's 1 rather than its 3. `dispatch-brief.mjs`'s `EXIT` is the
 * one spelling of those numbers and this module imports it rather than
 * restating it.
 */
export class LaneLockFinding extends Error {}

/**
 * @typedef {object} LockedEntry
 * @property {string} path repository-relative, POSIX-separated
 * @property {string} mode the permission bits BEFORE the lock, octal, e.g. "644"
 */

/**
 * @typedef {object} LockLedger
 * @property {number} version
 * @property {string} appliedAt   ISO time — a LIVE fact about the apply
 * @property {string} worktree    the lane worktree these modes were read in
 * @property {string} taskId      whose manifest the plan was computed from
 * @property {string} touchesLine the manifest's stamp, so a ledger is attributable
 * @property {LockedEntry[]} locked
 */

/**
 * @typedef {object} LockPlan
 * @property {string[]} lock     tracked paths that must be read-only
 * @property {string[]} writable tracked paths the fence leaves writable
 */

/**
 * WHICH TRACKED PATHS THE FENCE LEAVES WRITABLE — pure, and a MIRROR of
 * the hook's own lane arm rather than a second opinion about it.
 *
 * `decide()` in `.claude/hooks/lane-fence.mjs` allows a lane write when
 * the path is under `manifest.alwaysWritable` or under `manifest.paths`,
 * in that order, and blocks otherwise. This function answers the same
 * question over the same two lists with the same containment predicate —
 * the hook's own exported `within`, imported rather than re-spelled, so
 * "is this path inside that domain" has one implementation in this
 * repository (`T-057`).
 *
 * THE ORDER IS COPIED DELIBERATELY AND NOT INCIDENTALLY. `alwaysWritable`
 * FIRST is what keeps `docs/tasks` writable in every state of the card
 * (the T-228 note in this file's header), and it is what makes the
 * physical verdict and the hook's verdict comparable path by path —
 * which `lane-lock.spec.ts` asserts by driving `decide()` for real
 * instead of trusting this sentence.
 *
 * `manifest.excluded` is NOT consulted, and its absence mirrors the hook:
 * `excluded` holds the card's own file, which lives under `docs/tasks`
 * and is therefore already writable, and the hook's LANE arm does not
 * read it either. A layer that carved out more than the hook allows would
 * be a physical permission for a write the hook still refuses.
 *
 * @param {readonly string[]} tracked every path `git ls-files` names in the lane
 * @param {{ paths: string[], alwaysWritable: string[] }} manifest
 * @returns {LockPlan}
 */
export function laneLockPlan(tracked, manifest) {
  /** @type {string[]} */
  const lock = [];
  /** @type {string[]} */
  const writable = [];
  for (const rel of tracked) {
    if (fenceAllows(rel, manifest)) writable.push(rel);
    else lock.push(rel);
  }
  return { lock, writable };
}

/**
 * The predicate `laneLockPlan` is built out of, exported so a spec can
 * put it beside the hook's `decide()` on the same path.
 *
 * @param {string} rel
 * @param {{ paths: string[], alwaysWritable: string[] }} manifest
 * @returns {boolean}
 */
export function fenceAllows(rel, manifest) {
  for (const domain of manifest.alwaysWritable) if (within(rel, domain)) return true;
  for (const domain of manifest.paths) if (within(rel, domain)) return true;
  return false;
}

/**
 * The lane worktree this command is allowed to act on, or a throw.
 *
 * TWO REFUSALS, AND THE FIRST IS THE ONE THAT MATTERS. A checkout that is
 * not on a lane branch is the INTEGRATION CHECKOUT or a detached scratch
 * tree — the seats `lane-protocol.md` rule 5 names as the positive
 * control that keeps a refusal distinguishable from an absence — and
 * locking one would freeze the seat every merge and every checkpoint runs
 * in. So it is refused by name rather than by the manifest happening to
 * be absent there.
 *
 * @param {string} worktree absolute path to a lane worktree
 * @returns {{ root: string, branch: string }}
 */
export function laneAt(worktree) {
  const root = findCheckoutRoot(worktree);
  if (root === undefined) {
    throw new LaneLockFinding(
      `lane-lock: ${worktree} sits in no git checkout, so there is no tracked corpus to lock and ` +
        "no lane whose fence would say which half of it.",
    );
  }
  const headRef = readHeadRef(root);
  if (headRef === undefined || !LANE_BRANCH_RE.test(headRef)) {
    throw new LaneLockFinding(
      `lane-lock: ${root} is on ${headRef ?? "a HEAD this reader could not resolve"}, which is not ` +
        "a lane branch. THIS LAYER ARMS LANES AND NOTHING ELSE — the integration checkout and every " +
        "detached scratch tree hold no fence (method/lane-protocol.md rule 5), and a lock applied " +
        "there would freeze the seat that performs every merge and every checkpoint.",
    );
  }
  return { root, branch: headRef.replace(/^refs\/heads\//, "") };
}

/**
 * @typedef {object} ApplyReport
 * @property {string} root
 * @property {string} branch
 * @property {string} taskId
 * @property {number} tracked   how many paths git names in this lane
 * @property {number} locked    how many are now read-only
 * @property {number} writable  how many the fence leaves alone
 * @property {number} absent    indexed but not on disk, so nothing to chmod
 * @property {number} skipped   tracked but not a regular file — a symlink
 * @property {number} restored  paths a PREVIOUS ledger handed back first
 * @property {{ path: string, error: string }[]} failures
 * @property {string} ledgerFile
 *
 * THE COUNTS CLOSE, AND THEY ARE MEANT TO BE CHECKED:
 * `locked + absent + skipped + failures.length === tracked - writable`.
 * A report whose numbers do not add up is a report that lost a file
 * somewhere, and this layer's whole claim is about a complement.
 */

/**
 * ARM THE LAYER from the manifest that is already in the lane.
 *
 * IT IS IDEMPOTENT BY RE-BASELINING, WHICH IS ALSO HOW THE CARD'S EVENT 2
 * IS DISCHARGED WITH NO SECOND TRIGGER. A fence widening re-runs the
 * dispatch step, which rewrites the manifest and calls this again; so
 * this first RELEASES any lock a previous ledger records — handing every
 * file its recorded mode back — and only then re-plans against the
 * manifest now on disk. Without that, a path that has just been GRANTED
 * would stay physically read-only while the hook allowed it, and the lane
 * would meet a refusal from a layer nobody had told it about.
 *
 * THE PRIOR MODE IS RECORDED, NOT ASSUMED. Restoring by `u+w` would be
 * right for every file in this repository on the day this was written and
 * wrong the first time it is not, so the ledger carries the bits it
 * found. Derive the distribution rather than quoting one:
 *
 *   git ls-files -z | xargs -0 stat -f '%OLp' | sort | uniq -c
 *
 * @param {string} worktree absolute path to the lane worktree
 * @param {{ at?: string }} [options] `at` is injectable so a spec is not a clock
 * @returns {ApplyReport}
 */
export function applyLaneLock(worktree, options = {}) {
  const { root, branch } = laneAt(worktree);
  const read = readManifest(root);
  if ("problem" in read) {
    throw new LaneLockFinding(
      `lane-lock: ${read.problem}, and this layer locks exactly the complement of a fence. ` +
        "Expand the fence first (`brief.mjs --task <T-NNN> --write-fence <worktree>` from the " +
        "integration checkout); this command reads the answer and never computes one.",
    );
  }
  const manifest = read.manifest;

  // THE RE-BASELINE IS A PRECONDITION, NOT A COURTESY, SO A LEDGER THAT
  // CANNOT BE READ REFUSES THE ARM. Proceeding would leave whatever the
  // last apply locked still locked — including a path the fence has since
  // GRANTED — which is `T-211`'s half-performed widening arriving by a
  // second road: the lane stopped dead on paths it was told it holds, for
  // a reason nobody is looking for.
  const previous = releaseLaneLock(root, { quietWhenAbsent: true });
  if (previous.problem !== undefined) {
    throw new LaneLockFinding(
      `lane-lock: ${previous.problem}. This layer re-baselines before it re-arms, so a ledger it ` +
        "cannot read means it cannot know which files it must hand back — and arming over that " +
        "would leave a newly granted path physically read-only. Restore the modes by hand " +
        `(\`chmod -R u+w\` over the lane), delete ${LEDGER_REL_PATH}, and run this again.`,
    );
  }
  const restored = previous.restored;
  const tracked = trackedFiles(root);
  const plan = laneLockPlan(tracked, manifest);

  /** @type {LockedEntry[]} */
  const locked = [];
  /** @type {{ path: string, error: string }[]} */
  const failures = [];
  let absent = 0;
  let skipped = 0;
  for (const rel of plan.lock) {
    const abs = path.join(root, rel);
    let mode;
    try {
      // `lstat`, so a symlink is judged as itself: chmod follows links, and
      // a tracked symlink pointing out of the lane would otherwise have this
      // layer change the mode of whatever it aims at. Counted rather than
      // dropped, so the report's arithmetic still closes.
      const st = lstatSync(abs);
      if (st.isSymbolicLink() || !st.isFile()) {
        skipped += 1;
        continue;
      }
      mode = st.mode & 0o7777;
    } catch {
      // Indexed but not on disk — a deletion staged, or a sync mid-flight.
      // Nothing to lock and nothing that needs saying twice.
      absent += 1;
      continue;
    }
    try {
      chmodSync(abs, mode & ~0o222);
      locked.push({ path: rel, mode: mode.toString(8) });
    } catch (err) {
      failures.push({ path: rel, error: err instanceof Error ? err.message : String(err) });
    }
  }

  const ledgerFile = writeLedger(root, {
    version: LEDGER_VERSION,
    appliedAt: options.at ?? new Date().toISOString(),
    worktree: root,
    taskId: manifest.taskId,
    touchesLine: manifest.touchesLine,
    locked,
  });

  return {
    root,
    branch,
    taskId: manifest.taskId,
    tracked: tracked.length,
    locked: locked.length,
    writable: plan.writable.length,
    absent,
    skipped,
    restored,
    failures,
    ledgerFile,
  };
}

/**
 * @typedef {object} ReleaseReport
 * @property {string} root
 * @property {boolean} hadLedger
 * @property {number} restored  files handed their recorded mode back
 * @property {number} vanished  files the ledger names that are no longer there
 * @property {{ path: string, error: string }[]} failures
 * @property {string} [problem] why a ledger that exists could not be used
 */

/**
 * DROP THE LAYER ENTIRELY — the card's event 3.
 *
 * A CHECKPOINT SYNC IS A MERGE THE PROTOCOL ITSELF PERFORMS, and the
 * files it must write are by definition the ones this layer locked: that
 * they are outside the pre-widening fence is what made the sync necessary.
 * `lane-protocol.md` fast path B therefore drops the layer for the
 * duration and re-arms from the POST-widening manifest once the merge
 * commit exists. Not a narrowing and not an exception list — off, then on
 * again from the new answer.
 *
 * IT READS THE LEDGER AND NOT THE MANIFEST, WHICH IS THE WHOLE POINT OF
 * KEEPING ONE. During a sync the manifest is the stale half by
 * construction, and a release computed from it would hand back the wrong
 * set. The ledger says what this layer actually did, so undoing it needs
 * nothing else to be true.
 *
 * @param {string} worktree
 * @param {{ quietWhenAbsent?: boolean }} [options] when set, an absent ledger is
 *   an ordinary state rather than a finding — the arming path's own first step
 * @returns {ReleaseReport}
 */
export function releaseLaneLock(worktree, options = {}) {
  const root = findCheckoutRoot(worktree) ?? worktree;
  const file = path.join(root, LEDGER_REL_PATH);
  if (!existsSync(file)) {
    if (options.quietWhenAbsent === true) {
      return { root, hadLedger: false, restored: 0, vanished: 0, failures: [] };
    }
    return {
      root,
      hadLedger: false,
      restored: 0,
      vanished: 0,
      failures: [],
      problem: `no lock ledger at ${LEDGER_REL_PATH} — this lane is not armed, so there is nothing to drop`,
    };
  }

  const read = readLedger(root);
  if ("problem" in read) {
    return { root, hadLedger: true, restored: 0, vanished: 0, failures: [], problem: read.problem };
  }

  let restored = 0;
  let vanished = 0;
  /** @type {{ path: string, error: string }[]} */
  const failures = [];
  for (const entry of read.ledger.locked) {
    const abs = path.join(root, entry.path);
    const mode = Number.parseInt(entry.mode, 8);
    if (!Number.isInteger(mode)) {
      failures.push({ path: entry.path, error: `mode ${JSON.stringify(entry.mode)} is not octal` });
      continue;
    }
    try {
      chmodSync(abs, mode);
      restored += 1;
    } catch (err) {
      // A file the ledger names that is no longer there is the ordinary
      // outcome of a sync that deleted it, not a failure to restore.
      if (!existsSync(abs)) vanished += 1;
      else failures.push({ path: entry.path, error: err instanceof Error ? err.message : String(err) });
    }
  }
  rmSync(file, { force: true });
  return { root, hadLedger: true, restored, vanished, failures };
}

/**
 * @typedef {object} StatusReport
 * @property {string} root
 * @property {string} branch
 * @property {boolean} armed        is there a usable ledger
 * @property {number} shouldBeLocked how many paths the CURRENT manifest puts outside the fence
 * @property {number} lockedNow     how many of those are read-only on disk right now
 * @property {string[]} drift       should be locked and is writable — the silent disarm
 * @property {string[]} stray       locked but the current fence allows it
 * @property {string} [problem]
 */

/**
 * ASK WHETHER THE LAYER IS STILL ARMED — the detector for the failure
 * this card's own measurement found.
 *
 * git rewrites a file at the umask default and says nothing (see the
 * header), so a checkpoint sync, a `git checkout` or a `git stash pop`
 * leaves this layer half-disarmed with no trace anywhere. `drift` is
 * exactly that set: paths the manifest puts outside the fence which are
 * writable on disk. `stray` is the opposite and is the state a widening
 * leaves behind if the re-apply is skipped — locked files the fence now
 * allows.
 *
 * THE DRIFT IS COMPUTED AGAINST THE MANIFEST AND NOT AGAINST THE LEDGER,
 * because the question is whether the CURRENT fence is enforced, not
 * whether a past apply is still intact.
 *
 * @param {string} worktree
 * @returns {StatusReport}
 */
export function laneLockStatus(worktree) {
  const { root, branch } = laneAt(worktree);
  const read = readManifest(root);
  if ("problem" in read) {
    return {
      root,
      branch,
      armed: false,
      shouldBeLocked: 0,
      lockedNow: 0,
      drift: [],
      stray: [],
      problem: read.problem,
    };
  }
  const ledger = readLedger(root);
  const plan = laneLockPlan(trackedFiles(root), read.manifest);

  /** @type {string[]} */
  const drift = [];
  let lockedNow = 0;
  for (const rel of plan.lock) {
    const w = ownerWritable(path.join(root, rel));
    if (w === undefined) continue;
    if (w) drift.push(rel);
    else lockedNow += 1;
  }
  /** @type {string[]} */
  const stray = [];
  for (const rel of plan.writable) {
    const w = ownerWritable(path.join(root, rel));
    if (w === false) stray.push(rel);
  }

  return {
    root,
    branch,
    armed: !("problem" in ledger),
    shouldBeLocked: plan.lock.length,
    lockedNow,
    drift,
    stray,
    // AN ABSENT LEDGER IS NOT A PROBLEM, A CORRUPT ONE IS. `readLedger`
    // reports both the same way — it has one channel — so the two are
    // separated here by asking whether the file is on disk at all. An
    // unarmed lane is an ordinary state that `armed: false` already says;
    // a ledger that exists and cannot be read is a finding, because the
    // next apply will refuse on it.
    ...("problem" in ledger && existsSync(path.join(root, LEDGER_REL_PATH))
      ? { problem: ledger.problem }
      : {}),
  };
}

/**
 * Is the owner write bit set — or `undefined` when the path is not a
 * regular file this layer would have touched at all.
 *
 * @param {string} abs
 * @returns {boolean | undefined}
 */
function ownerWritable(abs) {
  try {
    const st = lstatSync(abs);
    if (st.isSymbolicLink() || !st.isFile()) return undefined;
    return (st.mode & 0o200) !== 0;
  } catch {
    return undefined;
  }
}

/**
 * Read and shape-check the ledger. EVERY FAILURE IS A REFUSAL AND NONE IS
 * A SHRUG — the same rule the manifest reader keeps one layer down: a
 * ledger this reader cannot understand is one it will not restore modes
 * from, and it says which part it could not read.
 *
 * @param {string} root
 * @returns {{ ledger: LockLedger } | { problem: string }}
 */
export function readLedger(root) {
  const file = path.join(root, LEDGER_REL_PATH);
  let raw;
  try {
    raw = readFileSync(file, "utf8");
  } catch {
    return { problem: `no lock ledger at ${LEDGER_REL_PATH}` };
  }
  /** @type {unknown} */
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    return {
      problem: `${LEDGER_REL_PATH} is not JSON (${err instanceof Error ? err.message : String(err)})`,
    };
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return { problem: `${LEDGER_REL_PATH} is not a JSON object` };
  }
  const obj = /** @type {Record<string, unknown>} */ (parsed);
  if (obj["version"] !== LEDGER_VERSION) {
    return {
      problem:
        `${LEDGER_REL_PATH} is version ${JSON.stringify(obj["version"])} and this reader knows ` +
        `${LEDGER_VERSION} — it will not guess which bits a stranger's ledger meant`,
    };
  }
  const locked = obj["locked"];
  if (!Array.isArray(locked)) return { problem: `${LEDGER_REL_PATH} carries no \`locked\` array` };
  /** @type {LockedEntry[]} */
  const entries = [];
  for (const item of locked) {
    if (typeof item !== "object" || item === null) {
      return { problem: `${LEDGER_REL_PATH} has a \`locked\` entry that is not an object` };
    }
    const e = /** @type {Record<string, unknown>} */ (item);
    if (typeof e["path"] !== "string" || typeof e["mode"] !== "string") {
      return { problem: `${LEDGER_REL_PATH} has a \`locked\` entry missing \`path\` or \`mode\`` };
    }
    entries.push({ path: e["path"], mode: e["mode"] });
  }
  return {
    ledger: {
      version: LEDGER_VERSION,
      appliedAt: typeof obj["appliedAt"] === "string" ? obj["appliedAt"] : "",
      worktree: typeof obj["worktree"] === "string" ? obj["worktree"] : root,
      taskId: typeof obj["taskId"] === "string" ? obj["taskId"] : "",
      touchesLine: typeof obj["touchesLine"] === "string" ? obj["touchesLine"] : "",
      locked: entries,
    },
  };
}

/**
 * @param {string} root
 * @param {LockLedger} ledger
 * @returns {string} the ledger's path
 */
function writeLedger(root, ledger) {
  armRuntimeDir(root);
  const file = path.join(root, LEDGER_REL_PATH);
  writeFileSync(file, `${JSON.stringify(ledger, null, 2)}\n`, "utf8");
  return file;
}

// ── the command ──────────────────────────────────────────────────────

const FLAGS = Object.freeze(["--worktree", "--apply", "--release", "--status", "--help"]);

const USAGE =
  "usage: node tools/e2e/scripts/lane-lock.mjs (--apply | --release | --status) " +
  "[--worktree <absolute path>]";

/** @param {string[]} argv @returns {number} */
export function main(argv) {
  let worktree = "";
  /** @type {string[]} */
  const acts = [];
  for (let i = 0; i < argv.length; i += 1) {
    const a = /** @type {string} */ (argv[i]);
    if (!FLAGS.includes(a)) {
      console.error(`lane-lock: unknown argument ${JSON.stringify(a)} — ${USAGE}`);
      return EXIT.USAGE;
    }
    if (a === "--help") {
      console.log(USAGE);
      return EXIT.CLEAN;
    }
    if (a === "--worktree") {
      const v = argv[i + 1];
      if (v === undefined || v.startsWith("-")) {
        console.error(`lane-lock: --worktree needs a value — ${USAGE}`);
        return EXIT.USAGE;
      }
      // T-179's class, and this command ACTS on the answer: a relative
      // worktree path resolves against whatever directory the shell sits
      // in (method/lane-protocol.md rule 3), and this one chmods a
      // thousand files at the end of it.
      if (!path.isAbsolute(v)) {
        console.error(
          `lane-lock: --worktree was given the relative path ${JSON.stringify(v)}. A relative ` +
            "worktree path has as many readings as there are directories to run from " +
            "(method/lane-protocol.md rule 3), and this command changes file modes at the end of " +
            "it — state it absolutely.",
        );
        return EXIT.USAGE;
      }
      worktree = v;
      i += 1;
      continue;
    }
    acts.push(a);
  }
  if (acts.length !== 1) {
    console.error(
      `lane-lock: name exactly one of --apply, --release, --status (got ${acts.length}) — ${USAGE}`,
    );
    return EXIT.USAGE;
  }
  const act = /** @type {string} */ (acts[0]);
  const target = worktree === "" ? process.cwd() : worktree;

  try {
    if (act === "--apply") return reportApply(applyLaneLock(target));
    if (act === "--release") return reportRelease(releaseLaneLock(target));
    return reportStatus(laneLockStatus(target));
  } catch (err) {
    if (err instanceof LaneLockFinding) {
      console.error(err.message);
      return EXIT.FOUND;
    }
    console.error(
      `lane-lock: COULD NOT RUN — ${err instanceof Error ? err.stack : String(err)}\n` +
        "  This is the command failing, not a verdict about the lane (docs/STATE.md: an exit 1 may " +
        "mean the gate could not run; read the output, not the code).",
    );
    return EXIT.CANNOT_RUN;
  }
}

/** @param {ApplyReport} r @returns {number} */
function reportApply(r) {
  console.log(`lane-lock: ARMED ${r.taskId} on ${r.branch}`);
  console.log(`  worktree:        ${r.root}`);
  console.log(`  tracked files:   ${r.tracked}`);
  console.log(`  read-only now:   ${r.locked}  (outside the fence)`);
  console.log(`  left writable:   ${r.writable}  (in fence, plus what no card may fence)`);
  if (r.absent > 0) console.log(`  indexed, absent: ${r.absent}`);
  if (r.skipped > 0) console.log(`  not a plain file: ${r.skipped}`);
  if (r.restored > 0) console.log(`  re-baselined:    ${r.restored} handed back from the previous ledger first`);
  console.log(`  ledger:          ${r.ledgerFile}`);
  if (r.failures.length > 0) {
    console.error(`lane-lock: ${r.failures.length} path(s) could not be locked:`);
    for (const f of r.failures) console.error(`  ${f.path}: ${f.error}`);
    console.error(
      "  The lane is armed PARTIALLY. A guard that degrades quietly is worse than no guard, so " +
        "this is a finding rather than a warning.",
    );
    return EXIT.FOUND;
  }
  return EXIT.CLEAN;
}

/** @param {ReleaseReport} r @returns {number} */
function reportRelease(r) {
  if (r.problem !== undefined) {
    console.error(`lane-lock: ${r.problem}`);
    return EXIT.FOUND;
  }
  console.log(`lane-lock: DROPPED at ${r.root}`);
  console.log(`  restored: ${r.restored}`);
  if (r.vanished > 0) console.log(`  vanished: ${r.vanished} (the ledger named them; they are gone)`);
  if (r.failures.length > 0) {
    console.error(`lane-lock: ${r.failures.length} path(s) could not be restored:`);
    for (const f of r.failures) console.error(`  ${f.path}: ${f.error}`);
    return EXIT.FOUND;
  }
  console.log(
    "  RE-ARM AFTER THE MERGE COMMIT EXISTS, from the POST-widening manifest " +
      "(method/lane-protocol.md fast path B). git rewrites files at the umask default, so a sync " +
      "leaves this layer disarmed on exactly the paths it brought in.",
  );
  return EXIT.CLEAN;
}

/** @param {StatusReport} r @returns {number} */
function reportStatus(r) {
  if (r.problem !== undefined) {
    console.error(`lane-lock: ${r.problem}`);
    return EXIT.FOUND;
  }
  console.log(`lane-lock: ${r.armed ? "ARMED" : "NOT ARMED"} at ${r.root} (${r.branch})`);
  console.log(`  outside the fence: ${r.shouldBeLocked}`);
  console.log(`  read-only on disk: ${r.lockedNow}`);
  if (r.drift.length > 0) {
    console.error(`lane-lock: DRIFT — ${r.drift.length} out-of-fence path(s) are writable again:`);
    for (const p of r.drift.slice(0, 20)) console.error(`  ${p}`);
    if (r.drift.length > 20) console.error(`  … and ${r.drift.length - 20} more`);
    console.error(
      "  This is what a git write leaves behind: it unlinks and recreates at the umask default, " +
        "silently. Re-arm with --apply.",
    );
  }
  if (r.stray.length > 0) {
    console.error(`lane-lock: STRAY — ${r.stray.length} in-fence path(s) are still read-only:`);
    for (const p of r.stray.slice(0, 20)) console.error(`  ${p}`);
    console.error("  A widening whose re-apply was skipped. Re-arm with --apply.");
  }
  return r.drift.length > 0 || r.stray.length > 0 ? EXIT.FOUND : EXIT.CLEAN;
}

/**
 * `process.exitCode`, NEVER `process.exit()` — and the sweep in
 * `tests/brief-flush.spec.ts` caught this file with the wrong one before
 * it was ever committed, which is the sweep doing exactly its job.
 *
 * A command that ends at `process.exit()` tears down its own stdout,
 * dropping whatever has not drained: invisible through a file and a TTY,
 * silent through a pipe. Setting the code lets Node exit naturally once
 * the loop is empty, which is after stdout has drained. This command is
 * safe to end that way because everything it does is SYNCHRONOUS — a
 * `git ls-files` through `execFileSync`, `lstat`, `chmod`, one
 * `writeFileSync` — and it opens no timer, socket or watcher, so nothing
 * holds the loop open. If a future arm ever leaves a handle open this
 * command HANGS, which is loud and attributable, where the call it
 * replaced would have gone on silently dropping the tail.
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  process.exitCode = main(process.argv.slice(2));
}
