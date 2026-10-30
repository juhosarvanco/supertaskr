import {existsSync,rmSync} from "node:fs";
import {spawnSync} from "node:child_process";
import path from "node:path";
import {pathToFileURL} from "node:url";
import {expect,test} from "@playwright/test";
import {privateRecordFixture,privateGit,putPrivate} from "./private-record-fixture";
import {testToolRuntime} from "../fixtures/tool-runtime";

/** Actual retained, native-bound source. Authored hook callbacks are fixture
 * identity observations, not a live model or independent ancestry proof. */
async function fixture() {
 const f=privateRecordFixture(),installed=testToolRuntime();
 const module=(name:string)=>pathToFileURL(path.join(installed.runtimeRoot,"tools/e2e/scripts",`${name}.mjs`)).href;
 const runs=await import(module("run-record")),native=await import(module("native-codex")),admission=await import(module("dispatch-brief")),
  checker=await import(module("records-check")),settingsOwner=await import(module("project-settings")),qualifier=await import(module("qualified-reservation")),
  grade=await import(module("configured-dispatch-grade")),configured=await import(module("configured-dispatch"));
 const profile=await import(module("records-validation"));
 const tool=checker.loadInstalledRecordTool(),seed=settingsOwner.seedProjectSettings({tool,recordsValidation:profile.GENERIC_RECORD_PROFILE});
 if(seed.status!=="ready")throw Error(JSON.stringify(seed));
 const settings=structuredClone(seed.settings);settings.languages=["python"];
 settings.roles.builder="codex/gpt-6.1-sol@fresh";settings.roles.verifier="codex/gpt-6.1-sol@fresh";
 settings.guard_class=Object.fromEntries(admission.guardClassIds(checker.readInstalledMethodAsset(tool,"method/tasks/TASK-FORMAT.md").text).map((id:string)=>[id,["checks/"]]));
 settings.suites=["first","second"].map(id=>({id,cwd:".",sentinel:"pyproject.toml",argv:["python3","-B","-m","unittest","discover","-s",`checks/${id}`,"-v"],family:"unittest",solo:false,why:"Actual original retained worker test bodies"}));
 const trigger=path.join(f.dir,"pause-during-suite"),witness=path.join(f.dir,"second-suite-ran"),pause=path.join(f.product,admission.PAUSE_REL_PATH);
 putPrivate(f.product,".gitignore",".supertaskr/\n");putPrivate(f.product,"pyproject.toml","[project]\nname='held-grade'\nversion='0.0.0'\n");
 putPrivate(f.product,"checks/first/test_first.py",`import unittest, os, json\nclass First(unittest.TestCase):\n    def test_one(self): self.assertEqual(2+2,4)\n    def test_two(self): self.assertTrue(True)\n    @classmethod\n    def tearDownClass(cls):\n        if os.path.exists(${JSON.stringify(trigger)}):\n            with open(${JSON.stringify(pause)}, 'w') as out: json.dump({'version':1,'scope':'all','by':'fixture owner','at':'2026-10-30T00:00:00Z','why':'actual between-suite pause'},out)\n`);
 putPrivate(f.product,"checks/second/test_second.py",`import unittest\nwith open(${JSON.stringify(witness)},'w') as out: out.write('actual second suite child')\nclass Second(unittest.TestCase):\n    def test_second(self): self.assertTrue(True)\n`);
 putPrivate(f.product,"supertaskr.yaml",JSON.stringify(settings));privateGit(f.product,["add","."]);privateGit(f.product,["commit","-qm","Original two-suite configured policy"]);
 const cardPath="docs/tasks/T-910-held-grade.md";
 putPrivate(f.records,cardPath,"---\nid: T-910\ntitle: Retained configured grading\nfeature: F-01\nmilestone: 1\npriority: 1\nsize: M\nstatus: building\ntier: guarded\ntouches: [\"product::hello.py\", \"product::checks\", \"records::docs/rooms\"]\n---\n\n## Acceptance criteria\n\n- WHEN graded THE original held worker SHALL run both original suites.\n\n## Verdicts\n");
 privateGit(f.records,["add","."]);privateGit(f.records,["commit","-qm","Original private grading card"]);
 const revisions={product:privateGit(f.product,["rev-parse","HEAD"]),records:privateGit(f.records,["rev-parse","HEAD"])},productWorker=path.join(f.dir,"product-worker"),recordsWorker=path.join(f.dir,"records-worker");
 privateGit(f.product,["worktree","add","--detach",productWorker,revisions.product]);privateGit(f.records,["worktree","add","--detach",recordsWorker,revisions.records]);
 const qualified:any={version:1,authorityRoot:f.product,projectId:"external-python",revisions,taskId:"T-910",legacyTokenMap:{},workers:[{role:"product",checkout:productWorker,base:revisions.product},{role:"records",checkout:recordsWorker,base:revisions.records}]};
 qualified.receipt=qualifier.captureQualifiedInputs(qualified).receipt;
 putPrivate(f.product,".supertaskr/dispatch-grant.yaml",admission.composeGrantSnapshot({root:f.product,revision:3,writtenBy:"fixture",blockText:`dispatch:\n  approval: each\n  recovery: repairs\n  grant:\n    given_by: fixture owner\n    at: "2026-10-30T00:00:00Z"\n    revision: 3\n    order: [T-910]\n    cards:\n      T-910: ${qualified.receipt.cardBlobId}\n  history: []\n`}));
 const brief=path.join(f.dir,"brief.md");putPrivate(f.dir,"brief.md","Authored native fixture; no live model launched.\n");
 const assignment:any={kind:"card",id:"T-910",role:"executor",resource:productWorker,cwd:productWorker,harness:"codex-desktop-native",model:"gpt-6.1-sol",effort:"xhigh",base:revisions.product,brief,deadline:"none",budget:"none",admission:{kind:"explicit",parent:"",evidence:"",scope:"implementation"},native:{taskName:"/root/held_grade_fixture",sessionId:"held-grade-session",coordinatorTurnId:"held-grade-parent",ignoredOutputs:[]},qualified};
 const started=await runs.startConfiguredRun(f.product,{assignment}),attempt=started.record.attempt;
 function bind(attempt:string,agent="held-grade-agent"){
  const event=(name:string,command="",id="probe")=>({hook_event_name:name,agent_id:agent,session_id:assignment.native.sessionId,turn_id:"held-grade-turn",tool_name:"Bash",tool_use_id:id,tool_input:{command}});
  expect(native.handleNativeEvent(f.product,event("SubagentStart","","start")).disposition).toBe("start-recorded");
  expect(native.handleNativeEvent(f.product,event("PreToolUse",native.NATIVE_IDENTITY_PROBE)).disposition).toBe("identity-probe-pre");
  expect(native.handleNativeEvent(f.product,{...event("PostToolUse",native.NATIVE_IDENTITY_PROBE),tool_response:agent}).disposition).toBe("identity-probe-post");
  return runs.bindRun(f.product,{attempt,harnessId:agent});
 }
 bind(attempt);
 return {...f,installed,module,runs,native,admission,grade,configured,tool,settings,qualified,assignment,attempt,productWorker,recordsWorker,bind,trigger,witness,pause,cardPath};
}

