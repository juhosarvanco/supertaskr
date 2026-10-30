/** Complete-set detached review (T-354). This is a consumer of the existing
 * run record, reservation and policy; there is no second ledger or lock.
 * Parser/reviewer dependencies load only for an explicit preparation.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import { validConfiguredDispatchCapsule } from "../../../cli/configured-native-reader.mjs";
import * as runs from "./run-record.mjs";
import { activeNativeHolds, atomicJson, collectNativeWorkspace, NativeCodexFinding, nativeIgnoredSnapshot,
  nativePathAllowed, nativeSha256, parseNativeRawDiff, withNativeTransaction } from "./native-codex.mjs";
import { validateQualifiedNative, collectQualifiedNativeRun } from "./qualified-native.mjs";

/** @type {any} */ let review;
/** @type {any} */ let verdicts;
/** @type {any} */ let taskParser;
/** @type {any} */ let inert;
/** Loaded only for an actual configured retained executor or its new effects.
 * @type {typeof import("./configured-dispatch.mjs")|undefined} */
let configured;
/** @param {string} code @returns {never} */
function refuse(code) { throw new NativeCodexFinding(code, `${code}: complete qualified review refused`); }
/** @param {any} value */
export function qualifiedReviewDigest(value) { return nativeSha256(runs.qualifiedValidation().qualifiedContent(value)); }
/** @param {any} a @param {any} b */
function equal(a, b) { return runs.qualifiedValidation().qualifiedContent(a) === runs.qualifiedValidation().qualifiedContent(b); }
/** Structural original role provenance is part of the retained preparation,
 * not a current TOOL requirement on historical evidence reads.
 * @param {any} source @param {any} authority */
export function validateQualifiedRoleSource(source, authority) {
  const capsule = source.native?.qualified?.origins?.configuredDispatch;
  if (capsule === undefined) {
    if (authority.roleSource !== undefined) refuse("QUALIFIED_REVIEW_ROLE_SOURCE");
    return;
  }
  const supplied = authority.roleSource, tool = capsule.configuration?.tool;
  if (!validConfiguredDispatchCapsule(capsule) || !supplied || !tool || !equal(supplied, { kind: "installed-method", path: "method/roles/verifier.md",
    sha256: authority.role?.digest, tool: { manifestDigest: tool.manifestDigest, methodDigest: tool.methodDigest, methodVersion: tool.methodVersion } }) ||
    typeof authority.role?.text !== "string" || authority.role.digest !== nativeSha256(authority.role.text) ||
    !/^[0-9a-f]{64}$/.test(supplied.sha256)) refuse("QUALIFIED_REVIEW_ROLE_SOURCE");
}
/** Only an authentic original-source constructor may supply the current
 * verified METHOD asset at a new preparation/seal/admission effect.
 * @param {any} source @param {any} authority @param {object|undefined} handle */
function verifyConfiguredRole(source, authority, handle) {
  validateQualifiedRoleSource(source, authority);
  if (source.native?.qualified?.origins?.configuredDispatch === undefined) return;
  if (configured === undefined || handle === undefined ||
      !equal(configured.verifyConfiguredDispatch(handle), source.native.qualified.origins.configuredDispatch)) refuse("QUALIFIED_REVIEW_CONFIGURED_REQUIRED");
  const actual = configured.configuredDispatchVerifierRole(handle);
  if (!equal(authority.role, actual.role) || !equal(authority.roleSource, actual.source)) refuse("QUALIFIED_REVIEW_ROLE_CHANGED");
}
/** No caller mode flag: presence is read from the actual retained source.
 * @param {string} root @param {any} source */
async function originalConfiguredSource(root, source) {
  if (source.native?.qualified?.origins?.configuredDispatch === undefined) return undefined;
  configured ??= await import("./configured-dispatch.mjs");
  return (await configured.captureConfiguredDispatchForRun(root, source.attempt)).handle;
}
/** Validate reported identities before they can enter a Git argument. Qualified
 * review currently supports SHA-1 repositories, as its bench inspector requires.
 * @param {unknown} value @param {string} [objectFormat] @returns {string} */
export function qualifiedReviewCommitId(value, objectFormat = "sha1") {
  if (objectFormat !== "sha1") refuse("QUALIFIED_REVIEW_OBJECT_FORMAT");
  if (!runs.qualifiedValidation().isQualifiedCommitId(value, objectFormat)) refuse("QUALIFIED_REVIEW_COMMIT_ID");
  return /** @type {string} */ (value);
}
/** @param {any} authority @param {string} role */
function reviewObjectFormat(authority, role) {
  const format = role === "product" ? authority.receipt?.productObjectFormat : role === "records" ? authority.receipt?.objectFormat : null;
  if (format !== "sha1") refuse("QUALIFIED_REVIEW_OBJECT_FORMAT");
  return format;
}
/** @param {any} authority @param {any} values */
function reviewCommitSet(authority, values) {
  if (!values || typeof values !== "object" || Array.isArray(values) ||
      !equal(Object.keys(values).sort(), ["product", "records"])) refuse("QUALIFIED_REVIEW_COMMIT_ID");
  for (const role of ["product", "records"]) qualifiedReviewCommitId(values[role], reviewObjectFormat(authority, role));
}
/** @param {any} authority @param {any} [refs] */
function reviewAuthorityCommitIds(authority, refs) {
  reviewCommitSet(authority, authority.revisions); reviewCommitSet(authority, authority.candidates);
  if (!Array.isArray(authority.workers)) refuse("QUALIFIED_REVIEW_COMMIT_ID");
  for (const worker of authority.workers) {
    const format = reviewObjectFormat(authority, worker.role);
    qualifiedReviewCommitId(worker.base, format); qualifiedReviewCommitId(worker.candidate, format);
  }
  if (refs !== undefined) reviewCommitSet(authority, refs);
}
/** Use the canonical YAML reader, including quoted scalars and comments. Invalid
 * frozen ceremony data cannot silently select a cheaper review.
 * @param {string} text @param {string} file */
