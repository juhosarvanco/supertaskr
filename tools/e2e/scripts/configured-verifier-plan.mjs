/** Read-only configured verifier convenience constructor. Candidates, role and
 * complete bench contract come from actual finalized original source owners.
 * No bench, operation, preparation, grant or native child is created here. */
import {execFileSync} from "node:child_process";
import {createHash} from "node:crypto";
import {realpathSync} from "node:fs";
import path from "node:path";
import {captureConfiguredDispatchForRun,configuredDispatchNativeRole,verifyConfiguredDispatch} from "./configured-dispatch.mjs";
import {captureConfiguredLaneDestination,configuredArmRepository} from "./configured-dispatch-arm.mjs";
import {readQualifiedVerifierInputs} from "./qualified-verification.mjs";
import {configuredAdmissionPreflight} from "./qualified-admission.mjs";
import {configuredVerifierArtifactPaths,configuredVerifierRequestProblem} from "./configured-verifier-record.mjs";
import {validConfiguredArmExecution} from "./configured-dispatch-record.mjs";
import {requireInstalledRuntimeAssets,verifyInstalledRecordTool} from "./records-check.mjs";
import {operationContent} from "./operation-record.mjs";
import {nextAttemptId} from "./run-record.mjs";
import {readAcceptedOperation} from "./durable-operation.mjs";

/** @type {WeakMap<object,{root:string,request:any,selectors:any,tool:any}>} */const plans=new WeakMap();
/** @param {string} code @returns {never} */
function refuse(code){throw Object.assign(new Error(`${code}: configured verifier preparation is unavailable`),{code});}
/** @param {any} value @param {string[]} keys */
const shape=(value,keys)=>value&&typeof value==="object"&&!Array.isArray(value)&&Object.keys(value).sort().join("\0")===[...keys].sort().join("\0");
/** @param {any} value @returns {any} */
function data(value){const copy=structuredClone(value),freeze=(/** @type {any} */ row)=>{if(row&&typeof row==="object"){Object.values(row).forEach(freeze);Object.freeze(row);}};freeze(copy);return copy;}
/** @param {any} a @param {any} b */
const same=(a,b)=>operationContent(a)===operationContent(b);
/** @param {string} root @param {string[]} args */
function git(root,args){try{return execFileSync("git",["--no-replace-objects","-C",root,...args],{encoding:"utf8",maxBuffer:32*1024*1024,stdio:["ignore","pipe","pipe"],env:{...process.env,GIT_NO_LAZY_FETCH:"1",GIT_OPTIONAL_LOCKS:"0"}}).replace(/\n$/,"");}catch{refuse("configured-verifier-git");}}
/** The actual new producer and canonical dependencies must belong to TOOL.
 * @param {any} tool */
