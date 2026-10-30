/** Installed finite front over the original qualified-delivery operation.
 * Data flags never select a program, policy, TOOL or authority object. */
import {realpathSync} from "node:fs";
import {isMain} from "../../../cli/is-main.mjs";

const USAGE = `supertaskr delivery <start|local|publish|ci|complete|status> --operation <id> [--root <PRODUCT>]
  start --executor <attempt> --verifier <attempt>
        --product-ref <refs/heads/name> --product-base <full SHA1>
        --records-ref <refs/heads/name> --records-base <full SHA1>
  start freezes the full route before local integration; it does not push.
  local reconciles the original local step; publish, ci and complete each
  continue only their named step using the same original operation ID.
  status reads original local evidence and labels later retained progress.
  Interrupted steps use the same command and operation ID again.
  Fresh starts require original configured native executor/verifier records.
`;
const ACTIONS = new Set(["start", "local", "publish", "ci", "complete", "status"]);
const COMMON = ["root", "operation"], START = ["executor", "verifier", "product-ref", "product-base", "records-ref", "records-base"];
/** @returns {never} */
function usage() {throw Object.assign(new Error("Invalid delivery command"), {code:"delivery-usage"});}
/** Validate all finite syntax before importing the operation owners or TOOL.
 * @param {string[]} argv */
function parse(argv) {
  // The shared installed front places its selected root before a positional
  // action. Normalize that one pair; the same finite parser below still owns
  // every value, duplicate and allowlist check before any operation loads.
  if (argv[0] === "--root") {
    const root = argv[1];
    if (root === undefined || !root || root.startsWith("--") || /[\x00-\x1f\x7f]/.test(root)) usage();
    argv = [...argv.slice(2), "--root", root];
  }
  const action = argv[0]; if (!action || !ACTIONS.has(action)) usage();
  const allowed = new Set([...COMMON, ...(action === "start" ? START : [])]);
  /** @type {Record<string,string>} */ const flags = {};
  for (let at = 1; at < argv.length; at++) {
    const token = argv[at], key = token?.startsWith("--") ? token.slice(2) : "";
    if (!allowed.has(key) || Object.hasOwn(flags, key)) usage();
    const value = argv[++at]; if (value === undefined || !value || value.startsWith("--") || /[\x00-\x1f\x7f]/.test(value)) usage();
    flags[key] = value;
  }
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(flags.operation ?? "")) usage();
  if (action === "start") {
    if (START.some(key => flags[key] === undefined)) usage();
    if (![flags.executor, flags.verifier].every(value => /^T-\d+(?:-s\d+)?-a[1-9]\d*$/.test(value ?? ""))) usage();
    for (const role of ["product", "records"]) {
      if (!/^refs\/heads\/[^\s]+$/.test(flags[`${role}-ref`] ?? "") || !/^[0-9a-f]{40}$/.test(flags[`${role}-base`] ?? "")) usage();
    }
  }
  return {action, flags};
}
/** Explicit receipt projection: never print a run record, private body, raw
 * provider response, child transcript or exception message. @param {any} value */
