/** Actual retained-source PRODUCT grading. This is neither delivery's planned
 * workspace authority nor permission to replace a finalized source. */
import { execFileSync } from "node:child_process";
import { realpathSync } from "node:fs";
import { captureConfiguredDispatchForRun, createConfiguredDispatchGateRunner, verifyConfiguredDispatch } from "./configured-dispatch.mjs";
import { inspectQualifiedWorkspace, validateQualifiedNative } from "./qualified-native.mjs";
import { loadQualifiedReviewConsumers, qualifiedOutputIdentity } from "./qualified-verification.mjs";
import { activeNativeHolds, withNativeTransaction } from "./native-codex.mjs";
import { readRecord } from "./run-record.mjs";
import { operationContent, operationDigest } from "./operation-record.mjs";
import { qualifiedConfiguredGradeCommand } from "./qualified-configured-grades.mjs";
import { requireInstalledRuntimeAssets } from "./records-check.mjs";
import { createHash } from "node:crypto";

/** @type {WeakMap<object,any>} */ const authorities = new WeakMap();
/** @param {string} code @returns {never} */
function refuse(code) { throw Object.assign(new Error(code), { code }); }
/** @param {any} a @param {any} b */
const same = (a,b) => operationContent(a) === operationContent(b);
/** @param {any} value @returns {any} */
function data(value) { const copy=structuredClone(value); const freeze=(/** @type {any} */ item)=>{if(item&&typeof item==="object"){Object.values(item).forEach(freeze);Object.freeze(item);}};freeze(copy);return copy; }
/** @param {string} root @param {string} revision */
function oid(root,revision) {
  try { return execFileSync("git",["--no-replace-objects","-C",root,"rev-parse","--verify","--end-of-options",revision],
    {encoding:"utf8",stdio:["ignore","pipe","pipe"],env:{...process.env,GIT_NO_LAZY_FETCH:"1",GIT_OPTIONAL_LOCKS:"0"}}).trim(); }
  catch { refuse("CONFIGURED_GRADE_CANDIDATE_UNAVAILABLE"); }
}
/** Stable retained authority; lifecycle/output additions never replace it.
 * @param {any} rec */
function sourceIdentity(rec) { return {assignmentDigest:rec.assignmentDigest,permissionDigest:rec.permission.digest,
  capsuleDigest:rec.native.qualified.origins.configuredDispatch.digest,identity:rec.native.qualified.identity,
  binding:rec.native.binding,start:rec.native.start}; }
/** Fixed backend check, including the canonical current phase/ignored/fence
 * owners. No caller callback, permission flag or mutable record is accepted.
 * @param {any} state */
function checkSource(state) {
  requireInstalledRuntimeAssets(state.tool,["configured-dispatch-grade","configured-dispatch","qualified-native","qualified-verification","gate-run"].map(name=>`tools/e2e/scripts/${name}.mjs`));
  const capsule=verifyConfiguredDispatch(state.dispatch),rec=readRecord(state.root,state.attempt),q=rec.native?.qualified;
  if(!q||!["executor","verifier"].includes(rec.assignment.role)||rec.assignment.role==="verifier"&&q.verification===undefined||
    !same(sourceIdentity(rec),state.source)||q.collection!==undefined||rec.reservation.releasedAt!==null||
    !["started","running","finished"].includes(rec.state)||!rec.native?.binding||rec.execution?.harnessId!==rec.native.binding.agentId||activeNativeHolds(rec).length) refuse("CONFIGURED_GRADE_RETAINED_SOURCE_CHANGED");
  const scope=validateQualifiedNative(state.root,rec,true),bindings=rec.assignment.qualified.workers.filter((/** @type {any} */ worker)=>worker.role==="product"),workers=scope.workers.filter((/** @type {any} */ worker)=>worker.roles.includes("product"));
  if(bindings.length!==1||workers.length!==1||!same(bindings[0],state.worker)||!same(workers[0],state.physical)||
    realpathSync(bindings[0].checkout)!==state.candidate.productRoot||!same(capsule.gatePolicy,state.policy)) refuse("CONFIGURED_GRADE_WORKER_CHANGED");
  // inspectQualifiedWorkspace invokes the canonical actual-row current phase
  // policy and retains the original captured ignored-output policy unchanged.
  const inspected=inspectQualifiedWorkspace(rec,{final:true});
  if(!inspected.clean) refuse("CONFIGURED_GRADE_WORKSPACE_UNAVAILABLE");
  if(oid(state.candidate.productRoot,"HEAD")!==state.candidate.commit||oid(state.candidate.productRoot,"HEAD^{tree}")!==state.candidate.tree) refuse("CONFIGURED_GRADE_CANDIDATE_CHANGED");
  return rec;
}
/** Only the actual held source and backend-measured PRODUCT worker select a
 * candidate. Wire data cannot choose a revision, program, policy or grade.
 * @param {string} root @param {string} attempt @param {{tool:any}} options */
