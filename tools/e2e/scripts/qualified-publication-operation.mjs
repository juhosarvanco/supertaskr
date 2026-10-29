/** Actual normal atomic protected push using the original qualified OP.
 * Publication acceptance does not imply post-push CI or record completion. */
import {execFileSync,fork} from "node:child_process";
import {createHash,randomUUID} from "node:crypto";
import {realpathSync} from "node:fs";
import path from "node:path";
import * as runs from "./run-record.mjs";
import {acceptedOperationPath,captureOperationRepository,checkOperationEnvironment,operationOwnerAlive,readAcceptedOperation} from "./durable-operation.mjs";
import {atomicJson,withNativeTransaction} from "./native-codex.mjs";
import {operationContent,operationDigest,validOperationRecord} from "./operation-record.mjs";
import {loadQualifiedDeliveryPolicy} from "./qualified-admission.mjs";
import {assertQualifiedDeliveryContinuation,observeQualifiedLocalDelivery} from "./qualified-delivery-operation.mjs";
import {observeFrozenPublicationRefs} from "./qualified-publication-context.mjs";
import {publicationExecutable,publicationProcess,publicationLaunchAlive} from "./qualified-publication-process.mjs";
import {readQualifiedPublicationGate} from "./qualified-publication-hook.mjs";
import {installedRecordAsset,requireInstalledRuntimeAssets} from "./records-check.mjs";
import {hookProgram} from "../../../cli/hook-git-context.mjs";
const active=new Set();
/** @param {string} code @param {string} [detail] @returns {never} */
function refuse(code,detail){throw Object.assign(new Error(`${code}: protected publication pending${detail?` (${detail})`:""}`),{code});}
/** Preserve a finite actual named refusal, never raw private stderr.
 * @param {string} stderr */
function childFinding(stderr){return [...stderr.matchAll(/(?:^|\n)((?:QUALIFIED_[A-Z_]+|OPERATION_[A-Z_]+|records-[a-z-]+|gate-[a-z-]+|hook-[a-z-]+|ERR_[A-Z_]+))(?=:|\n|$)/g)].at(-1)?.[1]??"child-unavailable";}
/** @param {any} a @param {any} b */
const same=(a,b)=>operationContent(a)===operationContent(b);
/** @param {string} root @param {any} rec */
function persist(root,rec){if(!validOperationRecord(rec))refuse("QUALIFIED_PUBLICATION_RECORD");atomicJson(acceptedOperationPath(root,rec.operation.id),rec);}
/** @param {string} root @param {string} id */
function selected(root,id){
 if(typeof id!=="string"||!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(id))refuse("QUALIFIED_PUBLICATION_REQUEST");
 const rec=readAcceptedOperation(root,id);if(rec?.operation.kind!=="qualified-delivery"||rec.operation.request.coordinator.root!==root)refuse("QUALIFIED_PUBLICATION_ABSENT");
 if(rec.operation.request.route.name!=="protected-atomic-push-v1")refuse("QUALIFIED_PUBLICATION_ROUTE_UNFROZEN");return rec;
}
/** Exact immutable witness, not Git exit status or commit reachability alone.
 * @param {string} root @param {any} rec */
