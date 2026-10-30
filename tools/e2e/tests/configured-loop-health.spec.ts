import { expect,test } from "@playwright/test";
import { NO_BACKGROUND_MAINTENANCE } from "./git-fixture";
import { spawnSync } from "node:child_process";
import { existsSync,readFileSync,writeFileSync } from "node:fs";
import path from "node:path";
import { VERIFICATION_TIERS } from "../../../lib/parser/dist/pure.js";
import { TIERS } from "../scripts/dispatch-brief.mjs";
import { configuredTreeReadings } from "../scripts/configured-tree-health.mjs";
import { evaluateBand,loopReadings,METERS_PATH,parseMeterRecords } from "../scripts/health-bands.mjs";
import { loadInstalledRecordTool } from "../scripts/records-check.mjs";
import { seedProjectSettings } from "../scripts/project-settings.mjs";
import { GENERIC_RECORD_PROFILE } from "../scripts/records-validation.mjs";
import { privateRecordFixture,privateGit,putPrivate,commitPrivate,FIXTURE_ENV } from "./private-record-fixture";
import { testToolRuntime } from "../fixtures/tool-runtime";

function row(card:string,at:string,verdict="APPROVED",ciReds=0,tokens=500) {
  return {card,at,size:"S",tier:"bounded",seat:"executor",meters:`${tokens} tokens`,verdict,ciReds};
}
function fixture() {
  const f=privateRecordFixture(),tool=loadInstalledRecordTool(f.manifestPath),seed=seedProjectSettings({tool,recordsValidation:GENERIC_RECORD_PROFILE});
  if(seed.status!=="ready")throw Error(JSON.stringify(seed));
  expect(seed.settings.tier_budgets).toBeNull();
  const settings=structuredClone(seed.settings);
  settings.tier_budgets={bounded:{minutes:2,tokens:1000},standard:{minutes:10,tokens:5000},guarded:{minutes:15,tokens:9000}};
  const band=(id:string,marker:string,drift:number,breach:number)=>({id,metric:id,unit:id==="quality"?"flags":"% of configured tier budget",healthy:"below",drift,breach,
    authority:{kind:"tree",name:"Explicit committed loop records",marker},measured:{at:"authored foreign project",reason:"Positive and refusal controls with explicitly selected denominators"}});
  settings.bands=[band("cycle","loop/cycle-budget-used",50,70),band("tokens","loop/token-budget-used",50,90),band("quality","loop/soft-verifier",0.5,0.75)];
  const commitEmpty=(message:string,at:string)=>{
    const result=spawnSync("git",["-C",f.records,...NO_BACKGROUND_MAINTENANCE,"commit","--allow-empty","-qm",message],{encoding:"utf8",env:{...FIXTURE_ENV,GIT_AUTHOR_DATE:at,GIT_COMMITTER_DATE:at}});
    expect(result.status,result.stderr).toBe(0);
  };
  commitEmpty("Checkpoint: earlier","2026-10-01T00:00:00Z");commitEmpty("T-001: dispatch stamp","2026-10-02T00:00:00Z");
  const rows=[row("T-001","2026-10-02T00:01:00Z","REJECTED",0,500),row("T-002","2026-10-11T00:01:30Z","APPROVED",2,800)];
  putPrivate(f.records,METERS_PATH,JSON.stringify(rows[0])+"\n");commitPrivate(f.records,"2026-10-02T00:02:00Z");
  commitEmpty("Checkpoint: current","2026-10-10T00:00:00Z");commitEmpty("T-002: dispatch stamp","2026-10-11T00:00:00Z");
  putPrivate(f.records,METERS_PATH,rows.map(value=>JSON.stringify(value)).join("\n")+"\n");const recordsRevision=commitPrivate(f.records,"2026-10-11T00:02:00Z");
  const commit=()=>{putPrivate(f.product,"supertaskr.yaml",JSON.stringify(settings));privateGit(f.product,["add","supertaskr.yaml"]);privateGit(f.product,["commit","-qm","Explicit loop denominators"]);return privateGit(f.product,["rev-parse","HEAD"]);};
  const productRevision=commit();
  const read=()=>configuredTreeReadings({productRoot:f.product,productRevision:privateGit(f.product,["rev-parse","HEAD"]),tool,now:Date.parse("2026-10-20T00:00:00Z")});
  return {...f,tool,settings,rows,recordsRevision,productRevision,commit,read,commitEmpty};
}
test("configured loop shares use actual selected denominators and exact R history, never self-project budgets",()=>{
  expect(TIERS).toBe(VERIFICATION_TIERS);
  const f=fixture();try {
    const observed=f.read();
    expect(observed.readings.get("cycle")?.value).toBe(75);expect(observed.readings.get("tokens")?.value).toBe(80);expect(observed.readings.get("quality")?.value).toBe(1);
    expect(observed.readings.get("cycle")?.derivation).toContain("supertaskr.yaml tier_budgets");expect(observed.readings.get("cycle")?.derivation).not.toContain("ADR-024");
    expect(observed.readings.get("tokens")?.derivation).toContain("supertaskr.yaml tier_budgets");expect(observed.readings.get("tokens")?.derivation).not.toContain("ADR-024");
    f.commitEmpty("Unrelated subject mentioning T-002: dispatch stamp","2026-10-12T00:00:00Z");
    expect(f.read().readings.get("cycle")?.value).toBe(75);
    putPrivate(f.records,METERS_PATH,"Malformed working meters must not replace committed input\n");
    expect(f.read().readings.get("tokens")?.value).toBe(80);
  }finally{f.cleanup();}
});
test("missing loop share policy is unconfigured while denominator-free quality remains observable",()=>{
  const f=fixture();try {
    f.settings.tier_budgets=null;f.commit();expect(f.read).toThrow(/missing configuration: tier_budgets/);
    f.settings.bands=f.settings.bands.filter(band=>band.id==="quality");f.commit();expect(f.read().readings.get("quality")?.value).toBe(1);
  }finally{f.cleanup();}
});
test("unknown record tiers and unreadable or empty loop windows never yield zero healthy shares",()=>{
  const f=fixture();try {
    const unknown=f.rows.map(value=>({...value}));unknown[1]!.tier="not-a-configured-tier";
    putPrivate(f.records,METERS_PATH,unknown.map(value=>JSON.stringify(value)).join("\n")+"\n");commitPrivate(f.records,"2026-10-12T00:00:00Z");
    expect(f.read().readings.has("cycle")).toBe(false);expect(f.read().readings.has("tokens")).toBe(false);
    putPrivate(f.records,METERS_PATH,f.rows.map(value=>JSON.stringify(value)).join("\n")+"\nBad captured record\n");commitPrivate(f.records,"2026-10-13T00:00:00Z");
    expect(f.read().readings.size).toBe(0);
    putPrivate(f.records,METERS_PATH,f.rows.map(value=>JSON.stringify(value)).join("\n")+"\n");commitPrivate(f.records,"2026-10-14T00:00:00Z");
    f.commitEmpty("Checkpoint: observed empty later window","2026-10-15T00:00:00Z");expect(f.read().readings.size).toBe(0);
  }finally{f.cleanup();}
});
test("incomplete quality captures and nonfinite arithmetic remain unread instead of becoming healthy",()=>{
  const before=[row("T-001","2026-10-02T00:00:00Z","APPROVED",0),row("T-003","2026-10-03T00:00:00Z","REJECTED",0)];
  const later=[row("T-002","2026-10-11T00:00:00Z","APPROVED",2)];
  const parse=(rows:any[])=>parseMeterRecords(rows.map(value=>JSON.stringify(value)).join("\n")).records;
  expect(loopReadings({cards:[],sinceSec:null,earlier:parse(before),later:parse(later)}).get("loop/soft-verifier")?.value).toBe(1);
  const incomplete:any=before[1];delete incomplete.verdict;
  expect(loopReadings({cards:[],sinceSec:null,earlier:parse(before),later:parse(later)}).has("loop/soft-verifier")).toBe(false);
  const band:any={id:"arithmetic",healthy:"above",drift:10,breach:1,authority:{kind:"readings",name:"Captured arithmetic"}};
  for(const value of [Infinity,-Infinity,NaN])expect(evaluateBand(band,{value,derivation:"nonfinite input"}).state).toBe("unread");
});
test("installed health executes committed loop readers and refuses an absent share policy without product effects",()=>{
  test.setTimeout(180000);const installed=testToolRuntime(),f=fixture();try {
    const run=()=>spawnSync(process.execPath,[path.join(installed.packageRoot,"supertaskr.mjs"),"health","--root",f.product],{cwd:f.dir,encoding:"utf8",env:{...process.env,NODE_PATH:""}});
    const result=run();expect(result.status,result.stderr).toBe(1);expect(result.stdout).toContain("75");expect(result.stdout).toContain("80");expect(result.stdout).toContain("quality");
    expect(privateGit(f.product,["rev-parse","HEAD"])).toBe(f.productRevision);expect(privateGit(f.records,["rev-parse","HEAD"])).toBe(f.recordsRevision);
    expect(existsSync(path.join(f.product,".supertaskr/gate-verdict.json"))).toBe(false);
    f.settings.tier_budgets=null;f.commit();const records=privateGit(f.records,["rev-parse","HEAD"]),index=readFileSync(path.join(f.records,".git/index"));
    const refused=run();expect(refused.status).toBe(3);expect(refused.stderr).toContain("tier_budgets-unconfigured");
    expect(privateGit(f.records,["rev-parse","HEAD"])).toBe(records);expect(readFileSync(path.join(f.records,".git/index"))).toEqual(index);
  }finally{f.cleanup();}
});
