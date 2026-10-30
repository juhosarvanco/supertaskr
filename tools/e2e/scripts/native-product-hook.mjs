/** Fixed installed native-hook transport. Backend-rendered argv binds the
 * original coordinator and TOOL; stdin never supplies a root/program/schema.
 * This module installs/trusts nothing and does not claim host readiness. */
import { execFileSync } from "node:child_process";
import { readSync, realpathSync } from "node:fs";
import path from "node:path";
import { isMain } from "../../../cli/is-main.mjs";
import { captureOperationRepository } from "./durable-operation.mjs";
import { operationDigest } from "./operation-record.mjs";
import { loadInstalledRecordTool, requireInstalledRuntimeAssets } from "./records-check.mjs";
import { handleNativeEvent, NATIVE_COVERED_CALLBACKS, NATIVE_SUPPORTED_TOOLS } from "./native-codex.mjs";
import { blockingOutput } from "./native-codex-hook.mjs";

export const NATIVE_PRODUCT_HOOK_ENTRY="tools/e2e/scripts/native-product-hook.mjs";
export const NATIVE_PRODUCT_HOOK_INPUT_LIMIT=16*1024*1024;
const RUNTIME=[NATIVE_PRODUCT_HOOK_ENTRY,...["native-codex-hook","native-codex","qualified-native","qualified-verification","qualified-reservation","qualified-admission","configured-dispatch"].map(name=>`tools/e2e/scripts/${name}.mjs`)];
/** The installer and actual callback qualify one canonical native closure.
 * This grants neither installation nor trust/registration. @param {any} tool */
export function requireNativeProductHookTool(tool){return requireInstalledRuntimeAssets(tool,RUNTIME);}
/** Canonical native callback coverage, not a host observation or an installer.
 * The consumer must retain actual host identity and ordinary user trust.
 */
export function nativeProductHookContract(){return Object.freeze({version:1,entry:NATIVE_PRODUCT_HOOK_ENTRY,
 callbacks:NATIVE_COVERED_CALLBACKS,tools:NATIVE_SUPPORTED_TOOLS,readiness:"unestablished",requiresUserTrust:true});}
/** @param {string} code @returns {never} */
function refuse(code){throw Object.assign(new Error(code),{code});}
/** @param {string[]} argv */
function fixed(argv){
 if(argv.length!==6||argv[0]!=="--root"||argv[2]!=="--origin"||argv[4]!=="--tool"||!argv[1]||!path.isAbsolute(argv[1])||
  /[\x00-\x1f\x7f-\x9f]/.test(argv[1])||!/^sha256:[0-9a-f]{64}$/.test(argv[3]??"")||!/^[0-9a-f]{64}$/.test(argv[5]??""))refuse("native-product-hook-arguments");
 const root=realpathSync(argv[1]);if(root!==argv[1])refuse("native-product-hook-root");return {root,origin:argv[3],tool:argv[5]};
}
function eventInput(){
 const chunks=[],buffer=Buffer.alloc(8192);let count,total=0;
 while((count=readSync(0,buffer,0,buffer.length,null))!==0){total+=count;if(total>NATIVE_PRODUCT_HOOK_INPUT_LIMIT)refuse("native-product-hook-input-limit");chunks.push(Buffer.from(buffer.subarray(0,count)));}
 const input=JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(Buffer.concat(chunks)));
 if(!input||typeof input!=="object"||Array.isArray(input)||!NATIVE_COVERED_CALLBACKS.includes(input.hook_event_name))refuse("native-product-hook-event");return input;
}
/** @param {string[]} argv */
export function main(argv){
 /** @type {any} */let event=null;
 try{
  const expected=fixed(argv);event=eventInput();
  const tool=loadInstalledRecordTool();requireNativeProductHookTool(tool);
  if(tool.manifestDigest!==expected.tool)refuse("native-product-hook-tool");
  const head=execFileSync("git",["--no-replace-objects","-C",expected.root,"rev-parse","--verify","HEAD"],{encoding:"utf8",stdio:["ignore","pipe","pipe"],env:{...process.env,GIT_NO_LAZY_FETCH:"1",GIT_OPTIONAL_LOCKS:"0"}}).replace(/\n$/,"");
  if(operationDigest(captureOperationRepository(expected.root,head,{forEffect:false}))!==expected.origin)refuse("native-product-hook-origin");
  const result=handleNativeEvent(expected.root,event);if(result.output!==null)process.stdout.write(`${JSON.stringify(result.output)}\n`);return 0;
 }catch(error){
  const code=/** @type {any} */(error).code??"native-product-hook-unavailable";
  process.stdout.write(`${JSON.stringify(blockingOutput(event,`NATIVE HOLD: fixed hook context unavailable (${code})`))}\n`);return 2;
 }
}
if(isMain(import.meta))process.exitCode=main(process.argv.slice(2));
