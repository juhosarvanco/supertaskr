/** Finite configured lane operation owner. The first publication captures its
 * exact strict request and real claims; later stages retain those same facts.
 * The initial capture and protected private stamp are separate retained stages;
 * measured worktree creation follows the stamp; native preparation is separate. */
import { existsSync, lstatSync, readdirSync, rmdirSync, realpathSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { preparedConfiguredArmContext, configuredArmRepository } from "./configured-dispatch-arm.mjs";
import { captureConfiguredDispatch, createConfiguredDispatchGateRunner } from "./configured-dispatch.mjs";
import { captureCompletedGenesisForDispatch } from "./genesis-bank-plan.mjs";
import { captureConfiguredArmOperationContext } from "./configured-dispatch-context.mjs";
import { configuredArmStampIntent, validConfiguredArmStampedSource } from "./configured-dispatch-record.mjs";
import { measureQualifiedWorker } from "./qualified-reservation.mjs";
import { readOperationRef, operationDestinationContains, acceptOperationRef } from "./operation-ref.mjs";
import { configuredAdmissionPreflight, decisiveConfiguredAdmission } from "./qualified-admission.mjs";
import { atomicJson, withNativeTransaction, syncNativeFileNamespace } from "./native-codex.mjs";
import { assertOperationOwnership, readReservation, takeReservation, releaseReservation, defaultRunIo, sha256 } from "./run-record.mjs";
import { acceptedOperationPath, readAcceptedOperation, captureOperationRepository } from "./durable-operation.mjs";
import { operationContent, operationDigest, operationWork, validOperationRecord } from "./operation-record.mjs";
import { requireInstalledRuntimeAssets } from "./records-check.mjs";
import { captureExactWritePlan, prepareExactWriteTree, materializeExactWrites, assertExactRecordTransformations, safeOperationWorkingPath, snapshotRecordFile, intendedRecordFile } from "./record-write.mjs";

/** @param {string} code @returns {never} */
function refuse(code){throw Object.assign(new Error(`${code}: configured lane operation is unavailable`),{code});}
/** @param {any} a @param {any} b */
const same=(a,b)=>operationContent(a)===operationContent(b);
/** @param {string} root @param {string[]} args */
function git(root,args){try{return execFileSync("git",["--no-replace-objects","-C",root,...args],{encoding:"utf8",stdio:["ignore","pipe","pipe"],maxBuffer:32*1024*1024,env:{...process.env,GIT_NO_LAZY_FETCH:"1",GIT_OPTIONAL_LOCKS:"0"}}).replace(/\n$/,"");}catch{refuse("configured-arm-git");}}
/** @param {any} request @param {any} tool */
function original(request,tool){
 requireInstalledRuntimeAssets(tool,["configured-dispatch-operation","configured-dispatch-context","configured-dispatch-record","configured-dispatch-arm"].map(name=>`tools/e2e/scripts/${name}.mjs`));
 for(const role of ["product","records"]){const repository=request.repositories[role];
  if(!same(configuredArmRepository(repository.root,request.selection.revisions[role],tool),repository)||git(repository.root,["rev-parse","HEAD"])!==request.selection.revisions[role]||git(repository.root,["symbolic-ref","HEAD"])!==request.targetRefs[role])refuse("configured-arm-original-changed");
 }
 if(git(request.selection.authorityRoot,["status","--porcelain=v1","--untracked-files=all"])!=="")refuse("configured-arm-product-dirty");
 for(const lane of request.lanes){const stat=lstatSync(lane.parent.path,{bigint:true});
  if(realpathSync(lane.parent.path)!==lane.parent.path||!stat.isDirectory()||stat.isSymbolicLink()||String(stat.dev)!==lane.parent.device||String(stat.ino)!==lane.parent.inode||existsSync(lane.checkout)||git(request.repositories[lane.role].root,["for-each-ref","--format=%(refname)",lane.branch])!=="")refuse("configured-arm-lane-changed");
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
 requireInstalledRuntimeAssets(tool,["configured-dispatch-operation","configured-dispatch-context","qualified-reservation"].map(n=>`tools/e2e/scripts/${n}.mjs`));
 const input=admissionInput(r,true),handle=captureConfiguredDispatch({...r.selection,revisions:input.revisions,taskId:r.taskId,tool});
 if(!validConfiguredArmStampedSource(r,handle.capsule))refuse("configured-arm-operation-capsule");
 const context=captureConfiguredArmOperationContext(root,operationId,{tool}),earlier=await configuredAdmissionPreflight(input,handle,context);
 return withNativeTransaction(root,{operation:"configured-dispatch-lanes"},()=>{
  const rec=readAcceptedOperation(root,operationId);if(rec?.operation.kind!=="configured-dispatch"||!same(rec.operation.request,r))refuse("configured-arm-operation-changed");
  const p=rec.operation.progress;if(p.handoff.stage!=="held"||observedStamp(rec)===null)refuse("configured-arm-lane-stage");
  // The original-cut completed-genesis reader is being supplied by its one
  // canonical owner. Until composed, do not infer it from a stored receipt.
  if(r.baseline.kind==="initialized-code-empty")refuse("configured-arm-initial-baseline-recheck-unavailable");
  /** @param {boolean} [initial] */
  const permit=(initial=false)=>{
   for(const role of ["product","records"]){const repository=r.repositories[role],revision=role==="records"?r.stamp.commit:r.selection.revisions.product;
    if(!same(configuredArmRepository(repository.root,r.selection.revisions[role],tool),repository)||git(repository.root,["rev-parse","HEAD"])!==revision||git(repository.root,["symbolic-ref","HEAD"])!==r.targetRefs[role])refuse("configured-arm-original-changed");
    assertOperationOwnership(root,{resource:repository.root,attempt:rec.attempt});if(readReservation(root,repository.root)?.attempt!==rec.attempt)refuse("configured-arm-resource-held");
   }
   if(git(root,["status","--porcelain=v1","--untracked-files=all"])!=="")refuse("configured-arm-product-dirty");
   if(operationDigest(readFileSync(r.stamp.working.index.path).toString("base64"))!==r.stamp.working.index.resultDigest)refuse("configured-arm-stamp-index-changed");
   assertExactRecordTransformations(r.repositories.records.root,r.stamp.writes.map((/** @type {any} */ w)=>w.path));
   for(const write of r.stamp.writes)if(!same(snapshotRecordFile(safeOperationWorkingPath(r.repositories.records.root,write.path)),intendedRecordFile(write)))refuse("configured-arm-stamp-working-changed");
   for(let i=0;i<r.lanes.length;i++){
    const lane=r.lanes[i],progress=p.lanes[i],stat=lstatSync(lane.parent.path,{bigint:true});
    if(!stat.isDirectory()||stat.isSymbolicLink()||realpathSync(lane.parent.path)!==lane.parent.path||String(stat.dev)!==lane.parent.device||String(stat.ino)!==lane.parent.inode)refuse("configured-arm-parent-changed");
    if(progress.stage==="created")measuredLane(r,lane,progress);
    else if(progress.stage==="creating")refuse("configured-arm-lane-create-unknown");
    else {
     try{lstatSync(lane.checkout);refuse("configured-arm-destination-exists");}catch(error){if(/** @type {any} */(error).code!=="ENOENT")throw error;}
     if(git(r.repositories[lane.role].root,["for-each-ref","--format=%(refname)",lane.branch])!=="")refuse("configured-arm-branch-exists");
    }
   }
   decisiveConfiguredAdmission(input,initial?earlier:null,handle,false,null,context);return true;
  };
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
