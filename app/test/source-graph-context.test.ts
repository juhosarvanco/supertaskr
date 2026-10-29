// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { parseProjectFromFiles, type FileEntry } from "@supertaskr/parser/pure";
const ipc=vi.hoisted(()=>({changed:null as null|((event:{payload:unknown})=>void),pending:new Map<string,((value:unknown)=>void)[]>(),status:null as unknown,
  architecture:null as null|((event:{payload:unknown})=>void),
  calls:[] as {command:string,args:Record<string,unknown>|undefined}[]}));
vi.mock("@tauri-apps/api/core",()=>({invoke:(command:string,args?:Record<string,unknown>)=>{
  ipc.calls.push({command,args});
  if(command==="docs_snapshot")return Promise.resolve(ipc.status);
  return new Promise(resolve=>{const queue=ipc.pending.get(command)??[];queue.push(resolve);ipc.pending.set(command,queue);});
}}));
vi.mock("@tauri-apps/api/event",()=>({emit:()=>Promise.resolve(),listen:(event:string,handler:(event:{payload:unknown})=>void)=>{if(event==="docs-changed")ipc.changed=handler;else if(event==="architecture-changed")ipc.architecture=handler;return Promise.resolve(()=>{});}}));
const snapshot=(context:number,home:string,files:FileEntry[]=[])=>({seq:context,projectDir:"/product",generatedAtMs:context,files,records:{
  selectionSequence:10,contextSequence:context,layout:"split",recordsDir:home,associationId:"project",rootIncarnation:`1:${context}`,
  docsIncarnation:`2:${context}`,availability:"available",finding:null,contentRevision:null}});
const scope=(value:ReturnType<typeof snapshot>)=>({seq:value.seq,projectDir:value.projectDir,selectionSequence:10,contextSequence:value.records.contextSequence,records:value.records});
function release(command:string,value:unknown){const resolve=ipc.pending.get(command)?.shift();expect(resolve,command).toBeDefined();resolve!(value);}
beforeEach(()=>{vi.resetModules();ipc.pending.clear();ipc.calls=[];ipc.changed=null;ipc.architecture=null;(window as unknown as Record<string,unknown>).__TAURI_INTERNALS__={};ipc.status={kind:"open",snapshot:snapshot(10,"/records-one")};});
afterEach(()=>{delete (window as unknown as Record<string,unknown>).__TAURI_INTERNALS__;});
it("a same-product records switch drops a late index result and keeps the newer index flight active",async()=>{
  const store=await import("../src/lib/watcher-store");await store.startDocsWatcher();
  const first=store.runIndexRepo(store.indexSelectionToken(store.getShellState().docs));expect(store.getShellState().indexing).toBe(true);
  expect(ipc.calls.find(call=>call.command==="index_repo")?.args).toEqual({expectedSelection:{selectionSequence:10,contextSequence:10}});
  ipc.changed!({payload:snapshot(20,"/records-two")});expect(store.getShellState().indexing).toBe(false);
  const second=store.runIndexRepo(store.indexSelectionToken(store.getShellState().docs));
  release("index_repo",{kind:"indexed",files:777,scope:scope(snapshot(10,"/records-one"))});await first;
  expect(store.getShellState().indexOutcome).toBeNull();expect(store.getShellState().indexing).toBe(true);
  release("index_repo",{kind:"indexed",files:2,scope:scope(snapshot(20,"/records-two"))});await second;
  expect(store.getShellState().indexOutcome).toMatchObject({kind:"indexed",files:2});expect(store.getShellState().indexing).toBe(false);
});
it("a rendered old pair is never replaced by a newer store pair before the command",async()=>{
  const store=await import("../src/lib/watcher-store");await store.startDocsWatcher();
  const rendered=store.indexSelectionToken(store.getShellState().docs);
  ipc.changed!({payload:snapshot(20,"/records-two")});
  await store.runIndexRepo(rendered);await store.runIndexRepo();
  expect(ipc.calls.filter(call=>call.command==="index_repo")).toEqual([]);
  const current=store.runIndexRepo(store.indexSelectionToken(store.getShellState().docs));
  expect(ipc.calls.find(call=>call.command==="index_repo")?.args).toEqual({expectedSelection:{selectionSequence:10,contextSequence:20}});
  release("index_repo",{kind:"indexed",files:2,scope:scope(snapshot(20,"/records-two"))});await current;
  expect(store.getShellState().indexOutcome).toMatchObject({kind:"indexed",files:2});
});
it("map and detail answers retain their original context through a same-product records switch",async()=>{
  const store=await import("../src/lib/watcher-store");await store.startDocsWatcher();
  const map=await import("../src/architecture/rollup-source");
  const first=map.loadRollup();const detail=map.loadDetail("c:C-01");
  await flush();
  ipc.changed!({payload:snapshot(20,"/records-two")});
  release("arch_rollup",{kind:"unreadable",message:"foreign original",scope:scope(snapshot(10,"/records-one"))});await first;
  expect(map.getRollupState()).toEqual({kind:"loading"});
  release("arch_detail",{kind:"answered",detail:{kind:"unknown",target:"c:C-01"},scope:scope(snapshot(10,"/records-one"))});
  expect((await detail).kind).toBe("unavailable");expect(map.cachedDetail("c:C-01")).toBeUndefined();
  release("arch_rollup",{kind:"unreadable",message:"selected replacement",scope:scope(snapshot(20,"/records-two"))});
  await Promise.resolve();await Promise.resolve();
  expect(map.getRollupState()).toMatchObject({kind:"unavailable",message:"selected replacement"});
});

