/** Generated working-source graph publication. This is a distinct producer:
 * ordinary Markdown validation grants no graph or component-registry writes.
 * The existing operation store, reservation and exact-ref acceptance own all
 * private effects; the source scanner and its optional cache stay PRODUCT.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { constants, accessSync, existsSync, lstatSync, readFileSync, realpathSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveWorkspace } from "./workspace.mjs";
import { installedRecordAsset, loadInstalledRecordTool, requireInstalledRuntimeAssets, verifyInstalledRecordTool } from "./records-check.mjs";
import { loadProjectSettings, requireProjectSection } from "./project-settings.mjs";
import { captureOperationRepository, listAcceptedOperations, observedAcceptedOperation, readAcceptedOperation,
  replayAcceptedOperation, withAcceptedOperation } from "./durable-operation.mjs";
import { operationContent, operationDigest } from "./operation-record.mjs";
import { captureExactRecordPlan, prepareExactRecordTree, materializeExactRecordWrites,
  safeRecordWorkingPath, snapshotRecordFile, intendedRecordFile, assertExactRecordTransformations } from "./record-write.mjs";
import { releaseAcceptedRecordWriteLock, stopUnmaterializedRecordWrite } from "./record-write.mjs";

export const PRIVATE_GRAPH_PATH = "docs/architecture/graph.json";
export class PrivateGraphFinding extends Error {
  /** @param {string} code */
  constructor(code) { super(`${code}: source graph unavailable`); this.code = code; }
}
/** @param {string} code @returns {never} */
function refuse(code) { throw new PrivateGraphFinding(code); }
/** @param {any} a @param {any} b */
function same(a,b) { return operationContent(a) === operationContent(b); }
/** @param {any} value @param {string[]} keys */
function shape(value,keys) { return value && typeof value==="object" && !Array.isArray(value) && Object.keys(value).every(key=>keys.includes(key)); }
/** The generated producer has one finite output. Recovery must validate that
 * same contract before using any captured path or claiming a graph receipt.
 * @param {any} payload */
function graphPayload(payload) {
  if(![1,2].includes(payload?.version) || payload.kind!=="private-record-graph" || !Array.isArray(payload.writes) || payload.writes.length!==1 ||
      payload.writes[0].path!==PRIVATE_GRAPH_PATH || !["add","edit"].includes(payload.writes[0].operation) ||
      payload.writes[0].type!=="blob" || payload.writes[0].mode!=="100644" || typeof payload.writes[0].base64!=="string" ||
      !shape(payload.writes[0],["operation","path","type","mode","base64"]) ||
      !Array.isArray(payload.preimages) || payload.preimages.length!==1 || payload.preimages[0].path!==PRIVATE_GRAPH_PATH ||
      !/^sha256:[0-9a-f]{64}$/.test(payload.sourceDigest)) refuse("graph-operation-unavailable");
  const bytes=Buffer.from(payload.writes[0].base64,"base64");
  if(bytes.toString("base64")!==payload.writes[0].base64 || operationDigest(payload.writes[0].base64)!==payload.sourceDigest) refuse("graph-operation-unavailable");
  let graph;try{graph=JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(bytes));}catch{refuse("graph-operation-unavailable");}
  if(graph.schema!==1 || graph.root!=="." || !Array.isArray(graph.files) || !Array.isArray(graph.edges) ||
      graph.stats?.files!==graph.files.length || graph.stats?.edges!==graph.edges.length || !same(graph.stats,payload.stats)) refuse("graph-operation-unavailable");
  if(payload.version===2) {
    const config=payload.configuration;
    if(!shape(config,["version","productRevision","configDigest","languages","supportedLanguages","toolManifestDigest"]) ||
        config.version!==1 || config.productRevision!==payload.options?.productRevision ||
        !/^sha256:[0-9a-f]{64}$/.test(config.configDigest) || config.toolManifestDigest!==payload.tool?.manifestDigest ||
        !Array.isArray(config.languages) || !config.languages.length || !Array.isArray(config.supportedLanguages) ||
        config.languages.some((/** @type {any} */id)=>typeof id!=="string" || !config.supportedLanguages.includes(id)) ||
        new Set(config.languages).size!==config.languages.length) refuse("graph-operation-configuration-invalid");
  }
  return payload;
}
/** @param {string} root @param {string[]} args */
function git(root,args) {
  try { return execFileSync("git",["--no-replace-objects","-C",root,...args],{encoding:"utf8",stdio:["ignore","pipe","pipe"],
    env:{...process.env,GIT_NO_LAZY_FETCH:"1",GIT_OPTIONAL_LOCKS:"0"}}).replace(/\n$/,""); }
  catch { refuse("graph-history-unavailable"); }
}
/** The manifest and loaded code must describe the same installed tool.
 * @param {string|undefined} [manifestPath] */
