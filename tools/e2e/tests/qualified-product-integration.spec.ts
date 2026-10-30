import path from "node:path";
import os from "node:os";
import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";
import {expect,test} from "@playwright/test";
import {configuredDeliveryFixture} from "./configured-delivery-fixture";
import {privateGit,putPrivate} from "./private-record-fixture";

test("planned PRODUCT foundation uses actual finalized configured readings and preserves advanced target bytes without effects",async()=>{
 test.setTimeout(600_000);const f=await configuredDeliveryFixture();try{
  const [planOwner,records,grades,definition,parentDefinition,operations,hook]=await Promise.all(["qualified-integration-plan","durable-operation","qualified-configured-grades","qualified-integration-record","qualified-delivery-record","operation-record","fixed-product-hook"].map(name=>import(f.module(name))));
  const policySource=await (await import(f.module("qualified-delivery-operation"))).captureQualifiedDeliveryPolicySource(f.product,f.verifierAttempt,{tool:f.tool});
  expect(grades.validQualifiedConfiguredAuthorityGrades(f.authority,policySource)).toBe(true);
  const product=f.authority.roles.find((r:any)=>r.role==="product");
  expect(product.actualOutputGrades[0].configuredGate.complete).toBe(true);expect(product.actualOutputGrades[0].bodies).toBe(1);
  expect(f.authority.frozenAuthority.preparation.card.text).toContain("review: independent");
  putPrivate(f.product,"later-independent.txt","Legitimate advanced PRODUCT base.\n");privateGit(f.product,["add","later-independent.txt"]);privateGit(f.product,["commit","-qm","Later independent PRODUCT history"]);
  f.input.targets.product.expectedRevision=privateGit(f.product,["rev-parse","HEAD"]);
  const snapshot=()=>[f.product,f.records].map(root=>({refs:privateGit(root,["for-each-ref","--format=%(refname) %(objectname)"]),objects:privateGit(root,["count-objects","-v"]),index:readFileSync(path.join(root,".git/index")).toString("base64")})),before=snapshot();
  const proposal=await planOwner.captureQualifiedIntegrationPlan(f.product,f.input,{tool:f.tool}),plan=planOwner.qualifiedIntegrationPlanData(proposal),planned=plan.roles.find((r:any)=>r.role==="product");
  expect(planned.grade.status).toBe("owed");expect(planned.expectedRevision).not.toBe(planned.originalBase);expect(planned.commit).not.toBe(product.actualOutput.commit);
  expect(plan.recordsValidation.unmodeled).toEqual([]);expect(plan.source.configuredDispatch.digest).toBe(f.source.source.capsuleDigest);
  // Definition-only metadata below deliberately has no authentic publication
  // constructor or executable worker. It is never persisted or run, and the
  // registered public request reader must continue to refuse this new route.
  const fixed=hook.qualifyFixedProductPrePush({productRoot:f.product,tool:f.tool}),root=fixed.descriptor;
  const contextBody={version:1,kind:"qualified-publication-context",route:"normal-atomic-fast-forward",coordinatorRoot:f.product,operationId:plan.operationId,authorityDigest:plan.authority.authorityDigest,
   configuration:{revision:planned.commit,digest:plan.configuration.configDigest},tool:f.tool,hook:root,destination:{name:"definition-only",url:"https://github.com/fixture/project.git",ref:"refs/heads/main",expectedOld:planned.expectedRevision,endpoint:{kind:"github",providerRepository:"fixture/project"}},
   transportDigest:operations.operationDigest("authored definition only"),commit:planned.commit,tree:planned.tree,correlationRef:`refs/supertaskr/deliveries/${operations.operationWork(plan.operationId).slice(3)}/publication`,ci:{provider:"github-actions",host:"github.com",repository:"fixture/project",workflow:".github/workflows/ci.yml",event:"push",checks:["Definition only"]}};
  const publication={...contextBody,digest:operations.operationDigest(contextBody)},execution={version:2,node:{path:root.node.path,sha256:root.nodeSha256},entry:{path:path.join(path.dirname(root.entry),"qualified-integration-launch.mjs"),sha256:"1".repeat(64)},worker:{path:path.join(path.dirname(root.entry),"qualified-integration-worker.mjs"),sha256:"2".repeat(64)}};
  const request={version:1,operationId:plan.operationId,kind:"qualified-delivery",coordinator:planned.repository,docsDirectory:plan.origins.docs,runtimeDirectory:plan.origins.runtime,authority:plan.authority,policySource,targets:plan.targets,
   route:{name:"protected-planned-output-v1",publicationOwed:true,completionOwed:true,policyRevision:planned.commit,publication},
   landings:["product","records"].map(role=>plan.roles.find((r:any)=>r.role===role)).filter(role=>role.identity!==null).map(role=>({key:role.role,roles:[role.role],repository:role.repository,expectedRevision:role.expectedRevision,ref:role.targetRef,commit:role.commit,tree:role.tree,writes:role.writes,working:role.working})),
   integration:{plan,digest:operations.operationDigest(plan),execution,resources:definition.qualifiedProductIntegrationResources(plan),executorPolicySource:await(await import(f.module("qualified-delivery-operation"))).captureQualifiedDeliveryPolicySource(f.product,f.attempt,{tool:f.tool})}};
  expect(definition.validQualifiedProductPlannedDeliveryRequest(request)).toBe(true);expect(parentDefinition.validQualifiedDeliveryRequest(request)).toBe(false);
  expect(request.integration.resources.map((r:any)=>r.key)).toEqual(["product","records"]);
  for(const mutate of [
   (r:any)=>{r.integration.resources.pop();},(r:any)=>{r.integration.resources[1].repository=r.integration.resources[0].repository;},
   (r:any)=>{r.integration.executorPolicySource.permission.digest="0".repeat(64);},(r:any)=>{delete r.integration.executorPolicySource.permission;},
   (r:any)=>{r.route.policyRevision=planned.originalBase;},(r:any)=>{r.route.publication.commit=product.actualOutput.commit;},
   (r:any)=>{r.integration.execution.version=1;delete r.integration.execution.worker;},(r:any)=>{r.landings[0].commit=planned.expectedRevision;}
  ]){const changed=structuredClone(request);mutate(changed);expect(definition.validQualifiedProductPlannedDeliveryRequest(changed)).toBe(false);}
  // Progress definition only: these directory/process/artifact descriptors
  // name no actual workspace, launch, result file or accepted grade.
  const progress={version:2,planDigest:operations.operationDigest(plan),phase:"captured",workspaces:[] as any[],launches:[] as any[],observations:[] as any[],
   grades:{version:1,planDigest:operations.operationDigest(plan),product:null,records:null,acceptance:null}};
  expect(definition.validQualifiedIntegrationProgress(progress,plan,execution)).toBe(true);
  const workspacePath=path.join(os.tmpdir(),"definition-only-uncreated-planned-workspace"),workspace={sequence:1,path:workspacePath,token:"workspace-00000000-0000-0000-0000-000000000001",phase:"preparing",createdAt:"2026-10-30T10:00:00.000Z",directory:null as any,repository:null as any,marker:null as any};
  progress.phase="preparing";progress.workspaces.push(workspace);expect(definition.validQualifiedIntegrationProgress(progress,plan,execution)).toBe(true);
  const candidate=path.join(workspacePath,"candidate"),marker=Buffer.from(definition.qualifiedIntegrationWorkspaceMarker(plan.operationId,progress.planDigest,workspace.token));
  workspace.phase="ready";workspace.directory={path:workspacePath,device:"99999999",inode:"1"};workspace.repository={...planned.repository,root:candidate,gitDir:path.join(candidate,".git"),commonDir:path.join(candidate,".git"),
   identities:[candidate,path.join(candidate,".git"),path.join(candidate,".git"),path.join(candidate,".git/objects")].map((file,at)=>({path:file,device:"99999999",inode:String(at+2)}))};
  workspace.marker={path:path.join(workspacePath,"marker.json"),device:"99999999",inode:"6",fileMode:0o600,byteLength:marker.length,sha256:createHash("sha256").update(marker).digest("hex")};
  const launch={sequence:1,workspaceSequence:1,suite:plan.source.configuredDispatch.gatePolicy.required[0],token:"launch-00000000-0000-0000-0000-000000000002",owner:{pid:1,identity:"definition only",token:"definition only"},
   process:{pid:2,identity:"definition only",group:2},node:execution.node,entry:execution.entry,startedAt:workspace.createdAt,result:{kind:"observed-dead",observedAt:"2026-10-30T10:01:00.000Z"},workerResult:null as any};
  progress.phase="grading";progress.launches.push(launch);expect(definition.validQualifiedIntegrationProgress(progress,plan,execution)).toBe(true);
  progress.observations.push({sequence:1,launchSequence:1,observedAt:launch.result.observedAt,kind:"unaccepted-artifact",artifact:{path:path.join(workspacePath,"result-1.json"),device:"99999999",inode:"7",fileMode:0o600,byteLength:42,sha256:"3".repeat(64)}});
  expect(definition.validQualifiedIntegrationProgress(progress,plan,execution)).toBe(true);expect(progress.grades.acceptance).toBeNull();
  const ready=structuredClone(progress);ready.phase="ready";expect(definition.validQualifiedIntegrationProgress(ready,plan,execution)).toBe(false);
  const wrongVersion=structuredClone(progress);wrongVersion.version=1;expect(definition.validQualifiedIntegrationProgress(wrongVersion,plan,execution)).toBe(false);
  const workerObserved=structuredClone(progress);workerObserved.launches[0].workerResult={kind:"thread-exited",threadId:1,exit:0,finishedAt:launch.result.observedAt,artifact:progress.observations[0].artifact,rowDigest:operations.operationDigest("no actual row")};
  expect(definition.validQualifiedIntegrationProgress(workerObserved,plan,execution)).toBe(false); // cannot also claim this artifact is unaccepted
  expect(snapshot()).toEqual(before);expect(records.readAcceptedOperation(f.product,f.input.operationId)).toBeNull();
 }finally{f.cleanup();}
});
