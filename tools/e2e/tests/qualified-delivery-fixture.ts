/** Ordinary canonical fixture setup reused from delivered verification examples; no proof tests are imported or rerun. */
import { execFileSync, spawnSync } from "node:child_process";
import { chmodSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, renameSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { expect } from "@playwright/test";
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
export function git(root: string, args: string[]) {
  return execFileSync("git", ["-C", root, ...NO_BACKGROUND_MAINTENANCE, ...args], { encoding: "utf8", env: ENV, stdio: ["ignore", "pipe", "pipe"] }).trim();
}
export function put(root: string, file: string, text: string) { mkdirSync(path.dirname(path.join(root, file)), { recursive: true }); writeFileSync(path.join(root, file), text); }
export function commit(root: string) { git(root, ["add", "-A"]); git(root, ["commit", "-qm", "fixture candidate"]); return git(root, ["rev-parse", "HEAD"]); }
// Pure projection input fixtures do not publish or acquire run authority.
function projectionFixture(from: string) {
  const dir = realpathSync(mkdtempSync(path.join(os.tmpdir(), "projection-T-355-"))), repo = path.join(dir, "records");
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
  return { repo, base, authority, worker, raw, cleanup: () => removeGitFixture(dir, "ordinary projection T-355") };
}
function fixture(colocated = false, change = "mixed",context:{review?:string,settings?:string,foundation?:boolean,productFiles?:Record<string,string>,recordsFiles?:Record<string,string>}={}) {
  const dir = realpathSync(mkdtempSync(path.join(os.tmpdir(), "verification-T-355-")));
  const product = path.join(dir, "product"), records = colocated ? product : path.join(dir, "records");
  for (const root of new Set([product, records])) {
    mkdirSync(root); git(root, ["init", "-q", "--initial-branch=main"]);
    put(root, "src/file", "product base\n"); put(root, "rules/file", "records base\n");
    put(root, ".gitignore", ".supertaskr/\n*.ignored\n"); commit(root);
  }
  put(product, "tests/README", "fixture correction bodies live here\n"); commit(product);
  put(product, "method/roles/verifier.md", readFileSync(path.join(SOURCE, "method/roles/verifier.md"), "utf8"));
  put(product, "method/runtime/process-schema.yaml", readFileSync(path.join(SOURCE, "method/runtime/process-schema.yaml"), "utf8")); commit(product);
  if(context.settings){put(product,"supertaskr.yaml",context.settings);commit(product);}
  if(context.productFiles){for(const [file,text] of Object.entries(context.productFiles))put(product,file,text);commit(product);}
  if(context.foundation)for(const name of ["NORTH_STAR","ROADMAP","ARCHITECTURE","CONVENTIONS","STATE"])put(records,`docs/${name}.md`,readFileSync(path.join(SOURCE,"method/docs-templates",`${name}.md`),"utf8"));
  if(context.recordsFiles)for(const [file,text] of Object.entries(context.recordsFiles))put(records,file,text);
  if (!colocated) put(product, WORKSPACE_BINDING_REL_PATH, JSON.stringify({ version: 1, projectId: "qualified-fixture", productRoot: product, recordsRoot: records }));
  const identity = measureProductIdentity(product);
  put(records, WORKSPACE_ASSOCIATION_REL_PATH, JSON.stringify({ version: 1, projectId: "qualified-fixture", product: { objectFormat: identity.objectFormat, rootCommits: identity.rootCommits } }));
  const text = '---\nid: T-999\ntitle: Qualified fixture\nfeature: F-04\nmilestone: 4\npriority: 1\nsize: M\nstatus: building\ntouches: ["product::src", "product::tests", "records::rules", "records::docs/architecture/components"]\n---\n\nFrozen private contract.\n\n## Acceptance criteria\n\n- WHEN built THE executor SHALL retain both roots.\n\n## Implementation notes\n\nPRIVATE_T355_HISTORY\n\n## Verdicts\n';
  let contract = change === "guarded" ? text.replace("size: M", "size: L\ntier: guarded") : text;
  if(context.review)contract=contract.replace("status: building",`status: building\nreview: ${context.review}`);
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
    model: "gpt-6.1-sol", effort: "xhigh", base: productBase, brief: path.join(dir, "brief-T-355.md"), deadline: "none", budget: "none",
    admission: { kind: "explicit", parent: "", evidence: "", scope: "implementation" },
    native: { taskName: "/root/fixture_T355", sessionId: "session-T355", coordinatorTurnId: "parent-T355", ignoredOutputs: [] }, qualified };
  if (change === "records") Object.assign(assignment, { resource: recordsWorker, cwd: recordsWorker, base: recordsBase });
  put(dir, "brief-T-355.md", "Fixture native executor; no model or owned job is launched.\n");
  put(product, ".supertaskr/.gitignore", RUNTIME_DIR_IGNORE);
  function selected() { put(dir, "assignment-T-355.json", JSON.stringify(assignment)); return readAssignment(path.join(dir, "assignment-T-355.json")); }
  function refs() { return JSON.stringify(Object.fromEntries(qualified.workers.map((w: any) => [w.role, git(w.checkout, ["rev-parse", "HEAD"])]))); }
  function event(name: string, toolId = "action-T355", command = `cd -- ${nativeShellQuote(productWorker)} && true`, agent = "agent-T355", turn = "turn-T355") {
    return { hook_event_name: name, agent_id: agent, session_id: "session-T355", turn_id: turn, tool_name: "Bash", tool_use_id: toolId, tool_input: { command } };
  }
  function bind(attempt: string, agent = "agent-T355", turn = "turn-T355") {
    expect(handleNativeEvent(product, event("SubagentStart", "start", "", agent, turn)).disposition).toBe("start-recorded");
    expect(handleNativeEvent(product, event("PreToolUse", "probe", NATIVE_IDENTITY_PROBE, agent, turn)).disposition).toBe("identity-probe-pre");
    expect(handleNativeEvent(product, { ...event("PostToolUse", "probe", NATIVE_IDENTITY_PROBE, agent, turn), tool_response: agent }).disposition).toBe("identity-probe-post");
    return bindRun(product, { attempt, harnessId: agent });
  }
  function finish(attempt: string) { return observeRun(product, { attempt, evidence: "Actual fixture harness final notification.\nRUN-DONE ok" }); }
  return { dir, product, records, productWorker, recordsWorker, assignment, qualified, grant, selected, refs, event, bind, finish,
    cleanup: () => removeGitFixture(dir, "qualified native T-355") };
}

