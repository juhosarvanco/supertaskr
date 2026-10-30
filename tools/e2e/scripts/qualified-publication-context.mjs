/** Freeze the explicitly selected normal Git publication before a full route
 * captures its first operation. This reads only; no remote/ref/hook is created. */
import {execFileSync} from "node:child_process";
import {existsSync,lstatSync,readdirSync,realpathSync,statSync} from "node:fs";
import path from "node:path";
import {normalizeProjectPublication} from "../../../lib/parser/dist/pure.js";
import {loadProjectSettings} from "./project-settings.mjs";
import {requireInstalledRuntimeAssets} from "./records-check.mjs";
import {operationContent,operationDigest,operationWork} from "./operation-record.mjs";
import {checkOperationEnvironment} from "./durable-operation.mjs";
import {qualifyFixedProductPrePush,validatedFixedProductPrePush} from "./fixed-product-hook.mjs";
const contexts=new WeakMap();
export class QualifiedPublicationFinding extends Error{
 /** @param {string} code */
 constructor(code){super(`${code}: qualified publication unavailable`);this.code=code;}
}
/** @param {string} code @returns {never} */
function refuse(code){throw new QualifiedPublicationFinding(code);}
/** @param {any} v @returns {any} */
function freeze(v){if(v&&typeof v==="object"){Object.values(v).forEach(freeze);Object.freeze(v);}return v;}
/** @param {string} root @param {string[]} args */
function git(root,args){try{return execFileSync("git",["--no-replace-objects","-C",root,...args],{encoding:"utf8",stdio:["ignore","pipe","pipe"],maxBuffer:4*1024*1024,
 timeout:15000,env:{...process.env,GIT_NO_LAZY_FETCH:"1",GIT_OPTIONAL_LOCKS:"0",GIT_TERMINAL_PROMPT:"0"}}).replace(/\n$/,"");}catch{refuse("QUALIFIED_PUBLICATION_GIT");}}
/** A bounded local receiver is an existing plain bare repository with normal
 * object/ref routing and no active unknown server hook. Nothing is disabled.
 * GitHub server policy is enforced by that explicitly selected service.
 * @param {string} root */
function localReceiver(root){
 if(realpathSync(root)!==root||git(root,["rev-parse","--is-bare-repository"])!=="true"||realpathSync(git(root,["rev-parse","--absolute-git-dir"]))!==root||
  realpathSync(git(root,["rev-parse","--path-format=absolute","--git-common-dir"]))!==root||git(root,["rev-parse","--show-object-format"])!=="sha1")refuse("QUALIFIED_PUBLICATION_LOCAL_RECEIVER_UNSUPPORTED");
 const rows=git(root,["config","--null","--list"]).split("\0").filter(Boolean);
 if(rows.some(row=>/^(?:core\.(?:worktree|hookspath|alternaterefscommand|fsmonitor)|extensions\.(?:worktreeconfig|refstorage|partialclone)|includeif\.)/i.test(row.slice(0,row.indexOf("\n")))))refuse("QUALIFIED_PUBLICATION_LOCAL_RECEIVER_UNSUPPORTED");
 for(const file of ["objects/info/alternates","objects/info/http-alternates","info/grafts","shallow"])if(existsSync(path.join(root,file)))refuse("QUALIFIED_PUBLICATION_LOCAL_RECEIVER_UNSUPPORTED");
 if(git(root,["for-each-ref","--format=%(refname)","refs/replace"]))refuse("QUALIFIED_PUBLICATION_LOCAL_RECEIVER_UNSUPPORTED");
 const hooks=path.join(root,"hooks");if(existsSync(hooks)){
  if(!lstatSync(hooks).isDirectory()||lstatSync(hooks).isSymbolicLink())refuse("QUALIFIED_PUBLICATION_LOCAL_RECEIVER_UNSUPPORTED");
  for(const name of readdirSync(hooks))if(!name.endsWith(".sample")&&(statSync(path.join(hooks,name)).mode&0o111))refuse("QUALIFIED_PUBLICATION_LOCAL_RECEIVER_UNSUPPORTED");
 }
 return {kind:"local",path:root,providerRepository:null,identities:[root,path.join(root,"objects")].map(file=>{
  const s=lstatSync(file,{bigint:true});if(!s.isDirectory()||s.isSymbolicLink()||realpathSync(file)!==file)refuse("QUALIFIED_PUBLICATION_LOCAL_RECEIVER_UNSUPPORTED");return {path:file,device:String(s.dev),inode:String(s.ino)};
 }),configurationDigest:operationDigest(rows)};
}
/** Freeze effective transport settings as a digest, without retaining secret
 * helper/configuration values in an operation or normal result.
 * @param {string} root @param {string} remote */
