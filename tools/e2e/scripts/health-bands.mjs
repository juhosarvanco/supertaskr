/**
 * THE METHOD'S OWN HEALTH BANDS (T-156) — the derivation half.
 *
 * ADR-020 decision 3: F-06's premise, drift as a first-class signal,
 * applied to the method itself. Every band this watches ALREADY EXISTED
 * as a hand-applied rule — the cargo cache cliff read off a suite's own
 * duration for twenty-plus checkpoints, the graph's budget headroom that
 * nothing reports, the four governing-document budgets that are gated
 * hard and trend-blind, the triage backlog nobody counted until it was
 * 140 cards. What is new here is not a rule. It is that the readings get
 * COMPARED, every time, by something that cannot get bored.
 *
 * ── THE THREE TIERS, AND WHY NONE OF THEM ACTS ──────────────────────
 *   INSIDE   — silent. A band that speaks when nothing is wrong is a
 *              band that gets filtered.
 *   DRIFTING — prints the reading WITH ITS DERIVATION, so the next
 *              reader can re-run the measurement rather than trust it.
 *   BREACHED — emits a FINDING: the metric, the reading, the band and
 *              the derivation, in the shape of a suggestion card, which
 *              re-enters the board the way every finding already does.
 *
 * NO TIER ACTS ON ANYTHING. This is a reporter, not a gate — the same
 * disposition `arch` and `index --watch` already have. The board decides
 * what a breach is worth, and TRIAGE tunes the band that produced it
 * (health-bands.config.mjs owns that loop).
 *
 * ── THE READINGS COME FROM THE AUTHORITY'S OWN OUTPUT ───────────────
 * Nothing here re-derives a number another tool already prints. The
 * graph's headroom is PARSED out of `index --check`'s budget line; the
 * lib suite's duration out of cargo's own `finished in`; the lane's out
 * of Playwright's summary. A second implementation of a measurement is
 * two chances to disagree (T-057), and it disagrees exactly when it
 * matters — a re-derived graph size is the COMMITTED file's, while
 * `index --check` measures a FRESH index, and the two differ precisely
 * when the graph is stale.
 *
 * So a readings-authority band needs the run's captured output:
 *
 *   cargo test 2>&1 | tee /tmp/readings.txt
 *   cargo run -p supertaskr-index -- index --check --root ../.. 2>&1 | tee -a /tmp/readings.txt
 *   npm test 2>&1 | tee -a /tmp/readings.txt
 *   node scripts/health-bands-run.mjs --readings /tmp/readings.txt
 *
 * ── AND WHEN IT CANNOT BE READ, IT SAYS SO ──────────────────────────
 * Acceptance criterion 2, and the reason the exit codes are ordered the
 * way they are: a metric whose authority could not be read is UNREAD,
 * and a metric with no authority at all is UNKEPT. Neither is ever
 * reported as holding, and both cost the run EXIT 3 — "this run is not a
 * claim about the tree", the house meaning of that code. A run that
 * silently omitted three of its bands and printed "bands hold" would be
 * the exact defect this whole card is about, one layer up.
 *
 * Execution lives in `health-bands-run.mjs`, not here, so importing this
 * derivation is side-effect-free — the docs-scan / token-scan shape, for
 * the reason those files give.
 */
import { execFileSync } from "node:child_process";
import { statSync } from "node:fs";
import path from "node:path";
import { DOC_BUDGETS, frontmatterBlock, liveTaskCards, repoRoot } from "./docs-scan.mjs";
import { allBands } from "./health-bands.config.mjs";

/**
 * The house exit contract — the same four `index --check`, `boot:check`,
 * the DOCS GATE and the token lint use, so "I compared it" and "I could
 * not tell you" are never the same number.
 *   0  every band read, and every one of them inside.
 *   1  every band read, and at least one BREACHED. Findings emitted.
 *   2  called wrong.
 *   3  at least one band could not be read, or has no keeper at all —
 *      OR the config itself is unloadable. Takes precedence over 1.
 */
export const EXIT = Object.freeze({ CLEAN: 0, FOUND: 1, USAGE: 2, CANNOT_RUN: 3 });

/** @typedef {import("./health-bands.config.mjs").Band} Band */

/**
 * @typedef {object} Reading
 * @property {number} value
 * @property {string} derivation  How this number was obtained, re-runnably.
 */

