import { spawn, spawnSync } from "node:child_process";
import { chmodSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readlinkSync, readdirSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import net from "node:net";
import os from "node:os";
import { GRANT_STORE_REL_PATH, PAUSE_REL_PATH, composeGrantSnapshot } from "../scripts/dispatch-brief.mjs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import {
  NATIVE_CODEX_HARNESS, NATIVE_IDENTITY_PROBE, activeNativeHolds, addNativeHold, atomicJson,
  handleNativeEvent, nativeRecordPath, nativeSha256, nativeTransactionFaultPath, readNativeRecord,
  withNativeTransaction, writeNativeRecord,
  nativeTransactionRefusalDir,
} from "../scripts/native-codex.mjs";
import { bindRun, collectRun, continueRun, observeRun, prepareNativeBenchRun, readReservation, releaseReservation, reservationPath, startRun, stopRun } from "../scripts/run-record.mjs";
import { nativeRecoveryIntentPath, nativeRecoveryTarget, recoverNativeTransaction } from "../scripts/native-transaction-recovery.mjs";
import { processRow, writeHolder } from "../scripts/checkout-currency.mjs";
import { NO_BACKGROUND_MAINTENANCE, removeGitFixture } from "./git-fixture";
import type { Assignment } from "../scripts/run-record.mjs";

