// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { GenesisContextToken, GenesisIdentity, ScopedGenesisEvent } from "../src/lib/genesis-admission";
const ipc = vi.hoisted(() => ({ invoke: vi.fn(), event: null as null | ((value: {payload: unknown}) => void), shell: null as null | (() => void), context: {selectionSequence:1,contextSequence:2} }));
vi.mock("@tauri-apps/api/core", () => ({ invoke: (command:string,args:unknown) => ipc.invoke(command,args) }));
vi.mock("@tauri-apps/api/event", () => ({ listen: (_name:string, handler:typeof ipc.event) => { ipc.event=handler; return Promise.resolve(() => {}); } }));
vi.mock("../src/lib/watcher-store", () => ({ getShellState: () => ({docs:{records:ipc.context}}), subscribeShell: (cb:()=>void) => {ipc.shell=cb;return()=>{ipc.shell=null;};} }));
let store: typeof import("../src/lib/agent-store");
const a={selectionSequence:1,contextSequence:2}, b={selectionSequence:3,contextSequence:4};
const idle={phase:"idle",projectDir:"/display/product",turn:0,nativeSessionId:null,cliVersion:null,methodVersion:"0.1.39",lastError:null,lastEventAtMs:null};
function identity(attempt:number, suffix="a"): GenesisIdentity { return {activation:suffix==="a"?1:2,token:`native-${suffix}`,sessionId:`session-${suffix}`,originDigest:`sha256:${"a".repeat(64)}`,initiatingAttempt:attempt}; }
function emit(context:GenesisContextToken, attempt:number, native:GenesisIdentity, event:ScopedGenesisEvent["event"]) { ipc.event?.({payload:{...context,attempt,identity:native,event}}); }
function response(request:{expectedContext:GenesisContextToken;attempt:number}, native:GenesisIdentity|null, result:unknown, seq=1) { return {...request.expectedContext,attempt:request.attempt,identity:native,result,seq}; }
function select(context:GenesisContextToken) {ipc.context=context;ipc.shell?.();}
beforeEach(async()=>{
  (window as unknown as {__TAURI_INTERNALS__:unknown}).__TAURI_INTERNALS__={}; vi.resetModules(); ipc.context=a;ipc.event=null;ipc.shell=null;ipc.invoke.mockReset();
  ipc.invoke.mockImplementation((command:string,{request}:{request:{expectedContext:GenesisContextToken;attempt:number}})=>Promise.resolve(response(request,null,command==="genesis_status"?{kind:"ready",value:{status:idle,record:null,starting:false,eventAttempt:null,eventContext:null}}:{kind:"ready",value:[]})));
  store=await import("../src/lib/agent-store");await store.startGenesisListener();
});
let uiRoot: Root | null = null;
afterEach(async()=>{ if (uiRoot) { await act(async()=>uiRoot!.unmount()); uiRoot=null; } store.__resetGenesisStoreForTests();vi.useRealTimers();});
async function probeUi() {
  (globalThis as {IS_REACT_ACT_ENVIRONMENT?:boolean}).IS_REACT_ACT_ENVIRONMENT=true;
  const source=await import("../src/genesis/interview-source");
  let value!: ReturnType<typeof source.useInterviewUi>;
  const host=document.createElement("div"); uiRoot=createRoot(host);
  function Probe(){value=source.useInterviewUi();return null;}
  await act(async()=>uiRoot!.render(createElement(Probe)));
  return {source,read:()=>value};
}
describe("actual store managed IPC composition",()=>{
  it("confirms native activation before applying racing terminal events, without promoting reply sequence",async()=>{
    ipc.invoke.mockImplementationOnce((_command:string,{request})=>{
      const native=identity(request.attempt);
      emit(a,request.attempt,native,{kind:"started",turn:1,seq:2});emit(a,request.attempt,native,{kind:"completed",turn:1,seq:3,text:"Own result",truncatedRelay:false});
      expect(store.getGenesisState().seq).toBe(1);expect(store.getGenesisState().turns).toEqual([]);
      return Promise.resolve(response(request,native,{kind:"started",turn:1},4));
    });
    expect(await store.startGenesis(store.getGenesisState().view)).toEqual({kind:"started",turn:1});
    expect(store.getGenesisState()).toMatchObject({phase:"idle",seq:3,sessionId:"session-a",turns:[{text:"Own result",status:"completed"}]});
    const [,args]=ipc.invoke.mock.calls[ipc.invoke.mock.calls.length - 1];expect(args.request.expectedContext).toEqual(a);expect(Object.keys(args.request).sort()).toEqual(["attempt","expectedContext"]);
  });
  it("retires A before late reply/huge sequence and accepts only legitimate B",async()=>{
    let release!:(value:unknown)=>void;let old:any;
    ipc.invoke.mockImplementationOnce((_command,{request})=>{old=request;return new Promise(resolve=>{release=resolve;});});
    const pending=store.startGenesis(store.getGenesisState().view);select(b);
    emit(a,old.attempt,identity(old.attempt),{kind:"failed",seq:99999,turn:1,error:{kind:"startTimeout"}});
    release(response(old,identity(old.attempt),{kind:"started",turn:1},99998));expect(await pending).toBe(null);
    expect(store.getGenesisState()).toMatchObject({seq:0,turns:[],lastEventAtMs:null});
    ipc.invoke.mockImplementationOnce((_command,{request})=>{const native=identity(request.attempt,"b");emit(b,request.attempt,native,{kind:"started",seq:2,turn:1});return Promise.resolve(response(request,native,{kind:"started",turn:1},3));});
    expect(await store.startGenesis(store.getGenesisState().view)).toEqual({kind:"started",turn:1});expect(store.getGenesisState()).toMatchObject({contextKey:"3:4",seq:2,sessionId:"session-b",phase:"running"});
  });
  it("send uses the offered original activation and exact text; retired cancel does not mutate B",async()=>{
    let native!:GenesisIdentity;let eventAttempt=0;
    ipc.invoke.mockImplementationOnce((_command,{request})=>{native=identity(request.attempt);eventAttempt=request.attempt;emit(a,eventAttempt,native,{kind:"completed",seq:2,turn:1,text:"First",truncatedRelay:false});return Promise.resolve(response(request,native,{kind:"started",turn:1},3));});
    await store.startGenesis(store.getGenesisState().view);const text="typed $literal\n å  ";
    ipc.invoke.mockImplementationOnce((_command,{request,text:actual})=>{expect(request.identity).toEqual(native);expect(actual).toBe(text);eventAttempt=request.attempt;emit(a,eventAttempt,native,{kind:"started",seq:4,turn:2});return Promise.resolve(response(request,native,{kind:"accepted",turn:2},5));});
    expect(await store.sendGenesisTurn(text, store.getGenesisState().view)).toEqual({kind:"accepted",turn:2});const offered=store.getGenesisState().view;select(b);
    const before=store.getGenesisState();
    ipc.invoke.mockImplementationOnce((_command,{request})=>{expect(request.expectedContext).toEqual(a);expect(request.identity).toEqual(native);return Promise.resolve(response(request,native,{kind:"ready",value:{kind:"cancelled",turn:2}},6));});
    expect(await store.cancelGenesis(offered)).toEqual({kind:"cancelled",turn:2});expect(store.getGenesisState()).toBe(before);
  });
  it("stale rendered view cannot choose latest B or a successor activation",async()=>{
    const renderedA=store.getGenesisState().view;select(b);const calls=ipc.invoke.mock.calls.length;
    expect(await store.startGenesis(renderedA)).toBe(null);expect(await store.startGenesis()).toBe(null);expect(ipc.invoke.mock.calls.length).toBe(calls);
    ipc.invoke.mockImplementationOnce((_command,{request})=>{const native=identity(request.attempt,"b");emit(b,request.attempt,native,{kind:"completed",seq:2,turn:1,text:"B",truncatedRelay:false});return Promise.resolve(response(request,native,{kind:"started",turn:1},3));});
    const beforeB=store.getGenesisState().view;expect(await store.startGenesis(beforeB)).toMatchObject({kind:"started"});
    const captured=ipc.invoke.mock.calls.length;expect(await store.sendGenesisTurn("stale",beforeB)).toBe(null);expect(await store.cancelGenesis(beforeB)).toBe(null);expect(ipc.invoke.mock.calls.length).toBe(captured);
  });
  it("lost command reply reconciles through native status and original event attempt",async()=>{
    vi.useFakeTimers();let original:any;let release!:(value:unknown)=>void;
    ipc.invoke.mockImplementationOnce((_command,{request})=>{original=request;return new Promise(resolve=>{release=resolve;});});
    const pending=store.startGenesis(store.getGenesisState().view);await vi.advanceTimersByTimeAsync(30_000);expect(await pending).toBe(null);expect(store.getGenesisState().preparing).toBe(true);
    const native=identity(original.attempt);
    ipc.invoke.mockImplementation((command,{request})=>Promise.resolve(response(request,command==="genesis_status"?native:null,command==="genesis_status"?{kind:"ready",value:{status:{...idle,phase:"running",turn:1},record:null,starting:false,eventAttempt:original.attempt,eventContext:a}}:{kind:"ready",value:[]},4)));
    await vi.advanceTimersByTimeAsync(500);expect(store.getGenesisState()).toMatchObject({preparing:false,phase:"running",seq:4,sessionId:"session-a"});
    emit(a,original.attempt,native,{kind:"completed",seq:5,turn:1,text:"Recovered",truncatedRelay:false});
    release(response(original,native,{kind:"started",turn:1},3));await Promise.resolve();expect(store.getGenesisState()).toMatchObject({phase:"idle",seq:5,turns:[{text:"Recovered"}]});
  });
  it("new matching terminal evidence renews an exhausted bounded status burst without admitting events or retrying effects",async()=>{
    vi.useFakeTimers();let original:any;let ready=false;let pulls=0;
    ipc.invoke.mockImplementation((command,{request})=>{
      if(command==="genesis_start"){
        original=request;emit(a,request.attempt,identity(request.attempt),{kind:"started",turn:1,seq:2});
        return new Promise(()=>{});
      }
      if(command==="genesis_status"){
        pulls++;const native=identity(original.attempt);
        return Promise.resolve(response(request,ready?native:null,ready?{kind:"ready",value:{status:{...idle,turn:1},record:null,starting:false,eventAttempt:original.attempt,eventContext:a}}:{kind:"error",message:"genesis-selection-busy"},ready?5:3));
      }
      return Promise.resolve(response(request,null,{kind:"ready",value:[{turn:1,role:"planner",text:"Actual settled transcript",atMs:1}]},6));
    });
    const pending=store.startGenesis(store.getGenesisState().view);await vi.advanceTimersByTimeAsync(store.COMMAND_ANSWER_BOUND_MS);expect(await pending).toBeNull();
    await vi.advanceTimersByTimeAsync(60_000);expect(pulls).toBe(120);expect(store.getGenesisState()).toMatchObject({preparing:true,seq:1,turns:[],lastEventAtMs:null});
    const native=identity(original.attempt);
    emit(b,original.attempt,native,{kind:"completed",seq:99999,turn:1,text:"Foreign scope",truncatedRelay:false});
    emit(a,original.attempt+1,native,{kind:"completed",seq:99998,turn:1,text:"Foreign attempt",truncatedRelay:false});
    emit(a,original.attempt,native,{kind:"started",seq:2,turn:1});
    await vi.advanceTimersByTimeAsync(1_000);expect(pulls).toBe(120);expect(store.getGenesisState().seq).toBe(1);
    ready=true;emit(a,original.attempt,native,{kind:"completed",seq:4,turn:1,text:"Not yet admitted",truncatedRelay:false});
    expect(store.getGenesisState()).toMatchObject({preparing:true,seq:1,turns:[],lastEventAtMs:null});
    // A duplicate cannot create a second renewal or become transcript authority.
    emit(a,original.attempt,native,{kind:"completed",seq:4,turn:1,text:"Not yet admitted",truncatedRelay:false});
    await vi.advanceTimersByTimeAsync(500);expect(pulls).toBe(121);expect(store.getGenesisState()).toMatchObject({preparing:false,phase:"idle",sending:false,seq:5,sessionId:"session-a",turns:[],rehydrated:[{text:"Actual settled transcript"}]});
    await vi.advanceTimersByTimeAsync(60_000);expect(pulls).toBe(121);expect(ipc.invoke.mock.calls.filter(([command])=>command==="genesis_start")).toHaveLength(1);
  });
  it("late transcript from retired A cannot populate B and does not move event sequence",async()=>{
    let release!:(value:unknown)=>void;let original:any;
    ipc.invoke.mockImplementationOnce((_command,{request})=>{original=request;return new Promise(resolve=>{release=resolve;});});
    const pending=store.refreshGenesisTranscript();select(b);release(response(original,null,{kind:"ready",value:[{turn:1,role:"user",text:"A only",atMs:1}]},999));
    expect(await pending).toEqual([]);expect(store.getGenesisState()).toMatchObject({seq:0,rehydrated:[],contextKey:"3:4"});
  });
});

