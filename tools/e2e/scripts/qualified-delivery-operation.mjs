/** Protected exact-output local integration. The same operation retains later
 * publication/CI/completion debt. No full-delivery success is produced here. */
import {execFileSync} from "node:child_process";
import {randomUUID} from "node:crypto";
import {lstatSync,readFileSync,realpathSync,existsSync,readdirSync,rmdirSync} from "node:fs";
import path from "node:path";
import * as runs from "./run-record.mjs";
import {captureQualifiedDeliveryAuthority,QualifiedDeliveryFinding} from "./qualified-delivery.mjs";
import {captureQualifiedInputs} from "./qualified-reservation.mjs";
import {collectQualifiedNativeRun} from "./qualified-native.mjs";
import {loadQualifiedDeliveryPolicy,qualifiedDeliveryPhasePolicy,qualifiedDeliveryRecoveryPolicy} from "./qualified-admission.mjs";
import {atomicJson,parseNativeRawDiff,nativePathAllowed,withNativeTransaction,syncNativeFileNamespace} from "./native-codex.mjs";
import {operationContent,operationDigest,operationPayload,operationWork,validOperationRecord} from "./operation-record.mjs";
import {validQualifiedDeliveryRequest,validQualifiedDeliveryPolicySource} from "./qualified-delivery-record.mjs";
import {acceptedOperationPath,captureOperationRepository,captureQualifiedOperationRepository,checkOperationEnvironment,operationOwnerAlive,readAcceptedOperation} from "./durable-operation.mjs";
import {captureQualifiedPublicationContext,qualifiedPublicationContextProof,qualifyFrozenPublicationLocalContext} from "./qualified-publication-context.mjs";
import {readOperationRef,operationDestinationContains,acceptOperationRef} from "./operation-ref.mjs";
import {assertExactRecordTransformations,captureExactWritePlan,materializeExactWrites,releaseDeadExactWriteLock,safeOperationWorkingPath} from "./record-write.mjs";

const active=new Set();
/** @param {string} code @returns {never} */
function refuse(code){throw new QualifiedDeliveryFinding(code);}
/** @param {any} v @param {string[]} fields */
function shape(v,fields){return v && typeof v === "object" && !Array.isArray(v) && Object.keys(v).sort().join("\0") === [...fields].sort().join("\0");}
/** @param {any} v @returns {any} */
function freeze(v){if(v && typeof v === "object"){Object.values(v).forEach(freeze);Object.freeze(v);}return v;}
/** @param {any} a @param {any} b */
function same(a,b){return operationContent(a) === operationContent(b);}
/** @param {string} root @param {string[]} args */
function git(root,args){try{return execFileSync("git",["--no-replace-objects","-C",root,...args],{stdio:["ignore","pipe","pipe"],maxBuffer:64*1024*1024,
 env:{...process.env,GIT_NO_LAZY_FETCH:"1",GIT_OPTIONAL_LOCKS:"0"}});}catch{refuse("QUALIFIED_DELIVERY_GIT");}}
/** @param {string} root @param {string[]} args */
function line(root,args){return git(root,args).toString("utf8").replace(/\n$/,"");}
/** @param {string} file */
function directory(file){const s=lstatSync(file,{bigint:true});if(!s.isDirectory() || s.isSymbolicLink() || realpathSync(file) !== file)refuse("QUALIFIED_DELIVERY_DIRECTORY");return {path:file,device:String(s.dev),inode:String(s.ino)};}
/** @param {string} root @param {any} rec */
function persist(root,rec){if(!validOperationRecord(rec))refuse("QUALIFIED_DELIVERY_RECORD");atomicJson(acceptedOperationPath(root,rec.operation.id),rec);}
/** @param {any} request @param {any} landing */
function validateOutput(request,landing){
 const root=landing.repository.root;
 if(line(root,["cat-file","-t",landing.commit]) !== "commit" || line(root,["rev-parse",`${landing.commit}^{tree}`]) !== landing.tree ||
  !operationDestinationContains(root,landing.expectedRevision,landing.commit))refuse("QUALIFIED_DELIVERY_OUTPUT_CHANGED");
 const actual=parseNativeRawDiff(git(root,["diff","--raw","-z","--no-abbrev","--no-renames",landing.expectedRevision,landing.commit,"--"]));
 const scope=request.authority.frozenAuthority.preparation.fence;
 const domains=scope.paths.filter((/** @type {any} */ p)=>landing.roles.includes(p.role)).map((/** @type {any} */ p)=>p.domain);
 if(landing.roles.includes("records"))domains.push(request.authority.frozenAuthority.preparation.card.path);
 const excluded=scope.excluded.filter((/** @type {any} */ p)=>p.filesystemRoot === root).map((/** @type {any} */ p)=>p.domain);
 if(actual.length !== landing.writes.length)refuse("QUALIFIED_DELIVERY_WRITE_SET");
 for(const change of actual){
  if(change.paths.some((/** @type {string} */ file)=>!nativePathAllowed(file,domains) || nativePathAllowed(file,excluded)))refuse("QUALIFIED_DELIVERY_OUTSIDE_SCOPE");
  const w=landing.writes.find((/** @type {any} */ w)=>w.path === change.newPath);
  if(!w || change.newMode === "000000" && w.operation !== "delete" || change.newMode !== "000000" &&
   (w.operation !== "write" || w.mode !== change.newMode || git(root,["cat-file","blob",/** @type {string} */(change.newObject)]).toString("base64") !== w.base64))refuse("QUALIFIED_DELIVERY_WRITE_SET");
 }
}
/** A correlation witness is mandatory; reachability alone never attributes a
 * separately accepted output to this operation. First observation also proves
 * the original destination contains that exact accepted output.
 * @param {any} rec @param {any} landing @param {any} progress */
