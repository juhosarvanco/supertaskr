/** Qualified executor consumer (T-353). The existing run record, transaction,
 * admission policy and complete reservation remain the only authorities.
 * Dependencies involving the generated parser load before start's transaction.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import * as runs from "./run-record.mjs";
import { NativeCodexFinding, activeNativeHolds, addNativeHold, collectNativeWorkspace, explicitResourceProblem,
  nativeFinalGate, nativeIgnoredSnapshot, nativePathAllowed, nativeSha256, readNativeRecord, withNativeTransaction } from "./native-codex.mjs";
import { qualifiedVerifierAdmission, qualifiedReviewPolicy, validateQualifiedReview, collectQualifiedReviewEvidence, loadQualifiedReviewConsumers } from "./qualified-verification.mjs";
import { validConfiguredDispatchCapsule } from "../../../cli/configured-native-reader.mjs";

/** Loaded only for explicitly qualified calls.
 * @returns {typeof import("./qualified-reservation.mjs")} */
function validator() { return runs.qualifiedValidation(); }
/** Ordinary run-record consumers must load no records/capture modules.
 * @type {typeof import("./qualified-admission.mjs") | undefined} */
let qualifiedAdmission;
/** @type {typeof import("./configured-dispatch.mjs")|undefined} */
let configuredDispatch;
/** Exact backend-created unpublished record only; never serialized or supplied
 * through assignment/options metadata. @type {WeakMap<object,object>} */
const configuredPreparations = new WeakMap();
/** @param {string} root @param {any} rec */
export function configuredPreparationPolicy(root, rec) {
  const handle = configuredPreparations.get(rec);
  if (handle === undefined) return null;
  if (configuredDispatch === undefined) refuse("QUALIFIED_CONFIGURED_PREPARATION");
  const capsule = configuredDispatch.verifyConfiguredDispatch(handle);
  if (realpathSync(root) !== capsule.selection.authorityRoot || !equal(capsule, rec.native?.qualified?.origins?.configuredDispatch)) refuse("QUALIFIED_CONFIGURED_PREPARATION");
  return { capsuleDigest: capsule.digest, schemaText: configuredDispatch.configuredDispatchSchema(handle).text };
}
async function preloadAdmission() {
  return qualifiedAdmission ??= await import("./qualified-admission.mjs");
}
function admission() {
  if (qualifiedAdmission === undefined) refuse("QUALIFIED_ADMISSION_NOT_LOADED");
  return qualifiedAdmission;
}
/** @param {string} code @returns {never} */
function refuse(code) { throw new NativeCodexFinding(code, `${code}: qualified executor refused; retained ownership is not widened`); }
/** @param {any} value */
function copy(value) { return JSON.parse(JSON.stringify(value)); }
/** @param {any} left @param {any} right */
function equal(left, right) { return validator().qualifiedContent(left) === validator().qualifiedContent(right); }
/** @param {any} value @param {string[]} required @param {string[]} [optional] */
function shape(value, required, optional = []) {
  if (!value || typeof value !== "object" || Array.isArray(value) || required.some((key) => !Object.hasOwn(value, key)) ||
      Object.keys(value).some((key) => ![...required, ...optional].includes(key))) refuse("QUALIFIED_ASSIGNMENT_SHAPE");
}
/** Assignment data never supplies a fence; its receipt is an equality assertion.
 * @param {any} value */
export function qualifiedAssignment(value) {
  shape(value, ["version", "authorityRoot", "projectId", "revisions", "taskId", "legacyTokenMap", "receipt", "workers"], ["verification"]);
  if (value.version !== 1) refuse("QUALIFIED_ASSIGNMENT_VERSION");
  shape(value.revisions, ["product", "records"]);
  if (!Array.isArray(value.workers) || value.workers.length === 0) refuse("QUALIFIED_ASSIGNMENT_WORKERS");
  if (value.verification !== undefined) shape(value.verification, ["executorAttempt", "preparationDigest"]);
  for (const worker of value.workers) shape(worker, ["role", "checkout", "base"], value.verification === undefined ? [] : ["candidate"]);
  return copy(value);
}
/** Explicit translation preserves the legacy implementation meaning; no
 * unknown value can silently become repair or explicit product authority.
 * @param {any} a @param {string} boundary @param {string|null} attempt */
