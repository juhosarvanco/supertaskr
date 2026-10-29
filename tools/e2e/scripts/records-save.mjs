/** Ordinary private-record saving. Exact checked trees and operation recovery
 * share the durable producer; no implementation lane/grant or product job is made.
 */
import { execFileSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { existsSync, lstatSync, readFileSync, realpathSync, statSync } from "node:fs";
import path from "node:path";
import { extractFrontmatter, isTaskFilePath } from "../../../lib/parser/dist/pure.js";
import { blankInertSpans } from "../../../lib/parser/dist/inert-spans.js";
import { MECHANICAL_FIELDS } from "./dispatch-brief.mjs";
import { resolveWorkspace } from "./workspace.mjs";
import { createRecordChecker, checkedRecordWriteSet, loadInstalledRecordTool, verifyInstalledRecordTool } from "./records-check.mjs";
import { ordinaryRecordTextPath } from "./records-validation.mjs";
import { loadProjectSettings } from "./project-settings.mjs";
import { acknowledgeAcceptedOperation, listAcceptedOperations, captureOperationRepository, checkOperationEnvironment, observedAcceptedOperation,
  readAcceptedOperation, replayAcceptedOperation, withAcceptedOperation } from "./durable-operation.mjs";
import { operationContent, operationDigest } from "./operation-record.mjs";
import { PrivateRecordSaveFinding, captureExactRecordPlan as captureSavePlan, prepareExactRecordTree as prepareAcceptedTree,
  materializeExactRecordWrites as materialize, safeRecordWorkingPath as safeWorkingPath, snapshotRecordFile as fileSnapshot,
  assertExactRecordTransformations as transformations, intendedRecordFile as intendedFile, releaseAcceptedRecordWriteLock } from "./record-write.mjs";
export { PrivateRecordSaveFinding } from "./record-write.mjs";

/** @param {string} code @returns {never} */
function refuse(code) { throw new PrivateRecordSaveFinding(code); }
/** @param {string} root @param {string[]} args @param {Buffer|string|undefined} [input] @param {Record<string,string>} [extra] */
function git(root, args, input, extra = {}) {
  try { return execFileSync("git", ["--no-replace-objects", "-C", root, ...args], { encoding: "utf8", maxBuffer: 32 * 1024 * 1024,
    stdio: [input === undefined ? "ignore" : "pipe", "pipe", "pipe"], ...(input === undefined ? {} : { input }),
    env: { ...process.env, GIT_NO_LAZY_FETCH: "1", GIT_OPTIONAL_LOCKS: "0", ...extra } }).replace(/\n$/, ""); }
  catch { refuse("records-save-git-unavailable"); }
}
/** @param {any} value @param {string[]} fields */
function shape(value, fields) { return value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).sort().join(",") === [...fields].sort().join(","); }
/** @param {any} overlay */
function exactOverlay(overlay) {
  if (!Array.isArray(overlay)) refuse("records-save-overlay");
  return overlay.map((entry) => {
    if (!shape(entry, entry?.operation === "delete" ? ["operation", "path"] : ["operation", "path", "type", "mode", "bytes"]) ||
        typeof entry.path !== "string" || !["add", "edit", "delete"].includes(entry.operation) ||
        entry.operation !== "delete" && !(entry.bytes instanceof Uint8Array)) refuse("records-save-overlay");
    return { ...entry, ...(entry.operation === "delete" ? {} : { bytes: Buffer.from(entry.bytes) }) };
  });
}
/** @param {any} entry */
function encodedWrite(entry) { return { operation: entry.operation, path: entry.path, derived: entry.derived,
  ...(entry.operation === "delete" ? {} : { type: "blob", mode: entry.mode, base64: entry.bytes.toString("base64") }) }; }
/** @param {any} snapshot */
function observation(snapshot) { return snapshot.present ? { present: true, sha256: createHash("sha256").update(Buffer.from(snapshot.base64, "base64")).digest("hex"), mode: snapshot.mode } : { present: false }; }
/** @param {any} values @param {any[]} overlay */
function expectedFiles(values, overlay) {
  if (values === undefined) return null;
  if (!Array.isArray(values) || values.length !== overlay.length || new Set(values.map((entry) => entry?.path)).size !== values.length) refuse("records-save-expected-files");
  return values.map((entry) => {
    if (!shape(entry, entry?.present === false ? ["path", "present"] : ["path", "present", "sha256", "mode"]) ||
        typeof entry.path !== "string" || !overlay.some((write) => write.path === entry.path) ||
        entry.present !== false && (entry.present !== true || !/^[0-9a-f]{64}$/.test(entry.sha256) || !["100644", "100755"].includes(entry.mode))) refuse("records-save-expected-files");
    return { ...entry };
  });
}
/** @param {any} a @param {any} b */
function same(a, b) { return operationContent(a) === operationContent(b); }
/** Existing capture/physical facts are an accidental-rebinding discriminator,
 * never an identity service or authority to select another records root.
 * @param {any} capture @param {any} options @param {string} recordsRoot */
