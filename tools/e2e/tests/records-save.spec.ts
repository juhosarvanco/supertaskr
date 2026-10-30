import { spawnSync } from "node:child_process";
import { chmodSync, cpSync, existsSync, readFileSync, readdirSync, statSync, writeFileSync, renameSync, symlinkSync, lstatSync, readlinkSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { createPrivateRecordService, loadConfiguredPrivateRecordService, replayPrivateRecordSave } from "../scripts/records-save.mjs";
import { loadInstalledRecordTool } from "../scripts/records-check.mjs";
import { GENERIC_RECORD_PROFILE } from "../scripts/records-validation.mjs";
import { captureExactRecordPlan, releaseAcceptedRecordWriteLock, stopUnmaterializedRecordWrite } from "../scripts/record-write.mjs";
import { readAcceptedOperation } from "../scripts/durable-operation.mjs";
import { takeReservation, releaseReservation } from "../scripts/run-record.mjs";
import { sha } from "./private-record-fixture";
import { privateRecordFixture, putPrivate, commitPrivate, privateGit, FIXTURE_ENV, fixtureProjectSettings } from "./private-record-fixture";

const SUBJECT = new URL("../scripts/records-save.mjs", import.meta.url).href;
const CHECK = new URL("../scripts/records-check.mjs", import.meta.url).href;
const PROFILE = new URL("../scripts/records-validation.mjs", import.meta.url).href;
const edit = (file: string, text: string, operation = "edit") => ({ operation, path: file, type: "blob", mode: "100644", bytes: Buffer.from(text) });
function service(f: ReturnType<typeof privateRecordFixture>) { return createPrivateRecordService({ profile: GENERIC_RECORD_PROFILE, tool: loadInstalledRecordTool(f.manifestPath) }); }
function objectSnapshot(root: string) {
  const result: string[] = [];
  function visit(directory: string) { for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name); if (entry.isDirectory()) visit(file); else result.push(`${path.relative(root, file)}:${sha(readFileSync(file))}`);
  } }
  visit(path.join(root, ".git/objects")); return result.sort();
}
function crashSave(f: ReturnType<typeof privateRecordFixture>, operationId: string, boundary: string) {
  return spawnSync(process.execPath, ["--input-type=module", "-e", `
    import {createPrivateRecordService} from ${JSON.stringify(SUBJECT)};
    import {loadInstalledRecordTool} from ${JSON.stringify(CHECK)};
    import {GENERIC_RECORD_PROFILE} from ${JSON.stringify(PROFILE)};
    const service=createPrivateRecordService({profile:GENERIC_RECORD_PROFILE,tool:loadInstalledRecordTool(${JSON.stringify(f.manifestPath)})});
    service.save(${JSON.stringify({ ...f.options, operationId })},[{operation:'edit',path:'docs/rooms/note.md',type:'blob',mode:'100644',bytes:Buffer.from('First accepted note\\n')}],{onBoundary(at){if(at===${JSON.stringify(boundary)})process.exit(72);}});
  `], { encoding: "utf8", env: FIXTURE_ENV });
}

test("exact private planning retains a committed preimage above one MiB without changing repository objects or accepting unrelated work",()=>{
  const f=privateRecordFixture();try {
    const file="docs/rooms/note.md",before=Buffer.from("Original private preimage\n"+"ordinary exact bytes\n".repeat(65000));
    expect(before.length).toBeGreaterThan(1024*1024);putPrivate(f.records,file,before);
    const revision=commitPrivate(f.records),index=readFileSync(path.join(f.records,".git/index")),objects=objectSnapshot(f.records),refs=privateGit(f.records,["for-each-ref","--format=%(refname) %(objectname)"]);
    const writes=[{operation:"edit",path:file,type:"blob",mode:"100644",base64:Buffer.from("New exact private text\n").toString("base64")}];
    const captured=captureExactRecordPlan(f.records,revision,writes);
    expect(captured.working.preimages).toEqual([{path:file,work:{present:true,mode:"100644",base64:before.toString("base64")}}]);
    writeFileSync(path.join(f.records,file),"Unrelated unsaved user text\n");
    expect(()=>captureExactRecordPlan(f.records,revision,writes)).toThrow("records-save-working-conflict");
    expect(readFileSync(path.join(f.records,file),"utf8")).toBe("Unrelated unsaved user text\n");
    writeFileSync(path.join(f.records,file),before);expect(captureExactRecordPlan(f.records,revision,writes).tree).toBe(captured.tree);
    expect(privateGit(f.records,["rev-parse","HEAD"])).toBe(revision);expect(privateGit(f.records,["for-each-ref","--format=%(refname) %(objectname)"])).toBe(refs);
    expect(readFileSync(path.join(f.records,".git/index"))).toEqual(index);expect(objectSnapshot(f.records)).toEqual(objects);expect(readFileSync(path.join(f.records,file))).toEqual(before);
  }finally{f.cleanup();}
});

