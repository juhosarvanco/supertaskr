import { cpSync, readFileSync, renameSync, rmSync, symlinkSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { captureConfiguredDispatch, configuredDispatchStartCapsule, createConfiguredDispatchGateRunner, verifyConfiguredDispatch } from "../scripts/configured-dispatch.mjs";
import { loadInstalledRecordTool } from "../scripts/records-check.mjs";
import { seedProjectSettings } from "../scripts/project-settings.mjs";
import { GENERIC_RECORD_PROFILE } from "../scripts/records-validation.mjs";
import { captureQualifiedInputs } from "../scripts/qualified-reservation.mjs";
import { privateGit, privateRecordFixture, putPrivate } from "./private-record-fixture";

function fixture() {
  const f = privateRecordFixture(), tool = loadInstalledRecordTool(f.manifestPath), seed = seedProjectSettings({ tool, recordsValidation: GENERIC_RECORD_PROFILE });
  if (seed.status !== "ready") throw Error(JSON.stringify(seed));
  const settings = structuredClone(seed.settings); settings.languages = ["python"]; settings.roles.builder = "gpt-6.1-sol@subagent"; settings.roles.verifier = "gpt-6.1-sol@fresh";
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
    const assignment = { id: "T-900", role: "executor", model: "gpt-6.1-terra", qualified: { ...f.selection, receipt: f.canonical.receipt } }, preview = { receipt: f.canonical.receipt, scope: f.canonical.fence };
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