function observed(rec,landing,progress){
 if(!same(captureOperationRepository(landing.repository.root,landing.expectedRevision,{forEffect:false}),landing.repository))refuse("QUALIFIED_DELIVERY_ORIGIN_CHANGED");
 validateOutput(rec.operation.request,landing);
 const witness=readOperationRef(landing.repository.root,progress.intent.correlationRef),tip=readOperationRef(landing.repository.root,landing.ref);
 if(witness !== null && witness !== landing.commit)refuse("QUALIFIED_DELIVERY_CORRELATION_FOREIGN");
 if(witness === landing.commit){if(progress.acceptance !== null)return true;if(tip !== null && operationDestinationContains(landing.repository.root,landing.commit,tip))return true;refuse("QUALIFIED_DELIVERY_ACCEPTANCE_UNCERTAIN");}
 if(progress.acceptance !== null || tip !== landing.expectedRevision)refuse("QUALIFIED_DELIVERY_ACCEPTANCE_UNCERTAIN");return false;
}
/** @param {any} rec */
function localReceipt(rec){return {status:"local-integrated",operationId:rec.operation.id,taskId:rec.operation.request.authority.taskId,
 authorityDigest:rec.operation.request.authority.authorityDigest,requestDigest:rec.operation.digest,landings:rec.operation.localAcceptance,
 publication:rec.operation.request.route.publicationOwed?"pending":"not-owed",ci:rec.operation.request.route.publicationOwed?"pending":"not-owed",recordsCompletion:"pending"};}
/** Original acceptance can retire only its exact dead lock; failures are a
 * warning separate from the authoritative original local integration receipt.
 * @param {string} root @param {any} rec */
function cleanupAcceptedLocks(root,rec){
 const warnings=[];
 for(const l of rec.operation.request.landings){const p=rec.operation.progress.find((/** @type {any} */ p)=>p.key === l.key);if(p.acceptance === null)continue;
  try{releaseDeadExactWriteLock(l.working.index.path,rec.operation.id,l.working.index.lockToken,()=>observed(rec,l,p));}
  catch{warnings.push({root:l.repository.root,code:"QUALIFIED_DELIVERY_ACCEPTED_LOCK_UNAVAILABLE"});}
 }
 return warnings;
}
/** Immutable collection links are rechecked for missing work without rescanning
 * worker directories or replacing frozen scope with a mutable current card.
 * @param {string} root @param {any} request */
function retainedAuthority(root,request){
 for(const role of ["executor","verifier"]){const old=request.authority[role],rec=/** @type {any} */(runs.readRecord(root,old.attempt)),q=rec.native?.qualified;
  if(rec.state !== "finished" || q?.collection?.phase !== "final" || rec.assignmentDigest !== old.assignmentDigest || rec.permission?.digest !== old.permissionDigest ||
   q.collection.resultDigest !== old.collectionDigest || !same(q.collection.candidates,old.candidates))refuse("QUALIFIED_DELIVERY_SOURCE_CHANGED");
  collectQualifiedNativeRun(root,rec,{ref:JSON.stringify(q.collection.candidates)});
  if(role === "executor" && (!same(q.reservation.scope,request.authority.frozenAuthority.scope) || !same(q.origins.receipt,request.authority.frozenAuthority.receipt)) ||
   role === "verifier" && (!same(q.verification.authority,request.authority.frozenAuthority.preparation) || !same(q.collection.review,request.authority.frozenAuthority.review)))refuse("QUALIFIED_DELIVERY_SOURCE_CHANGED");
 }
}
/** Every new visible effect reuses current canonical protected policy and the
 * original binding/physical identities, plus the exact held operation row.
 * @param {string} root @param {any} rec @param {any} landing @param {any} configuration */
