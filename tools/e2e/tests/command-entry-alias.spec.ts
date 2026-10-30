import {spawnSync} from "node:child_process";
import {mkdtempSync,rmSync,symlinkSync} from "node:fs";
import {tmpdir} from "node:os";
import path from "node:path";
import {pathToFileURL} from "node:url";
import {expect,test} from "@playwright/test";
import {SOURCE} from "./private-record-fixture";

for(const command of ["index-command","records-stdio"])test(`${command} refuses invalid direct input through a physical path alias and remains inert when imported`,()=>{
 const home=mkdtempSync(path.join(tmpdir(),"command-entry-alias-")),alias=path.join(home,"tool-alias");
 try{
  symlinkSync(SOURCE,alias,"dir");
  const relative=`tools/e2e/scripts/${command}.mjs`,original=path.join(SOURCE,relative),linked=path.join(alias,relative),args=command==="records-stdio"?["--stdio"]:["--unknown-option"];
  const run=(file:string)=>spawnSync(process.execPath,[file,...args],{encoding:"utf8",cwd:home,input:"not json\n"});
  const canonical=run(original),throughAlias=run(linked);
  expect(canonical.status).not.toBeNull();expect(canonical.status).not.toBe(0);
  expect(throughAlias.status).toBe(canonical.status);expect(throughAlias.stdout).toBe(canonical.stdout);expect(throughAlias.stderr).toBe(canonical.stderr);
  const imported=spawnSync(process.execPath,["--input-type=module","-e",`await import(${JSON.stringify(pathToFileURL(linked).href)});process.stdout.write('IMPORTED\\n');`],{encoding:"utf8",cwd:home,input:"not json\n"});
  expect(imported.status,imported.stderr).toBe(0);expect(imported.stdout).toBe("IMPORTED\n");expect(imported.stderr).toBe("");
 }finally{rmSync(home,{recursive:true,force:true});}
});
