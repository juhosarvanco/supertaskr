/** External scratch construction for the exact planned PRODUCT/RECORDS cut.
 * No selected repository file, object, index, config or ref is written here.
 * This is preparation/validation, never a suite result or delivery authority.
 */
import {execFileSync} from "node:child_process";
import {mkdirSync,mkdtempSync,realpathSync,writeFileSync,rmSync} from "node:fs";
import os from "node:os";
import path from "node:path";
import {captureOperationRepository,checkOperationEnvironment} from "./durable-operation.mjs";
import {operationContent,operationDigest,operationPayload} from "./operation-record.mjs";
import {validQualifiedIntegrationPlan} from "./qualified-integration-record.mjs";
import {preparedQualifiedIntegrationPlan} from "./qualified-integration-plan.mjs";
import {assertInitialRepositoryConfiguration} from "./project-init-operation.mjs";
import {assertExactRecordTransformations,safeOperationWorkingPath} from "./record-write.mjs";
import {loadProjectSettings} from "./project-settings.mjs";
import {createRecordChecker,checkedRecordWriteSet,requireInstalledRuntimeAssets,verifyInstalledRecordTool} from "./records-check.mjs";
import {WORKSPACE_BINDING_REL_PATH,resolveWorkspace} from "./workspace.mjs";
const BLOB_LIMIT=32*1024*1024,EXPANDED_LIMIT=256*1024*1024,PACK_LIMIT=64*1024*1024;
/** @param {string} code @returns {never} */
function refuse(code){throw Object.assign(new Error(`${code}: exact planned scratch is unavailable`),{code});}
/** @param {any} a @param {any} b */
const same=(a,b)=>operationContent(a)===operationContent(b);
/** @param {string} root @param {string[]} args @param {Buffer|string|undefined} [input] */
function git(root,args,input){
 try{return execFileSync("git",["--no-replace-objects","-C",root,...args],{stdio:[input===undefined?"ignore":"pipe","pipe","pipe"],...(input===undefined?{}:{input}),maxBuffer:PACK_LIMIT,
  env:{...process.env,GIT_NO_LAZY_FETCH:"1",GIT_OPTIONAL_LOCKS:"0"}});}catch{refuse("QUALIFIED_INTEGRATION_SCRATCH_GIT");}
}
/** @param {string} root @param {string[]} args @param {Buffer|string|undefined} [input] */
const line=(root,args,input)=>git(root,args,input).toString("utf8").replace(/\n$/,"");
/** @param {Buffer} bytes */
function text(bytes){try{return new TextDecoder("utf-8",{fatal:true,ignoreBOM:true}).decode(bytes);}catch{refuse("QUALIFIED_INTEGRATION_SCRATCH_ENCODING");}}
/** Exact all-reachable object bounds precede packing and are repeated after
 * importing into the independent store. No user transport/clone program runs.
 * @param {string} root @param {string} revision */
function history(root,revision){
 const objects=line(root,["rev-list","--objects","--no-object-names",revision]).split("\n");
 if(!objects.length||objects.length>100000||objects.some(oid=>!/^[0-9a-f]{40}$/.test(oid))||new Set(objects).size!==objects.length)refuse("QUALIFIED_INTEGRATION_SCRATCH_OBJECT_LIMIT");
 const rows=text(git(root,["cat-file","--batch-check=%(objectname) %(objecttype) %(objectsize)"],`${objects.join("\n")}\n`)).split("\n");
 if(rows.pop()!==""||rows.length!==objects.length)refuse("QUALIFIED_INTEGRATION_SCRATCH_OBJECTS");
 let expanded=0;
 for(const [at,row] of rows.entries()){
  const m=/^([0-9a-f]{40}) (blob|tree|commit|tag) ([0-9]+)$/.exec(row),size=m?Number(m[3]):NaN;
  if(!m||m[1]!==objects[at]||!Number.isSafeInteger(size)||size<0)refuse("QUALIFIED_INTEGRATION_SCRATCH_OBJECTS");
  expanded+=size;if(expanded>EXPANDED_LIMIT||m[2]==="blob"&&size>BLOB_LIMIT)refuse("QUALIFIED_INTEGRATION_SCRATCH_OBJECT_LIMIT");
 }
 return objects.slice().sort();
}
/** @param {string} root @param {string} revision */
function entries(root,revision){
 const files=[],names=new Set();
 for(const row of text(git(root,["ls-tree","-r","-z",revision])).split("\0").filter(Boolean)){
  const m=/^(100644|100755) blob ([0-9a-f]{40})\t([\s\S]+)$/.exec(row);
  if(!m)refuse("QUALIFIED_INTEGRATION_SCRATCH_FILE_TYPE");
  const file=/** @type {string} */(m[3]),mode=/** @type {string} */(m[1]),oid=/** @type {string} */(m[2]);
  safeOperationWorkingPath(root,file);const normalized=file.normalize("NFC").toLowerCase();
  if(names.has(normalized))refuse("QUALIFIED_INTEGRATION_SCRATCH_PATH_ALIAS");names.add(normalized);
  files.push({path:file,mode,oid});
 }
 return files;
}
/** Source routing/physical family and exact selected target are bookended.
 * @param {any} role */