function verifyTool(tool){requireInstalledRuntimeAssets(tool,["configured-verifier-plan","configured-verifier-record","qualified-verification","configured-dispatch","configured-dispatch-arm","qualified-admission","qualified-native","qualified-reservation","run-record","durable-operation"].map(name=>`tools/e2e/scripts/${name}.mjs`));}
/** @param {string} root @param {any} capsule @param {any} tool */
function currentCut(root,capsule,tool){
 const homes={product:root,records:capsule.receipt.recordsRoot};
 /** @type {Record<string,string>} */const revisions={};
 /** @type {Record<string,string>} */const refs={};
 /** @type {Record<string,any>} */const repositories={};
 for(const role of ["product","records"]){const home=homes[/** @type {keyof typeof homes} */(role)];
  revisions[role]=git(home,["rev-parse","--verify","HEAD"]);repositories[role]=configuredArmRepository(home,revisions[role],tool);refs[role]=git(home,["symbolic-ref","-q","HEAD"]);
 }
 return {revisions,repositories,refs};
}
/** @param {string} productRoot @param {{operationId:string,executorAttempt:string,native:{sessionId:string,coordinatorTurnId:string},execution:{effort:string,deadline:string,budget:string},benches:{role:string,checkout:string}[]}} selectors @param {{tool:any}} configuration */
export async function captureConfiguredVerifierPlan(productRoot,selectors,configuration){
 if(!shape(configuration,["tool"])||!shape(selectors,["operationId","executorAttempt","native","execution","benches"])||typeof selectors.operationId!=="string"||!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(selectors.operationId)||
  typeof selectors.executorAttempt!=="string"||!/^T-\d+(?:-s\d+)?-a[1-9][0-9]*$/.test(selectors.executorAttempt)||!shape(selectors.native,["sessionId","coordinatorTurnId"])||
  Object.values(selectors.native).some(value=>typeof value!=="string"||!value||value.trim()!==value||value.length>256||/[\x00-\x1f\x7f-\x9f]/.test(value))||!validConfiguredArmExecution(selectors.execution)||
  !Array.isArray(selectors.benches)||!selectors.benches.length||selectors.benches.some(row=>!shape(row,["role","checkout"])||!["product","records"].includes(row.role)||typeof row.checkout!=="string"||!path.isAbsolute(row.checkout)||path.normalize(row.checkout)!==row.checkout||/[\\\x00-\x1f\x7f-\x9f]/.test(row.checkout)))refuse("configured-verifier-request");
 const chosen=data(selectors),tool=configuration.tool,root=realpathSync(productRoot);verifyTool(tool);
 if(readAcceptedOperation(root,chosen.operationId)!==null)refuse("configured-verifier-operation-exists");
 const retained=await captureConfiguredDispatchForRun(root,chosen.executorAttempt,{tool}),handle=retained.handle,capsule=verifyConfiguredDispatch(handle);
 const executor=await readQualifiedVerifierInputs(root,chosen.executorAttempt);
 if(executor.preparations.length)refuse("configured-verifier-existing-preparation");
 if(executor.source.permissionDigest!==retained.source.permissionDigest||executor.source.attempt!==retained.source.attempt||capsule.digest!==retained.source.capsuleDigest)refuse("configured-verifier-source-changed");
 const role=configuredDispatchNativeRole(handle,"verifier"),current=currentCut(root,capsule,tool);
 const declared=[...chosen.benches].sort((a,b)=>a.role.localeCompare(b.role));
 if(!same(declared.map(row=>row.role),executor.requiredBenchRoles))refuse("configured-verifier-complete-benches");
 const benches=declared.map(row=>({role:row.role,checkout:row.checkout,base:capsule.selection.revisions[row.role],candidate:executor.candidates[row.role],parent:captureConfiguredLaneDestination(row.checkout)}));
 const input={version:1,...capsule.selection,roles:executor.request.workers.map((/** @type {any} */ row)=>row.role),admission:{boundary:"child-start",role:"verifier",kind:"explicit",parent:"",evidence:"",scope:"product-change",attempt:null}};
 const admission=await configuredAdmissionPreflight(input,handle);if(!admission.permitted)refuse(admission.refusals[0]?.code??"configured-verifier-current-refusal");
 const request=data({version:1,kind:"configured-verifier",operationId:chosen.operationId,taskId:capsule.task.id,tool,capsule,executor,current,benches,role,execution:chosen.execution,
  native:{...chosen.native,taskName:`/root/configured_verifier_${createHash("sha256").update(chosen.operationId).digest("hex").slice(0,24)}`,ignoredOutputs:executor.ignoredOutputs},
  expectedAttempt:nextAttemptId(root,capsule.task.id),artifacts:configuredVerifierArtifactPaths(root,chosen.operationId),admission:{grant:admission.grant,receipt:admission.receipt}});
 const problem=configuredVerifierRequestProblem(request);if(problem!==null)refuse(`configured-verifier-request-contract-${problem}`);
 if(!same(await readQualifiedVerifierInputs(root,chosen.executorAttempt),executor)||!same(verifyConfiguredDispatch(handle),capsule)||!same(currentCut(root,capsule,tool),current))refuse("configured-verifier-source-changed");
 for(const bench of benches)if(!same(captureConfiguredLaneDestination(bench.checkout),bench.parent))refuse("configured-verifier-destination-changed");
 const again=await configuredAdmissionPreflight(input,handle);if(!again.permitted||!same(again.grant,admission.grant)||!same(again.receipt,admission.receipt))refuse("configured-verifier-current-refusal");
 verifyTool(tool);const proposal=Object.freeze({version:1,kind:"configured-verifier-plan",operationId:request.operationId,request,authority:"readonly plan; no bench/preparation/seal/native permission"});plans.set(proposal,{root,request,selectors:chosen,tool});return proposal;
}
/** Detached data never redeems a serialized proposal. @param {object} proposal */
export function configuredVerifierPlanData(proposal){const retained=plans.get(proposal);if(!retained)refuse("configured-verifier-plan-required");return data(retained.request);}
/** Initial publication only: an actual new constructor and original TOOL.
 * Owned progress requalification belongs to the separate effect/context owner.
 * @param {object} proposal @param {any} tool */
export async function preparedConfiguredVerifierContext(proposal,tool){
 const retained=plans.get(proposal);if(!retained||retained.tool!==tool)refuse("configured-verifier-plan-required");
 const current=await captureConfiguredVerifierPlan(retained.root,retained.selectors,{tool});
 if(!same(configuredVerifierPlanData(current),retained.request))refuse("configured-verifier-plan-changed");verifyInstalledRecordTool(tool);return {root:retained.root,request:retained.request};
}
