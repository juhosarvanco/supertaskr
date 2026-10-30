/** Read-only full normative brief from committed P/R and verified TOOL.
 * Proposed lane selectors are data, never an admitted assignment or effect.
 * There is no virtual colocated tree or PRODUCT board fallback. */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { hostname } from "node:os";
import path from "node:path";
import { compareQualifiedFences, isComponentFilePath, parseComponentsFromFiles } from "../../../lib/parser/dist/pure.js";
import { captureConfiguredDispatch, configuredDispatchBriefContext, verifyConfiguredDispatch } from "./configured-dispatch.mjs";
import { verifyConfiguredDispatchViewSelection } from "./configured-dispatch-view.mjs";
import { captureCommittedInputs, captureTaskSnapshot } from "./records.mjs";
import { loadProjectSettings } from "./project-settings.mjs";
import { configuredAdmissionPreflight } from "./qualified-admission.mjs";
import { allRecords, readQualifiedReservations, TERMINAL_STATES } from "./run-record.mjs";
import { listInstalledMethodAssets, listInstalledRuntimeAssets, readInstalledMethodAssets, readInstalledRuntimeAssets, requireInstalledRuntimeAssets } from "./records-check.mjs";
import { conventionsTextFromSource } from "./docs-scan.mjs";
import { assembleContractRowSet, blank, ceremonyRows, citedDeclaredConventionBullets, citedOpening, contractRows, contractSourceFromFiles,
  declaredConventionHeadings, declaredStandingGates, DISPATCHER_PHRASE, docsNamed, exitStampStep, GATE_SOURCE_DIRS,
  findableNeedle, liveProv, methodReferences, namedDisciplines, note, numberedStep, PACK_TRANSCRIPTION_LIMIT, readAdditions, readSubtractions,
  render, section, sectionBullet, treeProv, value, worktreePorcelain, parseWorktreePorcelain } from "./dispatch-brief.mjs";

