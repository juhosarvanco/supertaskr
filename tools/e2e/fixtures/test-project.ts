import { execFileSync } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "@playwright/test";
import { sourceOnlyCheckout } from "./source-only";
import { seedExampleProject } from "./example-project.mjs";
import { DOC_BUDGETS, conventionsText, writeDocsIndex } from "../scripts/docs-scan.mjs";
import { NO_BACKGROUND_MAINTENANCE, removeGitFixture } from "../tests/git-fixture";

const roots = new Map<string, string>();
const sandboxes = new Map<string, string>();
process.once("exit", () => {
  for (const [owner, sandbox] of sandboxes) removeGitFixture(sandbox, "ordinary project " + owner);
});
/** A separate source snapshot and authored project per spec/worker. Copied
 * canonical modules retain their real source-derived defaults. No private
 * root, test-only product override or committed-source fallback is involved. */
export function fixtureFor(owner: string): string {
  const existing = roots.get(owner);
  if (existing) return existing;
  const sandbox = mkdtempSync(path.join(tmpdir(), "supertaskr-ordinary-project-"));
  sandboxes.set(owner, sandbox);
  mkdirSync(path.join(sandbox, "product"));
  const root = sourceOnlyCheckout(path.join(sandbox, "product"));
  seedExampleProject(root, root);
  // Budget-reader behavior needs physical inputs, not the private policy
  // chapters which supplied this project's historical measurements.
  for (const rel of Object.keys(DOC_BUDGETS)) {
    const target = path.join(root, rel);
    if (existsSync(target)) continue;
    mkdirSync(path.dirname(target), { recursive: true });
    const opener = `EXAMPLE BUDGET INPUT ${path.basename(rel, ".md").toUpperCase()}`;
    writeFileSync(target, `# Example budget input\n\nAn authored size-reading fixture for ${rel}.\n\n- ${opener}\n  This is representative size-reading data.\n`);
    if (rel.startsWith("docs/conventions/")) appendFileSync(path.join(root, "docs/CONVENTIONS.md"), `  - ${rel} — ${opener}\n`);
  }
  conventionsText(root);
  writeDocsIndex(root);
  const git = (...args: string[]) => execFileSync("git", [...NO_BACKGROUND_MAINTENANCE, "-C", root, ...args], { stdio: "pipe" });
  git("config", "user.name", "ordinary fixture");
  git("config", "user.email", "fixture@example.invalid");
  git("add", "-A");
  git("commit", "-qm", "Checkpoint: representative project baseline");
  git("commit", "-q", "--allow-empty", "-m", "Checkpoint: representative source successor");
  roots.set(owner, root);
  test.afterAll(() => { roots.delete(owner); sandboxes.delete(owner); removeGitFixture(sandbox, "ordinary project " + owner); });
  return root;
}
