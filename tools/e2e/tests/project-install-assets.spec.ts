import path from "node:path";
import {existsSync,readFileSync,writeFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {expect,test} from "@playwright/test";
import {configuredArmFixture} from "./configured-dispatch-arm-fixture";
import {privateGit} from "./private-record-fixture";

test("actual installed asset plan carries full native skill packs and portable original-TOOL hook bytes without installing or trusting them",async()=>{
 test.setTimeout(180_000);const f=await configuredArmFixture();
 try{
  const owner=await import(f.module("project-install-assets")),native=await import(f.module("native-product-hook")),schema=await import(f.module("project-install-record"));
  const snapshot=()=>[f.product,f.records].map(root=>({head:privateGit(root,["rev-parse","HEAD"]),refs:privateGit(root,["show-ref"]),index:readFileSync(path.join(root,".git/index")).toString("base64"),status:privateGit(root,["status","--porcelain=v1","--untracked-files=all"])}));
  const before=snapshot(),plan=owner.captureProjectInstallAssets({productRoot:f.product,tool:f.tool});
  expect(plan.kind).toBe("project-install-assets");expect(plan.readiness).toEqual({installed:false,hostTrust:"unestablished",nativeCallbacks:"unestablished"});
  expect(owner.assertPreparedProjectInstallAssets(plan,f.tool)).toBe(plan);
  for(const counterfeit of [structuredClone(plan),{...plan}])expect(()=>owner.assertPreparedProjectInstallAssets(counterfeit,f.tool)).toThrow("project-install-preparation-required");
  expect(()=>owner.assertPreparedProjectInstallAssets(plan,structuredClone(f.tool))).toThrow("project-install-preparation-required");
  const paths=plan.product.map((row:any)=>row.path);expect(paths).toContain(".agents/skills/supertaskr-seat/references/host-commands.md");
  expect(paths).toContain(".agents/skills/supertaskr-seat/scripts/host-command-check.mjs");
  expect(paths.every(schema.isProjectInstallationProductPath)).toBe(true);
  for(const unsafe of [".codex/config.toml",".codex/hooks.json/extra",".agents/skills/foreign/SKILL.md",".agents/skills/supertaskr-seat/../outside",".agents/skills/supertaskr-seat//SKILL.md",".agents/skills/supertaskr-seat/./SKILL.md","src/first.py"])expect(schema.isProjectInstallationProductPath(unsafe)).toBe(false);
  for(const member of plan.membership){const target=plan.product.find((row:any)=>row.path===`.agents/skills/${member.path.slice("method/skills/".length)}`);expect(target).toBeDefined();expect(Buffer.from(target.base64,"base64").toString("utf8")).toBe(f.checks.readInstalledMethodAsset(f.tool,member.path).text);}
  const hooks=JSON.parse(Buffer.from(plan.product.find((row:any)=>row.path===".codex/hooks.json").base64,"base64").toString("utf8")).hooks;
  expect(Object.keys(hooks)).toEqual(native.nativeProductHookContract().callbacks);
  const wrapper=plan.metadata.find((row:any)=>row.role==="native-hook"),source=Buffer.from(wrapper.base64,"base64").toString("utf8");
  expect(wrapper.path).toBe(path.join(plan.repository.commonDir,`supertaskr/native-hooks/native-${f.tool.manifestDigest}.sh`));
  expect(source).toContain(`--root '${f.product}' --origin '`);expect(source).toContain(`--tool '${f.tool.manifestDigest}'`);expect(source).not.toContain('"$@"');
  for(const [event,rows] of Object.entries<any>(hooks)){
   expect(rows).toHaveLength(1);expect(rows[0].hooks).toHaveLength(1);const hook=rows[0].hooks[0];
   expect(hook.command).toBe(`sh "$(git rev-parse --path-format=absolute --git-common-dir)/supertaskr/native-hooks/native-${f.tool.manifestDigest}.sh"`);
   expect(hook.command).not.toContain(f.installed.runtimeRoot);expect(hook.timeout).toBe(event==="Interrupt"?3:30);
   expect(rows[0].matcher).toBe(["PreToolUse","PostToolUse"].includes(event)?"^(Bash|apply_patch)$":undefined);
  }
  expect(plan.metadata.find((row:any)=>row.role==="pre-push").path).toBe(path.join(plan.repository.commonDir,"hooks/pre-push"));
  expect(snapshot()).toEqual(before);
  for(const row of [...plan.product.map((row:any)=>({...row,path:path.join(f.product,row.path)})),...plan.metadata])expect(existsSync(row.path)).toBe(false);
 }finally{f.cleanup();}
});

test("asset preparation qualifies the actual native callback closure before offering installation",async()=>{
 test.setTimeout(180_000);const f=await configuredArmFixture();
 try{
  const owner=await import(f.module("project-install-assets")),manifestPath=path.join(f.installed.runtimeRoot,"tool-manifest.json"),original=readFileSync(manifestPath),manifest=JSON.parse(original.toString("utf8"));
  const member="tools/e2e/scripts/native-codex-hook.mjs";
  expect(existsSync(path.join(f.installed.runtimeRoot,member))).toBe(true);
  const snapshot=()=>[f.product,f.records].map(root=>({head:privateGit(root,["rev-parse","HEAD"]),refs:privateGit(root,["show-ref"]),index:readFileSync(path.join(root,".git/index")).toString("base64")}));
  const before=snapshot();manifest.runtime.files=manifest.runtime.files.filter((row:any)=>row.path!==member);manifest.runtime.buildHash=createHash("sha256").update(JSON.stringify(manifest.runtime.files)).digest("hex");
  try{
   writeFileSync(manifestPath,JSON.stringify(manifest));const tool=f.checks.loadInstalledRecordTool();
   expect(()=>owner.captureProjectInstallAssets({productRoot:f.product,tool})).toThrow("records-tool-runtime-member-required");expect(snapshot()).toEqual(before);
  }finally{writeFileSync(manifestPath,original);}
  const restored=owner.captureProjectInstallAssets({productRoot:f.product,tool:f.tool});
  expect(restored.kind).toBe("project-install-assets");expect(restored.readiness.installed).toBe(false);expect(snapshot()).toEqual(before);
 }finally{f.cleanup();}
});
