/** Strict finite configured-dispatch request data. Structural correspondence
 * confers no authority: only the canonical backend constructor may prepare new
 * effects; active/recovery policy separately rechecks original and current facts. */
import { createHash } from "node:crypto";
import path from "node:path";
import { VERIFICATION_TIERS, isDeliveryBranchRef } from "../../../lib/parser/dist/pure.js";
import { validQualifiedConfiguredGateCapture } from "./qualified-configured-grades.mjs";
import { validConfiguredDispatchCapsule } from "../../../cli/configured-native-reader.mjs";
import { operationContent, operationDigest, operationPayload, operationWork } from "./operation-record.mjs";

/** @param {any} value @param {string[]} keys */
const shape=(value,keys)=>value&&typeof value==="object"&&!Array.isArray(value)&&Object.keys(value).sort().join("\0")===[...keys].sort().join("\0");
/** @param {any} a @param {any} b */
const same=(a,b)=>operationContent(a)===operationContent(b);
/** @param {any} value */
const sha=value=>typeof value==="string"&&/^[0-9a-f]{64}$/.test(value);
/** @param {any} value */
const digest=value=>typeof value==="string"&&/^sha256:[0-9a-f]{64}$/.test(value);
/** @param {any} value @param {string} format */
const oid=(value,format)=>typeof value==="string"&&(format==="sha1"?/^[0-9a-f]{40}$/:/^[0-9a-f]{64}$/).test(value);
/** @param {any} value */
const absolute=value=>typeof value==="string"&&value.length<=16384&&path.isAbsolute(value)&&path.normalize(value)===value&&!/[\\\x00-\x1f\x7f-\x9f]/.test(value);
/** @param {any} value */
const relative=value=>typeof value==="string"&&value.length<=4096&&!path.posix.isAbsolute(value)&&!path.win32.isAbsolute(value)&&!/[\\\x00-\x1f\x7f-\x9f]/.test(value)&&value.split("/").every(p=>p&&!['.','..','.git','.supertaskr'].includes(p));
/** @param {any} value */
const ref=value=>isDeliveryBranchRef(value);
/** @param {any} value */
const base64=value=>typeof value==="string"&&value.length<=24*1024*1024&&Buffer.from(value,"base64").toString("base64")===value;
/** @param {any} value */
const nativeId=value=>typeof value==="string"&&value.length>0&&value.length<=256&&value.trim()===value&&!/[\x00-\x1f\x7f-\x9f]/.test(value);
/** @param {string|Uint8Array} bytes */
const hash=bytes=>createHash("sha256").update(bytes).digest("hex");
/** @param {any} value */
const directory=value=>shape(value,["path","device","inode"])&&absolute(value.path)&&[value.device,value.inode].every(n=>typeof n==="string"&&/^[0-9]{1,64}$/.test(n));
/** @param {any} value */
const work=value=>shape(value,["present"])&&value.present===false||shape(value,["present","mode","base64"])&&value.present===true&&["100644","100755"].includes(value.mode)&&base64(value.base64);
/** @param {any} value */
const actor=value=>shape(value,["name","email","date"])&&[value.name,value.email].every(v=>typeof v==="string"&&v.trim()&&!/[\r\n<>\0]/.test(v))&&typeof value.date==="string"&&/^-?[0-9]+ [+-][0-9]{4}$/.test(value.date);
/** Deliberately bounded native adapter dials, not a model/account default. */
export const CONFIGURED_NATIVE_EFFORTS=Object.freeze(["low","medium","high","xhigh"]);
/** Explicit original launch data only; no model/program/policy lives here.
 * Deadline is an exact UTC instant or none; budget is token count or none.
 * @param {any} execution */
export function validConfiguredArmExecution(execution){
 if(!shape(execution,["effort","deadline","budget"])||!CONFIGURED_NATIVE_EFFORTS.includes(execution.effort))return false;
 if(execution.deadline!=="none"&&!(typeof execution.deadline==="string"&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(execution.deadline)&&Number.isFinite(Date.parse(execution.deadline))&&new Date(execution.deadline).toISOString()===execution.deadline))return false;
 return execution.budget==="none"||typeof execution.budget==="string"&&/^[1-9][0-9]{0,8}$/.test(execution.budget)&&Number.isSafeInteger(Number(execution.budget));
}

/** Exact intended private lifecycle commit and its staged/working preimages.
 * The existing canonical writer proves actual object/ref/filesystem effects.
 * @param {any} stamp @param {any} request */
