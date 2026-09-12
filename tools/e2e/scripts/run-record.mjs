/**
 * THE RUN RECORD (T-311) — one file-backed record per child run, and the
 * same seven operations over every child this loop starts.
 *
 * **WHAT WAS MISSING IS NOT A FEATURE, IT IS A PLACE.** A child's
 * assignment was recorded in three places that never met — the dispatch
 * stamp on the card, the brief file in the scratch directory, and the
 * seat's own memory of what it spawned — so on the recovery day of
 * 2026-09-11 two executors stopped at a quota and their state had to be
 * reconstructed from their worktrees by reading diffs. Nothing on disk
 * said WHO had been started FOR WHICH ATTEMPT, nothing said whether the
 * question in an ask file had been answered, and nothing stopped a
 * second writer being started for a lane the first still held (the T-247
 * race). This module is that place: `.supertaskr/runs/<work>/<attempt>.json`,
 * one document per attempt, and an exclusive reservation per RESOURCE
 * beside it.
 *
 * ── THE TWO DISTINCTIONS THE CARD SEPARATES, AND THEY ARE THE DESIGN ─
 *
 * 1. **THE WORK SERVED IS NOT THE RESOURCE A CHILD MAY WRITE.** A card
 *    and a consultation are work; a lane worktree, a clone and a bench
 *    are resources. Every child gets a record. Only a child granted
 *    write ownership of a resource takes that resource's reservation —
 *    so an executor and a tool-less phase one run for ONE card at the
 *    same time, under two records, exactly as they do today, because
 *    the phase one is a PARTICIPANT and reserves nothing.
 * 2. **A NATIVE CHILD IS NOT A PROCESS CHILD, AND BOTH GET THE SAME
 *    OPERATIONS.** A native child is spawned by the seat's own harness
 *    and this arm binds the attempt to the harness's task or session
 *    id; a process child is launched through an adapter and carries a
 *    process identity as well. **NO ADAPTER IS BUILT HERE** (T-312 and
 *    T-316 build them), and the operations below are written so that
 *    neither card has to change one of them: the adapter supplies the
 *    identity and the evidence, and every state transition stays here.
 *
 * ── THE FIVE PROPERTIES THIS FILE IS ANSWERABLE FOR ──────────────────
 *
 * - **THE RESERVATION IS TAKEN ATOMICALLY, BEFORE THE LAUNCH.** It is an
 *   `open(O_EXCL)` and not a check-then-write: two arms racing for one
 *   lane cannot both see it free, because the filesystem decides and
 *   only one `openSync(file, "wx")` returns. A check-then-write would
 *   answer the T-247 race with a smaller window rather than with none.
 * - **EXECUTION AND ASSIGNMENT ARE SEPARATE FACTS.** A confirmed launch
 *   is `started`; evidence that it is executing makes it `running`;
 *   PROCESS EXIT ALONE IS NEVER `finished`. A child that ends its turn
 *   with an unanswered question leaves the assignment `blocked` and the
 *   execution ended, which is a pair no single field can hold.
 * - **NEVER A HEARTBEAT, AND AN UNKNOWN STATE IS `unknown`.** Nothing
 *   here polls a child for liveness and nothing infers liveness from
 *   time passing. What cannot be established is recorded as not
 *   established — a state this module invented would be the defect
 *   every guard in this repository exists to stop.
 * - **AN ACKNOWLEDGEMENT IS PERSISTED FROM EVIDENCE, NEVER ASSUMED.** An
 *   answer `delivered` whose acknowledgement is lost STAYS `delivered`:
 *   it is re-delivered on `continue`, and the evidence of each step is
 *   retained beside it.
 * - **THIS ARM SIGNALS NOTHING.** `stop` is a record of a termination
 *   that has been ESTABLISHED — the harness's own stop for that task id
 *   is the seat's act, and a signal to the shared harness process would
 *   take down every other child with it. The refusal is structural
 *   (nothing here calls a signal) and named (a target that is this
 *   process or its parent is refused by name).
 *
 * ── WHAT THIS MODULE IS NOT ──────────────────────────────────────────
 * No daemon, no heartbeat, no scheduler, no adapter. Every function here
 * is called by an arm, does one thing to one document, and returns.
 *
 * Execution lives in `brief.mjs` (`--run <verb>`), never here: importing
 * this module runs nothing, which is the lint-tokens shape every script
 * in this directory keeps.
 */

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  appendFileSync,
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
  writeSync,
} from "node:fs";
import path from "node:path";
import { RUNTIME_DIR, armRuntimeDir } from "../../../.claude/hooks/gate-token.mjs";
import { isRecordablePid, processRow } from "./checkout-currency.mjs";
import { AWAIT_INTERVAL_MS, liveProv, note, runAwait, value } from "./dispatch-brief.mjs";

/** The record format this reader knows. A document declaring another is refused, never guessed at. */
export const RECORD_VERSION = 1;

/** Where the records live, relative to the checkout that holds them. */
export const RUNS_REL_PATH = `${RUNTIME_DIR}/runs`;

/** Where the writer reservations live: ONE file per resource, and the file IS the lock. */
export const RESERVATIONS_REL_PATH = `${RUNS_REL_PATH}/reservations`;

/**
 * THE SEVEN OPERATIONS, PLUS THE BIND THAT CLOSES THE LAUNCH.
 *
 * `bind` is not an eighth operation in the card's sense: it is the
 * second half of `start` for a NATIVE child, performed by the arm after
 * the seat's own harness has spawned it and returned an id. It is a
 * separate verb because the seat cannot spawn from inside this command —
 * the harness does that — so the reservation and the record have to
 * exist BEFORE the spawn and the id arrives after it.
 */
export const OPERATIONS = Object.freeze([
  "start",
  "bind",
  "observe",
  "send",
  "wait",
  "collect",
  "continue",
  "stop",
]);

/** Every state a record may carry. */
export const STATES = Object.freeze([
  "reserved",
  "started",
  "running",
  "blocked",
  "finished",
  "failed",
  "stopped",
  "unknown",
]);

/** The states that release a reservation, and the only ones `collect` will answer for. */
export const TERMINAL_STATES = Object.freeze(["finished", "failed", "stopped"]);

/** The three steps an answer moves through, in order, with the evidence of each retained. */
export const ANSWER_STATES = Object.freeze(["written", "delivered", "acknowledged"]);

/**
 * THE GRAMMAR, AND IT IS ONE GRAMMAR FOR BOTH KINDS OF CHILD.
 *
 * A process child writes these tokens into the ask file it was given; a
 * native child's arrive in the harness's own output, which the seat
 * hands to `observe` as evidence. The tokens are the same either way, so
 * nothing downstream has to know which kind of child it is reading — and
 * that is exactly the property T-312 and T-316 need from this card.
 *
 * **A TOKEN IS LINE-INITIAL, AND THAT IS NOT A STYLE RULE.** A sentence
 * that MENTIONS a token is not a token. The answer this arm writes into
 * the ask file tells the child, in prose, which line to write back — so
 * without this rule the arm reads its OWN INSTRUCTION back as the
 * child's acknowledgement and marks an answer acknowledged that nobody
 * has read. That is not hypothetical: it is what the first run of this
 * module's own bodies caught, and it is the exact shape of the failure
 * the card forbids — an acknowledgement assumed rather than evidenced.
 */
export const ASK_TOKEN = "RUN-ASK";
export const ACK_TOKEN = "RUN-ACK";
export const DONE_TOKEN = "RUN-DONE";

/** A question id, as both tokens spell it. */
const ID_PATTERN = "[A-Za-z0-9][A-Za-z0-9._-]{0,63}";

/**
 * The finding class: a run operation this module was asked for and will
 * not perform. Every one carries a CODE — a stable, greppable name for
 * WHY — because a refusal a caller can only match on a sentence is a
 * refusal that becomes prose the day the sentence is improved.
 */
export class RunRecordFinding extends Error {
  /** @param {string} code @param {string} message */
  constructor(code, message) {
    super(message);
    this.name = "RunRecordFinding";
    /** @type {string} */
    this.code = code;
  }
}

/**
 * @typedef {object} Evidence
 * @property {string} at    when it was recorded
 * @property {string} kind  what produced it
 * @property {string} detail the text, or a description of where it lives
 */

/**
 * @typedef {object} Answer
 * @property {string} state       one of ANSWER_STATES
 * @property {string} writtenAt
 * @property {?string} deliveredAt
 * @property {?string} acknowledgedAt
 * @property {string} text
 * @property {number} redeliveries
 * @property {Evidence[]} evidence
 */

/**
 * @typedef {object} Question
 * @property {string} id
 * @property {string} recordedAt
 * @property {string} source
 * @property {?Answer} answer
 */

/**
 * @typedef {object} Execution
 * @property {string} harnessId  the harness's task or session id
 * @property {?number} pid       a process child's process identity
 * @property {?string} identity  that process's start time, so a REUSED pid is not read as the same run
 * @property {string} boundAt
 * @property {?string} endedAt
 * @property {?string} outcome
 * @property {?string} usage
 */

/**
 * @typedef {object} OwnedJob
 * @property {string} kind  `pid` or `port`
 * @property {string} id
 */

/**
 * @typedef {object} Assignment
 * @property {string} kind      `card` or `consultation`
 * @property {string} id        the card id, or the consultation's own id
 * @property {string} role
 * @property {string} resource  an absolute path, or `none` for a read-only participant
 * @property {string} harness
 * @property {string} model
 * @property {string} effort
 * @property {string} base
 * @property {string} brief
 * @property {string} cwd
 * @property {string} deadline
 * @property {string} budget
 * @property {OwnedJob[]} [ownedJobs]
 */

