/** Planned-output data and progress definitions only. This module is not a
 * registered operation writer and grants no effect, grade or acceptance.
 * Actual source, ownership, process and artifact checks remain producer work.
 */
import {createHash} from "node:crypto";
import path from "node:path";
import {operationContent,operationDigest,operationPayload} from "./operation-record.mjs";
import {validConfiguredDispatchCapsule} from "../../../cli/configured-native-reader.mjs";
import {validQualifiedConfiguredGateCapture,validQualifiedConfiguredAuthorityGrades} from "./qualified-configured-grades.mjs";
import {validQualifiedDeliveryPolicySource,validQualifiedPublicationOutputContext} from "./qualified-delivery-record.mjs";
import {ordinaryRecordTextPath} from "./records-profile.mjs";
/** @param {any} v @param {string[]} keys */
const shape=(v,keys)=>v&&typeof v==="object"&&!Array.isArray(v)&&Object.keys(v).sort().join("\0")===[...keys].sort().join("\0");
/** @param {any} a @param {any} b */
const same=(a,b)=>operationContent(a)===operationContent(b);
/** @param {any} v */
const oid=v=>typeof v==="string"&&/^[0-9a-f]{40}$/.test(v);
/** @param {any} v */
const digest=v=>typeof v==="string"&&/^sha256:[0-9a-f]{64}$/.test(v);
/** @param {any} v */
const sha=v=>typeof v==="string"&&/^[0-9a-f]{64}$/.test(v);
/** @param {any} v */
const absolute=v=>typeof v==="string"&&path.isAbsolute(v)&&!/[\x00-\x1f\x7f]/.test(v);
/** @param {any} v */
const relative=v=>typeof v==="string"&&v.length>0&&!path.posix.isAbsolute(v)&&!path.win32.isAbsolute(v)&&!/[\\\x00-\x1f\x7f]/.test(v)&&v.split("/").every(p=>p&&![".","..",".git",".supertaskr"].includes(p.toLowerCase()));
/** @param {any} v */
const encoded=v=>typeof v==="string"&&Buffer.from(v,"base64").toString("base64")===v;
/** @param {any} v */
const instant=v=>typeof v==="string"&&Number.isFinite(Date.parse(v));
/** @param {any} v */
const directory=v=>shape(v,["path","device","inode"])&&absolute(v.path)&&[v.device,v.inode].every(n=>typeof n==="string"&&/^\d+$/.test(n));
/** @param {any} v */
function repository(v){return shape(v,["root","gitDir","commonDir","objectFormat","rootCommits","identities"])&&[v.root,v.gitDir,v.commonDir].every(absolute)&&v.objectFormat==="sha1"&&
 Array.isArray(v.rootCommits)&&v.rootCommits.length>0&&v.rootCommits.every(oid)&&new Set(v.rootCommits).size===v.rootCommits.length&&Array.isArray(v.identities)&&v.identities.length===4&&v.identities.every(directory)&&
 same(v.identities.map((/** @type {any} */ i)=>i.path),[v.root,v.gitDir,v.commonDir,path.join(v.commonDir,"objects")]);}
/** @param {any} v */
const snapshot=v=>shape(v,["present"])&&v.present===false||shape(v,["present","mode","base64"])&&v.present===true&&["100644","100755"].includes(v.mode)&&encoded(v.base64);
/** @param {any} v */
const actor=v=>shape(v,["name","email","date"])&&[v.name,v.email].every(n=>typeof n==="string"&&n.trim()&&!/[\r\n<>\0]/.test(n))&&typeof v.date==="string"&&/^-?\d+ [+-]\d{4}$/.test(v.date);
/** Finite provenance only; canonical installed bytes are checked by the producer.
 * @param {any} v */
function tool(v){return shape(v,["version","package","parserVersion","runtimeDigest","methodVersion","methodDigest","manifestDigest","statuses"])&&v.version===2&&
 shape(v.package,["name","version","sha256","entrySha256"])&&v.package.name==="supertaskr"&&typeof v.package.version==="string"&&[v.package.sha256,v.package.entrySha256].every(sha)&&
 typeof v.parserVersion==="string"&&typeof v.methodVersion==="string"&&[v.runtimeDigest,v.methodDigest,v.manifestDigest].every(sha)&&Array.isArray(v.statuses)&&v.statuses.length>0&&
 v.statuses.every((/** @type {any} */ s)=>typeof s==="string")&&new Set(v.statuses).size===v.statuses.length;}
