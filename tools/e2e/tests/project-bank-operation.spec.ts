import {spawnSync} from "node:child_process";
import {randomUUID} from "node:crypto";
import {readFileSync,writeFileSync,appendFileSync,mkdirSync,existsSync,readdirSync,cpSync,unlinkSync} from "node:fs";
import path from "node:path";
import {expect,test} from "@playwright/test";
import {bankSchemaFixture} from "./project-bank-fixture";
import {withGenesisIdentity} from "./genesis-init-fixture";
import {privateGit,sha,FIXTURE_ENV} from "./private-record-fixture";
import {inspectProjectInitialization} from "../scripts/genesis-init-inspect.mjs";
import {prepareGenesisBank} from "../scripts/genesis-bank-plan.mjs";
import {executeProjectBank,replayProjectBank,observeProjectBank} from "../scripts/project-bank-operation.mjs";
import {readAcceptedOperation,acceptedOperationPath} from "../scripts/durable-operation.mjs";
import {operationDigest} from "../scripts/operation-record.mjs";
import {validProjectBankRecord} from "../scripts/project-bank-record.mjs";
import {readReservation,takeReservation,releaseReservation} from "../scripts/run-record.mjs";

test.setTimeout(240_000);
function fixture(){const f=bankSchemaFixture(true),file=f.request.input.registryCapture.path,row=JSON.parse(readFileSync(file,"utf8"));row.sessions[0].native_session_id="11111111-2222-4333-8444-555555555555";writeFileSync(file,JSON.stringify(row));return f;}
function facts(f:ReturnType<typeof fixture>){return [f.product,f.records].map(root=>({head:privateGit(root,["rev-parse","HEAD"]),refs:privateGit(root,["for-each-ref","--format=%(refname) %(objectname)"]),index:readFileSync(path.join(root,".git/index")).toString("base64"),objects:privateGit(root,["cat-file","--batch-all-objects","--batch-check=%(objectname)"]).split("\n").sort()}));}
function prepare(f:ReturnType<typeof fixture>,operationId:string){const current=inspectProjectInitialization({productRoot:f.product,tool:f.toolHandle}).current;return withGenesisIdentity(()=>prepareGenesisBank({productRoot:f.product,operationId,sessionId:f.request.session.sessionId,originDigest:f.request.session.originDigest,expectedProductRevision:current.productRevision,expectedRecordsRevision:current.recordsRevision,tool:f.toolHandle})).request;}

test("false and asynchronous admission leave no orphan bank or claims and the original prepared intent remains usable",()=>{
 const f=fixture();try{
  const request=prepare(f,"refused-bank-zero"),before=facts(f),runs=()=>readdirSync(path.join(f.product,".supertaskr/runs")).sort(),old=runs();
  for(const [authorize,code] of [[()=>false,"PROJECT_BANK_POLICY_REFUSED"],[()=>Promise.resolve(true),"PROJECT_BANK_ASYNC_POLICY"]] as const){
   expect(()=>executeProjectBank(f.product,request,{tool:f.toolHandle,authorize})).toThrow(code);
   expect(readAcceptedOperation(f.product,request.operationId)).toBeNull();expect(runs()).toEqual(old);
   expect(readReservation(f.product,f.product)).toBeNull();expect(readReservation(f.product,f.records)).toBeNull();expect(facts(f)).toEqual(before);
  }
  const foreign={resource:f.records,attempt:"T-999-a1",role:"executor",at:new Date().toISOString()};takeReservation(f.product,foreign);
  try{expect(()=>executeProjectBank(f.product,request,{tool:f.toolHandle,authorize(){return true;}})).toThrow(/(?:RESOURCE_RESERVED|RESERVATION)/);expect(readAcceptedOperation(f.product,request.operationId)).toBeNull();expect(readReservation(f.product,f.product)).toBeNull();expect(readReservation(f.product,f.records)?.attempt).toBe(foreign.attempt);expect(facts(f)).toEqual(before);}
  finally{releaseReservation(f.product,foreign);}
  expect(executeProjectBank(f.product,request,{tool:f.toolHandle,authorize(){return true;}}).status).toBe("banked");
 }finally{f.cleanup();}
});