export function installedIndexer(manifestPath) {
  const tool = loadInstalledRecordTool(manifestPath);
  requireInstalledRuntimeAssets(tool,["tools/e2e/scripts/records-graph.mjs","tools/e2e/scripts/index-command.mjs","tools/e2e/scripts/project-settings.mjs"]);
  const relative = `native/${process.platform}-${process.arch}/supertaskr-index${process.platform === "win32" ? ".exe" : ""}`;
  const file = installedRecordAsset(tool,relative);
  try {
    if (realpathSync(file) !== file || !lstatSync(file).isFile() || lstatSync(file).isSymbolicLink()) refuse("graph-tool-unavailable");
    accessSync(file,constants.X_OK);
  } catch { refuse("graph-tool-platform-unavailable"); }
  // loadInstalledRecordTool has checked all runtime hashes; require this exact
  // platform asset rather than accepting any executable beside the package.
  const manifestFile = manifestPath ?? fileURLToPath(new URL("../../../tool-manifest.json",import.meta.url));
  const manifest = JSON.parse(readFileSync(manifestFile,"utf8"));
  if (!manifest.runtime.files.some((/** @type {any} */ entry)=>entry.path===relative)) refuse("graph-tool-unavailable");
  return {tool,program:file,manifestPath:manifestFile};
}
/** Physical watch identity permits code/private commits to advance, but never
 * a different repository, branch, records association or directory incarnation.
 * @param {any} origin */
function producerOrigin(origin) { return {...origin,productRevision:null,recordsRevision:null,
  association:{...origin.association,productIdentity:{...origin.association.productIdentity,selectedCommit:null}}}; }
/** Ask the actual installed scanner, rather than maintaining another language
 * table in Node or accepting caller-provided support claims. @param {any} installation */
function languageRegistry(installation) {
  verifyInstalledRecordTool(installation.tool);
  let registry;
  try { registry=JSON.parse(execFileSync(installation.program,["--languages-json"],{encoding:"utf8",stdio:["ignore","pipe","pipe"],timeout:30000,maxBuffer:65536})); }
  catch { refuse("graph-language-registry-unavailable"); }
  if(!shape(registry,["version","languages"]) || registry.version!==1 || !Array.isArray(registry.languages) || !registry.languages.length ||
      registry.languages.some((/** @type {any} */ id)=>typeof id!=="string" || !/^[a-z][a-z0-9-]*$/.test(id)) ||
      new Set(registry.languages).size!==registry.languages.length) refuse("graph-language-registry-invalid");
  return registry.languages;
}
/** @param {any} installation @param {any} origin */
function graphConfiguration(installation,origin) {
  const loaded=loadProjectSettings({productRoot:origin.productRoot,productRevision:origin.productRevision,tool:installation.tool});
  if(loaded.status!=="ready") refuse(loaded.code);
  const section=requireProjectSection(loaded,"languages");
  if(section.status!=="configured") refuse("graph-languages-unconfigured");
  const supportedLanguages=languageRegistry(installation);
  if(section.value.some((/** @type {string} */ id)=>!supportedLanguages.includes(id))) refuse("graph-language-unsupported");
  return {version:1,productRevision:origin.productRevision,configDigest:loaded.provenance.configDigest,
    languages:supportedLanguages.filter((/** @type {string} */ id)=>section.value.includes(id)),supportedLanguages,
    toolManifestDigest:installation.tool.manifestDigest};
}
/** Frozen configuration identity excludes only the changing source revision.
 * @param {any} configuration */
function policyIdentity(configuration) { return {...configuration,productRevision:null}; }
/** Backend constructor: requests select no languages, policy or executable.
 * A watch activation retains these exact settings and physical origins.
 * @param {{productRoot:string,manifestPath?:string}} options */
