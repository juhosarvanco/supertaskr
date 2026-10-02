/**
 * Read-only workspace association and repository-relative resource locations (T-347).
 * No import-time I/O. Association detects accidental mismatches; it authenticates
 * nobody and activates no dispatch, ownership, reservation or delivery route.
 */
import { execFileSync } from "node:child_process";
import { lstatSync, readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import { RUNTIME_DIR } from "../../../.claude/hooks/lane-fence.mjs";

/** @typedef {{objectFormat: string, rootCommits: string[], selectedCommit?: string}} ProductIdentity */
/** @typedef {{version: number, projectId: string, product: ProductIdentity}} PortableAssociation */
/** @typedef {{version: number, projectId: string, productRoot: string, recordsRoot: string}} LocalBinding */
/** @typedef {{status: string, source: string, bindingPath?: string, projectId?: string, productIdentity?: ProductIdentity, assurance?: string}} AssociationResult */
/** @typedef {{productRoot: string, recordsRoot: string, runtimeRoot: string, layout: "colocated"|"split", mode: string, association: AssociationResult, limitations: string[]}} Workspace */

export const WORKSPACE_BINDING_REL_PATH = `${RUNTIME_DIR}/workspace.json`;
export const WORKSPACE_ASSOCIATION_REL_PATH = "workspace-association.json";
export const WORKSPACE_LIMITATIONS = Object.freeze([
  "Association is accidental-mismatch detection, not authentication or owner authorization.",
  "Split orchestration, component expansion consumers, paired reservations and landing authority are not activated.",
  "Resource resolution grants no write ownership, modifies no fence and encodes no delivery route.",
  "The runtime location belongs to the selected product checkout; it is not a repository role or writable fence root.",
]);

export class WorkspaceFinding extends Error {
  /** @param {string} code @param {string} detail */
  constructor(code, detail) {
    super(`${code}: ${detail}`);
    this.name = "WorkspaceFinding";
    this.code = code;
  }
}

/** @param {string} code @param {string} detail @returns {never} */
function refuse(code, detail) { throw new WorkspaceFinding(code, detail); }
/** @param {unknown} err */
function errorText(err) { return err instanceof Error ? err.message : String(err); }
/** @param {unknown} err */
function isAbsent(err) { return err instanceof Error && "code" in err && err.code === "ENOENT"; }
/** @param {string} file @param {string} label */
function statIfPresent(file, label) {
  try { return lstatSync(file); }
  catch (err) {
    if (isAbsent(err)) return null;
    refuse(`${label}-unreadable`, `${file}: ${errorText(err)}`);
  }
}

/** Probe only the local configuration; absence preserves legacy CLI behavior.
 * @param {string} productRoot @returns {boolean}
 */
export function workspaceBindingPresent(productRoot) {
  return statIfPresent(path.join(productRoot, WORKSPACE_BINDING_REL_PATH), "binding") !== null;
}
/** @param {string} file @param {string} label @returns {unknown} */
function readJson(file, label) {
  let text;
  try { text = readFileSync(file, "utf8"); }
  catch (err) { refuse(`${label}-unreadable`, `${file}: ${errorText(err)}`); }
  try { return JSON.parse(text); }
  catch (err) { refuse(`${label}-malformed`, `${file}: ${errorText(err)}`); }
}
/** @param {unknown} value @param {string[]} keys @param {string} label */
function fields(value, keys, label) {
  if (value === null || typeof value !== "object" || Array.isArray(value) ||
      Object.keys(value).sort().join(",") !== [...keys].sort().join(",")) {
    refuse(`${label}-schema`, `expected exactly ${keys.join(", ")}`);
  }
}
/** @param {unknown} value @param {string} label */
function projectIdentifier(value, label) {
  if (typeof value !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(value)) {
    refuse(`${label}-project-id`, "projectId must be a portable identifier, not a machine location");
  }
}
/** @param {string} root @param {string[]} args @param {string} label */
function git(root, args, label) {
  try {
    return execFileSync("git", ["--no-replace-objects", "-C", root, ...args], {
      encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, GIT_NO_LAZY_FETCH: "1", GIT_OPTIONAL_LOCKS: "0" },
    }).trim();
  } catch (err) { refuse(label, `${root}: ${errorText(err)}`); }
}
/** @param {string} candidate @param {string} role */
function repositoryRoot(candidate, role) {
  if (typeof candidate !== "string" || candidate === "") refuse(`${role}-root-missing`, "a repository root is required");
  let canonical;
  try { canonical = realpathSync(candidate); }
  catch (err) { refuse(`${role}-root-unreadable`, `${candidate}: ${errorText(err)}`); }
  const top = git(canonical, ["rev-parse", "--show-toplevel"], `${role}-repository-unavailable`);
  if (realpathSync(top) !== canonical) refuse(`${role}-root-nested`, `${candidate} is not the repository top level ${top}`);
  return canonical;
}
/** @param {string} root @param {string} destination */
function within(root, destination) {
  const rel = path.relative(root, destination);
  return rel === "" || (!path.isAbsolute(rel) && rel !== ".." && !rel.startsWith(`..${path.sep}`));
}
/** @param {string} productRoot */
function runtimeLocation(productRoot) {
  const runtimeRoot = path.join(productRoot, RUNTIME_DIR);
  if (statIfPresent(runtimeRoot, "runtime") !== null) {
    let physical;
    try { physical = realpathSync(runtimeRoot); }
    catch (err) { refuse("runtime-unreadable", errorText(err)); }
    if (!within(productRoot, physical)) refuse("runtime-escape", `${runtimeRoot} escapes the selected product checkout`);
    if (!lstatSync(physical).isDirectory()) refuse("runtime-location-invalid", "runtimeRoot must be a directory location");
    if (path.relative(productRoot, physical).split(path.sep).some((part) => part.toLowerCase() === ".git")) {
      refuse("runtime-control-path", "runtimeRoot cannot be inside Git control data");
    }
    if (statIfPresent(path.join(physical, ".git"), "runtime") !== null) {
      refuse("runtime-repository", "runtimeRoot cannot be a Git repository");
    }
    if (git(physical, ["rev-parse", "--is-bare-repository"], "runtime-repository-unavailable") === "true") {
      refuse("runtime-repository", "runtimeRoot cannot be a bare Git repository");
    }
  }
  return runtimeRoot;
}