test("ordinary v1 save disposition retains strict preimages and stops only untouched original work",()=>{
  const f=privateRecordFixture();try {
    const stopped=crashSave(f,"ordinary-v1-stop","intent-persisted");expect(stopped.status,stopped.stderr).toBe(72);
    const rec=readAcceptedOperation(f.product,"ordinary-v1-stop"),request=JSON.stringify(rec.operation.request);
    expect(rec.operation.request.payload.version).toBe(1);expect(rec.operation.request.payload.kind).toBe("ordinary-record-save");
    const file=path.join(f.records,"docs/rooms/note.md"),bytes=readFileSync(file),index=readFileSync(path.join(f.records,".git/index")),head=privateGit(f.records,["rev-parse","HEAD"]);
    writeFileSync(file,"Unrelated changed working note\n");
    expect(()=>stopUnmaterializedRecordWrite(f.product,"ordinary-v1-stop",{payloadKind:"ordinary-record-save"})).toThrow("records-save-disposition-unavailable");
    expect(readFileSync(file,"utf8")).toBe("Unrelated changed working note\n");expect(readFileSync(path.join(f.records,".git/index"))).toEqual(index);
    expect(JSON.stringify(readAcceptedOperation(f.product,"ordinary-v1-stop").operation.request)).toBe(request);
    writeFileSync(file,bytes);
    expect(stopUnmaterializedRecordWrite(f.product,"ordinary-v1-stop",{payloadKind:"ordinary-record-save"}).status).toBe("stopped");
    expect(privateGit(f.records,["rev-parse","HEAD"])).toBe(head);expect(readFileSync(file)).toEqual(bytes);expect(readFileSync(path.join(f.records,".git/index"))).toEqual(index);
    expect(JSON.stringify(readAcceptedOperation(f.product,"ordinary-v1-stop").operation.request)).toBe(request);
  } finally {f.cleanup();}
});