describe("managed interview UI cache ownership",()=>{
  it("same PRODUCT new records context retires old answer retry and allows its own auto-start",async()=>{
    const ui=await probeUi();let native!:GenesisIdentity;
    const accept=(suffix:string,turn:number)=>{ipc.invoke.mockImplementationOnce((_command,{request})=>{native=identity(request.attempt,suffix);emit(ipc.context,request.attempt,native,{kind:"completed",turn,seq:turn*2,text:`${suffix} result`,truncatedRelay:false});return Promise.resolve(response(request,native,{kind:turn===1?"started":"accepted",turn},turn*2+1));});};
    accept("a",1);await act(async()=>{await ui.source.startInterview("/same/product", {}, store.getGenesisState().view);});
    ipc.invoke.mockImplementationOnce((_command,{request})=>{emit(a,request.attempt,native,{kind:"completed",turn:2,seq:4,text:"A second",truncatedRelay:false});return Promise.resolve(response(request,native,{kind:"accepted",turn:2},5));});
    await act(async()=>{await ui.source.sendAnswer("A answer", store.getGenesisState().view);});expect(ui.read().userHalves.get(2)).toBe("A answer");
    await act(async()=>select(b));expect(ui.read().userHalves.size).toBe(0);
    const calls=ipc.invoke.mock.calls.length;expect(await ui.source.retryTurn("/same/product",2,store.getGenesisState().view)).toBe(null);expect(ipc.invoke.mock.calls.length).toBe(calls);
    accept("b",1);let accepted:unknown;await act(async()=>{accepted=await ui.source.startInterview("/same/product", {}, store.getGenesisState().view);});expect(accepted).toEqual({kind:"started",turn:1});
  });
  it("old A finally cannot release B's pending local latch",async()=>{
    const ui=await probeUi();let old:any;let current:any;let releaseA!:(v:unknown)=>void;let releaseB!:(v:unknown)=>void;
    ipc.invoke.mockImplementationOnce((_command,{request})=>{old=request;return new Promise(resolve=>{releaseA=resolve;});});
    let pendingA!:Promise<unknown>;await act(async()=>{pendingA=ui.source.startInterview("/same/product", {}, store.getGenesisState().view);});
    await act(async()=>select(b));
    ipc.invoke.mockImplementationOnce((_command,{request})=>{current=request;return new Promise(resolve=>{releaseB=resolve;});});
    let pendingB!:Promise<unknown>;await act(async()=>{pendingB=ui.source.startInterview("/same/product", {}, store.getGenesisState().view);});expect(ui.read().busy).toBe(true);
    await act(async()=>{releaseA(response(old,identity(old.attempt),{kind:"started",turn:1},999));await pendingA;});expect(ui.read().busy).toBe(true);
    await act(async()=>{const native=identity(current.attempt,"b");emit(b,current.attempt,native,{kind:"completed",turn:1,seq:2,text:"B result",truncatedRelay:false});releaseB(response(current,native,{kind:"started",turn:1},3));await pendingB;});
    expect(ui.read().busy).toBe(false);expect(ui.read().awaiting).toBe(1);expect(store.getGenesisState().contextKey).toBe("3:4");
  });
});

