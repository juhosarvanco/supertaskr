import {createHash} from "node:crypto";
import {expect,test} from "@playwright/test";
import {createGenesisProposalReader,GENESIS_PRODUCT_PROPOSAL,GENESIS_PROPOSAL_LIMIT,sameGenesisProposal} from "../scripts/genesis-proposal.mjs";
const sha=(text:string)=>createHash("sha256").update(text).digest("hex");
const context={setupId:"init-owned",sessionId:"S1",originDigest:`sha256:${sha("actual original origin")}`,productRevision:"a".repeat(40),recordsRevision:"b".repeat(40)};
const answer={turn:2,text:"A small Python tool for my own notes.",setupId:context.setupId,sessionId:context.sessionId,originDigest:context.originDigest};
const proposal=()=>({version:1,...{setupId:context.setupId,sessionId:context.sessionId,originDigest:context.originDigest},proposalId:"bank-identity-1",bank:"identity",
  expectedProductRevision:context.productRevision,expectedRecordsRevision:context.recordsRevision,answerRefs:[{turn:answer.turn,sha256:sha(answer.text)}],identity:{projectName:"Notes",oneLiner:"A small tool for private notes."}});
const bytes=(value:unknown)=>Buffer.from(JSON.stringify(value));
const request=(value:unknown=proposal())=>({bytes:bytes(value),context:{...context},answers:[{...answer}]});
const reader=()=>createGenesisProposalReader({validateSettings:()=>false});

test("a finite identity proposal captures exact actual answer bytes without granting writes",()=>{
 const captured=reader().capture(request());
 expect(GENESIS_PRODUCT_PROPOSAL).toBe("docs/plans/genesis-product-proposal.json");
 expect(captured.proposal.identity.projectName).toBe("Notes");expect(captured.answers).toEqual([{turn:answer.turn,text:answer.text,sha256:sha(answer.text)}]);
 expect(captured.authority).toContain("no root selection");expect(captured.sourceBase64).toBe(bytes(proposal()).toString("base64"));
 expect(Object.isFrozen(captured.proposal.identity)).toBe(true);
});
test("same commit bytes under a successor origin cannot consume the original session proposal",()=>{
 const successor={...context,originDigest:`sha256:${sha("same history different root incarnation")}`};
 expect(()=>reader().capture({...request(),context:successor})).toThrow(/answer-origin/);
 expect(()=>reader().capture({...request(),context:successor,answers:[{...answer,originDigest:successor.originDigest}]})).toThrow(/proposal-context/);
 const legitimate={...proposal(),originDigest:successor.originDigest};
 expect(reader().capture({...request(legitimate),context:successor,answers:[{...answer,originDigest:successor.originDigest}]}).context.originDigest).toBe(successor.originDigest);
});
test("references must identify existing captured messages with exact bytes, no model-provided substitute",()=>{
 expect(()=>reader().capture({...request(),answers:[]})).toThrow(/answer-mismatch/);
 expect(()=>reader().capture({...request(),answers:[{...answer,text:"different real captured answer"}]})).toThrow(/answer-mismatch/);
 expect(()=>reader().capture({...request(),answers:[{...answer,sessionId:"S2"}]})).toThrow(/answer-origin/);
 const repeated=proposal();repeated.answerRefs.push({...repeated.answerRefs[0]!});expect(()=>reader().capture(request(repeated))).toThrow(/answer-refs/);
 expect(()=>reader().capture({...request(),answers:[{...answer},{...answer}]})).toThrow(/answer-origin/);
});
test("settings are delegated once to the constructor-bound canonical validator and cannot select a policy",()=>{
 const {identity:_identity,...base}=proposal();const value={...base,bank:"configuration",settings:{version:1,languages:["python"],suites:[]}};
 let calls=0;const installed=createGenesisProposalReader({validateSettings(settings:any){calls++;return settings.version === 1 && settings.languages[0] === "python";}});
 expect(installed.capture(request(value)).proposal.settings).toEqual(value.settings);expect(calls).toBe(1);
 expect(()=>reader().capture(request(value))).toThrow(/proposal-settings/);
 expect(()=>installed.capture(request({...value,validator:"weaker"}))).toThrow(/proposal-context/);
 expect(()=>installed.capture({...request(value),validateSettings:()=>true} as any)).toThrow(/proposal-request/);
});
test("duplicate decoded JSON keys invalid UTF8 and excessive bytes are named refusals",()=>{
 const source=JSON.stringify(proposal()).replace('"version":1','"version":1,"\\u0076ersion":1');
 expect(()=>reader().capture({...request(),bytes:Buffer.from(source)})).toThrow(/proposal-json/);
 expect(()=>reader().capture({...request(),bytes:Buffer.from([0xff])})).toThrow(/proposal-json/);
 expect(()=>reader().capture({...request(),bytes:Buffer.alloc(GENESIS_PROPOSAL_LIMIT+1)})).toThrow(/proposal-size/);
});
test("same proposal ID with different source bytes or captured interpretation has a different immutable candidate",()=>{
 const original=reader().capture(request());
 const changed=proposal();changed.identity.oneLiner="A different captured proposal.";
 expect(sameGenesisProposal(original,reader().capture(request(changed)))).toBe(false);
 expect(sameGenesisProposal(original,reader().capture({...request(),bytes:Buffer.from(JSON.stringify(proposal(),null,2))}))).toBe(false);
 expect(sameGenesisProposal(original,reader().capture(request()))).toBe(true);
});
test("candidate capture detaches caller state and rejects path authority or multiline adapter slots",()=>{
 const input=request(),capture=reader().capture(input);input.answers[0]!.text="later caller mutation";input.context.sessionId="S9";input.bytes.fill(0);
 expect(capture.answers[0].text).toBe(answer.text);expect(capture.context.sessionId).toBe("S1");
 expect(Object.isFrozen(input.context)).toBe(false);
 expect(()=>reader().capture(request({...proposal(),productRoot:"/untrusted"}))).toThrow(/proposal-context/);
 const multiline=proposal();multiline.identity.projectName="Notes\nInjected instruction";expect(()=>reader().capture(request(multiline))).toThrow(/proposal-identity/);
});
test("actual-answer capture is bounded in aggregate without silently truncating message bytes",()=>{
 const answers=Array.from({length:5},(_,at)=>({...answer,turn:at+1,text:"x".repeat(256*1024)}));
 expect(()=>reader().capture({...request(),answers})).toThrow(/answer-size/);
 expect(reader().capture(request()).answers[0].text).toBe(answer.text);
});