const AT = "2026-10-06T00:00:00.000Z";
const encode = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;
const sha = nativeSha256;
const nativeUrl = new URL("../scripts/native-codex.mjs", import.meta.url).href;
const recoveryUrl = new URL("../scripts/native-transaction-recovery.mjs", import.meta.url).href;
const recoveryScript = new URL("../scripts/native-transaction-recovery.mjs", import.meta.url).pathname;
function git(root: string, args: string[]): string {
  const r = spawnSync("git", ["-C", root, ...NO_BACKGROUND_MAINTENANCE, ...args], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(r.stderr);
  return r.stdout.trim();
}
function event(name: string, agent: string, extra: Record<string, any> = {}): any {
  return { hook_event_name: name, session_id: "fixture-session", turn_id: "fixture-turn", agent_id: agent, ...extra };
}
function fixture(stem: string, count = 1, collected = false, legacy = false, deferHold = false): any {
  const dir = realpathSync(mkdtempSync(path.join(os.tmpdir(), `T-351-s1-${stem}-`)));
  const root = path.join(dir, "authority"); mkdirSync(root);
  git(root, ["init", "-q", "-b", "main"]); git(root, ["config", "user.name", "fixture"]); git(root, ["config", "user.email", "fixture@example.invalid"]);
  writeFileSync(path.join(root, ".gitignore"), ".supertaskr/\nignored/\n");
  writeFileSync(path.join(root, "allowed.txt"), "base\n"); writeFileSync(path.join(root, "outside.txt"), "base\n");
  mkdirSync(path.join(root, "docs/tasks"), { recursive: true });
  for (let i = 0; i < count; i++) writeFileSync(path.join(root, `docs/tasks/T-935-s${i}-fixture.md`), `---\nid: T-935-s${i}\nstatus: building\ntouches: [allowed.txt]\n---\ncriteria\n`);
  git(root, ["add", "."]); git(root, ["commit", "-qm", "fixture base"]);
  const base = git(root, ["rev-parse", "HEAD"]);
  const records: any[] = [], lanes: string[] = [];
  for (let i = 0; i < count; i++) {
    const id = `T-935-s${i}`, lane = path.join(dir, `lane-${i}`), brief = path.join(dir, `brief-${id}.txt`), agent = `fixture-agent-${i}`;
    git(root, ["worktree", "add", "--quiet", "--detach", lane, base]); lanes.push(lane);
    mkdirSync(path.join(lane, ".supertaskr")); writeFileSync(brief, "fixture brief\n");
    atomicJson(path.join(lane, ".supertaskr/lane-fence.json"), { version: 1, taskId: id, ref: base, worktree: lane,
      paths: ["allowed.txt"], alwaysWritable: ["docs/tasks"], card: `docs/tasks/${id}-fixture.md`, touchesLine: "touches: [allowed.txt]" });
    const a: Assignment = { kind: "card", id, role: "executor", resource: lane, cwd: lane, base, brief,
      harness: NATIVE_CODEX_HARNESS, model: "fixture", effort: "fixture", deadline: "none", budget: "none",
      native: { taskName: `/root/${id}`, sessionId: "fixture-session", coordinatorTurnId: "fixture-turn", ignoredOutputs: ["ignored/allowed"] } };
    const started = startRun(root, { assignment: a, at: AT }).record;
    handleNativeEvent(root, event("SubagentStart", agent), { at: AT });
    const probe = { tool_name: "Bash", tool_use_id: `probe-${i}`, tool_input: { command: NATIVE_IDENTITY_PROBE } };
    handleNativeEvent(root, event("PreToolUse", agent, probe), { at: AT });
    handleNativeEvent(root, event("PostToolUse", agent, { ...probe, tool_response: { output: `${agent}\n` } }), { at: AT });
    bindRun(root, { attempt: started.attempt, harnessId: agent, at: AT });
    let completionAt = AT;
    if (collected && legacy && i === 0) {
      stopRun(root, { attempt: started.attempt, evidence: "RUN-DONE gone", at: AT });
      const resumedAt = "2026-10-06T00:00:01.000Z";
      continueRun(root, { attempt: started.attempt, ref: base, at: resumedAt });
      bindRun(root, { attempt: started.attempt, harnessId: agent, at: resumedAt });
      completionAt = "2026-10-06T00:00:02.000Z";
    }
    // One genuine collected source; the second target is a genuine failed no-work turn.
    observeRun(root, { attempt: started.attempt, evidence: i === 0 ? "RUN-DONE ok" : "RUN-DONE failed", at: completionAt });
    if (collected && i === 0) collectRun(root, { attempt: started.attempt, ref: base, at: completionAt });
    records.push(readNativeRecord(root, started.attempt));
  }
  const refusal: any = { version: legacy ? 1 : 2, id: sha(stem), code: "native-transaction-refusal", operation: "fixture-refusal",
    recordedAt: AT, outcome: "unknown", owner: null, reason: "lock ownership is unreadable" };
  if (!legacy) refusal.requester = { attribution: "recorded-binding", attempt: records[0].attempt, resource: lanes[0],
    event: { event: "PreToolUse", agentId: records[0].native.binding.agentId, sessionId: "fixture-session", turnId: "fixture-turn" },
    binding: records[0].native.binding, bindingDigest: sha(JSON.stringify(records[0].native.binding)), recordDigest: sha(readFileSync(nativeRecordPath(root, records[0].attempt))) };
  const raw = encode(refusal), fault = { version: 1, id: refusal.id, rawDigest: sha(raw), rawContent: raw, refusal };
  const faultReference = path.join(dir, `fault-${stem}.json`); writeFileSync(faultReference, raw);
  if (!legacy) atomicJson(nativeTransactionFaultPath(root, refusal.id), fault);
  for (const r of records) {
    if (!deferHold) addNativeHold(r, { key: `native-transaction-refusal:${refusal.id}`, code: "native-transaction-refusal", refusal, outcome: "unknown", recordedAt: AT });
    // Preserve an actual missing post-callback receipt; never report it as successful.
    r.native.receipts.push({ actualPostCallback: false, completedAt: null, pre: { toolUseId: "unknown-pre" }, check: null, outcome: "unknown" });
    writeNativeRecord(root, r);
  }
  const targets = records.map((r, i) => nativeRecoveryTarget(root, r.attempt, base, collected && i === 0 ? "collected-source" : i === 0 ? "terminal" : "failed-no-work"));
  const request: any = { version: 1, id: `recovery-${stem}`, fault: { id: refusal.id, source: legacy ? "recorded-refusal-json-v1" : "raw-ledger-v1", rawDigest: sha(raw),
    ...(legacy ? { reference: faultReference } : {}) }, targets, authorization: null };
  return { dir, root, base, lanes, records, request, fault, faultReference, cleanup: () => removeGitFixture(dir, `native recovery ${stem}`) };
}
function authorize(f: any, id = "exact-owner-authorization"): void {
  const quote = `Owner permits exact fault ${f.request.fault.id} for ${f.request.targets.map((t: any) => t.attempt).join(", ")} after every independent check; attribution remains unknown.`;
  const evidencePath = path.join(f.dir, `owner-ruling-T-351-s1-${id}.md`); writeFileSync(evidencePath, quote + "\n");
  const authorization = { version: 1, id, authorityRoot: f.root, authorizedBy: "owner", recordedBy: "coordinator", recordedAt: AT,
    evidenceReference: { path: evidencePath, digest: sha(readFileSync(evidencePath)), quote }, fault: f.request.fault,
    targets: f.request.targets.map((t: any) => ({ attempt: t.attempt, resource: t.resource, candidate: t.candidate, bindingDigest: t.bindingDigest })),
    attribution: "legacy-unattributed", disposition: "resolve-exact-native-transaction-refusal" };
  const file = path.join(f.root, ".supertaskr/native-recovery-authorizations", `${authorization.id}.json`); atomicJson(file, authorization);
  f.authorizationFile = file; f.evidencePath = evidencePath;
  f.request.authorization = { id: authorization.id, digest: sha(readFileSync(file)) };
}
function cli(f: any, request = f.request): any {
  const file = path.join(f.dir, "request-T-351-s1.json"); writeFileSync(file, encode(request));
  return spawnSync(process.execPath, [recoveryScript, "--root", f.root, "--request", file], { encoding: "utf8", timeout: 15_000 });
}
function unchanged(f: any, before: string[]): void {
  expect(f.request.targets.map((t: any) => readFileSync(nativeRecordPath(f.root, t.attempt), "utf8"))).toEqual(before);
}
function beforeRecords(f: any): string[] { return f.request.targets.map((t: any) => readFileSync(nativeRecordPath(f.root, t.attempt), "utf8")); }
function errorCode(fn: () => unknown): string { try { fn(); return "NO_REFUSAL"; } catch (e: any) { return e.code ?? String(e); } }

// These child processes terminate at real operation boundaries. They establish
// process-crash replay, not arbitrary power-loss simulation. The separate
// forwarding trace checks the actual persistence syscalls and their order.
const atomicStages = ["before-temp-create", "temp-create", "before-write", "write", "before-file-fsync", "file-fsync",
  "before-close", "close", "before-rename", "rename", "before-directory-fsync", "directory-fsync"];
function persistenceCrash(f: any, action: "recover" | "absorb", file: string, stage: string, ordinal = 1): any {
  const requestFile = path.join(f.dir, "persistence-request.json"); writeFileSync(requestFile, encode(f.request));
  return spawnSync(process.execPath, ["--input-type=module", "-e", `
    import {readFileSync} from 'node:fs';
    const [nativeUrl,recoveryUrl,root,requestFile,action,file,stage,ordinal]=process.argv.slice(1);
    const n=await import(nativeUrl), r=await import(recoveryUrl); let writes=0;
    n.withNativeDurabilityObserver(e=>{
      if(e.file!==file)return;
      if(e.stage==='before-temp-create')writes++;
      if(e.stage===stage&&(stage.includes('parent-')||stage.includes('directory-create')||stage.includes('retir')||writes===Number(ordinal)))process.exit(73);
    },()=>action==='recover'?r.recoverNativeTransaction(root,JSON.parse(readFileSync(requestFile,'utf8'))):
      n.withNativeTransaction(root,{operation:'fixture-absorption'},()=>undefined));
  `, nativeUrl, recoveryUrl, f.root, requestFile, action, file, stage, String(ordinal)], { encoding: "utf8", timeout: 15_000 });
}

test("plain owned atomic publication detects each actual persistence operation without native fixture bootstrap writes", () => {
  const dir = realpathSync(mkdtempSync(path.join(os.tmpdir(), "T-351-s1-plain-persistence-")));
  try {
    git(dir, ["init", "-q", "-b", "main"]);
    const output = path.join(dir, "first/second/atomic.json"), traceFile = path.join(dir, "forwarded.json");
    const child = spawnSync(process.execPath, ["--input-type=module", "-e", `
      import fs from 'node:fs';import {syncBuiltinESMExports} from 'node:module';
      const [url,output,traceFile]=process.argv.slice(1),trace=[],fds=new Map(),original={};
      for(const name of ['openSync','writeFileSync','fsyncSync','closeSync','renameSync','mkdirSync']){
        original[name]=fs[name];fs[name]=(...args)=>{const resource=typeof args[0]==='number'?fds.get(args[0]):args[0];
          const result=original[name](...args);if(name==='openSync')fds.set(result,args[0]);
          trace.push({name,resource,args:name==='openSync'?[args[0],args[1],args[2]]:name==='writeFileSync'?[resource,String(args[1])]:args});
          if(name==='closeSync')fds.delete(args[0]);return result;};
      }
      syncBuiltinESMExports();const n=await import(url);n.atomicJson(output,{utf8:'π',outcome:'unknown'});
      let temp,code=null;n.withNativeDurabilityObserver(e=>{if(e.stage==='before-temp-create'&&e.file===output+'.collision'){
        temp=e.temp;original.writeFileSync(temp,'fixture-owned previous bytes',{flag:'wx',mode:0o600});
      }},()=>{try{n.atomicJson(output+'.collision',{unexpected:true})}catch(e){code=e.code}});
      original.writeFileSync(traceFile,JSON.stringify({trace,code,collision:fs.existsSync(temp)?fs.readFileSync(temp,'utf8'):'<missing>',published:fs.existsSync(output+'.collision')}));
    `, nativeUrl, output, traceFile], { encoding: "utf8", timeout: 5_000 });
    expect(child.status, child.stderr).toBe(0);
    const result = JSON.parse(readFileSync(traceFile, "utf8")), trace: any[] = result.trace;
    expect(existsSync(output)).toBe(true); expect(readFileSync(output, "utf8")).toBe(encode({ utf8: "π", outcome: "unknown" }));
    expect(result.code).toBe("EEXIST"); expect(result.collision).toBe("fixture-owned previous bytes"); expect(result.published).toBe(false);
    const rename = trace.find(v => v.name === "renameSync" && v.args[1] === output), ri = trace.indexOf(rename);
    expect(rename).toBeDefined();
    const temp = rename.args[0], oi = trace.findIndex(v => v.name === "openSync" && v.resource === temp);
    const wi = trace.findIndex(v => v.name === "writeFileSync" && v.resource === temp), fi = trace.findIndex(v => v.name === "fsyncSync" && v.resource === temp);
    const ci = trace.findIndex(v => v.name === "closeSync" && v.resource === temp), di = trace.findIndex((v, i) => i > ri && v.name === "fsyncSync" && v.resource === path.dirname(output));
    expect(trace[oi].args.slice(1)).toEqual(["wx", 0o600]); expect(oi).toBeLessThan(wi); expect(wi).toBeLessThan(fi);
    expect(fi).toBeLessThan(ci); expect(ci).toBeLessThan(ri); expect(di).toBeGreaterThan(ri);
    for (const mkdir of trace.filter(v => v.name === "mkdirSync")) {
      const mi = trace.indexOf(mkdir), parentFlush = trace.findIndex((v, i) => i > mi && v.name === "fsyncSync" && v.resource === path.dirname(mkdir.resource));
      const childCreate = trace.findIndex((v, i) => i > mi && ["mkdirSync", "openSync"].includes(v.name) && typeof v.resource === "string" && v.resource.startsWith(mkdir.resource + path.sep));
      expect(parentFlush).toBeGreaterThan(mi); expect(parentFlush).toBeLessThan(childCreate);
    }
    console.info("actual atomic forwarding calls", JSON.stringify(trace.map(v => ({ name: v.name, resource: v.resource, args: v.name === "writeFileSync" ? [sha(v.args[1])] : v.args }))));
  } finally { removeGitFixture(dir, "plain owned atomic persistence"); }
});

test("forwarded public raw timeout publication proves its own complete write file fsync close and directory flush before unknown refusal", () => {
  const f = fixture("forwarded-raw", 1, false, false, true);
  try {
    const before = beforeRecords(f), traceFile = path.join(f.dir, "actual-raw-forwarded.json"); let child: any;
    withNativeTransaction(f.root, { operation: "fixture-raw-forwarding-owner" }, () => {
      child = spawnSync(process.execPath, ["--input-type=module", "-e", `
        import fs from 'node:fs';import {syncBuiltinESMExports} from 'node:module';
        const [url,root,event,traceFile]=process.argv.slice(1),trace=[],fds=new Map(),original={};
        for(const name of ['openSync','writeFileSync','fsyncSync','closeSync','mkdirSync']){
          original[name]=fs[name];fs[name]=(...args)=>{const resource=typeof args[0]==='number'?fds.get(args[0]):args[0];
            const result=original[name](...args);if(name==='openSync')fds.set(result,args[0]);
            trace.push({name,resource,args:name==='openSync'?[args[0],args[1],args[2]]:name==='writeFileSync'?[resource,String(args[1])]:args});
            if(name==='closeSync')fds.delete(args[0]);return result;};
        }
        syncBuiltinESMExports();const n=await import(url);let code=null;
        try{n.handleNativeEvent(root,JSON.parse(event),{waitMs:30})}catch(e){code=e.code}
        original.writeFileSync(traceFile,JSON.stringify({trace,code}));
      `, nativeUrl, f.root, JSON.stringify(event("PreToolUse", f.records[0].native.binding.agentId,
        { tool_name: "Bash", tool_use_id: "forwarded-blocked", tool_input: { command: `cd -- '${f.lanes[0]}' && true` } })), traceFile], { encoding: "utf8", timeout: 5_000 });
    });
    expect(child.status, child.stderr).toBe(0); unchanged(f, before);
    const result = JSON.parse(readFileSync(traceFile, "utf8")), trace: any[] = result.trace;
    expect(result.code).toBe("NATIVE_TRANSACTION_BUSY");
    const dir = nativeTransactionRefusalDir(f.root), files = readdirSync(dir); expect(files).toHaveLength(1);
    const file = path.join(dir, files[0]!), raw = readFileSync(file, "utf8"), refusal = JSON.parse(raw);
    expect(raw).toBe(encode(refusal)); expect(refusal.outcome).toBe("unknown"); expect(refusal.owner.pid).toBe(process.pid);
    expect(refusal.requester.attempt).toBe(f.records[0].attempt); expect(refusal.requester.attribution).toBe("recorded-binding");
    const oi = trace.findIndex(v => v.name === "openSync" && v.resource === file), wi = trace.findIndex(v => v.name === "writeFileSync" && v.resource === file);
    const fi = trace.findIndex(v => v.name === "fsyncSync" && v.resource === file), ci = trace.findIndex(v => v.name === "closeSync" && v.resource === file);
    const di = trace.findIndex((v, i) => i > ci && v.name === "fsyncSync" && v.resource === dir);
    expect(trace[oi].args.slice(1)).toEqual(["wx", 0o600]); expect(trace[wi].args[1]).toBe(raw);
    expect(oi).toBeLessThan(wi); expect(wi).toBeLessThan(fi); expect(fi).toBeLessThan(ci); expect(di).toBeGreaterThan(ci);
    console.info("actual raw forwarding calls", JSON.stringify(trace.map(v => ({ name: v.name, resource: v.resource, args: v.name === "writeFileSync" ? [sha(v.args[1])] : v.args }))));
    withNativeTransaction(f.root, { operation: "fixture-forwarded-raw-absorb" }, () => undefined);
    expect(JSON.parse(readFileSync(nativeTransactionFaultPath(f.root, refusal.id), "utf8")).rawContent).toBe(raw);
    expect(readNativeRecord(f.root, f.records[0].attempt).native.receipts).toEqual(f.records[0].native.receipts);
  } finally { f.cleanup(); }
});

test("actual atomic persistence boundaries retain immutable intent and replay target and progress writes exactly once after process crashes", () => {
  test.setTimeout(180_000);
  const f = fixture("atomic-process-boundaries");
  try {
    const original = beforeRecords(f)[0]!;
    let serial = 0;
    const cases: Array<[string, string, number]> = [];
    for (const role of ["intent", "target", "progress"]) for (const stage of atomicStages) cases.push([role, stage, role === "progress" ? 2 : 1]);
    for (const [role, stage, ordinal] of cases) {
      writeFileSync(nativeRecordPath(f.root, f.records[0].attempt), original);
      f.request.id = `low-level-${serial++}`;
      const intentFile = nativeRecoveryIntentPath(f.root, f.request.id);
      const selected = role === "target" ? nativeRecordPath(f.root, f.records[0].attempt) : intentFile;
      const crashed = persistenceCrash(f, "recover", selected, stage, ordinal);
      expect(crashed.status, `${role}/${stage}: ${crashed.stderr}`).toBe(73);
      const intentBeforeReplay = existsSync(intentFile) ? readFileSync(intentFile, "utf8") : null;
      if (intentBeforeReplay !== null) {
        const intent = JSON.parse(intentBeforeReplay);
        expect(intent.request).toEqual(f.request); expect(intent.fingerprint).toMatch(/^[0-9a-f]{64}$/);
        expect(intent.fault.rawContent).toBe(f.fault.rawContent);
      }
      const targetBeforeReplay = readFileSync(nativeRecordPath(f.root, f.records[0].attempt), "utf8");
      // No partial target is ever published: the old record or a complete exact disposition.
      if (targetBeforeReplay !== original) expect(JSON.parse(targetBeforeReplay).native.transactionDispositions).toHaveLength(1);
      const resumed = cli(f); expect(resumed.status, `${role}/${stage}: ${resumed.stderr}`).toBe(0);
      const after = readNativeRecord(f.root, f.records[0].attempt);
      expect(after.native.transactionDispositions).toHaveLength(1); expect(after.native.receipts).toEqual(f.records[0].native.receipts);
      expect(activeNativeHolds(after)).toEqual([]); expect(after.state).toBe("finished");
      expect(JSON.parse(readFileSync(intentFile, "utf8")).completed).toEqual([0]);
      const stable = beforeRecords(f); expect(cli(f).status).toBe(0); unchanged(f, stable);
    }
    for (const stage of ["before-directory-create", "directory-create", "before-parent-fsync", "parent-fsync"]) {
      writeFileSync(nativeRecordPath(f.root, f.records[0].attempt), original);
      rmSync(path.dirname(nativeRecoveryIntentPath(f.root, f.request.id)), { recursive: true, force: true });
      f.request.id = `namespace-${serial++}`;
      const crashed = persistenceCrash(f, "recover", path.dirname(nativeRecoveryIntentPath(f.root, f.request.id)), stage);
      expect(crashed.status, stage + crashed.stderr).toBe(73);
      unchanged(f, [original]);
      const resumed = cli(f); expect(resumed.status, resumed.stderr).toBe(0);
      expect(readNativeRecord(f.root, f.records[0].attempt).native.transactionDispositions).toHaveLength(1);
    }
  } finally { f.cleanup(); }
});

test("raw refusal archive and every hold write survive process interruption with distinct replay and durable sidecar retirement", () => {
  test.setTimeout(180_000);
  const f = fixture("absorption-process-boundaries", 2, false, true, true);
  try {
    const originals = beforeRecords(f), dir = nativeTransactionRefusalDir(f.root);
    mkdirSync(dir, { recursive: true });
    const rawFile = path.join(dir, "fixture-original.json"), archive = nativeTransactionFaultPath(f.root, f.fault.id);
    const cases: Array<[string, string]> = [];
    for (const file of [archive, ...f.records.map((r: any) => nativeRecordPath(f.root, r.attempt))]) for (const stage of atomicStages) cases.push([file, stage]);
    for (const stage of ["before-retire", "retire", "before-retirement-fsync", "retirement-fsync"]) cases.push([rawFile, stage]);
    for (const [file, stage] of cases) {
      f.records.forEach((r: any, i: number) => writeFileSync(nativeRecordPath(f.root, r.attempt), originals[i]!));
      rmSync(archive, { force: true }); writeFileSync(rawFile, f.fault.rawContent);
      const crashed = persistenceCrash(f, "absorb", file, stage);
      expect(crashed.status, `${path.basename(file)}/${stage}: ${crashed.stderr}`).toBe(73);
      if (existsSync(archive)) expect(JSON.parse(readFileSync(archive, "utf8")).rawContent).toBe(f.fault.rawContent);
      withNativeTransaction(f.root, { operation: "fixture-resume-absorption" }, () => undefined);
      expect(readdirSync(dir)).toEqual([]);
      for (const r of f.records) {
        const after = readNativeRecord(f.root, r.attempt);
        expect(after.native.holds.filter((h: any) => h.refusal?.id === f.fault.id)).toHaveLength(1);
        expect(after.native.receipts).toEqual(r.native.receipts); expect(after.state).toBe(r.state);
      }
      expect(JSON.parse(readFileSync(archive, "utf8")).rawDigest).toBe(sha(f.fault.rawContent));
      // Re-presenting the same durable raw bytes does not duplicate any hold.
      writeFileSync(rawFile, f.fault.rawContent);
      withNativeTransaction(f.root, { operation: "fixture-distinct-replay" }, () => undefined);
      for (const r of f.records) expect(readNativeRecord(f.root, r.attempt).native.holds.filter((h: any) => h.refusal?.id === f.fault.id)).toHaveLength(1);
    }
    const distinct = { ...f.fault.refusal, id: sha("second independent absorption") }, raw = encode(distinct);
    writeFileSync(path.join(dir, "fixture-distinct.json"), raw);
    withNativeTransaction(f.root, { operation: "fixture-distinct-identity" }, () => undefined);
    expect(JSON.parse(readFileSync(nativeTransactionFaultPath(f.root, distinct.id), "utf8")).rawContent).toBe(raw);
    for (const r of f.records) expect(readNativeRecord(f.root, r.attempt).native.holds.filter((h: any) => [f.fault.id, distinct.id].includes(h.refusal?.id))).toHaveLength(2);
    writeFileSync(rawFile, encode({ ...f.fault.refusal, reason: "different bytes with original identity" }));
    expect(errorCode(() => withNativeTransaction(f.root, { operation: "fixture-conflicting-raw" }, () => undefined))).toBe("NATIVE_FAULT_REUSED");
    expect(existsSync(rawFile)).toBe(true); expect(JSON.parse(readFileSync(archive, "utf8")).rawContent).toBe(f.fault.rawContent);
  } finally { f.cleanup(); }
});

test("raw refusal write and namespace interruption preserves unknown partial evidence without fabricated callbacks", () => {
  test.setTimeout(90_000);
  const f = fixture("raw-process-boundaries", 1, false, false, true);
  try {
    const original = beforeRecords(f)[0]!, dir = nativeTransactionRefusalDir(f.root);
    const stages = ["before-raw-create", "raw-create", "before-write", "write", "before-file-fsync", "file-fsync", "before-close", "close", "before-directory-fsync", "directory-fsync",
      "before-directory-create", "directory-create", "before-parent-fsync", "parent-fsync"];
    for (const stage of stages) {
      writeFileSync(nativeRecordPath(f.root, f.records[0].attempt), original);
      rmSync(dir, { recursive: true, force: true });
      let child: any;
      withNativeTransaction(f.root, { operation: "fixture-raw-owner" }, () => {
        child = spawnSync(process.execPath, ["--input-type=module", "-e", `
          const [url,root,stage,dir,event]=process.argv.slice(1);const n=await import(url);
          n.withNativeDurabilityObserver(e=>{if(e.stage===stage&&(e.kind==='raw-refusal'||e.file===dir||e.directory===dir))process.exit(73)},
            ()=>n.handleNativeEvent(root,JSON.parse(event),{waitMs:30}));
        `, nativeUrl, f.root, stage, dir, JSON.stringify(event("PreToolUse", f.records[0].native.binding.agentId,
          { tool_name: "Bash", tool_use_id: "crashed-raw", tool_input: { command: `cd -- '${f.lanes[0]}' && true` } }))], { encoding: "utf8", timeout: 5_000 });
      });
      expect(child.status, stage + child.stderr).toBe(73); unchanged(f, [original]);
      const files = existsSync(dir) ? readdirSync(dir) : [];
      if (files.length === 0) continue; // crash before publishing even a partial raw file
      expect(files).toHaveLength(1); expect(files[0]).toMatch(/^[0-9a-f]{64}-/);
      const file = path.join(dir, files[0]!), raw = readFileSync(file, "utf8");
      if (raw === "") {
        expect(errorCode(() => withNativeTransaction(f.root, { operation: "fixture-read-partial" }, () => undefined))).toBe("NATIVE_TRANSACTION_REFUSAL_UNREADABLE");
        expect(readFileSync(file, "utf8")).toBe(raw); unchanged(f, [original]);
      } else {
        const refusal = JSON.parse(raw); expect(refusal.outcome).toBe("unknown"); expect(refusal.requester.attribution).toBe("recorded-binding");
        withNativeTransaction(f.root, { operation: "fixture-read-complete-raw" }, () => undefined);
        expect(JSON.parse(readFileSync(nativeTransactionFaultPath(f.root, refusal.id), "utf8")).rawContent).toBe(raw);
        const after = readNativeRecord(f.root, f.records[0].attempt);
        expect(after.native.receipts).toEqual(f.records[0].native.receipts);
        expect(after.native.holds.filter((h: any) => h.refusal?.id === refusal.id)).toHaveLength(1);
      }
    }
    writeFileSync(nativeRecordPath(f.root, f.records[0].attempt), original);
    rmSync(dir, { recursive: true, force: true }); mkdirSync(dir);
    const partialFile = path.join(dir, `${f.fault.id}-fixture-partial.json`), partial = f.fault.rawContent.slice(0, 80);
    writeFileSync(partialFile, partial);
    expect(errorCode(() => withNativeTransaction(f.root, { operation: "fixture-partial-byte-read" }, () => undefined))).toBe("NATIVE_TRANSACTION_REFUSAL_UNREADABLE");
    expect(readFileSync(partialFile, "utf8")).toBe(partial); unchanged(f, [original]);
  } finally { f.cleanup(); }
});

test("forwarded filesystem calls prove exclusive complete atomic publication and real directory namespace and retirement flush order", () => {
  const f = fixture("forwarded-persistence", 1, false, true, true);
  const recovery = fixture("forwarded-recovery");
  try {
    const traceFile = path.join(f.dir, "actual-forwarded-syscalls.json"), output = path.join(f.dir, "new-parent/new-child/atomic.json");
    const dir = nativeTransactionRefusalDir(f.root); mkdirSync(dir, { recursive: true });
    const rawFile = path.join(dir, "fixture-original.json"); writeFileSync(rawFile, f.fault.rawContent);
    const requestFile = path.join(recovery.dir, "trace-request.json"); writeFileSync(requestFile, encode(recovery.request));
    const child = spawnSync(process.execPath, ["--input-type=module", "-e", `
      import fs from 'node:fs'; import {syncBuiltinESMExports} from 'node:module';
      const [url,root,output,traceFile,recoveryUrl,recoveryRoot,requestFile]=process.argv.slice(1), trace=[],fds=new Map(),orig={};
      for(const name of ['openSync','writeFileSync','fsyncSync','closeSync','renameSync','mkdirSync','unlinkSync']){
        orig[name]=fs[name];fs[name]=(...args)=>{
          const resource=typeof args[0]==='number'?fds.get(args[0]):args[0];
          const result=orig[name](...args);
          if(name==='openSync')fds.set(result,args[0]);
          trace.push({name,resource,args:name==='openSync'?[args[0],args[1]]:name==='writeFileSync'?[resource,String(args[1])]:args});
          if(name==='closeSync')fds.delete(args[0]);return result;
        };
      }
      syncBuiltinESMExports(); const n=await import(url);
      n.atomicJson(output,{exact:'complete UTF8',unknown:true});
      n.withNativeTransaction(root,{operation:'forwarded-absorption'},()=>undefined);
      const r=await import(recoveryUrl);r.recoverNativeTransaction(recoveryRoot,JSON.parse(fs.readFileSync(requestFile,'utf8')));
      let collided=null,code=null;
      n.withNativeDurabilityObserver(e=>{if(e.stage==='before-temp-create'&&e.file===output+'.collision'){
        collided=e.temp;orig.writeFileSync(collided,'owned collision',{flag:'wx',mode:0o600});
      }},()=>{try{n.atomicJson(output+'.collision',{would:'overwrite'})}catch(e){code=e.code}});
      orig.writeFileSync(traceFile,JSON.stringify({trace,collided,code,collisionBytes:fs.existsSync(collided)?fs.readFileSync(collided,'utf8'):'<missing>',published:fs.existsSync(output+'.collision')}));
    `, nativeUrl, f.root, output, traceFile, recoveryUrl, recovery.root, requestFile], { encoding: "utf8", timeout: 15_000 });
    expect(child.status, child.stderr).toBe(0);
    const result = JSON.parse(readFileSync(traceFile, "utf8")), trace: any[] = result.trace;
    expect(result.code).toBe("EEXIST"); expect(result.collisionBytes).toBe("owned collision"); expect(result.published).toBe(false);
    expect(readFileSync(output, "utf8")).toBe(encode({ exact: "complete UTF8", unknown: true }));
    const recoveryIntent = nativeRecoveryIntentPath(recovery.root, recovery.request.id), recoveryTarget = nativeRecordPath(recovery.root, recovery.records[0].attempt);
    const renames = trace.filter(v => v.name === "renameSync" && [output, nativeTransactionFaultPath(f.root, f.fault.id), nativeRecordPath(f.root, f.records[0].attempt), recoveryIntent, recoveryTarget].includes(v.args[1]));
    expect(renames.some(v => v.args[1] === nativeTransactionFaultPath(f.root, f.fault.id))).toBe(true);
    expect(renames.some(v => v.args[1] === nativeRecordPath(f.root, f.records[0].attempt))).toBe(true);
    expect(renames.filter(v => v.args[1] === recoveryIntent)).toHaveLength(2);
    expect(renames.filter(v => v.args[1] === recoveryTarget)).toHaveLength(1);
    for (const rename of renames) {
      const temp = rename.args[0], final = rename.args[1], ri = trace.indexOf(rename);
      const oi = trace.findIndex(v => v.name === "openSync" && v.resource === temp);
      const wi = trace.findIndex(v => v.name === "writeFileSync" && v.resource === temp);
      const fi = trace.findIndex(v => v.name === "fsyncSync" && v.resource === temp);
      const ci = trace.findIndex(v => v.name === "closeSync" && v.resource === temp);
      const di = trace.findIndex((v, i) => i > ri && v.name === "fsyncSync" && v.resource === path.dirname(final));
      expect(trace[oi].args[1]).toBe("wx"); expect(oi).toBeLessThan(wi); expect(wi).toBeLessThan(fi);
      expect(fi).toBeLessThan(ci); expect(ci).toBeLessThan(ri); expect(di).toBeGreaterThan(ri);
      expect(trace[wi].args[1]).toBe(encode(JSON.parse(trace[wi].args[1])));
      if (final !== recoveryIntent) expect(trace[wi].args[1]).toBe(readFileSync(final, "utf8"));
    }
    for (const mkdir of trace.filter(v => v.name === "mkdirSync" && [path.dirname(output), path.dirname(path.dirname(output)), path.dirname(nativeTransactionFaultPath(f.root, f.fault.id))].includes(v.resource))) {
      const mi = trace.indexOf(mkdir);
      const fi = trace.findIndex((v, i) => i > mi && v.name === "fsyncSync" && v.resource === path.dirname(mkdir.resource));
      const childWrite = trace.findIndex((v, i) => i > mi && ["openSync", "mkdirSync"].includes(v.name) && typeof v.resource === "string" && v.resource.startsWith(mkdir.resource + path.sep));
      expect(fi).toBeGreaterThan(mi); expect(fi).toBeLessThan(childWrite);
    }
    const retirement = trace.findIndex(v => v.name === "unlinkSync" && v.resource === rawFile);
    expect(retirement).toBeGreaterThan(trace.findIndex(v => v.name === "renameSync" && v.args[1] === nativeRecordPath(f.root, f.records[0].attempt)));
    expect(trace.findIndex((v, i) => i > retirement && v.name === "fsyncSync" && v.resource === dir)).toBeGreaterThan(retirement);
  } finally { recovery.cleanup(); f.cleanup(); }
});

function installGrant(f: any, revision = 1, revoked = false): void {
  const schemaFile = path.join(f.root, "method/runtime/process-schema.yaml"); mkdirSync(path.dirname(schemaFile), { recursive: true });
  writeFileSync(schemaFile, readFileSync(new URL("../../../method/runtime/process-schema.yaml", import.meta.url)));
  const ids = f.records.map((r: any) => r.assignment.id);
  const block = ["dispatch:", "  approval: standing", "  recovery: repairs", "  grant:", '    given_by: "fixture owner"',
    `    at: "${AT}"`, `    revision: ${revision}`, `    order: [${ids.join(", ")}]`, "    cards:",
    ...ids.map((id: string) => `      ${id}: ${git(f.root, ["hash-object", `docs/tasks/${id}-fixture.md`])}`),
    ...(revoked ? ["  revoked:", `    at: "${AT}"`, '    by: "fixture owner"'] : []), "  history: []", ""].join("\n");
  writeFileSync(path.join(f.root, GRANT_STORE_REL_PATH), composeGrantSnapshot({ blockText: block, root: f.root, revision, writtenBy: "fixture coordinator", at: AT }));
}

test("every pending target independently rechecks records reservations bindings origins candidate and policy after the first committed effect", () => {
  test.setTimeout(90_000);
  const changes: Array<[string, (f: any) => void]> = [
    ["record", f => { const r = readNativeRecord(f.root, f.records[1].attempt); r.report = "changed pending"; writeNativeRecord(f.root, r); }],
    ["reservation", f => atomicJson(f.records[1].reservation.file, { version: 1, attempt: "T-foreign-a1", resource: f.lanes[1] })],
    ["binding", f => { const r = readNativeRecord(f.root, f.records[1].attempt); r.native.binding.startTurnId = "later generation"; writeNativeRecord(f.root, r); }],
    ["origins", f => writeFileSync(f.records[1].assignment.brief, "changed admission origins\n")],
    ["candidate", f => { writeFileSync(path.join(f.lanes[1], "allowed.txt"), "new head\n"); git(f.lanes[1], ["add", "allowed.txt"]); git(f.lanes[1], ["commit", "-qm", "new pending candidate"]); }],
    ["pause", f => atomicJson(path.join(f.root, PAUSE_REL_PATH), { version: 1, scope: "all", by: "owner", at: AT })],
    ["revoked-valid-grant", f => installGrant(f, 1, true)],
    ["changed-valid-grant", f => installGrant(f, 2)],
    ["seat", f => { const row = processRow(process.pid)!; writeHolder(f.root, { pid: process.pid, startedAt: row.startedAt, program: row.command }); }],
    ["owner-reference", f => writeFileSync(f.evidencePath, "authorization revoked\n")],
  ];
  for (const [name, change] of changes) {
    const f = fixture(`pending-${name}`, 2, true, true);
    try {
      authorize(f); if (name.includes("valid-grant")) installGrant(f);
      expect(() => recoverNativeTransaction(f.root, f.request, { onBoundary: (stage, index) => { if (stage === "progress" && index === 0) throw Error("fixture interruption"); } })).toThrow("fixture interruption");
      const first = readFileSync(nativeRecordPath(f.root, f.records[0].attempt), "utf8");
      expect(JSON.parse(first).native.transactionDispositions).toHaveLength(1);
      change(f); const pending = readFileSync(nativeRecordPath(f.root, f.records[1].attempt), "utf8");
      const result = cli(f); expect(result.status, `${name}: ${result.stderr}`).toBe(1);
      expect(readFileSync(nativeRecordPath(f.root, f.records[0].attempt), "utf8")).toBe(first);
      expect(readFileSync(nativeRecordPath(f.root, f.records[1].attempt), "utf8")).toBe(pending);
      expect(JSON.parse(pending).native.transactionDispositions).toBeUndefined();
      expect(JSON.parse(readFileSync(nativeRecoveryIntentPath(f.root, f.request.id), "utf8")).completed).toEqual([0]);
    } finally { f.cleanup(); }
  }
});

test("exact target bytes on interrupted replay still require current physical cessation reservation origins policy and pending fault checks", async () => {
  test.setTimeout(90_000);
  const probe = net.createServer(); await new Promise<void>(resolve => probe.listen(0, "127.0.0.1", resolve));
  const port = (probe.address() as net.AddressInfo).port; await new Promise<void>(resolve => probe.close(() => resolve()));
  const changes: Array<[string, (f: any) => void | Promise<void>]> = [
    ["reservation", f => atomicJson(f.records[0].reservation.file, { version: 1, attempt: "T-foreign-a1", resource: f.lanes[0] })],
    ["origins", f => writeFileSync(f.records[0].assignment.brief, "changed completed origin\n")],
    ["candidate", f => { writeFileSync(path.join(f.lanes[0], "allowed.txt"), "new completed head\n"); git(f.lanes[0], ["add", "allowed.txt"]); git(f.lanes[0], ["commit", "-qm", "changed completed candidate"]); }],
    ["pause", f => atomicJson(path.join(f.root, PAUSE_REL_PATH), { version: 1, scope: "all", by: "owner", at: AT })],
    ["seat", f => { const row = processRow(process.pid)!; writeHolder(f.root, { pid: process.pid, startedAt: row.startedAt, program: row.command }); }],
    ["new-pending-fault", f => { const dir = nativeTransactionRefusalDir(f.root); mkdirSync(dir, { recursive: true }); writeFileSync(path.join(dir, "pending.json"), encode({ ...f.fault.refusal, id: sha("new-pending-replay") })); }],
    ["live-replayed-port", async () => { await new Promise<void>(resolve => probe.listen(port, "127.0.0.1", resolve)); }],
  ];
  for (const [name, change] of changes) {
    const f = fixture(`exact-replay-${name}`, 2, true, true);
    try {
      if (name === "live-replayed-port") {
        const r = readNativeRecord(f.root, f.records[0].attempt); r.ownedJobs = [{ kind: "port", id: String(port) }]; writeNativeRecord(f.root, r);
        f.request.targets[0] = nativeRecoveryTarget(f.root, r.attempt, f.base, "collected-source");
      }
      authorize(f);
      expect(() => recoverNativeTransaction(f.root, f.request, { onBoundary: (stage, index) => { if (stage === "target" && index === 0) throw Error("fixture interruption before progress"); } })).toThrow("fixture interruption before progress");
      const before = beforeRecords(f); expect(JSON.parse(before[0]!).native.transactionDispositions).toHaveLength(1);
      await change(f); const result = cli(f); expect(result.status, `${name}: ${result.stderr}`).toBe(1); unchanged(f, before);
      expect(JSON.parse(readFileSync(nativeRecoveryIntentPath(f.root, f.request.id), "utf8")).completed).toEqual([]);
      expect(JSON.parse(before[1]!).native.transactionDispositions).toBeUndefined();
      expect(JSON.parse(before[0]!).native.transactionDispositions[0].outcome).toBe("unknown");
    } finally {
      if (probe.listening) await new Promise<void>(resolve => probe.close(() => resolve()));
      f.cleanup();
    }
  }
});

test("public data controls distinguish malformed jobs ports collection modes and cumulative historical scope without target effects", async () => {
  test.setTimeout(90_000);
  const server = net.createServer(); await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const port = (server.address() as net.AddressInfo).port;
  const cases: Array<[string, (f: any, r: any) => void]> = [
    ["live-port", (_f, r) => { r.ownedJobs = [{ kind: "port", id: String(port) }]; }],
    ["invalid-port", (_f, r) => { r.ownedJobs = [{ kind: "port", id: "65536" }]; }],
    ["zero-port", (_f, r) => { r.ownedJobs = [{ kind: "port", id: "0" }]; }],
    ["invalid-job-shape", (_f, r) => { r.ownedJobs = [null]; }],
    ["invalid-job-list", (_f, r) => { r.ownedJobs = {}; }],
    ["invalid-binding-time", (_f, r) => { r.native.binding.boundAt = "not-an-instant"; }],
    ["duplicate-identity-proof", (_f, r) => { r.native.probes.push(structuredClone(r.native.probes[0])); }],
    ["foreign-malformed-job", (f, r) => { const other = structuredClone(r); other.attempt = "T-foreign-a1"; other.ownedJobs = [{ kind: "pid", id: "0" }]; writeNativeRecord(f.root, other); }],
    ["tampered-collection-scope", (_f, r) => { r.native.collection.check.base = "0".repeat(40); }],
    ["tampered-collection-date", (_f, r) => { r.native.collection.checkedAt = "2026-10-06T00:05:00.000Z"; }],
    ["missing-collect-event", (_f, r) => { r.events = r.events.filter((e: any) => e.op !== "collect"); }],
    ["missing-collection-ref", (_f, r) => { r.refs = []; }],
    ["bad-recovery-mode", f => { f.request.targets[0].mode = "skip"; }],
    ["bad-target-type", f => { f.request.targets[0].record = true; }],
    ["earlier-outside-rename", f => {
      git(f.lanes[0], ["mv", "outside.txt", "docs/tasks/renamed.md"]); git(f.lanes[0], ["commit", "-qm", "earlier out-of-fence rename"]);
      writeFileSync(path.join(f.lanes[0], "allowed.txt"), "later in-fence edit\n"); git(f.lanes[0], ["add", "allowed.txt"]); git(f.lanes[0], ["commit", "-qm", "later allowed edit"]);
      f.base = git(f.lanes[0], ["rev-parse", "HEAD"]);
    }],
    ["earlier-outside-mode", f => {
      chmodSync(path.join(f.lanes[0], "outside.txt"), 0o755);
      git(f.lanes[0], ["add", "outside.txt"]); git(f.lanes[0], ["commit", "-qm", "earlier outside mode"]);
      writeFileSync(path.join(f.lanes[0], "allowed.txt"), "later in-fence edit\n"); git(f.lanes[0], ["add", "allowed.txt"]); git(f.lanes[0], ["commit", "-qm", "later allowed edit"]);
      f.base = git(f.lanes[0], ["rev-parse", "HEAD"]);
    }],
    ["earlier-outside-type", f => {
      rmSync(path.join(f.lanes[0], "outside.txt")); mkdirSync(path.join(f.lanes[0], "outside.txt")); writeFileSync(path.join(f.lanes[0], "outside.txt/child"), "type change\n");
      git(f.lanes[0], ["add", "."]); git(f.lanes[0], ["commit", "-qm", "earlier outside type"]);
      writeFileSync(path.join(f.lanes[0], "allowed.txt"), "later in-fence edit\n"); git(f.lanes[0], ["add", "allowed.txt"]); git(f.lanes[0], ["commit", "-qm", "later allowed edit"]);
      f.base = git(f.lanes[0], ["rev-parse", "HEAD"]);
    }],
  ];
  try {
    for (const [name, change] of cases) {
      const f = fixture(`data-${name}`, 1, true, true);
      try {
        const r = readNativeRecord(f.root, f.records[0].attempt); change(f, r);
        // Intentionally malformed data is fixture-owned, never written by a recovery operation.
        writeFileSync(nativeRecordPath(f.root, r.attempt), encode(r));
        if (!name.startsWith("bad-")) f.request.targets = [nativeRecoveryTarget(f.root, r.attempt, f.base, name.startsWith("earlier-") ? "terminal" : "collected-source")];
        authorize(f); const before = beforeRecords(f), result = cli(f);
        expect(result.status, `${name}: ${result.stderr}`).toBe(1); unchanged(f, before);
        expect(existsSync(nativeRecoveryIntentPath(f.root, f.request.id))).toBe(false);
      } finally { f.cleanup(); }
    }
    const valid = fixture("valid-grant-data", 1, true, true);
    try { authorize(valid); installGrant(valid); const result = cli(valid); expect(result.status, result.stderr).toBe(0); }
    finally { valid.cleanup(); }
  } finally { await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); }
});

