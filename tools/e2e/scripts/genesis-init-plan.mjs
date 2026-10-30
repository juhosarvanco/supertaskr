/** Finite new-project plan constructor. Selected directories are read-only;
 * Git preparation occurs only in the existing core's owned external scratch.
 * The service must discover original operations before calling this constructor
 * and revalidate its frozen TOOL/root facts at actual execution boundaries.
 */
import path from "node:path";
import { assertFreshProjectInitialization, capturePlainProjectRoot, prepareInitialRepository } from "./project-init-operation.mjs";
import { validProjectInitRequest } from "./project-init-record.mjs";
import { seedProjectSettings } from "./project-settings.mjs";
import { GENERIC_RECORD_PROFILE } from "./records-validation.mjs";
import { listInstalledMethodAssets, readInstalledMethodAssets, requireInstalledRuntimeAssets,
  verifyInstalledRecordTool } from "./records-check.mjs";
import { WORKSPACE_ASSOCIATION_REL_PATH, WORKSPACE_BINDING_REL_PATH } from "./workspace.mjs";

export class GenesisInitializationFinding extends Error {
  /** @param {string} code */
  constructor(code) { super(`${code}: new-project setup is unavailable`); this.code = code; }
}
/** @param {string} code @returns {never} */
function refuse(code) { throw new GenesisInitializationFinding(code); }
/** @template T @param {T} value @returns {Readonly<T>} */
function freeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}
/** @param {string} file @param {string} text */
function blob(file, text) { return { path: file, mode: "100644", base64: Buffer.from(text, "utf8").toString("base64") }; }
/** @param {any} roots */
function separateRoots(roots) {
  if (roots.product.device === roots.records.device && roots.product.inode === roots.records.inode) refuse("genesis-roots-same-directory");
  const relation = path.relative(roots.product.path, roots.records.path);
  const reverse = path.relative(roots.records.path, roots.product.path);
  if (![relation, reverse].every(value => value === ".." || value.startsWith(`..${path.sep}`) || path.isAbsolute(value))) refuse("genesis-roots-overlap");
}

/** Backend-only constructor, never a raw plans/tool/settings field accepted
 * from stdio or a webview. Its complete returned request stays in the service.
 * A fixed installed service creates the opaque TOOL handle internally.
 * @param {{productRoot:string,recordsRoot:string,operationId:string,projectId:string,tool:any}} input */
export function prepareGenesisInitialization(input) {
  if (!input || Object.keys(input).sort().join(",") !== ["operationId", "productRoot", "projectId", "recordsRoot", "tool"].join(",") ||
      typeof input.productRoot !== "string" || typeof input.recordsRoot !== "string" ||
      typeof input.operationId !== "string" || typeof input.projectId !== "string" ||
      !/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(input.operationId) || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(input.projectId)) refuse("genesis-init-request");
  requireInstalledRuntimeAssets(input.tool, ["genesis-init-plan", "project-init-operation", "project-init-record", "project-settings"].map(name => `tools/e2e/scripts/${name}.mjs`));
  const roots = { product: capturePlainProjectRoot(input.productRoot), records: capturePlainProjectRoot(input.recordsRoot) };
  separateRoots(roots);
  const seed = seedProjectSettings({ tool: input.tool, recordsValidation: GENERIC_RECORD_PROFILE });
  if (seed.status !== "ready") refuse(seed.code);
  const members = listInstalledMethodAssets(input.tool);
  const assets = readInstalledMethodAssets(input.tool, members.map(member => member.path));
  const byPath = new Map(assets.map(asset => [asset.path, asset]));
  /** @param {string} relative */
  const required = relative => { const asset = byPath.get(`method/${relative}`); if (!asset) refuse("genesis-method-member-required"); return asset.text; };
  const productFiles = [blob(".gitignore", ".supertaskr/\n"), blob("supertaskr.yaml", seed.yaml),
    blob("AGENTS.md", required("adapters/AGENTS.md")), blob("CLAUDE.md", required("adapters/CLAUDE.md"))];
  const product = prepareInitialRepository({ operationId: input.operationId, role: "product", initialRef: "refs/heads/main",
    files: productFiles, message: "Initialize local project setup" });
  const templates = assets.filter(asset => asset.path.startsWith("method/docs-templates/"));
  if (!templates.length || templates.some(asset => !asset.path.endsWith(".md"))) refuse("genesis-record-template-kind");
  const recordFiles = templates.map(asset => blob(`docs/${asset.path.slice("method/docs-templates/".length)}`, asset.text));
  if (!["NORTH_STAR.md", "ROADMAP.md", "ARCHITECTURE.md", "CONVENTIONS.md", "STATE.md"].every(name => recordFiles.some(file => file.path === `docs/${name}`))) refuse("genesis-record-template-required");
  const association = { version: 1, projectId: input.projectId, product: { objectFormat: product.objectFormat, rootCommits: [product.commit] } };
  recordFiles.push(blob(".gitignore", ".supertaskr/\n"), blob(WORKSPACE_ASSOCIATION_REL_PATH, JSON.stringify(association) + "\n"));
  const records = prepareInitialRepository({ operationId: input.operationId, role: "records", initialRef: "refs/heads/main",
    files: recordFiles, message: "Initialize private project records", identity: product.identity });
  const runtimeWrites = assets.map(asset => ({ role: "product", ...blob(`.supertaskr/genesis/kit/${asset.path.slice("method/".length)}`, asset.text) }));
  if (runtimeWrites.some(file => file.path === ".supertaskr/genesis/kit/kit.json")) refuse("genesis-kit-manifest-collision");
  const manifest = { version: 1, producer: "installed-tool", methodVersion: input.tool.methodVersion, methodDigest: input.tool.methodDigest,
    tool: { package: input.tool.package, parserVersion: input.tool.parserVersion, runtimeDigest: input.tool.runtimeDigest, manifestDigest: input.tool.manifestDigest },
    files: members.map(member => ({ path: member.path.slice("method/".length), sha256: member.sha256 })) };
  runtimeWrites.push({ role: "product", ...blob(".supertaskr/genesis/kit/kit.json", JSON.stringify(manifest) + "\n") },
    { role: "product", ...blob(WORKSPACE_BINDING_REL_PATH, JSON.stringify({ version: 1, projectId: input.projectId,
      productRoot: roots.product.path, recordsRoot: roots.records.path }) + "\n") });
  const directories = ["docs/decisions", "docs/tasks", "docs/rooms"].map(relative => ({ role: "records", path: relative }));
  const preimages = [...product.files.map((/** @type {{path:string}} */ file) => ({ role: "product", path: file.path, present: false })),
    ...records.files.map((/** @type {{path:string}} */ file) => ({ role: "records", path: file.path, present: false })),
    ...runtimeWrites.map(file => ({ role: file.role, path: file.path, present: false }))];
  const request = { version: 1, operationId: input.operationId, kind: "project-init", tool: input.tool, projectId: input.projectId,
    roots, plans: { product, records }, runtimeWrites, directories, preimages };
  if (!validProjectInitRequest(request)) refuse("genesis-init-plan-invalid");
  assertFreshProjectInitialization(request); verifyInstalledRecordTool(input.tool);
  // Preserve actual prepared object identity for core's constructor provenance.
  // Do not serialize/recapture this plan and submit it as a new operation.
  return freeze({ request, settings: seed.settings, settingsProvenance: seed.provenance,
    installation: { runtimeKit: "planned", methodFiles: members.length, skills: "not-installed", hooks: "not-installed" } });
}