/** @param {any} v @param {any} plan @param {any} product */
function configuration(v,plan,product){return shape(v,["kind","productRoot","productRevision","path","configDigest","tool","assets"])&&v.kind==="committed"&&v.productRoot===product.repository.root&&
 v.productRevision===product.originalBase&&v.path==="supertaskr.yaml"&&digest(v.configDigest)&&shape(v.tool,["manifestDigest","parserVersion","methodVersion","methodDigest","runtimeDigest"])&&
 Object.keys(v.tool).every(k=>v.tool[k]===plan.tool[k])&&Array.isArray(v.assets)&&v.assets.length>0&&new Set(v.assets.map((/** @type {any} */ a)=>a.path)).size===v.assets.length&&
 v.assets.every((/** @type {any} */ a)=>shape(a,["path","sha256"])&&relative(a.path)&&a.path.startsWith("method/")&&sha(a.sha256));}
/** @param {any} working @param {any} role */
function workingPlan(working,role){const index=working?.index;return shape(working,["preimages","index"])&&Array.isArray(working.preimages)&&
 same(working.preimages.map((/** @type {any} */ p)=>p.path).sort(),role.writes.map((/** @type {any} */ w)=>w.path).sort())&&working.preimages.every((/** @type {any} */ p)=>shape(p,["path","work"])&&snapshot(p.work))&&
 shape(index,["path","previousDigest","resultDigest","resultBase64","lockToken"])&&index.path===path.join(role.repository.gitDir,"index")&&[index.previousDigest,index.resultDigest].every(digest)&&encoded(index.resultBase64)&&
 index.resultDigest===operationDigest(index.resultBase64)&&typeof index.lockToken==="string"&&index.lockToken.length>0;}
/** @param {any} role @param {any} plan */
function rolePlan(role,plan){
 const original=plan.authority.roles.find((/** @type {any} */ r)=>r.role===role.role),unchanged=role.identity===null;
 if(!shape(role,["role","repository","originalBase","candidate","reviewedOutput","expectedRevision","targetRef","writes",...(unchanged?[]:["mergePolicyDigest"]),"corrections","identity","message","tree","working","commit","commitBase64","grade"])||
  !original||!repository(role.repository)||role.repository.root!==original.repository.filesystemRoot||role.repository.commonDir!==original.repository.gitCommonDirectory||role.originalBase!==original.originalBase||role.candidate!==original.candidate||!same(role.reviewedOutput,original.actualOutput)||
  !same({ref:role.targetRef,expectedRevision:role.expectedRevision},plan.targets[role.role])||![role.originalBase,role.candidate,role.expectedRevision,role.tree,role.commit].every(oid)||
  !Array.isArray(role.writes)||new Set(role.writes.map((/** @type {any} */ w)=>w.path)).size!==role.writes.length||role.writes.some((/** @type {any} */ w)=>!relative(w.path)||
   !(shape(w,["path","operation"])&&w.operation==="delete"||shape(w,["path","operation","mode","base64"])&&w.operation==="write"&&["100644","100755"].includes(w.mode)&&encoded(w.base64)))||
  !shape(role.grade,["status","kind","commit","tree"])||role.grade.commit!==role.commit||role.grade.tree!==role.tree||!Array.isArray(role.corrections))return false;
 const corrections=plan.authority.owedCorrections.filter((/** @type {any} */ c)=>c.role===role.role);
 if(role.corrections.length!==corrections.length||new Set(role.corrections.map((/** @type {any} */ c)=>c.correction)).size!==role.corrections.length||role.corrections.some((/** @type {any} */ c)=>
  !shape(c,["correction","file","spec","bodyHash","blockDigest","projection","grade"])||!["proposed-exact-anchor","already-correct-in-reviewed-output"].includes(c.projection)||c.grade!=="owed"||
  !corrections.some((/** @type {any} */ old)=>old.wordingOnly!==true&&c.correction===old.correction&&c.file===old.block.file&&c.spec===old.block.spec&&c.bodyHash===old.bodyHash&&c.blockDigest===old.blockDigest)))return false;
 if(unchanged)return role.writes.length===0&&role.corrections.length===0&&role.message===null&&role.working===null&&role.commitBase64===null&&role.commit===role.expectedRevision&&
  role.grade.status===(role.role==="product"?"not-owed":"owed")&&role.grade.kind===(role.role==="product"?"none":"canonical-private-record-validation")&&original.implementationChanges.length===0&&original.outputChanges.length===0;
 if(!shape(role.identity,["author","committer"])||![role.identity.author,role.identity.committer].every(actor)||!digest(role.mergePolicyDigest)||!workingPlan(role.working,role)||!encoded(role.commitBase64)||
  role.grade.status!=="owed"||role.grade.kind!==(role.role==="product"?"original-product-policy":"canonical-private-record-validation")||
  role.message!==`Integrate ${plan.authority.taskId} reviewed output\n\nsupertaskr-delivery-integration: ${plan.operationId}/${role.role}\n`)return false;
 const raw=Buffer.from(role.commitBase64,"base64"),identity=(/** @type {any} */ a)=>`${a.name} <${a.email}> ${a.date}`;
 return raw.equals(Buffer.from(`tree ${role.tree}\nparent ${role.expectedRevision}\nauthor ${identity(role.identity.author)}\ncommitter ${identity(role.identity.committer)}\n\n${role.message}`))&&
  createHash("sha1").update(`commit ${raw.length}\0`).update(raw).digest("hex")===role.commit;
}
/** Valid proposal data is not an accepted operation or a grade. Current Git
 * ancestry, scope, objects and canonical original source are checked at effects.
 * @param {any} plan */
