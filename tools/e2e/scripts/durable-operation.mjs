/** Local accepted commit/ref effects shared by ordinary records saves.
 * The run record owns progress; the repository correlation ref owns acceptance.
 * This primitive grants no record-validation, lifecycle, delivery or ruling right.
 * coordinatorRoot is the PRODUCT checkout root, never workspace.runtimeRoot;
 * run-record appends the checkout's ignored .supertaskr runtime itself.
 */
import { execFileSync } from "node:child_process";
import { existsSync, lstatSync, readFileSync, readdirSync, realpathSync, statSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { atomicJson, withNativeTransaction } from "./native-codex.mjs";
import { assertOperationOwnership, defaultRunIo, readReservation, recordPath, releaseReservation, RUNS_REL_PATH, sha256, takeReservation } from "./run-record.mjs";
import { operationContent, operationDigest, operationPayload, operationWork, validOperationRecord } from "./operation-record.mjs";
import {readOperationRef as readRef,operationDestinationContains as destinationContains,acceptOperationRef} from "./operation-ref.mjs";
import {validatedFixedProductPrePush} from "./fixed-product-hook.mjs";

const activeOperations = new Set();

export class DurableOperationFinding extends Error {
  /** @param {string} code */
  constructor(code) { super(`${code}: local records operation refused`); this.name = "DurableOperationFinding"; this.code = code; }
}
/** @param {string} code @returns {never} */
function refuse(code) { throw new DurableOperationFinding(code); }
/** A live PID whose start identity cannot be observed remains an owner.
 * @param {any} owner @param {ReturnType<typeof defaultRunIo>} io */
function ownerAlive(owner, io) {
  const observed = io.identity(owner.pid);
  if (observed !== null) return observed === owner.identity;
  try { process.kill(owner.pid, 0); return true; }
  catch (error) { return /** @type {NodeJS.ErrnoException} */ (error).code !== "ESRCH"; }
}
export {ownerAlive as operationOwnerAlive};
/** @param {string} root @param {string[]} args @param {string|undefined} [input] @param {Record<string,string>} [extra] */
function git(root, args, input, extra = {}) {
  try {
    return execFileSync("git", ["--no-replace-objects", "-C", root, ...args], {
      encoding: "utf8", stdio: [input === undefined ? "ignore" : "pipe", "pipe", "pipe"], ...(input === undefined ? {} : { input }),
      maxBuffer: 32 * 1024 * 1024, env: { ...process.env, GIT_NO_LAZY_FETCH: "1", GIT_OPTIONAL_LOCKS: "0", ...extra },
    }).replace(/\n$/, "");
  } catch { refuse("OPERATION_GIT"); }
}
/** No inherited routing/config injection is silently neutralized. Identity
 * environment variables are inputs to commit-tree, never repository selectors.
 */
export function checkOperationEnvironment() {
  const allowed = new Set(["GIT_AUTHOR_NAME", "GIT_AUTHOR_EMAIL", "GIT_AUTHOR_DATE", "GIT_COMMITTER_NAME", "GIT_COMMITTER_EMAIL", "GIT_COMMITTER_DATE",
    "GIT_NO_LAZY_FETCH", "GIT_OPTIONAL_LOCKS", "GIT_PAGER"]);
  if (Object.keys(process.env).some((key) => key.startsWith("GIT_") && !allowed.has(key))) refuse("OPERATION_GIT_ENVIRONMENT");
}
/** Audit actual local routing, without disabling a guard, hook or config.
 * The supported route is a normal SHA-1/SHA-256 worktree with its own object
 * store. Alternates, replacement/graft/shallow history and executable hooks
 * require separate qualification and are refused here.
 * @param {string} repositoryRoot @param {string} base @param {{forEffect?: boolean}} [options] */
export function captureOperationRepository(repositoryRoot, base, options = {}) {
  return captureRepository(repositoryRoot,base,options);
}
/** Internal protected-route capture. The generic constructor remains strict;
 * only an actual already-installed TOOL wrapper's opaque proof can qualify
 * that one pre-push hook. This grants no writer/publication admission.
 * @param {string} repositoryRoot @param {string} base @param {any} proof */
export function captureQualifiedOperationRepository(repositoryRoot,base,proof){
  const root=realpathSync(repositoryRoot),qualified=validatedFixedProductPrePush(proof,root);
  const captured=captureRepository(root,base,{},qualified);validatedFixedProductPrePush(proof,root);return captured;
}
/** @param {string} repositoryRoot @param {string} base @param {{forEffect?:boolean}} options @param {any} [qualified] */
function captureRepository(repositoryRoot,base,options,qualified){
  checkOperationEnvironment();
  let root;
  try { root = realpathSync(repositoryRoot); } catch { refuse("OPERATION_REPOSITORY"); }
  if (realpathSync(git(root, ["rev-parse", "--show-toplevel"])) !== root || git(root, ["rev-parse", "--is-bare-repository"]) !== "false") refuse("OPERATION_REPOSITORY");
  const gitDir = realpathSync(git(root, ["rev-parse", "--absolute-git-dir"]));
  const commonDir = realpathSync(git(root, ["rev-parse", "--path-format=absolute", "--git-common-dir"]));
  const objectFormat = git(root, ["rev-parse", "--show-object-format"]);
  if (!["sha1", "sha256"].includes(objectFormat)) refuse("OPERATION_OBJECT_FORMAT");
  const oid = new RegExp(`^[0-9a-f]{${objectFormat === "sha1" ? 40 : 64}}$`);
  if (!oid.test(base) || git(root, ["cat-file", "-t", base]) !== "commit") refuse("OPERATION_BASE");
  const config = git(root, ["config", "--null", "--list"]).split("\0").filter(Boolean).map((entry) => {
    const at = entry.indexOf("\n"); return [entry.slice(0, at), entry.slice(at + 1)];
  });
  const dangerous = /^(?:core\.(?:worktree|fsmonitor|alternateRefsCommand|splitIndex|sparseCheckout)|index\.sparse|extensions\.(?:refStorage|partialClone|worktreeConfig)|remote\..*\.(?:promisor|partialCloneFilter))$/i;
  if (options.forEffect !== false && config.some(([key]) => dangerous.test(/** @type {string} */ (key)))) refuse("OPERATION_GIT_CONFIG");
  if (options.forEffect !== false && (git(root, ["rev-parse", "--shared-index-path"]) !== "" ||
      config.some(([key, value]) => key?.toLowerCase() === "commit.gpgsign" && !["false", "no", "off", "0"].includes((value ?? "").toLowerCase())))) refuse("OPERATION_GIT_CONFIG");
  const hooksPaths = config.filter(([key]) => key?.toLowerCase() === "core.hookspath").map(([, value]) => path.resolve(root, /** @type {string} */ (value)));
  if (options.forEffect !== false && hooksPaths.length > 1) refuse("OPERATION_HOOK_ROUTING");
  const hooks = hooksPaths[0] ?? path.join(commonDir, "hooks");
  if (options.forEffect !== false && existsSync(hooks)) {
    if (!lstatSync(hooks).isDirectory() || lstatSync(hooks).isSymbolicLink()) refuse("OPERATION_HOOK_ROUTING");
    for (const name of readdirSync(hooks)) {
      if (!name.endsWith(".sample") && (statSync(path.join(hooks, name)).mode & 0o111) !== 0 &&
          !(qualified!==undefined&&name==="pre-push"&&qualified.directory.path===hooks&&qualified.file.path===path.join(hooks,name))) refuse("OPERATION_ACTIVE_HOOK");
    }
  }
  const objects = path.join(commonDir, "objects");
  if (realpathSync(objects) !== objects || existsSync(path.join(objects, "info", "alternates")) ||
      existsSync(path.join(objects, "info", "http-alternates")) || existsSync(path.join(commonDir, "info", "grafts")) ||
      existsSync(path.join(commonDir, "shallow")) || git(root, ["for-each-ref", "--format=%(refname)", "refs/replace"])) refuse("OPERATION_OBJECT_ROUTING");
  const identities = [root, gitDir, commonDir, objects].map((directory) => {
    const stat = statSync(directory, { bigint: true }); return { path: directory, device: String(stat.dev), inode: String(stat.ino) };
  });
  return { root, gitDir, commonDir, objectFormat, rootCommits: git(root, ["rev-list", "--max-parents=0", base]).split("\n").sort(), identities };
}
/** @param {any} input */
function request(input) {
  if (!input || typeof input !== "object" || Array.isArray(input) ||
      Object.keys(input).sort().join(",") !== ["operationId", "kind", "repositoryRoot", "targetRef", "expectedRevision", "acceptedTree", "payloadDigest", "message", ...(Object.hasOwn(input, "payload") ? ["payload"] : [])].sort().join(",") ||
      typeof input.operationId !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(input.operationId) || input.kind !== "records-save" ||
      typeof input.repositoryRoot !== "string" || typeof input.targetRef !== "string" || !input.targetRef.startsWith("refs/heads/") ||
      typeof input.expectedRevision !== "string" || typeof input.acceptedTree !== "string" ||
      typeof input.payloadDigest !== "string" || !/^sha256:[0-9a-f]{64}$/.test(input.payloadDigest) ||
      typeof input.message !== "string" || !input.message.trim() || input.message.includes("\0")) refuse("OPERATION_REQUEST");
  const repository = captureOperationRepository(input.repositoryRoot, input.expectedRevision, { forEffect: false });
  const root = repository.root;
  git(root, ["check-ref-format", input.targetRef]);
  const oid = new RegExp(`^[0-9a-f]{${repository.objectFormat === "sha1" ? 40 : 64}}$`);
  if (!oid.test(input.acceptedTree)) refuse("OPERATION_TREE");
  let payload;
  if (Object.hasOwn(input, "payload")) {
    try { payload = operationPayload(input.payload); }
    catch { refuse("OPERATION_PAYLOAD"); }
    if (operationDigest(payload) !== input.payloadDigest) refuse("OPERATION_PAYLOAD_DIGEST");
  }
  return { operationId: input.operationId, kind: "records-save", repository, targetRef: input.targetRef,
    expectedRevision: input.expectedRevision, acceptedTree: input.acceptedTree, payloadDigest: input.payloadDigest, message: input.message,
    ...(Object.hasOwn(input, "payload") ? { payload } : {}) };
}
/** @param {string} coordinatorRoot @param {string} operationId */
export function acceptedOperationPath(coordinatorRoot, operationId) { return recordPath(coordinatorRoot, `${operationWork(operationId)}-a1`); }
/** Read a strict first-class record. A corrupt record never becomes a new save.
 * @param {string} coordinatorRoot @param {string} operationId @returns {any|null} */
export function readAcceptedOperation(coordinatorRoot, operationId) {
  const file = acceptedOperationPath(coordinatorRoot, operationId);
  if (!existsSync(file)) return null;
  try {
    if (!lstatSync(file).isFile() || lstatSync(file).isSymbolicLink()) refuse("OPERATION_RECORD");
    const rec = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(readFileSync(file)));
    if (!validOperationRecord(rec) || ["failed","stopped"].includes(rec.state) && readRef(rec.resource, `refs/supertaskr/operations/${operationWork(rec.operation.id).slice(3)}`) !== null) refuse("OPERATION_RECORD");
    return rec;
  } catch { refuse("OPERATION_RECORD"); }
}
/** Exact replay uses the captured request, never newer working-file bytes.
 * Callers may inspect pending operation IDs through normal run enumeration.
 * @param {string} coordinatorRoot @param {string} operationId
 * @param {{authorize: (context: any) => unknown, onBoundary?: (boundary: string, context: any) => void, prepare?: (context: any) => unknown, prepareTree?: (context: any) => unknown}} options */