function effectPolicy(root,rec,landing,configuration){
 assertQualifiedDeliveryContinuation(root,rec,configuration);
 if(!same(effectRepository(landing.repository.root,landing.expectedRevision,rec.operation.request,configuration),landing.repository) || readOperationRef(landing.repository.root,landing.ref) !== landing.expectedRevision ||
  line(landing.repository.root,["symbolic-ref","HEAD"]) !== landing.ref)refuse("QUALIFIED_DELIVERY_DESTINATION_CHANGED");
 const witness=rec.operation.progress.find((/** @type {any} */ p)=>p.key === landing.key).intent.correlationRef;
 if(readOperationRef(landing.repository.root,witness) !== null)refuse("QUALIFIED_DELIVERY_CORRELATION_FOREIGN");
 assertExactRecordTransformations(landing.repository.root,landing.writes.map((/** @type {any} */ w)=>w.path));
 assertExactRecordTransformations(landing.repository.root,landing.writes.map((/** @type {any} */ w)=>w.path),landing.commit);
 validateOutput(rec.operation.request,landing);return true;
}
/** Current canonical policy for a later effect of this exact stored operation.
 * This grants no target/write selection; each phase must check its own frozen
 * expected transition. No caller-supplied authority or pending exemption exists.
 * @param {string} root @param {any} rec @param {any} [configuration] @param {any} [childProof] */
export function assertQualifiedDeliveryContinuation(root,rec,configuration,childProof=null){
 return continuation(root,rec,configuration,()=>qualifiedDeliveryPhasePolicy(root,rec.operation.request.policySource,rec,childProof));
}
/** Read-only exact current policy before durable owner recovery. This grants
 * no effect or takeover: the canonical admission reader independently requires
 * the actual stored row, claims and a same-process or proven-dead predecessor.
 * @param {string} root @param {any} rec @param {any} [configuration] */
export function assertQualifiedDeliveryRecovery(root,rec,configuration){
 return continuation(root,rec,configuration,()=>qualifiedDeliveryRecoveryPolicy(root,rec.operation.request.policySource,rec));
}
/** @param {string} root @param {any} rec @param {any} configuration @param {()=>any} currentPolicy */
function continuation(root,rec,configuration,currentPolicy){
 const stored=readAcceptedOperation(root,rec.operation.id);
 if(stored?.operation.kind !== "qualified-delivery" || !same(stored,rec))refuse("QUALIFIED_DELIVERY_CHANGED");
 const req=rec.operation.request;
 if(!same(effectRepository(root,req.authority.roles.find((/** @type {any} */ r)=>r.role === "product").originalBase,req,configuration),req.coordinator) ||
  !same(directory(req.docsDirectory.path),req.docsDirectory) || !same(directory(req.runtimeDirectory.path),req.runtimeDirectory))refuse("QUALIFIED_DELIVERY_ORIGIN_CHANGED");
 const scope=req.authority.frozenAuthority.scope,captured=captureQualifiedInputs({...scope,authorityRoot:root,taskId:req.authority.taskId,legacyTokenMap:scope.receipt.legacyTokenMap});
 if(!same(captured.receipt,req.authority.frozenAuthority.receipt) || !same(captured.fence,scope.fence))refuse("QUALIFIED_DELIVERY_CONTEXT_CHANGED");
 const card=safeOperationWorkingPath(captured.receipt.recordsRoot,req.authority.frozenAuthority.preparation.card.path);
 if(!runs.qualifiedProtocolDrift(req.authority.frozenAuthority.preparation.card.text,new TextDecoder("utf-8",{fatal:true}).decode(readFileSync(card))))refuse("QUALIFIED_DELIVERY_CONTRACT_CHANGED");
 retainedAuthority(root,req);currentPolicy();
 return true;
}
/** Full-route capture alone may redeem the actual opaque fixed hook proof.
 * The generic and local-only paths keep their strict hook audit unchanged.
 * @param {string} root @param {string} base @param {any} request @param {any} configuration */
