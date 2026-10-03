/**
 * Committed records views (T-348). No import-time I/O and no generated parser.
 * Receipts are data only: they approve no dispatch and grant no write access.
 */
import { execFileSync } from "node:child_process";
import { realpathSync } from "node:fs";
import path from "node:path";
import { parse as parseYaml } from "yaml";
import { frontmatterBlock, isTaskCardPath } from "./docs-scan.mjs";
import { measureProductIdentity, resolveWorkspace, validateAssociation,
  WORKSPACE_ASSOCIATION_REL_PATH } from "./workspace.mjs";

export class RecordReaderFinding extends Error {
  /** @param {string} code @param {string} detail */
  constructor(code, detail) { super(`${code}: ${detail}`); this.name = "RecordReaderFinding"; this.code = code; }
}
/** @param {string} code @param {string} detail @returns {never} */
function refuse(code, detail) { throw new RecordReaderFinding(code, detail); }
/** @param {unknown} err */
function message(err) { return err instanceof Error ? err.message : String(err); }
/** @param {string} root @param {string[]} args @param {string} code */
function git(root, args, code) {
  try {
    return execFileSync("git", ["--no-replace-objects", "-C", root, ...args], {
      stdio: ["ignore", "pipe", "pipe"], maxBuffer: 16 * 1024 * 1024,
      env: { ...process.env, GIT_NO_LAZY_FETCH: "1", GIT_OPTIONAL_LOCKS: "0" },
    });
  } catch (err) { refuse(code, `${root}: ${message(err)}`); }
}
/** @param {Buffer} bytes @param {string} label */
function utf8(bytes, label) {
  try { return new TextDecoder("utf-8", { fatal: true }).decode(bytes); }
  catch (err) { refuse("records-encoding-invalid", `${label}: ${message(err)}`); }
}
/** Detached JSON values, recursively frozen. Cyclic YAML is a named refusal.
 * @template T @param {T} data @returns {Readonly<T>}
 */
function immutable(data) {
  let detached;
  try { detached = JSON.parse(JSON.stringify(data)); }
  catch (err) { refuse("records-data-invalid", message(err)); }
  /** @param {any} value */
  function freeze(value) {
    if (value && typeof value === "object") { Object.values(value).forEach(freeze); Object.freeze(value); }
    return value;
  }
  return freeze(detached);
}
/** @param {unknown} relativePath @returns {string} */
function safeCardPath(relativePath) {
  if (typeof relativePath !== "string" || path.posix.isAbsolute(relativePath) || path.win32.isAbsolute(relativePath) ||
      /[\\\x00-\x1f\x7f]/.test(relativePath) || relativePath.split("/").some((p) => p === "" || p === "." || p === "..") ||
      !isTaskCardPath(relativePath)) refuse("records-card-path-unsafe", String(relativePath));
  return relativePath;
}
/** @param {string} root @param {string} revision */
function exactCommit(root, revision) {
  if (typeof revision !== "string" || !revision || revision.startsWith("-")) refuse("records-revision-invalid", "name an explicit records revision");
  return git(root, ["rev-parse", "--verify", "--end-of-options", `${revision}^{commit}`], "records-commit-unavailable").toString("utf8").trim();
}
/** @typedef {{mode: string, type: string, oid: string, relativePath: string}} Entry */
/** @param {string} root @param {string} commit @returns {Entry[]} */
function entries(root, commit) {
  const listing = utf8(git(root, ["ls-tree", "-r", "-t", "-z", "--full-tree", commit], "records-tree-unavailable"), commit);
  return listing.split("\0").filter(Boolean).map((line) => {
    const m = /^(\d+) (\S+) ([0-9a-f]+)\t([\s\S]+)$/.exec(line);
    if (!m) refuse("records-tree-invalid", line);
    return { mode: /** @type {string} */ (m[1]), type: /** @type {string} */ (m[2]),
      oid: /** @type {string} */ (m[3]), relativePath: /** @type {string} */ (m[4]) };
  });
}
/** @param {string} root @param {Entry} entry */
function blob(root, entry) {
  if (entry.type !== "blob" || !["100644", "100755"].includes(entry.mode)) {
    refuse("records-entry-not-regular", `${entry.relativePath}: mode ${entry.mode}, type ${entry.type}; symlinks and gitlinks are unsupported`);
  }
  return git(root, ["cat-file", "blob", entry.oid], "records-blob-unavailable");
}
/** @param {string} root @param {Entry} entry */
function card(root, entry) {
  const relativePath = safeCardPath(entry.relativePath);
  const retained = blob(root, entry);
  const content = utf8(retained, relativePath);
  const block = frontmatterBlock(content);
  if (block === null) refuse("records-card-malformed", `${relativePath}: expected a closed YAML frontmatter block`);
  /** @type {Record<string, any>} */
  let fields;
  try { fields = parseYaml(block); }
  catch (err) { refuse("records-card-malformed", `${relativePath}: ${message(err)}`); }
  if (!fields || typeof fields !== "object" || Array.isArray(fields)) refuse("records-card-malformed", `${relativePath}: frontmatter must be a mapping`);
  const id = fields.id;
  if (typeof id !== "string" || !/^T-\d+(?:-s\d+)?$/.test(id)) refuse("records-card-id-invalid", `${relativePath}: declare a task id`);
  for (const key of ["title", "status"]) {
    if (typeof fields[key] !== "string" || fields[key].trim() === "") refuse("records-card-malformed", `${relativePath}: ${key} must be a non-empty string`);
  }
  return Object.freeze({ id, relativePath, blobId: entry.oid, fields: immutable(fields), content,
    // Buffer cannot be frozen. Retain it privately and give each caller a copy.
    get bytes() { return Buffer.from(retained); } });
}

