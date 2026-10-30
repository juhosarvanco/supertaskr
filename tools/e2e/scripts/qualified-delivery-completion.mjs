/** Read-only exact coordinator completion proposals. These are not ordinary
 * user edits, a new implementation dispatch, a commit or completion authority.
 * The subsequent same-operation producer must persist this capture and recheck
 * actual protected policy before any object/file/index/ref effect. */
import {execFileSync} from "node:child_process";
import {lstatSync,readFileSync} from "node:fs";
import path from "node:path";
import {parseTaskFile,extractFrontmatter} from "../../../lib/parser/dist/pure.js";
import {stampCard,guardClassHits} from "./dispatch-brief.mjs";
import * as runs from "./run-record.mjs";
import {collectQualifiedNativeRun} from "./qualified-native.mjs";
import {observeQualifiedLocalDelivery} from "./qualified-delivery-operation.mjs";
import {operationContent,operationDigest,operationWork} from "./operation-record.mjs";
import {captureOperationRepository} from "./durable-operation.mjs";
import {readOperationRef} from "./operation-ref.mjs";
import {createRecordChecker,checkedRecordWriteSet,requireInstalledRuntimeAssets,verifyInstalledRecordTool} from "./records-check.mjs";
import {loadProjectSettings} from "./project-settings.mjs";
import {captureOperationCommitIdentity} from "./project-init-operation.mjs";
import {captureExactCommitPlan,safeOperationWorkingPath,assertExactRecordTransformations} from "./record-write.mjs";
import {qualifiedCompletionDeliveryFacts,QUALIFIED_COMPLETION_TRAILER} from "./qualified-completion-record.mjs";

const proposals=new WeakMap();
export class QualifiedCompletionFinding extends Error{
 /** @param {string} code */
 constructor(code){super(`${code}: coordinator completion unavailable`);this.code=code;}
}
/** @param {string} code @returns {never} */
function refuse(code){throw new QualifiedCompletionFinding(code);}
/** @param {any} a @param {any} b */
function same(a,b){return operationContent(a) === operationContent(b);}
/** @param {any} v @returns {any} */
function freeze(v){if(v && typeof v === "object"){Object.values(v).forEach(freeze);Object.freeze(v);}return v;}
/** @param {string} root @param {string[]} args */
function git(root,args){try{return execFileSync("git",["--no-replace-objects","-C",root,...args],{stdio:["ignore","pipe","pipe"],maxBuffer:32*1024*1024,
 env:{...process.env,GIT_NO_LAZY_FETCH:"1",GIT_OPTIONAL_LOCKS:"0"}});}catch{refuse("QUALIFIED_COMPLETION_GIT");}}
/** Actual observed model is kept distinct from the requested model. The stamp
 * names the actual harness/session, explicitly model-unknown when necessary.
 * @param {string} root @param {any} retained */
function attribution(root,retained){
 const rec=/** @type {any} */(runs.readRecord(root,retained.attempt)),q=rec.native?.qualified;
 if(rec.assignmentDigest !== retained.assignmentDigest || rec.permission?.digest !== retained.permissionDigest || q?.collection?.phase !== "final" || q.collection.resultDigest !== retained.collectionDigest ||
  rec.native.binding?.agentId !== rec.execution?.harnessId || typeof rec.native.launch?.sessionId !== "string" || !rec.native.launch.sessionId)refuse("QUALIFIED_COMPLETION_PROVENANCE");
 collectQualifiedNativeRun(root,rec,{ref:JSON.stringify(q.collection.candidates)});
 const harness=rec.assignment.harness,agentId=rec.native.binding.agentId,sessionId=rec.native.launch.sessionId,observed=structuredClone(rec.execution.observed);
 const model=typeof observed?.model === "string" && observed.model !== "unknown"?observed.model:"model-unknown";
 if([harness,agentId,sessionId,model].some(s=>typeof s !== "string" || !s || /[\r\n\x00]/.test(s)))refuse("QUALIFIED_COMPLETION_PROVENANCE");
 return {attempt:rec.attempt,harness,agentId,sessionId,requestedModel:rec.assignment.model,observed,stamp:`${harness}/${model} @${sessionId}`};
}
/** Capture a finite task/receipt/derived-INDEX proposal against the accepted
 * substantive records output. No writable path or review claim comes from a
 * completion caller. Product-owed routes require original accepted publication
 * and CI proofs in this same operation; no new provider request is made here.
 * @param {string} coordinatorRoot @param {string} operationId @param {{tool:any}} configuration */
