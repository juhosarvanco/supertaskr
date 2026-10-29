import { spawnSync } from "node:child_process";
import { readFileSync, rmSync, symlinkSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { loadInstalledRecordTool } from "../scripts/records-check.mjs";
import { seedProjectSettings } from "../scripts/project-settings.mjs";
import { GENERIC_RECORD_PROFILE } from "../scripts/records-validation.mjs";
import { normalizeNamePolicy } from "../scripts/rename-scan.mjs";
import { privateRecordFixture, privateGit, putPrivate } from "./private-record-fixture";
import { testToolRuntime } from "../fixtures/tool-runtime";

function fixture() {
  const f=privateRecordFixture(),tool=loadInstalledRecordTool(f.manifestPath),seed=seedProjectSettings({tool,recordsValidation:GENERIC_RECORD_PROFILE});
  if(seed.status!=="ready")throw Error(JSON.stringify(seed));
  const settings=structuredClone(seed.settings);
  settings.names={version:1,identifier:"newapp",prose:"Newapp",legacy:"oldapp",kept:[{id:"quotation",pattern:'"Oldapp"',files:["README.md"]}],roots:["src/"],files:["README.md"],excludedFiles:[],binaryExtensions:[]};
  putPrivate(f.product,".gitignore",".supertaskr/\n");putPrivate(f.product,"src/newapp.py","name='newapp'\n");putPrivate(f.product,"README.md",'# Newapp\n\nKept quotation: "Oldapp".\n');
  const commit=()=>{putPrivate(f.product,"supertaskr.yaml",JSON.stringify(settings));privateGit(f.product,["add",".gitignore","src","README.md","supertaskr.yaml"]);privateGit(f.product,["commit","-qm","Explicit name keeper policy"]);return privateGit(f.product,["rev-parse","HEAD"]);};
  const revision=commit(),installed=testToolRuntime();rmSync(path.join(f.product,".supertaskr"),{recursive:true});rmSync(f.records,{recursive:true});
  const run=(...args:string[])=>spawnSync(process.execPath,[path.join(installed.packageRoot,"supertaskr.mjs"),"names","--root",f.product,...args],{cwd:f.product,encoding:"utf8",env:{...process.env,NODE_PATH:""}});
  return {...f,settings,commit,revision,run};
}
test("installed name keeper uses explicit names and exact retained quotations in committed PRODUCT source",()=>{
  test.setTimeout(180_000);const f=fixture();
  try{
    const positive=f.run();expect(positive.status,positive.stderr).toBe(0);const report=JSON.parse(positive.stdout);expect(report.files).toBe(2);expect(report.findings).toEqual([]);expect(report.legacy).toMatchObject([{file:"README.md",cls:"quotation"}]);
    putPrivate(f.product,"README.md",'# Newapp\n\nKept quotation: "Oldapp".\nA new oldapp leftover in the same file.\n');
    expect(f.run().status).toBe(0);const revision=f.commit();expect(revision).not.toBe(f.revision);
    const failed=f.run();expect(failed.status,failed.stderr).toBe(1);expect(JSON.parse(failed.stdout).findings).toMatchObject([{file:"README.md",cls:null,text:"A new oldapp leftover in the same file."}]);
    expect(f.run("--at",f.revision).status).toBe(0);
  }finally{f.cleanup();}
});
test("configured case, confusable and path readings preserve the same canonical classifier",()=>{
  test.setTimeout(180_000);const f=fixture();
  try{
    putPrivate(f.product,"src/newapp.py","`Newapp`\nnеwapp_identifier\n");putPrivate(f.product,"src/oldapp.py","name='newapp'\n");f.commit();
    const result=f.run();expect(result.status,result.stderr).toBe(1);const report=JSON.parse(result.stdout);
    expect(report.cases.some((hit:any)=>hit.text==='`Newapp`')).toBe(true);expect(report.homoglyphs.some((hit:any)=>hit.text.includes("nеwapp"))).toBe(true);expect(report.legacy.some((hit:any)=>hit.file==="src/oldapp.py"&&hit.line===0&&hit.cls===null)).toBe(true);
    expect(privateGit(f.product,["status","--porcelain"])).toBe("");
  }finally{f.cleanup();}
});
test("name scan reads committed plain blobs and refuses unsupported kinds/encoding instead of skipping them",()=>{
  test.setTimeout(180_000);const f=fixture();
  try{
    const canary=path.join(f.dir,"outside.txt");putPrivate(f.dir,"outside.txt","oldapp outside canary\n");
    rmSync(path.join(f.product,"src/newapp.py"));symlinkSync(canary,path.join(f.product,"src/newapp.py"));
    expect(f.run().status).toBe(0);f.commit();const linked=f.run();expect(linked.status).toBe(3);expect(linked.stderr).toContain("project-names-source-kind");expect(readFileSync(canary,"utf8")).toBe("oldapp outside canary\n");
    rmSync(path.join(f.product,"src/newapp.py"));putPrivate(f.product,"src/newapp.py","newapp\n");putPrivate(f.product,"src/data.bin",Buffer.from([0xff,0xfe]));f.commit();
    const encoding=f.run();expect(encoding.status).toBe(3);expect(encoding.stderr).toContain("project-names-source-encoding");
    (f.settings.names as any).binaryExtensions=[".bin"];f.commit();expect(f.run().status).toBe(0);
  }finally{f.cleanup();}
});
test("name policy has no missing/unknown/empty corpus fallback",()=>{
  test.setTimeout(180_000);const f=fixture();
  try{
    const policy=structuredClone(f.settings.names);expect(normalizeNamePolicy(policy)).toEqual(policy);
    expect(Object.isFrozen(normalizeNamePolicy(policy))).toBe(true);
    f.settings.names=null;f.commit();expect(f.run().status).toBe(3);expect(f.run().stderr).toContain("missing configuration: names");
    f.settings.names={unknown:"no guessed source table"};f.commit();expect(f.run().stderr).toContain("project-settings-names-unsupported");
    f.settings.names=structuredClone(policy);(f.settings.names as any).roots=["../outside/"];f.commit();expect(f.run().stderr).toContain("project-settings-names-invalid");
    f.settings.names=structuredClone(policy);(f.settings.names as any).roots=["missing/"];f.commit();expect(f.run().stderr).toContain("project-names-corpus-unmatched");
    f.settings.names=structuredClone(policy);(f.settings.names as any).excludedFiles=["README.md","src/newapp.py"];f.commit();expect(f.run().stderr).toContain("project-names-empty-corpus");
  }finally{f.cleanup();}
});
test("configured protocol case allowance is literal and file scoped, with neighboring and changed-prefix controls",()=>{
  test.setTimeout(180_000);const f=fixture();
  try{
    const policy=f.settings.names as any;policy.kept.push({id:"protocol-prefix",reading:"case",pattern:"Newapp-Operation:",files:["README.md"]});
    putPrivate(f.product,"README.md",'`Newapp-Operation: data`\n');f.commit();expect(f.run().status).toBe(0);
    putPrivate(f.product,"README.md",'`Newapp-Operation: dev.NewappThing`\n');f.commit();expect(f.run().status).toBe(1);
    putPrivate(f.product,"README.md",'`Newapp-OperationX: data`\n');f.commit();expect(f.run().status).toBe(1);
    putPrivate(f.product,"README.md","Newapp\n");putPrivate(f.product,"src/newapp.py",'`Newapp-Operation: data`\n');f.commit();expect(f.run().status).toBe(1);
    policy.kept[1].pattern=".*";f.commit();expect(f.run().stderr).toContain("project-settings-names-invalid");
  }finally{f.cleanup();}
});
