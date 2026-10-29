/** Fixed owned child entry. It cannot execute before its actual PID/start/
 * group/bytes are durably published in the original operation and IPC starts
 * that exact launch. It accepts no caller program, policy, writes or refspec. */
import {spawn} from "node:child_process";
import {readAcceptedOperation} from "./durable-operation.mjs";
import {loadInstalledRecordTool,installedRecordAsset} from "./records-check.mjs";
import {loadQualifiedDeliveryPolicy} from "./qualified-admission.mjs";
import {assertQualifiedDeliveryContinuation} from "./qualified-delivery-operation.mjs";
import {capturePublicationProcessProof,publicationProcess,publicationPushArguments} from "./qualified-publication-process.mjs";
import {publicationPushCommand,readQualifiedPublicationGate} from "./qualified-publication-hook.mjs";
import {loadConfiguredGateConfiguration} from "./gate-run.mjs";
import {isMain} from "../../../cli/is-main.mjs";
/** @param {string} code @returns {never} */
function refuse(code){throw Object.assign(new Error(`${code}: publication launch refused`),{code});}
/** @param {string[]} argv */
export async function main(argv){
 if(argv.length!==6||argv[0]!=="--root"||argv[2]!=="--operation"||argv[4]!=="--token"||!process.connected)refuse("QUALIFIED_PUBLICATION_LAUNCH_REQUEST");
 const root=/** @type {string} */(argv[1]),id=/** @type {string} */(argv[3]),token=argv[5];
 /** @type {any} */ let original=null;
 // This process may terminate only its own still-live group. A disconnect
 // never sends a signal using a stale coordinator-record PID.
 const stopOwnGroup=()=>{
  if(original){try{const self=publicationProcess(process.pid),p=original.process;if(self.pid===p.pid&&self.startedAt===p.identity&&self.group===p.group&&self.group===self.pid)process.kill(-self.group,"SIGKILL");}catch{/* no unsafe guessed signal */}}
  process.exitCode=3;
 };
 process.on("disconnect",stopOwnGroup);process.stdout.on("error",stopOwnGroup);process.stderr.on("error",stopOwnGroup);
 await new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>reject(new Error("QUALIFIED_PUBLICATION_START_TIMEOUT")),10_000);
  process.once("disconnect",()=>{clearTimeout(timer);reject(new Error("QUALIFIED_PUBLICATION_START_DISCONNECTED"));});
  process.once("message",(message)=>{clearTimeout(timer);if(!message||typeof message!=="object"||Object.keys(message).sort().join(",")!=="kind,token"||/** @type {any} */(message).kind!=="start"||/** @type {any} */(message).token!==token)reject(new Error("QUALIFIED_PUBLICATION_START_CHANGED"));else resolve(null);});
 });
 const rec=readAcceptedOperation(root,id);if(rec?.operation.kind!=="qualified-delivery")refuse("QUALIFIED_PUBLICATION_ABSENT");
 const launch=rec.operation.publication?.launches.at(-1);if(!launch||launch.token!==token)refuse("QUALIFIED_PUBLICATION_LAUNCH_CHANGED");original=launch;
 capturePublicationProcessProof(rec,launch.stage);const tool=loadInstalledRecordTool();
 await loadQualifiedDeliveryPolicy();
 const policy=()=>{
  const current=readAcceptedOperation(root,id);
  if(current?.operation.digest!==rec.operation.digest||current.operation.publication?.launches.at(-1)?.token!==token)refuse("QUALIFIED_PUBLICATION_LAUNCH_CHANGED");
  return assertQualifiedDeliveryContinuation(root,current,{tool},capturePublicationProcessProof(current,launch.stage));
 };
 /** Keep IPC loss actionable while actual checks/Git are running. Every child
  * stays in this durably captured group; no caller program/argv is accepted.
  * @param {string} program @param {string[]} args @param {string} [input] @param {NodeJS.ProcessEnv} [env]
  * @returns {Promise<number>} */
 const execute=(program,args,input,env=process.env)=>new Promise((resolve,reject)=>{
  const child=spawn(program,args,{cwd:root,env,stdio:[input===undefined?"ignore":"pipe","pipe","pipe"]});let bytes=0;
  child.stdout?.on("data",chunk=>{bytes+=chunk.length;if(bytes>4*1024*1024)stopOwnGroup();else process.stdout.write(chunk);});
  child.stderr?.on("data",chunk=>{bytes+=chunk.length;if(bytes>4*1024*1024)stopOwnGroup();else process.stderr.write(chunk);});
  child.once("error",reject);child.once("close",(code,signal)=>resolve(signal?3:code??3));if(input!==undefined)child.stdin?.end(input);
 });
 policy();
 if(launch.stage==="checks"){
  const configuration=loadConfiguredGateConfiguration({productRoot:root,productRevision:rec.operation.request.route.publication.commit,tool}),entry=installedRecordAsset(tool,"tools/e2e/scripts/gate-run.mjs");
  for(const suite of configuration.context.required){policy();const code=await execute(launch.node.path,[entry,"--root",root,"--at",configuration.productRevision,suite]);if(code!==0){process.stderr.write(`QUALIFIED_PUBLICATION_CHECKS_${code===1?"RED":"UNAVAILABLE"}: configured checks did not qualify\n`);return code;}}
  policy();readQualifiedPublicationGate(rec,tool);return 0;
 }
 if(launch.stage!=="push")refuse("QUALIFIED_PUBLICATION_LAUNCH_STAGE");
 readQualifiedPublicationGate(rec,tool);policy();
 const entry=installedRecordAsset(tool,"tools/e2e/scripts/product-hook.mjs"),command=publicationPushCommand(rec.operation.request,launch.git.path);
 const harness=await execute(launch.node.path,[entry,"--root",root,"--mode","pre-tool"],JSON.stringify({tool_name:"Bash",cwd:root,tool_input:{command}}));
 if(harness!==0)return 3;
 policy();readQualifiedPublicationGate(rec,tool);
 // The actual coordinator persists this marker before allowing Git's first
 // transport instruction. A lost remote result can never become a blind retry.
 await new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>reject(new Error("QUALIFIED_PUBLICATION_GIT_START_TIMEOUT")),10_000);
  process.once("message",message=>{clearTimeout(timer);if(!message||typeof message!=="object"||Object.keys(message).sort().join(",")!=="kind,token"||/** @type {any} */(message).kind!=="git-started"||/** @type {any} */(message).token!==token)reject(new Error("QUALIFIED_PUBLICATION_GIT_START_CHANGED"));else resolve(null);});
  process.send?.({kind:"git-start",token});
 });
 policy();
 return execute(launch.git.path,publicationPushArguments(rec.operation.request),undefined,{...process.env,GIT_TERMINAL_PROMPT:"0"});
}
if(isMain(import.meta)){
 try{process.exitCode=await main(process.argv.slice(2));}catch(error){process.stderr.write(`${error instanceof Error?error.message:String(error)}\n`);process.exitCode=3;}
 process.removeAllListeners("disconnect");if(process.connected)process.disconnect();
}