it("mounted chat retires same-P A draft and sends actual B controls with rendered native tokens",async()=>{
  (globalThis as {IS_REACT_ACT_ENVIRONMENT?:boolean}).IS_REACT_ACT_ENVIRONMENT=true;
  const {GenesisScreen}=await import("../src/components/shell/GenesisScreen");
  const {emptyState}=await import("../src/lib/docs-model");
  const docs=(context:GenesisContextToken)=>({...emptyState(),projectDir:"/same/product",records:{...context,layout:"split",recordsDir:"/native/records",associationId:"fixture",rootIncarnation:"1:2",docsIncarnation:"1:3",availability:"available" as const,finding:null,contentRevision:null}});
  let original:any;let originalIdentity!:GenesisIdentity;let nativeB!:GenesisIdentity;let sentB=false;
  ipc.invoke.mockImplementation((command,{request,text})=>{
    if(command==="genesis_start") {
      const native=identity(request.attempt,ipc.context===a?"a":"b");
      if(ipc.context===a){original=request;originalIdentity=native;}else{nativeB=native;expect(request.expectedContext).toEqual(b);}
      emit(ipc.context,request.attempt,native,{kind:"completed",turn:1,seq:2,text:ipc.context===a?"A result":"B result",truncatedRelay:false});
      return Promise.resolve(response(request,native,{kind:"started",turn:1},3));
    }
    if(command==="genesis_send_turn") {
      expect(request.expectedContext).toEqual(b);expect(request.identity).toEqual(nativeB);expect(text).toBe("B human answer");sentB=true;
      emit(b,request.attempt,nativeB,{kind:"completed",turn:2,seq:4,text:"B second",truncatedRelay:false});return Promise.resolve(response(request,nativeB,{kind:"accepted",turn:2},5));
    }
    return Promise.resolve(response(request,null,command==="genesis_status"?{kind:"ready",value:{status:idle,record:null,starting:false,eventAttempt:null,eventContext:null}}:{kind:"ready",value:[]},1));
  });
  const host=document.createElement("div");document.body.appendChild(host);uiRoot=createRoot(host);
  const render=(context:GenesisContextToken)=>uiRoot!.render(createElement(GenesisScreen,{projectDir:"/same/product",docs:docs(context),onOpenBoard:()=>{}}));
  await act(async()=>render(a));
  const input=()=>host.querySelector<HTMLTextAreaElement>("[data-testid=interview-input]")!;
  const type=async(text:string)=>{await act(async()=>{Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,"value")!.set!.call(input(),text);input().dispatchEvent(new Event("input",{bubbles:true}));});};
  await type("A unsent draft");expect(input().value).toBe("A unsent draft");
  await act(async()=>{select(b);render(b);await store.refreshGenesisStatus();});
  expect(input().value).toBe("");expect(host.textContent).not.toContain("A result");
  const before=store.getGenesisState();await act(async()=>emit(a,original.attempt,originalIdentity,{kind:"completed",seq:99999,turn:1,text:"A late result",truncatedRelay:false}));
  expect(store.getGenesisState()).toBe(before);expect(host.textContent).not.toContain("A late result");
  await type("B human answer");await act(async()=>{input().dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",bubbles:true}));});
  expect(sentB).toBe(true);expect(input().value).toBe("");expect(host.textContent).toContain("B second");host.remove();
});