function validStamp(stamp,request){
 const c=request.capsule,repo=request.repositories.records;
 if(!shape(stamp,["tree","working","commit","commitBase64","writes","identity","message","fields","targetRef"])||
  ![stamp.tree,stamp.commit].every(v=>oid(v,repo.objectFormat))||!base64(stamp.commitBase64)||stamp.targetRef!==request.targetRefs.records||
  !shape(stamp.identity,["author","committer"])||!actor(stamp.identity.author)||!actor(stamp.identity.committer)||
  stamp.message!==`Dispatch ${request.taskId}\n\nsupertaskr-dispatch: ${request.operationId}\n`||
  !shape(stamp.fields,["status","builder","verifier","tier","review"])||stamp.fields.status!=="building"||stamp.fields.review!=="independent"||
  !VERIFICATION_TIERS.includes(stamp.fields.tier)||
  stamp.fields.builder!==JSON.stringify(c.roles.executor.requested)||stamp.fields.verifier!==JSON.stringify(c.roles.verifier.requested)||
  !Array.isArray(stamp.writes)||stamp.writes.length<1||stamp.writes.length>2||stamp.writes.some((/** @type {any} */ w)=>!shape(w,["path","operation","mode","base64"])||
    !relative(w.path)||![c.task.path,"docs/INDEX.md"].includes(w.path)||w.operation!=="write"||!["100644","100755"].includes(w.mode)||!base64(w.base64))||
  new Set(stamp.writes.map((/** @type {any} */ w)=>w.path)).size!==stamp.writes.length||!stamp.writes.some((/** @type {any} */ w)=>w.path===c.task.path))return false;
 const raw=Buffer.from(stamp.commitBase64,"base64"),source=new TextDecoder("utf-8",{fatal:true}).decode(raw),sep=source.indexOf("\n\n"),headers=source.slice(0,sep).split("\n");
 const line=(/** @type {any} */ a)=>`${a.name} <${a.email}> ${a.date}`;
 if(sep<0||headers.length!==4||headers[0]!==`tree ${stamp.tree}`||headers[1]!==`parent ${request.selection.revisions.records}`||
  headers[2]!==`author ${line(stamp.identity.author)}`||headers[3]!==`committer ${line(stamp.identity.committer)}`||source.slice(sep+2)!==stamp.message||
  createHash(repo.objectFormat).update(`commit ${raw.length}\0`).update(raw).digest("hex")!==stamp.commit||
  !shape(stamp.working,["preimages","index"])||!Array.isArray(stamp.working.preimages)||
  stamp.working.preimages.some((/** @type {any} */ p)=>!shape(p,["path","work"])||!relative(p.path)||!work(p.work))||
  !same(stamp.working.preimages.map((/** @type {any} */ p)=>p.path).sort(),stamp.writes.map((/** @type {any} */ w)=>w.path).sort()))return false;
 const index=stamp.working.index;
 return shape(index,["path","previousDigest","resultDigest","resultBase64","lockToken"])&&index.path===path.join(repo.gitDir,"index")&&
  [index.previousDigest,index.resultDigest].every(digest)&&base64(index.resultBase64)&&index.resultDigest===operationDigest(index.resultBase64)&&
  typeof index.lockToken==="string"&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(index.lockToken);
}
/** Baseline meaning is re-established by its one canonical producer before
 * effects; structural absence of executable results can never mean GREEN.
 * @param {any} value @param {any} r */
