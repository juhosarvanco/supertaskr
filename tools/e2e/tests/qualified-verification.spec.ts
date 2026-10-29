import { execFileSync, spawnSync } from "node:child_process";
import { chmodSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, renameSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { RUNTIME_DIR_IGNORE } from "../../../.claude/hooks/lane-fence.mjs";
import { composeGrantSnapshot, PAUSE_REL_PATH } from "../scripts/dispatch-brief.mjs";
import { captureQualifiedInputs, isQualifiedCommitId } from "../scripts/qualified-reservation.mjs";
import { qualifiedImplementationProjection, qualifiedReviewCommitId, qualifiedReviewPolicy, qualifiedReviewTier } from "../scripts/qualified-verification.mjs";
import { bindRun, collectRun, observeRun, readAssignment, readRecord, startRun, writeRecord,
  prepareNativeBenchRun, nativeBenchAssignmentInputs, readQualifiedReservation, acquireQualifiedReservation, releaseReservation, loadQualifiedReservations,
  qualifiedOutputIdentity, qualifiedReviewDigest, sealQualifiedVerification, takeReservation } from "../scripts/run-record.mjs";
import { activeNativeHolds, collectNativeWorkspace, handleNativeEvent, NATIVE_CODEX_HARNESS, NATIVE_IDENTITY_PROBE,
  nativeShellQuote, nativeSha256, withNativeDurabilityObserver } from "../scripts/native-codex.mjs";
import { parseNativeRawDiff } from "../scripts/native-codex.mjs";
import { measureProductIdentity, WORKSPACE_ASSOCIATION_REL_PATH, WORKSPACE_BINDING_REL_PATH } from "../scripts/workspace.mjs";
import { correctionEntries, readMutantBlocks } from "../scripts/merge.mjs";
import { NO_BACKGROUND_MAINTENANCE, removeGitFixture } from "./git-fixture";

const SOURCE = path.resolve(import.meta.dirname, "../../..");
const CARD = "docs/tasks/T-999-private.md";
const ENV = { ...process.env, GIT_AUTHOR_NAME: "Qualified fixture", GIT_AUTHOR_EMAIL: "fixture.invalid",
  GIT_COMMITTER_NAME: "Qualified fixture", GIT_COMMITTER_EMAIL: "fixture.invalid" };
function git(root: string, args: string[]) {
  return execFileSync("git", ["-C", root, ...NO_BACKGROUND_MAINTENANCE, ...args], { encoding: "utf8", env: ENV, stdio: ["ignore", "pipe", "pipe"] }).trim();
}
function put(root: string, file: string, text: string) { mkdirSync(path.dirname(path.join(root, file)), { recursive: true }); writeFileSync(path.join(root, file), text); }
function commit(root: string) { git(root, ["add", "-A"]); git(root, ["commit", "-qm", "fixture candidate"]); return git(root, ["rev-parse", "HEAD"]); }
// Pure projection input fixtures do not publish or acquire run authority.
function projectionFixture(from: string) {
  const dir = realpathSync(mkdtempSync(path.join(os.tmpdir(), "projection-T-354-"))), repo = path.join(dir, "records");
  mkdirSync(repo); git(repo, ["init", "-q", "--initial-branch=main"]);
  git(repo, ["config", "core.filemode", "true"]); git(repo, ["config", "diff.renames", "true"]);
  put(repo, from, "Ordinary projection document.\nIts bytes stay identical for rename and copy controls.\n");
  const base = commit(repo), authority: any = { receipt: { objectFormat: "sha1", productObjectFormat: "sha1" }, fence: {
    paths: [{ role: "records", domain: "rules" }], excluded: [{ filesystemRoot: repo, domain: "rules/excluded" }],
    repositories: { product: { filesystemRoot: repo }, records: { filesystemRoot: repo } } } };
  const worker = { role: "records", checkout: repo, base, candidate: base };
  function raw(ref: string, options: string[] = []) {
    return execFileSync("git", ["-C", repo, ...NO_BACKGROUND_MAINTENANCE, "diff", "--raw", "-z", "--no-abbrev", ...options, base, ref, "--"],
      { env: ENV, stdio: ["ignore", "pipe", "pipe"] });
  }
  return { repo, base, authority, worker, raw, cleanup: () => removeGitFixture(dir, "ordinary projection T-354") };
}
function fixture(colocated = false, change = "mixed") {
  const dir = realpathSync(mkdtempSync(path.join(os.tmpdir(), "verification-T-354-")));
  const product = path.join(dir, "product"), records = colocated ? product : path.join(dir, "records");
  for (const root of new Set([product, records])) {
    mkdirSync(root); git(root, ["init", "-q", "--initial-branch=main"]);
    put(root, "src/file", "product base\n"); put(root, "rules/file", "records base\n");
    put(root, ".gitignore", ".supertaskr/\n*.ignored\n"); commit(root);
  }
  put(product, "tests/README", "fixture correction bodies live here\n"); commit(product);
  put(product, "method/roles/verifier.md", readFileSync(path.join(SOURCE, "method/roles/verifier.md"), "utf8"));
  put(product, "method/runtime/process-schema.yaml", readFileSync(path.join(SOURCE, "method/runtime/process-schema.yaml"), "utf8")); commit(product);
  if (!colocated) put(product, WORKSPACE_BINDING_REL_PATH, JSON.stringify({ version: 1, projectId: "qualified-fixture", productRoot: product, recordsRoot: records }));
  const identity = measureProductIdentity(product);
  put(records, WORKSPACE_ASSOCIATION_REL_PATH, JSON.stringify({ version: 1, projectId: "qualified-fixture", product: { objectFormat: identity.objectFormat, rootCommits: identity.rootCommits } }));
  const text = '---\nid: T-999\ntitle: Qualified fixture\nfeature: F-04\nmilestone: 4\npriority: 1\nsize: M\nstatus: building\ntouches: ["product::src", "product::tests", "records::rules", "records::docs/architecture/components"]\n---\n\nFrozen private contract.\n\n## Acceptance criteria\n\n- WHEN built THE executor SHALL retain both roots.\n\n## Implementation notes\n\nPRIVATE_T354_HISTORY\n\n## Verdicts\n';
  let contract = change === "guarded" ? text.replace("size: M", "size: L\ntier: guarded") : text;
  if (change === "quoted-guarded") contract = contract.replace("size: M", 'size: M\ntier: "guarded"');
  if (change === "inert") contract = contract.replace("## Acceptance criteria\n", "## Acceptance criteria\n\n```markdown\n## Acceptance criteria\n- EXAMPLE ONLY, not an active criterion.\n```\n");
  if (["product", "records"].includes(change)) contract = contract.replace(/touches: \[[^\n]*\]/,
    change === "product" ? 'touches: ["product::src", "product::tests"]' : 'touches: ["records::rules", "records::docs/architecture/components"]');
  put(records, CARD, contract);
  if (change === "projection-grades") put(records, "rules/projection.md", "Ordinary review document.\nStable bytes connect a same-class rename to its collection grade.\n");
  put(records, "docs/architecture/components/C-01-owned.md", '---\nid: C-01\nname: Owned\npaths: ["product::src/**"]\ntouch_slugs: [owned]\n---\n');
  const recordsBase = commit(records), productBase = git(product, ["rev-parse", "HEAD"]);
  const blob = git(records, ["rev-parse", `${recordsBase}:${CARD}`]);
  function grant(approved = blob, revoked = false, revision = 3) {
    const block = `dispatch:\n  approval: each\n  recovery: repairs\n  grant:\n    given_by: fixture owner\n    at: "2026-10-24T00:00:00Z"\n    revision: ${revision}\n    order: [T-999]\n    cards:\n      T-999: ${approved}\n${revoked ? '  revoked:\n    at: "2026-10-24T01:00:00Z"\n    by: fixture owner\n' : ""}  history: []\n`;
    put(product, ".supertaskr/dispatch-grant.yaml", composeGrantSnapshot({ root: product, blockText: block, revision, writtenBy: "fixture" }));
  }
  grant();
  const productWorker = path.join(dir, "product-worker"), recordsWorker = colocated ? productWorker : path.join(dir, "records-worker");
  git(product, ["worktree", "add", "--detach", productWorker, productBase]);
  if (!colocated) git(records, ["worktree", "add", "--detach", recordsWorker, recordsBase]);
  const qualified: any = { version: 1, authorityRoot: product, projectId: "qualified-fixture", revisions: { product: productBase, records: recordsBase },
    taskId: "T-999", legacyTokenMap: {}, workers: [{ role: "product", checkout: productWorker, base: productBase }, { role: "records", checkout: recordsWorker, base: recordsBase }] };
  qualified.receipt = captureQualifiedInputs(qualified).receipt;
  if (["product", "records"].includes(change)) qualified.workers = qualified.workers.filter((w: any) => w.role === change);
  const assignment: any = { kind: "card", id: "T-999", role: "executor", resource: productWorker, cwd: productWorker, harness: NATIVE_CODEX_HARNESS,
    model: "gpt-6.1-sol", effort: "xhigh", base: productBase, brief: path.join(dir, "brief-T-354.md"), deadline: "none", budget: "none",
    admission: { kind: "explicit", parent: "", evidence: "", scope: "implementation" },
    native: { taskName: "/root/fixture_T354", sessionId: "session-T354", coordinatorTurnId: "parent-T354", ignoredOutputs: [] }, qualified };
  if (change === "records") Object.assign(assignment, { resource: recordsWorker, cwd: recordsWorker, base: recordsBase });
  put(dir, "brief-T-354.md", "Fixture native executor; no model or owned job is launched.\n");
  put(product, ".supertaskr/.gitignore", RUNTIME_DIR_IGNORE);
  function selected() { put(dir, "assignment-T-354.json", JSON.stringify(assignment)); return readAssignment(path.join(dir, "assignment-T-354.json")); }
  function refs() { return JSON.stringify(Object.fromEntries(qualified.workers.map((w: any) => [w.role, git(w.checkout, ["rev-parse", "HEAD"])]))); }
  function event(name: string, toolId = "action-T354", command = `cd -- ${nativeShellQuote(productWorker)} && true`, agent = "agent-T354", turn = "turn-T354") {
    return { hook_event_name: name, agent_id: agent, session_id: "session-T354", turn_id: turn, tool_name: "Bash", tool_use_id: toolId, tool_input: { command } };
  }
  function bind(attempt: string, agent = "agent-T354", turn = "turn-T354") {
    expect(handleNativeEvent(product, event("SubagentStart", "start", "", agent, turn)).disposition).toBe("start-recorded");
    expect(handleNativeEvent(product, event("PreToolUse", "probe", NATIVE_IDENTITY_PROBE, agent, turn)).disposition).toBe("identity-probe-pre");
    expect(handleNativeEvent(product, { ...event("PostToolUse", "probe", NATIVE_IDENTITY_PROBE, agent, turn), tool_response: agent }).disposition).toBe("identity-probe-post");
    return bindRun(product, { attempt, harnessId: agent });
  }
  function finish(attempt: string) { return observeRun(product, { attempt, evidence: "Actual fixture harness final notification.\nRUN-DONE ok" }); }
  return { dir, product, records, productWorker, recordsWorker, assignment, qualified, grant, selected, refs, event, bind, finish,
    cleanup: () => removeGitFixture(dir, "qualified native T-354") };
}

async function reviewed(colocated = false, change = "mixed") {
  const fx = fixture(colocated, change);
  const started: any = await startRun(fx.product, { assignment: fx.selected() });
  fx.bind(started.record.attempt);
  if (change !== "records") put(fx.productWorker, "src/file", `${change === "padding" ? "  " : ""}product candidate\n`);
  if (change !== "product") {
    put(fx.recordsWorker, "rules/file", "records candidate\n");
    // Legitimate registry output must not recapture or expand authority.
    put(fx.recordsWorker, "docs/architecture/components/C-01-owned.md", '---\nid: C-01\nname: Changed registry output\npaths: ["product::src/**"]\ntouch_slugs: [owned]\n---\n');
  }
  for (const root of new Set([fx.productWorker, fx.recordsWorker])) {
    if (git(root, ["status", "--porcelain"])) commit(root);
  }
  expect(fx.finish(started.record.attempt).record.state).toBe("finished");
  collectRun(fx.product, { attempt: started.record.attempt, ref: fx.refs(), report: "executor fixture" });
  const actual = JSON.parse(fx.refs());
  const candidates = { ...fx.qualified.revisions, ...actual };
  if (colocated) candidates.product = candidates.records = Object.values(actual)[0];
  const productBench = path.join(fx.dir, "product-bench"), recordsBench = colocated ? productBench : path.join(fx.dir, "records-bench");
  git(fx.product, ["worktree", "add", "--detach", productBench, candidates.product]);
  if (!colocated) git(fx.records, ["worktree", "add", "--detach", recordsBench, candidates.records]);
  const assignment = structuredClone(fx.assignment);
  Object.assign(assignment, { role: "verifier", resource: productBench, cwd: productBench, base: candidates.product,
    native: { ...assignment.native, profile: "detached-verifier", executorAttempt: started.record.attempt, taskName: "/root/verifier_T354" } });
  assignment.qualified.workers = [{ role: "product", checkout: productBench, base: fx.qualified.revisions.product, candidate: candidates.product },
    { role: "records", checkout: recordsBench, base: fx.qualified.revisions.records, candidate: candidates.records }];
  assignment.qualified.verification = { executorAttempt: started.record.attempt, preparationDigest: "" };
  function selected() { put(fx.dir, "verifier-T-354.json", JSON.stringify(assignment)); return readAssignment(path.join(fx.dir, "verifier-T-354.json")); }
  function refs() { return JSON.stringify({ product: git(productBench, ["rev-parse", "HEAD"]), records: git(recordsBench, ["rev-parse", "HEAD"]) }); }
  async function prepare() {
    const inputs: any = nativeBenchAssignmentInputs(fx.product, { attempt: started.record.attempt, assignment: selected(), ref: JSON.stringify(candidates) });
    const prepared: any = await prepareNativeBenchRun(fx.product, { attempt: started.record.attempt, ...inputs });
    assignment.qualified.verification.preparationDigest = prepared.preparation.digest;
    return prepared;
  }
  async function seal(prepared: any) {
    const attackSetFile = path.join(fx.dir, "attacks-T-354.md"); writeFileSync(attackSetFile, "Attack the complete candidate pair and every criterion.\n");
    return sealQualifiedVerification(fx.product, { executorAttempt: started.record.attempt, preparationDigest: prepared.preparation.digest, attackSetFile });
  }
  function event(name: string, id = "verify-T354", command = `cd -- ${nativeShellQuote(productBench)} && true`) {
    return fx.event(name, id, command, "verifier-T354");
  }
  function bind(attempt: string) { return fx.bind(attempt, "verifier-T354"); }
  function finish(attempt: string) {
    const rec: any = readRecord(fx.product, attempt), v = rec.native.qualified.verification;
    if (!v) return fx.finish(attempt);
    const grades = v.authority.workers.map((w: any) => {
      const body = w.role === "product" && existsSync(path.join(w.checkout, "tests/check.cjs"));
      const code = body ? 'require("./tests/check.cjs")' : `require("node:assert").ok(require("node:fs").readFileSync(${JSON.stringify(w.role === "records" ? CARD : "src/file")}, "utf8").length > 0)`;
      return reading(v.authority, w, git(w.checkout, ["rev-parse", "HEAD"]), body ? 1 : 0, code);
    });
    const output = { preparationDigest: v.digest, sealDigest: v.seal.digest, refs: JSON.parse(refs()), grades };
    return observeRun(fx.product, { attempt, evidence: `Actual fixture harness final.\n\x60\x60\x60qualified-output-grades\n${JSON.stringify(output)}\n\x60\x60\x60\nRUN-DONE ok` });
  }
  return { ...fx, sourceAttempt: started.record.attempt, candidates, productBench, recordsBench, verifier: assignment, selectVerifier: selected, prepare, seal,
    verifierRefs: refs, verifierEvent: event, bindVerifier: bind, finish };
}

function reading(authority: any, worker: any, commitRef: string, expected = 0, code = 'require("node:assert").ok(true)') {
  const identity = qualifiedOutputIdentity(authority, worker, commitRef);
  const ran = spawnSync(process.execPath, ["-e", code], { cwd: worker.checkout, encoding: "utf8" });
  expect(ran.status).toBe(expected);
  const output = `${ran.stdout}${ran.stderr}\ngate-verdict suite=fixture exit=${ran.status} bodies=1 targets=1 ref=${commitRef} verdict=${expected === 0 ? "GREEN" : "RED"}\n`;
  return { role: worker.role, commit: commitRef, tree: identity.tree, projectionDigest: identity.projectionDigest,
    exit: ran.status, bodies: 1, command: `${process.execPath} -e ${code}`, output, outputDigest: nativeSha256(output) };
}

function writeVerdict(fx: any, run: any, prepared: any, sealed: any, adjust = (p: any) => p, suffix = "") {
  const authority = prepared.preparation.authority;
  const payload = adjust({ preparationDigest: prepared.preparation.digest, sealDigest: sealed.seal.digest, candidates: fx.candidates,
    criteria: [{ criterion: 1, evidence: "Complete qualified public lifecycle checked in owned real Git fixtures." }],
    frame: { agentId: "verifier-T354", taskName: run.native.launch.taskName, sessionId: run.native.launch.sessionId,
      requestedModel: run.assignment.model, requestedEffort: run.assignment.effort, observed: run.execution.observed,
      limitations: "Fixture callbacks and actual child assertions; no new live-model or cross-harness campaign." },
    corrections: [], grades: authority.workers.map((w: any) => reading(authority, w, fx.candidates[w.role])) });
  const original = readFileSync(path.join(fx.recordsBench, CARD), "utf8");
  put(fx.recordsBench, CARD, `${original}\n### 2026-10-27 — APPROVED — fixture verifier\n\nComplete-set verdict.\n\n\x60\x60\x60qualified-verdict\n${JSON.stringify(payload)}\n\x60\x60\x60\n${suffix}`);
  commit(fx.recordsBench);
  return payload;
}

test("qualified verification prepares, seals, admits and collects mixed, product-only, records-only and colocated complete sets", async () => {
  for (const [colocated, change] of [[false, "mixed"], [false, "product"], [false, "records"], [true, "mixed"], [true, "product"], [true, "records"], [false, "inert"]] as const) {
    const fx = await reviewed(colocated, change);
    try {
      if (!colocated) expect(existsSync(path.join(fx.productBench, CARD))).toBe(false);
      const prepared = await fx.prepare(), sealed = await fx.seal(prepared);
      expect(prepared.phase1).not.toContain("PRIVATE_T354_HISTORY");
      expect(sealed.phase2).not.toContain("PRIVATE_T354_HISTORY");
      expect(sealed.phase2).toContain(fx.candidates.records);
      const start: any = await startRun(fx.product, { assignment: fx.selectVerifier() });
      expect(start.reservation.scope.workers).toHaveLength(colocated ? 1 : 2);
      expect(start.reservation.scope.workers[0].initialHead).toBeDefined();
      expect((await startRun(fx.product, { assignment: fx.selectVerifier() })).record.attempt).toBe(start.record.attempt);
      const bound = fx.bindVerifier(start.record.attempt);
      expect(handleNativeEvent(fx.product, fx.verifierEvent("PreToolUse")).disposition).toBe("pre-admitted");
      writeVerdict(fx, bound, prepared, sealed);
      expect(handleNativeEvent(fx.product, fx.verifierEvent("PostToolUse")).disposition).toBe("post-clean");
      expect(fx.finish(start.record.attempt).record.state).toBe("finished");
      const got: any = await collectRun(fx.product, { attempt: start.record.attempt, ref: fx.verifierRefs(), report: "complete qualified verdict" });
      expect(got.collected.review.candidates).toEqual(fx.candidates);
      expect(got.collected.review.actualOutputs).toHaveLength(2);
      expect(got.collected.review.actualOutputGrades.map((g: any) => [g.role, g.commit])).toEqual(got.collected.review.actualOutputs.map((o: any) => [o.role, o.commit]));
      expect(got.collected.review.integration.required).toBe(false);
      expect(got.collected.review.actualOutputs.find((o: any) => o.role === "records").implementation.some((p: any) => p.paths.includes(CARD))).toBe(false);
      const held = await readQualifiedReservation(fx.product, start.record.attempt); expect(held).toBeNull();
      const history = readFileSync(start.file, "utf8");
      expect(handleNativeEvent(fx.product, fx.verifierEvent("PostToolUse", "after-collection")).disposition).toBe("historical-qualified-event");
      expect(readFileSync(start.file, "utf8")).toBe(history);
      // Historical retry must not read either source or verifier workspace and
      // must leave a later owner's exact reservation untouched.
      const later = takeReservation(fx.product, { resource: fx.productBench, attempt: "T-998-a1", role: "executor", at: new Date().toISOString() });
      rmSync(fx.recordsBench, { recursive: true, force: true });
      const replay: any = await collectRun(fx.product, { attempt: start.record.attempt, ref: JSON.stringify(Object.fromEntries(got.collected.refs.map((r: string) => r.split(":")))), report: "complete qualified verdict" });
      expect(replay.collected).toEqual(got.collected); expect(existsSync(later.file)).toBe(true);
    } finally { fx.cleanup(); }
  }
});

test("qualified verification refuses unfinalized authority, foreign benches, manifests, stale second candidates and changed preparation before acquisition", async () => {
  const fx = await reviewed();
  try {
    const original: any = readRecord(fx.product, fx.sourceAttempt);
    const live = structuredClone(original); live.state = "running"; writeRecord(fx.product, live);
    await expect(fx.prepare()).rejects.toMatchObject({ code: "QUALIFIED_REVIEW_EXECUTOR_UNFINALIZED" });
    writeRecord(fx.product, original);
    const missing = structuredClone(original); missing.native.qualified.origins.receipt.cardBlobId = "0".repeat(40); writeRecord(fx.product, missing);
    await expect(fx.prepare()).rejects.toThrow(/QUALIFIED/); writeRecord(fx.product, original);
    put(fx.recordsBench, ".supertaskr/lane-fence.json", '{"paths":["escape"]}');
    await expect(fx.prepare()).rejects.toMatchObject({ code: "QUALIFIED_REVIEW_CONTAINMENT" });
    rmSync(path.join(fx.recordsBench, ".supertaskr/lane-fence.json"));
    const checkout = fx.verifier.qualified.workers[0].checkout;
    fx.verifier.qualified.workers[0].checkout = fx.recordsBench;
    fx.verifier.resource = fx.recordsBench; fx.verifier.cwd = fx.recordsBench;
    await expect(fx.prepare()).rejects.toMatchObject({ code: "QUALIFIED_REVIEW_PROJECT" });
    fx.verifier.qualified.workers[0].checkout = checkout; fx.verifier.resource = checkout; fx.verifier.cwd = checkout;
    const prepared = await fx.prepare(), sealed = await fx.seal(prepared);
    expect(sealed.seal.inputs.candidates).toEqual(fx.candidates);
    put(fx.recordsBench, "rules/file", "stale second candidate\n"); commit(fx.recordsBench);
    await expect(startRun(fx.product, { assignment: fx.selectVerifier() })).rejects.toMatchObject({ code: "QUALIFIED_REVIEW_CANDIDATE_HEAD" });
    expect(await readQualifiedReservation(fx.product, "T-999-a2")).toBeNull();
    git(fx.recordsBench, ["reset", "--hard", fx.candidates.records]);
    const request: any = fx.selectVerifier();
    await expect(startRun(fx.product, { assignment: request, transaction: { onAcquired: () => {
      put(fx.recordsBench, "rules/file", "changed at decisive transaction\n"); commit(fx.recordsBench);
    } } } as any)).rejects.toMatchObject({ code: "QUALIFIED_REVIEW_CANDIDATE_HEAD" });
    git(fx.recordsBench, ["reset", "--hard", fx.candidates.records]);
    const source: any = readRecord(fx.product, fx.sourceAttempt), saved = structuredClone(source);
    source.native.qualifiedPreparations[0].seal.inputs.attack.text += "changed"; writeRecord(fx.product, source);
    await expect(startRun(fx.product, { assignment: fx.selectVerifier() })).rejects.toMatchObject({ code: "QUALIFIED_REVIEW_SEAL_CHANGED" });
    writeRecord(fx.product, saved);
    const started: any = await startRun(fx.product, { assignment: fx.selectVerifier() });
    expect(started.record.attempt).toBe("T-999-a2");
    fx.verifier.native.taskName = "/root/second-verifier";
    await expect(startRun(fx.product, { assignment: fx.selectVerifier() })).rejects.toMatchObject({ code: "QUALIFIED_PREPARATION_CONSUMED" });
    expect((await readQualifiedReservation(fx.product, started.record.attempt))?.identity).toBe(started.reservation.identity);
  } finally { fx.cleanup(); }
});

test("qualified verifier current phase policy, all-root callbacks, final jobs and ownership remain decisive", async () => {
  const fx = await reviewed();
  try {
    const prepared = await fx.prepare(), sealed = await fx.seal(prepared);
    const start: any = await startRun(fx.product, { assignment: fx.selectVerifier() });
    put(fx.product, PAUSE_REL_PATH, JSON.stringify({ version: 1, scope: "all", by: "fixture owner", at: "2026-10-27T00:00:00Z", why: "hold verifier bind" }));
    expect(() => fx.bindVerifier(start.record.attempt)).toThrow(/POLICY/);
    rmSync(path.join(fx.product, PAUSE_REL_PATH));
    // Restore only fixture-native observations from the exact admitted record;
    // this is a test control, never a production hold-clear path.
    writeRecord(fx.product, start.record);
    const bound = fx.bindVerifier(start.record.attempt);
    const snap: any = readRecord(fx.product, start.record.attempt);
    const escaped = { ...fx.verifierEvent("PreToolUse", "escape"), tool_name: "apply_patch", tool_input: { command: `*** Add File: ${fx.recordsBench}/escape\n` } };
    expect(handleNativeEvent(fx.product, escaped).disposition).toBe("pre-held"); writeRecord(fx.product, snap);
    put(fx.recordsBench, "escape", "dirty second root\n");
    expect(handleNativeEvent(fx.product, fx.verifierEvent("PreToolUse", "other-root")).disposition).toBe("pre-held");
    rmSync(path.join(fx.recordsBench, "escape")); writeRecord(fx.product, snap);
    put(fx.product, PAUSE_REL_PATH, JSON.stringify({ version: 1, scope: "all", by: "fixture owner", at: "2026-10-27T00:00:00Z", why: "hold action" }));
    expect(handleNativeEvent(fx.product, fx.verifierEvent("PreToolUse", "paused")).disposition).toBe("pre-held");
    rmSync(path.join(fx.product, PAUSE_REL_PATH)); writeRecord(fx.product, snap);
    expect(handleNativeEvent(fx.product, fx.verifierEvent("PreToolUse", "write-verdict")).disposition).toBe("pre-admitted");
    writeVerdict(fx, bound, prepared, sealed);
    expect(handleNativeEvent(fx.product, fx.verifierEvent("PostToolUse", "write-verdict")).disposition).toBe("post-clean");
    fx.finish(start.record.attempt);
    const finished: any = readRecord(fx.product, start.record.attempt);
    put(fx.product, PAUSE_REL_PATH, JSON.stringify({ version: 1, scope: "all", by: "fixture owner", at: "2026-10-27T00:00:00Z", why: "hold collection" }));
    await expect(collectRun(fx.product, { attempt: start.record.attempt, ref: fx.verifierRefs() })).rejects.toThrow(/HELD/);
    rmSync(path.join(fx.product, PAUSE_REL_PATH)); writeRecord(fx.product, finished);
    fx.grant(undefined, true);
    await expect(collectRun(fx.product, { attempt: start.record.attempt, ref: fx.verifierRefs() })).rejects.toThrow(/HELD/);
    fx.grant(); writeRecord(fx.product, finished);
    const unknown = handleNativeEvent(fx.product, fx.verifierEvent("PostToolUse", "unknown-completion"));
    expect(unknown.disposition).toBe("post-held");
    await expect(collectRun(fx.product, { attempt: start.record.attempt, ref: fx.verifierRefs() })).rejects.toThrow(/HELD/);
    writeRecord(fx.product, finished);
    const busy = structuredClone(finished); busy.ownedJobs = [{ kind: "pid", id: String(process.pid) }]; writeRecord(fx.product, busy);
    await expect(collectRun(fx.product, { attempt: start.record.attempt, ref: fx.verifierRefs() })).rejects.toThrow(/HELD/);
    writeRecord(fx.product, finished);
    const reservationFile = start.record.reservation.file, reservation = readFileSync(reservationFile, "utf8");
    const foreign = JSON.parse(reservation); foreign.attempt = "T-998-a1"; writeFileSync(reservationFile, JSON.stringify(foreign));
    await expect(collectRun(fx.product, { attempt: start.record.attempt, ref: fx.verifierRefs() })).rejects.toThrow(/HELD/);
    writeFileSync(reservationFile, reservation); writeRecord(fx.product, finished);
    let late = false;
    await expect(withNativeDurabilityObserver((info) => {
      if (!late && info.stage === "rename" && info.file === start.file) {
        late = true; handleNativeEvent(fx.product, fx.verifierEvent("PostToolUse", "late-completion"));
      }
    }, () => collectRun(fx.product, { attempt: start.record.attempt, ref: fx.verifierRefs() }))).rejects.toThrow(/LATE_CHANGE/);
    expect(late).toBe(true); writeRecord(fx.product, finished);
    const accepted: any = await collectRun(fx.product, { attempt: start.record.attempt, ref: fx.verifierRefs() });
    expect(accepted.collected.review.candidates).toEqual(fx.candidates);
  } finally { fx.cleanup(); }
});

test("qualified assigned corrections retain committed bodies and real RED GREEN identities without grading future integration", async () => {
  const fx = await reviewed(false, "padding");
  try {
    const prepared = await fx.prepare(), sealed = await fx.seal(prepared), a = prepared.preparation.authority;
    const start: any = await startRun(fx.product, { assignment: fx.selectVerifier() }), bound = fx.bindVerifier(start.record.attempt);
    const worker = a.workers.find((w: any) => w.role === "product"), temp = path.join(fx.dir, "correction-reading");
    git(fx.product, ["worktree", "add", "--detach", temp, fx.candidates.product]);
    const body = 'const { test } = require("node:test");\nconst assert = require("node:assert");\nconst fs = require("node:fs");\ntest("required correction", () => assert.equal(fs.readFileSync("src/file", "utf8").trim(), "good", "required correction"));\n';
    put(temp, "tests/check.cjs", body); const redCommit = commit(temp);
    const red = reading(a, { ...worker, checkout: temp }, redCommit, 1, 'require("./tests/check.cjs")');
    put(temp, "src/file", "  good\n"); const greenCommit = commit(temp);
    const green = reading(a, { ...worker, checkout: temp }, greenCommit, 0, 'require("./tests/check.cjs")');
    const suffix = '\n### Correction — require the property\n\n```mutant\ncorrection: require the property\nfile: src/file\nspec: tests/check.cjs\nbody: required correction\nmessage: required correction\n--- old\n  good\n--- new\n  product candidate\n```\n';
    const parsed = readMutantBlocks(suffix); expect("problem" in parsed).toBe(false);
    const block = (parsed as any).blocks[0];
    const correction = { correction: "require the property", role: "product", blockDigest: qualifiedReviewDigest(block), bodyHash: nativeSha256(body), red, green };
    expect(handleNativeEvent(fx.product, fx.verifierEvent("PreToolUse", "correction")).disposition).toBe("pre-admitted");
    writeVerdict(fx, bound, prepared, sealed, (p: any) => ({ ...p, corrections: [correction] }), suffix);
    const verdictCommit = git(fx.recordsBench, ["rev-parse", "HEAD"]);
    put(fx.productBench, "tests/check.cjs", body); const actualBody = commit(fx.productBench);
    expect(handleNativeEvent(fx.product, fx.verifierEvent("PostToolUse", "correction")).disposition).toBe("post-clean");
    fx.finish(start.record.attempt);
    const finished = readRecord(fx.product, start.record.attempt);
    // Dropping the condition while leaving its canonical block is refused.
    const text = readFileSync(path.join(fx.recordsBench, CARD), "utf8");
    put(fx.recordsBench, CARD, text.replace(JSON.stringify([correction]), "[]")); commit(fx.recordsBench);
    await expect(collectRun(fx.product, { attempt: start.record.attempt, ref: fx.verifierRefs() })).rejects.toThrow(/CORRECTION_DROPPED/);
    git(fx.recordsBench, ["reset", "--hard", verdictCommit]); writeRecord(fx.product, finished);
    const falseRed = { ...green, exit: 1, output: green.output.replace("exit=0", "exit=1") };
    falseRed.outputDigest = nativeSha256(falseRed.output);
    put(fx.recordsBench, CARD, text.replace(JSON.stringify(red), JSON.stringify(falseRed))); commit(fx.recordsBench);
    await expect(collectRun(fx.product, { attempt: start.record.attempt, ref: fx.verifierRefs() })).rejects.toThrow(/CORRECTION_READINGS/);
    git(fx.recordsBench, ["reset", "--hard", verdictCommit]); writeRecord(fx.product, finished);
    // A green corrected commit is real evidence, but it is not the actual
    // verifier implementation output and cannot be substituted for that output.
    put(fx.recordsBench, CARD, text.replace(JSON.stringify((JSON.parse(text.match(/```qualified-verdict\n([\s\S]*?)\n```/)![1]!)).grades[0]), JSON.stringify(green)));
    commit(fx.recordsBench);
    await expect(collectRun(fx.product, { attempt: start.record.attempt, ref: fx.verifierRefs() })).rejects.toThrow(/UNGRADED_OUTPUT/);
    git(fx.recordsBench, ["reset", "--hard", verdictCommit]); writeRecord(fx.product, finished);
    const got: any = await collectRun(fx.product, { attempt: start.record.attempt, ref: fx.verifierRefs() });
    expect(got.collected.review.integration).toMatchObject({ required: true, conditions: ["require the property"] });
    expect(got.collected.review.corrections[0]).toMatchObject({ bodyCommit: actualBody, readings: [red, green] });
    expect(got.collected.review.actualOutputs.find((o: any) => o.role === "product").commit).toBe(actualBody);
    expect(got.collected.review.actualOutputGrades.find((g: any) => g.role === "product")).toMatchObject({ commit: actualBody, exit: 1 });
    expect(got.collected.review.candidates).toEqual(fx.candidates);
    expect(got.collected.review.sealDigest).toBe(sealed.seal.digest);
    expect(git(fx.productBench, ["show", "HEAD:src/file"])).toBe("product candidate");
  } finally { fx.cleanup(); }
});

test("qualified whole-set verdict refuses partial claims, changed seals, ungraded output and excluded protocol artifacts", async () => {
  const fx = await reviewed();
  try {
    const prepared = await fx.prepare(), sealed = await fx.seal(prepared);
    const start: any = await startRun(fx.product, { assignment: fx.selectVerifier() }), bound = fx.bindVerifier(start.record.attempt);
    const baselineCard = readFileSync(path.join(fx.recordsBench, CARD), "utf8");
    const cases = [
      (p: any) => ({ ...p, candidates: { product: p.candidates.product } }),
      (p: any) => ({ ...p, criteria: [] }),
      (p: any) => ({ ...p, sealDigest: "changed" }),
      (p: any) => ({ ...p, grades: [p.grades[0]] }),
    ];
    for (const adjust of cases) {
      writeVerdict(fx, bound, prepared, sealed, adjust);
      const record: any = readRecord(fx.product, start.record.attempt);
      fx.finish(start.record.attempt);
      await expect(collectRun(fx.product, { attempt: start.record.attempt, ref: fx.verifierRefs() })).rejects.toThrow(/QUALIFIED_REVIEW/);
      writeRecord(fx.product, record);
      git(fx.recordsBench, ["reset", "--hard", fx.candidates.records]);
      expect(readFileSync(path.join(fx.recordsBench, CARD), "utf8")).toBe(baselineCard);
    }
    writeVerdict(fx, bound, prepared, sealed);
    put(fx.recordsBench, CARD, readFileSync(path.join(fx.recordsBench, CARD), "utf8").replace("— APPROVED —", "— REJECTED —") + "\nAPPROVED is discussed here, not the verdict.\n");
    commit(fx.recordsBench);
    const beforeRejected = readRecord(fx.product, start.record.attempt); fx.finish(start.record.attempt);
    await expect(collectRun(fx.product, { attempt: start.record.attempt, ref: fx.verifierRefs() })).rejects.toThrow(/QUALIFIED_REVIEW_VERDICT/);
    writeRecord(fx.product, beforeRejected); git(fx.recordsBench, ["reset", "--hard", fx.candidates.records]);
    writeVerdict(fx, bound, prepared, sealed);
    const beforeUngraded = readRecord(fx.product, start.record.attempt);
    observeRun(fx.product, { attempt: start.record.attempt, evidence: "Actual fixture final without own-write grades.\nRUN-DONE ok" });
    await expect(collectRun(fx.product, { attempt: start.record.attempt, ref: fx.verifierRefs() })).rejects.toThrow(/OWN_WRITE_GRADES/);
    writeRecord(fx.product, beforeUngraded); git(fx.recordsBench, ["reset", "--hard", fx.candidates.records]);
    const originalPayload = writeVerdict(fx, bound, prepared, sealed), gradedCommit = git(fx.recordsBench, ["rev-parse", "HEAD"]);
    const recordsWorker = prepared.preparation.authority.workers.find((w: any) => w.role === "records");
    const withProtocol = parseNativeRawDiff(Buffer.from(git(fx.recordsBench, ["diff", "--raw", "-z", "--no-abbrev", recordsWorker.base, gradedCommit])));
    expect(withProtocol.some((entry: any) => entry.paths.includes(CARD))).toBe(true);
    const graded = reading(prepared.preparation.authority, recordsWorker, gradedCommit);
    const incorrect = { ...graded, projectionDigest: qualifiedReviewDigest(withProtocol) };
    const text = readFileSync(path.join(fx.recordsBench, CARD), "utf8");
    put(fx.recordsBench, CARD, text.replace(JSON.stringify(originalPayload.grades[1]), JSON.stringify(incorrect))); commit(fx.recordsBench);
    const record = readRecord(fx.product, start.record.attempt); fx.finish(start.record.attempt);
    await expect(collectRun(fx.product, { attempt: start.record.attempt, ref: fx.verifierRefs() })).rejects.toThrow(/UNGRADED_OUTPUT/);
    writeRecord(fx.product, record); git(fx.recordsBench, ["reset", "--hard", fx.candidates.records]);
    writeVerdict(fx, bound, prepared, sealed);
    fx.finish(start.record.attempt);
    const accepted: any = await collectRun(fx.product, { attempt: start.record.attempt, ref: fx.verifierRefs() });
    expect(accepted.collected.review.grades).toHaveLength(2);
  } finally { fx.cleanup(); }
});

test("qualified guarded measurements and interrupted final publication preserve exact evidence and refuse later ownership", async () => {
  const fx = await reviewed(false, "guarded");
  try {
    const prepared = await fx.prepare(); expect(prepared.preparation.authority.tier).toBe("guarded");
    await expect(fx.seal(prepared)).rejects.toMatchObject({ code: "QUALIFIED_REVIEW_GUARDED_MEASUREMENTS" });
    const sealed = await sealQualifiedVerification(fx.product, { executorAttempt: fx.sourceAttempt, preparationDigest: prepared.preparation.digest,
      attackSetFile: path.join(fx.dir, "attacks-T-354.md"), measurements: "Seat: original committed product/records bases and registered detached Git identities measured; fixture-only proof." });
    expect(sealed.phase2).toContain("whole suites");
    const started: any = await startRun(fx.product, { assignment: fx.selectVerifier() }), bound = fx.bindVerifier(started.record.attempt);
    writeVerdict(fx, bound, prepared, sealed); fx.finish(started.record.attempt);
    let failed = false;
    await expect(withNativeDurabilityObserver((info) => {
      if (!failed && info.stage === "before-rename" && info.file === started.file &&
          JSON.parse(readFileSync(info.temp!, "utf8")).native.qualified.collection?.phase === "final") {
        failed = true; throw new Error("fixture final publication interruption");
      }
    }, () => collectRun(fx.product, { attempt: started.record.attempt, ref: fx.verifierRefs() }))).rejects.toThrow(/interruption/);
    expect(failed).toBe(true);
    expect((readRecord(fx.product, started.record.attempt).native as any).qualified.collection.phase).toBe("ready");
    expect(await readQualifiedReservation(fx.product, started.record.attempt)).toBeNull();
    const ready = readRecord(fx.product, started.record.attempt); let late = false;
    await expect(withNativeDurabilityObserver((info) => {
      if (!late && info.stage === "before-rename" && info.file === started.file &&
          JSON.parse(readFileSync(info.temp!, "utf8")).native.qualified.collection?.phase === "final") {
        late = true; handleNativeEvent(fx.product, fx.verifierEvent("PostToolUse", "at-final-publication"));
      }
    }, () => collectRun(fx.product, { attempt: started.record.attempt, ref: fx.verifierRefs() }))).rejects.toThrow(/PUBLICATION_CHANGED/);
    expect(late).toBe(true);
    expect((readRecord(fx.product, started.record.attempt).native as any).qualified.collection.phase).toBe("ready");
    writeRecord(fx.product, ready); // Restore only the controlled fixture fault, never production authority.
    put(fx.recordsBench, "rules/file", "dirty after release\n");
    await expect(collectRun(fx.product, { attempt: started.record.attempt, ref: fx.verifierRefs() })).rejects.toThrow(/RETRY_CHANGED/);
    git(fx.recordsBench, ["restore", "rules/file"]);
    const later = takeReservation(fx.product, { resource: fx.productBench, attempt: "T-998-a1", role: "executor", at: new Date().toISOString() });
    await expect(collectRun(fx.product, { attempt: started.record.attempt, ref: fx.verifierRefs() })).rejects.toMatchObject({ code: "QUALIFIED_LATER_OWNER" });
    expect(existsSync(later.file)).toBe(true);
    releaseReservation(fx.product, { resource: fx.productBench, attempt: "T-998-a1" });
    const got: any = await collectRun(fx.product, { attempt: started.record.attempt, ref: fx.verifierRefs() });
    expect(got.collected.review.candidates).toEqual(fx.candidates);
    expect(got.collected.review.sealDigest).toBe(sealed.seal.digest);
  } finally { fx.cleanup(); }
});

test("qualified wording-only corrections preserve the canonical no-block condition without inventing body grades", async () => {
  const fx = await reviewed();
  try {
    const prepared = await fx.prepare(), sealed = await fx.seal(prepared);
    const start: any = await startRun(fx.product, { assignment: fx.selectVerifier() }), bound = fx.bindVerifier(start.record.attempt);
    const statement = "This is a wording repair; it pins no property and owes no mutant block.";
    const suffix = `\n### Correction 1 — clarify wording\n\n${statement}\n`;
    const names = correctionEntries(suffix); expect(names).toHaveLength(1);
    const condition = { correction: names[0]!.name, role: "records", file: "rules/file", wordingOnly: true, why: "A wording change has no executable property to pin." };
    writeVerdict(fx, bound, prepared, sealed, (p: any) => ({ ...p, corrections: [condition] }), suffix);
    const verdictCommit = git(fx.recordsBench, ["rev-parse", "HEAD"]), original = readFileSync(path.join(fx.recordsBench, CARD), "utf8");
    const prior = readRecord(fx.product, start.record.attempt);
    put(fx.recordsBench, CARD, original.replace(statement, "No validation claim was supplied.")); commit(fx.recordsBench); fx.finish(start.record.attempt);
    await expect(collectRun(fx.product, { attempt: start.record.attempt, ref: fx.verifierRefs() })).rejects.toThrow(/CORRECTION_DROPPED/);
    git(fx.recordsBench, ["reset", "--hard", verdictCommit]); writeRecord(fx.product, prior); fx.finish(start.record.attempt);
    const got: any = await collectRun(fx.product, { attempt: start.record.attempt, ref: fx.verifierRefs() });
    expect(got.collected.review.integration).toMatchObject({ required: true, conditions: [condition.correction] });
    expect(got.collected.review.corrections[0]).toMatchObject(condition);
    expect(got.collected.review.corrections[0].block).toBeUndefined();
    expect(got.collected.review.corrections[0].readings).toBeUndefined();
    expect(git(fx.recordsBench, ["show", "HEAD:rules/file"])).toBe("records candidate");
  } finally { fx.cleanup(); }
});

test("qualified correction collection binds final spec bytes to the committed measured body", async () => {
  const accepted: string[] = [];
  for (const mode of ["unchanged", "changed", "removed"]) {
    const fx = await reviewed(false, "padding");
    try {
      const prepared = await fx.prepare(), sealed = await fx.seal(prepared), a = prepared.preparation.authority;
      const start: any = await startRun(fx.product, { assignment: fx.selectVerifier() }), bound = fx.bindVerifier(start.record.attempt);
      const worker = a.workers.find((w: any) => w.role === "product"), temp = path.join(fx.dir, "correction-reading");
      git(fx.product, ["worktree", "add", "--detach", temp, fx.candidates.product]);
      const body = 'const { test } = require("node:test");\nconst assert = require("node:assert");\nconst fs = require("node:fs");\ntest("final body identity", () => assert.equal(fs.readFileSync("src/file", "utf8").trim(), "good", "final body identity"));\n';
      put(temp, "tests/check.cjs", body); const redCommit = commit(temp);
      const red = reading(a, { ...worker, checkout: temp }, redCommit, 1, 'require("./tests/check.cjs")');
      put(temp, "src/file", "  good\n"); const greenCommit = commit(temp);
      const green = reading(a, { ...worker, checkout: temp }, greenCommit, 0, 'require("./tests/check.cjs")');
      const suffix = '\n### Correction — bind final body\n\n```mutant\ncorrection: bind final body\nfile: src/file\nspec: tests/check.cjs\nbody: final body identity\nmessage: final body identity\n--- old\n  good\n--- new\n  product candidate\n```\n';
      const parsed: any = readMutantBlocks(suffix); expect("problem" in parsed).toBe(false);
      const correction = { correction: "bind final body", role: "product", blockDigest: qualifiedReviewDigest(parsed.blocks[0]), bodyHash: nativeSha256(body), red, green };
      expect(handleNativeEvent(fx.product, fx.verifierEvent("PreToolUse", "final-body")).disposition).toBe("pre-admitted");
      writeVerdict(fx, bound, prepared, sealed, (p: any) => ({ ...p, corrections: [correction] }), suffix);
      put(fx.productBench, "tests/check.cjs", body); const bodyCommit = commit(fx.productBench);
      if (mode === "changed") { put(fx.productBench, "tests/check.cjs", body + "// changed after measured historical body\n"); commit(fx.productBench); }
      if (mode === "removed") { rmSync(path.join(fx.productBench, "tests/check.cjs")); commit(fx.productBench); }
      expect(handleNativeEvent(fx.product, fx.verifierEvent("PostToolUse", "final-body")).disposition).toBe("post-clean");
      expect(fx.finish(start.record.attempt).record.state).toBe("finished");
      let refusal = "";
      try {
        const got: any = await collectRun(fx.product, { attempt: start.record.attempt, ref: fx.verifierRefs() });
        accepted.push(mode);
        expect(got.collected.review.corrections[0].bodyCommit).toBe(bodyCommit);
        expect(got.collected.review.corrections[0].bodyHash).toBe(nativeSha256(readFileSync(path.join(fx.productBench, "tests/check.cjs"))));
      } catch (error) { refusal = String((error as any).code ?? error); }
      expect(refusal, mode).toBe(mode === "unchanged" ? "" : "QUALIFIED_REVIEW_CORRECTION_BODY");
    } finally { fx.cleanup(); }
  }
  expect(accepted).toEqual(["unchanged"]);
});

test("qualified preparation preserves a quoted guarded tier from the frozen contract", async () => {
  const fx = await reviewed(false, "quoted-guarded");
  try {
    const prepared = await fx.prepare();
    expect(prepared.preparation.authority.tier).toBe("guarded");
    expect(prepared.phase1).toContain("tier guarded");
  } finally { fx.cleanup(); }
});

test("qualified ceremony uses canonical YAML formatting and refuses unreadable tier data", async () => {
  const tier = (fields: string) => qualifiedReviewTier(`---\n${fields}\n---\n`, CARD);
  for (const fields of ['size: M\ntier: "guarded"', "size: M\ntier: 'guarded' # required ceremony", 'size: "L"', "size: L\ntier: standard"]) {
    expect(await tier(fields), fields).toBe("guarded");
  }
  expect(await tier('size: "M"\ntier: "standard"')).toBe("standard");
  expect(await tier("size: M")).toBe("standard");
  for (const fields of ["size: M\ntier: unknown", "size: M\ntier: [guarded]", "size: M\ntier:", "size: invalid", "size: M\ntier: [", "size: M\nsize: L"]) {
    await expect(tier(fields), fields).rejects.toThrow(/QUALIFIED_REVIEW_PRIVATE_AUTHORITY/);
  }
  await expect(qualifiedReviewTier("missing frontmatter", CARD)).rejects.toThrow(/QUALIFIED_REVIEW_PRIVATE_AUTHORITY/);
});

test("qualified review validates full commit types and shapes before normal output identity reads", async () => {
  const valid = "a".repeat(40), wide = "b".repeat(64);
  expect(isQualifiedCommitId(valid, "sha1")).toBe(true);
  expect(isQualifiedCommitId(wide, "sha256")).toBe(true);
  expect(isQualifiedCommitId(wide, "sha1")).toBe(false);
  expect(isQualifiedCommitId(valid, "unknown")).toBe(false);
  expect(qualifiedReviewCommitId(valid)).toBe(valid);
  expect(() => qualifiedReviewCommitId(wide, "sha256")).toThrow(/QUALIFIED_REVIEW_OBJECT_FORMAT/);
  const invalid = [undefined, null, false, 12, {}, [], "", "short", "a".repeat(39), "a".repeat(41), wide, "A".repeat(40), ` ${valid}`, `${valid}\n`];
  for (const value of invalid) expect(() => qualifiedReviewCommitId(value)).toThrow(/QUALIFIED_REVIEW_COMMIT_ID/);
  const fx = await reviewed();
  try {
    const prepared = await fx.prepare(), a = prepared.preparation.authority, worker = a.workers.find((w: any) => w.role === "product");
    for (const value of invalid) expect(() => qualifiedOutputIdentity(a, worker, value as any)).toThrow(/QUALIFIED_REVIEW_COMMIT_ID/);
    expect(() => qualifiedOutputIdentity(a, { ...worker, base: "short" }, worker.candidate)).toThrow(/QUALIFIED_REVIEW_COMMIT_ID/);
    const tree = git(worker.checkout, ["rev-parse", `${worker.candidate}^{tree}`]);
    expect(() => qualifiedOutputIdentity(a, worker, tree)).toThrow(/QUALIFIED_REVIEW_COMMIT_ID/);
    expect(qualifiedOutputIdentity(a, worker, worker.candidate).commit).toBe(worker.candidate);
  } finally { fx.cleanup(); }
});

test("qualified implementation projection refuses mixed-class renames and preserves same-class raw events", async () => {
  await loadQualifiedReservations();
  for (const [from, to, outcome] of [
    ["rules/from.md", "docs/tasks/to.md", "refuse"], ["docs/tasks/from.md", "rules/to.md", "refuse"],
    ["rules/from.md", "rules/excluded/to.md", "refuse"], ["rules/excluded/from.md", "rules/to.md", "refuse"],
    ["rules/from.md", "rules/to.md", "retain"], ["docs/tasks/from.md", "docs/tasks/to.md", "omit"],
    ["rules/excluded/from.md", "rules/excluded/to.md", "omit"], ["docs/tasks/from.md", "rules/excluded/to.md", "omit"],
  ] as const) {
    const fx = projectionFixture(from);
    try {
      const before = qualifiedOutputIdentity(fx.authority, fx.worker, fx.base);
      mkdirSync(path.dirname(path.join(fx.repo, to)), { recursive: true }); renameSync(path.join(fx.repo, from), path.join(fx.repo, to));
      const final = commit(fx.repo), raw = fx.raw(final), entries = parseNativeRawDiff(raw);
      expect(entries).toHaveLength(1); expect(entries[0]!.status).toBe("R100"); expect(entries[0]!.paths).toEqual([from, to]);
      expect(existsSync(path.join(fx.repo, from))).toBe(false); expect(existsSync(path.join(fx.repo, to))).toBe(true);
      console.info("ordinary projection rename", JSON.stringify({ from, to, outcome, base: fx.base, final, raw: raw.toString("utf8"), entries }));
      if (outcome === "refuse") expect(() => qualifiedOutputIdentity(fx.authority, fx.worker, final)).toThrow(/QUALIFIED_REVIEW_PROJECTION_CROSS_CLASS/);
      else {
        const after = qualifiedOutputIdentity(fx.authority, fx.worker, final);
        expect(after.commit).toBe(final); expect(after.tree).toBe(git(fx.repo, ["rev-parse", `${final}^{tree}`]));
        expect(after.implementation).toEqual(outcome === "retain" ? entries : []);
        if (outcome === "retain") expect(after.projectionDigest).not.toBe(before.projectionDigest);
        else expect(after.projectionDigest).toBe(before.projectionDigest);
      }
    } finally { fx.cleanup(); }
  }
});

test("qualified implementation projection classifies real copies by their changed destination", async () => {
  await loadQualifiedReservations();
  for (const [from, to, included] of [
    ["rules/from.md", "docs/tasks/copy.md", false], ["docs/tasks/from.md", "rules/copy.md", true],
    ["rules/from.md", "rules/excluded/copy.md", false], ["rules/excluded/from.md", "rules/copy.md", true],
    ["rules/from.md", "rules/copy.md", true], ["docs/tasks/from.md", "docs/tasks/copy.md", false],
  ] as const) {
    const fx = projectionFixture(from);
    try {
      const before = qualifiedOutputIdentity(fx.authority, fx.worker, fx.base), original = readFileSync(path.join(fx.repo, from));
      mkdirSync(path.dirname(path.join(fx.repo, to)), { recursive: true }); copyFileSync(path.join(fx.repo, from), path.join(fx.repo, to));
      const final = commit(fx.repo), raw = fx.raw(final, ["-C", "--find-copies-harder"]), entries = parseNativeRawDiff(raw);
      expect(entries).toHaveLength(1); expect(entries[0]!.status).toBe("C100"); expect(entries[0]!.paths).toEqual([from, to]);
      expect(readFileSync(path.join(fx.repo, from))).toEqual(original);
      const projected = qualifiedImplementationProjection(entries, qualifiedReviewPolicy(fx.authority, ["records"]));
      expect(projected).toEqual(included ? entries : []);
      const after = qualifiedOutputIdentity(fx.authority, fx.worker, final);
      expect(after.implementation.length > 0).toBe(included); expect(after.commit).toBe(final);
      if (included) expect(after.projectionDigest).not.toBe(before.projectionDigest);
      else expect(after.projectionDigest).toBe(before.projectionDigest);
      console.info("ordinary projection copy", JSON.stringify({ from, to, included, sourceUnchanged: true, base: fx.base, final, raw: raw.toString("utf8"), entries, projected }));
    } finally { fx.cleanup(); }
  }
  const fx = projectionFixture("rules/from.md");
  try {
    put(fx.repo, "docs/tasks/copy.md", readFileSync(path.join(fx.repo, "rules/from.md"), "utf8"));
    put(fx.repo, "rules/from.md", "Independent implementation edit beside the copy.\n"); const final = commit(fx.repo);
    const raw = fx.raw(final, ["-C", "--find-copies-harder"]), entries = parseNativeRawDiff(raw);
    expect(entries.some((e) => e.status === "C100" && e.newPath === "docs/tasks/copy.md")).toBe(true);
    const projected = qualifiedImplementationProjection(entries, qualifiedReviewPolicy(fx.authority, ["records"]));
    expect(projected).toHaveLength(1); expect(projected[0]!.status).toBe("M"); expect(projected[0]!.paths).toEqual(["rules/from.md"]);
    expect(qualifiedOutputIdentity(fx.authority, fx.worker, final).implementation).toEqual(projected);
    console.info("ordinary projection copy with separate source edit", JSON.stringify({ base: fx.base, final, raw: raw.toString("utf8"), entries, projected }));
  } finally { fx.cleanup(); }
});

test("qualified implementation projection retains implementation mode changes and omits protocol and excluded modes", async () => {
  await loadQualifiedReservations();
  for (const from of ["rules/file.md", "docs/tasks/file.md", "rules/excluded/file.md"]) {
    const fx = projectionFixture(from);
    try {
      const before = qualifiedOutputIdentity(fx.authority, fx.worker, fx.base);
      chmodSync(path.join(fx.repo, from), 0o755); const final = commit(fx.repo), raw = fx.raw(final), entries = parseNativeRawDiff(raw);
      expect(entries).toHaveLength(1); expect(entries[0]!.status).toBe("M");
      expect(entries[0]!.oldMode).toBe("100644"); expect(entries[0]!.newMode).toBe("100755"); expect(entries[0]!.oldObject).toBe(entries[0]!.newObject);
      const after = qualifiedOutputIdentity(fx.authority, fx.worker, final), included = from === "rules/file.md";
      expect(after.implementation).toEqual(included ? entries : []);
      if (included) expect(after.projectionDigest).not.toBe(before.projectionDigest);
      else expect(after.projectionDigest).toBe(before.projectionDigest);
      console.info("ordinary projection mode", JSON.stringify({ from, included, base: fx.base, final, raw: raw.toString("utf8"), entries }));
    } finally { fx.cleanup(); }
  }
});

test("qualified public collection requires matching grades for same-class rename and mode output", async () => {
  for (const [change, gradeCase] of [["rename", "stale"], ["rename", "matching"], ["mode", "stale"], ["mode", "matching"]] as const) {
    const fx = await reviewed(false, "projection-grades");
    try {
      const prepared = await fx.prepare(), sealed = await fx.seal(prepared), authority = prepared.preparation.authority;
      const start: any = await startRun(fx.product, { assignment: fx.selectVerifier() }), bound = fx.bindVerifier(start.record.attempt);
      const worker = authority.workers.find((w: any) => w.role === "records"), from = "rules/projection.md", to = "rules/renamed.md";
      git(fx.recordsBench, ["config", "core.filemode", "true"]);
      expect(handleNativeEvent(fx.product, fx.verifierEvent("PreToolUse", "ordinary-output")).disposition).toBe("pre-admitted");
      if (change === "rename") renameSync(path.join(fx.recordsBench, from), path.join(fx.recordsBench, to));
      else chmodSync(path.join(fx.recordsBench, from), 0o755);
      const changedCommit = commit(fx.recordsBench), identity = qualifiedOutputIdentity(authority, worker, changedCommit);
      const event = identity.implementation.find((entry: any) => entry.paths.includes(from));
      expect(event?.status).toBe(change === "rename" ? "R100" : "M");
      expect(event?.paths).toEqual(change === "rename" ? [from, to] : [from]);
      if (change === "mode") expect([event.oldMode, event.newMode, event.oldObject === event.newObject]).toEqual(["100644", "100755", true]);
      expect(identity.projectionDigest).not.toBe(qualifiedOutputIdentity(authority, worker, fx.candidates.records).projectionDigest);
      writeVerdict(fx, bound, prepared, sealed, (payload: any) => ({ ...payload,
        grades: payload.grades.map((grade: any) => grade.role === "records" && gradeCase === "matching" ? reading(authority, worker, changedCommit) : grade) }));
      expect(handleNativeEvent(fx.product, fx.verifierEvent("PostToolUse", "ordinary-output")).disposition).toBe("post-clean");
      expect(fx.finish(start.record.attempt).record.state).toBe("finished");
      if (gradeCase === "stale") {
        await expect(collectRun(fx.product, { attempt: start.record.attempt, ref: fx.verifierRefs() })).rejects.toMatchObject({ code: "QUALIFIED_REVIEW_UNGRADED_OUTPUT" });
        expect((await readQualifiedReservation(fx.product, start.record.attempt))?.identity).toBe(start.reservation.identity);
        expect((readRecord(fx.product, start.record.attempt).native as any).qualified.collection).toBeUndefined();
        continue;
      }
      const result: any = await collectRun(fx.product, { attempt: start.record.attempt, ref: fx.verifierRefs() });
      const output = result.collected.review.actualOutputs.find((item: any) => item.role === "records");
      expect(output.implementation).toEqual(identity.implementation);
      expect(output.projectionDigest).toBe(identity.projectionDigest);
      expect(output.commit).toBe(git(fx.recordsBench, ["rev-parse", "HEAD"]));
      expect(output.tree).toBe(git(fx.recordsBench, ["rev-parse", "HEAD^{tree}"]));
      expect(result.collected.review.grades.find((grade: any) => grade.role === "records")).toMatchObject({ commit: changedCommit, projectionDigest: identity.projectionDigest, exit: 0 });
      expect(result.collected.review.actualOutputGrades.find((grade: any) => grade.role === "records")).toMatchObject({ commit: output.commit, tree: output.tree, projectionDigest: identity.projectionDigest, exit: 0 });
      expect(await readQualifiedReservation(fx.product, start.record.attempt)).toBeNull();
    } finally { fx.cleanup(); }
  }
});
