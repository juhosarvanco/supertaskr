import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { parse as parseYaml } from "yaml";
import { loadInstalledRecordTool } from "../scripts/records-check.mjs";
import { seedProjectSettings } from "../scripts/project-settings.mjs";
import { GENERIC_RECORD_PROFILE } from "../scripts/records-validation.mjs";
import { parseUnittestSeconds, parseE2eSeconds, parseGraphHeadroom, parseLibSuiteSeconds } from "../scripts/health-bands.mjs";
import { privateRecordFixture, privateGit, putPrivate } from "./private-record-fixture";
import { testToolRuntime } from "../fixtures/tool-runtime";

function fixture() {
  const f = privateRecordFixture(), tool = loadInstalledRecordTool(f.manifestPath), seed = seedProjectSettings({ tool, recordsValidation: GENERIC_RECORD_PROFILE });
  if (seed.status !== "ready") throw Error(JSON.stringify(seed));
  const settings = structuredClone(seed.settings); settings.languages = ["python"];
  settings.bands = [{ id: "python-duration", metric: "Actual authored Python test duration", unit: "seconds", healthy: "below", drift: 100, breach: 200,
    authority: { kind: "readings", name: "Explicit unittest capture", marker: "unittest-seconds" }, measured: { at: "ordinary authored fixture", reason: "Thresholds deliberately surround a real small Python test for the healthy control" } }];
  putPrivate(f.product, "checks/test_health.py", "import time, unittest\nclass Health(unittest.TestCase):\n    def test_real(self):\n        time.sleep(0.02)\n        self.assertEqual(2+2,4)\n");
  putPrivate(f.product, ".gitignore", ".supertaskr/\n__pycache__/\n");
  const commit = () => { putPrivate(f.product, "supertaskr.yaml", JSON.stringify(settings)); privateGit(f.product, ["add", ".gitignore", "checks", "supertaskr.yaml"]); privateGit(f.product, ["commit", "-qm", "Explicit configured health"]); return privateGit(f.product, ["rev-parse", "HEAD"]); };
  const revision = commit(), installed = testToolRuntime();
  const actual = spawnSync("python3", ["-m", "unittest", "discover", "-s", "checks", "-v"], { cwd: f.product, encoding: "utf8" });
  expect(actual.status, actual.stderr).toBe(0);
  const capture = path.join(f.dir, "actual-unittest.txt"); writeFileSync(capture, actual.stdout + actual.stderr);
  const run = (...args: string[]) => spawnSync(process.execPath, [path.join(installed.packageRoot, "supertaskr.mjs"), "health", "--root", f.product, ...args], { cwd: f.product, encoding: "utf8", env: { ...process.env, NODE_PATH: "" } });
  return { ...f, settings, revision, installed, capture, run, commit };
}

test("installed health compares explicit generic bands against real Python output without private context", () => {
  test.setTimeout(180_000); const f = fixture();
  try {
    rmSync(path.join(f.product, ".supertaskr"), { recursive: true }); rmSync(f.records, { recursive: true });
    const plain = f.run("--readings", f.capture); expect(plain.status, plain.stderr).toBe(0); expect(plain.stdout).toContain("1 inside"); expect(plain.stdout).not.toContain("docs-headroom/");
    expect(f.run().status).toBe(3); expect(f.run().stdout).toContain("1 unread");
    expect(f.run("--list").stdout).toContain('"id":"python-duration"');
    expect(f.run("--config", "house.config.mjs").status).toBe(2);
    expect(f.run("--readings", f.capture, "--readings", f.capture).stderr).toContain("health-reading-ambiguous");
    const log = path.join(f.dir, "private-access.jsonl"), env = { ...process.env, NODE_PATH: "", NODE_OPTIONS: `--require=${path.join(f.installed.sourceRoot,"tools/e2e/fixtures/private-access-observer.cjs")}`,
      SUPERTASKR_OBSERVE_PRIVATE_LOG: log, SUPERTASKR_OBSERVE_PRIVATE_ROOTS: JSON.stringify([f.product, ...f.installed.observationRoots]), SUPERTASKR_OBSERVE_PRIVATE_NAMESPACES: JSON.stringify([f.records, ...f.installed.privateNamespaces]) };
    writeFileSync(log, "");
    const observed = spawnSync(process.execPath, [path.join(f.installed.packageRoot,"supertaskr.mjs"), "health", "--root", f.product, "--readings", f.capture], { cwd: f.product, encoding: "utf8", env });
    expect(observed.status, observed.stderr).toBe(0);
    const events = readFileSync(log,"utf8").trim().split("\n").filter(Boolean).map(line=>JSON.parse(line));
    expect(events.some(event=>event.kind==="observer-installed")).toBe(true); expect(events.filter(event=>event.kind!=="observer-installed")).toEqual([]);
    putPrivate(f.product,"docs/STATE.md","Armed private-read calibration"); writeFileSync(log,"");
    expect(spawnSync(process.execPath,["-e","require('node:fs').readFileSync(process.argv[1])",path.join(f.product,"docs/STATE.md")],{env}).status).toBe(0);
    expect(readFileSync(log,"utf8")).toContain("docs/STATE.md");
  } finally { f.cleanup(); }
});

