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
  "  --view [selection.json] [--task T-N] [--full] reads the committed selected board and installed METHOD",
  "  --brief [selection.json] --task T-N [--role executor|verifier] [--lane-intent file] assembles the full readonly normative brief",
  "  --grade --attempt T-N-aN [--suite original-id] captures actual held-worker PRODUCT suites without writing a worker token",
  "  --arm --operation ID --task T-N --session ID --turn ID --effort low|medium|high|xhigh --deadline ISO-UTC|none --budget TOKENS|none [--lane-intent file] prepares original qualified lanes, brief and native assignment",
  "  --continue --operation ID continues only that captured operation; accepted replay never launches a child",
  "  native-prepared means started:false; actual host launch separately requires canonical installed readiness and ordinary trust",
  "  --run start --assignment <file> uses exact committed PRODUCT/RECORDS/TOOL",
  "  --admission-preflight <file> reads the same configured context without effects",
  ...Object.entries(VERB_DIALS).map(([verb, flags]) => `  --run ${verb} flags: ${flags.map(flag => `--${flag}`).join(" ")}`),
  "  legacy next/brief/arm and named resume vehicles remain unsupported by this configured route"].join("\n");
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
  const known = new Set(["root", "run", "view", "brief", "grade", "suite", "task", "role", "full", "lane-intent", "arm", "continue", "operation", "session", "turn", "effort", "deadline", "budget", "admission-preflight", ...Object.values(VERB_DIALS).flat()]);
  /** @type {Record<string,string>} */ const options = {};
  let replace = false, full = false;
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token?.startsWith("--") || !known.has(token.slice(2))) refuse("configured-dispatch-action-unsupported", "This action is not supported by the configured dispatch entry");
    const key = token.slice(2);
    if (key === "replace") { if (replace) refuse("configured-dispatch-usage", "Duplicate --replace"); replace = true; continue; }
    if (key === "full") { if (full) refuse("configured-dispatch-usage", "Duplicate --full"); full = true; continue; }
    if (Object.hasOwn(options, key)) refuse("configured-dispatch-usage", `Duplicate --${key}`);
    if (["grade","arm","continue"].includes(key)) { options[key] = ""; continue; }
    if (["view", "brief"].includes(key) && (argv[i + 1] === undefined || argv[i + 1]?.startsWith("--"))) { options[key] = ""; continue; }
    const value = argv[++i]; if (value === undefined || value.startsWith("--")) refuse("configured-dispatch-usage", `--${key} requires one value`);
    options[key] = value;
  }
  return { options, replace, full };
}
/** @param {string[]} argv */
export async function main(argv) {
  if (argv.length === 1 && ["--help", "-h"].includes(/** @type {string} */ (argv[0]))) { process.stdout.write(USAGE + "\n"); return 0; }
  try {
    const { options, replace, full } = parse(argv), root = realpathSync(options.root ?? process.cwd());
    if(options.arm!==undefined||options.continue!==undefined){
      const continuing=options.continue!==undefined;
      const allowed=continuing?["root","continue","operation"]:["root","arm","operation","task","session","turn","effort","deadline","budget","lane-intent"];
      const required=continuing?["operation"]:["operation","task","session","turn","effort","deadline","budget"];
      if(replace||full||Object.keys(options).some(key=>!allowed.includes(key))||required.some(key=>options[key]===undefined)||!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(options.operation??""))refuse("configured-dispatch-usage","Arm requires its explicit original selectors and execution limits; continue accepts only the original --operation");
      const owner=await import("./configured-dispatch-operation.mjs");
      if(continuing){
        // An actual accepted fact precedes successor TOOL/config qualification.
        // This returns no current launch/readiness permission.
        const observed=await owner.observeConfiguredArmNative(root,/** @type {string} */(options.operation));
        if(observed.status==="native-prepared"){process.stdout.write(JSON.stringify(observed)+"\n");return 0;}
        const result=await owner.continueConfiguredArmOperation(root,/** @type {string} */(options.operation),{tool:commandTool()});
        process.stdout.write(JSON.stringify(result)+"\n");return result.status==="native-prepared"?0:3;
      }
      const tool=commandTool(),arm=await import("./configured-dispatch-arm.mjs"),brief=await import("./configured-dispatch-brief.mjs");
      const proposal=await arm.captureConfiguredArmPlan(root,{operationId:/** @type {string} */(options.operation),taskId:/** @type {string} */(options.task),
        native:{sessionId:/** @type {string} */(options.session),coordinatorTurnId:/** @type {string} */(options.turn)},
        execution:{effort:/** @type {string} */(options.effort),deadline:/** @type {string} */(options.deadline),budget:/** @type {string} */(options.budget)},
        ...(options["lane-intent"]===undefined?{}:{laneIntent:brief.readConfiguredLaneIntent(options["lane-intent"])})},{tool});
      await owner.beginConfiguredArmOperation(proposal,{tool});
      const result=await owner.prepareConfiguredArmNative(root,/** @type {string} */(options.operation),{tool});
      process.stdout.write(JSON.stringify(result)+"\n");return result.status==="native-prepared"?0:3;
    }
    if (options.grade !== undefined) {
      if(replace||full||options.attempt===undefined||Object.keys(options).some(key=>!["root","grade","attempt","suite"].includes(key))) refuse("configured-dispatch-usage", "Grade requires --attempt and accepts only --root and an optional original --suite");
      const tool=commandTool(),grades=await import("./configured-dispatch-grade.mjs");
      const authority=await grades.captureConfiguredDispatchGradeAuthority(root,options.attempt,{tool});
      const result=grades.runConfiguredDispatchGrade(authority,options.suite);process.stdout.write(JSON.stringify(result)+"\n");return result.code;
    }
    if(options.suite!==undefined) refuse("configured-dispatch-usage", "--suite requires --grade");
    if (options.brief !== undefined) {
      if (replace || full || options.task === undefined || Object.keys(options).some(key => !["root", "brief", "task", "role", "lane-intent"].includes(key))) refuse("configured-dispatch-usage", "Brief requires --task and accepts only --root, optional selection file, --role and --lane-intent");
      const tool = commandTool(), view = await import("./configured-dispatch-view.mjs"), brief = await import("./configured-dispatch-brief.mjs");
      const selected = options.brief === "" ? view.captureCurrentConfiguredDispatchViewSelection(root) : view.readConfiguredDispatchViewSelection(options.brief, root);
      const result = await brief.configuredDispatchBrief(selected, { tool, taskId: options.task, ...(options.role === undefined ? {} : { role: options.role }), ...(options["lane-intent"] === undefined ? {} : { laneIntent: brief.readConfiguredLaneIntent(options["lane-intent"]) }) });
      process.stdout.write(result.text); return result.code;
    }
    if (options["lane-intent"] !== undefined) refuse("configured-dispatch-usage", "--lane-intent requires --brief");
    if (options.view !== undefined) {
      if (replace || Object.keys(options).some(key => !["root", "view", "task"].includes(key))) refuse("configured-dispatch-usage", "View accepts only --root, optional selection file, --task and --full");
      const tool = commandTool(), view = await import("./configured-dispatch-view.mjs");
      const selected = options.view === "" ? view.captureCurrentConfiguredDispatchViewSelection(root) : view.readConfiguredDispatchViewSelection(options.view, root);
      const result = await view.configuredDispatchView(selected, { tool, ...(options.task === undefined ? {} : { taskId: options.task }), full });
      process.stdout.write(result.text); return result.code;
    }
    if (full || options.task !== undefined) refuse("configured-dispatch-usage", "--task and --full require --view");
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
