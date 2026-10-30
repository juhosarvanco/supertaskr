/** Original configured whole-suite capture correspondence. Stored metadata is
 * not OS execution proof; effect owners validate actual owned result artifacts.
 * Canonical reporter parsing is loaded only for new acceptance, never by a
 * cold structural record read. */
import {createHash} from "node:crypto";
import path from "node:path";
import {operationContent,operationDigest} from "./operation-record.mjs";
/** @param {any} value @param {string[]} fields */
const shape=(value,fields)=>value&&typeof value==="object"&&!Array.isArray(value)&&Object.keys(value).sort().join("\0")===[...fields].sort().join("\0");
/** @param {any} a @param {any} b */
const same=(a,b)=>operationContent(a)===operationContent(b);
/** @param {string} value */
const hash=value=>createHash("sha256").update(value,"utf8").digest("hex");
/** @param {any} v @param {number} min */
const integer=(v,min)=>Number.isSafeInteger(v)&&v>=min;
/** Canonical description of the actual configured commands. This is data,
 * never a shell command or caller-selectable execution plan.
 * @param {any} capture */
export function qualifiedConfiguredGradeCommand(capture){
 return JSON.stringify(capture.suites.map((/** @type {any} */ row)=>({cwd:row.definition.cwd,argv:row.definition.argv})));
}
/** Exact data correspondence only. Every selected original suite must occur
 * once, including failed suites; RED is retained and cannot become complete.
 * @param {any} capture @param {any} policy @param {{commit:string,tree:string}} expected */
export function validQualifiedConfiguredGateCapture(capture,policy,expected){
 return validCapture(capture,policy,expected,policy?.required);
}
/** One actual original suite result is correspondence, never a whole grade.
 * The same row/context checks serve immutable owned result artifacts.
 * @param {any} capture @param {any} policy @param {{commit:string,tree:string}} expected @param {string} suite */
export function validQualifiedConfiguredSuiteCapture(capture,policy,expected,suite){
 return Array.isArray(policy?.required)&&policy.required.includes(suite)&&validCapture(capture,policy,expected,[suite]);
}
/** @param {any} capture @param {any} policy @param {{commit:string,tree:string}} expected @param {any} selected */
function validCapture(capture,policy,expected,selected){
 try{
  if(!shape(capture,["version","policy","context","candidate","required","selected","whole","suites","complete"])||capture.version!==1||!same(capture.policy,policy)||
   !shape(capture.context,["configurationDigest","toolManifestDigest","required","policyRevision","policyDigest"])||
   !same(capture.context,{configurationDigest:policy.configurationDigest,toolManifestDigest:policy.toolManifestDigest,required:policy.required,policyRevision:policy.policyRevision,policyDigest:policy.digest})||
   !shape(capture.candidate,["productRoot","commit","tree"])||typeof capture.candidate.productRoot!=="string"||!path.isAbsolute(capture.candidate.productRoot)||
   capture.candidate.commit!==expected.commit||capture.candidate.tree!==expected.tree||!Array.isArray(policy.required)||!policy.required.length||
   new Set(policy.required).size!==policy.required.length||!same(capture.required,policy.required)||!Array.isArray(capture.selected)||new Set(capture.selected).size!==capture.selected.length||
   !Array.isArray(selected)||!same([...capture.selected].sort(),[...selected].sort())||capture.whole!==true||!Array.isArray(capture.suites)||capture.suites.length!==capture.selected.length||!Array.isArray(policy.suites))return false;
  const {digest,...body}=policy;if(digest!==operationDigest(body)||policy.registryDigest!==operationDigest(policy.suites)||!same(policy.suites.map((/** @type {any} */ s)=>s.id),policy.required))return false;
  for(const [at,row] of capture.suites.entries()){
   const id=capture.selected[at],definition=policy.suites.find((/** @type {any} */ suite)=>suite.id===id),v=row?.verdict;
   if(!shape(row,["definition","definitionDigest","verdict","output","outputDigest","transcript","transcriptDigest"])||!same(row.definition,definition)||row.definitionDigest!==operationDigest(definition)||
    typeof row.output!=="string"||Buffer.byteLength(row.output)>32*1024*1024||hash(row.output)!==row.outputDigest||typeof row.transcript!=="string"||Buffer.byteLength(row.transcript)>32*1024*1024+4096||hash(row.transcript)!==row.transcriptDigest||
    !shape(v,["suite","exit","bodies","targets","ref","tree","dirty","verdict","reason"])||v.suite!==id||v.ref!==expected.commit||v.tree!==expected.tree||v.dirty!==false||
    !integer(v.exit,0)||v.exit>255||!integer(v.bodies,1)||!integer(v.targets,0)||v.verdict!==(v.exit===0?"GREEN":"RED")||v.reason!==(v.exit===0?"ok":"suite-reported-failure"))return false;
  }
  return capture.complete===(capture.selected.length===policy.required.length&&policy.required.every((/** @type {any} */ id)=>capture.selected.includes(id))&&capture.suites.every((/** @type {any} */ row)=>row.verdict.verdict==="GREEN"));
 }catch{return false;}
}
/** A retained outer reading must describe the same complete captured output.
 * Generic qualified-verification still owns role/projection/finalization.
 * @param {any} reading @param {any} policy */
