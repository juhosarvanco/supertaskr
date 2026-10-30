/** Reusable authored configured arm project; no test registration. */
import path from "node:path";
import { pathToFileURL } from "node:url";
import { privateGit, privateRecordFixture, putPrivate } from "./private-record-fixture";
import { testToolRuntime } from "../fixtures/tool-runtime";
import { GENERIC_RECORD_PROFILE } from "../scripts/records-validation.mjs";

export async function configuredArmFixture() {
  const f = privateRecordFixture(), installed = testToolRuntime();
  const module = (name:string) => pathToFileURL(path.join(installed.runtimeRoot, "tools/e2e/scripts", `${name}.mjs`)).href;
  const checks = await import(module("records-check")), settingsOwner = await import(module("project-settings")), brief = await import(module("dispatch-brief")), arm = await import(module("configured-dispatch-arm"));
  const tool = checks.loadInstalledRecordTool(), seed = settingsOwner.seedProjectSettings({tool,recordsValidation:GENERIC_RECORD_PROFILE});
  if (seed.status !== "ready") throw Error(JSON.stringify(seed));
  const settings = structuredClone(seed.settings); settings.languages=["python"];
  settings.roles.builder="codex/gpt-6.1-sol@subagent"; settings.roles.verifier="codex/gpt-6.1-sol@fresh";
  settings.guard_class=Object.fromEntries(brief.guardClassIds(checks.readInstalledMethodAsset(tool,"method/tasks/TASK-FORMAT.md").text).map((id:string)=>[id,["checks/"]]));
  settings.suites=[{id:"python",cwd:".",sentinel:"pyproject.toml",argv:["python3","-B","-m","unittest","discover","-s","checks","-v"],solo:false,family:"unittest",why:"Actual configured example"}];
  putPrivate(f.product,".gitignore",".supertaskr/\n"); putPrivate(f.product,"supertaskr.yaml",JSON.stringify(settings));
  putPrivate(f.product,"pyproject.toml","[project]\nname='configured-arm-fixture'\nversion='0.0.0'\n");
  putPrivate(f.product,"checks/test_existing.py","import unittest\nclass Existing(unittest.TestCase):\n    def test_one(self): self.assertTrue(True)\n");
  for(const file of ["AGENTS.md","CLAUDE.md"]) putPrivate(f.product,file,checks.readInstalledMethodAsset(tool,`method/adapters/${file}`).text.replaceAll("<project name>","Arm fixture"));
  privateGit(f.product,["add","."]); privateGit(f.product,["commit","-qm","Authored configured product"]);
  const cardPath="docs/tasks/T-900-lane.md";
  putPrivate(f.records,"docs/INDEX.md","# Fixture index\n");
  putPrivate(f.records,"docs/CONVENTIONS.md","# Conventions\n\n## Build & test\n\nPython3 standard library. Run the exact configured unittest command; no dependency installation is required.\n\n## Gotchas\n\nNo additional gates declared.\n");
  putPrivate(f.records,cardPath,'---\nid: T-900\ntitle: Return a Python greeting\nfeature: F-01\nmilestone: 1\npriority: 1\nsize: M\nstatus: planned\nbuilder:\nverifier:\nreview:\ntouches: ["product::hello.py", "product::checks/test_first.py"]\n---\n\n## Acceptance criteria\n\n- WHEN called THE greeting SHALL return a string.\n');
  privateGit(f.records,["add","."]); privateGit(f.records,["commit","-qm","Actual planned task and selected conventions"]);
  const approve=()=>putPrivate(f.product,".supertaskr/dispatch-grant.yaml",brief.composeGrantSnapshot({root:f.product,revision:3,writtenBy:"authored fixture",blockText:
    `dispatch:\n  approval: each\n  recovery: repairs\n  grant:\n    given_by: authored fixture owner\n    at: "2026-10-30T00:00:00Z"\n    revision: 3\n    order: [T-900]\n    cards:\n      T-900: ${privateGit(f.records,["rev-parse",`HEAD:${cardPath}`])}\n  history: []\n`}));
  approve();
  const lane={version:1,taskId:"T-900",lanes:[{role:"product",branch:"refs/heads/T-900-greeting",checkout:path.join(f.dir,"T-900-worker  ")}]};
  const request={operationId:"arm-fixture",taskId:"T-900",native:{sessionId:"fixture-original-session",coordinatorTurnId:"fixture-original-turn"},laneIntent:lane};
  return {...f,installed,module,checks,tool,arm,settings,cardPath,approve,lane,request};
}

