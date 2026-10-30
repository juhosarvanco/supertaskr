/** Constructor-owned configured dispatch data. This captures no grant, starts
 * no child and writes no file. Existing admission remains the authority. */
import { freezeSettings, PROCESS_SCHEMA, VERIFICATION_TIERS } from "../../../lib/parser/dist/pure.js";
import { realpathSync } from "node:fs";
import { captureOperationRepository } from "./durable-operation.mjs";
import { operationContent, operationDigest } from "./operation-record.mjs";
import { captureConfiguredGatePolicy, createConfiguredGateRunner } from "./gate-run.mjs";
import { loadProjectSettings, normalizeProjectRoleModel } from "./project-settings.mjs";
import { loadInstalledRecordTool, readInstalledMethodAsset, requireInstalledRuntimeAssets } from "./records-check.mjs";
import { captureCommittedInputs, captureTaskSnapshot } from "./records.mjs";
import { captureQualifiedInputs } from "./qualified-reservation.mjs";
import { resolveWorkspace, workspaceBindingPresent } from "./workspace.mjs";
import { ROLE_TEMPLATE_KEYS, classifyTier, modelChoice, roleModel } from "./dispatch-brief.mjs";
import { allRecords } from "./run-record.mjs";
import { createProjectRuntime } from "./project-runtime.mjs";

/** @type {WeakMap<object,{selection:any,tool:any,policy:ReturnType<typeof captureConfiguredGatePolicy>,schema:{text:string,sha256:string},capsule:any,fence:any,productPaths:readonly string[],runtime?:ReturnType<typeof createProjectRuntime>}>} */
const captured = new WeakMap();
/** @param {string} code @param {string} detail @returns {never} */
function refuse(code, detail) { throw Object.assign(new Error(detail), { code }); }
/** @param {any} value @param {string[]} required @param {string[]} [optional] */
function shape(value, required, optional = []) {
  if (!value || typeof value !== "object" || Array.isArray(value) || required.some(key => !Object.hasOwn(value, key)) ||
    Object.keys(value).some(key => ![...required, ...optional].includes(key))) refuse("configured-dispatch-request", "Only the declared constructor selection and TOOL context are accepted");
}
/** @param {any} value */
function data(value) { return freezeSettings(structuredClone(value)); }
/** @param {any} tool */
function verifyTool(tool) {
  requireInstalledRuntimeAssets(tool, ["tools/e2e/scripts/configured-dispatch.mjs", "tools/e2e/scripts/qualified-reservation.mjs",
    "tools/e2e/scripts/records.mjs", "tools/e2e/scripts/workspace.mjs", "tools/e2e/scripts/gate-run.mjs", "tools/e2e/scripts/project-settings.mjs", "tools/e2e/scripts/project-runtime.mjs", "tools/e2e/scripts/dispatch-brief.mjs"]);
}
/** Exact original P/R revisions and delivered binding only. Card model stamps
 * override configured defaults; transient requests cannot replace either.
 * @param {{authorityRoot:string,projectId:string,revisions:{product:string,records:string},taskId:string,legacyTokenMap:any,tool?:any}} options */
