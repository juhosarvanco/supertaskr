/** Exact private-record Git/filesystem mechanics. This module grants no
 * Markdown, lifecycle, graph, delivery or publication authority. A validating
 * service captures exact writes, then invokes preparation/materialization only
 * under its durable request, current positive policy and held reservation.
 */
import {execFileSync} from "node:child_process";
import {randomUUID} from "node:crypto";
import {closeSync, constants, existsSync, fchmodSync, fstatSync, fsyncSync, lstatSync, mkdirSync, mkdtempSync, openSync, readFileSync,
  readdirSync, realpathSync, renameSync, rmSync, statSync, unlinkSync, writeFileSync} from "node:fs";
import os from "node:os";
import path from "node:path";
import {syncNativeFileNamespace,withNativeTransaction} from "./native-codex.mjs";
import {captureOperationRepository, observedAcceptedOperation, readAcceptedOperation, stopUnmaterializedAcceptedOperation} from "./durable-operation.mjs";
import {operationContent, operationDigest, operationWork} from "./operation-record.mjs";
export class PrivateRecordSaveFinding extends Error {
  /** @param {string} code */
  constructor(code) { super(`${code}: private records save refused`); this.name = "PrivateRecordSaveFinding"; this.code = code; }
}
/** @param {string} code @returns {never} */
function refuse(code) { throw new PrivateRecordSaveFinding(code); }
/** @param {string} root @param {string[]} args @param {Buffer|string|undefined} [input] @param {Record<string,string>} [extra] */
function git(root, args, input, extra = {}) {
  try { return execFileSync("git", ["--no-replace-objects", "-C", root, ...args], { encoding: "utf8", maxBuffer: 32 * 1024 * 1024,
    stdio: [input === undefined ? "ignore" : "pipe", "pipe", "pipe"], ...(input === undefined ? {} : { input }),
    env: { ...process.env, GIT_NO_LAZY_FETCH: "1", GIT_OPTIONAL_LOCKS: "0", ...extra } }).replace(/\n$/, ""); }
  catch { refuse("records-save-git-unavailable"); }
}
/** @param {any} value @param {string[]} fields */
function shape(value, fields) { return value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).sort().join(",") === [...fields].sort().join(","); }
/** @param {any} a @param {any} b */
function same(a, b) { return operationContent(a) === operationContent(b); }
/** @param {string} root @param {string} file */
export function safeRecordWorkingPath(root, file) {
  if(typeof file !== "string" || !file.startsWith("docs/"))refuse("records-save-path");
  return safeOperationWorkingPath(root,file);
}
/** Exact regular-file mechanics for a separately authorized operation. This
 * does not change the ordinary records API's finite docs-only input policy.
 * @param {string} root @param {string} file */
export function safeOperationWorkingPath(root,file){
  if (typeof file !== "string" || /[\\\x00-\x1f\x7f]/.test(file) ||
      file.split("/").some((part) => !part || [".", "..", ".git", ".supertaskr"].includes(part))) refuse("records-save-path");
  let parent = root;
  const parts = file.split("/");
  for (let at = 0; at < parts.length; at++) {
    const part = /** @type {string} */ (parts[at]), child = path.join(parent, part);
    if (existsSync(parent)) {
      if (!lstatSync(parent).isDirectory() || lstatSync(parent).isSymbolicLink()) refuse("records-save-path");
      const entries = readdirSync(parent), exact = entries.includes(part);
      if (existsSync(child) && !exact) refuse("records-save-path-alias");
      if (exact && lstatSync(child).isSymbolicLink()) refuse("records-save-path");
    }
    parent = child;
  }
  return path.join(root, file);
}
/** @param {string} file @returns {any} */
export function snapshotRecordFile(file) {
  if (!existsSync(file)) return { present: false };
  const stat = lstatSync(file);
  if (!stat.isFile() || stat.isSymbolicLink()) refuse("records-save-file-type");
  return { present: true, mode: stat.mode & 0o111 ? "100755" : "100644", base64: readFileSync(file).toString("base64") };
}
/** Exact-byte plumbing is supported only when effective conversion policy is
 * absent or explicitly disabled. Never silently bypass filters/EOL/encoding.
 * @param {string} root @param {string[]} paths @param {string|undefined} [source] */