test("cold exact save preserves a foreign replacement temporary and resumes only with the known original bytes",()=>{
 const f=privateRecordFixture();try{
  const crashed=crashSave(f,"cold-foreign-temporary","file-temp-written");expect(crashed.status,crashed.stderr).toBe(72);
  const rec=readAcceptedOperation(f.product,"cold-foreign-temporary"),p=rec.operation.request.payload,request=JSON.stringify(rec.operation.request),tip=privateGit(f.records,["rev-parse","HEAD"]),index=readFileSync(path.join(f.records,".git/index"));
  const pending=p.writes.map((w:any)=>`${path.join(f.records,w.path)}.supertaskr-${p.index.lockToken}.tmp`).filter((file:string)=>existsSync(file));expect(pending).toHaveLength(1);
  const temp=pending[0],original=path.join(f.dir,"known-original-temporary"),canary=path.join(f.dir,"foreign-temporary-canary");renameSync(temp,original);writeFileSync(temp,"Foreign replacement temporary bytes\n");const inode=statSync(temp,{bigint:true}).ino;
  expect(()=>service(f).replay({productRoot:f.product,operationId:"cold-foreign-temporary"})).toThrow(/records-save-temporary-unavailable/);
  expect(statSync(temp,{bigint:true}).ino).toBe(inode);expect(readFileSync(temp,"utf8")).toBe("Foreign replacement temporary bytes\n");expect(privateGit(f.records,["rev-parse","HEAD"])).toBe(tip);expect(readFileSync(path.join(f.records,".git/index"))).toEqual(index);expect(JSON.stringify(readAcceptedOperation(f.product,"cold-foreign-temporary").operation.request)).toBe(request);
  renameSync(temp,canary);renameSync(original,temp);const saved=service(f).replay({productRoot:f.product,operationId:"cold-foreign-temporary"});expect(saved.status).toBe("saved");expect(privateGit(f.records,["rev-parse","HEAD"])).toBe(saved.commit);expect(readFileSync(canary,"utf8")).toBe("Foreign replacement temporary bytes\n");
  expect(JSON.stringify(readAcceptedOperation(f.product,"cold-foreign-temporary").operation.request)).toBe(request);
 }finally{f.cleanup();}
});
test("cleanup of this call's temporary preserves a replacement inode and exact original capture remains resumable",()=>{
 const f=privateRecordFixture();try{
  const api=service(f),original=path.join(f.dir,"active-original-temporary"),canary=path.join(f.dir,"active-foreign-canary");let temporary="",inode:bigint|undefined;
  expect(()=>api.save({...f.options,operationId:"active-foreign-temporary"},[edit("docs/rooms/note.md","New captured note\n")],{onBoundary(at,context){if(at==="file-temp-written"){
   const rec=readAcceptedOperation(f.product,"active-foreign-temporary");temporary=`${path.join(f.records,context.path)}.supertaskr-${rec.operation.request.payload.index.lockToken}.tmp`;
   renameSync(temporary,original);writeFileSync(temporary,"Replacement during active cleanup\n");inode=statSync(temporary,{bigint:true}).ino;throw Error("Stop this owned write");
  }}})).toThrow(/records-save-temporary-unavailable/);
  expect(temporary).not.toBe("");expect(statSync(temporary,{bigint:true}).ino).toBe(inode);expect(readFileSync(temporary,"utf8")).toBe("Replacement during active cleanup\n");
  const request=JSON.stringify(readAcceptedOperation(f.product,"active-foreign-temporary").operation.request);expect(privateGit(f.records,["rev-parse","HEAD"])).toBe(f.options.recordsRevision);
  renameSync(temporary,canary);renameSync(original,temporary);expect(api.replay({productRoot:f.product,operationId:"active-foreign-temporary"}).status).toBe("saved");expect(readFileSync(canary,"utf8")).toBe("Replacement during active cleanup\n");expect(JSON.stringify(readAcceptedOperation(f.product,"active-foreign-temporary").operation.request)).toBe(request);
 }finally{f.cleanup();}
});
for(const change of ["binding","docs"] as const)test(`ordinary save refuses a mid-prepare ${change} successor before visible publication and resumes the original`,()=>{
 const f=privateRecordFixture();try{
  const api=service(f),binding=path.join(f.product,".supertaskr/workspace.json"),bindingBytes=readFileSync(binding),docs=path.join(f.records,"docs"),originalDocs=path.join(f.dir,"original-docs"),successorDocs=path.join(f.dir,"successor-docs"),before=readFileSync(path.join(docs,"rooms/note.md")),index=readFileSync(path.join(f.records,".git/index"));let changed=false;
  expect(()=>api.save({...f.options,operationId:`mid-prepare-${change}`},[edit("docs/rooms/note.md","New original-context note\n")],{onBoundary(at){if(at==="file-temp-written"&&!changed){changed=true;
   if(change==="binding")writeFileSync(binding,"Invalid successor binding\n");else{renameSync(docs,originalDocs);cpSync(originalDocs,docs,{recursive:true});}
  }}})).toThrow();
  expect(changed).toBe(true);expect(privateGit(f.records,["rev-parse","HEAD"])).toBe(f.options.recordsRevision);expect(readFileSync(path.join(f.records,".git/index"))).toEqual(index);expect(readFileSync(path.join(docs,"rooms/note.md"))).toEqual(before);
  const rec=readAcceptedOperation(f.product,`mid-prepare-${change}`),request=JSON.stringify(rec.operation.request);expect(["starting","unknown"]).toContain(rec.state);expect(rec.events.some((e:any)=>e.op==="consumer-prepare")).toBe(true);expect(rec.operation.intent).not.toBeNull();expect(rec.operation.acceptance).toBeNull();
  if(change==="binding")writeFileSync(binding,bindingBytes);else{renameSync(docs,successorDocs);renameSync(originalDocs,docs);}
  const saved=api.replay({productRoot:f.product,operationId:`mid-prepare-${change}`});expect(saved.status).toBe("saved");expect(privateGit(f.records,["rev-parse","HEAD"])).toBe(saved.commit);expect(readFileSync(path.join(docs,"rooms/note.md"),"utf8")).toBe("New original-context note\n");expect(JSON.stringify(readAcceptedOperation(f.product,`mid-prepare-${change}`).operation.request)).toBe(request);
  if(change==="docs")expect(readFileSync(path.join(successorDocs,"rooms/note.md"))).toEqual(before);
 }finally{f.cleanup();}
});
test("ordinary save rechecks the original binding after tree preparation before writing a commit object",()=>{
 const f=privateRecordFixture();try{const api=service(f),binding=path.join(f.product,".supertaskr/workspace.json"),bytes=readFileSync(binding);let changed=false;
  expect(()=>api.save({...f.options,operationId:"before-commit-context"},[edit("docs/rooms/note.md","Captured original note\n")],{onBoundary(at){if(at==="tree-prepared"&&!changed){changed=true;writeFileSync(binding,"Invalid before commit-object effect\n");}}})).toThrow();
  const rec=readAcceptedOperation(f.product,"before-commit-context"),request=JSON.stringify(rec.operation.request);expect(changed).toBe(true);expect(rec.operation.intent).toBeNull();expect(rec.events.some((e:any)=>e.op==="consumer-prepare")).toBe(false);expect(privateGit(f.records,["rev-parse","HEAD"])).toBe(f.options.recordsRevision);
  writeFileSync(binding,bytes);expect(api.replay({productRoot:f.product,operationId:"before-commit-context"}).status).toBe("saved");expect(JSON.stringify(readAcceptedOperation(f.product,"before-commit-context").operation.request)).toBe(request);
 }finally{f.cleanup();}
});

