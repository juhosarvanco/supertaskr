/** Finite coordinator completion progress attached to the original delivery.
 * This is not ordinary-edit authority or a separate progress namespace. */
import {createHash} from "node:crypto";
import path from "node:path";
import {operationContent,operationDigest,operationPayload,operationWork} from "./operation-record.mjs";
/** @param {any} v @param {string[]} fields */
const shape=(v,fields)=>v&&typeof v==="object"&&!Array.isArray(v)&&Object.keys(v).sort().join("\0")===[...fields].sort().join("\0");
/** @param {any} v */
const digest=v=>typeof v==="string"&&/^sha256:[0-9a-f]{64}$/.test(v);
/** @param {any} v */
const base64=v=>typeof v==="string"&&Buffer.from(v,"base64").toString("base64")===v;
/** @param {any} a @param {any} b */
const same=(a,b)=>operationContent(a)===operationContent(b);
/** @param {any} actor */
function validActor(actor){return shape(actor,["name","email","date"])&&[actor.name,actor.email].every(v=>typeof v==="string"&&v.trim()&&!/[\r\n<>\0]/.test(v))&&typeof actor.date==="string"&&/^-?[0-9]+ [+-][0-9]{4}$/.test(actor.date);}
/** @param {any} value @param {any} request @param {string} requestDigest */
export function validQualifiedCompletionProgress(value,request,requestDigest){
 try{
  if(!shape(value,["version","plan","digest","phase","intent","acceptance"])||value.version!==1||!digest(value.digest)||value.digest!==operationDigest(value.plan)||
   !["captured","objects-start","objects-prepared","working-start","working-prepared","accepted"].includes(value.phase)||request.route.publicationOwed)return false;
  const p=value.plan,l=request.landings.find((/** @type {any} */ l)=>l.roles.includes("records"));
  if(!l||l.repository.root===request.coordinator.root||l.repository.commonDir===request.coordinator.commonDir||
   !shape(p,["version","kind","operationId","deliveryRequestDigest","repository","expectedRevision","targetRef","tool","profile","configurationDigest","cardPath","receiptPath","receipt","writes","tree","preimages","index","identity","message","commit","commitBase64","validation"])||
   p.version!==1||p.kind!=="qualified-delivery-completion"||p.operationId!==request.operationId||p.deliveryRequestDigest!==requestDigest||!same(p.repository,l.repository)||
   p.expectedRevision!==l.commit||p.targetRef!==l.ref||p.cardPath!==request.authority.frozenAuthority.preparation.card.path||
   p.receiptPath!==`docs/checkpoints/delivery-${operationWork(request.operationId).slice(3)}.json`||!digest(p.configurationDigest)||
   !/^[0-9a-f]{40}$/.test(p.tree)||!/^[0-9a-f]{40}$/.test(p.commit)||!base64(p.commitBase64)||!shape(p.identity,["author","committer"])||!validActor(p.identity.author)||!validActor(p.identity.committer)||
   p.message!==`Complete ${request.authority.taskId} private records\n\nSupertaskr-Delivery-Completion: ${request.operationId}\n`)return false;
  const raw=Buffer.from(p.commitBase64,"base64"),actor=(/** @type {any} */ a)=>`${a.name} <${a.email}> ${a.date}`;
  if(!raw.equals(Buffer.from(`tree ${p.tree}\nparent ${p.expectedRevision}\nauthor ${actor(p.identity.author)}\ncommitter ${actor(p.identity.committer)}\n\n${p.message}`))||
   createHash("sha1").update(Buffer.from(`commit ${raw.length}\0`)).update(raw).digest("hex")!==p.commit)return false;
  if(!Array.isArray(p.writes)||p.writes.length!==3||!same(p.writes.map((/** @type {any} */ w)=>w.path).sort(),[p.cardPath,p.receiptPath,"docs/INDEX.md"].sort())||
   p.writes.some((/** @type {any} */ w)=>!shape(w,["path","operation","mode","base64"])||w.operation!=="write"||!["100644","100755"].includes(w.mode)||!base64(w.base64)))return false;
  const receipt=p.writes.find((/** @type {any} */ w)=>w.path===p.receiptPath);
  if(!same(JSON.parse(Buffer.from(receipt.base64,"base64").toString("utf8")),p.receipt)||p.receipt.kind!=="qualified-delivery-receipt"||p.receipt.operationId!==request.operationId||
   p.receipt.taskId!==request.authority.taskId||p.receipt.authorityDigest!==request.authority.authorityDigest||p.receipt.requestDigest!==requestDigest||
   p.receipt.publication!=="not-owed"||p.receipt.ci!=="not-owed"||p.receipt.completion?.expectedRevision!==p.expectedRevision||
   !same(p.receipt.source,{executor:request.authority.executor,verifier:request.authority.verifier,verdictDigest:request.authority.frozenAuthority.review.verdict.digest}))return false;
  const i=p.index;
  if(!Array.isArray(p.preimages)||p.preimages.length!==p.writes.length||new Set(p.preimages.map((/** @type {any} */ v)=>v.path)).size!==p.writes.length||
   p.preimages.some((/** @type {any} */ v)=>!shape(v,["path","work"])||!p.writes.some((/** @type {any} */ w)=>w.path===v.path)||
    !(shape(v.work,["present"])&&v.work.present===false||shape(v.work,["present","mode","base64"])&&v.work.present===true&&["100644","100755"].includes(v.work.mode)&&base64(v.work.base64)))||
   !shape(i,["path","previousDigest","resultDigest","resultBase64","lockToken"])||i.path!==path.join(p.repository.gitDir,"index")||!digest(i.previousDigest)||!digest(i.resultDigest)||
   !base64(i.resultBase64)||operationDigest(i.resultBase64)!==i.resultDigest||typeof i.lockToken!=="string"||!i.lockToken||
   !shape(p.validation,["captureDigest","candidateDigest","retained","procedural","derivations"])||!digest(p.validation.captureDigest)||typeof p.validation.candidateDigest!=="string"||!/^[0-9a-f]{64}$/.test(p.validation.candidateDigest)||
   ![p.validation.retained,p.validation.procedural,p.validation.derivations].every(Array.isArray)||!p.tool||typeof p.tool.manifestDigest!=="string"||!p.profile)return false;
  const intent={ref:p.targetRef,previousRevision:p.expectedRevision,commit:p.commit,tree:p.tree,correlationRef:`refs/supertaskr/deliveries/${operationWork(request.operationId).slice(3)}/completion`};
  if(!same(value.intent,intent)||value.acceptance!==null&&!same(value.acceptance,{...intent,attribution:"exact"})||(value.phase==="accepted")!==(value.acceptance!==null))return false;
  operationPayload(p);return true;
 }catch{return false;}
}
