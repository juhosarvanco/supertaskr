/** Actual planned-output grading authority for a finalized original source.
 * Only its fixed worker can construct this handle; ACTIVE grading is separate.
 * The canonical gate owns reporter interpretation and aggregate correspondence.
 */
import {execFileSync} from "node:child_process";
import {readFileSync,lstatSync,fstatSync,fchmodSync,realpathSync,openSync,writeFileSync,fsyncSync,closeSync,constants} from "node:fs";
import {createHash} from "node:crypto";
import path from "node:path";
import {readAcceptedOperation,captureOperationRepository} from "./durable-operation.mjs";
import {operationContent,operationDigest,operationPayload} from "./operation-record.mjs";
import {captureConfiguredDispatchForRun,createConfiguredDispatchGateRunner,verifyConfiguredDispatch} from "./configured-dispatch.mjs";
import {loadQualifiedDeliveryPolicy} from "./qualified-admission.mjs";
import {assertQualifiedDeliveryContinuation} from "./qualified-delivery-operation.mjs";
import {captureQualifiedIntegrationWorkerProof} from "./qualified-integration-process.mjs";
import {qualifiedIntegrationWorkspaceMarker} from "./qualified-integration-record.mjs";
import {assertExactRecordTransformations} from "./record-write.mjs";
import {requireInstalledRuntimeAssets,verifyInstalledRecordTool} from "./records-check.mjs";
import {withNativeTransaction,syncNativeFileNamespace} from "./native-codex.mjs";
const authorities=new WeakMap();
/** @param {string} code @returns {never} */
function refuse(code){throw Object.assign(new Error(`${code}: actual planned grading is unavailable`),{code});}
/** @param {any} a @param {any} b */
const same=(a,b)=>operationContent(a)===operationContent(b);
/** @param {string} root @param {string[]} args */
function git(root,args){try{return execFileSync("git",["--no-replace-objects","-C",root,...args],{stdio:["ignore","pipe","pipe"],maxBuffer:32*1024*1024,env:{...process.env,GIT_NO_LAZY_FETCH:"1",GIT_OPTIONAL_LOCKS:"0"}});}catch{refuse("QUALIFIED_INTEGRATION_WORKSPACE_GIT");}}
/** @param {string} root @param {string[]} args */
const line=(root,args)=>git(root,args).toString("utf8").replace(/\n$/,"");
/** @param {any} expected */
function directory(expected){const s=lstatSync(expected.path,{bigint:true});if(!s.isDirectory()||s.isSymbolicLink()||realpathSync(expected.path)!==expected.path||String(s.dev)!==expected.device||String(s.ino)!==expected.inode)refuse("QUALIFIED_INTEGRATION_WORKSPACE_CHANGED");}
/** No-follow exact immutable artifact, including final path/inode/bytes.
 * @param {any} expected @returns {Buffer} */
function artifact(expected){
 const fd=openSync(expected.path,constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);
 try{
  const before=fstatSync(fd,{bigint:true});
  if(!before.isFile()||before.nlink!==1n||String(before.dev)!==expected.device||String(before.ino)!==expected.inode||Number(before.mode&0o777n)!==expected.fileMode||before.size!==BigInt(expected.byteLength))refuse("QUALIFIED_INTEGRATION_ARTIFACT_CHANGED");
  const bytes=readFileSync(fd),after=fstatSync(fd,{bigint:true}),selected=lstatSync(expected.path,{bigint:true});
  if(before.dev!==after.dev||before.ino!==after.ino||before.size!==after.size||after.nlink!==1n||!selected.isFile()||selected.isSymbolicLink()||selected.dev!==after.dev||selected.ino!==after.ino||selected.nlink!==1n||bytes.length!==expected.byteLength||createHash("sha256").update(bytes).digest("hex")!==expected.sha256)refuse("QUALIFIED_INTEGRATION_ARTIFACT_CHANGED");
  return bytes;
 }finally{closeSync(fd);}
}
/** Every suite sees the exact independent clean whole candidate. Ignored
 * untracked dependencies are not silently adopted as qualified setup inputs.
 * @param {any} rec @param {any} launch */
