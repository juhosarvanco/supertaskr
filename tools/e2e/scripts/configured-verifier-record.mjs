/** Finite configured verifier constructor data. Valid serialized data grants
 * no preparation, owned-operation exclusion, grade or native launch. */
import path from "node:path";
import {createHash} from "node:crypto";
import {validConfiguredDispatchCapsule} from "../../../cli/configured-native-reader.mjs";
import {isDeliveryBranchRef} from "../../../lib/parser/dist/pure.js";
import {validConfiguredArmExecution,validConfiguredTextArtifact} from "./configured-dispatch-record.mjs";
import {validProjectRepository,validProjectTool,validProjectDirectory} from "./project-bank-record.mjs";
import {operationContent,operationDigest,operationPayload,operationWork} from "./operation-record.mjs";

/** @param {any} value @param {string[]} keys */
const shape=(value,keys)=>value&&typeof value==="object"&&!Array.isArray(value)&&Object.keys(value).sort().join("\0")===[...keys].sort().join("\0");
/** @param {any} a @param {any} b */
const same=(a,b)=>operationContent(a)===operationContent(b);
/** @param {any} value */
const digest=value=>typeof value==="string"&&/^sha256:[0-9a-f]{64}$/.test(value);
/** Canonical native permission/review hashes are bare SHA256.
 * @param {any} value */
const sha=value=>typeof value==="string"&&/^[0-9a-f]{64}$/.test(value);
/** @param {any} value */
const id=value=>typeof value==="string"&&/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(value);
/** @param {any} value */
const oid=value=>typeof value==="string"&&/^[0-9a-f]{40}$/.test(value);
/** @param {any} value */
const absolute=value=>typeof value==="string"&&value.length<=16384&&path.isAbsolute(value)&&path.normalize(value)===value&&!/[\\\x00-\x1f\x7f-\x9f]/.test(value);
/** @param {any} value */
const nativeId=value=>typeof value==="string"&&value.length>0&&value.length<=256&&value.trim()===value&&!/[\x00-\x1f\x7f-\x9f]/.test(value);
/** Fixed coordinator artifact destinations; these are data until an actual
 * owned operation qualifies their physical namespace and preimages.
 * @param {string} root @param {string} operationId */
export function configuredVerifierArtifactPaths(root,operationId){
 const prefix=path.join(root,".supertaskr","briefs",operationWork(operationId));
 return {phase1:`${prefix}-phase1.md`,attackSet:`${prefix}-attack-set.md`,phase2:`${prefix}-phase2.md`};
}
/** Only cross-field structural consistency is established here. The actual
 * constructor requalifies canonical finalized evidence and current admission.
 * @param {any} input */
