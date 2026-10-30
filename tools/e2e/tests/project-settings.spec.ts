import { readFileSync, renameSync, rmSync, symlinkSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { stringify } from "yaml";
import { loadInstalledRecordTool, readInstalledMethodAsset, readInstalledMethodAssets, listInstalledMethodAssets, requireInstalledRuntimeAssets } from "../scripts/records-check.mjs";
import { GENERIC_RECORD_PROFILE } from "../scripts/records-validation.mjs";
import { seedProjectSettings, loadProjectSettings, loadWorkingProjectSettings, requireProjectSection } from "../scripts/project-settings.mjs";
import { createProjectRuntime } from "../scripts/project-runtime.mjs";
import { privateRecordFixture, privateGit, putPrivate, commitPrivate, sha } from "./private-record-fixture";
const seedFor = (f: ReturnType<typeof privateRecordFixture>) => {
  const tool = loadInstalledRecordTool(f.manifestPath), seed = seedProjectSettings({ tool, recordsValidation: GENERIC_RECORD_PROFILE });
  expect(seed.status).toBe("ready"); if (seed.status !== "ready") throw Error(JSON.stringify(seed)); return {tool, seed};
};
test("verified TOOL seed has approved defaults, provenance and explicit unconfigured PRODUCT sections", () => {
  const f=privateRecordFixture();try {
    const {tool,seed}=seedFor(f);
    const members=listInstalledMethodAssets(tool);
    expect(members.map((entry)=>entry.path).sort()).toEqual(["method/docs-protocol.md","method/runtime/process-schema.yaml","method/runtime/supertaskr.yaml","method/tasks/TASK-FORMAT.md"]);
    expect(Object.isFrozen(members)).toBe(true);expect(members.every((entry)=>Object.isFrozen(entry)&&/^[0-9a-f]{64}$/.test(entry.sha256))).toBe(true);
    expect(listInstalledMethodAssets(tool)).not.toBe(members);
    const batch=readInstalledMethodAssets(tool,["method/runtime/supertaskr.yaml","method/docs-protocol.md"]);
    expect(batch).toHaveLength(2);expect(batch[0]?.text).toContain("roles:");
    expect(Object.isFrozen(batch)).toBe(true);expect(batch.every((entry)=>Object.isFrozen(entry)&&typeof entry.text==="string")).toBe(true);
    expect(()=>readInstalledMethodAssets(tool,["method/runtime/supertaskr.yaml","method/not-installed.md"])).toThrow(/method-member-required/);
    expect(()=>readInstalledMethodAssets(tool,[])).toThrow(/method-members-required/);
    expect(seed.settings).toMatchObject({version:1,suites:[],smoke:null,guard_class:{},bands:[],names:null,languages:[],records:{validation:GENERIC_RECORD_PROFILE}});
    expect(seed.settings).not.toHaveProperty("dispatch");expect(seed.settings).not.toHaveProperty("projectId");
    for(const section of ["suites","smoke","guard_class","bands","names","languages"] as const) expect(requireProjectSection(seed,section)).toMatchObject({status:"cannot-run",code:3,diagnostics:[`missing configuration: ${section}`]});
    expect(Object.isFrozen(seed.settings.records.validation)).toBe(true);expect(seed.provenance.tool.manifestDigest).toBe(tool.manifestDigest);
    expect(seed.provenance.assets.map((a:any)=>a.path)).toEqual(["method/runtime/process-schema.yaml","method/runtime/supertaskr.yaml"]);
    expect(seedProjectSettings({tool,recordsValidation:undefined}).status).toBe("refused");
    expect(seedProjectSettings({tool:structuredClone(tool),recordsValidation:GENERIC_RECORD_PROFILE})).toMatchObject({status:"refused",code:"records-tool-context-required"});
  }finally{f.cleanup();}
});
test("committed config ignores dirty poison and never discovers managed method defaults",()=>{
  const f=privateRecordFixture();try{
    const {tool,seed}=seedFor(f);
    expect(loadProjectSettings({...f.options,productRoot:f.product,tool} as any)).toMatchObject({status:"refused",code:"project-settings-request"});
    expect(loadProjectSettings({productRoot:f.product,productRevision:f.options.productRevision,tool}).status).toBe("not-configured");
    putPrivate(f.product,"method/runtime/supertaskr.yaml",seed.yaml);const noRoot=commitPrivate(f.product);
    expect(loadProjectSettings({productRoot:f.product,productRevision:noRoot,tool}).status).toBe("not-configured");
    putPrivate(f.product,"supertaskr.yaml",seed.yaml);const revision=commitPrivate(f.product);putPrivate(f.product,"supertaskr.yaml","broken: [\n");
    const committed=loadProjectSettings({productRoot:f.product,productRevision:revision,tool});expect(committed.status).toBe("ready");
    if(committed.status!=="ready")throw Error(JSON.stringify(committed));expect(committed.provenance).toMatchObject({kind:"committed",productRevision:revision,path:"supertaskr.yaml"});
    expect(loadWorkingProjectSettings({productRoot:f.product,tool}).status).toBe("refused");putPrivate(f.product,"supertaskr.yaml",seed.yaml);
    expect(requireProjectSection(loadWorkingProjectSettings({productRoot:f.product,tool}),"suites")).toMatchObject({status:"cannot-run",code:3,diagnostics:[expect.stringContaining("committed")]});
    expect(loadProjectSettings({productRoot:f.product,productRevision:"HEAD",tool}).status).toBe("refused");
  }finally{f.cleanup();}
});
test("canonical private policy and unsupported keeper configuration have distinct refusals",()=>{
  const f=privateRecordFixture();try{
    const {tool,seed}=seedFor(f),settings:any=structuredClone(seed.settings);
    settings.records.validation={version:1,kind:"generic",indexInputs:["docs/ROADMAP.md"],budgets:{}};
    putPrivate(f.product,"supertaskr.yaml",stringify(settings));const revision=commitPrivate(f.product);
    expect(loadProjectSettings({productRoot:f.product,productRevision:revision,tool})).toMatchObject({status:"refused",code:"records-profile-invalid"});
    settings.records.validation=GENERIC_RECORD_PROFILE;settings.names={unknown:"unimplemented keeper policy"};putPrivate(f.product,"supertaskr.yaml",stringify(settings));const unsupported=commitPrivate(f.product);
    expect(loadProjectSettings({productRoot:f.product,productRevision:unsupported,tool})).toMatchObject({status:"refused",code:"project-settings-names-unsupported"});
  }finally{f.cleanup();}
});
test("committed and editor settings preserve a PRODUCT root with trailing spaces",()=>{
  const f=privateRecordFixture();try{
    const {tool,seed}=seedFor(f);putPrivate(f.product,"supertaskr.yaml",seed.yaml);
    const productRevision=commitPrivate(f.product),productRoot=f.product+"  ";renameSync(f.product,productRoot);
    const selected=loadProjectSettings({productRoot,productRevision,tool});
    expect(selected.status).toBe("ready");if(selected.status!=="ready")throw Error(JSON.stringify(selected));
    expect(selected.provenance.productRoot).toBe(productRoot);
    expect(loadWorkingProjectSettings({productRoot,tool}).status).toBe("ready");
    putPrivate(productRoot,"supertaskr.yaml","broken: [\n");
    expect(loadProjectSettings({productRoot,productRevision,tool})).toMatchObject({status:"ready",settings:selected.settings});
    expect(loadWorkingProjectSettings({productRoot,tool}).status).toBe("refused");
  }finally{f.cleanup();}
});
test("explicit Python suite data survives while unrelated empty sections still cannot run",()=>{
  const f=privateRecordFixture();try{
    const {tool,seed}=seedFor(f),settings:any=structuredClone(seed.settings);settings.languages=["python"];
    settings.suites=[{id:"python",cwd:".",sentinel:"pyproject.toml",argv:["python3","-m","unittest","discover"],solo:false,family:"unittest",why:"Explicit example suite"}];
    putPrivate(f.product,"supertaskr.yaml",stringify(settings));const productRevision=commitPrivate(f.product),loaded=loadProjectSettings({productRoot:f.product,productRevision,tool});
    expect(requireProjectSection(loaded,"suites")).toMatchObject({status:"configured",value:settings.suites});
    expect(requireProjectSection(loaded,"languages")).toMatchObject({status:"configured",value:["python"]});expect(requireProjectSection(loaded,"smoke")).toMatchObject({status:"cannot-run",code:3});
  }finally{f.cleanup();}
});
test("method asset reader rejects unlisted, missing, changed and symlinked members",()=>{
  for(const change of ["unlisted","missing","changed","symlink"] as const){const f=privateRecordFixture();try{
    const {tool}=seedFor(f),relative="method/runtime/supertaskr.yaml",file=path.join(f.tool,"dist",relative);
    expect(readInstalledMethodAsset(tool,relative).text).toContain("roles:");
    if(change==="unlisted")expect(()=>readInstalledMethodAsset(tool,"method/runtime/unlisted.yaml")).toThrow(/method-member-required/);
    else{const bytes=readFileSync(file);rmSync(file);if(change==="changed")putPrivate(f.tool,`dist/${relative}`,"changed TOOL defaults\n");
      if(change==="symlink"){putPrivate(f.product,relative,bytes);symlinkSync(path.join(f.product,relative),file);}
      expect(()=>readInstalledMethodAsset(tool,relative)).toThrow(/records-tool-/);expect(seedProjectSettings({tool,recordsValidation:GENERIC_RECORD_PROFILE}).status).toBe("refused");}
  }finally{f.cleanup();}}
});
test("band metadata uses the existing canonical threshold rule, and committed settings symlinks refuse",()=>{
  const f=privateRecordFixture();try{
    const {tool,seed}=seedFor(f),settings:any=structuredClone(seed.settings);
    settings.bands=[{id:"example-backlog",metric:"example backlog",unit:"items",healthy:"below",drift:5,breach:10,authority:{kind:"tree",name:"authored example authority"},measured:{at:"fixture",reason:"Authored threshold validation example"}}];
    putPrivate(f.product,"supertaskr.yaml",stringify(settings));const good=commitPrivate(f.product);
    expect(loadProjectSettings({productRoot:f.product,productRevision:good,tool}).status).toBe("ready");
    settings.bands[0].drift=20;putPrivate(f.product,"supertaskr.yaml",stringify(settings));const bad=commitPrivate(f.product);
    expect(loadProjectSettings({productRoot:f.product,productRevision:bad,tool})).toMatchObject({status:"refused",code:"project-settings-bands-invalid"});
    rmSync(path.join(f.product,"supertaskr.yaml"));putPrivate(f.product,"settings-copy.yaml",seed.yaml);symlinkSync("settings-copy.yaml",path.join(f.product,"supertaskr.yaml"));const link=commitPrivate(f.product);
    expect(loadProjectSettings({productRoot:f.product,productRevision:link,tool})).toMatchObject({status:"refused",code:"project-settings-file-kind"});
  }finally{f.cleanup();}
});
test("runtime closure requires actual captured manifest members even when omitted files remain present",()=>{
  const f=privateRecordFixture();try{
    const {tool}=seedFor(f),member="tools/e2e/scripts/project-runtime.mjs";
    expect(requireInstalledRuntimeAssets(tool,[member])).toMatchObject({manifestDigest:tool.manifestDigest,files:[{path:member,sha256:expect.stringMatching(/^[0-9a-f]{64}$/)}]});
    expect(()=>requireInstalledRuntimeAssets(tool,["tools/e2e/scripts/not-installed.mjs"])).toThrow(/runtime-member-required/);
    expect(()=>requireInstalledRuntimeAssets(tool,[])).toThrow(/runtime-members-required/);
    const manifest=JSON.parse(readFileSync(f.manifestPath,"utf8"));
    manifest.runtime.files=manifest.runtime.files.filter((entry:any)=>entry.path!==member);manifest.runtime.buildHash=sha(JSON.stringify(manifest.runtime.files));
    putPrivate(f.tool,"dist/tool-manifest.json",JSON.stringify(manifest));
    const omitted=loadInstalledRecordTool(f.manifestPath);
    expect(()=>requireInstalledRuntimeAssets(omitted,[member])).toThrow(/runtime-member-required/);
    expect(()=>createProjectRuntime({productRoot:f.product,productRevision:f.options.productRevision,tool:omitted})).toThrow(/runtime-member-required/);
    expect(()=>requireInstalledRuntimeAssets(tool,["tools/e2e/scripts/records-check.mjs"])).toThrow(/context-changed/);
  }finally{f.cleanup();}
});
test("ordinary TOOL validation requires the operation reader's unconditional initialization schema owner",()=>{
  const f=privateRecordFixture();try{
    const original=readFileSync(f.manifestPath,"utf8"),member="tools/e2e/scripts/project-init-record.mjs";
    expect(loadInstalledRecordTool(f.manifestPath).package.name).toBe("supertaskr");
    expect(readFileSync(path.join(f.tool,"dist/tools/e2e/scripts/operation-record.mjs"),"utf8")).toContain('from "./project-init-record.mjs"');
    const manifest=JSON.parse(original);expect(manifest.runtime.files.some((entry:any)=>entry.path===member)).toBe(true);
    manifest.runtime.files=manifest.runtime.files.filter((entry:any)=>entry.path!==member);manifest.runtime.buildHash=sha(JSON.stringify(manifest.runtime.files));
    putPrivate(f.tool,"dist/tool-manifest.json",JSON.stringify(manifest));
    expect(readFileSync(path.join(f.tool,"dist",member),"utf8")).toContain("validProjectInitializationRecord");
    expect(()=>loadInstalledRecordTool(f.manifestPath)).toThrow(/records-tool-runtime-mismatch/);
    putPrivate(f.tool,"dist/tool-manifest.json",original);expect(loadInstalledRecordTool(f.manifestPath).package.name).toBe("supertaskr");
  }finally{f.cleanup();}
});
for (const [owner,importer] of [["records-profile","records-validation"],["records-finding","records"],["source-suite-derivation","dispatch-brief"],["configured-dispatch-grade","gate-run"],["qualified-integration-grade","gate-run"],["qualified-integration-process","qualified-integration-grade"],["operation-ref","durable-operation"],["qualified-delivery-record","operation-record"],["qualified-integration-record","qualified-delivery-record"],["qualified-configured-grades","qualified-delivery-record"],["qualified-delivery-operation","qualified-completion-operation"],["qualified-publication-context","qualified-delivery-operation"],["qualified-publication-record","qualified-delivery-record"],["qualified-publication-process","qualified-admission"],["qualified-ci-record","qualified-delivery-record"],["qualified-delivery-ci","qualified-ci-record"],["qualified-completion-record","qualified-delivery-record"],["fixed-product-hook","durable-operation"],["private-backup-record","operation-record"],["records-backup-operation","records-stdio"],["records-backup","records-backup-operation"],["records-backup-settings","records-stdio"],["workspace","records-backup"],["native-codex","records-backup-settings"],["project-init-operation","records-backup-operation"],["project-settings","records-save"],["dispatch-brief","records-save"],["health-bands","project-settings"],["rename-scan","project-settings"],["project-bank-record","operation-record"],["configured-dispatch-record","operation-record"],["genesis-bank-proposal","project-bank-record"],["genesis-proposal","project-bank-record"]]) {
  test(`ordinary TOOL validation requires its loaded ${owner} owner even when the omitted file remains present`,()=>{
    const f=privateRecordFixture();try{
      const original=readFileSync(f.manifestPath,"utf8"),member=`tools/e2e/scripts/${owner}.mjs`;
      expect(loadInstalledRecordTool(f.manifestPath).package.name).toBe("supertaskr");
      expect(readFileSync(path.join(f.tool,`dist/tools/e2e/scripts/${importer}.mjs`),"utf8")).toContain(owner==="qualified-publication-process"?`import("./${owner}.mjs")`:`from "./${owner}.mjs"`);
      const manifest=JSON.parse(original);expect(manifest.runtime.files.some((entry:any)=>entry.path===member)).toBe(true);
      manifest.runtime.files=manifest.runtime.files.filter((entry:any)=>entry.path!==member);manifest.runtime.buildHash=sha(JSON.stringify(manifest.runtime.files));
      putPrivate(f.tool,"dist/tool-manifest.json",JSON.stringify(manifest));expect(readFileSync(path.join(f.tool,"dist",member),"utf8").length).toBeGreaterThan(0);
      expect(()=>loadInstalledRecordTool(f.manifestPath)).toThrow(/records-tool-runtime-mismatch/);
      putPrivate(f.tool,"dist/tool-manifest.json",original);expect(loadInstalledRecordTool(f.manifestPath).package.name).toBe("supertaskr");
    }finally{f.cleanup();}
  });
}
test("ordinary TOOL validation requires the actually imported hook routing audit when its omitted file remains present",()=>{
 const f=privateRecordFixture();try{
  const original=readFileSync(f.manifestPath,"utf8"),member="cli/hook-git-context.mjs",manifest=JSON.parse(original);
  expect(loadInstalledRecordTool(f.manifestPath).package.name).toBe("supertaskr");expect(readFileSync(path.join(f.tool,"dist/cli/configured-gate-reader.mjs"),"utf8")).toContain('from "./hook-git-context.mjs"');
  manifest.runtime.files=manifest.runtime.files.filter((entry:any)=>entry.path!==member);manifest.runtime.buildHash=sha(JSON.stringify(manifest.runtime.files));putPrivate(f.tool,"dist/tool-manifest.json",JSON.stringify(manifest));
  expect(readFileSync(path.join(f.tool,"dist",member),"utf8").length).toBeGreaterThan(0);expect(()=>loadInstalledRecordTool(f.manifestPath)).toThrow(/records-tool-runtime-mismatch/);
  putPrivate(f.tool,"dist/tool-manifest.json",original);expect(loadInstalledRecordTool(f.manifestPath).package.name).toBe("supertaskr");
 }finally{f.cleanup();}
});
test("ordinary TOOL validation retains the critical standalone completion writer even when its omitted file remains present",()=>{
 const f=privateRecordFixture();try{
  const original=readFileSync(f.manifestPath,"utf8"),member="tools/e2e/scripts/qualified-completion-operation.mjs",manifest=JSON.parse(original);
  expect(loadInstalledRecordTool(f.manifestPath).package.name).toBe("supertaskr");expect(readFileSync(path.join(f.tool,"dist",member),"utf8")).toContain("export async function completeQualifiedRecordsDelivery");
  manifest.runtime.files=manifest.runtime.files.filter((entry:any)=>entry.path!==member);manifest.runtime.buildHash=sha(JSON.stringify(manifest.runtime.files));putPrivate(f.tool,"dist/tool-manifest.json",JSON.stringify(manifest));
  expect(readFileSync(path.join(f.tool,"dist",member),"utf8").length).toBeGreaterThan(0);expect(()=>loadInstalledRecordTool(f.manifestPath)).toThrow(/records-tool-runtime-mismatch/);
  putPrivate(f.tool,"dist/tool-manifest.json",original);expect(loadInstalledRecordTool(f.manifestPath).package.name).toBe("supertaskr");
 }finally{f.cleanup();}
});
test("ordinary TOOL validation requires the actually imported cold configured reader even when an omitted file remains present",()=>{
 const f=privateRecordFixture();try{
  const original=readFileSync(f.manifestPath,"utf8"),member="cli/configured-native-reader.mjs",manifest=JSON.parse(original);
  expect(loadInstalledRecordTool(f.manifestPath).package.name).toBe("supertaskr");
  expect(readFileSync(path.join(f.tool,"dist/tools/e2e/scripts/run-record.mjs"),"utf8")).toContain('from "../../../cli/configured-native-reader.mjs"');
  manifest.runtime.files=manifest.runtime.files.filter((entry:any)=>entry.path!==member);manifest.runtime.buildHash=sha(JSON.stringify(manifest.runtime.files));putPrivate(f.tool,"dist/tool-manifest.json",JSON.stringify(manifest));
  expect(readFileSync(path.join(f.tool,"dist",member),"utf8").length).toBeGreaterThan(0);expect(()=>loadInstalledRecordTool(f.manifestPath)).toThrow(/records-tool-runtime-mismatch/);
  putPrivate(f.tool,"dist/tool-manifest.json",original);expect(loadInstalledRecordTool(f.manifestPath).manifestDigest).toBe(sha(original));
 }finally{f.cleanup();}
});
test("ordinary TOOL validation retains the standalone CI controller when its omitted file remains present",()=>{
 const f=privateRecordFixture();try{
  const original=readFileSync(f.manifestPath,"utf8"),member="tools/e2e/scripts/qualified-ci-operation.mjs",manifest=JSON.parse(original);
  expect(loadInstalledRecordTool(f.manifestPath).package.name).toBe("supertaskr");expect(readFileSync(path.join(f.tool,"dist",member),"utf8")).toContain("export async function reconcileQualifiedDeliveryCi");
  manifest.runtime.files=manifest.runtime.files.filter((entry:any)=>entry.path!==member);manifest.runtime.buildHash=sha(JSON.stringify(manifest.runtime.files));putPrivate(f.tool,"dist/tool-manifest.json",JSON.stringify(manifest));
  expect(readFileSync(path.join(f.tool,"dist",member),"utf8").length).toBeGreaterThan(0);expect(()=>loadInstalledRecordTool(f.manifestPath)).toThrow(/records-tool-runtime-mismatch/);
  putPrivate(f.tool,"dist/tool-manifest.json",original);expect(loadInstalledRecordTool(f.manifestPath).package.name).toBe("supertaskr");
 }finally{f.cleanup();}
});
test("publication selection is explicit committed data, absent/null cannot run, and dirty editor bytes cannot retarget it",()=>{
  const f=privateRecordFixture();try{
    const {tool,seed}=seedFor(f);expect(seed.settings.publication).toBeNull();expect(requireProjectSection(seed,"publication")).toMatchObject({status:"cannot-run",code:3});
    const value=structuredClone(seed.settings);delete value.publication;putPrivate(f.product,"supertaskr.yaml",stringify(value));
    privateGit(f.product,["add","supertaskr.yaml"]);privateGit(f.product,["commit","-qm","Explicit data without publication selection"]);
    const absentRevision=privateGit(f.product,["rev-parse","HEAD"]),absent=loadProjectSettings({productRoot:f.product,productRevision:absentRevision,tool});
    expect(absent.status).toBe("ready");expect(requireProjectSection(absent,"publication")).toMatchObject({status:"cannot-run",code:3});
    value.publication={remote:"origin",destinationRef:"refs/heads/main",ci:{provider:"github-actions",host:"github.com",repository:"Owner/Project",workflow:".github/workflows/ci.yml",event:"push",checks:["Python / linux"]}};
    putPrivate(f.product,"supertaskr.yaml",stringify(value));privateGit(f.product,["add","supertaskr.yaml"]);privateGit(f.product,["commit","-qm","Choose exact publication identities"]);
    const revision=privateGit(f.product,["rev-parse","HEAD"]);value.publication.remote="uncommitted";putPrivate(f.product,"supertaskr.yaml",stringify(value));
    const committed=loadProjectSettings({productRoot:f.product,productRevision:revision,tool});expect(requireProjectSection(committed,"publication")).toMatchObject({status:"configured",value:{remote:"origin",ci:{repository:"owner/project",checks:["Python / linux"]}}});
    const editor=loadWorkingProjectSettings({productRoot:f.product,tool});expect(requireProjectSection(editor,"publication")).toMatchObject({status:"cannot-run",code:3});
  }finally{f.cleanup();}
});
