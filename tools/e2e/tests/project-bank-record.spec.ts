import {expect,test} from "@playwright/test";
import {createHash} from "node:crypto";
import {validProjectBankRequest,validProjectBankRecord,validProjectBankPlan} from "../scripts/project-bank-record.mjs";
import {operationDigest,operationWork} from "../scripts/operation-record.mjs";
import {authoredBankRow,bankSchemaFixture,q1BankSchemaRequest} from "./project-bank-fixture";
let f:ReturnType<typeof bankSchemaFixture>;
test.beforeAll(()=>{f=bankSchemaFixture();});test.afterAll(()=>f?.cleanup());
test("real initialized/checker/external parented plan data fits the finite bank schema while no bank outcome is claimed",()=>{
 expect(f.request.bank.validation.current.candidateDigest).toMatch(/^[0-9a-f]{64}$/);
 expect(validProjectBankRequest(f.request)).toBe(true);expect(validProjectBankPlan(f.request.plans.records,f.request,"records")).toBe(true);
 expect(validProjectBankRecord(authoredBankRow(f.request))).toBe(true);expect(f.request.plans.product).toBeNull();
});
test("bank data binds the frozen configured provider while requested and optional observed model stay separate",()=>{
 const request=structuredClone(f.request),planner=request.session.planner;
 planner.selection.harness="codex";planner.selection.requested="codex/gpt-6.1-sol@subagent";planner.selection.model="gpt-6.1-sol";
 const registry=JSON.parse(Buffer.from(request.input.registryCapture.base64,"base64").toString()),row=registry.sessions[0];row.agent="codex";row.genesis.planner=structuredClone(planner);
 const capture=()=>{const bytes=Buffer.from(JSON.stringify(registry));request.input.registryCapture.base64=bytes.toString("base64");request.input.registryCapture.byteLength=bytes.length;request.input.registryCapture.sha256=createHash("sha256").update(bytes).digest("hex");};
 capture();expect(validProjectBankRequest(request),"pure finite provider data is not a canonical role or native launch proof").toBe(true);
 row.model="separate optional observed model";capture();expect(validProjectBankRequest(request)).toBe(true);
 row.agent="claude";capture();expect(validProjectBankRequest(request),"a stored original provider cannot be relabeled by its registry row").toBe(false);
 row.agent="codex";planner.selection.harness="foreign";row.genesis.planner=structuredClone(planner);capture();expect(validProjectBankRequest(request)).toBe(false);
});
test("raw commit parent/tree/message/OID disagreement refuses rather than accepting an asserted exact plan",()=>{
 for(const field of ["tree","expectedRevision","commit"] as const){const request=structuredClone(f.request);request.plans.records[field]="f".repeat(40);expect(validProjectBankRequest(request),field).toBe(false);}
 const request=structuredClone(f.request),plan=request.plans.records;let raw=Buffer.from(plan.commitBase64!,"base64").toString("utf8");raw=raw.replace(`parent ${plan.expectedRevision}`,`parent ${"f".repeat(40)}`);
 plan.commitBase64=Buffer.from(raw).toString("base64");plan.commit=createHash("sha1").update(`commit ${Buffer.byteLength(raw)}\0`).update(raw).digest("hex");expect(validProjectBankRequest(request)).toBe(false);
 const message=structuredClone(f.request);message.plans.records.message+="unplanned suffix";expect(validProjectBankRequest(message)).toBe(false);
 const uppercase=structuredClone(f.request),legacy=uppercase.plans.records;legacy.message=legacy.message.replace("supertaskr-project-bank","Supertaskr-Project-Bank");
 const legacyRaw=Buffer.from(legacy.commitBase64!,"base64").toString("utf8").replace("supertaskr-project-bank","Supertaskr-Project-Bank");legacy.commitBase64=Buffer.from(legacyRaw).toString("base64");legacy.commit=createHash("sha1").update(`commit ${Buffer.byteLength(legacyRaw)}\0`).update(legacyRaw).digest("hex");
 expect(validProjectBankRequest(uppercase),"new bank history has no uppercase legacy trailer mode").toBe(false);
});
test("request data cannot add paths, weaken typed source provenance, impersonate successor roots or turn null PRODUCT into an effect",()=>{
 for(const change of [(r:any)=>r.extra="unrecognized",(r:any)=>r.setup.operationId=r.operationId,(r:any)=>r.setup.productRevision="f".repeat(64),(r:any)=>r.input.docsIdentity.inode="999",(r:any)=>r.session.originDigest=`sha256:${"f".repeat(64)}`,
  (r:any)=>r.input.settingsProvenance.productRevision="f".repeat(40),(r:any)=>r.bank.answers=[{turn:2,text:"not in transcript",sha256:"a".repeat(64)}],
  (r:any)=>r.bank.validation.current.writeSetDigest=`sha256:${"f".repeat(64)}`,(r:any)=>r.plans.product=structuredClone(r.plans.records),
  (r:any)=>r.plans.records.writes[0].path="docs/checkpoints/fake-review.md",(r:any)=>r.plans.records.working.index.path+="-foreign",(r:any)=>r.plans.records.targetRef="refs/heads/../foreign"]){const request=structuredClone(f.request);change(request);expect(validProjectBankRequest(request)).toBe(false);}
});
test("pure progress schema requires both claims, exact intents and R-first acceptance before release",()=>{
 const row=authoredBankRow(f.request);row.operation.progress.records.stage="ref-accepted";expect(validProjectBankRecord(row)).toBe(false);
 const plan=f.request.plans.records,intent={commit:plan.commit,tree:plan.tree,ref:plan.targetRef,previousRevision:plan.expectedRevision,correlationRef:`refs/supertaskr/project-banks/${operationWork(f.request.operationId).slice(3)}/records`};
 row.operation.progress.records.intent=intent;row.operation.progress.records.acceptance={commit:intent.commit,tree:intent.tree,ref:intent.ref,previousRevision:intent.previousRevision,attribution:"exact"};
 expect(validProjectBankRecord(row),"pure metadata consistency is separate from an actual ref witness").toBe(true);
 row.operation.acceptance={records:row.operation.progress.records.acceptance,product:null,attribution:"exact"};
 row.operation.claims.forEach(claim=>{claim.releasedAt="2026-10-30T00:00:01.000Z";});row.reservation.releasedAt="2026-10-30T00:00:01.000Z";row.state="finished";expect(validProjectBankRecord(row)).toBe(true);
 row.operation.claims.pop();expect(validProjectBankRecord(row)).toBe(false);
 const premature=authoredBankRow(f.request);premature.operation.claims[1]!.releasedAt="2026-10-30T00:00:01.000Z";expect(validProjectBankRecord(premature)).toBe(false);
 const changed=authoredBankRow(f.request);changed.operation.digest=operationDigest({...f.request,operationId:"other"});expect(validProjectBankRecord(changed)).toBe(false);
});