test("installed grading measures the actual held PRODUCT worker, retains original suites and captures without changing ignored-output policy",async()=>{
 test.setTimeout(180_000);const f=await fixture();try{
  const before=f.runs.readRecord(f.product,f.attempt),originalIgnored=structuredClone(before.native.qualified.ignored),coordinator=privateGit(f.product,["rev-parse","HEAD"]);
  putPrivate(f.productWorker,"hello.py","print('actual worker candidate')\n");
  // The worker's current settings are cheaper; only the retained original
  // two-suite policy may select programs or declare completeness.
  const changed=structuredClone(f.settings);changed.suites=changed.suites.slice(0,1);changed.suites[0].argv=["python3","-B","-c","print('cheap current setting')"];
  // Settings are outside this card's worker fence, so change them only in
  // the coordinator. The actual worker has its own distinct candidate.
  putPrivate(f.product,"supertaskr.yaml",JSON.stringify(changed));privateGit(f.product,["add","supertaskr.yaml"]);privateGit(f.product,["commit","-qm","Different future policy"]);
  privateGit(f.productWorker,["add","hello.py"]);privateGit(f.productWorker,["commit","-qm","Actual original worker output"]);
  const candidate=privateGit(f.productWorker,["rev-parse","HEAD"]),authority=await f.grade.captureConfiguredDispatchGradeAuthority(f.product,f.attempt,{tool:f.tool});
  expect(authority.candidate).toMatchObject({productRoot:f.productWorker,commit:candidate});expect(candidate).not.toBe(coordinator);
  expect(()=>f.grade.runConfiguredDispatchGrade(structuredClone(authority))).toThrow(/AUTHORITY_REQUIRED/);
  const first=f.grade.runConfiguredDispatchGrade(authority,"first");expect(first.capture.complete).toBe(false);expect(first.capture.suites[0].verdict.bodies).toBe(2);expect(first.reading).toBeNull();
  const command=[path.join(f.installed.packageRoot,"supertaskr.mjs"),"dispatch","--root",f.product,"--grade","--attempt",f.attempt];
  const actual=spawnSync(process.execPath,command,{cwd:f.productWorker,encoding:"utf8",env:{...process.env,NODE_PATH:""}});
  expect(actual.status,actual.stderr).toBe(0);const full=JSON.parse(actual.stdout);
  expect(full.capture).toMatchObject({complete:true,selected:["first","second"],candidate:{productRoot:f.productWorker,commit:candidate}});
  expect(full.capture.suites.map((r:any)=>r.verdict.bodies)).toEqual([2,1]);expect(full.tokenWritten).toBe(false);expect(full.reading).toBeNull();expect(existsSync(f.witness)).toBe(true);
  expect(f.runs.readRecord(f.product,f.attempt).native.qualified.ignored).toEqual(originalIgnored);
  expect(privateGit(f.productWorker,["status","--porcelain","--untracked-files=all"])).toBe("");
  expect(existsSync(path.join(f.productWorker,".supertaskr/gate-token.json"))).toBe(false);
  for(const extra of [["--program","anything"],["--suite","first","--suite","second"],["--full"]]){
   const refused=spawnSync(process.execPath,[...command,...extra],{cwd:f.product,encoding:"utf8"});expect(refused.status).not.toBe(0);expect(refused.stdout).toBe("");
  }
 }finally{f.cleanup();}
});