/**
 * @typedef {object} RunRecord
 * @property {number} version
 * @property {string} attempt
 * @property {string} state
 * @property {Assignment} assignment
 * @property {string} assignmentDigest
 * @property {boolean} writer
 * @property {?string} resource
 * @property {{ file: ?string, takenAt: ?string, releasedAt: ?string }} reservation
 * @property {{ path: string, digest: string }} brief
 * @property {{ kind: string, manifest: ?string, digest: ?string, paths: number }} permission
 * @property {?string} ask
 * @property {?Execution} execution
 * @property {Execution[]} history
 * @property {Question[]} questions
 * @property {OwnedJob[]} ownedJobs
 * @property {{ state: string, at: string, evidence: Evidence[] } | null} outcome
 * @property {string} usage
 * @property {string[]} refs
 * @property {string} report
 * @property {{ seen: string, at: string }} stamp
 * @property {?string} replaces
 * @property {{ at: string, op: string, from: string, to: string, why: string }[]} events
 */

/* ────────────────────────────────────────────────────────────────────
 * PATHS AND DIGESTS — derived, never typed.
 * ──────────────────────────────────────────────────────────────────── */

/** @param {string} text @returns {string} */
export function sha256(text) {
  return `sha256:${createHash("sha256").update(text).digest("hex")}`;
}

/** @param {string} root @returns {string} */
export function runsDir(root) {
  return path.join(root, RUNS_REL_PATH);
}

/**
 * THE ATTEMPT ID CARRIES ITS WORK, so a record is locatable from the id
 * alone and no second flag has to agree with the first. `T-311-a2` is
 * the second attempt at `T-311`; `T-311-s4-a1` is the first at a
 * sub-card, because the suffix is stripped from the END.
 *
 * @param {string} attempt
 * @returns {string}
 */
export function workOf(attempt) {
  const m = /^([A-Za-z0-9][A-Za-z0-9._-]{0,127})-a\d+$/.exec(attempt);
  if (m === null || m[1] === undefined) {
    throw new RunRecordFinding(
      "ATTEMPT_ID_UNREADABLE",
      `run-record: ${JSON.stringify(attempt)} is not an attempt id — the shape is <work>-a<n>, ` +
        "and the work is carried IN the id so a record is locatable from the id alone rather " +
        "than from two flags that have to agree.",
    );
  }
  return m[1];
}

/** @param {string} root @param {string} attempt @returns {string} */
export function recordPath(root, attempt) {
  return path.join(runsDir(root), workOf(attempt), `${attempt}.json`);
}

/**
 * THE RESERVATION FILE'S NAME IS A FUNCTION OF THE RESOURCE, and it
 * carries a readable half so a human listing the directory can see what
 * is held, plus a digest so two resources with one basename — the lane
 * and the bench of the same card, say — can never collide.
 *
 * @param {string} root @param {string} resource @returns {string}
 */
export function reservationPath(root, resource) {
  const resolved = path.resolve(resource);
  const digest = createHash("sha256").update(resolved).digest("hex").slice(0, 12);
  return path.join(root, RESERVATIONS_REL_PATH, `${path.basename(resolved)}-${digest}.json`);
}

/* ────────────────────────────────────────────────────────────────────
 * THE ASSIGNMENT — one document, validated by NAMING what is missing.
 * ──────────────────────────────────────────────────────────────────── */

/**
 * The fields an assignment must carry, each because the recovery day
 * needed it and could not find it.
 */
const ASSIGNMENT_FIELDS = Object.freeze([
  "kind",
  "id",
  "role",
  "resource",
  "harness",
  "model",
  "effort",
  "base",
  "brief",
  "cwd",
  "deadline",
  "budget",
]);

/**
 * Read and validate an assignment document.
 *
 * **EVERY FIELD IS REQUIRED AND `none` MUST BE TYPED.** A defaulted
 * budget is an unauthorised budget and a defaulted resource is a writer
 * nobody meant to start, so the absence of a field is refused while the
 * WORD `none` is accepted — the difference between the two is the whole
 * value of the document.
 *
 * @param {string} file
 * @returns {Assignment}
 */
export function readAssignment(file) {
  if (!existsSync(file)) {
    throw new RunRecordFinding(
      "ASSIGNMENT_ABSENT",
      `run-record: no assignment at ${file}. The assignment is the document a record is written ` +
        "FROM; there is nothing here this command may invent.",
    );
  }
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(file, "utf8"));
  } catch (err) {
    throw new RunRecordFinding(
      "ASSIGNMENT_UNREADABLE",
      `run-record: the assignment at ${file} did not parse as JSON: ${String(err)}`,
    );
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new RunRecordFinding(
      "ASSIGNMENT_UNREADABLE",
      `run-record: the assignment at ${file} is not a JSON object.`,
    );
  }
  const obj = /** @type {Record<string, unknown>} */ (parsed);
  const missing = ASSIGNMENT_FIELDS.filter((f) => {
    const v = obj[f];
    return typeof v !== "string" || v.trim() === "";
  });
  if (missing.length > 0) {
    throw new RunRecordFinding(
      "ASSIGNMENT_INCOMPLETE",
      `run-record: the assignment at ${file} carries no ${missing.join(", ")}. Every field is ` +
        "required and the word `none` is a legal value for resource, deadline and budget — a " +
        "field left out is a fact nobody decided, which is what the recovery day had to " +
        "reconstruct from worktrees.",
    );
  }
  const kind = String(obj["kind"]);
  if (kind !== "card" && kind !== "consultation") {
    throw new RunRecordFinding(
      "ASSIGNMENT_KIND",
      `run-record: ${JSON.stringify(kind)} is not a kind of work. The work served is a card or a ` +
        "consultation, and the resource a child may write is a separate field.",
    );
  }
  /** @type {OwnedJob[]} */
  const ownedJobs = [];
  const raw = obj["ownedJobs"];
  if (Array.isArray(raw)) {
    for (const entry of raw) {
      if (entry === null || typeof entry !== "object") continue;
      const e = /** @type {Record<string, unknown>} */ (entry);
      ownedJobs.push({ kind: String(e["kind"] ?? ""), id: String(e["id"] ?? "") });
    }
  }
  const id = String(obj["id"]).trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(id)) {
    throw new RunRecordFinding(
      "ASSIGNMENT_UNREADABLE",
      `run-record: ${JSON.stringify(id)} is not a work id — an id is a charset ` +
        "([A-Za-z0-9][A-Za-z0-9._-]{0,127}) and never a path fragment, because it becomes the " +
        "record's path under the runs directory (the verifier's correction 2 at T-311).",
    );
  }
  return {
    kind,
    id,
    role: String(obj["role"]).trim(),
    resource: String(obj["resource"]).trim(),
    harness: String(obj["harness"]).trim(),
    model: String(obj["model"]).trim(),
    effort: String(obj["effort"]).trim(),
    base: String(obj["base"]).trim(),
    brief: String(obj["brief"]).trim(),
    cwd: String(obj["cwd"]).trim(),
    deadline: String(obj["deadline"]).trim(),
    budget: String(obj["budget"]).trim(),
    ownedJobs,
  };
}

/**
 * THE PERMISSION BOUNDARY IS DERIVED FROM THE WORKING DIRECTORY, never
 * typed into the assignment: a boundary somebody wrote down is a claim
 * about a manifest, and the manifest is on disk where the write hook
 * will read it.
 *
 * @param {string} cwd
 * @returns {{ kind: string, manifest: ?string, digest: ?string, paths: number }}
 */
export function permissionBoundary(cwd) {
  const manifest = path.join(cwd, RUNTIME_DIR, "lane-fence.json");
  if (!existsSync(manifest)) {
    return { kind: "unfenced", manifest: null, digest: null, paths: 0 };
  }
  const text = readFileSync(manifest, "utf8");
  let paths = 0;
  try {
    const m = JSON.parse(text);
    paths = Array.isArray(m?.paths) ? m.paths.length : 0;
  } catch {
    return { kind: "unreadable", manifest, digest: sha256(text), paths: 0 };
  }
  return { kind: "fence", manifest, digest: sha256(text), paths };
}

/* ────────────────────────────────────────────────────────────────────
 * THE RECORD ON DISK.
 * ──────────────────────────────────────────────────────────────────── */

/**
 * Write a record. The document is replaced whole and its HISTORY ARRAYS
 * ARE APPEND-ONLY — earlier executions, outcomes, usage and evidence are
 * carried forward by every caller here, because a continuation that
 * erased the run it continued would destroy exactly what the recovery
 * day needed.
 *
 * @param {string} root @param {RunRecord} rec @returns {string} the path written
 */
