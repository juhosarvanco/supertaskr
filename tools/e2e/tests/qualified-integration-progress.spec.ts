import path from "node:path";
import os from "node:os";
import {expect,test} from "@playwright/test";
import {validQualifiedIntegrationObservations,validQualifiedIntegrationWorkerResult} from "../scripts/qualified-integration-record.mjs";

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
