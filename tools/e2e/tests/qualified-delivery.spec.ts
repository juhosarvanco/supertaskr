import {readFileSync,readdirSync,lstatSync,writeFileSync} from "node:fs";
import path from "node:path";
import {expect,test} from "@playwright/test";
import {captureQualifiedDeliveryAuthority} from "../scripts/qualified-delivery.mjs";
import {executeQualifiedLocalDelivery} from "../scripts/qualified-delivery-operation.mjs";
import {readAcceptedOperation} from "../scripts/durable-operation.mjs";
import {startRun,collectRun,readRecord,writeRecord,recordPath,qualifiedReviewDigest} from "../scripts/run-record.mjs";
import {handleNativeEvent,nativeSha256} from "../scripts/native-codex.mjs";
import {readMutantBlocks} from "../scripts/merge.mjs";
import {reviewed,writeVerdict,git,put,commit,reading} from "./qualified-delivery-fixture";
async function complete(colocated=false,change="mixed") {
  const f=await reviewed(colocated,change), prepared=await f.prepare(),sealed=await f.seal(prepared);
  const started:any=await startRun(f.product,{assignment:f.selectVerifier()}),bound=f.bindVerifier(started.record.attempt);
  expect(handleNativeEvent(f.product,f.verifierEvent("PreToolUse")).disposition).toBe("pre-admitted");
  writeVerdict(f,bound,prepared,sealed);
  expect(handleNativeEvent(f.product,f.verifierEvent("PostToolUse")).disposition).toBe("post-clean");
  f.finish(started.record.attempt);await collectRun(f.product,{attempt:started.record.attempt,ref:f.verifierRefs()});
  return {...f,request:{executorAttempt:f.sourceAttempt,verifierAttempt:started.record.attempt}};
}
function snapshot(root:string) {
  const rows:any[]=[];
  function visit(file:string) {const st=lstatSync(file);rows.push([path.relative(root,file),st.mode,st.isFile()?nativeSha256(readFileSync(file)):st.isSymbolicLink()?"symlink":"directory"]);
    if(st.isDirectory())for(const name of readdirSync(file).sort())visit(path.join(file,name));}
  visit(root);return rows;
}
test("delivery authority captures actual final whole-output facts and real changed roots without filesystem effects",async()=>{
  for(const [colocated,change] of [[false,"mixed"],[false,"product"],[false,"records"],[true,"product"]] as const) {
    const f=await complete(colocated,change);
    try {
      const before=snapshot(f.dir), captured=await captureQualifiedDeliveryAuthority(f.product,f.request);
      expect(snapshot(f.dir)).toEqual(before);expect(Object.isFrozen(captured.frozenAuthority.review)).toBe(true);
      expect(captured.roles.filter((role:any)=>role.substantiveImplementation).map((role:any)=>role.role).sort()).toEqual(change === "mixed"?["product","records"]:[change]);
      expect(captured.physicalLandings).toHaveLength(colocated?1:2);
      expect(captured.owedCorrections).toEqual([]);expect(captured).not.toHaveProperty("delivered");
      const records=captured.roles.find((role:any)=>role.role === "records");expect(records.protocolCompletion).toBe(true);
      expect(records.actualOutput.commit).not.toBe(records.candidate);
      expect(records.actualOutputGrades[0].commit).toBe(records.actualOutput.commit);
      expect(records.actualOutputGrades[0].tree).toBe(records.actualOutput.tree);
      expect((await captureQualifiedDeliveryAuthority(f.product,f.request)).authorityDigest).toBe(captured.authorityDigest);
    } finally {f.cleanup();}
  }
});
test("delivery authority refuses legacy-finished, changed collected candidates and foreign actual-output grade links",async()=>{
  const f=await complete();
  try {
    const file=recordPath(f.product,f.request.verifierAttempt), original=readFileSync(file,"utf8");
    for(const change of [(r:any)=>delete r.native.qualified.collection.phase,(r:any)=>r.native.qualified.collection.candidates.product=f.qualified.revisions.product,
      (r:any)=>r.native.qualified.collection.review.actualOutputGrades[0].tree="0".repeat(40)]) {
      const bad=JSON.parse(original);change(bad);writeFileSync(file,JSON.stringify(bad));
      await expect(captureQualifiedDeliveryAuthority(f.product,f.request)).rejects.toThrow(/QUALIFIED_/);writeFileSync(file,original);
    }
    expect((await captureQualifiedDeliveryAuthority(f.product,f.request)).taskId).toBe("T-999");
  } finally {f.cleanup();}
});
test("delivery authority retains real accepted RED output and every correction as owed rather than grading a future corrected integration",async()=>{
  const f=await reviewed(false,"padding");
  try {
    const prepared=await f.prepare(),sealed=await f.seal(prepared),a=prepared.preparation.authority;
    const start:any=await startRun(f.product,{assignment:f.selectVerifier()}),bound=f.bindVerifier(start.record.attempt);
    const worker=a.workers.find((w:any)=>w.role === "product"),temp=path.join(f.dir,"correction-reading");
    git(f.product,["worktree","add","--detach",temp,f.candidates.product]);
    const body='const {test}=require("node:test");const assert=require("node:assert");const fs=require("node:fs");test("required correction",()=>assert.equal(fs.readFileSync("src/file","utf8").trim(),"good","required correction"));\n';
    put(temp,"tests/check.cjs",body);const redCommit=commit(temp),red=reading(a,{...worker,checkout:temp},redCommit,1,'require("./tests/check.cjs")');
    put(temp,"src/file","  good\n");const greenCommit=commit(temp),green=reading(a,{...worker,checkout:temp},greenCommit,0,'require("./tests/check.cjs")');
    const suffix='\n### Correction — require the property\n\n```mutant\ncorrection: require the property\nfile: src/file\nspec: tests/check.cjs\nbody: required correction\nmessage: required correction\n--- old\n  good\n--- new\n  product candidate\n```\n';
    const blocks:any=readMutantBlocks(suffix), correction={correction:"require the property",role:"product",blockDigest:qualifiedReviewDigest(blocks.blocks[0]),bodyHash:nativeSha256(body),red,green};
    expect(handleNativeEvent(f.product,f.verifierEvent("PreToolUse","correction")).disposition).toBe("pre-admitted");
    writeVerdict(f,bound,prepared,sealed,(payload:any)=>({...payload,corrections:[correction]}),suffix);
    put(f.productBench,"tests/check.cjs",body);const actual=commit(f.productBench);
    expect(handleNativeEvent(f.product,f.verifierEvent("PostToolUse","correction")).disposition).toBe("post-clean");f.finish(start.record.attempt);
    await collectRun(f.product,{attempt:start.record.attempt,ref:f.verifierRefs()});
    const captured=await captureQualifiedDeliveryAuthority(f.product,{executorAttempt:f.sourceAttempt,verifierAttempt:start.record.attempt});
    expect(captured.owedCorrections.map((c:any)=>c.correction)).toEqual(["require the property"]);
    const product=captured.roles.find((role:any)=>role.role === "product");expect(product.actualOutput.commit).toBe(actual);expect(product.actualOutputGrades[0].exit).toBe(1);
    expect(captured.gradeObligations.find((g:any)=>g.role === "product")).toMatchObject({required:"exact-resulting-integration-commit-tree",corrections:["require the property"]});
    expect(git(f.productBench,["show","HEAD:src/file"])).toBe("product candidate");
    await expect(executeQualifiedLocalDelivery(f.product,{operationId:"red-not-delivered",executorAttempt:f.sourceAttempt,verifierAttempt:start.record.attempt,
      targets:{product:{ref:"refs/heads/main",expectedRevision:f.qualified.revisions.product},records:{ref:"refs/heads/main",expectedRevision:f.qualified.revisions.records}}})).rejects.toThrow(/QUALIFIED_DELIVERY_CORRECTIONS_PENDING/);
    expect(readAcceptedOperation(f.product,"red-not-delivered")).toBeNull();
    expect(git(f.product,["rev-parse","HEAD"])).toBe(f.qualified.revisions.product);expect(git(f.records,["rev-parse","HEAD"])).toBe(f.qualified.revisions.records);
  } finally {f.cleanup();}
});
