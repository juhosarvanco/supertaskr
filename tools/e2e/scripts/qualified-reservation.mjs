/** Qualified reservation validation (T-351). Transaction and publication belong
 * to run-record. Committed capture and the public parser are the only planners.
 * Loaded on demand so ordinary lifecycle calls require no new parser build.
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { lstatSync, readFileSync, readdirSync, realpathSync } from "node:fs";
import path from "node:path";
import * as publicParser from "../../../lib/parser/dist/pure.js";
import { captureCommittedInputs, captureTaskSnapshot } from "./records.mjs";
import { normalizeContextRequest } from "./records-context.mjs";

export const QUALIFIED_RESERVATION_VERSION = 2;
export const QUALIFIED_REQUEST_VERSION = 1;
const ROLES = ["product", "records"];

/** Canonical retained identities are full, lowercase object names, never refs.
 * @param {unknown} value @param {string} [objectFormat] */
export function isQualifiedCommitId(value, objectFormat) {
  if (typeof value !== "string") return false;
  if (objectFormat === undefined) return /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(value);
  return objectFormat === "sha1" ? /^[0-9a-f]{40}$/.test(value) :
    objectFormat === "sha256" && /^[0-9a-f]{64}$/.test(value);
}

export class QualifiedReservationFinding extends Error {
  /** @param {string} code @param {string} detail */
  constructor(code, detail) { super(`${code}: ${detail}`); this.name = "QualifiedReservationFinding"; this.code = code; }
}
/** @param {string} code @param {string} detail @returns {never} */
function refuse(code, detail) { throw new QualifiedReservationFinding(code, detail); }
/** @param {any} value @param {string[]} keys @param {string} label @param {string[]} [optional] */
function shape(value, keys, label, optional = []) {
  if (!value || typeof value !== "object" || Array.isArray(value) ||
      keys.some((key) => !Object.hasOwn(value, key)) || Object.keys(value).some((key) => ![...keys, ...optional].includes(key))) refuse("qualified-schema", `${label}: expected exactly ${keys.join(", ")}`);
}
/** Key order and process/time metadata are not ownership facts.
 * @param {any} value @returns {string} */
export function qualifiedContent(value) {
  /** @param {any} input @returns {any} */
  function ordered(input) {
    if (Array.isArray(input)) return input.map(ordered);
    if (input && typeof input === "object") return Object.fromEntries(Object.keys(input).sort().map((key) => [key, ordered(input[key])]));
    return input;
  }
  return JSON.stringify(ordered(value));
}
/** @param {any} left @param {any} right @param {string} label */
function same(left, right, label) {
  if (qualifiedContent(left) !== qualifiedContent(right)) refuse("qualified-changed", label);
}
/** @returns {any} */
function parser() {
  return publicParser;
}
/** @param {string} root @param {string[]} args @returns {string} */
function git(root, args) {
  try { return execFileSync("git", ["--no-replace-objects", "-C", root, ...args], {
    encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, GIT_NO_LAZY_FETCH: "1", GIT_OPTIONAL_LOCKS: "0" },
  }).replace(/\n$/, ""); }
  catch (err) { refuse("qualified-worker-unavailable", `${root}: ${String(err)}`); }
}
/** @param {any} location @returns {string} */
function absolute(location) {
  if (typeof location !== "string" || !path.isAbsolute(location) || /[\u0000-\u001f\u007f]/.test(location)) refuse("qualified-location", String(location));
  try { return realpathSync(location); }
  catch (err) { refuse("qualified-location", `${location}: ${String(err)}`); }
}
/** Measure a real checkout, never infer project identity from its pathname.
 * @param {string} checkout */
