/**
 * T-139 — the WEBVIEW half of the graph-delivery measurement.
 *
 * The Rust half (`app/src-tauri/tests/graph_budget_bench.rs`) owns the
 * read and the IPC encode. This half owns the two stages that run in the
 * webview's JS engine:
 *
 *   S2b EVAL    The IPC hop as tauri 2.11.5 actually performs it, which
 *               is NOT `JSON.parse`. `EmitArgs::new` serializes the
 *               snapshot with serde_json (the Rust half's S2a), and
 *               `event::emit_js_script` then embeds that JSON VERBATIM AS
 *               JS SOURCE inside
 *                 (function () { const fn = window['…'];
 *                    fn && fn({event: '…', payload: <the JSON>}, [ids]) })()
 *               which `webview/mod.rs:1975` hands to `eval`. So the
 *               webview parses a ~1.1 MB JS OBJECT LITERAL with its
 *               general JS parser, not with the engine's JSON fast path.
 *               Each snapshot is a fresh source string, so this harness
 *               evaluates a DISTINCT script per trial — an identical one
 *               would hit the engine's source cache and report a cost
 *               nothing in production ever pays.
 *   S2b' JSON   `JSON.parse` of the same bytes. Not a stage: the CONTRAST,
 *               and the size of the repair — it is what the hop would
 *               cost if the payload crossed as a string to be parsed
 *               rather than as source to be evaluated.
 *   S3a PARSE   JSON.parse of the graph text itself. The snapshot arrives
 *               as a live object, so this is the only JSON.parse the
 *               webview really runs on the graph.
 *   S3b MODEL   parseGraph() end to end — S3a plus the validating model
 *               construction in app/src/lib/architecture/graph.ts.
 *               S3b minus S3a is the construction on its own.
 *
 * RUN IT, from the repository root:
 *
 *   node app/test/graph-budget-bench.mjs
 *
 * It measures under BOTH engines and prints them side by side:
 *   - node   (V8)          — what `npm test` and every CI step here run
 *   - jsc    (JavaScriptCore) — what a macOS WKWebView, i.e. THE APP,
 *                            actually runs. This is the number a limit
 *                            is set on; V8 is the control that says how
 *                            far the everyday tooling misleads you.
 * If `jsc` is absent (non-macOS) the V8 column stands alone and the
 * script says so rather than quietly reporting one engine as two.
 *
 * WHICH POINTS ARE REAL. Exactly one row is the live committed
 * `docs/architecture/graph.json` at the ref you run this at, marked LIVE.
 * Every other row is SYNTHETIC, resampled from it by the same rule the
 * Rust half uses — a PREFIX of the real file list below the live size,
 * the real list REPLICATED under `syntheticNN/` prefixes above it, each
 * file carrying its own out-edges whenever both endpoints survive. That
 * holds symbols-per-file and edges-per-file at the live artifact's own
 * density. The two halves synthesize independently, so the same target
 * lands within a few hundred bytes on each side; align rows on the
 * printed byte count, not on the target.
 *
 * This file is `.mjs` deliberately: `Lang::for_extension` does not walk
 * `.mjs`, so a harness that exists to measure the graph's size budget
 * does not spend it.
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = fileURLToPath(new URL(".", import.meta.url));
const REPO = resolve(HERE, "..", "..");
const GRAPH = join(REPO, "docs", "architecture", "graph.json");
const SOURCE = join(REPO, "app", "src", "lib", "architecture", "graph.ts");
const ESBUILD = join(REPO, "app", "node_modules", ".bin", "esbuild");
const JSC =
  "/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc";

/** Timed trials per cell, after one discarded warm-up. */
const TRIALS = 9;

const TARGETS = [
  100_000, 250_000, 500_000, 750_000, 1_000_000, 1_048_576, 1_500_000,
  2_000_000, 4_000_000, 8_000_000, 16_000_000,
];

/** `stable_json`'s shape: 2-space pretty, trailing newline. */
const serialize = (graph) => `${JSON.stringify(graph, null, 2)}\n`;

