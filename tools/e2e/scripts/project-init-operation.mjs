/** Finite local initialization protocol. Preparation uses an owned external
 * scratch home; no selected PRODUCT/RECORDS directory is touched here.
 */
import {execFileSync,spawnSync} from "node:child_process";
import {mkdirSync,mkdtempSync,readFileSync,readdirSync,lstatSync,writeFileSync,rmSync,realpathSync,existsSync,openSync,closeSync,fsyncSync,renameSync,unlinkSync,fchmodSync,rmdirSync} from "node:fs";
import os from "node:os";
import path from "node:path";
import {RUNTIME_DIR_IGNORE} from "../../../cli/lane-fence.mjs";
import {randomUUID} from "node:crypto";
import {atomicJson,syncNativeFileNamespace,withNativeTransaction} from "./native-codex.mjs";
import {assertOperationOwnership,defaultRunIo,readReservation,takeReservation,releaseReservation,sha256} from "./run-record.mjs";
import {operationContent,operationDigest,operationPayload,operationWork,validOperationRecord} from "./operation-record.mjs";
import {validProjectInitRequest} from "./project-init-record.mjs";
import {WORKSPACE_ASSOCIATION_REL_PATH,WORKSPACE_BINDING_REL_PATH,validateAssociation,resolveWorkspace} from "./workspace.mjs";
import {assertExactRecordTransformations} from "./record-write.mjs";
import {acceptedOperationPath,readAcceptedOperation,operationOwnerAlive,checkOperationEnvironment,captureOperationRepository} from "./durable-operation.mjs";

