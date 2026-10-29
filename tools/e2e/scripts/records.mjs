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

/** Shared committed-byte capture. Resolves each repository's revision once;
 * all later reads use the frozen tree and blob ids, never a working file.
 * Buffers stay private and every exposed byte view is a detached copy.
 * @param {{productRoot?: string, recordsRevision: string, productRevision?: string}} options
 * @param {boolean} strict
 * @param {((trees: {product: Entry[], records: Entry[]}) => void)} [onTrees]
 */
function captureInputs(options, strict, onTrees) {
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
  const tasks = strict ? tree.filter((e) => isTaskCardPath(e.relativePath)).map((e) => card(recordsRoot, e)) : [];
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
  const productRootCanonical = workspace.productRoot;
  const roots = { product: productRootCanonical, records: recordsRoot };
  const commits = { product: /** @type {string} */ (productIdentity.selectedCommit), records: recordsCommit };
  const trees = { product: entries(productRootCanonical, commits.product), records: tree };
  onTrees?.(trees);
  /** @param {string} root */
  function physicalFacts(root) {
    let common;
    try { common = realpathSync(path.resolve(root, git(root, ["rev-parse", "--git-common-dir"], "records-physical-facts-unavailable").toString("utf8").replace(/\n$/, ""))); }
    catch (err) { refuse("records-physical-facts-unavailable", `${root}: ${message(err)}`); }
    return { filesystemRoot: root, gitCommonDirectory: common };
  }
  const repositories = immutable({ product: physicalFacts(roots.product), records: physicalFacts(roots.records) });
  /** @param {"product"|"records"} role @param {string} relativePath */
  function read(role, relativePath) {
    if (role !== "product" && role !== "records") refuse("records-input-role-invalid", String(role));
    const entry = trees[role].find((e) => e.relativePath === relativePath);
    if (!entry) refuse("records-input-missing", `${role}:${relativePath} at ${commits[role]}`);
    const retained = blob(roots[role], entry);
    return Object.freeze({ role, repository: roots[role], commit: commits[role], path: relativePath,
      blobId: entry.oid, mode: entry.mode, content: utf8(retained, `${role}:${relativePath}`),
      get bytes() { return Buffer.from(retained); } });
  }
  /** Exact selected entries, with binary length framing rather than splitting
   * document lines. A bounded chunk supports the retained ~20MB corpus without
   * the old per-call 16MB ceiling becoming a whole-batch truncation.
   * @param {"product"|"records"} role @param {readonly string[]} relativePaths */
  function readMany(role, relativePaths) {
    if (role !== "product" && role !== "records") refuse("records-input-role-invalid", String(role));
    if (!Array.isArray(relativePaths) || relativePaths.some((file) => typeof file !== "string")) refuse("records-input-paths-invalid", "name an explicit path array");
    const selected = relativePaths.map((relativePath) => {
      const entry = trees[role].find((e) => e.relativePath === relativePath);
      if (!entry) refuse("records-input-missing", `${role}:${relativePath} at ${commits[role]}`);
      if (entry.type !== "blob" || !["100644", "100755"].includes(entry.mode)) refuse("records-entry-not-regular", `${relativePath}: mode ${entry.mode}, type ${entry.type}`);
      return entry;
    });
    const result = [];
    for (let start = 0; start < selected.length; start += 128) {
      const chunk = selected.slice(start, start + 128);
      let batch;
      try {
        batch = execFileSync("git", ["--no-replace-objects", "-C", roots[role], "cat-file", "--batch"], {
          input: chunk.map((entry) => `${entry.oid}\n`).join(""), stdio: ["pipe", "pipe", "pipe"], maxBuffer: 64 * 1024 * 1024,
          env: { ...process.env, GIT_NO_LAZY_FETCH: "1", GIT_OPTIONAL_LOCKS: "0" },
        });
      } catch { refuse("records-blob-unavailable", `${role}: selected batch unavailable`); }
      let offset = 0;
      for (const entry of chunk) {
        const newline = batch.indexOf(10, offset);
        if (newline < offset) refuse("records-batch-invalid", entry.relativePath);
        if (batch.subarray(offset, newline).some((byte) => byte > 127)) refuse("records-batch-invalid", entry.relativePath);
        const header = batch.subarray(offset, newline).toString("ascii"), parsed = /^([0-9a-f]{40}|[0-9a-f]{64}) blob ([0-9]+)$/.exec(header);
        if (!parsed || parsed[1] !== entry.oid || !Number.isSafeInteger(Number(parsed[2]))) refuse("records-batch-invalid", entry.relativePath);
        const size = Number(parsed[2]), beginning = newline + 1, end = beginning + size;
        if (end >= batch.length || batch[end] !== 10) refuse("records-batch-invalid", entry.relativePath);
        const retained = Buffer.from(batch.subarray(beginning, end)); offset = end + 1;
        const content = utf8(retained, `${role}:${entry.relativePath}`);
        result.push(Object.freeze({ role, repository: roots[role], commit: commits[role], path: entry.relativePath,
          blobId: entry.oid, mode: entry.mode, content, get bytes() { return Buffer.from(retained); } }));
      }
      if (offset !== batch.length) refuse("records-batch-invalid", "unexpected trailing batch bytes");
    }
    return Object.freeze(result);
  }
  return Object.freeze({ receipt: immutable({ ...receipt, repositories }), tasks: Object.freeze(tasks),
    repositories, read, readMany,
    /** @param {"product"|"records"} role */
    paths(role) {
      if (role !== "product" && role !== "records") refuse("records-input-role-invalid", String(role));
      return Object.freeze(trees[role].map((e) => e.relativePath));
    } });
}

