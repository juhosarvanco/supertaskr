/** Read-only private approval preview (T-352). A reading is never a grant,
 * reservation or worker assignment. Generated consumers load after validation.
 */
import { execFileSync } from "node:child_process";
import { existsSync, lstatSync, readFileSync, readdirSync, realpathSync } from "node:fs";
import path from "node:path";
import { captureCommittedInputs, captureTaskSnapshot } from "./records.mjs";
import { normalizeContextRequest } from "./records-context.mjs";
import { resolveWorkspace } from "./workspace.mjs";
import {validatePublicationProcessProof} from "./qualified-publication-process.mjs";

export class AdmissionPreflightFinding extends Error {
  /** @param {string} code */
  constructor(code) { super(`${code}: private approval preflight refused`); this.name = "AdmissionPreflightFinding"; this.code = code; }
}
/** Error details from parsers, Git, policy and malformed JSON can contain
 * private history. Only named codes cross the ordinary display boundary.
 * @param {string} code @returns {never} */
function refuse(code) { throw new AdmissionPreflightFinding(code); }
/** @param {any} err @param {string} fallback */
function finding(err, fallback) {
  return new AdmissionPreflightFinding(typeof err?.code === "string" && /^[A-Za-z][A-Za-z0-9_-]*$/.test(err.code) ? err.code : fallback);
}
/** @param {any} value @returns {any} */
function freeze(value) {
  if (value && typeof value === "object") { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}
/** @param {any} value @param {string[]} keys @param {string[]} [optional] */
function shape(value, keys, optional = []) {
  if (!value || typeof value !== "object" || Array.isArray(value) || keys.some((key) => !Object.hasOwn(value, key)) ||
      Object.keys(value).some((key) => ![...keys, ...optional].includes(key))) refuse("preflight-request-shape");
}
/** Validate and detach every caller field before any generated consumer loads.
 * The optional fence is an equality assertion, never a source of scope.
 * @param {any} input */
export function normalizeAdmissionPreflight(input) {
  shape(input, ["version", "authorityRoot", "projectId", "revisions", "taskId", "roles", "legacyTokenMap", "admission"], ["assertedFence"]);
  if (input.version !== 1 || typeof input.authorityRoot !== "string" || !path.isAbsolute(input.authorityRoot) ||
      /[\u0000-\u001f\u007f]/.test(input.authorityRoot) || typeof input.projectId !== "string" ||
      !input.projectId.trim() || input.projectId.trim() !== input.projectId || typeof input.taskId !== "string" || !/^T-\d+(?:-s\d+)?$/.test(input.taskId)) refuse("preflight-request-identity");
  shape(input.revisions, ["product", "records"]);
  if (Object.values(input.revisions).some((revision) => typeof revision !== "string" || !/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(revision))) refuse("preflight-request-revision");
  if (!Array.isArray(input.roles) || input.roles.length === 0 || new Set(input.roles).size !== input.roles.length ||
      input.roles.some(/** @param {string} role */ (role) => !["product", "records"].includes(role))) refuse("preflight-request-roles");
  shape(input.admission, ["boundary", "role", "kind", "parent", "evidence", "scope", "attempt"]);
  const a = input.admission;
  if (!["lane-cut", "child-start", "re-entry", "replacement"].includes(a.boundary) ||
      !["executor", "verifier", "integrator"].includes(a.role) || !["explicit", "derived"].includes(a.kind) ||
      [a.parent, a.evidence, a.scope].some((value) => typeof value !== "string") ||
      (a.attempt !== null && (typeof a.attempt !== "string" || !new RegExp(`^${input.taskId}-a[0-9]+$`).test(a.attempt))) ||
      (["lane-cut", "child-start"].includes(a.boundary) && a.attempt !== null) ||
      (a.kind === "explicit" && (a.parent !== "" || a.evidence !== "")) ||
      !["repair", "product-change", "waived-verification"].includes(a.scope)) refuse("preflight-request-admission");
  let ownership;
  try { ownership = normalizeContextRequest({ version: 1, legacyTokenMap: input.legacyTokenMap, inputs: [] }).legacyTokenMap; }
  catch (error) { throw finding(error, "preflight-request-ownership"); }
  try { return freeze(JSON.parse(JSON.stringify({ ...input, legacyTokenMap: ownership }))); }
  catch { refuse("preflight-request-shape"); }
}

/** JSON.parse erases repeated members; refuse them before accepting a request.
 * @param {string} file */
export function readAdmissionPreflightRequest(file) {
  let text, input;
  try { text = new TextDecoder("utf-8", { fatal: true }).decode(readFileSync(file)); input = JSON.parse(text); }
  catch { refuse("preflight-request-unreadable"); }
  const tokens = text.match(/"(?:\\[\s\S]|[^"\\])*"|[{}\[\],:]|[^\s{}\[\],:]+/g) ?? [];
  let at = 0;
  function visit() {
    const token = tokens[at++];
    if (token === "{") {
      const names = new Set();
      while (tokens[at] !== "}") {
        const name = JSON.parse(/** @type {string} */ (tokens[at++]));
        if (names.has(name)) refuse("preflight-request-duplicate-member");
        names.add(name); at += 1; visit();
        if (tokens[at] !== ",") break;
        at += 1;
      }
      at += 1;
    } else if (token === "[") {
      while (tokens[at] !== "]") { visit(); if (tokens[at] !== ",") break; at += 1; }
      at += 1;
    }
  }
  // Deep malformed JSON must keep the named, private request boundary too.
  try { visit(); }
  catch (error) { throw finding(error, "preflight-request-shape"); }
  return normalizeAdmissionPreflight(input);
}
/** @param {string} root @param {string[]} args */
function git(root, args) {
  return execFileSync("git", ["--no-replace-objects", "-C", root, ...args], { encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, GIT_NO_LAZY_FETCH: "1", GIT_OPTIONAL_LOCKS: "0" } });
}
/** allRecords intentionally skips unreadable records. Check every physical
 * work-record input first, then derive the existing ledger without replacing it.
 * No native inventory helper that persists holds or takes locks is called.
 * @param {string} root @param {any} runs @param {any} native @param {string} taskId @param {any} [ownOperation] */
