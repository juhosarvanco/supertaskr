// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
const ipc=vi.hoisted(()=>({status:null as unknown,changed:null as null|((event:{payload:unknown})=>void),
  calls:[] as {command:string,args:Record<string,unknown>|undefined}[],pending:new Map<string,((value:unknown)=>void)[]>()}));
vi.mock("@tauri-apps/api/core",()=>({invoke:(command:string,args?:Record<string,unknown>)=>{
  ipc.calls.push({command,args});if(command==="docs_snapshot")return Promise.resolve(ipc.status);
  return new Promise(resolve=>{const queue=ipc.pending.get(command)??[];queue.push(resolve);ipc.pending.set(command,queue);});
}}));
vi.mock("@tauri-apps/api/event",()=>({emit:()=>Promise.resolve(),listen:(name:string,fn:typeof ipc.changed)=>{if(name==="docs-changed")ipc.changed=fn;return Promise.resolve(()=>{});}}));
const probe={roadmap:false,tasks:false,architecture:false,git:false};
const records=(context=10)=>({selectionSequence:10,contextSequence:context,layout:"colocated",recordsDir:"/code",associationId:null,
  rootIncarnation:"1:2",docsIncarnation:null,availability:"noDocs",finding:null,contentRevision:null});
const scope=(context=10)=>({seq:context,projectDir:"/code",selectionSequence:10,contextSequence:context,records:records(context)});
const noDocs=()=>({kind:"noDocs",projectDir:"/code",probe,scope:scope()});
const snapshot=(context=20)=>({seq:context,projectDir:"/code",generatedAtMs:context,files:[],records:{...records(context),layout:"split",recordsDir:"/notes",availability:"available",rootIncarnation:"3:4",docsIncarnation:"3:5",associationId:"new-project"}});
function release(command:string,value:unknown){const resolve=ipc.pending.get(command)?.shift();expect(resolve).toBeDefined();resolve!(value);}
const call=(command:string)=>ipc.calls.filter(row=>row.command===command).slice(-1)[0]!;
const attempt=(command:string)=>{const args=call(command).args!;return command==="start_genesis_here"?(args.request as {attempt:number}).attempt:args.attempt;};
beforeEach(()=>{vi.resetModules();ipc.calls=[];ipc.pending.clear();ipc.changed=null;ipc.status=noDocs();
  (window as unknown as Record<string,unknown>).__TAURI_INTERNALS__={};(globalThis as unknown as Record<string,unknown>).IS_REACT_ACT_ENVIRONMENT=true;});