test("ordinary save commits exact user and derived bytes while preserving unrelated staged work bytes and modes", () => {
  const f = privateRecordFixture();
  try {
    putPrivate(f.records, "unrelated.txt", "committed unrelated\n"); f.options.recordsRevision = commitPrivate(f.records);
    putPrivate(f.records, "unrelated.txt", "staged unrelated\n"); chmodSync(path.join(f.records, "unrelated.txt"), 0o755); privateGit(f.records, ["add", "unrelated.txt"]);
    putPrivate(f.records, "unrelated.txt", "working unrelated\n"); chmodSync(path.join(f.records, "unrelated.txt"), 0o644);
    putPrivate(f.records, "untracked.txt", "untracked preserved\n");
    const productIndex = readFileSync(path.join(f.product, ".git/index"));
    const productObjects = objectSnapshot(f.product);
    const saved = service(f).save({ ...f.options, operationId: "exact-save" }, [edit("docs/rooms/note.md", "Saved private note\n"), edit("docs/plans/new-plan.md", "# Draft plan\n\nPending implementation.\n", "add")]);
    expect(saved.status).toBe("saved"); expect(saved.paths).toEqual(["docs/rooms/note.md", "docs/plans/new-plan.md", "docs/INDEX.md"]);
    expect(privateGit(f.records, ["diff-tree", "--no-commit-id", "--name-only", "-r", saved.commit]).split("\n").sort()).toEqual([...saved.paths].sort());
    expect(privateGit(f.records, ["show", `${saved.commit}:unrelated.txt`])).toBe("committed unrelated");
    expect(privateGit(f.records, ["show", ":unrelated.txt"])).toBe("staged unrelated");
    expect(privateGit(f.records, ["ls-files", "--stage", "unrelated.txt"])).toMatch(/^100755 /);
    expect(readFileSync(path.join(f.records, "unrelated.txt"), "utf8")).toBe("working unrelated\n");
    expect(statSync(path.join(f.records, "unrelated.txt")).mode & 0o111).toBe(0);
    expect(readFileSync(path.join(f.records, "untracked.txt"), "utf8")).toBe("untracked preserved\n");
    expect(privateGit(f.product, ["rev-parse", "HEAD"])).toBe(f.options.productRevision);
    expect(readFileSync(path.join(f.product, ".git/index"))).toEqual(productIndex);
    expect(objectSnapshot(f.product)).toEqual(productObjects);
    expect(readFileSync(path.join(f.records, "docs/rooms/note.md"), "utf8")).toBe("Saved private note\n");
    expect(existsSync(path.join(f.records, ".git/index.lock"))).toBe(false);
    const payload = readAcceptedOperation(f.product, saved.operationId).operation.request.payload;
    expect(payload.writes).toHaveLength(3); expect(payload.baseline.map((entry: any) => entry.path)).toEqual(["docs/rooms/note.md"]);
  } finally { f.cleanup(); }
});