export function replayAcceptedOperation(coordinatorRoot, operationId, options) {
  const rec = readAcceptedOperation(coordinatorRoot, operationId);
  if (rec === null) refuse("OPERATION_ABSENT");
  const { repository, ...captured } = rec.operation.request;
  return executeAcceptedOperation(coordinatorRoot, { ...captured, repositoryRoot: repository.root }, options);
}
/** Read exact acceptance without executing missing work or editing progress.
 * A pending intent is null; corrupt/foreign/uncertain evidence refuses.
 * @param {string} coordinatorRoot @param {string} operationId */
export function observedAcceptedOperation(coordinatorRoot, operationId) {
  const rec = readAcceptedOperation(coordinatorRoot, operationId);
  if (rec === null) return null;
  const { repository, ...captured } = rec.operation.request;
  const current = request({ ...captured, repositoryRoot: repository.root });
  if (operationContent(current) !== operationContent(rec.operation.request)) refuse("OPERATION_CHANGED");
  if (rec.state === "stopped" || !accepted(rec)) return null;
  return { operationId, status: "accepted", commit: rec.operation.intent.commit, tree: rec.operation.intent.tree,
    ref: rec.operation.intent.ref, previousRevision: rec.operation.intent.previousRevision, attribution: "exact" };
}
/** @param {any} rec */
function expectedMessage(rec) { return `${rec.operation.request.message.trimEnd()}\n\nSupertaskr-Operation: ${rec.operation.digest}\n`; }
/** Check the stored commit independently, including its exact single parent.
 * @param {any} rec */
