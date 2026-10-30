import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { contractRows, declaredStandingGates, guardClassIds, standingGates, unstampedLines } from "../scripts/dispatch-brief.mjs";
import { GENERIC_RECORD_PROFILE } from "../scripts/records-validation.mjs";
import { privateGit, privateRecordFixture, putPrivate } from "./private-record-fixture";
import { testToolRuntime } from "../fixtures/tool-runtime";

async function fixture() {
  const f = privateRecordFixture(), installed = testToolRuntime();
  const module = (name: string) => pathToFileURL(path.join(installed.runtimeRoot, "tools/e2e/scripts", `${name}.mjs`)).href;
  const checks = await import(module("records-check")), settingsOwner = await import(module("project-settings")), tool = checks.loadInstalledRecordTool();
  const seed = settingsOwner.seedProjectSettings({ tool, recordsValidation: GENERIC_RECORD_PROFILE });
  if (seed.status !== "ready") throw Error(JSON.stringify(seed));
  const settings = structuredClone(seed.settings);
  settings.languages = ["python"]; settings.roles.builder = "codex/gpt-6.1-sol@fresh";
  settings.guard_class = Object.fromEntries(guardClassIds(checks.readInstalledMethodAsset(tool, "method/tasks/TASK-FORMAT.md").text).map(id => [id, ["first/checks/"]]));
  settings.suites = [{ id: "first-python", cwd: "first", sentinel: "pyproject.toml", argv: ["python3", "-m", "unittest", "discover", "-s", "checks", "-v"], family: "unittest", solo: false, why: "First planned builder outputs" }];
  privateGit(f.product, ["rm", "hello.py"]);
  putPrivate(f.product, ".gitignore", ".supertaskr/\n__pycache__/\n"); putPrivate(f.product, "supertaskr.yaml", JSON.stringify(settings));
  for (const name of ["AGENTS.md", "CLAUDE.md"]) putPrivate(f.product, name, checks.readInstalledMethodAsset(tool, `method/adapters/${name}`).text.replaceAll("<project name>", "First Python"));
  privateGit(f.product, ["add", "."]); privateGit(f.product, ["commit", "-qm", "Explicit code-empty configuration and actual adapters"]);
  putPrivate(f.records, "docs/INDEX.md", "# Authored private fixture index\n");
  const conventions = "# Conventions\n\n## Build & test\n\nNo third-party dependencies are installed. Create the first/ source and checks before running the exact configured Python argv.\n\n## Gotchas\n\n- PACK GAP: a cited fixture instruction.\n- UNRELATED PRIVATE POLICY: this uncited text must not become the whole context pack.\n";
  putPrivate(f.records, "docs/CONVENTIONS.md", conventions);
  putPrivate(f.records, "docs/tasks/T-900-first.md", "---\nid: T-900\ntitle: First Python output\nfeature: F-01\nmilestone: 1\npriority: 1\nsize: M\nstatus: planned\ntouches: [first-python-code]\n---\n\n## Acceptance criteria\n\n- WHEN built THE example SHALL run the first actual tests.\n");
  putPrivate(f.records, "docs/architecture/components/C-01-first.md", '---\nid: C-01\nname: First Python\npaths: ["product::first/checks/test_first.py", "product::first/pyproject.toml"]\ntouch_slugs: [first-python-code]\n---\n\nAuthored first component.\n');
  privateGit(f.records, ["add", "."]); privateGit(f.records, ["commit", "-qm", "Authored first card and explicit setup prose"]);
  const lane = { version: 1, taskId: "T-900", lanes: [{ role: "product", branch: "refs/heads/first-python", checkout: path.join(f.dir, "first-worker  ") }] };
  const laneFile = path.join(f.dir, "lane-intent.json"); putPrivate(f.dir, "lane-intent.json", JSON.stringify(lane));
  const env = { ...process.env, NODE_PATH: "" };
  const run = (...args: string[]) => spawnSync(process.execPath, [path.join(installed.packageRoot, "supertaskr.mjs"), "dispatch", "--root", f.product, ...args], { cwd: f.product, encoding: "utf8", env, maxBuffer: 8 * 1024 * 1024 });
  const cuts = { product: privateGit(f.product, ["rev-parse", "HEAD"]), records: privateGit(f.records, ["rev-parse", "HEAD"]) };
  return { ...f, installed, module, checks, tool, settings, conventions, lane, laneFile, cuts, run };
}

