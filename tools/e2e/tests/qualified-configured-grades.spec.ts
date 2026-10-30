import {readFileSync} from "node:fs";
import path from "node:path";
import {test,expect} from "@playwright/test";
import {parse} from "yaml";
import {captureConfiguredGatePolicy,createConfiguredGateRunner} from "../scripts/gate-run.mjs";
import {validQualifiedConfiguredGateCapture,validQualifiedConfiguredSuiteCapture,validQualifiedConfiguredGrade,assertQualifiedConfiguredGrade,validQualifiedConfiguredAuthorityGrades} from "../scripts/qualified-configured-grades.mjs";
import {operationDigest} from "../scripts/operation-record.mjs";
import {TOKEN_REL_PATH} from "../../../cli/gate-token.mjs";
import {loadInstalledRecordTool} from "../scripts/records-check.mjs";
import {privateRecordFixture,fixtureProjectSettings,putPrivate,privateGit,sha} from "./private-record-fixture";

const actual="import unittest\nclass Actual(unittest.TestCase):\n def test_one(self): self.assertEqual(2+2,4)\n def test_two(self): self.assertTrue(True)\n";
function fixture(){
 const f=privateRecordFixture(),tool=loadInstalledRecordTool(f.manifestPath),settings=parse(fixtureProjectSettings(f));
 const suite={id:"python",cwd:".",sentinel:"pyproject.toml",argv:["python3","-m","unittest","discover","-s","checks","-v"],family:"unittest",solo:false,why:"Actual original configured whole outputs"};
 settings.suites=[suite,{...suite,id:"python-extra"}];
 putPrivate(f.product,".gitignore",".supertaskr/\n__pycache__/\n");putPrivate(f.product,"pyproject.toml","[project]\nname='grade-example'\nversion='0.0.0'\n");
 putPrivate(f.product,"checks/test_actual.py",actual);putPrivate(f.product,"cheap/test_cheap.py","import unittest\nclass Cheap(unittest.TestCase):\n def test_one(self): self.assertTrue(True)\n");
 putPrivate(f.product,"supertaskr.yaml",JSON.stringify(settings));privateGit(f.product,["add","."]);privateGit(f.product,["commit","-qm","Original configured grading policy"]);
 const original=privateGit(f.product,["rev-parse","HEAD"]),policy=captureConfiguredGatePolicy({productRoot:f.product,productRevision:original,tool});
 settings.suites[0].argv=["python3","-m","unittest","discover","-s","cheap","-v"];putPrivate(f.product,"supertaskr.yaml",JSON.stringify(settings));privateGit(f.product,["add","supertaskr.yaml"]);privateGit(f.product,["commit","-qm","Current same-ID command differs"]);
 const candidate=privateGit(f.product,["rev-parse","HEAD"]);return {...f,tool,policy,candidate};
}
// Pure reading projection of actual runner output. No finalized authority,
// operation row, caller acceptance or target effect is constructed here.
function reading(result:any){
 const capture=result.capture,output=capture.suites.map((row:any)=>row.transcript).join("");
 return {role:"product",commit:capture.candidate.commit,tree:capture.candidate.tree,exit:result.code,bodies:capture.suites.reduce((sum:number,row:any)=>sum+row.verdict.bodies,0),
  command:JSON.stringify(capture.suites.map((row:any)=>({cwd:row.definition.cwd,argv:row.definition.argv}))),output,outputDigest:sha(output),configuredGate:capture};
}
test("actual original whole-suite metadata cannot be replaced by current same-ID, partial, foreign-tree or changed command captures",async()=>{
 const f=fixture();try{
  const before=readFileSync(path.join(f.product,".git/index")),runner=createConfiguredGateRunner({productRoot:f.product,productRevision:f.candidate,policy:f.policy}),result=runner.run(f.policy.required),grade=reading(result);
  expect(grade.bodies).toBe(4);expect(result.capture.complete).toBe(true);
  const token=path.join(f.product,TOKEN_REL_PATH),tokenBefore=readFileSync(token);
  const fabricated=createConfiguredGateRunner({productRoot:f.product,productRevision:f.candidate,policy:f.policy},{version:1,kind:"planned-integration-grade"});
  expect(()=>fabricated.run(["python"])).toThrow("QUALIFIED_INTEGRATION_GRADE_AUTHORITY_REQUIRED");
  expect(readFileSync(token)).toEqual(tokenBefore);
  expect(validQualifiedConfiguredGateCapture(result.capture,f.policy,grade)).toBe(true);expect(validQualifiedConfiguredGrade(grade,f.policy)).toBe(true);
  expect(await assertQualifiedConfiguredGrade(grade,f.policy,{tool:f.tool})).toMatchObject({policyDigest:f.policy.digest,commit:f.candidate,tree:grade.tree,exit:0});
  const unrelatedCommand={...grade,command:"an unrelated command label"};expect(validQualifiedConfiguredGrade(unrelatedCommand,f.policy)).toBe(false);
  await expect(assertQualifiedConfiguredGrade(unrelatedCommand,f.policy,{tool:f.tool})).rejects.toMatchObject({code:"QUALIFIED_CONFIGURED_GRADE_REQUIRED"});
  const partial=reading(runner.run(["python"]));expect(validQualifiedConfiguredGrade(partial,f.policy)).toBe(false);
  expect(validQualifiedConfiguredSuiteCapture(partial.configuredGate,f.policy,partial,"python")).toBe(true);
  expect(validQualifiedConfiguredSuiteCapture(partial.configuredGate,f.policy,partial,"python-extra")).toBe(false);
  expect(validQualifiedConfiguredGateCapture(partial.configuredGate,f.policy,partial)).toBe(false);
  const mislabeled=structuredClone(partial.configuredGate);mislabeled.complete=true;
  expect(validQualifiedConfiguredSuiteCapture(mislabeled,f.policy,partial,"python")).toBe(false);
  const current=reading(createConfiguredGateRunner({productRoot:f.product,productRevision:f.candidate,tool:f.tool}).run(f.policy.required));expect(current.bodies).toBe(3);expect(validQualifiedConfiguredGrade(current,f.policy)).toBe(false);
  const wrongTree=structuredClone(grade);wrongTree.tree="f".repeat(40);expect(validQualifiedConfiguredGrade(wrongTree,f.policy)).toBe(false);
  const wrongCommand=structuredClone(grade);wrongCommand.configuredGate.suites[0].definition.argv.push("different");wrongCommand.configuredGate.suites[0].definitionDigest=operationDigest(wrongCommand.configuredGate.suites[0].definition);expect(validQualifiedConfiguredGrade(wrongCommand,f.policy)).toBe(false);
  expect(validQualifiedConfiguredGrade({...grade,configuredGate:undefined},f.policy)).toBe(false);
  expect(readFileSync(path.join(f.product,".git/index"))).toEqual(before);expect(privateGit(f.product,["rev-parse","HEAD"])).toBe(f.candidate);
 }finally{f.cleanup();}
});
test("actual RED stays failed and a byte-consistent contradictory reporter count cannot acquire canonical grade correspondence",async()=>{
 const f=fixture();try{
  putPrivate(f.product,"checks/test_actual.py",actual.replace("2+2,4","2+2,5"));privateGit(f.product,["add","checks/test_actual.py"]);privateGit(f.product,["commit","-qm","Actual still-failing candidate"]);
  const candidate=privateGit(f.product,["rev-parse","HEAD"]),red=reading(createConfiguredGateRunner({productRoot:f.product,productRevision:candidate,policy:f.policy}).run(f.policy.required));
  expect(red.exit).toBe(1);expect(red.configuredGate.complete).toBe(false);expect(validQualifiedConfiguredGrade(red,f.policy)).toBe(true);expect((await assertQualifiedConfiguredGrade(red,f.policy,{tool:f.tool})).exit).toBe(1);
  putPrivate(f.product,"checks/test_actual.py",actual);privateGit(f.product,["add","checks/test_actual.py"]);privateGit(f.product,["commit","-qm","Actual corrected candidate"]);
  const restored=privateGit(f.product,["rev-parse","HEAD"]),green=reading(createConfiguredGateRunner({productRoot:f.product,productRevision:restored,policy:f.policy}).run(f.policy.required));
  expect((await assertQualifiedConfiguredGrade(green,f.policy,{tool:f.tool})).exit).toBe(0);
  const contradictory=structuredClone(green),row=contradictory.configuredGate.suites[0];row.output=row.output.replace("Ran 2 tests","Ran 3 tests");expect(row.output).not.toBe(green.configuredGate.suites[0].output);
  row.outputDigest=sha(row.output);row.transcript=row.transcript.replace("Ran 2 tests","Ran 3 tests");row.transcriptDigest=sha(row.transcript);
  contradictory.output=contradictory.configuredGate.suites.map((r:any)=>r.transcript).join("");contradictory.outputDigest=sha(contradictory.output);
  expect(validQualifiedConfiguredGrade(contradictory,f.policy)).toBe(true);await expect(assertQualifiedConfiguredGrade(contradictory,f.policy,{tool:f.tool})).rejects.toMatchObject({code:"QUALIFIED_CONFIGURED_GRADE_OUTPUT_CHANGED"});
  // Deliberately data-only authority shape: no finalized source is claimed.
  const source={native:{qualified:{origins:{configuredDispatch:{gatePolicy:f.policy}}}}};
  const authority={frozenAuthority:{preparation:{workers:[{role:"product",checkout:f.product}]},review:{grades:[green],actualOutputGrades:[red]}},roles:[{role:"product",candidate:green.commit,actualOutput:{commit:red.commit,tree:red.tree},implementationChanges:[{path:"checks/test_actual.py"}],outputChanges:[],candidateGrades:[green],actualOutputGrades:[red]}]};
  expect(validQualifiedConfiguredAuthorityGrades(authority,source)).toBe(true);
  expect(validQualifiedConfiguredAuthorityGrades({...authority,roles:[{...authority.roles[0],actualOutputGrades:[{...red,configuredGate:undefined}]}]},source)).toBe(false);
  expect(validQualifiedConfiguredAuthorityGrades({...authority,roles:[{...authority.roles[0],candidate:red.commit}]},source)).toBe(false);
  expect(validQualifiedConfiguredAuthorityGrades({...authority,frozenAuthority:{...authority.frozenAuthority,preparation:{workers:[{role:"product",checkout:path.join(f.dir,"different-checkout")} ]}}},source)).toBe(false);
  expect(validQualifiedConfiguredAuthorityGrades({roles:[{role:"product",implementationChanges:[],outputChanges:[],candidateGrades:[],actualOutputGrades:[]}]},source)).toBe(true);
 }finally{f.cleanup();}
});
