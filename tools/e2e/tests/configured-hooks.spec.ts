import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { expect, test } from "@playwright/test";
import { fixtureFor } from "../fixtures/test-project";
import { testToolRuntime } from "../fixtures/tool-runtime";
import { privateGit, putPrivate, commitPrivate } from "./private-record-fixture";
const source = fixtureFor(import.meta.url);

test("the fixed copied hook entry allows non-push and refuses ungraded pushes without an install, build or policy helper", () => {
  const parent = mkdtempSync(path.join(tmpdir(), "cold-configured-hook-")), cold = path.join(parent, "tool"), product = path.join(parent, "product  ");
  const copy = (file: string) => { mkdirSync(path.dirname(path.join(cold, file)), { recursive: true }); copyFileSync(path.join(source, file), path.join(cold, file)); };
  try {
    for (const owner of ["lane-fence", "gate-token", "expand-fence", "hook-install", "pre-push-guard", "push-guard", "landing-gate", "configured-gate-reader", "is-main"]) copy(`cli/${owner}.mjs`);
    for (const file of ["tools/e2e/scripts/checkout-currency.mjs", "tools/e2e/scripts/product-hook.mjs", "lib/parser/src/fence.ts"]) copy(file);
    const toolAlias = path.join(parent, "tool-alias"); symlinkSync(cold, toolAlias, "dir");
    mkdirSync(product); privateGit(product, ["init", "-q", "--initial-branch=main"]); privateGit(product, ["config", "user.name", "Cold hook"]); privateGit(product, ["config", "user.email", "fixture@example.invalid"]);
    putPrivate(product, "README.md", "# Authored cold hook example\n"); const revision = commitPrivate(product);
    const call = (mode: string, input: string) => spawnSync(process.execPath, [path.join(toolAlias, "tools/e2e/scripts/product-hook.mjs"), "--root", product, "--mode", mode, ...(mode === "pre-push" ? ["--", "fixture", "file://unused"] : [])], { cwd: product, input, encoding: "utf8", env: { ...process.env, NODE_PATH: "" } });
    expect(existsSync(path.join(cold, "node_modules"))).toBe(false); expect(existsSync(path.join(cold, "lib/parser/dist"))).toBe(false); expect(existsSync(path.join(cold, "tools/e2e/scripts/gate-policy.mjs"))).toBe(false);
    const ordinary = call("pre-tool", JSON.stringify({ tool_name: "Bash", cwd: product, tool_input: { command: "echo ordinary action" } })); expect(ordinary.status, ordinary.stderr).toBe(0);
    const push = call("pre-tool", JSON.stringify({ tool_name: "Bash", cwd: product, tool_input: { command: "git push origin main" } })); expect(push.status, push.stderr).toBe(2); expect(push.stderr).toContain("token-missing");
    const gitPush = call("pre-push", `refs/heads/main ${revision} refs/heads/main ${"0".repeat(40)}\n`); expect(gitPush.status, gitPush.stderr).toBe(1); expect(gitPush.stderr).toContain("token-missing");
    expect(push.stderr + gitPush.stderr).not.toContain("ERR_MODULE_NOT_FOUND");
  } finally { rmSync(parent, { recursive: true, force: true }); }
});

