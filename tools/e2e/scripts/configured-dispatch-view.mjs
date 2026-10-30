/** Installed paired-snapshot dispatch view. Every board byte comes from the
 * explicitly selected RECORDS commit; METHOD comes from verified TOOL assets.
 * Mutable approval/claims are observations, never stamped as committed facts. */
import { readFileSync, realpathSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { hostname } from "node:os";
import { byTaskId, compareQualifiedFences, parseTaskFile, selectTaskSchedule } from "../../../lib/parser/dist/pure.js";
import { captureOperationRepository } from "./durable-operation.mjs";
import { operationContent } from "./operation-record.mjs";
import { captureCommittedInputs } from "./records.mjs";
import { normalizeContextRequest } from "./records-context.mjs";
import { captureConfiguredGatePolicy } from "./gate-run.mjs";
import { captureConfiguredDispatch, configuredDispatchViewContext, verifyConfiguredDispatch } from "./configured-dispatch.mjs";
import { configuredAdmissionPreflight } from "./qualified-admission.mjs";
import { loadInstalledRecordTool, readInstalledMethodAssets, requireInstalledRuntimeAssets } from "./records-check.mjs";
import { ROLE_TEMPLATE_KEYS, blank, liveProv, note, questionHolds, readQuestions, render, treeProv, value } from "./dispatch-brief.mjs";
import { allRecords, readQualifiedReservations, TERMINAL_STATES } from "./run-record.mjs";
import { resolveWorkspace, workspaceBindingPresent } from "./workspace.mjs";

/** @param {string} code @param {string} message @returns {never} */
function refuse(code, message) { throw Object.assign(new Error(message), { code }); }
/** @type {WeakMap<object,{origins:any}>} */
const currentCuts = new WeakMap();
/** @param {string} root */
function head(root) {
  let cut;
  try { cut = execFileSync("git", ["--no-replace-objects", "-C", root, "rev-parse", "--verify", "HEAD"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, GIT_NO_LAZY_FETCH: "1", GIT_OPTIONAL_LOCKS: "0" } }).replace(/\n$/, ""); }
  catch { refuse("configured-dispatch-view-cut", "Cannot capture the selected committed view cut"); }
  if (!/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(cut)) refuse("configured-dispatch-view-cut", "View requires an exact committed cut");
  return cut;
}
/** @param {any} selected @param {any} origins */
function assertCurrentCuts(selected, origins) {
  const workspace = resolveWorkspace({ productRoot: selected.authorityRoot, commit: selected.revisions.product, mode: "development" });
  if (workspace.layout !== "split" || workspace.association.projectId !== selected.projectId) refuse("configured-dispatch-view-cut-changed", "Selected records context changed during view capture");
  for (const role of /** @type {const} */ (["product", "records"])) {
    const root = role === "product" ? selected.authorityRoot : workspace.recordsRoot;
    if (head(root) !== selected.revisions[role] || operationContent(captureOperationRepository(root, selected.revisions[role], { forEffect: false })) !== operationContent(origins[role])) refuse("configured-dispatch-view-cut-changed", "A selected committed cut or physical origin changed during view capture");
  }
}
/** Ordinary first-render entry: capture exact current committed cuts through
 * the delivered binding. Empty legacy mapping does not infer old ownership.
 * No grant, model, configuration or working Markdown is substituted.
 * @param {string} root */
