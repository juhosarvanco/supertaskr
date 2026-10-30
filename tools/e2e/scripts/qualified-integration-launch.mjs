/** Responsive fixed wrapper. Its one immutable fixed thread performs the
 * synchronous canonical suite; IPC loss can still retire only this owned group.
 */
import {Worker} from "node:worker_threads";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {readAcceptedOperation,checkOperationEnvironment} from "./durable-operation.mjs";
import {loadInstalledRecordTool,requireInstalledRuntimeAssets,installedRecordAsset} from "./records-check.mjs";
import {loadQualifiedDeliveryPolicy} from "./qualified-admission.mjs";
import {assertQualifiedDeliveryContinuation} from "./qualified-delivery-operation.mjs";
import {captureQualifiedIntegrationWrapperProof,qualifiedIntegrationLaunchArguments} from "./qualified-integration-process.mjs";
import {assertQualifiedIntegrationWorkspace} from "./qualified-integration-grade.mjs";
import {publicationProcess,publicationExecutable} from "./qualified-publication-process.mjs";
import {operationContent} from "./operation-record.mjs";
import {isMain} from "../../../cli/is-main.mjs";
/** @param {string} code @returns {never} */
function refuse(code){throw Object.assign(new Error(code),{code});}
/** @param {any} a @param {any} b */
const same=(a,b)=>operationContent(a)===operationContent(b);
/** @param {string[]} argv */
export async function main(argv){
 if(argv.length!==6||argv[0]!=="--root"||argv[2]!=="--operation"||argv[4]!=="--token"||!process.connected)refuse("QUALIFIED_INTEGRATION_LAUNCH_REQUEST");
 checkOperationEnvironment();if(process.env.NODE_OPTIONS||process.env.NODE_PATH)refuse("QUALIFIED_INTEGRATION_NODE_ROUTING");
 const root=/** @type {string} */(argv[1]),id=/** @type {string} */(argv[3]),token=/** @type {string} */(argv[5]);
 /** @type {any} */let original=null;
 const stopOwnGroup=()=>{
  // The snapshot was obtained only after actual parent/wrapper/code proof.
  // Parent death never grants a different PID/group; check this same process
  // and unchanged stored launch/code before its one own-group signal.
  if(original)try{
   const current=readAcceptedOperation(root,id,"qualified-delivery"),launch=original.operation.integration.launches.at(-1),self=publicationProcess(process.pid);
   const stable=(/** @type {any} */ value)=>{const {result,workerResult,...identity}=value;return identity;};
   if(current?.operation.digest===original.operation.digest&&same(current.operation.owner,original.operation.owner)&&same(stable(current.operation.integration.launches.at(-1)),stable(launch))&&
    self.pid===launch.process.pid&&self.startedAt===launch.process.identity&&self.group===launch.process.group&&self.group===self.pid&&self.program===launch.node.path&&
    same(publicationExecutable(launch.node.path),launch.node)&&self.command===qualifiedIntegrationLaunchArguments(original,launch).join(" ")&&
    createHash("sha256").update(readFileSync(launch.entry.path)).digest("hex")===launch.entry.sha256&&
    createHash("sha256").update(readFileSync(original.operation.request.integration.execution.worker.path)).digest("hex")===original.operation.request.integration.execution.worker.sha256)process.kill(-self.group,"SIGKILL");
  }catch{/* ambiguous identity never supplies another signal target */}
  process.exitCode=3;
 };
 process.on("disconnect",stopOwnGroup);process.stdout.on("error",stopOwnGroup);process.stderr.on("error",stopOwnGroup);
 /** @param {string} kind @param {number} duration */
 const wait= (kind,duration)=>new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>{cleanup();reject(Error("QUALIFIED_INTEGRATION_ACK_TIMEOUT"));},duration);
  const disconnected=()=>{cleanup();reject(Error("QUALIFIED_INTEGRATION_DISCONNECTED"));};
  const message=(/** @type {any} */ value)=>{cleanup();if(!value||Object.keys(value).sort().join(",")!=="kind,token"||value.kind!==kind||value.token!==token)reject(Error("QUALIFIED_INTEGRATION_IPC_CHANGED"));else resolve(null);};
  const cleanup=()=>{clearTimeout(timer);process.off("disconnect",disconnected);process.off("message",message);};
  process.once("disconnect",disconnected);process.once("message",message);
 });
 await wait("start",10_000);
 const rec=readAcceptedOperation(root,id,"qualified-delivery"),launch=rec?.operation.integration?.launches.at(-1);
 if(!rec||rec.operation.request.route.name!=="protected-planned-output-v1"||!launch||launch.token!==token)refuse("QUALIFIED_INTEGRATION_LAUNCH_REQUIRED");
 captureQualifiedIntegrationWrapperProof(rec);original=rec;
 const tool=loadInstalledRecordTool(),execution=rec.operation.request.integration.execution;
 requireInstalledRuntimeAssets(tool,["qualified-integration-launch","qualified-integration-worker","qualified-integration-grade","qualified-integration-process","qualified-delivery-operation","qualified-admission"].map(name=>`tools/e2e/scripts/${name}.mjs`));
 if(installedRecordAsset(tool,"tools/e2e/scripts/qualified-integration-worker.mjs")!==execution.worker.path)refuse("QUALIFIED_INTEGRATION_CODE_CHANGED");
 await loadQualifiedDeliveryPolicy();assertQualifiedDeliveryContinuation(root,rec,{tool},captureQualifiedIntegrationWrapperProof(rec));assertQualifiedIntegrationWorkspace(rec,launch);
 const worker=new Worker(execution.worker.path,{execArgv:[],workerData:{version:1,root,operationId:id,token},stdout:true,stderr:true}),actualThreadId=worker.threadId;
 let count=0;
 /** @param {"stdout"|"stderr"} stream @param {Buffer} bytes */
 const forward=(stream,bytes)=>{count+=bytes.length;if(count>8*1024*1024)stopOwnGroup();else process[stream].write(bytes);};
 worker.stdout.on("data",bytes=>forward("stdout",bytes));worker.stderr.on("data",bytes=>forward("stderr",bytes));
 /** @type {any} */let result=null;
 worker.on("message",message=>{
  if(result!==null||!message||Object.keys(message).sort().join(",")!=="artifact,code,kind,rowDigest,token"||message.kind!=="artifact"||message.token!==token){stopOwnGroup();return;}
  result=message;
 });
 const exit=await new Promise((resolve)=>{worker.once("error",error=>process.stderr.write(`${error.message}\n`));worker.once("exit",resolve);});
 if(!result){process.stderr.write("QUALIFIED_INTEGRATION_WORKER_UNAVAILABLE\n");return 3;}
 const ack=wait("result-retained",15_000);
 process.send?.({kind:"worker-result",token,threadId:actualThreadId,exit,finishedAt:new Date().toISOString(),artifact:result.artifact,rowDigest:result.rowDigest,code:result.code});
 try{await ack;}catch(error){stopOwnGroup();throw error;}
 return result.code===0?0:1;
}
if(isMain(import.meta)){
 try{process.exitCode=await main(process.argv.slice(2));}catch(error){process.stderr.write(`${error instanceof Error?error.message:String(error)}\n`);process.exitCode=3;}
 process.removeAllListeners("disconnect");if(process.connected)process.disconnect();
}
