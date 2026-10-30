import {readFileSync,writeFileSync,existsSync,statSync,renameSync,readdirSync} from "node:fs";
import {spawnSync} from "node:child_process";
import path from "node:path";
import {test,expect} from "@playwright/test";
import {executeQualifiedLocalDelivery,replayQualifiedLocalDelivery,assertQualifiedDeliveryRecovery} from "../scripts/qualified-delivery-operation.mjs";
import {startRun,collectRun,readReservation,allRecords,takeReservation,releaseReservation,readRecord,recordPath} from "../scripts/run-record.mjs";
import {qualifiedDeliveryPhasePolicy,loadQualifiedDeliveryPolicy} from "../scripts/qualified-admission.mjs";
import {acceptedOperationPath,readAcceptedOperation} from "../scripts/durable-operation.mjs";
import {validOperationRecord} from "../scripts/operation-record.mjs";
import {validQualifiedDeliveryRequest} from "../scripts/qualified-delivery-record.mjs";
import {handleNativeEvent} from "../scripts/native-codex.mjs";
import {reviewed,writeVerdict,git,put,commit} from "./qualified-delivery-fixture";
import {FIXTURE_ENV} from "./private-record-fixture";
async function completed(colocated=false,change="mixed"){
 const f=await reviewed(colocated,change),prepared=await f.prepare(),sealed=await f.seal(prepared);
 const started:any=await startRun(f.product,{assignment:f.selectVerifier()}),bound=f.bindVerifier(started.record.attempt);
 expect(handleNativeEvent(f.product,f.verifierEvent("PreToolUse")).disposition).toBe("pre-admitted");writeVerdict(f,bound,prepared,sealed);
 expect(handleNativeEvent(f.product,f.verifierEvent("PostToolUse")).disposition).toBe("post-clean");f.finish(started.record.attempt);
 await collectRun(f.product,{attempt:started.record.attempt,ref:f.verifierRefs()});
 const targets={product:{ref:"refs/heads/main",expectedRevision:f.qualified.revisions.product},records:{ref:"refs/heads/main",expectedRevision:f.qualified.revisions.records}};
 return {...f,input:{operationId:"delivery-fixture",executorAttempt:f.sourceAttempt,verifierAttempt:started.record.attempt,targets}};
}
test("protected mixed local integration lands exact finalized whole outputs once and keeps actual publication/completion pending",async()=>{
 const f=await completed();try{
  put(f.product,"unrelated-staged.txt","ordinary staged work\n");git(f.product,["add","unrelated-staged.txt"]);
  put(f.product,"unrelated-working.txt","ordinary untracked work\n");
  const result=await executeQualifiedLocalDelivery(f.product,f.input);
  const rec=readAcceptedOperation(f.product,f.input.operationId);expect(validOperationRecord(rec)).toBe(true);expect(allRecords(f.product)).toContainEqual(rec);
  const malformed=structuredClone(rec.operation.request);malformed.authority.roles[0]=null;expect(validQualifiedDeliveryRequest(malformed)).toBe(false);
  expect(()=>readRecord(f.product,rec.attempt)).toThrow(/RECORD_OPERATION/);
  expect(()=>qualifiedDeliveryPhasePolicy(f.product,rec.operation.request.policySource)).toThrow(/preflight-operation-pending/);
  const foreign=structuredClone(rec);foreign.operation.owner.token="foreign-owner-token";
  expect(()=>qualifiedDeliveryPhasePolicy(f.product,rec.operation.request.policySource,foreign)).toThrow(/preflight-operation-pending/);
  expect(result).toMatchObject({status:"local-integrated",publication:"pending",ci:"pending",recordsCompletion:"pending"});expect(rec.state).toBe("unknown");
  for(const landing of rec.operation.request.landings){
   expect(git(landing.repository.root,["rev-parse",landing.ref])).toBe(landing.commit);expect(git(landing.repository.root,["rev-parse",`${landing.commit}^{tree}`])).toBe(landing.tree);
   const p=rec.operation.progress.find((p:any)=>p.key === landing.key);expect(git(landing.repository.root,["rev-parse",p.intent.correlationRef])).toBe(landing.commit);
   expect(readReservation(f.product,landing.repository.root)?.attempt).toBe(rec.attempt);expect(existsSync(`${landing.working.index.path}.lock`)).toBe(false);
  }
  expect(readFileSync(path.join(f.product,"src/file"),"utf8")).toBe("product candidate\n");expect(readFileSync(path.join(f.records,"rules/file"),"utf8")).toBe("records candidate\n");
  expect(git(f.product,["diff","--cached","--name-only"])).toBe("unrelated-staged.txt");expect(readFileSync(path.join(f.product,"unrelated-working.txt"),"utf8")).toBe("ordinary untracked work\n");
  const receipt=readFileSync(acceptedOperationPath(f.product,f.input.operationId)),inode=statSync(acceptedOperationPath(f.product,f.input.operationId),{bigint:true}).ino;
  expect(await replayQualifiedLocalDelivery(f.product,f.input.operationId)).toEqual(result);
  expect(readFileSync(acceptedOperationPath(f.product,f.input.operationId))).toEqual(receipt);expect(statSync(acceptedOperationPath(f.product,f.input.operationId),{bigint:true}).ino).toBe(inode);
  // Historical local acceptance survives later destination progress, revoked
  // current policy/binding and retired worker paths. It grants no missing step.
  put(f.product,"src/later","later destination progress\n");commit(f.product);put(f.records,"rules/later","later private progress\n");commit(f.records);
  writeFileSync(path.join(f.product,".supertaskr/workspace.json"),"invalid successor binding\n");f.grant(undefined,true,4);
  const retired=[...new Set([f.productWorker,f.recordsWorker,f.productBench,f.recordsBench])];
  for(const worker of retired)renameSync(worker,`${worker}-retired`);
  try{expect(await replayQualifiedLocalDelivery(f.product,f.input.operationId)).toEqual(result);expect(readFileSync(acceptedOperationPath(f.product,f.input.operationId))).toEqual(receipt);}
  finally{for(const worker of retired)renameSync(`${worker}-retired`,worker);}
 }finally{f.cleanup();}
});
for(const [colocated,change] of [[false,"product"],[false,"records"],[true,"product"]] as const)test(`qualified exact local route preserves genuine ${colocated?"colocated ":""}${change} obligations`,async()=>{
 const f=await completed(colocated,change);try{
  const productBefore=git(f.product,["rev-parse","HEAD"]),result=await executeQualifiedLocalDelivery(f.product,f.input),rec=readAcceptedOperation(f.product,f.input.operationId);
  expect(result.publication).toBe(change === "records"?"not-owed":"pending");expect(result.ci).toBe(change === "records"?"not-owed":"pending");expect(result.recordsCompletion).toBe("pending");
  expect(rec.operation.request.landings).toHaveLength(colocated || change === "records"?1:2);
  if(change === "records")expect(git(f.product,["rev-parse","HEAD"])).toBe(productBefore);
  for(const l of rec.operation.request.landings)expect(git(l.repository.root,["rev-parse","HEAD"])).toBe(l.commit);
 }finally{f.cleanup();}
});
function crash(f:Awaited<ReturnType<typeof completed>>,boundary:string){
 const subject=new URL("../scripts/qualified-delivery-operation.mjs",import.meta.url).href;
 const child=spawnSync(process.execPath,["--input-type=module","-e",`import {readFileSync} from 'node:fs';import {executeQualifiedLocalDelivery} from ${JSON.stringify(subject)};await executeQualifiedLocalDelivery(${JSON.stringify(f.product)},JSON.parse(readFileSync(0,'utf8')),{onBoundary(at){if(at === ${JSON.stringify(boundary)})process.exit(76);}});`],{input:JSON.stringify(f.input),encoding:"utf8",env:FIXTURE_ENV,maxBuffer:4*1024*1024});
 expect(child.status,child.stderr).toBe(76);
}
function cold(f:Awaited<ReturnType<typeof completed>>){
 const subject=new URL("../scripts/qualified-delivery-operation.mjs",import.meta.url).href;
 const child=spawnSync(process.execPath,["--input-type=module","-e",`import {replayQualifiedLocalDelivery} from ${JSON.stringify(subject)};try{process.stdout.write(JSON.stringify(await replayQualifiedLocalDelivery(${JSON.stringify(f.product)},'delivery-fixture')));}catch(e){process.stdout.write(JSON.stringify({code:e.code}));process.exit(1);}`],{encoding:"utf8",env:FIXTURE_ENV,maxBuffer:4*1024*1024});
 return {child,result:JSON.parse(child.stdout||"null")};
}
test("read-only recovery policy checks actual dead owner and current admission before any owner publication",async()=>{
 const f=await completed();try{
  crash(f,"captured");await loadQualifiedDeliveryPolicy();
  const rec=readAcceptedOperation(f.product,f.input.operationId),file=acceptedOperationPath(f.product,f.input.operationId),before=readFileSync(file),p=git(f.product,["rev-parse","HEAD"]),r=git(f.records,["rev-parse","HEAD"]);
  expect(rec.operation.owner.pid).not.toBe(process.pid);expect(assertQualifiedDeliveryRecovery(f.product,rec)).toBe(true);
  expect(readFileSync(file)).toEqual(before);expect(git(f.product,["rev-parse","HEAD"])).toBe(p);expect(git(f.records,["rev-parse","HEAD"])).toBe(r);
  const foreign=structuredClone(rec);foreign.operation.owner.token+="-foreign";expect(()=>assertQualifiedDeliveryRecovery(f.product,foreign)).toThrow(/QUALIFIED_DELIVERY_CHANGED/);
  f.grant(undefined,true,4);expect(()=>assertQualifiedDeliveryRecovery(f.product,rec)).toThrow(/QUALIFIED_POLICY_/);expect(readFileSync(file)).toEqual(before);
  f.grant(undefined,false,5);expect(assertQualifiedDeliveryRecovery(f.product,rec)).toBe(true);expect(readFileSync(file)).toEqual(before);
  expect(cold(f).result.status).toBe("local-integrated");
 }finally{f.cleanup();}
 const live=await completed();try{
  await executeQualifiedLocalDelivery(live.product,live.input);const before=readFileSync(acceptedOperationPath(live.product,live.input.operationId));
  const code=`const [{assertQualifiedDeliveryRecovery},{loadQualifiedDeliveryPolicy},{readAcceptedOperation}]=await Promise.all([import(process.argv[1]),import(process.argv[2]),import(process.argv[3])]);await loadQualifiedDeliveryPolicy();try{assertQualifiedDeliveryRecovery(process.argv[4],readAcceptedOperation(process.argv[4],process.argv[5]));process.exitCode=2;}catch(e){process.stdout.write(JSON.stringify({code:e.code}));}`;
  const child=spawnSync(process.execPath,["--input-type=module","-e",code,new URL("../scripts/qualified-delivery-operation.mjs",import.meta.url).href,new URL("../scripts/qualified-admission.mjs",import.meta.url).href,new URL("../scripts/durable-operation.mjs",import.meta.url).href,live.product,live.input.operationId],{env:FIXTURE_ENV,encoding:"utf8"});
  expect(child.status,child.stderr).toBe(0);expect(JSON.parse(child.stdout).code).toBe("preflight-operation-owner");expect(readFileSync(acceptedOperationPath(live.product,live.input.operationId))).toEqual(before);
 }finally{live.cleanup();}
});
for(const boundary of ["captured","product:ref-accepted","records:ref-accepted"])test(`cold local delivery reconciles original exact effects after ${boundary}`,async()=>{
 const f=await completed();try{
  crash(f,boundary);const original=readAcceptedOperation(f.product,f.input.operationId),captured=JSON.stringify(original.operation.request);
  const {child,result}=cold(f);expect(child.status,child.stderr).toBe(0);expect(result.status).toBe("local-integrated");
  const rec=readAcceptedOperation(f.product,f.input.operationId);expect(JSON.stringify(rec.operation.request)).toBe(captured);
  for(const l of rec.operation.request.landings){expect(git(l.repository.root,["rev-parse","HEAD"])).toBe(l.commit);expect(existsSync(`${l.working.index.path}.lock`)).toBe(false);}
  expect((await replayQualifiedLocalDelivery(f.product,f.input.operationId))).toEqual(result);
  // Accepted lock retirement permits a real later ordinary Git operation.
  put(f.product,"src/later-control","ordinary Git after reconciliation\n");expect(commit(f.product)).not.toBe(original.operation.request.landings[0].commit);
 }finally{f.cleanup();}
});
test("reachable output without exact operation correlation stays uncertain and never relands",async()=>{
 const f=await completed();try{
  crash(f,"captured");const rec=readAcceptedOperation(f.product,f.input.operationId),l=rec.operation.request.landings.find((l:any)=>l.roles.includes("product"));
  git(f.product,["update-ref",l.ref,l.commit,l.expectedRevision]);const before=readFileSync(acceptedOperationPath(f.product,f.input.operationId));
  const {child,result}=cold(f);expect(child.status).toBe(1);expect(result.code).toBe("QUALIFIED_DELIVERY_ACCEPTANCE_UNCERTAIN");
  expect(readFileSync(acceptedOperationPath(f.product,f.input.operationId))).toEqual(before);expect(git(f.records,["rev-parse","HEAD"])).toBe(f.qualified.revisions.records);
  expect(git(f.product,["for-each-ref","--format=%(refname)",rec.operation.progress[0].intent.correlationRef])).toBe("");
 }finally{f.cleanup();}
});
test("a reserved second root leaves no orphan operation or repository effects and its released control lands",async()=>{
 const f=await completed();try{
  takeReservation(f.product,{resource:f.records,attempt:"legacy-held-a1",role:"executor",at:new Date().toISOString()});
  const tips=[git(f.product,["rev-parse","HEAD"]),git(f.records,["rev-parse","HEAD"])],objects=git(f.product,["count-objects","-v"]);
  await expect(executeQualifiedLocalDelivery(f.product,f.input)).rejects.toThrow(/RESERVED/);expect(readAcceptedOperation(f.product,f.input.operationId)).toBeNull();
  expect(readReservation(f.product,f.product)).toBeNull();expect(readReservation(f.product,f.records)?.attempt).toBe("legacy-held-a1");
  expect([git(f.product,["rev-parse","HEAD"]),git(f.records,["rev-parse","HEAD"])]).toEqual(tips);expect(git(f.product,["count-objects","-v"])).toBe(objects);
  releaseReservation(f.product,{resource:f.records,attempt:"legacy-held-a1"});expect((await executeQualifiedLocalDelivery(f.product,f.input)).status).toBe("local-integrated");
 }finally{f.cleanup();}
});
test("pending local delivery rechecks exact retained final evidence and current protected grant before missing effects",async()=>{
 const f=await completed();try{
  crash(f,"captured");const request=JSON.stringify(readAcceptedOperation(f.product,f.input.operationId).operation.request),file=recordPath(f.product,f.input.verifierAttempt),original=readFileSync(file),bad=JSON.parse(original.toString("utf8"));
  bad.native.qualified.collection.review.actualOutputGrades[0].tree="f".repeat(40);writeFileSync(file,JSON.stringify(bad));
  const changed=cold(f);expect(changed.child.status).toBe(1);expect(changed.result.code).toBe("QUALIFIED_RETAINED_AUTHORITY_CHANGED");writeFileSync(file,original);
  f.grant(undefined,true,4);const revoked=cold(f);expect(revoked.child.status).toBe(1);expect(revoked.result.code).toMatch(/QUALIFIED_POLICY_/);
  expect(git(f.product,["rev-parse","HEAD"])).toBe(f.qualified.revisions.product);expect(git(f.records,["rev-parse","HEAD"])).toBe(f.qualified.revisions.records);
  expect(readFileSync(path.join(f.product,"src/file"),"utf8")).toBe("product base\n");expect(JSON.stringify(readAcceptedOperation(f.product,f.input.operationId).operation.request)).toBe(request);
  f.grant(undefined,false,5);const allowed=cold(f);expect(allowed.child.status,allowed.child.stderr).toBe(0);expect(allowed.result.status).toBe("local-integrated");
 }finally{f.cleanup();}
});
test("revocation after an owned file temporary still refuses its visible publish and the same captured owner can resume",async()=>{
 const f=await completed();try{
  let revoked=false;
  await expect(executeQualifiedLocalDelivery(f.product,f.input,{onBoundary(at){if(at === "product:file-temp-written" && !revoked){revoked=true;f.grant(undefined,true,4);}}})).rejects.toThrow(/QUALIFIED_POLICY_/);
  expect(revoked).toBe(true);expect(git(f.product,["rev-parse","HEAD"])).toBe(f.qualified.revisions.product);expect(readFileSync(path.join(f.product,"src/file"),"utf8")).toBe("product base\n");
  const rec=readAcceptedOperation(f.product,f.input.operationId);expect(rec.operation.progress[0].phase).toBe("working-start");expect(rec.operation.localAcceptance).toBeNull();
  expect(readReservation(f.product,f.product)?.attempt).toBe(rec.attempt);f.grant(undefined,false,5);
  expect((await replayQualifiedLocalDelivery(f.product,f.input.operationId)).status).toBe("local-integrated");
 }finally{f.cleanup();}
});
