/** Actual configured health reporter. The comparison and output readers remain
 * canonical; filing delegates exact primary+INDEX writes to records save. */
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { createProjectRuntime } from "./project-runtime.mjs";
import { loadInstalledRecordTool, requireInstalledRuntimeAssets } from "./records-check.mjs";
import { loadConfiguredPrivateRecordService } from "./records-save.mjs";
import { readCommittedBoard } from "./records.mjs";
import { resolveWorkspace } from "./workspace.mjs";
import { nextCardId } from "./dispatch-brief.mjs";
import { evaluate, findingCard, HEALTH_OUTPUT_READERS, renderReport } from "./health-bands.mjs";
import { configuredTreeReadings } from "./configured-tree-health.mjs";

const USAGE = `supertaskr health [--root <PRODUCT>] [--at <exact commit>] [--list] [--readings <captured output>]... [--file]\nConfigured readings markers: ${Object.keys(HEALTH_OUTPUT_READERS).join(", ")}`;
/** @param {string} code @param {string} detail @returns {never} */
function fail(code, detail) { throw Object.assign(new Error(detail), { code }); }
/** @param {string} root */
function head(root) { const result = spawnSync("git", ["-C", root, "rev-parse", "--verify", "HEAD"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }); if (result.status !== 0) fail("health-revision-unavailable", "Selected Git revision is unavailable"); return result.stdout.replace(/\n$/, ""); }
/** @param {string[]} argv @param {{out?:(text:string)=>void,err?:(text:string)=>void}} [io] */
export function main(argv, io = {}) {
  const out = io.out ?? (text => process.stdout.write(`${text}\n`)), err = io.err ?? (text => process.stderr.write(`${text}\n`));
  try {
    let root = process.cwd(), revision, list = false, file = false, rooted = false;
    /** @type {string[]} */ const inputs = [];
    for (let at = 0; at < argv.length; at++) {
      const flag = argv[at];
      if (flag === "--help" && argv.length === 1) { out(USAGE); return 0; }
      if (flag === "--list") { if (list) { err(USAGE); return 2; } list = true; continue; }
      if (flag === "--file") { if (file) { err(USAGE); return 2; } file = true; continue; }
      if (!["--root", "--at", "--readings"].includes(flag ?? "")) { err(USAGE); return 2; }
      const value = argv[++at]; if (!value || value.startsWith("--")) { err(USAGE); return 2; }
      if (flag === "--root") { if (rooted) { err(USAGE); return 2; } rooted = true; root = value; } else if (flag === "--at") { if (revision !== undefined) { err(USAGE); return 2; } revision = value; } else inputs.push(value);
    }
    if (list && (file || inputs.length)) { err(USAGE); return 2; }
    const tool = loadInstalledRecordTool();
    requireInstalledRuntimeAssets(tool, ["tools/e2e/scripts/health-bands-run.mjs", "tools/e2e/scripts/configured-health.mjs", "tools/e2e/scripts/configured-tree-health.mjs", "tools/e2e/scripts/health-bands.mjs"]);
    const productRevision = revision ?? head(root), runtime = createProjectRuntime({ productRoot: root, productRevision, tool });
    root = runtime.provenance.productRoot;
    const bands = /** @type {import("./health-bands.config.mjs").Band[]} */ (runtime.section("bands"));
    if (list) { for (const band of bands) out(JSON.stringify(band)); return 0; }
    for (const band of bands) {
      if (band.authority.kind === "readings" && !Object.hasOwn(HEALTH_OUTPUT_READERS, band.authority.marker ?? "")) fail("health-reading-unsupported", `${band.id}: unsupported output marker ${band.authority.marker}`);
    }
    const tree=bands.some(band=>band.authority.kind==="tree")?configuredTreeReadings({productRoot:root,productRevision,tool}):null;
    const texts = inputs.map(file => readFileSync(path.resolve(process.cwd(), file), "utf8"));
    /** @type {Map<string,import("./health-bands.mjs").Reading>} */ const readings = new Map(tree?.readings);
    if(tree)out(`health-bands: committed RECORDS ${tree.receipt.recordsCommit}; observed ${tree.observedAt}`);
    for (const band of bands.filter(b => b.authority.kind === "readings")) {
      const reader = /** @type {Record<string,(text:string)=>import("./health-bands.mjs").Reading|null>} */ (HEALTH_OUTPUT_READERS)[band.authority.marker ?? ""];
      if (!reader) fail("health-reading-unsupported", band.id);
      const observed = texts.map(text => reader(text)).filter(value => value !== null);
      if (observed.length > 1) fail("health-reading-ambiguous", `${band.id}: several captured inputs report this metric`);
      if (observed[0]) readings.set(band.id, observed[0]);
    }
    const results = evaluate({ bands, readings }), report = renderReport(results);
    for (const line of report.lines) out(line);
    if (!file || report.counts.breached === 0) return report.code;
    runtime.assertCurrent();
    tree?.verify();
    const workspace = resolveWorkspace({ productRoot: root, mode: "development", commit: productRevision });
    if (workspace.layout !== "split") fail("health-records-not-bound", "Filing requires explicitly bound independent RECORDS; PRODUCT docs are never a fallback");
    const recordsRevision = tree?.receipt.recordsCommit??head(workspace.recordsRoot), request = { productRoot: root, productRevision, recordsRevision };
    const board = readCommittedBoard(request), cards = new Map(board.tasks.map(task => [task.id, task]));
    /** @type {any[]} */ const overlay = [];
    for (const result of results.filter(row => row.state === "breached")) {
      if (board.tasks.some(task => task.content.split(/\r?\n/).includes(`Health band: ${result.band.id}`))) { out(`health-bands: ${result.band.id} is already on the selected board`); continue; }
      const id = nextCardId(/** @type {any} */ (cards)), card = findingCard(result, { id, ref: productRevision, when: new Date().toISOString(), configurationPath: "supertaskr.yaml bands" });
      const target = `docs/tasks/${id}-${card.slug}.md`;
      overlay.push({ operation: "add", path: target, type: "blob", mode: "100644", bytes: Buffer.from(card.body) }); cards.set(id, /** @type {any} */ ({ id }));
    }
    if (!overlay.length) return report.code;
    const service = loadConfiguredPrivateRecordService({ productRoot: root, productRevision });
    const operationId = `save-${randomUUID()}`;
    out(`health-bands: records save ${operationId}; retain this identity if the result is unavailable`);
    const saved = service.save({ ...request, operationId, expectedFiles: overlay.map(row => ({ path: row.path, present: false })), message: "File configured health findings" }, overlay);
    out(JSON.stringify(saved));
    if (saved.status !== "saved") return 3;
    return report.code;
  } catch (error) { const value = /** @type {any} */ (error); err(`health-bands: ${value.code ?? "cannot-run"}: ${error instanceof Error ? error.message : String(error)}`); return 3; }
}
