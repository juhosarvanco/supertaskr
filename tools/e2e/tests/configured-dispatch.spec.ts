import { cpSync, existsSync, readFileSync, renameSync, rmSync, symlinkSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { captureConfiguredDispatch, configuredDispatchEffectContext, configuredDispatchStartCapsule, createConfiguredDispatchGateRunner, verifyConfiguredDispatch } from "../scripts/configured-dispatch.mjs";
import { loadInstalledRecordTool, readInstalledMethodAsset } from "../scripts/records-check.mjs";
import { seedProjectSettings } from "../scripts/project-settings.mjs";
import { GENERIC_RECORD_PROFILE } from "../scripts/records-validation.mjs";
import { captureQualifiedInputs } from "../scripts/qualified-reservation.mjs";
import { privateGit, privateRecordFixture, putPrivate } from "./private-record-fixture";
import { testToolRuntime } from "../fixtures/tool-runtime";
import { guardClassIds } from "../scripts/dispatch-brief.mjs";

function fixture() {
  const f = privateRecordFixture(), tool = loadInstalledRecordTool(f.manifestPath), seed = seedProjectSettings({ tool, recordsValidation: GENERIC_RECORD_PROFILE });
  if (seed.status !== "ready") throw Error(JSON.stringify(seed));
  const settings = structuredClone(seed.settings); settings.languages = ["python"]; settings.roles.builder = "gpt-6.1-sol@subagent"; settings.roles.verifier = "gpt-6.1-sol@fresh";
  settings.guard_class = Object.fromEntries(guardClassIds(readInstalledMethodAsset(tool, "method/tasks/TASK-FORMAT.md").text).map(id => [id, ["checks/"]]));
  settings.suites = [{ id: "python", cwd: ".", sentinel: "pyproject.toml", argv: ["python3", "-m", "unittest", "discover", "-s", "checks", "-v"], family: "unittest", solo: false, why: "Authored configured dispatch suite" }];
  putPrivate(f.product, ".gitignore", ".supertaskr/\n__pycache__/\n"); putPrivate(f.product, "pyproject.toml", "[project]\nname='configured-dispatch'\nversion='0.0.0'\n");
  putPrivate(f.product, "checks/test_actual.py", "import unittest\nclass Actual(unittest.TestCase):\n    def test_one(self): self.assertEqual(2+2,4)\n    def test_two(self): self.assertTrue(True)\n");
  putPrivate(f.product, "cheap/test_cheap.py", "import unittest\nclass Cheap(unittest.TestCase):\n    def test_one(self): self.assertTrue(True)\n");
  putPrivate(f.product, "supertaskr.yaml", JSON.stringify(settings)); privateGit(f.product, ["add", ".gitignore", "pyproject.toml", "checks", "cheap", "supertaskr.yaml"]); privateGit(f.product, ["commit", "-qm", "Original configured product"]);
  const product = privateGit(f.product, ["rev-parse", "HEAD"]), cardPath = "docs/tasks/T-900-configured.md";
  const card = "---\nid: T-900\ntitle: Configured dispatch example\nfeature: F-01\nmilestone: 1\npriority: 1\nsize: M\nstatus: building\ntier: standard\nbuilder: gpt-6.1-terra@fresh\ntouches: [product::hello.py, records::notes.txt]\n---\n\n## Acceptance criteria\n\n- WHEN requested THE configured example SHALL use its original context.\n";
  putPrivate(f.records, cardPath, card); putPrivate(f.records, "notes.txt", "Original selected records example.\n"); privateGit(f.records, ["add", "."]); privateGit(f.records, ["commit", "-qm", "Original configured private card"]);
  const records = privateGit(f.records, ["rev-parse", "HEAD"]), selection = { authorityRoot: f.product, projectId: "external-python", revisions: { product, records }, taskId: "T-900", legacyTokenMap: {} };
  const canonical = captureQualifiedInputs(selection), handle = captureConfiguredDispatch({ ...selection, tool });
  return { ...f, toolRoot: f.tool, tool, settings, cardPath, card, selection, canonical, handle };
}

test("configured dispatch retains original P/R/TOOL, committed card role overrides and actual original suite execution", () => {
  const f = fixture();
  try {
    const capsule = f.handle.capsule;
    expect(capsule.receipt).toEqual(f.canonical.receipt); expect(capsule.gatePolicy.policyRevision).toBe(f.selection.revisions.product);
    expect(capsule.configuration).toMatchObject({ kind: "committed", productRoot: f.product, productRevision: f.selection.revisions.product, tool: { manifestDigest: f.tool.manifestDigest } });
    expect(capsule.roles.executor).toMatchObject({ field: "builder", configured: "gpt-6.1-sol@subagent", source: "committed-card", requested: "gpt-6.1-terra@fresh", model: "gpt-6.1-terra", vehicle: "fresh" });
    expect(capsule.roles.verifier).toMatchObject({ source: "committed-configuration", model: "gpt-6.1-sol", vehicle: "fresh" });
    expect(capsule.task).toMatchObject({ id: "T-900", path: f.cardPath, blobId: f.canonical.receipt.cardBlobId, size: "M", declaredTier: "standard" });
    expect(capsule.process.configuration).toEqual(f.settings.process); expect(Object.isFrozen(capsule.roles.executor)).toBe(true);
    const current = structuredClone(f.settings); current.roles.builder = "gpt-6.1-sol"; current.suites[0]!.argv[5] = "cheap";
    putPrivate(f.product, "supertaskr.yaml", JSON.stringify(current)); privateGit(f.product, ["add", "supertaskr.yaml"]); privateGit(f.product, ["commit", "-qm", "Current product policy is different"]);
    const candidate = privateGit(f.product, ["rev-parse", "HEAD"]);
    putPrivate(f.records, f.cardPath, f.card.replace("gpt-6.1-terra@fresh", "gpt-6.1-sol@fresh")); privateGit(f.records, ["add", f.cardPath]); privateGit(f.records, ["commit", "-qm", "Current private card is different"]);
    expect(verifyConfiguredDispatch(f.handle)).toEqual(capsule);
    const result = createConfiguredDispatchGateRunner(f.handle, { productRoot: f.product, productRevision: candidate }).run(["python"]);
    expect(result.capture.complete).toBe(true); expect(result.verdicts[0]).toMatchObject({ bodies: 2, ref: candidate }); expect(result.capture.suites[0]!.definition.argv).toContain("checks");
    expect(result.configuration.policyRevision).toBe(f.selection.revisions.product);
    const productHead = privateGit(f.product, ["rev-parse", "HEAD"]), recordsHead = privateGit(f.records, ["rev-parse", "HEAD"]);
    putPrivate(f.product, "supertaskr.yaml", "invalid: [\n"); putPrivate(f.records, f.cardPath, "Uncommitted private editor poison\n");
    expect(verifyConfiguredDispatch(f.handle)).toEqual(capsule); expect(privateGit(f.product, ["rev-parse", "HEAD"])).toBe(productHead); expect(privateGit(f.records, ["rev-parse", "HEAD"])).toBe(recordsHead);
  } finally { f.cleanup(); }
});

test("configured dispatch refuses copied handles, mismatched start correspondence, absent configuration/binding and replaced records", () => {
  const f = fixture();
  try {
    const assignment = { id: "T-900", role: "executor", model: "gpt-6.1-terra", native: { taskName: "/root/configured-example", sessionId: "configured-session" }, qualified: { ...f.selection, receipt: f.canonical.receipt } }, preview = { receipt: f.canonical.receipt, scope: f.canonical.fence };
    expect(configuredDispatchStartCapsule(f.handle, f.product, assignment, preview)).toEqual(f.handle.capsule);
    const alias = path.join(f.dir, "product-alias"); symlinkSync(f.product, alias, "dir");
    const aliased = captureConfiguredDispatch({ ...f.selection, authorityRoot: alias, tool: f.tool });
    expect(aliased.capsule).toEqual(f.handle.capsule);
    expect(configuredDispatchStartCapsule(aliased, alias, { ...assignment, qualified: { ...assignment.qualified, authorityRoot: alias } }, preview)).toEqual(f.handle.capsule);
    expect(() => verifyConfiguredDispatch(structuredClone(f.handle))).toThrow(/original backend constructor handle/);
    expect(() => configuredDispatchStartCapsule(f.handle, f.product, { ...assignment, model: "gpt-6.1-sol" }, preview)).toThrow(/original committed role choice/);
    expect(() => configuredDispatchStartCapsule(f.handle, f.product, assignment, { ...preview, receipt: { ...preview.receipt, cardBlobId: "0".repeat(40) } })).toThrow(/decisive native admission differs/);
    expect(() => captureConfiguredDispatch({ ...f.selection, revisions: { ...f.selection.revisions, product: f.options.productRevision }, tool: f.tool })).toThrow(/supertaskr.yaml is absent/);
    const binding = path.join(f.product, ".supertaskr/workspace.json"), bindingBytes = readFileSync(binding);
    rmSync(binding); expect(() => verifyConfiguredDispatch(f.handle)).toThrow(/explicitly selected independent RECORDS/); putPrivate(f.product, ".supertaskr/workspace.json", bindingBytes);
    const saved = `${f.records}-original`; renameSync(f.records, saved); cpSync(saved, f.records, { recursive: true });
    expect(() => verifyConfiguredDispatch(f.handle)).toThrow(/Original configured dispatch inputs or physical origins differ/);
    rmSync(f.records, { recursive: true }); renameSync(saved, f.records); expect(verifyConfiguredDispatch(f.handle)).toEqual(f.handle.capsule);
  } finally { f.cleanup(); }
});

test("the installed strict native entry binds original model vehicle and session policy and cold-checks the actual retained source without a child lock", async () => {
  test.setTimeout(180_000); const f = fixture(), installed = testToolRuntime();
  try {
    // First-card bootstrap: the committed configuration is real while every
    // configured suite cwd/sentinel/source/test is an absent planned output.
    privateGit(f.product, ["rm", "-r", "hello.py", "pyproject.toml", "checks", "cheap"]);
    f.settings.suites[0]!.cwd = "first";
    f.settings.guard_class = Object.fromEntries(Object.keys(f.settings.guard_class).map(id => [id, ["first/checks/"]]));
    putPrivate(f.product, "supertaskr.yaml", JSON.stringify(f.settings)); privateGit(f.product, ["add", "supertaskr.yaml"]); privateGit(f.product, ["commit", "-qm", "Code-empty configured first-card project"]);
    f.selection.revisions.product = privateGit(f.product, ["rev-parse", "HEAD"]);
    f.card = f.card.replace("tier: standard", "tier: guarded").replace("product::hello.py", "product::first/hello.py, product::first/pyproject.toml, product::first/checks/test_first.py");
    expect(privateGit(f.product, ["ls-tree", "-r", "--name-only", "HEAD"]).split("\n")).toEqual([".gitignore", "supertaskr.yaml"]);
    expect(existsSync(path.join(f.product, "first"))).toBe(false);
    const module = (name: string) => pathToFileURL(path.join(installed.runtimeRoot, "tools/e2e/scripts", `${name}.mjs`)).href;
    const runs = await import(module("run-record")), admission = await import(module("dispatch-brief")), native = await import(module("native-codex")), checker = await import(module("records-check")), qualifier = await import(module("qualified-reservation"));
    const tool = checker.loadInstalledRecordTool(), productWorker = path.join(f.dir, "product-worker"), recordsWorker = path.join(f.dir, "records-worker");
    privateGit(f.product, ["worktree", "add", "--detach", productWorker, f.selection.revisions.product]);
    const grant = (blob: string) => putPrivate(f.product, ".supertaskr/dispatch-grant.yaml", admission.composeGrantSnapshot({ root: f.product, revision: 3, writtenBy: "authored fixture", blockText:
      `dispatch:\n  approval: each\n  recovery: repairs\n  grant:\n    given_by: authored fixture owner\n    at: "2026-10-30T00:00:00Z"\n    revision: 3\n    order: [T-900]\n    cards:\n      T-900: ${blob}\n  history: []\n` }));
    const wireCard = f.card.replace("gpt-6.1-terra@fresh", "codex/gpt-6.1-sol@fresh");
    putPrivate(f.records, f.cardPath, wireCard.replace("codex/gpt-6.1-sol@fresh", "codex/gpt-6.1-sol@S3")); privateGit(f.records, ["add", f.cardPath]); privateGit(f.records, ["commit", "-qm", "Explicit unsupported resume vehicle"]);
    const resumeRevision = privateGit(f.records, ["rev-parse", "HEAD"]); privateGit(f.records, ["worktree", "add", "--detach", recordsWorker, resumeRevision]);
    const selected: any = { version: 1, authorityRoot: f.product, projectId: f.selection.projectId, revisions: { ...f.selection.revisions, records: resumeRevision }, taskId: "T-900", legacyTokenMap: {},
      workers: [{ role: "product", checkout: productWorker, base: f.selection.revisions.product }, { role: "records", checkout: recordsWorker, base: resumeRevision }] };
    selected.receipt = qualifier.captureQualifiedInputs(selected).receipt; grant(selected.receipt.cardBlobId);
    const brief = path.join(f.dir, "configured-brief.md"); putPrivate(f.dir, "configured-brief.md", "Authored configured native fixture; no child is launched.\n");
    const assignment: any = { kind: "card", id: "T-900", role: "executor", resource: productWorker, cwd: productWorker, harness: "codex-desktop-native", model: "gpt-6.1-sol", effort: "xhigh", base: selected.revisions.product,
      brief, deadline: "none", budget: "none", admission: { kind: "explicit", parent: "", evidence: "", scope: "implementation" },
      native: { taskName: "/root/configured_native_fixture", sessionId: "configured-fixture-parent", coordinatorTurnId: "fixture-turn", ignoredOutputs: [] }, qualified: selected };
    await expect(runs.startConfiguredRun(f.product, { assignment })).rejects.toMatchObject({ code: "configured-dispatch-vehicle-unsupported" });
    expect(await runs.readQualifiedReservation(f.product, "T-900-a1")).toBeNull(); expect(runs.allRecords(f.product)).toEqual([]);
    putPrivate(f.records, f.cardPath, wireCard); privateGit(f.records, ["add", f.cardPath]); privateGit(f.records, ["commit", "-qm", "Explicit original fresh vehicle"]);
    const records = privateGit(f.records, ["rev-parse", "HEAD"]); privateGit(recordsWorker, ["reset", "--hard", records]); selected.revisions.records = records; selected.workers[1].base = records;
    selected.receipt = qualifier.captureQualifiedInputs(selected).receipt; grant(selected.receipt.cardBlobId);
    await expect(runs.startConfiguredRun(f.product, { assignment: { ...assignment, model: "gpt-6-luna" } })).rejects.toMatchObject({ code: "configured-dispatch-start-model" });
    expect(await runs.readQualifiedReservation(f.product, "T-900-a1")).toBeNull();
    const command = [path.join(installed.packageRoot, "supertaskr.mjs"), "dispatch", "--root", f.product];
    const assignmentFile = path.join(f.dir, "configured-assignment.json"); putPrivate(f.dir, "configured-assignment.json", JSON.stringify(assignment));
    const started = spawnSync(process.execPath, [...command, "--run", "start", "--assignment", assignmentFile], { cwd: f.product, encoding: "utf8", env: { ...process.env, NODE_PATH: "" } });
    expect(started.status, started.stdout + started.stderr).toBe(0); expect(JSON.parse(started.stdout)).toMatchObject({ attempt: "T-900-a1", started: false, requested: { spelling: "codex/gpt-6.1-sol@fresh", model: "codex/gpt-6.1-sol", vehicle: "fresh" }, selection: { harness: "codex-desktop-native", model: "gpt-6.1-sol" } });
    const rec = runs.readRecord(f.product, "T-900-a1"), capsule = rec.native.qualified.origins.configuredDispatch;
    expect(rec.attempt).toBe("T-900-a1"); expect(rec.native.start).toBeNull(); expect(capsule.gatePolicy.toolManifestDigest).toBe(tool.manifestDigest);
    expect(capsule.task.declaredTier).toBe("guarded"); expect(existsSync(path.join(f.product, "first"))).toBe(false);
    expect(capsule.roles.executor).toMatchObject({ model: "codex/gpt-6.1-sol", vehicle: "fresh" }); expect(capsule.sessionPolicy).toEqual({ default: f.settings.session_policy.default, warnAfterTurns: f.settings.session_policy.warn_after_turns });
    const policy = native.withNativeTransaction(f.product, { operation: "authored-configured-phase" }, () => runs.qualifiedPhasePolicy(f.product, rec));
    expect(policy.consumed).toBe(false); expect(existsSync(path.join(f.product, "method"))).toBe(false);
    const omitted = { ...rec, permission: undefined, native: { qualified: { origins: { receipt: rec.native.qualified.origins.receipt } } } };
    expect(() => runs.qualifiedPhasePolicy(f.product, omitted)).toThrow(/CONFIGURED_SOURCE_OMITTED/);
    const legacy = spawnSync(process.execPath, [path.join(installed.packageRoot, "supertaskr.mjs"), "next", "--root", f.product], { encoding: "utf8" });
    expect(legacy.status).toBe(3); expect(legacy.stderr).toContain("legacy source compatibility"); expect(legacy.stderr).toContain("supertaskr dispatch");
    const help = spawnSync(process.execPath, [...command, "--help"], { encoding: "utf8" }); expect(help.status, help.stderr).toBe(0); expect(help.stdout).toContain("--run collect flags:");
    const unsupported = spawnSync(process.execPath, [...command, "next"], { encoding: "utf8" }); expect(unsupported.status).toBe(3); expect(unsupported.stderr).toContain("configured-dispatch-action-unsupported");
  } finally { f.cleanup(); }
});

test("the finite native role adapter keeps a plain demo model and refuses a lost resume policy", () => {
  const f = fixture();
  try {
    putPrivate(f.records, f.cardPath, f.card.replace("gpt-6.1-terra@fresh", "gpt-6-luna")); privateGit(f.records, ["add", f.cardPath]); privateGit(f.records, ["commit", "-qm", "Plain explicit demo model"]);
    const records = privateGit(f.records, ["rev-parse", "HEAD"]), selected = { ...f.selection, revisions: { ...f.selection.revisions, records } };
    const handle = captureConfiguredDispatch({ ...selected, tool: f.tool });
    expect(configuredDispatchEffectContext(handle, { role: "executor", model: "gpt-6-luna" }).role).toMatchObject({ requested: "gpt-6-luna", model: "gpt-6-luna", harness: "codex-desktop-native", vehicle: "fresh" });
    const guardedCard = readFileSync(path.join(f.records, f.cardPath), "utf8").replace("product::hello.py", "product::checks/test_actual.py");
    putPrivate(f.records, f.cardPath, guardedCard); privateGit(f.records, ["add", f.cardPath]); privateGit(f.records, ["commit", "-qm", "Explicit guarded scope with understated tier"]);
    const guarded = captureConfiguredDispatch({ ...selected, revisions: { ...selected.revisions, records: privateGit(f.records, ["rev-parse", "HEAD"]) }, tool: f.tool });
    expect(() => configuredDispatchEffectContext(guarded, { role: "executor", model: "gpt-6-luna" })).toThrow(/committed tier is below/);
    putPrivate(f.records, f.cardPath, guardedCard.replace("tier: standard", "tier: guarded")); privateGit(f.records, ["add", f.cardPath]); privateGit(f.records, ["commit", "-qm", "Commit the actual guarded classification"]);
    const restored = captureConfiguredDispatch({ ...selected, revisions: { ...selected.revisions, records: privateGit(f.records, ["rev-parse", "HEAD"]) }, tool: f.tool });
    expect(configuredDispatchEffectContext(restored, { role: "executor", model: "gpt-6-luna" }).verification).toMatchObject({ tier: "guarded", derivedTier: "guarded" });
    const settings = structuredClone(f.settings); settings.session_policy.default = "resume";
    putPrivate(f.product, "supertaskr.yaml", JSON.stringify(settings)); privateGit(f.product, ["add", "supertaskr.yaml"]); privateGit(f.product, ["commit", "-qm", "Explicit resume default without a selected session"]);
    const resumed = captureConfiguredDispatch({ ...selected, revisions: { ...selected.revisions, product: privateGit(f.product, ["rev-parse", "HEAD"]) }, tool: f.tool });
    expect(() => configuredDispatchEffectContext(resumed, { role: "executor", model: "gpt-6-luna" })).toThrow(/original resume\/session request/);
  } finally { f.cleanup(); }
});
