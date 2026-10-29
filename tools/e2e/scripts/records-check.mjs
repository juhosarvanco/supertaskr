/** Explicit private checks over one frozen candidate. This performs no save,
 * PRODUCT generation, suite/build, dispatch, publication or network operation.
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { lstatSync, readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import { TASK_STATUSES } from "../../../lib/parser/dist/pure.js";
import { DOC_BUDGETS, INDEX_DOC, STATE_DOC, CHECKPOINTS_DIR, RECORD_CREATED_FILTER,
  TASK_STATUS_SOURCE, taskStatusesFromSource, taskCardIssues } from "./docs-scan.mjs";
import { captureRecordCandidateInputs, evaluateRecordCandidate, normalizeRecordProfile,
  ordinaryRecordTextPath, recordCandidateProjection } from "./records-validation.mjs";
import { operationContent, operationDigest } from "./operation-record.mjs";

/** @type {WeakMap<object, any>} */ const tools = new WeakMap();
/** @type {WeakMap<object, any>} */ const captures = new WeakMap();
/** @type {WeakMap<object, any>} */ const checked = new WeakMap();
export class PrivateRecordCheckFinding extends Error {
  /** @param {string} code */
  constructor(code) { super(`${code}: private record check unavailable`); this.code = code; this.name = "PrivateRecordCheckFinding"; }
}
/** @param {string} code @returns {never} */
function refuse(code) { throw new PrivateRecordCheckFinding(code); }
/** @param {string|Uint8Array} bytes */
function hash(bytes) { return createHash("sha256").update(bytes).digest("hex"); }
/** @param {any} value @returns {any} */
function freeze(value) { if (value && typeof value === "object") { Object.values(value).forEach(freeze); Object.freeze(value); } return value; }
/** @param {any} value @param {string[]} fields */
function shape(value, fields) { return value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).sort().join(",") === [...fields].sort().join(","); }
/** @param {any} value */
function assetPath(value) {
  return typeof value === "string" && !path.posix.isAbsolute(value) && !path.win32.isAbsolute(value) &&
    !/[\\\x00-\x1f\x7f]/.test(value) && value.split("/").every((part) => part && ![".", "..", ".git", ".supertaskr"].includes(part));
}
/** One physical/hash reader shared by manifest verification and method reads.
 * @param {string} root @param {{path:string,sha256:string}} entry */
function verifiedAssetBytes(root, entry) {
  const file = path.join(root, entry.path), state = lstatSync(file);
  if (!state.isFile() || state.isSymbolicLink() || realpathSync(file) !== file) refuse("records-tool-asset-changed");
  const bytes = readFileSync(file);
  if (hash(bytes) !== entry.sha256) refuse("records-tool-asset-changed");
  return bytes;
}
/** Verify the generated installed-tool manifest against actual packaged bytes.
 * All paths are relative to the installation, never managed PRODUCT/RECORDS.
 * @param {string} [manifestPath] */