function validBaseline(value,r){
 if(value?.kind==="required-original-suites")return shape(value,["kind","policyDigest","required"])&&value.policyDigest===r.capsule.gatePolicy.digest&&same(value.required,r.capsule.gatePolicy.required);
 if(!shape(value,["kind","setup","bank8","latestBank","revisions","configuration","card","productFiles","qualifiedSuiteBaseline"])||value.kind!=="initialized-code-empty"||value.qualifiedSuiteBaseline!==false||
  !same(value.revisions,r.selection.revisions)||!same(value.configuration,r.capsule.configuration)||
  !shape(value.card,["path","blobId","sha256"])||value.card.path!==r.capsule.task.path||value.card.blobId!==r.capsule.task.blobId||!sha(value.card.sha256)||
  !Array.isArray(value.productFiles)||!same(value.productFiles.map((/** @type {any} */ f)=>f.path),[".gitignore","AGENTS.md","CLAUDE.md","supertaskr.yaml"])||
  value.productFiles.some((/** @type {any} */ f)=>!shape(f,["path","mode","sha256"])||!["100644","100755"].includes(f.mode)||!sha(f.sha256)))return false;
 const witness=(/** @type {any} */ w)=>shape(w,["operationId","requestDigest","receiptDigest","stage","completedStage","recordsCommit","productCommit"])&&nativeId(w.operationId)&&
  [w.requestDigest,w.receiptDigest].every(digest)&&Number.isInteger(w.stage)&&w.stage>=0&&w.stage<=8&&w.completedStage===8&&oid(w.recordsCommit,r.repositories.records.objectFormat)&&(w.productCommit===null||oid(w.productCommit,r.repositories.product.objectFormat));
 return shape(value.setup,["operationId","requestDigest","receiptDigest","projectId","productRevision","recordsRevision"])&&nativeId(value.setup.operationId)&&value.setup.projectId===r.selection.projectId&&
  [value.setup.requestDigest,value.setup.receiptDigest].every(digest)&&oid(value.setup.productRevision,r.repositories.product.objectFormat)&&oid(value.setup.recordsRevision,r.repositories.records.objectFormat)&&witness(value.bank8)&&value.bank8.stage===8&&value.bank8.productCommit===null&&witness(value.latestBank);
}
/** Data-only finite request validator. A copied valid request is not an opaque
 * constructor handle, admission, claim or native start capability.
 * @param {any} input */