async function warmFixture() {
  const installed = testToolRuntime(), url = (name: string) => pathToFileURL(path.join(installed.runtimeRoot, "tools/e2e/scripts", `${name}.mjs`)).href;
  const checker = await import(url("records-check")), settings = await import(url("project-settings")), profiles = await import(url("records-validation")), workspace = await import(url("workspace"));
  const tool = checker.loadInstalledRecordTool(), seed = settings.seedProjectSettings({ tool, recordsValidation: profiles.GENERIC_RECORD_PROFILE }); expect(seed.status).toBe("ready");
  const parent = realpathSync(mkdtempSync(path.join(tmpdir(), "configured-hook-"))), product = path.join(parent, "product  "), records = path.join(parent, "records"), bin = path.join(parent, "bin");
  for (const root of [product, records]) { mkdirSync(root); privateGit(root, ["init", "-q", "--initial-branch=main"]); privateGit(root, ["config", "user.name", "Configured hook"]); privateGit(root, ["config", "user.email", "fixture@example.invalid"]); }
  mkdirSync(bin); writeFileSync(path.join(bin, "gh"), "#!/bin/sh\necho 'Authored fixture has no remote credentials' >&2\nexit 127\n", { mode: 0o755 });
  const env = { ...process.env, NODE_PATH: "", PATH: `${bin}${path.delimiter}${process.env.PATH}` };
  const data = structuredClone(seed.settings); data.languages = ["python"]; data.suites = [{ id: "python", cwd: ".", sentinel: "pyproject.toml", argv: ["python3", "-m", "unittest", "discover", "-s", "checks", "-v"], family: "unittest", solo: false, why: "Actual authored Python hook control" }];
  putPrivate(product, ".gitignore", ".supertaskr/\n__pycache__/\n"); putPrivate(product, "supertaskr.yaml", JSON.stringify(data)); putPrivate(product, "pyproject.toml", "[project]\nname='hook-example'\nversion='0.0.0'\n");
  putPrivate(product, "checks/test_example.py", "import unittest\nclass Example(unittest.TestCase):\n    def test_actual(self): self.assertTrue(True)\n"); const revision = commitPrivate(product);
  for (const file of ["NORTH_STAR.md", "ROADMAP.md", "ARCHITECTURE.md", "CONVENTIONS.md", "STATE.md"]) putPrivate(records, `docs/${file}`, readFileSync(path.join(installed.runtimeRoot, "method/docs-templates", file)));
  const identity = workspace.measureProductIdentity(product);
  putPrivate(records, workspace.WORKSPACE_ASSOCIATION_REL_PATH, JSON.stringify({ version: 1, projectId: "hook-example", product: { objectFormat: identity.objectFormat, rootCommits: identity.rootCommits } })); const recordsRevision = commitPrivate(records);
  const binding = JSON.stringify({ version: 1, projectId: "hook-example", productRoot: product, recordsRoot: records }); putPrivate(product, workspace.WORKSPACE_BINDING_REL_PATH, binding);
  const gate = (...names: string[]) => spawnSync(process.execPath, [path.join(installed.packageRoot, "supertaskr.mjs"), "--root", product, "gate", ...names], { cwd: parent, encoding: "utf8", env });
  const hook = (mode: "pre-tool"|"pre-push", input?: string, cwd = product, observedEnv = env) => spawnSync(process.execPath, [path.join(installed.runtimeRoot, "tools/e2e/scripts/product-hook.mjs"), "--root", product, "--mode", mode, ...(mode === "pre-push" ? ["--", "fixture", "file://unused"] : [])], { cwd, input: input ?? (mode === "pre-tool" ? JSON.stringify({ tool_name: "Bash", cwd, tool_input: { command: "git push origin main" }, productRoot: "/untrusted", required: [] }) : `refs/heads/main ${privateGit(product, ["rev-parse", "HEAD"])} refs/heads/main ${"0".repeat(40)}\n`), encoding: "utf8", env: observedEnv });
  return { parent, product, records, installed, tool, data, binding, revision, recordsRevision, gate, hook, cleanup: () => rmSync(parent, { recursive: true, force: true }) };
}

test("configured hooks consume actual Python token context and canonical committed private checks, with no product-doc fallback", async () => {
  test.setTimeout(180_000); const f = await warmFixture(); try {
    const graded = f.gate("--all"); expect(graded.status, graded.stdout + graded.stderr).toBe(0); expect(graded.stdout).toContain("bodies=1");
    putPrivate(f.product, "docs/STATE.md", "poison unselected PRODUCT board\n"); putPrivate(f.product, "docs/CONVENTIONS.md", "poison private policy fallback\n");
    putPrivate(f.records, "docs/tasks/T-999-working.md", "invalid uncommitted private editor bytes\n");
    const log = path.join(f.parent, "access.jsonl"), observedEnv = { ...process.env, NODE_PATH: "", PATH: `${path.join(f.parent,"bin")}${path.delimiter}${process.env.PATH}`,
      NODE_OPTIONS: `--require=${path.join(f.installed.sourceRoot,"tools/e2e/fixtures/private-access-observer.cjs")}`,
      SUPERTASKR_OBSERVE_PRIVATE_LOG: log, SUPERTASKR_OBSERVE_PRIVATE_ROOTS: JSON.stringify([f.product,...f.installed.observationRoots]), SUPERTASKR_OBSERVE_PRIVATE_NAMESPACES: JSON.stringify(f.installed.privateNamespaces) };
    for (const mode of ["pre-tool", "pre-push"] as const) {
      writeFileSync(log, ""); const read = f.hook(mode, undefined, f.product, observedEnv); expect(read.status, read.stderr).toBe(0); expect(read.stderr).toContain("GRAPH WAS NOT ASKED");
      const events = readFileSync(log,"utf8").trim().split("\n").filter(Boolean).map(line=>JSON.parse(line));
      expect(events.filter(event=>event.kind==="observer-installed").length).toBeGreaterThan(1);
      expect(events.filter(event=>event.kind!=="observer-installed" && event.path!==path.join(f.product,".supertaskr/workspace.json"))).toEqual([]);
    }
    writeFileSync(log, ""); const calibration=spawnSync(process.execPath,["-e","require('node:fs').readFileSync(process.argv[1])",path.join(f.product,"docs/STATE.md")],{env:observedEnv}); expect(calibration.status).toBe(0);
    expect(readFileSync(log,"utf8")).toContain(path.join(f.product,"docs/STATE.md"));
    putPrivate(f.records, "docs/tasks/T-901-negative.md", "---\nid: T-901\ntitle: Authored negative\nstatus: suggested\nsuggested_by: hook fixture\nblocked_by: [T-999]\n---\n");
    privateGit(f.records, ["add", "docs/tasks/T-901-negative.md"]); privateGit(f.records, ["commit", "-qm", "Authored committed dangling blocker"]);
    for (const mode of ["pre-tool", "pre-push"] as const) { const read = f.hook(mode); expect(read.status, read.stderr).toBe(mode === "pre-tool" ? 2 : 1); expect(read.stderr).toContain("cheap-checks-found"); expect(read.stderr).toContain("T-999"); }
    privateGit(f.records, ["reset", "--hard", f.recordsRevision]);
    rmSync(path.join(f.product, ".supertaskr/workspace.json")); const absent = f.hook("pre-tool"); expect(absent.status).toBe(2); expect(absent.stderr).toContain("hook-records-binding-required");
    putPrivate(f.product, ".supertaskr/workspace.json", f.binding); expect(f.hook("pre-tool").status).toBe(0);
  } finally { f.cleanup(); }
});

