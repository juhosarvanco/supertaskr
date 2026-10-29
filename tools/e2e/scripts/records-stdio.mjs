#!/usr/bin/env node
/** Fixed JSON stdin v1 bridge. Context/path is supplied by the trusted native
 * backend; the webview gets opaque record/buffer tokens rather than authority.
 */
import { readSync, realpathSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import {isAbsolute} from "node:path";
import { acknowledgePrivateRecordSave, discoverPrivateRecordSaves, loadConfiguredPrivateRecordService, replayPrivateRecordSave } from "./records-save.mjs";
import { readAcceptedOperation } from "./durable-operation.mjs";
import { operationContent } from "./operation-record.mjs";
import {backupPrivateRecordSave,discoverPrivateBackups,replayPrivateBackup} from "./records-backup-operation.mjs";
import {configurePrivateBackup,readPrivateBackupSettings} from "./records-backup-settings.mjs";

export const RECORD_PROTOCOL_LIMIT = 4 * 1024 * 1024;
export const RECORD_FILE_LIMIT = 2 * 1024 * 1024;
/** @param {any} value @param {string[]} fields */
function shape(value, fields) { return value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).sort().join(",") === [...fields].sort().join(","); }
/** @param {string} code @returns {never} */
function refuse(code) { throw Object.assign(new Error(code), { code }); }
/** Reject duplicate JSON members before JSON.parse can erase their identity.
 * @param {string} source */
function parse(source) {
  const value = JSON.parse(source), tokens = source.match(/"(?:\\[\s\S]|[^"\\])*"|[{}\[\],:]|[^\s{}\[\],:]+/g) ?? [];
  let at = 0, nodes = 0;
  /** @param {number} depth */
  function visit(depth) {
    if (++nodes > 100000 || depth > 32) refuse("records-protocol-json-invalid");
    const token = tokens[at++];
    if (token === "{") {
      const names = new Set();
      while (tokens[at] !== "}") {
        const name = JSON.parse(/** @type {string} */ (tokens[at++]));
        if (names.has(name)) refuse("records-protocol-json-duplicate");
        names.add(name); at++; visit(depth + 1); if (tokens[at] !== ",") break; at++;
      }
      at++;
    } else if (token === "[") {
      while (tokens[at] !== "]") { visit(depth + 1); if (tokens[at] !== ",") break; at++; }
      at++;
    }
  }
  visit(0); return value;
}
/** @param {any} value */
function base64(value) {
  if (typeof value !== "string" || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) refuse("records-protocol-content-invalid");
  const bytes = Buffer.from(value, "base64");
  if (bytes.length > RECORD_FILE_LIMIT || bytes.toString("base64") !== value) refuse("records-protocol-content-limit");
  try { new TextDecoder("utf-8", { fatal: true }).decode(bytes); } catch { refuse("records-protocol-content-invalid"); }
  if (bytes.includes(0)) refuse("records-protocol-content-invalid");
  return bytes;
}
/** @param {any} request */
function normalize(request) {
  if (!request || request.version !== 1 || typeof request.requestId !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(request.requestId) ||
      typeof request.productRoot !== "string" || !isAbsolute(request.productRoot) || request.productRoot.includes("\0") || !["read", "check", "save", "replay", "discover", "acknowledge", "backup", "backup-replay", "backup-discover", "backup-settings", "backup-configure"].includes(request.operation)) refuse("records-protocol-request");
  const historical = ["replay","discover","acknowledge","backup","backup-replay","backup-discover","backup-settings","backup-configure"].includes(request.operation);
  const fields = ["version", "requestId", "operation", "productRoot", ...(historical ? [] : ["productRevision", "path"]),
    ...(["replay","acknowledge","backup","backup-replay"].includes(request.operation) ? ["operationId"] : []), ...(request.operation === "acknowledge" ? ["commit"] : []),
    ...(["backup","backup-settings","backup-configure"].includes(request.operation) ? ["saveOperationId"] : []),
    ...(request.operation === "backup-configure" ? ["expectedToken","parent"] : []),
    ...(["check", "save"].includes(request.operation) ? ["recordsRevision", "expectedFile", "expectedContext", "edit"] : []),
    ...(request.operation === "save" ? ["operationId"] : [])];
  if (!shape(request, fields) || !historical && !/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(request.productRevision) ||
      ["save", "replay", "acknowledge", "backup", "backup-replay"].includes(request.operation) && (typeof request.operationId !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(request.operationId))||
      ["backup","backup-settings","backup-configure"].includes(request.operation) && (typeof request.saveOperationId !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(request.saveOperationId))) refuse("records-protocol-request");
  if(request.operation==="backup-configure"&&(!/^sha256:[0-9a-f]{64}$/.test(request.expectedToken)||!shape(request.parent,["path","device","inode"])||
    typeof request.parent.path!=="string"||!isAbsolute(request.parent.path)||! [request.parent.device,request.parent.inode].every(value=>typeof value==="string"&&/^\d+$/.test(value))))refuse("records-protocol-request");
  if (request.operation === "acknowledge" && !/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(request.commit)) refuse("records-protocol-request");
  if (["check", "save"].includes(request.operation)) {
    if (!/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(request.recordsRevision) ||
        !shape(request.expectedFile, ["present", "sha256", "mode"]) || request.expectedFile.present !== true ||
        !/^[0-9a-f]{64}$/.test(request.expectedFile.sha256) || !["100644", "100755"].includes(request.expectedFile.mode) ||
        typeof request.expectedContext !== "string" || !/^sha256:[0-9a-f]{64}$/.test(request.expectedContext) ||
        !shape(request.edit, ["contentBase64"])) refuse("records-protocol-request");
    base64(request.edit.contentBase64);
  }
  return request;
}
/** Bounded display diagnostics; never serialize the complete captured corpus.
 * @param {any[]} values */