export function measureQualifiedWorker(checkout) {
  const filesystemRoot = absolute(checkout);
  if (absolute(git(filesystemRoot, ["rev-parse", "--show-toplevel"])) !== filesystemRoot) refuse("qualified-worker-nested", checkout);
  const gitCommonDirectory = absolute(path.resolve(filesystemRoot, git(filesystemRoot, ["rev-parse", "--git-common-dir"])));
  const gitDirectory = absolute(git(filesystemRoot, ["rev-parse", "--absolute-git-dir"]));
  const registered = git(filesystemRoot, ["worktree", "list", "--porcelain", "-z"]).split("\0")
    .filter((entry) => entry.startsWith("worktree ")).map((entry) => absolute(entry.slice("worktree ".length)));
  if (!registered.includes(filesystemRoot)) refuse("qualified-worker-unregistered", checkout);
  const stat = lstatSync(filesystemRoot);
  return { filesystemRoot, gitCommonDirectory, gitDirectory, device: String(stat.dev), inode: String(stat.ino) };
}
/** Reject aliases anywhere in the claimed subtree, including a directory's
 * descendants. A nonexistent target still has its existing ancestors checked.
 * @param {string} root @param {string} domain */
function physicalDomain(root, domain) {
  /** @param {string} file @param {boolean} descend */
  function check(file, descend) {
    let stat;
    try { stat = lstatSync(file); }
    catch (err) { if (/** @type {NodeJS.ErrnoException} */ (err).code === "ENOENT") return; throw err; }
    if (stat.isSymbolicLink()) refuse("qualified-symlink-domain", file);
    if (descend && stat.isDirectory()) {
      if (file !== root && readdirSync(file).some((entry) => entry.toLowerCase() === ".git")) refuse("qualified-nested-domain", file);
      for (const entry of readdirSync(file)) check(path.join(file, entry), true);
    }
  }
  let at = root;
  const parts = domain.split("/");
  parts.forEach((part, index) => { at = path.join(at, part); check(at, index === parts.length - 1); });
}
/** Read-only receipt preparation. This is data, never acquisition authority.
 * @param {{authorityRoot: string, projectId: string, revisions: {product: string, records: string}, taskId: string, legacyTokenMap: any}} options
 */
export function captureQualifiedInputs(options) {
  shape(options.revisions, ROLES, "revisions");
  for (const role of ROLES) if (!isQualifiedCommitId(options.revisions[/** @type {"product"|"records"} */ (role)])) refuse("qualified-revision", `full ${role} commit required`);
  const authorityRoot = absolute(options.authorityRoot);
  const selection = normalizeContextRequest({ version: 1, legacyTokenMap: options.legacyTokenMap, inputs: [] });
  const capture = captureCommittedInputs({ productRoot: authorityRoot, productRevision: options.revisions.product, recordsRevision: options.revisions.records });
  if (capture.receipt.productRoot !== authorityRoot || capture.receipt.projectId !== options.projectId) refuse("qualified-authority", "authority root and project association must match captured product integration root");
  const snapshot = captureTaskSnapshot({ productRoot: authorityRoot, productRevision: options.revisions.product, recordsRevision: options.revisions.records, taskId: options.taskId }, capture);
  const publicParser = parser();
  const parsedTask = publicParser.parseTaskFile(snapshot.content, snapshot.task.relativePath);
  if (!parsedTask.task || parsedTask.issues.length) refuse("qualified-task", parsedTask.issues.map(/** @param {any} issue */ (issue) => issue.message).join("; "));
  const registry = capture.paths("records").filter((file) => publicParser.isComponentFilePath(file)).map((file) => capture.read("records", file));
  const parsedRegistry = publicParser.parseComponentsFromFiles(registry.map((input) => ({ path: input.path, content: input.content })));
  if (parsedRegistry.issues.length) refuse("qualified-registry", parsedRegistry.issues.map(/** @param {any} issue */ (issue) => issue.message).join("; "));
  const fence = publicParser.expandQualifiedFence(parsedTask.task, parsedRegistry.components, { repositories: capture.repositories,
    ownFile: snapshot.task.relativePath, legacyOwnership: new Map(Object.entries(selection.legacyTokenMap)),
    knownPaths: [...capture.paths("product"), ...capture.paths("records")] });
  if (!fence.usable || fence.paths.length === 0) refuse("qualified-fence", fence.issues.map(/** @param {any} issue */ (issue) => `${issue.code}: ${issue.message}`).join("; ") || "empty writer scope");
  const receipt = { ...snapshot.receipt, legacyTokenMap: selection.legacyTokenMap,
    registry: registry.map((input) => ({ path: input.path, blobId: input.blobId, mode: input.mode })) };
  return { authorityRoot, receipt, fence };
}
/** Reconstruct the canonical set from committed inputs and measured identities.
 * First acquisition checks HEAD; retained validation intentionally checks base
 * object availability and physical identity without grading current HEAD.
 * @param {any} request @param {{retained?: boolean}} [options] */