function validateIntent(rec) {
  const op = rec.operation, i = op.intent, root = op.request.repository.root;
  if (!i || git(root, ["show", "-s", "--format=%T%n%P", i.commit]) !== `${i.tree}\n${i.previousRevision}` ||
      git(root, ["show", "-s", "--format=%B", i.commit]) !== expectedMessage(rec)) refuse("OPERATION_COMMIT_IDENTITY");
}
/** Exact acceptance precedes new-operation current-tip and current-policy checks.
 * The correlation ref survives later branch advancement; intent is not acceptance.
 * @param {any} rec */
function accepted(rec) {
  const op = rec.operation, root = op.request.repository.root;
  const correlation = readRef(root, `refs/supertaskr/operations/${operationWork(op.id).slice(3)}`);
  if (op.intent === null) { if (correlation !== null) refuse("OPERATION_CORRELATION_FOREIGN"); return false; }
  validateIntent(rec);
  if (correlation !== null && correlation !== op.intent.commit) refuse("OPERATION_CORRELATION_FOREIGN");
  if (correlation === op.intent.commit) {
    if (op.acceptance !== null) return true;
    const tip = readRef(root, op.request.targetRef);
    if (tip !== null && destinationContains(root, op.intent.commit, tip)) return true;
    refuse("OPERATION_ACCEPTANCE_UNCERTAIN");
  }
  // Reachability does not identify the accepting operation. Missing durable
  // correlation after any destination movement is uncertain, even if this
  // exact planned commit is reachable; neither repeat nor claim its effect.
  if (op.acceptance !== null || readRef(root, op.request.targetRef) !== op.request.expectedRevision) refuse("OPERATION_ACCEPTANCE_UNCERTAIN");
  return false;
}
/** @param {string} coordinatorRoot @param {any} rec @param {boolean} recovered */
function finish(coordinatorRoot, rec, recovered) {
  const op = rec.operation, i = op.intent;
  op.acceptance = { commit: i.commit, tree: i.tree, ref: i.ref, previousRevision: i.previousRevision, attribution: "exact" };
  if (rec.state !== "finished") {
    const held = readReservation(coordinatorRoot, rec.resource);
    if (held?.attempt === rec.attempt) releaseReservation(coordinatorRoot, { resource: rec.resource, attempt: rec.attempt });
    rec.state = "finished"; rec.reservation.releasedAt = new Date().toISOString();
    rec.events.push({ at: rec.reservation.releasedAt, op: "accepted" });
    atomicJson(acceptedOperationPath(coordinatorRoot, op.id), rec);
  }
  return { operationId: op.id, status: "accepted", ...op.acceptance, recovered };
}
/** Execute one already validated exact tree under the applicable ordinary-save
 * policy. authorize must synchronously return true after checking binding/context/ownership and
 * record-change authority; durability never replaces those checks. Protected
 * delivery/publication and coordinator completion are unsupported operation kinds.
 * onBoundary is diagnostic fault injection, never an authorization switch.
 * @param {string} coordinatorRoot @param {any} input
 * @param {{authorize: (context: any) => unknown, onBoundary?: (boundary: string, context: any) => void, prepare?: (context: any) => unknown, prepareTree?: (context: any) => unknown}} options */