export function writeRecord(root, rec) {
  armRuntimeDir(root);
  const file = recordPath(root, rec.attempt);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(rec, null, 2)}\n`, "utf8");
  return file;
}

/**
 * @param {string} root @param {string} attempt @returns {RunRecord}
 */
export function readRecord(root, attempt) {
  const file = recordPath(root, attempt);
  if (!existsSync(file)) {
    throw new RunRecordFinding(
      "RECORD_ABSENT",
      `run-record: no record for attempt ${attempt} at ${file}. Every operation but start acts on ` +
        "a record that already exists; there is no attempt here to observe, answer or stop.",
    );
  }
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(file, "utf8"));
  } catch (err) {
    throw new RunRecordFinding(
      "RECORD_UNREADABLE",
      `run-record: the record at ${file} did not parse: ${String(err)}. A record this reader ` +
        "cannot read is reconciled by hand and never replaced silently.",
    );
  }
  const rec = /** @type {RunRecord} */ (parsed);
  if (rec.version !== RECORD_VERSION) {
    throw new RunRecordFinding(
      "RECORD_VERSION",
      `run-record: the record at ${file} declares version ${String(rec.version)} and this reader ` +
        `knows ${String(RECORD_VERSION)}.`,
    );
  }
  return rec;
}

/**
 * Every record this checkout holds, newest last within each work.
 *
 * @param {string} root @returns {RunRecord[]}
 */
export function allRecords(root) {
  const dir = runsDir(root);
  if (!existsSync(dir)) return [];
  /** @type {RunRecord[]} */
  const out = [];
  for (const work of readdirSync(dir)) {
    const workDir = path.join(dir, work);
    if (work === "reservations" || !statSync(workDir).isDirectory()) continue;
    for (const file of readdirSync(workDir).sort()) {
      if (!file.endsWith(".json")) continue;
      try {
        const rec = /** @type {RunRecord} */ (JSON.parse(readFileSync(path.join(workDir, file), "utf8")));
        if (rec.version === RECORD_VERSION) out.push(rec);
      } catch {
        // A record this reader cannot parse is REPORTED by whoever asked
        // for it by name (readRecord above) and skipped by the sweep: a
        // sweep that threw would make one damaged file hide every other.
      }
    }
  }
  return out;
}

/**
 * The next attempt id for one work, derived from the records on disk.
 *
 * @param {string} root @param {string} work @returns {string}
 */
export function nextAttemptId(root, work) {
  const dir = path.join(runsDir(root), work);
  let highest = 0;
  if (existsSync(dir)) {
    for (const file of readdirSync(dir)) {
      const m = new RegExp(`^${work.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}-a(\\d+)\\.json$`).exec(file);
      if (m !== null && m[1] !== undefined) highest = Math.max(highest, Number(m[1]));
    }
  }
  return `${work}-a${String(highest + 1)}`;
}

/* ────────────────────────────────────────────────────────────────────
 * THE RESERVATION — the atomic half, and the T-247 race's answer.
 * ──────────────────────────────────────────────────────────────────── */

/**
 * @typedef {object} Reservation
 * @property {number} version
 * @property {string} resource
 * @property {string} attempt
 * @property {string} work
 * @property {string} role
 * @property {string} takenAt
 * @property {{ pid: number, host: string }} holder
 */

/**
 * TAKE THE RESOURCE, OR REFUSE NAMING WHO HAS IT.
 *
 * **THE ATOMICITY IS THE `wx` AND NOTHING ELSE.** `openSync(file, "wx")`
 * creates the file or fails with EEXIST, in one syscall, so two arms
 * racing for one lane cannot both pass — the filesystem decides. An
 * `existsSync` then a write would be the same race with a smaller
 * window, which is what the T-247 incident already had.
 *
 * @param {string} root
 * @param {{ resource: string, attempt: string, role: string, at: string, pid?: number, host?: string }} opts
 * @returns {{ file: string, reservation: Reservation }}
 */
export function takeReservation(root, opts) {
  armRuntimeDir(root);
  const file = reservationPath(root, opts.resource);
  mkdirSync(path.dirname(file), { recursive: true });
  /** @type {Reservation} */
  const reservation = {
    version: RECORD_VERSION,
    resource: path.resolve(opts.resource),
    attempt: opts.attempt,
    work: workOf(opts.attempt),
    role: opts.role,
    takenAt: opts.at,
    holder: { pid: opts.pid ?? process.pid, host: opts.host ?? "" },
  };
  let fd;
  try {
    fd = openSyncExclusive(file);
  } catch (err) {
    const code = /** @type {NodeJS.ErrnoException} */ (err).code;
    if (code !== "EEXIST") throw err;
    const held = readReservation(root, opts.resource);
    throw new RunRecordFinding(
      "RESOURCE_RESERVED",
      `run-record: ${path.resolve(opts.resource)} is already reserved by attempt ` +
        `${held === null ? "an unreadable reservation" : held.attempt} since ` +
        `${held === null ? "an unreadable time" : held.takenAt}. A second writer for one resource ` +
        "is the race this reservation exists to refuse; the holder is reconciled before anything " +
        "replaces it.",
    );
  }
  try {
    writeSync(fd, `${JSON.stringify(reservation, null, 2)}\n`);
  } finally {
    closeSync(fd);
  }
  return { file, reservation };
}

/**
 * `open(O_EXCL)`, held in its own function so the ONE line the whole
 * atomicity rests on is greppable, and a mutant to it is visible AS a
 * mutant rather than as a flag on a call nobody reads twice.
 *
 * @param {string} file @returns {number}
 */
function openSyncExclusive(file) {
  return openSync(file, "wx");
}

/**
 * @param {string} root @param {string} resource @returns {?Reservation}
 */
export function readReservation(root, resource) {
  const file = reservationPath(root, resource);
  if (!existsSync(file)) return null;
  try {
    return /** @type {Reservation} */ (JSON.parse(readFileSync(file, "utf8")));
  } catch {
    return null;
  }
}

/**
 * Release a reservation THIS ATTEMPT HOLDS, and refuse to release one it
 * does not: a release of somebody else's reservation is the two-writer
 * failure performed by the guard.
 *
 * @param {string} root @param {{ resource: string, attempt: string }} opts
 * @returns {boolean} whether a reservation was removed
 */
export function releaseReservation(root, opts) {
  const file = reservationPath(root, opts.resource);
  if (!existsSync(file)) return false;
  const held = readReservation(root, opts.resource);
  if (held !== null && held.attempt !== opts.attempt) {
    throw new RunRecordFinding(
      "RESERVATION_NOT_OURS",
      `run-record: ${path.resolve(opts.resource)} is reserved by attempt ${held.attempt} and ` +
        `${opts.attempt} asked to release it. A release of another attempt's reservation is the ` +
        "two-writer failure carried out by the guard that exists to prevent it.",
    );
  }
  rmSync(file, { force: true });
  return true;
}

/* ────────────────────────────────────────────────────────────────────
 * THE WORLD — every probe this module makes, in one place and injected.
 * ──────────────────────────────────────────────────────────────────── */

/**
 * @typedef {object} RunIo
 * @property {() => string} now                     an ISO instant
 * @property {(pid: number) => ?string} identity    a live process's start time, or null when it is gone
 * @property {(port: number) => boolean} listening  whether anything holds that port
 * @property {(dir: string, argv: string[]) => ?string} git  git's answer, or null when it could not be asked
 */

/** @returns {RunIo} */
export function defaultRunIo() {
  return {
    now: () => new Date().toISOString(),
    identity: (pid) => {
      if (!isRecordablePid(pid)) return null;
      const row = processRow(pid);
      return row === undefined ? null : row.startedAt;
    },
    listening: (port) => {
      const probe = spawnSync("lsof", ["-nP", `-iTCP:${String(port)}`, "-sTCP:LISTEN"], {
        encoding: "utf8",
      });
      return probe.error === undefined && probe.status === 0 && String(probe.stdout ?? "").trim() !== "";
    },
    git: (dir, argv) => {
      const probe = spawnSync("git", ["-C", dir, ...argv], { encoding: "utf8" });
      if (probe.error !== undefined || probe.status !== 0) return null;
      return String(probe.stdout ?? "");
    },
  };
}

/* ────────────────────────────────────────────────────────────────────
 * OPERATION ONE — START.
 * ──────────────────────────────────────────────────────────────────── */

/**
 * @param {RunRecord} rec @param {string} at @param {string} op @param {string} to @param {string} why
 */
function transition(rec, at, op, to, why) {
  rec.events.push({ at, op, from: rec.state, to, why });
  rec.state = to;
}

/**
 * Start an attempt: reserve the resource (writers only), then write the
 * record.
 *
 * **THE ORDER IS THE PROPERTY.** The reservation is taken BEFORE the
 * record exists and therefore before any launch: a record written first
 * would be a launch announced before the right to launch was acquired,
 * and the window between them is exactly the T-247 race. A reservation
 * whose record then fails to write is released here, and a reservation
 * whose PROCESS dies before that release is found by reconciliation —
 * it names the attempt it was taken for, so an orphan is identifiable
 * rather than merely present.
 *
 * @param {string} root
 * @param {{ assignment: Assignment, at?: string, host?: string, io?: RunIo }} opts
 * @returns {{ record: RunRecord, file: string, reservation: ?Reservation }}
 */
export function startRun(root, opts) {
  const io = opts.io ?? defaultRunIo();
  const at = opts.at ?? io.now();
  const a = opts.assignment;
  const writer = a.resource !== "none";
  if (!existsSync(a.brief)) {
    throw new RunRecordFinding(
      "BRIEF_ABSENT",
      `run-record: the assignment names a brief at ${a.brief} and there is no file there. The ` +
        "brief is what the child is answerable to, and a digest of nothing is not a digest.",
    );
  }
  if (writer && !existsSync(a.resource)) {
    throw new RunRecordFinding(
      "RESOURCE_ABSENT",
      `run-record: the assignment grants write ownership of ${a.resource} and there is nothing ` +
        "there. A reservation over a path that does not exist protects nothing and hides the " +
        "mistake that made it.",
    );
  }
  const attempt = nextAttemptId(root, a.id);
  /** @type {?Reservation} */
  let reservation = null;
  /** @type {?string} */
  let reservationFile = null;
  if (writer) {
    const taken = takeReservation(root, {
      resource: a.resource,
      attempt,
      role: a.role,
      at,
      ...(opts.host === undefined ? {} : { host: opts.host }),
    });
    reservation = taken.reservation;
    reservationFile = taken.file;
  }
  const briefText = readFileSync(a.brief, "utf8");
  /** @type {RunRecord} */
  const rec = {
    version: RECORD_VERSION,
    attempt,
    state: "reserved",
    assignment: a,
    assignmentDigest: sha256(JSON.stringify(a)),
    writer,
    resource: writer ? path.resolve(a.resource) : null,
    reservation: { file: reservationFile, takenAt: writer ? at : null, releasedAt: null },
    brief: { path: a.brief, digest: sha256(briefText) },
    permission: permissionBoundary(a.cwd),
    ask: path.join(path.dirname(a.brief), `ask-${a.id}.md`),
    execution: null,
    history: [],
    questions: [],
    ownedJobs: a.ownedJobs ?? [],
    outcome: null,
    usage: "unknown",
    refs: [],
    report: "none",
    stamp: { seen: "unknown", at },
    replaces: null,
    events: [],
  };
  transition(
    rec,
    at,
    "start",
    "reserved",
    writer
      ? "the resource was reserved atomically and the record written; the launch comes next and the bind after it"
      : "a read-only participant: a record and NO reservation, which is what lets a phase one run beside its executor",
  );
  try {
    const file = writeRecord(root, rec);
    return { record: rec, file, reservation };
  } catch (err) {
    if (writer) releaseReservation(root, { resource: a.resource, attempt });
    throw err;
  }
}

