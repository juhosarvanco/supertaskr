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
import { existsSync, readFileSync, statSync } from "node:fs";
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

// ── THE LOOP'S OWN COST, PARSED OUT OF THE MERGES' READINGS (T-297) ──

/**
 * ADR-024 decision 1's budgets, per tier, in as many words: "Budgets:
 * 20 min/80K, 75 min/310K, 100 min/450K", against the three tiers it
 * names in the sentence before them.
 *
 * WHY THIS TABLE IS HERE AND NOT IN health-bands.config.mjs, which is
 * where every other limit in this reporter lives: that file's second
 * rule is that TRIAGE tunes it and the session that trips a band never
 * does. These three pairs are not a band's limits — they are a ratified
 * decision the owner made in docs/rooms/loop-cost-and-speed.md, and a
 * ratified number sitting in the file this project invites triage to
 * edit is a number that will one day be edited by triage. What the
 * config owns is the two bands' drift and breach lines, which are
 * stated as a SHARE of whichever budget the card's own tier names — so
 * the tunable part is tunable and the ruled part is quoted.
 *
 * A tier this table does not name has no budget, and a reading against
 * a budget that does not exist is not a reading: `cardMeters` leaves
 * the share null and says which tier it could not price.
 */
export const TIER_BUDGETS = Object.freeze({
  bounded: Object.freeze({ minutes: 20, tokens: 80000 }),
  standard: Object.freeze({ minutes: 75, tokens: 310000 }),
  guarded: Object.freeze({ minutes: 100, tokens: 450000 }),
});

/**
 * The readings the merge verb appends, one JSON object per seat per
 * merge (`readingsLines` in merge.mjs owns the write and carries the
 * shape). It lives under docs/checkpoints/ because it IS a record —
 * appended, never rewritten — and it is the ONE file in that directory
 * a program reads: ADR-019's Records clause forbids a suite, a gate or
 * a generator to depend on the directory's contents, and this reporter
 * is none of the three. docs/CONVENTIONS.md's HEALTH BANDS bullet
 * carries that reading in full, beside the sentence it is an exception
 * to.
 */
export const METERS_PATH = "docs/checkpoints/meters.jsonl";

/**
 * @typedef {object} MeterRecord
 * @property {string} at    ISO-8601, the moment the merge ran.
 * @property {number} atSec
 * @property {string} card
 * @property {string} size
 * @property {string} tier
 * @property {string} seat
 * @property {string} meters  The seat's own `## Meters` block, whole.
 * @property {string} [verdict]  The card's verdict outcome, when a capture states it.
 * @property {number} [ciReds]   CI reds attributed to this card, when a capture counts them.
 */

/**
 * THE READINGS FILE, PARSED, AND A BAD LINE IS NEVER A QUIET ONE.
 *
 * JSON Lines is chosen for the write because an append cannot corrupt
 * what is already there; the matching discipline on the read is that a
 * line this cannot understand becomes a PROBLEM rather than a skip. A
 * reader that silently drops the lines it does not like reports a
 * healthy loop out of the subset that happened to parse — which is the
 * same failure as a band reported as holding that was never read, one
 * layer down.
 *
 * @param {string} text
 * @returns {{ records: MeterRecord[], problems: string[] }}
 */
export function parseMeterRecords(text) {
  /** @type {MeterRecord[]} */
  const records = [];
  /** @type {string[]} */
  const problems = [];
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i += 1) {
    const line = (lines[i] ?? "").trim();
    if (line === "") continue;
    /** @type {unknown} */
    let parsed;
    try {
      parsed = JSON.parse(line);
    } catch {
      problems.push(`${METERS_PATH} line ${i + 1} is not JSON`);
      continue;
    }
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      problems.push(`${METERS_PATH} line ${i + 1} is not an object`);
      continue;
    }
    const o = /** @type {Record<string, unknown>} */ (parsed);
    const missing = ["at", "card", "size", "tier", "seat", "meters"].filter(
      (k) => typeof o[k] !== "string" || /** @type {string} */ (o[k]).trim() === "",
    );
    if (missing.length > 0) {
      problems.push(`${METERS_PATH} line ${i + 1} has no ${missing.join(", ")}`);
      continue;
    }
    const atSec = Date.parse(/** @type {string} */ (o["at"])) / 1000;
    if (!Number.isFinite(atSec)) {
      problems.push(`${METERS_PATH} line ${i + 1} has an unreadable at: ${String(o["at"])}`);
      continue;
    }
    /** @type {MeterRecord} */
    const rec = {
      at: /** @type {string} */ (o["at"]),
      atSec,
      card: /** @type {string} */ (o["card"]),
      size: /** @type {string} */ (o["size"]),
      tier: /** @type {string} */ (o["tier"]),
      seat: /** @type {string} */ (o["seat"]),
      meters: /** @type {string} */ (o["meters"]),
    };
    if (typeof o["verdict"] === "string") rec.verdict = o["verdict"];
    if (typeof o["ciReds"] === "number" && Number.isFinite(o["ciReds"])) rec.ciReds = o["ciReds"];
    records.push(rec);
  }
  return { records, problems };
}