export function captureCurrentConfiguredDispatchViewSelection(root) {
  const authorityRoot = realpathSync(root);
  if (!workspaceBindingPresent(authorityRoot)) refuse("configured-dispatch-binding-required", "View requires explicitly selected independent RECORDS");
  const product = head(authorityRoot), workspace = resolveWorkspace({ productRoot: authorityRoot, commit: product, mode: "development" });
  if (workspace.layout !== "split") refuse("configured-dispatch-layout", "View requires independent RECORDS");
  const records = head(workspace.recordsRoot), selected = Object.freeze({ authorityRoot, projectId: workspace.association.projectId,
    revisions: Object.freeze({ product, records }), legacyTokenMap: Object.freeze({}) });
  const origins = { product: captureOperationRepository(authorityRoot, product, { forEffect: false }), records: captureOperationRepository(workspace.recordsRoot, records, { forEffect: false }) };
  assertCurrentCuts(selected, origins); currentCuts.set(selected, { origins }); return selected;
}
/** @param {any} input */
function selection(input) {
  const keys = ["authorityRoot", "projectId", "revisions", "legacyTokenMap"];
  if (!input || typeof input !== "object" || Array.isArray(input) || Object.keys(input).sort().join("\0") !== keys.sort().join("\0") ||
      typeof input.authorityRoot !== "string" || typeof input.projectId !== "string" || !input.projectId || input.projectId.trim() !== input.projectId ||
      !input.revisions || Object.keys(input.revisions).sort().join("\0") !== "product\0records" ||
      Object.values(input.revisions).some(revision => typeof revision !== "string" || !/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(revision))) refuse("configured-dispatch-view-selection", "View requires an explicit original PRODUCT/RECORDS selection");
  const legacyTokenMap = normalizeContextRequest({ version: 1, legacyTokenMap: input.legacyTokenMap, inputs: [] }).legacyTokenMap;
  return { authorityRoot: realpathSync(input.authorityRoot), projectId: input.projectId, revisions: { ...input.revisions }, legacyTokenMap };
}
/** Selection is data only: no executable, TOOL or schema path is accepted.
 * @param {string} file @param {string} root */
export function readConfiguredDispatchViewSelection(file, root) {
  let input;
  try { input = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(readFileSync(file))); }
  catch { refuse("configured-dispatch-view-selection", "View selection must be readable UTF-8 JSON"); }
  const selected = selection(input);
  if (selected.authorityRoot !== realpathSync(root)) refuse("configured-dispatch-view-root", "View selection must name the selected PRODUCT root");
  return selected;
}
/** Reads only; no lane, reservation, grant or artifact is written. The output
 * names the checks it can observe and leaves broader operational qualification
 * explicit. No missing configuration or legacy claim is an empty green.
 * @param {any} input @param {{tool?:any,taskId?:string,full?:boolean}} [options] */
