import { readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { expect,test } from "@playwright/test";
import { loadInstalledRecordTool } from "../scripts/records-check.mjs";
import { loadProjectSettings,loadWorkingProjectSettings,normalizeProjectRoleModel,resolveProjectRole,seedProjectSettings } from "../scripts/project-settings.mjs";
import { GENERIC_RECORD_PROFILE } from "../scripts/records-validation.mjs";
import { privateRecordFixture,privateGit,putPrivate } from "./private-record-fixture";

function fixture(){
  const f=privateRecordFixture(),tool=loadInstalledRecordTool(f.manifestPath),seed=seedProjectSettings({tool,recordsValidation:GENERIC_RECORD_PROFILE});
  if(seed.status!=="ready")throw Error(JSON.stringify(seed));
  rmSync(path.join(f.product,".supertaskr"),{recursive:true});rmSync(f.records,{recursive:true});
  const settings=structuredClone(seed.settings);
  const commit=(planner:string)=>{settings.roles.planner=planner;putPrivate(f.product,"supertaskr.yaml",JSON.stringify(settings));privateGit(f.product,["add","supertaskr.yaml"]);privateGit(f.product,["commit","-qm","Explicit planner role"]);return privateGit(f.product,["rev-parse","HEAD"]);};
  const load=(revision:string)=>loadProjectSettings({productRoot:f.product,productRevision:revision,tool});
  return {...f,toolRoot:f.tool,tool,seed,settings,commit,load};
}
test("shared role normalization preserves one exact model/vehicle without selecting an effect harness",()=>{
  for(const [requested,model,vehicle] of [["gpt-6.1-sol","gpt-6.1-sol",null],[" codex/gpt-6.1-sol @S3 ","codex/gpt-6.1-sol","S3"],["claude-opus-5@fresh","claude-opus-5","fresh"]]){
    const result=normalizeProjectRoleModel(requested);expect(result).toEqual({status:"ready",selection:{requested,model,vehicle}});expect(Object.isFrozen(result)).toBe(true);
    if(result.status!=="ready")throw Error(JSON.stringify(result));expect(Object.isFrozen(result.selection)).toBe(true);expect(result.selection).not.toHaveProperty("harness");
  }
  for(const requested of [undefined,null,{},"","gpt-6.1-sol@","gpt-6.1-sol@fresh + claude-opus-5@S3","gpt-6.1-sol@fresh (annotation)","gpt-6.1-sol@human","x".repeat(1025)]){
    expect(normalizeProjectRoleModel(requested)).toMatchObject({status:"cannot-run",code:3,reason:"project-role-selection-unsupported"});
  }
});
test("canonical committed planner selection names exact requested CLI model, vehicle and session defaults",()=>{
  const f=fixture();try{
    for(const [requested,vehicle] of [["claude-opus-5@subagent","subagent"],["claude/claude-opus-5@fresh","fresh"],["claude-opus-5",null],[" claude-opus-5 @fresh ","fresh"],["claude-opus-5@S3","S3"]]){
      const revision=f.commit(requested!),loaded=f.load(revision),selection=resolveProjectRole(loaded,"planner");
      expect(selection).toMatchObject({status:"ready",selection:{role:"planner",requested,harness:"claude",model:"claude-opus-5",vehicle,sessionPolicy:{default:f.settings.session_policy.default,warnAfterTurns:f.settings.session_policy.warn_after_turns}},provenance:{productRevision:revision,configurationDigest:expect.stringMatching(/^sha256:[0-9a-f]{64}$/),toolManifestDigest:f.tool.manifestDigest}});
      expect(Object.isFrozen(selection)).toBe(true);if(selection.status!=="ready")throw Error(JSON.stringify(selection));expect(Object.isFrozen(selection.selection.sessionPolicy)).toBe(true);expect(selection.selection).not.toHaveProperty("nativeSessionId");
      putPrivate(f.product,"supertaskr.yaml","working: [\n");expect(resolveProjectRole(f.load(revision),"planner")).toEqual(selection);
    }
  }finally{f.cleanup();}
});
test("role effects refuse missing, working and seed inputs without account defaults or private context",()=>{
  const f=fixture();try{
    expect(resolveProjectRole(f.load(f.options.productRevision),"planner")).toMatchObject({status:"cannot-run",code:3,reason:"project-settings-missing"});
    expect(resolveProjectRole(f.seed,"planner")).toMatchObject({status:"cannot-run",code:3,reason:"project-role-committed-required"});
    f.commit("claude-opus-5");
    expect(resolveProjectRole(loadWorkingProjectSettings({productRoot:f.product,tool:f.tool}),"planner")).toMatchObject({status:"cannot-run",code:3,reason:"project-role-committed-required"});
    expect(resolveProjectRole(f.load(privateGit(f.product,["rev-parse","HEAD"])),"unconfigured-role")).toMatchObject({status:"cannot-run",code:3,reason:"project-role-unconfigured"});
  }finally{f.cleanup();}
});
test("canonical Codex planner selection preserves exact requested spelling and qualifies only the executable model",()=>{
  const f=fixture();try{
    expect(f.seed.settings.roles.planner).toBe("codex/gpt-6.1-sol@subagent");
    const original=f.commit("claude-opus-5@fresh"),old=resolveProjectRole(f.load(original),"planner");
    for(const [requested,model,vehicle] of [["codex/gpt-6.1-sol@subagent","gpt-6.1-sol","subagent"],["gpt-6.1-sol@fresh","gpt-6.1-sol","fresh"],[" gpt-6-luna @S3 ","gpt-6-luna","S3"],["codex/gpt-6.1", "gpt-6.1",null]]){
      const revision=f.commit(requested!),selected=resolveProjectRole(f.load(revision),"planner");
      expect(selected).toMatchObject({status:"ready",selection:{role:"planner",requested,harness:"codex",model,vehicle},provenance:{productRevision:revision,toolManifestDigest:f.tool.manifestDigest}});
      expect(resolveProjectRole(f.load(original),"planner")).toEqual(old);expect(old).toMatchObject({status:"ready",selection:{harness:"claude",model:"claude-opus-5"}});
    }
  }finally{f.cleanup();}
});
test("unsupported harnesses, account selectors and historical compound prose never become an executable role",()=>{
  const f=fixture();try{
    for(const requested of ["claude","codex","codex/default","codex/claude-opus-5","claude/gpt-6.1-sol","codex/codex/gpt-6.1-sol","claude/codex/gpt-6.1-sol","gemini/gpt-6.1-sol","claude/default","claude/DEFAULT","claude/auto","claude/latest","claude-opus-5@fresh + codex/gpt-6.1@fresh","claude-opus-5@fresh (annotation)","claude-opus-5@human","claude/"+"x".repeat(300)]){
      const result=resolveProjectRole(f.load(f.commit(requested)),"planner");expect(result,requested).toMatchObject({status:"cannot-run",code:3});expect(result).not.toHaveProperty("selection");
    }
  }finally{f.cleanup();}
});
for(const owner of ["model-session.js","assignment.js"]){
  test(`canonical TOOL requires the loaded ${owner} parser owner even when an omitted file remains present`,()=>{
    const f=fixture();try{
      const original=readFileSync(f.manifestPath,"utf8"),manifest=JSON.parse(original),member=`lib/parser/dist/${owner}`;
      expect(readFileSync(path.join(f.toolRoot,"dist/lib/parser/dist/pure.js"),"utf8")).toContain(`./${owner}`);
      expect(manifest.parser.files.some((entry:any)=>entry.path===member)).toBe(true);manifest.parser.files=manifest.parser.files.filter((entry:any)=>entry.path!==member);
      putPrivate(f.toolRoot,"dist/tool-manifest.json",JSON.stringify(manifest));expect(readFileSync(path.join(f.toolRoot,"dist",member)).length).toBeGreaterThan(0);
      expect(()=>loadInstalledRecordTool(f.manifestPath)).toThrow(/records-tool-runtime-mismatch/);
      putPrivate(f.toolRoot,"dist/tool-manifest.json",original);expect(loadInstalledRecordTool(f.manifestPath).manifestDigest).toBe(f.tool.manifestDigest);
    }finally{f.cleanup();}
  });
}
