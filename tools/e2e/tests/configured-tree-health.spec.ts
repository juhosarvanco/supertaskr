import { expect,test } from "@playwright/test";
import { NO_BACKGROUND_MAINTENANCE } from "./git-fixture";
import { spawnSync } from "node:child_process";
import { cpSync,existsSync,readFileSync,renameSync,rmSync,writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { configuredTreeReadings } from "../scripts/configured-tree-health.mjs";
import { loadInstalledRecordTool } from "../scripts/records-check.mjs";
import { seedProjectSettings } from "../scripts/project-settings.mjs";
import { GENERIC_RECORD_PROFILE } from "../scripts/records-validation.mjs";
import { privateRecordFixture,privateGit,putPrivate,commitPrivate,FIXTURE_ENV } from "./private-record-fixture";
import { testToolRuntime } from "../fixtures/tool-runtime";

const card=(id:string)=>`---\nid: ${id}\ntitle: Authored suggestion\nstatus: suggested\nblocked_by: []\ntouches: []\nsize: small\n---\n# ${id}: Authored suggestion\n\nAn ordinary synthetic example.\n`;
function fixture() {
  const f=privateRecordFixture(),tool=loadInstalledRecordTool(f.manifestPath),seed=seedProjectSettings({tool,recordsValidation:GENERIC_RECORD_PROFILE});
  if(seed.status!=="ready")throw Error(JSON.stringify(seed));
  const settings=structuredClone(seed.settings);
  settings.records.validation={...GENERIC_RECORD_PROFILE,budgets:{"docs/STATE.md":{warn:1000,fail:2000}}};
  const band=(id:string,marker:string,unit="cards")=>({id,metric:id,unit,healthy:"below",drift:3,breach:5,authority:{kind:"tree",name:"Explicit selected committed records",marker},measured:{at:"authored fixture",reason:"Representative positive and negative observations"}});
  settings.bands=[{...band("document-room","docs-headroom/docs/STATE.md","% of warn line"),healthy:"above",drift:10,breach:1},
    band("suggestions","triage/live-suggestions"),band("oldest","triage/oldest-suggestion-days","days"),band("flow","triage/net-arrivals-per-window")];
  putPrivate(f.records,"docs/STATE.md","# Private fixture state\n\nCommitted state.\n");
  putPrivate(f.records,"docs/tasks/T-010-waiting.md",card("T-010"));putPrivate(f.records,"docs/tasks/archived/T-099-old.md",card("T-099"));
  commitPrivate(f.records,"2026-10-01T12:00:00Z");
  const checkpoint=spawnSync("git",["-C",f.records,...NO_BACKGROUND_MAINTENANCE,"commit","--allow-empty","-qm","Checkpoint: authored window"],{encoding:"utf8",
    env:{...FIXTURE_ENV,GIT_AUTHOR_DATE:"2026-10-05T12:00:00Z",GIT_COMMITTER_DATE:"2026-10-05T12:00:00Z"}});
  expect(checkpoint.status,checkpoint.stderr).toBe(0);
  putPrivate(f.records,"docs/tasks/T-020-arrival.md",card("T-020"));
  putPrivate(f.records,"docs/tasks/T-030-ready.md",card("T-030").replace("status: suggested","status: ready"));
  const recordsRevision=commitPrivate(f.records,"2026-10-06T12:00:00Z");
  const commit=()=>{putPrivate(f.product,"supertaskr.yaml",JSON.stringify(settings));privateGit(f.product,["add","supertaskr.yaml"]);privateGit(f.product,["commit","-qm","Explicit private tree selectors"]);return privateGit(f.product,["rev-parse","HEAD"]);};
  const productRevision=commit();
  return {...f,toolRoot:f.tool,tool,settings,productRevision,recordsRevision,commit};
}
test("committed selected tree facts ignore poisoned working and PRODUCT documents and preserve canonical math",()=>{
  const f=fixture();try {
    const expectedSize=Buffer.byteLength("# Private fixture state\n\nCommitted state.\n");
    putPrivate(f.records,"docs/STATE.md","Working poison ".repeat(200));putPrivate(f.records,"docs/tasks/T-020-arrival.md","malformed working poison\n");
    putPrivate(f.product,"docs/STATE.md","PRODUCT private decoy");putPrivate(f.product,"docs/tasks/T-666-wrong.md",card("T-666"));
    const result=configuredTreeReadings({productRoot:f.product,productRevision:f.productRevision,tool:f.tool,now:Date.parse("2026-10-20T12:00:00Z")});
    expect(result.receipt.recordsCommit).toBe(f.recordsRevision);
    expect(result.readings.get("document-room")?.value).toBe((1000-expectedSize)/10);
    expect(result.readings.get("suggestions")?.value).toBe(2);expect(result.readings.get("oldest")?.value).toBe(19);expect(result.readings.get("flow")?.value).toBe(1);
    expect(result.readings.get("document-room")?.derivation).toContain("supertaskr.yaml records.validation.budgets");
    expect(result.readings.get("oldest")?.derivation).toContain(f.recordsRevision);expect(result.observedAt).toBe("2026-10-20T12:00:00.000Z");
    expect(readFileSync(path.join(f.product,"docs/STATE.md"),"utf8")).toBe("PRODUCT private decoy");
  }finally{f.cleanup();}
});
test("generic flow inspects suggestion status at deletion and never counts a ready card as a suggestion",()=>{
  const f=fixture();try {
    rmSync(path.join(f.records,"docs/tasks/T-010-waiting.md"));commitPrivate(f.records,"2026-10-07T12:00:00Z");
    const result=configuredTreeReadings({productRoot:f.product,productRevision:f.productRevision,tool:f.tool,now:Date.parse("2026-10-20T12:00:00Z")});
    expect(result.readings.get("suggestions")?.value).toBe(1);expect(result.readings.get("oldest")?.value).toBe(14);expect(result.readings.get("flow")?.value).toBe(0);
    expect(result.readings.get("flow")?.derivation).toContain("1 suggestion card(s) added, 1 dispositioned");
  }finally{f.cleanup();}
});
test("tree selectors require explicit budgets and binding and never substitute a ROOT board",()=>{
  const f=fixture();try {
    const read=()=>configuredTreeReadings({productRoot:f.product,productRevision:privateGit(f.product,["rev-parse","HEAD"]),tool:f.tool});
    (f.settings.bands[0] as any).authority.marker="docs-headroom/docs/unknown.md";f.commit();expect(read).toThrow("health-tree-budget-unconfigured");
    (f.settings.bands[0] as any).authority.marker="invented-reader";f.commit();expect(read).toThrow("health-tree-authority-unsupported");
    (f.settings.bands[0] as any).authority.marker="docs-headroom/docs/STATE.md";f.commit();
    rmSync(path.join(f.product,".supertaskr"),{recursive:true});putPrivate(f.product,"docs/STATE.md","No binding decoy");
    expect(read).toThrow("health-records-not-bound");expect(existsSync(path.join(f.product,"docs/INDEX.md"))).toBe(false);
  }finally{f.cleanup();}
});
test("tree history refuses incomplete cuts and a held physical-origin verifier rejects copied-history replacement",()=>{
  const f=fixture(),original=f.records+"-original";try {
    const read=()=>configuredTreeReadings({productRoot:f.product,productRevision:f.productRevision,tool:f.tool});
    writeFileSync(path.join(f.records,".git/shallow"),`${f.recordsRevision}\n`);
    // The existing strict original-repository guard refuses shallow routing
    // before any history is priced; do not bypass it for this reader.
    expect(read).toThrow("OPERATION_OBJECT_ROUTING");rmSync(path.join(f.records,".git/shallow"));
    const observed=read();renameSync(f.records,original);cpSync(original,f.records,{recursive:true});
    expect(observed.verify).toThrow("health-tree-origin-changed");
    rmSync(f.records,{recursive:true});renameSync(original,f.records);expect(()=>observed.verify()).not.toThrow();
  }finally{f.cleanup();}
});
test("tree reader membership is required even when the omitted runtime file remains present",()=>{
  const f=fixture();try {
    const bytes=readFileSync(f.manifestPath),manifest=JSON.parse(bytes.toString("utf8"));
    manifest.runtime.files=manifest.runtime.files.filter((entry:{path:string})=>entry.path!=="tools/e2e/scripts/configured-tree-health.mjs");
    manifest.runtime.buildHash=createHash("sha256").update(JSON.stringify(manifest.runtime.files)).digest("hex");writeFileSync(f.manifestPath,JSON.stringify(manifest));
    expect(existsSync(path.join(f.toolRoot,"dist/tools/e2e/scripts/configured-tree-health.mjs"))).toBe(true);
    const read=()=>configuredTreeReadings({productRoot:f.product,productRevision:f.productRevision,tool:loadInstalledRecordTool(f.manifestPath)});
    expect(read).toThrow(/runtime/);writeFileSync(f.manifestPath,bytes);expect(read().readings.get("suggestions")?.value).toBe(2);
  }finally{f.cleanup();}
});
test("installed health executes selected committed tree readers and keeps private prose edits out of product effects",()=>{
  test.setTimeout(180000);const installed=testToolRuntime(),f=fixture();try {
    const head=privateGit(f.records,["rev-parse","HEAD"]),product=privateGit(f.product,["rev-parse","HEAD"]),index=readFileSync(path.join(f.records,".git/index"));
    const run=()=>spawnSync(process.execPath,[path.join(installed.packageRoot,"supertaskr.mjs"),"health","--root",f.product],{cwd:f.dir,encoding:"utf8",env:{...process.env,NODE_PATH:""}});
    const first=run();expect(first.status,first.stderr).toBe(1);expect(first.stdout).toContain(`committed RECORDS ${head}`);expect(first.stdout).toContain("oldest");
    putPrivate(f.records,"docs/STATE.md","Changed private note outside committed snapshot\n");
    const again=run();expect(again.status,again.stderr).toBe(1);expect(again.stdout).toContain(`committed RECORDS ${head}`);
    expect(privateGit(f.records,["rev-parse","HEAD"])).toBe(head);expect(privateGit(f.product,["rev-parse","HEAD"])).toBe(product);expect(readFileSync(path.join(f.records,".git/index"))).toEqual(index);
    expect(existsSync(path.join(f.product,".supertaskr/gate-verdict.json"))).toBe(false);
  }finally{f.cleanup();}
});
