import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { privateGit, putPrivate } from "./private-record-fixture";
import { configuredArmFixture as fixture } from "./configured-dispatch-arm-fixture";

test("configured lane constructor freezes original private stamp, exact absent destinations and owed original baseline without product effects",async()=>{
  test.setTimeout(180_000);const f=await fixture();
  try{
    const snapshot=()=>[f.product,f.records].map(root=>({head:privateGit(root,["rev-parse","HEAD"]),refs:privateGit(root,["show-ref"]),index:readFileSync(path.join(root,".git/index")).toString("base64"),status:privateGit(root,["status","--porcelain=v1","--untracked-files=all"])}));
    const before=snapshot(),proposal=await f.arm.captureConfiguredArmPlan(f.product,f.request,{tool:f.tool}),data=f.arm.configuredArmPlanData(proposal);
    const schema=await import(f.module("configured-dispatch-record"));
    expect(schema.validConfiguredArmRequest(data)).toBe(true);
    expect(data.execution).toBeNull();const legacy=structuredClone(data);delete legacy.execution;expect(schema.validConfiguredArmRequest(legacy)).toBe(true);
    const execution={effort:"medium",deadline:"none",budget:"8000"},pending=f.arm.captureConfiguredArmPlan(f.product,{...f.request,execution},{tool:f.tool});execution.effort="xhigh";
    const explicit=f.arm.configuredArmPlanData(await pending);expect(explicit.execution).toEqual({effort:"medium",deadline:"none",budget:"8000"});expect(explicit.role).toEqual(data.role);expect(schema.validConfiguredArmRequest(explicit)).toBe(true);
    const invalids=[
      (r:any)=>{r.program="caller-selected";},
      (r:any)=>{r.selection.revisions.records="0".repeat(40);},
      (r:any)=>{r.role.model="gpt-6-luna";},
      (r:any)=>{r.stamp.fields.tier="none";},
      (r:any)=>{r.stamp.fields.tier="standard";},
      (r:any)=>{r.stamp.writes[0].base64+="!";},
      (r:any)=>{r.stamp.commitBase64=Buffer.from("unrelated commit").toString("base64");},
      (r:any)=>{r.lanes[0].base="0".repeat(40);},
      (r:any)=>{r.lanes[0].checkout=f.product;},
      (r:any)=>{r.native.ignoredOutputs=["src/"];},
      (r:any)=>{r.baseline={kind:"initialized-code-empty",qualifiedSuiteBaseline:true};},
      (r:any)=>{r.admission.grant.enforced=false;},
      (r:any)=>{r.brief.text+=" caller authority";},
    ];
    for(const mutate of invalids){const changed=structuredClone(data);mutate(changed);expect(schema.validConfiguredArmRequest(changed)).toBe(false);}
    expect(schema.validConfiguredArmRequest(data)).toBe(true);
    expect(data).toMatchObject({operationId:"arm-fixture",taskId:"T-900",expectedAttempt:"T-900-a1",baseline:{kind:"required-original-suites",required:["python"]},role:{harness:"codex-desktop-native",model:"gpt-6.1-sol",vehicle:"subagent"},stamp:{fields:{status:"building",tier:"guarded",review:"independent"}}});
    expect(data.stamp.fields.builder).toBe('"codex/gpt-6.1-sol@subagent"');
    expect(data.lanes).toHaveLength(1);expect(data.lanes[0]).toMatchObject({checkout:f.lane.lanes[0]!.checkout,branch:f.lane.lanes[0]!.branch,base:before[0]!.head});
    expect(data.stamp.writes.map((w:any)=>w.path)).toContain(f.cardPath);expect(data.stamp.writes.map((w:any)=>w.path)).toContain("docs/INDEX.md");
    expect(data.stamp.commit).not.toBe(before[1]!.head);expect(proposal.authority).toContain("no stamp");expect(snapshot()).toEqual(before);expect(existsSync(f.lane.lanes[0]!.checkout)).toBe(false);
    expect(()=>f.arm.configuredArmPlanData(structuredClone(proposal))).toThrow(/configured-arm-plan-required/);
    privateGit(f.product,["branch","T-900-greeting"]);
    await expect(f.arm.captureConfiguredArmPlan(f.product,f.request,{tool:f.tool})).rejects.toMatchObject({code:"configured-arm-branch-exists"});
    privateGit(f.product,["branch","-D","T-900-greeting"]);
    putPrivate(f.product,"extra.py","# Nonignored source affects the exact candidate.\n");
    await expect(f.arm.captureConfiguredArmPlan(f.product,f.request,{tool:f.tool})).rejects.toMatchObject({code:"configured-arm-product-dirty"});
  }finally{f.cleanup();}
});

test("arm planning requires its actual installed producer member and refuses unapproved contract drift before any private or lane effect",async()=>{
  test.setTimeout(240_000);const f=await fixture();
  try{
    const manifestPath=path.join(f.installed.runtimeRoot,"tool-manifest.json"),original=readFileSync(manifestPath,"utf8"),manifest=JSON.parse(original),member="tools/e2e/scripts/configured-dispatch-arm.mjs";
    const {createHash}=await import("node:crypto");manifest.runtime.files=manifest.runtime.files.filter((row:any)=>row.path!==member);
    manifest.runtime.buildHash=createHash("sha256").update(JSON.stringify(manifest.runtime.files)).digest("hex");
    try{
      putPrivate(f.installed.runtimeRoot,"tool-manifest.json",JSON.stringify(manifest));expect(existsSync(path.join(f.installed.runtimeRoot,member))).toBe(true);
      const omitted=f.checks.loadInstalledRecordTool();
      await expect(f.arm.captureConfiguredArmPlan(f.product,f.request,{tool:omitted})).rejects.toMatchObject({code:"records-tool-runtime-member-required"});
    }finally{putPrivate(f.installed.runtimeRoot,"tool-manifest.json",original);}
    const restored=f.checks.loadInstalledRecordTool(),proposal=await f.arm.captureConfiguredArmPlan(f.product,f.request,{tool:restored});
    expect(f.arm.configuredArmPlanData(proposal).taskId).toBe("T-900");
    const old=readFileSync(path.join(f.records,f.cardPath),"utf8");
    putPrivate(f.records,f.cardPath,old.replace("return a string","delete every project file"));privateGit(f.records,["add",f.cardPath]);privateGit(f.records,["commit","-qm","Unapproved actual acceptance contract change"]);
    const heads=[f.product,f.records].map(root=>privateGit(root,["rev-parse","HEAD"]));
    const denied=await f.arm.captureConfiguredArmPlan(f.product,f.request,{tool:restored}).then(()=>null,(error:any)=>error);
    expect(denied).not.toBeNull();expect(denied.code).toBeTruthy();expect(String(denied.code)).not.toMatch(/brief-unanswered|private-check/);
    expect([f.product,f.records].map(root=>privateGit(root,["rev-parse","HEAD"]))).toEqual(heads);expect(existsSync(f.lane.lanes[0]!.checkout)).toBe(false);
  }finally{f.cleanup();}
});
