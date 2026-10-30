/** Canonical first-class operation records in the existing run-record home.
 * These are coordinator effects, never child assignments or dispatch admission.
 */
import { createHash } from "node:crypto";
import {validProjectBankRecord} from "./project-bank-record.mjs";
import {validProjectInitializationRecord} from "./project-init-record.mjs";
import {validQualifiedDeliveryRecord} from "./qualified-delivery-record.mjs";
import {validConfiguredDispatchRecord} from "./configured-dispatch-record.mjs";
import {validPrivateBackupRecord} from "./private-backup-record.mjs";

/** @param {any} value @returns {string} */
export function operationContent(value) {
  if (Array.isArray(value)) return `[${value.map(operationContent).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${operationContent(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}
/** @param {any} value */
export function operationDigest(value) { return `sha256:${createHash("sha256").update(operationContent(value)).digest("hex")}`; }
/** @param {string} id */
export function operationWork(id) { return `OP-${createHash("sha256").update(id).digest("hex")}`; }
/** Detached finite JSON for automatically captured ordinary-save requests.
 * There is no mutable caller reference or auxiliary request ledger.
 * @param {any} value @returns {any} */
export function operationPayload(value) {
  let nodes = 0;
  const seen = new Set();
  /** @param {any} item @param {number} depth @returns {any} */
  function copy(item, depth) {
    if (++nodes > 100000 || depth > 32) throw Error("OPERATION_PAYLOAD");
    if (item === null || typeof item === "string" || typeof item === "boolean" || typeof item === "number" && Number.isFinite(item)) return item;
    if (!item || typeof item !== "object" || seen.has(item) || (!Array.isArray(item) && ![Object.prototype, null].includes(Object.getPrototypeOf(item)))) throw Error("OPERATION_PAYLOAD");
    seen.add(item);
    const result = Array.isArray(item) ? item.map((entry) => copy(entry, depth + 1))
      : Object.fromEntries(Object.keys(item).map((key) => [key, copy(item[key], depth + 1)]));
    seen.delete(item); return result;
  }
  const result = copy(value, 0);
  if (Buffer.byteLength(JSON.stringify(result), "utf8") > 16 * 1024 * 1024) throw Error("OPERATION_PAYLOAD");
  return result;
}
/** @param {any} value @param {string[]} keys */
function shape(value, keys) {
  return value !== null && typeof value === "object" && !Array.isArray(value) &&
    Object.keys(value).sort().join("\0") === [...keys].sort().join("\0");
}
/** @param {any} value */
function oid(value) { return typeof value === "string" && /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(value); }
/** @param {any} value */
function instant(value) { return typeof value === "string" && Number.isFinite(Date.parse(value)); }
/** Strict enumeration companion. Unknown fields, child/native authority and
 * inconsistent progress remain unavailable input, never skipped metadata.
 * @param {any} rec @returns {boolean} */
export function validOperationRecord(rec) {
  if(rec?.operation?.kind === "project-bank") return validProjectBankRecord(rec);
  if(rec?.operation?.kind === "project-init") return validProjectInitializationRecord(rec);
  if(rec?.operation?.kind === "qualified-delivery") return validQualifiedDeliveryRecord(rec);
  if(rec?.operation?.kind === "configured-dispatch") return validConfiguredDispatchRecord(rec);
  if(rec?.operation?.kind === "private-backup") return validPrivateBackupRecord(rec);
  if (!shape(rec, ["version", "recordKind", "attempt", "state", "assignment", "assignmentDigest", "writer", "resource",
    "reservation", "execution", "admission", "operation", "events"]) || rec.version !== 1 || rec.recordKind !== "operation" ||
    !["starting", "unknown", "finished", "failed", "stopped"].includes(rec.state) || rec.writer !== true || rec.execution !== null || rec.admission !== null ||
    !shape(rec.assignment, ["kind", "id", "role", "resource"]) || rec.assignment.kind !== "operation" || rec.assignment.role !== "records-save" ||
    rec.assignment.resource !== rec.resource || typeof rec.resource !== "string" ||
    rec.assignmentDigest !== `sha256:${createHash("sha256").update(JSON.stringify(rec.assignment)).digest("hex")}` ||
    !shape(rec.reservation, ["file", "takenAt", "releasedAt"]) || !instant(rec.reservation.takenAt) ||
    !(rec.reservation.file === null || typeof rec.reservation.file === "string" && rec.reservation.file.startsWith("/")) ||
    !(rec.reservation.releasedAt === null || instant(rec.reservation.releasedAt)) || !Array.isArray(rec.events)) return false;
  const op = rec.operation;
  if (!shape(op, ["version", "id", "kind", "request", "digest", "owner", "createdAt", "intent", "acceptance", ...(Object.hasOwn(op ?? {}, "disposition") ? ["disposition"] : [])]) ||
    op.version !== 1 || op.kind !== "records-save" || typeof op.id !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(op.id) ||
    rec.assignment.id !== operationWork(op.id) || rec.attempt !== `${operationWork(op.id)}-a1` ||
    !instant(op.createdAt) || !shape(op.owner, ["pid", "identity", "token"]) || !Number.isInteger(op.owner.pid) || op.owner.pid < 1 ||
    typeof op.owner.identity !== "string" || !op.owner.identity || typeof op.owner.token !== "string" ||
    !shape(op.request, ["operationId", "kind", "repository", "targetRef", "expectedRevision", "acceptedTree", "payloadDigest", "message", ...(Object.hasOwn(op.request ?? {}, "payload") ? ["payload"] : [])]) ||
    op.request.operationId !== op.id || op.request.kind !== op.kind || op.request.repository?.root !== rec.resource ||
    op.digest !== operationDigest(op.request) || !oid(op.request.expectedRevision) || !oid(op.request.acceptedTree) ||
    typeof op.request.targetRef !== "string" || !op.request.targetRef.startsWith("refs/heads/") ||
    typeof op.request.payloadDigest !== "string" || !/^sha256:[0-9a-f]{64}$/.test(op.request.payloadDigest) ||
    typeof op.request.message !== "string" || !op.request.message.trim()) return false;
  if (Object.hasOwn(op.request, "payload")) {
    try { if (operationDigest(operationPayload(op.request.payload)) !== op.request.payloadDigest) return false; }
    catch { return false; }
  }
  const repository = op.request.repository;
  if (!shape(repository, ["root", "gitDir", "commonDir", "objectFormat", "rootCommits", "identities"]) ||
    [repository.root, repository.gitDir, repository.commonDir].some((value) => typeof value !== "string" || !value.startsWith("/")) ||
    !["sha1", "sha256"].includes(repository.objectFormat) || !Array.isArray(repository.rootCommits) ||
    repository.rootCommits.length === 0 || repository.rootCommits.some((/** @type {any} */ value) => !oid(value)) ||
    !Array.isArray(repository.identities) || repository.identities.length !== 4 ||
    repository.identities.some((/** @type {any} */ identity) => !shape(identity, ["path", "device", "inode"]) ||
      typeof identity.path !== "string" || !identity.path.startsWith("/") || !/^[0-9]+$/.test(identity.device) || !/^[0-9]+$/.test(identity.inode))) return false;
  if (op.intent !== null && (!shape(op.intent, ["commit", "tree", "previousRevision", "ref", "correlationRef"]) ||
    !oid(op.intent.commit) || op.intent.tree !== op.request.acceptedTree || op.intent.previousRevision !== op.request.expectedRevision ||
    op.intent.ref !== op.request.targetRef || op.intent.correlationRef !== `refs/supertaskr/operations/${operationWork(op.id).slice(3)}`)) return false;
  if (op.acceptance !== null && (!shape(op.acceptance, ["commit", "tree", "ref", "previousRevision", "attribution"]) ||
    op.intent === null || op.acceptance.commit !== op.intent.commit || op.acceptance.tree !== op.intent.tree ||
    op.acceptance.ref !== op.intent.ref || op.acceptance.previousRevision !== op.intent.previousRevision || op.acceptance.attribution !== "exact")) return false;
  if (!rec.events.every((/** @type {any} */ event) => shape(event, ["at", "op"]) && instant(event.at) && typeof event.op === "string")) return false;
  if ((rec.state === "finished") !== (op.acceptance !== null) || (["finished", "failed", "stopped"].includes(rec.state)) !== (rec.reservation.releasedAt !== null)) return false;
  if (rec.state === "stopped") {
    const d=op.disposition,p=d?.proof,last=rec.events.at(-1);
    return op.acceptance === null && rec.reservation.file !== null &&
      shape(d,["version","kind","at","requestDigest","proof"]) && d.version === 1 && d.kind === "stopped-before-materialization" &&
      d.requestDigest === op.digest && d.at === rec.reservation.releasedAt && instant(d.at) &&
      shape(p,["payloadKind","repositoryDigest","productDigest","docsDirectory","docsDevice","docsInode","preimagesDigest","indexDigest","targetRef","expectedRevision","correlationRef","correlation"]) &&
      ["ordinary-record-save","private-record-graph"].includes(p.payloadKind) && p.payloadKind === op.request.payload?.kind &&
      Array.isArray(op.request.payload.preimages) && shape(op.request.payload.productOrigin,["root","gitDir","commonDir","objectFormat","rootCommits","identities"]) &&
      typeof p.docsDirectory === "string" && p.docsDirectory.startsWith("/") && typeof p.docsDevice === "string" && typeof p.docsInode === "string" &&
      [p.repositoryDigest,p.productDigest,p.preimagesDigest,p.indexDigest].every((value)=>typeof value === "string" && /^sha256:[0-9a-f]{64}$/.test(value)) &&
      p.repositoryDigest === operationDigest(op.request.repository) && p.productDigest === operationDigest(op.request.payload.productOrigin) &&
      p.preimagesDigest === operationDigest(op.request.payload.preimages) && p.indexDigest === op.request.payload.index?.previousDigest &&
      p.docsDirectory === op.request.payload.recordOrigin?.docsDirectory && p.docsDevice === op.request.payload.recordOrigin?.docsDevice &&
      p.docsInode === op.request.payload.recordOrigin?.docsInode && /^[0-9]+$/.test(p.docsDevice) && /^[0-9]+$/.test(p.docsInode) &&
      p.targetRef === op.request.targetRef && p.expectedRevision === op.request.expectedRevision && p.correlation === null &&
      p.correlationRef === `refs/supertaskr/operations/${operationWork(op.id).slice(3)}` &&
      rec.events.some((/** @type {any} */ e)=>e.op === "capture-before-effects") && rec.events.some((/** @type {any} */ e)=>e.op === "objects-start") &&
      !rec.events.some((/** @type {any} */ e)=>["consumer-prepare","consumer-prepared","accepted"].includes(e.op) || e.op.startsWith("failed-zero-effects:")) &&
      last.op === "stopped-before-materialization" && last.at === d.at;
  }
  if (Object.hasOwn(op,"disposition")) return false;
  const failures = rec.events.filter((/** @type {any} */ event) => event.op.startsWith("failed-zero-effects:"));
  if (rec.state === "failed") return op.intent === null && op.acceptance === null && rec.reservation.file !== null &&
    rec.events.length === 3 && rec.events[0].op === "prepare" && rec.events[1].op === "capture-before-effects" &&
    failures.length === 1 && /^failed-zero-effects:[A-Za-z][A-Za-z0-9_-]{0,127}$/.test(rec.events[2].op) &&
    rec.events[2].at === rec.reservation.releasedAt;
  return failures.length === 0;
}