export function assertExactRecordTransformations(root, paths,source) {
  const names = ["filter", "working-tree-encoding", "eol", "text", "ident"];
  const attributes = git(root, ["check-attr", "-z", "--stdin", ...(source === undefined?[]:[`--source=${source}`]),...names], `${paths.join("\0")}\0`);
  const values = attributes.split("\0");
  if (values.at(-1) === "") values.pop();
  if (values.length !== paths.length * names.length * 3) refuse("records-save-attributes-unavailable");
  for (let at = 0; at < values.length; at += 3) if (!["unspecified", "unset"].includes(/** @type {string} */ (values[at + 2]))) refuse("records-save-transformation-unsupported");
  const entries = git(root, ["config", "--null", "--list"]).split("\0").filter(Boolean).map((line) => {
    const at = line.indexOf("\n"); return [line.slice(0, at).toLowerCase(), line.slice(at + 1).toLowerCase()];
  });
  const config = ["core.autocrlf", "core.eol", "core.safecrlf"].map((key) => ({ key, value: entries.filter(([name]) => name === key).at(-1)?.[1] ?? null }));
  if (config.some(({ key, value }) => value !== null && value !== "false" && !(key === "core.eol" && value === "native"))) refuse("records-save-transformation-unsupported");
  return { attributes, config };
}
/** @param {any} write */
export function intendedRecordFile(write) { return write.operation === "delete" ? { present: false } : { present: true, mode: write.mode, base64: write.base64 }; }
/** A cold temporary requires the exact retained bytes. A newly opened owned
 * descriptor permits cleanup of this call's partial write by physical identity.
 * Replacements and cold partial/unattributed files remain unavailable.
 * @param {string} file @param {string} token @param {Buffer|undefined} expected
 * @param {import("node:fs").BigIntStats|undefined} [owned] */