test("ordinary save restart returns its original accepted revision after a later legitimate save", () => {
  const f = privateRecordFixture();
  try {
    const crash = crashSave(f, "first-save", "ref-accepted"); expect(crash.status, crash.stderr).toBe(72);
    const first = privateGit(f.records, ["rev-parse", "HEAD"]); expect(first).not.toBe(f.options.recordsRevision);
    expect(existsSync(path.join(f.records, ".git/index.lock"))).toBe(true);
    const next = service(f).save({ ...f.options, recordsRevision: first, operationId: "second-save" }, [edit("docs/rooms/note.md", "Second legitimate note\n")]);
    const count = privateGit(f.records, ["rev-list", "--count", "HEAD"]);
    const restored = service(f).replay({ productRoot: f.product, operationId: "first-save" });
    expect(restored.commit).toBe(first); expect(restored.recovered).toBe(true);
    expect(privateGit(f.records, ["rev-parse", "HEAD"])).toBe(next.commit); expect(privateGit(f.records, ["rev-list", "--count", "HEAD"])).toBe(count);
    expect(readFileSync(path.join(f.records, "docs/rooms/note.md"), "utf8")).toBe("Second legitimate note\n");
    expect(existsSync(path.join(f.records, ".git/index.lock"))).toBe(false);
  } finally { f.cleanup(); }
});

for (const boundary of ["working-file", "index-prepared", "file-temp-written"]) test(`ordinary save resumes exact captured bytes after a crash at ${boundary}`, () => {
  const f = privateRecordFixture();
  try {
    const crash = crashSave(f, `interrupted-${boundary}`, boundary); expect(crash.status, crash.stderr).toBe(72);
    expect(privateGit(f.records, ["rev-parse", "HEAD"])).toBe(f.options.recordsRevision);
    const intended = readAcceptedOperation(f.product, `interrupted-${boundary}`).operation.intent.commit;
    const fileInode = statSync(path.join(f.records, "docs/rooms/note.md"), { bigint: true }).ino;
    const indexInode = statSync(path.join(f.records, ".git/index"), { bigint: true }).ino;
    const result = service(f).replay({ productRoot: f.product, operationId: `interrupted-${boundary}` });
    expect(result.commit).toBe(intended); expect(readFileSync(path.join(f.records, "docs/rooms/note.md"), "utf8")).toBe("First accepted note\n");
    expect(existsSync(path.join(f.records, ".git/index.lock"))).toBe(false);
    if (boundary !== "file-temp-written") expect(statSync(path.join(f.records, "docs/rooms/note.md"), { bigint: true }).ino).toBe(fileInode);
    if (boundary === "index-prepared") expect(statSync(path.join(f.records, ".git/index"), { bigint: true }).ino).toBe(indexInode);
  } finally { f.cleanup(); }
});

test("ordinary saving preserves private existing access permissions and creates private text files", () => {
  const f = privateRecordFixture();
  try {
    chmodSync(path.join(f.records, "docs/rooms/note.md"), 0o600); chmodSync(path.join(f.records, ".git/index"), 0o600);
    const oldMask = process.umask(0o022);
    let result;
    try { result = service(f).save({ ...f.options, operationId: "private-access" }, [edit("docs/rooms/note.md", "Private replacement bytes\n"), edit("docs/plans/private.md", "Private new bytes\n", "add")]); }
    finally { process.umask(oldMask); }
    expect(result.status).toBe("saved");
    for (const file of ["docs/rooms/note.md", "docs/plans/private.md", "docs/INDEX.md", ".git/index"]) expect(statSync(path.join(f.records, file)).mode & 0o777).toBe(0o600);
  } finally { f.cleanup(); }
});

