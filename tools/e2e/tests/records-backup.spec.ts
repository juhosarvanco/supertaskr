import {expect,test} from "@playwright/test";
import {chmodSync,cpSync,existsSync,lstatSync,readFileSync,renameSync,symlinkSync,unlinkSync,writeFileSync} from "node:fs";
import {execFileSync} from "node:child_process";
import path from "node:path";
import {capturePrivateBackupSource,exportPrivateBackup,inspectPrivateBackup,PRIVATE_BACKUP_LIMITS,restorePrivateBackup} from "../scripts/records-backup.mjs";
import {operationDigest} from "../scripts/operation-record.mjs";
import {createPrivateRecordService} from "../scripts/records-save.mjs";
import {GENERIC_RECORD_PROFILE,ordinaryRecordTextPath} from "../scripts/records-validation.mjs";
import {INDEX_RULING} from "../scripts/docs-scan.mjs";
import {loadInstalledRecordTool} from "../scripts/records-check.mjs";
import {readAcceptedOperation} from "../scripts/durable-operation.mjs";
import {FIXTURE_ENV,privateRecordFixture,privateGit,putPrivate,commitPrivate} from "./private-record-fixture";
const edit=(text:string)=>[{operation:"edit",path:"docs/rooms/note.md",type:"blob",mode:"100644",bytes:Buffer.from(text)}];
test("backup source freezes the actual accepted revision after later saves and has no PRODUCT or private effects",()=>{
 const f=privateRecordFixture();try{
  const api=createPrivateRecordService({profile:GENERIC_RECORD_PROFILE,tool:loadInstalledRecordTool(f.manifestPath)});
  const first=api.save({...f.options,operationId:"backup-first"},edit("# First saved note\n"));
  const later=api.save({...f.options,recordsRevision:first.commit,operationId:"backup-later"},edit("# Later saved note\n"));
  const pindex=readFileSync(path.join(f.product,".git/index")),rindex=readFileSync(path.join(f.records,".git/index"));
  const pref=privateGit(f.product,["for-each-ref","--format=%(refname) %(objectname)"]),rref=privateGit(f.records,["for-each-ref","--format=%(refname) %(objectname)"]);
  const rec=JSON.stringify(readAcceptedOperation(f.product,"backup-first"));
  const plan=capturePrivateBackupSource({productRoot:f.product,operationId:"backup-first",manifestPath:f.manifestPath});
  expect(plan.save.commit).toBe(first.commit);expect(plan.save.commit).not.toBe(later.commit);expect(plan.save.tree).toBe(privateGit(f.records,["rev-parse",`${first.commit}^{tree}`]));
  expect(plan.paths).toContain("workspace-association.json");expect(plan.paths).toContain("docs/INDEX.md");expect(plan.uncommitted).toBe("excluded");expect(Object.isFrozen(plan.save)).toBe(true);
  expect(privateGit(f.records,["rev-parse","HEAD"])).toBe(later.commit);expect(readFileSync(path.join(f.product,".git/index"))).toEqual(pindex);expect(readFileSync(path.join(f.records,".git/index"))).toEqual(rindex);
  expect(privateGit(f.product,["for-each-ref","--format=%(refname) %(objectname)"])).toBe(pref);expect(privateGit(f.records,["for-each-ref","--format=%(refname) %(objectname)"])).toBe(rref);
  expect(JSON.stringify(readAcceptedOperation(f.product,"backup-first"))).toBe(rec);
 }finally{f.cleanup();}
});
test("portable export restores the original accepted save and exact independent history after its original home disappears",()=>{
 const f=privateRecordFixture();try{
  putPrivate(f.records,"docs/rooms/old.md","Historical retained note\n");const historical=commitPrivate(f.records);
  unlinkSync(path.join(f.records,"docs/rooms/old.md"));putPrivate(f.records,"docs/design/script.js","private retained design source\n");chmodSync(path.join(f.records,"docs/design/script.js"),0o755);
  f.options.recordsRevision=commitPrivate(f.records);
  const api=createPrivateRecordService({profile:GENERIC_RECORD_PROFILE,tool:loadInstalledRecordTool(f.manifestPath)});
  const saved=api.save({...f.options,operationId:"portable-original"},edit("# Saved portable note\n"));
  api.save({...f.options,recordsRevision:saved.commit,operationId:"portable-later"},edit("# Later local note\n"));
  putPrivate(f.records,"docs/rooms/uncommitted.md","Uncommitted excluded bytes\n");
  const extra=privateGit(f.records,["hash-object","-w","--stdin"],"Unreachable private canary excluded from export\n");
  const pindex=readFileSync(path.join(f.product,".git/index")),rindex=readFileSync(path.join(f.records,".git/index")),pref=privateGit(f.product,["for-each-ref","--format=%(refname) %(objectname)"]),rref=privateGit(f.records,["for-each-ref","--format=%(refname) %(objectname)"]);
  const source=capturePrivateBackupSource({productRoot:f.product,operationId:"portable-original",manifestPath:f.manifestPath});
  const file=path.join(f.dir,"private-backup.json"),exported=exportPrivateBackup(source,{file});
  expect(exported).toMatchObject({status:"exported",commit:saved.commit,uncommitted:"excluded"});expect(lstatSync(file).mode&0o777).toBe(0o600);
  expect(exportPrivateBackup(source,{file})).toMatchObject({status:"available",commit:saved.commit});
  expect(readFileSync(file,"utf8")).not.toContain(f.records);expect(readFileSync(file,"utf8")).not.toContain(f.product);
  const inspected=inspectPrivateBackup(file);expect(inspected.commit).toBe(saved.commit);expect(inspected.paths).toContain("docs/rooms/old.md");
  expect(readFileSync(path.join(f.product,".git/index"))).toEqual(pindex);expect(readFileSync(path.join(f.records,".git/index"))).toEqual(rindex);
  expect(privateGit(f.product,["for-each-ref","--format=%(refname) %(objectname)"])).toBe(pref);expect(privateGit(f.records,["for-each-ref","--format=%(refname) %(objectname)"])).toBe(rref);
  renameSync(f.records,`${f.records}-retired`);
  const restored=restorePrivateBackup({file,directory:path.join(f.dir,"restored-private")});
  expect(restored).toMatchObject({status:"restored",commit:saved.commit,tree:saved.tree,binding:"not-installed",authority:"not-imported"});
  expect(privateGit(restored.directory,["rev-parse","HEAD"])).toBe(saved.commit);expect(privateGit(restored.directory,["status","--porcelain"])).toBe("");
  expect(readFileSync(path.join(restored.directory,"docs/rooms/note.md"),"utf8")).toBe("# Saved portable note\n");
  expect(lstatSync(path.join(restored.directory,"docs/design/script.js")).mode&0o111).not.toBe(0);expect(privateGit(restored.directory,["ls-tree","HEAD","docs/design/script.js"])).toMatch(/^100755 blob/);
  expect(privateGit(restored.directory,["show",`${historical}:docs/rooms/old.md`])).toBe("Historical retained note");
  expect(privateGit(restored.directory,["remote"])).toBe("");expect(existsSync(path.join(restored.directory,".supertaskr"))).toBe(false);
  expect(existsSync(path.join(restored.directory,"docs/rooms/uncommitted.md"))).toBe(false);expect(existsSync(path.join(restored.directory,".git/objects/info/alternates"))).toBe(false);
  expect(()=>privateGit(restored.directory,["cat-file","-t",extra])).toThrow();
  expect(privateGit(f.product,["for-each-ref","--format=%(refname) %(objectname)"])).toBe(pref);expect(readFileSync(path.join(f.product,".git/index"))).toEqual(pindex);
 }finally{f.cleanup();}
});
test("archive corruption, an extra unreachable object and an existing restore target refuse without selected effects",()=>{
 const f=privateRecordFixture();try{
  const api=createPrivateRecordService({profile:GENERIC_RECORD_PROFILE,tool:loadInstalledRecordTool(f.manifestPath)}),saved=api.save({...f.options,operationId:"archive-invalid"},edit("# Accepted note\n"));
  const source=capturePrivateBackupSource({productRoot:f.product,operationId:"archive-invalid",manifestPath:f.manifestPath}),file=path.join(f.dir,"archive.json");exportPrivateBackup(source,{file});
  const archive=JSON.parse(readFileSync(file,"utf8")),bad=path.join(f.dir,"bad.json"),destination=path.join(f.dir,"must-stay-absent");
  writeFileSync(bad,JSON.stringify({...archive,historyDigest:"sha256:"+"f".repeat(64)}));
  expect(()=>restorePrivateBackup({file:bad,directory:destination})).toThrow(/private-backup-artifact-digest/);expect(existsSync(destination)).toBe(false);
  const extra=privateGit(f.records,["hash-object","-w","--stdin"],"Unreachable object not in authorized save\n");
  const pack=execFileSync("git",["--no-replace-objects","-C",f.records,"pack-objects","--stdout","--revs"],{input:`${saved.commit}\n${extra}\n`,env:FIXTURE_ENV}).toString("base64");
  const {digest:ignored,...body}=archive;void ignored;const extraBody={...body,packBase64:pack,packDigest:operationDigest(pack)};writeFileSync(bad,JSON.stringify({...extraBody,digest:operationDigest(extraBody)}));
  expect(()=>restorePrivateBackup({file:bad,directory:destination})).toThrow(/private-backup-artifact-history/);expect(existsSync(destination)).toBe(false);
  putPrivate(destination,"owner.txt","Existing restore owner canary\n");
  expect(()=>restorePrivateBackup({file,directory:destination})).toThrow(/private-backup-restore-exists/);expect(readFileSync(path.join(destination,"owner.txt"),"utf8")).toBe("Existing restore owner canary\n");
  expect(privateGit(f.records,["rev-parse","HEAD"])).toBe(saved.commit);
 }finally{f.cleanup();}
});
test("local export refuses linked or foreign destinations and never publishes inside a PRODUCT repository",()=>{
 const f=privateRecordFixture();try{
  const api=createPrivateRecordService({profile:GENERIC_RECORD_PROFILE,tool:loadInstalledRecordTool(f.manifestPath)});api.save({...f.options,operationId:"export-routing"},edit("# Accepted note\n"));
  const source=capturePrivateBackupSource({productRoot:f.product,operationId:"export-routing",manifestPath:f.manifestPath}),canary=path.join(f.dir,"foreign.txt"),linked=path.join(f.dir,"linked.json");
  writeFileSync(canary,"Foreign export owner canary\n");symlinkSync(canary,linked);
  expect(()=>exportPrivateBackup(source,{file:linked})).toThrow(/private-backup-artifact-file/);expect(()=>exportPrivateBackup(source,{file:canary})).toThrow(/private-backup-destination-exists/);
  expect(readFileSync(canary,"utf8")).toBe("Foreign export owner canary\n");
  const inProduct=path.join(f.product,"private-backup.json");expect(()=>exportPrivateBackup(source,{file:inProduct})).toThrow(/PROJECT_INIT_ROOT|PROJECT_INIT_PARENT_REPOSITORY/);expect(existsSync(inProduct)).toBe(false);
  expect(()=>exportPrivateBackup(structuredClone(source),{file:path.join(f.dir,"forged.json")})).toThrow(/private-backup-source-required/);
 }finally{f.cleanup();}
});
test("a highly compressible oversized historical asset refuses source qualification before export or restore effects",()=>{
 const f=privateRecordFixture();try{
  const large="docs/design/oversized.txt";putPrivate(f.records,large,Buffer.alloc(PRIVATE_BACKUP_LIMITS.blobBytes+1,65));commitPrivate(f.records);
  unlinkSync(path.join(f.records,large));f.options.recordsRevision=commitPrivate(f.records);
  const api=createPrivateRecordService({profile:GENERIC_RECORD_PROFILE,tool:loadInstalledRecordTool(f.manifestPath)}),saved=api.save({...f.options,operationId:"oversized-history"},edit("# Current saved note\n"));
  const before=JSON.stringify(readAcceptedOperation(f.product,"oversized-history"));
  expect(()=>capturePrivateBackupSource({productRoot:f.product,operationId:"oversized-history",manifestPath:f.manifestPath})).toThrow(/private-backup-expanded-limit/);
  expect(privateGit(f.records,["rev-parse","HEAD"])).toBe(saved.commit);expect(JSON.stringify(readAcceptedOperation(f.product,"oversized-history"))).toBe(before);
  expect(existsSync(path.join(f.dir,"archive.json"))).toBe(false);expect(existsSync(path.join(f.dir,"restore"))).toBe(false);
 }finally{f.cleanup();}
});
test("a same-history replacement PRODUCT cannot turn a copied old save receipt into new backup authority",()=>{
 const f=privateRecordFixture();try{
  const api=createPrivateRecordService({profile:GENERIC_RECORD_PROFILE,tool:loadInstalledRecordTool(f.manifestPath)}),saved=api.save({...f.options,operationId:"backup-product-origin"},edit("# Original saved note\n"));
  expect(capturePrivateBackupSource({productRoot:f.product,operationId:"backup-product-origin",manifestPath:f.manifestPath}).save.commit).toBe(saved.commit);
  const original=`${f.product}-retired`,revision=privateGit(f.product,["rev-parse","HEAD"]);renameSync(f.product,original);cpSync(original,f.product,{recursive:true});
  expect(privateGit(f.product,["rev-parse","HEAD"])).toBe(revision);
  const before=JSON.stringify(readAcceptedOperation(f.product,"backup-product-origin"));
  expect(()=>capturePrivateBackupSource({productRoot:f.product,operationId:"backup-product-origin",manifestPath:f.manifestPath})).toThrow(/private-backup-original-product-changed/);
  expect(privateGit(f.records,["rev-parse","HEAD"])).toBe(saved.commit);expect(JSON.stringify(readAcceptedOperation(f.product,"backup-product-origin"))).toBe(before);
 }finally{f.cleanup();}
});
test("a clean saved tree cannot conceal runtime or PRODUCT files in its reachable private history",()=>{
 for(const forbidden of ["source.py",".supertaskr/runs/secret.json"]){const f=privateRecordFixture();try{
  putPrivate(f.records,forbidden,"historical excluded bytes\n");privateGit(f.records,["add","-f","--",forbidden]);privateGit(f.records,["commit","-qm","Planted forbidden historical input"]);
  unlinkSync(path.join(f.records,forbidden));privateGit(f.records,["add","-u"]);privateGit(f.records,["commit","-qm","Current tree no longer carries forbidden input"]);
  f.options.recordsRevision=privateGit(f.records,["rev-parse","HEAD"]);
  const api=createPrivateRecordService({profile:GENERIC_RECORD_PROFILE,tool:loadInstalledRecordTool(f.manifestPath)});
  const saved=api.save({...f.options,operationId:"backup-history"},edit("# Accepted clean current note\n"));
  const before=JSON.stringify(readAcceptedOperation(f.product,"backup-history"));
  expect(privateGit(f.records,["ls-tree","-r","--name-only",saved.commit])).not.toContain(forbidden);
  expect(()=>capturePrivateBackupSource({productRoot:f.product,operationId:"backup-history",manifestPath:f.manifestPath})).toThrow(/private-backup-nonprivate-history/);
  expect(JSON.stringify(readAcceptedOperation(f.product,"backup-history"))).toBe(before);expect(privateGit(f.records,["rev-parse","HEAD"])).toBe(saved.commit);
 }finally{f.cleanup();}}
});
test("read-only backup keeps frozen rulings, rejected cards, readings and private design/capture assets without widening ordinary editing",()=>{
 const f=privateRecordFixture();try{
  const retained=[INDEX_RULING.file,"docs/conventions/README.md","docs/tasks/rejected/T-001-old.md","docs/checkpoints/meters.jsonl","docs/design/handoff/private app.dc.html","docs/design/handoff/support.js","docs/research/captures/planner.jsonl","docs/research/captures/help.txt"];
  expect(ordinaryRecordTextPath(INDEX_RULING.file)).toBe(false);
  for(const file of retained)putPrivate(f.records,file,`Retained private bytes: ${file}\n`);
  f.options.recordsRevision=commitPrivate(f.records);
  const api=createPrivateRecordService({profile:GENERIC_RECORD_PROFILE,tool:loadInstalledRecordTool(f.manifestPath)});
  api.save({...f.options,operationId:"backup-read-corpus"},edit("# Current accepted note\n"));
  const plan=capturePrivateBackupSource({productRoot:f.product,operationId:"backup-read-corpus",manifestPath:f.manifestPath});
  for(const file of retained)expect(plan.paths).toContain(file);
  expect(ordinaryRecordTextPath(INDEX_RULING.file)).toBe(false);expect(ordinaryRecordTextPath(retained[5]!)).toBe(false);
 }finally{f.cleanup();}
});