test("separate process recovery races serialize identical requests and refuse conflicting immutable identifiers", async () => {
  test.setTimeout(60_000);
  for (const conflict of [false, true]) {
    const f = fixture(`race-${conflict}`);
    const ready = path.join(f.dir, "first-ready"), release = path.join(f.dir, "release-first"), requestFile = path.join(f.dir, "race-request.json");
    writeFileSync(requestFile, encode(f.request));
    const first = spawn(process.execPath, ["--input-type=module", "-e", `
      import {readFileSync,writeFileSync,existsSync} from 'node:fs';
      const [url,root,file,ready,release]=process.argv.slice(1),{recoverNativeTransaction}=await import(url);
      const result=recoverNativeTransaction(root,JSON.parse(readFileSync(file,'utf8')),{onBoundary:(stage)=>{
        if(stage==='intent'){writeFileSync(ready,'durable intent');const end=Date.now()+5000;
        while(!existsSync(release)){if(Date.now()>end)throw Error('fixture barrier expired');Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,5)}}}});
      process.stdout.write(JSON.stringify(result));
    `, recoveryUrl, f.root, requestFile, ready, release], { stdio: ["ignore", "pipe", "pipe"] });
    let firstOut = "", firstErr = ""; first.stdout!.on("data", data => { firstOut += data; }); first.stderr!.on("data", data => { firstErr += data; });
    const done = new Promise<number | null>((resolve, reject) => { first.once("error", reject); first.once("close", resolve); });
    let secondDone: Promise<number | null> | undefined, second: ReturnType<typeof spawn> | undefined, secondOut = "", secondErr = "";
    try {
      const end = Date.now() + 5000; while (!existsSync(ready)) { if (Date.now() > end) throw Error("race never reached intent"); await new Promise(resolve => setTimeout(resolve, 5)); }
      const secondFile = path.join(f.dir, "second-request.json"), request = structuredClone(f.request);
      if (conflict) request.targets[0].mode = "collected-source";
      writeFileSync(secondFile, encode(request));
      second = spawn(process.execPath, [recoveryScript, "--root", f.root, "--request", secondFile], { stdio: ["ignore", "pipe", "pipe"] });
      second.stdout!.on("data", data => { secondOut += data; }); second.stderr!.on("data", data => { secondErr += data; });
      secondDone = new Promise((resolve, reject) => { second!.once("error", reject); second!.once("close", resolve); });
      await new Promise(resolve => setTimeout(resolve, 50)); writeFileSync(release, "release");
      expect(await done, firstErr).toBe(0); expect(await secondDone, secondErr).toBe(conflict ? 1 : 0);
      if (conflict) expect(secondErr).toContain("IDENTIFIER_REUSED"); else expect(JSON.parse(secondOut).fingerprint).toBe(JSON.parse(firstOut).fingerprint);
      expect(readNativeRecord(f.root, f.records[0].attempt).native.transactionDispositions).toHaveLength(1);
      expect(existsSync(nativeTransactionRefusalDir(f.root)) ? readdirSync(nativeTransactionRefusalDir(f.root)) : []).toEqual([]);
    } finally { writeFileSync(release, "release"); await done; if (secondDone) await secondDone; f.cleanup(); }
  }
});

