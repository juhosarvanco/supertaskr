import path from "node:path";
import os from "node:os";
import {readFileSync} from "node:fs";
import {Worker} from "node:worker_threads";
import {expect,test} from "@playwright/test";
import {validQualifiedIntegrationObservations,validQualifiedIntegrationWorkerResult} from "../scripts/qualified-integration-record.mjs";
import {privateRecordFixture,privateGit} from "./private-record-fixture";

test("actual installed planned worker drains a named refusal before natural thread exit without creating an operation",async()=>{
 const f=privateRecordFixture();try{
  const before=()=>[f.product,f.records].map(root=>({refs:privateGit(root,["for-each-ref","--format=%(refname) %(objectname)"]),index:readFileSync(path.join(root,".git/index")).toString("base64"),objects:privateGit(root,["count-objects","-v"])})),original=before();
  const worker=new Worker(path.join(f.tool,"dist/tools/e2e/scripts/qualified-integration-worker.mjs"),{execArgv:[],workerData:{version:1,root:f.product,operationId:"uncreated-worker-operation",token:"launch-00000000-0000-0000-0000-000000000001"},stdout:true,stderr:true});
  let output="",errors="",messages=0;worker.stdout.on("data",bytes=>{output+=bytes.toString("utf8");});worker.stderr.on("data",bytes=>{errors+=bytes.toString("utf8");});worker.on("message",()=>{messages+=1;});
  const exit=await new Promise<number>((resolve,reject)=>{worker.once("error",reject);worker.once("exit",resolve);});
  expect(exit).toBe(1);expect(errors).toMatch(/^QUALIFIED_INTEGRATION_GRADE_REQUIRED: actual planned grading is unavailable\n$/);expect(output).toBe("");expect(messages).toBe(0);expect(before()).toEqual(original);
 }finally{f.cleanup();}
});

test("unaccepted artifact observation data belongs only to its original known-dead launch",()=>{
 // Format-only data: no process, workspace, file, operation or grade exists.
 const workspace={path:path.join(os.tmpdir(),"uncreated-integration-stage")},startedAt="2026-10-30T10:00:00.000Z",observedAt="2026-10-30T10:01:00.000Z";
 const launch={sequence:1,workspaceSequence:1,startedAt,result:{kind:"observed-dead",observedAt}};
 const observation={sequence:1,launchSequence:1,observedAt,kind:"unaccepted-artifact",artifact:{path:path.join(workspace.path,"result-1.json"),device:"0",inode:"1",fileMode:0o600,byteLength:42,sha256:"a".repeat(64)}};
 expect(validQualifiedIntegrationObservations([observation],[workspace],[launch])).toBe(true);
 expect(validQualifiedIntegrationObservations([observation],[workspace],[{...launch,result:null}])).toBe(false);
 expect(validQualifiedIntegrationObservations([observation],[workspace],[{...launch,result:{kind:"exited",exit:0}}])).toBe(false);
 const worker={kind:"thread-exited",threadId:1,exit:0,finishedAt:observedAt,artifact:observation.artifact,rowDigest:`sha256:${"b".repeat(64)}`};
 expect(validQualifiedIntegrationWorkerResult(worker,workspace,1)).toBe(true);
 expect(validQualifiedIntegrationWorkerResult(worker,null,1)).toBe(false);
 expect(validQualifiedIntegrationWorkerResult({...worker,exit:1},workspace,1)).toBe(true);
 expect(validQualifiedIntegrationObservations([observation],[workspace],[{...launch,workerResult:worker}])).toBe(false);
 for(const mutate of [(w:any)=>{w.threadId=0;},(w:any)=>{w.exit=3;},(w:any)=>{w.artifact.path=path.join(workspace.path,"result-2.json");},(w:any)=>{w.kind="exited";}]){
  const changed=structuredClone(worker);mutate(changed);expect(validQualifiedIntegrationWorkerResult(changed,workspace,1)).toBe(false);
 }
 expect(validQualifiedIntegrationObservations([observation,{...observation,sequence:2}],[workspace],[launch])).toBe(false);
 for(const mutate of [
  (o:any)=>{o.launchSequence=2;},(o:any)=>{o.artifact.path=path.join(workspace.path,"result-2.json");},
  (o:any)=>{o.kind="accepted";},(o:any)=>{o.observedAt="2026-10-30T09:59:00.000Z";},
  (o:any)=>{o.artifact.fileMode=0o644;},(o:any)=>{o.artifact.sha256="unknown";},(o:any)=>{o.grade="GREEN";}
 ]){const changed=structuredClone(observation);mutate(changed);expect(validQualifiedIntegrationObservations([changed],[workspace],[launch])).toBe(false);}
});
