/** Finite installed asset constructor. This produces bytes, never installation,
 * hook trust, native registration, a method adoption or an effect permission.
 * Only the original opaque TOOL and original physical coordinator are inputs.
 */
import {execFileSync} from "node:child_process";
import {realpathSync} from "node:fs";
import path from "node:path";
import {captureOperationRepository,checkOperationEnvironment} from "./durable-operation.mjs";
import {operationContent,operationDigest} from "./operation-record.mjs";
import {listInstalledMethodAssets,readInstalledMethodAssets,installedRecordAsset,requireInstalledRuntimeAssets,verifyInstalledRecordTool} from "./records-check.mjs";
import {loadProjectSettings} from "./project-settings.mjs";
import {resolveWorkspace} from "./workspace.mjs";
import {renderFixedProductPrePush} from "./fixed-product-hook.mjs";
import {nativeProductHookContract,requireNativeProductHookTool,NATIVE_PRODUCT_HOOK_ENTRY} from "./native-product-hook.mjs";

const prepared=new WeakMap(),SKILLS=["supertaskr-interview","supertaskr-seat"];
/** @param {string} code @returns {never} */
function refuse(code){throw Object.assign(new Error(`${code}: project installation assets are unavailable`),{code});}
/** @param {any} value @returns {any} */
function freeze(value){if(value&&typeof value==="object"){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
/** Only backend canonical paths are quoted into fixed wrapper source.
 * @param {string} value */
const quote=value=>`'${value.replaceAll("'","'\\''")}'`;
/** @param {string} root @param {string[]} args */
function git(root,args){try{return execFileSync("git",["--no-replace-objects","-C",root,...args],{encoding:"utf8",stdio:["ignore","pipe","pipe"],env:{...process.env,GIT_NO_LAZY_FETCH:"1",GIT_OPTIONAL_LOCKS:"0"}}).replace(/\n$/,"");}catch{refuse("project-install-git");}}
/** @param {string} relative @param {string} text */
const blob=(relative,text)=>({path:relative,mode:"100644",base64:Buffer.from(text,"utf8").toString("base64")});

/** Read-only preparation. Pending/accepted installation consumers must still
 * prove exact preimages, original claims, current policy and accepted effects.
 * This does not turn file presence or a serialized plan into readiness.
 * @param {{productRoot:string,tool:any}} input */
export function captureProjectInstallAssets(input){
 if(!input||Object.keys(input).sort().join()!=="productRoot,tool"||typeof input.productRoot!=="string")refuse("project-install-request");
 checkOperationEnvironment();const tool=input.tool,root=realpathSync(input.productRoot);
 requireInstalledRuntimeAssets(tool,["project-install-assets","native-product-hook","fixed-product-hook","project-settings","workspace"].map(name=>`tools/e2e/scripts/${name}.mjs`));
 requireNativeProductHookTool(tool);
 const revision=git(root,["rev-parse","--verify","HEAD"]),repository=captureOperationRepository(root,revision,{forEffect:false});
 const workspace=resolveWorkspace({productRoot:root,mode:"development",commit:revision});
 if(workspace.layout!=="split"||workspace.association.status!=="verified")refuse("project-install-selected-records-required");
 const settings=loadProjectSettings({productRoot:root,productRevision:revision,tool});if(settings.status!=="ready")refuse("project-install-settings-required");
 const contract=nativeProductHookContract(),prePush=renderFixedProductPrePush({productRoot:root,tool}),origin=operationDigest(repository);
 const name=`native-${tool.manifestDigest}.sh`,relative=`supertaskr/native-hooks/${name}`;
 // The shared Git metadata route is portable across linked PRODUCT workers.
 // A changed TOOL changes the tracked command bytes, requiring ordinary host
 // review of the new hook hash. No trust/configuration flag is rendered.
 const command=`sh "$(git rev-parse --path-format=absolute --git-common-dir)/${relative}"`;
 const hooks=Object.fromEntries(contract.callbacks.map((/** @type {string} */ event)=>[event,[{
  ...(["PreToolUse","PostToolUse"].includes(event)?{matcher:`^(${contract.tools.join("|")})$`}:{}),
  hooks:[{type:"command",command,timeout:event==="Interrupt"?3:30}]}]]));
 const nativeEntry=installedRecordAsset(tool,NATIVE_PRODUCT_HOOK_ENTRY);
 const nativeBytes=`#!/bin/sh\nexec ${quote(prePush.node)} ${quote(nativeEntry)} --root ${quote(root)} --origin ${quote(origin)} --tool ${quote(tool.manifestDigest)}\n`;
 const members=listInstalledMethodAssets(tool).filter(member=>SKILLS.some(skill=>member.path.startsWith(`method/skills/${skill}/`)));
 if(SKILLS.some(skill=>!members.some(member=>member.path===`method/skills/${skill}/SKILL.md`)))refuse("project-install-skills-required");
 const assets=readInstalledMethodAssets(tool,members.map(member=>member.path));
 const product=[blob(".codex/hooks.json",JSON.stringify({hooks},null,2)+"\n"),...assets.map(asset=>blob(`.agents/skills/${asset.path.slice("method/skills/".length)}`,asset.text))];
 if(product.length>128||new Set(product.map(file=>file.path)).size!==product.length)refuse("project-install-asset-membership");
 const body={version:1,kind:"project-install-assets",productRoot:root,productRevision:revision,repository,
  recordsRoot:workspace.recordsRoot,association:workspace.association,tool,configuration:settings.provenance,
  product,metadata:[{role:"native-hook",path:path.join(repository.commonDir,relative),mode:0o700,base64:Buffer.from(nativeBytes).toString("base64")},
   {role:"pre-push",path:path.join(repository.commonDir,"hooks/pre-push"),mode:0o700,base64:Buffer.from(prePush.bytes).toString("base64")}],
  membership:members,readiness:{installed:false,hostTrust:"unestablished",nativeCallbacks:"unestablished"}};
 if(operationContent(captureOperationRepository(root,revision,{forEffect:false}))!==operationContent(repository)||git(root,["rev-parse","HEAD"])!==revision)refuse("project-install-origin-changed");
 verifyInstalledRecordTool(tool);const result=freeze({...body,digest:operationDigest(body)});prepared.set(result,{tool,root});return result;
}
/** Only the real in-process constructor result, still on its original TOOL.
 * @param {any} result @param {any} tool */
export function assertPreparedProjectInstallAssets(result,tool){
 const saved=prepared.get(result);if(!saved||saved.tool!==tool)refuse("project-install-preparation-required");
 const current=captureProjectInstallAssets({productRoot:saved.root,tool});
 if(operationContent(current)!==operationContent(result))refuse("project-install-assets-changed");return result;
}