function retireTemporary(file, token, expected, owned) {
  const temporary = `${file}.supertaskr-${token}.tmp`;
  let before;try{before=lstatSync(temporary,{bigint:true});}catch(error){if(/** @type {NodeJS.ErrnoException} */(error).code==="ENOENT")return;throw error;}
  if(!before.isFile()||before.isSymbolicLink()||before.nlink!==1n)refuse("records-save-temporary-unavailable");
  if(owned!==undefined){
    if(before.dev!==owned.dev||before.ino!==owned.ino)refuse("records-save-temporary-unavailable");
    const current=lstatSync(temporary,{bigint:true});
    if(!current.isFile()||current.isSymbolicLink()||current.nlink!==1n||current.dev!==owned.dev||current.ino!==owned.ino)refuse("records-save-temporary-unavailable");
    unlinkSync(temporary);syncNativeFileNamespace(temporary);return;
  }
  if(expected===undefined||constants.O_NOFOLLOW===undefined)refuse("records-save-temporary-unavailable");
  const fd=openSync(temporary,constants.O_RDONLY|constants.O_NOFOLLOW);
  try{
    const opened=fstatSync(fd,{bigint:true}),bytes=readFileSync(fd);
    if(!opened.isFile()||opened.nlink!==1n||opened.dev!==before.dev||opened.ino!==before.ino||!bytes.equals(expected))refuse("records-save-temporary-unavailable");
    const current=lstatSync(temporary,{bigint:true});
    if(!current.isFile()||current.isSymbolicLink()||current.nlink!==1n||current.dev!==opened.dev||current.ino!==opened.ino||!readFileSync(temporary).equals(bytes))refuse("records-save-temporary-unavailable");
    unlinkSync(temporary);syncNativeFileNamespace(temporary);
  }finally{closeSync(fd);}
}
/** @param {string} file @param {Buffer} bytes @param {number} mode @param {string} token @param {(() => void)|undefined} [afterWrite] */
function atomicBytes(file, bytes, mode, token, afterWrite) {
  syncNativeFileNamespace(file);
  const previous = existsSync(file) ? lstatSync(file).mode & 0o777 : null;
  const access = previous === null ? (mode & 0o111 ? 0o700 : 0o600)
    : mode & 0o111 ? (previous & 0o666) | (previous & 0o111 || (previous & 0o444) >> 2 || 0o100) : previous & 0o666;
  retireTemporary(file, token, bytes);
  const temporary = `${file}.supertaskr-${token}.tmp`, fd = openSync(temporary, "wx", access);
  const owned=fstatSync(fd,{bigint:true});
  let closed = false;
  try {
    if (previous !== null) fchmodSync(fd, access);
    writeFileSync(fd, bytes); afterWrite?.(); fsyncSync(fd); closeSync(fd); closed = true;
    renameSync(temporary, file); syncNativeFileNamespace(file);
  } finally { if (!closed) closeSync(fd); retireTemporary(file, token, bytes, owned); }
}
/** @param {string} root @param {string} index @param {any[]} writes @param {Record<string,string>} [objects] @param {(()=>unknown)|undefined} [beforeObject] */
function updateIndex(root, index, writes, objects = {},beforeObject) {
  for (const write of writes) {
    if (write.operation === "delete") git(root, ["update-index", "--force-remove", "--", write.path], undefined, { ...objects, GIT_INDEX_FILE: index });
    else {
      if(beforeObject!==undefined&&beforeObject()!==true)refuse("records-save-policy-refused");
      const blob = git(root, ["hash-object", "-w", "--stdin"], Buffer.from(write.base64, "base64"), objects);
      git(root, ["update-index", "--add", "--cacheinfo", `${write.mode},${blob},${write.path}`], undefined, { ...objects, GIT_INDEX_FILE: index });
    }
  }
}
/** @param {string} root @param {string} revision @param {any[]} writes @param {Record<string,string>} [objects] @param {(()=>unknown)|undefined} [beforeObject] */
function buildTree(root, revision, writes, objects = {},beforeObject) {
  const temp = mkdtempSync(path.join(os.tmpdir(), "supertaskr-private-index-")), index = path.join(temp, "index");
  try {
    git(root,["read-tree",revision],undefined,{...objects,GIT_INDEX_FILE:index});updateIndex(root,index,writes,objects,beforeObject);
    if(beforeObject!==undefined&&beforeObject()!==true)refuse("records-save-policy-refused");
    return git(root,["write-tree"],undefined,{...objects,GIT_INDEX_FILE:index});
  }
  finally { rmSync(temp, { recursive: true, force: true }); }
}
/** @param {string} root @param {string} revision @param {any[]} writes @param {Record<string,string>} objects */
function captureWorking(root, revision, writes, objects,workingPath=safeRecordWorkingPath) {
  const gitDir = realpathSync(git(root, ["rev-parse", "--absolute-git-dir"])), index = path.join(gitDir, "index");
  if (!existsSync(index) || !lstatSync(index).isFile() || lstatSync(index).isSymbolicLink()) refuse("records-save-index-unavailable");
  const beforeIndex = readFileSync(index), temp = mkdtempSync(path.join(os.tmpdir(), "supertaskr-preserved-index-")), next = path.join(temp, "index");
  const indexEntries = git(root, ["ls-files", "--stage", "-z"]).split("\0").filter(Boolean);
  const baseEntries = git(root, ["ls-tree", "-r", "-z", revision]).split("\0").filter(Boolean);
  const preimages = [];
  try {
    for (const write of writes) {
      const baseLine = baseEntries.find((line) => line.slice(line.indexOf("\t") + 1) === write.path), indexLine = indexEntries.filter((line) => line.slice(line.indexOf("\t") + 1) === write.path);
      const base = baseLine ? /^(\d+) blob ([0-9a-f]+)\t/.exec(baseLine) : null;
      if (baseLine && !base || indexLine.length > 1 || indexLine.some((line) => !/^\d+ [0-9a-f]+ 0\t/.test(line))) refuse("records-save-index-conflict");
      const physical = snapshotRecordFile(workingPath(root, write.path));
      const committed = base ? { present: true, mode: base[1], base64: Buffer.from(execFileSync("git", ["--no-replace-objects", "-C", root, "cat-file", "blob", /** @type {string} */ (base[2])], { maxBuffer: 32 * 1024 * 1024, env: { ...process.env, GIT_NO_LAZY_FETCH: "1" } })).toString("base64") } : { present: false };
      if (!same(physical, committed) && !same(physical, intendedRecordFile(write))) refuse("records-save-working-conflict");
      if (indexLine.length) {
        const current = /^(\d+) ([0-9a-f]+) 0\t/.exec(/** @type {string} */ (indexLine[0]));
        const intendedBlob = write.operation === "delete" ? null : git(root, ["hash-object", "--stdin"], Buffer.from(write.base64, "base64"));
        if (current && !(base && current[1] === base[1] && current[2] === base[2]) && !(current[1] === write.mode && current[2] === intendedBlob)) refuse("records-save-index-conflict");
      } else if (base && write.operation !== "delete") refuse("records-save-index-conflict");
      preimages.push({ path: write.path, work: physical });
    }
    writeFileSync(next, beforeIndex); updateIndex(root, next, writes, objects);
    const result = readFileSync(next);
    return { preimages, index: { path: index, previousDigest: operationDigest(beforeIndex.toString("base64")), resultDigest: operationDigest(result.toString("base64")), resultBase64: result.toString("base64"), lockToken: randomUUID() } };
  } finally { rmSync(temp, { recursive: true, force: true }); }
}
/** Planning writes only to an owned scratch primary object store. Original
 * objects are a read-only alternate, never a write destination.
 * @param {string} root @param {string} revision @param {any[]} writes */
