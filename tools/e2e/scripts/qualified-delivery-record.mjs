/** Strict integration, publication, CI and finite private completion progress
 * in one operation. Each effect owner must prove its actual retained result. */
import {createHash} from "node:crypto";
import path from "node:path";
import {operationContent,operationDigest,operationPayload,operationWork} from "./operation-record.mjs";
import {validQualifiedCompletionProgress} from "./qualified-completion-record.mjs";
import {validQualifiedPublicationProgress} from "./qualified-publication-record.mjs";
import {validQualifiedCiProgress} from "./qualified-ci-record.mjs";
import {normalizeProjectPublication} from "../../../lib/parser/dist/pure.js";
import {validConfiguredDispatchCapsule} from "../../../cli/configured-native-reader.mjs";
import {validQualifiedConfiguredAuthorityGrades} from "./qualified-configured-grades.mjs";
import {validQualifiedPlannedDeliveryRequest,validQualifiedIntegrationProgress} from "./qualified-integration-record.mjs";
/** @param {any} v @param {string[]} fields */
function shape(v,fields){return v && typeof v === "object" && !Array.isArray(v) && Object.keys(v).sort().join("\0") === [...fields].sort().join("\0");}
/** @param {any} v */
function oid(v){return typeof v === "string" && /^[0-9a-f]{40}$/.test(v);}
/** @param {any} v */
function digest(v){return typeof v === "string" && /^sha256:[0-9a-f]{64}$/.test(v);}
/** @param {any} v */
function date(v){return typeof v === "string" && Number.isFinite(Date.parse(v));}
/** @param {any} v */
function repository(v){return shape(v,["root","gitDir","commonDir","objectFormat","rootCommits","identities"]) && v.objectFormat === "sha1" &&
 [v.root,v.gitDir,v.commonDir].every(p=>typeof p === "string" && path.isAbsolute(p)) && Array.isArray(v.rootCommits) && v.rootCommits.length>0 && v.rootCommits.every(oid) &&
 Array.isArray(v.identities) && v.identities.length === 4 && v.identities.every((/** @type {any} */ i)=>shape(i,["path","device","inode"]) &&
 typeof i.path === "string" && path.isAbsolute(i.path) && typeof i.device === "string" && /^[0-9]+$/.test(i.device) && typeof i.inode === "string" && /^[0-9]+$/.test(i.inode));}
/** @param {any} p */
function relative(p){return typeof p === "string" && p && !/[\\\x00-\x1f\x7f]/.test(p) && !path.posix.isAbsolute(p) && !path.win32.isAbsolute(p) &&
 p.split("/").every(s=>s && ![".","..",".git",".supertaskr"].includes(s.toLowerCase()));}
/** @param {any} v */
function snapshot(v){return shape(v,["present"]) && v.present === false || shape(v,["present","mode","base64"]) && v.present === true && ["100644","100755"].includes(v.mode) &&
 typeof v.base64 === "string" && Buffer.from(v.base64,"base64").toString("base64") === v.base64;}
/** @param {any} v */
function physical(v){return shape(v,["path","device","inode","mode"])&&typeof v.path==="string"&&path.isAbsolute(v.path)&&[v.device,v.inode].every(n=>typeof n==="string"&&/^[0-9]+$/.test(n))&&Number.isInteger(v.mode)&&v.mode>=0&&v.mode<=0o777;}
/** Exact retained source projection. Configured provenance is a paired datum;
 * only the actual retained-source constructor can establish it at new effects.
 * Historical legacy projections remain readable, while current phase policy
 * independently refuses omission from a genuinely configured stored attempt.
 * @param {any} source @param {{attempt:string,assignmentDigest:string,permissionDigest:string,taskId:string,receipt:any}} expected */