test("actual records-only bank commits one exact original intent and historical replay ignores successor binding/tool",()=>{
 const f=fixture();try{
  const request=prepare(f,"actual-bank-zero"),before=facts(f),result=executeProjectBank(f.product,request,{tool:f.toolHandle,authorize(){return true;}});
  expect(request.session.planner.selection).toMatchObject({requested:"codex/gpt-6.1-sol@subagent",harness:"codex",model:"gpt-6.1-sol"});
  expect(result).toMatchObject({status:"banked",operationId:request.operationId,stage:0,mode:"initial",completedStage:0,product:null,requestDigest:operationDigest(request)});
  expect(result.records.commit).toBe(request.plans.records.commit);expect(privateGit(f.records,["rev-parse","HEAD"])).toBe(result.records.commit);
  expect(facts(f)[0]).toEqual(before[0]);
  const rec=readAcceptedOperation(f.product,request.operationId);expect(rec.state).toBe("finished");expect(rec.operation.claims.every((claim:any)=>claim.releasedAt!==null)).toBe(true);
  const file=acceptedOperationPath(f.product,request.operationId),saved=readFileSync(file);expect(observeProjectBank(f.product,request.operationId)?.receipt).toEqual(result);expect(readFileSync(file)).toEqual(saved);
  mkdirSync(path.join(f.records,"docs/rooms"),{recursive:true});writeFileSync(path.join(f.records,"docs/rooms/later.md"),"# Later ordinary private note\n");privateGit(f.records,["add","docs/rooms/later.md"]);privateGit(f.records,["commit","-qm","Later ordinary private save fixture"]);
  writeFileSync(path.join(f.product,".supertaskr/workspace.json"),"unavailable successor binding\n");const later=facts(f);
  const replay=replayProjectBank(f.product,request.operationId,{get tool(){throw Error("historical receipt must precede current TOOL");},authorize(){throw Error("no new effect authority for history");}});
  expect(replay).toEqual(result);expect(readFileSync(file)).toEqual(saved);expect(facts(f)).toEqual(later);
 }finally{f.cleanup();}
});

export function draftQ1(f:ReturnType<typeof fixture>,turn:number=2,updated=false){
 const current=inspectProjectInitialization({productRoot:f.product,tool:f.toolHandle}).current,context={setupId:f.receipt.operationId,sessionId:f.request.session.sessionId,originDigest:f.request.session.originDigest,expectedProductRevision:current.productRevision,expectedRecordsRevision:current.recordsRevision};
 const message=updated?"A revised notes tool for one writer reviewing notes each morning.":"A notes tool for one writer reviewing notes each morning.",answer={turn,role:"user",text:message,atMs:1793318400000,genesis:{sessionId:context.sessionId,originDigest:context.originDigest}};
 const registry=f.request.input.registryCapture.path,row=JSON.parse(readFileSync(registry,"utf8"));row.sessions[0].turns=turn;writeFileSync(registry,JSON.stringify(row));appendFileSync(f.request.input.transcriptCapture.path,JSON.stringify(answer)+"\n");
 const source=readFileSync(path.join(f.records,"docs/NORTH_STAR.md"),"utf8").replace(updated?"A notes tool for one writer.":"<!-- One paragraph. What exists when this project succeeds, and for whom. -->",updated?"A revised notes tool for one writer.":"A notes tool for one writer.").replace("<!-- Who uses this, in what situation. Be concrete. -->","A writer reviewing notes each morning.");
 const files=[{path:"docs/NORTH_STAR.md",bytes:Buffer.from(source)},{path:"docs/STATE.md",bytes:Buffer.from("# State\n\nUpdated: 2026-10-30\n\n## In progress\nQ2 success.\n")}];for(const file of files)writeFileSync(path.join(f.records,file.path),file.bytes);
 const proposalId=`q1-${turn}`,answerRefs=[{turn,sha256:sha(message)}];
 writeFileSync(path.join(f.records,"docs/plans/genesis-bank-proposal.json"),JSON.stringify({version:1,...context,proposalId,stage:1,answerRefs,records:files.map(file=>({path:file.path,sha256:sha(file.bytes)}))}));
 writeFileSync(path.join(f.records,"docs/plans/genesis-product-proposal.json"),JSON.stringify({version:1,...context,proposalId,bank:"identity",answerRefs,identity:{projectName:"Fixture notes",oneLiner:message}}));
}