/**
 * ONE SEAT'S TOKEN FIGURE, READ OFF ITS OWN PROSE, AND THE QUOTE COMES
 * WITH IT.
 *
 * A meters block is a seat's sentences, not a schema — merge.mjs says
 * so where it refuses to normalise them at write time — so this parse
 * is a reading of English and has to be auditable as one. The rule is
 * the narrowest that works: THE FIRST NUMBER THE WORD `tokens` IS
 * ATTACHED TO. That is what distinguishes the reading from the budget
 * it is stated against, which is the trap every one of the four blocks
 * on record lays: "about 319,000 tokens of the 15,000,000 budget",
 * "about 430K tokens (budget 15,000,000 at dispatch)", "about 320K
 * tokens of a 1M window" — in all three the larger number is the
 * window and only the smaller one is a reading. `K` and `M` are read
 * because two of the three blocks use them.
 *
 * The QUOTE is returned beside the value so the derivation can show the
 * words it read. A parse of prose that reports only its answer is one
 * nobody can check.
 *
 * @param {string} metersText
 * @returns {{ value: number, quote: string } | null}
 */
export function parseSeatTokens(metersText) {
  const m = /(\d[\d,]*(?:\.\d+)?)\s*([KM])?\s*tokens\b/i.exec(metersText);
  if (m === null) return null;
  const n = Number(/** @type {string} */ (m[1]).replace(/,/g, ""));
  if (!Number.isFinite(n)) return null;
  const suffix = (m[2] ?? "").toUpperCase();
  const value = suffix === "K" ? n * 1000 : suffix === "M" ? n * 1000000 : n;
  return { value, quote: /** @type {string} */ (m[0]).trim() };
}

/**
 * @typedef {object} CardMeter
 * @property {string} card
 * @property {string} size
 * @property {string} tier
 * @property {number} mergedSec
 * @property {number | null} minutes  dispatch stamp to the merge that appended the reading.
 * @property {number | null} tokens   summed over the card's seats.
 * @property {number | null} cycleShare  `minutes` as a % of the tier's budget.
 * @property {number | null} tokenShare  `tokens` as a % of the tier's budget.
 * @property {string[]} unreadable  why a share is null, one line each.
 * @property {string} quote  the seats' own token phrases, in seat order.
 */

/**
 * ONE ROW PER CARD, ASSEMBLED FROM ITS SEATS' LINES.
 *
 * ── WHY THE CYCLE COMES FROM THE TREE AND THE TOKENS FROM THE PROSE ──
 * They are different kinds of fact and the file already draws the line:
 * a token count belongs to a session and a quota and is stamped, never
 * re-derived; a commit time is a function of the tree and re-derives
 * exactly. So the cycle is measured between two commits — the card's
 * own `T-NNN: dispatch stamp` and the merge that appended the reading —
 * and the seats' wall-clock sentences are deliberately NOT summed into
 * it: an executor's hours and a verifier's minutes overlap their spawns
 * and their detached suites, and a sum of them is a number with no
 * referent. The tokens are summed because they genuinely add: two seats
 * spend two budgets against one card.
 *
 * ── AND WHERE CI GREEN WENT ──────────────────────────────────────────
 * The card asks for dispatch to CI GREEN and the tree ends at the
 * merge. The gap is the runner's own wall clock, which lives in an API
 * and not in a checkout, so this reading is a FLOOR and every
 * derivation it produces says the word. Closing it is a capture change
 * — a `ciGreenAt` on the reading — and it is filed rather than faked,
 * because a cycle that quietly stopped at the merge and called itself
 * dispatch-to-green would be a band reporting a number it never took.
 *
 * ── A SEAT THAT STATED NO TOKENS TAKES THE WHOLE CARD DARK ───────────
 * The sum of the seats that DID state one is a lower bound, and a lower
 * bound rendered as a share of a budget reads as a measurement while
 * being able to sit on either side of the line. So the card's token
 * share is null and the seat is named. That is the pressure that makes
 * the meter get written, and it fires today: T-296's executor block
 * states no token figure at all.
 *
 * @param {{ records: readonly MeterRecord[], dispatchedSec: (card: string) => number | null, budgets?: typeof TIER_BUDGETS }} opts
 * @returns {CardMeter[]} newest merge first
 */
