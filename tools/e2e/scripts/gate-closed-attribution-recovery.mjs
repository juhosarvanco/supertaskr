/**
 * Exact historical later-attribution disposition (T-356).
 * CLI: --root <authority-root> --request <JSON-file>. The export accepts the
 * same JSON text (or a JSON object). Retained text is matched syntactically.
 * No admission, collection, completion, callback result or source approval is
 * manufactured. Only the selected existing holds acquire disposition metadata.
 *
 * Request v1: {version,id,target:{attempt,candidate,record:{content,digest},
 * origins},holdKeys,incident:{actor:{agentId,sessionId},events:[{at,event}]},
 * audit:{path,digest},policy,source:null|{attempt,resource,candidate,
 * authorityDigest},predecessor:null|{attempt,id,identity},authorization:{id,digest}}.
 * The separate owner record has kind closed-native-attribution-disposition,
 * exact ordered requests [{attempt,id,identity}], and pinned quoted human
 * evidence. identity hashes the canonical request with ONLY authorization.digest
 * omitted: the authorization can list those identities without a digest cycle.
 * The complete request text, including that digest, is independently retained.
 *
 * Audit v1: {version,actor,transcript:{path,digest},jobs:{path,digest},
 * effects:{path,digest},limits}. Transcript JSON is {version,actor,execution:{endedAt,evidence},events,calls};
 * events are the exact incident {at,event} observations; calls are
 * {toolUseId,turnId,toolName,input,response,completedAt,outcome}. Jobs JSON is
 * {version,actor,jobs:[{kind,id,evidence}]}; effects JSON is
 * {version,actor,calls:[{toolUseId,evidence}]}. These are retained actual audit
 * observations, separately pinned by the owner grant, not an OS isolation proof.
 */
import { spawnSync } from "node:child_process";
import { lstatSync, readFileSync, readdirSync, realpathSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { activeNativeHolds, atomicJson, collectNativeWorkspace, deriveNativeBenchAuthority,
  nativeRecordPath, nativeReservationMetadata, nativeSha256, nativeTransactionRefusalDir,
  readNativeRecord, withNativeTransaction, NativeCodexFinding } from "./native-codex.mjs";
import { admissionAt, defaultRunIo, ownedJobsAlive, readRecord, readReservation, reconcile,
  reservationPath } from "./run-record.mjs";
import { holderVerdict } from "./checkout-currency.mjs";

export const CLOSED_ATTRIBUTION_LIMITS = Object.freeze([
  "Recorded actor transcript, job and effect observations only; a refused call proves only its refusal.",
  "No OS, arbitrary-tool, filesystem-snapshot or outside-arrival isolation is claimed.",
  "A historical receipt grants no fresh admission authority; ordinary admission remains mandatory.",
]);
const sha = nativeSha256;
/** @param {any} v @returns {string} */
function canonical(v) {
  if (Array.isArray(v)) return `[${v.map(canonical).join(",")}]`;
  if (v !== null && typeof v === "object") return `{${Object.keys(v).sort().map(k => `${JSON.stringify(k)}:${canonical(v[k])}`).join(",")}}`;
  return JSON.stringify(v);
}
/** @param {any} a @param {any} b */
const same = (a, b) => canonical(a) === canonical(b);
/** @param {string} code @param {string} message @returns {never} */
function refuse(code, message) { throw new NativeCodexFinding(`CLOSED_ATTRIBUTION_${code}`, `closed-attribution: ${message}`); }
/** @param {any} v @param {string[]} keys */
function shape(v, keys) {
  if (v === null || typeof v !== "object" || Array.isArray(v) || !same(Object.keys(v).sort(), [...keys].sort())) refuse("SCHEMA", "unknown, missing or ambiguous request/evidence fields");
}
/** @param {any} v */
const digest = v => typeof v === "string" && /^[0-9a-f]{64}$/.test(v);
/** @param {any} v */
const id = v => typeof v === "string" && /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(v);
/** @param {any} v */
const instant = v => typeof v === "string" && Number.isFinite(Date.parse(v));
/** @param {string} text @returns {any} */
function parse(text) {
  let value;
  try { value = JSON.parse(text); } catch { return refuse("SCHEMA", "malformed JSON"); }
  // JSON.parse alone silently accepts duplicate keys, including escaped aliases.
  const tokens = text.match(/"(?:\\.|[^"\\])*"|[{}\[\]:,]|[^\s{}\[\]:,]+/g) ?? []; let i = 0;
  const visit = () => {
    const token = tokens[i++];
    if (token === "{") {
      const names = new Set();
      while (tokens[i] !== "}") {
        const name = JSON.parse(/** @type {string} */ (tokens[i++]));
        if (names.has(name)) refuse("SCHEMA", "duplicate JSON keys are ambiguous");
        names.add(name); i++; visit(); if (tokens[i] !== ",") break; i++;
      }
      i++;
    } else if (token === "[") {
      while (tokens[i] !== "]") { visit(); if (tokens[i] !== ",") break; i++; } i++;
    }
  };
  visit(); return value;
}
/** Inspect every namespace component without following symlinks.
 * @param {string} file @returns {string|null} */
