/** Installed source-index front. The tool owns its native scanner; selected
 * PRODUCT owns source and selected RECORDS owns graph and registry. */
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFileSync, realpathSync, watch } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { captureGraphContext, createGraphProducer, discoverPrivateGraphs, installedIndexer, replayPrivateGraph, updatePrivateGraph } from "./records-graph.mjs";
import { readAcceptedOperation } from "./durable-operation.mjs";

const HELP="supertaskr index [--check | --write | --watch | --recover | --resume ID] --root PRODUCT\n"+
  "supertaskr arch [drift | cycles | blast PATH|SLUG...] --root PRODUCT\n"+
  "Graph and registry use the verified private-record home. Graph provenance is working source, not a claim about committed source.\n";
/** @param {any} error */
function code(error) { return typeof error?.code==="string"?error.code:"graph-unavailable"; }
/** @param {any} error */
function errorText(error) { return code(error)+(error?.operationId?` operation=${error.operationId}; inspect with supertaskr index --recover`:"")+"\n"; }
/** @param {string[]} args */
function parse(args) {
  let root=process.cwd(), mode="check", resume, cacheDir;
  const command=args[0]; const rest=[];
  if(!["index","arch"].includes(command??"")) throw Error("graph-command");
  for(let at=1;at<args.length;at++) {
    const arg=args[at];
    if(arg==="--root" || arg==="--cache-dir" || arg==="--resume") {
      const value=args[++at]; if(!value || value.startsWith("--")) throw Error("graph-usage");
      if(arg==="--root") root=path.resolve(value); else if(arg==="--cache-dir") cacheDir=path.resolve(value); else {resume=value;mode="resume";}
    } else if(command==="index" && ["--check","--write","--watch","--recover","--stdio"].includes(arg??"")) {
      if(mode!=="check") throw Error("graph-usage"); mode=arg?.slice(2)??"check";
    } else if(command==="arch") {
      if(arg?.startsWith("--root=") || arg==="--records-root" || arg?.startsWith("--records-root=") || arg==="--cache-dir") throw Error("graph-usage");
      rest.push(/** @type {string} */(arg));
    } else throw Error("graph-usage");
  }
  if(command==="arch" && (mode!=="check" || resume || cacheDir)) throw Error("graph-usage");
  return {root,command,mode,resume,cacheDir,rest};
}
/** @param {any} options */
function publish(options) {
  const operationId=`graph-${randomUUID()}`;
  try { return updatePrivateGraph({productRoot:options.root,operationId,...(options.cacheDir?{cacheDir:options.cacheDir}:{})}); }
  catch(error) { Object.assign(/** @type {object} */(error),{operationId}); throw error; }
}
/** Fixed small native-app protocol: the backend supplied PRODUCT is the sole
 * routing input. No graph bytes, records paths or program cross this boundary.
 * @param {any} input */
