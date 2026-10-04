/** Selected planning context (T-350), never an executor brief or admission.
 * The generated public parser is loaded only when a validated capture is requested.
 */
import { readFileSync } from "node:fs";
import { captureCommittedInputs, captureTaskSnapshot, RecordReaderFinding } from "./records.mjs";
import { WORKSPACE_ASSOCIATION_REL_PATH } from "./workspace.mjs";

/** @typedef {{kind: "whole"}|{kind: "section", depth: number, heading: string}} ContextSelector */
/** @typedef {{role: "product"|"records", path: string, selector: ContextSelector}} ContextInput */
/** @typedef {{version: 1, legacyTokenMap: Record<string, ("product"|"records")[]>, inputs: ContextInput[]}} ContextRequest */

/** @param {string} code @param {string} detail @returns {never} */
function refuse(code, detail) { throw new RecordReaderFinding(code, detail); }
/** @param {any} value @returns {any} */
function freeze(value) {
  if (value && typeof value === "object") { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}
/** @param {unknown} value @param {string[]} keys @param {string} label */
function shape(value, keys, label) {
  if (!value || typeof value !== "object" || Array.isArray(value) ||
      Object.keys(value).sort().join("\0") !== [...keys].sort().join("\0")) refuse("planning-request-invalid", `${label}: expected exactly ${keys.join(", ")}`);
}
/** @param {unknown} value @param {string} label @returns {string} */
function relativePath(value, label) {
  if (typeof value !== "string" || !value || value.trim() !== value || /^[A-Za-z]:|^\//.test(value) ||
      /[\\\u0000-\u001f\u007f-\u009f:]/.test(value) ||
      value.split("/").some((part) => !part || part === "." || part === ".." || [".git", ".supertaskr"].includes(part.toLowerCase()))) {
    refuse("planning-path-invalid", `${label}: ${String(value)}`);
  }
  return value;
}

/** The API and CLI use this same strict, detached selection contract.
 * @param {any} request @returns {Readonly<ContextRequest>}
 */
export function normalizeContextRequest(request) {
  shape(request, ["version", "legacyTokenMap", "inputs"], "request");
  if (request.version !== 1 || !Array.isArray(request.inputs) || !request.legacyTokenMap ||
      typeof request.legacyTokenMap !== "object" || Array.isArray(request.legacyTokenMap)) refuse("planning-request-invalid", "version 1, an ownership object and an inputs array are required");
  const legacyTokenMap = Object.create(null);
  for (const [token, mapping] of Object.entries(request.legacyTokenMap)) {
    relativePath(token, "ownership token");
    const owners = Array.isArray(mapping) ? mapping : [mapping];
    if (owners.length !== 1 || !["product", "records"].includes(owners[0])) refuse("planning-ownership-invalid", `${token}: exactly one product or records owner is required`);
    legacyTokenMap[token] = [...owners];
  }
  const seen = new Set();
  const inputs = request.inputs.map(/** @param {any} input @param {number} index */ (input, index) => {
    shape(input, ["role", "path", "selector"], `input ${index}`);
    if (input.role !== "product" && input.role !== "records") refuse("planning-input-role-invalid", `input ${index}: ${String(input.role)}`);
    const selectedPath = relativePath(input.path, `input ${index}`);
    if (/^docs\/tasks\/(?:.*\/)?T-.*\.md$/.test(selectedPath) || selectedPath === WORKSPACE_ASSOCIATION_REL_PATH) {
      refuse("planning-input-forbidden", `${input.role}:${selectedPath}: task contracts and association identity have dedicated projections`);
    }
    if (input.selector?.kind === "whole") shape(input.selector, ["kind"], `input ${index} selector`);
    else if (input.selector?.kind === "section") {
      shape(input.selector, ["kind", "depth", "heading"], `input ${index} selector`);
      if (!Number.isInteger(input.selector.depth) || input.selector.depth < 1 || input.selector.depth > 6 ||
          typeof input.selector.heading !== "string" || !input.selector.heading || input.selector.heading.trim() !== input.selector.heading ||
          /[\u0000-\u001f\u007f-\u009f]/.test(input.selector.heading)) refuse("planning-selector-invalid", `input ${index}: name an exact plain ATX heading at depth 1..6`);
    } else refuse("planning-selector-invalid", `input ${index}: expected whole or section`);
    const selector = { ...input.selector };
    const key = JSON.stringify([input.role, selectedPath, selector.kind, selector.depth, selector.heading]);
    if (seen.has(key)) refuse("planning-selection-duplicate", `${input.role}:${selectedPath}: ${JSON.stringify(selector)}`);
    seen.add(key);
    return { role: input.role, path: selectedPath, selector };
  });
  return freeze({ version: 1, legacyTokenMap, inputs });
}

/** UTF-8 JSON is selection data; reading it gives it no authority.
 * @param {string} file
 */
export function readContextRequest(file) {
  let request;
  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(readFileSync(file));
    request = JSON.parse(text);
    // Native JSON parsing validates syntax but erases repeated members. Inspect
    // member identities before that loss can conceal conflicting ownership.
    rejectRepeatedMembers(text);
  } catch (err) {
    if (err instanceof RecordReaderFinding) throw err;
    refuse("planning-request-unreadable", `${file}: ${err instanceof Error ? err.message : String(err)}`);
  }
  return normalizeContextRequest(request);
}

