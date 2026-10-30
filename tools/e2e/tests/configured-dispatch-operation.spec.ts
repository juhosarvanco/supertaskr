import { expect, test } from "@playwright/test";
import { readFileSync, cpSync, existsSync, rmSync, symlinkSync, lstatSync, renameSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { cardDrift, MECHANICAL_FIELDS } from "../scripts/dispatch-brief.mjs";
import { configuredArmFixture } from "./configured-dispatch-arm-fixture";
import { privateGit, putPrivate, sha } from "./private-record-fixture";

test("actual captured dispatch OP retains real metadata claims and only its opaque same-owner context can re-enter current approval",async()=>{
 test.setTimeout(240_000);const f=await configuredArmFixture();
 try{
  const owner=await import(f.module("configured-dispatch-operation")),context=await import(f.module("configured-dispatch-context")),admission=await import(f.module("qualified-admission")),runs=await import(f.module("run-record")),schema=await import(f.module("configured-dispatch-record")),durable=await import(f.module("durable-operation")),brief=await import(f.module("dispatch-brief"));
  const proposal=await f.arm.captureConfiguredArmPlan(f.product,f.request,{tool:f.tool}),data=f.arm.configuredArmPlanData(proposal);
  const before=()=>[f.product,f.records].map(root=>({head:privateGit(root,["rev-parse","HEAD"]),refs:privateGit(root,["show-ref"]),index:readFileSync(path.join(root,".git/index")).toString("base64")}));
  const original=before();
  await expect(owner.beginConfiguredArmOperation(structuredClone(proposal),{tool:f.tool})).rejects.toMatchObject({code:"configured-arm-plan-required"});
  const started=await owner.beginConfiguredArmOperation(proposal,{tool:f.tool}),rec=durable.readAcceptedOperation(f.product,f.request.operationId);
  expect(started.started).toBe(false);expect(rec.operation.kind).toBe("configured-dispatch");expect(schema.validConfiguredDispatchRecord(rec)).toBe(true);expect(runs.validOperationRecord(rec)).toBe(true);
  expect(rec.operation.progress).toMatchObject({baseline:{stage:"captured",capture:null},stamp:{stage:"captured",intent:null,acceptance:null},handoff:{stage:"held",source:null,native:null}});
  for(const claim of rec.operation.claims)expect(runs.readReservation(f.product,claim.resource).attempt).toBe(rec.attempt);
  expect(before()).toEqual(original);
  const dispatch=await import(f.module("configured-dispatch")),handle=dispatch.captureConfiguredDispatch({...data.selection,taskId:data.taskId,tool:f.tool});
  const request={version:1,...data.selection,taskId:data.taskId,roles:["product"],admission:{boundary:"lane-cut",role:"executor",kind:"explicit",parent:"",evidence:"",scope:"product-change",attempt:null}};
  await expect(admission.configuredAdmissionPreflight(request,handle)).rejects.toMatchObject({code:"preflight-operation-pending"});
  const own=context.captureConfiguredArmOperationContext(f.product,f.request.operationId,{tool:f.tool}),permitted=await admission.configuredAdmissionPreflight(request,handle,own);
  expect(permitted.permitted).toBe(true);expect(permitted.grant).toEqual(data.admission.grant);expect(permitted.admitted).toBe(false);
  // A second real installation has the same code and committed project but
  // different verified METHOD bytes. Its handle is authentic, not copied data.
  const alternate=path.join(f.dir,"alternate-tool");cpSync(f.installed.packageRoot,alternate,{recursive:true});
  const schemaPath="method/runtime/process-schema.yaml",manifestFile=path.join(alternate,"dist/tool-manifest.json"),manifest=JSON.parse(readFileSync(manifestFile,"utf8"));
  const changed=readFileSync(path.join(alternate,"dist",schemaPath),"utf8")+"\n# Authored alternate TOOL METHOD source for exact correspondence.\n";
  putPrivate(alternate,`dist/${schemaPath}`,changed);manifest.method.files.find((row:any)=>row.path===schemaPath).sha256=sha(changed);manifest.method.packHash=sha(JSON.stringify(manifest.method.files));putPrivate(alternate,"dist/tool-manifest.json",JSON.stringify(manifest));
  const toolB=f.checks.loadInstalledRecordTool(manifestFile),handleB=dispatch.captureConfiguredDispatch({...data.selection,taskId:data.taskId,tool:toolB});
  expect(handleB.capsule.selection).toEqual(handle.capsule.selection);expect(toolB.manifestDigest).not.toBe(f.tool.manifestDigest);expect(handleB.capsule.process.schemaDigest).not.toBe(handle.capsule.process.schemaDigest);
  await expect(admission.configuredAdmissionPreflight(request,handleB,own)).rejects.toMatchObject({code:"configured-arm-operation-capsule"});
  expect(()=>context.captureConfiguredArmOperationContext(f.product,f.request.operationId,{tool:toolB})).toThrow(/configured-arm-operation-tool/);
  expect((await admission.configuredAdmissionPreflight(request,handle,own)).permitted).toBe(true);
  await expect(admission.configuredAdmissionPreflight(request,handle,structuredClone(own))).rejects.toMatchObject({code:"configured-arm-operation-context"});
  await expect(admission.configuredAdmissionPreflight({...request,admission:{...request.admission,role:"verifier"}},handle,own)).rejects.toMatchObject({code:"configured-arm-operation-source"});
  const grantPath=path.join(f.product,".supertaskr/dispatch-grant.yaml"),saved=readFileSync(grantPath);
  putPrivate(f.product,".supertaskr/dispatch-grant.yaml",brief.composeGrantSnapshot({root:f.product,revision:4,writtenBy:"authored revoked fixture",blockText:`dispatch:\n  approval: each\n  recovery: repairs\n  grant:\n    given_by: authored fixture owner\n    at: "2026-10-30T00:00:00Z"\n    revision: 4\n    order: [T-900]\n    cards:\n      T-900: ${data.capsule.task.blobId}\n  revoked:\n    at: "2026-10-30T00:01:00Z"\n    by: authored fixture owner\n  history: []\n`}));
  const revoked=await admission.configuredAdmissionPreflight(request,handle,own);expect(revoked.permitted).toBe(false);expect(revoked.refusals.some((r:any)=>r.code==="preflight-operation-pending")).toBe(false);
  putPrivate(f.product,".supertaskr/dispatch-grant.yaml",saved);expect((await admission.configuredAdmissionPreflight(request,handle,own)).permitted).toBe(true);
  const impossible=structuredClone(rec);impossible.operation.progress.stamp.stage="objects-start";expect(schema.validConfiguredDispatchRecord(impossible)).toBe(false);
  const released=structuredClone(rec);released.operation.claims[0].releasedAt=new Date().toISOString();released.reservation.releasedAt=released.operation.claims[0].releasedAt;expect(schema.validConfiguredDispatchRecord(released)).toBe(false);
  expect(rec.operation.progress.handoff.brief).toBeNull();
  const historicalHeld=structuredClone(rec);delete historicalHeld.operation.progress.handoff.brief;expect(schema.validConfiguredDispatchRecord(historicalHeld)).toBe(true);
  const earlyBrief=structuredClone(rec);earlyBrief.operation.progress.handoff.brief={stage:"captured",path:schema.configuredArmBriefPath(rec.operation.request),text:"caller ready",sha256:sha("caller ready"),identity:null};expect(schema.validConfiguredDispatchRecord(earlyBrief)).toBe(false);
  expect(before()).toEqual(original);expect(durable.readAcceptedOperation(f.product,f.request.operationId)).toEqual(rec);
 }finally{f.cleanup();}
});

test("protected actual private stamp retains the original approval and owns only canonical lifecycle plus INDEX bytes",async()=>{
 test.setTimeout(360_000);const f=await configuredArmFixture();
 try{
  const owner=await import(f.module("configured-dispatch-operation")),context=await import(f.module("configured-dispatch-context")),admission=await import(f.module("qualified-admission")),dispatch=await import(f.module("configured-dispatch")),schema=await import(f.module("configured-dispatch-record")),durable=await import(f.module("durable-operation")),brief=await import(f.module("dispatch-brief"));
  const proposal=await f.arm.captureConfiguredArmPlan(f.product,f.request,{tool:f.tool}),data=f.arm.configuredArmPlanData(proposal),grantPath=path.join(f.product,".supertaskr/dispatch-grant.yaml"),grantBefore=readFileSync(grantPath);
  const product=()=>({head:privateGit(f.product,["rev-parse","HEAD"]),refs:privateGit(f.product,["show-ref"]),index:readFileSync(path.join(f.product,".git/index")).toString("base64")}),before=product();
  await owner.beginConfiguredArmOperation(proposal,{tool:f.tool});
  const stamped=await owner.executeConfiguredArmStamp(f.product,f.request.operationId,{tool:f.tool});expect(stamped).toMatchObject({status:"stamped",started:false,stamp:{commit:data.stamp.commit,tree:data.stamp.tree,previousRevision:data.selection.revisions.records}});
  const rec=durable.readAcceptedOperation(f.product,f.request.operationId);expect(rec.operation.progress.baseline).toMatchObject({stage:"complete",capture:{complete:true,whole:true,required:["python"],candidate:{productRoot:f.product,commit:before.head}}});
  expect(rec.operation.progress.baseline.capture.suites[0].verdict).toMatchObject({verdict:"GREEN",bodies:1});
  expect(rec.operation.request.admission.receipt.cardBlobId).toBe(data.capsule.task.blobId);expect(rec.operation.progress.stamp).toMatchObject({stage:"ref-accepted",acceptance:stamped.stamp});
  expect(privateGit(f.records,["rev-parse","HEAD"])).toBe(data.stamp.commit);
  expect(privateGit(f.records,["diff","--name-only",data.selection.revisions.records,data.stamp.commit]).split("\n").sort()).toEqual(["docs/INDEX.md",f.cardPath].sort());
  for(const write of data.stamp.writes)expect(readFileSync(path.join(f.records,write.path)).toString("base64")).toBe(write.base64);
  expect(product()).toEqual(before);expect(readFileSync(grantPath)).toEqual(grantBefore);
  const selected={...data.selection,revisions:{...data.selection.revisions,records:data.stamp.commit}},handle=dispatch.captureConfiguredDispatch({...selected,taskId:data.taskId,tool:f.tool});
  expect(schema.validConfiguredArmStampedSource(data,handle.capsule)).toBe(true);expect(handle.capsule.receipt.cardBlobId).not.toBe(data.capsule.task.blobId);
  const input={version:1,...selected,taskId:data.taskId,roles:["product"],admission:{boundary:"lane-cut",role:"executor",kind:"explicit",parent:"",evidence:"",scope:"product-change",attempt:null}},own=context.captureConfiguredArmOperationContext(f.product,f.request.operationId,{tool:f.tool});
  const mechanical=await admission.configuredAdmissionPreflight(input,handle,own);expect(mechanical,JSON.stringify(mechanical.refusals)).toMatchObject({permitted:true,policy:{mechanicalDrift:true},grant:data.admission.grant});
  const changed=structuredClone(handle.capsule);changed.task.blobId="0".repeat(40);changed.receipt.cardBlobId=changed.task.blobId;const {digest:discard,...body}=changed;changed.digest=(await import(f.module("operation-record"))).operationDigest(body);expect(schema.validConfiguredArmStampedSource(data,changed)).toBe(false);
  putPrivate(f.product,".supertaskr/dispatch-grant.yaml",brief.composeGrantSnapshot({root:f.product,revision:4,writtenBy:"authored revoked fixture",blockText:`dispatch:\n  approval: each\n  recovery: repairs\n  grant:\n    given_by: authored fixture owner\n    at: "2026-10-30T00:00:00Z"\n    revision: 4\n    order: [T-900]\n    cards:\n      T-900: ${data.capsule.task.blobId}\n  revoked:\n    at: "2026-10-30T00:01:00Z"\n    by: authored fixture owner\n  history: []\n`}));
  expect((await admission.configuredAdmissionPreflight(input,handle,own)).refusals[0].code).toBe("ADMISSION_NO_CURRENT_GRANT");
  // Acknowledged stamp is a past fact; observing it grants no lane/native action
  // and does not rerun baseline suites or change the retained OP on repetition.
  const file=durable.acceptedOperationPath(f.product,rec.operation.id),retained=readFileSync(file),again=await owner.executeConfiguredArmStamp(f.product,f.request.operationId,{tool:f.tool});
  expect(again).toEqual(stamped);expect(readFileSync(file)).toEqual(retained);expect(product()).toEqual(before);expect(privateGit(f.records,["rev-parse","HEAD"])).toBe(data.stamp.commit);
 }finally{f.cleanup();}
});


test("canonical review initialization admits only an empty independent dispatch claim and rejects weaker or changed claims",()=>{
 const card=(review:string|null)=>`---\nid: T-900\nsize: M\nstatus: planned\n${review===null?"":`review: ${review}\n`}---\n\n## Acceptance criteria\n\n- WHEN called THE greeting SHALL return a string.\n`;
 expect(MECHANICAL_FIELDS).not.toContain("review");
 for(const blank of [null,"","null","~"]){expect(cardDrift(card(blank),card("independent")).mechanical).toBe(true);}
 for(const [was,now] of [["","same-model"],["","self-verified"],['"null"',"independent"],['"~"',"independent"],["",'"independent "'],["independent","same-model"],["independent","self-verified"],["independent",""],["independent",null],["same-model","independent"],["self-verified","independent"]] as const){
  const changed=cardDrift(card(was),card(now));expect(changed.mechanical,`${was} -> ${now}`).toBe(false);expect(changed.substantive).toContainEqual(expect.stringContaining("review"));
 }
 const criterion=card("independent").replace("return a string","delete all files");expect(cardDrift(card(""),criterion).mechanical).toBe(false);
});

test("actual configured lane creation preserves foreign destinations and reuses only its retained physical branch",async()=>{
 test.setTimeout(480_000);const f=await configuredArmFixture();
 try{
  const owner=await import(f.module("configured-dispatch-operation")),durable=await import(f.module("durable-operation")),qualified=await import(f.module("qualified-reservation")),brief=await import(f.module("dispatch-brief")),configuredBrief=await import(f.module("configured-dispatch-brief"));
  const proposal=await f.arm.captureConfiguredArmPlan(f.product,f.request,{tool:f.tool}),data=f.arm.configuredArmPlanData(proposal),lane=data.lanes[0];
  const product=()=>({head:privateGit(f.product,["rev-parse","HEAD"]),index:readFileSync(path.join(f.product,".git/index")).toString("base64")}),before=product();
  await owner.beginConfiguredArmOperation(proposal,{tool:f.tool});await owner.executeConfiguredArmStamp(f.product,f.request.operationId,{tool:f.tool});
  putPrivate(lane.checkout,"foreign.txt","authored foreign destination\n");
  await expect(owner.createConfiguredArmLanes(f.product,f.request.operationId,{tool:f.tool})).rejects.toMatchObject({code:"configured-arm-destination-exists"});
  expect(readFileSync(path.join(lane.checkout,"foreign.txt"),"utf8")).toBe("authored foreign destination\n");
  expect(privateGit(f.product,["for-each-ref","--format=%(refname)",lane.branch])).toBe("");
  expect(durable.readAcceptedOperation(f.product,f.request.operationId).operation.progress.lanes[0].stage).toBe("captured");
  rmSync(lane.checkout,{recursive:true});
  const grantPath=path.join(f.product,".supertaskr/dispatch-grant.yaml"),grant=readFileSync(grantPath);
  putPrivate(f.product,".supertaskr/dispatch-grant.yaml",brief.composeGrantSnapshot({root:f.product,revision:4,writtenBy:"authored revoked fixture",blockText:`dispatch:\n  approval: each\n  recovery: repairs\n  grant:\n    given_by: authored fixture owner\n    at: "2026-10-30T00:00:00Z"\n    revision: 4\n    order: [T-900]\n    cards:\n      T-900: ${data.capsule.task.blobId}\n  revoked:\n    at: "2026-10-30T00:01:00Z"\n    by: authored fixture owner\n  history: []\n`}));
  await expect(owner.createConfiguredArmLanes(f.product,f.request.operationId,{tool:f.tool})).rejects.toMatchObject({code:"ADMISSION_NO_CURRENT_GRANT"});
  expect(existsSync(lane.checkout)).toBe(false);expect(product()).toEqual(before);
  putPrivate(f.product,".supertaskr/dispatch-grant.yaml",grant);
  const created=await owner.createConfiguredArmLanes(f.product,f.request.operationId,{tool:f.tool}),record=durable.readAcceptedOperation(f.product,f.request.operationId);
  expect(created).toMatchObject({status:"lanes-created",started:false,lanes:[{role:"product",identity:{filesystemRoot:lane.checkout,gitCommonDirectory:data.repositories.product.commonDir}}]});
  expect(created.lanes[0].identity).toEqual(qualified.measureQualifiedWorker(lane.checkout));expect(record.operation.progress.lanes[0]).toEqual({role:"product",stage:"created",identity:created.lanes[0].identity});
  expect(privateGit(lane.checkout,["symbolic-ref","HEAD"])).toBe(lane.branch);expect(privateGit(lane.checkout,["rev-parse","HEAD"])).toBe(lane.base);
  expect(privateGit(lane.checkout,["status","--porcelain=v1","--untracked-files=all"])).toBe("");expect(product()).toEqual(before);expect(privateGit(f.records,["rev-parse","HEAD"])).toBe(data.stamp.commit);
  const retained=readFileSync(durable.acceptedOperationPath(f.product,f.request.operationId));
  expect(await owner.createConfiguredArmLanes(f.product,f.request.operationId,{tool:f.tool})).toEqual(created);expect(readFileSync(durable.acceptedOperationPath(f.product,f.request.operationId))).toEqual(retained);
  const actualBrief=await configuredBrief.configuredDispatchOwnedBrief(f.product,f.request.operationId,{tool:f.tool});
  expect(actualBrief.findings).toEqual([]);expect(actualBrief).toMatchObject({code:0,complete:true,armed:false});expect(actualBrief.text.match(/^ROW /gm)).toHaveLength(13);
  expect(actualBrief.text).toContain("ACTUAL RETAINED LANES");expect(actualBrief.text).toContain(lane.checkout);expect(actualBrief.text).toContain("Original actual complete baseline");expect(actualBrief.text).not.toContain("PROPOSED ONLY — no lane created");
  expect(readFileSync(durable.acceptedOperationPath(f.product,f.request.operationId))).toEqual(retained);
  putPrivate(lane.checkout,"untracked.py","raise RuntimeError('authored dirty lane')\n");
  await expect(owner.createConfiguredArmLanes(f.product,f.request.operationId,{tool:f.tool})).rejects.toMatchObject({code:"configured-arm-lane-changed"});
  expect(readFileSync(path.join(lane.checkout,"untracked.py"),"utf8")).toContain("authored dirty lane");rmSync(path.join(lane.checkout,"untracked.py"));
  expect(await owner.createConfiguredArmLanes(f.product,f.request.operationId,{tool:f.tool})).toEqual(created);expect(product()).toEqual(before);
 }finally{f.cleanup();}
});

test("actual owned brief persistence rejects a foreign namespace and retains exact fixed Markdown before assignment",async()=>{
 test.setTimeout(600_000);const f=await configuredArmFixture();
 try{
  const owner=await import(f.module("configured-dispatch-operation")),durable=await import(f.module("durable-operation")),schema=await import(f.module("configured-dispatch-record"));
  const proposal=await f.arm.captureConfiguredArmPlan(f.product,f.request,{tool:f.tool}),data=f.arm.configuredArmPlanData(proposal);
  await owner.beginConfiguredArmOperation(proposal,{tool:f.tool});await owner.executeConfiguredArmStamp(f.product,f.request.operationId,{tool:f.tool});await owner.createConfiguredArmLanes(f.product,f.request.operationId,{tool:f.tool});
  const opFile=durable.acceptedOperationPath(f.product,f.request.operationId),before=readFileSync(opFile),file=schema.configuredArmBriefPath(data),outside=path.join(f.dir,"foreign-briefs");
  putPrivate(outside,"canary.txt","outside remains original\n");symlinkSync(outside,path.dirname(file),"dir");
  await expect(owner.prepareConfiguredArmBrief(f.product,f.request.operationId,{tool:f.tool})).rejects.toMatchObject({code:"configured-arm-brief-namespace"});
  expect(readFileSync(path.join(outside,"canary.txt"),"utf8")).toBe("outside remains original\n");expect(existsSync(path.join(outside,path.basename(file)))).toBe(false);expect(readFileSync(opFile)).toEqual(before);rmSync(path.dirname(file));
  const prepared=await owner.prepareConfiguredArmBrief(f.product,f.request.operationId,{tool:f.tool}),rec=durable.readAcceptedOperation(f.product,f.request.operationId),brief=rec.operation.progress.handoff.brief;
  expect(prepared).toEqual({status:"brief-prepared",operationId:data.operationId,path:file,sha256:brief.sha256,started:false});
  expect(brief).toMatchObject({stage:"written",path:file,sha256:sha(brief.text),identity:{path:file,mode:0o600,byteLength:Buffer.byteLength(brief.text),sha256:sha(brief.text)}});
  expect(readFileSync(file,"utf8")).toBe(brief.text);expect(brief.text.match(/^ROW /gm)).toHaveLength(13);expect(brief.text).toContain("ACTUAL RETAINED LANES");expect(lstatSync(file).mode&0o777).toBe(0o600);expect(schema.validConfiguredDispatchRecord(rec)).toBe(true);
  const retained=readFileSync(opFile);expect(await owner.prepareConfiguredArmBrief(f.product,f.request.operationId,{tool:f.tool})).toEqual(prepared);expect(readFileSync(opFile)).toEqual(retained);
  putPrivate(f.product,path.relative(f.product,file),brief.text+"unapproved extra line\n");
  await expect(owner.prepareConfiguredArmBrief(f.product,f.request.operationId,{tool:f.tool})).rejects.toMatchObject({code:"configured-arm-brief-changed"});expect(readFileSync(file,"utf8")).toContain("unapproved extra line");putPrivate(f.product,path.relative(f.product,file),brief.text);
  expect(await owner.prepareConfiguredArmBrief(f.product,f.request.operationId,{tool:f.tool})).toEqual(prepared);
  // Actual repository incarnation, not copied history or the same pathname,
  // anchors even the read-only past stamp observer. Restore each real fixture.
  for(const root of [f.product,f.records]){const held=`${root}-held-original`;renameSync(root,held);cpSync(held,root,{recursive:true});
   try{expect(()=>owner.observeConfiguredArmStamp(f.product,f.request.operationId)).toThrow(/configured-arm-original-changed/);}finally{rmSync(root,{recursive:true});renameSync(held,root);}
  }
  expect(owner.observeConfiguredArmStamp(f.product,f.request.operationId).status).toBe("stamped");expect(readFileSync(opFile)).toEqual(retained);expect(existsSync(path.join(data.lanes[0].checkout,".supertaskr/briefs"))).toBe(false);
 }finally{f.cleanup();}
});

test("installed configured arm releases only its claims and canonically prepares the exact original native assignment",async()=>{
 test.setTimeout(720_000);const f=await configuredArmFixture();
 try{
  const owner=await import(f.module("configured-dispatch-operation")),durable=await import(f.module("durable-operation")),runs=await import(f.module("run-record")),native=await import(f.module("native-codex")),qualifiedNative=await import(f.module("qualified-native")),dispatch=await import(f.module("configured-dispatch")),schema=await import(f.module("configured-dispatch-record")),brief=await import(f.module("dispatch-brief"));
  const grantPath=path.join(f.product,".supertaskr/dispatch-grant.yaml"),grant=readFileSync(grantPath),laneFile=path.join(f.dir,"explicit-arm-lanes.json"),entry=path.join(f.installed.packageRoot,"supertaskr.mjs");putPrivate(f.dir,path.basename(laneFile),JSON.stringify(f.lane));
  const armCommand=[entry,"dispatch","--root",f.product,"--arm","--operation",f.request.operationId,"--task",f.request.taskId,"--session",f.request.native.sessionId,"--turn",f.request.native.coordinatorTurnId,"--effort","medium","--deadline","none","--budget","8000","--lane-intent",laneFile];
  const env={...process.env,NODE_PATH:undefined},snapshot=()=>[f.product,f.records].map(root=>({head:privateGit(root,["rev-parse","HEAD"]),refs:privateGit(root,["show-ref"]),index:readFileSync(path.join(root,".git/index"))})),before=snapshot();
  for(const args of [armCommand.slice(0,-4),[...armCommand,"--continue"],[...armCommand,"--program","not-an-authorized-selector"],[entry,"dispatch","--root",f.product,"--continue","--operation",f.request.operationId,"--effort","medium"]]){
   const invalid=spawnSync(process.execPath,args,{cwd:f.product,encoding:"utf8",env,timeout:15_000,maxBuffer:1024*1024});expect(invalid.status,invalid.stderr).not.toBe(0);expect(snapshot()).toEqual(before);expect(durable.readAcceptedOperation(f.product,f.request.operationId)).toBeNull();
  }
  const actual=spawnSync(process.execPath,armCommand,{cwd:f.product,encoding:"utf8",env,timeout:360_000,maxBuffer:8*1024*1024});expect(actual.status,actual.stderr).toBe(0);
  const prepared=JSON.parse(actual.stdout),op=durable.readAcceptedOperation(f.product,f.request.operationId),data=op.operation.request,rec=runs.readRecord(f.product,data.expectedAttempt);
  expect(prepared).toMatchObject({status:"native-prepared",attempt:data.expectedAttempt,repeated:false,started:false,launch:{model:data.role.model,vehicle:data.role.vehicle,execution:data.execution,brief:op.operation.progress.handoff.brief.path}});
  expect(op).toMatchObject({state:"finished",operation:{progress:{handoff:{stage:"native-prepared",native:{attempt:rec.attempt,assignmentDigest:rec.assignmentDigest,permissionDigest:rec.permission.digest}}}}});
  expect(schema.validConfiguredDispatchRecord(op)).toBe(true);for(const claim of op.operation.claims){expect(claim.releasedAt).not.toBeNull();expect(runs.readReservation(f.product,claim.resource)).toBeNull();}
  await runs.loadQualifiedReservations();
  expect(qualifiedNative.validateQualifiedNative(f.product,rec,true).workers[0].identity).toEqual(op.operation.progress.lanes[0].identity);
  expect(rec.native.qualified.origins.configuredArm).toEqual({operationId:data.operationId,requestDigest:op.operation.digest});expect(schema.validConfiguredArmStampedSource(data,rec.native.qualified.origins.configuredDispatch)).toBe(true);
  expect(rec.assignment).toMatchObject({effort:"medium",budget:"8000",deadline:"none",model:data.role.model,resource:data.lanes[0].checkout,cwd:data.lanes[0].checkout,brief:op.operation.progress.handoff.brief.path});
  expect(readFileSync(grantPath)).toEqual(grant);const retained=readFileSync(durable.acceptedOperationPath(f.product,data.operationId));
  expect(await owner.prepareConfiguredArmNative(f.product,data.operationId,undefined)).toMatchObject({status:"native-prepared",repeated:true,launch:null});expect(readFileSync(durable.acceptedOperationPath(f.product,data.operationId))).toEqual(retained);
  const manifest=readFileSync(path.join(f.installed.runtimeRoot,"tool-manifest.json"));try{
   putPrivate(f.installed.runtimeRoot,"tool-manifest.json","{}\n");
   const replay=spawnSync(process.execPath,[entry,"dispatch","--root",f.product,"--continue","--operation",data.operationId],{cwd:f.product,encoding:"utf8",env,timeout:30_000,maxBuffer:1024*1024});expect(replay.status,replay.stderr).toBe(0);expect(JSON.parse(replay.stdout)).toMatchObject({status:"native-prepared",repeated:true,started:false,launch:null});expect(readFileSync(durable.acceptedOperationPath(f.product,data.operationId))).toEqual(retained);
  }finally{putPrivate(f.installed.runtimeRoot,"tool-manifest.json",manifest);}
  const captured=await dispatch.captureConfiguredDispatchForRun(f.product,rec.attempt,{tool:f.tool});
  await expect(qualifiedNative.startQualifiedNativeRun(f.product,{assignment:rec.assignment,configuredDispatch:captured.handle,configuredArmContext:{operationId:data.operationId,requestDigest:op.operation.digest}})).rejects.toMatchObject({code:"configured-arm-operation-context"});
  const event=(name:string,id:string,command:string)=>({hook_event_name:name,agent_id:"actual-arm-controlled-agent",session_id:rec.assignment.native.sessionId,turn_id:"actual-arm-controlled-turn",tool_name:"Bash",tool_use_id:id,tool_input:{command}});
  expect(native.handleNativeEvent(f.product,event("SubagentStart","start","")).disposition).toBe("start-recorded");
  expect(native.handleNativeEvent(f.product,event("PreToolUse","probe",native.NATIVE_IDENTITY_PROBE)).disposition).toBe("identity-probe-pre");
  expect(native.handleNativeEvent(f.product,{...event("PostToolUse","probe",native.NATIVE_IDENTITY_PROBE),tool_response:"actual-arm-controlled-agent"}).disposition).toBe("identity-probe-post");
  runs.bindRun(f.product,{attempt:rec.attempt,harnessId:"actual-arm-controlled-agent"});
  const command=`cd -- ${native.nativeShellQuote(data.lanes[0].checkout)} && true`;
  expect(native.handleNativeEvent(f.product,event("PreToolUse","checked",command)).disposition).toBe("pre-admitted");expect(native.handleNativeEvent(f.product,event("PostToolUse","checked",command)).disposition).toBe("post-clean");
  putPrivate(f.product,".supertaskr/dispatch-grant.yaml",brief.composeGrantSnapshot({root:f.product,revision:4,writtenBy:"authored revoked fixture",blockText:`dispatch:\n  approval: each\n  recovery: repairs\n  grant:\n    given_by: authored fixture owner\n    at: "2026-10-30T00:00:00Z"\n    revision: 4\n    order: [T-900]\n    cards:\n      T-900: ${data.capsule.task.blobId}\n  revoked:\n    at: "2026-10-30T00:01:00Z"\n    by: authored fixture owner\n  history: []\n`}));
  expect(()=>runs.qualifiedPhasePolicy(f.product,runs.readRecord(f.product,rec.attempt))).toThrow(/ADMISSION_NO_CURRENT_GRANT/);putPrivate(f.product,".supertaskr/dispatch-grant.yaml",grant);
  expect(()=>runs.qualifiedPhasePolicy(f.product,runs.readRecord(f.product,rec.attempt))).not.toThrow();expect(privateGit(data.lanes[0].checkout,["status","--porcelain=v1","--untracked-files=all"])).toBe("");
  expect(privateGit(f.product,["rev-parse","HEAD"])).toBe(data.selection.revisions.product);expect(privateGit(f.records,["rev-parse","HEAD"])).toBe(data.stamp.commit);
 }finally{f.cleanup();}
});

test("cold configured continuation adopts only the actual dead backend after current approval and keeps original execution data",async()=>{
 test.setTimeout(720_000);const f=await configuredArmFixture();
 try{
  const owner=await import(f.module("configured-dispatch-operation")),durable=await import(f.module("durable-operation")),brief=await import(f.module("dispatch-brief")),runs=await import(f.module("run-record"));
  const request={...f.request,execution:{effort:"medium",deadline:"none",budget:"8000"}},requestFile=path.join(f.dir,"original-arm-request.json");putPrivate(f.dir,path.basename(requestFile),JSON.stringify(request));
  const child=spawnSync(process.execPath,["--input-type=module","-e",`
    import {readFileSync} from 'node:fs';
    const [armUrl,ownerUrl,checksUrl,nativeUrl,root,requestFile]=process.argv.slice(1);
    const arm=await import(armUrl),owner=await import(ownerUrl),checks=await import(checksUrl),native=await import(nativeUrl),tool=checks.loadInstalledRecordTool();
    const proposal=await arm.captureConfiguredArmPlan(root,JSON.parse(readFileSync(requestFile,'utf8')),{tool});
    await owner.beginConfiguredArmOperation(proposal,{tool});
    process.stdout.write(JSON.stringify({pid:process.pid}));
    const data=arm.configuredArmPlanData(proposal);
    await native.withNativeDurabilityObserver(event=>{
      if(event.file===data.stamp.working.index.path+'.lock'&&event.stage==='directory-fsync')process.exit(72);
    },()=>owner.executeConfiguredArmStamp(root,data.operationId,{tool}));
    throw Error('actual stamp index-lock boundary was not reached');
  `,f.module("configured-dispatch-arm"),f.module("configured-dispatch-operation"),f.module("records-check"),f.module("native-codex"),f.product,requestFile],{encoding:"utf8",timeout:360_000,maxBuffer:1024*1024});
  expect(child.status,child.stderr).toBe(72);const old=durable.readAcceptedOperation(f.product,request.operationId),data=old.operation.request;
  expect(old.operation.owner.pid).toBe(JSON.parse(child.stdout).pid);expect(old.operation.owner.pid).not.toBe(process.pid);
  expect(old.operation.progress.stamp.stage).toBe("consumer-prepare");expect(JSON.parse(readFileSync(`${data.stamp.working.index.path}.lock`,"utf8"))).toEqual({operationId:request.operationId,token:data.stamp.working.index.lockToken,pid:old.operation.owner.pid});
  const file=durable.acceptedOperationPath(f.product,request.operationId),unchanged=readFileSync(file),grantPath=path.join(f.product,".supertaskr/dispatch-grant.yaml"),grant=readFileSync(grantPath);
  putPrivate(f.product,".supertaskr/dispatch-grant.yaml",brief.composeGrantSnapshot({root:f.product,revision:4,writtenBy:"authored revoked fixture",blockText:`dispatch:\n  approval: each\n  recovery: repairs\n  grant:\n    given_by: authored fixture owner\n    at: "2026-10-30T00:00:00Z"\n    revision: 4\n    order: [T-900]\n    cards:\n      T-900: ${data.capsule.task.blobId}\n  revoked:\n    at: "2026-10-30T00:01:00Z"\n    by: authored fixture owner\n  history: []\n`}));
  await expect(owner.adoptConfiguredArmOperation(f.product,request.operationId,{tool:f.tool})).rejects.toMatchObject({code:"ADMISSION_NO_CURRENT_GRANT"});expect(readFileSync(file)).toEqual(unchanged);expect(existsSync(data.lanes[0].checkout)).toBe(false);
  putPrivate(f.product,".supertaskr/dispatch-grant.yaml",grant);
  const later=spawnSync(process.execPath,["--input-type=module","-e",`
    import {readFileSync,renameSync,unlinkSync} from 'node:fs';import {execFileSync,spawnSync} from 'node:child_process';
    const [ownerUrl,checksUrl,durableUrl,dispatchUrl,contextUrl,schemaUrl,runsUrl,nativeUrl,root,id]=process.argv.slice(1);
    const owner=await import(ownerUrl),checks=await import(checksUrl),durable=await import(durableUrl),dispatch=await import(dispatchUrl),context=await import(contextUrl),schema=await import(schemaUrl),runs=await import(runsUrl),native=await import(nativeUrl),tool=checks.loadInstalledRecordTool();
    await owner.prepareConfiguredArmHandoff(root,id,{tool});
    const op=durable.readAcceptedOperation(root,id),r=op.operation.request,h=op.operation.progress.handoff,held=h.brief.path+'.held';
    let fifo;
    renameSync(h.brief.path,held);
    try {
      execFileSync('mkfifo',[h.brief.path]);
      fifo=spawnSync(process.execPath,['--input-type=module','-e',
        'const [url,root,id]=process.argv.slice(1),owner=await import(url);try{owner.observeConfiguredArmBrief(root,id);console.log(JSON.stringify({code:"not-refused"}));}catch(error){console.log(JSON.stringify({code:error.code}));}',ownerUrl,root,id],{encoding:'utf8',timeout:5000});
    } finally { unlinkSync(h.brief.path);renameSync(held,h.brief.path); }
    if(fifo.status!==0||fifo.error||JSON.parse(fifo.stdout).code!=='configured-arm-brief-changed')throw Error('FIFO original-brief refusal failed');
    const handle=dispatch.captureConfiguredDispatch({...r.selection,revisions:{...r.selection.revisions,records:r.stamp.commit},taskId:r.taskId,tool});
    const own=context.captureConfiguredArmOperationContext(root,id,{tool}),assignment=runs.parseAssignment(schema.configuredArmAssignmentData(r,h));
    await native.startQualifiedNativeRun(root,{assignment,configuredDispatch:handle,configuredArmContext:own});
    process.stdout.write(JSON.stringify({pid:process.pid,fifoCode:JSON.parse(fifo.stdout).code}));
    // Both canonical transactions have returned. The actual native row exists,
    // and the original OP still needs only its metadata acknowledgement.
    process.exit(73);
  `,f.module("configured-dispatch-operation"),f.module("records-check"),f.module("durable-operation"),f.module("configured-dispatch"),f.module("configured-dispatch-context"),f.module("configured-dispatch-record"),f.module("run-record"),f.module("qualified-native"),f.product,request.operationId],{encoding:"utf8",timeout:540_000,maxBuffer:4*1024*1024});
  expect(later.status,later.stderr).toBe(73);expect(JSON.parse(later.stdout).fifoCode).toBe("configured-arm-brief-changed");expect(existsSync(`${data.stamp.working.index.path}.lock`)).toBe(false);
  const awaiting=durable.readAcceptedOperation(f.product,request.operationId),nativeFile=runs.recordPath(f.product,data.expectedAttempt),nativeBefore=readFileSync(nativeFile);
  expect(awaiting).toMatchObject({state:"unknown",operation:{owner:{pid:JSON.parse(later.stdout).pid},progress:{handoff:{stage:"ready",native:null}}}});
  const prepared=await owner.continueConfiguredArmOperation(f.product,request.operationId,undefined),rec=durable.readAcceptedOperation(f.product,request.operationId),native=runs.readRecord(f.product,data.expectedAttempt);
  expect(prepared).toMatchObject({status:"native-prepared",attempt:data.expectedAttempt,repeated:true,launch:null});expect(rec.state).toBe("finished");expect(rec.operation.owner).toEqual(awaiting.operation.owner);expect(rec.operation.owner.token).not.toBe(old.operation.owner.token);expect(readFileSync(nativeFile)).toEqual(nativeBefore);
  expect(rec.operation.request).toEqual(data);expect(native.assignment).toMatchObject({effort:"medium",deadline:"none",budget:"8000"});expect(rec.events.filter((row:any)=>row.op==="configured-backend-adopted")).toHaveLength(1);expect(rec.events.filter((row:any)=>row.op==="configured-baseline-start")).toHaveLength(1);
  const retained=readFileSync(file);expect(await owner.continueConfiguredArmOperation(f.product,request.operationId,undefined)).toMatchObject({status:"native-prepared",repeated:true,launch:null});expect(readFileSync(file)).toEqual(retained);
 }finally{f.cleanup();}
});