export function qualifiedReviewTier(text, file) {
  return load().then(() => reviewTier(text, file));
}
/** Preparation has already awaited load before entering its authority decision.
 * @param {string} text @param {string} file */
function reviewTier(text, file) {
  const parsed = taskParser.extractFrontmatter(text, file), fields = parsed.data;
  if (!fields || parsed.issues.length || !taskParser.TASK_SIZES.some((/** @type {string} */ size) => size === fields.size) ||
      (Object.hasOwn(fields, "tier") && !["bounded", "standard", "guarded"].some((tier) => tier === fields.tier))) refuse("QUALIFIED_REVIEW_PRIVATE_AUTHORITY");
  return fields.tier === "guarded" || fields.size === "L" ? "guarded" : "standard";
}
/** @param {string} root @param {string[]} args @param {boolean} [bytes] */
function git(root, args, bytes = false) {
  try {
    const out = execFileSync("git", ["--no-replace-objects", "-C", root, ...args], { stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 32 * 1024 * 1024, env: { ...process.env, GIT_NO_LAZY_FETCH: "1", GIT_OPTIONAL_LOCKS: "0" } });
    return bytes ? out : out.toString("utf8").trim();
  } catch { refuse("QUALIFIED_REVIEW_GIT_INPUT"); }
}
async function load() {
  await runs.loadQualifiedReservations();
  review ??= await import("./dispatch-brief.mjs");
  verdicts ??= await import("./merge.mjs");
  taskParser ??= await import("../../../lib/parser/dist/pure.js");
  inert ??= await import("../../../lib/parser/dist/inert-spans.js");
  configured ??= await import("./configured-dispatch.mjs");
}
/** Preload only canonical parsing/review consumers for read-only retained
 * evidence readers. No native transaction, acquisition or progress is made. */
export async function loadQualifiedReviewConsumers() { await load(); }
/** The original implementation candidates are a collected fact, never caller
 * authority. Preparation may reread frozen objects, never candidate planning.
 * @param {string} root @param {any} source @param {any} io */
function finalized(root, source, io) {
  const q = source.native?.qualified, done = q?.collection;
  if (source.assignment?.role !== "executor" || source.state !== "finished" || source.execution?.endedAt == null ||
      source.reservation?.releasedAt == null || done?.phase !== "final" || source.native.collection?.eligible !== true ||
      source.native.collection.actualIndependentCheck !== true || source.native.binding == null ||
      !source.outcome?.evidence?.some((/** @type {any} */ e) => e.kind === "observed") ||
      source.native.inflight.length !== 0 || activeNativeHolds(source).length !== 0 || runs.ownedJobsAlive(source, io).length !== 0) refuse("QUALIFIED_REVIEW_EXECUTOR_UNFINALIZED");
  const authority = { receipt: q.reservation.scope.receipt };
  reviewCommitSet(authority, q.reservation.scope.revisions);
  reviewCommitSet(authority, runs.qualifiedValidation().qualifiedImplementationCandidates(q.reservation.scope, done.candidates));
  validateQualifiedNative(root, source, false);
  const checked = source.native.collection.check;
  let reported;
  try { reported = JSON.parse(source.native.collection.ref); } catch { refuse("QUALIFIED_REVIEW_EXECUTOR_CANDIDATES"); }
  if (checked?.clean !== true || !equal(reported, done.candidates) || !equal(done.final.check, checked) ||
      source.native.binding.agentId !== source.execution.harnessId ||
      q.reservation.scope.workers.some((/** @type {any} */ w) => !checked.participants?.some((/** @type {any} */ c) =>
        c.root === w.identity.filesystemRoot && equal(c.roles, w.roles) && c.clean === true && w.roles.every((/** @type {string} */ r) => c.head === done.candidates[r])))) refuse("QUALIFIED_REVIEW_EXECUTOR_CANDIDATES");
  if (!equal(done.candidates, Object.fromEntries(source.refs.map((/** @type {string} */ r) => r.split(":"))))) refuse("QUALIFIED_REVIEW_EXECUTOR_CANDIDATES");
  return q;
}
/** The canonical complete preparation contract owns the required bench roles;
 * implementation-writer membership alone is not that contract.
 * @param {any} source */
function verifierBenchRoles(source){return Object.keys(source.native.qualified.reservation.scope.revisions).sort();}
/** Read-only inputs for a fixed configured convenience constructor. This uses
 * the same finalized evidence checks as preparation, never a caller verdict.
 * The detached result is data, not a preparation or effect capability.
 * @param {string} root @param {string} attempt */
export async function readQualifiedVerifierInputs(root,attempt){
  root=realpathSync(root);await load();
  const source=/** @type {any} */(runs.readRecord(root,attempt)),q=finalized(root,source,runs.defaultRunIo());
  const result={source:{attempt:source.attempt,assignmentDigest:source.assignmentDigest,permissionDigest:source.permission.digest,
    originsDigest:qualifiedReviewDigest(q.origins),collectionDigest:qualifiedReviewDigest(q.collection)},
    request:q.reservation.request,scope:q.reservation.scope,candidates:runs.qualifiedValidation().qualifiedImplementationCandidates(q.reservation.scope,q.collection.candidates),
    requiredBenchRoles:verifierBenchRoles(source),ignoredOutputs:q.origins.launch.ignoredOutputs,
    preparations:(source.native.qualifiedPreparations??[]).map((/** @type {any} */ entry)=>({digest:entry.digest,consumedBy:entry.consumedBy,sealDigest:entry.seal?.digest??null}))};
  if(!equal(runs.readRecord(root,attempt),source))refuse("QUALIFIED_REVIEW_PREPARATION_DRIFT");
  const detached=structuredClone(result),freeze=(/** @type {any} */ value)=>{if(value&&typeof value==="object"){Object.values(value).forEach(freeze);Object.freeze(value);}};freeze(detached);return detached;
}
/** Frozen implementation scope and the existing records protocol are separate
 * output classes. Protocol artifacts never enter an implementation projection.
 * @param {any} authority @param {string[]} roles */
