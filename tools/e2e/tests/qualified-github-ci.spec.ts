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
import {operationDigest} from "../scripts/operation-record.mjs";
import {validQualifiedDeliveryRequest} from "../scripts/qualified-delivery-record.mjs";
import {validQualifiedCiProgress,qualifiedDeliveryCiAcceptance,retainQualifiedCiHistory} from "../scripts/qualified-ci-record.mjs";
import {qualifiedCompletionDeliveryFacts} from "../scripts/qualified-completion-record.mjs";
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

test("synthetic CI progress shape retains all headers and complete receipts but supplies no qualified writer authority",async()=>{
 const f=privateRecordFixture();try{
  const tool=loadInstalledRecordTool(f.manifestPath),reader=createGitHubDeliveryCiReader({tool,selection});
  const selected=await replies([{path:`${base}/actions/runs?event=push&head_sha=${selection.headCommit}&branch=main&per_page=100&page=1`,data:{total_count:1,workflow_runs:[run()]}},{path:header,data:run()}],()=>reader.discover());
  const observed=await replies([{path:header,data:run()},{path:attempt,data:run()},{path:jobs,data:{total_count:1,jobs:[job()]}},{path:checkPath,data:check()},{path:header,data:run()}],()=>reader.read(selected.handle));
  const facts=actualGitHubDeliveryCiObservation(observed,requirement),{ref,headCommit,...ci}=selection;
  // Format-only parent data, deliberately NOT a valid qualified request or
  // authority. No operation/writer API is invoked with this synthetic input.
  const requestData:any={route:{name:"protected-atomic-push-v1",publicationOwed:true,publication:{ci,destination:{ref,endpoint:{kind:"github"}},commit:headCommit,tool,digest:`sha256:${"a".repeat(64)}`}}};
  const publicationData={acceptance:{metadataFixtureOnly:true}};
  expect(validQualifiedDeliveryRequest(requestData)).toBe(false);
  const value:any={version:1,phase:"validated",selection,selectionDigest:operationDigest(selection),requirement,providerRun:selected.providerRun,selectedAt:selected.observedAt,
   discovery:{status:"selected",observedAt:selected.observedAt,receipts:selected.receipts},observation:facts,error:null,acceptance:qualifiedDeliveryCiAcceptance(requestData,facts)};
  expect(validQualifiedCiProgress(value,requestData,publicationData)).toBe(true);
  const conflict=structuredClone(value);conflict.observation.headers.attempt.conclusion="failure";expect(validQualifiedCiProgress(conflict,requestData,publicationData)).toBe(false);
  const incomplete=structuredClone(value);incomplete.observation.receipts.splice(3,1);expect(validQualifiedCiProgress(incomplete,requestData,publicationData)).toBe(false);
  const later=structuredClone(value);later.providerRun.attempt=3;expect(validQualifiedCiProgress(later,requestData,publicationData)).toBe(false);
  expect(()=>retainQualifiedCiHistory(value)).toThrow(/CI_ALREADY_ACCEPTED/);
  const failed=await replies([{path:header,data:run({conclusion:"failure"})},{path:attempt,data:run({conclusion:"failure"})},{path:jobs,data:{total_count:1,jobs:[job({conclusion:"failure"})]}},{path:checkPath,data:check({conclusion:"failure"})},{path:header,data:run({conclusion:"failure"})}],()=>reader.read(selected.handle));
  const old={...value,phase:"observed",observation:actualGitHubDeliveryCiObservation(failed,requirement),acceptance:null};
  expect(validQualifiedCiProgress(old,requestData,publicationData)).toBe(true);expect(old.observation.result.status).toBe("validation-failed");const oldBytes=JSON.stringify(old);
  const next=await replies([{path:`${base}/actions/runs?event=push&head_sha=${selection.headCommit}&branch=main&per_page=100&page=1`,data:{total_count:1,workflow_runs:[run({run_attempt:3})]}},{path:header,data:run({run_attempt:3})}],()=>reader.discover());
  const nextAttempt=`${header}/attempts/3`,nextObserved=await replies([{path:header,data:run({run_attempt:3})},{path:nextAttempt,data:run({run_attempt:3})},{path:`${nextAttempt}/jobs?per_page=100&page=1`,data:{total_count:1,jobs:[job()]}},{path:checkPath,data:check()},{path:header,data:run({run_attempt:3})}],()=>reader.read(next.handle));
  const nextFacts=actualGitHubDeliveryCiObservation(nextObserved,next.requirement),progress={...value,requirement:next.requirement,providerRun:next.providerRun,selectedAt:next.observedAt,discovery:{status:"selected",observedAt:next.observedAt,receipts:next.receipts},observation:nextFacts,acceptance:qualifiedDeliveryCiAcceptance(requestData,nextFacts),history:retainQualifiedCiHistory(old)};
  expect(validQualifiedCiProgress(progress,requestData,publicationData)).toBe(true);expect(progress.history[0].progress.observation.result.status).toBe("validation-failed");expect(progress.requirement.run.attempt).toBe(3);expect(JSON.stringify(old)).toBe(oldBytes);
  const edited=structuredClone(progress);edited.history[0].progress.observation.result.status="validated";expect(validQualifiedCiProgress(edited,requestData,publicationData)).toBe(false);
  const pendingObserved=await replies([{path:header,data:run({status:"in_progress",conclusion:null})},{path:attempt,data:run({status:"in_progress",conclusion:null})},{path:jobs,data:{total_count:1,jobs:[job({status:"in_progress",conclusion:null})]}},{path:checkPath,data:check({status:"in_progress",conclusion:null})},{path:header,data:run({status:"in_progress",conclusion:null})}],()=>reader.read(selected.handle));
  const pendingFacts=actualGitHubDeliveryCiObservation(pendingObserved,requirement);let history=retainQualifiedCiHistory(old);
  for(let poll=0;poll<100;poll++){
   const at=new Date(Date.UTC(2026,10,1,0,0,poll)).toISOString(),selectedState={...old,phase:"selected",observation:null,error:null,history};
   history=retainQualifiedCiHistory(selectedState);
   const current={...old,observation:structuredClone(pendingFacts),error:null,history};current.observation.observedAt=at;current.observation.receipts.forEach((r:any)=>r.observedAt=at);
   history=retainQualifiedCiHistory(current);
   history=retainQualifiedCiHistory({...current,history,error:{code:"CI_CREDENTIALS_MISSING",at,providerReceipt:null}});
  }
  expect(history).toHaveLength(4);expect(JSON.stringify(history[0].progress)).toBe(oldBytes);
  expect(validQualifiedCiProgress({...progress,history},requestData,publicationData)).toBe(true);
  const s=requestData.route.publication,asset=(path:string)=>({path,sha256:"b".repeat(64)}),at=selected.observedAt;
  Object.assign(s,{tree:"c".repeat(40),correlationRef:"refs/supertaskr/fixture/publication",configuration:{digest:`sha256:${"d".repeat(64)}`},hook:{node:{path:"/format/node"},nodeSha256:"b".repeat(64),entry:"/format/hook.mjs"}});s.destination.expectedOld="e".repeat(40);
  const exactPublication={version:1,phase:"published",launches:[{sequence:1,stage:"push",token:"launch-00000000-0000-0000-0000-000000000000",owner:{pid:1,identity:"format-only",token:"format-only"},process:{pid:2,identity:"format-only",group:2},node:asset("/format/node"),git:asset("/format/git"),entry:asset("/format/qualified-publication-launch.mjs"),startedAt:at,gitStarted:true,result:{kind:"observed-dead",observedAt:at}}],checks:{tokenDigest:`sha256:${"f".repeat(64)}`,context:{configurationDigest:s.configuration.digest,toolManifestDigest:tool.manifestDigest,required:["python"]},tree:s.tree,attribution:"observed-artifact"},acceptance:{contextDigest:s.digest,previousRevision:s.destination.expectedOld,ref:s.destination.ref,commit:s.commit,tree:s.tree,correlationRef:s.correlationRef,attribution:"exact"}};
  expect(validQualifiedDeliveryRequest(requestData)).toBe(false);
  expect(qualifiedCompletionDeliveryFacts(requestData,{publication:exactPublication,validation:progress})).toEqual({publication:exactPublication.acceptance,ci:progress.acceptance});
  expect(qualifiedCompletionDeliveryFacts(requestData,{publication:publicationData,validation:progress})).toBeNull();
  expect(qualifiedCompletionDeliveryFacts(requestData,{publication:exactPublication,validation:old})).toBeNull();
  requestData.route.publication.destination.endpoint.kind="local";expect(validQualifiedCiProgress(value,requestData,publicationData)).toBe(false);
 }finally{f.cleanup();}
});
