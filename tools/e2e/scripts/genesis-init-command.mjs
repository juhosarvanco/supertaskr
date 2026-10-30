#!/usr/bin/env node
/** Fixed installed JSON stdin setup service. The native backend supplies its
 * selected folders and observed incarnations; plans/config/TOOL stay here.
 */
import { readSync, realpathSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseDocument } from "yaml";
import { prepareGenesisInitialization } from "./genesis-init-plan.mjs";
import { discoverProjectInitializations, inspectOriginalProjectPlanner, inspectProjectInitialization } from "./genesis-init-inspect.mjs";
import { executeProjectInitialization, replayProjectInitialization } from "./project-init-operation.mjs";
import {prepareGenesisBank,unchangedGenesisBank,inspectCurrentGenesisBankHistory} from "./genesis-bank-plan.mjs";
import {executeProjectBank,replayProjectBank} from "./project-bank-operation.mjs";
import {discoverGenesisBanks} from "./genesis-bank-inspect.mjs";
import { readAcceptedOperation } from "./durable-operation.mjs";
import { operationContent } from "./operation-record.mjs";
import { loadInstalledRecordTool, requireInstalledRuntimeAssets, verifyInstalledRecordTool } from "./records-check.mjs";

export const INITIALIZATION_INPUT_LIMIT = 64 * 1024;
export const INITIALIZATION_OUTPUT_LIMIT = 4 * 1024 * 1024;
const RUNTIME = ["genesis-init-command", "genesis-init-plan", "genesis-init-inspect", "project-init-operation", "project-init-record", "project-settings", "genesis-bank-plan", "project-bank-operation", "project-bank-record", "genesis-bank-inspect", "genesis-bank-proposal", "genesis-proposal", "records-profile"].map(name => `tools/e2e/scripts/${name}.mjs`);
/** @param {string} code @returns {never} */
function refuse(code) { throw Object.assign(new Error(code), { code }); }
/** @param {any} value @param {string[]} fields */
function shape(value, fields) { return value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).sort().join(",") === [...fields].sort().join(","); }
/** @param {any} value */
function id(value) { return typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(value); }
/** @param {any} value */
function root(value) { return typeof value === "string" && value.length <= 16384 && !value.includes("\0") && path.isAbsolute(value); }
/** @param {any} value */
function identity(value) { return shape(value, ["device", "inode"]) && [value.device, value.inode].every(item => typeof item === "string" && /^[0-9]{1,64}$/.test(item)); }
/** @param {any} value */
function revision(value){return typeof value==="string"&&/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(value);}
/** @param {any} request */
function normalize(request) {
  if (!request || request.version !== 1 || !id(request.requestId) || !root(request.productRoot) ||
      !["initialize", "replay", "discover", "inspect", "planner", "bank", "bank-replay", "banks"].includes(request.operation)) refuse("genesis-init-protocol-request");
  const fields = ["version", "requestId", "operation", "productRoot",
    ...(["initialize", "replay", "bank", "bank-replay"].includes(request.operation) ? ["operationId"] : []),
    ...(request.operation === "initialize" ? ["recordsRoot", "expectedRoots", "projectId"] : []),
    ...(request.operation === "bank" ? ["sessionId", "originDigest", "expectedProductRevision", "expectedRecordsRevision"] : []),
    ...(request.operation === "planner" ? ["productRevision"] : [])];
  if (!shape(request, fields) || ["initialize", "replay", "bank", "bank-replay"].includes(request.operation) && !id(request.operationId)) refuse("genesis-init-protocol-request");
  if (request.operation === "initialize" && (!root(request.recordsRoot) || !id(request.projectId) || !shape(request.expectedRoots, ["product", "records"]) ||
      !identity(request.expectedRoots.product) || !identity(request.expectedRoots.records))) refuse("genesis-init-protocol-request");
  if(request.operation==="bank"&&(!id(request.sessionId)||typeof request.originDigest!=="string"||!/^sha256:[0-9a-f]{64}$/.test(request.originDigest)||!revision(request.expectedProductRevision)||!revision(request.expectedRecordsRevision)))refuse("genesis-init-protocol-request");
  if(request.operation==="planner"&&!revision(request.productRevision))refuse("genesis-init-protocol-request");
  return request;
}
/** @param {any} request */
function expectedRoots(request) {
  return { product: { path: request.productRoot, ...request.expectedRoots.product }, records: { path: request.recordsRoot, ...request.expectedRoots.records } };
}
/** Durable presence, including corrupt/unreadable evidence, keeps the original
 * setup ID unknown. No failure here invents another operation or cleans roots.
 * @param {any} input @param {unknown} error */
