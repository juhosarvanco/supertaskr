/** Finite first-installation data definition. It proves no execution, trust,
 * adoption or native callback readiness. Live constructors/effect policy own
 * original TOOL and physical ownership; serialized bytes grant no authority.
 */
import path from "node:path";
import {createHash} from "node:crypto";
import {operationContent,operationDigest,operationPayload,operationWork} from "./operation-record.mjs";
import {validPairedProjectPlan,validProjectRepository,validProjectTool,validProjectDirectory,validProjectSettingsProvenance} from "./project-bank-record.mjs";
import {normalizeRecordProfile} from "./records-profile.mjs";
const ROLES=["product","records"],META=["native-hook","pre-push"];
/** @param {any} value @param {string[]} keys */
const shape=(value,keys)=>value&&typeof value==="object"&&!Array.isArray(value)&&Object.keys(value).sort().join("\0")===[...keys].sort().join("\0");
/** @param {any} a @param {any} b */
const same=(a,b)=>operationContent(a)===operationContent(b);
/** @param {any} value */
const id=value=>typeof value==="string"&&/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(value);
/** @param {any} value */
const sha=value=>typeof value==="string"&&/^[0-9a-f]{64}$/.test(value);
/** @param {any} value */
const digest=value=>typeof value==="string"&&/^sha256:[0-9a-f]{64}$/.test(value);
/** @param {any} value */
const oid=value=>typeof value==="string"&&/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(value);
/** @param {any} value */
const instant=value=>typeof value==="string"&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value)&&Number.isFinite(Date.parse(value));
/** @param {any} value */
const base64=value=>typeof value==="string"&&value.length<=8*1024*1024&&Buffer.from(value,"base64").toString("base64")===value;
/** @param {string} value */
const hash=value=>createHash("sha256").update(value).digest("hex");
/** @param {any} ref */
function bank(ref){return shape(ref,["operationId","requestDigest","receiptDigest","stage","completedStage","recordsCommit","productCommit"])&&id(ref.operationId)&&[ref.requestDigest,ref.receiptDigest].every(digest)&&Number.isInteger(ref.stage)&&ref.stage>=0&&ref.stage<=8&&ref.completedStage===8&&oid(ref.recordsCommit)&&(ref.productCommit===null||oid(ref.productCommit));}
/** @param {any} value */
function methodPath(value){return typeof value==="string"&&/^method\/skills\/(?:supertaskr-interview|supertaskr-seat)\/(?:[A-Za-z0-9_.-]+\/)*[A-Za-z0-9_.-]+$/.test(value)&&!value.split("/").some((/** @type {string} */ part)=>[".",".."].includes(part));}
/** Structural path vocabulary only; actual accepted membership/bytes remain
 * the finite installer and completed-genesis engine's responsibility.
 * @param {any} value */