export function assertQualifiedIntegrationWorkspace(rec,launch){
 const plan=rec.operation.request.integration.plan,p=plan.roles.find((/** @type {any} */ r)=>r.role==="product"),w=rec.operation.integration.workspaces[launch.workspaceSequence-1];
 if(!w||w.phase!=="ready"||!w.directory||!w.repository||!w.marker)refuse("QUALIFIED_INTEGRATION_WORKSPACE_UNAVAILABLE");
 directory(w.directory);if(!artifact(w.marker).equals(Buffer.from(qualifiedIntegrationWorkspaceMarker(plan.operationId,operationDigest(plan),w.token))))refuse("QUALIFIED_INTEGRATION_WORKSPACE_MARKER");
 if(!same(captureOperationRepository(w.repository.root,p.commit),w.repository)||line(w.repository.root,["rev-parse","HEAD"])!==p.commit||line(w.repository.root,["rev-parse","HEAD^{tree}"])!==p.tree)refuse("QUALIFIED_INTEGRATION_WORKSPACE_CHANGED");
 if(git(w.repository.root,["status","--porcelain=v1","-z","--untracked-files=all","--ignored"]).length)refuse("QUALIFIED_INTEGRATION_WORKSPACE_INPUTS_UNAVAILABLE");
 const paths=git(w.repository.root,["ls-tree","-r","-z","--name-only",p.commit]).toString("utf8").split("\0").filter(Boolean);
 assertExactRecordTransformations(w.repository.root,paths,p.commit);return w;
}
/** @param {any} state */
function current(state){
 requireInstalledRuntimeAssets(state.tool,["qualified-integration-grade","qualified-integration-process","qualified-integration-worker","qualified-integration-launch","qualified-integration-record","qualified-delivery-operation","qualified-admission","configured-dispatch","gate-run"].map(name=>`tools/e2e/scripts/${name}.mjs`));
 verifyInstalledRecordTool(state.tool);const rec=readAcceptedOperation(state.root,state.id,"qualified-delivery"),launch=rec?.operation.integration?.launches.at(-1);
 if(!rec||rec.operation.digest!==state.requestDigest||!launch||launch.token!==state.token||!same(rec.operation.owner,state.owner)||launch.suite!==state.suite||!same(rec.operation.request.integration.plan.tool,state.tool))refuse("QUALIFIED_INTEGRATION_GRADE_CHANGED");
 const capsule=verifyConfiguredDispatch(state.dispatch);
 if(!same(capsule,rec.operation.request.integration.plan.source.configuredDispatch))refuse("QUALIFIED_INTEGRATION_POLICY_CHANGED");
 const proof=captureQualifiedIntegrationWorkerProof(rec);assertQualifiedDeliveryContinuation(state.root,rec,{tool:state.tool},proof);
 const workspace=assertQualifiedIntegrationWorkspace(rec,launch);
 if(!same(state.candidate,{productRoot:workspace.repository.root,commit:state.product.commit,tree:state.product.tree}))refuse("QUALIFIED_INTEGRATION_GRADE_CANDIDATE_CHANGED");
 return {rec,launch,workspace};
}
/** Only the actual fixed thread/root/OP/token can obtain a backend authority.
 * There is no program, policy, suite or grade argument on this constructor.
 * @param {string} root @param {string} id @param {string} token @param {{tool:any}} configuration */
export async function captureQualifiedIntegrationGradeAuthority(root,id,token,configuration){
 if(!configuration||Object.keys(configuration).join()!=="tool")refuse("QUALIFIED_INTEGRATION_GRADE_CONFIGURATION");
 requireInstalledRuntimeAssets(configuration.tool,["qualified-integration-grade","qualified-integration-process","qualified-integration-worker","qualified-integration-launch"].map(name=>`tools/e2e/scripts/${name}.mjs`));
 root=realpathSync(root);const rec=readAcceptedOperation(root,id,"qualified-delivery"),launch=rec?.operation.integration?.launches.at(-1);
 if(!rec||rec.operation.request.route.name!=="protected-planned-output-v1"||!launch||launch.token!==token)refuse("QUALIFIED_INTEGRATION_GRADE_REQUIRED");
 captureQualifiedIntegrationWorkerProof(rec);await loadQualifiedDeliveryPolicy();
 const retained=await captureConfiguredDispatchForRun(root,rec.operation.request.authority.verifier.attempt,configuration),product=rec.operation.request.integration.plan.roles.find((/** @type {any} */ r)=>r.role==="product"),workspace=rec.operation.integration.workspaces[launch.workspaceSequence-1];
 const state={root,id,token,requestDigest:rec.operation.digest,owner:structuredClone(rec.operation.owner),suite:launch.suite,tool:configuration.tool,dispatch:retained.handle,source:retained.source,product,
  candidate:{productRoot:workspace.repository.root,commit:product.commit,tree:product.tree},executing:false,result:null};
 current(state);const handle=Object.freeze({version:1,kind:"planned-integration-grade"});authorities.set(handle,state);return handle;
}
/** The new kind selects this private validator, never an exemption. Cloned
 * metadata cannot satisfy its WeakMap or actual current fixed-thread proof.
 * @param {object} handle @param {any} expected */