/** One replicable unit: a file plus the out-edges that belong to it. */
function buildPool(base, rounds) {
  const byFile = new Map();
  for (const edge of base.edges) {
    if (!edge.from.startsWith("f:")) continue;
    const list = byFile.get(edge.from) ?? [];
    list.push(edge);
    byFile.set(edge.from, list);
  }
  const reprefix = (id, prefix) => {
    const colon = id.indexOf(":");
    if (colon !== 1) return id;
    const sigil = id.slice(0, 1);
    return sigil === "f" || sigil === "s"
      ? `${sigil}:${prefix}${id.slice(2)}`
      : id;
  };
  const pool = [];
  for (let round = 0; round < rounds; round += 1) {
    const prefix = round === 0 ? "" : `synthetic${String(round).padStart(2, "0")}/`;
    for (const file of base.files) {
      const path = `${prefix}${file.path}`;
      const copy = {
        ...file,
        path,
        id: `f:${path}`,
        symbols: file.symbols.map((symbol) => ({
          ...symbol,
          id: `s:${path}#${symbol.name}`,
        })),
      };
      const edges = (byFile.get(`f:${file.path}`) ?? []).map((edge) => ({
        ...edge,
        from: reprefix(edge.from, prefix),
        to: reprefix(edge.to, prefix),
      }));
      pool.push({ file: copy, edges });
    }
  }
  return pool;
}

/** Assemble the first `count` units, dropping edges whose target left. */
function assemble(pool, count) {
  const units = pool.slice(0, Math.min(count, pool.length));
  const present = new Set(units.map((u) => u.file.path));
  const files = units.map((u) => u.file);
  const edges = [];
  for (const unit of units) {
    for (const edge of unit.edges) {
      const withoutSigil = edge.to.slice(edge.to.indexOf(":") + 1);
      const hash = withoutSigil.lastIndexOf("#");
      const target = hash === -1 ? withoutSigil : withoutSigil.slice(0, hash);
      if (present.has(target)) edges.push(edge);
    }
  }
  return {
    schema: 1,
    root: ".",
    languages: ["js", "rust", "ts"],
    files,
    packages: [],
    edges,
    unresolved: [],
    stats: {
      files: files.length,
      symbols: files.reduce((n, f) => n + f.symbols.length, 0),
      edges: edges.length,
    },
  };
}

/** The document closest to `target` bytes, by bisection on unit count. */
function synthesize(pool, target) {
  let lo = 0;
  let hi = pool.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (serialize(assemble(pool, mid)).length <= target) lo = mid;
    else hi = mid - 1;
  }
  return serialize(assemble(pool, lo));
}

/** The IPC payload `EmitArgs::new` produces: serde_json over the whole
 * DocsSnapshot, inside which the graph is an escaped JSON string. */
const envelopeOf = (graphText) =>
  JSON.stringify({
    seq: 1,
    projectDir: "/x",
    generatedAtMs: 0,
    files: [
      { path: "docs/STATE.md", content: "# State\n" },
      { path: "docs/ROADMAP.md", content: "# Roadmap\n" },
      { path: "docs/ARCHITECTURE.md", content: "# Architecture\n" },
      { path: "docs/architecture/graph.json", content: graphText },
    ],
    skipped: [],
    skippedTotal: 0,
    truncated: false,
  });

