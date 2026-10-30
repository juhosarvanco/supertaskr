import {spawnSync} from "node:child_process";
import {chmodSync,mkdirSync,readFileSync,writeFileSync} from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {expect,test} from "@playwright/test";
import {executeRecordProtocol} from "../scripts/records-stdio.mjs";
import {loadInstalledRecordTool} from "../scripts/records-check.mjs";
import {createPrivateRecordService} from "../scripts/records-save.mjs";
import {GENERIC_RECORD_PROFILE} from "../scripts/records-validation.mjs";
import {readAcceptedOperation} from "../scripts/durable-operation.mjs";
import {privateRecordFixture,FIXTURE_ENV,privateGit} from "./private-record-fixture";

test("fixed backup protocol keeps local success separate and cold accepted replay precedes current TOOL/config",()=>{
 const f=privateRecordFixture();try{
  const api=createPrivateRecordService({profile:GENERIC_RECORD_PROFILE,tool:loadInstalledRecordTool(f.manifestPath)}),saved=api.save({...f.options,operationId:"protocol-backup-source"},[{operation:"edit",path:"docs/rooms/note.md",type:"blob",mode:"100644",bytes:Buffer.from("# Saved before optional backup\n")}]);
  const request={version:1,requestId:"backup-one",operation:"backup",productRoot:f.product,operationId:"protocol-backup",saveOperationId:"protocol-backup-source"},call=(q:any)=>executeRecordProtocol(q,{manifestPath:f.manifestPath});
  expect(call(request)).toMatchObject({ok:true,result:{status:"not-configured",localSave:{commit:saved.commit}}});
  const receiver=path.join(f.dir,"receiver");mkdirSync(receiver,{mode:0o700});chmodSync(receiver,0o700);const config=path.join(f.product,".supertaskr/private-backup.json");
  writeFileSync(config,JSON.stringify({version:1,projectId:"external-python",receiver:{kind:"local-archive-directory",directory:receiver}}));
  const backed=call(request);expect(backed).toMatchObject({ok:true,result:{status:"backed-up",commit:saved.commit}});
  if(!backed.ok)throw Error("expected backed up");
  expect(call({version:1,requestId:"discover-backups",operation:"backup-discover",productRoot:f.product})).toMatchObject({ok:true,result:{status:"backups",backups:[{operationId:request.operationId,saveOperationId:request.saveOperationId,state:"finished",historicalReceipt:backed.result}]}});
  const before=readFileSync(backed.result.file);writeFileSync(config,"invalid successor config\n");
  const replay={version:1,requestId:"cold-backup-replay",operation:"backup-replay",productRoot:f.product,operationId:request.operationId};
  const child=spawnSync(process.execPath,[fileURLToPath(new URL("../scripts/records-stdio.mjs",import.meta.url)),"--stdio"],{input:JSON.stringify(replay),encoding:"utf8",env:FIXTURE_ENV});
  expect(child.status,child.stderr).toBe(0);expect(JSON.parse(child.stdout)).toMatchObject({ok:true,result:backed.result});expect(readFileSync(backed.result.file)).toEqual(before);expect(privateGit(f.records,["rev-parse","HEAD"])).toBe(saved.commit);
 }finally{f.cleanup();}
});

test("backup request fields cannot choose a receiver and a zero-effect refusal invents no retry identity",()=>{
 const f=privateRecordFixture();try{
  const request={version:1,requestId:"backup-invalid",operation:"backup",productRoot:f.product,operationId:"backup-op",saveOperationId:"no-save"};
  for(const field of ["receiver","file","manifestPath","program","settings","profile","productRevision"])expect(()=>executeRecordProtocol({...request,[field]:"untrusted"},{manifestPath:f.manifestPath})).toThrow(/records-protocol-request/);
  for(const productRoot of ["","relative-project","bad\0root"])expect(()=>executeRecordProtocol({...request,productRoot},{manifestPath:f.manifestPath})).toThrow(/records-protocol-request/);
  const failed=executeRecordProtocol(request,{manifestPath:f.manifestPath});expect(failed).toMatchObject({ok:false,error:{state:"refused",operationId:"backup-op"}});expect(failed).not.toHaveProperty("error.nextOperationId");expect(readAcceptedOperation(f.product,"backup-op")).toBeNull();
 }finally{f.cleanup();}
});
test("cold backup discovery retains a rejected pending receiver under the original operation identifier",()=>{
 test.skip(process.getuid?.()===0,"The actual filesystem rejection control requires a non-root process");
 const f=privateRecordFixture(),receiver=path.join(f.dir,"receiver");
 try{
  const api=createPrivateRecordService({profile:GENERIC_RECORD_PROFILE,tool:loadInstalledRecordTool(f.manifestPath)}),saved=api.save({...f.options,operationId:"pending-backup-source"},[{operation:"edit",path:"docs/rooms/note.md",type:"blob",mode:"100644",bytes:Buffer.from("# Saved before rejected receiver\n")}]);
  mkdirSync(receiver,{mode:0o700});writeFileSync(path.join(f.product,".supertaskr/private-backup.json"),JSON.stringify({version:1,projectId:"external-python",receiver:{kind:"local-archive-directory",directory:receiver}}));chmodSync(receiver,0o500);
  const call=(q:any)=>executeRecordProtocol(q,{manifestPath:f.manifestPath}),request={version:1,requestId:"pending-backup",operation:"backup",productRoot:f.product,operationId:"pending-backup-op",saveOperationId:"pending-backup-source"};
  const result=call(request);expect(result).toMatchObject({ok:false,error:{state:"unknown",operationId:request.operationId}});expect(result).not.toHaveProperty("error.nextOperationId");
  const query={version:1,requestId:"discover-pending",operation:"backup-discover",productRoot:f.product},child=spawnSync(process.execPath,[fileURLToPath(new URL("../scripts/records-stdio.mjs",import.meta.url)),"--stdio"],{input:JSON.stringify(query),encoding:"utf8",env:FIXTURE_ENV});
  expect(child.status,child.stderr).toBe(0);expect(JSON.parse(child.stdout)).toMatchObject({ok:true,result:{backups:[{operationId:request.operationId,saveOperationId:request.saveOperationId,state:"unknown"}]}});
  chmodSync(receiver,0o700);
  const replay=call({version:1,requestId:"resume-pending",operation:"backup-replay",productRoot:f.product,operationId:request.operationId});expect(replay).toMatchObject({ok:true,result:{status:"backed-up",commit:saved.commit}});expect(privateGit(f.records,["rev-parse","HEAD"])).toBe(saved.commit);
 }finally{try{chmodSync(receiver,0o700);}catch{}f.cleanup();}
});