test("ordinary prose cannot award task lifecycle verdict or dispatch stamps and checkpoint history stays append-only", () => {
  const f = privateRecordFixture();
  try {
    const card = "---\nid: T-999\ntitle: Planned private task\nfeature: F-01\nmilestone: 1\npriority: 1\nsize: M\nstatus: planned\ntouches: [src/]\nreview: independent\n---\n\nTask contract.\n\n## Acceptance criteria\n\n- Planned condition.\n\n## Verdicts\n";
    putPrivate(f.records, "docs/ROADMAP.md", "# Roadmap\n\nProject roadmap.\n\n## Backbone\n\n- F-01: Planned feature — private fixture\n");
    putPrivate(f.records, "docs/tasks/T-999-planned.md", card);
    putPrivate(f.records, "docs/checkpoints/old.md", "# Existing record\n\nOriginal evidence.\n"); f.options.recordsRevision = commitPrivate(f.records);
    const api = service(f), before = privateGit(f.records, ["rev-parse", "HEAD"]);
    expect(() => api.save({ ...f.options, operationId: "status" }, [edit("docs/tasks/T-999-planned.md", card.replace("status: planned", "status: done"))])).toThrow(/records-save-card-authority/);
    expect(() => api.save({ ...f.options, operationId: "verdict" }, [edit("docs/tasks/T-999-planned.md", card + "\n### APPROVED\n\nAsserted success.\n")])).toThrow(/records-save-record-preservation/);
    expect(() => api.save({ ...f.options, operationId: "stamp" }, [edit("docs/tasks/T-999-planned.md", card.replace("status: planned", "status: planned\nbuilt_by: pretend"))])).toThrow(/records-save-card-authority/);
    expect(() => api.save({ ...f.options, operationId: "rewrite" }, [edit("docs/checkpoints/old.md", "# Replacement\n\nDeleted evidence.\n")])).toThrow(/records-save-append-only/);
    expect(privateGit(f.records, ["rev-parse", "HEAD"])).toBe(before);
    const edited = api.save({ ...f.options, operationId: "planned-text" }, [edit("docs/tasks/T-999-planned.md", card.replace("Task contract.", "Edited planning contract."))]);
    expect(edited.status).toBe("saved");
    expect(api.save({ ...f.options, recordsRevision: edited.commit, operationId: "new-planned" }, [edit("docs/tasks/T-1000-planned.md", card.replace("T-999", "T-1000") + "<!-- verifier appends here later -->\n", "add")]).status).toBe("saved");
  } finally { f.cleanup(); }
});

test("configured public service distinguishes absent and invalid policy without guessing from missing dogfood files", () => {
  const f = privateRecordFixture();
  try {
    expect(() => loadConfiguredPrivateRecordService({ productRoot: f.product, productRevision: f.options.productRevision, manifestPath: f.manifestPath })).toThrow(/records-service-not-configured/);
    putPrivate(f.product, "supertaskr.yaml", "records:\n  validation: [invalid]\n"); f.options.productRevision = commitPrivate(f.product);
    expect(() => loadConfiguredPrivateRecordService({ productRoot: f.product, productRevision: f.options.productRevision, manifestPath: f.manifestPath })).toThrow(/project-settings-invalid/);
    putPrivate(f.product, "supertaskr.yaml", fixtureProjectSettings(f)); f.options.productRevision = commitPrivate(f.product);
    const api = loadConfiguredPrivateRecordService({ productRoot: f.product, productRevision: f.options.productRevision, manifestPath: f.manifestPath });
    const result = api.save({ ...f.options, operationId: "configured" }, [edit("docs/reviews/draft.md", "# Draft review\n\nUnapproved work.\n", "add")]);
    expect(result.status).toBe("saved"); expect(existsSync(path.join(f.product, "lib/parser"))).toBe(false);
    expect(() => api.save({ ...f.options, productRevision: "0".repeat(40) }, [])).toThrow(/records-service-project-changed/);
  } finally { f.cleanup(); }
});

test("reserved ordinary save has zero real object-store effects and its released positive control saves exact bytes", () => {
  const f = privateRecordFixture();
  try {
    takeReservation(f.product, { resource: f.records, attempt: "held-a1", role: "executor", at: new Date().toISOString() });
    const before = objectSnapshot(f.records), beforeIndex = readFileSync(path.join(f.records, ".git/index"));
    const api = service(f), request = { ...f.options, operationId: "reserved-save" }, overlay = [edit("docs/rooms/note.md", "Unique reserved candidate bytes\n")];
    expect(() => api.save(request, overlay)).toThrow(/OPERATION_RESOURCE_RESERVED/);
    expect(readAcceptedOperation(f.product, request.operationId)).toBeNull();
    expect(objectSnapshot(f.records)).toEqual(before); expect(readFileSync(path.join(f.records, ".git/index"))).toEqual(beforeIndex);
    expect(privateGit(f.records, ["rev-parse", "HEAD"])).toBe(f.options.recordsRevision);
    releaseReservation(f.product, { resource: f.records, attempt: "held-a1" });
    expect(api.save(request, overlay).status).toBe("saved"); expect(objectSnapshot(f.records)).not.toEqual(before);
  } finally { f.cleanup(); }
});

