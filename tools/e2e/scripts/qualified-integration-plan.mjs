/** Read-only integration proposals. Original reviewed identities and RED are
 * immutable; a proposed resulting tree acquires no grade or effect authority.
 * Scratch objects/indexes never write into a selected repository object store.
 */
import {execFileSync,spawnSync} from "node:child_process";
import {createHash} from "node:crypto";
import {mkdtempSync,lstatSync,writeFileSync,rmSync,realpathSync} from "node:fs";
import os from "node:os";
import path from "node:path";
import * as runs from "./run-record.mjs";
import {captureQualifiedDeliveryAuthority,QualifiedDeliveryFinding} from "./qualified-delivery.mjs";
import {operationContent,operationDigest,operationPayload} from "./operation-record.mjs";
import {captureOperationRepository,captureQualifiedOperationRepository,readAcceptedOperation} from "./durable-operation.mjs";
import {qualifyFixedProductPrePush} from "./fixed-product-hook.mjs";
import {parseNativeRawDiff,nativePathAllowed} from "./native-codex.mjs";
import {captureExactCommitPlan,safeOperationWorkingPath,assertExactRecordTransformations} from "./record-write.mjs";
import {captureOperationCommitIdentity} from "./project-init-operation.mjs";
import {loadProjectSettings} from "./project-settings.mjs";
import {createRecordChecker,checkedRecordWriteSet,requireInstalledRuntimeAssets,verifyInstalledRecordTool} from "./records-check.mjs";
import {ordinaryRecordTextPath} from "./records-validation.mjs";
const plans=new WeakMap(),planTools=new WeakMap(),MAX_BLOB=32*1024*1024;
/** @param {string} code @returns {never} */
function refuse(code){throw new QualifiedDeliveryFinding(code);}
/** @param {any} v @param {string[]} fields */
const shape=(v,fields)=>v&&typeof v==="object"&&!Array.isArray(v)&&Object.keys(v).sort().join("\0")===[...fields].sort().join("\0");
/** @param {any} v */
const oid=v=>typeof v==="string"&&/^[0-9a-f]{40}$/.test(v);
/** @param {any} a @param {any} b */
const same=(a,b)=>operationContent(a)===operationContent(b);
/** @param {any} v @returns {any} */
function freeze(v){if(v&&typeof v==="object"){Object.values(v).forEach(freeze);Object.freeze(v);}return v;}
/** @param {string} root @param {string[]} args */
function git(root,args){try{return execFileSync("git",["--no-replace-objects","-C",root,...args],{stdio:["ignore","pipe","pipe"],maxBuffer:64*1024*1024,env:{...process.env,GIT_NO_LAZY_FETCH:"1",GIT_OPTIONAL_LOCKS:"0"}});}catch{refuse("QUALIFIED_INTEGRATION_GIT");}}
/** @param {string} root @param {string[]} args */
const line=(root,args)=>git(root,args).toString("utf8").replace(/\n$/,"");
/** @param {Uint8Array} bytes */
function text(bytes){try{return new TextDecoder("utf-8",{fatal:true,ignoreBOM:true}).decode(bytes);}catch{refuse("QUALIFIED_INTEGRATION_UTF8");}}
/** @param {string} file */
function directory(file){const s=lstatSync(file,{bigint:true});if(!s.isDirectory()||s.isSymbolicLink()||realpathSync(file)!==file)refuse("QUALIFIED_INTEGRATION_ORIGIN_CHANGED");return {path:file,device:String(s.dev),inode:String(s.ino)};}
/** @param {string} root @param {string} revision */
function tree(root,revision){
 const entries=new Map();for(const row of text(git(root,["ls-tree","-r","-z",revision])).split("\0").filter(Boolean)){
  const m=/^(\d+) (blob|commit) ([0-9a-f]{40})\t([\s\S]+)$/.exec(row);if(!m||entries.has(m[4]))refuse("QUALIFIED_INTEGRATION_TREE");entries.set(m[4],{mode:m[1],type:m[2],oid:m[3]});
 }return entries;
}
/** @param {string} root @param {any} entry */
function bytes(root,entry){if(!entry||entry.type!=="blob"||!["100644","100755"].includes(entry.mode))refuse("QUALIFIED_INTEGRATION_FILE_TYPE");const value=git(root,["cat-file","blob",entry.oid]);if(value.length>MAX_BLOB)refuse("QUALIFIED_INTEGRATION_BLOB_LIMIT");return value;}
/** @param {string} source @param {string} needle */
function positions(source,needle){const result=[];for(let at=source.indexOf(needle);at>=0;at=source.indexOf(needle,at+1))result.push(at);return result;}
/** Exact source conditions only. The verifier's committed spec bytes never
 * change. Wording-only conditions have no authoritative replacement bytes.
 * @param {string} root @param {Map<string,any>} output @param {any[]} corrections */
