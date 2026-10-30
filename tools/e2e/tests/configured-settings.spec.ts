import { spawnSync } from "node:child_process";
import { existsSync, linkSync, readFileSync, rmSync, symlinkSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { parse as parseYaml, stringify } from "yaml";
import { parseProcessSchema } from "../../../lib/parser/dist/pure.js";
import { loadInstalledRecordTool, readInstalledMethodAsset } from "../scripts/records-check.mjs";
import { seedProjectSettings, validateProjectSettingsText, requireProjectSection } from "../scripts/project-settings.mjs";
import { GENERIC_RECORD_PROFILE } from "../scripts/records-validation.mjs";
import { privateRecordFixture, privateGit, putPrivate } from "./private-record-fixture";
import { testToolRuntime } from "../fixtures/tool-runtime";

function fixture() {
  const f = privateRecordFixture(), tool = loadInstalledRecordTool(f.manifestPath);
  const seed = seedProjectSettings({ tool, recordsValidation: GENERIC_RECORD_PROFILE });
  if (seed.status !== "ready") throw Error(JSON.stringify(seed));
  putPrivate(f.product, ".gitignore", ".supertaskr/\n");
  putPrivate(f.product, "supertaskr.yaml", `# Authored configuration comment\n${seed.yaml}`);
  privateGit(f.product, ["add", ".gitignore", "supertaskr.yaml"]); privateGit(f.product, ["commit", "-qm", "Explicit configured settings"]);
  const revision = privateGit(f.product, ["rev-parse", "HEAD"]);
  const installed = testToolRuntime(), entry = path.join(installed.packageRoot, "supertaskr.mjs");
  rmSync(path.join(f.product, ".supertaskr"), { recursive: true }); rmSync(f.records, { recursive: true });
  const run = (...args: string[]) => spawnSync(process.execPath, [entry, "settings", "--root", f.product, ...args], { cwd: f.product, encoding: "utf8", env: { ...process.env, NODE_PATH: "" } });
  return { ...f, tool, seed, revision, run };
}
test("installed settings reads committed roles/process and edits only an explicit working root configuration", () => {
  test.setTimeout(180_000); const f = fixture();
  try {
    const selected = f.run(); expect(selected.status, selected.stderr).toBe(0); expect(selected.stdout).toContain("committed settings: supertaskr.yaml");
    expect(selected.stdout).toContain("build.criteria_echo = on");
    expect(f.run("role", "executor")).toMatchObject({ status: 0, stdout: `${JSON.stringify({ model: f.seed.settings.roles.builder, key: "builder" })}\n` });
    const template = "roles:\n  builder: wrong managed fallback\n"; putPrivate(f.product, "method/runtime/supertaskr.yaml", template);
    const edited = f.run("set", "build.criteria_echo", "off"); expect(edited.status, edited.stderr).toBe(0);
    const text = readFileSync(path.join(f.product, "supertaskr.yaml"), "utf8"); expect(text).toContain("# Authored configuration comment");
    expect(parseYaml(text).process.switches["build.criteria_echo"]).toBe("off");
    expect(readFileSync(path.join(f.product, "method/runtime/supertaskr.yaml"), "utf8")).toBe(template);
    expect(f.run().stdout).toContain("build.criteria_echo = on");
    const working = f.run("--working"); expect(working.status, working.stderr).toBe(0); expect(working.stdout).toContain("working editor settings"); expect(working.stdout).toContain("build.criteria_echo = off");
    expect(privateGit(f.product, ["rev-parse", "HEAD"])).toBe(f.revision);
    expect(existsSync(path.join(f.product, ".supertaskr/gate-verdict.json"))).toBe(false);
    const proposed = validateProjectSettingsText({ source: text, tool: f.tool }); expect(proposed.status).toBe("ready"); expect(requireProjectSection(proposed, "suites")).toMatchObject({ status: "cannot-run", code: 3, diagnostics: [expect.stringContaining("editor")] });
    putPrivate(f.product, "supertaskr.yaml", "invalid: [\n");
    expect(f.run().status).toBe(0); expect(f.run("--working").status).toBe(3); expect(f.run("set", "build.criteria_echo", "off").status).toBe(3);
  } finally { f.cleanup(); }
});

test("settings preserves canonical floor/declarative/constraint refusals and current committed context", () => {
  test.setTimeout(180_000); const f = fixture();
  try {
    const file = path.join(f.product, "supertaskr.yaml"), before = readFileSync(file);
    const schema = parseProcessSchema(readInstalledMethodAsset(f.tool, "method/runtime/process-schema.yaml").text);
    const floor = [...schema.switches.values()].find(row => row.floor)!;
    const declarative = [...schema.switches.values()].find(row => row.implementation === "declarative" && !row.floor)!;
    for (const args of [[floor.id, floor.values[0]!], [declarative.id, declarative.values[0]!], ["build.criteria_echo", "not-a-value"]]) expect(f.run("set", ...args).status).toBe(2);
    const forbidden = f.run("set", "record.bands", "off"); expect(forbidden.status).toBe(2); expect(forbidden.stderr).toContain("FORBIDDEN COMBINATION"); expect(forbidden.stderr).toContain("merge.meters_to_bands");
    expect(readFileSync(file)).toEqual(before);
    const data = structuredClone(f.seed.settings); data.roles.builder = "explicit-new-builder"; putPrivate(f.product, "supertaskr.yaml", stringify(data));
    privateGit(f.product, ["add", "supertaskr.yaml"]); privateGit(f.product, ["commit", "-qm", "Changed configured settings"]); const current = privateGit(f.product, ["rev-parse", "HEAD"]);
    expect(current).not.toBe(f.revision);
    expect(f.run("--at", f.revision, "role", "executor").stdout).toContain(f.seed.settings.roles.builder);
    const stale = f.run("--at", f.revision, "set", "build.criteria_echo", "off"); expect(stale.status).toBe(3); expect(stale.stderr).toContain("project-runtime-revision-changed");
    expect(readFileSync(file, "utf8")).toBe(stringify(data));
  } finally { f.cleanup(); }
});

test("settings refuses foreign linked editor leaves and leaves their bytes intact, with plain write positive", () => {
  test.setTimeout(180_000); const f = fixture();
  try {
    const file = path.join(f.product, "supertaskr.yaml"), original = readFileSync(file), canary = path.join(f.dir, "canary.yaml");
    putPrivate(f.dir, "canary.yaml", original);
    for (const kind of ["symlink", "hardlink"]) {
      rmSync(file); if (kind === "symlink") symlinkSync(canary, file); else linkSync(canary, file);
      const refused = f.run("set", "build.criteria_echo", "off"); expect(refused.status, refused.stderr).toBe(3);
      expect(refused.stderr).toMatch(/project-settings-file-kind|settings-editor-file/); expect(readFileSync(canary)).toEqual(original);
      rmSync(file); putPrivate(f.product, "supertaskr.yaml", original);
    }
    expect(f.run("set", "build.criteria_echo", "off").status).toBe(0); expect(readFileSync(canary)).toEqual(original);
  } finally { f.cleanup(); }
});

test("installed settings reference detects staleness and uses schema generation without selected private records", () => {
  test.setTimeout(180_000); const f = fixture();
  try {
    expect(f.run("reference", "--check").status).toBe(1);
    const reference = f.run("reference"); expect(reference.status, reference.stderr).toBe(0); expect(reference.stdout).toContain("# 15 — Settings");
    const wrote = f.run("reference", "--write"); expect(wrote.status, wrote.stderr).toBe(0);
    expect(f.run("reference", "--check").status).toBe(0);
    expect(readFileSync(path.join(f.product, "docs/reference/15-settings.md"), "utf8")).toBe(reference.stdout.replace(/\n$/, ""));
    expect(f.run("reference", "--write", "--check").status).toBe(2);
    privateGit(f.product, ["rm", "supertaskr.yaml"]); privateGit(f.product, ["commit", "-qm", "Unconfigured PRODUCT"]);
    const missing = f.run(); expect(missing.status).toBe(3); expect(missing.stderr).toContain("project-settings-missing");
  } finally { f.cleanup(); }
});