test("independently bound requester contexts stay scoped while absent stale malformed mismatched and changed generations remain unknown", () => {
  test.setTimeout(90_000);
  const f = fixture("requester-generations", 2, false, false, true);
  try {
    const originals = beforeRecords(f), dir = nativeTransactionRefusalDir(f.root);
    const cases: Array<[string, (e: any, f: any) => any, number | null]> = [
      ["first-bound", e => e, 0], ["second-bound", e => e, 1],
      ["absent", () => undefined, null], ["stale-turn", e => ({ ...e, turn_id: "old-turn" }), null],
      ["mismatched-session", e => ({ ...e, session_id: "other-session" }), null],
      ["malformed-agent", e => ({ ...e, agent_id: {} }), null],
      ["changed-binding-generation", (e, bench) => { const r = readNativeRecord(bench.root, bench.records[0].attempt); r.native.binding.boundAt = "2026-10-06T00:00:09.000Z"; writeNativeRecord(bench.root, r); return e; }, null],
      ["missing-identity-proof", (e, bench) => { const r = readNativeRecord(bench.root, bench.records[0].attempt); r.native.probes = []; writeNativeRecord(bench.root, r); return e; }, null],
      ["start-generation-mismatch", (e, bench) => { const r = readNativeRecord(bench.root, bench.records[0].attempt); r.native.start.turnId = "prior-generation"; writeNativeRecord(bench.root, r); return e; }, null],
    ];
    const identities: string[] = [];
    for (const [name, change, expected] of cases) {
      f.records.forEach((r: any, i: number) => writeFileSync(nativeRecordPath(f.root, r.attempt), originals[i]!));
      const e = change(event("PreToolUse", f.records[expected === 1 ? 1 : 0].native.binding.agentId), f);
      let child: any;
      withNativeTransaction(f.root, { operation: `fixture-owner-${name}` }, () => {
        child = spawnSync(process.execPath, ["--input-type=module", "-e", `
          const [url,root,event]=process.argv.slice(1),{withNativeTransaction}=await import(url);
          try{withNativeTransaction(root,{operation:'fixture-requester',waitMs:30,...(event==='undefined'?{}:{requesterEvent:JSON.parse(event)})},()=>{throw Error('callback unexpectedly ran')})}
          catch(e){process.stdout.write(e.code||String(e))}
        `, nativeUrl, f.root, e === undefined ? "undefined" : JSON.stringify(e)], { encoding: "utf8", timeout: 5_000 });
      });
      expect(child.status, child.stderr).toBe(0); expect(child.stdout).toBe("NATIVE_TRANSACTION_BUSY");
      const rawFiles = readdirSync(dir); expect(rawFiles).toHaveLength(1);
      const raw = readFileSync(path.join(dir, rawFiles[0]!), "utf8"), refusal = JSON.parse(raw); identities.push(refusal.id);
      expect(refusal.requester.attribution, name).toBe(expected === null ? "unknown" : "recorded-binding");
      if (expected !== null) expect(refusal.requester.attempt).toBe(f.records[expected].attempt);
      withNativeTransaction(f.root, { operation: `fixture-absorb-${name}` }, () => undefined);
      for (let i = 0; i < f.records.length; i++) {
        const after = readNativeRecord(f.root, f.records[i].attempt);
        expect(after.native.holds.some((h: any) => h.refusal?.id === refusal.id), `${name}/${i}`).toBe(expected === null || expected === i);
        expect(after.native.receipts).toEqual(f.records[i].native.receipts);
      }
      expect(JSON.parse(readFileSync(nativeTransactionFaultPath(f.root, refusal.id), "utf8")).rawContent).toBe(raw);
    }
    expect(new Set(identities).size).toBe(cases.length);
  } finally { f.cleanup(); }
});

function dependentFixture(): any {
  const f = fixture("ordered-dependency", 1, true, true, true);
  const source = readNativeRecord(f.root, f.records[0].attempt);
  const bench = path.join(f.dir, "failed-verifier"); git(f.root, ["worktree", "add", "--quiet", "--detach", bench, f.base]);
  prepareNativeBenchRun(f.root, { attempt: source.attempt, resource: bench, candidate: f.base, at: AT });
  const a: Assignment = { ...source.assignment, role: "verifier", resource: bench, cwd: bench,
    native: { ...source.assignment.native, taskName: "/root/failed-verifier", profile: "detached-verifier", executorAttempt: source.attempt } };
  const started = startRun(f.root, { assignment: a, at: AT }).record, agent = "fixture-failed-verifier";
  handleNativeEvent(f.root, event("SubagentStart", agent), { at: AT });
  const probe = { tool_name: "Bash", tool_use_id: "failed-probe", tool_input: { command: NATIVE_IDENTITY_PROBE } };
  handleNativeEvent(f.root, event("PreToolUse", agent, probe), { at: AT });
  handleNativeEvent(f.root, event("PostToolUse", agent, { ...probe, tool_response: { output: `${agent}\n` } }), { at: AT });
  bindRun(f.root, { attempt: started.attempt, harnessId: agent, at: AT });
  for (let i = 0; i < 10; i++) {
    const tool = { tool_name: "Bash", tool_use_id: `read-${i}`, tool_input: { command: `cd -- '${bench}' && git status --porcelain` } };
    handleNativeEvent(f.root, event("PreToolUse", agent, tool), { at: AT });
    const output = git(bench, ["status", "--porcelain"]);
    handleNativeEvent(f.root, event("PostToolUse", agent, { ...tool, tool_response: { output } }), { at: AT });
  }
  handleNativeEvent(f.root, event("PreToolUse", agent, { tool_name: "Bash", tool_use_id: "missing-post",
    tool_input: { command: `cd -- '${bench}' && git status --porcelain` } }), { at: AT });
  for (const attempt of [source.attempt, started.attempt]) {
    const r = readNativeRecord(f.root, attempt);
    addNativeHold(r, { key: `native-transaction-refusal:${f.fault.id}`, code: "native-transaction-refusal", refusal: f.fault.refusal, outcome: "unknown", recordedAt: AT });
    writeNativeRecord(f.root, r);
  }
  observeRun(f.root, { attempt: started.attempt, evidence: "RUN-DONE failed", at: "2026-10-06T00:00:03.000Z" });
  expect(errorCode(() => collectRun(f.root, { attempt: started.attempt, ref: f.base, at: "2026-10-06T00:00:04.000Z" }))).toBe("NATIVE_COLLECT_HELD");
  f.failedAttempt = started.attempt;
  f.request.targets = [nativeRecoveryTarget(f.root, source.attempt, f.base, "collected-source"),
    nativeRecoveryTarget(f.root, started.attempt, f.base, "failed-no-work")];
  return f;
}

function authorizeSequence(f: any, stem = "sequence"): void {
  authorize(f, "complete-ordered-owner-policy");
  const a = JSON.parse(readFileSync(f.authorizationFile, "utf8"));
  a.sequence = { version: 1, steps: f.request.targets.map((t: any, index: number) => ({ requestId: `${stem}-${index}`,
    target: structuredClone(t) })) };
  const quote = `Owner explicitly permits the complete ordered pair ${a.targets.map((t: any) => t.attempt).join(", ")} for only fault ${a.fault.id}, with ordinary independent reconciliation between steps and every check retained.`;
  writeFileSync(f.evidencePath, quote + "\n"); a.evidenceReference = { path: f.evidencePath, digest: sha(readFileSync(f.evidencePath)), quote };
  atomicJson(f.authorizationFile, a);
  f.sequencePolicy = a; f.sequenceAuthorization = { id: a.id, digest: sha(readFileSync(f.authorizationFile)) };
}
function sequenceRequest(f: any, index: number): any {
  const step = f.sequencePolicy.sequence.steps[index];
  return { version: 1, id: step.requestId, fault: f.request.fault,
    targets: [nativeRecoveryTarget(f.root, step.target.attempt, step.target.candidate, step.target.mode)],
    authorization: f.sequenceAuthorization, sequence: { version: 1, index } };
}
function reconcileSequence(f: any): any {
  return observeRun(f.root, { attempt: f.failedAttempt, evidence: "RUN-DONE failed", at: "2026-10-06T00:00:05.000Z" }).record;
}

test("complete owner-pinned ordered recovery supports genuine dependent reconciliation without singleton grants", () => {
  const f = dependentFixture();
  try {
    const first = f.request.targets[0].attempt, second = f.failedAttempt;
    const originalFirst = readNativeRecord(f.root, first), originalSecond = readNativeRecord(f.root, second);
    const originalCollection = encode(originalFirst.native.collection), originalOutcome = encode(originalFirst.outcome);
    authorize(f, "unsequenced-pair"); const singleton = { ...f.request, targets: [f.request.targets[0]] };
    expect(cli(f, singleton).stderr).toContain("AUTHORIZATION");
    expect(cli(f).stderr).toContain("OTHER_HOLD");
    authorizeSequence(f);
    const start = sequenceRequest(f, 0), nextBefore = sequenceRequest(f, 1);
    expect(cli(f, { ...start, sequence: undefined }).stderr).toContain("AUTHORIZATION");
    expect(cli(f, nextBefore).status).toBe(1);
    const otherBytes = readFileSync(nativeRecordPath(f.root, second), "utf8");
    const recovered = cli(f, start); expect(recovered.status, recovered.stderr).toBe(0);
    expect(readFileSync(nativeRecordPath(f.root, second), "utf8")).toBe(otherBytes);
    const stillHeld = cli(f, nextBefore); expect(stillHeld.status, stillHeld.stderr).toBe(1); expect(stillHeld.stderr).toContain("OTHER_HOLD");
    const reconciled = reconcileSequence(f);
    expect(activeNativeHolds(reconciled).map((h: any) => h.code)).toEqual(["native-transaction-refusal"]);
    expect(reconciled.native!.receipts).toEqual(originalSecond.native.receipts); expect(reconciled.outcome).toEqual(originalSecond.outcome);
    const next = sequenceRequest(f, 1), final = cli(f, next); expect(final.status, final.stderr).toBe(0);
    const afterFirst = readNativeRecord(f.root, first), afterSecond = readNativeRecord(f.root, second);
    expect(encode(afterFirst.native.collection)).toBe(originalCollection); expect(encode(afterFirst.outcome)).toBe(originalOutcome);
    expect(afterSecond.state).toBe("failed"); expect(afterSecond.native.collection).toBeUndefined();
    expect(afterSecond.native.receipts).toEqual(originalSecond.native.receipts); expect(afterSecond.outcome).toEqual(originalSecond.outcome);
    expect(afterSecond.native.holds.filter((h: any) => h.code !== "native-transaction-refusal")).toEqual(reconciled.native!.holds.filter((h: any) => h.code !== "native-transaction-refusal"));
    expect(activeNativeHolds(afterSecond)).toEqual([]);
    for (const [index, record] of [[0, afterFirst], [1, afterSecond]] as const) {
      expect(record.native.transactionDispositions).toHaveLength(1);
      expect(record.native.transactionDispositions[0].authorization.record.targets).toHaveLength(2);
      expect(record.native.transactionDispositions[0].fault.rawContent).toBe(f.fault.rawContent);
      expect(JSON.parse(readFileSync(nativeRecoveryIntentPath(f.root, f.sequencePolicy.sequence.steps[index].requestId), "utf8")).completed).toEqual([0]);
    }
    const finalBytes = [first, second].map(a => readFileSync(nativeRecordPath(f.root, a), "utf8"));
    expect(cli(f, start).status).toBe(0); expect(cli(f, next).status).toBe(0);
    expect([first, second].map(a => readFileSync(nativeRecordPath(f.root, a), "utf8"))).toEqual(finalBytes);
    const bench = path.join(f.dir, "sequence-fresh-bench"); git(f.root, ["worktree", "add", "--quiet", "--detach", bench, f.base]);
    const prepared = prepareNativeBenchRun(f.root, { attempt: first, resource: bench, candidate: f.base, at: AT });
    expect(encode(prepared.record.native!.collection)).toBe(originalCollection);
    expect(prepared.manifest.preparation.authority.executorAttempt).toBe(first);
  } finally { f.cleanup(); }
});

