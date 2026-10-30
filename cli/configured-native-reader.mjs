/** Cold configured native reader: fixed TOOL entry, builtin dependencies only.
 * Retained metadata is data and never selects a program, TOOL or schema path. */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { validGateContext } from "./gate-token.mjs";

const CHECK_ENTRY = fileURLToPath(new URL("../tools/e2e/scripts/configured-dispatch-check.mjs", import.meta.url));
/** @param {any} value @param {string[]} keys */
function shape(value, keys) { return !!value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).sort().join("\0") === [...keys].sort().join("\0"); }
/** @param {any} value */
function oid(value) { return typeof value === "string" && /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(value); }
/** @param {any} value */
function digest(value) { return typeof value === "string" && /^sha256:[0-9a-f]{64}$/.test(value); }
/** Structural validation only. Canonical committed reconstruction is the fixed
 * helper's job, at actual effects. No parser/build/process is loaded here.
 * @param {any} value */
export function validConfiguredDispatchCapsule(value) {
  if (!shape(value, ["version", "selection", "receipt", "origins", "configuration", "gatePolicy", "scopeDigest", "roles", "task", "sessionPolicy", "process", "digest"]) || value.version !== 1 || !digest(value.digest) || !digest(value.scopeDigest)) return false;
  const selected = value.selection, policy = value.gatePolicy, configuration = value.configuration;
  if (!shape(selected, ["authorityRoot", "projectId", "revisions", "taskId", "legacyTokenMap"]) || typeof selected.authorityRoot !== "string" ||
    typeof selected.projectId !== "string" || !/^T-\d+(?:-s\d+)?$/.test(selected.taskId) || !shape(selected.revisions, ["product", "records"]) ||
    !oid(selected.revisions.product) || !oid(selected.revisions.records) || !selected.legacyTokenMap || typeof selected.legacyTokenMap !== "object" || Array.isArray(selected.legacyTokenMap)) return false;
  if (!shape(value.origins, ["product", "records"]) || !value.receipt || value.receipt.productRoot !== selected.authorityRoot || value.receipt.productBase !== selected.revisions.product ||
    value.receipt.recordsCommit !== selected.revisions.records || value.receipt.projectId !== selected.projectId || !oid(value.receipt.cardBlobId)) return false;
  if (!configuration || configuration.kind !== "committed" || configuration.productRoot !== selected.authorityRoot || configuration.productRevision !== selected.revisions.product || !digest(configuration.configDigest) ||
    !shape(policy, ["version", "productRoot", "policyRevision", "configurationDigest", "toolManifestDigest", "required", "registryDigest", "suites", "digest"]) || policy.version !== 1 ||
    policy.productRoot !== selected.authorityRoot || policy.policyRevision !== selected.revisions.product || policy.configurationDigest !== configuration.configDigest ||
    policy.toolManifestDigest !== configuration.tool?.manifestDigest || !digest(policy.registryDigest) || !digest(policy.digest) || !Array.isArray(policy.suites) ||
    !validGateContext({ configurationDigest: policy.configurationDigest, toolManifestDigest: policy.toolManifestDigest, required: policy.required, policyRevision: policy.policyRevision, policyDigest: policy.digest })) return false;
  if (!shape(value.roles, ["executor", "verifier", "integrator", "planner"]) || Object.values(value.roles).some(role => !shape(role, ["field", "configured", "source", "requested", "model", "vehicle"]) ||
    typeof role.field !== "string" || typeof role.configured !== "string" || !["committed-card", "committed-configuration"].includes(role.source) || typeof role.requested !== "string" || typeof role.model !== "string" || !(role.vehicle === null || typeof role.vehicle === "string"))) return false;
  return shape(value.task, ["id", "path", "blobId", "size", "declaredTier"]) && value.task.id === selected.taskId && value.task.path === value.receipt.cardPath && value.task.blobId === value.receipt.cardBlobId &&
    (value.task.size === null || typeof value.task.size === "string") && (value.task.declaredTier === null || typeof value.task.declaredTier === "string") &&
    shape(value.sessionPolicy, ["default", "warnAfterTurns"]) && typeof value.sessionPolicy.default === "string" && Number.isSafeInteger(value.sessionPolicy.warnAfterTurns) && value.sessionPolicy.warnAfterTurns > 0 &&
    shape(value.process, ["configuration", "values", "schemaDigest"]) && typeof value.process.schemaDigest === "string" && /^[0-9a-f]{64}$/.test(value.process.schemaDigest);
}
/** @param {string} code @returns {never} */
function refuse(code) { throw Object.assign(new Error(`${code}: configured original native policy is unavailable`), { code }); }
/** Caller is already inside the existing decisive transaction. The child is
 * read-only, uses no lock, and rereads the actual named retained record.
 * @param {string} root @param {any} rec */
export function readConfiguredNativePolicy(root, rec) {
  const capsule = rec.native?.qualified?.origins?.configuredDispatch;
  if (!validConfiguredDispatchCapsule(capsule) || typeof rec.attempt !== "string" || !/^T-\d+(?:-s\d+)?-a\d+$/.test(rec.attempt) || !/^[0-9a-f]{64}$/.test(rec.permission?.digest)) refuse("configured-dispatch-retained-shape");
  const result = spawnSync(process.execPath, [CHECK_ENTRY, "--root", root, "--attempt", rec.attempt], { cwd: root, encoding: "utf8", timeout: 30_000, maxBuffer: 4 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] });
  let response; try { response = JSON.parse(result.stdout); } catch { refuse("configured-dispatch-check-unavailable"); }
  if (result.status !== 0 || result.error || result.signal) refuse(typeof response?.code === "string" && /^[A-Za-z][A-Za-z0-9_-]*$/.test(response.code) ? response.code : "configured-dispatch-check-unavailable");
  if (!shape(response, ["status", "capsuleDigest", "permissionDigest", "toolManifestDigest", "schema"]) || response.status !== "ready" ||
    response.capsuleDigest !== capsule.digest || response.permissionDigest !== rec.permission.digest || response.toolManifestDigest !== capsule.gatePolicy.toolManifestDigest ||
    !shape(response.schema, ["sha256", "text"]) || response.schema.sha256 !== capsule.process.schemaDigest || typeof response.schema.text !== "string" ||
    createHash("sha256").update(response.schema.text, "utf8").digest("hex") !== response.schema.sha256) refuse("configured-dispatch-check-correspondence");
  return Object.freeze({ capsuleDigest: response.capsuleDigest, schemaText: response.schema.text });
}