function corrected(root,output,corrections){
 const writes=new Map(),evidence=[];
 for(const c of corrections)if(c.wordingOnly===true)refuse("QUALIFIED_INTEGRATION_WORDING_PENDING");
 for(const file of new Set(corrections.map(c=>c.block.file))){
  const original=bytes(root,output.get(file)),source=text(original);
  /** @type {{at:number,end:number,replacement:string,apply:boolean}[]} */
  const spans=[];
  for(const c of corrections.filter(c=>c.block.file===file)){
   const b=c.block,body=bytes(root,output.get(b.spec));if(createHash("sha256").update(body).digest("hex")!==c.bodyHash)refuse("QUALIFIED_INTEGRATION_BODY_CHANGED");
   const before=positions(source,b.new),after=positions(source,b.old);
   if(!(before.length===1&&after.length===0||before.length===0&&after.length===1))refuse("QUALIFIED_INTEGRATION_ANCHOR_PENDING");
   const at=before.length?before[0]:after[0],length=before.length?b.new.length:b.old.length;
   if(at===undefined)refuse("QUALIFIED_INTEGRATION_ANCHOR_PENDING");
   if(spans.some(s=>at<s.end&&at+length>s.at))refuse("QUALIFIED_INTEGRATION_ANCHOR_PENDING");
   spans.push({at,end:at+length,replacement:b.old,apply:before.length===1});evidence.push({correction:c.correction,file,spec:b.spec,bodyHash:c.bodyHash,blockDigest:c.blockDigest,projection:before.length?"proposed-exact-anchor":"already-correct-in-reviewed-output",grade:"owed"});
  }
  let value=source;for(const s of spans.sort((a,b)=>b.at-a.at))if(s.apply)value=value.slice(0,s.at)+s.replacement+value.slice(s.end);
  writes.set(file,Buffer.from(value));
 }
 for(const c of corrections){const body=writes.get(c.block.spec)??bytes(root,output.get(c.block.spec));if(createHash("sha256").update(body).digest("hex")!==c.bodyHash)refuse("QUALIFIED_INTEGRATION_BODY_CHANGED");}
 return {writes,evidence};
}
/** Unknown user merge drivers are never invoked or silently bypassed.
 * @param {string} root @param {string[]} files */
function mergePolicy(root,files){
 const config=text(git(root,["config","--null","--list"])).split("\0").filter(Boolean);
 if(config.some(row=>/^merge\.(?:default|[^\n]+\.driver)\n/i.test(row)))refuse("QUALIFIED_INTEGRATION_MERGE_POLICY_UNSUPPORTED");
 const rows=files.length?text(git(root,["check-attr","-z","merge","--",...files])).split("\0"):[];
 for(let at=0;at<rows.length-1;at+=3){const value=rows[at+2];if(rows[at+1]!=="merge"||value===undefined||!["unspecified","text"].includes(value))refuse("QUALIFIED_INTEGRATION_MERGE_POLICY_UNSUPPORTED");}
 return operationDigest(rows);
}
/** Builtin three-way text merge in owned external files. Non-text/conflicting
 * inputs stay pending; no project driver or target file is executed/written.
 * @param {Buffer} ours @param {Buffer} base @param {Buffer} theirs */