export function deriveQualifiedScope(request, { retained = false } = {}) {
  shape(request, ["version", "authorityRoot", "attempt", "projectId", "revisions", "taskId", "legacyTokenMap", "receipt", "workers"], "request", ["verification"]);
  if (request.version !== QUALIFIED_REQUEST_VERSION || typeof request.attempt !== "string" ||
      !new RegExp(`^${request.taskId}-a[0-9]+$`).test(request.attempt) || !/^T-\d+(?:-s\d+)?$/.test(request.taskId)) refuse("qualified-owner", "version 1 and an attempt of the selected task are required");
  const captured = captureQualifiedInputs(request);
  same(request.receipt, captured.receipt, "committed card/registry receipt or association changed");
  const prepared = request.verification === undefined ? null : verificationReservationAuthority(request);
  if (!Array.isArray(request.workers) || request.workers.length === 0) refuse("qualified-workers", "participating role bindings required");
  const seen = new Set();
  /** @type {any[]} */
  const workers = [];
  for (const binding of request.workers) {
    shape(binding, ["role", "checkout", "base"], "worker binding", prepared === null ? [] : ["candidate"]);
    if (!ROLES.includes(binding.role) || seen.has(binding.role)) refuse("qualified-worker-role", String(binding.role));
    seen.add(binding.role);
    if (binding.base !== request.revisions[binding.role]) refuse("qualified-worker-base", "worker base differs from captured role revision");
    const measured = measureQualifiedWorker(binding.checkout);
    if (prepared !== null && !prepared.benches?.some((/** @type {any} */ bench) => qualifiedContent(bench.identity) === qualifiedContent(measured))) refuse("qualified-verification-root", "prepared physical root identity changed");
    const repository = captured.fence.repositories[binding.role];
    if (measured.gitCommonDirectory !== repository.gitCommonDirectory) refuse("qualified-worker-project", `${binding.role}: worker does not belong to captured project repository`);
    const prior = workers.find((worker) => worker.identity.filesystemRoot === measured.filesystemRoot);
    const initialHead = prepared === null ? binding.base : prepared.candidates[binding.role];
    if (prepared !== null && binding.candidate !== initialHead) refuse("qualified-worker-candidate", "candidate differs from finalized executor");
    if (prior && (prior.base !== binding.base || (prepared !== null && prior.initialHead !== initialHead))) refuse("qualified-worker-alias-base", "one physical worker cannot have different bases or candidates");
    if (git(measured.filesystemRoot, ["rev-parse", "--verify", `${binding.base}^{commit}`]) !== binding.base ||
        (!retained && git(measured.filesystemRoot, ["rev-parse", "HEAD"]) !== initialHead)) refuse("qualified-worker-base", `${binding.role}: acquisition requires exact measured initial HEAD`);
    if (prepared !== null && (git(measured.filesystemRoot, ["rev-parse", "--show-object-format"]) !== "sha1" ||
        git(measured.filesystemRoot, ["merge-base", binding.base, initialHead]) !== binding.base)) refuse("qualified-worker-candidate", "unsupported object format or candidate ancestry");
    if (prior) prior.roles.push(binding.role);
    else workers.push({ identity: measured, base: binding.base, ...(prepared === null ? {} : { initialHead }), roles: [binding.role] });
  }
  for (const entry of captured.fence.paths) {
    const worker = workers.find((worker) => worker.roles.includes(entry.role));
    if (!worker) refuse("qualified-worker-missing", entry.role);
    physicalDomain(entry.filesystemRoot, entry.domain);
    physicalDomain(worker.identity.filesystemRoot, entry.domain);
  }
  workers.forEach((worker) => worker.roles.sort());
  workers.sort((a, b) => a.identity.filesystemRoot.localeCompare(b.identity.filesystemRoot));
  return { authorityRoot: captured.authorityRoot, attempt: request.attempt, projectId: request.projectId,
    revisions: { ...request.revisions }, receipt: captured.receipt, fence: captured.fence, workers };
}