/** Measure complete product identity at a selected commit, without reading records.
 * @param {string} productRoot @param {{commit?: string}} [options] @returns {ProductIdentity}
 */
export function measureProductIdentity(productRoot, { commit = "HEAD" } = {}) {
  const root = repositoryRoot(productRoot, "product");
  if (git(root, ["rev-parse", "--is-shallow-repository"], "product-history-unavailable") !== "false") {
    refuse("product-history-shallow", "complete root-commit identity cannot be measured from shallow history");
  }
  const grafts = git(root, ["rev-parse", "--git-path", "info/grafts"], "product-history-unavailable");
  if (statIfPresent(path.resolve(root, grafts), "product-history") !== null) {
    refuse("product-history-grafted", "grafted history cannot establish the actual root-commit set");
  }
  if (typeof commit !== "string" || commit === "" || commit.startsWith("-")) refuse("product-commit-invalid", "name a selected product commit");
  const selectedCommit = git(root, ["rev-parse", "--verify", `${commit}^{commit}`], "product-commit-unavailable");
  const objectFormat = git(root, ["rev-parse", "--show-object-format"], "product-object-format-unavailable");
  if (!["sha1", "sha256"].includes(objectFormat)) refuse("product-object-format-unsupported", objectFormat);
  // A commit graph can answer from cached parent metadata even when a commit
  // object is missing. Read the actual parent objects for this identity check.
  const roots = git(root, ["-c", "core.commitGraph=false", "rev-list", "--max-parents=0", selectedCommit], "product-history-incomplete");
  const rootCommits = normalizedRoots(roots.split(/\s+/), objectFormat, "product");
  return { objectFormat, rootCommits, selectedCommit };
}

/** @param {unknown} roots @param {unknown} objectFormat @param {string} label @returns {string[]} */
function normalizedRoots(roots, objectFormat, label) {
  if (typeof objectFormat !== "string" || !["sha1", "sha256"].includes(objectFormat)) refuse(`${label}-object-format-unsupported`, String(objectFormat));
  const length = objectFormat === "sha1" ? 40 : 64;
  if (!Array.isArray(roots) || roots.length === 0 || roots.some((r) => typeof r !== "string" || !new RegExp(`^[0-9a-fA-F]{${length}}$`).test(r))) {
    refuse(`${label}-root-commits-invalid`, `expected a non-empty set of full ${objectFormat} root commit ids`);
  }
  return [...new Set(roots.map((r) => r.toLowerCase()))].sort();
}