export function qualifiedReviewPolicy(authority, roles) {
  return { implementation: [...new Set(authority.fence.paths.filter((/** @type {any} */ p) => roles.includes(p.role)).map((/** @type {any} */ p) => p.domain))].sort(),
    protocol: roles.includes("records") ? ["docs/tasks"] : [],
    excluded: authority.fence.excluded.filter((/** @type {any} */ p) => roles.some((role) => authority.fence.repositories[role].filesystemRoot === p.filesystemRoot)).map((/** @type {any} */ p) => p.domain).sort() };
}
/** Validate caller declarations without collecting or preparing anything.
 * @param {string} root @param {any} source @param {any} a @param {string|undefined} ref */
export function qualifiedBenchAssignmentInputs(root, source, a, ref) {
  const q = source.native?.qualified;
  if (!q || a.role !== "verifier" || a.id !== source.assignment.id || a.kind !== "card" ||
      a.harness !== "codex-desktop-native" || a.native?.profile !== "detached-verifier" ||
      a.native.executorAttempt !== source.attempt || a.qualified?.verification?.executorAttempt !== source.attempt ||
      a.native.taskName === source.native.launch.taskName || a.cwd !== a.resource ||
      !equal(a.native.ignoredOutputs, q.origins.launch.ignoredOutputs)) refuse("QUALIFIED_REVIEW_ASSIGNMENT");
  for (const key of ["authorityRoot", "projectId", "revisions", "receipt", "taskId", "legacyTokenMap"]) {
    if (!equal(a.qualified[key], q.reservation.request[key])) refuse("QUALIFIED_REVIEW_FROZEN_INPUT");
  }
  const originalCandidates = q.collection?.candidates ?? (ref === undefined ? null : JSON.parse(ref));
  const complete = (/** @type {any} */ values) => runs.qualifiedValidation().qualifiedImplementationCandidates(q.reservation.scope, values);
  const candidates = originalCandidates === null ? null : complete(originalCandidates);
  if (candidates === null || (ref !== undefined && !equal(complete(JSON.parse(ref)), candidates))) refuse("QUALIFIED_REVIEW_CANDIDATE_SET");
  const authority = { receipt: q.reservation.scope.receipt };
  reviewCommitSet(authority, q.reservation.scope.revisions); reviewCommitSet(authority, candidates);
  const roles = verifierBenchRoles(source);
  if (!Array.isArray(a.qualified.workers) || !equal(a.qualified.workers.map((/** @type {any} */ w) => w.role).sort(), roles)) refuse("QUALIFIED_REVIEW_COMPLETE_SET");
  for (const w of a.qualified.workers) {
    if (w.base !== q.reservation.request.revisions[w.role] || w.candidate !== candidates[w.role]) refuse("QUALIFIED_REVIEW_CANDIDATE_SET");
  }
  const primary = a.qualified.workers.find((/** @type {any} */ w) => w.role === "product") ?? a.qualified.workers[0];
  if (a.resource !== primary.checkout || a.base !== primary.candidate || realpathSync(root) !== q.reservation.scope.authorityRoot) refuse("QUALIFIED_REVIEW_ASSIGNMENT");
  return { resource: a.resource, candidate: JSON.stringify(Object.fromEntries(q.reservation.request.workers.map((/** @type {any} */ w) => [w.role, candidates[w.role]]))), assignment: a };
}
/** A physical bench check uses the normal mode/type/rename/ignored inspector.
 * Its initial HEAD is the candidate; the committed input range starts at the
 * original implementation base. Missing product cards are never consulted.
 * @param {any} authority @param {boolean} [initial] */