export function validQualifiedIntegrationPlan(plan){
 try{
  if(!shape(plan,["version","kind","operationId","authority","tool","origins","source","configuration","targets","roles","recordsValidation"])||plan.version!==1||plan.kind!=="qualified-integration-plan"||
   typeof plan.operationId!=="string"||!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(plan.operationId)||!shape(plan.targets,["product","records"])||!Array.isArray(plan.roles)||plan.roles.length!==2||
   !same(plan.roles.map((/** @type {any} */ r)=>r.role).sort(),["product","records"])||!tool(plan.tool))return false;
  const authority=plan.authority,{authorityDigest,...body}=authority;
  if(!shape(authority,["version","taskId","projectId","executor","verifier","frozenAuthority","roles","physicalLandings","owedCorrections","gradeObligations","authorityDigest"])||authority.version!==1||!/^T-\d+(?:-s\d+)?$/.test(authority.taskId)||
   !digest(authorityDigest)||authorityDigest!==operationDigest(body)||!Array.isArray(authority.roles)||authority.roles.length!==2||!same(authority.roles.map((/** @type {any} */ r)=>r.role).sort(),["product","records"])||
   !shape(authority.frozenAuthority,["receipt","scope","preparation","review"])||!Array.isArray(authority.owedCorrections)||
   !shape(plan.source,["attempt","permissionDigest","configuredDispatch"])||plan.source.attempt!==authority.verifier.attempt||plan.source.permissionDigest!==authority.verifier.permissionDigest)return false;
  if(!same(authority.owedCorrections,authority.frozenAuthority.review.corrections)||authority.taskId!==authority.frozenAuthority.preparation.taskId||
   authority.projectId!==authority.frozenAuthority.preparation.projectId||authority.projectId!==authority.frozenAuthority.receipt.projectId)return false;
  for(const r of authority.roles){const frozen=authority.frozenAuthority;
   if(r.originalBase!==frozen.scope.revisions[r.role]||r.candidate!==frozen.preparation.candidates[r.role]||!same(r.repository,frozen.scope.fence.repositories[r.role])||
    !same([r.actualOutput],frozen.review.actualOutputs.filter((/** @type {any} */ o)=>o.role===r.role))||!same(r.candidateGrades,frozen.review.grades.filter((/** @type {any} */ g)=>g.role===r.role))||
    !same(r.actualOutputGrades,frozen.review.actualOutputGrades.filter((/** @type {any} */ g)=>g.role===r.role)))return false;
  }
  for(const target of Object.values(plan.targets))if(!shape(target,["ref","expectedRevision"])||typeof target.ref!=="string"||!/^refs\/heads\/[^\s]+$/.test(target.ref)||!oid(target.expectedRevision))return false;
  const capsule=plan.source.configuredDispatch;
  if(capsule!==null){if(!validConfiguredDispatchCapsule(capsule)||!same(capsule.receipt,authority.frozenAuthority.receipt)||capsule.gatePolicy.toolManifestDigest!==plan.tool.manifestDigest)return false;
   const {digest:claimed,...captured}=capsule;if(claimed!==operationDigest(captured))return false;}
  if(!plan.roles.every((/** @type {any} */ r)=>rolePlan(r,plan)))return false;
  const p=plan.roles.find((/** @type {any} */ r)=>r.role==="product"),r=plan.roles.find((/** @type {any} */ r)=>r.role==="records"),v=plan.recordsValidation;
  if(p.repository.root===r.repository.root||p.repository.identities.some((/** @type {any} */ a)=>r.repository.identities.some((/** @type {any} */ b)=>a.device===b.device&&a.inode===b.inode))||
   !shape(plan.origins,["docs","runtime"])||![plan.origins.docs,plan.origins.runtime].every(directory)||plan.origins.docs.path!==path.join(r.repository.root,"docs")||plan.origins.runtime.path!==path.join(p.repository.root,".supertaskr")||
   !configuration(plan.configuration,plan,p)||capsule!==null&&!same(capsule.configuration,plan.configuration)||
   !shape(v,["status","captureDigest","candidateDigest","tree","modeled","unmodeled","retained","procedural","indexDerivation"])||v.status!=="proposed-validation"||!digest(v.captureDigest)||!sha(v.candidateDigest)||v.tree!==r.tree||
   ![v.modeled,v.unmodeled,v.retained,v.procedural].every(Array.isArray)||!same(v.modeled.slice().sort(),r.writes.filter((/** @type {any} */ w)=>ordinaryRecordTextPath(w.path)).map((/** @type {any} */ w)=>w.path).sort())||
   !same(v.unmodeled.slice().sort(),r.writes.filter((/** @type {any} */ w)=>!ordinaryRecordTextPath(w.path)&&w.path!=="docs/INDEX.md").map((/** @type {any} */ w)=>w.path).sort()))return false;
  if(v.indexDerivation!==null&&(!shape(v.indexDerivation,["path","mode","base64","owed"])||v.indexDerivation.path!=="docs/INDEX.md"||!["100644","100755"].includes(v.indexDerivation.mode)||!encoded(v.indexDerivation.base64)||v.indexDerivation.owed!=="coordinator completion"))return false;
  operationPayload(plan);return true;
 }catch{return false;}
}
/** Modeled-private request definition. This data predicate grants no effect;
 * the same-operation producer must obtain actual canonical private validation
 * under current original policy before materializing these exact outputs.
 * @param {any} request */
