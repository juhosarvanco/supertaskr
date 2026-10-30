import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import { expect, test } from "@playwright/test";
import { countUnittest, judge, validateSuite } from "../scripts/gate-run.mjs";
import { judgeToken, writeToken } from "../../../cli/gate-token.mjs";
import { installOfflinePackage } from "../fixtures/offline-package";

test("real verbose unittest output accounts for independent methods, skipped bodies and failed summaries",()=>{
  const root=mkdtempSync(path.join(tmpdir(),"configured-python-counter-"));
  try{
    const run=(body:string)=>{writeFileSync(path.join(root,"test_example.py"),body);const result=spawnSync("python3",["-m","unittest","discover","-v"],{cwd:root,encoding:"utf8"});expect(result.error).toBeUndefined();return{status:result.status??-1,text:result.stdout+result.stderr};};
    const good=run("import unittest\nclass Example(unittest.TestCase):\n    def test_one(self): self.assertEqual(2+2,4)\n    def test_two(self):\n        '''A description exercises multi-line verbose records.'''\n        self.assertTrue(True)\n    @unittest.skip('explicit example skip')\n    def test_skipped(self): pass\n");
    const count=countUnittest(good.text);expect(count).toMatchObject({bodies:2,baseline:3,sums:true,reportedFailure:false});
    expect(judge({status:good.status,count,ref:"fixture",suite:"python"}).verdict).toBe("GREEN");
    const failed=run("import unittest\nclass Example(unittest.TestCase):\n    def test_bad(self): self.fail('authored failure')\n");
    const red=countUnittest(failed.text);expect(red).toMatchObject({bodies:1,baseline:1,sums:true,reportedFailure:true});
    expect(judge({status:failed.status,count:red,ref:"fixture",suite:"python"}).verdict).toBe("RED");
    expect(judge({status:0,count:red,ref:"fixture",suite:"python"})).toMatchObject({verdict:"REFUSED",reason:"summary-contradicts-exit"});
    expect(countUnittest(good.text.replace(/^test_one.*\n/m,"" )).sums).toBe(false);
    expect(countUnittest(good.text+good.text).sums).toBe(false);
    expect(countUnittest(good.text+"\nFAILED (failures=1)\n").sums).toBe(false);
    expect(countUnittest("Ran 2 tests in 0.001s\n\nOK\n").sums).toBe(false);
    expect(validateSuite({id:"python",cwd:".",sentinel:"test_example.py",argv:["python3","-m","unittest","discover"],family:"unittest",solo:false,why:"Explicit example"}).join(" ")).toContain("-v");
  }finally{rmSync(root,{recursive:true,force:true});}
});

test("configured token membership and build context cannot be narrowed or relabeled by a partial write",()=>{
  const root=mkdtempSync(path.join(tmpdir(),"configured-token-"));
  try{
    const context={configurationDigest:`sha256:${"a".repeat(64)}`,toolManifestDigest:"b".repeat(64),required:["python","checks"]};
    const verdict=(suite:string)=>({suite,exit:0,bodies:1,targets:1,verdict:"GREEN",reason:"ok",ref:"r",tree:"t",dirty:false});
    const first=writeToken(root,[verdict("python")],{context,treeAtWrite:"t",dirty:false}).token;
    expect(judgeToken({token:first,tree:"t",context,required:[]})).toMatchObject({state:"incomplete",code:"token-incomplete"});
    const full=writeToken(root,[verdict("checks")],{context,treeAtWrite:"t",dirty:false}).token;
    expect(judgeToken({token:full,tree:"t",context}).state).toBe("fresh");
    const changed={...context,toolManifestDigest:"c".repeat(64)};
    const partial=writeToken(root,[verdict("python")],{context:changed,treeAtWrite:"t",dirty:false}).token;
    expect(partial.suites.checks?.context).toEqual(context);
    expect(judgeToken({token:partial,tree:"t",context:changed})).toMatchObject({state:"unkeyed",code:"token-configuration"});
    const dirty=structuredClone(full);dirty.suites.python!.dirty=true;
    expect(judgeToken({token:dirty,tree:"t",context}).code).toBe("token-unkeyed");
    const moving=structuredClone(full);moving.suites.python!.treeAtWrite="other";
    expect(judgeToken({token:moving,tree:"t",context}).code).toBe("token-unkeyed");
    expect(judgeToken({token:full,tree:"new-tree",context}).code).toBe("token-stale");
    const scoped=structuredClone(full);scoped.suites.python!.scope="test_example.py";
    expect(judgeToken({token:scoped,tree:"t",context}).code).toBe("token-partial");
    expect(()=>writeToken(root,[verdict("python")],{context:{...context,required:[]},treeAtWrite:"t",dirty:false})).toThrow(/invalid configured gate context/);
  }finally{rmSync(root,{recursive:true,force:true});}
});