function diagnostics(values) { return values.slice(0, 50).map((value) => ({ ...value, ...(typeof value.message === "string" ? { message: value.message.slice(0, 2000) } : {}) })); }
/** @param {any} result */
function completedResult(result) { if(result.status === "stopped") refuse("records-save-operation-stopped");return result; }
/** One request, no configurable program/manifest/policy/root overrides.
 * The optional manifest parameter is an installed-service construction seam,
 * never read from stdin and never passed by the native frontend.
 * @param {any} input @param {{manifestPath?: string}} [installation] */
export function executeRecordProtocol(input, installation = {}) {
  const request = normalize(input), requestId = request.requestId;
  try {
    if(request.operation === "backup-settings")return {version:1,requestId,ok:true,result:readPrivateBackupSettings({productRoot:request.productRoot,saveOperationId:request.saveOperationId,...installation})};
    if(request.operation === "backup-configure")return {version:1,requestId,ok:true,result:configurePrivateBackup({productRoot:request.productRoot,saveOperationId:request.saveOperationId,expectedToken:request.expectedToken,parent:request.parent,...installation})};
    if(request.operation === "backup-discover")return {version:1,requestId,ok:true,result:discoverPrivateBackups(request.productRoot)};
    if(request.operation === "backup")return {version:1,requestId,ok:true,result:backupPrivateRecordSave(request.productRoot,{operationId:request.operationId,saveOperationId:request.saveOperationId},installation)};
    if(request.operation === "backup-replay")return {version:1,requestId,ok:true,result:replayPrivateBackup(request.productRoot,request.operationId,installation)};
    if (request.operation === "discover") return {version:1,requestId,ok:true,result:discoverPrivateRecordSaves({productRoot:request.productRoot})};
    if (request.operation === "acknowledge") return {version:1,requestId,ok:true,result:acknowledgePrivateRecordSave({productRoot:request.productRoot,operationId:request.operationId,commit:request.commit})};
    if (request.operation === "replay") return { version: 1, requestId, ok: true, result: completedResult(replayPrivateRecordSave({ productRoot: request.productRoot, operationId: request.operationId, ...installation })) };
    if (request.operation === "save") {
      const prior = readAcceptedOperation(request.productRoot, request.operationId), payload = prior?.operation.request.payload;
      if (prior !== null) {
        const overlay = [{ operation: "edit", path: request.path, type: "blob", mode: request.expectedFile.mode, base64: request.edit.contentBase64 }];
        if (payload?.kind !== "ordinary-record-save" || operationContent(payload.overlay) !== operationContent(overlay) ||
            payload.options.productRoot !== request.productRoot || payload.options.productRevision !== request.productRevision ||
            payload.options.recordsRevision !== request.recordsRevision || payload.expectedContext !== request.expectedContext ||
            operationContent(payload.expectedFiles) !== operationContent([{ path: request.path, ...request.expectedFile }])) refuse("records-save-operation-changed");
        return { version: 1, requestId, ok: true, result: completedResult(replayPrivateRecordSave({ productRoot: request.productRoot, operationId: request.operationId, ...installation })) };
      }
    }
    const service = loadConfiguredPrivateRecordService({ productRoot: request.productRoot, productRevision: request.productRevision, ...installation });
    const original = service.read({ productRoot: request.productRoot, productRevision: request.productRevision }, request.path);
    if (Buffer.from(original.contentBase64, "base64").length > RECORD_FILE_LIMIT) refuse("records-protocol-content-limit");
    if (request.operation === "read") return { version: 1, requestId, ok: true, result: original };
    if (original.recordsRevision !== request.recordsRevision) refuse("records-save-records-context-changed");
    if (original.expectedContext !== request.expectedContext) refuse("records-save-context-changed");
    if (JSON.stringify(original.observedFile) !== JSON.stringify(request.expectedFile)) {
      // Compare named fields; JSON member ordering is not file identity.
      if (original.observedFile.present !== request.expectedFile.present || original.observedFile.sha256 !== request.expectedFile.sha256 || original.observedFile.mode !== request.expectedFile.mode) refuse("records-save-file-changed");
    }
    const overlay = [{ operation: "edit", path: request.path, type: "blob", mode: request.expectedFile.mode, bytes: base64(request.edit.contentBase64) }];
    const options = { productRoot: request.productRoot, productRevision: request.productRevision, recordsRevision: request.recordsRevision };
    if (request.operation === "check") {
      const result = service.check(options, overlay, { expectedContext: request.expectedContext, expectedFiles: [{ path: request.path, ...request.expectedFile }] });
      return { version: 1, requestId, ok: true, result: { status: "checked", accepted: result.accepted,
        structuralAccepted: result.structuralAccepted, wholeBoardClean: result.wholeBoardClean,
        blocking: diagnostics([...result.failures, ...result.introducedDiagnostics, ...result.blocking]),
        retained: diagnostics([...result.diagnostics.filter((/** @type {any} */ entry) => !result.introducedDiagnostics.includes(entry)), ...result.retained]), warnings: diagnostics(result.warnings),
        procedural: result.procedural, derivations: result.derivations, candidateDigest: result.candidateDigest,
        observedFile: original.observedFile, expectedContext: original.expectedContext } };
    }
    const result = service.save({ ...options, operationId: request.operationId, expectedFiles: [{ path: request.path, ...request.expectedFile }], expectedContext: request.expectedContext }, overlay);
    // A later owner's observation is not part of this receipt. Attach only an
    // observation at the accepted revision and original root incarnation.
    let observation = {};
    try {
      const observed = service.read({ productRoot: request.productRoot, productRevision: request.productRevision }, request.path);
      if (observed.recordsRevision === result.commit && operationContent(observed.recordOrigin) === operationContent(original.recordOrigin))
        observation = { observedFile: observed.observedFile, expectedContext: observed.expectedContext, observedRecordsRevision: observed.recordsRevision };
    } catch { /* The accepted durable receipt remains authoritative. */ }
    return { version: 1, requestId, ok: true, result: { ...result, ...observation } };
  } catch (error) {
    let state = "refused", nextOperationId;
    if (["save", "replay", "backup", "backup-replay"].includes(request.operation)) {
      try { const rec = readAcceptedOperation(request.productRoot, request.operationId); if (["save","replay"].includes(request.operation)&&["failed","stopped"].includes(rec?.state)) nextOperationId = `save-${randomUUID()}`; else if (rec !== null) state = "unknown"; }
      catch { state = "unknown"; }
    }
    const code = typeof /** @type {any} */ (error)?.code === "string" ? /** @type {any} */ (error).code : "records-protocol-unavailable";
    return { version: 1, requestId, ok: false, error: { code, message: "Private records operation could not be completed.", state,
      ...(["save", "replay", "backup", "backup-replay"].includes(request.operation) ? { operationId: request.operationId } : {}), ...(nextOperationId ? { nextOperationId } : {}) } };
  }
}
/** @param {string[]} args @returns {number} */
export function recordsStdioMain(args) {
  let requestId = null;
  /** @type {any} */ let input;
  try {
    if (args.length !== 1 || args[0] !== "--stdio") refuse("records-protocol-usage");
    const chunks = [], buffer = Buffer.alloc(64 * 1024); let length = 0, read;
    while ((read = readSync(0, buffer, 0, buffer.length, null)) !== 0) {
      length += read; if (length > RECORD_PROTOCOL_LIMIT) refuse("records-protocol-input-limit"); chunks.push(Buffer.from(buffer.subarray(0, read)));
    }
    input = parse(new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks)));
    requestId = typeof input?.requestId === "string" ? input.requestId : null;
    const result = executeRecordProtocol(input), output = JSON.stringify(result);
    if (Buffer.byteLength(output) > RECORD_PROTOCOL_LIMIT) refuse("records-protocol-output-limit");
    process.stdout.write(`${output}\n`); return result.ok ? 0 : 1;
  } catch (error) {
    const code = typeof /** @type {any} */ (error)?.code === "string" ? /** @type {any} */ (error).code : "records-protocol-json-invalid";
    let state = "refused", nextOperationId;
    if (["save", "replay", "backup", "backup-replay"].includes(input?.operation) && typeof input?.operationId === "string") {
      try { const rec = readAcceptedOperation(input.productRoot, input.operationId); if (["save","replay"].includes(input.operation)&&["failed","stopped"].includes(rec?.state)) nextOperationId = `save-${randomUUID()}`; else if (rec !== null) state = "unknown"; } catch { state = "unknown"; }
    }
    process.stdout.write(`${JSON.stringify({ version: 1, requestId, ok: false, error: { code, message: "Private records request was refused.", state,
      ...(typeof input?.operationId === "string" ? { operationId: input.operationId } : {}), ...(nextOperationId ? { nextOperationId } : {}) } })}\n`);
    return 2;
  }
}
let direct=false;
try{direct=!!process.argv[1]&&realpathSync(process.argv[1])===realpathSync(fileURLToPath(import.meta.url));}catch{/* An imported module is inert when the host entry is unavailable. */}
if (direct) process.exitCode = recordsStdioMain(process.argv.slice(2));
