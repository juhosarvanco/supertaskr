import { execFileSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, statSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { EXIT, METHOD_STAMP_FILES, methodBumpStep } from "../scripts/merge.mjs";
import { NO_BACKGROUND_MAINTENANCE, removeGitFixture } from "./git-fixture";

const from="0.1.38",to="0.1.39";
function fixture() {
  const root=mkdtempSync(path.join(tmpdir(),"supertaskr-method-version-"));
  const git=(args:string[])=>execFileSync("git",["-C",root,...NO_BACKGROUND_MAINTENANCE,...args],{encoding:"utf8",stdio:["ignore","pipe","pipe"]});
  git(["init","-q"]);git(["config","user.name","Method version fixture"]);git(["config","user.email","fixture@example.invalid"]);
  const put=(file:string,text:string)=>{mkdirSync(path.dirname(path.join(root,file)),{recursive:true});writeFileSync(path.join(root,file),text);};
  for(const stamp of METHOD_STAMP_FILES)put(stamp.path,`before\n${stamp.anchor(from)}\nafter\n`);
  put("unrelated.txt","original\n");git(["add","."]);git(["-c","commit.gpgsign=false","commit","-qm","Fixture baseline"]);
  put("unrelated.txt","unrelated staged bytes\n");git(["add","unrelated.txt"]);
  const first=METHOD_STAMP_FILES[0]!;
  const original=readFileSync(path.join(root,first.path),"utf8");
  put(first.path,original+"already staged annotation\n");git(["add","--",first.path]);put(first.path,original);
  return {root,git,put,first};
}
function run(root:string) {
  const state={shas:{},regenerated:[]};const output:string[]=[];
  const code=methodBumpStep({bump:{from,to}} as any,{projectRoot:root,state:state as any,out:s=>output.push(s),err:s=>output.push(s)});
  return {code,state,output};
}
test("a later missing or invalid version anchor preserves exact pre-existing staged and working bytes",()=>{
  for(const failure of ["missing","invalid"]){const fx=fixture();try{
    const last=METHOD_STAMP_FILES.at(-1)!;
    if(failure==="missing")unlinkSync(path.join(fx.root,last.path));else fx.put(last.path,"missing version anchor\n");
    const index=readFileSync(path.join(fx.root,".git/index"));
    const before=readFileSync(path.join(fx.root,fx.first.path));
    const staged=fx.git(["show",`:${fx.first.path}`]);
    const result=run(fx.root);expect(result.code).toBe(failure==="missing"?EXIT.CANNOT_RUN:EXIT.FOUND);
    expect(readFileSync(path.join(fx.root,".git/index"))).toEqual(index);
    expect(readFileSync(path.join(fx.root,fx.first.path))).toEqual(before);
    expect(fx.git(["show",`:${fx.first.path}`])).toBe(staged);
    expect(fx.git(["show",":unrelated.txt"])).toBe("unrelated staged bytes\n");
    expect(result.state).toEqual({shas:{},regenerated:[]});
  }finally{removeGitFixture(fx.root,"method version anchor refusal");}}
});
test("a failed Git index transaction restores version text and preserves the foreign lock and original index",()=>{
  const fx=fixture();try{
    const index=readFileSync(path.join(fx.root,".git/index"));
    const originals=METHOD_STAMP_FILES.map(stamp=>readFileSync(path.join(fx.root,stamp.path)));
    writeFileSync(path.join(fx.root,".git/index.lock"),"foreign lock\n");
    const result=run(fx.root);expect(result.code).toBe(EXIT.CANNOT_RUN);
    expect(result.output.join("\n")).toContain("could not be staged");
    expect(readFileSync(path.join(fx.root,".git/index"))).toEqual(index);
    expect(readFileSync(path.join(fx.root,".git/index.lock"),"utf8")).toBe("foreign lock\n");
    METHOD_STAMP_FILES.forEach((stamp,i)=>expect(readFileSync(path.join(fx.root,stamp.path))).toEqual(originals[i]));
    expect(result.state).toEqual({shas:{},regenerated:[]});
  }finally{removeGitFixture(fx.root,"method version index refusal");}
});
test("the real version producer stages both valid anchors together and preserves unrelated staging and modes",()=>{
  const fx=fixture();try{
    chmodSync(path.join(fx.root,fx.first.path),0o755);const mode=statSync(path.join(fx.root,fx.first.path)).mode;
    const result=run(fx.root);expect(result.code).toBe(EXIT.CLEAN);
    for(const stamp of METHOD_STAMP_FILES){const text=readFileSync(path.join(fx.root,stamp.path),"utf8");
      expect(text).toContain(stamp.anchor(to));expect(text).not.toContain(stamp.anchor(from));expect(fx.git(["show",`:${stamp.path}`])).toBe(text);}
    expect(statSync(path.join(fx.root,fx.first.path)).mode).toBe(mode);
    expect(fx.git(["show",":unrelated.txt"])).toBe("unrelated staged bytes\n");
    expect(result.state.regenerated).toHaveLength(1);expect(existsSync(path.join(fx.root,"docs"))).toBe(false);
  }finally{removeGitFixture(fx.root,"method version positive");}
});
test("a version anchor symlink refuses before writing either the product or the foreign target",()=>{
  const fx=fixture();try{
    const last=METHOD_STAMP_FILES.at(-1)!,foreign=path.join(fx.root,"foreign-version.txt");
    writeFileSync(foreign,readFileSync(path.join(fx.root,last.path)));unlinkSync(path.join(fx.root,last.path));symlinkSync(foreign,path.join(fx.root,last.path));
    const bytes=readFileSync(foreign),index=readFileSync(path.join(fx.root,".git/index"));
    expect(run(fx.root).code).toBe(EXIT.CANNOT_RUN);expect(readFileSync(foreign)).toEqual(bytes);
    expect(readFileSync(path.join(fx.root,".git/index"))).toEqual(index);
    expect(readFileSync(path.join(fx.root,fx.first.path),"utf8")).toContain(fx.first.anchor(from));
  }finally{removeGitFixture(fx.root,"method version symlink refusal");}
});
