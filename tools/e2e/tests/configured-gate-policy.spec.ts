import { createHash } from "node:crypto";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, renameSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { expect, test } from "@playwright/test";
import { testToolRuntime } from "../fixtures/tool-runtime";
import { privateGit, putPrivate } from "./private-record-fixture";

async function fixture(createdInputControl = false) {
  const installed = testToolRuntime(), url = (name: string) => pathToFileURL(path.join(installed.runtimeRoot, "tools/e2e/scripts", `${name}.mjs`)).href;
  const gates = await import(url("gate-run")), checker = await import(url("records-check")), settings = await import(url("project-settings")), profiles = await import(url("records-validation"));
  const tokenApi = await import(pathToFileURL(path.join(installed.runtimeRoot, "cli/gate-token.mjs")).href);
  const tool = checker.loadInstalledRecordTool(), seed = settings.seedProjectSettings({ tool, recordsValidation: profiles.GENERIC_RECORD_PROFILE });
  expect(seed.status).toBe("ready");
  const dir = realpathSync(mkdtempSync(path.join(tmpdir(), "configured-original-policy-"))), coordinator = path.join(dir, "coordinator"), candidate = path.join(dir, "candidate");
  mkdirSync(coordinator);
  privateGit(coordinator, ["init", "-q", "--initial-branch=main"]);
  privateGit(coordinator, ["config", "user.name", "Original policy fixture"]); privateGit(coordinator, ["config", "user.email", "fixture@example.invalid"]);
  putPrivate(coordinator, ".gitignore", ".supertaskr/\n__pycache__/\nobserved-count\n");
  putPrivate(coordinator, "pyproject.toml", "[project]\nname='original-policy-example'\nversion='0.0.0'\n");
  const outputControl = createdInputControl ? "        if pathlib.Path('.supertaskr/write-nonignored').exists(): pathlib.Path('generated_input.py').write_text('GENERATED_INPUT = True\\n')\n" : "";
  putPrivate(coordinator, "checks/test_original.py", `import pathlib, unittest\nclass Original(unittest.TestCase):\n    def test_one(self):\n        p=pathlib.Path('observed-count'); p.write_text(str(int(p.read_text())+1) if p.exists() else '1')\n${outputControl}        self.assertEqual(2+2,4)\n    def test_two(self): self.assertEqual(3+3,6)\n`);
  putPrivate(coordinator, "extra/test_extra.py", "import unittest\nclass Extra(unittest.TestCase):\n    def test_extra(self): self.assertTrue(True)\n");
  putPrivate(coordinator, "cheap/test_cheap.py", "import unittest\nclass Cheap(unittest.TestCase):\n    def test_cheap(self): self.assertTrue(True)\n");
  const data = structuredClone(seed.settings); data.languages = ["python"];
  const suite = (id: string, folder: string) => ({ id, cwd: ".", sentinel: "pyproject.toml", argv: ["python3", "-m", "unittest", "discover", "-s", folder, "-v"], family: "unittest", solo: false, why: `Authored ${folder} suite` });
  data.suites = [suite("python", "checks"), suite("extra", "extra")];
  putPrivate(coordinator, "supertaskr.yaml", JSON.stringify(data));
  privateGit(coordinator, ["add", "."]); privateGit(coordinator, ["commit", "-qm", "Original explicit suite policy"]);
  const policyRevision = privateGit(coordinator, ["rev-parse", "HEAD"]), policy = gates.captureConfiguredGatePolicy({ productRoot: coordinator, productRevision: policyRevision, tool });
  privateGit(dir, ["clone", "-q", "--no-hardlinks", coordinator, candidate]);
  privateGit(candidate, ["config", "user.name", "Candidate fixture"]); privateGit(candidate, ["config", "user.email", "fixture@example.invalid"]);
  return { dir, coordinator, candidate, gates, tokenApi, tool, data, suite, policyRevision, policy,
    commit() { privateGit(candidate, ["add", "."]); privateGit(candidate, ["commit", "-qm", "Candidate settings differ from original policy"]); return privateGit(candidate, ["rev-parse", "HEAD"]); },
    cleanup() { rmSync(dir, { recursive: true, force: true }); } };
}

