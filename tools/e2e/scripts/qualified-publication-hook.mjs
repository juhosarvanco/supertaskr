/** Fixed read-only protected hook adapter. Reads the original paired fence,
 * exact owned launch and canonical current policy; never adopts an owner. */
import {execFileSync} from "node:child_process";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {isMain} from "../../../cli/is-main.mjs";
import {judgeToken,readToken} from "../../../cli/gate-token.mjs";
import {holderVerdict} from "./checkout-currency.mjs";
import {listAcceptedOperations,readAcceptedOperation} from "./durable-operation.mjs";
import {operationContent,operationDigest} from "./operation-record.mjs";
import {loadInstalledRecordTool,createRecordChecker,requireInstalledRuntimeAssets} from "./records-check.mjs";
import {loadConfiguredGateConfiguration} from "./gate-run.mjs";
import {loadQualifiedDeliveryPolicy} from "./qualified-admission.mjs";
import {assertQualifiedDeliveryContinuation,observeQualifiedLocalDelivery} from "./qualified-delivery-operation.mjs";
import {capturePublicationProcessProof,publicationProcess,publicationPushArguments,assertPublicationPushParameters} from "./qualified-publication-process.mjs";
/** @param {string} code @returns {never} */
function refuse(code){throw Object.assign(new Error(`${code}: protected publication refused`),{code});}
/** @param {any} v @param {string[]} fields */
function shape(v,fields){return v&&typeof v==="object"&&!Array.isArray(v)&&Object.keys(v).sort().join("\0")===[...fields].sort().join("\0");}
/** @param {string} root @param {string[]} args */
function git(root,args){try{return execFileSync("git",["--no-replace-objects","-C",root,...args],{encoding:"utf8",stdio:["ignore","pipe","pipe"],env:{...process.env,GIT_NO_LAZY_FETCH:"1",GIT_OPTIONAL_LOCKS:"0"}}).replace(/\n$/,"");}catch{refuse("QUALIFIED_PUBLICATION_GIT");}}
/** Backend-only finite command text for the existing harness guard. Git's
 * actual argv is independently checked by its mandatory pre-push hook.
 * @param {any} request @param {string} program */
export function publicationPushCommand(request,program){return [program,...publicationPushArguments(request)].map((s)=>`'${String(s).replaceAll("'","'\\''")}'`).join(" ");}
/** Exact existing configured token and canonical private checks. No suite,
 * graph generation, Git write or alternative status vocabulary occurs here.
 * @param {any} rec @param {any} tool */
export function readQualifiedPublicationGate(rec,tool){
 const req=rec.operation.request,s=req.route.publication,root=req.coordinator.root;
 requireInstalledRuntimeAssets(tool,["cli/hook-git-context.mjs","cli/configured-gate-reader.mjs","tools/e2e/scripts/qualified-publication-hook.mjs","tools/e2e/scripts/qualified-publication-process.mjs","tools/e2e/scripts/qualified-publication-record.mjs","tools/e2e/scripts/qualified-publication-launch.mjs","tools/e2e/scripts/qualified-publication-operation.mjs"]);
 const observed=observeQualifiedLocalDelivery(root,rec.operation.id);
 if(observed?.status!=="local-integrated"||operationContent(observed.record.operation.localAcceptance)!==operationContent(rec.operation.localAcceptance))refuse("QUALIFIED_PUBLICATION_LOCAL_PENDING");
 if(git(root,["rev-parse","HEAD"])!==s.commit||git(root,["rev-parse",`${s.commit}^{tree}`])!==s.tree)refuse("QUALIFIED_PUBLICATION_PRODUCT_CHANGED");
 const configuration=loadConfiguredGateConfiguration({productRoot:root,productRevision:s.commit,tool}),read=readToken(root);
 const judgment=judgeToken({...read,tree:s.tree,context:configuration.context});
 if(judgment.state!=="fresh")refuse(judgment.code);
 const r=req.authority.roles.find((/** @type {any} */ r)=>r.role==="records"),recordsRoot=r.repository.filesystemRoot;
 const accepted=rec.operation.localAcceptance.find((/** @type {any} */ a)=>req.landings.find((/** @type {any} */ l)=>l.key===a.key)?.roles.includes("records"));
 const recordsRevision=accepted?.commit??r.originalBase;
 if(git(recordsRoot,["rev-parse","HEAD"])!==recordsRevision)refuse("QUALIFIED_PUBLICATION_RECORDS_CHANGED");
 const checker=createRecordChecker({profile:configuration.settings.records.validation,tool});
 const checked=checker.evaluate(checker.capture({productRoot:root,productRevision:s.commit,recordsRevision}),[]);
 if(!checked.wholeBoardClean||checked.retained.some((/** @type {any} */ finding)=>finding.kind==="state-stale"))refuse("QUALIFIED_PUBLICATION_PRIVATE_CHECK");
 const seat=holderVerdict({root,integrationRef:"main",headRef:git(root,["symbolic-ref","HEAD"])});
 if(seat.state==="held")refuse("holder-live-elsewhere");
 return {tokenDigest:operationDigest("token" in read?read.token:null),context:configuration.context,tree:s.tree};
}
/** A lookup hint from the existing owned wrapper command is not authority.
 * The same existing process-proof constructor must then verify every process,
 * executable, group, row and exact Git argv before config can be normalized.
 * This branch does not invoke Git, load current policy or adopt ownership.
 * @param {string} root */
