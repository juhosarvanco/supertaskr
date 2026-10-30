/** Finite configured lane operation owner. The first publication captures its
 * exact strict request and real claims; later stages retain those same facts.
 * The initial capture and protected private stamp are separate retained stages;
 * measured worktree creation follows the stamp; native preparation is separate. */
import { existsSync, lstatSync, readdirSync, rmdirSync, realpathSync, readFileSync, mkdirSync, constants, openSync, closeSync, fstatSync, readSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { preparedConfiguredArmContext, configuredArmRepository, captureConfiguredLaneDestination } from "./configured-dispatch-arm.mjs";
import { captureConfiguredDispatch, createConfiguredDispatchGateRunner } from "./configured-dispatch.mjs";
import { captureCompletedGenesisForDispatch, captureOriginalCompletedGenesisForDispatch } from "./genesis-bank-plan.mjs";
import { captureConfiguredArmOperationContext, captureConfiguredArmRecoveryContext } from "./configured-dispatch-context.mjs";
import { configuredArmStampIntent, configuredArmBriefPath, configuredArmAssignmentData, validConfiguredArmExecution, validConfiguredArmStampedSource } from "./configured-dispatch-record.mjs";
import { measureQualifiedWorker } from "./qualified-reservation.mjs";
import { readOperationRef, operationDestinationContains, acceptOperationRef } from "./operation-ref.mjs";
import { configuredAdmissionPreflight, decisiveConfiguredAdmission } from "./qualified-admission.mjs";
import { atomicJson, atomicNativeText, withNativeTransaction, syncNativeFileNamespace } from "./native-codex.mjs";
import { assertOperationOwnership, readReservation, takeReservation, releaseReservation, defaultRunIo, sha256, parseAssignment, readRecord, recordPath, loadQualifiedReservations } from "./run-record.mjs";
import { acceptedOperationPath, readAcceptedOperation, captureOperationRepository, operationOwnerAlive } from "./durable-operation.mjs";
import { operationContent, operationDigest, operationWork, validOperationRecord } from "./operation-record.mjs";
import { requireInstalledRuntimeAssets } from "./records-check.mjs";
import { assertExternalParent } from "./qualified-external-path.mjs";
import { captureExactWritePlan, prepareExactWriteTree, materializeExactWrites, releaseDeadExactWriteLock, assertExactRecordTransformations, safeOperationWorkingPath, snapshotRecordFile, intendedRecordFile } from "./record-write.mjs";

/** @param {string} code @returns {never} */
function refuse(code){throw Object.assign(new Error(`${code}: configured lane operation is unavailable`),{code});}
/** @param {any} a @param {any} b */
const same=(a,b)=>operationContent(a)===operationContent(b);
/** @param {string} root @param {string[]} args */
function git(root,args){try{return execFileSync("git",["--no-replace-objects","-C",root,...args],{encoding:"utf8",stdio:["ignore","pipe","pipe"],maxBuffer:32*1024*1024,env:{...process.env,GIT_NO_LAZY_FETCH:"1",GIT_OPTIONAL_LOCKS:"0"}}).replace(/\n$/,"");}catch{refuse("configured-arm-git");}}
/** @param {any} request @param {any} tool */
function original(request,tool){
 requireInstalledRuntimeAssets(tool,["configured-dispatch-operation","configured-dispatch-context","configured-dispatch-record","configured-dispatch-arm","qualified-external-path"].map(name=>`tools/e2e/scripts/${name}.mjs`));
 for(const role of ["product","records"]){const repository=request.repositories[role];
  if(!same(configuredArmRepository(repository.root,request.selection.revisions[role],tool),repository)||git(repository.root,["rev-parse","HEAD"])!==request.selection.revisions[role]||git(repository.root,["symbolic-ref","HEAD"])!==request.targetRefs[role])refuse("configured-arm-original-changed");
 }
 if(git(request.selection.authorityRoot,["status","--porcelain=v1","--untracked-files=all"])!=="")refuse("configured-arm-product-dirty");
 for(const lane of request.lanes){
  if(!same(captureConfiguredLaneDestination(lane.checkout,Object.values(request.repositories).flatMap((/** @type {any} */ repo)=>repo.identities)),lane.parent)||git(request.repositories[lane.role].root,["for-each-ref","--format=%(refname)",lane.branch])!=="")refuse("configured-arm-lane-changed");
 }
 const plan=captureExactWritePlan(request.repositories.records.root,request.selection.revisions.records,request.stamp.writes);
 if(plan.tree!==request.stamp.tree||!same(plan.working.preimages,request.stamp.working.preimages)||plan.working.index.previousDigest!==request.stamp.working.index.previousDigest||plan.working.index.resultDigest!==request.stamp.working.index.resultDigest)refuse("configured-arm-original-working-changed");
}
/** @param {string} root @param {any} rec @param {any} [previous] */
function persist(root,rec,previous = null){
 if(!validOperationRecord(rec))refuse("configured-arm-record");
 const r=rec.operation.request;
 for(const role of ["product","records"]){const expected=r.repositories[role].identities[0],actual=lstatSync(expected.path,{bigint:true});
  if(!actual.isDirectory()||actual.isSymbolicLink()||String(actual.dev)!==expected.device||String(actual.ino)!==expected.inode)refuse("configured-arm-original-changed");
 }
 const file=acceptedOperationPath(root,rec.operation.id);
 atomicJson(file,rec,()=>{
  if(previous===null){if(existsSync(file))refuse("configured-arm-operation-exists");}
  else if(!same(readAcceptedOperation(root,rec.operation.id),previous))refuse("configured-arm-operation-changed");
 });
}
/** Publish exactly one original OP and its canonical metadata claims. This
 * does not stamp, create a lane, run a suite or prepare/launch a native child.
 * @param {object} proposal @param {{tool:any}} configuration */
export async function beginConfiguredArmOperation(proposal,configuration){
 if(!configuration||Object.keys(configuration).join()!=="tool")refuse("configured-arm-options");
 const {request:r,handle}=preparedConfiguredArmContext(proposal,configuration.tool),root=r.selection.authorityRoot;
 const input={version:1,...r.selection,taskId:r.taskId,roles:[...new Set(r.scope.paths.map((/** @type {any} */ p)=>p.role))],
  admission:{boundary:"lane-cut",role:"executor",kind:"explicit",parent:"",evidence:"",scope:"product-change",attempt:null}};
 if(readAcceptedOperation(root,r.operationId)!==null)refuse("configured-arm-operation-exists");
 original(r,configuration.tool);const earlier=await configuredAdmissionPreflight(input,handle);
 return withNativeTransaction(root,{operation:"configured-dispatch-begin"},()=>{
  if(readAcceptedOperation(root,r.operationId)!==null)refuse("configured-arm-operation-exists");
  original(r,configuration.tool);decisiveConfiguredAdmission(input,earlier,handle);
  const io=defaultRunIo(),identity=io.identity(process.pid),at=new Date().toISOString();if(identity===null)refuse("configured-arm-owner-unknown");
  const work=operationWork(r.operationId),assignment={kind:"operation",id:work,role:"configured-dispatch",resource:root};
  const rec=/** @type {any} */ ({version:1,recordKind:"operation",attempt:`${work}-a1`,state:"starting",assignment,assignmentDigest:sha256(JSON.stringify(assignment)),
   writer:true,resource:root,reservation:{file:null,takenAt:at,releasedAt:null},execution:null,admission:null,
   operation:{version:1,id:r.operationId,kind:"configured-dispatch",request:r,digest:operationDigest(r),owner:{pid:process.pid,identity,token:randomUUID()},createdAt:at,claims:[],
    progress:{baseline:{stage:r.baseline.kind==="initialized-code-empty"?"complete":"captured",capture:null},stamp:{stage:"captured",intent:null,acceptance:null},
     lanes:r.lanes.map((/** @type {any} */ l)=>({role:l.role,stage:"captured",identity:null})),handoff:{stage:"held",source:null,native:null,brief:null}},acceptance:null},events:[{at,op:"configured-dispatch-capture"}]});
  const acquired=[],directory=path.dirname(acceptedOperationPath(root,r.operationId)),absent=!existsSync(directory);
  try{
   for(const role of ["product","records"]){
    original(r,configuration.tool);decisiveConfiguredAdmission(input,earlier,handle);
    const resource=r.repositories[role].root;assertOperationOwnership(root,{resource,attempt:rec.attempt});if(readReservation(root,resource)!==null)refuse("configured-arm-resource-held");
    const taken=takeReservation(root,{resource,attempt:rec.attempt,role:"configured-dispatch",at});acquired.push(resource);
    rec.operation.claims.push({role,resource,file:taken.file,takenAt:at,releasedAt:null});if(role==="product")rec.reservation.file=taken.file;
   }
   persist(root,rec);return {record:structuredClone(rec),file:acceptedOperationPath(root,r.operationId),started:false};
  }catch(error){
   if(!existsSync(acceptedOperationPath(root,r.operationId))){
    for(const resource of acquired)if(readReservation(root,resource)?.attempt===rec.attempt)releaseReservation(root,{resource,attempt:rec.attempt});
    if(absent&&existsSync(directory)&&lstatSync(directory).isDirectory()&&!lstatSync(directory).isSymbolicLink()&&readdirSync(directory).length===0){rmdirSync(directory);syncNativeFileNamespace(directory);}
   }
   throw error;
  }
 });
}

/** @param {string} root @param {any} rec @param {()=>void} change */
function retain(root,rec,change){const previous=structuredClone(rec);change();persist(root,rec,previous);}
/** Exact past stamp attribution is read without current TOOL/grant adoption.
 * @param {any} rec */
function observedStamp(rec){
 const r=rec.operation.request,p=rec.operation.progress.stamp,repository=r.repositories.records;
 for(const role of ["product","records"]){const original=r.repositories[role];
  if(!same(captureOperationRepository(original.root,r.selection.revisions[role],{forEffect:false}),original))refuse("configured-arm-original-changed");
 }
 const intent=configuredArmStampIntent(r),witness=readOperationRef(repository.root,intent.correlationRef),tip=readOperationRef(repository.root,intent.ref);
 if(witness!==null&&witness!==intent.commit)refuse("configured-arm-stamp-correlation");
 if(p.intent===null){if(witness!==null)refuse("configured-arm-stamp-intent");return null;}
 if(!same(p.intent,intent))refuse("configured-arm-stamp-intent");
 if(witness===null){if(p.acceptance!==null||tip!==intent.previousRevision)refuse("configured-arm-stamp-uncertain");return null;}
 const raw=execFileSync("git",["--no-replace-objects","-C",repository.root,"cat-file","commit",r.stamp.commit],{maxBuffer:32*1024*1024,env:{...process.env,GIT_NO_LAZY_FETCH:"1",GIT_OPTIONAL_LOCKS:"0"}});
 if(!raw.equals(Buffer.from(r.stamp.commitBase64,"base64"))||p.acceptance===null&&(tip===null||!operationDestinationContains(repository.root,intent.commit,tip)))refuse("configured-arm-stamp-uncertain");
 return {commit:intent.commit,tree:intent.tree,ref:intent.ref,previousRevision:intent.previousRevision,attribution:"exact"};
}
/** Read-only past fact; this grants no subsequent lane or worker effect.
 * @param {string} root @param {string} operationId */
export function observeConfiguredArmStamp(root,operationId){
 const rec=readAcceptedOperation(root,operationId);if(rec?.operation.kind!=="configured-dispatch"||rec.resource!==realpathSync(root))refuse("configured-arm-operation-missing");
 const stamp=observedStamp(rec);return stamp===null?{status:"pending",operationId}:{status:"stamped",operationId,stamp,started:false};
}
/** @param {any} r @param {boolean} stamped */
function admissionInput(r,stamped=false){return {version:1,...r.selection,revisions:{...r.selection.revisions,records:stamped?r.stamp.commit:r.selection.revisions.records},taskId:r.taskId,
 roles:[...new Set(r.scope.paths.map((/** @type {any} */ p)=>p.role))],admission:{boundary:"lane-cut",role:"executor",kind:"explicit",parent:"",evidence:"",scope:"product-change",attempt:null}};}
/** One current original policy/origin/working/claim/worker check for the
 * finite lane, brief and handoff producers. No caller policy callback.
 * @param {any} rec @param {any} tool @param {object} handle @param {object} context @param {any} [earlier] */
function currentArm(rec,tool,handle,context,earlier=null){
 requireInstalledRuntimeAssets(tool,["tools/e2e/scripts/qualified-external-path.mjs"]);
 const r=rec.operation.request,p=rec.operation.progress,root=rec.resource,input=admissionInput(r,true);
 if(p.handoff.stage==="ready")input.admission.boundary="child-start";
   if(r.baseline.kind==="initialized-code-empty"&&!same(captureOriginalCompletedGenesisForDispatch({productRoot:root,operationId:r.operationId,tool}),r.baseline))refuse("configured-arm-initial-baseline-changed");
   for(const role of ["product","records"]){const repository=r.repositories[role],revision=role==="records"?r.stamp.commit:r.selection.revisions.product;
    if(!same(configuredArmRepository(repository.root,r.selection.revisions[role],tool),repository)||git(repository.root,["rev-parse","HEAD"])!==revision||git(repository.root,["symbolic-ref","HEAD"])!==r.targetRefs[role])refuse("configured-arm-original-changed");
    assertOperationOwnership(root,{resource:repository.root,attempt:rec.attempt});
    const claim=rec.operation.claims.find((/** @type {any} */ row)=>row.role===role),held=readReservation(root,repository.root);
    if(claim.releasedAt===null?held?.attempt!==rec.attempt&&!(held===null&&p.handoff.stage==="releasing"):held?.attempt===rec.attempt)refuse("configured-arm-resource-held");
   }
   if(git(root,["status","--porcelain=v1","--untracked-files=all"])!=="")refuse("configured-arm-product-dirty");
   if(operationDigest(readFileSync(r.stamp.working.index.path).toString("base64"))!==r.stamp.working.index.resultDigest)refuse("configured-arm-stamp-index-changed");
   assertExactRecordTransformations(r.repositories.records.root,r.stamp.writes.map((/** @type {any} */ w)=>w.path));
   for(const write of r.stamp.writes)if(!same(snapshotRecordFile(safeOperationWorkingPath(r.repositories.records.root,write.path)),intendedRecordFile(write)))refuse("configured-arm-stamp-working-changed");
   for(let i=0;i<r.lanes.length;i++){
    const lane=r.lanes[i],progress=p.lanes[i];
    assertExternalParent(lane.parent,Object.values(r.repositories).flatMap((/** @type {any} */ repo)=>repo.identities));
    if(progress.stage==="created")measuredLane(r,lane,progress);
    else if(progress.stage==="creating")refuse("configured-arm-lane-create-unknown");
    else {
     try{lstatSync(lane.checkout);refuse("configured-arm-destination-exists");}catch(error){if(/** @type {any} */(error).code!=="ENOENT")throw error;}
     if(git(r.repositories[lane.role].root,["for-each-ref","--format=%(refname)",lane.branch])!=="")refuse("configured-arm-branch-exists");
    }
   }
   decisiveConfiguredAdmission(input,earlier,handle,false,null,context);return true;
}
/** Protected private stamp only. Baseline execution is the original configured
 * registry and exact P cut, never a caller command/result. Unknown execution is
 * retained and is not automatically repeated. This does not create a lane.
 * @param {string} root @param {string} operationId @param {{tool:any}} configuration */
export async function executeConfiguredArmStamp(root,operationId,configuration){
 if(!configuration||Object.keys(configuration).join()!=="tool")refuse("configured-arm-options");
 root=realpathSync(root);const before=readAcceptedOperation(root,operationId);
 if(before?.operation.kind!=="configured-dispatch"||before.resource!==root)refuse("configured-arm-operation-missing");
 const historical=observedStamp(before);if(historical!==null)return {status:"stamped",operationId,stamp:historical,started:false};
 const r=before.operation.request,tool=configuration.tool;
 requireInstalledRuntimeAssets(tool,["configured-dispatch-operation","configured-dispatch-context","record-write","operation-ref"].map(n=>`tools/e2e/scripts/${n}.mjs`));
 const handle=captureConfiguredDispatch({...r.selection,taskId:r.taskId,tool}),input=admissionInput(r),context=captureConfiguredArmOperationContext(root,operationId,{tool});
 const earlier=await configuredAdmissionPreflight(input,handle,context);
 return withNativeTransaction(root,{operation:"configured-dispatch-stamp"},()=>{
  const rec=readAcceptedOperation(root,operationId);if(rec?.operation.kind!=="configured-dispatch"||!same(rec.operation.request,r))refuse("configured-arm-operation-changed");
  const existing=observedStamp(rec);if(existing!==null)return {status:"stamped",operationId,stamp:existing,started:false};
  const p=rec.operation.progress,stamp=r.stamp;
  if(p.handoff.stage!=="held"||p.lanes.some((/** @type {any} */ l)=>l.stage!=="captured"))refuse("configured-arm-stamp-stage");
  /** Current original policy and physical/index/working ownership before each
   * managed object, file, index and ref effect. No generic authorize callback.
   * @param {string} phase @returns {true} */
  const permit=phase=>{
   for(const role of ["product","records"]){const repo=r.repositories[role];
    if(!same(configuredArmRepository(repo.root,r.selection.revisions[role],tool),repo)||git(repo.root,["rev-parse","HEAD"])!==r.selection.revisions[role]||git(repo.root,["symbolic-ref","HEAD"])!==r.targetRefs[role])refuse("configured-arm-original-changed");
    assertOperationOwnership(root,{resource:repo.root,attempt:rec.attempt});if(readReservation(root,repo.root)?.attempt!==rec.attempt)refuse("configured-arm-resource-held");
   }
   if(git(root,["status","--porcelain=v1","--untracked-files=all"])!=="")refuse("configured-arm-product-dirty");
   const side=r.repositories.records.root,partial=["consumer-prepare","files-prepared"].includes(p.stamp.stage),index=operationDigest(readFileSync(stamp.working.index.path).toString("base64"));
   if(!(partial?[stamp.working.index.previousDigest,stamp.working.index.resultDigest]:[stamp.working.index.previousDigest]).includes(index))refuse("configured-arm-stamp-index-changed");
   assertExactRecordTransformations(side,stamp.writes.map((/** @type {any} */ w)=>w.path));assertExactRecordTransformations(side,stamp.writes.map((/** @type {any} */ w)=>w.path),r.selection.revisions.records);
   for(const write of stamp.writes){const actual=snapshotRecordFile(safeOperationWorkingPath(side,write.path)),previous=stamp.working.preimages.find((/** @type {any} */ row)=>row.path===write.path).work;
    if(!same(actual,previous)&&!(partial&&same(actual,intendedRecordFile(write))))refuse("configured-arm-stamp-working-changed");
   }
   decisiveConfiguredAdmission(input,phase==="initial"?earlier:null,handle,false,null,context);return true;
  };
  permit("initial");
  if(r.baseline.kind==="initialized-code-empty"){
   if(!same(captureCompletedGenesisForDispatch({productRoot:root,tool,taskId:r.taskId}),r.baseline))refuse("configured-arm-initial-baseline-changed");
  }else{
   if(p.baseline.stage==="running")refuse("configured-arm-baseline-unknown");
   if(p.baseline.stage==="captured"){
    retain(root,rec,()=>{p.baseline.stage="running";rec.state="unknown";rec.events.push({at:new Date().toISOString(),op:"configured-baseline-start"});});
    const result=createConfiguredDispatchGateRunner(handle,{productRoot:root,productRevision:r.selection.revisions.product}).run([...r.capsule.gatePolicy.required]);
    permit("baseline-return");retain(root,rec,()=>{p.baseline.stage="complete";p.baseline.capture=result.capture;rec.events.push({at:new Date().toISOString(),op:"configured-baseline-complete"});});
   }
   if(p.baseline.stage!=="complete"||p.baseline.capture?.complete!==true)refuse("configured-arm-baseline-not-green");
  }
  if(p.stamp.stage==="captured"){
   permit("stamp-start");retain(root,rec,()=>{p.stamp.stage="objects-start";p.stamp.intent=configuredArmStampIntent(r);rec.state="unknown";rec.events.push({at:new Date().toISOString(),op:"configured-stamp-objects-start"});});
  }
  if(p.stamp.stage==="objects-start"){
   prepareExactWriteTree(r.repositories.records.root,r.selection.revisions.records,stamp.writes,stamp.tree,()=>permit("stamp-object"));
   permit("stamp-commit-object");const commit=execFileSync("git",["--no-replace-objects","-C",r.repositories.records.root,"hash-object","-w","-t","commit","--stdin"],{input:Buffer.from(stamp.commitBase64,"base64"),encoding:"utf8",env:{...process.env,GIT_NO_LAZY_FETCH:"1",GIT_OPTIONAL_LOCKS:"0"}}).replace(/\n$/,"");
   if(commit!==stamp.commit)refuse("configured-arm-stamp-commit");retain(root,rec,()=>{p.stamp.stage="objects-prepared";});
  }
  if(p.stamp.stage==="objects-prepared"){
   permit("stamp-consumer-prepare");retain(root,rec,()=>{p.stamp.stage="consumer-prepare";});
  }
  if(!["consumer-prepare","files-prepared"].includes(p.stamp.stage))refuse("configured-arm-stamp-stage");
  let release;
  try{
   releaseDeadExactWriteLock(stamp.working.index.path,r.operationId,stamp.working.index.lockToken,()=>permit("stamp-lock-recovery"));
   release=materializeExactWrites(root,{writes:stamp.writes,...stamp.working},{operationId:r.operationId,request:{repository:r.repositories.records}},phase=>permit(phase));
   if(p.stamp.stage!=="files-prepared")retain(root,rec,()=>{p.stamp.stage="files-prepared";});
   permit("stamp-ref");acceptOperationRef(r.repositories.records.root,p.stamp.intent);
   const accepted=observedStamp(rec);if(accepted===null)refuse("configured-arm-stamp-uncertain");
   retain(root,rec,()=>{p.stamp.acceptance=accepted;p.stamp.stage="ref-accepted";rec.events.push({at:new Date().toISOString(),op:"configured-stamp-accepted"});});
   return {status:"stamped",operationId,stamp:accepted,started:false};
  }finally{release?.();}
 });
}

/** Exact acknowledged lane, including physical identity and original branch
 * tip. A pathname or a matching commit alone cannot recover an unknown create.
 * @param {any} request @param {any} lane @param {any} progress */
function measuredLane(request,lane,progress){
 const identity=measureQualifiedWorker(lane.checkout);
 if(identity.filesystemRoot!==lane.checkout||identity.gitCommonDirectory!==request.repositories[lane.role].commonDir||
  (progress.identity!==null&&!same(identity,progress.identity))||git(lane.checkout,["symbolic-ref","HEAD"])!==lane.branch||
  git(lane.checkout,["rev-parse","HEAD"])!==lane.base||git(lane.checkout,["status","--porcelain=v1","--untracked-files=all"])!=="")refuse("configured-arm-lane-changed");
 return identity;
}
/** Read-only exact acknowledged workers. This is an observation, not an
 * admission/claim handoff or an exception for a matching unretained path.
 * @param {string} root @param {string} operationId */
export function observeConfiguredArmLanes(root,operationId){
 root=realpathSync(root);const rec=readAcceptedOperation(root,operationId);
 if(rec?.operation.kind!=="configured-dispatch"||rec.resource!==root||observedStamp(rec)===null||rec.operation.progress.lanes.some((/** @type {any} */ lane)=>lane.stage!=="created"))refuse("configured-arm-lanes-required");
 const request=rec.operation.request;
 return rec.operation.progress.lanes.map((/** @type {any} */ progress,/** @type {number} */ i)=>({role:progress.role,identity:measuredLane(request,request.lanes[i],progress)}));
}
/** Create only the original finite absent worktrees. The original OP retains
 * each intent and measured result; no foreign directory/ref is adopted or
 * removed and an unacknowledged create outcome cannot be silently repeated.
 * @param {string} root @param {string} operationId @param {{tool:any}} configuration */
export async function createConfiguredArmLanes(root,operationId,configuration){
 if(!configuration||Object.keys(configuration).join()!=="tool")refuse("configured-arm-options");
 root=realpathSync(root);const before=readAcceptedOperation(root,operationId);
 if(before?.operation.kind!=="configured-dispatch"||before.resource!==root||before.operation.progress.stamp.acceptance===null)refuse("configured-arm-stamp-required");
 const r=before.operation.request,tool=configuration.tool;
 requireInstalledRuntimeAssets(tool,["configured-dispatch-operation","configured-dispatch-context","qualified-reservation","genesis-bank-plan"].map(n=>`tools/e2e/scripts/${n}.mjs`));
 const input=admissionInput(r,true),handle=captureConfiguredDispatch({...r.selection,revisions:input.revisions,taskId:r.taskId,tool});
 if(!validConfiguredArmStampedSource(r,handle.capsule))refuse("configured-arm-operation-capsule");
 const context=captureConfiguredArmOperationContext(root,operationId,{tool}),earlier=await configuredAdmissionPreflight(input,handle,context);
 return withNativeTransaction(root,{operation:"configured-dispatch-lanes"},()=>{
  const rec=readAcceptedOperation(root,operationId);if(rec?.operation.kind!=="configured-dispatch"||!same(rec.operation.request,r))refuse("configured-arm-operation-changed");
  const p=rec.operation.progress;if(p.handoff.stage!=="held"||observedStamp(rec)===null)refuse("configured-arm-lane-stage");
  /** @param {boolean} [initial] */
  const permit=(initial=false)=>currentArm(rec,tool,handle,context,initial?earlier:null);
  permit(true);
  for(let i=0;i<r.lanes.length;i++){
   const lane=r.lanes[i],progress=p.lanes[i];if(progress.stage==="created")continue;
   permit();retain(root,rec,()=>{progress.stage="creating";rec.state="unknown";rec.events.push({at:new Date().toISOString(),op:`configured-lane-${lane.role}-create-start`});});
   // No callback or caller command can run between this checked intent and the
   // fixed Git call. A failed/unknown call retains creating for explicit review.
   git(r.repositories[lane.role].root,["worktree","add","--no-guess-remote","-b",lane.branch.slice("refs/heads/".length),lane.checkout,lane.base]);
   const identity=measuredLane(r,lane,progress);
   retain(root,rec,()=>{progress.identity=identity;progress.stage="created";rec.events.push({at:new Date().toISOString(),op:`configured-lane-${lane.role}-created`});});
   permit();
  }
  return {status:"lanes-created",operationId,lanes:p.lanes.map((/** @type {any} */ lane)=>({role:lane.role,identity:structuredClone(lane.identity)})),started:false};
 });
}

/** Fixed plain coordinator namespace only. This never follows a selected
 * records path or a caller-provided output path.
 * @param {string} root @param {boolean} [create] */
function briefNamespace(root,create=false){
 const runtime=path.join(root,".supertaskr"),directory=path.join(runtime,"briefs"),identities=[];
 for(const file of [runtime,directory]){
  if(file===directory&&create&&!existsSync(file)){mkdirSync(file,{mode:0o700});syncNativeFileNamespace(file);}
  const state=lstatSync(file,{bigint:true});
  if(!state.isDirectory()||state.isSymbolicLink()||realpathSync(file)!==file)refuse("configured-arm-brief-namespace");
  identities.push({path:file,device:String(state.dev),inode:String(state.ino)});
 }
 return identities;
}
/** Measure exact bounded literal Markdown through a no-follow descriptor.
 * @param {string} root @param {any} plan */
function measuredBrief(root,plan){
 const parents=briefNamespace(root);if(constants.O_NOFOLLOW===undefined||constants.O_NONBLOCK===undefined)refuse("configured-arm-brief-platform");
 const fd=openSync(plan.path,constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);
 try{
  const before=fstatSync(fd,{bigint:true}),expected=Buffer.from(plan.text),bytes=Buffer.alloc(expected.length);
  if(!before.isFile()||before.nlink!==1n||(before.mode&511n)!==384n||before.size!==BigInt(expected.length))refuse("configured-arm-brief-changed");
  let count=0;while(count<bytes.length){const read=readSync(fd,bytes,count,bytes.length-count,null);if(!read)break;count+=read;}
  if(count!==bytes.length||readSync(fd,Buffer.alloc(1),0,1,null)!==0||!bytes.equals(expected))refuse("configured-arm-brief-changed");
  const after=fstatSync(fd,{bigint:true}),named=lstatSync(plan.path,{bigint:true});
  if(!named.isFile()||named.isSymbolicLink()||named.nlink!==1n||[after,named].some(state=>state.dev!==before.dev||state.ino!==before.ino||state.mode!==before.mode||state.size!==before.size||state.mtimeNs!==before.mtimeNs||state.ctimeNs!==before.ctimeNs)||!same(briefNamespace(root),parents))refuse("configured-arm-brief-changed");
  const identity={path:plan.path,device:String(before.dev),inode:String(before.ino),mode:0o600,byteLength:bytes.length,sha256:plan.sha256};
  if(plan.identity!==null&&!same(plan.identity,identity))refuse("configured-arm-brief-changed");
  return identity;
 }finally{closeSync(fd);}
}
/** Shared bounded literal runtime artifact mechanics; policy/paths remain at
 * actual configured owners. No overwrite or permission is granted. */
export {briefNamespace as configuredTextNamespace,measuredBrief as measureConfiguredTextArtifact};
/** Actual retained brief fact only. No current grant, successor TOOL, worker
 * launch or native admission is inferred from this original file observation.
 * @param {string} root @param {string} operationId */
export function observeConfiguredArmBrief(root,operationId){
 root=realpathSync(root);const rec=readAcceptedOperation(root,operationId);
 if(rec?.operation.kind!=="configured-dispatch"||rec.resource!==root||rec.operation.progress.handoff.brief?.stage!=="written"||observedStamp(rec)===null)refuse("configured-arm-brief-required");
 const plan=rec.operation.progress.handoff.brief,identity=measuredBrief(root,plan);
 if(!same(readAcceptedOperation(root,operationId),rec))refuse("configured-arm-operation-changed");
 return {status:"brief-prepared",operationId,path:plan.path,sha256:plan.sha256,identity};
}
/** Retain the actual complete13-row brief and its fixed plain runtime file
 * before assignment. Caller text/path/readiness is never accepted. Unknown
 * unacknowledged publication refuses rather than overwriting a matching file.
 * @param {string} root @param {string} operationId @param {{tool:any}} configuration */
export async function prepareConfiguredArmBrief(root,operationId,configuration){
 if(!configuration||Object.keys(configuration).join()!=="tool")refuse("configured-arm-options");
 root=realpathSync(root);const before=readAcceptedOperation(root,operationId);
 if(before?.operation.kind!=="configured-dispatch"||before.operation.progress.handoff.stage!=="held"||before.operation.progress.lanes.some((/** @type {any} */ lane)=>lane.stage!=="created"))refuse("configured-arm-lanes-required");
 const tool=configuration.tool,r=before.operation.request;
 requireInstalledRuntimeAssets(tool,["configured-dispatch-operation","configured-dispatch-brief","configured-dispatch-context","native-codex"].map(n=>`tools/e2e/scripts/${n}.mjs`));
 const brief=await import("./configured-dispatch-brief.mjs"),derived=await brief.configuredDispatchOwnedBrief(root,operationId,{tool});
 if(!derived.complete||derived.code!==0)refuse("configured-arm-brief-incomplete");
 const input=admissionInput(r,true),handle=captureConfiguredDispatch({...r.selection,revisions:input.revisions,taskId:r.taskId,tool});
 if(!validConfiguredArmStampedSource(r,handle.capsule))refuse("configured-arm-operation-capsule");
 const context=captureConfiguredArmOperationContext(root,operationId,{tool}),earlier=await configuredAdmissionPreflight(input,handle,context);
 return withNativeTransaction(root,{operation:"configured-dispatch-brief"},()=>{
  const rec=readAcceptedOperation(root,operationId);if(rec?.operation.kind!=="configured-dispatch"||!same(rec.operation.request,r)||rec.operation.progress.handoff.stage!=="held"||rec.operation.progress.lanes.some((/** @type {any} */ lane)=>lane.stage!=="created"))refuse("configured-arm-operation-changed");
  currentArm(rec,tool,handle,context,earlier);const h=rec.operation.progress.handoff;
  if(h.brief==null){
   briefNamespace(root,true);currentArm(rec,tool,handle,context);
   const file=configuredArmBriefPath(r);try{lstatSync(file);refuse("configured-arm-brief-exists");}catch(error){if(/** @type {any} */(error).code!=="ENOENT")throw error;}
   retain(root,rec,()=>{h.brief={stage:"captured",path:file,text:derived.text,sha256:sha256(derived.text).slice("sha256:".length),identity:null};rec.events.push({at:new Date().toISOString(),op:"configured-brief-captured"});});
  }
  const plan=h.brief;
  if(plan.stage==="captured"){
   try{lstatSync(plan.path);refuse("configured-arm-brief-write-unknown");}catch(error){if(/** @type {any} */(error).code!=="ENOENT")throw error;}
   const parents=briefNamespace(root);currentArm(rec,tool,handle,context);
   atomicNativeText(plan.path,plan.text,()=>{
    currentArm(rec,tool,handle,context);if(!same(briefNamespace(root),parents))refuse("configured-arm-brief-namespace");
    try{lstatSync(plan.path);refuse("configured-arm-brief-exists");}catch(error){if(/** @type {any} */(error).code!=="ENOENT")throw error;}
   });
   const identity=measuredBrief(root,plan);retain(root,rec,()=>{plan.stage="written";plan.identity=identity;rec.events.push({at:new Date().toISOString(),op:"configured-brief-written"});});
  }
  measuredBrief(root,plan);currentArm(rec,tool,handle,context);
  return {status:"brief-prepared",operationId,path:plan.path,sha256:plan.sha256,started:false};
 });
}

/** Actual expected prepared native row, never a supplied record. This reads
 * immutable correspondence first; current writer/set/TOOL checks are separate.
 * @param {string} root @param {any} rec @param {typeof import("./qualified-native.mjs")} native */
function preparedNative(root,rec,native){
 const r=rec.operation.request,h=rec.operation.progress.handoff,file=recordPath(root,r.expectedAttempt);
 if(!existsSync(file))return null;
 const source=readRecord(root,r.expectedAttempt),q=source.native?.qualified;
 if(!["ready","native-prepared"].includes(h.stage)||!q||source.assignmentDigest!==sha256(JSON.stringify(source.assignment))||source.permission?.digest!==native.qualifiedNativeCommitment(q)||
  !same(source.assignment,parseAssignment(configuredArmAssignmentData(r,h)))||!same(q.origins.configuredDispatch,h.source)||
  !same(q.origins.configuredArm,{operationId:rec.operation.id,requestDigest:rec.operation.digest})||source.brief?.path!==h.brief.path||source.brief?.digest!==`sha256:${h.brief.sha256}`)refuse("configured-arm-native-record-changed");
 const acknowledgement={attempt:source.attempt,assignmentDigest:source.assignmentDigest,permissionDigest:source.permission.digest};
 if(h.native!==null&&!same(h.native,acknowledgement))refuse("configured-arm-native-record-changed");
 return {source,acknowledgement};
}
/** Original-first accepted acknowledgement, no successor TOOL/current grant
 * and no fresh launch instruction. Current worker readiness is not claimed.
 * @param {string} root @param {string} operationId */
export async function observeConfiguredArmNative(root,operationId){
 root=realpathSync(root);const rec=readAcceptedOperation(root,operationId);
 if(rec?.operation.kind!=="configured-dispatch"||rec.resource!==root)refuse("configured-arm-operation-missing");
 if(rec.state!=="finished")return {status:"pending",operationId,started:false};
 await loadQualifiedReservations();const native=await import("./qualified-native.mjs");
 if(observedStamp(rec)===null)refuse("configured-arm-stamp-required");
 const prepared=preparedNative(root,rec,native);if(prepared===null||!same(readAcceptedOperation(root,operationId),rec))refuse("configured-arm-native-record-changed");
 return {status:"native-prepared",operationId,attempt:prepared.source.attempt,file:recordPath(root,prepared.source.attempt),repeated:true,started:false,launch:null};
}
/** Current policy before adopting only a proven-dead predecessor. A ready OP
 * recovery context may preview lane-cut policy but can never admit a child.
 * Native preparation that already exists must use exact past acknowledgement.
 * @param {string} root @param {string} operationId @param {{tool:any}} configuration */
export async function adoptConfiguredArmOperation(root,operationId,configuration){
 if(!configuration||Object.keys(configuration).join()!=="tool")refuse("configured-arm-options");
 root=realpathSync(root);const before=readAcceptedOperation(root,operationId);
 if(before?.operation.kind!=="configured-dispatch"||before.resource!==root||before.state==="finished")refuse("configured-arm-operation-owner");
 const io=defaultRunIo(),identity=io.identity(process.pid);if(identity===null)refuse("configured-arm-owner-unknown");
 if(before.operation.owner.pid===process.pid&&before.operation.owner.identity===identity)return {status:"owned",operationId,adopted:false};
 if(operationOwnerAlive(before.operation.owner,io))refuse("configured-arm-operation-owner-live");
 const r=before.operation.request,tool=configuration.tool,stamped=before.operation.progress.stamp.acceptance!==null,input=admissionInput(r,stamped);
 if(existsSync(recordPath(root,r.expectedAttempt)))refuse("configured-arm-native-ack-required");
 const handle=captureConfiguredDispatch({...r.selection,revisions:input.revisions,taskId:r.taskId,tool}),context=captureConfiguredArmRecoveryContext(root,operationId,{tool});
 const earlier=await configuredAdmissionPreflight(input,handle,context);
 return withNativeTransaction(root,{operation:"configured-dispatch-adopt"},()=>{
  const rec=readAcceptedOperation(root,operationId);if(rec?.operation.kind!=="configured-dispatch"||!same(rec.operation.request,r)||!same(rec.operation.owner,before.operation.owner)||rec.state==="finished"||existsSync(recordPath(root,r.expectedAttempt)))refuse("configured-arm-operation-changed");
  if(operationOwnerAlive(rec.operation.owner,io))refuse("configured-arm-operation-owner-live");
  decisiveConfiguredAdmission(input,earlier,handle,false,null,context);
  retain(root,rec,()=>{rec.operation.owner={pid:process.pid,identity,token:randomUUID()};rec.events.push({at:new Date().toISOString(),op:"configured-backend-adopted"});});
  return {status:"owned",operationId,adopted:true};
 });
}
/** Acknowledgement of exact previously published private stamp only. Current
 * source effects remain separately guarded; no baseline/suite is replayed.
 * @param {string} root @param {string} operationId */
function acknowledgeObservedStamp(root,operationId){
 return withNativeTransaction(root,{operation:"configured-dispatch-stamp-ack"},()=>{
  const rec=readAcceptedOperation(root,operationId);if(rec?.operation.kind!=="configured-dispatch"||rec.resource!==root)refuse("configured-arm-operation-missing");
  const stamp=observedStamp(rec);if(stamp===null)return false;
  const io=defaultRunIo(),owner=rec.operation.owner;if(!(owner.pid===process.pid&&owner.identity===io.identity(process.pid))&&operationOwnerAlive(owner,io))refuse("configured-arm-operation-owner-live");
  const r=rec.operation.request;
  releaseDeadExactWriteLock(r.stamp.working.index.path,r.operationId,r.stamp.working.index.lockToken,()=>{
   const actual=readAcceptedOperation(root,operationId);
   return same(actual,rec)&&observedStamp(actual)!==null&&operationDigest(readFileSync(r.stamp.working.index.path).toString("base64"))===r.stamp.working.index.resultDigest;
  });
  if(rec.operation.progress.stamp.acceptance!==null)return true;
  retain(root,rec,()=>{rec.operation.progress.stamp.acceptance=stamp;rec.operation.progress.stamp.stage="ref-accepted";rec.events.push({at:new Date().toISOString(),op:"configured-stamp-acknowledged"});});
  return true;
 });
}
/** Metadata-only acknowledgement of an actual canonical prepared row. Different
 * live backend ownership remains read-only; no launch is replayed here.
 * @param {string} root @param {string} operationId @param {typeof import("./qualified-native.mjs")} native */
function acknowledgePreparedNative(root,operationId,native){
 return withNativeTransaction(root,{operation:"configured-dispatch-native-ack"},()=>{
  const rec=readAcceptedOperation(root,operationId);if(rec?.operation.kind!=="configured-dispatch"||rec.resource!==root)refuse("configured-arm-operation-missing");
  const prepared=preparedNative(root,rec,native);if(prepared===null)refuse("configured-arm-native-record-missing");
  if(rec.state==="finished")return {...prepared,acknowledged:true};
  const io=defaultRunIo(),owner=rec.operation.owner;
  if(!(owner.pid===process.pid&&owner.identity===io.identity(process.pid))&&operationOwnerAlive(owner,io))return {...prepared,acknowledged:false};
  if(rec.operation.progress.handoff.stage!=="ready"||rec.operation.claims.some((/** @type {any} */ claim)=>claim.releasedAt===null)||observedStamp(rec)===null)refuse("configured-arm-operation-handoff");
  for(const claim of rec.operation.claims)if(readReservation(root,claim.resource)?.attempt===rec.attempt)refuse("configured-arm-operation-claim");
  measuredBrief(root,rec.operation.progress.handoff.brief);native.validateQualifiedNative(root,prepared.source,true);
  for(let i=0;i<rec.operation.request.lanes.length;i++)measuredLane(rec.operation.request,rec.operation.request.lanes[i],rec.operation.progress.lanes[i]);
  retain(root,rec,()=>{const p=rec.operation.progress;p.handoff.native=prepared.acknowledgement;p.handoff.stage="native-prepared";
   rec.operation.acceptance={stamp:p.stamp.acceptance,lanes:p.lanes.map((/** @type {any} */ lane)=>({role:lane.role,identity:lane.identity})),sourceDigest:p.handoff.source.digest,native:p.handoff.native};
   rec.state="finished";rec.events.push({at:new Date().toISOString(),op:"configured-native-acknowledged"});});
  return {...prepared,acknowledged:true};
 });
}
/** Same original pipeline through durable claim handoff only. This fixed
 * waypoint starts no native child and returns no serialized start authority.
 * @param {string} root @param {string} operationId @param {{tool:any}} configuration */
export async function prepareConfiguredArmHandoff(root,operationId,configuration){
 if(!configuration||Object.keys(configuration).join()!=="tool")refuse("configured-arm-options");
 root=realpathSync(root);const before=readAcceptedOperation(root,operationId);
 if(before?.operation.kind!=="configured-dispatch"||before.resource!==root||before.state==="finished")refuse("configured-arm-operation-missing");
 const r=before.operation.request,tool=configuration.tool;
 if(!validConfiguredArmExecution(r.execution))refuse("configured-arm-execution-required");
 if(existsSync(recordPath(root,r.expectedAttempt)))refuse("configured-arm-native-ack-required");
 requireInstalledRuntimeAssets(tool,["configured-dispatch-operation","configured-dispatch-context","configured-dispatch-record","run-record"].map(n=>`tools/e2e/scripts/${n}.mjs`));
 await adoptConfiguredArmOperation(root,operationId,{tool});
 if(!acknowledgeObservedStamp(root,operationId))await executeConfiguredArmStamp(root,operationId,{tool});
 const stage=readAcceptedOperation(root,operationId).operation.progress.handoff.stage;
 if(stage==="held")await createConfiguredArmLanes(root,operationId,{tool});
 if(readAcceptedOperation(root,operationId).operation.progress.handoff.brief?.stage!=="written")await prepareConfiguredArmBrief(root,operationId,{tool});
 const input=admissionInput(r,true),handle=captureConfiguredDispatch({...r.selection,revisions:input.revisions,taskId:r.taskId,tool});
 if(before.operation.progress.handoff.stage==="ready")input.admission.boundary="child-start";
 let context=captureConfiguredArmOperationContext(root,operationId,{tool});
 const earlier=await configuredAdmissionPreflight(input,handle,context);
 withNativeTransaction(root,{operation:"configured-dispatch-handoff"},()=>{
  const rec=readAcceptedOperation(root,operationId);if(rec?.operation.kind!=="configured-dispatch"||!same(rec.operation.request,r))refuse("configured-arm-operation-changed");
  const h=rec.operation.progress.handoff;if(h.stage==="ready")return;
  currentArm(rec,tool,handle,context,earlier);measuredBrief(root,h.brief);
  if(h.stage==="held")retain(root,rec,()=>{h.stage="releasing";h.source=handle.capsule;rec.events.push({at:new Date().toISOString(),op:"configured-claim-handoff-start"});});
  if(h.stage!=="releasing")refuse("configured-arm-operation-handoff");
  for(const claim of rec.operation.claims){
   if(claim.releasedAt!==null)continue;currentArm(rec,tool,handle,context);
   const held=readReservation(root,claim.resource);if(held!==null){if(held.attempt!==rec.attempt)refuse("configured-arm-operation-claim");releaseReservation(root,{resource:claim.resource,attempt:rec.attempt});}
   syncNativeFileNamespace(claim.file);retain(root,rec,()=>{claim.releasedAt=new Date().toISOString();if(claim.role==="product")rec.reservation.releasedAt=claim.releasedAt;});
  }
  currentArm(rec,tool,handle,context);retain(root,rec,()=>{h.stage="ready";rec.events.push({at:new Date().toISOString(),op:"configured-claim-handoff-ready"});});
 });
 return {status:"handoff-ready",operationId,attempt:r.expectedAttempt,started:false};
}
/** Same operation, original role/execution/brief/workers only. This prepares a
 * native assignment through the existing canonical set-acquisition engine;
 * the host still owns actual launch/callback readiness and current effects.
 * @param {string} root @param {string} operationId @param {{tool:any}} configuration */
export async function prepareConfiguredArmNative(root,operationId,configuration){
 root=realpathSync(root);const observed=await observeConfiguredArmNative(root,operationId);if(observed.status==="native-prepared")return observed;
 const before=readAcceptedOperation(root,operationId),r=before.operation.request;
 await loadQualifiedReservations();const native=await import("./qualified-native.mjs");
 if(preparedNative(root,before,native)!==null){const ack=acknowledgePreparedNative(root,operationId,native);
  if(!ack.acknowledged)return {status:"native-prepared-unacknowledged",operationId,attempt:ack.source.attempt,repeated:true,started:false,launch:null};
  return observeConfiguredArmNative(root,operationId);
 }
 if(!configuration||Object.keys(configuration).join()!=="tool")refuse("configured-arm-options");
 const tool=configuration.tool;
 if(!validConfiguredArmExecution(r.execution))refuse("configured-arm-execution-required");
 requireInstalledRuntimeAssets(tool,["configured-dispatch-operation","configured-dispatch-context","qualified-native","run-record","configured-dispatch"].map(n=>`tools/e2e/scripts/${n}.mjs`));
 await prepareConfiguredArmHandoff(root,operationId,{tool});
 const ready=readAcceptedOperation(root,operationId),assignment=parseAssignment(configuredArmAssignmentData(r,ready.operation.progress.handoff));
 const handle=captureConfiguredDispatch({...r.selection,revisions:{...r.selection.revisions,records:r.stamp.commit},taskId:r.taskId,tool});
 const context=captureConfiguredArmOperationContext(root,operationId,{tool});
 const started=await native.startQualifiedNativeRun(root,{assignment,configuredDispatch:handle,configuredArmContext:context});
 const acknowledged=acknowledgePreparedNative(root,operationId,native);
 if(!acknowledged.acknowledged)return {status:"native-prepared-unacknowledged",operationId,attempt:started.record.attempt,repeated:true,started:false,launch:null};
 return {status:"native-prepared",operationId,attempt:started.record.attempt,file:started.file,repeated:false,started:false,
  launch:{taskName:r.native.taskName,sessionId:r.native.sessionId,coordinatorTurnId:r.native.coordinatorTurnId,harness:r.role.harness,model:r.role.model,vehicle:r.role.vehicle,execution:structuredClone(r.execution),brief:assignment.brief}};
}
/** Original-ID automatic continuation. No caller program, grade, assignment,
 * new cut/model or replacement destination can enter a captured operation.
 * @param {string} root @param {string} operationId @param {{tool:any}} configuration */
export async function continueConfiguredArmOperation(root,operationId,configuration){
 return prepareConfiguredArmNative(root,operationId,configuration);
}
