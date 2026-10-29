/** Fixed TOOL-side read-only requirement entry for optional product hooks.
 * No suite runs, token writes, private context discovery or requirement override. */
import { execFileSync } from "node:child_process";
import { isMain } from "../../../cli/is-main.mjs";
import { loadConfiguredGateConfiguration, configuredOwedForRange } from "./gate-run.mjs";
import { createRecordChecker, loadInstalledRecordTool, requireInstalledRuntimeAssets } from "./records-check.mjs";
import { resolveWorkspace, workspaceBindingPresent } from "./workspace.mjs";

/** The canonical private checker owns card/reference/placement/history rules.
 * A push asks its whole committed board, including retained validation debt;
 * ordinary-save non-regression acceptance is a different question.
 * @param {ReturnType<typeof loadConfiguredGateConfiguration>} configuration @param {any} tool */
function privateCheck(configuration, tool) {
  const { root: productRoot, productRevision } = configuration;
  if (!workspaceBindingPresent(productRoot)) throw Object.assign(new Error("Configured hooks require an explicit selected records binding"), { code: "hook-records-binding-required" });
  const workspace = resolveWorkspace({ productRoot, mode: "development", commit: productRevision });
  if (workspace.layout !== "split" || workspace.association.status !== "verified") throw Object.assign(new Error("This hook stage requires the verified split records context"), { code: "hook-records-context-unavailable" });
  const revision = () => execFileSync("git", ["--no-replace-objects", "-C", workspace.recordsRoot, "rev-parse", "--verify", "HEAD^{commit}"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, GIT_NO_LAZY_FETCH: "1", GIT_OPTIONAL_LOCKS: "0" } }).replace(/\n$/, "");
  const recordsRevision = revision(), checker = createRecordChecker({ profile: configuration.settings.records.validation, tool });
  const result = checker.evaluate(checker.capture({ productRoot, productRevision, recordsRevision }), []);
  const stale = result.retained.filter((/** @type {any} */ finding) => finding.kind === "state-stale");
  if (revision() !== recordsRevision || JSON.stringify(resolveWorkspace({ productRoot, mode: "development", commit: productRevision })) !== JSON.stringify(workspace)) throw Object.assign(new Error("The selected records context changed during the private checks"), { code: "hook-records-context-changed" });
  return { status: result.wholeBoardClean && stale.length === 0 ? 0 : 1,
    details: [...new Set([...result.diagnostics, ...result.blocking, ...result.retained.filter((/** @type {any} */ finding) => !["index-stale", "document-budget"].includes(finding.kind))].map((finding) => JSON.stringify(finding)))],
    recordsRoot: workspace.recordsRoot, recordsRevision };
}
/** @param {string[]} argv */
export function main(argv) {
  try {
    if (argv.length !== 4 && argv.length !== 6 || argv[0] !== "--root" || argv[2] !== "--at" || argv.length === 6 && argv[4] !== "--range") throw Object.assign(new Error("Expected --root <PRODUCT> --at <exact revision> [--range <base>..<tip>]"), { code: "gate-policy-usage" });
    const tool = loadInstalledRecordTool();
    requireInstalledRuntimeAssets(tool, ["cli/configured-gate-reader.mjs", "cli/is-main.mjs", "cli/gate-token.mjs", "cli/push-guard.mjs", "cli/pre-push-guard.mjs", "tools/e2e/scripts/gate-policy.mjs", "tools/e2e/scripts/product-hook.mjs", "tools/e2e/scripts/workspace.mjs"]);
    const configuration = loadConfiguredGateConfiguration({ productRoot: /** @type {string} */ (argv[1]), productRevision: /** @type {string} */ (argv[3]), tool });
    const derived = argv[5] === undefined ? undefined : configuredOwedForRange(configuration, argv[5]);
    process.stdout.write(JSON.stringify({ status: "ready", context: configuration.context, privateCheck: privateCheck(configuration, tool),
      ...(derived === undefined ? {} : "problem" in derived ? { rangeProblem: derived.problem } : { owed: { suites: derived.suites, e2e: derived.e2e, ...(derived.failClosed === undefined ? {} : { failClosed: derived.failClosed }) } }) }) + "\n");
    return 0;
  } catch (error) {
    const finding = /** @type {any} */ (error);
    process.stdout.write(JSON.stringify({ status: "refused", code: finding?.code ?? "gate-policy-unavailable", diagnostics: [error instanceof Error ? error.message : String(error)] }) + "\n");
    return 3;
  }
}
if (isMain(import.meta)) process.exitCode = main(process.argv.slice(2));