export function captureExactRecordPlan(root, revision, writes) {
  writes.forEach((/** @type {any} */ write)=>safeRecordWorkingPath(root,write.path));
  return captureExactWritePlan(root,revision,writes);
}
/** Policy-free exact planning in an owned external object store.
 * @param {string} root @param {string} revision @param {any[]} writes */
export function captureExactWritePlan(root,revision,writes){
  return captureExactPlan(root,revision,writes);
}
/** Deterministic parented commit preparation in the same external scratch
 * object store as exact tree/index planning. Identity/message are data from a
 * separately authorized producer; this helper confers no lifecycle authority.
 * @param {string} root @param {string} revision @param {any[]} writes
 * @param {{identity:any,message:string}} commit */
export function captureExactCommitPlan(root,revision,writes,commit){
  if(!shape(commit,["identity","message"]) || !shape(commit.identity,["author","committer"]) || typeof commit.message !== "string" || !commit.message.trim() || commit.message.includes("\0"))refuse("records-save-commit-plan");
  for(const actor of [commit.identity.author,commit.identity.committer])if(!shape(actor,["name","email","date"]) || [actor.name,actor.email].some(v=>typeof v !== "string" || !v.trim() || /[\r\n<>\0]/.test(v)) || typeof actor.date !== "string" || !/^-?[0-9]+ [+-][0-9]{4}$/.test(actor.date))refuse("records-save-commit-plan");
  return captureExactPlan(root,revision,writes,commit);
}
/** @param {string} root @param {string} revision @param {any[]} writes
 * @param {{identity:any,message:string}|undefined} [commit] */
function captureExactPlan(root,revision,writes,commit){
  const temp = mkdtempSync(path.join(os.tmpdir(), "supertaskr-save-objects-"));
  const primary = path.join(temp, "objects"); mkdirSync(primary);
  const common = realpathSync(git(root, ["rev-parse", "--path-format=absolute", "--git-common-dir"]));
  const objects = { GIT_OBJECT_DIRECTORY: primary, GIT_ALTERNATE_OBJECT_DIRECTORIES: path.join(common, "objects") };
  try {
    const tree=buildTree(root,revision,writes,objects),working=captureWorking(root,revision,writes,objects,safeOperationWorkingPath);
    if(commit === undefined)return {tree,working};
    const {author,committer}=commit.identity,env={...objects,GIT_AUTHOR_NAME:author.name,GIT_AUTHOR_EMAIL:author.email,GIT_AUTHOR_DATE:author.date,
      GIT_COMMITTER_NAME:committer.name,GIT_COMMITTER_EMAIL:committer.email,GIT_COMMITTER_DATE:committer.date};
    const oid=git(root,["commit-tree",tree,"-p",revision],commit.message,env);
    const bytes=execFileSync("git",["--no-replace-objects","-C",root,"cat-file","commit",oid],{env:{...process.env,GIT_NO_LAZY_FETCH:"1",GIT_OPTIONAL_LOCKS:"0",...objects}});
    return {tree,working,commit:oid,commitBase64:bytes.toString("base64")};
  }
  finally { rmSync(temp, { recursive: true, force: true }); }
}
/** Actual repository object writes. The producer must persist its complete
 * capture/objects-start marker and positively revalidate before calling.
 * @param {string} root @param {string} revision @param {any[]} writes @param {string} expectedTree @param {(()=>unknown)|undefined} [beforeObject] */
