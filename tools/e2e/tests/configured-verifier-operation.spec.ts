import {test,expect} from "@playwright/test";
import {readFileSync,existsSync,cpSync} from "node:fs";
import path from "node:path";
import {configuredVerificationFixture} from "./configured-verification-fixture";
import {privateGit,putPrivate,sha} from "./private-record-fixture";

test("actual verifier OP owns only its captured claims and opaque exact source context preserves current approval",async()=>{
 test.setTimeout(900_000);const f=await configuredVerificationFixture();
 try{
  const plan=await import(f.module("configured-verifier-plan")),owner=await import(f.module("configured-verifier-operation")),context=await import(f.module("configured-verifier-context")),schema=await import(f.module("configured-verifier-record")),admission=await import(f.module("qualified-admission")),dispatch=await import(f.module("configured-dispatch")),durable=await import(f.module("durable-operation")),brief=await import(f.module("dispatch-brief"));
  const selectors={operationId:"actual-verifier-op",executorAttempt:f.attempt,native:{sessionId:"actual-verifier-coordinator",coordinatorTurnId:"actual-verifier-turn"},execution:{effort:"medium",deadline:"none",budget:"8000"},benches:[{role:"product",checkout:path.join(f.dir,"actual-new-p  ")},{role:"records",checkout:path.join(f.dir,"actual-new-r  ")}]};
  const proposal=await plan.captureConfiguredVerifierPlan(f.product,selectors,{tool:f.toolHandle}),data=plan.configuredVerifierPlanData(proposal),sourceFile=f.runs.recordPath(f.product,f.attempt),source=readFileSync(sourceFile);
  const snapshot=()=>[f.product,f.records].map(root=>({head:privateGit(root,["rev-parse","HEAD"]),refs:privateGit(root,["show-ref"]),index:readFileSync(path.join(root,".git/index")).toString("base64"),status:privateGit(root,["status","--porcelain=v1","--untracked-files=all"])})),before=snapshot();
  await expect(owner.beginConfiguredVerifierOperation(structuredClone(proposal),{tool:f.toolHandle})).rejects.toMatchObject({code:"configured-verifier-plan-required"});
  const begun=await owner.beginConfiguredVerifierOperation(proposal,{tool:f.toolHandle}),rec=durable.readAcceptedOperation(f.product,selectors.operationId);
  expect(begun.started).toBe(false);expect(schema.validConfiguredVerifierRecord(rec)).toBe(true);expect(f.runs.validOperationRecord(rec)).toBe(true);expect(rec.operation.request).toEqual(data);
  expect(rec.operation.progress).toMatchObject({benches:[{stage:"captured",identity:null},{stage:"captured",identity:null}],preparation:{stage:"captured",digest:null},artifacts:{phase1:null,attackSet:null,phase2:null},seal:{stage:"idle",measurements:null,digest:null},handoff:{stage:"held",native:null}});
  for(const claim of rec.operation.claims)expect(f.runs.readReservation(f.product,claim.resource).attempt).toBe(rec.attempt);
  for(const mutate of [(r:any)=>{r.operation.progress.benches[0].stage="created";},(r:any)=>{r.operation.progress.preparation={stage:"prepared",digest:"0".repeat(64)};},(r:any)=>{r.operation.progress.seal={stage:"sealed",measurements:"caller",digest:"0".repeat(64)};},(r:any)=>{r.operation.progress.handoff.stage="ready";},(r:any)=>{r.operation.claims[0].releasedAt=new Date().toISOString();r.reservation.releasedAt=r.operation.claims[0].releasedAt;},(r:any)=>{r.operation.progress.ready=true;}]){
   const changed=structuredClone(rec);mutate(changed);expect(schema.validConfiguredVerifierRecord(changed)).toBe(false);
  }
  const retained=await dispatch.captureConfiguredDispatchForRun(f.product,f.attempt,{tool:f.toolHandle}),input={version:1,...data.capsule.selection,roles:data.executor.request.workers.map((row:any)=>row.role),admission:{boundary:"child-start",role:"verifier",kind:"explicit",parent:"",evidence:"",scope:"product-change",attempt:null}};
  await expect(admission.configuredAdmissionPreflight(input,retained.handle)).rejects.toMatchObject({code:"preflight-operation-pending"});
  const own=await context.captureConfiguredVerifierOperationContext(f.product,selectors.operationId,{tool:f.toolHandle});expect((await admission.configuredAdmissionPreflight(input,retained.handle,own)).permitted).toBe(true);
  await expect(admission.configuredAdmissionPreflight(input,retained.handle,structuredClone(own))).rejects.toMatchObject({code:"configured-arm-operation-context"});
  await expect(admission.configuredAdmissionPreflight({...input,admission:{...input.admission,role:"executor"}},retained.handle,own)).rejects.toMatchObject({code:"configured-verifier-operation-source"});
  const alternate=path.join(f.dir,"alternate-verifier-tool");cpSync(f.installed.packageRoot,alternate,{recursive:true});
  const member="method/runtime/process-schema.yaml",manifestPath=path.join(alternate,"dist/tool-manifest.json"),manifest=JSON.parse(readFileSync(manifestPath,"utf8")),changed=readFileSync(path.join(alternate,"dist",member),"utf8")+"\n# Authored alternate METHOD for the same selected project.\n";
  putPrivate(alternate,`dist/${member}`,changed);manifest.method.files.find((row:any)=>row.path===member).sha256=sha(changed);manifest.method.packHash=sha(JSON.stringify(manifest.method.files));putPrivate(alternate,"dist/tool-manifest.json",JSON.stringify(manifest));
  const toolB=f.checks.loadInstalledRecordTool(manifestPath),handleB=dispatch.captureConfiguredDispatch({...data.capsule.selection,tool:toolB});
  expect(handleB.capsule.selection).toEqual(data.capsule.selection);expect(handleB.capsule.process.schemaDigest).not.toBe(data.capsule.process.schemaDigest);
  await expect(admission.configuredAdmissionPreflight(input,handleB,own)).rejects.toMatchObject({code:"configured-verifier-operation-source"});await expect(context.captureConfiguredVerifierOperationContext(f.product,selectors.operationId,{tool:toolB})).rejects.toMatchObject({code:"configured-verifier-operation-tool"});
  const grantPath=path.join(f.product,".supertaskr/dispatch-grant.yaml"),grant=readFileSync(grantPath);
  putPrivate(f.product,".supertaskr/dispatch-grant.yaml",brief.composeGrantSnapshot({root:f.product,revision:4,writtenBy:"authored current revocation",blockText:`dispatch:\n  approval: each\n  recovery: repairs\n  grant:\n    given_by: fixture owner\n    at: "2026-10-30T00:00:00Z"\n    revision: 4\n    order: [T-901]\n    cards:\n      T-901: ${data.capsule.task.blobId}\n  revoked:\n    at: "2026-10-30T00:01:00Z"\n    by: fixture owner\n  history: []\n`}));
  expect((await admission.configuredAdmissionPreflight(input,retained.handle,own)).permitted).toBe(false);putPrivate(f.product,".supertaskr/dispatch-grant.yaml",grant);expect((await admission.configuredAdmissionPreflight(input,retained.handle,own)).permitted).toBe(true);
  expect(snapshot()).toEqual(before);expect(readFileSync(sourceFile)).toEqual(source);expect(durable.readAcceptedOperation(f.product,selectors.operationId)).toEqual(rec);for(const bench of data.benches)expect(existsSync(bench.checkout)).toBe(false);for(const file of Object.values(data.artifacts))expect(existsSync(file as string)).toBe(false);
 }finally{f.cleanup();}
});
