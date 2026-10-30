import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, symlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { executeInitializationProtocol, INITIALIZATION_INPUT_LIMIT } from "../scripts/genesis-init-command.mjs";
import { prepareGenesisInitialization } from "../scripts/genesis-init-plan.mjs";
import { capturePlainProjectRoot, executeProjectInitialization } from "../scripts/project-init-operation.mjs";
import { acceptedOperationPath, readAcceptedOperation } from "../scripts/durable-operation.mjs";
import { operationContent } from "../scripts/operation-record.mjs";
import { verifyInstalledRecordTool } from "../scripts/records-check.mjs";
import { genesisFixture, genesisInput, withGenesisIdentity } from "./genesis-init-fixture";
import { FIXTURE_ENV, privateGit } from "./private-record-fixture";

function request(f: ReturnType<typeof genesisFixture>) {
  const product = capturePlainProjectRoot(f.product), records = capturePlainProjectRoot(f.records);
  return { version: 1, requestId: "native-init-request", operation: "initialize", productRoot: f.product, recordsRoot: f.records,
    operationId: "init-plan-fixture", projectId: "project-fixture",
    expectedRoots: { product: { device: product.device, inode: product.inode }, records: { device: records.device, inode: records.inode } } };
}
const call = (f: ReturnType<typeof genesisFixture>, input: any) => withGenesisIdentity(() => executeInitializationProtocol(input, { manifestPath: f.manifestPath }));
const query = (f: ReturnType<typeof genesisFixture>, operation: "discover"|"inspect"|"replay") => ({ version: 1, requestId: `native-${operation}`, operation, productRoot: f.product,
  ...(operation === "replay" ? { operationId: "init-plan-fixture" } : {}) });

test("fixed initialization protocol produces real separate histories and returns original completion before current TOOL gates", () => {
  const f = genesisFixture();
  try {
    const input = request(f), reply = call(f, input);
    expect(reply).toMatchObject({ version: 1, requestId: input.requestId, ok: true, result: { status: "initialized", operationId: input.operationId } });
    if (!reply.ok) throw Error(JSON.stringify(reply));
    const receipt = reply.result, before = readFileSync(acceptedOperationPath(f.product, input.operationId));
    expect(privateGit(f.product, ["rev-parse", "HEAD"])).toBe(receipt.product.commit);
    expect(privateGit(f.records, ["rev-parse", "HEAD"])).toBe(receipt.records.commit);
    expect(privateGit(f.product, ["ls-tree", "--name-only", "HEAD"])).not.toContain("docs");
    expect(call(f, query(f, "inspect"))).toMatchObject({ ok: true, result: { status: "current", receipt,
      settings: { languages: [], suites: [] }, installation: { skills: "not-installed", hooks: "not-installed" } } });
    const historical = executeInitializationProtocol(query(f, "replay"), { manifestPath: path.join(f.dir, "missing-manifest") });
    expect(historical).toMatchObject({ ok: true, result: receipt });
    expect(executeInitializationProtocol(input, { manifestPath: path.join(f.dir, "missing-manifest") })).toMatchObject({ ok: true, result: receipt });
    expect(call(f, { ...input, projectId: "another-project" })).toMatchObject({ ok: false,
      error: { code: "genesis-init-operation-changed", state: "unknown", operationId: input.operationId } });
    expect(readFileSync(acceptedOperationPath(f.product, input.operationId))).toEqual(before);
  } finally { f.cleanup(); }
});