export function captureConfiguredDispatch(options) {
  shape(options, ["authorityRoot", "projectId", "revisions", "taskId", "legacyTokenMap"], ["tool"]);
  shape(options.revisions, ["product", "records"]);
  const requested = data({ authorityRoot: options.authorityRoot, projectId: options.projectId, revisions: options.revisions, taskId: options.taskId, legacyTokenMap: options.legacyTokenMap });
  const tool = options.tool ?? loadInstalledRecordTool(); verifyTool(tool);
  if (!workspaceBindingPresent(requested.authorityRoot)) refuse("configured-dispatch-binding-required", "Configured dispatch requires explicitly selected independent RECORDS");
  const workspace = resolveWorkspace({ productRoot: requested.authorityRoot, mode: "development", commit: requested.revisions.product });
  if (workspace.layout !== "split") refuse("configured-dispatch-layout", "Configured dispatch requires the delivered independent RECORDS layout");
  const selection = data({ ...requested, authorityRoot: workspace.productRoot });
  const origins = { product: captureOperationRepository(workspace.productRoot, selection.revisions.product, { forEffect: false }),
    records: captureOperationRepository(workspace.recordsRoot, selection.revisions.records, { forEffect: false }) };
  const canonical = captureQualifiedInputs(selection), inputs = captureCommittedInputs({ productRoot: workspace.productRoot, productRevision: selection.revisions.product, recordsRevision: selection.revisions.records });
  const snapshot = captureTaskSnapshot({ productRoot: workspace.productRoot, productRevision: selection.revisions.product, recordsRevision: selection.revisions.records, taskId: selection.taskId }, inputs);
  const loaded = loadProjectSettings({ productRoot: workspace.productRoot, productRevision: selection.revisions.product, tool });
  if (loaded.status !== "ready") refuse(loaded.code, loaded.diagnostics.join("; "));
  const schema = readInstalledMethodAsset(tool, PROCESS_SCHEMA), policy = captureConfiguredGatePolicy({ productRoot: workspace.productRoot, productRevision: selection.revisions.product, tool });
  const models = new Map(Object.entries(loaded.settings.roles));
  const roles = Object.fromEntries(Object.entries(ROLE_TEMPLATE_KEYS).map(([role, field]) => {
    const fallback = roleModel(models, role), stamped = ["builder", "verifier"].includes(field) ? snapshot.task.fields[field] : undefined;
    if (stamped !== undefined && stamped !== null && typeof stamped !== "string") refuse("configured-dispatch-role", "Committed role overrides must name one explicit model");
    const override = stamped === null ? undefined : stamped;
    const choice = modelChoice(role, field, fallback, override), normalized = normalizeProjectRoleModel(choice.model);
    if (normalized.status !== "ready") refuse(normalized.reason, normalized.diagnostics.join("; "));
    return [role, { field, configured: fallback.model, source: choice.overridden ? "committed-card" : "committed-configuration", ...normalized.selection }];
  }));
  const declaredTier = snapshot.task.fields.tier ?? null;
  if (declaredTier !== null && !VERIFICATION_TIERS.some(tier => tier === declaredTier)) refuse("configured-dispatch-tier", "The committed task tier is unsupported");
  const base = { version: 1, selection, receipt: canonical.receipt, origins, configuration: loaded.provenance, gatePolicy: policy,
    scopeDigest: operationDigest(canonical.fence), roles, task: { id: selection.taskId, path: snapshot.task.relativePath, blobId: snapshot.task.blobId, size: snapshot.task.fields.size ?? null, declaredTier },
    sessionPolicy: { default: loaded.settings.session_policy.default, warnAfterTurns: loaded.settings.session_policy.warn_after_turns },
    process: { configuration: loaded.settings.process, values: loaded.processValues, schemaDigest: schema.sha256 } };
  verifyTool(tool);
  for (const role of /** @type {const} */ (["product", "records"])) {
    const root = role === "product" ? workspace.productRoot : workspace.recordsRoot;
    if (operationContent(captureOperationRepository(root, selection.revisions[role], { forEffect: false })) !== operationContent(origins[role])) refuse("configured-dispatch-origin-changed", "An original repository incarnation changed during capture");
  }
  if (operationContent(captureQualifiedInputs(selection)) !== operationContent(canonical)) refuse("configured-dispatch-context-changed", "The selected original context changed during capture");
  const capsule = data({ ...base, digest: operationDigest(base) }), handle = Object.freeze({ capsule });
  captured.set(handle, { selection, tool, policy, schema, capsule, fence: canonical.fence, productPaths: inputs.paths("product") }); return handle;
}
/** Authentic constructor handle only, with original committed bytes/origins and
 * TOOL verified again. No current R HEAD or candidate policy can replace them.
 * @param {object} handle */
export function verifyConfiguredDispatch(handle) {
  const state = captured.get(handle);
  if (!state) refuse("configured-dispatch-unrecognized", "Configured dispatch requires its original backend constructor handle");
  const fresh = captureConfiguredDispatch({ ...state.selection, tool: state.tool });
  if (operationContent(fresh.capsule) !== operationContent(state.capsule)) refuse("configured-dispatch-origin-changed", "Original configured dispatch inputs or physical origins differ");
  return state.capsule;
}
/** @param {object} handle @param {{productRoot:string,productRevision:string}} candidate */
export function createConfiguredDispatchGateRunner(handle, candidate) {
  shape(candidate, ["productRoot", "productRevision"]); verifyConfiguredDispatch(handle);
  return createConfiguredGateRunner({ ...candidate, policy: /** @type {NonNullable<ReturnType<typeof captured.get>>} */ (captured.get(handle)).policy });
}
/** Pre-publication native transaction seam; the existing decisive preview is
 * independently produced by canonical admission and must be the same context.
 * This returns data only and grants no child-start permission.
 * @param {object} handle @param {string} root @param {any} assignment @param {any} preview */