export function validConfiguredArmRequest(input){
 try{
 const r=operationPayload(input),c=r.capsule;
 const fields=["version","kind","operationId","taskId","selection","capsule","scope","verification","repositories","targetRefs","tool","admission","lanes","stamp","baseline","role","expectedAttempt","native","brief","validation"];
 if(!(shape(r,fields)||shape(r,[...fields,"execution"]))||Object.hasOwn(r,"execution")&&r.execution!==null&&!validConfiguredArmExecution(r.execution)||
  r.version!==1||r.kind!=="configured-dispatch"||typeof r.operationId!=="string"||!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(r.operationId)||
  !validConfiguredDispatchCapsule(c)||r.taskId!==c.task.id||!same({...r.selection,taskId:r.taskId},c.selection)||operationDigest(r.scope)!==c.scopeDigest||
  !shape(r.verification,["tier","derivedTier","reason"])||!(r.verification.tier===null||VERIFICATION_TIERS.includes(r.verification.tier))||!VERIFICATION_TIERS.includes(r.verification.derivedTier)||
  r.verification.tier!==c.task.declaredTier||r.verification.tier!==null&&VERIFICATION_TIERS.indexOf(r.verification.tier)<VERIFICATION_TIERS.indexOf(r.verification.derivedTier)||
  typeof r.verification.reason!=="string"||!r.verification.reason||r.verification.reason.length>16384||r.stamp.fields.tier!==(r.verification.tier??r.verification.derivedTier)||
  !shape(r.repositories,["product","records"])||!same(r.repositories,c.origins)||!shape(r.targetRefs,["product","records"])||!Object.values(r.targetRefs).every(ref)||
  !shape(r.tool,["version","package","parserVersion","runtimeDigest","methodVersion","methodDigest","manifestDigest","statuses"])||r.tool.version!==2||
  !shape(r.tool.package,["name","version","sha256","entrySha256"])||r.tool.package.name!=="supertaskr"||typeof r.tool.package.version!=="string"||![r.tool.package.sha256,r.tool.package.entrySha256].every(sha)||
  !Array.isArray(r.tool.statuses)||!r.tool.statuses.length||new Set(r.tool.statuses).size!==r.tool.statuses.length||r.tool.statuses.some((/** @type {any} */ s)=>typeof s!=="string")||
  !Object.keys(c.configuration.tool).every(k=>c.configuration.tool[k]===r.tool[k])||
  !shape(r.admission,["grant","receipt"])||!same(r.admission.receipt,c.receipt)||!shape(r.admission.grant,["revision","digest","enforced","approval","recovery","paused"])||r.admission.grant.enforced!==true||
  !Number.isSafeInteger(r.admission.grant.revision)||r.admission.grant.revision<1||!sha(r.admission.grant.digest)||!["off","batch","each"].includes(r.admission.grant.approval)||
  !["none","repairs"].includes(r.admission.grant.recovery)||r.admission.grant.paused!==null)return false;
 const roles=[...new Set(r.scope.paths.map((/** @type {any} */ p)=>p.role))].sort();
 if(!Array.isArray(r.lanes)||!same(r.lanes.map((/** @type {any} */ l)=>l.role).sort(),roles))return false;
 const invalidLane=r.lanes.some((/** @type {any} */ l)=>!shape(l,["role","checkout","branch","base","parent"])||!absolute(l.checkout)||!ref(l.branch)||!directory(l.parent)||path.dirname(l.checkout)!==l.parent.path||
  l.base!==(l.role==="records"?r.stamp.commit:r.selection.revisions.product)||Object.values(r.repositories).some((/** @type {any} */ repo)=>l.checkout===repo.root||l.checkout.startsWith(`${repo.root}${path.sep}`)));
 const overlap=r.lanes.some((/** @type {any} */ l,/** @type {number} */ i)=>r.lanes.slice(i+1).some((/** @type {any} */ other)=>l.checkout===other.checkout||l.checkout.startsWith(`${other.checkout}${path.sep}`)||other.checkout.startsWith(`${l.checkout}${path.sep}`)));
 if(invalidLane||overlap)return false;
 if(!validStamp(r.stamp,r)||!validBaseline(r.baseline,r)||!shape(r.role,["role","requested","model","harness","vehicle","sessionPolicy"])||r.role.role!=="executor"||
  r.role.requested!==c.roles.executor.requested||r.role.model!==c.roles.executor.model.replace(/^codex\//,"")||!/^gpt-[A-Za-z0-9][A-Za-z0-9._-]*$/.test(r.role.model)||
  r.role.harness!=="codex-desktop-native"||!["fresh","subagent"].includes(r.role.vehicle)||r.role.vehicle!==(c.roles.executor.vehicle??c.sessionPolicy.default)||!same(r.role.sessionPolicy,c.sessionPolicy)||
  typeof r.expectedAttempt!=="string"||!new RegExp(`^${r.taskId}-a[1-9][0-9]*$`).test(r.expectedAttempt)||
  !shape(r.native,["sessionId","coordinatorTurnId","taskName","ignoredOutputs"])||![r.native.sessionId,r.native.coordinatorTurnId].every(nativeId)||
  r.native.taskName!==`/root/configured_${hash(r.operationId).slice(0,24)}`||!same(r.native.ignoredOutputs,[])||
  !shape(r.brief,["text","sha256"])||typeof r.brief.text!=="string"||!r.brief.text||Buffer.byteLength(r.brief.text)>4*1024*1024||r.brief.sha256!==hash(r.brief.text)||
  !shape(r.validation,["captureDigest","candidateDigest","derivations"])||!digest(r.validation.captureDigest)||!sha(r.validation.candidateDigest)||
  !Array.isArray(r.validation.derivations)||r.validation.derivations.length>1||r.validation.derivations.some((/** @type {any} */ d)=>!shape(d,["path","mode","sha256"])||d.path!=="docs/INDEX.md"||d.mode!=="100644"||!sha(d.sha256)||!r.stamp.writes.some((/** @type {any} */ w)=>w.path===d.path&&w.mode===d.mode&&hash(Buffer.from(w.base64,"base64"))===d.sha256)))return false;
 return true;
 }catch{return false;}
}

/** Exact allowed stamp-to-result snapshot correspondence. Current canonical
 * admission still proves original granted-blob mechanical drift; this predicate
 * cannot approve, rewrite a grant or reconstruct a capsule from caller data.
 * @param {any} request @param {any} result */
export function validConfiguredArmStampedSource(request,result){
 try{
  if(!validConfiguredArmRequest(request)||!validConfiguredDispatchCapsule(result))return false;
  const original=request.capsule,card=request.stamp.writes.find((/** @type {any} */ w)=>w.path===original.task.path),bytes=Buffer.from(card.base64,"base64");
  const blobId=createHash(request.repositories.records.objectFormat).update(`blob ${bytes.length}\0`).update(bytes).digest("hex");
  const receipt=structuredClone(original.receipt);receipt.recordsCommit=request.stamp.commit;receipt.cardBlobId=blobId;
  receipt.association.validation.source=`${request.stamp.commit}:${receipt.association.relativePath}`;
  const roles=structuredClone(original.roles);
  for(const name of ["executor","verifier"])roles[name].source="committed-card";
  const {digest:ignored,...source}=original;
  const expected={...source,selection:{...original.selection,revisions:{...original.selection.revisions,records:request.stamp.commit}},receipt,roles,
   task:{...original.task,blobId,declaredTier:request.stamp.fields.tier}};
  return same(result,{...expected,digest:operationDigest(expected)});
 }catch{return false;}
}
/** @param {any} value */
const instant=value=>typeof value==="string"&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value)&&Number.isFinite(Date.parse(value));
/** @param {any} request */
export function configuredArmStampIntent(request){return {commit:request.stamp.commit,tree:request.stamp.tree,ref:request.targetRefs.records,previousRevision:request.selection.revisions.records,
 correlationRef:`refs/supertaskr/configured-dispatch/${operationWork(request.operationId).slice(3)}/records`};}