/** @param {string} code @param {string} message @returns {never} */
function refuse(code, message) { throw Object.assign(new Error(message), { code }); }
/** @param {any} value @param {string[]} fields */
function shape(value, fields) { return value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).sort().join("\0") === [...fields].sort().join("\0"); }
/** @param {string} text */
function flat(text) { return text.replace(/\s+/g, " ").trim(); }
/** @param {string} text */
function authored(text) { return text.replace(/<!--[\s\S]*?-->/g, "").replace(/^#+ .*$/gm, "").trim(); }
/** Same canonical opening/locator grammar as source brief citations, over
 * supplied verified bytes. No misleading PRODUCT-relative file command.
 * @param {string} label @param {string} raw @param {string} passage @param {import("./dispatch-brief.mjs").Prov} provenance */
function citation(label, raw, passage, provenance) {
  if (!flat(passage)) refuse("configured-brief-empty-citation", "Cannot cite an absent rule");
  const opening = citedOpening(flat(passage)), needle = findableNeedle(raw, opening);
  return value(`${label}: CITED, NOT TRANSCRIBED; ${Buffer.byteLength(flat(passage))} bytes flattened; opening ${JSON.stringify(opening)}; locate exact literal ${JSON.stringify(needle)} in the named selected source and read that section`, provenance);
}
/** Finite task-bound proposed destinations. Exact bases always come from the
 * constructor, never this file. No path is created or worktree removed.
 * @param {string} file */
export function readConfiguredLaneIntent(file) {
  try { return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(readFileSync(file))); }
  catch { refuse("configured-brief-lane-intent", "Lane intent must be readable UTF-8 JSON"); }
}
/** @param {any} intent @param {any} capsule @param {any} scope */
export function proposedLanes(intent, capsule, scope) {
  if (!shape(intent, ["version", "taskId", "lanes"]) || intent.version !== 1 || intent.taskId !== capsule.task.id || !Array.isArray(intent.lanes) || !intent.lanes.length) refuse("configured-brief-lane-intent", "Lane intent must name this exact task and its explicit writer destinations");
  const roles = [...new Set(scope.paths.map((/** @type {any} */ entry) => entry.role))].sort();
  if (intent.lanes.map((/** @type {any} */ row) => row?.role).sort().join("\0") !== roles.join("\0")) refuse("configured-brief-lane-intent", "Lane destinations must match the original qualified writer roles exactly");
  const roots = { product: capsule.selection.authorityRoot, records: capsule.receipt.recordsRoot };
  for (const row of intent.lanes) {
    if (!shape(row, ["role", "branch", "checkout"]) || typeof row.branch !== "string" || !row.branch.startsWith("refs/heads/") || typeof row.checkout !== "string" || !path.isAbsolute(row.checkout) || path.normalize(row.checkout) !== row.checkout || /[\\\x00-\x1f\x7f-\x9f]/.test(row.checkout)) refuse("configured-brief-lane-intent", "Lane intent requires an exact branch ref and canonical absolute destination");
    try { execFileSync("git", ["check-ref-format", row.branch], { stdio: ["ignore", "pipe", "pipe"] }); execFileSync("git", ["check-ref-format", "--branch", row.branch.slice("refs/heads/".length)], { stdio: ["ignore", "pipe", "pipe"] }); }
    catch { refuse("configured-brief-lane-intent", "Proposed lane branch is not a valid exact Git ref"); }
  }
  return intent.lanes.map((/** @type {any} */ row) => {
    const root = roots[/** @type {"product"|"records"} */ (row.role)];
    if (Object.values(roots).some(other => row.checkout === other || row.checkout.startsWith(`${other}${path.sep}`)) || intent.lanes.some((/** @type {any} */ other) => other !== row && (other.checkout === row.checkout || other.checkout.startsWith(`${row.checkout}${path.sep}`) || row.checkout.startsWith(`${other.checkout}${path.sep}`)))) refuse("configured-brief-lane-intent", "Proposed destinations overlap a selected repository or another proposed lane");
    const base = capsule.selection.revisions[row.role];
    return { role: row.role, branch: row.branch, checkout: row.checkout, base,
      createArgv: ["git", "-C", root, "worktree", "add", "-b", row.branch.slice("refs/heads/".length), row.checkout, base] };
  });
}

/** Complete readonly row assembly. An unanswered row is retained as a finding
 * and cannot be promoted into arm readiness. No configured suite or lane
 * creation command is executed here.
 * @param {any} selected @param {{tool:any,taskId:string,role?:string,laneIntent?:any}} options */
export async function configuredDispatchBrief(selected, options) {
  if (!options || Object.keys(options).some(key => !["tool", "taskId", "role", "laneIntent"].includes(key))) refuse("configured-brief-options", "Unsupported brief selector");
  const role = options.role ?? "executor";
  if (!["executor", "verifier"].includes(role)) refuse("configured-brief-role", "This full brief currently supports executor and verifier");
  const tool = options.tool;
  requireInstalledRuntimeAssets(tool, ["tools/e2e/scripts/configured-dispatch-brief.mjs", "tools/e2e/scripts/configured-dispatch-command.mjs", "tools/e2e/scripts/dispatch-brief.mjs", "tools/e2e/scripts/docs-scan.mjs"]);
  verifyConfiguredDispatchViewSelection(selected);
  const handle = captureConfiguredDispatch({ ...selected, taskId: options.taskId, tool }), capsule = handle.capsule;
  const context = configuredDispatchBriefContext(handle), selection = capsule.selection, root = selection.authorityRoot;
  const inputs = captureCommittedInputs({ productRoot: root, productRevision: selection.revisions.product, recordsRevision: selection.revisions.records });
  const snapshot = captureTaskSnapshot({ productRoot: root, productRevision: selection.revisions.product, recordsRevision: selection.revisions.records, taskId: options.taskId }, inputs);
  const loaded = loadProjectSettings({ productRoot: root, productRevision: selection.revisions.product, tool });
  if (loaded.status !== "ready") refuse(loaded.code, loaded.diagnostics.join("; "));
  const methodMembers = listInstalledMethodAssets(tool), methodPaths = methodMembers.map(row => row.path), roleRel = `method/roles/${role}.md`;
  const basePaths = [...new Set([roleRel, "method/lane-protocol.md", "method/tasks/TASK-FORMAT.md", ...methodPaths.filter(file => /^method\/roles\/[^/]+\.md$/.test(file))])];
  const methodFiles = readInstalledMethodAssets(tool, basePaths), method = new Map(methodFiles.map(row => [row.path, row.text]));
  const roleMd = /** @type {string} */ (method.get(roleRel));
  const contract = contractSourceFromFiles(role, roleMd, methodFiles.map(row => ({ path: row.path, content: row.text }))), rows = contractRows(contract.md);
  const conventions = conventionsTextFromSource(inputs.read("records", "docs/CONVENTIONS.md").content, {
    read: file => inputs.read("records", file).content, paths: () => inputs.paths("records"),
  });
  const at = new Date().toISOString(), live = liveProv(at, hostname(), "current canonical claims/admission and physical worktree inventory; no permission inferred");
  const rprov = (/** @type {string} */ via) => treeProv(selection.revisions.records, `RECORDS ${capsule.receipt.recordsRoot}; ${via}`);
  const pprov = (/** @type {string} */ via) => treeProv(selection.revisions.product, `PRODUCT ${root}; ${via}`);
  const tprov = (/** @type {string} */ via) => treeProv(selection.revisions.product, `verified TOOL ${tool.manifestDigest}; METHOD ${tool.methodDigest}; ${via}`);
  /** @type {string[]} */ const findings = [];
  const missing = (/** @type {string} */ why) => { findings.push(why); return [value(`UNANSWERED: ${why}`, live)]; };
  if (role === "verifier") findings.push("Verifier snapshot only: an actual retained verification preparation, candidate bench and seal must be selected before an executable verifier brief can be complete");
  const lanes = options.laneIntent === undefined ? [] : proposedLanes(options.laneIntent, capsule, context.scope);
  const claims = await readQualifiedReservations(root), runs = allRecords(root);
  const unknown = runs.filter(rec => rec.assignment.kind === "card" && !rec.native?.qualified && (!TERMINAL_STATES.includes(rec.state) || rec.reservation.releasedAt === null));
  const scopeRoles = [...new Set(context.scope.paths.map((/** @type {any} */ entry) => entry.role))];
  const preview = await configuredAdmissionPreflight({ version: 1, ...selection, taskId: options.taskId, roles: scopeRoles,
    admission: { boundary: "lane-cut", role, kind: "explicit", parent: "", evidence: "", scope: "product-change", attempt: null } }, handle);
  const declarations = declaredStandingGates(conventions), disciplines = namedDisciplines(conventions, [...declarations.gates.map(row => row.name), ...declarations.named]);
  /** @type {Map<string,(row:import("./dispatch-brief.mjs").ContractRow)=>import("./dispatch-brief.mjs").Rec[]>} */
  const derivers = new Map([
    ["role", () => [value(`role file: ${roleRel}; one line: ${roleMd.split(/\r?\n/).find(line => line.trim() && !line.startsWith("#")) ?? ""}`, tprov(roleRel)),
      value(`requested model ${capsule.roles[role].requested}; source ${capsule.roles[role].source}; vehicle ${capsule.roles[role].vehicle ?? capsule.sessionPolicy.default}; session policy ${JSON.stringify(capsule.sessionPolicy)}`, pprov(`roles/session_policy; original card ${capsule.task.blobId} overrides retained`))]],
    ["task", (/** @type {import("./dispatch-brief.mjs").ContractRow} */ row) => [value(`task: ${snapshot.task.id}; card: ${snapshot.task.relativePath}; blob ${snapshot.task.blobId}; title ${snapshot.task.fields.title}; size ${snapshot.task.fields.size}; status ${snapshot.task.fields.status}`, rprov("actual committed task frontmatter")),
      value(`read the card IN FULL; ${/Confirm your understanding[^.]*\./.exec(flat(roleMd))?.[0] ?? row.carries}`, tprov(`${roleRel} confirmation or actual contract row ${row.n}`))]],
    ["read-first set", () => {
      const adapters = inputs.paths("product").filter(file => !file.includes("/") && methodPaths.includes(`method/adapters/${file}`));
      if (!adapters.length) return missing("No committed PRODUCT root adapter matches a verified METHOD adapter name");
      const subtraction = readSubtractions(roleMd), addition = readAdditions(roleMd), sets = adapters.map(file => ({ file, docs: docsNamed(inputs.read("product", file).content) }));
      if (new Set(sets.map(row => row.docs.join("\0"))).size !== 1) findings.push("Committed root adapters disagree about the read-first set");
      const result = sets.map(row => value(`${row.file} names: ${row.docs.join(" ")}`, pprov(row.file)));
      result.push(value(`role SUBTRACTS ${subtraction.join(" ") || "none"}; ADDS ${addition.join(" ") || "none"}`, tprov(`${roleRel} reading step`)));
      for (const entry of sets) {
        const required = [...entry.docs.filter(file => !subtraction.includes(file)), ...addition];
        for (const file of required) {
          if (file.startsWith("docs/")) inputs.read("records", file);
          else if (methodReferences(file, roleRel, methodPaths).length !== 1) findings.push(`Read-first addition has no verified METHOD member: ${file}`);
        }
        result.push(value(`READ FIRST, role reading step APPLIED (${entry.file}): ${[...new Set(required)].join(" ")}`, rprov(`actual P adapter ${selection.revisions.product} + verified ${roleRel}; paths resolve in selected R`)));
      }
      return result;
    }],
    ["the lane", () => lanes.length ? [value(`PROPOSED ONLY — no lane created: ${JSON.stringify(lanes)}`, pprov(`backend task-bound lane intent; exact paired bases P=${selection.revisions.product}, R=${selection.revisions.records}`)),
      value(`lane rules: ${numberedStep(method.get("method/lane-protocol.md") ?? "", 1)}`, tprov("method/lane-protocol.md rule one"))] : missing("No explicit task-bound lane intent or retained qualified lane was selected; no create command invented")],
    ["the fence", () => {
      const result = [value(`touches VERBATIM: ${JSON.stringify(snapshot.task.fields.touches)}; qualified ${JSON.stringify(context.scope.paths)}; digest ${capsule.scopeDigest}`, rprov("actual card + canonical qualified expansion"))];
      for (const claim of claims) { const compared = compareQualifiedFences(context.scope, claim.scope.fence, context.scope.repositories); result.push(value(`actual acquired ${claim.reservation.attempt}: ${JSON.stringify(claim.scope.fence.paths)}; ${compared.verdict}`, live)); if (compared.verdict !== "disjoint") findings.push(`Acquired qualified fence ${claim.reservation.attempt} is ${compared.verdict}`); }
      if (unknown.length) result.push(...missing(`Unknown legacy writer claims: ${unknown.map(row => row.attempt).join(", ")}`));
      if (!claims.length) result.push(value("Canonical acquired qualified sets: none observed; no reservation acquired by this brief", live));
      return result;
    }],
    ["setup", () => {
      const build = authored(section(conventions, "## Build & test"));
      return build ? [value(`Selected setup/build ordering: ${flat(build)}`, rprov("CONVENTIONS Build & test")), value("First-card outputs may be absent planned work. No baseline command executed or GREEN claimed by this brief.", pprov("original configured commands and absent-output distinction"))] : missing("Selected RECORDS CONVENTIONS has no authored setup/build ordering");
    }],
    ["commands", () => [value(`Required original suites VERBATIM: ${JSON.stringify(capsule.gatePolicy.suites)}`, pprov(`supertaskr.yaml; policy ${capsule.gatePolicy.digest}`)),
      value(`Smoke VERBATIM: ${JSON.stringify(loaded.settings.smoke)}${loaded.settings.smoke === null ? " — unconfigured, cannot run smoke" : ""}`, pprov("supertaskr.yaml smoke"))]],
    ["gates", () => {
      const result = [value(`Every original required suite: ${capsule.gatePolicy.required.join(", ")}; whole membership mandatory when graded`, pprov("exact committed suite registry")),
        value(`${context.verification.tier === null ? `Tier PROPOSED ${context.verification.derivedTier}; original card UNSTAMPED; strict start still requires the private arm stamp` : `Tier ${context.verification.tier}`}; derived ${context.verification.derivedTier}: ${context.verification.reason}; actual guards ${JSON.stringify(context.guards)}; process ${JSON.stringify(capsule.process.values)}`, pprov(`guard_class + resolved verified METHOD schema ${capsule.process.schemaDigest}`))];
      for (const gate of [...declarations.gates, ...declarations.named.map(name => ({ name, trigger: "no merge-diff trigger declared" }))]) result.push(...missing(`Additional RECORDS gate ${gate.name}: ${gate.trigger}; configured effect adapter not established`));
      if (!declarations.gates.length && !declarations.named.length) result.push(value("Additional RECORDS standing gate declarations: none; configured PRODUCT required checks remain owed", rprov("canonical declaration parser")));
      return result;
    }],
    ["standing disciplines", () => disciplines.length ? disciplines.map(row => value(row.name, rprov("canonical named CONVENTIONS discipline opener; context pack owns cited excerpts"))) : [value("No additional named RECORDS discipline declared", rprov("canonical named-discipline enumeration"))]],
    ["prohibitions", () => [citation("Never touch the integration branch — method/lane-protocol.md rule four", method.get("method/lane-protocol.md") ?? "", numberedStep(method.get("method/lane-protocol.md") ?? "", 4), tprov("method/lane-protocol.md rule four")),
      .../** @type {const} */ (["product", "records"]).flatMap(repoRole => parseWorktreePorcelain(worktreePorcelain(repoRole === "product" ? root : capsule.receipt.recordsRoot)).map(row => value(`Actual ${repoRole.toUpperCase()} checkout, never assigned by this brief: ${row.path}; ${row.branch || "detached"}`, live))),
      ...declaredConventionHeadings(conventions).filter(heading => /\bPORT RULE\b/.test(heading)).flatMap(heading => missing(`Additional project reservation ${heading} has no configured live-port observation adapter`)),
      value("No shared process or port may be stopped by this brief. Additional project reservations remain the selected CONVENTIONS declarations; no port is guessed.", rprov("selected project declarations; no live process mutation"))]],
    ["the deliverable", () => {
      const matching = ceremonyRows(method.get("method/tasks/TASK-FORMAT.md") ?? "").filter(row => row.size === snapshot.task.fields.size || row.size.startsWith(`${snapshot.task.fields.size},`));
      if (!matching.length) return missing(`METHOD ceremony has no row for actual task size ${snapshot.task.fields.size}`);
      const exit = exitStampStep(roleMd);
      return [...matching.map(row => value(`ceremony row ${row.size}: ${row.pipeline}`, tprov("method/tasks/TASK-FORMAT.md actual ceremony table"))),
        value(`status to stamp: ${exit?.text ?? "this role marks no exit write"}`, tprov(`${roleRel} canonical exit instruction`)),
        value(`who merges/removes worktrees: ${numberedStep(method.get("method/lane-protocol.md") ?? "", 6)}`, tprov("method/lane-protocol.md rule six"))];
    }],
    ["the report", () => {
      const spec = section(roleMd, "## The report"), reports = [...spec.matchAll(/^- \*\*(.+?)\*\*/gm)].map(match => match[1]);
      if (!reports.length) return missing(`${roleRel} has no canonical bold report items`);
      const dispatchers = methodFiles.filter(row => row.path.startsWith("method/roles/") && flat(row.text).includes(DISPATCHER_PHRASE));
      if (!dispatchers.length) findings.push("No verified METHOD role names assembly to this contract");
      return [...reports.map(item => value(`report: ${item}`, tprov(`${roleRel} The report`))), ...dispatchers.map(row => value(`report also to dispatching role: ${row.path}`, tprov(`${row.path} names contract`)))];
    }],
    ["the correction clause", (/** @type {import("./dispatch-brief.mjs").ContractRow} */ row) => {
      const rules = section(contract.md, "### Rules that govern the whole brief");
      return [value(`clause: ${row.carries}`, tprov(`${contract.rel} row ${row.n}`)), value(sectionBullet(rules, "A brief is evidence, never authority"), tprov(`${contract.rel} whole-brief rules`)), value(sectionBullet(rules, "Every figure carries the ref it was measured at"), tprov(`${contract.rel} figure rule`))];
    }],
  ]);
  const safeDerivers = new Map([...derivers].map(([key, derive]) => [key, (/** @type {import("./dispatch-brief.mjs").ContractRow} */ row) => {
    try { return derive(row); }
    catch (error) { return missing(`${key}: ${error instanceof Error ? error.message : String(error)}`); }
  }]));
  const assembled = assembleContractRowSet({ rows, contract, roleRel, derivers: safeDerivers, provenance: tprov, findings }); findings.push(...assembled.orphaned);
  const recs = [note("THE CONFIGURED DISPATCH BRIEF — READ ONLY, NOT ARMED"), value(`PRODUCT ${root} at ${selection.revisions.product}; RECORDS ${capsule.receipt.recordsRoot} at ${selection.revisions.records}; capsule ${capsule.digest}`, rprov("paired original constructor selection")),
    value(`contract: ${contract.rel}; role ${roleRel}; TOOL ${tool.manifestDigest}; METHOD ${tool.methodVersion}`, tprov("normative table membership")), blank(), ...assembled.recs,
    note("THE CONTEXT PACK — cited rules only; never read full CONVENTIONS because this pack is quiet")];
  const runtimePaths = listInstalledRuntimeAssets(tool).map(row => row.path).filter(file => file.endsWith(".mjs") && GATE_SOURCE_DIRS.some(dir => file.startsWith(dir)));
  const sources = readInstalledRuntimeAssets(tool, runtimePaths).map(row => ({ rel: row.path, text: row.text }));
  const cited = citedDeclaredConventionBullets(conventions, sources);
  for (const row of cited) {
    const label = `pack bullet ${row.heading}; cited by ${row.citedBy.join(", ")}`, provenance = rprov("docs/CONVENTIONS.md actual opener; verified shipped source citations");
    recs.push(Buffer.byteLength(flat(row.raw)) <= PACK_TRANSCRIPTION_LIMIT ? value(`${label}: ${flat(row.raw)}`, provenance) : citation(label, conventions, row.raw, provenance));
  }
  recs.push(value(`Pack derivation: ${sources.length} verified TOOL rule source(s); ${declaredConventionHeadings(conventions).length} declared headings; ${cited.length} cited bullets`, tprov("same canonical opener/citation grammar")));
  for (const reference of methodReferences(roleMd, roleRel, methodPaths)) recs.push(value(`pack METHOD ${reference.rel}; named as ${reference.spelling}; sha256 ${methodMembers.find(row => row.path === reference.rel)?.sha256}`, tprov(`${roleRel} exact reference + captured METHOD membership`)));
  const componentIds = [...new Set(context.scope.paths.map((/** @type {any} */ entry) => entry.component).filter(Boolean))];
  const components = parseComponentsFromFiles(inputs.paths("records").filter(file => isComponentFilePath(file)).map(file => ({ path: file, content: inputs.read("records", file).content })));
  if (components.issues.length) refuse("configured-brief-components", "Canonical committed component registry refused");
  for (const id of componentIds) {
    const component = components.components.find(row => row.id === id);
    if (!component) refuse("configured-brief-components", "Qualified component origin has no captured registry member");
    recs.push(value(`pack component: ${component.file} — ${component.id}, ${component.name}; paths ${JSON.stringify(component.paths)}; actual touch_slugs ${JSON.stringify(component.touchSlugs)}`, rprov("canonical component parser + original qualified component origin")));
  }
  if (!componentIds.length) recs.push(value("Pack component origins: none; original qualified scope names only direct paths", rprov("original qualified fence origins")));
  recs.push(value(`Current canonical approval: permitted=${preview.permitted}, enforced=${preview.grant.enforced}, revision=${preview.grant.revision}; admitted=false; reserved=false; started=false`, live),
    value(`Process selection ${JSON.stringify(capsule.process.configuration)}; resolved ${JSON.stringify(capsule.process.values)}; schema ${capsule.process.schemaDigest}`, pprov("actual committed process + verified METHOD schema")));
  for (const finding of findings) recs.push(value(`FINDING: ${finding}`, live));
  verifyConfiguredDispatch(handle); verifyConfiguredDispatchViewSelection(selected);
  requireInstalledRuntimeAssets(tool, ["tools/e2e/scripts/configured-dispatch-brief.mjs"]);
  return Object.freeze({ text: render(recs) + "\n", code: findings.length ? 3 : 0, findings: Object.freeze([...findings]), complete: findings.length === 0, armed: false });
}
