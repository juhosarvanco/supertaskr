/** Ordinary synthetic provider metadata/HTTPS dependency fixtures. These test
 * parsing and request orchestration; none claims real GitHub CI was observed. */
import {EventEmitter} from "node:events";
import https from "node:https";
import {Readable} from "node:stream";
import {readFileSync} from "node:fs";
import path from "node:path";
import {expect,test} from "@playwright/test";
import {createGitHubDeliveryCiReader,normalizeGitHubDeliveryRun,gitHubDeliveryCheckId,normalizeGitHubDeliveryCheck,actualGitHubDeliveryCiObservation} from "../scripts/qualified-github-ci.mjs";
import {loadInstalledRecordTool} from "../scripts/records-check.mjs";
import {normalizeExactDeliveryCiRequirement} from "../scripts/qualified-delivery-ci.mjs";
import {privateRecordFixture,putPrivate,sha} from "./private-record-fixture";

const selection={provider:"github-actions",host:"github.com",repository:"fixture/project",workflow:".github/workflows/ci.yml",event:"push",checks:["Build / Linux"],ref:"refs/heads/main",headCommit:"1".repeat(40)};
const requirement=normalizeExactDeliveryCiRequirement({version:1,...selection,run:{id:21,attempt:2}});
function run(over:any={}){return {id:21,run_attempt:2,workflow_id:77,check_suite_id:31,head_sha:selection.headCommit,head_branch:"main",event:"push",path:selection.workflow,repository:{full_name:"Fixture/Project"},head_repository:{full_name:"Fixture/Project"},status:"completed",conclusion:"success",...over};}
function job(over:any={}){return {id:101,run_id:21,head_sha:selection.headCommit,name:selection.checks[0],check_run_url:"https://api.github.com/repos/Fixture/Project/check-runs/601",status:"completed",conclusion:"success",...over};}
function check(over:any={}){return {id:601,head_sha:selection.headCommit,name:selection.checks[0],app:{slug:"github-actions"},check_suite:{id:31},status:"completed",conclusion:"success",...over};}
type Reply={path:string,data:any,status?:number};
/** Patch the standard library only inside this test process, not a production
 * response callback/flag. There is no live network or provider-success claim. */
async function replies<T>(rows:Reply[],body:()=>Promise<T>):Promise<T>{
 const original=https.request,token=process.env.GH_TOKEN;let at=0;
 process.env.GH_TOKEN="synthetic-fixture-credential";
 (https as any).request=(options:any,receive:(response:any)=>void)=>{
  expect(options.protocol).toBe("https:");expect(options.hostname).toBe("api.github.com");expect(options.method).toBe("GET");expect(options.rejectUnauthorized).toBe(true);
  const row=rows[at++];expect(row,`Unexpected request ${options.path}`).toBeDefined();expect(options.path).toBe(row?.path);
  const request:any=new EventEmitter();request.destroy=(error:Error)=>queueMicrotask(()=>request.emit("error",error));
  request.end=()=>queueMicrotask(()=>{const response:any=Readable.from([Buffer.from(JSON.stringify(row?.data))]);response.statusCode=row?.status??200;response.headers={date:"Thu, 29 Oct 2026 21:00:00 GMT"};receive(response);});
  return request;
 };
 try{return await body();}finally{https.request=original;if(token===undefined)delete process.env.GH_TOKEN;else process.env.GH_TOKEN=token;expect(at).toBe(rows.length);}
}
const base="/repos/fixture/project",header=`${base}/actions/runs/21`,attempt=`${header}/attempts/2`,jobs=`${attempt}/jobs?per_page=100&page=1`,checkPath=`${base}/check-runs/601`;

test("provider metadata preserves separate actual job and check IDs and refuses foreign URLs and newer run attempts",()=>{
 const observed=normalizeGitHubDeliveryRun(run(),selection);
 expect(normalizeGitHubDeliveryCheck(job(),check(),requirement,observed)).toMatchObject({jobId:101,checkRunId:601,runAttempt:2,checkSuiteId:31});
 for(const url of ["https://foreign.invalid/repos/fixture/project/check-runs/601","https://api.github.com/repos/other/project/check-runs/601","https://api.github.com/repos/fixture/project/check-runs/601?redirect=1"])
  expect(()=>gitHubDeliveryCheckId(url,selection.repository)).toThrow(/CI_CHECK_IDENTITY_INVALID/);
 expect(()=>normalizeGitHubDeliveryRun(run({run_attempt:3}),selection,observed)).toThrow(/CI_RUN_ATTEMPT_CHANGED/);
 expect(()=>normalizeGitHubDeliveryCheck(job(),check({app:{slug:"foreign-app"}}),requirement,observed)).toThrow(/CI_CHECK_IDENTITY_INVALID/);
 expect(()=>actualGitHubDeliveryCiObservation({status:"validated"},requirement)).toThrow(/CI_OBSERVATION_HANDLE_REQUIRED/);
});