function transport(root,remote){
 const rows=git(root,["config","--null","--list"]).split("\0").filter(Boolean).map(row=>{const at=row.indexOf("\n");return {key:row.slice(0,at).toLowerCase(),value:row.slice(at+1)};});
 const selected=rows.filter(row=>row.key.startsWith(`remote.${remote.toLowerCase()}.`)||/^(?:url\.|push\.|protocol\.|http\.|https\.|credential\.|ssh\.|core\.(?:sshcommand|gitproxy)$)/.test(row.key));
 if(selected.some(row=>row.key==="push.recursesubmodules"&&!["false","no","off","0"].includes(row.value.toLowerCase())||
  row.key===`remote.${remote.toLowerCase()}.mirror`&&!["false","no","off","0"].includes(row.value.toLowerCase())||
  /^(?:remote\..*\.(?:receivepack|uploadpack|vcs|proxy)|push\.pushoption|core\.(?:sshcommand|gitproxy)|url\..*\.(?:insteadof|pushinsteadof))$/.test(row.key)))refuse("QUALIFIED_PUBLICATION_TRANSPORT_UNSUPPORTED");
 return operationDigest(selected);
}
/** Only declared supported routing. Local receivers establish Git mechanics;
 * their CI origin remains unavailable to the GitHub provider reader.
 * @param {string} value @param {string} repository */
