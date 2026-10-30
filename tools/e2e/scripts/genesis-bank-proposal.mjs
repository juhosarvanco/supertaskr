/** Pure finite RECORDS bank capture. File observations come from the trusted
 * producer's bounded physical reader; this module grants no write authority.
 */
import {createHash} from "node:crypto";
import {parseDocument} from "yaml";
import {captureGenesisAnswerReferences} from "./genesis-proposal.mjs";
import {operationContent,operationDigest} from "./operation-record.mjs";
export const GENESIS_BANK_PROPOSAL="docs/plans/genesis-bank-proposal.json";
export const GENESIS_BANK_PROPOSAL_LIMIT=256*1024;
export const GENESIS_BANK_CAPTURE_LIMIT=4*1024*1024;
export class GenesisBankFinding extends Error {
 /** @param {string} code */
 constructor(code){super(`${code}: project bank is unavailable`);this.code=code;}
}
/** @param {string} code @returns {never} */
function refuse(code){throw new GenesisBankFinding(code);}
/** @param {any} v @param {string[]} fields */
function shape(v,fields){return v&&typeof v==="object"&&!Array.isArray(v)&&Object.keys(v).sort().join("\0")===[...fields].sort().join("\0");}
/** @param {any} v @returns {any} */
function freeze(v){if(v&&typeof v==="object"){Object.values(v).forEach(freeze);Object.freeze(v);}return v;}
/** @param {Uint8Array} bytes */
function hash(bytes){return createHash("sha256").update(bytes).digest("hex");}
/** @param {any} value */
function hex(value){return typeof value==="string"&&/^[0-9a-f]{64}$/.test(value);}
/** @param {any} value */
function id(value){return typeof value==="string"&&/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(value);}
/** @param {Uint8Array} bytes */
function text(bytes){try{return new TextDecoder("utf-8",{fatal:true,ignoreBOM:true}).decode(bytes);}catch{refuse("genesis-bank-utf8");}}
/** @param {string} source */
function json(source){try{const value=JSON.parse(source);if(parseDocument(source,{uniqueKeys:true}).errors.length)refuse("genesis-bank-json");return value;}catch{refuse("genesis-bank-json");}}
/** Paths alone are never lifecycle authority. The complete constructor must
 * also prove original setup ownership and new-file conditions at actual cuts.
 * @param {number} stage @param {string} file */
export function genesisBankRecordPath(stage,file){
 if(file==="docs/STATE.md")return Number.isInteger(stage)&&stage>=0&&stage<=8;
 if([1,2,3,4,6].includes(stage))return file==="docs/NORTH_STAR.md";
 if(stage===5){
  if(file==="docs/CONVENTIONS.md"||file==="docs/decisions/001-stack.md")return true;
  const match=/^docs\/decisions\/([0-9]{3,9})-[a-z0-9][a-z0-9-]*\.md$/.exec(file);
  return match!==null&&Number(match[1])>1&&String(Number(match[1])).padStart(3,"0")===match[1];
 }
 if(stage===7)return file==="docs/ROADMAP.md";
 if(stage===8)return ["docs/ARCHITECTURE.md","docs/ROADMAP.md"].includes(file)||/^docs\/tasks\/T-[0-9]{3,9}-[a-z0-9][a-z0-9-]*\.md$/.test(file);
 return false;
}
const EMPTY_LIFECYCLE_PLACEHOLDERS=new Set([
 "<!-- empty -->","<!-- No entries yet. -->","<!-- Appended by the executor. -->",
 "<!-- Appended by the verifier. -->","<!-- Appended after implementation. -->",
]);
/** Raw legacy verdict readers also see headings in fences/comments. New
 * planned cards therefore cannot carry a populated reserved section in either
 * active Markdown or an inert-looking example. Only literal empty placeholders
 * are supported here, not a heuristic classification of claimed evidence.
 * @param {string} body */
