/** Exact already-installed TOOL pre-push qualification. No hook is installed,
 * disabled, replaced or granted authority by this read-only constructor. */
import {execFileSync} from "node:child_process";
import {createHash} from "node:crypto";
import {lstatSync,readFileSync,realpathSync} from "node:fs";
import path from "node:path";
import {checkOperationEnvironment} from "./durable-operation.mjs";
import {installedRecordAsset,requireInstalledRuntimeAssets} from "./records-check.mjs";
import {operationContent} from "./operation-record.mjs";
const proofs=new WeakMap();
export class FixedProductHookFinding extends Error{
 /** @param {string} code */
 constructor(code){super(`${code}: fixed PRODUCT hook unavailable`);this.code=code;}
}
/** @param {string} code @returns {never} */
function refuse(code){throw new FixedProductHookFinding(code);}
/** @param {any} v @returns {any} */
function freeze(v){if(v&&typeof v==="object"){Object.values(v).forEach(freeze);Object.freeze(v);}return v;}
/** @param {string} text */
const hash=text=>createHash("sha256").update(text).digest("hex");
/** Shell bytes are constructed only from canonical backend TOOL/root paths.
 * @param {string} text */
const quote=text=>`'${text.replaceAll("'","'\\''")}'`;
/** @param {string} file @param {"file"|"directory"} type */
function physical(file,type){
 try{const s=lstatSync(file,{bigint:true});
  if(s.isSymbolicLink()||realpathSync(file)!==file||(type==="file"?!s.isFile()||s.nlink!==1n:!s.isDirectory()))refuse("FIXED_HOOK_PHYSICAL");
  return {path:file,device:String(s.dev),inode:String(s.ino),mode:Number(s.mode&0o777n)};
 }catch(error){if(error instanceof FixedProductHookFinding)throw error;refuse("FIXED_HOOK_PHYSICAL");}
}
/** @param {string} root @param {string[]} args */
function git(root,args){try{return execFileSync("git",["--no-replace-objects","-C",root,...args],{encoding:"utf8",stdio:["ignore","pipe","pipe"],env:{...process.env,GIT_NO_LAZY_FETCH:"1",GIT_OPTIONAL_LOCKS:"0"}}).replace(/\n$/,"");}catch{refuse("FIXED_HOOK_GIT");}}
/** Exact finite wrapper data for a separately authorized installer. This
 * function creates no file/directory/configuration and chooses no user hook.
 * @param {{productRoot:string,tool:any}} options */
export function renderFixedProductPrePush(options){
 if(!["darwin","linux"].includes(process.platform))refuse("FIXED_HOOK_PLATFORM_UNSUPPORTED");
 if(!options||Object.keys(options).sort().join(",")!=="productRoot,tool"||typeof options.productRoot!=="string")refuse("FIXED_HOOK_REQUEST");
 checkOperationEnvironment();const root=realpathSync(options.productRoot);
 const closure=requireInstalledRuntimeAssets(options.tool,["tools/e2e/scripts/fixed-product-hook.mjs","tools/e2e/scripts/product-hook.mjs",...[
  "push-guard","pre-push-guard","configured-gate-reader","landing-gate","gate-token"].map(n=>`cli/${n}.mjs`)]);
 const node=realpathSync(process.execPath),entry=installedRecordAsset(options.tool,"tools/e2e/scripts/product-hook.mjs");physical(node,"file");physical(entry,"file");
 const bytes=`#!/bin/sh\nexec ${quote(node)} ${quote(entry)} --root ${quote(root)} --mode pre-push -- "$@"\n`;
 return freeze({version:1,productRoot:root,node,entry,bytes,sha256:hash(bytes),closure});
}
/** Capture the actual configured/default hook location and exact immutable
 * wrapper bytes. Other active hooks are still judged by the generic audit.
 * @param {{productRoot:string,tool:any}} options */
export function qualifyFixedProductPrePush(options){
 const rendered=renderFixedProductPrePush(options),root=rendered.productRoot;
 if(realpathSync(git(root,["rev-parse","--show-toplevel"]))!==root)refuse("FIXED_HOOK_ROOT");
 const common=realpathSync(git(root,["rev-parse","--path-format=absolute","--git-common-dir"]));
 const config=git(root,["config","--null","--list"]).split("\0").filter(Boolean).map(row=>{const at=row.indexOf("\n");return {key:row.slice(0,at).toLowerCase(),value:row.slice(at+1)};});
 const selections=config.filter(row=>row.key==="core.hookspath");if(selections.length>1)refuse("FIXED_HOOK_ROUTING");
 const directory=selections.length?path.resolve(root,/** @type {{value:string}} */(selections[0]).value):path.join(common,"hooks"),file=path.join(directory,"pre-push");
 const descriptor={version:1,product:physical(root,"directory"),directory:physical(directory,"directory"),file:physical(file,"file"),sha256:rendered.sha256,node:physical(rendered.node,"file"),
  nodeSha256:createHash("sha256").update(readFileSync(rendered.node)).digest("hex"),entry:rendered.entry,closure:rendered.closure};
 if(!(descriptor.file.mode&0o111)||!readFileSync(file).equals(Buffer.from(rendered.bytes)))refuse("FIXED_HOOK_BYTES");
 const proof=freeze({version:1,kind:"fixed-product-pre-push",descriptor});proofs.set(proof,{options:{productRoot:root,tool:options.tool},descriptor:structuredClone(descriptor)});return proof;
}
/** Only the in-process proof from the actual constructor is redeemable. Its
 * TOOL/physical route is re-read; serialized descriptors are equality data.
 * @param {any} proof @param {string} root */
export function validatedFixedProductPrePush(proof,root){
 const captured=proofs.get(proof);if(!captured||captured.descriptor.product.path!==root)refuse("FIXED_HOOK_PROOF_REQUIRED");
 const current=qualifyFixedProductPrePush(captured.options);
 if(operationContent(current.descriptor)!==operationContent(captured.descriptor))refuse("FIXED_HOOK_CHANGED");return current.descriptor;
}
