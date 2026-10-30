import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { parseAssignment, readAssignment } from "../scripts/run-record.mjs";
import { measureQualifiedWorker } from "../scripts/qualified-reservation.mjs";
import { CONFIGURED_NATIVE_EFFORTS, validConfiguredArmExecution } from "../scripts/configured-dispatch-record.mjs";
import { privateRecordFixture, privateGit, putPrivate } from "./private-record-fixture";

test("canonical backend and file assignment parsing preserve actual trailing-space worker and brief identities",()=>{
 const f=privateRecordFixture();
 try{
  const code=(action:()=>unknown)=>{try{action();return "not-refused";}catch(error){return (error as {code?:string}).code;}};
  const worker=path.join(f.dir,"native-worker  "),brief=path.join(f.dir,"actual-brief  "),file=path.join(f.dir,"assignment  ");
  privateGit(f.product,["worktree","add","-q","-b","native-space-worker",worker,"HEAD"]);putPrivate(f.dir,"actual-brief  ","# Exact original brief\n");
  const input={kind:"card",id:"T-900",role:"executor",resource:worker,cwd:worker,harness:"codex-desktop-native",model:"gpt-6-luna",effort:"medium",base:privateGit(worker,["rev-parse","HEAD"]),brief,deadline:"none",budget:"none",native:{taskName:"/root/space-worker",sessionId:"original-session",coordinatorTurnId:"original-turn",ignoredOutputs:[]}};
  putPrivate(f.dir,"assignment  ",JSON.stringify(input));const parsed=readAssignment(file);
  expect(parsed).toEqual(parseAssignment(input));expect(parsed.resource).toBe(worker);expect(parsed.cwd).toBe(worker);expect(parsed.brief).toBe(brief);
  expect(measureQualifiedWorker(parsed.resource).filesystemRoot).toBe(worker);expect(readFileSync(parsed.brief,"utf8")).toBe("# Exact original brief\n");
  // Legacy dial trimming stays unchanged; the new bounded selector below is
  // separate from the old general assignment reader's declared compatibility.
  expect(parseAssignment({...input,effort:" high "}).effort).toBe("high");
  for(const field of ["resource","cwd","brief"])expect(code(()=>parseAssignment({...input,[field]:input[field as keyof typeof input]+"\n"}))).toBe("ASSIGNMENT_PATH");
  expect(code(()=>parseAssignment({...input,effort:""}))).toBe("ASSIGNMENT_INCOMPLETE");expect(code(()=>parseAssignment({...input,program:"caller-command"}))).toBe("ASSIGNMENT_UNKNOWN_FIELD");
  const unsafe=parseAssignment({...input,resource:worker+"/../"});expect(unsafe.resource).toBe(worker+"/../");expect(()=>measureQualifiedWorker(unsafe.resource)).toThrow(/qualified-/);
 }finally{f.cleanup();}
});

test("new native launch selectors require explicit finite effort deadline and token-budget data",()=>{
 for(const effort of CONFIGURED_NATIVE_EFFORTS)for(const limits of [{deadline:"none",budget:"none"},{deadline:"2026-12-01T12:00:00.000Z",budget:"8000"}])expect(validConfiguredArmExecution({effort,...limits})).toBe(true);
 const good={effort:"medium",deadline:"none",budget:"none"};
 for(const value of [null,{}, {...good,effort:""},{...good,effort:"not configured"},{...good,effort:" high "},{...good,effort:"account-default"},{...good,deadline:"tomorrow"},{...good,deadline:"2026-02-30T12:00:00.000Z"},{...good,budget:"0"},{...good,budget:"-1"},{...good,budget:"8000 tokens"},{...good,budget:"08000"},{...good,program:"true"},{...good,model:"gpt-6.1-sol"}])expect(validConfiguredArmExecution(value)).toBe(false);
});
