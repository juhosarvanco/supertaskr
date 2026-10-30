import {describe,expect,it} from "vitest";
import {emptyState,applySnapshot} from "../src/lib/docs-model";
import {emptyGenesisState,isTurnInFlight,reduceGenesisEvent,type GenesisBankingView,type GenesisTurn} from "../src/lib/agent-store";
import {receiptChips,receiptStage,selectedBanking} from "../src/genesis/interview-model";
import {boardReadiness,completionOf} from "../src/genesis/crescendo";
const context={selectionSequence:1,contextSequence:2};
const records={...context,layout:"split",recordsDir:"/native/records",associationId:"example",rootIncarnation:"1:2",docsIncarnation:"1:3",availability:"available" as const,finding:null,contentRevision:null};
const receipt={receiptDigest:`sha256:${"a".repeat(64)}`,stage:1,completedStage:1,recordsCommit:"b".repeat(40),productCommit:"c".repeat(40),turn:2,paths:["docs/NORTH_STAR.md","docs/INDEX.md"]};
const ready:GenesisBankingView={phase:"ready",recoveryToken:null,code:null,current:true,completedStage:1,receipts:[receipt]};
describe("managed bank receipts",()=>{
 it("working drafts alone provide no bank receipt or progress",()=>{
  const docs={...emptyState(),records,effective:new Map([["docs/NORTH_STAR.md","# A watched draft"]])};
  const genesis={...emptyGenesisState(),view:{context,identity:null,eventContext:null}};
  expect(selectedBanking(docs,genesis)).toBeNull();expect(receiptChips(null).size).toBe(0);expect(receiptStage(null).approxStage).toBeNull();
 });
 it("a matching admitted receipt supplies exact chips; a successor context does not inherit them",()=>{
  const docs={...emptyState(),records},genesis={...emptyGenesisState(),view:{context,identity:null,eventContext:null},banking:ready};
  expect(receiptChips(selectedBanking(docs,genesis)).get(2)).toEqual(["docs/INDEX.md","docs/NORTH_STAR.md"]);
  expect(selectedBanking({...docs,records:{...records,contextSequence:3}},genesis)).toBeNull();
 });
 it("duplicate historical receipts cannot add another chip and an earlier-bank update keeps completion monotonic",()=>{
  const update={...ready,completedStage:5,receipts:[{...receipt,completedStage:5},receipt,receipt]};
  expect(receiptChips(update).size).toBe(1);expect(receiptStage(update).approxStage).toBe(5);
  expect(receiptStage({...update,current:false}).approxStage).toBeNull();
 });
 it("banking is an owned flight and stopped unknown recovery is distinct from running",()=>{
  const banking=reduceGenesisEvent(emptyGenesisState(),{kind:"banking",seq:1,view:{...ready,phase:"banking"}});
  expect(isTurnInFlight(banking)).toBe(true);
  const recovery=reduceGenesisEvent(banking,{kind:"banking",seq:2,view:{...ready,phase:"recovery",recoveryToken:"opaque-original"}});
  expect(isTurnInFlight(recovery)).toBe(false);expect(recovery.banking?.recoveryToken).toBe("opaque-original");
 });
 it("a parsed draft board is never managed completion and bank8 does not invent installation",()=>{
  const docs=applySnapshot(emptyState(),{seq:1,projectDir:"/example",generatedAtMs:0,files:[{path:"docs/tasks/T-001-first.md",content:"---\nid: T-001\ntitle: First slice\nfeature: F-01\nmilestone: 1\npriority: 1\nsize: S\nstatus: planned\nblocked_by: []\n---\n## Acceptance criteria\n- WHEN asked THE example SHALL answer.\n"}]});
  expect(boardReadiness(docs).showBoard).toBe(true);
  const turn:GenesisTurn={turn:1,text:"A real completed turn",activity:[],denials:[],status:"completed",truncatedRelay:false,error:null};
  expect(completionOf(docs,[turn],false).complete).toBe(true);
  expect(completionOf({...docs,records},[turn],false)).toEqual({complete:false,blocker:"bankUnconfirmed"});
  expect(completionOf({...docs,records},[turn],false,{...ready,completedStage:8})).toEqual({complete:false,blocker:"setupUninstalled"});
 });
});