function effectRepository(root,base,request,configuration){
 if(request.route.name!=="protected-atomic-push-v1"||root!==request.coordinator.root)return captureOperationRepository(root,base);
 if(!configuration||Object.keys(configuration).join(",")!=="tool")refuse("QUALIFIED_PUBLICATION_CONFIGURATION_REQUIRED");
 const proof=qualifyFrozenPublicationLocalContext(request.coordinator.root,request.route.publication,request.authority,configuration);
 return captureQualifiedOperationRepository(root,base,proof);
}
/** @param {any} input */
function inputShape(input){if(!shape(input,["operationId","executorAttempt","verifierAttempt","targets"]) ||
 typeof input.operationId !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(input.operationId) || !shape(input.targets,["product","records"]) ||
 ["product","records"].some(r=>!shape(input.targets[r],["ref","expectedRevision"]) || typeof input.targets[r].ref !== "string" || !/^refs\/heads\/[^\s]+$/.test(input.targets[r].ref) || !/^[0-9a-f]{40}$/.test(input.targets[r].expectedRevision)))refuse("QUALIFIED_DELIVERY_REQUEST");}
/** Capture only the actual retained policy source. This does not establish
 * finalized collection, a grade or permission to integrate; the delivery
 * authority and current phase policy still independently establish those.
 * @param {string} root @param {string} attempt @param {{tool:any}} [configuration] */
export async function captureQualifiedDeliveryPolicySource(root,attempt,configuration){
 const source=/** @type {any} */(runs.readRecord(root,attempt)),origins=source.native?.qualified?.origins;
 if(!origins?.receipt)refuse("QUALIFIED_DELIVERY_POLICY_SOURCE");
 let configured=null;
 if(Object.hasOwn(origins,"configuredDispatch")){
  if(!shape(configuration,["tool"]))refuse("QUALIFIED_DELIVERY_CONFIGURED_POLICY_REQUIRED");
  const {captureConfiguredDispatchForRun}=await import("./configured-dispatch.mjs");
  const retained=await captureConfiguredDispatchForRun(root,attempt,configuration);
  if(retained.source.attempt!==source.attempt||retained.source.permissionDigest!==source.permission?.digest||
   retained.source.capsuleDigest!==origins.configuredDispatch.digest||!same(retained.handle.capsule,origins.configuredDispatch))refuse("QUALIFIED_DELIVERY_POLICY_SOURCE_CHANGED");
  configured=retained.handle.capsule;
 }
 const projected={attempt:source.attempt,assignment:source.assignment,resource:source.resource,reservation:source.reservation,
  native:{qualified:{origins:{receipt:origins.receipt,...(configured===null?{}:{configuredDispatch:configured})}}},...(configured===null?{}:{permission:{digest:source.permission.digest}})};
 if(!validQualifiedDeliveryPolicySource(projected,{attempt:source.attempt,assignmentDigest:source.assignmentDigest,permissionDigest:source.permission?.digest,taskId:source.assignment.id,receipt:origins.receipt})||
  !same(runs.readRecord(root,attempt),source))refuse("QUALIFIED_DELIVERY_POLICY_SOURCE_CHANGED");
 return freeze(operationPayload(projected));
}
/** First qualification is asynchronous and entirely read-only/scratch-only.
 * No caller may supply an accepted flag, authority object or grade.
 * @param {string} coordinatorRoot @param {any} input @param {{onBoundary?:(boundary:string,record:any)=>void}} [diagnostics] */
export async function executeQualifiedLocalDelivery(coordinatorRoot,input,diagnostics={}){
 return startDelivery(coordinatorRoot,input,diagnostics);
}
/** Freeze the selected full publication route in the original operation before
 * its local stage. Output remains local-integrated/publication-pending; no push.
 * @param {string} coordinatorRoot @param {any} input @param {{tool:any}} configuration
 * @param {{onBoundary?:(boundary:string,record:any)=>void}} [diagnostics] */
