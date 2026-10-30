/** Internal same-operation admission context. The wire carries selectors only;
 * this nonserializable capability names an actual stored strict OP owned by the
 * current backend incarnation. It never replaces current grant admission. */
import { realpathSync } from "node:fs";
import { readAcceptedOperation, captureOperationRepository, operationOwnerAlive } from "./durable-operation.mjs";
import { defaultRunIo, readReservation, assertOperationOwnership } from "./run-record.mjs";
import { operationContent } from "./operation-record.mjs";
import { validConfiguredDispatchRecord, validConfiguredArmStampedSource } from "./configured-dispatch-record.mjs";
import { requireInstalledRuntimeAssets } from "./records-check.mjs";

/** @type {WeakMap<object,{root:string,id:string,digest:string,owner:any,tool:any,recovery:boolean}>} */
const contexts=new WeakMap();
/** @param {string} code @returns {never} */
function refuse(code){throw Object.assign(new Error(`${code}: exact configured dispatch operation is unavailable`),{code});}
/** @param {any} a @param {any} b */
const same=(a,b)=>operationContent(a)===operationContent(b);
/** @param {string} root @param {string} id @param {any} tool @param {boolean} [recovery] */
function owned(root,id,tool,recovery=false){
 requireInstalledRuntimeAssets(tool,["tools/e2e/scripts/configured-dispatch-context.mjs","tools/e2e/scripts/configured-dispatch-record.mjs"]);
 const rec=readAcceptedOperation(root,id);
 if(!validConfiguredDispatchRecord(rec)||rec.resource!==root||rec.state==="finished")refuse("configured-arm-operation-owner");
 const owner=rec.operation.owner,io=defaultRunIo();
 if(!(owner.pid===process.pid&&owner.identity===io.identity(process.pid))&&!(recovery&&!operationOwnerAlive(owner,io)))refuse("configured-arm-operation-owner");
 const r=rec.operation.request;
 if(!same(tool,r.tool))refuse("configured-arm-operation-tool");
 for(const role of ["product","records"]){const repository=r.repositories[role];
  if(!same(captureOperationRepository(repository.root,r.selection.revisions[role],{forEffect:false}),repository))refuse("configured-arm-operation-origin");
 }
 for(const claim of rec.operation.claims){
  const held=readReservation(root,claim.resource);
  if(claim.releasedAt===null){
   if(held?.attempt===rec.attempt)assertOperationOwnership(root,{resource:claim.resource,attempt:rec.attempt});
   else if(!(held===null&&rec.operation.progress.handoff.stage==="releasing"))refuse("configured-arm-operation-claim");
  }else if(held?.attempt===rec.attempt)refuse("configured-arm-operation-claim");
 }
 return rec;
}
/** Backend-only acquisition after the exact OP is published. The actual row,
 * current OS process identity and claims are checked again at every use.
 * @param {string} root @param {string} operationId @param {{tool:any}} configuration */
export function captureConfiguredArmOperationContext(root,operationId,configuration){
 if(!configuration||Object.keys(configuration).join()!=="tool")refuse("configured-arm-operation-context");
 root=realpathSync(root);const rec=owned(root,operationId,configuration.tool),context=Object.freeze({});
 contexts.set(context,{root,id:operationId,digest:rec.operation.digest,owner:rec.operation.owner,tool:configuration.tool,recovery:false});return context;
}
/** Read-only predecessor policy check before a decisive transaction may
 * adopt a proven-dead backend. This capability cannot admit native start.
 * @param {string} root @param {string} operationId @param {{tool:any}} configuration */
export function captureConfiguredArmRecoveryContext(root,operationId,configuration){
 if(!configuration||Object.keys(configuration).join()!=="tool")refuse("configured-arm-operation-context");
 root=realpathSync(root);const rec=owned(root,operationId,configuration.tool,true),context=Object.freeze({});
 contexts.set(context,{root,id:operationId,digest:rec.operation.digest,owner:rec.operation.owner,tool:configuration.tool,recovery:true});return context;
}
/** Fixed read-only current-row accessor used by admission and native start.
 * Exact original or exact stamped cuts are selected by durable progress, never
 * by current RECORDS HEAD or a caller-provided operation row.
 * @param {object} context @param {string} root @param {any} request @param {any} capsule */
export function configuredArmOperationForAdmission(context,root,request,capsule){
 const retained=contexts.get(context);
 if(!retained||realpathSync(root)!==retained.root)refuse("configured-arm-operation-context");
 const rec=owned(retained.root,retained.id,retained.tool,retained.recovery),r=rec.operation.request,p=rec.operation.progress;
 if(rec.operation.digest!==retained.digest||!same(rec.operation.owner,retained.owner)||request.authorityRoot!==retained.root||request.projectId!==r.selection.projectId||request.taskId!==r.taskId||
  !same(request.legacyTokenMap,r.selection.legacyTokenMap)||request.revisions.product!==r.selection.revisions.product||
  request.revisions.records!==(p.stamp.acceptance===null?r.selection.revisions.records:r.stamp.commit)||request.admission.role!=="executor"||request.admission.kind!=="explicit"||
  !["lane-cut","child-start"].includes(request.admission.boundary))refuse("configured-arm-operation-source");
 if(p.stamp.acceptance===null?!same(capsule,r.capsule):!validConfiguredArmStampedSource(r,capsule))refuse("configured-arm-operation-capsule");
 if(request.admission.boundary==="child-start"&&(p.handoff.stage!=="ready"||retained.recovery))refuse("configured-arm-operation-handoff");
 if(request.admission.boundary==="lane-cut"&&!["held","releasing"].includes(p.handoff.stage))refuse("configured-arm-operation-handoff");
 return rec;
}