function bytes(file) {
  if (!path.isAbsolute(file)) refuse("PHYSICAL", "a physical evidence path must be absolute");
  const parts = path.resolve(file).split(path.sep).filter(Boolean); let current = path.parse(file).root;
  for (let i = 0; i < parts.length; i++) {
    current = path.join(current, /** @type {string} */ (parts[i])); let s;
    try { s = lstatSync(current); } catch (e) { if (/** @type {any} */ (e).code === "ENOENT") return null; throw e; }
    if (i < parts.length - 1 ? !s.isDirectory() : !s.isFile()) refuse("PHYSICAL", "authority/evidence namespace is not physical regular storage");
  }
  const raw = readFileSync(file), text = raw.toString("utf8");
  if (!raw.equals(Buffer.from(text))) refuse("PHYSICAL", "evidence is not valid UTF-8");
  return text;
}
/** @param {string} file */
function required(file) { const raw = bytes(file); if (raw === null) return refuse("EVIDENCE", "required evidence is absent"); return raw; }
/** @param {any} pin */
function evidence(pin) { shape(pin, ["path", "digest"]); if (!digest(pin.digest)) refuse("SCHEMA", "invalid evidence digest"); const raw = required(pin.path); if (sha(raw) !== pin.digest) refuse("EVIDENCE", "pinned evidence bytes changed"); return raw; }
/** @param {string} root @param {string[]} args */
function git(root, args) { const r = spawnSync("git", ["-C", root, ...args], { encoding: "utf8" }); if (r.error || r.status !== 0) return refuse("ORIGINS", "Git origins cannot be established"); return r.stdout.trim(); }
/** @param {string} root @param {any} rec */
function origins(root, rec) {
  if (rec.resource !== realpathSync(rec.resource) || rec.assignment.resource !== rec.resource || rec.assignment.cwd !== rec.resource || realpathSync(git(rec.resource, ["rev-parse", "--show-toplevel"])) !== rec.resource) refuse("ORIGINS", "physical resource identities disagree");
  return { authorityRoot: root, resource: rec.resource, base: rec.assignment.base,
    gitDir: realpathSync(git(rec.resource, ["rev-parse", "--absolute-git-dir"])),
    commonDir: realpathSync(path.resolve(rec.resource, git(rec.resource, ["rev-parse", "--git-common-dir"]))) };
}
/** Read-only pins; this grants no authority and performs no disposition.
 * @param {string} root @param {string} attempt @param {string} candidate */
export function closedAttributionTarget(root, attempt, candidate) {
  root = realpathSync(root); const content = required(nativeRecordPath(root, attempt)), rec = parse(content);
  return { attempt, candidate, record: { content, digest: sha(content) }, origins: origins(root, rec) };
}
/** Read-only policy pins. @param {string} root @param {string} attempt */
export function closedAttributionPolicy(root, attempt) {
  const rec = readRecord(root, attempt), seat = holderVerdict({ root });
  if (["held", "unknown", "unreadable"].includes(seat.state)) refuse("POLICY", "current coordinator seat is not qualified");
  return { admission: admissionAt(root, rec.assignment, "re-entry", { resource: rec.resource }), seat };
}
/** @param {any} request */
export function closedAttributionRequestIdentity(request) {
  const r = typeof request === "string" ? parse(request) : parse(JSON.stringify(request));
  if (r.authorization) delete r.authorization.digest;
  return sha(canonical(r));
}
/** This is syntactic/static validation only, including on historical replay.
 * @param {any} r */