export function validQualifiedDeliveryPolicySource(source,expected){
 try{
  const configured=Object.hasOwn(source??{},"permission"),origins=source?.native?.qualified?.origins;
  if(!shape(source,["attempt","assignment","resource","reservation","native",...(configured?["permission"]:[])])||source.attempt!==expected.attempt||
   `sha256:${createHash("sha256").update(JSON.stringify(source.assignment)).digest("hex")}`!==expected.assignmentDigest||source.assignment.id!==expected.taskId||
   !shape(source.native,["qualified"])||!shape(source.native.qualified,["origins"])||!shape(origins,["receipt",...(configured?["configuredDispatch"]:[])])||
   operationContent(origins.receipt)!==operationContent(expected.receipt))return false;
  if(!configured)return true;
  const capsule=origins.configuredDispatch;
  if(!shape(source.permission,["digest"])||typeof source.permission.digest!=="string"||!/^[0-9a-f]{64}$/.test(source.permission.digest)||source.permission.digest!==expected.permissionDigest||
   !validConfiguredDispatchCapsule(capsule)||operationContent(capsule.receipt)!==operationContent(expected.receipt)||capsule.selection.taskId!==expected.taskId||
   operationContent(capsule.selection.revisions)!==operationContent(source.assignment.qualified.revisions))return false;
  const {digest:claimed,...body}=capsule;return claimed===operationDigest(body);
 }catch{return false;}
}
/** Finite original full-route selection; current qualification and owned
 * actual advertised-ref checks still belong to the effect owner.
 * @param {any} p @param {any} req @param {any} product */
