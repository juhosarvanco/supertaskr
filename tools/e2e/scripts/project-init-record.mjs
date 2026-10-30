/** Strict project-init branch of the existing canonical operation namespace. */
import {createHash} from "node:crypto";
import path from "node:path";
import {operationDigest,operationPayload,operationWork} from "./operation-record.mjs";
const ROLES=["product","records"];
/** @param {any} v @param {string[]} keys */
function shape(v,keys){return v && typeof v === "object" && !Array.isArray(v) && Object.keys(v).sort().join("\0") === [...keys].sort().join("\0");}
/** @param {any} v */
function date(v){return typeof v === "string" && Number.isFinite(Date.parse(v));}
/** @param {any} v */
function hash(v){return typeof v === "string" && /^[0-9a-f]{40}$/.test(v);}
/** @param {any} v */
function digest(v){return typeof v === "string" && /^sha256:[0-9a-f]{64}$/.test(v);}
/** @param {any} v */
function relative(v){return typeof v === "string" && !path.posix.isAbsolute(v) && !path.win32.isAbsolute(v) && !/[\\\x00-\x1f\x7f]/.test(v) && v.split("/").every((p)=>p && ![".","..",".git"].includes(p));}
/** @param {any} v */
function file(v){return shape(v,["path","mode","base64"]) && relative(v.path) && ["100644","100755"].includes(v.mode) && typeof v.base64 === "string" && Buffer.from(v.base64,"base64").toString("base64") === v.base64;}
/** @param {any} v */
function directoryIdentity(v){return shape(v,["device","inode"]) && /^[0-9]+$/.test(v.device) && typeof v.device === "string" && /^[0-9]+$/.test(v.inode) && typeof v.inode === "string";}
/** @param {any} plan @param {any} req @param {string} role */
function planShape(plan,req,role){
 if(!shape(plan,["version","operationId","role","initialRef","objectFormat","files","tree","commit","identity","message","commitBase64","gitFiles","gitDirectories"]) ||
  plan.version !== 1 || plan.operationId !== req.operationId || plan.role !== role || plan.objectFormat !== "sha1" || !hash(plan.tree) || !hash(plan.commit) ||
  typeof plan.initialRef !== "string" || !/^refs\/heads\/[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(plan.initialRef) ||
  !Array.isArray(plan.files) || !plan.files.length || plan.files.some((/** @type {any} */ f)=>!file(f) || f.path.split("/").includes(".supertaskr")) ||
  !Array.isArray(plan.gitFiles) || !plan.gitFiles.length || plan.gitFiles.some((/** @type {any} */ f)=>!file(f)) ||
  !Array.isArray(plan.gitDirectories) || plan.gitDirectories.some((/** @type {any} */ d)=>!relative(d)) ||
  typeof plan.message !== "string" || !plan.message.endsWith(`\n\nSupertaskr-Initialization: ${req.operationId}/${role}\n`) ||
  typeof plan.commitBase64 !== "string" || Buffer.from(plan.commitBase64,"base64").toString("base64") !== plan.commitBase64 ||
  !shape(plan.identity,["author","committer"])) return false;
 return [plan.identity.author,plan.identity.committer].every((actor)=>shape(actor,["name","email","date"]) &&
  typeof actor.name === "string" && /^[^\r\n<>]+$/.test(actor.name) && typeof actor.email === "string" && /^[^\r\n<>]+$/.test(actor.email) && /^-?[0-9]+ [+-][0-9]{4}$/.test(actor.date));
}
/** @param {any} req */
export function validProjectInitRequest(req){
 if(!shape(req,["version","operationId","kind","tool","projectId","roots","plans","runtimeWrites","directories","preimages"]) || req.version !== 1 || req.kind !== "project-init" ||
  typeof req.operationId !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(req.operationId) ||
  typeof req.projectId !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(req.projectId) || !shape(req.roots,ROLES) || !shape(req.plans,ROLES) ||
  !shape(req.tool,["version","package","parserVersion","runtimeDigest","methodVersion","methodDigest","manifestDigest","statuses"]) || req.tool.version !== 2 ||
  !shape(req.tool.package,["name","version","sha256","entrySha256"]) || req.tool.package.name !== "supertaskr" || typeof req.tool.package.version !== "string" ||
  typeof req.tool.parserVersion !== "string" || typeof req.tool.methodVersion !== "string" || !Array.isArray(req.tool.statuses) || req.tool.statuses.some((/** @type {any} */ status)=>typeof status !== "string") ||
  ![req.tool.runtimeDigest,req.tool.methodDigest,req.tool.manifestDigest].every((v)=>typeof v === "string" && /^[0-9a-f]{64}$/.test(v))) return false;
 for(const role of ROLES){const root=req.roots[role];if(!shape(root,["path","device","inode"]) || typeof root.path !== "string" || !path.isAbsolute(root.path) ||
  !directoryIdentity({device:root.device,inode:root.inode}) || !planShape(req.plans[role],req,role)) return false;}
 if(req.roots.product.device === req.roots.records.device && req.roots.product.inode === req.roots.records.inode) return false;
 const rel=path.relative(req.roots.product.path,req.roots.records.path),rev=path.relative(req.roots.records.path,req.roots.product.path);
 if(![rel,rev].every((v)=>v === ".." || v.startsWith(`..${path.sep}`) || path.isAbsolute(v))) return false;
 if(!Array.isArray(req.runtimeWrites) || req.runtimeWrites.some((/** @type {any} */ f)=>!shape(f,["role","path","mode","base64"]) || f.role !== "product" ||
  !file({path:f.path,mode:f.mode,base64:f.base64}) || !(f.path === ".supertaskr/workspace.json" || f.path.startsWith(".supertaskr/genesis/kit/"))) ||
  req.runtimeWrites.filter((/** @type {any} */ f)=>f.path === ".supertaskr/workspace.json").length !== 1 ||
  !Array.isArray(req.directories) || req.directories.some((/** @type {any} */ d)=>!shape(d,["role","path"]) || !ROLES.includes(d.role) || !relative(d.path) ||
    !(d.role === "records" && d.path.startsWith("docs/") || d.role === "product" && d.path.startsWith(".supertaskr/genesis/kit/"))) ||
  !Array.isArray(req.preimages) || req.preimages.some((/** @type {any} */ f)=>!shape(f,["role","path","present"]) || !ROLES.includes(f.role) || !relative(f.path) || f.present !== false)) return false;
 const expected=[...ROLES.flatMap((role)=>req.plans[role].files.map((/** @type {any} */ f)=>`${role}\0${f.path}`)),...req.runtimeWrites.map((/** @type {any} */ f)=>`${f.role}\0${f.path}`)].sort();
 const actual=req.preimages.map((/** @type {any} */ f)=>`${f.role}\0${f.path}`).sort();
 if(new Set(expected).size !== expected.length || expected.join("\n") !== actual.join("\n")) return false;
 try{operationPayload(req);}catch{return false;}return true;
}
/** @param {any} rec */
export function validProjectInitializationRecord(rec){
 if(!shape(rec,["version","recordKind","attempt","state","assignment","assignmentDigest","writer","resource","reservation","execution","admission","operation","events"]) ||
  rec.version !== 1 || rec.recordKind !== "operation" || !["starting","unknown","finished"].includes(rec.state) || rec.writer !== true || rec.execution !== null || rec.admission !== null ||
  !shape(rec.assignment,["kind","id","role","resource"]) || rec.assignment.kind !== "operation" || rec.assignment.role !== "project-init" || rec.assignment.resource !== rec.resource ||
  rec.assignmentDigest !== `sha256:${createHash("sha256").update(JSON.stringify(rec.assignment)).digest("hex")}` ||
  !shape(rec.reservation,["file","takenAt","releasedAt"]) || !date(rec.reservation.takenAt) ||
  !Array.isArray(rec.events) || rec.events.some((/** @type {any} */ e)=>!shape(e,["at","op"]) || !date(e.at) || typeof e.op !== "string")) return false;
 const op=rec.operation;
 if(!shape(op,["version","id","kind","request","digest","owner","createdAt","claims","progress","binding","acceptance"]) ||
  op.version !== 1 || op.kind !== "project-init" || !validProjectInitRequest(op.request) || op.id !== op.request.operationId || op.digest !== operationDigest(op.request) ||
  rec.assignment.id !== operationWork(op.id) || rec.attempt !== `${operationWork(op.id)}-a1` || rec.resource !== op.request.roots.product.path ||
  !date(op.createdAt) || !shape(op.owner,["pid","identity","token"]) || !Number.isInteger(op.owner.pid) || op.owner.pid < 1 || typeof op.owner.identity !== "string" || !op.owner.identity || typeof op.owner.token !== "string" ||
  !Array.isArray(op.claims) || op.claims.length !== 2 || !shape(op.progress,ROLES)) return false;
 for(const role of ROLES){
  const claims=op.claims.filter((/** @type {any} */ c)=>c.role === role),p=op.progress[role],plan=op.request.plans[role],root=op.request.roots[role].path;
  if(claims.length !== 1) return false;const c=claims[0],reservation=path.join(rec.resource,".supertaskr/runs/reservations",`${path.basename(root)}-${createHash("sha256").update(root).digest("hex").slice(0,12)}.json`);
  if(!shape(c,["role","resource","file","takenAt","releasedAt"]) || c.resource !== root || c.file !== reservation || !date(c.takenAt) || !(c.releasedAt === null || date(c.releasedAt)) ||
   !shape(p,["stage","stageIdentity","repository","intent","acceptance"]) || !["captured","git-staging","git-prepared","files-prepared","git-adopted","ref-accepted"].includes(p.stage) ||
   !(p.stageIdentity === null || directoryIdentity(p.stageIdentity))) return false;
  if(p.repository !== null && (!shape(p.repository,["root","gitDir","commonDir","objectFormat","rootCommits","identities"]) || p.repository.root !== root || p.repository.gitDir !== path.join(root,".git") || p.repository.commonDir !== path.join(root,".git") ||
    p.repository.objectFormat !== "sha1" || JSON.stringify(p.repository.rootCommits) !== JSON.stringify([plan.commit]) || !Array.isArray(p.repository.identities) || p.repository.identities.length !== 4 || p.repository.identities.some((/** @type {any} */ identity)=>
     !shape(identity,["path","device","inode"]) || typeof identity.path !== "string" || !path.isAbsolute(identity.path) || !directoryIdentity({device:identity.device,inode:identity.inode})) ||
    p.stageIdentity === null || p.repository.identities[1].device !== p.stageIdentity.device || p.repository.identities[1].inode !== p.stageIdentity.inode)) return false;
  const ref=`refs/supertaskr/initializations/${operationWork(op.id).slice(3)}/${role}`;
  if(p.intent !== null && (!shape(p.intent,["commit","tree","ref","correlationRef"]) || p.intent.commit !== plan.commit || p.intent.tree !== plan.tree || p.intent.ref !== plan.initialRef || p.intent.correlationRef !== ref)) return false;
  if(p.acceptance !== null && (!shape(p.acceptance,["commit","tree","ref","attribution"]) || p.intent === null || p.acceptance.commit !== plan.commit || p.acceptance.tree !== plan.tree || p.acceptance.ref !== plan.initialRef || p.acceptance.attribution !== "exact")) return false;
  if((p.stage === "captured") !== (p.stageIdentity === null) && p.stage !== "git-staging" || ["git-adopted","ref-accepted"].includes(p.stage) && (p.repository === null || p.intent === null) ||
   (p.stage === "ref-accepted") !== (p.acceptance !== null) || !["git-adopted","ref-accepted"].includes(p.stage) && (p.repository !== null || p.intent !== null)) return false;
 }
 const primary=op.claims.find((/** @type {any} */ c)=>c.role === "product");
 if(rec.reservation.file !== primary.file || rec.reservation.takenAt !== primary.takenAt || rec.reservation.releasedAt !== primary.releasedAt ||
  !shape(op.binding,["path","digest","correlationRef","accepted"]) || op.binding.path !== path.join(rec.resource,".supertaskr/workspace.json") || !digest(op.binding.digest) || op.binding.correlationRef !== `refs/supertaskr/initializations/${operationWork(op.id).slice(3)}/binding` || typeof op.binding.accepted !== "boolean") return false;
 const binding=op.request.runtimeWrites.find((/** @type {any} */ f)=>f.path === ".supertaskr/workspace.json");
 if(op.binding.digest !== operationDigest(binding.base64)) return false;
 if(op.acceptance !== null && (!shape(op.acceptance,["product","records","binding","attribution"]) || op.acceptance.attribution !== "exact" || !op.binding.accepted ||
  !ROLES.every((role)=>op.progress[role].acceptance !== null && operationDigest(op.acceptance[role]) === operationDigest(op.progress[role].acceptance)) ||
  operationDigest(op.acceptance.binding) !== operationDigest(op.binding))) return false;
 if(op.claims.some((/** @type {any} */ claim)=>claim.releasedAt !== null) && op.acceptance === null) return false;
 return rec.state === "finished" ? op.acceptance !== null && op.claims.every((/** @type {any} */ c)=>date(c.releasedAt)) : true;
}