/** @typedef {"inside" | "drifting" | "breached" | "unread" | "unkept"} BandState */

/** @typedef {Record<BandState, number>} BandCounts */

/**
 * @typedef {object} BandResult
 * @property {Band} band
 * @property {BandState} state
 * @property {Reading | null} reading
 * @property {string} why  Why this state, in one line.
 */

// ── THE CONFIG'S OWN GATE ────────────────────────────────────────────

/**
 * ACCEPTANCE CRITERION 3 AS A PROPERTY RATHER THAN A HABIT: a band
 * whose `measured` reason is missing or empty CANNOT BE LOADED. The
 * `max_graph_bytes` pattern is that a number states what measured it;
 * the pattern only holds if changing the number without the measurement
 * is impossible rather than merely discouraged.
 *
 * Also checks the band's own arithmetic, because a drift line on the
 * wrong side of its breach line is a band that can never say DRIFTING
 * and would otherwise be silent about being broken.
 *
 * @param {Band[]} bands
 * @returns {string[]} problems, empty when the config is loadable
 */
export function validateBands(bands) {
  /** @type {string[]} */
  const problems = [];
  /** @type {Set<string>} */
  const seen = new Set();
  for (const b of bands) {
    const at = b.measured?.at?.trim() ?? "";
    const reason = b.measured?.reason?.trim() ?? "";
    if (seen.has(b.id)) problems.push(`${b.id}: declared twice`);
    seen.add(b.id);
    if (at === "") {
      problems.push(
        `${b.id}: measured.at is empty — a band states the ref or the run it was measured at ` +
          "(the max_graph_bytes pattern), or it is not a band.",
      );
    }
    if (reason === "") {
      problems.push(
        `${b.id}: measured.reason is empty — a threshold with no measured reason is a digit ` +
          "somebody will later have to reverse-engineer. Say what measured it.",
      );
    }
    const unkept = b.authority.kind === "none";
    if (unkept && (b.drift !== null || b.breach !== null)) {
      problems.push(`${b.id}: authority.kind is "none" but thresholds are set — an unkept band has no limits.`);
    }
    if (!unkept && (b.drift === null || b.breach === null)) {
      problems.push(`${b.id}: has an authority but no thresholds — set them, or declare it unkept.`);
    }
    if (unkept && (b.authority.keeper ?? "").trim() === "") {
      problems.push(`${b.id}: unkept with no keeper named — say what would give this metric one.`);
    }
    if (b.drift !== null && b.breach !== null) {
      const ordered = b.healthy === "above" ? b.drift > b.breach : b.drift < b.breach;
      if (!ordered) {
        problems.push(
          `${b.id}: drift ${b.drift} and breach ${b.breach} are ordered wrong for healthy:${b.healthy} — ` +
            "this band can never report DRIFTING.",
        );
      }
    }
  }
  return problems;
}

// ── THE READINGS, PARSED OUT OF THE AUTHORITIES' OWN OUTPUT ──────────

/**
 * `index --check`'s budget line, verbatim from check.rs's `budget_line`:
 *
 *   [supertaskr-index]   budget:      1020023 of 1040000 bytes (98.1%) - 19977 left
 *   [supertaskr-index]   budget:      1200000 of 1040000 bytes (115.4%) - OVER by 160000: ...
 *
 * OVER is not an error there and must not read like one here: the
 * emitter still emits, degraded. It is simply a negative headroom, which
 * is what a breach means.
 *
 * @param {string} text
 * @returns {Reading | null}
 */
export function parseGraphHeadroom(text) {
  const re = /budget:\s+(\d+) of (\d+) bytes \(([\d.]+)%\)\s+-\s+(?:(\d+) left|OVER by (\d+))/;
  const m = re.exec(text);
  if (m === null) return null;
  const used = Number(m[1]);
  const budget = Number(m[2]);
  const left = m[4] !== undefined ? Number(m[4]) : -Number(m[5]);
  return {
    value: left,
    derivation:
      `index --check's own budget line: ${used} of ${budget} bytes (${m[3]}%), ` +
      `${left < 0 ? `OVER by ${-left}` : `${left} left`}`,
  };
}

