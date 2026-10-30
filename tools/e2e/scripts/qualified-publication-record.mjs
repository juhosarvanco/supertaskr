/** Finite protected publication progress in the original qualified operation.
 * These are observed effects, not a second authority or progress ledger. */
import path from "node:path";
import {operationContent} from "./operation-record.mjs";
/** @param {any} v @param {string[]} fields */
const shape=(v,fields)=>v&&typeof v==="object"&&!Array.isArray(v)&&Object.keys(v).sort().join("\0")===[...fields].sort().join("\0");
/** @param {any} v */
const date=v=>typeof v==="string"&&Number.isFinite(Date.parse(v));
/** @param {any} v */
const digest=v=>typeof v==="string"&&/^sha256:[0-9a-f]{64}$/.test(v);
/** @param {any} v */
function owner(v){return shape(v,["pid","identity","token"])&&Number.isInteger(v.pid)&&v.pid>0&&typeof v.identity==="string"&&v.identity.length>0&&typeof v.token==="string"&&v.token.length>0;}
/** @param {any} v */
function asset(v){return shape(v,["path","sha256"])&&typeof v.path==="string"&&path.isAbsolute(v.path)&&!/[\x00-\x1f\x7f]/.test(v.path)&&typeof v.sha256==="string"&&/^[0-9a-f]{64}$/.test(v.sha256);}
/** @param {any} p @param {any} request */
export function validQualifiedPublicationProgress(p,request){
 try{
  if(request.route.name!=="protected-atomic-push-v1"||!shape(p,["version","phase","launches","checks","acceptance"])||p.version!==1||
   !["captured","checking","checks-ready","pushing","published"].includes(p.phase)||!Array.isArray(p.launches)||p.launches.length>128)return false;
  const tokens=new Set();
  for(const [at,l] of p.launches.entries()){
   if(!shape(l,["sequence","stage","token","owner","process","node","git","entry","startedAt","gitStarted","result"])||l.sequence!==at+1||!["checks","push"].includes(l.stage)||typeof l.gitStarted!=="boolean"||l.stage==="checks"&&l.gitStarted||
    typeof l.token!=="string"||!/^launch-[0-9a-f-]{36}$/.test(l.token)||tokens.has(l.token)||!owner(l.owner)||
    !shape(l.process,["pid","identity","group"])||!Number.isInteger(l.process.pid)||l.process.pid<1||l.process.group!==l.process.pid||typeof l.process.identity!=="string"||!l.process.identity||
    ![l.node,l.git,l.entry].every(asset)||!date(l.startedAt)||l.node.path!==request.route.publication.hook.node.path||
    l.node.sha256!==request.route.publication.hook.nodeSha256||l.entry.path!==path.join(path.dirname(request.route.publication.hook.entry),"qualified-publication-launch.mjs"))return false;
   tokens.add(l.token);
   if(l.result!==null&&!(shape(l.result,["kind","observedAt"])&&l.result.kind==="observed-dead"&&date(l.result.observedAt))&&(!shape(l.result,["kind","exit","signal","finishedAt","stdoutDigest","stderrDigest"])||l.result.kind!=="exited"||!date(l.result.finishedAt)||
    !(l.result.exit===null||Number.isInteger(l.result.exit)&&l.result.exit>=0&&l.result.exit<=255)||!(l.result.signal===null||typeof l.result.signal==="string"&&/^SIG[A-Z0-9]+$/.test(l.result.signal))||
    !digest(l.result.stdoutDigest)||!digest(l.result.stderrDigest)))return false;
   if(at<p.launches.length-1&&l.result===null)return false;
  }
  const s=request.route.publication;
  if(p.checks!==null&&(!shape(p.checks,["tokenDigest","context","tree","attribution"])||!digest(p.checks.tokenDigest)||p.checks.tree!==s.tree||
   !["executed-owned-launch","observed-artifact"].includes(p.checks.attribution)||!shape(p.checks.context,["configurationDigest","toolManifestDigest","required"])||
   p.checks.context.configurationDigest!==s.configuration.digest||p.checks.context.toolManifestDigest!==s.tool.manifestDigest||!Array.isArray(p.checks.context.required)||!p.checks.context.required.length||
   new Set(p.checks.context.required).size!==p.checks.context.required.length||p.checks.context.required.some((/** @type {any} */ v)=>typeof v!=="string"||!v)))return false;
  if(p.acceptance!==null&&operationContent(p.acceptance)!==operationContent({contextDigest:s.digest,previousRevision:s.destination.expectedOld,ref:s.destination.ref,commit:s.commit,tree:s.tree,correlationRef:s.correlationRef,attribution:"exact"}))return false;
  const last=p.launches.at(-1);
  if(p.phase==="captured"&&(p.launches.length||p.checks!==null||p.acceptance!==null))return false;
  if(p.phase==="checking"&&(!last||last.stage!=="checks"||p.acceptance!==null))return false;
  if(p.phase==="checks-ready"&&(p.checks===null||p.acceptance!==null))return false;
  if(p.phase==="pushing"&&(p.checks===null||!last||last.stage!=="push"||p.acceptance!==null))return false;
  return (p.phase==="published")===(p.acceptance!==null)&&(!p.acceptance||p.checks!==null&&p.launches.some((/** @type {any} */ l)=>l.stage==="push"&&l.gitStarted));
 }catch{return false;}
}