function completeRecords(root, runs, native, taskId,ownOperation=null) {
  const home = path.join(root, runs.RUNS_REL_PATH);
  const records = runs.allRecords(root);
  let count = 0;
  if (existsSync(home)) for (const work of readdirSync(home)) {
    const dir = path.join(home, work);
    if (!lstatSync(dir).isDirectory() || lstatSync(dir).isSymbolicLink()) refuse("preflight-ledger-unavailable");
    const files=readdirSync(dir);
    if(work.startsWith("OP-") && (!/^OP-[0-9a-f]{64}$/.test(work) || files.length !== 1 || files[0] !== `${work}-a1.json`))refuse("preflight-ledger-unavailable");
    for (const name of files) {
      if (work === "reservations" && !/^reservations-a\d+\.json$/.test(name)) continue;
      if (!name.endsWith(".json")) continue;
      let rec;
      try {
        const file = path.join(dir, name);
        if (!lstatSync(file).isFile() || lstatSync(file).isSymbolicLink()) refuse("preflight-ledger-unavailable");
        rec = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(readFileSync(file)));
      } catch { refuse("preflight-ledger-unavailable"); }
      // Coordinator effects share canonical progress storage, but confer no
      // worker or implementation admission. Every physical operation must pass
      // its strict schema and exact filename; unknown inputs still refuse.
      if (rec.recordKind === "operation" || rec.assignment?.kind === "operation") {
        if (!runs.validOperationRecord(rec) || work !== rec.assignment.id || name !== `${rec.attempt}.json`) refuse("preflight-ledger-unavailable");
        if (["failed","stopped"].includes(rec.state)) {
          const ref = `refs/supertaskr/operations/${rec.assignment.id.slice(3)}`;
          try { if (git(rec.resource, ["for-each-ref", "--format=%(refname)", ref]) !== "") refuse("preflight-ledger-unavailable"); }
          catch { refuse("preflight-ledger-unavailable"); }
        }
        if (!runs.TERMINAL_STATES.includes(rec.state) && !(ownOperation !== null && rec.operation.kind === "qualified-delivery" &&
            rec.attempt === ownOperation.attempt && rec.operation.digest === ownOperation.operation.digest &&
            consumers.qualifier.qualifiedContent(rec) === consumers.qualifier.qualifiedContent(ownOperation))) refuse("preflight-operation-pending");
        count += 1;
        continue;
      }
      if (rec.version !== runs.RECORD_VERSION || rec.attempt !== `${work}${name.slice(work.length, -5)}` ||
          !new RegExp(`^${work.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}-a[0-9]+\\.json$`).test(name) ||
          !runs.STATES.includes(rec.state) || rec.assignment?.id !== work || !["card", "consultation"].includes(rec.assignment.kind) ||
          ["role", "resource", "harness", "model", "effort", "base", "brief", "cwd", "deadline", "budget"].some((key) => typeof rec.assignment[key] !== "string" || !rec.assignment[key].trim()) ||
          rec.assignmentDigest !== runs.sha256(JSON.stringify(rec.assignment)) ||
          !Object.hasOwn(rec, "admission")) refuse("preflight-ledger-unavailable");
      if (rec.admission !== null && (!rec.admission || typeof rec.admission !== "object" ||
          rec.admission.card !== work || !Number.isInteger(rec.admission.revision) || rec.admission.revision < 0 || typeof rec.admission.blob !== "string" ||
          !["explicit", "derived", "unenforced"].includes(rec.admission.kind))) refuse("preflight-ledger-unavailable");
      count += 1;
    }
  }
  if (count !== records.length) refuse("preflight-ledger-unavailable");
  // This existing reader validates native state without persisting failures.
  // A version it cannot place must not disappear from the policy evidence.
  const nativeRecords = native.allNativeRecords(root);
  if (nativeRecords.length !== records.filter(/** @param {any} rec */ (rec) => rec.native !== undefined).length) refuse("preflight-attempt-evidence-unavailable");
  for (const rec of nativeRecords) {
    if (rec.assignment.id !== taskId || native.activeNativeHolds(rec).length === 0) continue;
    const collection = rec.native.collection;
    // A later diagnostic broadcast does not undo an independently observed
    // historical ending. This reading neither clears it nor readmits a worker.
    const closed = runs.TERMINAL_STATES.includes(rec.state) &&
      typeof rec.execution?.endedAt === "string" && Number.isFinite(Date.parse(rec.execution.endedAt)) &&
      collection?.eligible === true && collection.actualIndependentCheck === true && collection.phase === "collect" &&
      collection.terminalStateAuthority === "T-311" && typeof collection.checkedAt === "string" &&
      Date.parse(collection.checkedAt) >= Date.parse(rec.execution.endedAt) &&
      Array.isArray(collection.ownedJobs) && collection.ownedJobs.length === 0 &&
      Array.isArray(collection.inflight) && collection.inflight.length === 0 && rec.native.inflight.length === 0 &&
      rec.events?.some(/** @param {any} event */ (event) => event.op === "collect") &&
      (rec.writer === false && rec.resource === null || rec.writer === true && typeof rec.reservation?.releasedAt === "string" &&
        Number.isFinite(Date.parse(rec.reservation.releasedAt)));
    if (!closed) refuse("preflight-attempt-evidence-unavailable");
  }
  return records;
}