export function isProjectInstallationProductPath(value){
 return value===".codex/hooks.json"||typeof value==="string"&&value.startsWith(".agents/skills/")&&methodPath(`method/skills/${value.slice(".agents/skills/".length)}`);
}
/** @param {any} assets @param {any} r */
function validAssets(assets,r){
 if(!shape(assets,["version","kind","productRoot","productRevision","repository","recordsRoot","association","tool","configuration","product","metadata","membership","readiness","digest"])||assets.version!==1||assets.kind!=="project-install-assets"||
  assets.productRoot!==r.input.productRepository.root||assets.productRevision!==r.input.productRevision||!same(assets.repository,r.input.productRepository)||assets.recordsRoot!==r.input.recordsRepository.root||!same(assets.tool,r.tool)||!same(assets.configuration,r.input.settingsProvenance)||
  !same(assets.readiness,{installed:false,hostTrust:"unestablished",nativeCallbacks:"unestablished"}))return false;
 const {digest:claimed,...body}=assets;if(claimed!==operationDigest(body))return false;
 if(!Array.isArray(assets.membership)||!assets.membership.length||assets.membership.length>127||assets.membership.some((/** @type {any} */ member)=>!shape(member,["path","sha256"])||!methodPath(member.path)||!sha(member.sha256))||new Set(assets.membership.map((/** @type {any} */ m)=>m.path)).size!==assets.membership.length)return false;
 if(!["supertaskr-interview","supertaskr-seat"].every(skill=>assets.membership.some((/** @type {any} */ m)=>m.path===`method/skills/${skill}/SKILL.md`)))return false;
 const expected=[".codex/hooks.json",...assets.membership.map((/** @type {any} */ m)=>`.agents/skills/${m.path.slice("method/skills/".length)}`)];
 if(!Array.isArray(assets.product)||assets.product.length!==expected.length||assets.product.some((/** @type {any} */ file,/** @type {number} */ at)=>!shape(file,["path","mode","base64"])||file.path!==expected[at]||file.mode!=="100644"||!base64(file.base64)))return false;
 for(const member of assets.membership){const file=assets.product.find((/** @type {any} */ f)=>f.path===`.agents/skills/${member.path.slice("method/skills/".length)}`);if(createHash("sha256").update(Buffer.from(file.base64,"base64")).digest("hex")!==member.sha256)return false;}
 return Array.isArray(assets.metadata)&&assets.metadata.length===2&&assets.metadata.every((/** @type {any} */ file,/** @type {number} */ at)=>shape(file,["role","path","mode","base64"])&&file.role===META[at]&&file.mode===0o700&&base64(file.base64)&&
  file.path===path.join(r.input.productRepository.commonDir,at===0?`supertaskr/native-hooks/native-${r.tool.manifestDigest}.sh`:"hooks/pre-push"));
}
/** @param {any} request */
export function validProjectInstallRequest(request){
 try{
  const r=operationPayload(request);
  if(!shape(r,["version","kind","operationId","tool","baseline","assets","input","installation","plans"])||r.version!==1||r.kind!=="project-install"||!id(r.operationId)||!validProjectTool(r.tool)||
   !shape(r.input,["productRevision","recordsRevision","productRepository","recordsRepository","docsIdentity","runtimeIdentity","settingsProvenance"])||!ROLES.every(role=>validProjectRepository(r.input[`${role}Repository`])&&oid(r.input[`${role}Revision`]))||
   !validProjectDirectory(r.input.docsIdentity)||!validProjectDirectory(r.input.runtimeIdentity)||r.input.docsIdentity.path!==path.join(r.input.recordsRepository.root,"docs")||r.input.runtimeIdentity.path!==path.join(r.input.productRepository.root,".supertaskr")||!validProjectSettingsProvenance(r.input.settingsProvenance,r))return false;
  const p=r.input.productRepository,notes=r.input.recordsRepository;
  if(![path.relative(p.root,notes.root),path.relative(notes.root,p.root)].every(v=>v===".."||v.startsWith(`..${path.sep}`)||path.isAbsolute(v))||p.identities.some((/** @type {any} */ a)=>notes.identities.some((/** @type {any} */ b)=>a.device===b.device&&a.inode===b.inode)))return false;
  const b=r.baseline;
  if(!shape(b,["kind","setup","bank8","latestBank","revisions","configuration","productFiles","qualifiedSuiteBaseline"])||b.kind!=="initialized-code-empty"||b.qualifiedSuiteBaseline!==false||!same(b.revisions,{product:r.input.productRevision,records:r.input.recordsRevision})||!same(b.configuration,r.input.settingsProvenance)||!bank(b.bank8)||b.bank8.stage!==8||!bank(b.latestBank)||
   !shape(b.setup,["operationId","requestDigest","receiptDigest","projectId","productRevision","recordsRevision"])||![b.setup.operationId,b.setup.projectId].every(id)||![b.setup.requestDigest,b.setup.receiptDigest].every(digest)||![b.setup.productRevision,b.setup.recordsRevision].every(oid)||
   !Array.isArray(b.productFiles)||b.productFiles.length!==4||!same(b.productFiles.map((/** @type {any} */ f)=>f.path),[".gitignore","AGENTS.md","CLAUDE.md","supertaskr.yaml"])||b.productFiles.some((/** @type {any} */ f)=>!shape(f,["path","mode","sha256"])||f.mode!=="100644"||!sha(f.sha256)))return false;
  if(!validAssets(r.assets,r)||!shape(r.plans,ROLES)||!ROLES.every(role=>validPairedProjectPlan(r.plans[role],r,role,"project-install")))return false;
  if(!same(r.plans.product.writes,r.assets.product.map((/** @type {any} */ file)=>({operation:"add",...file,derived:false}))))return false;
  const writes=r.plans.records.writes,ordinary=writes.filter((/** @type {any} */ w)=>!w.derived);
  if(ordinary.length!==1||ordinary[0].path!=="docs/CONVENTIONS.md"||ordinary[0].operation!=="edit"||ordinary[0].mode!=="100644"||writes.some((/** @type {any} */ w)=>w.derived&&(w.path!=="docs/INDEX.md"||w.mode!=="100644")))return false;
  const install=r.installation,v=install?.validation;
  return shape(install,["mode","validation"])&&install.mode==="first"&&shape(v,["profile","captureDigest","candidateDigest","writeSetDigest"])&&same(normalizeRecordProfile(v.profile),v.profile)&&digest(v.captureDigest)&&sha(v.candidateDigest)&&v.writeSetDigest===operationDigest(writes);
 }catch{return false;}
}

/** @param {any} value @param {any} expected */
function fileIdentity(value,expected){return shape(value,["path","device","inode","mode","byteLength","sha256"])&&value.path===expected.path&&[value.device,value.inode].every(v=>typeof v==="string"&&/^[0-9]{1,64}$/.test(v))&&value.mode===expected.mode&&value.byteLength===Buffer.byteLength(expected.base64,"base64")&&value.sha256===createHash("sha256").update(Buffer.from(expected.base64,"base64")).digest("hex");}
/** Strict original OP data, still unregistered until the finite effect owner
 * is independently reviewed. No stored process/command/path is executed here.
 * @param {any} rec */