export function createGraphProducer(options) {
  if(!shape(options,["productRoot","manifestPath"]) || typeof options.productRoot!=="string") refuse("graph-producer-request");
  const installation=installedIndexer(options.manifestPath), original=captureGraphContext(options.productRoot);
  const selected=graphConfiguration(installation,original), identity=producerOrigin(original), policy=policyIdentity(selected);
  function capture() {
    const origin=captureGraphContext(original.productRoot);
    if(!same(producerOrigin(origin),identity)) refuse("graph-watch-context-changed");
    const configuration=graphConfiguration(installation,origin);
    if(!same(policyIdentity(configuration),policy)) refuse("graph-configuration-changed");
    return {origin,configuration};
  }
  /** @param {any} value */
  function request(value) {
    if(!shape(value,["operationId","cacheDir","expectedOrigin"]) ||
        value.operationId!==undefined && !/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(value.operationId) ||
        value.cacheDir!==undefined && typeof value.cacheDir!=="string") refuse("graph-request");
    return {...value,productRoot:original.productRoot,manifestPath:installation.manifestPath};
  }
  return Object.freeze({
    context() { return structuredClone(capture().origin); },
    /** @param {any} value @param {any} [diagnostics] */
    index(value={},diagnostics={}) {
      if(!shape(diagnostics,["onBoundary"]) || diagnostics.onBoundary!==undefined && typeof diagnostics.onBoundary!=="function") refuse("graph-request");
      const selectedRequest=request(value);const current=capture();return indexGraph(selectedRequest,installation,current,diagnostics);
    },
    /** @param {any} value */
    update(value={}) { const selectedRequest=request(value);const current=capture();return updateGraph(selectedRequest,installation,current); },
    /** @param {{onBoundary?:(boundary:string,context:any)=>void}} [diagnostics] */
    check(diagnostics={}) {
      if(!shape(diagnostics,["onBoundary"]) || diagnostics.onBoundary!==undefined && typeof diagnostics.onBoundary!=="function") refuse("graph-request");
      const current=capture();
      const generated=scan(installation,current.origin,current.configuration);
      if(!same(capture().origin,current.origin)) refuse("graph-context-changed");
      if(!committedGraphEquals(current.origin,generated.bytes)) {
        process.stderr.write("graph-committed-stale: selected committed private graph differs from configured source\n");
        return 1;
      }
      diagnostics.onBoundary?.("graph-check-captured",{sourceDigest:generated.digest,productRevision:current.origin.productRevision,recordsRevision:current.origin.recordsRevision});
      const result=spawnSync(installation.program,["index","--check","--root",original.productRoot,"--records-root",current.origin.records.root,"--languages",current.configuration.languages.join(",")],{stdio:"inherit"});
      const after=capture();
      if(!same(after.origin,current.origin)) refuse("graph-context-changed");
      const final=scan(installation,after.origin,after.configuration);
      if(final.digest!==generated.digest)refuse("graph-source-changed");
      const stored=snapshotRecordFile(after.origin.graphPath);
      if(!committedGraphEquals(after.origin,final.bytes) || !stored.present || stored.mode!=="100644" || stored.base64!==final.bytes.toString("base64")) {
        process.stderr.write("graph-stored-stale: working and committed private graph must match the same configured source snapshot\n");
        return 1;
      }
      if(!same(capture().origin,current.origin))refuse("graph-context-changed");
      return result.status??3;
    },
  });
}
/** Capture the actual association and filesystem incarnations, not just equal
 * content at another checkout. It grants no reservation or mutation right.
 * @param {string} productRoot */
export function captureGraphContext(productRoot) {
  productRoot=realpathSync(productRoot);
  const productRevision=git(productRoot,["rev-parse","HEAD"]);
  const workspace=resolveWorkspace({productRoot,mode:"development",commit:productRevision});
  if (workspace.layout!=="split") refuse("graph-independent-records-required");
  const recordsRevision=git(workspace.recordsRoot,["rev-parse","HEAD"]);
  const product=captureOperationRepository(productRoot,productRevision,{forEffect:false});
  const records=captureOperationRepository(workspace.recordsRoot,recordsRevision,{forEffect:false});
  if (product.commonDir===records.commonDir) refuse("graph-independent-records-required");
  const docs=safeRecordWorkingPath(records.root,"docs/architecture/graph.json");
  const docsRoot=path.join(records.root,"docs");
  const metadata=lstatSync(docsRoot);
  if (!metadata.isDirectory() || metadata.isSymbolicLink()) refuse("graph-records-unavailable");
  const identity=statSync(docsRoot,{bigint:true});
  const targetRef=git(records.root,["symbolic-ref","-q","HEAD"]);
  return {productRoot,productRevision,recordsRevision,targetRef,product,records,
    association:workspace.association,docs:{path:docsRoot,device:String(identity.dev),inode:String(identity.ino)},graphPath:docs};
}
/** @param {any} expected @param {any} origin */
function selectedOrigin(expected,origin) {
  if(expected!==undefined && !same(expected,{recordsRoot:origin.records.root,
    rootIncarnation:`${origin.records.identities[0]?.device}:${origin.records.identities[0]?.inode}`,
    docsIncarnation:`${origin.docs.device}:${origin.docs.inode}`,associationId:origin.association.projectId??null,
    productRevision:origin.productRevision})) refuse("graph-selection-changed");
}
/** Exact committed equality is needed for a durable no-op; equal uncommitted
 * working bytes still owe publication through the normal owned producer.
 * @param {any} origin @param {Buffer} bytes */