export async function executeQualifiedPublicationLocalDelivery(coordinatorRoot,input,configuration,diagnostics={}){
 if(!configuration||Object.keys(configuration).join(",")!=="tool")refuse("QUALIFIED_PUBLICATION_CONFIGURATION_REQUIRED");
 return startDelivery(coordinatorRoot,input,diagnostics,configuration);
}
/** @param {string} coordinatorRoot @param {any} input @param {any} diagnostics @param {any} [configuration] */
async function startDelivery(coordinatorRoot,input,diagnostics,configuration){
 try{input=freeze(operationPayload(input));}catch{refuse("QUALIFIED_DELIVERY_REQUEST");}
 inputShape(input);coordinatorRoot=realpathSync(coordinatorRoot);checkOperationEnvironment();
 const prior=readAcceptedOperation(coordinatorRoot,input.operationId);
 if(prior !== null){
  if(prior.operation.kind !== "qualified-delivery" || prior.operation.request.authority.executor.attempt !== input.executorAttempt || prior.operation.request.authority.verifier.attempt !== input.verifierAttempt ||
   !same(input.targets,prior.operation.request.targets))refuse("QUALIFIED_DELIVERY_CHANGED");
  return configuration===undefined?replayQualifiedLocalDelivery(coordinatorRoot,input.operationId,diagnostics):replayQualifiedPublicationLocalDelivery(coordinatorRoot,input.operationId,configuration,diagnostics);
 }
 const authority=await captureQualifiedDeliveryAuthority(coordinatorRoot,{executorAttempt:input.executorAttempt,verifierAttempt:input.verifierAttempt});
 if(authority.owedCorrections.length || authority.roles.some((/** @type {any} */ r)=>r.actualOutputGrades.some((/** @type {any} */ g)=>g.exit !== 0)))refuse("QUALIFIED_DELIVERY_CORRECTIONS_PENDING");
 await loadQualifiedDeliveryPolicy();
 const policySource=await captureQualifiedDeliveryPolicySource(coordinatorRoot,authority.verifier.attempt,configuration);
 if(!validQualifiedDeliveryPolicySource(policySource,{...authority.verifier,taskId:authority.taskId,receipt:authority.frozenAuthority.receipt}))refuse("QUALIFIED_DELIVERY_POLICY_SOURCE_CHANGED");
 qualifiedDeliveryPhasePolicy(coordinatorRoot,policySource);
 const product=authority.roles.find((/** @type {any} */ r)=>r.role === "product"),landings=[];
 const full=configuration!==undefined&&product.actualOutput.implementation.length>0;
 if(full){const records=authority.roles.find((/** @type {any} */ r)=>r.role==="records"),a=captureOperationRepository(records.repository.filesystemRoot,records.originalBase,{forEffect:false}),b=captureOperationRepository(coordinatorRoot,product.originalBase,{forEffect:false});
  const ac=a.identities.find(i=>i.path===a.commonDir),bc=b.identities.find(i=>i.path===b.commonDir),ao=a.identities.find(i=>i.path===path.join(a.commonDir,"objects")),bo=b.identities.find(i=>i.path===path.join(b.commonDir,"objects"));
  if(a.root===b.root||a.commonDir===b.commonDir||!ac||!bc||!ao||!bo||ac.device===bc.device&&ac.inode===bc.inode||ao.device===bo.device&&ao.inode===bo.inode)refuse("QUALIFIED_PUBLICATION_SEPARATE_RECORDS_REQUIRED");
 }
 const publication=full?captureQualifiedPublicationContext(coordinatorRoot,input.operationId,authority,configuration):null;
 for(const r of authority.roles){if(input.targets[r.role].expectedRevision !== r.originalBase)refuse("QUALIFIED_DELIVERY_DESTINATION_UNSUPPORTED");git(coordinatorRoot,["check-ref-format",input.targets[r.role].ref]);}
 for(const physical of authority.physicalLandings){
  const roles=[...physical.roles].sort(),members=roles.map(r=>authority.roles.find((/** @type {any} */ value)=>value.role === r));
  if(members.every(r=>r.actualOutput.commit === r.originalBase))continue;
  const member=members[0],target=input.targets[roles[0]];
  if(members.some(r=>r.originalBase !== member.originalBase || r.actualOutput.commit !== member.actualOutput.commit ||
   !same(input.targets[r.role],target)) || target.expectedRevision !== member.originalBase)refuse("QUALIFIED_DELIVERY_DESTINATION_UNSUPPORTED");
  const repository=publication!==null&&physical.root===coordinatorRoot?captureQualifiedOperationRepository(physical.root,member.originalBase,qualifiedPublicationContextProof(publication)):captureOperationRepository(physical.root,member.originalBase);
  if(readOperationRef(physical.root,`refs/supertaskr/deliveries/${operationWork(input.operationId).slice(3)}/${roles.join("-")}`) !== null)refuse("QUALIFIED_DELIVERY_CORRELATION_FOREIGN");
  if(readOperationRef(physical.root,target.ref) !== member.originalBase || line(physical.root,["symbolic-ref","HEAD"]) !== target.ref)refuse("QUALIFIED_DELIVERY_STALE_DESTINATION");
  const changes=parseNativeRawDiff(git(physical.root,["diff","--raw","-z","--no-abbrev","--no-renames",member.originalBase,member.actualOutput.commit,"--"]));
  const writes=changes.map(change=>{
   if(!["000000","100644","100755"].includes(/** @type {string} */(change.oldMode)) || !["000000","100644","100755"].includes(/** @type {string} */(change.newMode)))refuse("QUALIFIED_DELIVERY_FILE_TYPE_UNSUPPORTED");
   safeOperationWorkingPath(physical.root,change.newPath);
   return change.newMode === "000000"?{path:change.newPath,operation:"delete"}:{path:change.newPath,operation:"write",mode:change.newMode,base64:git(physical.root,["cat-file","blob",/** @type {string} */(change.newObject)]).toString("base64")};
  }).sort((a,b)=>a.path<b.path?-1:1);
  assertExactRecordTransformations(physical.root,writes.map(w=>w.path));assertExactRecordTransformations(physical.root,writes.map(w=>w.path),member.actualOutput.commit);
  const plan=captureExactWritePlan(physical.root,member.originalBase,writes);
  if(plan.tree !== member.actualOutput.tree)refuse("QUALIFIED_DELIVERY_TREE_CHANGED");
  landings.push({key:roles.join("-"),roles,repository,expectedRevision:member.originalBase,ref:target.ref,commit:member.actualOutput.commit,tree:plan.tree,writes,working:plan.working});
 }
 const coordinator=publication!==null?captureQualifiedOperationRepository(coordinatorRoot,product.originalBase,qualifiedPublicationContextProof(publication)):captureOperationRepository(coordinatorRoot,product.originalBase);
 const request=freeze(operationPayload({version:1,operationId:input.operationId,kind:"qualified-delivery",coordinator,
  docsDirectory:directory(path.join(authority.frozenAuthority.receipt.recordsRoot,"docs")),runtimeDirectory:directory(path.join(coordinatorRoot,".supertaskr")),authority,policySource,targets:input.targets,
  route:{name:publication===null?"local-exact-output-v1":"protected-atomic-push-v1",publicationOwed:product.actualOutput.implementation.length>0,completionOwed:true,policyRevision:product.actualOutput.commit,...(publication===null?{}:{publication})},landings}));
 if(!validQualifiedDeliveryRequest(request))refuse("QUALIFIED_DELIVERY_REQUEST");
 return executeCaptured(coordinatorRoot,request,diagnostics,configuration);
}
/** @param {string} root @param {any} request @param {any} diagnostics @param {any} [configuration] */
function executeCaptured(root,request,diagnostics,configuration){
 if(!shape(diagnostics,diagnostics.onBoundary === undefined?[]:["onBoundary"]) || diagnostics.onBoundary !== undefined && typeof diagnostics.onBoundary !== "function")refuse("QUALIFIED_DELIVERY_DIAGNOSTICS");
 const key=`${root}\0${request.operationId}`;if(active.has(key))refuse("QUALIFIED_DELIVERY_OWNER_LIVE");active.add(key);
 try{return withNativeTransaction(root,{operation:"qualified-delivery-local"},()=>{
  let rec=readAcceptedOperation(root,request.operationId);
  if(rec && (rec.operation.kind !== "qualified-delivery" || rec.operation.digest !== operationDigest(request)))refuse("QUALIFIED_DELIVERY_CHANGED");
  const io=runs.defaultRunIo(),identity=io.identity(process.pid);if(identity === null)refuse("QUALIFIED_DELIVERY_OWNER_UNKNOWN");
  if(rec){
   const proofs=request.landings.map((/** @type {any} */ l)=>observed(rec,l,rec.operation.progress.find((/** @type {any} */ p)=>p.key === l.key)));
   if(rec.operation.localAcceptance !== null){if(!proofs.every(Boolean))refuse("QUALIFIED_DELIVERY_ACCEPTANCE_UNCERTAIN");const warnings=cleanupAcceptedLocks(root,rec);return {...localReceipt(rec),...(warnings.length?{cleanupWarnings:warnings}:{})};}
   if(rec.operation.owner.pid !== process.pid && operationOwnerAlive(rec.operation.owner,io))refuse("QUALIFIED_DELIVERY_OWNER_LIVE");
   for(let at=0;at<request.landings.length;at++){const l=request.landings[at],p=rec.operation.progress.find((/** @type {any} */ p)=>p.key === l.key);
    if(proofs[at] && p.acceptance === null){p.acceptance={...p.intent,attribution:"exact"};p.phase="accepted";persist(root,rec);}
   }
   if(rec.operation.progress.every((/** @type {any} */ p)=>p.acceptance !== null)){
    if(rec.operation.localAcceptance === null){rec.operation.localAcceptance=rec.operation.progress.map((/** @type {any} */ p)=>({key:p.key,...p.acceptance}));rec.state="unknown";rec.events.push({at:new Date().toISOString(),op:"local-integrated"});persist(root,rec);}
    const warnings=cleanupAcceptedLocks(root,rec);return {...localReceipt(rec),...(warnings.length?{cleanupWarnings:warnings}:{})};
   }
  }
  const at=new Date().toISOString();
  if(!rec){
   const work=operationWork(request.operationId),assignment={kind:"operation",id:work,role:"qualified-delivery",resource:request.landings[0].repository.root};
   rec={version:1,recordKind:"operation",attempt:`${work}-a1`,state:"starting",assignment,assignmentDigest:runs.sha256(JSON.stringify(assignment)),writer:true,resource:assignment.resource,
    reservation:{file:null,takenAt:at,releasedAt:null},execution:null,admission:null,operation:{version:1,id:request.operationId,kind:"qualified-delivery",request,digest:operationDigest(request),owner:{pid:process.pid,identity,token:randomUUID()},createdAt:at,claims:[],
     progress:request.landings.map((/** @type {any} */ l)=>({key:l.key,phase:"captured",intent:{ref:l.ref,previousRevision:l.expectedRevision,commit:l.commit,tree:l.tree,correlationRef:`refs/supertaskr/deliveries/${work.slice(3)}/${l.key}`},acceptance:null})),localAcceptance:null},events:[{at,op:"capture-before-effects"}]};
   const acquired=[];
   const recordDirectory=path.dirname(acceptedOperationPath(root,request.operationId)),directoryWasAbsent=!existsSync(recordDirectory);
   try{
    for(const l of request.landings){runs.assertOperationOwnership(root,{resource:l.repository.root,attempt:rec.attempt});if(runs.readReservation(root,l.repository.root) !== null)refuse("QUALIFIED_DELIVERY_RESOURCE_RESERVED");
     const claim=runs.takeReservation(root,{resource:l.repository.root,attempt:rec.attempt,role:"qualified-delivery",at});acquired.push(l.repository.root);
     rec.operation.claims.push({key:l.key,resource:l.repository.root,file:claim.file,takenAt:at,releasedAt:null});if(rec.reservation.file === null)rec.reservation.file=claim.file;
    }
    persist(root,rec);
   }catch(error){if(!existsSync(acceptedOperationPath(root,request.operationId))){
    for(const resource of acquired)if(runs.readReservation(root,resource)?.attempt === rec.attempt)runs.releaseReservation(root,{resource,attempt:rec.attempt});
    if(directoryWasAbsent && existsSync(recordDirectory) && lstatSync(recordDirectory).isDirectory() && !lstatSync(recordDirectory).isSymbolicLink() && readdirSync(recordDirectory).length === 0){rmdirSync(recordDirectory);syncNativeFileNamespace(recordDirectory);}
   }throw error;}
  }else{
   rec.operation.request=freeze(rec.operation.request);
   for(const c of rec.operation.claims)if(runs.readReservation(root,c.resource)?.attempt !== rec.attempt)refuse("QUALIFIED_DELIVERY_OWNERSHIP");
   rec.operation.owner={pid:process.pid,identity,token:randomUUID()};persist(root,rec);
  }
  diagnostics.onBoundary?.("captured",structuredClone(rec));
  for(const landing of request.landings){const p=rec.operation.progress.find((/** @type {any} */ p)=>p.key === landing.key);if(p.acceptance !== null)continue;
   effectPolicy(root,rec,landing,configuration);p.phase="working-start";rec.state="unknown";persist(root,rec);diagnostics.onBoundary?.(`${landing.key}:working-start`,structuredClone(rec));
   let release;
   try{
    release=materializeExactWrites(root,{writes:landing.writes,...landing.working},{operationId:request.operationId,request:{repository:landing.repository}},()=>effectPolicy(root,rec,landing,configuration),
     (boundary)=>diagnostics.onBoundary?.(`${landing.key}:${boundary}`,structuredClone(rec)));
    p.phase="working-prepared";persist(root,rec);diagnostics.onBoundary?.(`${landing.key}:working-prepared`,structuredClone(rec));
    effectPolicy(root,rec,landing,configuration);acceptOperationRef(landing.repository.root,p.intent);diagnostics.onBoundary?.(`${landing.key}:ref-accepted`,structuredClone(rec));
    if(!observed(rec,landing,p))refuse("QUALIFIED_DELIVERY_ACCEPTANCE_UNCERTAIN");p.acceptance={...p.intent,attribution:"exact"};p.phase="accepted";persist(root,rec);
   }finally{release?.();}
  }
  rec.operation.localAcceptance=rec.operation.progress.map((/** @type {any} */ p)=>({key:p.key,...p.acceptance}));rec.events.push({at:new Date().toISOString(),op:"local-integrated"});persist(root,rec);
  diagnostics.onBoundary?.("local-integrated",structuredClone(rec));const warnings=cleanupAcceptedLocks(root,rec);return {...localReceipt(rec),...(warnings.length?{cleanupWarnings:warnings}:{})};
 });}finally{active.delete(key);}
}
/** Original acceptance is checked before current policy/worker paths. Only
 * missing effects load current protected policy and retain the original capture.
 * @param {string} coordinatorRoot @param {string} operationId @param {{onBoundary?:(boundary:string,record:any)=>void}} [diagnostics] */