function validate(r) {
  shape(r, ["version", "id", "target", "holdKeys", "incident", "audit", "policy", "source", "predecessor", "authorization"]);
  shape(r.target, ["attempt", "candidate", "record", "origins"]); shape(r.target.record, ["content", "digest"]);
  shape(r.target.origins, ["authorityRoot", "resource", "base", "gitDir", "commonDir"]);
  shape(r.authorization, ["id", "digest"]); shape(r.incident, ["actor", "events"]); shape(r.incident.actor, ["agentId", "sessionId"]); shape(r.audit, ["path", "digest"]);
  if (r.version !== 1 || !id(r.id) || !/^([A-Za-z0-9][A-Za-z0-9._-]{0,127})-a[12]$/.test(r.target.attempt) || !/^[0-9a-f]{40}$/.test(r.target.candidate) ||
      typeof r.target.record.content !== "string" || !digest(r.target.record.digest) || sha(r.target.record.content) !== r.target.record.digest ||
      !id(r.authorization.id) || !digest(r.authorization.digest) || !digest(r.audit.digest) ||
      !id(r.incident.actor.agentId) || !id(r.incident.actor.sessionId) || !Array.isArray(r.holdKeys) || r.holdKeys.length === 0 ||
      r.holdKeys.some((/** @type {any} */ k) => typeof k !== "string" || k === "") || new Set(r.holdKeys).size !== r.holdKeys.length ||
      !Array.isArray(r.incident.events) || r.incident.events.length === 0) refuse("SCHEMA", "invalid exact request identities");
  if (new Set(r.incident.events.map(canonical)).size !== r.incident.events.length) refuse("INCIDENT", "duplicate incident observations are ambiguous");
  for (const e of r.incident.events) {
    shape(e, ["at", "event"]); shape(e.event, ["event", "sessionId", "turnId", "agentId", "toolName", "toolUseId"]);
    if (!instant(e.at) || e.event.agentId !== r.incident.actor.agentId || e.event.sessionId !== r.incident.actor.sessionId || !(id(e.event.turnId) || (e.event.event === "SubagentStop" && e.event.turnId === null)) ||
        !["SubagentStart", "PreToolUse", "PostToolUse", "SubagentStop"].includes(e.event.event)) refuse("INCIDENT", "unsupported or mismatched incident binding");
  }
  if (r.source !== null) { shape(r.source, ["attempt", "resource", "candidate", "authorityDigest"]); if (!digest(r.source.authorityDigest)) refuse("SCHEMA", "invalid source digest"); }
  if (r.predecessor !== null) { shape(r.predecessor, ["attempt", "id", "identity"]); if (!id(r.predecessor.id) || !digest(r.predecessor.identity)) refuse("SCHEMA", "invalid predecessor identity"); }
  const original = parse(r.target.record.content);
  if (original.attempt !== r.target.attempt || original.resource !== r.target.origins.resource) refuse("IDENTITY", "request selects mismatched execution bytes");
}
/** @param {any} r @param {string} text @param {string} at */
function receipt(r, text, at) {
  return { version: 1, id: r.id, attempt: r.target.attempt, identity: closedAttributionRequestIdentity(r), requestDigest: sha(text),
    authorizationDigest: r.authorization.digest, at, holdKeys: r.holdKeys, incidentDigest: sha(canonical(r.incident)),
    auditDigest: r.audit.digest, policyDigest: sha(canonical(r.policy)), sourceDigest: sha(canonical(r.source)), limits: CLOSED_ATTRIBUTION_LIMITS, admissionAuthority: false };
}
/** Receipt validity depends on retained immutable data, never current permission.
 * @param {any} rec @param {string} text @param {any} r @returns {any|null} */
