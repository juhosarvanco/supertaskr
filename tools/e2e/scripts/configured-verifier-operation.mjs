/** Finite original-source verifier operation: actual claim publication,
 * detached bench creation and canonical phase-one preparation. Seal/native
 * stages remain unavailable and cannot be inferred from serialized progress. */
import {existsSync,lstatSync,readdirSync,rmdirSync} from "node:fs";
import path from "node:path";
import {randomUUID} from "node:crypto";
import {preparedConfiguredVerifierContext,configuredVerifierCurrentCut} from "./configured-verifier-plan.mjs";
import {captureConfiguredLaneDestination} from "./configured-dispatch-arm.mjs";
import {captureConfiguredDispatchForRun,verifyConfiguredDispatch} from "./configured-dispatch.mjs";
import {readQualifiedVerifierInputsNow,prepareQualifiedVerification,captureQualifiedVerifierPreparationNow,readQualifiedPreparation,renderQualifiedPreparationPhase1} from "./qualified-verification.mjs";
import {configuredAdmissionPreflight,decisiveConfiguredAdmission} from "./qualified-admission.mjs";
import {operationContent,operationDigest,operationWork,validOperationRecord} from "./operation-record.mjs";
import {acceptedOperationPath,readAcceptedOperation,withOperationRepositoryObservation} from "./durable-operation.mjs";
import {defaultRunIo,readReservation,takeReservation,releaseReservation,assertOperationOwnership,nextAttemptId,sha256,readRecord,qualifiedPhasePolicy} from "./run-record.mjs";
import {atomicJson,atomicNativeText,withNativeTransaction,syncNativeFileNamespace} from "./native-codex.mjs";
import {configuredVerifierAssignmentData} from "./configured-verifier-record.mjs";
import {captureConfiguredVerifierOperationContext,configuredVerifierOperationState} from "./configured-verifier-context.mjs";
import {measureQualifiedWorker} from "./qualified-reservation.mjs";
import {configuredTextNamespace,measureConfiguredTextArtifact} from "./configured-dispatch-operation.mjs";
import {assertExternalParent} from "./qualified-external-path.mjs";
import {execFileSync} from "node:child_process";
import {requireInstalledRuntimeAssets} from "./records-check.mjs";

/** @param {string} code @returns {never} */
function refuse(code){throw Object.assign(new Error(`${code}: configured verifier operation is unavailable`),{code});}
/** @param {any} a @param {any} b */
const same=(a,b)=>operationContent(a)===operationContent(b);
/** @param {any} r */
function input(r){return {version:1,...r.capsule.selection,roles:r.executor.request.workers.map((/** @type {any} */ row)=>row.role),
 admission:{boundary:"child-start",role:"verifier",kind:"explicit",parent:"",evidence:"",scope:"product-change",attempt:null}};}
/** No captured result supplies current ownership/admission. @param {any} r @param {any} tool @param {object} handle */
function original(r,tool,handle){
 requireInstalledRuntimeAssets(tool,["configured-verifier-operation","configured-verifier-context","configured-verifier-record","qualified-external-path","qualified-verification"].map(name=>`tools/e2e/scripts/${name}.mjs`));
 const root=r.capsule.selection.authorityRoot;
 if(readAcceptedOperation(root,r.operationId)!==null||!same(verifyConfiguredDispatch(handle),r.capsule)||!same(readQualifiedVerifierInputsNow(root,r.executor.source.attempt),r.executor)||
  !same(configuredVerifierCurrentCut(root,r.capsule,tool),r.current)||nextAttemptId(root,r.taskId)!==r.expectedAttempt)refuse("configured-verifier-original-changed");
 const excluded=Object.values(r.current.repositories).flatMap((/** @type {any} */ repo)=>repo.identities);
 for(const bench of r.benches)if(!same(captureConfiguredLaneDestination(bench.checkout,excluded),bench.parent))refuse("configured-verifier-destination-changed");
}
/** Publish only an authentic constructor and actual canonical metadata claims.
 * No supplied serialized record/request can redeem this boundary.
 * @param {object} proposal @param {{tool:any}} configuration */