/** Structural member scan of already syntax-validated JSON; no input semantics
 * or YAML/component validation lives here. Escaped member names compare decoded.
 * @param {string} text
 */
function rejectRepeatedMembers(text) {
  const tokens = text.match(/"(?:\\[\s\S]|[^"\\])*"|[{}\[\],:]|[^\s{}\[\],:]+/g) ?? [];
  let at = 0;
  function visit() {
    const token = tokens[at++];
    if (token === "{") {
      const names = new Set();
      while (tokens[at] !== "}") {
        const name = JSON.parse(/** @type {string} */ (tokens[at++]));
        if (names.has(name)) refuse("planning-request-duplicate-member", String(name));
        names.add(name); at += 1; visit();
        if (tokens[at] !== ",") break;
        at += 1;
      }
      at += 1;
    } else if (token === "[") {
      while (tokens[at] !== "]") {
        visit();
        if (tokens[at] !== ",") break;
        at += 1;
      }
      at += 1;
    }
  }
  visit();
}

/** Structural ATX headings, with original byte-independent string offsets.
 * Fenced and indented code cannot provide a match or terminate a section.
 * @param {string} content
 */
function headings(content) {
  const result = [];
  let fence = "";
  let fenceLength = 0;
  let offset = 0;
  for (const lineWithEnd of content.match(/[^\n]*\n|[^\n]+$/g) ?? []) {
    const line = lineWithEnd.replace(/\r?\n$/, "");
    const marker = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(line);
    const mark = marker?.[1] ?? "";
    const info = marker?.[2] ?? "";
    if (fence) {
      if (marker && mark[0] === fence && mark.length >= fenceLength && info.trim() === "") fence = "";
    } else if (marker && (mark[0] !== "`" || !info.includes("`"))) {
      fence = mark[0] ?? ""; fenceLength = mark.length;
    } else {
      const atx = /^ {0,3}(#{1,6})(?:[ \t]+(.*)|[ \t]*)$/.exec(line);
      if (atx) result.push({ depth: (atx[1] ?? "").length, heading: (atx[2] ?? "").replace(/[ \t]+#+[ \t]*$/, "").trim(), offset });
    }
    offset += lineWithEnd.length;
  }
  return result;
}
/** @param {string} content @param {any} selector @param {string} label */
function select(content, selector, label) {
  if (selector.kind === "whole") return content;
  const structure = headings(content);
  const matches = structure.filter((h) => h.depth === selector.depth && h.heading === selector.heading);
  const start = matches[0];
  if (!start || matches.length !== 1) refuse(matches.length ? "planning-section-ambiguous" : "planning-section-missing", `${label}: depth ${selector.depth}, heading ${JSON.stringify(selector.heading)}`);
  const end = structure.find((h) => h.offset > start.offset && h.depth <= start.depth)?.offset ?? content.length;
  return content.slice(start.offset, end);
}

export const PLANNING_CONTEXT_LIMITS = Object.freeze([
  "Selected planning context only; input selection is not proof of complete execution-rule coverage.",
  "No dispatch approval, writer reservation, execution admission or verification is established by this read.",
  "Only requested governing sections and product method inputs are covered; no recursive discovery is performed.",
  "Requires the generated lib/parser/dist/pure.js public entry; this view never installs or builds it.",
  "Split orchestration and installed/package consumers remain unresolved; this route performs local reads only.",
]);

/** Freeze two independent revisions and retain every complete selected blob.
 * @param {{productRoot?: string, recordsRevision: string, productRevision: string, taskId: string, request: any}} options
 */
export async function capturePlanningContext(options) {
  const captured = { ...options, request: normalizeContextRequest(options.request) };
  if (typeof captured.productRevision !== "string" || !captured.productRevision) refuse("records-product-base-required", "name an explicit product starting revision");
  let parser;
  try { parser = await import("../../../lib/parser/dist/pure.js"); }
  catch (err) { refuse("planning-parser-unavailable", `lib/parser/dist/pure.js public entry must already be built: ${err instanceof Error ? err.message : String(err)}`); }
  const capture = captureCommittedInputs(captured);
  const snapshot = captureTaskSnapshot(captured, capture);
  const parsedTask = parser.parseTaskFile(snapshot.content, snapshot.task.relativePath);
  if (!parsedTask.task || parsedTask.issues.length) refuse("planning-task-invalid", parsedTask.issues.map((issue) => issue.message).join("; "));
  const task = parsedTask.task;
  const registryPaths = capture.paths("records").filter((file) => parser.isComponentFilePath(file));
  const registry = registryPaths.map((file) => capture.read("records", file));
  const parsed = parser.parseComponentsFromFiles(registry.map((input) => ({ path: input.path, content: input.content })));
  if (parsed.issues.length) refuse("planning-registry-invalid", parsed.issues.map((issue) => issue.message).join("; "));
  const ownership = new Map(Object.entries(captured.request.legacyTokenMap));
  const fence = parser.expandQualifiedFence(task, parsed.components, { repositories: capture.repositories,
    legacyOwnership: ownership, ownFile: snapshot.task.relativePath,
    knownPaths: [...capture.paths("product"), ...capture.paths("records")] });
  if (!fence.usable) refuse("planning-fence-unusable", fence.issues.map((issue) => `${issue.code}: ${issue.message}`).join("; "));
  const association = capture.read("records", WORKSPACE_ASSOCIATION_REL_PATH);
  const taskInput = capture.read("records", snapshot.task.relativePath);
  const selected = captured.request.inputs.map((input) => {
    const retained = capture.read(input.role, input.path);
    return { retained, selector: input.selector, text: select(retained.content, input.selector, `${input.role}:${input.path}`) };
  });
  const retained = [association, taskInput, ...registry, ...selected.map((input) => input.retained)];
  const selectors = [{ kind: "association-identity" }, { kind: "active-contract" },
    ...registry.map(() => ({ kind: "component-registry" })), ...selected.map((input) => input.selector)];
  const receipts = retained.map((input, index) => ({ index, role: input.role, repository: input.repository,
    commit: input.commit, path: input.path, blobId: input.blobId, mode: input.mode, selector: selectors[index] }));
  const involved = new Set(fence.paths.map((entry) => entry.component).filter(Boolean));
  const body = snapshot.content.replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, "");
  const privateStart = headings(body).find((h) => h.depth === 2 && /^(?:Implementation notes|Verdicts|History|Reports|Archived grant history)$/i.test(h.heading))?.offset ?? body.length;
  const { sections, extra, ...fields } = task;
  return Object.freeze({ view: "Selected planning context", limits: PLANNING_CONTEXT_LIMITS,
    contract: freeze({ fields, text: body.slice(0, privateStart).trim() }), fence,
    components: freeze(parsed.components.filter((component) => involved.has(component.id)).map(({ extra, ...facts }) => facts)),
    context: freeze(selected.map((input) => ({ role: input.retained.role, path: input.retained.path, selector: input.selector, text: input.text }))),
    receipt: freeze({ ...capture.receipt, selection: captured.request, inputs: receipts }),
    /** Complete retained bytes, including private task history, never serialized. Each access is detached.
     * @param {number} index */
    inputBytes(index) {
      const input = retained[index];
      if (!Number.isInteger(index) || index < 0 || !input) refuse("planning-input-index-invalid", String(index));
      return input.bytes;
    } });
}
