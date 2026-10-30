/** Same-operation protected private completion. A product-owed route requires
 * its original accepted publication and exact CI proofs before new effects. */
import {execFileSync} from "node:child_process";
import {randomUUID} from "node:crypto";
import {lstatSync,readFileSync,realpathSync} from "node:fs";
import * as runs from "./run-record.mjs";
import {atomicJson,parseNativeRawDiff,withNativeTransaction} from "./native-codex.mjs";
import {operationContent,operationDigest,operationPayload,operationWork,validOperationRecord} from "./operation-record.mjs";
import {acceptedOperationPath,captureOperationRepository,operationOwnerAlive,readAcceptedOperation} from "./durable-operation.mjs";
import {readOperationRef,operationDestinationContains,acceptOperationRef} from "./operation-ref.mjs";
import {loadQualifiedDeliveryPolicy} from "./qualified-admission.mjs";
import {observeQualifiedLocalDelivery,assertQualifiedDeliveryContinuation,assertQualifiedDeliveryRecovery} from "./qualified-delivery-operation.mjs";
import {captureQualifiedCompletionProposal,qualifiedCompletionWriteSet,QualifiedCompletionFinding} from "./qualified-delivery-completion.mjs";
import {qualifiedCompletionDeliveryFacts} from "./qualified-completion-record.mjs";
import {requireInstalledRuntimeAssets,verifyInstalledRecordTool} from "./records-check.mjs";
import {loadProjectSettings} from "./project-settings.mjs";
import {assertExactRecordTransformations,prepareExactWriteTree,materializeExactWrites,releaseDeadExactWriteLock,
 safeOperationWorkingPath,snapshotRecordFile,intendedRecordFile} from "./record-write.mjs";
const active=new Set();
/** @param {string} code @returns {never} */
function refuse(code){throw new QualifiedCompletionFinding(code);}
/** @param {any} a @param {any} b */
const same=(a,b)=>operationContent(a)===operationContent(b);
/** @param {any} v @returns {any} */
function freeze(v){if(v&&typeof v==="object"){Object.values(v).forEach(freeze);Object.freeze(v);}return v;}
/** @param {string} root @param {string[]} args @param {Buffer|undefined} [input] */
function git(root,args,input){try{return execFileSync("git",["--no-replace-objects","-C",root,...args],{stdio:[input===undefined?"ignore":"pipe","pipe","pipe"],
 ...(input===undefined?{}:{input}),maxBuffer:32*1024*1024,env:{...process.env,GIT_NO_LAZY_FETCH:"1",GIT_OPTIONAL_LOCKS:"0"}});}catch{refuse("QUALIFIED_COMPLETION_GIT");}}
/** @param {string} root @param {any} rec */
function persist(root,rec){if(!validOperationRecord(rec))refuse("QUALIFIED_COMPLETION_RECORD");atomicJson(acceptedOperationPath(root,rec.operation.id),rec);}
/** @param {any} rec */
function validateCommit(rec){
 const c=rec.operation.completion,p=c.plan,root=p.repository.root;
 if(!git(root,["cat-file","commit",p.commit]).equals(Buffer.from(p.commitBase64,"base64"))||git(root,["rev-parse",`${p.commit}^{tree}`]).toString("ascii").replace(/\n$/,"")!==p.tree)refuse("QUALIFIED_COMPLETION_COMMIT_CHANGED");
 const changes=parseNativeRawDiff(git(root,["diff","--raw","-z","--no-abbrev","--no-renames",p.expectedRevision,p.commit,"--"]));
 if(changes.length!==p.writes.length)refuse("QUALIFIED_COMPLETION_WRITE_SET");
 for(const change of changes){const w=p.writes.find((/** @type {any} */ w)=>w.path===change.newPath);
  if(!w||w.operation!=="write"||w.mode!==change.newMode||git(root,["cat-file","blob",/** @type {string} */(change.newObject)]).toString("base64")!==w.base64)refuse("QUALIFIED_COMPLETION_WRITE_SET");
 }
}
/** Exact correlation is mandatory. First observation requires the original
 * target to contain the exact completion; retained acceptance is historical.
 * @param {any} rec */
