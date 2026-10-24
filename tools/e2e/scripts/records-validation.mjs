/** Frozen private record candidate evaluation (T-350-s1).
 * Capture is the only I/O phase. Evaluation returns data, never save/dispatch authority.
 * This additive entry loads the canonical pure parser; strict records imports do not.
 */
import { createHash } from "node:crypto";
import { parseProjectFromFiles, isTaskFilePath, isComponentFilePath } from "../../../lib/parser/dist/pure.js";
import { captureRawCommittedInputs, RecordReaderFinding } from "./records.mjs";
import { INDEXED_DOCS, INDEX_DOC, INDEX_RULING, CONVENTIONS_DOC, conventionsChapters,
  renderDocsIndexFromSource, ruledIndexedDocsFromText } from "./docs-scan.mjs";

/** Explicit input classification. CAPABILITIES remains product-owned, per ADR-024. */
export const RECORD_INDEX_INPUTS = Object.freeze(INDEXED_DOCS.map((relativePath) => Object.freeze({
  role: /** @type {Role} */ (relativePath === "docs/CAPABILITIES.md" ? "product" : "records"), path: relativePath,
})));
/** @typedef {"product"|"records"} Role */
/** @typedef {{role: Role, path: string, mode: string, type: string, blobId: string, content: string, bytes: Buffer}} Input */
/** @typedef {{operation: "add"|"edit"|"delete", path: string, type?: string, mode?: string, bytes?: Uint8Array}} Overlay */
/** @typedef {Record<string, any> & {kind: string, message: string}} Diagnostic */
/** @type {WeakMap<object, {receipt: any, paths: Record<Role, readonly string[]>, inputs: Map<string, Input>, identity: any}>} */
const materialized = new WeakMap();
/** @param {string} code @param {string} detail @returns {never} */
function refuse(code, detail) { throw new RecordReaderFinding(code, detail); }
/** @param {unknown} err */
function message(err) { return err instanceof Error ? err.message : String(err); }
/** @param {unknown} value @returns {any} */
function freeze(value) {
  if (value && typeof value === "object") { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}
/** Stable serialization also preserves repeated array participants and occurrences.
 * @param {any} value @returns {string}
 */
function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${stable(value[k])}`).join(",")}}`;
  return JSON.stringify(value);
}
/** @param {string|Uint8Array} value */
function digest(value) { return createHash("sha256").update(value).digest("hex"); }
/** @param {unknown} relativePath @returns {string} */
function safePath(relativePath) {
  if (typeof relativePath !== "string" || !relativePath.startsWith("docs/") ||
      /[\\\x00-\x1f\x7f]/.test(relativePath) || relativePath.split("/").some((p) => !p || p === "." || p === "..")) {
    refuse("records-candidate-path-unsafe", String(relativePath));
  }
  return relativePath;
}
/** @param {string} relativePath */
function chapterPath(relativePath) { return /^docs\/conventions\/[a-z0-9-]+\.md$/.test(relativePath); }
/** @param {Role} role @param {string} relativePath */
function key(role, relativePath) { return `${role}:${relativePath}`; }
/** Locale-independent identity ordering. @param {{role: Role, path: string}} a @param {{role: Role, path: string}} b */
function compareInputs(a, b) {
  const left = key(a.role, a.path), right = key(b.role, b.path);
  return left < right ? -1 : left > right ? 1 : 0;
}
/** @param {Map<string, Input>} inputs @param {Role} role @param {string} relativePath */
function read(inputs, role, relativePath) {
  const input = inputs.get(key(role, relativePath));
  if (!input) refuse("records-input-missing", `${role}:${relativePath} in materialized candidate`);
  return input.content;
}
/** @param {Map<string, Input>} inputs @param {readonly string[]} paths */
function render(inputs, paths) {
  const ruled = ruledIndexedDocsFromText(read(inputs, "records", INDEX_RULING.file));
  if (stable(ruled) !== stable(INDEXED_DOCS.map((p) => p.slice(5, -3)))) refuse("records-index-ruling-mismatch", "captured ruling differs from the indexed set");
  return renderDocsIndexFromSource({
    read(relativePath) {
      const role = RECORD_INDEX_INPUTS.find((i) => i.path === relativePath)?.role ?? "records";
      return read(inputs, role, relativePath);
    },
    paths: () => paths,
  });
}

