import {spawnSync} from "node:child_process";
import {cpSync,readFileSync,renameSync,writeFileSync} from "node:fs";
import path from "node:path";
import {expect,test} from "@playwright/test";
import {stopUnmaterializedRecordWrite} from "../scripts/record-write.mjs";
import {acceptedOperationPath,readAcceptedOperation,replayAcceptedOperation} from "../scripts/durable-operation.mjs";
import {withNativeDurabilityObserver} from "../scripts/native-codex.mjs";
import {executeRecordProtocol} from "../scripts/records-stdio.mjs";
import {validOperationRecord} from "../scripts/operation-record.mjs";
import {defaultRunIo,readReservation} from "../scripts/run-record.mjs";
import {createPrivateRecordService} from "../scripts/records-save.mjs";
import {loadInstalledRecordTool} from "../scripts/records-check.mjs";
import {GENERIC_RECORD_PROFILE} from "../scripts/records-validation.mjs";
import {commitPrivate,FIXTURE_ENV,privateGit,privateRecordFixture,putPrivate} from "./private-record-fixture";
const SUBJECT=new URL("../scripts/records-save.mjs",import.meta.url).href,FILE="docs/rooms/note.md",ID="stop-captured";
function api(f:ReturnType<typeof privateRecordFixture>) {return createPrivateRecordService({profile:GENERIC_RECORD_PROFILE,tool:loadInstalledRecordTool(f.manifestPath)});}
function crash(f:ReturnType<typeof privateRecordFixture>,boundary="intent-persisted") {
 const child=spawnSync(process.execPath,["--input-type=module","-e",`
  import {createPrivateRecordService} from ${JSON.stringify(SUBJECT)};
  import {loadInstalledRecordTool} from ${JSON.stringify(new URL("../scripts/records-check.mjs",import.meta.url).href)};
  const api=createPrivateRecordService({profile:${JSON.stringify(GENERIC_RECORD_PROFILE)},tool:loadInstalledRecordTool(${JSON.stringify(f.manifestPath)})});
  const read=api.read(${JSON.stringify({productRoot:f.product,productRevision:f.options.productRevision})},${JSON.stringify(FILE)});
  api.save({...${JSON.stringify(f.options)},operationId:${JSON.stringify(ID)},expectedContext:read.expectedContext,expectedFiles:[{path:${JSON.stringify(FILE)},...read.observedFile}]},
   [{operation:'edit',path:${JSON.stringify(FILE)},type:'blob',mode:'100644',bytes:Buffer.from('Exact original captured note\\n')}],{onBoundary(at){if(at===${JSON.stringify(boundary)})process.exit(72);}});
 `],{encoding:"utf8",env:FIXTURE_ENV});expect(child.status,child.stderr).toBe(72);
}
const stop=(f:ReturnType<typeof privateRecordFixture>)=>stopUnmaterializedRecordWrite(f.product,ID,{payloadKind:"ordinary-record-save"});
test("known unaccepted object/intent work can stop after original product source advances while preserving objects and immutable intent",()=>{
 const f=privateRecordFixture();try {
  crash(f);const old=readAcceptedOperation(f.product,ID),beforeObjects=privateGit(f.records,["cat-file","--batch-all-objects","--batch-check"]);
  putPrivate(f.product,"hello.py","print('legitimate later source')\n");f.options.productRevision=commitPrivate(f.product);
  const beforeFile=readFileSync(path.join(f.records,FILE)),beforeIndex=readFileSync(path.join(f.records,".git/index"));
  const result=stop(f);expect(result.status).toBe("stopped");const rec=readAcceptedOperation(f.product,ID);expect(validOperationRecord(rec)).toBe(true);
  expect(rec.operation.request).toEqual(old.operation.request);expect(rec.operation.intent).toEqual(old.operation.intent);
  expect(privateGit(f.records,["cat-file","--batch-all-objects","--batch-check"])).toBe(beforeObjects);
  expect(readFileSync(path.join(f.records,FILE))).toEqual(beforeFile);expect(readFileSync(path.join(f.records,".git/index"))).toEqual(beforeIndex);
  expect(readReservation(f.product,f.records)).toBeNull();expect(stop(f)).toEqual(result);
  expect(replayAcceptedOperation(f.product,ID,{authorize(){throw Error("never relaunch stopped");}})).toEqual(result);
  const next=api(f).save({...f.options,operationId:"new-current-source"},[{operation:"edit",path:FILE,type:"blob",mode:"100644",bytes:Buffer.from("New source exact note\n")}]);
  expect(next.status).toBe("saved");expect(replayAcceptedOperation(f.product,ID,{authorize(){return true;}})).toEqual(result);
 }finally{f.cleanup();}
});
for(const change of ["ancestor-tip","correlation","consumer","live","index","preimage","origin"] as const) test(`unmaterialized disposition refuses ${change} ambiguity and preserves the original hold`,()=>{
 const f=privateRecordFixture();try{
  crash(f);const rec=readAcceptedOperation(f.product,ID),record=acceptedOperationPath(f.product,ID),file=path.join(f.records,FILE);
  if(change === "ancestor-tip") privateGit(f.records,["update-ref","refs/heads/main",rec.operation.intent.commit]);
  if(change === "correlation") privateGit(f.records,["update-ref",rec.operation.intent.correlationRef,f.options.recordsRevision]);
  if(change === "consumer") {rec.events.push({at:new Date().toISOString(),op:"consumer-prepare"});writeFileSync(record,JSON.stringify(rec));}
  if(change === "live") {rec.operation.owner={pid:process.pid,identity:defaultRunIo().identity(process.pid)!,token:"live"};writeFileSync(record,JSON.stringify(rec));}
  if(change === "index") {putPrivate(f.records,"other-note","unrelated staged bytes\n");privateGit(f.records,["add","other-note"]);}
  if(change === "preimage") writeFileSync(file,"foreign changed bytes\n");
  if(change === "origin") {const docs=path.join(f.records,"docs"),old=path.join(f.records,"old-docs");renameSync(docs,old);cpSync(old,docs,{recursive:true});}
  const held=readReservation(f.product,f.records),beforeRef=privateGit(f.records,["rev-parse","HEAD"]),beforeRecord=readFileSync(record),beforeIndex=readFileSync(path.join(f.records,".git/index")),beforeFile=readFileSync(file);
  expect(()=>stop(f)).toThrow(/DISPOSITION_UNAVAILABLE|disposition-unavailable/);
  expect(readReservation(f.product,f.records)).toEqual(held);expect(readFileSync(record)).toEqual(beforeRecord);expect(privateGit(f.records,["rev-parse","HEAD"])).toBe(beforeRef);
  expect(readFileSync(path.join(f.records,".git/index"))).toEqual(beforeIndex);expect(readFileSync(file)).toEqual(beforeFile);
 }finally{f.cleanup();}
});

