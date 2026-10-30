/** Finite configured verifier constructor data. Valid serialized data grants
 * no preparation, owned-operation exclusion, grade or native launch. */
import path from "node:path";
import {createHash} from "node:crypto";
import {validConfiguredDispatchCapsule} from "../../../cli/configured-native-reader.mjs";
import {isDeliveryBranchRef} from "../../../lib/parser/dist/pure.js";
import {validConfiguredArmExecution} from "./configured-dispatch-record.mjs";
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
