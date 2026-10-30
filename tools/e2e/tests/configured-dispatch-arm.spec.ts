import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { expect, test } from "@playwright/test";
import { privateGit, privateRecordFixture, putPrivate } from "./private-record-fixture";
import { testToolRuntime } from "../fixtures/tool-runtime";
import { GENERIC_RECORD_PROFILE } from "../scripts/records-validation.mjs";

async function fixture() {
  const f = privateRecordFixture(), installed = testToolRuntime();
  const module = (name:string) => pathToFileURL(path.join(installed.runtimeRoot, "tools/e2e/scripts", `${name}.mjs`)).href;
  const checks = await import(module("records-check")), settingsOwner = await import(module("project-settings")), brief = await import(module("dispatch-brief")), arm = await import(module("configured-dispatch-arm"));
  const tool = checks.loadInstalledRecordTool(), seed = settingsOwner.seedProjectSettings({tool,recordsValidation:GENERIC_RECORD_PROFILE});
  if (seed.status !== "ready") throw Error(JSON.stringify(seed));
  const settings = structuredClone(seed.settings); settings.languages=["python"];
  settings.roles.builder="codex/gpt-6.1-sol@subagent"; settings.roles.verifier="codex/gpt-6.1-sol@fresh";
  settings.guard_class=Object.fromEntries(brief.guardClassIds(checks.readInstalledMethodAsset(tool,"method/tasks/TASK-FORMAT.md").text).map((id:string)=>[id,["checks/"]]));
  settings.suites=[{id:"python",cwd:".",sentinel:"pyproject.toml",argv:["python3","-B","-m","unittest","discover","-s","checks","-v"],solo:false,family:"unittest",why:"Actual configured example"}];
  putPrivate(f.product,".gitignore",".supertaskr/\n"); putPrivate(f.product,"supertaskr.yaml",JSON.stringify(settings));
  putPrivate(f.product,"pyproject.toml","[project]\nname='configured-arm-fixture'\nversion='0.0.0'\n");
  putPrivate(f.product,"checks/test_existing.py","import unittest\nclass Existing(unittest.TestCase):\n    def test_one(self): self.assertTrue(True)\n");
  for(const file of ["AGENTS.md","CLAUDE.md"]) putPrivate(f.product,file,checks.readInstalledMethodAsset(tool,`method/adapters/${file}`).text.replaceAll("<project name>","Arm fixture"));
  privateGit(f.product,["add","."]); privateGit(f.product,["commit","-qm","Authored configured product"]);
  const cardPath="docs/tasks/T-900-lane.md";
  putPrivate(f.records,"docs/INDEX.md","# Fixture index\n");
  putPrivate(f.records,"docs/CONVENTIONS.md","# Conventions\n\n## Build & test\n\nPython3 standard library. Run the exact configured unittest command; no dependency installation is required.\n\n## Gotchas\n\nNo additional gates declared.\n");
  putPrivate(f.records,cardPath,'---\nid: T-900\ntitle: Return a Python greeting\nfeature: F-01\nmilestone: 1\npriority: 1\nsize: M\nstatus: planned\nbuilder:\nverifier:\nreview:\ntouches: ["product::hello.py", "product::checks/test_first.py"]\n---\n\n## Acceptance criteria\n\n- WHEN called THE greeting SHALL return a string.\n');
  privateGit(f.records,["add","."]); privateGit(f.records,["commit","-qm","Actual planned task and selected conventions"]);
  const approve=()=>putPrivate(f.product,".supertaskr/dispatch-grant.yaml",brief.composeGrantSnapshot({root:f.product,revision:3,writtenBy:"authored fixture",blockText:
    `dispatch:\n  approval: each\n  recovery: repairs\n  grant:\n    given_by: authored fixture owner\n    at: "2026-10-30T00:00:00Z"\n    revision: 3\n    order: [T-900]\n    cards:\n      T-900: ${privateGit(f.records,["rev-parse",`HEAD:${cardPath}`])}\n  history: []\n`}));
  approve();
  const lane={version:1,taskId:"T-900",lanes:[{role:"product",branch:"refs/heads/T-900-greeting",checkout:path.join(f.dir,"T-900-worker  ")}]};
  const request={operationId:"arm-fixture",taskId:"T-900",native:{sessionId:"fixture-original-session",coordinatorTurnId:"fixture-original-turn"},laneIntent:lane};
  return {...f,installed,module,checks,tool,arm,settings,cardPath,approve,lane,request};
}

test("configured lane constructor freezes original private stamp, exact absent destinations and owed original baseline without product effects",async()=>{
  test.setTimeout(180_000);const f=await fixture();
  try{
    const snapshot=()=>[f.product,f.records].map(root=>({head:privateGit(root,["rev-parse","HEAD"]),refs:privateGit(root,["show-ref"]),index:readFileSync(path.join(root,".git/index")).toString("base64"),status:privateGit(root,["status","--porcelain=v1","--untracked-files=all"])}));
    const before=snapshot(),proposal=await f.arm.captureConfiguredArmPlan(f.product,f.request,{tool:f.tool}),data=f.arm.configuredArmPlanData(proposal);
    const schema=await import(f.module("configured-dispatch-record"));
    expect(schema.validConfiguredArmRequest(data)).toBe(true);
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
