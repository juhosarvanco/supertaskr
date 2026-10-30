/** Actual configured finalized pair for new delivery controls. Native transport
 * frames/reviewer prose are authored fixture data; every P/R grade executes its
 * real canonical producer. No model or later integration writer is claimed. */
import {spawnSync} from "node:child_process";
import {readFileSync,writeFileSync} from "node:fs";
import path from "node:path";
import {expect} from "@playwright/test";
import {configuredVerificationFixture} from "./configured-verification-fixture";
import {privateGit,putPrivate,sha} from "./private-record-fixture";

export async function configuredDeliveryFixture(){
 const f=await configuredVerificationFixture({review:"independent"});
 try{
  const [grade,delivery,configured,hook,admission]=await Promise.all(["configured-dispatch-grade","qualified-delivery","configured-dispatch","fixed-product-hook","qualified-admission"].map(name=>import(f.module(name))));
  const prepared=await f.review.prepareQualifiedVerification(f.product,{attempt:f.attempt,assignment:f.verifier,candidate:JSON.stringify(f.candidates)});
  const attack=path.join(f.dir,"delivery-attacks.md");putPrivate(f.dir,"delivery-attacks.md","Inspect actual original configured suites, exact whole candidate outputs and canonical private records.\n");
  const sealed=await f.review.sealQualifiedVerification(f.product,{executorAttempt:f.attempt,preparationDigest:prepared.preparation.digest,attackSetFile:attack});
  const selected=prepared.assignment,assignmentFile=path.join(f.dir,"delivery-verifier.json");putPrivate(f.dir,"delivery-verifier.json",JSON.stringify(selected));
  const started=f.start(assignmentFile);expect(started.status,started.stdout+started.stderr).toBe(0);const attempt=JSON.parse(started.stdout).attempt;
  const event=(name:string,id:string,command:string)=>({hook_event_name:name,agent_id:"delivery-fixture-verifier",session_id:selected.native.sessionId,turn_id:"delivery-fixture-verifier-turn",tool_name:"Bash",tool_use_id:id,tool_input:{command}});
  expect(f.native.handleNativeEvent(f.product,event("SubagentStart","start","")).disposition).toBe("start-recorded");
  expect(f.native.handleNativeEvent(f.product,event("PreToolUse","probe",f.native.NATIVE_IDENTITY_PROBE)).disposition).toBe("identity-probe-pre");
  expect(f.native.handleNativeEvent(f.product,{...event("PostToolUse","probe",f.native.NATIVE_IDENTITY_PROBE),tool_response:"delivery-fixture-verifier"}).disposition).toBe("identity-probe-post");
  f.runs.bindRun(f.product,{attempt,harnessId:"delivery-fixture-verifier"});
  const productGrade=grade.runConfiguredDispatchGrade(await grade.captureConfiguredDispatchGradeAuthority(f.product,attempt,{tool:f.toolHandle}));
  expect(productGrade).toMatchObject({code:0,capture:{complete:true},reading:{exit:0},tokenWritten:false});
  const authority=prepared.preparation.authority;
  function recordsGrade(commit:string){
   const worker=authority.workers.find((w:any)=>w.role==="records"),identity=f.review.qualifiedOutputIdentity(authority,worker,commit),testFile=path.join(f.dir,"canonical-private-grade.test.mjs");
   const source=`import test from 'node:test';import assert from 'node:assert/strict';import {loadInstalledRecordTool,createRecordChecker} from ${JSON.stringify(f.module("records-check"))};import {loadProjectSettings} from ${JSON.stringify(f.module("project-settings"))};test('exact original canonical private validation',()=>{const tool=loadInstalledRecordTool(),settings=loadProjectSettings({productRoot:${JSON.stringify(f.product)},productRevision:${JSON.stringify(f.revisions.product)},tool});assert.equal(settings.status,'ready');const checker=createRecordChecker({profile:settings.settings.records.validation,tool}),result=checker.evaluate(checker.capture({productRoot:${JSON.stringify(f.product)},productRevision:${JSON.stringify(f.revisions.product)},recordsRevision:${JSON.stringify(commit)}}),[]);assert.equal(result.accepted,true,JSON.stringify({blocking:result.blocking,retained:result.retained}));});\n`;
   writeFileSync(testFile,source);const argv=["--test",testFile],ran=spawnSync(process.execPath,argv,{cwd:f.dir,encoding:"utf8",maxBuffer:4*1024*1024});
   expect(ran.status,ran.stdout+ran.stderr).toBe(0);expect(ran.stdout).toMatch(/# tests 1\b/);
   const output=ran.stdout+ran.stderr+`\ngate-verdict suite=canonical-private exit=${ran.status} bodies=1 targets=1 ref=${commit} verdict=GREEN\n`;
   return {role:"records",commit,tree:identity.tree,projectionDigest:identity.projectionDigest,exit:ran.status,bodies:1,command:JSON.stringify({cwd:f.dir,argv:[process.execPath,...argv]}),output,outputDigest:sha(output)};
  }
  const run=f.runs.readRecord(f.product,attempt),payload={preparationDigest:prepared.preparation.digest,sealDigest:sealed.seal.digest,candidates:f.candidates,
   criteria:[{criterion:1,evidence:"Actual original configured Python suite and canonical private validator passed at these exact candidate identities."}],
   frame:{agentId:"delivery-fixture-verifier",taskName:run.native.launch.taskName,sessionId:run.native.launch.sessionId,requestedModel:run.assignment.model,requestedEffort:run.assignment.effort,observed:run.execution.observed,
    limitations:"Authored controlled native frames and review prose; actual canonical suite/check children; no model execution or live harness claim."},corrections:[],grades:[productGrade.reading,recordsGrade(f.candidates.records!)]};
  const command=`cd -- ${f.native.nativeShellQuote(f.bench.product)} && true`;
  expect(f.native.handleNativeEvent(f.product,event("PreToolUse","verdict",command)).disposition).toBe("pre-admitted");
  const card=authority.card.path,original=readFileSync(path.join(f.bench.records,card),"utf8");
  putPrivate(f.bench.records,card,`${original}\n### 2026-10-30 — APPROVED — controlled fixture verifier\n\nActual configured checks at exact candidates.\n\n\x60\x60\x60qualified-verdict\n${JSON.stringify(payload)}\n\x60\x60\x60\n`);
  privateGit(f.bench.records,["add",card]);privateGit(f.bench.records,["commit","-qm","Actual private verifier protocol output"]);
  expect(f.native.handleNativeEvent(f.product,event("PostToolUse","verdict",command)).disposition).toBe("post-clean");
  const refs={product:privateGit(f.bench.product,["rev-parse","HEAD"]),records:privateGit(f.bench.records,["rev-parse","HEAD"])};
  const own={preparationDigest:prepared.preparation.digest,sealDigest:sealed.seal.digest,refs,grades:[productGrade.reading,recordsGrade(refs.records)]};
  expect(f.runs.observeRun(f.product,{attempt,evidence:`Actual canonical children retained with authored final transport.\n\x60\x60\x60qualified-output-grades\n${JSON.stringify(own)}\n\x60\x60\x60\nRUN-DONE ok`}).record.state).toBe("finished");
  expect((await f.runs.collectRun(f.product,{attempt,ref:JSON.stringify(refs)})).record.native.qualified.collection.phase).toBe("final");
  const final=await delivery.captureQualifiedDeliveryAuthority(f.product,{executorAttempt:f.attempt,verifierAttempt:attempt});
  const source=await configured.captureConfiguredDispatchForRun(f.product,attempt,{tool:f.toolHandle});
  const installedHook=hook.renderFixedProductPrePush({productRoot:f.product,tool:f.toolHandle});writeFileSync(path.join(f.product,".git/hooks/pre-push"),installedHook.bytes,{mode:0o700});
  const input={operationId:"configured-planned-delivery",executorAttempt:f.attempt,verifierAttempt:attempt,targets:{product:{ref:"refs/heads/main",expectedRevision:privateGit(f.product,["rev-parse","HEAD"])},records:{ref:"refs/heads/main",expectedRevision:privateGit(f.records,["rev-parse","HEAD"])}}};
  return {...f,tool:f.toolHandle,authority:final,verifierAttempt:attempt,source,input,prepared,sealed,admission,grade};
 }catch(error){f.cleanup();throw error;}
}