test("Q1 data binds actual human captures and exact PRODUCT adapter commit to the planned RECORDS commit",()=>{
 const request=q1BankSchemaRequest(f);expect(validProjectBankRequest(request)).toBe(true);
 const changed=structuredClone(request),plan=changed.plans.product!;const wrong="f".repeat(40);
 plan.message=plan.message.replace(changed.plans.records.commit!,wrong);const raw=Buffer.from(plan.commitBase64!,"base64").toString("utf8").replace(changed.plans.records.commit!,wrong);
 plan.commitBase64=Buffer.from(raw).toString("base64");plan.commit=createHash("sha1").update(`commit ${Buffer.byteLength(raw)}\0`).update(raw).digest("hex");
 expect(validProjectBankRequest(changed)).toBe(false);
 const skipped=structuredClone(request);skipped.input.previousBank=null;expect(validProjectBankRequest(skipped)).toBe(false);
 const row=authoredBankRow(request);row.operation.progress.product.stage="captured";expect(validProjectBankRecord(row)).toBe(true);
 const p=request.plans.product;row.operation.progress.product.stage="objects-start";row.operation.progress.product.intent={commit:p.commit,tree:p.tree,ref:p.targetRef,previousRevision:p.expectedRevision,correlationRef:`refs/supertaskr/project-banks/${operationWork(request.operationId).slice(3)}/product`};
 expect(validProjectBankRecord(row)).toBe(false);
 const r=request.plans.records;row.operation.progress.records={stage:"ref-accepted",intent:{commit:r.commit,tree:r.tree,ref:r.targetRef,previousRevision:r.expectedRevision,correlationRef:`refs/supertaskr/project-banks/${operationWork(request.operationId).slice(3)}/records`},acceptance:{commit:r.commit,tree:r.tree,ref:r.targetRef,previousRevision:r.expectedRevision,attribution:"exact"}};
 expect(validProjectBankRecord(row)).toBe(true);
 row.operation.acceptance={records:row.operation.progress.records.acceptance,product:null,attribution:"exact"};expect(validProjectBankRecord(row),"R alone cannot finish a required P plan").toBe(false);
 row.operation.acceptance=null;row.operation.progress.product.stage="ref-accepted";row.operation.progress.product.acceptance={commit:p.commit,tree:p.tree,ref:p.targetRef,previousRevision:p.expectedRevision,attribution:"exact"};
 row.operation.acceptance={records:row.operation.progress.records.acceptance,product:row.operation.progress.product.acceptance,attribution:"exact"};expect(validProjectBankRecord(row)).toBe(true);
});