export function configuredDispatchStartCapsule(handle, root, assignment, preview) {
  const capsule = verifyConfiguredDispatch(handle), selected = capsule.selection, q = assignment.qualified;
  let sameRoot = false;
  try { sameRoot = realpathSync(root) === selected.authorityRoot && realpathSync(q?.authorityRoot) === selected.authorityRoot; } catch { /* named context refusal below */ }
  if (!sameRoot || assignment.id !== selected.taskId || q?.projectId !== selected.projectId ||
    operationContent(q.revisions) !== operationContent(selected.revisions) || operationContent(q.legacyTokenMap) !== operationContent(selected.legacyTokenMap) ||
    operationContent(q.receipt) !== operationContent(capsule.receipt) || operationContent(preview.receipt) !== operationContent(capsule.receipt) ||
    operationDigest(preview.scope) !== capsule.scopeDigest) refuse("configured-dispatch-start-context", "The decisive native admission differs from the original configured dispatch context");
  rolePolicy(capsule, assignment);
  tierPolicy(/** @type {NonNullable<ReturnType<typeof captured.get>>} */ (captured.get(handle)), capsule);
  if (!assignment.native?.taskName || !assignment.native?.sessionId || allRecords(root).some(rec => rec.native?.launch?.taskName === assignment.native.taskName && rec.native?.launch?.sessionId === assignment.native.sessionId)) {
    refuse("configured-dispatch-fresh-launch", "Fresh configured dispatch requires a new native task identity, without reusing a retained launch");
  }
  return capsule;
}
/** @param {any} capsule @param {any} assignment */
function rolePolicy(capsule, assignment) {
  const role = capsule.roles[assignment.role];
  if (!role) refuse("configured-dispatch-start-model", "Original configured role is unavailable");
  const qualified = /^codex\/(gpt-[A-Za-z0-9][A-Za-z0-9._-]*)$/.exec(role.model);
  const model = qualified?.[1] ?? (/^gpt-[A-Za-z0-9][A-Za-z0-9._-]*$/.test(role.model) ? role.model : null);
  if (model === null) refuse("configured-dispatch-harness-unsupported", "Native Codex requires one explicit gpt model or codex/gpt model spelling; no account or harness default is selected");
  if (assignment.model !== model) refuse("configured-dispatch-start-model", "Requested model differs from the original committed role choice");
  const vehicle = role.vehicle ?? capsule.sessionPolicy.default;
  if (!["fresh", "subagent"].includes(vehicle)) refuse("configured-dispatch-vehicle-unsupported", "This native adapter supports fresh/subagent launches; an original resume/session request cannot select a new or newest child");
  return data({ role: assignment.role, requested: role.requested, model, harness: "codex-desktop-native", vehicle, sessionPolicy: capsule.sessionPolicy });
}
/** Canonical classifier, actual configured guard owners and original source.
 * No generic XS keeper answer is invented from a whole-suite green.
 * @param {NonNullable<ReturnType<typeof captured.get>>} state @param {any} capsule */
function tierPolicy(state, capsule) {
  const runtime = state.runtime ??= createProjectRuntime({ productRoot: state.selection.authorityRoot, productRevision: state.selection.revisions.product, tool: state.tool });
  const paths = state.fence.paths.filter((/** @type {any} */ entry) => entry.role === "product").map((/** @type {any} */ entry) => entry.domain);
  const guards = paths.length ? runtime.section("guard_class") : {};
  if (paths.length) runtime.classify(paths);
  let derived;
  try {
    derived = classifyTier({ size: capsule.task.size ?? "", fencePaths: paths, unresolved: [],
      untracked: paths.filter((/** @type {string} */ domain) => !state.productPaths.some(file => file === domain || file.startsWith(`${domain}/`))),
      guardMap: new Map(Object.entries(guards)), process: runtime.process().settings,
      keeper: { answered: false, pinned: false, why: "This configured layout has no qualified generic keeper-ownership adapter" } });
  } catch { refuse("configured-dispatch-tier-unavailable", "Original tier cannot be derived; missing inputs or generic XS keeper ownership remain unavailable"); }
  const declared = capsule.task.declaredTier;
  if (declared === null) refuse("configured-dispatch-tier-required", "Commit the canonically classified tier on the original task before dispatch");
  if (VERIFICATION_TIERS.indexOf(declared) < VERIFICATION_TIERS.indexOf(/** @type {any} */ (derived.tier))) refuse("configured-dispatch-tier-understated", "The committed tier is below its original configured process/guard classification");
  return data({ tier: declared, derivedTier: derived.tier, reason: derived.reason });
}
/** One verified batch for the readonly fixed effect helper. No caller can
 * choose another model, vehicle or METHOD asset. @param {object} handle @param {any} assignment */
export function configuredDispatchEffectContext(handle, assignment) {
  const capsule = verifyConfiguredDispatch(handle), state = /** @type {NonNullable<ReturnType<typeof captured.get>>} */ (captured.get(handle));
  return data({ capsule, role: rolePolicy(capsule, assignment), verification: tierPolicy(state, capsule), schema: { text: state.schema.text, sha256: state.schema.sha256 } });
}
/** Fixed read-only helpers use this verified METHOD datum, never a schema path
 * supplied by record metadata. @param {object} handle */
export function configuredDispatchSchema(handle) {
  verifyConfiguredDispatch(handle); return data(/** @type {NonNullable<ReturnType<typeof captured.get>>} */ (captured.get(handle)).schema);
}
