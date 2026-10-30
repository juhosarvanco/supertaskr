import path from "node:path";
import {chmodSync,existsSync,readFileSync,writeFileSync} from "node:fs";
import {expect,test} from "@playwright/test";
import {captureOperationRepository,withOperationRepositoryObservation} from "../scripts/durable-operation.mjs";
import {privateRecordFixture,privateGit} from "./private-record-fixture";

test("a synchronous repository observation returns detached facts and cannot retain caller mutations",()=>{
 const f=privateRecordFixture();try{
  const base=privateGit(f.product,["rev-parse","HEAD"]),original=captureOperationRepository(f.product,base),index=readFileSync(path.join(f.product,".git/index"));
  const result=withOperationRepositoryObservation(()=>{
   const first=captureOperationRepository(f.product,base);first.identities[0]!.inode="caller-mutated-copy";
   const second=captureOperationRepository(f.product,base);expect(second).toEqual(original);return second;
  });
  expect(result).toEqual(original);expect(readFileSync(path.join(f.product,".git/index"))).toEqual(index);expect(privateGit(f.product,["rev-parse","HEAD"])).toBe(base);
 }finally{f.cleanup();}
});

test("the uncached exit audit refuses a newly active hook before an observation can return",()=>{
 const f=privateRecordFixture();try{
  const base=privateGit(f.product,["rev-parse","HEAD"]),hook=path.join(f.product,".git/hooks/pre-push"),marker=path.join(f.dir,"hook-must-not-run");
  expect(()=>withOperationRepositoryObservation(()=>{
   captureOperationRepository(f.product,base);
   // Controlled external-configuration change during assembly. No product
   // writer is invoked; the original hook bytes must remain unexecuted.
   writeFileSync(hook,`#!/bin/sh\nprintf ran > '${marker}'\n`,{mode:0o700});chmodSync(hook,0o700);
   captureOperationRepository(f.product,base);return "must not escape";
  })).toThrow("OPERATION_ACTIVE_HOOK");
  expect(existsSync(marker)).toBe(false);expect(existsSync(hook)).toBe(true);expect(()=>captureOperationRepository(f.product,base)).toThrow("OPERATION_ACTIVE_HOOK");
 }finally{f.cleanup();}
});

test("effect and observation modes remain distinct and failed generic captures create no allowance",()=>{
 const f=privateRecordFixture();try{
  const base=privateGit(f.product,["rev-parse","HEAD"]),hook=path.join(f.product,".git/hooks/pre-push");writeFileSync(hook,"#!/bin/sh\nexit 0\n",{mode:0o700});chmodSync(hook,0o700);
  const observed=withOperationRepositoryObservation(()=>{
   const first=captureOperationRepository(f.product,base,{forEffect:false});
   expect(()=>captureOperationRepository(f.product,base)).toThrow("OPERATION_ACTIVE_HOOK");
   return first;
  });
  expect(observed.root).toBe(f.product);expect(()=>captureOperationRepository(f.product,base)).toThrow("OPERATION_ACTIVE_HOOK");
 }finally{f.cleanup();}
});

test("strict facts may serve a read-only observation while the exit audit remains strict",()=>{
 const f=privateRecordFixture();try{
  const base=privateGit(f.product,["rev-parse","HEAD"]),original=captureOperationRepository(f.product,base),hook=path.join(f.product,".git/hooks/pre-push");
  expect(withOperationRepositoryObservation(()=>{
   captureOperationRepository(f.product,base);
   const read=captureOperationRepository(f.product,base,{forEffect:false});read.identities[0]!.inode="caller-copy";
   return captureOperationRepository(f.product,base,{forEffect:false});
  })).toEqual(original);
  let observed=false;
  expect(()=>withOperationRepositoryObservation(()=>{
   captureOperationRepository(f.product,base);
   writeFileSync(hook,"#!/bin/sh\nexit 0\n",{mode:0o700});chmodSync(hook,0o700);
   expect(captureOperationRepository(f.product,base,{forEffect:false})).toEqual(original);observed=true;
  })).toThrow("OPERATION_ACTIVE_HOOK");
  expect(observed).toBe(true);expect(existsSync(hook)).toBe(true);
 }finally{f.cleanup();}
});

test("async nested and exceptional reads leave no open repository observation",()=>{
 const f=privateRecordFixture();try{
  const base=privateGit(f.product,["rev-parse","HEAD"]),original=captureOperationRepository(f.product,base);let invoked=false;
  expect(()=>withOperationRepositoryObservation(async()=>{invoked=true;})).toThrow("OPERATION_OBSERVATION_ASYNC");expect(invoked).toBe(false);
  expect(()=>withOperationRepositoryObservation(()=>Promise.resolve(1))).toThrow("OPERATION_OBSERVATION_ASYNC");
  expect(()=>withOperationRepositoryObservation(()=>{try{withOperationRepositoryObservation(()=>1);}catch{ /* an outer scope still refuses */ }})).toThrow("OPERATION_OBSERVATION_NESTED");
  expect(()=>withOperationRepositoryObservation(()=>{captureOperationRepository(f.product,base);throw Error("ordinary read failed");})).toThrow("ordinary read failed");
  expect(withOperationRepositoryObservation(()=>captureOperationRepository(f.product,base))).toEqual(original);
 }finally{f.cleanup();}
});

test("cached reads still immediately refuse inherited Git routing",()=>{
 const f=privateRecordFixture(),previous=process.env.GIT_DIR;try{
  const base=privateGit(f.product,["rev-parse","HEAD"]);
  expect(()=>withOperationRepositoryObservation(()=>{captureOperationRepository(f.product,base);process.env.GIT_DIR=path.join(f.records,".git");captureOperationRepository(f.product,base);})).toThrow("OPERATION_GIT_ENVIRONMENT");
 }finally{if(previous===undefined)delete process.env.GIT_DIR;else process.env.GIT_DIR=previous;f.cleanup();}
});

test("repository metadata keeps exact linked-worktree paths containing a newline",()=>{
 const f=privateRecordFixture();try{
  const base=privateGit(f.product,["rev-parse","HEAD"]),checkout=path.join(f.dir,"worker\nwith-line-break");
  privateGit(f.product,["worktree","add","-q","--detach",checkout,base]);
  const captured=captureOperationRepository(checkout,base);
  expect(captured.root).toBe(checkout);expect(captured.commonDir).toBe(path.join(f.product,".git"));expect(captured.rootCommits).toContain(base);
  expect(withOperationRepositoryObservation(()=>captureOperationRepository(checkout,base))).toEqual(captured);
 }finally{f.cleanup();}
});
