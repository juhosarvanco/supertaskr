import { describe, expect, it } from "vitest";
import { GenesisAdmission, GENESIS_EARLY_EVENT_LIMIT, type GenesisIdentity, type ScopedGenesisEvent } from "../src/lib/genesis-admission";
const a = { selectionSequence: 1, contextSequence: 2 }, b = { selectionSequence: 3, contextSequence: 4 };
const identity: GenesisIdentity = { activation: 1, token: "native-a", sessionId: "session-a", originDigest: `sha256:${"a".repeat(64)}`, initiatingAttempt: 10 };
const event = (seq: number, attempt = 10, native = identity): ScopedGenesisEvent => ({ ...a, attempt, identity: native, event: { kind: "started", turn: 1, seq } });
const reply = (attempt = 10, native: GenesisIdentity | null = identity) => ({ ...a, attempt, seq: 100, identity: native, result: { kind: "started" as const, turn: 1 } });
function gate() { const g = new GenesisAdmission(); g.select(a); return g; }
describe("managed genesis admission before sequence/time", () => {
  it("buffers actual early events until exact native reply, then preserves event ordering", () => {
    const g = gate(); expect(g.begin(10)).toBe(true);
    expect(g.event(event(2)).events).toEqual([]); expect(g.event(event(1)).events).toEqual([]);
    expect(g.complete(reply(), 10)).toMatchObject({ admitted: true, reconcile: false, events: [event(1).event, event(2).event] });
    expect(g.event(event(3)).events).toEqual([event(3).event]);
  });
  it("drops same attempt from foreign scope and foreign native activation before reducer admission", () => {
    const g = gate(); g.begin(10); g.event({ ...event(900), ...b });
    const wrong = { ...identity, token: "other" }; g.event(event(901, 10, wrong));
    expect(g.complete(reply(), 10).events).toEqual([]);
    expect(g.event(event(9999, 10, wrong)).admitted).toBe(false);
    expect(g.event(event(1)).admitted).toBe(true);
  });
  it("retired A replies and events cannot confirm B, while B has its own positive", () => {
    const g = gate(); g.begin(10); g.event(event(1)); g.select(b); expect(g.begin(20)).toBe(true);
    expect(g.complete(reply(), 10).admitted).toBe(false); expect(g.event(event(999)).admitted).toBe(false);
    const nativeB = { ...identity, token: "native-b", activation: 2, sessionId: "session-b", initiatingAttempt: 20 };
    expect(g.complete({ ...reply(20, nativeB), ...b }, 20).admitted).toBe(true);
    expect(g.event({ ...event(1, 20, nativeB), ...b }).admitted).toBe(true);
  });
  it("new turn uses same offered identity and refuses an old-attempt completion", () => {
    const g = gate(); g.begin(10); g.complete(reply(), 10);
    expect(g.begin(20, { ...identity, token: "invented" })).toBe(false);
    expect(g.begin(20, identity)).toBe(true); expect(g.event(event(999, 10)).admitted).toBe(false);
    expect(g.complete(reply(20, { ...identity, token: "successor" }), 20).admitted).toBe(false);
    expect(g.complete(reply(20), 20).admitted).toBe(true); expect(g.event(event(1, 20)).admitted).toBe(true);
  });
  it("refusal with no activation discards early text rather than promoting it", () => {
    const g = gate(); g.begin(10); g.event(event(1)); expect(g.complete(reply(10, null), 10).events).toEqual([]); expect(g.identity).toBe(null);
    expect(g.event(event(999)).admitted).toBe(false);
  });
  it("lost reply reconciles only the original pending attempt and actual session", () => {
    const g = gate(); g.begin(10); g.uncertain(10);
    expect(g.complete(reply(), 10)).toMatchObject({ admitted: false, reconcile: true });
    expect(g.status(reply(30), 99)).toMatchObject({ admitted: true, reconcile: true, events: [] }); expect(g.awaiting).toBe(false);
    expect(g.status(reply(30), 10)).toMatchObject({ admitted: true, reconcile: false, events: [] }); expect(g.awaiting).toBe(false);
    expect(g.event(event(1)).admitted).toBe(true);
  });
  it("uncertain evidence is bounded per activation and never admits or poisons another activation's sequence",()=>{
    const g=gate();g.begin(10);g.event(event(2));g.uncertain(10);
    expect(g.event(event(2))).toMatchObject({admitted:false,reconcile:false});
    const foreign={...identity,token:"unconfirmed-other"};expect(g.event(event(99999,10,foreign))).toMatchObject({admitted:false,reconcile:true,newEvidence:true});
    expect(g.event(event(3))).toMatchObject({admitted:false,events:[],reconcile:true,newEvidence:true});
    expect(g.identity).toBeNull();expect(g.event(event(3))).toMatchObject({admitted:false,reconcile:false});
    expect(g.status(reply(30),10).admitted).toBe(true);expect(g.begin(20,identity)).toBe(true);g.uncertain(20);
    expect(g.event(event(999999,20,foreign))).toMatchObject({admitted:false,reconcile:false});
    expect(g.event(event(4,20))).toMatchObject({admitted:false,reconcile:true,newEvidence:true});
  });
  it("count overflow and UTF8 byte overflow discard buffer and require actual scoped history", () => {
    const g = gate(); g.begin(10);
    for (let i = 0; i < GENESIS_EARLY_EVENT_LIMIT; i++) expect(g.event(event(i + 1)).reconcile).toBe(false);
    expect(g.event(event(200)).reconcile).toBe(true); expect(g.complete(reply(), 10).reconcile).toBe(true);
    const bytes = gate(); bytes.begin(10);
    expect(bytes.event({ ...event(1), event: { kind: "textDelta", seq: 1, turn: 1, text: "🦊".repeat(300_000) } }).reconcile).toBe(true);
  });
  it("original callback scope requires native confirmation after same-home reselection",()=>{
    const g=gate();g.begin(10);g.complete(reply(),10);g.select(b);
    expect(g.event(event(999)).admitted).toBe(false);
    expect(g.status({...reply(30),...b},10,a).admitted).toBe(true);
    expect(g.event(event(1)).admitted).toBe(true);
    expect(g.event({...event(2),...b}).admitted).toBe(false);
  });
  it("scoped status on cold pane offers native activation, no scope-less identity is admitted", () => {
    const g = gate(); expect(g.status(reply(30), 10).admitted).toBe(true);
    expect(g.event(event(1)).admitted).toBe(true);
    expect(g.status({ ...reply(31), contextSequence: 0 }, 10).admitted).toBe(false);
    expect(g.status(reply(31, { ...identity, originDigest: "guessed" }), 10).admitted).toBe(false);
    expect(g.identity).toEqual(identity);
  });
});