test("configured hook membership cannot be narrowed and pre-push reads the pushed candidate configuration independently of HEAD", async () => {
  test.setTimeout(180_000); const f = await warmFixture(); try {
    expect(f.gate("--all").status).toBe(0); const tokenFile = path.join(f.product, ".supertaskr/gate-verdict.json"), oldToken = readFileSync(tokenFile, "utf8");
    privateGit(f.product, ["branch", "prior", f.revision]); f.data.suites.push({ ...f.data.suites[0], id: "checks" }); putPrivate(f.product, "supertaskr.yaml", JSON.stringify(f.data));
    privateGit(f.product, ["add", "supertaskr.yaml"]); privateGit(f.product, ["commit", "-qm", "Configure second actual suite"]); const current = privateGit(f.product, ["rev-parse", "HEAD"]); expect(current).not.toBe(f.revision);
    const stale = f.hook("pre-tool"); expect(stale.status).toBe(2); expect(stale.stderr).toMatch(/token-(?:incomplete|configuration)/);
    expect(f.gate("python").status).toBe(0); const partial = f.hook("pre-tool"); expect(partial.status).toBe(2); expect(partial.stderr).toContain("token-incomplete");
    expect(f.gate("--all").status).toBe(0); expect(f.hook("pre-tool").status).toBe(0);
    const full = readFileSync(tokenFile, "utf8"), changed = JSON.parse(full); changed.suites.checks.context.toolManifestDigest = "f".repeat(64); writeFileSync(tokenFile, JSON.stringify(changed));
    expect(f.hook("pre-tool").stderr).toContain("token-configuration");
    writeFileSync(tokenFile, oldToken);
    const candidate = f.hook("pre-push", `refs/heads/prior ${f.revision} refs/heads/prior ${"0".repeat(40)}\n`); expect(candidate.status, candidate.stderr).toBe(0);
    expect(f.hook("pre-tool").status).toBe(2); writeFileSync(tokenFile, full);
  } finally { f.cleanup(); }
});

test("a related checkout or lane needing original paired authority refuses explicitly while unrelated repositories stay outside scope", async () => {
  test.setTimeout(180_000); const f = await warmFixture(); try {
    expect(f.gate("--all").status).toBe(0);
    const related = path.join(f.parent, "related"); privateGit(f.product, ["worktree", "add", "--detach", related, "HEAD"]);
    const relatedRead = f.hook("pre-tool", JSON.stringify({ tool_name: "Bash", cwd: related, tool_input: { command: "git push origin main" } }), related);
    expect(relatedRead.status).toBe(2); expect(relatedRead.stderr).toContain("hook-related-worktree-unadapted");
    const unrelated = path.join(f.parent, "unrelated"); mkdirSync(unrelated); privateGit(unrelated, ["init", "-q"]);
    expect(f.hook("pre-tool", JSON.stringify({ tool_name: "Bash", cwd: unrelated, tool_input: { command: "git push origin main" } }), unrelated).status).toBe(0);
    privateGit(f.product,["update-ref","refs/remotes/origin/main",f.revision]);expect(f.hook("pre-tool").status).toBe(0);
    privateGit(f.product,["checkout","-qb","authored-feature"]);putPrivate(f.product,"README.md","# Authored local merge example\n");privateGit(f.product,["add","README.md"]);privateGit(f.product,["commit","-qm","Authored feature"]);
    privateGit(f.product,["checkout","main"]);privateGit(f.product,["merge","--no-ff","-qm","Authored merge route","authored-feature"]);expect(f.gate("--all").status).toBe(0);
    for(const mode of ["pre-tool","pre-push"] as const){const merge=f.hook(mode);expect(merge.status).toBe(mode==="pre-tool"?2:1);expect(merge.stderr).toContain("hook-paired-authority-unavailable");}
    privateGit(f.product, ["checkout", "-qb", "task/T-901-hook-example"]);
    const lane = f.hook("pre-tool"); expect(lane.status).toBe(2); expect(lane.stderr).toContain("hook-paired-authority-unavailable");
  } finally { f.cleanup(); }
});