/* ────────────────────────────────────────────────────────────────────
 * OPERATION TWO — BIND.
 * ──────────────────────────────────────────────────────────────────── */

/**
 * Attach the harness's task or session id — and a process identity where
 * there is one — and move the record to `started`.
 *
 * **A BIND IS THE ONLY THING THAT MAKES A LAUNCH A FACT.** Until it
 * lands the record says `reserved`, which is precisely "the right to run
 * was taken and whether anything is running is not established" — and
 * that is the state criterion two interrupts at.
 *
 * @param {string} root
 * @param {{ attempt: string, harnessId: string, pid?: number, at?: string, io?: RunIo }} opts
 * @returns {RunRecord}
 */
export function bindRun(root, opts) {
  const io = opts.io ?? defaultRunIo();
  const at = opts.at ?? io.now();
  const rec = readRecord(root, opts.attempt);
  if (rec.state !== "reserved") {
    throw new RunRecordFinding(
      "BIND_NOT_RESERVED",
      `run-record: attempt ${rec.attempt} is ${rec.state} and a bind attaches an execution to a ` +
        "RESERVED attempt. A second bind onto a running attempt would overwrite the identity of " +
        "whatever is already executing.",
    );
  }
  const id = opts.harnessId.trim();
  if (id === "") {
    throw new RunRecordFinding(
      "BIND_NO_ID",
      "run-record: a bind needs the harness's task or session id. Without it the record cannot " +
        "name what to observe, answer or stop, which is the whole reason the bind exists.",
    );
  }
  for (const other of allRecords(root)) {
    if (other.attempt === rec.attempt) continue;
    if (other.execution?.harnessId === id && !TERMINAL_STATES.includes(other.state)) {
      throw new RunRecordFinding(
        "BIND_ID_TAKEN",
        `run-record: the harness id ${id} is already bound to attempt ${other.attempt}, which is ` +
          `${other.state}. One execution cannot serve two attempts, and a bind that took it would ` +
          "make every later observation ambiguous.",
      );
    }
  }
  const pid = opts.pid;
  if (pid !== undefined && !isRecordablePid(pid)) {
    throw new RunRecordFinding(
      "BIND_PID",
      `run-record: ${String(pid)} is not a process identity this arm will record — it must be a ` +
        "whole number of at least 1, because 0 is the process group and -1 is every process.",
    );
  }
  rec.execution = {
    harnessId: id,
    pid: pid ?? null,
    identity: pid === undefined ? null : io.identity(pid),
    boundAt: at,
    endedAt: null,
    outcome: null,
    usage: null,
  };
  transition(
    rec,
    at,
    "bind",
    "started",
    `the execution ${id} is attached to this attempt; that it is EXECUTING is a separate fact and needs evidence`,
  );
  writeRecord(root, rec);
  return rec;
}

/* ────────────────────────────────────────────────────────────────────
 * OPERATION THREE — OBSERVE.
 * ──────────────────────────────────────────────────────────────────── */

/**
 * Read the ask file and the evidence for this grammar's tokens.
 *
 * **`RUN-DONE` TAKES THREE VALUES AND THE THIRD IS THE HONEST ONE.**
 * `ok` and `failed` are COMPLETION evidence — the assignment reached an
 * outcome. `gone` says only that the execution is not there any more and
 * says NOTHING about the assignment, which is what a seat can honestly
 * report when its harness lists no such task: the run ended, what it did
 * is `unknown`, and a replacement may now be considered.
 *
 * @param {string} text
 * @returns {{ asks: string[], acks: string[], done: ?string }}
 */
export function readTokens(text) {
  const asks = [...text.matchAll(new RegExp(`^[ \\t]*${ASK_TOKEN}[ \\t]+(${ID_PATTERN})`, "gm"))].map(
    (m) => /** @type {string} */ (m[1]),
  );
  const acks = [...text.matchAll(new RegExp(`^[ \\t]*${ACK_TOKEN}[ \\t]+(${ID_PATTERN})`, "gm"))].map(
    (m) => /** @type {string} */ (m[1]),
  );
  const doneMatch = new RegExp(`^[ \\t]*${DONE_TOKEN}[ \\t]+(ok|failed|gone)`, "m").exec(text);
  return { asks, acks, done: doneMatch === null ? null : /** @type {string} */ (doneMatch[1]) };
}

/**
 * Derive the attempt's state from what is on disk, and write down what
 * could NOT be asked.
 *
 * **NEVER A HEARTBEAT.** Nothing here asks a child whether it is alive
 * and nothing infers liveness from elapsed time. A native child's task
 * state is not askable from this arm at all — the seat's harness holds
 * it — so the evidence the seat passes IS that state, and in its absence
 * a started attempt stays `started` rather than being promoted.
 *
 * @param {string} root
 * @param {{ attempt: string, evidence?: string, at?: string, io?: RunIo }} opts
 * @returns {{ record: RunRecord, signals: string[] }}
 */
export function observeRun(root, opts) {
  const io = opts.io ?? defaultRunIo();
  const at = opts.at ?? io.now();
  const rec = readRecord(root, opts.attempt);
  /** @type {string[]} */
  const signals = [];
  const evidence = (opts.evidence ?? "").trim();
  const askText = rec.ask !== null && existsSync(rec.ask) ? readFileSync(rec.ask, "utf8") : "";
  signals.push(
    rec.ask === null || !existsSync(rec.ask)
      ? "the ask file: absent, so no question or acknowledgement has reached this record through it"
      : `the ask file: read at ${rec.ask}`,
  );
  const fromAsk = readTokens(askText);
  const fromEvidence = readTokens(evidence);

  // QUESTIONS — recorded against the attempt with their own id, from
  // whichever channel carried them. A question already recorded is never
  // re-recorded, so the record's question list is the set and not a log.
  for (const [source, ids] of /** @type {[string, string[]][]} */ ([
    ["ask-file", fromAsk.asks],
    ["harness-output", fromEvidence.asks],
  ])) {
    for (const id of ids) {
      if (rec.questions.some((q) => q.id === id)) continue;
      rec.questions.push({ id, recordedAt: at, source, answer: null });
      signals.push(`a question ${id} was recorded from the ${source}`);
    }
  }

  // ACKNOWLEDGEMENTS — persisted with the ORIGINAL EVIDENCE RETAINED. A
  // delivered answer whose acknowledgement never arrives stays delivered.
  for (const [source, ids, text] of /** @type {[string, string[], string][]} */ ([
    ["ask-file", fromAsk.acks, askText],
    ["harness-output", fromEvidence.acks, evidence],
  ])) {
    for (const id of ids) {
      const q = rec.questions.find((entry) => entry.id === id);
      if (q === undefined || q.answer === null) continue;
      if (q.answer.state === "acknowledged") continue;
      q.answer.state = "acknowledged";
      q.answer.acknowledgedAt = at;
      q.answer.evidence.push({
        at,
        kind: `acknowledged: ${source}`,
        detail: source === "ask-file" ? `${ACK_TOKEN} ${id} in ${String(rec.ask)}` : text,
      });
      signals.push(`the answer to ${id} was acknowledged, taken from the ${source}`);
    }
  }

  // THE EXECUTION — alive, gone, or a pid that now belongs to something
  // else. The identity is the START TIME, so a REUSED pid is not read as
  // the same run: that is the difference between "still going" and
  // "ended, and the number was handed out again".
  let executionEnded = false;
  let executionLive = false;
  if (rec.execution === null) {
    signals.push("no execution is bound to this attempt, so there is nothing to probe");
  } else if (rec.execution.pid === null) {
    signals.push(
      "a NATIVE child: its task state lives in the seat's harness and is not askable from here, " +
        "so the harness's own output is the evidence and there is no probe to make",
    );
    // **THE HARNESS'S NOTIFICATION IS THE END OF A NATIVE CHILD'S
    // EXECUTION**, and it is the only thing that can be: there is no
    // process to probe, and the seat learns of the end from its own
    // harness. So completion evidence arriving in the HARNESS OUTPUT
    // ends the execution — while the same token in the ASK FILE does
    // not, because a process child writes that on its way out and is
    // still running when it does.
    if (fromEvidence.done !== null) {
      executionEnded = true;
      signals.push(
        `the harness's own output carries ${DONE_TOKEN} ${fromEvidence.done} for a native child, ` +
          "which is that child's turn ending — the notification the seat waits on",
      );
    } else if (rec.execution.endedAt !== null) {
      executionEnded = true;
      signals.push(`the record itself: this execution was already recorded as ended at ${rec.execution.endedAt}`);
    }
  } else {
    const identity = io.identity(rec.execution.pid);
    if (identity === null) {
      executionEnded = true;
      signals.push(`the process table: pid ${String(rec.execution.pid)} has left it`);
    } else if (rec.execution.identity !== null && identity !== rec.execution.identity) {
      executionEnded = true;
      signals.push(
        `the process table: pid ${String(rec.execution.pid)} is live but started at a different ` +
          "time, so this attempt's execution has ended and the number has been handed out again",
      );
    } else {
      executionLive = true;
      signals.push(`the process table: pid ${String(rec.execution.pid)} is live`);
    }
  }
  if (executionEnded && rec.execution !== null && rec.execution.endedAt === null) {
    rec.execution.endedAt = at;
  }
  if (evidence !== "") {
    signals.push("the harness's own output was handed to this observation and is retained");
  }

  // THE STAMP — read off the resource's own card, because a scope grant
  // that lands after it requires a FRESH attempt and this is where that
  // fact is learned rather than typed.
  const stamp = readStamp(rec);
  rec.stamp = { seen: stamp, at };
  signals.push(`the card's stamp in the resource: ${stamp}`);

  const unanswered = rec.questions.filter(
    (q) => q.answer === null || q.answer.state !== "acknowledged",
  );
  const done = fromEvidence.done ?? fromAsk.done;
  const completion = done === "ok" || done === "failed";
  const jobs = ownedJobsAlive(rec, io);

  /** @type {string} */
  let to = rec.state;
  /** @type {string} */
  let why;
  if (completion && executionEnded && jobs.length === 0) {
    to = done === "ok" ? "finished" : "failed";
    why = `completion evidence (${DONE_TOKEN} ${String(done)}) with the execution ended and no owned job left`;
  } else if (completion && !executionEnded) {
    to = unanswered.length > 0 ? "blocked" : "running";
    why =
      `completion evidence is present and the execution has NOT been shown to end, so this is ` +
      "not finished: process exit alone is never finished, and neither is a claim of completion";
  } else if (unanswered.length > 0) {
    to = "blocked";
    why =
      `an unacknowledged question (${unanswered.map((q) => q.id).join(", ")})` +
      (executionEnded ? ", with the execution ended — the ASSIGNMENT is blocked, not finished" : "");
  } else if (executionLive || (evidence !== "" && !executionEnded)) {
    to = "running";
    why = executionLive ? "the execution is live" : "the harness's own output is evidence of execution";
  } else if (executionEnded) {
    to = "unknown";
    why =
      "the execution ended with no completion evidence, so what the assignment did is NOT " +
      "established — process exit alone is never finished";
  } else {
    why = "nothing observed moves this attempt, and a state this arm cannot establish is not invented";
  }
  if (TERMINAL_STATES.includes(rec.state)) {
    to = rec.state;
    why = `already ${rec.state}: a terminal record is read, never re-derived into another outcome`;
  }
  transition(rec, at, "observe", to, why);
  if (TERMINAL_STATES.includes(to) && rec.writer && rec.resource !== null) {
    releaseIfOurs(root, rec, at);
  }
  if (TERMINAL_STATES.includes(to) && rec.outcome === null) {
    rec.outcome = {
      state: to,
      at,
      evidence: [{ at, kind: "observed", detail: why }],
    };
    if (rec.execution !== null) rec.execution.outcome = to;
  }
  writeRecord(root, rec);
  return { record: rec, signals };
}