export function prepareExactWriteTree(root,revision,writes,expectedTree,beforeObject){
  if(buildTree(root,revision,writes,{},beforeObject) !== expectedTree)refuse("records-save-tree-changed");
}
/** @param {any} payload @param {any} context @param {(()=>unknown)|undefined} [beforeObject] */
export function prepareExactRecordTree(payload, context,beforeObject) {
  prepareExactWriteTree(context.request.repository.root,payload.options.recordsRevision,payload.writes,context.request.acceptedTree,beforeObject);
}
/** Consumer preparation is already durably recorded by the canonical core.
 * Derive the existing recovery context from that exact physical row, never a
 * caller flag, so repeated policy can recognize this operation's own bytes.
 * @param {string} coordinatorRoot @param {any} payload @param {any} context
 * @param {((boundary:string,context:any)=>void)|undefined} [onBoundary]
 * @param {((context:any)=>unknown)|undefined} [beforeEffect] */
export function materializeExactRecordWrites(coordinatorRoot,payload,context,onBoundary,beforeEffect) {
  let materializing=context;
  if(beforeEffect!==undefined){
    if(typeof beforeEffect!=="function")refuse("records-save-policy-required");
    const rec=readAcceptedOperation(coordinatorRoot,context.operationId);
    if(rec?.operation.kind!=="records-save"||!same(rec.operation.request,context.request)||!rec.events.some((/** @type {any} */ e)=>e.op==="consumer-prepare"))refuse("records-save-preparation-unrecorded");
    materializing={...context,resumingPreparation:true};
  }
  return materializeWrites(coordinatorRoot,payload,context,onBoundary,safeRecordWorkingPath,()=>beforeEffect===undefined?true:beforeEffect(materializing));
}
/** The protected producer must revalidate its own policy at every file/index
 * effect. A false/async callback is refusal, never authority by presence.
 * @param {string} coordinatorRoot @param {any} payload @param {any} context
 * @param {(phase:string)=>unknown} beforeEffect @param {((boundary:string,context:any)=>void)|undefined} [onBoundary] */
export function materializeExactWrites(coordinatorRoot,payload,context,beforeEffect,onBoundary){
  if(typeof beforeEffect !== "function")refuse("records-save-policy-required");
  return materializeWrites(coordinatorRoot,payload,context,onBoundary,safeOperationWorkingPath,beforeEffect);
}
/** @param {string} coordinatorRoot @param {any} payload @param {any} context
 * @param {((boundary:string,context:any)=>void)|undefined} onBoundary @param {typeof safeRecordWorkingPath} workingPath @param {(phase:string)=>unknown} beforeEffect */
