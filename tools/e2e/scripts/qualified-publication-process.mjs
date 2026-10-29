/** Actual owned POSIX launch/ancestry evidence. No PID/environment assertion
 * supplied by a hook is authority, and no child adopts coordinator ownership. */
import {execFileSync} from "node:child_process";
import {createHash} from "node:crypto";
import {readFileSync,realpathSync,lstatSync} from "node:fs";
import path from "node:path";
import {processRow} from "./checkout-currency.mjs";
import {operationContent,operationDigest} from "./operation-record.mjs";
const proofs=new WeakMap();
/** @param {string} code @returns {never} */
function refuse(code){throw Object.assign(new Error(`${code}: owned publication process unavailable`),{code});}
/** @param {string} file */
export function publicationExecutable(file){
 const real=realpathSync(file),s=lstatSync(real);if(!s.isFile()||s.isSymbolicLink()||!(s.mode&0o111))refuse("QUALIFIED_PUBLICATION_PROGRAM");
 return {path:real,sha256:createHash("sha256").update(readFileSync(real)).digest("hex")};
}
/** @param {number} pid */
export function publicationProcess(pid){
 if(!["darwin","linux"].includes(process.platform))refuse("QUALIFIED_PUBLICATION_PLATFORM_UNSUPPORTED");
 const row=processRow(pid);if(!row)refuse("QUALIFIED_PUBLICATION_PROCESS_UNKNOWN");
 let group;try{group=execFileSync("ps",["-o","pgid=","-p",String(pid)],{encoding:"utf8",stdio:["ignore","pipe","pipe"]}).trim();}catch{refuse("QUALIFIED_PUBLICATION_PROCESS_UNKNOWN");}
 if(!/^\d+$/.test(group))refuse("QUALIFIED_PUBLICATION_PROCESS_UNKNOWN");
 let program;try{program=process.platform==="linux"?realpathSync(`/proc/${pid}/exe`):row.program?realpathSync(row.program):null;}catch{refuse("QUALIFIED_PUBLICATION_PROCESS_UNKNOWN");}
 if(program===null)refuse("QUALIFIED_PUBLICATION_PROCESS_UNKNOWN");
 let command;try{command=execFileSync("ps",["-ww","-o","command=","-p",String(pid)],{encoding:"utf8",stdio:["ignore","pipe","pipe"]}).replace(/\n$/,"");}catch{refuse("QUALIFIED_PUBLICATION_PROCESS_UNKNOWN");}
 return {...row,command,group:Number(group),program};
}
/** Conservative: EPERM, unknown and a live successor group are not dead.
 * @param {any} launch */
export function publicationLaunchAlive(launch){
 try{process.kill(-launch.process.group,0);return true;}catch(error){return /** @type {any} */(error)?.code!=="ESRCH";}
}
/** @param {any} rec @param {"checks"|"push"|"pre-tool"|"pre-push"} mode */
function actual(rec,mode){
 const op=rec.operation,l=op.publication?.launches?.at(-1);
 if(op.request.route.name!=="protected-atomic-push-v1"||!l||l.result!==null||l.stage!==(mode==="checks"?"checks":"push")||
  operationContent(l.owner)!==operationContent(op.owner))refuse("QUALIFIED_PUBLICATION_LAUNCH_REQUIRED");
 if(mode==="pre-push"&&!l.gitStarted||mode==="pre-tool"&&l.gitStarted)refuse("QUALIFIED_PUBLICATION_GIT_PHASE");
 const owner=publicationProcess(op.owner.pid),wrapper=publicationProcess(l.process.pid);
 if(owner.startedAt!==op.owner.identity||wrapper.startedAt!==l.process.identity||wrapper.ppid!==owner.pid||wrapper.group!==l.process.group||wrapper.group!==wrapper.pid||
  wrapper.program!==l.node.path||operationContent(publicationExecutable(l.node.path))!==operationContent(l.node)||
  createHash("sha256").update(readFileSync(l.entry.path)).digest("hex")!==l.entry.sha256||
  wrapper.command!==[l.node.path,l.entry.path,"--root",op.request.coordinator.root,"--operation",op.id,"--token",l.token].join(" "))refuse("QUALIFIED_PUBLICATION_LAUNCH_IDENTITY");
 const self=publicationProcess(process.pid);
 if(mode==="checks"||mode==="push"){
  if(self.pid!==wrapper.pid||self.startedAt!==wrapper.startedAt)refuse("QUALIFIED_PUBLICATION_CHILD_REQUIRED");
 }else{
  const hook=publicationProcess(self.ppid),s=op.request.route.publication;
  if(self.program!==l.node.path||self.group!==wrapper.group||self.command!==[l.node.path,path.join(path.dirname(l.entry.path),"qualified-publication-hook.mjs"),"--root",op.request.coordinator.root,"--mode",mode].join(" ")||
   hook.program!==l.node.path||hook.group!==wrapper.group||hook.command!==[l.node.path,s.hook.entry,"--root",op.request.coordinator.root,"--mode",mode,...(mode==="pre-push"?["--",s.destination.url,s.destination.url]:[])].join(" "))refuse("QUALIFIED_PUBLICATION_HOOK_ANCESTRY");
  if(mode==="pre-tool"){
   if(hook.ppid!==wrapper.pid)refuse("QUALIFIED_PUBLICATION_HOOK_ANCESTRY");
  }else{
   const git=publicationProcess(hook.ppid);
   if(git.ppid!==wrapper.pid||git.group!==wrapper.group||git.program!==l.git.path||operationContent(publicationExecutable(git.program))!==operationContent(l.git)||
    git.command!==[l.git.path,...publicationPushArguments(op.request)].join(" "))refuse("QUALIFIED_PUBLICATION_GIT_ANCESTRY");
  }
 }
 return {pid:self.pid,identity:self.startedAt,mode,recordDigest:operationDigest(rec),token:l.token};
}
/** Construct only from the actual current OS process and exact persisted row.
 * Canonical admission still compares the row against its strict ledger.
 * @param {any} rec @param {"checks"|"push"|"pre-tool"|"pre-push"} mode */
export function capturePublicationProcessProof(rec,mode){
 const facts=actual(rec,mode),proof=Object.freeze({version:1,kind:"owned-publication-child"});proofs.set(proof,facts);return proof;
}
/** @param {any} proof @param {any} rec */
export function validatePublicationProcessProof(proof,rec){
 const old=proofs.get(proof);if(!old||operationContent(actual(rec,old.mode))!==operationContent(old))refuse("QUALIFIED_PUBLICATION_CHILD_PROOF_REQUIRED");return true;
}
/** The only actual push argv. No force, lease, no-verify, caller program,
 * remote/ref expansion or mutable default refspec participates.
 * @param {any} request */
export function publicationPushArguments(request){const s=request.route.publication;return ["--no-replace-objects","-C",request.coordinator.root,"push","--atomic",s.destination.url,`${s.commit}:${s.destination.ref}`,`${s.commit}:${s.correlationRef}`];}