function request(a, boundary, attempt = null) {
  const legacy = a.admission ?? { kind: "explicit", parent: "", evidence: "", scope: "repair" };
  const scopes = /** @type {Record<string, string>} */ ({ implementation: "product-change", "product-change": "product-change", repair: "repair", "waived-verification": "waived-verification" });
  if (!Object.hasOwn(scopes, legacy.scope) || Object.keys(legacy).some((key) => !["kind", "parent", "evidence", "scope"].includes(key))) refuse("QUALIFIED_SCOPE_UNMAPPED");
  const q = qualifiedAssignment(a.qualified);
  const verifier = q.verification !== undefined;
  if (a.kind !== "card" || a.id !== q.taskId || a.role !== (verifier ? "verifier" : "executor") || a.harness !== "codex-desktop-native" ||
      !a.native || !(verifier ? a.native.profile === "detached-verifier" : [undefined, "writer-resource"].includes(a.native.profile)) || a.resource === "none" ||
      a.resource !== a.cwd) refuse("QUALIFIED_EXECUTOR_ONLY");
  return { version: 1, authorityRoot: q.authorityRoot, projectId: q.projectId, revisions: q.revisions, taskId: q.taskId,
    roles: q.workers.map(/** @param {any} worker */ (worker) => worker.role), legacyTokenMap: q.legacyTokenMap,
    admission: { boundary, role: a.role, kind: legacy.kind, parent: legacy.parent, evidence: legacy.evidence, scope: scopes[legacy.scope], attempt } };
}
/** @param {string} root @param {string[]} args */
function git(root, args) { return execFileSync("git", ["--no-replace-objects", "-C", root, ...args], {
  encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 16 * 1024 * 1024,
  env: { ...process.env, GIT_NO_LAZY_FETCH: "1", GIT_OPTIONAL_LOCKS: "0" },
}).trim(); }
/** Permission digest anchors all immutable native authority, including output
 * policy. Mutable receipt/binding history is deliberately outside this value.
 * @param {any} q */
function commitment(q) { return nativeSha256(validator().qualifiedContent({ reservation: q.reservation, ignored: q.ignored, origins: q.origins,
  ...(q.verification === undefined ? {} : { verification: q.verification }) })); }
/** @param {string} root @param {any} rec @param {boolean} [requireHeld] */
export function validateQualifiedNative(root, rec, requireHeld = true) {
  const q = rec.native.qualified;
  shape(q, ["reservation", "identity", "ignored", "origins"], ["collection", "verification"]);
  if (rec.assignmentDigest !== runs.sha256(JSON.stringify(rec.assignment)) || rec.permission.digest !== commitment(q)) refuse("QUALIFIED_RETAINED_AUTHORITY_CHANGED");
  if (Object.hasOwn(q.origins, "configuredDispatch") && !validConfiguredDispatchCapsule(q.origins.configuredDispatch)) refuse("QUALIFIED_CONFIGURED_CAPSULE_SHAPE");
  if (rec.native.profile !== (q.verification === undefined ? "writer-resource" : "detached-verifier")) refuse("QUALIFIED_RETAINED_PHASE_CHANGED");
  if (!equal(q.origins.launch, rec.assignment.native) || rec.native.launch.taskName !== q.origins.launch.taskName ||
      rec.native.launch.sessionId !== q.origins.launch.sessionId || !rec.native.launch.coordinatorTurnIds.includes(q.origins.launch.coordinatorTurnId)) refuse("QUALIFIED_LAUNCH_AUTHORITY_CHANGED");
  const scope = validator().validateQualifiedReservation(q.reservation, root, rec.attempt);
  if (!equal({ ...qualifiedAssignment(rec.assignment.qualified), attempt: rec.attempt }, q.reservation.request) ||
      q.reservation.identity !== q.identity || q.reservation.scope.authorityRoot !== realpathSync(root)) refuse("QUALIFIED_RETAINED_AUTHORITY_CHANGED");
  if (requireHeld) {
    const file = runs.qualifiedReservationPath(root, rec.attempt, q.identity);
    if (!existsSync(file) || !equal(JSON.parse(readFileSync(file, "utf8")), q.reservation)) refuse("QUALIFIED_RESERVATION_CHANGED");
  }
  validateQualifiedReview(rec);
  return scope;
}
/** @param {string} root @param {any} a @param {string} boundary */
export function qualifiedAdmissionAt(root, a, boundary) {
  const input = request(a, boundary);
  if (realpathSync(root) !== realpathSync(input.authorityRoot)) refuse("QUALIFIED_AUTHORITY_HOME");
  return admission().decisiveQualifiedAdmission(input, null, false, a.resource).admission();
}
/** Only qualified start is asynchronous. Every await precedes the decisive
 * transaction; its body is synchronous all the way through publication.
 * @param {string} root @param {any} opts */