function endpoint(value,repository){
 if(typeof value!=="string"||!value||/[\x00-\x1f\x7f]/.test(value))refuse("QUALIFIED_PUBLICATION_URL_UNSUPPORTED");
 if(path.isAbsolute(value))return localReceiver(value);
 if(value.includes(" "))refuse("QUALIFIED_PUBLICATION_URL_UNSUPPORTED");
 const scp=/^git@github\.com:([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+?)(?:\.git)?$/.exec(value);
 if(scp){if(/** @type {string} */(scp[1]).toLowerCase()!==repository)refuse("QUALIFIED_PUBLICATION_CI_ORIGIN");return {kind:"github",providerRepository:repository};}
 let parsed;try{parsed=new URL(value);}catch{refuse("QUALIFIED_PUBLICATION_URL_UNSUPPORTED");}
 if(parsed.hostname!=="github.com"||parsed.search||parsed.hash||parsed.password||!(["https:","ssh:"].includes(parsed.protocol))||
  parsed.protocol==="https:"&&(parsed.username||parsed.port)||parsed.protocol==="ssh:"&&(parsed.username!=="git"||parsed.port&&parsed.port!=="22"))refuse("QUALIFIED_PUBLICATION_URL_UNSUPPORTED");
 const repo=parsed.pathname.replace(/^\//,"").replace(/\.git$/,"").toLowerCase();
 if(repo!==repository)refuse("QUALIFIED_PUBLICATION_CI_ORIGIN");return {kind:"github",providerRepository:repository};
}
/** Actual refs from the selected existing named remote. No tracking ref or
 * local object store is updated by this observation.
 * @param {string} root @param {any} selection */
function destination(root,selection){
 const text=git(root,["ls-remote","--refs",selection.remote,selection.destinationRef,selection.correlationRef]),rows=text?text.split("\n"):[];
 const refs=new Map();for(const row of rows){const m=/^([0-9a-f]{40})\t([^\r\n]+)$/.exec(row);if(!m||![selection.destinationRef,selection.correlationRef].includes(m[2])||refs.has(m[2]))refuse("QUALIFIED_PUBLICATION_REMOTE_OBSERVATION");refs.set(m[2],m[1]);}
 return {tip:refs.get(selection.destinationRef)??null,witness:refs.get(selection.correlationRef)??null};
}
/** Actual independently finalized authority is supplied by the constructor,
 * never a frontend/stdio authority object. The result remains read-only.
 * @param {string} coordinatorRoot @param {string} operationId @param {any} authority @param {{tool:any}} configuration */
function publicationSelection(coordinatorRoot,operationId,authority,configuration){
 checkOperationEnvironment();coordinatorRoot=realpathSync(coordinatorRoot);
 if(!configuration||Object.keys(configuration).join(",")!=="tool"||typeof operationId!=="string"||!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(operationId))refuse("QUALIFIED_PUBLICATION_REQUEST");
 const p=authority.roles.find((/** @type {any} */ r)=>r.role==="product");
 if(!p||p.repository.filesystemRoot!==coordinatorRoot||!p.actualOutput.implementation.length)refuse("QUALIFIED_PUBLICATION_NOT_OWED");
 const tool=configuration.tool;requireInstalledRuntimeAssets(tool,["tools/e2e/scripts/qualified-publication-context.mjs","tools/e2e/scripts/fixed-product-hook.mjs","tools/e2e/scripts/qualified-delivery-operation.mjs","tools/e2e/scripts/qualified-delivery-record.mjs"]);
 const loaded=loadProjectSettings({productRoot:coordinatorRoot,productRevision:p.actualOutput.commit,tool});
 if(loaded.status!=="ready")refuse(loaded.status==="not-configured"?"QUALIFIED_PUBLICATION_CONFIGURATION_UNCONFIGURED":loaded.code);
 if(!loaded.settings.publication)refuse("QUALIFIED_PUBLICATION_CONFIGURATION_UNCONFIGURED");
 const selected=normalizeProjectPublication(loaded.settings.publication),urls=git(coordinatorRoot,["remote","get-url","--push","--all",selected.remote]).split("\n");
 if(urls.length!==1||!urls[0])refuse("QUALIFIED_PUBLICATION_URL_AMBIGUOUS");
 const targetEndpoint=endpoint(urls[0],selected.ci.repository),transportDigest=transport(coordinatorRoot,selected.remote);
 const hook=qualifyFixedProductPrePush({productRoot:coordinatorRoot,tool}),correlationRef=`refs/supertaskr/deliveries/${operationWork(operationId).slice(3)}/publication`;
 const remote={remote:selected.remote,destinationRef:selected.destinationRef,correlationRef};
 const body={version:1,kind:"qualified-publication-context",route:"normal-atomic-fast-forward",coordinatorRoot,operationId,authorityDigest:authority.authorityDigest,
  configuration:{revision:p.actualOutput.commit,digest:loaded.provenance.configDigest},tool,hook:hook.descriptor,
  destination:{name:selected.remote,url:urls[0],ref:selected.destinationRef,expectedOld:p.originalBase,endpoint:targetEndpoint},
  transportDigest,commit:p.actualOutput.commit,tree:p.actualOutput.tree,correlationRef,ci:selected.ci};
 validatedFixedProductPrePush(hook,coordinatorRoot);
 return {body,tool,hook,remote,product:p};
}
/** Freeze the actual advertised original destination before first capture.
 * @param {string} coordinatorRoot @param {string} operationId @param {any} authority @param {{tool:any}} configuration */
export function captureQualifiedPublicationContext(coordinatorRoot,operationId,authority,configuration){
 const selected=publicationSelection(coordinatorRoot,operationId,authority,configuration),actual=destination(selected.body.coordinatorRoot,selected.remote);
 if(actual.witness!==null)refuse("QUALIFIED_PUBLICATION_CORRELATION_FOREIGN");
 if(actual.tip!==selected.product.originalBase)refuse("QUALIFIED_PUBLICATION_STALE_DESTINATION");
 const context=freeze({...selected.body,digest:operationDigest(selected.body)});contexts.set(context,{tool:selected.tool,hook:selected.hook});return context;
}
/** Current local-stage policy may refuse the original frozen route but cannot
 * widen it. This does not authorize or observe a remote update: mandatory Git
 * advertised-ref CAS and owned publication remain separate effect boundaries.
 * @param {string} coordinatorRoot @param {any} original @param {any} authority @param {{tool:any}} configuration */
export function qualifyFrozenPublicationLocalContext(coordinatorRoot,original,authority,configuration){
 const selected=publicationSelection(coordinatorRoot,original.operationId,authority,configuration),current={...selected.body,digest:operationDigest(selected.body)};
 assertSameQualifiedPublicationContext(original,current);return selected.hook;
}
/** Only a constructor handle yields a hook proof. Captured metadata can be
 * persisted, but cannot be deserialized into immediate effect authority.
 * @param {any} context */
export function qualifiedPublicationContextProof(context){const captured=contexts.get(context);if(!captured)refuse("QUALIFIED_PUBLICATION_CONTEXT_REQUIRED");return captured.hook;}
/** Fresh current metadata must equal the original frozen route; it may refuse
 * but cannot replace destination or checks. Actual acceptance is read first by
 * the effect owner before calling this function for missing work.
 * @param {any} original @param {any} current */
export function assertSameQualifiedPublicationContext(original,current){if(operationContent(original)!==operationContent(current))refuse("QUALIFIED_PUBLICATION_CONTEXT_CHANGED");return true;}

/** Original destination observation precedes successor TOOL/binding/policy.
 * Actual inherited routing and transport programs are still audited before
 * any receiver query; the stored URL is never replaced by a current remote.
 * @param {string} root @param {any} original */
export function observeFrozenPublicationRefs(root,original){
 checkOperationEnvironment();
 if(original.destination.endpoint.kind==="local"){
  const e=original.destination.endpoint;
  for(const identity of e.identities){const s=lstatSync(identity.path,{bigint:true});if(!s.isDirectory()||s.isSymbolicLink()||realpathSync(identity.path)!==identity.path||String(s.dev)!==identity.device||String(s.ino)!==identity.inode)refuse("QUALIFIED_PUBLICATION_RECEIVER_CHANGED");}
  // A historical local witness needs no transport program or current server
  // hook. Read exact refs directly in the original physical bare Git store.
  const text=git(e.path,["--git-dir",e.path,"for-each-ref","--format=%(objectname)%09%(refname)",original.destination.ref,original.correlationRef]);
  const refs=new Map();for(const row of text?text.split("\n"):[]){const m=/^([0-9a-f]{40})\t([^\r\n]+)$/.exec(row);if(!m||![original.destination.ref,original.correlationRef].includes(m[2])||refs.has(m[2]))refuse("QUALIFIED_PUBLICATION_REMOTE_OBSERVATION");refs.set(m[2],m[1]);}
  return {tip:refs.get(original.destination.ref)??null,witness:refs.get(original.correlationRef)??null};
 }
 transport(root,original.destination.name);
 const actual=endpoint(original.destination.url,original.ci.repository);
 if(operationContent(actual)!==operationContent(original.destination.endpoint))refuse("QUALIFIED_PUBLICATION_RECEIVER_CHANGED");
 return destination(root,{remote:original.destination.url,destinationRef:original.destination.ref,correlationRef:original.correlationRef});
}