export function validQualifiedPlannedDeliveryRequest(request){
 try{
  if(!shape(request,["version","operationId","kind","coordinator","docsDirectory","runtimeDirectory","authority","policySource","targets","route","landings","integration"])||
   request.version!==1||request.kind!=="qualified-delivery"||!shape(request.integration,["plan","digest","execution"])||request.integration.execution!==null)return false;
  const {plan,digest:claimed}=request.integration;
  if(!validQualifiedIntegrationPlan(plan)||claimed!==operationDigest(plan)||request.operationId!==plan.operationId||!same(request.authority,plan.authority)||
   !same(request.targets,plan.targets)||plan.recordsValidation.unmodeled.length!==0)return false;
  const product=plan.roles.find((/** @type {any} */ r)=>r.role==="product"),records=plan.roles.find((/** @type {any} */ r)=>r.role==="records");
  if(product.grade.status!=="not-owed"||!same(request.coordinator,product.repository)||!same(request.docsDirectory,plan.origins.docs)||!same(request.runtimeDirectory,plan.origins.runtime)||
   !same(request.route,{name:"local-planned-output-v1",publicationOwed:false,completionOwed:true,policyRevision:product.originalBase})||
   !validQualifiedDeliveryPolicySource(request.policySource,{...plan.authority.verifier,taskId:plan.authority.taskId,receipt:plan.authority.frozenAuthority.receipt})||
   !same(request.policySource.native.qualified.origins.configuredDispatch??null,plan.source.configuredDispatch)||
   records.working===null||records.writes.length===0||records.commit===records.expectedRevision)return false;
  return same(request.landings,[{key:"records",roles:["records"],repository:records.repository,expectedRevision:records.expectedRevision,ref:records.targetRef,
   commit:records.commit,tree:records.tree,writes:records.writes,working:records.working}]);
 }catch{return false;}
}
/** Explicit both-root resource projection for the forthcoming PRODUCT route.
 * Reserving a resource is not a grant to write it; effect landings are separate.
 * @param {any} plan */