function observed(rec){
 const c=rec.operation.completion;if(c===undefined)return false;const p=c.plan,root=p.repository.root;
 if(!same(captureOperationRepository(root,p.expectedRevision,{forEffect:false}),p.repository))refuse("QUALIFIED_COMPLETION_ORIGIN_CHANGED");
 const d=lstatSync(rec.operation.request.docsDirectory.path,{bigint:true}),old=rec.operation.request.docsDirectory;
 if(!d.isDirectory()||d.isSymbolicLink()||String(d.dev)!==old.device||String(d.ino)!==old.inode)refuse("QUALIFIED_COMPLETION_ORIGIN_CHANGED");
 const witness=readOperationRef(root,c.intent.correlationRef);
 if(witness!==null&&witness!==p.commit)refuse("QUALIFIED_COMPLETION_CORRELATION_FOREIGN");
 if(witness===p.commit){validateCommit(rec);if(c.acceptance!==null)return true;
  const tip=readOperationRef(root,p.targetRef);if(tip!==null&&operationDestinationContains(root,p.commit,tip))return true;refuse("QUALIFIED_COMPLETION_ACCEPTANCE_UNCERTAIN");
 }
 if(c.acceptance!==null||readOperationRef(root,p.targetRef)!==p.expectedRevision)refuse("QUALIFIED_COMPLETION_ACCEPTANCE_UNCERTAIN");return false;
}
/** @param {any} rec */
function receipt(rec){const c=rec.operation.completion,p=c.plan;return freeze({status:"records-completed",operationId:rec.operation.id,taskId:rec.operation.request.authority.taskId,
 authorityDigest:rec.operation.request.authority.authorityDigest,requestDigest:rec.operation.digest,completionDigest:c.digest,...c.acceptance,
 receiptPath:p.receiptPath,publication:p.receipt.publication,ci:p.receipt.ci,validation:p.validation});}
/** @param {string} root @param {any} rec */
function cleanup(root,rec){const c=rec.operation.completion;try{return releaseDeadExactWriteLock(c.plan.index.path,rec.operation.id,c.plan.index.lockToken,()=>observed(rec));}
 catch{return {status:"unavailable",code:"QUALIFIED_COMPLETION_ACCEPTED_LOCK_UNAVAILABLE"};}}
/** Accepted work needs only exact observation/owned bookkeeping, no successor
 * TOOL/config/grant or worker directory. Foreign claims are never released.
 * @param {string} root @param {any} rec @param {any} diagnostics */
function finish(root,rec,diagnostics){
 if(!observed(rec))refuse("QUALIFIED_COMPLETION_ACCEPTANCE_UNCERTAIN");
 if(rec.state!=="finished"){
  const c=rec.operation.completion;c.acceptance={...c.intent,attribution:"exact"};c.phase="accepted";rec.state="unknown";persist(root,rec);
  diagnostics.onBoundary?.("completion:accepted",structuredClone(rec));
  for(const claim of rec.operation.claims){const held=runs.readReservation(root,claim.resource);
   if(held!==null&&held.attempt!==rec.attempt)refuse("QUALIFIED_COMPLETION_OWNERSHIP");
   if(held!==null)runs.releaseReservation(root,{resource:claim.resource,attempt:rec.attempt});
   if(claim.releasedAt===null){claim.releasedAt=new Date().toISOString();if(rec.reservation.file===claim.file)rec.reservation.releasedAt=claim.releasedAt;}
  }
  rec.state="finished";rec.events.push({at:new Date().toISOString(),op:"records-completed"});persist(root,rec);diagnostics.onBoundary?.("completion:finished",structuredClone(rec));
 }
 const clean=cleanup(root,rec);return {...receipt(rec),...("code" in clean?{cleanupWarning:clean.code}:{})};
}
/** @param {string} root @param {any} rec @param {any} tool */
function policy(root,rec,tool){
 assertQualifiedDeliveryContinuation(root,rec,{tool});const c=rec.operation.completion,p=c.plan;
 const delivery=qualifiedCompletionDeliveryFacts(rec.operation.request,rec.operation);
 if(delivery===null||!same(delivery,{publication:p.receipt.publication,ci:p.receipt.ci}))refuse("QUALIFIED_COMPLETION_PROOFS_CHANGED");
 requireInstalledRuntimeAssets(tool,["qualified-completion-operation","qualified-completion-record","qualified-delivery-completion","project-init-operation"].map(n=>`tools/e2e/scripts/${n}.mjs`));
 verifyInstalledRecordTool(tool);if(!same(tool,p.tool))refuse("QUALIFIED_COMPLETION_TOOL_CHANGED");
 const config=loadProjectSettings({productRoot:root,productRevision:rec.operation.request.route.policyRevision,tool});
 if(config.status!=="ready"||config.provenance.configDigest!==p.configurationDigest||!same(config.settings.records.validation,p.profile))refuse("QUALIFIED_COMPLETION_CONFIGURATION_CHANGED");
 if(!same(captureOperationRepository(p.repository.root,p.expectedRevision),p.repository)||readOperationRef(p.repository.root,p.targetRef)!==p.expectedRevision||
  git(p.repository.root,["symbolic-ref","HEAD"]).toString("utf8").replace(/\n$/,"")!==p.targetRef)refuse("QUALIFIED_COMPLETION_RECORDS_CHANGED");
 if(readOperationRef(p.repository.root,c.intent.correlationRef)!==null)refuse("QUALIFIED_COMPLETION_CORRELATION_FOREIGN");
 assertExactRecordTransformations(p.repository.root,p.writes.map((/** @type {any} */ w)=>w.path));
 const index=operationDigest(readFileSync(p.index.path).toString("base64"));if(![p.index.previousDigest,p.index.resultDigest].includes(index))refuse("QUALIFIED_COMPLETION_INDEX_CHANGED");
 for(const w of p.writes){const now=snapshotRecordFile(safeOperationWorkingPath(p.repository.root,w.path)),before=p.preimages.find((/** @type {any} */ v)=>v.path===w.path)?.work;
  if(!same(now,before)&&!same(now,intendedRecordFile(w)))refuse("QUALIFIED_COMPLETION_WORKING_CHANGED");
 }
 return true;
}
/** Only an ID and an opaque installed TOOL handle are accepted. No lifecycle
 * field, review flag, bytes, route, root or target can come from this caller.
 * @param {string} coordinatorRoot @param {string} operationId @param {{tool:any}} configuration
 * @param {{onBoundary?:(boundary:string,record:any)=>void}} [diagnostics] */