function acceptance(root,rec){
 const req=rec.operation.request,s=req.route.publication;
 if(!same(captureOperationRepository(root,s.destination.expectedOld,{forEffect:false}),req.coordinator))refuse("QUALIFIED_PUBLICATION_ORIGIN_CHANGED");
 const observed=observeQualifiedLocalDelivery(root,rec.operation.id);if(observed?.status!=="local-integrated")refuse("QUALIFIED_PUBLICATION_LOCAL_PENDING");
 const actual=observeFrozenPublicationRefs(root,s);
 if(actual.witness!==null&&actual.witness!==s.commit)refuse("QUALIFIED_PUBLICATION_CORRELATION_FOREIGN");
 if(actual.witness===s.commit){
  if(!rec.operation.publication?.checks||!rec.operation.publication.launches.some((/** @type {any} */ l)=>l.stage==="push"&&l.gitStarted))refuse("QUALIFIED_PUBLICATION_ACCEPTANCE_UNCERTAIN");
  if(rec.operation.publication.acceptance===null&&actual.tip!==s.commit){
   if(s.destination.endpoint.kind!=="local"||actual.tip===null)refuse("QUALIFIED_PUBLICATION_ACCEPTANCE_UNCERTAIN");
   try{execFileSync("git",["--no-replace-objects","--git-dir",s.destination.endpoint.path,"merge-base","--is-ancestor",s.commit,actual.tip],{stdio:["ignore","pipe","pipe"]});}catch{refuse("QUALIFIED_PUBLICATION_ACCEPTANCE_UNCERTAIN");}
  }
  return {contextDigest:s.digest,previousRevision:s.destination.expectedOld,ref:s.destination.ref,commit:s.commit,tree:s.tree,correlationRef:s.correlationRef,attribution:"exact"};
 }
 if(rec.operation.publication?.acceptance!==null&&rec.operation.publication?.acceptance!==undefined||actual.tip!==s.destination.expectedOld)refuse("QUALIFIED_PUBLICATION_ACCEPTANCE_UNCERTAIN");
 return null;
}
/** @param {any} rec @param {any} accepted */
function receipt(rec,accepted){return {status:"published",operationId:rec.operation.id,taskId:rec.operation.request.authority.taskId,requestDigest:rec.operation.digest,publication:accepted,ci:"pending",recordsCompletion:"pending"};}
/** @param {string} root @param {any} rec */
function owner(root,rec){
 const io=runs.defaultRunIo(),identity=io.identity(process.pid);if(identity===null)refuse("QUALIFIED_PUBLICATION_OWNER_UNKNOWN");
 const last=rec.operation.publication?.launches.at(-1);
 if(last&&publicationLaunchAlive(last))refuse("QUALIFIED_PUBLICATION_LAUNCH_LIVE");
 if(rec.operation.owner.pid!==process.pid&&operationOwnerAlive(rec.operation.owner,io))refuse("QUALIFIED_PUBLICATION_OWNER_LIVE");
 for(const c of rec.operation.claims)if(runs.readReservation(root,c.resource)?.attempt!==rec.attempt)refuse("QUALIFIED_PUBLICATION_OWNERSHIP");
 if(last?.result===null)last.result={kind:"observed-dead",observedAt:new Date().toISOString()};
 if(rec.operation.owner.pid!==process.pid||rec.operation.owner.identity!==identity)rec.operation.owner={pid:process.pid,identity,token:randomUUID()};
 return rec;
}
/** The actual executable behind Git's installation shim is invoked directly,
 * so the mandatory hook can compare OS ancestry with one frozen image.
 * @returns {{path:string,sha256:string}} */
