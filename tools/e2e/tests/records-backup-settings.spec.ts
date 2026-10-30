import {chmodSync,existsSync,mkdirSync,readFileSync,renameSync,statSync,symlinkSync,writeFileSync} from "node:fs";
import path from "node:path";
import {expect,test} from "@playwright/test";
import {capturePlainProjectRoot} from "../scripts/project-init-operation.mjs";
import {configurePrivateBackup,PRIVATE_BACKUP_FOLDER,readPrivateBackupSettings} from "../scripts/records-backup-settings.mjs";
import {executeRecordProtocol} from "../scripts/records-stdio.mjs";
import {backupPrivateRecordSave} from "../scripts/records-backup-operation.mjs";
import {createPrivateRecordService} from "../scripts/records-save.mjs";
import {loadInstalledRecordTool} from "../scripts/records-check.mjs";
import {GENERIC_RECORD_PROFILE} from "../scripts/records-validation.mjs";
import {privateGit,privateRecordFixture} from "./private-record-fixture";

function fixture(){const f=privateRecordFixture(),api=createPrivateRecordService({profile:GENERIC_RECORD_PROFILE,tool:loadInstalledRecordTool(f.manifestPath)});
 const saved=api.save({...f.options,operationId:"settings-source"},[{operation:"edit",path:"docs/rooms/note.md",type:"blob",mode:"100644",bytes:Buffer.from("# Exact settings source\n")}]);
 const parent=path.join(f.dir,"chosen-backup-parent");mkdirSync(parent);const selection={productRoot:f.product,saveOperationId:saved.operationId,manifestPath:f.manifestPath},configuration=path.join(f.product,".supertaskr/private-backup.json");
 return {...f,api,saved,parent,selection,configuration,request:()=>({...selection,expectedToken:readPrivateBackupSettings(selection).token,parent:capturePlainProjectRoot(parent)})};}

