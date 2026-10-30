/** Installed settings command: committed observations, explicit working edit.
 * Method/schema bytes come only from the verified TOOL, never PRODUCT kit. */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { closeSync, constants, fstatSync, lstatSync, mkdirSync, openSync, readFileSync, writeSync, ftruncateSync, fsyncSync } from "node:fs";
import path from "node:path";
import { parseDocument } from "yaml";
import { PROCESS_SCHEMA, RUNTIME_TEMPLATE, parseProcessSchema, resolveProcess } from "../../../lib/parser/dist/pure.js";
import { createProjectRuntime } from "./project-runtime.mjs";
import { loadInstalledRecordTool, readInstalledMethodAsset, requireInstalledRuntimeAssets } from "./records-check.mjs";
import { PROJECT_SETTINGS, loadWorkingProjectSettings, validateProjectSettingsText } from "./project-settings.mjs";
import { REFERENCE_DOC, renderReference, renderSettings, setPlan, settingsRows } from "./settings.mjs";

export const USAGE = "supertaskr settings [--working | role <role> | set <switch> <value> | reference [--write | --check]] [--at <exact commit>] [--root <PRODUCT>]";
/** @param {string} code @param {string} detail @returns {never} */
function fail(code, detail) { throw Object.assign(new Error(detail), { code }); }
/** Editor targets are finite caller-owned PRODUCT files. No foreign links are
 * replaced, repaired or opened for content. @param {string} root @param {string} relative @param {boolean} create */
