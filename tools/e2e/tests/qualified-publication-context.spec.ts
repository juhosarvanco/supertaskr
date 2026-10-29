import {existsSync,mkdirSync,readFileSync,writeFileSync} from "node:fs";
import path from "node:path";
import {parse,stringify} from "yaml";
import {expect,test} from "@playwright/test";
import {captureQualifiedPublicationContext,qualifiedPublicationContextProof,assertSameQualifiedPublicationContext} from "../scripts/qualified-publication-context.mjs";
import {captureQualifiedDeliveryAuthority} from "../scripts/qualified-delivery.mjs";
import {executeQualifiedLocalDelivery,executeQualifiedPublicationLocalDelivery,replayQualifiedPublicationLocalDelivery} from "../scripts/qualified-delivery-operation.mjs";
import {validQualifiedDeliveryRequest} from "../scripts/qualified-delivery-record.mjs";
import {validOperationRecord} from "../scripts/operation-record.mjs";
import {captureQualifiedOperationRepository,readAcceptedOperation} from "../scripts/durable-operation.mjs";
import {renderFixedProductPrePush} from "../scripts/fixed-product-hook.mjs";
import {startRun,collectRun} from "../scripts/run-record.mjs";
import {handleNativeEvent,nativeShellQuote} from "../scripts/native-codex.mjs";
import {loadInstalledRecordTool} from "../scripts/records-check.mjs";
import {privateRecordFixture,fixtureProjectSettings} from "./private-record-fixture";
import {reviewed,writeVerdict,git} from "./qualified-delivery-fixture";