export const ADMISSION_PREFLIGHT_LIMITS = Object.freeze([
  "Preparation preview only; no admission, approval consumption, reservation or execution has occurred.",
  "Committed origins and this returned reading are immutable; grant, pause and ledger are current observations, not an atomic reservation.",
  "Every consuming lifecycle must recapture and revalidate at its actual admission boundary.",
  "This preview grants no qualified native launch or dispatch; consuming lifecycles must recapture at actual admission.",
]);

/** Dependencies must finish loading before a consumer enters a synchronous
 * authority transaction. No Promise returned by this module is authority.
 * @type {any} */
let consumers;

/** Public read-only entry. Integrity bytes are detached private copies exposed
 * only by a nonserializable accessor, following the existing capture contract.
 * @param {any} input */
export async function admissionPreflight(input) {
  const request = normalizeAdmissionPreflight(input);
  await loadQualifiedDeliveryPolicy();
  return captureAdmission(request);
}
/** Load existing policy consumers before a synchronous delivery transaction.
 * This does not admit an operation or change any admission boundary. */
export async function loadQualifiedDeliveryPolicy(){
  let qualifier, parser, inert, policy, runs, native;
  try {
    qualifier = await import("./qualified-reservation.mjs");
    parser = await import("../../../lib/parser/dist/pure.js");
    inert = await import("../../../lib/parser/dist/inert-spans.js");
  }
  catch { refuse("preflight-qualifier-unavailable"); }
  try { policy = await import("./dispatch-brief.mjs"); runs = await import("./run-record.mjs"); native = await import("./native-codex.mjs"); }
  catch { refuse("preflight-policy-unavailable"); }
  consumers = { qualifier, parser, inert, policy, runs, native };
}

/** Strict original-ledger reading for the currently held qualified operation.
 * Only its exact owned physical row may be pending; ordinary preflight retains
 * its existing refusal of every pending operation. Current grant/pause/drift
 * remains the same canonical integrator re-entry policy over retained bytes.
 * A fixed publication child may redeem actual in-process OS ancestry proof;
 * the canonical row/claims/policy are unchanged and ownership is never adopted.
 * @param {string} root @param {any} source @param {any} [ownOperation] @param {any} [childProof] */
