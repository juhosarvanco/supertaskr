import {readFileSync} from "node:fs";
import path from "node:path";
import {test,expect} from "@playwright/test";
import {captureQualifiedIntegrationPlan,qualifiedIntegrationPlanData} from "../scripts/qualified-integration-plan.mjs";
import {validQualifiedIntegrationPlan,validQualifiedIntegrationGrades,validQualifiedIntegrationExecution,validQualifiedIntegrationProgress,validQualifiedPlannedDeliveryRequest} from "../scripts/qualified-integration-record.mjs";
import {captureQualifiedDeliveryPolicySource} from "../scripts/qualified-delivery-operation.mjs";
import {validQualifiedDeliveryRequest} from "../scripts/qualified-delivery-record.mjs";
import {operationDigest} from "../scripts/operation-record.mjs";
import {readAcceptedOperation} from "../scripts/durable-operation.mjs";
import {loadInstalledRecordTool} from "../scripts/records-check.mjs";
import {startRun,collectRun} from "../scripts/run-record.mjs";
import {handleNativeEvent} from "../scripts/native-codex.mjs";
import {privateRecordFixture,fixtureProjectSettings} from "./private-record-fixture";
import {reviewed,writeVerdict,git} from "./qualified-delivery-fixture";

// Actual finalized two-root setup uses the same bound as the delivery family.
test.setTimeout(180_000);
for(const modeledOnly of [false,true])test(`planned data preserves actual ${modeledOnly?"modeled-only":"partly unmodeled"} private authority without granting a writer`,async()=>{
 const installation=privateRecordFixture(),f=await reviewed(false,"records",{review:"independent",settings:fixtureProjectSettings(installation),foundation:true,...(modeledOnly?{candidateRecordsFiles:{"rules/file":"records base\n"}}:{})});
 try{
  const prepared=await f.prepare(),sealed=await f.seal(prepared),started:any=await startRun(f.product,{assignment:f.selectVerifier()}),bound=f.bindVerifier(started.record.attempt);
  expect(handleNativeEvent(f.product,f.verifierEvent("PreToolUse")).disposition).toBe("pre-admitted");writeVerdict(f,bound,prepared,sealed);
  expect(handleNativeEvent(f.product,f.verifierEvent("PostToolUse")).disposition).toBe("post-clean");f.finish(started.record.attempt);await collectRun(f.product,{attempt:started.record.attempt,ref:f.verifierRefs()});
  const input={operationId:"planned-record-data",executorAttempt:f.sourceAttempt,verifierAttempt:started.record.attempt,targets:{product:{ref:"refs/heads/main",expectedRevision:f.qualified.revisions.product},records:{ref:"refs/heads/main",expectedRevision:f.qualified.revisions.records}}};
  const snapshot=()=>[f.product,f.records].map(root=>({refs:git(root,["for-each-ref","--format=%(refname) %(objectname)"]),index:readFileSync(path.join(root,".git/index")).toString("base64"),objects:git(root,["count-objects","-v"])}));
  const before=snapshot(),plan=qualifiedIntegrationPlanData(await captureQualifiedIntegrationPlan(f.product,input,{tool:loadInstalledRecordTool(installation.manifestPath)}));
  expect(validQualifiedIntegrationPlan(plan)).toBe(true);expect(readAcceptedOperation(f.product,input.operationId)).toBeNull();expect(snapshot()).toEqual(before);
  expect(plan.recordsValidation.unmodeled.includes("rules/file")).toBe(!modeledOnly);
  for(const change of [
   (p:any)=>{p.roles.find((r:any)=>r.role==="records").commit="f".repeat(40);},
   (p:any)=>{p.roles.find((r:any)=>r.role==="records").commitBase64=Buffer.from("not the captured commit").toString("base64");},
   (p:any)=>{p.roles.find((r:any)=>r.role==="records").grade.tree="f".repeat(40);},
   (p:any)=>{p.roles.find((r:any)=>r.role==="records").working.preimages=[];},
   (p:any)=>{p.roles.find((r:any)=>r.role==="records").repository.root=path.join(f.dir,"foreign-records");},
   (p:any)=>{const repo=p.roles.find((r:any)=>r.role==="records").repository;repo.commonDir=path.join(f.dir,"foreign-common");repo.identities[2].path=repo.commonDir;repo.identities[3].path=path.join(repo.commonDir,"objects");},
   (p:any)=>{p.source.permissionDigest="0".repeat(64);},
   (p:any)=>{p.tool.foreign="not a captured tool field";},
   (p:any)=>{p.configuration.tool.runtimeDigest="0".repeat(64);},
   (p:any)=>{p.recordsValidation.modeled=[];},
  ]){const changed=structuredClone(plan);change(changed);expect(validQualifiedIntegrationPlan(changed)).toBe(false);}
  if(!modeledOnly){const relabeled=structuredClone(plan);relabeled.recordsValidation.modeled.push(...relabeled.recordsValidation.unmodeled);relabeled.recordsValidation.unmodeled=[];expect(validQualifiedIntegrationPlan(relabeled)).toBe(false);}
  // These are authored pure-format states, never owned grade observations.
  const progress:any={version:1,planDigest:operationDigest(plan),product:null,records:null,acceptance:null};
  expect(validQualifiedIntegrationGrades(progress,plan)).toBe(true);
  // Authored execution descriptors are shape inputs only; no entry is invoked.
  const execution={version:1,node:{path:process.execPath,sha256:"a".repeat(64)},entry:{path:path.join(f.dir,"qualified-integration-launch.mjs"),sha256:"b".repeat(64)}};
  expect(validQualifiedIntegrationExecution(execution)).toBe(true);
  expect(validQualifiedIntegrationExecution({...execution,entry:{...execution.entry,path:path.join(f.dir,"another-program.mjs")}})).toBe(false);
  const state:any={version:1,planDigest:progress.planDigest,phase:"captured",workspaces:[],launches:[],grades:structuredClone(progress)};
  expect(validQualifiedIntegrationProgress(state,plan,null)).toBe(true);
  expect(validQualifiedIntegrationProgress(state,plan,execution)).toBe(false);
  const v=plan.recordsValidation;progress.records={tree:v.tree,captureDigest:v.captureDigest,candidateDigest:v.candidateDigest,retained:v.retained,procedural:v.procedural};
  progress.acceptance={planDigest:progress.planDigest,productGradeDigest:"not-owed",recordsGradeDigest:operationDigest(progress.records),attribution:"exact-owned-grades"};
  expect(validQualifiedIntegrationGrades(progress,plan)).toBe(modeledOnly);
  state.phase="ready";state.grades=progress;expect(validQualifiedIntegrationProgress(state,plan,null)).toBe(modeledOnly);
  const pending=structuredClone(state);pending.phase="grading";pending.grades.acceptance=null;expect(validQualifiedIntegrationProgress(pending,plan,null)).toBe(true);
  expect(validQualifiedIntegrationProgress({...state,workspaces:[{}]},plan,null)).toBe(false);
  expect(validQualifiedIntegrationProgress({...state,launches:[{}]},plan,null)).toBe(false);
  const bad=structuredClone(progress);bad.acceptance.recordsGradeDigest=operationDigest(null);expect(validQualifiedIntegrationGrades(bad,plan)).toBe(false);
  const fictional=structuredClone(progress);fictional.product={capture:{complete:true},digest:operationDigest({complete:true})};expect(validQualifiedIntegrationGrades(fictional,plan)).toBe(false);
  // Request validation alone never acquires claims or publishes an operation.
  const records=plan.roles.find((r:any)=>r.role==="records"),product=plan.roles.find((r:any)=>r.role==="product");
  const request={version:1,operationId:input.operationId,kind:"qualified-delivery",coordinator:product.repository,docsDirectory:plan.origins.docs,runtimeDirectory:plan.origins.runtime,
   authority:plan.authority,policySource:await captureQualifiedDeliveryPolicySource(f.product,started.record.attempt),targets:plan.targets,
   route:{name:"local-planned-output-v1",publicationOwed:false,completionOwed:true,policyRevision:product.originalBase},
   landings:[{key:"records",roles:["records"],repository:records.repository,expectedRevision:records.expectedRevision,ref:records.targetRef,commit:records.commit,tree:records.tree,writes:records.writes,working:records.working}],
   integration:{plan,digest:operationDigest(plan),execution:null}};
  expect(validQualifiedPlannedDeliveryRequest(request)).toBe(modeledOnly);
  expect(validQualifiedDeliveryRequest(request)).toBe(modeledOnly);
  if(modeledOnly)for(const change of [
   (r:any)=>{r.integration.digest=operationDigest(null);},
   (r:any)=>{r.integration.execution=execution;},
   (r:any)=>{r.route.policyRevision=records.expectedRevision;},
   (r:any)=>{r.route.publicationOwed=true;},
   (r:any)=>{r.landings[0].commit="f".repeat(40);},
   (r:any)=>{r.landings[0].working.index.resultBase64="";},
   (r:any)=>{r.landings[0].repository.root=path.join(f.dir,"foreign-records");},
   (r:any)=>{r.policySource.attempt="foreign-attempt";},
  ]){const changed=structuredClone(request);change(changed);expect(validQualifiedPlannedDeliveryRequest(changed)).toBe(false);}
  expect(readAcceptedOperation(f.product,input.operationId)).toBeNull();expect(snapshot()).toEqual(before);
 }finally{f.cleanup();installation.cleanup();}
});