function errorEnvelope(input, error) {
  let state = "refused";
  const operationId = id(input?.operationId) ? input.operationId : undefined;
  // A bank replay already names retained intent. Even absence or failed
  // prevalidation cannot turn it into permission to recapture a new proposal.
  if(input?.operation==="bank-replay"&&operationId)state="unknown";
  if (["initialize", "replay", "bank", "bank-replay"].includes(input?.operation) && operationId && root(input?.productRoot)) {
    try { if (readAcceptedOperation(input.productRoot, operationId) !== null) state = "unknown"; } catch { state = "unknown"; }
  }
  const raw = /** @type {any} */ (error)?.code, code = typeof raw === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(raw) ? raw : "genesis-init-unavailable";
  return { version: 1, requestId: id(input?.requestId) ? input.requestId : null, ok: /** @type {false} */ (false),
    error: { code, message: code === "PROJECT_INIT_STAGE_UNATTRIBUTED"
      ? "Setup needs reconciliation of its original folders before it can continue."
      : "Project setup is unavailable. Keep its original folders and setup identifier to continue.",
    state, ...(operationId ? { operationId } : {}) } };
}

/** The installation override is a trusted ordinary-test/construction seam,
 * never a stdin field. Default resolution is the actual installed manifest.
 * @param {any} input @param {{manifestPath?:string}} [installation] */