export function assertQualifiedIntegrationGradeAuthority(handle,expected){
 const state=authorities.get(handle);if(!state||!state.executing)refuse("QUALIFIED_INTEGRATION_GRADE_AUTHORITY_REQUIRED");
 if(!same(expected,{...state.candidate,policy:state.dispatch.capsule.gatePolicy}))refuse("QUALIFIED_INTEGRATION_GRADE_CONTEXT_CHANGED");
 current(state);return true;
}
/** One original stored suite, actual canonical commands/reporters. Actual
 * unavailable/RED captures are preserved; no partial result becomes whole.
 * @param {object} handle */
export function runQualifiedIntegrationGrade(handle){
 const state=authorities.get(handle);if(!state||state.executing||state.result!==null)refuse("QUALIFIED_INTEGRATION_GRADE_AUTHORITY_REQUIRED");
 return withNativeTransaction(state.root,{operation:"qualified-integration-suite"},()=>{
  current(state);state.executing=true;
  try{
   const runner=createConfiguredDispatchGateRunner(state.dispatch,{productRoot:state.candidate.productRoot,productRevision:state.candidate.commit},handle),result=runner.run([state.suite]);
   current(state);state.result=operationPayload(result);return state.result;
  }finally{state.executing=false;}
 });
}
/** Persist actual output to its one immutable owned path. An existing or
 * interrupted file is preserved and cannot be overwritten on this launch.
 * @param {object} handle */
export function writeQualifiedIntegrationGradeArtifact(handle){
 const state=authorities.get(handle);if(!state||state.executing||state.result===null)refuse("QUALIFIED_INTEGRATION_GRADE_RESULT_REQUIRED");
 return withNativeTransaction(state.root,{operation:"qualified-integration-artifact"},()=>{
  const {rec,launch,workspace}=current(state),row=state.result.capture?.suites?.[0];
  const value={version:1,kind:"planned-suite-result",operationId:state.id,requestDigest:rec.operation.digest,planDigest:rec.operation.request.integration.digest,launchSequence:launch.sequence,launchToken:launch.token,workspaceSequence:launch.workspaceSequence,
   suite:state.suite,source:state.source,code:state.result.code,capture:state.result.capture},bytes=Buffer.from(`${operationContent(value)}\n`);
  if(bytes.length>64*1024*1024)refuse("QUALIFIED_INTEGRATION_ARTIFACT_LIMIT");
  const file=path.join(workspace.path,`result-${launch.sequence}.json`),fd=openSync(file,constants.O_WRONLY|constants.O_CREAT|constants.O_EXCL|constants.O_NOFOLLOW,0o600);
  let created;
  try{fchmodSync(fd,0o600);writeFileSync(fd,bytes);fsyncSync(fd);created=fstatSync(fd,{bigint:true});}finally{closeSync(fd);}
  syncNativeFileNamespace(file);const s=created,descriptor={path:file,device:String(s.dev),inode:String(s.ino),fileMode:Number(s.mode&0o777n),byteLength:bytes.length,sha256:createHash("sha256").update(bytes).digest("hex")};
  if(!artifact(descriptor).equals(bytes))refuse("QUALIFIED_INTEGRATION_ARTIFACT_CHANGED");
  return {artifact:descriptor,rowDigest:operationDigest(row??null),code:state.result.code};
 });
}
