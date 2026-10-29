import {readFileSync,writeFileSync,existsSync} from "node:fs";
import {spawnSync} from "node:child_process";
import path from "node:path";
import {expect,test} from "@playwright/test";
import {extractFrontmatter} from "../../../lib/parser/dist/pure.js";
import {captureQualifiedCompletionProposal,qualifiedCompletionWriteSet} from "../scripts/qualified-delivery-completion.mjs";
import {completeQualifiedRecordsDelivery,replayQualifiedRecordsCompletion} from "../scripts/qualified-completion-operation.mjs";
import {executeQualifiedLocalDelivery,observeQualifiedLocalDelivery} from "../scripts/qualified-delivery-operation.mjs";
import {startRun,collectRun,readReservation} from "../scripts/run-record.mjs";
import {acceptedOperationPath,readAcceptedOperation} from "../scripts/durable-operation.mjs";
import {validOperationRecord} from "../scripts/operation-record.mjs";
import {loadInstalledRecordTool} from "../scripts/records-check.mjs";
import {ordinaryRecordTextPath} from "../scripts/records-validation.mjs";
import {handleNativeEvent} from "../scripts/native-codex.mjs";
import {privateRecordFixture,fixtureProjectSettings,FIXTURE_ENV} from "./private-record-fixture";
import {reviewed,writeVerdict,git} from "./qualified-delivery-fixture";
async function fixture(review?:string,guard=false,coldLocal=false,change="records"){
 const toolFixture=privateRecordFixture(),settings=fixtureProjectSettings(toolFixture).replace("guard_class: {}",guard?"guard_class:\n  G-01: [rules]":"guard_class: {}");
 const f=await reviewed(false,change,{...(review === undefined?{}:{review}),settings,foundation:true}),prepared=await f.prepare(),sealed=await f.seal(prepared);
 const started:any=await startRun(f.product,{assignment:f.selectVerifier()}),bound=f.bindVerifier(started.record.attempt);
 expect(handleNativeEvent(f.product,f.verifierEvent("PreToolUse")).disposition).toBe("pre-admitted");writeVerdict(f,bound,prepared,sealed);
 expect(handleNativeEvent(f.product,f.verifierEvent("PostToolUse")).disposition).toBe("post-clean");f.finish(started.record.attempt);await collectRun(f.product,{attempt:started.record.attempt,ref:f.verifierRefs()});
 const input={operationId:"completion-fixture",executorAttempt:f.sourceAttempt,verifierAttempt:started.record.attempt,targets:{product:{ref:"refs/heads/main",expectedRevision:f.qualified.revisions.product},records:{ref:"refs/heads/main",expectedRevision:f.qualified.revisions.records}}};
 let result:any;
 if(coldLocal){const module=new URL("../scripts/qualified-delivery-operation.mjs",import.meta.url).href;
  const child=spawnSync(process.execPath,["--input-type=module","-e",`import {executeQualifiedLocalDelivery} from ${JSON.stringify(module)};process.stdout.write(JSON.stringify(await executeQualifiedLocalDelivery(${JSON.stringify(f.product)},${JSON.stringify(input)})));`],{env:FIXTURE_ENV,encoding:"utf8",maxBuffer:4*1024*1024});
  expect(child.status,child.stderr).toBe(0);result=JSON.parse(child.stdout);
 }else result=await executeQualifiedLocalDelivery(f.product,input);
 const tool=loadInstalledRecordTool(toolFixture.manifestPath);
 return {...f,result,input,tool,manifestPath:toolFixture.manifestPath,cleanup(){f.cleanup();toolFixture.cleanup();}};
}
function unchanged(f:Awaited<ReturnType<typeof fixture>>){return {p:git(f.product,["for-each-ref","--format=%(refname) %(objectname)"]),r:git(f.records,["for-each-ref","--format=%(refname) %(objectname)"]),
 pIndex:readFileSync(path.join(f.product,".git/index")).toString("base64"),rIndex:readFileSync(path.join(f.records,".git/index")).toString("base64"),
 objects:git(f.records,["count-objects","-v"]),operation:readFileSync(acceptedOperationPath(f.product,f.input.operationId)).toString("utf8"),card:readFileSync(path.join(f.records,"docs/tasks/T-999-private.md"),"utf8")};}