/**
 * Source-neutral: callers may supply parsed committed bytes or captured data.
 * The measured identity is supplied separately; this function does no I/O.
 * @param {unknown} data @param {ProductIdentity} productIdentity
 * @param {{projectId?: string, source?: string}} [options]
 */
export function validateAssociation(data, productIdentity, { projectId, source = "captured association" } = {}) {
  fields(data, ["version", "projectId", "product"], "association");
  const association = /** @type {PortableAssociation} */ (data);
  if (association.version !== 1) refuse("association-version-unsupported", String(association.version));
  projectIdentifier(association.projectId, "association");
  projectIdentifier(projectId, "binding");
  if (association.projectId !== projectId) refuse("association-project-mismatch", `${association.projectId} differs from binding ${projectId}`);
  fields(association.product, ["objectFormat", "rootCommits"], "association-product");
  const declared = normalizedRoots(association.product.rootCommits, association.product.objectFormat, "association");
  if (!productIdentity || typeof productIdentity !== "object") refuse("product-identity-missing", "supply measured product identity");
  const measured = normalizedRoots(productIdentity.rootCommits, productIdentity.objectFormat, "product");
  if (association.product.objectFormat !== productIdentity.objectFormat) refuse("association-object-format-mismatch", "declared and measured product object formats differ");
  if (JSON.stringify(declared) !== JSON.stringify(measured)) refuse("association-root-commits-mismatch", "declared and measured complete root-commit sets differ");
  return { status: "verified", projectId, source, productIdentity: { ...productIdentity, rootCommits: measured }, assurance: "accidental-mismatch detection, not authentication" };
}

/** Resolve one selected product checkout. Only absent binding means colocated.
 * @param {{productRoot?: string, mode?: string, commit?: string}} [options] @returns {Workspace}
 */
export function resolveWorkspace({ productRoot = process.cwd(), mode = "development", commit = "HEAD" } = {}) {
  if (!["development", "product-only"].includes(mode)) refuse("workspace-mode-unknown", String(mode));
  const selectedRoot = repositoryRoot(productRoot, "product");
  const runtimeRoot = runtimeLocation(selectedRoot);
  const bindingPath = path.join(selectedRoot, WORKSPACE_BINDING_REL_PATH);
  if (!workspaceBindingPresent(selectedRoot)) {
    return { productRoot: selectedRoot, recordsRoot: selectedRoot, runtimeRoot, layout: "colocated", mode,
      association: { status: mode === "product-only" ? "unverified" : "unconfigured", source: "absent local binding; colocated default" },
      limitations: [...WORKSPACE_LIMITATIONS] };
  }
  const binding = /** @type {LocalBinding} */ (readJson(bindingPath, "binding"));
  fields(binding, ["version", "projectId", "productRoot", "recordsRoot"], "binding");
  if (binding.version !== 1) refuse("binding-version-unsupported", String(binding.version));
  projectIdentifier(binding.projectId, "binding");
  for (const [role, location] of [["product", binding.productRoot], ["records", binding.recordsRoot]]) {
    if (typeof location !== "string" || !path.isAbsolute(location)) {
      refuse(`binding-${role}-root-invalid`, "local repository locations must be absolute paths");
    }
  }
  const boundProduct = repositoryRoot(binding.productRoot, "product");
  if (boundProduct !== selectedRoot) refuse("binding-product-mismatch", "binding does not name the selected product checkout");
  const provenance = { bindingPath, projectId: binding.projectId };
  // Do not stat, open, resolve a symlink in, or run git against private records.
  if (mode === "product-only") {
    return { productRoot: selectedRoot, recordsRoot: binding.recordsRoot, runtimeRoot, layout: "split", mode,
      association: { ...provenance, status: "unverified", source: "local binding only; records association was not opened" },
      limitations: [...WORKSPACE_LIMITATIONS] };
  }
  const recordsRoot = repositoryRoot(binding.recordsRoot, "records");
  if (recordsRoot === selectedRoot) refuse("binding-layout-mismatch", "a configured split binding must select distinct repositories");
  const associationPath = path.join(recordsRoot, WORKSPACE_ASSOCIATION_REL_PATH);
  if (statIfPresent(associationPath, "association") === null) refuse("association-missing", associationPath);
  let physicalAssociation;
  try { physicalAssociation = realpathSync(associationPath); }
  catch (err) { refuse("association-unreadable", `${associationPath}: ${errorText(err)}`); }
  if (!within(recordsRoot, physicalAssociation)) refuse("association-escape", associationPath);
  const association = validateAssociation(readJson(associationPath, "association"), measureProductIdentity(selectedRoot, { commit }), {
    projectId: binding.projectId, source: associationPath,
  });
  return { productRoot: selectedRoot, recordsRoot, runtimeRoot, layout: "split", mode,
    association: { ...provenance, ...association }, limitations: [...WORKSPACE_LIMITATIONS] };
}