test("the actual staged CLI grades an independent Python project from its committed configuration",async()=>{
  test.setTimeout(180_000);
  const {testToolRuntime}=await import("../fixtures/tool-runtime");
  const {pathToFileURL}=await import("node:url");
  const {mkdirSync,existsSync}=await import("node:fs");
  const {privateGit,commitPrivate,putPrivate}=await import("./private-record-fixture");
  const installation=testToolRuntime(),moduleUrl=(name:string)=>pathToFileURL(path.join(installation.runtimeRoot,"tools/e2e/scripts",name+".mjs")).href;
  const checker=await import(moduleUrl("records-check")),settingsApi=await import(moduleUrl("project-settings")),profiles=await import(moduleUrl("records-validation"));
  const tool=checker.loadInstalledRecordTool(),seed=settingsApi.seedProjectSettings({tool,recordsValidation:profiles.GENERIC_RECORD_PROFILE});
  expect(seed.status).toBe("ready");
  const parent=mkdtempSync(path.join(tmpdir(),"configured-python-project-")),product=path.join(parent,"product with spaces");mkdirSync(product);
  try{
    privateGit(product,["init","-q","--initial-branch=main"]);privateGit(product,["config","user.name","Configured Python example"]);privateGit(product,["config","user.email","fixture@example.invalid"]);
    putPrivate(product,"pyproject.toml","[project]\nname='independent-example'\nversion='0.1.0'\n");
    putPrivate(product,"checks/test_example.py","import unittest\nclass Example(unittest.TestCase):\n    def test_one(self): self.assertEqual(2+2,4)\n    def test_two(self): self.assertTrue(True)\n");
    const data=structuredClone(seed.settings);data.languages=["python"];data.suites=[{id:"python",cwd:".",sentinel:"pyproject.toml",argv:["python3","-m","unittest","discover","-s","checks","-v"],family:"unittest",solo:false,why:"Authored independent Python suite"}];
    const {stringify}=await import("yaml");putPrivate(product,"supertaskr.yaml",stringify(data));const revision=commitPrivate(product);
    const run=(args:string[])=>spawnSync(process.execPath,[path.join(installation.packageRoot,"supertaskr.mjs"),"--root",product,"gate",...args],{cwd:parent,encoding:"utf8",env:{...process.env,NODE_PATH:""}});
    const result=run(["--all"]);expect(result.status,result.stdout+result.stderr).toBe(0);expect(result.stdout).toContain("suite=python");expect(result.stdout).toContain("bodies=2");expect(result.stdout).toContain("verdict=GREEN");expect(result.stdout).toContain(`ref=${revision}`);
    const token=JSON.parse(readFileSync(path.join(product,".supertaskr/gate-verdict.json"),"utf8"));
    expect(Object.keys(token.suites)).toEqual(["python"]);expect(token.suites.python.context).toMatchObject({toolManifestDigest:tool.manifestDigest,required:["python"]});
    expect(token.suites.python.tree).toBe(privateGit(product,["rev-parse","HEAD^{tree}"]));expect(token.suites.python.treeAtWrite).toBe(token.suites.python.tree);expect(token.suites.python.dirty).toBe(false);
    expect(existsSync(path.join(product,"docs"))).toBe(false);expect(existsSync(path.join(product,"method"))).toBe(false);expect(existsSync(path.join(product,"lib/parser"))).toBe(false);
    const unknown=run(["app"]);expect(unknown.status).toBe(2);expect(unknown.stderr).toContain("gate-suite-selection");
    const malformedSourceRead=spawnSync(process.execPath,[path.join(installation.runtimeRoot,"tools/e2e/scripts/source-ci-owed.mjs"),"--owed-set","--range",`${revision}..${revision}`,"--tree"],{cwd:parent,encoding:"utf8"});
    expect(malformedSourceRead.status).toBe(2);expect(JSON.parse(malformedSourceRead.stdout).problem).toContain("Source CI requires");
    // An editor change is not the committed policy. It is still dirt and may
    // never turn a measured result into a fresh push qualification.
    putPrivate(product,"supertaskr.yaml","invalid: working editor bytes\n");
    const editorRun=run(["--all"]);expect(editorRun.status,editorRun.stderr).toBe(0);
    const editorToken=JSON.parse(readFileSync(path.join(product,".supertaskr/gate-verdict.json"),"utf8"));
    expect(editorToken.suites.python.dirty).toBe(true);
    expect(judgeToken({token:editorToken,tree:token.suites.python.tree,context:token.suites.python.context}).code).toBe("token-unkeyed");
    privateGit(product,["checkout","--","supertaskr.yaml"]);

    // The range reader must not apply the historic e2e narrowing adapter to
    // an unrelated family just because a project chose that suite identifier.
    const renamed=structuredClone(data);renamed.suites[0].id="e2e";
    putPrivate(product,"supertaskr.yaml",stringify(renamed));const renamedRevision=commitPrivate(product);
    putPrivate(product,"checks/test_example.py",readFileSync(path.join(product,"checks/test_example.py"),"utf8")+"\n# changed example\n");
    const changedRevision=commitPrivate(product);
    const owed=run(["--owed-set","--range",`${renamedRevision}..${changedRevision}`]);
    expect(owed.status,owed.stderr).toBe(0);expect(JSON.parse(owed.stdout)).toMatchObject({suites:["e2e"],e2e:{whole:true,specs:[]}});
    expect(JSON.parse(owed.stdout).failClosed).toContain("no qualified scoped discovery adapter");

    putPrivate(product,"supertaskr.yaml",seed.yaml);commitPrivate(product);
    const unconfigured=run(["--all"]);expect(unconfigured.status).toBe(3);expect(unconfigured.stderr).toContain("gate-suites-unconfigured");
    privateGit(product,["rm","supertaskr.yaml"]);commitPrivate(product);
    const missing=run(["--all"]);expect(missing.status).toBe(3);expect(missing.stderr).toContain("project-settings-missing");
    expect(missing.stdout).not.toContain("verdict=GREEN");
  }finally{rmSync(parent,{recursive:true,force:true});}
});

