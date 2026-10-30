import {cpSync,mkdirSync,mkdtempSync,readFileSync,writeFileSync} from "node:fs";
import {spawnSync} from "node:child_process";
import os from "node:os";
import path from "node:path";
import {pathToFileURL} from "node:url";
import {expect,test} from "@playwright/test";
import {startRun,collectRun} from "../scripts/run-record.mjs";
import {handleNativeEvent} from "../scripts/native-codex.mjs";
import {acceptedOperationPath,readAcceptedOperation} from "../scripts/durable-operation.mjs";
import {privateRecordFixture,fixtureProjectSettings,FIXTURE_ENV,sha} from "./private-record-fixture";
import {reviewed,writeVerdict,git} from "./qualified-delivery-fixture";
import {removeGitFixture} from "./git-fixture";

const SOURCE = path.resolve(import.meta.dirname,"../../..");
test("delivery help and finite syntax work in a cold entry copy without operation owners or TOOL and errors expose no paths",()=>{
  const dir = mkdtempSync(path.join(os.tmpdir(),"delivery-cold-front-"));
  try {
    const entry = path.join(dir,"tools/e2e/scripts/qualified-delivery-command.mjs");
    mkdirSync(path.dirname(entry),{recursive:true}); mkdirSync(path.join(dir,"cli"));
    cpSync(path.join(SOURCE,"tools/e2e/scripts/qualified-delivery-command.mjs"),entry);
    cpSync(path.join(SOURCE,"cli/is-main.mjs"),path.join(dir,"cli/is-main.mjs"));
    const run = (...args:string[]) => spawnSync(process.execPath,[entry,...args],{cwd:dir,encoding:"utf8"});
    const help=run("--help"); expect(help.status,help.stderr).toBe(0); expect(help.stdout).toContain("Interrupted steps use the same command");
    for (const args of [[],["start","--operation","safe"],["local","--operation","safe","--program","secret-program"],["ci","--operation","safe","--operation","second"],["status","--operation","../bad"]]) {
      const bad=run(...args); expect(bad.status,bad.stderr).toBe(2); expect(JSON.parse(bad.stderr)).toMatchObject({code:"delivery-usage"}); expect(bad.stderr).not.toContain(dir);
    }
    const unavailable=run("status","--operation","safe"); expect(unavailable.status).toBe(3); expect(JSON.parse(unavailable.stderr).code).toBe("ERR_MODULE_NOT_FOUND"); expect(unavailable.stderr).not.toContain(dir); expect(unavailable.stderr).not.toContain("stack");
  } finally {removeGitFixture(dir,"cold delivery front");}
});