/** Read all tracked task cards and the portable association from one tree.
 * Discovery uses T-347 product-only mode: no working association is opened.
 * List views measure product HEAD unless a separately labelled base is supplied.
 * @param {{productRoot?: string, recordsRevision: string, productRevision?: string}} options
 */
export function readCommittedBoard(options) {
  const { productRoot, recordsRevision, productRevision } = { ...options };
  const workspace = resolveWorkspace({ ...(productRoot === undefined ? {} : { productRoot }), mode: "product-only" });
  let recordsRoot;
  try { recordsRoot = realpathSync(workspace.recordsRoot); }
  catch (err) { refuse("records-repository-unavailable", `${workspace.recordsRoot}: ${message(err)}`); }
  const top = git(recordsRoot, ["rev-parse", "--show-toplevel"], "records-repository-unavailable").toString("utf8").replace(/\n$/, "");
  if (realpathSync(top) !== recordsRoot) refuse("records-root-nested", `${recordsRoot} is not repository top level ${top}`);
  if (workspace.layout === "split" && recordsRoot === workspace.productRoot) refuse("records-layout-mismatch", "split binding resolves to the product repository");
  const recordsCommit = exactCommit(recordsRoot, recordsRevision);
  const productIdentity = measureProductIdentity(workspace.productRoot, { commit: productRevision ?? "HEAD" });
  const objectFormat = git(recordsRoot, ["rev-parse", "--show-object-format"], "records-object-format-unavailable").toString("utf8").trim();
  if (!["sha1", "sha256"].includes(objectFormat)) refuse("records-object-format-unsupported", objectFormat);
  const tree = entries(recordsRoot, recordsCommit);
  const associationEntry = tree.find((e) => e.relativePath === WORKSPACE_ASSOCIATION_REL_PATH);
  if (!associationEntry) refuse("records-association-missing", `${WORKSPACE_ASSOCIATION_REL_PATH} at ${recordsCommit}`);
  let association;
  try { association = JSON.parse(utf8(blob(recordsRoot, associationEntry), WORKSPACE_ASSOCIATION_REL_PATH)); }
  catch (err) {
    if (err instanceof RecordReaderFinding) throw err;
    refuse("records-association-malformed", `${WORKSPACE_ASSOCIATION_REL_PATH}: ${message(err)}`);
  }
  const projectId = workspace.association.projectId ?? association?.projectId;
  const validation = validateAssociation(association, productIdentity, { projectId, source: `${recordsCommit}:${WORKSPACE_ASSOCIATION_REL_PATH}` });
  for (const parent of ["docs", "docs/tasks"]) {
    const entry = tree.find((e) => e.relativePath === parent);
    if (entry && entry.type !== "tree") refuse("records-entry-not-regular", `${parent}: expected a Git tree, got ${entry.mode} ${entry.type}`);
  }
  const tasks = tree.filter((e) => isTaskCardPath(e.relativePath)).map((e) => card(recordsRoot, e));
  const ids = new Map();
  for (const task of tasks) {
    if (ids.has(task.id)) refuse("records-task-duplicate", `${task.id}: ${ids.get(task.id)} and ${task.relativePath}`);
    ids.set(task.id, task.relativePath);
  }
  for (const task of tasks) {
    const pathId = /^docs\/tasks\/(T-\d+(?:-s\d+)?)(?:-|\.md$)/.exec(task.relativePath)?.[1];
    if (pathId !== task.id) refuse("records-task-id-mismatch", `${task.relativePath} declares ${task.id}, expected ${pathId}`);
  }
  const receipt = immutable({ projectId, repositoryRole: "records", recordsRoot, recordsCommit, objectFormat,
    productRoot: workspace.productRoot, productBase: productIdentity.selectedCommit, productObjectFormat: productIdentity.objectFormat,
    localBinding: workspace.association, association: { relativePath: WORKSPACE_ASSOCIATION_REL_PATH, blobId: associationEntry.oid, values: association, validation },
    authority: "snapshot data only; no dispatch approval or write permission" });
  return Object.freeze({ receipt, tasks: Object.freeze(tasks) });
}