function materializeWrites(coordinatorRoot,payload,context,onBoundary,workingPath,beforeEffect){
  const permit=(/** @type {string} */ phase)=>{if(beforeEffect(phase) !== true)refuse("records-save-policy-refused");};
  const root = context.request.repository.root, lockPath = `${payload.index.path}.lock`;
  permit("index-lock");
  if (existsSync(lockPath)) {
    let previous;
    try { previous = JSON.parse(readFileSync(lockPath, "utf8")); } catch { refuse("records-save-index-locked"); }
    if (!shape(previous, ["operationId", "token", "pid"]) || !Number.isInteger(previous.pid)) refuse("records-save-index-locked");
    let live = true; try { process.kill(previous.pid, 0); } catch (error) { live = /** @type {NodeJS.ErrnoException} */ (error).code !== "ESRCH"; }
    if (live) refuse("records-save-index-locked");
    const rec = readAcceptedOperation(coordinatorRoot, previous.operationId);
    const expectedIndex=path.join(context.request.repository.gitDir,"index"),completion=rec?.operation.completion?.plan;
    const bankIndex=()=>{
      const plans=rec.operation.request.plans;if(!shape(plans,["records","product"])||previous.operationId!==context.operationId)return null;
      const matches=[];
      for(const role of ["records","product"]){const plan=plans[role];if(plan===null)continue;
        if(!plan||typeof plan!=="object"||!plan.repository||!plan.working?.index)return null;
        if(plan.repository.root===root&&plan.working.index.path===expectedIndex)matches.push(plan.working.index);
      }
      return matches.length===1?matches[0]:null;
    };
    const retained=rec?.operation.kind === "project-bank" ? bankIndex() : rec?.operation.kind === "qualified-delivery" ? [completion?.repository.root===root&&completion.index.path===expectedIndex?completion.index:null,
      ...rec.operation.request.landings.map((/** @type {any} */ l)=>l.repository.root===root&&l.working.index.path===expectedIndex?l.working.index:null)].find(i=>i?.lockToken===previous.token)
      : rec?.operation.request.repository?.root===root?rec.operation.request.payload?.index:null;
    if (retained?.lockToken !== previous.token||retained.path!==expectedIndex||payload.index.path!==expectedIndex) refuse("records-save-index-locked");
    // Exact historical acceptance can retire only this proven dead owner's lock.
    if (previous.operationId !== context.operationId && observedAcceptedOperation(coordinatorRoot, previous.operationId) === null) refuse("records-save-index-locked");
    if (previous.operationId === context.operationId && previous.token !== payload.index.lockToken) refuse("records-save-index-locked");
    unlinkSync(lockPath);
  }
  const lock = openSync(lockPath, "wx", 0o600);
  writeFileSync(lock, JSON.stringify({ operationId: context.operationId, token: payload.index.lockToken, pid: process.pid })); fsyncSync(lock);
  syncNativeFileNamespace(lockPath);
  const lockIdentity = statSync(lockPath, { bigint: true });
  const release = () => {
    closeSync(lock);
    if (existsSync(lockPath)) { const current = statSync(lockPath, { bigint: true }); if (current.dev === lockIdentity.dev && current.ino === lockIdentity.ino) { unlinkSync(lockPath); syncNativeFileNamespace(lockPath); } }
  };
  try {
    const currentIndex = operationDigest(readFileSync(payload.index.path).toString("base64"));
    if (![payload.index.previousDigest, payload.index.resultDigest].includes(currentIndex)) refuse("records-save-index-changed");
    for (const write of payload.writes) {
      const file = workingPath(root, write.path), now = snapshotRecordFile(file), original = payload.preimages.find((/** @type {any} */ entry) => entry.path === write.path)?.work;
      if (!same(now, original) && !same(now, intendedRecordFile(write))) refuse("records-save-working-changed");
    }
    for (const write of payload.writes) {
      permit("working-file");
      const file = workingPath(root, write.path);
      if (same(snapshotRecordFile(file), intendedRecordFile(write))) {
        retireTemporary(file, payload.index.lockToken,write.operation==="delete"?undefined:Buffer.from(write.base64,"base64"));
        onBoundary?.("working-file-observed", { operationId: context.operationId, path: write.path });
        continue;
      }
      if (write.operation === "delete") { if (existsSync(file)) { unlinkSync(file); syncNativeFileNamespace(file); } }
      else atomicBytes(file, Buffer.from(write.base64, "base64"), write.mode === "100755" ? 0o755 : 0o644, payload.index.lockToken,
        () => {onBoundary?.("file-temp-written", { operationId: context.operationId, path: write.path });permit("working-file-publish");});
      onBoundary?.("working-file", { operationId: context.operationId, path: write.path });
    }
    permit("index-publish");
    if (currentIndex !== payload.index.resultDigest) atomicBytes(payload.index.path, Buffer.from(payload.index.resultBase64, "base64"), 0o644, payload.index.lockToken,()=>permit("index-publish"));
    else retireTemporary(payload.index.path, payload.index.lockToken,Buffer.from(payload.index.resultBase64,"base64"));
    onBoundary?.("index-prepared", { operationId: context.operationId });
    return release;
  } catch (error) { release(); throw error; }
}

/** Captured-origin reconciliation for a known unaccepted exact private write.
 * Current source HEAD/binding cannot retarget or authorize the old request.
 * A live owner or any materialization ambiguity remains unavailable.
 * @param {string} coordinatorRoot @param {string} operationId
 * @param {{payloadKind:"ordinary-record-save"|"private-record-graph"}} options */