async function fixture(installHook=true){
 const installation=privateRecordFixture(),settings=parse(fixtureProjectSettings(installation));
 settings.publication={remote:"publish-existing",destinationRef:"refs/heads/main",ci:{provider:"github-actions",host:"github.com",repository:"Fixture/Project",workflow:".github/workflows/ci.yml",event:"push",checks:["Build / Python (Linux)"]}};
 const f=await reviewed(false,"mixed",{review:"independent",settings:stringify(settings),foundation:true});
 try{
  const prepared=await f.prepare(),sealed=await f.seal(prepared),started:any=await startRun(f.product,{assignment:f.selectVerifier()}),bound=f.bindVerifier(started.record.attempt);
  expect(handleNativeEvent(f.product,f.verifierEvent("PreToolUse")).disposition).toBe("pre-admitted");writeVerdict(f,bound,prepared,sealed);
  expect(handleNativeEvent(f.product,f.verifierEvent("PostToolUse")).disposition).toBe("post-clean");f.finish(started.record.attempt);await collectRun(f.product,{attempt:started.record.attempt,ref:f.verifierRefs()});
  const authority=await captureQualifiedDeliveryAuthority(f.product,{executorAttempt:f.sourceAttempt,verifierAttempt:started.record.attempt}),tool=loadInstalledRecordTool(installation.manifestPath);
  const receiver=path.join(f.dir,"existing receiver "),other=path.join(f.dir,"other-existing-receiver");
  for(const root of [receiver,other]){mkdirSync(root);git(root,["init","--bare","--quiet","--initial-branch=main"]);git(f.product,["push",root,`${f.qualified.revisions.product}:refs/heads/main`]);}
  git(f.product,["remote","add","publish-existing",receiver]);
  const hook=path.join(f.product,".git/hooks/pre-push");if(installHook)writeFileSync(hook,renderFixedProductPrePush({productRoot:f.product,tool}).bytes,{mode:0o700});
  return {...f,authority,tool,receiver,other,verifierAttempt:started.record.attempt,cleanup(){f.cleanup();installation.cleanup();}};
 }catch(error){f.cleanup();installation.cleanup();throw error;}
}
test("full publication context freezes actual reviewed output existing destination exact CI and installed guard without writing",async()=>{
 const f=await fixture(),{authority,tool,receiver,other}=f;try{
  const refs=git(f.product,["for-each-ref","--format=%(refname) %(objectname)"]),rrefs=git(f.records,["for-each-ref","--format=%(refname) %(objectname)"]),index=readFileSync(path.join(f.product,".git/index"));
  const context=captureQualifiedPublicationContext(f.product,"frozen-publication",authority,{tool});
  const product=authority.roles.find((r:any)=>r.role==="product");
  expect(context).toMatchObject({commit:product.actualOutput.commit,tree:product.actualOutput.tree,authorityDigest:authority.authorityDigest,destination:{name:"publish-existing",url:receiver,ref:"refs/heads/main",expectedOld:f.qualified.revisions.product,endpoint:{kind:"local",path:receiver,providerRepository:null}},ci:{repository:"fixture/project",checks:["Build / Python (Linux)"]}});
  expect(Object.isFrozen(context.ci.checks)).toBe(true);expect(captureQualifiedOperationRepository(f.product,product.originalBase,qualifiedPublicationContextProof(context)).root).toBe(f.product);
  expect(()=>qualifiedPublicationContextProof(structuredClone(context))).toThrow(/CONTEXT_REQUIRED/);
  expect(git(f.product,["for-each-ref","--format=%(refname) %(objectname)"])).toBe(refs);expect(git(f.records,["for-each-ref","--format=%(refname) %(objectname)"])).toBe(rrefs);expect(readFileSync(path.join(f.product,".git/index"))).toEqual(index);expect(readAcceptedOperation(f.product,"frozen-publication")).toBeNull();
  expect(git(receiver,["rev-parse","refs/heads/main"])).toBe(f.qualified.revisions.product);expect(git(receiver,["for-each-ref","--format=%(refname)",context.correlationRef])).toBe("");
  const canary=path.join(f.dir,"unqualified-uploadpack-canary"),program=`${nativeShellQuote(process.execPath)} -e ${nativeShellQuote(`require('node:fs').writeFileSync(${JSON.stringify(canary)},'Unexpected transport execution')`)}`;
  git(f.product,["config","remote.publish-existing.uploadpack",program]);
  expect(()=>captureQualifiedPublicationContext(f.product,"frozen-publication",authority,{tool})).toThrow(/QUALIFIED_PUBLICATION_TRANSPORT_UNSUPPORTED/);
  expect(existsSync(canary)).toBe(false);expect(git(f.product,["for-each-ref","--format=%(refname) %(objectname)"])).toBe(refs);expect(git(f.records,["for-each-ref","--format=%(refname) %(objectname)"])).toBe(rrefs);expect(readFileSync(path.join(f.product,".git/index"))).toEqual(index);expect(git(receiver,["rev-parse","refs/heads/main"])).toBe(f.qualified.revisions.product);
  git(f.product,["config","--unset","remote.publish-existing.uploadpack"]);
  expect(assertSameQualifiedPublicationContext(context,captureQualifiedPublicationContext(f.product,"frozen-publication",authority,{tool}))).toBe(true);
  git(f.product,["remote","set-url","publish-existing",other]);const changed=captureQualifiedPublicationContext(f.product,"frozen-publication",authority,{tool});
  expect(()=>assertSameQualifiedPublicationContext(context,changed)).toThrow(/CONTEXT_CHANGED/);expect(git(other,["rev-parse","refs/heads/main"])).toBe(f.qualified.revisions.product);
 }finally{f.cleanup();}
});
function input(f:Awaited<ReturnType<typeof fixture>>,operationId:string){return {operationId,executorAttempt:f.sourceAttempt,verifierAttempt:f.verifierAttempt,targets:{product:{ref:"refs/heads/main",expectedRevision:f.qualified.revisions.product},records:{ref:"refs/heads/main",expectedRevision:f.qualified.revisions.records}}};}
test("full route is immutable before local effects and changed publication policy refuses file publish without upgrading the original",async()=>{
 const f=await fixture();try{
  const request=input(f,"full-route-local");let captured=false,changed=false;
  await expect(executeQualifiedPublicationLocalDelivery(f.product,request,{tool:f.tool},{onBoundary(at,rec){
   if(at==="captured"){captured=true;expect(rec.operation.request.route.name).toBe("protected-atomic-push-v1");expect(rec.operation.request.route.publication.destination.expectedOld).toBe(f.qualified.revisions.product);expect(git(f.product,["rev-parse","HEAD"])).toBe(f.qualified.revisions.product);expect(git(f.records,["rev-parse","HEAD"])).toBe(f.qualified.revisions.records);}
   if(at==="product:file-temp-written"&&!changed){changed=true;git(f.product,["remote","set-url","publish-existing",f.other]);}
  }})).rejects.toThrow(/CONTEXT_CHANGED/);
  expect(captured).toBe(true);expect(changed).toBe(true);expect(git(f.product,["rev-parse","HEAD"])).toBe(f.qualified.revisions.product);expect(readFileSync(path.join(f.product,"src/file"),"utf8")).toBe("product base\n");
  const pending=readAcceptedOperation(f.product,request.operationId),frozen=JSON.stringify(pending.operation.request);expect(validQualifiedDeliveryRequest(pending.operation.request)).toBe(true);expect(validOperationRecord(pending)).toBe(true);
  git(f.product,["remote","set-url","publish-existing",f.receiver]);const result=await replayQualifiedPublicationLocalDelivery(f.product,request.operationId,{tool:f.tool});
  expect(result).toMatchObject({status:"local-integrated",publication:"pending",ci:"pending",recordsCompletion:"pending"});const rec=readAcceptedOperation(f.product,request.operationId);expect(JSON.stringify(rec.operation.request)).toBe(frozen);
  for(const l of rec.operation.request.landings)expect(git(l.repository.root,["rev-parse","HEAD"])).toBe(l.commit);
  expect(git(f.receiver,["rev-parse","refs/heads/main"])).toBe(f.qualified.revisions.product);expect(git(f.receiver,["for-each-ref","--format=%(refname)",rec.operation.request.route.publication.correlationRef])).toBe("");
  git(f.product,["remote","set-url","publish-existing",f.other]);expect(await replayQualifiedPublicationLocalDelivery(f.product,request.operationId)).toEqual(result);expect(JSON.stringify(readAcceptedOperation(f.product,request.operationId).operation.request)).toBe(frozen);
 }finally{f.cleanup();}
});
test("an existing legacy local delivery cannot acquire publication selection after its effects",async()=>{
 const f=await fixture(false);try{
  const request=input(f,"legacy-route"),result=await executeQualifiedLocalDelivery(f.product,request),rec=readAcceptedOperation(f.product,request.operationId),original=JSON.stringify(rec);
  await expect(executeQualifiedPublicationLocalDelivery(f.product,request,{tool:f.tool})).rejects.toThrow(/ROUTE_UNFROZEN/);
  expect(JSON.stringify(readAcceptedOperation(f.product,request.operationId))).toBe(original);expect(result.publication).toBe("pending");expect(git(f.receiver,["rev-parse","refs/heads/main"])).toBe(f.qualified.revisions.product);
 }finally{f.cleanup();}
});