export async function beginConfiguredVerifierOperation(proposal,configuration){
 if(!configuration||Object.keys(configuration).join()!=="tool")refuse("configured-verifier-options");
 const tool=configuration.tool,{root,request:r}=await preparedConfiguredVerifierContext(proposal,tool);
 const source=await captureConfiguredDispatchForRun(root,r.executor.source.attempt,{tool}),handle=source.handle,request=input(r);
 original(r,tool,handle);const earlier=await configuredAdmissionPreflight(request,handle);
 return withNativeTransaction(root,{operation:"configured-verifier-begin"},()=>{
  original(r,tool,handle);decisiveConfiguredAdmission(request,earlier,handle);
  const io=defaultRunIo(),identity=io.identity(process.pid),at=new Date().toISOString();if(identity===null)refuse("configured-verifier-owner-unknown");
  const work=operationWork(r.operationId),assignment={kind:"operation",id:work,role:"configured-verifier",resource:root};
  const rec=/** @type {any} */({version:1,recordKind:"operation",attempt:`${work}-a1`,state:"starting",assignment,assignmentDigest:sha256(JSON.stringify(assignment)),writer:true,resource:root,
   reservation:{file:null,takenAt:at,releasedAt:null},execution:null,admission:null,
   operation:{version:1,id:r.operationId,kind:"configured-verifier",request:r,digest:operationDigest(r),owner:{pid:process.pid,identity,token:randomUUID()},createdAt:at,claims:[],
    progress:{benches:r.benches.map((/** @type {any} */ row)=>({role:row.role,stage:"captured",identity:null})),preparation:{stage:"captured",digest:null},
     artifacts:{phase1:null,attackSet:null,phase2:null},seal:{stage:"idle",measurements:null,digest:null},handoff:{stage:"held",native:null}},acceptance:null},events:[{at,op:"configured-verifier-capture"}]});
  const acquired=[],file=acceptedOperationPath(root,r.operationId),directory=path.dirname(file),absent=!existsSync(directory);
  try{
   for(const role of ["product","records"]){
    original(r,tool,handle);decisiveConfiguredAdmission(request,earlier,handle);
    const resource=r.current.repositories[role].root;assertOperationOwnership(root,{resource,attempt:rec.attempt});if(readReservation(root,resource)!==null)refuse("configured-verifier-resource-held");
    const taken=takeReservation(root,{resource,attempt:rec.attempt,role:"configured-verifier",at});acquired.push(resource);
    rec.operation.claims.push({role,resource,file:taken.file,takenAt:at,releasedAt:null});if(role==="product")rec.reservation.file=taken.file;
   }
   if(!validOperationRecord(rec))refuse("configured-verifier-record");
   // Complete ledger/admission was recaptured before the atomic owner creates
   // its unpublished temporary file. At visibility, recheck original facts and
   // the same canonical retained-source current grant/pause owner.
   atomicJson(file,rec,()=>{original(r,tool,handle);qualifiedPhasePolicy(root,readRecord(root,r.executor.source.attempt),"verifier","child-start");});
   return {record:structuredClone(rec),file,started:false};
  }catch(error){
   if(!existsSync(file)){
    for(const resource of acquired)if(readReservation(root,resource)?.attempt===rec.attempt)releaseReservation(root,{resource,attempt:rec.attempt});
    if(absent&&existsSync(directory)&&lstatSync(directory).isDirectory()&&!lstatSync(directory).isSymbolicLink()&&readdirSync(directory).length===0){rmdirSync(directory);syncNativeFileNamespace(directory);}
   }
   throw error;
  }
 });
}

/** Exact acknowledged metadata write; it cannot adopt another current row.
 * @param {string} root @param {any} rec @param {any} previous @param {any} tool */
function persist(root,rec,previous,tool){
 if(!validOperationRecord(rec))refuse("configured-verifier-record");
 const r=rec.operation.request;
 atomicJson(acceptedOperationPath(root,r.operationId),rec,()=>{
  if(!same(readAcceptedOperation(root,r.operationId),previous))refuse("configured-verifier-operation-changed");
  if(!same(configuredVerifierCurrentCut(root,r.capsule,tool),r.current))refuse("configured-verifier-operation-source");
 });
}
/** @param {string} root @param {any} rec @param {()=>void} change @param {any} tool */
function retain(root,rec,change,tool){const previous=structuredClone(rec);change();persist(root,rec,previous,tool);}
/** Actual current owner, claims, source and canonical approval at effects.
 * @param {any} rec @param {object} context @param {any} [earlier] */
