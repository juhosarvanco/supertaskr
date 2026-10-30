/** Finite R-first/P-second bank effects in the existing canonical OP store.
 * No generic Markdown, lifecycle, root-selection or publication authority.
 */
import {execFileSync} from "node:child_process";
import {randomUUID} from "node:crypto";
import {existsSync,lstatSync,readFileSync,readdirSync,realpathSync,rmdirSync} from "node:fs";
import path from "node:path";
import {atomicJson,syncNativeFileNamespace,withNativeTransaction} from "./native-codex.mjs";
import {assertOperationOwnership,defaultRunIo,readReservation,takeReservation,releaseReservation,sha256} from "./run-record.mjs";
import {operationContent,operationDigest,operationPayload,operationWork,validOperationRecord} from "./operation-record.mjs";
import {acceptedOperationPath,readAcceptedOperation,operationOwnerAlive,checkOperationEnvironment,captureOperationRepository} from "./durable-operation.mjs";
import {readOperationRef,operationDestinationContains,acceptOperationRef} from "./operation-ref.mjs";
import {validProjectBankRequest} from "./project-bank-record.mjs";
import {assertPreparedGenesisBank,createGenesisBankPolicy} from "./genesis-bank-plan.mjs";
import {captureExactWritePlan,prepareExactWriteTree,materializeExactWrites,assertExactRecordTransformations,safeOperationWorkingPath,snapshotRecordFile,intendedRecordFile,releaseDeadExactWriteLock} from "./record-write.mjs";