/** Resolve canonical committed sources and EAGERLY retain all model/index bytes.
 * Extra literal inputs may be selected explicitly; they never replace a required input.
 * The returned handle owns no lazy reader. Deleting both repositories afterwards is safe.
 * @param {{productRoot: string, recordsRevision: string, productRevision: string,
 *   requiredInputs?: readonly {role: Role, path: string}[]}} options
 */
export function captureRecordCandidateInputs(options) {
  const captured = captureRawCommittedInputs(options);
  const paths = { product: captured.paths("product"), records: captured.paths("records") };
  const entries = { product: captured.entries("product"), records: captured.entries("records") };
  // An absent namespace is an explicit empty collection; a non-tree namespace
  // is unavailable context, never an empty board/registry/chapter collection.
  for (const parent of ["docs/tasks", "docs/architecture", "docs/architecture/components", "docs/conventions"]) {
    const entry = entries.records.find((e) => e.relativePath === parent);
    if (entry && entry.type !== "tree") refuse("records-entry-not-regular", `${parent}: expected a Git tree, got ${entry.mode} ${entry.type}`);
  }
  /** @type {Map<string, Input>} */
  const inputs = new Map();
  /** @param {Role} role @param {string} relativePath */
  function retain(role, relativePath) {
    if (role !== "product" && role !== "records") refuse("records-input-role-invalid", String(role));
    safePath(relativePath);
    const selected = captured.read(role, relativePath);
    inputs.set(key(role, relativePath), { ...selected, type: "blob", bytes: selected.bytes });
  }
  for (const input of [...RECORD_INDEX_INPUTS, { role: /** @type {Role} */ ("records"), path: INDEX_RULING.file }, ...(options.requiredInputs ?? [])]) retain(input.role, input.path);
  for (const relativePath of paths.records) {
    if (isTaskFilePath(relativePath) || isComponentFilePath(relativePath) || chapterPath(relativePath)) retain("records", relativePath);
  }
  // Every pointer is required in the selected records tree. No product/chapter fallback.
  for (const chapter of conventionsChapters(read(inputs, "records", CONVENTIONS_DOC))) {
    if (!inputs.has(key("records", chapter))) retain("records", chapter);
  }
  const manifest = [...inputs.values()].map((i) => ({ role: i.role, path: i.path, mode: i.mode, type: i.type,
    blobId: i.blobId, sha256: digest(i.bytes) })).sort(compareInputs);
  const identity = freeze({ receipt: captured.receipt, paths, entries, inputs: manifest });
  const handle = Object.freeze({ receipt: captured.receipt, identity, digest: digest(stable(identity)) });
  materialized.set(handle, { receipt: captured.receipt, paths, inputs, identity });
  return handle;
}

/** Canonical findings plus references to targets the canonical model retains with debt.
 * No grammar is duplicated: all records, references, aliases and issues come from the parser.
 * @param {Map<string, Input>} inputs @returns {Diagnostic[]}
 */