/**
 * The card's `status:` inside the resource, or `unknown` when it cannot
 * be read. An inability is never rounded into a verdict.
 *
 * @param {RunRecord} rec @returns {string}
 */
function readStamp(rec) {
  if (rec.resource === null || rec.assignment.kind !== "card") return "unknown";
  const dir = path.join(rec.resource, "docs", "tasks");
  if (!existsSync(dir)) return "unknown";
  const prefix = `${rec.assignment.id}-`;
  const file = readdirSync(dir).find((f) => f.startsWith(prefix) && f.endsWith(".md"));
  if (file === undefined) return "unknown";
  const m = /^status:\s*(\S+)\s*$/m.exec(readFileSync(path.join(dir, file), "utf8"));
  return m === null || m[1] === undefined ? "unknown" : m[1];
}

/**
 * Which of the attempt's OWNED jobs are still alive. A job whose kind
 * this arm cannot probe is reported as UNPROBEABLE and counts as alive,
 * because "I could not ask" may never become "it is gone".
 *
 * @param {RunRecord} rec @param {RunIo} io @returns {string[]}
 */
export function ownedJobsAlive(rec, io) {
  /** @type {string[]} */
  const alive = [];
  for (const job of rec.ownedJobs) {
    if (job.kind === "pid") {
      const pid = Number(job.id);
      if (isRecordablePid(pid) && io.identity(pid) !== null) alive.push(`pid ${job.id}`);
      continue;
    }
    if (job.kind === "port") {
      if (io.listening(Number(job.id))) alive.push(`port ${job.id}`);
      continue;
    }
    alive.push(`${job.kind} ${job.id} — this arm has no probe for that kind of job`);
  }
  return alive;
}

/** @param {string} root @param {RunRecord} rec @param {string} at */
function releaseIfOurs(root, rec, at) {
  if (rec.resource === null) return;
  const held = readReservation(root, rec.resource);
  if (held === null || held.attempt !== rec.attempt) return;
  releaseReservation(root, { resource: rec.resource, attempt: rec.attempt });
  rec.reservation.releasedAt = at;
}

/* ────────────────────────────────────────────────────────────────────
 * OPERATION FOUR — SEND.
 * ──────────────────────────────────────────────────────────────────── */

/**
 * The block one answer leaves in the ask file, and the child reads.
 *
 * @param {string} attempt @param {string} questionId @param {string} at @param {string} text
 * @returns {string}
 */
export function answerBlock(attempt, questionId, at, text) {
  return (
    `\n## ANSWER ${questionId} — attempt ${attempt} — ${at}\n\n${text.trim()}\n\n` +
    `When you have read this, write \`${ACK_TOKEN} ${questionId}\` AT THE START OF A LINE in ` +
    "this file. This sentence is not that line: a token is line-initial, so the instruction " +
    "cannot be read back as the answer to itself.\n"
  );
}

/**
 * Write an answer to a question, or record its delivery.
 *
 * **THE THREE STEPS ARE THREE FACTS AND THE ARM NEVER SKIPS ONE.**
 * `written` is this arm's own act, evidenced by the bytes it appended.
 * `delivered` is the harness confirming receipt (native) or the child
 * being handed it as its next prompt (process), and it carries the
 * evidence the caller passes. `acknowledged` is NEVER set here: it comes
 * from the child's own file or the harness's own output through
 * `observe`, because an acknowledgement this arm wrote for itself would
 * be the assumption the card forbids.
 *
 * @param {string} root
 * @param {{ attempt: string, question: string, answer?: string, delivered?: string, at?: string, io?: RunIo }} opts
 * @returns {{ record: RunRecord, wrote: boolean, delivered: boolean }}
 */
export function sendAnswer(root, opts) {
  const io = opts.io ?? defaultRunIo();
  const at = opts.at ?? io.now();
  const rec = readRecord(root, opts.attempt);
  if (rec.state !== "running" && rec.state !== "blocked") {
    throw new RunRecordFinding(
      "SEND_NOT_ANSWERABLE",
      `run-record: attempt ${rec.attempt} is ${rec.state}, and an answer goes to an attempt that ` +
        "is running or blocked. Answering a reserved, finished or stopped attempt writes into a " +
        "channel nobody is reading.",
    );
  }
  refuseGrantAfterStamp(rec, "an answer");
  const id = opts.question.trim();
  if (id === "") {
    throw new RunRecordFinding(
      "SEND_NO_QUESTION",
      "run-record: an answer needs the question id it answers. An answer bound to no question " +
        "cannot be acknowledged, re-delivered or read back.",
    );
  }
  let q = rec.questions.find((entry) => entry.id === id);
  if (q === undefined) {
    q = { id, recordedAt: at, source: "declared at send", answer: null };
    rec.questions.push(q);
  }
  let wrote = false;
  let delivered = false;
  if (opts.answer !== undefined) {
    if (rec.ask === null) {
      throw new RunRecordFinding(
        "SEND_NO_CHANNEL",
        `run-record: attempt ${rec.attempt} has no ask file, so there is nowhere to write an ` +
          "answer. The channel is derived from the brief's own directory at start.",
      );
    }
    const block = answerBlock(rec.attempt, id, at, opts.answer);
    mkdirSync(path.dirname(rec.ask), { recursive: true });
    appendFileSync(rec.ask, block, "utf8");
    q.answer = {
      state: "written",
      writtenAt: at,
      deliveredAt: null,
      acknowledgedAt: null,
      text: opts.answer,
      redeliveries: 0,
      evidence: [
        { at, kind: "written", detail: `${String(block.length)} bytes appended to ${rec.ask}` },
      ],
    };
    wrote = true;
  }
  if (opts.delivered !== undefined) {
    if (q.answer === null) {
      throw new RunRecordFinding(
        "SEND_NOT_WRITTEN",
        `run-record: the answer to ${id} has not been written, so it cannot be delivered. The ` +
          "three steps are three facts and this arm records none of them out of order.",
      );
    }
    q.answer.state = q.answer.state === "acknowledged" ? "acknowledged" : "delivered";
    q.answer.deliveredAt = at;
    q.answer.evidence.push({ at, kind: "delivered", detail: opts.delivered });
    delivered = true;
  }
  if (!wrote && !delivered) {
    throw new RunRecordFinding(
      "SEND_NOTHING",
      "run-record: a send names an answer to write, evidence that it was delivered, or both. A " +
        "send that did neither would move a record without moving anything in the world.",
    );
  }
  const answerState = q.answer === null ? "unanswered" : q.answer.state;
  transition(
    rec,
    at,
    "send",
    "blocked",
    `the answer to ${id} is ${answerState}; the acknowledgement comes from the child's own file ` +
      "or the harness's own output, never from this arm",
  );
  writeRecord(root, rec);
  return { record: rec, wrote, delivered };
}