/** A detached initial HEAD is authorized only by an independently finalized
 * executor and one published whole-set preparation. Ordinary first acquisition
 * still requires HEAD at the original base. No candidate card is recaptured.
 * @param {any} request */
export function verificationReservationAuthority(request) {
  shape(request.verification, ["executorAttempt", "preparationDigest"], "verification");
  const attempt = request.verification.executorAttempt;
  if (typeof attempt !== "string" || !new RegExp(`^${request.taskId}-a[0-9]+$`).test(attempt)) refuse("qualified-verification-record", "exact executor attempt required");
  // Read the existing run-record publication without importing its asynchronous
  // graph into the cold, synchronous legacy conflict reader. This is not a
  // second ledger: only the canonical published record is accepted.
  let source;
  try { source = JSON.parse(new TextDecoder("utf8", { fatal: true }).decode(readFileSync(path.join(request.authorityRoot, ".supertaskr", "runs", request.taskId, `${attempt}.json`)))); }
  catch { refuse("qualified-verification-record", "published executor record unavailable"); }
  const q = source.native?.qualified, completed = q?.collection;
  if (source.assignment?.role !== "executor" || source.state !== "finished" || source.execution?.endedAt == null ||
      source.reservation?.releasedAt == null || completed?.phase !== "final" || source.native?.collection?.eligible !== true ||
      source.native.collection.actualIndependentCheck !== true || source.native.inflight.length !== 0 ||
      source.native.holds.some((/** @type {any} */ h) => h.clearedAt == null) ||
      source.assignmentDigest !== `sha256:${createHash("sha256").update(JSON.stringify(source.assignment)).digest("hex")}` ||
      source.permission.digest !== createHash("sha256").update(qualifiedContent({ reservation: q.reservation, ignored: q.ignored, origins: q.origins })).digest("hex")) refuse("qualified-verification-source", "finalized frozen executor required");
  if (q.reservation.request.verification !== undefined) refuse("qualified-verification-source", "verifier cannot replace executor authority");
  let reported;
  try { reported = JSON.parse(source.native.collection.ref); } catch { refuse("qualified-verification-source", "collected candidate set unreadable"); }
  same(reported, completed.candidates, "collected candidate set changed");
  same(source.native.collection.check, completed.final?.check, "independent candidate check changed");
  if (source.native.collection.check?.clean !== true || completed.identity !== q.identity) refuse("qualified-verification-source", "independent collection identity changed");
  validateQualifiedReservation(q.reservation, request.authorityRoot, source.attempt);
  const entries = (source.native.qualifiedPreparations ?? []).filter((/** @type {any} */ p) => p.digest === request.verification.preparationDigest);
  if (entries.length !== 1) refuse("qualified-verification-preparation", "exactly one preparation required");
  const entry = entries[0], authority = entry.authority;
  if (entry.digest !== createHash("sha256").update(qualifiedContent(authority)).digest("hex") ||
      authority.executorAttempt !== source.attempt || authority.taskId !== request.taskId || authority.sourceIdentity !== q.identity ||
      (entry.consumedBy !== null && entry.consumedBy !== request.attempt)) refuse("qualified-verification-preparation", "changed or consumed preparation");
  same(authority.candidates, qualifiedImplementationCandidates(q.reservation.scope, completed.candidates), "finalized candidate set changed");
  same(authority.workers, request.workers, "complete verifier root set changed");
  for (const key of ["projectId", "revisions", "receipt", "legacyTokenMap"]) same(request[key], q.reservation.request[key], `frozen ${key} changed`);
  return authority;
}