export async function startQualifiedNativeRun(root, opts) {
  try { return await startQualifiedNativeRunImpl(root, opts); }
  catch (error) { const code = /** @type {any} */ (error).code ?? "QUALIFIED_START_REFUSED";
    throw new NativeCodexFinding(code, `${code}: qualified native start refused`); }
}
/** Strict product entry. Legacy direct start remains compatibility; missing
 * PRODUCT settings/binding/TOOL cannot fall back through this constructor.
 * @param {string} root @param {any} opts */
export async function startConfiguredQualifiedNativeRun(root, opts) {
  const a = copy(opts.assignment); request(a, "child-start");
  configuredDispatch ??= await import("./configured-dispatch.mjs");
  const q = a.qualified, handle = configuredDispatch.captureConfiguredDispatch({ authorityRoot: root, projectId: q.projectId, revisions: q.revisions, taskId: q.taskId, legacyTokenMap: q.legacyTokenMap });
  return startQualifiedNativeRun(root, { ...opts, assignment: a, configuredDispatch: handle });
}
/** @param {string} root @param {any} opts */
async function startQualifiedNativeRunImpl(root, opts) {
  const a = copy(opts.assignment);
  const input = request(a, "child-start");
  if (realpathSync(root) !== realpathSync(input.authorityRoot)) refuse("QUALIFIED_AUTHORITY_HOME");
  await runs.loadQualifiedReservations();
  await preloadAdmission();
  if (a.qualified.verification !== undefined) await loadQualifiedReviewConsumers();
  if (opts.configuredDispatch !== undefined) configuredDispatch ??= await import("./configured-dispatch.mjs");
  const earlier = opts.configuredDispatch === undefined ? await admission().admissionPreflight(input) : await admission().configuredAdmissionPreflight(input, opts.configuredDispatch);
  // Testable boundary: the actual transaction's acquisition hook can change
  // inputs here; the decisive recapture below must detect that change.
  return withNativeTransaction(root, { operation: "qualified-run-start", ...(opts.transaction ?? {}) }, () => {
    if (!equal(a, opts.assignment)) refuse("QUALIFIED_ADMISSION_INPUT_CHANGED");
    const prepared = a.qualified.verification === undefined ? null : qualifiedVerifierAdmission(root, a, opts.configuredDispatch);
    if (prepared?.entry.consumedBy != null) {
      const prior = runs.readRecord(root, prepared.entry.consumedBy);
      if (prior.assignmentDigest !== runs.sha256(JSON.stringify(a)) || prior.native?.qualified?.verification?.digest !== prepared.entry.digest) refuse("QUALIFIED_PREPARATION_CONSUMED");
      if (runs.qualifiedPhasePolicy(root, prior).consumed) refuse("QUALIFIED_REVIEW_ADMISSION_NOT_REUSED");
      return { record: prior, file: runs.recordPath(root, prior.attempt), reservation: prior.native?.qualified.reservation, repeated: true };
    }
    const preview = opts.configuredDispatch === undefined ? admission().decisiveQualifiedAdmission(input, earlier, false, a.resource) : admission().decisiveConfiguredAdmission(input, earlier, opts.configuredDispatch, false, a.resource);
    if (prepared !== null && preview.admission().consumed) refuse("QUALIFIED_REVIEW_ADMISSION_NOT_REUSED");
    if (!equal(preview.receipt, a.qualified.receipt)) refuse("QUALIFIED_RECEIPT_CHANGED");
    if (!existsSync(a.brief)) refuse("QUALIFIED_BRIEF_ABSENT");
    const attempt = runs.nextAttemptId(root, a.id), at = opts.at ?? new Date().toISOString();
    const acquisition = { ...a.qualified, attempt };
    const scope = validator().deriveQualifiedScope(acquisition);
    const primary = scope.workers.find((worker) => worker.roles.includes("product")) ?? scope.workers[0];
    if (!primary || a.resource !== primary.identity.filesystemRoot || a.base !== (primary.initialHead ?? primary.base)) refuse("QUALIFIED_PRIMARY_WORKER");
    const capsule = opts.configuredDispatch === undefined ? null : /** @type {NonNullable<typeof configuredDispatch>} */ (configuredDispatch).configuredDispatchStartCapsule(opts.configuredDispatch, root, a, preview);
    const ignored = scope.workers.map((worker) => ({ root: worker.identity.filesystemRoot,
      policy: [...a.native.ignoredOutputs, ...(worker.identity.filesystemRoot === realpathSync(root) ? [".supertaskr"] : [])], baseline: [] }));
    for (const worker of scope.workers) {
      if (git(worker.identity.filesystemRoot, ["status", "--porcelain", "--untracked-files=all"]) !== "" ||
          nativeIgnoredSnapshot(worker.identity.filesystemRoot, ignored.find((entry) => entry.root === worker.identity.filesystemRoot)?.policy ?? []).length !== 0) refuse("QUALIFIED_ADMISSION_DIRTY");
    }
    const taken = runs.acquireQualifiedReservationSync(root, acquisition, { at, host: opts.host });
    if (taken.repeated) refuse("QUALIFIED_ORPHAN_REQUIRES_RECONCILIATION");
    const q = { reservation: taken.reservation, identity: taken.reservation.identity, ignored, origins: {
      receipt: preview.receipt, grant: preview.grant, scope: preview.scope, admission: copy(input.admission), launch: copy(a.native), bases: copy(a.qualified.workers),
      ...(capsule === null ? {} : { configuredDispatch: capsule }),
    }, ...(prepared === null ? {} : { verification: { authority: prepared.entry.authority, digest: prepared.entry.digest, seal: prepared.entry.seal } }) };
    const brief = { path: a.brief, digest: runs.sha256(readFileSync(a.brief, "utf8")) };
    const rec = /** @type {any} */ ({ version: runs.RECORD_VERSION, attempt, state: "reserved", assignment: a,
      assignmentDigest: runs.sha256(JSON.stringify(a)), writer: true, resource: a.resource,
      reservation: { file: taken.file, takenAt: at, releasedAt: null }, brief,
      permission: { kind: "qualified-captured-scope", manifest: null, digest: commitment(q), paths: scope.fence.paths.length },
      ask: path.join(path.dirname(a.brief), `ask-${a.id}.md`), execution: null, history: [], questions: [], ownedJobs: a.ownedJobs ?? [],
      outcome: null, usage: "unknown", instants: { ...(a.instants ?? {}), started: at }, refs: [], report: "none",
      stamp: { seen: "unknown", at }, replaces: null, events: [{ at, op: "start", from: "reserved", to: "reserved", why: "canonical complete set acquired before native preparation and attempt publication" }],
      admission: preview.admission(), refusal: null, retry: null,
      native: { version: 1, profile: prepared === null ? "writer-resource" : "detached-verifier", authorityRoot: root, qualified: q,
        launch: { taskName: a.native.taskName, sessionId: a.native.sessionId, coordinatorTurnIds: [a.native.coordinatorTurnId] },
        preparedAt: at, start: null, probes: [], binding: null, inflight: [], receipts: [], holds: [], stopObservations: [], interruptObservations: [], outputs: [],
        coverage: { tools: ["Bash", "apply_patch"], callbacks: ["SubagentStart", "PreToolUse", "PostToolUse", "SubagentStop", "UserPromptSubmit", "Interrupt"] },
        disclosure: "registered callbacks and Bash/apply_patch only; exact root prefixes and cumulative inspection of all owned checkouts; no OS/read isolation or arbitrary shell-write confinement" } });
    if (opts.configuredDispatch !== undefined) configuredPreparations.set(rec, opts.configuredDispatch);
    try {
      if (prepared !== null) {
        prepared.entry.consumedBy = attempt;
        runs.writeRecord(root, prepared.source);
      }
      const check = inspectQualifiedWorkspace(rec, {});
      if (!check.clean) refuse("QUALIFIED_PREPARATION_CHANGED");
      const file = runs.writeRecord(root, rec);
      return { record: rec, file, reservation: taken.reservation };
    } catch (error) {
      // If publication succeeded but its durability acknowledgement failed,
      // retain the complete discoverable set rather than release a live record.
      if (!existsSync(runs.recordPath(root, attempt)) && !taken.repeated && prepared === null) runs.releaseQualifiedReservationSync(root, { attempt, expectedIdentity: q.identity });
      throw error;
    } finally { configuredPreparations.delete(rec); }
  });
}
/** @param {any} rec @param {any} event */
export function qualifiedResourceProblem(rec, event) {
  const roots = rec.native.qualified.reservation.scope.workers.map(/** @param {any} worker */ (worker) => worker.identity.filesystemRoot);
  if (event.tool_name === "Bash") return roots.some(/** @param {string} root */ (root) => explicitResourceProblem(event, root) === null) ? null : "Bash must explicitly prefix one admitted physical root";
  if (event.tool_name === "apply_patch") {
    const command = event.tool_input?.command;
    if (typeof command !== "string") return "missing patch";
    const targets = command.split(/\r?\n/).filter(/** @param {string} line */ (line) => /^\*\*\* (?:(?:Add|Update|Delete) File|Move to): /.test(line));
    return targets.length > 0 && targets.every(/** @param {string} line */ (line) => roots.some(/** @param {string} root */ (root) => {
      if (explicitResourceProblem({ tool_name: "apply_patch", tool_input: { command: line } }, root) !== null) return false;
      const target = path.resolve(line.slice(line.indexOf(": ") + 2));
      const worker = rec.native.qualified.reservation.scope.workers.find(/** @param {any} entry */ (entry) => entry.identity.filesystemRoot === root);
      const domains = qualifiedWorkerDomains(rec, worker);
      if (!nativePathAllowed(path.relative(root, target).replaceAll("\\", "/"), domains)) return false;
      for (let at = target; at !== root; at = path.dirname(at)) {
        try { if (realpathSync(at) !== at) return false; }
        catch (error) { if (/** @type {any} */ (error).code !== "ENOENT") return false; }
      }
      return true;
    })) ? null : "every patch target must name a canonical confined admitted domain";
  }
  return "unsupported qualified action";
}
/** Candidate pairs are role-qualified even when roles alias one checkout.
 * @param {any} rec @param {string|undefined} ref */