async function fixture() {
  const installation=privateRecordFixture(), f=await reviewed(false,"records",{review:"independent",settings:fixtureProjectSettings(installation),foundation:true});
  try {
    const prepared=await f.prepare(),sealed=await f.seal(prepared),started:any=await startRun(f.product,{assignment:f.selectVerifier()}),bound=f.bindVerifier(started.record.attempt);
    expect(handleNativeEvent(f.product,f.verifierEvent("PreToolUse")).disposition).toBe("pre-admitted"); writeVerdict(f,bound,prepared,sealed);
    expect(handleNativeEvent(f.product,f.verifierEvent("PostToolUse")).disposition).toBe("post-clean"); f.finish(started.record.attempt); await collectRun(f.product,{attempt:started.record.attempt,ref:f.verifierRefs()});
    const input={operationId:"delivery-command-fixture",executorAttempt:f.sourceAttempt,verifierAttempt:started.record.attempt,targets:{product:{ref:"refs/heads/main",expectedRevision:f.qualified.revisions.product},records:{ref:"refs/heads/main",expectedRevision:f.qualified.revisions.records}}};
    return {...f,installation,input,cleanup(){f.cleanup();installation.cleanup();}};
  }catch(error){f.cleanup();installation.cleanup();throw error;}
}
test("installed delivery front guards pending private completion and replays exact accepted private results before a missing current TOOL",async()=>{
  test.setTimeout(180_000); const f=await fixture();
  try {
    const entry=path.join(f.installation.tool,"dist/tools/e2e/scripts/qualified-delivery-command.mjs"),run=(...args:string[])=>spawnSync(process.execPath,[entry,...args,"--root",f.product],{cwd:f.product,env:FIXTURE_ENV,encoding:"utf8",maxBuffer:4*1024*1024});
    const identities=()=>[f.product,f.records].map(root=>({refs:git(root,["show-ref"]),index:readFileSync(path.join(root,".git/index")).toString("base64"),objects:git(root,["count-objects","-v"])}));
    const before=identities(),fresh=run("start","--operation",f.input.operationId,"--executor",f.input.executorAttempt,"--verifier",f.input.verifierAttempt,"--product-ref","refs/heads/main","--product-base",f.input.targets.product.expectedRevision,"--records-ref","refs/heads/main","--records-base",f.input.targets.records.expectedRevision);
    expect(fresh.status,fresh.stdout+fresh.stderr).toBe(3); expect(readAcceptedOperation(f.product,f.input.operationId)).toBeNull(); expect(identities()).toEqual(before);
    const module=pathToFileURL(path.join(f.installation.tool,"dist/tools/e2e/scripts/qualified-delivery-operation.mjs")).href;
    const initial=spawnSync(process.execPath,["--input-type=module","-e",`const {executeQualifiedLocalDelivery}=await import(process.argv[1]);process.stdout.write(JSON.stringify(await executeQualifiedLocalDelivery(process.argv[2],JSON.parse(process.argv[3]))));`,module,f.product,JSON.stringify(f.input)],{cwd:f.product,env:FIXTURE_ENV,encoding:"utf8",maxBuffer:4*1024*1024});
    expect(initial.status,initial.stderr).toBe(0); expect(JSON.parse(initial.stdout)).toMatchObject({status:"local-integrated",publication:"not-owed",ci:"not-owed"});
    const p=identities()[0],localAccepted=readFileSync(acceptedOperationPath(f.product,f.input.operationId)),recordsLocal=git(f.records,["rev-parse","HEAD"]);
    const manifestBytes=readFileSync(f.installation.manifestPath,"utf8"),manifest=JSON.parse(manifestBytes);
    manifest.runtime.files=manifest.runtime.files.filter((file:any)=>file.path!=="tools/e2e/scripts/qualified-delivery-command.mjs"); manifest.runtime.buildHash=sha(JSON.stringify(manifest.runtime.files)); writeFileSync(f.installation.manifestPath,JSON.stringify(manifest));
    const unowned=run("complete","--operation",f.input.operationId); expect(unowned.status,unowned.stderr).toBe(3); expect(JSON.parse(unowned.stderr).code).toBe("records-tool-runtime-member-required"); expect(readFileSync(acceptedOperationPath(f.product,f.input.operationId))).toEqual(localAccepted); expect(identities()[0]).toEqual(p); expect(git(f.records,["rev-parse","HEAD"])).toBe(recordsLocal);
    writeFileSync(f.installation.manifestPath,manifestBytes);
    const completion=run("complete","--operation",f.input.operationId); expect(completion.status,completion.stderr).toBe(0); expect(JSON.parse(completion.stdout)).toMatchObject({status:"records-completed",publication:"not-owed",ci:"not-owed"}); expect(JSON.parse(completion.stdout).commit).toBe(git(f.records,["rev-parse","HEAD"]));
    const changed=git(f.records,["diff","--name-only",recordsLocal,"HEAD"]).split("\n"); expect(changed).toHaveLength(3); expect(changed).toContain("docs/tasks/T-999-private.md"); expect(changed).toContain("docs/INDEX.md"); expect(identities()[0]).toEqual(p);
    const accepted=readFileSync(acceptedOperationPath(f.product,f.input.operationId));
    writeFileSync(f.installation.manifestPath,"invalid successor TOOL\n"); writeFileSync(path.join(f.product,".supertaskr/workspace.json"),"invalid successor binding\n");
    const foreignLock=path.join(f.records,".git/index.lock"),foreignBytes="Foreign index lock must be preserved\n"; writeFileSync(foreignLock,foreignBytes);
    const replay=run("local","--operation",f.input.operationId); expect(replay.status,replay.stderr).toBe(0); expect(JSON.parse(replay.stdout)).toMatchObject({status:"local-integrated",publication:"not-owed",ci:"not-owed",cleanupWarnings:[{code:"QUALIFIED_DELIVERY_ACCEPTED_LOCK_UNAVAILABLE"}]}); expect(readFileSync(foreignLock,"utf8")).toBe(foreignBytes); expect(replay.stdout).not.toContain(foreignBytes.trim());
    expect(replay.stdout).not.toContain("Frozen private contract"); expect(replay.stdout).not.toContain(f.records); expect(readFileSync(acceptedOperationPath(f.product,f.input.operationId))).toEqual(accepted); expect(identities()[0]).toEqual(p);
    const status=run("status","--operation",f.input.operationId); expect(status.status,status.stderr).toBe(0); expect(JSON.parse(status.stdout)).toMatchObject({status:"local-integrated",retainedProgress:{completion:"accepted"}}); expect(JSON.parse(status.stdout).laterProgress).toContain("retained only"); expect(readFileSync(acceptedOperationPath(f.product,f.input.operationId))).toEqual(accepted);
    const repeated=run("complete","--operation",f.input.operationId); expect(repeated.status,repeated.stderr).toBe(0); const {cleanupWarning,...sameCompletion}=JSON.parse(repeated.stdout); expect(cleanupWarning).toBe("QUALIFIED_COMPLETION_ACCEPTED_LOCK_UNAVAILABLE"); expect(sameCompletion).toEqual(JSON.parse(completion.stdout)); expect(readFileSync(foreignLock,"utf8")).toBe(foreignBytes); expect(readFileSync(acceptedOperationPath(f.product,f.input.operationId))).toEqual(accepted); expect(identities()[0]).toEqual(p);
    const publish=run("publish","--operation",f.input.operationId); expect(publish.status).toBe(3); expect(publish.stdout).toBe(""); expect(readFileSync(acceptedOperationPath(f.product,f.input.operationId))).toEqual(accepted); expect(identities()[0]).toEqual(p);
  } finally {f.cleanup();}
});
