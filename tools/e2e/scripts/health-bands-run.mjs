#!/usr/bin/env node
/**
 * THE HEALTH BANDS, RUN (T-156) — the executing half of
 * `health-bands.mjs`, which holds the derivation and stays
 * side-effect-free so a suite can import it.
 *
 *   node tools/e2e/scripts/health-bands-run.mjs
 *   node tools/e2e/scripts/health-bands-run.mjs --readings /tmp/readings.txt
 *   node tools/e2e/scripts/health-bands-run.mjs --readings /tmp/readings.txt --file
 *   node tools/e2e/scripts/health-bands-run.mjs --list
 *   node tools/e2e/scripts/health-bands-run.mjs --config ./my-bands.config.mjs
 *
 * With no `--readings`, the tree-authority bands are compared and the
 * three that read another tool's output are reported UNREAD. That is
 * not a degraded mode — it is the honest one, and it is why the run
 * exits 3 rather than printing a green summary over three metrics
 * nobody measured.
 *
 * `--file` writes each BREACH to the board as a suggestion card, which
 * is the third tier's whole action. It is OPT-IN and never default: a
 * script that writes into `docs/tasks/` unbidden is a second writer, and
 * this repository has paid for those. Filing is idempotent — a breach
 * whose `Health band:` line is already on the board files nothing.
 *
 * `--list` prints every band with its measured reason. That is the
 * TUNER's view: TRIAGE moves a limit, and this is what it reads first.
 *
 * EXIT CODES — the house contract (0 clean, 1 found, 2 called wrong,
 * 3 could not run), legended on `EXIT` in health-bands.mjs. 3 takes
 * precedence over 1: a run that could not read three of its bands is
 * not a claim about the tree, however loud the breach it did read.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";
import { parse as parseYaml } from "yaml";
import { DOC_BUDGETS, repoRoot, trackedFiles } from "./docs-scan.mjs";
import { allBands } from "./health-bands.config.mjs";
import {
  EXIT,
  evaluate,
  findingCard,
  fmt,
  nextSuggestionId,
  readingsFromOutput,
  readingsFromTree,
  renderReport,
  validateBands,
} from "./health-bands.mjs";

const FLAGS = new Set(["--readings", "--file", "--list", "--config"]);

const USAGE =
  "  usage: node tools/e2e/scripts/health-bands-run.mjs " +
  "[--readings <file>]... [--config <file>] [--file] [--list]";

/**
 * `--config` points the run at a different band set. It is NOT a test
 * seam: a project adopting this method has its own suites and its own
 * cliffs, and the alternative to a flag is a fork of the script. It is
 * also what makes acceptance criterion 3 provable end to end — a config
 * whose band has lost its measured reason has to REACH this command as
 * exit 3, and a property nothing can drive is a property nobody has.
 *
 * @param {string[]} argv
 * @returns {Promise<number>}
 */
async function main(argv) {
  /** @type {string[]} */
  const readingFiles = [];
  /** @type {string | null} */
  let configPath = null;
  let wantsFile = false;
  let wantsList = false;
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i] ?? "";
    if (!a.startsWith("-")) {
      console.error(
        `health-bands: unexpected argument ${a} — this command takes flags, never paths.\n${USAGE}`,
      );
      return EXIT.USAGE;
    }
    if (!FLAGS.has(a)) {
      console.error(`health-bands: unknown flag ${a}\n${USAGE}`);
      return EXIT.USAGE;
    }
    if (a === "--file") wantsFile = true;
    if (a === "--list") wantsList = true;
    if (a === "--readings" || a === "--config") {
      const next = argv[i + 1];
      if (next === undefined || next.startsWith("-")) {
        console.error(`health-bands: ${a} needs a file.\n${USAGE}`);
        return EXIT.USAGE;
      }
      if (a === "--readings") readingFiles.push(next);
      else configPath = next;
      i += 1;
    }
  }

  const bands =
    configPath === null
      ? allBands(DOC_BUDGETS)
      : /** @type {{ allBands: typeof allBands }} */ (
          await import(pathToFileURL(path.resolve(process.cwd(), configPath)).href)
        ).allBands(DOC_BUDGETS);

  // THE CONFIG IS GATED BEFORE THE TREE IS. A band whose measured reason
  // is missing is not a band this command will compare anything against
  // (acceptance criterion 3) — and a config it refused to load is a
  // "could not run", never a clean sheet.
  const problems = validateBands(bands);
  if (problems.length > 0) {
    console.error("health-bands: THE BANDS CONFIG WILL NOT LOAD — every band carries its measured reason:");
    for (const p of problems) console.error(`  ${p}`);
    console.error("  This run is not a claim about the tree — it is a claim about the config.");
    return EXIT.CANNOT_RUN;
  }

  if (wantsList) {
    console.log(`health-bands: ${bands.length} band(s); TRIAGE is the tuner (health-bands.config.mjs).`);
    for (const b of bands) {
      const limits =
        b.drift === null || b.breach === null
          ? "NO KEEPER"
          : `drift ${fmt(b.drift)} / breach ${fmt(b.breach)} ${b.unit}, healthy ${b.healthy}`;
      console.log(`\n  ${b.id}\n    ${b.metric}\n    ${limits}\n    authority: ${b.authority.name}`);
      console.log(`    measured at ${b.measured.at}\n    ${b.measured.reason}`);
    }
    return EXIT.CLEAN;
  }

  const readings = readingsFromTree({ root: repoRoot, parseYaml });
  for (const file of readingFiles) {
    const text = readFileSync(path.resolve(process.cwd(), file), "utf8");
    for (const [id, r] of readingsFromOutput(text)) readings.set(id, r);
  }

  const results = evaluate({ bands, readings });
  const { lines, code, counts } = renderReport(results);
  for (const line of lines) {
    if (line.startsWith("health-bands: BREACHED") || /COULD NOT BE READ|NO KEEPER/.test(line)) {
      console.error(line);
    } else {
      console.log(line);
    }
  }

  if (counts.breached > 0 && wantsFile) {
    const ref = execFileSync("git", ["rev-parse", "--short", "HEAD"], {
      cwd: repoRoot,
      encoding: "utf8",
    }).trim();
    const when = new Date().toISOString();
    const tracked = trackedFiles(repoRoot);
    const onBoard = tracked
      .filter((rel) => rel.startsWith("docs/tasks/") && rel.endsWith(".md"))
      .map((rel) => readFileSync(path.join(repoRoot, rel), "utf8"));
    console.log("");
    for (const r of results.filter((x) => x.state === "breached")) {
      if (onBoard.some((c) => c.includes(`Health band: ${r.band.id}`))) {
        console.log(`health-bands: ${r.band.id} is already on the board — filing nothing.`);
        continue;
      }
      const id = nextSuggestionId(tracked);
      const card = findingCard(r, { id, ref, when });
      const rel = `docs/tasks/${id}-${card.slug}.md`;
      writeFileSync(path.join(repoRoot, rel), card.body, "utf8");
      tracked.push(rel);
      onBoard.push(card.body);
      console.log(`health-bands: filed ${rel}`);
    }
  } else if (counts.breached > 0) {
    console.log("");
    console.log("health-bands: re-run with --file to put the breach(es) above on the board as suggestion cards.");
  }

  return code;
}

let code;
try {
  code = await main(process.argv.slice(2));
} catch (err) {
  console.error("health-bands: THE BANDS COULD NOT BE READ");
  console.error(`  ${err instanceof Error ? err.message : String(err)}`);
  console.error("  This run is not a claim about the method's health — it is a claim about this command.");
  code = EXIT.CANNOT_RUN;
}
process.exit(code);