test("ordered recovery refuses changed complete policy prior outcomes and current checks before effects and after intent", () => {
  test.setTimeout(180_000);
  const kinds = ["no-approval", "wrong-fault", "wrong-target", "wrong-order", "malformed-future", "missing-prior", "incomplete-prior", "changed-prior", "changed-result", "changed-policy", "changed-candidate", "live-job", "unknown-job", "unresolved-holds", "missing-collection", "malformed-foreign", "pause", "boundary-prior", "boundary-policy"];
  for (const kind of kinds) {
    const f = dependentFixture();
    try {
      authorizeSequence(f, `negative-${kind}`);
      let request = sequenceRequest(f, 0);
      if (kind === "no-approval") request.authorization = null;
      else if (kind === "wrong-fault") request.fault = { ...request.fault, id: sha("different fault") };
      else if (kind === "wrong-target") request.targets = [f.request.targets[1]];
      else if (kind === "wrong-order") request.sequence.index = 1;
      else if (kind === "malformed-future") {
        const a = JSON.parse(readFileSync(f.authorizationFile, "utf8")); delete a.sequence.steps[1].target.record;
        atomicJson(f.authorizationFile, a); request.authorization.digest = sha(readFileSync(f.authorizationFile));
      }
      else if (kind === "missing-collection") {
        const rec = readNativeRecord(f.root, request.targets[0].attempt); delete rec.native.collection; writeNativeRecord(f.root, rec);
        f.request.targets[0] = nativeRecoveryTarget(f.root, rec.attempt, f.base, "collected-source");
        authorizeSequence(f, `negative-${kind}`); request = sequenceRequest(f, 0);
      } else {
        const done = cli(f, request); expect(done.status, `${kind} first: ${done.stderr}`).toBe(0);
        if (kind !== "unresolved-holds") reconcileSequence(f);
        request = sequenceRequest(f, 1);
        const priorFile = nativeRecoveryIntentPath(f.root, f.sequencePolicy.sequence.steps[0].requestId);
        if (kind === "missing-prior") rmSync(priorFile);
        if (kind === "incomplete-prior" || kind === "changed-prior") {
          const prior = JSON.parse(readFileSync(priorFile, "utf8"));
          if (kind === "incomplete-prior") prior.completed = []; else prior.fingerprint = "0".repeat(64);
          atomicJson(priorFile, prior);
        }
        if (kind === "changed-result") {
          const rec = readNativeRecord(f.root, f.request.targets[0].attempt); rec.native.transactionDispositions[0].outcome = "complete"; writeNativeRecord(f.root, rec);
        }
        if (kind === "changed-policy") {
          const a = JSON.parse(readFileSync(f.authorizationFile, "utf8")); a.sequence.steps.reverse(); atomicJson(f.authorizationFile, a);
        }
        if (kind === "changed-candidate") { writeFileSync(path.join(request.targets[0].resource, "allowed.txt"), "new committed candidate\n"); git(request.targets[0].resource, ["add", "allowed.txt"]); git(request.targets[0].resource, ["commit", "-qm", "changed candidate"]); }
        if (kind === "live-job" || kind === "unknown-job") {
          const rec = readNativeRecord(f.root, f.failedAttempt); rec.ownedJobs = [kind === "live-job" ? { kind: "pid", id: String(process.pid) } : { kind: "unknown", id: "not-probeable" }]; writeNativeRecord(f.root, rec); request = sequenceRequest(f, 1);
        }
        if (kind === "malformed-foreign") { const file = nativeRecordPath(f.root, "T-foreign-a1"); mkdirSync(path.dirname(file), { recursive: true }); writeFileSync(file, "{unknown"); }
        if (kind === "pause") { const file = path.join(f.root, PAUSE_REL_PATH); mkdirSync(path.dirname(file), { recursive: true }); writeFileSync(file, "Owner pause\n"); }
      }
      const before = f.request.targets.map((t: any) => readFileSync(nativeRecordPath(f.root, t.attempt), "utf8"));
      let result: any;
      if (kind.startsWith("boundary-")) {
        const code = errorCode(() => recoverNativeTransaction(f.root, request, { onBoundary(name) {
          if (name !== "before-target") return;
          if (kind === "boundary-prior") {
            const file = nativeRecoveryIntentPath(f.root, f.sequencePolicy.sequence.steps[0].requestId), prior = JSON.parse(readFileSync(file, "utf8")); prior.completed = []; atomicJson(file, prior);
          } else writeFileSync(f.evidencePath, "changed owner evidence\n");
        } }));
        expect(code, kind).not.toBe("NO_REFUSAL");
        result = { status: 1, stderr: code };
      } else result = cli(f, request);
      expect(result.status, `${kind}: ${result.stdout} ${result.stderr}`).toBe(1);
      expect(f.request.targets.map((t: any) => readFileSync(nativeRecordPath(f.root, t.attempt), "utf8")), kind).toEqual(before);
      if (!kind.startsWith("boundary-")) expect(existsSync(nativeRecoveryIntentPath(f.root, request.id)), kind).toBe(false);
      console.info("ordered negative control", JSON.stringify({ kind, exit: result.status, refusal: result.stderr }));
    } finally { f.cleanup(); }
  }
});

test("ordered recovery actual intent target and progress persistence crashes require exact prior completion and replay once", () => {
  test.setTimeout(240_000);
  const f = dependentFixture();
  try {
    const originals = f.request.targets.map((t: any) => readFileSync(nativeRecordPath(f.root, t.attempt), "utf8"));
    let serial = 0;
    for (const index of [0, 1]) for (const role of ["intent", "target", "progress"]) for (const stage of atomicStages) {
      f.request.targets.forEach((t: any, i: number) => writeFileSync(nativeRecordPath(f.root, t.attempt), originals[i]));
      authorizeSequence(f, `crash-sequence-${serial++}`);
      const first = sequenceRequest(f, 0);
      if (index === 1) { const start = cli(f, first); expect(start.status, start.stderr).toBe(0); reconcileSequence(f); }
      const request = index === 0 ? first : sequenceRequest(f, 1), originalRequest = f.request;
      f.request = request;
      const file = role === "target" ? nativeRecordPath(f.root, request.targets[0].attempt) : nativeRecoveryIntentPath(f.root, request.id);
      const crash = persistenceCrash(f, "recover", file, stage, role === "progress" ? 2 : 1);
      expect(crash.status, `${index}/${role}/${stage}: ${crash.stderr}`).toBe(73);
      f.request = originalRequest;
      if (index === 0) {
        const next = sequenceRequest(f, 1), heldBytes = originalRequest.targets.map((t: any) => readFileSync(nativeRecordPath(f.root, t.attempt), "utf8"));
        expect(cli(f, next).status, `${role}/${stage}: no unproven sequence advancement`).toBe(1);
        expect(originalRequest.targets.map((t: any) => readFileSync(nativeRecordPath(f.root, t.attempt), "utf8"))).toEqual(heldBytes);
      }
      const afterCrash = readNativeRecord(f.root, request.targets[0].attempt);
      expect(afterCrash.native.transactionDispositions?.length ?? 0).toBeLessThanOrEqual(1);
      const replay = cli(f, request); expect(replay.status, `${index}/${role}/${stage}: ${replay.stderr}`).toBe(0);
      if (index === 0) { reconcileSequence(f); const second = sequenceRequest(f, 1); const result = cli(f, second); expect(result.status, result.stderr).toBe(0); }
      for (const t of f.request.targets) {
        const record = readNativeRecord(f.root, t.attempt); expect(record.native.transactionDispositions).toHaveLength(1); expect(activeNativeHolds(record)).toEqual([]);
        expect(record.native.transactionDispositions[0].outcome).toBe("unknown");
      }
      const bytesBefore = f.request.targets.map((t: any) => readFileSync(nativeRecordPath(f.root, t.attempt), "utf8"));
      expect(cli(f, request).status).toBe(0);
      expect(f.request.targets.map((t: any) => readFileSync(nativeRecordPath(f.root, t.attempt), "utf8"))).toEqual(bytesBefore);
    }
  } finally { f.cleanup(); }
});

test("public exact recovery preserves unknown receipts and recorded terminal outcome, and repeated requests return the same disposition", () => {
  const f = fixture("ordinary");
  try {
    const before = f.records[0];
    const extraTarget = { ...f.request, targets: [...f.request.targets, { ...f.request.targets[0], attempt: "T-other-a1" }] };
    expect(cli(f, extraTarget).stderr).toContain("TARGET_SCOPE");
    const result = cli(f); expect(result.status, result.stderr).toBe(0);
    const got = readNativeRecord(f.root, before.attempt);
    expect(activeNativeHolds(got)).toEqual([]);
    expect(got.state).toBe("finished"); expect(got.native.collection).toBeUndefined();
    expect(got.native.receipts).toEqual(before.native.receipts);
    expect(got.native.transactionDispositions).toHaveLength(1);
    expect(got.native.transactionDispositions[0].fault.rawContent).toBe(f.fault.rawContent);
    const after = beforeRecords(f); expect(cli(f).status).toBe(0); unchanged(f, after);
    const reused = { ...f.request, targets: [{ ...f.request.targets[0], mode: "collected-source" }] };
    expect(cli(f, reused).stderr).toContain("IDENTIFIER_REUSED"); unchanged(f, after);
    expect(readReservation(f.root, f.lanes[0])).toBeNull();
  } finally { f.cleanup(); }
});

test("separate owner authorization resolves only exact legacy targets while preserving original collection and normal detached preparation", () => {
  const f = fixture("legacy", 2, true, true);
  try {
    const before = beforeRecords(f), collection = encode(f.records[0].native.collection);
    expect(cli(f).stderr).toContain("LEGACY_UNATTRIBUTED"); unchanged(f, before);
    authorize(f); const success = cli(f); expect(success.status, success.stderr).toBe(0);
    const source = readNativeRecord(f.root, f.records[0].attempt), failed = readNativeRecord(f.root, f.records[1].attempt);
    expect(encode(source.native.collection)).toBe(collection);
    expect(failed.state).toBe("failed"); expect(failed.native.collection).toBeUndefined();
    expect(failed.native.receipts[0].actualPostCallback).toBe(false);
    expect(source.native.transactionDispositions[0].attribution).toBe("legacy-unattributed");
    const bench = path.join(f.dir, "detached-bench"); git(f.root, ["worktree", "add", "--quiet", "--detach", bench, f.base]);
    const prepared = prepareNativeBenchRun(f.root, { attempt: source.attempt, resource: bench, candidate: f.base, at: AT });
    expect(prepared.manifest.preparation.authority.executorAttempt).toBe(source.attempt);
    expect(prepared.manifest.preparation.authority.originalBase).toBe(f.base);
    expect(encode(prepared.record.native!.collection)).toBe(collection);
  } finally { f.cleanup(); }
  const dependent = dependentFixture();
  try {
    const sourceAttempt = dependent.request.targets[0].attempt, failedAttempt = dependent.failedAttempt;
    const sourceBefore = readNativeRecord(dependent.root, sourceAttempt), failedBefore = readNativeRecord(dependent.root, failedAttempt);
    const collection = encode(sourceBefore.native.collection), historicalOutcome = encode(sourceBefore.outcome);
    expect(sourceBefore.state).toBe("finished"); expect(sourceBefore.outcome.state).toBe("stopped");
    expect(failedBefore.native.receipts.filter((r: any) => r.actualPostCallback === true)).toHaveLength(10);
    expect(failedBefore.native.receipts.filter((r: any) => r.actualPostCallback === false)).toHaveLength(1);
    expect(activeNativeHolds(failedBefore).map((h: any) => h.code).sort()).toEqual(["checker-error", "checker-error", "incomplete-operation", "native-transaction-refusal"]);
    authorize(dependent, "ordered-pair");
    const pairBefore = beforeRecords(dependent); expect(cli(dependent).stderr).toContain("OTHER_HOLD"); unchanged(dependent, pairBefore);

    // Separate exact requests do not treat a dependent hold as owner-authorized.
    dependent.request = { ...dependent.request, id: "ordered-source", targets: [dependent.request.targets[0]], authorization: null };
    authorize(dependent, "ordered-source-authorization");
    const failedBytes = readFileSync(nativeRecordPath(dependent.root, failedAttempt), "utf8");
    const sourceResult = cli(dependent); expect(sourceResult.status, sourceResult.stderr).toBe(0);
    expect(readFileSync(nativeRecordPath(dependent.root, failedAttempt), "utf8")).toBe(failedBytes);
    const sourceAfter = readNativeRecord(dependent.root, sourceAttempt);
    expect(encode(sourceAfter.native.collection)).toBe(collection); expect(encode(sourceAfter.outcome)).toBe(historicalOutcome);

    // Existing public final reconciliation now checks the usable source and
    // complete detached workspace. Recovery itself never clears these holds.
    const reconciled = observeRun(dependent.root, { attempt: failedAttempt, evidence: "RUN-DONE failed", at: "2026-10-06T00:00:05.000Z" }).record;
    expect(activeNativeHolds(reconciled).map((h: any) => h.code)).toEqual(["native-transaction-refusal"]);
    expect(reconciled.native!.receipts).toEqual(failedBefore.native.receipts);
    expect(reconciled.outcome).toEqual(failedBefore.outcome);
    dependent.request = { ...dependent.request, id: "ordered-failed-review", targets: [nativeRecoveryTarget(dependent.root, failedAttempt, dependent.base, "failed-no-work")], authorization: null };
    authorize(dependent, "ordered-failed-authorization");
    const failedResult = cli(dependent); expect(failedResult.status, failedResult.stderr).toBe(0);
    const failedAfter = readNativeRecord(dependent.root, failedAttempt);
    expect(failedAfter.state).toBe("failed"); expect(failedAfter.native.collection).toBeUndefined();
    expect(failedAfter.native.receipts).toEqual(failedBefore.native.receipts);
    expect(failedAfter.outcome).toEqual(failedBefore.outcome);
    expect(failedAfter.native.holds.filter((h: any) => h.code !== "native-transaction-refusal")).toEqual(reconciled.native!.holds.filter((h: any) => h.code !== "native-transaction-refusal"));
    expect(failedAfter.native.transactionDispositions).toHaveLength(1);
    expect(encode(readNativeRecord(dependent.root, sourceAttempt).native.collection)).toBe(collection);
  } finally { dependent.cleanup(); }
});