export function configuredVerifierRequestProblem(input){
 try{
  const r=operationPayload(input),c=r.capsule,e=r.executor;
  if(!shape(r,["version","kind","operationId","taskId","tool","capsule","executor","current","benches","role","execution","native","expectedAttempt","artifacts","admission"])||r.version!==1||r.kind!=="configured-verifier"||!id(r.operationId)||
   !validConfiguredDispatchCapsule(c)||r.taskId!==c.task.id||!validProjectTool(r.tool)||!Object.keys(c.configuration.tool).every(k=>r.tool[k]===c.configuration.tool[k])||
   !shape(e,["source","request","scope","candidates","requiredBenchRoles","ignoredOutputs","preparations"])||!same(e.preparations,[])||!shape(e.source,["attempt","assignmentDigest","permissionDigest","originsDigest","collectionDigest"])||
   !new RegExp(`^${r.taskId}-a[1-9][0-9]*$`).test(e.source.attempt)||!digest(e.source.assignmentDigest)||![e.source.permissionDigest,e.source.originsDigest,e.source.collectionDigest].every(sha))return "source";
  for(const value of [e.request,e.scope])if(!value||value.authorityRoot!==c.selection.authorityRoot||value.attempt!==e.source.attempt||value.projectId!==c.selection.projectId||!same(value.revisions,c.selection.revisions)||!same(value.receipt,c.receipt))return "paired-source";
  if(e.request.taskId!==r.taskId||!same(e.request.legacyTokenMap,c.selection.legacyTokenMap)||operationDigest(e.scope.fence)!==c.scopeDigest)return "source-scope";
  if(!shape(e.candidates,["product","records"])||!Object.values(e.candidates).every(oid)||!Array.isArray(e.requiredBenchRoles)||e.requiredBenchRoles.length===0||
   e.requiredBenchRoles.some((/** @type {any} */ role)=>!["product","records"].includes(role))||new Set(e.requiredBenchRoles).size!==e.requiredBenchRoles.length||!same(e.requiredBenchRoles,[...e.requiredBenchRoles].sort())||
   !Array.isArray(e.ignoredOutputs)||e.ignoredOutputs.some((/** @type {any} */ value)=>typeof value!=="string"||!value||/[\x00-\x1f\x7f-\x9f]/.test(value)))return "bench-contract";
  if(!shape(r.current,["revisions","repositories","refs"])||!shape(r.current.revisions,["product","records"])||!Object.values(r.current.revisions).every(oid)||
   !shape(r.current.repositories,["product","records"])||!shape(r.current.refs,["product","records"]))return "current-shape";
  for(const role of ["product","records"])if(!validProjectRepository(r.current.repositories[role])||!same(r.current.repositories[role],c.origins[role])||!isDeliveryBranchRef(r.current.refs[role]))return "current-origin";
  if(!Array.isArray(r.benches)||!same(r.benches.map((/** @type {any} */ row)=>row.role),e.requiredBenchRoles)||r.benches.some((/** @type {any} */ row)=>!shape(row,["role","checkout","base","candidate","parent"])||
   !absolute(row.checkout)||!validProjectDirectory(row.parent)||path.dirname(row.checkout)!==row.parent.path||row.base!==c.selection.revisions[row.role]||row.candidate!==e.candidates[row.role]||
   Object.values(c.origins).some((/** @type {any} */ repo)=>[repo.root,repo.gitDir,repo.commonDir].some(base=>row.checkout===base||row.checkout.startsWith(`${base}${path.sep}`)))))return "bench-shape";
  if(r.benches.some((/** @type {any} */ row,/** @type {number} */ i)=>r.benches.slice(i+1).some((/** @type {any} */ other)=>row.checkout===other.checkout||row.checkout.startsWith(`${other.checkout}${path.sep}`)||other.checkout.startsWith(`${row.checkout}${path.sep}`))))return "bench-overlap";
  const role=r.role;
  const valid=shape(role,["role","requested","model","harness","vehicle","sessionPolicy"])&&role.role==="verifier"&&role.requested===c.roles.verifier.requested&&role.model===c.roles.verifier.model.replace(/^codex\//,"")&&/^gpt-[A-Za-z0-9][A-Za-z0-9._-]*$/.test(role.model)&&
   role.harness==="codex-desktop-native"&&["fresh","subagent"].includes(role.vehicle)&&role.vehicle===(c.roles.verifier.vehicle??c.sessionPolicy.default)&&same(role.sessionPolicy,c.sessionPolicy)&&
   validConfiguredArmExecution(r.execution)&&shape(r.native,["sessionId","coordinatorTurnId","taskName","ignoredOutputs"])&&[r.native.sessionId,r.native.coordinatorTurnId].every(nativeId)&&same(r.native.ignoredOutputs,e.ignoredOutputs)&&
   r.native.taskName===`/root/configured_verifier_${createHash("sha256").update(r.operationId).digest("hex").slice(0,24)}`&&new RegExp(`^${r.taskId}-a[1-9][0-9]*$`).test(r.expectedAttempt)&&r.expectedAttempt!==e.source.attempt&&
   same(r.artifacts,configuredVerifierArtifactPaths(c.selection.authorityRoot,r.operationId))&&shape(r.admission,["grant","receipt"])&&same(r.admission.receipt,c.receipt)&&
   shape(r.admission.grant,["revision","digest","enforced","approval","recovery","paused"])&&Number.isSafeInteger(r.admission.grant.revision)&&r.admission.grant.revision>=0&&
   /^[0-9a-f]{64}$/.test(r.admission.grant.digest)&&typeof r.admission.grant.enforced==="boolean"&&["off","batch","each"].includes(r.admission.grant.approval)&&["none","repairs"].includes(r.admission.grant.recovery)&&r.admission.grant.paused===null;
  return valid?null:"launch";
 }catch{return "unreadable";}
}

/** Structural consistency only. @param {any} input */
export function validConfiguredVerifierRequest(input){return configuredVerifierRequestProblem(input)===null;}

/** Canonical fixed assignment data, never caller executable/policy input.
 * Preparation digests are data until the canonical actual entry is checked.
 * @param {any} r @param {string} [preparationDigest] */
export function configuredVerifierAssignmentData(r,preparationDigest=""){
 if(!validConfiguredVerifierRequest(r)||typeof preparationDigest!=="string"||preparationDigest!==""&&!sha(preparationDigest))throw Error("configured-verifier-assignment-data");
 const primary=r.benches.find((/** @type {any} */ row)=>row.role==="product")??r.benches[0];
 return {kind:"card",id:r.taskId,role:"verifier",resource:primary.checkout,cwd:primary.checkout,base:primary.candidate,brief:r.artifacts.phase2,
  harness:r.role.harness,model:r.role.model,...r.execution,ownedJobs:[],instants:{},admission:{kind:"explicit",parent:"",evidence:"",scope:"product-change"},
  native:{taskName:r.native.taskName,sessionId:r.native.sessionId,coordinatorTurnId:r.native.coordinatorTurnId,ignoredOutputs:r.native.ignoredOutputs,profile:"detached-verifier",executorAttempt:r.executor.source.attempt},
  qualified:{...r.executor.request,workers:r.benches.map((/** @type {any} */ row)=>({role:row.role,checkout:row.checkout,base:row.base,candidate:row.candidate})),verification:{executorAttempt:r.executor.source.attempt,preparationDigest}}};
}
/** @param {any} value */
const instant=value=>typeof value==="string"&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value)&&Number.isFinite(Date.parse(value));
/** Strict cross-field progress only. Actual owners must acknowledge physical
 * effects and requalify current policy/canonical preparation separately.
 * Serialized stages do not establish a bench, preparation, seal or permission.
 * @param {any} rec */
