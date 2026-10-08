/**
 * Exact native transaction fault recovery (T-351-s1).
 *
 * Public v1 request: {version:1,id,fault:{id,source,rawDigest},targets:[
 * {attempt,resource,candidate,mode,record:{content,digest},reservation:null|
 * {content,digest},binding,bindingDigest,origins}],authorization:null|{id,digest},
 * sequence?:{version:1,index:0|1}}. An independently recorded authorization may
 * contain a complete two-step ordered policy; this never authorizes subsets
 * without that exact policy or discharges intervening ordinary lifecycle holds.
 * nativeRecoveryTarget reads the pins; recoverNativeTransaction independently
 * reloads every source. Authorization is a separate owner record, never text in
 * this request. The CLI is: --root <authority-root> --request <JSON-file>.
 * A durable immutable intent precedes any target effect. Each target contains
 * its disposition and hold resolution in one atomic record replacement. The
 * intent's progress is replayable from exact resulting record bytes, including
 * a crash between that replacement and the progress write.
 */
import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync, realpathSync, lstatSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  NativeCodexFinding, activeNativeHolds, atomicJson,
  collectNativeWorkspace, nativeRecordPath, nativeSha256,
  nativeTransactionFaultPath, nativeTransactionRefusalDir, readNativeRecord, withNativeTransaction,
  syncNativeFileNamespace,
} from "./native-codex.mjs";
import { STATES, admissionAt, allRecords, defaultRunIo, ownedJobsAlive, readRecord, readReservation, readTokens, reconcile, reservationPath } from "./run-record.mjs";
import { holderVerdict } from "./checkout-currency.mjs";