function committedGraphEquals(origin,bytes) {
  const entry=git(origin.records.root,["ls-tree",origin.recordsRevision,"--",PRIVATE_GRAPH_PATH]);
  const match=/^100644 blob ([0-9a-f]+)\t/.exec(entry);
  if(!match)return false;
  try{return execFileSync("git",["--no-replace-objects","-C",origin.records.root,"cat-file","blob",/** @type {string} */(match[1])],
    {stdio:["ignore","pipe","pipe"],maxBuffer:32*1024*1024,env:{...process.env,GIT_NO_LAZY_FETCH:"1",GIT_OPTIONAL_LOCKS:"0"}}).equals(bytes);}catch{refuse("graph-history-unavailable");}
}
/** Retire only a proven accepted original operation's dead lock. In particular,
 * a no-op update must not leave a completed crash blocking ordinary Git.
 * @param {any} origin @returns {string|undefined} */
function cleanupSelectedLock(origin) {
  const file=path.join(origin.records.gitDir,"index.lock");
  let metadata;
  try{metadata=lstatSync(file);}catch(error){if(/** @type {NodeJS.ErrnoException} */(error).code==="ENOENT")return;return "graph-index-lock-unavailable";}
  if(!metadata.isFile()||metadata.isSymbolicLink()||metadata.size>4096)return "graph-index-lock-unavailable";
  try{
    const held=JSON.parse(readFileSync(file,"utf8"));
    if(typeof held.operationId!=="string")return "graph-index-lock-unavailable";
    const rec=readAcceptedOperation(origin.productRoot,held.operationId);
    if(rec?.resource!==origin.records.root || `${rec.operation.request.payload?.index?.path}.lock`!==file)return "graph-index-lock-unavailable";
    const result=releaseAcceptedRecordWriteLock(origin.productRoot,held.operationId);
    return result.status==="unavailable" && "code" in result?result.code:undefined;
  }catch{return "graph-index-lock-unavailable";}
}
/** Pure native graph output. No graph file or private parent is created.
 * @param {{program:string}} installation @param {any} origin @param {any} configuration @param {string|undefined} [cacheDir] */
function scan(installation,origin,configuration,cacheDir) {
  let bytes;
  try { bytes=execFileSync(installation.program,["index","--emit-json","--root",origin.productRoot,
    "--languages",configuration.languages.join(","),
    ...(cacheDir===undefined?[]:["--cache-dir",cacheDir])],{stdio:["ignore","pipe","pipe"],maxBuffer:32*1024*1024,timeout:30000}); }
  catch { refuse("graph-scan-failed"); }
  const graph=JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(bytes));
  if (graph.schema!==1 || graph.root!=="." || !Array.isArray(graph.files) || !Array.isArray(graph.edges) ||
      graph.stats?.files!==graph.files.length || graph.stats?.edges!==graph.edges.length) refuse("graph-output-unqualified");
  if(!graph.files.length) refuse("graph-selected-source-empty");
  if(graph.files.some((/** @type {any} */ file)=>!configuration.languages.includes(file.lang)) ||
      !same(graph.languages,[...new Set(graph.files.map((/** @type {any} */file)=>file.lang))].sort())) refuse("graph-output-language-mismatch");
  return {bytes,graph,digest:operationDigest(bytes.toString("base64"))};
}
/** Cache selection is native/CLI data, never private mutation permission. A
 * cache below RECORDS, including through an existing symlink, is refused.
 * @param {string|undefined} value @param {any} origin */