export function qualifiedProductIntegrationResources(plan){
 if(!validQualifiedIntegrationPlan(plan))throw Error("QUALIFIED_INTEGRATION_PLAN_REQUIRED");
 return ["product","records"].map(role=>({key:role,repository:structuredClone(plan.roles.find((/** @type {any} */ r)=>r.role===role).repository)}));
}
/** Unregistered full planned request definition. This predicate cannot supply
 * an authentic plan/publication handle, actual grades or effect authority.
 * The existing public operation reader deliberately does not accept this route
 * until its owned producer/progress/effect support is reviewed and registered.
 * @param {any} request */
export function validQualifiedProductPlannedDeliveryRequest(request){
 try{
  if(!shape(request,["version","operationId","kind","coordinator","docsDirectory","runtimeDirectory","authority","policySource","targets","route","landings","integration"])||request.version!==1||request.kind!=="qualified-delivery"||
   !shape(request.integration,["plan","digest","execution","resources","executorPolicySource"]))return false;
  const {plan,execution,executorPolicySource}=request.integration;
  if(!validQualifiedIntegrationPlan(plan)||request.integration.digest!==operationDigest(plan)||request.operationId!==plan.operationId||!same(request.authority,plan.authority)||!same(request.targets,plan.targets)||
   plan.recordsValidation.unmodeled.length!==0||plan.source.configuredDispatch===null||!validQualifiedIntegrationExecution(execution)||execution.version!==2||
   !same(request.integration.resources,qualifiedProductIntegrationResources(plan)))return false;
  const p=plan.roles.find((/** @type {any} */ r)=>r.role==="product"),r=plan.roles.find((/** @type {any} */ r)=>r.role==="records");
  if(p.grade.status!=="owed"||p.identity===null||!same(request.coordinator,p.repository)||!same(request.docsDirectory,plan.origins.docs)||!same(request.runtimeDirectory,plan.origins.runtime)||
   !shape(request.route,["name","publicationOwed","completionOwed","policyRevision","publication"])||request.route.name!=="protected-planned-output-v1"||request.route.publicationOwed!==true||request.route.completionOwed!==true||request.route.policyRevision!==p.commit)return false;
  for(const [source,role] of [[request.policySource,"verifier"],[executorPolicySource,"executor"]])if(!validQualifiedDeliveryPolicySource(source,{...plan.authority[role],taskId:plan.authority.taskId,receipt:plan.authority.frozenAuthority.receipt})||
   !same(source.native.qualified.origins.configuredDispatch,plan.source.configuredDispatch))return false;
  if(!validQualifiedConfiguredAuthorityGrades(plan.authority,request.policySource))return false;
  const publication=request.route.publication;
  if(!validQualifiedPublicationOutputContext(publication,request,{commit:p.commit,tree:p.tree,expectedOld:p.expectedRevision})||!same(publication.tool,plan.tool)||
   !same(execution.node,{path:publication.hook.node.path,sha256:publication.hook.nodeSha256})||
   execution.entry.path!==path.join(path.dirname(publication.hook.entry),"qualified-integration-launch.mjs")||execution.worker.path!==path.join(path.dirname(publication.hook.entry),"qualified-integration-worker.mjs"))return false;
  const landings=[p,r].filter(role=>role.identity!==null).map(role=>({key:role.role,roles:[role.role],repository:role.repository,expectedRevision:role.expectedRevision,ref:role.targetRef,commit:role.commit,tree:role.tree,writes:role.writes,working:role.working}));
  if(!same(request.landings,landings))return false;
  operationPayload(request);return true;
 }catch{return false;}
}
/** Data-only exact whole-grade acceptance. The producer must obtain each row
 * from its actual owned launch/artifact; this validator cannot supply it.
 * @param {any} progress @param {any} plan */