test("installed original-planner read retains committed Codex selection after a real Q5 future-provider change", () => {
  const f = genesisFixture();
  const installed = (input: any) => {
    const reply = spawnSync(process.execPath, [path.join(f.tool, "supertaskr.mjs"), "init", "--stdio"],
      { cwd: f.dir, input: JSON.stringify(input), encoding: "utf8", env: FIXTURE_ENV, maxBuffer: 4 * 1024 * 1024 });
    expect(reply.error).toBeUndefined();
    return { status: reply.status, body: JSON.parse(reply.stdout) };
  };
  const snapshot = () => [f.product, f.records].map(root => ({ head: privateGit(root, ["rev-parse", "HEAD"]),
    refs: privateGit(root, ["show-ref"]), index: readFileSync(path.join(root, ".git/index")),
    status: privateGit(root, ["--no-optional-locks", "status", "--porcelain=v1", "--untracked-files=all"]) }));
  try {
    const initialized = installed(request(f)); expect(initialized).toMatchObject({ status: 0, body: { ok: true, result: { status: "initialized" } } });
    const originalRevision = initialized.body.result.product.commit;
    const originalRequest = { version: 1, requestId: "original-planner", operation: "planner", productRoot: f.product, productRevision: originalRevision };
    const original = installed(originalRequest);
    expect(original).toMatchObject({ status: 0, body: { ok: true, result: { status: "original-planner",
      planner: { status: "ready", selection: { requested: "codex/gpt-6.1-sol@subagent", harness: "codex", model: "gpt-6.1-sol" },
        provenance: { productRevision: originalRevision } } } } });
    const current = installed(query(f, "inspect")); expect(current.body.ok).toBe(true);
    const settings = current.body.result.settings; settings.roles.planner = "claude-opus-5@fresh";
    const config = path.join(f.product, "supertaskr.yaml");
    // A real committed future role is independent of the original session's cut.
    // JSON is valid YAML and is parsed by the same installed canonical loader.
    writeFileSync(config, JSON.stringify(settings)); privateGit(f.product, ["add", "supertaskr.yaml"]); privateGit(f.product, ["commit", "-qm", "Choose future Claude planner at Q5"]);
    const before = snapshot(), accepted = readFileSync(acceptedOperationPath(f.product, "init-plan-fixture"));
    const future = installed(query(f, "inspect")); expect(future).toMatchObject({ status: 0, body: { ok: true,
      result: { planner: { selection: { harness: "claude", model: "claude-opus-5" } } } } });
    expect(future.body.result.current.productRevision).not.toBe(originalRevision);
    const retained = installed(originalRequest); expect(retained.status).toBe(0);
    expect(retained.body.result.planner).toEqual(original.body.result.planner);
    expect(retained.body.result.settingsProvenance).toEqual(original.body.result.settingsProvenance);
    expect(retained.body.result.current.productRevision).toBe(future.body.result.current.productRevision);
    for (const invalid of [{ ...originalRequest, productRevision: "HEAD" }, { ...originalRequest, role: "builder" }]) {
      expect(installed(invalid)).toMatchObject({ status: 1, body: { ok: false, error: { code: "genesis-init-protocol-request" } } });
    }
    expect(installed({ ...originalRequest, productRevision: "a".repeat(40) })).toMatchObject({ status: 1,
      body: { ok: false, error: { code: "genesis-planner-original-history" } } });
    expect(snapshot()).toEqual(before); expect(readFileSync(acceptedOperationPath(f.product, "init-plan-fixture"))).toEqual(accepted);
  } finally { f.cleanup(); }
});

test("native captured incarnations and finite field schema refuse before any selected-folder effect", () => {
  const f = genesisFixture();
  try {
    const input = request(f);
    for (const field of ["tool", "manifestPath", "program", "plans", "settings", "profile"]) {
      expect(call(f, { ...input, [field]: "untrusted request policy" })).toMatchObject({ ok: false, error: { code: "genesis-init-protocol-request", state: "refused" } });
    }
    const held = `${f.records}-original`; renameSync(f.records, held); mkdirSync(f.records);
    expect(call(f, input)).toMatchObject({ ok: false, error: { code: "genesis-init-root-changed", state: "refused", operationId: input.operationId } });
    expect(readdirSync(f.product)).toEqual([]); expect(readdirSync(f.records)).toEqual([]); expect(readdirSync(held)).toEqual([]);
    expect(readAcceptedOperation(f.product, input.operationId)).toBeNull();
  } finally { f.cleanup(); }
});

test("cold pending discovery precedes fresh admission and replay keeps the original immutable request", () => {
  const f = genesisFixture();
  try {
    const input = request(f), plan = withGenesisIdentity(() => prepareGenesisInitialization(genesisInput(f)));
    expect(() => executeProjectInitialization(f.product, plan.request, { authorize() { verifyInstalledRecordTool(f.toolHandle); return true; },
      onBoundary(at) { if (at === "captured") throw Error("ordinary capture stop"); } })).toThrow("ordinary capture stop");
    const original = operationContent(readAcceptedOperation(f.product, input.operationId).operation.request);
    expect(executeInitializationProtocol(query(f, "discover"), { manifestPath: path.join(f.dir, "missing-manifest") })).toMatchObject({ ok: true,
      result: { initializations: [{ operationId: input.operationId, state: "pending", originStatus: "matched" }] } });
    expect(call(f, { ...input, operationId: "new-id-cannot-retarget" })).toMatchObject({ ok: false, error: { code: "genesis-init-recovery-required", state: "refused" } });
    expect(readAcceptedOperation(f.product, "new-id-cannot-retarget")).toBeNull();
    expect(executeInitializationProtocol(query(f, "replay"), { manifestPath: path.join(f.dir, "missing-manifest") })).toMatchObject({ ok: false,
      error: { state: "unknown", operationId: input.operationId } });
    expect(call(f, query(f, "replay"))).toMatchObject({ ok: true, result: { status: "initialized", operationId: input.operationId } });
    expect(operationContent(readAcceptedOperation(f.product, input.operationId).operation.request)).toBe(original);
  } finally { f.cleanup(); }
});

