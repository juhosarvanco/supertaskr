/** Constructor-owned configured lane and private dispatch stamp plan.
 * Planning uses committed P/R and external scratch only. Effect/recovery entry
 * will consume this exact handle; no grade/program/policy comes from a caller. */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { lstatSync, realpathSync } from "node:fs";
import path from "node:path";
import { parseTaskFile, selectTaskSchedule, extractFrontmatter, compareQualifiedFences } from "../../../lib/parser/dist/pure.js";
import { captureCurrentConfiguredDispatchViewSelection, verifyConfiguredDispatchViewSelection } from "./configured-dispatch-view.mjs";
import { captureConfiguredDispatch, configuredDispatchBriefContext, configuredDispatchNativeRole, verifyConfiguredDispatch } from "./configured-dispatch.mjs";
import { configuredDispatchBrief, proposedLanes } from "./configured-dispatch-brief.mjs";
import { configuredAdmissionPreflight } from "./qualified-admission.mjs";
import { captureCommittedInputs, captureTaskSnapshot } from "./records.mjs";
import { conventionsTextFromSource } from "./docs-scan.mjs";
import { stampCard, laneSpellings, outcomeSlug, questionHolds, readQuestions } from "./dispatch-brief.mjs";
import { loadProjectSettings } from "./project-settings.mjs";
import { captureOperationRepository, captureQualifiedOperationRepository } from "./durable-operation.mjs";
import { operationContent, operationDigest } from "./operation-record.mjs";
import { qualifyFixedProductPrePush } from "./fixed-product-hook.mjs";
import { createRecordChecker, checkedRecordWriteSet, requireInstalledRuntimeAssets, verifyInstalledRecordTool } from "./records-check.mjs";
import { captureOperationCommitIdentity } from "./project-init-operation.mjs";
import { captureExactCommitPlan, assertExactRecordTransformations } from "./record-write.mjs";
import { captureCompletedGenesisForDispatch } from "./genesis-bank-plan.mjs";
import { validConfiguredArmRequest } from "./configured-dispatch-record.mjs";
import { nextAttemptId, readQualifiedReservations, allRecords, TERMINAL_STATES } from "./run-record.mjs";

const plans = new WeakMap();
export class ConfiguredArmFinding extends Error {
  /** @param {string} code */
  constructor(code) { super(`${code}: configured lane preparation is unavailable`); this.code = code; }
}
/** @param {string} code @returns {never} */
function refuse(code) { throw new ConfiguredArmFinding(code); }
/** @param {any} value @param {string[]} keys @param {string[]} [optional] */
const shape = (value, keys, optional = []) => value && typeof value === "object" && !Array.isArray(value) && keys.every(key => Object.hasOwn(value, key)) && Object.keys(value).every(key => [...keys, ...optional].includes(key));
/** @param {any} value @returns {any} */
function freeze(value) { if (value && typeof value === "object") { Object.values(value).forEach(freeze); Object.freeze(value); } return value; }
/** @param {any} a @param {any} b */
const same = (a, b) => operationContent(a) === operationContent(b);
/** @param {string} root @param {string[]} args */
function git(root, args) {
  try { return execFileSync("git", ["--no-replace-objects", "-C", root, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 32 * 1024 * 1024,
    env: { ...process.env, GIT_NO_LAZY_FETCH: "1", GIT_OPTIONAL_LOCKS: "0" } }).replace(/\n$/, ""); }
  catch { refuse("configured-arm-git"); }
}
/** Plain parent identity for one exact new destination, preserving path bytes.
 * @param {string} file */
function absentDestination(file) {
  const parent = path.dirname(file);
  let stat;
  try {
    if (realpathSync(parent) !== parent) refuse("configured-arm-parent");
    stat = lstatSync(parent, { bigint: true });
    if (!stat.isDirectory() || stat.isSymbolicLink()) refuse("configured-arm-parent");
  } catch { refuse("configured-arm-parent"); }
  try { lstatSync(file); refuse("configured-arm-destination-exists"); }
  catch (error) { if (/** @type {any} */ (error).code !== "ENOENT") throw error; }
  return { path: parent, device: String(stat.dev), inode: String(stat.ino) };
}
/** Fixed supported pre-push is qualified by its original canonical engine;
 * unknown hooks/config/routing still refuse, without disabling any guard.
 * @param {string} root @param {string} revision @param {any} tool */