function qualifyPublicationRouting(root){
 if(process.env.NODE_OPTIONS||process.env.NODE_PATH)refuse("QUALIFIED_PUBLICATION_NODE_ROUTING");
 const self=publicationProcess(process.pid),hook=publicationProcess(self.ppid),gitParent=publicationProcess(hook.ppid),wrapper=publicationProcess(gitParent.ppid);
 const prefix=[wrapper.program,fileURLToPath(new URL("./qualified-publication-launch.mjs",import.meta.url)),"--root",root,"--operation"].join(" ")+" ";
 if(!wrapper.command.startsWith(prefix))refuse("QUALIFIED_PUBLICATION_LAUNCH_REQUIRED");
 const id=/^([A-Za-z0-9][A-Za-z0-9._-]{0,127}) --token launch-[0-9a-f-]{36}$/.exec(wrapper.command.slice(prefix.length))?.[1];
 if(!id)refuse("QUALIFIED_PUBLICATION_LAUNCH_REQUIRED");
 const rec=readAcceptedOperation(root,id,"qualified-delivery");
 if(!rec||rec.operation.kind!=="qualified-delivery"||rec.operation.request.coordinator.root!==root||rec.state!=="unknown"||rec.operation.request.route.name!=="protected-atomic-push-v1")refuse("QUALIFIED_PUBLICATION_CONFIGURATION_CHANGED");
 assertPublicationPushParameters(rec.operation.request,process.env.GIT_CONFIG_PARAMETERS);
 capturePublicationProcessProof(rec,"pre-push");
 const tool=loadInstalledRecordTool();
 requireInstalledRuntimeAssets(tool,["tools/e2e/scripts/qualified-publication-hook.mjs","tools/e2e/scripts/qualified-publication-process.mjs","tools/e2e/scripts/durable-operation.mjs","tools/e2e/scripts/operation-record.mjs","cli/hook-git-context.mjs","cli/configured-gate-reader.mjs","tools/e2e/scripts/product-hook.mjs"]);
 if(operationContent(tool)!==operationContent(rec.operation.request.route.publication.tool))refuse("QUALIFIED_PUBLICATION_CONFIGURATION_CHANGED");
 // Re-read both original row and existing live process proof after TOOL reads.
 const current=readAcceptedOperation(root,id,"qualified-delivery");if(operationContent(current)!==operationContent(rec))refuse("QUALIFIED_PUBLICATION_CONFIGURATION_CHANGED");capturePublicationProcessProof(current,"pre-push");
 return {status:"routing-qualified"};
}
/** @param {string} root @param {"pre-tool"|"pre-push"} mode @param {any} input */
export async function decideQualifiedPublicationHook(root,mode,input){
 if(mode==="pre-push"&&shape(input,["mode","routing"])&&input.mode===mode&&input.routing===true)return qualifyPublicationRouting(root);
 const rows=listAcceptedOperations(root).filter((/** @type {any} */ rec)=>rec.operation.kind==="qualified-delivery"&&rec.state!=="finished"&&rec.operation.request.coordinator.root===root&&rec.operation.request.route.publicationOwed);
 if(!rows.length)return {status:"ordinary"};
 if(process.env.NODE_OPTIONS||process.env.NODE_PATH)refuse("QUALIFIED_PUBLICATION_NODE_ROUTING");
 if(rows.length!==1)refuse("QUALIFIED_PUBLICATION_AMBIGUOUS");
 const rec=rows[0],req=rec.operation.request;if(req.route.name!=="protected-atomic-push-v1")refuse("QUALIFIED_PUBLICATION_ROUTE_UNFROZEN");
 const s=req.route.publication;
 if(mode==="pre-tool"){
  if(!shape(input,["mode","command"])||input.mode!==mode||input.command!==publicationPushCommand(req,rec.operation.publication?.launches?.at(-1)?.git?.path))refuse("QUALIFIED_PUBLICATION_COMMAND_CHANGED");
 }else{
  if(!shape(input,["mode","remoteName","remoteUrl","updates"])||input.mode!==mode||input.remoteName!==s.destination.url||input.remoteUrl!==s.destination.url||!Array.isArray(input.updates)||input.updates.length!==2)refuse("QUALIFIED_PUBLICATION_ADVERTISED_SET");
  const wanted=new Map([[s.destination.ref,s.destination.expectedOld],[s.correlationRef,"0".repeat(40)]]);
  for(const u of input.updates){if(!shape(u,["localRef","localOid","remoteRef","remoteOid"])||u.localRef!==s.commit||u.localOid!==s.commit||!wanted.has(u.remoteRef)||wanted.get(u.remoteRef)!==u.remoteOid)refuse("QUALIFIED_PUBLICATION_ADVERTISED_SET");wanted.delete(u.remoteRef);}
  if(wanted.size)refuse("QUALIFIED_PUBLICATION_ADVERTISED_SET");
 }
 const proof=capturePublicationProcessProof(rec,mode),tool=loadInstalledRecordTool();
 await loadQualifiedDeliveryPolicy();assertQualifiedDeliveryContinuation(root,rec,{tool},proof);readQualifiedPublicationGate(rec,tool);
 // Recheck exact stored row and OS ancestry after all potentially slow reads.
 assertQualifiedDeliveryContinuation(root,rec,{tool},proof);
 return {status:"decision",verdict:"allow",code:"qualified-publication-exact",reason:"The original paired authority, current protected policy, owned launch and exact publication updates are qualified"};
}
/** @param {string[]} argv */
export async function main(argv){
 try{
  if(argv.length!==4||argv[0]!=="--root"||argv[2]!=="--mode"||!["pre-tool","pre-push"].includes(argv[3]??""))refuse("QUALIFIED_PUBLICATION_HOOK_REQUEST");
  const raw=readFileSync(0);if(raw.length>1024*1024)refuse("QUALIFIED_PUBLICATION_HOOK_REQUEST");
  const input=JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(raw));
  process.stdout.write(JSON.stringify(await decideQualifiedPublicationHook(/** @type {string} */(argv[1]),/** @type {"pre-tool"|"pre-push"} */(argv[3]),input))+"\n");return 0;
 }catch(error){const e=/** @type {any} */(error);process.stdout.write(JSON.stringify({status:"decision",verdict:"block",code:e?.code??"hook-publication-unavailable",reason:error instanceof Error?error.message:String(error)})+"\n");return 0;}
}
if(isMain(import.meta))process.exitCode=await main(process.argv.slice(2));
