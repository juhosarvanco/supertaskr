/** Read-only setup recovery and current observations. Historical receipts do
 * not admit a current planner, install an update or grant filesystem access.
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { closeSync, constants, fstatSync, lstatSync, openSync, readFileSync, readSync, readdirSync, realpathSync } from "node:fs";
import path from "node:path";
import { listAcceptedOperations, captureOperationRepository } from "./durable-operation.mjs";
import { observeProjectInitialization } from "./project-init-operation.mjs";
import { operationContent } from "./operation-record.mjs";
import { loadProjectSettings, resolveProjectRole } from "./project-settings.mjs";
import { requireInstalledRuntimeAssets, verifyInstalledRecordTool } from "./records-check.mjs";
import { resolveWorkspace } from "./workspace.mjs";

export class GenesisInspectionFinding extends Error {
  /** @param {string} code */
  constructor(code) { super(`${code}: project setup observation is unavailable`); this.code = code; }
}
/** @param {string} code @returns {never} */
function refuse(code) { throw new GenesisInspectionFinding(code); }
/** @param {any} value @returns {any} */
function freeze(value) { if (value && typeof value === "object") { Object.values(value).forEach(freeze); Object.freeze(value); } return value; }
/** @param {any} a @param {any} b */
function same(a, b) { return operationContent(a) === operationContent(b); }
/** @param {string} root */
function directory(root) {
  if (realpathSync(root) !== root) refuse("genesis-init-origin-changed");
  const stat = lstatSync(root, { bigint: true });
  if (!stat.isDirectory() || stat.isSymbolicLink()) refuse("genesis-init-origin-changed");
  return { path: root, device: String(stat.dev), inode: String(stat.ino) };
}
/** @param {string} parent @param {string} name */
function childDirectory(parent, name) {
  if (!readdirSync(parent).includes(name)) refuse("genesis-init-origin-changed");
  return directory(path.join(parent, name));
}
/** @param {any} roots */
function originalHomesPresent(roots) {
  try { return ["product", "records"].every(role => same(directory(roots[role].path), roots[role])); }
  catch { return false; }
}

/** Discover before new-only/nonempty admission and without current TOOL,
 * binding or config loading. A missing original home retains metadata only;
 * its stored state is not an exact receipt and cannot authorize replay here.
 * Malformed owned operation rows refuse the whole enumeration.
 * @param {string} productRoot */
export function discoverProjectInitializations(productRoot) {
  productRoot = realpathSync(productRoot); directory(productRoot);
  const initializations = [];
  for (const rec of listAcceptedOperations(productRoot)) {
    if (rec.operation.kind !== "project-init") continue;
    if (rec.resource !== productRoot || rec.operation.request.roots.product.path !== productRoot) refuse("genesis-init-coordinator-mismatch");
    const op = rec.operation, matched = originalHomesPresent(op.request.roots);
    const observed = matched ? observeProjectInitialization(productRoot, op.id) : null;
    if (matched && observed === null) refuse("genesis-init-operation-changed");
    initializations.push({ operationId: op.id, projectId: op.request.projectId,
      state: observed?.status ?? (op.acceptance === null ? "pending" : "initialized"),
      roots: structuredClone(op.request.roots), requestDigest: op.digest,
      phase: { productStage: op.progress.product.stage, recordsStage: op.progress.records.stage, bindingAccepted: op.binding.accepted },
      originStatus: matched ? "matched" : "unavailable",
      ...(observed?.receipt ? { receipt: structuredClone(observed.receipt) } : {}) });
  }
  return freeze({ status: "initializations", initializations });
}
/** @param {string} root @param {string[]} args */
function git(root, args) {
  try { return execFileSync("git", ["--no-replace-objects", "-C", root, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 4 * 1024 * 1024, env: { ...process.env, GIT_NO_LAZY_FETCH: "1", GIT_OPTIONAL_LOCKS: "0" } }).replace(/\n$/, ""); }
  catch { refuse("genesis-init-current-repository-unavailable"); }
}
/** @param {string} productRoot */
function currentContext(productRoot) {
  productRoot = realpathSync(productRoot);
  const productRevision = git(productRoot, ["rev-parse", "HEAD"]);
  const workspace = resolveWorkspace({ productRoot, mode: "development", commit: productRevision });
  if (workspace.layout !== "split" || workspace.association.status !== "verified") refuse("genesis-init-current-association-required");
  const recordsRevision = git(workspace.recordsRoot, ["rev-parse", "HEAD"]);
  const product = captureOperationRepository(productRoot, productRevision, { forEffect: false });
  const records = captureOperationRepository(workspace.recordsRoot, recordsRevision, { forEffect: false });
  const pRoot = product.identities[0], rRoot = records.identities[0];
  if (pRoot?.device === rRoot?.device && pRoot?.inode === rRoot?.inode || product.identities.slice(1).some(p => records.identities.slice(1).some(r => p.device === r.device && p.inode === r.inode))) refuse("genesis-init-independent-records-required");
  return { productRevision, recordsRevision, product, records, association: workspace.association,
    docs: childDirectory(records.root, "docs"), runtime: childDirectory(product.root, ".supertaskr") };
}
/** Exact original blank kit only. Later installation/adoption needs its own
 * finite producer receipt; this reader never rewrites or repairs the kit.
 * @param {any} rec @param {any} current */
