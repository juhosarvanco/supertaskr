import {execFileSync,spawnSync} from "node:child_process";
import {existsSync,mkdtempSync,readFileSync,readdirSync,rmSync,writeFileSync,mkdirSync,renameSync,statSync,chmodSync,realpathSync} from "node:fs";
import os from "node:os";
import path from "node:path";
import {expect,test} from "@playwright/test";
import {capturePlainProjectRoot,executeProjectInitialization,replayProjectInitialization,prepareInitialRepository,observeProjectInitialization,assertFreshProjectInitialization} from "../scripts/project-init-operation.mjs";
import {validProjectInitRequest} from "../scripts/project-init-record.mjs";
import {RUNTIME_DIR_IGNORE} from "../../../cli/lane-fence.mjs";
import {loadInstalledRecordTool,verifyInstalledRecordTool} from "../scripts/records-check.mjs";
import {acceptedOperationPath,readAcceptedOperation} from "../scripts/durable-operation.mjs";
import {withNativeDurabilityObserver} from "../scripts/native-codex.mjs";
import {operationWork,validOperationRecord} from "../scripts/operation-record.mjs";
import {allRecords,readRecord,readReservation,takeReservation,releaseReservation} from "../scripts/run-record.mjs";
import {resolveWorkspace} from "../scripts/workspace.mjs";
import {privateRecordFixture} from "./private-record-fixture";
import {FIXTURE_ENV} from "./private-record-fixture";
import {NO_BACKGROUND_MAINTENANCE,removeGitFixture} from "./git-fixture";
function prepared(role:"product"|"records",files:any[],identity?:any){return prepareInitialRepository({operationId:"new-setup",role,initialRef:"refs/heads/main",files,message:`Local ${role} setup`,...(identity?{identity}:{})});}
function file(path:string,text:string,mode="100644"){return {path,mode,base64:Buffer.from(text).toString("base64")};}
test("initial repository preparation captures actual user identity and exact zero-parent commit bytes without touching chosen roots",()=>{
 const identityEnv:Record<string,string>={GIT_AUTHOR_NAME:FIXTURE_ENV.GIT_AUTHOR_NAME,GIT_AUTHOR_EMAIL:FIXTURE_ENV.GIT_AUTHOR_EMAIL,GIT_COMMITTER_NAME:FIXTURE_ENV.GIT_COMMITTER_NAME,GIT_COMMITTER_EMAIL:FIXTURE_ENV.GIT_COMMITTER_EMAIL};
 const before=Object.fromEntries(Object.keys(identityEnv).map((key)=>[key,process.env[key]]));
 const dir=mkdtempSync(path.join(os.tmpdir(),"init-prepare-control-"));
 try {
  for(const key of Object.keys(before)) process.env[key]=identityEnv[key];
  const product=path.join(dir,"product"),records=path.join(dir,"records");mkdirSync(product);mkdirSync(records);
  const p=prepared("product",[file(".gitignore",".supertaskr/\n"),file("supertaskr.yaml","project:\n  name: Fixture\n")]);
  const r=prepared("records",[file("docs/STATE.md","# Initial state\n"),file("association.json",JSON.stringify({product:p.commit}))],p.identity);
  expect(p.identity.author.name).toBe(FIXTURE_ENV.GIT_AUTHOR_NAME);expect(r.identity).toBe(p.identity);expect(Object.isFrozen(p)).toBe(true);
  expect(readdirSync(product)).toEqual([]);expect(readdirSync(records)).toEqual([]);
  for(const plan of [p,r]) {
   const gitDir=path.join(dir,`${plan.role}-verify`);mkdirSync(gitDir);
   for(const directory of plan.gitDirectories)mkdirSync(path.join(gitDir,directory),{recursive:true});
   for(const entry of plan.gitFiles){const target=path.join(gitDir,entry.path);mkdirSync(path.dirname(target),{recursive:true});writeFileSync(target,Buffer.from(entry.base64,"base64"));}
   const git=(args:string[])=>execFileSync("git",[...NO_BACKGROUND_MAINTENANCE,"--git-dir",gitDir,...args],{encoding:"utf8",env:FIXTURE_ENV}).replace(/\n$/,"");
   expect(git(["show","-s","--format=%T%n%P",plan.commit])).toBe(`${plan.tree}\n`);
   expect(git(["cat-file","commit",plan.commit])).toBe(Buffer.from(plan.commitBase64,"base64").toString().replace(/\n$/,""));
   expect(git(["show",`${plan.commit}:${plan.files[0].path}`])).toBe(Buffer.from(plan.files[0].base64,"base64").toString().replace(/\n$/,""));
   expect(existsSync(path.join(gitDir,"refs/heads/main"))).toBe(false);
   expect(JSON.parse(readFileSync(path.join(gitDir,"supertaskr-init.json"),"utf8"))).toMatchObject({operationId:"new-setup",role:plan.role,commit:plan.commit});
  }
  expect(()=>prepared("records",[file("docs/state.md","bad\n")],JSON.parse(JSON.stringify(p.identity)))).toThrow(/PROJECT_INIT_REQUEST/);
 } finally {
  for(const [key,value] of Object.entries(before)){if(value === undefined)delete process.env[key];else process.env[key]=value;}
  removeGitFixture(dir,"initial repository preparation fixture");
 }
});
test("initial preparation refuses duplicate aliasing and reserved control paths before any Git plan",()=>{
 for(const files of [[file("a","one"),file("a","two")],[file("docs","parent"),file("docs/a.md","child")],[file(".git/config","foreign")],[file("../outside","foreign")]])
  expect(()=>prepared("product",files)).toThrow(/PROJECT_INIT_FILE/);
});