test("synthetic provider requests bind discovery attempt pages check IDs and canonical header bookends without a public response seam",async()=>{
 const f=privateRecordFixture();try{
  const reader=createGitHubDeliveryCiReader({tool:loadInstalledRecordTool(f.manifestPath),selection});
  const selected=await replies([{path:`${base}/actions/runs?event=push&head_sha=${selection.headCommit}&branch=main&per_page=100&page=1`,data:{total_count:1,workflow_runs:[run()]}},{path:header,data:run()}],()=>reader.discover());
  expect(selected.status).toBe("selected");expect(selected.requirement).toEqual(requirement);
  expect(selected.receipts[0].pagination).toEqual({page:1,pageSize:100,reportedTotal:1,returned:1});
  const observed=await replies([{path:header,data:run()},{path:attempt,data:run()},{path:jobs,data:{total_count:1,jobs:[job()]}},{path:checkPath,data:check()},{path:header,data:run()}],()=>reader.read(selected.handle));
  expect(observed.result).toMatchObject({status:"validated",code:"CI_EXACT_SUCCESS"});
  expect(observed.evidence.checks[0]).toMatchObject({jobId:101,checkRunId:601});expect(observed.receipts.every((r:any)=>r.status===200&&r.sha256.length===64&&Number.isFinite(Date.parse(r.observedAt)))).toBe(true);
  expect(JSON.stringify(observed)).not.toContain("synthetic-fixture-credential");
  expect(actualGitHubDeliveryCiObservation(observed,requirement).result.status).toBe("validated");
  expect(()=>actualGitHubDeliveryCiObservation(JSON.parse(JSON.stringify(observed)),requirement)).toThrow(/CI_OBSERVATION_HANDLE_REQUIRED/);
  await expect(reader.read(JSON.parse(JSON.stringify(selected.handle)))).rejects.toThrow(/CI_SELECTION_HANDLE_REQUIRED/);
 }finally{f.cleanup();}
});

test("synthetic newer canonical attempt cannot be hidden by an older successful attempt and complete jobs",async()=>{
 const f=privateRecordFixture();try{
  const reader=createGitHubDeliveryCiReader({tool:loadInstalledRecordTool(f.manifestPath),selection}),selected=reader.restore(requirement);
  await replies([{path:header,data:run()},{path:attempt,data:run()},{path:jobs,data:{total_count:1,jobs:[job()]}},{path:checkPath,data:check()},{path:header,data:run({run_attempt:3,status:"in_progress",conclusion:null})}],async()=>{
   await expect(reader.read(selected)).rejects.toThrow(/CI_RUN_ATTEMPT_CHANGED/);
  });
 }finally{f.cleanup();}
});

test("synthetic contradictory exact attempt header refuses a stable latest success and restores only consistent observations",async()=>{
 const f=privateRecordFixture();try{
  const reader=createGitHubDeliveryCiReader({tool:loadInstalledRecordTool(f.manifestPath),selection}),selected=reader.restore(requirement);
  await replies([{path:header,data:run()},{path:attempt,data:run({conclusion:"failure"})},{path:jobs,data:{total_count:1,jobs:[job()]}},{path:checkPath,data:check()},{path:header,data:run()}],async()=>{
   await expect(reader.read(selected)).rejects.toThrow(/CI_RUN_OBSERVATION_CHANGED/);
  });
  const restored=await replies([{path:header,data:run()},{path:attempt,data:run()},{path:jobs,data:{total_count:1,jobs:[job()]}},{path:checkPath,data:check()},{path:header,data:run()}],()=>reader.read(selected));
  expect(restored.result.status).toBe("validated");
 }finally{f.cleanup();}
});