test("ordinary exact-byte saving honors disabled conversion attributes and refuses active EOL transformation before objects change", () => {
  const f = privateRecordFixture();
  try {
    putPrivate(f.records, ".gitattributes", "docs/** text eol=crlf\n"); f.options.recordsRevision = commitPrivate(f.records);
    const before = objectSnapshot(f.records);
    expect(() => service(f).save({ ...f.options, operationId: "conversion-refused" }, [edit("docs/rooms/note.md", "Exact LF bytes\n")])).toThrow(/records-save-transformation-unsupported/);
    expect(objectSnapshot(f.records)).toEqual(before);
    putPrivate(f.records, ".gitattributes", "docs/** -text -filter -ident\n"); f.options.recordsRevision = commitPrivate(f.records);
    const saved = service(f).save({ ...f.options, operationId: "exact-disabled-conversion" }, [edit("docs/rooms/note.md", "Exact LF bytes\n")]);
    expect(saved.status).toBe("saved"); expect(readFileSync(path.join(f.records, "docs/rooms/note.md"), "utf8")).toBe("Exact LF bytes\n");
  } finally { f.cleanup(); }
});

test("outer historical save replay precedes invalid current binding and missing validation selection", () => {
  const f = privateRecordFixture();
  try {
    const saved = service(f).save({ ...f.options, operationId: "historical-outer" }, [edit("docs/rooms/note.md", "Historical saved text\n")]);
    putPrivate(f.product, ".supertaskr/workspace.json", "invalid current binding");
    const result = replayPrivateRecordSave({ productRoot: f.product, operationId: saved.operationId, manifestPath: path.join(f.dir, "missing-tool.json") });
    expect(result.commit).toBe(saved.commit); expect(result.recovered).toBe(true);
    expect(privateGit(f.records, ["rev-parse", "HEAD"])).toBe(saved.commit);
  } finally { f.cleanup(); }
});

test("ordinary save respects a legacy owner of a contained records path before any object effect", () => {
  const f = privateRecordFixture();
  try {
    const resource = path.join(f.records, "docs");
    takeReservation(f.product, { resource, attempt: "contained-a1", role: "executor", at: new Date().toISOString() });
    const before = objectSnapshot(f.records);
    expect(() => service(f).save({ ...f.options, operationId: "contained-refusal" }, [edit("docs/rooms/note.md", "Contained owner bytes\n")])).toThrow(/OPERATION_RESOURCE_RESERVED/);
    expect(objectSnapshot(f.records)).toEqual(before);
    releaseReservation(f.product, { resource, attempt: "contained-a1" });
  } finally { f.cleanup(); }
});

test("ordinary save refuses preexisting split-index state before copying it and preserves the positive standalone route", () => {
  const f = privateRecordFixture();
  try {
    privateGit(f.records, ["update-index", "--split-index"]);
    expect(privateGit(f.records, ["rev-parse", "--shared-index-path"])).not.toBe("");
    const before = objectSnapshot(f.records), index = readFileSync(path.join(f.records, ".git/index"));
    expect(() => service(f).save({ ...f.options, operationId: "split-refused" }, [edit("docs/rooms/note.md", "Split index candidate\n")])).toThrow(/OPERATION_GIT_CONFIG/);
    expect(objectSnapshot(f.records)).toEqual(before); expect(readFileSync(path.join(f.records, ".git/index"))).toEqual(index);
    privateGit(f.records, ["update-index", "--no-split-index"]);
    expect(service(f).save({ ...f.options, operationId: "standalone-positive" }, [edit("docs/rooms/note.md", "Standalone index candidate\n")]).status).toBe("saved");
  } finally { f.cleanup(); }
});

test("ordinary creation rejects filesystem case or Unicode aliases and admits an exact-name untracked positive", () => {
  const f = privateRecordFixture();
  try {
    putPrivate(f.records, "docs/plans/foo.md", "Same intended bytes\n");
    f.options.recordsRevision = commitPrivate(f.records);
    // Keep the Unicode control untracked so Git's own precomposition does not
    // reject it as an existing exact Git path before the filesystem boundary.
    putPrivate(f.records, "docs/plans/Cafe\u0301.md", "Same Unicode bytes\n");
    const before = objectSnapshot(f.records), api = service(f);
    if (existsSync(path.join(f.records, "docs/plans/Foo.md"))) {
      expect(() => api.save({ ...f.options, operationId: "case-alias" }, [edit("docs/plans/Foo.md", "Same intended bytes\n", "add")])).toThrow(/records-save-path-alias/);
      expect(objectSnapshot(f.records)).toEqual(before);
    }
    if (existsSync(path.join(f.records, "docs/plans/Caf\u00e9.md"))) {
      expect(() => api.save({ ...f.options, operationId: "unicode-alias" }, [edit("docs/plans/Caf\u00e9.md", "Same Unicode bytes\n", "add")])).toThrow(/records-save-path-alias/);
      expect(objectSnapshot(f.records)).toEqual(before);
    }
    putPrivate(f.records, "docs/plans/Exact.md", "Exact untracked bytes\n");
    expect(api.save({ ...f.options, operationId: "exact-untracked" }, [edit("docs/plans/Exact.md", "Exact untracked bytes\n", "add")]).status).toBe("saved");
    expect(privateGit(f.records, ["show", "HEAD:docs/plans/Exact.md"])).toBe("Exact untracked bytes");
  } finally { f.cleanup(); }
});