export function executeAcceptedOperation(coordinatorRoot, input, options) {
  if (typeof options?.authorize !== "function") refuse("OPERATION_POLICY_REQUIRED");
  const frozen = request(input), digest = operationDigest(frozen);
  coordinatorRoot = realpathSync(coordinatorRoot);
  const activeKey = `${coordinatorRoot}\0${frozen.operationId}`;
  if (activeOperations.has(activeKey)) refuse("OPERATION_OWNER_LIVE");
  activeOperations.add(activeKey);
  try { return withNativeTransaction(coordinatorRoot, { operation: "records-save-operation" }, () => {
    let rec = readAcceptedOperation(coordinatorRoot, frozen.operationId);
    if (rec !== null && (rec.operation.digest !== digest || operationContent(rec.operation.request) !== operationContent(frozen))) refuse("OPERATION_CHANGED");
    if (rec?.state === "stopped") {
      if(readReservation(coordinatorRoot,rec.resource)?.attempt === rec.attempt) releaseReservation(coordinatorRoot,{resource:rec.resource,attempt:rec.attempt});
      return stoppedResult(rec);
    }
    if (rec?.state === "failed") {
      if (readReservation(coordinatorRoot, rec.resource)?.attempt === rec.attempt) releaseReservation(coordinatorRoot, {resource: rec.resource, attempt: rec.attempt});
      refuse(rec.events.at(-1).op.slice("failed-zero-effects:".length));
    }
    if (rec !== null && accepted(rec)) return finish(coordinatorRoot, rec, true);
    const root = frozen.repository.root, at = new Date().toISOString(), io = defaultRunIo();
    captureOperationRepository(root, frozen.expectedRevision);
    if (rec !== null && rec.operation.owner.pid !== process.pid && ownerAlive(rec.operation.owner, io)) refuse("OPERATION_OWNER_LIVE");
    const ownerIdentity = io.identity(process.pid);
    if (ownerIdentity === null) refuse("OPERATION_OWNER_UNKNOWN");
    if (readRef(root, frozen.targetRef) !== frozen.expectedRevision) refuse("OPERATION_STALE_REF");
    if (rec === null) {
      const work = operationWork(frozen.operationId), assignment = { kind: "operation", id: work, role: "records-save", resource: root };
      rec = { version: 1, recordKind: "operation", attempt: `${work}-a1`, state: "starting", assignment,
        assignmentDigest: sha256(JSON.stringify(assignment)), writer: true, resource: root,
        reservation: { file: null, takenAt: at, releasedAt: null }, execution: null, admission: null,
        operation: { version: 1, id: frozen.operationId, kind: "records-save", request: frozen, digest,
          owner: { pid: process.pid, identity: ownerIdentity, token: randomUUID() }, createdAt: at, intent: null, acceptance: null },
        events: [{ at, op: "prepare" }] };
      rec.events.push({ at, op: "capture-before-effects" });
    }
    let held = readReservation(coordinatorRoot, root);
    if (held !== null && held.attempt !== rec.attempt && /^OP-[0-9a-f]{64}-a1$/.test(held.attempt)) {
      // A subsequent ordinary save may encounter an accepted predecessor whose
      // process died before releasing ownership/result. Reconcile its actual
      // effect before admitting this writer; live or unknown owners still hold.
      let prior;
      try { prior = JSON.parse(readFileSync(recordPath(coordinatorRoot, held.attempt), "utf8")); }
      catch { refuse("OPERATION_RESOURCE_RESERVED"); }
      if (!validOperationRecord(prior) || prior.resource !== root ||
          (prior.operation.owner.pid !== process.pid && ownerAlive(prior.operation.owner, io)) || !accepted(prior)) refuse("OPERATION_RESOURCE_RESERVED");
      finish(coordinatorRoot, prior, true);
      held = readReservation(coordinatorRoot, root);
    }
    if (held !== null && held.attempt !== rec.attempt) refuse("OPERATION_RESOURCE_RESERVED");
    assertOperationOwnership(coordinatorRoot, { resource: root, attempt: rec.attempt });
    const newlyAcquired = held === null;
    if (newlyAcquired) rec.reservation.file = takeReservation(coordinatorRoot, { resource: root, attempt: rec.attempt, role: "records-save", at }).file;
    let published = existsSync(acceptedOperationPath(coordinatorRoot, frozen.operationId));
    try {
    rec.operation.owner = { pid: process.pid, identity: ownerIdentity, token: randomUUID() };
    atomicJson(acceptedOperationPath(coordinatorRoot, frozen.operationId), rec);
    published = true;
    options.onBoundary?.("prepared", structuredClone(rec));
    const treeContext = { operationId: frozen.operationId, request: structuredClone(frozen), digest, intent: structuredClone(rec.operation.intent),
      phase: "objects", resumingPreparation: rec.events.some((/** @type {any} */ event) => event.op === "consumer-prepare") };
    const treePermission = options.authorize(structuredClone(treeContext));
    if (treePermission && typeof /** @type {any} */ (treePermission).then === "function") refuse("OPERATION_ASYNC_POLICY");
    if (treePermission !== true) refuse("OPERATION_POLICY_REFUSED");
    if (!rec.events.some((/** @type {any} */ event) => event.op === "objects-start")) {
      rec.events.push({ at: new Date().toISOString(), op: "objects-start" });
      atomicJson(acceptedOperationPath(coordinatorRoot, frozen.operationId), rec);
    }
    if (options.prepareTree) {
      const prepared = options.prepareTree(structuredClone(treeContext));
      if (prepared && typeof /** @type {any} */ (prepared).then === "function") refuse("OPERATION_ASYNC_PREPARATION");
    }
    if (git(root, ["cat-file", "-t", frozen.acceptedTree]) !== "tree") refuse("OPERATION_TREE");
    options.onBoundary?.("tree-prepared", structuredClone(rec));
    if (rec.operation.intent === null) {
      // Tree preparation may have been interrupted or changed current context.
      // Commit-object creation is another actual repository write.
      if(operationContent(readAcceptedOperation(coordinatorRoot,frozen.operationId))!==operationContent(rec))refuse("OPERATION_CHANGED");
      if(operationContent(captureOperationRepository(root,frozen.expectedRevision))!==operationContent(frozen.repository))refuse("OPERATION_REPOSITORY_CHANGED");
      assertOperationOwnership(coordinatorRoot,{resource:root,attempt:rec.attempt});
      if(readReservation(coordinatorRoot,root)?.attempt!==rec.attempt)refuse("OPERATION_RESOURCE_RESERVED");
      const commitPermission=options.authorize(structuredClone(treeContext));
      if(commitPermission&&typeof /** @type {any} */(commitPermission).then==="function")refuse("OPERATION_ASYNC_POLICY");
      if(commitPermission!==true)refuse("OPERATION_POLICY_REFUSED");
      const commit = git(root, ["commit-tree", frozen.acceptedTree, "-p", frozen.expectedRevision], expectedMessage(rec),
        { GIT_AUTHOR_DATE: rec.operation.createdAt, GIT_COMMITTER_DATE: rec.operation.createdAt });
      rec.operation.intent = { commit, tree: frozen.acceptedTree, previousRevision: frozen.expectedRevision, ref: frozen.targetRef,
        correlationRef: `refs/supertaskr/operations/${operationWork(frozen.operationId).slice(3)}` };
      rec.events.push({ at: new Date().toISOString(), op: "intent" });
      atomicJson(acceptedOperationPath(coordinatorRoot, frozen.operationId), rec);
    }
    options.onBoundary?.("intent-persisted", structuredClone(rec));
    const context = { operationId: frozen.operationId, request: structuredClone(frozen), digest, intent: structuredClone(rec.operation.intent),
      phase: "working", resumingPreparation: rec.events.some((/** @type {any} */ event) => event.op === "consumer-prepare") };
    if (options.prepare) {
      const permission = options.authorize(structuredClone(context));
      if (permission && typeof /** @type {any} */ (permission).then === "function") refuse("OPERATION_ASYNC_POLICY");
      if (permission !== true) refuse("OPERATION_POLICY_REFUSED");
      rec.events.push({ at: new Date().toISOString(), op: "consumer-prepare" });
      atomicJson(acceptedOperationPath(coordinatorRoot, frozen.operationId), rec);
      const prepared = options.prepare(structuredClone(context));
      if (prepared && typeof /** @type {any} */ (prepared).then === "function") refuse("OPERATION_ASYNC_PREPARATION");
      rec.events.push({ at: new Date().toISOString(), op: "consumer-prepared" });
      atomicJson(acceptedOperationPath(coordinatorRoot, frozen.operationId), rec);
    }
    // Re-audit routing and frozen identity after preparation, at the effect.
    if (operationContent(captureOperationRepository(root, frozen.expectedRevision)) !== operationContent(frozen.repository)) refuse("OPERATION_REPOSITORY_CHANGED");
    assertOperationOwnership(coordinatorRoot, { resource: root, attempt: rec.attempt });
    const permission = options.authorize({ ...structuredClone(context), phase: "ref" });
    if (permission && typeof /** @type {any} */ (permission).then === "function") refuse("OPERATION_ASYNC_POLICY");
    if (permission !== true) refuse("OPERATION_POLICY_REFUSED");
    validateIntent(rec);
    const i = rec.operation.intent;
    acceptOperationRef(root,i);
    options.onBoundary?.("ref-accepted", structuredClone(rec));
    if (!accepted(rec)) refuse("OPERATION_ACCEPTANCE_UNCERTAIN");
    options.onBoundary?.("before-result", structuredClone(rec));
    return finish(coordinatorRoot, rec, false);
    } catch (error) {
      // A captured request is immutable even when it was denied before any
      // repository effect. Release only this owner's reservation; old records
      // without the explicit capture marker remain conservative pending input.
      const untouched = rec.operation.intent === null && rec.operation.acceptance === null &&
        rec.events.some((/** @type {any} */ event) => event.op === "capture-before-effects") &&
        !rec.events.some((/** @type {any} */ event) => ["objects-start", "consumer-prepare", "consumer-prepared", "intent"].includes(event.op));
      if (untouched && published) {
        const raw = /** @type {any} */ (error)?.code;
        const code = typeof raw === "string" && /^[A-Za-z][A-Za-z0-9_-]{0,127}$/.test(raw) ? raw : "OPERATION_PREPARATION_REFUSED";
        rec.state = "failed"; rec.reservation.releasedAt = new Date().toISOString();
        rec.events.push({ at: rec.reservation.releasedAt, op: `failed-zero-effects:${code}` });
        // Publish terminal evidence before releasing; a failed publication stays
        // pending and owned for conservative recovery instead of lying closed.
        atomicJson(acceptedOperationPath(coordinatorRoot, frozen.operationId), rec);
        releaseReservation(coordinatorRoot, { resource: root, attempt: rec.attempt });
      } else if (!published && newlyAcquired) releaseReservation(coordinatorRoot, { resource: root, attempt: rec.attempt });
      throw error;
    }
  }); } finally { activeOperations.delete(activeKey); }
}

