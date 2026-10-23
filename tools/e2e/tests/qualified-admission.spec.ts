import childProcess, { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs, { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { syncBuiltinESMExports } from "node:module";
import net from "node:net";
import http from "node:http";
import https from "node:https";
import os from "node:os";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { admissionPreflight, normalizeAdmissionPreflight } from "../scripts/qualified-admission.mjs";
import { composeGrantSnapshot } from "../scripts/dispatch-brief.mjs";
import { bindRun, collectRun, observeRun, readAssignment, startRun, stopRun } from "../scripts/run-record.mjs";
import { activeNativeHolds, handleNativeEvent, NATIVE_CODEX_HARNESS, NATIVE_IDENTITY_PROBE, readNativeRecord } from "../scripts/native-codex.mjs";
import { measureProductIdentity, WORKSPACE_ASSOCIATION_REL_PATH, WORKSPACE_BINDING_REL_PATH } from "../scripts/workspace.mjs";
import { NO_BACKGROUND_MAINTENANCE, removeGitFixture } from "./git-fixture";

const SOURCE = path.resolve(import.meta.dirname, "../../..");
const CARD = "docs/tasks/T-999-private.md";
const COMPONENT = "docs/architecture/components/C-01-owned.md";
const PRIVATE = "PRIVATE_HISTORY_MARKER_T352";
const ENV = { ...process.env, GIT_AUTHOR_NAME: "Preflight fixture", GIT_AUTHOR_EMAIL: "fixture@example.invalid",
  GIT_COMMITTER_NAME: "Preflight fixture", GIT_COMMITTER_EMAIL: "fixture@example.invalid" };
const sha = (value: string | Buffer) => createHash("sha256").update(value).digest("hex");
function git(root: string, args: string[]) {
  return execFileSync("git", ["-C", root, ...NO_BACKGROUND_MAINTENANCE, ...args], { encoding: "utf8", env: ENV, stdio: ["ignore", "pipe", "pipe"] }).trim();
}
function put(root: string, file: string, text: string) {
  mkdirSync(path.dirname(path.join(root, file)), { recursive: true }); writeFileSync(path.join(root, file), text);
}
function commit(root: string) {
  git(root, ["add", ".", ":(exclude).supertaskr"]); git(root, ["commit", "-qm", "fixture snapshot"]); return git(root, ["rev-parse", "HEAD"]);
}
function card(id = "T-999") {
  return `---\nid: ${id}\ntitle: Private fixture\nfeature: F-04\nmilestone: 4\npriority: 1\nsize: M\nstatus: planned\ntouches: [product::src/file, records::rules/file]\n---\n\nActive fixture contract.\n\n## Acceptance criteria\n\n- WHEN previewed THE contract SHALL stay private.\n\n## Implementation notes\n\n${PRIVATE} notes\n\n## Reports\n\n${PRIVATE} report\n\n## Verdicts\n\n${PRIVATE} verdict\n\n## Archived grant history\n\n${PRIVATE} approval history\n`;
}
function fixture(colocated = false, format: "sha1" | "sha256" = "sha1", recordsFormat = format) {
  const dir = realpathSync(mkdtempSync(path.join(os.tmpdir(), "preflight-T-352-")));
  const product = path.join(dir, "product"), records = colocated ? product : path.join(dir, "records");
  for (const root of new Set([product, records])) {
    mkdirSync(root); git(root, ["init", "-q", "--initial-branch=main", `--object-format=${root === product ? format : recordsFormat}`]);
    put(root, "src/file", "product input\n"); put(root, "rules/file", "records input\n");
    commit(root);
  }
  put(product, "method/runtime/process-schema.yaml", readFileSync(path.join(SOURCE, "method/runtime/process-schema.yaml"), "utf8"));
  commit(product);
  if (!colocated) put(product, WORKSPACE_BINDING_REL_PATH, JSON.stringify({ version: 1, projectId: "preflight-fixture", productRoot: product, recordsRoot: records }));
  const identity = measureProductIdentity(product);
  put(records, WORKSPACE_ASSOCIATION_REL_PATH, JSON.stringify({ version: 1, projectId: "preflight-fixture", product: { objectFormat: identity.objectFormat, rootCommits: identity.rootCommits } }));
  put(records, CARD, card());
  put(records, COMPONENT, '---\nid: C-01\nname: Owned\npaths: ["product::src/**"]\ntouch_slugs: [owned]\n---\n');
  put(records, "docs/architecture/components/C-02-other.md", '---\nid: C-02\nname: Other\npaths: ["records::rules/**"]\ntouch_slugs: [other]\n---\n');
  const recordsBase = commit(records), productBase = git(product, ["rev-parse", colocated ? "HEAD^" : "HEAD"]);
  const blob = git(records, ["rev-parse", `${recordsBase}:${CARD}`]);
  function grant(options: { approval?: string; recovery?: string; order?: string[]; blobs?: Record<string, string>; until?: string; revoked?: boolean } = {}) {
    const order = options.order ?? ["T-999"], blobs = options.blobs ?? { "T-999": blob };
    const block = `dispatch:\n  approval: ${options.approval ?? "each"}\n  recovery: ${options.recovery ?? "repairs"}\n  grant:\n    given_by: fixture owner\n    at: "2026-10-23T00:00:00Z"\n    revision: 3\n    order: [${order.join(", ")}]\n${options.until ? `    until: ${options.until}\n` : ""}    cards:\n${order.map((id) => `      ${id}: ${blobs[id]}\n`).join("")}${options.revoked ? '  revoked:\n    at: "2026-10-23T01:00:00Z"\n    by: fixture owner\n' : ""}  history: []\n`;
    put(product, ".supertaskr/dispatch-grant.yaml", composeGrantSnapshot({ blockText: block, root: product, revision: 3, writtenBy: "fixture" }));
  }
  if (format === "sha1") grant();
  function request() {
    return { version: 1, authorityRoot: product, projectId: "preflight-fixture", revisions: { product: productBase, records: recordsBase },
      taskId: "T-999", roles: ["product", "records"], legacyTokenMap: {},
      admission: { boundary: "lane-cut", role: "executor", kind: "explicit", parent: "", evidence: "", scope: "repair", attempt: null } };
  }
  function record(state: string) {
    // Each ledger scenario starts from an independently empty fixture ledger.
    // Produce its complete record and digest through the normal public writer.
    rmSync(path.join(product, ".supertaskr/runs"), { recursive: true, force: true });
    const assignment = { kind: "card", id: "T-999", resource: "none", role: "executor", harness: "fixture", model: "fixture", effort: "none",
      base: productBase, brief: path.join(dir, "brief-T-352.md"), cwd: product, deadline: "none", budget: "none" };
    put(dir, "brief-T-352.md", "Owned fixture: no model, worker process or job is launched.\n");
    put(dir, "assignment-T-352.json", JSON.stringify(assignment));
    const started = startRun(product, { assignment: readAssignment(path.join(dir, "assignment-T-352.json")) });
    expect(started.reservation).toBeNull();
    expect(started.record.assignmentDigest).toBe(`sha256:${sha(JSON.stringify(started.record.assignment))}`);
    if (state === "finished") {
      expect(stopRun(product, { attempt: started.record.attempt,
        evidence: "Fixture launched no worker or owned job.\nRUN-DONE ok" }).record.state).toBe("stopped");
    }
  }
  return { dir, product, records, productBase, recordsBase, blob, grant, request, record,
    cleanup: () => removeGitFixture(dir, "private preflight T-352") };
}
function tree(root: string): unknown[] {
  const out: unknown[] = [];
  function visit(file: string) {
    const stat = lstatSync(file, { bigint: true });
    out.push([path.relative(root, file), stat.mode.toString(), stat.mtimeNs.toString(), stat.isFile() ? sha(readFileSync(file)) : "directory"]);
    if (stat.isDirectory()) for (const entry of readdirSync(file).sort()) visit(path.join(file, entry));
  }
  visit(root); return out;
}
/** Intercept mutation/job/remote surfaces as well as comparing every fixture
 * file (including .git, runtime authority, refs and directory clocks).
 * Git reads are observed independently; generated consumers cannot hide a job.
 */
async function observedRead<T>(root: string, operation: () => Promise<T>) {
  const before = tree(root), calls: string[][] = [], effects: string[] = [];
  const restores: (() => void)[] = [];
  function replace(object: any, key: string, replacement: any) {
    const original = object[key]; object[key] = replacement; restores.push(() => { object[key] = original; });
  }
  const block = (name: string) => (..._args: unknown[]) => { effects.push(name); throw new Error(`intercepted ${name}`); };
  replace(childProcess, "execFileSync", (file: string, args: string[], opts: any) => {
    calls.push([file, ...args]);
    if (file !== "git" || args.some((a) => ["fetch", "push", "clone", "commit", "checkout", "reset", "update-ref", "add", "gc", "maintenance"].includes(a))) return block("process-mutation")();
    return execOriginal(file, args, opts);
  });
  const execOriginal = execFileSync;
  const spawnOriginal = childProcess.spawnSync;
  replace(childProcess, "spawnSync", (file: string, args: string[], opts: any) => {
    calls.push([file, ...args]);
    if (file !== "git" || args.some((a) => ["fetch", "push", "clone", "commit", "checkout", "reset", "update-ref", "add", "gc", "maintenance"].includes(a))) return block("process-mutation")();
    return spawnOriginal(file, args, opts);
  });
  for (const key of ["spawn", "exec", "execSync", "execFile", "fork"]) replace(childProcess, key, block(key));
  const openOriginal = fs.openSync;
  replace(fs, "openSync", (file: string, flags: string, mode: any) => flags === "r" ? openOriginal(file, flags, mode) : block("openSync")());
  for (const key of ["writeFileSync", "appendFileSync", "mkdirSync", "renameSync", "rmSync", "unlinkSync", "chmodSync", "utimesSync"])
    replace(fs, key, block(key));
  for (const key of ["writeFile", "appendFile", "mkdir", "rename", "rm", "unlink", "chmod", "utimes"])
    replace(fs.promises, key, block(`async-${key}`));
  for (const key of ["watch", "watchFile", "createWriteStream"]) replace(fs, key, block(key));
  for (const api of [http, https]) for (const key of ["request", "get"]) replace(api, key, block(`remote-${key}`));
  for (const key of ["connect", "createConnection"]) replace(net, key, block(`remote-${key}`));
  replace(net.Socket.prototype, "connect", block("remote-socket"));
  replace(globalThis, "fetch", block("fetch"));
  replace(globalThis, "setTimeout", block("timer")); replace(globalThis, "setInterval", block("watcher"));
  syncBuiltinESMExports();
  let value!: T, thrown: unknown;
  try { value = await operation(); } catch (error) { thrown = error; }
  finally { for (const restore of restores.reverse()) restore(); syncBuiltinESMExports(); }
  expect(effects).toEqual([]); expect(tree(root)).toEqual(before);
  expect(calls.length).toBeGreaterThan(0); expect(calls.every((call) => call[0] === "git")).toBe(true);
  if (thrown) throw thrown;
  return value;
}

test("private preflight selects exact committed private bytes without a product card or worker and exposes immutable blinded origins", async () => {
  for (const colocated of [false, true]) {
    const fx = fixture(colocated);
    try {
      if (!colocated) expect(existsSync(path.join(fx.product, CARD))).toBe(false);
      expect(readdirSync(fx.dir).sort()).toEqual(colocated ? ["product"] : ["product", "records"]);
      const beforeRef = git(fx.product, ["show-ref"]);
      const preview = await observedRead(fx.dir, () => admissionPreflight(fx.request()));
      const grantText = readFileSync(path.join(fx.product, ".supertaskr/dispatch-grant.yaml"), "utf8");
      const grantBlock = grantText.slice(grantText.indexOf("\ndispatch:") + 1).trimEnd() + "\n";
      expect(grantBlock.startsWith("dispatch:\n")).toBe(true);
      expect(preview).toMatchObject({ permitted: true, status: "currently-permitted-preparation", admitted: false, reserved: false, started: false, consumed: false,
        grant: { revision: 3, digest: sha(grantBlock) } });
      expect(preview.receipt.cardBlobId).toBe(git(fx.records, ["rev-parse", `${fx.recordsBase}:${CARD}`]));
      expect(preview.receipt.registry).toHaveLength(2);
      for (const entry of preview.receipt.registry) expect(entry.blobId).toBe(git(fx.records, ["rev-parse", `${fx.recordsBase}:${entry.path}`]));
      expect(preview.origins.map((origin: any) => origin.commit)).toEqual([fx.productBase, fx.recordsBase]);
      expect(preview.scope.paths.map((entry: any) => `${entry.role}:${entry.domain}`)).toEqual(expect.arrayContaining(["product:src/file", "records:rules/file"]));
      expect(preview.inputBytes("current").toString()).toBe(git(fx.records, ["show", `${fx.recordsBase}:${CARD}`]) + "\n");
      expect(preview.inputBytes("approved").toString()).toContain(PRIVATE);
      preview.inputBytes("current").fill(0); expect(preview.inputBytes("current").toString()).toContain(PRIVATE);
      expect(JSON.stringify(preview)).not.toContain(PRIVATE); expect(preview.contract).toContain("Active fixture contract");
      expect(Object.isFrozen(preview.scope.paths)).toBe(true); expect(Object.isFrozen(preview.grant)).toBe(true);
      expect(() => { preview.grant.revision = 99; }).toThrow();
      expect(git(fx.product, ["show-ref"])).toBe(beforeRef);
      const request: any = fx.request(); request.assertedFence = preview.scope;
      expect((await admissionPreflight(request)).permitted).toBe(true);
      request.assertedFence = { paths: ["caller-expanded"] };
      await expect(admissionPreflight(request)).rejects.toMatchObject({ code: "preflight-scope-assertion-mismatch" });
    } finally { fx.cleanup(); }
  }
});

test("private preflight wires current membership recovery endpoint and complete spent or open run ledger policy", async () => {
  const fx = fixture();
  try {
    expect((await admissionPreflight(fx.request())).permitted).toBe(true);
    const refuses = async (code: string, request: any = fx.request()) => {
      const preview = await observedRead(fx.dir, () => admissionPreflight(request));
      expect(preview.permitted).toBe(false); expect(preview.refusals.map((r: any) => r.code)).toContain(code);
      expect(JSON.stringify(preview)).not.toContain(PRIVATE);
    };
    fx.grant({ order: ["T-998"], blobs: { "T-998": fx.blob } });
    await refuses("ADMISSION_CARD_NOT_APPROVED");
    fx.grant({ recovery: "none" });
    const derived: any = fx.request(); Object.assign(derived.admission, { kind: "derived", parent: "T-999", evidence: "fixture failure", scope: "repair" });
    await refuses("ADMISSION_RECOVERY_NONE", derived);
    fx.grant({ recovery: "repairs" });
    expect((await admissionPreflight(derived)).permitted).toBe(true);
    derived.admission.scope = "product-change"; await refuses("ADMISSION_DERIVED_OUT_OF_SCOPE", derived);
    derived.admission.scope = "repair"; derived.admission.evidence = ""; await refuses("ADMISSION_DERIVED_NO_EVIDENCE", derived);
    fx.grant({ approval: "until", order: ["T-998", "T-999"], blobs: { "T-998": fx.blob, "T-999": fx.blob }, until: "T-998" });
    await expect(admissionPreflight(fx.request())).rejects.toMatchObject({ code: "preflight-endpoint-evidence-unavailable" });
    put(fx.records, "docs/tasks/T-998-endpoint.md", card("T-998").replace("status: planned", "status: parked"));
    const request = fx.request(); request.revisions.records = commit(fx.records);
    await refuses("ADMISSION_UNTIL_ENDPOINT", request);
    fx.grant(); fx.record("finished"); await refuses("ADMISSION_APPROVAL_CONSUMED");
    fx.record("started");
    expect((await admissionPreflight(fx.request())).policy.reuses).toBe("T-999-a1");
    const recordFile = path.join(fx.product, ".supertaskr/runs/T-999/T-999-a1.json");
    const validRecord = readFileSync(recordFile, "utf8");
    for (const change of [{ version: 2 }, { state: "unrecognised" }, { admission: undefined },
      { assignmentDigest: "sha256:" + "0".repeat(64) }, { assignmentDigest: sha(JSON.stringify(JSON.parse(validRecord).assignment)) },
      { native: { version: 999 } }]) {
      writeFileSync(recordFile, JSON.stringify({ ...JSON.parse(validRecord), ...change }));
      await expect(observedRead(fx.dir, () => admissionPreflight(fx.request()))).rejects.toMatchObject({ code:
        "native" in change ? "preflight-attempt-evidence-unavailable" : "preflight-ledger-unavailable" });
    }
    writeFileSync(recordFile, validRecord);
    put(fx.product, ".supertaskr/runs/T-999/T-999-a2.json", "{");
    await expect(observedRead(fx.dir, () => admissionPreflight(fx.request()))).rejects.toMatchObject({ code: "preflight-ledger-unavailable" });
    rmSync(path.join(fx.product, ".supertaskr/runs/T-999/T-999-a2.json"));
    const reentry: any = fx.request(); reentry.admission.boundary = "re-entry";
    await expect(admissionPreflight(reentry)).rejects.toMatchObject({ code: "preflight-attempt-evidence-unavailable" });
    reentry.admission.attempt = "T-999-a1";
    await expect(admissionPreflight(reentry)).rejects.toMatchObject({ code: "preflight-worker-evidence-unavailable" });
  } finally { fx.cleanup(); }
});

test("private preflight preserves collected historical native diagnostics while unresolved relevant attempts still refuse", async () => {
  const fx = fixture();
  try {
    expect((await admissionPreflight(fx.request())).permitted).toBe(true);
    function nativeAttempt(id: string, ended: boolean) {
      const label = `${id}-${ended ? "closed" : "unresolved"}`;
      const session = `fixture-session-${label}`, agent = `fixture-agent-${label}`;
      const brief = path.join(fx.dir, `brief-${label}-T-352.md`), file = path.join(fx.dir, `assignment-${label}-T-352.json`);
      writeFileSync(brief, "Packet-only lifecycle fixture; no actual native worker or job is launched.\n");
      writeFileSync(file, JSON.stringify({ kind: id === "T-999" ? "card" : "consultation", id, role: "verifier", resource: "none",
        harness: NATIVE_CODEX_HARNESS, model: "fixture", effort: "none", base: fx.productBase, brief, cwd: fx.product,
        deadline: "none", budget: "none", native: { taskName: `/fixture/${label}`, sessionId: session,
          coordinatorTurnId: "fixture-turn", ignoredOutputs: [], profile: "packet-only" } }));
      const started = startRun(fx.product, { assignment: readAssignment(file) });
      const event = { session_id: session, turn_id: "fixture-turn", agent_id: agent, cwd: fx.product };
      expect(handleNativeEvent(fx.product, { ...event, hook_event_name: "SubagentStart" }).disposition).toBe("start-recorded");
      const probe = { ...event, tool_name: "Bash", tool_use_id: "fixture-probe", tool_input: { command: NATIVE_IDENTITY_PROBE } };
      expect(handleNativeEvent(fx.product, { ...probe, hook_event_name: "PreToolUse" }).disposition).toBe("identity-probe-pre");
      handleNativeEvent(fx.product, { ...probe, hook_event_name: "PostToolUse", tool_response: { output: `${agent}\n` } });
      bindRun(fx.product, { attempt: started.record.attempt, harnessId: agent });
      if (ended) {
        observeRun(fx.product, { attempt: started.record.attempt, evidence: "RUN-DONE ok" });
        const collected = collectRun(fx.product, { attempt: started.record.attempt });
        expect(collected.record.execution?.endedAt).not.toBeNull();
        expect(collected.record.native!.collection).toMatchObject({ eligible: true, actualIndependentCheck: true, ownedJobs: [] });
      }
      // A real public callback consumer produces the later retained diagnostic;
      // no completion, collection or hold clearance is fabricated in the record.
      expect(handleNativeEvent(fx.product, { hook_event_name: "PostToolUse", session_id: session,
        turn_id: "unrecognised-late-fixture-turn", tool_name: "Bash", tool_use_id: "late-diagnostic",
        tool_input: { command: "fixture diagnostic" }, tool_response: {} }).disposition).toBe("missing-agent-held");
      const record = readNativeRecord(fx.product, started.record.attempt);
      expect(activeNativeHolds(record).length).toBeGreaterThan(0);
      return { record, file: started.file, bytes: readFileSync(started.file) };
    }
    const unrelated = nativeAttempt("history-T352", true);
    expect((await observedRead(fx.dir, () => admissionPreflight(fx.request()))).permitted).toBe(true);
    expect(readFileSync(unrelated.file)).toEqual(unrelated.bytes);
    const closed = nativeAttempt("T-999", true);
    const spent = await observedRead(fx.dir, () => admissionPreflight(fx.request()));
    expect(spent.refusals[0]?.code).toBe("ADMISSION_APPROVAL_CONSUMED");
    expect(readFileSync(closed.file)).toEqual(closed.bytes);
    const unresolved = nativeAttempt("T-999", false);
    await expect(observedRead(fx.dir, () => admissionPreflight(fx.request()))).rejects.toMatchObject({ code: "preflight-attempt-evidence-unavailable" });
    expect(readFileSync(unresolved.file)).toEqual(unresolved.bytes);
    expect(readFileSync(closed.file)).toEqual(closed.bytes);
  } finally { fx.cleanup(); }
});

test("private preflight reobserves pause revocation and committed substantive versus mechanical drift without granting later authority", async () => {
  const fx = fixture();
  try {
    const original = await admissionPreflight(fx.request()), originalJSON = JSON.stringify(original);
    put(fx.product, ".supertaskr/pause.json", JSON.stringify({ version: 1, at: "2026-10-23T01:00:00Z", by: "fixture", scope: "all", why: PRIVATE }));
    const paused = await observedRead(fx.dir, () => admissionPreflight(fx.request()));
    expect(paused.refusals[0]?.code).toBe("ADMISSION_PAUSED_ALL"); expect(JSON.stringify(paused)).not.toContain(PRIVATE);
    rmSync(path.join(fx.product, ".supertaskr/pause.json")); fx.grant({ revoked: true });
    expect((await admissionPreflight(fx.request())).refusals[0]?.code).toBe("ADMISSION_NO_CURRENT_GRANT");
    fx.grant();
    put(fx.records, CARD, card().replace("status: planned", "status: building").replace(`${PRIVATE} notes`, `${PRIVATE} notes\nMechanical appended note`));
    const mechanical = fx.request(); mechanical.revisions.records = commit(fx.records);
    expect((await admissionPreflight(mechanical))).toMatchObject({ permitted: true, policy: { mechanicalDrift: true } });
    put(fx.records, CARD, card().replace("THE contract SHALL stay private", `THE contract SHALL change ${PRIVATE}`));
    const substantive = fx.request(); substantive.revisions.records = commit(fx.records);
    const changed = await observedRead(fx.dir, () => admissionPreflight(substantive));
    expect(changed.permitted).toBe(false); expect(changed.refusals[0]?.code).toBe("ADMISSION_CARD_BLOB_MOVED");
    expect(JSON.stringify(changed.refusals)).not.toContain(PRIVATE);
    expect(JSON.stringify(original)).toBe(originalJSON); expect(original.receipt.recordsCommit).toBe(fx.recordsBase);
    expect((await admissionPreflight(fx.request())).permitted).toBe(true);
  } finally { fx.cleanup(); }
});

test("private preflight refuses missing current approved objects wrong association and unsupported full object identities", async () => {
  const fx = fixture();
  try {
    expect((await admissionPreflight(fx.request())).permitted).toBe(true);
    const wrong = fx.request(); wrong.projectId = "different-project";
    await expect(admissionPreflight(wrong)).rejects.toMatchObject({ code: "qualified-authority" });
    fx.grant({ blobs: { "T-999": "a".repeat(40) } });
    await expect(observedRead(fx.dir, () => admissionPreflight(fx.request()))).rejects.toMatchObject({ code: "preflight-approved-bytes-unavailable" });
    fx.grant(); git(fx.records, ["rm", CARD]); const missing = fx.request(); missing.revisions.records = commit(fx.records);
    await expect(observedRead(fx.dir, () => admissionPreflight(missing))).rejects.toMatchObject({ code: "records-task-missing" });
    put(fx.records, CARD, card()); commit(fx.records);
    put(fx.records, COMPONENT, `---\ninvalid: [${PRIVATE}\n`); const invalid = fx.request(); invalid.revisions.records = commit(fx.records);
    let failure: any; try { await admissionPreflight(invalid); } catch (error) { failure = error; }
    expect(failure?.code).toBe("qualified-registry"); expect(String(failure)).not.toContain(PRIVATE);
  } finally { fx.cleanup(); }
  for (const [productFormat, recordsFormat] of [["sha256", "sha256"], ["sha1", "sha256"], ["sha256", "sha1"]] as const) {
    const unsupported = fixture(false, productFormat, recordsFormat);
    try {
      expect(unsupported.recordsBase).toHaveLength(recordsFormat === "sha256" ? 64 : 40);
      expect(unsupported.productBase).toHaveLength(productFormat === "sha256" ? 64 : 40);
      expect(unsupported.blob).toHaveLength(recordsFormat === "sha256" ? 64 : 40);
      await expect(observedRead(unsupported.dir, () => admissionPreflight(unsupported.request()))).rejects.toMatchObject({ code: "preflight-object-format-unsupported" });
      expect(normalizeAdmissionPreflight(unsupported.request()).revisions).toEqual({ product: unsupported.productBase, records: unsupported.recordsBase });
    } finally { unsupported.cleanup(); }
  }
});