export function cardMeters({ records, dispatchedSec, budgets = TIER_BUDGETS }) {
  /** @type {Map<string, MeterRecord[]>} */
  const byCard = new Map();
  for (const r of records) {
    const seats = byCard.get(r.card);
    if (seats === undefined) byCard.set(r.card, [r]);
    else seats.push(r);
  }

  /** @type {CardMeter[]} */
  const out = [];
  for (const [card, seats] of byCard) {
    const first = /** @type {MeterRecord} */ (seats[0]);
    const mergedSec = Math.max(...seats.map((s) => s.atSec));
    /** @type {string[]} */
    const unreadable = [];
    const budget = /** @type {{ minutes: number, tokens: number } | undefined} */ (
      /** @type {Record<string, unknown>} */ (budgets)[first.tier]
    );
    if (budget === undefined) {
      unreadable.push(`${card} is tier "${first.tier}", which ADR-024 decision 1 sets no budget for`);
    }

    const dispatched = dispatchedSec(card);
    if (dispatched === null) {
      unreadable.push(`${card} has no \`${card}: dispatch stamp\` commit reachable from HEAD`);
    }
    const minutes = dispatched === null ? null : (mergedSec - dispatched) / 60;

    /** @type {number | null} */
    let tokens = 0;
    /** @type {string[]} */
    const quotes = [];
    for (const s of seats) {
      const seen = parseSeatTokens(s.meters);
      if (seen === null) {
        unreadable.push(`${card}'s ${s.seat} block states no token figure`);
        tokens = null;
        continue;
      }
      quotes.push(`${s.seat} "${seen.quote}"`);
      if (tokens !== null) tokens += seen.value;
    }

    out.push({
      card,
      size: first.size,
      tier: first.tier,
      mergedSec,
      minutes,
      tokens,
      cycleShare: minutes === null || budget === undefined ? null : (minutes * 100) / budget.minutes,
      tokenShare: tokens === null || budget === undefined ? null : (tokens * 100) / budget.tokens,
      unreadable,
      quote: quotes.join(", "),
    });
  }
  return out.sort((a, b) => b.mergedSec - a.mergedSec);
}

/**
 * @typedef {object} TierWindow
 * @property {string} tier
 * @property {number} rejections  cards REJECTED in this window at this tier.
 * @property {number} ciReds      CI reds attributed to this window's cards at this tier.
 */

/**
 * THE SOFT-VERIFIER READING (acceptance criterion 3, ADR-024's own
 * Consequences: "a tier whose rejection rate falls to zero while CI
 * reds rise is read as a soft verifier").
 *
 * A verifier that stops rejecting is indistinguishable from a lane that
 * stopped needing rejection — from the inside, and on every number this
 * project keeps. The one thing that tells them apart is what CI does
 * afterwards: rejections going to zero WHILE reds rise is the shape of
 * a rubber stamp, and rejections going to zero while reds fall is the
 * shape of the loop working. So the flag is a two-point comparison per
 * tier across two windows, and it fires on the CONJUNCTION only —
 * either half alone is good news half the time.
 *
 * PURE, AND THAT IS THE POINT: the history it reads is planted by the
 * suite, because the shape this exists to catch has not happened yet
 * and a keeper nobody can drive is a keeper nobody has.
 *
 * @param {readonly TierWindow[]} earlier
 * @param {readonly TierWindow[]} later
 * @returns {{ tier: string, why: string }[]}
 */
export function softVerifierFlags(earlier, later) {
  /** @type {{ tier: string, why: string }[]} */
  const flags = [];
  for (const now of later) {
    const before = earlier.find((w) => w.tier === now.tier);
    if (before === undefined) continue;
    if (before.rejections > 0 && now.rejections === 0 && now.ciReds > before.ciReds) {
      flags.push({
        tier: now.tier,
        why:
          `${now.tier}: rejections ${before.rejections} -> 0 while CI reds ` +
          `${before.ciReds} -> ${now.ciReds}`,
      });
    }
  }
  return flags.sort((a, b) => a.tier.localeCompare(b.tier));
}