export function inspectQualifiedBenches(authority, initial = true) {
  reviewAuthorityCommitIds(authority);
  /** @type {any[]} */
  const measured = [];
  for (const w of authority.workers) {
    const identity = runs.qualifiedValidation().measureQualifiedWorker(w.checkout);
    if (identity.gitCommonDirectory !== authority.fence.repositories[w.role].gitCommonDirectory) refuse("QUALIFIED_REVIEW_PROJECT");
    const prior = measured.find((p) => p.root === identity.filesystemRoot);
    if (prior) {
      if (prior.base !== w.base || prior.candidate !== w.candidate) refuse("QUALIFIED_REVIEW_ALIAS");
      prior.roles.push(w.role); continue;
    }
    if (git(identity.filesystemRoot, ["rev-parse", "--show-object-format"]) !== "sha1") refuse("QUALIFIED_REVIEW_OBJECT_FORMAT");
    const branch = String(git(identity.filesystemRoot, ["rev-parse", "--abbrev-ref", "HEAD"]));
    if (branch !== "HEAD") refuse("QUALIFIED_REVIEW_DETACHED");
    if (git(identity.filesystemRoot, ["merge-base", w.base, w.candidate]) !== w.base ||
        (initial && git(identity.filesystemRoot, ["rev-parse", "HEAD"]) !== w.candidate)) refuse("QUALIFIED_REVIEW_CANDIDATE_HEAD");
    measured.push({ root: identity.filesystemRoot, identity, roles: [w.role], base: w.base, candidate: w.candidate });
  }
  for (const bench of measured) {
    const policy = qualifiedReviewPolicy(authority, bench.roles);
    const domains = [...policy.implementation, ...policy.protocol];
    const local = { resource: bench.root, assignment: { base: bench.base }, native: { version: 1, profile: "writer-resource",
      probes: [], inflight: [], receipts: [], holds: [], stopObservations: [], interruptObservations: [], launch: { coordinatorTurnIds: [] },
      fence: { paths: domains }, ignoredOutputs: authority.ignoredOutputs, ignoredBaseline: [] } };
    const check = collectNativeWorkspace(local, { qualifiedPhysical: true });
    if (!check.clean || (initial && (check.untracked.length || check.tracked.some((p) => ["staged", "unstaged"].includes(p.layer)))) ||
        nativeIgnoredSnapshot(bench.root, authority.ignoredOutputs).length !== 0) refuse("QUALIFIED_REVIEW_CONTAINMENT");
  }
  if (authority.benches !== undefined && !equal(authority.benches, measured)) refuse("QUALIFIED_REVIEW_ROOT_IDENTITY");
  return measured;
}
/** @param {string} root @param {any} opts */
export async function prepareQualifiedVerification(root, opts) {
  try { return await prepareQualifiedVerificationImpl(root, opts); }
  catch (error) { const code = /** @type {any} */ (error).code ?? "QUALIFIED_REVIEW_PREPARE_REFUSED"; refuse(code); }
}
/** @param {string} root @param {any} opts */
async function prepareQualifiedVerificationImpl(root, opts) {
  const assignment = structuredClone(opts.assignment);
  await load();
  const before = /** @type {any} */ (runs.readRecord(root, opts.attempt)), io = opts.io ?? runs.defaultRunIo();
  const handle = await originalConfiguredSource(root, before);
  const declaration = qualifiedBenchAssignmentInputs(root, before, assignment, opts.candidate);
  // Complete asynchronous policy loading/observation before the synchronous
  // authority decision. The decision recaptures current policy and identities.
  const policy = await import("./qualified-admission.mjs");
  const request = { version: 1, authorityRoot: root, projectId: before.assignment.qualified.projectId,
    revisions: before.assignment.qualified.revisions, taskId: before.assignment.id,
    roles: before.assignment.qualified.workers.map((/** @type {any} */ w) => w.role), legacyTokenMap: before.assignment.qualified.legacyTokenMap,
    admission: { boundary: "child-start", role: "verifier", kind: "explicit", parent: "", evidence: "", scope: "product-change", attempt: null } };
  const earlier = handle === undefined ? await policy.admissionPreflight(request) : await policy.configuredAdmissionPreflight(request, handle);
  return withNativeTransaction(root, { operation: "qualified-verification-prepare", ...(opts.transaction ?? {}) }, () => {
    const source = /** @type {any} */ (runs.readRecord(root, opts.attempt)), q = finalized(root, source, io);
    if (!equal(assignment, opts.assignment)) refuse("QUALIFIED_REVIEW_INPUT_CHANGED");
    if (source.assignmentDigest !== before.assignmentDigest || !equal(source.native.qualified.collection, before.native.qualified.collection)) refuse("QUALIFIED_REVIEW_PREPARATION_DRIFT");
    if (handle === undefined) policy.decisiveQualifiedAdmission(request, earlier, false, declaration.resource);
    else policy.decisiveConfiguredAdmission(request, earlier, handle, false, declaration.resource);
    qualifiedBenchAssignmentInputs(root, source, opts.assignment, opts.candidate);
    const receipt = q.reservation.scope.receipt;
    const raw = /** @type {Buffer} */ (git(receipt.recordsRoot, ["show", `${q.reservation.scope.revisions.records}:${receipt.cardPath}`], true)).toString("utf8");
    if (git(receipt.recordsRoot, ["rev-parse", `${q.reservation.scope.revisions.records}:${receipt.cardPath}`]) !== receipt.cardBlobId) refuse("QUALIFIED_REVIEW_PRIVATE_AUTHORITY");
    const method = handle === undefined ? null : /** @type {NonNullable<typeof configured>} */ (configured).configuredDispatchVerifierRole(handle);
    const role = method?.role.text ?? /** @type {Buffer} */ (git(q.reservation.scope.fence.repositories.product.filesystemRoot,
      ["show", `${q.reservation.scope.revisions.product}:method/roles/verifier.md`], true)).toString("utf8");
    const authority = /** @type {any} */ ({ version: 1, executorAttempt: source.attempt, sourceIdentity: q.identity, taskId: source.assignment.id,
      projectId: q.reservation.scope.projectId, revisions: q.reservation.scope.revisions, candidates: runs.qualifiedValidation().qualifiedImplementationCandidates(q.reservation.scope, q.collection.candidates),
      receipt, fence: q.reservation.scope.fence, workers: structuredClone(opts.assignment.qualified.workers),
      ignoredOutputs: [...q.origins.launch.ignoredOutputs], card: { path: receipt.cardPath, text: raw, digest: nativeSha256(raw) },
      role: { text: role, digest: nativeSha256(role) }, ...(method === null ? {} : { roleSource: method.source }), tier: reviewTier(raw, receipt.cardPath) });
    verifyConfiguredRole(source, authority, handle);
    const benches = inspectQualifiedBenches(authority); authority.benches = benches;
    const digest = qualifiedReviewDigest(authority);
    const entries = source.native.qualifiedPreparations ?? [];
    if (entries.some((/** @type {any} */ p) => p.digest !== digest)) refuse("QUALIFIED_REVIEW_AMBIGUOUS_PREPARATION");
    const existing = entries.filter((/** @type {any} */ p) => p.digest === digest);
    if (existing.length > 1 || existing[0]?.consumedBy != null) refuse("QUALIFIED_REVIEW_PREPARATION_CONSUMED");
    const entry = existing[0] ?? { authority, digest, benches, consumedBy: null, seal: null, preparedAt: opts.at ?? io.now() };
    source.native.qualifiedPreparations = [...entries.filter((/** @type {any} */ p) => p.digest !== digest), entry];
    runs.writeRecord(root, source);
    const preparedAssignment = structuredClone(opts.assignment);
    preparedAssignment.qualified.verification.preparationDigest = digest;
    return { record: source, preparation: entry, assignment: preparedAssignment,
      phase1: review.renderPhase1({ taskId: authority.taskId, tier: authority.tier, base: authority.revisions.records,
        card: authority.card.path, cardText: authority.card.text, verifierMd: authority.role.text, attackSetFile: opts.attackSetFile ?? "the coordinator's attack set" }) };
  });
}
/** @param {string} root @param {string} executorAttempt @param {string} digest */
export function readQualifiedPreparation(root, executorAttempt, digest) {
  const source = runs.readRecord(root, executorAttempt);
  const entries = (source.native?.qualifiedPreparations ?? []).filter((/** @type {any} */ p) => p.digest === digest);
  if (entries.length !== 1 || entries[0].digest !== qualifiedReviewDigest(entries[0].authority)) refuse("QUALIFIED_REVIEW_PREPARATION_CHANGED");
  validateQualifiedRoleSource(source, entries[0].authority);
  return { source, entry: entries[0] };
}
/** Seal the saved phase-one return, original ground, private contract and the
 * complete receipt/candidate set. Rendering never prints raw private authority.
 * @param {string} root @param {any} opts */