function diagnostics(inputs) {
  const files = [...inputs.values()].filter((i) => i.role === "records").map((i) => ({ path: i.path, content: i.content }));
  const model = parseProjectFromFiles(files);
  /** @type {Diagnostic[]} */
  const canonical = model.issues.map((issue) => {
    // An unparseable file has no field-level value to identify its failure.
    // Retain its exact byte identity so rewriting malformed input cannot be
    // passed off as unchanged historical debt with the same generic message.
    const structural = ["missing-frontmatter", "yaml-error", "not-a-mapping"].includes(issue.kind);
    const input = "file" in issue ? inputs.get(key("records", issue.file)) : undefined;
    return structural && input ? { ...issue, inputSha256: digest(input.bytes) } : issue;
  });
  /** @type {Diagnostic[]} */
  const out = [...canonical];
  /** @param {{id?: string, file: string}} target */
  function debt(target) {
    return canonical.filter((issue) => {
      const participants = issue.files ?? (issue.file ? [issue.file] : []);
      if (!participants.includes(target.file)) return false;
      // A feature's file contains many identities: an issue naming another feature
      // is unrelated. Card/component files each declare a single identity.
      if (target.file === "docs/ROADMAP.md") {
        if (issue.id !== undefined) return issue.id === target.id;
        if (issue.ids !== undefined) return issue.ids.includes(target.id);
      }
      return true;
    });
  }
  /** @param {string} file @param {string} field @param {string} id @param {{id?: string, file: string}[]} space */
  function reference(file, field, id, space) {
    const targets = space.filter((t) => t.id === id);
    const unavailable = field === "feature" && space.length === 0
      ? canonical.filter((i) => i.file === "docs/ROADMAP.md" && ["roadmap-error", "io-error"].includes(i.kind)) : [];
    if (unavailable.length) out.push({ kind: "unavailable-reference-context", file, field, id, context: unavailable,
      message: `${file}: ${field} names '${id}' but its canonical reference space is unavailable` });
    const affected = targets.map((target) => ({ file: target.file, id: target.id, issues: debt(target) })).filter((t) => t.issues.length > 0);
    if (affected.length) out.push({ kind: "unusable-reference", file, field, id, targets: affected,
      message: `${file}: ${field} names '${id}' whose retained target has canonical validation debt` });
  }
  for (const task of model.tasks) {
    for (const id of task.blockedBy) reference(task.file, "blocked_by", id, model.tasks);
    if (task.feature !== undefined) reference(task.file, "feature", task.feature, model.features);
  }
  for (const component of model.components ?? []) {
    for (const id of component.dependsOn) reference(component.file, "depends_on", id, model.components ?? []);
  }
  return out;
}
/** Multiset subtraction, not counts or broad kind/id comparisons.
 * @param {Diagnostic[]} left @param {Diagnostic[]} right
 */
function difference(left, right) {
  const counts = new Map();
  for (const issue of right) { const id = stable(issue); counts.set(id, (counts.get(id) ?? 0) + 1); }
  return left.filter((issue) => {
    const id = stable(issue); const count = counts.get(id) ?? 0;
    if (!count) return true;
    counts.set(id, count - 1); return false;
  });
}

/** Apply one explicit regular-file overlay to an immutable, materialized baseline.
 * Expected invalid candidates return named findings and NO accepted output set.
 * Even a successful result is only detached data: persistence must recheck authority.
 * @param {ReturnType<typeof captureRecordCandidateInputs>} captured
 * @param {readonly Overlay[]} overlay
 */
