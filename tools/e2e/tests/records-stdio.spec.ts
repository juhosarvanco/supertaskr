import { spawnSync } from "node:child_process";
import { cpSync, readFileSync, renameSync, symlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { executeRecordProtocol, RECORD_PROTOCOL_LIMIT } from "../scripts/records-stdio.mjs";
import { GENERIC_RECORD_PROFILE } from "../scripts/records-validation.mjs";
import { loadConfiguredPrivateRecordService } from "../scripts/records-save.mjs";
import { acceptedOperationPath, readAcceptedOperation } from "../scripts/durable-operation.mjs";
import { takeReservation, releaseReservation } from "../scripts/run-record.mjs";
import { main } from "../scripts/cli.mjs";
import { privateRecordFixture, putPrivate, commitPrivate, privateGit, FIXTURE_ENV, SOURCE, sha, fixtureProjectSettings } from "./private-record-fixture";

const SUBJECT = new URL("../scripts/records-stdio.mjs", import.meta.url);
const FILE = "docs/rooms/note.md";
function fixture() {
  const f = privateRecordFixture();
  putPrivate(f.product, "supertaskr.yaml", fixtureProjectSettings(f));
  f.options.productRevision = commitPrivate(f.product);
  const invoke = (request: any) => executeRecordProtocol(request, { manifestPath: f.manifestPath }) as any;
  const read = () => invoke({ version: 1, requestId: "read-one", operation: "read", productRoot: f.product, productRevision: f.options.productRevision, path: FILE });
  function edit(reading: any, operation = "save", text = "New private text\n") {
    return { version: 1, requestId: `${operation}-one`, operation, ...f.options, path: FILE,
      expectedFile: reading.observedFile, expectedContext: reading.expectedContext, edit: { contentBase64: Buffer.from(text).toString("base64") },
      ...(operation === "save" ? { operationId: reading.operationId } : {}) };
  }
  return { ...f, invoke, read, edit };
}

test("fixed records protocol reads checks saves and exactly replays backend-authored context", () => {
  const f = fixture();
  try {
    const reading = f.read(); expect(reading.ok).toBe(true); expect(reading.requestId).toBe("read-one");
    expect(reading.result).toMatchObject({ status: "read", path: FILE, recordsRevision: f.options.recordsRevision,
      observedFile: { present: true, mode: "100644" }, recordOrigin: { root: f.records }, expectedContext: expect.stringMatching(/^sha256:[0-9a-f]{64}$/) });
    const check = f.invoke(f.edit(reading.result, "check"));
    expect(check.result).toMatchObject({ status: "checked", accepted: true, observedFile: reading.result.observedFile });
    expect(privateGit(f.records, ["rev-parse", "HEAD"])).toBe(f.options.recordsRevision);
    const request = f.edit(reading.result), saved = f.invoke(request);
    expect(saved.ok).toBe(true); expect(saved.result).toMatchObject({ status: "saved", operationId: reading.result.operationId,
      observedFile: { sha256: sha("New private text\n"), mode: "100644" } });
    expect(f.invoke(request).result).toMatchObject({ commit: saved.result.commit, recovered: true });
    putPrivate(f.product, ".supertaskr/workspace.json", "invalid current binding");
    expect(f.invoke({ version: 1, requestId: "replay-one", operation: "replay", productRoot: f.product, operationId: reading.result.operationId }).result.commit).toBe(saved.result.commit);
  } finally { f.cleanup(); }
});

test("protocol rejects a stale original buffer even if current file already equals intended bytes", () => {
  const f = fixture();
  try {
    const reading = f.read().result, request = f.edit(reading);
    putPrivate(f.records, FILE, "New private text\n");
    const result = f.invoke(request);
    expect(result).toMatchObject({ ok: false, error: { code: "records-save-file-changed", state: "refused", operationId: reading.operationId } });
    expect(readAcceptedOperation(f.product, reading.operationId)).toBeNull();
    const api = loadConfiguredPrivateRecordService({ productRoot: f.product, productRevision: f.options.productRevision, manifestPath: f.manifestPath });
    expect(() => api.save({ ...f.options, operationId: "core-optimistic", expectedFiles: [{ path: FILE, ...reading.observedFile }], expectedContext: reading.expectedContext },
      [{ operation: "edit", path: FILE, type: "blob", mode: "100644", bytes: Buffer.from("New private text\n") }])).toThrow(/records-save-file-changed/);
  } finally { f.cleanup(); }
});

test("opaque expected context detects same-product records rebinding even with identical commits and file bytes", () => {
  const f = fixture();
  try {
    const original = f.read().result, copy = path.join(f.dir, "second-records"); cpSync(f.records, copy, { recursive: true });
    putPrivate(f.product, ".supertaskr/workspace.json", JSON.stringify({ version: 1, projectId: "external-python", productRoot: f.product, recordsRoot: copy }));
    const rebound = f.read().result;
    expect(rebound.recordsRevision).toBe(original.recordsRevision); expect(rebound.observedFile).toEqual(original.observedFile);
    expect(rebound.recordOrigin.root).toBe(copy); expect(rebound.expectedContext).not.toBe(original.expectedContext);
    expect(f.invoke(f.edit(original))).toMatchObject({ ok: false, error: { code: "records-save-context-changed", state: "refused" } });
    expect(privateGit(f.records, ["rev-parse", "HEAD"])).toBe(f.options.recordsRevision); expect(privateGit(copy, ["rev-parse", "HEAD"])).toBe(f.options.recordsRevision);
    const saved = f.invoke(f.edit(rebound)); expect(saved).toMatchObject({ok:true, result:{status:"saved"}});
    expect(privateGit(copy, ["rev-parse", "HEAD"])).toBe(saved.result.commit);
    expect(privateGit(f.records, ["rev-parse", "HEAD"])).toBe(f.options.recordsRevision);
  } finally { f.cleanup(); }
});

test("opaque context detects an identical replacement docs directory within the same records root", () => {
  const f = fixture();
  try {
    const original = f.read().result, docs = path.join(f.records, "docs"), previous = path.join(f.records, "old-docs");
    renameSync(docs, previous); cpSync(previous, docs, { recursive: true });
    const successor = f.read().result;
    expect(successor.observedFile).toEqual(original.observedFile); expect(successor.recordsRevision).toBe(original.recordsRevision);
    expect(successor.recordOrigin.docsInode).not.toBe(original.recordOrigin.docsInode);
    expect(f.invoke(f.edit(original))).toMatchObject({ ok: false, error: { code: "records-save-context-changed", state: "refused" } });
    expect(readAcceptedOperation(f.product, original.operationId)).toBeNull();
  } finally { f.cleanup(); }
});

test("resource refusal publishes no orphan operation and original owner can release before a fresh save", () => {
  const f = fixture();
  try {
    const reading = f.read().result;
    takeReservation(f.product, { resource: f.records, attempt: "held-a1", role: "executor", at: new Date().toISOString() });
    expect(f.invoke(f.edit(reading))).toMatchObject({ ok: false, error: { state: "refused", operationId: reading.operationId } });
    expect(readAcceptedOperation(f.product, reading.operationId)).toBeNull();
    releaseReservation(f.product, { resource: f.records, attempt: "held-a1" });
    expect(f.invoke(f.edit(reading))).toMatchObject({ ok: true, result: { status: "saved" } });
  } finally { f.cleanup(); }
});

test("fixed stdio parser refuses duplicate context keys oversized input and caller installation overrides", () => {
  const invalid = spawnSync(process.execPath, [SUBJECT.pathname, "--stdio"], { input: '{"productRoot":"one","productRoot":"two"}', encoding: "utf8", env: FIXTURE_ENV });
  expect(invalid.status).toBe(2); expect(JSON.parse(invalid.stdout).error.code).toBe("records-protocol-json-duplicate");
  const oversized = spawnSync(process.execPath, [SUBJECT.pathname, "--stdio"], { input: "x".repeat(RECORD_PROTOCOL_LIMIT + 1), encoding: "utf8", env: FIXTURE_ENV });
  expect(oversized.status).toBe(2); expect(JSON.parse(oversized.stdout).error.code).toBe("records-protocol-input-limit");
  const f = fixture();
  try { expect(() => f.invoke({ version: 1, requestId: "read-one", operation: "read", productRoot: f.product,
    productRevision: f.options.productRevision, path: FILE, manifestPath: f.manifestPath })).toThrow(/records-protocol-request/); }
  finally { f.cleanup(); }
});

test("records CLI dispatch uses only its fixed helper and stdin context without cwd project heuristics", () => {
  const f = fixture();
  try {
    const calls: any[] = [];
    const code = main(["records", "--stdio"], { cwd: f.product, spawn: ((command: any, args: any, options: any) => {
      calls.push({ command, args, options }); return { status: 0, signal: null };
    }) as any });
    expect(code).toBe(0); expect(calls).toHaveLength(1);
    expect(calls[0].args).toEqual([SUBJECT.pathname, "--stdio"]); expect(calls[0].options.stdio).toBe("inherit");
    expect(main(["records", "--root", f.product, "--stdio"], { cwd: f.product, stderr() {} })).toBe(2);
  } finally { f.cleanup(); }
});

test("installed records protocol measures a representative thousand-card private board with an unrelated Python product", () => {
  test.setTimeout(240000);
  const f = fixture();
  try {
    const count = 1000, context = "Retained planning context without lifecycle evidence.\n".repeat(150);
    for (let at = 0; at < count; at++) putPrivate(f.records, `docs/tasks/T-${1000 + at}-retained.md`,
      `---\nid: T-${1000 + at}\nstatus: suggested\ntitle: Retained suggestion ${at}\nsuggested_by: fixture user\n---\n\n${context}`);
    f.options.recordsRevision = commitPrivate(f.records);
    // Independent installed copy: no pre-existing source cli/dist is required.
    const expansion = path.join(f.tool, "dist/cli/expand-fence.mjs");
    writeFileSync(expansion, readFileSync(expansion, "utf8").replaceAll("lib/parser/src/", "lib/parser/dist/").replaceAll('.ts"', '.js"'));
    const manifest = JSON.parse(readFileSync(f.manifestPath, "utf8"));
    manifest.runtime.files.find((entry: any) => entry.path === "cli/expand-fence.mjs").sha256 = sha(readFileSync(expansion));
    manifest.runtime.buildHash = sha(JSON.stringify(manifest.runtime.files)); writeFileSync(f.manifestPath, JSON.stringify(manifest));
    symlinkSync(path.join(SOURCE, "tools/e2e/node_modules"), path.join(f.tool, "node_modules"));
    const invoke = (request: any) => {
      const start = performance.now();
      const child = spawnSync(process.execPath, [path.join(f.tool, "supertaskr.mjs"), "records", "--stdio"], {
        cwd: f.product, input: JSON.stringify(request), encoding: "utf8", env: FIXTURE_ENV, maxBuffer: RECORD_PROTOCOL_LIMIT,
      });
      expect(child.stderr).toBe(""); expect(child.status, child.stdout).toBe(0);
      const result = JSON.parse(child.stdout); expect(result.ok, child.stdout).toBe(true);
      return { result: result.result, ms: performance.now() - start };
    };
    const read = invoke({ version: 1, requestId: "large-read", operation: "read", productRoot: f.product, productRevision: f.options.productRevision, path: FILE });
    const checked = invoke(f.edit(read.result, "check")), saved = invoke(f.edit(read.result));
    expect(checked.result.accepted).toBe(true); expect(saved.result.status).toBe("saved");
    expect(privateGit(f.product, ["rev-parse", "HEAD"])).toBe(f.options.productRevision);
    console.log(JSON.stringify({ measurement: "installed-private-board", cards: count, contextBytes: count * Buffer.byteLength(context), readMs: read.ms, checkMs: checked.ms, saveMs: saved.ms }));
  } finally { f.cleanup(); }
});

 test("known zero-effect capture returns refused with a fresh correction ID and never reopens its failed outcome", () => {
  const f = fixture();
  try {
    const reading = f.read().result, request = f.edit(reading);
    const api = loadConfiguredPrivateRecordService({productRoot:f.product, productRevision:f.options.productRevision, manifestPath:f.manifestPath});
    expect(() => api.save({...f.options, operationId:reading.operationId, expectedContext:reading.expectedContext, expectedFiles:[{path:FILE,...reading.observedFile}]},
      [{operation:"edit",path:FILE,type:"blob",mode:"100644",bytes:Buffer.from("New private text\n")}], {onBoundary(at: string) {if(at === "prepared") throw Object.assign(Error("policy refused"),{code:"records-policy-fixture-refused"});}})).toThrow(/policy refused/);
    const refused = f.invoke(request); expect(refused).toMatchObject({ok:false,error:{state:"refused",code:"records-policy-fixture-refused",operationId:reading.operationId,nextOperationId:expect.stringMatching(/^save-/)}});
    expect(refused.error.nextOperationId).not.toBe(reading.operationId);
    expect(f.invoke({version:1,requestId:"failed-replay",operation:"replay",productRoot:f.product,operationId:reading.operationId}).error).toMatchObject({state:"refused",code:"records-policy-fixture-refused",nextOperationId:expect.stringMatching(/^save-/)});
    expect(readAcceptedOperation(f.product, reading.operationId).state).toBe("failed");
    expect(f.invoke({...request,operationId:refused.error.nextOperationId})).toMatchObject({ok:true,result:{status:"saved"}});
  } finally {f.cleanup();}
});

function freshProtocol(f: ReturnType<typeof fixture>, request: any) {
  const child=spawnSync(process.execPath,["--input-type=module","-e",`
    import {readFileSync} from 'node:fs';
    import {executeRecordProtocol} from ${JSON.stringify(SUBJECT.href)};
    process.stdout.write(JSON.stringify(executeRecordProtocol(JSON.parse(readFileSync(0,'utf8')),{manifestPath:${JSON.stringify(f.manifestPath)}})));
  `],{input:JSON.stringify(request),encoding:"utf8",env:FIXTURE_ENV,maxBuffer:RECORD_PROTOCOL_LIMIT});
  expect(child.status,child.stderr).toBe(0);return JSON.parse(child.stdout);
}
function loseClientSave(f: ReturnType<typeof fixture>, boundary: string, wider=false) {
  const read=f.read().result, request=f.edit(read), saveModule=new URL("../scripts/records-save.mjs",import.meta.url).href;
  const overlay=[{operation:"edit",path:FILE,type:"blob",mode:"100644",bytes:"New private text\n"},...(wider?[{operation:"add",path:"docs/plans/wider.md",type:"blob",mode:"100644",bytes:"# Wider captured plan\n"}]:[])];
  const child=spawnSync(process.execPath,["--input-type=module","-e",`
    import {loadConfiguredPrivateRecordService} from ${JSON.stringify(saveModule)};
    const api=loadConfiguredPrivateRecordService({productRoot:${JSON.stringify(f.product)},productRevision:${JSON.stringify(f.options.productRevision)},manifestPath:${JSON.stringify(f.manifestPath)}});
    api.save({...${JSON.stringify(f.options)},operationId:${JSON.stringify(request.operationId)},expectedContext:${JSON.stringify(read.expectedContext)},...${JSON.stringify(wider?{}:{expectedFiles:[{path:FILE,...read.observedFile}]})}},
      ${JSON.stringify(overlay)}.map(entry=>({...entry,bytes:Buffer.from(entry.bytes)})),{onBoundary(at){if(at===${JSON.stringify(boundary)})process.exit(72);}});
  `],{encoding:"utf8",env:FIXTURE_ENV});
  expect(child.status,child.stderr).toBe(72);
  // Deliberately return no client request or remembered UUID.
}

test("a cold client discovers the same captured pending save then replays and acknowledges it without an in-memory UUID", () => {
  const f=fixture();
  try {
    loseClientSave(f,"intent-persisted");
    const discovered=freshProtocol(f,{version:1,requestId:"cold-discover",operation:"discover",productRoot:f.product});
    expect(discovered).toMatchObject({ok:true,result:{status:"recoveries",recoveries:[{state:"pending",paths:[FILE],editorRecovery:"available"}]}});
    expect(JSON.stringify(discovered)).not.toContain(Buffer.from("New private text\n").toString("base64"));
    const recovery=discovered.result.recoveries[0];
    const reading=freshProtocol(f,{version:1,requestId:"cold-read",operation:"read",productRoot:f.product,productRevision:f.options.productRevision,path:FILE});
    expect(reading.result.recoveries[0].capture).toMatchObject({operationId:recovery.operationId,path:FILE,contentBase64:Buffer.from("New private text\n").toString("base64"),expectedFile:{present:true}});
    const accepted=freshProtocol(f,{version:1,requestId:"cold-replay",operation:"replay",productRoot:f.product,operationId:recovery.operationId});
    expect(accepted).toMatchObject({ok:true,result:{status:"saved",operationId:recovery.operationId}});
    const ack={version:1,requestId:"cold-ack",operation:"acknowledge",productRoot:f.product,operationId:recovery.operationId,commit:accepted.result.commit};
    expect(freshProtocol(f,ack)).toMatchObject({ok:true,result:{status:"acknowledged",operationId:recovery.operationId}});
    expect(freshProtocol(f,ack).ok).toBe(true);
    expect(freshProtocol(f,{version:1,requestId:"after-ack",operation:"discover",productRoot:f.product}).result.recoveries).toEqual([]);
    expect(readAcceptedOperation(f.product,recovery.operationId).events.filter((event:any)=>event.op === "client-acknowledged")).toHaveLength(1);
    expect(privateGit(f.records,["rev-parse","HEAD"])).toBe(accepted.result.commit);
  } finally {f.cleanup();}
});

test("lost accepted results remain historical after a later save and can acknowledge before changed current configuration", () => {
  const f=fixture();
  try {
    loseClientSave(f,"ref-accepted");
    const discover=()=>freshProtocol(f,{version:1,requestId:"history-discover",operation:"discover",productRoot:f.product});
    const first=discover().result.recoveries[0];expect(first.state).toBe("accepted");expect(first.capture).toBeUndefined();
    f.options.recordsRevision=first.receipt.commit;
    const later=f.invoke(f.edit(f.read().result,"save","Later legitimate private text\n"));expect(later.ok).toBe(true);
    const after=discover().result.recoveries.find((row:any)=>row.operationId === first.operationId);
    expect(after.receipt.commit).toBe(first.receipt.commit);expect(after.reason).toBe("accepted-history");
    const reading=f.read().result;expect(reading.recoveries.every((row:any)=>!row.capture)).toBe(true);
    expect(Buffer.from(reading.contentBase64,"base64").toString()).toBe("Later legitimate private text\n");
    putPrivate(f.product,".supertaskr/workspace.json","invalid successor binding");
    const replay=freshProtocol(f,{version:1,requestId:"history-replay",operation:"replay",productRoot:f.product,operationId:first.operationId});
    expect(replay.result.commit).toBe(first.receipt.commit);
    const wrong=freshProtocol(f,{version:1,requestId:"wrong-ack",operation:"acknowledge",productRoot:f.product,operationId:first.operationId,commit:later.result.commit});
    expect(wrong.ok).toBe(false);
    expect(freshProtocol(f,{version:1,requestId:"history-ack",operation:"acknowledge",productRoot:f.product,operationId:first.operationId,commit:first.receipt.commit}).ok).toBe(true);
    expect(privateGit(f.records,["rev-parse","HEAD"])).toBe(later.result.commit);
  } finally {f.cleanup();}
});

test("recovery never retargets original captured bytes to a rebound records home and wider captures remain replayable", () => {
  const f=fixture();
  try {
    loseClientSave(f,"intent-persisted",true);
    const original=freshProtocol(f,{version:1,requestId:"wide-discover",operation:"discover",productRoot:f.product}).result.recoveries[0];
    expect(original).toMatchObject({state:"pending",editorRecovery:"unavailable",paths:[FILE,"docs/plans/wider.md"]});
    const copy=path.join(f.dir,"successor-records");cpSync(f.records,copy,{recursive:true});
    const binding=readFileSync(path.join(f.product,".supertaskr/workspace.json"));
    putPrivate(f.product,".supertaskr/workspace.json",JSON.stringify({version:1,projectId:"external-python",productRoot:f.product,recordsRoot:copy}));
    expect(f.read().result.recoveries).toEqual([]);
    expect(freshProtocol(f,{version:1,requestId:"wrong-root-replay",operation:"replay",productRoot:f.product,operationId:original.operationId})).toMatchObject({ok:false,error:{state:"unknown",operationId:original.operationId}});
    expect(privateGit(copy,["rev-parse","HEAD"])).toBe(f.options.recordsRevision);expect(privateGit(f.records,["rev-parse","HEAD"])).toBe(f.options.recordsRevision);
    putPrivate(f.product,".supertaskr/workspace.json",binding);
    const resumed=freshProtocol(f,{version:1,requestId:"wide-replay",operation:"replay",productRoot:f.product,operationId:original.operationId});
    expect(resumed).toMatchObject({ok:true,result:{status:"saved"}});
    expect(readFileSync(path.join(f.records,"docs/plans/wider.md"),"utf8")).toBe("# Wider captured plan\n");
    expect(privateGit(copy,["rev-parse","HEAD"])).toBe(f.options.recordsRevision);
  } finally {f.cleanup();}
});

test("strict discovery refuses malformed owned operation filenames instead of silently skipping them", () => {
  const f=fixture();
  try {
    loseClientSave(f,"intent-persisted");
    const row=freshProtocol(f,{version:1,requestId:"valid-discover",operation:"discover",productRoot:f.product}).result.recoveries[0];
    const canonical=acceptedOperationPath(f.product,row.operationId);renameSync(canonical,`${canonical}.foreign`);
    expect(freshProtocol(f,{version:1,requestId:"corrupt-discover",operation:"discover",productRoot:f.product})).toMatchObject({ok:false,error:{code:"OPERATION_RECORD"}});
    expect(f.read()).toMatchObject({ok:false,error:{code:"OPERATION_RECORD"}});
    renameSync(`${canonical}.foreign`,canonical);
    expect(freshProtocol(f,{version:1,requestId:"restored-discover",operation:"discover",productRoot:f.product}).result.recoveries[0].operationId).toBe(row.operationId);
  } finally {f.cleanup();}
});
