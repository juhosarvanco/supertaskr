/** Configured PRODUCT operations. A constructor retains the original physical
 * repository and exact committed settings; requests carry data, never policy. */
import { spawnSync } from "node:child_process";
import { lstatSync, realpathSync } from "node:fs";
import path from "node:path";
import { PROCESS_SCHEMA, parseProcessSchema, resolveProcess } from "../../../lib/parser/dist/pure.js";
import { loadProjectSettings, requireProjectSection } from "./project-settings.mjs";
import { loadInstalledRecordTool, readInstalledMethodAsset, requireInstalledRuntimeAssets } from "./records-check.mjs";
import { captureOperationRepository } from "./durable-operation.mjs";
import { operationContent } from "./operation-record.mjs";
import { guardClassHits, guardClassIds, roleModel } from "./dispatch-brief.mjs";
import { carriesLegacy, classifyLegacy, caseFindingsWithClasses, homoglyphFindings } from "./rename-scan.mjs";

/** @param {string} code @param {string} message @returns {never} */
function refuse(code, message) { throw Object.assign(new Error(message), { code }); }
/** The physical cwd and sentinel must remain inside the original PRODUCT.
 * @param {string} root @param {{cwd:string,sentinel:string}} command */
function commandDirectory(root, command) {
  const cwd = realpathSync(path.resolve(root, command.cwd)), relative = path.relative(root, cwd);
  if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative) || !lstatSync(cwd).isDirectory()) refuse("project-command-cwd", "Configured command cwd leaves PRODUCT");
  const sentinel = path.join(cwd, command.sentinel), state = lstatSync(sentinel);
  if (!state.isFile() || state.isSymbolicLink() || realpathSync(sentinel) !== sentinel) refuse("project-command-sentinel", "Configured command sentinel must be a plain PRODUCT file");
  return cwd;
}
/** @param {{productRoot:string,productRevision:string,tool?:any}} options */
export function createProjectRuntime(options) {
  if (!options || Object.keys(options).some(key => !["productRoot", "productRevision", "tool"].includes(key))) refuse("project-runtime-request", "Only constructor PRODUCT root/revision and TOOL context are accepted");
  const tool = options.tool ?? loadInstalledRecordTool();
  requireInstalledRuntimeAssets(tool, ["tools/e2e/scripts/project-runtime.mjs", "tools/e2e/scripts/project-settings.mjs", "tools/e2e/scripts/dispatch-brief.mjs"]);
  const original = captureOperationRepository(options.productRoot, options.productRevision, { forEffect: false });
  const loaded = loadProjectSettings({ productRoot: options.productRoot, productRevision: options.productRevision, tool });
  if (loaded.status !== "ready") refuse(loaded.code, loaded.diagnostics.join("; "));
  const root = loaded.provenance.productRoot, revision = options.productRevision;
  const origin = operationContent(original);
  function verify() {
    try { if (operationContent(captureOperationRepository(root, revision, { forEffect: false })) !== origin) throw Error("Original PRODUCT repository identity differs"); }
    catch { refuse("project-runtime-origin-changed", "Original PRODUCT root/Git/common/object-store incarnation is unavailable or replaced"); }
    requireInstalledRuntimeAssets(tool, ["tools/e2e/scripts/project-runtime.mjs", "tools/e2e/scripts/dispatch-brief.mjs"]);
  }
  /** @param {"smoke"|"guard_class"|"bands"|"names"|"languages"|"tier_budgets"} section */
  function section(section) {
    verify(); const result = requireProjectSection(loaded, section);
    if (result.status !== "configured") refuse(`project-${section}-unconfigured`, result.diagnostics.join("; "));
    return result.value;
  }
  function assertCurrent() {
    verify();
    const head = spawnSync("git", ["-C", root, "rev-parse", "--verify", "HEAD"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    if (head.status !== 0 || head.stdout.replace(/\n$/, "") !== revision) refuse("project-runtime-revision-changed", "PRODUCT HEAD differs from the captured revision");
  }
  const schema = parseProcessSchema(readInstalledMethodAsset(tool, PROCESS_SCHEMA).text);
  const resolvedProcess = resolveProcess(schema, { profile: loaded.settings.process.profile, available: loaded.settings.process.available, overrides: new Map(Object.entries(loaded.settings.process.switches)) });
  verify();
  return Object.freeze({
    settings: loaded.settings, provenance: loaded.provenance,
    assertCurrent,
    /** Canonical role alias/model selection, with the configured default retained.
     * This observation does not launch or authorize a dispatch. @param {string} role */
    role(role) { verify(); return Object.freeze(roleModel(new Map(Object.entries(loaded.settings.roles)), role)); },
    process() { verify(); return structuredClone({ schema, settings: resolvedProcess }); },
    /** @param {string[]} paths */
    classify(paths) {
      const guards = section("guard_class");
      if (!Array.isArray(paths) || !paths.length || paths.some(value => typeof value !== "string" || value === "" || path.isAbsolute(value) || /[\\\x00-\x1f\x7f]/.test(value) || value.split("/").some(part => ["", "..", ".git", ".supertaskr"].includes(part)))) refuse("project-guard-path", "Classification requires nonempty PRODUCT-relative path data");
      const ids = guardClassIds(readInstalledMethodAsset(tool, "method/tasks/TASK-FORMAT.md").text);
      if (Object.keys(guards).sort().join(",") !== [...ids].sort().join(",")) refuse("project-guard-map", "guard_class must map every declared METHOD class, without invented classes");
      return guardClassHits(paths, new Map(Object.entries(guards)));
    },
    /** Compare configured names against plain committed PRODUCT blobs. Working
     * paths, symlinks and skipped read errors can never turn the scan green. */
    names() {
      const policy = /** @type {import("./rename-scan.mjs").NamePolicy} */ (section("names"));
      requireInstalledRuntimeAssets(tool, ["tools/e2e/scripts/rename-scan.mjs"]);
      /** @param {string[]} args */
      const git = args => {
        verify();
        const result = spawnSync("git", ["--no-replace-objects", "-C", root, ...args], { encoding: "buffer", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 32 * 1024 * 1024, env: { ...process.env, GIT_NO_LAZY_FETCH: "1", GIT_OPTIONAL_LOCKS: "0" } });
        if (result.status !== 0 || result.error) refuse("project-names-source-unavailable", "Configured committed PRODUCT source is unavailable");
        try { return new TextDecoder("utf-8", { fatal: true }).decode(result.stdout); }
        catch { refuse("project-names-source-encoding", "Configured PRODUCT source must be UTF-8"); }
      };
      const entries = git(["ls-tree", "-r", "-z", "--full-tree", revision]).split("\0").filter(Boolean).map(row => {
        const entry = /^(\d+) (\S+) ([0-9a-f]+)\t([\s\S]+)$/.exec(row);
        if (!entry) refuse("project-names-tree", "Unreadable committed PRODUCT tree entry");
        return { mode: entry[1], type: entry[2], oid: /** @type {string} */ (entry[3]), file: /** @type {string} */ (entry[4]) };
      });
      for (const prefix of policy.roots) if (!entries.some(entry => entry.file.startsWith(prefix))) refuse("project-names-corpus-unmatched", `Configured source root ${prefix} has no committed files`);
      for (const file of policy.files) if (!entries.some(entry => entry.file === file)) refuse("project-names-corpus-unmatched", `Configured source file ${file} is absent`);
      const corpus = entries.filter(entry => (policy.files.includes(entry.file) || policy.roots.some(prefix => entry.file.startsWith(prefix))) && !policy.excludedFiles.includes(entry.file) && !policy.binaryExtensions.includes(path.posix.extname(entry.file).toLowerCase()));
      if (!corpus.length) refuse("project-names-empty-corpus", "Configured name policy selects no committed text files");
      /** @type {{file:string,line:number,text:string,cls:string|null}[]} */ const legacy = [], cases = [], homoglyphs = [];
      for (const entry of corpus) {
        if (entry.type !== "blob" || !["100644", "100755"].includes(entry.mode ?? "")) refuse("project-names-source-kind", `${entry.file}: only plain committed PRODUCT files are supported`);
        const text = git(["cat-file", "blob", entry.oid]);
        for (const [index, value] of [entry.file, ...text.split("\n")].entries()) {
          if (carriesLegacy(value, policy.legacy)) legacy.push({ file: entry.file, line: index, text: value, cls: classifyLegacy(value, entry.file, policy.kept) });
          for (const reason of caseFindingsWithClasses(value, entry.file, policy.prose, policy.identifier, policy.kept)) cases.push({ file: entry.file, line: index, text: value, cls: reason });
          for (const reason of homoglyphFindings(value, policy.identifier, policy.legacy)) homoglyphs.push({ file: entry.file, line: index, text: value, cls: reason });
        }
      }
      verify();
      return { productRevision: revision, files: corpus.length, legacy, cases, homoglyphs,
        findings: [...legacy.filter(hit => hit.cls === null), ...cases, ...homoglyphs] };
    },
    /** Executes the committed smoke command, without minting a suite token. */
    smoke() {
      const command = section("smoke");
      assertCurrent();
      let cwd; try { cwd = commandDirectory(root, command); } catch (error) { refuse(/** @type {any} */ (error).code ?? "project-command-path", error instanceof Error ? error.message : String(error)); }
      const result = spawnSync(command.argv[0], command.argv.slice(1), { cwd, shell: false, stdio: ["ignore", "pipe", "pipe"], encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
      assertCurrent();
      return Object.freeze({ code: result.error || result.signal || result.status === null ? 3 : result.status === 0 ? 0 : 1,
        status: result.status, signal: result.signal, stdout: result.stdout ?? "", stderr: result.stderr ?? "",
        ...(result.error ? { problem: result.error.message } : {}), productRevision: revision, configurationDigest: loaded.provenance.configDigest });
    },
    section,
  });
}
