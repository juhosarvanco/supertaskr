import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { activeNativeHolds, atomicJson, deriveNativeBenchAuthority, handleNativeEvent, nativeRecordPath, nativeSha256,
  NATIVE_CODEX_HARNESS, NATIVE_IDENTITY_PROBE, readNativeRecord, withNativeDurabilityObserver,
  withNativeTransaction, writeNativeRecord, nativeTransactionFaultPath, nativeTransactionRefusalDir } from "../scripts/native-codex.mjs";
import { bindRun, collectRun, observeRun, prepareNativeBenchRun, startRun } from "../scripts/run-record.mjs";
import { CLOSED_ATTRIBUTION_LIMITS, closedAttributionPolicy, closedAttributionRequestIdentity,
  closedAttributionTarget, recoverClosedAttribution } from "../scripts/gate-closed-attribution-recovery.mjs";
import { NO_BACKGROUND_MAINTENANCE, removeGitFixture } from "./git-fixture";
import type { Assignment } from "../scripts/run-record.mjs";

const sha = nativeSha256;
const encode = (x: unknown) => `${JSON.stringify(x, null, 2)}\n`;
const stable = (x: any): string => Array.isArray(x) ? `[${x.map(stable).join(",")}]` : x !== null && typeof x === "object" ? `{${Object.keys(x).sort().map(k => `${JSON.stringify(k)}:${stable(x[k])}`).join(",")}}` : JSON.stringify(x);
const at = (s: number) => new Date(Date.parse("2026-10-24T00:00:00.000Z") + s * 1000).toISOString();
const nativeUrl = new URL("../scripts/native-codex.mjs", import.meta.url).href;
const recoveryUrl = new URL("../scripts/gate-closed-attribution-recovery.mjs", import.meta.url).href;
const recoveryScript = new URL("../scripts/gate-closed-attribution-recovery.mjs", import.meta.url).pathname;
function git(root: string, args: string[]): string {
  const r = spawnSync("git", ["-C", root, ...NO_BACKGROUND_MAINTENANCE, ...args], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(r.stderr); return r.stdout.trim();
}
function hook(name: string, agent: string, extra: any = {}): any {
  return { hook_event_name: name, agent_id: agent, session_id: "fixture-session", turn_id: "fixture-turn", ...extra };
}
function pin(file: string): any { return { path: file, digest: sha(readFileSync(file)) }; }
function fixture(stem: string): any {
  const dir = realpathSync(mkdtempSync(path.join(os.tmpdir(), `closed-${stem}-T-356-`))), root = path.join(dir, "authority"); mkdirSync(root);
  git(root, ["init", "-q", "-b", "main"]); git(root, ["config", "user.name", "fixture"]); git(root, ["config", "user.email", "fixture@example.invalid"]);
  writeFileSync(path.join(root, ".gitignore"), ".supertaskr/\n"); writeFileSync(path.join(root, "allowed.txt"), "base\n");
  mkdirSync(path.join(root, "docs/tasks"), { recursive: true });
  writeFileSync(path.join(root, "docs/tasks/T-936-fixture.md"), "---\nid: T-936\nstatus: building\ntouches: [allowed.txt]\n---\ncriteria\n");
  git(root, ["add", "."]); git(root, ["commit", "-qm", "fixture base"]); const candidate = git(root, ["rev-parse", "HEAD"]);
  const lanes = [path.join(dir, "executor"), path.join(dir, "verifier")];
  for (const lane of lanes) git(root, ["worktree", "add", "--quiet", "--detach", lane, candidate]);
  const brief = path.join(dir, "brief-T-356.txt"); writeFileSync(brief, "ordinary synthetic closed execution\n");
  atomicJson(path.join(lanes[0]!, ".supertaskr/lane-fence.json"), { version: 1, taskId: "T-936", ref: candidate, worktree: lanes[0], paths: ["allowed.txt"], alwaysWritable: ["docs/tasks"], card: "docs/tasks/T-936-fixture.md", touchesLine: "touches: [allowed.txt]" });
  const attempts: string[] = [];
  for (let i = 0; i < 2; i++) {
    if (i === 1) prepareNativeBenchRun(root, { attempt: attempts[0]!, resource: lanes[1]!, candidate, at: at(25) });
    const assignment: Assignment = { kind: "card", id: "T-936", role: i === 0 ? "executor" : "verifier", resource: lanes[i]!, cwd: lanes[i]!, base: candidate, brief, harness: NATIVE_CODEX_HARNESS, model: "fixture", effort: "fixture", deadline: "none", budget: "none",
      native: { taskName: `/root/fixture-${i}`, sessionId: "fixture-session", coordinatorTurnId: "fixture-turn", ignoredOutputs: [], ...(i === 1 ? { profile: "detached-verifier", executorAttempt: attempts[0]! } : {}) } };
    const rec = startRun(root, { assignment, at: at(i * 30) }).record, agent = `fixture-agent-${i}`; attempts.push(rec.attempt);
    handleNativeEvent(root, hook("SubagentStart", agent), { at: at(i * 30) });
    const probe = { tool_name: "Bash", tool_use_id: `probe-${i}`, tool_input: { command: NATIVE_IDENTITY_PROBE } };
    handleNativeEvent(root, hook("PreToolUse", agent, probe), { at: at(i * 30 + 1) });
    handleNativeEvent(root, hook("PostToolUse", agent, { ...probe, tool_response: { output: agent + "\n" } }), { at: at(i * 30 + 2) });
    bindRun(root, { attempt: rec.attempt, harnessId: agent, at: at(i * 30 + 3) });
    observeRun(root, { attempt: rec.attempt, evidence: "RUN-DONE ok", at: at(i * 30 + 10) });
    collectRun(root, { attempt: rec.attempt, ref: candidate, at: at(i * 30 + 20) });
  }
  // Genuine public later-attribution events affect both already closed records.
  const actor = { agentId: "later-actor", sessionId: "fixture-session" }, events: any[] = [], outputs: any[] = [];
  const probe = { tool_name: "Bash", tool_use_id: "later-probe", tool_input: { command: NATIVE_IDENTITY_PROBE } };
  const callbacks = [hook("SubagentStart", actor.agentId), hook("PreToolUse", actor.agentId, probe), hook("SubagentStop", actor.agentId, { turn_id: null })];
  callbacks.forEach((e, i) => {
    const stamp = at(60 + i), result = handleNativeEvent(root, e, { at: stamp }); outputs.push(result);
    events.push({ at: stamp, event: { event: e.hook_event_name, sessionId: e.session_id, turnId: e.turn_id, agentId: e.agent_id, toolName: e.tool_name ?? null, toolUseId: e.tool_use_id ?? null } });
  });
  const calls = [{ toolUseId: "later-probe", turnId: "fixture-turn", toolName: "Bash", input: NATIVE_IDENTITY_PROBE, response: JSON.stringify(outputs), completedAt: at(63), outcome: "refused" }];
  const transcript = path.join(dir, "transcript-T-356.json"), jobs = path.join(dir, "jobs-T-356.json"), effects = path.join(dir, "effects-T-356.json"), effect = path.join(dir, "effect-observation-T-356.json"), audit = path.join(dir, "audit-T-356.json");
  const actorState = path.join(dir, "actor-state-T-356.json");
  writeFileSync(actorState, encode({ version: 1, actor, status: "ended", endedAt: at(64), inflight: [], ownedJobs: [] }));
  writeFileSync(transcript, encode({ version: 1, actor, execution: { endedAt: at(64), evidence: pin(actorState) }, events, calls })); writeFileSync(jobs, encode({ version: 1, actor, jobs: [] }));
  writeFileSync(effect, encode({ refusedOutputs: outputs, observedCommand: NATIVE_IDENTITY_PROBE, originalCollectionDigests: attempts.map(a => sha(stable(readNativeRecord(root, a).native.collection))), observedOwnedJobs: [], actualPostCallback: false, callbackOutcome: "unknown", refusalProvesOnlyRefusal: true }));
  writeFileSync(effects, encode({ version: 1, actor, calls: [{ toolUseId: "later-probe", evidence: pin(effect) }] }));
  writeFileSync(audit, encode({ version: 1, actor, transcript: pin(transcript), jobs: pin(jobs), effects: pin(effects), limits: CLOSED_ATTRIBUTION_LIMITS }));
  const f: any = { dir, root, candidate, lanes, attempts, actor, events, audit, transcript, jobs, effects, effect, requests: [], authorization: path.join(root, ".supertaskr/native-attribution-authorizations/owner-T-356.json"), cleanup: () => removeGitFixture(dir, stem) };
  refresh(f); return f;
}
function authorize(f: any): void {
  const quote = "Owner authorizes only these exact ordered historical attribution dispositions: " + f.requests.map((r: any) => `${r.target.attempt} ${r.id} ${closedAttributionRequestIdentity(r)}`).join("; ") + ". No admission or implementation verdict is granted.";
  const ruling = path.join(f.dir, "owner-ruling-T-356.md"); writeFileSync(ruling, quote + "\n");
  atomicJson(f.authorization, { version: 1, kind: "closed-native-attribution-disposition", id: "owner-T-356", authorityRoot: f.root, authorizedBy: "owner", recordedBy: "coordinator", recordedAt: at(90), evidenceReference: { ...pin(ruling), quote }, requests: f.requests.map((r: any) => ({ attempt: r.target.attempt, id: r.id, identity: closedAttributionRequestIdentity(r) })) });
  f.requests.forEach((r: any) => { r.authorization.digest = sha(readFileSync(f.authorization)); });
}
function refresh(f: any): void {
  f.requests = f.attempts.map((attempt: string, i: number) => ({ version: 1, id: `disposition-${i}-T-356`, target: closedAttributionTarget(f.root, attempt, f.candidate), holdKeys: activeNativeHolds(readNativeRecord(f.root, attempt)).filter((h: any) => ["ambiguous-agent-attribution", "unknown-worker"].includes(h.code)).map((h: any) => h.key), incident: { actor: f.actor, events: f.events }, audit: pin(f.audit), policy: closedAttributionPolicy(f.root, attempt), source: null, predecessor: null, authorization: { id: "owner-T-356", digest: "0".repeat(64) } }));
  const authority = readNativeRecord(f.root, f.attempts[1]).native.preparation.authority;
  f.requests[1].source = { attempt: f.attempts[0], resource: f.lanes[1], candidate: f.candidate, authorityDigest: sha(stable(authority)) };
  f.requests[1].predecessor = { attempt: f.attempts[0], id: f.requests[0].id, identity: closedAttributionRequestIdentity(f.requests[0]) };
  authorize(f);
}
function raw(f: any, i = 0): string { return readFileSync(nativeRecordPath(f.root, f.attempts[i]), "utf8"); }
function attempt(f: any, i = 0): any { try { return { result: recoverClosedAttribution(f.root, f.requests[i]), code: "SUCCESS" }; } catch (e: any) { return { code: e.code ?? String(e), outcome: e.dispositionOutcome }; } }
function cli(f: any, i = 0): any { const file = path.join(f.dir, "request-T-356.json"); writeFileSync(file, JSON.stringify(f.requests[i])); return spawnSync(process.execPath, [recoveryScript, "--root", f.root, "--request", file], { encoding: "utf8", timeout: 15_000 }); }

test("ordered public a1/a2 disposition retains original collections, incident details and unknown evidence and grants no admission", () => {
  const f = fixture("ordered");
  try {
    const originals = f.attempts.map((_: string, i: number) => JSON.parse(raw(f, i)));
    const first = cli(f); expect(first.status, first.stderr).toBe(0);
    const a = JSON.parse(first.stdout); expect(a).toMatchObject({ ok: true, historicalReplay: false, admissionAuthority: false });
    expect(a.receipt.identity).toBe(closedAttributionRequestIdentity(f.requests[0]));
    const second = attempt(f, 1); expect(second.code).toBe("SUCCESS");
    f.attempts.forEach((x: string, i: number) => {
      const rec = readNativeRecord(f.root, x); expect(activeNativeHolds(rec)).toEqual([]);
      expect(rec.native.collection).toEqual(originals[i].native.collection); expect(rec.events).toEqual(originals[i].events); expect(rec.outcome).toEqual(originals[i].outcome); expect(rec.native.receipts).toEqual(originals[i].native.receipts);
      expect(rec.native.holds.map(({ clearedAt, clearedBy, ...h }: any) => h)).toEqual(originals[i].native.holds.map(({ clearedAt, clearedBy, ...h }: any) => h));
      expect(rec.native.attributionDispositions).toHaveLength(1); expect(rec.native.attributionDispositions[0].receipt.limits).toEqual(CLOSED_ATTRIBUTION_LIMITS);
    });
  } finally { f.cleanup(); }
});

test("exact owner request content, audit, bindings, candidate, scope and policy refuse independently with a successful public control", () => {
  const cases: [string, (f: any) => void, string][] = [
    ["unknown-field", f => { f.requests[0].additionalTargets = [f.requests[1].target]; }, "SCHEMA"],
    ["candidate", f => { f.requests[0].target.candidate = "1".repeat(40); authorize(f); }, "COLLECTION"],
    ["bindings", f => { const r = JSON.parse(raw(f)); r.native.binding.agentId = "wrong-agent"; writeNativeRecord(f.root, r); refresh(f); }, "CESSATION"],
    ["scope", f => { const r = JSON.parse(raw(f)); r.native.fence.paths = ["outside.txt"]; writeNativeRecord(f.root, r); refresh(f); }, "WORKSPACE"],
    ["policy", f => { f.requests[0].policy.seat.state = "different"; authorize(f); }, "POLICY"],
    ["audit-missing", f => rmSync(f.audit), "EVIDENCE"],
    ["grant-missing", f => rmSync(f.authorization), "EVIDENCE"],
    ["grant-name-reused", f => { const a = JSON.parse(readFileSync(f.authorization, "utf8")); a.recordedAt = at(91); writeFileSync(f.authorization, encode(a)); }, "AUTHORIZATION"],
    ["request-name-reused", f => { f.requests[0].audit.digest = "f".repeat(64); }, "AUTHORIZATION"],
    ["wrong-incident", f => { f.requests[0].incident = JSON.parse(JSON.stringify(f.requests[0].incident)); f.requests[0].incident.events[0].event.turnId = "wrong-turn"; authorize(f); }, "HOLD"],
    ["unsupported-label", f => { f.requests[0].incident = JSON.parse(JSON.stringify(f.requests[0].incident)); f.requests[0].incident.events[0].event.event = "Unsupported"; }, "INCIDENT"],
  ];
  for (const [name, mutate, code] of cases) {
    const f = fixture(name);
    try { mutate(f); const before = raw(f), result = attempt(f); expect(result.code, name).toBe(`CLOSED_ATTRIBUTION_${code}`); expect(raw(f), name).toBe(before); expect(readNativeRecord(f.root, f.attempts[0]).native.attributionDispositions).toBeUndefined(); }
    finally { f.cleanup(); }
  }
  const syntactic = fixture("ambiguous-syntax");
  try {
    const original = raw(syntactic), text = JSON.stringify(syntactic.requests[0]);
    expect(() => recoverClosedAttribution(syntactic.root, text.replace('"version":1', '"version":1,"version":1'))).toThrow("duplicate JSON keys");
    expect(() => recoverClosedAttribution(syntactic.root, { ...syntactic.requests[0], discarded: undefined })).toThrow("JSON values only");
    expect(raw(syntactic)).toBe(original);
  } finally { syntactic.cleanup(); }
  const f = fixture("exact-positive"); try { expect(attempt(f).code).toBe("SUCCESS"); expect(JSON.parse(readFileSync(f.effect, "utf8"))).toMatchObject({ actualPostCallback: false, callbackOutcome: "unknown", refusalProvesOnlyRefusal: true }); }
  finally { f.cleanup(); }
});

test("each target needs its own genuine pre-incident completion collection and released reservation", () => {
  const cases: [string, (r: any) => void][] = [
    ["completion-after", r => { r.execution.endedAt = at(70); r.events.find((e: any) => e.op === "observe").at = at(70); }],
    ["collection-after", r => { r.native.collection.checkedAt = at(70); r.events.find((e: any) => e.op === "collect").at = at(70); }],
    ["release-after", r => { r.reservation.releasedAt = at(70); }],
    ["no-own-collection", r => { r.native.collection = null; }],
  ];
  for (const [name, mutate] of cases) {
    const f = fixture(name);
    try { const rec = JSON.parse(raw(f, 1)); mutate(rec); writeNativeRecord(f.root, rec); refresh(f); expect(attempt(f).code).toBe("SUCCESS"); const before = raw(f, 1); expect(attempt(f, 1).code, name).toBe("CLOSED_ATTRIBUTION_INCIDENT_TIME"); expect(raw(f, 1)).toBe(before); expect(readNativeRecord(f.root, f.attempts[0]).native.attributionDispositions).toHaveLength(1); }
    finally { f.cleanup(); }
  }
});

test("a2 first unrelated predecessors and changed source refuse while a1 independently remains applied", () => {
  const f = fixture("predecessor");
  try {
    const before = raw(f, 1); expect(attempt(f, 1).code).toBe("CLOSED_ATTRIBUTION_PREDECESSOR"); expect(raw(f, 1)).toBe(before);
    expect(attempt(f).code).toBe("SUCCESS");
    f.requests[1].predecessor.id = "unrelated"; authorize(f); expect(attempt(f, 1).code).toBe("CLOSED_ATTRIBUTION_PREDECESSOR");
    f.requests[1].predecessor.id = f.requests[0].id; authorize(f);
    const originalAuthorization = readFileSync(f.authorization, "utf8"), originalDigest = f.requests[1].authorization.digest;
    const reused = JSON.parse(originalAuthorization); reused.recordedAt = at(91); writeFileSync(f.authorization, encode(reused)); f.requests[1].authorization.digest = sha(readFileSync(f.authorization));
    expect(attempt(f, 1).code).toBe("CLOSED_ATTRIBUTION_PREDECESSOR");
    writeFileSync(f.authorization, originalAuthorization); f.requests[1].authorization.digest = originalDigest;
    writeFileSync(path.join(f.lanes[0], "allowed.txt"), "changed qualifying source\n");
    expect(attempt(f, 1).code).toBe("CLOSED_ATTRIBUTION_SOURCE"); expect(raw(f, 1)).toBe(before);
    expect(readNativeRecord(f.root, f.attempts[0]).native.attributionDispositions).toHaveLength(1);
    writeFileSync(path.join(f.lanes[0], "allowed.txt"), "base\n"); expect(attempt(f, 1).code).toBe("SUCCESS");
  } finally { f.cleanup(); }
});

test("live target or actor work later ownership unexpected holds and incomplete audits block disposition", () => {
  const variants: [string, (f: any) => void][] = [
    ["inflight", f => { const r = JSON.parse(raw(f)); r.native.inflight.push({ toolUseId: "still-running" }); writeNativeRecord(f.root, r); refresh(f); }],
    ["target-job", f => { const r = JSON.parse(raw(f)); r.ownedJobs.push({ kind: "pid", id: String(process.pid) }); writeNativeRecord(f.root, r); refresh(f); }],
    ["unexpected-hold", f => { const r = JSON.parse(raw(f)); r.native.holds.push({ key: "unexpected", code: "emergency", clearedAt: null, recordedAt: at(65) }); writeNativeRecord(f.root, r); refresh(f); }],
    ["later-owner", f => {
      const assignment = JSON.parse(JSON.stringify(readNativeRecord(f.root, f.attempts[0]).assignment)); assignment.native.taskName = "/root/later-owner";
      const rec = startRun(f.root, { assignment, at: at(100) }).record, agent = "later-owner";
      handleNativeEvent(f.root, hook("SubagentStart", agent), { at: at(100) });
      const probe = { tool_name: "Bash", tool_use_id: "later-owner-probe", tool_input: { command: NATIVE_IDENTITY_PROBE } };
      handleNativeEvent(f.root, hook("PreToolUse", agent, probe), { at: at(101) });
      handleNativeEvent(f.root, hook("PostToolUse", agent, { ...probe, tool_response: { output: agent + "\n" } }), { at: at(102) });
      bindRun(f.root, { attempt: rec.attempt, harnessId: agent, at: at(103) });
      observeRun(f.root, { attempt: rec.attempt, evidence: "RUN-DONE ok", at: at(110) }); collectRun(f.root, { attempt: rec.attempt, ref: f.candidate, at: at(120) });
    }],
    ["actor-job", f => { const j = JSON.parse(readFileSync(f.jobs, "utf8")); j.jobs.push({ kind: "pid", id: String(process.pid), evidence: pin(f.effect) }); writeFileSync(f.jobs, encode(j)); const a = JSON.parse(readFileSync(f.audit, "utf8")); a.jobs = pin(f.jobs); writeFileSync(f.audit, encode(a)); refresh(f); }],
    ["actor-state-unknown", f => {
      const t = JSON.parse(readFileSync(f.transcript, "utf8")), state = JSON.parse(readFileSync(t.execution.evidence.path, "utf8")); state.status = "unknown";
      writeFileSync(t.execution.evidence.path, encode(state)); t.execution.evidence = pin(t.execution.evidence.path); writeFileSync(f.transcript, encode(t));
      const a = JSON.parse(readFileSync(f.audit, "utf8")); a.transcript = pin(f.transcript); writeFileSync(f.audit, encode(a)); refresh(f);
    }],
    ["actor-unresolved", f => { const t = JSON.parse(readFileSync(f.transcript, "utf8")); t.calls[0].completedAt = null; writeFileSync(f.transcript, encode(t)); const a = JSON.parse(readFileSync(f.audit, "utf8")); a.transcript = pin(f.transcript); writeFileSync(f.audit, encode(a)); refresh(f); }],
  ];
  for (const [name, mutate] of variants) {
    const f = fixture(name); try { mutate(f); const before = raw(f); const result = attempt(f); expect(result.code, name).not.toBe("SUCCESS"); expect(raw(f)).toBe(before); expect(activeNativeHolds(readNativeRecord(f.root, f.attempts[0])).length).toBeGreaterThan(0); } finally { f.cleanup(); }
  }
});

test("actual beforePublish refuses changed evidence policy records candidate and retained fault inventory with old image retained", () => {
  const variants: [string, (f: any) => void][] = [
    ["evidence", f => writeFileSync(f.effect, "changed actual audit observation\n")],
    ["policy", f => writeFileSync(f.authorization, "{}\n")],
    ["record", f => { const r = JSON.parse(raw(f)); r.native.holds.push({ key: "late-emergency", code: "emergency", clearedAt: null }); writeFileSync(nativeRecordPath(f.root, f.attempts[0]), encode(r)); }],
    ["candidate", f => writeFileSync(path.join(f.lanes[0], "allowed.txt"), "late candidate change\n")],
    ["retained-fault", f => atomicJson(nativeTransactionFaultPath(f.root, "a".repeat(64)), { version: 1, retained: "new quarantine evidence" })],
    ["raw-fault", f => atomicJson(path.join(nativeTransactionRefusalDir(f.root), "late.json"), { id: "b".repeat(64), outcome: "unknown" })],
    ["emergency", f => writeFileSync(nativeRecordPath(f.root, f.attempts[0]) + ".native-hold", encode({ version: 1, attempt: f.attempts[0], key: `unreadable-authority:${f.attempts[0]}`, code: "unreadable-authority", recordedAt: at(70), outcome: "unknown", problem: "owned fixture" }))],
  ];
  for (const [name, mutate] of variants) {
    const f = fixture(name); let reached = false;
    try {
      const result = withNativeDurabilityObserver(e => { if (!reached && e.stage === "before-rename" && e.file === nativeRecordPath(f.root, f.attempts[0])) { reached = true; mutate(f); } }, () => attempt(f));
      expect(reached, name).toBe(true); expect(result.code, name).not.toBe("SUCCESS"); expect(JSON.parse(raw(f)).native.attributionDispositions, name).toBeUndefined(); expect(activeNativeHolds(readNativeRecord(f.root, f.attempts[0])).length).toBeGreaterThan(0);
      expect(result.outcome.lockRelease).toBe("unverified");
    } finally { f.cleanup(); }
  }
});

test("pending acquisition faults and a genuinely consumed raw sidecar retain quarantine and refuse selected publication", () => {
  for (const phase of ["initial", "acquired"]) {
    const control = fixture(`pending-${phase}`); let reached = phase === "initial";
    try {
      const file = path.join(nativeTransactionRefusalDir(control.root), "pending-T-356.json"), publish = () => { mkdirSync(path.dirname(file), { recursive: true }); writeFileSync(file, encode({ id: "d".repeat(64), code: "native-transaction-refusal", outcome: "unknown" })); };
      if (phase === "initial") publish();
      const before = raw(control), result = withNativeDurabilityObserver(e => {
        if (phase === "acquired" && !reached && e.file.endsWith("/.native-transaction.lock/owner.json") && e.stage === "directory-fsync") { reached = true; publish(); }
      }, () => attempt(control));
      expect(reached).toBe(true); expect(result.code).toBe("CLOSED_ATTRIBUTION_PENDING_FAULT"); expect(raw(control)).toBe(before); expect(existsSync(file)).toBe(true);
    } finally { control.cleanup(); }
  }
  const f = fixture("consumed-sidecar");
  try {
    const requestFile = path.join(f.dir, "request-T-356.json"); writeFileSync(requestFile, JSON.stringify(f.requests[0]));
    const child = spawnSync(process.execPath, ["--input-type=module", "-e", `
      import fs from 'node:fs'; import path from 'node:path'; import {createHash} from 'node:crypto'; import {syncBuiltinESMExports} from 'node:module';
      const [nativeUrl,recoveryUrl,root,requestFile]=process.argv.slice(1),rawDir=path.join(root,'.supertaskr/runs/reservations/native-transaction-refusals');
      fs.mkdirSync(rawDir,{recursive:true});const original=fs.readdirSync;let checks=0,inserted=false;
      fs.readdirSync=(dir,...args)=>{const names=original(dir,...args);if(String(dir)===rawDir&&(checks++,fs.existsSync(path.join(root,'.supertaskr/runs/reservations/.native-transaction.lock/owner.json')))&&!inserted){
        fs.writeFileSync(path.join(rawDir,'injected.json'),JSON.stringify({version:2,id:'c'.repeat(64),code:'native-transaction-refusal',operation:'owned-synthetic-late-fault',recordedAt:'2026-10-24T00:02:00Z',outcome:'unknown',owner:null,requester:{attribution:'recorded-binding',attempt:'T-936-a2',resource:JSON.parse(fs.readFileSync(path.join(root,'.supertaskr/runs/T-936/T-936-a2.json'),'utf8')).resource,bindingDigest:createHash('sha256').update(JSON.stringify(JSON.parse(fs.readFileSync(path.join(root,'.supertaskr/runs/T-936/T-936-a2.json'),'utf8')).native.binding)).digest('hex')},reason:'owned fixture'})+'\\n');inserted=true;}return names;};
      syncBuiltinESMExports();const n=await import(nativeUrl),r=await import(recoveryUrl);let result;
      try{result={ok:true,value:r.recoverClosedAttribution(root,fs.readFileSync(requestFile,'utf8'))}}catch(e){result={ok:false,code:e.code,outcome:e.dispositionOutcome}}
      console.log(JSON.stringify({inserted,checks,...result,rawRemaining:original(rawDir),retained:fs.existsSync(n.nativeTransactionFaultPath(root,'c'.repeat(64))),hold:n.readNativeRecord(root,'T-936-a2').native.holds.some(h=>h.code==='native-transaction-refusal')}));
    `, nativeUrl, recoveryUrl, f.root, requestFile], { encoding: "utf8", timeout: 15_000 });
    expect(child.status, child.stderr).toBe(0); const result = JSON.parse(child.stdout);
    expect(result).toMatchObject({ inserted: true, ok: false, code: "CLOSED_ATTRIBUTION_FAULT_CHANGED", rawRemaining: [], retained: true, hold: true });
    expect(JSON.parse(raw(f)).native.attributionDispositions).toBeUndefined(); expect(result.outcome.quarantineChanged).toBe(true);
    const retained = readFileSync(nativeTransactionFaultPath(f.root, "c".repeat(64)), "utf8"); expect(retained).toContain("owned-synthetic-late-fault");
  } finally { f.cleanup(); }
});

test("pre-lock exact replay preserves later state and acquisition receipt races fail even when exact lock release also fails", () => {
  const f = fixture("replay-race");
  try {
    const original = raw(f), first = attempt(f); expect(first.code).toBe("SUCCESS"); const applied = raw(f), receipt = first.result.receipt;
    for (const corrupt of ["receipt", "disposition"]) {
      const bad = JSON.parse(applied);
      if (corrupt === "receipt") bad.native.attributionDispositions[0].receipt.at = at(200);
      else bad.native.holds.find((h: any) => f.requests[0].holdKeys.includes(h.key)).event.turnId = "changed-retained-details";
      writeFileSync(nativeRecordPath(f.root, f.attempts[0]), encode(bad));
      expect(attempt(f).code, corrupt).toBe("CLOSED_ATTRIBUTION_RECEIPT"); expect(raw(f)).toBe(encode(bad));
    }
    const later = JSON.parse(applied); later.report = "later report retained"; later.native.holds.push({ key: "later", code: "emergency", clearedAt: null }); writeNativeRecord(f.root, later);
    rmSync(f.audit); rmSync(f.authorization); atomicJson(path.join(nativeTransactionRefusalDir(f.root), "pending.json"), { retained: "later raw fault" });
    const before = raw(f), replay = attempt(f); expect(replay.code).toBe("SUCCESS"); expect(replay.result).toMatchObject({ historicalReplay: true, receipt }); expect(raw(f)).toBe(before);
    const emergency = nativeRecordPath(f.root, f.attempts[0]) + ".native-hold"; writeFileSync(emergency, "unreadable later emergency evidence");
    expect(attempt(f).result).toMatchObject({ historicalReplay: true, receipt }); expect(raw(f)).toBe(before); rmSync(emergency);
    expect(() => deriveNativeBenchAuthority(JSON.parse(raw(f)), { resource: f.lanes[1], candidate: f.candidate, at: at(200) })).toThrow("no holds");
    const changed = JSON.parse(JSON.stringify(f.requests[0])); changed.policy.extra = "changed immutable content"; expect(() => recoverClosedAttribution(f.root, changed)).toThrow("changed syntax or contents");
    rmSync(nativeTransactionRefusalDir(f.root), { recursive: true });
    for (const breakRelease of [false, true]) {
      writeFileSync(nativeRecordPath(f.root, f.attempts[0]), original); let reached = false;
      const lock = path.join(f.root, ".supertaskr/runs/reservations/.native-transaction.lock"), ownerFile = path.join(lock, "owner.json");
      const result = withNativeDurabilityObserver(e => {
        if (!reached && e.file === ownerFile && e.stage === "directory-fsync") {
          reached = true; writeFileSync(nativeRecordPath(f.root, f.attempts[0]), applied);
          if (breakRelease) { const owner = JSON.parse(readFileSync(ownerFile, "utf8")); owner.token = "changed-owned-fixture-token"; writeFileSync(ownerFile, encode(owner)); }
        }
      }, () => attempt(f));
      expect(reached).toBe(true); expect(result.code).toBe("CLOSED_ATTRIBUTION_RECEIPT_RACE"); expect(result.outcome).toMatchObject({ outcome: "committed", publicationAttempted: false, lockRelease: "unverified", observedReceipt: receipt }); expect(raw(f)).toBe(applied);
      expect(existsSync(lock)).toBe(breakRelease); expect(attempt(f).result).toMatchObject({ historicalReplay: true, receipt }); if (breakRelease) rmSync(lock, { recursive: true });
    }
  } finally { f.cleanup(); }
});

test("atomic publication and explicit retry classify before rename after rename directory sync release and response loss honestly", () => {
  for (const stage of ["before-rename", "rename", "before-directory-fsync", "directory-fsync", "release"]) {
    const f = fixture(stage); let reached = false;
    try {
      const original = raw(f), target = nativeRecordPath(f.root, f.attempts[0]), owner = path.join(f.root, ".supertaskr/runs/reservations/.native-transaction.lock/owner.json");
      const result = withNativeDurabilityObserver(e => {
        if (e.file !== target || reached || e.stage !== (stage === "release" ? "directory-fsync" : stage)) return;
        reached = true;
        if (stage === "release") { const record = JSON.parse(readFileSync(owner, "utf8")); record.token = "changed-owned-fixture-token"; writeFileSync(owner, encode(record)); }
        else throw new Error(`owned fixture interruption ${stage}`);
      }, () => attempt(f));
      expect(reached, stage).toBe(true); expect(result.code, stage).not.toBe("SUCCESS"); expect(result.outcome.lockRelease).toBe("unverified");
      if (stage === "before-rename") { expect(raw(f)).toBe(original); expect(result.outcome.outcome).toBe("not-applied"); }
      else { expect(result.outcome.outcome, stage).toBe("committed"); const rec = readNativeRecord(f.root, f.attempts[0]); expect(rec.native.attributionDispositions).toHaveLength(1); expect(activeNativeHolds(rec)).toEqual([]); }
      expect(attempt(f).code, stage).toBe("SUCCESS");
    } finally { f.cleanup(); }
  }
  const uncertain = fixture("post-rename-read-unknown");
  try {
    const file = path.join(uncertain.dir, "request-T-356.json"); writeFileSync(file, JSON.stringify(uncertain.requests[0]));
    const child = spawnSync(process.execPath, ["--input-type=module", "-e", `
      import fs from 'node:fs';import{syncBuiltinESMExports}from'node:module';
      const[nativeUrl,recoveryUrl,root,file,target]=process.argv.slice(1),read=fs.readFileSync;let blocked=false;
      fs.readFileSync=(name,...args)=>{if(blocked&&String(name)===target){const e=new Error('owned target read fault');e.code='EIO';throw e}return read(name,...args)};
      syncBuiltinESMExports();const n=await import(nativeUrl),r=await import(recoveryUrl);let outcome;
      n.withNativeDurabilityObserver(e=>{if(e.file===target&&e.stage==='rename'){blocked=true;throw new Error('owned interruption after rename')}},()=>{
        try{r.recoverClosedAttribution(root,read(file,'utf8'))}catch(e){outcome=e.dispositionOutcome}});
      console.log(JSON.stringify(outcome));
    `, nativeUrl, recoveryUrl, uncertain.root, file, nativeRecordPath(uncertain.root, uncertain.attempts[0])], { encoding: "utf8", timeout: 15_000 });
    expect(child.status, child.stderr).toBe(0); expect(JSON.parse(child.stdout)).toMatchObject({ outcome: "uncertain", publicationAttempted: true, observedReceipt: null, lockRelease: "unverified" });
    expect(readNativeRecord(uncertain.root, uncertain.attempts[0]).native.attributionDispositions).toHaveLength(1); expect(attempt(uncertain).result.historicalReplay).toBe(true);
  } finally { uncertain.cleanup(); }
  const f = fixture("response-loss");
  try {
    const file = path.join(f.dir, "request-T-356.json"); writeFileSync(file, JSON.stringify(f.requests[0]));
    const child = spawnSync(process.execPath, ["--input-type=module", "-e", "import{readFileSync}from'node:fs';const[url,root,file]=process.argv.slice(1);const r=await import(url);r.recoverClosedAttribution(root,readFileSync(file,'utf8'));process.exit(73);", recoveryUrl, f.root, file], { encoding: "utf8", timeout: 15_000 });
    expect(child.status, child.stderr).toBe(73); expect(child.stdout).toBe(""); const result = attempt(f); expect(result.code).toBe("SUCCESS"); expect(result.result.historicalReplay).toBe(true); expect(readNativeRecord(f.root, f.attempts[0]).native.attributionDispositions).toHaveLength(1);
  } finally { f.cleanup(); }
});