/** One fixed coordinator runtime location, never a caller-provided brief path.
 * @param {any} request */
export function configuredArmBriefPath(request){return path.join(request.selection.authorityRoot,".supertaskr","briefs",`${operationWork(request.operationId)}.md`);}
/** @param {any} brief @param {any} request */
function validOwnedBrief(brief,request){
 if(!shape(brief,["stage","path","text","sha256","identity"])||!["captured","written"].includes(brief.stage)||brief.path!==configuredArmBriefPath(request)||
  typeof brief.text!=="string"||!brief.text||Buffer.byteLength(brief.text)>4*1024*1024||brief.sha256!==hash(brief.text))return false;
 if(brief.stage==="captured")return brief.identity===null;
 const i=brief.identity;
 return shape(i,["path","device","inode","mode","byteLength","sha256"])&&i.path===brief.path&&[i.device,i.inode].every(v=>typeof v==="string"&&/^[0-9]{1,64}$/.test(v))&&
  i.mode===0o600&&i.byteLength===Buffer.byteLength(brief.text)&&i.sha256===brief.sha256;
}
/** Canonical OP record branch. Every pending/unknown stage remains discoverable
 * and blocks ordinary foreign admission even after its own claims are handed
 * to the existing qualified set acquisition. No child or grant lives here.
 * @param {any} rec */
