/** One project configuration reader. Effects use an explicit committed PRODUCT
 * revision; editor reads are separately named. No private record discovery. */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { lstatSync, readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import { parse as parseYaml, stringify } from "yaml";
import { PROJECT_SETTINGS, PROCESS_SCHEMA, RUNTIME_TEMPLATE, parseSettings, freezeSettings, parseModelSession, stampModels,
  missingSettings, processSection } from "../../../lib/parser/dist/pure.js";
import { normalizeRecordProfile } from "./records-validation.mjs";
import { readInstalledMethodAsset, requireInstalledRuntimeAssets } from "./records-check.mjs";
import { validateBands } from "./health-bands.mjs";
import { normalizeNamePolicy } from "./rename-scan.mjs";
import { checkOperationEnvironment } from "./durable-operation.mjs";
export { PROJECT_SETTINGS };
/** @typedef {{status:"ready",settings:import("../../../lib/parser/dist/pure.js").ProjectSettings,yaml:string,processValues:Readonly<Record<string,string>>,provenance:any}} ReadySettings */
/** @typedef {{status:"refused",code:string,diagnostics:string[]}} RefusedSettings */
/** @typedef {ReadySettings|RefusedSettings|{status:"not-configured",code:string,diagnostics:string[]}} SettingsResult */
/** @param {string|Uint8Array} value */
function digest(value) { return `sha256:${createHash("sha256").update(value).digest("hex")}`; }
/** @param {unknown} error @returns {RefusedSettings} */
function refused(error) { const value = /** @type {any} */ (error); return freezeSettings({ status: "refused", code: value?.code ?? "project-settings-unavailable", diagnostics: [value instanceof Error ? value.message : String(value)] }); }
/** @param {string} code @param {string} message @returns {never} */
function fail(code, message) { throw Object.assign(new Error(message), { code }); }
/** @param {any} options @param {string[]} fields */
function request(options, fields) { if (!options || typeof options !== "object" || Object.keys(options).sort().join(",") !== [...fields].sort().join(",")) fail("project-settings-request", "Configuration requests require their exact declared fields"); }
/** @param {any} tool */
function toolInputs(tool) {
  requireInstalledRuntimeAssets(tool, ["tools/e2e/scripts/project-settings.mjs", "tools/e2e/scripts/health-bands.mjs", "tools/e2e/scripts/rename-scan.mjs"]);
  const schema = readInstalledMethodAsset(tool, PROCESS_SCHEMA);
  return { schema, provenance: { manifestDigest: tool.manifestDigest, parserVersion: tool.parserVersion,
    methodVersion: tool.methodVersion, methodDigest: tool.methodDigest, runtimeDigest: tool.runtimeDigest } };
}
/** @param {string} source @param {any} inputs @param {any} provenance @returns {ReadySettings} */
function validated(source, inputs, provenance) {
  const parsed = parseSettings(source, inputs.schema.text);
  const settings = structuredClone(parsed.settings);
  // Pure parsing deliberately leaves selected private policy opaque. This
  // mandatory canonical call has no absent-profile fallback at this boundary.
  settings.records.validation = normalizeRecordProfile(settings.records.validation);
  if (settings.names !== null) settings.names = normalizeNamePolicy(settings.names);
  if (settings.bands.length) {
    const problems = validateBands(/** @type {any} */ (settings.bands));
    if (problems.length) fail("project-settings-bands-invalid", problems.join("\n"));
  }
  return freezeSettings({ status: "ready", settings, yaml: stringify(settings), processValues: parsed.processValues,
    provenance: { ...provenance, path: PROJECT_SETTINGS, configDigest: digest(source), tool: inputs.provenance,
      assets: [{ path: inputs.schema.path, sha256: inputs.schema.sha256 }, ...(provenance.assets ?? [])] } });
}
/** Only verified TOOL roles/session/process defaults enter the explicit seed.
 * No project identity, language, suite command or authorization is inferred.
 * @param {{tool:any,recordsValidation:any}} options @returns {SettingsResult} */
export function seedProjectSettings(options) {
  try {
    request(options, ["tool", "recordsValidation"]);
    const inputs = toolInputs(options.tool), template = readInstalledMethodAsset(options.tool, RUNTIME_TEMPLATE);
    const defaults = parseYaml(template.text), section = processSection(template.text);
    if (!section || !defaults?.roles || !defaults?.session_policy) fail("project-settings-tool-defaults", "Verified TOOL defaults omit required roles/session/process data");
    if (options.recordsValidation?.kind !== "generic") fail("project-settings-seed-profile", "A new project requires an explicitly selected generic records validation profile");
    const settings = { version: 1, roles: defaults.roles, session_policy: defaults.session_policy,
      process: { profile: section.profile, available: section.available, switches: Object.fromEntries(section.overrides) },
      suites: [], smoke: null, guard_class: {}, bands: [], names: null, languages: [], publication: null, tier_budgets: null,
      records: { validation: normalizeRecordProfile(options.recordsValidation) } };
    return validated(stringify(settings), inputs, { kind: "seed", productRoot: null, productRevision: null,
      assets: [{ path: template.path, sha256: template.sha256 }] });
  } catch (error) { return refused(error); }
}
/** @param {string} root @param {string[]} args @returns {Buffer} */
function git(root, args) {
  return execFileSync("git", ["--no-replace-objects", "-C", root, ...args], { stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 4 * 1024 * 1024, env: { ...process.env, GIT_NO_LAZY_FETCH: "1", GIT_OPTIONAL_LOCKS: "0" } });
}
/** Exact committed data, unaffected by dirty/poisoned working settings.
 * @param {{productRoot:string,productRevision:string,tool:any}} options @returns {SettingsResult} */
export function loadProjectSettings(options) {
  try {
    request(options, ["productRoot", "productRevision", "tool"]); checkOperationEnvironment();
    const inputs = toolInputs(options.tool), root = realpathSync(options.productRoot), revision = options.productRevision;
    const topLevel = git(root, ["rev-parse", "--show-toplevel"]).toString("utf8").replace(/\n$/, "");
    if (realpathSync(topLevel) !== root) fail("project-settings-product-root", "Selected PRODUCT must be the repository root");
    const format = git(root, ["rev-parse", "--show-object-format"]).toString("utf8").trim();
    if (!["sha1", "sha256"].includes(format)) fail("project-settings-object-format", "Unsupported PRODUCT object format");
    if (!new RegExp(`^[0-9a-f]{${format === "sha1" ? 40 : format === "sha256" ? 64 : 0}}$`).test(revision) ||
        git(root, ["cat-file", "-t", revision]).toString("utf8").trim() !== "commit") fail("project-settings-exact-revision", "An exact committed PRODUCT revision is required");
    const entry = git(root, ["ls-tree", "-z", revision, "--", PROJECT_SETTINGS]).toString("utf8");
    if (entry === "") return freezeSettings({ status: "not-configured", code: "project-settings-missing", diagnostics: [`${PROJECT_SETTINGS} is absent at the selected PRODUCT revision`] });
    if (!new RegExp(`^100(?:644|755) blob [0-9a-f]+\\t${PROJECT_SETTINGS.replaceAll(".", "\\.")}\\x00$`).test(entry)) fail("project-settings-file-kind", "Committed project settings must be one plain file");
    const bytes = git(root, ["show", `${revision}:${PROJECT_SETTINGS}`]);
    return validated(new TextDecoder("utf-8", { fatal: true }).decode(bytes), inputs, { kind: "committed", productRoot: root, productRevision: revision });
  } catch (error) { return refused(error); }
}
/** Explicit editor-only view. Never use this result to authorize effects.
 * @param {{productRoot:string,tool:any}} options @returns {SettingsResult} */
export function loadWorkingProjectSettings(options) {
  try {
    request(options, ["productRoot", "tool"]);
    const inputs = toolInputs(options.tool), root = realpathSync(options.productRoot), file = path.join(root, PROJECT_SETTINGS);
    let state; try { state = lstatSync(file); } catch (error) { if (/** @type {any} */ (error).code === "ENOENT") return freezeSettings({ status: "not-configured", code: "project-settings-missing", diagnostics: [`${PROJECT_SETTINGS} is absent from the editor's PRODUCT`] }); throw error; }
    if (!state.isFile() || state.isSymbolicLink() || realpathSync(file) !== file) fail("project-settings-file-kind", "Working project settings must be one plain file");
    return validated(new TextDecoder("utf-8", { fatal: true }).decode(readFileSync(file)), inputs, { kind: "working", productRoot: root, productRevision: null });
  } catch (error) { return refused(error); }
}
/** Validate proposed editor bytes with the same mandatory TOOL/schema/private
 * policy engine. This is explicitly a working datum, never effect authority.
 * @param {{source:string,tool:any}} options @returns {SettingsResult} */
export function validateProjectSettingsText(options) {
  try {
    request(options, ["source", "tool"]);
    if (typeof options.source !== "string") fail("project-settings-editor-source", "Proposed project settings must be text");
    return validated(options.source, toolInputs(options.tool), { kind: "working", productRoot: null, productRevision: null });
  } catch (error) { return refused(error); }
}
/** Readiness is specific to the operation; private save never calls this for
 * PRODUCT sections. Empty initial data cannot become an empty GREEN run.
 * @param {any} loaded @param {"suites"|"smoke"|"guard_class"|"bands"|"names"|"languages"|"publication"|"tier_budgets"} section
 * @returns {{status:"configured",value:any}|{status:"cannot-run",code:3,diagnostics:string[]}} */
export function requireProjectSection(loaded, section) {
  if (loaded?.status !== "ready") return freezeSettings({ status: "cannot-run", code: 3, diagnostics: loaded?.diagnostics ?? ["Project settings are unavailable"] });
  if (loaded.provenance?.kind === "working") return freezeSettings({ status: "cannot-run", code: 3, diagnostics: ["Effects require committed project settings, not the editor view"] });
  let missing;
  try { missing = missingSettings(loaded.settings, section); }
  catch (error) { return freezeSettings({ status: "cannot-run", code: 3, diagnostics: [error instanceof Error ? error.message : String(error)] }); }
  return missing ? freezeSettings({ status: "cannot-run", code: 3, diagnostics: [missing] }) : freezeSettings({ status: "configured", value: loaded.settings[section] });
}

/** @typedef {{status:"ready",selection:{role:string,requested:string,harness:"claude"|"codex",model:string,vehicle:string|null,sessionPolicy:{default:string,warnAfterTurns:number}},provenance:{configurationDigest:string,productRevision:string,toolManifestDigest:string}}|{status:"cannot-run",code:3,reason:string,diagnostics:string[]}} ProjectRoleResult */
/** @typedef {{status:"ready",selection:{requested:string,model:string,vehicle:string|null}}|{status:"cannot-run",code:3,reason:string,diagnostics:string[]}} ProjectRoleModelResult */
/** One executable model[@vehicle] spelling, using canonical stamp parsers.
 * This normalizes data; the effect's actual harness adapter still qualifies it.
 * @param {unknown} requested @returns {ProjectRoleModelResult} */
export function normalizeProjectRoleModel(requested) {
  const cannot = () => freezeSettings({ status: /** @type {const} */ ("cannot-run"), code: /** @type {const} */ (3), reason: "project-role-selection-unsupported", diagnostics: ["A role effect requires one bounded unambiguous model[@vehicle] selection; historical or compound prose is not an executable default"] });
  if (typeof requested !== "string") return cannot();
  const parsed = parseModelSession(requested), models = stampModels(requested), compact = requested.trim().replace(/\s*@\s*/g, "@");
  if (requested.length > 1024 || models.length !== 1 || models[0] !== parsed.model || compact !== parsed.model + (parsed.session === undefined ? "" : `@${parsed.session}`) || parsed.session !== undefined && (parsed.session.length > 128 || !/^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(parsed.session))) return cannot();
  return freezeSettings({ status: "ready", selection: { requested, model: parsed.model, vehicle: parsed.session ?? null } });
}
/** Normalize one canonical committed role observation for the fixed supported
 * CLI adapter. This grants no dispatch and claims no model availability. The
 * record parser retains prose stamps; an effect cannot choose one model from
 * such prose or substitute a CLI/account default.
 * @param {SettingsResult} loaded @param {string} role @returns {ProjectRoleResult} */
export function resolveProjectRole(loaded, role) {
  /** @param {string} reason @param {string[]} diagnostics @returns {ProjectRoleResult} */
  const cannot = (reason, diagnostics) => freezeSettings({ status: "cannot-run", code: 3, reason, diagnostics });
  if (loaded.status !== "ready") return cannot(loaded.code, loaded.diagnostics);
  if (loaded.provenance.kind !== "committed") return cannot("project-role-committed-required", ["Role effects require canonical committed PRODUCT settings"]);
  if (!Object.hasOwn(loaded.settings.roles, role)) return cannot("project-role-unconfigured", [`No explicit role selection for ${role}`]);
  const normalized = normalizeProjectRoleModel(loaded.settings.roles[role]);
  if (normalized.status !== "ready") return normalized;
  const { requested, model: selected, vehicle } = normalized.selection;
  const claude = /^claude\/([A-Za-z0-9][A-Za-z0-9._-]*)$/.exec(selected)?.[1] ?? (/^claude-[A-Za-z0-9][A-Za-z0-9._-]*$/.test(selected) ? selected : null);
  const codex = /^(?:codex\/)?(gpt-[A-Za-z0-9][A-Za-z0-9._-]*)$/.exec(selected)?.[1] ?? null;
  const harness = codex !== null ? "codex" : "claude", model = codex ?? claude;
  if (model === null || model.length > 256 || ["default", "auto", "latest"].includes(model.toLowerCase()) || harness === "claude" && /^(?:gpt-|codex)/i.test(model)) return cannot("project-role-harness-unsupported", ["The native planner requires an explicit Claude model (claude-<model> or claude/<model>) or Codex GPT model (gpt-<model> or codex/gpt-<model>); unknown or mixed providers and account defaults are unsupported"]);
  return freezeSettings({ status: "ready", selection: { role, requested, harness, model, vehicle,
    sessionPolicy: { default: loaded.settings.session_policy.default, warnAfterTurns: loaded.settings.session_policy.warn_after_turns } },
    provenance: { configurationDigest: loaded.provenance.configDigest, productRevision: loaded.provenance.productRevision, toolManifestDigest: loaded.provenance.tool.manifestDigest } });
}