export function stopUnmaterializedRecordWrite(coordinatorRoot,operationId,options) {
  if(!shape(options,["payloadKind"]) || !["ordinary-record-save","private-record-graph"].includes(options.payloadKind)) refuse("records-save-disposition-unavailable");
  coordinatorRoot=realpathSync(coordinatorRoot);
  return stopUnmaterializedAcceptedOperation(coordinatorRoot,operationId,{authorizeDisposition(context) {
    try {
    const p=context.request.payload,r=context.request.repository,origin=p?.recordOrigin;
    if(!p || p.kind !== options.payloadKind || !(p.version === 1 || p.version === 2 && p.kind === "private-record-graph") || !shape(p.options,["productRoot","productRevision","recordsRevision"]) ||
      p.options.productRoot !== coordinatorRoot || p.options.recordsRevision !== context.request.expectedRevision ||
      !Array.isArray(p.writes) || p.writes.length === 0 || !Array.isArray(p.preimages) || p.preimages.length !== p.writes.length ||
      !p.productOrigin || !origin || origin.root !== r.root || origin.gitDirectory !== r.gitDir || origin.commonDirectory !== r.commonDir ||
      origin.docsDirectory !== path.join(r.root,"docs") || !shape(p.index,["path","previousDigest","resultDigest","resultBase64","lockToken"]) ||
      p.index.path !== path.join(r.gitDir,"index") || typeof p.index.lockToken !== "string" || !/^[A-Za-z0-9-]+$/.test(p.index.lockToken)) refuse("records-save-disposition-unavailable");
    const product=captureOperationRepository(coordinatorRoot,p.options.productRevision,{forEffect:false});
    if(!same(product,p.productOrigin)) refuse("records-save-disposition-unavailable");
    const directory=origin.docsDirectory,stat=lstatSync(directory,{bigint:true});
    if(!stat.isDirectory() || stat.isSymbolicLink() || String(stat.dev) !== origin.docsDevice || String(stat.ino) !== origin.docsInode) refuse("records-save-disposition-unavailable");
    const paths=new Set();
    for(const write of p.writes) {
      if(!shape(write,write.operation === "delete" ? ["operation","path",...(Object.hasOwn(write,"derived")?["derived"]:[])] :
        ["operation","path","type","mode","base64",...(Object.hasOwn(write,"derived")?["derived"]:[])]) ||
        !["add","edit","delete"].includes(write.operation) || paths.has(write.path) ||
        write.operation !== "delete" && (write.type !== "blob" || !["100644","100755"].includes(write.mode) || typeof write.base64 !== "string" || Buffer.from(write.base64,"base64").toString("base64") !== write.base64)) refuse("records-save-disposition-unavailable");
      paths.add(write.path);const physical=safeRecordWorkingPath(r.root,write.path), matches=p.preimages.filter((/** @type {any} */ pre)=>pre.path === write.path);
      if(matches.length !== 1 || !shape(matches[0],["path","work"]) ||
        !shape(matches[0].work,matches[0].work?.present === false ? ["present"] : ["present","mode","base64"]) ||
        !same(snapshotRecordFile(physical),matches[0].work) || existsSync(`${physical}.supertaskr-${p.index.lockToken}.tmp`)) refuse("records-save-disposition-unavailable");
    }
    if(!lstatSync(p.index.path).isFile() || lstatSync(p.index.path).isSymbolicLink() ||
      operationDigest(readFileSync(p.index.path).toString("base64")) !== p.index.previousDigest ||
      existsSync(`${p.index.path}.lock`) || existsSync(`${p.index.path}.supertaskr-${p.index.lockToken}.tmp`)) refuse("records-save-disposition-unavailable");
    return {payloadKind:p.kind,repositoryDigest:operationDigest(r),productDigest:operationDigest(product),docsDirectory:directory,
      docsDevice:origin.docsDevice,docsInode:origin.docsInode,preimagesDigest:operationDigest(p.preimages),indexDigest:p.index.previousDigest,
      targetRef:context.request.targetRef,expectedRevision:context.request.expectedRevision,
      correlationRef:`refs/supertaskr/operations/${operationWork(context.operationId).slice(3)}`,correlation:null};
    } catch {refuse("records-save-disposition-unavailable");}
  }});
}

/** Historical accepted result cleanup is separate from its authority. A foreign,
 * live or ambiguous lock remains intact and returns only a cleanup warning.
 * @param {string} coordinatorRoot @param {string} operationId
 * @param {{onBeforeUnlink?:()=>void}} [diagnostics] */