test("cold accepted save replay retires its exact dead index lock so an ordinary Git commit works",()=>{
 const f=privateRecordFixture();try {
  const crashed=crashSave(f,"cold-lock","ref-accepted");expect(crashed.status,crashed.stderr).toBe(72);const accepted=privateGit(f.records,["rev-parse","HEAD"]);
  const replay=spawnSync(process.execPath,["--input-type=module","-e",`import {replayPrivateRecordSave} from ${JSON.stringify(SUBJECT)};
   process.stdout.write(JSON.stringify(replayPrivateRecordSave({productRoot:${JSON.stringify(f.product)},operationId:'cold-lock',manifestPath:${JSON.stringify(f.manifestPath)}})));`],{encoding:"utf8",env:FIXTURE_ENV});
  expect(replay.status,replay.stderr).toBe(0);expect(JSON.parse(replay.stdout)).toMatchObject({status:"saved",commit:accepted});expect(JSON.parse(replay.stdout).cleanupWarning).toBeUndefined();
  expect(existsSync(path.join(f.records,".git/index.lock"))).toBe(false);
  putPrivate(f.records,"later.txt","ordinary later commit\n");const later=commitPrivate(f.records);expect(later).not.toBe(accepted);
  expect(replayPrivateRecordSave({productRoot:f.product,operationId:"cold-lock",manifestPath:f.manifestPath}).commit).toBe(accepted);expect(privateGit(f.records,["rev-parse","HEAD"])).toBe(later);
 }finally{f.cleanup();}
});
for(const state of ["foreign","live","replaced-during-cleanup"] as const) test(`accepted receipt stays authoritative while ${state} index lock remains untouched`,()=>{
 const f=privateRecordFixture();try {
  const crashed=crashSave(f,`lock-${state}`,"ref-accepted");expect(crashed.status,crashed.stderr).toBe(72);
  const lock=path.join(f.records,".git/index.lock"),original=JSON.parse(readFileSync(lock,"utf8")),accepted=privateGit(f.records,["rev-parse","HEAD"]);
  if(state === "foreign") original.operationId="foreign-operation";
  if(state === "live") original.pid=process.pid;
  writeFileSync(lock,JSON.stringify(original));const before=readFileSync(lock);
  if(state === "replaced-during-cleanup") {
   const changed=Buffer.from(JSON.stringify(original)), oldInode=statSync(lock,{bigint:true}).ino;
   expect(releaseAcceptedRecordWriteLock(f.product,`lock-${state}`,{onBeforeUnlink(){renameSync(lock,`${lock}.foreign-prior`);writeFileSync(lock,changed);}}).status).toBe("unavailable");
   expect(readFileSync(lock)).toEqual(changed);expect(statSync(lock,{bigint:true}).ino).not.toBe(oldInode);
  } else {
   const result=service(f).replay({productRoot:f.product,operationId:`lock-${state}`});expect(result).toMatchObject({status:"saved",commit:accepted,cleanupWarning:{status:"unavailable"}});
   expect(readFileSync(lock)).toEqual(before);
  }
  expect(privateGit(f.records,["rev-parse","HEAD"])).toBe(accepted);
 }finally{f.cleanup();}
});

test("accepted recovery reports unavailable for a dangling foreign index-lock symlink without following or removing it",()=>{
 const f=privateRecordFixture();try {
  const crashed=crashSave(f,"dangling-lock","ref-accepted");expect(crashed.status,crashed.stderr).toBe(72);
  const lock=path.join(f.records,".git/index.lock");renameSync(lock,`${lock}.fixture-prior`);symlinkSync("missing-fixture-lock-target",lock);
  const result=service(f).replay({productRoot:f.product,operationId:"dangling-lock"});expect(result).toMatchObject({status:"saved",cleanupWarning:{status:"unavailable"}});
  expect(lstatSync(lock).isSymbolicLink()).toBe(true);expect(readlinkSync(lock)).toBe("missing-fixture-lock-target");
 }finally{f.cleanup();}
});