export function qualifiedDeliveryPhasePolicy(root,source,ownOperation=null,childProof=null){
 if(!consumers)refuse("preflight-consumers-not-loaded");const {runs,native}=consumers;
 if(ownOperation !== null){
  if(!runs.validOperationRecord(ownOperation) || ownOperation.operation.kind !== "qualified-delivery" || ownOperation.operation.request.coordinator.root !== realpathSync(root))refuse("preflight-operation-owner");
  if(childProof===null){
   if(ownOperation.operation.owner.pid !== process.pid || ownOperation.operation.owner.identity !== runs.defaultRunIo().identity(process.pid))refuse("preflight-operation-owner");
  }else validatePublicationProcessProof(childProof,ownOperation);
  for(const claim of ownOperation.operation.claims){
   if(claim.file !== runs.reservationPath(root,claim.resource) || runs.readReservation(root,claim.resource)?.attempt !== ownOperation.attempt)refuse("preflight-operation-owner");
   runs.assertOperationOwnership(root,{resource:claim.resource,attempt:ownOperation.attempt});
  }
 }
 completeRecords(root,runs,native,source.assignment.id,ownOperation);
 return runs.qualifiedPhasePolicy(root,source,"integrator","re-entry");
}

/** Synchronous recapture using already loaded dependencies. The native
 * consumer supplies reconciled worker evidence before selecting re-entry.
 * @param {any} input @param {boolean} [reconciled] @param {string|null} [resource] */
