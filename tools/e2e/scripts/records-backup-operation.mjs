/** Optional existing local archive receiver. This route has no Git/remote
 * transport, hook installation, PRODUCT suite or publication effect. */
import {closeSync,constants,fstatSync,fsyncSync,linkSync,lstatSync,openSync,readFileSync,realpathSync,unlinkSync,writeFileSync} from "node:fs";
import {parseDocument} from "yaml";
import path from "node:path";
import {randomUUID} from "node:crypto";
import {capturePlainProjectRoot} from "./project-init-operation.mjs";
import {capturePrivateBackupSource,preparePrivateBackupArchive,PrivateBackupFinding} from "./records-backup.mjs";
import {acceptedOperationPath,listAcceptedOperations,observedAcceptedOperation,operationOwnerAlive,readAcceptedOperation} from "./durable-operation.mjs";
import {operationContent,operationDigest,operationPayload,operationWork,validOperationRecord} from "./operation-record.mjs";
import {validPrivateBackupRequest} from "./private-backup-record.mjs";
import {atomicJson,syncNativeFileNamespace,withNativeTransaction} from "./native-codex.mjs";
import {assertOperationOwnership,defaultRunIo,readReservation,releaseReservation,reservationPath,sha256,takeReservation} from "./run-record.mjs";
import {loadInstalledRecordTool,requireInstalledRuntimeAssets} from "./records-check.mjs";
const active=new Set();
/** @param {string} code @returns {never} */
function refuse(code){throw new PrivateBackupFinding(code);}
/** @param {any} v @param {string[]} fields */
const shape=(v,fields)=>v&&typeof v==="object"&&!Array.isArray(v)&&Object.keys(v).sort().join("\0")===[...fields].sort().join("\0");
/** @param {any} a @param {any} b */
const same=(a,b)=>operationContent(a)===operationContent(b);
/** @param {string} file */
function stat(file){try{return lstatSync(file,{bigint:true});}catch(error){if(/** @type {any} */(error).code==="ENOENT")return null;throw error;}}
/** @param {string} directory */
function physical(directory){const s=stat(directory);if(!s?.isDirectory()||s.isSymbolicLink()||realpathSync(directory)!==directory)refuse("private-backup-directory");return {path:directory,device:String(s.dev),inode:String(s.ino)};}
/** @param {string} file */
function plain(file){const s=stat(file);if(!s?.isFile()||s.isSymbolicLink()||s.nlink!==1n)refuse("private-backup-config-file");return s;}
/** Configuration is a local explicit opt-in, never copied method defaults or
 * a stdin-provided destination. The receiver must already be private/plain.
 * @param {string} product */
export function readPrivateBackupConfiguration(product){
 const runtime=physical(path.join(product,".supertaskr")),file=path.join(runtime.path,"private-backup.json");if(stat(file)===null)return null;
 const s=plain(file);if(s.size>65536n)refuse("private-backup-config-limit");const bytes=readFileSync(file);let data;
 try{const text=new TextDecoder("utf-8",{fatal:true}).decode(bytes);data=JSON.parse(text);if(parseDocument(text,{uniqueKeys:true}).errors.length)refuse("private-backup-config-json");}catch{refuse("private-backup-config-json");}
 if(!shape(data,["version","projectId","receiver"])||data.version!==1||typeof data.projectId!=="string"||!shape(data.receiver,["kind","directory"]))refuse("private-backup-config");
 if(data.receiver.kind!=="local-archive-directory")refuse("private-backup-receiver-unsupported");
 if(typeof data.receiver.directory!=="string"||!path.isAbsolute(data.receiver.directory))refuse("private-backup-config");
 const receiver=capturePlainProjectRoot(data.receiver.directory),permissions=stat(receiver.path);
 if(!permissions||permissions.mode&0o077n)refuse("private-backup-receiver-not-private");
 const after=plain(file);if(after.dev!==s.dev||after.ino!==s.ino||!readFileSync(file).equals(bytes)||!same(physical(runtime.path),runtime))refuse("private-backup-config-changed");
 return {projectId:data.projectId,receiver,captured:{file,digest:operationDigest(bytes.toString("base64")),runtime,identity:{device:String(s.dev),inode:String(s.ino)}}};
}
const configuration=readPrivateBackupConfiguration;
/** @param {any} rec */
function fileFor(rec){return path.join(rec.operation.request.receiver.path,`${operationWork(rec.operation.id)}.private-backup.json`);}
/** Portable operation witness carries no source or destination physical paths.
 * @param {any} rec */