test("health names unsupported tree/output authorities and explicit empty configuration", () => {
  test.setTimeout(180_000); const f = fixture();
  try {
    const band = f.settings.bands[0] as any;
    band.authority.marker = "unknown-metric-parser"; f.commit();
    const unsupported = f.run("--readings", f.capture); expect(unsupported.status).toBe(3); expect(unsupported.stderr).toContain("health-reading-unsupported");
    band.authority = { kind: "tree", name: "Missing explicit committed tree-reader configuration" }; f.commit();
    expect(f.run().stderr).toContain("health-tree-authority-unsupported");
    f.settings.bands = []; f.commit(); expect(f.run().status).toBe(3); expect(f.run().stderr).toContain("missing configuration: bands");
    expect(parseUnittestSeconds("Ran 0 tests in 0.000s\n")).toBeNull(); expect(parseUnittestSeconds("Ran 1 test in 0.020s\nRan 1 test in 0.030s\n")).toBeNull();
    expect(parseUnittestSeconds("Ran 1 test in 0.020s\n")).toMatchObject({value:0.02});
  } finally { f.cleanup(); }
});

test("health filing uses the selected records save service and derived INDEX, never PRODUCT docs or checks", () => {
  test.setTimeout(180_000); const f = fixture();
  try {
    const band = f.settings.bands[0] as any; band.drift = 0.001; band.breach = 0.002; const product = f.commit();
    const records = privateGit(f.records,["rev-parse","HEAD"]);
    const filed = f.run("--readings",f.capture,"--file"); expect(filed.status,filed.stderr+filed.stdout).toBe(1);
    expect(filed.stdout).toContain('"status":"saved"'); expect(filed.stdout).toContain("records save save-");
    expect(privateGit(f.product,["rev-parse","HEAD"])).toBe(product); expect(existsSync(path.join(f.product,"docs/tasks"))).toBe(false);
    expect(existsSync(path.join(f.product,".supertaskr/gate-verdict.json"))).toBe(false);
    const accepted = privateGit(f.records,["rev-parse","HEAD"]); expect(accepted).not.toBe(records);
    const changed = privateGit(f.records,["diff","--name-only",records,accepted]).split("\n"); expect(changed).toContain("docs/INDEX.md");
    const card = changed.find(file=>file.startsWith("docs/tasks/"))!; const text = readFileSync(path.join(f.records,card),"utf8");
    expect(parseYaml(text.split("---")[1]!).status).toBe("suggested"); expect(text).toContain("Health band: python-duration"); expect(text).toContain("`supertaskr.yaml bands`");
    expect(readFileSync(path.join(f.records,"docs/INDEX.md"),"utf8")).toContain("# Index");
    const repeated = f.run("--readings",f.capture,"--file"); expect(repeated.status,repeated.stderr).toBe(1); expect(repeated.stdout).toContain("already on the selected board"); expect(privateGit(f.records,["rev-parse","HEAD"])).toBe(accepted);
  } finally { f.cleanup(); }
});

test("health filing without explicit records binding refuses instead of reading a PRODUCT board", () => {
  test.setTimeout(180_000); const f = fixture();
  try {
    const band = f.settings.bands[0] as any; band.drift=0.001;band.breach=0.002;f.commit();
    rmSync(path.join(f.product,".supertaskr"),{recursive:true});putPrivate(f.product,"docs/STATE.md","Poison PRODUCT private fallback");
    const refused=f.run("--readings",f.capture,"--file");expect(refused.status).toBe(3);expect(refused.stderr).toContain("health-records-not-bound");
    expect(readFileSync(path.join(f.product,"docs/STATE.md"),"utf8")).toBe("Poison PRODUCT private fallback");expect(existsSync(path.join(f.product,"docs/tasks"))).toBe(false);
  } finally { f.cleanup(); }
});

test("malformed nonfinite output cannot become a healthy configured reading", () => {
  test.setTimeout(180_000); const f=fixture();
  try {
    expect(parseLibSuiteSeconds("Running unittests src/lib.rs\ntest result: ok. finished in 1.2.3s\n")).toBeNull();
    expect(parseE2eSeconds("1 passed (1.2.3s)")).toBeNull();
    expect(parseGraphHeadroom(`budget: 1 of 2 bytes (50%) - ${"9".repeat(400)} left`)).toBeNull();
    const band=f.settings.bands[0] as any;band.authority.marker="playwright-seconds";f.commit();writeFileSync(f.capture,"1 passed (1.2.3s)\n");
    const result=f.run("--readings",f.capture);expect(result.status,result.stderr).toBe(3);expect(result.stdout).toContain("1 unread");expect(result.stdout).toContain("0 inside");
  } finally { f.cleanup(); }
});