function candidates(rec, ref) {
  let value;
  try { value = JSON.parse(ref ?? "null"); } catch { refuse("QUALIFIED_CANDIDATES_REQUIRED"); }
  const roles = rec.native.qualified.reservation.request.workers.map(/** @param {any} worker */ (worker) => worker.role);
  shape(value, roles);
  if (Object.values(value).some((commit) => !validator().isQualifiedCommitId(commit, "sha1"))) refuse("QUALIFIED_CANDIDATES_REQUIRED");
  for (const worker of rec.native.qualified.reservation.scope.workers) if (new Set(worker.roles.map(/** @param {string} role */ (role) => value[role])).size !== 1) refuse("QUALIFIED_ALIAS_CANDIDATE");
  return value;
}
/** Use the existing raw-diff/type/mode/rename/ignored checker per physical
 * checkout, unioning colocated domains. No synthetic manifest grants scope.
 * @param {any} rec @param {any} opts
 * @returns {{clean: boolean, head: null, base: null, participants: any[], tracked: any[], untracked: any[], findings: any[]}} */
export function inspectQualifiedWorkspace(rec, opts) {
  const q = rec.native.qualified, scope = validateQualifiedNative(rec.native.authorityRoot, rec, opts.requireHeld !== false);
  runs.qualifiedPhasePolicy(rec.native.authorityRoot, rec);
  const refs = opts.expectedRef === undefined ? null : candidates(rec, opts.expectedRef);
  const checks = scope.workers.map((worker) => {
    const root = worker.identity.filesystemRoot;
    const domains = qualifiedWorkerDomains(rec, worker);
    const policy = q.ignored.find(/** @param {any} entry */ (entry) => entry.root === root);
    const local = { ...rec, resource: root, assignment: { ...rec.assignment, base: worker.initialHead ?? worker.base }, native: { ...rec.native, profile: "writer-resource", qualified: undefined,
      fence: { qualifiedPhysical: true, paths: domains }, ignoredOutputs: policy.policy, ignoredBaseline: policy.baseline } };
    const check = collectNativeWorkspace(local, { qualifiedPhysical: true, final: opts.final, ...(refs === null ? {} : { expectedRef: refs[worker.roles[0]] }) });
    if (opts.final && (check.untracked.length > 0 || check.tracked.some((entry) => ["staged", "unstaged"].includes(entry.layer)))) check.findings.push({ code: "qualified-workspace-dirty" });
    check.clean = check.findings.length === 0;
    return { root, roles: worker.roles, ...check };
  });
  return { clean: checks.every((check) => check.clean), head: null, base: null, participants: checks,
    tracked: checks.flatMap((check) => check.tracked.map((entry) => ({ ...entry, root: check.root }))),
    untracked: checks.flatMap((check) => check.untracked.map((entry) => ({ ...entry, root: check.root }))),
    findings: checks.flatMap((check) => check.findings.map((entry) => ({ ...entry, root: check.root }))) };
}
/** @param {any} rec @param {any} worker */
function qualifiedWorkerDomains(rec, worker) {
  const q = rec.native.qualified;
  if (q.verification !== undefined) {
    const policy = qualifiedReviewPolicy(q.verification.authority, worker.roles);
    return [...policy.implementation, ...policy.protocol];
  }
  return [...new Set(q.reservation.scope.fence.paths.filter(/** @param {any} e */ (e) => worker.roles.includes(e.role)).map(/** @param {any} e */ (e) => e.domain))];
}
/** Requests remain evidence and a non-clearable hold; answers are no grant.
 * @param {any} rec @param {string} text @param {string} at */
