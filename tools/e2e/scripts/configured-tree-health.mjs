/** Selected health observations use committed RECORDS and exact history cuts.
 * These facts grant no dispatch, write or publication permission. */
import { execFileSync } from "node:child_process";
import { createProjectRuntime } from "./project-runtime.mjs";
import { captureCommittedInputs } from "./records.mjs";
import { resolveWorkspace } from "./workspace.mjs";
import { captureOperationRepository } from "./durable-operation.mjs";
import { operationContent } from "./operation-record.mjs";
import { requireInstalledRuntimeAssets } from "./records-check.mjs";
import { DOC_BUDGETS, isTaskCardPath } from "./docs-scan.mjs";
import { cardMeters, docHeadroomReading, loopReadings, METERS_PATH, parseMeterRecords, suggestionFlowReading, suggestionReadings } from "./health-bands.mjs";

/** @param {string} code @returns {never} */
function fail(code) { throw Object.assign(new Error(code),{code}); }
/** Fixed factual Git queries, never current-HEAD policy or a working private
 * document. The canonical capture validates the original repository first.
 * @param {string} root @param {string[]} argv */
function git(root,argv) {
  try {return execFileSync("git",["--no-replace-objects","--literal-pathspecs","-C",root,...argv],{encoding:"utf8",stdio:["ignore","pipe","pipe"],maxBuffer:16*1024*1024,
    env:{...process.env,GIT_NO_LAZY_FETCH:"1",GIT_OPTIONAL_LOCKS:"0"}}).replace(/\n$/,"");}
  catch {fail("health-tree-history-unavailable");}
}
/** @param {string} value */
function seconds(value) { if(!/^-?[0-9]+$/.test(value) || !Number.isSafeInteger(Number(value)))fail("health-tree-history-unavailable");return Number(value); }
const COUNTS="triage/live-suggestions",AGES="triage/oldest-suggestion-days",FLOW="triage/net-arrivals-per-window",DOCS="docs-headroom/";
const CYCLE="loop/cycle-budget-used",TOKENS="loop/token-budget-used",SOFT="loop/soft-verifier";
/** @param {string} file */
function flatTask(file) { return isTaskCardPath(file)&&file.split("/").length===3; }
/** Read only the explicitly selected finite readers. No marker is inferred
 * from a band's display id, name, or presence of private files.
 * @param {{productRoot:string,productRevision:string,tool:any,now?:number}} options */
