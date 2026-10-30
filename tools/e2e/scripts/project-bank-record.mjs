/** Strict finite project-bank data in the existing canonical OP namespace.
 * This definition grants no effects; the constructor and executor separately
 * prove current setup/session policy and exact filesystem/object ownership.
 */
import {createHash} from "node:crypto";
import path from "node:path";
import {parseDocument} from "yaml";
import {isDeliveryBranchRef} from "../../../lib/parser/dist/pure.js";
import {operationContent,operationDigest,operationPayload,operationWork} from "./operation-record.mjs";
import {captureGenesisBankProposal,GENESIS_BANK_PROPOSAL} from "./genesis-bank-proposal.mjs";
import {GENESIS_PRODUCT_PROPOSAL,captureGenesisAnswerReferences} from "./genesis-proposal.mjs";
import {normalizeRecordProfile} from "./records-validation.mjs";
const ROLES=["product","records"];
/** @param {any} value @param {string[]} fields */
const shape=(value,fields)=>value&&typeof value==="object"&&!Array.isArray(value)&&Object.keys(value).sort().join("\0")===[...fields].sort().join("\0");
/** @param {any} value */
const identifier=value=>typeof value==="string"&&/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(value);
/** @param {any} value */
const digest=value=>typeof value==="string"&&/^sha256:[0-9a-f]{64}$/.test(value);
/** @param {any} value */
const sha=value=>typeof value==="string"&&/^[0-9a-f]{64}$/.test(value);
/** @param {any} value */
const absolute=value=>typeof value==="string"&&value.length<=16384&&path.isAbsolute(value)&&!/[\x00-\x1f\x7f]/.test(value);
/** @param {any} value */
const relative=value=>typeof value==="string"&&value.length<=4096&&!path.posix.isAbsolute(value)&&!path.win32.isAbsolute(value)&&!/[\\\x00-\x1f\x7f]/.test(value)&&value.split("/").every(p=>p&&![".","..",".git",".supertaskr"].includes(p));
/** @param {any} value @param {string|undefined} [format] */
const oid=(value,format)=>typeof value==="string"&&(format==="sha1"?/^[0-9a-f]{40}$/:format==="sha256"?/^[0-9a-f]{64}$/:/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/).test(value);
/** @param {any} value */
const instant=value=>typeof value==="string"&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value)&&Number.isFinite(Date.parse(value));
/** @param {any} value */
const base64=value=>typeof value==="string"&&value.length<=24*1024*1024&&Buffer.from(value,"base64").toString("base64")===value;
/** @param {Uint8Array} bytes */
const hash=bytes=>createHash("sha256").update(bytes).digest("hex");
/** @param {any} a @param {any} b */
const same=(a,b)=>operationContent(a)===operationContent(b);
/** @param {any} value */
function directory(value){return shape(value,["path","device","inode"])&&absolute(value.path)&&[value.device,value.inode].every(n=>typeof n==="string"&&/^[0-9]{1,64}$/.test(n));}
/** @param {any} value */
function repository(value){
 return shape(value,["root","gitDir","commonDir","objectFormat","rootCommits","identities"])&&[value.root,value.gitDir,value.commonDir].every(absolute)&&
  ["sha1","sha256"].includes(value.objectFormat)&&Array.isArray(value.rootCommits)&&value.rootCommits.length>0&&value.rootCommits.every((/** @type {any} */ id)=>oid(id,value.objectFormat))&&
  new Set(value.rootCommits).size===value.rootCommits.length&&same(value.rootCommits,[...value.rootCommits].sort())&&Array.isArray(value.identities)&&value.identities.length===4&&value.identities.every(directory)&&
  [value.root,value.gitDir,value.commonDir,path.join(value.commonDir,"objects")].every((p,i)=>p===value.identities[i].path);
}
/** @param {any} value */
function tool(value){return shape(value,["version","package","parserVersion","runtimeDigest","methodVersion","methodDigest","manifestDigest","statuses"])&&value.version===2&&
 shape(value.package,["name","version","sha256","entrySha256"])&&value.package.name==="supertaskr"&&typeof value.package.version==="string"&&[value.package.sha256,value.package.entrySha256].every(sha)&&
 typeof value.parserVersion==="string"&&typeof value.methodVersion==="string"&&[value.runtimeDigest,value.methodDigest,value.manifestDigest].every(sha)&&Array.isArray(value.statuses)&&
 value.statuses.length>0&&value.statuses.every((/** @type {any} */ status)=>typeof status==="string")&&new Set(value.statuses).size===value.statuses.length;}