function current(rec,context,earlier=null){
 return withOperationRepositoryObservation(()=>{
  const actual=configuredVerifierOperationState(context);
  if(!same(actual.record,rec))refuse("configured-verifier-operation-changed");
  decisiveConfiguredAdmission(input(rec.operation.request),earlier,actual.handle,false,null,context);return actual;
 });
}
/** @param {any} r @param {any} bench */
function measuredBench(r,bench){
 const measured=measureQualifiedWorker(bench.checkout);
 const git=(/** @type {string[]} */ args)=>execFileSync("git",["--no-replace-objects","-C",bench.checkout,...args],{encoding:"utf8",maxBuffer:32*1024*1024,env:{...process.env,GIT_NO_LAZY_FETCH:"1",GIT_OPTIONAL_LOCKS:"0"}}).replace(/\n$/,"");
 if(measured.filesystemRoot!==bench.checkout||measured.gitCommonDirectory!==r.current.repositories[bench.role].commonDir||git(["rev-parse","HEAD"])!==bench.candidate||git(["rev-parse","--abbrev-ref","HEAD"])!=="HEAD"||git(["status","--porcelain=v1","--untracked-files=all"])!=="")refuse("configured-verifier-bench-changed");
 return measured;
}
/** Create the captured complete detached candidate set. Unknown creates stay
 * unattributed; this entry never adopts or removes an existing path.
 * @param {string} root @param {string} operationId @param {{tool:any}} configuration */
export async function createConfiguredVerifierBenches(root,operationId,configuration){
 const context=await captureConfiguredVerifierOperationContext(root,operationId,configuration),state=configuredVerifierOperationState(context),r=state.record.operation.request;
 root=state.record.resource;requireInstalledRuntimeAssets(configuration.tool,["configured-verifier-operation","configured-dispatch-operation","qualified-external-path"].map(name=>`tools/e2e/scripts/${name}.mjs`));
 const earlier=await configuredAdmissionPreflight(input(r),state.handle,context);
 return withNativeTransaction(root,{operation:"configured-verifier-benches"},()=>{
  const rec=readAcceptedOperation(root,operationId),p=rec.operation.progress;current(rec,context,earlier);
  if(p.preparation.stage!=="captured"||p.handoff.stage!=="held")refuse("configured-verifier-bench-stage");
  for(let i=0;i<r.benches.length;i++){
   const bench=r.benches[i],progress=p.benches[i];if(progress.stage==="created")continue;
   current(rec,context);retain(root,rec,()=>{progress.stage="creating";rec.state="unknown";rec.events.push({at:new Date().toISOString(),op:`configured-verifier-${bench.role}-create-start`});},configuration.tool);
   // Recheck the exact parent/absence and original source/current grant after
   // durable intent, immediately before the fixed Git effect. No unknown
   // creating path may enter through recovery to repeat this call.
   assertExternalParent(bench.parent,Object.values(r.current.repositories).flatMap((/** @type {any} */ repo)=>repo.identities));
   try{lstatSync(bench.checkout);refuse("configured-verifier-bench-exists");}catch(error){if(/** @type {any} */(error).code!=="ENOENT")throw error;}
   if(!same(configuredVerifierCurrentCut(root,r.capsule,configuration.tool),r.current)||!same(verifyConfiguredDispatch(state.handle),r.capsule)||!same(readQualifiedVerifierInputsNow(root,r.executor.source.attempt),r.executor)||!same(readAcceptedOperation(root,operationId),rec))refuse("configured-verifier-operation-source");
   qualifiedPhasePolicy(root,readRecord(root,r.executor.source.attempt),"verifier","child-start");
   execFileSync("git",["--no-replace-objects","-C",r.current.repositories[bench.role].root,"worktree","add","--detach","--no-guess-remote",bench.checkout,bench.candidate],{stdio:["ignore","pipe","pipe"],env:{...process.env,GIT_NO_LAZY_FETCH:"1",GIT_OPTIONAL_LOCKS:"0"}});
   const identity=measuredBench(r,bench);
   if(!same(verifyConfiguredDispatch(state.handle),r.capsule)||!same(readQualifiedVerifierInputsNow(root,r.executor.source.attempt),r.executor)||!same(readAcceptedOperation(root,operationId),rec))refuse("configured-verifier-operation-source");
   qualifiedPhasePolicy(root,readRecord(root,r.executor.source.attempt),"verifier","child-start");
   retain(root,rec,()=>{progress.identity=identity;progress.stage="created";rec.events.push({at:new Date().toISOString(),op:`configured-verifier-${bench.role}-created`});},configuration.tool);current(rec,context);
  }
  return {status:"benches-created",operationId,benches:structuredClone(p.benches),started:false};
 });
}
/** Shared actual current-policy preparation intent, before the canonical
 * entry exists. Repeating it does not publish another preparation.
 * @param {string} root @param {string} operationId @param {{tool:any}} configuration */