function publicationContext(p,req,product){
 if(!shape(p,["version","kind","route","coordinatorRoot","operationId","authorityDigest","configuration","tool","hook","destination","transportDigest","commit","tree","correlationRef","ci","digest"])||
  p.version!==1||p.kind!=="qualified-publication-context"||p.route!=="normal-atomic-fast-forward"||p.coordinatorRoot!==req.coordinator.root||p.operationId!==req.operationId||p.authorityDigest!==req.authority.authorityDigest||
  !shape(p.configuration,["revision","digest"])||p.configuration.revision!==product.actualOutput.commit||!digest(p.configuration.digest)||!digest(p.transportDigest)||
  p.commit!==product.actualOutput.commit||p.tree!==product.actualOutput.tree||p.correlationRef!==`refs/supertaskr/deliveries/${operationWork(req.operationId).slice(3)}/publication`||
  !shape(p.destination,["name","url","ref","expectedOld","endpoint"])||typeof p.destination.url!=="string"||!p.destination.url||/[\x00-\x1f\x7f]/.test(p.destination.url)||p.destination.expectedOld!==product.originalBase)return false;
 const selected=normalizeProjectPublication({remote:p.destination.name,destinationRef:p.destination.ref,ci:p.ci});if(operationContent(selected.ci)!==operationContent(p.ci))return false;
 const e=p.destination.endpoint;
 if(e?.kind==="github"){if(!shape(e,["kind","providerRepository"])||e.providerRepository!==p.ci.repository)return false;}
 else if(e?.kind==="local"){
  if(!shape(e,["kind","path","providerRepository","identities","configurationDigest"])||e.path!==p.destination.url||!path.isAbsolute(e.path)||e.providerRepository!==null||!digest(e.configurationDigest)||
   !Array.isArray(e.identities)||e.identities.length!==2||e.identities.some((/** @type {any} */ i,/** @type {number} */ at)=>!shape(i,["path","device","inode"])||i.path!==(at===0?e.path:path.join(e.path,"objects"))||[i.device,i.inode].some(n=>typeof n!=="string"||!/^\d+$/.test(n))))return false;
 }else return false;
 const h=p.hook;
 if(!shape(h,["version","product","directory","file","sha256","node","nodeSha256","entry","closure"])||h.version!==1||![h.product,h.directory,h.file,h.node].every(physical)||h.product.path!==req.coordinator.root||
  h.file.path!==path.join(h.directory.path,"pre-push")||!(h.file.mode&0o111)||![h.sha256,h.nodeSha256].every(v=>typeof v==="string"&&/^[0-9a-f]{64}$/.test(v))||typeof h.entry!=="string"||!path.isAbsolute(h.entry)||
  !shape(h.closure,["manifestDigest","runtimeDigest","files"])||!Array.isArray(h.closure.files)||!h.closure.files.length||h.closure.manifestDigest!==p.tool?.manifestDigest||h.closure.runtimeDigest!==p.tool?.runtimeDigest||
  h.closure.files.some((/** @type {any} */ f)=>!shape(f,["path","sha256"])||typeof f.path!=="string"||typeof f.sha256!=="string"||!/^[0-9a-f]{64}$/.test(f.sha256)))return false;
 const {digest:claimed,...body}=p;return digest(claimed)&&claimed===operationDigest(body);
}
/** @param {any} req */
export function validQualifiedDeliveryRequest(req){
 try{return validRequest(req);}catch{return false;}
}
/** @param {any} req */
function validRequest(req){
 if(req?.route?.name==="local-planned-output-v1")return validQualifiedPlannedDeliveryRequest(req);
 const full=req?.route?.name==="protected-atomic-push-v1";
 if(!shape(req,["version","operationId","kind","coordinator","docsDirectory","runtimeDirectory","authority","policySource","targets","route","landings"]) || req.version !== 1 || req.kind !== "qualified-delivery" ||
 typeof req.operationId !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(req.operationId) || !repository(req.coordinator) ||
 !shape(req.route,["name","publicationOwed","completionOwed","policyRevision",...(full?["publication"]:[])]) || !["local-exact-output-v1","protected-atomic-push-v1"].includes(req.route.name) || typeof req.route.publicationOwed !== "boolean" || req.route.completionOwed !== true || !oid(req.route.policyRevision))return false;
 const a=req.authority;if(!shape(a,["version","taskId","projectId","executor","verifier","frozenAuthority","roles","physicalLandings","owedCorrections","gradeObligations","authorityDigest"]) ||
 a.version !== 1 || !/^T-\d+(?:-s\d+)?$/.test(a.taskId) || !digest(a.authorityDigest) || !Array.isArray(a.roles) || a.roles.length !== 2 ||
 operationContent(a.roles.map((/** @type {any} */ r)=>r.role).sort()) !== operationContent(["product","records"]) ||
 !Array.isArray(a.owedCorrections) || a.owedCorrections.length !== 0 || !Array.isArray(req.landings) || req.landings.length < 1 || req.landings.length > 2)return false;
 const {authorityDigest,...body}=a;if(authorityDigest !== operationDigest(body))return false;
 if(!shape(req.targets,["product","records"]) || !shape(a.frozenAuthority,["receipt","scope","preparation","review"]) || !Array.isArray(a.frozenAuthority.review.actualOutputs) ||
  !Array.isArray(a.frozenAuthority.review.actualOutputGrades) || !Array.isArray(a.frozenAuthority.review.corrections) || a.frozenAuthority.review.corrections.length)return false;
 for(const r of a.roles){const t=req.targets[r.role],outputs=a.frozenAuthority.review.actualOutputs.filter((/** @type {any} */ o)=>o.role === r.role),grades=a.frozenAuthority.review.actualOutputGrades.filter((/** @type {any} */ g)=>g.role === r.role);
  if(!shape(t,["ref","expectedRevision"]) || typeof t.ref !== "string" || !/^refs\/heads\/[^\s]+$/.test(t.ref) || t.expectedRevision !== r.originalBase ||
   r.originalBase !== a.frozenAuthority.scope.revisions[r.role] || r.candidate !== a.frozenAuthority.preparation.candidates[r.role] ||
   operationContent(r.repository) !== operationContent(a.frozenAuthority.scope.fence.repositories[r.role]) || outputs.length !== 1 || grades.length !== 1 ||
   operationContent(r.actualOutput) !== operationContent(outputs[0]) || operationContent(r.actualOutputGrades) !== operationContent(grades))return false;
 }
 for(const d of [req.docsDirectory,req.runtimeDirectory])if(!shape(d,["path","device","inode"]) || typeof d.path !== "string" || !path.isAbsolute(d.path) || typeof d.device !== "string" || !/^[0-9]+$/.test(d.device) || typeof d.inode !== "string" || !/^[0-9]+$/.test(d.inode))return false;
 if(req.docsDirectory.path !== path.join(a.frozenAuthority.receipt.recordsRoot,"docs") || req.runtimeDirectory.path !== path.join(req.coordinator.root,".supertaskr"))return false;
 if(!validQualifiedDeliveryPolicySource(req.policySource,{...a.verifier,taskId:a.taskId,receipt:a.frozenAuthority.receipt})||!validQualifiedConfiguredAuthorityGrades(a,req.policySource))return false;
 const product=a.roles.find((/** @type {any} */ r)=>r.role === "product");
 if(req.route.publicationOwed !== (product.actualOutput.implementation.length>0) || req.route.policyRevision !== product.actualOutput.commit)return false;
 if(full&&(!req.route.publicationOwed||!publicationContext(req.route.publication,req,product)))return false;
 const roots=new Set(),keys=new Set();
 for(const l of req.landings){
  if(!shape(l,["key","roles","repository","expectedRevision","ref","commit","tree","writes","working"]) || !Array.isArray(l.roles) || !l.roles.length ||
   l.roles.some((/** @type {any} */ r)=>!["product","records"].includes(r)) || l.key !== [...l.roles].sort().join("-") || keys.has(l.key) ||
   !repository(l.repository) || roots.has(l.repository.root) || !oid(l.expectedRevision) || !oid(l.commit) || !oid(l.tree) || typeof l.ref !== "string" || !/^refs\/heads\/[^\s]+$/.test(l.ref) ||
   !Array.isArray(l.writes) || !l.writes.length || new Set(l.writes.map((/** @type {any} */ w)=>w.path)).size !== l.writes.length)return false;
  roots.add(l.repository.root);keys.add(l.key);
  for(const role of l.roles){const r=a.roles.find((/** @type {any} */ r)=>r.role === role),g=r?.actualOutputGrades;
   if(!r || r.repository.filesystemRoot !== l.repository.root || r.originalBase !== l.expectedRevision || r.actualOutput.commit !== l.commit || r.actualOutput.tree !== l.tree ||
   !Array.isArray(g) || g.length !== 1 || g[0].exit !== 0 || g[0].commit !== l.commit || g[0].tree !== l.tree ||
   operationContent(req.targets[role]) !== operationContent({ref:l.ref,expectedRevision:l.expectedRevision}))return false;
  }
  for(const w of l.writes)if(!relative(w.path) || !(shape(w,["path","operation"]) && w.operation === "delete" ||
   shape(w,["path","operation","mode","base64"]) && w.operation === "write" && ["100644","100755"].includes(w.mode) && typeof w.base64 === "string" && Buffer.from(w.base64,"base64").toString("base64") === w.base64))return false;
  const w=l.working,i=w?.index;
  if(!shape(w,["preimages","index"]) || !Array.isArray(w.preimages) || w.preimages.length !== l.writes.length ||
   w.preimages.some((/** @type {any} */ p)=>!shape(p,["path","work"]) || !l.writes.some((/** @type {any} */ write)=>write.path === p.path) || !snapshot(p.work)) ||
   new Set(w.preimages.map((/** @type {any} */ p)=>p.path)).size !== l.writes.length || !shape(i,["path","previousDigest","resultDigest","resultBase64","lockToken"]) ||
   i.path !== path.join(l.repository.gitDir,"index") || !digest(i.previousDigest) || !digest(i.resultDigest) || typeof i.resultBase64 !== "string" ||
   Buffer.from(i.resultBase64,"base64").toString("base64") !== i.resultBase64 || operationDigest(i.resultBase64) !== i.resultDigest || typeof i.lockToken !== "string" || !i.lockToken)return false;
 }
 const expected=a.physicalLandings.filter((/** @type {any} */ p)=>a.roles.some((/** @type {any} */ r)=>p.roles.includes(r.role) && r.actualOutput.commit !== r.originalBase));
 if(expected.length !== req.landings.length || expected.some((/** @type {any} */ p)=>!req.landings.some((/** @type {any} */ l)=>l.repository.root === p.root && operationContent(l.roles) === operationContent([...p.roles].sort()))))return false;
 try{operationPayload(req);}catch{return false;}return true;
}
/** @param {any} rec */
export function validQualifiedDeliveryRecord(rec){
 try{return validRecord(rec);}catch{return false;}
}
/** @param {any} rec */
function validRecord(rec){
 if(!shape(rec,["version","recordKind","attempt","state","assignment","assignmentDigest","writer","resource","reservation","execution","admission","operation","events"]) ||
 rec.version !== 1 || rec.recordKind !== "operation" || !["starting","unknown","finished"].includes(rec.state) || rec.writer !== true || rec.execution !== null || rec.admission !== null ||
 !shape(rec.assignment,["kind","id","role","resource"]) || rec.assignment.kind !== "operation" || rec.assignment.role !== "qualified-delivery" || rec.assignment.resource !== rec.resource ||
 rec.assignmentDigest !== `sha256:${createHash("sha256").update(JSON.stringify(rec.assignment)).digest("hex")}` ||
 !shape(rec.reservation,["file","takenAt","releasedAt"]) || !date(rec.reservation.takenAt) || rec.reservation.releasedAt !== null&&!date(rec.reservation.releasedAt) ||
 !Array.isArray(rec.events) || rec.events.some((/** @type {any} */ e)=>!shape(e,["at","op"]) || !date(e.at) || typeof e.op !== "string"))return false;
 const op=rec.operation;
 const planned=op?.request?.route?.name==="local-planned-output-v1";
 if(!shape(op,["version","id","kind","request","digest","owner","createdAt","claims","progress","localAcceptance",...(planned?["integration"]:[]),...(Object.hasOwn(op,"completion")?["completion"]:[]),...(Object.hasOwn(op,"publication")?["publication"]:[]),...(Object.hasOwn(op,"validation")?["validation"]:[])]) || op.version !== 1 || op.kind !== "qualified-delivery" ||
 !validQualifiedDeliveryRequest(op.request) || op.id !== op.request.operationId || op.digest !== operationDigest(op.request) || rec.assignment.id !== operationWork(op.id) || rec.attempt !== `${operationWork(op.id)}-a1` ||
 !date(op.createdAt) || !shape(op.owner,["pid","identity","token"]) || !Number.isInteger(op.owner.pid) || op.owner.pid<1 || typeof op.owner.identity !== "string" || !op.owner.identity || typeof op.owner.token !== "string" ||
 !Array.isArray(op.claims) || op.claims.length !== op.request.landings.length || !Array.isArray(op.progress) || op.progress.length !== op.claims.length)return false;
 if(planned&&!validQualifiedIntegrationProgress(op.integration,op.request.integration.plan,op.request.integration.execution))return false;
 for(const l of op.request.landings){const cs=op.claims.filter((/** @type {any} */ c)=>c.key === l.key),ps=op.progress.filter((/** @type {any} */ p)=>p.key === l.key);
  if(cs.length !== 1 || ps.length !== 1)return false;const c=cs[0],p=ps[0];
  if(!shape(c,["key","resource","file","takenAt","releasedAt"]) || c.resource !== l.repository.root || c.file !== path.join(op.request.coordinator.root,".supertaskr/runs/reservations",`${path.basename(c.resource)}-${createHash("sha256").update(c.resource).digest("hex").slice(0,12)}.json`) || !date(c.takenAt) || c.releasedAt !== null&&!date(c.releasedAt) ||
   !shape(p,["key","phase","intent","acceptance"]) || !["captured",...(planned?["objects-start","objects-prepared"]:[]),"working-start","working-prepared","accepted"].includes(p.phase) ||
   !shape(p.intent,["ref","previousRevision","commit","tree","correlationRef"]) || p.intent.ref !== l.ref || p.intent.previousRevision !== l.expectedRevision || p.intent.commit !== l.commit || p.intent.tree !== l.tree ||
   p.intent.correlationRef !== `refs/supertaskr/deliveries/${operationWork(op.id).slice(3)}/${l.key}` ||
   p.acceptance !== null && operationContent(p.acceptance) !== operationContent({...p.intent,attribution:"exact"}) || (p.phase === "accepted") !== (p.acceptance !== null))return false;
  if(planned&&p.phase!=="captured"&&op.integration.phase!=="ready")return false;
 }
 const primary=op.claims[0];if(rec.resource !== primary.resource || rec.reservation.file !== primary.file || rec.reservation.takenAt !== primary.takenAt)return false;
 if(op.localAcceptance !== null&&!(op.progress.every((/** @type {any} */ p)=>p.acceptance !== null)&&operationContent(op.localAcceptance)===operationContent(op.progress.map((/** @type {any} */ p)=>({key:p.key,...p.acceptance})))))return false;
 if(op.publication!==undefined&&(!validQualifiedPublicationProgress(op.publication,op.request)||op.localAcceptance===null))return false;
 if(op.validation!==undefined&&!validQualifiedCiProgress(op.validation,op.request,op.publication))return false;
 if(op.completion!==undefined&&(!validQualifiedCompletionProgress(op.completion,op.request,op.digest,op)||op.localAcceptance===null))return false;
 const accepted=op.completion?.acceptance!==null&&op.completion?.acceptance!==undefined;
 if(!accepted&&(rec.reservation.releasedAt!==null||op.claims.some((/** @type {any} */ c)=>c.releasedAt!==null)||rec.state==="finished"))return false;
 return rec.reservation.releasedAt===primary.releasedAt&&(rec.state==="finished")===(accepted&&op.claims.every((/** @type {any} */ c)=>date(c.releasedAt)));
}