test("original configured commands and full membership grade a candidate that weakens its same-ID settings", async () => {
  test.setTimeout(180_000); const f = await fixture();
  try {
    const cheap = structuredClone(f.data); cheap.suites = [f.suite("python", "cheap")];
    putPrivate(f.candidate, "supertaskr.yaml", JSON.stringify(cheap)); const candidate = f.commit(), tree = privateGit(f.candidate, ["rev-parse", "HEAD^{tree}"]);
    // Immutable original policy remains usable after coordinator HEAD advances.
    putPrivate(f.coordinator, "README.md", "Later coordinator commit.\n"); privateGit(f.coordinator, ["add", "README.md"]); privateGit(f.coordinator, ["commit", "-qm", "Coordinator advanced"]);
    const runner = f.gates.createConfiguredGateRunner({ productRoot: f.candidate, productRevision: candidate, policy: f.policy });
    expect(runner.configuration.policyRevision).toBe(f.policyRevision); expect(runner.configuration.productRevision).toBe(candidate);
    const partial = runner.run(["python"]); expect(partial.code).toBe(0); expect(partial.capture.complete).toBe(false);
    expect(partial.verdicts[0]).toMatchObject({ bodies: 2, ref: candidate, tree, dirty: false });
    const full = runner.run(f.policy.required); expect(full.code).toBe(0); expect(full.capture.complete).toBe(true);
    expect(full.capture.required).toEqual(["extra", "python"]); expect(full.capture.whole).toBe(true);
    expect(full.capture.policy).toEqual(f.policy); expect(full.capture.candidate).toEqual({ productRoot: f.candidate, commit: candidate, tree });
    const original = full.capture.suites.find((row: any) => row.definition.id === "python");
    expect(original.definition.argv).toContain("checks"); expect(original.verdict.bodies).toBe(2); expect(original.output).toContain("test_two");
    expect(original.outputDigest).toBe(createHash("sha256").update(original.output).digest("hex"));
    expect(original.transcript).toContain(`ref=${candidate}`); expect(original.transcript).toContain("exit=0");
    expect(original.transcriptDigest).toBe(createHash("sha256").update(original.transcript).digest("hex"));
    expect(Object.isFrozen(full.capture.suites[0].definition.argv)).toBe(true);
    const token = () => JSON.parse(readFileSync(path.join(f.candidate, ".supertaskr/gate-verdict.json"), "utf8"));
    expect(token().suites.python.context).toEqual(full.configuration);
    const originalToken = token();
    expect(f.tokenApi.judgeToken({ token: originalToken, tree, context: full.configuration }).state).toBe("fresh");
    for (const context of [{ ...full.configuration, policyRevision: candidate }, { ...full.configuration, policyDigest: `sha256:${"f".repeat(64)}` }]) {
      expect(f.tokenApi.judgeToken({ token: originalToken, tree, context }).code).toBe("token-configuration");
    }
    const ordinary = f.gates.createConfiguredGateRunner({ productRoot: f.candidate, productRevision: candidate, tool: f.tool });
    const current = ordinary.run(["python"]); expect(current.code).toBe(0); expect(current.verdicts[0].bodies).toBe(1);
    expect(current.capture.suites[0].definition.argv).toContain("cheap"); expect(current.capture.policy.policyRevision).toBe(candidate);
    expect(current.capture.suites[0].definitionDigest).not.toBe(original.definitionDigest);
    expect(Object.keys(current.configuration).sort()).toEqual(["configurationDigest", "required", "toolManifestDigest"]);
    expect(f.tokenApi.judgeToken({ token: token(), tree, context: current.configuration }).state).toBe("fresh");
    expect(f.tokenApi.judgeToken({ token: token(), tree, context: full.configuration }).code).toBe("token-configuration");
    const sameConfigDefault = { ...full.configuration }; delete sameConfigDefault.policyRevision; delete sameConfigDefault.policyDigest;
    expect(f.tokenApi.judgeToken({ token: originalToken, tree, context: sameConfigDefault }).code).toBe("token-configuration");
    for (const invalid of [{ ...sameConfigDefault, policyRevision: f.policyRevision }, { ...sameConfigDefault, policyDigest: f.policy.digest },
      { ...full.configuration, policyRevision: "HEAD" }, { ...full.configuration, policyDigest: "bad" }]) expect(f.tokenApi.validGateContext(invalid)).toBe(false);
    expect(f.tokenApi.validGateContext(full.configuration)).toBe(true);
    expect(f.tokenApi.judgeToken({ token: token(), tree, context: { ...full.configuration, policyDigest: `sha256:${"f".repeat(64)}` } }).code).toBe("token-configuration");
    expect(f.gates.main(["--root", f.candidate, "--policy-revision", f.policyRevision, "--all"])).toBe(2);
  } finally { f.cleanup(); }
});