function bytesFor(rec){return Buffer.from(`${operationContent({version:1,kind:"private-backup-delivery",operationId:rec.operation.id,requestDigest:rec.operation.digest,archive:rec.operation.request.archive})}\n`);}
/** @param {any} rec */
function receipt(rec){return {status:"backed-up",operationId:rec.operation.id,requestDigest:rec.operation.digest,saveOperationId:rec.operation.request.source.save.operationId,
 commit:rec.operation.request.source.save.commit,tree:rec.operation.request.source.save.tree,file:fileFor(rec),archiveDigest:rec.operation.request.archive.digest,attribution:"exact"};}
/** Exact operation file/witness and original receiver, never current receiver
 * HEAD/reachability. A crash may leave the one owned temporary hardlink.
 * @param {any} rec */
function observed(rec){
 if(!same(capturePlainProjectRoot(rec.operation.request.receiver.path),rec.operation.request.receiver))refuse("private-backup-receiver-changed");
 const file=fileFor(rec),s=stat(file);if(s===null)return false;
 if(!s.isFile()||s.isSymbolicLink()||![1n,2n].includes(s.nlink)||!readFileSync(file).equals(bytesFor(rec)))refuse("private-backup-receiver-conflicted");
 if(s.nlink===2n){const temporary=stat(`${file}.supertaskr-${rec.operation.request.token}.tmp`);if(!temporary?.isFile()||temporary.isSymbolicLink()||temporary.dev!==s.dev||temporary.ino!==s.ino)refuse("private-backup-receiver-conflicted");}
 return true;
}
/** @param {string} product @param {any} rec */
function persist(product,rec){if(!validOperationRecord(rec))refuse("private-backup-record");atomicJson(acceptedOperationPath(product,rec.operation.id),rec);}
/** @param {string} product @param {any} rec @param {any} installation */
function policy(product,rec,installation){
 const req=rec.operation.request,current=configuration(product);
 if(!current||!same(current.captured,req.configuration)||!same(current.receiver,req.receiver)||current.projectId!==req.source.projectId)refuse("private-backup-config-changed");
 const source=capturePrivateBackupSource({productRoot:product,operationId:req.source.save.operationId,...installation});
 if(!same(source,req.source))refuse("private-backup-source-changed");
 const tool=loadInstalledRecordTool(installation.manifestPath);requireInstalledRuntimeAssets(tool,["records-backup","records-backup-operation","private-backup-record"].map(n=>`tools/e2e/scripts/${n}.mjs`));
 if(readReservation(product,req.receiver.path)?.attempt!==rec.attempt)refuse("private-backup-ownership");assertOperationOwnership(product,{resource:req.receiver.path,attempt:rec.attempt});return true;
}
/** @param {any} rec */
function retireTemporary(rec){
 const file=fileFor(rec),temp=`${file}.supertaskr-${rec.operation.request.token}.tmp`,s=stat(temp);if(s===null)return;
 if(!s.isFile()||s.isSymbolicLink()||![1n,2n].includes(s.nlink))refuse("private-backup-temporary-unavailable");
 const fd=openSync(temp,constants.O_RDONLY|constants.O_NOFOLLOW);
 try{
  const opened=fstatSync(fd,{bigint:true}),bytes=readFileSync(fd);
  if(opened.dev!==s.dev||opened.ino!==s.ino||!bytes.equals(bytesFor(rec))||s.nlink===2n&&!observed(rec))refuse("private-backup-temporary-unavailable");
  const current=stat(temp);
  if(!current?.isFile()||current.isSymbolicLink()||current.dev!==opened.dev||current.ino!==opened.ino||current.nlink!==opened.nlink||!readFileSync(temp).equals(bytes))refuse("private-backup-temporary-unavailable");
  unlinkSync(temp);syncNativeFileNamespace(temp);
 }finally{closeSync(fd);}
}
/** @param {string} product @param {any} rec */
function finish(product,rec){
 if(!observed(rec))refuse("private-backup-acceptance-uncertain");retireTemporary(rec);
 rec.operation.acceptance=receipt(rec);rec.operation.phase="accepted";rec.state="unknown";persist(product,rec);
 const held=readReservation(product,rec.resource);
 if(held!==null&&held.attempt!==rec.attempt)refuse("private-backup-ownership");
 if(held!==null)releaseReservation(product,{resource:rec.resource,attempt:rec.attempt});
 rec.reservation.releasedAt=new Date().toISOString();rec.state="finished";rec.events.push({at:rec.reservation.releasedAt,op:"backup-accepted"});persist(product,rec);return rec.operation.acceptance;
}
/** Trusted installation override only; requests contain IDs, no route/tool.
 * @param {string} product @param {{operationId:string,saveOperationId:string}} input
 * @param {{manifestPath?:string,onBoundary?:(boundary:string,record:any)=>void}} [options] */