test("installed full brief derives actual thirteen METHOD rows from code-empty committed P/R and keeps executor reading scoped", async () => {
  test.setTimeout(180_000); const f = await fixture();
  try {
    const before = (root: string) => ({ head: privateGit(root, ["rev-parse", "HEAD"]), refs: privateGit(root, ["show-ref"]), index: readFileSync(path.join(root, ".git/index")).toString("hex"), status: privateGit(root, ["status", "--porcelain=v1", "--untracked-files=all"]) });
    const p = before(f.product), r = before(f.records);
    const observer = path.join(f.installed.sourceRoot, "tools/e2e/fixtures/private-access-observer.cjs"), log = path.join(f.dir, "brief-access.jsonl");
    const env = { ...process.env, NODE_PATH: "", NODE_OPTIONS: `--require=${observer}`, SUPERTASKR_OBSERVE_PRIVATE_LOG: log, SUPERTASKR_OBSERVE_PRIVATE_ROOTS: JSON.stringify([f.product, ...f.installed.observationRoots]), SUPERTASKR_OBSERVE_PRIVATE_NAMESPACES: JSON.stringify(f.installed.privateNamespaces) };
    const calibration = spawnSync(process.execPath, ["-e", "require('node:fs').readFileSync(process.argv[1])", path.join(f.product, "docs/STATE.md")], { encoding: "utf8", env });
    expect(calibration.status).not.toBe(0); expect(readFileSync(log, "utf8")).toContain("docs/STATE.md"); putPrivate(f.dir, "brief-access.jsonl", "");
    expect(existsSync(path.join(f.product, "first"))).toBe(false); expect(existsSync(path.join(f.product, "docs"))).toBe(false);
    const actual = spawnSync(process.execPath, [path.join(f.installed.packageRoot, "supertaskr.mjs"), "dispatch", "--root", f.product, "--brief", "--task", "T-900", "--lane-intent", f.laneFile], { cwd: f.product, encoding: "utf8", env, maxBuffer: 8 * 1024 * 1024 });
    expect(actual.status, actual.stdout + actual.stderr).toBe(0);
    const role = f.checks.readInstalledMethodAsset(f.tool, "method/roles/executor.md").text;
    const rows = contractRows(role); expect(rows).toHaveLength(13);
    for (const row of rows) { expect(actual.stdout).toContain(`ROW ${row.n} — ${row.label}`); expect(actual.stdout).toContain(`assembled from: ${row.source}`); }
    for (const expected of ["THE CONFIGURED DISPATCH BRIEF", ...Object.values(f.cuts), "PROPOSED ONLY", "first-worker  ", "git", "codex/gpt-6.1-sol@fresh", "READ FIRST, role reading step APPLIED", "role SUBTRACTS docs/CONVENTIONS.md docs/ROADMAP.md", "first-python", "pyproject.toml", "Create the first/", "No baseline command executed or GREEN claimed", "Tier PROPOSED guarded; original card UNSTAMPED", "guard_class", "Current canonical approval", "admitted=false; reserved=false; started=false", "A brief is evidence, never authority", "pack METHOD"]) expect(actual.stdout).toContain(expected);
    expect(actual.stdout).not.toContain("this uncited text must not become the whole context pack"); expect(actual.stdout).not.toContain("FINDING:");
    expect(actual.stdout).toContain("pack bullet PACK GAP"); expect(actual.stdout).toContain("a cited fixture instruction");
    expect(actual.stdout).toContain("pack component: docs/architecture/components/C-01-first.md — C-01, First Python"); expect(actual.stdout).toContain('actual touch_slugs ["first-python-code"]');
    const events = readFileSync(log, "utf8").trim().split("\n").filter(Boolean).map(line => JSON.parse(line));
    expect(events.filter(event => event.kind !== "observer-installed" && event.path !== path.join(f.product, ".supertaskr/workspace.json"))).toEqual([]);
    expect(unstampedLines(actual.stdout)).toEqual([]); expect(before(f.product)).toEqual(p); expect(before(f.records)).toEqual(r);
    expect(existsSync(f.lane.lanes[0]!.checkout)).toBe(false); expect(existsSync(path.join(f.product, "first"))).toBe(false);
    const dispatch = await import(f.module("configured-dispatch")), handle = dispatch.captureConfiguredDispatch({ authorityRoot: f.product, projectId: "external-python", revisions: f.cuts, taskId: "T-900", legacyTokenMap: {}, tool: f.tool });
    expect(dispatch.configuredDispatchBriefContext(handle).verification).toMatchObject({ tier: null, derivedTier: "guarded" });
    expect(() => dispatch.configuredDispatchViewContext(handle)).toThrow(/Commit the canonically classified tier/);
    expect(() => dispatch.configuredDispatchEffectContext(handle, { role: "executor", harness: "codex-desktop-native", model: "gpt-6.1-sol" })).toThrow(/Commit the canonically classified tier/);
    const firstView = f.run("--view", "--task", "T-900"); expect(firstView.status, firstView.stdout + firstView.stderr).toBe(0); expect(firstView.stdout).toContain("Tier PROPOSED guarded; original card UNSTAMPED"); expect(firstView.stdout).toContain("admitted false; reserved false; started false");
    // Working edits do not replace either selected committed policy source.
    putPrivate(f.product, "supertaskr.yaml", "BROKEN EDITOR [\n"); putPrivate(f.records, "docs/CONVENTIONS.md", "PRIVATE EDITOR POISON\n");
    const committed = f.run("--brief", "--task", "T-900", "--lane-intent", f.laneFile); expect(committed.status, committed.stderr + committed.stdout).toBe(0); expect(committed.stdout).not.toContain("EDITOR POISON");
    const unanswered = f.run("--brief", "--task", "T-900"); expect(unanswered.status).toBe(3); expect(unanswered.stdout).toContain("No explicit task-bound lane intent"); expect(unanswered.stdout.match(/^ROW /gm)).toHaveLength(13); expect(unanswered.stdout).not.toContain("ARMED true");
    const verifier = f.run("--brief", "--task", "T-900", "--role", "verifier", "--lane-intent", f.laneFile); expect(verifier.status, verifier.stderr + verifier.stdout).toBe(3); expect(verifier.stdout).toContain("role-specific:"); expect(verifier.stdout).toContain("method/roles/verifier.md"); expect(verifier.stdout).toContain("Verifier snapshot only");
    putPrivate(f.records, "docs/CONVENTIONS.md", f.conventions + "\n- PORT RULE: preserve the explicitly reserved project port.\n"); privateGit(f.records, ["add", "."]); privateGit(f.records, ["commit", "-qm", "An additional reservation cannot silently become observed"]);
    const unobserved = f.run("--brief", "--task", "T-900", "--lane-intent", f.laneFile); expect(unobserved.status, unobserved.stderr).toBe(3); expect(unobserved.stdout).toContain("PORT RULE has no configured live-port observation adapter");
  } finally { f.cleanup(); }
});