test("current pause and exact worker changes refuse; a pause from the first real suite prevents the next child and any accepted result",async()=>{
 test.setTimeout(180_000);const f=await fixture();try{
  const authority=await f.grade.captureConfiguredDispatchGradeAuthority(f.product,f.attempt,{tool:f.tool});
  putPrivate(f.product,f.admission.PAUSE_REL_PATH,JSON.stringify({version:1,scope:"all",by:"fixture owner",at:"2026-10-30T00:00:00Z",why:"before effect"}));
  expect(()=>f.grade.runConfiguredDispatchGrade(authority)).toThrow();expect(existsSync(f.witness)).toBe(false);rmSync(f.pause);
  putPrivate(f.productWorker,"hello.py","uncommitted worker drift\n");expect(()=>f.grade.runConfiguredDispatchGrade(authority)).toThrow();expect(existsSync(f.witness)).toBe(false);privateGit(f.productWorker,["restore","hello.py"]);
  putPrivate(f.dir,"pause-during-suite","trigger actual first child");expect(()=>f.grade.runConfiguredDispatchGrade(authority)).toThrow();
  expect(existsSync(f.pause)).toBe(true);expect(existsSync(f.witness)).toBe(false);
  rmSync(f.pause);rmSync(f.trigger);expect(f.grade.runConfiguredDispatchGrade(authority).capture.complete).toBe(true);
  putPrivate(f.productWorker,"hello.py","committed worker drift\n");privateGit(f.productWorker,["add","hello.py"]);privateGit(f.productWorker,["commit","-qm","New candidate"]);
  expect(()=>f.grade.runConfiguredDispatchGrade(authority)).toThrow(/CANDIDATE_CHANGED/);
  const next=await f.grade.captureConfiguredDispatchGradeAuthority(f.product,f.attempt,{tool:f.tool});expect(next.candidate.commit).not.toBe(authority.candidate.commit);expect(f.grade.runConfiguredDispatchGrade(next).capture.complete).toBe(true);
 }finally{f.cleanup();}
});

test("the original reporter/judge aggregates actual partial captures and refuses missing, duplicate, changed or relabeled membership",async()=>{
 test.setTimeout(180_000);const f=await fixture();try{
  const authority=await f.grade.captureConfiguredDispatchGradeAuthority(f.product,f.attempt,{tool:f.tool}),a=f.grade.runConfiguredDispatchGrade(authority,"first").capture,b=f.grade.runConfiguredDispatchGrade(authority,"second").capture;
  const retained=await f.configured.captureConfiguredDispatchForRun(f.product,f.attempt,{tool:f.tool}),runner=f.configured.createConfiguredDispatchGateRunner(retained.handle,{productRoot:f.productWorker,productRevision:authority.candidate.commit});
  expect(runner.aggregate([b,a])).toMatchObject({complete:true,selected:["first","second"]});
  for(const parts of [[a],[a,a]]){
   let error:any;try{runner.aggregate(parts);}catch(caught){error=caught;}
   expect(error?.code).toBe("gate-capture-membership");
  }
  for(const change of [
   (p:any)=>{p.complete=true;},(p:any)=>{p.context.policyRevision="0".repeat(40);},(p:any)=>{p.candidate.commit="0".repeat(40);},
   (p:any)=>{p.suites[0].definition.argv=["python3","-c","print('cheap')"];},(p:any)=>{p.suites[0].verdict.bodies=999;},
   (p:any)=>{p.suites[0].output+="forged reporter suffix";},(p:any)=>{p.extra="unaccounted field";}
  ]){const changed=structuredClone(a);change(changed);expect(()=>runner.aggregate([changed,b])).toThrow();}
 }finally{f.cleanup();}
});