export async function sealQualifiedVerification(root, opts) {
  await load();
  const handle = await originalConfiguredSource(root, runs.readRecord(root, opts.executorAttempt));
  const attack = readFileSync(opts.attackSetFile, "utf8");
  if (!attack.trim()) refuse("QUALIFIED_REVIEW_ATTACK_SET_EMPTY");
  return withNativeTransaction(root, { operation: "qualified-verification-seal" }, () => {
    if (readFileSync(opts.attackSetFile, "utf8") !== attack) refuse("QUALIFIED_REVIEW_ATTACK_SET_CHANGED");
    const { source, entry } = readQualifiedPreparation(root, opts.executorAttempt, opts.preparationDigest), a = entry.authority;
    finalized(root, source, opts.io ?? runs.defaultRunIo());
    verifyConfiguredRole(source, a, handle);
    if (entry.consumedBy !== null || entry.seal !== null) refuse("QUALIFIED_REVIEW_SEAL_ALREADY_ISSUED");
    runs.qualifiedPhasePolicy(root, source, "verifier", "child-start");
    inspectQualifiedBenches(a);
    const grounds = a.workers.map((/** @type {any} */ w) => {
      const domains = qualifiedReviewPolicy(a, [w.role]).implementation;
      const files = String(git(w.checkout, ["ls-tree", "-r", "--name-only", w.base])).split("\n")
        .filter((rel) => rel && nativePathAllowed(rel, domains)).map((rel) => ({ rel,
          blob: String(git(w.checkout, ["rev-parse", `${w.base}:${rel}`])), bytes: Number(git(w.checkout, ["cat-file", "-s", `${w.base}:${rel}`])) }));
      return { role: w.role, base: w.base, document: review.groundDocument({ taskId: a.taskId, tier: a.tier, base: w.base,
        card: a.card.path, files, preflight: { exit: 0, findings: [] } }) };
    });
    if (a.tier === "guarded" && (typeof opts.measurements !== "string" || !opts.measurements.trim())) refuse("QUALIFIED_REVIEW_GUARDED_MEASUREMENTS");
    const inputs = { attack: { text: attack, digest: nativeSha256(attack) }, grounds,
      measurements: opts.measurements ?? "standard mode", cardDigest: a.card.digest, roleDigest: a.role.digest,
      receipt: a.receipt, candidates: a.candidates, preparationDigest: entry.digest };
    const document = review.sealDocument({ taskId: a.taskId, tier: a.tier, base: JSON.stringify(a.revisions), tip: JSON.stringify(a.candidates),
      inputs: [{ what: "complete preparation and candidate receipt", file: "retained preparation", digest: entry.digest },
        { what: "frozen private contract", file: a.card.path, digest: a.card.digest },
        { what: "attack set", file: opts.attackSetFile, digest: inputs.attack.digest },
        ...grounds.map((/** @type {any} */ g) => ({ what: `${g.role} original ground`, file: `${g.role}:${g.base}`, digest: nativeSha256(g.document) })),
        { what: "seat measurements", file: "guarded addendum", digest: nativeSha256(inputs.measurements) }] });
    const seal = { inputs, digest: qualifiedReviewDigest({ inputs, document }), document };
    entry.seal = seal; runs.writeRecord(root, source);
    return { seal, phase2: review.renderQualifiedPhase2({ authority: a, preparationDigest: entry.digest, sealDigest: seal.digest, seal }) };
  });
}
/** Validate consumption independently inside admission. No prepared promise
 * or earlier policy answer can authorize this decision.
 * @param {string} root @param {any} a @param {object|undefined} [configuredHandle] */