export function validProjectInstallRecord(rec){
 try{
  if(!shape(rec,["version","recordKind","attempt","state","assignment","assignmentDigest","writer","resource","reservation","execution","admission","operation","events"])||rec.version!==1||rec.recordKind!=="operation"||!["starting","unknown","finished"].includes(rec.state)||rec.writer!==true||rec.execution!==null||rec.admission!==null||
   !shape(rec.assignment,["kind","id","role","resource"])||rec.assignment.kind!=="operation"||rec.assignment.role!=="project-install"||rec.assignment.resource!==rec.resource||rec.assignmentDigest!==`sha256:${hash(JSON.stringify(rec.assignment))}`||
   !shape(rec.reservation,["file","takenAt","releasedAt"])||!instant(rec.reservation.takenAt)||!(rec.reservation.releasedAt===null||instant(rec.reservation.releasedAt))||!Array.isArray(rec.events)||rec.events.some((/** @type {any} */ e)=>!shape(e,["at","op"])||!instant(e.at)||typeof e.op!=="string"))return false;
  const op=rec.operation;
  if(!shape(op,["version","id","kind","request","digest","owner","createdAt","claims","progress","acceptance"])||op.version!==1||op.kind!=="project-install"||!validProjectInstallRequest(op.request)||op.id!==op.request.operationId||op.digest!==operationDigest(op.request)||rec.resource!==op.request.input.productRepository.root||rec.assignment.id!==operationWork(op.id)||rec.attempt!==`${operationWork(op.id)}-a1`||!instant(op.createdAt)||
   !shape(op.owner,["pid","identity","token"])||!Number.isInteger(op.owner.pid)||op.owner.pid<1||typeof op.owner.identity!=="string"||!op.owner.identity||typeof op.owner.token!=="string"||!op.owner.token||!Array.isArray(op.claims)||op.claims.length!==2||!shape(op.progress,[...ROLES,"metadata"]))return false;
  for(const role of ROLES){const plan=op.request.plans[role],resource=op.request.input[`${role}Repository`].root,claims=op.claims.filter((/** @type {any} */ c)=>c.role===role),progress=op.progress[role];
   if(claims.length!==1)return false;const c=claims[0],file=path.join(rec.resource,".supertaskr/runs/reservations",`${path.basename(resource)}-${hash(resource).slice(0,12)}.json`);
   if(!shape(c,["role","resource","file","takenAt","releasedAt"])||c.resource!==resource||c.file!==file||!instant(c.takenAt)||!(c.releasedAt===null||instant(c.releasedAt))||!shape(progress,["stage","intent","acceptance"]))return false;
   if(role==="product"&&(rec.reservation.file!==c.file||rec.reservation.takenAt!==c.takenAt||rec.reservation.releasedAt!==c.releasedAt))return false;
   if(!["captured","objects-start","objects-prepared","consumer-prepare","files-prepared","ref-accepted"].includes(progress.stage))return false;
   const expected={commit:plan.commit,tree:plan.tree,ref:plan.targetRef,previousRevision:plan.expectedRevision},correlationRef=`refs/supertaskr/project-installs/${operationWork(op.id).slice(3)}/${role}`;
   if(progress.intent!==null&&!same(progress.intent,{...expected,correlationRef})||progress.acceptance!==null&&!same(progress.acceptance,{...expected,attribution:"exact"})||progress.acceptance!==null&&progress.intent===null||
    (progress.stage==="ref-accepted")!==(progress.acceptance!==null)||progress.stage!=="captured"&&progress.intent===null||role==="product"&&progress.stage!=="captured"&&op.progress.records.acceptance===null)return false;
  }
  if(!Array.isArray(op.progress.metadata)||op.progress.metadata.length!==2)return false;
  for(const [at,m] of op.progress.metadata.entries()){
   const asset=op.request.assets.metadata[at],staged={...asset,path:`${asset.path}.supertaskr-${operationWork(op.id)}.tmp`};
   if(!shape(m,["role","stage","staged","acceptance"])||m.role!==asset.role||!["captured","staged","accepted"].includes(m.stage)||m.staged!==null&&!fileIdentity(m.staged,staged)||m.acceptance!==null&&!fileIdentity(m.acceptance,asset)||
    m.stage==="captured"&&(m.staged!==null||m.acceptance!==null)||m.stage!=="captured"&&(m.staged===null||op.progress.records.acceptance===null)||
    (m.stage==="accepted")!==(m.acceptance!==null)||m.acceptance!==null&&(m.staged.device!==m.acceptance.device||m.staged.inode!==m.acceptance.inode))return false;
  }
  const metadata=op.progress.metadata.every((/** @type {any} */ m)=>m.acceptance!==null);
  if(op.progress.product.stage!=="captured"&&!metadata)return false;
  if(op.acceptance!==null&&(!metadata||ROLES.some(role=>op.progress[role].acceptance===null)||!same(op.acceptance,{records:op.progress.records.acceptance,product:op.progress.product.acceptance,metadata:op.progress.metadata.map((/** @type {any} */ m)=>m.acceptance),attribution:"exact"})))return false;
  if(op.claims.some((/** @type {any} */ c)=>c.releasedAt!==null)&&op.acceptance===null)return false;
  return rec.state!=="finished"||op.acceptance!==null&&op.claims.every((/** @type {any} */ c)=>instant(c.releasedAt));
 }catch{return false;}
}