test("exact recovery refuses malformed or mismatched fault, target, record, reservation, binding and owner provenance without target writes", () => {
  const f = fixture("pin-negatives", 2, true, true);
  try {
    authorize(f); const before = beforeRecords(f);
    const changes: Array<(r: any) => void> = [
      r => { r.version = 9; }, r => { r.fault.id = sha("another fault"); }, r => { r.fault.rawDigest = sha("another content"); },
      r => { r.targets.pop(); }, r => { r.targets[0].attempt = "T-935-s9-a1"; },
      r => { r.targets[0].record.content += " "; r.targets[0].record.digest = sha(r.targets[0].record.content); },
      r => { r.targets[0].reservation = { content: "{}\n", digest: sha("{}\n") }; },
      r => { r.targets[0].binding.boundAt = "new-generation"; r.targets[0].bindingDigest = sha(JSON.stringify(r.targets[0].binding)); },
      r => { r.authorization.digest = sha("unrecorded authorization"); }, r => { r.authorization.id = "absent-authorization"; },
      r => { r.targets[0].origins.commonDir = f.dir; }, r => { r.fault.reference = path.join(f.dir, "absent-fault"); },
    ];
    for (const change of changes) {
      const r = structuredClone(f.request); change(r); const got = cli(f, r);
      expect(got.status, got.stdout + got.stderr).toBe(1); unchanged(f, before);
      expect(existsSync(nativeRecoveryIntentPath(f.root, r.id))).toBe(false);
    }
    writeFileSync(f.evidencePath, "owner provenance changed\n"); expect(cli(f).stderr).toContain("AUTHORIZATION"); unchanged(f, before);
  } finally { f.cleanup(); }
});

test("physical and lifecycle negative controls refuse live or unknown jobs and writers, dirty complete scope, foreign ownership, missing collection and other holds", () => {
  const cases: Array<[string, (f: any, r: any) => void]> = [
    ["live-job", (_f, r) => { r.ownedJobs = [{ kind: "pid", id: String(process.pid) }]; }],
    ["unknown-job", (_f, r) => { r.ownedJobs = [{ kind: "native-task", id: "unknown" }]; }],
    ["invalid-pid", (_f, r) => { r.ownedJobs = [{ kind: "pid", id: "not-a-pid" }]; }],
    ["unproven-cessation", (_f, r) => { r.execution.endedAt = null; }],
    ["state-only", (_f, r) => { r.events = r.events.filter((e: any) => e.op !== "observe"); }],
    ["historical-only", (_f, r) => { r.execution.endedAt = "2026-10-06T00:01:00.000Z"; }],
    ["completion-mismatch", (_f, r) => { r.events.filter((e: any) => e.op === "observe").at(-1).why = "completion evidence (RUN-DONE failed) with the execution ended and no owned job left"; }],
    ["failed-with-work", (f, r) => {
      r.state = "failed"; delete r.native.collection;
      const observed = r.events.filter((e: any) => e.op === "observe").at(-1);
      observed.to = "failed"; observed.why = "completion evidence (RUN-DONE failed) with the execution ended and no owned job left";
      writeFileSync(path.join(f.lanes[0], "allowed.txt"), "implementation work\n");
      git(f.lanes[0], ["add", "allowed.txt"]); git(f.lanes[0], ["commit", "-qm", "in-fence implementation"]); f.base = git(f.lanes[0], ["rev-parse", "HEAD"]);
    }],
    ["missing-collection", (_f, r) => { delete r.native.collection; }],
    ["another-hold", (_f, r) => { addNativeHold(r, { key: "another", code: "unknown-worker", outcome: "unknown" }); }],
    ["dirty-inscope", (f) => { writeFileSync(path.join(f.lanes[0], "allowed.txt"), "dirty\n"); }],
    ["staged-inscope", (f) => { writeFileSync(path.join(f.lanes[0], "allowed.txt"), "staged\n"); git(f.lanes[0], ["add", "allowed.txt"]); }],
    ["untracked-inscope", (f) => { writeFileSync(path.join(f.lanes[0], "docs/tasks/new.md"), "untracked\n"); }],
    ["ignored-outside", (f) => { mkdirSync(path.join(f.lanes[0], "ignored")); writeFileSync(path.join(f.lanes[0], "ignored/foreign.txt"), "foreign\n"); }],
    ["committed-outside", (f) => { writeFileSync(path.join(f.lanes[0], "outside.txt"), "outside\n"); git(f.lanes[0], ["add", "outside.txt"]); git(f.lanes[0], ["commit", "-qm", "outside fence"]); f.base = git(f.lanes[0], ["rev-parse", "HEAD"]); }],
    ["foreign-reservation", (f, r) => { atomicJson(r.reservation.file, { version: 1, attempt: "T-foreign-a1", resource: f.lanes[0] }); }],
    ["unknown-writer", (f, r) => { const other = structuredClone(r); other.attempt = "T-foreign-a1"; other.state = "reserved"; other.execution = null; writeNativeRecord(f.root, other); }],
    ["foreign-seat", (f) => { const row = processRow(process.pid)!; writeHolder(f.root, { pid: process.pid, startedAt: row.startedAt, program: row.command }); }],
    ["pause", (f) => { atomicJson(path.join(f.root, PAUSE_REL_PATH), { version: 1, scope: "all", by: "owner", at: AT }); }],
  ];
  for (const [name, change] of cases) {
    const f = fixture(`negative-${name}`, 1, true, true);
    try {
      const r = readNativeRecord(f.root, f.records[0].attempt); change(f, r); writeNativeRecord(f.root, r);
      f.request.targets = [nativeRecoveryTarget(f.root, r.attempt, f.base, name === "committed-outside" ? "terminal" : name === "failed-with-work" ? "failed-no-work" : "collected-source")]; authorize(f);
      const before = beforeRecords(f); const result = cli(f);
      expect(result.status, `${name}: ${result.stdout} ${result.stderr}`).toBe(1); unchanged(f, before);
    } finally { f.cleanup(); }
  }
});

test("inside-transaction boundaries reject intervening record, reservation, binding, candidate, fault, grant, pause or authorization changes before any target effect", () => {
  const cases: Array<[string, (f: any) => void]> = [
    ["record", f => { const r = readNativeRecord(f.root, f.records[0].attempt); r.report = "intervening authority"; writeNativeRecord(f.root, r); }],
    ["binding", f => { const r = readNativeRecord(f.root, f.records[0].attempt); r.native.binding.boundAt = "intervening"; writeNativeRecord(f.root, r); }],
    ["reservation", f => { const r = f.records[0]; atomicJson(r.reservation.file, { version: 1, attempt: "foreign-a1", resource: r.resource }); }],
    ["candidate", f => { writeFileSync(path.join(f.lanes[0], "allowed.txt"), "intervening\n"); git(f.lanes[0], ["add", "allowed.txt"]); git(f.lanes[0], ["commit", "-qm", "new candidate"]); }],
    ["fault", f => { writeFileSync(f.faultReference, "{}\n"); }],
    ["grant", f => { writeFileSync(path.join(f.root, ".supertaskr/dispatch-grant.yaml"), "malformed: grant\n"); }],
    ["pause", f => { atomicJson(path.join(f.root, PAUSE_REL_PATH), { version: 1, scope: "all", by: "owner", at: AT }); }],
    ["authorization", f => { writeFileSync(f.authorizationFile, "{}\n"); }],
    ["pending-raw-fault", f => { const dir = nativeTransactionRefusalDir(f.root); mkdirSync(dir, { recursive: true }); writeFileSync(path.join(dir, "pending.json"), f.fault.rawContent); }],
  ];
  for (const [name, change] of cases) {
    const f = fixture(`intervening-${name}`, 1, true, true);
    try {
      authorize(f);
      const code = errorCode(() => recoverNativeTransaction(f.root, f.request, { onBoundary: (boundary) => { if (boundary === "before-target") change(f); } }));
      expect(code, name).not.toBe("NO_REFUSAL");
      const r = readNativeRecord(f.root, f.records[0].attempt);
      expect(activeNativeHolds(r).some((h: any) => h.key === `native-transaction-refusal:${f.fault.id}`), name).toBe(true);
      expect(r.native.transactionDispositions, name).toBeUndefined();
    } finally { f.cleanup(); }
  }
});

test("interrupted multi-target public recovery resumes every durable boundary exactly once and remains explicitly pending after changed authority", () => {
  const boundaries: Array<[string, number]> = [["before-intent", -1], ["intent", -1], ["before-target", 0], ["target", 0], ["progress", 0], ["before-target", 1], ["target", 1], ["progress", 1]];
  for (const [boundary, index] of boundaries) {
    const f = fixture(`interrupt-${boundary}-${index + 1}`, 2, true, true);
    try {
      authorize(f); const requestFile = path.join(f.dir, "interrupt-request-T-351-s1.json"); writeFileSync(requestFile, encode(f.request));
      const child = spawnSync(process.execPath, ["--input-type=module", "-e", `
        import {readFileSync} from 'node:fs';
        const [url,root,file,boundary,index]=process.argv.slice(1);
        const {recoverNativeTransaction}=await import(url);
        recoverNativeTransaction(root,JSON.parse(readFileSync(file,'utf8')),{onBoundary:(name,i)=>{if(name===boundary&&i===Number(index))process.exit(73)}});
      `, recoveryUrl, f.root, requestFile, boundary, String(index)], { encoding: "utf8", timeout: 15_000 });
      expect(child.status, child.stderr).toBe(73);
      const retained = existsSync(nativeRecoveryIntentPath(f.root, f.request.id));
      expect(retained).toBe(boundary !== "before-intent");
      const resumed = cli(f); expect(resumed.status, resumed.stderr).toBe(0);
      for (const t of f.request.targets) {
        const r = readNativeRecord(f.root, t.attempt); expect(r.native.transactionDispositions).toHaveLength(1);
        expect(activeNativeHolds(r)).toEqual([]); expect(r.native.receipts.some((receipt: any) => receipt.actualPostCallback === false)).toBe(true);
      }
      const after = beforeRecords(f); expect(cli(f).status).toBe(0); unchanged(f, after);
    } finally { f.cleanup(); }
  }
  const f = fixture("pending-change", 2, true, true);
  try {
    authorize(f);
    expect(() => recoverNativeTransaction(f.root, f.request, { onBoundary: (name, index) => { if (name === "progress" && index === 0) throw new Error("interrupted"); } })).toThrow("interrupted");
    const pending = readNativeRecord(f.root, f.records[1].attempt); pending.report = "changed pending target"; writeNativeRecord(f.root, pending);
    const before = beforeRecords(f); expect(cli(f).stderr).toContain("RECORD"); unchanged(f, before);
    const intent = JSON.parse(readFileSync(nativeRecoveryIntentPath(f.root, f.request.id), "utf8")); expect(intent.completed).toEqual([0]);
  } finally { f.cleanup(); }
});

test("real separate-process contention records distinct scoped requesters and raw faults before absorption, while unverifiable context stays conservative", async () => {
  const f = fixture("real-contention", 2);
  const ready = path.join(f.dir, "ready-T-351-s1"), release = path.join(f.dir, "release-T-351-s1");
  const holder = spawn(process.execPath, ["--input-type=module", "-e", `
    import {existsSync,writeFileSync} from 'node:fs';
    const [url,root,ready,release]=process.argv.slice(1);const {withNativeTransaction}=await import(url);
    withNativeTransaction(root,{operation:'fixture-owner'},()=>{writeFileSync(ready,'ready');const end=Date.now()+10000;while(!existsSync(release)){if(Date.now()>end)throw Error('barrier expired');Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,10)}});
  `, nativeUrl, f.root, ready, release], { stdio: ["ignore", "pipe", "pipe"] });
  const done = new Promise<number | null>((resolve, reject) => { holder.once("error", reject); holder.once("close", resolve); });
  try {
    const end = Date.now() + 5_000; while (!existsSync(ready)) { if (Date.now() > end) throw Error("holder did not acquire"); await new Promise(resolve => setTimeout(resolve, 10)); }
    const refusalDir = path.join(f.root, ".supertaskr/runs/reservations/native-transaction-refusals");
    for (let i = 0; i < 2; i++) {
      const e = event("PreToolUse", i === 0 ? f.records[0].native.binding.agentId : "unknown-agent", { tool_name: "Bash", tool_use_id: `blocked-${i}`, tool_input: { command: `cd -- '${f.lanes[0]}' && true` } });
      const r = spawnSync(process.execPath, ["--input-type=module", "-e", `const [url,root,event]=process.argv.slice(1);const {handleNativeEvent}=await import(url);try{handleNativeEvent(root,JSON.parse(event),{waitMs:80})}catch(e){process.stdout.write(e.code)}`, nativeUrl, f.root, JSON.stringify(e)], { encoding: "utf8", timeout: 5_000 });
      expect(r.status, r.stderr).toBe(0); expect(r.stdout).toBe("NATIVE_TRANSACTION_BUSY");
    }
    const raws = readdirSync(refusalDir).map(name => readFileSync(path.join(refusalDir, name), "utf8")); expect(raws).toHaveLength(2);
    const faults = raws.map(raw => JSON.parse(raw)); expect(new Set(faults.map(v => v.id)).size).toBe(2);
    expect(faults.map(v => v.requester.attribution).sort()).toEqual(["recorded-binding", "unknown"]);
    expect(faults.every(v => v.owner.pid === holder.pid && v.owner.operation === "fixture-owner")).toBe(true);
    writeFileSync(release, "release"); expect(await done).toBe(0);
    const otherFile = nativeRecordPath(f.root, f.records[1].attempt), otherRaw = readFileSync(otherFile, "utf8");
    const damaged = JSON.parse(otherRaw); damaged.native.inflight = "unreadable state"; writeFileSync(otherFile, encode(damaged));
    expect(() => withNativeTransaction(f.root, { operation: "interrupted-absorption" }, () => undefined)).toThrow();
    const unknownFault = faults.find(v => v.requester.attribution === "unknown");
    expect(readdirSync(refusalDir).some(name => JSON.parse(readFileSync(path.join(refusalDir, name), "utf8")).id === unknownFault.id)).toBe(true);
    writeFileSync(otherFile, otherRaw);
    withNativeTransaction(f.root, { operation: "absorb-fixture-faults" }, () => undefined);
    expect(readdirSync(refusalDir)).toEqual([]);
    const replayedFirst = readNativeRecord(f.root, f.records[0].attempt);
    expect(replayedFirst.native.holds.filter((h: any) => h.refusal?.id === unknownFault.id)).toHaveLength(1);
    for (let i = 0; i < raws.length; i++) {
      const ledger = JSON.parse(readFileSync(nativeTransactionFaultPath(f.root, faults[i].id), "utf8"));
      expect(ledger.rawContent).toBe(raws[i]); expect(ledger.rawDigest).toBe(sha(raws[i]!));
    }
    const other = readNativeRecord(f.root, f.records[1].attempt);
    const scopedFault = faults.find(v => v.requester.attribution === "recorded-binding");
    expect(other.native.holds.some((h: any) => h.refusal?.id === scopedFault.id)).toBe(false);
    const unknown = faults.find(v => v.requester.attribution === "unknown");
    expect(activeNativeHolds(other).some((h: any) => h.refusal?.id === unknown.id)).toBe(true);
    const actualRequest = { version: 1, id: "actual-contention-recovery",
      fault: { id: scopedFault.id, source: "raw-ledger-v1", rawDigest: sha(raws[faults.indexOf(scopedFault)]!) },
      targets: [nativeRecoveryTarget(f.root, f.records[0].attempt, f.base, "terminal")], authorization: null };
    const before = beforeRecords(f);
    expect(cli(f, actualRequest).stderr).toContain("OTHER_HOLD"); unchanged(f, before);

  } finally {
    writeFileSync(release, "release"); await done; f.cleanup();
  }
  const positive = fixture("real-positive");
  try {
    expect(cli(positive).status).toBe(0); // establish the same route with its earlier exact fault
    let raw = "";
    withNativeTransaction(positive.root, { operation: "fixture-known-owner" }, () => {
      const e = event("PreToolUse", positive.records[0].native.binding.agentId, { tool_name: "Bash", tool_use_id: "real-public-fault",
        tool_input: { command: `cd -- '${positive.lanes[0]}' && true` } });
      const child = spawnSync(process.execPath, ["--input-type=module", "-e",
        `const [url,root,event]=process.argv.slice(1);const {handleNativeEvent}=await import(url);try{handleNativeEvent(root,JSON.parse(event),{waitMs:80})}catch(e){process.stdout.write(e.code)}`,
        nativeUrl, positive.root, JSON.stringify(e)], { encoding: "utf8", timeout: 5_000 });
      expect(child.status, child.stderr).toBe(0); expect(child.stdout).toBe("NATIVE_TRANSACTION_BUSY");
      const dir = path.join(positive.root, ".supertaskr/runs/reservations/native-transaction-refusals");
      raw = readFileSync(path.join(dir, readdirSync(dir)[0]!), "utf8");
    });
    withNativeTransaction(positive.root, { operation: "absorb-real-positive" }, () => undefined);
    const fault = JSON.parse(raw);
    const request = { version: 1, id: "recover-actual-contention", fault: { id: fault.id, source: "raw-ledger-v1", rawDigest: sha(raw) },
      targets: [nativeRecoveryTarget(positive.root, positive.records[0].attempt, positive.base, "terminal")], authorization: null };
    const successful = cli(positive, request); expect(successful.status, successful.stderr).toBe(0);
    const got = readNativeRecord(positive.root, positive.records[0].attempt);
    expect(activeNativeHolds(got)).toEqual([]); expect(got.native.transactionDispositions).toHaveLength(2);
    expect(got.native.transactionDispositions[1].fault.rawContent).toBe(raw);
  } finally { positive.cleanup(); }
});