export async function replayQualifiedLocalDelivery(coordinatorRoot,operationId,diagnostics={}){
 if(typeof operationId !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(operationId))refuse("QUALIFIED_DELIVERY_REQUEST");
 coordinatorRoot=realpathSync(coordinatorRoot);const rec=readAcceptedOperation(coordinatorRoot,operationId);
 if(rec?.operation.kind !== "qualified-delivery" || rec.operation.request.coordinator.root !== coordinatorRoot)refuse("QUALIFIED_DELIVERY_ABSENT");
 const complete=rec.operation.request.landings.every((/** @type {any} */ l)=>observed(rec,l,rec.operation.progress.find((/** @type {any} */ p)=>p.key === l.key)));
 if(!complete&&rec.operation.request.route.name==="protected-atomic-push-v1")refuse("QUALIFIED_PUBLICATION_CONFIGURATION_REQUIRED");
 if(!complete)await loadQualifiedDeliveryPolicy();
 return executeCaptured(coordinatorRoot,freeze(rec.operation.request),diagnostics);
}
/** Original full-route local evidence precedes current TOOL. Existing legacy
 * product-owed local rows never acquire a new mutable route.
 * @param {string} coordinatorRoot @param {string} operationId @param {{tool:any}|undefined} [configuration]
 * @param {{onBoundary?:(boundary:string,record:any)=>void}} [diagnostics] */