const identities=new WeakSet(),preparedPlans=new WeakSet(),activeInitializations=new Set();
// Shared initial/restore configuration audit; this export grants no write or
// hook/config bypass and retains the exact initialization policy below.
export {initialConfiguration as assertInitialRepositoryConfiguration};
export class ProjectInitializationFinding extends Error {
 /** @param {string} code */
 constructor(code){super(`${code}: local project initialization unavailable`);this.code=code;this.name="ProjectInitializationFinding";}
}
/** @param {string} code @returns {never} */
function refuse(code){throw new ProjectInitializationFinding(code);}
/** @param {any} value @param {string[]} fields */
function shape(value,fields){return value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).sort().join("\0") === [...fields].sort().join("\0");}
/** @param {any} value @returns {any} */
function freeze(value){if(value && typeof value === "object"){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
/** @param {any} file */
function initialFile(file){
 if(!shape(file,["path","mode","base64"]) || typeof file.path !== "string" || path.posix.isAbsolute(file.path) || path.win32.isAbsolute(file.path) ||
  /[\\\x00-\x1f\x7f]/.test(file.path) || file.path.split("/").some((/** @type {string} */ p)=>!p || [".","..",".git",".supertaskr"].includes(p)) ||
  !["100644","100755"].includes(file.mode) || typeof file.base64 !== "string" || Buffer.from(file.base64,"base64").toString("base64") !== file.base64) refuse("PROJECT_INIT_FILE");
 return {...file};
}
/** @param {string} root @param {string[]} args @param {Buffer|string|undefined} [input] @param {Record<string,string>} [env] */
function git(root,args,input,env={}){
 try{return execFileSync("git",["--no-replace-objects","-C",root,...args],{stdio:[input === undefined?"ignore":"pipe","pipe","pipe"],
  ...(input === undefined?{}:{input}),maxBuffer:32*1024*1024,env:{...process.env,GIT_NO_LAZY_FETCH:"1",GIT_OPTIONAL_LOCKS:"0",...env}});}
 catch{refuse("PROJECT_INIT_GIT");}
}
/** @param {string} root @param {string[]} args */
function line(root,args){return git(root,args).toString("utf8").replace(/\n$/,"");}
/** @param {string} value */
function identity(value){
 const match=/^([^\r\n<>]+) <([^\r\n<>]+)> (-?[0-9]+ [+-][0-9]{4})$/.exec(value);
 if(!match) refuse("PROJECT_INIT_GIT_IDENTITY");return {name:match[1],email:match[2],date:match[3]};
}
/** Git may synthesize identity from OS account/hostname. Require explicit
 * user configuration/environment before accepting Git's normalized result.
 * @param {string} root @param {string} key */
function configured(root,key){
 try{return execFileSync("git",["--no-replace-objects","-C",root,"config","--get",key],{encoding:"utf8",stdio:["ignore","pipe","pipe"],env:{...process.env,GIT_NO_LAZY_FETCH:"1",GIT_OPTIONAL_LOCKS:"0"}}).replace(/\n$/,"");}
 catch(error){if(/** @type {any} */(error).status === 1)return undefined;refuse("PROJECT_INIT_GIT_IDENTITY");}
}
/** @param {string} root */
function requireExplicitIdentity(root){
 for(const role of ["author","committer"]){
  const prefix=role === "author"?"GIT_AUTHOR":"GIT_COMMITTER";
  const name=process.env[`${prefix}_NAME`] ?? configured(root,`${role}.name`) ?? configured(root,"user.name");
  const email=process.env[`${prefix}_EMAIL`] ?? configured(root,`${role}.email`) ?? configured(root,"user.email") ?? process.env.EMAIL;
  if(typeof name !== "string" || !name.trim() || /[\x00\r\n<>]/.test(name) || typeof email !== "string" || !email.trim() || /[\x00\r\n<>]/.test(email)) refuse("PROJECT_INIT_GIT_IDENTITY");
 }
}
/** Capture Git's actual explicitly configured/environment identity. The
 * normalized dates are frozen for deterministic later commit preparation.
 * This reads configuration only and supplies no operation authority.
 * @param {string} root */
export function captureOperationCommitIdentity(root){
 checkOperationEnvironment();requireExplicitIdentity(root);
 return freeze({author:identity(line(root,["var","GIT_AUTHOR_IDENT"])),committer:identity(line(root,["var","GIT_COMMITTER_IDENT"]))});
}
/** No injected routing or custom init template is silently disabled. Default
 * sample hooks are not a user guard; the finite empty template is deliberate.
 * @param {string} root */
function initialConfiguration(root){
 checkOperationEnvironment();
 const rows=line(root,["config","--null","--list"]).split("\0").filter(Boolean).map((entry)=>{const at=entry.indexOf("\n");return [entry.slice(0,at).toLowerCase(),entry.slice(at+1)];});
 if(rows.some(([key])=>/^(?:init\.templatedir|includeif\..*|core\.(?:worktree|fsmonitor|hookspath|alternaterefscommand|splitindex|sparsecheckout)|index\.sparse|extensions\.(?:refstorage|partialclone|worktreeconfig))$/.test(/** @type {string} */(key)))) refuse("PROJECT_INIT_GIT_CONFIG");
 if(rows.some(([key,value])=>["core.autocrlf","core.eol","core.safecrlf"].includes(key??"") && value !== "false" && !(key === "core.eol" && value === "native"))) refuse("PROJECT_INIT_TRANSFORMATION");
 if(rows.some(([key,value])=>key === "commit.gpgsign" && !["false","no","off","0"].includes((value??"").toLowerCase()))) refuse("PROJECT_INIT_GIT_CONFIG");
}
/** Exact regular-file plan, canonical user Git identity and zero-parent commit.
 * The optional identity must be the actual opaque object returned by this
 * constructor in the same backend process (P identity reused for R).
 * @param {{operationId:string,role:"product"|"records",initialRef:string,files:any[],message:string,identity?:any}} request */
export function prepareInitialRepository(request){
 if(!shape(request,["operationId","role","initialRef","files","message",...(Object.hasOwn(request??{},"identity")?["identity"]:[])]) ||
  typeof request.operationId !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(request.operationId) || !["product","records"].includes(request.role) ||
  typeof request.initialRef !== "string" || !request.initialRef.startsWith("refs/heads/") || typeof request.message !== "string" || !request.message.trim() || request.message.includes("\0") ||
  !Array.isArray(request.files) || request.files.length === 0 || request.files.length > 10000 || request.identity !== undefined && !identities.has(request.identity)) refuse("PROJECT_INIT_REQUEST");
 const files=request.files.map(initialFile).sort((a,b)=>a.path<b.path?-1:1);
 if(new Set(files.map((file)=>file.path.normalize("NFC").toLowerCase())).size !== files.length || files.some((file,at)=>files.slice(at+1).some((next)=>next.path.startsWith(`${file.path}/`))) ||
  files.reduce((sum,file)=>sum+Buffer.byteLength(file.base64),0)>12*1024*1024) refuse("PROJECT_INIT_FILE");
 const scratch=mkdtempSync(path.join(os.tmpdir(),"supertaskr-init-plan-"));
 try{
  initialConfiguration(scratch);git(scratch,["check-ref-format",request.initialRef]);
  git(scratch,["init","--quiet","--template=","--object-format=sha1",`--initial-branch=${request.initialRef.slice("refs/heads/".length)}`]);
  const actor=request.identity ?? captureOperationCommitIdentity(scratch);
  identities.add(actor);
  const env={GIT_AUTHOR_NAME:actor.author.name,GIT_AUTHOR_EMAIL:actor.author.email,GIT_AUTHOR_DATE:actor.author.date,
   GIT_COMMITTER_NAME:actor.committer.name,GIT_COMMITTER_EMAIL:actor.committer.email,GIT_COMMITTER_DATE:actor.committer.date};
  git(scratch,["read-tree","--empty"]);
  for(const file of files){
   const blob=git(scratch,["hash-object","-w","--stdin"],Buffer.from(file.base64,"base64")).toString("ascii").replace(/\n$/,"");
   git(scratch,["update-index","--add","--cacheinfo",`${file.mode},${blob},${file.path}`]);
  }
  assertExactRecordTransformations(scratch,files.map((file)=>file.path));
  const tree=line(scratch,["write-tree"]),message=`${request.message.trimEnd()}\n\nSupertaskr-Initialization: ${request.operationId}/${request.role}\n`;
  const commit=git(scratch,["commit-tree",tree],message,env).toString("ascii").replace(/\n$/,"");
  // Qualification happens before any planned Gitdir can be adopted. This
  // catches global active hooks/config and all alternate/object-store routing.
  captureOperationRepository(scratch,commit);
  const commitBytes=git(scratch,["cat-file","commit",commit]),commitBase64=commitBytes.toString("base64");
  if(line(scratch,["show","-s","--format=%T%n%P",commit]) !== `${tree}\n` ||
    git(scratch,["hash-object","-t","commit","--stdin"],commitBytes).toString("ascii").replace(/\n$/,"") !== commit) refuse("PROJECT_INIT_COMMIT");
  const marker={version:1,operationId:request.operationId,role:request.role,tree,commit};
  writeFileSync(path.join(scratch,".git","supertaskr-init.json"),JSON.stringify(marker));
  /** @type {any[]} */const gitFiles=[];
  /** @type {string[]} */const gitDirectories=[];
  /** @param {string} relative */
  function collect(relative){for(const entry of readdirSync(path.join(scratch,".git",relative),{withFileTypes:true}).sort((a,b)=>a.name<b.name?-1:1)){
   const file=relative?`${relative}/${entry.name}`:entry.name,absolute=path.join(scratch,".git",file),stat=lstatSync(absolute);
   if(stat.isSymbolicLink()) refuse("PROJECT_INIT_GITDIR");
   if(stat.isDirectory()) {gitDirectories.push(file);collect(file);}else if(stat.isFile())gitFiles.push({path:file,mode:stat.mode & 0o111?"100755":"100644",base64:readFileSync(absolute).toString("base64")});else refuse("PROJECT_INIT_GITDIR");
  }}
  collect("");
  const prepared=freeze({version:1,operationId:request.operationId,role:request.role,initialRef:request.initialRef,objectFormat:"sha1",files,tree,commit,identity:actor,message,commitBase64,gitFiles,gitDirectories});
  preparedPlans.add(prepared);return prepared;
 }finally{rmSync(scratch,{recursive:true,force:true});}
}

const ROLES=["product","records"];
/** @param {string} file @returns {import("node:fs").Stats|null} */
function present(file){try{return lstatSync(file);}catch(error){if(/** @type {NodeJS.ErrnoException} */(error).code === "ENOENT")return null;refuse("PROJECT_INIT_PATH");}}
/** @param {any} root */
function rootIdentity(root){
 if(realpathSync(root.path) !== root.path) refuse("PROJECT_INIT_ROOT");
 const stat=lstatSync(root.path,{bigint:true});
 if(!stat.isDirectory() || stat.isSymbolicLink() || String(stat.dev) !== root.device || String(stat.ino) !== root.inode) refuse("PROJECT_INIT_ROOT_CHANGED");
 return stat;
}
/** Native-selected canonical directory fact, not a path authority from a model.
 * @param {string} root */
export function capturePlainProjectRoot(root){
 checkOperationEnvironment();
 root=realpathSync(root);const stat=lstatSync(root,{bigint:true});
 if(!stat.isDirectory() || stat.isSymbolicLink() || present(path.join(root,".git"))) refuse("PROJECT_INIT_ROOT");
 const probe=spawnSync("git",["--no-replace-objects","-C",root,"rev-parse","--show-toplevel"],{encoding:"utf8",stdio:["ignore","pipe","pipe"],
  env:{...process.env,GIT_NO_LAZY_FETCH:"1",GIT_OPTIONAL_LOCKS:"0",LC_ALL:"C"}});
 if(probe.status === 0)refuse("PROJECT_INIT_PARENT_REPOSITORY");
 const absent=/^fatal: not a git repository \(or any of the parent directories\): \.git\n$/.test(probe.stderr??"") ||
  /^fatal: not a git repository \(or any parent up to mount point [^\r\n]+\)\nStopping at filesystem boundary \(GIT_DISCOVERY_ACROSS_FILESYSTEM not set\)\.\n$/.test(probe.stderr??"");
 if(probe.error || probe.signal || probe.status !== 128 || probe.stdout !== "" || !absent)refuse("PROJECT_INIT_PARENT_GIT_UNAVAILABLE");
 // A malformed or inaccessible ancestor marker can produce the same Git exit
 // as a plain directory. Its presence is ambiguous, never permission to init.
 for(let ancestor=path.dirname(root);;ancestor=path.dirname(ancestor)){
  try{lstatSync(path.join(ancestor,".git"));refuse("PROJECT_INIT_PARENT_GIT_UNAVAILABLE");}
  catch(error){if(/** @type {NodeJS.ErrnoException} */(error).code !== "ENOENT")refuse("PROJECT_INIT_PARENT_GIT_UNAVAILABLE");}
  if(path.dirname(ancestor) === ancestor)break;
 }
 return freeze({path:root,device:String(stat.dev),inode:String(stat.ino)});
}
/** Canonical exact Gitdir artifact validation occurs outside selected roots.
 * No hook/config/ref can be smuggled into a fresh repository adoption.
 * @param {any} plan */
function verifyArtifact(plan){
 const allowed=/^(?:config|HEAD|index|supertaskr-init\.json|objects\/[0-9a-f]{2}\/[0-9a-f]{38})$/;
 if(plan.gitFiles.some((/** @type {any} */ f)=>!allowed.test(f.path)) || new Set(plan.gitFiles.map((/** @type {any} */ f)=>f.path)).size !== plan.gitFiles.length ||
  plan.gitDirectories.some((/** @type {string} */ d)=>! /^(?:objects(?:\/(?:info|pack|[0-9a-f]{2}))?|refs(?:\/(?:heads|tags))?)$/.test(d))) refuse("PROJECT_INIT_GITDIR");
 const temp=mkdtempSync(path.join(os.tmpdir(),"supertaskr-init-verify-"));
 try{
  const control=path.join(temp,".git");mkdirSync(control);
  for(const dir of plan.gitDirectories)mkdirSync(path.join(control,dir),{recursive:true});
  for(const file of plan.gitFiles){const target=path.join(control,file.path);mkdirSync(path.dirname(target),{recursive:true});writeFileSync(target,Buffer.from(file.base64,"base64"));}
  if(readFileSync(path.join(control,"HEAD"),"utf8") !== `ref: ${plan.initialRef}\n` ||
    operationContent(JSON.parse(readFileSync(path.join(control,"supertaskr-init.json"),"utf8"))) !== operationContent({version:1,operationId:plan.operationId,role:plan.role,tree:plan.tree,commit:plan.commit})) refuse("PROJECT_INIT_GITDIR");
  const config=line(temp,["config","--file",path.join(control,"config"),"--null","--list"]).split("\0").filter(Boolean);
  if(config.some((entry)=>!/^core\.(?:repositoryformatversion|filemode|bare|logallrefupdates|ignorecase|precomposeunicode)\n/.test(entry))) refuse("PROJECT_INIT_GITDIR");
  const raw=git(temp,["cat-file","commit",plan.commit]);
  if(raw.toString("base64") !== plan.commitBase64 || line(temp,["show","-s","--format=%T%n%P",plan.commit]) !== `${plan.tree}\n` ||
   git(temp,["hash-object","-t","commit","--stdin"],raw).toString("ascii").replace(/\n$/,"") !== plan.commit ||
   !raw.toString("utf8").includes(`\nauthor ${plan.identity.author.name} <${plan.identity.author.email}> ${plan.identity.author.date}\n`) ||
   !raw.toString("utf8").includes(`\ncommitter ${plan.identity.committer.name} <${plan.identity.committer.email}> ${plan.identity.committer.date}\n`) ||
   !raw.toString("utf8").endsWith(`\n\n${plan.message}`)) refuse("PROJECT_INIT_COMMIT");
  const entries=git(temp,["ls-tree","-r","-z",plan.commit]).toString("utf8").split("\0").filter(Boolean);
  if(entries.length !== plan.files.length) refuse("PROJECT_INIT_TREE");
  for(const file of plan.files){const entry=entries.find((line)=>line.slice(line.indexOf("\t")+1) === file.path),match=entry && /^(100(?:644|755)) blob ([0-9a-f]{40})\t/.exec(entry);
   if(!match || match[1] !== file.mode || git(temp,["cat-file","blob",/** @type {string} */(match[2])]).toString("base64") !== file.base64) refuse("PROJECT_INIT_TREE");}
  const reachable=line(temp,["rev-list","--objects",plan.commit]).split("\n").map((line)=>line.split(" ")[0]).sort();
  const all=line(temp,["cat-file","--batch-all-objects","--batch-check=%(objectname)"]).split("\n").sort();
  if(operationContent(reachable) !== operationContent(all)) refuse("PROJECT_INIT_OBJECTS");
 }finally{rmSync(temp,{recursive:true,force:true});}
}
/** @param {any} request */
function validateSemantics(request){
 const p=request.plans.product,r=request.plans.records;
 if(operationContent(p.files.map((/** @type {any} */ f)=>f.path).sort()) !== operationContent([".gitignore","AGENTS.md","CLAUDE.md","supertaskr.yaml"].sort()) ||
  r.files.some((/** @type {any} */ f)=>![".gitignore",WORKSPACE_ASSOCIATION_REL_PATH].includes(f.path) && !/^docs\/.+\.md$/.test(f.path)) ||
  !["NORTH_STAR.md","ROADMAP.md","ARCHITECTURE.md","CONVENTIONS.md","STATE.md"].every((file)=>r.files.some((/** @type {any} */ f)=>f.path === `docs/${file}`))) refuse("PROJECT_INIT_METHOD_PLAN");
 const association=r.files.find((/** @type {any} */ f)=>f.path === WORKSPACE_ASSOCIATION_REL_PATH);
 if(!association) refuse("PROJECT_INIT_ASSOCIATION");
 try{validateAssociation(JSON.parse(Buffer.from(association.base64,"base64").toString("utf8")),{objectFormat:"sha1",rootCommits:[p.commit],selectedCommit:p.commit},{projectId:request.projectId});}
 catch{refuse("PROJECT_INIT_ASSOCIATION");}
 const binding=request.runtimeWrites.find((/** @type {any} */ f)=>f.path === WORKSPACE_BINDING_REL_PATH);
 let parsed;try{parsed=JSON.parse(Buffer.from(binding.base64,"base64").toString("utf8"));}catch{refuse("PROJECT_INIT_BINDING");}
 if(!shape(parsed,["version","projectId","productRoot","recordsRoot"]) || parsed.version !== 1 || parsed.projectId !== request.projectId ||
  parsed.productRoot !== request.roots.product.path || parsed.recordsRoot !== request.roots.records.path) refuse("PROJECT_INIT_BINDING");
}
/** Only canonical operational bookkeeping can pre-exist in PRODUCT. All
 * declared user files and directories begin absent, even if bytes would match.
 * @param {any} request */
function freshRoots(request){
 for(const role of ROLES){
  const root=request.roots[role].path,entries=readdirSync(root);
  if(role === "records" && entries.length || role === "product" && entries.some((entry)=>entry !== ".supertaskr"))refuse("PROJECT_INIT_PREIMAGE_CHANGED");
  if(role === "product" && entries.includes(".supertaskr")){
   const runtime=path.join(root,".supertaskr"),stat=lstatSync(runtime);
   if(!stat.isDirectory() || stat.isSymbolicLink() || readdirSync(runtime).some((entry)=>![".gitignore","runs"].includes(entry)))refuse("PROJECT_INIT_PREIMAGE_CHANGED");
   const ignore=path.join(runtime,".gitignore");if(present(ignore) && (!lstatSync(ignore).isFile() || lstatSync(ignore).isSymbolicLink() || readFileSync(ignore,"utf8") !== RUNTIME_DIR_IGNORE))refuse("PROJECT_INIT_PREIMAGE_CHANGED");
   const runs=path.join(runtime,"runs");if(present(runs) && (!lstatSync(runs).isDirectory() || lstatSync(runs).isSymbolicLink()))refuse("PROJECT_INIT_PREIMAGE_CHANGED");
  }
 }
 for(const preimage of request.preimages)if(present(inside(request.roots[preimage.role].path,preimage.path)))refuse("PROJECT_INIT_PREIMAGE_CHANGED");
}
/** One read-only fresh-root rule for the trusted constructor and executor.
 * Canonical operational leftovers may exist after a pre-capture refusal. This
 * validates no tool authority, reserves nothing and writes no selected path.
 * @param {any} input */
export function assertFreshProjectInitialization(input){
 checkOperationEnvironment();
 let request;try{request=freeze(operationPayload(input));}catch{refuse("PROJECT_INIT_REQUEST");}
 if(!validProjectInitRequest(request))refuse("PROJECT_INIT_REQUEST");
 for(const role of ROLES){const actual=capturePlainProjectRoot(request.roots[role].path);
  if(operationContent(actual) !== operationContent(request.roots[role]))refuse("PROJECT_INIT_ROOT_CHANGED");}
 validateSemantics(request);freshRoots(request);
 return freeze({status:"fresh",roots:request.roots});
}
/** Verify exact staged bytes immediately before adoption, independent of the
 * retained planned tree. No foreign ref/config/hook/object file is adopted.
 * @param {any} rec @param {string} role @param {string} control */
function verifyStage(rec,role,control){
 const plan=rec.operation.request.plans[role],files=[...plan.gitFiles,{path:"supertaskr-init-operation",mode:"100644",base64:Buffer.from(`${rec.operation.digest}\n`).toString("base64")}],seen=[];
 const directories=new Set(plan.gitDirectories);for(const file of files){let at=path.dirname(file.path);while(at !== "."){directories.add(at);at=path.dirname(at);}}
 /** @param {string} relative */
 function walk(relative){for(const name of readdirSync(relative?path.join(control,relative):control)){
  const rel=relative?`${relative}/${name}`:name,absolute=path.join(control,rel),stat=lstatSync(absolute);if(stat.isSymbolicLink())refuse("PROJECT_INIT_STAGE_CHANGED");
  if(stat.isDirectory()){if(!directories.has(rel))refuse("PROJECT_INIT_STAGE_CHANGED");walk(rel);}else{
   const expected=files.find((/** @type {any} */ file)=>file.path === rel);if(!stat.isFile() || !expected || (stat.mode&0o111?"100755":"100644") !== expected.mode || readFileSync(absolute).toString("base64") !== expected.base64)refuse("PROJECT_INIT_STAGE_CHANGED");seen.push(rel);
  }
 }}
 walk("");if(seen.length !== files.length)refuse("PROJECT_INIT_STAGE_CHANGED");
}
/** @param {any} rec @param {string} role */
function stagePath(rec,role){return path.join(rec.operation.request.roots[role].path,`.supertaskr-init-${operationWork(rec.operation.id).slice(3)}-${role}`);}
/** Every selected-root write remains under both exact original claims.
 * @param {string} root @param {any} rec @param {any} options @param {string} phase @param {string|undefined} [role] @param {string|undefined} [file] */
function boundaryPolicy(root,rec,options,phase,role,file){
 for(const selected of ROLES){rootIdentity(rec.operation.request.roots[selected]);if(readReservation(root,rec.operation.request.roots[selected].path)?.attempt !== rec.attempt) refuse("PROJECT_INIT_OWNERSHIP");namespace(rec,selected);}
 const permission=options.authorize(freeze({operationId:rec.operation.id,digest:rec.operation.digest,phase,role:role??null,path:file??null,request:rec.operation.request}));
 if(permission && typeof permission.then === "function") refuse("PROJECT_INIT_ASYNC_POLICY");
 if(permission !== true) refuse("PROJECT_INIT_POLICY_REFUSED");
 for(const selected of ROLES){
  const progress=rec.operation.progress[selected],base=rec.operation.request.roots[selected].path;
  if(["git-prepared","files-prepared","git-adopted","ref-accepted"].includes(progress.stage)){
   const control=present(path.join(base,".git"))?path.join(base,".git"):stagePath(rec,selected),config=rec.operation.request.plans[selected].gitFiles.find((/** @type {any} */ file)=>file.path === "config");
   if(!config || present(path.join(control,"config"))?.isSymbolicLink() || readFileSync(path.join(control,"config")).toString("base64") !== config.base64)refuse("PROJECT_INIT_STAGE_CHANGED");
   const head=path.join(control,"HEAD");if(present(head)?.isSymbolicLink() || readFileSync(head,"utf8") !== `ref: ${rec.operation.request.plans[selected].initialRef}\n`)refuse("PROJECT_INIT_REF_CHANGED");
   if(progress.acceptance !== null && initialRef(base,progress.acceptance.ref) !== progress.acceptance.commit)refuse("PROJECT_INIT_REF_CHANGED");
  }
  initialConfiguration(base);sourceAttributes(rec,selected);
 }
}
/** Current effective attributes are checked through the owned complete Gitdir
 * even before its atomic adoption at the selected root. Conditional Gitdir
 * configuration is explicitly unsupported, never guessed from the scratch path.
 * @param {any} rec @param {string} role */
function sourceAttributes(rec,role){
 const p=rec.operation.progress[role],req=rec.operation.request;
 if(!["git-prepared","files-prepared","git-adopted","ref-accepted"].includes(p.stage))return;
 const selected=req.roots[role].path,control=present(path.join(selected,".git"))?path.join(selected,".git"):stagePath(rec,role),paths=req.plans[role].files.map((/** @type {any} */ file)=>file.path);
 const attributes=git(selected,[`--git-dir=${control}`,`--work-tree=${selected}`,"check-attr","-z","--stdin","filter","working-tree-encoding","eol","text","ident"],`${paths.join("\0")}\0`).toString("utf8").split("\0");
 if(attributes.at(-1) === "")attributes.pop();
 if(attributes.length !== paths.length*15)refuse("PROJECT_INIT_TRANSFORMATION");
 for(let at=0;at<attributes.length;at+=3)if(!["unspecified","unset"].includes(/** @type {string} */(attributes[at+2])))refuse("PROJECT_INIT_TRANSFORMATION");
}
/** @param {string} root @param {any} rec */
function persist(root,rec){if(!validOperationRecord(rec))refuse("PROJECT_INIT_RECORD");atomicJson(acceptedOperationPath(root,rec.operation.id),rec);}
/** Exact byte writing only creates a missing file or observes its exact planned
 * result. A partial/foreign temp or path never becomes a new desired request.
 * @param {string} file @param {any} entry @param {any} rec @param {()=>void} policy */
function writeExact(file,entry,rec,policy){
 policy();let ancestor=path.parse(file).root;for(const part of file.slice(ancestor.length).split(path.sep)){const next=path.join(ancestor,part),current=present(next);if(current?.isSymbolicLink())refuse("PROJECT_INIT_PATH");if(present(ancestor)?.isDirectory() && current && !readdirSync(ancestor).includes(part))refuse("PROJECT_INIT_PATH_ALIAS");ancestor=next;}
 let parent=path.dirname(file),missing=[];
 while(!present(parent)){missing.unshift(parent);parent=path.dirname(parent);}
 if(!present(parent)?.isDirectory() || present(parent)?.isSymbolicLink()) refuse("PROJECT_INIT_PATH");
 for(const dir of missing){policy();mkdirSync(dir,{mode:0o700});syncNativeFileNamespace(dir);}
 const now=present(file),bytes=Buffer.from(entry.base64,"base64"),mode=entry.mode === "100755"?0o700:0o600;
 if(now){if(!now.isFile() || now.isSymbolicLink() || (now.mode&0o111?"100755":"100644") !== entry.mode || !readFileSync(file).equals(bytes))refuse("PROJECT_INIT_PATH_CHANGED");
  const temporary=`${file}.supertaskr-init-${operationWork(rec.operation.id).slice(3)}.tmp`,partial=present(temporary);
  if(partial){if(!partial.isFile() || partial.isSymbolicLink() || !readFileSync(temporary).equals(bytes))refuse("PROJECT_INIT_PARTIAL_FILE");policy();unlinkSync(temporary);syncNativeFileNamespace(temporary);}
  const fd=openSync(file,"r");try{fsyncSync(fd);}finally{closeSync(fd);}syncNativeFileNamespace(file);return;}
 const temporary=`${file}.supertaskr-init-${operationWork(rec.operation.id).slice(3)}.tmp`,partial=present(temporary);
 if(partial && (!partial.isFile() || partial.isSymbolicLink() || !readFileSync(temporary).equals(bytes)))refuse("PROJECT_INIT_PARTIAL_FILE");
 if(!partial){const fd=openSync(temporary,"wx",mode);try{writeFileSync(fd,bytes);fsyncSync(fd);}finally{closeSync(fd);}}
 policy();if(present(file))refuse("PROJECT_INIT_PATH_CHANGED");renameSync(temporary,file);syncNativeFileNamespace(file);
}
/** Exact spelling and nonsymlink parents for every declared initial path.
 * @param {string} root @param {string} relative */
function inside(root,relative){
 let at=root;for(const part of relative.split("/")){
  const stat=present(at);if(stat && (!stat.isDirectory() || stat.isSymbolicLink()))refuse("PROJECT_INIT_PATH");
  const child=path.join(at,part),next=present(child);
  if(stat && next && !readdirSync(at).includes(part) || next?.isSymbolicLink())refuse("PROJECT_INIT_PATH_ALIAS");at=child;
 }return at;
}
/** No unplanned user file/directory is adopted into a fresh setup.
 * @param {any} rec @param {string} role */
function namespace(rec,role){
 const req=rec.operation.request,root=req.roots[role].path,p=rec.operation.progress[role],stage=stagePath(rec,role);
 const files=[...req.plans[role].files,...req.runtimeWrites.filter((/** @type {any} */ f)=>f.role === role)].map((/** @type {any} */ f)=>f.path);
 const directories=new Set(req.directories.filter((/** @type {any} */ d)=>d.role === role).map((/** @type {any} */ d)=>d.path));
 for(const file of [...files,...directories]){let parent=path.dirname(file);while(parent !== "."){directories.add(parent);parent=path.dirname(parent);}}
 const allowed=new Set(files.flatMap((/** @type {string} */ file)=>[file,`${file}.supertaskr-init-${operationWork(rec.operation.id).slice(3)}.tmp`]));
 if(role === "product"){directories.add(".supertaskr");allowed.add(".supertaskr/.gitignore");}
 /** @param {string} relative */
 function walk(relative){
  const absolute=relative?path.join(root,relative):root,stat=present(absolute);if(!stat)return;
  if(stat.isSymbolicLink())refuse("PROJECT_INIT_PATH");
  if(relative === ".supertaskr/runs" && role === "product"){if(!stat.isDirectory())refuse("PROJECT_INIT_PATH");return;}
  if(absolute === stage || relative === ".git"){
   if(!stat.isDirectory() || p.stageIdentity === null)refuse("PROJECT_INIT_STAGE_UNATTRIBUTED");
   const current=lstatSync(absolute,{bigint:true});if(String(current.dev) !== p.stageIdentity.device || String(current.ino) !== p.stageIdentity.inode)refuse("PROJECT_INIT_STAGE_CHANGED");
   if(relative === ".git" && !["files-prepared","git-adopted","ref-accepted"].includes(p.stage))refuse("PROJECT_INIT_STAGE_CHANGED");return;
  }
  if(relative && !(stat.isDirectory()?directories.has(relative):allowed.has(relative)))refuse("PROJECT_INIT_FOREIGN_PATH");
  if(stat.isDirectory())for(const child of readdirSync(absolute))walk(relative?`${relative}/${child}`:child);
 }
 walk("");
}
/** @param {string} root @param {any} rec @param {string} role @param {any} options */
function prepareStage(root,rec,role,options){
 const op=rec.operation,p=op.progress[role],plan=op.request.plans[role],stage=stagePath(rec,role),selected=op.request.roots[role].path;
 if(["git-adopted","ref-accepted"].includes(p.stage))return;
 const adopted=path.join(selected,".git");
 if(p.stage === "files-prepared" && present(adopted) && !present(stage))return;
 if(p.stageIdentity === null){
  if(present(stage))refuse("PROJECT_INIT_STAGE_UNATTRIBUTED");
  p.stage="git-staging";persist(root,rec);boundaryPolicy(root,rec,options,"git-stage",role,stage);mkdirSync(stage,{mode:0o700});syncNativeFileNamespace(stage);
  // A crash here leaves a deliberately unattributed directory. Recovery must
  // retain both claims and refuse rather than adopt an unknown incarnation.
  options.onBoundary?.(`${role}:stage-created-unattributed`,structuredClone(rec));
  const identity=lstatSync(stage,{bigint:true});p.stageIdentity={device:String(identity.dev),inode:String(identity.ino)};persist(root,rec);
  options.onBoundary?.(`${role}:stage-owned`,structuredClone(rec));
 }
 const expected=[...plan.gitFiles,{path:"supertaskr-init-operation",mode:"100644",base64:Buffer.from(`${op.digest}\n`).toString("base64")}];
 const directories=new Set(plan.gitDirectories);
 for(const file of expected){let parent=path.dirname(file.path);while(parent !== "."){directories.add(parent);parent=path.dirname(parent);}}
 /** @param {string} relative */
 function verifyPartial(relative){for(const name of readdirSync(relative?path.join(stage,relative):stage)){
  const rel=relative?`${relative}/${name}`:name,absolute=inside(selected,`${path.basename(stage)}/${rel}`),stat=lstatSync(absolute);
  if(stat.isSymbolicLink())refuse("PROJECT_INIT_STAGE_CHANGED");
  if(stat.isDirectory()){if(!directories.has(rel))refuse("PROJECT_INIT_STAGE_CHANGED");verifyPartial(rel);}
  else if(!expected.some((/** @type {any} */ f)=>f.path === rel || `${f.path}.supertaskr-init-${operationWork(op.id).slice(3)}.tmp` === rel))refuse("PROJECT_INIT_STAGE_CHANGED");
 }}
 verifyPartial("");
 const policy=()=>{boundaryPolicy(root,rec,options,"git-stage",role,stage);namespace(rec,role);};
 for(const dir of directories){const absolute=inside(selected,`${path.basename(stage)}/${dir}`);if(!present(absolute)){policy();mkdirSync(absolute,{recursive:true,mode:0o700});syncNativeFileNamespace(absolute);}else if(!lstatSync(absolute).isDirectory())refuse("PROJECT_INIT_STAGE_CHANGED");}
 for(const file of expected)writeExact(inside(selected,`${path.basename(stage)}/${file.path}`),file,rec,policy);
 if(p.stage === "git-staging"){p.stage="git-prepared";persist(root,rec);options.onBoundary?.(`${role}:git-prepared`,structuredClone(rec));}
}
/** @param {string} root @param {any} rec @param {string} role @param {any} options */
function materializeInitial(root,rec,role,options){
 const op=rec.operation,p=op.progress[role],selected=op.request.roots[role].path;
 if(["files-prepared","git-adopted","ref-accepted"].includes(p.stage))return;
 if(p.stage !== "git-prepared")refuse("PROJECT_INIT_PROGRESS");
 const policy=()=>{boundaryPolicy(root,rec,options,"files",role);namespace(rec,role);};
 for(const file of [...op.request.plans[role].files,...op.request.runtimeWrites.filter((/** @type {any} */ f)=>f.role === role && f.path !== WORKSPACE_BINDING_REL_PATH)]){
  writeExact(inside(selected,file.path),file,rec,policy);options.onBoundary?.(`${role}:file`,{operationId:op.id,path:file.path});
 }
 for(const dir of op.request.directories.filter((/** @type {any} */ d)=>d.role === role)){
  const absolute=inside(selected,dir.path);if(!present(absolute)){policy();mkdirSync(absolute,{recursive:true,mode:0o700});syncNativeFileNamespace(absolute);}else if(!lstatSync(absolute).isDirectory())refuse("PROJECT_INIT_PATH_CHANGED");
 }
 p.stage="files-prepared";persist(root,rec);options.onBoundary?.(`${role}:files-prepared`,structuredClone(rec));
}
/** @param {string} root @param {string} ref @returns {string|null} */
function initialRef(root,ref){
 const rows=line(root,["for-each-ref","--format=%(refname)%00%(objectname)%00%(symref)",ref]).split("\n").filter(Boolean).map((row)=>row.split("\0")).filter((row)=>row[0] === ref);
 if(rows.length === 0)return null;if(rows.length !== 1 || rows[0]?.[2] !== "")refuse("PROJECT_INIT_REF_ROUTING");const value=rows[0]?.[1];if(typeof value !== "string" || !/^[0-9a-f]{40}$/.test(value))refuse("PROJECT_INIT_REF_ROUTING");return value;
}
/** @param {any} rec @param {string} role */
function observedInitial(rec,role){
 const p=rec.operation.progress[role],root=rec.operation.request.roots[role].path,plan=rec.operation.request.plans[role];
 if(p.intent === null)return false;
 if(operationContent(captureOperationRepository(root,plan.commit,{forEffect:false})) !== operationContent(p.repository) ||
  line(root,["show","-s","--format=%T%n%P",plan.commit]) !== `${plan.tree}\n` || git(root,["cat-file","commit",plan.commit]).toString("base64") !== plan.commitBase64)refuse("PROJECT_INIT_REPOSITORY_CHANGED");
 const requestMarker=path.join(root,".git","supertaskr-init-operation"),marker=present(requestMarker);
 if(!marker?.isFile() || marker.isSymbolicLink() || readFileSync(requestMarker,"utf8") !== `${rec.operation.digest}\n`)refuse("PROJECT_INIT_RECORD_MARKER");
 const witness=initialRef(root,p.intent.correlationRef);
 if(witness !== null && witness !== plan.commit)refuse("PROJECT_INIT_CORRELATION_FOREIGN");
 if(witness === plan.commit){
  if(p.acceptance !== null)return true;
  const tip=initialRef(root,plan.initialRef);
  if(tip !== null){try{git(root,["merge-base","--is-ancestor",plan.commit,tip]);return true;}catch{refuse("PROJECT_INIT_ACCEPTANCE_UNCERTAIN");}}
  refuse("PROJECT_INIT_ACCEPTANCE_UNCERTAIN");
 }
 if(p.acceptance !== null || initialRef(root,plan.initialRef) !== null)refuse("PROJECT_INIT_ACCEPTANCE_UNCERTAIN");return false;
}
/** @param {string} root @param {any} rec @param {string} role @param {any} options */
function acceptInitial(root,rec,role,options){
 const op=rec.operation,p=op.progress[role],selected=op.request.roots[role].path,plan=op.request.plans[role],target=path.join(selected,".git"),stage=stagePath(rec,role);
 if(p.stage === "ref-accepted"){if(!observedInitial(rec,role))refuse("PROJECT_INIT_ACCEPTANCE_UNCERTAIN");return;}
 if(!["files-prepared","git-adopted"].includes(p.stage))refuse("PROJECT_INIT_PROGRESS");
 if(p.stage === "files-prepared"){
  boundaryPolicy(root,rec,options,"git-adopt",role);namespace(rec,role);
  if(!present(target)){if(!present(stage))refuse("PROJECT_INIT_STAGE_CHANGED");verifyStage(rec,role,stage);renameSync(stage,target);syncNativeFileNamespace(target);}
  else if(present(stage))refuse("PROJECT_INIT_STAGE_CHANGED");
  verifyStage(rec,role,target);
  const stat=lstatSync(target,{bigint:true});if(!stat.isDirectory() || stat.isSymbolicLink() || String(stat.dev) !== p.stageIdentity.device || String(stat.ino) !== p.stageIdentity.inode ||
   readFileSync(path.join(target,"supertaskr-init-operation"),"utf8") !== `${op.digest}\n`)refuse("PROJECT_INIT_STAGE_CHANGED");
  p.repository=captureOperationRepository(selected,plan.commit,{forEffect:false});p.intent={commit:plan.commit,tree:plan.tree,ref:plan.initialRef,correlationRef:`refs/supertaskr/initializations/${operationWork(op.id).slice(3)}/${role}`};
  p.stage="git-adopted";persist(root,rec);options.onBoundary?.(`${role}:git-adopted`,structuredClone(rec));
 }
 if(!observedInitial(rec,role)){
  boundaryPolicy(root,rec,options,"initial-ref",role);initialConfiguration(selected);
  if(operationContent(captureOperationRepository(selected,plan.commit)) !== operationContent(p.repository))refuse("PROJECT_INIT_REPOSITORY_CHANGED");
  git(selected,["update-ref","--stdin"],`start\ncreate ${plan.initialRef} ${plan.commit}\ncreate ${p.intent.correlationRef} ${plan.commit}\nprepare\ncommit\n`,{GIT_COMMITTER_NAME:plan.identity.committer.name,GIT_COMMITTER_EMAIL:plan.identity.committer.email,GIT_COMMITTER_DATE:plan.identity.committer.date});
  options.onBoundary?.(`${role}:ref-accepted`,structuredClone(rec));if(!observedInitial(rec,role))refuse("PROJECT_INIT_ACCEPTANCE_UNCERTAIN");
 }
 p.acceptance={commit:plan.commit,tree:plan.tree,ref:plan.initialRef,attribution:"exact"};p.stage="ref-accepted";persist(root,rec);
}
/** The last binding step has its own exact operation witness. It cannot be
 * inferred merely from matching working bytes or a retained success label.
 * @param {any} rec */
function observedCompletion(rec){
 const op=rec.operation,p=op.progress.records;
 if(p.repository === null)return false;
 const witness=initialRef(op.request.roots.records.path,op.binding.correlationRef);
 if(witness === null)return false;
 if(witness !== op.request.plans.records.commit)refuse("PROJECT_INIT_CORRELATION_FOREIGN");
 if(!op.binding.accepted || ROLES.some((role)=>op.progress[role].acceptance === null))refuse("PROJECT_INIT_COMPLETION_UNCERTAIN");
 for(const role of ROLES)if(!observedInitial(rec,role))refuse("PROJECT_INIT_COMPLETION_UNCERTAIN");
 return true;
}
/** @param {any} rec */
function bindingCurrent(rec){
 const op=rec.operation,binding=op.request.runtimeWrites.find((/** @type {any} */ f)=>f.path === WORKSPACE_BINDING_REL_PATH),file=present(op.binding.path);
 if(!file?.isFile() || file.isSymbolicLink() || readFileSync(op.binding.path).toString("base64") !== binding.base64)refuse("PROJECT_INIT_BINDING_CHANGED");
 const workspace=resolveWorkspace({productRoot:op.request.roots.product.path,mode:"development",commit:op.request.plans.product.commit});
 if(workspace.recordsRoot !== op.request.roots.records.path)refuse("PROJECT_INIT_BINDING");
}
/** @param {string} root @param {any} rec */
function retainCompletion(root,rec){
 rec.operation.acceptance={product:structuredClone(rec.operation.progress.product.acceptance),records:structuredClone(rec.operation.progress.records.acceptance),binding:structuredClone(rec.operation.binding),attribution:"exact"};
 rec.state="unknown";persist(root,rec);
}
/** @param {any} rec */
function initialResult(rec){
 const op=rec.operation;
 return {status:"initialized",operationId:op.id,projectId:op.request.projectId,requestDigest:op.digest,
  product:{root:op.request.roots.product.path,...op.progress.product.acceptance},records:{root:op.request.roots.records.path,...op.progress.records.acceptance},
  bindingDigest:op.binding.digest,receiptDigest:operationDigest({operationId:op.id,requestDigest:op.digest,acceptance:op.acceptance})};
}
/** Historical completion never reruns setup or touches later owners' claims.
 * @param {string} root @param {any} rec */
function finishInitial(root,rec){
 if(!observedCompletion(rec))refuse("PROJECT_INIT_COMPLETION_UNCERTAIN");
 if(rec.operation.acceptance === null || !rec.operation.binding.accepted)refuse("PROJECT_INIT_BINDING_PENDING");
 if(rec.state === "finished" && rec.operation.claims.every((/** @type {any} */ claim)=>claim.releasedAt !== null))return initialResult(rec);
 for(const claim of rec.operation.claims){
  if(claim.releasedAt !== null)continue;
  if(readReservation(root,claim.resource)?.attempt === rec.attempt)releaseReservation(root,{resource:claim.resource,attempt:rec.attempt});
  claim.releasedAt=new Date().toISOString();
  if(claim.role === "product")rec.reservation.releasedAt=claim.releasedAt;
  persist(root,rec);
 }
 rec.state="finished";
 if(!rec.events.some((/** @type {any} */ event)=>event.op === "initialized"))rec.events.push({at:new Date().toISOString(),op:"initialized"});
 persist(root,rec);return initialResult(rec);
}
/** Record only already-proven per-root effects before applying any new
 * continuation policy. Missing work remains pending, never relaunched here.
 * @param {string} root @param {any} before */
function reconcileInitialEffects(root,before){
 return withNativeTransaction(root,{operation:"project-init-observe"},()=>{
  const rec=readAcceptedOperation(root,before.operation.id);
  if(!rec || rec.operation.kind !== "project-init" || rec.operation.digest !== before.operation.digest)refuse("PROJECT_INIT_CHANGED");
  if(rec.operation.owner.pid !== process.pid && operationOwnerAlive(rec.operation.owner,defaultRunIo()))refuse("PROJECT_INIT_OWNER_LIVE");
  for(const role of ROLES){const progress=rec.operation.progress[role];
   if(progress.intent !== null && progress.acceptance === null && observedInitial(rec,role)){
    progress.acceptance={commit:progress.intent.commit,tree:progress.intent.tree,ref:progress.intent.ref,attribution:"exact"};progress.stage="ref-accepted";persist(root,rec);
   }
  }
  return rec;
 });
}
/** @param {any} options @param {any} req @param {string} phase */
function initialAdmission(options,req,phase){
 const permission=options.authorize(freeze({operationId:req.operationId,digest:operationDigest(req),phase,role:null,path:null,request:req}));
 if(permission && typeof permission.then === "function")refuse("PROJECT_INIT_ASYNC_POLICY");
 if(permission !== true)refuse("PROJECT_INIT_POLICY_REFUSED");
}
/** Both selected roots are reserved before publication of the one canonical
 * request. Every subsequent byte comes from that request, not a new prompt.
 * @param {string} coordinatorRoot @param {any} input
 * @param {{authorize:(context:any)=>unknown,onBoundary?:(boundary:string,context:any)=>void}} options */
export function executeProjectInitialization(coordinatorRoot,input,options){
 if(typeof options?.authorize !== "function" || Object.keys(options).some((key)=>!["authorize","onBoundary"].includes(key)))refuse("PROJECT_INIT_POLICY_REQUIRED");
 checkOperationEnvironment();
 let request;try{request=freeze(operationPayload(input));}catch{refuse("PROJECT_INIT_REQUEST");}
 if(!validProjectInitRequest(request))refuse("PROJECT_INIT_REQUEST");
 coordinatorRoot=realpathSync(coordinatorRoot);
 if(coordinatorRoot !== request.roots.product.path)refuse("PROJECT_INIT_COORDINATOR");
 const key=`${coordinatorRoot}\0${request.operationId}`;
 if(activeInitializations.has(key))refuse("PROJECT_INIT_OWNER_LIVE");
 activeInitializations.add(key);
 try{
  let before=readAcceptedOperation(coordinatorRoot,request.operationId);
  if(before && (before.operation.kind !== "project-init" || operationContent(before.operation.request) !== operationContent(request)))refuse("PROJECT_INIT_CHANGED");
  const completed=before !== null && observedCompletion(before);
  if(before?.operation.acceptance !== null && before !== null && !completed)refuse("PROJECT_INIT_COMPLETION_UNCERTAIN");
  if(completed)return withNativeTransaction(coordinatorRoot,{operation:"project-init-history"},()=>{
   const current=readAcceptedOperation(coordinatorRoot,request.operationId);if(!current || current.operation.digest !== before.operation.digest || !observedCompletion(current))refuse("PROJECT_INIT_CHANGED");if(current.operation.acceptance === null)retainCompletion(coordinatorRoot,current);return finishInitial(coordinatorRoot,current);
  });
  if(before === null){
   if(!preparedPlans.has(input.plans.product) || !preparedPlans.has(input.plans.records))refuse("PROJECT_INIT_PREPARATION_REQUIRED");
   assertFreshProjectInitialization(request);
  }
  if(before && before.operation.owner.pid !== process.pid && operationOwnerAlive(before.operation.owner,defaultRunIo()))refuse("PROJECT_INIT_OWNER_LIVE");
  if(before)before=reconcileInitialEffects(coordinatorRoot,before);
  validateSemantics(request);for(const role of ROLES)verifyArtifact(request.plans[role]);
  initialAdmission(options,request,before === null?"admission":"resume-admission");
  return withNativeTransaction(coordinatorRoot,{operation:"project-init"},()=>{
   let rec=readAcceptedOperation(coordinatorRoot,request.operationId);
   if(rec && (rec.operation.kind !== "project-init" || operationContent(rec.operation.request) !== operationContent(request)))refuse("PROJECT_INIT_CHANGED");
   if(rec !== null && observedCompletion(rec)){if(rec.operation.acceptance === null)retainCompletion(coordinatorRoot,rec);return finishInitial(coordinatorRoot,rec);}
   if(rec !== null && rec.operation.acceptance !== null)refuse("PROJECT_INIT_COMPLETION_UNCERTAIN");
   const io=defaultRunIo(),ownerIdentity=io.identity(process.pid),at=new Date().toISOString();
   if(ownerIdentity === null)refuse("PROJECT_INIT_OWNER_UNKNOWN");
   if(rec && rec.operation.owner.pid !== process.pid && operationOwnerAlive(rec.operation.owner,io))refuse("PROJECT_INIT_OWNER_LIVE");
   const acquired=[];
   if(rec === null){
    const work=operationWork(request.operationId),assignment={kind:"operation",id:work,role:"project-init",resource:coordinatorRoot};
    const progress=()=>({stage:"captured",stageIdentity:null,repository:null,intent:null,acceptance:null});
    rec={version:1,recordKind:"operation",attempt:`${work}-a1`,state:"starting",assignment,assignmentDigest:sha256(JSON.stringify(assignment)),writer:true,resource:coordinatorRoot,
     reservation:{file:null,takenAt:at,releasedAt:null},execution:null,admission:null,
     operation:{version:1,id:request.operationId,kind:"project-init",request,digest:operationDigest(request),owner:{pid:process.pid,identity:ownerIdentity,token:randomUUID()},createdAt:at,
      claims:[],progress:{product:progress(),records:progress()},binding:{path:path.join(coordinatorRoot,WORKSPACE_BINDING_REL_PATH),correlationRef:`refs/supertaskr/initializations/${operationWork(request.operationId).slice(3)}/binding`,digest:operationDigest(request.runtimeWrites.find((/** @type {any} */ f)=>f.path === WORKSPACE_BINDING_REL_PATH).base64),accepted:false},acceptance:null},events:[{at,op:"project-init-capture"}]};
    for(const role of ROLES){rootIdentity(request.roots[role]);namespace(rec,role);}
    const recordDirectory=path.dirname(acceptedOperationPath(coordinatorRoot,request.operationId)),recordDirectoryWasAbsent=!present(recordDirectory);
    try{
     for(const role of ROLES){const resource=request.roots[role].path;assertOperationOwnership(coordinatorRoot,{resource,attempt:rec.attempt});
      const held=readReservation(coordinatorRoot,resource);if(held !== null)refuse("PROJECT_INIT_RESOURCE_RESERVED");
      const taken=takeReservation(coordinatorRoot,{resource,attempt:rec.attempt,role:"project-init",at});
      acquired.push(resource);rec.operation.claims.push({role,resource,file:taken.file,takenAt:at,releasedAt:null});if(role === "product")rec.reservation.file=taken.file;
     }
     persist(coordinatorRoot,rec);
    }catch(error){
     if(!present(acceptedOperationPath(coordinatorRoot,request.operationId))){
      for(const resource of acquired)if(readReservation(coordinatorRoot,resource)?.attempt === rec.attempt)releaseReservation(coordinatorRoot,{resource,attempt:rec.attempt});
      // Only this call's known newly-created, empty unpublished OP directory
      // can retire. Unknown contents/old directories are preserved.
      if(recordDirectoryWasAbsent && present(recordDirectory)?.isDirectory() && !lstatSync(recordDirectory).isSymbolicLink() && readdirSync(recordDirectory).length === 0){rmdirSync(recordDirectory);syncNativeFileNamespace(recordDirectory);}
     }
     throw error;
    }
   }else{
    rec.operation.request=freeze(rec.operation.request);
    for(const role of ROLES){rootIdentity(request.roots[role]);if(readReservation(coordinatorRoot,request.roots[role].path)?.attempt !== rec.attempt)refuse("PROJECT_INIT_OWNERSHIP");namespace(rec,role);}
    rec.operation.owner={pid:process.pid,identity:ownerIdentity,token:randomUUID()};persist(coordinatorRoot,rec);
   }
   options.onBoundary?.("captured",structuredClone(rec));
   for(const role of ROLES){
    initialConfiguration(request.roots[role].path);
    prepareStage(coordinatorRoot,rec,role,options);if(["git-prepared","files-prepared"].includes(rec.operation.progress[role].stage) && present(stagePath(rec,role)))verifyStage(rec,role,stagePath(rec,role));materializeInitial(coordinatorRoot,rec,role,options);acceptInitial(coordinatorRoot,rec,role,options);
   }
   const binding=request.runtimeWrites.find((/** @type {any} */ f)=>f.path === WORKSPACE_BINDING_REL_PATH);
   if(!rec.operation.binding.accepted){
    boundaryPolicy(coordinatorRoot,rec,options,"binding","product",binding.path);
    writeExact(inside(coordinatorRoot,binding.path),binding,rec,()=>boundaryPolicy(coordinatorRoot,rec,options,"binding","product",binding.path));
    options.onBoundary?.("binding-written",structuredClone(rec));
    const workspace=resolveWorkspace({productRoot:coordinatorRoot,mode:"development",commit:request.plans.product.commit});
    if(workspace.recordsRoot !== request.roots.records.path || workspace.association.projectId !== undefined && workspace.association.projectId !== request.projectId)refuse("PROJECT_INIT_BINDING");
    rec.operation.binding.accepted=true;persist(coordinatorRoot,rec);
   }
   boundaryPolicy(coordinatorRoot,rec,options,"completion");bindingCurrent(rec);
   for(const role of ROLES)if(initialRef(request.roots[role].path,request.plans[role].initialRef) !== request.plans[role].commit)refuse("PROJECT_INIT_REF_CHANGED");
   const records=request.roots.records.path,plan=request.plans.records;
   if(initialRef(records,rec.operation.binding.correlationRef) !== null)refuse("PROJECT_INIT_COMPLETION_UNCERTAIN");
   git(records,["update-ref","--stdin"],`start\nverify ${plan.initialRef} ${plan.commit}\ncreate ${rec.operation.binding.correlationRef} ${plan.commit}\nprepare\ncommit\n`,{GIT_COMMITTER_NAME:plan.identity.committer.name,GIT_COMMITTER_EMAIL:plan.identity.committer.email,GIT_COMMITTER_DATE:plan.identity.committer.date});
   options.onBoundary?.("binding-ref-accepted",structuredClone(rec));
   if(!observedCompletion(rec))refuse("PROJECT_INIT_COMPLETION_UNCERTAIN");
   retainCompletion(coordinatorRoot,rec);options.onBoundary?.("effects-accepted",structuredClone(rec));
   return finishInitial(coordinatorRoot,rec);
  });
 }finally{activeInitializations.delete(key);}
}
/** Restart consumes the same immutable original capture.
 * @param {string} coordinatorRoot @param {string} operationId
 * @param {{authorize:(context:any)=>unknown,onBoundary?:(boundary:string,context:any)=>void}} options */
export function replayProjectInitialization(coordinatorRoot,operationId,options){
 const rec=readAcceptedOperation(coordinatorRoot,operationId);
 if(rec?.operation.kind !== "project-init")refuse("PROJECT_INIT_ABSENT");
 return executeProjectInitialization(coordinatorRoot,rec.operation.request,options);
}
/** Read only original setup facts for strict cold-client discovery. This does
 * not admit a current session, resume work, release claims or persist missing
 * bookkeeping. The final witness determines the same receipt as later replay.
 * @param {string} coordinatorRoot @param {string} operationId */
export function observeProjectInitialization(coordinatorRoot,operationId){
 coordinatorRoot=realpathSync(coordinatorRoot);
 const rec=readAcceptedOperation(coordinatorRoot,operationId);
 if(rec === null)return null;
 if(rec.operation.kind !== "project-init" || rec.resource !== coordinatorRoot || rec.operation.request.roots.product.path !== coordinatorRoot)refuse("PROJECT_INIT_COORDINATOR");
 const complete=observedCompletion(rec);
 if(rec.operation.acceptance !== null && !complete)refuse("PROJECT_INIT_COMPLETION_UNCERTAIN");
 // Partial proven refs are observations, never permission to apply a missing
 // effect. Check every retained intent even before the final witness exists.
 if(!complete)for(const role of ROLES){
  const p=rec.operation.progress[role];
  if(p.intent !== null){const proven=observedInitial(rec,role);if(p.acceptance !== null && !proven)refuse("PROJECT_INIT_ACCEPTANCE_UNCERTAIN");}
 }
 if(complete && rec.operation.acceptance === null)rec.operation.acceptance={
  product:structuredClone(rec.operation.progress.product.acceptance),records:structuredClone(rec.operation.progress.records.acceptance),
  binding:structuredClone(rec.operation.binding),attribution:"exact"};
 return freeze({status:complete?"initialized":"pending",record:rec,receipt:complete?initialResult(rec):null});
}