export function qualifiedVerifierAdmission(root, a, configuredHandle) {
  const v = a.qualified.verification;
  const { source, entry } = readQualifiedPreparation(root, v.executorAttempt, v.preparationDigest);
  finalized(root, source, runs.defaultRunIo());
  verifyConfiguredRole(source, entry.authority, configuredHandle);
  qualifiedBenchAssignmentInputs(root, source, a, JSON.stringify(entry.authority.candidates));
  if (entry.seal === null || entry.seal.digest !== qualifiedReviewDigest({ inputs: entry.seal.inputs, document: entry.seal.document }) ||
      !equal(entry.seal.inputs.candidates, entry.authority.candidates) || entry.seal.inputs.preparationDigest !== entry.digest) refuse("QUALIFIED_REVIEW_SEAL_CHANGED");
  if (entry.consumedBy === null) inspectQualifiedBenches(entry.authority);
  return { source, entry };
}
/** @param {any} rec */
export function validateQualifiedReview(rec) {
  const v = rec.native.qualified.verification;
  if (!v) return;
  const { entry } = readQualifiedPreparation(rec.native.authorityRoot, v.authority.executorAttempt, v.digest);
  if (entry.consumedBy !== rec.attempt || !equal(entry.authority, v.authority) || !equal(entry.seal, v.seal) ||
      v.seal.digest !== qualifiedReviewDigest({ inputs: v.seal.inputs, document: v.seal.document })) refuse("QUALIFIED_REVIEW_RETAINED_SEAL");
  inspectQualifiedBenches(v.authority, false);
  const records = v.authority.workers.find((/** @type {any} */ w) => w.role === "records");
  if (records) {
    const current = readFileSync(path.join(records.checkout, v.authority.card.path), "utf8");
    if (!runs.qualifiedProtocolDrift(v.authority.card.text, current)) refuse("QUALIFIED_REVIEW_PROTOCOL_CONTRACT");
    const paths = String(git(records.checkout, ["diff", "--name-only", records.candidate, "--", "docs/tasks"])).split("\n").filter(Boolean);
    for (const rel of paths) {
      if (rel === v.authority.card.path) continue;
      const introduced = String(git(records.checkout, ["ls-tree", "--name-only", records.candidate, "--", rel])) === "";
      const content = readFileSync(path.join(records.checkout, rel), "utf8");
      if (!introduced || !/^status:\s*suggested\s*$/m.test(content) || !/^suggested_by:\s*\S.+$/m.test(content)) refuse("QUALIFIED_REVIEW_FINDING_PROTOCOL");
    }
  }
}
/** Actual implementation projection, derived from the frozen policy. The
 * commit and full tree still identify the exact protocol-bearing output.
 * @param {any} authority @param {any} worker @param {string} commit */
export function qualifiedOutputIdentity(authority, worker, commit) {
  const format = reviewObjectFormat(authority, worker.role);
  qualifiedReviewCommitId(worker.base, format); commit = qualifiedReviewCommitId(commit, format);
  for (const id of new Set([worker.base, commit])) {
    if (git(worker.checkout, ["cat-file", "-t", id]) !== "commit") refuse("QUALIFIED_REVIEW_COMMIT_ID");
  }
  const policy = qualifiedReviewPolicy(authority, [worker.role]);
  const entries = parseNativeRawDiff(/** @type {Buffer} */ (git(worker.checkout,
    ["diff", "--raw", "-z", "--no-abbrev", worker.base, commit, "--"], true)));
  const implementation = qualifiedImplementationProjection(entries, policy);
  return { role: worker.role, commit, tree: String(git(worker.checkout, ["rev-parse", `${commit}^{tree}`])),
    policy, projectionDigest: qualifiedReviewDigest(implementation), implementation };
}
/** Keep canonical raw entries and classify only endpoints changed by the event.
 * A copy's source is provenance; a rename deletes its source. Mixed-class
 * renames have no supported partial-entry representation and refuse explicitly.
 * @param {any[]} entries @param {any} policy */
export function qualifiedImplementationProjection(entries, policy) {
  return entries.filter((entry) => {
    const changed = entry.status.startsWith("C") ? [entry.newPath] : entry.paths;
    const implementation = changed.map((/** @type {string} */ rel) => nativePathAllowed(rel, policy.implementation) &&
      !nativePathAllowed(rel, [...policy.protocol, ...policy.excluded]));
    if (implementation.some(Boolean) && !implementation.every(Boolean)) refuse("QUALIFIED_REVIEW_PROJECTION_CROSS_CLASS");
    return implementation.every(Boolean);
  });
}
/** A reading is retained at exactly the repository/commit/tree it actually
 * measured. A label cannot turn a hypothetical corrected commit into a grade.
 * @param {any} reading @param {any} worker @param {any} identity @param {number} exit */
function grade(reading, worker, identity, exit) {
  qualifiedReviewCommitId(reading?.commit);
  if (!reading || reading.role !== worker.role || reading.commit !== identity.commit || reading.tree !== identity.tree ||
      reading.projectionDigest !== identity.projectionDigest || reading.exit !== exit || !Number.isInteger(reading.bodies) || reading.bodies < 1 ||
      typeof reading.command !== "string" || !reading.command.trim() || typeof reading.output !== "string" ||
      !reading.output.includes(`ref=${identity.commit}`) || !reading.output.includes(`exit=${exit}`) ||
      reading.outputDigest !== nativeSha256(reading.output)) refuse("QUALIFIED_REVIEW_UNGRADED_OUTPUT");
  return structuredClone(reading);
}
/** Read the committed verdict and bodies, preserving mandatory corrections.
 * Collection never edits implementation or creates a corrected tree.
 * @param {any} rec @param {any} refs */