function historical(rec, text, r) {
  const entries = rec.native?.attributionDispositions ?? [];
  if (!Array.isArray(entries)) refuse("RECEIPT", "stored dispositions are inconsistent");
  let found = null; const ids = new Set(); const keys = new Set();
  for (const entry of entries) {
    shape(entry, ["version", "requestText", "request", "receipt", "receiptDigest"]);
    const saved = parse(entry.requestText); validate(saved);
    if (saved.target.attempt !== rec.attempt || entry.version !== 1 || ids.has(saved.id) || !same(saved, entry.request) || !instant(entry.receipt?.at) ||
        !same(entry.receipt, receipt(saved, entry.requestText, entry.receipt.at)) || sha(canonical(entry.receipt)) !== entry.receiptDigest) refuse("RECEIPT", "stored immutable request or receipt is invalid");
    ids.add(saved.id);
    const original = parse(saved.target.record.content);
    for (const key of saved.holdKeys) {
      const before = original.native.holds.filter((/** @type {any} */ h) => h.key === key), now = rec.native.holds.filter((/** @type {any} */ h) => h.key === key);
      if (keys.has(key) || before.length !== 1 || now.length !== 1 || !same(now[0], { ...before[0], clearedAt: entry.receipt.at, clearedBy: `closed-attribution:${entry.receiptDigest}` })) refuse("RECEIPT", "selected disposition and retained receipt disagree");
      keys.add(key);
    }
    if (saved.id === r.id) {
      if (entry.requestText !== text) refuse("IDENTIFIER_REUSED", "retained request name was reused with changed syntax or contents");
      found = entry.receipt;
    }
  }
  return found;
}
/** @param {string} root @returns {Record<string,string>} */
function inventory(root) {
  const result = /** @type {Record<string,string>} */ ({}), home = path.join(root, ".supertaskr", "runs");
  /** @param {string} dir */
  const walk = dir => {
    let names; try { names = readdirSync(dir).sort(); } catch (e) { if (/** @type {any} */ (e).code === "ENOENT") return; throw e; }
    for (const name of names) {
      if (dir === path.join(home, "reservations") && [".native-transaction.lock", ".native-transaction.lock.recovery"].includes(name)) continue;
      const file = path.join(dir, name), s = lstatSync(file);
      if (s.isDirectory()) walk(file);
      else if (name.endsWith(".json") || name.endsWith(".native-hold")) result[path.relative(home, file)] = sha(required(file));
      else if (s.isSymbolicLink()) refuse("PHYSICAL", "run authority contains a symbolic link");
    }
  };
  walk(home); return result;
}
/** @param {string} root @returns {Record<string,string>} */
function quarantineInventory(root) {
  const all = inventory(root), result = /** @type {Record<string,string>} */ ({});
  for (const [rel, hash] of Object.entries(all)) {
    if (rel.endsWith(".native-hold") || rel.startsWith("reservations/native-transaction-")) result[rel] = hash;
    else if (/^[^/]+\/[^/]+\.json$/.test(rel)) {
      const rec = parse(required(path.join(root, ".supertaskr", "runs", rel)));
      const holds = rec.native?.holds;
      if (Array.isArray(holds)) result[`${rel}#quarantine`] = sha(canonical(holds.filter((/** @type {any} */ h) => ["native-transaction-refusal", "unreadable-authority"].includes(h.code))));
    }
  }
  return result;
}
/** @param {string} root */
function noPending(root) {
  const all = inventory(root);
  if (Object.keys(all).some(k => k.endsWith(".native-hold") || k.startsWith("reservations/native-transaction-refusals/"))) refuse("PENDING_FAULT", "raw fault or emergency authority requires normal quarantine first");
}
/** @param {any} rec */
function ceased(rec) {
  const n = rec.native, b = n?.binding, e = rec.execution;
  if (!["finished", "failed"].includes(rec.state) || !b || e?.pid !== null || e?.harnessId !== b.agentId || !instant(e.endedAt) || !instant(e.boundAt) || Date.parse(e.endedAt) < Date.parse(e.boundAt) ||
      n.start?.agentId !== b.agentId || n.start?.turnId !== b.startTurnId || b.childReportedThreadId !== b.agentId || b.canonicalTaskName !== n.launch.taskName ||
      !instant(b.boundAt) || Date.parse(e.boundAt) < Date.parse(b.boundAt) || n.probes.length !== 1 || !n.probes.some((/** @type {any} */ p) => p.agentId === b.agentId && p.turnId === b.startTurnId && p.toolUseId === b.identityProbeToolUseId && instant(p.postAt) && Date.parse(p.postAt) <= Date.parse(b.boundAt) && p.reportedThreadId === b.agentId) ||
      !rec.events.some((/** @type {any} */ x) => x.op === "observe" && x.at === e.endedAt && x.to === rec.state && x.why === `completion evidence (RUN-DONE ${rec.state === "finished" ? "ok" : "failed"}) with the execution ended and no owned job left`) ||
      n.inflight.length !== 0 || !Array.isArray(rec.ownedJobs) || ownedJobsAlive(rec, defaultRunIo()).length !== 0 || reconcile(rec, defaultRunIo()).verdict !== "ended") refuse("CESSATION", "native terminal execution, exact binding or job cessation is unproven");
}
/** @param {any[]} jobs */
function probeJobs(jobs) {
  for (const job of jobs) {
    if (!/^[1-9]\d*$/.test(job.id) || !["pid", "port"].includes(job.kind)) refuse("JOBS", "unknown incident actor job identity");
    if (job.kind === "pid") {
      try { process.kill(Number(job.id), 0); refuse("JOBS", "incident actor job remains live"); }
      catch (e) { if (/** @type {any} */ (e).code !== "ESRCH") throw e; }
    } else {
      if (Number(job.id) > 65535) refuse("JOBS", "invalid incident actor port");
      const p = spawnSync("lsof", ["-nP", `-iTCP:${job.id}`, "-sTCP:LISTEN"], { encoding: "utf8" });
      if (p.error || p.status !== 1 || p.stdout.trim() !== "") refuse("JOBS", "incident actor port is live or unknown");
    }
  }
}
/** @param {any} r */
function audit(r) {
  const a = parse(evidence(r.audit)); shape(a, ["version", "actor", "transcript", "jobs", "effects", "limits"]);
  const t = parse(evidence(a.transcript)), j = parse(evidence(a.jobs)), e = parse(evidence(a.effects));
  shape(t, ["version", "actor", "execution", "events", "calls"]); shape(j, ["version", "actor", "jobs"]); shape(e, ["version", "actor", "calls"]);
  if ([a, t, j, e].some(x => x.version !== 1 || !same(x.actor, r.incident.actor)) || !same(a.limits, CLOSED_ATTRIBUTION_LIMITS) || !same(t.events, r.incident.events) || !Array.isArray(t.calls) || !Array.isArray(j.jobs) || !Array.isArray(e.calls)) refuse("AUDIT", "complete exact actor transcript/job/effect audit is absent or ambiguous");
  shape(t.execution, ["endedAt", "evidence"]);
  const state = parse(evidence(t.execution.evidence)); shape(state, ["version", "actor", "status", "endedAt", "inflight", "ownedJobs"]);
  if (state.version !== 1 || !same(state.actor, r.incident.actor) || state.status !== "ended" || !instant(state.endedAt) || state.endedAt !== t.execution.endedAt || !same(state.inflight, []) || !same(state.ownedJobs, [])) refuse("AUDIT", "recorded actor native cessation remains unknown");
  const seen = new Set();
  for (const call of t.calls) {
    shape(call, ["toolUseId", "turnId", "toolName", "input", "response", "completedAt", "outcome"]);
    if (!id(call.toolUseId) || !id(call.turnId) || typeof call.toolName !== "string" || typeof call.input !== "string" || typeof call.response !== "string" || call.response === "" || !instant(call.completedAt) || !["refused", "completed"].includes(call.outcome) || seen.has(call.toolUseId)) refuse("AUDIT", "actor native call has no unambiguous terminal observation");
    if (Date.parse(call.completedAt) > Date.parse(state.endedAt)) refuse("AUDIT", "actor completion precedes a pending native call");
    seen.add(call.toolUseId);
    const effects = e.calls.filter((/** @type {any} */ x) => x.toolUseId === call.toolUseId);
    if (effects.length !== 1) refuse("AUDIT", "actor effect audit is incomplete");
    shape(effects[0], ["toolUseId", "evidence"]); evidence(effects[0].evidence);
  }
  if (e.calls.length !== seen.size || r.incident.events.some((/** @type {any} */ x) => x.event.toolUseId !== null && !t.calls.some((/** @type {any} */ c) => c.toolUseId === x.event.toolUseId && c.turnId === x.event.turnId && c.toolName === x.event.toolName))) refuse("AUDIT", "incident tool bindings differ from actual actor observations");
  for (const job of j.jobs) { shape(job, ["kind", "id", "evidence"]); evidence(job.evidence); }
  probeJobs(j.jobs);
}
/** @param {string} root @param {any} r */
function authorization(root, r) {
  const file = path.join(root, ".supertaskr", "native-attribution-authorizations", `${r.authorization.id}.json`), raw = required(file), a = parse(raw);
  shape(a, ["version", "kind", "id", "authorityRoot", "authorizedBy", "recordedBy", "recordedAt", "evidenceReference", "requests"]);
  shape(a.evidenceReference, ["path", "digest", "quote"]);
  if (sha(raw) !== r.authorization.digest || a.version !== 1 || a.kind !== "closed-native-attribution-disposition" || a.id !== r.authorization.id || a.authorityRoot !== root || a.authorizedBy !== "owner" || a.recordedBy !== "coordinator" || !instant(a.recordedAt) || typeof a.evidenceReference.quote !== "string" || a.evidenceReference.quote.trim() === "" || realpathSync(a.evidenceReference.path) === file ||
      !required(a.evidenceReference.path).includes(a.evidenceReference.quote) || sha(required(a.evidenceReference.path)) !== a.evidenceReference.digest || !Array.isArray(a.requests) || ![1, 2].includes(a.requests.length)) refuse("AUTHORIZATION", "separate pinned owner record and exact quoted human grant are required");
  const identities = a.requests; const stem = r.target.attempt.replace(/-a[12]$/, "");
  identities.forEach((/** @type {any} */ x, /** @type {number} */ i) => { shape(x, ["attempt", "id", "identity"]); if (x.attempt !== `${stem}-a${i + 1}` || !id(x.id) || !digest(x.identity)) refuse("AUTHORIZATION", "ordered authorization targets are not exact a1/a2 identities"); });
  if (new Set(identities.map((/** @type {any} */ x) => x.id)).size !== identities.length) refuse("AUTHORIZATION", "request identifiers are ambiguous");
  const index = r.target.attempt.endsWith("-a1") ? 0 : 1;
  if (!same(identities[index], { attempt: r.target.attempt, id: r.id, identity: closedAttributionRequestIdentity(r) })) refuse("AUTHORIZATION", "immutable authorized request content differs");
  if (index === 0 ? r.predecessor !== null || r.source !== null : !same(r.predecessor, identities[0]) || r.source?.attempt !== identities[0].attempt) refuse("PREDECESSOR", "a2 needs its exact authorized a1 predecessor and source");
}
/** @param {string} root @param {any} r */
function qualify(root, r) {
  if (r.target.origins.authorityRoot !== root || required(nativeRecordPath(root, r.target.attempt)) !== r.target.record.content) refuse("RECORD", "selected original record changed");
  const rec = /** @type {any} */ (readRecord(root, r.target.attempt)), n = rec.native;
  if (!same(rec, readNativeRecord(root, rec.attempt)) || !same(origins(root, rec), r.target.origins) || !rec.writer || n.authorityRoot !== root || rec.assignmentDigest !== `sha256:${sha(JSON.stringify(rec.assignment))}` || rec.brief.digest !== `sha256:${sha(required(rec.assignment.brief))}`) refuse("IDENTITY", "original native identities, physical scope or evidence differ");
  ceased(rec); probeJobs(rec.ownedJobs);
  if (n.launch.sessionId !== r.incident.actor.sessionId || n.binding.agentId === r.incident.actor.agentId) refuse("INCIDENT", "later actor cannot replace the original native identity or session");
  const holds = activeNativeHolds(rec), selected = holds.filter((/** @type {any} */ h) => r.holdKeys.includes(h.key));
  if (selected.length !== r.holdKeys.length || holds.length !== selected.length || new Set(selected.map((/** @type {any} */ h) => h.key)).size !== selected.length || selected.some((/** @type {any} */ h) => !["ambiguous-agent-attribution", "unknown-worker"].includes(h.code) || !r.incident.events.some((/** @type {any} */ x) => x.at === h.recordedAt && same(x.event, h.event)))) refuse("HOLD", "selected later-attribution hold set is incomplete, unrelated or unsupported");
  if (selected.some((/** @type {any} */ h) => h.code === "ambiguous-agent-attribution"
      ? h.event.event !== "SubagentStart" || h.key !== `start-attribution:${h.event.agentId}:${h.event.turnId}`
      : h.event.event === "SubagentStart" || h.key !== `unknown-worker:${h.event.agentId}:${h.event.event}`)) refuse("INCIDENT", "hold keys do not identify the supported native attribution events");
  if (r.incident.events.some((/** @type {any} */ x) => !selected.some((/** @type {any} */ h) => h.recordedAt === x.at && same(h.event, x.event)))) refuse("INCIDENT", "incident contains unbound extra events");
  const earliest = Math.min(...r.incident.events.map((/** @type {any} */ x) => Date.parse(x.at))), c = n.collection;
  if (!instant(rec.reservation?.releasedAt) || Date.parse(rec.reservation.releasedAt) >= earliest || Date.parse(rec.execution.endedAt) >= earliest || !instant(c?.checkedAt) || Date.parse(c.checkedAt) >= earliest) refuse("INCIDENT_TIME", "completion, own collection and reservation release must precede every selected incident");
  if (!c || c.eligible !== true || c.actualIndependentCheck !== true || c.phase !== "collect" || c.ref !== r.target.candidate || c.check?.head !== r.target.candidate || c.check?.clean !== true || c.inflight?.length !== 0 || c.holds?.length !== 0 || c.ownedJobs?.length !== 0 || c.terminalStateAuthority !== "T-311" || !rec.events.some((/** @type {any} */ x) => x.op === "collect" && x.at === c.checkedAt && x.to === rec.state) || !rec.refs.includes(r.target.candidate)) refuse("COLLECTION", "own original qualifying collection is absent");
  if (bytes(reservationPath(root, rec.resource)) !== null || readReservation(root, rec.resource) !== null) refuse("RESERVATION", "resource reservation remains or later ownership exists");
  for (const [rel] of Object.entries(inventory(root))) {
    if (rel.includes("/native-transaction-") || !/^[^/]+\/[^/]+\.json$/.test(rel)) continue;
    const file = path.join(root, ".supertaskr", "runs", rel), other = parse(required(file));
    if (nativeReservationMetadata(root, file, other)) continue;
    if (other.attempt === rec.attempt) continue;
    if (other.version !== 1 || typeof other.attempt !== "string" || typeof other.writer !== "boolean" || !other.assignment || other.assignmentDigest !== `sha256:${sha(JSON.stringify(other.assignment))}` || (other.writer ? typeof other.resource !== "string" || other.resource !== path.resolve(other.assignment.resource) : other.resource !== null) || !Array.isArray(other.ownedJobs) || !Array.isArray(other.events)) refuse("OWNERSHIP", "another recorded authority is materially ambiguous");
    if (other.writer && other.resource === rec.resource && (!instant(other.reservation?.takenAt) || Date.parse(other.reservation.takenAt) >= Date.parse(rec.reservation.releasedAt))) refuse("OWNERSHIP", "later ownership of the target resource disqualifies disposition");
    if (other.writer && other.resource === rec.resource) { ceased(other); probeJobs(other.ownedJobs); }
    if (other.native?.binding?.agentId === r.incident.actor.agentId || other.native?.start?.agentId === r.incident.actor.agentId) { ceased(other); probeJobs(other.ownedJobs); }
  }
  authorization(root, r); audit(r);
  if (!same(closedAttributionPolicy(root, rec.attempt), r.policy)) refuse("POLICY", "current policy inputs differ");
  if (r.predecessor !== null) {
    const sourceRaw = required(nativeRecordPath(root, r.predecessor.attempt)), source = parse(sourceRaw), entries = source.native?.attributionDispositions ?? [];
    const previous = entries.filter((/** @type {any} */ x) => x.request?.id === r.predecessor.id);
    if (previous.length !== 1 || previous[0].request?.authorization?.id !== r.authorization.id || previous[0].receipt?.authorizationDigest !== r.authorization.digest || previous[0].receipt?.identity !== r.predecessor.identity || historical(source, previous[0].requestText, previous[0].request) === null) refuse("PREDECESSOR", "exact successful a1 receipt is missing");
    ceased(source); probeJobs(source.ownedJobs);
    const prepared = n.preparation?.authority;
    if (!prepared || prepared.executorAttempt !== r.source.attempt || prepared.resource !== rec.resource || r.source.resource !== rec.resource || r.source.candidate !== r.target.candidate) refuse("SOURCE", "a2 source does not match its original prepared authority");
    const derived = deriveNativeBenchAuthority(source, { resource: r.source.resource, candidate: r.source.candidate, at: prepared.preparedAt });
    if (sha(canonical(derived)) !== r.source.authorityDigest || !same(derived, prepared) || !same(collectNativeWorkspace(source, { expectedRef: r.source.candidate, final: true }), source.native.collection.check)) refuse("SOURCE", "fresh source authority or qualifying source state changed");
  } else if (n.profile === "detached-verifier" || rec.assignment.role !== "executor") refuse("SOURCE", "a1 must be the original collected executor source");
  const check = collectNativeWorkspace(rec, { expectedRef: r.target.candidate, final: true });
  if (!check.clean || check.untracked.length !== 0 || check.tracked.some(x => ["staged", "unstaged"].includes(x.layer)) || !same(check, c.check)) refuse("WORKSPACE", "qualifying candidate or physical scope changed");
  return rec;
}
/** Direct public operation. Errors retain an observational outcome; an error
 * never proves that rename did not happen or that lock release completed.
 * @param {string} root @param {any} request */
