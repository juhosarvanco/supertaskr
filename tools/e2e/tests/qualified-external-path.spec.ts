import {test,expect} from "@playwright/test";
import {mkdirSync,renameSync,rmSync,symlinkSync,readFileSync} from "node:fs";
import path from "node:path";
import {captureExternalParent,assertExternalParent} from "../scripts/qualified-external-path.mjs";
import {captureOperationRepository} from "../scripts/durable-operation.mjs";
import {privateRecordFixture,privateGit} from "./private-record-fixture";

test("external parent observation walks actual repository and Git-store ancestor identities without creating a namespace",()=>{
 const f=privateRecordFixture();try{
  const excluded=[f.product,f.records].flatMap(root=>captureOperationRepository(root,privateGit(root,["rev-parse","HEAD"]),{forEffect:false}).identities),parent=path.join(f.dir,"outside  ");mkdirSync(parent);
  const before=[f.product,f.records].map(root=>({head:privateGit(root,["rev-parse","HEAD"]),index:readFileSync(path.join(root,".git/index"))})),captured=captureExternalParent(parent,excluded);
  expect(captured.path).toBe(parent);expect(()=>assertExternalParent(captured,excluded)).not.toThrow();
  expect(()=>assertExternalParent({...captured,extra:"caller"} as any,excluded)).toThrow("QUALIFIED_EXTERNAL_DIRECTORY_CHANGED");
  for(const root of [f.product,f.records]){
   const nested=path.join(root,"nested-parent");mkdirSync(nested);expect(()=>captureExternalParent(nested,excluded)).toThrow("QUALIFIED_EXTERNAL_PARENT_NOT_EXTERNAL");rmSync(nested,{recursive:true});
   expect(()=>captureExternalParent(path.join(root,".git/objects"),excluded)).toThrow("QUALIFIED_EXTERNAL_PARENT_NOT_EXTERNAL");
  }
  const alias=path.join(f.dir,"outside-alias");symlinkSync(parent,alias);expect(()=>captureExternalParent(alias,excluded)).toThrow("QUALIFIED_EXTERNAL_DIRECTORY_CHANGED");
  expect(()=>captureExternalParent(parent,[])).toThrow("QUALIFIED_EXTERNAL_EXCLUSIONS_REQUIRED");
  expect([f.product,f.records].map(root=>({head:privateGit(root,["rev-parse","HEAD"]),index:readFileSync(path.join(root,".git/index"))}))).toEqual(before);
 }finally{f.cleanup();}
});

test("a replaced external parent does not satisfy the original captured directory",()=>{
 const f=privateRecordFixture();try{
  const excluded=[f.product,f.records].flatMap(root=>captureOperationRepository(root,privateGit(root,["rev-parse","HEAD"]),{forEffect:false}).identities),parent=path.join(f.dir,"outside"),held=path.join(f.dir,"held-original");mkdirSync(parent);
  const original=captureExternalParent(parent,excluded);renameSync(parent,held);mkdirSync(parent);
  expect(()=>assertExternalParent(original,excluded)).toThrow("QUALIFIED_EXTERNAL_DIRECTORY_CHANGED");rmSync(parent,{recursive:true});renameSync(held,parent);expect(()=>assertExternalParent(original,excluded)).not.toThrow();
 }finally{f.cleanup();}
});
