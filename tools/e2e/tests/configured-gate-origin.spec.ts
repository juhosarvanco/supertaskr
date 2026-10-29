import { cpSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, symlinkSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { expect, test } from "@playwright/test";
import { testToolRuntime } from "../fixtures/tool-runtime";
import { privateGit, putPrivate, commitPrivate } from "./private-record-fixture";

test("a retained runner refuses same-history replacement before whole, scoped or range reads and accepts its restored original", async () => {
  test.setTimeout(180_000);
  const installed = testToolRuntime(), url = (name: string) => pathToFileURL(path.join(installed.runtimeRoot, "tools/e2e/scripts", `${name}.mjs`)).href;
  const records = await import(url("records-check")), settings = await import(url("project-settings")), profiles = await import(url("records-validation")), gates = await import(url("gate-run"));
  const tool = records.loadInstalledRecordTool(), seed = settings.seedProjectSettings({ tool, recordsValidation: profiles.GENERIC_RECORD_PROFILE });
  expect(seed.status).toBe("ready");
  const parent = mkdtempSync(path.join(tmpdir(), "configured-gate-origin-")), product = path.join(parent, "product"), original = path.join(parent, "original");
  mkdirSync(product);
  try {
    privateGit(product, ["init", "-q", "--initial-branch=main"]); privateGit(product, ["config", "user.name", "Origin fixture"]); privateGit(product, ["config", "user.email", "fixture@example.invalid"]);
    putPrivate(product, ".gitignore", ".supertaskr/\n__pycache__/\ngraded.flag\n"); putPrivate(product, "pyproject.toml", "[project]\nname='origin-example'\nversion='0.0.0'\n");
    putPrivate(product, "checks/test_example.py", "import pathlib, unittest\nclass Example(unittest.TestCase):\n    def test_actual(self):\n        p=pathlib.Path('graded.flag')\n        p.write_text(str(int(p.read_text())+1) if p.exists() else '1')\n        self.assertTrue(True)\n");
    const data = structuredClone(seed.settings); data.languages = ["python"];
    data.suites = [{ id: "python", cwd: ".", sentinel: "pyproject.toml", argv: ["python3", "-m", "unittest", "discover", "-s", "checks", "-v"], family: "unittest", solo: false, why: "Actual authored Python origin control" }];
    putPrivate(product, "supertaskr.yaml", JSON.stringify(data)); const revision = commitPrivate(product);
    const runner = gates.createConfiguredGateRunner({ productRoot: product, productRevision: revision, tool });
    expect(runner.run(["python"]).code).toBe(0); expect(readFileSync(path.join(product, "graded.flag"), "utf8")).toBe("1");
    const policyBytes = readFileSync(path.join(product, "supertaskr.yaml")), tree = privateGit(product, ["rev-parse", "HEAD^{tree}"]);
    renameSync(product, original); cpSync(original, product, { recursive: true });
    expect(privateGit(product, ["rev-parse", "HEAD"])).toBe(revision); expect(privateGit(product, ["rev-parse", "HEAD^{tree}"])).toBe(tree);
    expect(readFileSync(path.join(product, "supertaskr.yaml"))).toEqual(policyBytes);
    for (const action of [() => runner.run(["python"]), () => runner.owning("python", ["checks/test_example.py"]), () => runner.owed(`${revision}..${revision}`)]) {
      let finding; try { action(); } catch (error) { finding = error; }
      expect(finding).toMatchObject({ code: "gate-product-origin-changed" });
    }
    expect(readFileSync(path.join(product, "graded.flag"), "utf8")).toBe("1");
    rmSync(product, { recursive: true }); renameSync(original, product);
    expect(runner.run(["python"]).code).toBe(0); expect(readFileSync(path.join(product, "graded.flag"), "utf8")).toBe("2");
    expect(() => runner.owning("python", ["checks/test_example.py"])).toThrow(/scoped form needs its Playwright leg/);
    expect(runner.owed(`${revision}..${revision}`)).toMatchObject({ suites: [], changed: [] });
  } finally { rmSync(parent, { recursive: true, force: true }); }
});

test("configured and source-CI executable entries still run through a directory alias", () => {
  test.setTimeout(180_000); const installed=testToolRuntime(), parent=mkdtempSync(path.join(tmpdir(),"gate-entry-alias-")), alias=path.join(parent,"tool");
  try {
    symlinkSync(installed.runtimeRoot,alias,"dir");
    const run=(name:string)=>spawnSync(process.execPath,[path.join(alias,"tools/e2e/scripts",`${name}.mjs`)],{encoding:"utf8"});
    const gate=run("gate-run");expect(gate.status).toBe(2);expect(gate.stdout).toContain("--root");
    const source=run("source-ci-owed");expect(source.status).toBe(2);expect(JSON.parse(source.stdout).problem).toContain("Source CI requires");
    const policy=run("gate-policy");expect(policy.status).toBe(3);expect(JSON.parse(policy.stdout)).toMatchObject({status:"refused",code:"gate-policy-usage"});
    const imports=spawnSync(process.execPath,["--input-type=module","-",...["gate-run","source-ci-owed","gate-policy","product-hook"].map(name=>pathToFileURL(path.join(alias,"tools/e2e/scripts",`${name}.mjs`)).href)],
      {encoding:"utf8",input:"for(const file of process.argv.slice(2)) await import(file); process.stdout.write('imported without executing');"});
    expect(imports.status,imports.stderr).toBe(0);expect(imports.stdout).toBe("imported without executing");
  }finally{rmSync(parent,{recursive:true,force:true});}
});
