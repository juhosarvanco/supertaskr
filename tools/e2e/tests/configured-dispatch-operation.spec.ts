import { expect, test } from "@playwright/test";
import { readFileSync, cpSync } from "node:fs";
import path from "node:path";
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
  expect(before()).toEqual(original);expect(durable.readAcceptedOperation(f.product,f.request.operationId)).toEqual(rec);
 }finally{f.cleanup();}
});