test("initial preparation refuses synthesized OS identity and accepts actual configured user identity in an isolated home",()=>{
 const scratchHome=mkdtempSync(path.join(os.tmpdir(),"init-explicit-identity-"));
 const subject=new URL("../scripts/project-init-operation.mjs",import.meta.url).href;
 const isolated:NodeJS.ProcessEnv={...process.env,HOME:scratchHome,XDG_CONFIG_HOME:path.join(scratchHome,"xdg")};
 for(const key of Object.keys(isolated))if(/^GIT_(?:AUTHOR|COMMITTER)_/.test(key)||key === "EMAIL")delete isolated[key];
 const script=`import {prepareInitialRepository} from ${JSON.stringify(subject)};try{const p=prepareInitialRepository({operationId:'explicit-user',role:'product',initialRef:'refs/heads/main',files:[{path:'AGENTS.md',mode:'100644',base64:Buffer.from('Initial method').toString('base64')}],message:'Initial local setup'});process.stdout.write(JSON.stringify(p.identity));}catch(error){process.stdout.write(JSON.stringify({code:error.code}));process.exitCode=1;}`;
 try {
  // EMAIL-only deliberately permits Git's OS-name fallback, so this control
  // distinguishes explicit identity checks from merely trusting git var.
  const absent=spawnSync(process.execPath,["--input-type=module","-e",script],{encoding:"utf8",env:{...isolated,EMAIL:"explicit-mail-only@example.invalid"}});
  expect(absent.status,absent.stderr).toBe(1);expect(JSON.parse(absent.stdout)).toEqual({code:"PROJECT_INIT_GIT_IDENTITY"});
  writeFileSync(path.join(scratchHome,".gitconfig"),'[user]\n name = Explicit configured user\n email = configured@example.invalid\n');
  const present=spawnSync(process.execPath,["--input-type=module","-e",script],{encoding:"utf8",env:isolated});
  expect(present.status,present.stderr).toBe(0);expect(JSON.parse(present.stdout)).toMatchObject({author:{name:"Explicit configured user",email:"configured@example.invalid"},committer:{name:"Explicit configured user",email:"configured@example.invalid"}});
 }finally{rmSync(scratchHome,{recursive:true,force:true});}
});