/** @param {any} value */
function origin(value){return shape(value,["version","layout","associationId","product","records","docs","runtime"])&&value.version===1&&value.layout==="split"&&identifier(value.associationId)&&
 [value.product,value.records].every(repo=>shape(repo,["root","gitDirectory","commonDirectory"])&&[repo.root,repo.gitDirectory,repo.commonDirectory].every(directory))&&directory(value.docs)&&directory(value.runtime);}
/** Structural original planner data only. The canonical committed role reader
 * and fixed native CLI resolver own actual qualification; no stored path is run.
 * @param {any} value @param {any} request */
function planner(value,request){
 if(!shape(value,["selection","provenance","executable"]))return false;const selected=value.selection,proof=value.provenance,exe=value.executable;
 return shape(selected,["role","requested","harness","model","vehicle","sessionPolicy"])&&selected.role==="planner"&&selected.harness==="claude"&&
  [selected.requested,selected.model].every(v=>typeof v==="string"&&v.length>0&&v.length<=1024&&!/[\x00-\x1f\x7f]/.test(v))&&
  (selected.vehicle===null||typeof selected.vehicle==="string"&&selected.vehicle.length>0&&selected.vehicle.length<=128&&!/[\x00-\x1f\x7f]/.test(selected.vehicle))&&
  shape(selected.sessionPolicy,["default","warnAfterTurns"])&&["fresh","resume"].includes(selected.sessionPolicy.default)&&Number.isSafeInteger(selected.sessionPolicy.warnAfterTurns)&&selected.sessionPolicy.warnAfterTurns>0&&
  shape(proof,["configurationDigest","productRevision","toolManifestDigest"])&&digest(proof.configurationDigest)&&oid(proof.productRevision)&&proof.toolManifestDigest===request.tool.manifestDigest&&
  shape(exe,["path","target","device","inode","mode","bytes","sha256","version","loginPathDigest"])&&absolute(exe.path)&&absolute(exe.target)&&[exe.device,exe.inode].every(v=>typeof v==="string"&&/^[0-9]{1,64}$/.test(v))&&
  Number.isSafeInteger(exe.mode)&&exe.mode>0&&exe.mode<=0xffffffff&&Number.isSafeInteger(exe.bytes)&&exe.bytes>0&&exe.bytes<=1024*1024*1024&&digest(exe.sha256)&&
  typeof exe.version==="string"&&exe.version.length>0&&exe.version.length<=512&&(exe.loginPathDigest===null||digest(exe.loginPathDigest));
}
/** @param {any} value @param {any} request */
function settingsProvenance(value,request){
 const wanted=request.tool;
 return shape(value,["kind","productRoot","productRevision","path","configDigest","tool","assets"])&&value.kind==="committed"&&value.productRoot===request.input.productRepository.root&&
  value.productRevision===request.input.productRevision&&value.path==="supertaskr.yaml"&&digest(value.configDigest)&&
  shape(value.tool,["manifestDigest","parserVersion","methodVersion","methodDigest","runtimeDigest"])&&Object.keys(value.tool).every(key=>value.tool[key]===wanted[key])&&
  Array.isArray(value.assets)&&value.assets.length>0&&value.assets.length<=128&&value.assets.every((/** @type {any} */ asset)=>shape(asset,["path","sha256"])&&relative(asset.path)&&asset.path.startsWith("method/")&&sha(asset.sha256))&&
  new Set(value.assets.map((/** @type {any} */ asset)=>asset.path)).size===value.assets.length;
}
/** @param {any} bytes */
function json(bytes){const source=new TextDecoder("utf-8",{fatal:true}).decode(bytes),value=JSON.parse(source);if(parseDocument(source,{uniqueKeys:true}).errors.length)throw Error("BANK_JSON");return value;}
/** Runtime captures are backend-only, fixed-path, exact observed bytes. The
 * transcript retains only needed raw lines plus the complete-file digest.
 * @param {any} value @param {string} expected @param {boolean} transcript */