test("public recovery rechecks cessation of same-resource foreign terminal writers and their owned jobs", () => {
  expect(processRow(process.pid)).toBeDefined();
  console.info("foreign-cessation-fixture PID", process.pid);
  const control = fixture("foreign-terminal-genuinely-ended");
  try {
    const other = structuredClone(readNativeRecord(control.root, control.records[0].attempt));
    other.attempt = "T-foreign-a1";
    writeNativeRecord(control.root, other);
    const foreignBytes = readFileSync(nativeRecordPath(control.root, other.attempt), "utf8");
    const result = cli(control);
    expect(result.status, result.stdout + result.stderr).toBe(0);
    expect(readFileSync(nativeRecordPath(control.root, other.attempt), "utf8")).toBe(foreignBytes);
  } finally { control.cleanup(); }

  const cases: Array<[string, (r: any) => void]> = [
    ["live-execution", r => { r.execution.pid = process.pid; r.execution.identity = null; }],
    ["live-owned-job", r => { r.ownedJobs = [{ kind: "pid", id: String(process.pid) }]; }],
    ["unknown-owned-job", r => { r.ownedJobs = [{ kind: "native-task", id: "unprobeable" }]; }],
  ];
  for (const [name, change] of cases) {
    const f = fixture(`foreign-terminal-${name}`);
    try {
      const other = structuredClone(readNativeRecord(f.root, f.records[0].attempt));
      other.attempt = "T-foreign-a1";
      change(other);
      writeNativeRecord(f.root, other);
      const foreignBytes = readFileSync(nativeRecordPath(f.root, other.attempt), "utf8");
      const before = beforeRecords(f);
      const result = cli(f);
      expect(result.status, `${name}: ${result.stdout} ${result.stderr}`).toBe(1);
      expect(result.stderr).toContain("FOREIGN");
      unchanged(f, before);
      expect(readFileSync(nativeRecordPath(f.root, other.attempt), "utf8")).toBe(foreignBytes);
      expect(existsSync(nativeRecoveryIntentPath(f.root, f.request.id))).toBe(false);
    } finally { f.cleanup(); }
  }

});

test("public recovery refuses a genuinely bound foreign process writer even when its physical reservation is independently absent", () => {
  const f = fixture("foreign-process-writer");
  try {
    const a: Assignment = { ...f.records[0].assignment, harness: "claude-code" }; delete a.native;
    const other = startRun(f.root, { assignment: a, at: "2026-10-06T00:00:05.000Z" }).record;
    bindRun(f.root, { attempt: other.attempt, harnessId: "fixture-foreign-process", pid: process.pid, at: "2026-10-06T00:00:06.000Z" });
    // The fixture coordinator models missing present ownership without
    // changing the independently bound live foreign process record.
    expect(releaseReservation(f.root, { resource: f.lanes[0], attempt: other.attempt })).toBe(true);
    const foreignFile = nativeRecordPath(f.root, other.attempt), foreign = readFileSync(foreignFile, "utf8"), before = beforeRecords(f);
    expect(JSON.parse(foreign).native).toBeUndefined(); expect(JSON.parse(foreign).execution.pid).toBe(process.pid);
    const result = cli(f); expect(result.status, result.stderr).toBe(1); expect(result.stderr).toContain("FOREIGN");
    unchanged(f, before); expect(readFileSync(foreignFile, "utf8")).toBe(foreign);
    expect(existsSync(nativeRecoveryIntentPath(f.root, f.request.id))).toBe(false);
  } finally { f.cleanup(); }
});


test("public recovery recognizes genuine stopped unbound foreign cessation while refusing missing proof or unknown jobs", () => {
  const changes: Array<[string, ((r: any) => void) | null]> = [
    ["genuine-stop", null],
    ["missing-termination", r => { r.outcome.evidence = r.outcome.evidence.filter((e: any) => e.kind !== "termination established"); }],
    ["missing-stop-event", r => { r.events = r.events.filter((e: any) => e.op !== "stop"); }],
    ["unsupported-token", r => { r.outcome.evidence.find((e: any) => e.kind === "stopped").detail = "RUN-DONE stopped"; }],
    ["unknown-stopped-job", r => { r.ownedJobs = [{ kind: "native-task", id: "unprobeable" }]; }],
  ];
  for (const [name, change] of changes) {
    const f = fixture(`foreign-unbound-${name}`, 1, true);
    try {
      const source = readNativeRecord(f.root, f.records[0].attempt);
      const started = startRun(f.root, { assignment: source.assignment, at: "2026-10-06T00:00:05.000Z" }).record;
      expect(started.execution).toBeNull();
      const stopped = stopRun(f.root, { attempt: started.attempt, evidence: "RUN-DONE gone\nFixture coordinator: start reserved a writer, no native task was launched and no job was started.", at: "2026-10-06T00:00:06.000Z" }).record;
      expect(stopped.state).toBe("stopped"); expect(stopped.execution).toBeNull();
      expect(stopped.native!.binding).toBeNull(); expect(stopped.native!.inflight).toEqual([]);
      expect(stopped.outcome!.evidence.some((e: any) => e.kind === "termination established")).toBe(true);
      expect(stopped.events.some((e: any) => e.op === "stop" && e.to === "stopped")).toBe(true);
      // Model historical metadata independently of the CURRENT reservation:
      // after the genuine public cessation check, the fixture coordinator uses
      // the existing exact-owner public release primitive. Recovery never does it.
      expect(readReservation(f.root, f.lanes[0])!.attempt).toBe(stopped.attempt);
      expect(releaseReservation(f.root, { resource: f.lanes[0], attempt: stopped.attempt })).toBe(true);
      const foreign = readNativeRecord(f.root, stopped.attempt);
      if (change) { change(foreign); writeNativeRecord(f.root, foreign); }
      const foreignBytes = readFileSync(nativeRecordPath(f.root, stopped.attempt), "utf8");
      const collection = encode(source.native.collection), receipts = encode(source.native.receipts);
      f.request.targets = [nativeRecoveryTarget(f.root, source.attempt, f.base, "collected-source")];
      const before = beforeRecords(f), result = cli(f);
      expect(result.status, `${name}: ${result.stdout} ${result.stderr}`).toBe(change === null ? 0 : 1);
      if (change) { expect(result.stderr).toContain("FOREIGN"); unchanged(f, before); }
      else {
        const after = readNativeRecord(f.root, source.attempt);
        expect(encode(after.native.collection)).toBe(collection); expect(encode(after.native.receipts)).toBe(receipts);
        expect(after.native.transactionDispositions).toHaveLength(1);
      }
      expect(readFileSync(nativeRecordPath(f.root, stopped.attempt), "utf8")).toBe(foreignBytes);
      expect(readReservation(f.root, f.lanes[0])).toBeNull();
    } finally { f.cleanup(); }
  }
});


test("exact record byte pins refuse malformed UTF-8 without normalizing authority", () => {
  for (const malformed of [false, true]) {
    const f = fixture(`exact-utf8-${malformed}`, 1, false, true);
    try {
      const r = readNativeRecord(f.root, f.records[0].attempt);
      r.native.fixtureUtf8Marker = "valid UTF-8 marker �";
      writeNativeRecord(f.root, r);
      f.request.targets = [nativeRecoveryTarget(f.root, r.attempt, f.base, "terminal")];
      authorize(f);
      const file = nativeRecordPath(f.root, r.attempt), original = readFileSync(file);
      const marker = Buffer.from("�", "utf8"), at = original.indexOf(marker);
      expect(at).toBeGreaterThan(-1);
      const changed = Buffer.concat([original.subarray(0, at), Buffer.from([0xff]), original.subarray(at + marker.length)]);
      expect(changed.toString("utf8")).toBe(original.toString("utf8"));
      expect(sha(changed)).not.toBe(f.request.targets[0].record.digest);
      if (malformed) writeFileSync(file, changed);
      const result = cli(f);
      expect(result.status, `${malformed}: ${result.stdout} ${result.stderr}`).toBe(malformed ? 1 : 0);
      if (malformed) {
        expect(readFileSync(file).equals(changed)).toBe(true);
        expect(existsSync(nativeRecoveryIntentPath(f.root, f.request.id))).toBe(false);
      } else {
        expect(activeNativeHolds(readNativeRecord(f.root, r.attempt))).toEqual([]);
      }
    } finally { f.cleanup(); }
  }
});


test("independently pinned recovery evidence rejects malformed UTF-8 while valid Unicode remains supported", () => {
  test.setTimeout(60_000);
  for (const kind of ["fault", "authorization", "ruling", "brief", "intent"]) for (const malformed of [false, true]) {
    const f = fixture(`evidence-utf8-${kind}-${malformed}`, 1, false, true);
    try {
      const r = readNativeRecord(f.root, f.records[0].attempt);
      r.native.fixtureUtf8Marker = "valid authority marker �";
      if (kind === "brief") {
        writeFileSync(r.assignment.brief, "fixture brief �\n");
        r.brief.digest = `sha256:${sha(readFileSync(r.assignment.brief))}`;
      }
      if (kind === "fault") {
        const refusal = structuredClone(f.fault.refusal); refusal.operation = "fixture-refusal-�";
        const raw = encode(refusal); writeFileSync(f.faultReference, raw); f.request.fault.rawDigest = sha(raw);
        r.native.holds.find((h: any) => h.key === `native-transaction-refusal:${refusal.id}`).refusal = refusal;
      }
      writeNativeRecord(f.root, r);
      f.request.targets = [nativeRecoveryTarget(f.root, r.attempt, f.base, "terminal")]; authorize(f);
      const a = JSON.parse(readFileSync(f.authorizationFile, "utf8"));
      if (kind === "authorization") a.fixtureUtf8Marker = "valid authorization marker �";
      if (kind === "ruling") {
        writeFileSync(f.evidencePath, readFileSync(f.evidencePath, "utf8") + "Valid ruling marker �\n");
        a.evidenceReference.digest = sha(readFileSync(f.evidencePath));
      }
      atomicJson(f.authorizationFile, a); f.request.authorization.digest = sha(readFileSync(f.authorizationFile));
      const file = kind === "fault" ? f.faultReference : kind === "authorization" ? f.authorizationFile :
        kind === "ruling" ? f.evidencePath : kind === "brief" ? r.assignment.brief : nativeRecoveryIntentPath(f.root, f.request.id);
      if (kind === "intent") {
        const first = cli(f); expect(first.status, `${kind} setup: ${first.stderr}`).toBe(0);
      }
      const before = beforeRecords(f), original = readFileSync(file), marker = Buffer.from("�", "utf8"), at = original.indexOf(marker);
      expect(at, kind).toBeGreaterThan(-1);
      const changed = Buffer.concat([original.subarray(0, at), Buffer.from([0xff]), original.subarray(at + marker.length)]);
      expect(changed.toString("utf8"), kind).toBe(original.toString("utf8")); expect(sha(changed), kind).not.toBe(sha(original));
      if (malformed) writeFileSync(file, changed);
      const result = cli(f);
      expect(result.status, `${kind}/${malformed}: ${result.stdout} ${result.stderr}`).toBe(malformed ? 1 : 0);
      if (malformed) {
        expect(readFileSync(file).equals(changed), kind).toBe(true); unchanged(f, before);
        if (kind !== "intent") expect(existsSync(nativeRecoveryIntentPath(f.root, f.request.id))).toBe(false);
      } else expect(activeNativeHolds(readNativeRecord(f.root, r.attempt))).toEqual([]);
    } finally { f.cleanup(); }
  }
});