export function validQualifiedIntegrationGrades(progress,plan){
 try{
  if(!validQualifiedIntegrationPlan(plan)||!shape(progress,["version","planDigest","product","records","acceptance"])||progress.version!==1||progress.planDigest!==operationDigest(plan))return false;
  const p=plan.roles.find((/** @type {any} */ r)=>r.role==="product"),r=plan.roles.find((/** @type {any} */ r)=>r.role==="records"),v=plan.recordsValidation,productOwed=p.grade.status==="owed";
  if(progress.product!==null){const g=progress.product,policy=plan.source.configuredDispatch?.gatePolicy;
   if(!productOwed||!policy||!shape(g,["capture","digest"])||g.digest!==operationDigest(g.capture)||!validQualifiedConfiguredGateCapture(g.capture,policy,{commit:p.commit,tree:p.tree}))return false;
  }
  if(progress.records!==null&&(!shape(progress.records,["tree","captureDigest","candidateDigest","retained","procedural"])||!same(progress.records,{tree:r.tree,captureDigest:v.captureDigest,candidateDigest:v.candidateDigest,retained:v.retained,procedural:v.procedural})))return false;
  const acceptance={planDigest:progress.planDigest,productGradeDigest:productOwed?progress.product?.digest:"not-owed",recordsGradeDigest:operationDigest(progress.records),attribution:"exact-owned-grades"};
  return progress.acceptance===null||plan.recordsValidation.unmodeled.length===0&&progress.records!==null&&(!productOwed||progress.product?.capture.complete===true)&&same(progress.acceptance,acceptance);
 }catch{return false;}
}
/** @param {any} v */
const asset=v=>shape(v,["path","sha256"])&&absolute(v.path)&&sha(v.sha256);
/** Fixed backend execution selection. These descriptors still need actual
 * installed membership and physical bytes checked at every launch/effect.
 * @param {any} value */
export function validQualifiedIntegrationExecution(value){return value&&[1,2].includes(value.version)&&shape(value,["version","node","entry",...(value.version===2?["worker"]:[])])&&asset(value.node)&&asset(value.entry)&&path.basename(value.entry.path)==="qualified-integration-launch.mjs"&&
 (value.version===1||asset(value.worker)&&path.basename(value.worker.path)==="qualified-integration-worker.mjs");}
/** Canonical exact marker bytes; a marker alone never establishes ownership.
 * @param {string} operationId @param {string} planDigest @param {string} token */
export function qualifiedIntegrationWorkspaceMarker(operationId,planDigest,token){return operationContent({version:1,operationId,planDigest,token})+"\n";}
/** @param {any} value */
function artifact(value){return shape(value,["path","device","inode","fileMode","byteLength","sha256"])&&absolute(value.path)&&[value.device,value.inode].every(n=>typeof n==="string"&&/^\d+$/.test(n))&&
 value.fileMode===0o600&&Number.isSafeInteger(value.byteLength)&&value.byteLength>=0&&value.byteLength<=64*1024*1024&&sha(value.sha256);}
/** Parent-retained actual fixed worker-thread ending, separate from wrapper
 * retirement. Shape is not execution proof; the owner verifies the real
 * thread ending, owned artifact and canonical row before retaining this.
 * @param {any} result @param {any} workspace @param {number} sequence */
export function validQualifiedIntegrationWorkerResult(result,workspace,sequence){
 try{
 return shape(result,["kind","threadId","exit","finishedAt","artifact","rowDigest"])&&result.kind==="thread-exited"&&Number.isSafeInteger(result.threadId)&&result.threadId>0&&
  [0,1].includes(result.exit)&&instant(result.finishedAt)&&artifact(result.artifact)&&result.artifact.path===path.join(workspace.path,`result-${sequence}.json`)&&digest(result.rowDigest);
 }catch{return false;}
}
/** @param {string} a @param {string} b */
function disjoint(a,b){return [path.relative(a,b),path.relative(b,a)].every(r=>r===".."||r.startsWith(`..${path.sep}`)||path.isAbsolute(r));}
/** Unaccepted physical observations never establish an actual exit or grade.
 * At most one immutable observation belongs to each known-dead original
 * launch. The producer still verifies actual path/identity/bytes/ownership.
 * @param {any} observations @param {any[]} workspaces @param {any[]} launches */