function mergeText(ours,base,theirs){
 if([ours,base,theirs].some(b=>b.includes(0)))refuse("QUALIFIED_INTEGRATION_CONFLICT_PENDING");
 const temp=mkdtempSync(path.join(os.tmpdir(),"supertaskr-integration-merge-"));
 try{
  const names=["ours","base","theirs"].map(n=>path.join(temp,n));for(const [at,b] of [ours,base,theirs].entries()){const file=names[at];if(file===undefined)refuse("QUALIFIED_INTEGRATION_GIT");writeFileSync(file,b,{mode:0o600});}
  const result=spawnSync("git",["--no-replace-objects","merge-file","--stdout",...names],{cwd:temp,stdio:["ignore","pipe","pipe"],maxBuffer:MAX_BLOB,env:{...process.env,GIT_NO_LAZY_FETCH:"1",GIT_OPTIONAL_LOCKS:"0"}});
  if(result.error||result.status!==0)refuse("QUALIFIED_INTEGRATION_CONFLICT_PENDING");return result.stdout;
 }finally{rmSync(temp,{recursive:true,force:true});}
}
/** @param {any} role @param {any} target @param {any} correction */
function overlay(role,target,correction){
 const root=role.repository.filesystemRoot,base=tree(root,role.originalBase),actual=tree(root,role.actualOutput.commit),current=tree(root,target.expectedRevision);
 const changed=parseNativeRawDiff(git(root,["diff","--raw","-z","--no-abbrev","--no-renames",role.originalBase,role.actualOutput.commit,"--"]));
 const paths=new Set([...changed.flatMap(c=>c.paths),...correction.writes.keys()]),mergePolicyDigest=mergePolicy(root,[...paths]);const writes=[];
 for(const file of [...paths].sort()){
  safeOperationWorkingPath(root,file);const a=base.get(file),b=current.get(file),c=actual.get(file),proposed=correction.writes.get(file);
  let mode=c?.mode,value=c?proposed??bytes(root,c):null;
  if(same(b??null,a??null)){}
  else if(c&&b&&b.mode===c.mode&&bytes(root,b).equals(value))continue;
  else if(!a||!b||!c)refuse("QUALIFIED_INTEGRATION_CONFLICT_PENDING");
  else{
   if(b.mode!==a.mode&&c.mode!==a.mode&&b.mode!==c.mode)refuse("QUALIFIED_INTEGRATION_CONFLICT_PENDING");
   mode=c.mode===a.mode?b.mode:c.mode;value=mergeText(bytes(root,b),bytes(root,a),/** @type {Buffer} */(value));
  }
  if(value===null){if(b)writes.push({path:file,operation:"delete"});}
  else if(!b||mode!==b.mode||!bytes(root,b).equals(value))writes.push({path:file,operation:"write",mode,base64:value.toString("base64")});
 }
 return {writes,mergePolicyDigest};
}
/** Backend-only proposal capture. No byte overlay, authority, grade, program,
 * RECORDS root or policy switch can come from this request.
 * @param {string} coordinatorRoot @param {any} input @param {{tool:any}} configuration */