/**
 * A SCOPE GRANT THAT LANDS AFTER THE STAMP REQUIRES A FRESH ATTEMPT, and
 * this is where that rule is enforced rather than remembered.
 *
 * The record carries the permission boundary's digest as it stood at
 * start. A boundary that has MOVED while the card is stamped is a
 * widening the stamped attempt may not act on — `docs/STATE.md`'s rule
 * that a grant arriving after the stamp is applied by a FRESH executor
 * spawn and never by the seat's hand. A boundary that moved while the
 * stamp is still `building` is the ordinary mid-build widening and
 * passes. An UNREADABLE stamp beside a moved boundary refuses, because
 * the conservative answer is the one that costs a spawn rather than a
 * verdict.
 *
 * @param {RunRecord} rec @param {string} what
 */
function refuseGrantAfterStamp(rec, what) {
  const now = permissionBoundary(rec.assignment.cwd);
  if (now.digest === rec.permission.digest) return;
  if (rec.stamp.seen === "building") return;
  throw new RunRecordFinding(
    "GRANT_AFTER_STAMP",
    `run-record: the permission boundary of ${rec.assignment.cwd} has moved since attempt ` +
      `${rec.attempt} was started, and the card's stamp reads ${rec.stamp.seen} — so ${what} for ` +
      "this attempt is refused. A scope grant that lands after the stamp is applied by a FRESH " +
      "attempt, never by widening one already stamped.",
  );
}

/* ────────────────────────────────────────────────────────────────────
 * OPERATION FIVE — WAIT.
 * ──────────────────────────────────────────────────────────────────── */

/**
 * Wait until this attempt reaches a state the seat can act on, or REPORT
 * the ceiling.
 *
 * **IT RE-OBSERVES; IT NEVER SLEEPS ON A GUESS.** Each poll derives the
 * state again from the world, so the wait ends on a FACT — the three
 * properties of `brief.mjs --await` (a fact, a stated ceiling, a ceiling
 * that is an ANSWER), reused here by running that arm's own loop rather
 * than writing a second one.
 *
 * **A CEILING REACHED IS NEVER `finished`.** The record is left exactly
 * as the last observation derived it, and the result says the wait ended
 * without the fact.
 *
 * @param {string} root
 * @param {{ attempt: string, ceilingMs: number, until?: readonly string[], evidence?: string, at?: string, io?: RunIo }} opts
 * @param {{ now: () => number, sleep: (ms: number) => Promise<void> }} clock
 * @returns {Promise<{ record: RunRecord, satisfied: boolean, ceiling: boolean, waitedMs: number, polls: number, why: string }>}
 */
export async function waitRun(root, opts, clock) {
  const until = opts.until ?? ["blocked", ...TERMINAL_STATES];
  /** @type {RunRecord} */
  let rec = readRecord(root, opts.attempt);
  const plan = {
    kind: /** @type {"state"} */ ("state"),
    target: opts.attempt,
    ceilingMs: opts.ceilingMs,
    intervalMs: AWAIT_INTERVAL_MS,
    what: `attempt ${opts.attempt} to reach ${until.join(" or ")}`,
  };
  const result = await runAwait(plan, {
    now: clock.now,
    sleep: clock.sleep,
    happened: () => {
      rec = observeRun(root, {
        attempt: opts.attempt,
        ...(opts.evidence === undefined ? {} : { evidence: opts.evidence }),
        ...(opts.at === undefined ? {} : { at: opts.at }),
        ...(opts.io === undefined ? {} : { io: opts.io }),
      }).record;
      return until.includes(rec.state);
    },
  });
  return { record: rec, ...result };
}

/* ────────────────────────────────────────────────────────────────────
 * OPERATION SIX — COLLECT.
 * ──────────────────────────────────────────────────────────────────── */

/**
 * Gather the outcome of a terminal attempt — FINISHED, FAILED AND
 * STOPPED ALIKE.
 *
 * **THE FAILED AND STOPPED RUNS ARE THE ONES THIS EXISTS FOR.** A
 * pipeline that collects only its successes loses exactly the evidence
 * the recovery day needed: what a stopped executor had already written,
 * which refs it left, how much budget it spent. `unknown` is a legal
 * usage and a collected `unknown` is worth more than an absent figure.
 *
 * @param {string} root
 * @param {{ attempt: string, usage?: string, ref?: string, report?: string, at?: string, io?: RunIo }} opts
 * @returns {{ record: RunRecord, collected: { state: string, usage: string, refs: string[], report: string, evidence: Evidence[] } }}
 */
export function collectRun(root, opts) {
  const io = opts.io ?? defaultRunIo();
  const at = opts.at ?? io.now();
  const rec = readRecord(root, opts.attempt);
  if (!TERMINAL_STATES.includes(rec.state)) {
    throw new RunRecordFinding(
      "COLLECT_NOT_TERMINAL",
      `run-record: attempt ${rec.attempt} is ${rec.state} and a collect answers for a TERMINAL ` +
        `attempt (${TERMINAL_STATES.join(", ")}). Collecting a run that may still be writing ` +
        "would publish a partial answer as a final one.",
    );
  }
  if (opts.usage !== undefined && opts.usage.trim() !== "") rec.usage = opts.usage.trim();
  if (opts.ref !== undefined && opts.ref.trim() !== "" && !rec.refs.includes(opts.ref.trim())) {
    rec.refs.push(opts.ref.trim());
  }
  if (opts.report !== undefined && opts.report.trim() !== "") rec.report = opts.report.trim();
  else if (rec.report === "none" && rec.ask !== null) {
    const guess = path.join(path.dirname(rec.ask), `report-${rec.assignment.id}.md`);
    if (existsSync(guess)) rec.report = guess;
  }
  if (rec.resource !== null) {
    const head = io.git(rec.resource, ["rev-parse", "HEAD"]);
    if (head !== null && head.trim() !== "" && !rec.refs.includes(head.trim())) rec.refs.push(head.trim());
  }
  const evidence = [
    ...(rec.outcome?.evidence ?? []),
    ...rec.questions.flatMap((q) => q.answer?.evidence ?? []),
  ];
  const collected = {
    state: rec.state,
    usage: rec.usage,
    refs: rec.refs,
    report: rec.report,
    evidence,
  };
  rec.events.push({
    at,
    op: "collect",
    from: rec.state,
    to: rec.state,
    why: `collected: usage ${rec.usage}, ${String(rec.refs.length)} ref(s), report ${rec.report}`,
  });
  writeRecord(root, rec);
  return { record: rec, collected };
}

/* ────────────────────────────────────────────────────────────────────
 * RECONCILIATION — the step before any replacement.
 * ──────────────────────────────────────────────────────────────────── */

/**
 * @typedef {object} Reconciliation
 * @property {"ended" | "live" | "undetermined"} verdict
 * @property {string[]} sources   what each source could and could not say
 * @property {string} why
 */

/**
 * Establish whether an attempt's execution has ENDED, from four sources
 * and never from an assumption.
 *
 * **AN INABILITY MAY NOT BECOME A VERDICT.** Where the sources cannot
 * settle it the answer is `undetermined`, and `undetermined` starts no
 * replacement and releases no resource. That is the asymmetry the card
 * names: no second writer while the first MIGHT exist, and resumption
 * once termination IS established.
 *
 * @param {RunRecord} rec @param {RunIo} io @param {string} [evidence] the seat's own reading of its harness
 * @returns {Reconciliation}
 */