/**
 * Cargo's own timing for the LIB test binary specifically — the one the
 * cache cliff is a property of. The binary is identified by the
 * `Running unittests src/lib.rs` line that precedes its result, never by
 * position: a workspace runs several binaries and the biggest one is not
 * always the lib.
 *
 *   Running unittests src/lib.rs (target/debug/deps/supertaskr-9a1b2c3)
 *   test result: ok. 412 passed; 0 failed; ... finished in 8.91s
 *
 * @param {string} text
 * @returns {Reading | null}
 */
export function parseLibSuiteSeconds(text) {
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] ?? "";
    if (!/Running unittests src\/lib\.rs/.test(line)) continue;
    for (let j = i + 1; j < lines.length && j < i + 400; j += 1) {
      const result = /test result:.*finished in ([\d.]+)s/.exec(lines[j] ?? "");
      if (result === null) continue;
      return {
        value: Number(result[1]),
        derivation:
          `cargo's own summary for the \`Running unittests src/lib.rs\` binary ` +
          `(line ${i + 1}): ${(result[0] ?? "").trim()}`,
      };
    }
  }
  return null;
}

/**
 * Playwright's list-reporter summary. Its unit is not fixed — short runs
 * print seconds, long ones minutes — so the suffix is READ rather than
 * assumed. Reading `(2.6m)` as 2.6 seconds would put a two-and-a-half
 * minute run comfortably inside a band measured in minutes, which is the
 * silent-green failure this whole card is against.
 *
 *   259 passed (2.6m)
 *   12 passed (45.3s)
 *
 * @param {string} text
 * @returns {Reading | null}
 */
export function parseE2eSeconds(text) {
  const re = /(\d+) passed \(([\d.]+)(ms|s|m)\)/;
  const m = re.exec(text);
  if (m === null) return null;
  const n = Number(m[2]);
  const unit = m[3];
  const seconds = unit === "ms" ? n / 1000 : unit === "m" ? n * 60 : n;
  return {
    value: seconds,
    derivation: `Playwright's own summary: ${m[1]} passed (${m[2]}${unit}) = ${seconds.toFixed(1)}s`,
  };
}

/**
 * Every readings-authority band, keyed by band id. A band whose parser
 * finds nothing is left ABSENT rather than defaulted — absent is what
 * becomes UNREAD, and a default would become a lie.
 *
 * @param {string} text  The captured output of the runs, concatenated.
 * @returns {Map<string, Reading>}
 */
export function readingsFromOutput(text) {
  /** @type {Map<string, Reading>} */
  const out = new Map();
  const graph = parseGraphHeadroom(text);
  if (graph !== null) out.set("graph/budget-headroom-bytes", graph);
  const lib = parseLibSuiteSeconds(text);
  if (lib !== null) out.set("suite/lib-seconds", lib);
  const e2e = parseE2eSeconds(text);
  if (e2e !== null) out.set("suite/e2e-seconds", e2e);
  return out;
}

// ── THE READINGS DERIVED FROM THE TREE ───────────────────────────────

/**
 * @param {string[]} args
 * @param {string} root
 * @returns {string}
 */
function git(args, root) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
}

/** A flat suggestion card: `docs/tasks/T-<n>-s<n>-....md`, never a directory deeper.
 * @param {string} rel @returns {boolean} */
export function isSuggestionCardPath(rel) {
  return /^docs\/tasks\/T-\d+-s\d+[^/]*\.md$/.test(rel);
}

/**
 * The board's live suggestion census, read off the same flat frontmatter
 * the parser walks. `status:` is read through the injected YAML parser
 * rather than by regex, so a card this disagrees with is a card the
 * board disagrees with too.
 *
 * @param {{ root?: string, parseYaml: (s: string) => unknown }} opts
 * @returns {{ path: string, addedSec: number | null }[]}
 */
export function liveSuggestions({ root = repoRoot, parseYaml }) {
  /** @type {{ path: string, addedSec: number | null }[]} */
  const out = [];
  for (const card of liveTaskCards(root)) {
    const block = frontmatterBlock(card.content);
    if (block === null) continue;
    /** @type {unknown} */
    let fm;
    try {
      fm = parseYaml(block);
    } catch {
      continue;
    }
    if (typeof fm !== "object" || fm === null) continue;
    const status = /** @type {{ status?: unknown }} */ (fm).status;
    if (status !== "suggested") continue;
    const raw = git(["log", "--diff-filter=A", "--format=%ct", "-1", "--", card.path], root).trim();
    out.push({ path: card.path, addedSec: raw === "" ? null : Number(raw) });
  }
  return out;
}

