/** Frozen private record candidate evaluation (T-350-s1).
 * Capture is the only I/O phase. Evaluation returns data, never save/dispatch authority.
 * This additive entry loads the canonical pure parser; strict records imports do not.
 */
import { createHash } from "node:crypto";
import { parseProjectFromFiles } from "../../../lib/parser/dist/pure.js";
import {ordinaryRecordTextPath,GENERIC_RECORD_PROFILE,normalizeRecordProfile} from "./records-profile.mjs";
export {ordinaryRecordTextPath,GENERIC_RECORD_PROFILE,normalizeRecordProfile} from "./records-profile.mjs";
import { captureRawCommittedInputs } from "./records.mjs";
import {RecordReaderFinding} from "./records-finding.mjs";
import { INDEXED_DOCS, INDEX_DOC, INDEX_RULING, CONVENTIONS_DOC, conventionsChapters,
  docSections, indexWhere, renderDocsIndexFromSource, ruledIndexedDocsFromText } from "./docs-scan.mjs";

/** Explicit input classification. CAPABILITIES remains product-owned, per ADR-024. */
export const RECORD_INDEX_INPUTS = Object.freeze(INDEXED_DOCS.map((relativePath) => Object.freeze({
  role: /** @type {Role} */ (relativePath === "docs/CAPABILITIES.md" ? "product" : "records"), path: relativePath,
})));
/** @typedef {"product"|"records"} Role */
/** @typedef {{role: Role, path: string, mode: string, type: string, blobId: string, content: string, bytes: Buffer}} Input */
/** @typedef {{operation: "add"|"edit"|"delete", path: string, type?: string, mode?: string, bytes?: Uint8Array}} Overlay */
/** @typedef {Record<string, any> & {kind: string, message: string}} Diagnostic */
/** @typedef {{family: any, members: any[]}} CauseGroup */
/** @typedef {{identity: any, diagnostic: Diagnostic, group?: CauseGroup}} Fact */
/** @type {WeakMap<object, {receipt: any, paths: Record<Role, readonly string[]>, inputs: Map<string, Input>, identity: any, profile: any}>} */
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
function safePath(relativePath, role = "records") {
  if (typeof relativePath !== "string" || relativePath.startsWith("/") || (role === "records" && !relativePath.startsWith("docs/")) ||
      /[\\\x00-\x1f\x7f]/.test(relativePath) || relativePath.split("/").some((p) => !p || [".", "..", ".git", ".supertaskr"].includes(p))) {
    refuse("records-candidate-path-unsafe", String(relativePath));
  }
  return relativePath;
}
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
/** @param {Map<string, Input>} inputs @param {readonly string[]} paths @param {any} profile */
function render(inputs, paths, profile) {
  if (profile.kind === "generic") {
    const lines = ["# Index", "", "<!-- GENERATED — supertaskr records --stdio checks and saves these exact heading/section bytes. -->", ""];
    for (const file of profile.indexInputs) {
      const text = read(inputs, "records", file), heading = /^#\s+(\S[^\r\n]*)/m.exec(text)?.[1];
      if (!heading) refuse("records-index-heading-missing", file);
      lines.push(`- **${heading.trim()}** (\`${file}\`) — **Open it at:** ${indexWhere(docSections(text))}`);
    }
    return `${lines.join("\n")}\n`;
  }
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
 *   requiredInputs?: readonly {role: Role, path: string}[], profile?: any}} options
 */