/**
 * A window's rejections and CI reds per tier, over the cards whose
 * readings state BOTH. A card stating one and not the other is not half
 * a data point — it is a card this comparison cannot use, and it is
 * named rather than dropped.
 *
 * The outcome vocabulary is the one the merge subjects already write:
 * APPROVED, APPROVED WITH ASSIGNED CORRECTIONS, REJECTED. It is read
 * here and RATIFIED nowhere — `north-star/rejection-rate-by-size` is
 * declared unkept for exactly that reason and routes the ratification
 * as T-156-s2 — so a value this does not recognise makes the card
 * unusable rather than quietly not-a-rejection.
 *
 * @param {readonly MeterRecord[]} records
 * @returns {{ windows: TierWindow[], unusable: string[] }}
 */
export function tierWindows(records) {
  /** @type {Map<string, { tier: string, verdict: string, ciReds: number }>} */
  const cards = new Map();
  /** @type {string[]} */
  const unusable = [];
  for (const r of records) {
    if (cards.has(r.card)) continue;
    if (r.verdict === undefined || r.ciReds === undefined) {
      unusable.push(`${r.card} states no ${r.verdict === undefined ? "verdict" : "ciReds"}`);
      continue;
    }
    const outcome = r.verdict.trim().toUpperCase();
    if (!outcome.startsWith("APPROVED") && outcome !== "REJECTED") {
      unusable.push(`${r.card}'s verdict "${r.verdict}" is not an outcome this reads`);
      continue;
    }
    cards.set(r.card, { tier: r.tier, verdict: outcome, ciReds: r.ciReds });
  }
  /** @type {Map<string, TierWindow>} */
  const byTier = new Map();
  for (const c of cards.values()) {
    const w = byTier.get(c.tier) ?? { tier: c.tier, rejections: 0, ciReds: 0 };
    if (c.verdict === "REJECTED") w.rejections += 1;
    w.ciReds += c.ciReds;
    byTier.set(c.tier, w);
  }
  return { windows: [...byTier.values()].sort((a, b) => a.tier.localeCompare(b.tier)), unusable };
}

/**
 * The three loop readings, keyed by band id. ABSENT is the answer
 * whenever the window cannot be priced whole — the band then reads
 * UNREAD, which costs the run exit 3, which is the house meaning of
 * "this run is not a claim about the tree".
 *
 * THE WINDOW IS THE CHECKPOINT'S, the same one
 * `triage/net-arrivals-per-window` uses, because a checkpoint is when
 * the loop is actually looked at and because an append-only file would
 * otherwise hold its worst card forever: a lane that overran once in
 * August would keep the band breached in December, and a band that can
 * never recover is a band that gets filtered. An EMPTY window has no
 * worst card, so it reads UNREAD rather than 0 — the difference from
 * `triage/oldest-suggestion-days`, whose empty set has a defined
 * maximum age of zero and says so.
 *
 * @param {{ cards: readonly CardMeter[], sinceSec: number | null, earlier?: readonly MeterRecord[] | undefined, later?: readonly MeterRecord[] | undefined, since?: string | undefined }} opts
 * @returns {Map<string, Reading>}
 */