export function qualifiedExpansionHold(rec, text, at) {
  if (rec.native?.qualified && /(?:expand|widen|scope|fence)/i.test(text)) addNativeHold(rec, {
    key: `qualified-expansion:${nativeSha256(text)}`, code: "qualified-expansion-unsupported", request: text, recordedAt: at });
}
/** @param {string} root @param {any} rec @param {string} at */
export function releaseQualifiedRun(root, rec, at) {
  validateQualifiedNative(root, rec);
  runs.releaseQualifiedReservationSync(root, { attempt: rec.attempt, expectedIdentity: rec.native.qualified.identity });
  rec.reservation.releasedAt = at;
}
/** Persist the named refusal even when a non-tool lifecycle boundary cannot
 * validate its retained ownership. No caller-supplied path repairs authority.
 * @param {string} root @param {any} rec @param {string} phase */
export function validateQualifiedOperation(root, rec, phase) {
  try { const scope = validateQualifiedNative(root, rec); runs.qualifiedPhasePolicy(root, rec); return scope; }
  catch (error) {
    addNativeHold(rec, { key: `qualified-authority:${phase}`, code: "qualified-authority-changed", recordedAt: new Date().toISOString(), phase });
    runs.writeRecord(root, rec);
    throw error;
  }
}
/** Re-entry also loads all asynchronous inputs before the decisive transaction.
 * @param {string} root @param {any} opts */