export async function configuredDispatchView(input, options = {}) {
  if (!options || Object.keys(options).some(key => !["tool", "taskId", "full"].includes(key)) ||
      options.taskId !== undefined && !/^T-\d+(?:-s\d+)?$/.test(options.taskId) || options.full !== undefined && typeof options.full !== "boolean") refuse("configured-dispatch-view-options", "Unsupported dispatch view option");
  const current = currentCuts.get(input), selected = selection(input), root = selected.authorityRoot, tool = options.tool ?? loadInstalledRecordTool();
  if (current) assertCurrentCuts(selected, current.origins);
  requireInstalledRuntimeAssets(tool, ["tools/e2e/scripts/configured-dispatch-view.mjs", "tools/e2e/scripts/configured-dispatch.mjs", "tools/e2e/scripts/qualified-admission.mjs", "tools/e2e/scripts/run-record.mjs"]);
  if (!workspaceBindingPresent(root)) refuse("configured-dispatch-binding-required", "View requires explicitly selected independent RECORDS");
  const workspace = resolveWorkspace({ productRoot: root, commit: selected.revisions.product, mode: "development" });
  if (workspace.layout !== "split") refuse("configured-dispatch-layout", "View requires independent RECORDS");
  const original = { product: captureOperationRepository(root, selected.revisions.product, { forEffect: false }),
    records: captureOperationRepository(workspace.recordsRoot, selected.revisions.records, { forEffect: false }) };
  const inputs = captureCommittedInputs({ productRoot: root, productRevision: selected.revisions.product, recordsRevision: selected.revisions.records });
  if (inputs.receipt.projectId !== selected.projectId) refuse("configured-dispatch-view-project", "Selected project association differs");
  // This captures definitions, not physical runner cwd/sentinel readiness.
  const policy = captureConfiguredGatePolicy({ productRoot: root, productRevision: selected.revisions.product, tool });
  const methodPaths = ["method/roles/orchestrator.md", "method/lane-protocol.md", ...Object.keys(ROLE_TEMPLATE_KEYS).map(role => `method/roles/${role}.md`)];
  const method = readInstalledMethodAssets(tool, methodPaths);
  const tasks = inputs.tasks.map(task => {
    const parsed = parseTaskFile(task.content, task.relativePath);
    if (!parsed.task || parsed.issues.length) refuse("configured-dispatch-view-board", `Cannot schedule ${task.relativePath}: canonical task parser refused`);
    return parsed.task;
  });
  const schedule = selectTaskSchedule({ tasks, features: [], issues: [] }), questions = questionHolds(readQuestions([...inputs.readMany("records", inputs.paths("records").filter(file => /^docs\/rooms\/[^/]+\.md$/.test(file)))]));
  const claims = await readQualifiedReservations(root), runs = allRecords(root);
  const unknownWriters = runs.filter(rec => rec.assignment.kind === "card" && !rec.native?.qualified && (!TERMINAL_STATES.includes(rec.state) || rec.reservation.releasedAt === null));
  const at = new Date().toISOString(), host = hostname(), live = liveProv(at, host, "actual current approval/pause, retained runs and canonical acquired reservations; snapshot advice only");
  const recordProv = treeProv(selected.revisions.records, `selected RECORDS ${workspace.recordsRoot}; PRODUCT ${selected.revisions.product}`);
  const toolProv = liveProv(at, host, `verified installed TOOL ${tool.manifestDigest}; METHOD ${tool.methodDigest}`);
  /** @type {import("./dispatch-brief.mjs").Rec[]} */
  const rows = [note("CONFIGURED DISPATCH VIEW"), note("Snapshot advice only; actual start and effects repeat their own current admission checks."),
    value(`PRODUCT ${root} at ${selected.revisions.product}; RECORDS ${workspace.recordsRoot} at ${selected.revisions.records}`, recordProv),
    value(`TOOL ${tool.package.name}@${tool.package.version}; METHOD ${tool.methodVersion}; manifest ${tool.manifestDigest}`, toolProv),
    value(`Original required suites: ${policy.required.join(", ")}; policy ${policy.digest}`, treeProv(selected.revisions.product, "committed supertaskr.yaml suite definitions; no command executed")),
    value(`Completed snapshot cards: ${schedule.cards.filter(card => card.status === "done").length}; completed history is not re-admitted`, recordProv),
    value(`Acquired qualified sets: ${claims.length}; unknown legacy writer claims: ${unknownWriters.length}`, live)];
  const wanted = schedule.cards.filter(card => options.taskId === undefined ? options.full || card.status !== "done" : card.id === options.taskId).sort((a, b) => byTaskId(a.id, b.id));
  if (options.taskId !== undefined && wanted.length === 0) refuse("configured-dispatch-view-task", "The selected task has no dispatch schedule row");
  /** @type {object[]} */ const handles = [];
  let unavailable = false;
  for (const card of wanted) {
    rows.push(blank(), value(`${card.id} — ${card.title}; status ${card.status}; schedule ${card.schedule}${card.unmet?.length ? `; unmet ${card.unmet.map(item => `${item.id}(${item.status ?? "missing"})`).join(", ")}` : ""}`, recordProv));
    if (card.status === "done") {
      rows.push(value("Disposition: DONE — committed board history; no new admission, model or tier qualification inferred", recordProv));
      continue;
    }
    try {
      const handle = captureConfiguredDispatch({ ...selected, taskId: card.id, tool }); handles.push(handle);
      const capsule = handle.capsule;
      for (const [role, choice] of Object.entries(capsule.roles)) rows.push(value(`${role}: ${choice.requested}; vehicle ${choice.vehicle ?? capsule.sessionPolicy.default}`, treeProv(choice.source === "committed-card" ? selected.revisions.records : selected.revisions.product, `${choice.source}; original card ${capsule.task.blobId}; supertaskr.yaml roles; session policy ${JSON.stringify(capsule.sessionPolicy)}`)));
      rows.push(value(`Process: ${JSON.stringify(capsule.process.values)}; schema ${capsule.process.schemaDigest}`, treeProv(selected.revisions.product, `committed process selection; verified METHOD ${tool.methodDigest}`)));
      const context = configuredDispatchViewContext(handle), scopeRoles = [...new Set(context.scope.paths.map((/** @type {any} */ entry) => entry.role))];
      rows.push(value(`Scope ${capsule.scopeDigest}: ${context.scope.paths.map((/** @type {any} */ entry) => `${entry.role}::${entry.domain}`).join(", ")}`, recordProv),
        value(`Tier ${context.verification.tier}; derived ${context.verification.derivedTier}: ${context.verification.reason}; guard hits ${JSON.stringify(context.guards)}`, treeProv(selected.revisions.records, `original card + PRODUCT ${selected.revisions.product} guard_class/process; verified METHOD TASK-FORMAT`)));
      const preview = await configuredAdmissionPreflight({ version: 1, ...selected, taskId: card.id, roles: scopeRoles,
        admission: { boundary: "lane-cut", role: "executor", kind: "explicit", parent: "", evidence: "", scope: "product-change", attempt: null } }, handle);
      const overlapping = claims.map(claim => ({ attempt: claim.reservation.attempt, comparison: compareQualifiedFences(context.scope, claim.scope.fence, context.scope.repositories) })).filter(claim => claim.comparison.verdict !== "disjoint");
      const held = questions.get(card.id);
      const state = held ? `QUESTION HELD ${held.id} in ${held.room}` : card.schedule !== "ready" ? card.schedule.toUpperCase() :
        overlapping.length ? `FENCED ${overlapping.map(claim => `${claim.attempt}(${claim.comparison.verdict})`).join(", ")}` : unknownWriters.length ? "UNAVAILABLE: legacy writer scope is not qualified" :
        !preview.permitted ? `ADMISSION REFUSED ${preview.refusals.map((/** @type {any} */ item) => item.code).join(", ")}` : !preview.grant.enforced ? "AWAITING APPROVAL: no current grant" : "PREPARABLE SNAPSHOT: current canonical approval permits preparation";
      if (unknownWriters.length) unavailable = true;
      rows.push(value(`Disposition: ${state}`, held || card.schedule !== "ready" ? recordProv : live), value(`Current approval revision ${preview.grant.revision}; enforced ${preview.grant.enforced}; pause ${preview.grant.paused ?? "none"}; permitted preparation ${preview.permitted}; admitted false; reserved false; started false`, live));
    } catch (error) {
      unavailable = true;
      const code = /** @type {any} */ (error).code;
      rows.push(value(`UNAVAILABLE: ${typeof code === "string" ? code : "configured-dispatch-view-unavailable"}`, live));
    }
  }
  if (wanted.length === 0) rows.push(value("No rendered dispatch cards in the selected committed board", recordProv));
  rows.push(blank(), note("METHOD TEXT — verified installed assets; original words with whitespace normalized."));
  for (const asset of method) {
    const text = (options.full ? asset.text : asset.text.split(/\n\s*\n/).slice(0, 2).join(" ")).replace(/\s+/g, " ").trim();
    rows.push(value(`${asset.path} (${asset.sha256}): ${text}`, toolProv));
  }
  rows.push(note("Lane creation, generic keeper ownership and broader operational qualification remain explicit obligations; this view grants no permission."));
  for (const handle of handles) verifyConfiguredDispatch(handle);
  for (const role of /** @type {const} */ (["product", "records"])) if (operationContent(captureOperationRepository(role === "product" ? root : workspace.recordsRoot, selected.revisions[role], { forEffect: false })) !== operationContent(original[role])) refuse("configured-dispatch-origin-changed", "Original view repository changed");
  requireInstalledRuntimeAssets(tool, ["tools/e2e/scripts/configured-dispatch-view.mjs"]);
  if (current) assertCurrentCuts(selected, current.origins);
  return Object.freeze({ text: render(rows) + "\n", code: unavailable ? 3 : 0 });
}