export function loadInstalledRecordTool(manifestPath = fileURLToPath(new URL("../../../tool-manifest.json", import.meta.url))) {
  try {
    const manifestFile = realpathSync(manifestPath), root = path.dirname(manifestFile), raw = readFileSync(manifestFile);
    const manifest = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(raw));
    if (!shape(manifest, ["version", "package", "parser", "method", "runtime"]) || manifest.version !== 2 ||
        !shape(manifest.package, ["name", "version", "sha256", "entrySha256"]) || manifest.package.name !== "supertaskr" || typeof manifest.package.version !== "string" ||
        !shape(manifest.parser, ["version", "files"]) || typeof manifest.parser.version !== "string" || !Array.isArray(manifest.parser.files) ||
        !shape(manifest.method, ["version", "packHash", "files"]) || typeof manifest.method.version !== "string" || !Array.isArray(manifest.method.files) ||
        !shape(manifest.runtime, ["buildHash", "files"]) || !Array.isArray(manifest.runtime.files)) refuse("records-tool-manifest-invalid");
    const packageBytes = readFileSync(path.join(root, "..", "package.json")), packageJson = JSON.parse(packageBytes.toString("utf8"));
    if (packageJson.name !== manifest.package.name || packageJson.version !== manifest.package.version || hash(packageBytes) !== manifest.package.sha256 ||
        hash(readFileSync(path.join(root, "..", "supertaskr.mjs"))) !== manifest.package.entrySha256) refuse("records-tool-package-changed");
    const seen = new Set();
    for (const [group, prefix] of [[manifest.parser.files, "lib/parser/"], [manifest.method.files, "method/"], [manifest.runtime.files, ""]]) {
      if (!group.length) refuse("records-tool-assets-unavailable");
      for (const entry of group) {
        if (!shape(entry, ["path", "sha256"]) || !assetPath(entry.path) || !entry.path.startsWith(prefix) ||
            !/^[0-9a-f]{64}$/.test(entry.sha256) || seen.has(entry.path)) refuse("records-tool-manifest-invalid");
        seen.add(entry.path);
        if (prefix === "" && !/^(?:tools\/e2e\/scripts\/[^/]+\.mjs|cli\/[^/]+\.mjs|tools\/e2e\/package\.json|native\/(?:darwin|linux|win32)-(?:arm64|x64)\/supertaskr-index(?:\.exe)?)$/.test(entry.path)) refuse("records-tool-manifest-invalid");
        verifiedAssetBytes(root, entry);
      }
    }
    const methodFiles = [...manifest.method.files].sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
    if (hash(JSON.stringify(methodFiles)) !== manifest.method.packHash) refuse("records-tool-method-changed");
    const runtimeFiles = [...manifest.runtime.files].sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
    if (hash(JSON.stringify(runtimeFiles)) !== manifest.runtime.buildHash) refuse("records-tool-runtime-mismatch");
    for (const owner of ["records-check", "records-save", "record-write", "records", "records-validation", "records-stdio", "records-backup", "records-backup-operation", "records-backup-settings", "workspace", "native-codex", "docs-scan", "durable-operation", "operation-record", "project-init-operation", "project-init-record", "operation-ref", "qualified-delivery-record", "qualified-delivery-operation", "qualified-publication-context", "qualified-publication-record", "qualified-publication-process", "qualified-completion-record", "qualified-completion-operation", "fixed-product-hook", "private-backup-record", "project-settings", "dispatch-brief", "health-bands", "rename-scan", "run-record"]) {
      if (!manifest.runtime.files.some((/** @type {any} */ entry) => entry.path === `tools/e2e/scripts/${owner}.mjs`)) refuse("records-tool-runtime-mismatch");
    }
    if(!manifest.runtime.files.some((/** @type {any} */ entry)=>entry.path==="cli/hook-git-context.mjs"))refuse("records-tool-runtime-mismatch");
    for (const entry of manifest.runtime.files) {
      // Native data is verified at its installation above and selected from
      // that exact manifest by installedRecordAsset; it is not a JS import.
      if (entry.path.startsWith("native/")) continue;
      if (hash(readFileSync(new URL(`../../../${entry.path}`, import.meta.url))) !== entry.sha256) refuse("records-tool-runtime-mismatch");
    }
    const parserPackage = JSON.parse(readFileSync(path.join(root, "lib/parser/package.json"), "utf8"));
    if (parserPackage.version !== manifest.parser.version) refuse("records-tool-parser-changed");
    for (const module of ["pure.js", "types.js", "project-settings.js", "process-settings.js", "model-session.js", "assignment.js"]) {
      const entry = manifest.parser.files.find((/** @type {any} */ item) => item.path === `lib/parser/dist/${module}`);
      if (!entry || hash(readFileSync(new URL(`../../../lib/parser/dist/${module}`, import.meta.url))) !== entry.sha256) refuse("records-tool-runtime-mismatch");
    }
    const result = freeze({ version: 2, package: manifest.package, parserVersion: manifest.parser.version, runtimeDigest: manifest.runtime.buildHash,
      methodVersion: manifest.method.version, methodDigest: manifest.method.packHash, manifestDigest: hash(raw),
      statuses: [...TASK_STATUSES] });
    tools.set(result, { manifestFile, rawDigest: hash(raw), manifest: structuredClone(manifest) });
    return result;
  } catch (error) { if (error instanceof PrivateRecordCheckFinding) throw error; refuse("records-tool-assets-unavailable"); }
}
/** @param {any} tool */
export function verifyInstalledRecordTool(tool) {
  const captured = tools.get(tool);
  if (!captured) refuse("records-tool-context-required");
  const now = loadInstalledRecordTool(captured.manifestFile);
  if (operationContent(now) !== operationContent(tool)) refuse("records-tool-context-changed");
  return true;
}
/** Resolve one already verified runtime asset from the captured installation.
 * No caller may select an unlisted executable or another installation root.
 * @param {any} tool @param {string} relative */
