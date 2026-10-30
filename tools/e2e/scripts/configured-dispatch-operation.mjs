/** Finite configured lane operation owner. The first publication captures its
 * exact strict request and real claims; later stages retain those same facts.
 * This entry currently publishes no private stamp or worktree/native effect. */
import { existsSync, lstatSync, readdirSync, rmdirSync, realpathSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { preparedConfiguredArmContext, configuredArmRepository } from "./configured-dispatch-arm.mjs";
import { configuredAdmissionPreflight, decisiveConfiguredAdmission } from "./qualified-admission.mjs";
import { atomicJson, withNativeTransaction, syncNativeFileNamespace } from "./native-codex.mjs";
import { assertOperationOwnership, readReservation, takeReservation, releaseReservation, defaultRunIo, sha256 } from "./run-record.mjs";
import { acceptedOperationPath, readAcceptedOperation } from "./durable-operation.mjs";
import { operationContent, operationDigest, operationWork, validOperationRecord } from "./operation-record.mjs";
import { requireInstalledRuntimeAssets } from "./records-check.mjs";
import { captureExactWritePlan } from "./record-write.mjs";

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
/** @param {string} root @param {any} rec */
function persist(root,rec){
 if(!validOperationRecord(rec))refuse("configured-arm-record");
 const r=rec.operation.request;
 for(const role of ["product","records"]){const expected=r.repositories[role].identities[0],actual=lstatSync(expected.path,{bigint:true});
  if(!actual.isDirectory()||actual.isSymbolicLink()||String(actual.dev)!==expected.device||String(actual.ino)!==expected.inode)refuse("configured-arm-original-changed");
 }
 const file=acceptedOperationPath(root,rec.operation.id);
 atomicJson(file,rec,()=>{if(existsSync(file))refuse("configured-arm-operation-exists");});
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
     lanes:r.lanes.map((/** @type {any} */ l)=>({role:l.role,stage:"captured",identity:null})),handoff:{stage:"held",source:null,native:null}},acceptance:null},events:[{at,op:"configured-dispatch-capture"}]});
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
