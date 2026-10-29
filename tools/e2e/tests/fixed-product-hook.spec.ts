import {chmodSync,existsSync,readFileSync,renameSync,writeFileSync} from "node:fs";
import path from "node:path";
import {expect,test} from "@playwright/test";
import {renderFixedProductPrePush,qualifyFixedProductPrePush,validatedFixedProductPrePush} from "../scripts/fixed-product-hook.mjs";
import {captureOperationRepository,captureQualifiedOperationRepository} from "../scripts/durable-operation.mjs";
import {loadInstalledRecordTool} from "../scripts/records-check.mjs";
import {privateRecordFixture,privateGit} from "./private-record-fixture";

function installed(){const f=privateRecordFixture(),tool=loadInstalledRecordTool(f.manifestPath),options={productRoot:f.product,tool},rendered=renderFixedProductPrePush(options),file=path.join(f.product,".git/hooks/pre-push");
 writeFileSync(file,rendered.bytes,{mode:0o700});chmodSync(file,0o700);return {...f,options,rendered,file};}
test("describing the fixed wrapper never installs a missing hook and missing qualification is named",()=>{
 const f=privateRecordFixture();try{const options={productRoot:f.product,tool:loadInstalledRecordTool(f.manifestPath)},file=path.join(f.product,".git/hooks/pre-push");
  const rendered=renderFixedProductPrePush(options);expect(rendered.bytes).toContain("--mode pre-push");expect(existsSync(file)).toBe(false);
  expect(()=>qualifyFixedProductPrePush(options)).toThrow(/FIXED_HOOK_PHYSICAL/);expect(existsSync(file)).toBe(false);
 }finally{f.cleanup();}
});
test("only the actual opaque exact installed TOOL pre-push qualifies while generic effects remain strict",()=>{
 const f=installed();try{
  const before=readFileSync(f.file),proof=qualifyFixedProductPrePush(f.options);
  const base=privateGit(f.product,["rev-parse","HEAD"]);
  expect(()=>captureOperationRepository(f.product,base)).toThrow(/OPERATION_ACTIVE_HOOK/);
  const captured=captureQualifiedOperationRepository(f.product,base,proof);expect(captured.root).toBe(f.product);expect(validatedFixedProductPrePush(proof,f.product).sha256).toBe(f.rendered.sha256);
  expect(()=>captureQualifiedOperationRepository(f.product,base,structuredClone(proof))).toThrow(/FIXED_HOOK_PROOF_REQUIRED/);
  expect(readFileSync(f.file)).toEqual(before);expect(privateGit(f.product,["rev-parse","HEAD"])).toBe(base);
 }finally{f.cleanup();}
});
test("changed bytes or a successor same-byte hook incarnation cannot redeem an old qualification",()=>{
 const f=installed();try{
  const proof=qualifyFixedProductPrePush(f.options),base=privateGit(f.product,["rev-parse","HEAD"]),original=path.join(f.dir,"pre-push.original");
  renameSync(f.file,original);writeFileSync(f.file,f.rendered.bytes,{mode:0o700});
  expect(()=>captureQualifiedOperationRepository(f.product,base,proof)).toThrow(/FIXED_HOOK_CHANGED/);
  writeFileSync(f.file,"#!/bin/sh\nexit 0\n");expect(()=>qualifyFixedProductPrePush(f.options)).toThrow(/FIXED_HOOK_BYTES/);expect(readFileSync(f.file,"utf8")).toBe("#!/bin/sh\nexit 0\n");
  renameSync(f.file,path.join(f.dir,"pre-push.successor"));renameSync(original,f.file);
  expect(captureQualifiedOperationRepository(f.product,base,proof).root).toBe(f.product);
 }finally{f.cleanup();}
});
test("qualifying the exact pre-push never permits another active user hook or unsupported index routing",()=>{
 const f=installed();try{
  const proof=qualifyFixedProductPrePush(f.options),base=privateGit(f.product,["rev-parse","HEAD"]),other=path.join(f.product,".git/hooks/pre-commit");
  writeFileSync(other,"#!/bin/sh\nexit 0\n",{mode:0o700});
  expect(()=>captureQualifiedOperationRepository(f.product,base,proof)).toThrow(/OPERATION_ACTIVE_HOOK/);expect(readFileSync(other,"utf8")).toBe("#!/bin/sh\nexit 0\n");
  chmodSync(other,0o600);privateGit(f.product,["config","core.splitIndex","true"]);
  expect(()=>captureQualifiedOperationRepository(f.product,base,proof)).toThrow(/OPERATION_GIT_CONFIG/);
 }finally{f.cleanup();}
});
