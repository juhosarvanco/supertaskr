/** Authored data for the finite bank schema. Initialization/check/parented Git
 * planning are real; no bank effect or accepted bank witness is fabricated as
 * an application outcome by this helper.
 */
import {statSync,readFileSync,writeFileSync,mkdirSync} from "node:fs";
import path from "node:path";
import {genesisFixture,genesisInput,withGenesisIdentity} from "./genesis-init-fixture";
import {executeProjectInitialization,captureOperationCommitIdentity} from "../scripts/project-init-operation.mjs";
import {inspectProjectInitialization} from "../scripts/genesis-init-inspect.mjs";
import {captureGenesisBankProposal,GENESIS_BANK_PROPOSAL} from "../scripts/genesis-bank-proposal.mjs";
import {captureExactCommitPlan} from "../scripts/record-write.mjs";
import {createRecordChecker,checkedRecordWriteSet,verifyInstalledRecordTool} from "../scripts/records-check.mjs";
import {prepareGenesisInitialization} from "../scripts/genesis-init-plan.mjs";
import {operationDigest,operationWork} from "../scripts/operation-record.mjs";
import {sha} from "./private-record-fixture";
import {createGenesisProposalReader,GENESIS_PRODUCT_PROPOSAL} from "../scripts/genesis-proposal.mjs";
import {validateProjectSettingsText} from "../scripts/project-settings.mjs";
export function bankSchemaFixture(){
 const f=genesisFixture();
 try{
  const init=withGenesisIdentity(()=>prepareGenesisInitialization(genesisInput(f)));
  const receipt=executeProjectInitialization(f.product,init.request,{authorize(){verifyInstalledRecordTool(f.toolHandle);return true;}});
  const inspected=inspectProjectInitialization({productRoot:f.product,tool:f.toolHandle}),current=inspected.current;
  const original=(repo:any)=>({root:repo.identities[0],gitDirectory:repo.identities[1],commonDirectory:repo.identities[2]});
  const origin={version:1,layout:"split",associationId:receipt.projectId,product:original(current.product),records:original(current.records),docs:current.docs,runtime:current.runtime};
  const context={setupId:receipt.operationId,sessionId:"genesis-authored-bank-session",originDigest:operationDigest(origin),productRevision:current.productRevision,recordsRevision:current.recordsRevision};
  const executable=path.join(f.dir,"authored-planner");writeFileSync(executable,"Authored original executable metadata; this file is not launched.\n");const exe=statSync(executable);
  if(inspected.planner.status!=="ready")throw Error("fixture needs a qualified configured planner");
  const planner={selection:inspected.planner.selection,provenance:inspected.planner.provenance,executable:{path:executable,target:executable,device:String(exe.dev),inode:String(exe.ino),mode:exe.mode,bytes:exe.size,sha256:`sha256:${sha("Authored original executable metadata; this file is not launched.\n")}`,version:"2.1.226 (Claude Code)",loginPathDigest:null}};
  const registry={sessions:[{id:"S1",agent:"claude",created:new Date().toISOString(),turns:1,tasks:[],roles:["planner"],status:"idle",genesis:{id:context.sessionId,origin,planner}}]};
  const registryPath=path.join(f.product,".supertaskr/sessions.json"),transcriptPath=path.join(f.product,".supertaskr/genesis/transcript.jsonl");
  writeFileSync(registryPath,JSON.stringify(registry));writeFileSync(transcriptPath,"");
  const runtime=(file:string,source:string)=>{const stat=statSync(file);return {path:file,device:String(stat.dev),inode:String(stat.ino),fileMode:stat.mode&0o777,byteLength:Buffer.byteLength(source),sha256:sha(source)};};
  const state=Buffer.from("# State\n\nUpdated: 2026-10-30\n\n## In progress\nQ1 problem and person.\n");
  writeFileSync(path.join(f.records,"docs/STATE.md"),state);mkdirSync(path.join(f.records,"docs/plans"));
  const proposal={version:1,setupId:context.setupId,sessionId:context.sessionId,originDigest:context.originDigest,proposalId:"first-scaffold-bank",stage:0,
   expectedProductRevision:context.productRevision,expectedRecordsRevision:context.recordsRevision,answerRefs:[],records:[{path:"docs/STATE.md",sha256:sha(state)}]};
  const bytes=Buffer.from(JSON.stringify(proposal));writeFileSync(path.join(f.records,GENESIS_BANK_PROPOSAL),bytes);
  const captured=captureGenesisBankProposal({bytes,context,answers:[],files:[{path:"docs/STATE.md",mode:"100644",bytes:state}]});
  const checker=createRecordChecker({tool:f.toolHandle,profile:inspected.settings.records.validation});
  const baseline=checker.capture({productRoot:f.product,productRevision:context.productRevision,recordsRevision:context.recordsRevision});
  const checked=checker.evaluate(baseline,[{operation:"edit",path:"docs/STATE.md",type:"blob",mode:"100644",bytes:state}]);if(!checked.accepted)throw Error(JSON.stringify(checked.blocking));
  const accepted=checkedRecordWriteSet(checked);
  const derived=accepted.writes.map((write:any)=>({operation:write.operation,path:write.path,mode:write.mode,base64:Buffer.from(write.bytes).toString("base64"),derived:write.derived}));
  const writes=[...derived,{operation:"add",path:GENESIS_BANK_PROPOSAL,mode:"100644",base64:bytes.toString("base64"),derived:false}];
  const operationId="bank-schema-fixture",message=`Bank project scaffold continuation\n\nSupertaskr-Project-Bank: ${operationId}/records\n`;
  const plan=withGenesisIdentity(()=>captureExactCommitPlan(f.records,context.recordsRevision,writes,{identity:captureOperationCommitIdentity(f.product),message}));
  const request={version:1,kind:"project-bank",operationId,tool:f.toolHandle,
   setup:{operationId:receipt.operationId,requestDigest:receipt.requestDigest,receiptDigest:receipt.receiptDigest,projectId:receipt.projectId,productRevision:receipt.product.commit,recordsRevision:receipt.records.commit},
   session:{registryId:"S1",sessionId:context.sessionId,origin,originDigest:context.originDigest,planner},
   input:{productRevision:context.productRevision,recordsRevision:context.recordsRevision,productRepository:current.product,recordsRepository:current.records,docsIdentity:current.docs,runtimeIdentity:current.runtime,settingsProvenance:inspected.settingsProvenance,
    registryCapture:{...runtime(registryPath,JSON.stringify(registry)),base64:Buffer.from(JSON.stringify(registry)).toString("base64")},transcriptCapture:{...runtime(transcriptPath,""),lines:[]},previousBank:null},
   bank:{stage:0,proposalCapture:captured,productProposalCapture:null,answers:[],validation:{current:{profile:checker.profile,captureDigest:baseline.digest,candidateDigest:checked.candidateDigest,writeSetDigest:operationDigest(derived)},prospective:null}},
   plans:{records:{repository:current.records,targetRef:"refs/heads/main",expectedRevision:context.recordsRevision,writes,...plan,message},product:null}};
  return {...f,request,receipt};
 }catch(error){f.cleanup();throw error;}
}
/** Pure authored progress rows, not proof of a real effect. */
export function authoredBankRow(request:ReturnType<typeof bankSchemaFixture>["request"]){
 const at="2026-10-30T00:00:00.000Z",work=operationWork(request.operationId),resource=request.input.productRepository.root;
 const assignment={kind:"operation",id:work,role:"project-bank",resource};
 const claims=(["product","records"] as const).map(role=>{const root=request.input[`${role}Repository`].root;return {role,resource:root,file:path.join(resource,".supertaskr/runs/reservations",`${path.basename(root)}-${sha(root).slice(0,12)}.json`),takenAt:at,releasedAt:null as string|null};});
 return {version:1,recordKind:"operation",attempt:`${work}-a1`,state:"starting",assignment,assignmentDigest:`sha256:${sha(JSON.stringify(assignment))}`,writer:true,resource,
  reservation:{file:claims[0]!.file,takenAt:at,releasedAt:null as string|null},execution:null,admission:null,
  operation:{version:1,id:request.operationId,kind:"project-bank",request,digest:operationDigest(request),owner:{pid:process.pid,identity:"authored-schema-owner",token:"authored-schema-token"},createdAt:at,claims,
   progress:{records:{stage:"captured",intent:null as any,acceptance:null as any},product:{stage:"not-required",intent:null as any,acceptance:null as any}},acceptance:null as any},events:[{at,op:"project-bank-capture"}]};
}