/** Strict legacy capture: parsing/refusal timing and receipts stay unchanged.
 * @param {{productRoot?: string, recordsRevision: string, productRevision?: string}} options
 */
export function captureCommittedInputs(options) { return captureInputs(options, true); }

/** Additive raw capture for materialization, never a strict-board substitute.
 * Card bytes (including malformed historical cards) are not parsed here.
 * Reads still use canonical identity, association, entry and blob checks.
 * This stage may run Git; a pure consumer must materialize its inputs first.
 * @param {{productRoot: string, recordsRevision: string, productRevision: string}} options
 */
export function captureRawCommittedInputs(options) {
  if (typeof options?.productRoot !== "string" || !options.productRoot ||
      typeof options.productRevision !== "string" || !options.productRevision) {
    refuse("records-explicit-inputs-required", "raw capture requires productRoot and productRevision");
  }
  /** @type {{product: Entry[], records: Entry[]}} */
  let retainedEntries;
  const captured = captureInputs(options, false, (trees) => { retainedEntries = trees; });
  return Object.freeze({
    /** Detached tree metadata includes directories and unsupported entries, never lazy bytes.
     * @param {"product"|"records"} role */
    entries(role) {
      if (role !== "product" && role !== "records") refuse("records-input-role-invalid", String(role));
      return immutable(retainedEntries[role]);
    }, receipt: captured.receipt, repositories: captured.repositories,
    read: captured.read, readMany: captured.readMany, paths: captured.paths });
}

/** Read all tracked cards and the committed association without parser build.
 * @param {{productRoot?: string, recordsRevision: string, productRevision?: string}} options
 */
export function readCommittedBoard(options) {
  const capture = captureCommittedInputs(options);
  return Object.freeze({ receipt: capture.receipt, tasks: capture.tasks });
}

/** Paired snapshot: an explicit product revision is mandatory.
 * @param {{productRoot?: string, recordsRevision: string, productRevision: string, taskId?: string, cardPath?: string}} options
 * @param {ReturnType<typeof captureCommittedInputs>|undefined} [capture]
 */
export function captureTaskSnapshot(options, capture = undefined) {
  const captured = { ...options };
  if (typeof captured.productRevision !== "string" || !captured.productRevision) refuse("records-product-base-required", "paired snapshots require an explicit product starting revision");
  if ((captured.taskId === undefined) === (captured.cardPath === undefined)) refuse("records-task-selector-invalid", "select exactly one taskId or cardPath");
  if (captured.taskId !== undefined && !/^T-\d+(?:-s\d+)?$/.test(captured.taskId)) refuse("records-task-id-invalid", String(captured.taskId));
  if (captured.cardPath !== undefined) safeCardPath(captured.cardPath);
  const board = capture ?? readCommittedBoard(captured);
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