export function installedRecordAsset(tool,relative) {
  const captured=tools.get(tool);
  if (!captured || !assetPath(relative)) refuse("records-tool-context-required");
  const entry=captured.manifest.runtime.files.find((/** @type {any} */ item)=>item.path===relative);
  if (!entry) refuse("records-tool-assets-unavailable");
  const file=path.join(path.dirname(captured.manifestFile),relative);
  try {
    verifiedAssetBytes(path.dirname(captured.manifestFile), entry);
  } catch(error) {if(error instanceof PrivateRecordCheckFinding) throw error;refuse("records-tool-assets-unavailable");}
  return file;
}
/** Read one captured, verified method member. Callers receive bytes as UTF-8
 * text, never an unbound installation path or a managed-project fallback.
 * @param {any} tool @param {string} relative */
export function readInstalledMethodAsset(tool, relative) {
  return /** @type {Readonly<{path:string,sha256:string,text:string}>} */ (readInstalledMethodAssets(tool, [relative])[0]);
}
/** One full TOOL verification, then exact verified bytes for every requested
 * captured method member. No caller can skip verification or choose a root.
 * @param {any} tool @param {readonly string[]} relatives
 * @returns {readonly Readonly<{path:string,sha256:string,text:string}>[]} */
export function readInstalledMethodAssets(tool, relatives) {
  verifyInstalledRecordTool(tool);
  if (!Array.isArray(relatives) || relatives.length === 0 || new Set(relatives).size !== relatives.length) refuse("records-tool-method-members-required");
  const captured = tools.get(tool);
  try {
    return Object.freeze(relatives.map((relative) => {
      const entry = captured.manifest.method.files.find((/** @type {any} */ item) => item.path === relative);
      if (!entry || !assetPath(relative) || !relative.startsWith("method/")) refuse("records-tool-method-member-required");
      const bytes = verifiedAssetBytes(path.dirname(captured.manifestFile), entry);
      return Object.freeze({ path: relative, sha256: entry.sha256, text: new TextDecoder("utf-8", { fatal: true }).decode(bytes) });
    }));
  } catch (error) { if (error instanceof PrivateRecordCheckFinding) throw error; refuse("records-tool-assets-unavailable"); }
}
/** Enumerate captured method membership without exposing its installation path.
 * Each later byte read still verifies this TOOL context and exact member hash.
 * @param {any} tool @returns {readonly Readonly<{path:string,sha256:string}>[]} */
export function listInstalledMethodAssets(tool) {
  verifyInstalledRecordTool(tool);
  return Object.freeze(tools.get(tool).manifest.method.files.map((/** @type {{path:string,sha256:string}} */ entry) => Object.freeze({ path: entry.path, sha256: entry.sha256 })));
}
/** Bind a consumer's declared runtime closure to this captured TOOL build.
 * Returns membership metadata only, never an unbound executable/read path.
 * @param {any} tool @param {readonly string[]} relatives */
export function requireInstalledRuntimeAssets(tool, relatives) {
  verifyInstalledRecordTool(tool);
  if (!Array.isArray(relatives) || relatives.length === 0 || new Set(relatives).size !== relatives.length) refuse("records-tool-runtime-members-required");
  const captured = tools.get(tool);
  try {
    const files = relatives.map((relative) => {
      const entry = captured.manifest.runtime.files.find((/** @type {any} */ item) => item.path === relative);
      if (!entry || !assetPath(relative)) refuse("records-tool-runtime-member-required");
      verifiedAssetBytes(path.dirname(captured.manifestFile), entry);
      return Object.freeze({ path: entry.path, sha256: entry.sha256 });
    });
    return Object.freeze({ manifestDigest: tool.manifestDigest, runtimeDigest: tool.runtimeDigest, files: Object.freeze(files) });
  } catch (error) { if (error instanceof PrivateRecordCheckFinding) throw error; refuse("records-tool-assets-unavailable"); }
}
/** @param {string} root @param {string[]} args */
function git(root, args) {
  try { return execFileSync("git", ["--no-replace-objects", "-C", root, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, GIT_NO_LAZY_FETCH: "1", GIT_OPTIONAL_LOCKS: "0" } }).replace(/\n$/, ""); }
  catch { refuse("records-history-unavailable"); }
}
/** @param {any} projection */
function history(projection) {
  const root = projection.receipt.recordsRoot, revision = projection.receipt.recordsCommit;
  /** @param {string} file @param {string[]} [filter] */
  const at = (file, filter = []) => {
    const value = git(root, ["log", "-1", ...filter, "--format=%ct", revision, "--", file]);
    if (value === "") return null;
    if (!/^[0-9]+$/.test(value) || !Number.isSafeInteger(Number(value))) refuse("records-history-unavailable");
    return Number(value);
  };
  const records = projection.inputs.filter((/** @type {any} */ input) => input.role === "records" &&
    input.path.startsWith(`${CHECKPOINTS_DIR}/`) && input.path.endsWith(".md") && input.path !== `${CHECKPOINTS_DIR}/TEMPLATE.md`)
    .map((/** @type {any} */ input) => ({ path: input.path, createdAt: at(input.path, [RECORD_CREATED_FILTER]) ?? at(input.path) }));
  const statePresent = projection.inputs.some((/** @type {any} */ input) => input.role === "records" && input.path === STATE_DOC);
  const stateAt = statePresent ? at(STATE_DOC) : null;
  if (records.some((/** @type {any} */ record) => record.createdAt === null) || statePresent && stateAt === null) refuse("records-history-unavailable");
  return freeze({ stateAt, records, revision });
}
/** An installed service chooses one protected profile and tool context once.
 * Requests cannot switch profile or install a weaker policy for one save.
 * @param {{profile: any, tool: any}} configuration */
