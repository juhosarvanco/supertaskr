/** Read-only setup recovery and current observations. Historical receipts do
 * not admit a current planner, install an update or grant filesystem access.
 */
import { execFileSync } from "node:child_process";
import { lstatSync, readFileSync, readdirSync, realpathSync } from "node:fs";
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
  if (!same(currentContext(current.product.root), current)) refuse("genesis-init-current-changed");
  return freeze({ status: "current", receipt: structuredClone(observed.receipt), current,
    settings: settings.settings, settingsProvenance: settings.provenance, planner: resolveProjectRole(settings, "planner"),
    installation: { runtimeKit: "verified", skills: "not-installed", hooks: "not-installed" } });
}