/**
 * The newest `Checkpoint:` commit reachable from HEAD — the window this
 * project's metabolism is measured over, because a checkpoint is when
 * the board is actually looked at.
 *
 * @param {string} [root]
 * @returns {{ hash: string, subject: string, sec: number } | null}
 */
export function newestCheckpoint(root = repoRoot) {
  const raw = git(["log", "-1", "--grep=^Checkpoint:", "--format=%H%x00%ct%x00%s", "HEAD"], root).trim();
  if (raw === "") return null;
  const [hash, sec, subject] = raw.split("\0");
  if (hash === undefined || sec === undefined) return null;
  return { hash, sec: Number(sec), subject: subject ?? "" };
}

/**
 * Arrivals and dispositions of suggestion cards inside the window.
 * `--no-renames` is load-bearing: TRIAGE's rejection move is a `git mv`
 * into docs/tasks/rejected/, and with rename detection on, a
 * disposition looks like nothing happened at all.
 *
 * @param {string} sinceHash
 * @param {string} [root]
 * @returns {{ arrivals: string[], dispositions: string[] }}
 */
export function suggestionFlow(sinceHash, root = repoRoot) {
  /** @param {"A" | "D"} filter */
  const names = (filter) =>
    git(
      ["log", `--diff-filter=${filter}`, "--no-renames", "--name-only", "--format=", `${sinceHash}..HEAD`, "--", "docs/tasks/"],
      root,
    )
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s !== "" && isSuggestionCardPath(s));
  return { arrivals: [...new Set(names("A"))], dispositions: [...new Set(names("D"))] };
}

/**
 * Every tree-authority band's reading, keyed by band id.
 *
 * @param {{ root?: string, parseYaml: (s: string) => unknown, now?: number, budgets?: typeof DOC_BUDGETS }} opts
 * @returns {Map<string, Reading>}
 */
export function readingsFromTree({ root = repoRoot, parseYaml, now = Date.now(), budgets = DOC_BUDGETS }) {
  /** @type {Map<string, Reading>} */
  const out = new Map();

  // `budgets` is a seam with one purpose: the real table carries no
  // null entry, so the guard below was unfalsifiable against it — the
  // fixture that kills the guard's deletion needs a table that has one
  // (T-156's verdict, drill 6).
  for (const [rel, b] of Object.entries(budgets)) {
    if (b === null) continue;
    const size = statSync(path.join(root, rel)).size;
    const headroom = b.warn - size;
    out.set(`docs-headroom/${rel}`, {
      value: (headroom * 100) / b.warn,
      derivation:
        `wc -c ${rel} = ${size} bytes; DOC_BUDGETS warn ${b.warn} (fail ${b.fail}); ` +
        `headroom ${headroom} bytes = ${((headroom * 100) / b.warn).toFixed(2)}% of the warn line`,
    });
  }

  const suggestions = liveSuggestions({ root, parseYaml });
  out.set("triage/live-suggestions", {
    value: suggestions.length,
    derivation: `${suggestions.length} flat docs/tasks/T-*.md card(s) at status: suggested`,
  });

  const ages = suggestions
    .filter((s) => s.addedSec !== null)
    .map((s) => ({ path: s.path, days: (now / 1000 - /** @type {number} */ (s.addedSec)) / 86400 }));
  const oldest = ages.reduce(
    /** @param {{ path: string, days: number } | null} acc */
    (acc, a) => (acc === null || a.days > acc.days ? a : acc),
    /** @type {{ path: string, days: number } | null} */ (null),
  );
  out.set("triage/oldest-suggestion-days", {
    value: oldest === null ? 0 : oldest.days,
    derivation:
      oldest === null
        ? "no live suggestion on the board — the oldest age of an empty set is 0 by definition, not by absence"
        : `git log --diff-filter=A on ${oldest.path}: ${oldest.days.toFixed(1)} days old`,
  });

  const cp = newestCheckpoint(root);
  if (cp !== null) {
    const flow = suggestionFlow(cp.hash, root);
    const net = flow.arrivals.length - flow.dispositions.length;
    out.set("triage/net-arrivals-per-window", {
      value: net,
      derivation:
        `since the newest Checkpoint: commit ${cp.hash.slice(0, 7)} — ` +
        `${flow.arrivals.length} suggestion card(s) added, ${flow.dispositions.length} dispositioned, net ${net}`,
    });
  }

  return out;
}