function initializationFixture(){
 const f=privateRecordFixture(),product=path.join(f.dir,"new-product"),records=path.join(f.dir,"new-records");mkdirSync(product);mkdirSync(records);
 const original:Record<string,string|undefined>={};for(const key of ["GIT_AUTHOR_NAME","GIT_AUTHOR_EMAIL","GIT_COMMITTER_NAME","GIT_COMMITTER_EMAIL"]){original[key]=process.env[key];process.env[key]=FIXTURE_ENV[key as keyof typeof FIXTURE_ENV];}
 let p,r;
 try {
  p=prepared("product",[file(".gitignore",".supertaskr/\n"),file("supertaskr.yaml","version: 1\nproject:\n  name: Fixture\n"),file("AGENTS.md","# Method agent\n"),file("CLAUDE.md","# Method agent\n")]);
  r=prepared("records",[file(".gitignore",".supertaskr/\n"),file("workspace-association.json",JSON.stringify({version:1,projectId:"initial-fixture",product:{objectFormat:"sha1",rootCommits:[p.commit]}})),
   ...["NORTH_STAR","ROADMAP","ARCHITECTURE","CONVENTIONS","STATE"].map(name=>file(`docs/${name}.md`,`# ${name}\n`)),file("docs/decisions/ADR-TEMPLATE.md","# Decision template\n")],p.identity);
 }finally{for(const [key,value]of Object.entries(original)){if(value === undefined)delete process.env[key];else process.env[key]=value;}}
 const tool=loadInstalledRecordTool(f.manifestPath),runtimeWrites=[{role:"product",...file(".supertaskr/genesis/kit/manifest.json",'{"version":1}\n')},
  {role:"product",...file(".supertaskr/workspace.json",JSON.stringify({version:1,projectId:"initial-fixture",productRoot:product,recordsRoot:records}))}];
 const request={version:1,operationId:"new-setup",kind:"project-init",tool,projectId:"initial-fixture",roots:{product:capturePlainProjectRoot(product),records:capturePlainProjectRoot(records)},plans:{product:p,records:r},runtimeWrites,
  directories:[{role:"records",path:"docs/tasks"},{role:"records",path:"docs/rooms"}],preimages:[...p.files.map((entry:any)=>({role:"product",path:entry.path,present:false})),...r.files.map((entry:any)=>({role:"records",path:entry.path,present:false})),...runtimeWrites.map(entry=>({role:entry.role,path:entry.path,present:false}))]};
 const authorize=()=>{verifyInstalledRecordTool(tool);return true;};
 const git=(root:string,args:string[])=>execFileSync("git",[...NO_BACKGROUND_MAINTENANCE,"--no-replace-objects","-C",root,...args],{encoding:"utf8",env:FIXTURE_ENV}).replace(/\n$/,"");
 return {...f,product,records,request,authorize,git};
}
test("local initialization reserves both fresh roots and durably captures exact setup before any repository/file effect",()=>{
 const f=initializationFixture();try {
  let captured=false;
  const result=executeProjectInitialization(f.product,f.request,{authorize:f.authorize,onBoundary(at,rec){if(at === "captured"){
   captured=true;expect(existsSync(path.join(f.product,".git"))).toBe(false);expect(existsSync(path.join(f.records,".git"))).toBe(false);
   expect(existsSync(path.join(f.product,"supertaskr.yaml"))).toBe(false);expect(existsSync(path.join(f.records,"docs"))).toBe(false);
   expect(readReservation(f.product,f.product)?.attempt).toBe(rec.attempt);expect(readReservation(f.product,f.records)?.attempt).toBe(rec.attempt);
   expect(validOperationRecord(readAcceptedOperation(f.product,"new-setup"))).toBe(true);
  }}});
  expect(captured).toBe(true);expect(result).toMatchObject({status:"initialized",projectId:"initial-fixture",product:{commit:f.request.plans.product.commit},records:{commit:f.request.plans.records.commit}});
  expect(f.git(f.product,["rev-parse","HEAD"])).toBe(result.product.commit);expect(f.git(f.records,["rev-parse","HEAD"])).toBe(result.records.commit);
  expect(f.git(f.product,["show","-s","--format=%P","HEAD"])).toBe("");expect(f.git(f.records,["show","-s","--format=%P","HEAD"])).toBe("");
  expect(resolveWorkspace({productRoot:f.product,mode:"development"}).recordsRoot).toBe(f.records);
  expect(readReservation(f.product,f.product)).toBeNull();expect(readReservation(f.product,f.records)).toBeNull();
  const rec=readAcceptedOperation(f.product,"new-setup");expect(validOperationRecord(rec)).toBe(true);expect(allRecords(f.product)).toHaveLength(1);expect(()=>readRecord(f.product,rec.attempt)).toThrow(/RECORD_OPERATION/);
  expect(replayProjectInitialization(f.product,"new-setup",{authorize(){throw Error("historical setup cannot run again");}})).toEqual(result);
 }finally{f.cleanup();}
});
test("a held second root refuses initialization before OP publication and a released ordinary control initializes",()=>{
 const f=initializationFixture();try{
  takeReservation(f.product,{resource:f.records,attempt:"held-a1",role:"executor",at:new Date().toISOString()});
  expect(()=>executeProjectInitialization(f.product,f.request,{authorize:f.authorize})).toThrow(/RESERVED/);
  expect(readAcceptedOperation(f.product,"new-setup")).toBeNull();expect(readReservation(f.product,f.product)).toBeNull();expect(readReservation(f.product,f.records)?.attempt).toBe("held-a1");
  expect(existsSync(path.join(f.product,".git"))).toBe(false);expect(existsSync(path.join(f.records,"docs"))).toBe(false);
  releaseReservation(f.product,{resource:f.records,attempt:"held-a1"});expect(executeProjectInitialization(f.product,f.request,{authorize:f.authorize}).status).toBe("initialized");
 }finally{f.cleanup();}
});
test("the shared fresh initialization preflight permits canonical no-operation leftovers without changing selected roots",()=>{
 const f=initializationFixture();try{
  const runtime=path.join(f.product,".supertaskr"),ignore=path.join(runtime,".gitignore");
  mkdirSync(path.join(runtime,"runs/reservations"),{recursive:true});writeFileSync(ignore,RUNTIME_DIR_IGNORE);
  const before=readFileSync(ignore),inode=statSync(ignore,{bigint:true}).ino;
  expect(validProjectInitRequest(f.request)).toBe(true);
  expect(assertFreshProjectInitialization(f.request)).toEqual({status:"fresh",roots:f.request.roots});
  expect(readFileSync(ignore)).toEqual(before);expect(statSync(ignore,{bigint:true}).ino).toBe(inode);
  expect(readdirSync(f.product)).toEqual([".supertaskr"]);expect(readdirSync(f.records)).toEqual([]);expect(readAcceptedOperation(f.product,"new-setup")).toBeNull();
  writeFileSync(path.join(runtime,"foreign"),"not canonical bookkeeping");
  expect(()=>assertFreshProjectInitialization(f.request)).toThrow(/PREIMAGE_CHANGED/);
  expect(existsSync(path.join(f.product,".git"))).toBe(false);expect(readAcceptedOperation(f.product,"new-setup")).toBeNull();
 }finally{f.cleanup();}
});
test("initialization requires physically distinct roots even when different case spellings pass lexical separation",()=>{
 const f=initializationFixture();try{
  expect(assertFreshProjectInitialization(f.request).status).toBe("fresh");
  const alias=path.join(path.dirname(f.product),path.basename(f.product).toUpperCase()),candidate=structuredClone(f.request);
  candidate.roots.records={...candidate.roots.product,path:alias};
  const binding=candidate.runtimeWrites.find((entry:any)=>entry.path === ".supertaskr/workspace.json")!;
  binding.base64=Buffer.from(JSON.stringify({version:1,projectId:candidate.projectId,productRoot:f.product,recordsRoot:alias})).toString("base64");
  // The strict schema refuses the physical identity even on a case-sensitive
  // filesystem where this alias does not exist as an actual directory.
  expect(validProjectInitRequest(candidate)).toBe(false);expect(()=>assertFreshProjectInitialization(candidate)).toThrow(/PROJECT_INIT_REQUEST/);
  if(existsSync(alias)){
   const actual=capturePlainProjectRoot(alias);expect(actual.device).toBe(candidate.roots.product.device);expect(actual.inode).toBe(candidate.roots.product.inode);
   candidate.roots.records=actual;expect(validProjectInitRequest(candidate)).toBe(false);
   expect(()=>assertFreshProjectInitialization(candidate)).toThrow(/PROJECT_INIT_REQUEST/);
  }else test.info().annotations.push({type:"filesystem",description:"Case-sensitive volume: exact same-device/inode schema control ran; case-alias physical control unavailable."});
  expect(readdirSync(f.product)).toEqual([]);expect(readdirSync(f.records)).toEqual([]);expect(readAcceptedOperation(f.product,"new-setup")).toBeNull();
 }finally{f.cleanup();}
});
test("plain initialization roots refuse malformed or inaccessible parent Git markers and allow a real plain directory",()=>{
 const home=realpathSync(mkdtempSync(path.join(os.tmpdir(),"init-parent-git-")));try{
  const plain=path.join(home,"plain");mkdirSync(plain);expect(capturePlainProjectRoot(plain).path).toBe(plain);
  for(const kind of ["file","empty-directory","inaccessible-directory"]){
   const parent=path.join(home,kind),child=path.join(parent,"selected");mkdirSync(child,{recursive:true});
   const marker=path.join(parent,".git");if(kind === "file")writeFileSync(marker,"gitdir: missing-foreign-location\n");else mkdirSync(marker);
   if(kind === "inaccessible-directory")chmodSync(marker,0o000);
   try{expect(()=>capturePlainProjectRoot(child)).toThrow(/PROJECT_INIT_PARENT_GIT_UNAVAILABLE/);expect(readdirSync(child)).toEqual([]);}
   finally{if(kind === "inaccessible-directory")chmodSync(marker,0o700);}
  }
 }finally{rmSync(home,{recursive:true,force:true});}
});