export async function captureQualifiedIntegrationPlan(coordinatorRoot,input,configuration){
 if(!shape(input,["operationId","executorAttempt","verifierAttempt","targets"])||typeof input.operationId!=="string"||!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(input.operationId)||!shape(input.targets,["product","records"])||!shape(configuration,["tool"]))refuse("QUALIFIED_INTEGRATION_REQUEST");
 for(const role of ["product","records"]){const t=input.targets[role];if(!shape(t,["ref","expectedRevision"])||typeof t.ref!=="string"||!/^refs\/heads\/[^\s]+$/.test(t.ref)||!oid(t.expectedRevision))refuse("QUALIFIED_INTEGRATION_REQUEST");}
 input=operationPayload(input);coordinatorRoot=realpathSync(coordinatorRoot);if(readAcceptedOperation(coordinatorRoot,input.operationId)!==null)refuse("QUALIFIED_INTEGRATION_ORIGINAL_OPERATION_REQUIRED");
 const tool=configuration.tool;requireInstalledRuntimeAssets(tool,["qualified-integration-plan","qualified-delivery","record-write","project-init-operation"].map(n=>`tools/e2e/scripts/${n}.mjs`));
 const authority=await captureQualifiedDeliveryAuthority(coordinatorRoot,{executorAttempt:input.executorAttempt,verifierAttempt:input.verifierAttempt}),source=/** @type {any} */(runs.readRecord(coordinatorRoot,authority.verifier.attempt));
 const p=authority.roles.find((/** @type {any} */ r)=>r.role==="product"),r=authority.roles.find((/** @type {any} */ r)=>r.role==="records");
 if(p.repository.filesystemRoot===r.repository.filesystemRoot)refuse("QUALIFIED_INTEGRATION_COLOCATED_PENDING");
 const settings=loadProjectSettings({productRoot:coordinatorRoot,productRevision:p.originalBase,tool});if(settings.status!=="ready")refuse("QUALIFIED_INTEGRATION_SETTINGS_UNAVAILABLE");
 const result=[];
 for(const role of authority.roles){
  const root=role.repository.filesystemRoot,target=input.targets[role.role];git(root,["check-ref-format",target.ref]);
  if(line(root,["rev-parse",target.ref])!==target.expectedRevision||line(root,["symbolic-ref","HEAD"])!==target.ref)refuse("QUALIFIED_INTEGRATION_STALE_DESTINATION");
  try{execFileSync("git",["--no-replace-objects","-C",root,"merge-base","--is-ancestor",role.originalBase,target.expectedRevision],{stdio:["ignore","pipe","pipe"]});}catch{refuse("QUALIFIED_INTEGRATION_BASE_HISTORY");}
  const hasOutput=role.actualOutput.tree!==line(root,["rev-parse",`${role.originalBase}^{tree}`])||authority.owedCorrections.some((/** @type {any} */ c)=>c.role===role.role);
  const repository=role.role==="product"&&hasOutput?captureQualifiedOperationRepository(root,target.expectedRevision,qualifyFixedProductPrePush({productRoot:root,tool})):captureOperationRepository(root,target.expectedRevision,{forEffect:hasOutput});
  if(!hasOutput){
   const tree=line(root,["rev-parse",`${target.expectedRevision}^{tree}`]);
   result.push({role:role.role,repository,originalBase:role.originalBase,candidate:role.candidate,reviewedOutput:role.actualOutput,expectedRevision:target.expectedRevision,targetRef:target.ref,writes:[],corrections:[],identity:null,message:null,tree,working:null,commit:target.expectedRevision,commitBase64:null,
    grade:{status:role.role==="product"?"not-owed":"owed",kind:role.role==="records"?"canonical-private-record-validation":"none",commit:target.expectedRevision,tree}});continue;
  }
  const projected=corrected(root,tree(root,role.actualOutput.commit),authority.owedCorrections.filter((/** @type {any} */ c)=>c.role===role.role)),merged=overlay(role,target,projected),writes=merged.writes;
  const current=tree(root,target.expectedRevision),resultBytes=(/** @type {string} */ file)=>{const w=writes.find(w=>w.path===file);if(w?.operation==="delete")refuse("QUALIFIED_INTEGRATION_BODY_CHANGED");return w?Buffer.from(w.base64,"base64"):bytes(root,current.get(file));};
  for(const c of authority.owedCorrections.filter((/** @type {any} */ c)=>c.role===role.role)){
   if(createHash("sha256").update(resultBytes(c.block.spec)).digest("hex")!==c.bodyHash)refuse("QUALIFIED_INTEGRATION_BODY_CHANGED");
   const property=text(resultBytes(c.block.file));if(positions(property,c.block.old).length!==1||positions(property,c.block.new).length!==0)refuse("QUALIFIED_INTEGRATION_ANCHOR_PENDING");
  }
  const policy=role.actualOutput.policy,allowed=[...policy.implementation,...policy.protocol];
  for(const w of writes)if(!nativePathAllowed(w.path,allowed)||nativePathAllowed(w.path,policy.excluded))refuse("QUALIFIED_INTEGRATION_OUTSIDE_SCOPE");
  if(writes.some(w=>path.posix.basename(w.path)===".gitattributes"))refuse("QUALIFIED_INTEGRATION_ATTRIBUTES_PENDING");
  assertExactRecordTransformations(root,writes.map(w=>w.path));assertExactRecordTransformations(root,writes.map(w=>w.path),target.expectedRevision);
  const identity=captureOperationCommitIdentity(root),message=`Integrate ${authority.taskId} reviewed output\n\nsupertaskr-delivery-integration: ${input.operationId}/${role.role}\n`,exact=captureExactCommitPlan(root,target.expectedRevision,writes,{identity,message});
  result.push({role:role.role,repository,originalBase:role.originalBase,candidate:role.candidate,reviewedOutput:role.actualOutput,expectedRevision:target.expectedRevision,targetRef:target.ref,writes,mergePolicyDigest:merged.mergePolicyDigest,corrections:projected.evidence,identity,message,...exact,grade:{status:"owed",kind:role.role==="records"?"canonical-private-record-validation":"original-product-policy",commit:exact.commit,tree:exact.tree}});
 }
 const records=result.find(v=>v.role==="records");if(!records)refuse("QUALIFIED_INTEGRATION_COMPLETE_SET");
 const checker=createRecordChecker({profile:settings.settings.records.validation,tool}),capture=checker.capture({productRoot:coordinatorRoot,productRevision:p.originalBase,recordsRevision:records.expectedRevision});
 const modeled=records.writes.filter(w=>ordinaryRecordTextPath(w.path)),unmodeled=records.writes.filter(w=>!ordinaryRecordTextPath(w.path)&&w.path!=="docs/INDEX.md").map(w=>w.path);
 const paths=new Set(line(r.repository.filesystemRoot,["ls-tree","-r","--name-only",records.expectedRevision]).split("\n"));
 const evaluation=checker.evaluate(capture,modeled.map(w=>w.operation==="delete"?{operation:"delete",path:w.path}:{operation:paths.has(w.path)?"edit":"add",path:w.path,type:"blob",mode:w.mode,bytes:Buffer.from(w.base64,"base64")}));
 if(!evaluation.accepted)refuse("QUALIFIED_INTEGRATION_RECORD_CHECK_PENDING");const checked=checkedRecordWriteSet(evaluation);
 const derived=checked.writes.find((/** @type {any} */ w)=>w.derived&&w.path==="docs/INDEX.md"),index=records.writes.find(w=>w.path==="docs/INDEX.md"),expectedIndex=derived?.bytes??checked.baseline.find((/** @type {any} */ w)=>w.path==="docs/INDEX.md")?.bytes;
 if(index&&(index.operation!=="write"||!expectedIndex||index.base64!==Buffer.from(expectedIndex).toString("base64")))refuse("QUALIFIED_INTEGRATION_INDEX_PENDING");
 // A PRODUCT delivery must present the exact canonical private INDEX before
 // publication. Generate only the canonical checker-owned write, preserving
 // the original reviewed authority and private-only completion behavior.
 const integrateIndex=result.find(v=>v.role==="product")?.grade.status==="owed"&&derived!==undefined;
 if(integrateIndex){
  const writes=[...records.writes];if(!index)writes.push({path:derived.path,operation:"write",mode:derived.mode,base64:Buffer.from(derived.bytes).toString("base64")});
  writes.sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0);
  const root=records.repository.root,identity=records.identity??captureOperationCommitIdentity(root),message=`Integrate ${authority.taskId} reviewed output\n\nsupertaskr-delivery-integration: ${input.operationId}/records\n`;
  assertExactRecordTransformations(root,writes.map(w=>w.path));assertExactRecordTransformations(root,writes.map(w=>w.path),records.expectedRevision);
  const exact=captureExactCommitPlan(root,records.expectedRevision,writes,{identity,message});
  Object.assign(records,{identity,message,writes,mergePolicyDigest:mergePolicy(root,writes.map(w=>w.path)),...exact,grade:{status:"owed",kind:"canonical-private-record-validation",commit:exact.commit,tree:exact.tree}});
 }
 const origins={docs:directory(path.join(r.repository.filesystemRoot,"docs")),runtime:directory(path.join(coordinatorRoot,".supertaskr"))};
 const contract=authority.frozenAuthority.preparation.card;if(!runs.qualifiedProtocolDrift(contract.text,text(bytes(r.repository.filesystemRoot,tree(r.repository.filesystemRoot,records.expectedRevision).get(contract.path)))))refuse("QUALIFIED_INTEGRATION_CONTRACT_CHANGED");
 const body={version:1,kind:"qualified-integration-plan",operationId:input.operationId,authority,tool,origins,source:{attempt:source.attempt,permissionDigest:source.permission.digest,configuredDispatch:source.native.qualified.origins.configuredDispatch??null},configuration:settings.provenance,targets:input.targets,roles:result,
  recordsValidation:{status:"proposed-validation",captureDigest:evaluation.captureDigest,candidateDigest:evaluation.candidateDigest,tree:records.tree,modeled:modeled.map(w=>w.path),unmodeled,retained:evaluation.retained,procedural:evaluation.procedural,indexDerivation:derived?{path:derived.path,mode:derived.mode,base64:Buffer.from(derived.bytes).toString("base64"),owed:integrateIndex?"planned integration":"coordinator completion"}:null}};
 verifyInstalledRecordTool(tool);if((await captureQualifiedDeliveryAuthority(coordinatorRoot,{executorAttempt:input.executorAttempt,verifierAttempt:input.verifierAttempt})).authorityDigest!==authority.authorityDigest)refuse("QUALIFIED_INTEGRATION_SOURCE_CHANGED");
 for(const role of result)if(!same(captureOperationRepository(role.repository.root,role.expectedRevision,{forEffect:false}),role.repository)||line(role.repository.root,["rev-parse",role.targetRef])!==role.expectedRevision)refuse("QUALIFIED_INTEGRATION_CONTEXT_CHANGED");
 for(const origin of Object.values(origins))if(!same(directory(origin.path),origin))refuse("QUALIFIED_INTEGRATION_ORIGIN_CHANGED");
 const plan=freeze(operationPayload(body)),summary=freeze({version:1,kind:"qualified-integration-proposal",operationId:input.operationId,digest:operationDigest(plan),roles:result.map(v=>({role:v.role,commit:v.commit,tree:v.tree,grade:v.grade.status})),authority:"proposal only; no grade, landing or delivery authority"});plans.set(summary,plan);planTools.set(summary,tool);return summary;
}
/** @param {any} proposal */
export function qualifiedIntegrationPlanData(proposal){const plan=plans.get(proposal);if(!plan)refuse("QUALIFIED_INTEGRATION_PROPOSAL_REQUIRED");return structuredClone(plan);}
/** The next backend constructor must use the actual plan and original TOOL,
 * not a deserialized plan or a caller's policy/settings assertion.
 * @param {any} proposal @param {any} tool */
export function preparedQualifiedIntegrationPlan(proposal,tool){
 if(planTools.get(proposal)!==tool)refuse("QUALIFIED_INTEGRATION_PROPOSAL_REQUIRED");
 verifyInstalledRecordTool(tool);return qualifiedIntegrationPlanData(proposal);
}