test("stage-zero data keeps the original typed setup after a legitimate records advance and refuses missing or relabeled provenance",()=>{
 const later=bankSchemaFixture(true);
 try{
  expect(later.request.input.recordsRevision).not.toBe(later.request.setup.recordsRevision);
  expect(validProjectBankRequest(later.request)).toBe(true);
  for(const mutate of [(g:any)=>{delete g.setup;},(g:any)=>{g.setup.recordsRevision=later.request.input.recordsRevision;}]){
   const request=structuredClone(later.request),registry=JSON.parse(Buffer.from(request.input.registryCapture.base64,"base64").toString());
   mutate(registry.sessions[0].genesis);const bytes=Buffer.from(JSON.stringify(registry));
   request.input.registryCapture.base64=bytes.toString("base64");request.input.registryCapture.byteLength=bytes.length;request.input.registryCapture.sha256=createHash("sha256").update(bytes).digest("hex");
   expect(validProjectBankRequest(request)).toBe(false);
  }
 }finally{later.cleanup();}
});


test("own-bank updates bind both chronological progress and logical predecessor without reducing completion",()=>{
 const request=q1BankSchemaRequest(f);
 const own={operationId:"accepted-q1",requestDigest:`sha256:${"d".repeat(64)}`,receiptDigest:`sha256:${"e".repeat(64)}`,stage:1,completedStage:1,recordsCommit:"a".repeat(40),productCommit:"b".repeat(40)};
 const latest={...own,operationId:"accepted-q2",stage:2,completedStage:2,recordsCommit:"c".repeat(40)};
 request.input.ownBank=own;request.input.latestBank=latest;request.bank.mode="update";request.bank.completedStage=2;
 expect(validProjectBankRequest(request),"authored update metadata is only schema data, not accepted history").toBe(true);
 const regress=structuredClone(request);regress.bank.completedStage=1;expect(validProjectBankRequest(regress)).toBe(false);
 const missing=structuredClone(request);missing.input.ownBank=null;expect(validProjectBankRequest(missing)).toBe(false);
 const initial=structuredClone(request);initial.bank.mode="initial";expect(validProjectBankRequest(initial)).toBe(false);
});
