import {existsSync,mkdirSync,readFileSync,unlinkSync,writeFileSync} from "node:fs";
import {spawn,spawnSync} from "node:child_process";
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
import {loadInstalledRecordTool,createRecordChecker} from "../scripts/records-check.mjs";
import {loadConfiguredGateConfiguration} from "../scripts/gate-run.mjs";
import {privateRecordFixture,fixtureProjectSettings} from "./private-record-fixture";
import {reviewed,writeVerdict,git} from "./qualified-delivery-fixture";
import {publishQualifiedDelivery,observeQualifiedPublication} from "../scripts/qualified-publication-operation.mjs";
import {publicationLaunchAlive} from "../scripts/qualified-publication-process.mjs";
import {reconcileQualifiedDeliveryCi} from "../scripts/qualified-ci-operation.mjs";
import {captureQualifiedCompletionProposal} from "../scripts/qualified-delivery-completion.mjs";
import {completeQualifiedRecordsDelivery} from "../scripts/qualified-completion-operation.mjs";

// Real two-root finalized runs and owned check/push recovery exceed the
// browser harness's 30s default; keep the existing focused acceptance budget.
test.setTimeout(180_000);

async function fixture(installHook=true,actualSuite=false){
 const installation=privateRecordFixture(),settings=parse(fixtureProjectSettings(installation));
 settings.publication={remote:"publish-existing",destinationRef:"refs/heads/main",ci:{provider:"github-actions",host:"github.com",repository:"Fixture/Project",workflow:".github/workflows/ci.yml",event:"push",checks:["Build / Python (Linux)"]}};
 if(actualSuite)settings.suites=[{id:"python",cwd:".",sentinel:"pyproject.toml",argv:["python3","-m","unittest","discover","-s","tests","-p","test_publication.py","-v"],family:"unittest",solo:false,why:"Actual owned protected publication suite"}];
 const productFiles=actualSuite?{"pyproject.toml":"[project]\nname='publication-fixture'\nversion='0.0.0'\n","tests/test_publication.py":`from pathlib import Path\nimport unittest, time, os\nclass ActualPublication(unittest.TestCase):\n def test_candidate_bytes(self):\n  self.assertEqual(Path('src/file').read_text(),'product candidate\\n')\n  count=Path('.supertaskr/publication-suite-count')\n  count.write_text(str(int(count.read_text())+1) if count.exists() else '1')\n  while Path('.supertaskr/publication-check-wait').exists():\n   Path('.supertaskr/publication-check-ready').write_text(str(os.getpid()))\n   time.sleep(0.05)\n`}:undefined;
 const f=await reviewed(false,"mixed",{review:"independent",settings:stringify(settings),foundation:true,...(productFiles?{productFiles,recordsFiles:{"docs/ROADMAP.md":"# Roadmap\n\n## Backbone\n\n- F-04: Publication — qualify the actual paired output.\n\n## Milestones\n\n### Milestone 4 — Local publication fixture (current)\n"}}:{})});
 try{
  const prepared=await f.prepare(),sealed=await f.seal(prepared),started:any=await startRun(f.product,{assignment:f.selectVerifier()}),bound=f.bindVerifier(started.record.attempt);
  expect(handleNativeEvent(f.product,f.verifierEvent("PreToolUse")).disposition).toBe("pre-admitted");writeVerdict(f,bound,prepared,sealed);
  expect(handleNativeEvent(f.product,f.verifierEvent("PostToolUse")).disposition).toBe("post-clean");f.finish(started.record.attempt);await collectRun(f.product,{attempt:started.record.attempt,ref:f.verifierRefs()});
  const authority=await captureQualifiedDeliveryAuthority(f.product,{executorAttempt:f.sourceAttempt,verifierAttempt:started.record.attempt}),tool=loadInstalledRecordTool(installation.manifestPath);
  const receiver=path.join(f.dir,"existing receiver "),other=path.join(f.dir,"other-existing-receiver");
  for(const root of [receiver,other]){mkdirSync(root);git(root,["init","--bare","--quiet","--initial-branch=main"]);git(f.product,["push",root,`${f.qualified.revisions.product}:refs/heads/main`]);}
  git(f.product,["remote","add","publish-existing",receiver]);
  const hook=path.join(f.product,".git/hooks/pre-push");if(installHook)writeFileSync(hook,renderFixedProductPrePush({productRoot:f.product,tool}).bytes,{mode:0o700});
  return {...f,authority,tool,manifestPath:installation.manifestPath,receiver,other,verifierAttempt:started.record.attempt,cleanup(){f.cleanup();installation.cleanup();}};
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
test("owned full publication runs actual configured checks and mandatory guards before exact atomic branch and correlation acceptance",async()=>{
 const f=await fixture(true,true);try{
  const request=input(f,"actual-owned-publication");await executeQualifiedPublicationLocalDelivery(f.product,request,{tool:f.tool});
  const before=readAcceptedOperation(f.product,request.operationId),s=before.operation.request.route.publication,index=readFileSync(path.join(f.product,".git/index"));
  const configuration=loadConfiguredGateConfiguration({productRoot:f.product,productRevision:s.commit,tool:f.tool}),checker=createRecordChecker({profile:configuration.settings.records.validation,tool:f.tool});
  const board=checker.evaluate(checker.capture({productRoot:f.product,productRevision:s.commit,recordsRevision:git(f.records,["rev-parse","HEAD"])}),[]);
  expect(board.wholeBoardClean,JSON.stringify({diagnostics:board.diagnostics,blocking:board.blocking,retained:board.retained})).toBe(true);
  const refs=git(f.product,["for-each-ref","--format=%(refname) %(objectname)"]),rrefs=git(f.records,["for-each-ref","--format=%(refname) %(objectname)"]);
  let manualChecked=false;
  const result=await publishQualifiedDelivery(f.product,request.operationId,{tool:f.tool},{onOutput(kind,bytes){if(kind==="stderr")process.stderr.write(bytes);},onBoundary(at){
   if(at!=="checks-ready")return;manualChecked=true;
   const manual=spawnSync("git",["--no-replace-objects","-C",f.product,"push","--atomic",s.destination.url,`${s.commit}:${s.destination.ref}`,`${s.commit}:${s.correlationRef}`],{encoding:"utf8"});
   expect(manual.status,manual.stderr).not.toBe(0);expect(manual.stderr).toContain("QUALIFIED_PUBLICATION_LAUNCH_REQUIRED");
   expect(git(f.receiver,["rev-parse",s.destination.ref])).toBe(s.destination.expectedOld);expect(git(f.receiver,["for-each-ref","--format=%(refname)",s.correlationRef])).toBe("");
   const harness=spawnSync(process.execPath,[s.hook.entry,"--root",f.product,"--mode","pre-tool"],{cwd:f.product,input:JSON.stringify({tool_name:"Bash",cwd:f.product,tool_input:{command:`git push publish-existing ${s.commit}:${s.destination.ref}`}}),encoding:"utf8"});
   expect(harness.status,harness.stderr).toBe(2);expect(harness.stderr).toContain("QUALIFIED_PUBLICATION_COMMAND_CHANGED");
  }});expect(manualChecked).toBe(true);
  expect(result).toMatchObject({status:"published",ci:"pending",recordsCompletion:"pending",publication:{commit:s.commit,tree:s.tree,ref:s.destination.ref,previousRevision:s.destination.expectedOld,correlationRef:s.correlationRef,attribution:"exact"}});
  expect(git(f.receiver,["rev-parse",s.destination.ref])).toBe(s.commit);expect(git(f.receiver,["rev-parse",s.correlationRef])).toBe(s.commit);
  expect(readFileSync(path.join(f.product,".supertaskr/publication-suite-count"),"utf8")).toBe("1");
  const row=readAcceptedOperation(f.product,request.operationId);expect(validOperationRecord(row)).toBe(true);expect(row.operation.publication.phase).toBe("published");expect(row.operation.publication.launches.map((l:any)=>l.stage)).toEqual(["checks","push"]);expect(row.operation.publication.launches.every((l:any)=>l.result.kind==="exited"&&l.result.exit===0)).toBe(true);
  expect(JSON.stringify(row.operation.request)).toBe(JSON.stringify(before.operation.request));expect(row.state).toBe("unknown");expect(row.operation.claims.every((c:any)=>c.releasedAt===null)).toBe(true);
  expect(git(f.product,["for-each-ref","--format=%(refname) %(objectname)"])).toBe(refs);expect(git(f.records,["for-each-ref","--format=%(refname) %(objectname)"])).toBe(rrefs);expect(readFileSync(path.join(f.product,".git/index"))).toEqual(index);
  git(f.product,["remote","set-url","publish-existing",f.other]);expect(await publishQualifiedDelivery(f.product,request.operationId,{tool:null})).toEqual(result);expect(readFileSync(path.join(f.product,".supertaskr/publication-suite-count"),"utf8")).toBe("1");
 }finally{f.cleanup();}
});
test("actual advertised branch change cannot acquire correlation and the same original capture resumes after its expected tip is restored",async()=>{
 const f=await fixture(true,true);try{
  const request=input(f,"advertised-race");await executeQualifiedPublicationLocalDelivery(f.product,request,{tool:f.tool});
  const original=readAcceptedOperation(f.product,request.operationId),s=original.operation.request.route.publication;let changed=false;
  // Populate only the immutable candidate objects in this owned fixture;
  // neither intended receiver ref has accepted that candidate yet.
  git(f.receiver,["fetch","--no-write-fetch-head","--no-tags",f.product,s.commit]);
  await expect(publishQualifiedDelivery(f.product,request.operationId,{tool:f.tool},{onBoundary(at){if(at==="push:launch-recorded"&&!changed){changed=true;git(f.receiver,["update-ref",s.destination.ref,s.commit,s.destination.expectedOld]);}}})).rejects.toThrow(/ACCEPTANCE_UNCERTAIN/);
  expect(changed).toBe(true);expect(git(f.receiver,["rev-parse",s.destination.ref])).toBe(s.commit);expect(git(f.receiver,["for-each-ref","--format=%(refname)",s.correlationRef])).toBe("");
  const pending=readAcceptedOperation(f.product,request.operationId);expect(JSON.stringify(pending.operation.request)).toBe(JSON.stringify(original.operation.request));expect(pending.operation.publication.acceptance).toBeNull();expect(pending.operation.publication.launches.at(-1).result.exit).not.toBe(0);
  git(f.receiver,["update-ref",s.destination.ref,s.destination.expectedOld,s.commit]);
  expect(await publishQualifiedDelivery(f.product,request.operationId,{tool:f.tool})).toMatchObject({status:"published",publication:{commit:s.commit}});
  expect(git(f.receiver,["rev-parse",s.correlationRef])).toBe(s.commit);expect(readFileSync(path.join(f.product,".supertaskr/publication-suite-count"),"utf8")).toBe("1");
 }finally{f.cleanup();}
});
test("revocation after durable launch capture prevents the child effect and restoration resumes without rerunning accepted checks",async()=>{
 const f=await fixture(true,true);try{
  const request=input(f,"publication-current-policy");await executeQualifiedPublicationLocalDelivery(f.product,request,{tool:f.tool});
  const original=readAcceptedOperation(f.product,request.operationId),s=original.operation.request.route.publication;let revoked=false;
  await expect(publishQualifiedDelivery(f.product,request.operationId,{tool:f.tool},{onBoundary(at){if(at==="push:launch-recorded"&&!revoked){revoked=true;f.grant(undefined,true);}}})).rejects.toThrow(/PUSH_REFUSED/);
  expect(revoked).toBe(true);expect(git(f.receiver,["rev-parse",s.destination.ref])).toBe(s.destination.expectedOld);expect(git(f.receiver,["for-each-ref","--format=%(refname)",s.correlationRef])).toBe("");
  const pending=readAcceptedOperation(f.product,request.operationId);expect(JSON.stringify(pending.operation.request)).toBe(JSON.stringify(original.operation.request));expect(pending.operation.publication.acceptance).toBeNull();
  f.grant();expect(await publishQualifiedDelivery(f.product,request.operationId,{tool:f.tool})).toMatchObject({status:"published",ci:"pending"});expect(readFileSync(path.join(f.product,".supertaskr/publication-suite-count"),"utf8")).toBe("1");
 }finally{f.cleanup();}
});
test("cold publication recovery observes exact original acceptance after later receiver advance before successor policy or TOOL",async()=>{
 const f=await fixture(true,true);try{
  const request=input(f,"publication-cold-accepted");
  const source=`const [{executeQualifiedPublicationLocalDelivery},{publishQualifiedDelivery},{loadInstalledRecordTool}]=await Promise.all([import(process.argv[1]),import(process.argv[2]),import(process.argv[3])]);const tool=loadInstalledRecordTool(process.argv[4]),root=process.argv[5],input=JSON.parse(process.argv[6]);await executeQualifiedPublicationLocalDelivery(root,input,{tool});await publishQualifiedDelivery(root,input.operationId,{tool},{onBoundary(at){if(at==='push:effect-observed')process.exit(31)}});process.exit(32);`;
  const child=spawn(process.execPath,["--input-type=module","-e",source,new URL("../scripts/qualified-delivery-operation.mjs",import.meta.url).href,new URL("../scripts/qualified-publication-operation.mjs",import.meta.url).href,new URL("../scripts/records-check.mjs",import.meta.url).href,f.manifestPath,f.product,JSON.stringify(request)],{stdio:["ignore","pipe","pipe"]});
  let out="",err="";child.stdout?.on("data",bytes=>{out+=bytes;});child.stderr?.on("data",bytes=>{err+=bytes;});
  const exit=await new Promise(resolve=>child.once("close",resolve));expect(exit,out+err).toBe(31);
  const pending=readAcceptedOperation(f.product,request.operationId),s=pending.operation.request.route.publication;
  expect(pending.operation.publication.phase).toBe("pushing");expect(pending.operation.publication.acceptance).toBeNull();expect(git(f.receiver,["rev-parse",s.correlationRef])).toBe(s.commit);
  const later=git(f.receiver,["commit-tree",s.tree,"-p",s.commit,"-m","Legitimate later receiver commit"]);git(f.receiver,["update-ref",s.destination.ref,later,s.commit]);
  git(f.product,["remote","set-url","publish-existing",f.other]);writeFileSync(path.join(f.product,".supertaskr/workspace-binding.json"),"invalid successor binding\n");
  const result=await publishQualifiedDelivery(f.product,request.operationId,{tool:null});
  expect(result).toMatchObject({status:"published",publication:{commit:s.commit,tree:s.tree},ci:"pending",recordsCompletion:"pending"});
  expect(git(f.receiver,["rev-parse",s.destination.ref])).toBe(later);expect(git(f.receiver,["rev-parse",s.correlationRef])).toBe(s.commit);
  const observed=readAcceptedOperation(f.product,request.operationId);expect(observed.operation.publication.phase).toBe("published");expect(validOperationRecord(observed)).toBe(true);expect(JSON.stringify(observed.operation.request)).toBe(JSON.stringify(pending.operation.request));expect(readFileSync(path.join(f.product,".supertaskr/publication-suite-count"),"utf8")).toBe("1");
 }finally{f.cleanup();}
});
test("coordinator loss stops its actual running check group and a new process resumes the original pending operation",async()=>{
 const f=await fixture(true,true);let child:ReturnType<typeof spawn>|undefined;let done:Promise<number|null>|undefined;try{
  const request=input(f,"publication-owned-cancellation"),wait=path.join(f.product,".supertaskr/publication-check-wait"),ready=path.join(f.product,".supertaskr/publication-check-ready");writeFileSync(wait,"Owned fixture barrier\n");
  const source=`const [{executeQualifiedPublicationLocalDelivery},{publishQualifiedDelivery},{loadInstalledRecordTool}]=await Promise.all([import(process.argv[1]),import(process.argv[2]),import(process.argv[3])]);const tool=loadInstalledRecordTool(process.argv[4]),root=process.argv[5],input=JSON.parse(process.argv[6]);await executeQualifiedPublicationLocalDelivery(root,input,{tool});await publishQualifiedDelivery(root,input.operationId,{tool});`;
  child=spawn(process.execPath,["--input-type=module","-e",source,new URL("../scripts/qualified-delivery-operation.mjs",import.meta.url).href,new URL("../scripts/qualified-publication-operation.mjs",import.meta.url).href,new URL("../scripts/records-check.mjs",import.meta.url).href,f.manifestPath,f.product,JSON.stringify(request)],{stdio:["ignore","pipe","pipe"]});
  let out="",err="",ended=false;child.stdout?.on("data",bytes=>{out+=bytes;});child.stderr?.on("data",bytes=>{err+=bytes;});done=new Promise(resolve=>child?.once("close",code=>{ended=true;resolve(code);}));
  for(let at=0;at<1200&&!existsSync(ready)&&!ended;at++)await new Promise(resolve=>setTimeout(resolve,50));
  expect(existsSync(ready),out+err).toBe(true);
  const original=readAcceptedOperation(f.product,request.operationId),launch=original.operation.publication.launches.at(-1),s=original.operation.request.route.publication;
  expect(launch.stage).toBe("checks");expect(publicationLaunchAlive(launch)).toBe(true);child.kill("SIGKILL");await done;
  for(let at=0;at<200&&publicationLaunchAlive(launch);at++)await new Promise(resolve=>setTimeout(resolve,25));
  expect(publicationLaunchAlive(launch)).toBe(false);expect(git(f.receiver,["rev-parse",s.destination.ref])).toBe(s.destination.expectedOld);expect(git(f.receiver,["for-each-ref","--format=%(refname)",s.correlationRef])).toBe("");
  unlinkSync(wait);expect(await publishQualifiedDelivery(f.product,request.operationId,{tool:f.tool})).toMatchObject({status:"published",ci:"pending"});
  const recovered=readAcceptedOperation(f.product,request.operationId);expect(recovered.operation.publication.launches[0].result.kind).toBe("observed-dead");expect(JSON.stringify(recovered.operation.request)).toBe(JSON.stringify(original.operation.request));expect(readFileSync(path.join(f.product,".supertaskr/publication-suite-count"),"utf8")).toBe("2");
 }finally{if(child&&child.exitCode===null&&child.signalCode===null){child.kill("SIGKILL");await done;}f.cleanup();}
});
test("cold local replay preserves the Git-start marker before transport and reuses actual completed checks",async()=>{
 const f=await fixture(true,true);try{
  const request=input(f,"publication-cold-before-git");
  const source=`const [{executeQualifiedPublicationLocalDelivery},{publishQualifiedDelivery},{loadInstalledRecordTool}]=await Promise.all([import(process.argv[1]),import(process.argv[2]),import(process.argv[3])]);const tool=loadInstalledRecordTool(process.argv[4]),root=process.argv[5],input=JSON.parse(process.argv[6]);await executeQualifiedPublicationLocalDelivery(root,input,{tool});await publishQualifiedDelivery(root,input.operationId,{tool},{onBoundary(at){if(at==='push:git-started')process.exit(31)}});process.exit(32);`;
  const child=spawn(process.execPath,["--input-type=module","-e",source,new URL("../scripts/qualified-delivery-operation.mjs",import.meta.url).href,new URL("../scripts/qualified-publication-operation.mjs",import.meta.url).href,new URL("../scripts/records-check.mjs",import.meta.url).href,f.manifestPath,f.product,JSON.stringify(request)],{stdio:["ignore","pipe","pipe"]});
  let err="";child.stdout?.resume();child.stderr?.on("data",bytes=>{err+=bytes;});expect(await new Promise(resolve=>child.once("close",resolve)),err).toBe(31);
  const pending=readAcceptedOperation(f.product,request.operationId),l=pending.operation.publication.launches.at(-1),s=pending.operation.request.route.publication;
  expect(l.gitStarted).toBe(true);expect(l.result).toBeNull();for(let at=0;at<200&&publicationLaunchAlive(l);at++)await new Promise(resolve=>setTimeout(resolve,25));expect(publicationLaunchAlive(l)).toBe(false);
  expect(git(f.receiver,["rev-parse",s.destination.ref])).toBe(s.destination.expectedOld);expect(git(f.receiver,["for-each-ref","--format=%(refname)",s.correlationRef])).toBe("");
  expect(observeQualifiedPublication(f.product,request.operationId).status).toBe("pending");
  expect(await publishQualifiedDelivery(f.product,request.operationId,{tool:f.tool})).toMatchObject({status:"published",ci:"pending"});
  const accepted=readAcceptedOperation(f.product,request.operationId);expect(accepted.operation.publication.launches[1].result.kind).toBe("observed-dead");expect(accepted.operation.publication.launches[1].gitStarted).toBe(true);expect(accepted.operation.publication.launches.at(-1).gitStarted).toBe(true);
  expect(JSON.stringify(accepted.operation.request)).toBe(JSON.stringify(pending.operation.request));expect(readFileSync(path.join(f.product,".supertaskr/publication-suite-count"),"utf8")).toBe("1");
 }finally{f.cleanup();}
});
test("actual local Git acceptance cannot become GitHub CI authority or mutate validation progress",async()=>{
 const f=await fixture(true,true);try{
  const request=input(f,"local-is-not-provider");await executeQualifiedPublicationLocalDelivery(f.product,request,{tool:f.tool});
  await publishQualifiedDelivery(f.product,request.operationId,{tool:f.tool});
  const original=readAcceptedOperation(f.product,request.operationId),bytes=JSON.stringify(original),p=git(f.product,["for-each-ref","--format=%(refname) %(objectname)"]),r=git(f.records,["for-each-ref","--format=%(refname) %(objectname)"]);
  await expect(reconcileQualifiedDeliveryCi(f.product,request.operationId,{tool:f.tool})).rejects.toThrow(/CI_PROVIDER_ORIGIN_UNAVAILABLE/);
  expect(JSON.stringify(readAcceptedOperation(f.product,request.operationId))).toBe(bytes);expect(original.operation.validation).toBeUndefined();expect(validOperationRecord(original)).toBe(true);
  expect(()=>captureQualifiedCompletionProposal(f.product,request.operationId,{tool:f.tool})).toThrow(/QUALIFIED_COMPLETION_CI_PENDING/);
  await expect(completeQualifiedRecordsDelivery(f.product,request.operationId,{tool:f.tool})).rejects.toThrow(/QUALIFIED_COMPLETION_CI_PENDING/);
  expect(JSON.stringify(readAcceptedOperation(f.product,request.operationId))).toBe(bytes);expect(original.operation.completion).toBeUndefined();
  expect(git(f.product,["for-each-ref","--format=%(refname) %(objectname)"])).toBe(p);expect(git(f.records,["for-each-ref","--format=%(refname) %(objectname)"])).toBe(r);
 }finally{f.cleanup();}
});