/** Own a complete synchronous ordinary-save preparation/materialization and
 * accepted ref transition under the same existing transaction and reservation.
 * The consumer must make prepare idempotent for its exact frozen bytes and
 * separately qualify validation, lifecycle authority and partial file/index
 * recovery. Historical accepted retry skips prepare and returns the old result.
 * @param {string} coordinatorRoot @param {any} input
 * @param {{authorize: (context: any) => unknown, onBoundary?: (boundary: string, context: any) => void, prepareTree?: (context: any) => unknown}} options
 * @param {(context: any) => unknown} prepare */
export function withAcceptedOperation(coordinatorRoot, input, options, prepare) {
  if (typeof prepare !== "function") refuse("OPERATION_PREPARATION_REQUIRED");
  return executeAcceptedOperation(coordinatorRoot, input, { ...options, prepare });
}

/** Strict discovery of the owned operation namespace. A malformed physical row
 * is unavailable evidence, never silently omitted like a best-effort UI list.
 * @param {string} coordinatorRoot @returns {any[]} */
export function listAcceptedOperations(coordinatorRoot) {
  checkOperationEnvironment(); coordinatorRoot = realpathSync(coordinatorRoot);
  const home = path.join(coordinatorRoot, RUNS_REL_PATH);
  if (!existsSync(home)) return [];
  if (!lstatSync(home).isDirectory() || lstatSync(home).isSymbolicLink()) refuse("OPERATION_RECORD");
  const result = [];
  for (const name of readdirSync(home).sort()) {
    if (!name.startsWith("OP-")) continue;
    const dir = path.join(home, name);
    if (!/^OP-[0-9a-f]{64}$/.test(name) || !lstatSync(dir).isDirectory() || lstatSync(dir).isSymbolicLink()) refuse("OPERATION_RECORD");
    const files = readdirSync(dir);
    if (files.length !== 1 || files[0] !== `${name}-a1.json`) refuse("OPERATION_RECORD");
    const file = path.join(dir, files[0]);
    if (!lstatSync(file).isFile() || lstatSync(file).isSymbolicLink()) refuse("OPERATION_RECORD");
    let row;
    try { row = JSON.parse(new TextDecoder("utf-8", {fatal:true}).decode(readFileSync(file))); }
    catch { refuse("OPERATION_RECORD"); }
    if (!validOperationRecord(row) || row.assignment.id !== name) refuse("OPERATION_RECORD");
    const rec = readAcceptedOperation(coordinatorRoot, row.operation.id);
    if (rec === null) refuse("OPERATION_RECORD");
    result.push(rec);
  }
  return result;
}
/** Notification bookkeeping in the same canonical operation row. The exact
 * original acceptance is required; a failed ack cannot revoke a local save.
 * @param {string} coordinatorRoot @param {string} operationId @param {string} commit */