export async function replayQualifiedPublicationLocalDelivery(coordinatorRoot,operationId,configuration,diagnostics={}){
 if(typeof operationId!=="string"||!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(operationId))refuse("QUALIFIED_DELIVERY_REQUEST");
 coordinatorRoot=realpathSync(coordinatorRoot);const rec=readAcceptedOperation(coordinatorRoot,operationId);
 if(rec?.operation.kind!=="qualified-delivery"||rec.operation.request.coordinator.root!==coordinatorRoot)refuse("QUALIFIED_DELIVERY_ABSENT");
 if(rec.operation.request.route.name!=="protected-atomic-push-v1"){
  if(rec.operation.request.route.publicationOwed)refuse("QUALIFIED_PUBLICATION_ROUTE_UNFROZEN");
  return replayQualifiedLocalDelivery(coordinatorRoot,operationId,diagnostics);
 }
 const complete=rec.operation.request.landings.every((/** @type {any} */ l)=>observed(rec,l,rec.operation.progress.find((/** @type {any} */ p)=>p.key===l.key)));
 if(!complete){if(!configuration||Object.keys(configuration).join(",")!=="tool")refuse("QUALIFIED_PUBLICATION_CONFIGURATION_REQUIRED");await loadQualifiedDeliveryPolicy();}
 return executeCaptured(coordinatorRoot,freeze(rec.operation.request),diagnostics,configuration);
}
/** Read only original local effects for publication/completion planning. No
 * missing effect, progress write, claim release or lock cleanup is performed.
 * @param {string} coordinatorRoot @param {string} operationId */