export function validQualifiedIntegrationObservations(observations,workspaces,launches){
 try{
  if(!Array.isArray(observations)||observations.length>256)return false;const retained=new Set();
  for(const [at,o] of observations.entries()){
   const launch=launches[o.launchSequence-1],workspace=launch&&workspaces[launch.workspaceSequence-1];
   if(!shape(o,["sequence","launchSequence","observedAt","kind","artifact"])||o.sequence!==at+1||o.kind!=="unaccepted-artifact"||!instant(o.observedAt)||
    !launch||!workspace||launch.result?.kind!=="observed-dead"||launch.workerResult!=null||!instant(launch.startedAt)||Date.parse(o.observedAt)<Date.parse(launch.startedAt)||retained.has(o.launchSequence)||
    !artifact(o.artifact)||o.artifact.path!==path.join(workspace.path,`result-${launch.sequence}.json`))return false;
   retained.add(o.launchSequence);
  }return true;
 }catch{return false;}
}
/** Full progress data shape. The modeled-private route has null execution
 * and no workspace/launch. The PRODUCT producer remains unregistered; its
 * future rows retain failed/interrupted attempts. A pure predicate cannot
 * resolve unknown physical attribution or live groups.
 * @param {any} progress @param {any} plan @param {any} execution */
export function validQualifiedIntegrationProgress(progress,plan,execution){
 try{
  const observed=execution?.version===2;
  if(!validQualifiedIntegrationPlan(plan)||!shape(progress,["version","planDigest","phase","workspaces","launches","grades",...(observed?["observations"]:[])])||progress.version!==(observed?2:1)||
   progress.planDigest!==operationDigest(plan)||!["captured","preparing","grading","ready"].includes(progress.phase)||!validQualifiedIntegrationGrades(progress.grades,plan)||
   !Array.isArray(progress.workspaces)||progress.workspaces.length>32||!Array.isArray(progress.launches)||progress.launches.length>256)return false;
  const product=plan.roles.find((/** @type {any} */ r)=>r.role==="product"),owed=product.grade.status==="owed",paths=new Set(),tokens=new Set();
  if(owed?!validQualifiedIntegrationExecution(execution):execution!==null)return false;
  if(!owed&&(progress.workspaces.length||progress.launches.length||progress.grades.product!==null))return false;
  for(const [at,w] of progress.workspaces.entries()){
   if(!shape(w,["sequence","path","token","phase","createdAt","directory","repository","marker"])||w.sequence!==at+1||!absolute(w.path)||paths.has(w.path)||typeof w.token!=="string"||!/^workspace-[0-9a-f-]{36}$/.test(w.token)||tokens.has(w.token)||
    !["preparing","ready"].includes(w.phase)||!instant(w.createdAt)||plan.roles.some((/** @type {any} */ r)=>!disjoint(w.path,r.repository.root)))return false;
   paths.add(w.path);tokens.add(w.token);
   if(w.directory!==null&&(!directory(w.directory)||w.directory.path!==w.path))return false;
   if(w.repository!==null&&(!repository(w.repository)||w.repository.root!==path.join(w.path,"candidate")||w.repository.gitDir!==path.join(w.repository.root,".git")||w.repository.commonDir!==w.repository.gitDir||
    plan.roles.some((/** @type {any} */ r)=>r.repository.identities.some((/** @type {any} */ a)=>w.repository.identities.some((/** @type {any} */ b)=>a.device===b.device&&a.inode===b.inode)))))return false;
   if(w.marker!==null){const bytes=Buffer.from(qualifiedIntegrationWorkspaceMarker(plan.operationId,progress.planDigest,w.token));
    if(!artifact(w.marker)||w.marker.path!==path.join(w.path,"marker.json")||w.marker.byteLength!==bytes.length||w.marker.sha256!==createHash("sha256").update(bytes).digest("hex"))return false;
   }
   if(w.phase==="ready"&&(w.directory===null||w.repository===null||w.marker===null))return false;
  }
  for(const [at,l] of progress.launches.entries()){
   const w=progress.workspaces[l.workspaceSequence-1],policy=plan.source.configuredDispatch?.gatePolicy;
   if(!shape(l,["sequence","workspaceSequence","suite","token","owner","process","node","entry","startedAt","result",...(observed?["workerResult"]:[])])||l.sequence!==at+1||!w||w.phase!=="ready"||!policy?.required.includes(l.suite)||
    typeof l.token!=="string"||!/^launch-[0-9a-f-]{36}$/.test(l.token)||tokens.has(l.token)||!same(l.node,execution.node)||!same(l.entry,execution.entry)||!instant(l.startedAt)||
    !shape(l.owner,["pid","identity","token"])||!Number.isSafeInteger(l.owner.pid)||l.owner.pid<1||typeof l.owner.identity!=="string"||!l.owner.identity||typeof l.owner.token!=="string"||!l.owner.token||
    !shape(l.process,["pid","identity","group"])||!Number.isSafeInteger(l.process.pid)||l.process.pid<1||l.process.group!==l.process.pid||typeof l.process.identity!=="string"||!l.process.identity)return false;
   tokens.add(l.token);
   if(l.result!==null){const r=l.result;
    if(r.kind==="observed-dead"){if(!shape(r,["kind","observedAt"])||!instant(r.observedAt))return false;}
    else if(!shape(r,["kind","exit","signal","finishedAt","stdoutDigest","stderrDigest",...(observed?[]:["artifact","rowDigest"])])||r.kind!=="exited"||!instant(r.finishedAt)||
     !(r.exit===null||Number.isSafeInteger(r.exit)&&r.exit>=0&&r.exit<=255)||!(r.signal===null||typeof r.signal==="string"&&/^SIG[A-Z0-9]+$/.test(r.signal))||![r.stdoutDigest,r.stderrDigest].every(digest)||
     !observed&&((r.artifact===null)!==(r.rowDigest===null)||r.artifact!==null&&(!artifact(r.artifact)||r.artifact.path!==path.join(w.path,`result-${l.sequence}.json`)||!digest(r.rowDigest))))return false;
   }
   if(observed&&l.workerResult!==null&&(!validQualifiedIntegrationWorkerResult(l.workerResult,w,l.sequence)||Date.parse(l.workerResult.finishedAt)<Date.parse(l.startedAt)))return false;
   if(at<progress.launches.length-1&&l.result===null)return false;
  }
  if(observed){
   if(!validQualifiedIntegrationObservations(progress.observations,progress.workspaces,progress.launches))return false;
   // Unaccepted observations cannot establish a suite result or acceptance.
   if(progress.grades.product!==null&&Buffer.byteLength(operationContent(progress.grades.product))>32*1024*1024)return false;
  }
  if(progress.grades.product!==null){const capture=progress.grades.product.capture,policy=plan.source.configuredDispatch.gatePolicy;
   for(const row of capture.suites){const latest=progress.launches.filter((/** @type {any} */ l)=>l.suite===row.definition.id).at(-1),result=observed?latest?.workerResult:latest?.result;
    if(!latest||result?.kind!==(observed?"thread-exited":"exited")||result.artifact===null||result.rowDigest!==operationDigest(row)||!observed&&result.signal!==null||
     result.exit!==(row.verdict.verdict==="GREEN"?0:1)||progress.workspaces[latest.workspaceSequence-1].repository.root!==capture.candidate.productRoot||!policy.required.includes(row.definition.id))return false;
   }
   if(progress.launches.at(-1)?.result===null)return false;
  }
  if(progress.phase==="captured"&&(progress.workspaces.length||progress.launches.length||progress.grades.product!==null||progress.grades.records!==null||progress.grades.acceptance!==null))return false;
  if(progress.phase==="preparing"&&progress.workspaces.at(-1)?.phase!=="preparing")return false;
  return (progress.phase==="ready")===(progress.grades.acceptance!==null);
 }catch{return false;}
}