export function recoverClosedAttribution(root, request) {
  let publicationAttempted = false; let baseline = /** @type {Record<string,string>|null} */ (null); let r = /** @type {any} */ (null); let text = ""; let initialQuarantine = /** @type {Record<string,string>|null} */ (null);
  try {
    root = realpathSync(root); text = typeof request === "string" ? request : JSON.stringify(request, (_key, value) => {
      if (["undefined", "function", "symbol", "bigint"].includes(typeof value) || (typeof value === "number" && !Number.isFinite(value))) refuse("SCHEMA", "request must contain JSON values only");
      return value;
    }); r = parse(text); validate(r);
    const rec = parse(required(nativeRecordPath(root, r.target.attempt))), prior = historical(rec, text, r);
    if (prior !== null) return { ok: true, historicalReplay: true, receipt: prior, admissionAuthority: false };
    noPending(root); baseline = inventory(root); initialQuarantine = quarantineInventory(root);
    return withNativeTransaction(root, { operation: "closed-native-attribution-disposition", onAcquired: () => noPending(root) }, () => {
      const current = parse(required(nativeRecordPath(root, r.target.attempt)));
      if (historical(current, text, r) !== null) refuse("RECEIPT_RACE", "receipt appeared after acquisition; explicit subsequent retry required; lock release is not certified by this error");
      noPending(root);
      if (!same(inventory(root), baseline)) refuse("FAULT_CHANGED", "records or retained absorbed-fault inventory changed during acquisition/normal quarantine");
      const target = qualify(root, r), at = new Date().toISOString(), result = receipt(r, text, at), receiptDigest = sha(canonical(result));
      const next = parse(JSON.stringify(target));
      for (const hold of next.native.holds) if (r.holdKeys.includes(hold.key)) { hold.clearedAt = at; hold.clearedBy = `closed-attribution:${receiptDigest}`; }
      next.native.attributionDispositions = [...(next.native.attributionDispositions ?? []), { version: 1, requestText: text, request: r, receipt: result, receiptDigest }];
      publicationAttempted = true;
      atomicJson(nativeRecordPath(root, r.target.attempt), next, () => {
        noPending(root);
        if (!same(inventory(root), baseline)) refuse("FAULT_CHANGED", "records/raw/emergency/retained fault inventory changed before publication");
        qualify(root, r);
        noPending(root);
        if (!same(inventory(root), baseline)) refuse("FAULT_CHANGED", "last cooperative inventory changed before publication");
      });
      return { ok: true, historicalReplay: false, receipt: result, admissionAuthority: false };
    });
  } catch (error) {
    const e = /** @type {any} */ (error); let observed = null; let outcome = publicationAttempted ? "uncertain" : "not-applied";
    try { if (r !== null) observed = historical(parse(required(nativeRecordPath(root, r.target.attempt))), text, r); if (observed !== null) outcome = "committed"; else if (r !== null && required(nativeRecordPath(root, r.target.attempt)) === r.target.record.content) outcome = "not-applied"; } catch { /* missing/ambiguous data never proves non-application */ }
    let quarantineChanged = null;
    try { if (initialQuarantine !== null) quarantineChanged = !same(quarantineInventory(root), initialQuarantine); } catch { /* retain unknown */ }
    e.dispositionOutcome = { outcome, publicationAttempted, observedReceipt: observed, lockRelease: "unverified", quarantineChanged, admissionAuthority: false };
    throw e;
  }
}
/** @param {string[]} argv */
export function main(argv) {
  if (argv.length !== 4 || argv[0] !== "--root" || argv[2] !== "--request") refuse("CLI", "use --root <authority-root> --request <JSON-file>");
  return recoverClosedAttribution(/** @type {string} */ (argv[1]), required(path.resolve(/** @type {string} */ (argv[3]))));
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try { console.log(JSON.stringify(main(process.argv.slice(2)))); }
  catch (error) { const e = /** @type {any} */ (error); console.error(JSON.stringify({ ok: false, code: e.code ?? "CLOSED_ATTRIBUTION_ERROR", error: String(e), ...e.dispositionOutcome })); process.exitCode = 1; }
}