export function executeInitializationProtocol(input, installation = {}) {
  try {
    const request = normalize(input);
    if (Object.keys(installation).some(key => key !== "manifestPath")) refuse("genesis-init-installation-request");
    /** @type {any} */ let tool;
    const currentTool = () => {
      if (!tool) {
        tool = loadInstalledRecordTool(installation.manifestPath);
        requireInstalledRuntimeAssets(tool, RUNTIME);
      }
      verifyInstalledRecordTool(tool); return tool;
    };
    // Accepted replay never invokes this policy. Pending replay validates only
    // the original immutable plan against the currently installed exact TOOL.
    const authorize = (/** @type {any} */ context) => operationContent(currentTool()) === operationContent(context.request.tool);
    let result;
    if(request.operation==="banks"){
      result=discoverGenesisBanks(request.productRoot);
      // Original receipts remain available even when current policy/TOOL or
      // session readiness cannot qualify progress. Failure is explicit data.
      try{result={...result,current:inspectCurrentGenesisBankHistory({productRoot:request.productRoot,tool:currentTool()})};}
      catch(error){result={...result,current:{status:"unavailable",code:errorEnvelope(request,error).error.code}};}
    }
    else if(request.operation==="bank-replay")result=replayProjectBank(request.productRoot,request.operationId,{get tool(){return currentTool();},authorize});
    else if(request.operation==="bank"){
      const prior=readAcceptedOperation(request.productRoot,request.operationId);
      if(prior!==null){
        const original=prior.operation.request;
        if(prior.operation.kind!=="project-bank"||original.session.sessionId!==request.sessionId||original.session.originDigest!==request.originDigest||original.input.productRevision!==request.expectedProductRevision||original.input.recordsRevision!==request.expectedRecordsRevision)refuse("genesis-bank-operation-changed");
        result=replayProjectBank(request.productRoot,request.operationId,{get tool(){return currentTool();},authorize});
      }else{
        const input={productRoot:request.productRoot,operationId:request.operationId,sessionId:request.sessionId,originDigest:request.originDigest,expectedProductRevision:request.expectedProductRevision,expectedRecordsRevision:request.expectedRecordsRevision,tool:currentTool()};
        result=unchangedGenesisBank(input);
        if(result===null){const prepared=prepareGenesisBank(input);result=executeProjectBank(request.productRoot,prepared.request,{tool:currentTool(),authorize});}
      }
    }
    else if (request.operation === "discover") result = discoverProjectInitializations(request.productRoot);
    else if (request.operation === "inspect") result = inspectProjectInitialization({ productRoot: request.productRoot, tool: currentTool() });
    else if (request.operation === "planner") result = inspectOriginalProjectPlanner({ productRoot: request.productRoot, productRevision: request.productRevision, tool: currentTool() });
    else if (request.operation === "replay") result = replayProjectInitialization(request.productRoot, request.operationId, { authorize });
    else {
      const prior = readAcceptedOperation(request.productRoot, request.operationId);
      if (prior !== null) {
        if (prior.operation.kind !== "project-init" || prior.operation.request.projectId !== request.projectId ||
            operationContent(prior.operation.request.roots) !== operationContent(expectedRoots(request))) refuse("genesis-init-operation-changed");
        result = replayProjectInitialization(request.productRoot, request.operationId, { authorize });
      } else {
        // Cold discovery precedes fresh/nonempty refusal. A new ID cannot
        // bypass an original interrupted setup whose roots need recovery.
        if (discoverProjectInitializations(request.productRoot).initializations.length !== 0) refuse("genesis-init-recovery-required");
        const plan = prepareGenesisInitialization({ productRoot: request.productRoot, recordsRoot: request.recordsRoot,
          operationId: request.operationId, projectId: request.projectId, tool: currentTool() });
        if (operationContent(plan.request.roots) !== operationContent(expectedRoots(request))) refuse("genesis-init-root-changed");
        result = executeProjectInitialization(request.productRoot, plan.request, { authorize });
      }
    }
    return { version: 1, requestId: request.requestId, ok: /** @type {true} */ (true), result };
  } catch (error) { return errorEnvelope(input, error); }
}

/** @param {string[]} args */
export function initializationStdioMain(args) {
  /** @type {any} */ let input;
  try {
    if (args.length !== 1 || args[0] !== "--stdio") refuse("genesis-init-protocol-usage");
    const chunks = [], buffer = Buffer.alloc(16384); let length = 0, count;
    while ((count = readSync(0, buffer, 0, buffer.length, null)) !== 0) {
      length += count; if (length > INITIALIZATION_INPUT_LIMIT) refuse("genesis-init-protocol-input-limit"); chunks.push(Buffer.from(buffer.subarray(0, count)));
    }
    const text = new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks));
    input = JSON.parse(text);
    if (parseDocument(text, { uniqueKeys: true }).errors.length !== 0) refuse("genesis-init-protocol-json-duplicate");
    const result = executeInitializationProtocol(input), output = JSON.stringify(result);
    if (Buffer.byteLength(output) > INITIALIZATION_OUTPUT_LIMIT) refuse("genesis-init-protocol-output-limit");
    process.stdout.write(output + "\n"); return result.ok ? 0 : 1;
  } catch (error) { process.stdout.write(JSON.stringify(errorEnvelope(input, error)) + "\n"); return 2; }
}
function isEntry() {
  const entry = process.argv[1];
  try { return entry !== undefined && entry !== "" && realpathSync(entry) === realpathSync(fileURLToPath(import.meta.url)); }
  catch { return false; }
}
if (isEntry()) process.exitCode = initializationStdioMain(process.argv.slice(2));
