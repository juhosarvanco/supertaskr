/** Fixed planned-grade wrapper/thread proof. Process facts are observed from
 * the same canonical OP and actual OS ancestry; selectors/data are no grant.
 * This is separate from ACTIVE grading and the existing publication proof.
 */
import {readFileSync,lstatSync,realpathSync} from "node:fs";
import {createHash} from "node:crypto";
import {isMainThread,workerData,threadId} from "node:worker_threads";
import {readAcceptedOperation,checkOperationEnvironment} from "./durable-operation.mjs";
import {operationContent,operationDigest} from "./operation-record.mjs";
import {publicationProcess,publicationExecutable} from "./qualified-publication-process.mjs";
const proofs=new WeakMap();
/** @param {string} code @returns {never} */
function refuse(code){throw Object.assign(new Error(`${code}: original planned-grade process is unavailable`),{code});}
/** @param {any} a @param {any} b */
const same=(a,b)=>operationContent(a)===operationContent(b);
/** Exact immutable TOOL code path, without following a replacement symlink.
 * @param {any} asset */
function code(asset){
 const s=lstatSync(asset.path);if(!s.isFile()||s.isSymbolicLink()||realpathSync(asset.path)!==asset.path||createHash("sha256").update(readFileSync(asset.path)).digest("hex")!==asset.sha256)refuse("QUALIFIED_INTEGRATION_CODE_CHANGED");
}
/** Finite fixed argv; the original suite is selected only by the stored launch.
 * @param {any} rec @param {any} launch */
export function qualifiedIntegrationLaunchArguments(rec,launch){return [launch.node.path,launch.entry.path,"--root",rec.operation.request.coordinator.root,"--operation",rec.operation.id,"--token",launch.token];}
/** @param {any} rec @param {"wrapper"|"worker"} mode */
function actual(rec,mode){
 checkOperationEnvironment();
 const op=rec?.operation,req=op?.request,launch=op?.integration?.launches?.at(-1),execution=req?.integration?.execution;
 if(op?.kind!=="qualified-delivery"||req?.route?.name!=="protected-planned-output-v1"||execution?.version!==2||!launch||launch.result!==null||launch.workerResult!==null||
  !same(launch.owner,op.owner)||isMainThread!==(mode==="wrapper"))refuse("QUALIFIED_INTEGRATION_LAUNCH_REQUIRED");
 const stored=readAcceptedOperation(req.coordinator.root,op.id,"qualified-delivery");
 if(!stored||!same(stored,rec))refuse("QUALIFIED_INTEGRATION_LAUNCH_CHANGED");
 if(!same(launch.node,execution.node)||!same(launch.entry,execution.entry)||!same(publicationExecutable(launch.node.path),launch.node))refuse("QUALIFIED_INTEGRATION_CODE_CHANGED");
 code(execution.entry);code(execution.worker);
 const owner=publicationProcess(op.owner.pid),wrapper=publicationProcess(launch.process.pid),self=publicationProcess(process.pid);
 if(owner.startedAt!==op.owner.identity||wrapper.pid!==launch.process.pid||wrapper.startedAt!==launch.process.identity||wrapper.ppid!==owner.pid||wrapper.group!==launch.process.group||wrapper.group!==wrapper.pid||
  wrapper.program!==launch.node.path||wrapper.command!==qualifiedIntegrationLaunchArguments(rec,launch).join(" ")||self.pid!==wrapper.pid||self.startedAt!==wrapper.startedAt||self.group!==wrapper.group)refuse("QUALIFIED_INTEGRATION_LAUNCH_IDENTITY");
 if(mode==="worker"&&(!workerData||Object.keys(workerData).sort().join(",")!=="operationId,root,token,version"||workerData.version!==1||workerData.root!==req.coordinator.root||workerData.operationId!==op.id||workerData.token!==launch.token||threadId<1))refuse("QUALIFIED_INTEGRATION_THREAD_REQUIRED");
 return {mode,pid:self.pid,identity:self.startedAt,threadId:mode==="worker"?threadId:null,recordDigest:operationDigest(rec),token:launch.token};
}
/** Only the actual fixed wrapper before creating its one fixed thread.
 * @param {any} rec */
export function captureQualifiedIntegrationWrapperProof(rec){
 const facts=actual(rec,"wrapper"),proof=Object.freeze({version:1,kind:"owned-planned-integration-child"});proofs.set(proof,facts);return proof;
}
/** Only the fixed worker under that same actual owned wrapper/group.
 * @param {any} rec */
export function captureQualifiedIntegrationWorkerProof(rec){
 const facts=actual(rec,"worker"),proof=Object.freeze({version:1,kind:"owned-planned-integration-child"});proofs.set(proof,facts);return proof;
}
/** Cloned kinds, environment markers or arbitrary process data cannot redeem
 * the private capability. Current policy/claims remain canonical admission.
 * @param {object} proof @param {any} rec */
export function validateQualifiedIntegrationProcessProof(proof,rec){
 const retained=proofs.get(proof);if(!retained||!same(actual(rec,retained.mode),retained))refuse("QUALIFIED_INTEGRATION_PROCESS_PROOF_REQUIRED");return true;
}
