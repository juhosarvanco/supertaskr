/** Strict provider validation progress in the original qualified delivery OP.
 * Recomputed data validity is not a caller acceptance flag; only the fixed
 * provider controller may produce its retained point-in-time observation. */
import {operationContent,operationDigest,operationPayload} from "./operation-record.mjs";
import {normalizeExactDeliveryCiRequirement,qualifyExactDeliveryCi} from "./qualified-delivery-ci.mjs";
/** @param {any} v @param {string[]} fields */
const shape=(v,fields)=>v&&typeof v==="object"&&!Array.isArray(v)&&Object.keys(v).sort().join("\0")===[...fields].sort().join("\0");
/** @param {any} a @param {any} b */
const same=(a,b)=>operationContent(a)===operationContent(b);
/** @param {any} v */
const date=v=>typeof v==="string"&&Number.isFinite(Date.parse(v));
/** @param {any} n */
const id=n=>Number.isSafeInteger(n)&&n>0;
/** @param {any} v */
function run(v){return shape(v,["id","attempt","workflowId","checkSuiteId","status","conclusion"])&&[v.id,v.attempt,v.workflowId,v.checkSuiteId].every(id)&&typeof v.status==="string"&&v.status.length>0&&v.status.length<=64&&!/[\x00-\x1f\x7f]/.test(v.status)&&
 (v.conclusion===null||typeof v.conclusion==="string"&&v.conclusion.length<=64&&!/[\x00-\x1f\x7f]/.test(v.conclusion));}
/** @param {any} a @param {any} b */
const sameRun=(a,b)=>a.id===b.id&&a.attempt===b.attempt&&a.workflowId===b.workflowId&&a.checkSuiteId===b.checkSuiteId;
/** @param {any} request */
export function qualifiedDeliveryCiSelection(request){const p=request.route.publication;return {...p.ci,ref:p.destination.ref,headCommit:p.commit};}
/** @param {any} receipt @param {boolean} [success] */
function http(receipt,success=true){
 if(!shape(receipt,["host","path","status","sha256","byteLength","observedAt","serverDate",...(receipt?.pagination===undefined?[]:["pagination"])])||receipt.host!=="api.github.com"||
  typeof receipt.path!=="string"||receipt.path.length>4096||/[\x00-\x20\x7f]/.test(receipt.path)||!(success?receipt.status===200:receipt.status===null||Number.isInteger(receipt.status)&&receipt.status>=100&&receipt.status<=599)||
  typeof receipt.sha256!=="string"||!/^[0-9a-f]{64}$/.test(receipt.sha256)||!Number.isInteger(receipt.byteLength)||receipt.byteLength<0||receipt.byteLength>8*1024*1024||!date(receipt.observedAt)||!(receipt.serverDate===null||date(receipt.serverDate)))return false;
 const p=receipt.pagination;
 return p===undefined||shape(p,["page","pageSize","reportedTotal","returned"])&&Number.isInteger(p.page)&&p.page>=1&&p.page<=10&&p.pageSize===100&&Number.isInteger(p.reportedTotal)&&p.reportedTotal>=0&&p.reportedTotal<=1000&&Number.isInteger(p.returned)&&p.returned>=0&&p.returned<=100;
}
/** @param {any[]} receipts @param {string} base @param {number|null} [wanted] */
function pages(receipts,base,wanted=null){
 if(!Array.isArray(receipts)||receipts.length<1||receipts.length>10)return false;
 let count=0,total=null;
 for(const [at,r] of receipts.entries()){
  if(!http(r)||!r.pagination||r.path!==`${base}${base.includes("?")?"&":"?"}per_page=100&page=${at+1}`||r.pagination.page!==at+1||total!==null&&r.pagination.reportedTotal!==total)return false;
  total=r.pagination.reportedTotal;count+=r.pagination.returned;
  if(at<receipts.length-1&&r.pagination.returned!==100)return false;
 }
 return count===total&&(wanted===null||count===wanted)&&receipts.length===Math.max(1,Math.ceil(count/100));
}
/** @param {any} request @param {any} observed */
export function qualifiedDeliveryCiAcceptance(request,observed){
 if(observed.result.status!=="validated")return null;
 return {version:1,publicationContextDigest:request.route.publication.digest,requirementDigest:operationDigest(observed.requirement),headCommit:observed.requirement.headCommit,run:observed.requirement.run,
  evidenceDigest:observed.result.evidenceDigest,providerReceiptsDigest:operationDigest(observed.receipts),observedAt:observed.observedAt,attribution:"provider-exact"};
}
/** Append-only metadata snapshots. This pure data helper conveys no provider
 * or writer authority; the controller calls it only on an exact stored row.
 * @param {any} progress */