function original(role){
 if(!same(captureOperationRepository(role.repository.root,role.expectedRevision,{forEffect:false}),role.repository)||line(role.repository.root,["rev-parse",role.targetRef])!==role.expectedRevision)refuse("QUALIFIED_INTEGRATION_SCRATCH_SOURCE_CHANGED");
}
/** Build only inside a newly created owned external home. Configuration and
 * effective attributes are qualified; no alternates or source Gitdir copy.
 * @param {string} home @param {any} role */
function candidate(home,role){
 original(role);const sourceObjects=history(role.repository.root,role.expectedRevision),sourceFiles=entries(role.repository.root,role.expectedRevision);
 assertExactRecordTransformations(role.repository.root,[...new Set([...sourceFiles.map(f=>f.path),...role.writes.map((/** @type {any} */ w)=>w.path)])],role.expectedRevision);
 const pack=git(role.repository.root,["pack-objects","--stdout","--revs"],`${role.expectedRevision}\n`);
 if(pack.length>PACK_LIMIT)refuse("QUALIFIED_INTEGRATION_SCRATCH_PACK_LIMIT");original(role);
 mkdirSync(home,{mode:0o700});assertInitialRepositoryConfiguration(home);
 git(home,["init","--quiet","--template=","--object-format=sha1","--initial-branch=qualified-integration"]);
 git(home,["index-pack","--stdin","--strict"],pack);
 if(!same(history(home,role.expectedRevision),sourceObjects))refuse("QUALIFIED_INTEGRATION_SCRATCH_OBJECTS");
 git(home,["read-tree",role.expectedRevision]);
 for(const w of role.writes){
  safeOperationWorkingPath(home,w.path);
  if(w.operation==="delete")git(home,["update-index","--force-remove","--",w.path]);
  else{
   const blob=line(home,["hash-object","-w","--stdin"],Buffer.from(w.base64,"base64"));
   git(home,["update-index","--add","--cacheinfo",`${w.mode},${blob},${w.path}`]);
  }
 }
 if(line(home,["write-tree"])!==role.tree)refuse("QUALIFIED_INTEGRATION_SCRATCH_TREE");
 if(role.identity!==null){
  if(line(home,["hash-object","-w","-t","commit","--stdin"],Buffer.from(role.commitBase64,"base64"))!==role.commit)refuse("QUALIFIED_INTEGRATION_SCRATCH_COMMIT");
  if(!git(home,["cat-file","commit",role.commit]).equals(Buffer.from(role.commitBase64,"base64")))refuse("QUALIFIED_INTEGRATION_SCRATCH_COMMIT");
 }
 if(line(home,["rev-parse",`${role.commit}^{tree}`])!==role.tree)refuse("QUALIFIED_INTEGRATION_SCRATCH_TREE");
 git(home,["update-ref","refs/heads/qualified-integration",role.commit]);
 const files=entries(home,role.commit);assertExactRecordTransformations(home,files.map(f=>f.path),role.commit);
 // Raw materialization follows the now-qualified exact-byte policy, avoiding
 // checkout filters and hidden source configuration/hook copies.
 for(const file of files){const target=safeOperationWorkingPath(home,file.path),bytes=git(home,["cat-file","blob",file.oid]);
  if(bytes.length>BLOB_LIMIT)refuse("QUALIFIED_INTEGRATION_SCRATCH_OBJECT_LIMIT");
  mkdirSync(path.dirname(target),{recursive:true,mode:0o700});writeFileSync(target,bytes,{flag:"wx",mode:file.mode==="100755"?0o700:0o600});
 }
 git(home,["read-tree",role.commit]);git(home,["fsck","--strict","--no-reflogs","--no-dangling",role.commit]);
 const repository=captureOperationRepository(home,role.commit,{forEffect:false});
 if(!same(repository.rootCommits,role.repository.rootCommits))refuse("QUALIFIED_INTEGRATION_SCRATCH_HISTORY");
 original(role);return {root:home,files};
}
/** Prepare the exact future configuration/profile using the canonical owners.
 * It returns finite result content; scratch path/incarnation-dependent capture
 * digests are deliberately not replay identities. This never grades PRODUCT.
 * @param {any} proposal @param {{tool:any}} configuration */