test("unknown additional gates, divergent adapters, unsafe lane destinations and missing shipped brief ownership refuse without lane effects", async () => {
  test.setTimeout(180_000); const f = await fixture();
  try {
    const brief = () => f.run("--brief", "--task", "T-900", "--lane-intent", f.laneFile);
    const held = f.conventions + "\n- CUSTOM GATE at any merge whose diff touches first/: run the additional selected private check.\n";
    putPrivate(f.records, "docs/CONVENTIONS.md", held); privateGit(f.records, ["add", "."]); privateGit(f.records, ["commit", "-qm", "Declare an actual unsupported additional gate"]);
    const unknown = brief(); expect(unknown.status, unknown.stderr).toBe(3); expect(unknown.stdout).toContain("Additional RECORDS gate CUSTOM GATE"); expect(unknown.stdout).toContain("configured effect adapter not established"); expect(unknown.stdout.match(/^ROW /gm)).toHaveLength(13);
    putPrivate(f.records, "docs/CONVENTIONS.md", f.conventions); privateGit(f.records, ["add", "."]); privateGit(f.records, ["commit", "-qm", "Restore explicit declaration set"]); expect(brief().status).toBe(0);
    putPrivate(f.product, "CLAUDE.md", "# Different adapter\nRead docs/STATE.md.\n"); privateGit(f.product, ["add", "."]); privateGit(f.product, ["commit", "-qm", "Actual adapter mismatch"]);
    const mismatch = brief(); expect(mismatch.status, mismatch.stderr).toBe(3); expect(mismatch.stdout).toContain("root adapters disagree");
    putPrivate(f.product, "CLAUDE.md", readFileSync(path.join(f.product, "AGENTS.md"))); privateGit(f.product, ["add", "."]); privateGit(f.product, ["commit", "-qm", "Restore actual adapter parity"]); expect(brief().status).toBe(0);
    const cardPath = "docs/tasks/T-900-first.md", unstamped = readFileSync(path.join(f.records, cardPath), "utf8");
    putPrivate(f.records, cardPath, unstamped.replace("touches:", "tier: bounded\ntouches:")); privateGit(f.records, ["add", cardPath]); privateGit(f.records, ["commit", "-qm", "Understated committed tier remains refused"]);
    const understated = brief(); expect(understated.status).toBe(3); expect(understated.stderr).toContain("configured-dispatch-tier-understated");
    putPrivate(f.records, cardPath, unstamped); privateGit(f.records, ["add", cardPath]); privateGit(f.records, ["commit", "-qm", "Restore genuinely unstamped first card"]); expect(brief().status).toBe(0);
    for (const bad of [f.product, path.join(f.product, "nested-worker"), path.join(f.dir, "..", "bad") + "/../not-canonical"]) {
      putPrivate(f.dir, "lane-intent.json", JSON.stringify({ ...f.lane, lanes: [{ ...f.lane.lanes[0], checkout: bad }] })); const result = brief(); expect(result.status).toBe(3); expect(result.stderr).toContain("configured-brief-lane-intent");
    }
    putPrivate(f.dir, "lane-intent.json", JSON.stringify(f.lane)); expect(brief().status).toBe(0);
    // A physically present producer omitted from the real staged manifest is unavailable.
    const manifestFile = path.join(f.installed.runtimeRoot, "tool-manifest.json"), original = readFileSync(manifestFile, "utf8"), manifest = JSON.parse(original), member = "tools/e2e/scripts/configured-dispatch-brief.mjs";
    const crypto = await import("node:crypto"); manifest.runtime.files = manifest.runtime.files.filter((row: any) => row.path !== member); manifest.runtime.buildHash = crypto.createHash("sha256").update(JSON.stringify(manifest.runtime.files)).digest("hex");
    try { putPrivate(f.installed.runtimeRoot, "tool-manifest.json", JSON.stringify(manifest)); expect(existsSync(path.join(f.installed.runtimeRoot, member))).toBe(true); const omitted = brief(); expect(omitted.status).toBe(3); expect(omitted.stderr).toContain("runtime-member-required"); }
    finally { putPrivate(f.installed.runtimeRoot, "tool-manifest.json", original); }
    expect(brief().status).toBe(0); expect(existsSync(f.lane.lanes[0]!.checkout)).toBe(false); expect(existsSync(path.join(f.product, "first"))).toBe(false);
  } finally { f.cleanup(); }
});

test("declared generic gates reuse the legacy parser while the legacy nonempty trigger guard remains strict", () => {
  const blank = "# Conventions\n\n## Gotchas\nNo additional gates declared.\n";
  expect(declaredStandingGates(blank)).toEqual({ gates: [], named: [] }); expect(() => standingGates(blank)).toThrow(/no standing gate/);
  const actual = "- FIRST GATE at any merge whose diff touches src/: run it.\n- SECOND GATE names a check without a merge-diff trigger.\n";
  expect(declaredStandingGates(actual)).toEqual(standingGates(actual));
});