function cachePath(value,origin) {
  if (value===undefined) return undefined;
  if (!path.isAbsolute(value)) refuse("graph-cache-location");
  let ancestor=value;
  while (!existsSync(ancestor)) { const parent=path.dirname(ancestor); if(parent===ancestor) refuse("graph-cache-location"); ancestor=parent; }
  const physical=path.resolve(realpathSync(ancestor),path.relative(ancestor,value));
  if (physical===origin.records.root || physical.startsWith(`${origin.records.root}${path.sep}`)) refuse("graph-cache-private-location");
  return physical;
}
/** @param {any} result @param {any} payload */
function receipt(result,payload) { return {...result,status:"indexed",changed:true,files:payload.stats.files,symbols:payload.stats.symbols,
  edges:payload.stats.edges,truncated:payload.truncated,graphBytes:Buffer.from(payload.writes[0].base64,"base64").length,
  provenance:{kind:"working-tree",productRevision:payload.options.productRevision,sourceDigest:payload.sourceDigest,
    ...(payload.configuration===undefined?{}:{configuration:payload.configuration}),
    recordsRevision:result.commit,recordsRoot:payload.origin.records.root}}; }

/** Only the installed backend generates accepted bytes. The request selects no
 * graph payload, output path, records root, policy or arbitrary executable.
 * @param {{productRoot:string,operationId?:string,cacheDir?:string,manifestPath?:string,expectedOrigin?:any}} request
 * @param {{onBoundary?:(boundary:string,context:any)=>void}} [diagnostics] */