export function releaseAcceptedRecordWriteLock(coordinatorRoot,operationId,diagnostics={}) {
  try {
    if(!shape(diagnostics,Object.hasOwn(diagnostics,"onBeforeUnlink") ? ["onBeforeUnlink"] : []) || diagnostics.onBeforeUnlink !== undefined && typeof diagnostics.onBeforeUnlink !== "function") refuse("records-save-accepted-lock-unavailable");
    coordinatorRoot=realpathSync(coordinatorRoot);
    return withNativeTransaction(coordinatorRoot,{operation:"accepted-record-index-lock"},()=>{
      const rec=readAcceptedOperation(coordinatorRoot,operationId),p=rec?.operation.request.payload,r=rec?.operation.request.repository;
      if(!rec || observedAcceptedOperation(coordinatorRoot,operationId) === null || !p?.index ||
        p.options?.productRoot !== coordinatorRoot || !["ordinary-record-save","private-record-graph"].includes(p.kind) ||
        p.index.path !== path.join(r.gitDir,"index") || typeof p.index.lockToken !== "string") refuse("records-save-accepted-lock-unavailable");
      try{lstatSync(`${p.index.path}.lock`);}catch(error){if(/** @type {NodeJS.ErrnoException} */(error).code === "ENOENT")return {status:"clear"};refuse("records-save-accepted-lock-unavailable");}
      if(!same(captureOperationRepository(r.root,rec.operation.request.expectedRevision,{forEffect:false}),r) ||
        !p.productOrigin || !same(captureOperationRepository(coordinatorRoot,p.options.productRevision,{forEffect:false}),p.productOrigin) ||
        p.recordOrigin?.root !== r.root || p.recordOrigin.docsDirectory !== path.join(r.root,"docs")) refuse("records-save-accepted-lock-unavailable");
      const docs=lstatSync(p.recordOrigin.docsDirectory,{bigint:true});
      if(!docs.isDirectory() || docs.isSymbolicLink() || String(docs.dev) !== p.recordOrigin.docsDevice || String(docs.ino) !== p.recordOrigin.docsInode) refuse("records-save-accepted-lock-unavailable");
      return releaseDeadExactWriteLock(p.index.path,operationId,p.index.lockToken,()=>observedAcceptedOperation(coordinatorRoot,operationId) !== null,diagnostics);
    });
  } catch {return {status:"unavailable",code:"records-save-accepted-lock-unavailable"};}
}
/** Policy-free owned-lock retirement. The producer holds the shared transaction
 * and proves original acceptance/origin; the helper proves token, dead owner,
 * physical lock identity and exact bytes before unlink. No foreign/live lock is
 * retired. An explicit synchronous true is required for the final witness.
 * @param {string} indexPath @param {string} operationId @param {string} token
 * @param {()=>unknown} confirm @param {{onBeforeUnlink?:()=>void}} [diagnostics] */
export function releaseDeadExactWriteLock(indexPath,operationId,token,confirm,diagnostics={}){
 const lockPath=`${indexPath}.lock`;let identity;
 try{identity=lstatSync(lockPath,{bigint:true});}catch(error){if(/** @type {NodeJS.ErrnoException} */(error).code === "ENOENT")return {status:"clear"};refuse("records-save-accepted-lock-unavailable");}
 if(!identity.isFile() || identity.isSymbolicLink())refuse("records-save-accepted-lock-unavailable");
 const bytes=readFileSync(lockPath),lock=JSON.parse(bytes.toString("utf8"));
 if(!shape(lock,["operationId","token","pid"]) || lock.operationId !== operationId || lock.token !== token || !Number.isInteger(lock.pid) || lock.pid<1)refuse("records-save-accepted-lock-unavailable");
 try{process.kill(lock.pid,0);refuse("records-save-accepted-lock-unavailable");}catch(error){if(/** @type {NodeJS.ErrnoException} */(error).code !== "ESRCH")refuse("records-save-accepted-lock-unavailable");}
 if(typeof confirm !== "function" || confirm() !== true)refuse("records-save-accepted-lock-unavailable");
 diagnostics.onBeforeUnlink?.();
 const current=lstatSync(lockPath,{bigint:true});
 if(!current.isFile() || current.isSymbolicLink() || current.dev !== identity.dev || current.ino !== identity.ino || !readFileSync(lockPath).equals(bytes) || confirm() !== true)refuse("records-save-accepted-lock-unavailable");
 unlinkSync(lockPath);syncNativeFileNamespace(lockPath);return {status:"released"};
}
