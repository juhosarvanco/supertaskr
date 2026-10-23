import { execFileSync, spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, renameSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { RUNTIME_DIR_IGNORE } from "../../../.claude/hooks/lane-fence.mjs";
import { composeGrantSnapshot, PAUSE_REL_PATH } from "../scripts/dispatch-brief.mjs";
import { captureQualifiedInputs } from "../scripts/qualified-reservation.mjs";
import { admissionPreflight } from "../scripts/qualified-admission.mjs";
import { acquireQualifiedReservation, bindRun, collectRun, continueRun, observeRun, readAssignment, readQualifiedReservation, readRecord,
  releaseQualifiedReservation, sendAnswer, startRun, stopRun, takeReservation, writeRecord } from "../scripts/run-record.mjs";
import { activeNativeHolds, collectNativeWorkspace, handleNativeEvent, NATIVE_CODEX_HARNESS, NATIVE_IDENTITY_PROBE,
  nativeShellQuote, withNativeDurabilityObserver } from "../scripts/native-codex.mjs";
import { nativeRecoveryTarget } from "../scripts/native-transaction-recovery.mjs";
import { measureProductIdentity, WORKSPACE_ASSOCIATION_REL_PATH, WORKSPACE_BINDING_REL_PATH } from "../scripts/workspace.mjs";
import { NO_BACKGROUND_MAINTENANCE, removeGitFixture } from "./git-fixture";
import { pathToFileURL } from "node:url";

const SOURCE = path.resolve(import.meta.dirname, "../../..");
const CARD = "docs/tasks/T-999-private.md";
const ENV = { ...process.env, GIT_AUTHOR_NAME: "Qualified fixture", GIT_AUTHOR_EMAIL: "fixture.invalid",
  GIT_COMMITTER_NAME: "Qualified fixture", GIT_COMMITTER_EMAIL: "fixture.invalid" };
function git(root: string, args: string[]) {
  return execFileSync("git", ["-C", root, ...NO_BACKGROUND_MAINTENANCE, ...args], { encoding: "utf8", env: ENV, stdio: ["ignore", "pipe", "pipe"] }).trim();
}
function put(root: string, file: string, text: string) { mkdirSync(path.dirname(path.join(root, file)), { recursive: true }); writeFileSync(path.join(root, file), text); }
function commit(root: string) { git(root, ["add", ".", ":(exclude).supertaskr"]); git(root, ["commit", "-qm", "fixture candidate"]); return git(root, ["rev-parse", "HEAD"]); }
function fixture(colocated = false) {
  const dir = realpathSync(mkdtempSync(path.join(os.tmpdir(), "qualified-T-353-")));
  const product = path.join(dir, "product"), records = colocated ? product : path.join(dir, "records");
  for (const root of new Set([product, records])) {
    mkdirSync(root); git(root, ["init", "-q", "--initial-branch=main"]);
    put(root, "src/file", "product base\n"); put(root, "rules/file", "records base\n");
    put(root, ".gitignore", ".supertaskr/\n*.ignored\n"); commit(root);
  }
  put(product, "method/runtime/process-schema.yaml", readFileSync(path.join(SOURCE, "method/runtime/process-schema.yaml"), "utf8")); commit(product);
  if (!colocated) put(product, WORKSPACE_BINDING_REL_PATH, JSON.stringify({ version: 1, projectId: "qualified-fixture", productRoot: product, recordsRoot: records }));
  const identity = measureProductIdentity(product);
  put(records, WORKSPACE_ASSOCIATION_REL_PATH, JSON.stringify({ version: 1, projectId: "qualified-fixture", product: { objectFormat: identity.objectFormat, rootCommits: identity.rootCommits } }));
  const text = '---\nid: T-999\ntitle: Qualified fixture\nfeature: F-04\nmilestone: 4\npriority: 1\nsize: M\nstatus: building\ntouches: ["product::src/file", "records::rules/file"]\n---\n\nFrozen private contract.\n\n## Acceptance criteria\n\n- WHEN built THE executor SHALL retain both roots.\n\n## Implementation notes\n\nPRIVATE_T353_HISTORY\n\n## Verdicts\n';
  put(records, CARD, text);
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
  const assignment: any = { kind: "card", id: "T-999", role: "executor", resource: productWorker, cwd: productWorker, harness: NATIVE_CODEX_HARNESS,
    model: "gpt-6.1-sol", effort: "xhigh", base: productBase, brief: path.join(dir, "brief-T-353.md"), deadline: "none", budget: "none",
    admission: { kind: "explicit", parent: "", evidence: "", scope: "implementation" },
    native: { taskName: "/root/fixture_T353", sessionId: "session-T353", coordinatorTurnId: "parent-T353", ignoredOutputs: [] }, qualified };
  put(dir, "brief-T-353.md", "Fixture native executor; no model or owned job is launched.\n");
  put(product, ".supertaskr/.gitignore", RUNTIME_DIR_IGNORE);
  function selected() { put(dir, "assignment-T-353.json", JSON.stringify(assignment)); return readAssignment(path.join(dir, "assignment-T-353.json")); }
  function refs() { return JSON.stringify({ product: git(productWorker, ["rev-parse", "HEAD"]), records: git(recordsWorker, ["rev-parse", "HEAD"]) }); }
  function event(name: string, toolId = "action-T353", command = `cd -- ${nativeShellQuote(productWorker)} && true`, agent = "agent-T353", turn = "turn-T353") {
    return { hook_event_name: name, agent_id: agent, session_id: "session-T353", turn_id: turn, tool_name: "Bash", tool_use_id: toolId, tool_input: { command } };
  }
  function bind(attempt: string, agent = "agent-T353", turn = "turn-T353") {
    expect(handleNativeEvent(product, event("SubagentStart", "start", "", agent, turn)).disposition).toBe("start-recorded");
    expect(handleNativeEvent(product, event("PreToolUse", "probe", NATIVE_IDENTITY_PROBE, agent, turn)).disposition).toBe("identity-probe-pre");
    expect(handleNativeEvent(product, { ...event("PostToolUse", "probe", NATIVE_IDENTITY_PROBE, agent, turn), tool_response: agent }).disposition).toBe("identity-probe-post");
    return bindRun(product, { attempt, harnessId: agent });
  }
  function finish(attempt: string) { return observeRun(product, { attempt, evidence: "Actual fixture harness final notification.\nRUN-DONE ok" }); }
  return { dir, product, records, productWorker, recordsWorker, assignment, qualified, grant, selected, refs, event, bind, finish,
    cleanup: () => removeGitFixture(dir, "qualified native T-353") };
}

test("qualified public executor lifecycle has no product card, unions colocated aliases, inspects both roots and collects exact pairs", async () => {
  for (const colocated of [false, true]) {
    const fx = fixture(colocated);
    try {
      if (!colocated) expect(existsSync(path.join(fx.productWorker, CARD))).toBe(false);
      const started: any = await startRun(fx.product, { assignment: fx.selected() });
      const attempt = started.record.attempt;
      expect(started.reservation.scope.workers).toHaveLength(colocated ? 1 : 2);
      expect(started.record.native.qualified.origins.receipt).toEqual(fx.qualified.receipt);
      expect(started.record.native.qualified.origins.admission.scope).toBe("product-change");
      expect(JSON.stringify(started.record)).not.toContain("PRIVATE_T353_HISTORY");
      expect(fx.bind(attempt).execution?.observed?.model).toBe("unknown");
      expect(handleNativeEvent(fx.product, fx.event("PreToolUse")).disposition).toBe("pre-admitted");
      put(fx.productWorker, "src/file", "product candidate\n"); put(fx.recordsWorker, "rules/file", "records candidate\n");
      expect(handleNativeEvent(fx.product, fx.event("PostToolUse")).disposition).toBe("post-clean");
      const roots = new Set([fx.productWorker, fx.recordsWorker]); for (const root of roots) commit(root);
      const patch = { ...fx.event("PreToolUse", "patch"), tool_name: "apply_patch", tool_input: { command: `*** Update File: ${fx.recordsWorker}/rules/file\n` } };
      expect(handleNativeEvent(fx.product, patch).disposition).toBe("pre-admitted");
      expect(handleNativeEvent(fx.product, { ...patch, hook_event_name: "PostToolUse" }).disposition).toBe("post-clean");
      expect(fx.finish(attempt).record.state).toBe("finished");
      expect(await readQualifiedReservation(fx.product, attempt)).not.toBeNull();
      const got = collectRun(fx.product, { attempt, ref: fx.refs(), report: "fixture report" });
      expect(got.collected.refs).toEqual(expect.arrayContaining([`product:${git(fx.productWorker, ["rev-parse", "HEAD"])}`, `records:${git(fx.recordsWorker, ["rev-parse", "HEAD"])}`]));
      expect(await readQualifiedReservation(fx.product, attempt)).toBeNull();
      expect(got.record.native?.qualified.collection.phase).toBe("final");
    } finally { fx.cleanup(); }
  }
});

test("qualified admission translates implementation and refuses unknown scope, private missing approved bytes, pause, revocation and decisive drift before reservation", async () => {
  const fx = fixture();
  try {
    const none = async () => expect(await readQualifiedReservation(fx.product, "T-999-a1")).toBeNull();
    fx.assignment.admission.scope = "unknown";
    await expect(startRun(fx.product, { assignment: fx.selected() })).rejects.toMatchObject({ code: "QUALIFIED_SCOPE_UNMAPPED" }); await none();
    fx.assignment.admission.scope = "implementation";
    fx.grant("0".repeat(40));
    await expect(startRun(fx.product, { assignment: fx.selected() })).rejects.toMatchObject({ code: "preflight-approved-bytes-unavailable" }); await none();
    fx.grant(undefined, true);
    await expect(startRun(fx.product, { assignment: fx.selected() })).rejects.toBeTruthy(); await none();
    fx.grant();
    put(fx.product, PAUSE_REL_PATH, JSON.stringify({ version: 1, scope: "all", by: "fixture owner", at: "2026-10-24T00:00:00Z", why: "control" }));
    await expect(startRun(fx.product, { assignment: fx.selected() })).rejects.toBeTruthy(); await none();
    rmSync(path.join(fx.product, PAUSE_REL_PATH));
    const drifted = { assignment: fx.selected(), transaction: { onAcquired: () => fx.grant(undefined, false, 4) } };
    await expect(startRun(fx.product, drifted)).rejects.toMatchObject({ code: "preflight-decisive-drift" }); await none();
    fx.grant();
    const started: any = await startRun(fx.product, { assignment: fx.selected() });
    expect(started.record.admission.admitted).toBe(true);
  } finally { fx.cleanup(); }
});

test("qualified complete acquisition rolls back dirty second root and exposes reservation-before-record failures by exact attempt", async () => {
  const fx = fixture();
  try {
    put(fx.recordsWorker, "rules/file", "dirty\n");
    await expect(startRun(fx.product, { assignment: fx.selected() })).rejects.toMatchObject({ code: "QUALIFIED_ADMISSION_DIRTY" });
    expect(await readQualifiedReservation(fx.product, "T-999-a1")).toBeNull();
    git(fx.recordsWorker, ["restore", "rules/file"]);
    let failed = false;
    await expect(withNativeDurabilityObserver((info) => {
      if (!failed && info.stage === "before-rename" && info.file?.endsWith("T-999-a1.json")) { failed = true; throw new Error("fixture record publication failure"); }
    }, () => startRun(fx.product, { assignment: fx.selected() }))).rejects.toBeTruthy();
    expect(failed).toBe(true);
    expect(await readQualifiedReservation(fx.product, "T-999-a1")).toBeNull();
    const request = { ...fx.qualified, attempt: "T-999-a1" };
    const orphan = await acquireQualifiedReservation(fx.product, request);
    expect((await readQualifiedReservation(fx.product, request.attempt)).identity).toBe(orphan.reservation.identity);
    await expect(startRun(fx.product, { assignment: fx.selected() })).rejects.toMatchObject({ code: "QUALIFIED_ORPHAN_REQUIRES_RECONCILIATION" });
    await expect(releaseQualifiedReservation(fx.product, { attempt: request.attempt, expectedIdentity: `sha256:${"0".repeat(64)}` })).rejects.toMatchObject({ code: "QUALIFIED_NOT_OURS" });
    expect(await releaseQualifiedReservation(fx.product, { attempt: request.attempt, expectedIdentity: orphan.reservation.identity })).toBe(true);
    const script = `import { readAssignment, startRun } from ${JSON.stringify(pathToFileURL(path.join(SOURCE, "tools/e2e/scripts/run-record.mjs")).href)};
      import { withNativeDurabilityObserver } from ${JSON.stringify(pathToFileURL(path.join(SOURCE, "tools/e2e/scripts/native-codex.mjs")).href)};
      await withNativeDurabilityObserver((event) => { if (event.stage === "before-rename" && event.file.endsWith("T-999-a1.json")) process.exit(77); },
        () => startRun(process.argv[1], { assignment: readAssignment(process.argv[2]) }));`;
    const crashed = spawnSync(process.execPath, ["--input-type=module", "-e", script, fx.product, path.join(fx.dir, "assignment-T-353.json")], { env: ENV, encoding: "utf8" });
    expect(crashed.status).toBe(77);
    expect((await readQualifiedReservation(fx.product, request.attempt)).identity).toBe(orphan.reservation.identity);
    expect(existsSync(path.join(fx.product, ".supertaskr/runs/T-999/T-999-a1.json"))).toBe(false);
  } finally { fx.cleanup(); }
});

test("qualified private input controls refuse blank approval, absent current card, invalid receipt and wrong project without launch authority", async () => {
  const fx = fixture();
  try {
    const blank = execFileSync("git", ["-C", fx.records, "hash-object", "-w", "--stdin"], { encoding: "utf8", input: "", env: ENV }).trim();
    fx.grant(blank);
    await expect(startRun(fx.product, { assignment: fx.selected() })).rejects.toMatchObject({ code: "preflight-approved-bytes-unavailable" });
    fx.grant();
    fx.assignment.qualified.projectId = "wrong-project";
    await expect(startRun(fx.product, { assignment: fx.selected() })).rejects.toBeTruthy();
    fx.assignment.qualified.projectId = "qualified-fixture";
    const receipt = structuredClone(fx.assignment.qualified.receipt);
    fx.assignment.qualified.receipt.cardBlobId = "0".repeat(40);
    await expect(startRun(fx.product, { assignment: fx.selected() })).rejects.toMatchObject({ code: "QUALIFIED_RECEIPT_CHANGED" });
    fx.assignment.qualified.receipt = receipt;
    git(fx.records, ["rm", CARD]); const missing = commit(fx.records);
    fx.assignment.qualified.revisions.records = missing; fx.assignment.qualified.workers[1].base = missing;
    await expect(startRun(fx.product, { assignment: fx.selected() })).rejects.toBeTruthy();
    expect(await readQualifiedReservation(fx.product, "T-999-a1")).toBeNull();
  } finally { fx.cleanup(); }
});

test("qualified collection recovers partial final publication only against its original complete set", async () => {
  const fx = fixture();
  try {
    const started: any = await startRun(fx.product, { assignment: fx.selected() }); const attempt = started.record.attempt; fx.bind(attempt); fx.finish(attempt);
    let failed = false;
    expect(() => withNativeDurabilityObserver((info) => {
      if (!failed && info.stage === "before-rename" && info.file.endsWith("T-999-a1.json") && info.temp &&
          JSON.parse(readFileSync(info.temp, "utf8")).native.qualified.collection?.phase === "final") {
        failed = true; throw new Error("fixture crash after exact complete release");
      }
    }, () => collectRun(fx.product, { attempt, ref: fx.refs() }))).toThrow(/fixture crash/);
    expect(failed).toBe(true);
    expect(readRecord(fx.product, attempt).native?.qualified.collection.phase).toBe("ready");
    expect(await readQualifiedReservation(fx.product, attempt)).toBeNull();
    takeReservation(fx.product, { resource: fx.productWorker, attempt: "T-998-a1", role: "executor", at: "2026-10-24T00:00:00Z" });
    expect(collectRun(fx.product, { attempt, ref: fx.refs() }).record.native?.qualified.collection.phase).toBe("final");
  } finally { fx.cleanup(); }
});

test("qualified cold public CLI starts the private route and allowed ignored policies remain scoped in every participant", async () => {
  const fx = fixture();
  try {
    fx.assignment.native.ignoredOutputs = ["build"];
    fx.selected();
    const output = execFileSync(process.execPath, [path.join(SOURCE, "tools/e2e/scripts/brief.mjs"), "--root", fx.product, "--run", "start", "--assignment", path.join(fx.dir, "assignment-T-353.json")], {
      cwd: SOURCE, encoding: "utf8", env: ENV, stdio: ["ignore", "pipe", "pipe"], maxBuffer: 4 * 1024 * 1024,
    });
    expect(output).toContain("T-999-a1"); expect(await readQualifiedReservation(fx.product, "T-999-a1")).not.toBeNull(); fx.bind("T-999-a1");
    for (const root of [fx.productWorker, fx.recordsWorker]) {
      put(root, "build/output.ignored", "allowed ignored output\n");
    }
    expect(collectNativeWorkspace(readRecord(fx.product, "T-999-a1"))).toMatchObject({ clean: true });
    // Cold process continue must preload all async inputs before locking too.
    const continued = execFileSync(process.execPath, [path.join(SOURCE, "tools/e2e/scripts/brief.mjs"), "--root", fx.product, "--run", "continue", "--attempt", "T-999-a1", "--ref", fx.refs(), "--evidence", "Actual final fixture turn.\nRUN-DONE ok"], {
      cwd: SOURCE, encoding: "utf8", env: ENV, stdio: ["ignore", "pipe", "pipe"], maxBuffer: 4 * 1024 * 1024,
    });
    expect(continued).toContain("T-999-a1"); expect(readRecord(fx.product, "T-999-a1").native?.binding).toBeNull();
  } finally { fx.cleanup(); }
});

test("qualified action checks unmentioned root, ignored output, type, mode and both rename endpoints", async () => {
  for (const change of ["other", "ignored", "type", "mode", "rename"]) {
    const fx = fixture();
    try {
      const started: any = await startRun(fx.product, { assignment: fx.selected() }); fx.bind(started.record.attempt);
      expect(handleNativeEvent(fx.product, fx.event("PreToolUse")).disposition).toBe("pre-admitted");
      if (change === "other") put(fx.recordsWorker, "escape", "unmentioned checkout escape\n");
      if (change === "ignored") put(fx.recordsWorker, "escape.ignored", "ignored escape\n");
      if (change === "type") { rmSync(path.join(fx.recordsWorker, "rules/file")); symlinkSync(fx.product, path.join(fx.recordsWorker, "rules/file")); }
      if (change === "mode") chmodSync(path.join(fx.recordsWorker, "src/file"), 0o755);
      if (change === "rename") renameSync(path.join(fx.recordsWorker, "src/file"), path.join(fx.recordsWorker, "rules/moved"));
      expect(handleNativeEvent(fx.product, fx.event("PostToolUse")).disposition).toBe("post-held");
      expect(activeNativeHolds(readRecord(fx.product, started.record.attempt)).length).toBeGreaterThan(0);
    } finally { fx.cleanup(); }
  }
});

test("qualified continuation and replacement retain original bases and complete identity after commits and require exact new turn binding", async () => {
  const fx = fixture();
  try {
    const started: any = await startRun(fx.product, { assignment: fx.selected() }); const attempt = started.record.attempt; fx.bind(attempt);
    put(fx.productWorker, "src/file", "committed before continuation\n"); commit(fx.productWorker);
    const carried = await continueRun(fx.product, { attempt, ref: fx.refs(), evidence: "Actual harness ended the fixture turn.\nRUN-DONE ok" });
    expect(carried.record.native?.binding).toBeNull(); expect(carried.record.native?.qualified.identity).toBe(started.reservation.identity);
    expect(carried.record.native?.qualified.origins.bases).toEqual(fx.qualified.workers);
    expect(() => sendAnswer(fx.product, { attempt, question: "Q1", answer: "wait" })).toThrow();
    fx.bind(attempt, "agent-T353", "continued-T353");
    const next = await continueRun(fx.product, { attempt, replace: true, ref: fx.refs(), evidence: "Actual harness final.\nRUN-DONE ok" });
    expect(next.record.native?.binding).toBeNull();
    fx.bind(attempt, "replacement-T353", "replacement-turn-T353");
    expect(handleNativeEvent(fx.product, fx.event("PreToolUse", "new", undefined, "replacement-T353", "replacement-turn-T353")).disposition).toBe("pre-admitted");
    expect(handleNativeEvent(fx.product, fx.event("PostToolUse", "new", undefined, "replacement-T353", "replacement-turn-T353")).disposition).toBe("post-clean");
    expect(handleNativeEvent(fx.product, fx.event("PreToolUse", "stale", undefined, "replacement-T353", "turn-T353")).disposition).toBe("stale-turn-held");
  } finally { fx.cleanup(); }
});

test("qualified expansion unknown callbacks and actual completion with live jobs retain complete ownership while independent stop releases it", async () => {
  const fx = fixture();
  try {
    const started: any = await startRun(fx.product, { assignment: fx.selected() }); const attempt = started.record.attempt; fx.bind(attempt);
    put(fx.dir, "ask-T-999.md", "RUN-ASK EXPAND1\nNeed wider scope for extra/file.\n");
    observeRun(fx.product, { attempt });
    expect(activeNativeHolds(readRecord(fx.product, attempt)).map((hold: any) => hold.code)).toContain("qualified-expansion-unsupported");
    fx.finish(attempt);
    expect(() => collectRun(fx.product, { attempt, ref: fx.refs() })).toThrow();
    expect(await readQualifiedReservation(fx.product, attempt)).not.toBeNull();
    expect(stopRun(fx.product, { attempt, evidence: "Independent stop after refused expansion.\nRUN-DONE failed" }).record.state).toBe("stopped");
    expect(await readQualifiedReservation(fx.product, attempt)).toBeNull();
    expect(readRecord(fx.product, attempt).native?.holds.some((hold: any) => hold.code === "qualified-expansion-unsupported" && hold.request.includes("wider scope"))).toBe(true);
  } finally { fx.cleanup(); }
  const stopped = fixture();
  try {
    const started: any = await startRun(stopped.product, { assignment: stopped.selected() }); const attempt = started.record.attempt; stopped.bind(attempt);
    handleNativeEvent(stopped.product, stopped.event("SubagentStop"));
    expect(await readQualifiedReservation(stopped.product, attempt)).not.toBeNull();
    const rec = readRecord(stopped.product, attempt); rec.ownedJobs = [{ kind: "pid", id: String(process.pid) }]; writeRecord(stopped.product, rec);
    expect(stopped.finish(attempt).record.state).not.toBe("finished");
    expect(() => collectRun(stopped.product, { attempt, ref: stopped.refs() })).toThrow();
    const ceased = readRecord(stopped.product, attempt); ceased.ownedJobs = []; writeRecord(stopped.product, ceased);
    expect(stopRun(stopped.product, { attempt, evidence: "Actual independent stop and jobs gone.\nRUN-DONE failed" }).record.state).toBe("stopped");
    expect(await readQualifiedReservation(stopped.product, attempt)).toBeNull();
    expect(() => collectRun(stopped.product, { attempt, ref: stopped.refs() })).toThrow(/ACTUAL_FINAL/);
  } finally { stopped.cleanup(); }
});

test("qualified final collection refuses stale per-root pairs and late changes; completed exact retry leaves a later owner untouched", async () => {
  for (const late of ["workspace", "callback"]) {
  const fx = fixture();
  try {
    const started: any = await startRun(fx.product, { assignment: fx.selected() }); const attempt = started.record.attempt; fx.bind(attempt);
    const stale = fx.refs(); put(fx.recordsWorker, "rules/file", "candidate\n"); commit(fx.recordsWorker); fx.finish(attempt);
    expect(() => collectRun(fx.product, { attempt, ref: stale })).toThrow(/HELD/);
    let changed = false;
    expect(() => withNativeDurabilityObserver((info) => {
      if (!changed && info.stage === "rename" && info.file?.endsWith("T-999-a1.json")) {
        changed = true;
        if (late === "workspace") put(fx.recordsWorker, "rules/file", "late workspace change\n");
        else handleNativeEvent(fx.product, fx.event("PreToolUse", "late-callback"));
      }
    }, () => collectRun(fx.product, { attempt, ref: fx.refs() }))).toThrow(/LATE_CHANGE/);
    expect(changed).toBe(true); expect(await readQualifiedReservation(fx.product, attempt)).not.toBeNull();
    git(fx.recordsWorker, ["restore", "rules/file"]);
    const final = collectRun(fx.product, { attempt, ref: fx.refs() });
    takeReservation(fx.product, { resource: fx.productWorker, attempt: "T-998-a1", role: "executor", at: "2026-10-24T00:00:00Z" });
    put(fx.productWorker, "escape", "later owner's file\n");
    expect(collectRun(fx.product, { attempt, ref: fx.refs() }).collected).toEqual(final.collected);
    expect(() => collectRun(fx.product, { attempt, ref: stale })).toThrow(/RETRY_CHANGED/);
  } finally { fx.cleanup(); }
  }
});

test("qualified scope cannot fall back through unknown fields or legacy verifier and transaction recovery consumers", async () => {
  const fx = fixture();
  try {
    fx.assignment.qualified.callerFence = ["escape"];
    expect(() => fx.selected()).toThrow(/SHAPE/); delete fx.assignment.qualified.callerFence;
    const started: any = await startRun(fx.product, { assignment: fx.selected() }); fx.bind(started.record.attempt);
    expect(handleNativeEvent(fx.product, { ...fx.event("PreToolUse", "patch-escape"), tool_name: "apply_patch", tool_input: { command: `*** Add File: ${fx.recordsWorker}/escape\n` } }).disposition).toBe("pre-held");
    const retained = readRecord(fx.product, started.record.attempt);
    retained.permission.digest = "changed"; writeRecord(fx.product, retained);
    expect(() => collectNativeWorkspace(readRecord(fx.product, started.record.attempt))).toThrow(/RETAINED_AUTHORITY/);
    retained.permission.digest = started.record.permission.digest; writeRecord(fx.product, retained);
    expect(collectNativeWorkspace(readRecord(fx.product, started.record.attempt)).clean).toBe(true);
    retained.native!.qualified.unknownAuthority = true; writeRecord(fx.product, retained);
    expect(() => collectNativeWorkspace(readRecord(fx.product, started.record.attempt))).toThrow(/SHAPE/);
    delete retained.native!.qualified.unknownAuthority;
    retained.native!.launch.sessionId = "replacement-without-authority"; writeRecord(fx.product, retained);
    expect(() => collectNativeWorkspace(readRecord(fx.product, started.record.attempt))).toThrow(/LAUNCH_AUTHORITY/);
    retained.native!.launch.sessionId = fx.assignment.native.sessionId; writeRecord(fx.product, retained);
    expect(() => nativeRecoveryTarget(fx.product, started.record.attempt, git(fx.productWorker, ["rev-parse", "HEAD"]), "terminal")).toThrow(/legacy transaction/);
    expect(handleNativeEvent(fx.product, fx.event("PreToolUse", "unknown", undefined, "unknown-agent")).disposition).toBe("unknown-held");
    expect(activeNativeHolds(readRecord(fx.product, started.record.attempt)).map((hold: any) => hold.code)).toContain("unknown-worker");
  } finally { fx.cleanup(); }
});
