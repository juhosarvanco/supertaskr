import {spawnSync} from "node:child_process";
import {readFileSync,writeFileSync,mkdirSync,renameSync} from "node:fs";
import path from "node:path";
import {pathToFileURL} from "node:url";
import {expect,test} from "@playwright/test";
import {bankSchemaFixture} from "./project-bank-fixture";
import {withGenesisIdentity} from "./genesis-init-fixture";
import {FIXTURE_ENV,privateGit,sha} from "./private-record-fixture";
import {executeInitializationProtocol} from "../scripts/genesis-init-command.mjs";
import {inspectProjectInitialization} from "../scripts/genesis-init-inspect.mjs";
import {prepareGenesisBank} from "../scripts/genesis-bank-plan.mjs";
import {executeProjectBank} from "../scripts/project-bank-operation.mjs";
import {acceptedOperationPath,readAcceptedOperation} from "../scripts/durable-operation.mjs";

test.setTimeout(240_000);
function fixture(){const f=bankSchemaFixture(true),file=f.request.input.registryCapture.path,registry=JSON.parse(readFileSync(file,"utf8"));registry.sessions[0].native_session_id="11111111-2222-4333-8444-555555555555";writeFileSync(file,JSON.stringify(registry));return f;}
function input(f:ReturnType<typeof fixture>,operationId="bank-protocol-zero"){
 const current=inspectProjectInitialization({productRoot:f.product,tool:f.toolHandle}).current;
 return {version:1,requestId:"native-bank-request",operation:"bank",productRoot:f.product,operationId,sessionId:f.request.session.sessionId,originDigest:f.request.session.originDigest,expectedProductRevision:current.productRevision,expectedRecordsRevision:current.recordsRevision};
}
const query=(f:ReturnType<typeof fixture>,operation:"banks"|"bank-replay",operationId?:string)=>({version:1,requestId:`native-${operation}`,operation,productRoot:f.product,...(operationId?{operationId}:{})});
const call=(f:ReturnType<typeof fixture>,request:any)=>withGenesisIdentity(()=>executeInitializationProtocol(request,{manifestPath:f.manifestPath}));
function installed(f:ReturnType<typeof fixture>,request:any){
 const child=spawnSync(process.execPath,[path.join(f.tool,"dist/tools/e2e/scripts/genesis-init-command.mjs"),"--stdio"],{input:JSON.stringify(request),encoding:"utf8",env:FIXTURE_ENV,maxBuffer:4*1024*1024,timeout:180_000});
 expect(child.status,child.stderr+child.stdout).toBe(0);return JSON.parse(child.stdout);
}
function capturedChild(f:ReturnType<typeof fixture>,wire:ReturnType<typeof input>){
 const script=(name:string)=>pathToFileURL(path.join(f.tool,"dist/tools/e2e/scripts",name+".mjs")).href;
 const child=spawnSync(process.execPath,["--input-type=module","-e",`import {readFileSync} from 'node:fs';import {prepareGenesisBank} from ${JSON.stringify(script("genesis-bank-plan"))};import {executeProjectBank} from ${JSON.stringify(script("project-bank-operation"))};import {loadInstalledRecordTool} from ${JSON.stringify(script("records-check"))};const {version,requestId,operation,...data}=JSON.parse(readFileSync(0,'utf8')),tool=loadInstalledRecordTool();const {request}=prepareGenesisBank({...data,tool});executeProjectBank(data.productRoot,request,{tool,authorize(){return true;},onBoundary(at){if(at==='captured')process.exit(72);}});`],{input:JSON.stringify(wire),encoding:"utf8",env:FIXTURE_ENV,maxBuffer:4*1024*1024,timeout:180_000});
 expect(child.status,child.stderr+child.stdout).toBe(72);return readAcceptedOperation(f.product,wire.operationId).operation.request;
}

test("fixed installed-layout bank stdin commits original configured Codex intent and returns historical receipt before current TOOL",()=>{
 const f=fixture();try{
  const request=input(f),before=privateGit(f.product,["for-each-ref","--format=%(refname) %(objectname)"]);
  for(const extra of [{recordsRoot:f.records},{program:"arbitrary"},{tool:f.toolHandle},{plans:f.request.plans},{settings:{}}]){
   expect(call(f,{...request,...extra})).toMatchObject({ok:false,error:{code:"genesis-init-protocol-request",state:"refused"}});expect(readAcceptedOperation(f.product,request.operationId)).toBeNull();
  }
  const reply=installed(f,request);expect(reply).toMatchObject({version:1,requestId:request.requestId,ok:true,result:{status:"banked",stage:0,mode:"initial",completedStage:0,product:null}});
  const file=acceptedOperationPath(f.product,request.operationId),bytes=readFileSync(file),original=readAcceptedOperation(f.product,request.operationId).operation.request;
  expect(original.session.planner.selection).toMatchObject({harness:"codex",requested:"codex/gpt-6.1-sol@subagent",model:"gpt-6.1-sol"});expect(privateGit(f.product,["for-each-ref","--format=%(refname) %(objectname)"])).toBe(before);
  const discovery=installed(f,query(f,"banks"));expect(discovery.result.banks).toHaveLength(1);expect(discovery.result.banks[0]).toMatchObject({operationId:request.operationId,state:"banked",originStatus:"matched",receipt:reply.result});expect(readFileSync(file)).toEqual(bytes);
  expect(JSON.stringify(discovery)).not.toMatch(/base64|transcript|executable|commitBase64/);
  writeFileSync(f.manifestPath,"unavailable current TOOL\n");writeFileSync(path.join(f.product,".supertaskr/workspace.json"),"unavailable current binding\n");writeFileSync(path.join(f.records,"docs/plans/genesis-bank-proposal.json"),"a successor working proposal must not replace accepted intent\n");
  expect(installed(f,query(f,"bank-replay",request.operationId)).result).toEqual(reply.result);expect(installed(f,request).result).toEqual(reply.result);expect(installed(f,query(f,"banks")).result.banks[0].receipt).toEqual(reply.result);expect(readFileSync(file)).toEqual(bytes);
  expect(executeInitializationProtocol({...request,sessionId:"successor-session"},{manifestPath:path.join(f.dir,"absent-tool")})).toMatchObject({ok:false,error:{code:"genesis-bank-operation-changed",state:"unknown",operationId:request.operationId}});
 }finally{f.cleanup();}
});