test("explicit local opt-in creates the fixed private folder and backs up exactly the accepted save without new source history",()=>{
 const f=fixture();try{
  const pindex=readFileSync(path.join(f.product,".git/index")),rindex=readFileSync(path.join(f.records,".git/index")),pref=privateGit(f.product,["for-each-ref","--format=%(refname) %(objectname)"]),rref=privateGit(f.records,["for-each-ref","--format=%(refname) %(objectname)"]),objects=privateGit(f.product,["cat-file","--batch-all-objects","--batch-check=%(objectname)"]);
  const before=readPrivateBackupSettings(f.selection);expect(before.status).toBe("not-configured");expect(existsSync(f.configuration)).toBe(false);
  const configured=configurePrivateBackup(f.request()),directory=path.join(f.parent,PRIVATE_BACKUP_FOLDER);expect(configured).toMatchObject({status:"configured",commit:f.saved.commit,directory});expect(statSync(directory).mode&0o077).toBe(0);expect(statSync(f.configuration).mode&0o077).toBe(0);
  const backup=backupPrivateRecordSave(f.product,{operationId:"settings-backup",saveOperationId:f.saved.operationId},{manifestPath:f.manifestPath});expect(backup).toMatchObject({status:"backed-up",commit:f.saved.commit});expect(path.dirname(backup.file)).toBe(directory);
  expect(readFileSync(path.join(f.product,".git/index"))).toEqual(pindex);expect(readFileSync(path.join(f.records,".git/index"))).toEqual(rindex);expect(privateGit(f.product,["for-each-ref","--format=%(refname) %(objectname)"])).toBe(pref);expect(privateGit(f.records,["for-each-ref","--format=%(refname) %(objectname)"])).toBe(rref);expect(privateGit(f.product,["cat-file","--batch-all-objects","--batch-check=%(objectname)"])).toBe(objects);expect(privateGit(f.product,["remote"])).toBe("");
 }finally{f.cleanup();}
});
test("a stale settings observation preserves a new configuration without creating its proposed receiver",()=>{
 const f=fixture();try{const request=f.request(),foreign=Buffer.from("Foreign settings owner\n");writeFileSync(f.configuration,foreign);const inode=statSync(f.configuration,{bigint:true}).ino;
  expect(()=>configurePrivateBackup(request)).toThrow(/private-backup-config-json/);expect(readFileSync(f.configuration)).toEqual(foreign);expect(statSync(f.configuration,{bigint:true}).ino).toBe(inode);expect(existsSync(path.join(f.parent,PRIVATE_BACKUP_FOLDER))).toBe(false);expect(privateGit(f.records,["rev-parse","HEAD"])).toBe(f.saved.commit);
 }finally{f.cleanup();}
});
test("native selected parent identity must remain original and restored original selection permits configuration",()=>{
 const f=fixture();try{const request=f.request(),original=`${f.parent}-original`,successor=`${f.parent}-successor`;renameSync(f.parent,original);mkdirSync(f.parent);
  expect(()=>configurePrivateBackup(request)).toThrow(/private-backup-settings-parent-changed/);expect(existsSync(f.configuration)).toBe(false);expect(existsSync(path.join(f.parent,PRIVATE_BACKUP_FOLDER))).toBe(false);
  renameSync(f.parent,successor);renameSync(original,f.parent);expect(configurePrivateBackup(request).status).toBe("configured");expect(existsSync(path.join(successor,PRIVATE_BACKUP_FOLDER))).toBe(false);
 }finally{f.cleanup();}
});
test("Git destinations, linked settings and nonprivate existing children are refused intact",()=>{
 const f=fixture();try{
  const request=f.request(),pstat=statSync(f.product,{bigint:true});expect(()=>configurePrivateBackup({...request,parent:{path:f.product,device:String(pstat.dev),inode:String(pstat.ino)}})).toThrow(/PROJECT_INIT_ROOT/);expect(existsSync(f.configuration)).toBe(false);
  const directory=path.join(f.parent,PRIVATE_BACKUP_FOLDER);mkdirSync(directory);chmodSync(directory,0o755);writeFileSync(path.join(directory,"canary"),"Existing owner\n");expect(()=>configurePrivateBackup(request)).toThrow(/private-backup-receiver-not-private/);expect(statSync(directory).mode&0o777).toBe(0o755);expect(readFileSync(path.join(directory,"canary"),"utf8")).toBe("Existing owner\n");expect(existsSync(f.configuration)).toBe(false);
  const canary=path.join(f.dir,"settings-canary");writeFileSync(canary,"Foreign settings\n");symlinkSync(canary,f.configuration);expect(()=>readPrivateBackupSettings(f.selection)).toThrow(/private-backup-config-file/);expect(readFileSync(canary,"utf8")).toBe("Foreign settings\n");
 }finally{f.cleanup();}
});
test("fixed records protocol carries only selected backup-setting data and refuses policy or receiver overrides",()=>{
 const f=fixture();try{const base={version:1,requestId:"settings-wire",productRoot:f.product,saveOperationId:f.saved.operationId},installation={manifestPath:f.manifestPath};
  const observed=executeRecordProtocol({...base,operation:"backup-settings"},installation);expect(observed).toMatchObject({ok:true,result:{status:"not-configured"}});
  expect(()=>executeRecordProtocol({...base,operation:"backup-settings",receiver:f.parent},installation)).toThrow(/records-protocol-request/);
  const configured=executeRecordProtocol({...base,operation:"backup-configure",expectedToken:observed.result.token,parent:capturePlainProjectRoot(f.parent)},installation);expect(configured).toMatchObject({ok:true,result:{status:"configured",commit:f.saved.commit}});
  expect(()=>executeRecordProtocol({...base,operation:"backup-configure",expectedToken:observed.result.token,parent:capturePlainProjectRoot(f.parent),profile:GENERIC_RECORD_PROFILE},installation)).toThrow(/records-protocol-request/);
 }finally{f.cleanup();}
});
