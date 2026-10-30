/** Opaque current backend ownership of one actual strict verifier OP. No JSON
 * descriptor, stage label or digest can construct this admission capability. */
import {realpathSync,lstatSync} from "node:fs";
import {readAcceptedOperation} from "./durable-operation.mjs";
import {operationContent} from "./operation-record.mjs";
import {validConfiguredVerifierRecord,configuredVerifierAssignmentData} from "./configured-verifier-record.mjs";
import {configuredVerifierCurrentCut} from "./configured-verifier-plan.mjs";
import {captureConfiguredDispatchForRun,verifyConfiguredDispatch} from "./configured-dispatch.mjs";
import {readQualifiedVerifierInputsNow,loadQualifiedReviewConsumers,captureQualifiedVerifierPreparationNow,readQualifiedPreparation} from "./qualified-verification.mjs";
import {defaultRunIo,readReservation,assertOperationOwnership,loadQualifiedReservations} from "./run-record.mjs";
import {measureQualifiedWorker} from "./qualified-reservation.mjs";
import {assertExternalParent} from "./qualified-external-path.mjs";
import {execFileSync} from "node:child_process";
import {requireInstalledRuntimeAssets} from "./records-check.mjs";
/** @type {WeakMap<object,{root:string,id:string,digest:string,owner:any,tool:any,handle:object}>} */const contexts=new WeakMap();
/** @param {string} code @returns {never} */
function refuse(code){throw Object.assign(new Error(`${code}: exact configured verifier operation is unavailable`),{code});}
/** @param {any} a @param {any} b */
const same=(a,b)=>operationContent(a)===operationContent(b);
/** @param {string} root @param {string} id @param {any} tool @param {object} handle */
function owned(root,id,tool,handle){
 requireInstalledRuntimeAssets(tool,["configured-verifier-context","configured-verifier-record","configured-verifier-plan","qualified-verification","qualified-reservation","qualified-external-path","run-record"].map(name=>`tools/e2e/scripts/${name}.mjs`));
 const rec=readAcceptedOperation(root,id);if(!validConfiguredVerifierRecord(rec)||rec.resource!==root||rec.state==="finished")refuse("configured-verifier-operation-owner");
 const r=rec.operation.request,owner=rec.operation.owner,io=defaultRunIo();
 if(owner.pid!==process.pid||owner.identity!==io.identity(process.pid))refuse("configured-verifier-operation-owner");
 if(!same(tool,r.tool))refuse("configured-verifier-operation-tool");
 if(!same(verifyConfiguredDispatch(handle),r.capsule)||!same(configuredVerifierCurrentCut(root,r.capsule,tool),r.current))refuse("configured-verifier-operation-source");
 const p=rec.operation.progress,actual=readQualifiedVerifierInputsNow(root,r.executor.source.attempt);
 if(!same({...actual,preparations:[]},r.executor))refuse("configured-verifier-operation-source");
 const excluded=Object.values(r.current.repositories).flatMap((/** @type {any} */ repo)=>repo.identities);
 for(let i=0;i<r.benches.length;i++){
  const bench=r.benches[i],progress=p.benches[i];assertExternalParent(bench.parent,excluded);
  if(progress.stage==="creating")refuse("configured-verifier-bench-create-unknown");
  if(progress.stage==="captured"){
   try{lstatSync(bench.checkout);refuse("configured-verifier-bench-exists");}catch(error){if(/** @type {any} */(error).code!=="ENOENT")throw error;}
  }else{
   if(!same(measureQualifiedWorker(bench.checkout),progress.identity))refuse("configured-verifier-bench-changed");
   const git=(/** @type {string[]} */args)=>execFileSync("git",["--no-replace-objects","-C",bench.checkout,...args],{encoding:"utf8",env:{...process.env,GIT_NO_LAZY_FETCH:"1",GIT_OPTIONAL_LOCKS:"0"}}).replace(/\n$/,"");
   if(git(["rev-parse","HEAD"])!==bench.candidate||git(["rev-parse","--abbrev-ref","HEAD"])!=="HEAD"||git(["status","--porcelain=v1","--untracked-files=all"])!=="")refuse("configured-verifier-bench-changed");
  }
 }
 if(p.preparation.stage==="captured"){
  if(actual.preparations.length!==0)refuse("configured-verifier-operation-preparation-unavailable");
 }else{
  const expected=captureQualifiedVerifierPreparationNow(root,{executorAttempt:r.executor.source.attempt,assignment:configuredVerifierAssignmentData(r)},handle);
  if(actual.preparations.length>1||p.preparation.stage==="prepared"&&(actual.preparations.length!==1||p.preparation.digest!==expected.digest))refuse("configured-verifier-operation-preparation-changed");
  if(actual.preparations.length){
   const {entry}=readQualifiedPreparation(root,r.executor.source.attempt,expected.digest);
   if(!same(entry.authority,expected.authority)||entry.consumedBy!==null||entry.seal!==null||!same(actual.preparations,[{digest:expected.digest,consumedBy:null,sealDigest:null}]))refuse("configured-verifier-operation-preparation-changed");
  }
 }
 if(p.seal.stage!=="idle")refuse("configured-verifier-operation-seal-unavailable");
 for(const claim of rec.operation.claims){
  assertOperationOwnership(root,{resource:claim.resource,attempt:rec.attempt});
  const held=readReservation(root,claim.resource);
  if(claim.releasedAt===null?held?.attempt!==rec.attempt:held?.attempt===rec.attempt)refuse("configured-verifier-operation-claim");
 }
 return rec;
}
/** @param {object} context */
export function isConfiguredVerifierOperationContext(context){return contexts.has(context);}
/** Only an actual stored row, current process incarnation and original TOOL.
 * @param {string} root @param {string} operationId @param {{tool:any}} configuration */
