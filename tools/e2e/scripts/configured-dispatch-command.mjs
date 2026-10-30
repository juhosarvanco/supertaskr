/** Strict installed dispatch front. Legacy source brief/arm remain explicit
 * compatibility APIs; this entry never chooses PRODUCT docs as RECORDS. */
import { spawnSync } from "node:child_process";
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { isMain } from "../../../cli/is-main.mjs";
import { validConfiguredDispatchCapsule } from "../../../cli/configured-native-reader.mjs";
import { captureConfiguredDispatch } from "./configured-dispatch.mjs";
import { loadInstalledRecordTool, requireInstalledRuntimeAssets } from "./records-check.mjs";
import { configuredAdmissionPreflight, readAdmissionPreflightRequest } from "./qualified-admission.mjs";
import { readAssignment, readRecord, runPlan, startConfiguredRun, VERB_DIALS } from "./run-record.mjs";

const BRIEF_ENTRY = fileURLToPath(new URL("./brief.mjs", import.meta.url));
const USAGE = ["supertaskr dispatch [--root <PRODUCT>] --run <operation> <run flags>",
  "  --run start --assignment <file> uses exact committed PRODUCT/RECORDS/TOOL",
  "  --admission-preflight <file> reads the same configured context without effects",
  ...Object.entries(VERB_DIALS).map(([verb, flags]) => `  --run ${verb} flags: ${flags.map(flag => `--${flag}`).join(" ")}`),
  "  next/brief/lane creation and named resume vehicles remain unsupported by this configured route"].join("\n");
/** @param {string} code @param {string} message @returns {never} */
function refuse(code, message) { throw Object.assign(new Error(message), { code }); }
function commandTool() {
  const tool = loadInstalledRecordTool();
  requireInstalledRuntimeAssets(tool, ["tools/e2e/scripts/configured-dispatch-command.mjs"]);
  return tool;
}
/** Same canonical lifecycle dials, strict finite tokenization. Parsing never
 * adds a program/policy path or guesses a missing selector. @param {string[]} argv */
function parse(argv) {
  const known = new Set(["root", "run", "admission-preflight", ...Object.values(VERB_DIALS).flat()]);
  /** @type {Record<string,string>} */ const options = {};
  let replace = false;
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token?.startsWith("--") || !known.has(token.slice(2))) refuse("configured-dispatch-action-unsupported", "This action is not supported by the configured dispatch entry");
    const key = token.slice(2);
    if (key === "replace") { if (replace) refuse("configured-dispatch-usage", "Duplicate --replace"); replace = true; continue; }
    if (Object.hasOwn(options, key)) refuse("configured-dispatch-usage", `Duplicate --${key}`);
    const value = argv[++i]; if (value === undefined || value.startsWith("--")) refuse("configured-dispatch-usage", `--${key} requires one value`);
    options[key] = value;
  }
  return { options, replace };
}
/** @param {string[]} argv */
export async function main(argv) {
  if (argv.length === 1 && ["--help", "-h"].includes(/** @type {string} */ (argv[0]))) { process.stdout.write(USAGE + "\n"); return 0; }
  try {
    const { options, replace } = parse(argv), root = realpathSync(options.root ?? process.cwd());
    if (options["admission-preflight"] !== undefined) {
      if (replace || Object.keys(options).some(key => !["root", "admission-preflight"].includes(key))) refuse("configured-dispatch-usage", "Preflight accepts only --root and its request file");
      const tool = commandTool(), request = readAdmissionPreflightRequest(options["admission-preflight"]);
      if (realpathSync(request.authorityRoot) !== root) refuse("configured-dispatch-root", "Preflight must name the selected PRODUCT root");
      const handle = captureConfiguredDispatch({ authorityRoot: root, projectId: request.projectId, revisions: request.revisions, taskId: request.taskId, legacyTokenMap: request.legacyTokenMap, tool });
      const preview = await configuredAdmissionPreflight(request, handle);
      process.stdout.write(JSON.stringify(preview) + "\n"); return preview.permitted ? 0 : 3;
    }
    const plan = runPlan(options, replace);
    if (plan.verb === "start") {
      commandTool();
      const assignment = readAssignment(/** @type {string} */ (plan.assignment));
      const started = await startConfiguredRun(root, { assignment }), capsule = started.record.native.qualified.origins.configuredDispatch;
      process.stdout.write(JSON.stringify({ attempt: started.record.attempt, state: started.record.state, started: false,
        requested: { spelling: capsule.roles[assignment.role].requested, model: capsule.roles[assignment.role].model, vehicle: capsule.roles[assignment.role].vehicle ?? capsule.sessionPolicy.default, sessionPolicy: capsule.sessionPolicy },
        selection: { harness: assignment.harness, model: assignment.model } }) + "\n"); return 0;
    }
    const rec = readRecord(root, plan.attempt), capsule = rec.native?.qualified?.origins?.configuredDispatch;
    const historical = plan.verb === "collect" && rec.native?.qualified?.collection?.phase === "final";
    if (!historical && !validConfiguredDispatchCapsule(capsule)) refuse("configured-dispatch-record-required", "This effect requires an original configured run; legacy source records remain explicit compatibility");
    if (!historical) commandTool();
    // Fixed existing lifecycle owner; data argv is never executable source.
    const result = spawnSync(process.execPath, [BRIEF_ENTRY, ...argv, ...(options.root === undefined ? ["--root", root] : [])], { cwd: root, stdio: "inherit" });
    return result.error || result.signal ? 3 : result.status ?? 3;
  } catch (error) {
    const code = /** @type {any} */ (error).code;
    process.stderr.write(`dispatch: ${typeof code === "string" ? code : "configured-dispatch-unavailable"}: ${error instanceof Error ? error.message : String(error)}\n`);
    return code === "configured-dispatch-usage" || typeof code === "string" && code.startsWith("RUN_") ? 2 : 3;
  }
}
if (isMain(import.meta)) process.exitCode = await main(process.argv.slice(2));