function editorPath(root, relative, create) {
  let at = root;
  for (const part of relative.split("/").slice(0, -1)) {
    at = path.join(at, part);
    let state; try { state = lstatSync(at); } catch (error) { if (/** @type {any} */ (error).code !== "ENOENT") throw error; }
    if (!state && create) { mkdirSync(at); state = lstatSync(at); }
    if (!state) return null;
    if (state.isSymbolicLink() || !state.isDirectory()) fail("settings-editor-path", "Editor ancestor must be a plain PRODUCT directory");
  }
  const file = path.join(root, relative);
  let state; try { state = lstatSync(file, { bigint: true }); } catch (error) { if (/** @type {any} */ (error).code !== "ENOENT") throw error; }
  if (state && (!state.isFile() || state.isSymbolicLink() || state.nlink !== 1n)) fail("settings-editor-file", "Editor file must be a plain singly linked PRODUCT file");
  return { file, state, bytes: state ? readFileSync(file) : null };
}
/** @param {{assertCurrent:()=>void,provenance:{productRoot:string}}} runtime @param {string} relative @param {Buffer|null} expected @param {string} text */
function writeEditor(runtime, relative, expected, text) {
  runtime.assertCurrent();
  const selected = editorPath(runtime.provenance.productRoot, relative, true);
  if (!selected || (expected === null ? selected.bytes !== null : selected.bytes === null || !selected.bytes.equals(expected))) fail("settings-editor-changed", "Editor bytes changed before the write");
  if (typeof constants.O_NOFOLLOW !== "number") fail("settings-editor-platform", "No-follow editor writes are unavailable on this platform");
  const fd = openSync(selected.file, constants.O_RDWR | constants.O_NOFOLLOW | (selected.state ? 0 : constants.O_CREAT | constants.O_EXCL), 0o600);
  try {
    const actual = fstatSync(fd, { bigint: true }), current = lstatSync(selected.file, { bigint: true });
    if (!actual.isFile() || actual.nlink !== 1n || current.nlink !== 1n || current.isSymbolicLink() || actual.dev !== current.dev || actual.ino !== current.ino || selected.state && (actual.dev !== selected.state.dev || actual.ino !== selected.state.ino)) fail("settings-editor-changed", "Editor file identity changed before writing");
    const bytes = readFileSync(fd);
    if (expected === null ? bytes.length !== 0 : !bytes.equals(expected)) fail("settings-editor-changed", "Opened editor bytes differ from the captured preimage");
    runtime.assertCurrent(); ftruncateSync(fd, 0);
    const replacement = Buffer.from(text); let written = 0;
    while (written < replacement.length) { const count = writeSync(fd, replacement, written, replacement.length - written, written); if (count < 1) fail("settings-editor-write", "Editor write did not complete"); written += count; }
    fsyncSync(fd);
  } finally { closeSync(fd); }
  runtime.assertCurrent();
}
/** @param {string[]} argv @param {{out?:(text:string)=>void,err?:(text:string)=>void}} [io] */
export function main(argv, io = {}) {
  const out = io.out ?? (text => process.stdout.write(`${text}\n`)), err = io.err ?? (text => process.stderr.write(`${text}\n`));
  try {
    let root = process.cwd(), revision;
    const args = [...argv];
    for (const flag of ["--root", "--at"]) {
      const index = args.indexOf(flag); if (index === -1) continue;
      const value = args[index + 1];
      if (!value || value.startsWith("--") || args.lastIndexOf(flag) !== index) { err(USAGE); return 2; }
      if (flag === "--root") root = value; else revision = value; args.splice(index, 2);
    }
    if (args.length === 1 && ["--help", "-h"].includes(args[0] ?? "")) { out(USAGE); return 0; }
    const action = args[0];
    if (!(args.length === 0 || args.length === 1 && action === "--working" || action === "role" && args.length === 2 || action === "set" && args.length === 3 || action === "reference" && (args.length === 1 || args.length === 2 && ["--write", "--check"].includes(args[1] ?? "")))) { err(USAGE); return 2; }
    const tool = loadInstalledRecordTool();
    requireInstalledRuntimeAssets(tool, ["tools/e2e/scripts/settings.mjs", "tools/e2e/scripts/configured-settings.mjs"]);
    const head = spawnSync("git", ["-C", root, "rev-parse", "--verify", "HEAD"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    if (revision === undefined && head.status !== 0) fail("settings-product-revision", "Current PRODUCT revision is unavailable");
    const runtime = createProjectRuntime({ productRoot: root, productRevision: revision ?? head.stdout.replace(/\n$/, ""), tool });
    root = runtime.provenance.productRoot;
    if (action === "role") { out(JSON.stringify(runtime.role(/** @type {string} */ (args[1])))); return 0; }
    if (action === "reference") {
      const text = renderReference(runtime.process().schema), selected = editorPath(root, REFERENCE_DOC, false);
      if (args[1] === "--check") { if (selected?.bytes?.toString("utf8") === text) { out("settings: reference is current"); return 0; } err("settings: reference is stale"); return 1; }
      if (args[1] === "--write") { writeEditor(runtime, REFERENCE_DOC, selected?.bytes ?? null, text); out(`settings: wrote ${REFERENCE_DOC}`); return 0; }
      out(text); return 0;
    }
    const working = action === "--working" || action === "set" ? loadWorkingProjectSettings({ productRoot: root, tool }) : null;
    if (working && working.status !== "ready") fail(working.code, working.diagnostics.join("; "));
    const settings = working?.status === "ready" ? working.settings : runtime.settings;
    const schema = parseProcessSchema(readInstalledMethodAsset(tool, PROCESS_SCHEMA).text);
    const processSettings = resolveProcess(schema, { profile: settings.process.profile, available: settings.process.available, overrides: new Map(Object.entries(settings.process.switches)) });
    if (action === "set") {
      runtime.assertCurrent();
      let plan; try { plan = setPlan({ schema, settings: processSettings, id: /** @type {string} */ (args[1]), value: /** @type {string} */ (args[2]) }); }
      catch (error) { err((error instanceof Error ? error.message : String(error)).replaceAll(RUNTIME_TEMPLATE, PROJECT_SETTINGS)); return 2; }
      const selected = editorPath(root, PROJECT_SETTINGS, false);
      if (!selected?.bytes) fail("settings-editor-absent", "Working root settings are absent");
      if (working?.status !== "ready" || `sha256:${createHash("sha256").update(selected.bytes).digest("hex")}` !== working.provenance.configDigest) fail("settings-editor-changed", "Working root settings changed before planning the edit");
      const document = parseDocument(selected.bytes.toString("utf8"), { uniqueKeys: true });
      if (document.errors.length) fail("settings-editor-invalid", "Working root settings are invalid");
      if (plan.remove) document.deleteIn(["process", "switches", plan.id]); else document.setIn(["process", "switches", plan.id], plan.value);
      const text = document.toString(), validated = validateProjectSettingsText({ source: text, tool });
      if (validated.status !== "ready") fail(validated.code, validated.diagnostics.join("; "));
      writeEditor(runtime, PROJECT_SETTINGS, selected.bytes, text);
      out(`settings: ${plan.id} = ${plan.value}; working ${PROJECT_SETTINGS} edited; effects continue to use committed settings`); return 0;
    }
    out(`${working ? "working editor" : "committed"} settings: ${PROJECT_SETTINGS}`);
    out(`roles: ${JSON.stringify(settings.roles)}\nsession_policy: ${JSON.stringify(settings.session_policy)}`);
    const units = new Map(settings.bands.map(band => [String(band.id), String(band.unit)]));
    out(renderSettings({ loaded: { schema, settings: processSettings }, rows: settingsRows({ schema, settings: processSettings, units, readings: new Map() }), declarationPath: PROJECT_SETTINGS }));
    return 0;
  } catch (error) { const value = /** @type {any} */ (error); err(`settings: ${value.code ?? "cannot-run"}: ${error instanceof Error ? error.message : String(error)}`); return 3; }
}
