import {spawnSync} from "node:child_process";
import {chmodSync,existsSync,mkdirSync,readFileSync,renameSync,statSync,writeFileSync} from "node:fs";
import path from "node:path";
import {expect,test} from "@playwright/test";
import {parse} from "yaml";
import {backupPrivateRecordSave,replayPrivateBackup} from "../scripts/records-backup-operation.mjs";
import {inspectPrivateBackup,restorePrivateBackup} from "../scripts/records-backup.mjs";
import {acceptedOperationPath,readAcceptedOperation} from "../scripts/durable-operation.mjs";
import {operationWork,validOperationRecord} from "../scripts/operation-record.mjs";
import {allRecords,readRecord,readReservation} from "../scripts/run-record.mjs";
import {createPrivateRecordService} from "../scripts/records-save.mjs";
import {GENERIC_RECORD_PROFILE} from "../scripts/records-validation.mjs";
import {loadInstalledRecordTool} from "../scripts/records-check.mjs";
import {commitPrivate,fixtureProjectSettings,FIXTURE_ENV,privateGit,privateRecordFixture,putPrivate} from "./private-record-fixture";
const edit=(text:string)=>[{operation:"edit",path:"docs/rooms/note.md",type:"blob",mode:"100644",bytes:Buffer.from(text)}];
function fixture(calibrateProduct=false){
 const f=privateRecordFixture();
 if(calibrateProduct){
  const settings=parse(fixtureProjectSettings(f));
  putPrivate(f.product,"checks/test_backup.py","from pathlib import Path\nimport unittest\np=Path('.supertaskr/product-effect-counter')\np.write_text(str(int(p.read_text())+1) if p.exists() else '1')\nclass BackupProductSentinel(unittest.TestCase):\n    def test_actual(self): self.assertEqual(2+2,4)\nif __name__=='__main__': unittest.main(verbosity=2)\n");
  settings.languages=["python"];settings.suites=[{id:"python",cwd:".",argv:["python3","-m","unittest","discover","-s","checks","-v"],sentinel:"checks/test_backup.py",family:"unittest",solo:false,why:"Actual calibrated PRODUCT execution sentinel"}];
  settings.smoke={cwd:".",argv:["python3","checks/test_backup.py"],sentinel:"checks/test_backup.py"};putPrivate(f.product,"supertaskr.yaml",JSON.stringify(settings));f.options.productRevision=commitPrivate(f.product);
  for(const argv of [settings.suites[0].argv,settings.smoke.argv]){const run=spawnSync(argv[0],argv.slice(1),{cwd:f.product,env:{...FIXTURE_ENV,PYTHONDONTWRITEBYTECODE:"1"},encoding:"utf8"});expect(run.status,run.stderr).toBe(0);}
  expect(readFileSync(path.join(f.product,".supertaskr/product-effect-counter"),"utf8")).toBe("2");
 }
 const api=createPrivateRecordService({profile:GENERIC_RECORD_PROFILE,tool:loadInstalledRecordTool(f.manifestPath)}),saved=api.save({...f.options,operationId:"receiver-save"},edit("# Original receiver save\n"));
 const receiver=path.join(f.dir,"private-archive-receiver");mkdirSync(receiver,{mode:0o700});chmodSync(receiver,0o700);
 const config=path.join(f.product,".supertaskr/private-backup.json"),configure=()=>writeFileSync(config,JSON.stringify({version:1,projectId:"external-python",receiver:{kind:"local-archive-directory",directory:receiver}}));
 return {...f,api,saved,receiver,config,configure,input:{operationId:"optional-backup",saveOperationId:"receiver-save"},installation:{manifestPath:f.manifestPath}};
}
test("unconfigured backup stays local-only, then the existing private receiver gets the exact old accepted revision without a new source commit",()=>{
 const f=fixture(true);try{
  expect(backupPrivateRecordSave(f.product,f.input,f.installation)).toMatchObject({status:"not-configured",localSave:{commit:f.saved.commit}});expect(readAcceptedOperation(f.product,f.input.operationId)).toBeNull();
  const later=f.api.save({...f.options,recordsRevision:f.saved.commit,operationId:"receiver-later"},edit("# Later source save\n"));f.configure();
  const pindex=readFileSync(path.join(f.product,".git/index")),rindex=readFileSync(path.join(f.records,".git/index")),pref=privateGit(f.product,["for-each-ref","--format=%(refname) %(objectname)"]),rref=privateGit(f.records,["for-each-ref","--format=%(refname) %(objectname)"]);
  const pobjects=privateGit(f.product,["cat-file","--batch-all-objects","--batch-check=%(objectname)"]),result=backupPrivateRecordSave(f.product,f.input,f.installation),rec=readAcceptedOperation(f.product,f.input.operationId);
  expect(result).toMatchObject({status:"backed-up",commit:f.saved.commit,attribution:"exact"});expect(result.commit).not.toBe(later.commit);expect(validOperationRecord(rec)).toBe(true);expect(rec.state).toBe("finished");
  expect(allRecords(f.product)).toContainEqual(rec);expect(()=>readRecord(f.product,rec.attempt)).toThrow(/RECORD_OPERATION/);expect(readReservation(f.product,f.receiver)).toBeNull();
  expect(inspectPrivateBackup(result.file).commit).toBe(f.saved.commit);const inode=statSync(result.file,{bigint:true}).ino,record=readFileSync(acceptedOperationPath(f.product,f.input.operationId));
  writeFileSync(f.config,"Current successor configuration is intentionally invalid\n");
  expect(replayPrivateBackup(f.product,f.input.operationId,{manifestPath:path.join(f.dir,"missing-tool")})).toEqual(result);expect(statSync(result.file,{bigint:true}).ino).toBe(inode);expect(readFileSync(acceptedOperationPath(f.product,f.input.operationId))).toEqual(record);
  expect(readFileSync(path.join(f.product,".git/index"))).toEqual(pindex);expect(readFileSync(path.join(f.records,".git/index"))).toEqual(rindex);
  expect(privateGit(f.product,["for-each-ref","--format=%(refname) %(objectname)"])).toBe(pref);expect(privateGit(f.records,["for-each-ref","--format=%(refname) %(objectname)"])).toBe(rref);expect(privateGit(f.product,["cat-file","--batch-all-objects","--batch-check=%(objectname)"])).toBe(pobjects);
  expect(readFileSync(path.join(f.product,".supertaskr/product-effect-counter"),"utf8")).toBe("2");
  renameSync(f.records,`${f.records}-retired`);const restored=restorePrivateBackup({file:result.file,directory:path.join(f.dir,"restored-receiver")});expect(restored.commit).toBe(f.saved.commit);expect(readFileSync(path.join(restored.directory,"docs/rooms/note.md"),"utf8")).toBe("# Original receiver save\n");
 }finally{f.cleanup();}
});
for(const boundary of ["captured","temporary-written","file-accepted","temporary-retired"])test(`cold backup replay finishes only missing bookkeeping/effects after ${boundary}`,()=>{
 const f=fixture();try{
  f.configure();const module=new URL("../scripts/records-backup-operation.mjs",import.meta.url).href;
  const child=spawnSync(process.execPath,["--input-type=module","-e",`import {backupPrivateRecordSave} from ${JSON.stringify(module)};backupPrivateRecordSave(${JSON.stringify(f.product)},${JSON.stringify(f.input)},{manifestPath:${JSON.stringify(f.manifestPath)},onBoundary(at){if(at===${JSON.stringify(boundary)})process.exit(76);}});`],{env:FIXTURE_ENV,encoding:"utf8"});expect(child.status,child.stderr).toBe(76);
  const original=readAcceptedOperation(f.product,f.input.operationId),request=JSON.stringify(original.operation.request),file=path.join(f.receiver,`${operationWork(f.input.operationId)}.private-backup.json`),inode=existsSync(file)?statSync(file,{bigint:true}).ino:null;
  const accepted=boundary==="file-accepted"||boundary==="temporary-retired",manifest=accepted?path.join(f.dir,"missing-successor-tool"):f.manifestPath;
  if(accepted)writeFileSync(f.config,"Invalid successor policy must not obscure original acceptance\n");
  const result=spawnSync(process.execPath,["--input-type=module","-e",`import {replayPrivateBackup} from ${JSON.stringify(module)};process.stdout.write(JSON.stringify(replayPrivateBackup(${JSON.stringify(f.product)},${JSON.stringify(f.input.operationId)},{manifestPath:${JSON.stringify(manifest)}})));`],{env:FIXTURE_ENV,encoding:"utf8"});expect(result.status,result.stderr).toBe(0);expect(JSON.parse(result.stdout)).toMatchObject({status:"backed-up",commit:f.saved.commit});
  const rec=readAcceptedOperation(f.product,f.input.operationId);expect(JSON.stringify(rec.operation.request)).toBe(request);expect(rec.state).toBe("finished");expect(readReservation(f.product,f.receiver)).toBeNull();
  if(inode!==null)expect(statSync(file,{bigint:true}).ino).toBe(inode);expect(statSync(file).nlink).toBe(1);expect(inspectPrivateBackup(file).commit).toBe(f.saved.commit);
  expect(existsSync(`${file}.supertaskr-${rec.operation.request.token}.tmp`)).toBe(false);expect(privateGit(f.records,["rev-parse","HEAD"])).toBe(f.saved.commit);
 }finally{f.cleanup();}
});
test("changed current backup policy stops a pending publish, preserves local success, and only the original immutable request resumes",()=>{
 const f=fixture();try{
  f.configure();const original=readFileSync(f.config);let captured:any;
  expect(()=>backupPrivateRecordSave(f.product,f.input,{...f.installation,onBoundary(at,rec){if(at==="temporary-written"){captured=rec;writeFileSync(f.config,JSON.stringify({version:1,projectId:"another-project",receiver:{kind:"local-archive-directory",directory:f.receiver}}));}}})).toThrow(/private-backup-config-changed/);
  const file=path.join(f.receiver,`${operationWork(f.input.operationId)}.private-backup.json`);expect(existsSync(file)).toBe(false);expect(privateGit(f.records,["rev-parse","HEAD"])).toBe(f.saved.commit);
  expect(()=>backupPrivateRecordSave(f.product,{...f.input,saveOperationId:"changed-source"},f.installation)).toThrow(/private-backup-request-changed/);
  expect(JSON.stringify(readAcceptedOperation(f.product,f.input.operationId).operation.request)).toBe(JSON.stringify(captured.operation.request));
  writeFileSync(f.config,original);expect(replayPrivateBackup(f.product,f.input.operationId,f.installation)).toMatchObject({status:"backed-up",commit:f.saved.commit});
 }finally{f.cleanup();}
});
test("receiver conflict never overwrites its owner and a pending backup does not prevent a later ordinary private save",()=>{
 const f=fixture();try{
  f.configure();let foreign="";
  expect(()=>backupPrivateRecordSave(f.product,f.input,{...f.installation,onBoundary(at){if(at==="temporary-written"){foreign=path.join(f.receiver,`${operationWork(f.input.operationId)}.private-backup.json`);writeFileSync(foreign,"Foreign receiver owner bytes\n");}}})).toThrow();
  expect(()=>replayPrivateBackup(f.product,f.input.operationId,f.installation)).toThrow(/private-backup-receiver-conflicted/);expect(readFileSync(foreign,"utf8")).toBe("Foreign receiver owner bytes\n");
  const later=f.api.save({...f.options,recordsRevision:f.saved.commit,operationId:"later-after-backup-conflict"},edit("# Local save remains available\n"));expect(privateGit(f.records,["rev-parse","HEAD"])).toBe(later.commit);expect(readFileSync(foreign,"utf8")).toBe("Foreign receiver owner bytes\n");
 }finally{f.cleanup();}
});
test("nonprivate, unsupported and duplicate-key receiver configuration refuses before operation capture",()=>{
 const f=fixture();try{
  f.configure();chmodSync(f.receiver,0o755);expect(()=>backupPrivateRecordSave(f.product,f.input,f.installation)).toThrow(/private-backup-receiver-not-private/);chmodSync(f.receiver,0o700);
  writeFileSync(f.config,JSON.stringify({version:1,projectId:"external-python",receiver:{kind:"git",directory:f.receiver}}));expect(()=>backupPrivateRecordSave(f.product,f.input,f.installation)).toThrow(/private-backup-receiver-unsupported/);
  writeFileSync(f.config,'{"version":1,"projectId":"one","projectId":"two","receiver":{}}');expect(()=>backupPrivateRecordSave(f.product,f.input,f.installation)).toThrow(/private-backup-config-json/);
  expect(readAcceptedOperation(f.product,f.input.operationId)).toBeNull();expect(privateGit(f.records,["rev-parse","HEAD"])).toBe(f.saved.commit);expect(privateGit(f.product,["remote"])).toBe("");
 }finally{f.cleanup();}
});
test("a concurrent reentry cannot become a second backup owner or choose request-provided receiver policy",()=>{
 const f=fixture();try{
  f.configure();expect(()=>backupPrivateRecordSave(f.product,{...f.input,receiver:f.receiver} as any,f.installation)).toThrow(/private-backup-request/);expect(readAcceptedOperation(f.product,f.input.operationId)).toBeNull();let checked=false;
  const result=backupPrivateRecordSave(f.product,f.input,{...f.installation,onBoundary(at){if(at==="captured"){checked=true;expect(()=>replayPrivateBackup(f.product,f.input.operationId,f.installation)).toThrow(/private-backup-owner-live/);}}});
  expect(checked).toBe(true);expect(result).toMatchObject({status:"backed-up",commit:f.saved.commit});expect(readReservation(f.product,f.receiver)).toBeNull();
 }finally{f.cleanup();}
});
test("actual receiver write rejection preserves local success and the same operation retries without another source commit",()=>{
 test.skip(process.getuid?.()===0,"The actual filesystem rejection control requires a non-root process");
 const f=fixture();try{
  f.configure();chmodSync(f.receiver,0o500);
  expect(()=>backupPrivateRecordSave(f.product,f.input,f.installation)).toThrow(/EACCES/);expect(readAcceptedOperation(f.product,f.input.operationId).state).toBe("unknown");expect(privateGit(f.records,["rev-parse","HEAD"])).toBe(f.saved.commit);
  chmodSync(f.receiver,0o700);expect(replayPrivateBackup(f.product,f.input.operationId,f.installation)).toMatchObject({status:"backed-up",commit:f.saved.commit});expect(privateGit(f.records,["rev-parse","HEAD"])).toBe(f.saved.commit);
 }finally{chmodSync(f.receiver,0o700);f.cleanup();}
});
test("a replaced single-link temporary is preserved and only the exact original witness can resume",()=>{
 const f=fixture();try{
  f.configure();expect(()=>backupPrivateRecordSave(f.product,f.input,{...f.installation,onBoundary(at){if(at==="temporary-written")throw Error("ordinary temporary stop");}})).toThrow("ordinary temporary stop");
  const rec=readAcceptedOperation(f.product,f.input.operationId),file=path.join(f.receiver,`${operationWork(f.input.operationId)}.private-backup.json`),temporary=`${file}.supertaskr-${rec.operation.request.token}.tmp`,original=`${temporary}.original`,foreign=`${temporary}.foreign`;
  renameSync(temporary,original);writeFileSync(temporary,"Foreign replacement temporary owner\n");const inode=statSync(temporary,{bigint:true}).ino,request=JSON.stringify(rec.operation.request);
  expect(()=>replayPrivateBackup(f.product,f.input.operationId,f.installation)).toThrow(/private-backup-temporary-unavailable/);expect(readFileSync(temporary,"utf8")).toBe("Foreign replacement temporary owner\n");expect(statSync(temporary,{bigint:true}).ino).toBe(inode);
  expect(existsSync(file)).toBe(false);expect(privateGit(f.records,["rev-parse","HEAD"])).toBe(f.saved.commit);expect(JSON.stringify(readAcceptedOperation(f.product,f.input.operationId).operation.request)).toBe(request);
  renameSync(temporary,foreign);renameSync(original,temporary);expect(replayPrivateBackup(f.product,f.input.operationId,f.installation)).toMatchObject({status:"backed-up",commit:f.saved.commit});expect(readFileSync(foreign,"utf8")).toBe("Foreign replacement temporary owner\n");
 }finally{f.cleanup();}
});
test("an altered accepted artifact cannot become success from stored progress or overwrite its later owner",()=>{
 const f=fixture();try{
  f.configure();const result=backupPrivateRecordSave(f.product,f.input,f.installation),record=readFileSync(acceptedOperationPath(f.product,f.input.operationId));
  writeFileSync(result.file,"Later receiver owner bytes\n");const inode=statSync(result.file,{bigint:true}).ino;
  expect(()=>replayPrivateBackup(f.product,f.input.operationId,{manifestPath:path.join(f.dir,"missing-current-tool")})).toThrow(/private-backup-receiver-conflicted/);
  expect(readFileSync(result.file,"utf8")).toBe("Later receiver owner bytes\n");expect(statSync(result.file,{bigint:true}).ino).toBe(inode);expect(readFileSync(acceptedOperationPath(f.product,f.input.operationId))).toEqual(record);expect(privateGit(f.records,["rev-parse","HEAD"])).toBe(f.saved.commit);
 }finally{f.cleanup();}
});