export async function reviewed(colocated = false, change = "mixed",context:{review?:string,settings?:string,foundation?:boolean,productFiles?:Record<string,string>,recordsFiles?:Record<string,string>}={}) {
  const fx = fixture(colocated, change,context);
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
    native: { ...assignment.native, profile: "detached-verifier", executorAttempt: started.record.attempt, taskName: "/root/verifier_T355" } });
  assignment.qualified.workers = [{ role: "product", checkout: productBench, base: fx.qualified.revisions.product, candidate: candidates.product },
    { role: "records", checkout: recordsBench, base: fx.qualified.revisions.records, candidate: candidates.records }];
  assignment.qualified.verification = { executorAttempt: started.record.attempt, preparationDigest: "" };
  function selected() { put(fx.dir, "verifier-T-355.json", JSON.stringify(assignment)); return readAssignment(path.join(fx.dir, "verifier-T-355.json")); }
  function refs() { return JSON.stringify({ product: git(productBench, ["rev-parse", "HEAD"]), records: git(recordsBench, ["rev-parse", "HEAD"]) }); }
  async function prepare() {
    const inputs: any = nativeBenchAssignmentInputs(fx.product, { attempt: started.record.attempt, assignment: selected(), ref: JSON.stringify(candidates) });
    const prepared: any = await prepareNativeBenchRun(fx.product, { attempt: started.record.attempt, ...inputs });
    assignment.qualified.verification.preparationDigest = prepared.preparation.digest;
    return prepared;
  }
  async function seal(prepared: any) {
    const attackSetFile = path.join(fx.dir, "attacks-T-355.md"); writeFileSync(attackSetFile, "Attack the complete candidate pair and every criterion.\n");
    return sealQualifiedVerification(fx.product, { executorAttempt: started.record.attempt, preparationDigest: prepared.preparation.digest, attackSetFile });
  }
  function event(name: string, id = "verify-T355", command = `cd -- ${nativeShellQuote(productBench)} && true`) {
    return fx.event(name, id, command, "verifier-T355");
  }
  function bind(attempt: string) { return fx.bind(attempt, "verifier-T355"); }
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

export function reading(authority: any, worker: any, commitRef: string, expected = 0, code = 'require("node:assert").ok(true)') {
  const identity = qualifiedOutputIdentity(authority, worker, commitRef);
  const ran = spawnSync(process.execPath, ["-e", code], { cwd: worker.checkout, encoding: "utf8" });
  expect(ran.status).toBe(expected);
  const output = `${ran.stdout}${ran.stderr}\ngate-verdict suite=fixture exit=${ran.status} bodies=1 targets=1 ref=${commitRef} verdict=${expected === 0 ? "GREEN" : "RED"}\n`;
  return { role: worker.role, commit: commitRef, tree: identity.tree, projectionDigest: identity.projectionDigest,
    exit: ran.status, bodies: 1, command: `${process.execPath} -e ${code}`, output, outputDigest: nativeSha256(output) };
}

export function writeVerdict(fx: any, run: any, prepared: any, sealed: any, adjust = (p: any) => p, suffix = "") {
  const authority = prepared.preparation.authority;
  const payload = adjust({ preparationDigest: prepared.preparation.digest, sealDigest: sealed.seal.digest, candidates: fx.candidates,
    criteria: [{ criterion: 1, evidence: "Complete qualified public lifecycle checked in owned real Git fixtures." }],
    frame: { agentId: "verifier-T355", taskName: run.native.launch.taskName, sessionId: run.native.launch.sessionId,
      requestedModel: run.assignment.model, requestedEffort: run.assignment.effort, observed: run.execution.observed,
      limitations: "Fixture callbacks and actual child assertions; no new live-model or cross-harness campaign." },
    corrections: [], grades: authority.workers.map((w: any) => reading(authority, w, fx.candidates[w.role])) });
  const original = readFileSync(path.join(fx.recordsBench, CARD), "utf8");
  put(fx.recordsBench, CARD, `${original}\n### 2026-10-27 — APPROVED — fixture verifier\n\nComplete-set verdict.\n\n\x60\x60\x60qualified-verdict\n${JSON.stringify(payload)}\n\x60\x60\x60\n${suffix}`);
  commit(fx.recordsBench);
  return payload;
}
