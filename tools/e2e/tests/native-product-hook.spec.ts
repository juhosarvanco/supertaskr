import { expect, test } from "@playwright/test";
import { spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { configuredArmFixture } from "./configured-dispatch-arm-fixture";
import { privateGit, putPrivate } from "./private-record-fixture";

test("fixed installed hook binds original coordinator TOOL and canonical native coverage without claiming registration or trust",async()=>{
 test.setTimeout(180_000);const f=await configuredArmFixture();
 try{
  const entry=await import(f.module("native-product-hook")),native=await import(f.module("native-codex")),durable=await import(f.module("durable-operation")),records=await import(f.module("operation-record"));
  expect(entry.nativeProductHookContract()).toEqual({version:1,entry:"tools/e2e/scripts/native-product-hook.mjs",callbacks:native.NATIVE_COVERED_CALLBACKS,tools:native.NATIVE_SUPPORTED_TOOLS,readiness:"unestablished",requiresUserTrust:true});
  const origin=records.operationDigest(durable.captureOperationRepository(f.product,privateGit(f.product,["rev-parse","HEAD"]),{forEffect:false}));
  const before=()=>[f.product,f.records].map(root=>({head:privateGit(root,["rev-parse","HEAD"]),refs:privateGit(root,["show-ref"]),index:readFileSync(path.join(root,".git/index")).toString("base64")}));
  const original=before(),program=path.join(f.installed.runtimeRoot,entry.NATIVE_PRODUCT_HOOK_ENTRY);
  const run=(args:string[],input:any)=>spawnSync(process.execPath,[program,...args],{cwd:f.records,input:JSON.stringify(input),encoding:"utf8",env:{...process.env,NODE_PATH:""}});
  const args=["--root",f.product,"--origin",origin,"--tool",f.tool.manifestDigest],event={hook_event_name:"UserPromptSubmit",session_id:"controlled-entry-session",turn_id:"controlled-entry-turn",cwd:f.records};
  const actual=run(args,event);expect(actual.status,actual.stdout+actual.stderr).toBe(0);expect(before()).toEqual(original);
  // This is a controlled transport frame; no host hook definition was installed,
  // trusted or observed. That distinction stays explicit in the contract.
  expect(existsSync(path.join(f.product,".codex/hooks.json"))).toBe(false);
  const denial=run(["--root",f.product,"--origin",`sha256:${"0".repeat(64)}`,"--tool",f.tool.manifestDigest],{...event,hook_event_name:"PreToolUse",tool_name:"Bash",tool_input:{command:"true"}});
  expect(denial.status).toBe(2);expect(JSON.parse(denial.stdout)).toMatchObject({hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny"}});expect(denial.stdout).toContain("native-product-hook-origin");expect(before()).toEqual(original);
  const malformed=run([...args,"--root",f.records],event);expect(malformed.status).toBe(2);expect(malformed.stdout).toContain("native-product-hook-arguments");expect(before()).toEqual(original);
 }finally{f.cleanup();}
});

test("fixed hook refuses its physically present omitted producer member and restores a real installed transport positive",async()=>{
 test.setTimeout(180_000);const f=await configuredArmFixture();
 try{
  const durable=await import(f.module("durable-operation")),records=await import(f.module("operation-record")),{createHash}=await import("node:crypto");
  const manifestPath=path.join(f.installed.runtimeRoot,"tool-manifest.json"),original=readFileSync(manifestPath,"utf8"),manifest=JSON.parse(original),member="tools/e2e/scripts/native-product-hook.mjs";
  manifest.runtime.files=manifest.runtime.files.filter((row:any)=>row.path!==member);manifest.runtime.buildHash=createHash("sha256").update(JSON.stringify(manifest.runtime.files)).digest("hex");
  const origin=records.operationDigest(durable.captureOperationRepository(f.product,privateGit(f.product,["rev-parse","HEAD"]),{forEffect:false}));
  const run=(tool:string)=>spawnSync(process.execPath,[path.join(f.installed.runtimeRoot,member),"--root",f.product,"--origin",origin,"--tool",tool],{cwd:f.records,input:JSON.stringify({hook_event_name:"UserPromptSubmit",session_id:"controlled-member-session",turn_id:"controlled-member-turn",cwd:f.records}),encoding:"utf8",env:{...process.env,NODE_PATH:""}});
  try{putPrivate(f.installed.runtimeRoot,"tool-manifest.json",JSON.stringify(manifest));expect(existsSync(path.join(f.installed.runtimeRoot,member))).toBe(true);const denied=run(createHash("sha256").update(JSON.stringify(manifest)).digest("hex"));expect(denied.status).toBe(2);expect(denied.stdout).toContain("records-tool-runtime-member-required");}
  finally{putPrivate(f.installed.runtimeRoot,"tool-manifest.json",original);}
  const restored=run(f.tool.manifestDigest);expect(restored.status,restored.stdout+restored.stderr).toBe(0);
 }finally{f.cleanup();}
});