/** @param {unknown} token @returns {string} */
function safeRelative(token) {
  if (typeof token !== "string" || token === "" || path.posix.isAbsolute(token) || path.win32.isAbsolute(token)) refuse("resource-absolute-or-empty", String(token));
  if (token.includes("\\") || token.split("/").some((part) => part === "" || part === "." || part === "..")) refuse("resource-traversal", token);
  if (token.includes("\0")) refuse("resource-invalid", "NUL is not a path character");
  if (token.split("/").some((part) => part.toLowerCase() === ".git" || part.toLowerCase() === RUNTIME_DIR.toLowerCase())) refuse("resource-control-path", token);
  return token;
}

/** Location and key only, with explicit legacy ownership; never a fence grant.
 * @param {Workspace} workspace
 * @param {{role?: string, path?: string, token?: string, source?: string}} resource
 * @param {{legacyTokenMap?: Record<string, string|string[]>}} [options]
 */
export function resolveResource(workspace, resource, { legacyTokenMap = {} } = {}) {
  let role = resource.role;
  const token = resource.path ?? resource.token;
  const relativePath = safeRelative(token);
  let resolutionRule = "explicit-repository-role";
  if (role === undefined) {
    if (!Object.hasOwn(legacyTokenMap, relativePath)) refuse("resource-legacy-unmapped", relativePath);
    const mapping = legacyTokenMap[relativePath];
    const roles = [...new Set(Array.isArray(mapping) ? mapping : [mapping])];
    if (roles.some((r) => r !== "product" && r !== "records")) refuse("resource-role-unknown", String(mapping));
    if (roles.length !== 1) refuse("resource-legacy-ambiguous", relativePath);
    role = roles[0];
    resolutionRule = "explicit-legacy-token-map";
  }
  if (role !== "product" && role !== "records") refuse("resource-role-unknown", String(role));
  const root = role === "product" ? workspace.productRoot : workspace.recordsRoot;
  if (typeof root !== "string" || !path.isAbsolute(root)) refuse("resource-root-unknown", String(role));
  if (role === "records" && workspace.mode === "product-only") refuse("resource-records-unverified", "resolve development workspace before opening records");
  const source = resource.source ?? "working-tree";
  if (typeof source !== "string" || source === "") refuse("resource-source-invalid", "name a source token");
  const absolutePath = path.join(root, relativePath);
  let ancestor = absolutePath;
  while (statIfPresent(ancestor, "resource") === null) {
    const parent = path.dirname(ancestor);
    if (parent === ancestor) refuse("resource-root-unavailable", root);
    ancestor = parent;
  }
  let physicalAncestor;
  try { physicalAncestor = realpathSync(ancestor); }
  catch (err) { refuse("resource-unreadable", errorText(err)); }
  const physicalPath = path.resolve(physicalAncestor, path.relative(ancestor, absolutePath));
  if (!within(root, physicalPath)) refuse("resource-symlink-escape", relativePath);
  safeRelative(path.relative(root, physicalPath).split(path.sep).join("/"));
  return { key: JSON.stringify([role, relativePath, source, resolutionRule]), role, relativePath, source, resolutionRule,
    root, absolutePath, physicalPath, colocatedOverlap: workspace.layout === "colocated",
    authority: "location only; no write ownership or disjoint reservation claim" };
}
