/** Immutable private-backup source qualification. Local acceptance is read
 * first; receiver effects/progress and export/restore are separate consumers. */
import {execFileSync} from "node:child_process";
import {closeSync,constants,fchmodSync,fsyncSync,linkSync,lstatSync,mkdirSync,mkdtempSync,openSync,readFileSync,readdirSync,realpathSync,rmSync,unlinkSync,writeFileSync} from "node:fs";
import os from "node:os";
import {randomUUID} from "node:crypto";
import path from "node:path";
import {captureOperationRepository,checkOperationEnvironment,observedAcceptedOperation,readAcceptedOperation} from "./durable-operation.mjs";
import {operationContent,operationDigest} from "./operation-record.mjs";
import {resolveWorkspace,validateAssociation,WORKSPACE_ASSOCIATION_REL_PATH} from "./workspace.mjs";
import {installedRecordAsset,loadInstalledRecordTool,verifyInstalledRecordTool} from "./records-check.mjs";
import {assertInitialRepositoryConfiguration,capturePlainProjectRoot} from "./project-init-operation.mjs";
import {assertExactRecordTransformations,safeOperationWorkingPath} from "./record-write.mjs";
import {syncNativeFileNamespace} from "./native-codex.mjs";

const sources=new WeakMap();
export const PRIVATE_BACKUP_LIMITS=Object.freeze({blobBytes:32*1024*1024,expandedObjectBytes:256*1024*1024,packBytes:64*1024*1024,archiveBytes:96*1024*1024});
export class PrivateBackupFinding extends Error {
 /** @param {string} code */
 constructor(code){super(`${code}: private backup unavailable; local save is unchanged`);this.name="PrivateBackupFinding";this.code=code;}
}
/** @param {string} code @returns {never} */
function refuse(code){throw new PrivateBackupFinding(code);}
/** @param {any} value @returns {any} */
function freeze(value){if(value&&typeof value==="object"){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
/** @param {string} root @param {string[]} args @param {Buffer|string|undefined} [input] @returns {Buffer} */
function git(root,args,input){try{return execFileSync("git",["--no-replace-objects","-C",root,...args],{stdio:[input===undefined?"ignore":"pipe","pipe","pipe"],...(input===undefined?{}:{input}),maxBuffer:96*1024*1024,env:{...process.env,GIT_NO_LAZY_FETCH:"1",GIT_OPTIONAL_LOCKS:"0"}});}catch{refuse("private-backup-history-unavailable");}}
/** @param {string} root @param {string[]} args */
function line(root,args){return git(root,args).toString("utf8").replace(/\n$/,"");}
/** Read/export eligibility is broader than ordinary editing: frozen rulings,
 * rejected cards, captured transcripts and design assets must survive too.
 * The verified split home and portable association in every historical tree
 * establish the records namespace; this does not grant mutation permission.
 * Checking every reachable tree matters: a clean current tree is insufficient.
 * @param {string} file */
function privatePath(file){
 if(!file||path.posix.isAbsolute(file)||path.win32.isAbsolute(file)||/[\\\x00-\x1f\x7f]/.test(file)||file.split("/").some(part=>!part||[".","..",".git",".supertaskr"].includes(part)))return false;
 if(file==="docs/CAPABILITIES.md"||file.split("/").some(part=>part.startsWith(".")))return file===".gitignore"||file===".record-history/manifest.json"||/^\.record-history\/source-cards\/[0-9a-f]{40}(?:[0-9a-f]{24})?\.md$/.test(file);
 return file===WORKSPACE_ASSOCIATION_REL_PATH||file.startsWith("docs/");
}
/** @param {string} root @param {string} revision @param {any} association */
function qualifyHistory(root,revision,association){
 const commits=line(root,["rev-list",revision]).split("\n");if(!commits.length||commits.length>5000)refuse("private-backup-history-limit");
 const trees=new Map(),paths=new Set();let entries=0;
 for(const commit of commits){
  const tree=line(root,["show","-s","--format=%T",commit]);if(trees.has(tree))continue;
  const rows=new TextDecoder("utf-8",{fatal:true}).decode(git(root,["ls-tree","-r","-z","--full-tree",commit])).split("\0").filter(Boolean);
  const described=[];let portable=null;
  for(const row of rows){
   const match=/^(100644|100755|120000) blob ([0-9a-f]{40}(?:[0-9a-f]{24})?)\t([\s\S]+)$/.exec(row);
   if(!match)refuse("private-backup-nonprivate-history");
   const mode=match[1],object=match[2],file=match[3];
   if(typeof mode!=="string"||typeof object!=="string"||typeof file!=="string"||!privatePath(file))refuse("private-backup-nonprivate-history");
   paths.add(file);if(++entries>1000000||paths.size>50000)refuse("private-backup-history-limit");
   described.push({mode,object,path:file});
   if(file===WORKSPACE_ASSOCIATION_REL_PATH){if(mode!=="100644")refuse("private-backup-association");portable=object;}
  }
  if(portable===null)refuse("private-backup-association-history");
  try{validateAssociation(JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(git(root,["cat-file","blob",portable]))),association.productIdentity,{projectId:association.projectId});}
  catch{refuse("private-backup-association-history");}
  trees.set(tree,described);
 }
 const objects=line(root,["rev-list","--objects","--no-object-names",revision]).split("\n").sort();
 if(objects.length>100000||new Set(objects).size!==objects.length)refuse("private-backup-history-limit");
 const sizes=git(root,["cat-file","--batch-check=%(objectname) %(objecttype) %(objectsize)"],`${objects.join("\n")}\n`).toString("ascii").replace(/\n$/,"").split("\n");
 let expanded=0;
 if(sizes.length!==objects.length)refuse("private-backup-history-unavailable");
 for(let at=0;at<sizes.length;at++){
  const row=/^([0-9a-f]+) (blob|tree|commit) ([0-9]+)$/.exec(/** @type {string} */(sizes[at]));
  if(!row||row[1]!==objects[at])refuse("private-backup-history-unavailable");
  const bytes=Number(row[3]);expanded+=bytes;
  if(!Number.isSafeInteger(bytes)||row[2]==="blob"&&bytes>PRIVATE_BACKUP_LIMITS.blobBytes||expanded>PRIVATE_BACKUP_LIMITS.expandedObjectBytes)refuse("private-backup-expanded-limit");
 }
 return freeze({commits:commits.sort(),trees:[...trees].sort(([a],[b])=>a.localeCompare(b)),paths:[...paths].sort(),objects,
  digest:operationDigest({commits:commits.sort(),trees:[...trees].sort(([a],[b])=>a.localeCompare(b)),objects})});
}

/** Capture an actual accepted ordinary save, never a caller-selected HEAD or
 * revision. This reads no receiver, writes no operation and runs no producer.
 * A changed backup route refuses without undoing the immutable local result.
 * @param {{productRoot:string,operationId:string,manifestPath?:string}} request */
export function capturePrivateBackupSource(request){
 if(!request||Object.keys(request).sort().join(",")!==["operationId","productRoot",...(Object.hasOwn(request,"manifestPath")?["manifestPath"]:[])].sort().join(","))refuse("private-backup-request");
 checkOperationEnvironment();
 const coordinatorRoot=realpathSync(request.productRoot),record=readAcceptedOperation(coordinatorRoot,request.operationId);
 if(record?.operation.kind!=="records-save"||record.operation.request.payload?.kind!=="ordinary-record-save")refuse("private-backup-local-save-required");
 const accepted=observedAcceptedOperation(coordinatorRoot,request.operationId);if(accepted===null)refuse("private-backup-local-save-unaccepted");
 const payload=record.operation.request.payload,repository=captureOperationRepository(record.operation.request.repository.root,accepted.commit,{forEffect:false});
 if(!payload.productOrigin||operationContent(captureOperationRepository(coordinatorRoot,payload.options.productRevision,{forEffect:false}))!==operationContent(payload.productOrigin))refuse("private-backup-original-product-changed");
 if(operationContent(repository)!==operationContent(record.operation.request.repository))refuse("private-backup-original-repository-changed");
 const workspace=resolveWorkspace({productRoot:coordinatorRoot,mode:"development",commit:payload.options.productRevision});
 if(workspace.layout!=="split"||workspace.recordsRoot!==repository.root||workspace.association.status!=="verified")refuse("private-backup-route-changed");
 const tool=loadInstalledRecordTool(request.manifestPath);installedRecordAsset(tool,"tools/e2e/scripts/records-backup.mjs");
 const history=qualifyHistory(repository.root,accepted.commit,workspace.association);
 verifyInstalledRecordTool(tool);
 if(operationContent(captureOperationRepository(coordinatorRoot,payload.options.productRevision,{forEffect:false}))!==operationContent(payload.productOrigin))refuse("private-backup-original-product-changed");
 if(operationContent(captureOperationRepository(repository.root,accepted.commit,{forEffect:false}))!==operationContent(repository))refuse("private-backup-original-repository-changed");
 const result=freeze({version:1,kind:"private-backup-source",projectId:workspace.association.projectId,
  save:{operationId:request.operationId,requestDigest:record.operation.digest,receiptDigest:operationDigest(accepted),commit:accepted.commit,tree:accepted.tree,ref:accepted.ref},
  objectFormat:repository.objectFormat,historyDigest:history.digest,commits:history.commits.length,trees:history.trees.length,objects:history.objects.length,
  paths:history.paths,uncommitted:"excluded",toolManifestDigest:tool.manifestDigest});
 sources.set(result,{coordinatorRoot,repository,history,tool,association:workspace.association,request:{...request}});return result;
}

/** Local immutable archive primitives. A file export is not a remote-backup
 * receipt or a durable receiver operation. Shared operation progress remains
 * the responsibility of that separate optional consumer.
 */
const ARCHIVE_LIMIT=PRIVATE_BACKUP_LIMITS.archiveBytes,PACK_LIMIT=PRIVATE_BACKUP_LIMITS.packBytes;
/** @param {any} v @param {string[]} keys */
function shape(v,keys){return v&&typeof v==="object"&&!Array.isArray(v)&&Object.keys(v).sort().join("\0")===[...keys].sort().join("\0");}
/** @param {string} file */
function optionalStat(file){try{return lstatSync(file,{bigint:true});}catch(error){if(/** @type {any} */(error).code==="ENOENT")return null;throw error;}}
/** @param {string} file */
function readPlainArchive(file){
 const before=lstatSync(file,{bigint:true});
 if(!before.isFile()||before.isSymbolicLink()||before.nlink!==1n||before.size>BigInt(ARCHIVE_LIMIT))refuse("private-backup-artifact-file");
 const bytes=readFileSync(file),after=lstatSync(file,{bigint:true});
 if(before.dev!==after.dev||before.ino!==after.ino||before.size!==after.size||!bytes.equals(readFileSync(file)))refuse("private-backup-artifact-changed");
 return bytes;
}
/** @param {any} source */
function retainedSource(source){
 const captured=sources.get(source);if(!captured)refuse("private-backup-source-required");
 const current=capturePrivateBackupSource(captured.request);
 if(operationContent(current)!==operationContent(source))refuse("private-backup-source-changed");
 verifyInstalledRecordTool(captured.tool);return captured;
}
/** @param {string} parent @param {any} original */
function assertParent(parent,original){if(operationContent(capturePlainProjectRoot(parent))!==operationContent(original))refuse("private-backup-destination-changed");}
/** @param {any} source @param {any} captured @param {Buffer} pack */
function archiveBody(source,captured,pack){
 return {version:1,kind:"private-records-backup",projectId:source.projectId,
  product:{objectFormat:captured.association.productIdentity.objectFormat,rootCommits:captured.association.productIdentity.rootCommits},
  save:source.save,objectFormat:source.objectFormat,historyDigest:source.historyDigest,
  commits:source.commits,trees:source.trees,objects:source.objects,uncommitted:"excluded",toolManifestDigest:source.toolManifestDigest,
  packDigest:operationDigest(pack.toString("base64")),packBase64:pack.toString("base64")};
}
/** @param {any} archive */
function validateArchiveShape(archive){
 if(!shape(archive,["version","kind","projectId","product","save","objectFormat","historyDigest","commits","trees","objects","uncommitted","toolManifestDigest","packDigest","packBase64","digest"])||
  archive.version!==1||archive.kind!=="private-records-backup"||!["sha1","sha256"].includes(archive.objectFormat)||archive.uncommitted!=="excluded"||
  !shape(archive.product,["objectFormat","rootCommits"])||!shape(archive.save,["operationId","requestDigest","receiptDigest","commit","tree","ref"])||
  typeof archive.projectId!=="string"||typeof archive.packBase64!=="string"||archive.packBase64.length>Math.ceil(PACK_LIMIT/3)*4||
  Buffer.from(archive.packBase64,"base64").toString("base64")!==archive.packBase64||operationDigest(archive.packBase64)!==archive.packDigest||
  !/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(archive.save.commit)||!/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(archive.save.tree)||
  !/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(archive.save.operationId)||!/^refs\/heads\/[^\s\x00-\x1f\x7f]+$/.test(archive.save.ref)||
  ![archive.save.requestDigest,archive.save.receiptDigest,archive.historyDigest].every(d=>typeof d==="string"&&/^sha256:[0-9a-f]{64}$/.test(d))||
  typeof archive.toolManifestDigest!=="string"||! /^[0-9a-f]{64}$/.test(archive.toolManifestDigest)||
  ![archive.commits,archive.trees,archive.objects].every(n=>Number.isInteger(n)&&n>0))refuse("private-backup-artifact-shape");
 const {digest,...body}=archive;if(digest!==operationDigest(body))refuse("private-backup-artifact-digest");
 const portable={version:1,projectId:archive.projectId,product:archive.product};
 try{validateAssociation(portable,archive.product,{projectId:archive.projectId});}catch{refuse("private-backup-artifact-association");}
}
/** All untrusted objects are checked in a new external object store first.
 * No source object store, refs, Git internals or hooks are copied.
 * @param {any} archive @param {(root:string,history:any)=>any} body */
function withArchive(archive,body){
 validateArchiveShape(archive);checkOperationEnvironment();
 const scratch=realpathSync(mkdtempSync(path.join(os.tmpdir(),"supertaskr-backup-verify-")));
 try{
  assertInitialRepositoryConfiguration(scratch);
  git(scratch,["init","--quiet","--template=",`--object-format=${archive.objectFormat}`,"--initial-branch=main"]);
  git(scratch,["index-pack","--stdin","--strict"],Buffer.from(archive.packBase64,"base64"));
  if(line(scratch,["cat-file","-t",archive.save.commit])!=="commit"||line(scratch,["rev-parse",`${archive.save.commit}^{tree}`])!==archive.save.tree)refuse("private-backup-artifact-save");
  const history=qualifyHistory(scratch,archive.save.commit,{projectId:archive.projectId,productIdentity:archive.product});
  if(history.digest!==archive.historyDigest||history.commits.length!==archive.commits||history.trees.length!==archive.trees||history.objects.length!==archive.objects||
   operationContent(line(scratch,["cat-file","--batch-all-objects","--batch-check=%(objectname)"]).split("\n").sort())!==operationContent(history.objects))refuse("private-backup-artifact-history");
  git(scratch,["fsck","--strict","--no-reflogs","--no-dangling",archive.save.commit]);
  captureOperationRepository(scratch,archive.save.commit,{forEffect:false});return body(scratch,history);
 }finally{rmSync(scratch,{recursive:true,force:true});}
}
/** Export the exact accepted save, including only its qualified reachable
 * history, to an explicitly selected new local file outside all Git homes.
 * Matching existing bytes are reported as available, not newly accepted.
 * @param {any} source @param {{file:string}} request */
export function exportPrivateBackup(source,request){
 if(!shape(request,["file"])||typeof request.file!=="string"||!path.isAbsolute(request.file))refuse("private-backup-export-request");
 const parent=capturePlainProjectRoot(path.dirname(request.file)),file=path.join(parent.path,path.basename(request.file));
 const archive=preparePrivateBackupArchive(source),bytes=Buffer.from(`${JSON.stringify(archive)}\n`);
 retainedSource(source);assertParent(parent.path,parent);
 const result={status:"exported",file,digest:archive.digest,commit:source.save.commit,tree:source.save.tree,uncommitted:"excluded"};
 if(optionalStat(file)){if(!readPlainArchive(file).equals(bytes))refuse("private-backup-destination-exists");return freeze({...result,status:"available"});}
 const temp=path.join(parent.path,`.supertaskr-backup-${randomUUID()}.tmp`);let fd;
 try{
  fd=openSync(temp,"wx",0o600);writeFileSync(fd,bytes);fsyncSync(fd);closeSync(fd);fd=undefined;
  retainedSource(source);assertParent(parent.path,parent);linkSync(temp,file);syncNativeFileNamespace(file);
  unlinkSync(temp);syncNativeFileNamespace(temp);
  if(!readPlainArchive(file).equals(bytes))refuse("private-backup-artifact-changed");
  return freeze(result);
 }finally{if(fd!==undefined)closeSync(fd);if(optionalStat(temp)) {unlinkSync(temp);syncNativeFileNamespace(temp);}}
}
/** Detached verified artifact data for the finite shared-operation producer.
 * It grants no destination authority and accepts only a captured source handle.
 * @param {any} source */
export function preparePrivateBackupArchive(source){
 const captured=retainedSource(source);
 const pack=git(captured.repository.root,["pack-objects","--stdout","--revs"],`${source.save.commit}\n`);if(pack.length>PACK_LIMIT)refuse("private-backup-artifact-limit");
 const body=archiveBody(source,captured,pack),archive={...body,digest:operationDigest(body)};
 withArchive(archive,()=>true);retainedSource(source);
 const bytes=Buffer.from(`${JSON.stringify(archive)}\n`);if(bytes.length>ARCHIVE_LIMIT)refuse("private-backup-artifact-limit");
 return freeze(archive);
}
/** Validate a portable local artifact without reading a project/binding or
 * creating a selected restore destination. The digest establishes integrity,
 * not authentication or any inherited grant/lifecycle authority.
 * @param {string} file */
export function inspectPrivateBackup(file){
 const archive=readPortableArchive(file);
 return withArchive(archive,(_root,history)=>freeze({version:1,projectId:archive.projectId,commit:archive.save.commit,tree:archive.save.tree,
  digest:archive.digest,historyDigest:history.digest,commits:history.commits.length,objects:history.objects.length,paths:history.paths,uncommitted:"excluded"}));
}
/** Restore to a new explicitly selected directory. Existing/partial targets
 * always refuse intact; an interrupted restore is never silently overwritten.
 * Restoration imports no operational records, binding, credentials or grants.
 * @param {{file:string,directory:string}} request */
export function restorePrivateBackup(request){
 if(!shape(request,["file","directory"])||typeof request.file!=="string"||typeof request.directory!=="string"||!path.isAbsolute(request.directory))refuse("private-backup-restore-request");
 const archive=readPortableArchive(request.file);
 const parent=capturePlainProjectRoot(path.dirname(request.directory)),destination=path.join(parent.path,path.basename(request.directory));
 if(optionalStat(destination))refuse("private-backup-restore-exists");
 return withArchive(archive,(scratch,history)=>{
  const rows=new TextDecoder("utf-8",{fatal:true}).decode(git(scratch,["ls-tree","-r","-z","--full-tree",archive.save.commit])).split("\0").filter(Boolean),paths=[];
  for(const row of rows){const m=/^(100644|100755) blob [0-9a-f]+\t([\s\S]+)$/.exec(row);if(!m)refuse("private-backup-restore-type");paths.push(/** @type {string} */(m[2]));}
  if(new Set(paths.map(p=>p.normalize("NFC").toLowerCase())).size!==paths.length)refuse("private-backup-restore-path-collision");
  assertExactRecordTransformations(scratch,paths,archive.save.commit);assertParent(parent.path,parent);assertInitialRepositoryConfiguration(parent.path);
  mkdirSync(destination,{mode:0o700});syncNativeFileNamespace(destination);
  git(destination,["init","--quiet","--template=",`--object-format=${archive.objectFormat}`,"--initial-branch=main"]);
  assertInitialRepositoryConfiguration(destination);git(destination,["index-pack","--stdin","--strict"],Buffer.from(archive.packBase64,"base64"));
  captureOperationRepository(destination,archive.save.commit);assertExactRecordTransformations(destination,paths,archive.save.commit);
  git(destination,["read-tree",archive.save.commit]);
  for(const file of paths){const absolute=safeOperationWorkingPath(destination,file);mkdirSync(path.dirname(absolute),{recursive:true,mode:0o700});}
  git(destination,["checkout-index","--all"]);
  for(const row of rows){const m=/^(100644|100755) blob ([0-9a-f]+)\t([\s\S]+)$/.exec(row),file=safeOperationWorkingPath(destination,/** @type {string} */(m?.[3]));
   const fd=openSync(file,constants.O_RDONLY|constants.O_NOFOLLOW);
   try{fchmodSync(fd,m?.[1]==="100755"?0o755:0o644);fsyncSync(fd);}finally{closeSync(fd);}
   syncNativeFileNamespace(file);
   if(!readFileSync(file).equals(git(destination,["cat-file","blob",/** @type {string} */(m?.[2])])))refuse("private-backup-restore-bytes");
  }
  git(destination,["update-ref","refs/heads/main",archive.save.commit,"0".repeat(archive.objectFormat==="sha1"?40:64)]);
  git(destination,["fsck","--strict","--no-reflogs","--no-dangling"]);
  if(line(destination,["write-tree"])!==archive.save.tree||line(destination,["status","--porcelain=v1"])!=="")refuse("private-backup-restore-result");
  flushRestore(destination);syncNativeFileNamespace(destination);
  return freeze({status:"restored",directory:destination,commit:archive.save.commit,tree:archive.save.tree,digest:archive.digest,historyDigest:history.digest,
   objects:history.objects.length,uncommitted:"excluded",binding:"not-installed",authority:"not-imported"});
 });
}
/** A delivery witness adds operation correlation only. Neither witness nor
 * portable association imports operational/lifecycle authority on restore.
 * @param {string} file */
function readPortableArchive(file){
 let data;try{data=JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(readPlainArchive(file)));}catch(error){if(error instanceof PrivateBackupFinding)throw error;refuse("private-backup-artifact-json");}
 if(data?.kind!=="private-backup-delivery")return data;
 if(!shape(data,["version","kind","operationId","requestDigest","archive"])||data.version!==1||typeof data.operationId!=="string"||!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(data.operationId)||
  typeof data.requestDigest!=="string"||!/^sha256:[0-9a-f]{64}$/.test(data.requestDigest))refuse("private-backup-artifact-shape");
 return data.archive;
}
/** Flush the new owned repository, including pack/index/ref files and nested
 * directory entries, before reporting the completed local restoration.
 * @param {string} directory */
function flushRestore(directory){
 for(const name of readdirSync(directory)){
  const file=path.join(directory,name),stat=lstatSync(file);if(stat.isSymbolicLink())refuse("private-backup-restore-type");
  if(stat.isDirectory())flushRestore(file);
  else{if(!stat.isFile()||stat.nlink!==1)refuse("private-backup-restore-type");const fd=openSync(file,constants.O_RDONLY|constants.O_NOFOLLOW);try{fsyncSync(fd);}finally{closeSync(fd);}}
 }
 const fd=openSync(directory,"r");try{fsyncSync(fd);}finally{closeSync(fd);}
}