export function validQualifiedConfiguredGrade(reading,policy){
 try{
  if(reading?.role!=="product"||!validQualifiedConfiguredGateCapture(reading.configuredGate,policy,reading))return false;
  const rows=reading.configuredGate.suites,output=rows.map((/** @type {any} */ row)=>row.transcript).join("");
  return reading.command===qualifiedConfiguredGradeCommand(reading.configuredGate)&&reading.output===output&&reading.outputDigest===hash(output)&&reading.bodies===rows.reduce((/** @type {number} */ sum,/** @type {any} */ row)=>sum+row.verdict.bodies,0)&&
   reading.exit===(rows.every((/** @type {any} */ row)=>row.verdict.verdict==="GREEN")?0:1);
 }catch{return false;}
}
/** Reuse the actual reporter counter/judge/formatter; never duplicate them or
 * accept an upstream label whose actual transcript reports another result.
 * This is still correspondence, not independent process ancestry evidence.
 * @param {any} reading @param {any} policy @param {{tool:any}} configuration */
export async function assertQualifiedConfiguredGrade(reading,policy,configuration){
 if(!validQualifiedConfiguredGrade(reading,policy))throw Object.assign(new Error("QUALIFIED_CONFIGURED_GRADE_REQUIRED"),{code:"QUALIFIED_CONFIGURED_GRADE_REQUIRED"});
 const {requireInstalledRuntimeAssets}=await import("./records-check.mjs");
 requireInstalledRuntimeAssets(configuration.tool,["tools/e2e/scripts/qualified-configured-grades.mjs","tools/e2e/scripts/gate-run.mjs"]);
 const {countBodies,judge,formatVerdict}=await import("./gate-run.mjs");
 for(const row of reading.configuredGate.suites){
  const v=row.verdict,actual=judge({status:v.exit,count:countBodies(row.definition.family,row.output),ref:reading.commit,tree:reading.tree,dirty:false,suite:row.definition.id});
  const transcript=`${row.output}${row.output.endsWith("\n")||!row.output?"":"\n"}${formatVerdict(actual)}\n`;
  if(!same(actual,v)||row.transcript!==transcript)throw Object.assign(new Error("QUALIFIED_CONFIGURED_GRADE_OUTPUT_CHANGED"),{code:"QUALIFIED_CONFIGURED_GRADE_OUTPUT_CHANGED"});
 }
 return {captureDigest:operationDigest(reading.configuredGate),policyDigest:policy.digest,commit:reading.commit,tree:reading.tree,exit:reading.exit};
}
/** Data-only original membership. No PRODUCT change means no PRODUCT suite
 * obligation, even when its verifier kept a history-only candidate.
 * @param {any} authority @param {any} source */
export function validQualifiedConfiguredAuthorityGrades(authority,source){
 try{
  const capsule=source.native?.qualified?.origins?.configuredDispatch;if(capsule===undefined)return true;
  const product=authority.roles.find((/** @type {any} */ r)=>r.role==="product");
  if(!product||!Array.isArray(product.implementationChanges)||!Array.isArray(product.outputChanges))return false;
  if(!product.implementationChanges.length&&!product.outputChanges.length)return true;
  const workers=authority.frozenAuthority.preparation.workers.filter((/** @type {any} */ w)=>w.role==="product");
  const review=authority.frozenAuthority.review;
  if(workers.length!==1||!same(product.candidateGrades,review.grades.filter((/** @type {any} */ g)=>g.role==="product"))||
   !same(product.actualOutputGrades,review.actualOutputGrades.filter((/** @type {any} */ g)=>g.role==="product"))||
   product.candidateGrades[0]?.commit!==product.candidate||product.actualOutputGrades[0]?.commit!==product.actualOutput.commit||product.actualOutputGrades[0]?.tree!==product.actualOutput.tree)return false;
  return [product.candidateGrades,product.actualOutputGrades].every(rows=>Array.isArray(rows)&&rows.length===1&&rows.every(row=>
   validQualifiedConfiguredGrade(row,capsule.gatePolicy)&&row.configuredGate.candidate.productRoot===workers[0].checkout));
 }catch{return false;}
}
/** The original complete authority retains candidate and actual output grades
 * separately. Only PRODUCT work owes configured suites; private-only history
 * changes do not invent a PRODUCT battery.
 * @param {any} authority @param {any} source @param {{tool:any}} configuration */
export async function assertQualifiedConfiguredAuthorityGrades(authority,source,configuration){
 if(!validQualifiedConfiguredAuthorityGrades(authority,source))throw Object.assign(new Error("QUALIFIED_CONFIGURED_GRADE_REQUIRED"),{code:"QUALIFIED_CONFIGURED_GRADE_REQUIRED"});
 const capsule=source.native?.qualified?.origins?.configuredDispatch;if(capsule===undefined)return;
 const product=authority.roles.find((/** @type {any} */ r)=>r.role==="product");
 if(!product.implementationChanges.length&&!product.outputChanges.length)return;
 for(const reading of [...product.candidateGrades,...product.actualOutputGrades])await assertQualifiedConfiguredGrade(reading,capsule.gatePolicy,configuration);
}