function authorBody(body){
 let depth=0;
 /** @type {string[]} */
 let lines=[];
 const flush=()=>{if(depth&&lines.some(line=>line.trim()!==""&&!EMPTY_LIFECYCLE_PLACEHOLDERS.has(line.trim())))refuse("genesis-bank-task-lifecycle-body");lines=[];};
 for(const line of body.split(/\r?\n/)){
  const heading=/^ {0,3}(#{1,6})[ \t]+(.+?)(?:[ \t]+#+)?[ \t]*$/.exec(line);
  if(heading&&(!depth||(heading[1]??"").length<=depth)){
   flush();const name=(heading[2]??"").replace(/[ \t]+/g," ").trim();
   depth=/^(?:Implementation notes|Verdicts|History|Reports|Approval history|Archived grant history|Repair ledger|(?:Executor |Build |Post-build )?(?:notes|reasoning|reports?))\b/i.test(name)?(heading[1]??"").length:0;
  }else if(depth)lines.push(line);
 }
 flush();
}
/** New task authoring retains author fields only. Dispatch/completion and
 * review/verdict stamps are never accepted as initial-genesis output.
 * @param {string} file @param {string} source */
function plannedTask(file,source){
 if(!file.startsWith("docs/tasks/"))return;
 const front=/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(source);if(!front)refuse("genesis-bank-task-planned");
 const doc=parseDocument(/** @type {string} */ (front[1]),{uniqueKeys:true});if(doc.errors.length)refuse("genesis-bank-task-planned");
 const fields=doc.toJS(),match=/^docs\/tasks\/(T-([0-9]{3,9}))-/.exec(file);
 const taskId=match?.[1]??"",number=match?.[2]??"";
 const allowed=["id","title","feature","milestone","priority","size","status","blocked_by","touches","suggested_by","builder","verifier"];
 const stamps=["tier","built_by","verified_by","review","wake"];
 if(!fields||Array.isArray(fields)||typeof fields!=="object"||Object.keys(fields).some(key=>!allowed.includes(key)&&!(stamps.includes(key)&&(fields[key]===null||fields[key]==="")))||
    fields.status!=="planned"||fields.id!==taskId||Number(number)<1||String(Number(number)).padStart(3,"0")!==number)refuse("genesis-bank-task-planned");
 authorBody(source.slice(front[0].length));
}
/** Validate the fixed proposal before a producer reads any listed path. This
 * is detached finite data only; no proposed path can become a root selector.
 * @param {{bytes:Uint8Array,context:any}} input */
export function parseGenesisBankProposal(input){
 if(!shape(input,["bytes","context"])||!(input.bytes instanceof Uint8Array)||input.bytes.byteLength>GENESIS_BANK_PROPOSAL_LIMIT)refuse("genesis-bank-proposal-size");
 const proposal=json(text(input.bytes)),context=input.context;
 if(!shape(proposal,["version","setupId","sessionId","originDigest","proposalId","stage","expectedProductRevision","expectedRecordsRevision","answerRefs","records"])||
    proposal.version!==1||!id(proposal.proposalId)||!Number.isInteger(proposal.stage)||proposal.stage<0||proposal.stage>8||
    !context||proposal.setupId!==context.setupId||proposal.sessionId!==context.sessionId||proposal.originDigest!==context.originDigest||
    proposal.expectedProductRevision!==context.productRevision||proposal.expectedRecordsRevision!==context.recordsRevision)refuse("genesis-bank-proposal-context");
 if(!Array.isArray(proposal.records)||proposal.records.length===0||proposal.records.length>512)refuse("genesis-bank-records");
 const seen=new Set();for(const file of proposal.records){
  if(!shape(file,["path","sha256"])||typeof file.path!=="string"||!genesisBankRecordPath(proposal.stage,file.path)||!hex(file.sha256)||seen.has(file.path))refuse("genesis-bank-path");seen.add(file.path);
 }
 const required=proposal.stage===0?["docs/STATE.md"]:[1,2,3,4,6].includes(proposal.stage)?["docs/STATE.md","docs/NORTH_STAR.md"]:
  proposal.stage===5?["docs/STATE.md","docs/CONVENTIONS.md","docs/decisions/001-stack.md"]:
  proposal.stage===7?["docs/STATE.md","docs/ROADMAP.md"]:["docs/STATE.md","docs/ARCHITECTURE.md","docs/ROADMAP.md"];
 if(required.some(file=>!seen.has(file))||proposal.stage===8&&!proposal.records.some((/** @type {any} */ file)=>file.path.startsWith("docs/tasks/")))refuse("genesis-bank-required-output");
 // This validates context field types and reference structure before file I/O.
 if(!Array.isArray(proposal.answerRefs)||proposal.answerRefs.length>1024||proposal.stage!==0&&proposal.answerRefs.length===0||
    proposal.answerRefs.some((/** @type {any} */ ref)=>!shape(ref,["turn","sha256"])||!Number.isSafeInteger(ref.turn)||ref.turn<1||!hex(ref.sha256))||
    new Set(proposal.answerRefs.map((/** @type {any} */ ref)=>ref.turn)).size!==proposal.answerRefs.length)refuse("genesis-bank-answer-refs");
 if(!shape(context,["setupId","sessionId","originDigest","productRevision","recordsRevision"])||!id(context.setupId)||!id(context.sessionId)||
    typeof context.originDigest!=="string"||!/^sha256:[0-9a-f]{64}$/.test(context.originDigest)||![context.productRevision,context.recordsRevision].every(v=>typeof v==="string"&&/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(v)))refuse("genesis-bank-proposal-context");
 return freeze(structuredClone(proposal));
}
/** Capture actual supplied file/message observations after path qualification.
 * This is the pure part of the backend constructor, never an IPC byte overlay.
 * @param {{bytes:Uint8Array,context:any,answers:readonly any[],files:readonly {path:string,mode:string,bytes:Uint8Array}[]}} input */
export function captureGenesisBankProposal(input){
 if(!shape(input,["bytes","context","answers","files"]))refuse("genesis-bank-capture");
 const proposal=parseGenesisBankProposal({bytes:input.bytes,context:input.context});
 const answers=captureGenesisAnswerReferences({context:input.context,answers:input.answers,refs:proposal.answerRefs,allowEmpty:proposal.stage===0});
 if(!Array.isArray(input.files)||input.files.length!==proposal.records.length)refuse("genesis-bank-file-set");
 let total=input.bytes.byteLength;const files=new Map();
 for(const file of input.files){
  if(!shape(file,["path","mode","bytes"])||!(file.bytes instanceof Uint8Array)||!["100644","100755"].includes(file.mode)||files.has(file.path))refuse("genesis-bank-file-set");
  total+=file.bytes.byteLength;if(total>GENESIS_BANK_CAPTURE_LIMIT)refuse("genesis-bank-capture-limit");
  const expected=proposal.records.find((/** @type {any} */ row)=>row.path===file.path);
  if(!expected||hash(file.bytes)!==expected.sha256)refuse("genesis-bank-file-changed");
  const source=text(file.bytes);if(source.includes("\0"))refuse("genesis-bank-text");plannedTask(file.path,source);
  files.set(file.path,{path:file.path,mode:file.mode,base64:Buffer.from(file.bytes).toString("base64"),sha256:expected.sha256});
 }
 const content={version:1,kind:"genesis-records-proposal",context:structuredClone(input.context),proposal,answers,
  records:[...files.values()].sort((a,b)=>a.path<b.path?-1:1),sourceBase64:Buffer.from(input.bytes).toString("base64"),sourceSha256:hash(input.bytes)};
 return freeze({...content,digest:operationDigest(content),authority:"captured proposal data only; no root selection, semantic approval, or write authority"});
}
/** @param {any} original @param {any} candidate */
export function sameGenesisBankProposal(original,candidate){return operationContent(original)===operationContent(candidate);}