function receipt(value) {
  /** @type {Record<string,any>} */ const result = {};
  for (const key of ["status", "code", "operationId", "taskId", "requestDigest", "authorityDigest", "commit", "tree", "historical", "currentObservation", "recordsCompletion", "cleanupWarning"])
    if (["string", "boolean"].includes(typeof value?.[key])) result[key] = value[key];
  for (const key of ["publication", "ci"]) if (typeof value?.[key] === "string") result[key] = value[key];
  const identity = (/** @type {any} */ item) => Object.fromEntries(["ref", "previousRevision", "commit", "tree", "correlationRef", "attribution"].filter(key => typeof item?.[key] === "string").map(key => [key,item[key]]));
  if (Array.isArray(value?.landings)) result.landings = value.landings.map(identity);
  if (value?.publication && typeof value.publication === "object") result.publication = identity(value.publication);
  if (Array.isArray(value?.cleanupWarnings) && value.cleanupWarnings.length) result.cleanupWarnings = value.cleanupWarnings.map((/** @type {any} */ warning) =>
    ({code:warning?.code === "QUALIFIED_DELIVERY_ACCEPTED_LOCK_UNAVAILABLE" ? warning.code : "delivery-cleanup-unavailable"}));
  return result;
}
/** @param {string[]} argv */
export async function main(argv) {
  if (argv.length === 1 && ["--help", "-h"].includes(argv[0] ?? "")) {process.stdout.write(USAGE); return 0;}
  let operationId;
  try {
    const {action,flags} = parse(argv), id = /** @type {string} */ (flags.operation); operationId = id;
    const root = realpathSync(flags.root ?? process.cwd());
    const local = await import("./qualified-delivery-operation.mjs");
    // The backend-owned lazy getter preserves each existing owner's original
    // accepted-result-before-current-TOOL ordering. No getter comes from wire.
    const checker = await import("./records-check.mjs");
    /** @type {any} */ let selectedTool;
    const configuration = {get tool() {
      if (selectedTool === undefined) {
        const tool = checker.loadInstalledRecordTool();
        checker.requireInstalledRuntimeAssets(tool,["tools/e2e/scripts/qualified-delivery-command.mjs"]);
        selectedTool = tool;
      }
      return selectedTool;
    }};
    let result;
    if (action === "start") {
      const {readAcceptedOperation} = await import("./durable-operation.mjs");
      if (readAcceptedOperation(root,id) === null) {
        const configured = await import("./configured-dispatch.mjs");
        await configured.captureConfiguredDispatchForRun(root, /** @type {string} */ (flags.executor), configuration);
        await configured.captureConfiguredDispatchForRun(root, /** @type {string} */ (flags.verifier), configuration);
      } else if (local.observeQualifiedLocalDelivery(root,id)?.status !== "local-integrated") configuration.tool;
      result = await local.executeQualifiedPublicationLocalDelivery(root,{operationId:id,executorAttempt:flags.executor,verifierAttempt:flags.verifier,
        targets:{product:{ref:flags["product-ref"],expectedRevision:flags["product-base"]},records:{ref:flags["records-ref"],expectedRevision:flags["records-base"]}}},configuration);
    } else if (action === "local") {
      if (local.observeQualifiedLocalDelivery(root,id)?.status !== "local-integrated") configuration.tool;
      result = await local.replayQualifiedPublicationLocalDelivery(root,id,configuration);
    } else if (action === "publish") result = await (await import("./qualified-publication-operation.mjs")).publishQualifiedDelivery(root,id,configuration);
    else if (action === "ci") result = await (await import("./qualified-ci-operation.mjs")).reconcileQualifiedDeliveryCi(root,id,configuration);
    else if (action === "complete") result = await (await import("./qualified-completion-operation.mjs")).completeQualifiedRecordsDelivery(root,id,configuration);
    else {
      const observed = local.observeQualifiedLocalDelivery(root,id);
      if (observed === null) throw Object.assign(new Error("Absent operation"),{code:"QUALIFIED_DELIVERY_ABSENT"});
      const op = observed.record.operation;
      result = {status:observed.status,operationId,requestDigest:op.digest};
      process.stdout.write(JSON.stringify({...receipt(result),route:op.request.route.name,local:observed.receipt === null ? null : receipt(observed.receipt),
        retainedProgress:{publication:op.publication?.phase ?? "not-started",ci:op.validation?.phase ?? "not-started",completion:op.completion?.phase ?? "not-started"},
        laterProgress:"retained only; use the named step to observe its original acceptance"})+"\n"); return 0;
    }
    process.stdout.write(JSON.stringify(receipt(result))+"\n");
    return result.status === "validation-failed" ? 1 : ["cannot-run","validation-unknown"].includes(result.status) ? 3 : 0;
  } catch (error) {
    const raw = /** @type {any} */ (error)?.code, code = typeof raw === "string" && /^[A-Za-z0-9_.:-]{1,128}$/.test(raw) ? raw : "delivery-unavailable";
    process.stderr.write(JSON.stringify({status:"unavailable",code,...(operationId === undefined ? {} : {operationId})})+"\n");
    return code === "delivery-usage" ? 2 : 3;
  }
}
if (isMain(import.meta)) process.exitCode = await main(process.argv.slice(2));