export function acknowledgeAcceptedOperation(coordinatorRoot, operationId, commit) {
  coordinatorRoot = realpathSync(coordinatorRoot);
  return withNativeTransaction(coordinatorRoot, {operation:"records-save-acknowledge"}, () => {
    const rec = readAcceptedOperation(coordinatorRoot, operationId);
    if (rec === null || rec.state === "failed" || rec.operation.intent?.commit !== commit || observedAcceptedOperation(coordinatorRoot, operationId) === null) refuse("OPERATION_ACKNOWLEDGEMENT");
    finish(coordinatorRoot, rec, true);
    if (!rec.events.some((/** @type {any} */ event) => event.op === "client-acknowledged")) {
      rec.events.push({at:new Date().toISOString(), op:"client-acknowledged"});
      atomicJson(acceptedOperationPath(coordinatorRoot, operationId), rec);
    }
    return {status:"acknowledged", operationId, commit};
  });
}

/** @param {any} rec */
function stoppedResult(rec) {return {status:"stopped",operationId:rec.operation.id,disposition:structuredClone(rec.operation.disposition)};}
/** Stop only a proven unaccepted operation before materialization. Objects and
 * exact intent stay retained; this is not a claim of zero repository effects.
 * @param {string} coordinatorRoot @param {string} operationId
 * @param {{authorizeDisposition:(context:any)=>any}} options */