export async function completeQualifiedRecordsDelivery(coordinatorRoot,operationId,configuration,diagnostics={}){
 return execute(coordinatorRoot,operationId,configuration,diagnostics);
}
/** Original accepted result is observed before requiring any current TOOL.
 * Pending work uses its exact retained plan and current protected policy.
 * @param {string} coordinatorRoot @param {string} operationId @param {{tool:any}|undefined} [configuration]
 * @param {{onBoundary?:(boundary:string,record:any)=>void}} [diagnostics] */
export async function replayQualifiedRecordsCompletion(coordinatorRoot,operationId,configuration,diagnostics={}){
 return execute(coordinatorRoot,operationId,configuration,diagnostics,true);
}
/** @param {string} root @param {string} id @param {any} configuration @param {any} diagnostics @param {boolean} [replay] */
async function execute(root,id,configuration,diagnostics,replay=false){
 if(typeof id!=="string"||!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(id)||!diagnostics||Object.keys(diagnostics).some(k=>k!=="onBoundary")||diagnostics.onBoundary!==undefined&&typeof diagnostics.onBoundary!=="function")refuse("QUALIFIED_COMPLETION_REQUEST");
 root=realpathSync(root);const first=readAcceptedOperation(root,id);
 if(first?.operation.kind!=="qualified-delivery"||first.operation.request.coordinator.root!==root)refuse("QUALIFIED_COMPLETION_ABSENT");
 const proven=observed(first);if(!proven)await loadQualifiedDeliveryPolicy();
 const key=`${root}\0${id}`;if(active.has(key))refuse("QUALIFIED_COMPLETION_OWNER_LIVE");active.add(key);
 try{return withNativeTransaction(root,{operation:"qualified-delivery-completion"},()=>{
  let rec=readAcceptedOperation(root,id);if(rec?.operation.kind!=="qualified-delivery"||rec.operation.digest!==first.operation.digest)refuse("QUALIFIED_COMPLETION_CHANGED");
  if(observed(rec))return finish(root,rec,diagnostics);
  if(replay&&rec.operation.completion===undefined)refuse("QUALIFIED_COMPLETION_ABSENT");
  if(!configuration||Object.keys(configuration).join(",")!=="tool")refuse("QUALIFIED_COMPLETION_CONFIGURATION");
  requireInstalledRuntimeAssets(configuration.tool,["qualified-completion-operation","qualified-completion-record","qualified-delivery-completion","project-init-operation"].map(n=>`tools/e2e/scripts/${n}.mjs`));
  if(rec.operation.completion===undefined&&rec.operation.request.route.publicationOwed){
   if(!rec.operation.publication?.acceptance)refuse("QUALIFIED_COMPLETION_PUBLICATION_PENDING");
   if(qualifiedCompletionDeliveryFacts(rec.operation.request,rec.operation)===null)refuse("QUALIFIED_COMPLETION_CI_PENDING");
  }
  const io=runs.defaultRunIo(),identity=io.identity(process.pid);if(identity===null)refuse("QUALIFIED_COMPLETION_OWNER_UNKNOWN");
  if(rec.operation.owner.pid!==process.pid&&operationOwnerAlive(rec.operation.owner,io))refuse("QUALIFIED_COMPLETION_OWNER_LIVE");
  assertQualifiedDeliveryRecovery(root,rec,configuration);
  rec.operation.owner={pid:process.pid,identity,token:randomUUID()};persist(root,rec);
  if(rec.operation.completion===undefined){
   const local=observeQualifiedLocalDelivery(root,id);if(local?.status!=="local-integrated")refuse("QUALIFIED_COMPLETION_LOCAL_PENDING");
   if(rec.operation.localAcceptance===null){rec=structuredClone(local.record);persist(root,rec);}
   assertQualifiedDeliveryContinuation(root,rec,configuration);
   for(const landing of rec.operation.request.landings){const lock=`${landing.working.index.path}.lock`;
    try{lstatSync(lock);}catch(error){if(/** @type {NodeJS.ErrnoException} */(error).code==="ENOENT")continue;throw error;}
    releaseDeadExactWriteLock(landing.working.index.path,id,landing.working.index.lockToken,()=>observeQualifiedLocalDelivery(root,id)?.status==="local-integrated");
   }
   const plan=operationPayload(qualifiedCompletionWriteSet(captureQualifiedCompletionProposal(root,id,configuration)));
   rec.operation.completion={version:1,plan,digest:operationDigest(plan),phase:"captured",intent:{ref:plan.targetRef,previousRevision:plan.expectedRevision,commit:plan.commit,tree:plan.tree,
    correlationRef:`refs/supertaskr/deliveries/${operationWork(id).slice(3)}/completion`},acceptance:null};persist(root,rec);
  }
  const c=rec.operation.completion,p=c.plan;freeze(p);diagnostics.onBoundary?.("completion:captured",structuredClone(rec));policy(root,rec,configuration.tool);
  c.phase="objects-start";rec.state="unknown";persist(root,rec);diagnostics.onBoundary?.("completion:objects-start",structuredClone(rec));
  policy(root,rec,configuration.tool);prepareExactWriteTree(p.repository.root,p.expectedRevision,p.writes,p.tree,()=>{
   diagnostics.onBoundary?.("completion:before-object",structuredClone(rec));return policy(root,rec,configuration.tool);
  });
  policy(root,rec,configuration.tool);
  if(git(p.repository.root,["hash-object","-w","-t","commit","--stdin"],Buffer.from(p.commitBase64,"base64")).toString("ascii").replace(/\n$/,"")!==p.commit)refuse("QUALIFIED_COMPLETION_COMMIT_CHANGED");
  validateCommit(rec);c.phase="objects-prepared";persist(root,rec);diagnostics.onBoundary?.("completion:objects-prepared",structuredClone(rec));
  policy(root,rec,configuration.tool);c.phase="working-start";persist(root,rec);diagnostics.onBoundary?.("completion:working-start",structuredClone(rec));
  let release;
  try{
   release=materializeExactWrites(root,p,{operationId:id,request:{repository:p.repository}},()=>policy(root,rec,configuration.tool),boundary=>diagnostics.onBoundary?.(`completion:${boundary}`,structuredClone(rec)));
   c.phase="working-prepared";persist(root,rec);diagnostics.onBoundary?.("completion:working-prepared",structuredClone(rec));
   policy(root,rec,configuration.tool);validateCommit(rec);acceptOperationRef(p.repository.root,c.intent);diagnostics.onBoundary?.("completion:ref-accepted",structuredClone(rec));
  }finally{release?.();}
  return finish(root,rec,diagnostics);
 });}finally{active.delete(key);}
}
