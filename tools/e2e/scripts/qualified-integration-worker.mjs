/** Fixed worker-thread entry. The suite/program/policy are selected only by
 * the actual stored same-operation launch, not worker data or model input. */
import {isMainThread,parentPort,workerData} from "node:worker_threads";
import {loadInstalledRecordTool,requireInstalledRuntimeAssets} from "./records-check.mjs";
import {captureQualifiedIntegrationGradeAuthority,runQualifiedIntegrationGrade,writeQualifiedIntegrationGradeArtifact} from "./qualified-integration-grade.mjs";
if(isMainThread||!parentPort||!workerData||Object.keys(workerData).sort().join(",")!=="operationId,root,token,version"||workerData.version!==1)throw Error("QUALIFIED_INTEGRATION_THREAD_REQUIRED");
try{
 const tool=loadInstalledRecordTool();
 requireInstalledRuntimeAssets(tool,["qualified-integration-worker","qualified-integration-launch","qualified-integration-grade","qualified-integration-process"].map(name=>`tools/e2e/scripts/${name}.mjs`));
 const authority=await captureQualifiedIntegrationGradeAuthority(workerData.root,workerData.operationId,workerData.token,{tool});
 const result=runQualifiedIntegrationGrade(authority),written=writeQualifiedIntegrationGradeArtifact(authority);
 parentPort.postMessage({kind:"artifact",token:workerData.token,...written});
 // Natural thread termination drains its output. The wrapper still waits for
 // the actual exit event before durable result acknowledgement/retirement.
 process.exitCode=result.code===0?0:1;
}catch(error){
 process.exitCode=1;
 await new Promise(resolve=>process.stderr.write(`${error instanceof Error?error.message:String(error)}\n`,()=>resolve(null)));
}finally{parentPort.close();}
