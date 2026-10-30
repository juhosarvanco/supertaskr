import { expect, test } from "@playwright/test";
import { readFileSync, cpSync, existsSync, rmSync } from "node:fs";
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
