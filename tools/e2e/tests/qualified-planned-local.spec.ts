import {spawnSync} from "node:child_process";
import {readFileSync,writeFileSync} from "node:fs";
import path from "node:path";
import {pathToFileURL} from "node:url";
import {test,expect} from "@playwright/test";
import {executeQualifiedPlannedLocalDelivery,replayQualifiedPlannedLocalDelivery,observeQualifiedLocalDelivery} from "../scripts/qualified-delivery-operation.mjs";
import {completeQualifiedRecordsDelivery} from "../scripts/qualified-completion-operation.mjs";
import {operationDigest,validOperationRecord} from "../scripts/operation-record.mjs";
import {readAcceptedOperation} from "../scripts/durable-operation.mjs";
import {loadInstalledRecordTool} from "../scripts/records-check.mjs";
import {startRun,collectRun,readReservation} from "../scripts/run-record.mjs";
import {handleNativeEvent} from "../scripts/native-codex.mjs";
import {privateRecordFixture,fixtureProjectSettings} from "./private-record-fixture";
import {reviewed,writeVerdict,git,put,commit} from "./qualified-delivery-fixture";

test.setTimeout(180_000);
async function fixture(modeled=true,change="records"){
 const installation=privateRecordFixture(),f=await reviewed(false,change,{review:"independent",settings:fixtureProjectSettings(installation),foundation:true,
  ...(modeled?{candidateRecordsFiles:{"rules/file":"records base\n"}}:{})});
 try{
  const prepared=await f.prepare(),sealed=await f.seal(prepared),started:any=await startRun(f.product,{assignment:f.selectVerifier()}),bound=f.bindVerifier(started.record.attempt);
  expect(handleNativeEvent(f.product,f.verifierEvent("PreToolUse")).disposition).toBe("pre-admitted");writeVerdict(f,bound,prepared,sealed);
  expect(handleNativeEvent(f.product,f.verifierEvent("PostToolUse")).disposition).toBe("post-clean");f.finish(started.record.attempt);await collectRun(f.product,{attempt:started.record.attempt,ref:f.verifierRefs()});
  const input={operationId:"planned-local-fixture",executorAttempt:f.sourceAttempt,verifierAttempt:started.record.attempt,
   targets:{product:{ref:"refs/heads/main",expectedRevision:f.qualified.revisions.product},records:{ref:"refs/heads/main",expectedRevision:f.qualified.revisions.records}}};
  return {...f,input,manifestPath:installation.manifestPath,tool:loadInstalledRecordTool(installation.manifestPath),cleanup(){f.cleanup();installation.cleanup();}};
 }catch(error){f.cleanup();installation.cleanup();throw error;}
}
function snapshot(root:string){return {refs:git(root,["for-each-ref","--format=%(refname) %(objectname)"]),objects:git(root,["count-objects","-v"]),index:readFileSync(path.join(root,".git/index")).toString("base64")};}
test("modeled private planned integration preserves an advanced base and unrelated index/work, then completes the same operation",async()=>{
 const f=await fixture();try{
  put(f.records,"unrelated-base.txt","Later legitimate private content\n");f.input.targets.records.expectedRevision=commit(f.records);
  put(f.records,"unrelated-staged.txt","Keep staged bytes\n");git(f.records,["add","unrelated-staged.txt"]);put(f.records,"unrelated-working.md","Keep working bytes\n");
  const product=snapshot(f.product),before=snapshot(f.records),boundaries:string[]=[];
  const result=await executeQualifiedPlannedLocalDelivery(f.product,f.input,{tool:f.tool},{onBoundary(boundary,rec){boundaries.push(boundary);
   if(boundary==="captured"){
    expect(snapshot(f.records)).toEqual(before);expect(rec.operation.integration).toMatchObject({phase:"captured",workspaces:[],launches:[],grades:{product:null,records:null,acceptance:null}});
    expect(()=>git(f.records,["cat-file","-e",rec.operation.request.landings[0].commit])).toThrow();
   }
  }});
  expect(result).toMatchObject({status:"local-integrated",publication:"not-owed",ci:"not-owed",recordsCompletion:"pending"});
  expect(boundaries).toEqual(expect.arrayContaining(["integration:ready","records:objects-start","records:objects-prepared","records:working-prepared","records:ref-accepted"]));
  const rec:any=readAcceptedOperation(f.product,f.input.operationId),l=rec.operation.request.landings[0];expect(validOperationRecord(rec)).toBe(true);
  expect(rec.operation.request.integration.execution).toBeNull();expect(rec.operation.integration.grades.acceptance).not.toBeNull();expect(rec.state).toBe("unknown");
  expect(l.expectedRevision).not.toBe(rec.operation.request.authority.roles.find((r:any)=>r.role==="records").originalBase);
  expect(git(f.records,["rev-parse","HEAD"])).toBe(l.commit);expect(git(f.records,["rev-parse",rec.operation.progress[0].intent.correlationRef])).toBe(l.commit);
  expect(git(f.records,["show","HEAD:unrelated-base.txt"])).toBe("Later legitimate private content");
  expect(git(f.records,["diff","--cached","--name-only"])).toBe("unrelated-staged.txt");expect(readFileSync(path.join(f.records,"unrelated-working.md"),"utf8")).toBe("Keep working bytes\n");
  expect(snapshot(f.product)).toEqual(product);expect(observeQualifiedLocalDelivery(f.product,f.input.operationId)?.status).toBe("local-integrated");
  const completed=await completeQualifiedRecordsDelivery(f.product,f.input.operationId,{tool:f.tool});expect(completed.status).toBe("records-completed");
  const final:any=readAcceptedOperation(f.product,f.input.operationId);expect(final.state).toBe("finished");expect(final.operation.claims.every((c:any)=>c.releasedAt!==null)).toBe(true);expect(validOperationRecord(final)).toBe(true);
  expect(git(f.records,["diff","--cached","--name-only"])).toBe("unrelated-staged.txt");expect(snapshot(f.product)).toEqual(product);
  put(f.records,"later-history.md","Later legitimate save\n");commit(f.records);const later=git(f.records,["rev-parse","HEAD"]);
  expect(await replayQualifiedPlannedLocalDelivery(f.product,f.input.operationId,{get tool(){throw Error("historical receipt must precede TOOL");}})).toEqual(result);
  expect(git(f.records,["rev-parse","HEAD"])).toBe(later);expect(snapshot(f.product)).toEqual(product);
 }finally{f.cleanup();}
});
test("unmodeled private and PRODUCT-owed work refuse before an operation, claim or selected-repository object effect",async()=>{
 for(const [modeled,change,code] of [[false,"records","RECORDS_GRADE_PENDING"],[true,"mixed","PRODUCT_GRADE_PENDING"]] as const){
  const f=await fixture(modeled,change);try{
   const before=[snapshot(f.product),snapshot(f.records)];await expect(executeQualifiedPlannedLocalDelivery(f.product,f.input,{tool:f.tool})).rejects.toThrow(code);
   expect(readAcceptedOperation(f.product,f.input.operationId)).toBeNull();expect([snapshot(f.product),snapshot(f.records)]).toEqual(before);
   expect(readReservation(f.product,f.product)).toBeNull();expect(readReservation(f.product,f.records)).toBeNull();
   expect(git(f.product,["status","--porcelain"])).toBe("");expect(git(f.records,["status","--porcelain"])).toBe("");
  }finally{f.cleanup();}
 }
});
test("revoked current policy after private capture prevents actual objects and restores the same captured operation",async()=>{
 const f=await fixture();try{
  const before=snapshot(f.records),product=snapshot(f.product);
  await expect(executeQualifiedPlannedLocalDelivery(f.product,f.input,{tool:f.tool},{onBoundary(boundary){if(boundary==="captured")f.grant(undefined,true);}})).rejects.toThrow();
  const rec:any=readAcceptedOperation(f.product,f.input.operationId);expect(rec.operation.progress[0].phase).toBe("captured");expect(rec.operation.integration.phase).toBe("captured");
  expect(snapshot(f.records)).toEqual(before);expect(snapshot(f.product)).toEqual(product);f.grant();
  expect((await replayQualifiedPlannedLocalDelivery(f.product,f.input.operationId,{tool:f.tool})).status).toBe("local-integrated");
  expect(readAcceptedOperation(f.product,f.input.operationId)?.operation.digest).toBe(rec.operation.digest);expect(snapshot(f.product)).toEqual(product);
 }finally{f.cleanup();}
});
for(const boundary of ["records:objects-start","records:ref-accepted"])test(`cold private planned replay preserves original capture at ${boundary}`,async()=>{
 const f=await fixture();try{
  const owner=path.resolve(import.meta.dirname,"../scripts/qualified-delivery-operation.mjs"),checker=path.resolve(import.meta.dirname,"../scripts/records-check.mjs"),entry=path.join(f.dir,"planned-child.mjs");
  writeFileSync(entry,`import {executeQualifiedPlannedLocalDelivery} from ${JSON.stringify(pathToFileURL(owner).href)};\nimport {loadInstalledRecordTool} from ${JSON.stringify(pathToFileURL(checker).href)};\nawait executeQualifiedPlannedLocalDelivery(${JSON.stringify(f.product)},${JSON.stringify(f.input)},{tool:loadInstalledRecordTool(${JSON.stringify(f.manifestPath)})},{onBoundary(b){if(b===${JSON.stringify(boundary)})process.exit(77);}});\n`);
  const product=snapshot(f.product),before=snapshot(f.records),child=spawnSync(process.execPath,[entry],{encoding:"utf8",timeout:150_000});expect(child.status,child.stderr).toBe(77);
  const original:any=readAcceptedOperation(f.product,f.input.operationId),digest=original.operation.digest;expect(validOperationRecord(original)).toBe(true);
  if(boundary==="records:objects-start"){
   expect(snapshot(f.records)).toEqual(before);expect(observeQualifiedLocalDelivery(f.product,f.input.operationId)?.status).toBe("pending");
   f.grant(undefined,true);await expect(replayQualifiedPlannedLocalDelivery(f.product,f.input.operationId,{tool:f.tool})).rejects.toThrow();
   expect(readAcceptedOperation(f.product,f.input.operationId)?.operation.owner).toEqual(original.operation.owner);
   expect(snapshot(f.records)).toEqual(before);f.grant();
  }
  else expect(observeQualifiedLocalDelivery(f.product,f.input.operationId)?.status).toBe("local-integrated");
  const result=await replayQualifiedPlannedLocalDelivery(f.product,f.input.operationId,{tool:f.tool});expect(result.status).toBe("local-integrated");
  const current:any=readAcceptedOperation(f.product,f.input.operationId);expect(current.operation.digest).toBe(digest);expect(operationDigest(current.operation.request)).toBe(digest);expect(snapshot(f.product)).toEqual(product);
  // Historical cold recovery retires only the dead owned index lock; normal Git works.
  put(f.records,"later-save.md","Later private save\n");commit(f.records);const later=git(f.records,["rev-parse","HEAD"]);
  expect(await replayQualifiedPlannedLocalDelivery(f.product,f.input.operationId)).toEqual(result);expect(git(f.records,["rev-parse","HEAD"])).toBe(later);
 }finally{f.cleanup();}
});