function crashInitialization(f:ReturnType<typeof initializationFixture>,boundary:string){
 const subject=new URL("../scripts/project-init-operation.mjs",import.meta.url).href,checker=new URL("../scripts/records-check.mjs",import.meta.url).href;
 const actor=f.request.plans.product.identity,env={...FIXTURE_ENV,GIT_AUTHOR_DATE:actor.author.date,GIT_COMMITTER_DATE:actor.committer.date};
 const child=spawnSync(process.execPath,["--input-type=module","-e",`
 import {readFileSync} from 'node:fs';import {prepareInitialRepository,executeProjectInitialization} from ${JSON.stringify(subject)};import {loadInstalledRecordTool,verifyInstalledRecordTool} from ${JSON.stringify(checker)};
 const q=JSON.parse(readFileSync(0,'utf8')),tool=loadInstalledRecordTool(${JSON.stringify(f.manifestPath)});
 const prepare=(role,identity)=>{const p=q.plans[role];return prepareInitialRepository({operationId:q.operationId,role,initialRef:p.initialRef,files:p.files,message:'Local '+role+' setup',...(identity?{identity}:{})});};
 const product=prepare('product'),records=prepare('records',product.identity);
 executeProjectInitialization(${JSON.stringify(f.product)},{...q,tool,plans:{product,records}},{authorize(){verifyInstalledRecordTool(tool);return true;},onBoundary(at){if(at===${JSON.stringify(boundary)})process.exit(72);}});
 `],{input:JSON.stringify(f.request),encoding:"utf8",env,maxBuffer:4*1024*1024});expect(child.status,child.stderr).toBe(72);
}
function coldInitialization(f:ReturnType<typeof initializationFixture>){
 const subject=new URL("../scripts/project-init-operation.mjs",import.meta.url).href,checker=new URL("../scripts/records-check.mjs",import.meta.url).href;
 const child=spawnSync(process.execPath,["--input-type=module","-e",`import {replayProjectInitialization} from ${JSON.stringify(subject)};import {loadInstalledRecordTool,verifyInstalledRecordTool} from ${JSON.stringify(checker)};const tool=loadInstalledRecordTool(${JSON.stringify(f.manifestPath)});process.stdout.write(JSON.stringify(replayProjectInitialization(${JSON.stringify(f.product)},'new-setup',{authorize(){verifyInstalledRecordTool(tool);return true;}})));`],{encoding:"utf8",env:FIXTURE_ENV,maxBuffer:4*1024*1024});
 expect(child.status,child.stderr).toBe(0);return JSON.parse(child.stdout);
}
test("a crash after stage mkdir before incarnation publication stays unavailable without adopting or releasing the unknown stage",()=>{
 const f=initializationFixture();try{
  crashInitialization(f,"product:stage-created-unattributed");
  const file=acceptedOperationPath(f.product,"new-setup"),before=readFileSync(file),rec=readAcceptedOperation(f.product,"new-setup");
  expect(rec.operation.progress.product).toMatchObject({stage:"git-staging",stageIdentity:null,repository:null,intent:null,acceptance:null});
  const stage=path.join(f.product,`.supertaskr-init-${operationWork("new-setup").slice(3)}-product`),inode=statSync(stage,{bigint:true}).ino;
  expect(readdirSync(stage)).toEqual([]);expect(existsSync(path.join(f.product,".git"))).toBe(false);
  const claims=[readReservation(f.product,f.product),readReservation(f.product,f.records)];
  const subject=new URL("../scripts/project-init-operation.mjs",import.meta.url).href;
  const child=spawnSync(process.execPath,["--input-type=module","-e",`import {replayProjectInitialization} from ${JSON.stringify(subject)};try{replayProjectInitialization(${JSON.stringify(f.product)},'new-setup',{authorize(){return true;}});process.exit(2);}catch(e){process.stdout.write(JSON.stringify({code:e.code}));process.exit(1);}`],{encoding:"utf8",env:FIXTURE_ENV,maxBuffer:1024*1024});
  expect(child.status,child.stderr).toBe(1);expect(JSON.parse(child.stdout)).toEqual({code:"PROJECT_INIT_STAGE_UNATTRIBUTED"});
  expect(readFileSync(file)).toEqual(before);expect(statSync(stage,{bigint:true}).ino).toBe(inode);expect(readdirSync(stage)).toEqual([]);
  expect([readReservation(f.product,f.product),readReservation(f.product,f.records)]).toEqual(claims);
  expect(readdirSync(f.records)).toEqual([]);expect(existsSync(path.join(f.product,"supertaskr.yaml"))).toBe(false);
 }finally{f.cleanup();}
});
for(const role of ["product","records"] as const)test(`manual preservation of the empty unattributed ${role} stage permits only original setup replay`,()=>{
 const f=initializationFixture();try {
  crashInitialization(f,`${role}:stage-created-unattributed`);
  const rec=readAcceptedOperation(f.product,"new-setup"),original=JSON.stringify(rec.operation.request),file=acceptedOperationPath(f.product,"new-setup"),row=readFileSync(file);
  const selected=role==="product"?f.product:f.records,stage=path.join(selected,`.supertaskr-init-${operationWork("new-setup").slice(3)}-${role}`),identity=statSync(stage,{bigint:true});
  expect(rec.operation.progress[role].stageIdentity).toBeNull();expect(readdirSync(stage)).toEqual([]);
  const claims=[readReservation(f.product,f.product),readReservation(f.product,f.records)],preserved=path.join(f.dir,`preserved-unattributed-${role}`);
  // Explicit operator preservation outside both selected roots. This is not
  // an automatic adoption, cleanup, request edit or new-operation retry.
  renameSync(stage,preserved);
  expect(readFileSync(file)).toEqual(row);expect([readReservation(f.product,f.product),readReservation(f.product,f.records)]).toEqual(claims);
  const result=coldInitialization(f);expect(result.status).toBe("initialized");
  const accepted=readAcceptedOperation(f.product,"new-setup");expect(JSON.stringify(accepted.operation.request)).toBe(original);expect(allRecords(f.product)).toHaveLength(1);
  expect(result.product.commit).toBe(rec.operation.request.plans.product.commit);expect(result.records.commit).toBe(rec.operation.request.plans.records.commit);
  expect(f.git(f.product,["rev-list","--count","HEAD"])).toBe("1");expect(f.git(f.records,["rev-list","--count","HEAD"])).toBe("1");
  expect(readReservation(f.product,f.product)).toBeNull();expect(readReservation(f.product,f.records)).toBeNull();
  expect(statSync(preserved,{bigint:true}).dev).toBe(identity.dev);expect(statSync(preserved,{bigint:true}).ino).toBe(identity.ino);expect(readdirSync(preserved)).toEqual([]);
  expect(accepted.operation.progress[role].stageIdentity).not.toEqual({device:String(identity.dev),inode:String(identity.ino)});
 }finally{f.cleanup();}
});
for(const boundary of ["captured","product:stage-owned","product:git-prepared","product:file","product:git-adopted","product:ref-accepted","records:ref-accepted","binding-written","binding-ref-accepted","effects-accepted"])test(`cold initialization resumes original captured artifacts after ${boundary}`,()=>{
 const f=initializationFixture();try{
  crashInitialization(f,boundary);const captured=readAcceptedOperation(f.product,"new-setup");expect(validOperationRecord(captured)).toBe(true);
  const original=JSON.stringify(captured.operation.request),result=coldInitialization(f);
  expect(result).toMatchObject({status:"initialized",product:{commit:captured.operation.request.plans.product.commit},records:{commit:captured.operation.request.plans.records.commit}});
  expect(JSON.stringify(readAcceptedOperation(f.product,"new-setup").operation.request)).toBe(original);
  expect(f.git(f.product,["rev-list","--count","HEAD"])).toBe("1");expect(f.git(f.records,["rev-list","--count","HEAD"])).toBe("1");
  expect(readReservation(f.product,f.product)).toBeNull();expect(readReservation(f.product,f.records)).toBeNull();
 }finally{f.cleanup();}
});
test("initialization refuses an identical foreign planned file before capture rather than adopting it",()=>{
 const f=initializationFixture();try{
  const source=f.request.plans.product.files.find((entry:any)=>entry.path === "AGENTS.md");writeFileSync(path.join(f.product,"AGENTS.md"),Buffer.from(source.base64,"base64"));
  expect(()=>executeProjectInitialization(f.product,f.request,{authorize:f.authorize})).toThrow(/PREIMAGE_CHANGED/);
  expect(readAcceptedOperation(f.product,"new-setup")).toBeNull();expect(existsSync(path.join(f.product,".git"))).toBe(false);expect(existsSync(path.join(f.records,"docs"))).toBe(false);
 }finally{f.cleanup();}
});
test("actual staged Gitdir byte changes refuse before adoption and preserve both original claims",()=>{
 const f=initializationFixture();try{
  expect(()=>executeProjectInitialization(f.product,f.request,{authorize:f.authorize,onBoundary(at){if(at === "product:git-prepared"){
   const control=path.join(f.product,`.supertaskr-init-${operationWork('new-setup').slice(3)}-product`);writeFileSync(path.join(control,"config"),'[core]\n bare = true\n');
  }}})).toThrow(/STAGE_CHANGED/);
  expect(existsSync(path.join(f.product,".git"))).toBe(false);expect(existsSync(path.join(f.product,"supertaskr.yaml"))).toBe(false);expect(readReservation(f.product,f.product)).not.toBeNull();expect(readReservation(f.product,f.records)).not.toBeNull();
 }finally{f.cleanup();}
});
test("completed initialization replay returns original results after later legitimate local commits and invalid current binding",()=>{
 const f=initializationFixture();try{
  const first=executeProjectInitialization(f.product,f.request,{authorize:f.authorize});
  writeFileSync(path.join(f.product,"later.py"),"print('later product work')\n");f.git(f.product,["add","later.py"]);f.git(f.product,["commit","-qm","Later local product work"]);
  writeFileSync(path.join(f.records,"docs/STATE.md"),"# Later legitimate private state\n");f.git(f.records,["add","docs/STATE.md"]);f.git(f.records,["commit","-qm","Later private note"]);
  const tips=[f.git(f.product,["rev-parse","HEAD"]),f.git(f.records,["rev-parse","HEAD"])];writeFileSync(path.join(f.product,".supertaskr/workspace.json"),"invalid successor binding");
  const receiptInode=statSync(acceptedOperationPath(f.product,"new-setup"),{bigint:true}).ino;
  expect(replayProjectInitialization(f.product,"new-setup",{authorize(){throw Error("historical result must not relaunch");}})).toEqual(first);
  expect(statSync(acceptedOperationPath(f.product,"new-setup"),{bigint:true}).ino).toBe(receiptInode);
  expect([f.git(f.product,["rev-parse","HEAD"]),f.git(f.records,["rev-parse","HEAD"])]).toEqual(tips);expect(readFileSync(path.join(f.product,".supertaskr/workspace.json"),"utf8")).toBe("invalid successor binding");
 }finally{f.cleanup();}
});