function gitExecutable(){
 const front=hookProgram();let directory;try{directory=execFileSync(front,["--exec-path"],{encoding:"utf8",stdio:["ignore","pipe","pipe"]}).replace(/\n$/,"");}catch{refuse("QUALIFIED_PUBLICATION_PROGRAM");}
 return publicationExecutable(path.join(directory,"git"));
}
/** @param {string} root @param {string} id @param {"checks"|"push"} stage @param {any} configuration @param {any} diagnostics */
async function launch(root,id,stage,configuration,diagnostics){
 /** @type {ReturnType<typeof fork>|undefined} */let child;
 /** @type {any} */let current;
 /** @type {Buffer[]} */const stdoutBytes=[];
 /** @type {Buffer[]} */const stderrBytes=[];
 const stdoutHash=createHash("sha256"),stderrHash=createHash("sha256");let outputSize=0;
 const done=new Promise((resolve,reject)=>{
  try{withNativeTransaction(root,{operation:"qualified-publication-launch"},()=>{
   const rec=owner(root,selected(root,id));
   if(!rec.operation.publication||rec.operation.publication.launches.length>=128)refuse("QUALIFIED_PUBLICATION_LAUNCH_LIMIT");
   assertQualifiedDeliveryContinuation(root,rec,configuration);
   const tool=configuration.tool,entry=installedRecordAsset(tool,"tools/e2e/scripts/qualified-publication-launch.mjs"),node=publicationExecutable(process.execPath),git=gitExecutable();
   const token=`launch-${randomUUID()}`;
   child=fork(entry,["--root",root,"--operation",id,"--token",token],{cwd:root,execPath:node.path,execArgv:[],env:{...process.env,GIT_OPTIONAL_LOCKS:"0",GIT_NO_LAZY_FETCH:"1"},detached:true,stdio:["ignore","pipe","pipe","ipc"]});
   if(!child.pid)refuse("QUALIFIED_PUBLICATION_PROCESS_UNKNOWN");
   const actual=publicationProcess(child.pid);
   if(actual.ppid!==process.pid||actual.group!==actual.pid||actual.program!==node.path)refuse("QUALIFIED_PUBLICATION_PROCESS_UNKNOWN");
   const entryMember=requireInstalledRuntimeAssets(tool,["tools/e2e/scripts/qualified-publication-launch.mjs"]).files[0];
   if(!entryMember)refuse("QUALIFIED_PUBLICATION_ENTRY");
   current={sequence:rec.operation.publication.launches.length+1,stage,token,owner:structuredClone(rec.operation.owner),process:{pid:actual.pid,identity:actual.startedAt,group:actual.group},node,git,entry:{path:entry,sha256:entryMember.sha256},startedAt:new Date().toISOString(),gitStarted:false,result:null};
   rec.operation.publication.launches.push(current);rec.operation.publication.phase=stage==="checks"?"checking":"pushing";persist(root,rec);
   const collect=(/** @type {"stdout"|"stderr"} */kind,/** @type {Buffer} */chunk)=>{
    (kind==="stdout"?stdoutHash:stderrHash).update(chunk);
    const remaining=Math.max(0,8*1024*1024-outputSize);if(remaining)(kind==="stdout"?stdoutBytes:stderrBytes).push(Buffer.from(chunk.subarray(0,remaining)));outputSize+=chunk.length;
    try{diagnostics.onOutput?.(kind,Buffer.from(chunk));}catch(error){try{child?.disconnect();}catch{/* owned child handles disconnect */}reject(error);}
    if(outputSize>8*1024*1024){try{child?.disconnect();}catch{/* actual owned child handles disconnect */}}
   };
   child.stdout?.on("data",chunk=>collect("stdout",chunk));child.stderr?.on("data",chunk=>collect("stderr",chunk));
   child.on("message",message=>{
    try{
     if(stage!=="push"||!message||typeof message!=="object"||Object.keys(message).sort().join(",")!=="kind,token"||/** @type {any} */(message).kind!=="git-start"||/** @type {any} */(message).token!==token||current.gitStarted)refuse("QUALIFIED_PUBLICATION_GIT_START_CHANGED");
     withNativeTransaction(root,{operation:"qualified-publication-git-start"},()=>{
      const stored=selected(root,id),last=stored.operation.publication?.launches.at(-1),live=publicationProcess(current.process.pid);
      if(!same(last,current)||!same(stored.operation.owner,current.owner)||live.startedAt!==current.process.identity||live.ppid!==process.pid||live.group!==current.process.group||live.program!==current.node.path)refuse("QUALIFIED_PUBLICATION_LAUNCH_CHANGED");
      assertQualifiedDeliveryContinuation(root,stored,configuration);last.gitStarted=true;persist(root,stored);current.gitStarted=true;
      diagnostics.onBoundary?.("push:git-started",structuredClone(stored));child?.send({kind:"git-started",token});
     });
    }catch(error){try{child?.disconnect();}catch{/* actual fixed child retires only its own group */}reject(error);}
   });
   child.once("error",reject);child.once("close",(exit,signal)=>resolve({kind:"exited",exit,signal,finishedAt:new Date().toISOString(),stdoutDigest:`sha256:${stdoutHash.digest("hex")}`,stderrDigest:`sha256:${stderrHash.digest("hex")}`}));
   diagnostics.onBoundary?.(`${stage}:launch-recorded`,structuredClone(rec));
   child.send({kind:"start",token});
  });}catch(error){try{child?.disconnect();}catch{/* no guessed PID signal */}reject(error);}
 });
 let result;
 try{result=await done;}catch(error){
  // The forked fixed child is still ours after an initial capture/diagnostic
  // failure. Disconnect prevents start, and collect its actual ending before
  // returning; never send a signal based on a stale record PID.
  if(child&&child.exitCode===null&&child.signalCode===null)await new Promise(resolve=>child?.once("close",resolve));
  throw error;
 }
 withNativeTransaction(root,{operation:"qualified-publication-result"},()=>{
  const rec=selected(root,id),last=rec.operation.publication?.launches.at(-1);
  if(!same(last,current)||!same(rec.operation.owner,current.owner))refuse("QUALIFIED_PUBLICATION_LAUNCH_CHANGED");
  last.result=result;persist(root,rec);diagnostics.onBoundary?.(`${stage}:launch-ended`,structuredClone(rec));
 });
 return {result,stdout:Buffer.concat(stdoutBytes).toString("utf8"),stderr:Buffer.concat(stderrBytes).toString("utf8")};
}