export function evaluateRecordCandidate(captured, overlay) {
  const baseline = materialized.get(captured);
  if (!baseline) refuse("records-candidate-not-materialized", "use the exported capture entry; baseline/context is unavailable");
  const inputs = new Map(baseline.inputs);
  const paths = new Set(baseline.paths.records);
  /** @type {Diagnostic[]} */
  let baselineDiagnostics = [];
  /** @type {Diagnostic[]} */
  let candidateDiagnostics = [];
  /** @type {Diagnostic[]} */
  const failures = [];
  /** @type {any[]} */
  const operations = [];
  /** @type {string|undefined} */
  let beforeIndex, candidateIndex;
  try {
    baselineDiagnostics = diagnostics(baseline.inputs);
    beforeIndex = render(baseline.inputs, baseline.paths.records);
  } catch (err) {
    failures.push({ kind: "baseline-context-unavailable", message: message(err) });
  }
  try {
    if (!Array.isArray(overlay)) refuse("records-overlay-invalid", "overlay must be an explicit array");
    const seen = new Set();
    for (const operation of overlay) {
      const relativePath = safePath(operation?.path);
      if (seen.has(relativePath)) refuse("records-overlay-duplicate-path", relativePath);
      seen.add(relativePath);
      if (relativePath === INDEX_DOC || relativePath === INDEX_RULING.file ||
          RECORD_INDEX_INPUTS.some((i) => i.role === "product" && i.path === relativePath) ||
          !(baseline.inputs.has(key("records", relativePath)) || isTaskFilePath(relativePath) || isComponentFilePath(relativePath) || chapterPath(relativePath))) {
        refuse("records-overlay-path-unselected", relativePath);
      }
      const present = paths.has(relativePath);
      if (!["add", "edit", "delete"].includes(operation.operation)) refuse("records-overlay-operation-invalid", String(operation.operation));
      if (operation.operation === "add" ? present : !present) refuse("records-overlay-existence-mismatch", `${operation.operation} ${relativePath}`);
      if (operation.operation === "delete") {
        if (operation.bytes !== undefined || operation.mode !== undefined || operation.type !== undefined) refuse("records-overlay-delete-payload", relativePath);
        inputs.delete(key("records", relativePath)); paths.delete(relativePath);
        operations.push({ operation: operation.operation, path: relativePath });
      } else {
        if (operation.type !== "blob" || !["100644", "100755"].includes(operation.mode ?? "")) refuse("records-overlay-not-regular", `${relativePath}: ${operation.mode} ${operation.type}`);
        if (!(operation.bytes instanceof Uint8Array)) refuse("records-overlay-bytes-required", relativePath);
        const bytes = Buffer.from(operation.bytes);
        let content;
        try { content = new TextDecoder("utf-8", { fatal: true }).decode(bytes); }
        catch (err) { refuse("records-encoding-invalid", `${relativePath}: ${message(err)}`); }
        inputs.set(key("records", relativePath), { role: "records", path: relativePath, mode: /** @type {string} */ (operation.mode), type: "blob", blobId: "", content, bytes });
        paths.add(relativePath);
        operations.push({ operation: operation.operation, path: relativePath, type: operation.type, mode: operation.mode, sha256: digest(bytes) });
      }
    }
    candidateDiagnostics = diagnostics(inputs);
    candidateIndex = render(inputs, [...paths].sort());
  } catch (err) {
    failures.push({ kind: "candidate-input-invalid", code: err instanceof RecordReaderFinding ? err.code : "records-index-invalid", message: message(err) });
  }
  const introducedDiagnostics = difference(candidateDiagnostics, baselineDiagnostics);
  const resolvedDiagnostics = difference(baselineDiagnostics, candidateDiagnostics);
  const accepted = failures.length === 0 && introducedDiagnostics.length === 0;
  const suppliedOverlay = Array.isArray(overlay) ? overlay.map((op) => ({ operation: op?.operation, path: op?.path,
    type: op?.type, mode: op?.mode, ...(op?.bytes instanceof Uint8Array ? { sha256: digest(op.bytes) } : { bytes: typeof op?.bytes }) })) : null;
  const identity = freeze({ baseline: captured.digest, overlay: suppliedOverlay, applied: operations,
    candidateInputs: [...inputs.values()].map((i) => ({ role: i.role, path: i.path, type: i.type, mode: i.mode, sha256: digest(i.bytes) }))
      .sort(compareInputs), paths: [...paths].sort() });
  const retainedIndex = accepted && candidateIndex !== beforeIndex ? Buffer.from(/** @type {string} */ (candidateIndex)) : undefined;
  const outputs = accepted ? Object.freeze(retainedIndex === undefined ? [] : [Object.freeze({ role: "records", path: INDEX_DOC, type: "blob", mode: "100644",
    sha256: digest(retainedIndex), content: retainedIndex.toString("utf8"), get bytes() { return Buffer.from(retainedIndex); } })]) : undefined;
  return Object.freeze({ accepted, identity, digest: digest(stable(identity)), baseline: captured.identity,
    baselineDiagnostics: freeze(baselineDiagnostics), candidateDiagnostics: freeze(candidateDiagnostics),
    introducedDiagnostics: freeze(introducedDiagnostics), resolvedDiagnostics: freeze(resolvedDiagnostics), failures: freeze(failures), outputs,
    authority: "candidate data only; no save, write or dispatch authority" });
}