const component:FileEntry={path:"docs/architecture/components/C-01-core.md",content:[
  "---","id: C-01","name: Core","paths: [src/**]","depends_on: []","touch_slugs: []","---","Core responsibility.",
].join("\n")};
const picture=(files:number)=>({kind:"ready",graphBytes:100,rollup:{schema:1,
  components:[{id:"C-01",files}],edges:[],findings:[],
  stats:{files,symbols:0,edges:0,components:1,mapped:files,unmapped:0,truncatedSymbols:false}}});
const detail=(file:string)=>({kind:"answered",detail:{kind:"component",id:"C-01",files:[file],truncated:false,
  rows:{files:[{id:`f:${file}`,path:file,lang:"ts",loc:1,symbols:[]}],edges:[],packages:[],unresolved:[]}}});
const flush=async()=>{await Promise.resolve();await Promise.resolve();await Promise.resolve();};

it("refreshes graph readers on an accepted rebuild and registry changes while ordinary notes stay quiet",async()=>{
  const store=await import("../src/lib/watcher-store");await store.startDocsWatcher();
  const map=await import("../src/architecture/rollup-source");
  const first=map.loadRollup();await flush();release("arch_rollup",{...picture(1),scope:scope(snapshot(10,"/records-one"))});await first;
  const pulled=map.loadDetail("c:C-01");release("arch_detail",{...detail("src/old.ts"),scope:scope(snapshot(10,"/records-one"))});await pulled;
  expect(map.cachedDetail("c:C-01")).toBeDefined();
  const epoch=map.getRollupGeneration();
  ipc.changed!({payload:{...snapshot(10,"/records-one",[{path:"docs/plans/note.md",content:"edited"}]),seq:11}});
  expect(map.getRollupGeneration()).toBe(epoch);expect(ipc.pending.get("arch_rollup")).toHaveLength(0);
  const index=store.runIndexRepo(store.indexSelectionToken(store.getShellState().docs));
  release("index_repo",{kind:"indexed",files:2,scope:scope(snapshot(10,"/records-one"))});await index;
  expect(map.getRollupGeneration()).toBe(epoch+1);expect(map.cachedDetail("c:C-01")).toBeUndefined();
  release("arch_rollup",{...picture(2),scope:scope(snapshot(10,"/records-one"))});await flush();
  expect(map.getRollupState()).toMatchObject({kind:"ready",rollup:{stats:{files:2}}});
  ipc.changed!({payload:{...snapshot(10,"/records-one",[component]),seq:12}});
  expect(map.getRollupGeneration()).toBe(epoch+2);
  await flush();
  release("arch_rollup",{...picture(2),scope:scope(snapshot(10,"/records-one"))});await flush();
  ipc.changed!({payload:{...snapshot(10,"/records-one",[component,{path:"docs/plans/note.md",content:"again"}]),seq:13}});
  expect(map.getRollupGeneration()).toBe(epoch+2);expect(ipc.pending.get("arch_rollup")).toHaveLength(0);
});

