import {expect,test} from "@playwright/test";
import {normalizeExactDeliveryCiRequirement,qualifyExactDeliveryCi} from "../scripts/qualified-delivery-ci.mjs";
const SHA="a".repeat(40);
function fixture(){
 const requirement={version:1,provider:"github-actions",host:"github.com",repository:"fixture/project",workflow:".github/workflows/ci.yml",event:"push",ref:"refs/heads/main",headCommit:SHA,run:{id:100,attempt:2},checks:["parser","private-check"]};
 const evidence={version:1,provider:"github-actions",host:"github.com",repository:"fixture/project",headRepository:"fixture/project",workflow:".github/workflows/ci.yml",event:"push",ref:"refs/heads/main",headCommit:SHA,
  run:{id:100,attempt:2,checkSuiteId:200,status:"completed",conclusion:"success"},totalChecks:2,checks:requirement.checks.map((name,index)=>({jobId:300+index,checkRunId:400+index,app:"github-actions",name,headCommit:SHA,runId:100,runAttempt:2,checkSuiteId:200,status:"completed",conclusion:"success"}))};
 return {requirement,evidence};
}
test("pure exact-CI metadata classification binds the selected run attempt and returns detached evidence identities",()=>{
 const {requirement,evidence}=fixture(),result=qualifyExactDeliveryCi(requirement,evidence);
 expect(result).toMatchObject({status:"validated",code:"CI_EXACT_SUCCESS",headCommit:SHA,run:{id:100,attempt:2}});expect(result.checks.map((c:any)=>c.checkRunId)).toEqual([400,401]);
 expect(Object.isFrozen(result.checks[0])).toBe(true);evidence.checks[0]!.conclusion="failure";requirement.checks.push("unrelated");expect(result.checks[0].conclusion).toBe("success");expect(result.checks).toHaveLength(2);
 expect(result.evidenceDigest).toMatch(/^sha256:/);expect(result.requirementDigest).toMatch(/^sha256:/);
});
test("wrong commit repository workflow event destination run or attempt can never substitute for exact required CI",()=>{
 const changes=[(e:any)=>e.headCommit="b".repeat(40),(e:any)=>e.repository="other/project",(e:any)=>e.headRepository="fork/project",(e:any)=>e.workflow=".github/workflows/other.yml",(e:any)=>e.event="workflow_dispatch",(e:any)=>e.ref="refs/heads/other",(e:any)=>e.run.id=99,(e:any)=>e.run.attempt=1,
  (e:any)=>e.checks[0].headCommit="b".repeat(40),(e:any)=>e.checks[0].runId=99,(e:any)=>e.checks[0].runAttempt=1,(e:any)=>e.checks[0].checkSuiteId=201,(e:any)=>e.checks[0].app="unrelated-ci"];
 for(const change of changes){const {requirement,evidence}=fixture();change(evidence);expect(qualifyExactDeliveryCi(requirement,evidence).status).toBe("validation-unknown");}
});
test("partial missing or duplicate required CI remains unavailable and an unrelated green cannot fill it",()=>{
 const {requirement,evidence}=fixture();
 const partial=structuredClone(evidence);partial.totalChecks=3;expect(qualifyExactDeliveryCi(requirement,partial).code).toBe("CI_PROVIDER_SET_INCOMPLETE");
 const missing=structuredClone(evidence);missing.checks[1]!.name="unrelated";expect(qualifyExactDeliveryCi(requirement,missing).code).toBe("CI_REQUIRED_CHECK_MISSING");
 const ambiguous=structuredClone(evidence);ambiguous.checks.push({...ambiguous.checks[0]!,jobId:999,checkRunId:998});ambiguous.totalChecks=3;expect(qualifyExactDeliveryCi(requirement,ambiguous).code).toBe("CI_REQUIRED_CHECK_AMBIGUOUS");
 const duplicate=structuredClone(evidence);duplicate.checks[1]!.checkRunId=duplicate.checks[0]!.checkRunId;expect(qualifyExactDeliveryCi(requirement,duplicate).code).toBe("CI_CHECK_IDENTITY_INVALID");
});
test("failed skipped unknown or still-running required CI cannot report exact successful validation",()=>{
 for(const conclusion of ["failure","neutral","cancelled","skipped","timed_out","action_required","stale","startup_failure"]){const {requirement,evidence}=fixture();evidence.checks[1]!.conclusion=conclusion;expect(qualifyExactDeliveryCi(requirement,evidence).status).toBe("validation-failed");}
 const {requirement,evidence}=fixture(),running:any=structuredClone(evidence);running.run.status="in_progress";running.run.conclusion=null;running.checks[1].status="queued";running.checks[1].conclusion=null;
 expect(qualifyExactDeliveryCi(requirement,running).status).toBe("validation-pending");
 const unknown:any=structuredClone(evidence);unknown.checks[1].conclusion=null;expect(qualifyExactDeliveryCi(requirement,unknown).status).toBe("validation-unknown");
 const workflowFailure=structuredClone(evidence);workflowFailure.run.conclusion="failure";expect(qualifyExactDeliveryCi(requirement,workflowFailure).status).toBe("validation-failed");
});
test("a frozen CI requirement has no empty defaults and malformed provider data remains unknown",()=>{
 const {requirement,evidence}=fixture();for(const change of [(r:any)=>r.checks=[],(r:any)=>r.checks.push(r.checks[0]),(r:any)=>r.provider="other",(r:any)=>r.run.attempt=0,(r:any)=>r.headCommit="HEAD"]){const invalid=structuredClone(requirement);change(invalid);expect(()=>normalizeExactDeliveryCiRequirement(invalid)).toThrow(/CI_REQUIREMENT_INVALID/);}
 expect(qualifyExactDeliveryCi(requirement,{...evidence,accepted:true}).status).toBe("validation-unknown");expect(qualifyExactDeliveryCi(requirement,null).status).toBe("validation-unknown");
});
test("committed selection normalization preserves literal check identities while exact observations still require a real run and valid ref",()=>{
 const {requirement}=fixture();requirement.repository="Fixture/PROJECT";requirement.checks=["Build / Python (Linux)"];
 const normalized=normalizeExactDeliveryCiRequirement(requirement);expect(normalized.repository).toBe("fixture/project");expect(normalized.checks).toEqual(["Build / Python (Linux)"]);expect(normalized.run).toEqual({id:100,attempt:2});
 for(const ref of ["refs/heads/.hidden","refs/heads/main.lock","refs/heads/main.","refs/heads/main/"]){expect(()=>normalizeExactDeliveryCiRequirement({...requirement,ref})).toThrow(/CI_REQUIREMENT_INVALID/);}
 expect(()=>normalizeExactDeliveryCiRequirement({...requirement,run:undefined})).toThrow(/CI_REQUIREMENT_INVALID/);
});
