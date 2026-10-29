/** Strict finite local archive receiver progress in the shared OP namespace. */
import {createHash} from "node:crypto";
import path from "node:path";
import {operationContent,operationDigest,operationPayload,operationWork} from "./operation-record.mjs";
/** @param {any} v @param {string[]} fields */
const shape=(v,fields)=>v&&typeof v==="object"&&!Array.isArray(v)&&Object.keys(v).sort().join("\0")===[...fields].sort().join("\0");
/** @param {any} v */
const digest=v=>typeof v==="string"&&/^sha256:[0-9a-f]{64}$/.test(v);
/** @param {any} v */
const instant=v=>typeof v==="string"&&Number.isFinite(Date.parse(v));
/** @param {any} v */
const directory=v=>shape(v,["path","device","inode"])&&typeof v.path==="string"&&path.isAbsolute(v.path)&&[v.device,v.inode].every(n=>typeof n==="string"&&/^[0-9]+$/.test(n));
/** @param {any} request */
export function validPrivateBackupRequest(request){
 try{
  const r=request;
  if(!shape(r,["version","kind","operationId","coordinator","source","configuration","receiver","archive","token"])||r.version!==1||r.kind!=="private-backup"||
   typeof r.operationId!=="string"||!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(r.operationId)||typeof r.coordinator!=="string"||!path.isAbsolute(r.coordinator)||
   !directory(r.receiver)||!shape(r.configuration,["file","digest","runtime","identity"])||r.configuration.file!==path.join(r.coordinator,".supertaskr/private-backup.json")||
   !digest(r.configuration.digest)||!directory(r.configuration.runtime)||r.configuration.runtime.path!==path.join(r.coordinator,".supertaskr")||
   !shape(r.configuration.identity,["device","inode"])||[r.configuration.identity.device,r.configuration.identity.inode].some(v=>typeof v!=="string"||!/^[0-9]+$/.test(v))||
   typeof r.token!=="string"||!/^[0-9a-f-]{36}$/.test(r.token)||!shape(r.source,["version","kind","projectId","save","objectFormat","historyDigest","commits","trees","objects","paths","uncommitted","toolManifestDigest"])||r.source.version!==1||r.source.kind!=="private-backup-source"||
   !shape(r.source.save,["operationId","requestDigest","receiptDigest","commit","tree","ref"])||typeof r.source.save.operationId!=="string"||!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(r.source.save.operationId)||r.source.save.operationId===r.operationId||
   !digest(r.source.historyDigest)||!digest(r.source.save.requestDigest)||!digest(r.source.save.receiptDigest)||!["sha1","sha256"].includes(r.source.objectFormat)||r.source.uncommitted!=="excluded"||
   ![r.source.save.commit,r.source.save.tree].every(v=>typeof v==="string"&&/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(v))||!Array.isArray(r.source.paths)||r.source.paths.some((/** @type {any} */ p)=>typeof p!=="string")||
   r.archive?.kind!=="private-records-backup"||operationContent(r.archive.save)!==operationContent(r.source.save)||r.archive.projectId!==r.source.projectId||r.archive.historyDigest!==r.source.historyDigest)return false;
  const {digest:archiveDigest,...archiveBody}=r.archive;
  if(!digest(archiveDigest)||archiveDigest!==operationDigest(archiveBody)||typeof r.archive.packBase64!=="string"||r.archive.packDigest!==operationDigest(r.archive.packBase64))return false;
  operationPayload(r);return true;
 }catch{return false;}
}
/** @param {any} rec */
export function validPrivateBackupRecord(rec){
 try{
  if(!shape(rec,["version","recordKind","attempt","state","assignment","assignmentDigest","writer","resource","reservation","execution","admission","operation","events"])||rec.version!==1||rec.recordKind!=="operation"||
   !["starting","unknown","finished"].includes(rec.state)||rec.writer!==true||rec.execution!==null||rec.admission!==null||
   !shape(rec.assignment,["kind","id","role","resource"])||rec.assignment.kind!=="operation"||rec.assignment.role!=="private-backup"||rec.assignment.resource!==rec.resource||
   rec.assignmentDigest!==`sha256:${createHash("sha256").update(JSON.stringify(rec.assignment)).digest("hex")}`||
   !shape(rec.reservation,["file","takenAt","releasedAt"])||!instant(rec.reservation.takenAt)||rec.reservation.releasedAt!==null&&!instant(rec.reservation.releasedAt)||
   !Array.isArray(rec.events)||rec.events.some((/** @type {any} */ e)=>!shape(e,["at","op"])||!instant(e.at)||typeof e.op!=="string"))return false;
  const op=rec.operation;
  if(!shape(op,["version","id","kind","request","digest","owner","createdAt","phase","acceptance"])||op.version!==1||op.kind!=="private-backup"||
   !validPrivateBackupRequest(op.request)||op.id!==op.request.operationId||op.digest!==operationDigest(op.request)||rec.assignment.id!==operationWork(op.id)||rec.attempt!==`${operationWork(op.id)}-a1`||
   rec.resource!==op.request.receiver.path||!instant(op.createdAt)||!shape(op.owner,["pid","identity","token"])||!Number.isInteger(op.owner.pid)||op.owner.pid<1||typeof op.owner.identity!=="string"||!op.owner.identity||typeof op.owner.token!=="string"||
   !["captured","publishing","accepted"].includes(op.phase))return false;
  const reservation=path.join(op.request.coordinator,".supertaskr/runs/reservations",`${path.basename(rec.resource)}-${createHash("sha256").update(rec.resource).digest("hex").slice(0,12)}.json`);
  if(rec.reservation.file!==reservation)return false;
  if(op.acceptance===null)return rec.state!=="finished"&&op.phase!=="accepted"&&rec.reservation.releasedAt===null;
  const a=op.acceptance;
  return shape(a,["status","operationId","requestDigest","saveOperationId","commit","tree","file","archiveDigest","attribution"])&&a.status==="backed-up"&&a.operationId===op.id&&a.requestDigest===op.digest&&
   a.saveOperationId===op.request.source.save.operationId&&a.commit===op.request.source.save.commit&&a.tree===op.request.source.save.tree&&
   a.file===path.join(rec.resource,`${operationWork(op.id)}.private-backup.json`)&&a.archiveDigest===op.request.archive.digest&&a.attribution==="exact"&&
   op.phase==="accepted"&&(rec.state==="finished")===instant(rec.reservation.releasedAt);
 }catch{return false;}
}