it("the mounted map retires open panels and pulled paths across records switches and successful rebuilds",async()=>{
  (globalThis as unknown as Record<string,unknown>).IS_REACT_ACT_ENVIRONMENT=true;
  ipc.status={kind:"open",snapshot:snapshot(10,"/records-one",[component])};
  const store=await import("../src/lib/watcher-store");await store.startDocsWatcher();
  const {MapView}=await import("../src/architecture/MapView");
  const host=document.createElement("div");document.body.appendChild(host);const root=createRoot(host);
  const render=()=>root.render(createElement(MapView,{model:parseProjectFromFiles([component]),indexing:false,indexOutcome:null,onRunIndex:()=>{}}));
  const click=()=>{const node=host.querySelector('[data-component-id="C-01"]');expect(node).not.toBeNull();node!.dispatchEvent(new MouseEvent("click",{bubbles:true}));};
  try {
    await act(async()=>{render();await flush();});
    await act(async()=>{release("arch_rollup",{...picture(1),scope:scope(snapshot(10,"/records-one"))});await flush();});
    await act(async()=>{click();release("arch_detail",{...detail("src/records-one.ts"),scope:scope(snapshot(10,"/records-one"))});await flush();});
    expect(host.querySelector('[data-testid="map-panel"]')?.textContent).toContain("records-one.ts");
    // A second already-fulfilled cache pull is queued immediately before the
    // switch. Its local then-handler must not hydrate the replacement pane.
    await act(async()=>{click();ipc.changed!({payload:snapshot(20,"/records-two",[component])});await flush();});
    expect(host.querySelector('[data-testid="map-panel"]')).toBeNull();expect(host.textContent).not.toContain("records-one.ts");
    await act(async()=>{release("arch_rollup",{...picture(1),scope:scope(snapshot(20,"/records-two"))});await flush();click();
      release("arch_detail",{...detail("src/records-two.ts"),scope:scope(snapshot(20,"/records-two"))});await flush();});
    expect(host.querySelector('[data-testid="map-panel"]')?.textContent).toContain("records-two.ts");
    await act(async()=>{const index=store.runIndexRepo(store.indexSelectionToken(store.getShellState().docs));
      release("index_repo",{kind:"indexed",files:2,scope:scope(snapshot(20,"/records-two"))});await index;await flush();});
    expect(host.querySelector('[data-testid="map-panel"]')).toBeNull();expect(host.textContent).not.toContain("records-two.ts");
    await act(async()=>{release("arch_rollup",{...picture(2),scope:scope(snapshot(20,"/records-two"))});await flush();click();
      release("arch_detail",{...detail("src/rebuilt.ts"),scope:scope(snapshot(20,"/records-two"))});await flush();});
    expect(host.querySelector('[data-testid="map-panel"]')?.textContent).toContain("rebuilt.ts");
    expect(host.textContent).not.toContain("records-one.ts");expect(host.textContent).not.toContain("records-two.ts");
    await act(async()=>{ipc.architecture!({payload:{scope:{...scope(snapshot(10,"/records-one")),seq:40}}});await flush();});
    expect(host.querySelector('[data-testid="map-panel"]')?.textContent).toContain("rebuilt.ts");
    await act(async()=>{ipc.architecture!({payload:{scope:{...scope(snapshot(20,"/records-two")),seq:41}}});await flush();});
    expect(host.querySelector('[data-testid="map-panel"]')).toBeNull();
    await act(async()=>{release("arch_rollup",{...picture(3),scope:scope(snapshot(20,"/records-two"))});await flush();click();
      release("arch_detail",{...detail("src/headless.ts"),scope:scope(snapshot(20,"/records-two"))});await flush();});
    expect(host.querySelector('[data-testid="map-panel"]')?.textContent).toContain("headless.ts");
    expect(host.textContent).not.toContain("rebuilt.ts");
    await act(async()=>{ipc.architecture!({payload:{scope:{...scope(snapshot(20,"/records-two")),seq:41}}});await flush();});
    expect(host.querySelector('[data-testid="map-panel"]')?.textContent).toContain("headless.ts");
  } finally {await act(async()=>root.unmount());host.remove();}
});