function verifyRuntimeKit(rec, current) {
  const prefix = ".supertaskr/genesis/kit/", files = rec.operation.request.runtimeWrites.filter((/** @type {any} */ f) => f.path.startsWith(prefix));
  if (!files.length) refuse("genesis-init-kit-unavailable");
  const genesis = childDirectory(current.runtime.path, "genesis"), kit = childDirectory(genesis.path, "kit");
  const expected = new Map(files.map((/** @type {any} */ f) => [f.path.slice(prefix.length), f])), seen = new Set();
  /** @param {string} relative */
  function walk(relative) {
    const at = relative ? path.join(kit.path, relative) : kit.path;
    for (const name of readdirSync(at)) {
      const member = relative ? `${relative}/${name}` : name, absolute = path.join(at, name), stat = lstatSync(absolute);
      if (stat.isSymbolicLink()) refuse("genesis-init-kit-changed");
      if (stat.isDirectory()) {
        if (![...expected.keys()].some(file => file.startsWith(`${member}/`))) refuse("genesis-init-kit-changed");
        walk(member); continue;
      }
      const file = expected.get(member);
      if (!stat.isFile() || stat.nlink !== 1 || !file || (stat.mode & 0o111 ? "100755" : "100644") !== file.mode ||
          readFileSync(absolute).toString("base64") !== file.base64) refuse("genesis-init-kit-changed");
      seen.add(member);
    }
  }
  walk(""); if (seen.size !== expected.size) refuse("genesis-init-kit-changed");
}

/** This is exact original producer data, never a plan-content heuristic. A
 * dirty/extra/linked seed is ordinary existing work and cannot bootstrap Start.
 * The caller still rechecks origin/current policy before any planner effect.
 * @param {any} rec @param {any} current @param {any} receipt */