export function configuredTreeReadings(options) {
  if(!options || Object.keys(options).some(key=>!["productRoot","productRevision","tool","now"].includes(key)))fail("health-tree-request");
  requireInstalledRuntimeAssets(options.tool,["tools/e2e/scripts/configured-tree-health.mjs","tools/e2e/scripts/health-bands.mjs","tools/e2e/scripts/project-runtime.mjs"]);
  const runtime=createProjectRuntime({productRoot:options.productRoot,productRevision:options.productRevision,tool:options.tool}),bands=/** @type {import("./health-bands.config.mjs").Band[]} */(runtime.section("bands"));
  const selected=bands.filter(band=>band.authority.kind==="tree"),now=options.now??Date.now();
  if(!Number.isFinite(now)||!Number.isFinite(new Date(now).getTime()))fail("health-tree-observation-time");
  const profile=runtime.settings.records.validation;
  const budgets=/** @type {Record<string,{warn:number,fail:number}|null>} */(profile.kind==="generic"?profile.budgets:DOC_BUDGETS);
  const shareSelected=selected.some(band=>[CYCLE,TOKENS].includes(band.authority.marker??""));
  const tierBudgets=shareSelected?runtime.section("tier_budgets"):null;
  for(const band of selected) {
    const marker=band.authority.marker;
    if(!marker || ![COUNTS,AGES,FLOW,CYCLE,TOKENS,SOFT].includes(marker) && !marker.startsWith(DOCS))fail("health-tree-authority-unsupported");
    if(marker.startsWith(DOCS)) {
      const budget=budgets[marker.slice(DOCS.length)];
      if(!budget || !Number.isFinite(budget.warn) || budget.warn<=0)fail("health-tree-budget-unconfigured");
    }
  }
  const workspace=resolveWorkspace({productRoot:runtime.provenance.productRoot,mode:"development",commit:options.productRevision});
  if(workspace.layout!=="split")fail("health-records-not-bound");
  const recordsRevision=git(workspace.recordsRoot,["rev-parse","--verify","HEAD"]);
  const original=captureOperationRepository(workspace.recordsRoot,recordsRevision,{forEffect:false});
  const inputs=captureCommittedInputs({productRoot:workspace.productRoot,productRevision:options.productRevision,recordsRevision});
  function verify() {
    runtime.section("bands");
    const current=resolveWorkspace({productRoot:workspace.productRoot,mode:"development",commit:options.productRevision});
    if(current.layout!=="split" || operationContent(current)!==operationContent(workspace) ||
      operationContent(captureOperationRepository(workspace.recordsRoot,recordsRevision,{forEffect:false}))!==operationContent(original))fail("health-tree-origin-changed");
    requireInstalledRuntimeAssets(options.tool,["tools/e2e/scripts/configured-tree-health.mjs"]);
  }
  /** @type {Map<string,import("./health-bands.mjs").Reading>} */const readings=new Map();
  const markers=new Set(selected.map(band=>/** @type {string} */(band.authority.marker)));
  const historical=markers.has(AGES)||markers.has(FLOW)||[CYCLE,TOKENS,SOFT].some(marker=>markers.has(marker));
  if(historical && git(workspace.recordsRoot,["rev-parse","--is-shallow-repository"])!=="false")fail("health-tree-history-incomplete");
  /** @type {Map<string,import("./health-bands.mjs").Reading>} */const observations=new Map();
  if(markers.has(COUNTS)||markers.has(AGES)) {
    const suggestions=inputs.tasks.filter(task=>flatTask(task.relativePath)&&task.fields.status==="suggested").map(task=>{
      const addedSec=markers.has(AGES)?seconds(git(workspace.recordsRoot,["log","--diff-filter=A","--format=%ct","-1",recordsRevision,"--",task.relativePath])):null;
      if(addedSec!==null && addedSec>now/1000)fail("health-tree-history-future");
      return {path:task.relativePath,addedSec};
    });
    for(const [marker,reading] of suggestionReadings(suggestions,now))observations.set(marker,reading);
  }
  if(markers.has(FLOW)) {
    const checkpoint=git(workspace.recordsRoot,["log","-1","--grep=^Checkpoint:","--format=%H",recordsRevision]);
    if(checkpoint) {
      // Generic tasks have no suggestion-specific filename. Inspect the real
      // status in each addition/deletion cut through the canonical card reader.
      // Linear private history is supported; a merge needs a separately defined
      // parent policy and must never silently select a convenient parent.
      const commits=git(workspace.recordsRoot,["rev-list",`${checkpoint}..${recordsRevision}`]).split("\n").filter(Boolean);
      const captures=new Map([[recordsRevision,inputs]]),arrivals=new Set(),dispositions=new Set();
      /** @param {string} commit @param {string} file */
      function suggested(commit,file) {
        let captured=captures.get(commit);
        if(!captured){captured=captureCommittedInputs({productRoot:workspace.productRoot,productRevision:options.productRevision,recordsRevision:commit});captures.set(commit,captured);}
        const task=captured.tasks.find(row=>row.relativePath===file);
        if(!task)fail("health-tree-history-unavailable");
        return task.fields.status==="suggested";
      }
      for(const commit of commits) {
        const parents=git(workspace.recordsRoot,["rev-list","--parents","-n","1",commit]).split(" ").slice(1);
        if(parents.length!==1)fail("health-tree-history-unsupported");
        const changes=git(workspace.recordsRoot,["diff-tree","--no-commit-id","--name-status","--no-renames","-r","-z",/** @type {string} */(parents[0]),commit,"--","docs/tasks/"]).split("\0").filter(Boolean);
        if(changes.length%2!==0)fail("health-tree-history-unavailable");
        for(let at=0;at<changes.length;at+=2) {
          const kind=changes[at],file=/** @type {string} */(changes[at+1]);
          if(!flatTask(file))continue;
          if(kind==="A"&&suggested(commit,file))arrivals.add(file);
          if(kind==="D"&&suggested(/** @type {string} */(parents[0]),file))dispositions.add(file);
        }
      }
      observations.set(FLOW,suggestionFlowReading(checkpoint,{arrivals:[...arrivals],dispositions:[...dispositions]}));
    }
  }
  if([CYCLE,TOKENS,SOFT].some(marker=>markers.has(marker))) {
    const parsed=inputs.paths("records").includes(METERS_PATH)?parseMeterRecords(inputs.read("records",METERS_PATH).content):{records:[],problems:[]};
    const checkpoints=git(workspace.recordsRoot,["log","-2","--grep=^Checkpoint:","--format=%H%x00%ct",recordsRevision]).split("\n").filter(Boolean).map(row=>{
      const fields=row.split("\0");if(fields.length!==2)fail("health-tree-history-unavailable");
      return {hash:/** @type {string} */(fields[0]),sec:seconds(/** @type {string} */(fields[1]))};
    });
    const current=checkpoints[0]??null,previous=checkpoints[1]??null;
    /** @param {number|null} from @param {number|null} to */
    const between=(from,to)=>parsed.records.filter(row=>(from===null||row.atSec>=from)&&(to===null||row.atSec<to));
    const considered=previous===null?parsed.records:between(previous.sec,null);
    const cards=tierBudgets===null?[]:cardMeters({records:considered,budgets:/** @type {any} */(tierBudgets),budgetAuthority:"supertaskr.yaml tier_budgets",
      dispatchedSec(card){
        const prefix=`${card}: dispatch stamp`;
        const rows=git(workspace.recordsRoot,["log","--fixed-strings",`--grep=${prefix}`,"--format=%ct%x00%s",recordsRevision]).split("\n");
        for(const row of rows){const at=row.indexOf("\0");if(at>=0&&row.slice(at+1).startsWith(prefix))return seconds(row.slice(0,at));}
        return null;
      }});
    for(const [marker,reading] of loopReadings({cards,sinceSec:current?.sec??null,
      earlier:previous===null||current===null?undefined:between(previous.sec,current.sec),later:current===null?undefined:between(current.sec,null),
      since:current===null?"the first reading on record":`Checkpoint: ${current.hash.slice(0,7)}`,problems:parsed.problems,budgetAuthority:"supertaskr.yaml tier_budgets"}))observations.set(marker,reading);
  }
  for(const band of selected) {
    const marker=/** @type {string} */(band.authority.marker);
    const reading=marker.startsWith(DOCS)?docHeadroomReading(marker.slice(DOCS.length),inputs.read("records",marker.slice(DOCS.length)).bytes.length,/** @type {{warn:number,fail:number}} */(budgets[marker.slice(DOCS.length)]),
      profile.kind==="generic"?"supertaskr.yaml records.validation.budgets":"selected dogfood DOC_BUDGETS"):observations.get(marker);
    if(reading)readings.set(band.id,{value:reading.value,derivation:`${reading.derivation}; RECORDS ${recordsRevision}; observed ${new Date(now).toISOString()}`});
  }
  verify();
  return {readings,receipt:inputs.receipt,observedAt:new Date(now).toISOString(),verify};
}