export function createRecordChecker(configuration) {
  if (!shape(configuration, ["profile", "tool"]) || !tools.has(configuration.tool)) refuse("records-service-configuration");
  const profile = normalizeRecordProfile(configuration.profile), tool = configuration.tool;
  return Object.freeze({ profile, tool,
    /** @param {{productRoot: string, recordsRevision: string, productRevision: string}} options */
    capture(options) {
      if (!shape(options, ["productRoot", "recordsRevision", "productRevision"])) refuse("records-check-request");
      verifyInstalledRecordTool(tool);
      const capture = captureRecordCandidateInputs({ ...options, profile,
        ...(profile.kind === "dogfood" ? { requiredInputs: [{ role: "product", path: TASK_STATUS_SOURCE }] } : {}) });
      const projection = recordCandidateProjection(capture), selectedHistory = history(projection);
      const statuses = profile.kind === "dogfood" ? taskStatusesFromSource(projection.inputs.find((input) => input.role === "product" && input.path === TASK_STATUS_SOURCE)?.content ?? "") : tool.statuses;
      const handle = freeze({ receipt: capture.receipt, identity: { candidate: capture.digest, profile, tool, history: selectedHistory },
        digest: operationDigest({ candidate: capture.digest, profile, tool, history: selectedHistory }) });
      captures.set(handle, { options: { ...options }, capture, projection, history: selectedHistory, statuses, profile, tool });
      return handle;
    },
    /** @param {any} handle @param {readonly any[]} overlay */
    evaluate(handle, overlay) {
      const context = captures.get(handle);
      if (!context || context.tool !== tool || operationContent(context.profile) !== operationContent(profile)) refuse("records-check-capture");
      const exact = overlay.map((entry) => ({ ...entry, ...(entry.bytes instanceof Uint8Array ? { bytes: Buffer.from(entry.bytes) } : {}) }));
      const evaluation = evaluateRecordCandidate(context.capture, exact);
      const baseline = new Map(context.projection.inputs.filter((/** @type {any} */ input) => input.role === "records").map((/** @type {any} */ input) => [input.path, input]));
      const candidate = new Map(baseline);
      for (const entry of exact) {
        if (entry.operation === "delete") candidate.delete(entry.path);
        else if (entry.bytes instanceof Uint8Array) candidate.set(entry.path, { path: entry.path, bytes: Buffer.from(entry.bytes), content: Buffer.from(entry.bytes).toString("utf8"), mode: entry.mode });
      }
      const statuses = taskCardIssues([...candidate.values()], { statuses: context.statuses, parseYaml });
      const oldStatuses = taskCardIssues([...baseline.values()], { statuses: context.statuses, parseYaml });
      /** @type {any[]} */ const blocking = [];
      /** @type {any[]} */ const retained = [];
      /** @type {any[]} */ const warnings = [];
      /** @type {any[]} */ const procedural = [];
      const oldStatusIdentities = new Set(oldStatuses.map(operationContent));
      for (const diagnostic of statuses) (oldStatusIdentities.has(operationContent(diagnostic)) ? retained : blocking).push(diagnostic);
      const budgets = profile.kind === "dogfood" ? DOC_BUDGETS : profile.budgets;
      const touched = new Set(exact.map((entry) => entry.path));
      for (const [file, budget] of Object.entries(budgets)) {
        const bound = /** @type {any} */ (budget), entry = /** @type {any} */ (candidate.get(file));
        if (!bound || !entry) continue;
        const bytes = entry.bytes.length;
        if (bytes > bound.fail) (touched.has(file) ? blocking : retained).push({ kind: "document-budget", path: file, bytes, fail: bound.fail });
        else if (bytes > bound.warn) warnings.push({ kind: "document-budget-warning", path: file, bytes, warn: bound.warn });
      }
      const stale = context.history.records.filter((/** @type {any} */ record) => context.history.stateAt !== null && record.createdAt > context.history.stateAt);
      retained.push(...stale.map((/** @type {any} */ record) => ({ kind: "state-stale", path: record.path })));
      const state = /** @type {any} */ (candidate.get(STATE_DOC)), oldState = /** @type {any} */ (baseline.get(STATE_DOC));
      const stateChanged = state && (!oldState || !state.bytes.equals(oldState.bytes));
      for (const entry of exact) {
        if (entry.path.startsWith(`${CHECKPOINTS_DIR}/`) && entry.path.endsWith(".md") && entry.path !== `${CHECKPOINTS_DIR}/TEMPLATE.md`) {
          if (entry.operation === "add" && !stateChanged) blocking.push({ kind: "checkpoint-state-required", path: entry.path });
          if (entry.operation === "edit") procedural.push({ kind: "state-fact-amendment", path: entry.path,
            obligation: "An amendment changing a summarized fact or hazard requires STATE regeneration; this remains procedural." });
        }
        if (/^docs\/(?:rooms|decisions)\//.test(entry.path)) procedural.push({ kind: "owner-voice", path: entry.path,
          obligation: "Room/ADR owner-voice and ruling obligations remain procedural. Saving draft text supplies no approval." });
      }
      const accepted = evaluation.accepted && blocking.length === 0;
      const derived = evaluation.derivedIndex, originalIndex = /** @type {any} */ (baseline.get(INDEX_DOC));
      const baselineIndexStale = evaluation.baselineIndex !== undefined && (!originalIndex || !evaluation.baselineIndex.bytes.equals(originalIndex.bytes));
      if (baselineIndexStale) retained.push({ kind: "index-stale", path: INDEX_DOC, remedy: "Save the exact private check derivation." });
      const derivedWrites = accepted && derived && (!originalIndex || !derived.bytes.equals(originalIndex.bytes))
        ? [{ operation: originalIndex ? "edit" : "add", path: INDEX_DOC, type: "blob", mode: "100644", bytes: derived.bytes, derived: true }] : [];
      const writes = accepted ? [...exact.map((entry) => ({ ...entry, derived: false })), ...derivedWrites] : [];
      const result = freeze({ accepted, code: accepted ? 0 : 1, structuralAccepted: evaluation.accepted, wholeBoardClean: evaluation.candidateDiagnostics.length === 0 && statuses.length === 0,
        candidate: evaluation.identity, candidateDigest: evaluation.digest, captureDigest: handle.digest, tool, profile,
        diagnostics: evaluation.candidateDiagnostics, introducedDiagnostics: evaluation.introducedDiagnostics, failures: evaluation.failures,
        blocking, retained, warnings, procedural, baselineIndexStale, derivations: derivedWrites.map((entry) => ({ path: entry.path, mode: entry.mode, sha256: hash(entry.bytes) })),
        authority: "private candidate checks only; no lifecycle, ruling, dispatch or save authority" });
      checked.set(result, { ...context, handle, evaluation, overlay: exact, writes, baseline });
      return result;
    },
  });
}
/** Detached exact accepted user+derived write set for the saving consumer.
 * @param {any} result */
export function checkedRecordWriteSet(result) {
  const context = checked.get(result);
  if (!context || !result.accepted) refuse("records-check-not-accepted");
  return { options: { ...context.options }, receipt: context.projection.receipt, profile: context.profile, tool: context.tool,
    captureDigest: context.handle.digest, candidateDigest: result.candidateDigest,
    writes: context.writes.map((/** @type {any} */ entry) => ({ ...entry, ...(entry.bytes instanceof Uint8Array ? { bytes: Buffer.from(entry.bytes) } : {}) })),
    baseline: [...context.baseline.values()].map((/** @type {any} */ entry) => ({ path: entry.path, mode: entry.mode, bytes: Buffer.from(entry.bytes) })) };
}
