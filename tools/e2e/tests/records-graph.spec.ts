import { expect, test } from "@playwright/test";
import { execFileSync, spawn, spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { parse as parseYaml } from "yaml";
import { captureGraphContext, createGraphProducer, discoverPrivateGraphs, indexPrivateGraph, installedIndexer, PRIVATE_GRAPH_PATH, replayPrivateGraph, updatePrivateGraph } from "../scripts/records-graph.mjs";
import { acceptedOperationPath, readAcceptedOperation, withAcceptedOperation } from "../scripts/durable-operation.mjs";
import { operationDigest } from "../scripts/operation-record.mjs";
import { assertExactRecordTransformations, captureExactRecordPlan, materializeExactRecordWrites, prepareExactRecordTree } from "../scripts/record-write.mjs";
import { privateRecordFixture, privateGit, putPrivate, commitPrivate, fixtureProjectSettings, sha, SOURCE, FIXTURE_ENV } from "./private-record-fixture.js";
import { sourceOnlyCheckout } from "../fixtures/source-only";
import { removeGitFixture } from "./git-fixture";

test.describe("private source graph producer",()=>{
  const binary=`native/${process.platform}-${process.arch}/supertaskr-index${process.platform==="win32"?".exe":""}`;
  let installed="", installationHome="",stagedSource="";
  test.beforeAll(({},info)=>{
    info.setTimeout(180000);
    stagedSource=sourceOnlyCheckout();
    execFileSync(process.execPath,[path.join(stagedSource,"tools/e2e/scripts/interview-skill.mjs")],{cwd:stagedSource,stdio:"pipe"});
    const actualTarget=path.join(SOURCE,"app/src-tauri/target/packed-indexer-fixture");
    execFileSync(process.execPath,[path.join(stagedSource,"cli/build-package.mjs")],{cwd:stagedSource,stdio:["ignore","pipe","pipe"],
      env:{...process.env,CARGO_TARGET_DIR:actualTarget,CARGO_BUILD_TARGET:"supertaskr-invalid-configured-target"}});
    const host=/^host: (.+)$/m.exec(execFileSync("rustc",["-vV"],{encoding:"utf8"}))?.[1];expect(host).toBeDefined();
    expect(readFileSync(path.join(stagedSource,"cli/dist",binary))).toEqual(readFileSync(path.join(actualTarget,host!,"release",path.basename(binary))));
    installationHome=mkdtempSync(path.join(os.tmpdir(),"supertaskr-graph-installed-"));
    const packed=JSON.parse(execFileSync("npm",["pack","--ignore-scripts","--json","--pack-destination",installationHome],{cwd:path.join(stagedSource,"cli"),encoding:"utf8"}));
    execFileSync("npm",["install","--prefix",installationHome,"--ignore-scripts","--no-audit","--no-fund",path.join(installationHome,packed[0].filename)],{stdio:["ignore","pipe","pipe"]});
    installed=path.join(installationHome,"node_modules/supertaskr/supertaskr.mjs");
  });
  test.afterAll(()=>{if(installationHome)rmSync(installationHome,{recursive:true,force:true});if(stagedSource)removeGitFixture(stagedSource,"configured graph package snapshot");});
  function fixture(languages=["ts"]){
    const fx=privateRecordFixture();
    const target=path.join(fx.tool,"dist",binary);
    putPrivate(fx.tool,`dist/${binary}`,readFileSync(path.join(stagedSource,"cli/dist",binary)));
    // Preserve executable mode from the actual pack-time scanner artifact.
    cpSync(path.join(stagedSource,"cli/dist",binary),target);
    const manifest=JSON.parse(readFileSync(fx.manifestPath,"utf8"));
    manifest.runtime.files.push({path:binary,sha256:sha(readFileSync(target))});
    manifest.runtime.files.sort((a:{path:string},b:{path:string})=>a.path<b.path?-1:1);
    manifest.runtime.buildHash=sha(JSON.stringify(manifest.runtime.files));writeFileSync(fx.manifestPath,JSON.stringify(manifest));
    putPrivate(fx.product,"src/a.ts","import { b } from './b';\nexport const a = b;\n");
    putPrivate(fx.product,"src/b.ts","export const b = 1;\n");
    const settings=parseYaml(fixtureProjectSettings(fx));settings.languages=languages;
    putPrivate(fx.product,"supertaskr.yaml",JSON.stringify(settings));
    fx.options.productRevision=commitPrivate(fx.product);
    return {...fx,settings};
  }
  test("installed graph refresh and committed currency support graphs above one MiB",()=>{
    test.setTimeout(180000);const fx=fixture();try {
      for(let file=0;file<150;file++)putPrivate(fx.product,`src/domain-${file}.ts`,Array.from({length:50},(_,symbol)=>`export function named_operation_${file}_${symbol}() { return ${symbol}; }`).join("\n")+"\n");
      const revision=commitPrivate(fx.product),productIndex=readFileSync(path.join(fx.product,".git/index")),refs=privateGit(fx.product,["for-each-ref","--format=%(refname) %(objectname)"]);
      const run=(...args:string[])=>spawnSync(process.execPath,[installed,"index",...args,"--root",fx.product],{cwd:fx.dir,env:{...FIXTURE_ENV,NODE_PATH:""},encoding:"utf8"});
      const first=run("--write");expect(first.status,first.stderr).toBe(0);
      const bytes=readFileSync(path.join(fx.records,PRIVATE_GRAPH_PATH));expect(bytes.length).toBeGreaterThan(1024*1024);expect(bytes.length).toBeLessThan(3*1024*1024);
      expect(run("--check").status).toBe(0);
      putPrivate(fx.product,"src/new.ts","export function added_later() { return 1; }\n");
      const second=run("--write");expect(second.status,second.stderr).toBe(0);expect(JSON.parse(second.stdout).changed).toBe(true);
      expect(run("--check").status).toBe(0);expect(JSON.parse(run("--write").stdout).changed).toBe(false);
      expect(privateGit(fx.product,["rev-parse","HEAD"])).toBe(revision);expect(readFileSync(path.join(fx.product,".git/index"))).toEqual(productIndex);expect(privateGit(fx.product,["for-each-ref","--format=%(refname) %(objectname)"])).toBe(refs);
    }finally{fx.cleanup();}
  });
  test("installed Python indexing and currency checks use committed languages and meaningful local edges",()=>{
    const fx=fixture(["python"]);
    try {
      putPrivate(fx.product,"domain.py","class Item:\n    pass\ndef build() -> Item:\n    return Item()\n");
      putPrivate(fx.product,"api.py","from domain import build, Item\ndef run() -> Item:\n    return build()\n");
      const revision=commitPrivate(fx.product);
      // An invalid working editor value cannot replace the committed choice.
      putPrivate(fx.product,"supertaskr.yaml","invalid: [\n");
      putPrivate(fx.records,"private.py","def wrong():\n    pass\n");
      const env={...FIXTURE_ENV,NODE_PATH:""};
      const run=(...args:string[])=>spawnSync(process.execPath,[installed,"index",...args,"--root",fx.product],{cwd:fx.dir,env,encoding:"utf8"});
      const first=run("--write");expect(first.status,first.stderr).toBe(0);
      const receipt=JSON.parse(first.stdout);expect(receipt.provenance.configuration).toMatchObject({productRevision:revision,languages:["python"]});
      const graph=JSON.parse(readFileSync(path.join(fx.records,PRIVATE_GRAPH_PATH),"utf8"));
      expect(graph.files.map((f:{path:string})=>f.path)).toEqual(["api.py","domain.py","hello.py"]);
      expect(graph.edges).toEqual(expect.arrayContaining([
        expect.objectContaining({from:"f:api.py",to:"f:domain.py",kind:"import"}),
        expect.objectContaining({from:"s:api.py#run",to:"s:domain.py#build",kind:"call"}),
        expect.objectContaining({from:"s:api.py#run",to:"s:domain.py#Item",kind:"type_ref"}),
      ]));
      const head=privateGit(fx.records,["rev-parse","HEAD"]);
      expect(run("--check").status).toBe(0);
      putPrivate(fx.product,"late.py","def added():\n    return 1\n");
      expect(run("--check").status).toBe(1);expect(privateGit(fx.records,["rev-parse","HEAD"])).toBe(head);
      const fresh=execFileSync(installedIndexer(fx.manifestPath).program,["index","--emit-json","--root",fx.product,"--languages","python"]);
      putPrivate(fx.records,PRIVATE_GRAPH_PATH,fresh);
      const workingOnly=run("--check");expect(workingOnly.status).toBe(1);expect(workingOnly.stderr).toContain("graph-committed-stale");
      expect(privateGit(fx.records,["rev-parse","HEAD"])).toBe(head);
      expect(run("--write").status).toBe(0);expect(run("--check").status).toBe(0);
      expect(privateGit(fx.product,["rev-parse","HEAD"])).toBe(revision);
      expect(existsSync(path.join(fx.product,PRIVATE_GRAPH_PATH))).toBe(false);
    } finally {fx.cleanup();}
  });
  test("missing invalid empty unknown and unmatched language choices refuse without graph or private commit",()=>{
    for(const variant of ["missing","invalid","empty","unknown","combined","unmatched"]) {
      const fx=fixture();try {
        if(variant==="missing")rmSync(path.join(fx.product,"supertaskr.yaml"));
        else if(variant==="invalid")putPrivate(fx.product,"supertaskr.yaml","{}\n");
        else {fx.settings.languages=variant==="empty"?[]:variant==="unknown"?["go"]:variant==="combined"?["python,ts"]:["rust"];putPrivate(fx.product,"supertaskr.yaml",JSON.stringify(fx.settings));}
        commitPrivate(fx.product);
        if(variant==="unmatched") {
          // Even a stored/committed matching empty raw graph cannot certify an
          // installed configured producer with no selected-language source.
          putPrivate(fx.records,PRIVATE_GRAPH_PATH,execFileSync(installedIndexer(fx.manifestPath).program,["index","--emit-json","--root",fx.product,"--languages","rust"]));
          commitPrivate(fx.records);
        }
        const head=privateGit(fx.records,["rev-parse","HEAD"]),index=readFileSync(path.join(fx.records,".git/index"));
        const result=spawnSync(process.execPath,[installed,"index","--write","--root",fx.product],{cwd:fx.dir,encoding:"utf8",env:{...FIXTURE_ENV,NODE_PATH:""}});
        expect(result.status,`${variant}: ${result.stderr}`).toBe(3);
        expect(result.stderr).toContain(variant==="missing"?"project-settings-missing":variant==="invalid"?"project-settings-invalid":variant==="empty"?"graph-languages-unconfigured":variant==="unmatched"?"graph-selected-source-empty":"graph-language-unsupported");
        expect(existsSync(path.join(fx.records,"docs/architecture"))).toBe(variant==="unmatched");expect(existsSync(path.join(fx.product,".supertaskr/runs"))).toBe(false);
        if(variant==="unmatched") {
          const checked=spawnSync(process.execPath,[installed,"index","--check","--root",fx.product],{cwd:fx.dir,encoding:"utf8",env:{...FIXTURE_ENV,NODE_PATH:""}});
          expect(checked.status,checked.stderr).toBe(3);expect(checked.stderr).toContain("graph-selected-source-empty");
        }
        expect(privateGit(fx.records,["rev-parse","HEAD"])).toBe(head);expect(readFileSync(path.join(fx.records,".git/index"))).toEqual(index);
      } finally {fx.cleanup();}
    }
  });
  test("a retained producer allows new code commits but refuses changed committed policy and copied-history roots",()=>{
    const fx=fixture(),original=fx.product+"-original";
    try {
      const producer=createGraphProducer({productRoot:fx.product,manifestPath:fx.manifestPath});
      expect(producer.index({operationId:"configured-initial"}).files).toBe(2);
      putPrivate(fx.product,"src/new.ts","export const added = 1;\n");commitPrivate(fx.product);
      expect(producer.index({operationId:"configured-code-commit"}).files).toBe(3);
      const head=privateGit(fx.records,["rev-parse","HEAD"]),bytes=readFileSync(path.join(fx.records,PRIVATE_GRAPH_PATH));
      renameSync(fx.product,original);cpSync(original,fx.product,{recursive:true});
      expect(()=>producer.index({operationId:"configured-replacement"})).toThrow("graph-watch-context-changed");
      rmSync(fx.product,{recursive:true});renameSync(original,fx.product);expect(producer.context().productRoot).toBe(fx.product);
      fx.settings.languages=["python"];putPrivate(fx.product,"supertaskr.yaml",JSON.stringify(fx.settings));commitPrivate(fx.product);
      expect(()=>producer.index({operationId:"configured-retarget"})).toThrow("graph-configuration-changed");
      expect(privateGit(fx.records,["rev-parse","HEAD"])).toBe(head);expect(readFileSync(path.join(fx.records,PRIVATE_GRAPH_PATH))).toEqual(bytes);
      expect(()=>producer.index({languages:["ts"]})).toThrow("graph-request");
    } finally {fx.cleanup();}
  });
  test("currency never greens a second working source cut over the retained committed graph",()=>{
    const fx=fixture();try {
      const producer=createGraphProducer({productRoot:fx.product,manifestPath:fx.manifestPath});
      producer.index({operationId:"same-cut-initial"});
      const committed=readFileSync(path.join(fx.records,PRIVATE_GRAPH_PATH)),source=readFileSync(path.join(fx.product,"src/a.ts"));
      const product=privateGit(fx.product,["rev-parse","HEAD"]),records=privateGit(fx.records,["rev-parse","HEAD"]);
      let changed=false;
      expect(()=>producer.check({onBoundary(boundary){
        expect(boundary).toBe("graph-check-captured");changed=true;
        putPrivate(fx.product,"src/a.ts","export const second_cut = 22;\n");
        const second=execFileSync(installedIndexer(fx.manifestPath).program,["index","--emit-json","--root",fx.product,"--languages","ts"]);
        expect(second).not.toEqual(committed);putPrivate(fx.records,PRIVATE_GRAPH_PATH,second);
        // The old second raw check genuinely accepts B, while selected committed
        // R still carries A. No metadata/head change catches that mixed cut.
        const raw=spawnSync(installedIndexer(fx.manifestPath).program,["index","--check","--root",fx.product,"--records-root",fx.records,"--languages","ts"],{encoding:"utf8"});
        expect(raw.status,raw.stderr).toBe(0);
      }})).toThrow("graph-source-changed");
      expect(changed).toBe(true);expect(privateGit(fx.product,["rev-parse","HEAD"])).toBe(product);expect(privateGit(fx.records,["rev-parse","HEAD"])).toBe(records);
      putPrivate(fx.product,"src/a.ts",source);putPrivate(fx.records,PRIVATE_GRAPH_PATH,committed);
      expect(producer.check()).toBe(0);
    }finally{fx.cleanup();}
  });
  test("the actual native producer owners are required even when omitted manifest files remain present",()=>{
    const fx=fixture();try {
      const original=readFileSync(fx.manifestPath),manifest=JSON.parse(original.toString("utf8"));
      manifest.runtime.files=manifest.runtime.files.filter((file:{path:string})=>file.path!=="tools/e2e/scripts/records-graph.mjs");
      manifest.runtime.buildHash=sha(JSON.stringify(manifest.runtime.files));writeFileSync(fx.manifestPath,JSON.stringify(manifest));
      expect(existsSync(path.join(fx.tool,"dist/tools/e2e/scripts/records-graph.mjs"))).toBe(true);
      expect(()=>createGraphProducer({productRoot:fx.product,manifestPath:fx.manifestPath})).toThrow(/runtime/);
      writeFileSync(fx.manifestPath,original);expect(createGraphProducer({productRoot:fx.product,manifestPath:fx.manifestPath}).index().files).toBe(2);
    } finally {fx.cleanup();}
  });
  test("accepted legacy graph receipts remain historical while pending legacy work cannot gain new configuration",()=>{
    // Produce genuine v1 requests through the existing canonical operation and
    // exact-file writer, without modifying a saved request or forging a receipt.
    function legacy(fx:ReturnType<typeof fixture>,id:string,finish:boolean) {
      const origin=captureGraphContext(fx.product),installation=installedIndexer(fx.manifestPath);
      const bytes=execFileSync(installation.program,["index","--emit-json","--root",fx.product,"--languages","ts"]);
      const graph=JSON.parse(bytes.toString("utf8"));
      const writes=[{operation:"add",path:PRIVATE_GRAPH_PATH,type:"blob",mode:"100644",base64:bytes.toString("base64")}];
      const {tree,working}=captureExactRecordPlan(fx.records,origin.recordsRevision,writes);
      const payload={version:1,kind:"private-record-graph",options:{productRoot:fx.product,productRevision:origin.productRevision,recordsRevision:origin.recordsRevision},origin,tool:installation.tool,writes,...working,
        transformations:assertExactRecordTransformations(fx.records,[PRIVATE_GRAPH_PATH]),sourceDigest:operationDigest(bytes.toString("base64")),stats:graph.stats,truncated:false,
        productOrigin:origin.product,recordOrigin:{root:origin.records.root,gitDirectory:origin.records.gitDir,commonDirectory:origin.records.commonDir,
          device:origin.records.identities[0]?.device,inode:origin.records.identities[0]?.inode,docsDirectory:origin.docs.path,docsDevice:origin.docs.device,docsInode:origin.docs.inode}};
      let release:(()=>void)|undefined;
      try {return withAcceptedOperation(fx.product,{operationId:id,kind:"records-save",repositoryRoot:fx.records,targetRef:origin.targetRef,expectedRevision:origin.recordsRevision,
        acceptedTree:tree,payloadDigest:operationDigest(payload),payload,message:"Legacy graph fixture"},{authorize(){return true;},
        onBoundary(boundary){if(!finish && boundary==="intent-persisted")throw Error("ordinary legacy fixture stopped before materialization");},
        prepareTree(context){prepareExactRecordTree(payload,context,()=>true);}},context=>{release=materializeExactRecordWrites(fx.product,payload,context);});}
      finally {release?.();}
    }
    const accepted=fixture();try {
      const result=legacy(accepted,"legacy-accepted",true);
      putPrivate(accepted.product,"supertaskr.yaml","{}\n");commitPrivate(accepted.product);
      writeFileSync(path.join(accepted.product,".supertaskr/workspace.json"),"invalid successor binding\n");
      const replay=replayPrivateGraph({productRoot:accepted.product,operationId:"legacy-accepted",manifestPath:accepted.manifestPath});
      expect(replay.commit).toBe(result.commit);expect(replay.provenance.configuration).toBeUndefined();expect(replay.files).toBe(2);
    } finally {accepted.cleanup();}
    const pending=fixture();try {
      expect(()=>legacy(pending,"legacy-pending",false)).toThrow("ordinary legacy fixture stopped");
      const file=acceptedOperationPath(pending.product,"legacy-pending"),record=readFileSync(file),head=privateGit(pending.records,["rev-parse","HEAD"]),index=readFileSync(path.join(pending.records,".git/index"));
      expect(readAcceptedOperation(pending.product,"legacy-pending").operation.acceptance).toBeNull();
      for(const action of [()=>replayPrivateGraph({productRoot:pending.product,operationId:"legacy-pending",manifestPath:pending.manifestPath}),
        ()=>updatePrivateGraph({productRoot:pending.product,manifestPath:pending.manifestPath})])expect(action).toThrow("graph-operation-configuration-required");
      expect(readFileSync(file)).toEqual(record);expect(privateGit(pending.records,["rev-parse","HEAD"])).toBe(head);expect(readFileSync(path.join(pending.records,".git/index"))).toEqual(index);
      expect(existsSync(path.join(pending.records,"docs/architecture"))).toBe(false);
    } finally {pending.cleanup();}
  });
  test("writes only the private graph from PRODUCT source and then makes a true filesystem/ref no-op",()=>{
    const fx=fixture();
    try{
      putPrivate(fx.product,PRIVATE_GRAPH_PATH,"PRODUCT DECOY\n");fx.options.productRevision=commitPrivate(fx.product);
      putPrivate(fx.records,"private.ts","export const wrong = 99;\n");
      putPrivate(fx.records,"unrelated.txt","unrelated staged bytes\n");privateGit(fx.records,["add","unrelated.txt"]);
      const productHead=privateGit(fx.product,["rev-parse","HEAD"]), productIndex=readFileSync(path.join(fx.product,".git/index"));
      const first=indexPrivateGraph({productRoot:fx.product,operationId:"graph-first",manifestPath:fx.manifestPath});
      expect(first.changed).toBe(true);expect(first.status).toBe("indexed");
      const graph=JSON.parse(readFileSync(path.join(fx.records,PRIVATE_GRAPH_PATH),"utf8"));
      expect(graph.files.map((entry:{path:string})=>entry.path)).toEqual(["src/a.ts","src/b.ts"]);
      expect(privateGit(fx.records,["show","--format=","--name-only","HEAD"]).trim()).toBe(PRIVATE_GRAPH_PATH);
      expect(privateGit(fx.records,["diff","--cached","--name-only"])).toBe("unrelated.txt");
      expect(readFileSync(path.join(fx.records,"unrelated.txt"),"utf8")).toBe("unrelated staged bytes\n");
      expect(privateGit(fx.product,["rev-parse","HEAD"])).toBe(productHead);expect(readFileSync(path.join(fx.product,".git/index"))).toEqual(productIndex);
      expect(readFileSync(path.join(fx.product,PRIVATE_GRAPH_PATH),"utf8")).toBe("PRODUCT DECOY\n");
      const before=statSync(path.join(fx.records,PRIVATE_GRAPH_PATH),{bigint:true});const head=privateGit(fx.records,["rev-parse","HEAD"]);
      const second=indexPrivateGraph({productRoot:fx.product,operationId:"graph-noop",manifestPath:fx.manifestPath});
      expect(second.changed).toBe(false);expect(privateGit(fx.records,["rev-parse","HEAD"])).toBe(head);
      const after=statSync(path.join(fx.records,PRIVATE_GRAPH_PATH),{bigint:true});expect(after.ino).toBe(before.ino);expect(after.mtimeNs).toBe(before.mtimeNs);
      expect(first.provenance.kind).toBe("working-tree");expect(first.provenance.productRevision).toBe(productHead);
    }finally{fx.cleanup();}
  });
  test("refuses changed source and binding before any graph parent/file/ref/index effect",()=>{
    for(const change of ["source","binding"]){
      const fx=fixture();
      try{
        const head=privateGit(fx.records,["rev-parse","HEAD"]), index=readFileSync(path.join(fx.records,".git/index"));
        let changed=false;
        expect(()=>indexPrivateGraph({productRoot:fx.product,operationId:`graph-change-${change}`,manifestPath:fx.manifestPath},{onBoundary(boundary){
          if(boundary!=="prepared"||changed)return;changed=true;
          if(change==="source")putPrivate(fx.product,"src/a.ts","export const changed = 2;\n");
          else writeFileSync(path.join(fx.product,".supertaskr/workspace.json"),"invalid explicit binding\n");
        }})).toThrow(change==="source"?"graph-source-changed":"workspace");
        expect(changed).toBe(true);expect(existsSync(path.join(fx.records,"docs/architecture"))).toBe(false);
        expect(privateGit(fx.records,["rev-parse","HEAD"])).toBe(head);expect(readFileSync(path.join(fx.records,".git/index"))).toEqual(index);
      }finally{fx.cleanup();}
    }
  });
  test("graph policy refuses mid-prepare successor docs or binding and resumes only its original captured context",()=>{
    for(const change of ["docs","binding"]){const fx=fixture();try{
      const docs=path.join(fx.records,"docs"),originalDocs=path.join(fx.dir,"original-graph-docs"),successorDocs=path.join(fx.dir,"successor-graph-docs"),binding=path.join(fx.product,".supertaskr/workspace.json"),bindingBytes=readFileSync(binding),index=readFileSync(path.join(fx.records,".git/index")),head=privateGit(fx.records,["rev-parse","HEAD"]);let changed=false;
      expect(()=>indexPrivateGraph({productRoot:fx.product,operationId:`graph-mid-${change}`,manifestPath:fx.manifestPath},{onBoundary(boundary){if(boundary==="file-temp-written"&&!changed){changed=true;
        if(change==="docs"){renameSync(docs,originalDocs);cpSync(originalDocs,docs,{recursive:true});}else writeFileSync(binding,"Invalid successor graph binding\n");
      }}})).toThrow();
      expect(changed).toBe(true);expect(existsSync(path.join(fx.records,PRIVATE_GRAPH_PATH))).toBe(false);expect(privateGit(fx.records,["rev-parse","HEAD"])).toBe(head);expect(readFileSync(path.join(fx.records,".git/index"))).toEqual(index);
      const rec=readAcceptedOperation(fx.product,`graph-mid-${change}`),request=JSON.stringify(rec.operation.request);expect(["starting","unknown"]).toContain(rec.state);expect(rec.events.some((e:any)=>e.op==="consumer-prepare")).toBe(true);expect(rec.operation.intent).not.toBeNull();expect(rec.operation.acceptance).toBeNull();
      if(change==="docs"){renameSync(docs,successorDocs);renameSync(originalDocs,docs);}else writeFileSync(binding,bindingBytes);
      const result=replayPrivateGraph({productRoot:fx.product,operationId:`graph-mid-${change}`,manifestPath:fx.manifestPath});expect(result.status).toBe("indexed");expect(privateGit(fx.records,["rev-parse","HEAD"])).toBe(result.commit);expect(JSON.stringify(readAcceptedOperation(fx.product,`graph-mid-${change}`).operation.request)).toBe(request);
      if(change==="docs")expect(existsSync(path.join(successorDocs,"architecture/graph.json"))).toBe(false);
    }finally{fx.cleanup();}}
  });
  test("a cold accepted retry returns its original exact receipt after later private save and invalid successor binding",()=>{
    const fx=fixture();
    try{
      const module=pathToFileURL(path.join(SOURCE,"tools/e2e/scripts/records-graph.mjs")).href;
      const script=`import {indexPrivateGraph} from ${JSON.stringify(module)};indexPrivateGraph({productRoot:process.argv[1],operationId:'graph-cold',manifestPath:process.argv[2]},{onBoundary(boundary){if(boundary==='ref-accepted')process.exit(73)}});`;
      const child=spawnSync(process.execPath,["--input-type=module","-e",script,fx.product,fx.manifestPath],{env:FIXTURE_ENV,encoding:"utf8"});
      expect(child.status,child.stderr).toBe(73);
      const accepted=privateGit(fx.records,["rev-parse","HEAD"]);
      const discovered=discoverPrivateGraphs({productRoot:fx.product});expect(discovered).toHaveLength(1);expect(discovered[0]?.operationId).toBe("graph-cold");expect(discovered[0]?.state).toBe("accepted");
      const recovered=updatePrivateGraph({productRoot:fx.product,operationId:"graph-new-client",manifestPath:fx.manifestPath});
      expect(recovered.commit).toBe(accepted);expect(recovered.operationId).toBe("graph-cold");
      expect(existsSync(path.join(fx.records,".git/index.lock"))).toBe(false);
      putPrivate(fx.records,"docs/rooms/later.md","# Later legitimate note\n");commitPrivate(fx.records);
      const later=privateGit(fx.records,["rev-parse","HEAD"]);
      writeFileSync(path.join(fx.product,".supertaskr/workspace.json"),"invalid successor binding\n");
      const receipt=replayPrivateGraph({productRoot:fx.product,operationId:"graph-cold",manifestPath:fx.manifestPath});
      expect(receipt.commit).toBe(accepted);expect(receipt.recovered).toBe(true);expect(privateGit(fx.records,["rev-parse","HEAD"])).toBe(later);
    }finally{fx.cleanup();}
  });
  test("private cache paths and invalid explicit associations create no graph or cache directories",()=>{
    const fx=fixture();
    try{
      const cache=path.join(fx.records,"private-cache");
      expect(()=>indexPrivateGraph({productRoot:fx.product,cacheDir:cache,manifestPath:fx.manifestPath})).toThrow("graph-cache-private-location");
      expect(existsSync(cache)).toBe(false);expect(existsSync(path.join(fx.records,"docs/architecture"))).toBe(false);
      writeFileSync(path.join(fx.product,".supertaskr/workspace.json"),"invalid binding\n");
      expect(()=>captureGraphContext(fx.product)).toThrow();expect(existsSync(path.join(fx.product,"docs"))).toBe(false);
    }finally{fx.cleanup();}
  });
  test("a native stale-origin request refuses before recovery, publication or private parent creation",()=>{
    const fx=fixture();
    try{
      const origin=captureGraphContext(fx.product);
      const expectedOrigin={recordsRoot:origin.records.root,rootIncarnation:`${origin.records.identities[0]?.device}:${origin.records.identities[0]?.inode}`,
        docsIncarnation:`${origin.docs.device}:${origin.docs.inode}`,associationId:"external-python",productRevision:origin.productRevision};
      expect(()=>updatePrivateGraph({productRoot:fx.product,manifestPath:fx.manifestPath,expectedOrigin:{...expectedOrigin,docsIncarnation:"other:incarnation"}})).toThrow("graph-selection-changed");
      expect(existsSync(path.join(fx.product,".supertaskr/runs"))).toBe(false);expect(existsSync(path.join(fx.records,"docs/architecture"))).toBe(false);
      expect(updatePrivateGraph({productRoot:fx.product,manifestPath:fx.manifestPath,expectedOrigin}).changed).toBe(true);
    }finally{fx.cleanup();}
  });
  test("equal generated working bytes still publish when their private committed baseline differs",()=>{
    const fx=fixture();
    try{
      indexPrivateGraph({productRoot:fx.product,manifestPath:fx.manifestPath});
      const before=privateGit(fx.records,["rev-parse","HEAD"]),product=privateGit(fx.product,["rev-parse","HEAD"]);
      putPrivate(fx.product,"src/new.ts","export const new_working_source = 3;\n");
      const bytes=execFileSync(installedIndexer(fx.manifestPath).program,["index","--emit-json","--root",fx.product]);
      putPrivate(fx.records,PRIVATE_GRAPH_PATH,bytes);
      const result=indexPrivateGraph({productRoot:fx.product,operationId:"graph-working-equal",manifestPath:fx.manifestPath});
      expect(result.changed).toBe(true);expect(result.files).toBe(3);expect(privateGit(fx.records,["rev-parse","HEAD"])).not.toBe(before);
      expect(Buffer.from(privateGit(fx.records,["show",`HEAD:${PRIVATE_GRAPH_PATH}`])+"\n")).toEqual(bytes);
      expect(privateGit(fx.product,["rev-parse","HEAD"])).toBe(product);
    }finally{fx.cleanup();}
  });
  test("a cold original source cut can stop before materialization and admit a distinct current graph",()=>{
    const fx=fixture();
    try{
      const module=pathToFileURL(path.join(SOURCE,"tools/e2e/scripts/records-graph.mjs")).href;
      const script=`import {indexPrivateGraph} from ${JSON.stringify(module)};indexPrivateGraph({productRoot:process.argv[1],operationId:'graph-old-cut',manifestPath:process.argv[2]},{onBoundary(boundary){if(boundary==='intent-persisted')process.exit(74)}});`;
      const child=spawnSync(process.execPath,["--input-type=module","-e",script,fx.product,fx.manifestPath],{env:FIXTURE_ENV,encoding:"utf8"});
      expect(child.status,child.stderr).toBe(74);expect(existsSync(path.join(fx.records,"docs/architecture"))).toBe(false);
      putPrivate(fx.product,"src/current.ts","export const current = 3;\n");
      const result=updatePrivateGraph({productRoot:fx.product,operationId:"graph-current-cut",manifestPath:fx.manifestPath});
      expect(result.operationId).toBe("graph-current-cut");expect(result.files).toBe(3);
      const rows=discoverPrivateGraphs({productRoot:fx.product});expect(rows.find(row=>row.operationId==="graph-old-cut")?.state).toBe("stopped");
      expect(()=>replayPrivateGraph({productRoot:fx.product,operationId:"graph-old-cut",manifestPath:fx.manifestPath})).toThrow("graph-operation-stopped");
      expect(privateGit(fx.records,["rev-list","--count","HEAD"])).toBe("2");
    }finally{fx.cleanup();}
  });
  test("an unchanged graph retires only its proven dead accepted lock and reports a foreign lock separately",()=>{
    const fx=fixture();
    try{
      const module=pathToFileURL(path.join(SOURCE,"tools/e2e/scripts/records-graph.mjs")).href;
      const script=`import {indexPrivateGraph} from ${JSON.stringify(module)};indexPrivateGraph({productRoot:process.argv[1],operationId:'graph-finished-lock',manifestPath:process.argv[2]});`;
      const child=spawnSync(process.execPath,["--input-type=module","-e",script,fx.product,fx.manifestPath],{env:FIXTURE_ENV,encoding:"utf8"});
      expect(child.status,child.stderr).toBe(0);
      const rec=readAcceptedOperation(fx.product,"graph-finished-lock"),lock=path.join(fx.records,".git/index.lock");
      // Arrange only the crash filesystem artifact using the original real
      // process/token. The canonical finished request and receipt stay intact.
      writeFileSync(lock,JSON.stringify({operationId:rec.operation.id,token:rec.operation.request.payload.index.lockToken,pid:rec.operation.owner.pid}));
      const head=privateGit(fx.records,["rev-parse","HEAD"]);
      expect(updatePrivateGraph({productRoot:fx.product,manifestPath:fx.manifestPath}).changed).toBe(false);
      expect(existsSync(lock)).toBe(false);expect(privateGit(fx.records,["rev-parse","HEAD"])).toBe(head);
      const foreign=JSON.stringify({operationId:"foreign-operation",token:"foreign",pid:process.pid});writeFileSync(lock,foreign);
      const result=updatePrivateGraph({productRoot:fx.product,manifestPath:fx.manifestPath});
      expect(result.changed).toBe(false);expect(result.cleanupWarning).toBe("graph-index-lock-unavailable");
      expect(readFileSync(lock,"utf8")).toBe(foreign);expect(privateGit(fx.records,["rev-parse","HEAD"])).toBe(head);
    }finally{fx.cleanup();}
  });
  test("an isolated installed watcher indexes PRODUCT, keeps ordinary private edits quiet, and refuses a replacement records home",async()=>{
    test.setTimeout(60000);
    const fx=fixture(), replacement=path.join(fx.dir,"replacement-records");
    const env:NodeJS.ProcessEnv={...FIXTURE_ENV};delete env.NODE_PATH;
    let child:ReturnType<typeof spawn>|undefined;
    let stdout="",stderr="";
    const wait=async(predicate:()=>boolean)=>{
      const end=Date.now()+15000;
      while(!predicate()&&Date.now()<end){if(child?.exitCode!==null&&child?.exitCode!==undefined)throw Error(stderr||stdout||"watcher exited");await new Promise(resolve=>setTimeout(resolve,30));}
      expect(predicate(),stderr||stdout).toBe(true);
    };
    try{
      mkdirSync(replacement);privateGit(replacement,["init","-q","--initial-branch=main"]);
      privateGit(replacement,["config","user.name","Fixture"]);privateGit(replacement,["config","user.email","fixture@example.invalid"]);
      cpSync(path.join(fx.records,"docs"),path.join(replacement,"docs"),{recursive:true});
      cpSync(path.join(fx.records,"workspace-association.json"),path.join(replacement,"workspace-association.json"));commitPrivate(replacement);
      const otherHead=privateGit(replacement,["rev-parse","HEAD"]), productHead=privateGit(fx.product,["rev-parse","HEAD"]);
      child=spawn(process.execPath,[installed,"index","--watch","--root",fx.product],{cwd:fx.dir,env,detached:true,stdio:["ignore","pipe","pipe"]});
      child.stdout!.on("data",chunk=>{stdout+=chunk.toString();});child.stderr!.on("data",chunk=>{stderr+=chunk.toString();});
      await wait(()=>stdout.includes('"changed":true'));
      const graph=()=>JSON.parse(readFileSync(path.join(fx.records,PRIVATE_GRAPH_PATH),"utf8"));
      putPrivate(fx.product,"src/watch.ts","export const watched = 2;\n");await wait(()=>graph().stats.files===3 && stdout.includes('"files":3'));
      const quietHead=privateGit(fx.records,["rev-parse","HEAD"]),quietOutput=stdout;
      putPrivate(fx.records,"docs/rooms/note.md","# Changed private note\n");
      await new Promise(resolve=>setTimeout(resolve,750));
      expect(privateGit(fx.records,["rev-parse","HEAD"])).toBe(quietHead);expect(stdout).toBe(quietOutput);
      const binding=path.join(fx.product,".supertaskr/workspace.json"), original=readFileSync(binding);
      writeFileSync(binding,JSON.stringify({version:1,projectId:"external-python",productRoot:fx.product,recordsRoot:replacement}));
      await wait(()=>stderr.includes("graph-watch-context-changed"));
      putPrivate(fx.product,"src/late.ts","export const late = 3;\n");await new Promise(resolve=>setTimeout(resolve,750));
      expect(privateGit(fx.records,["rev-parse","HEAD"])).toBe(quietHead);expect(privateGit(replacement,["rev-parse","HEAD"])).toBe(otherHead);
      writeFileSync(binding,original);await wait(()=>graph().stats.files===4 && stdout.includes('"files":4'));
      expect(privateGit(fx.product,["rev-parse","HEAD"])).toBe(productHead);
      expect(existsSync(path.join(fx.product,PRIVATE_GRAPH_PATH))).toBe(false);
      expect(privateGit(replacement,["rev-parse","HEAD"])).toBe(otherHead);
      const beforePolicy=privateGit(fx.records,["rev-parse","HEAD"]);
      fx.settings.languages=["python"];putPrivate(fx.product,"supertaskr.yaml",JSON.stringify(fx.settings));commitPrivate(fx.product);
      putPrivate(fx.product,"changed.py","def changed():\n    return 1\n");
      await wait(()=>stderr.includes("graph-configuration-changed"));
      expect(privateGit(fx.records,["rev-parse","HEAD"])).toBe(beforePolicy);expect(graph().stats.files).toBe(4);
    }finally{
      if(child?.pid&&child.exitCode===null){
        const closed=new Promise<boolean>(resolve=>child!.once("close",()=>resolve(true)));
        let timer:ReturnType<typeof setTimeout>|undefined;
        process.kill(-child.pid,"SIGTERM");
        const ceased=await Promise.race([closed,new Promise<boolean>(resolve=>{timer=setTimeout(()=>resolve(false),5000);})]);
        clearTimeout(timer);
        if(!ceased){process.kill(-child.pid,"SIGKILL");await closed;throw Error("owned watcher required forced collection");}
      }
      fx.cleanup();
    }
  });
});