test("an offline isolated tarball grades Python without checkout, NODE_PATH or sibling dependency fallback",async()=>{
  test.setTimeout(180_000);
  const {testToolRuntime}=await import("../fixtures/tool-runtime"),{execFileSync}=await import("node:child_process"),{pathToFileURL}=await import("node:url"),{mkdirSync,realpathSync}=await import("node:fs"),{createRequire}=await import("node:module");
  const {packageEscapes}=await import("../scripts/cli.mjs"),{privateGit,commitPrivate,putPrivate}=await import("./private-record-fixture");
  const source=testToolRuntime(),parent=mkdtempSync(path.join(tmpdir(),"configured-isolated-pack-")),product=path.join(parent,"independent-python"),pack=path.join(parent,"packed");mkdirSync(product);mkdirSync(pack);
  const env={...process.env,NODE_PATH:""};
  try{
    // The shared immutable stage was already produced by the real builder.
    // Ignore lifecycle scripts here so postpack cannot remove that stage.
    const packed=JSON.parse(execFileSync("npm",["pack","--ignore-scripts","--json","--pack-destination",pack],{cwd:source.packageRoot,encoding:"utf8",env}));
    putPrivate(product,"package.json",JSON.stringify({name:"python-tool-fixture",version:"0.0.0",private:true}));
    installOfflinePackage({packageTarball:path.join(pack,packed[0].filename),packDirectory:pack,project:product,env,ignoreScripts:true});
    const installed=path.join(product,"node_modules/supertaskr"),runtime=path.join(installed,"dist"),url=(name:string)=>pathToFileURL(path.join(runtime,"tools/e2e/scripts",name+".mjs")).href;
    expect(realpathSync(installed).startsWith(realpathSync(product)+path.sep)).toBe(true);
    expect(packageEscapes(path.join(runtime,"tools/e2e/scripts/gate-run.mjs"),installed)).toEqual([]);
    expect(packageEscapes(path.join(runtime,"tools/e2e/scripts/product-hook.mjs"),installed)).toEqual([]);
    const checker=await import(url("records-check")),settingsApi=await import(url("project-settings")),profile=await import(url("records-validation"));
    const tool=checker.loadInstalledRecordTool(),seed=settingsApi.seedProjectSettings({tool,recordsValidation:profile.GENERIC_RECORD_PROFILE});expect(seed.status).toBe("ready");
    const data=structuredClone(seed.settings);data.languages=["python"];data.suites=[{id:"python",cwd:".",sentinel:"pyproject.toml",argv:["python3","-m","unittest","discover","-s","checks","-v"],family:"unittest",solo:false,why:"Isolated Python suite"}];
    putPrivate(product,"supertaskr.yaml",JSON.stringify(data));putPrivate(product,"pyproject.toml","[project]\nname='isolated-python'\nversion='0.1.0'\n");
    putPrivate(product,"checks/test_example.py","import unittest\nclass Example(unittest.TestCase):\n    def test_truth(self): self.assertTrue(True)\n");putPrivate(product,".gitignore","node_modules/\n");
    privateGit(product,["init","-q","--initial-branch=main"]);privateGit(product,["config","user.name","Isolated Python"]);privateGit(product,["config","user.email","fixture@example.invalid"]);commitPrivate(product);
    const observationLog=path.join(parent,"private-access.jsonl"),observedEnv={...env,
      NODE_OPTIONS:`--require=${path.join(source.sourceRoot,"tools/e2e/fixtures/private-access-observer.cjs")}`,
      SUPERTASKR_OBSERVE_PRIVATE_LOG:observationLog,
      SUPERTASKR_OBSERVE_PRIVATE_ROOTS:JSON.stringify([product,...source.observationRoots]),
      SUPERTASKR_OBSERVE_PRIVATE_NAMESPACES:JSON.stringify(source.privateNamespaces)};
    const events=()=>readFileSync(observationLog,"utf8").trim().split("\n").filter(Boolean).map(line=>JSON.parse(line));
    const run=(explicitRoot=true)=>{
      writeFileSync(observationLog,"");
      const result=spawnSync(process.execPath,[path.join(installed,"supertaskr.mjs"),...(explicitRoot?["--root",product]:[]),"gate","--all"],{cwd:explicitRoot?parent:path.join(product,"checks"),encoding:"utf8",env:observedEnv});
      const observed=events();expect(observed.filter(event=>event.kind==="observer-installed").length).toBeGreaterThan(0);
      expect(observed.filter(event=>event.kind!=="observer-installed")).toEqual([]);
      return result;
    };
    const green=run();expect(green.status,green.stdout+green.stderr).toBe(0);expect(green.stdout).toContain("suite=python");expect(green.stdout).toContain("bodies=1");expect(green.stdout).toContain("verdict=GREEN");
    const resolver=createRequire(path.join(runtime,"tools/e2e/scripts/gate-run.mjs")),yaml=path.dirname(resolver.resolve("yaml/package.json")),hidden=path.join(parent,"missing-yaml-control");
    expect(realpathSync(yaml).startsWith(realpathSync(product)+path.sep)).toBe(true);
    const {renameSync}=await import("node:fs");renameSync(yaml,hidden);try{const absent=run();expect(absent.status,absent.stdout+absent.stderr).toBe(3);expect(absent.stderr).toContain("yaml");}finally{renameSync(hidden,yaml);}
    expect(run().status).toBe(0);
    expect(run(false).status).toBe(0);
    const unboundHook=spawnSync(process.execPath,[path.join(runtime,"tools/e2e/scripts/product-hook.mjs"),"--root",product,"--mode","pre-tool"],
      {cwd:product,encoding:"utf8",env,input:JSON.stringify({tool_name:"Bash",cwd:product,tool_input:{command:"git push origin main"}})});
    expect(unboundHook.status,unboundHook.stderr).toBe(2);expect(unboundHook.stderr).toContain("hook-records-binding-required");
    writeFileSync(observationLog,"");
    const calibrationPath=path.join(product,"docs/INDEX.md");
    const calibration=spawnSync(process.execPath,["-e","require('node:fs').existsSync(process.argv[1])",calibrationPath],{cwd:parent,encoding:"utf8",env:observedEnv});
    expect(calibration.status).toBe(0);expect(events().some(event=>event.path===calibrationPath)).toBe(true);
  }finally{rmSync(parent,{recursive:true,force:true});}
});