export function captureQualifiedPlannedPolicy(proposal,configuration){
 if(!configuration||Object.keys(configuration).join()!=="tool")refuse("QUALIFIED_INTEGRATION_SCRATCH_CONFIGURATION");
 const tool=configuration.tool,plan=preparedQualifiedIntegrationPlan(proposal,tool);
 requireInstalledRuntimeAssets(tool,["qualified-integration-scratch","qualified-integration-plan","qualified-integration-record","record-write","project-init-operation","project-settings","records-check","workspace"].map(name=>`tools/e2e/scripts/${name}.mjs`));
 if(!validQualifiedIntegrationPlan(plan)||plan.recordsValidation.unmodeled.length)refuse("QUALIFIED_INTEGRATION_SCRATCH_PLAN");
 checkOperationEnvironment();const scratch=realpathSync(mkdtempSync(path.join(os.tmpdir(),"supertaskr-planned-policy-")));
 try{
  const product=plan.roles.find((/** @type {any} */ r)=>r.role==="product"),records=plan.roles.find((/** @type {any} */ r)=>r.role==="records");
  const p=candidate(path.join(scratch,"product"),product),r=candidate(path.join(scratch,"records"),records);
  const binding=path.join(p.root,WORKSPACE_BINDING_REL_PATH);mkdirSync(path.dirname(binding),{recursive:true,mode:0o700});
  writeFileSync(binding,`${JSON.stringify({version:1,projectId:plan.authority.projectId,productRoot:p.root,recordsRoot:r.root})}\n`,{flag:"wx",mode:0o600});
  const workspace=resolveWorkspace({productRoot:p.root,commit:product.commit});
  if(workspace.recordsRoot!==r.root)refuse("QUALIFIED_INTEGRATION_SCRATCH_ASSOCIATION");
  const loaded=loadProjectSettings({productRoot:p.root,productRevision:product.commit,tool});
  if(loaded.status!=="ready")refuse("QUALIFIED_INTEGRATION_DELIVERED_SETTINGS_PENDING");
  const checker=createRecordChecker({profile:loaded.settings.records.validation,tool}),capture=checker.capture({productRoot:p.root,productRevision:product.commit,recordsRevision:records.expectedRevision});
  const previous=new Set(line(r.root,["ls-tree","-r","--name-only",records.expectedRevision]).split("\n"));
  const evaluation=checker.evaluate(capture,records.writes.filter((/** @type {any} */ w)=>plan.recordsValidation.modeled.includes(w.path)).map((/** @type {any} */ w)=>w.operation==="delete"?{operation:"delete",path:w.path}:
   {operation:previous.has(w.path)?"edit":"add",path:w.path,type:"blob",mode:w.mode,bytes:Buffer.from(w.base64,"base64")}));
  if(!evaluation.accepted)refuse("QUALIFIED_INTEGRATION_DELIVERED_RECORDS_PENDING");
  const checked=checkedRecordWriteSet(evaluation),index=checked.writes.find((/** @type {any} */ w)=>w.derived&&w.path==="docs/INDEX.md")??checked.baseline.find((/** @type {any} */ w)=>w.path==="docs/INDEX.md");
  if(!index)refuse("QUALIFIED_INTEGRATION_DELIVERED_INDEX_PENDING");
  const actualIndex=line(r.root,["ls-tree","-z",records.commit,"--","docs/INDEX.md"]),selectedIndex=/^(100644|100755) blob ([0-9a-f]{40})\tdocs\/INDEX\.md\0$/.exec(actualIndex);
  if(!selectedIndex||selectedIndex[1]!==index.mode||!git(r.root,["cat-file","blob",/** @type {string} */(selectedIndex[2])]).equals(Buffer.from(index.bytes)))refuse("QUALIFIED_INTEGRATION_DELIVERED_INDEX_PENDING");
  const result={version:1,kind:"planned-delivered-policy",planDigest:operationDigest(plan),
   source:{product:{commit:product.commit,tree:product.tree},records:{previousRevision:records.expectedRevision,commit:records.commit,tree:records.tree}},
   configuration:{...loaded.provenance,productRoot:product.repository.root},settings:loaded.settings,profile:loaded.settings.records.validation,tool,
   candidate:{applied:evaluation.candidate.applied,inputs:evaluation.candidate.candidateInputs,paths:evaluation.candidate.paths},
   findings:{structuralAccepted:evaluation.structuralAccepted,wholeBoardClean:evaluation.wholeBoardClean,diagnostics:evaluation.diagnostics,introducedDiagnostics:evaluation.introducedDiagnostics,failures:evaluation.failures,
    blocking:evaluation.blocking,retained:evaluation.retained,warnings:evaluation.warnings,procedural:evaluation.procedural,baselineIndexStale:evaluation.baselineIndexStale},
   index:{path:"docs/INDEX.md",mode:index.mode,base64:Buffer.from(index.bytes).toString("base64")}};
  for(const role of plan.roles)original(role);verifyInstalledRecordTool(tool);
  return operationPayload({...result,digest:operationDigest(result)});
 }finally{rmSync(scratch,{recursive:true,force:true});}
}