/** An unchanged independent role retains its original commit. Colocated roles
 * name one physical implementation candidate, even if only one role wrote.
 * @param {any} scope @param {any} changed */
export function qualifiedImplementationCandidates(scope, changed) {
  const result = { ...scope.revisions, ...changed };
  if (scope.fence.repositories.product.filesystemRoot === scope.fence.repositories.records.filesystemRoot) {
    if (scope.revisions.product !== scope.revisions.records || new Set(Object.values(changed)).size !== 1) refuse("qualified-verification-alias", "colocated roles require one original base and candidate");
    result.product = result.records = Object.values(changed)[0];
  }
  return result;
}
/** @param {any} scope */
export function qualifiedIdentity(scope) {
  return `sha256:${createHash("sha256").update(qualifiedContent(scope)).digest("hex")}`;
}
/** Validation is reconstruction, not a checksum over mutable expansion.
 * @param {any} held @param {string} authorityRoot @param {string} attempt */
export function validateQualifiedReservation(held, authorityRoot, attempt) {
  shape(held, ["version", "kind", "attempt", "request", "scope", "identity", "takenAt", "holder"], "retained reservation");
  if (held.version !== QUALIFIED_RESERVATION_VERSION || held.kind !== "qualified-writer-set" || held.attempt !== attempt || held.request?.attempt !== attempt) refuse("qualified-owner", "retained owner/version mismatch");
  const scope = deriveQualifiedScope(held.request, { retained: true });
  if (scope.authorityRoot !== absolute(authorityRoot)) refuse("qualified-authority", "selected home differs from captured authority root");
  same(held.scope, scope, "retained canonical expansion, ownership or physical binding changed");
  same(held.identity, qualifiedIdentity(scope), "retained identity changed");
  if (typeof held.takenAt !== "string" || !Number.isFinite(Date.parse(held.takenAt))) refuse("qualified-schema", "retained acquisition time invalid");
  shape(held.holder, ["pid", "host"], "holder");
  if (!Number.isInteger(held.holder.pid) || held.holder.pid < 1 || typeof held.holder.host !== "string") refuse("qualified-schema", "holder identity invalid");
  return scope;
}
/** @param {any} left @param {any} right */
export function qualifiedSetsConflict(left, right) {
  if (left.authorityRoot !== right.authorityRoot || left.projectId !== right.projectId) refuse("qualified-authority", "sets disagree about coordinator association");
  if (left.workers.some(/** @param {any} a */ (a) => right.workers.some(/** @param {any} b */ (b) => a.identity.filesystemRoot === b.identity.filesystemRoot))) return true;
  const comparison = parser().compareQualifiedFences(left.fence, right.fence, left.fence.repositories);
  if (comparison.verdict === "unusable") refuse("qualified-comparison", comparison.issues.map(/** @param {any} issue */ (issue) => issue.message).join("; "));
  return comparison.verdict === "overlapping";
}
/** Whole-checkout legacy ownership conservatively covers every domain of its
 * project, including linked workers. Non-Git resources still match by path.
 * @param {string} resource @param {any} scope */
export function legacyQualifiedConflict(resource, scope) {
  const root = absolute(resource);
  if (scope.workers.some(/** @param {any} worker */ (worker) => worker.identity.filesystemRoot === root ||
      worker.identity.filesystemRoot.startsWith(`${root}${path.sep}`) || root.startsWith(`${worker.identity.filesystemRoot}${path.sep}`))) return true;
  let common;
  try { common = absolute(path.resolve(root, git(root, ["rev-parse", "--git-common-dir"]))); }
  catch (err) { if (!(err instanceof QualifiedReservationFinding) || err.code !== "qualified-worker-unavailable") throw err; return false; }
  return scope.fence.paths.some(/** @param {any} entry */ (entry) => entry.gitCommonDirectory === common);
}