function draftLater(f:ReturnType<typeof fixture>,stage:2|3|4|5,turn:number){
 const observed=inspectProjectInitialization({productRoot:f.product,tool:f.toolHandle}),current=observed.current,context={setupId:f.receipt.operationId,sessionId:f.request.session.sessionId,originDigest:f.request.session.originDigest,expectedProductRevision:current.productRevision,expectedRecordsRevision:current.recordsRevision};
 const message=`Actual authored human choice for bank ${stage}.`,refs=[{turn,sha256:sha(message)}],registry=f.request.input.registryCapture.path,row=JSON.parse(readFileSync(registry,"utf8"));row.sessions[0].turns=turn;writeFileSync(registry,JSON.stringify(row));
 appendFileSync(f.request.input.transcriptCapture.path,JSON.stringify({turn,role:"user",text:message,atMs:1793318400000,genesis:{sessionId:context.sessionId,originDigest:context.originDigest}})+"\n");
 const files=[{path:"docs/STATE.md",bytes:Buffer.from(`# State\n\nUpdated: 2026-10-30\n\n## In progress\nQ${stage+1} continuation.\n`)}];
 if(stage<5){
  let source=readFileSync(path.join(f.records,"docs/NORTH_STAR.md"),"utf8");
  const field=stage===2?"Success criteria":stage===3?"Non-goals":"Hard constraints";
  source=source.replace(new RegExp(`(## ${field}\\n)[\\s\\S]*?(?=\\n## |$)`),`$1${message}\n`);files.push({path:"docs/NORTH_STAR.md",bytes:Buffer.from(source)});
 }else{
  const source=readFileSync(path.join(f.records,"docs/CONVENTIONS.md"),"utf8").replace("<!-- Exact commands. The verifier and integrator run these verbatim. -->","The explicitly selected suite is python3 -m unittest discover.");
  files.push({path:"docs/CONVENTIONS.md",bytes:Buffer.from(source)},{path:"docs/decisions/001-stack.md",bytes:Buffer.from("# ADR-001: Stack\n\nDate: 2026-10-30\nStatus: accepted\nDecided in: /plan interview\n\n## Context\nA small explicit example.\n\n## Decision\nUse Python with the selected unittest command.\n")});
 }
 for(const file of files){mkdirSync(path.dirname(path.join(f.records,file.path)),{recursive:true});writeFileSync(path.join(f.records,file.path),file.bytes);}
 const proposalId=`stage-${stage}-${turn}`;writeFileSync(path.join(f.records,"docs/plans/genesis-bank-proposal.json"),JSON.stringify({version:1,...context,proposalId,stage,answerRefs:refs,records:files.map(file=>({path:file.path,sha256:sha(file.bytes)}))}));
 if(stage===5){
  const settings:any=structuredClone(observed.settings);settings.languages=["python"];settings.suites=[{id:"python",cwd:".",sentinel:"pyproject.toml",argv:["python3","-m","unittest","discover"],solo:false,family:"unittest",why:"Explicit example suite"}];
  writeFileSync(path.join(f.records,"docs/plans/genesis-product-proposal.json"),JSON.stringify({version:1,...context,proposalId,bank:"configuration",answerRefs:refs,settings}));
 }
}

test("real later banks permit an owned Q1 update without lowering completion and Q5 commits canonical explicit settings",()=>{
 test.setTimeout(600_000);const f=fixture();try{
  const bank=(id:string)=>{const request=prepare(f,id);return {request,result:executeProjectBank(f.product,request,{tool:f.toolHandle,authorize(){return true;}})};};
  bank("progress-zero");draftQ1(f);const q1=bank("progress-q1");draftLater(f,2,3);const q2=bank("progress-q2");
  const prior=readFileSync(path.join(f.records,"docs/NORTH_STAR.md"),"utf8");draftQ1(f,4,true);const update=bank("progress-q1-update");
  expect(update.request.bank).toMatchObject({mode:"update",stage:1,completedStage:2});expect(update.request.input.latestBank?.operationId).toBe(q2.request.operationId);expect(update.request.input.ownBank?.operationId).toBe(q1.request.operationId);
  expect(update.result.completedStage).toBe(2);expect(readFileSync(path.join(f.records,"docs/NORTH_STAR.md"),"utf8")).toContain("Actual authored human choice for bank 2.");expect(prior).toContain("Actual authored human choice for bank 2.");
  draftLater(f,3,5);bank("progress-q3");draftLater(f,4,6);bank("progress-q4");draftLater(f,5,7);const q5=bank("progress-q5");
  expect(q5.result).toMatchObject({status:"banked",stage:5,mode:"initial",completedStage:5});expect(q5.request.bank.validation.prospective).not.toBeNull();
  const current=inspectProjectInitialization({productRoot:f.product,tool:f.toolHandle});expect(current.current.productRevision).toBe(q5.result.product.commit);expect(current.settings.languages).toEqual(["python"]);expect(current.settings.suites[0]?.argv).toEqual(["python3","-m","unittest","discover"]);
  expect(readAcceptedOperation(f.product,q5.request.operationId).operation.request.session).toEqual(q1.request.session);
 }finally{f.cleanup();}
});