function runtimeCapture(value,expected,transcript){
 if(!shape(value,["path","device","inode","fileMode","byteLength","sha256",transcript?"lines":"base64"])||value.path!==expected||
  ![value.device,value.inode].every(v=>typeof v==="string"&&/^[0-9]{1,64}$/.test(v))||!Number.isSafeInteger(value.fileMode)||value.fileMode<0||value.fileMode>0o777||
  !Number.isSafeInteger(value.byteLength)||value.byteLength<0||value.byteLength>(transcript?16:1)*1024*1024||!sha(value.sha256))return false;
 if(!transcript)return base64(value.base64)&&Buffer.byteLength(value.base64,"base64")===value.byteLength&&hash(Buffer.from(value.base64,"base64"))===value.sha256;
 if(!Array.isArray(value.lines)||value.lines.length>1024)return false;let end=0;
 for(const line of value.lines){if(!shape(line,["offset","base64","sha256"])||!Number.isSafeInteger(line.offset)||line.offset<end||!base64(line.base64)||!sha(line.sha256))return false;
  const bytes=Buffer.from(line.base64,"base64");if(bytes.length>512*1024||line.offset+bytes.length>value.byteLength||hash(bytes)!==line.sha256||bytes.at(-1)!==10)return false;end=line.offset+bytes.length;}
 return true;
}
/** @param {any} value */
function workSnapshot(value){return value?.present===false?shape(value,["present"]):shape(value,["present","mode","base64"])&&value.present===true&&["100644","100755"].includes(value.mode)&&base64(value.base64);}
/** @param {any} plan @param {any} request @param {string} role */
export function validProjectBankPlan(plan,request,role){
 try{
  const repo=request.input[`${role}Repository`],revision=request.input[`${role}Revision`];
  if(!shape(plan,["repository","targetRef","expectedRevision","writes","tree","working","commit","commitBase64","message"])||!same(plan.repository,repo)||!repository(repo)||
   !oid(revision,repo.objectFormat)||plan.expectedRevision!==revision||!isDeliveryBranchRef(plan.targetRef)||!oid(plan.tree,repo.objectFormat)||!oid(plan.commit,repo.objectFormat)||
   !base64(plan.commitBase64)||typeof plan.message!=="string"||plan.message.includes("\0")||!plan.message.endsWith(`\n\nsupertaskr-project-bank: ${request.operationId}/${role}\n`))return false;
  const raw=Buffer.from(plan.commitBase64,"base64"),source=new TextDecoder("utf-8",{fatal:true}).decode(raw),separator=source.indexOf("\n\n"),headers=source.slice(0,separator).split("\n");
  if(separator<0||headers.length!==4||headers[0]!==`tree ${plan.tree}`||headers[1]!==`parent ${revision}`||
   !/^author [^\x00\r\n<>]+ <[^\x00\r\n<>]+> -?[0-9]+ [+-][0-9]{4}$/.test(headers[2]??"")||!/^committer [^\x00\r\n<>]+ <[^\x00\r\n<>]+> -?[0-9]+ [+-][0-9]{4}$/.test(headers[3]??"")||
   source.slice(separator+2)!==plan.message||createHash(repo.objectFormat).update(`commit ${raw.length}\0`).update(raw).digest("hex")!==plan.commit)return false;
  if(role==="product"&&!plan.message.includes(`\nsupertaskr-records-bank: ${request.plans.records.commit}\n`))return false;
  if(!Array.isArray(plan.writes)||!plan.writes.length||plan.writes.length>516||plan.writes.some((/** @type {any} */ w)=>!shape(w,["operation","path","mode","base64","derived"])||!["add","edit"].includes(w.operation)||!relative(w.path)||!["100644","100755"].includes(w.mode)||!base64(w.base64)||typeof w.derived!=="boolean")||
   new Set(plan.writes.map((/** @type {any} */ w)=>w.path)).size!==plan.writes.length||!shape(plan.working,["preimages","index"])||!Array.isArray(plan.working.preimages)||
   plan.working.preimages.some((/** @type {any} */ p)=>!shape(p,["path","work"])||!relative(p.path)||!workSnapshot(p.work))||
   !same(plan.working.preimages.map((/** @type {any} */ p)=>p.path).sort(),plan.writes.map((/** @type {any} */ w)=>w.path).sort()))return false;
  const index=plan.working.index;
  return shape(index,["path","previousDigest","resultDigest","resultBase64","lockToken"])&&index.path===path.join(repo.gitDir,"index")&&[index.previousDigest,index.resultDigest].every(digest)&&base64(index.resultBase64)&&
   index.resultDigest===operationDigest(index.resultBase64)&&typeof index.lockToken==="string"&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(index.lockToken);
 }catch{return false;}
}
/** @param {any} request */
export function validProjectBankRequest(request){
 try{
  const r=operationPayload(request);
  if(!shape(r,["version","kind","operationId","tool","setup","session","input","bank","plans"])||r.version!==1||r.kind!=="project-bank"||!identifier(r.operationId)||!tool(r.tool)||
   !shape(r.setup,["operationId","requestDigest","receiptDigest","projectId","productRevision","recordsRevision"])||!identifier(r.setup.operationId)||r.setup.operationId===r.operationId||!identifier(r.setup.projectId)||
   ![r.setup.requestDigest,r.setup.receiptDigest].every(digest)||![r.setup.productRevision,r.setup.recordsRevision].every(v=>oid(v))||
   !shape(r.session,["registryId","sessionId","origin","originDigest","planner"])||!/^S[1-9][0-9]*$/.test(r.session.registryId)||!identifier(r.session.sessionId)||!origin(r.session.origin)||
   r.session.originDigest!==operationDigest(r.session.origin)||r.session.origin.associationId!==r.setup.projectId||!planner(r.session.planner,r)||
   !shape(r.input,["productRevision","recordsRevision","productRepository","recordsRepository","docsIdentity","runtimeIdentity","settingsProvenance","registryCapture","transcriptCapture","previousBank"])||
   !repository(r.input.productRepository)||!repository(r.input.recordsRepository)||!oid(r.input.productRevision,r.input.productRepository.objectFormat)||!oid(r.input.recordsRevision,r.input.recordsRepository.objectFormat)||
   !directory(r.input.docsIdentity)||!directory(r.input.runtimeIdentity)||!same(r.session.origin.docs,r.input.docsIdentity)||!same(r.session.origin.runtime,r.input.runtimeIdentity)||
   r.input.docsIdentity.path!==path.join(r.input.recordsRepository.root,"docs")||r.input.runtimeIdentity.path!==path.join(r.input.productRepository.root,".supertaskr")||!settingsProvenance(r.input.settingsProvenance,r))return false;
  for(const role of ROLES){const repo=r.input[`${role}Repository`],original=r.session.origin[role];if(!same([original.root,original.gitDirectory,original.commonDirectory],repo.identities.slice(0,3)))return false;}
  const p=r.input.productRepository,notes=r.input.recordsRepository;
  if(!oid(r.setup.productRevision,p.objectFormat)||!oid(r.setup.recordsRevision,notes.objectFormat))return false;
  if(![path.relative(p.root,notes.root),path.relative(notes.root,p.root)].every(v=>v===".."||v.startsWith(`..${path.sep}`)||path.isAbsolute(v)))return false;
  if(p.identities.some((/** @type {any} */ a)=>notes.identities.some((/** @type {any} */ b)=>a.device===b.device&&a.inode===b.inode)))return false;
  if(!runtimeCapture(r.input.registryCapture,path.join(p.root,".supertaskr/sessions.json"),false)||!runtimeCapture(r.input.transcriptCapture,path.join(p.root,".supertaskr/genesis/transcript.jsonl"),true))return false;
  const registry=json(Buffer.from(r.input.registryCapture.base64,"base64"));if(!shape(registry,["sessions"])||!Array.isArray(registry.sessions))return false;
  const rows=registry.sessions.filter((/** @type {any} */ row)=>row?.status!=="dead"&&Array.isArray(row?.roles)&&row.roles.includes("planner")&&same(row?.genesis?.origin,r.session.origin));
  if(rows.length!==1||rows[0].id!==r.session.registryId||rows[0].agent!=="claude"||rows[0].status!=="idle"||!Number.isSafeInteger(rows[0].turns)||rows[0].turns<1||
   !shape(rows[0].genesis,["id","origin","planner","setup"])||rows[0].genesis.id!==r.session.sessionId||!same(rows[0].genesis.planner,r.session.planner)||!same(rows[0].genesis.setup,r.setup))return false;
  const context={setupId:r.setup.operationId,sessionId:r.session.sessionId,originDigest:r.session.originDigest,productRevision:r.input.productRevision,recordsRevision:r.input.recordsRevision};
  if(!shape(r.bank,["stage","proposalCapture","productProposalCapture","answers","validation"])||!Number.isInteger(r.bank.stage)||r.bank.stage<0||r.bank.stage>8||!Array.isArray(r.bank.answers))return false;
  const captured=r.bank.proposalCapture;
  const actualAnswers=r.input.transcriptCapture.lines.map((/** @type {any} */ line)=>json(Buffer.from(line.base64,"base64")));
  if(actualAnswers.some((/** @type {any} */ line)=>!shape(line,["turn","role","text","atMs","genesis",...(Object.hasOwn(line,"machine")?["machine"]:[])])||line.role!=="user"||Object.hasOwn(line,"machine")&&line.machine!==false||!Number.isSafeInteger(line.atMs)||line.atMs<0||!same(line.genesis,{sessionId:r.session.sessionId,originDigest:r.session.originDigest})||!Number.isSafeInteger(line.turn)||line.turn<1||line.turn>0xffffffff||typeof line.text!=="string"||Buffer.byteLength(line.text)>256*1024)||
   !same([...r.bank.answers].sort((/** @type {any} */ a,/** @type {any} */ b)=>a.turn-b.turn),actualAnswers.map((/** @type {any} */ line)=>({turn:line.turn,text:line.text,sha256:hash(Buffer.from(line.text,"utf8"))})).sort((/** @type {any} */ a,/** @type {any} */ b)=>a.turn-b.turn)))return false;
  const recomputed=captureGenesisBankProposal({bytes:Buffer.from(captured.sourceBase64,"base64"),context,
   answers:r.bank.answers.map((/** @type {any} */ a)=>({turn:a.turn,text:a.text,setupId:context.setupId,sessionId:context.sessionId,originDigest:context.originDigest})),
   files:captured.records.map((/** @type {any} */ f)=>({path:f.path,mode:f.mode,bytes:Buffer.from(f.base64,"base64")}))});
  if(!same(captured,recomputed)||captured.proposal.stage!==r.bank.stage||!shape(r.plans,ROLES)||!validProjectBankPlan(r.plans.records,r,"records"))return false;
  const expected=captured.records.map((/** @type {any} */ f)=>({path:f.path,mode:f.mode,base64:f.base64}));expected.push({path:GENESIS_BANK_PROPOSAL,mode:"100644",base64:captured.sourceBase64});
  const product=r.bank.productProposalCapture;
  if([1,5].includes(r.bank.stage)){
   if(!shape(product,["version","kind","context","proposal","sourceBase64","sourceSha256","answers","digest","authority"])||product.version!==1||product.kind!=="genesis-product-proposal"||!same(product.context,context)||
    !base64(product.sourceBase64)||product.sourceSha256!==hash(Buffer.from(product.sourceBase64,"base64"))||!same(json(Buffer.from(product.sourceBase64,"base64")),product.proposal)||
    product.proposal.bank!==(r.bank.stage===1?"identity":"configuration")||product.digest!==operationDigest({context,proposal:product.proposal,sourceSha256:product.sourceSha256,answers:product.answers})||!validProjectBankPlan(r.plans.product,r,"product"))return false;
   const expectedPaths=r.bank.stage===1?["AGENTS.md","CLAUDE.md"]:["supertaskr.yaml"];
   if(!same(r.plans.product.writes.map((/** @type {any} */ w)=>w.path).sort(),expectedPaths)||r.plans.product.writes.some((/** @type {any} */ w)=>w.operation!=="edit"||w.derived))return false;
   const proposal=product.proposal;
   const fields=["version","setupId","sessionId","originDigest","proposalId","bank","expectedProductRevision","expectedRecordsRevision","answerRefs",r.bank.stage===1?"identity":"settings"];
   if(!shape(proposal,fields)||proposal.version!==1||proposal.proposalId!==captured.proposal.proposalId||
    proposal.setupId!==context.setupId||proposal.sessionId!==context.sessionId||proposal.originDigest!==context.originDigest||proposal.expectedProductRevision!==context.productRevision||proposal.expectedRecordsRevision!==context.recordsRevision||
    product.authority!=="captured proposal data only; no root selection, semantic approval, or write authority"||
    !same(product.answers,captureGenesisAnswerReferences({context,answers:r.bank.answers.map((/** @type {any} */ a)=>({turn:a.turn,text:a.text,setupId:context.setupId,sessionId:context.sessionId,originDigest:context.originDigest})),refs:proposal.answerRefs,allowEmpty:false})))return false;
   if(r.bank.stage===1&&(!shape(proposal.identity,["projectName","oneLiner"])||typeof proposal.identity.projectName!=="string"||!proposal.identity.projectName.trim()||proposal.identity.projectName.length>160||
    typeof proposal.identity.oneLiner!=="string"||!proposal.identity.oneLiner.trim()||proposal.identity.oneLiner.length>512||/[\x00-\x1f\x7f]/.test(proposal.identity.projectName+proposal.identity.oneLiner)))return false;
   if(r.bank.stage===5&&(!proposal.settings||typeof proposal.settings!=="object"||Array.isArray(proposal.settings)))return false;
   expected.push({path:GENESIS_PRODUCT_PROPOSAL,mode:"100644",base64:product.sourceBase64});
  }else if(product!==null||r.plans.product!==null)return false;
  const writes=r.plans.records.writes,ordinary=writes.filter((/** @type {any} */ w)=>!w.derived);
  if(!same(ordinary.map((/** @type {any} */ w)=>({path:w.path,mode:w.mode,base64:w.base64})).sort((/** @type {any} */ a,/** @type {any} */ b)=>a.path<b.path?-1:1),expected.sort((/** @type {any} */ a,/** @type {any} */ b)=>a.path<b.path?-1:1))||
   writes.filter((/** @type {any} */ w)=>w.derived).some((/** @type {any} */ w)=>w.path!=="docs/INDEX.md"||w.mode!=="100644"))return false;
  const prior=r.input.previousBank;
  if(r.bank.stage===0){if(prior!==null)return false;} // Current lineage/stage authority is proved by the constructor, not commit equality.
  else if(!shape(prior,["operationId","requestDigest","receiptDigest","stage","recordsCommit","productCommit"])||!identifier(prior.operationId)||prior.operationId===r.operationId||
   ![prior.requestDigest,prior.receiptDigest].every(digest)||prior.stage!==r.bank.stage-1||!oid(prior.recordsCommit,notes.objectFormat)||!(prior.productCommit===null||oid(prior.productCommit,p.objectFormat)))return false;
  const validation=r.bank.validation;if(!shape(validation,["current","prospective"])||validation.prospective!==null&&r.bank.stage!==5)return false;
  for(const proof of [validation.current,...(validation.prospective===null?[]:[validation.prospective])]){
   if(!shape(proof,["profile","captureDigest","candidateDigest","writeSetDigest"])||![proof.captureDigest,proof.writeSetDigest].every(digest)||!sha(proof.candidateDigest)||!proof.profile||typeof proof.profile!=="object"||!same(normalizeRecordProfile(proof.profile),proof.profile))return false;
  }
  const finalValidation=validation.prospective??validation.current;
  if(finalValidation.writeSetDigest!==operationDigest(writes.filter((/** @type {any} */ w)=>![GENESIS_BANK_PROPOSAL,GENESIS_PRODUCT_PROPOSAL].includes(w.path))))return false;
  return true;
 }catch{return false;}
}
/** @param {any} value @param {any} plan @param {string} ref */
function acceptance(value,plan,ref){return shape(value,["commit","tree","ref","previousRevision","attribution"])&&value.commit===plan.commit&&value.tree===plan.tree&&value.ref===ref&&value.previousRevision===plan.expectedRevision&&value.attribution==="exact";}
/** @param {any} rec */
export function validProjectBankRecord(rec){
 try{
  if(!shape(rec,["version","recordKind","attempt","state","assignment","assignmentDigest","writer","resource","reservation","execution","admission","operation","events"])||rec.version!==1||rec.recordKind!=="operation"||!["starting","unknown","finished"].includes(rec.state)||rec.writer!==true||rec.execution!==null||rec.admission!==null||
   !shape(rec.assignment,["kind","id","role","resource"])||rec.assignment.kind!=="operation"||rec.assignment.role!=="project-bank"||rec.assignment.resource!==rec.resource||rec.assignmentDigest!==`sha256:${hash(Buffer.from(JSON.stringify(rec.assignment)))}`||
   !shape(rec.reservation,["file","takenAt","releasedAt"])||!instant(rec.reservation.takenAt)||!(rec.reservation.releasedAt===null||instant(rec.reservation.releasedAt))||!Array.isArray(rec.events)||rec.events.some((/** @type {any} */ e)=>!shape(e,["at","op"])||!instant(e.at)||typeof e.op!=="string"))return false;
  const op=rec.operation;
  if(!shape(op,["version","id","kind","request","digest","owner","createdAt","claims","progress","acceptance"])||op.version!==1||op.kind!=="project-bank"||!validProjectBankRequest(op.request)||op.id!==op.request.operationId||op.digest!==operationDigest(op.request)||
   rec.resource!==op.request.input.productRepository.root||rec.assignment.id!==operationWork(op.id)||rec.attempt!==`${operationWork(op.id)}-a1`||!instant(op.createdAt)||!shape(op.owner,["pid","identity","token"])||!Number.isInteger(op.owner.pid)||op.owner.pid<1||typeof op.owner.identity!=="string"||!op.owner.identity||typeof op.owner.token!=="string"||
   !Array.isArray(op.claims)||op.claims.length!==2||!shape(op.progress,ROLES))return false;
  for(const role of ROLES){const plan=op.request.plans[role],resource=op.request.input[`${role}Repository`].root,claims=op.claims.filter((/** @type {any} */ c)=>c.role===role),progress=op.progress[role];
   if(claims.length!==1)return false;const c=claims[0],file=path.join(rec.resource,".supertaskr/runs/reservations",`${path.basename(resource)}-${hash(Buffer.from(resource)).slice(0,12)}.json`);
   if(!shape(c,["role","resource","file","takenAt","releasedAt"])||c.resource!==resource||c.file!==file||!instant(c.takenAt)||!(c.releasedAt===null||instant(c.releasedAt))||!shape(progress,["stage","intent","acceptance"]))return false;
   if(role==="product"&&(rec.reservation.file!==c.file||rec.reservation.takenAt!==c.takenAt||rec.reservation.releasedAt!==c.releasedAt))return false;
   if(plan===null){if(progress.stage!=="not-required"||progress.intent!==null||progress.acceptance!==null)return false;continue;}
   if(!["captured","objects-start","objects-prepared","consumer-prepare","files-prepared","ref-accepted"].includes(progress.stage))return false;
   const correlationRef=`refs/supertaskr/project-banks/${operationWork(op.id).slice(3)}/${role}`;
   if(progress.intent!==null&&(!shape(progress.intent,["commit","tree","ref","previousRevision","correlationRef"])||progress.intent.commit!==plan.commit||progress.intent.tree!==plan.tree||progress.intent.ref!==plan.targetRef||progress.intent.previousRevision!==plan.expectedRevision||progress.intent.correlationRef!==correlationRef))return false;
   if(progress.acceptance!==null&&(!acceptance(progress.acceptance,plan,plan.targetRef)||progress.intent===null)||
    (progress.stage==="ref-accepted")!==(progress.acceptance!==null)||progress.stage!=="captured"&&progress.intent===null)return false;
   if(role==="product"&&progress.stage!=="captured"&&op.progress.records.acceptance===null)return false;
  }
  if(op.acceptance!==null&&(ROLES.some(role=>op.request.plans[role]!==null&&op.progress[role].acceptance===null)||!shape(op.acceptance,["records","product","attribution"])||op.acceptance.attribution!=="exact"||!same(op.acceptance.records,op.progress.records.acceptance)||op.acceptance.records===null||!same(op.acceptance.product,op.progress.product.acceptance)))return false;
  if(op.claims.some((/** @type {any} */ c)=>c.releasedAt!==null)&&op.acceptance===null)return false;
  return rec.state!=="finished"||op.acceptance!==null&&op.claims.every((/** @type {any} */ c)=>instant(c.releasedAt));
 }catch{return false;}
}