export function captureRecordCandidateInputs(options) {
  const profile = normalizeRecordProfile(options.profile);
  const captured = captureRawCommittedInputs(options);
  const paths = { product: captured.paths("product"), records: captured.paths("records") };
  const entries = { product: captured.entries("product"), records: captured.entries("records") };
  // An absent namespace is an explicit empty collection; a non-tree namespace
  // is unavailable context, never an empty board/registry/chapter collection.
  for (const parent of ["docs/tasks", "docs/architecture", "docs/architecture/components", "docs/conventions", "docs/rooms", "docs/decisions", "docs/plans", "docs/reviews", "docs/checkpoints", "docs/design", "docs/guide", "docs/reference", "docs/research", "docs/business", "docs/benches"]) {
    const entry = entries.records.find((e) => e.relativePath === parent);
    if (entry && entry.type !== "tree") refuse("records-entry-not-regular", `${parent}: expected a Git tree, got ${entry.mode} ${entry.type}`);
  }
  /** @type {Map<string, Input>} */
  const inputs = new Map();
  /** @type {Map<Role, Set<string>>} */
  const pending = new Map([["product", new Set()], ["records", new Set()]]);
  /** @param {Role} role @param {string} relativePath */
  function retain(role, relativePath) {
    if (role !== "product" && role !== "records") refuse("records-input-role-invalid", String(role));
    safePath(relativePath, role);
    if (!inputs.has(key(role, relativePath))) pending.get(role)?.add(relativePath);
  }
  function materializePending() {
    for (const [role, paths] of pending) {
      for (const selected of captured.readMany(role, [...paths])) inputs.set(key(role, selected.path), {
        ...selected, content: selected.bytes.toString("utf8"), type: "blob", bytes: selected.bytes });
      paths.clear();
    }
  }
  const required = profile.kind === "generic" ? [...new Set([...profile.indexInputs, ...Object.keys(profile.budgets)])].map((file) => ({ role: /** @type {Role} */ ("records"), path: file }))
    : [...RECORD_INDEX_INPUTS, { role: /** @type {Role} */ ("records"), path: INDEX_RULING.file }];
  for (const input of [...required, ...(options.requiredInputs ?? [])]) retain(input.role, input.path);
  if (paths.records.includes(INDEX_DOC)) retain("records", INDEX_DOC);
  for (const relativePath of paths.records) {
    if (ordinaryRecordTextPath(relativePath)) retain("records", relativePath);
  }
  materializePending();
  // Every pointer is required in the selected records tree. No product/chapter fallback.
  for (const chapter of conventionsChapters(read(inputs, "records", CONVENTIONS_DOC))) {
    if (!inputs.has(key("records", chapter))) retain("records", chapter);
  }
  materializePending();
  const manifest = [...inputs.values()].map((i) => ({ role: i.role, path: i.path, mode: i.mode, type: i.type,
    blobId: i.blobId, sha256: digest(i.bytes) })).sort(compareInputs);
  const identity = freeze({ receipt: captured.receipt, paths, entries, inputs: manifest, ...(options.profile === undefined ? {} : { profile }) });
  const handle = Object.freeze({ receipt: captured.receipt, identity, digest: digest(stable(identity)) });
  materialized.set(handle, { receipt: captured.receipt, paths, inputs, identity, profile });
  return handle;
}

/** Detached, eagerly retained inputs for supplemental consumers. No lazy Git
 * reader or mutable baseline map escapes the opaque evaluator handle.
 * @param {ReturnType<typeof captureRecordCandidateInputs>} captured */
export function recordCandidateProjection(captured) {
  const baseline = materialized.get(captured);
  if (!baseline) refuse("records-candidate-not-materialized", "capture the exact baseline before requesting supplemental data");
  return Object.freeze({ receipt: captured.receipt, paths: baseline.paths, profile: baseline.profile,
    inputs: Object.freeze([...baseline.inputs.values()].map((input) => Object.freeze({
      role: input.role, path: input.path, mode: input.mode, type: input.type, blobId: input.blobId,
      content: input.content, get bytes() { return Buffer.from(input.bytes); },
    }))) });
}

/** Canonical display is kept verbatim. Comparison facts describe typed causes:
 * complete duplicate/alias participant multisets and actual edges in a reported
 * SCC. Parser ordering, first anchors and feature line shifts are not new debt.
 * All other canonical issues retain their full identity and multiplicity.
 * @param {Map<string, Input>} inputs
 * @returns {{diagnostics: Diagnostic[], facts: Fact[]}}
 */