function crashBank(f:ReturnType<typeof fixture>,operationId:string,boundary:string){
 const plan=new URL("../scripts/genesis-bank-plan.mjs",import.meta.url).href,core=new URL("../scripts/project-bank-operation.mjs",import.meta.url).href,checker=new URL("../scripts/records-check.mjs",import.meta.url).href,inspect=new URL("../scripts/genesis-init-inspect.mjs",import.meta.url).href;
 const child=spawnSync(process.execPath,["--input-type=module","-e",`
 import {prepareGenesisBank} from ${JSON.stringify(plan)};import {executeProjectBank} from ${JSON.stringify(core)};import {loadInstalledRecordTool} from ${JSON.stringify(checker)};import {inspectProjectInitialization} from ${JSON.stringify(inspect)};
 const productRoot=${JSON.stringify(f.product)},tool=loadInstalledRecordTool(${JSON.stringify(f.manifestPath)}),current=inspectProjectInitialization({productRoot,tool}).current;
 const {request}=prepareGenesisBank({productRoot,operationId:${JSON.stringify(operationId)},sessionId:${JSON.stringify(f.request.session.sessionId)},originDigest:${JSON.stringify(f.request.session.originDigest)},expectedProductRevision:current.productRevision,expectedRecordsRevision:current.recordsRevision,tool});
 executeProjectBank(productRoot,request,{tool,authorize(){return true;},onBoundary(at){if(at===${JSON.stringify(boundary)})process.exit(72);}});
 `],{encoding:"utf8",env:FIXTURE_ENV,maxBuffer:4*1024*1024,timeout:180_000});
 expect(child.status,child.stderr).toBe(72);return readAcceptedOperation(f.product,operationId);
}
function coldBank(f:ReturnType<typeof fixture>,operationId:string){
 const core=new URL("../scripts/project-bank-operation.mjs",import.meta.url).href,checker=new URL("../scripts/records-check.mjs",import.meta.url).href;
 const child=spawnSync(process.execPath,["--input-type=module","-e",`import {replayProjectBank} from ${JSON.stringify(core)};import {loadInstalledRecordTool} from ${JSON.stringify(checker)};const tool=loadInstalledRecordTool(${JSON.stringify(f.manifestPath)});process.stdout.write(JSON.stringify(replayProjectBank(${JSON.stringify(f.product)},${JSON.stringify(operationId)},{tool,authorize(){return true;}})));`],{encoding:"utf8",env:FIXTURE_ENV,maxBuffer:4*1024*1024,timeout:180_000});
 expect(child.status,child.stderr).toBe(0);return JSON.parse(child.stdout);
}

test("cold same-ID bank recovery continues a real dead owned index lock and preserves captured intent",()=>{
 const f=fixture();try{
  const before=facts(f),rec=crashBank(f,"cold-bank-index","records:index-prepared"),original=JSON.stringify(rec.operation.request),index=rec.operation.request.plans.records.working.index;
  expect(rec.operation.progress.records.stage).toBe("consumer-prepare");expect(privateGit(f.records,["rev-parse","HEAD"])).toBe(rec.operation.request.input.recordsRevision);
  expect(JSON.parse(readFileSync(`${index.path}.lock`,"utf8"))).toMatchObject({operationId:rec.operation.id,token:index.lockToken,pid:rec.operation.owner.pid});
  expect(readReservation(f.product,f.product)?.attempt).toBe(rec.attempt);expect(readReservation(f.product,f.records)?.attempt).toBe(rec.attempt);
  const file=acceptedOperationPath(f.product,rec.operation.id),bytes=readFileSync(file);expect(observeProjectBank(f.product,rec.operation.id)?.status).toBe("pending");expect(readFileSync(file)).toEqual(bytes);
  const result=coldBank(f,rec.operation.id);expect(result.records.commit).toBe(rec.operation.request.plans.records.commit);expect(existsSync(`${index.path}.lock`)).toBe(false);
  expect(JSON.stringify(readAcceptedOperation(f.product,rec.operation.id).operation.request)).toBe(original);expect(facts(f)[0]).toEqual(before[0]);
  expect(readReservation(f.product,f.product)).toBeNull();expect(readReservation(f.product,f.records)).toBeNull();
 }finally{f.cleanup();}
});