export const NATIVE_RECOVERY_VERSION = 1;
const digest = nativeSha256;
const json = (/** @type {any} */ v) => `${JSON.stringify(v, null, 2)}\n`;
const object = (/** @type {any} */ v) => v !== null && typeof v === "object" && !Array.isArray(v);
const same = (/** @type {any} */ a, /** @type {any} */ b) => canonical(a) === canonical(b);
/** @param {any} v @returns {string} */
function canonical(v) {
  if (Array.isArray(v)) return `[${v.map(canonical).join(",")}]`;
  if (object(v)) return `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${canonical(v[k])}`).join(",")}}`;
  return JSON.stringify(v);
}
/** @param {string} code @param {string} why @returns {never} */
function refuse(code, why) { throw new NativeCodexFinding(`NATIVE_RECOVERY_${code}`, `native-recovery: ${why}`); }
/** @param {any} v */
function validDigest(v) { return typeof v === "string" && /^[0-9a-f]{64}$/.test(v); }
/** @param {any} v */
function validId(v) { return typeof v === "string" && /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(v); }
/** ENOENT alone is observed absence. lstat never hides or follows a link.
 * @param {string} file @param {"file"|"directory"} kind @param {string} [code]
 */
function physicalEntry(file, kind, code = "EVIDENCE") {
  let entry;
  try { entry = lstatSync(file); }
  catch (error) {
    if (/** @type {any} */ (error).code === "ENOENT") return null;
    return refuse(code, `physical authority cannot be inspected: ${file}`);
  }
  if (kind === "file" ? !entry.isFile() : !entry.isDirectory())
    refuse(code, `physical authority is not a regular ${kind}: ${file}`);
  return entry;
}
/** Inspect each control-directory component, including a missing final parent.
 * A followed parent link must not turn an invalid namespace into valid evidence.
 * @param {string} root @param {string} dir @param {string} [code]
 */
function authorityDirectory(root, dir, code = "EVIDENCE") {
  const rel = path.relative(root, dir);
  if (rel === ".." || rel.startsWith(`..${path.sep}`) || path.isAbsolute(rel)) refuse(code, "authority directory escapes its root");
  let current = root, entry = physicalEntry(root, "directory", code);
  for (const part of rel.split(path.sep).filter(Boolean)) {
    current = path.join(current, part);
    entry = physicalEntry(current, "directory", code);
    if (entry === null) return null;
  }
  return entry;
}
/** @param {string} root @param {string} file */
function authorityFile(root, file) {
  authorityDirectory(root, path.dirname(file));
  return physicalEntry(file, "file");
}
/** @param {string} root @param {string} file */
function authorityBytes(root, file) {
  authorityFile(root, file);
  return bytes(file);
}
/** @param {string} root @param {string} file */
function optionalAuthorityBytes(root, file) {
  return authorityFile(root, file) === null ? null : bytes(file);
}
/** @param {string} file */
function bytes(file) {
  try {
    if (physicalEntry(file, "file") === null) throw new Error("missing file");
    const raw = readFileSync(file), text = raw.toString("utf8");
    if (!raw.equals(Buffer.from(text, "utf8"))) throw new Error("invalid UTF-8");
    return text;
  } catch { return refuse("EVIDENCE", `evidence is missing, unreadable or not valid UTF-8: ${file}`); }
}
/** @param {string} raw @param {string} label @returns {any} */
function parse(raw, label) {
  try { return JSON.parse(raw); } catch { return refuse("EVIDENCE", `${label} is malformed`); }
}
/** @param {string} resource @param {string[]} args */
function git(resource, args) {
  const r = spawnSync("git", ["-C", resource, ...args], { encoding: "utf8" });
  if (r.error !== undefined || r.status !== 0) refuse("ORIGINS", `candidate Git origin cannot be checked: ${resource}`);
  return r.stdout.trim();
}
/** @param {string} root @param {any} rec */
function origins(root, rec) {
  if (typeof rec.resource !== "string" || !path.isAbsolute(rec.resource) || realpathSync(rec.resource) !== rec.resource ||
      rec.assignment.resource !== rec.resource || rec.assignment.cwd !== rec.resource ||
      realpathSync(git(rec.resource, ["rev-parse", "--show-toplevel"])) !== rec.resource) refuse("ORIGINS", "resource origins disagree");
  return { authorityRoot: realpathSync(root), resource: rec.resource, base: rec.assignment.base,
    gitDir: realpathSync(git(rec.resource, ["rev-parse", "--absolute-git-dir"])),
    commonDir: realpathSync(path.resolve(rec.resource, git(rec.resource, ["rev-parse", "--git-common-dir"]))),
    assignmentDigest: rec.assignmentDigest, briefDigest: rec.brief.digest };
}
/** Read-only target pin constructor. It grants no recovery authority.
 * @param {string} root @param {string} attempt @param {string} candidate
 * @param {"collected-source" | "failed-no-work" | "terminal"} mode
 */
export function nativeRecoveryTarget(root, attempt, candidate, mode) {
  const content = authorityBytes(root, nativeRecordPath(root, attempt));
  authorityFile(root, `${nativeRecordPath(root, attempt)}.native-hold`);
  const rec = readNativeRecord(root, attempt);
  bytes(rec.assignment.brief);
  const file = reservationPath(root, rec.resource);
  const reservation = optionalAuthorityBytes(root, file);
  return { attempt, resource: rec.resource, candidate, mode,
    record: { content, digest: digest(content) },
    reservation: reservation === null ? null : { content: reservation, digest: digest(reservation) },
    binding: rec.native.binding, bindingDigest: digest(JSON.stringify(rec.native.binding)), origins: origins(root, rec) };
}
/** @param {string} root @param {any} request */
function validateRequest(root, request) {
  if (!object(request) || request.version !== 1 || !validId(request.id) || !object(request.fault) ||
      !validDigest(request.fault.id) || !validDigest(request.fault.rawDigest) ||
      !["raw-ledger-v1", "recorded-refusal-json-v1"].includes(request.fault.source) ||
      (request.fault.source === "recorded-refusal-json-v1" && (typeof request.fault.reference !== "string" || !path.isAbsolute(request.fault.reference))) || !Array.isArray(request.targets) || request.targets.length === 0 ||
      new Set(request.targets.map((/** @type {any} */ t) => t.attempt)).size !== request.targets.length) refuse("REQUEST", "invalid versioned exact request");
  for (const t of request.targets) {
    if (!object(t) || !/^([A-Za-z0-9][A-Za-z0-9._-]{0,127})-a\d+$/.test(t.attempt) ||
        typeof t.resource !== "string" || !path.isAbsolute(t.resource) || typeof t.candidate !== "string" || !/^[0-9a-f]{40}$/.test(t.candidate) ||
        !["collected-source", "failed-no-work", "terminal"].includes(t.mode) ||
        !object(t.record) || typeof t.record.content !== "string" || !validDigest(t.record.digest) || digest(t.record.content) !== t.record.digest ||
        (t.reservation !== null && (!object(t.reservation) || typeof t.reservation.content !== "string" || digest(t.reservation.content) !== t.reservation.digest)) ||
        !object(t.binding) || !validDigest(t.bindingDigest) || digest(JSON.stringify(t.binding)) !== t.bindingDigest ||
        !object(t.origins) || t.origins.authorityRoot !== root) refuse("REQUEST", "target identity or expected authority is malformed");
  }
  if (request.sequence !== undefined && (!object(request.sequence) || request.sequence.version !== 1 ||
      ![0, 1].includes(request.sequence.index) || request.targets.length !== 1 ||
      !same(Object.keys(request.sequence).sort(), ["index", "version"]))) refuse("SEQUENCE", "invalid explicit sequence step");
  if (request.authorization !== null && (!object(request.authorization) || !validId(request.authorization.id) ||
      !validDigest(request.authorization.digest))) refuse("REQUEST", "authorization must be a pinned reference");
}
/** @param {string} root @param {any} request */
function loadFault(root, request) {
  const raw = request.fault.source === "recorded-refusal-json-v1" ? bytes(request.fault.reference) : null;
  const refusal = raw === null ? null : parse(raw, "preserved recorded refusal");
  if (raw !== null && (refusal.version !== 1 || json(refusal) !== raw)) refuse("FAULT", "unsupported recorded refusal encoding");
  const fault = raw === null ? parse(authorityBytes(root, nativeTransactionFaultPath(root, request.fault.id)), "raw fault ledger") :
    { version: 1, id: refusal.id, rawDigest: digest(raw), rawContent: raw, refusal };
  if (fault.version !== 1 || fault.id !== request.fault.id || fault.rawDigest !== request.fault.rawDigest ||
      typeof fault.rawContent !== "string" || digest(fault.rawContent) !== fault.rawDigest ||
      !same(parse(fault.rawContent, "raw refusal"), fault.refusal) || fault.refusal.id !== fault.id ||
      fault.refusal.code !== "native-transaction-refusal" || fault.refusal.outcome !== "unknown") refuse("FAULT", "exact raw fault evidence changed");
  return fault;
}
/** @param {string} root @param {any} request @param {any} fault */
function authorization(root, request, fault) {
  const requester = fault.refusal.requester;
  const target = request.targets[0];
  if (requester?.attribution === "recorded-binding" && validDigest(requester.recordDigest) &&
      requester.event?.agentId === target.binding.agentId && requester.event?.turnId === target.binding.startTurnId &&
      requester.event?.sessionId === parse(target.record.content, "expected requester").native.launch.sessionId && request.targets.length === 1 &&
      requester.attempt === target.attempt && requester.resource === target.resource && requester.bindingDigest === target.bindingDigest &&
      same(requester.binding, target.binding) && request.sequence === undefined) return { attribution: "recorded-binding", reference: null };
  if (requester?.attribution === "recorded-binding") refuse("TARGET_SCOPE", "an attributable fault cannot be broadened or rebound by legacy authorization");
  if (request.authorization === null) return refuse("LEGACY_UNATTRIBUTED", "legacy-unattributed: exact independently recorded owner authorization is required");
  const file = path.join(root, ".supertaskr", "native-recovery-authorizations", `${request.authorization.id}.json`);
  const raw = authorityBytes(root, file);
  const a = parse(raw, "owner authorization");
  const identities = request.targets.map((/** @type {any} */ t) => ({ attempt: t.attempt, resource: t.resource, candidate: t.candidate, bindingDigest: t.bindingDigest }));
  if (digest(raw) !== request.authorization.digest || a.version !== 1 || a.id !== request.authorization.id ||
      a.authorityRoot !== root || a.authorizedBy !== "owner" || a.recordedBy !== "coordinator" ||
      typeof a.recordedAt !== "string" || !Number.isFinite(Date.parse(a.recordedAt)) ||
      a.attribution !== "legacy-unattributed" || a.disposition !== "resolve-exact-native-transaction-refusal" ||
      !same(a.fault, request.fault) || !object(a.evidenceReference) ||
      typeof a.evidenceReference.path !== "string" || !path.isAbsolute(a.evidenceReference.path) ||
      !validDigest(a.evidenceReference.digest) || typeof a.evidenceReference.quote !== "string" || a.evidenceReference.quote.trim() === "" ||
      realpathSync(a.evidenceReference.path) === realpathSync(file)) refuse("AUTHORIZATION", "separately recorded exact owner authorization differs");
  if (request.sequence === undefined) {
    if (a.sequence !== undefined || !same(a.targets, identities)) refuse("AUTHORIZATION", "unsequenced authorization requires the complete exact target set");
  } else {
    const sequence = a.sequence;
    if (!object(sequence) || sequence.version !== 1 || !Array.isArray(sequence.steps) || sequence.steps.length !== 2 ||
        !Array.isArray(a.targets) || a.targets.length !== 2 ||
        new Set(sequence.steps.map((/** @type {any} */ step) => step.requestId)).size !== 2 ||
        new Set(a.targets.map((/** @type {any} */ t) => t.attempt)).size !== 2) refuse("SEQUENCE", "complete ordered owner policy is missing or malformed");
    for (let i = 0; i < 2; i++) {
      const step = sequence.steps[i];
      if (!object(step) || !validId(step.requestId) || !object(step.target) ||
          typeof step.target.attempt !== "string" || !/^([A-Za-z0-9][A-Za-z0-9._-]{0,127})-a[1-9]\d*$/.test(step.target.attempt) ||
          typeof step.target.resource !== "string" || !path.isAbsolute(step.target.resource) ||
          typeof step.target.candidate !== "string" || !/^[0-9a-f]{40}$/.test(step.target.candidate) || !validDigest(step.target.bindingDigest) ||
          step.target.mode !== (i === 0 ? "collected-source" : "failed-no-work") ||
          !same(a.targets[i], { attempt: step.target.attempt, resource: step.target.resource, candidate: step.target.candidate, bindingDigest: step.target.bindingDigest }) ||
          !["collected-source", "failed-no-work", "terminal"].includes(step.target.mode) || !object(step.target.origins) || step.target.origins.authorityRoot !== root) {
        refuse("SEQUENCE", "ordered policy differs from the complete binding-qualified owner target set");
      }
      validateRequest(root, { version: 1, id: step.requestId, fault: request.fault, targets: [step.target], authorization: request.authorization });
    }
    const step = sequence.steps[request.sequence.index];
    if (step.requestId !== request.id || !same(sequenceIdentity(step.target), sequenceIdentity(target)) ||
        (request.sequence.index === 0 && !same(step.target, target))) refuse("SEQUENCE", "request identity, order or frozen target differs from the owner policy");
  }
  const evidence = bytes(a.evidenceReference.path);
  if (digest(evidence) !== a.evidenceReference.digest || !evidence.includes(a.evidenceReference.quote)) refuse("AUTHORIZATION", "owner ruling provenance changed or does not carry the exact quoted grant");
  return { attribution: "legacy-unattributed", reference: { id: a.id, digest: digest(raw) }, record: a };
}
/** The policy pins frozen identities; each step separately pins fresh physical
 * record/reservation bytes after any independent ordinary reconciliation.
 * @param {any} target
 */
function sequenceIdentity(target) {
  return { attempt: target.attempt, resource: target.resource, candidate: target.candidate,
    bindingDigest: target.bindingDigest, mode: target.mode, origins: target.origins };
}
/** Derive the only possible published record from immutable intent. This same
 * derivation checks predecessor evidence and the current step's crash replay.
 * @param {any} intent @param {number} i
 */
function resultingRecord(intent, i) {
  const request = intent.request, target = request.targets[i];
  const prior = parse(target.record.content, "expected record");
  const disposition = { version: 1, requestId: request.id, fingerprint: intent.fingerprint, target: i, at: intent.at,
    fault: intent.fault, attribution: intent.authorization.attribution, authorization: intent.authorization,
    priorRecordDigest: target.record.digest, check: intent.checks[i].check, mode: target.mode, outcome: "unknown", actualIndependentCheck: true };
  const hold = prior.native.holds.find((/** @type {any} */ h) => h.key === `native-transaction-refusal:${request.fault.id}`);
  if (!hold) refuse("INTENT", "immutable target intent lacks named hold");
  hold.clearedAt = intent.at; hold.clearedBy = `exact recovery ${request.id}`;
  hold.disposition = { requestId: request.id, fingerprint: intent.fingerprint, target: i };
  prior.native.transactionDispositions = [...(prior.native.transactionDispositions ?? []), disposition];
  return prior;
}
/** Previous steps are independently discoverable, complete exact outcomes,
 * never caller declarations or terminal status. Replay the earlier request to
 * repair a crash before its progress publication before advancing the sequence.
 * @param {string} root @param {any} request @param {any} fault @param {any} auth
 */
function checkSequence(root, request, fault, auth) {
  if (request.sequence === undefined) return;
  for (let i = 0; i < request.sequence.index; i++) {
    const step = auth.record.sequence.steps[i];
    const file = nativeRecoveryIntentPath(root, step.requestId);
    const intent = parse(authorityBytes(root, file), "previous sequence intent");
    const previous = intent.request;
    validateRequest(root, previous);
    if (intent.version !== 1 || previous.id !== step.requestId || !same(previous.sequence, { version: 1, index: i }) ||
        !same(previous.targets[0], step.target) || !same(previous.fault, request.fault) ||
        !same(previous.authorization, request.authorization) || intent.fingerprint !== digest(canonical(previous)) ||
        !same(intent.fault, fault) || !same(intent.authorization, auth) || !same(intent.completed, [0]) ||
        !Array.isArray(intent.checks) || intent.checks.length !== 1 || !object(intent.checks[0]) ||
        !Number.isFinite(Date.parse(intent.at))) refuse("SEQUENCE_PRIOR", "earlier exact step is absent, changed or not genuinely complete");
    // Recheck the immutable original request and entire owner record, then the
    // exact result, current jobs, reservation, origins, scope and policy.
    if (!same(authorization(root, previous, fault), auth)) refuse("SEQUENCE_PRIOR", "earlier owner policy changed");
    const after = json(resultingRecord(intent, 0));
    const checked = checkTarget(root, previous, { ...previous.targets[0], record: { content: after, digest: digest(after) } }, fault, true);
    if (!same(checked, intent.checks[0])) refuse("SEQUENCE_PRIOR", "earlier checked physical or policy evidence changed");
    syncNativeFileNamespace(nativeRecordPath(root, step.target.attempt));
    syncNativeFileNamespace(file);
  }
}
/** Current policy checks, called again inside the transaction before each write.
 * @param {string} root @param {any} rec
 */
function policy(root, rec) {
  const admission = admissionAt(root, rec.assignment, "re-entry", { resource: rec.resource });
  const seat = holderVerdict({ root });
  if (["held", "unknown", "unreadable"].includes(seat.state)) refuse("SEAT", `coordinator seat is ${seat.state}`);
  return { admission, seat };
}
/** @param {any} rec */
function ceased(rec) {
  const n = rec.native, e = rec.execution, b = n.binding;
  // Continue preserves the original outcome. The current bound execution's
  // observation is its cessation evidence, independently read by reconcile.
  const completion = rec.state === "finished" ? "ok" : rec.state === "failed" ? "failed" : null;
  if (!b || e?.harnessId !== b.agentId || e.endedAt == null || e.pid !== null ||
      n.start?.agentId !== b.agentId || n.start?.turnId !== b.startTurnId || b.childReportedThreadId !== b.agentId ||
      b.canonicalTaskName !== n.launch.taskName || typeof b.agentId !== "string" || b.agentId.trim() === "" ||
      !Number.isFinite(Date.parse(b.boundAt)) || Date.parse(e.boundAt) < Date.parse(b.boundAt) || n.probes.length !== 1 ||
      !n.probes.some((/** @type {any} */ p) => p.agentId === b.agentId &&
        p.turnId === b.startTurnId && p.toolUseId === b.identityProbeToolUseId && Number.isFinite(Date.parse(p.postAt)) &&
        Date.parse(p.postAt) <= Date.parse(b.boundAt) && p.reportedThreadId === b.agentId) ||
      completion === null || !Number.isFinite(Date.parse(e.boundAt)) || !Number.isFinite(Date.parse(e.endedAt)) || Date.parse(e.endedAt) < Date.parse(e.boundAt) ||
      !rec.events.some((/** @type {any} */ event) => event.op === "observe" && event.to === rec.state && event.at === e.endedAt &&
        event.why === `completion evidence (RUN-DONE ${completion}) with the execution ended and no owned job left`) ||
      n.inflight.length !== 0) refuse("CESSATION", "genuine native cessation or complete binding is unproven");
  jobsCeased(rec);
  if (reconcile(rec, defaultRunIo()).verdict !== "ended") refuse("CESSATION", "public lifecycle reconciliation does not establish cessation");
}
/** Physical probes stay conservative independently of the lifecycle marker.
 * @param {any} rec
 */
function jobsCeased(rec) {
  if (!Array.isArray(rec.ownedJobs)) refuse("JOBS", "owned jobs are malformed");
  for (const job of rec.ownedJobs) {
    if (!object(job) || typeof job.id !== "string" || !/^[1-9]\d*$/.test(job.id)) refuse("JOBS", "owned job identity is malformed");
    if (job.kind === "pid") {
      const pid = Number(job.id);
      if (!Number.isSafeInteger(pid)) refuse("JOBS", "owned job PID is unknown");
      try { process.kill(pid, 0); refuse("JOBS", "owned job process remains live"); }
      catch (error) { if (/** @type {any} */ (error).code !== "ESRCH") throw error; }
    } else if (job.kind === "port") {
      const port = Number(job.id);
      if (!Number.isInteger(port) || port < 1 || port > 65535) refuse("JOBS", "owned job port is unknown");
      const r = spawnSync("lsof", ["-nP", `-iTCP:${port}`, "-sTCP:LISTEN"], { encoding: "utf8" });
      if (r.error || r.status !== 1 || r.stdout.trim() !== "") refuse("JOBS", "owned job port is live or unprobeable");
    } else refuse("JOBS", "owned job kind is unprobeable");
  }
  if (ownedJobsAlive(rec, defaultRunIo()).length !== 0) refuse("JOBS", "owned jobs remain live or unknown");
}
/** A foreign record is never modified or released by recovery. Public stop
 * may genuinely reconcile an unbound launch; its complete dated evidence,
 * rather than null fields or terminal status, establishes that cessation.
 * @param {any} rec
 */
function foreignCeased(rec) {
  try {
    if (["finished", "failed"].includes(rec.state)) { ceased(rec); return true; }
    if (rec.state !== "stopped" || rec.outcome?.state !== "stopped" ||
        !Number.isFinite(Date.parse(rec.outcome.at)) || rec.native.inflight.length !== 0) return false;
    if (rec.execution !== null && (rec.execution.endedAt !== rec.outcome.at ||
        !Number.isFinite(Date.parse(rec.execution.boundAt)) || Date.parse(rec.execution.boundAt) > Date.parse(rec.outcome.at))) return false;
    const termination = rec.outcome.evidence.find((/** @type {any} */ e) => e.kind === "termination established" && e.at === rec.outcome.at && typeof e.detail === "string" && e.detail !== "");
    const evidence = rec.outcome.evidence.find((/** @type {any} */ e) => e.kind === "stopped" && e.at === rec.outcome.at && typeof e.detail === "string" && readTokens(e.detail).done === "gone");
    if (!termination || !evidence || !rec.events.some((/** @type {any} */ e) => e.op === "stop" && e.to === "stopped" && e.at === rec.outcome.at &&
        e.why === `termination established (${termination.detail}); the owned jobs are confirmed gone and the shared harness process was never signalled`)) return false;
    jobsCeased(rec);
    return reconcile(rec, defaultRunIo(), evidence.detail).verdict === "ended";
  } catch { return false; }
}
/** Independently load every physical record before ownership can be excluded.
 * A malformed record is unknown authority, never an absent writer.
 * @param {string} root
 */
function checkedRecoveryRecords(root) {
  const dir = path.join(root, ".supertaskr", "runs");
  if (authorityDirectory(root, dir, "FOREIGN") === null) refuse("FOREIGN", "physical run authority is absent or not a directory");
  const records = [];
  for (const work of readdirSync(dir)) {
    if (work === "reservations") continue;
    const workDir = path.join(dir, work);
    if (physicalEntry(workDir, "directory", "FOREIGN") === null) refuse("FOREIGN", "physical run namespace is absent");
    for (const name of readdirSync(workDir)) {
      if (!name.endsWith(".json")) continue;
      const file = path.join(workDir, name);
      if (physicalEntry(file, "file", "FOREIGN") === null) refuse("FOREIGN", "physical run authority is absent");
      const rec = parse(bytes(file), "physical run authority");
      if (!object(rec) || rec.version !== 1 || typeof rec.attempt !== "string" ||
          rec.attempt !== name.slice(0, -5) || !/^([A-Za-z0-9][A-Za-z0-9._-]{0,127})-a[1-9]\d*$/.test(rec.attempt) || !rec.attempt.startsWith(`${work}-a`) ||
          typeof rec.writer !== "boolean" || !object(rec.assignment) || typeof rec.assignment.id !== "string" || rec.assignment.id === "" ||
          typeof rec.assignment.resource !== "string" || rec.writer !== (rec.assignment.resource !== "none") ||
          rec.assignmentDigest !== `sha256:${digest(JSON.stringify(rec.assignment))}` ||
          !STATES.includes(rec.state) ||
          !Array.isArray(rec.ownedJobs) ||
          !(rec.writer ? (typeof rec.resource === "string" && path.isAbsolute(rec.resource) &&
            rec.resource === path.resolve(rec.assignment.resource)) : rec.resource === null)) {
        refuse("FOREIGN", "physical run authority is malformed or unsupported");
      }
      records.push(rec);
    }
  }
  return records;
}

/** The resolved arm is internal: its caller first proves exact resulting bytes
 * from the immutable intent. It still rechecks every physical and policy source.
 * @param {string} root @param {any} request @param {any} target @param {any} fault @param {boolean} [resolved]
 */
function checkTarget(root, request, target, fault, resolved = false) {
  const raw = authorityBytes(root, nativeRecordPath(root, target.attempt));
  if (raw !== target.record.content) refuse("RECORD", `expected record changed for ${target.attempt}`);
  const rec = /** @type {any} */ (readRecord(root, target.attempt));
  if (!same(readNativeRecord(root, target.attempt), rec)) refuse("OTHER_HOLD", "emergency authority hold remains");
  if (rec.attempt !== target.attempt || rec.resource !== target.resource || rec.writer !== true ||
      rec.native.authorityRoot !== root || !same(rec.native.binding, target.binding) ||
      !same(origins(root, rec), target.origins) || rec.assignmentDigest !== `sha256:${digest(JSON.stringify(rec.assignment))}` ||
      rec.brief.digest !== `sha256:${digest(bytes(rec.assignment.brief))}`) refuse("IDENTITY", "binding, assignment, brief or origins changed");
  const reservationFile = reservationPath(root, rec.resource);
  const reservationRaw = optionalAuthorityBytes(root, reservationFile);
  if (reservationRaw !== (target.reservation?.content ?? null)) refuse("RESERVATION", "expected reservation changed");
  const held = readReservation(root, rec.resource);
  if (reservationRaw !== null && (held === null || held.attempt !== rec.attempt || held.resource !== rec.resource)) refuse("FOREIGN", "reservation is malformed or foreign");
  if (checkedRecoveryRecords(root).some((other) => other.attempt !== rec.attempt && other.writer && other.resource === rec.resource &&
      !foreignCeased(other))) refuse("FOREIGN", "another live or unknown writer owns this resource");
  ceased(rec);
  const holds = activeNativeHolds(rec);
  const hold = (resolved ? rec.native.holds : holds).find((/** @type {any} */ h) => h.key === `native-transaction-refusal:${request.fault.id}`);
  if (!hold || hold.code !== "native-transaction-refusal" || !same(hold.refusal, fault.refusal) || hold.outcome !== "unknown") refuse("HOLD", "named exact unknown hold is absent or changed");
  if (holds.length !== (resolved ? 0 : 1)) refuse("OTHER_HOLD", "another active hold remains; it cannot be discharged by this request");
  const collection = rec.native.collection;
  if (target.mode === "collected-source" && (rec.state !== "finished" || !collection || collection.eligible !== true ||
      collection.actualIndependentCheck !== true || collection.phase !== "collect" || collection.inflight?.length !== 0 || collection.ref !== target.candidate || collection.check?.head !== target.candidate ||
      collection.check?.clean !== true || collection.holds?.length !== 0 || collection.ownedJobs?.length !== 0 ||
      collection.terminalStateAuthority !== "T-311" || !Number.isFinite(Date.parse(collection.checkedAt)) ||
      !rec.refs.includes(target.candidate) || !rec.events.some((/** @type {any} */ e) => e.op === "collect" && e.to === "finished" && e.at === collection.checkedAt))) refuse("COLLECTION", "earlier genuine exact collection is missing");
  // Failed review may contain actual read/probe callbacks. No implementation
  // work means its admitted candidate is unchanged, not that history is empty.
  if (target.mode === "failed-no-work" && (rec.state !== "failed" || collection != null ||
      target.candidate !== rec.assignment.base)) refuse("NO_WORK", "failed no-work evidence differs");
  const check = collectNativeWorkspace(rec, { expectedRef: target.candidate, final: true });
  if (!check.clean || check.untracked.length !== 0 || check.tracked.some((/** @type {any} */ e) => ["staged", "unstaged"].includes(e.layer))) refuse("WORKSPACE", "candidate is changed, dirty or out of scope");
  if (target.mode === "collected-source" && !same(collection.check, check)) refuse("COLLECTION", "historical collection scope differs from the independently checked exact candidate");
  return { check, policy: policy(root, rec) };
}
/** @param {string} root @param {string} id */
export function nativeRecoveryIntentPath(root, id) {
  if (!validId(id)) refuse("REQUEST", "invalid recovery identifier");
  return path.join(root, ".supertaskr", "runs", "reservations", "native-transaction-recoveries", `${id}.json`);
}
/** Public exact operation; optional boundary observers are synchronous test instrumentation.
 * @param {string} root @param {any} request
 * @param {{ onBoundary?: (name:string, index:number) => void }} [opts]
 */
export function recoverNativeTransaction(root, request, opts = {}) {
  root = realpathSync(root);
  request = parse(JSON.stringify(request), "request");
  validateRequest(root, request);
  const fingerprint = digest(canonical(request));
  const intentFile = nativeRecoveryIntentPath(root, request.id);
  const noPendingFaults = () => {
    const rawSidecars = nativeTransactionRefusalDir(root);
    authorityDirectory(root, path.dirname(intentFile));
    if (authorityDirectory(root, rawSidecars) !== null && readdirSync(rawSidecars).some((name) => name.endsWith(".json"))) refuse("PENDING_FAULT", "unabsorbed raw faults remain; normal ledger absorption must finish first");
    if (request.targets.some((/** @type {any} */ t) => authorityFile(root, `${nativeRecordPath(root, t.attempt)}.native-hold`) !== null)) refuse("OTHER_HOLD", "an unabsorbed emergency hold remains on a selected target");
  };
  noPendingFaults();
  return withNativeTransaction(root, { operation: "native-transaction-disposition", onAcquired: noPendingFaults }, () => {
    noPendingFaults();
    const fault = loadFault(root, request);
    const auth = authorization(root, request, fault);
    checkSequence(root, request, fault, auth);
    let intentRaw = optionalAuthorityBytes(root, intentFile);
    let intent = intentRaw === null ? null : parse(intentRaw, "recovery intent");
    const checkIntent = () => {
      if (authorityBytes(root, intentFile) !== intentRaw) refuse("INTENT", "physical immutable intent changed before publication");
    };
    if (intent !== null && (intent.version !== 1 || intent.fingerprint !== fingerprint || !same(intent.request, request))) refuse("IDENTIFIER_REUSED", "immutable request identifier was reused with different content");
    if (intent !== null && (!same(intent.fault, fault) || !same(intent.authorization, auth) || !Array.isArray(intent.completed) ||
        intent.completed.some((/** @type {any} */ i) => !Number.isInteger(i) || i < 0 || i >= request.targets.length) ||
        new Set(intent.completed).size !== intent.completed.length || !Array.isArray(intent.checks) || intent.checks.length !== request.targets.length)) refuse("INTENT", "durable intent evidence is malformed or changed");
    if (intent !== null) syncNativeFileNamespace(intentFile);
    if (intent === null) {
      const checks = request.targets.map((/** @type {any} */ t) => checkTarget(root, request, t, fault));
      opts.onBoundary?.("before-intent", -1);
      // Recheck after the instrumentation boundary and immediately before intent visibility.
      request.targets.forEach((/** @type {any} */ t, /** @type {number} */ i) => {
        noPendingFaults();
        if (!same(checkTarget(root, request, t, loadFault(root, request)).check, checks[i].check)) refuse("WORKSPACE", "candidate changed before intent");
      });
      checkSequence(root, request, loadFault(root, request), authorization(root, request, loadFault(root, request)));
      if (authorityFile(root, intentFile) !== null) refuse("INTENT", "recovery intent appeared before its initial publication");
      intent = { version: 1, fingerprint, request, at: new Date().toISOString(), fault, authorization: auth, checks, completed: [] };
      atomicJson(intentFile, intent); intentRaw = json(intent);
      opts.onBoundary?.("intent", -1);
    }
    for (let i = 0; i < request.targets.length; i++) {
      const target = request.targets[i];
      const prior = resultingRecord(intent, i);
      const after = json(prior);
      const current = authorityBytes(root, nativeRecordPath(root, target.attempt));
      if (current === after) {
        noPendingFaults();
        const currentFault = loadFault(root, request);
        checkSequence(root, request, currentFault, authorization(root, request, currentFault));
        const checked = checkTarget(root, request, { ...target, record: { content: after, digest: digest(after) } }, currentFault, true);
        if (!same(checked.check, intent.checks[i].check) || !same(checked.policy, intent.checks[i].policy)) refuse("WORKSPACE", "checked candidate identity changed during exact replay");
        checkIntent();
        syncNativeFileNamespace(nativeRecordPath(root, target.attempt));
        if (!intent.completed.includes(i)) { intent.completed.push(i); atomicJson(intentFile, intent); intentRaw = json(intent); opts.onBoundary?.("progress", i); }
        continue;
      }
      if (intent.completed.includes(i)) refuse("RESULT_CHANGED", `completed target ${target.attempt} changed after disposition`);
      opts.onBoundary?.("before-target", i);
      noPendingFaults();
      const currentFault = loadFault(root, request);
      checkSequence(root, request, currentFault, authorization(root, request, currentFault));
      const checked = checkTarget(root, request, target, currentFault);
      if (!same(checked.check, intent.checks[i].check) || !same(checked.policy, intent.checks[i].policy)) refuse("WORKSPACE", "checked candidate identity changed after intent");
      checkIntent();
      atomicJson(nativeRecordPath(root, target.attempt), prior);
      opts.onBoundary?.("target", i);
      noPendingFaults(); checkIntent();
      intent.completed.push(i); atomicJson(intentFile, intent); intentRaw = json(intent);
      opts.onBoundary?.("progress", i);
    }
    return { version: 1, id: request.id, fingerprint, state: "complete", completed: [...intent.completed], intentFile };
  });
}
/** @param {string[]} argv */
export function main(argv) {
  if (argv.length !== 4 || argv[0] !== "--root" || argv[2] !== "--request") { process.stderr.write("usage: --root <authority-root> --request <JSON-file>\n"); return 2; }
  try {
    const result = recoverNativeTransaction(/** @type {string} */ (argv[1]), parse(bytes(/** @type {string} */ (argv[3])), "request"));
    process.stdout.write(`${JSON.stringify(result)}\n`); return 0;
  } catch (error) { process.stderr.write(`${/** @type {any} */ (error).code ?? "NATIVE_RECOVERY_ERROR"}: ${String(error)}\n`); return 1; }
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) process.exitCode = main(process.argv.slice(2));