export async function captureConfiguredVerifierOperationContext(root,operationId,configuration){
 if(!configuration||Object.keys(configuration).join()!=="tool")refuse("configured-verifier-operation-context");
 root=realpathSync(root);const before=readAcceptedOperation(root,operationId);
 if(!validConfiguredVerifierRecord(before)||before.resource!==root)refuse("configured-verifier-operation-owner");
 if(!same(configuration.tool,before.operation.request.tool))refuse("configured-verifier-operation-tool");
 await loadQualifiedReservations();await loadQualifiedReviewConsumers();
 const source=await captureConfiguredDispatchForRun(root,before.operation.request.executor.source.attempt,{tool:configuration.tool}),rec=owned(root,operationId,configuration.tool,source.handle);
 if(!same(rec,before))refuse("configured-verifier-operation-changed");
 const context=Object.freeze({});contexts.set(context,{root,id:operationId,digest:rec.operation.digest,owner:rec.operation.owner,tool:configuration.tool,handle:source.handle});return context;
}
/** Backend-only access from the same actual current owner. No detached row
 * reconstructs the WeakMap context or its original TOOL/handle.
 * @param {object} context */
export function configuredVerifierOperationState(context){
 const retained=contexts.get(context);if(!retained)refuse("configured-verifier-operation-context");
 const record=owned(retained.root,retained.id,retained.tool,retained.handle);
 if(record.operation.digest!==retained.digest||!same(record.operation.owner,retained.owner))refuse("configured-verifier-operation-changed");
 return {record,handle:retained.handle,tool:retained.tool};
}
/** A canonical preparation effect must use this OP's complete assignment,
 * not another genuine bench set under the same request/resource.
 * @param {object} context @param {string} root @param {any} assignment @param {string} attackSetFile */
export function configuredVerifierPreparationForOperation(context,root,assignment,attackSetFile){
 const {record}=configuredVerifierOperationState(context),r=record.operation.request;
 if(root!==record.resource||record.operation.progress.preparation.stage!=="preparing"||attackSetFile!==r.artifacts.attackSet||!same(assignment,configuredVerifierAssignmentData(r)))refuse("configured-verifier-preparation-assignment");
 return true;
}
/** Exact same-source exclusion only; current canonical approval still runs.
 * @param {object} context @param {string} root @param {any} request @param {any} capsule */
export function configuredVerifierOperationForAdmission(context,root,request,capsule){
 const retained=contexts.get(context);if(!retained||realpathSync(root)!==retained.root)refuse("configured-verifier-operation-context");
 const rec=owned(retained.root,retained.id,retained.tool,retained.handle),r=rec.operation.request,c=r.capsule.selection;
 if(rec.operation.digest!==retained.digest||!same(rec.operation.owner,retained.owner)||!same(capsule,r.capsule)||request.authorityRoot!==retained.root||request.taskId!==r.taskId||request.projectId!==c.projectId||
  !same(request.revisions,c.revisions)||!same(request.legacyTokenMap,c.legacyTokenMap)||request.admission.role!=="verifier"||request.admission.kind!=="explicit"||request.admission.parent!==""||request.admission.evidence!==""||
  request.admission.scope!=="product-change"||request.admission.attempt!==null||!["lane-cut","child-start"].includes(request.admission.boundary)||rec.operation.progress.handoff.stage!=="held")refuse("configured-verifier-operation-source");
 return rec;
}