function diagnostics(inputs) {
  const files = [...inputs.values()].filter((i) => i.role === "records").map((i) => ({ path: i.path, content: i.content }));
  const model = parseProjectFromFiles(files);
  /** @type {Diagnostic[]} */
  const canonical = model.issues.map((issue) => {
    const structural = ["missing-frontmatter", "yaml-error", "not-a-mapping"].includes(issue.kind);
    const input = "file" in issue ? inputs.get(key("records", issue.file)) : undefined;
    return structural && input ? { ...issue, inputSha256: digest(input.bytes) } : issue;
  });
  /** @param {any} record @param {string} space */
  function participant(record, space) {
    // Features have no individual file identity. Preserve the complete parsed
    // declaration and its multiplicity, while letting an unchanged line move.
    return space === "feature" ? { id: record.id, file: record.file, name: record.name, description: record.description }
      : { id: record.id, file: record.file };
  }
  const spaces = { task: model.tasks, component: model.components ?? [], feature: model.features };
  /** @type {Map<Diagnostic, {issues: Diagnostic[], facts: Fact[]}>} */
  const units = new Map();
  /** @type {Fact[]} */
  const facts = [];
  for (const issue of canonical) {
    if (units.has(issue)) continue;
    let issues = [issue];
    /** @type {Fact[]} */
    let causes = [{ identity: issue, diagnostic: issue }];
    if (["duplicate-id", "aliased-id"].includes(issue.kind) && issue.space in spaces) {
      const space = /** @type {keyof typeof spaces} */ (issue.space);
      const duplicate = issue.kind === "duplicate-id";
      const members = spaces[space].filter((r) => duplicate ? r.id === issue.id : issue.ids.includes(r.id));
      const related = duplicate ? canonical.filter((i) => i.kind === issue.kind && i.space === space && i.id === issue.id) : [issue];
      // These are the actual typed producer shapes. Unknown future shapes stay
      // exact rather than being silently folded into a known cause.
      if (members.length >= 2 && (!duplicate || related.length === members.length - 1)) {
        issues = related; causes = [];
        const { message: _message, files: _files, ids: _ids, ...shape } = issue;
        const group = { family: shape, members: members.map((r) => participant(r, space)) };
        for (let i = 0; i < members.length; i++) {
          causes.push({ identity: { cause: "ambiguous-participant", ...shape, participant: group.members[i] }, group,
            diagnostic: duplicate ? related[Math.max(0, i - 1)] ?? issue : issue });
        }
      }
    } else if (issue.kind === "dependency-cycle") {
      const ids = /** @type {string[]} */ (issue.ids);
      const members = ids.map((id, i) => model.tasks.find((t) => t.id === id && t.file === issue.files[i]));
      if (members.length > 0 && members.every(Boolean)) {
        const { message: _message, files: _files, ids: _ids, ...shape } = issue;
        causes = [];
        const group = { family: shape, members: members.map((r) => participant(r, "task")) };
        for (const source of members) {
          if (!source) continue;
          for (const id of source.blockedBy) {
          const target = members.find((t) => t?.id === id);
          if (target) causes.push({ identity: { cause: "cyclic-reference", ...shape,
            source: participant(source, "task"), target: participant(target, "task") }, group, diagnostic: issue });
          }
        }
      }
    }
    const unit = { issues, facts: causes };
    for (const related of issues) units.set(related, unit);
    facts.push(...causes);
  }
  /** @type {Diagnostic[]} */
  const out = [...canonical];
  /** @type {Map<string, Diagnostic[]>} */
  const byFile = new Map();
  for (const issue of canonical) for (const file of new Set(issue.files ?? (issue.file ? [issue.file] : []))) {
    if (!byFile.has(file)) byFile.set(file, []);
    byFile.get(file)?.push(issue);
  }
  /** @param {{id?: string, file: string}} target */
  function debt(target) {
    return (byFile.get(target.file) ?? []).filter((issue) => {
      if (target.file === "docs/ROADMAP.md") {
        if (issue.id !== undefined) return issue.id === target.id;
        if (issue.ids !== undefined) return issue.ids.includes(target.id);
      }
      return true;
    });
  }
  /** @param {string} file @param {string} field @param {string} id @param {any[]} space @param {string} spaceName */
  function reference(file, field, id, space, spaceName) {
    const targets = space.filter((t) => t.id === id);
    const unavailable = field === "feature" && space.length === 0
      ? canonical.filter((i) => i.file === "docs/ROADMAP.md" && ["roadmap-error", "io-error"].includes(i.kind)) : [];
    /** @type {Diagnostic|undefined} */
    let firstDebt;
    for (const context of unavailable) {
      const diagnostic = { kind: "unavailable-reference-context", file, field, id, context: [context],
        message: `${file}: ${field} names '${id}' but its canonical reference space is unavailable` };
      out.push(diagnostic); firstDebt ??= diagnostic; facts.push({ identity: diagnostic, diagnostic });
    }
    // Display each real canonical issue once within this reference occurrence.
    // Feature declarations may share file/id; their individual payload and
    // occurrence identities remain in comparison facts, never coalesced there.
    /** @type {Map<Diagnostic, {diagnostic: Diagnostic, targets: Set<string>}>} */
    const display = new Map();
    /** @type {Map<string, {grouped: {unit: any, diagnostic: Diagnostic}[]}>} */
    const contexts = new Map();
    for (const target of targets) {
      const targetIdentity = { file: target.file, id: target.id };
      const tuple = stable(targetIdentity);
      let context = contexts.get(tuple);
      if (!context) {
        const retained = debt(target);
        /** @type {Map<Diagnostic, Diagnostic>} */
        const reported = new Map();
        for (const issue of retained) {
          let entry = display.get(issue);
          if (!entry) {
            const diagnostic = { kind: "unusable-reference", file, field, id, targets: [],
              message: `${file}: ${field} names '${id}' whose retained target has canonical validation debt` };
            entry = { diagnostic, targets: new Set() }; display.set(issue, entry);
            out.push(diagnostic); firstDebt ??= diagnostic;
          }
          if (!entry.targets.has(tuple)) {
            entry.targets.add(tuple); entry.diagnostic.targets.push({ ...targetIdentity, issues: [issue] });
          }
          reported.set(issue, entry.diagnostic);
        }
        context = { grouped: [] };
        for (const unit of new Set(retained.map((i) => units.get(i)))) {
          const first = unit?.issues.find((i) => reported.has(i));
          const fallback = first && reported.get(first);
          if (!unit || !fallback) continue;
          if (unit.facts[0]?.group) context.grouped.push({ unit, diagnostic: fallback });
          else for (const fact of unit.facts) facts.push({ identity: { cause: "unusable-reference", file, field, id,
            target: targetIdentity, issue: fact.identity }, diagnostic: reported.get(fact.diagnostic) ?? fallback });
        }
        contexts.set(tuple, context);
      }
      // Keep every typed grouped participant/occurrence, including repeated
      // feature payloads, without repeating its shared canonical display list.
      for (const { unit, diagnostic } of context.grouped) {
        const group = unit.facts[0].group;
        facts.push({ identity: { cause: "unusable-reference", file, field, id,
          target: participant(target, spaceName), issue: group.family }, group, diagnostic });
      }
    }
    // Count reference occurrences independently: shrinking the target/context
    // debt cannot pay for an added dependency occurrence.
    if (firstDebt) facts.push({ identity: { cause: "unusable-reference-occurrence", file, field, id }, diagnostic: firstDebt });
  }
  for (const task of model.tasks) {
    for (const id of task.blockedBy) reference(task.file, "blocked_by", id, model.tasks, "task");
    if (task.feature !== undefined) reference(task.file, "feature", task.feature, model.features, "feature");
  }
  for (const component of model.components ?? []) {
    for (const id of component.dependsOn) reference(component.file, "depends_on", id, model.components ?? [], "component");
  }
  return { diagnostics: out, facts };
}
/** Copy rejected metadata too: result freezing must never freeze caller objects.
 * Valid scalar metadata keeps its exact identity spelling. Unsupported data is
 * represented by detached JSON values; byte arrays retain an exact digest.
 * @param {any} value @returns {any}
 */
