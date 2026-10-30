/** Fixed GitHub Actions metadata reader. This reads provider facts only;
 * neither a selection nor its classification grants completion authority.
 * The delivery controller must persist its exact selected run/attempt first. */
import {execFileSync} from "node:child_process";
import {createHash} from "node:crypto";
import https from "node:https";
import {hookProgram} from "../../../cli/hook-git-context.mjs";
import {normalizeDeliveryCiSelection,isDeliveryBranchRef} from "../../../lib/parser/dist/pure.js";
import {operationContent,operationDigest,operationPayload} from "./operation-record.mjs";
import {normalizeExactDeliveryCiRequirement,qualifyExactDeliveryCi} from "./qualified-delivery-ci.mjs";
import {requireInstalledRuntimeAssets,verifyInstalledRecordTool} from "./records-check.mjs";
const API_HOST="api.github.com",API_VERSION="2026-03-10",PAGE=100,MAX_ROWS=1000,MAX_BYTES=8*1024*1024;
const observations=new WeakMap();
export class GitHubDeliveryCiFinding extends Error{
 /** Complete HTTP metadata only; never an error body or credential.
  * @type {any} */
 providerReceipt=null;
 /** @param {string} code */
 constructor(code){super(`${code}: GitHub delivery validation unavailable`);this.code=code;this.status="cannot-run";this.exitCode=3;}
}
/** @param {string} code @returns {never} */
function refuse(code){throw new GitHubDeliveryCiFinding(code);}
/** @param {any} v @param {string[]} fields */
function shape(v,fields){return v&&typeof v==="object"&&!Array.isArray(v)&&Object.keys(v).sort().join("\0")===[...fields].sort().join("\0");}
/** @param {any} value @returns {any} */
function freeze(value){if(value&&typeof value==="object"){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
/** @param {any} n */
const id=n=>Number.isSafeInteger(n)&&n>0;
/** @param {any} value */
const hash=value=>createHash("sha256").update(value).digest("hex");
/** Explicit constructor data, never inferred from house defaults/newest runs.
 * @param {any} input */
export function normalizeGitHubDeliverySelection(input){
 if(!shape(input,["provider","host","repository","workflow","event","checks","ref","headCommit"])||!isDeliveryBranchRef(input.ref)||typeof input.headCommit!=="string"||!/^[0-9a-f]{40}$/.test(input.headCommit))refuse("CI_SELECTION_INVALID");
 let selected;try{const {ref,headCommit,...ci}=operationPayload(input);selected={...normalizeDeliveryCiSelection(ci),ref,headCommit};}catch{refuse("CI_SELECTION_INVALID");}
 return freeze(selected);
}
/** Actual provider run fields; no caller or default supplies a missing ID.
 * @param {any} run @param {any} selection @param {any} [expected] */
export function normalizeGitHubDeliveryRun(run,selection,expected){
 const branch=selection.ref.slice("refs/heads/".length);
 if(!run||![run.id,run.run_attempt,run.workflow_id,run.check_suite_id].every(id)||run.head_sha!==selection.headCommit||run.head_branch!==branch||run.event!==selection.event||
  typeof run.repository?.full_name!=="string"||run.repository.full_name.toLowerCase()!==selection.repository||typeof run.head_repository?.full_name!=="string"||run.head_repository.full_name.toLowerCase()!==selection.repository||
  ![selection.workflow,`${selection.workflow}@${selection.ref}`].includes(run.path)||typeof run.status!=="string"||run.status.length>64||/[\x00-\x1f\x7f]/.test(run.status)||
  !(run.conclusion===null||typeof run.conclusion==="string"&&run.conclusion.length<=64&&!/[\x00-\x1f\x7f]/.test(run.conclusion)))refuse("CI_RUN_IDENTITY_INVALID");
 const normalized={id:run.id,attempt:run.run_attempt,workflowId:run.workflow_id,checkSuiteId:run.check_suite_id,status:run.status,conclusion:run.conclusion};
 if(expected&&(normalized.id!==expected.id||normalized.attempt!==expected.attempt||expected.workflowId!==undefined&&normalized.workflowId!==expected.workflowId||expected.checkSuiteId!==undefined&&normalized.checkSuiteId!==expected.checkSuiteId))refuse("CI_RUN_ATTEMPT_CHANGED");
 return freeze(normalized);
}
/** Validate a URL as an identifier only, then reconstruct the fixed request.
 * @param {any} value @param {string} repository */
export function gitHubDeliveryCheckId(value,repository){
 if(typeof value!=="string")refuse("CI_CHECK_IDENTITY_INVALID");let url;try{url=new URL(value);}catch{refuse("CI_CHECK_IDENTITY_INVALID");}
 const prefix=`/repos/${repository}/check-runs/`,lower=url.pathname.toLowerCase();
 if(url.protocol!=="https:"||url.hostname!==API_HOST||url.port||url.username||url.password||url.search||url.hash||!lower.startsWith(prefix))refuse("CI_CHECK_IDENTITY_INVALID");
 const number=url.pathname.slice(prefix.length);if(!/^[1-9]\d*$/.test(number)||!id(Number(number)))refuse("CI_CHECK_IDENTITY_INVALID");return Number(number);
}
/** The attempt number is attributable to the actual attempt-specific jobs
 * endpoint, not a fabricated field/default. A returned attempt must agree.
 * @param {any} job @param {any} check @param {any} requirement @param {any} run */
export function normalizeGitHubDeliveryCheck(job,check,requirement,run){
 const checkId=gitHubDeliveryCheckId(job?.check_run_url,requirement.repository);
 if(!job||!id(job.id)||job.run_id!==requirement.run.id||job.head_sha!==requirement.headCommit||job.run_attempt!==undefined&&job.run_attempt!==requirement.run.attempt||
  !check||check.id!==checkId||check.head_sha!==requirement.headCommit||check.app?.slug!=="github-actions"||check.check_suite?.id!==run.checkSuiteId||
  typeof check.name!=="string"||check.name!==job.name||check.name.length===0||check.name.length>256||check.name.trim()!==check.name||/[\x00-\x1f\x7f]/.test(check.name)||
  typeof job.status!=="string"||typeof check.status!=="string"||!Object.hasOwn(job,"conclusion")||!Object.hasOwn(check,"conclusion"))refuse("CI_CHECK_IDENTITY_INVALID");
 // Conflicting endpoint observations are uncertain, never a green choice.
 if(job.status!==check.status||job.conclusion!==check.conclusion)refuse("CI_CHECK_OBSERVATION_CHANGED");
 return freeze({jobId:job.id,checkRunId:check.id,app:check.app.slug,name:check.name,headCommit:check.head_sha,runId:job.run_id,runAttempt:requirement.run.attempt,checkSuiteId:check.check_suite.id,status:check.status,conclusion:check.conclusion});
}
/** Credentials are backend process configuration or the existing fixed gh
 * credential lookup, never request data or serialized operation contents. */
function credential(){
 let value=process.env.GH_TOKEN??process.env.GITHUB_TOKEN;
 if(value===undefined){
  try{value=execFileSync(hookProgram("gh"),["auth","token","--hostname","github.com"],{encoding:"utf8",stdio:["ignore","pipe","pipe"],timeout:5000,maxBuffer:65536}).replace(/\n$/,"");}
  catch{refuse("CI_CREDENTIALS_MISSING");}
 }
 if(typeof value!=="string"||value.length===0||value.length>8192||/[\s\x00-\x1f\x7f]/.test(value))refuse("CI_CREDENTIALS_MISSING");return value;
}
/** Fixed HTTPS only; no redirects, arbitrary URL, provider JSON callback,
 * request program, log download, rerun, creation or mutation endpoint exists.
 * @param {string} apiPath @param {string} token */
async function requestJson(apiPath,token){
 if(!/^\/repos\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\//.test(apiPath)||/[\x00-\x20\x7f]/.test(apiPath))refuse("CI_PROVIDER_PATH_INVALID");
 if(process.env.NODE_EXTRA_CA_CERTS||process.env.NODE_TLS_REJECT_UNAUTHORIZED!==undefined&&process.env.NODE_TLS_REJECT_UNAUTHORIZED!=="1")refuse("CI_PROVIDER_TLS_UNSUPPORTED");
 return new Promise((resolve,reject)=>{
  const agent=new https.Agent({keepAlive:false,rejectUnauthorized:true});
  const request=https.request({protocol:"https:",hostname:API_HOST,port:443,path:apiPath,method:"GET",agent,rejectUnauthorized:true,
   headers:{Accept:"application/vnd.github+json",Authorization:`Bearer ${token}`,"X-GitHub-Api-Version":API_VERSION,"User-Agent":"supertaskr-delivery"}},response=>{
   /** @type {Buffer[]} */const chunks=[];let size=0;
   response.on("data",chunk=>{size+=chunk.length;if(size>MAX_BYTES)response.destroy(new GitHubDeliveryCiFinding("CI_PROVIDER_LIMIT"));else chunks.push(Buffer.from(chunk));});
   response.once("error",error=>{clearTimeout(timer);agent.destroy();reject(error instanceof GitHubDeliveryCiFinding?error:new GitHubDeliveryCiFinding("CI_PROVIDER_UNAVAILABLE"));});
   response.once("end",()=>{
    clearTimeout(timer);agent.destroy();const bytes=Buffer.concat(chunks),receipt={host:API_HOST,path:apiPath,status:response.statusCode??null,sha256:hash(bytes),byteLength:bytes.length,observedAt:new Date().toISOString(),serverDate:typeof response.headers.date==="string"?response.headers.date:null};
    try{
     if(response.statusCode!==200)refuse(response.statusCode===401||response.statusCode===403?"CI_PROVIDER_ACCESS_UNAVAILABLE":"CI_PROVIDER_UNAVAILABLE");
     const data=JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(bytes));resolve({data,receipt});
    }catch(error){const finding=error instanceof GitHubDeliveryCiFinding?error:new GitHubDeliveryCiFinding("CI_PROVIDER_RESPONSE_INVALID");finding.providerReceipt=freeze(receipt);reject(finding);}
   });
  });
  const timer=setTimeout(()=>request.destroy(new GitHubDeliveryCiFinding("CI_PROVIDER_TIMEOUT")),15_000);
  request.once("error",error=>{clearTimeout(timer);agent.destroy();reject(error instanceof GitHubDeliveryCiFinding?error:new GitHubDeliveryCiFinding("CI_PROVIDER_UNAVAILABLE"));});request.end();
 });
}
/** Constructor-only scope. This reader supplies facts, not write authority.
 * A delivery consumer must match this scope and persisted actual run/attempt
 * to its original proven publication, then accept only an opaque observation.
 * @param {{tool:any,selection:any}} configuration */
export function createGitHubDeliveryCiReader(configuration){
 if(!shape(configuration,["tool","selection"]))refuse("CI_READER_CONFIGURATION");
 if(process.env.NODE_OPTIONS||process.env.NODE_PATH)refuse("CI_PROVIDER_RUNTIME_UNSUPPORTED");
 const tool=configuration.tool,selection=normalizeGitHubDeliverySelection(configuration.selection),handles=new WeakMap();
 const assets=()=>requireInstalledRuntimeAssets(tool,["tools/e2e/scripts/qualified-github-ci.mjs","tools/e2e/scripts/qualified-delivery-ci.mjs","cli/hook-git-context.mjs"]);
 assets();
 /** @param {any} requirement @param {any} [providerRun] */
 function handle(requirement,providerRun=null){
  const exact=normalizeExactDeliveryCiRequirement(requirement),{version,run,...rest}=exact;
  if(operationContent(rest)!==operationContent(selection))refuse("CI_SELECTION_CHANGED");
  if(providerRun!==null&&(!shape(providerRun,["id","attempt","workflowId","checkSuiteId","status","conclusion"])||providerRun.id!==run.id||providerRun.attempt!==run.attempt||![providerRun.workflowId,providerRun.checkSuiteId].every(id)))refuse("CI_SELECTION_CHANGED");
  const result=Object.freeze({version:1,kind:"exact-github-ci-selection"});handles.set(result,{requirement:exact,providerRun:providerRun===null?null:freeze(operationPayload(providerRun))});return result;
 }
 /** @param {string} apiPath @param {string} token @param {any[]} receipts */
 async function get(apiPath,token,receipts){verifyInstalledRecordTool(tool);const response=/** @type {any} */(await requestJson(apiPath,token));receipts.push(response.receipt);return response.data;}
 /** @param {string} base @param {string} field @param {string} token @param {any[]} receipts */
 async function list(base,field,token,receipts){
  /** @type {any[]} */const rows=[];let total=null;
  for(let page=1;page<=Math.ceil(MAX_ROWS/PAGE);page++){
   const data=await get(`${base}${base.includes("?")?"&":"?"}per_page=${PAGE}&page=${page}`,token,receipts);
   if(!Number.isSafeInteger(data?.total_count)||data.total_count<0||data.total_count>MAX_ROWS||!Array.isArray(data[field])||data[field].length>PAGE||total!==null&&total!==data.total_count)refuse("CI_PROVIDER_SET_INCOMPLETE");
   total=data.total_count;rows.push(...data[field]);
   receipts.at(-1).pagination={page,pageSize:PAGE,reportedTotal:total,returned:data[field].length};
   if(rows.length===total)return rows;if(rows.length>total||data[field].length!==PAGE)refuse("CI_PROVIDER_SET_INCOMPLETE");
  }refuse("CI_PROVIDER_SET_INCOMPLETE");
 }
 const base=`/repos/${selection.repository}`;
 return Object.freeze({selection,
  /** Only a strict delivery controller's retained exact selection may restore
   * an input handle after restart; this API itself grants no delivery effect.
   * @param {any} requirement @param {any} [providerRun] */
  restore(requirement,providerRun=null){assets();return handle(requirement,providerRun);},
  async discover(){
   assets();const token=credential();
   /** @type {any[]} */
   const receipts=[];
   const query=new URLSearchParams({event:selection.event,head_sha:selection.headCommit,branch:selection.ref.slice("refs/heads/".length)}).toString();
   const rows=await list(`${base}/actions/runs?${query}`,"workflow_runs",token,receipts),matches=[];const ids=new Set();
   for(const row of rows){
    if(!id(row?.id)||ids.has(row.id))refuse("CI_RUN_IDENTITY_INVALID");ids.add(row.id);
    if(row.head_sha!==selection.headCommit||row.event!==selection.event||row.head_branch!==selection.ref.slice("refs/heads/".length))refuse("CI_RUN_IDENTITY_INVALID");
    if([selection.workflow,`${selection.workflow}@${selection.ref}`].includes(row.path))matches.push(normalizeGitHubDeliveryRun(row,selection));
   }
   if(matches.length===0)return freeze({status:"validation-pending",code:"CI_RUN_MISSING",observedAt:new Date().toISOString(),receipts});
   if(matches.length!==1)refuse("CI_RUN_AMBIGUOUS");
   const selected=matches[0],latest=normalizeGitHubDeliveryRun(await get(`${base}/actions/runs/${selected.id}`,token,receipts),selection,selected);
   const requirement=normalizeExactDeliveryCiRequirement({version:1,...selection,run:{id:latest.id,attempt:latest.attempt}});
   return freeze({status:"selected",requirement,providerRun:latest,observedAt:new Date().toISOString(),receipts,handle:handle(requirement,latest)});
  },
  /** Fetch exact attempt pages/checks, then bookend the canonical current run.
   * A concurrently newer attempt cannot hide behind an older green endpoint.
   * @param {any} selected */
  async read(selected){
   assets();const captured=handles.get(selected);if(!captured)refuse("CI_SELECTION_HANDLE_REQUIRED");const requirement=captured.requirement;
   const token=credential();
   /** @type {any[]} */
   const receipts=[];
   const runPath=`${base}/actions/runs/${requirement.run.id}`,initial=normalizeGitHubDeliveryRun(await get(runPath,token,receipts),selection,captured.providerRun??requirement.run);
   const attempt=normalizeGitHubDeliveryRun(await get(`${runPath}/attempts/${requirement.run.attempt}`,token,receipts),selection,initial);
   const jobs=await list(`${runPath}/attempts/${requirement.run.attempt}/jobs`,"jobs",token,receipts),checks=[];
   for(const job of jobs){const checkId=gitHubDeliveryCheckId(job?.check_run_url,selection.repository);checks.push(normalizeGitHubDeliveryCheck(job,await get(`${base}/check-runs/${checkId}`,token,receipts),requirement,attempt));}
   const final=normalizeGitHubDeliveryRun(await get(runPath,token,receipts),selection,initial);
   if(final.status!==initial.status||final.conclusion!==initial.conclusion||attempt.status!==final.status||attempt.conclusion!==final.conclusion)refuse("CI_RUN_OBSERVATION_CHANGED");
   const evidence=freeze({version:1,provider:selection.provider,host:selection.host,repository:selection.repository,headRepository:selection.repository,workflow:selection.workflow,event:selection.event,ref:selection.ref,headCommit:selection.headCommit,
    run:{id:final.id,attempt:final.attempt,checkSuiteId:attempt.checkSuiteId,status:final.status,conclusion:final.conclusion},totalChecks:jobs.length,checks});
   const headers=freeze({initial,attempt,final}),providerRun=captured.providerRun??initial;
   const result=qualifyExactDeliveryCi(requirement,evidence),observed=freeze({status:"observed",requirement,providerRun,headers,evidence,result,observedAt:new Date().toISOString(),receipts});
   observations.set(observed,{tool,selection,requirement,providerRun,headers,evidence,result,receipts:structuredClone(receipts),observedAt:observed.observedAt});return observed;
  },
 });
}
/** Only actual reader output yields provider evidence to a delivery consumer.
 * Plain JSON, classifier fixtures and caller accepted flags are not evidence.
 * @param {any} observed @param {any} requirement */
export function actualGitHubDeliveryCiObservation(observed,requirement){
 const facts=observations.get(observed);if(!facts||operationContent(facts.requirement)!==operationContent(normalizeExactDeliveryCiRequirement(requirement)))refuse("CI_OBSERVATION_HANDLE_REQUIRED");
 verifyInstalledRecordTool(facts.tool);
 return freeze(operationPayload({requirement:facts.requirement,providerRun:facts.providerRun,headers:facts.headers,evidence:facts.evidence,result:facts.result,observedAt:facts.observedAt,receipts:facts.receipts,selectionDigest:operationDigest(facts.selection),tool:facts.tool}));
}