/** Paired snapshot: an explicit product revision is mandatory.
 * @param {{productRoot?: string, recordsRevision: string, productRevision: string, taskId?: string, cardPath?: string}} options
 */
export function captureTaskSnapshot(options) {
  const captured = { ...options };
  if (typeof captured.productRevision !== "string" || !captured.productRevision) refuse("records-product-base-required", "paired snapshots require an explicit product starting revision");
  if ((captured.taskId === undefined) === (captured.cardPath === undefined)) refuse("records-task-selector-invalid", "select exactly one taskId or cardPath");
  if (captured.taskId !== undefined && !/^T-\d+(?:-s\d+)?$/.test(captured.taskId)) refuse("records-task-id-invalid", String(captured.taskId));
  if (captured.cardPath !== undefined) safeCardPath(captured.cardPath);
  const board = readCommittedBoard(captured);
  const selected = board.tasks.find((t) => captured.cardPath === undefined ? t.id === captured.taskId : t.relativePath === captured.cardPath);
  if (!selected) refuse("records-task-missing", `${captured.taskId ?? captured.cardPath} at ${board.receipt.recordsCommit}`);
  return Object.freeze({ receipt: immutable({ ...board.receipt, cardPath: selected.relativePath, cardBlobId: selected.blobId }),
    task: selected, content: selected.content, get bytes() { return selected.bytes; } });
}

/** Selected contract only; implementation notes, verdicts and their history stay private.
 * @param {{content: string}} snapshot
 */
export function activeTaskContract(snapshot) {
  return snapshot.content.split(/(?=^## )/m).filter((section) => !/^## (?:Implementation notes|Verdicts|History|Reports|Archived grant history)[ \t]*(?:\r?\n|$)/.test(section)).join("").trimEnd();
}