for(const at of ["before-rename","rename"])test(`initial capture persistence failure at ${at} launches no root effect and retains only justified claims`,()=>{
 const f=initializationFixture();try{
  const record=acceptedOperationPath(f.product,"new-setup");
  expect(()=>withNativeDurabilityObserver((event)=>{if(event.stage === at && event.file === record)throw Error("initial capture unavailable");},()=>executeProjectInitialization(f.product,f.request,{authorize:f.authorize}))).toThrow(/initial capture unavailable/);
  expect(existsSync(path.join(f.product,".git"))).toBe(false);expect(existsSync(path.join(f.records,".git"))).toBe(false);expect(existsSync(path.join(f.product,"supertaskr.yaml"))).toBe(false);
  if(at === "before-rename"){expect(readAcceptedOperation(f.product,"new-setup")).toBeNull();expect(existsSync(path.dirname(record))).toBe(false);expect(readReservation(f.product,f.product)).toBeNull();expect(readReservation(f.product,f.records)).toBeNull();}
  else{expect(validOperationRecord(readAcceptedOperation(f.product,"new-setup"))).toBe(true);expect(readReservation(f.product,f.product)).not.toBeNull();expect(readReservation(f.product,f.records)).not.toBeNull();}
  expect(executeProjectInitialization(f.product,f.request,{authorize:f.authorize}).status).toBe("initialized");
 }finally{f.cleanup();}
});