function pristineInitializationSeed(rec, current, receipt) {
  if (current.recordsRevision !== receipt.records.commit || constants.O_NOFOLLOW === undefined || constants.O_NONBLOCK === undefined) return false;
  const plan = rec.operation.request.plans.records, files = plan.files.filter((/** @type {any} */ file) => file.path.startsWith("docs/"));
  if (!files.length) return false;
  const expected = new Map(files.map((/** @type {any} */ file) => [file.path, file])), directories = new Set(["docs"]), seen = new Set();
  for (const file of files) { let parent = path.dirname(file.path); while (parent !== ".") { directories.add(parent); parent = path.dirname(parent); } }
  for (const row of rec.operation.request.directories) if (row.role === "records" && row.path.startsWith("docs/")) directories.add(row.path);
  const index = () => git(current.records.root, ["ls-files", "--stage", "-z", "--", "docs"]);
  const flags = () => git(current.records.root, ["ls-files", "-v", "-z", "--", "docs"]);
  try {
    const staged = index(), marked = flags(), entries = staged.split("\0").filter(Boolean);
    if (entries.length !== files.length || marked.split("\0").filter(Boolean).some(row => !row.startsWith("H "))) return false;
    for (const row of entries) {
      const tab = row.indexOf("\t"), [mode, oid, stage] = row.slice(0, tab).split(" "), file = expected.get(row.slice(tab + 1));
      if (!file || stage !== "0" || mode !== file.mode) return false;
      const bytes = Buffer.from(file.base64, "base64"), hash = createHash(plan.objectFormat).update(`blob ${bytes.length}\0`).update(bytes).digest("hex");
      if (oid !== hash) return false;
    }
    /** @param {string} relative */
    function walk(relative) {
      for (const name of readdirSync(path.join(current.records.root, relative))) {
        const member = `${relative}/${name}`, absolute = path.join(current.records.root, member), stat = lstatSync(absolute);
        if (stat.isSymbolicLink()) return false;
        if (stat.isDirectory()) { if (!directories.has(member) || !walk(member)) return false; continue; }
        const file = expected.get(member);
        if (!file || !stat.isFile() || stat.nlink !== 1 || (stat.mode & 0o111 ? "100755" : "100644") !== file.mode) return false;
        const bytes = Buffer.from(file.base64, "base64"); if (stat.size !== bytes.length) return false;
        const fd = openSync(absolute, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
        try {
          const opened = fstatSync(fd); if (!opened.isFile() || opened.dev !== stat.dev || opened.ino !== stat.ino || opened.size !== bytes.length || opened.mode !== stat.mode || opened.nlink !== 1) return false;
          const actual = Buffer.alloc(bytes.length + 1); let count = 0;
          while (count < actual.length) { const read = readSync(fd, actual, count, actual.length - count, count); if (read === 0) break; count += read; }
          const after = fstatSync(fd), named = lstatSync(absolute);
          if (count !== bytes.length || !actual.subarray(0, count).equals(bytes) || after.size !== opened.size || after.mode !== opened.mode || after.nlink !== 1 || after.mtimeMs !== opened.mtimeMs || after.ctimeMs !== opened.ctimeMs ||
              named.isSymbolicLink() || named.dev !== opened.dev || named.ino !== opened.ino || named.mode !== opened.mode || named.nlink !== 1) return false;
        } finally { closeSync(fd); }
        seen.add(member);
      }
      return true;
    }
    return walk("docs") && seen.size === expected.size && index() === staged && flags() === marked;
  } catch { return false; }
}

/** Backend-only current data, not a session/write grant. Unique exact original
 * acceptance, physical homes, current association/config and original kit must
 * all agree. The native caller must still bind its own selected context and
 * revalidate at the actual writer/spawn boundary. No YAML/identity/plan is sent.
 * @param {{productRoot:string,tool:any}} input */
export function inspectProjectInitialization(input) {
  if (!input || Object.keys(input).sort().join(",") !== "productRoot,tool" || typeof input.productRoot !== "string") refuse("genesis-init-inspect-request");
  requireInstalledRuntimeAssets(input.tool, ["genesis-init-inspect", "project-init-operation", "project-init-record", "project-settings"].map(name => `tools/e2e/scripts/${name}.mjs`));
  const current = currentContext(input.productRoot), discovered = discoverProjectInitializations(current.product.root);
  const matching = discovered.initializations.filter((/** @type {any} */ row) => row.originStatus === "matched" && row.state === "initialized" && row.receipt &&
    row.roots.product.path === current.product.root && row.roots.records.path === current.records.root && row.projectId === current.association.projectId);
  if (matching.length !== 1) refuse(matching.length > 1 ? "genesis-init-current-ambiguous" : "genesis-init-current-receipt-required");
  const row = matching[0], observed = observeProjectInitialization(current.product.root, row.operationId);
  if (observed?.status !== "initialized" || !same(observed.receipt, row.receipt)) refuse("genesis-init-operation-changed");
  const rec = observed.record;
  if (!same(rec.operation.request.tool, input.tool)) refuse("genesis-init-tool-changed");
  for (const role of /** @type {("product"|"records")[]} */ (["product", "records"])) if (!same(current[role], rec.operation.progress[role].repository)) refuse("genesis-init-origin-changed");
  const settings = loadProjectSettings({ productRoot: current.product.root, productRevision: current.productRevision, tool: input.tool });
  if (settings.status !== "ready") refuse(settings.code);
  verifyRuntimeKit(rec, current); verifyInstalledRecordTool(input.tool);
  const pristineSeed = pristineInitializationSeed(rec, current, observed.receipt);
  if (!same(currentContext(current.product.root), current)) refuse("genesis-init-current-changed");
  return freeze({ status: "current", receipt: structuredClone(observed.receipt), current,
    settings: settings.settings, settingsProvenance: settings.provenance, planner: resolveProjectRole(settings, "planner"), planning: { pristineSeed },
    installation: { runtimeKit: "verified", skills: "not-installed", hooks: "not-installed" } });
}

/** Requalify a retained planner's original committed role while current setup
 * and future-bank settings are observed independently. Revision is backend
 * retained data; it selects no program, TOOL, profile or alternative role.
 * @param {{productRoot:string,productRevision:string,tool:any}} input */
export function inspectOriginalProjectPlanner(input) {
  if (!input || Object.keys(input).sort().join(",") !== "productRevision,productRoot,tool" ||
      typeof input.productRevision !== "string" || !/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(input.productRevision)) refuse("genesis-planner-original-request");
  const inspected = inspectProjectInitialization({ productRoot: input.productRoot, tool: input.tool });
  try { git(inspected.current.product.root, ["merge-base", "--is-ancestor", input.productRevision, inspected.current.productRevision]); }
  catch { refuse("genesis-planner-original-history"); }
  const settings = loadProjectSettings({ productRoot: inspected.current.product.root, productRevision: input.productRevision, tool: input.tool });
  if (settings.status !== "ready") refuse(settings.code);
  verifyInstalledRecordTool(input.tool);
  if (!same(currentContext(inspected.current.product.root), inspected.current)) refuse("genesis-init-current-changed");
  return freeze({ status: "original-planner", current: inspected.current, settingsProvenance: settings.provenance, planner: resolveProjectRole(settings, "planner") });
}
