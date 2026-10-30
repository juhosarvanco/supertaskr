import {test,expect} from "@playwright/test";
import {readFileSync,existsSync} from "node:fs";
import path from "node:path";
import {createHash} from "node:crypto";
import {configuredVerificationFixture} from "./configured-verification-fixture";
import {privateGit,putPrivate} from "./private-record-fixture";

test("configured verifier constructor derives complete actual finalized source and original role without bench or preparation effects",async()=>{
 test.setTimeout(600_000);const f=await configuredVerificationFixture();
 try{
  const owner=await import(f.module("configured-verifier-plan")),schema=await import(f.module("configured-verifier-record")),durable=await import(f.module("durable-operation"));
  const selectors={operationId:"configured-verifier-new",executorAttempt:f.attempt,native:{sessionId:"original-verifier-coordinator",coordinatorTurnId:"original-verifier-turn"},execution:{effort:"medium",deadline:"none",budget:"8000"},
   benches:[{role:"product",checkout:path.join(f.dir,"new-product-bench  ")},{role:"records",checkout:path.join(f.dir,"new-records-bench  ")}]};
  const sourceFile=f.runs.recordPath(f.product,f.attempt),source=readFileSync(sourceFile),snapshot=()=>[f.product,f.records].map(root=>({head:privateGit(root,["rev-parse","HEAD"]),refs:privateGit(root,["show-ref"]),index:readFileSync(path.join(root,".git/index")).toString("base64"),status:privateGit(root,["status","--porcelain=v1","--untracked-files=all"])})),before=snapshot();
  const pending=owner.captureConfiguredVerifierPlan(f.product,selectors,{tool:f.toolHandle});selectors.execution.effort="xhigh";
  const proposal=await pending,data=owner.configuredVerifierPlanData(proposal);
  expect(schema.validConfiguredVerifierRequest(data)).toBe(true);expect(data.executor.source.attempt).toBe(f.attempt);expect(data.executor.candidates).toEqual(f.candidates);
  expect(data.benches.map((row:any)=>row.role)).toEqual(data.executor.requiredBenchRoles);expect(data.benches.map((row:any)=>({role:row.role,base:row.base,candidate:row.candidate}))).toEqual(data.executor.requiredBenchRoles.map((role:string)=>({role,base:f.revisions[role as keyof typeof f.revisions],candidate:f.candidates[role]})));
  expect(data.role).toMatchObject({role:"verifier",requested:"codex/gpt-6.1-sol@fresh",harness:"codex-desktop-native",model:"gpt-6.1-sol",vehicle:"fresh"});expect(data.execution).toEqual({effort:"medium",deadline:"none",budget:"8000"});
  expect(data.current.revisions).toEqual(f.revisions);expect(data.artifacts.phase1).toContain(path.join(f.product,".supertaskr/briefs"));expect(Object.isFrozen(data)).toBe(true);
  for(const mutate of [(r:any)=>{r.program="caller";},(r:any)=>{r.executor.source.permissionDigest="sha256:"+"0".repeat(64);r.capsule.roles.verifier.model="gpt-6-luna";},(r:any)=>{r.role.model="gpt-6-luna";},(r:any)=>{r.benches.pop();},(r:any)=>{r.benches[0].candidate="0".repeat(40);},(r:any)=>{r.artifacts.phase1=path.join(f.dir,"caller.md");}]){
   const changed=structuredClone(data);mutate(changed);expect(schema.validConfiguredVerifierRequest(changed)).toBe(false);
  }
  await expect(owner.preparedConfiguredVerifierContext(structuredClone(proposal),f.toolHandle)).rejects.toMatchObject({code:"configured-verifier-plan-required"});
  await expect(owner.preparedConfiguredVerifierContext(proposal,structuredClone(f.toolHandle))).rejects.toMatchObject({code:"configured-verifier-plan-required"});
  for(const benches of [selectors.benches.slice(0,1),[...selectors.benches,selectors.benches[0]]])await expect(owner.captureConfiguredVerifierPlan(f.product,{...selectors,benches},{tool:f.toolHandle})).rejects.toMatchObject({code:"configured-verifier-complete-benches"});
  const manifestPath=path.join(f.installed.runtimeRoot,"tool-manifest.json"),manifestBytes=readFileSync(manifestPath);
  try{
   const omitted=JSON.parse(manifestBytes.toString("utf8")),member="tools/e2e/scripts/configured-verifier-plan.mjs";omitted.runtime.files=omitted.runtime.files.filter((row:any)=>row.path!==member);omitted.runtime.buildHash=createHash("sha256").update(JSON.stringify(omitted.runtime.files)).digest("hex");putPrivate(f.installed.runtimeRoot,"tool-manifest.json",JSON.stringify(omitted));
   expect(existsSync(path.join(f.installed.runtimeRoot,member))).toBe(true);const tool=f.checks.loadInstalledRecordTool();await expect(owner.captureConfiguredVerifierPlan(f.product,selectors,{tool})).rejects.toMatchObject({code:"records-tool-runtime-member-required"});
  }finally{putPrivate(f.installed.runtimeRoot,"tool-manifest.json",manifestBytes);}
  expect((await owner.preparedConfiguredVerifierContext(proposal,f.toolHandle)).request).toEqual(data);
  expect(snapshot()).toEqual(before);expect(readFileSync(sourceFile)).toEqual(source);expect(durable.readAcceptedOperation(f.product,selectors.operationId)).toBeNull();for(const bench of data.benches)expect(existsSync(bench.checkout)).toBe(false);for(const file of Object.values(data.artifacts))expect(existsSync(file as string)).toBe(false);
  await f.review.prepareQualifiedVerification(f.product,{attempt:f.attempt,assignment:f.verifier,candidate:JSON.stringify(f.candidates)});
  await expect(owner.captureConfiguredVerifierPlan(f.product,selectors,{tool:f.toolHandle})).rejects.toMatchObject({code:"configured-verifier-existing-preparation"});
 }finally{f.cleanup();}
});

test("configured verifier constructor refuses an actual observed executor before canonical final collection",async()=>{
 test.setTimeout(300_000);const f=await configuredVerificationFixture({finalize:false});
 try{
  const owner=await import(f.module("configured-verifier-plan")),selectors={operationId:"unfinalized-verifier",executorAttempt:f.attempt,native:{sessionId:"original-unfinal-session",coordinatorTurnId:"original-unfinal-turn"},execution:{effort:"medium",deadline:"none",budget:"8000"},benches:[{role:"product",checkout:path.join(f.dir,"absent-p")},{role:"records",checkout:path.join(f.dir,"absent-r")}]};
  const file=f.runs.recordPath(f.product,f.attempt),before=readFileSync(file);expect(f.runs.readRecord(f.product,f.attempt).native.qualified.collection).toBeUndefined();
  await expect(owner.captureConfiguredVerifierPlan(f.product,selectors,{tool:f.toolHandle})).rejects.toMatchObject({code:"QUALIFIED_REVIEW_EXECUTOR_UNFINALIZED"});
  expect(readFileSync(file)).toEqual(before);for(const bench of selectors.benches)expect(existsSync(bench.checkout)).toBe(false);
 }finally{f.cleanup();}
});