export function loopReadings({ cards, sinceSec, earlier, later, since = "the newest Checkpoint: commit" }) {
  /** @type {Map<string, Reading>} */
  const out = new Map();
  const window = sinceSec === null ? [...cards] : cards.filter((c) => c.mergedSec >= sinceSec);

  /** @param {"cycle" | "token"} which @returns {Reading | null} */
  const budgetReading = (which) => {
    if (window.length === 0) return null;
    const shares = window.map((c) => (which === "cycle" ? c.cycleShare : c.tokenShare));
    if (shares.some((s) => s === null)) return null;
    const worst = window.reduce((acc, c) =>
      /** @type {number} */ (which === "cycle" ? c.cycleShare : c.tokenShare) >
      /** @type {number} */ (which === "cycle" ? acc.cycleShare : acc.tokenShare)
        ? c
        : acc,
    );
    const share = /** @type {number} */ (which === "cycle" ? worst.cycleShare : worst.tokenShare);
    const each = window
      .map((c) =>
        which === "cycle"
          ? `${c.card} (size ${c.size}, ${c.tier}) ${fmt(/** @type {number} */ (c.minutes))} min = ${fmt(/** @type {number} */ (c.cycleShare))}%`
          : `${c.card} (size ${c.size}, ${c.tier}) ${fmt(/** @type {number} */ (c.tokens))} tokens = ${fmt(/** @type {number} */ (c.tokenShare))}%`,
      )
      .join("; ");
    return {
      value: share,
      derivation:
        `${METERS_PATH}, ${window.length} card(s) merged since ${since} — ${each}. ` +
        `The worst is ${worst.card} at ${fmt(share)}% of the ${worst.tier} tier's budget ` +
        (which === "cycle"
          ? "(ADR-024 decision 1). The cycle is its `dispatch stamp` commit to the merge that " +
            "appended the reading, and it is a FLOOR: CI green is not in the tree"
          : `(ADR-024 decision 1), summed over its seats: ${worst.quote}`),
    };
  };

  const cycle = budgetReading("cycle");
  if (cycle !== null) out.set("loop/cycle-budget-used", cycle);
  const token = budgetReading("token");
  if (token !== null) out.set("loop/token-budget-used", token);

  if (earlier !== undefined && later !== undefined) {
    const before = tierWindows(earlier);
    const now = tierWindows(later);
    if (before.windows.length > 0 && now.windows.length > 0) {
      const flags = softVerifierFlags(before.windows, now.windows);
      out.set("loop/soft-verifier", {
        value: flags.length,
        derivation:
          flags.length === 0
            ? `${METERS_PATH}: no tier's rejections fell to zero while its CI reds rose, over ` +
              `${before.windows.length} tier(s) in the earlier window and ${now.windows.length} in this one`
            : flags.map((f) => f.why).join("; "),
      });
    }
  }

  return out;
}

/**
 * The newest `Checkpoint:` commits reachable from HEAD, newest first.
 *
 * @param {number} count
 * @param {string} [root]
 * @returns {{ hash: string, sec: number }[]}
 */
export function recentCheckpoints(count, root = repoRoot) {
  const raw = git(["log", `-${count}`, "--grep=^Checkpoint:", "--format=%H%x00%ct", "HEAD"], root).trim();
  if (raw === "") return [];
  return raw
    .split("\n")
    .map((line) => line.split("\0"))
    .filter((parts) => parts.length === 2)
    .map(([hash, sec]) => ({ hash: /** @type {string} */ (hash), sec: Number(sec) }));
}

/**
 * The card's own dispatch-stamp commit time, or null. The NEWEST such
 * commit is taken: a card re-stamped seconds later (T-294 carries two)
 * was corrected rather than re-dispatched, and the correction is the
 * stamp the lane actually started from.
 *
 * @param {string} card
 * @param {string} [root]
 * @returns {number | null}
 */
export function dispatchStampSec(card, root = repoRoot) {
  const raw = git(["log", "-1", "--format=%ct", `--grep=^${card}: dispatch stamp`, "HEAD"], root).trim();
  return raw === "" ? null : Number(raw);
}

/**
 * The readings file at this ref, or nothing. An absent file is not an
 * error: a project adopting this method has no merges yet, and the
 * bands read UNREAD until it does.
 *
 * @param {string} [root]
 * @returns {{ records: MeterRecord[], problems: string[] }}
 */
export function metersFromTree(root = repoRoot) {
  const abs = path.join(root, METERS_PATH);
  if (!existsSync(abs)) return { records: [], problems: [] };
  return parseMeterRecords(readFileSync(abs, "utf8"));
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

  // THE LOOP'S OWN BANDS (T-297). The readings are cut to the two
  // newest checkpoint windows BEFORE the cards are assembled, because
  // assembling one costs a `git log` per card and the readings file is
  // append-only: pricing every merge this project has ever made, at
  // every run, to report on the two windows that are compared would be
  // a reporter whose cost grows with the record it reads.
  const { records } = metersFromTree(root);
  const checkpoints = recentCheckpoints(2, root);
  const current = checkpoints[0] ?? null;
  const previous = checkpoints[1] ?? null;
  /** @param {number | null} from @param {number | null} to */
  const between = (from, to) =>
    records.filter((r) => (from === null || r.atSec >= from) && (to === null || r.atSec < to));
  const considered = previous === null ? records : between(previous.sec, null);
  for (const [id, reading] of loopReadings({
    cards: cardMeters({ records: considered, dispatchedSec: (card) => dispatchStampSec(card, root) }),
    sinceSec: current === null ? null : current.sec,
    earlier: previous === null || current === null ? undefined : between(previous.sec, current.sec),
    later: current === null ? undefined : between(current.sec, null),
    since: current === null ? "the first reading on record" : `Checkpoint: ${current.hash.slice(0, 7)}`,
  })) {
    out.set(id, reading);
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