const ROLES=["records","product"],CLAIMS=["product","records"],active=new Set();
export class ProjectBankFinding extends Error {
 /** @param {string} code */
 constructor(code){super(`${code}: original project bank is unavailable`);this.name="ProjectBankFinding";this.code=code;}
}
/** @param {string} code @returns {never} */
function refuse(code){throw new ProjectBankFinding(code);}
/** @param {any} a @param {any} b */
const same=(a,b)=>operationContent(a)===operationContent(b);
/** @param {any} value */
function freeze(value){if(value&&typeof value==="object"){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
/** @param {string} root @param {string[]} args @param {Buffer|undefined} [input] */
function git(root,args,input){try{return execFileSync("git",["--no-replace-objects","-C",root,...args],{maxBuffer:32*1024*1024,stdio:[input===undefined?"ignore":"pipe","pipe","pipe"],...(input===undefined?{}:{input}),env:{...process.env,GIT_NO_LAZY_FETCH:"1",GIT_OPTIONAL_LOCKS:"0"}});}catch{refuse("PROJECT_BANK_GIT");}}
/** @param {string} root @param {any} rec */
function persist(root,rec){
 for(const expected of [rec.operation.request.input.productRepository.identities[0],rec.operation.request.input.runtimeIdentity]){const observed=lstatSync(expected.path,{bigint:true});if(!observed.isDirectory()||observed.isSymbolicLink()||realpathSync(expected.path)!==expected.path||String(observed.dev)!==expected.device||String(observed.ino)!==expected.inode)refuse("PROJECT_BANK_COORDINATOR_CHANGED");}
 if(!validOperationRecord(rec))refuse("PROJECT_BANK_RECORD");atomicJson(acceptedOperationPath(root,rec.operation.id),rec);}
/** @param {any} rec @param {string} role */
function intent(rec,role){const p=rec.operation.request.plans[role];return {commit:p.commit,tree:p.tree,ref:p.targetRef,previousRevision:p.expectedRevision,correlationRef:`refs/supertaskr/project-banks/${operationWork(rec.operation.id).slice(3)}/${role}`};}
/** @param {any} rec @param {string} role */
function observedRole(rec,role){
 const op=rec.operation,p=op.request.plans[role],progress=op.progress[role];if(p===null)return null;
 const i=intent(rec,role),witness=readOperationRef(p.repository.root,i.correlationRef),tip=readOperationRef(p.repository.root,i.ref);
 if(witness!==null&&witness!==i.commit)refuse("PROJECT_BANK_CORRELATION_FOREIGN");
 if(progress.intent===null){if(witness!==null)refuse("PROJECT_BANK_INTENT_MISSING");return null;}
 if(!same(progress.intent,i))refuse("PROJECT_BANK_INTENT_CHANGED");
 if(witness===null){if(progress.acceptance!==null||tip!==i.previousRevision)refuse("PROJECT_BANK_ACCEPTANCE_UNCERTAIN");return null;}
 if(!git(p.repository.root,["cat-file","commit",p.commit]).equals(Buffer.from(p.commitBase64,"base64")))refuse("PROJECT_BANK_COMMIT_CHANGED");
 if(progress.acceptance===null&&(tip===null||!operationDestinationContains(p.repository.root,p.commit,tip)))refuse("PROJECT_BANK_ACCEPTANCE_UNCERTAIN");
 return {commit:p.commit,tree:p.tree,ref:p.targetRef,previousRevision:p.expectedRevision,attribution:"exact"};
}
/** Only after an actual repository bookend in this module.
 * @param {any} rec @returns {{records:any,product:any}&Record<string,any>} */
function effectsInVerifiedRepositories(rec){
 const records=observedRole(rec,"records"),product=observedRole(rec,"product");
 if(product!==null&&records===null)refuse("PROJECT_BANK_ORDER_UNCERTAIN");return {records,product};
}
/** @param {any} rec @returns {{records:any,product:any}&Record<string,any>} */
function observeEffects(rec){
 for(const role of CLAIMS){const repository=rec.operation.request.input[`${role}Repository`],base=rec.operation.request.input[`${role}Revision`];if(!same(captureOperationRepository(repository.root,base,{forEffect:false}),repository))refuse("PROJECT_BANK_ORIGIN_CHANGED");}
 return effectsInVerifiedRepositories(rec);
}
/** @param {any} rec @param {any} effects */
const complete=(rec,effects)=>effects.records!==null&&(rec.operation.request.plans.product===null||effects.product!==null);
/** Original fact only. Current settings/binding/session do not relabel it.
 * @param {any} rec @param {any} effects */
function receipt(rec,effects){const r=rec.operation.request,body={status:"banked",operationId:rec.operation.id,stage:r.bank.stage,mode:r.bank.mode,completedStage:r.bank.completedStage,requestDigest:rec.operation.digest,records:effects.records,product:effects.product};return freeze({...body,receiptDigest:operationDigest(body)});}
/** @param {string} root @param {any} rec @param {any} effects */
function retainObserved(root,rec,effects){
 for(const role of ROLES)if(effects[role]!==null&&rec.operation.progress[role].acceptance===null){rec.operation.progress[role].acceptance=effects[role];rec.operation.progress[role].stage="ref-accepted";persist(root,rec);}
 if(complete(rec,effects)&&rec.operation.acceptance===null){rec.operation.acceptance={records:effects.records,product:effects.product,attribution:"exact"};rec.state="unknown";persist(root,rec);}
}
/** Accepted work returns its exact receipt even if cleanup remains unavailable.
 * No foreign reservation/lock is deleted. @param {string} root @param {any} rec */
function finish(root,rec){
 const effects=observeEffects(rec);if(!complete(rec,effects))refuse("PROJECT_BANK_NOT_ACCEPTED");retainObserved(root,rec,effects);
 const warnings=[];
 for(const claim of rec.operation.claims){
  if(claim.releasedAt!==null)continue;const held=readReservation(root,claim.resource);
  if(held?.attempt===rec.attempt)releaseReservation(root,{resource:claim.resource,attempt:rec.attempt});
  else if(held!==null)warnings.push({role:claim.role,code:"PROJECT_BANK_OLD_CLAIM_NOT_HELD"});
  claim.releasedAt=new Date().toISOString();if(claim.role==="product")rec.reservation.releasedAt=claim.releasedAt;persist(root,rec);
 }
 if(rec.state!=="finished"){rec.state="finished";rec.events.push({at:new Date().toISOString(),op:"project-bank-accepted"});persist(root,rec);}
 for(const role of ROLES){const p=rec.operation.request.plans[role];if(p===null)continue;
  try{releaseDeadExactWriteLock(p.working.index.path,rec.operation.id,p.working.index.lockToken,()=>complete(rec,observeEffects(rec)));}
  catch{warnings.push({role,code:"PROJECT_BANK_ACCEPTED_LOCK_UNAVAILABLE"});}
 }
 return {...receipt(rec,effects),...(warnings.length?{cleanupWarnings:warnings}:{})};
}
/** @param {string} root @param {any} rec @param {any} options @param {any} policy @param {string} phase @param {string|null} role */
function permit(root,rec,options,policy,phase,role){
 options.onBoundary?.(`before:${role??"both"}:${phase}`,structuredClone(rec));
 const r=rec.operation.request;
 for(const side of CLAIMS){const repository=r.input[`${side}Repository`];
  if(!same(captureOperationRepository(repository.root,r.input[`${side}Revision`]),repository))refuse("PROJECT_BANK_ORIGIN_CHANGED");
  assertOperationOwnership(root,{resource:repository.root,attempt:rec.attempt});if(readReservation(root,repository.root)?.attempt!==rec.attempt)refuse("PROJECT_BANK_OWNERSHIP");
 }
 const effects=effectsInVerifiedRepositories(rec);
 for(const side of CLAIMS){const repository=r.input[`${side}Repository`];
  const plan=r.plans[side],expected=effects[side]?.commit??r.input[`${side}Revision`];
  if(git(repository.root,["rev-parse","HEAD"]).toString("utf8").replace(/\n$/,"")!==expected)refuse("PROJECT_BANK_CURRENT_REF_CHANGED");
  if(plan!==null){
   if(git(repository.root,["symbolic-ref","HEAD"]).toString("utf8").replace(/\n$/,"")!==plan.targetRef)refuse("PROJECT_BANK_CURRENT_REF_CHANGED");
   assertExactRecordTransformations(repository.root,plan.writes.map((/** @type {any} */ w)=>w.path));assertExactRecordTransformations(repository.root,plan.writes.map((/** @type {any} */ w)=>w.path),plan.expectedRevision);
   const accepted=effects[side]!==null,partial=["consumer-prepare","files-prepared"].includes(rec.operation.progress[side].stage);
   const index=operationDigest(readFileSync(plan.working.index.path).toString("base64"));if(!(accepted?[plan.working.index.resultDigest]:partial?[plan.working.index.previousDigest,plan.working.index.resultDigest]:[plan.working.index.previousDigest]).includes(index))refuse("PROJECT_BANK_INDEX_CHANGED");
   for(const write of plan.writes){const current=snapshotRecordFile(safeOperationWorkingPath(repository.root,write.path)),before=plan.working.preimages.find((/** @type {any} */ p)=>p.path===write.path).work;if(accepted?!same(current,intendedRecordFile(write)):!same(current,before)&&!(partial&&same(current,intendedRecordFile(write))))refuse("PROJECT_BANK_WORKING_CHANGED");}
  }
 }
 policy.verify(effects);
 authorize(options,r,phase,role);
 return true;
}
/** Synchronous explicit producer permission, including before the first OP or
 * claim is published. Merely providing a callback grants no bank authority.
 * @param {any} options @param {any} request @param {string} phase @param {string|null} role */
function authorize(options,request,phase,role){
 const allowed=options.authorize(freeze({operationId:request.operationId,digest:operationDigest(request),phase,role,request}));
 if(allowed&&typeof allowed.then==="function")refuse("PROJECT_BANK_ASYNC_POLICY");if(allowed!==true)refuse("PROJECT_BANK_POLICY_REFUSED");
}
/** @param {string} root @param {any} rec @param {any} options @param {any} policy @param {string} role */
function executeRole(root,rec,options,policy,role){
 const r=rec.operation.request,p=r.plans[role],progress=rec.operation.progress[role];if(p===null||observedRole(rec,role)!==null)return;
 if(role==="product"&&observedRole(rec,"records")===null)refuse("PROJECT_BANK_RECORDS_PENDING");
 if(progress.stage==="captured"){
  permit(root,rec,options,policy,"objects",role);progress.intent=intent(rec,role);progress.stage="objects-start";rec.state="unknown";persist(root,rec);options.onBoundary?.(`${role}:objects-start`,structuredClone(rec));
 }
 if(progress.stage==="objects-start"){
  prepareExactWriteTree(p.repository.root,p.expectedRevision,p.writes,p.tree,()=>permit(root,rec,options,policy,"object",role));
  permit(root,rec,options,policy,"commit-object",role);
  if(git(p.repository.root,["hash-object","-w","-t","commit","--stdin"],Buffer.from(p.commitBase64,"base64")).toString("ascii").replace(/\n$/,"")!==p.commit)refuse("PROJECT_BANK_COMMIT_CHANGED");
  progress.stage="objects-prepared";persist(root,rec);options.onBoundary?.(`${role}:objects-prepared`,structuredClone(rec));
 }
 if(progress.stage==="objects-prepared"){
  permit(root,rec,options,policy,"consumer-prepare",role);progress.stage="consumer-prepare";persist(root,rec);options.onBoundary?.(`${role}:consumer-prepare`,structuredClone(rec));
 }
 if(!["consumer-prepare","files-prepared"].includes(progress.stage))refuse("PROJECT_BANK_PROGRESS");
 let release;
 try{
  release=materializeExactWrites(root,{writes:p.writes,...p.working},{operationId:rec.operation.id,request:{repository:p.repository}},phase=>permit(root,rec,options,policy,phase,role),boundary=>options.onBoundary?.(`${role}:${boundary}`,structuredClone(rec)));
  if(progress.stage!=="files-prepared"){progress.stage="files-prepared";persist(root,rec);}options.onBoundary?.(`${role}:files-prepared`,structuredClone(rec));
  permit(root,rec,options,policy,"ref",role);acceptOperationRef(p.repository.root,progress.intent);options.onBoundary?.(`${role}:ref-accepted`,structuredClone(rec));
  const observed=observedRole(rec,role);if(observed===null)refuse("PROJECT_BANK_ACCEPTANCE_UNCERTAIN");progress.acceptance=observed;progress.stage="ref-accepted";persist(root,rec);
 }finally{release?.();}
}
/** First execution accepts only the original in-process constructor object.
 * Recovery passes the same stored request, never re-prepares current bytes.
 * TOOL is an opaque backend handle and is not inspected for accepted history.
 * @param {string} coordinatorRoot @param {any} input
 * @param {{tool?:any,authorize:(context:any)=>unknown,onBoundary?:(boundary:string,record:any)=>void}} options */
export function executeProjectBank(coordinatorRoot,input,options){
 if(typeof options?.authorize!=="function"||Object.keys(options).some(key=>!["tool","authorize","onBoundary"].includes(key)))refuse("PROJECT_BANK_POLICY_REQUIRED");
 checkOperationEnvironment();let request;try{request=freeze(operationPayload(input));}catch{refuse("PROJECT_BANK_REQUEST");}if(!validProjectBankRequest(request))refuse("PROJECT_BANK_REQUEST");
 coordinatorRoot=realpathSync(coordinatorRoot);if(coordinatorRoot!==request.input.productRepository.root)refuse("PROJECT_BANK_COORDINATOR");
 const key=`${coordinatorRoot}\0${request.operationId}`;if(active.has(key))refuse("PROJECT_BANK_OWNER_LIVE");active.add(key);
 try{
  const before=readAcceptedOperation(coordinatorRoot,request.operationId);
  if(before&&(before.operation.kind!=="project-bank"||!same(before.operation.request,request)))refuse("PROJECT_BANK_CHANGED");
  const observedBefore=before===null?{records:null,product:null}:observeEffects(before);
  let policy=null;
  if(before===null||!complete(before,observedBefore)){
   if(before&&before.operation.owner.pid!==process.pid&&operationOwnerAlive(before.operation.owner,defaultRunIo()))refuse("PROJECT_BANK_OWNER_LIVE");
   if(before===null)assertPreparedGenesisBank(input);
   // Refuse current routing/index/hook policies before any inspector/index Git
   // command, transaction namespace or reservation may create a managed effect.
   for(const role of CLAIMS)if(!same(captureOperationRepository(request.input[`${role}Repository`].root,request.input[`${role}Revision`]),request.input[`${role}Repository`]))refuse("PROJECT_BANK_ORIGIN_CHANGED");
   policy=createGenesisBankPolicy(request,options.tool);policy.verify(observedBefore);
   authorize(options,request,before===null?"admission":"resume-admission",null);
  }
  return withNativeTransaction(coordinatorRoot,{operation:"project-bank"},()=>{
  let rec=readAcceptedOperation(coordinatorRoot,request.operationId);
  if(rec&&(rec.operation.kind!=="project-bank"||!same(rec.operation.request,request)))refuse("PROJECT_BANK_CHANGED");
  if(rec!==null&&complete(rec,observeEffects(rec)))return finish(coordinatorRoot,rec);
  if(rec?.operation.acceptance!==null&&rec!==null)refuse("PROJECT_BANK_ACCEPTANCE_UNCERTAIN");
  if(rec===null)assertPreparedGenesisBank(input);
  const io=defaultRunIo(),identity=io.identity(process.pid),at=new Date().toISOString();if(identity===null)refuse("PROJECT_BANK_OWNER_UNKNOWN");
  if(rec&&rec.operation.owner.pid!==process.pid&&operationOwnerAlive(rec.operation.owner,io))refuse("PROJECT_BANK_OWNER_LIVE");
  if(rec!==null)retainObserved(coordinatorRoot,rec,observeEffects(rec));
  if(policy===null)refuse("PROJECT_BANK_ACCEPTANCE_UNCERTAIN");
  policy.verify(rec===null?{records:null,product:null}:observeEffects(rec));
  // External reconstruction does not publish repository objects or recapture
  // intent. It verifies each stored exact tree before any new managed effect.
  for(const role of ROLES){const p=request.plans[role];if(p!==null&&captureExactWritePlan(p.repository.root,p.expectedRevision,p.writes).tree!==p.tree)refuse("PROJECT_BANK_TREE_CHANGED");}
  if(rec===null){
   const work=operationWork(request.operationId),assignment={kind:"operation",id:work,role:"project-bank",resource:coordinatorRoot};
   const progress=(/** @type {string} */ role)=>({stage:request.plans[role]===null?"not-required":"captured",intent:null,acceptance:null});
   rec={version:1,recordKind:"operation",attempt:`${work}-a1`,state:"starting",assignment,assignmentDigest:sha256(JSON.stringify(assignment)),writer:true,resource:coordinatorRoot,reservation:{file:null,takenAt:at,releasedAt:null},execution:null,admission:null,
    operation:{version:1,id:request.operationId,kind:"project-bank",request,digest:operationDigest(request),owner:{pid:process.pid,identity,token:randomUUID()},createdAt:at,claims:[],progress:{records:progress("records"),product:progress("product")},acceptance:null},events:[{at,op:"project-bank-capture"}]};
   const acquired=[],directory=path.dirname(acceptedOperationPath(coordinatorRoot,request.operationId)),wasAbsent=!existsSync(directory);
   try{
    for(const role of CLAIMS){const resource=request.input[`${role}Repository`].root;assertOperationOwnership(coordinatorRoot,{resource,attempt:rec.attempt});if(readReservation(coordinatorRoot,resource)!==null)refuse("PROJECT_BANK_RESOURCE_RESERVED");const taken=takeReservation(coordinatorRoot,{resource,attempt:rec.attempt,role:"project-bank",at});acquired.push(resource);rec.operation.claims.push({role,resource,file:taken.file,takenAt:at,releasedAt:null});if(role==="product")rec.reservation.file=taken.file;}
    persist(coordinatorRoot,rec);
   }catch(error){if(!existsSync(acceptedOperationPath(coordinatorRoot,request.operationId))){for(const resource of acquired)if(readReservation(coordinatorRoot,resource)?.attempt===rec.attempt)releaseReservation(coordinatorRoot,{resource,attempt:rec.attempt});if(wasAbsent&&existsSync(directory)&&lstatSync(directory).isDirectory()&&!lstatSync(directory).isSymbolicLink()&&readdirSync(directory).length===0){rmdirSync(directory);syncNativeFileNamespace(directory);}}throw error;}
  }else{
   for(const role of CLAIMS)if(readReservation(coordinatorRoot,request.input[`${role}Repository`].root)?.attempt!==rec.attempt)refuse("PROJECT_BANK_OWNERSHIP");
   rec.operation.owner={pid:process.pid,identity,token:randomUUID()};persist(coordinatorRoot,rec);
  }
  options.onBoundary?.("captured",structuredClone(rec));permit(coordinatorRoot,rec,options,policy,"admission",null);
  for(const role of ROLES)executeRole(coordinatorRoot,rec,options,policy,role);
  if(!complete(rec,observeEffects(rec)))refuse("PROJECT_BANK_NOT_ACCEPTED");return finish(coordinatorRoot,rec);
 });}finally{active.delete(key);}
}
/** @param {string} productRoot @param {string} operationId @param {{tool?:any,authorize:(context:any)=>unknown,onBoundary?:(boundary:string,record:any)=>void}} options */
export function replayProjectBank(productRoot,operationId,options){const rec=readAcceptedOperation(productRoot,operationId);if(rec?.operation.kind!=="project-bank")refuse("PROJECT_BANK_ABSENT");return executeProjectBank(productRoot,rec.operation.request,options);}
/** Read-only exact fact/partial progress, no current policy or bookkeeping.
 * @param {string} productRoot @param {string} operationId */
export function observeProjectBank(productRoot,operationId){
 productRoot=realpathSync(productRoot);const rec=readAcceptedOperation(productRoot,operationId);if(rec===null)return null;if(rec.operation.kind!=="project-bank"||rec.resource!==productRoot)refuse("PROJECT_BANK_COORDINATOR");
 const effects=observeEffects(rec);return freeze({status:complete(rec,effects)?"banked":"pending",record:rec,receipt:complete(rec,effects)?receipt(rec,effects):null});
}
