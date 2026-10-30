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
 // This exits only this fixed thread. The responsive wrapper owns IPC and
 // actual thread-exit retention/acknowledgement before retiring its process.
 process.exit(result.code===0?0:1);
}catch(error){process.stderr.write(`${error instanceof Error?error.message:String(error)}\n`);process.exit(1);}