function captureAdmission(input, reconciled = false, resource = null) {
  const request = normalizeAdmissionPreflight(input);
  if (!consumers) refuse("preflight-consumers-not-loaded");
  const { qualifier, parser, inert, policy, runs, native } = consumers;
  try {
    const workspace = resolveWorkspace({ productRoot: request.authorityRoot, mode: "product-only" });
    // Records supports sha256 independently; grant blob validation and its
    // approved-object consumer support sha1 only. Never shorten an identity.
    for (const root of new Set([workspace.productRoot, workspace.recordsRoot])) {
      if (git(root, ["rev-parse", "--show-object-format"]).trim() !== "sha1") refuse("preflight-object-format-unsupported");
    }
    const selected = { productRoot: request.authorityRoot, productRevision: request.revisions.product,
      recordsRevision: request.revisions.records, taskId: request.taskId };
    const capture = captureCommittedInputs(selected);
    const snapshot = captureTaskSnapshot(selected, capture);
    const canonical = qualifier.captureQualifiedInputs(request);
    const registry = capture.paths("records").filter((file) => canonical.receipt.registry.some(/** @param {any} entry */ (entry) => entry.path === file))
      .map((file) => capture.read("records", file));
    const receipt = { ...snapshot.receipt, legacyTokenMap: request.legacyTokenMap,
      registry: registry.map((entry) => ({ path: entry.path, blobId: entry.blobId, mode: entry.mode })) };
    if (qualifier.qualifiedContent(receipt) !== qualifier.qualifiedContent(canonical.receipt)) refuse("preflight-capture-changed");
    if (snapshot.bytes.length === 0 || !/^[0-9a-f]{40}$/.test(snapshot.task.blobId)) refuse("preflight-current-bytes-unavailable");
    if (canonical.fence.paths.some(/** @param {any} entry */ (entry) => !request.roles.includes(entry.role))) refuse("preflight-scope-role-missing");
    if (Object.hasOwn(request, "assertedFence") && qualifier.qualifiedContent(request.assertedFence) !== qualifier.qualifiedContent(canonical.fence)) refuse("preflight-scope-assertion-mismatch");
    const state = policy.grantState(canonical.authorityRoot);
    const records = completeRecords(canonical.authorityRoot, runs, native, request.taskId);
    const ledger = policy.admissionLedger(records, runs.TERMINAL_STATES);
    const a = request.admission;
    // These boundaries also depend on reconciled execution and worker facts.
    // This pre-worker request carries none of the consumer's binding evidence.
    if (!reconciled && ["re-entry", "replacement"].includes(a.boundary)) refuse(a.attempt === null ? "preflight-attempt-evidence-unavailable" : "preflight-worker-evidence-unavailable");
    const approvedBlob = state.block?.current?.cards.get(request.taskId);
    let approved = null;
    let approvedBytes = null;
    if (approvedBlob !== undefined) {
      try {
        if (!/^[0-9a-f]{40}$/.test(approvedBlob)) refuse("preflight-object-format-unsupported");
        approvedBytes = execFileSync("git", ["--no-replace-objects", "-C", capture.receipt.recordsRoot, "cat-file", "blob", approvedBlob], {
          stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, GIT_NO_LAZY_FETCH: "1", GIT_OPTIONAL_LOCKS: "0" },
        });
        approved = new TextDecoder("utf-8", { fatal: true }).decode(approvedBytes);
      } catch { refuse("preflight-approved-bytes-unavailable"); }
      if (approved.length === 0) refuse("preflight-approved-bytes-unavailable");
    }
    const board = new Map(capture.tasks.map((task) => [task.id, String(task.fields.status)]));
    if (state.block?.current?.until && !board.has(state.block.current.until)) refuse("preflight-endpoint-evidence-unavailable");
    if (a.kind === "derived" && a.parent !== "" && !board.has(a.parent)) refuse("preflight-recovery-evidence-unavailable");
    /** @type {any} */
    let admission;
    const refusals = [];
    try {
      admission = policy.admit(state, { ...a, card: request.taskId, work: "card", blob: snapshot.task.blobId,
        cardText: snapshot.content, approvedText: () => approved, resource, board }, ledger);
    } catch (error) { const safe = finding(error, "preflight-policy-refused"); refusals.push({ code: safe.code, message: safe.message }); }
    // Reuse the parser's position-preserving structural view, then slice the
    // original capture once. Literal examples cannot select a private boundary.
    const body = parser.extractFrontmatter(snapshot.content, snapshot.task.relativePath).body;
    const privateStart = /^ {0,3}##[ \t]+(?:Implementation notes|Verdicts|History|Reports|Approval history|Archived grant history|Repair ledger)(?:[ \t]+#+)?[ \t]*(?:\r?\n|$)/im.exec(inert.blankInertSpans(body).content)?.index ?? body.length;
    const contract = snapshot.content.slice(0, snapshot.content.length - body.length + privateStart).trimEnd();
    const preview = {
      view: "Private approval preflight", permitted: refusals.length === 0,
      status: refusals.length === 0 ? "currently-permitted-preparation" : "refused",
      admitted: false, reserved: false, started: false, consumed: false,
      taskId: request.taskId, projectId: request.projectId,
      boundary: a.boundary, role: a.role, kind: a.kind,
      grant: { revision: state.revision, digest: state.store.digest, enforced: state.enforced,
        approval: state.approval, recovery: state.recovery, paused: state.pause?.scope ?? null },
      policy: admission === undefined ? null : { reuses: admission.reuses, mechanicalDrift: admission.drift.length > 0 },
      contract,
      receipt: canonical.receipt,
      scope: canonical.fence, origins: request.roles.map(/** @param {"product"|"records"} role */ (role) => ({ role,
        repository: capture.repositories[role], commit: request.revisions[role],
        objectFormat: role === "records" ? capture.receipt.objectFormat : capture.receipt.productObjectFormat })),
      refusals, limits: ADMISSION_PREFLIGHT_LIMITS,
      /** @param {"current"|"approved"|number} which */
      inputBytes(which) {
        if (which === "current") return snapshot.bytes;
        if (which === "approved" && approvedBytes !== null) return Buffer.from(approvedBytes);
        if (typeof which === "number" && registry[which]) return registry[which].bytes;
        refuse("preflight-input-unavailable");
      },
      // This accessor, like inputBytes, is deliberately absent from JSON.
      admission() { return admission; },
    };
    return freeze(preview);
  } catch (error) { throw finding(error, "preflight-input-unavailable"); }
}

/** Actual admission always recaptures inside the caller's transaction and
 * reuses admit(), including the live pause and existing run-record ledger.
 * A permitted preview cannot be replayed after any authority input drifts.
 * @param {any} request @param {any} earlier @param {boolean} [reconciled] @param {string|null} [resource] */
export function decisiveQualifiedAdmission(request, earlier, reconciled = false, resource = null) {
  const now = captureAdmission(request, reconciled, resource);
  if (earlier && consumers.qualifier.qualifiedContent({ grant: earlier.grant, receipt: earlier.receipt, scope: earlier.scope }) !==
      consumers.qualifier.qualifiedContent({ grant: now.grant, receipt: now.receipt, scope: now.scope })) refuse("preflight-decisive-drift");
  if (!now.permitted) refuse(now.refusals[0]?.code ?? "preflight-policy-refused");
  if (!now.grant.enforced || now.inputBytes("current").length === 0 || now.inputBytes("approved").length === 0) refuse("preflight-approved-bytes-unavailable");
  return now;
}