export function stopUnmaterializedAcceptedOperation(coordinatorRoot,operationId,options) {
  if(typeof options?.authorizeDisposition !== "function") refuse("OPERATION_DISPOSITION_POLICY");
  coordinatorRoot=realpathSync(coordinatorRoot);
  return withNativeTransaction(coordinatorRoot,{operation:"records-save-disposition"},()=>{
    const rec=readAcceptedOperation(coordinatorRoot,operationId);
    if(rec === null) refuse("OPERATION_ABSENT");
    if(rec.state === "stopped") {
      if(readReservation(coordinatorRoot,rec.resource)?.attempt === rec.attempt) releaseReservation(coordinatorRoot,{resource:rec.resource,attempt:rec.attempt});
      return stoppedResult(rec);
    }
    if(["finished","failed"].includes(rec.state) || activeOperations.has(`${coordinatorRoot}\0${operationId}`) ||
      ownerAlive(rec.operation.owner,defaultRunIo()) || !rec.events.some((/** @type {any} */ e)=>e.op === "capture-before-effects") ||
      !rec.events.some((/** @type {any} */ e)=>e.op === "objects-start") ||
      rec.events.some((/** @type {any} */ e)=>["consumer-prepare","consumer-prepared"].includes(e.op))) refuse("OPERATION_DISPOSITION_UNAVAILABLE");
    const op=rec.operation, repository=captureOperationRepository(op.request.repository.root,op.request.expectedRevision,{forEffect:false});
    if(operationContent(repository) !== operationContent(op.request.repository) || op.acceptance !== null ||
      readRef(rec.resource,op.request.targetRef) !== op.request.expectedRevision ||
      readRef(rec.resource,`refs/supertaskr/operations/${operationWork(op.id).slice(3)}`) !== null) refuse("OPERATION_DISPOSITION_UNAVAILABLE");
    if(op.intent !== null) validateIntent(rec);
    const held=readReservation(coordinatorRoot,rec.resource);
    if(held?.attempt !== rec.attempt) refuse("OPERATION_DISPOSITION_UNAVAILABLE");
    const proof=options.authorizeDisposition({operationId,request:structuredClone(op.request),digest:op.digest,intent:structuredClone(op.intent)});
    if(proof && typeof proof.then === "function") refuse("OPERATION_ASYNC_POLICY");
    const at=new Date().toISOString();
    op.disposition={version:1,kind:"stopped-before-materialization",at,requestDigest:op.digest,proof};
    rec.state="stopped";rec.reservation.releasedAt=at;rec.events.push({at,op:"stopped-before-materialization"});
    if(!validOperationRecord(rec)) refuse("OPERATION_DISPOSITION_POLICY");
    // Keep the hold when durable publication fails. A terminal retry can finish
    // release of only this exact owner; it never restarts the original work.
    atomicJson(acceptedOperationPath(coordinatorRoot,operationId),rec);
    releaseReservation(coordinatorRoot,{resource:rec.resource,attempt:rec.attempt});
    return stoppedResult(rec);
  });
}