export function validConfiguredDispatchRecord(rec){
 try{
  if(!shape(rec,["version","recordKind","attempt","state","assignment","assignmentDigest","writer","resource","reservation","execution","admission","operation","events"])||
   rec.version!==1||rec.recordKind!=="operation"||!["starting","unknown","finished"].includes(rec.state)||rec.writer!==true||rec.execution!==null||rec.admission!==null||
   !shape(rec.assignment,["kind","id","role","resource"])||rec.assignment.kind!=="operation"||rec.assignment.role!=="configured-dispatch"||rec.assignment.resource!==rec.resource||
   rec.assignmentDigest!==`sha256:${hash(JSON.stringify(rec.assignment))}`||!shape(rec.reservation,["file","takenAt","releasedAt"])||!instant(rec.reservation.takenAt)||
   !(rec.reservation.releasedAt===null||instant(rec.reservation.releasedAt))||!Array.isArray(rec.events)||rec.events.some((/** @type {any} */ e)=>!shape(e,["at","op"])||!instant(e.at)||typeof e.op!=="string"||!e.op))return false;
  const op=rec.operation,r=op.request;
  if(!shape(op,["version","id","kind","request","digest","owner","createdAt","claims","progress","acceptance"])||op.version!==1||op.kind!=="configured-dispatch"||
   !validConfiguredArmRequest(r)||op.id!==r.operationId||op.digest!==operationDigest(r)||rec.assignment.id!==operationWork(op.id)||rec.attempt!==`${operationWork(op.id)}-a1`||rec.resource!==r.selection.authorityRoot||
   !instant(op.createdAt)||!shape(op.owner,["pid","identity","token"])||!Number.isSafeInteger(op.owner.pid)||op.owner.pid<1||!nativeId(op.owner.identity)||
   typeof op.owner.token!=="string"||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(op.owner.token)||
   !Array.isArray(op.claims)||op.claims.length!==2||!same(op.claims.map((/** @type {any} */ c)=>c.role).sort(),["product","records"])||!shape(op.progress,["baseline","stamp","lanes","handoff"]))return false;
  for(const claim of op.claims){const root=r.repositories[claim.role].root;
   if(!shape(claim,["role","resource","file","takenAt","releasedAt"])||claim.resource!==root||
    claim.file!==path.join(rec.resource,".supertaskr/runs/reservations",`${path.basename(root)}-${hash(root).slice(0,12)}.json`)||!instant(claim.takenAt)||!(claim.releasedAt===null||instant(claim.releasedAt)))return false;
  }
  const primary=op.claims.find((/** @type {any} */ c)=>c.role==="product");
  if(rec.reservation.file!==primary.file||rec.reservation.takenAt!==primary.takenAt||rec.reservation.releasedAt!==primary.releasedAt)return false;
  const p=op.progress,b=p.baseline,s=p.stamp,h=p.handoff;
  if(!shape(b,["stage","capture"])||!["captured","running","complete"].includes(b.stage))return false;
  if(r.baseline.kind==="initialized-code-empty"){
   if(b.stage!=="complete"||b.capture!==null)return false;
  }else if(b.stage==="complete"){
   if(!b.capture||b.capture.candidate.productRoot!==rec.resource||!oid(b.capture.candidate.tree,r.repositories.product.objectFormat)||
    !validQualifiedConfiguredGateCapture(b.capture,r.capsule.gatePolicy,{commit:r.selection.revisions.product,tree:b.capture.candidate.tree}))return false;
  }else if(b.capture!==null)return false;
  if(!shape(s,["stage","intent","acceptance"])||!["captured","objects-start","objects-prepared","consumer-prepare","files-prepared","ref-accepted"].includes(s.stage)||
   (s.stage==="captured"?s.intent!==null:!same(s.intent,configuredArmStampIntent(r)))||
   (s.acceptance!==null&&!same(s.acceptance,{commit:r.stamp.commit,tree:r.stamp.tree,ref:r.targetRefs.records,previousRevision:r.selection.revisions.records,attribution:"exact"}))||
   (s.stage==="ref-accepted")!==(s.acceptance!==null)||s.stage!=="captured"&&!(b.stage==="complete"&&(b.capture===null||b.capture.complete===true)))return false;
  if(!Array.isArray(p.lanes)||p.lanes.length!==r.lanes.length||p.lanes.some((/** @type {any} */ l,/** @type {number} */ at)=>{
   const requested=r.lanes[at];if(!shape(l,["role","stage","identity"])||l.role!==requested.role||!["captured","creating","created"].includes(l.stage)||l.stage!=="captured"&&s.acceptance===null)return true;
   if(l.stage!=="created")return l.identity!==null;
   const i=l.identity;return !shape(i,["filesystemRoot","gitCommonDirectory","gitDirectory","device","inode"])||i.filesystemRoot!==requested.checkout||
    i.gitCommonDirectory!==r.repositories[l.role].commonDir||!absolute(i.gitDirectory)||![i.device,i.inode].every(v=>typeof v==="string"&&/^[0-9]{1,64}$/.test(v));
  }))return false;
  // Older held metadata has no brief field. It grants no native handoff and
  // remains readable as an original fact; every new handoff requires the
  // explicit measured brief below.
  if(!(shape(h,["stage","source","native"])&&h.stage==="held"||shape(h,["stage","source","native","brief"]))||!["held","releasing","ready","native-prepared"].includes(h.stage))return false;
  const brief=h.brief??null;
  if(brief!==null&&(!validOwnedBrief(brief,r)||s.acceptance===null||p.lanes.some((/** @type {any} */ l)=>l.stage!=="created")))return false;
  if(h.stage==="held"){
   if(h.source!==null||h.native!==null||op.claims.some((/** @type {any} */ c)=>c.releasedAt!==null))return false;
  }else{
   if(s.acceptance===null||p.lanes.some((/** @type {any} */ l)=>l.stage!=="created")||brief?.stage!=="written"||!validConfiguredArmStampedSource(r,h.source))return false;
   if(["ready","native-prepared"].includes(h.stage)&&op.claims.some((/** @type {any} */ c)=>c.releasedAt===null))return false;
   if(h.stage!=="native-prepared"){if(h.native!==null)return false;}
   else if(!shape(h.native,["attempt","assignmentDigest","permissionDigest"])||h.native.attempt!==r.expectedAttempt||!digest(h.native.assignmentDigest)||!sha(h.native.permissionDigest))return false;
  }
  if(op.acceptance!==null&&!same(op.acceptance,{stamp:s.acceptance,lanes:p.lanes.map((/** @type {any} */ l)=>({role:l.role,identity:l.identity})),sourceDigest:h.source?.digest,native:h.native}))return false;
  return rec.state==="finished"?op.acceptance!==null&&h.stage==="native-prepared":op.acceptance===null;
 }catch{return false;}
}