afterEach(()=>{delete (window as unknown as Record<string,unknown>).__TAURI_INTERNALS__;});
it("uses the rendered selected pair and opaque rejected-folder offer without a path argument or latest-target fallback",async()=>{
  const store=await import("../src/lib/watcher-store");await store.startDocsWatcher();
  const selected=store.createSetupHereView(store.getShellState());expect(selected).toEqual({expectedContext:{selectionSequence:10,contextSequence:10},target:{kind:"selected"}});
  const pick=store.pickProjectFolder();release("pick_project_folder",{kind:"noDocs",path:"/new-code",probe,scope:scope(),genesisOffer:"native-offer"});await pick;
  const offered=store.createSetupHereView(store.getShellState());expect(offered).toEqual({expectedContext:selected!.expectedContext,target:{kind:"offered",token:"native-offer"}});
  ipc.changed!({payload:snapshot()});
  const here=store.startGenesisHere(offered);expect(call("start_genesis_here").args).toEqual({request:{...offered,attempt:expect.any(Number)}});
  expect(JSON.stringify(call("start_genesis_here").args)).not.toMatch(/new-code|notes|productRoot|recordsRoot/);
  release("start_genesis_here",{kind:"error",path:"/new-code",message:"original offer retired",scope:scope(),attempt:attempt("start_genesis_here")});await here;
  expect(store.getShellState().docs.records?.contextSequence).toBe(20);expect(store.getShellState().rejectedPick?.path).toBe("/new-code");
  expect(store.createSetupHereView({...store.getShellState(),rejectedPick:{path:"/unoffered",message:null,probe}})).toBeNull();
  await store.startGenesisHere(null);expect(ipc.calls.filter(row=>row.command==="start_genesis_here")).toHaveLength(1);
});
it("confirms the finite native attempt before admitting a result or notice, then allows a healthy retry",async()=>{
  const store=await import("../src/lib/watcher-store");await store.startDocsWatcher();const initial=store.getShellState().docs;
  const first=store.pickGenesisFolder();const id=attempt("pick_genesis_folder");expect(Number.isSafeInteger(id)).toBe(true);
  release("pick_genesis_folder",{kind:"genesis",projectDir:"/foreign",seq:100,snapshot:null,attempt:(id as number)+1,
    setupNotice:{token:"foreign",productDir:"/foreign",status:"initialized",message:"Wrong setup"}});await first;
  expect(store.getShellState().docs).toBe(initial);expect(store.getShellState().setupNotice).toBeUndefined();expect(store.getShellState().picking).toBe(false);
  const second=store.pickGenesisFolder();expect(attempt("pick_genesis_folder")).not.toBe(id);
  release("pick_genesis_folder",{kind:"cancelled",attempt:attempt("pick_genesis_folder"),scope:scope()});await second;
  expect(store.getShellState().picking).toBe(false);expect(store.getShellState().docs).toBe(initial);
});
it("retains an original completed setup notice when a newer observation overtakes its open failure, without changing watcher provenance",async()=>{
  const store=await import("../src/lib/watcher-store");await store.startDocsWatcher();const first=store.pickGenesisFolder();
  ipc.changed!({payload:snapshot()});const current=store.getShellState().docs;
  release("pick_genesis_folder",{kind:"error",path:"/original-code",message:"Current opening unavailable",scope:scope(),attempt:attempt("pick_genesis_folder"),
    setupNotice:{token:"original-receipt",productDir:"/original-code",status:"initialized",message:"Local setup completed. Reopen its original folder."}});await first;
  expect(store.getShellState().docs).toBe(current);expect(store.getShellState().rejectedPick).toBeNull();
  expect(store.getShellState().setupNotice?.productDir).toBe("/original-code");
  store.dismissSetupNotice("foreign-token");expect(store.getShellState().setupNotice).not.toBeNull();
  store.dismissSetupNotice("original-receipt");expect(store.getShellState().setupNotice).toBeNull();
});
it("holds the UI flight until native completion and sends only one original setup request",async()=>{
  const store=await import("../src/lib/watcher-store");await store.startDocsWatcher();const first=store.pickGenesisFolder();
  await store.pickGenesisFolder();await store.pickProjectFolder();await store.startGenesisHere(store.createSetupHereView(store.getShellState()));
  expect(ipc.calls.filter(row=>row.command!=="docs_snapshot")).toHaveLength(1);expect(store.getShellState().picking).toBe(true);
  release("pick_genesis_folder",{kind:"busy",scope:scope(),attempt:attempt("pick_genesis_folder")});await first;expect(store.getShellState().picking).toBe(false);
});
it("the mounted empty screen disables unoffered Here and sends the exact offered token after a native folder rejection",async()=>{
  ipc.status={kind:"noDocs",projectDir:"/legacy",probe};
  const {default:App}=await import("../src/App");const host=document.createElement("div");document.body.appendChild(host);const root=createRoot(host);
  try {
    await act(async()=>root.render(createElement(App)));
    const here=()=>host.querySelector<HTMLButtonElement>('[data-testid="start-interview-here"]')!;
    expect(here().disabled).toBe(true);
    await act(async()=>{host.querySelector<HTMLButtonElement>('[data-testid="pick-folder"]')!.click();
      release("pick_project_folder",{kind:"noDocs",path:"/chosen-code",probe,scope:{seq:0,projectDir:null,selectionSequence:0,contextSequence:0,records:null},genesisOffer:"displayed-offer"});});
    expect(here().disabled).toBe(false);
    await act(async()=>here().click());expect(call("start_genesis_here").args).toEqual({request:{expectedContext:{selectionSequence:0,contextSequence:0},target:{kind:"offered",token:"displayed-offer"},attempt:expect.any(Number)}});
    await act(async()=>{release("start_genesis_here",{kind:"cancelled",attempt:attempt("start_genesis_here")});});
  }finally{act(()=>root.unmount());host.remove();}
});