test("pending bank discovery is read-only and fixed replay uses the same captured intent without new proposal capture",()=>{
 const f=fixture();try{
  const wire=input(f,"pending-bank-protocol"),request=capturedChild(f,wire);
  const file=acceptedOperationPath(f.product,wire.operationId),bytes=readFileSync(file),discovery=call(f,query(f,"banks"));expect(discovery).toMatchObject({ok:true,result:{banks:[{operationId:wire.operationId,state:"pending",originStatus:"matched",phase:{records:"captured",product:"not-required"}}]}});expect(readFileSync(file)).toEqual(bytes);
  expect(call(f,{...wire,expectedRecordsRevision:"f".repeat(40)})).toMatchObject({ok:false,error:{code:"genesis-bank-operation-changed",state:"unknown",operationId:wire.operationId}});expect(readFileSync(file)).toEqual(bytes);
  const absent=executeInitializationProtocol(query(f,"bank-replay","never-captured"),{manifestPath:path.join(f.dir,"absent-tool")});expect(absent).toMatchObject({ok:false,error:{code:"PROJECT_BANK_ABSENT",state:"unknown",operationId:"never-captured"}});expect(readAcceptedOperation(f.product,"never-captured")).toBeNull();
  const reply=installed(f,query(f,"bank-replay",wire.operationId));expect(reply.result.records.commit).toBe(request.plans.records.commit);expect(readAcceptedOperation(f.product,wire.operationId).operation.request).toEqual(request);
 }finally{f.cleanup();}
});

test("bank discovery never skips malformed owned namespace or rebinds missing original RECORDS",()=>{
 const f=fixture();try{
  const wire=input(f,"discovery-bank"),{version:_version,requestId:_requestId,operation:_operation,...data}=wire,request=withGenesisIdentity(()=>prepareGenesisBank({...data,tool:f.toolHandle})).request;
  expect(()=>executeProjectBank(f.product,request,{tool:f.toolHandle,authorize(){return true;},onBoundary(at){if(at==="captured")throw Error("ordinary discovery stop");}})).toThrow("ordinary discovery stop");
  const file=acceptedOperationPath(f.product,wire.operationId),bytes=readFileSync(file),held=path.join(f.dir,"held-original-notes");renameSync(f.records,held);
  const unavailable=call(f,query(f,"banks"));expect(unavailable).toMatchObject({ok:true,result:{banks:[{operationId:wire.operationId,state:"unavailable",originStatus:"unavailable",origin:{records:{root:{path:f.records}}}}]}});if(!unavailable.ok)throw Error(JSON.stringify(unavailable));expect(unavailable.result.banks[0]).not.toHaveProperty("receipt");expect(readFileSync(file)).toEqual(bytes);
  renameSync(held,f.records);mkdirSync(path.join(f.product,".supertaskr/runs/OP-malformed"));expect(call(f,query(f,"banks"))).toMatchObject({ok:false,error:{code:"OPERATION_RECORD"}});expect(readFileSync(file)).toEqual(bytes);
 }finally{f.cleanup();}
});

test("fixed bank execution requires each directly executed service owner in the installed manifest before preparation",()=>{
 const f=fixture();try{
  const wire=input(f,"owner-bank"),original=readFileSync(f.manifestPath,"utf8"),before=privateGit(f.product,["for-each-ref","--format=%(refname) %(objectname)"]);
  for(const owner of ["genesis-bank-inspect","genesis-bank-plan","project-bank-operation"]){
   const manifest=JSON.parse(original);manifest.runtime.files=manifest.runtime.files.filter((row:any)=>row.path!==`tools/e2e/scripts/${owner}.mjs`);manifest.runtime.buildHash=sha(JSON.stringify(manifest.runtime.files));writeFileSync(f.manifestPath,JSON.stringify(manifest));
   expect(call(f,wire)).toMatchObject({ok:false,error:{code:"records-tool-runtime-member-required",state:"refused"}});expect(readAcceptedOperation(f.product,wire.operationId)).toBeNull();
  }
  writeFileSync(f.manifestPath,original);expect(call(f,{version:1,requestId:"restored",operation:"inspect",productRoot:f.product})).toMatchObject({ok:true,result:{status:"current"}});expect(privateGit(f.product,["for-each-ref","--format=%(refname) %(objectname)"])).toBe(before);
 }finally{f.cleanup();}
});