async function preparationIntent(root,operationId,configuration){
 const context=await captureConfiguredVerifierOperationContext(root,operationId,configuration),state=configuredVerifierOperationState(context),r=state.record.operation.request;
 root=state.record.resource;requireInstalledRuntimeAssets(configuration.tool,["configured-verifier-operation","configured-dispatch-operation","qualified-verification"].map(name=>`tools/e2e/scripts/${name}.mjs`));
 const earlier=await configuredAdmissionPreflight(input(r),state.handle,context);
 withNativeTransaction(root,{operation:"configured-verifier-prepare-intent"},()=>{
  const rec=readAcceptedOperation(root,operationId);current(rec,context,earlier);
  if(rec.operation.progress.benches.some((/** @type {any} */ row)=>row.stage!=="created")||rec.operation.progress.handoff.stage!=="held")refuse("configured-verifier-benches-required");
  if(rec.operation.progress.preparation.stage==="captured")retain(root,rec,()=>{rec.operation.progress.preparation.stage="preparing";rec.events.push({at:new Date().toISOString(),op:"configured-verifier-prepare-start"});},configuration.tool);
 });
 return {root,context,state,r};
}
/** Capture only the checked durable preparation intent, without a canonical
 * entry or phase text. This data is not a permission to prepare elsewhere.
 * @param {string} root @param {string} operationId @param {{tool:any}} configuration */
export async function beginConfiguredVerifierPreparation(root,operationId,configuration){
 await preparationIntent(root,operationId,configuration);return {status:"preparation-captured",operationId,started:false};
}
/** Acknowledge only the canonical actual preparation, including a prior
 * publication-before-ack. Phase one uses the same canonical METHOD renderer.
 * @param {string} root @param {string} operationId @param {{tool:any}} configuration */
export async function prepareConfiguredVerifierPhase1(root,operationId,configuration){
 const {root:actualRoot,context,state,r}=await preparationIntent(root,operationId,configuration);root=actualRoot;
 const assignment=configuredVerifierAssignmentData(r),expected=captureQualifiedVerifierPreparationNow(root,{executorAttempt:r.executor.source.attempt,assignment},state.handle);
 if(readQualifiedVerifierInputsNow(root,r.executor.source.attempt).preparations.length===0)
  await prepareQualifiedVerification(root,{attempt:r.executor.source.attempt,assignment,candidate:JSON.stringify(r.executor.candidates),attackSetFile:r.artifacts.attackSet,ownContext:context});
 return withNativeTransaction(root,{operation:"configured-verifier-prepare-ack"},()=>{
  const rec=readAcceptedOperation(root,operationId);current(rec,context);const p=rec.operation.progress,actual=readQualifiedPreparation(root,r.executor.source.attempt,expected.digest);
  if(!same(actual.entry.authority,expected.authority)||actual.entry.consumedBy!==null||actual.entry.seal!==null)refuse("configured-verifier-operation-preparation-changed");
  if(p.preparation.stage==="preparing")retain(root,rec,()=>{p.preparation={stage:"prepared",digest:expected.digest};rec.events.push({at:new Date().toISOString(),op:"configured-verifier-prepared"});},configuration.tool);
  const text=renderQualifiedPreparationPhase1(root,r.executor.source.attempt,expected.digest,r.artifacts.attackSet);
  if(p.artifacts.phase1===null){
   configuredTextNamespace(root,true);current(rec,context);
   try{lstatSync(r.artifacts.phase1);refuse("configured-verifier-phase1-exists");}catch(error){if(/** @type {any} */(error).code!=="ENOENT")throw error;}
   retain(root,rec,()=>{p.artifacts.phase1={stage:"captured",path:r.artifacts.phase1,text,sha256:sha256(text).slice(7),identity:null};rec.events.push({at:new Date().toISOString(),op:"configured-verifier-phase1-captured"});},configuration.tool);
  }
  const plan=p.artifacts.phase1;if(plan.text!==text)refuse("configured-verifier-phase1-changed");
  if(plan.stage==="captured"){
   try{lstatSync(plan.path);refuse("configured-verifier-phase1-write-unknown");}catch(error){if(/** @type {any} */(error).code!=="ENOENT")throw error;}
   const parents=configuredTextNamespace(root);current(rec,context);
   atomicNativeText(plan.path,plan.text,()=>{current(rec,context);if(!same(configuredTextNamespace(root),parents))refuse("configured-verifier-phase1-namespace");try{lstatSync(plan.path);refuse("configured-verifier-phase1-exists");}catch(error){if(/** @type {any} */(error).code!=="ENOENT")throw error;}});
   const identity=measureConfiguredTextArtifact(root,plan);retain(root,rec,()=>{plan.stage="written";plan.identity=identity;rec.events.push({at:new Date().toISOString(),op:"configured-verifier-phase1-written"});},configuration.tool);
  }
  measureConfiguredTextArtifact(root,plan);current(rec,context);
  return {status:"phase1-prepared",operationId,preparationDigest:expected.digest,path:plan.path,sha256:plan.sha256,started:false};
 });
}