function metadata(value) {
  if (value === null || value === undefined || ["string", "boolean", "number"].includes(typeof value)) return value;
  try {
    const encoded = JSON.stringify(value, (_key, item) => {
      if (item instanceof Uint8Array) return { invalidMetadataType: "Uint8Array", sha256: digest(item), byteLength: item.byteLength };
      if (typeof item === "bigint") return { invalidMetadataType: "bigint", value: item.toString() };
      if (["symbol", "function"].includes(typeof item)) return { invalidMetadataType: typeof item };
      return item;
    });
    return encoded === undefined ? { invalidMetadataType: typeof value } : JSON.parse(encoded);
  } catch (err) { refuse("records-overlay-metadata-invalid", message(err)); }
}
/** Multiset subtraction, not counts or broad kind/id comparisons.
 * @param {Fact[]} left @param {Fact[]} right @param {boolean} [requireGroupSupport]
 */
function difference(left, right, requireGroupSupport = true) {
  const counts = new Map();
  /** @type {Map<string, Set<CauseGroup>>} */
  const groups = new Map();
  const indexed = new Set();
  for (const issue of right) {
    const id = stable(issue.identity); counts.set(id, (counts.get(id) ?? 0) + 1);
    if (issue.group && !indexed.has(issue.group)) {
      indexed.add(issue.group);
      for (const member of issue.group.members) {
        const index = stable({ family: issue.group.family, member });
        if (!groups.has(index)) groups.set(index, new Set());
        groups.get(index)?.add(issue.group);
      }
    }
  }
  /** @type {Map<CauseGroup, boolean>} */
  const supported = new Map();
  return left.filter((issue) => {
    if (requireGroupSupport && issue.group) {
      let known = supported.get(issue.group);
      if (known === undefined) {
        const needed = issue.group.members.map(stable);
        known = [...(groups.get(stable({ family: issue.group.family, member: issue.group.members[0] })) ?? [])].some((prior) => {
          const available = new Map();
          for (const member of prior.members) { const id = stable(member); available.set(id, (available.get(id) ?? 0) + 1); }
          // ONE whole prior group must support every current participant.
          return needed.every((id) => { const count = available.get(id) ?? 0; if (!count) return false; available.set(id, count - 1); return true; });
        });
        supported.set(issue.group, known);
      }
      if (!known) return true;
    }
    const id = stable(issue.identity); const count = counts.get(id) ?? 0;
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
  /** @type {Fact[]} */
  let baselineFacts = [];
  /** @type {Diagnostic[]} */
  let candidateDiagnostics = [];
  /** @type {Fact[]} */
  let candidateFacts = [];
  let candidateDiagnosticsComplete = false;
  /** @type {Diagnostic[]} */
  const failures = [];
  /** @type {any[]} */
  const operations = [];
  /** @type {any} */
  let suppliedOverlay = null;
  /** @type {string|undefined} */
  let beforeIndex;
  /** @type {string|undefined} */
  let candidateIndex;
  try {
    const reading = diagnostics(baseline.inputs);
    baselineDiagnostics = reading.diagnostics; baselineFacts = reading.facts;
    beforeIndex = render(baseline.inputs, baseline.paths.records, baseline.profile);
  } catch (err) {
    failures.push({ kind: "baseline-context-unavailable", message: message(err) });
  }
  try {
    if (!Array.isArray(overlay)) refuse("records-overlay-invalid", "overlay must be an explicit array");
    suppliedOverlay = overlay.map((op) => ({ operation: metadata(op?.operation), path: metadata(op?.path),
      type: metadata(op?.type), mode: metadata(op?.mode),
      ...(op?.bytes instanceof Uint8Array ? { sha256: digest(op.bytes) } : { bytes: typeof op?.bytes }) }));
    const seen = new Set();
    for (const operation of overlay) {
      const relativePath = safePath(operation?.path);
      if (seen.has(relativePath)) refuse("records-overlay-duplicate-path", relativePath);
      seen.add(relativePath);
      if (relativePath === INDEX_DOC || relativePath === INDEX_RULING.file ||
          RECORD_INDEX_INPUTS.some((i) => i.role === "product" && i.path === relativePath) ||
          !(baseline.inputs.has(key("records", relativePath)) || ordinaryRecordTextPath(relativePath))) {
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
        try { content = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(bytes); }
        catch (err) { refuse("records-encoding-invalid", `${relativePath}: ${message(err)}`); }
        inputs.set(key("records", relativePath), { role: "records", path: relativePath, mode: /** @type {string} */ (operation.mode), type: "blob", blobId: "", content, bytes });
        paths.add(relativePath);
        operations.push({ operation: operation.operation, path: relativePath, type: operation.type, mode: operation.mode, sha256: digest(bytes) });
      }
    }
    const reading = diagnostics(inputs);
    candidateDiagnostics = reading.diagnostics; candidateFacts = reading.facts;
    candidateDiagnosticsComplete = true;
    candidateIndex = render(inputs, [...paths].sort(), baseline.profile);
  } catch (err) {
    failures.push({ kind: "candidate-input-invalid", code: err instanceof RecordReaderFinding ? err.code : "records-index-invalid", message: message(err) });
  }
  const introduced = new Set(difference(candidateFacts, baselineFacts).map((f) => f.diagnostic));
  const resolved = new Set(candidateDiagnosticsComplete ? difference(baselineFacts, candidateFacts, false).map((f) => f.diagnostic) : []);
  const introducedDiagnostics = candidateDiagnostics.filter((i) => introduced.has(i));
  const resolvedDiagnostics = baselineDiagnostics.filter((i) => resolved.has(i));
  const accepted = failures.length === 0 && introducedDiagnostics.length === 0;
  const identity = freeze({ baseline: captured.digest, overlay: suppliedOverlay, applied: operations,
    candidateInputs: [...inputs.values()].map((i) => ({ role: i.role, path: i.path, type: i.type, mode: i.mode, sha256: digest(i.bytes) }))
      .sort(compareInputs), paths: [...paths].sort() });
  const retainedIndex = accepted && candidateIndex !== beforeIndex ? Buffer.from(/** @type {string} */ (candidateIndex)) : undefined;
  const outputs = accepted ? Object.freeze(retainedIndex === undefined ? [] : [Object.freeze({ role: "records", path: INDEX_DOC, type: "blob", mode: "100644",
    sha256: digest(retainedIndex), content: retainedIndex.toString("utf8"), get bytes() { return Buffer.from(retainedIndex); } })]) : undefined;
  return Object.freeze({ accepted, identity, digest: digest(stable(identity)), baseline: captured.identity,
    baselineDiagnostics: freeze(baselineDiagnostics), candidateDiagnostics: freeze(candidateDiagnostics),
    introducedDiagnostics: freeze(introducedDiagnostics), resolvedDiagnostics: freeze(resolvedDiagnostics), failures: freeze(failures), outputs,
    baselineIndex: beforeIndex === undefined ? undefined : Object.freeze({ path: INDEX_DOC, get bytes() { return Buffer.from(/** @type {string} */ (beforeIndex)); } }),
    derivedIndex: accepted ? Object.freeze({ path: INDEX_DOC, mode: "100644", get bytes() { return Buffer.from(/** @type {string} */ (candidateIndex)); } }) : undefined,
    authority: "candidate data only; no save, write or dispatch authority" });
}
