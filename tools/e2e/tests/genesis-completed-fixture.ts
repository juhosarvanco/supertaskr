/** Reusable actual initialization + banks0..8. Authored human/CLI metadata
 * is fixture data; every bank witness/ref/commit is produced by the real core.
 * No tests register here and no accepted operation record is manufactured. */
import { appendFileSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { bankSchemaFixture } from "./project-bank-fixture";
import { withGenesisIdentity } from "./genesis-init-fixture";
import { privateGit, sha } from "./private-record-fixture";
import { inspectProjectInitialization } from "../scripts/genesis-init-inspect.mjs";
import { prepareGenesisBank } from "../scripts/genesis-bank-plan.mjs";
import { executeProjectBank } from "../scripts/project-bank-operation.mjs";
import { readInstalledMethodAsset } from "../scripts/records-check.mjs";
import { guardClassIds } from "../scripts/dispatch-brief.mjs";

function section(source: string, heading: string, content: string) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), pattern = new RegExp(`(## ${escaped}\\n)[\\s\\S]*?(?=\\n## |$)`);
  if (!pattern.test(source)) throw Error(`Authored fixture lacks section ${heading}`);
  return source.replace(pattern, `$1${content}\n`);
}
export function completedGenesisFixture(onBank: (stage: number, receipt: any) => void = () => {}) {
  const f = bankSchemaFixture(true), receipts: any[] = [], cardPath = "docs/tasks/T-001-first-python.md";
  try {
    const registryPath = f.request.input.registryCapture.path, transcriptPath = f.request.input.transcriptCapture.path;
    const registry = JSON.parse(readFileSync(registryPath, "utf8")); registry.sessions[0].native_session_id = "11111111-2222-4333-8444-555555555555";
    writeFileSync(registryPath, JSON.stringify(registry));
    const save = (file: string, bytes: string) => { mkdirSync(path.dirname(path.join(f.records, file)), { recursive: true }); writeFileSync(path.join(f.records, file), bytes); return { path: file, sha256: sha(bytes) }; };
    const source = (file: string) => readFileSync(path.join(f.records, file), "utf8");
    const prepare = (operationId: string) => {
      const current = inspectProjectInitialization({ productRoot: f.product, tool: f.toolHandle }).current;
      return withGenesisIdentity(() => prepareGenesisBank({ productRoot: f.product, operationId, sessionId: f.request.session.sessionId,
        originDigest: f.request.session.originDigest, expectedProductRevision: current.productRevision, expectedRecordsRevision: current.recordsRevision, tool: f.toolHandle })).request;
    };
    const accept = (stage: number) => {
      const request = prepare(`completed-fixture-bank-${stage}`), receipt = executeProjectBank(f.product, request, { tool: f.toolHandle, authorize() { return true; } });
      if (receipt.status !== "banked" || receipt.stage !== stage || receipt.completedStage !== stage) throw Error(`Actual bank ${stage} did not complete: ${JSON.stringify(receipt)}`);
      receipts.push(receipt); onBank(stage, receipt); return receipt;
    };
    accept(0);
    const choices = ["", "A Python greeting tool for one person running it locally each morning.", "A command returns the chosen greeting and two unittest bodies pass.",
      "No GUI, remote service, database or third-party runtime dependency.", "Python3 standard library, local files and explicit unit tests only.",
      "Choose Python3 unittest with bytecode writes disabled and explicit future source/test paths.", "The risk is importing a first module correctly; test its greeting through unittest.",
      "One milestone: expose one greeting and its two actual tests.", "Confirm the first isolated Python source, project sentinel and test card."];
    for (let stage = 1; stage <= 8; stage++) {
      const inspected = inspectProjectInitialization({ productRoot: f.product, tool: f.toolHandle }), current = inspected.current, turn = stage + 1, message = choices[stage]!;
      const context = { setupId: f.receipt.operationId, sessionId: f.request.session.sessionId, originDigest: f.request.session.originDigest,
        expectedProductRevision: current.productRevision, expectedRecordsRevision: current.recordsRevision };
      const row = JSON.parse(readFileSync(registryPath, "utf8")); row.sessions[0].turns = turn; writeFileSync(registryPath, JSON.stringify(row));
      appendFileSync(transcriptPath, JSON.stringify({ turn, role: "user", text: message, atMs: 1793318400000 + stage,
        genesis: { sessionId: context.sessionId, originDigest: context.originDigest } }) + "\n");
      const records = [save("docs/STATE.md", `# State\n\nUpdated: 2026-10-30\n\n## In progress\n${stage === 8 ? "Interview complete; first card awaits dispatch." : `Next bank: ${stage + 1}.`}\n`)];
      if ([1, 2, 3, 4, 6].includes(stage)) {
        let north = source("docs/NORTH_STAR.md");
        if (stage === 1) north = section(section(north, "Vision", message), "Users", "One person running a local Python greeting tool each morning.");
        else north = section(north, ({ 2: "Success criteria", 3: "Non-goals", 4: "Hard constraints", 6: "Riskiest assumption" } as Record<number, string>)[stage]!, message);
        records.push(save("docs/NORTH_STAR.md", north));
      } else if (stage === 5) {
        const conventions = section(source("docs/CONVENTIONS.md"), "Build & test", "Use Python3 standard library. The first builder creates src/first.py, checks/test_first.py and pyproject.toml. Then run exactly `python3 -B -m unittest discover -s checks -v`; no dependency installation is needed.");
        records.push(save("docs/CONVENTIONS.md", conventions), save("docs/decisions/001-stack.md", "# ADR-001: Python standard library\n\nDate: 2026-10-30\nStatus: accepted\nDecided in: /plan interview\n\n## Context\nOne local greeting needs no server or dependency installation.\n\n## Decision\nUse Python3 and unittest with bytecode writes disabled.\n"));
      } else if (stage === 7) {
        const roadmap = section(section(source("docs/ROADMAP.md"), "Backbone", "- F-01: Greeting — return one chosen greeting locally."), "Milestones", "### Milestone 1 — First greeting (current)\nGoal: one greeting and two tests.\n");
        records.push(save("docs/ROADMAP.md", roadmap));
      } else if (stage === 8) {
        records.push(save("docs/ROADMAP.md", section(source("docs/ROADMAP.md"), "Parked", "No later features are committed.")));
        records.push(save("docs/ARCHITECTURE.md", "# Architecture\n\n## System map\n\n```mermaid\ngraph TD\n  Greeting\n```\n\n## Components\n\n| ID | Component | Responsibility | Depends on | Status |\n|----|-----------|----------------|------------|--------|\n| C-01 | greeting | return one greeting | — | planned |\n\n## Interfaces\n\n`greeting(name)` returns a string and performs no I/O.\n\n## Related decisions\n\ndecisions/001-stack.md\n"));
        const template = readInstalledMethodAsset(f.toolHandle, "method/tasks/T-000-template.md").text;
        const card = template.replace("id: T-000", "id: T-001").replace("title: <short imperative title>", "title: Return one Python greeting").replace("feature: F-0X", "feature: F-01")
          .replace("touches: []", 'touches: ["product::src/first.py", "product::checks/test_first.py", "product::pyproject.toml"]')
          .replace("- WHEN <trigger> THE system SHALL <behavior>", "- WHEN greeting receives a name THE system SHALL return the greeting with that name.")
          .replace("- IF <failure case> THEN THE system SHALL <response>", "- IF the name is empty THEN THE system SHALL return the default greeting.");
        records.push(save(cardPath, card));
      }
      const proposalId = `completed-stage-${stage}`, answerRefs = [{ turn, sha256: sha(message) }];
      save("docs/plans/genesis-bank-proposal.json", JSON.stringify({ version: 1, ...context, proposalId, stage, answerRefs, records }));
      if (stage === 1) save("docs/plans/genesis-product-proposal.json", JSON.stringify({ version: 1, ...context, proposalId, bank: "identity", answerRefs, identity: { projectName: "First Python", oneLiner: message } }));
      if (stage === 5) {
        const settings = structuredClone(inspected.settings); settings.languages = ["python"];
        settings.roles.builder = "codex/gpt-6.1-sol@subagent"; settings.roles.verifier = "codex/gpt-6.1-sol@fresh"; settings.roles.integrator = "codex/gpt-6.1-sol@fresh";
        settings.suites = [{ id: "python", cwd: ".", sentinel: "pyproject.toml", argv: ["python3", "-B", "-m", "unittest", "discover", "-s", "checks", "-v"], solo: false, family: "unittest", why: message }];
        settings.guard_class = Object.fromEntries(guardClassIds(readInstalledMethodAsset(f.toolHandle, "method/tasks/TASK-FORMAT.md").text).map(id => [id, ["checks/"]]));
        save("docs/plans/genesis-product-proposal.json", JSON.stringify({ version: 1, ...context, proposalId, bank: "configuration", answerRefs, settings }));
      }
      accept(stage);
    }
    return { ...f, receipts, cardPath, taskId: "T-001", productRevision: privateGit(f.product, ["rev-parse", "HEAD"]), recordsRevision: privateGit(f.records, ["rev-parse", "HEAD"]) };
  } catch (error) { f.cleanup(); throw error; }
}