test("unattributed stage replay stays named unknown under the original setup identifier", () => {
  const f = genesisFixture();
  try {
    const plan = withGenesisIdentity(() => prepareGenesisInitialization(genesisInput(f)));
    expect(() => executeProjectInitialization(f.product, plan.request, { authorize() { verifyInstalledRecordTool(f.toolHandle); return true; },
      onBoundary(at) { if (at === "product:stage-created-unattributed") throw Error("ordinary stage stop"); } })).toThrow("ordinary stage stop");
    const file = acceptedOperationPath(f.product, plan.request.operationId), before = readFileSync(file);
    const result = call(f, query(f, "replay"));
    expect(result).toMatchObject({ ok: false, error: { code: "PROJECT_INIT_STAGE_UNATTRIBUTED", state: "unknown", operationId: plan.request.operationId } });
    expect(result).not.toHaveProperty("error.nextOperationId"); expect(readFileSync(file)).toEqual(before);
    expect(existsSync(path.join(f.product, ".git"))).toBe(false); expect(readdirSync(f.records)).toEqual([]);
  } finally { f.cleanup(); }
});

test("one JSON stdin request enforces duplicate/input bounds while discovery needs no source manifest fallback", () => {
  const f = genesisFixture(), script = new URL("../scripts/genesis-init-command.mjs", import.meta.url);
  const send = (input: string | Buffer) => spawnSync(process.execPath, [fileURLToPath(script), "--stdio"], { input, encoding: "utf8", env: FIXTURE_ENV, maxBuffer: 4 * 1024 * 1024 });
  try {
    const positive = send(JSON.stringify(query(f, "discover")));
    expect(positive.status, positive.stderr).toBe(0); expect(JSON.parse(positive.stdout)).toMatchObject({ ok: true, result: { initializations: [] } });
    const duplicate = send(`{"version":1,"requestId":"first","requestId":"second","operation":"discover","productRoot":${JSON.stringify(f.product)}}`);
    expect(duplicate.status).toBe(2); expect(JSON.parse(duplicate.stdout)).toMatchObject({ ok: false, error: { code: "genesis-init-protocol-json-duplicate", state: "refused" } });
    const oversized = send(Buffer.alloc(INITIALIZATION_INPUT_LIMIT + 1));
    expect(oversized.status).toBe(2); expect(JSON.parse(oversized.stdout)).toMatchObject({ ok: false, error: { code: "genesis-init-protocol-input-limit" } });
    expect(readdirSync(f.product)).toEqual([]); expect(readdirSync(f.records)).toEqual([]);
  } finally { f.cleanup(); }
});

test("aliased cold entry judges stdin while canonical discovery succeeds and ordinary import stays inert", () => {
  const f = genesisFixture(), script = new URL("../scripts/genesis-init-command.mjs", import.meta.url);
  try {
    const canonical = spawnSync(process.execPath, [fileURLToPath(script), "--stdio"], { input: JSON.stringify(query(f, "discover")), encoding: "utf8", env: FIXTURE_ENV });
    expect(canonical.status, canonical.stderr).toBe(0); expect(JSON.parse(canonical.stdout)).toMatchObject({ ok: true, result: { initializations: [] } });
    const linked = path.join(f.dir, "initialization-entry.mjs"); symlinkSync(fileURLToPath(script), linked);
    const alias = linked.startsWith("/private/var/") ? linked.slice("/private".length) : linked;
    expect(existsSync(alias)).toBe(true);
    const invalid = spawnSync(process.execPath, [alias, "--stdio"], { input: '{"version":1,"requestId":"first","requestId":"second"}', encoding: "utf8", env: FIXTURE_ENV });
    expect(invalid.status, invalid.stderr).toBe(2);
    expect(JSON.parse(invalid.stdout)).toMatchObject({ ok: false, error: { code: "genesis-init-protocol-json-duplicate", state: "refused" } });
    const imported = spawnSync(process.execPath, ["--input-type=module", "-e", `await import(${JSON.stringify(script.href)});process.stdout.write('import-inert');`], { input: "invalid stdin must not be judged by import", encoding: "utf8", env: FIXTURE_ENV });
    expect(imported.status, imported.stderr).toBe(0); expect(imported.stdout).toBe("import-inert");
    expect(readdirSync(f.product)).toEqual([]); expect(readdirSync(f.records)).toEqual([]);
  } finally { f.cleanup(); }
});