export async function prepareQualifiedNativeContinuation(root, opts) {
  const before = runs.readRecord(root, opts.attempt);
  await runs.loadQualifiedReservations();
  await preloadAdmission();
  const earlier = await admission().admissionPreflight(request(before.assignment, "child-start"));
  return withNativeTransaction(root, { operation: "qualified-run-continue" }, () => {
    const rec = runs.readRecord(root, opts.attempt);
    if (rec.assignmentDigest !== before.assignmentDigest) refuse("QUALIFIED_RETAINED_AUTHORITY_CHANGED");
    return continueQualifiedNativeRun(root, rec, { ...opts, earlier });
  });
}
/** Continue/replacement are new native turns under the original exact set.
 * Replacement changes the native identity, never the reservation owner.
 * @param {string} root @param {any} rec @param {any} opts */
export function continueQualifiedNativeRun(root, rec, opts) {
  const io = opts.io ?? runs.defaultRunIo(), at = opts.at ?? io.now();
  validateQualifiedOperation(root, rec, "continue");
  if (rec.native.qualified.collection) refuse("QUALIFIED_ALREADY_COLLECTING");
  const reconciliation = runs.reconcile(rec, io, opts.evidence);
  if (reconciliation.verdict !== "ended") refuse("QUALIFIED_PRIOR_NOT_CEASED");
  const final = nativeFinalGate(rec, { phase: "continue", expectedRef: opts.ref, at, lifecycleReconciled: true, aliveJobs: runs.ownedJobsAlive(rec, io) });
  if (!final.eligible) { runs.writeRecord(root, rec); refuse("QUALIFIED_CONTINUE_HELD"); }
  const preview = admission().decisiveQualifiedAdmission(request(rec.assignment, opts.replace ? "replacement" : "re-entry", rec.attempt), opts.earlier, true, rec.resource);
  rec.admission = preview.admission();
  if (rec.execution) { rec.execution.endedAt ??= at; rec.history.push(rec.execution); }
  rec.execution = null; rec.outcome = null; rec.state = "reserved";
  rec.native.turnHistory = [...(rec.native.turnHistory ?? []), { start: rec.native.start, binding: rec.native.binding, probes: rec.native.probes, replacement: opts.replace === true, at }];
  rec.native.start = null; rec.native.binding = null; rec.native.probes = [];
  rec.events.push({ at, op: "continue", from: "unknown", to: "reserved", why: "original complete set retained; current policy reread; exact new native turn binding required before delivery" });
  runs.writeRecord(root, rec);
  return { record: rec, reconciliation, redelivered: [], replaced: opts.replace ? rec.attempt : null };
}
/** A collection intent is durable before release; an interrupted intent is
 * rechecked and can release only its exact original set. A finalized retry
 * returns history without reading workspaces or touching any later owner.
 * @param {string} root @param {any} rec @param {any} opts */
