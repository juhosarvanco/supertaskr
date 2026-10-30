import path from "node:path";
import {readFileSync} from "node:fs";
import {expect,test} from "@playwright/test";
import {configuredDeliveryFixture} from "./configured-delivery-fixture";
import {privateGit,putPrivate} from "./private-record-fixture";

test("planned PRODUCT foundation uses actual finalized configured readings and preserves advanced target bytes without effects",async()=>{
 test.setTimeout(600_000);const f=await configuredDeliveryFixture();try{
  const [planOwner,records,grades]=await Promise.all(["qualified-integration-plan","durable-operation","qualified-configured-grades"].map(name=>import(f.module(name))));
  const policySource=await (await import(f.module("qualified-delivery-operation"))).captureQualifiedDeliveryPolicySource(f.product,f.verifierAttempt,{tool:f.tool});
  expect(grades.validQualifiedConfiguredAuthorityGrades(f.authority,policySource)).toBe(true);
  const product=f.authority.roles.find((r:any)=>r.role==="product");
  expect(product.actualOutputGrades[0].configuredGate.complete).toBe(true);expect(product.actualOutputGrades[0].bodies).toBe(1);
  expect(f.authority.frozenAuthority.preparation.card.text).toContain("review: independent");
  putPrivate(f.product,"later-independent.txt","Legitimate advanced PRODUCT base.\n");privateGit(f.product,["add","later-independent.txt"]);privateGit(f.product,["commit","-qm","Later independent PRODUCT history"]);
  f.input.targets.product.expectedRevision=privateGit(f.product,["rev-parse","HEAD"]);
  const snapshot=()=>[f.product,f.records].map(root=>({refs:privateGit(root,["for-each-ref","--format=%(refname) %(objectname)"]),objects:privateGit(root,["count-objects","-v"]),index:readFileSync(path.join(root,".git/index")).toString("base64")})),before=snapshot();
  const proposal=await planOwner.captureQualifiedIntegrationPlan(f.product,f.input,{tool:f.tool}),plan=planOwner.qualifiedIntegrationPlanData(proposal),planned=plan.roles.find((r:any)=>r.role==="product");
  expect(planned.grade.status).toBe("owed");expect(planned.expectedRevision).not.toBe(planned.originalBase);expect(planned.commit).not.toBe(product.actualOutput.commit);
  expect(plan.recordsValidation.unmodeled).toEqual([]);expect(plan.source.configuredDispatch.digest).toBe(f.source.source.capsuleDigest);
  expect(snapshot()).toEqual(before);expect(records.readAcceptedOperation(f.product,f.input.operationId)).toBeNull();
 }finally{f.cleanup();}
});