test("failed stop-evidence persistence keeps the original hold and strict terminal evidence refuses inconsistent fields",()=>{
 const f=privateRecordFixture();try {
  crash(f);const file=acceptedOperationPath(f.product,ID),before=readFileSync(file),held=readReservation(f.product,f.records);
  expect(()=>withNativeDurabilityObserver((event)=>{if(event.stage === "before-rename" && event.file === file) throw Error("stop evidence unavailable");},()=>stop(f))).toThrow(/stop evidence unavailable/);
  expect(readFileSync(file)).toEqual(before);expect(readReservation(f.product,f.records)).toEqual(held);
  const result=stop(f);expect(result.status).toBe("stopped");const rec=readAcceptedOperation(f.product,ID);
  for(const change of [(r:any)=>delete r.operation.request.payload.productOrigin,(r:any)=>r.operation.disposition.proof.indexDigest="sha256:"+"0".repeat(64),(r:any)=>r.operation.disposition.requestDigest="sha256:"+"0".repeat(64),
    (r:any)=>r.events.splice(r.events.length-1,0,{at:r.operation.createdAt,op:"consumer-prepare"})]) {const bad=structuredClone(rec);change(bad);expect(validOperationRecord(bad)).toBe(false);}
  const replay:any=executeRecordProtocol({version:1,requestId:"stopped-replay",operation:"replay",productRoot:f.product,operationId:ID},{manifestPath:f.manifestPath});
  expect(replay).toMatchObject({ok:false,error:{code:"records-save-operation-stopped",state:"refused",operationId:ID,nextOperationId:expect.stringMatching(/^save-/)}});
 }finally{f.cleanup();}
});