export function backupPrivateRecordSave(product,input,options={}){
 if(!shape(input,["operationId","saveOperationId"])||[input.operationId,input.saveOperationId].some(id=>typeof id!=="string"||!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(id))||input.operationId===input.saveOperationId||
  Object.keys(options).some(k=>!["manifestPath","onBoundary"].includes(k))||options.onBoundary!==undefined&&typeof options.onBoundary!=="function")refuse("private-backup-request");
 product=realpathSync(product);const prior=readAcceptedOperation(product,input.operationId);
 if(prior!==null){if(prior.operation.kind!=="private-backup"||prior.operation.request.source.save.operationId!==input.saveOperationId)refuse("private-backup-request-changed");return replayPrivateBackup(product,input.operationId,options);}
 const saved=readAcceptedOperation(product,input.saveOperationId),accepted=observedAcceptedOperation(product,input.saveOperationId);
 if(saved?.operation.kind!=="records-save"||saved.operation.request.payload?.kind!=="ordinary-record-save"||accepted===null)refuse("private-backup-local-save-required");
 const config=configuration(product);if(config===null)return {status:"not-configured",localSave:accepted};
 if(constants.O_NOFOLLOW===undefined)refuse("private-backup-platform-unsupported");
 const installation=options.manifestPath===undefined?{}:{manifestPath:options.manifestPath};
 const source=capturePrivateBackupSource({productRoot:product,operationId:input.saveOperationId,...installation});if(config.projectId!==source.projectId)refuse("private-backup-project-mismatch");
 const archive=preparePrivateBackupArchive(source);let request;
 try{request=operationPayload({version:1,kind:"private-backup",operationId:input.operationId,coordinator:product,source,configuration:config.captured,receiver:config.receiver,archive,token:randomUUID()});}catch{refuse("private-backup-operation-limit");}
 if(!validPrivateBackupRequest(request))refuse("private-backup-request");return execute(product,request,options);
}
/** @param {string} product @param {any} request @param {any} options */
function execute(product,request,options){
 const key=`${product}\0${request.operationId}`;if(active.has(key))refuse("private-backup-owner-live");active.add(key);
 try{return withNativeTransaction(product,{operation:"private-backup"},()=>{
  let rec=readAcceptedOperation(product,request.operationId);
  if(rec&&!same(rec.operation.request,request))refuse("private-backup-request-changed");
  if(rec?.state==="finished"){if(!observed(rec))refuse("private-backup-acceptance-uncertain");return rec.operation.acceptance;}
  const io=defaultRunIo(),identity=io.identity(process.pid);if(identity===null)refuse("private-backup-owner-unknown");
  if(rec&&rec.operation.owner.pid!==process.pid&&operationOwnerAlive(rec.operation.owner,io))refuse("private-backup-owner-live");
  if(rec&&observed(rec))return finish(product,rec);
  const at=new Date().toISOString();
  if(!rec){
   const work=operationWork(request.operationId),assignment={kind:"operation",id:work,role:"private-backup",resource:request.receiver.path};
   if(stat(path.join(request.receiver.path,`${work}.private-backup.json`))!==null)refuse("private-backup-destination-exists");
   assertOperationOwnership(product,{resource:request.receiver.path,attempt:`${work}-a1`});if(readReservation(product,request.receiver.path)!==null)refuse("private-backup-receiver-reserved");
   const claim=takeReservation(product,{resource:request.receiver.path,attempt:`${work}-a1`,role:"private-backup",at});
   rec={version:1,recordKind:"operation",attempt:`${work}-a1`,state:"starting",assignment,assignmentDigest:sha256(JSON.stringify(assignment)),writer:true,resource:request.receiver.path,
    reservation:{file:claim.file,takenAt:at,releasedAt:null},execution:null,admission:null,operation:{version:1,id:request.operationId,kind:"private-backup",request,digest:operationDigest(request),
     owner:{pid:process.pid,identity,token:randomUUID()},createdAt:at,phase:"captured",acceptance:null},events:[{at,op:"capture-before-effects"}]};
   try{persist(product,rec);}catch(error){if(readAcceptedOperation(product,request.operationId)===null)releaseReservation(product,{resource:request.receiver.path,attempt:rec.attempt});throw error;}
  }else{rec.operation.owner={pid:process.pid,identity,token:randomUUID()};persist(product,rec);}
  const installation=options.manifestPath===undefined?{}:{manifestPath:options.manifestPath};options.onBoundary?.("captured",structuredClone(rec));policy(product,rec,installation);
  rec.operation.phase="publishing";rec.state="unknown";persist(product,rec);
  const file=fileFor(rec),temp=`${file}.supertaskr-${request.token}.tmp`,bytes=bytesFor(rec);retireTemporary(rec);policy(product,rec,installation);
  let fd;
  try{
   fd=openSync(temp,constants.O_WRONLY|constants.O_CREAT|constants.O_EXCL|constants.O_NOFOLLOW,0o600);writeFileSync(fd,bytes);fsyncSync(fd);closeSync(fd);fd=undefined;
   options.onBoundary?.("temporary-written",structuredClone(rec));policy(product,rec,installation);
   linkSync(temp,file);syncNativeFileNamespace(file);options.onBoundary?.("file-accepted",structuredClone(rec));
   unlinkSync(temp);syncNativeFileNamespace(temp);options.onBoundary?.("temporary-retired",structuredClone(rec));
  }finally{if(fd!==undefined)closeSync(fd);}
  return finish(product,rec);
 });}finally{active.delete(key);}
}
/** Original final receipt is returned before current TOOL/config/source. A
 * pending exact operation observes its original file before any missing effect.
 * @param {string} product @param {string} operationId @param {{manifestPath?:string,onBoundary?:(boundary:string,record:any)=>void}} [options] */
export function replayPrivateBackup(product,operationId,options={}){
 product=realpathSync(product);const rec=readAcceptedOperation(product,operationId);if(rec?.operation.kind!=="private-backup"||rec.operation.request.coordinator!==product)refuse("private-backup-operation-absent");
 return execute(product,rec.operation.request,options);
}
/** Read-only cold discovery uses the existing strict operation enumeration.
 * Stored results are historical receipts, not a new receiver observation.
 * @param {string} product */
export function discoverPrivateBackups(product){
 product=realpathSync(product);const backups=[];
 for(const rec of listAcceptedOperations(product)){
  if(rec.operation.kind!=="private-backup")continue;
  if(rec.operation.request.coordinator!==product)refuse("private-backup-coordinator-changed");
  backups.push({operationId:rec.operation.id,saveOperationId:rec.operation.request.source.save.operationId,projectId:rec.operation.request.source.projectId,
   commit:rec.operation.request.source.save.commit,state:rec.state,phase:rec.operation.phase,requestDigest:rec.operation.digest,
   observation:"stored-progress",...(rec.operation.acceptance===null?{}:{historicalReceipt:structuredClone(rec.operation.acceptance)})});
 }
 return {status:"backups",backups};
}