export function indexPrivateGraph(request,diagnostics={}) {
  if (!shape(request,["productRoot","operationId","cacheDir","manifestPath","expectedOrigin"]) || typeof request.productRoot!=="string" ||
      request.operationId!==undefined && !/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(request.operationId) ||
      request.cacheDir!==undefined && typeof request.cacheDir!=="string" ||
      !shape(diagnostics,["onBoundary"])) refuse("graph-request");
  const productRoot=realpathSync(request.productRoot), operationId=request.operationId??`graph-${randomUUID()}`;
  if (readAcceptedOperation(productRoot,operationId)!==null) return replayPrivateGraph({productRoot,operationId,
    ...(request.manifestPath===undefined?{}:{manifestPath:request.manifestPath})},diagnostics);
  return createGraphProducer({productRoot,...(request.manifestPath===undefined?{}:{manifestPath:request.manifestPath})}).index({operationId,
    ...(request.cacheDir===undefined?{}:{cacheDir:request.cacheDir}),...(request.expectedOrigin===undefined?{}:{expectedOrigin:request.expectedOrigin})},diagnostics);
}
/** @param {any} request @param {any} installation @param {any} current @param {any} diagnostics */
function indexGraph(request,installation,current,diagnostics) {
  const {origin,configuration}=current, productRoot=origin.productRoot, operationId=request.operationId??`graph-${randomUUID()}`;
  if(readAcceptedOperation(productRoot,operationId)!==null) return replayPrivateGraph({productRoot,operationId,...(request.manifestPath===undefined?{}:{manifestPath:request.manifestPath})},diagnostics);
  selectedOrigin(request.expectedOrigin,origin);
  const started=Date.now(), generated=scan(installation,origin,configuration,cachePath(request.cacheDir,origin));
  if (!same(captureGraphContext(productRoot),origin)) refuse("graph-context-changed");
  const previous=snapshotRecordFile(origin.graphPath);
  if (previous.present && previous.mode==="100644" && previous.base64===generated.bytes.toString("base64") && committedGraphEquals(origin,generated.bytes)) return {status:"indexed",changed:false,
    operationId:null,files:generated.graph.stats.files,symbols:generated.graph.stats.symbols,edges:generated.graph.stats.edges,
    truncated:generated.graph.stats.truncated_symbols===true,graphBytes:generated.bytes.length,durationMs:Date.now()-started,
    provenance:{kind:"working-tree",productRevision:origin.productRevision,sourceDigest:generated.digest,
      configuration,
      recordsRevision:origin.recordsRevision,recordsRoot:origin.records.root}};
  captureOperationRepository(origin.records.root,origin.recordsRevision);
  const writes=[{operation:previous.present?"edit":"add",path:PRIVATE_GRAPH_PATH,type:"blob",mode:"100644",base64:generated.bytes.toString("base64")}];
  const transformations=assertExactRecordTransformations(origin.records.root,[PRIVATE_GRAPH_PATH]);
  const {tree,working}=captureExactRecordPlan(origin.records.root,origin.recordsRevision,writes);
  const payload={version:2,kind:"private-record-graph",options:{productRoot,productRevision:origin.productRevision,recordsRevision:origin.recordsRevision},configuration,
    origin,tool:installation.tool,writes,...working,transformations,sourceDigest:generated.digest,stats:generated.graph.stats,
    productOrigin:origin.product,recordOrigin:{root:origin.records.root,gitDirectory:origin.records.gitDir,commonDirectory:origin.records.commonDir,
      device:origin.records.identities[0]?.device,inode:origin.records.identities[0]?.inode,docsDirectory:origin.docs.path,
      docsDevice:origin.docs.device,docsInode:origin.docs.inode},
    truncated:generated.graph.stats.truncated_symbols===true};
  return {...executeGraph(operationId,tree,payload,installation,diagnostics),durationMs:Date.now()-started};
}
/** @param {string} operationId @param {string} tree @param {any} payload @param {any} installation @param {any} diagnostics */
function executeGraph(operationId,tree,payload,installation,diagnostics) {
  /** @type {undefined|(()=>void)} */ let release;
  const authorize=(/** @type {any} */context)=>{
    verifyInstalledRecordTool(installation.tool);
    if (!same(installation.tool,payload.tool) || !same(captureGraphContext(payload.options.productRoot),payload.origin)) refuse("graph-context-changed");
    if(!same(graphConfiguration(installation,payload.origin),payload.configuration)) refuse("graph-configuration-changed");
    if (scan(installation,payload.origin,payload.configuration).digest!==payload.sourceDigest) refuse("graph-source-changed");
    if (!same(assertExactRecordTransformations(payload.origin.records.root,[PRIVATE_GRAPH_PATH]),payload.transformations)) refuse("graph-attributes-changed");
    const actual=snapshotRecordFile(safeRecordWorkingPath(payload.origin.records.root,PRIVATE_GRAPH_PATH));
    const original=payload.preimages[0].work;
    if (!same(actual,original) && !((context.resumingPreparation || context.phase==="ref") && same(actual,intendedRecordFile(payload.writes[0])))) refuse("graph-file-changed");
    return true;
  };
  try {
    const result=withAcceptedOperation(payload.options.productRoot,{operationId,kind:"records-save",repositoryRoot:payload.origin.records.root,
      targetRef:payload.origin.targetRef,expectedRevision:payload.options.recordsRevision,acceptedTree:tree,payloadDigest:operationDigest(payload),payload,
      message:"Refresh private source graph"},{...diagnostics,authorize,prepareTree(context){prepareExactRecordTree(payload,context,()=>authorize(context));}},
      context=>{release=materializeExactRecordWrites(payload.options.productRoot,payload,context,diagnostics.onBoundary,authorize);});
    return receipt(result,payload);
  } finally { release?.(); }
}
/** An accepted original graph is historical even if the association has moved.
 * Pending work rechecks its captured origin and source before any new effect.
 * @param {{productRoot:string,operationId:string,manifestPath?:string}} request @param {any} [diagnostics] */
export function replayPrivateGraph(request,diagnostics={}) {
  const productRoot=realpathSync(request.productRoot), rec=readAcceptedOperation(productRoot,request.operationId), payload=rec?.operation.request.payload;
  if (payload?.kind!=="private-record-graph" || payload.options.productRoot!==productRoot) refuse("graph-operation-unavailable");
  graphPayload(payload);
  if (rec.state==="stopped") refuse("graph-operation-stopped");
  if (observedAcceptedOperation(productRoot,request.operationId)!==null) {
    const result=replayAcceptedOperation(productRoot,request.operationId,{authorize(){return false;}});
    const cleanup=releaseAcceptedRecordWriteLock(productRoot,request.operationId);
    return {...receipt(result,payload),...(cleanup.status==="unavailable" && "code" in cleanup?{cleanupWarning:cleanup.code}:{})};
  }
  if(payload.version!==2) refuse("graph-operation-configuration-required");
  const installation=installedIndexer(request.manifestPath);
  return executeGraph(request.operationId,rec.operation.request.acceptedTree,payload,installation,diagnostics);
}

/** Recovery metadata comes from the original same-store request. It never
 * supplies a new records root or changes the selected workspace association.
 * @param {{productRoot:string}} request */