function frozenContext(capture, options, recordsRoot) {
  const product = captureOperationRepository(options.productRoot, options.productRevision, { forEffect: false });
  const records = captureOperationRepository(recordsRoot, options.recordsRevision, { forEffect: false });
  const docsDirectory = path.join(recordsRoot, "docs");
  if (!existsSync(docsDirectory) || !lstatSync(docsDirectory).isDirectory() || lstatSync(docsDirectory).isSymbolicLink()) refuse("records-save-context-changed");
  const docs = statSync(docsDirectory, { bigint: true }), docsIdentity = { directory: docsDirectory, device: String(docs.dev), inode: String(docs.ino) };
  return { expectedContext: operationDigest({ capture: capture.digest, product, records, docs: docsIdentity }), productOrigin: product, recordOrigin: {
    root: records.root, gitDirectory: records.gitDir, commonDirectory: records.commonDir,
    device: records.identities[0]?.device, inode: records.identities[0]?.inode, docsDirectory, docsDevice: docsIdentity.device, docsInode: docsIdentity.inode } };
}
/** Exact H2 record sections, using the canonical inert-span structural view.
 * @param {string} text */
function sections(text) {
  const structural = blankInertSpans(text).content;
  const headings = [...structural.matchAll(/^ {0,3}##[ \t]+(.+?)[ \t]*(?:#+[ \t]*)?\r?$/gm)];
  const result = new Map();
  for (let at = 0; at < headings.length; at++) {
    const heading = headings[at], name = heading?.[1]?.trim().toLowerCase();
    if (!heading || !name) continue;
    const bytes = text.slice(heading.index, headings[at + 1]?.index ?? text.length);
    result.set(name, [...(result.get(name) ?? []), bytes]);
  }
  return result;
}
/** Ordinary prose cannot stamp lifecycle, verification, dispatch or evidence.
 * Room/ADR owner voice remains the method's actual procedural obligation;
 * this is not a second ruling policy or an additional approval engine.
 * @param {any[]} writes @param {any[]} baseline */
function ordinaryAuthority(writes, baseline) {
  const originals = new Map(baseline.map((entry) => [entry.path, entry]));
  const protectedSections = ["verdicts", "history", "approval history", "archived grant history", "reports", "repair ledger"];
  for (const write of writes) {
    if (!write.derived && !ordinaryRecordTextPath(write.path)) refuse("records-save-path-unqualified");
    const old = originals.get(write.path), before = old?.bytes.toString("utf8") ?? "";
    const after = write.operation === "delete" ? "" : Buffer.from(write.base64, "base64").toString("utf8");
    if (!write.derived && write.operation !== "delete" && Buffer.from(write.base64, "base64").includes(0)) refuse("records-save-not-text");
    if (old && write.path.startsWith("docs/checkpoints/") && write.path !== "docs/checkpoints/TEMPLATE.md" &&
        (write.operation === "delete" || !after.startsWith(before))) refuse("records-save-append-only");
    if (!isTaskFilePath(write.path)) continue;
    if (write.operation === "delete" && old) {
      const prior = extractFrontmatter(before, write.path);
      if (prior.issues.length || !["suggested", "planned"].includes(String(prior.data?.status))) refuse("records-save-card-authority");
      if ([...sections(before)].some(([name, values]) => protectedSections.includes(name) && values.some((/** @type {string} */ value) => value.replace(/^.*\n/, "").trim()))) refuse("records-save-record-preservation");
      continue;
    }
    const next = extractFrontmatter(after, write.path);
    if (next.issues.length || !next.data) refuse("records-save-card-authority");
    const prior = old ? extractFrontmatter(before, write.path) : null;
    if (prior && (prior.issues.length || !prior.data)) refuse("records-save-card-authority");
    if (!prior && !["suggested", "planned"].includes(String(next.data.status))) refuse("records-save-card-status");
    for (const field of [...MECHANICAL_FIELDS, "review"]) {
      const beforeValue = prior?.data?.[field] ?? null, afterValue = next.data[field] ?? null;
      if (prior ? !same(beforeValue, afterValue) : field !== "status" && !(field === "review" && afterValue === "independent") && afterValue !== null && afterValue !== "") refuse("records-save-card-authority");
    }
    const oldSections = sections(before), newSections = sections(after);
    for (const section of protectedSections) {
      const was = oldSections.get(section) ?? [], now = newSections.get(section) ?? [];
      if (prior ? !same(was, now) : now.some((/** @type {string} */ value) => value.replace(/^.*\n/, "").replace(/<!--[\s\S]*?-->/g, "").trim())) refuse("records-save-record-preservation");
    }
    for (const [name, values] of oldSections) if (name === "implementation notes" && !same(values, newSections.get(name) ?? [])) {
      const nextValues = newSections.get(name) ?? [];
      if (values.some((/** @type {string} */ value, /** @type {number} */ at) => !nextValues[at]?.startsWith(value))) refuse("records-save-append-only");
    }
  }
}
/** @param {any} result @param {any} payload @param {string} coordinatorRoot */
function savedResult(result, payload, coordinatorRoot) {
  if(result.status === "stopped") return result;
  const cleanup=result.recovered ? releaseAcceptedRecordWriteLock(coordinatorRoot,result.operationId) : {status:"clear"};
  return {...(cleanup.status === "unavailable" ? {cleanupWarning:cleanup} : {}), operationId: result.operationId, status: "saved", commit: result.commit, tree: result.tree,
  ref: result.ref, previousRevision: result.previousRevision, recovered: result.recovered,
  paths: payload.writes.map((/** @type {any} */ write) => write.path), procedural: payload.procedural }; }

/** Constructor-only configuration. The public configured factory below reads
 * the project's committed runtime template; save requests have no policy flag.
 * @param {{profile: any, tool: any}} configuration */
export function createPrivateRecordService(configuration) {
  const checker = createRecordChecker(configuration);
  /** Only pure evaluation is reusable. Every effect still freshly captures
   * the complete eager corpus (its digest includes each input's byte SHA256),
   * TOOL/profile/history and all current origins, refs and working preimages.
   * Keep one entry so a long-lived service does not retain past private boards.
   * @type {{captureDigest:string,overlayDigest:string,checked:any}|null} */
  let evaluation = null;
  /** @param {any} payload @param {any} context */
  function policy(payload, context) {
    verifyInstalledRecordTool(checker.tool);
    if (!same(payload.profile, checker.profile) || !same(payload.tool, checker.tool)) refuse("records-save-service-changed");
    const workspace = resolveWorkspace({ productRoot: payload.options.productRoot, mode: "development", commit: payload.options.productRevision });
    if (workspace.layout !== "split" || workspace.recordsRoot !== context.request.repository.root || workspace.productRoot !== payload.options.productRoot) refuse("records-save-binding-changed");
    if (git(workspace.productRoot, ["rev-parse", "HEAD"]) !== payload.options.productRevision) refuse("records-save-product-context-changed");
    if (git(workspace.recordsRoot, ["symbolic-ref", "-q", "HEAD"]) !== context.request.targetRef || git(workspace.recordsRoot, ["rev-parse", context.request.targetRef]) !== payload.options.recordsRevision) refuse("records-save-records-context-changed");
    const capture = checker.capture(payload.options);
    if (capture.digest !== payload.captureDigest) refuse("records-save-captured-context-changed");
    const currentOrigin=frozenContext(capture,payload.options,workspace.recordsRoot);
    if(!same(currentOrigin.productOrigin,payload.productOrigin)||!same(currentOrigin.recordOrigin,payload.recordOrigin)||
      payload.expectedContext!==null&&currentOrigin.expectedContext!==payload.expectedContext)refuse("records-save-context-changed");
    const overlayDigest = operationDigest(payload.overlay);
    if (evaluation === null || evaluation.captureDigest !== capture.digest || evaluation.overlayDigest !== overlayDigest) {
      const overlay = payload.overlay.map((/** @type {any} */ entry) => ({ operation: entry.operation, path: entry.path,
        ...(entry.operation === "delete" ? {} : { type: entry.type, mode: entry.mode, bytes: Buffer.from(entry.base64, "base64") }) }));
      evaluation = { captureDigest: capture.digest, overlayDigest, checked: checker.evaluate(capture, overlay) };
    }
    const checked = evaluation.checked;
    if (!checked.accepted || checked.candidateDigest !== payload.candidateDigest) refuse("records-save-candidate-changed");
    const current = checkedRecordWriteSet(checked);
    if (!same(current.writes.map(encodedWrite), payload.writes)) refuse("records-save-write-set-changed");
    if (!same(transformations(workspace.recordsRoot, payload.writes.map((/** @type {any} */ write) => write.path)), payload.transformations)) refuse("records-save-attributes-changed");
    ordinaryAuthority(payload.writes, current.baseline);
    for (const expected of payload.expectedFiles ?? []) {
      const { path: file, ...wanted } = expected;
      const actual = observation(fileSnapshot(safeWorkingPath(workspace.recordsRoot, file)));
      const write = payload.writes.find((/** @type {any} */ entry) => entry.path === file);
      const recovering = context.resumingPreparation || context.phase === "ref";
      if (!same(actual, wanted) && !(recovering && same(actual, observation(intendedFile(write))))) refuse("records-save-file-changed");
    }
    return true;
  }
  return Object.freeze({ profile: checker.profile, tool: checker.tool,
    /** @param {{productRoot: string, productRevision: string}} options @param {string} file */
    read(options, file) {
      checkOperationEnvironment();
      if (!shape(options, ["productRoot", "productRevision"]) || !ordinaryRecordTextPath(file)) refuse("records-save-request");
      const workspace = resolveWorkspace({ productRoot: options.productRoot, mode: "development", commit: options.productRevision });
      if (workspace.layout !== "split" || git(workspace.productRoot, ["rev-parse", "HEAD"]) !== options.productRevision) refuse("records-save-product-context-changed");
      const recordsRevision = git(workspace.recordsRoot, ["rev-parse", "HEAD"]);
      const selected = { ...options, recordsRevision }, capture = checker.capture(selected);
      const snapshot = fileSnapshot(safeWorkingPath(workspace.recordsRoot, file));
      if (!snapshot.present) refuse("records-save-file-absent");
      try { new TextDecoder("utf-8", { fatal: true }).decode(Buffer.from(snapshot.base64, "base64")); } catch { refuse("records-save-not-text"); }
      const context = frozenContext(capture, selected, workspace.recordsRoot);
      const result = { status: "read", productRevision: options.productRevision, recordsRevision, path: file,
        contentBase64: snapshot.base64, observedFile: observation(snapshot), operationId: `save-${randomUUID()}`,
        expectedContext: context.expectedContext, recordOrigin: context.recordOrigin,
        recoveries: selectedRecoveries(workspace.productRoot, selected, file, context) };
      return result;
    },
    /** @param {any} options @param {any[]} overlay @param {{expectedContext: string, expectedFiles: any[]}|undefined} [expectation] */
    check(options, overlay, expectation) {
      const capture = checker.capture(options);
      if (expectation) {
        if (frozenContext(capture, options, capture.receipt.recordsRoot).expectedContext !== expectation.expectedContext) refuse("records-save-context-changed");
        const expected = expectedFiles(expectation.expectedFiles, overlay);
        for (const entry of expected ?? []) {
          const { path: file, ...wanted } = entry;
          if (!same(observation(fileSnapshot(safeWorkingPath(capture.receipt.recordsRoot, file))), wanted)) refuse("records-save-file-changed");
        }
      }
      return checker.evaluate(capture, overlay);
    },
    /** @param {any} request @param {any[]} overlay @param {{onBoundary?: (boundary: string, context: any) => void}} [diagnostics] */
    save(request, overlay, diagnostics = {}) {
      const allowed = ["productRoot", "productRevision", "recordsRevision", ...["operationId", "targetRef", "message", "expectedFiles", "expectedContext"].filter((key) => Object.hasOwn(request ?? {}, key))];
      if (!shape(request, allowed)) refuse("records-save-request");
      overlay = exactOverlay(overlay);
      const expected = expectedFiles(request.expectedFiles, overlay);
      if (request.expectedContext !== undefined && (typeof request.expectedContext !== "string" || !/^sha256:[0-9a-f]{64}$/.test(request.expectedContext))) refuse("records-save-request");
      if (request.operationId !== undefined && (typeof request.operationId !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(request.operationId))) refuse("records-save-request");
      checkOperationEnvironment();
      if (![request.productRevision, request.recordsRevision].every((revision) => typeof revision === "string" && /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(revision))) refuse("records-save-exact-revisions-required");
      if (Object.keys(diagnostics).some((key) => key !== "onBoundary")) refuse("records-save-diagnostics");
      const operationId = request.operationId ?? `save-${randomUUID()}`, coordinatorRoot = realpathSync(request.productRoot);
      const existing = readAcceptedOperation(coordinatorRoot, operationId);
      if (existing !== null) {
        const payload = existing.operation.request.payload;
        const edits = overlay.map((entry) => ({ ...entry, ...(entry.bytes instanceof Uint8Array ? { base64: Buffer.from(entry.bytes).toString("base64"), bytes: undefined } : {}) }));
        const comparable = JSON.parse(JSON.stringify(edits));
        if (payload?.kind !== "ordinary-record-save" || !same(payload.overlay, comparable) || payload.options.productRoot !== coordinatorRoot ||
            payload.options.recordsRevision !== request.recordsRevision || payload.options.productRevision !== request.productRevision ||
            request.targetRef !== undefined && request.targetRef !== existing.operation.request.targetRef ||
            !same(payload.expectedFiles ?? null, expected) ||
            (payload.suppliedExpectedContext ?? null) !== (request.expectedContext ?? null) ||
            (request.message ?? "Save private records") !== existing.operation.request.message) refuse("records-save-operation-changed");
        return this.replay({ productRoot: coordinatorRoot, operationId }, diagnostics);
      }
      const options = { productRoot: coordinatorRoot, recordsRevision: request.recordsRevision, productRevision: request.productRevision };
      const capture = checker.capture(options), result = checker.evaluate(capture, overlay);
      if (!result.accepted) refuse("records-save-check-refused");
      const accepted = checkedRecordWriteSet(result), root = accepted.receipt.recordsRoot;
      const origin = frozenContext(capture, options, root), actualContext = origin.expectedContext;
      if (request.expectedContext !== undefined && actualContext !== request.expectedContext) refuse("records-save-context-changed");
      if (root === coordinatorRoot || accepted.receipt.repositories.product.gitCommonDirectory === accepted.receipt.repositories.records.gitCommonDirectory) refuse("records-save-independent-root-required");
      const targetRef = request.targetRef ?? git(root, ["symbolic-ref", "-q", "HEAD"]);
      captureOperationRepository(root, options.recordsRevision);
      if (git(root, ["symbolic-ref", "-q", "HEAD"]) !== targetRef || git(root, ["rev-parse", targetRef]) !== options.recordsRevision) refuse("records-save-records-context-changed");
      if (git(coordinatorRoot, ["rev-parse", "HEAD"]) !== options.productRevision) refuse("records-save-product-context-changed");
      const writes = accepted.writes.map(encodedWrite);
      const selectedPaths = new Set(writes.map((/** @type {any} */ entry) => entry.path));
      if (writes.length === 0) refuse("records-save-no-changes");
      const conversion = transformations(root, writes.map((/** @type {any} */ write) => write.path));
      const baseline = accepted.baseline.filter((/** @type {any} */ entry) => selectedPaths.has(entry.path));
      ordinaryAuthority(writes, baseline);
      const { tree, working } = captureSavePlan(root, options.recordsRevision, writes);
      for (const entry of expected ?? []) {
        const { path: file, ...wanted } = entry;
        if (!same(observation(working.preimages.find((preimage) => preimage.path === file)?.work), wanted)) refuse("records-save-file-changed");
      }
      const capturedOverlay = writes.filter((/** @type {any} */ entry) => !entry.derived).map((/** @type {any} */ entry) => ({ operation: entry.operation, path: entry.path,
        ...(entry.operation === "delete" ? {} : { type: entry.type, mode: entry.mode, base64: entry.base64 }) }));
      const payload = { version: 1, kind: "ordinary-record-save", options, profile: checker.profile, tool: checker.tool,
        overlay: capturedOverlay, writes, baseline: baseline.map((/** @type {any} */ entry) => ({ path: entry.path, mode: entry.mode, base64: entry.bytes.toString("base64") })),
        captureDigest: accepted.captureDigest, candidateDigest: accepted.candidateDigest, ...working, procedural: result.procedural,
        expectedFiles: expected, expectedContext: actualContext, suppliedExpectedContext: request.expectedContext ?? null,
        recordOrigin: origin.recordOrigin, productOrigin: origin.productOrigin };
      Object.assign(payload, { transformations: conversion });
      let release = /** @type {undefined|(() => void)} */ (undefined);
      try {
        const saved = withAcceptedOperation(coordinatorRoot, { operationId, kind: "records-save", repositoryRoot: root, targetRef,
          expectedRevision: options.recordsRevision, acceptedTree: tree, payloadDigest: operationDigest(payload), payload, message: request.message ?? "Save private records" },
        { ...diagnostics, authorize(context) { return policy(payload, context); }, prepareTree(context) { prepareAcceptedTree(payload, context,()=>policy(payload,context)); } },
        (context) => { release = materialize(coordinatorRoot,payload,context,diagnostics.onBoundary,active=>policy(payload,active)); });
        return savedResult(saved, payload, coordinatorRoot);
      } finally { release?.(); }
    },
    /** @param {{productRoot: string, operationId: string}} request @param {{onBoundary?: (boundary: string, context: any) => void}} [diagnostics] */
    replay(request, diagnostics = {}) {
      if (!shape(request, ["productRoot", "operationId"]) || Object.keys(diagnostics).some((key) => key !== "onBoundary")) refuse("records-save-request");
      const coordinatorRoot = realpathSync(request.productRoot), existing = readAcceptedOperation(coordinatorRoot, request.operationId), payload = existing?.operation.request.payload;
      if (payload?.version !== 1 || payload.kind !== "ordinary-record-save") refuse("records-save-operation-absent");
      let release = /** @type {undefined|(() => void)} */ (undefined);
      try {
        const result = replayAcceptedOperation(coordinatorRoot, request.operationId, { ...diagnostics, authorize(context) { return policy(payload, context); },
          prepareTree(context) { prepareAcceptedTree(payload,context,()=>policy(payload,context)); },
          prepare(context) { release = materialize(coordinatorRoot,payload,context,diagnostics.onBoundary,active=>policy(payload,active)); } });
        return savedResult(result, payload, coordinatorRoot);
      } finally { release?.(); }
    },
  });
}

/** Persistent selection uses canonical root project settings at an
 * explicit committed PRODUCT revision. Missing selection is unconfigured;
 * invalid explicit selection refuses. There is no missing-file generic fallback.
 * @param {{productRoot: string, productRevision: string, manifestPath?: string}} options */
export function loadConfiguredPrivateRecordService(options) {
  checkOperationEnvironment();
  if (typeof options.productRevision !== "string" || !/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(options.productRevision)) refuse("records-save-exact-revisions-required");
  const workspace = resolveWorkspace({ productRoot: options.productRoot, mode: "product-only" });
  if (git(workspace.productRoot, ["cat-file", "-t", options.productRevision]) !== "commit") refuse("records-save-product-context-changed");
  const tool = loadInstalledRecordTool(options.manifestPath);
  const config = loadProjectSettings({ productRoot: workspace.productRoot, productRevision: options.productRevision, tool });
  if (config.status === "not-configured") refuse("records-service-not-configured");
  if (config.status !== "ready") refuse(config.code);
  const service = createPrivateRecordService({ profile: config.settings.records.validation, tool });
  /** @param {any} request */
  const bound = (request) => {
    if (request.productRoot !== workspace.productRoot || request.productRevision !== options.productRevision) refuse("records-service-project-changed");
  };
  return Object.freeze({ profile: service.profile, tool: service.tool,
    /** @param {any} request @param {string} file */
    read(request, file) { bound(request); return service.read(request, file); },
    /** @param {any} request @param {any[]} overlay @param {any} [expectation] */
    check(request, overlay, expectation) { bound(request); return service.check(request, overlay, expectation); },
    /** @param {any} request @param {any[]} overlay @param {any} [diagnostics] */
    save(request, overlay, diagnostics) { bound(request); return service.save(request, overlay, diagnostics); },
    /** @param {any} request @param {any} [diagnostics] */
    replay(request, diagnostics) { if (request.productRoot !== workspace.productRoot) refuse("records-service-project-changed"); return service.replay(request, diagnostics); },
  });
}

/** Historical acceptance is resolved before a new current binding/profile is
 * loaded. Pending work still uses its captured original configuration/context
 * and the complete current write-boundary policy. No newer edit is recaptured.
 * @param {{productRoot: string, operationId: string, manifestPath?: string}} request
 * @param {{onBoundary?: (boundary: string, context: any) => void}} [diagnostics] */
export function replayPrivateRecordSave(request, diagnostics = {}) {
  if (!shape(request, ["productRoot", "operationId", ...(Object.hasOwn(request ?? {}, "manifestPath") ? ["manifestPath"] : [])]) ||
      Object.keys(diagnostics).some((key) => key !== "onBoundary")) refuse("records-save-request");
  const coordinatorRoot = realpathSync(request.productRoot), existing = readAcceptedOperation(coordinatorRoot, request.operationId), payload = existing?.operation.request.payload;
  if (payload?.version !== 1 || payload.kind !== "ordinary-record-save" || payload.options.productRoot !== coordinatorRoot) refuse("records-save-operation-absent");
  if (["failed","stopped"].includes(existing.state) || observedAcceptedOperation(coordinatorRoot, request.operationId) !== null) {
    return savedResult(replayAcceptedOperation(coordinatorRoot, request.operationId, { authorize() { return false; } }), payload, coordinatorRoot);
  }
  return loadConfiguredPrivateRecordService({ productRoot: coordinatorRoot, productRevision: payload.options.productRevision,
    ...(request.manifestPath === undefined ? {} : { manifestPath: request.manifestPath }) }).replay({ productRoot: coordinatorRoot, operationId: request.operationId }, diagnostics);
}

/** Metadata-only cold-client discovery from the existing operation store. Current
 * binding/profile/tool selection is deliberately not a gate on historical input.
 * @param {{productRoot:string}} request */
export function discoverPrivateRecordSaves(request) {
  if (!shape(request, ["productRoot"])) refuse("records-save-request");
  const root = realpathSync(request.productRoot);
  /** @type {any[]} */ const recoveries = [];
  for (const rec of listAcceptedOperations(root)) {
    if(rec.operation.kind !== "records-save") continue;
    if (["failed","stopped"].includes(rec.state) || rec.events.some((/** @type {any} */ event) => event.op === "client-acknowledged")) continue;
    const payload = rec.operation.request.payload;
    if (payload?.version !== 1 || payload.kind !== "ordinary-record-save") {
      recoveries.push({operationId:rec.operation.id,state:"uncertain",createdAt:rec.operation.createdAt,
        productRoot:root, paths:[],editorRecovery:"unavailable",reason:"unsupported-operation-capture"});
      continue;
    }
    if (!shape(payload.options,["productRoot","productRevision","recordsRevision"]) || payload.options.productRoot !== root ||
        ![payload.options.productRevision,payload.options.recordsRevision].every((value) => /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(value)) || !Array.isArray(payload.overlay) || payload.overlay.length === 0 ||
        payload.overlay.some((/** @type {any} */ entry) => !ordinaryRecordTextPath(entry.path) || !["add","edit","delete"].includes(entry.operation)) ||
        typeof payload.expectedContext !== "string" || !/^sha256:[0-9a-f]{64}$/.test(payload.expectedContext)) refuse("records-save-recovery-unavailable");
    try {
      const overlay = payload.overlay.map((/** @type {any} */ entry) => {
        if (!shape(entry,entry.operation === "delete" ? ["operation","path"] : ["operation","path","type","mode","base64"])) refuse("records-save-recovery-unavailable");
        if (entry.operation === "delete") return entry;
        if (entry.type !== "blob" || !["100644","100755"].includes(entry.mode) || typeof entry.base64 !== "string") refuse("records-save-recovery-unavailable");
        const bytes = Buffer.from(entry.base64,"base64");
        if (bytes.toString("base64") !== entry.base64 || bytes.includes(0)) refuse("records-save-recovery-unavailable");
        new TextDecoder("utf-8",{fatal:true}).decode(bytes);
        return {operation:entry.operation,path:entry.path,type:entry.type,mode:entry.mode,bytes};
      });
      exactOverlay(overlay); expectedFiles(payload.expectedFiles ?? undefined,overlay);
      if (payload.recordOrigin && (!shape(payload.recordOrigin,["root","gitDirectory","commonDirectory","device","inode","docsDirectory","docsDevice","docsInode"]) ||
          payload.recordOrigin.root !== rec.resource || payload.recordOrigin.gitDirectory !== rec.operation.request.repository.gitDir ||
          payload.recordOrigin.commonDirectory !== rec.operation.request.repository.commonDir ||
          ["device","inode","docsDevice","docsInode"].some((key) => typeof payload.recordOrigin[key] !== "string" || !/^[0-9]+$/.test(payload.recordOrigin[key])) ||
          payload.recordOrigin.docsDirectory !== path.join(rec.resource,"docs"))) refuse("records-save-recovery-unavailable");
    } catch {refuse("records-save-recovery-unavailable");}
    let state = "pending", receipt, reason;
    try { receipt = observedAcceptedOperation(root, rec.operation.id); if (receipt !== null) state = "accepted"; }
    catch (error) { state = "uncertain"; reason = typeof /** @type {any} */(error)?.code === "string" ? /** @type {any} */(error).code : "records-save-recovery-unavailable"; }
    const editable = payload.overlay.length === 1 && payload.overlay[0].operation === "edit" &&
      payload.overlay[0].type === "blob" && ["100644","100755"].includes(payload.overlay[0].mode) &&
      Array.isArray(payload.expectedFiles) && payload.expectedFiles.length === 1 && payload.expectedFiles[0].present === true &&
      payload.recordOrigin && payload.productOrigin;
    recoveries.push({operationId:rec.operation.id,state,createdAt:rec.operation.createdAt,
      productRoot:root,productRevision:payload.options.productRevision,recordsRevision:payload.options.recordsRevision,
      recordOrigin:payload.recordOrigin ?? null,paths:payload.overlay.map((/** @type {any} */ entry) => entry.path),expectedContext:payload.expectedContext,
      ...(receipt ? {receipt:{commit:receipt.commit,tree:receipt.tree,ref:receipt.ref,previousRevision:receipt.previousRevision}} : {}),
      editorRecovery:editable && state === "pending" ? "available" : "unavailable",
      ...(!editable ? {reason:"editor-capture-unavailable"} : reason ? {reason} : state === "accepted" ? {reason:"accepted-history"} : {})});
  }
  return {status:"recoveries",recoveries};
}
/** A selected-path read may expose submitted bytes only from its original
 * physical PRODUCT/RECORDS/docs incarnation. Accepted old text stays history.
 * @param {string} root @param {any} options @param {string} file @param {any} context */
function selectedRecoveries(root, options, file, context) {
  const rows = discoverPrivateRecordSaves({productRoot:root}).recoveries.filter((row) =>
    row.paths.includes(file) && row.recordOrigin && same(row.recordOrigin, context.recordOrigin));
  let capturedBytes = 0;
  for (const row of rows) {
    if (row.editorRecovery !== "available") continue;
    const payload = readAcceptedOperation(root, row.operationId).operation.request.payload;
    if (!same(payload.productOrigin, context.productOrigin) || payload.expectedContext !== context.expectedContext || row.productRevision !== options.productRevision || row.recordsRevision !== options.recordsRevision) {
      row.editorRecovery = "unavailable"; row.reason = "original-context-changed"; continue;
    }
    const edit = payload.overlay[0], expected = payload.expectedFiles[0];
    let bytes;
    try { bytes = Buffer.from(edit.base64,"base64"); new TextDecoder("utf-8",{fatal:true}).decode(bytes); }
    catch { refuse("records-save-recovery-unavailable"); }
    if (bytes.toString("base64") !== edit.base64 || bytes.includes(0)) refuse("records-save-recovery-unavailable");
    // Bound both current and captured editor text under the fixed wire budget.
    // Wider/large operations remain metadata-discoverable and replayable by ID.
    if (capturedBytes + bytes.length > 1024 * 1024) {row.editorRecovery="unavailable";row.reason="editor-capture-limit";continue;}
    capturedBytes += bytes.length;
    const {path:capturedPath,...expectedFile} = expected;
    row.capture = {operationId:row.operationId,path:capturedPath,contentBase64:edit.base64,expectedFile,
      expectedContext:payload.expectedContext,productRevision:row.productRevision,recordsRevision:row.recordsRevision};
  }
  return rows;
}
/** Ack is a receipt notification, never another save or lifecycle action.
 * @param {{productRoot:string,operationId:string,commit:string}} request */
export function acknowledgePrivateRecordSave(request) {
  if (!shape(request,["productRoot","operationId","commit"])) refuse("records-save-request");
  const root=realpathSync(request.productRoot), rec=readAcceptedOperation(root,request.operationId);
  if (rec?.operation.request.payload?.kind !== "ordinary-record-save" || rec.operation.request.payload.options.productRoot !== root) refuse("records-save-operation-absent");
  return acknowledgeAcceptedOperation(root,request.operationId,request.commit);
}