export async function captureConfiguredDispatchGradeAuthority(root,attempt,options) {
  if(!options||Object.keys(options).join(",")!=="tool") refuse("CONFIGURED_GRADE_CONFIGURATION_REQUIRED");
  root=realpathSync(root);await loadQualifiedReviewConsumers();
  const retained=await captureConfiguredDispatchForRun(root,attempt,options);
  return withNativeTransaction(root,{operation:"configured-grade-capture"},()=>{
    const rec=readRecord(root,attempt);
    const scope=validateQualifiedNative(root,rec,true),bindings=rec.assignment.qualified.workers.filter((/** @type {any} */ worker)=>worker.role==="product"),workers=scope.workers.filter((/** @type {any} */ worker)=>worker.roles.includes("product"));
    if(bindings.length!==1||workers.length!==1) refuse("CONFIGURED_GRADE_PRODUCT_WORKER_REQUIRED");
    const worker=bindings[0],productRoot=realpathSync(worker.checkout);
    if(workers[0].identity.filesystemRoot!==productRoot) refuse("CONFIGURED_GRADE_WORKER_CHANGED");
    const candidate={productRoot,commit:oid(productRoot,"HEAD"),tree:oid(productRoot,"HEAD^{tree}")},policy=retained.handle.capsule.gatePolicy;
    const state={root,attempt,dispatch:retained.handle,tool:options.tool,source:data(sourceIdentity(rec)),worker:data(worker),physical:data(workers[0]),candidate:data(candidate),policy,executing:false};
    checkSource(state);
    const handle=data({version:1,source:retained.source,candidate,policyDigest:policy.digest});authorities.set(handle,state);return handle;
  });
}
/** Redeemed only inside the fixed producer's synchronous native transaction.
 * Generic configured gate calls cannot obtain a veto exemption by cloning it.
 * @param {object} handle @param {{productRoot:string,commit:string,tree:string,policy:any}} expected */
export function assertConfiguredDispatchGradeAuthority(handle,expected) {
  const state=authorities.get(handle);
  if(!state||!state.executing) refuse("CONFIGURED_GRADE_AUTHORITY_REQUIRED");
  if(!same(expected,{...state.candidate,policy:state.policy})) refuse("CONFIGURED_GRADE_CONTEXT_CHANGED");
  checkSource(state);return true;
}
/** Actual suites, optional single original suite ID. Partial captures remain
 * incomplete. The verifier's outer reading is derived from canonical output
 * identity; an executor receives capture-only evidence. No worker token write.
 * @param {object} handle @param {string|undefined} [suite] */
export function runConfiguredDispatchGrade(handle,suite) {
  const state=authorities.get(handle);if(!state||state.executing) refuse("CONFIGURED_GRADE_AUTHORITY_REQUIRED");
  if(suite!==undefined&&(typeof suite!=="string"||!state.policy.required.includes(suite))) refuse("CONFIGURED_GRADE_SUITE_REQUIRED");
  return withNativeTransaction(state.root,{operation:"configured-grade-run"},()=>{
    checkSource(state);state.executing=true;
    try {
      const runner=createConfiguredDispatchGateRunner(state.dispatch,{productRoot:state.candidate.productRoot,productRevision:state.candidate.commit},handle);
      const result=runner.run(suite===undefined?state.policy.required:[suite]);
      const rec=checkSource(state),capture=result.capture;
      let reading=null;
      if(rec.assignment.role==="verifier"&&suite===undefined&&result.code<=1){
        const identity=qualifiedOutputIdentity(rec.native?.qualified.verification.authority,state.worker,state.candidate.commit),output=capture.suites.map((/** @type {any} */ row)=>row.transcript).join("");
        reading=data({role:"product",commit:identity.commit,tree:identity.tree,projectionDigest:identity.projectionDigest,exit:result.code,
          bodies:capture.suites.reduce((/** @type {number} */ sum,/** @type {any} */ row)=>sum+row.verdict.bodies,0),command:qualifiedConfiguredGradeCommand(capture),output,
          outputDigest:createHash("sha256").update(output).digest("hex"),configuredGate:capture});
      }
      return data({status:"graded",attempt:state.attempt,code:result.code,capture,captureDigest:operationDigest(capture),reading,tokenWritten:false});
    } finally {state.executing=false;}
  });
}