/** Read-only original publication proof for later CI/completion consumers.
 * No launch, ownership adoption, bookkeeping, release or current TOOL load.
 * @param {string} coordinatorRoot @param {string} operationId */
export function observeQualifiedPublication(coordinatorRoot,operationId){
 const root=realpathSync(coordinatorRoot),rec=selected(root,operationId),accepted=acceptance(root,rec);
 /** @param {any} value @returns {any} */
 const freeze=value=>{if(value&&typeof value==="object"){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
 return freeze({status:accepted===null?"pending":"published",record:rec,receipt:accepted===null?null:receipt(rec,accepted)});
}
/** Existing exact full route only. Original acceptance is observed first;
 * missing effects require current canonical policy and actual owned launch.
 * @param {string} coordinatorRoot @param {string} operationId @param {{tool:any}} configuration
 * @param {{onBoundary?:(boundary:string,record:any)=>void,onOutput?:(kind:"stdout"|"stderr",bytes:Buffer)=>void}} [diagnostics] */
export async function publishQualifiedDelivery(coordinatorRoot,operationId,configuration,diagnostics={}){
 const root=realpathSync(coordinatorRoot),key=`${root}\0${operationId}`;
 if(active.has(key))refuse("QUALIFIED_PUBLICATION_OWNER_LIVE");active.add(key);
 try{
  let rec=selected(root,operationId),accepted=acceptance(root,rec);
  if(accepted!==null){
   // Lost-result bookkeeping is not a new publication effect. Retain it only
   // when no original live owner/job can still publish a newer progress row.
   if(rec.operation.publication?.acceptance===null&&!publicationLaunchAlive(rec.operation.publication.launches.at(-1))&&!operationOwnerAlive(rec.operation.owner,runs.defaultRunIo())){
    withNativeTransaction(root,{operation:"qualified-publication-observed"},()=>{
     const current=selected(root,operationId);if(!same(current,rec))refuse("QUALIFIED_PUBLICATION_CHANGED");
     current.operation.publication.acceptance=accepted;current.operation.publication.phase="published";current.events.push({at:new Date().toISOString(),op:"publication-observed"});persist(root,current);rec=current;
    });
   }
   return receipt(rec,accepted);
  }
  if(rec.operation.request.route.publication.destination.endpoint.kind==="github"&&rec.operation.publication?.launches.some((/** @type {any} */ l)=>l.stage==="push"&&l.gitStarted))refuse("QUALIFIED_PUBLICATION_OUTCOME_UNKNOWN");
  if(!configuration||Object.keys(configuration).join(",")!=="tool"||Object.keys(diagnostics).some(k=>!["onBoundary","onOutput"].includes(k))||diagnostics.onBoundary!==undefined&&typeof diagnostics.onBoundary!=="function"||diagnostics.onOutput!==undefined&&typeof diagnostics.onOutput!=="function")refuse("QUALIFIED_PUBLICATION_REQUEST");
  checkOperationEnvironment();if(process.env.NODE_OPTIONS||process.env.NODE_PATH)refuse("QUALIFIED_PUBLICATION_NODE_ROUTING");
  requireInstalledRuntimeAssets(configuration.tool,["cli/hook-git-context.mjs","tools/e2e/scripts/qualified-publication-operation.mjs","tools/e2e/scripts/qualified-publication-launch.mjs","tools/e2e/scripts/qualified-publication-hook.mjs","tools/e2e/scripts/qualified-publication-process.mjs","tools/e2e/scripts/qualified-publication-record.mjs"]);
  await loadQualifiedDeliveryPolicy();
  withNativeTransaction(root,{operation:"qualified-publication-capture"},()=>{
   rec=owner(root,selected(root,operationId));
   if(!rec.operation.publication)rec.operation.publication={version:1,phase:"captured",launches:[],checks:null,acceptance:null};
   persist(root,rec);assertQualifiedDeliveryContinuation(root,rec,configuration);
  });
  /** @type {any} */let checked;
  try{checked=readQualifiedPublicationGate(rec,configuration.tool);}catch(error){if(!String(/** @type {any} */(error)?.code??"").startsWith("token-"))throw error;}
  let attribution="observed-artifact";
  if(checked===undefined){
   const run=await launch(root,operationId,"checks",configuration,diagnostics);rec=selected(root,operationId);
   if(/** @type {any} */(run.result)?.exit!==0)refuse("QUALIFIED_PUBLICATION_CHECKS_REFUSED",childFinding(run.stderr));
   checked=readQualifiedPublicationGate(rec,configuration.tool);attribution="executed-owned-launch";
  }
  withNativeTransaction(root,{operation:"qualified-publication-checks"},()=>{
   rec=owner(root,selected(root,operationId));assertQualifiedDeliveryContinuation(root,rec,configuration);
   rec.operation.publication.checks={...checked,attribution};rec.operation.publication.phase="checks-ready";persist(root,rec);diagnostics.onBoundary?.("checks-ready",structuredClone(rec));
  });
  // A changed advertised destination is refused by Git's mandatory hook too.
  // This earlier observation avoids an unnecessary owned launch when known.
  accepted=acceptance(root,rec);if(accepted!==null)return receipt(rec,accepted);
  const pushed=await launch(root,operationId,"push",configuration,diagnostics);rec=selected(root,operationId);
  diagnostics.onBoundary?.("push:effect-observed",structuredClone(rec));accepted=acceptance(root,rec);
  if(accepted===null)refuse(/** @type {any} */(pushed.result)?.exit===0?"QUALIFIED_PUBLICATION_ACCEPTANCE_UNCERTAIN":"QUALIFIED_PUBLICATION_PUSH_REFUSED",childFinding(pushed.stderr));
  withNativeTransaction(root,{operation:"qualified-publication-accepted"},()=>{
   rec=selected(root,operationId);rec.operation.publication.acceptance=accepted;rec.operation.publication.phase="published";rec.events.push({at:new Date().toISOString(),op:"publication-accepted"});persist(root,rec);
  });
  return receipt(rec,accepted);
 }finally{active.delete(key);}
}
