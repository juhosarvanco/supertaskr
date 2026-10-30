import {spawnSync} from "node:child_process";
import {mkdtempSync,rmSync} from "node:fs";
import os from "node:os";
import path from "node:path";
import {expect,test} from "@playwright/test";
import {findVerb,main,packageRoot,planFor,rootMismatch,VERBS} from "../scripts/cli.mjs";

test("fixed init front forwards only its protocol and preserves the real child status without project discovery",()=>{
 const cwd=mkdtempSync(path.join(os.tmpdir(),"init-front-")),calls:any[]=[],output:string[]=[],errors:string[]=[];
 try{
  const spawn=((...args:any[])=>{calls.push(args);return {status:7,signal:null,pid:1,output:[],stdout:Buffer.alloc(0),stderr:Buffer.alloc(0)};}) as unknown as typeof spawnSync;
  const io={cwd,spawn,stdout:(s:string)=>output.push(s),stderr:(s:string)=>errors.push(s)};
  expect(main(["init","--stdio"],io)).toBe(7);
  expect(calls).toEqual([[process.execPath,[path.join(packageRoot,"scripts/genesis-init-command.mjs"),"--stdio"],{cwd,stdio:"inherit"}]]);
  expect(output).toEqual([]);expect(errors).toEqual([]);
  for(const args of [["init"],["init","--stdio","--root",cwd],["init","--stdio","--program","other"],["init","--stdio","--stdio"]])expect(main(args,io)).toBe(2);
  expect(calls).toHaveLength(1);expect(main(["init","--help"],io)).toBe(0);expect(calls).toHaveLength(1);
 }finally{rmSync(cwd,{recursive:true,force:true});}
});

test("workspace front selects the canonical explicit-root reader and preserves exact revision arguments",()=>{
 const entry=findVerb("workspace");expect(entry).toBeDefined();if(!entry)throw Error("workspace entry missing");
 const root=path.resolve(os.tmpdir(),"unrelated-project"),revision="a".repeat(40),plan=planFor({entry,args:["--at",revision],projectRoot:root});
 expect(entry.rootFlag).toBe(true);expect(rootMismatch(entry,root)).toBeNull();expect(plan.command).toBe(process.execPath);
 expect(plan.argv).toEqual([path.join(packageRoot,"scripts/workspace-command.mjs"),"--root",root,"--at",revision]);
});
test("backup front uses only explicit file arguments and needs no project or binding discovery",()=>{
 const cwd=mkdtempSync(path.join(os.tmpdir(),"backup-front-")),calls:any[]=[],out:string[]=[],err:string[]=[];
 try {
  const entry=findVerb("backup");expect(entry).toBeDefined();if(!entry)throw Error("backup entry missing");
  expect(VERBS.filter(verb=>verb.projectless).map(verb=>verb.verb)).toEqual(["backup"]);
  expect(entry.rootFlag).toBe(false);expect(entry.stdioContext).toBeUndefined();expect(rootMismatch(entry,cwd)).toBeNull();
  for(const args of [["inspect","portable.backup"],["restore","portable.backup","--to","new-records"]]) {
   const plan=planFor({entry,args,projectRoot:cwd});
   expect(plan.argv).toEqual([path.join(packageRoot,"scripts/records-backup-command.mjs"),...args]);expect(plan.cwd).toBe(cwd);
  }
  const spawn=((...args:any[])=>{calls.push(args);return {status:0,signal:null};}) as unknown as typeof spawnSync;
  const io={cwd,spawn,stdout:(s:string)=>out.push(s),stderr:(s:string)=>err.push(s)};
  expect(main(["backup","--help"],io)).toBe(0);expect(out.join("\n")).toContain("backup restore FILE --to NEW_RECORDS");
  expect(main(["backup","inspect","portable.backup","--root",cwd],io)).toBe(2);expect(calls).toEqual([]);
  for(const other of VERBS.filter(verb=>verb.target.kind==="script"&&!verb.rootFlag&&!verb.stdioContext&&!verb.projectless))expect(rootMismatch(other,cwd),other.verb).not.toBeNull();
 }finally{rmSync(cwd,{recursive:true,force:true});}
});