// ── THE COMPARISON ───────────────────────────────────────────────────

/**
 * @param {Band} band
 * @param {Reading | undefined} reading
 * @returns {BandResult}
 */
export function evaluateBand(band, reading) {
  if (band.authority.kind === "none") {
    return {
      band,
      state: "unkept",
      reading: null,
      why: `no keeper: ${band.authority.name}. What would give it one: ${band.authority.keeper ?? "unstated"}`,
    };
  }
  if (reading === undefined) {
    return {
      band,
      state: "unread",
      reading: null,
      why: `${band.authority.name} was not read this run${band.authority.marker === undefined ? "" : ` (wanted ${band.authority.marker})`}`,
    };
  }
  const { drift, breach } = band;
  if (drift === null || breach === null) {
    return { band, state: "unread", reading, why: "the band has no thresholds to compare against" };
  }
  const v = reading.value;
  /** @type {"inside" | "drifting" | "breached"} */
  let state;
  if (band.healthy === "above") state = v < breach ? "breached" : v < drift ? "drifting" : "inside";
  else state = v > breach ? "breached" : v > drift ? "drifting" : "inside";
  // THE DIRECTION IS SPELLED OUT RATHER THAN LEFT TO THE READER. A
  // headroom band and a duration band both "cross" their limits, in
  // opposite directions, and a reader who has to work out which is
  // which from the numbers is a reader who will one day get it wrong
  // about the one that mattered.
  const side = band.healthy === "above" ? "fallen below" : "risen above";
  const held = band.healthy === "above" ? "at or above" : "at or below";
  return {
    band,
    state,
    reading,
    why:
      state === "inside"
        ? `${fmt(v)} ${band.unit}, ${held} the ${fmt(drift)} drift line`
        : state === "drifting"
          ? `${fmt(v)} ${band.unit} has ${side} the ${fmt(drift)} drift line, not yet the ${fmt(breach)} breach line`
          : `${fmt(v)} ${band.unit} has ${side} the ${fmt(breach)} breach line`,
  };
}

