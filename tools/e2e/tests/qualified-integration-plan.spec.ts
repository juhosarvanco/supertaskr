import {readFileSync,writeFileSync} from "node:fs";
import path from "node:path";
import {test,expect} from "@playwright/test";
import {captureQualifiedIntegrationPlan,qualifiedIntegrationPlanData} from "../scripts/qualified-integration-plan.mjs";
import {validQualifiedIntegrationPlan} from "../scripts/qualified-integration-record.mjs";
import {operationDigest} from "../scripts/operation-record.mjs";
import {startRun,collectRun,qualifiedReviewDigest} from "../scripts/run-record.mjs";
import {readAcceptedOperation} from "../scripts/durable-operation.mjs";
import {handleNativeEvent,nativeSha256} from "../scripts/native-codex.mjs";
import {readMutantBlocks} from "../scripts/merge.mjs";
import {loadInstalledRecordTool} from "../scripts/records-check.mjs";
import {renderFixedProductPrePush} from "../scripts/fixed-product-hook.mjs";
import {privateRecordFixture,fixtureProjectSettings,putPrivate,sha} from "./private-record-fixture";
import {reviewed,writeVerdict,git,put,commit,reading} from "./qualified-delivery-fixture";
// Real source collection and scratch proposals routinely exceed the 30s default.
test.setTimeout(180_000);
const base=Array.from({length:24},(_,at)=>`original line ${at+1}`).join("\n")+"\n",candidate=base.replace("original line 2\n","reviewed line 2\n");
const baseSpec=Array.from({length:24},(_,at)=>`// original spec line ${at+1}`).join("\n")+"\n";
async function fixture(change="mixed",correction:boolean|"wording"=false){
 const installation=privateRecordFixture(),f=await reviewed(false,change,{review:"independent",settings:fixtureProjectSettings(installation),foundation:true,productFiles:{"src/file":base,...(correction===true?{"tests/check.cjs":baseSpec}:{})},candidateProductFiles:change==="records"?{}:{"src/file":candidate}});
 try{
  const prepared=await f.prepare(),sealed=await f.seal(prepared),started:any=await startRun(f.product,{assignment:f.selectVerifier()}),bound=f.bindVerifier(started.record.attempt);
  expect(handleNativeEvent(f.product,f.verifierEvent("PreToolUse")).disposition).toBe("pre-admitted");
  if(correction==="wording"){
   const suffix='\n### Correction 1 — explain the private rule\n\nThis wording-only correction carries no mutant block and pins no property.\n';
   writeVerdict(f,bound,prepared,sealed,(p:any)=>({...p,corrections:[{correction:"Correction 1 — explain the private rule",role:"records",file:"rules/file",wordingOnly:true,why:"A wording change has no executable property to pin."}]}),suffix);
  }else if(correction){
   const worker=prepared.preparation.authority.workers.find((w:any)=>w.role==="product"),root=path.join(f.dir,"correction-readings");git(f.product,["worktree","add","--detach",root,f.candidates.product]);
   const body=baseSpec+'const {test}=require("node:test");const assert=require("node:assert");const fs=require("node:fs");test("exact assigned body",()=>assert.ok(fs.readFileSync("src/file","utf8").includes("corrected line 2\\n"),"exact assigned body"));\n';
   put(root,"tests/check.cjs",body);const red=reading(prepared.preparation.authority,{...worker,checkout:root},commit(root),1,'require("./tests/check.cjs")');
   put(root,"src/file",candidate.replace("reviewed line 2\n","corrected line 2\n"));const green=reading(prepared.preparation.authority,{...worker,checkout:root},commit(root),0,'require("./tests/check.cjs")');
   const suffix='\n### Correction — exact assigned body\n\n```mutant\ncorrection: exact assigned body\nfile: src/file\nspec: tests/check.cjs\nbody: exact assigned body\nmessage: exact assigned body\n--- old\ncorrected line 2\n--- new\nreviewed line 2\n```\n',blocks:any=readMutantBlocks(suffix);
   writeVerdict(f,bound,prepared,sealed,(p:any)=>({...p,corrections:[{correction:"exact assigned body",role:"product",blockDigest:qualifiedReviewDigest(blocks.blocks[0]),bodyHash:nativeSha256(body),red,green}]}),suffix);
   put(f.productBench,"tests/check.cjs",body);commit(f.productBench);
  }else writeVerdict(f,bound,prepared,sealed);
  if(change==="records")git(f.productBench,["commit","--allow-empty","-qm","Verifier history-only PRODUCT output"]);
  expect(handleNativeEvent(f.product,f.verifierEvent("PostToolUse")).disposition).toBe("post-clean");f.finish(started.record.attempt);await collectRun(f.product,{attempt:started.record.attempt,ref:f.verifierRefs()});
  const tool=loadInstalledRecordTool(installation.manifestPath);if(change!=="records")writeFileSync(path.join(f.product,".git/hooks/pre-push"),renderFixedProductPrePush({productRoot:f.product,tool}).bytes,{mode:0o700});
  const input={operationId:"integration-plan-fixture",executorAttempt:f.sourceAttempt,verifierAttempt:started.record.attempt,targets:{product:{ref:"refs/heads/main",expectedRevision:git(f.product,["rev-parse","HEAD"])},records:{ref:"refs/heads/main",expectedRevision:git(f.records,["rev-parse","HEAD"])}}};
  return {...f,tool,input,cleanup(){f.cleanup();installation.cleanup();}};
 }catch(error){f.cleanup();installation.cleanup();throw error;}
}
function snapshot(f:Awaited<ReturnType<typeof fixture>>){return [f.product,f.records].map(root=>({refs:git(root,["for-each-ref","--format=%(refname) %(objectname)"]),objects:git(root,["count-objects","-v"]),index:readFileSync(path.join(root,".git/index")).toString("base64"),status:git(root,["status","--porcelain","--untracked-files=all"])}));}
test("standalone integration planning requires its actual installed owner before reading qualified authority",async()=>{
 const f=privateRecordFixture();try{
  const original=readFileSync(f.manifestPath,"utf8"),manifest=JSON.parse(original),member="tools/e2e/scripts/qualified-integration-plan.mjs";
  manifest.runtime.files=manifest.runtime.files.filter((m:any)=>m.path!==member);manifest.runtime.buildHash=sha(JSON.stringify(manifest.runtime.files));putPrivate(f.tool,"dist/tool-manifest.json",JSON.stringify(manifest));
  const tool=loadInstalledRecordTool(f.manifestPath),input={operationId:"member-refusal",executorAttempt:"T-999-a1",verifierAttempt:"T-999-a2",targets:{product:{ref:"refs/heads/main",expectedRevision:git(f.product,["rev-parse","HEAD"])},records:{ref:"refs/heads/main",expectedRevision:git(f.records,["rev-parse","HEAD"])}}};
  expect(readFileSync(path.join(f.tool,"dist",member),"utf8")).toContain("captureQualifiedIntegrationPlan");
  await expect(captureQualifiedIntegrationPlan(f.product,input,{tool})).rejects.toThrow(/records-tool-runtime-member-required/);
  putPrivate(f.tool,"dist/tool-manifest.json",original);expect(loadInstalledRecordTool(f.manifestPath).package.name).toBe("supertaskr");
 }finally{f.cleanup();}
});
test("pure integration preserves unrelated advanced bases and exact original outputs without any target objects/index/ref writes",async()=>{
 const f=await fixture();try{
  put(f.product,"src/file",base.replace("original line 22\n","later owner line 22\n"));put(f.product,"unrelated-base.txt","Later unrelated committed content\n");f.input.targets.product.expectedRevision=commit(f.product);
  put(f.product,"unrelated-staged.txt","Unrelated staged content\n");git(f.product,["add","unrelated-staged.txt"]);put(f.records,"unrelated-working.md","Unrelated private work\n");
  const before=snapshot(f),proposal=await captureQualifiedIntegrationPlan(f.product,f.input,{tool:f.tool}),plan=qualifiedIntegrationPlanData(proposal),p=plan.roles.find((r:any)=>r.role==="product"),w=p.writes.find((w:any)=>w.path==="src/file");
  expect(validQualifiedIntegrationPlan(plan)).toBe(true);
  expect(snapshot(f)).toEqual(before);expect(readAcceptedOperation(f.product,f.input.operationId)).toBeNull();
  expect(Buffer.from(w.base64,"base64").toString()).toBe(candidate.replace("original line 22\n","later owner line 22\n"));expect(p.writes.some((w:any)=>w.path==="unrelated-base.txt")).toBe(false);
  expect(p.originalBase).not.toBe(p.expectedRevision);expect(p.reviewedOutput.commit).not.toBe(p.commit);expect(p.grade).toMatchObject({status:"owed",commit:p.commit,tree:p.tree});
  expect(()=>qualifiedIntegrationPlanData(structuredClone(proposal))).toThrow(/PROPOSAL_REQUIRED/);expect(plan.authority.frozenAuthority.review.actualOutputs.find((r:any)=>r.role==="product").commit).toBe(p.reviewedOutput.commit);
  const selected=f.input.targets.product.expectedRevision;f.input.targets.product.expectedRevision=p.originalBase;
  await expect(captureQualifiedIntegrationPlan(f.product,f.input,{tool:f.tool})).rejects.toThrow(/STALE_DESTINATION/);expect(snapshot(f)).toEqual(before);f.input.targets.product.expectedRevision=selected;
  const attributes=path.join(f.product,".git/info/attributes");writeFileSync(attributes,"src/file merge=union\n");
  await expect(captureQualifiedIntegrationPlan(f.product,f.input,{tool:f.tool})).rejects.toThrow(/MERGE_POLICY_UNSUPPORTED/);expect(snapshot(f)).toEqual(before);writeFileSync(attributes,"");
  expect((await captureQualifiedIntegrationPlan(f.product,f.input,{tool:f.tool})).roles.find((r:any)=>r.role==="product")?.grade).toBe("owed");
  put(f.product,"src/file",base.replace("original line 2\n","conflicting later owner line 2\n"));f.input.targets.product.expectedRevision=commit(f.product);const conflict=snapshot(f);
  await expect(captureQualifiedIntegrationPlan(f.product,f.input,{tool:f.tool})).rejects.toThrow(/CONFLICT_PENDING/);expect(snapshot(f)).toEqual(conflict);
  put(f.product,"src/file",base.replace("original line 22\n","later owner line 22\n"));f.input.targets.product.expectedRevision=commit(f.product);
  const card="docs/tasks/T-999-private.md",original=readFileSync(path.join(f.records,card),"utf8");put(f.records,card,original.replace("Frozen private contract.","Changed active private contract."));f.input.targets.records.expectedRevision=commit(f.records);const changedContract=snapshot(f);
  await expect(captureQualifiedIntegrationPlan(f.product,f.input,{tool:f.tool})).rejects.toThrow(/CONTRACT_CHANGED/);expect(snapshot(f)).toEqual(changedContract);
  put(f.records,card,original);f.input.targets.records.expectedRevision=commit(f.records);const restored=snapshot(f);
  expect((await captureQualifiedIntegrationPlan(f.product,f.input,{tool:f.tool})).roles.find((r:any)=>r.role==="product")?.grade).toBe("owed");expect(snapshot(f)).toEqual(restored);
 }finally{f.cleanup();}
});
test("a real retained wording-only condition stays pending without guessed replacement bytes or target effects",async()=>{
 const f=await fixture("mixed","wording");try{
  const before=snapshot(f);await expect(captureQualifiedIntegrationPlan(f.product,f.input,{tool:f.tool})).rejects.toThrow(/WORDING_PENDING/);expect(snapshot(f)).toEqual(before);expect(readAcceptedOperation(f.product,f.input.operationId)).toBeNull();
 }finally{f.cleanup();}
});
test("pure mechanical correction preserves the exact verifier body and accepted RED while its resulting whole-tree grade stays owed",async()=>{
 const f=await fixture("mixed",true);try{
  const before=snapshot(f),proposal=await captureQualifiedIntegrationPlan(f.product,f.input,{tool:f.tool}),plan=qualifiedIntegrationPlanData(proposal),p=plan.roles.find((r:any)=>r.role==="product");
  expect(validQualifiedIntegrationPlan(plan)).toBe(true);
  const dropped=structuredClone(plan);dropped.authority.owedCorrections=[];for(const role of dropped.roles)role.corrections=[];
  const {authorityDigest,...droppedBody}=dropped.authority;dropped.authority.authorityDigest=operationDigest(droppedBody);
  expect(validQualifiedIntegrationPlan(dropped)).toBe(false);
  expect(snapshot(f)).toEqual(before);expect(plan.authority.roles.find((r:any)=>r.role==="product").actualOutputGrades[0].exit).toBe(1);expect(plan.authority.owedCorrections).toHaveLength(1);
  expect(Buffer.from(p.writes.find((w:any)=>w.path==="src/file").base64,"base64").toString()).toBe(candidate.replace("reviewed line 2\n","corrected line 2\n"));
  const body=p.writes.find((w:any)=>w.path==="tests/check.cjs");expect(nativeSha256(Buffer.from(body.base64,"base64"))).toBe(plan.authority.owedCorrections[0].bodyHash);expect(p.grade.status).toBe("owed");expect(p.corrections[0]).toMatchObject({projection:"proposed-exact-anchor",grade:"owed"});
  put(f.product,"tests/check.cjs",baseSpec.replace("original spec line 2\n","later spec comment line 2\n"));f.input.targets.product.expectedRevision=commit(f.product);const changed=snapshot(f);
  await expect(captureQualifiedIntegrationPlan(f.product,f.input,{tool:f.tool})).rejects.toThrow(/BODY_CHANGED/);expect(snapshot(f)).toEqual(changed);
  put(f.product,"tests/check.cjs",baseSpec);f.input.targets.product.expectedRevision=commit(f.product);const restored=snapshot(f);
  const original=qualifiedIntegrationPlanData(await captureQualifiedIntegrationPlan(f.product,f.input,{tool:f.tool}));expect(original.roles.find((r:any)=>r.role==="product").grade.status).toBe("owed");expect(snapshot(f)).toEqual(restored);
 }finally{f.cleanup();}
});
test("private-only integration performs canonical record checking and invents no PRODUCT commit or suite obligation",async()=>{
 const f=await fixture("records");try{
  const before=snapshot(f),proposal=await captureQualifiedIntegrationPlan(f.product,f.input,{tool:f.tool}),plan=qualifiedIntegrationPlanData(proposal),p=plan.roles.find((r:any)=>r.role==="product");
  expect(snapshot(f)).toEqual(before);expect(p.commit).toBe(f.input.targets.product.expectedRevision);expect(p.commitBase64).toBeNull();expect(p.writes).toEqual([]);expect(p.grade).toMatchObject({status:"not-owed",kind:"none"});
  expect(p.reviewedOutput.commit).not.toBe(p.originalBase);expect(p.reviewedOutput.tree).toBe(git(f.product,["rev-parse",`${p.originalBase}^{tree}`]));
  expect(plan.recordsValidation).toMatchObject({status:"proposed-validation"});expect(plan.recordsValidation.modeled).toContain("docs/tasks/T-999-private.md");expect(plan.recordsValidation.unmodeled).toContain("rules/file");expect(plan.recordsValidation.indexDerivation?.owed).toBe("coordinator completion");
 }finally{f.cleanup();}
});
