/** Pure classification of normalized exact-provider evidence. This performs no
 * network read, writes no progress and proves no CI was actually observed. A
 * fixed provider reader must obtain these facts before a delivery can use it. */
import {operationDigest,operationPayload} from "./operation-record.mjs";
import {normalizeDeliveryCiSelection,isDeliveryBranchRef} from "../../../lib/parser/dist/pure.js";
export class QualifiedDeliveryCiFinding extends Error {
 /** @param {string} code */
 constructor(code){super(`${code}: exact delivery CI unavailable`);this.code=code;}
}
/** @param {any} v @param {string[]} fields */
function shape(v,fields){return v && typeof v === "object" && !Array.isArray(v) && Object.keys(v).sort().join("\0") === [...fields].sort().join("\0");}
/** @param {any} v */
function id(v){return Number.isSafeInteger(v) && v>0;}
/** @param {any} v */
function name(v){return typeof v === "string" && v.length>0 && v.length<=256 && v.trim() === v && !/[\x00-\x1f\x7f]/.test(v);}
/** @param {any} v */
function oid(v){return typeof v === "string" && /^[0-9a-f]{40}$/.test(v);}
/** @param {any} v @returns {any} */
function freeze(v){if(v && typeof v === "object"){Object.values(v).forEach(freeze);Object.freeze(v);}return v;}
/** The exact run/attempt is selected from the actual publication by the
 * provider reader and retained before observations; it is never "latest".
 * @param {any} input */
export function normalizeExactDeliveryCiRequirement(input){
 try{
  const r=operationPayload(input);
  if(!shape(r,["version","provider","host","repository","workflow","event","ref","headCommit","run","checks"])||r.version!==1||!isDeliveryBranchRef(r.ref)||
   !oid(r.headCommit)||!shape(r.run,["id","attempt"])||!id(r.run.id)||!id(r.run.attempt))throw Error("Invalid exact observation identity");
  const selected=normalizeDeliveryCiSelection({provider:r.provider,host:r.host,repository:r.repository,workflow:r.workflow,event:r.event,checks:r.checks});
  return freeze({...r,...selected});
 }catch{throw new QualifiedDeliveryCiFinding("CI_REQUIREMENT_INVALID");}
}
const STATES=["queued","waiting","requested","pending","in_progress","completed"];
const CONCLUSIONS=[null,"success","failure","neutral","cancelled","skipped","timed_out","action_required","stale","startup_failure"];
/** Classify only a complete normalized provider response for one exact frozen
 * requirement. Extra jobs cannot substitute for a missing required identity.
 * The result is evidence classification, never publication/completion authority.
 * @param {any} input @param {any} evidence */
export function qualifyExactDeliveryCi(input,evidence){
 const r=normalizeExactDeliveryCiRequirement(input),base={requirementDigest:operationDigest(r),headCommit:r.headCommit,run:r.run};
 /** @param {string} status @param {string} code @param {any[]} [checks] @param {string|null} [evidenceDigest] */
 const result=(status,code,checks=[],evidenceDigest=null)=>freeze({...base,status,code,checks,evidenceDigest});
 let e;try{e=operationPayload(evidence);}catch{return result("validation-unknown","CI_OBSERVATION_INVALID");}
 if(!shape(e,["version","provider","host","repository","headRepository","workflow","event","ref","headCommit","run","totalChecks","checks"]) || e.version !== 1 ||
  !shape(e.run,["id","attempt","checkSuiteId","status","conclusion"]) || ![e.run.id,e.run.attempt,e.run.checkSuiteId].every(id) ||
  !Number.isSafeInteger(e.totalChecks) || e.totalChecks<0 || !Array.isArray(e.checks) || e.checks.length>10000)return result("validation-unknown","CI_OBSERVATION_INVALID");
 const evidenceDigest=operationDigest(e);
 if(e.provider !== r.provider || e.host !== r.host || typeof e.repository !== "string" || e.repository.toLowerCase() !== r.repository ||
  typeof e.headRepository !== "string" || e.headRepository.toLowerCase() !== r.repository || e.workflow !== r.workflow || e.event !== r.event || e.ref !== r.ref ||
  e.headCommit !== r.headCommit || e.run.id !== r.run.id || e.run.attempt !== r.run.attempt)return result("validation-unknown","CI_IDENTITY_MISMATCH",[],evidenceDigest);
 if(e.checks.length !== e.totalChecks)return result("validation-unknown","CI_PROVIDER_SET_INCOMPLETE",[],evidenceDigest);
 const jobs=new Set(),checks=new Set();
 for(const c of e.checks){
  if(!shape(c,["jobId","checkRunId","app","name","headCommit","runId","runAttempt","checkSuiteId","status","conclusion"]) ||
   ![c.jobId,c.checkRunId,c.runId,c.runAttempt,c.checkSuiteId].every(id) || !name(c.name) || jobs.has(c.jobId) || checks.has(c.checkRunId))return result("validation-unknown","CI_CHECK_IDENTITY_INVALID",[],evidenceDigest);
  jobs.add(c.jobId);checks.add(c.checkRunId);
  if(c.app !== "github-actions" || c.headCommit !== r.headCommit || c.runId !== r.run.id || c.runAttempt !== r.run.attempt || c.checkSuiteId !== e.run.checkSuiteId)return result("validation-unknown","CI_CHECK_IDENTITY_MISMATCH",[],evidenceDigest);
 }
 if(!STATES.includes(e.run.status) || !CONCLUSIONS.includes(e.run.conclusion) || e.run.status !== "completed" && e.run.conclusion !== null ||
  e.checks.some((/** @type {any} */ c)=>!STATES.includes(c.status) || !CONCLUSIONS.includes(c.conclusion) || c.status !== "completed" && c.conclusion !== null))return result("validation-unknown","CI_STATUS_UNSUPPORTED",[],evidenceDigest);
 const required=[];
 for(const expected of r.checks){const found=e.checks.filter((/** @type {any} */ c)=>c.name === expected);
  if(found.length>1)return result("validation-unknown","CI_REQUIRED_CHECK_AMBIGUOUS",[],evidenceDigest);
  if(!found.length)return result(e.run.status === "completed"?"validation-unknown":"validation-pending","CI_REQUIRED_CHECK_MISSING",required,evidenceDigest);
  required.push(found[0]);
 }
 const failed=required.some(c=>c.status === "completed" && c.conclusion !== null && c.conclusion !== "success") || e.run.status === "completed" && e.run.conclusion !== null && e.run.conclusion !== "success";
 if(failed)return result("validation-failed","CI_REQUIRED_NOT_SUCCESSFUL",required,evidenceDigest);
 if(required.some(c=>c.status !== "completed") || e.run.status !== "completed")return result("validation-pending","CI_REQUIRED_PENDING",required,evidenceDigest);
 if(required.some(c=>c.conclusion === null) || e.run.conclusion === null)return result("validation-unknown","CI_CONCLUSION_UNAVAILABLE",required,evidenceDigest);
 return result("validated","CI_EXACT_SUCCESS",required,evidenceDigest);
}