/** @param {number} n @returns {string} */
export function fmt(n) {
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

/**
 * @param {{ bands?: Band[], readings: Map<string, Reading> }} opts
 * @returns {BandResult[]}
 */
export function evaluate({ bands = allBands(DOC_BUDGETS), readings }) {
  return bands.map((b) => evaluateBand(b, readings.get(b.id)));
}

// ── THE REPORT AND THE FINDING ───────────────────────────────────────

/**
 * The tiers, rendered. INSIDE is counted and never listed: a reporter
 * that prints its silent tier has no silent tier.
 *
 * @param {BandResult[]} results
 * @returns {{ lines: string[], code: number, counts: BandCounts }}
 */
export function renderReport(results) {
  /** @type {BandCounts} */
  const counts = { inside: 0, drifting: 0, breached: 0, unread: 0, unkept: 0 };
  for (const r of results) counts[r.state] += 1;

  /** @type {string[]} */
  const lines = [];
  lines.push(
    `health-bands: ${results.length} band(s) — ${counts.inside} inside, ${counts.drifting} drifting, ` +
      `${counts.breached} BREACHED, ${counts.unread} unread, ${counts.unkept} UNKEPT`,
  );

  for (const r of results.filter((x) => x.state === "breached")) {
    lines.push("");
    lines.push(`health-bands: BREACHED — ${r.band.id}`);
    lines.push(`  metric      ${r.band.metric}`);
    lines.push(`  reading     ${fmt(r.reading?.value ?? 0)} ${r.band.unit}`);
    lines.push(`  band        drift at ${fmt(r.band.drift ?? 0)}, breach at ${fmt(r.band.breach ?? 0)} (healthy ${r.band.healthy})`);
    lines.push(`  derivation  ${r.reading?.derivation ?? "-"}`);
    lines.push(`  authority   ${r.band.authority.name}`);
    lines.push(`  band set at ${r.band.measured.at}`);
  }

  for (const r of results.filter((x) => x.state === "drifting")) {
    lines.push("");
    lines.push(`health-bands: drifting — ${r.band.id}: ${r.why}`);
    lines.push(`  derivation  ${r.reading?.derivation ?? "-"}`);
  }

  const unread = results.filter((x) => x.state === "unread");
  if (unread.length > 0) {
    lines.push("");
    lines.push(
      `health-bands: ${unread.length} band(s) COULD NOT BE READ — this run is not a claim that they hold:`,
    );
    for (const r of unread) lines.push(`  ${r.band.id}  ${r.why}`);
  }

  const unkept = results.filter((x) => x.state === "unkept");
  if (unkept.length > 0) {
    lines.push("");
    lines.push(
      `health-bands: ${unkept.length} band(s) have NO KEEPER — declared, never derived, never reported as holding:`,
    );
    for (const r of unkept) lines.push(`  ${r.band.id}  ${r.why}`);
  }

  const code =
    counts.unread + counts.unkept > 0
      ? EXIT.CANNOT_RUN
      : counts.breached > 0
        ? EXIT.FOUND
        : EXIT.CLEAN;
  return { lines, code, counts };
}

/**
 * A breach, in the shape of a suggestion card — because a finding that
 * is only printed is a finding that dies with its terminal. The card
 * carries the four things criterion 1 names (metric, reading, band,
 * derivation) and a `Health band:` line, which is what makes filing
 * IDEMPOTENT: the same breach at the next checkpoint finds its own card
 * on the board and does not file a second one.
 *
 * @param {BandResult} result
 * @param {{ id: string, ref: string, when: string }} stamp
 * @returns {{ slug: string, title: string, body: string }}
 */
export function findingCard(result, stamp) {
  const b = result.band;
  const value = fmt(result.reading?.value ?? 0);
  const title =
    `The health band ${b.id} is breached at ${value} ${b.unit} — ` +
    `${b.metric}, against a breach line of ${fmt(b.breach ?? 0)}`;
  // The title is interpolated from band fields, and an unquoted YAML
  // plain scalar makes the WRITER the parse hazard: a ": " in a metric
  // turns the line into a nested map, a " #" truncates it to a comment
  // (T-156's verdict, measured both ways). A double-quoted scalar with
  // backslash and quote escaped carries any printable title; control
  // characters cannot reach here — the token scan reds them tree-wide.
  const yamlTitle = `"${title.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  const slug = b.id
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  const body = [
    "---",
    `id: ${stamp.id}`,
    `title: ${yamlTitle}`,
    "status: suggested",
    "suggested_by: health-bands (tools/e2e/scripts/health-bands.mjs)",
    "blocked_by: []",
    "---",
    "",
    `Health band: ${b.id}`,
    "",
    `Filed automatically at \`${stamp.ref}\`, ${stamp.when}. NO TIER OF THIS`,
    "SCRIPT ACTS ON ANYTHING — this card is the whole action, and the board",
    "decides what it is worth. If the band is wrong, TRIAGE tunes it:",
    "`tools/e2e/scripts/health-bands.config.mjs` names the loop, and a",
    "dismissal is the evidence that moves a limit.",
    "",
    `- **metric** — ${b.metric}`,
    `- **reading** — ${value} ${b.unit}`,
    `- **band** — drift at ${fmt(b.drift ?? 0)}, breach at ${fmt(b.breach ?? 0)}; healthy is ${b.healthy}`,
    `- **derivation** — ${result.reading?.derivation ?? "-"}`,
    `- **authority** — ${b.authority.name}`,
    "",
    "## Why this band is where it is",
    "",
    `Set at ${b.measured.at}: ${b.measured.reason}`,
    "",
  ].join("\n");
  return { slug, title, body };
}

/**
 * The next free `T-156-sN` id, derived from the tree rather than
 * counted: suggestion ids are permanent and the board keeps rejected
 * ones under docs/tasks/rejected/, so a count would reuse an id the
 * moment triage moved one.
 *
 * @param {string[]} existingPaths
 * @param {string} [parent]
 * @returns {string}
 */
export function nextSuggestionId(existingPaths, parent = "T-156") {
  let max = 0;
  const re = new RegExp(`${parent}-s(\\d+)`);
  for (const p of existingPaths) {
    const m = re.exec(p);
    if (m !== null) max = Math.max(max, Number(m[1]));
  }
  return `${parent}-s${max + 1}`;
}
