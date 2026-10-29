import { cpSync, readFileSync, renameSync, rmSync, symlinkSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { createProjectRuntime } from "../scripts/project-runtime.mjs";
import { guardClassIds } from "../scripts/dispatch-brief.mjs";
import { loadInstalledRecordTool, readInstalledMethodAsset } from "../scripts/records-check.mjs";
import { seedProjectSettings } from "../scripts/project-settings.mjs";
import { GENERIC_RECORD_PROFILE } from "../scripts/records-validation.mjs";
import { privateRecordFixture, privateGit, putPrivate, commitPrivate } from "./private-record-fixture";
import { testToolRuntime } from "../fixtures/tool-runtime";

function configured() {
  const f = privateRecordFixture(), tool = loadInstalledRecordTool(f.manifestPath);
  const seed = seedProjectSettings({ tool, recordsValidation: GENERIC_RECORD_PROFILE });
  if (seed.status !== "ready") throw Error(JSON.stringify(seed));
  const settings = structuredClone(seed.settings);
  settings.roles.builder = "authored-python-builder";
  settings.languages = ["python"];
  settings.smoke = { cwd: ".", sentinel: "hello.py", argv: ["python3", "-c", "from pathlib import Path; print(Path('hello.py').read_text().strip())"] };
  settings.guard_class = Object.fromEntries(guardClassIds(readInstalledMethodAsset(tool, "method/tasks/TASK-FORMAT.md").text).map((id, at) => [id, [at === 0 ? "security" : `guard-${id}`]]));
  putPrivate(f.product, "supertaskr.yaml", JSON.stringify(settings));
  const revision = commitPrivate(f.product);
  return { ...f, tool, settings, revision, runtime: () => createProjectRuntime({ productRoot: f.product, productRevision: revision, tool }) };
}

test("configured smoke, role and guard operations use exact committed PRODUCT data without private board reads", () => {
  const f = configured();
  try {
    rmSync(path.join(f.product, ".supertaskr"), { recursive: true });
    rmSync(f.records, { recursive: true });
    const runtime = f.runtime();
    putPrivate(f.product, "method/runtime/supertaskr.yaml", "roles:\n  builder: wrong-managed-fallback\n");
    putPrivate(f.product, "docs/CONVENTIONS.md", "invalid private board poison");
    putPrivate(f.product, "supertaskr.yaml", "invalid: [\n");
    expect(runtime.role("executor")).toEqual({ key: "builder", model: "authored-python-builder" });
    expect(runtime.process().settings.profile).toBe(f.settings.process.profile);
    expect(runtime.classify(["security/check.py"])).toEqual([{ path: "security/check.py", classes: [Object.keys(f.settings.guard_class)[0]] }]);
    expect(runtime.classify(["public.py"])).toEqual([]);
    expect(runtime.smoke()).toMatchObject({ code: 0, status: 0, productRevision: f.revision, stdout: "print('independent Python product')\n" });
    expect(() => readFileSync(path.join(f.product, ".supertaskr/gate-verdict.json"))).toThrow();
    const detached = runtime.process(); detached.settings.values.clear();
    expect(runtime.process().settings.values.size).toBeGreaterThan(0);
  } finally { f.cleanup(); }
});

test("configured operations distinguish empty sections, unsupported maps and failed actual commands", () => {
  const f = configured();
  try {
    const set = (mutate: (settings: any) => void) => {
      const settings = structuredClone(f.settings); mutate(settings);
      putPrivate(f.product, "supertaskr.yaml", JSON.stringify(settings));
      const revision = commitPrivate(f.product);
      return createProjectRuntime({ productRoot: f.product, productRevision: revision, tool: f.tool });
    };
    const empty = set(s => { s.smoke = null; s.guard_class = {}; });
    expect(() => empty.smoke()).toThrow(/missing configuration: smoke/);
    expect(() => empty.classify(["security/check.py"])).toThrow(/missing configuration: guard_class/);
    const bad = set(s => { delete s.guard_class[Object.keys(s.guard_class)[0]!]; });
    expect(() => bad.classify(["security/check.py"])).toThrow(/every declared METHOD class/);
    expect(() => f.runtime().classify(["../outside"])).toThrow(/PRODUCT-relative/);
    expect(set(s => { s.smoke.argv = ["python3", "-c", "raise SystemExit(7)"]; }).smoke()).toMatchObject({ code: 1, status: 7 });
    expect(set(s => { s.smoke.argv = ["missing-configured-smoke-binary"]; }).smoke()).toMatchObject({ code: 3, status: null });
  } finally { f.cleanup(); }
});

test("retained project runtime refuses copied-history replacement and outside command paths, then accepts its original", () => {
  const f = configured(), saved = f.product + "-original";
  try {
    const runtime = f.runtime();
    expect(runtime.smoke().code).toBe(0);
    renameSync(f.product, saved); cpSync(saved, f.product, { recursive: true });
    for (const action of [() => runtime.smoke(), () => runtime.role("executor"), () => runtime.classify(["security/check.py"])]) {
      expect(action).toThrow(/Original PRODUCT/);
    }
    rmSync(f.product, { recursive: true }); renameSync(saved, f.product);
    expect(runtime.smoke().code).toBe(0);
    rmSync(path.join(f.product, "hello.py")); symlinkSync(path.join(f.records, "docs/STATE.md"), path.join(f.product, "hello.py"));
    expect(() => runtime.smoke()).toThrow(/plain PRODUCT file/);
  } finally { f.cleanup(); }
});

test("installed CLI actually routes smoke and guard-class in a docs-free Python PRODUCT", () => {
  test.setTimeout(180_000);
  const installed = testToolRuntime(), f = configured();
  try {
    rmSync(path.join(f.product, ".supertaskr"), { recursive: true }); rmSync(f.records, { recursive: true });
    const entry = path.join(installed.packageRoot, "supertaskr.mjs");
    const run = (...args: string[]) => spawnSync(process.execPath, [entry, ...args, "--root", f.product], { cwd: f.product, encoding: "utf8", env: { ...process.env, NODE_PATH: "" } });
    expect(run("smoke")).toMatchObject({ status: 0 });
    const guarded = run("guard-class", "security/check.py"); expect(guarded.status, guarded.stderr).toBe(0); expect(JSON.parse(guarded.stdout)).toMatchObject({ guarded: true });
    const unguarded = run("guard-class", "public.py"); expect(unguarded.status, unguarded.stderr).toBe(0); expect(JSON.parse(unguarded.stdout)).toMatchObject({ guarded: false });
    expect(run("smoke", "--policy", "house-default").status).toBe(2);
    putPrivate(f.product, "supertaskr.yaml", "{}"); privateGit(f.product, ["add", "supertaskr.yaml"]); privateGit(f.product, ["commit", "-qm", "Invalid configured PRODUCT"]);
    const refused = run("smoke"); expect(refused.status).toBe(3); expect(refused.stderr).toContain("project-settings-invalid");
  } finally { f.cleanup(); }
});

test("committed configured directory and terminal-prefix guards reach the canonical classifier unchanged", () => {
  const f = configured();
  try {
    const first = Object.keys(f.settings.guard_class)[0]!;
    f.settings.guard_class[first] = [".claude/", "tools/gate-*", "src/*"];
    putPrivate(f.product, "supertaskr.yaml", JSON.stringify(f.settings)); const revision = commitPrivate(f.product);
    const runtime = createProjectRuntime({ productRoot: f.product, productRevision: revision, tool: f.tool });
    expect(runtime.classify([".claude/hooks/tool.mjs", "tools/gate-check.mjs", "src/feature.py"])).toEqual([
      { path: ".claude/hooks/tool.mjs", classes: [first] }, { path: "tools/gate-check.mjs", classes: [first] }, { path: "src/feature.py", classes: [first] },
    ]);
    expect(runtime.classify([".claude-other/file", "tools/gateX.mjs", "src-other/feature.py"])).toEqual([]);
  } finally { f.cleanup(); }
});
