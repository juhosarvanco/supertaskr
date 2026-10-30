/** Provider observation/acceptance in the same protected delivery operation.
 * No test/build/push/rerun, new ledger, lifecycle stamp or claim release. */
import {randomUUID} from "node:crypto";
import {lstatSync,realpathSync} from "node:fs";
import * as runs from "./run-record.mjs";
import {operationContent,operationDigest,operationPayload,validOperationRecord} from "./operation-record.mjs";
import {acceptedOperationPath,captureOperationRepository,operationOwnerAlive,readAcceptedOperation} from "./durable-operation.mjs";
import {atomicJson,withNativeTransaction} from "./native-codex.mjs";
import {assertQualifiedDeliveryContinuation} from "./qualified-delivery-operation.mjs";
import {observeQualifiedPublication} from "./qualified-publication-operation.mjs";
import {publicationLaunchAlive} from "./qualified-publication-process.mjs";
import {loadQualifiedDeliveryPolicy} from "./qualified-admission.mjs";
import {qualifiedDeliveryCiSelection,qualifiedDeliveryCiAcceptance,validQualifiedCiProgress} from "./qualified-ci-record.mjs";
import {createGitHubDeliveryCiReader,actualGitHubDeliveryCiObservation} from "./qualified-github-ci.mjs";
import {requireInstalledRuntimeAssets} from "./records-check.mjs";
const active=new Set();
/** @param {string} code @returns {never} */
function refuse(code){throw Object.assign(new Error(`${code}: qualified validation unavailable`),{code});}
/** @param {any} a @param {any} b */
const same=(a,b)=>operationContent(a)===operationContent(b);
/** @param {any} value @returns {any} */
function freeze(value){if(value&&typeof value==="object"){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
/** @param {string} root @param {string} id */
function selected(root,id){
 if(typeof id!=="string"||!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(id))refuse("CI_OPERATION_REQUEST");
 const rec=readAcceptedOperation(root,id);if(rec?.operation.kind!=="qualified-delivery"||rec.operation.request.coordinator.root!==root)refuse("CI_OPERATION_ABSENT");
 if(rec.operation.request.route.name!=="protected-atomic-push-v1")refuse("CI_OPERATION_ROUTE_UNFROZEN");return rec;
}
/** Accepted CI is a retained point-in-time fact. It needs the original P and
 * ignored-runtime incarnation, not current credentials, TOOL, latest run or R.
 * @param {string} root @param {any} rec */
function originalCoordinator(root,rec){
 const req=rec.operation.request,p=req.authority.roles.find((/** @type {any} */ r)=>r.role==="product"),runtime=req.runtimeDirectory,s=lstatSync(runtime.path,{bigint:true});
 if(!same(captureOperationRepository(root,p.originalBase,{forEffect:false}),req.coordinator)||!s.isDirectory()||s.isSymbolicLink()||realpathSync(runtime.path)!==runtime.path||String(s.dev)!==runtime.device||String(s.ino)!==runtime.inode)refuse("CI_OPERATION_ORIGIN_CHANGED");
}
/** @param {any} rec @param {boolean} historical */
function receipt(rec,historical){return freeze({status:"validated",code:historical?"CI_HISTORICAL_ACCEPTED":"CI_EXACT_SUCCESS",operationId:rec.operation.id,taskId:rec.operation.request.authority.taskId,requestDigest:rec.operation.digest,
 historical,currentObservation:historical?"not-requested":"exact-attempt-bookended",originalPublication:rec.operation.publication.acceptance,validation:rec.operation.validation.acceptance,recordsCompletion:"pending"});}
/** Read only; no successor private context is needed to report an original
 * accepted provider fact. This never claims that a later/current run is green.
 * @param {string} coordinatorRoot @param {string} operationId */
export function observeQualifiedDeliveryCi(coordinatorRoot,operationId){
 const root=realpathSync(coordinatorRoot),rec=selected(root,operationId);originalCoordinator(root,rec);
 if(rec.operation.validation?.acceptance){
  if(!validQualifiedCiProgress(rec.operation.validation,rec.operation.request,rec.operation.publication))refuse("CI_OPERATION_RECORD");
  return freeze({status:"validated",record:rec,receipt:receipt(rec,true)});
 }
 return freeze({status:"pending",record:rec,receipt:null});
}
/** @param {string} root @param {any} rec */
function persist(root,rec){if(!validOperationRecord(rec))refuse("CI_OPERATION_RECORD");atomicJson(acceptedOperationPath(root,rec.operation.id),rec);}
/** @param {string} root @param {any} rec */
function own(root,rec){
 const io=runs.defaultRunIo(),identity=io.identity(process.pid);if(identity===null)refuse("CI_OPERATION_OWNER_UNKNOWN");
 const launch=rec.operation.publication?.launches.at(-1);if(launch&&publicationLaunchAlive(launch))refuse("CI_OPERATION_LAUNCH_LIVE");
 if(rec.operation.owner.pid!==process.pid&&operationOwnerAlive(rec.operation.owner,io))refuse("CI_OPERATION_OWNER_LIVE");
 for(const claim of rec.operation.claims)if(runs.readReservation(root,claim.resource)?.attempt!==rec.attempt)refuse("CI_OPERATION_OWNERSHIP");
 if(rec.operation.owner.pid!==process.pid||rec.operation.owner.identity!==identity)rec.operation.owner={pid:process.pid,identity,token:randomUUID()};
 return rec;
}
/** A new effect always checks the exact stored row, current canonical policy
 * and original complete publication/selected TOOL, never a read-success flag.
 * @param {string} root @param {any} rec @param {any} tool */
function policy(root,rec,tool){
 assertQualifiedDeliveryContinuation(root,rec,{tool});
 requireInstalledRuntimeAssets(tool,["qualified-ci-operation","qualified-ci-record","qualified-github-ci","qualified-delivery-ci"].map(n=>`tools/e2e/scripts/${n}.mjs`));
 if(!same(tool,rec.operation.request.route.publication.tool))refuse("CI_OPERATION_TOOL_CHANGED");return true;
}
/** @param {any} rec @param {string} code */
function pending(rec,code){const v=rec.operation.validation;return freeze({status:v?.error?(["CI_CREDENTIALS_MISSING","CI_PROVIDER_ACCESS_UNAVAILABLE"].includes(code)?"cannot-run":"validation-unknown"):v?.observation?.result.status??"validation-pending",
 code,operationId:rec.operation.id,requestDigest:rec.operation.digest,requirement:v?.requirement??null,recordsCompletion:"pending"});}
/** Original full-route ID and opaque TOOL only. Discovery is durably retained
 * before attempt-specific reads; no request can pick a weaker/newer run.
 * @param {string} coordinatorRoot @param {string} operationId @param {{tool:any}} [configuration]
 * @param {{onBoundary?:(boundary:string,record:any)=>void}} [diagnostics] */
export async function reconcileQualifiedDeliveryCi(coordinatorRoot,operationId,configuration,diagnostics={}){
 const root=realpathSync(coordinatorRoot),key=`${root}\0${operationId}`;if(active.has(key))refuse("CI_OPERATION_OWNER_LIVE");active.add(key);
 try{
  const prior=observeQualifiedDeliveryCi(root,operationId);if(prior.status==="validated")return prior.receipt;
  if(!configuration||Object.keys(configuration).join(",")!=="tool"||!diagnostics||Object.keys(diagnostics).some(k=>k!=="onBoundary")||diagnostics.onBoundary!==undefined&&typeof diagnostics.onBoundary!=="function")refuse("CI_OPERATION_CONFIGURATION");
  const published=observeQualifiedPublication(root,operationId);if(published.status!=="published")refuse("CI_OPERATION_PUBLICATION_PENDING");
  if(published.record.operation.request.route.publication.destination.endpoint.kind!=="github")refuse("CI_PROVIDER_ORIGIN_UNAVAILABLE");
  await loadQualifiedDeliveryPolicy();const tool=configuration.tool;
  requireInstalledRuntimeAssets(tool,["qualified-ci-operation","qualified-ci-record","qualified-github-ci","qualified-delivery-ci"].map(n=>`tools/e2e/scripts/${n}.mjs`));
  if(!same(tool,published.record.operation.request.route.publication.tool))refuse("CI_OPERATION_TOOL_CHANGED");
  let rec=withNativeTransaction(root,{operation:"qualified-ci-capture"},()=>{
   const current=own(root,selected(root,operationId));
   if(!current.operation.publication.acceptance){current.operation.publication.acceptance=published.receipt.publication;current.operation.publication.phase="published";}
   persist(root,current);policy(root,current,tool);
   if(current.operation.validation===undefined){const selection=qualifiedDeliveryCiSelection(current.operation.request);current.operation.validation={version:1,phase:"waiting-run",selection,selectionDigest:operationDigest(selection),requirement:null,providerRun:null,selectedAt:null,discovery:null,observation:null,error:null,acceptance:null};persist(root,current);}
   return current;
  });
  const reader=createGitHubDeliveryCiReader({tool,selection:rec.operation.validation.selection});
  try{
   if(rec.operation.validation.requirement===null){
    const discovered=await reader.discover();
    rec=withNativeTransaction(root,{operation:"qualified-ci-selection"},()=>{
     const current=selected(root,operationId);if(!same(current,rec))refuse("CI_OPERATION_CHANGED");policy(root,current,tool);
     const v=current.operation.validation;v.error=null;
     if(discovered.status==="selected"){
      v.requirement=operationPayload(discovered.requirement);v.providerRun=operationPayload(discovered.providerRun);v.selectedAt=discovered.observedAt;v.phase="selected";
      v.discovery={status:"selected",observedAt:discovered.observedAt,receipts:operationPayload(discovered.receipts)};
     }else v.discovery={status:"missing",observedAt:discovered.observedAt,receipts:operationPayload(discovered.receipts)};
     persist(root,current);diagnostics.onBoundary?.("ci:selection-retained",structuredClone(current));return current;
    });
    if(rec.operation.validation.requirement===null)return pending(rec,"CI_RUN_MISSING");
   }
   const v=rec.operation.validation,handle=reader.restore(v.requirement,v.providerRun),observed=await reader.read(handle),facts=actualGitHubDeliveryCiObservation(observed,v.requirement);
   rec=withNativeTransaction(root,{operation:"qualified-ci-observation"},()=>{
    const current=selected(root,operationId);if(!same(current,rec))refuse("CI_OPERATION_CHANGED");policy(root,current,tool);
    const ci=current.operation.validation;ci.observation=operationPayload(facts);ci.error=null;ci.acceptance=qualifiedDeliveryCiAcceptance(current.operation.request,ci.observation);ci.phase=ci.acceptance===null?"observed":"validated";
    persist(root,current);diagnostics.onBoundary?.("ci:observation-retained",structuredClone(current));return current;
   });
   return rec.operation.validation.acceptance?receipt(rec,false):pending(rec,rec.operation.validation.observation.result.code);
  }catch(error){
   const e=/** @type {any} */(error);if(typeof e?.code!=="string"||!/^CI_[A-Z0-9_]+$/.test(e.code))throw error;
   rec=withNativeTransaction(root,{operation:"qualified-ci-unavailable"},()=>{
    const current=selected(root,operationId);if(!same(current,rec))throw error;policy(root,current,tool);
    current.operation.validation.error={code:e.code,at:new Date().toISOString(),providerReceipt:e.providerReceipt?operationPayload(e.providerReceipt):null};persist(root,current);return current;
   });return pending(rec,e.code);
  }
 }finally{active.delete(key);}
}
