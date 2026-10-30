/** Retained qualified delivery authority. This is a pure initial capture, not a
 * landing/publication/completion operation or a replacement for effect policy.
 */
import {execFileSync} from "node:child_process";
import {realpathSync} from "node:fs";
import * as runs from "./run-record.mjs";
import {activeNativeHolds, nativePathAllowed, nativeSha256, parseNativeRawDiff} from "./native-codex.mjs";
import {collectQualifiedNativeRun, validateQualifiedNative} from "./qualified-native.mjs";
import {collectQualifiedReviewEvidence, loadQualifiedReviewConsumers, qualifiedOutputIdentity,
  qualifiedReviewDigest, qualifiedReviewPolicy, readQualifiedPreparation} from "./qualified-verification.mjs";
import {checkOperationEnvironment} from "./durable-operation.mjs";

export class QualifiedDeliveryFinding extends Error {
  /** @param {string} code */
  constructor(code) {super(`${code}: qualified delivery authority unavailable`);this.code=code;this.name="QualifiedDeliveryFinding";}
}
/** @param {string} code @returns {never} */
function refuse(code) {throw new QualifiedDeliveryFinding(code);}
/** @param {any} a @param {any} b */
function equal(a,b) {return runs.qualifiedValidation().qualifiedContent(a) === runs.qualifiedValidation().qualifiedContent(b);}
/** @param {any} value @returns {any} */
function freeze(value) {if(value && typeof value === "object") {Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
/** @param {string} root @param {string[]} args @returns {Buffer} */
function git(root,args) {
  try {return execFileSync("git",["--no-replace-objects","-C",root,...args],{stdio:["ignore","pipe","pipe"],maxBuffer:64*1024*1024,
    env:{...process.env,GIT_NO_LAZY_FETCH:"1",GIT_OPTIONAL_LOCKS:"0"}});}
  catch {refuse("QUALIFIED_DELIVERY_GIT_INPUT");}
}
/** Independently finalized canonical collection is required. Legacy finished
 * labels, returned success or a mutable caller's accepted flag cannot suffice.
 * @param {string} root @param {any} rec @param {string} role */
function finalized(root,rec,role) {
  const q=rec.native?.qualified, done=q?.collection;
  if (rec.assignment?.kind !== "card" || rec.assignment.role !== role || rec.state !== "finished" ||
      rec.execution?.endedAt == null || rec.reservation?.releasedAt == null || done?.phase !== "final" ||
      rec.native.collection?.eligible !== true || rec.native.collection.actualIndependentCheck !== true ||
      rec.native.collection.check?.clean !== true || rec.native.inflight.length !== 0 || activeNativeHolds(rec).length !== 0 ||
      runs.ownedJobsAlive(rec,runs.defaultRunIo()).length !== 0 || !rec.outcome?.evidence?.some((/** @type {any} */ e)=>e.kind === "observed") ||
      rec.native.binding?.agentId !== rec.execution.harnessId || done.identity !== q.identity ||
      !equal(rec.native.collection.check,done.final?.check) || done.resultDigest !== nativeSha256(runs.qualifiedValidation().qualifiedContent(done.result))) refuse("QUALIFIED_DELIVERY_FINAL_REQUIRED");
  // The existing finalized retry validates immutable assignment/permission and
  // exact candidate/ref/result bindings without entering a writer transaction.
  collectQualifiedNativeRun(root,rec,{ref:JSON.stringify(done.candidates)});
  validateQualifiedNative(root,rec,false);
  if (!equal(done.result.refs,rec.refs)) refuse("QUALIFIED_DELIVERY_COLLECTION_CHANGED");
  return q;
}
/** Return only frozen source facts and owed integration duties. First capture
 * still validates retained worker/preparation inputs; historical delivery replay
 * must later return its durable accepted receipt before these live-path checks.
 * @param {string} coordinatorRoot
 * @param {{executorAttempt:string,verifierAttempt:string}} request */
export async function captureQualifiedDeliveryAuthority(coordinatorRoot,request) {
  if (!request || typeof request !== "object" || Object.keys(request).sort().join(",") !== "executorAttempt,verifierAttempt" ||
      ![request.executorAttempt,request.verifierAttempt].every((attempt)=>typeof attempt === "string" && /^T-\d+(?:-s\d+)?-a[1-9][0-9]*$/.test(attempt)) ||
      request.executorAttempt === request.verifierAttempt) refuse("QUALIFIED_DELIVERY_REQUEST");
  checkOperationEnvironment();
  await loadQualifiedReviewConsumers();
  const root=realpathSync(coordinatorRoot), executor=/** @type {any} */(runs.readRecord(root,request.executorAttempt)),
    verifier=/** @type {any} */(runs.readRecord(root,request.verifierAttempt));
  const initial=[structuredClone(executor),structuredClone(verifier)];
  const eq=finalized(root,executor,"executor"), vq=finalized(root,verifier,"verifier"), verification=vq.verification;
  if (eq.verification !== undefined || !verification || executor.assignment.id !== verifier.assignment.id ||
      verification.authority.executorAttempt !== executor.attempt || verification.digest !== verifier.assignment.qualified.verification?.preparationDigest ||
      verification.authority.sourceIdentity !== eq.identity || !equal(verification.authority.receipt,eq.origins.receipt) ||
      !equal(verification.authority.fence,eq.reservation.scope.fence)) refuse("QUALIFIED_DELIVERY_SOURCE_LINK");
  const {entry}=readQualifiedPreparation(root,executor.attempt,verification.digest);
  if (entry.consumedBy !== verifier.attempt || !equal(entry.authority,verification.authority) || !equal(entry.seal,verification.seal) ||
      verification.seal.digest !== qualifiedReviewDigest({inputs:verification.seal.inputs,document:verification.seal.document})) refuse("QUALIFIED_DELIVERY_PREPARATION_LINK");
  const candidates=runs.qualifiedValidation().qualifiedImplementationCandidates(eq.reservation.scope,eq.collection.candidates);
  if (!equal(candidates,verification.authority.candidates)) refuse("QUALIFIED_DELIVERY_CANDIDATE_SET");
  const review=collectQualifiedReviewEvidence(verifier,vq.collection.candidates);
  if (!equal(review,vq.collection.review) || vq.collection.reviewDigest !== qualifiedReviewDigest(review) ||
      !equal(review,vq.collection.result.review) || !equal(review.candidates,candidates)) refuse("QUALIFIED_DELIVERY_REVIEW_CHANGED");
  const authority=verification.authority;
  const roles=authority.workers.map((/** @type {any} */ worker)=>{
    const originalBase=eq.reservation.scope.revisions[worker.role], candidate=candidates[worker.role];
    const actual=review.actualOutputs.filter((/** @type {any} */ output)=>output.role === worker.role);
    if (actual.length !== 1) refuse("QUALIFIED_DELIVERY_COMPLETE_SET");
    const identity=qualifiedOutputIdentity(authority,worker,vq.collection.candidates[worker.role]);
    if (!equal(actual[0],identity)) refuse("QUALIFIED_DELIVERY_OUTPUT_CHANGED");
    const repository=authority.fence.repositories[worker.role];
    const physicalImplementationChanges=parseNativeRawDiff(git(worker.checkout,["diff","--raw","-z","--no-abbrev",originalBase,candidate,"--"]));
    // Original implementation scope determines substantive duties. A verifier's
    // protocol-only task-card output does not fabricate an implementation root.
    const domains=eq.reservation.scope.fence.paths.filter((/** @type {any} */ path)=>
      authority.fence.repositories[path.role].filesystemRoot === repository.filesystemRoot).map((/** @type {any} */ path)=>path.domain);
    const excluded=authority.fence.excluded.filter((/** @type {any} */ path)=>path.filesystemRoot === repository.filesystemRoot).map((/** @type {any} */ path)=>path.domain);
    for (const change of physicalImplementationChanges) {
      const changed=change.status.startsWith("C") ? [change.newPath] : change.paths;
      if (changed.some((/** @type {string} */ path)=>!nativePathAllowed(path,domains) || nativePathAllowed(path,excluded))) refuse("QUALIFIED_DELIVERY_OUTSIDE_SCOPE");
    }
    const roleDomains=eq.reservation.scope.fence.paths.filter((/** @type {any} */ path)=>path.role === worker.role).map((/** @type {any} */ path)=>path.domain);
    const implementationChanges=physicalImplementationChanges.filter((entry)=>
      (entry.status.startsWith("C") ? [entry.newPath] : entry.paths).some((/** @type {string} */ path)=>nativePathAllowed(path,roleDomains)));
    const outputChanges=parseNativeRawDiff(git(worker.checkout,["diff","--raw","-z","--no-abbrev",candidate,identity.commit,"--"]));
    const policy=qualifiedReviewPolicy(authority,[worker.role]);
    const protocolChanges=outputChanges.filter((entry)=>{
      const changed=entry.status.startsWith("C") ? [entry.newPath] : entry.paths;
      return changed.every((/** @type {string} */ path)=>nativePathAllowed(path,policy.protocol));
    });
    return {role:worker.role,repository,originalBase,candidate,actualOutput:identity,implementationChanges,outputChanges,protocolChanges,
      substantiveImplementation:implementationChanges.length > 0,protocolCompletion:protocolChanges.length > 0,
      candidateGrades:review.grades.filter((/** @type {any} */ grade)=>grade.role === worker.role),
      actualOutputGrades:review.actualOutputGrades.filter((/** @type {any} */ grade)=>grade.role === worker.role)};
  });
  if (!equal(roles.map((/** @type {any} */ role)=>role.role).sort(),["product","records"])) refuse("QUALIFIED_DELIVERY_COMPLETE_SET");
  /** @param {any} rec */
  const retained=(rec)=>({attempt:rec.attempt,assignmentDigest:rec.assignmentDigest,permissionDigest:rec.permission.digest,
    collectionDigest:rec.native.qualified.collection.resultDigest,candidates:rec.native.qualified.collection.candidates});
  const captured={version:1,taskId:executor.assignment.id,projectId:authority.projectId,executor:retained(executor),
    verifier:{...retained(verifier),preparationDigest:verification.digest,sealDigest:verification.seal.digest},
    frozenAuthority:{receipt:authority.receipt,scope:eq.reservation.scope,preparation:authority,review},roles,
    physicalLandings:[...new Set(roles.map((/** @type {any} */ role)=>role.repository.filesystemRoot))].map((root)=>({root,
      roles:roles.filter((/** @type {any} */ role)=>role.repository.filesystemRoot === root).map((/** @type {any} */ role)=>role.role)})),
    owedCorrections:review.corrections,gradeObligations:roles.filter((/** @type {any} */ role)=>role.substantiveImplementation || role.outputChanges.length > 0)
      .map((/** @type {any} */ role)=>({role:role.role,required:"exact-resulting-integration-commit-tree",wholeOutput:true,
        corrections:review.corrections.filter((/** @type {any} */ correction)=>correction.role === role.role).map((/** @type {any} */ correction)=>correction.correction)}))};
  if (!equal(initial,[runs.readRecord(root,executor.attempt),runs.readRecord(root,verifier.attempt)])) refuse("QUALIFIED_DELIVERY_LATE_RECORD_CHANGE");
  return freeze(structuredClone({...captured,authorityDigest:`sha256:${qualifiedReviewDigest(captured)}`}));
}
