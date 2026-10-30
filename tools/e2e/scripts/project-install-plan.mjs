/** Read-only first installation plan. Actual init/bank witnesses are required;
 * neither a blank kit nor a handcrafted manifest establishes completion.
 * This module writes no OP/claim, managed object/file/index/ref or hook trust.
 */
import {execFileSync} from "node:child_process";
import {lstatSync,realpathSync} from "node:fs";
import path from "node:path";
import {captureCompletedGenesisForInstallation} from "./genesis-bank-plan.mjs";
import {inspectProjectInitialization} from "./genesis-init-inspect.mjs";
import {captureProjectInstallAssets,assertPreparedProjectInstallAssets} from "./project-install-assets.mjs";
import {captureOperationRepository,readAcceptedOperation} from "./durable-operation.mjs";
import {captureOperationCommitIdentity} from "./project-init-operation.mjs";
import {captureExactCommitPlan,safeOperationWorkingPath} from "./record-write.mjs";
import {operationContent,operationDigest,operationPayload} from "./operation-record.mjs";
import {createRecordChecker,checkedRecordWriteSet,requireInstalledRuntimeAssets,verifyInstalledRecordTool} from "./records-check.mjs";
import {validProjectInstallRequest} from "./project-install-record.mjs";

const prepared=new WeakMap(),ADOPTION_HEADING="## Supertaskr method";
/** @param {string} code @returns {never} */
function refuse(code){throw Object.assign(new Error(`${code}: project installation preparation is unavailable`),{code});}
/** @param {any} value @returns {any} */
function freeze(value){if(value&&typeof value==="object"){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
/** @param {any} a @param {any} b */
const same=(a,b)=>operationContent(a)===operationContent(b);
/** @param {string} root @param {string[]} args */
function git(root,args){try{return execFileSync("git",["--no-replace-objects","-C",root,...args],{maxBuffer:8*1024*1024,stdio:["ignore","pipe","pipe"],env:{...process.env,GIT_NO_LAZY_FETCH:"1",GIT_OPTIONAL_LOCKS:"0"}});}catch{refuse("project-install-repository");}}
/** @param {string} root @param {string[]} args */
const line=(root,args)=>git(root,args).toString("utf8").replace(/\n$/,"");
/** @param {Buffer} bytes */
function utf8(bytes){try{return new TextDecoder("utf-8",{fatal:true}).decode(bytes);}catch{refuse("project-install-record-encoding");}}
/** Exact adoption belongs in this project's records, not in the blank METHOD
 * template or another project's development instructions. No legacy command
 * spelling or second normative dispatch-row table is installed here.
 * @param {string} source @param {any} tool */
function firstAdoption(source,tool){
 if(/(?:^|\n)## Supertaskr method(?:\r?\n|$)/.test(source))refuse("project-install-existing-adoption");
 return `${source.trimEnd()}\n\n${ADOPTION_HEADING}\n\nAdopted method: ${tool.methodVersion}\nMethod digest: ${tool.methodDigest}\nInstalled TOOL: ${tool.manifestDigest}\n\nResolve this project's selected private records before reading its standing STATE and INDEX.\nUse the installed configured dispatch and delivery commands; their committed settings and original run records own authority.\nOrdinary private edits use the selected records checker and save service. They trigger no product suites, builds or publication.\nHook definitions require the host's normal trust review. Installation alone does not establish native callback readiness.\n`;
}
/** @param {string} file */
function absent(file){
 let p=file;while(p!==path.dirname(p)){
  try{const stat=lstatSync(p);if(p===file)refuse("project-install-foreign-asset");if(!stat.isDirectory()||stat.isSymbolicLink())refuse("project-install-foreign-path");}
  catch(error){if(/** @type {NodeJS.ErrnoException} */(error).code!=="ENOENT")throw error;}
  p=path.dirname(p);
 }
}
/** Backend-only first installation; method upgrade/adoption must use a future
 * explicit original-receipt constructor, never this new-only route.
 * @param {{productRoot:string,operationId:string,tool:any}} input */
export function prepareProjectInstallation(input){
 if(!input||Object.keys(input).sort().join()!=="operationId,productRoot,tool"||typeof input.productRoot!=="string"||typeof input.operationId!=="string"||!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(input.operationId))refuse("project-install-request");
 const tool=input.tool;
 requireInstalledRuntimeAssets(tool,["project-install-plan","project-install-record","project-install-assets","genesis-bank-plan","genesis-init-inspect","record-write","records-check"].map(name=>`tools/e2e/scripts/${name}.mjs`));
 const root=realpathSync(input.productRoot);
 if(readAcceptedOperation(root,input.operationId)!==null)refuse("project-install-existing-operation");
 const baseline=captureCompletedGenesisForInstallation({productRoot:root,tool}),inspected=inspectProjectInitialization({productRoot:root,tool}),current=inspected.current;
 if(!same(baseline.revisions,{product:current.productRevision,records:current.recordsRevision}))refuse("project-install-baseline-changed");
 for(const role of ["product","records"]){
  if(line(current[role].root,["status","--porcelain=v1","--untracked-files=all"])!=="")refuse("project-install-working-dirty");
  if(!same(captureOperationRepository(current[role].root,current[`${role}Revision`]),current[role]))refuse("project-install-policy-changed");
 }
 const assets=captureProjectInstallAssets({productRoot:root,tool});
 for(const file of assets.product)absent(safeOperationWorkingPath(root,file.path));
 for(const file of assets.metadata)absent(safeOperationWorkingPath(current.product.commonDir,path.relative(current.product.commonDir,file.path)));
 const conventions=git(current.records.root,["show",`${current.recordsRevision}:docs/CONVENTIONS.md`]);
 if(conventions.length>1024*1024)refuse("project-install-conventions-limit");
 const adoption=firstAdoption(utf8(conventions),tool),checker=createRecordChecker({tool,profile:inspected.settings.records.validation});
 const capture=checker.capture({productRoot:root,productRevision:current.productRevision,recordsRevision:current.recordsRevision});
 const checked=checker.evaluate(capture,[{operation:"edit",path:"docs/CONVENTIONS.md",type:"blob",mode:"100644",bytes:Buffer.from(adoption)}]);
 if(!checked.accepted)refuse("project-install-records-check-refused");
 const writes=checkedRecordWriteSet(checked).writes.map((/** @type {any} */ file)=>({operation:file.operation,path:file.path,mode:file.mode,base64:Buffer.from(file.bytes).toString("base64"),derived:file.derived}));
 if(writes.some((/** @type {any} */ file)=>file.path!=="docs/CONVENTIONS.md"&&!(file.derived&&file.path==="docs/INDEX.md")))refuse("project-install-records-write-membership");
 const identity=captureOperationCommitIdentity(root),rMessage=`Adopt installed project method ${tool.methodVersion}\n\nsupertaskr-project-install: ${input.operationId}/records\n`;
 const records={repository:current.records,targetRef:line(current.records.root,["symbolic-ref","HEAD"]),expectedRevision:current.recordsRevision,writes,...captureExactCommitPlan(current.records.root,current.recordsRevision,writes,{identity,message:rMessage}),message:rMessage};
 const productWrites=assets.product.map((/** @type {any} */ file)=>({operation:"add",...file,derived:false}));
 const pMessage=`Install project method ${tool.methodVersion}\nsupertaskr-records-install: ${records.commit}\n\nsupertaskr-project-install: ${input.operationId}/product\n`;
 const product={repository:current.product,targetRef:line(root,["symbolic-ref","HEAD"]),expectedRevision:current.productRevision,writes:productWrites,...captureExactCommitPlan(root,current.productRevision,productWrites,{identity,message:pMessage}),message:pMessage};
 const request=freeze(operationPayload({version:1,kind:"project-install",operationId:input.operationId,tool,baseline,assets,
  input:{productRevision:current.productRevision,recordsRevision:current.recordsRevision,productRepository:current.product,recordsRepository:current.records,docsIdentity:current.docs,runtimeIdentity:current.runtime,settingsProvenance:inspected.settingsProvenance},
  installation:{mode:"first",validation:{profile:checker.profile,captureDigest:capture.digest,candidateDigest:checked.candidateDigest,writeSetDigest:operationDigest(writes)}},plans:{records,product}}));
 if(!validProjectInstallRequest(request))refuse("project-install-plan-invalid");
 assertPreparedProjectInstallAssets(assets,tool);
 if(!same(inspectProjectInitialization({productRoot:root,tool}),inspected)||!same(captureCompletedGenesisForInstallation({productRoot:root,tool}),baseline))refuse("project-install-current-changed");
 for(const file of assets.metadata)absent(file.path);
 verifyInstalledRecordTool(tool);prepared.set(request,{tool,assets,baseline});return freeze({request,digest:operationDigest(request),readiness:{status:"planned",hostTrust:"unestablished",nativeCallbacks:"unestablished"}});
}
/** In-process provenance only. Full execution/replay policy is separately owed.
 * @param {any} request @param {any} tool */
export function assertPreparedProjectInstallation(request,tool){
 const original=prepared.get(request);if(!original||original.tool!==tool)refuse("project-install-preparation-required");
 assertPreparedProjectInstallAssets(original.assets,tool);verifyInstalledRecordTool(tool);return request;
}