export function validConfiguredVerifierRecord(rec){
 try{
  if(!shape(rec,["version","recordKind","attempt","state","assignment","assignmentDigest","writer","resource","reservation","execution","admission","operation","events"])||rec.version!==1||rec.recordKind!=="operation"||
   !["starting","unknown","finished"].includes(rec.state)||rec.writer!==true||rec.execution!==null||rec.admission!==null||
   !shape(rec.assignment,["kind","id","role","resource"])||rec.assignment.kind!=="operation"||rec.assignment.role!=="configured-verifier"||rec.assignment.resource!==rec.resource||
   rec.assignmentDigest!==`sha256:${createHash("sha256").update(JSON.stringify(rec.assignment)).digest("hex")}`||!shape(rec.reservation,["file","takenAt","releasedAt"])||!instant(rec.reservation.takenAt)||
   !(rec.reservation.releasedAt===null||instant(rec.reservation.releasedAt))||!Array.isArray(rec.events)||rec.events.some((/** @type {any} */ row)=>!shape(row,["at","op"])||!instant(row.at)||typeof row.op!=="string"||!row.op))return false;
  const op=rec.operation,r=op.request;
  if(!shape(op,["version","id","kind","request","digest","owner","createdAt","claims","progress","acceptance"])||op.version!==1||op.kind!=="configured-verifier"||!validConfiguredVerifierRequest(r)||
   op.id!==r.operationId||op.digest!==operationDigest(r)||rec.assignment.id!==operationWork(op.id)||rec.attempt!==`${operationWork(op.id)}-a1`||rec.resource!==r.capsule.selection.authorityRoot||
   !instant(op.createdAt)||!shape(op.owner,["pid","identity","token"])||!Number.isSafeInteger(op.owner.pid)||op.owner.pid<1||!nativeId(op.owner.identity)||
   typeof op.owner.token!=="string"||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(op.owner.token)||
   !Array.isArray(op.claims)||!same(op.claims.map((/** @type {any} */ row)=>row.role).sort(),["product","records"]))return false;
  for(const claim of op.claims){const root=r.current.repositories[claim.role].root;
   if(!shape(claim,["role","resource","file","takenAt","releasedAt"])||claim.resource!==root||claim.file!==path.join(rec.resource,".supertaskr/runs/reservations",`${path.basename(root)}-${createHash("sha256").update(root).digest("hex").slice(0,12)}.json`)||
    !instant(claim.takenAt)||!(claim.releasedAt===null||instant(claim.releasedAt)))return false;
  }
  const primary=op.claims.find((/** @type {any} */ row)=>row.role==="product");if(!same(rec.reservation,{file:primary.file,takenAt:primary.takenAt,releasedAt:primary.releasedAt}))return false;
  const p=op.progress;
  if(!shape(p,["benches","preparation","artifacts","seal","handoff"])||!Array.isArray(p.benches)||p.benches.length!==r.benches.length||p.benches.some((/** @type {any} */ row,/** @type {number} */ i)=>{
   const plan=r.benches[i];if(!shape(row,["role","stage","identity"])||row.role!==plan.role||!["captured","creating","created"].includes(row.stage))return true;
   if(row.stage!=="created")return row.identity!==null;
   const actual=row.identity;return !shape(actual,["filesystemRoot","gitCommonDirectory","gitDirectory","device","inode"])||actual.filesystemRoot!==plan.checkout||actual.gitCommonDirectory!==r.current.repositories[row.role].commonDir||!absolute(actual.gitDirectory)||
    ![actual.device,actual.inode].every(value=>typeof value==="string"&&/^[0-9]{1,64}$/.test(value));
  }))return false;
  const prep=p.preparation,seal=p.seal,h=p.handoff;
  if(!shape(prep,["stage","digest"])||!["captured","preparing","prepared"].includes(prep.stage)||(prep.stage==="prepared"?!sha(prep.digest):prep.digest!==null)||
   prep.stage!=="captured"&&p.benches.some((/** @type {any} */ row)=>row.stage!=="created")||!shape(p.artifacts,["phase1","attackSet","phase2"]))return false;
  for(const key of ["phase1","attackSet","phase2"]){const artifact=p.artifacts[key];if(artifact!==null&&(!validConfiguredTextArtifact(artifact,r.artifacts[key])||prep.stage!=="prepared"))return false;}
  if(p.artifacts.attackSet!==null&&p.artifacts.phase1?.stage!=="written")return false;
  if(!shape(seal,["stage","measurements","digest"])||!["idle","captured","sealing","sealed"].includes(seal.stage)||
   (seal.stage==="sealed"?!sha(seal.digest):seal.digest!==null)||!(seal.measurements===null||typeof seal.measurements==="string"&&seal.measurements.trim()&&Buffer.byteLength(seal.measurements)<=4*1024*1024)||
   (seal.stage==="idle"?seal.measurements!==null:prep.stage!=="prepared"||p.artifacts.attackSet?.stage!=="written"||r.capsule.task.declaredTier==="guarded"&&seal.measurements===null))return false;
  if(p.artifacts.phase2!==null&&seal.stage!=="sealed")return false;
  if(!shape(h,["stage","native"])||!["held","releasing","ready","native-prepared"].includes(h.stage))return false;
  if(h.stage==="held"){if(h.native!==null||op.claims.some((/** @type {any} */ row)=>row.releasedAt!==null))return false;}
  else{
   if(prep.stage!=="prepared"||seal.stage!=="sealed"||p.artifacts.phase2?.stage!=="written"||p.benches.some((/** @type {any} */ row)=>row.stage!=="created"))return false;
   if(["ready","native-prepared"].includes(h.stage)&&op.claims.some((/** @type {any} */ row)=>row.releasedAt===null))return false;
   if(h.stage!=="native-prepared"){if(h.native!==null)return false;}
   else if(!shape(h.native,["attempt","assignmentDigest","permissionDigest"])||h.native.attempt!==r.expectedAttempt||!digest(h.native.assignmentDigest)||!sha(h.native.permissionDigest))return false;
  }
  const acceptance={preparationDigest:prep.digest,sealDigest:seal.digest,benches:p.benches.map((/** @type {any} */ row)=>({role:row.role,identity:row.identity})),native:h.native};
  if(op.acceptance!==null&&!same(op.acceptance,acceptance))return false;
  return rec.state==="finished"?op.acceptance!==null&&h.stage==="native-prepared":op.acceptance===null;
 }catch{return false;}
}