/** Q1 plan data uses real typed-byte/checker/parented Git captures. The prior
 * stage receipt is authored schema data only: no bank executor exists yet.
 */
export function q1BankSchemaRequest(f:ReturnType<typeof bankSchemaFixture>):any{
 const before=f.request,request=structuredClone(before),operationId="bank-q1-schema-fixture";
 const context={setupId:before.setup.operationId,sessionId:before.session.sessionId,originDigest:before.session.originDigest,productRevision:before.input.productRevision,recordsRevision:before.input.recordsRevision};
 const text="A small notes tool for solo builders.",answers=[{turn:2,text,setupId:context.setupId,sessionId:context.sessionId,originDigest:context.originDigest}],refs=[{turn:2,sha256:sha(text)}];
 const line=JSON.stringify({turn:2,role:"user",text,atMs:1793318400000,genesis:{sessionId:context.sessionId,originDigest:context.originDigest}})+"\n";
 const transcript=before.input.transcriptCapture.path;writeFileSync(transcript,line);const ts=statSync(transcript);
 const registryPath=before.input.registryCapture.path,registry=JSON.parse(readFileSync(registryPath,"utf8"));registry.sessions[0].turns=2;const registryText=JSON.stringify(registry);writeFileSync(registryPath,registryText);const rs=statSync(registryPath);
 const state=Buffer.from("# State\n\nUpdated: 2026-10-30\n\n## In progress\nQ2 success.\n"),north=Buffer.concat([readFileSync(path.join(f.records,"docs/NORTH_STAR.md")),Buffer.from("\nA typed vision in this authored schema fixture.\n")]);
 const files=[{path:"docs/STATE.md",mode:"100644",bytes:state},{path:"docs/NORTH_STAR.md",mode:"100644",bytes:north}];for(const file of files)writeFileSync(path.join(f.records,file.path),file.bytes);
 const proposal={version:1,setupId:context.setupId,sessionId:context.sessionId,originDigest:context.originDigest,proposalId:"typed-q1-bank",stage:1,expectedProductRevision:context.productRevision,expectedRecordsRevision:context.recordsRevision,answerRefs:refs,records:files.map(file=>({path:file.path,sha256:sha(file.bytes)}))};
 const bytes=Buffer.from(JSON.stringify(proposal));writeFileSync(path.join(f.records,GENESIS_BANK_PROPOSAL),bytes);const captured=captureGenesisBankProposal({bytes,context,answers,files});
 const productProposal={version:1,setupId:context.setupId,sessionId:context.sessionId,originDigest:context.originDigest,proposalId:proposal.proposalId,bank:"identity",expectedProductRevision:context.productRevision,expectedRecordsRevision:context.recordsRevision,answerRefs:refs,identity:{projectName:"Fixture notes",oneLiner:text}};
 const productBytes=Buffer.from(JSON.stringify(productProposal));writeFileSync(path.join(f.records,GENESIS_PRODUCT_PROPOSAL),productBytes);
 const productCapture=createGenesisProposalReader({validateSettings:(settings:any)=>validateProjectSettingsText({source:JSON.stringify(settings),tool:f.toolHandle}).status==="ready"}).capture({bytes:productBytes,context,answers});
 const checker=createRecordChecker({tool:f.toolHandle,profile:before.bank.validation.current.profile}),baseline=checker.capture({productRoot:f.product,productRevision:context.productRevision,recordsRevision:context.recordsRevision});
 const checked=checker.evaluate(baseline,files.map(file=>({operation:"edit",path:file.path,type:"blob",mode:file.mode,bytes:file.bytes})));if(!checked.accepted)throw Error(JSON.stringify(checked.blocking));
 const accepted=checkedRecordWriteSet(checked),derived=accepted.writes.map((write:any)=>({operation:write.operation,path:write.path,mode:write.mode,base64:Buffer.from(write.bytes).toString("base64"),derived:write.derived}));
 const writes=[...derived,{operation:"add",path:GENESIS_BANK_PROPOSAL,mode:"100644",base64:bytes.toString("base64"),derived:false},{operation:"add",path:GENESIS_PRODUCT_PROPOSAL,mode:"100644",base64:productBytes.toString("base64"),derived:false}];
 const message=`Bank project identity\n\nSupertaskr-Project-Bank: ${operationId}/records\n`;
 const r=withGenesisIdentity(()=>captureExactCommitPlan(f.records,context.recordsRevision,writes,{identity:captureOperationCommitIdentity(f.product),message}));
 const pWrites=["AGENTS.md","CLAUDE.md"].map(file=>({operation:"edit",path:file,mode:"100644",base64:readFileSync(path.join(f.product,file),"utf8").replace("<project name>",productProposal.identity.projectName).replace("<One sentence: what this repo is.>",text),derived:false})).map(file=>({...file,base64:Buffer.from(file.base64).toString("base64")}));
 const pMessage=`Configure project identity\nSupertaskr-Records-Bank: ${r.commit}\n\nSupertaskr-Project-Bank: ${operationId}/product\n`;
 const p=withGenesisIdentity(()=>captureExactCommitPlan(f.product,context.productRevision,pWrites,{identity:captureOperationCommitIdentity(f.product),message:pMessage}));
 request.operationId=operationId;request.bank={stage:1,proposalCapture:captured,productProposalCapture:productCapture,answers:captured.answers,validation:{current:{profile:checker.profile,captureDigest:baseline.digest,candidateDigest:checked.candidateDigest,writeSetDigest:operationDigest(derived)},prospective:null}} as any;
 request.input.registryCapture={path:registryPath,device:String(rs.dev),inode:String(rs.ino),fileMode:rs.mode&0o777,byteLength:Buffer.byteLength(registryText),sha256:sha(registryText),base64:Buffer.from(registryText).toString("base64")};
 request.input.transcriptCapture={path:transcript,device:String(ts.dev),inode:String(ts.ino),fileMode:ts.mode&0o777,byteLength:Buffer.byteLength(line),sha256:sha(line),lines:[{offset:0,base64:Buffer.from(line).toString("base64"),sha256:sha(line)}]} as any;
 request.input.previousBank={operationId:before.operationId,requestDigest:operationDigest(before),receiptDigest:operationDigest({authored:"schema-only prior receipt"}),stage:0,recordsCommit:before.plans.records.commit,productCommit:null} as any;
 request.plans={records:{repository:before.input.recordsRepository,targetRef:"refs/heads/main",expectedRevision:context.recordsRevision,writes,...r,message},product:{repository:before.input.productRepository,targetRef:"refs/heads/main",expectedRevision:context.productRevision,writes:pWrites,...p,message:pMessage}} as any;
 return request;
}
