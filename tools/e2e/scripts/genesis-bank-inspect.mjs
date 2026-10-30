/** Read-only bank discovery in the same canonical OP namespace. Historical
 * exact receipts and current session/write admission remain separate facts.
 * This projection is backend-only: no plans, source bytes or new root selector.
 */
import {lstatSync,realpathSync} from "node:fs";
import {listAcceptedOperations} from "./durable-operation.mjs";
import {observeProjectBank} from "./project-bank-operation.mjs";

/** @param {string} code @returns {never} */
function refuse(code){throw Object.assign(new Error(code),{code});}
/** @param {any} value @returns {any} */
function freeze(value){if(value&&typeof value==="object"){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
/** Missing or replaced original homes are unavailable metadata, never another
 * selected root. Corrupt owned rows/witnesses still refuse the whole read.
 * @param {any} request */
function originalHomesPresent(request){
 const directories=[...request.input.productRepository.identities,...request.input.recordsRepository.identities,request.input.docsIdentity,request.input.runtimeIdentity];
 try{return directories.every(expected=>{const stat=lstatSync(expected.path,{bigint:true});return stat.isDirectory()&&!stat.isSymbolicLink()&&realpathSync(expected.path)===expected.path&&String(stat.dev)===expected.device&&String(stat.ino)===expected.inode;});}catch{return false;}
}
/** Strict enumeration precedes current binding/settings/TOOL policy. The
 * native caller matches the original physical SessionOrigin and offers only
 * opaque recovery tokens; these backend paths must not become renderer input.
 * @param {string} productRoot */
export function discoverGenesisBanks(productRoot){
 productRoot=realpathSync(productRoot);const banks=[];
 for(const record of listAcceptedOperations(productRoot)){
  if(record.operation.kind!=="project-bank")continue;
  const op=record.operation,r=op.request;if(record.resource!==productRoot||r.input.productRepository.root!==productRoot)refuse("genesis-bank-coordinator-mismatch");
  const matched=originalHomesPresent(r),observed=matched?observeProjectBank(productRoot,op.id):null;
  if(matched&&observed===null)refuse("genesis-bank-operation-changed");
  banks.push({operationId:op.id,requestDigest:op.digest,createdAt:op.createdAt,setupId:r.setup.operationId,sessionId:r.session.sessionId,originDigest:r.session.originDigest,origin:r.session.origin,
   stage:r.bank.stage,mode:r.bank.mode,completedStage:r.bank.completedStage,originalCuts:{productRevision:r.input.productRevision,recordsRevision:r.input.recordsRevision},
   state:observed?.status??"unavailable",originStatus:matched?"matched":"unavailable",phase:{records:op.progress.records.stage,product:op.progress.product.stage},
   ...(observed?.receipt?{receipt:observed.receipt}:{})});
 }
 return freeze({status:"banks",banks});
}