export function observeQualifiedLocalDelivery(coordinatorRoot,operationId){
 if(typeof operationId !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(operationId))refuse("QUALIFIED_DELIVERY_REQUEST");
 coordinatorRoot=realpathSync(coordinatorRoot);const rec=readAcceptedOperation(coordinatorRoot,operationId);
 if(rec === null)return null;
 if(rec.operation.kind !== "qualified-delivery" || rec.operation.request.coordinator.root !== coordinatorRoot)refuse("QUALIFIED_DELIVERY_ABSENT");
 const actual=[];
 for(const l of rec.operation.request.landings){const p=rec.operation.progress.find((/** @type {any} */ p)=>p.key === l.key);
  if(observed(rec,l,p))actual.push({key:p.key,...p.intent,attribution:"exact"});
 }
 const complete=actual.length === rec.operation.request.landings.length;
 if(rec.operation.localAcceptance !== null && !complete)refuse("QUALIFIED_DELIVERY_ACCEPTANCE_UNCERTAIN");
 if(complete){for(const p of rec.operation.progress){p.acceptance={...p.intent,attribution:"exact"};p.phase="accepted";}rec.operation.localAcceptance=actual;}
 return freeze({status:complete?"local-integrated":"pending",record:rec,observed:actual,receipt:complete?localReceipt(rec):null});
}
