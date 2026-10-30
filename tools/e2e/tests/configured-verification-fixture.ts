import { spawnSync } from "node:child_process";
import {readFileSync} from "node:fs";
import { pathToFileURL } from "node:url";
import path from "node:path";
import { expect } from "@playwright/test";
import { GENERIC_RECORD_PROFILE } from "../scripts/records-validation.mjs";
import { privateGit, privateRecordFixture, putPrivate } from "./private-record-fixture";
import { testToolRuntime } from "../fixtures/tool-runtime";

/** New external-project consumer. Callback/transport frames are controlled;
 * no model, historical proof campaign or manufactured run record is used. */
export async function configuredVerificationFixture(options:{review?:"independent"}={}) {
  const f = privateRecordFixture();
  try {
  const installed = testToolRuntime();
  const module = (name: string) => pathToFileURL(path.join(installed.runtimeRoot, "tools/e2e/scripts", `${name}.mjs`)).href;
  const [settingsOwner, checks, dispatch, qualifier, runs, native, review] = await Promise.all(
    ["project-settings", "records-check", "dispatch-brief", "qualified-reservation", "run-record", "native-codex", "qualified-verification"].map(name => import(module(name))));
  await runs.loadQualifiedReservations();
  const tool = checks.loadInstalledRecordTool(), seed = settingsOwner.seedProjectSettings({ tool, recordsValidation: GENERIC_RECORD_PROFILE });
  if (seed.status !== "ready") throw Error(JSON.stringify(seed));
  const settings = structuredClone(seed.settings);
  settings.languages = ["python"]; settings.roles.builder = "codex/gpt-6.1-sol@subagent"; settings.roles.verifier = "codex/gpt-6.1-sol@fresh";
  settings.guard_class = Object.fromEntries(dispatch.guardClassIds(checks.readInstalledMethodAsset(tool, "method/tasks/TASK-FORMAT.md").text).map((id: string) => [id, ["checks/"]]));
  settings.suites = [{ id: "python", cwd: ".", sentinel: "pyproject.toml", argv: ["python3", "-B", "-m", "unittest", "discover", "-s", "checks", "-v"], family: "unittest", solo: false, why: "Actual external-project suite" }];
  putPrivate(f.product, ".gitignore", ".supertaskr/\n__pycache__/\n"); putPrivate(f.product, "supertaskr.yaml", JSON.stringify(settings));
  putPrivate(f.product, "pyproject.toml", "[project]\nname='external-review'\nversion='0.0.0'\n");
  putPrivate(f.product, "checks/test_actual.py", "import unittest, runpy\nclass Actual(unittest.TestCase):\n    def test_output(self): self.assertEqual(runpy.run_path('hello.py')['RESULT'],4)\n");
  privateGit(f.product, ["add", "."]); privateGit(f.product, ["commit", "-qm", "Explicit configured Python project"]);
  const cardPath = "docs/tasks/T-901-external.md";
  putPrivate(f.records, cardPath, "---\nid: T-901\ntitle: External configured review\nfeature: F-01\nmilestone: 1\npriority: 1\nsize: M\nstatus: building\ntier: standard\ntouches: [\"product::hello.py\", \"records::docs/rooms/note.md\"]\n---\n\n## Acceptance criteria\n\n- WHEN built THE example SHALL retain the actual configured project and tool role.\n\n## Implementation notes\n\n## Verdicts\n");
  privateGit(f.records, ["add", "."]); privateGit(f.records, ["commit", "-qm", "Original authored external task"]);
  if(options.review){
    const card = readFileSync(path.join(f.records,cardPath),"utf8");
    putPrivate(f.records,cardPath,card.replace("status: building\n",`status: building\nreview: ${options.review}\n`));
    privateGit(f.records,["add",cardPath]);privateGit(f.records,["commit","-qm","Original declared review"]);
  }
  const revisions = { product: privateGit(f.product, ["rev-parse", "HEAD"]), records: privateGit(f.records, ["rev-parse", "HEAD"]) };
  const worker = { product: path.join(f.dir, "product-worker"), records: path.join(f.dir, "records-worker") };
  for (const role of ["product", "records"] as const) privateGit(f[role], ["worktree", "add", "--detach", worker[role], revisions[role]]);
  const qualified: any = { version: 1, authorityRoot: f.product, projectId: "external-python", taskId: "T-901", revisions, legacyTokenMap: {},
    workers: ["product", "records"].map(role => ({ role, checkout: worker[role as keyof typeof worker], base: revisions[role as keyof typeof revisions] })) };
  qualified.receipt = qualifier.captureQualifiedInputs(qualified).receipt;
  putPrivate(f.product, ".supertaskr/dispatch-grant.yaml", dispatch.composeGrantSnapshot({ root: f.product, revision: 3, writtenBy: "authored owner grant", blockText:
    `dispatch:\n  approval: each\n  recovery: repairs\n  grant:\n    given_by: fixture owner\n    at: "2026-10-30T00:00:00Z"\n    revision: 3\n    order: [T-901]\n    cards:\n      T-901: ${qualified.receipt.cardBlobId}\n  history: []\n` }));
  const brief = path.join(f.dir, "executor-brief.md"); putPrivate(f.dir, "executor-brief.md", "Controlled configured native executor transport.\n");
  const assignment: any = { kind: "card", id: "T-901", role: "executor", resource: worker.product, cwd: worker.product, harness: "codex-desktop-native", model: "gpt-6.1-sol", effort: "xhigh",
    base: revisions.product, brief, deadline: "none", budget: "none", admission: { kind: "explicit", parent: "", evidence: "", scope: "implementation" },
    native: { taskName: "/root/external_configured_executor", sessionId: "external-executor", coordinatorTurnId: "external-parent", ignoredOutputs: [] }, qualified };
  const assignmentPath = path.join(f.dir, "executor.json"); putPrivate(f.dir, "executor.json", JSON.stringify(assignment));
  const start = (file: string) => spawnSync(process.execPath, [path.join(installed.packageRoot, "supertaskr.mjs"), "dispatch", "--root", f.product, "--run", "start", "--assignment", file],
    { cwd: f.dir, encoding: "utf8", env: { ...process.env, NODE_PATH: "" }, maxBuffer: 4 * 1024 * 1024 });
  const result = start(assignmentPath); expect(result.status, result.stdout + result.stderr).toBe(0);
  const attempt = JSON.parse(result.stdout).attempt;
  const event = (name: string, id: string, command: string) => ({ hook_event_name: name, agent_id: "external-observed-agent", session_id: assignment.native.sessionId,
    turn_id: "external-observed-turn", tool_name: "Bash", tool_use_id: id, tool_input: { command } });
  expect(native.handleNativeEvent(f.product, event("SubagentStart", "start", "")).disposition).toBe("start-recorded");
  expect(native.handleNativeEvent(f.product, event("PreToolUse", "probe", native.NATIVE_IDENTITY_PROBE)).disposition).toBe("identity-probe-pre");
  expect(native.handleNativeEvent(f.product, { ...event("PostToolUse", "probe", native.NATIVE_IDENTITY_PROBE), tool_response: "external-observed-agent" }).disposition).toBe("identity-probe-post");
  runs.bindRun(f.product, { attempt, harnessId: "external-observed-agent" });
  const command = `cd -- ${native.nativeShellQuote(worker.product)} && true`;
  expect(native.handleNativeEvent(f.product, event("PreToolUse", "build", command)).disposition).toBe("pre-admitted");
  putPrivate(worker.product, "hello.py", "RESULT = 4\n"); putPrivate(worker.records, "docs/rooms/note.md", "# External note\n\nActual candidate private text.\n");
  for (const role of ["product", "records"] as const) { privateGit(worker[role], ["add", "."]); privateGit(worker[role], ["commit", "-qm", "Actual scoped executor output"]); }
  expect(native.handleNativeEvent(f.product, event("PostToolUse", "build", command)).disposition).toBe("post-clean");
  expect(runs.observeRun(f.product, { attempt, evidence: "Controlled actual transport completion.\nRUN-DONE ok" }).record.state).toBe("finished");
  const candidates = Object.fromEntries(["product", "records"].map(role => [role, privateGit(worker[role as keyof typeof worker], ["rev-parse", "HEAD"])]));
  expect(runs.collectRun(f.product, { attempt, ref: JSON.stringify(candidates), report: "actual ordinary fixture output" }).record.native.qualified.collection.phase).toBe("final");
  const bench = { product: path.join(f.dir, "product-bench"), records: path.join(f.dir, "records-bench") };
  for (const role of ["product", "records"] as const) privateGit(f[role], ["worktree", "add", "--detach", bench[role], candidates[role]!]);
  const verifier = structuredClone(assignment);
  Object.assign(verifier, { role: "verifier", resource: bench.product, cwd: bench.product, base: candidates.product,
    native: { ...assignment.native, profile: "detached-verifier", executorAttempt: attempt, taskName: "/root/external_configured_verifier" } });
  verifier.qualified.workers = ["product", "records"].map(role => ({ role, checkout: bench[role as keyof typeof bench], base: revisions[role as keyof typeof revisions], candidate: candidates[role] }));
  verifier.qualified.verification = { executorAttempt: attempt, preparationDigest: "" };
  return { ...f, installed, module, checks, toolHandle: tool, review, runs, native, attempt, revisions, candidates, bench, verifier, start };
  } catch (error) { f.cleanup(); throw error; }
}