test("synthetic complete job pagination retains every page and never substitutes job IDs for check IDs",async()=>{
 const f=privateRecordFixture();try{
  const reader=createGitHubDeliveryCiReader({tool:loadInstalledRecordTool(f.manifestPath),selection}),selected=reader.restore(requirement);
  const many=Array.from({length:101},(_,at)=>job({id:1000+at,name:at===0?selection.checks[0]:`Extra ${at}`,check_run_url:`https://api.github.com/repos/fixture/project/check-runs/${6000+at}`}));
  const pages:Reply[]=[{path:header,data:run()},{path:attempt,data:run()},{path:jobs,data:{total_count:101,jobs:many.slice(0,100)}},{path:`${attempt}/jobs?per_page=100&page=2`,data:{total_count:101,jobs:many.slice(100)}}];
  many.forEach((item,at)=>pages.push({path:`${base}/check-runs/${6000+at}`,data:check({id:6000+at,name:item.name})}));pages.push({path:header,data:run()});
  const observed=await replies(pages,()=>reader.read(selected));
  expect(observed.result.status).toBe("validated");expect(observed.evidence.totalChecks).toBe(101);expect(observed.evidence.checks.at(-1)).toMatchObject({jobId:1100,checkRunId:6100});
  expect(observed.receipts.filter((r:any)=>r.pagination).map((r:any)=>r.pagination)).toEqual([{page:1,pageSize:100,reportedTotal:101,returned:100},{page:2,pageSize:100,reportedTotal:101,returned:1}]);
 }finally{f.cleanup();}
});

test("synthetic incomplete job pagination and access refusal remain unavailable without following metadata URLs",async()=>{
 const f=privateRecordFixture();try{
  const reader=createGitHubDeliveryCiReader({tool:loadInstalledRecordTool(f.manifestPath),selection}),selected=reader.restore(requirement);
  await replies([{path:header,data:run()},{path:attempt,data:run()},{path:jobs,data:{total_count:2,jobs:[job()]}}],async()=>{await expect(reader.read(selected)).rejects.toThrow(/CI_PROVIDER_SET_INCOMPLETE/);});
  await replies([{path:header,data:{message:"Untrusted provider error"},status:401}],async()=>{await expect(reader.read(selected)).rejects.toMatchObject({code:"CI_PROVIDER_ACCESS_UNAVAILABLE",status:"cannot-run",exitCode:3,providerReceipt:{host:"api.github.com",path:header,status:401,byteLength:38}});});
 }finally{f.cleanup();}
});

test("missing backend credentials gives explicit cannot-run before any provider request",async()=>{
 const f=privateRecordFixture();try{
  const reader=createGitHubDeliveryCiReader({tool:loadInstalledRecordTool(f.manifestPath),selection}),saved={path:process.env.PATH,gh:process.env.GH_TOKEN,github:process.env.GITHUB_TOKEN};
  try{
   process.env.PATH=f.dir;delete process.env.GH_TOKEN;delete process.env.GITHUB_TOKEN;
   await expect(reader.discover()).rejects.toMatchObject({code:"CI_CREDENTIALS_MISSING",status:"cannot-run",exitCode:3});
  }finally{for(const [key,value] of [["PATH",saved.path],["GH_TOKEN",saved.gh],["GITHUB_TOKEN",saved.github]] as const){if(value===undefined)delete process.env[key];else process.env[key]=value;}}
 }finally{f.cleanup();}
});

test("provider constructor requires its actual installed owner and offers no caller response or program override",()=>{
 const f=privateRecordFixture();try{
  const original=readFileSync(f.manifestPath,"utf8"),manifest=JSON.parse(original),member="tools/e2e/scripts/qualified-github-ci.mjs";
  manifest.runtime.files=manifest.runtime.files.filter((entry:any)=>entry.path!==member);manifest.runtime.buildHash=sha(JSON.stringify(manifest.runtime.files));putPrivate(f.tool,"dist/tool-manifest.json",JSON.stringify(manifest));
  expect(readFileSync(path.join(f.tool,"dist",member),"utf8")).toContain("createGitHubDeliveryCiReader");
  expect(()=>createGitHubDeliveryCiReader({tool:loadInstalledRecordTool(f.manifestPath),selection})).toThrow(/records-tool-runtime-member-required/);
  putPrivate(f.tool,"dist/tool-manifest.json",original);const tool=loadInstalledRecordTool(f.manifestPath);
  expect(()=>createGitHubDeliveryCiReader({tool,selection,request:()=>({status:"validated"})} as any)).toThrow(/CI_READER_CONFIGURATION/);
  expect(createGitHubDeliveryCiReader({tool,selection}).selection).toEqual(selection);
 }finally{f.cleanup();}
});