export function configuredArmRepository(root, revision, tool) {
  try { return captureOperationRepository(root, revision); }
  catch (error) {
    if (/** @type {any} */ (error).code !== "OPERATION_ACTIVE_HOOK") throw error;
    return captureQualifiedOperationRepository(root, revision, qualifyFixedProductPrePush({ productRoot: root, tool }));
  }
}
/** Default naming is available only where the selected project has actually
 * declared the existing canonical lane convention. Mixed roots need explicit
 * per-role destinations rather than inventing another project's layout.
 * @param {any} context @param {string} conventions @param {string} title */
function declaredLaneIntent(context, conventions, title) {
  const roles = [...new Set(context.scope.paths.map((/** @type {any} */ row) => row.role))];
  if (roles.length !== 1 || roles[0] !== "product") refuse("configured-arm-explicit-lanes-required");
  const names = laneSpellings(conventions), capsule = context.capsule, root = capsule.selection.authorityRoot;
  const branch = names.branchPattern.replaceAll("T-NNN", capsule.task.id).replaceAll("<slug>", outcomeSlug(title));
  const checkout = path.resolve(root, names.worktreePattern.replaceAll("T-NNN", capsule.task.id));
  if (git(root, ["symbolic-ref", "-q", "HEAD"]) !== `refs/heads/${names.integrationBranch}`) refuse("configured-arm-integration-ref");
  return { version: 1, taskId: capsule.task.id, lanes: [{ role: "product", branch: `refs/heads/${branch}`, checkout }] };
}
/** @param {any} inputs @param {string} taskId */
function schedule(inputs, taskId) {
  const tasks = inputs.tasks.map((/** @type {any} */ row) => {
    const parsed = parseTaskFile(row.content, row.relativePath);
    if (!parsed.task || parsed.issues.length) refuse("configured-arm-board");
    return parsed.task;
  });
  const card = selectTaskSchedule({ tasks, features: [], issues: [] }).cards.find(row => row.id === taskId);
  if (!card || card.status !== "planned" || card.schedule !== "ready") refuse("configured-arm-task-not-ready");
  const questions = questionHolds(readQuestions(inputs.readMany("records", inputs.paths("records").filter((/** @type {string} */ file) => /^docs\/rooms\/[^/]+\.md$/.test(file)))));
  if (questions.has(taskId)) refuse("configured-arm-question-held");
}
/** Immutable finite selector data only. This constructor has no public effect
 * registration; its exact schema/provenance is reviewed before the producer.
 * @param {string} productRoot
 * @param {{operationId:string,taskId:string,native:{sessionId:string,coordinatorTurnId:string},laneIntent?:any}} request
 * @param {{tool:any}} configuration */