test("cold Q1 recovery retains accepted R and finishes only its original pending PRODUCT commit",()=>{
 const f=fixture();try{
  executeProjectBank(f.product,prepare(f,"cold-q1-bank-zero"),{tool:f.toolHandle,authorize(){return true;}});draftQ1(f);
  const rec=crashBank(f,"cold-q1-bank","records:ref-accepted"),request=rec.operation.request,original=JSON.stringify(request),before=facts(f);
  expect(rec.operation.progress.records.acceptance).toBeNull();expect(rec.operation.progress.product.stage).toBe("captured");
  expect(before[0]!.head).toBe(request.input.productRevision);expect(before[1]!.head).toBe(request.plans.records.commit);
  expect(observeProjectBank(f.product,rec.operation.id)?.status).toBe("pending");
  const result=coldBank(f,rec.operation.id);expect(result.records.commit).toBe(request.plans.records.commit);expect(result.product.commit).toBe(request.plans.product.commit);
  expect(privateGit(f.records,["rev-list","--count",`${request.input.recordsRevision}..HEAD`])).toBe("1");expect(privateGit(f.product,["rev-list","--count",`${request.input.productRevision}..HEAD`])).toBe("1");
  expect(JSON.stringify(readAcceptedOperation(f.product,rec.operation.id).operation.request)).toBe(original);expect(readReservation(f.product,f.product)).toBeNull();expect(readReservation(f.product,f.records)).toBeNull();
 }finally{f.cleanup();}
});

test("a foreign dead lock stays intact and ambiguous bank plans refuse without adopting its index authority",()=>{
 const f=fixture();try{
  const request=prepare(f,"foreign-lock-bank"),dead=spawnSync(process.execPath,["-e",""],{encoding:"utf8"});expect(dead.status).toBe(0);expect(()=>process.kill(dead.pid,0)).toThrow();
  const lock=`${request.plans.records.working.index.path}.lock`,bytes=JSON.stringify({operationId:"foreign-bank",token:randomUUID(),pid:dead.pid});writeFileSync(lock,bytes);const before=facts(f);
  expect(()=>executeProjectBank(f.product,request,{tool:f.toolHandle,authorize(){return true;}})).toThrow("records-save-index-locked");expect(readFileSync(lock,"utf8")).toBe(bytes);
  const rec=readAcceptedOperation(f.product,request.operationId);expect(rec.operation.progress.records.stage).toBe("consumer-prepare");expect(rec.operation.acceptance).toBeNull();expect(JSON.stringify(rec.operation.request)).toBe(JSON.stringify(request));
  expect(facts(f).map(({refs,index})=>({refs,index}))).toEqual(before.map(({refs,index})=>({refs,index})));expect(readReservation(f.product,f.records)?.attempt).toBe(rec.attempt);
  // Strict data admission closes the duplicate/malformed plan before retained
  // index lookup. No canonical row is edited to manufacture a continuation.
  const ambiguous=structuredClone(rec);ambiguous.operation.request.plans.product=structuredClone(ambiguous.operation.request.plans.records);expect(validProjectBankRecord(ambiguous)).toBe(false);
 }finally{f.cleanup();}
});

test("an equal-history successor binding at an effect boundary cannot retarget the captured bank",()=>{
 const f=fixture();try{
  const request=prepare(f,"rebound-bank"),successor=path.join(f.dir,"successor-records");cpSync(f.records,successor,{recursive:true});const before=facts(f),successorHead=privateGit(successor,["rev-parse","HEAD"]),successorIndex=readFileSync(path.join(successor,".git/index"));
  expect(()=>executeProjectBank(f.product,request,{tool:f.toolHandle,authorize(){return true;},onBoundary(at){if(at==="before:records:objects"){const file=path.join(f.product,".supertaskr/workspace.json"),binding=JSON.parse(readFileSync(file,"utf8"));writeFileSync(file,JSON.stringify({...binding,recordsRoot:successor}));}}})).toThrow(/genesis-init-current-receipt-required|genesis-bank-policy-context-changed/);
  const rec=readAcceptedOperation(f.product,request.operationId);expect(rec.operation.progress.records.stage).toBe("captured");expect(rec.operation.acceptance).toBeNull();expect(facts(f)).toEqual(before);
  expect(privateGit(successor,["rev-parse","HEAD"])).toBe(successorHead);expect(readFileSync(path.join(successor,".git/index"))).toEqual(successorIndex);expect(readReservation(f.product,successor)).toBeNull();
 }finally{f.cleanup();}
});

