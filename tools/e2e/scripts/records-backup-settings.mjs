/** Explicit local backup opt-in. Selected paths come from the native picker;
 * no archive, PRODUCT check, commit, remote or backup receipt is produced here. */
import {closeSync,constants,fsyncSync,lstatSync,mkdirSync,openSync,readFileSync,realpathSync,writeSync} from "node:fs";
import path from "node:path";
import {capturePrivateBackupSource,PrivateBackupFinding} from "./records-backup.mjs";
import {readPrivateBackupConfiguration} from "./records-backup-operation.mjs";
import {capturePlainProjectRoot} from "./project-init-operation.mjs";
import {operationContent,operationDigest} from "./operation-record.mjs";
import {loadInstalledRecordTool,requireInstalledRuntimeAssets} from "./records-check.mjs";
import {syncNativeFileNamespace,withNativeTransaction} from "./native-codex.mjs";

export const PRIVATE_BACKUP_FOLDER="supertaskr-private-backups";
/** @param {string} code @returns {never} */
function refuse(code){throw new PrivateBackupFinding(code);}
/** @param {any} value @param {string[]} fields */
const shape=(value,fields)=>value&&typeof value==="object"&&!Array.isArray(value)&&Object.keys(value).sort().join("\0")===[...fields].sort().join("\0");
/** @param {any} left @param {any} right */
const same=(left,right)=>operationContent(left)===operationContent(right);
/** @param {string} directory */
function physical(directory){const s=lstatSync(directory,{bigint:true});if(!s.isDirectory()||s.isSymbolicLink()||realpathSync(directory)!==directory)refuse("private-backup-settings-directory");return {path:directory,device:String(s.dev),inode:String(s.ino)};}
/** @param {any} request */
function observe(request){
 if(!shape(request,["productRoot","saveOperationId",...(Object.hasOwn(request??{},"manifestPath")?["manifestPath"]:[])])||typeof request.productRoot!=="string"||!path.isAbsolute(request.productRoot)||typeof request.saveOperationId!=="string")refuse("private-backup-settings-request");
 const source=capturePrivateBackupSource({productRoot:request.productRoot,operationId:request.saveOperationId,...(request.manifestPath===undefined?{}:{manifestPath:request.manifestPath})});
 const tool=loadInstalledRecordTool(request.manifestPath);requireInstalledRuntimeAssets(tool,["records-backup-settings","records-backup-operation"].map(owner=>`tools/e2e/scripts/${owner}.mjs`));
 const product=realpathSync(request.productRoot),runtime=physical(path.join(product,".supertaskr")),configuration=readPrivateBackupConfiguration(product);
 if(configuration!==null&&configuration.projectId!==source.projectId)refuse("private-backup-project-mismatch");
 const token=operationDigest({source,product:physical(product),runtime,configuration});
 return {source,product,runtime,configuration,view:{status:configuration===null?"not-configured":"configured",projectId:source.projectId,
  saveOperationId:source.save.operationId,commit:source.save.commit,token,...(configuration===null?{}:{directory:configuration.receiver.path})}};
}
/** Fresh observation is equality data, not an authority token. Effects repeat
 * source/TOOL/configuration checks. @param {any} request */
export function readPrivateBackupSettings(request){return observe(request).view;}
/** Create only the fixed private child of the native selected plain parent.
 * Existing nonprivate children are refused intact, never chmodded or replaced.
 * The setting is a local working file, not a save/backup operation ledger.
 * A lost response is reconciled by readPrivateBackupSettings; partial files
 * remain named unavailable and are never silently deleted or adopted.
 * @param {{productRoot:string,saveOperationId:string,expectedToken:string,parent:{path:string,device:string,inode:string},manifestPath?:string}} request */
export function configurePrivateBackup(request){
 if(!shape(request,["productRoot","saveOperationId","expectedToken","parent",...(Object.hasOwn(request??{},"manifestPath")?["manifestPath"]:[])])||
  typeof request.expectedToken!=="string"||!/^sha256:[0-9a-f]{64}$/.test(request.expectedToken)||!shape(request.parent,["path","device","inode"])||
  typeof request.parent.path!=="string"||!path.isAbsolute(request.parent.path)||![request.parent.device,request.parent.inode].every(value=>typeof value==="string"&&/^\d+$/.test(value)))refuse("private-backup-settings-request");
 if(typeof constants.O_NOFOLLOW!=="number")refuse("private-backup-platform-unsupported");
 const selection={productRoot:request.productRoot,saveOperationId:request.saveOperationId,...(request.manifestPath===undefined?{}:{manifestPath:request.manifestPath})};
 const captured=observe(selection);
 const current=()=>{const next=observe(selection);if(next.view.token!==request.expectedToken||captured.view.token!==request.expectedToken||next.configuration!==null)refuse("private-backup-settings-changed");
  if(!same(capturePlainProjectRoot(request.parent.path),request.parent))refuse("private-backup-settings-parent-changed");return next;};
 current();
 return withNativeTransaction(captured.product,{operation:"private-backup-configure"},()=>{
  current();const directory=path.join(request.parent.path,PRIVATE_BACKUP_FOLDER);
  try{mkdirSync(directory,{mode:0o700});syncNativeFileNamespace(directory);}catch(error){if(/** @type {NodeJS.ErrnoException} */(error).code!=="EEXIST")throw error;}
  const receiver=capturePlainProjectRoot(directory),permissions=lstatSync(directory,{bigint:true});if(permissions.mode&0o077n)refuse("private-backup-receiver-not-private");
  current();if(!same(capturePlainProjectRoot(directory),receiver))refuse("private-backup-settings-parent-changed");
  const file=path.join(captured.runtime.path,"private-backup.json"),data={version:1,projectId:captured.source.projectId,receiver:{kind:"local-archive-directory",directory}},bytes=Buffer.from(`${JSON.stringify(data)}\n`);
  const fd=openSync(file,constants.O_WRONLY|constants.O_CREAT|constants.O_EXCL|constants.O_NOFOLLOW,0o600);
  try{let written=0;while(written<bytes.length){const count=writeSync(fd,bytes,written,bytes.length-written,written);if(count<1)refuse("private-backup-settings-write");written+=count;}fsyncSync(fd);}finally{closeSync(fd);}
  syncNativeFileNamespace(file);
  const result=observe(selection);if(result.configuration?.receiver.path!==directory||!readFileSync(file).equals(bytes))refuse("private-backup-settings-changed");return result.view;
 });
}