export async function captureConfiguredArmPlan(productRoot, request, configuration) {
  if (!shape(configuration, ["tool"]) || !shape(request, ["operationId", "taskId", "native"], ["laneIntent"]) ||
      !/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(request.operationId) || !/^T-\d+(?:-s\d+)?$/.test(request.taskId) ||
      !shape(request.native, ["sessionId", "coordinatorTurnId"]) || Object.values(request.native).some(value => typeof value !== "string" || !value || value.trim() !== value || value.length > 256 || /[\x00-\x1f\x7f]/.test(value))) refuse("configured-arm-request");
  const tool = configuration.tool;
  requireInstalledRuntimeAssets(tool, ["configured-dispatch-arm", "configured-dispatch-record", "configured-dispatch", "configured-dispatch-brief", "qualified-native", "qualified-admission", "record-write", "genesis-bank-plan"]
    .map(name => `tools/e2e/scripts/${name}.mjs`));
  const selected = captureCurrentConfiguredDispatchViewSelection(productRoot);
  if (typeof selected.projectId !== "string") refuse("configured-arm-project-identity");
  const handle = captureConfiguredDispatch({ ...selected, projectId: selected.projectId, taskId: request.taskId, tool });
  const context = configuredDispatchBriefContext(handle), capsule = context.capsule, root = selected.authorityRoot;
  const executor = configuredDispatchNativeRole(handle, "executor"), verifier = configuredDispatchNativeRole(handle, "verifier");
  const inputs = captureCommittedInputs({ productRoot: root, productRevision: selected.revisions.product, recordsRevision: selected.revisions.records });
  schedule(inputs, request.taskId);
  const snapshot = captureTaskSnapshot({ productRoot: root, productRevision: selected.revisions.product, recordsRevision: selected.revisions.records, taskId: request.taskId }, inputs);
  const conventions = conventionsTextFromSource(inputs.read("records", "docs/CONVENTIONS.md").content, { read: file => inputs.read("records", file).content, paths: () => inputs.paths("records") });
  const laneIntent = request.laneIntent ?? declaredLaneIntent(context, conventions, String(snapshot.task.fields.title));
  const lanes = proposedLanes(laneIntent, capsule, context.scope).map((/** @type {any} */ lane) => {
    const repositoryRoot = lane.role === "product" ? root : capsule.receipt.recordsRoot;
    if (git(repositoryRoot, ["for-each-ref", "--format=%(refname)", lane.branch]) !== "") refuse("configured-arm-branch-exists");
    return { role: lane.role, checkout: lane.checkout, branch: lane.branch, base: lane.base, parent: absentDestination(lane.checkout) };
  });
  const claims = await readQualifiedReservations(root);
  if (claims.some(claim => compareQualifiedFences(context.scope, claim.scope.fence, context.scope.repositories).verdict !== "disjoint") || allRecords(root).some(rec => rec.assignment.kind === "card" && !rec.native?.qualified && (!TERMINAL_STATES.includes(rec.state) || rec.reservation.releasedAt === null))) refuse("configured-arm-writer-held");
  const roles = [...new Set(context.scope.paths.map((/** @type {any} */ row) => row.role))];
  const admissionRequest = { version: 1, ...selected, taskId: request.taskId, roles,
    admission: { boundary: "lane-cut", role: "executor", kind: "explicit", parent: "", evidence: "", scope: "product-change", attempt: null } };
  const admission = await configuredAdmissionPreflight(admissionRequest, handle);
  if (!admission.permitted || !admission.grant.enforced) refuse(admission.refusals[0]?.code ?? "configured-arm-approval-required");
  const brief = await configuredDispatchBrief(selected, { tool, taskId: request.taskId, laneIntent });
  if (!brief.complete || brief.code !== 0) refuse("configured-arm-brief-unanswered");
  if (git(root, ["status", "--porcelain=v1", "--untracked-files=all"]) !== "") refuse("configured-arm-product-dirty");
  const parents = git(root, ["rev-list", "--parents", "-n", "1", selected.revisions.product]).split(" ");
  if (parents.length > 2) refuse("configured-arm-merge-base");
  const repositories = { product: configuredArmRepository(root, selected.revisions.product, tool), records: configuredArmRepository(capsule.receipt.recordsRoot, selected.revisions.records, tool) };
  const targetRefs = { product: git(root, ["symbolic-ref", "-q", "HEAD"]), records: git(repositories.records.root, ["symbolic-ref", "-q", "HEAD"]) };
  const tier = context.verification.tier ?? context.verification.derivedTier;
  const fields = { status: "building", builder: JSON.stringify(executor.requested), verifier: JSON.stringify(verifier.requested), tier, review: "independent" };
  const after = stampCard(snapshot.content, fields, { insertAfter: { tier: "size" } }).text;
  if (extractFrontmatter(after, snapshot.task.relativePath).body !== extractFrontmatter(snapshot.content, snapshot.task.relativePath).body) refuse("configured-arm-card-contract");
  const loaded = loadProjectSettings({ productRoot: root, productRevision: selected.revisions.product, tool });
  if (loaded.status !== "ready") refuse(loaded.code);
  const checker = createRecordChecker({ profile: loaded.settings.records.validation, tool }), captured = checker.capture({ productRoot: root, productRevision: selected.revisions.product, recordsRevision: selected.revisions.records });
  const checked = checker.evaluate(captured, [{ operation: "edit", path: snapshot.task.relativePath, type: "blob", mode: inputs.read("records", snapshot.task.relativePath).mode, bytes: Buffer.from(after) }]);
  if (!checked.accepted) refuse("configured-arm-private-check");
  const writes = checkedRecordWriteSet(checked).writes.map((/** @type {any} */ write) => ({ path: write.path, operation: "write", mode: write.mode, base64: Buffer.from(write.bytes).toString("base64") }));
  // Private lifecycle generation never silently overwrites a working editor.
  for (const write of writes) if (git(repositories.records.root, ["status", "--porcelain=v1", "--untracked-files=all", "--", write.path]) !== "") refuse("configured-arm-record-editor-dirty");
  assertExactRecordTransformations(repositories.records.root, writes.map((/** @type {any} */ write) => write.path));
  const identity = captureOperationCommitIdentity(repositories.records.root), message = `Dispatch ${request.taskId}\n\nsupertaskr-dispatch: ${request.operationId}\n`;
  const stamp = { ...captureExactCommitPlan(repositories.records.root, selected.revisions.records, writes, { identity, message }), writes, identity, message, fields, targetRef: targetRefs.records };
  const pFiles = inputs.paths("product").slice().sort();
  const baseline = pFiles.join("\0") === [".gitignore", "AGENTS.md", "CLAUDE.md", "supertaskr.yaml"].sort().join("\0") ?
    captureCompletedGenesisForDispatch({ productRoot: root, tool, taskId: request.taskId }) :
    { kind: "required-original-suites", policyDigest: capsule.gatePolicy.digest, required: [...capsule.gatePolicy.required] };
  const finalAdmission = await configuredAdmissionPreflight(admissionRequest, handle);
  if (!finalAdmission.permitted || !same(finalAdmission.grant, admission.grant) || !same(finalAdmission.receipt, admission.receipt)) refuse("configured-arm-approval-changed");
  for (const lane of lanes) {
    if (!same(absentDestination(lane.checkout), lane.parent) || git(lane.role === "product" ? root : repositories.records.root, ["for-each-ref", "--format=%(refname)", lane.branch]) !== "") refuse("configured-arm-lane-changed");
  }
  if ((await readQualifiedReservations(root)).some(claim => compareQualifiedFences(context.scope, claim.scope.fence, context.scope.repositories).verdict !== "disjoint")) refuse("configured-arm-writer-held");
  verifyConfiguredDispatch(handle); verifyConfiguredDispatchViewSelection(selected); verifyInstalledRecordTool(tool);
  const data = freeze({ version: 1, kind: "configured-dispatch", operationId: request.operationId, taskId: request.taskId,
    selection: selected, capsule, scope: context.scope, verification: context.verification, repositories, targetRefs, tool, admission: { grant: admission.grant, receipt: admission.receipt },
    lanes: lanes.map((/** @type {any} */ lane) => ({ ...lane, base: lane.role === "records" ? stamp.commit : lane.base })),
    stamp, baseline, role: executor, expectedAttempt: nextAttemptId(root, request.taskId),
    native: { ...request.native, taskName: `/root/configured_${createHash("sha256").update(request.operationId).digest("hex").slice(0, 24)}`, ignoredOutputs: [] },
    brief: { text: brief.text, sha256: createHash("sha256").update(brief.text).digest("hex") },
    validation: { captureDigest: checked.captureDigest, candidateDigest: checked.candidateDigest, derivations: checked.derivations } });
  if (!validConfiguredArmRequest(data)) refuse("configured-arm-request-schema");
  const proposal = freeze({ version: 1, operationId: request.operationId, taskId: request.taskId, digest: operationDigest(data), authority: "proposal only; no stamp, lane, reservation or native start" });
  plans.set(proposal, { data, handle, tool, selected }); return proposal;
}
/** Authentic current constructor data only; cloning JSON creates no authority.
 * @param {object} proposal */
export function configuredArmPlanData(proposal) {
  const state = plans.get(proposal); if (!state) refuse("configured-arm-plan-required");
  verifyConfiguredDispatch(state.handle); verifyConfiguredDispatchViewSelection(state.selected); verifyInstalledRecordTool(state.tool);
  return structuredClone(state.data);
}

/** Backend-only original constructor context. A copied proposal or another
 * TOOL handle cannot select an effect request. @param {object} proposal @param {any} tool */
export function preparedConfiguredArmContext(proposal,tool){
 const state=plans.get(proposal);if(!state||state.tool!==tool)refuse("configured-arm-plan-required");
 configuredArmPlanData(proposal);return {request:state.data,handle:state.handle};
}