function main() {
  if (!existsSync(GRAPH)) die(`no committed graph at ${GRAPH}`);
  if (!existsSync(ESBUILD)) {
    die(
      `esbuild not found at ${ESBUILD} — run \`npm install\` from app/ first ` +
        `(this harness compiles the real parseGraph rather than a copy of it)`,
    );
  }

  const liveText = readFileSync(GRAPH, "utf8");
  const live = JSON.parse(liveText);
  const pool = buildPool(live, 20);

  const work = mkdtempSync(join(tmpdir(), "supertaskr-t139-js-"));
  try {
    // The REAL parseGraph, compiled — never a re-implementation. IIFE so
    // one file runs unchanged under both a CommonJS node and a bare jsc
    // shell, neither of which shares a module system with the other.
    const lib = join(work, "graph-lib.js");
    execFileSync(
      ESBUILD,
      [SOURCE, "--bundle", "--format=iife", "--global-name=GraphLib", "--target=es2020", `--outfile=${lib}`],
      { stdio: ["ignore", "ignore", "inherit"] },
    );

    const docs = [];
    for (const target of [...TARGETS, liveText.length].sort((a, b) => a - b)) {
      const text = target === liveText.length ? liveText : synthesize(pool, target);
      const path = join(work, `doc-${String(text.length).padStart(9, "0")}.json`);
      writeFileSync(path, text);
      docs.push({
        path,
        bytes: text.length,
        label: target === liveText.length ? "LIVE" : "synth",
        envelopeBytes: envelopeOf(text).length,
      });
      writeFileSync(`${path}.env`, envelopeOf(text));
    }

    const driver = join(work, "driver.js");
    writeFileSync(driver, `${readFileSync(lib, "utf8")}\n${DRIVER(docs, TRIALS)}`);

    const v8 = run(process.execPath, [driver], "node (V8)");
    const jsc = existsSync(JSC) ? run(JSC, [driver], "jsc (JavaScriptCore)") : null;

    report(docs, v8, jsc, liveText.length);
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

/** The driver, run verbatim by both engines. Prints one TSV row per doc. */
const DRIVER = (docs, trials) => `
var __docs = ${JSON.stringify(docs.map((d) => d.path))};
var __trials = ${trials};
/* Distinct source strings per eval trial. Fewer than the other stages
 * on purpose: each one is a full copy of the payload, and 9 copies of a
 * 15 MB script is a memory measurement rather than a parse one. */
var __evalTrials = 4;
var __say = (typeof print === "function") ? print : console.log;
var __read = (typeof readFile === "function")
  ? function (p) { return readFile(p); }
  : function (p) { return require("fs").readFileSync(p, "utf8"); };
var __now = (typeof performance === "object" && performance && typeof performance.now === "function")
  ? function () { return performance.now(); }
  : function () { return Date.now(); };
var __eval = eval; /* indirect: global scope, like the webview's own */

/* Tauri's real delivery target: event/mod.rs::event_initialization_script
 * installs one function on window and emit_js_script calls it. A stub
 * with the same shape keeps the eval doing the work the app's does —
 * materialize the object literal and hand it to a callback — without
 * pulling in the whole @tauri-apps/api. */
var __received = null;
var __sink = function (eventData) { __received = eventData; return eventData; };
if (typeof globalThis !== "undefined") { globalThis.__t139_sink = __sink; }

function __timed(run, trials) {
  run(0);
  var best = Infinity, worst = 0;
  for (var i = 0; i < trials; i += 1) {
    var t0 = __now();
    var value = run(i);
    var dt = __now() - t0;
    if (value === undefined) throw new Error("stage produced nothing");
    if (dt < best) best = dt;
    if (dt > worst) worst = dt;
  }
  return [best, worst];
}

for (var i = 0; i < __docs.length; i += 1) {
  var path = __docs[i];
  var text = __read(path);
  var envelope = __read(path + ".env");

  /* Pre-build DISTINCT scripts outside the timer. Identical sources hit
   * the engine's code cache; production never sends the same one twice. */
  var scripts = [];
  for (var s = 0; s <= __evalTrials; s += 1) {
    scripts.push(
      "/*" + s + "*/(function () { var fn = globalThis.__t139_sink; return fn && fn({event: 'docs-changed', payload: "
        + envelope + "}, [1]) })()"
    );
  }
  /* A CURSOR, not an index, and this is load-bearing. __timed's warm-up
   * repeats its first argument, so an index would evaluate script 0
   * twice — and JavaScriptCore's source cache makes the second one free,
   * which the MINIMUM then reports as the cost of the stage. Measured
   * before the fix: 0.00 ms for a 14 MB eval that V8 took 40 ms over. */
  var __evalCursor = 0;
  var evalled = __timed(function () { return __eval(scripts[__evalCursor++]); }, __evalTrials);
  if (!__received || !__received.payload || !__received.payload.files) {
    throw new Error("the eval stage did not deliver a snapshot");
  }
  var jsonEnv = __timed(function () { return JSON.parse(envelope); }, __trials);
  var parse = __timed(function () { return JSON.parse(text); }, __trials);
  var model = __timed(function () { return GraphLib.parseGraph(text); }, __trials);
  var result = GraphLib.parseGraph(text);
  scripts = null;
  __say([
    text.length,
    evalled[0].toFixed(3), evalled[1].toFixed(3),
    jsonEnv[0].toFixed(3), jsonEnv[1].toFixed(3),
    parse[0].toFixed(3), parse[1].toFixed(3),
    model[0].toFixed(3), model[1].toFixed(3),
    result.issues.length
  ].join("\\t"));
}
`;

function run(bin, args, name) {
  const out = execFileSync(bin, args, { encoding: "utf8", maxBuffer: 1 << 28 });
  const rows = new Map();
  for (const line of out.split("\n")) {
    if (!line.trim()) continue;
    const cells = line.split("\t");
    rows.set(Number(cells[0]), {
      evalled: [Number(cells[1]), Number(cells[2])],
      jsonEnv: [Number(cells[3]), Number(cells[4])],
      parse: [Number(cells[5]), Number(cells[6])],
      model: [Number(cells[7]), Number(cells[8])],
      issues: Number(cells[9]),
    });
  }
  if (rows.size === 0) die(`${name} produced no rows`);
  return { name, rows };
}

function report(docs, v8, jsc, liveBytes) {
  const pad = (value, width) => String(value).padStart(width);
  console.log("\n=== T-139 graph delivery cost, webview stages ===");
  console.log(`LIVE artifact: ${liveBytes} bytes (${GRAPH})`);
  console.log(`engines: ${v8.name}${jsc ? ` · ${jsc.name}` : "  (jsc NOT FOUND — V8 only; on macOS the app runs JavaScriptCore, so this run is the control and not the answer)"}`);
  console.log(`trials per cell: ${TRIALS} after one discarded warm-up; min milliseconds\n`);
  const engines = jsc ? [v8, jsc] : [v8];
  const cols = ["S2b eval", "S2b' json", "S3a parse", "S3b model"];
  const head = [pad("graph B", 10), pad("kind", 6), pad("envelope B", 11)];
  for (const engine of engines) {
    const tag = engine === v8 ? "V8" : "JSC";
    for (const col of cols) head.push(pad(`${tag} ${col}`, 10));
  }
  head.push(pad("webview", 9), pad("issues", 6));
  console.log(head.join(" "));
  for (const doc of docs) {
    const a = v8.rows.get(doc.bytes);
    const b = jsc?.rows.get(doc.bytes);
    if (!a) continue;
    const cells = [pad(doc.bytes, 10), pad(doc.label, 6), pad(doc.envelopeBytes, 11)];
    for (const row of [a, b].filter(Boolean)) {
      cells.push(
        pad(row.evalled[0].toFixed(2), 10),
        pad(row.jsonEnv[0].toFixed(2), 10),
        pad(row.parse[0].toFixed(2), 10),
        pad(row.model[0].toFixed(2), 10),
      );
    }
    // What the pane actually waits on in the app: the eval, then
    // parseGraph. Reported from JSC where JSC exists, because JSC is the
    // engine the app runs.
    const truth = b ?? a;
    cells.push(pad((truth.evalled[0] + truth.model[0]).toFixed(2), 9), pad(a.issues, 6));
    console.log(cells.join(" "));
  }
  console.log("\nS2b eval  = eval of tauri's real emit script — a distinct JS source per trial, object literal and all");
  console.log("S2b' json = JSON.parse of the same bytes. NOT a stage: the contrast, and the size of the repair");
  console.log("S3a parse = JSON.parse of the graph text");
  console.log("S3b model = parseGraph() end to end; S3b - S3a is the validating model construction");
  console.log("webview   = S2b eval + S3b model — everything the pane waits on inside the JS engine");
  console.log("issues    = parseGraph's own issue count. A non-zero column means the synthetic input is malformed and the timings describe the wrong thing");
  if (jsc) {
    console.log("\nJSC is the engine a macOS WKWebView runs, so JSC is the answer and V8 is the control.\n");
  } else {
    console.log("\njsc was not found: this run is V8 only, and on macOS the app runs JavaScriptCore.\n");
  }
}

function die(message) {
  console.error(`graph-budget-bench: ${message}`);
  process.exit(3);
}

main();