export function retainQualifiedCiHistory(progress){
 const {history=[],...snapshot}=operationPayload(progress);
 if(snapshot.acceptance!==null)throw Object.assign(Error("CI_ALREADY_ACCEPTED"),{code:"CI_ALREADY_ACCEPTED"});
 if(snapshot.discovery===null&&snapshot.observation===null&&snapshot.error===null)return history;
 if(history.length>=64)throw Object.assign(Error("CI_OBSERVATION_LIMIT"),{code:"CI_OBSERVATION_LIMIT"});
 return [...history,{sequence:history.length+1,digest:operationDigest(snapshot),progress:snapshot}];
}
/** @param {any} v @param {any} request @param {any} publication */
export function validQualifiedCiProgress(v,request,publication){
 try{
  const {history,...current}=v;
  if(history!==undefined){
   if(!Array.isArray(history)||history.length>64)return false;
   for(const [at,row] of history.entries())if(!shape(row,["sequence","digest","progress"])||row.sequence!==at+1||row.digest!==operationDigest(row.progress)||
    row.progress.acceptance!==null||row.progress.discovery===null&&row.progress.observation===null&&row.progress.error===null||!validProgress(row.progress,request,publication))return false;
   let previous=null;
   for(const p of [...history.map((/** @type {any} */ r)=>r.progress),current])if(p.requirement!==null){
    if(previous!==null&&(p.requirement.run.id!==previous.requirement.run.id||p.requirement.run.attempt<previous.requirement.run.attempt||p.providerRun.workflowId!==previous.providerRun.workflowId))return false;
    previous=p;
   }
  }
  return validProgress(current,request,publication);
 }catch{return false;}
}
/** @param {any} v @param {any} request @param {any} publication */
function validProgress(v,request,publication){
 try{
  if(request.route.name!=="protected-atomic-push-v1"||!publication?.acceptance||request.route.publication.destination.endpoint.kind!=="github"||
   !shape(v,["version","phase","selection","selectionDigest","requirement","providerRun","selectedAt","discovery","observation","error","acceptance"])||v.version!==1||!["waiting-run","selected","observed","validated"].includes(v.phase)||
   !same(v.selection,qualifiedDeliveryCiSelection(request))||v.selectionDigest!==operationDigest(v.selection))return false;
  const base=`/repos/${v.selection.repository}`,query=new URLSearchParams({event:v.selection.event,head_sha:v.selection.headCommit,branch:v.selection.ref.slice("refs/heads/".length)}).toString(),list=`${base}/actions/runs?${query}`;
  if(v.discovery!==null){
   const d=v.discovery;if(!shape(d,["status","observedAt","receipts"])||!["missing","selected"].includes(d.status)||!date(d.observedAt)||!Array.isArray(d.receipts))return false;
   const rows=d.status==="selected"?d.receipts.slice(0,-1):d.receipts;
   if(!pages(rows,list)||d.status==="selected"&&(!v.requirement||!http(d.receipts.at(-1))||d.receipts.at(-1).pagination!==undefined||d.receipts.at(-1).path!==`${base}/actions/runs/${v.requirement.run.id}`))return false;
  }
  if(v.error!==null&&(!shape(v.error,["code","at","providerReceipt",...(Object.hasOwn(v.error,"discovery")?["discovery"]:[])])||typeof v.error.code!=="string"||!/^CI_[A-Z0-9_]{1,96}$/.test(v.error.code)||!date(v.error.at)||
   v.error.providerReceipt!==null&&(!http(v.error.providerReceipt,false)||!v.error.providerReceipt.path.startsWith(`${base}/`))))return false;
  if(v.error?.discovery!==undefined){
   const d=v.error.discovery;if(!shape(d,["status","observedAt","receipts","requirement","providerRun"])||!date(d.observedAt)||!Array.isArray(d.receipts))return false;
   if(d.status==="missing"){if(d.requirement!==null||d.providerRun!==null||!pages(d.receipts,list))return false;}
   else if(d.status==="selected"){
    const r=normalizeExactDeliveryCiRequirement(d.requirement),{version,run:chosen,...selection}=r,last=d.receipts.at(-1);
    if(!same(selection,v.selection)||!same(r,d.requirement)||!run(d.providerRun)||d.providerRun.id!==chosen.id||d.providerRun.attempt!==chosen.attempt||
     !pages(d.receipts.slice(0,-1),list)||!http(last)||last.pagination!==undefined||last.path!==`${base}/actions/runs/${chosen.id}`)return false;
   }else return false;
  }
  if(v.requirement===null)return v.phase==="waiting-run"&&v.providerRun===null&&v.selectedAt===null&&v.observation===null&&v.acceptance===null&&(v.discovery===null||v.discovery.status==="missing");
  const r=normalizeExactDeliveryCiRequirement(v.requirement),{version,run:chosen,...selected}=r;
  if(!same(selected,v.selection)||!same(r,v.requirement)||!run(v.providerRun)||v.providerRun.id!==chosen.id||v.providerRun.attempt!==chosen.attempt||!date(v.selectedAt)||
   v.discovery?.status!=="selected"||v.discovery.observedAt!==v.selectedAt)return false;
  if(v.observation===null)return v.phase==="selected"&&v.acceptance===null;
  const o=v.observation;
  if(!shape(o,["requirement","providerRun","headers","evidence","result","observedAt","receipts","selectionDigest","tool"])||!same(o.requirement,r)||!same(o.providerRun,v.providerRun)||o.selectionDigest!==v.selectionDigest||!same(o.tool,request.route.publication.tool)||
   !shape(o.headers,["initial","attempt","final"])||![o.headers.initial,o.headers.attempt,o.headers.final].every(run)||!sameRun(o.headers.initial,v.providerRun)||!sameRun(o.headers.attempt,v.providerRun)||!sameRun(o.headers.final,v.providerRun)||
   o.headers.initial.status!==o.headers.final.status||o.headers.initial.conclusion!==o.headers.final.conclusion||o.headers.attempt.status!==o.headers.final.status||o.headers.attempt.conclusion!==o.headers.final.conclusion||
   !date(o.observedAt)||!Array.isArray(o.receipts)||o.receipts.some((/** @type {any} */ p)=>!http(p))||!same(o.result,qualifyExactDeliveryCi(r,o.evidence)))return false;
  const final=o.headers.final;
  if(!same(o.evidence.run,{id:final.id,attempt:final.attempt,checkSuiteId:final.checkSuiteId,status:final.status,conclusion:final.conclusion}))return false;
  const header=`${base}/actions/runs/${r.run.id}`,attempt=`${header}/attempts/${r.run.attempt}`,jobPages=o.receipts.filter((/** @type {any} */ p)=>p.pagination),checkRows=o.receipts.slice(2+jobPages.length,-1);
  if(o.receipts.length!==3+jobPages.length+o.evidence.checks.length||o.receipts[0].path!==header||o.receipts[1].path!==attempt||o.receipts.at(-1).path!==header||
   !same(o.receipts.slice(2,2+jobPages.length),jobPages)||!pages(jobPages,`${attempt}/jobs`,o.evidence.totalChecks)||
   !same(checkRows.map((/** @type {any} */ p)=>p.path),o.evidence.checks.map((/** @type {any} */ c)=>`${base}/check-runs/${c.checkRunId}`)))return false;
  const accepted=qualifiedDeliveryCiAcceptance(request,o);
  if(!same(v.acceptance,accepted))return false;
  return v.phase===(accepted===null?"observed":"validated")&&(accepted===null||v.error===null);
 }catch{return false;}
}