export function executeIndexProtocol(input) {
  const keys=["version","requestId","productRoot","operation","operationId","cacheDir","expectedOrigin"];
  if(!input || Object.keys(input).some(key=>!keys.includes(key)) || input.version!==1 ||
      typeof input.requestId!=="string" || typeof input.productRoot!=="string" ||
      !["index","replay","discover"].includes(input.operation)) throw Error("graph-protocol-request");
  try {
    const request={productRoot:input.productRoot};
    const result=input.operation==="discover"?{recoveries:discoverPrivateGraphs(request)}:input.operation==="replay"
      ?replayPrivateGraph({...request,operationId:input.operationId}):updatePrivateGraph({...request,operationId:input.operationId,
        ...(input.expectedOrigin===undefined?{}:{expectedOrigin:input.expectedOrigin}),...(input.cacheDir?{cacheDir:input.cacheDir}:{})});
    return {version:1,requestId:input.requestId,ok:true,result};
  } catch(error) {
    let state="refused";
    try{const rec=typeof input.operationId==="string"?readAcceptedOperation(input.productRoot,input.operationId):null;if(rec!==null&&!["failed","stopped"].includes(rec.state))state="unknown";}catch{state="unknown";}
    return {version:1,requestId:input.requestId,ok:false,error:{code:code(error),message:"Source graph operation could not be completed.",state,operationId:input.operationId??null}};
  }
}
/** @param {string[]} args @returns {number} */
export function indexMain(args) {
  if(args.includes("--help")) {process.stdout.write(HELP);return 0;}
  let options;
  try {options=parse(args);} catch {process.stderr.write(HELP);return 2;}
  try {
    if(options.mode==="stdio") {
      const bytes=readFileSync(0); if(bytes.length>65536) throw Error("graph-protocol-limit");
      const reply=executeIndexProtocol(JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(bytes)));
      process.stdout.write(JSON.stringify(reply)+"\n"); return reply.ok?0:3;
    }
    if(options.mode==="recover") {process.stdout.write(JSON.stringify(discoverPrivateGraphs({productRoot:options.root}),null,2)+"\n");return 0;}
    if(options.mode==="resume") {process.stdout.write(JSON.stringify(replayPrivateGraph({productRoot:options.root,operationId:/** @type {string} */(options.resume)}))+"\n");return 0;}
    if(options.mode==="write") {process.stdout.write(JSON.stringify(publish(options))+"\n");return 0;}
    if(options.mode==="watch") {
      const producer=createGraphProducer({productRoot:options.root}),origin=producer.context();
      /** @type {ReturnType<typeof setTimeout>|undefined} */ let timer;
      let lastError="";
      const report=(/** @type {any} */ error)=>{const message=errorText(error);if(message!==lastError)process.stderr.write(message);lastError=message;};
      const checkOrigin=()=>{producer.context();};
      const refresh=()=>{
        try {
          checkOrigin();lastError="";
          const operationId=`graph-${randomUUID()}`;
          try {process.stdout.write(JSON.stringify(producer.update({operationId,...(options.cacheDir?{cacheDir:options.cacheDir}:{})}))+"\n");}
          catch(error) {Object.assign(/** @type {object} */(error),{operationId});throw error;}
        } catch(error) {report(error);}
      };
      const observer=watch(origin.productRoot,{recursive:true},(_event,file)=>{
        const relative=file?.toString()??"";
        if(relative.replaceAll("\\","/")===".supertaskr/workspace.json") {refresh();return;}
        if(relative.split(/[\\/]/).some(part=>[".git","node_modules",".supertaskr"].includes(part))) return;
        if(!/(?:\.(?:ts|tsx|mts|cts|js|jsx|rs|py)$|(?:^|\/)(?:supertaskr\.yaml|package\.json|tsconfig\.json|Cargo\.toml|\.gitignore|\.supertaskrignore)$)/.test(relative) && path.extname(relative)!=="") return;
        clearTimeout(timer);timer=setTimeout(refresh,250);
      });
      // Association and namespace watches only check context. An ordinary
      // private note edit never starts a PRODUCT scan or graph publication.
      const association=watch(origin.records.root,(_event,file)=>{
        if(file?.toString()!=="workspace-association.json")return;
        try{checkOrigin();}catch(error){report(error);}
      });
      const parent=watch(path.dirname(origin.records.root),(_event,file)=>{
        if(file?.toString()!==path.basename(origin.records.root))return;
        try{checkOrigin();}catch(error){report(error);}
      });
      for(const watcher of [observer,association,parent])watcher.on("error",()=>report({code:"graph-watch-unavailable"}));
      const stop=()=>{clearTimeout(timer);observer.close();association.close();parent.close();};
      process.once("SIGTERM",stop);process.once("SIGINT",stop);refresh();return 0;
    }
    if(options.command==="index") return createGraphProducer({productRoot:options.root}).check();
    const origin=captureGraphContext(options.root), installation=installedIndexer();
    const argv=["arch",...options.rest];
    const result=spawnSync(installation.program,[...argv,"--root",origin.productRoot,"--records-root",origin.records.root],{stdio:"inherit"});
    return result.status??3;
  } catch(error) {
    process.stderr.write(errorText(error));return 3;
  }
}
let direct=false;
try{direct=!!process.argv[1]&&realpathSync(process.argv[1])===realpathSync(fileURLToPath(import.meta.url));}catch{/* An imported module is inert when the host entry is unavailable. */}
if(direct) process.exitCode=indexMain(process.argv.slice(2));