export function reconcile(rec, io, evidence) {
  /** @type {string[]} */
  const sources = [];
  // 1. THE HARNESS'S TASK STATE — not askable from this arm, and said so
  //    rather than guessed at.
  sources.push(
    rec.execution === null
      ? "the harness's task state: nothing is bound to this attempt, so there is no task to ask about"
      : `the harness's task state: ${rec.execution.harnessId} is the seat's to ask about, and this arm cannot`,
  );
  // 2. THE PROCESS TABLE.
  /** @type {"ended" | "live" | "undetermined"} */
  let verdict = "undetermined";
  let why = "no source established that the execution has ended";
  if (rec.execution === null) {
    // **A RESERVED ATTEMPT WITH NO BIND IS THE DANGEROUS ONE, AND IT IS
    // NOT `ended`.** The spawn happens BETWEEN the reservation and the
    // bind, so an unbound record is exactly the case where a child may
    // be running with nothing on disk naming it. Reading that as "no
    // execution was ever started" would authorise a second writer at the
    // one moment the first is invisible — the T-247 race, performed by
    // the reconciliation that exists to prevent it.
    sources.push(
      "the process table: no process identity was ever bound, and the SPAWN happens between the " +
        "reservation and the bind — so this source cannot tell an un-started attempt from a " +
        "running child nothing named",
    );
  } else if (rec.execution.pid === null) {
    sources.push("the process table: a native child has no process identity here to probe");
  } else {
    const identity = io.identity(rec.execution.pid);
    if (identity === null) {
      verdict = "ended";
      why = `pid ${String(rec.execution.pid)} has left the process table`;
      sources.push(`the process table: pid ${String(rec.execution.pid)} is gone`);
    } else if (rec.execution.identity !== null && identity !== rec.execution.identity) {
      verdict = "ended";
      why = `pid ${String(rec.execution.pid)} is live but is a different process, so this execution ended`;
      sources.push(`the process table: pid ${String(rec.execution.pid)} was reused`);
    } else {
      verdict = "live";
      why = `pid ${String(rec.execution.pid)} is live and is this attempt's own execution`;
      sources.push(`the process table: pid ${String(rec.execution.pid)} is live`);
    }
  }
  // 2b. THE RECORD'S OWN HISTORY. A native child has no process to
  //     probe, so the END of its execution is a fact the harness told
  //     the seat and `observe` persisted. Reading it back here is not
  //     circular: it is the same evidence, retained rather than re-asked.
  if (verdict === "undetermined" && rec.execution !== null && rec.execution.endedAt !== null) {
    verdict = "ended";
    why = `this execution's end was recorded at ${rec.execution.endedAt} from the evidence the seat passed`;
    sources.push(`the record itself: the execution ended at ${rec.execution.endedAt}`);
  }
  // 2c. THE SEAT'S OWN READING OF ITS HARNESS, passed in as evidence.
  //     It is the ONLY source that can answer for an unbound attempt or
  //     a native child, because the harness's task list is the seat's to
  //     read and this arm cannot reach it.
  const passed = evidence === undefined ? null : readTokens(evidence).done;
  sources.push(
    passed === null
      ? "the seat's own reading of its harness: none was passed to this reconciliation"
      : `the seat's own reading of its harness: ${DONE_TOKEN} ${passed}`,
  );
  if (verdict === "undetermined" && passed !== null) {
    verdict = "ended";
    why = `the seat read its harness and passed ${DONE_TOKEN} ${passed} for this attempt`;
  }
  // 3. THE LANE'S MARKER — the ask file's own tokens.
  if (rec.ask !== null && existsSync(rec.ask)) {
    const tokens = readTokens(readFileSync(rec.ask, "utf8"));
    sources.push(
      `the lane's marker: the ask file carries ${String(tokens.asks.length)} question(s), ` +
        `${String(tokens.acks.length)} acknowledgement(s) and completion evidence ${tokens.done ?? "absent"}`,
    );
    if (verdict === "undetermined" && tokens.done !== null) {
      verdict = "ended";
      why = `the lane's marker carries ${DONE_TOKEN} ${tokens.done}`;
    }
  } else {
    sources.push("the lane's marker: no ask file, so it says nothing either way");
  }
  // 4. GIT STATE.
  if (rec.resource !== null) {
    const head = io.git(rec.resource, ["rev-parse", "HEAD"]);
    const dirty = io.git(rec.resource, ["status", "--porcelain"]);
    sources.push(
      head === null
        ? `git state: ${rec.resource} could not be asked`
        : `git state: ${rec.resource} is at ${head.trim().slice(0, 12)} and is ` +
          `${dirty === null ? "of unknown cleanliness" : dirty.trim() === "" ? "clean" : "dirty"}`,
    );
  } else {
    sources.push("git state: this participant owns no resource, so there is no tree to read");
  }
  // 5. THE OWNED JOBS — an execution may be gone while what it started
  //    is not, and a replacement started beside those is the same race
  //    one layer down.
  const alive = ownedJobsAlive(rec, io);
  sources.push(
    alive.length === 0
      ? "owned jobs: none of this attempt's own jobs is still alive"
      : `owned jobs STILL ALIVE: ${alive.join(", ")}`,
  );
  if (verdict === "ended" && alive.length > 0) {
    verdict = "undetermined";
    why = `the execution ended and its owned jobs did not: ${alive.join(", ")}`;
  }
  return { verdict, sources, why };
}

/* ────────────────────────────────────────────────────────────────────
 * OPERATION SEVEN — CONTINUE.
 * ──────────────────────────────────────────────────────────────────── */

/**
 * Resume the same attempt, or start an explicit replacement.
 *
 * **EVERY REFUSAL HERE IS THE SAME ONE SEEN FROM A DIFFERENT SIDE**: a
 * second execution must never exist while the first might. So the prior
 * execution is RECONCILED first, the owned jobs must be gone, the
 * reservation is either still ours or is REACQUIRED atomically, and a
 * resource another attempt has taken refuses by name.
 *
 * **A DELIVERED ANSWER THAT WAS NEVER ACKNOWLEDGED IS RE-DELIVERED.**
 * That is the whole reason the three steps are recorded separately: the
 * continuation knows what the child has not confirmed reading.
 *
 * @param {string} root
 * @param {{ attempt: string, replace?: boolean, evidence?: string, at?: string, io?: RunIo, host?: string }} opts
 * @returns {{ record: RunRecord, reconciliation: Reconciliation, redelivered: string[], replaced: ?string }}
 */
export function continueRun(root, opts) {
  const io = opts.io ?? defaultRunIo();
  const at = opts.at ?? io.now();
  const rec = readRecord(root, opts.attempt);
  const reconciliation = reconcile(rec, io, opts.evidence);
  if (reconciliation.verdict !== "ended") {
    throw new RunRecordFinding(
      reconciliation.verdict === "live" ? "CONTINUE_PRIOR_LIVE" : "CONTINUE_UNCERTAIN",
      `run-record: attempt ${rec.attempt} may still be executing — ${reconciliation.why}. A ` +
        "continuation while the prior execution might exist is two writers for one resource, " +
        "which is the race this record exists to close. Reconcile it, then continue.",
    );
  }
  refuseGrantAfterStamp(rec, "a continuation");
  if (rec.execution !== null && rec.execution.endedAt === null) rec.execution.endedAt = at;

  // THE RESERVATION: retained where it was never released, REACQUIRED
  // atomically where it was, and refused where another attempt has it.
  if (rec.writer && rec.resource !== null) {
    const held = readReservation(root, rec.resource);
    if (held === null) {
      takeReservation(root, {
        resource: rec.resource,
        attempt: rec.attempt,
        role: rec.assignment.role,
        at,
        ...(opts.host === undefined ? {} : { host: opts.host }),
      });
      rec.reservation.takenAt = at;
      rec.reservation.releasedAt = null;
    } else if (held.attempt !== rec.attempt) {
      throw new RunRecordFinding(
        "CONTINUE_RESOURCE_TAKEN",
        `run-record: ${rec.resource} is reserved by attempt ${held.attempt} since ${held.takenAt}, ` +
          `so ${rec.attempt} may not resume onto it. The resource moved on while this attempt was ` +
          "down, and a continuation that took it back would be the second writer.",
      );
    }
  }

  /** @type {string[]} */
  const redelivered = [];
  for (const q of rec.questions) {
    if (q.answer === null) continue;
    if (q.answer.state !== "delivered") continue;
    if (rec.ask !== null) {
      appendFileSync(rec.ask, answerBlock(rec.attempt, q.id, at, q.answer.text), "utf8");
    }
    q.answer.redeliveries += 1;
    q.answer.evidence.push({
      at,
      kind: "re-delivered",
      detail: `the acknowledgement never arrived, so the answer to ${q.id} was delivered again on continue`,
    });
    redelivered.push(q.id);
  }

  if (opts.replace === true) {
    const attempt = nextAttemptId(root, rec.assignment.id);
    if (rec.writer && rec.resource !== null) {
      // The replacement inherits the resource, so the reservation moves
      // to it — released from the old attempt and taken for the new one,
      // in that order, so the exclusive create still decides.
      releaseReservation(root, { resource: rec.resource, attempt: rec.attempt });
      takeReservation(root, {
        resource: rec.resource,
        attempt,
        role: rec.assignment.role,
        at,
        ...(opts.host === undefined ? {} : { host: opts.host }),
      });
    }
    transition(rec, at, "continue", rec.state, `replaced by ${attempt}`);
    writeRecord(root, rec);
    /** @type {RunRecord} */
    const fresh = {
      ...rec,
      attempt,
      state: "reserved",
      reservation: { file: rec.reservation.file, takenAt: at, releasedAt: null },
      execution: null,
      history: [...rec.history, ...(rec.execution === null ? [] : [rec.execution])],
      outcome: null,
      replaces: rec.attempt,
      events: [
        {
          at,
          op: "continue",
          from: rec.state,
          to: "reserved",
          why: `an explicit REPLACEMENT of ${rec.attempt}, whose execution was reconciled as ended`,
        },
      ],
    };
    writeRecord(root, fresh);
    return { record: fresh, reconciliation, redelivered, replaced: rec.attempt };
  }

  if (rec.execution !== null) {
    rec.history.push(rec.execution);
    rec.execution = null;
  }
  transition(
    rec,
    at,
    "continue",
    "reserved",
    `the prior execution is reconciled as ended (${reconciliation.why}); the reservation is held ` +
      `and ${String(redelivered.length)} unacknowledged answer(s) were re-delivered — the next bind attaches the resumed execution`,
  );
  writeRecord(root, rec);
  return { record: rec, reconciliation, redelivered, replaced: null };
}

/* ────────────────────────────────────────────────────────────────────
 * OPERATION EIGHT — STOP.
 * ──────────────────────────────────────────────────────────────────── */

/**
 * Record that this attempt's execution and its owned jobs are GONE.
 *
 * **THIS ARM SIGNALS NOTHING, AND THAT IS THE DESIGN RATHER THAN A
 * LIMITATION.** Stopping a native child is the seat's harness stopping
 * that task id; stopping a process child is the adapter's. What no seat
 * may ever do is signal the SHARED HARNESS PROCESS — every other child
 * of this session dies with it — so this arm refuses a target that is
 * this process or its parent by name, and holds no code path that could
 * signal anything at all.
 *
 * **`stopped` IS WRITTEN ONLY AFTER TERMINATION IS ESTABLISHED.** A
 * record that said `stopped` while the process was alive would release
 * the reservation under a live writer.
 *
 * @param {string} root
 * @param {{ attempt: string, evidence?: string, at?: string, io?: RunIo }} opts
 * @returns {{ record: RunRecord, reconciliation: Reconciliation }}
 */