test("accepted final binding witness recovers before changed current policy and a missing witness never fabricates completion",()=>{
 const f=initializationFixture();try {
  crashInitialization(f,"binding-ref-accepted");
  const record=readAcceptedOperation(f.product,"new-setup");expect(record.operation.acceptance).toBeNull();
  const original=replayProjectInitialization(f.product,"new-setup",{authorize(){throw Error("completed setup must not require current policy");}});
  expect(original.status).toBe("initialized");const completed=readAcceptedOperation(f.product,"new-setup"),witness=completed.operation.binding.correlationRef;
  f.git(f.records,["update-ref","-d",witness]);
  expect(()=>replayProjectInitialization(f.product,"new-setup",{authorize(){return true;}})).toThrow(/COMPLETION_UNCERTAIN/);
  expect(f.git(f.records,["for-each-ref","--format=%(refname)",witness])).toBe("");expect(f.git(f.records,["rev-list","--count","HEAD"])).toBe("1");
 }finally{f.cleanup();}
});
test("a foreign final binding witness refuses without repeating any setup effect",()=>{
 const f=initializationFixture();try {
  crashInitialization(f,"binding-written");const rec=readAcceptedOperation(f.product,"new-setup"),reference=rec.operation.binding.correlationRef;
  f.git(f.records,["update-ref",reference,rec.operation.request.plans.records.tree]);
  const before=readFileSync(acceptedOperationPath(f.product,"new-setup")),binding=readFileSync(path.join(f.product,".supertaskr/workspace.json"));
  expect(()=>replayProjectInitialization(f.product,"new-setup",{authorize:f.authorize})).toThrow(/CORRELATION_FOREIGN/);
  expect(readFileSync(acceptedOperationPath(f.product,"new-setup"))).toEqual(before);expect(readFileSync(path.join(f.product,".supertaskr/workspace.json"))).toEqual(binding);
  expect(f.git(f.records,["rev-parse",reference])).toBe(rec.operation.request.plans.records.tree);
 }finally{f.cleanup();}
});
test("proven product acceptance is recorded before a current continuation policy can refuse private initialization",()=>{
 const f=initializationFixture();try{
  crashInitialization(f,"product:ref-accepted");expect(readAcceptedOperation(f.product,"new-setup").operation.progress.product.acceptance).toBeNull();
  expect(()=>replayProjectInitialization(f.product,"new-setup",{authorize(){return false;}})).toThrow(/POLICY_REFUSED/);
  const rec=readAcceptedOperation(f.product,"new-setup");expect(rec.operation.progress.product.acceptance.commit).toBe(f.git(f.product,["rev-parse","HEAD"]));
  expect(existsSync(path.join(f.records,".git"))).toBe(false);expect(rec.operation.acceptance).toBeNull();
 }finally{f.cleanup();}
});
test("read-only initialization discovery proves the original receipt without persisting or releasing missing bookkeeping",()=>{
 const f=initializationFixture();try{
  expect(observeProjectInitialization(f.product,"new-setup")).toBeNull();
  crashInitialization(f,"product:ref-accepted");
  const pendingBytes=readFileSync(acceptedOperationPath(f.product,"new-setup")),pending=observeProjectInitialization(f.product,"new-setup");
  expect(pending?.status).toBe("pending");expect(pending?.receipt).toBeNull();
  expect(readFileSync(acceptedOperationPath(f.product,"new-setup"))).toEqual(pendingBytes);expect(readReservation(f.product,f.records)).not.toBeNull();
  // Finish the same immutable setup only as far as the final accepted witness.
  expect(()=>replayProjectInitialization(f.product,"new-setup",{authorize:f.authorize,onBoundary(at){if(at === "binding-ref-accepted")throw Error("result not yet recorded");}})).toThrow(/result not yet recorded/);
  const file=acceptedOperationPath(f.product,"new-setup"),bytes=readFileSync(file),inode=statSync(file,{bigint:true}).ino;
  const observed=observeProjectInitialization(f.product,"new-setup");
  expect(observed?.status).toBe("initialized");expect(Object.isFrozen(observed?.record.operation.request)).toBe(true);
  expect(readFileSync(file)).toEqual(bytes);expect(statSync(file,{bigint:true}).ino).toBe(inode);
  expect(readReservation(f.product,f.product)).not.toBeNull();expect(readAcceptedOperation(f.product,"new-setup").operation.acceptance).toBeNull();
  expect(replayProjectInitialization(f.product,"new-setup",{authorize(){throw Error("original acceptance precedes current policy");}})).toEqual(observed?.receipt);
  const complete=observeProjectInitialization(f.product,"new-setup");expect(complete?.receipt).toEqual(observed?.receipt);
  f.git(f.records,["update-ref","-d",complete?.record.operation.binding.correlationRef]);
  expect(()=>observeProjectInitialization(f.product,"new-setup")).toThrow(/COMPLETION_UNCERTAIN/);
 }finally{f.cleanup();}
});