export function discoverPrivateGraphs(request) {
  const productRoot=realpathSync(request.productRoot);
  return listAcceptedOperations(productRoot).filter(rec=>rec.operation.request.payload?.kind==="private-record-graph").map(rec=>{
    const payload=rec.operation.request.payload;
    graphPayload(payload);
    if(payload.options?.productRoot!==productRoot || payload.writes?.length!==1 || payload.writes[0].path!==PRIVATE_GRAPH_PATH) refuse("graph-operation-unavailable");
    const accepted=observedAcceptedOperation(productRoot,rec.operation.id);
    return {operationId:rec.operation.id,state:accepted!==null?"accepted":["failed","stopped"].includes(rec.state)?rec.state:"pending",
      productRoot,recordsRoot:payload.origin.records.root,productRevision:payload.options.productRevision,
      recordOrigin:payload.recordOrigin,productOrigin:payload.productOrigin,needsCompletion:!['finished','failed','stopped'].includes(rec.state),
      recordsRevision:payload.options.recordsRevision,sourceDigest:payload.sourceDigest,version:payload.version,
      configuration:payload.configuration??null,...(accepted===null?{}:{receipt:accepted})};
  });
}

/** A normal update first reconciles the original same-home operation after a
 * lost response. A changed source cut may start a new capture only after the
 * strict core proves that the old request never began materialization.
 * @param {{productRoot:string,operationId?:string,cacheDir?:string,manifestPath?:string,expectedOrigin?:any}} request */
export function updatePrivateGraph(request) {
  if(!shape(request,["productRoot","operationId","cacheDir","manifestPath","expectedOrigin"]) || typeof request.productRoot!=="string") refuse("graph-request");
  const origin=captureGraphContext(request.productRoot);
  selectedOrigin(request.expectedOrigin,origin);
  const original=selectedRecoveries(origin);
  if(original[0]?.state==="accepted") return replayPrivateGraph({productRoot:origin.productRoot,operationId:original[0].operationId,
    ...(request.manifestPath===undefined?{}:{manifestPath:request.manifestPath})});
  if(original[0] && original[0].version!==2) refuse("graph-operation-configuration-required");
  return createGraphProducer({productRoot:origin.productRoot,...(request.manifestPath===undefined?{}:{manifestPath:request.manifestPath})}).update({
    ...(request.operationId===undefined?{}:{operationId:request.operationId}),...(request.cacheDir===undefined?{}:{cacheDir:request.cacheDir}),
    ...(request.expectedOrigin===undefined?{}:{expectedOrigin:request.expectedOrigin})});
}
/** @param {any} origin */
function selectedRecoveries(origin) {
  const original=discoverPrivateGraphs({productRoot:origin.productRoot}).filter(row=>row.needsCompletion &&
    same(row.productOrigin?.identities,origin.product.identities) &&
    row.recordsRoot===origin.records.root && row.recordOrigin.device===origin.records.identities[0]?.device &&
    row.recordOrigin.inode===origin.records.identities[0]?.inode && row.recordOrigin.docsDevice===origin.docs.device && row.recordOrigin.docsInode===origin.docs.inode);
  if(original.length>1) refuse("graph-recovery-selection-required");
  return original;
}
/** @param {any} request @param {any} installation @param {any} current */
function updateGraph(request,installation,current) {
  const {origin,configuration}=current;
  selectedOrigin(request.expectedOrigin,origin);
  const original=selectedRecoveries(origin);
  if(original[0] && original[0].state!=="accepted" && original[0].version!==2) refuse("graph-operation-configuration-required");
  const cleanupWarning=cleanupSelectedLock(origin);
  if(original[0]) {
    const prior=original[0], operationId=prior.operationId;
    // Decide before adopting a dead owner's operation. A failed replay makes
    // this process the current owner; it must then cease before disposition.
    const changed=prior.state!=="accepted" && (prior.productRevision!==origin.productRevision ||
      prior.recordsRevision!==origin.recordsRevision || !same(prior.configuration,configuration) || scan(installation,origin,configuration).digest!==prior.sourceDigest);
    if(changed) {
      stopUnmaterializedRecordWrite(origin.productRoot,operationId,{payloadKind:"private-record-graph"});
    } else return replayPrivateGraph({productRoot:origin.productRoot,operationId,...(request.manifestPath===undefined?{}:{manifestPath:request.manifestPath})});
  }
  return {...indexGraph(request,installation,current,{}),...(cleanupWarning===undefined?{}:{cleanupWarning})};
}