export function collectQualifiedReviewEvidence(rec, refs) {
  const v = rec.native.qualified.verification, a = v.authority;
  reviewAuthorityCommitIds(a, refs);
  validateQualifiedReview(rec);
  const records = a.workers.find((/** @type {any} */ w) => w.role === "records");
  if (!records) refuse("QUALIFIED_REVIEW_RECORDS_REQUIRED");
  const text = /** @type {Buffer} */ (git(records.checkout, ["show", `${refs.records}:${a.card.path}`], true)).toString("utf8");
  const newest = verdicts.newestVerdict(text);
  if ("problem" in newest || !/^(?:APPROVED|ACCEPTED)/i.test(verdicts.verdictState(newest.heading))) refuse("QUALIFIED_REVIEW_VERDICT");
  const blocks = verdicts.readMutantBlocks(newest.text);
  const payloads = [...newest.text.matchAll(/```qualified-verdict\s*\n([\s\S]*?)\n```/g)];
  if (payloads.length !== 1 || "problem" in blocks) refuse("QUALIFIED_REVIEW_VERDICT_BINDING");
  let payload;
  try { payload = JSON.parse(payloads[0][1]); } catch { refuse("QUALIFIED_REVIEW_VERDICT_BINDING"); }
  reviewCommitSet(a, payload?.candidates);
  const criteria = taskParser.parseTaskFile(a.card.text, a.card.path).task?.sections.acceptanceCriteria ?? "";
  const items = [...inert.blankInertSpans(criteria).content.matchAll(/^( *)(?:[-*+]|\d+\.)[ \t]+\S/gm)];
  const count = items.filter((item) => item[1].length === Math.min(...items.map((other) => other[1].length))).length;
  if (payload.preparationDigest !== v.digest || payload.sealDigest !== v.seal.digest || !equal(payload.candidates, a.candidates) ||
      !Array.isArray(payload.criteria) || payload.criteria.length !== count || count === 0 ||
      payload.criteria.some((/** @type {any} */ c, /** @type {number} */ i) => c?.criterion !== i + 1 || typeof c.evidence !== "string" || !c.evidence.trim()) ||
      payload.frame?.agentId !== rec.native.binding?.agentId || payload.frame.taskName !== rec.native.launch.taskName ||
      payload.frame.sessionId !== rec.native.launch.sessionId || payload.frame.requestedModel !== rec.assignment.model ||
      payload.frame.requestedEffort !== rec.assignment.effort || !equal(payload.frame.observed, rec.execution.observed) ||
      typeof payload.frame.limitations !== "string" || !Array.isArray(payload.corrections) || !Array.isArray(payload.grades)) refuse("QUALIFIED_REVIEW_PARTIAL_VERDICT");
  if (payload.corrections.some((/** @type {any} */ c) => !c || typeof c !== "object")) refuse("QUALIFIED_REVIEW_CORRECTION_DROPPED");
  const outputs = a.workers.map((/** @type {any} */ w) => qualifiedOutputIdentity(a, w, refs[w.role]));
  const entries = verdicts.correctionEntries(newest.text);
  const shortfall = verdicts.correctionShortfall({ entries, blocks: blocks.blocks, stated: verdicts.statedNoBlock(newest.text, entries) });
  const bodies = payload.corrections.filter((/** @type {any} */ c) => c.wordingOnly !== true);
  const wording = payload.corrections.filter((/** @type {any} */ c) => c.wordingOnly === true);
  if (bodies.length !== blocks.blocks.length || wording.length !== shortfall.wording.length || shortfall.unexplained.length > 0 ||
      new Set(payload.corrections.map((/** @type {any} */ c) => c.correction)).size !== payload.corrections.length ||
      (verdicts.assignsCorrections(newest.text) && payload.corrections.length === 0)) refuse("QUALIFIED_REVIEW_CORRECTION_DROPPED");
  const corrections = payload.corrections.map((/** @type {any} */ correction) => {
    const w = a.workers.find((/** @type {any} */ worker) => worker.role === correction.role);
    if (correction.wordingOnly === true) {
      if (!w || !shortfall.wording.some((/** @type {any} */ e) => e.name === correction.correction) ||
          typeof correction.file !== "string" || !nativePathAllowed(correction.file, qualifiedReviewPolicy(a, [w.role]).implementation) ||
          typeof correction.why !== "string" || !correction.why.trim() ||
          ["bodyCommit", "bodyHash", "blockDigest", "red", "green"].some((key) => Object.hasOwn(correction, key))) refuse("QUALIFIED_REVIEW_WORDING_CONDITION");
      return { ...correction, frozenScope: qualifiedReviewPolicy(a, [w.role]), evidence: "canonical verdict explicitly states no property/body/block is owed" };
    }
    const block = blocks.blocks.find((/** @type {any} */ b) => b.correction === correction.correction);
    if (!block) refuse("QUALIFIED_REVIEW_CORRECTION_DROPPED");
    if (correction.bodyCommit !== undefined) qualifiedReviewCommitId(correction.bodyCommit);
    // The body is committed after the verdict. Derive its real commit from
    // that output rather than asking a verdict to predict a future commit id.
    const bodyCommits = w ? String(git(w.checkout, ["log", "--reverse", "--format=%H", `${w.candidate}..${refs[w.role]}`, "--", block.spec])).split("\n").filter(Boolean) : [];
    const bodyCommit = bodyCommits.find((commit) => nativeSha256(/** @type {Buffer} */ (git(w.checkout, ["show", `${qualifiedReviewCommitId(commit)}:${block.spec}`], true))) === correction.bodyHash);
    if (!w || correction.correction !== block.correction || correction.blockDigest !== qualifiedReviewDigest(block) ||
        !nativePathAllowed(block.file, qualifiedReviewPolicy(a, [w.role]).implementation) ||
        !nativePathAllowed(block.spec, qualifiedReviewPolicy(a, [w.role]).implementation) ||
        !bodyCommit || (correction.bodyCommit !== undefined && correction.bodyCommit !== bodyCommit) ||
        git(w.checkout, ["merge-base", w.candidate, bodyCommit]) !== w.candidate ||
        git(w.checkout, ["merge-base", bodyCommit, refs[w.role]]) !== bodyCommit) refuse("QUALIFIED_REVIEW_CORRECTION_SCOPE");
    const body = /** @type {Buffer} */ (git(w.checkout, ["show", `${bodyCommit}:${block.spec}`], true)).toString("utf8");
    if (!body.includes(block.body) || correction.bodyHash !== nativeSha256(body)) refuse("QUALIFIED_REVIEW_CORRECTION_BODY");
    let finalBody;
    try { finalBody = /** @type {Buffer} */ (git(w.checkout, ["show", `${refs[w.role]}:${block.spec}`], true)); }
    catch { refuse("QUALIFIED_REVIEW_CORRECTION_BODY"); }
    if (nativeSha256(finalBody) !== correction.bodyHash) refuse("QUALIFIED_REVIEW_CORRECTION_BODY");
    if (!correction.red || !correction.green) refuse("QUALIFIED_REVIEW_CORRECTION_READINGS");
    const readings = [grade(correction.red, w, qualifiedOutputIdentity(a, w, correction.red.commit), 1),
      grade(correction.green, w, qualifiedOutputIdentity(a, w, correction.green.commit), 0)];
    const redBody = /** @type {Buffer} */ (git(w.checkout, ["show", `${correction.red.commit}:${block.spec}`], true));
    const greenBody = /** @type {Buffer} */ (git(w.checkout, ["show", `${correction.green.commit}:${block.spec}`], true));
    const redProperty = /** @type {Buffer} */ (git(w.checkout, ["show", `${correction.red.commit}:${block.file}`], true)).toString("utf8");
    const greenProperty = /** @type {Buffer} */ (git(w.checkout, ["show", `${correction.green.commit}:${block.file}`], true)).toString("utf8");
    if (correction.red.commit === correction.green.commit || !correction.red.output.includes(block.message) ||
        nativeSha256(redBody) !== correction.bodyHash || nativeSha256(greenBody) !== correction.bodyHash ||
        verdicts.occurrences(redProperty, block.new) !== 1 || verdicts.occurrences(greenProperty, block.old) !== 1) refuse("QUALIFIED_REVIEW_CORRECTION_READINGS");
    return { ...correction, bodyCommit, block, frozenScope: qualifiedReviewPolicy(a, [w.role]), readings };
  });
  const grades = a.workers.map((/** @type {any} */ w) => {
    const output = outputs.find((/** @type {any} */ o) => o.role === w.role);
    const supplied = payload.grades.filter((/** @type {any} */ g) => g?.role === w.role);
    if (supplied.length !== 1) refuse("QUALIFIED_REVIEW_UNGRADED_OUTPUT");
    const measured = qualifiedOutputIdentity(a, w, supplied[0].commit);
    const expected = corrections.some((/** @type {any} */ c) => c.role === w.role) ? qualifiedOutputIdentity(a, w, w.candidate) : output;
    if (measured.projectionDigest !== expected.projectionDigest ||
        git(w.checkout, ["merge-base", w.candidate, measured.commit]) !== w.candidate ||
        git(w.checkout, ["merge-base", measured.commit, refs[w.role]]) !== measured.commit) refuse("QUALIFIED_REVIEW_UNGRADED_OUTPUT");
    return grade(supplied[0], w, measured, 0);
  });
  // A verdict cannot contain its own future commit id. Retain own-write grades
  // from the actual native final instead; protocol-only output still owes the
  // existing gates. Candidate/projection grades above do not waive that debt.
  const finals = rec.native.outputs.filter((/** @type {any} */ o) => o.agentId === rec.native.binding.agentId &&
    o.turnId === rec.native.binding.startTurnId && /^RUN-DONE ok\s*$/m.test(o.evidence));
  const readings = finals.flatMap((/** @type {any} */ o) => [...o.evidence.matchAll(/```qualified-output-grades\s*\n([\s\S]*?)\n```/g)]);
  let own;
  try { if (readings.length !== 1) refuse("QUALIFIED_REVIEW_OWN_WRITE_GRADES"); own = JSON.parse(readings[0][1]); }
  catch { refuse("QUALIFIED_REVIEW_OWN_WRITE_GRADES"); }
  reviewCommitSet(a, own?.refs);
  if (own.preparationDigest !== v.digest || own.sealDigest !== v.seal.digest || !equal(own.refs, refs) ||
      !Array.isArray(own.grades) || own.grades.length !== a.workers.length) refuse("QUALIFIED_REVIEW_OWN_WRITE_GRADES");
  const actualOutputGrades = a.workers.map((/** @type {any} */ w) => {
    const found = own.grades.filter((/** @type {any} */ g) => g?.role === w.role), identity = outputs.find((/** @type {any} */ o) => o.role === w.role);
    if (found.length !== 1) refuse("QUALIFIED_REVIEW_OWN_WRITE_GRADES");
    const expectedRed = corrections.filter((/** @type {any} */ c) => c.role === w.role && c.wordingOnly !== true);
    if (found[0].exit !== 0 && !(found[0].exit === 1 && typeof found[0].output === "string" && expectedRed.length > 0 && expectedRed.every((/** @type {any} */ c) => found[0].output.includes(c.block.message)))) refuse("QUALIFIED_REVIEW_OWN_WRITE_GRADES");
    return grade(found[0], w, identity, found[0].exit);
  });
  return { candidates: a.candidates, reviewed: a.workers.map((/** @type {any} */ w) => qualifiedOutputIdentity(a, w, w.candidate)),
    actualOutputs: outputs, grades, actualOutputGrades, verdict: { commit: refs.records, digest: nativeSha256(newest.text), payload, text: newest.text },
    preparationDigest: v.digest, sealDigest: v.seal.digest, corrections,
    integration: { required: corrections.length > 0, conditions: corrections.map((/** @type {any} */ c) => c.correction),
      authority: "T-355 must bind actual corrected integration and its grades; split landing remains refused" } };
}

/** Dependency preparation is complete before the decisive collection lock.
 * A historical retry takes only retained evidence through the existing owner.
 * @param {string} root @param {any} opts */
export async function collectQualifiedVerifierRun(root, opts) {
  await load();
  return withNativeTransaction(root, { operation: "qualified-verifier-collect", ...(opts.transaction ?? {}) }, () =>
    collectQualifiedNativeRun(root, runs.readRecord(root, opts.attempt), opts));
}
