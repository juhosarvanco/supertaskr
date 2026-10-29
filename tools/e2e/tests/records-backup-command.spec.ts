import {expect,test} from "@playwright/test";
import {execFileSync,spawnSync} from "node:child_process";
import {existsSync,readFileSync,renameSync,writeFileSync} from "node:fs";
import path from "node:path";
import {backupMain} from "../scripts/records-backup-command.mjs";
import {capturePrivateBackupSource,exportPrivateBackup} from "../scripts/records-backup.mjs";
import {createPrivateRecordService} from "../scripts/records-save.mjs";
import {loadInstalledRecordTool} from "../scripts/records-check.mjs";
import {GENERIC_RECORD_PROFILE} from "../scripts/records-validation.mjs";
import {testToolRuntime} from "../fixtures/tool-runtime";
import {FIXTURE_ENV,privateRecordFixture,privateGit} from "./private-record-fixture";

test("backup front permits finite help and refuses scope authority or duplicate destination arguments",()=>{
 const out:string[]=[],err:string[]=[],io={out:(text:string)=>out.push(text),err:(text:string)=>err.push(text)};
 expect(backupMain(["--help"],io)).toBe(0);expect(out.join("")).toContain("backup restore FILE --to NEW_RECORDS");
 for(const args of [[],["restore"],["inspect","--root"],["inspect","artifact","--root","P"],["restore","artifact","--to","R","--to","S"],["restore","artifact","--to","R\0S"],["restore","artifact","--to","R","--grant","yes"]])expect(backupMain(args,io)).toBe(2);
 expect(err.length).toBe(7);
});
test("packed backup commands inspect and restore original history without its old records home or selecting a binding",()=>{
 test.setTimeout(180000);const f=privateRecordFixture();try {
  const stage=testToolRuntime(),packed=JSON.parse(execFileSync("npm",["pack","--ignore-scripts","--json","--pack-destination",f.dir],{cwd:stage.packageRoot,encoding:"utf8"}));
  const installed=path.join(f.dir,"installed");execFileSync("npm",["install","--prefix",installed,"--ignore-scripts","--no-audit","--no-fund",path.join(f.dir,packed[0].filename)],{stdio:"pipe"});
  const command=path.join(installed,"node_modules/supertaskr/supertaskr.mjs"),run=(...args:string[])=>spawnSync(process.execPath,[command,"backup",...args],{cwd:f.dir,env:{...FIXTURE_ENV,NODE_PATH:""},encoding:"utf8"});
  const api=createPrivateRecordService({profile:GENERIC_RECORD_PROFILE,tool:loadInstalledRecordTool(f.manifestPath)});
  const saved=api.save({...f.options,operationId:"cli-portable-save"},[{operation:"edit",path:"docs/rooms/note.md",type:"blob",mode:"100644",bytes:Buffer.from("# Original portable CLI note\n")}]);
  const file=path.join(f.dir,"portable.json");exportPrivateBackup(capturePrivateBackupSource({productRoot:f.product,operationId:"cli-portable-save",manifestPath:f.manifestPath}),{file});
  const binding=readFileSync(path.join(f.product,".supertaskr/workspace.json")),pindex=readFileSync(path.join(f.product,".git/index")),head=privateGit(f.product,["rev-parse","HEAD"]),archive=readFileSync(file);
  renameSync(f.records,f.records+"-retired");
  const inspected=run("inspect",file);expect(inspected.status,inspected.stderr).toBe(0);expect(JSON.parse(inspected.stdout)).toMatchObject({commit:saved.commit,tree:saved.tree,authority:"not-imported"});expect(typeof JSON.parse(inspected.stdout).paths).toBe("number");
  const target=path.join(f.dir,"restored"),restored=run("restore",file,"--to",target);expect(restored.status,restored.stderr).toBe(0);expect(JSON.parse(restored.stdout)).toMatchObject({status:"restored",commit:saved.commit,binding:"not-installed",authority:"not-imported"});
  expect(privateGit(target,["rev-parse","HEAD"])).toBe(saved.commit);expect(readFileSync(path.join(target,"docs/rooms/note.md"),"utf8")).toBe("# Original portable CLI note\n");expect(privateGit(target,["remote"])).toBe("");expect(existsSync(path.join(target,".supertaskr"))).toBe(false);
  const rindex=readFileSync(path.join(target,".git/index"));const again=run("restore",file,"--to",target);expect(again.status).toBe(3);expect(again.stderr).toContain("private-backup-restore-exists");expect(readFileSync(path.join(target,".git/index"))).toEqual(rindex);
  const corrupt=path.join(f.dir,"corrupt.json"),absent=path.join(f.dir,"absent");writeFileSync(corrupt,"{}\n");expect(run("restore",corrupt,"--to",absent).status).toBe(3);expect(existsSync(absent)).toBe(false);
  expect(readFileSync(file)).toEqual(archive);expect(readFileSync(path.join(f.product,".supertaskr/workspace.json"))).toEqual(binding);expect(readFileSync(path.join(f.product,".git/index"))).toEqual(pindex);expect(privateGit(f.product,["rev-parse","HEAD"])).toBe(head);expect(existsSync(f.records)).toBe(false);
 }finally{f.cleanup();}
});