test("public raw evidence and requester records reject malformed UTF-8 without normalization or fabricated effects", () => {
  test.setTimeout(30_000);
  for (const kind of ["valid", "raw", "requester"]) {
    const f = fixture(`raw-utf8-${kind}`);
    try {
      const recordFile = nativeRecordPath(f.root, f.records[0].attempt);
      const r = readNativeRecord(f.root, f.records[0].attempt); r.native.fixtureUtf8Marker = "valid requester marker �"; writeNativeRecord(f.root, r);
      const goodRecord = readFileSync(recordFile), marker = Buffer.from("�", "utf8"), rat = goodRecord.indexOf(marker);
      const badRecord = Buffer.concat([goodRecord.subarray(0, rat), Buffer.from([0xff]), goodRecord.subarray(rat + marker.length)]);
      expect(badRecord.toString("utf8")).toBe(goodRecord.toString("utf8"));
      if (kind === "requester") writeFileSync(recordFile, badRecord);
      const before = readFileSync(recordFile);
      let child: any;
      withNativeTransaction(f.root, { operation: "fixture-raw-owner-�" }, () => {
        child = spawnSync(process.execPath, ["--input-type=module", "-e", `
          const [url,root,event]=process.argv.slice(1);const n=await import(url);
          try{n.handleNativeEvent(root,JSON.parse(event),{waitMs:30});process.exitCode=9}catch(e){if(e.code!=="NATIVE_TRANSACTION_BUSY")throw e}
        `, nativeUrl, f.root, JSON.stringify(event("PreToolUse", r.native.binding.agentId,
          { tool_name: "Bash", tool_use_id: "utf8-blocked", tool_input: { command: `cd -- '${f.lanes[0]}' && true` } }))], { encoding: "utf8", timeout: 5_000 });
      });
      expect(child.status, child.stderr).toBe(0); expect(readFileSync(recordFile).equals(before)).toBe(true);
      const dir = nativeTransactionRefusalDir(f.root), names = readdirSync(dir); expect(names).toHaveLength(1);
      const file = path.join(dir, names[0]!), original = readFileSync(file), refusal = JSON.parse(original.toString("utf8"));
      expect(refusal.outcome).toBe("unknown");
      expect(refusal.requester.attribution).toBe(kind === "requester" ? "unknown" : "recorded-binding");
      const at = original.indexOf(marker); expect(at).toBeGreaterThan(-1);
      const changed = Buffer.concat([original.subarray(0, at), Buffer.from([0xff]), original.subarray(at + marker.length)]);
      expect(changed.toString("utf8")).toBe(original.toString("utf8")); expect(sha(changed)).not.toBe(sha(original));
      if (kind === "raw") writeFileSync(file, changed);
      if (kind === "valid") {
        withNativeTransaction(f.root, { operation: "fixture-valid-utf8-absorption" }, () => undefined);
        expect(readFileSync(recordFile, "utf8")).not.toBe(before.toString("utf8"));
        expect(JSON.parse(readFileSync(nativeTransactionFaultPath(f.root, refusal.id), "utf8")).rawContent).toBe(original.toString("utf8"));
        expect(readNativeRecord(f.root, r.attempt).native.receipts).toEqual(r.native.receipts);
      } else {
        let code: any = null;
        try { withNativeTransaction(f.root, { operation: "fixture-invalid-utf8-absorption" }, () => undefined); }
        catch (e: any) { code = e.code; }
        expect(code, kind).toBe(kind === "raw" ? "NATIVE_TRANSACTION_REFUSAL_UNREADABLE" : "NATIVE_AUTHORITY_UTF8");
        expect(readFileSync(file).equals(kind === "raw" ? changed : original)).toBe(true);
        expect(readFileSync(recordFile).equals(before)).toBe(true);
        expect(existsSync(nativeTransactionFaultPath(f.root, refusal.id))).toBe(false);
      }
    } finally { f.cleanup(); }
  }
});


test("public recovery refuses unreadable foreign writer authority instead of dropping it from ownership checks", () => {
  const positive = fixture("unreadable-foreign-positive");
  try { const result = cli(positive); expect(result.status, result.stderr).toBe(0); }
  finally { positive.cleanup(); }
  const observations: any[] = [];
  for (const kind of ["truncated-json", "unknown-version", "missing-writer", "writer-without-resource"]) {
    const f = fixture(`unreadable-foreign-${kind}`);
    try {
      const a: Assignment = { ...f.records[0].assignment, harness: "claude-code" }; delete a.native;
      const started = startRun(f.root, { assignment: a, at: "2026-10-06T00:00:05.000Z" }).record;
      bindRun(f.root, { attempt: started.attempt, harnessId: "fixture-unreadable-live-foreign", pid: process.pid, at: "2026-10-06T00:00:06.000Z" });
      expect(releaseReservation(f.root, { resource: f.lanes[0], attempt: started.attempt })).toBe(true);
      const file = nativeRecordPath(f.root, started.attempt), original = readFileSync(file, "utf8"), before = beforeRecords(f);
      const known = cli(f); expect(known.status, known.stderr).toBe(1); expect(known.stderr).toContain("FOREIGN"); unchanged(f, before);
      const other = JSON.parse(original); expect(other.execution.pid).toBe(process.pid); expect(other.writer).toBe(true);
      if (kind === "truncated-json") writeFileSync(file, original.slice(0, 60));
      else { if (kind === "unknown-version") other.version = 999; else if (kind === "missing-writer") delete other.writer; else other.resource = null; writeFileSync(file, encode(other)); }
      const foreignBytes = readFileSync(file), result = cli(f);
      observations.push({ kind, exit: result.status, unchanged: beforeRecords(f).every((raw, i) => raw === before[i]),
        noIntent: !existsSync(nativeRecoveryIntentPath(f.root, f.request.id)) });
      expect(readFileSync(file).equals(foreignBytes), kind).toBe(true);
      console.info("unreadable foreign writer authority observation", JSON.stringify(observations.at(-1)), result.stdout, result.stderr);
    } finally { f.cleanup(); }
  }
  expect(observations, "unreadable foreign authority must remain conservative").toEqual([
    { kind: "truncated-json", exit: 1, unchanged: true, noIntent: true },
    { kind: "unknown-version", exit: 1, unchanged: true, noIntent: true },
    { kind: "missing-writer", exit: 1, unchanged: true, noIntent: true },
    { kind: "writer-without-resource", exit: 1, unchanged: true, noIntent: true },
  ]);
});


test("conservative physical inventory rejects malformed ownership metadata and namespace while valid read-only authority remains accepted", () => {
  function foreign(f: any, writer = false): any {
    const a: Assignment = { ...f.records[0].assignment, harness: "claude-code", resource: writer ? f.lanes[0] : "none" }; delete a.native;
    const r = startRun(f.root, { assignment: a, at: "2026-10-06T00:00:05.000Z" }).record;
    if (writer) {
      bindRun(f.root, { attempt: r.attempt, harnessId: "fixture-hidden-writer", pid: process.pid, at: "2026-10-06T00:00:06.000Z" });
      expect(releaseReservation(f.root, { resource: f.lanes[0], attempt: r.attempt })).toBe(true);
    }
    return r;
  }
  const positive = fixture("inventory-read-only-positive");
  try { foreign(positive); const result = cli(positive); expect(result.status, result.stderr).toBe(0); }
  finally { positive.cleanup(); }
  const observations: any[] = [];
  for (const kind of ["hidden-writer", "assignment-id", "assignment-resource", "assignment-digest", "unknown-state", "missing-jobs", "attempt-filename", "work-not-directory", "record-not-file"]) {
    const f = fixture(`inventory-${kind}`);
    try {
      const r = foreign(f, kind === "hidden-writer"), file = nativeRecordPath(f.root, r.attempt);
      const other = JSON.parse(readFileSync(file, "utf8")), before = beforeRecords(f);
      if (kind === "hidden-writer") { other.writer = false; other.resource = null; }
      if (kind === "assignment-id") other.assignment.id = "T-unknown";
      if (kind === "assignment-resource") other.assignment.resource = f.lanes[0];
      if (kind === "assignment-digest") other.assignmentDigest = "sha256:" + "0".repeat(64);
      if (kind === "unknown-state") other.state = "unsupported-phase";
      if (kind === "missing-jobs") delete other.ownedJobs;
      if (kind === "attempt-filename") other.attempt += "-unsupported";
      writeFileSync(file, encode(other));
      if (kind === "work-not-directory") writeFileSync(path.join(f.root, ".supertaskr/runs/not-a-work"), "unknown physical authority\n");
      if (kind === "record-not-file") { rmSync(file); mkdirSync(file); }
      const result = cli(f);
      observations.push({ kind, exit: result.status, unchanged: beforeRecords(f).every((raw, i) => raw === before[i]), noIntent: !existsSync(nativeRecoveryIntentPath(f.root, f.request.id)) });
      if (kind !== "record-not-file") expect(readFileSync(file, "utf8")).toBe(encode(other));
    } finally { f.cleanup(); }
  }
  expect(observations, "unknown physical ownership metadata must refuse before intent or target effects").toEqual([
    { kind: "hidden-writer", exit: 1, unchanged: true, noIntent: true },
    { kind: "assignment-id", exit: 1, unchanged: true, noIntent: true },
    { kind: "assignment-resource", exit: 1, unchanged: true, noIntent: true },
    { kind: "assignment-digest", exit: 1, unchanged: true, noIntent: true },
    { kind: "unknown-state", exit: 1, unchanged: true, noIntent: true },
    { kind: "missing-jobs", exit: 1, unchanged: true, noIntent: true },
    { kind: "attempt-filename", exit: 1, unchanged: true, noIntent: true },
    { kind: "work-not-directory", exit: 1, unchanged: true, noIntent: true },
    { kind: "record-not-file", exit: 1, unchanged: true, noIntent: true },
  ]);
});


test("physical authority entries refuse dangling reservations emergency holds and raw directories before recovery effects and at the target boundary", () => {
  test.setTimeout(180_000);
  for (const legacy of [false, true]) {
    const f = fixture(`physical-positive-${legacy}`, 1, true, legacy);
    try {
      if (legacy) authorize(f);
      mkdirSync(nativeTransactionRefusalDir(f.root), { recursive: true });
      const result = cli(f); expect(result.status, result.stderr).toBe(0);
      expect(JSON.parse(result.stdout).completed).toEqual([0]);
      const rec = readNativeRecord(f.root, f.records[0].attempt);
      expect(rec.native.collection).toEqual(f.records[0].native.collection);
      expect(rec.native.receipts).toEqual(f.records[0].native.receipts);
      expect(rec.native.transactionDispositions[0].outcome).toBe("unknown");
      const completedBytes = beforeRecords(f);
      const replay = cli(f); expect(replay.status, replay.stderr).toBe(0);
      expect(JSON.parse(replay.stdout).completed).toEqual([0]); unchanged(f, completedBytes);
    } finally { f.cleanup(); }
  }
  const observations: any[] = [];
  for (const legacy of [false, true]) for (const boundary of [false, true]) {
    for (const kind of ["reservation", "emergency-hold", "raw-fault-directory"]) {
      const f = fixture(`physical-dangling-${legacy}-${boundary}-${kind}`, 1, true, legacy);
      try {
        if (legacy) authorize(f);
        const before = beforeRecords(f), record = nativeRecordPath(f.root, f.records[0].attempt);
        const file = kind === "reservation" ? reservationPath(f.root, f.lanes[0]) :
          kind === "emergency-hold" ? record + ".native-hold" : nativeTransactionRefusalDir(f.root);
        const missing = path.join(f.dir, "nonexistent-authority");
        const insert = () => { mkdirSync(path.dirname(file), { recursive: true }); symlinkSync(missing, file); };
        let code: string;
        if (boundary) code = errorCode(() => recoverNativeTransaction(f.root, f.request, {
          onBoundary: name => { if (name === "before-target") insert(); },
        }));
        else { insert(); const result = cli(f); code = result.status === 1 ? result.stderr : "NO_REFUSAL"; }
        const intentFile = nativeRecoveryIntentPath(f.root, f.request.id);
        observations.push({ legacy, boundary, kind, refused: code !== "NO_REFUSAL",
          unchanged: readFileSync(record, "utf8") === before[0],
          linkIntact: lstatSync(file).isSymbolicLink() && readlinkSync(file) === missing,
          completed: existsSync(intentFile) ? JSON.parse(readFileSync(intentFile, "utf8")).completed : null });
      } finally { f.cleanup(); }
    }
  }
  console.info("physical authority dangling observations", JSON.stringify(observations));
  expect(observations).toHaveLength(12);
  for (const observed of observations) {
    expect(observed, JSON.stringify(observed)).toMatchObject({ refused: true, unchanged: true, linkIntact: true });
    expect(observed.completed).toEqual(observed.boundary ? [] : null);
  }
});

test("physical authority types and immutable intent entries remain checked through pinning publication and replay", () => {
  test.setTimeout(180_000);
  const observations: any[] = [];
  for (const kind of ["record-link", "brief-link", "fault-link", "authorization-link", "ruling-link",
    "intent-dangling", "intent-beforepublication-dangling", "intent-boundary-dangling", "intent-replay-link", "intent-directory", "intent-parent-link", "raw-directory-file", "reservation-directory"]) {
    const legacy = ["authorization-link", "ruling-link"].includes(kind);
    const f = fixture(`physical-types-${kind}`, 1, true, legacy);
    try {
      if (legacy) authorize(f);
      if (kind === "intent-replay-link") expect(recoverNativeTransaction(f.root, f.request).completed).toEqual([0]);
      const before = beforeRecords(f), record = nativeRecordPath(f.root, f.records[0].attempt);
      const intent = nativeRecoveryIntentPath(f.root, f.request.id);
      const file = kind === "record-link" ? record : kind === "brief-link" ? f.records[0].assignment.brief :
        kind === "fault-link" ? nativeTransactionFaultPath(f.root, f.request.fault.id) :
        kind === "authorization-link" ? f.authorizationFile : kind === "ruling-link" ? f.evidencePath :
        kind === "intent-parent-link" ? path.dirname(intent) : kind === "raw-directory-file" ? nativeTransactionRefusalDir(f.root) :
        kind === "reservation-directory" ? reservationPath(f.root, f.lanes[0]) : intent;
      const insert = () => {
        mkdirSync(path.dirname(file), { recursive: true });
        if (["intent-directory", "reservation-directory"].includes(kind)) mkdirSync(file);
        else if (kind === "raw-directory-file") writeFileSync(file, "not a directory\n");
        else if (kind === "intent-parent-link") {
          const target = path.join(f.dir, "other-intent-directory"); mkdirSync(target); symlinkSync(target, file);
        } else if (kind === "intent-replay-link") {
          const target = path.join(f.dir, "original-intent"); writeFileSync(target, readFileSync(file)); rmSync(file); symlinkSync(target, file);
        } else if (kind.startsWith("intent-")) { rmSync(file, { force: true }); symlinkSync(path.join(f.dir, "missing-intent"), file); }
        else { const target = path.join(f.dir, `original-${kind}`); writeFileSync(target, readFileSync(file)); rmSync(file); symlinkSync(target, file); }
      };
      let code: string, pinRefused: boolean | null = null;
      if (kind === "intent-boundary-dangling" || kind === "intent-beforepublication-dangling") code = errorCode(() => recoverNativeTransaction(f.root, f.request, {
        onBoundary: name => { if (name === (kind === "intent-boundary-dangling" ? "before-target" : "before-intent")) insert(); },
      }));
      else {
        insert();
        if (kind === "record-link" || kind === "brief-link" || kind === "reservation-directory")
          pinRefused = errorCode(() => nativeRecoveryTarget(f.root, f.records[0].attempt, f.base, "collected-source")) !== "NO_REFUSAL";
        code = errorCode(() => recoverNativeTransaction(f.root, f.request));
      }
      observations.push({ kind, pinRefused, refused: code !== "NO_REFUSAL", unchanged: readFileSync(record, "utf8") === before[0],
        entryRetained: kind.endsWith("directory") ? lstatSync(file).isDirectory() : kind === "raw-directory-file" ? lstatSync(file).isFile() : lstatSync(file).isSymbolicLink(), code });
    } finally { f.cleanup(); }
  }
  console.info("physical authority type observations", JSON.stringify(observations));
  for (const observed of observations) {
    expect(observed, JSON.stringify(observed)).toMatchObject({ refused: true, unchanged: true, entryRetained: true });
    if (observed.pinRefused !== null) expect(observed.pinRefused).toBe(true);
  }
});
