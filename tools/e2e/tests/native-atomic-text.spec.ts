import { expect, test } from "@playwright/test";
import { mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { atomicJson, atomicNativeText, withNativeDurabilityObserver } from "../scripts/native-codex.mjs";

test("native text publication retains exact Markdown bytes and the JSON publication boundary",()=>{
 const dir=realpathSync(mkdtempSync(path.join(tmpdir(),"native-atomic-text-")));
 try{
  const file=path.join(dir,"brief.md"),text="# Actual brief\n\nQuoted \"π\" and a literal \\n stay exact.\n",events:string[]=[];
  withNativeDurabilityObserver(event=>{if(event.file===file)events.push(event.stage);},()=>atomicNativeText(file,text,()=>events.push("policy-check")));
  expect(readFileSync(file,"utf8")).toBe(text);
  for(const [before,after] of [["write","file-fsync"],["file-fsync","close"],["close","policy-check"],["policy-check","rename"],["rename","directory-fsync"]])expect(events.indexOf(before!)).toBeLessThan(events.indexOf(after!));
  expect(()=>atomicNativeText(file,"unapproved replacement",()=>{throw Error("current policy refuses");})).toThrow("current policy refuses");
  expect(readFileSync(file,"utf8")).toBe(text);expect(readdirSync(dir)).toEqual(["brief.md"]);
  const value={text:"π\n",nested:{unchanged:true}};atomicJson(path.join(dir,"record.json"),value);
  expect(readFileSync(path.join(dir,"record.json"),"utf8")).toBe(`${JSON.stringify(value,null,2)}\n`);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