test("accepted cold history returns its exact receipt while preserving a later foreign index lock",()=>{
 const f=fixture();try{
  const rec=crashBank(f,"accepted-bank-foreign-lock","records:ref-accepted"),index=rec.operation.request.plans.records.working.index,lock=`${index.path}.lock`;
  // The original process has actually ceased. A separate later lock replaces
  // its old inode; accepted historical cleanup must preserve that new owner.
  unlinkSync(lock);const bytes=JSON.stringify({operationId:"later-owner",token:randomUUID(),pid:process.pid});writeFileSync(lock,bytes);
  const before=facts(f),result=coldBank(f,rec.operation.id);expect(result).toMatchObject({status:"banked",records:{commit:rec.operation.request.plans.records.commit},cleanupWarnings:[{role:"records",code:"PROJECT_BANK_ACCEPTED_LOCK_UNAVAILABLE"}]});
  expect(readFileSync(lock,"utf8")).toBe(bytes);expect(facts(f)).toEqual(before);expect(readReservation(f.product,f.product)).toBeNull();expect(readReservation(f.product,f.records)).toBeNull();
 }finally{f.cleanup();}
});

test("R-only and Q1 banks preserve unrelated staged and working bytes in both repositories",()=>{
 const f=fixture();try{
  const pFile="unrelated.txt",rFile="docs/rooms/unrelated.md";mkdirSync(path.dirname(path.join(f.records,rFile)),{recursive:true});
  for(const [root,file] of [[f.product,pFile],[f.records,rFile]]){writeFileSync(path.join(root!,file!),"staged unrelated content\n");privateGit(root!,["add","--",file!]);writeFileSync(path.join(root!,file!),"unstaged unrelated content\n");}
  const staged=[f.product,f.records].map((root,i)=>privateGit(root,["ls-files","--stage","--",i===0?pFile:rFile])),before=facts(f);
  executeProjectBank(f.product,prepare(f,"preserve-bank-zero"),{tool:f.toolHandle,authorize(){return true;}});expect(facts(f)[0]).toEqual(before[0]);draftQ1(f);
  const request=prepare(f,"preserve-q1"),result=executeProjectBank(f.product,request,{tool:f.toolHandle,authorize(){return true;}});expect(result.product.commit).toBe(request.plans.product!.commit);
  for(const [i,root] of [f.product,f.records].entries()){const file=i===0?pFile:rFile;expect(privateGit(root,["ls-files","--stage","--",file])).toBe(staged[i]);expect(privateGit(root,["ls-tree","HEAD","--",file])).toBe("");expect(readFileSync(path.join(root,file),"utf8")).toBe("unstaged unrelated content\n");}
 }finally{f.cleanup();}
});

test("real bank0 then Q1 commits exact R before its finite PRODUCT adapter commit with original session provenance",()=>{
 const f=fixture();try{
  const first=prepare(f,"sequential-bank-zero"),zero=executeProjectBank(f.product,first,{tool:f.toolHandle,authorize(){return true;}});draftQ1(f);
  const request=prepare(f,"sequential-q1"),before=facts(f),boundaries:string[]=[];
  expect(request.input.latestBank?.operationId).toBe(first.operationId);expect(request.input.ownBank).toBeNull();expect(request.bank.completedStage).toBe(1);
  const result=executeProjectBank(f.product,request,{tool:f.toolHandle,authorize(){return true;},onBoundary(boundary){boundaries.push(boundary);if(boundary==="product:objects-start")expect(privateGit(f.records,["rev-parse","HEAD"])).toBe(request.plans.records.commit);}});
  expect(result).toMatchObject({status:"banked",stage:1,mode:"initial",completedStage:1});expect(result.records.previousRevision).toBe(zero.records.commit);
  expect(result.product?.commit).toBe(request.plans.product!.commit);expect(privateGit(f.product,["rev-parse","HEAD"])).toBe(result.product!.commit);
  expect(boundaries.indexOf("records:ref-accepted")).toBeLessThan(boundaries.indexOf("product:objects-start"));
  expect(privateGit(f.product,["diff","--name-only",before[0]!.head,"HEAD"]).split("\n").sort()).toEqual(["AGENTS.md","CLAUDE.md"]);
  expect(readFileSync(path.join(f.product,"AGENTS.md"),"utf8")).toContain("# Fixture notes\n");
  expect(readAcceptedOperation(f.product,request.operationId).operation.request.session).toEqual(request.session);
 }finally{f.cleanup();}
});