test("coordinator completion proposal uses declared review and actual unknown-model provenance without any selected effect",async()=>{
 const f=await fixture("independent");try{
  const before=unchanged(f),observation=observeQualifiedLocalDelivery(f.product,f.input.operationId);expect(observation?.receipt).toEqual(f.result);expect(unchanged(f)).toEqual(before);
  const proposal=captureQualifiedCompletionProposal(f.product,f.input.operationId,{tool:f.tool}),plan=qualifiedCompletionWriteSet(proposal);
  expect(unchanged(f)).toEqual(before);expect(proposal).toMatchObject({kind:"qualified-completion-proposal",authority:"proposal only; no effects or completion"});
  const task=plan.writes.find((w:any)=>w.path === plan.cardPath),after=Buffer.from(task.base64,"base64").toString("utf8");
  const fields=extractFrontmatter(after,plan.cardPath).data;expect(fields?.status).toBe("done");expect(fields?.review).toBe("independent");expect(fields?.built_by).toContain("model-unknown");expect(fields?.verified_by).toContain("model-unknown");
  expect(extractFrontmatter(after,plan.cardPath).body).toBe(extractFrontmatter(before.card,plan.cardPath).body);
  expect(plan.receipt.completion.attribution.builder.observed.model).toBe("unknown");expect(plan.receipt.completion.attribution.builder.requestedModel).toBe("gpt-6.1-sol");
  expect(fields?.built_by).not.toContain("gpt-6.1-sol");expect(plan.receipt).not.toHaveProperty("commit");expect(plan.receipt.publication).toBe("not-owed");
  expect(ordinaryRecordTextPath(plan.receiptPath)).toBe(false);expect(plan.writes.some((w:any)=>w.path === "docs/INDEX.md")).toBe(true);
  expect(()=>qualifiedCompletionWriteSet(structuredClone(proposal))).toThrow(/PROPOSAL_REQUIRED/);
 }finally{f.cleanup();}
});
function childCompletion(f:Awaited<ReturnType<typeof fixture>>,boundary?:string,replay=false){
 const module=new URL("../scripts/qualified-completion-operation.mjs",import.meta.url).href,loader=new URL("../scripts/records-check.mjs",import.meta.url).href;
 const code=`import {completeQualifiedRecordsDelivery,replayQualifiedRecordsCompletion} from ${JSON.stringify(module)};import {loadInstalledRecordTool} from ${JSON.stringify(loader)};try{const result=await ${replay?"replayQualifiedRecordsCompletion":"completeQualifiedRecordsDelivery"}(${JSON.stringify(f.product)},${JSON.stringify(f.input.operationId)},{tool:loadInstalledRecordTool(${JSON.stringify(f.manifestPath)})},{onBoundary(at){if(at===${JSON.stringify(boundary??"")})process.exit(76);}});process.stdout.write(JSON.stringify(result));}catch(e){process.stdout.write(JSON.stringify({code:e.code}));process.exit(1);}`;
 const child=spawnSync(process.execPath,["--input-type=module","-e",code],{env:FIXTURE_ENV,encoding:"utf8",maxBuffer:4*1024*1024});return {child,result:JSON.parse(child.stdout||"null")};
}
for(const boundary of ["completion:captured","completion:objects-prepared","completion:file-temp-written","completion:index-prepared","completion:ref-accepted"])test(`cold coordinator completion reconciles original capture after ${boundary}`,async()=>{
 const f=await fixture("independent",false,true);try{
  const stop=childCompletion(f,boundary);expect(stop.child.status,stop.child.stderr).toBe(76);const original=readAcceptedOperation(f.product,f.input.operationId),capture=JSON.stringify(original.operation.completion.plan),request=JSON.stringify(original.operation.request);
  const result=childCompletion(f,undefined,true);expect(result.child.status,result.child.stderr).toBe(0);expect(result.result).toMatchObject({status:"records-completed",commit:original.operation.completion.plan.commit});
  const rec=readAcceptedOperation(f.product,f.input.operationId);expect(validOperationRecord(rec)).toBe(true);expect(rec.state).toBe("finished");expect(JSON.stringify(rec.operation.completion.plan)).toBe(capture);expect(JSON.stringify(rec.operation.request)).toBe(request);
  expect(readReservation(f.product,f.records)).toBeNull();expect(existsSync(path.join(f.records,".git/index.lock"))).toBe(false);
  for(const w of rec.operation.completion.plan.writes)expect(readFileSync(path.join(f.records,w.path)).toString("base64")).toBe(w.base64);
  writeFileSync(path.join(f.records,"later-cold.md"),"Legitimate later private owner\n");git(f.records,["add","later-cold.md"]);git(f.records,["commit","-qm","Later after cold completion"]);
  expect(await replayQualifiedRecordsCompletion(f.product,f.input.operationId)).toEqual(result.result);
 }finally{f.cleanup();}
});
test("protected completion refuses current revocation before objects and at file publication, then resumes the exact capture",async()=>{
 const f=await fixture("independent");try{
  const objects=git(f.records,["count-objects","-v"]),tip=git(f.records,["rev-parse","HEAD"]),before=readFileSync(path.join(f.records,"docs/tasks/T-999-private.md"));
  await expect(completeQualifiedRecordsDelivery(f.product,f.input.operationId,{tool:f.tool},{onBoundary(at){if(at==="completion:captured")f.grant(undefined,true,4);}})).rejects.toThrow(/QUALIFIED_POLICY_/);
  let rec=readAcceptedOperation(f.product,f.input.operationId);const captured=JSON.stringify(rec.operation.completion.plan);
  expect(rec.operation.completion.phase).toBe("captured");expect(git(f.records,["count-objects","-v"])).toBe(objects);expect(git(f.records,["rev-parse","HEAD"])).toBe(tip);expect(readFileSync(path.join(f.records,"docs/tasks/T-999-private.md"))).toEqual(before);
  f.grant(undefined,false,5);let objectRevoked=false;
  await expect(replayQualifiedRecordsCompletion(f.product,f.input.operationId,{tool:f.tool},{onBoundary(at){if(at==="completion:before-object"&&!objectRevoked){objectRevoked=true;f.grant(undefined,true,6);}}})).rejects.toThrow(/QUALIFIED_POLICY_/);
  expect(objectRevoked).toBe(true);expect(git(f.records,["count-objects","-v"])).toBe(objects);
  f.grant(undefined,false,7);let changed=false;
  await expect(replayQualifiedRecordsCompletion(f.product,f.input.operationId,{tool:f.tool},{onBoundary(at){if(at==="completion:file-temp-written"&&!changed){changed=true;f.grant(undefined,true,8);}}})).rejects.toThrow(/QUALIFIED_POLICY_/);
  expect(changed).toBe(true);expect(git(f.records,["rev-parse","HEAD"])).toBe(tip);expect(readReservation(f.product,f.records)?.attempt).toBe(rec.attempt);
  f.grant(undefined,false,9);expect(await replayQualifiedRecordsCompletion(f.product,f.input.operationId,{tool:f.tool})).toMatchObject({status:"records-completed"});rec=readAcceptedOperation(f.product,f.input.operationId);expect(JSON.stringify(rec.operation.completion.plan)).toBe(captured);
 }finally{f.cleanup();}
});
test("missing original review provenance remains pending and a cloned caller cannot supply a completion declaration",async()=>{
 const f=await fixture();try{const before=unchanged(f);expect(()=>captureQualifiedCompletionProposal(f.product,f.input.operationId,{tool:f.tool})).toThrow(/REVIEW_REQUIRED/);expect(unchanged(f)).toEqual(before);}
 finally{f.cleanup();}
});
test("a declared same-model review cannot complete a configured guard-class subject",async()=>{
 const f=await fixture("same-model",true);try{const before=unchanged(f);expect(()=>captureQualifiedCompletionProposal(f.product,f.input.operationId,{tool:f.tool})).toThrow(/INDEPENDENT_REVIEW_REQUIRED/);expect(unchanged(f)).toEqual(before);}
 finally{f.cleanup();}
});
test("protected records-only completion commits exact card receipt and INDEX through the original operation",async()=>{
 const f=await fixture("independent");try{
  writeFileSync(path.join(f.records,"unrelated-staged.md"),"Unrelated staged private work\n");git(f.records,["add","unrelated-staged.md"]);
  writeFileSync(path.join(f.records,"unrelated-working.md"),"Unrelated working private work\n");
  const before=unchanged(f),result=await completeQualifiedRecordsDelivery(f.product,f.input.operationId,{tool:f.tool}),rec=readAcceptedOperation(f.product,f.input.operationId),p=rec.operation.completion.plan;
  expect(result).toMatchObject({status:"records-completed",publication:"not-owed",ci:"not-owed",commit:p.commit,tree:p.tree,attribution:"exact"});
  expect(rec.state).toBe("finished");expect(validOperationRecord(rec)).toBe(true);expect(rec.operation.localAcceptance).toEqual(f.result.landings);
  expect(git(f.records,["rev-parse","HEAD"])).toBe(p.commit);expect(git(f.records,["rev-parse",p.commit+"^"])).toBe(p.expectedRevision);
  expect(git(f.records,["rev-parse",rec.operation.completion.intent.correlationRef])).toBe(p.commit);
  for(const w of p.writes)expect(readFileSync(path.join(f.records,w.path)).toString("base64")).toBe(w.base64);
  expect(extractFrontmatter(readFileSync(path.join(f.records,p.cardPath),"utf8"),p.cardPath).data?.status).toBe("done");
  expect(git(f.product,["for-each-ref","--format=%(refname) %(objectname)"])).toBe(before.p);expect(readFileSync(path.join(f.product,".git/index")).toString("base64")).toBe(before.pIndex);
  expect(rec.operation.claims.every((c:any)=>c.releasedAt!==null)).toBe(true);
  expect(git(f.records,["diff","--cached","--name-only"])).toBe("unrelated-staged.md");expect(readFileSync(path.join(f.records,"unrelated-working.md"),"utf8")).toBe("Unrelated working private work\n");
  for(const change of [(r:any)=>{r.operation.completion.plan.tree="f".repeat(40);},(r:any)=>{r.operation.completion.intent.correlationRef+="-foreign";},(r:any)=>{r.operation.completion.acceptance=null;}]){const bad=structuredClone(rec);change(bad);expect(validOperationRecord(bad)).toBe(false);}
  const accepted=readFileSync(acceptedOperationPath(f.product,f.input.operationId));
  writeFileSync(path.join(f.records,"later.md"),"Later private owner\n");git(f.records,["add","later.md"]);git(f.records,["commit","-qm","Later private owner"]);const later=git(f.records,["rev-parse","HEAD"]);
  writeFileSync(path.join(f.product,".supertaskr/workspace.json"),"Invalid successor binding\n");f.grant(undefined,true,4);
  expect(await replayQualifiedRecordsCompletion(f.product,f.input.operationId)).toEqual(result);expect(git(f.records,["rev-parse","HEAD"])).toBe(later);expect(readFileSync(acceptedOperationPath(f.product,f.input.operationId))).toEqual(accepted);
 }finally{f.cleanup();}
});
test("completion requires exact correlation and never attributes a separately reachable planned commit",async()=>{
 const f=await fixture("independent",false,true);try{
  const stop=childCompletion(f,"completion:objects-prepared");expect(stop.child.status,stop.child.stderr).toBe(76);const rec=readAcceptedOperation(f.product,f.input.operationId),c=rec.operation.completion,record=readFileSync(acceptedOperationPath(f.product,f.input.operationId));
  git(f.records,["update-ref",c.plan.targetRef,c.plan.commit,c.plan.expectedRevision]);
  const retry=childCompletion(f,undefined,true);expect(retry.child.status).toBe(1);expect(retry.result.code).toBe("QUALIFIED_COMPLETION_ACCEPTANCE_UNCERTAIN");expect(readFileSync(acceptedOperationPath(f.product,f.input.operationId))).toEqual(record);
  expect(git(f.records,["for-each-ref","--format=%(refname)",c.intent.correlationRef])).toBe("");expect(git(f.records,["rev-parse","HEAD"])).toBe(c.plan.commit);expect(readReservation(f.product,f.records)?.attempt).toBe(rec.attempt);
 }finally{f.cleanup();}
});
test("a still-live completion owner refuses a second process and product publication debt remains pending",async()=>{
 const f=await fixture("independent");try{
  let checked=false;
  await expect(completeQualifiedRecordsDelivery(f.product,f.input.operationId,{tool:f.tool},{onBoundary(at){if(at==="completion:captured"){
   const other=childCompletion(f,undefined,true);expect(other.child.status).toBe(1);expect(other.result.code).toBe("NATIVE_TRANSACTION_BUSY");checked=true;throw Error("Owned coordinator temporarily stopped");
  }}})).rejects.toThrow("Owned coordinator temporarily stopped");
  const before=unchanged(f),other=childCompletion(f,undefined,true);expect(other.child.status).toBe(1);expect(other.result.code).toBe("QUALIFIED_COMPLETION_OWNER_LIVE");expect(unchanged(f)).toEqual(before);
  const result=await replayQualifiedRecordsCompletion(f.product,f.input.operationId,{tool:f.tool});
  expect(checked).toBe(true);expect(result.status).toBe("records-completed");
 }finally{f.cleanup();}
 const f2=await fixture("independent",false,false,"mixed");try{
  const before=unchanged(f2);await expect(completeQualifiedRecordsDelivery(f2.product,f2.input.operationId,{tool:f2.tool})).rejects.toThrow(/PUBLICATION_PENDING/);
  const rec=readAcceptedOperation(f2.product,f2.input.operationId);expect(rec.operation.completion).toBeUndefined();expect(unchanged(f2).r).toBe(before.r);expect(unchanged(f2).objects).toBe(before.objects);expect(rec.state).toBe("unknown");
 }finally{f2.cleanup();}
});
