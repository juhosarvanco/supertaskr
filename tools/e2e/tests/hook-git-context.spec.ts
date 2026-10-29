import {mkdirSync,mkdtempSync,realpathSync} from "node:fs";
import os from "node:os";
import path from "node:path";
import {expect,test} from "@playwright/test";
import {auditHookGitContext} from "../../../cli/hook-git-context.mjs";
import {privateGit} from "./private-record-fixture";
import {removeGitFixture} from "./git-fixture";

test("hook routing preserves a fresh legal trailing-space root and leaves an independent checkout outside",()=>{
 const dir=realpathSync(mkdtempSync(path.join(os.tmpdir(),"hook-git-path-"))),product=path.join(dir,"product "),other=path.join(dir,"other");
 try{
  for(const root of [product,other]){mkdirSync(root);privateGit(root,["init","-q","--initial-branch=main"]);}
  expect(auditHookGitContext(product,product,"pre-tool")).toMatchObject({status:"selected",root:product,gitDirectory:path.join(product,".git")});
  expect(auditHookGitContext(product,other,"pre-push").status).toBe("outside");
  const previous=process.env.GIT_DIR;
  try{
   process.env.GIT_DIR=path.join(product,".git");
   expect(()=>auditHookGitContext(product,other,"pre-push")).toThrow(/hook-git-routing-mismatch/);
   const selected=auditHookGitContext(product,product,"pre-push");expect(selected.status).toBe("selected");expect(selected.env.GIT_DIR).toBeUndefined();expect(process.env.GIT_DIR).toBe(path.join(product,".git"));
  }finally{if(previous===undefined)delete process.env.GIT_DIR;else process.env.GIT_DIR=previous;}
  expect(auditHookGitContext(product,product,"pre-tool").status).toBe("selected");
  expect(privateGit(product,["for-each-ref","--format=%(refname)"])).toBe("");expect(privateGit(other,["for-each-ref","--format=%(refname)"])).toBe("");
 }finally{removeGitFixture(dir,"hook routing path");}
});