test("original policy retains both physical repositories, clean exact candidate and ancestry without accepting copied metadata", async () => {
  test.setTimeout(180_000); const f = await fixture();
  try {
    const runner = f.gates.createConfiguredGateRunner({ productRoot: f.candidate, productRevision: f.policyRevision, policy: f.policy });
    expect(runner.run(f.policy.required).capture.complete).toBe(true);
    expect(() => f.gates.createConfiguredGateRunner({ productRoot: f.candidate, productRevision: f.policyRevision, policy: structuredClone(f.policy) })).toThrow(/gate-policy-unrecognized|Original policy must be captured/);
    for (const root of [f.coordinator, f.candidate]) {
      const saved = `${root}-original`; renameSync(root, saved); cpSync(saved, root, { recursive: true });
      expect(privateGit(root, ["rev-parse", "HEAD"])).toBe(f.policyRevision);
      expect(() => runner.run(["python"])).toThrow(/original PRODUCT repository is unavailable or replaced/);
      expect(readFileSync(path.join(f.candidate, "observed-count"), "utf8")).toBe(root === f.coordinator ? "1" : "2");
      rmSync(root, { recursive: true }); renameSync(saved, root);
      expect(runner.run(f.policy.required).capture.complete).toBe(true);
    }
    putPrivate(f.candidate, "checks/test_original.py", "Uncommitted fixture editor bytes\n");
    expect(() => runner.run(["python"])).toThrow(/exact clean candidate/); privateGit(f.candidate, ["checkout", "--", "checks/test_original.py"]);
    putPrivate(f.candidate, "README.md", "A later candidate commit.\n"); const later = f.commit();
    expect(() => runner.run(["python"])).toThrow(/candidate HEAD\/tree/);
    privateGit(f.candidate, ["checkout", "-q", "--orphan", "unrelated"]); privateGit(f.candidate, ["add", "."]); privateGit(f.candidate, ["commit", "-qm", "Unrelated history with identical configured files"]);
    const unrelated = privateGit(f.candidate, ["rev-parse", "HEAD"]);
    expect(() => f.gates.createConfiguredGateRunner({ productRoot: f.candidate, productRevision: unrelated, policy: f.policy })).toThrow(/descend from the original/);
    privateGit(f.candidate, ["checkout", "-q", "--detach", later]);
    expect(f.gates.createConfiguredGateRunner({ productRoot: f.candidate, productRevision: later, policy: f.policy }).run(f.policy.required).capture.complete).toBe(true);
  } finally { f.cleanup(); }
});

test("original-policy grading refuses nonignored untracked inputs before a suite and files it creates afterward", async () => {
  test.setTimeout(180_000); const f = await fixture(true);
  try {
    const runner = f.gates.createConfiguredGateRunner({ productRoot: f.candidate, productRevision: f.policyRevision, policy: f.policy });
    const count = () => readFileSync(path.join(f.candidate, "observed-count"), "utf8"), token = () => readFileSync(path.join(f.candidate, ".supertaskr/gate-verdict.json"));
    expect(runner.run(f.policy.required).capture.complete).toBe(true); expect(count()).toBe("1");
    const before = token();
    putPrivate(f.candidate, "checks/test_untracked.py", "raise AssertionError('Untracked discovered input must not run')\n");
    expect(() => runner.run(f.policy.required)).toThrow(/exact clean candidate/);
    expect(count()).toBe("1"); expect(token()).toEqual(before);
    rmSync(path.join(f.candidate, "checks/test_untracked.py"));
    expect(runner.run(f.policy.required).capture.complete).toBe(true); expect(count()).toBe("2");
    const restored = token();
    putPrivate(f.candidate, ".supertaskr/write-nonignored", "Authored suite output control\n");
    expect(() => runner.run(["python"])).toThrow(/exact clean candidate/);
    expect(count()).toBe("3"); expect(readFileSync(path.join(f.candidate, "generated_input.py"), "utf8")).toBe("GENERATED_INPUT = True\n");
    expect(token()).toEqual(restored);
    rmSync(path.join(f.candidate, "generated_input.py")); rmSync(path.join(f.candidate, ".supertaskr/write-nonignored"));
    const final = runner.run(f.policy.required); expect(final.capture.complete).toBe(true); expect(count()).toBe("4");
    expect(f.tokenApi.judgeToken({ token: JSON.parse(token().toString()), tree: final.capture.candidate.tree, context: final.configuration }).state).toBe("fresh");
  } finally { f.cleanup(); }
});