export function captureQualifiedCompletionProposal(coordinatorRoot,operationId,configuration){
 if(!configuration || Object.keys(configuration).join(",") !== "tool")refuse("QUALIFIED_COMPLETION_CONFIGURATION");
 const observed=observeQualifiedLocalDelivery(coordinatorRoot,operationId);
 if(observed?.status !== "local-integrated")refuse("QUALIFIED_COMPLETION_LOCAL_PENDING");
 const rec=observed.record,req=rec.operation.request,a=req.authority;
 if(req.route.publicationOwed&&!rec.operation.publication?.acceptance)refuse("QUALIFIED_COMPLETION_PUBLICATION_PENDING");
 const delivery=qualifiedCompletionDeliveryFacts(req,rec.operation);
 if(delivery===null)refuse("QUALIFIED_COMPLETION_CI_PENDING");
 const landing=req.landings.find((/** @type {any} */ l)=>l.roles.includes("records"));
 if(!landing || landing.repository.root === req.coordinator.root || landing.repository.commonDir === req.coordinator.commonDir)refuse("QUALIFIED_COMPLETION_SEPARATE_RECORDS_REQUIRED");
 if(readOperationRef(landing.repository.root,landing.ref) !== landing.commit)refuse("QUALIFIED_COMPLETION_RECORDS_CHANGED");
 const file=a.frozenAuthority.preparation.card.path,frozen=parseTaskFile(a.frozenAuthority.preparation.card.text,file);
 if(!frozen.task || frozen.issues.length || !frozen.task.review)refuse("QUALIFIED_COMPLETION_REVIEW_REQUIRED");
 const tool=configuration.tool;requireInstalledRuntimeAssets(tool,["tools/e2e/scripts/qualified-delivery-completion.mjs","tools/e2e/scripts/qualified-delivery-operation.mjs",
  "tools/e2e/scripts/qualified-delivery-record.mjs","tools/e2e/scripts/operation-ref.mjs","tools/e2e/scripts/record-write.mjs"]);
 if(req.route.publicationOwed&&!same(tool,req.route.publication.tool))refuse("QUALIFIED_COMPLETION_TOOL_CHANGED");
 const settings=loadProjectSettings({productRoot:req.coordinator.root,productRevision:req.route.policyRevision,tool});
 if(settings.status !== "ready")refuse(settings.status === "not-configured"?"QUALIFIED_COMPLETION_SETTINGS_UNCONFIGURED":settings.code);
 const changed=a.roles.flatMap((/** @type {any} */ r)=>r.implementationChanges.flatMap((/** @type {any} */ c)=>c.paths));
 const guards=guardClassHits(changed,new Map(Object.entries(settings.settings.guard_class)));
 if(frozen.task.review !== "independent" && (a.frozenAuthority.preparation.tier === "guarded" || guards.length || Object.keys(settings.settings.guard_class).length === 0))refuse("QUALIFIED_COMPLETION_INDEPENDENT_REVIEW_REQUIRED");
 const treeEntry=/^(100644|100755) blob [0-9a-f]+\t([\s\S]+)\0$/.exec(git(landing.repository.root,["ls-tree","-z",landing.commit,"--",file]).toString("utf8"));
 if(!treeEntry || treeEntry[2] !== file)refuse("QUALIFIED_COMPLETION_CARD_CHANGED");const taskMode=/** @type {string} */(treeEntry[1]);
 const taskBytes=git(landing.repository.root,["show",`${landing.commit}:${file}`]),text=new TextDecoder("utf-8",{fatal:true}).decode(taskBytes),parsed=parseTaskFile(text,file),front=extractFrontmatter(text,file);
 if(!parsed.task || parsed.issues.length || parsed.task.id !== a.taskId || parsed.task.review !== frozen.task.review || !front.data || !["building","verifying","merging"].includes(parsed.task.status))refuse("QUALIFIED_COMPLETION_CARD_CHANGED");
 const builder=attribution(req.coordinator.root,a.executor),verifier=attribution(req.coordinator.root,a.verifier),fields=/** @type {Record<string,string>} */({status:"done"});
 if(typeof front.data.built_by !== "string" || !front.data.built_by.trim())fields.built_by=JSON.stringify(builder.stamp);
 if(typeof front.data.verified_by !== "string" || !front.data.verified_by.trim())fields.verified_by=JSON.stringify(verifier.stamp);
 const after=stampCard(text,fields,{insertAfter:{built_by:"status",verified_by:"built_by"}}).text;
 if(extractFrontmatter(after,file).body !== front.body)refuse("QUALIFIED_COMPLETION_SUBSTANTIVE_CHANGE");
 const receiptPath=`docs/checkpoints/delivery-${operationWork(operationId).slice(3)}.json`;
 if(git(landing.repository.root,["ls-tree","-z",landing.commit,"--",receiptPath]).length)refuse("QUALIFIED_COMPLETION_RECEIPT_EXISTS");
 const physical=safeOperationWorkingPath(landing.repository.root,receiptPath);
 try{lstatSync(physical);refuse("QUALIFIED_COMPLETION_RECEIPT_EXISTS");}catch(error){if(/** @type {NodeJS.ErrnoException} */(error).code !== "ENOENT")throw error;}
 const receipt={version:1,kind:"qualified-delivery-receipt",operationId,taskId:a.taskId,authorityDigest:a.authorityDigest,requestDigest:rec.operation.digest,
  localIntegration:rec.operation.localAcceptance,source:{executor:a.executor,verifier:a.verifier,verdictDigest:a.frozenAuthority.review.verdict.digest},
  ...delivery,completion:{expectedRevision:landing.commit,fields:Object.keys(fields),review:frozen.task.review,attribution:{builder,verifier}}};
 const checker=createRecordChecker({profile:settings.settings.records.validation,tool}),options={productRoot:req.coordinator.root,productRevision:req.route.policyRevision,recordsRevision:landing.commit},capture=checker.capture(options);
 const result=checker.evaluate(capture,[{operation:"edit",path:file,type:"blob",mode:taskMode,bytes:Buffer.from(after)}]);
 if(!result.accepted)refuse("QUALIFIED_COMPLETION_CHECK_REFUSED");
 const checked=checkedRecordWriteSet(result),writes=/** @type {any[]} */(checked.writes.map((/** @type {any} */ w)=>({path:w.path,operation:"write",mode:w.mode,base64:Buffer.from(w.bytes).toString("base64")})));
 writes.push({path:receiptPath,operation:"write",mode:"100644",base64:Buffer.from(`${JSON.stringify(receipt,null,2)}\n`).toString("base64")});writes.sort((x,y)=>x.path<y.path?-1:1);
 const repository=captureOperationRepository(landing.repository.root,landing.commit);
 if(!same(repository,landing.repository))refuse("QUALIFIED_COMPLETION_ORIGIN_CHANGED");
 assertExactRecordTransformations(repository.root,writes.map(w=>w.path));
 const identity=captureOperationCommitIdentity(repository.root),message=`Complete ${a.taskId} private records\n\n${QUALIFIED_COMPLETION_TRAILER} ${operationId}\n`;
 const exact=captureExactCommitPlan(repository.root,landing.commit,writes,{identity,message});
 verifyInstalledRecordTool(tool);
 const plan=freeze({version:1,kind:"qualified-delivery-completion",operationId,deliveryRequestDigest:rec.operation.digest,repository,expectedRevision:landing.commit,targetRef:landing.ref,
  tool,profile:checker.profile,configurationDigest:settings.provenance.configDigest,cardPath:file,receiptPath,receipt,writes,tree:exact.tree,...exact.working,
  identity,message,commit:exact.commit,commitBase64:exact.commitBase64,
  validation:{captureDigest:result.captureDigest,candidateDigest:result.candidateDigest,retained:result.retained,procedural:result.procedural,derivations:result.derivations}});
 const proposal=freeze({version:1,kind:"qualified-completion-proposal",operationId,expectedRevision:landing.commit,tree:plan.tree,paths:writes.map(w=>w.path),digest:operationDigest(plan),authority:"proposal only; no effects or completion"});
 proposals.set(proposal,plan);return proposal;
}
/** Detached original planned data for the subsequent trusted producer. A clone
 * of the public proposal cannot select bytes, roots or lifecycle authority.
 * @param {any} proposal */
export function qualifiedCompletionWriteSet(proposal){const plan=proposals.get(proposal);if(!plan)refuse("QUALIFIED_COMPLETION_PROPOSAL_REQUIRED");return structuredClone(plan);}
