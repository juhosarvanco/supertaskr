/** Physical directory observation mechanics only. Callers must supply their
 * complete actual captured repository identities; this grants no path policy,
 * namespace effect, adoption or deletion. */
import {lstatSync,realpathSync} from "node:fs";
import path from "node:path";
/** @param {string} code @returns {never} */
function refuse(code){throw Object.assign(new Error(code),{code});}
/** @param {string} file */
function directory(file){
 const s=lstatSync(file,{bigint:true});
 if(!s.isDirectory()||s.isSymbolicLink()||realpathSync(file)!==file)refuse("QUALIFIED_EXTERNAL_DIRECTORY_CHANGED");
 return {path:file,device:String(s.dev),inode:String(s.ino)};
}
/** Exact delivery externalParent physical walk, without its OP/policy layer.
 * @param {string} parent @param {{path:string,device:string,inode:string}[]} excludedDirectories */
function outside(parent,excludedDirectories){
 if(!Array.isArray(excludedDirectories)||!excludedDirectories.length||excludedDirectories.some(row=>!row||typeof row.path!=="string"||typeof row.device!=="string"||typeof row.inode!=="string"))refuse("QUALIFIED_EXTERNAL_EXCLUSIONS_REQUIRED");
 let at=parent;
 for(;;){
  const observed=directory(at);
  if(excludedDirectories.some(row=>row.device===observed.device&&row.inode===observed.inode))refuse("QUALIFIED_EXTERNAL_PARENT_NOT_EXTERNAL");
  const next=path.dirname(at);if(next===at)break;at=next;
 }
}
/** No directory is created here. @param {string} parent @param {{path:string,device:string,inode:string}[]} excludedDirectories */
export function captureExternalParent(parent,excludedDirectories){const observed=directory(parent);outside(parent,excludedDirectories);return observed;}
/** Repeat the original identity and whole physical ancestor walk at effects.
 * @param {{path:string,device:string,inode:string}} expected @param {{path:string,device:string,inode:string}[]} excludedDirectories */
export function assertExternalParent(expected,excludedDirectories){
 if(!expected||Object.keys(expected).sort().join()!=="device,inode,path")refuse("QUALIFIED_EXTERNAL_DIRECTORY_CHANGED");
 const observed=directory(expected.path);
 if(observed.device!==expected.device||observed.inode!==expected.inode)refuse("QUALIFIED_EXTERNAL_DIRECTORY_CHANGED");
 outside(expected.path,excludedDirectories);
}