export function stopRun(root, opts) {
  const io = opts.io ?? defaultRunIo();
  const at = opts.at ?? io.now();
  const rec = readRecord(root, opts.attempt);
  const pid = rec.execution?.pid ?? null;
  if (pid !== null && (pid === process.pid || pid === process.ppid)) {
    throw new RunRecordFinding(
      "STOP_SHARED_HARNESS",
      `run-record: attempt ${rec.attempt} names pid ${String(pid)}, which is this command's own ` +
        "process or its parent — the SHARED HARNESS. Stopping it takes down every other child of " +
        "this session, and no stop of one attempt may ever reach it.",
    );
  }
  const reconciliation = reconcile(rec, io, opts.evidence);
  if (reconciliation.verdict !== "ended") {
    throw new RunRecordFinding(
      reconciliation.verdict === "live" ? "STOP_NOT_TERMINATED" : "STOP_UNCERTAIN",
      `run-record: attempt ${rec.attempt} is not established as terminated — ${reconciliation.why}. ` +
        "`stopped` is written only after termination is established: a record that said it while " +
        "the execution was alive would release the reservation under a live writer. The harness's " +
        "own stop for that task id is the seat's act; this arm records it once it has happened.",
    );
  }
  if (rec.execution !== null && rec.execution.endedAt === null) rec.execution.endedAt = at;
  if (rec.execution !== null) rec.execution.outcome = "stopped";
  rec.outcome = {
    state: "stopped",
    at,
    evidence: [
      { at, kind: "termination established", detail: reconciliation.why },
      ...reconciliation.sources.map((s) => ({ at, kind: "reconciliation source", detail: s })),
      ...(opts.evidence === undefined ? [] : [{ at, kind: "stopped", detail: opts.evidence }]),
    ],
  };
  transition(
    rec,
    at,
    "stop",
    "stopped",
    `termination established (${reconciliation.why}); the owned jobs are confirmed gone and the ` +
      "shared harness process was never signalled",
  );
  releaseIfOurs(root, rec, at);
  writeRecord(root, rec);
  return { record: rec, reconciliation };
}

/* ────────────────────────────────────────────────────────────────────
 * THE ARM'S PLAN AND ITS RENDER.
 * ──────────────────────────────────────────────────────────────────── */

/**
 * @typedef {object} RunPlan
 * @property {string} verb
 * @property {string} attempt
 * @property {string} [assignment]
 * @property {string} [harnessId]
 * @property {number} [pid]
 * @property {string} [question]
 * @property {string} [answer]
 * @property {string} [evidence]
 * @property {string} [usage]
 * @property {string} [ref]
 * @property {string} [report]
 * @property {number} [ceilingMs]
 * @property {boolean} [replace]
 */

/**
 * The dials each verb READS, so a dial that means nothing to the verb it
 * was typed beside is refused rather than ignored — the rule the lane
 * and merge arms already hold, applied here.
 */
export const VERB_DIALS = Object.freeze({
  start: ["assignment"],
  bind: ["attempt", "session", "pid"],
  observe: ["attempt", "evidence"],
  send: ["attempt", "question", "answer", "evidence"],
  wait: ["attempt", "ceiling", "evidence"],
  collect: ["attempt", "usage", "ref", "report"],
  continue: ["attempt", "replace", "evidence"],
  stop: ["attempt", "evidence"],
});

/**
 * Validate the invocation, or refuse it. Reads no record and writes
 * nothing.
 *
 * @param {Record<string, string>} opts
 * @param {boolean} replace
 * @returns {RunPlan}
 */
export function runPlan(opts, replace = false) {
  const verb = (opts["run"] ?? "").trim();
  if (!OPERATIONS.includes(verb)) {
    throw new RunRecordFinding(
      "RUN_VERB",
      `run-record: ${JSON.stringify(verb)} is not one of the operations (${OPERATIONS.join(", ")}). ` +
        "Every child runs under the same seven, native or foreign, and a verb outside them is a " +
        "capability this record does not have.",
    );
  }
  const dials = /** @type {Record<string, readonly string[]>} */ (VERB_DIALS)[verb] ?? [];
  const typed = Object.keys(opts).filter((k) => k !== "run" && k !== "root");
  const stray = typed.filter((k) => !dials.includes(k));
  if (replace && !dials.includes("replace")) stray.push("replace");
  if (stray.length > 0) {
    throw new RunRecordFinding(
      "RUN_STRAY_DIAL",
      `run-record: ${stray.map((d) => `--${d}`).join(", ")} mean nothing to \`--run ${verb}\`, ` +
        `which reads ${dials.map((d) => `--${d}`).join(", ") || "no dial but the verb"}. A flag ` +
        "accepted and ignored is a seat believing it said something it did not.",
    );
  }
  if (verb === "start") {
    const assignment = (opts["assignment"] ?? "").trim();
    if (assignment === "") {
      throw new RunRecordFinding(
        "RUN_NO_ASSIGNMENT",
        "run-record: `--run start` needs --assignment <path> — the assignment is ONE document " +
          "naming the work, the resource, the role, the base, the brief, the harness, the model, " +
          "the effort, the working directory, the deadline and the budget. It is a document " +
          "rather than eleven flags because the thing that was missing was a single recoverable " +
          "state, not a shorter command line.",
      );
    }
    return { verb, attempt: "", assignment };
  }
  const attempt = (opts["attempt"] ?? "").trim();
  if (attempt === "") {
    throw new RunRecordFinding(
      "RUN_NO_ATTEMPT",
      `run-record: \`--run ${verb}\` needs --attempt <id>. The attempt id carries its own work, ` +
        "so it is the only thing this arm needs to find the record.",
    );
  }
  workOf(attempt);
  /** @type {RunPlan} */
  const plan = { verb, attempt };
  if (verb === "bind") {
    const session = (opts["session"] ?? "").trim();
    if (session === "") {
      throw new RunRecordFinding(
        "RUN_NO_SESSION",
        "run-record: `--run bind` needs --session <id> — the harness's own task or session id, " +
          "which is what the seat gets back from the spawn and the only handle this arm has on " +
          "a native child.",
      );
    }
    plan.harnessId = session;
    if (opts["pid"] !== undefined) {
      const pid = Number(opts["pid"]);
      if (!Number.isInteger(pid)) {
        throw new RunRecordFinding("RUN_PID", `run-record: ${JSON.stringify(opts["pid"])} is not a pid.`);
      }
      plan.pid = pid;
    }
  }
  if (verb === "send") {
    plan.question = (opts["question"] ?? "").trim();
    if (opts["answer"] !== undefined) plan.answer = textOrFile(opts["answer"]);
    if (opts["evidence"] !== undefined) plan.evidence = textOrFile(opts["evidence"]);
  }
  if (verb === "observe" || verb === "stop" || verb === "continue") {
    if (opts["evidence"] !== undefined) plan.evidence = textOrFile(opts["evidence"]);
  }
  if (verb === "wait") {
    const ceiling = Number((opts["ceiling"] ?? "").trim());
    if (!Number.isFinite(ceiling) || ceiling <= 0) {
      throw new RunRecordFinding(
        "RUN_NO_CEILING",
        "run-record: `--run wait` needs --ceiling <seconds>, and this arm defaults none. A " +
          "ceiling nobody typed is a hang nobody chose.",
      );
    }
    plan.ceilingMs = Math.round(ceiling * 1000);
    if (opts["evidence"] !== undefined) plan.evidence = textOrFile(opts["evidence"]);
  }
  if (verb === "collect") {
    if (opts["usage"] !== undefined) plan.usage = opts["usage"];
    if (opts["ref"] !== undefined) plan.ref = opts["ref"];
    if (opts["report"] !== undefined) plan.report = opts["report"];
  }
  if (verb === "continue") plan.replace = replace;
  return plan;
}

/**
 * A value that may be given inline or read from a file — `@<path>`. An
 * answer and a harness's output are both routinely longer than a command
 * line, and a truncated answer is a wrong answer.
 *
 * @param {string} value @returns {string}
 */
export function textOrFile(value) {
  if (!value.startsWith("@")) return value;
  const file = value.slice(1);
  if (!existsSync(file)) {
    throw new RunRecordFinding(
      "TEXT_FILE_ABSENT",
      `run-record: ${value} names a file to read and there is nothing at ${file}.`,
    );
  }
  return readFileSync(file, "utf8");
}

/**
 * The lines the arm prints. Every figure is a stamped LIVE value — a run
 * record is a fact about a machine at a moment, never a function of a
 * tree, so nothing here carries a commit ref.
 *
 * @param {{ at: string, host: string, root: string }} ctx
 * @param {string} verb
 * @param {RunRecord} rec
 * @param {string[]} extra
 * @returns {import("./dispatch-brief.mjs").Rec[]}
 */
export function runRecs(ctx, verb, rec, extra) {
  const p = liveProv(ctx.at, ctx.host, `run-record.mjs --run ${verb}, over the record it wrote`);
  const q = rec.questions
    .map((entry) => `${entry.id}:${entry.answer === null ? "unanswered" : entry.answer.state}`)
    .join(", ");
  return [
    note("THE RUN RECORD — one attempt, one document, and the same operations for every child"),
    value(`attempt: ${rec.attempt} (${rec.assignment.kind} ${rec.assignment.id}, ${rec.assignment.role})`, p),
    value(`state: ${rec.state}`, p),
    value(
      `resource: ${rec.resource ?? "none — a read-only participant takes no writer reservation"}`,
      p,
    ),
    value(
      `reservation: ${
        rec.reservation.takenAt === null
          ? "none"
          : rec.reservation.releasedAt === null
            ? `held since ${rec.reservation.takenAt}`
            : `released at ${rec.reservation.releasedAt}`
      }`,
      p,
    ),
    value(
      `execution: ${
        rec.execution === null
          ? "none bound"
          : `${rec.execution.harnessId}${rec.execution.pid === null ? "" : ` pid ${String(rec.execution.pid)}`}` +
            `${rec.execution.endedAt === null ? "" : ` ended ${rec.execution.endedAt}`}`
      }`,
      p,
    ),
    value(`questions: ${q === "" ? "none recorded" : q}`, p),
    value(`usage: ${rec.usage}`, p),
    value(`record: ${recordPath(ctx.root, rec.attempt)}`, p),
    ...extra.map((line) => value(line, p)),
  ];
}
