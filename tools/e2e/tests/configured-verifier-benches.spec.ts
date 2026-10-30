import {test,expect} from "@playwright/test";
import {readFileSync,symlinkSync,unlinkSync,renameSync} from "node:fs";
import {execFileSync} from "node:child_process";
import path from "node:path";
import {configuredVerificationFixture} from "./configured-verification-fixture";
import {privateGit,putPrivate} from "./private-record-fixture";

test("actual configured verifier creates only its detached complete benches and retains the canonical phase-one preparation",async()=>{
 test.setTimeout(1_200_000);const f=await configuredVerificationFixture();
 try{
  const plan=await import(f.module("configured-verifier-plan")),owner=await import(f.module("configured-verifier-operation")),schema=await import(f.module("configured-verifier-record")),durable=await import(f.module("durable-operation")),brief=await import(f.module("dispatch-brief"));
  const selectors={operationId:"actual-verifier-benches",executorAttempt:f.attempt,native:{sessionId:"actual-verifier-bench-session",coordinatorTurnId:"actual-verifier-bench-turn"},execution:{effort:"medium",deadline:"none",budget:"8000"},benches:[{role:"product",checkout:path.join(f.dir,"new-detached-p  ")},{role:"records",checkout:path.join(f.dir,"new-detached-r  ")}]};
  const proposal=await plan.captureConfiguredVerifierPlan(f.product,selectors,{tool:f.toolHandle}),r=plan.configuredVerifierPlanData(proposal);await owner.beginConfiguredVerifierOperation(proposal,{tool:f.toolHandle});
  const record=()=>durable.readAcceptedOperation(f.product,selectors.operationId),snapshot=()=>[f.product,f.records].map(root=>({head:privateGit(root,["rev-parse","HEAD"]),refs:privateGit(root,["show-ref"]),index:readFileSync(path.join(root,".git/index")).toString("base64"),status:privateGit(root,["status","--porcelain=v1","--untracked-files=all"])})),before=snapshot(),grantPath=path.join(f.product,".supertaskr/dispatch-grant.yaml"),grant=readFileSync(grantPath),captured=record();
  putPrivate(f.product,".supertaskr/dispatch-grant.yaml",brief.composeGrantSnapshot({root:f.product,revision:4,writtenBy:"authored current revocation",blockText:`dispatch:\n  approval: each\n  recovery: repairs\n  grant:\n    given_by: fixture owner\n    at: "2026-10-30T00:00:00Z"\n    revision: 4\n    order: [T-901]\n    cards:\n      T-901: ${r.capsule.task.blobId}\n  revoked:\n    at: "2026-10-30T00:01:00Z"\n    by: fixture owner\n  history: []\n`}));
  await expect(owner.createConfiguredVerifierBenches(f.product,selectors.operationId,{tool:f.toolHandle})).rejects.toMatchObject({code:brief.ADMISSION_CODES.NO_CURRENT_GRANT});expect(record()).toEqual(captured);expect(snapshot()).toEqual(before);putPrivate(f.product,".supertaskr/dispatch-grant.yaml",grant);
  const canary=path.join(f.dir,"foreign-file");putPrivate(f.dir,"foreign-file","foreign remains exact\n");symlinkSync(canary,r.benches[0].checkout);
  await expect(owner.createConfiguredVerifierBenches(f.product,selectors.operationId,{tool:f.toolHandle})).rejects.toMatchObject({code:"configured-verifier-bench-exists"});expect(readFileSync(canary,"utf8")).toBe("foreign remains exact\n");expect(record()).toEqual(captured);unlinkSync(r.benches[0].checkout);
  const created=await owner.createConfiguredVerifierBenches(f.product,selectors.operationId,{tool:f.toolHandle});expect(created).toMatchObject({status:"benches-created",started:false});
  for(const bench of r.benches){expect(privateGit(bench.checkout,["rev-parse","HEAD"])).toBe(bench.candidate);expect(privateGit(bench.checkout,["rev-parse","--abbrev-ref","HEAD"])).toBe("HEAD");expect(privateGit(bench.checkout,["status","--porcelain=v1","--untracked-files=all"])).toBe("");expect(record().operation.progress.benches.find((row:any)=>row.role===bench.role).identity.filesystemRoot).toBe(bench.checkout);}
  const made=record(),worktrees=[f.product,f.records].map(root=>privateGit(root,["worktree","list","--porcelain"]));await owner.createConfiguredVerifierBenches(f.product,selectors.operationId,{tool:f.toolHandle});expect(record()).toEqual(made);expect([f.product,f.records].map(root=>privateGit(root,["worktree","list","--porcelain"]))).toEqual(worktrees);
  await expect(f.review.prepareQualifiedVerification(f.product,{attempt:f.attempt,assignment:schema.configuredVerifierAssignmentData(r),candidate:JSON.stringify(r.executor.candidates)})).rejects.toMatchObject({code:"preflight-operation-pending"});
  await owner.beginConfiguredVerifierPreparation(f.product,selectors.operationId,{tool:f.toolHandle});
  const own=await import(f.module("configured-verifier-context")),owned=await own.captureConfiguredVerifierOperationContext(f.product,selectors.operationId,{tool:f.toolHandle}),alternate=schema.configuredVerifierAssignmentData(r);
  // Same actual PRODUCT/resource/candidates, a different genuine RECORDS
  // bench. Admission request parity alone cannot redeem this assignment.
  alternate.qualified.workers.find((row:any)=>row.role==="records").checkout=f.bench.records;
  const intent=record();await expect(f.review.prepareQualifiedVerification(f.product,{attempt:f.attempt,assignment:alternate,candidate:JSON.stringify(r.executor.candidates),attackSetFile:r.artifacts.attackSet,ownContext:owned})).rejects.toMatchObject({code:"configured-verifier-preparation-assignment"});
  expect(record()).toEqual(intent);expect(f.runs.readRecord(f.product,f.attempt).native.qualifiedPreparations).toBeUndefined();
  const prepared=await owner.prepareConfiguredVerifierPhase1(f.product,selectors.operationId,{tool:f.toolHandle});expect(prepared).toMatchObject({status:"phase1-prepared",path:r.artifacts.phase1,started:false});expect(schema.validConfiguredVerifierRecord(record())).toBe(true);
  const actual=f.review.readQualifiedPreparation(f.product,f.attempt,prepared.preparationDigest),expected=await f.review.captureQualifiedVerifierPreparation(f.product,{executorAttempt:f.attempt,assignment:schema.configuredVerifierAssignmentData(r)});
  expect(actual.entry.authority).toEqual(expected.authority);expect(actual.entry.digest).toBe(expected.digest);expect(actual.entry.consumedBy).toBeNull();expect(actual.entry.seal).toBeNull();expect(actual.entry.authority.workers.map((row:any)=>row.checkout)).toEqual(r.benches.map((row:any)=>row.checkout));expect(actual.entry.authority.role.text).toBe(f.checks.readInstalledMethodAsset(f.toolHandle,"method/roles/verifier.md").text);
  expect(readFileSync(r.artifacts.phase1,"utf8")).toBe(f.review.renderQualifiedPreparationPhase1(f.product,f.attempt,prepared.preparationDigest,r.artifacts.attackSet));
  const sourceFile=f.runs.recordPath(f.product,f.attempt),source=readFileSync(sourceFile),saved=record();expect(saved.operation.progress).toMatchObject({preparation:{stage:"prepared",digest:prepared.preparationDigest},artifacts:{phase1:{stage:"written"},attackSet:null,phase2:null},seal:{stage:"idle"},handoff:{stage:"held",native:null}});
  expect(await owner.prepareConfiguredVerifierPhase1(f.product,selectors.operationId,{tool:f.toolHandle})).toEqual(prepared);expect(record()).toEqual(saved);expect(readFileSync(sourceFile)).toEqual(source);
  renameSync(r.artifacts.phase1,`${r.artifacts.phase1}.original`);execFileSync("mkfifo",[r.artifacts.phase1]);try{await expect(owner.prepareConfiguredVerifierPhase1(f.product,selectors.operationId,{tool:f.toolHandle})).rejects.toMatchObject({code:"configured-arm-brief-changed"});expect(record()).toEqual(saved);}finally{unlinkSync(r.artifacts.phase1);renameSync(`${r.artifacts.phase1}.original`,r.artifacts.phase1);}
  expect(snapshot()).toEqual(before);for(const claim of record().operation.claims)expect(f.runs.readReservation(f.product,claim.resource).attempt).toBe(record().attempt);
 }finally{f.cleanup();}
});
