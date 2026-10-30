import { existsSync, readFileSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { guardClassIds, unstampedLines } from "../scripts/dispatch-brief.mjs";
import { loadInstalledRecordTool, readInstalledMethodAsset } from "../scripts/records-check.mjs";
import { seedProjectSettings } from "../scripts/project-settings.mjs";
import { GENERIC_RECORD_PROFILE } from "../scripts/records-validation.mjs";
import { privateGit, privateRecordFixture, putPrivate } from "./private-record-fixture";
import { testToolRuntime } from "../fixtures/tool-runtime";

function firstViewFixture() {
  const f = privateRecordFixture(), tool = loadInstalledRecordTool(f.manifestPath), seed = seedProjectSettings({ tool, recordsValidation: GENERIC_RECORD_PROFILE });
  if (seed.status !== "ready") throw Error(seed.diagnostics.join("; "));
  const settings = structuredClone(seed.settings);
  settings.languages = ["python"]; settings.roles.builder = "codex/gpt-6.1-sol@fresh";
  settings.guard_class = Object.fromEntries(guardClassIds(readInstalledMethodAsset(tool, "method/tasks/TASK-FORMAT.md").text).map(id => [id, ["first/checks/"]]));
  settings.suites = [{ id: "python", cwd: "first", sentinel: "pyproject.toml", argv: ["python3", "-m", "unittest", "discover", "-s", "checks", "-v"], family: "unittest", solo: false, why: "Explicit first builder outputs" }];
  privateGit(f.product, ["rm", "hello.py"]); putPrivate(f.product, ".gitignore", ".supertaskr/\n__pycache__/\n"); putPrivate(f.product, "supertaskr.yaml", JSON.stringify(settings));
  privateGit(f.product, ["add", ".gitignore", "supertaskr.yaml"]); privateGit(f.product, ["commit", "-qm", "Explicit code-empty first-view configuration"]);
  const card = (id: string, extra = "") => `---\nid: ${id}\ntitle: First view ${id}\nfeature: F-01\nmilestone: 1\npriority: 1\nsize: M\nstatus: planned\ntier: guarded\n${extra}touches: [\n  product::first/checks/test_first.py,\n  product::first/pyproject.toml\n]\n---\n\n## Acceptance criteria\n\n- WHEN built THE Python example SHALL execute its actual first test.\n`;
  putPrivate(f.records, "docs/tasks/T-900-first.md", card("T-900")); putPrivate(f.records, "docs/tasks/T-901-waiting.md", card("T-901", "blocked_by: [T-999]\n")); putPrivate(f.records, "docs/tasks/T-902-question.md", card("T-902"));
  putPrivate(f.records, "docs/tasks/T-903-history.md", card("T-903").replace("status: planned", "status: done").replace("tier: guarded\n", "builder: retired-historical-model\n"));
  putPrivate(f.records, "docs/rooms/owner.md", "# Owner\n\n## @orchestrator (fixture @session) — 2026-10-30 — QUESTION Q-001 (pending)\n\nCards held: T-902\nState: pending\n\n**QUESTION — not a ruling.** Choose the requested behavior.\n");
  privateGit(f.records, ["add", "."]); privateGit(f.records, ["commit", "-qm", "Authored first-view board and pending question"]);
  const cuts = { product: privateGit(f.product, ["rev-parse", "HEAD"]), records: privateGit(f.records, ["rev-parse", "HEAD"]) };
  return { ...f, settings, cuts, selection: { authorityRoot: f.product, projectId: "external-python", revisions: cuts, legacyTokenMap: {} } };
}

test("ordinary installed dispatch view captures code-empty P/R cuts, actual holds and METHOD without PRODUCT-board fallback or effects", async () => {
  test.setTimeout(180_000); const f = firstViewFixture(), installed = testToolRuntime();
  try {
    const observer = path.join(installed.sourceRoot, "tools/e2e/fixtures/private-access-observer.cjs"), log = path.join(f.dir, "view-access.jsonl");
    const env = { ...process.env, NODE_PATH: "", NODE_OPTIONS: `--require=${observer}`, SUPERTASKR_OBSERVE_PRIVATE_LOG: log, SUPERTASKR_OBSERVE_PRIVATE_ROOTS: JSON.stringify([f.product, ...installed.observationRoots]), SUPERTASKR_OBSERVE_PRIVATE_NAMESPACES: JSON.stringify(installed.privateNamespaces) };
    const before = (root: string) => ({ head: privateGit(root, ["rev-parse", "HEAD"]), index: readFileSync(path.join(root, ".git/index")).toString("hex"), refs: privateGit(root, ["show-ref"]), status: privateGit(root, ["status", "--porcelain=v1", "--untracked-files=all"]) });
    const p = before(f.product), r = before(f.records), run = (...args: string[]) => spawnSync(process.execPath, [path.join(installed.packageRoot, "supertaskr.mjs"), "dispatch", "--root", f.product, ...args], { cwd: f.product, encoding: "utf8", env, maxBuffer: 8 * 1024 * 1024 });
    // Calibrate that the inherited observer reports even an absent private read.
    const calibration = spawnSync(process.execPath, ["-e", "require('node:fs').readFileSync(process.argv[1])", path.join(f.product, "docs/STATE.md")], { encoding: "utf8", env });
    expect(calibration.status).not.toBe(0); expect(readFileSync(log, "utf8")).toContain("docs/STATE.md"); putPrivate(f.dir, "view-access.jsonl", "");
    expect(existsSync(path.join(f.product, "first"))).toBe(false); expect(existsSync(path.join(f.product, "docs"))).toBe(false);
    const result = run("--view"); expect(result.status, result.stdout + result.stderr).toBe(0);
    for (const cut of Object.values(f.cuts)) expect(result.stdout).toContain(cut);
    for (const text of ["CONFIGURED DISPATCH VIEW", "T-900", "AWAITING APPROVAL", "T-999(missing)", "QUESTION HELD Q-001", "codex/gpt-6.1-sol@fresh", "first/checks/test_first.py", "Tier guarded", "guard hits", "Process:", "method/roles/orchestrator.md", "METHOD TEXT", "Completed snapshot cards: 1", "You coordinate; you never touch code.", "admitted false; reserved false; started false"]) expect(result.stdout).toContain(text);
    expect(result.stdout).not.toContain("STARTABLE"); expect(unstampedLines(result.stdout)).toEqual([]);
    const events = readFileSync(log, "utf8").trim().split("\n").filter(Boolean).map(line => JSON.parse(line));
    expect(events.filter(event => event.kind !== "observer-installed" && event.path !== path.join(f.product, ".supertaskr/workspace.json"))).toEqual([]);
    expect(before(f.product)).toEqual(p); expect(before(f.records)).toEqual(r); expect(readdirSync(path.join(f.product, ".supertaskr"))).toEqual(["workspace.json"]);
    expect(existsSync(path.join(f.product, "first"))).toBe(false);
    // Actual working editor poison is not the selected committed board/config.
    putPrivate(f.product, "supertaskr.yaml", "invalid: [\n"); putPrivate(f.records, "docs/tasks/T-900-first.md", "EDITOR POISON\n");
    const full = run("--view", "--task", "T-900", "--full"); expect(full.status, full.stdout + full.stderr).toBe(0); expect(full.stdout).toContain("You coordinate; you never touch code."); expect(full.stdout).not.toContain("EDITOR POISON"); expect(full.stdout).not.toContain("T-901 —");
    // A real canonical acquired set without a run row is still a live hold.
    const module = (name: string) => pathToFileURL(path.join(installed.runtimeRoot, "tools/e2e/scripts", `${name}.mjs`)).href;
    const qualifier = await import(module("qualified-reservation")), runs = await import(module("run-record")), worker = path.join(f.dir, "first-worker");
    privateGit(f.product, ["worktree", "add", "--detach", worker, f.cuts.product]);
    const captured = qualifier.captureQualifiedInputs({ ...f.selection, taskId: "T-900" });
    await runs.acquireQualifiedReservation(f.product, { version: 1, ...f.selection, taskId: "T-900", attempt: "T-900-a1", receipt: captured.receipt, workers: [{ role: "product", checkout: worker, base: f.cuts.product }] });
    expect(runs.allRecords(f.product)).toEqual([]);
    const claimed = before(f.product), held = run("--view", "--task", "T-900"); expect(held.status, held.stdout + held.stderr).toBe(0); expect(held.stdout).toContain("Acquired qualified sets: 1"); expect(held.stdout).toContain("FENCED T-900-a1(overlapping)"); expect(before(f.product)).toEqual(claimed);
  } finally { f.cleanup(); }
});

test("captured current cuts refuse later HEAD movement while explicit original views retain their exact snapshot and invalid contexts refuse", async () => {
  test.setTimeout(180_000); const f = firstViewFixture(), installed = testToolRuntime();
  try {
    const views = await import(pathToFileURL(path.join(installed.runtimeRoot, "tools/e2e/scripts/configured-dispatch-view.mjs")).href), checker = await import(pathToFileURL(path.join(installed.runtimeRoot, "tools/e2e/scripts/records-check.mjs")).href), tool = checker.loadInstalledRecordTool();
    const captured = views.captureCurrentConfiguredDispatchViewSelection(f.product);
    expect(captured.revisions).toEqual(f.cuts); expect(Object.isFrozen(captured.revisions)).toBe(true);
    const changed = structuredClone(f.settings); changed.roles.builder = "gpt-6-luna@fresh";
    putPrivate(f.product, "supertaskr.yaml", JSON.stringify(changed)); privateGit(f.product, ["add", "supertaskr.yaml"]); privateGit(f.product, ["commit", "-qm", "A later actual product policy"]);
    await expect(views.configuredDispatchView(captured, { tool, taskId: "T-900" })).rejects.toMatchObject({ code: "configured-dispatch-view-cut-changed" });
    const original = await views.configuredDispatchView(f.selection, { tool, taskId: "T-900" }); expect(original.code).toBe(0); expect(original.text).toContain("codex/gpt-6.1-sol@fresh"); expect(original.text).not.toContain("executor: gpt-6-luna");
    changed.guard_class = {}; putPrivate(f.product, "supertaskr.yaml", JSON.stringify(changed)); privateGit(f.product, ["add", "supertaskr.yaml"]); privateGit(f.product, ["commit", "-qm", "Explicit unconfigured guard section"]);
    const absentGuards = await views.configuredDispatchView(views.captureCurrentConfiguredDispatchViewSelection(f.product), { tool, taskId: "T-900" }); expect(absentGuards.code).toBe(3); expect(absentGuards.text).toContain("project-guard_class-unconfigured"); expect(absentGuards.text).not.toContain("PREPARABLE SNAPSHOT");
    const historical = await views.configuredDispatchView(views.captureCurrentConfiguredDispatchViewSelection(f.product), { tool, taskId: "T-903" }); expect(historical.code).toBe(0); expect(historical.text).toContain("DONE — committed board history"); expect(historical.text).not.toContain("project-guard_class-unconfigured");
    changed.guard_class = { ...f.settings.guard_class, invented: ["first/"] }; putPrivate(f.product, "supertaskr.yaml", JSON.stringify(changed)); privateGit(f.product, ["add", "supertaskr.yaml"]); privateGit(f.product, ["commit", "-qm", "Unknown METHOD guard class must not disappear"]);
    const unknownGuards = await views.configuredDispatchView(views.captureCurrentConfiguredDispatchViewSelection(f.product), { tool, taskId: "T-900" }); expect(unknownGuards.code).toBe(3); expect(unknownGuards.text).toContain("project-guard-map");
    changed.guard_class = f.settings.guard_class; putPrivate(f.product, "supertaskr.yaml", JSON.stringify(changed)); privateGit(f.product, ["add", "supertaskr.yaml"]); privateGit(f.product, ["commit", "-qm", "Restore the actual METHOD guard classes"]);
    const unsafe = readFileSync(path.join(f.records, "docs/tasks/T-900-first.md"), "utf8").replace("product::first/checks/test_first.py", "product::../outside.py"); putPrivate(f.records, "docs/tasks/T-900-first.md", unsafe); privateGit(f.records, ["add", "docs/tasks/T-900-first.md"]); privateGit(f.records, ["commit", "-qm", "Unsafe explicit domain must refuse"]);
    const unsafeScope = await views.configuredDispatchView(views.captureCurrentConfiguredDispatchViewSelection(f.product), { tool, taskId: "T-900" }); expect(unsafeScope.code).toBe(3); expect(unsafeScope.text).toContain("qualified-fence"); expect(unsafeScope.text).not.toContain("PREPARABLE SNAPSHOT");
    const binding = readFileSync(path.join(f.product, ".supertaskr/workspace.json"), "utf8"); putPrivate(f.product, ".supertaskr/workspace.json", "{broken");
    expect(() => views.captureCurrentConfiguredDispatchViewSelection(f.product)).toThrow();
    putPrivate(f.product, ".supertaskr/workspace.json", binding); expect(views.captureCurrentConfiguredDispatchViewSelection(f.product).projectId).toBe("external-python");
  } finally { f.cleanup(); }
});