export function collectQualifiedNativeRun(root, rec, opts) {
  const q = rec.native.qualified, refs = candidates(rec, opts.ref);
  if (q.collection?.phase === "final") {
    if (rec.assignmentDigest !== runs.sha256(JSON.stringify(rec.assignment)) || rec.permission.digest !== commitment(q) ||
        q.collection.identity !== q.identity || !equal(q.collection.result.refs, Object.entries(q.collection.candidates).map(([role, commit]) => `${role}:${commit}`)) ||
        (q.collection.review !== undefined && (q.collection.reviewDigest !== nativeSha256(validator().qualifiedContent(q.collection.review)) ||
          !equal(q.collection.review, q.collection.result.review) || q.collection.resultDigest !== nativeSha256(validator().qualifiedContent(q.collection.result))))) refuse("QUALIFIED_RETAINED_AUTHORITY_CHANGED");
    if (!equal(refs, q.collection.candidates) || (opts.report !== undefined && opts.report !== rec.report)) refuse("QUALIFIED_COLLECTION_RETRY_CHANGED");
    return { record: rec, collected: q.collection.result };
  }
  if (rec.state !== "finished" || rec.execution?.endedAt == null || !rec.outcome?.evidence?.some(/** @param {any} entry */ (entry) => entry.kind === "observed")) refuse("QUALIFIED_ACTUAL_FINAL_REQUIRED");
  const io = opts.io ?? runs.defaultRunIo(), at = opts.at ?? io.now();
  // A crash after release but before its final record is not authority to
  // reacquire. The intent pins both the exact set and candidate pair.
  const originalFile = runs.qualifiedReservationPath(root, rec.attempt, q.identity);
  const releasedIntent = q.collection?.phase === "ready" && !existsSync(originalFile);
  let publicationExpected = copy(rec);
  if (releasedIntent) {
    validateQualifiedNative(root, rec, false);
    if (q.verification !== undefined) runs.reconcileQualifiedReleasedSet(root, q.reservation);
    if (!equal(refs, q.collection.candidates) || rec.native.inflight.length !== 0 || activeNativeHolds(rec).length > 0 || runs.ownedJobsAlive(rec, io).length > 0 ||
        !inspectQualifiedWorkspace(rec, { requireHeld: false, expectedRef: opts.ref, final: true }).clean ||
        (q.verification !== undefined && (!equal(collectQualifiedReviewEvidence(rec, refs), q.collection.review) ||
          q.collection.reviewDigest !== nativeSha256(validator().qualifiedContent(q.collection.review))))) refuse("QUALIFIED_COLLECTION_RETRY_CHANGED");
  } else {
    const final = nativeFinalGate(rec, { phase: "collect", expectedRef: opts.ref, at,
      lifecycleReconciled: true, aliveJobs: runs.ownedJobsAlive(rec, io) });
    if (!final.eligible) { runs.writeRecord(root, rec); refuse("QUALIFIED_COLLECT_HELD"); }
    const review = q.verification === undefined ? undefined : collectQualifiedReviewEvidence(rec, refs);
    q.collection = { phase: "ready", candidates: refs, identity: q.identity, final,
      ...(review === undefined ? {} : { review, reviewDigest: nativeSha256(validator().qualifiedContent(review)) }) };
    runs.writeRecord(root, rec);
    const latest = readNativeRecord(root, rec.attempt);
    if (!equal(latest, rec) || !inspectQualifiedWorkspace(rec, { expectedRef: opts.ref, final: true }).clean || runs.ownedJobsAlive(rec, io).length > 0) refuse("QUALIFIED_LATE_CHANGE");
    publicationExpected = copy(rec);
    releaseQualifiedRun(root, rec, at);
  }
  rec.reservation.releasedAt = at;
  rec.native.collection = { ...q.collection.final, ref: opts.ref };
  rec.refs = Object.entries(refs).map(([role, commit]) => `${role}:${commit}`);
  rec.usage = opts.usage ?? rec.usage; rec.report = opts.report ?? rec.report;
  const result = { state: rec.state, usage: rec.usage, refs: rec.refs, report: rec.report, evidence: rec.outcome.evidence,
    ...(q.collection.review === undefined ? {} : { review: q.collection.review }) };
  q.collection = { ...q.collection, phase: "final", result, resultDigest: nativeSha256(validator().qualifiedContent(result)), releasedAt: at };
  rec.events.push({ at, op: "collect", from: rec.state, to: rec.state, why: "every qualified candidate retained; complete exact set released" });
  runs.writeRecord(root, rec, q.verification === undefined ? undefined : () => {
    if (!equal(readNativeRecord(root, rec.attempt), publicationExpected) || activeNativeHolds(rec).length > 0 ||
        runs.ownedJobsAlive(rec, io).length > 0 || !inspectQualifiedWorkspace(rec, { requireHeld: false, expectedRef: opts.ref, final: true }).clean) refuse("QUALIFIED_COLLECTION_PUBLICATION_CHANGED");
    runs.reconcileQualifiedReleasedSet(root, q.reservation);
  });
  return { record: rec, collected: result };
}
